import { and, asc, eq, max } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { DISCIPLINES, checklistFor, scoreReview, type QaResult } from "../../shared/qaqc";
import { logActivity, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { h, parse, sentKeys } from "./auth";
import { createIssues } from "./coordination";

// Model QA/QC reviews (ISO 19650-2 §5.6.3): graded checklists per discipline with a weighted score.
const r = Router();
const P = "/projects/:projectId/reviews";

const resultSchema = z.record(z.string().max(20), z.object({ grade: z.enum(["A", "B", "C", "D", "NA", ""]), comment: z.string().max(2000).default("") }));
const reviewSchema = z.object({
  title: z.string().trim().min(1).max(255), discipline: z.enum(DISCIPLINES as [string, ...string[]]),
  taskTeamId: z.string().nullable().default(null), fileId: z.string().nullable().default(null), milestone: z.string().max(120).default(""),
  results: resultSchema.default({}), status: z.enum(["Draft", "Completed"]).default("Draft"),
});

const scored = (discipline: string, results: Record<string, QaResult>) => {
  const s = scoreReview(checklistFor(discipline), results);
  return { score: s.score, grade: s.grade };
};
const load = async (pid: string, id: string) =>
  (await db.select().from(schema.modelReviews).where(and(eq(schema.modelReviews.id, id), eq(schema.modelReviews.projectId, pid))))[0];

r.get(P, requireProject(), h(async (req, res) => {
  res.json({ reviews: await db.select().from(schema.modelReviews).where(eq(schema.modelReviews.projectId, req.params.projectId)).orderBy(asc(schema.modelReviews.number)) });
}));

r.get(P + "/:id", requireProject(), h(async (req, res) => {
  const rv = await load(req.params.projectId, req.params.id);
  if (!rv) return res.status(404).json({ error: "Review not found." });
  res.json({ review: rv, checks: checklistFor(rv.discipline) });
}));

r.post(P, requireProject("editor"), h(async (req, res) => {
  const body = parse(reviewSchema, req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const [{ n }] = await db.select({ n: max(schema.modelReviews.number) }).from(schema.modelReviews).where(eq(schema.modelReviews.projectId, pid));
  const id = newId(); const now = new Date();
  await db.insert(schema.modelReviews).values({ ...body, ...scored(body.discipline, body.results as Record<string, QaResult>), id, projectId: pid, number: (n ?? 0) + 1, reviewerId: req.user!.id, createdAt: now, updatedAt: now });
  await logActivity(pid, req.user!.id, "review.created", `Started model review QA-${String((n ?? 0) + 1).padStart(3, "0")}: ${body.title}`, `/projects/${pid}/reviews/${id}`);
  res.status(201).json({ id });
}));

r.put(P + "/:id", requireProject("editor"), h(async (req, res) => {
  const parsed = parse(reviewSchema.partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  const pid = req.params.projectId;
  const rv = await load(pid, req.params.id);
  if (!rv) return res.status(404).json({ error: "Review not found." });
  if (rv.status === "Completed" && body.status !== "Draft") return res.status(409).json({ error: "This review is completed. Reopen it to make changes." });
  const discipline = body.discipline ?? rv.discipline;
  // results merge per check so two reviewers' edits to different checks don't overwrite each other
  const results = { ...(rv.results as Record<string, QaResult>), ...((body.results ?? {}) as Record<string, QaResult>) };
  await db.update(schema.modelReviews).set({ ...body, results, ...scored(discipline, results), updatedAt: new Date() }).where(eq(schema.modelReviews.id, rv.id));
  if (body.status && body.status !== rv.status) await logActivity(pid, req.user!.id, "review.status", `${body.status === "Completed" ? "Completed" : "Reopened"} model review ${rv.title}`, `/projects/${pid}/reviews/${rv.id}`);
  res.json({ ok: true, ...scored(discipline, results) });
}));

r.delete(P + "/:id", requireProject("manager"), h(async (req, res) => {
  await db.delete(schema.modelReviews).where(and(eq(schema.modelReviews.id, req.params.id), eq(schema.modelReviews.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

/** One issue per check graded C or D, assigned to the reviewed task team. */
r.post(P + "/:id/issues", requireProject("editor"), h(async (req, res) => {
  const pid = req.params.projectId;
  const rv = await load(pid, req.params.id);
  if (!rv) return res.status(404).json({ error: "Review not found." });
  const tag = `QA-${String(rv.number).padStart(3, "0")}`;
  const existing = new Set((await db.select({ t: schema.issues.title }).from(schema.issues).where(eq(schema.issues.projectId, pid))).map((x) => x.t));
  const results = rv.results as Record<string, QaResult>;
  const rows = checklistFor(rv.discipline).filter((c) => ["C", "D"].includes(results[c.id]?.grade ?? "")).map((c) => ({
    title: `${tag} ${c.id}: ${c.text}`.slice(0, 255),
    description: `Model review "${rv.title}" graded ${results[c.id].grade} (${c.area}).${results[c.id].comment ? `\n\n${results[c.id].comment}` : ""}`,
    type: "Issue" as const, priority: (results[c.id].grade === "D" || c.priority === 3 ? "High" : "Normal") as "High" | "Normal",
    taskTeamId: rv.taskTeamId, fileId: rv.fileId, labels: ["qaqc", rv.discipline],
  })).filter((x) => !existing.has(x.title));
  const created = await createIssues(pid, req.user!.id, rows);
  if (created.length) await logActivity(pid, req.user!.id, "issue.created", `Raised ${created.length} issues from model review ${tag}`, `/projects/${pid}/coordination/issues`);
  res.status(201).json({ created: created.length });
}));

export default r;
