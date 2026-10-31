import { desc, eq, sql } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { PLAN_IDS, normalizePlanId } from "../../shared/plans";
import { billingOn, currentPlan, usage } from "../billing";
import { db, schema } from "../db";
import { planConfig, saveAccess, savePlans } from "../planConfig";
import { h, parse } from "./auth";

const r = Router();
const requireAdmin = (req: Request, res: Response, next: NextFunction) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Administrators only." }));
const addMonths = (from: Date, n: number) => { const d = new Date(from); d.setMonth(d.getMonth() + n); return d; };

async function setPlan(userId: string, plan: string, months: number | null, source: string) {
  const cur = await currentPlan(userId);
  plan = normalizePlanId(plan);
  // extending the same plan adds to the remaining time
  const base = cur.id === plan && cur.renewsAt && cur.renewsAt > new Date() ? cur.renewsAt : new Date();
  const row = { plan, status: "active", renewsAt: months ? addMonths(base, months) : null, source, updatedAt: new Date() };
  await db.insert(schema.subscriptions).values({ userId, ...row }).onDuplicateKeyUpdate({ set: row });
}

r.get("/billing", h(async (req, res) => {
  const [plan, u] = await Promise.all([currentPlan(req.user!.id), usage(req.user!.id)]);
  const { plans, access } = await planConfig();
  res.json({ enabled: billingOn(), plan, usage: u, plans, access });
}));

r.post("/billing/redeem", h(async (req, res) => {
  const body = parse(z.object({ code: z.string().trim().toUpperCase().min(3).max(40) }), req.body, res); if (!body) return;
  const [c] = await db.select().from(schema.promoCodes).where(eq(schema.promoCodes.code, body.code));
  if (!c || c.uses >= c.maxUses || (c.expiresAt && c.expiresAt < new Date())) return res.status(400).json({ error: "This code is invalid, used up or expired." });
  // atomic use counter so a code can't be redeemed past its limit
  const [upd] = await db.update(schema.promoCodes).set({ uses: sql`${schema.promoCodes.uses} + 1` }).where(sql`${schema.promoCodes.code} = ${c.code} and ${schema.promoCodes.uses} < ${schema.promoCodes.maxUses}`);
  if (!(upd as { affectedRows?: number }).affectedRows) return res.status(400).json({ error: "This code has just been used up." });
  await setPlan(req.user!.id, c.plan, c.months, `code ${c.code}`);
  res.json({ ok: true, plan: await currentPlan(req.user!.id) });
}));

// ---------- admin ----------
r.put("/admin/users/:id/plan", requireAdmin, h(async (req, res) => {
  const body = parse(z.object({ plan: z.enum(["free", "starter", "pro", "expert", "enterprise"]), months: z.number().int().min(1).max(120).nullable() }), req.body, res); if (!body) return;
  await setPlan(req.params.id, body.plan, body.months, `admin ${req.user!.email}`);
  res.json({ ok: true });
}));

r.get("/admin/promo-codes", requireAdmin, h(async (_req, res) => {
  res.json({ codes: await db.select().from(schema.promoCodes).orderBy(desc(schema.promoCodes.createdAt)) });
}));
r.post("/admin/promo-codes", requireAdmin, h(async (req, res) => {
  const body = parse(z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,40}$/).optional(), plan: z.enum(["starter", "pro", "expert"]), months: z.number().int().min(1).max(36), maxUses: z.number().int().min(1).max(10000).default(1), expiresAt: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).default("") }), req.body, res); if (!body) return;
  const code = body.code || `BIM-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const [exists] = await db.select().from(schema.promoCodes).where(eq(schema.promoCodes.code, code));
  if (exists) return res.status(409).json({ error: "That code already exists." });
  await db.insert(schema.promoCodes).values({ code, plan: body.plan, months: body.months, maxUses: body.maxUses, expiresAt: body.expiresAt ? new Date(body.expiresAt + "T23:59:59Z") : null, createdAt: new Date() });
  res.status(201).json({ code });
}));
r.delete("/admin/promo-codes/:code", requireAdmin, h(async (req, res) => {
  await db.delete(schema.promoCodes).where(eq(schema.promoCodes.code, req.params.code));
  res.json({ ok: true });
}));

export default r;

// ---------- plans & section access (admin) ----------
const override = z.object({
  name: z.string().trim().min(1).max(40), tagline: z.string().trim().max(200), audience: z.string().trim().max(200),
  price: z.object({ amount: z.number().min(0).max(1_000_000).nullable(), currency: z.string().regex(/^[A-Z]{3}$/), period: z.enum(["month", "year"]), note: z.string().trim().max(80) }).partial(),
  features: z.array(z.string().trim().min(1).max(120)).max(20),
  projects: z.number().int().min(0).max(100000), members: z.number().int().min(0).max(100000), storageGb: z.number().int().min(0).max(100000), aiPerMonth: z.number().int().min(0).max(100000),
}).partial();
r.get("/admin/plans", requireAdmin, h(async (_req, res) => {
  const { plans, overrides, access } = await planConfig();
  res.json({ plans, overrides, access, billing: billingOn() });
}));
r.put("/admin/plans", requireAdmin, h(async (req, res) => {
  const body = parse(z.object(Object.fromEntries(PLAN_IDS.map((id) => [id, override.optional()]))), req.body, res); if (!body) return;
  await savePlans(body as never);
  res.json({ plans: (await planConfig()).plans });
}));
r.put("/admin/access", requireAdmin, h(async (req, res) => {
  const body = parse(z.object({ access: z.record(z.string().max(60), z.array(z.string().max(16)).max(4)) }), req.body, res); if (!body) return;
  await saveAccess(body.access);
  res.json({ access: (await planConfig()).access });
}));

// The signed-in user's plan and section access, for the page locks and the sidebar.
r.get("/access", h(async (req, res) => {
  const [{ access }, plan] = await Promise.all([planConfig(), currentPlan(req.user!.id)]);
  res.json({ billing: billingOn(), plan: plan.id, admin: req.user!.role === "admin", access });
}));

/** Public: plans and section access for the pricing page (no sign-in). */
export const publicPlans = Router();
publicPlans.get("/public/plans", h(async (_req, res) => {
  const { plans, access } = await planConfig();
  res.set("Cache-Control", "public, max-age=60").json({ plans, access });
}));
