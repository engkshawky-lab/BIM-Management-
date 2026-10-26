import { assertCanAddMember, assertCanCreateProject } from "../billing";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { ROLES, logActivity, notify, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { h, parse, sentKeys } from "./auth";

const r = Router();

const DEFAULT_FOLDERS: [string, string | null][] = [
  ["00 WIP", "WIP"], ["01 Shared", "SHARED"], ["02 Published", "PUBLISHED"], ["03 Archived", "ARCHIVED"],
  ["04 Client information", null], ["05 Reference", null],
];

const projectSchema = z.object({
  name: z.string().trim().min(2).max(200),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,6}$/, "2–6 letters or digits"),
  description: z.string().max(5000).default(""),
  appointingParty: z.string().trim().max(200).default(""),
  location: z.string().trim().max(200).default(""),
  standards: z.array(z.enum(["iso19650", "iso42001"])).min(1),
  stage: z.string().trim().max(60).default(""),
});

r.get("/projects", h(async (req, res) => {
  const rows = await db.select({ project: schema.projects, role: schema.projectMembers.role }).from(schema.projectMembers)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.projectMembers.projectId))
    .where(eq(schema.projectMembers.userId, req.user!.id)).orderBy(desc(schema.projects.updatedAt));
  const ids = rows.map((x) => x.project.id);
  const counts = async (table: typeof schema.documents | typeof schema.files | typeof schema.projectMembers) => {
    if (!ids.length) return new Map<string, number>();
    const res = await db.select({ id: table.projectId, n: count() }).from(table).where(inArray(table.projectId, ids)).groupBy(table.projectId);
    return new Map(res.map((x) => [x.id, x.n]));
  };
  const [docs, files, members] = await Promise.all([counts(schema.documents), counts(schema.files), counts(schema.projectMembers)]);
  res.json({ projects: rows.map((x) => ({ ...x.project, role: x.role, documents: docs.get(x.project.id) ?? 0, files: files.get(x.project.id) ?? 0, members: members.get(x.project.id) ?? 0 })) });
}));

r.post("/projects", h(async (req, res) => {
  const body = parse(projectSchema, req.body, res); if (!body) return;
  const id = newId(); const now = new Date(); const uid = req.user!.id;
  await assertCanCreateProject(uid);
  await db.transaction(async (tx) => {
    await tx.insert(schema.projects).values({ id, ...body, ownerId: uid, createdAt: now, updatedAt: now });
    await tx.insert(schema.projectMembers).values({ projectId: id, userId: uid, role: "owner", joinedAt: now });
    await tx.insert(schema.folders).values(DEFAULT_FOLDERS.map(([name, cdeState]) => ({ id: newId(), projectId: id, parentId: null, name, cdeState, createdBy: uid, createdAt: now })));
  });
  await logActivity(id, uid, "project.created", `Created project ${body.code} — ${body.name}`);
  res.status(201).json({ id });
}));

r.get("/projects/:projectId", requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, pid));
  const members = await db.select({
    userId: schema.users.id, name: schema.users.name, email: schema.users.email, organization: schema.users.organization,
    jobTitle: schema.users.jobTitle, role: schema.projectMembers.role, joinedAt: schema.projectMembers.joinedAt,
  }).from(schema.projectMembers).innerJoin(schema.users, eq(schema.users.id, schema.projectMembers.userId)).where(eq(schema.projectMembers.projectId, pid));
  const invitations = await db.select().from(schema.invitations).where(and(eq(schema.invitations.projectId, pid), isNull(schema.invitations.acceptedAt)));
  res.json({ project, members, invitations, role: req.projectRole });
}));

r.put("/projects/:projectId", requireProject("manager"), h(async (req, res) => {
  const parsed = parse(projectSchema.partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  await db.update(schema.projects).set({ ...body, updatedAt: new Date() }).where(eq(schema.projects.id, req.params.projectId));
  await logActivity(req.params.projectId, req.user!.id, "project.updated", "Updated project details");
  res.json({ ok: true });
}));

r.delete("/projects/:projectId", requireProject("owner"), h(async (req, res) => {
  const pid = req.params.projectId;
  const docIds = (await db.select({ id: schema.documents.id }).from(schema.documents).where(eq(schema.documents.projectId, pid))).map((d) => d.id);
  const fileIds = (await db.select({ id: schema.files.id }).from(schema.files).where(eq(schema.files.projectId, pid))).map((f) => f.id);
  await db.transaction(async (tx) => {
    if (docIds.length) await tx.delete(schema.documentRevisions).where(inArray(schema.documentRevisions.documentId, docIds));
    if (fileIds.length) await tx.delete(schema.fileVersions).where(inArray(schema.fileVersions.fileId, fileIds));
    for (const t of [schema.documents, schema.files, schema.folders, schema.comments, schema.activity, schema.invitations, schema.projectMembers, schema.workflowProgress, schema.taskTeams, schema.milestones, schema.deliverables, schema.responsibilityRows, schema.loinRows, schema.validationRuns, schema.issues, schema.clashTests, schema.risks, schema.handoverItems] as const)
      await tx.delete(t).where(eq(t.projectId, pid));
    await tx.delete(schema.projects).where(eq(schema.projects.id, pid));
  });
  // Stored file blobs are left for an offline cleanup job; they are unreachable once rows are gone.
  res.json({ ok: true });
}));

// ---------- members ----------
const roleSchema = z.enum(["viewer", "editor", "manager"]);

r.post("/projects/:projectId/members", requireProject("manager"), h(async (req, res) => {
  const body = parse(z.object({ email: z.string().trim().toLowerCase().email(), role: roleSchema }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  await assertCanAddMember(pid);
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, pid));
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, body.email));
  if (user) {
    const [existing] = await db.select().from(schema.projectMembers).where(and(eq(schema.projectMembers.projectId, pid), eq(schema.projectMembers.userId, user.id)));
    if (existing) return res.status(409).json({ error: `${user.name} is already a member.` });
    await db.insert(schema.projectMembers).values({ projectId: pid, userId: user.id, role: body.role, joinedAt: new Date() });
    await notify(pid, req.user!.id, `${req.user!.name} added you to ${project.code} — ${project.name} as ${body.role}`, `/projects/${pid}`, user.id);
    await logActivity(pid, req.user!.id, "member.added", `Added ${user.name} as ${body.role}`);
    return res.status(201).json({ added: true });
  }
  await db.insert(schema.invitations).values({ id: newId(), projectId: pid, email: body.email, role: body.role, invitedBy: req.user!.id, createdAt: new Date() });
  await logActivity(pid, req.user!.id, "member.invited", `Invited ${body.email} as ${body.role}`);
  res.status(201).json({ invited: true });
}));

r.put("/projects/:projectId/members/:userId", requireProject("manager"), h(async (req, res) => {
  const body = parse(z.object({ role: roleSchema }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const [m] = await db.select().from(schema.projectMembers).where(and(eq(schema.projectMembers.projectId, pid), eq(schema.projectMembers.userId, req.params.userId)));
  if (!m) return res.status(404).json({ error: "Member not found." });
  if (m.role === "owner") return res.status(400).json({ error: "The owner's role cannot be changed." });
  await db.update(schema.projectMembers).set({ role: body.role }).where(and(eq(schema.projectMembers.projectId, pid), eq(schema.projectMembers.userId, m.userId)));
  await notify(pid, req.user!.id, `Your role was changed to ${body.role}`, `/projects/${pid}`, m.userId);
  res.json({ ok: true });
}));

r.delete("/projects/:projectId/members/:userId", requireProject("viewer"), h(async (req, res) => {
  const pid = req.params.projectId; const self = req.params.userId === req.user!.id;
  if (!self && !["manager", "owner"].includes(req.projectRole!)) return res.status(403).json({ error: "Only managers can remove members." });
  const [m] = await db.select().from(schema.projectMembers).where(and(eq(schema.projectMembers.projectId, pid), eq(schema.projectMembers.userId, req.params.userId)));
  if (!m) return res.status(404).json({ error: "Member not found." });
  if (m.role === "owner") return res.status(400).json({ error: "The owner cannot be removed." });
  await db.delete(schema.projectMembers).where(and(eq(schema.projectMembers.projectId, pid), eq(schema.projectMembers.userId, m.userId)));
  await logActivity(pid, req.user!.id, "member.removed", self ? "Left the project" : "Removed a member");
  res.json({ ok: true });
}));

r.delete("/projects/:projectId/invitations/:id", requireProject("manager"), h(async (req, res) => {
  await db.delete(schema.invitations).where(and(eq(schema.invitations.projectId, req.params.projectId), eq(schema.invitations.id, req.params.id)));
  res.json({ ok: true });
}));

// ---------- activity ----------
r.get("/projects/:projectId/activity", requireProject(), h(async (req, res) => {
  const rows = await db.select({ a: schema.activity, name: schema.users.name }).from(schema.activity)
    .leftJoin(schema.users, eq(schema.users.id, schema.activity.userId))
    .where(eq(schema.activity.projectId, req.params.projectId)).orderBy(desc(schema.activity.createdAt)).limit(100);
  res.json({ activity: rows.map((x) => ({ ...x.a, userName: x.name ?? "Unknown" })) });
}));

// ---------- workflow progress ----------
r.get("/projects/:projectId/workflow/:workflowId", requireProject(), h(async (req, res) => {
  const [row] = await db.select().from(schema.workflowProgress).where(and(eq(schema.workflowProgress.projectId, req.params.projectId), eq(schema.workflowProgress.workflowId, req.params.workflowId)));
  res.json({ data: row?.data ?? { activities: {}, gates: {} } });
}));

const progressSchema = z.object({
  activities: z.record(z.string(), z.enum(["todo", "doing", "done"])),
  gates: z.record(z.string(), z.object({ approved: z.boolean(), by: z.string().max(120), date: z.string().max(20), note: z.string().max(500) })),
});

r.put("/projects/:projectId/workflow/:workflowId", requireProject("editor"), h(async (req, res) => {
  const body = parse(progressSchema, req.body, res); if (!body) return;
  const { projectId, workflowId } = req.params;
  const [prev] = await db.select().from(schema.workflowProgress).where(and(eq(schema.workflowProgress.projectId, projectId), eq(schema.workflowProgress.workflowId, workflowId)));
  const prevGates = (prev?.data as z.infer<typeof progressSchema> | undefined)?.gates ?? {};
  // Approving or revoking a gate is a management decision.
  const gatesChanged = JSON.stringify(prevGates) !== JSON.stringify(body.gates);
  if (gatesChanged && !["manager", "owner"].includes(req.projectRole!)) return res.status(403).json({ error: "Only managers can approve stage gates." });
  const now = new Date();
  await db.insert(schema.workflowProgress).values({ projectId, workflowId, data: body, updatedBy: req.user!.id, updatedAt: now })
    .onDuplicateKeyUpdate({ set: { data: body, updatedBy: req.user!.id, updatedAt: now } });
  for (const [stage, g] of Object.entries(body.gates)) if (g.approved && !prevGates[stage]?.approved) {
    await logActivity(projectId, req.user!.id, "gate.approved", `Approved workflow gate ${stage} (${workflowId})`, `/projects/${projectId}/workflow`);
    await notify(projectId, req.user!.id, `${req.user!.name} approved a stage gate`, `/projects/${projectId}/workflow`);
  }
  res.json({ ok: true });
}));

export { ROLES };
export default r;
