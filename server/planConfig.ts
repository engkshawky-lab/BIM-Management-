import { eq } from "drizzle-orm";
import { cleanAccess, cleanTabAccess, type AccessMap, type TabAccessMap } from "../shared/access";
import { PLAN_IDS, mergePlans, type Plan, type PlanId, type PlanOverride } from "../shared/plans";
import { db, schema } from "./db";

// Plans, section access and tab access as the administrator has set them (settings rows "plans", "access" and "tabAccess"),
// merged over the defaults in shared/. Cached briefly; saving clears the cache.
let cache: { at: number; plans: Plan[]; overrides: Partial<Record<PlanId, PlanOverride>>; access: AccessMap; tabAccess: TabAccessMap } | null = null;

async function read(key: string) {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
  return (row?.value ?? {}) as Record<string, unknown>;
}

export async function planConfig() {
  if (cache && Date.now() - cache.at < 30_000) return cache;
  const [overrides, access, tabAccess] = await Promise.all([read("plans"), read("access"), read("tabAccess")]);
  const o = overrides as Partial<Record<PlanId, PlanOverride>>;
  cache = { at: Date.now(), plans: mergePlans(o), overrides: o, access: cleanAccess(access as Record<string, string[]>), tabAccess: cleanTabAccess(tabAccess) };
  return cache;
}

export async function savePlans(overrides: Partial<Record<PlanId, PlanOverride>>) {
  const value = Object.fromEntries(Object.entries(overrides).filter(([k]) => (PLAN_IDS as readonly string[]).includes(k)));
  await db.insert(schema.settings).values({ key: "plans", value }).onDuplicateKeyUpdate({ set: { value } });
  cache = null;
}

export async function saveAccess(map: Record<string, string[]>, tabs?: unknown) {
  const value = cleanAccess(map);
  await db.insert(schema.settings).values({ key: "access", value }).onDuplicateKeyUpdate({ set: { value } });
  if (tabs !== undefined) {
    const tabValue = cleanTabAccess(tabs);
    await db.insert(schema.settings).values({ key: "tabAccess", value: tabValue }).onDuplicateKeyUpdate({ set: { value: tabValue } });
  }
  cache = null;
}
