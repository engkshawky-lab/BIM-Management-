import { and, asc, desc, eq, max } from "drizzle-orm";
import { Router } from "express";
import JSZip from "jszip";
import multer from "multer";
import { z } from "zod";
import { BCF_VERSION_XML, markupToTopic, parseClashReport, topicToMarkup, viewpointXml, type BcfTopic } from "../../shared/bcf";
import type { Finding } from "../../shared/delivery";
import { logActivity, memberRole, notify, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { h, parse, sentKeys } from "./auth";

const r = Router();
const P = "/projects/:projectId";
const memory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export const ISSUE_TYPES = ["Issue", "Clash", "RFI", "Request", "Comment", "Error", "Remark"] as const;
export const ISSUE_STATUSES = ["Open", "In progress", "Resolved", "Closed"] as const;
export const PRIORITIES = ["Low", "Normal", "High", "Critical"] as const;

const issueSchema = z.object({
  title: z.string().trim().min(1).max(255), description: z.string().max(10_000).default(""),
  type: z.enum(ISSUE_TYPES).default("Issue"), status: z.enum(ISSUE_STATUSES).default("Open"), priority: z.enum(PRIORITIES).default("Normal"),
  assigneeId: z.string().nullable().default(null), taskTeamId: z.string().nullable().default(null), dueDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).default(""),
  fileId: z.string().nullable().default(null), documentId: z.string().nullable().default(null), deliverableId: z.string().nullable().default(null),
  elementGuids: z.array(z.string().max(64)).max(500).default([]), labels: z.array(z.string().max(40)).max(20).default([]),
});
type IssueInput = z.infer<typeof issueSchema>;

async function nextNumber(pid: string) {
  const [{ n }] = await db.select({ n: max(schema.issues.number) }).from(schema.issues).where(eq(schema.issues.projectId, pid));
  return (n ?? 0) + 1;
}

export async function createIssues(pid: string, uid: string, rows: (Partial<IssueInput> & { title: string; validationRunId?: string; bcfGuid?: string })[]) {
  let n = await nextNumber(pid);
  const now = new Date();
  const values = rows.map((row) => ({
    ...issueSchema.parse(row), id: newId(), projectId: pid, number: n++, validationRunId: row.validationRunId ?? null,
    bcfGuid: row.bcfGuid ?? crypto.randomUUID(), createdBy: uid, createdAt: now, updatedAt: now,
  }));
  if (values.length) await db.insert(schema.issues).values(values);
  return values;
}

function groupBy<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, T[]>();
  for (const it of items) { const k = key(it); m.set(k, [...(m.get(k) ?? []), it]); }
  return m;
}

const link = (pid: string, id: string) => `/projects/${pid}/coordination/issues/${id}`;

r.get(P + "/issues", requireProject(), h(async (req, res) => {
  const rows = await db.select({ i: schema.issues, assignee: schema.users.name }).from(schema.issues)
    .leftJoin(schema.users, eq(schema.users.id, schema.issues.assigneeId))
    .where(eq(schema.issues.projectId, req.params.projectId)).orderBy(desc(schema.issues.number));
  res.json({ issues: rows.map((x) => ({ ...x.i, assigneeName: x.assignee ?? "" })) });
}));

r.post(P + "/issues", requireProject("viewer"), h(async (req, res) => {
  const body = parse(issueSchema, req.body, res); if (!body) return;
  const pid = req.params.projectId;
  if (body.assigneeId && !(await memberRole(pid, body.assigneeId))) return res.status(400).json({ error: "Assignee is not a project member." });
  const [issue] = await createIssues(pid, req.user!.id, [body]);
  await logActivity(pid, req.user!.id, "issue.created", `Raised issue #${issue.number}: ${issue.title}`, link(pid, issue.id));
  if (issue.assigneeId) await notify(pid, req.user!.id, `${req.user!.name} assigned you issue #${issue.number}: ${issue.title}`, link(pid, issue.id), issue.assigneeId);
  res.status(201).json({ id: issue.id, number: issue.number });
}));

r.put(P + "/issues/:id", requireProject("viewer"), h(async (req, res) => {
  const parsed = parse(issueSchema.partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  const pid = req.params.projectId;
  const [cur] = await db.select().from(schema.issues).where(and(eq(schema.issues.id, req.params.id), eq(schema.issues.projectId, pid)));
  if (!cur) return res.status(404).json({ error: "Issue not found." });
  // viewers may only update issues they raised or are assigned to
  if (req.projectRole === "viewer" && cur.createdBy !== req.user!.id && cur.assigneeId !== req.user!.id) return res.status(403).json({ error: "Not allowed." });
  if (body.assigneeId && !(await memberRole(pid, body.assigneeId))) return res.status(400).json({ error: "Assignee is not a project member." });
  const closing = body.status === "Closed" && cur.status !== "Closed";
  await db.update(schema.issues).set({ ...body, updatedAt: new Date(), ...(closing ? { closedAt: new Date() } : body.status && body.status !== "Closed" ? { closedAt: null } : {}) }).where(eq(schema.issues.id, cur.id));
  if (body.status && body.status !== cur.status) {
    await logActivity(pid, req.user!.id, "issue.status", `Issue #${cur.number}: ${cur.status} → ${body.status}`, link(pid, cur.id));
    await notify(pid, req.user!.id, `Issue #${cur.number} is now ${body.status}`, link(pid, cur.id), cur.createdBy);
  }
  if (body.assigneeId && body.assigneeId !== cur.assigneeId) await notify(pid, req.user!.id, `${req.user!.name} assigned you issue #${cur.number}: ${cur.title}`, link(pid, cur.id), body.assigneeId);
  res.json({ ok: true });
}));

r.delete(P + "/issues/:id", requireProject("manager"), h(async (req, res) => {
  await db.delete(schema.comments).where(eq(schema.comments.issueId, req.params.id));
  await db.delete(schema.issues).where(and(eq(schema.issues.id, req.params.id), eq(schema.issues.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

// One issue per error finding (and per failing requirement) of a validation run, skipping ones already raised.
r.post(P + "/issues/from-validation", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ runId: z.string() }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const [run] = await db.select().from(schema.validationRuns).where(and(eq(schema.validationRuns.id, body.runId), eq(schema.validationRuns.projectId, pid)));
  if (!run) return res.status(404).json({ error: "Validation run not found." });
  const [file] = await db.select().from(schema.files).where(eq(schema.files.id, run.fileId));
  const report = run.report as { findings?: Finding[]; requirements?: { name: string; failures: { guid: string }[] }[] };
  const existing = new Set((await db.select({ t: schema.issues.title }).from(schema.issues).where(and(eq(schema.issues.projectId, pid), eq(schema.issues.validationRunId, run.id)))).map((x) => x.t));
  const failingReq = new Map((report.requirements ?? []).map((q) => [q.name, q.failures.map((f) => f.guid)]));
  const rows = (report.findings ?? []).filter((f) => f.severity === "error").map((f) => {
    const reqName = [...failingReq.keys()].find((n) => f.message.startsWith(n + ":"));
    return {
      title: `${file?.name ?? "Model"} v${run.fileVersion}: ${f.area} — ${f.message}`.slice(0, 255), description: `${f.message}${f.ref ? `\n\nReference: ${f.ref}` : ""}${f.clause ? `\nClause: ${f.clause}` : ""}`,
      type: "Error" as const, priority: "High" as const, fileId: run.fileId, validationRunId: run.id, labels: ["validation", run.kind],
      elementGuids: reqName ? failingReq.get(reqName)!.slice(0, 500) : [],
    };
  }).filter((row) => !existing.has(row.title));
  const created = await createIssues(pid, req.user!.id, rows);
  if (created.length) await logActivity(pid, req.user!.id, "issue.created", `Raised ${created.length} issues from validation of ${file?.name}`, `/projects/${pid}/coordination/issues`);
  res.status(201).json({ created: created.length });
}));

// ---------- BCF 2.1 ----------
r.get(P + "/issues/bcf", requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, pid));
  const users = new Map((await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users)).map((u) => [u.id, u.email]));
  const issues = await db.select().from(schema.issues).where(eq(schema.issues.projectId, pid)).orderBy(asc(schema.issues.number));
  const comments = await db.select().from(schema.comments).where(eq(schema.comments.projectId, pid));
  const zip = new JSZip();
  zip.file("bcf.version", BCF_VERSION_XML);
  zip.file("project.bcfp", `<?xml version="1.0" encoding="UTF-8"?>\n<ProjectExtension><Project ProjectId="${project.id}"><Name>${project.name.replace(/[<&>]/g, "")}</Name></Project><ExtensionSchema></ExtensionSchema></ProjectExtension>`);
  for (const i of issues) {
    const topic: BcfTopic = {
      guid: i.bcfGuid, type: i.type, status: i.status, title: `#${i.number} ${i.title}`, priority: i.priority, description: i.description ?? "", labels: i.labels,
      creationDate: i.createdAt.toISOString(), creationAuthor: users.get(i.createdBy) ?? "", assignedTo: users.get(i.assigneeId ?? "") ?? "", dueDate: i.dueDate,
      components: i.elementGuids,
      comments: comments.filter((c) => c.issueId === i.id).map((c) => ({ guid: c.id, date: c.createdAt.toISOString(), author: users.get(c.userId) ?? "", text: c.body })),
    };
    const vp = i.elementGuids.length ? crypto.randomUUID() : undefined;
    zip.file(`${i.bcfGuid}/markup.bcf`, topicToMarkup(topic, vp));
    if (vp) zip.file(`${i.bcfGuid}/viewpoint.bcfv`, viewpointXml(vp, i.elementGuids));
  }
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${project.code}-issues.bcfzip"`);
  res.send(await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}));

r.post(P + "/issues/bcf", requireProject("editor"), memory.single("file"), h(async (req, res) => {
  const pid = req.params.projectId; const uid = req.user!.id;
  if (!req.file) return res.status(400).json({ error: "Upload a .bcf / .bcfzip file." });
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(req.file.buffer); } catch { return res.status(400).json({ error: "Not a valid BCF zip." }); }
  const byEmail = new Map((await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.projectMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.projectMembers.userId)).where(eq(schema.projectMembers.projectId, pid))).map((u) => [u.email.toLowerCase(), u.id]));
  const existing = new Map((await db.select().from(schema.issues).where(eq(schema.issues.projectId, pid))).map((i) => [i.bcfGuid, i]));
  let created = 0, updated = 0; const errors: string[] = [];
  for (const path of Object.keys(zip.files).filter((p) => p.endsWith("markup.bcf"))) {
    try {
      const folder = path.slice(0, -"markup.bcf".length);
      const vpPath = Object.keys(zip.files).find((p) => p.startsWith(folder) && p.endsWith(".bcfv"));
      const t = markupToTopic(await zip.file(path)!.async("string"), vpPath ? await zip.file(vpPath)!.async("string") : undefined);
      const fields = {
        title: t.title.replace(/^#\d+\s+/, "").slice(0, 255), description: t.description,
        type: (ISSUE_TYPES as readonly string[]).includes(t.type) ? (t.type as IssueInput["type"]) : "Issue",
        status: (ISSUE_STATUSES as readonly string[]).includes(t.status) ? (t.status as IssueInput["status"]) : t.status.toLowerCase() === "active" ? "In progress" as const : "Open" as const,
        priority: (PRIORITIES as readonly string[]).includes(t.priority) ? (t.priority as IssueInput["priority"]) : "Normal" as const,
        assigneeId: byEmail.get(t.assignedTo.toLowerCase()) ?? null, dueDate: /^\d{4}-\d{2}-\d{2}/.test(t.dueDate) ? t.dueDate.slice(0, 10) : "",
        labels: t.labels.slice(0, 20), elementGuids: t.components.slice(0, 500),
      };
      let issueId: string;
      const cur = existing.get(t.guid);
      if (cur) { await db.update(schema.issues).set({ ...fields, updatedAt: new Date() }).where(eq(schema.issues.id, cur.id)); issueId = cur.id; updated++; }
      else { const [i] = await createIssues(pid, uid, [{ ...fields, bcfGuid: t.guid || crypto.randomUUID() }]); issueId = i.id; created++; }
      const have = new Set((await db.select({ id: schema.comments.id }).from(schema.comments).where(eq(schema.comments.issueId, issueId))).map((c) => c.id));
      for (const c of t.comments) if (!have.has(c.guid)) await db.insert(schema.comments).values({
        id: /^[\w-]{1,36}$/.test(c.guid) ? c.guid : newId(), projectId: pid, issueId, userId: byEmail.get(c.author.toLowerCase()) ?? uid,
        body: byEmail.has(c.author.toLowerCase()) ? c.text : `${c.author || "External"}: ${c.text}`, createdAt: Number.isNaN(Date.parse(c.date)) ? new Date() : new Date(c.date),
      }).catch(() => undefined);
    } catch (e) { errors.push(`${path}: ${(e as Error).message}`); }
  }
  await logActivity(pid, uid, "issue.bcf_import", `Imported BCF: ${created} new, ${updated} updated issues`, `/projects/${pid}/coordination/issues`);
  res.json({ created, updated, errors });
}));

// ---------- clash matrix ----------
r.get(P + "/clash-tests", requireProject(), h(async (req, res) => {
  res.json({ tests: await db.select().from(schema.clashTests).where(eq(schema.clashTests.projectId, req.params.projectId)) });
}));

const clashSchema = z.object({
  teamA: z.string(), teamB: z.string(), kind: z.enum(["hard", "clearance", "duplicate"]).default("hard"), toleranceMm: z.number().int().min(0).max(5000).default(0),
  priority: z.enum(PRIORITIES).default("Normal"), frequency: z.enum(["Daily", "Weekly", "Fortnightly", "Per milestone"]).default("Weekly"), notes: z.string().max(500).default(""),
  code: z.string().trim().toUpperCase().max(20).default(""), setsA: z.array(z.string().trim().min(1).max(120)).max(60).default([]), setsB: z.array(z.string().trim().min(1).max(120)).max(60).default([]),
});

// Upsert by team pair (order-independent) so the matrix cell is the unit of editing.
r.put(P + "/clash-tests", requireProject("editor"), h(async (req, res) => {
  const body = parse(clashSchema, req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const [a, b] = [body.teamA, body.teamB].sort();
  const teams = new Set((await db.select({ id: schema.taskTeams.id }).from(schema.taskTeams).where(eq(schema.taskTeams.projectId, pid))).map((t) => t.id));
  if (!teams.has(a) || !teams.has(b)) return res.status(400).json({ error: "Unknown task team." });
  const [cur] = await db.select().from(schema.clashTests).where(and(eq(schema.clashTests.projectId, pid), eq(schema.clashTests.teamA, a), eq(schema.clashTests.teamB, b)));
  if (cur) await db.update(schema.clashTests).set({ ...body, teamA: a, teamB: b }).where(eq(schema.clashTests.id, cur.id));
  else await db.insert(schema.clashTests).values({ ...body, teamA: a, teamB: b, id: newId(), projectId: pid });
  res.json({ ok: true });
}));

r.delete(P + "/clash-tests/:id", requireProject("editor"), h(async (req, res) => {
  await db.delete(schema.clashTests).where(and(eq(schema.clashTests.id, req.params.id), eq(schema.clashTests.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

// Import a clash report (CSV/TSV rows parsed on the client) as Clash issues, grouped or one per clash.
r.post(P + "/clash-import", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ rows: z.array(z.array(z.string().max(500)).max(60)).min(2).max(5001), testName: z.string().max(120).default("Clash test"),
    assigneeId: z.string().nullable().default(null), taskTeamId: z.string().nullable().default(null), group: z.boolean().default(true) }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const clashes = parseClashReport(body.rows).filter((c) => !/resolved|approved/i.test(c.status));
  if (!clashes.length) return res.status(400).json({ error: "No open clashes found. Check that the first row contains column headers." });
  const rows = body.group
    ? [...groupBy(clashes, (c) => c.gridLocation || "Unlocated")].map(([grid, list]) => ({
        title: `${body.testName}: ${list.length} clash${list.length > 1 ? "es" : ""} at ${grid}`.slice(0, 255),
        description: list.slice(0, 200).map((c) => `• ${c.name}: ${c.itemA || c.guidA} × ${c.itemB || c.guidB}${c.distance ? ` (${c.distance})` : ""}`).join("\n"),
        type: "Clash" as const, priority: list.length > 10 ? "High" as const : "Normal" as const, assigneeId: body.assigneeId, taskTeamId: body.taskTeamId,
        elementGuids: [...new Set(list.flatMap((c) => [c.guidA, c.guidB]).filter(Boolean))].slice(0, 500), labels: ["clash", body.testName.slice(0, 40)],
      }))
    : clashes.slice(0, 500).map((c) => ({
        title: `${body.testName}: ${c.name} — ${c.itemA || "A"} × ${c.itemB || "B"}`.slice(0, 255), description: `Grid: ${c.gridLocation || "—"}\nDistance: ${c.distance || "—"}`,
        type: "Clash" as const, assigneeId: body.assigneeId, taskTeamId: body.taskTeamId, elementGuids: [c.guidA, c.guidB].filter(Boolean), labels: ["clash"],
      }));
  const created = await createIssues(pid, req.user!.id, rows);
  await logActivity(pid, req.user!.id, "issue.clash_import", `Imported ${clashes.length} clashes as ${created.length} issues (${body.testName})`, `/projects/${pid}/coordination/issues`);
  if (body.assigneeId) await notify(pid, req.user!.id, `${req.user!.name} assigned you ${created.length} clash issues`, `/projects/${pid}/coordination/issues`, body.assigneeId);
  res.status(201).json({ clashes: clashes.length, created: created.length });
}));

export default r;
