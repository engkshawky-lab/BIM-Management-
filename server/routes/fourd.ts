import { and, eq } from "drizzle-orm";
import { Router } from "express";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { gridFromElements } from "../../shared/fourd";
import { buildModel, parseStep } from "../../shared/ifc";
import { logActivity, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { UPLOAD_DIR } from "../storage";
import { h, parse } from "./auth";

const r = Router();
const P = "/projects/:projectId/4d";
const date = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).default("");

async function getPlan(pid: string) {
  const [p] = await db.select().from(schema.fourdPlans).where(eq(schema.fourdPlans.projectId, pid));
  return p ?? { projectId: pid, fileId: null, fileName: "", fileVersion: 0, grid: null, activities: [], updatedAt: new Date() };
}
const save = (row: Awaited<ReturnType<typeof getPlan>>) => db.insert(schema.fourdPlans).values({ ...row, updatedAt: new Date() }).onDuplicateKeyUpdate({ set: { fileId: row.fileId, fileName: row.fileName, fileVersion: row.fileVersion, grid: row.grid, activities: row.activities, updatedAt: new Date() } });

r.get(P, requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  const files = (await db.select({ id: schema.files.id, name: schema.files.name, currentVersion: schema.files.currentVersion }).from(schema.files).where(eq(schema.files.projectId, pid))).filter((f) => /\.ifc$/i.test(f.name));
  res.json({ plan: await getPlan(pid), ifcFiles: files });
}));

/** Read the chosen IFC file once and keep only the storey × class element counts. */
r.post(P + "/model", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ fileId: z.string() }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const [f] = await db.select().from(schema.files).where(and(eq(schema.files.id, body.fileId), eq(schema.files.projectId, pid)));
  if (!f || !/\.ifc$/i.test(f.name)) return res.status(400).json({ error: "Choose an IFC file from the project files." });
  const [v] = await db.select().from(schema.fileVersions).where(and(eq(schema.fileVersions.fileId, f.id), eq(schema.fileVersions.version, f.currentVersion)));
  const model = buildModel(parseStep(await fs.promises.readFile(path.join(UPLOAD_DIR, v.storageKey), "utf8")));
  if (!model.elements.length) return res.status(400).json({ error: "No building elements found in this IFC file." });
  const plan = await getPlan(pid);
  await save({ ...plan, fileId: f.id, fileName: f.name, fileVersion: f.currentVersion, grid: gridFromElements(model.elements) });
  await logActivity(pid, req.user!.id, "4d.model", `Linked 4D plan to ${f.name} v${f.currentVersion} (${model.elements.length} elements)`, `/projects/${pid}/4d`);
  res.json({ elements: model.elements.length });
}));

r.put(P + "/activities", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ activities: z.array(z.object({
    id: z.string().max(36).default(() => newId()), code: z.string().max(40).default(""), name: z.string().trim().min(1).max(200), start: date, finish: date, actualStart: date, actualFinish: date,
    storeys: z.array(z.string().max(120)).max(200).default([]), classes: z.array(z.string().max(80)).max(200).default([]),
  })).max(2000) }), req.body, res); if (!body) return;
  const plan = await getPlan(req.params.projectId);
  await save({ ...plan, activities: body.activities });
  res.json({ ok: true });
}));

export default r;
