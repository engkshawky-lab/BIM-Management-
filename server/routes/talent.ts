import { and, desc, eq, inArray } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { logActivity, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { h, parse } from "./auth";

const r = Router();

// ---------- talent pool (opt-in, consent-controlled) ----------
r.get("/talent/me", h(async (req, res) => {
  const [p] = await db.select().from(schema.talentProfiles).where(eq(schema.talentProfiles.userId, req.user!.id));
  const views = await db.select({ at: schema.talentViews.createdAt, name: schema.users.name, org: schema.users.organization }).from(schema.talentViews)
    .leftJoin(schema.users, eq(schema.users.id, schema.talentViews.recruiterId)).where(eq(schema.talentViews.userId, req.user!.id)).orderBy(desc(schema.talentViews.createdAt)).limit(30);
  res.json({ profile: p ?? null, views });
}));

r.put("/talent/me", h(async (req, res) => {
  const body = parse(z.object({
    visible: z.boolean(), showResults: z.boolean(), headline: z.string().trim().max(160).default(""),
    skills: z.array(z.string().trim().min(1).max(60)).max(30).default([]), certifications: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
    years: z.number().int().min(0).max(60).default(0), location: z.string().trim().max(120).default(""),
    availability: z.enum(["Not looking", "Open to offers", "Available now"]).default("Not looking"),
  }), req.body, res); if (!body) return;
  const row = { ...body, updatedAt: new Date() };
  await db.insert(schema.talentProfiles).values({ userId: req.user!.id, ...row }).onDuplicateKeyUpdate({ set: row });
  res.json({ ok: true });
}));

r.delete("/talent/me", h(async (req, res) => {
  await db.delete(schema.talentProfiles).where(eq(schema.talentProfiles.userId, req.user!.id));
  res.json({ ok: true });
}));

const requireRecruiter = (req: Request, res: Response, next: NextFunction) => (["recruiter", "admin"].includes(req.user?.role ?? "") ? next() : res.status(403).json({ error: "Talent search is available to recruiters. Ask an administrator for access." }));

async function bestResults(userIds: string[]) {
  if (!userIds.length) return new Map<string, { exam: number | null; topics: Record<string, number> }>();
  const rows = await db.select().from(schema.quizAttempts).where(inArray(schema.quizAttempts.userId, userIds));
  const out = new Map<string, { exam: number | null; topics: Record<string, number> }>();
  for (const id of userIds) {
    const mine = rows.filter((x) => x.userId === id);
    const exams = mine.filter((x) => x.mode === "exam").map((x) => Math.round((x.score / x.total) * 100));
    const topics: Record<string, [number, number]> = {};
    for (const x of mine) for (const [t, [c, n]] of Object.entries(x.byTopic)) { const p = (topics[t] ??= [0, 0]); p[0] += c; p[1] += n; }
    out.set(id, { exam: exams.length ? Math.max(...exams) : null, topics: Object.fromEntries(Object.entries(topics).map(([t, [c, n]]) => [t, Math.round((c / n) * 100)])) });
  }
  return out;
}

r.get("/talent/search", requireRecruiter, h(async (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase().trim();
  const avail = String(req.query.availability ?? "");
  const rows = await db.select({ p: schema.talentProfiles, name: schema.users.name, org: schema.users.organization, title: schema.users.jobTitle, disabled: schema.users.disabled })
    .from(schema.talentProfiles).innerJoin(schema.users, eq(schema.users.id, schema.talentProfiles.userId)).where(eq(schema.talentProfiles.visible, true));
  const list = rows.filter((x) => !x.disabled && (!avail || x.p.availability === avail) && (!q || `${x.name} ${x.title} ${x.p.headline} ${x.p.skills.join(" ")} ${x.p.certifications.join(" ")} ${x.p.location}`.toLowerCase().includes(q)));
  const results = await bestResults(list.filter((x) => x.p.showResults).map((x) => x.p.userId));
  res.json({ candidates: list.map((x) => ({ userId: x.p.userId, name: x.name, organization: x.org, jobTitle: x.title, headline: x.p.headline, skills: x.p.skills, certifications: x.p.certifications, years: x.p.years, location: x.p.location, availability: x.p.availability, results: results.get(x.p.userId) ?? null })) });
}));

/** Opening a profile is logged and the candidate is told who looked (transparency). */
r.get("/talent/:userId", requireRecruiter, h(async (req, res) => {
  const [x] = await db.select({ p: schema.talentProfiles, name: schema.users.name, email: schema.users.email, org: schema.users.organization, title: schema.users.jobTitle, bio: schema.users.bio })
    .from(schema.talentProfiles).innerJoin(schema.users, eq(schema.users.id, schema.talentProfiles.userId)).where(and(eq(schema.talentProfiles.userId, req.params.userId), eq(schema.talentProfiles.visible, true)));
  if (!x) return res.status(404).json({ error: "Profile not found or not shared." });
  await db.insert(schema.talentViews).values({ id: newId(), recruiterId: req.user!.id, userId: x.p.userId, createdAt: new Date() });
  await db.insert(schema.notifications).values({ id: newId(), userId: x.p.userId, projectId: null, message: `${req.user!.name}${req.user!.organization ? ` (${req.user!.organization})` : ""} viewed your talent profile.`, link: "/talent/me", read: false, createdAt: new Date() });
  const results = x.p.showResults ? (await bestResults([x.p.userId])).get(x.p.userId) : null;
  res.json({ candidate: { name: x.name, email: x.p.availability === "Not looking" ? "" : x.email, organization: x.org, jobTitle: x.title, bio: x.bio, ...x.p, results } });
}));

// ---------- saved estimates ----------
r.get("/projects/:projectId/estimates", requireProject(), h(async (req, res) => {
  res.json({ estimates: await db.select().from(schema.estimates).where(eq(schema.estimates.projectId, req.params.projectId)).orderBy(desc(schema.estimates.createdAt)) });
}));
r.post("/projects/:projectId/estimates", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ kind: z.enum(["fee", "carbon"]), title: z.string().trim().min(1).max(160), input: z.record(z.string(), z.unknown()), summary: z.string().max(300).default("") }), req.body, res); if (!body) return;
  if (JSON.stringify(body.input).length > 50_000) return res.status(400).json({ error: "Estimate is too large." });
  const id = newId();
  await db.insert(schema.estimates).values({ ...body, id, projectId: req.params.projectId, createdBy: req.user!.id, createdAt: new Date() });
  await logActivity(req.params.projectId, req.user!.id, "estimate.saved", `Saved ${body.kind === "fee" ? "BIM fee" : "embodied carbon"} estimate "${body.title}" — ${body.summary}`, `/tools/${body.kind}`);
  res.status(201).json({ id });
}));
r.delete("/projects/:projectId/estimates/:id", requireProject("editor"), h(async (req, res) => {
  await db.delete(schema.estimates).where(and(eq(schema.estimates.id, req.params.id), eq(schema.estimates.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

export default r;
