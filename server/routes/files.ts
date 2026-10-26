import { and, asc, desc, eq, max } from "drizzle-orm";
import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { z } from "zod";
import { atLeast, logActivity, notify, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { UPLOAD_DIR } from "../storage";
import { h, parse } from "./auth";
import { runValidation, sharingBlocker, validationKind } from "./validation";


const upload = multer({
  storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_req, _file, cb) => cb(null, newId()) }),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB ?? 250) * 1024 * 1024 },
});

const INLINE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/gif", "text/plain"]);

/** Validate IFC / COBie uploads in the background; the result lands in the activity feed and the Validation tab. */
function autoValidate(projectId: string, fileId: string, name: string, userId: string) {
  if (!validationKind(name)) return;
  setImmediate(() => runValidation(projectId, fileId, userId).catch((e) => console.error("auto-validation failed", e)));
}

const r = Router();
const P = "/projects/:projectId";

// ---------- folders ----------
r.get(P + "/folders", requireProject(), h(async (req, res) => {
  const rows = await db.select().from(schema.folders).where(eq(schema.folders.projectId, req.params.projectId)).orderBy(asc(schema.folders.name));
  res.json({ folders: rows });
}));

r.post(P + "/folders", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ name: z.string().trim().min(1).max(160), parentId: z.string().nullable().default(null) }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  let cdeState: string | null = null;
  if (body.parentId) {
    const [parent] = await db.select().from(schema.folders).where(and(eq(schema.folders.id, body.parentId), eq(schema.folders.projectId, pid)));
    if (!parent) return res.status(404).json({ error: "Parent folder not found." });
    cdeState = parent.cdeState;
  }
  const id = newId();
  await db.insert(schema.folders).values({ id, projectId: pid, parentId: body.parentId, name: body.name, cdeState, createdBy: req.user!.id, createdAt: new Date() });
  await logActivity(pid, req.user!.id, "folder.created", `Created folder ${body.name}`, `/projects/${pid}/files`);
  res.status(201).json({ id });
}));

r.put(P + "/folders/:folderId", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ name: z.string().trim().min(1).max(160) }), req.body, res); if (!body) return;
  await db.update(schema.folders).set({ name: body.name }).where(and(eq(schema.folders.id, req.params.folderId), eq(schema.folders.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

r.delete(P + "/folders/:folderId", requireProject("manager"), h(async (req, res) => {
  const { projectId, folderId } = req.params;
  const [child] = await db.select({ id: schema.folders.id }).from(schema.folders).where(eq(schema.folders.parentId, folderId)).limit(1);
  const [file] = await db.select({ id: schema.files.id }).from(schema.files).where(eq(schema.files.folderId, folderId)).limit(1);
  if (child || file) return res.status(400).json({ error: "Folder is not empty." });
  await db.delete(schema.folders).where(and(eq(schema.folders.id, folderId), eq(schema.folders.projectId, projectId)));
  res.json({ ok: true });
}));

// ---------- files ----------
async function getFile(projectId: string, fileId: string) {
  const [f] = await db.select().from(schema.files).where(and(eq(schema.files.id, fileId), eq(schema.files.projectId, projectId)));
  return f;
}

r.get(P + "/files", requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  const folderId = typeof req.query.folderId === "string" ? req.query.folderId : undefined;
  const rows = await db.select({ f: schema.files, by: schema.users.name }).from(schema.files)
    .leftJoin(schema.users, eq(schema.users.id, schema.files.uploadedBy))
    .where(folderId ? and(eq(schema.files.projectId, pid), eq(schema.files.folderId, folderId)) : eq(schema.files.projectId, pid))
    .orderBy(desc(schema.files.updatedAt));
  res.json({ files: rows.map((x) => ({ ...x.f, uploadedByName: x.by ?? "" })) });
}));

r.get(P + "/files/:fileId", requireProject(), h(async (req, res) => {
  const f = await getFile(req.params.projectId, req.params.fileId);
  if (!f) return res.status(404).json({ error: "File not found." });
  const versions = await db.select({ v: schema.fileVersions, by: schema.users.name }).from(schema.fileVersions)
    .leftJoin(schema.users, eq(schema.users.id, schema.fileVersions.uploadedBy))
    .where(eq(schema.fileVersions.fileId, f.id)).orderBy(desc(schema.fileVersions.version));
  res.json({ file: f, versions: versions.map((x) => ({ ...x.v, uploadedByName: x.by ?? "" })) });
}));

const uploadMeta = z.object({
  folderId: z.string().min(1),
  fileId: z.string().optional(),
  containerName: z.string().trim().max(120).default(""),
  note: z.string().max(500).default(""),
  documentId: z.string().optional(),
});

r.post(P + "/files", requireProject("editor"), upload.single("file"), h(async (req, res) => {
  const pid = req.params.projectId;
  const blob = req.file;
  if (!blob) return res.status(400).json({ error: "No file uploaded." });
  const body = parse(uploadMeta, req.body, res);
  if (!body) { fs.rm(blob.path, () => undefined); return; }
  const [folder] = await db.select().from(schema.folders).where(and(eq(schema.folders.id, body.folderId), eq(schema.folders.projectId, pid)));
  if (!folder) { fs.rm(blob.path, () => undefined); return res.status(404).json({ error: "Folder not found." }); }
  // multer decodes multipart filenames as latin1
  const name = Buffer.from(blob.originalname, "latin1").toString("utf8");
  const now = new Date(); const uid = req.user!.id;

  // A new version of an existing file — explicit fileId, or a document re-saved to the same folder.
  let existing = body.fileId ? await getFile(pid, body.fileId) : undefined;
  if (!existing && body.documentId) {
    [existing] = await db.select().from(schema.files).where(and(eq(schema.files.projectId, pid), eq(schema.files.documentId, body.documentId), eq(schema.files.folderId, folder.id)));
  }
  if (body.fileId && !existing) { fs.rm(blob.path, () => undefined); return res.status(404).json({ error: "File not found." }); }

  if (existing) {
    const [{ v }] = await db.select({ v: max(schema.fileVersions.version) }).from(schema.fileVersions).where(eq(schema.fileVersions.fileId, existing.id));
    const version = (v ?? 0) + 1;
    await db.insert(schema.fileVersions).values({ id: newId(), fileId: existing.id, version, storageKey: blob.filename, size: blob.size, mimeType: blob.mimetype, note: body.note, uploadedBy: uid, createdAt: now });
    await db.update(schema.files).set({ currentVersion: version, name, updatedAt: now, ...(body.containerName ? { containerName: body.containerName } : {}) }).where(eq(schema.files.id, existing.id));
    await logActivity(pid, uid, "file.version", `Uploaded version ${version} of ${name}`, `/projects/${pid}/files`);
    await notify(pid, uid, `${req.user!.name} uploaded v${version} of ${name}`, `/projects/${pid}/files`);
    autoValidate(pid, existing.id, name, uid);
    return res.status(201).json({ id: existing.id, version, validating: !!validationKind(name) });
  }

  const id = newId();
  await db.insert(schema.files).values({
    id, projectId: pid, folderId: folder.id, name, containerName: body.containerName, documentId: body.documentId ?? null,
    state: folder.cdeState ?? "WIP", suitability: folder.cdeState === "PUBLISHED" ? "A1" : folder.cdeState === "SHARED" ? "S2" : "S0",
    uploadedBy: uid, createdAt: now, updatedAt: now,
  });
  await db.insert(schema.fileVersions).values({ id: newId(), fileId: id, version: 1, storageKey: blob.filename, size: blob.size, mimeType: blob.mimetype, note: body.note || "Initial upload", uploadedBy: uid, createdAt: now });
  await logActivity(pid, uid, "file.uploaded", `Uploaded ${name} to ${folder.name}`, `/projects/${pid}/files`);
  await notify(pid, uid, `${req.user!.name} uploaded ${name}`, `/projects/${pid}/files`);
  autoValidate(pid, id, name, uid);
  res.status(201).json({ id, version: 1, validating: !!validationKind(name) });
}));

r.get(P + "/files/:fileId/download", requireProject(), h(async (req, res) => {
  const f = await getFile(req.params.projectId, req.params.fileId);
  if (!f) return res.status(404).json({ error: "File not found." });
  const version = Number(req.query.version) || f.currentVersion;
  const [v] = await db.select().from(schema.fileVersions).where(and(eq(schema.fileVersions.fileId, f.id), eq(schema.fileVersions.version, version)));
  if (!v) return res.status(404).json({ error: "Version not found." });
  const full = path.join(UPLOAD_DIR, path.basename(v.storageKey));
  if (!fs.existsSync(full)) return res.status(410).json({ error: "Stored file is missing." });
  // Uploaded content is untrusted: only a few passive types may render inline, everything else downloads,
  // and the sandbox CSP stops any script from running on this origin.
  const inline = !!req.query.inline && INLINE_TYPES.has(v.mimeType);
  res.setHeader("Content-Type", inline ? v.mimeType : "application/octet-stream");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(f.name)}`);
  fs.createReadStream(full).pipe(res);
}));

r.put(P + "/files/:fileId", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({
    name: z.string().trim().min(1).max(255), containerName: z.string().trim().max(120), folderId: z.string(),
    state: z.enum(["WIP", "SHARED", "PUBLISHED", "ARCHIVED"]), suitability: z.string().max(8), revision: z.string().max(12),
  }).partial(), req.body, res); if (!body) return;
  const override = typeof req.body?.overrideReason === "string" ? req.body.overrideReason.trim().slice(0, 300) : "";
  const pid = req.params.projectId;
  const f = await getFile(pid, req.params.fileId);
  if (!f) return res.status(404).json({ error: "File not found." });
  if ((body.state === "PUBLISHED" || body.state === "ARCHIVED") && !["manager", "owner"].includes(req.projectRole!))
    return res.status(403).json({ error: "Only managers can publish or archive." });
  if (body.folderId) {
    const [folder] = await db.select().from(schema.folders).where(and(eq(schema.folders.id, body.folderId), eq(schema.folders.projectId, pid)));
    if (!folder) return res.status(404).json({ error: "Folder not found." });
  }
  // ISO 19650-2 5.6.3: information must pass its checks before it leaves WIP.
  if ((body.state === "SHARED" || body.state === "PUBLISHED") && f.state === "WIP") {
    const blocker = await sharingBlocker(f.id, f.currentVersion);
    if (blocker) {
      if (!override || !atLeast(req.projectRole, "manager")) return res.status(409).json({ error: blocker, validationBlocked: true });
      await logActivity(pid, req.user!.id, "validation.override", `Override: shared ${f.name} despite failed validation — ${override}`, `/projects/${pid}/files`);
    }
  }
  await db.update(schema.files).set({ ...body, updatedAt: new Date() }).where(eq(schema.files.id, f.id));
  if (body.state && body.state !== f.state) {
    await logActivity(pid, req.user!.id, "file.state", `${f.name}: ${f.state} → ${body.state}${body.suitability ? ` (${body.suitability})` : ""}`, `/projects/${pid}/files`);
    await notify(pid, req.user!.id, `${f.name} moved to ${body.state}`, `/projects/${pid}/files`);
  }
  res.json({ ok: true });
}));

r.delete(P + "/files/:fileId", requireProject("manager"), h(async (req, res) => {
  const pid = req.params.projectId;
  const f = await getFile(pid, req.params.fileId);
  if (!f) return res.status(404).json({ error: "File not found." });
  const versions = await db.select().from(schema.fileVersions).where(eq(schema.fileVersions.fileId, f.id));
  await db.delete(schema.fileVersions).where(eq(schema.fileVersions.fileId, f.id));
  await db.delete(schema.comments).where(eq(schema.comments.fileId, f.id));
  await db.delete(schema.files).where(eq(schema.files.id, f.id));
  for (const v of versions) fs.rm(path.join(UPLOAD_DIR, path.basename(v.storageKey)), () => undefined);
  await logActivity(pid, req.user!.id, "file.deleted", `Deleted ${f.name}`);
  res.json({ ok: true });
}));

export default r;
