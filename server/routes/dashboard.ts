import { and, eq, inArray, ne } from "drizzle-orm";
import { Router } from "express";
import { planStats, type Deliverable, progressPct } from "../../shared/delivery";
import { db, schema } from "../db";
import { h } from "./auth";

// Cross-project views: the personal work inbox ("My Day") and the portfolio dashboard.
const r = Router();
const today = () => new Date().toISOString().slice(0, 10);

async function myProjects(uid: string) {
  const rows = await db.select({ p: schema.projects, role: schema.projectMembers.role }).from(schema.projectMembers)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.projectMembers.projectId)).where(eq(schema.projectMembers.userId, uid));
  return rows;
}

export interface InboxItem { kind: "review" | "container" | "issue" | "action" | "risk"; title: string; project: string; due: string; link: string; overdue: boolean }

r.get("/me/inbox", h(async (req, res) => {
  const uid = req.user!.id; const day = today();
  const projects = await myProjects(uid);
  const ids = projects.map((x) => x.p.id);
  const code = new Map(projects.map((x) => [x.p.id, x.p.code]));
  if (!ids.length) return res.json({ items: [] });
  const [reviews, dels, issues, meetings, risks] = await Promise.all([
    db.select().from(schema.documents).where(and(inArray(schema.documents.projectId, ids), eq(schema.documents.reviewerId, uid), eq(schema.documents.reviewStatus, "requested"))),
    db.select().from(schema.deliverables).where(and(inArray(schema.deliverables.projectId, ids), eq(schema.deliverables.assigneeId, uid))),
    db.select().from(schema.issues).where(and(inArray(schema.issues.projectId, ids), eq(schema.issues.assigneeId, uid), ne(schema.issues.status, "Closed"))),
    db.select().from(schema.meetings).where(inArray(schema.meetings.projectId, ids)),
    db.select().from(schema.risks).where(and(inArray(schema.risks.projectId, ids), eq(schema.risks.ownerId, uid), ne(schema.risks.status, "Closed"))),
  ]);
  const items: InboxItem[] = [
    ...reviews.map((d) => ({ kind: "review" as const, title: `Review requested: ${d.title}`, project: code.get(d.projectId)!, due: "", link: `/projects/${d.projectId}/documents/${d.id}`, overdue: false })),
    ...dels.filter((d) => !["shared", "published"].includes(d.status)).map((d) => ({ kind: "container" as const, title: `Deliver ${d.containerName || d.title}`, project: code.get(d.projectId)!, due: d.dueDate, link: `/projects/${d.projectId}/delivery/plan`, overdue: !!d.dueDate && d.dueDate < day })),
    ...issues.map((i) => ({ kind: "issue" as const, title: `Issue #${i.number}: ${i.title}`, project: code.get(i.projectId)!, due: i.dueDate, link: `/projects/${i.projectId}/coordination/issues`, overdue: !!i.dueDate && i.dueDate < day })),
    // only the latest meeting of each type holds the live action list (open actions carry forward)
    ...[...meetings.sort((a, b) => a.number - b.number).reduce((m, x) => m.set(`${x.projectId}|${x.type}`, x), new Map<string, typeof meetings[number]>()).values()]
      .flatMap((m) => m.actions.filter((a) => a.ownerId === uid && a.status !== "Done").map((a) => ({ kind: "action" as const, title: a.text, project: code.get(m.projectId)!, due: a.due, link: `/projects/${m.projectId}/meetings/${m.id}`, overdue: !!a.due && a.due < day }))),
    ...risks.filter((x) => x.reviewDate).map((x) => ({ kind: "risk" as const, title: `Review risk R${String(x.number).padStart(2, "0")}: ${x.title}`, project: code.get(x.projectId)!, due: x.reviewDate, link: `/projects/${x.projectId}/delivery/risks`, overdue: x.reviewDate < day })),
  ];
  items.sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.due || "9999").localeCompare(b.due || "9999"));
  res.json({ items });
}));

r.get("/me/portfolio", h(async (req, res) => {
  const day = today();
  const projects = await myProjects(req.user!.id);
  const ids = projects.map((x) => x.p.id);
  if (!ids.length) return res.json({ projects: [] });
  const [dels, issues, reviews, reqs, risks] = await Promise.all([
    db.select().from(schema.deliverables).where(inArray(schema.deliverables.projectId, ids)),
    db.select({ projectId: schema.issues.projectId, status: schema.issues.status, priority: schema.issues.priority }).from(schema.issues).where(inArray(schema.issues.projectId, ids)),
    db.select().from(schema.modelReviews).where(and(inArray(schema.modelReviews.projectId, ids), eq(schema.modelReviews.status, "Completed"))),
    db.select({ projectId: schema.requirements.projectId, response: schema.requirements.response, deliverableIds: schema.requirements.deliverableIds }).from(schema.requirements).where(inArray(schema.requirements.projectId, ids)),
    db.select().from(schema.risks).where(inArray(schema.risks.projectId, ids)),
  ]);
  const out = projects.map(({ p, role }) => {
    const pd = dels.filter((d) => d.projectId === p.id);
    const st = planStats(pd as unknown as Deliverable[], day);
    const latest = new Map<string, number>(); reviews.filter((x) => x.projectId === p.id).sort((a, b) => a.number - b.number).forEach((x) => latest.set(x.discipline, x.score));
    const pr = reqs.filter((x) => x.projectId === p.id);
    const published = new Set(pd.filter((d) => ["shared", "published"].includes(d.status)).map((d) => d.id));
    return {
      id: p.id, code: p.code, name: p.name, role, stage: p.stage,
      progress: progressPct(st.progress), containers: st.total, overdue: st.overdue,
      openIssues: issues.filter((i) => i.projectId === p.id && i.status !== "Closed").length,
      criticalIssues: issues.filter((i) => i.projectId === p.id && i.status !== "Closed" && ["High", "Critical"].includes(i.priority)).length,
      quality: latest.size ? Math.round([...latest.values()].reduce((a, b) => a + b, 0) / latest.size) : null,
      requirements: pr.length, covered: pr.filter((x) => x.deliverableIds.length && x.deliverableIds.every((d) => published.has(d))).length,
      highRisks: risks.filter((x) => x.projectId === p.id && x.status !== "Closed" && x.likelihood * x.impact >= 15).length,
    };
  });
  res.json({ projects: out });
}));

export default r;
