import { and, count, eq, inArray, sql } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { planById, type Plan } from "../shared/plans";
import { db, schema } from "./db";
import { aiBurstExceeded } from "./security";

// Plans and usage. Limits are enforced only with BILLING=on; usage is always counted.
export const billingOn = () => process.env.BILLING === "on";
export class LimitError extends Error { constructor(message: string) { super(message); } }
const month = () => new Date().toISOString().slice(0, 7);

export async function currentPlan(userId: string): Promise<Plan & { status: string; renewsAt: Date | null; source: string }> {
  const [s] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId));
  const expired = !!s?.renewsAt && s.renewsAt < new Date();
  const plan = planById(!s || expired || s.status !== "active" ? "free" : s.plan);
  return { ...plan, status: expired ? "expired" : s?.status ?? "active", renewsAt: s?.renewsAt ?? null, source: s?.source ?? "" };
}

export async function usage(userId: string) {
  const owned = await db.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.ownerId, userId));
  const ids = owned.map((p) => p.id);
  const [storage] = ids.length ? await db.select({ bytes: sql<number>`coalesce(sum(${schema.fileVersions.size}), 0)` }).from(schema.fileVersions)
    .innerJoin(schema.files, eq(schema.files.id, schema.fileVersions.fileId)).where(inArray(schema.files.projectId, ids)) : [{ bytes: 0 }];
  const [ai] = await db.select({ n: schema.aiUsage.count }).from(schema.aiUsage).where(and(eq(schema.aiUsage.userId, userId), eq(schema.aiUsage.month, month())));
  return { projects: ids.length, storageBytes: Number(storage?.bytes ?? 0), aiThisMonth: ai?.n ?? 0 };
}

const upgrade = " Upgrade your plan or redeem a code under Billing.";

export async function assertCanCreateProject(userId: string) {
  if (!billingOn()) return;
  const [plan, u] = await Promise.all([currentPlan(userId), usage(userId)]);
  if (u.projects >= plan.projects) throw new LimitError(`Your ${plan.name} plan allows ${plan.projects} projects.${upgrade}`);
}

export async function assertCanAddMember(projectId: string) {
  if (!billingOn()) return;
  const [p] = await db.select({ ownerId: schema.projects.ownerId }).from(schema.projects).where(eq(schema.projects.id, projectId));
  const plan = await currentPlan(p.ownerId);
  const [{ n }] = await db.select({ n: count() }).from(schema.projectMembers).where(eq(schema.projectMembers.projectId, projectId));
  if (Number(n) >= plan.members) throw new LimitError(`The project owner's ${plan.name} plan allows ${plan.members} members per project.${upgrade}`);
}

export async function assertStorage(projectId: string, incomingBytes: number) {
  if (!billingOn()) return;
  const [p] = await db.select({ ownerId: schema.projects.ownerId }).from(schema.projects).where(eq(schema.projects.id, projectId));
  const [plan, u] = await Promise.all([currentPlan(p.ownerId), usage(p.ownerId)]);
  if (u.storageBytes + incomingBytes > plan.storageGb * 1024 ** 3) throw new LimitError(`Storage limit reached (${plan.storageGb} GB on the ${plan.name} plan).${upgrade}`);
}

const AI_PATHS = /\/(ai-draft|assistant|agent|requirements\/extract|contract-review|ai-triage|ask|interview|ai\/tools\/[a-z-]+(\/[a-z-]+)?|news\/refresh)$/;
/** Counts AI requests per user per month and enforces the plan quota when billing is on. Without billing,
 *  AI_MONTHLY_LIMIT (requests per user per month, 0 or unset = no cap) keeps the API budget bounded. */
export async function aiQuota(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "POST" || !AI_PATHS.test(req.path) || !req.user) return next();
  try {
    if (aiBurstExceeded(req.user.id)) return res.status(429).json({ error: "Too many AI requests in a minute. Wait a moment and try again." });
    if (billingOn()) {
      const [plan, u] = await Promise.all([currentPlan(req.user.id), usage(req.user.id)]);
      if (u.aiThisMonth >= plan.aiPerMonth) return res.status(402).json({ error: `You've used this month's ${plan.aiPerMonth} AI requests on the ${plan.name} plan.${upgrade}` });
    } else if (Number(process.env.AI_MONTHLY_LIMIT) > 0) {
      const cap = Number(process.env.AI_MONTHLY_LIMIT);
      const u = await usage(req.user.id);
      if (u.aiThisMonth >= cap) return res.status(429).json({ error: `You've used this month's ${cap} AI requests. Ask your administrator to raise the limit.` });
    }
    await db.insert(schema.aiUsage).values({ userId: req.user.id, month: month(), count: 1 }).onDuplicateKeyUpdate({ set: { count: sql`${schema.aiUsage.count} + 1` } });
    next();
  } catch (e) { next(e); }
}
