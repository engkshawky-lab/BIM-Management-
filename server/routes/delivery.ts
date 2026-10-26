import { and, asc, eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { Router } from "express";
import { INFO_USES, useByCode } from "../../shared/data/infoUses";
import { LODS, MRM_STARTER } from "../../shared/mrm";
import { z } from "zod";
import { templateById } from "../../shared/data/templates";
import { analysePlan, planStats, qualityScore, variance, type Deliverable } from "../../shared/delivery";
import { initialValues } from "../../shared/documents";
import { checkDocument, checkProjectSet } from "../../shared/quality";
import { logActivity, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { h, parse, sentKeys } from "./auth";

const r = Router();
const P = "/projects/:projectId";
const today = () => new Date().toISOString().slice(0, 10);
const date = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "use YYYY-MM-DD");

async function bundle(pid: string) {
  const [teams, milestones, deliverables, responsibility, loin, mrm] = await Promise.all([
    db.select().from(schema.taskTeams).where(eq(schema.taskTeams.projectId, pid)).orderBy(asc(schema.taskTeams.name)),
    db.select().from(schema.milestones).where(eq(schema.milestones.projectId, pid)).orderBy(asc(schema.milestones.date)),
    db.select().from(schema.deliverables).where(eq(schema.deliverables.projectId, pid)).orderBy(asc(schema.deliverables.dueDate), asc(schema.deliverables.containerName)),
    db.select().from(schema.responsibilityRows).where(eq(schema.responsibilityRows.projectId, pid)).orderBy(asc(schema.responsibilityRows.sortOrder), asc(schema.responsibilityRows.createdAt)),
    db.select().from(schema.loinRows).where(eq(schema.loinRows.projectId, pid)).orderBy(asc(schema.loinRows.ref)),
    db.select().from(schema.mrmRows).where(eq(schema.mrmRows.projectId, pid)).orderBy(asc(schema.mrmRows.sortOrder), asc(schema.mrmRows.createdAt)),
  ]);
  return { teams, milestones, deliverables: deliverables as (typeof deliverables[number] & Deliverable)[], responsibility, loin, mrm };
}

r.get(P + "/delivery", requireProject(), h(async (req, res) => {
  const b = await bundle(req.params.projectId);
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, req.params.projectId));
  const findings = analysePlan({ deliverables: b.deliverables, milestones: b.milestones, teams: b.teams, projectCode: project.code, today: today() });
  res.json({ ...b, stats: planStats(b.deliverables, today()), findings });
}));

// ---------- generic CRUD for the planning tables ----------
type Table = typeof schema.taskTeams | typeof schema.milestones | typeof schema.deliverables | typeof schema.responsibilityRows | typeof schema.loinRows | typeof schema.mrmRows;

function crud<S extends z.ZodObject>(path: string, table: Table, shape: S, label: (row: z.infer<S>) => string, hooks: {
  beforeDelete?: (pid: string, id: string) => Promise<string | void>;
  validate?: (pid: string, row: Partial<z.infer<S>>) => Promise<string | void>;
  transform?: (row: Partial<z.infer<S>>, pid: string, id: string) => Promise<Partial<z.infer<S>>>;
} = {}) {
  const withTimestamps = (row: object, isNew: boolean) => ({ ...row, ...("updatedAt" in table ? { updatedAt: new Date() } : {}), ...(isNew ? { createdAt: new Date() } : {}) });

  r.post(`${P}/${path}`, requireProject("editor"), h(async (req, res) => {
    const body = parse(shape, req.body, res); if (!body) return;
    const pid = req.params.projectId;
    const err = await hooks.validate?.(pid, body); if (err) return res.status(400).json({ error: err });
    const id = newId();
    await db.insert(table).values(withTimestamps({ ...body, id, projectId: pid }, true) as never);
    await logActivity(pid, req.user!.id, `${path}.created`, `Added ${label(body)}`, `/projects/${pid}/delivery`);
    res.status(201).json({ id });
  }));

  r.put(`${P}/${path}/:id`, requireProject("editor"), h(async (req, res) => {
    const parsed = parse(shape.partial(), req.body, res); if (!parsed) return;
    let body = sentKeys(parsed, req.body) as Partial<z.infer<S>>;
    if (hooks.transform) body = await hooks.transform(body, req.params.projectId, req.params.id);
    const pid = req.params.projectId;
    const err = await hooks.validate?.(pid, body); if (err) return res.status(400).json({ error: err });
    const result = await db.update(table).set(withTimestamps(body, false) as never).where(and(eq(table.id, req.params.id), eq(table.projectId, pid)));
    if (!result[0].affectedRows) return res.status(404).json({ error: "Not found." });
    res.json({ ok: true });
  }));

  r.delete(`${P}/${path}/:id`, requireProject("editor"), h(async (req, res) => {
    const pid = req.params.projectId;
    const err = await hooks.beforeDelete?.(pid, req.params.id); if (err) return res.status(409).json({ error: err });
    await db.delete(table).where(and(eq(table.id, req.params.id), eq(table.projectId, pid)));
    res.json({ ok: true });
  }));
}

crud("task-teams", schema.taskTeams, z.object({
  name: z.string().trim().min(1).max(120), organization: z.string().trim().max(160).default(""),
  originatorCode: z.string().trim().toUpperCase().regex(/^([A-Z0-9]{3,6})?$/, "3–6 letters or digits").default(""),
  roleCode: z.string().trim().toUpperCase().regex(/^([A-Z]{1,2})?$/).default(""), leadUserId: z.string().nullable().default(null),
}), (t) => `task team ${t.name}`, {
  beforeDelete: async (pid, id) => {
    const [used] = await db.select({ id: schema.deliverables.id }).from(schema.deliverables).where(and(eq(schema.deliverables.projectId, pid), eq(schema.deliverables.taskTeamId, id))).limit(1);
    if (used) return "This task team still has TIDP entries. Reassign or delete them first.";
  },
});

crud("milestones", schema.milestones, z.object({
  name: z.string().trim().min(1).max(160), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD"), description: z.string().max(500).default(""),
}), (m) => `milestone ${m.name}`, {
  beforeDelete: async (pid, id) => {
    await db.update(schema.deliverables).set({ milestoneId: null }).where(and(eq(schema.deliverables.projectId, pid), eq(schema.deliverables.milestoneId, id)));
    await db.update(schema.loinRows).set({ milestoneId: null }).where(and(eq(schema.loinRows.projectId, pid), eq(schema.loinRows.milestoneId, id)));
  },
});

const sameProject = async (pid: string, row: { taskTeamId?: string; milestoneId?: string | null }) => {
  if (row.taskTeamId) {
    const [t] = await db.select({ id: schema.taskTeams.id }).from(schema.taskTeams).where(and(eq(schema.taskTeams.id, row.taskTeamId), eq(schema.taskTeams.projectId, pid)));
    if (!t) return "Unknown task team.";
  }
  if (row.milestoneId) {
    const [m] = await db.select({ id: schema.milestones.id }).from(schema.milestones).where(and(eq(schema.milestones.id, row.milestoneId), eq(schema.milestones.projectId, pid)));
    if (!m) return "Unknown milestone.";
  }
};

crud("deliverables", schema.deliverables, z.object({
  taskTeamId: z.string().min(1), containerName: z.string().trim().toUpperCase().max(120).default(""), title: z.string().trim().min(1).max(255),
  typeCode: z.string().trim().toUpperCase().max(2).default(""), loin: z.string().trim().max(40).default(""), milestoneId: z.string().nullable().default(null),
  startDate: date.default(""), dueDate: date.default(""), status: z.enum(["planned", "in_progress", "shared", "published"]).default("planned"),
  dependsOn: z.array(z.string()).max(50).default([]), assigneeId: z.string().nullable().default(null),
  fileId: z.string().nullable().default(null), documentId: z.string().nullable().default(null), notes: z.string().max(1000).default(""),
  formats: z.array(z.string().trim().toUpperCase().max(12)).max(10).default([]), classification: z.string().trim().max(80).default(""), actualDate: date.default(""),
}), (d) => `container ${d.containerName || d.title}`, {
  validate: sameProject,
  // record the actual delivery date when a container is first shared or published
  transform: async (row, pid, id) => {
    if (!row.status || !["shared", "published"].includes(row.status) || row.actualDate !== undefined) return row;
    const [cur] = await db.select({ a: schema.deliverables.actualDate }).from(schema.deliverables).where(and(eq(schema.deliverables.id, id), eq(schema.deliverables.projectId, pid)));
    return cur && !cur.a ? { ...row, actualDate: today() } : row;
  },
  beforeDelete: async (pid, id) => {
    // drop the deleted container from everyone's dependency list
    const rows = await db.select().from(schema.deliverables).where(eq(schema.deliverables.projectId, pid));
    for (const row of rows) if (row.dependsOn.includes(id))
      await db.update(schema.deliverables).set({ dependsOn: row.dependsOn.filter((x) => x !== id) }).where(eq(schema.deliverables.id, row.id));
  },
});

crud("responsibility", schema.responsibilityRows, z.object({
  item: z.string().trim().min(1).max(255), stage: z.string().trim().max(120).default(""), loin: z.string().trim().max(40).default(""),
  cells: z.record(z.string(), z.string().regex(/^[RACI/]{0,7}$/, "use R, A, C, I")).default({}), sortOrder: z.number().int().default(0),
}), (row) => `responsibility row ${row.item}`);

crud("loin", schema.loinRows, z.object({
  ref: z.string().trim().min(1).max(40), element: z.string().trim().min(1).max(160), ifcClass: z.string().trim().max(80).default(""),
  milestoneId: z.string().nullable().default(null), purpose: z.string().max(255).default(""),
  geometry: z.string().max(1000).default(""), alphanumeric: z.string().max(1000).default(""), documentation: z.string().max(1000).default(""),
}), (row) => `LOIN ${row.ref}`, { validate: sameProject });

crud("mrm", schema.mrmRows, z.object({
  discipline: z.string().trim().min(1).max(40), system: z.string().trim().max(80).default(""), element: z.string().trim().min(1).max(160),
  cells: z.record(z.string(), z.object({ teamId: z.string().max(36), lod: z.enum(["", ...LODS]) })).default({}), sortOrder: z.number().int().default(0),
}), (row) => `model element ${row.element}`);

r.post(P + "/mrm-seed", requireProject("editor"), h(async (req, res) => {
  const pid = req.params.projectId;
  const have = await db.select({ id: schema.mrmRows.id }).from(schema.mrmRows).where(eq(schema.mrmRows.projectId, pid));
  if (have.length) return res.status(409).json({ error: "The matrix already has rows." });
  const now = new Date();
  await db.insert(schema.mrmRows).values(MRM_STARTER.map((x, i) => ({ ...x, id: newId(), projectId: pid, cells: {}, sortOrder: i, createdAt: now })));
  await logActivity(pid, req.user!.id, "mrm.seeded", `Added ${MRM_STARTER.length} starter elements to the model responsibility matrix`, `/projects/${pid}/delivery/mrm`);
  res.status(201).json({ count: MRM_STARTER.length });
}));

// Bulk import (CSV paste) of deliverables.
r.post(P + "/deliverables-import", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ rows: z.array(z.object({
    taskTeamId: z.string(), containerName: z.string().max(120).default(""), title: z.string().min(1).max(255), loin: z.string().max(40).default(""),
    milestoneId: z.string().nullable().default(null), startDate: date.default(""), dueDate: date.default(""),
  })).min(1).max(500) }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  for (const row of body.rows) { const err = await sameProject(pid, row); if (err) return res.status(400).json({ error: err }); }
  const now = new Date();
  await db.insert(schema.deliverables).values(body.rows.map((row) => ({ ...row, containerName: row.containerName.toUpperCase(), id: newId(), projectId: pid, dependsOn: [], createdAt: now, updatedAt: now })));
  await logActivity(pid, req.user!.id, "deliverables.imported", `Imported ${body.rows.length} containers into the MIDP`, `/projects/${pid}/delivery`);
  res.status(201).json({ count: body.rows.length });
}));

// ---------- MIDP / TIDP Excel export ----------
r.get(P + "/midp.xlsx", requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, pid));
  const b = await bundle(pid);
  const teamId = typeof req.query.team === "string" ? req.query.team : "";
  const team = new Map(b.teams.map((t) => [t.id, t]));
  const ms = new Map(b.milestones.map((m) => [m.id, m]));
  const users = new Map((await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users)).map((u) => [u.id, u.name]));
  const rows = b.deliverables.filter((d) => !teamId || d.taskTeamId === teamId);
  const wb = new ExcelJS.Workbook();
  wb.creator = "BIM Management portal";
  const sheet = (name: string, cols: { header: string; key: string; width: number }[], data: Record<string, unknown>[]) => {
    const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = cols; ws.addRows(data);
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
    return ws;
  };
  const day = today();
  const ws = sheet(teamId ? `TIDP ${team.get(teamId)?.name ?? ""}`.slice(0, 31) : "MIDP", [
    { header: "Task team", key: "team", width: 20 }, { header: "Container name", key: "container", width: 34 }, { header: "Title", key: "title", width: 40 },
    { header: "Type", key: "type", width: 6 }, { header: "Formats", key: "formats", width: 16 }, { header: "Classification", key: "cls", width: 18 },
    { header: "LOIN", key: "loin", width: 10 }, { header: "Milestone", key: "ms", width: 18 }, { header: "Start", key: "start", width: 11 },
    { header: "Due", key: "due", width: 11 }, { header: "Actual", key: "actual", width: 11 }, { header: "Variance (days)", key: "var", width: 10 },
    { header: "Status", key: "status", width: 12 }, { header: "Responsible", key: "resp", width: 20 }, { header: "Depends on", key: "deps", width: 30 },
  ], rows.map((d) => ({
    team: team.get(d.taskTeamId)?.name ?? "", container: d.containerName, title: d.title, type: d.typeCode, formats: (d.formats ?? []).join(", "), cls: d.classification,
    loin: d.loin, ms: ms.get(d.milestoneId ?? "")?.name ?? "", start: d.startDate, due: d.dueDate, actual: d.actualDate, var: variance(d) ?? "",
    status: d.status.replace("_", " "), resp: users.get(d.assigneeId ?? "") ?? "", deps: d.dependsOn.map((x) => b.deliverables.find((y) => y.id === x)?.containerName).filter(Boolean).join(", "),
  })));
  rows.forEach((d, i) => { if (d.dueDate && d.dueDate < day && !["shared", "published"].includes(d.status)) ws.getRow(i + 2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE2E2" } }; });
  sheet("Milestones", [{ header: "Milestone", key: "n", width: 24 }, { header: "Date", key: "d", width: 12 }, { header: "Containers", key: "c", width: 12 }, { header: "Delivered", key: "x", width: 12 }],
    b.milestones.map((m) => { const list = rows.filter((d) => d.milestoneId === m.id); return { n: m.name, d: m.date, c: list.length, x: list.filter((d) => ["shared", "published"].includes(d.status)).length }; }));
  const st = planStats(rows, day);
  sheet("Summary", [{ header: "Measure", key: "k", width: 28 }, { header: "Value", key: "v", width: 14 }],
    [["Project", `${project.code} ${project.name}`], ["Exported", day], ["Containers", st.total], ["Published", st.published], ["Shared", st.shared], ["In progress", st.inProgress], ["Not started", st.planned], ["Overdue", st.overdue], ["Progress", `${st.progress}%`]].map(([k, v]) => ({ k, v })));
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${project.code}-${teamId ? "TIDP" : "MIDP"}-${day}.xlsx"`);
  await wb.xlsx.write(res); res.end();
}));

// ---------- information uses (ISO 19650-1 §5.1) ----------
r.get(P + "/info-uses", requireProject(), h(async (req, res) => {
  const [p] = await db.select({ u: schema.projects.infoUses }).from(schema.projects).where(eq(schema.projects.id, req.params.projectId));
  res.json({ uses: p?.u ?? [] });
}));

r.put(P + "/info-uses", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ uses: z.array(z.object({
    code: z.string().refine((c) => !!useByCode(c), "Unknown information use"), priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
    taskTeams: z.array(z.string()).max(50).default([]), notes: z.string().max(1000).default(""),
  })).max(INFO_USES.length) }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const uses = [...new Map(body.uses.map((x) => [x.code, x])).values()].sort((a, b) => a.code.localeCompare(b.code));
  await db.update(schema.projects).set({ infoUses: uses, updatedAt: new Date() }).where(eq(schema.projects.id, pid));
  await logActivity(pid, req.user!.id, "infouses.updated", `Updated information uses (${uses.length} selected)`, `/projects/${pid}/delivery/uses`);
  res.json({ ok: true });
}));

// ---------- generate controlled documents from the planner ----------
r.post(P + "/delivery/generate", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ kind: z.enum(["midp", "tidp", "resp-matrix", "risk-register", "info-uses", "mrm", "minutes", "progress-report"]), taskTeamId: z.string().optional(), meetingId: z.string().optional() }), req.body, res); if (!body) return;
  const pid = req.params.projectId; const uid = req.user!.id;
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, pid));
  const b = await bundle(pid);
  const team = new Map(b.teams.map((t) => [t.id, t]));
  const ms = new Map(b.milestones.map((m) => [m.id, m]));
  const t = templateById(body.kind)!;
  const values = initialValues(t, project);
  let title = t.title;

  if (body.kind === "midp") {
    values.milestones = b.milestones.map((m) => [m.name, m.date, m.description]);
    values.plan = b.deliverables.map((d) => [team.get(d.taskTeamId)?.name ?? "", d.containerName || d.title, d.loin, d.dueDate, ms.get(d.milestoneId ?? "")?.name ?? "", d.status.replace("_", " ")]);
  } else if (body.kind === "tidp") {
    const tt = body.taskTeamId ? team.get(body.taskTeamId) : undefined;
    if (!tt) return res.status(400).json({ error: "Choose a task team." });
    title = `${t.title} — ${tt.name}`;
    values.taskTeam = tt.name;
    const byId = new Map(b.deliverables.map((d) => [d.id, d]));
    values.containers = b.deliverables.filter((d) => d.taskTeamId === tt.id).map((d) => [
      d.containerName, d.title, d.loin, d.startDate && d.dueDate ? String(Math.max(0, Math.round((Date.parse(d.dueDate) - Date.parse(d.startDate)) / 864e5))) : "",
      d.dependsOn.map((x) => byId.get(x)?.containerName || byId.get(x)?.title).filter(Boolean).join(", "), d.dueDate, ms.get(d.milestoneId ?? "")?.name ?? "",
    ]);
  } else if (body.kind === "risk-register") {
    const risks = await db.select().from(schema.risks).where(eq(schema.risks.projectId, pid)).orderBy(asc(schema.risks.number));
    const names = new Map((await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users)).map((u) => [u.id, u.name]));
    values.risks = risks.filter((x) => x.status !== "Closed").map((x) => [`R${String(x.number).padStart(2, "0")}`, x.title, String(x.likelihood), String(x.impact), String(x.likelihood * x.impact), x.mitigation, names.get(x.ownerId ?? "") ?? ""]);
  } else if (body.kind === "minutes") {
    const [m] = await db.select().from(schema.meetings).where(and(eq(schema.meetings.id, body.meetingId ?? ""), eq(schema.meetings.projectId, pid)));
    if (!m) return res.status(400).json({ error: "Choose a meeting." });
    const names = new Map((await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users)).map((u) => [u.id, u.name]));
    title = `${t.title} — ${m.title} (#${m.number})`;
    Object.assign(values, { meetingType: m.type, meetingDate: m.date.replace("T", " "), location: m.location, attendees: m.attendees.join("\n") });
    values.agenda = m.agenda.map((a, i) => [String(i + 1), a.item, a.presenter, a.minutes]);
    values.actions = m.actions.map((a, i) => [String(i + 1), a.text, names.get(a.ownerId) ?? "", a.due, a.status]);
  } else if (body.kind === "progress-report") {
    const day = today();
    const names = new Map((await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users)).map((u) => [u.id, u.name]));
    const st = planStats(b.deliverables, day);
    title = `${t.title} — ${day}`;
    values.period = day;
    values.delivery = [["Information containers planned", String(st.total)], ["Published", String(st.published)], ["Shared", String(st.shared)], ["In progress", String(st.inProgress)], ["Not started", String(st.planned)], ["Overdue", String(st.overdue)], ["Overall progress", `${st.progress}%`]];
    values.overdue = b.deliverables.filter((d) => d.dueDate && d.dueDate < day && d.status !== "published").map((d) => [d.containerName || d.title, team.get(d.taskTeamId)?.name ?? "", d.dueDate, d.status.replace("_", " ")]);
    const reviews = await db.select().from(schema.modelReviews).where(and(eq(schema.modelReviews.projectId, pid), eq(schema.modelReviews.status, "Completed")));
    const latest = new Map<string, typeof reviews[number]>(); for (const rv of reviews.sort((a, z2) => a.number - z2.number)) latest.set(rv.discipline, rv);
    values.quality = [...latest.values()].map((rv) => [rv.discipline, rv.title, rv.grade, `${rv.score}%`]);
    const iss = await db.select().from(schema.issues).where(eq(schema.issues.projectId, pid));
    values.coordination = [...new Set(iss.map((i) => i.priority))].map((p) => [p, String(iss.filter((i) => i.priority === p && i.status !== "Closed").length), String(iss.filter((i) => i.priority === p && i.status === "Closed").length)]);
    const risks = await db.select().from(schema.risks).where(eq(schema.risks.projectId, pid));
    values.risks = risks.filter((x) => x.status !== "Closed").sort((a, z2) => z2.likelihood * z2.impact - a.likelihood * a.impact).slice(0, 5).map((x) => [`R${String(x.number).padStart(2, "0")}`, x.title, String(x.likelihood * x.impact), names.get(x.ownerId ?? "") ?? ""]);
    const mts = await db.select().from(schema.meetings).where(eq(schema.meetings.projectId, pid));
    const lastByType = new Map<string, typeof mts[number]>(); for (const m of mts.sort((a, z2) => a.number - z2.number)) lastByType.set(m.type, m);
    values.actions = [...lastByType.values()].flatMap((m) => m.actions.filter((a) => a.status !== "Done").map((a) => [m.title, a.text, names.get(a.ownerId) ?? "", a.due]));
  } else if (body.kind === "mrm") {
    if (!b.mrm.length) return res.status(400).json({ error: "Add elements to the model responsibility matrix first." });
    values.mrm = b.mrm.flatMap((row) => b.milestones.filter((m) => row.cells[m.id]?.lod || row.cells[m.id]?.teamId)
      .map((m) => [row.discipline, row.system, row.element, m.name, team.get(row.cells[m.id].teamId)?.name ?? "", row.cells[m.id].lod ? `LOD ${row.cells[m.id].lod}` : ""]));
  } else if (body.kind === "info-uses") {
    const uses = project.infoUses ?? [];
    if (!uses.length) return res.status(400).json({ error: "Select the project's information uses first." });
    values.uses = uses.map((x) => { const d = useByCode(x.code)!; return [d.code, d.name, d.phases.join(", "), x.priority, x.taskTeams.map((id) => team.get(id)?.name).filter(Boolean).join(", "), d.deliverables.join("; "), d.loin, x.notes]; });
  } else {
    // ISO 19650 detailed responsibility matrix: R/A/C/I per task team flattened into columns
    const nameOf = (code: string, row: typeof b.responsibility[number]) => Object.entries(row.cells).filter(([, v]) => v.includes(code)).map(([k]) => team.get(k)?.name).filter(Boolean).join(", ");
    values.matrix = b.responsibility.map((row) => [row.item, row.stage, nameOf("R", row), nameOf("A", row), nameOf("C", row), nameOf("I", row), row.loin]);
  }

  // Update the open (WIP) generated document if there is one, otherwise create a new one.
  const existing = (await db.select().from(schema.documents).where(and(eq(schema.documents.projectId, pid), eq(schema.documents.templateId, t.id))))
    .find((d) => d.state === "WIP" && d.title === title);
  const now = new Date();
  if (existing) {
    const lockedByOther = existing.lockedBy && existing.lockedBy !== uid && existing.lockedAt && now.getTime() - existing.lockedAt.getTime() < 90_000;
    if (lockedByOther) return res.status(423).json({ error: "Someone is editing that document right now. Try again shortly." });
    const generatedKeys = body.kind === "midp" ? ["milestones", "plan"] : body.kind === "tidp" ? ["taskTeam", "containers"] : body.kind === "risk-register" ? ["risks"] : body.kind === "info-uses" ? ["uses"] : body.kind === "mrm" ? ["mrm"] : body.kind === "minutes" ? ["meetingType", "meetingDate", "location", "attendees", "agenda", "actions"] : body.kind === "progress-report" ? ["period", "delivery", "overdue", "quality", "coordination", "risks", "actions"] : ["matrix"];
    const merged = { ...(existing.values as object), ...Object.fromEntries(generatedKeys.map((k) => [k, values[k]])) };
    await db.update(schema.documents).set({ values: merged, updatedAt: now }).where(eq(schema.documents.id, existing.id));
    await logActivity(pid, uid, "document.generated", `Regenerated ${title} from the delivery planner`, `/projects/${pid}/documents/${existing.id}`);
    return res.json({ id: existing.id, updated: true });
  }
  const id = newId();
  // one-off records (minutes, reports) take the next free number in their series
  const seriesBase = ({ midp: 1, tidp: 2, "resp-matrix": 3, "risk-register": 4, "info-uses": 5, mrm: 6, minutes: 100, "progress-report": 200 } as const)[body.kind];
  const seq = ["minutes", "progress-report"].includes(body.kind)
    ? seriesBase + (await db.select({ id: schema.documents.id }).from(schema.documents).where(and(eq(schema.documents.projectId, pid), eq(schema.documents.templateId, t.id)))).length + 1
    : seriesBase;
  const container = `${project.code}-${(body.taskTeamId && team.get(body.taskTeamId)?.originatorCode) || "XXX"}-ZZ-ZZ-${["minutes", "progress-report"].includes(body.kind) ? "MI" : "SH"}-Z-${String(seq).padStart(4, "0")}`;
  await db.insert(schema.documents).values({ id, projectId: pid, templateId: t.id, title, containerName: container, revision: "P01.01", state: "WIP", suitability: "S0", authorId: uid, values, createdAt: now, updatedAt: now });
  await db.insert(schema.documentRevisions).values({ id: newId(), documentId: id, revision: "P01.01", state: "WIP", suitability: "S0", note: "Generated from the delivery planner", values, authorId: uid, createdAt: now });
  await logActivity(pid, uid, "document.generated", `Generated ${title} from the delivery planner`, `/projects/${pid}/documents/${id}`);
  res.status(201).json({ id, updated: false });
}));

// ---------- quality report ----------
r.get(P + "/quality", requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, pid));
  const docs = await db.select().from(schema.documents).where(eq(schema.documents.projectId, pid));
  const b = await bundle(pid);
  const documents = docs.filter((d) => d.state !== "ARCHIVED").map((d) => {
    const t = templateById(d.templateId);
    const findings = t ? checkDocument(t, d.values, { containerName: d.containerName, projectCode: project.code }) : [];
    return { id: d.id, title: d.title, templateId: d.templateId, state: d.state, revision: d.revision, score: qualityScore(findings), findings };
  }).sort((a, z2) => a.score - z2.score);
  const plan = analysePlan({ deliverables: b.deliverables, milestones: b.milestones, teams: b.teams, projectCode: project.code, today: today() });
  const set = checkProjectSet({ standards: project.standards, docs, milestoneCount: b.milestones.length, planCount: b.deliverables.length });
  const all = [...set, ...plan, ...documents.flatMap((d) => d.findings)];
  res.json({ score: qualityScore(set.concat(plan)) * 0.4 + (documents.length ? documents.reduce((s, d) => s + d.score, 0) / documents.length : 0) * 0.6,
    counts: { error: all.filter((f) => f.severity === "error").length, warning: all.filter((f) => f.severity === "warning").length, info: all.filter((f) => f.severity === "info").length },
    set, plan: { score: qualityScore(plan), findings: plan }, documents });
}));

export default r;
