import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { templateById } from "../../shared/data/templates";
import { SUITABILITY, initialValues, nextRevision, type CdeState } from "../../shared/documents";
import { atLeast, logActivity, memberRole, notify, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { h, parse } from "./auth";

const r = Router();
const P = "/projects/:projectId";
const LOCK_MS = 90_000;
const link = (pid: string, docId: string) => `/projects/${pid}/documents/${docId}`;

async function getDoc(projectId: string, id: string) {
  const [d] = await db.select().from(schema.documents).where(and(eq(schema.documents.id, id), eq(schema.documents.projectId, projectId)));
  return d;
}
const lockActive = (d: typeof schema.documents.$inferSelect) => !!d.lockedBy && !!d.lockedAt && Date.now() - d.lockedAt.getTime() < LOCK_MS;

async function userName(id: string | null) {
  if (!id) return null;
  const [u] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, id));
  return u?.name ?? null;
}

r.get(P + "/documents", requireProject(), h(async (req, res) => {
  const rows = await db.select({ d: schema.documents, author: schema.users.name }).from(schema.documents)
    .leftJoin(schema.users, eq(schema.users.id, schema.documents.authorId))
    .where(eq(schema.documents.projectId, req.params.projectId)).orderBy(desc(schema.documents.updatedAt));
  // Values are heavy and not needed for the list.
  res.json({ documents: rows.map(({ d, author }) => ({ ...d, values: undefined, authorName: author ?? "" })) });
}));

r.post(P + "/documents", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ templateId: z.string(), title: z.string().trim().max(255).optional(), containerName: z.string().trim().max(120).default("") }), req.body, res); if (!body) return;
  const t = templateById(body.templateId);
  if (!t) return res.status(400).json({ error: "Unknown template." });
  const pid = req.params.projectId;
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, pid));
  const id = newId(); const now = new Date(); const uid = req.user!.id;
  const values = initialValues(t, project);
  await db.insert(schema.documents).values({
    id, projectId: pid, templateId: t.id, title: body.title || t.title, containerName: body.containerName,
    revision: "P01.01", state: "WIP", suitability: "S0", authorId: uid, values, createdAt: now, updatedAt: now,
  });
  await db.insert(schema.documentRevisions).values({ id: newId(), documentId: id, revision: "P01.01", state: "WIP", suitability: "S0", note: `Created from template ${t.code}`, values, authorId: uid, createdAt: now });
  await logActivity(pid, uid, "document.created", `Created ${t.code}: ${body.title || t.title}`, link(pid, id));
  res.status(201).json({ id });
}));

r.get(P + "/documents/:docId", requireProject(), h(async (req, res) => {
  const d = await getDoc(req.params.projectId, req.params.docId);
  if (!d) return res.status(404).json({ error: "Document not found." });
  const revisions = await db.select({
    id: schema.documentRevisions.id, revision: schema.documentRevisions.revision, state: schema.documentRevisions.state,
    suitability: schema.documentRevisions.suitability, note: schema.documentRevisions.note, createdAt: schema.documentRevisions.createdAt, authorName: schema.users.name,
  }).from(schema.documentRevisions).leftJoin(schema.users, eq(schema.users.id, schema.documentRevisions.authorId))
    .where(eq(schema.documentRevisions.documentId, d.id)).orderBy(schema.documentRevisions.createdAt);
  res.json({
    document: d, revisions,
    authorName: await userName(d.authorId), reviewerName: await userName(d.reviewerId),
    lock: lockActive(d) ? { userId: d.lockedBy, name: await userName(d.lockedBy), at: d.lockedAt } : null,
  });
}));

// Soft edit lock: the editor heartbeats this while the document is open for editing.
r.post(P + "/documents/:docId/lock", requireProject("editor"), h(async (req, res) => {
  const d = await getDoc(req.params.projectId, req.params.docId);
  if (!d) return res.status(404).json({ error: "Document not found." });
  if (lockActive(d) && d.lockedBy !== req.user!.id) return res.status(423).json({ error: `${await userName(d.lockedBy)} is editing this document.`, lockedBy: await userName(d.lockedBy) });
  await db.update(schema.documents).set({ lockedBy: req.user!.id, lockedAt: new Date() }).where(eq(schema.documents.id, d.id));
  res.json({ ok: true });
}));

// sendBeacon on page unload can only POST.
r.post(P + "/documents/:docId/lock-release", requireProject("editor"), h(async (req, res) => {
  await db.update(schema.documents).set({ lockedBy: null, lockedAt: null })
    .where(and(eq(schema.documents.id, req.params.docId), eq(schema.documents.lockedBy, req.user!.id)));
  res.json({ ok: true });
}));

r.delete(P + "/documents/:docId/lock", requireProject("editor"), h(async (req, res) => {
  await db.update(schema.documents).set({ lockedBy: null, lockedAt: null })
    .where(and(eq(schema.documents.id, req.params.docId), eq(schema.documents.lockedBy, req.user!.id)));
  res.json({ ok: true });
}));

r.put(P + "/documents/:docId", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({
    title: z.string().trim().min(1).max(255),
    containerName: z.string().trim().max(120),
    values: z.record(z.string(), z.union([z.string().max(50_000), z.array(z.array(z.string().max(5000)).max(60)).max(500)])),
  }).partial(), req.body, res); if (!body) return;
  const d = await getDoc(req.params.projectId, req.params.docId);
  if (!d) return res.status(404).json({ error: "Document not found." });
  if (d.state !== "WIP") return res.status(409).json({ error: "Only work-in-progress documents can be edited. Start a new revision first." });
  if (lockActive(d) && d.lockedBy !== req.user!.id) return res.status(423).json({ error: `${await userName(d.lockedBy)} is editing this document.` });
  const values = body.values ? { ...(d.values as object), ...body.values } : undefined;
  await db.update(schema.documents).set({
    ...(body.title ? { title: body.title } : {}), ...(body.containerName !== undefined ? { containerName: body.containerName } : {}),
    ...(values ? { values } : {}), lockedBy: req.user!.id, lockedAt: new Date(), updatedAt: new Date(),
  }).where(eq(schema.documents.id, d.id));
  res.json({ ok: true, updatedAt: new Date() });
}));

const transitionSchema = z.object({
  to: z.enum(["WIP", "SHARED", "PUBLISHED", "ARCHIVED"]),
  suitability: z.string().max(8).optional(),
  note: z.string().trim().min(1).max(500),
});

r.post(P + "/documents/:docId/transition", requireProject("editor"), h(async (req, res) => {
  const body = parse(transitionSchema, req.body, res); if (!body) return;
  const pid = req.params.projectId; const uid = req.user!.id;
  const d = await getDoc(pid, req.params.docId);
  if (!d) return res.status(404).json({ error: "Document not found." });
  const from = d.state as CdeState; const to = body.to;
  const allowed: Record<CdeState, CdeState[]> = { WIP: ["WIP", "SHARED"], SHARED: ["WIP", "PUBLISHED"], PUBLISHED: ["WIP", "ARCHIVED"], ARCHIVED: [] };
  if (!allowed[from].includes(to)) return res.status(409).json({ error: `Cannot move from ${from} to ${to}.` });

  // ISO 19650-2 5.6.4 / 5.7: sharing needs a reviewer or manager; authorization and archiving need a manager.
  const manager = atLeast(req.projectRole, "manager");
  if (to === "SHARED" && !manager && d.reviewerId !== uid) return res.status(403).json({ error: "Approving for sharing needs the assigned reviewer or a manager. Request a review instead." });
  if ((to === "PUBLISHED" || to === "ARCHIVED") && !manager) return res.status(403).json({ error: "Only managers can authorize, publish or archive." });

  const suitability = to === "WIP" ? "S0" : body.suitability && SUITABILITY[to].includes(body.suitability) ? body.suitability : SUITABILITY[to][0];
  const revision = to === "ARCHIVED" ? d.revision : nextRevision(d.revision, to);
  const now = new Date();
  await db.update(schema.documents).set({
    state: to, suitability, revision, updatedAt: now, lockedBy: null, lockedAt: null,
    // The review belongs to the revision: keep it through sharing/publishing, reset when a new revision starts.
    ...(to === "WIP" && from !== "WIP" ? { reviewStatus: "none", reviewerId: null } : {}),
  }).where(eq(schema.documents.id, d.id));
  await db.insert(schema.documentRevisions).values({ id: newId(), documentId: d.id, revision, state: to, suitability, note: body.note, values: d.values, authorId: uid, createdAt: now });
  const msg = from === to ? `Saved ${d.title} as ${revision}` : `${d.title}: ${from} → ${to} (${suitability}, ${revision})`;
  await logActivity(pid, uid, "document.transition", msg, link(pid, d.id));
  if (from !== to) await notify(pid, uid, `${req.user!.name}: ${msg}`, link(pid, d.id));
  res.json({ ok: true, revision, state: to, suitability });
}));

r.post(P + "/documents/:docId/review-request", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ reviewerId: z.string(), message: z.string().max(500).default("") }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const d = await getDoc(pid, req.params.docId);
  if (!d) return res.status(404).json({ error: "Document not found." });
  if (d.state !== "WIP") return res.status(409).json({ error: "Reviews are requested on WIP documents." });
  const role = await memberRole(pid, body.reviewerId);
  if (!role || !atLeast(role, "editor")) return res.status(400).json({ error: "Reviewer must be a project member with editor role or higher." });
  await db.update(schema.documents).set({ reviewerId: body.reviewerId, reviewStatus: "requested", updatedAt: new Date() }).where(eq(schema.documents.id, d.id));
  await notify(pid, req.user!.id, `${req.user!.name} asked you to review ${d.title}${body.message ? `: ${body.message}` : ""}`, link(pid, d.id), body.reviewerId);
  await logActivity(pid, req.user!.id, "document.review_requested", `Requested review of ${d.title} from ${await userName(body.reviewerId)}`, link(pid, d.id));
  res.json({ ok: true });
}));

r.post(P + "/documents/:docId/review", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ decision: z.enum(["approved", "changes"]), note: z.string().trim().max(2000).default("") }), req.body, res); if (!body) return;
  const pid = req.params.projectId; const uid = req.user!.id;
  const d = await getDoc(pid, req.params.docId);
  if (!d) return res.status(404).json({ error: "Document not found." });
  if (d.reviewerId !== uid && !atLeast(req.projectRole, "manager")) return res.status(403).json({ error: "You are not the reviewer of this document." });
  await db.update(schema.documents).set({ reviewStatus: body.decision, updatedAt: new Date() }).where(eq(schema.documents.id, d.id));
  if (body.note) await db.insert(schema.comments).values({ id: newId(), projectId: pid, documentId: d.id, userId: uid, body: `Review — ${body.decision === "approved" ? "approved" : "changes requested"}: ${body.note}`, createdAt: new Date() });
  const msg = `${req.user!.name} ${body.decision === "approved" ? "approved" : "requested changes to"} ${d.title}`;
  await notify(pid, uid, msg, link(pid, d.id), d.authorId);
  await logActivity(pid, uid, "document.reviewed", msg, link(pid, d.id));
  res.json({ ok: true });
}));

r.get(P + "/documents/:docId/revisions/:revId", requireProject(), h(async (req, res) => {
  const d = await getDoc(req.params.projectId, req.params.docId);
  if (!d) return res.status(404).json({ error: "Document not found." });
  const [rev] = await db.select().from(schema.documentRevisions).where(and(eq(schema.documentRevisions.id, req.params.revId), eq(schema.documentRevisions.documentId, d.id)));
  if (!rev) return res.status(404).json({ error: "Revision not found." });
  res.json({ revision: rev });
}));

r.delete(P + "/documents/:docId", requireProject("manager"), h(async (req, res) => {
  const pid = req.params.projectId;
  const d = await getDoc(pid, req.params.docId);
  if (!d) return res.status(404).json({ error: "Document not found." });
  await db.delete(schema.documentRevisions).where(eq(schema.documentRevisions.documentId, d.id));
  await db.delete(schema.comments).where(eq(schema.comments.documentId, d.id));
  await db.delete(schema.documents).where(eq(schema.documents.id, d.id));
  await logActivity(pid, req.user!.id, "document.deleted", `Deleted ${d.title}`);
  res.json({ ok: true });
}));

// ---------- comments (documents and files) ----------
r.get(P + "/comments", requireProject(), h(async (req, res) => {
  const { documentId, fileId, issueId } = req.query as Record<string, string | undefined>;
  if (!documentId && !fileId && !issueId) return res.status(400).json({ error: "documentId, fileId or issueId is required." });
  const target = documentId ? eq(schema.comments.documentId, documentId) : fileId ? eq(schema.comments.fileId, fileId) : eq(schema.comments.issueId, issueId!);
  const rows = await db.select({ c: schema.comments, name: schema.users.name }).from(schema.comments)
    .leftJoin(schema.users, eq(schema.users.id, schema.comments.userId))
    .where(and(eq(schema.comments.projectId, req.params.projectId), target)).orderBy(schema.comments.createdAt);
  res.json({ comments: rows.map((x) => ({ ...x.c, userName: x.name ?? "Unknown" })) });
}));

r.post(P + "/comments", requireProject("viewer"), h(async (req, res) => {
  const body = parse(z.object({ documentId: z.string().optional(), fileId: z.string().optional(), issueId: z.string().optional(), sectionId: z.string().max(60).optional(), body: z.string().trim().min(1).max(5000) })
    .refine((b) => [b.documentId, b.fileId, b.issueId].filter(Boolean).length === 1, "Exactly one of documentId, fileId or issueId"), req.body, res); if (!body) return;
  const pid = req.params.projectId; const uid = req.user!.id;
  let title = ""; let to: string | undefined; let target = "";
  if (body.documentId) {
    const d = await getDoc(pid, body.documentId); if (!d) return res.status(404).json({ error: "Document not found." });
    title = d.title; to = d.authorId; target = link(pid, d.id);
  } else if (body.issueId) {
    const [i] = await db.select().from(schema.issues).where(and(eq(schema.issues.id, body.issueId), eq(schema.issues.projectId, pid)));
    if (!i) return res.status(404).json({ error: "Issue not found." });
    title = `issue #${i.number} ${i.title}`; to = i.assigneeId ?? i.createdBy; target = `/projects/${pid}/coordination/issues/${i.id}`;
    await db.update(schema.issues).set({ updatedAt: new Date() }).where(eq(schema.issues.id, i.id));
  } else {
    const [f] = await db.select().from(schema.files).where(and(eq(schema.files.id, body.fileId!), eq(schema.files.projectId, pid)));
    if (!f) return res.status(404).json({ error: "File not found." });
    title = f.name; to = f.uploadedBy; target = `/projects/${pid}/files`;
  }
  const id = newId();
  await db.insert(schema.comments).values({ id, projectId: pid, documentId: body.documentId ?? null, fileId: body.fileId ?? null, issueId: body.issueId ?? null, sectionId: body.sectionId ?? null, userId: uid, body: body.body, createdAt: new Date() });
  // @mentions notify by name or email prefix
  const members = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email }).from(schema.projectMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.projectMembers.userId)).where(eq(schema.projectMembers.projectId, pid));
  const mentioned = members.filter((m) => body.body.toLowerCase().includes("@" + m.name.toLowerCase()) || body.body.toLowerCase().includes("@" + m.email.split("@")[0].toLowerCase()));
  for (const m of mentioned) await notify(pid, uid, `${req.user!.name} mentioned you on ${title}`, target, m.id);
  if (to && !mentioned.some((m) => m.id === to)) await notify(pid, uid, `${req.user!.name} commented on ${title}`, target, to);
  await logActivity(pid, uid, "comment.added", `Commented on ${title}`, target);
  res.status(201).json({ id });
}));

r.put(P + "/comments/:commentId", requireProject("viewer"), h(async (req, res) => {
  const body = parse(z.object({ resolved: z.boolean() }), req.body, res); if (!body) return;
  const [c] = await db.select().from(schema.comments).where(and(eq(schema.comments.id, req.params.commentId), eq(schema.comments.projectId, req.params.projectId)));
  if (!c) return res.status(404).json({ error: "Comment not found." });
  if (c.userId !== req.user!.id && !atLeast(req.projectRole, "editor")) return res.status(403).json({ error: "Not allowed." });
  await db.update(schema.comments).set({ resolved: body.resolved }).where(eq(schema.comments.id, c.id));
  res.json({ ok: true });
}));

// Unresolved comment counts per document, for list badges.
r.get(P + "/comment-counts", requireProject(), h(async (req, res) => {
  const rows = await db.select({ documentId: schema.comments.documentId }).from(schema.comments)
    .where(and(eq(schema.comments.projectId, req.params.projectId), eq(schema.comments.resolved, false)));
  const counts: Record<string, number> = {};
  for (const row of rows) if (row.documentId) counts[row.documentId] = (counts[row.documentId] ?? 0) + 1;
  res.json({ counts });
}));

export default r;
