import { AiError } from "../claude";
import { LimitError } from "../billing";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { logActivity } from "../access";
import { mailEnabled, sendMail } from "../mailer";
import { checkPassword, endSession, hashPassword, requireUser, startSession, toPublic } from "../auth";
import { db, newId, schema } from "../db";

export const h = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch((e) => {
  // AI failures carry their own status; unreadable model JSON is a bad gateway, not a server bug
  if (e instanceof AiError) return res.status(e.status).json({ error: e.message });
  if (e instanceof LimitError) return res.status(402).json({ error: e.message });
  next(e);
});

export function parse<T extends z.ZodType>(s: T, data: unknown, res: Response): z.infer<T> | undefined {
  const r = s.safeParse(data);
  if (!r.success) { res.status(400).json({ error: r.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ") }); return; }
  return r.data;
}

/** For partial updates: zod applies .default() even inside .partial(), so keep only keys the client actually sent. */
export function sentKeys<T extends object>(parsed: T, raw: unknown): Partial<T> {
  const keys = new Set(raw && typeof raw === "object" ? Object.keys(raw) : []);
  return Object.fromEntries(Object.entries(parsed).filter(([k]) => keys.has(k))) as Partial<T>;
}

const r = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(200),
  organization: z.string().trim().max(160).default(""),
  jobTitle: z.string().trim().max(120).default(""),
});

/** Turn any pending invitations for this email into memberships. */
async function acceptInvitations(userId: string, email: string) {
  const pending = await db.select().from(schema.invitations).where(and(eq(schema.invitations.email, email), isNull(schema.invitations.acceptedAt)));
  for (const inv of pending) {
    await db.insert(schema.projectMembers).values({ projectId: inv.projectId, userId, role: inv.role, joinedAt: new Date() }).onDuplicateKeyUpdate({ set: { role: inv.role } });
    await db.update(schema.invitations).set({ acceptedAt: new Date() }).where(eq(schema.invitations.id, inv.id));
    await logActivity(inv.projectId, userId, "member.joined", `${email} joined the project as ${inv.role}`);
  }
}

r.post("/auth/register", h(async (req, res) => {
  const body = parse(registerSchema, req.body, res); if (!body) return;
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, body.email));
  if (existing) return res.status(409).json({ error: "An account with this email already exists." });
  const id = newId();
  // The first account on a fresh install becomes the platform admin.
  const [anyUser] = await db.select({ id: schema.users.id }).from(schema.users).limit(1);
  await db.insert(schema.users).values({
    id, email: body.email, name: body.name, organization: body.organization, jobTitle: body.jobTitle,
    passwordHash: await hashPassword(body.password), role: anyUser ? "user" : "admin", createdAt: new Date(),
  });
  await acceptInvitations(id, body.email);
  await startSession(res, id);
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  res.status(201).json({ user: toPublic(u) });
}));

r.post("/auth/login", h(async (req, res) => {
  const body = parse(z.object({ email: z.string().trim().toLowerCase(), password: z.string() }), req.body, res); if (!body) return;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, body.email));
  if (!u || !(await checkPassword(body.password, u.passwordHash))) return res.status(401).json({ error: "Incorrect email or password." });
  if (u.disabled) return res.status(403).json({ error: "This account is disabled. Contact your administrator." });
  await acceptInvitations(u.id, u.email);
  await startSession(res, u.id);
  res.json({ user: toPublic(u) });
}));

// ---------- password reset (one-time link, valid 1 hour) ----------
const sha = (t: string) => crypto.createHash("sha256").update(t).digest("hex");
export async function createResetLink(userId: string, origin: string) {
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(schema.passwordResets).values({ id: newId(), userId, tokenHash: sha(token), expiresAt: new Date(Date.now() + 3600_000), createdAt: new Date() });
  return `${origin}/#/reset/${token}`;
}
const forgotHits = new Map<string, number[]>();
r.post("/auth/forgot", h(async (req, res) => {
  const body = parse(z.object({ email: z.string().trim().toLowerCase().email() }), req.body, res); if (!body) return;
  const key = `${req.ip}|${body.email}`; const now = Date.now();
  const hits = (forgotHits.get(key) ?? []).filter((t) => now - t < 3600_000);
  if (hits.length >= 5) return res.status(429).json({ error: "Too many requests. Try again later." });
  forgotHits.set(key, [...hits, now]);
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, body.email));
  if (u && !u.disabled) {
    const link = await createResetLink(u.id, process.env.PUBLIC_URL?.replace(/\/$/, "") || `${req.protocol}://${req.get("host")}`);
    // With SMTP configured the link is emailed; otherwise it goes to the server log and admins can issue links from the console.
    const sent = await sendMail(u.email, "Reset your portal password", [`Hello ${u.name},`, "Someone (hopefully you) asked to reset your password. The link below works once and expires in one hour.", "If you didn't ask for this, ignore this email."], { label: "Choose a new password", url: link });
    if (!sent) console.log(`[password reset] ${u.email}: ${link}`);
    await db.insert(schema.notifications).values({ id: newId(), userId: u.id, projectId: null, message: "A password reset was requested for your account. If this wasn't you, contact your administrator.", link: "/profile", read: false, createdAt: new Date() }).catch(() => undefined);
  }
  // same answer whether or not the account exists
  res.json({ ok: true, message: mailEnabled() ? "If an account exists for that email, we've sent a reset link." : "If an account exists for that email, your administrator can send you the reset link." });
}));

r.post("/auth/reset", h(async (req, res) => {
  const body = parse(z.object({ token: z.string().regex(/^[0-9a-f]{64}$/), password: z.string().min(8).max(200) }), req.body, res); if (!body) return;
  const [row] = await db.select().from(schema.passwordResets).where(eq(schema.passwordResets.tokenHash, sha(body.token)));
  if (!row || row.usedAt || row.expiresAt < new Date()) return res.status(400).json({ error: "This reset link is invalid or has expired." });
  await db.update(schema.users).set({ passwordHash: await hashPassword(body.password) }).where(eq(schema.users.id, row.userId));
  await db.update(schema.passwordResets).set({ usedAt: new Date() }).where(eq(schema.passwordResets.id, row.id));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, row.userId)); // sign out everywhere
  res.json({ ok: true });
}));

r.post("/auth/logout", h(async (req, res) => { await endSession(req, res); res.json({ ok: true }); }));

r.get("/auth/me", (req, res) => res.json({ user: req.user ?? null }));

r.put("/profile", requireUser, h(async (req, res) => {
  const body = parse(z.object({
    name: z.string().trim().min(2).max(120),
    organization: z.string().trim().max(160),
    jobTitle: z.string().trim().max(120),
    phone: z.string().trim().max(40),
    bio: z.string().max(2000),
    bimRole: z.string().regex(/^[a-z-]{2,32}$/).nullable(),
    favourites: z.array(z.string().max(120)).max(60),
    emailPref: z.enum(["instant", "digest", "off"]),
    locale: z.enum(["en", "ar"]),
  }).partial(), req.body, res); if (!body) return;
  await db.update(schema.users).set(body).where(eq(schema.users.id, req.user!.id));
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, req.user!.id));
  res.json({ user: toPublic(u) });
}));

r.put("/profile/password", requireUser, h(async (req, res) => {
  const body = parse(z.object({ current: z.string(), next: z.string().min(8).max(200) }), req.body, res); if (!body) return;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, req.user!.id));
  if (!(await checkPassword(body.current, u.passwordHash))) return res.status(400).json({ error: "Current password is incorrect." });
  await db.update(schema.users).set({ passwordHash: await hashPassword(body.next) }).where(eq(schema.users.id, u.id));
  res.json({ ok: true });
}));

r.get("/notifications", requireUser, h(async (req, res) => {
  const rows = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, req.user!.id)).orderBy(desc(schema.notifications.createdAt)).limit(50);
  res.json({ notifications: rows });
}));

r.post("/notifications/read", requireUser, h(async (req, res) => {
  const ids = z.array(z.string()).max(200).safeParse(req.body?.ids).data;
  const mine = eq(schema.notifications.userId, req.user!.id);
  await db.update(schema.notifications).set({ read: true }).where(ids?.length ? and(mine, inArray(schema.notifications.id, ids)) : mine);
  res.json({ ok: true });
}));

export default r;
