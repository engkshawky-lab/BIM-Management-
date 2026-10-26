import { and, asc, eq, max } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { logActivity, memberRole, notify, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { h, parse, sentKeys } from "./auth";

const r = Router();
const P = "/projects/:projectId";
const score = z.number().int().min(1).max(5);

// ---------- information delivery risk register (ISO 19650-2 5.3.6) ----------
const riskSchema = z.object({
  title: z.string().trim().min(1).max(255), category: z.string().trim().max(40).default("Information delivery"), cause: z.string().max(1000).default(""),
  likelihood: score.default(3), impact: score.default(3), mitigation: z.string().max(1000).default(""), ownerId: z.string().nullable().default(null),
  status: z.enum(["Open", "Mitigating", "Closed"]).default("Open"), residualLikelihood: score.nullable().default(null), residualImpact: score.nullable().default(null),
  reviewDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).default(""),
});

r.get(P + "/risks", requireProject(), h(async (req, res) => {
  res.json({ risks: await db.select().from(schema.risks).where(eq(schema.risks.projectId, req.params.projectId)).orderBy(asc(schema.risks.number)) });
}));

r.post(P + "/risks", requireProject("editor"), h(async (req, res) => {
  const body = parse(riskSchema, req.body, res); if (!body) return;
  const pid = req.params.projectId;
  if (body.ownerId && !(await memberRole(pid, body.ownerId))) return res.status(400).json({ error: "Owner is not a project member." });
  const [{ n }] = await db.select({ n: max(schema.risks.number) }).from(schema.risks).where(eq(schema.risks.projectId, pid));
  const id = newId(); const now = new Date();
  await db.insert(schema.risks).values({ ...body, id, projectId: pid, number: (n ?? 0) + 1, createdAt: now, updatedAt: now });
  await logActivity(pid, req.user!.id, "risk.created", `Added risk R${String((n ?? 0) + 1).padStart(2, "0")}: ${body.title}`, `/projects/${pid}/delivery/risks`);
  if (body.ownerId) await notify(pid, req.user!.id, `You own a new risk: ${body.title}`, `/projects/${pid}/delivery/risks`, body.ownerId);
  res.status(201).json({ id });
}));

r.put(P + "/risks/:id", requireProject("editor"), h(async (req, res) => {
  const parsed = parse(riskSchema.partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  if (body.ownerId && !(await memberRole(req.params.projectId, body.ownerId))) return res.status(400).json({ error: "Owner is not a project member." });
  await db.update(schema.risks).set({ ...body, updatedAt: new Date() }).where(and(eq(schema.risks.id, req.params.id), eq(schema.risks.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

r.delete(P + "/risks/:id", requireProject("manager"), h(async (req, res) => {
  await db.delete(schema.risks).where(and(eq(schema.risks.id, req.params.id), eq(schema.risks.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

// ---------- handover (ISO 19650-2 5.7–5.8, ISO 19650-3) ----------
export const HANDOVER_CHECKLIST: [string, string, string][] = [
  ["Information model", "Federated information model authorized by lead appointed party", "19650-2 5.7.2"],
  ["Information model", "Information model accepted by appointing party", "19650-2 5.7.4"],
  ["Information model", "As-constructed models updated and published (CR)", "19650-2 5.7"],
  ["Asset information", "AIR requirements met for all maintainable assets", "19650-3 5.1.5"],
  ["Asset information", "COBie / structured asset data validated without errors", "BS 1192-4"],
  ["Asset information", "Asset tags and identifiers match physical labels", "19650-3"],
  ["Documentation", "O&M manuals and product data sheets uploaded", "19650-2 5.7"],
  ["Documentation", "Warranties, guarantees and certificates uploaded", "19650-2 5.7"],
  ["Documentation", "Health & safety file complete", "19650-6"],
  ["Documentation", "Commissioning and test records uploaded", "19650-2 5.7"],
  ["CDE", "All containers in Published state with correct suitability", "19650-2 5.7.4"],
  ["CDE", "Superseded information archived", "19650-2 5.8.1"],
  ["CDE", "Security requirements applied to sensitive information", "19650-5"],
  ["AIM transfer", "Information transferred to the AIM / CAFM system", "19650-3 5.1.7"],
  ["AIM transfer", "Access and retention requirements agreed for the archive", "19650-2 5.8.1"],
  ["Close-out", "Lessons learned captured", "19650-2 5.8.2"],
];

r.get(P + "/handover", requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  let items = await db.select().from(schema.handoverItems).where(eq(schema.handoverItems.projectId, pid)).orderBy(asc(schema.handoverItems.sortOrder));
  if (!items.length) {
    const now = new Date();
    await db.insert(schema.handoverItems).values(HANDOVER_CHECKLIST.map(([category, title, clause], i) => ({ id: newId(), projectId: pid, category, title, clause, sortOrder: i, updatedAt: now })));
    items = await db.select().from(schema.handoverItems).where(eq(schema.handoverItems.projectId, pid)).orderBy(asc(schema.handoverItems.sortOrder));
  }
  res.json({ items });
}));

const handoverSchema = z.object({
  category: z.string().trim().min(1).max(60), title: z.string().trim().min(1).max(255), clause: z.string().max(40).default(""),
  status: z.enum(["Not started", "In progress", "Complete", "N/A"]).default("Not started"), ownerId: z.string().nullable().default(null),
  fileId: z.string().nullable().default(null), notes: z.string().max(1000).default(""), sortOrder: z.number().int().default(999),
});

r.post(P + "/handover", requireProject("editor"), h(async (req, res) => {
  const body = parse(handoverSchema, req.body, res); if (!body) return;
  await db.insert(schema.handoverItems).values({ ...body, id: newId(), projectId: req.params.projectId, updatedAt: new Date() });
  res.status(201).json({ ok: true });
}));

r.put(P + "/handover/:id", requireProject("editor"), h(async (req, res) => {
  const parsed = parse(handoverSchema.partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  const pid = req.params.projectId;
  if (body.fileId) {
    const [f] = await db.select({ id: schema.files.id }).from(schema.files).where(and(eq(schema.files.id, body.fileId), eq(schema.files.projectId, pid)));
    if (!f) return res.status(400).json({ error: "Unknown file." });
  }
  await db.update(schema.handoverItems).set({ ...body, updatedAt: new Date() }).where(and(eq(schema.handoverItems.id, req.params.id), eq(schema.handoverItems.projectId, pid)));
  if (body.status === "Complete") await logActivity(pid, req.user!.id, "handover.item", `Handover item completed`, `/projects/${pid}/delivery/handover`);
  res.json({ ok: true });
}));

r.delete(P + "/handover/:id", requireProject("manager"), h(async (req, res) => {
  await db.delete(schema.handoverItems).where(and(eq(schema.handoverItems.id, req.params.id), eq(schema.handoverItems.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

export default r;
