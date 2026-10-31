import { eq } from "drizzle-orm";
import { cleanAccess, type AccessMap } from "../shared/access";
import { PLAN_IDS, mergePlans, type Plan, type PlanId, type PlanOverride } from "../shared/plans";
import { db, schema } from "./db";

// Plans and section access as the administrator has set them (settings rows "plans" and "access"),
// merged over the defaults in shared/. Cached briefly; saving clears the cache.
let cache: { at: number; plans: Plan[]; overrides: Partial<Record<PlanId, PlanOverride>>; access: AccessMap } | null = null;

async function read(key: string) {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
  return (row?.value ?? {}) as Record<string, unknown>;
}

export async function planConfig() {
  if (cache && Date.now() - cache.at < 30_000) return cache;
  const [overrides, access] = await Promise.all([read("plans"), read("access")]);
  const o = overrides as Partial<Record<PlanId, PlanOverride>>;
  cache = { at: Date.now(), plans: mergePlans(o), overrides: o, access: cleanAccess(access as Record<string, string[]>) };
  return cache;
}

export async function savePlans(overrides: Partial<Record<PlanId, PlanOverride>>) {
  const value = Object.fromEntries(Object.entries(overrides).filter(([k]) => (PLAN_IDS as readonly string[]).includes(k)));
  await db.insert(schema.settings).values({ key: "plans", value }).onDuplicateKeyUpdate({ set: { value } });
  cache = null;
}

export async function saveAccess(map: Record<string, string[]>) {
  const value = cleanAccess(map);
  await db.insert(schema.settings).values({ key: "access", value }).onDuplicateKeyUpdate({ set: { value } });
  cache = null;
}
