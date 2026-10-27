import { count, desc, eq, getTableColumns, gt, sql } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { createResetLink, h, parse, sentKeys } from "./auth";
import { newId } from "../db";
import { mailEnabled, sendMail } from "../mailer";

// Platform administration: users, usage, platform-wide activity, feedback and branding.
const r = Router();
const requireAdmin = (req: Request, res: Response, next: NextFunction) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Administrators only." }));

r.get("/admin/overview", requireAdmin, h(async (_req, res) => {
  const week = new Date(Date.now() - 7 * 864e5);
  const one = async (q: Promise<{ n: number }[]>) => Number((await q)[0]?.n ?? 0);
  res.json({
    users: await one(db.select({ n: count() }).from(schema.users)),
    activeUsers: await one(db.select({ n: count() }).from(schema.users).where(gt(schema.users.lastLoginAt, week))),
    projects: await one(db.select({ n: count() }).from(schema.projects)),
    documents: await one(db.select({ n: count() }).from(schema.documents)),
    files: await one(db.select({ n: count() }).from(schema.files)),
    issues: await one(db.select({ n: count() }).from(schema.issues)),
    newFeedback: await one(db.select({ n: count() }).from(schema.feedback).where(eq(schema.feedback.status, "New"))),
  });
}));

r.get("/admin/mail", requireAdmin, (_req, res) => res.json({ enabled: mailEnabled(), host: process.env.SMTP_HOST ?? "", from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "" }));
r.post("/admin/mail/test", requireAdmin, h(async (req, res) => {
  if (!mailEnabled()) return res.status(400).json({ error: "SMTP is not configured (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)." });
  const ok = await sendMail(req.user!.email, "Portal test email", ["This is a test email from your BIM Management portal. Email delivery works."]);
  res.status(ok ? 200 : 502).json(ok ? { ok } : { error: "Sending failed — check the server log and SMTP settings." });
}));

r.get("/admin/users", requireAdmin, h(async (_req, res) => {
  const users = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, organization: schema.users.organization, role: schema.users.role, disabled: schema.users.disabled, createdAt: schema.users.createdAt, lastLoginAt: schema.users.lastLoginAt }).from(schema.users).orderBy(desc(schema.users.createdAt));
  const memberships = await db.select({ userId: schema.projectMembers.userId, n: count() }).from(schema.projectMembers).groupBy(schema.projectMembers.userId);
  const m = new Map(memberships.map((x) => [x.userId, Number(x.n)]));
  const subs = new Map((await db.select().from(schema.subscriptions)).map((s) => [s.userId, s]));
  res.json({ users: users.map((u) => ({ ...u, disabled: !!u.disabled, projects: m.get(u.id) ?? 0, plan: subs.get(u.id)?.plan ?? "free", renewsAt: subs.get(u.id)?.renewsAt ?? null })) });
}));

r.put("/admin/users/:id", requireAdmin, h(async (req, res) => {
  const parsed = parse(z.object({ role: z.enum(["user", "recruiter", "admin"]), disabled: z.boolean() }).partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  if (!Object.keys(body).length) return res.status(400).json({ error: "Nothing to change." });
  if (req.params.id === req.user!.id && (body.role && body.role !== "admin" || body.disabled)) return res.status(400).json({ error: "You can't remove your own admin access or disable yourself." });
  await db.update(schema.users).set({ ...(body.role ? { role: body.role } : {}), ...(body.disabled !== undefined ? { disabled: body.disabled ? 1 : 0 } : {}) }).where(eq(schema.users.id, req.params.id));
  if (body.disabled) await db.delete(schema.sessions).where(eq(schema.sessions.userId, req.params.id));
  console.log(`[admin] ${req.user!.email} updated user ${req.params.id}: ${JSON.stringify(body)}`);
  res.json({ ok: true });
}));

r.post("/admin/users/:id/reset-link", requireAdmin, h(async (req, res) => {
  const [u] = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users).where(eq(schema.users.id, req.params.id));
  if (!u) return res.status(404).json({ error: "User not found." });
  const link = await createResetLink(u.id, process.env.PUBLIC_URL?.replace(/\/$/, "") || `${req.protocol}://${req.get("host")}`);
  console.log(`[admin] ${req.user!.email} issued a password reset link for ${u.email}`);
  res.json({ link, expiresInMinutes: 60 });
}));

r.get("/admin/activity", requireAdmin, h(async (_req, res) => {
  const rows = await db.select({ a: schema.activity, user: schema.users.name, project: schema.projects.code }).from(schema.activity)
    .leftJoin(schema.users, eq(schema.users.id, schema.activity.userId)).leftJoin(schema.projects, eq(schema.projects.id, schema.activity.projectId))
    .orderBy(desc(schema.activity.createdAt)).limit(200);
  res.json({ activity: rows.map((x) => ({ ...x.a, user: x.user, project: x.project })) });
}));

// screenshots are kept out of list responses; they are fetched one at a time
const { screenshot: _shot, ...feedbackCols } = getTableColumns(schema.feedback);
const listCols = { ...feedbackCols, hasScreenshot: sql<number>`${schema.feedback.screenshot} IS NOT NULL` };

r.get("/admin/feedback", requireAdmin, h(async (_req, res) => {
  const rows = await db.select({ ...listCols, name: schema.users.name, email: schema.users.email }).from(schema.feedback).leftJoin(schema.users, eq(schema.users.id, schema.feedback.userId)).orderBy(desc(schema.feedback.createdAt)).limit(300);
  res.json({ feedback: rows.map((x) => ({ ...x, hasScreenshot: !!Number(x.hasScreenshot) })) });
}));

r.put("/admin/feedback/:id", requireAdmin, h(async (req, res) => {
  const parsed = parse(z.object({ status: z.enum(["New", "In progress", "Done", "Won't fix"]), reply: z.string().trim().max(4000) }).partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  if (!Object.keys(body).length) return res.status(400).json({ error: "Nothing to change." });
  const [f] = await db.select({ userId: schema.feedback.userId, kind: schema.feedback.kind }).from(schema.feedback).where(eq(schema.feedback.id, req.params.id));
  if (!f) return res.status(404).json({ error: "Feedback not found." });
  await db.update(schema.feedback).set({ ...body, ...(body.reply ? { repliedAt: new Date() } : {}) }).where(eq(schema.feedback.id, req.params.id));
  if (body.reply) await db.insert(schema.notifications).values({ id: newId(), userId: f.userId, projectId: null, message: `Support replied to your ${f.kind.toLowerCase()}: ${body.reply}`.slice(0, 500), link: "/support", createdAt: new Date() });
  res.json({ ok: true });
}));

// ---------- feedback and support requests from any user ----------
r.post("/feedback", h(async (req, res) => {
  const body = parse(z.object({
    kind: z.enum(["Idea", "Problem", "Question"]), message: z.string().trim().min(5).max(4000), page: z.string().max(255).default(""),
    screenshot: z.string().max(4_000_000).regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/, "PNG or JPEG only").optional(),
  }), req.body, res); if (!body) return;
  const id = newId();
  await db.insert(schema.feedback).values({ ...body, screenshot: body.screenshot ?? null, id, userId: req.user!.id, createdAt: new Date() });
  res.status(201).json({ ok: true, id });
}));

r.get("/feedback/mine", h(async (req, res) => {
  const rows = await db.select(listCols).from(schema.feedback).where(eq(schema.feedback.userId, req.user!.id)).orderBy(desc(schema.feedback.createdAt)).limit(100);
  res.json({ feedback: rows.map((x) => ({ ...x, hasScreenshot: !!Number(x.hasScreenshot) })) });
}));

r.get("/feedback/:id/screenshot", h(async (req, res) => {
  const [f] = await db.select({ userId: schema.feedback.userId, screenshot: schema.feedback.screenshot }).from(schema.feedback).where(eq(schema.feedback.id, req.params.id));
  if (!f || (f.userId !== req.user!.id && req.user!.role !== "admin") || !f.screenshot) return res.status(404).json({ error: "Screenshot not found." });
  const m = /^data:(image\/(?:png|jpeg));base64,(.+)$/.exec(f.screenshot)!;
  res.setHeader("Content-Type", m[1]); res.setHeader("Cache-Control", "private, max-age=3600");
  res.send(Buffer.from(m[2], "base64"));
}));

// ---------- organisation branding (used on Word exports and the top bar) ----------
const brandingSchema = z.object({ orgName: z.string().trim().max(120).default(""), color: z.string().regex(/^#?[0-9a-fA-F]{6}$/).default("#1E3A5F"), logo: z.string().max(300_000).regex(/^(data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+)?$/, "PNG or JPEG only").default(""), footer: z.string().max(200).default("") });
r.get("/settings/branding", h(async (_req, res) => {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "branding"));
  res.json({ branding: brandingSchema.parse(row?.value ?? {}) });
}));
r.put("/settings/branding", requireAdmin, h(async (req, res) => {
  const body = parse(brandingSchema, req.body, res); if (!body) return;
  await db.insert(schema.settings).values({ key: "branding", value: body }).onDuplicateKeyUpdate({ set: { value: sql`VALUES(value)` } });
  res.json({ ok: true });
}));

export default r;
