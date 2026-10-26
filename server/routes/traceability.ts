import { and, asc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { logActivity, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { h, parse, sentKeys } from "./auth";

// Requirements traceability: requirement -> BEP response -> MIDP containers -> delivered.
const r = Router();
const P = "/projects/:projectId/requirements";

export type Coverage = "Not addressed" | "Response only" | "Planned" | "Delivered";
const coverage = (row: { response: string; deliverableIds: string[] }, status: Map<string, string>): Coverage => {
  const linked = row.deliverableIds.filter((x) => status.has(x));
  if (!linked.length) return row.response.trim() ? "Response only" : "Not addressed";
  return linked.every((x) => ["shared", "published"].includes(status.get(x)!)) ? "Delivered" : "Planned";
};

r.get(P, requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  const [rows, dels] = await Promise.all([
    db.select().from(schema.requirements).where(eq(schema.requirements.projectId, pid)).orderBy(asc(schema.requirements.ref)),
    db.select({ id: schema.deliverables.id, status: schema.deliverables.status }).from(schema.deliverables).where(eq(schema.deliverables.projectId, pid)),
  ]);
  const status = new Map(dels.map((d) => [d.id, d.status]));
  res.json({ requirements: rows.map((x) => ({ ...x, coverage: coverage(x, status) })) });
}));

const reqSchema = z.object({
  ref: z.string().trim().min(1).max(40), text: z.string().trim().min(1).max(2000), source: z.string().max(160).default(""),
  category: z.string().max(60).default(""), response: z.string().max(2000).default(""), deliverableIds: z.array(z.string()).max(50).default([]),
});

r.post(P, requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ rows: z.array(reqSchema).min(1).max(500) }), req.body, res); if (!body) return;
  const pid = req.params.projectId; const now = new Date();
  await db.insert(schema.requirements).values(body.rows.map((x) => ({ ...x, id: newId(), projectId: pid, createdAt: now })));
  await logActivity(pid, req.user!.id, "requirements.added", `Added ${body.rows.length} requirement${body.rows.length > 1 ? "s" : ""} to the traceability matrix`, `/projects/${pid}/traceability`);
  res.status(201).json({ count: body.rows.length });
}));

r.put(P + "/:id", requireProject("editor"), h(async (req, res) => {
  const parsed = parse(reqSchema.partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  if (!Object.keys(body).length) return res.status(400).json({ error: "Nothing to change." });
  await db.update(schema.requirements).set(body).where(and(eq(schema.requirements.id, req.params.id), eq(schema.requirements.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

r.delete(P + "/:id", requireProject("editor"), h(async (req, res) => {
  await db.delete(schema.requirements).where(and(eq(schema.requirements.id, req.params.id), eq(schema.requirements.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

export default r;
