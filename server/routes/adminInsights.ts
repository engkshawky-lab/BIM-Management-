import { and, count, desc, eq, gt, max, sql } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { db, newId, schema } from "../db";
import { setting } from "../appSettings";
import { publicUrl, sendMail } from "../mailer";
import { planConfig } from "../planConfig";
import { h, parse, sentKeys } from "./auth";

// Admin reports and queues: statistics, AI usage, learning progress and leaderboard, subscriptions, signed-in
// sessions, accounts waiting for approval, and enquiries from the public "Talk to us" form (leads).
const r = Router();
const requireAdmin = (req: Request, res: Response, next: NextFunction) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Administrators only." }));
const WEEK = 7 * 864e5;

/** Counts per week for the last `weeks` weeks, oldest first; labels are the Monday of each week (YYYY-MM-DD). */
export function weekly(dates: (Date | null)[], weeks = 12, now = Date.now()) {
  const day = new Date(now); day.setUTCHours(0, 0, 0, 0);
  const monday = day.getTime() - ((day.getUTCDay() + 6) % 7) * 864e5;
  const start = monday - (weeks - 1) * WEEK;
  const out = Array.from({ length: weeks }, (_, i) => ({ week: new Date(start + i * WEEK).toISOString().slice(0, 10), n: 0 }));
  for (const d of dates) {
    const t = d?.getTime(); if (t === undefined || t < start) continue;
    const i = Math.floor((t - start) / WEEK); if (i < weeks) out[i].n++;
  }
  return out;
}

r.get("/admin/stats", requireAdmin, h(async (_req, res) => {
  const now = Date.now();
  const since = new Date(now - 12 * WEEK);
  const users = await db.select({ createdAt: schema.users.createdAt, lastLoginAt: schema.users.lastLoginAt, disabled: schema.users.disabled }).from(schema.users);
  const live = users.filter((u) => u.disabled !== 1);
  const active = (days: number) => live.filter((u) => u.lastLoginAt && now - u.lastLoginAt.getTime() < days * 864e5).length;
  const projects = await db.select({ createdAt: schema.projects.createdAt }).from(schema.projects).where(gt(schema.projects.createdAt, since));
  const lessons = await db.select({ at: schema.lessonProgress.completedAt }).from(schema.lessonProgress).where(gt(schema.lessonProgress.completedAt, since));
  const quizzes = await db.select({ at: schema.quizAttempts.createdAt, score: schema.quizAttempts.score, total: schema.quizAttempts.total }).from(schema.quizAttempts).where(gt(schema.quizAttempts.createdAt, since));
  const ai = await db.select({ month: schema.aiUsage.month, n: sql<number>`sum(${schema.aiUsage.count})`, users: count() }).from(schema.aiUsage).groupBy(schema.aiUsage.month).orderBy(desc(schema.aiUsage.month)).limit(12);
  const subs = await db.select().from(schema.subscriptions);
  const paid = subs.filter((s) => s.plan !== "free" && s.status === "active" && (!s.renewsAt || s.renewsAt.getTime() > now));
  const plans = (await planConfig()).plans;
  const yearly = paid.reduce((sum, s) => sum + (plans.find((p) => p.id === (s.plan === "enterprise" ? "expert" : s.plan))?.price.amount ?? 0), 0);
  res.json({
    totals: { users: live.length, pending: users.filter((u) => u.disabled === 2).length, active1: active(1), active7: active(7), active30: active(30), paid: paid.length, yearlyRevenue: yearly },
    signups: weekly(users.map((u) => u.createdAt)), projects: weekly(projects.map((p) => p.createdAt)), lessons: weekly(lessons.map((l) => l.at)),
    quizzes: weekly(quizzes.map((q) => q.at)), quizAverage: quizzes.length ? Math.round(100 * quizzes.reduce((a, q) => a + q.score / Math.max(1, q.total), 0) / quizzes.length) : null,
    aiByMonth: ai.reverse().map((m) => ({ month: m.month, requests: Number(m.n), users: Number(m.users) })),
    planMix: ["free", "starter", "pro", "expert"].map((id) => ({ plan: id, users: id === "free" ? live.length - paid.length : paid.filter((s) => (s.plan === "enterprise" ? "expert" : s.plan) === id).length })),
  });
}));

r.get("/admin/ai-usage", requireAdmin, h(async (req, res) => {
  const month = /^\d{4}-\d{2}$/.test(String(req.query.month)) ? String(req.query.month) : new Date().toISOString().slice(0, 7);
  const rows = await db.select({ userId: schema.aiUsage.userId, n: schema.aiUsage.count, name: schema.users.name, email: schema.users.email, plan: schema.subscriptions.plan })
    .from(schema.aiUsage).leftJoin(schema.users, eq(schema.users.id, schema.aiUsage.userId)).leftJoin(schema.subscriptions, eq(schema.subscriptions.userId, schema.aiUsage.userId))
    .where(eq(schema.aiUsage.month, month)).orderBy(desc(schema.aiUsage.count)).limit(500);
  const plans = (await planConfig()).plans;
  const months = (await db.selectDistinct({ m: schema.aiUsage.month }).from(schema.aiUsage).orderBy(desc(schema.aiUsage.month)).limit(24)).map((x) => x.m);
  res.json({
    month, months, billing: setting<boolean>("billing"), monthlyLimit: setting<number>("aiMonthlyLimit"), perMinute: setting<number>("aiPerMinute"),
    users: rows.map((x) => { const plan = x.plan === "enterprise" ? "expert" : x.plan ?? "free"; return { ...x, plan, limit: plans.find((p) => p.id === plan)?.aiPerMonth ?? null }; }),
  });
}));

/** Points for the leaderboard: 10 per lesson completed plus the best score in each quiz topic. */
export function learningRows(lessons: { userId: string; at: Date }[], quizzes: { userId: string; topic: string; score: number; total: number; at: Date }[]) {
  const by = new Map<string, { lessons: number; quizzes: number; pct: number[]; best: Map<string, number>; last: number }>();
  const get = (id: string) => by.get(id) ?? by.set(id, { lessons: 0, quizzes: 0, pct: [], best: new Map(), last: 0 }).get(id)!;
  for (const l of lessons) { const g = get(l.userId); g.lessons++; g.last = Math.max(g.last, l.at.getTime()); }
  for (const q of quizzes) {
    const g = get(q.userId); g.quizzes++; g.pct.push(q.score / Math.max(1, q.total)); g.last = Math.max(g.last, q.at.getTime());
    g.best.set(q.topic, Math.max(g.best.get(q.topic) ?? 0, q.score));
  }
  return [...by].map(([userId, g]) => ({
    userId, lessons: g.lessons, quizzes: g.quizzes, average: g.pct.length ? Math.round(100 * g.pct.reduce((a, b) => a + b, 0) / g.pct.length) : null,
    best: g.pct.length ? Math.round(100 * Math.max(...g.pct)) : null, points: g.lessons * 10 + [...g.best.values()].reduce((a, b) => a + b, 0), last: new Date(g.last).toISOString(),
  })).sort((a, b) => b.points - a.points);
}

r.get("/admin/learning", requireAdmin, h(async (_req, res) => {
  const lessons = await db.select({ userId: schema.lessonProgress.userId, at: schema.lessonProgress.completedAt }).from(schema.lessonProgress);
  const quizzes = await db.select({ userId: schema.quizAttempts.userId, topic: schema.quizAttempts.topic, score: schema.quizAttempts.score, total: schema.quizAttempts.total, at: schema.quizAttempts.createdAt }).from(schema.quizAttempts);
  const users = new Map((await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, organization: schema.users.organization }).from(schema.users)).map((u) => [u.id, u]));
  const courses = await db.select({ courseId: schema.lessonProgress.courseId, n: count() }).from(schema.lessonProgress).groupBy(schema.lessonProgress.courseId);
  res.json({ learners: learningRows(lessons, quizzes).map((row, i) => ({ rank: i + 1, ...row, ...users.get(row.userId) })), courses: courses.map((c) => ({ courseId: c.courseId, completions: Number(c.n) })) });
}));

r.get("/admin/subscriptions", requireAdmin, h(async (_req, res) => {
  const rows = await db.select({ s: schema.subscriptions, name: schema.users.name, email: schema.users.email }).from(schema.subscriptions).leftJoin(schema.users, eq(schema.users.id, schema.subscriptions.userId)).orderBy(desc(schema.subscriptions.updatedAt));
  res.json({ subscriptions: rows.map(({ s, name, email }) => ({ userId: s.userId, name, email, plan: s.plan === "enterprise" ? "expert" : s.plan, status: s.status, source: s.source, renewsAt: s.renewsAt, updatedAt: s.updatedAt, online: !!s.stripeSubscriptionId })) });
}));

r.get("/admin/sessions", requireAdmin, h(async (_req, res) => {
  const rows = await db.select({ userId: schema.sessions.userId, n: count(), latest: max(schema.sessions.createdAt), name: schema.users.name, email: schema.users.email, lastLoginAt: schema.users.lastLoginAt })
    .from(schema.sessions).innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId)).where(gt(schema.sessions.expiresAt, new Date()))
    .groupBy(schema.sessions.userId, schema.users.name, schema.users.email, schema.users.lastLoginAt).orderBy(desc(max(schema.sessions.createdAt)));
  const [expired] = await db.select({ n: count() }).from(schema.sessions).where(sql`${schema.sessions.expiresAt} <= now()`);
  res.json({ sessions: rows.map((x) => ({ ...x, n: Number(x.n) })), expired: Number(expired?.n ?? 0) });
}));
r.post("/admin/users/:id/signout", requireAdmin, h(async (req, res) => {
  if (req.params.id === req.user!.id) return res.status(400).json({ error: "Use Sign out for your own account." });
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, req.params.id));
  console.log(`[admin] ${req.user!.email} signed out user ${req.params.id} everywhere`);
  res.json({ ok: true });
}));
r.post("/admin/sessions/cleanup", requireAdmin, h(async (_req, res) => {
  await db.delete(schema.sessions).where(sql`${schema.sessions.expiresAt} <= now()`);
  res.json({ ok: true });
}));

r.get("/admin/pending", requireAdmin, h(async (_req, res) => {
  const users = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, organization: schema.users.organization, jobTitle: schema.users.jobTitle, createdAt: schema.users.createdAt, emailVerifiedAt: schema.users.emailVerifiedAt })
    .from(schema.users).where(eq(schema.users.disabled, 2)).orderBy(desc(schema.users.createdAt));
  res.json({ users });
}));
r.post("/admin/users/:id/approve", requireAdmin, h(async (req, res) => {
  const [u] = await db.select().from(schema.users).where(and(eq(schema.users.id, req.params.id), eq(schema.users.disabled, 2)));
  if (!u) return res.status(404).json({ error: "No account waiting for approval with that id." });
  await db.update(schema.users).set({ disabled: 0 }).where(eq(schema.users.id, u.id));
  const base = publicUrl(`${req.protocol}://${req.get("host")}`);
  await sendMail(u.email, "Your account is ready", [`Hello ${u.name},`, "An administrator has approved your account. You can sign in now."], { label: "Sign in", url: `${base}/login` });
  console.log(`[admin] ${req.user!.email} approved user ${u.id}`);
  res.json({ ok: true });
}));

// ---------- leads ----------
const leadSchema = z.object({
  name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email().max(255), company: z.string().trim().max(160).default(""),
  phone: z.string().trim().max(40).default(""), interest: z.enum(["", "starter", "pro", "expert", "team", "demo", "other"]).default(""),
  message: z.string().trim().max(4000).default(""), source: z.string().trim().max(120).default(""), website: z.string().max(200).default(""),
});
const leadHits = new Map<string, number[]>();
export const publicContact = Router();
publicContact.post("/public/contact", h(async (req, res) => {
  const body = parse(leadSchema, req.body, res); if (!body) return;
  if (body.website) return res.json({ ok: true }); // honeypot field: filled in only by bots
  const now = Date.now(); const key = req.ip ?? "";
  const hits = (leadHits.get(key) ?? []).filter((t) => now - t < 3600_000);
  if (hits.length >= 5) return res.status(429).json({ error: "Too many messages. Try again later or email us." });
  leadHits.set(key, [...hits, now]);
  const { website: _w, ...lead } = body;
  await db.insert(schema.leads).values({ id: newId(), ...lead, createdAt: new Date() });
  const to = setting<string>("contactEmail");
  if (to) await sendMail(to, `New enquiry from ${lead.name}`, [`${lead.name} <${lead.email}>${lead.company ? ` · ${lead.company}` : ""}${lead.phone ? ` · ${lead.phone}` : ""}`, ...(lead.interest ? [`Interested in: ${lead.interest}`] : []), lead.message || "(no message)"], { label: "Open leads", url: `${publicUrl(`${req.protocol}://${req.get("host")}`)}/#/admin/leads` });
  res.json({ ok: true });
}));

r.get("/admin/leads", requireAdmin, h(async (_req, res) => res.json({ leads: await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(1000) })));
r.put("/admin/leads/:id", requireAdmin, h(async (req, res) => {
  const parsed = parse(z.object({ status: z.enum(["New", "Contacted", "Qualified", "Won", "Lost"]), note: z.string().trim().max(2000) }).partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  if (!Object.keys(body).length) return res.status(400).json({ error: "Nothing to change." });
  await db.update(schema.leads).set(body).where(eq(schema.leads.id, req.params.id));
  res.json({ ok: true });
}));
r.delete("/admin/leads/:id", requireAdmin, h(async (req, res) => { await db.delete(schema.leads).where(eq(schema.leads.id, req.params.id)); res.json({ ok: true }); }));

export default r;
