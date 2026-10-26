import { and, asc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { templateById } from "../../shared/data/templates";
import { analysePlan, planStats, qualityScore, type Deliverable } from "../../shared/delivery";
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
  const [teams, milestones, deliverables, responsibility, loin] = await Promise.all([
    db.select().from(schema.taskTeams).where(eq(schema.taskTeams.projectId, pid)).orderBy(asc(schema.taskTeams.name)),
    db.select().from(schema.milestones).where(eq(schema.milestones.projectId, pid)).orderBy(asc(schema.milestones.date)),
    db.select().from(schema.deliverables).where(eq(schema.deliverables.projectId, pid)).orderBy(asc(schema.deliverables.dueDate), asc(schema.deliverables.containerName)),
    db.select().from(schema.responsibilityRows).where(eq(schema.responsibilityRows.projectId, pid)).orderBy(asc(schema.responsibilityRows.sortOrder), asc(schema.responsibilityRows.createdAt)),
    db.select().from(schema.loinRows).where(eq(schema.loinRows.projectId, pid)).orderBy(asc(schema.loinRows.ref)),
  ]);
  return { teams, milestones, deliverables: deliverables as (typeof deliverables[number] & Deliverable)[], responsibility, loin };
}

r.get(P + "/delivery", requireProject(), h(async (req, res) => {
  const b = await bundle(req.params.projectId);
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, req.params.projectId));
  const findings = analysePlan({ deliverables: b.deliverables, milestones: b.milestones, teams: b.teams, projectCode: project.code, today: today() });
  res.json({ ...b, stats: planStats(b.deliverables, today()), findings });
}));

// ---------- generic CRUD for the planning tables ----------
type Table = typeof schema.taskTeams | typeof schema.milestones | typeof schema.deliverables | typeof schema.responsibilityRows | typeof schema.loinRows;

function crud<S extends z.ZodObject>(path: string, table: Table, shape: S, label: (row: z.infer<S>) => string, hooks: {
  beforeDelete?: (pid: string, id: string) => Promise<string | void>;
  validate?: (pid: string, row: Partial<z.infer<S>>) => Promise<string | void>;
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
    const body = sentKeys(parsed, req.body) as Partial<z.infer<S>>;
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
}), (d) => `container ${d.containerName || d.title}`, {
  validate: sameProject,
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

// ---------- generate controlled documents from the planner ----------
r.post(P + "/delivery/generate", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ kind: z.enum(["midp", "tidp", "resp-matrix", "risk-register"]), taskTeamId: z.string().optional() }), req.body, res); if (!body) return;
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
    const generatedKeys = body.kind === "midp" ? ["milestones", "plan"] : body.kind === "tidp" ? ["taskTeam", "containers"] : body.kind === "risk-register" ? ["risks"] : ["matrix"];
    const merged = { ...(existing.values as object), ...Object.fromEntries(generatedKeys.map((k) => [k, values[k]])) };
    await db.update(schema.documents).set({ values: merged, updatedAt: now }).where(eq(schema.documents.id, existing.id));
    await logActivity(pid, uid, "document.generated", `Regenerated ${title} from the delivery planner`, `/projects/${pid}/documents/${existing.id}`);
    return res.json({ id: existing.id, updated: true });
  }
  const id = newId();
  const container = `${project.code}-${(body.taskTeamId && team.get(body.taskTeamId)?.originatorCode) || "XXX"}-ZZ-ZZ-SH-Z-${({ midp: "0001", tidp: "0002", "resp-matrix": "0003", "risk-register": "0004" } as const)[body.kind]}`;
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
