import { AiError } from "../claude";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { logActivity } from "../access";
import { checkPassword, endSession, hashPassword, requireUser, startSession, toPublic } from "../auth";
import { db, newId, schema } from "../db";

export const h = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch((e) => {
  // AI failures carry their own status; unreadable model JSON is a bad gateway, not a server bug
  if (e instanceof AiError) return res.status(e.status).json({ error: e.message });
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
  await acceptInvitations(u.id, u.email);
  await startSession(res, u.id);
  res.json({ user: toPublic(u) });
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
