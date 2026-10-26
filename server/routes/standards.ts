import { and, eq, inArray, or } from "drizzle-orm";
import { Router } from "express";
import fs from "fs";
import multer from "multer";
import os from "os";
import { z } from "zod";
import { emptyStandard, type ClientStandardData } from "../../shared/standards";
import { logActivity, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { importWorkbook } from "../standardsImport";
import { h, parse, sentKeys } from "./auth";

const r = Router();
// Appendices are parsed then discarded: only the extracted rules are stored.
const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 60 * 1024 * 1024, files: 20 } });

/** A standard is visible to its owner and to members of projects that use it. */
async function visibleIds(userId: string) {
  const viaProjects = await db.select({ id: schema.projects.standardId }).from(schema.projectMembers)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.projectMembers.projectId)).where(eq(schema.projectMembers.userId, userId));
  return viaProjects.map((x) => x.id).filter((x): x is string => !!x);
}
async function loadStandard(id: string, userId: string, mustOwn = false) {
  const [s] = await db.select().from(schema.clientStandards).where(eq(schema.clientStandards.id, id));
  if (!s) return null;
  if (s.ownerId === userId) return s;
  if (!mustOwn && (await visibleIds(userId)).includes(id)) return s;
  return null;
}

const summary = (s: typeof schema.clientStandards.$inferSelect) => {
  const d = s.data as ClientStandardData;
  return { id: s.id, name: s.name, client: s.client, ownerId: s.ownerId, updatedAt: s.updatedAt, stages: d.stages, rules: d.cobie.length, picklists: Object.keys(d.picklists).length, classification: d.classification.length, hasTag: !!d.tag, sources: d.sources };
};

r.get("/standards", h(async (req, res) => {
  const ids = await visibleIds(req.user!.id);
  const rows = await db.select().from(schema.clientStandards)
    .where(ids.length ? or(eq(schema.clientStandards.ownerId, req.user!.id), inArray(schema.clientStandards.id, ids)) : eq(schema.clientStandards.ownerId, req.user!.id));
  res.json({ standards: rows.map(summary) });
}));

r.post("/standards", h(async (req, res) => {
  const body = parse(z.object({ name: z.string().trim().min(2).max(160), client: z.string().trim().max(160).default("") }), req.body, res); if (!body) return;
  const id = newId(); const now = new Date();
  await db.insert(schema.clientStandards).values({ id, ownerId: req.user!.id, ...body, data: emptyStandard(), createdAt: now, updatedAt: now });
  res.status(201).json({ id });
}));

r.get("/standards/:id", h(async (req, res) => {
  const s = await loadStandard(req.params.id, req.user!.id);
  if (!s) return res.status(404).json({ error: "Standard not found." });
  res.json({ standard: { ...summary(s), data: s.data, canEdit: s.ownerId === req.user!.id } });
}));

const tagPart = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{0,30}$/), label: z.string().trim().min(1).max(60), group: z.enum(["location", "equipment"]),
  length: z.union([z.number().int().min(1).max(20), z.tuple([z.number().int().min(1).max(20), z.number().int().min(1).max(20)])]),
  charset: z.enum(["alnum", "alpha", "digits"]), codes: z.array(z.string().max(20)).max(5000).optional(),
});

r.put("/standards/:id", h(async (req, res) => {
  const parsed = parse(z.object({
    name: z.string().trim().min(2).max(160), client: z.string().trim().max(160),
    tag: z.object({ separator: z.string().min(1).max(2), cobieField: z.string().min(1).max(60), parts: z.array(tagPart).min(1).max(15) }).nullable(),
  }).partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  const s = await loadStandard(req.params.id, req.user!.id, true);
  if (!s) return res.status(404).json({ error: "Standard not found or not yours to edit." });
  const data = s.data as ClientStandardData;
  if (body.tag !== undefined) data.tag = body.tag;
  await db.update(schema.clientStandards).set({ ...(body.name ? { name: body.name } : {}), ...(body.client !== undefined ? { client: body.client } : {}), data, updatedAt: new Date() }).where(eq(schema.clientStandards.id, s.id));
  res.json({ ok: true });
}));

r.delete("/standards/:id", h(async (req, res) => {
  const s = await loadStandard(req.params.id, req.user!.id, true);
  if (!s) return res.status(404).json({ error: "Standard not found or not yours to delete." });
  await db.update(schema.projects).set({ standardId: null, standardStage: "" }).where(eq(schema.projects.standardId, s.id));
  await db.delete(schema.clientStandards).where(eq(schema.clientStandards.id, s.id));
  res.json({ ok: true });
}));

r.post("/standards/:id/import", upload.array("files", 20), h(async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  try {
    const s = await loadStandard(req.params.id, req.user!.id, true);
    if (!s) return res.status(404).json({ error: "Standard not found or not yours to edit." });
    if (!files.length) return res.status(400).json({ error: "Choose one or more .xlsx workbooks." });
    const data = s.data as ClientStandardData;
    const results: { file: string; found: string[]; error?: string }[] = [];
    for (const f of files) {
      const name = Buffer.from(f.originalname, "latin1").toString("utf8");
      if (!/\.xlsx$/i.test(name)) { results.push({ file: name, found: [], error: "Only .xlsx workbooks can be imported." }); continue; }
      try { results.push({ file: name, found: await importWorkbook(f.path, name, data) }); }
      catch (e) { results.push({ file: name, found: [], error: `Could not read workbook: ${(e as Error).message}` }); }
    }
    await db.update(schema.clientStandards).set({ data, updatedAt: new Date() }).where(eq(schema.clientStandards.id, s.id));
    res.json({ results, standard: summary({ ...s, data }) });
  } finally {
    for (const f of files) fs.rm(f.path, () => undefined);
  }
}));

// ---------- apply a standard to a project ----------
r.put("/projects/:projectId/standard", requireProject("manager"), h(async (req, res) => {
  const body = parse(z.object({ standardId: z.string().nullable(), stage: z.string().max(80).default("") }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  if (body.standardId) {
    const s = await loadStandard(body.standardId, req.user!.id);
    if (!s) return res.status(404).json({ error: "Standard not found." });
    const stages = (s.data as ClientStandardData).stages;
    if (body.stage && stages.length && !stages.includes(body.stage)) return res.status(400).json({ error: "Unknown stage for this standard." });
  }
  await db.update(schema.projects).set({ standardId: body.standardId, standardStage: body.standardId ? body.stage : "", updatedAt: new Date() }).where(eq(schema.projects.id, pid));
  await logActivity(pid, req.user!.id, "project.standard", body.standardId ? `Applied client standard (stage: ${body.stage || "—"})` : "Removed client standard", `/projects/${pid}/settings`);
  res.json({ ok: true });
}));

r.get("/projects/:projectId/standard", requireProject(), h(async (req, res) => {
  const [p] = await db.select().from(schema.projects).where(eq(schema.projects.id, req.params.projectId));
  if (!p.standardId) return res.json({ standard: null });
  const [s] = await db.select().from(schema.clientStandards).where(and(eq(schema.clientStandards.id, p.standardId)));
  res.json({ standard: s ? { ...summary(s), data: s.data } : null, stage: p.standardStage });
}));

export default r;
