// Section access by plan: which plans can open each page of the portal, and each tab inside a page. Keys are the
// sidebar keys in client/src/shell/nav.ts (tabs: shared/tabs.ts). Administrators can tick any combination of plans
// per section (Admin › Plans & access); these defaults apply until they do. Access is enforced only with
// BILLING=on, and administrators can open everything.
import { PLAN_IDS, normalizePlanId, type PlanId } from "./plans";

export type AccessMap = Record<string, PlanId[]>;

const from = (min: PlanId): PlanId[] => PLAN_IDS.slice(PLAN_IDS.indexOf(min));

// The lowest plan that opens a section, by default. Anything not listed falls back to the prefix rules below.
const MIN: Record<string, PlanId> = {
  // projects: the core is on every plan (Free has 2 small projects); AI and advanced tools need a paid plan
  "p.assistant": "pro", "p.notebook": "pro", "p.contract": "pro", "p.raci": "pro", "p.mrm": "pro", "p.loin": "expert",
  "p.4d": "expert", "p.tags": "expert", "p.automations": "expert", "p.training": "expert", "p.trace": "pro",
  // my work and workflow
  "r.portfolio": "pro", "w.table": "starter", "w.matrix": "starter", "w.roles": "starter", "w.documents": "starter",
  "ai.projectdata": "pro", "r.standards": "pro",
  // documents and delivery
  "ai.generate": "pro", "x.bepwriter": "pro", "ai.plans": "pro", "ai.risks": "pro", "ai.clash": "expert", "b.minutes": "pro", "b.comms": "pro",
  "ai.review": "pro", "m.naming": "starter", "ai.suitability": "starter",
  "w.docguides": "pro", "t.lib19650": "pro", "t.lib42001": "pro", "r.samples": "pro", "r.downloads": "pro",
  // models and coordination
  "ai.cobie": "pro", "b.ids": "expert", "b.bcf": "expert", "c.acc": "expert", "c.speckle": "expert",
  // learning
  "s.guides": "starter", "s.paths": "starter", "s.adoption": "starter", "s.learn": "starter", "s.19650.revision": "starter",
  "s.glossary": "starter", "s.uses": "starter", "s.hub.loin": "expert",
  // resources
  "r.fee": "pro", "r.carbon": "pro", "r.maturity": "pro", "r.dt": "pro", "r.scan": "pro", "r.talentme": "starter", "r.talent": "expert",
  // AI
  "x.eirwriter": "pro", "x.compliance": "pro", "x.modelqa": "expert", "x.clash": "expert", "x.sheetqa": "expert", "x.audit": "expert",
  "x.agent": "expert", "x.programme": "expert", "s.hub.aiconnect": "starter", "s.hub.mcp": "starter", "ai.mcp": "pro",
};
// sections every plan keeps, whatever the prefix rules say
const FREE = new Set(["s.hubs", "s.hub.timeline", "s.19650.parts", "s.19650.summary", "s.19650.process", "s.19650.cde", "s.19650.glossary",
  "s.videos", "s.ourvideos", "r.19650", "r.42001", "r.news", "s.naming", "r.wizard", "w.project"]);

export function defaultPlansFor(key: string): PlanId[] {
  if (MIN[key]) return from(MIN[key]);
  if (FREE.has(key)) return from("free");
  if (key.startsWith("t.")) return from("pro");          // document templates
  if (key.startsWith("m.") || key.startsWith("c.")) return from("expert"); // model checkers, connectors
  if (key.startsWith("s.hub.") || key.startsWith("s.42001.")) return from("starter"); // topic hubs, ISO/IEC 42001
  return from("free");                                    // projects, home, account and everything else
}

/** Plans that can open a section: the administrator's choice if saved, else the default. */
export const plansFor = (key: string, overrides?: AccessMap | null): PlanId[] => overrides?.[key] ?? defaultPlansFor(key);

/** Can a user on this plan open the section? */
export const canOpen = (key: string, plan: string, overrides?: AccessMap | null) => plansFor(key, overrides).includes(normalizePlanId(plan));

/** The cheapest plan that opens a section, for "Upgrade to …" prompts. */
export const cheapestFor = (key: string, overrides?: AccessMap | null): PlanId | null => PLAN_IDS.find((p) => plansFor(key, overrides).includes(p)) ?? null;

/** Keep only valid plan ids per key, so a saved map can't lock a section to nothing by mistake. */
export function cleanAccess(map: Record<string, string[]>): AccessMap {
  const out: AccessMap = {};
  for (const [k, v] of Object.entries(map)) {
    if (!/^[a-z0-9.-]{2,60}$/i.test(k) || !Array.isArray(v)) continue;
    out[k] = PLAN_IDS.filter((p) => v.includes(p));
  }
  return out;
}

// ---------- tabs inside pages ----------
// A tab (key "page/tab/…", see shared/tabs.ts) follows its parent: a plan that cannot open the page, or a parent tab,
// cannot open the tab either. On top of that the administrator can close a tab to single plans; only those
// "closed" marks are stored, so a plan added to the page later reaches its tabs unless a tab was closed to it.

/** Per plan: false closes the tab to that plan. Plans left out follow the parent. */
export type TabRule = Partial<Record<PlanId, boolean>>;
export type TabAccessMap = Record<string, TabRule>;

export const isTabKey = (key: string) => key.includes("/");
export const pageOfKey = (key: string) => key.split("/")[0]!;
/** A tab key's own key and its parent tab keys, outermost first: "p/a/b" → ["p/a", "p/a/b"]. */
export const tabChain = (key: string) => { const parts = key.split("/"); return parts.slice(1).map((_, i) => parts.slice(0, i + 2).join("/")); };

/** Where a plan is stopped on the way to a page or tab: the page or tab key that closes it, or null when it opens. */
export function blockedAt(key: string, plan: string, overrides?: AccessMap | null, tabs?: TabAccessMap | null): string | null {
  const p = normalizePlanId(plan);
  const page = pageOfKey(key);
  if (!plansFor(page, overrides).includes(p)) return page;
  return tabChain(key).find((k) => tabs?.[k]?.[p] === false) ?? null;
}

/** Can a user on this plan open the page or tab? */
export const canOpenKey = (key: string, plan: string, overrides?: AccessMap | null, tabs?: TabAccessMap | null) => blockedAt(key, plan, overrides, tabs) === null;

/** The cheapest plan that opens a page or tab, for "Upgrade to …" prompts; null when no plan does. */
export const cheapestForKey = (key: string, overrides?: AccessMap | null, tabs?: TabAccessMap | null): PlanId | null =>
  PLAN_IDS.find((p) => canOpenKey(key, p, overrides, tabs)) ?? null;

/** Keep only valid tab keys and "closed" marks for known plans. */
export function cleanTabAccess(map: unknown): TabAccessMap {
  const out: TabAccessMap = {};
  if (!map || typeof map !== "object") return out;
  for (const [k, v] of Object.entries(map as Record<string, unknown>)) {
    if (k.length > 160 || !/^[a-z0-9.-]{2,60}(\/[a-z0-9-]{1,60}){1,4}$/i.test(k) || !v || typeof v !== "object") continue;
    const rule: TabRule = {};
    for (const p of PLAN_IDS) if ((v as Record<string, unknown>)[p] === false) rule[p] = false;
    if (Object.keys(rule).length) out[k] = rule;
  }
  return out;
}

/** The tab behind an API call, for calls whose tab is in the request (the page is checked by sectionForApi). */
export function tabForApi(path: string, body: unknown): string | null {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (path === "/ai/tools/ask-part") {
    const n = /^19650-([1-6])$/.exec(String(b.partId ?? ""))?.[1];
    return n ? `s.19650.part${n}/ask` : null;
  }
  if (path === "/ai/tools/model-compare") return "m.ifc/ai";
  return null;
}

// Server-side checks for the API calls behind paid sections (the page lock alone would only hide the screen).
const API_SECTIONS: [RegExp, string][] = [
  [/^\/ai\/tools\/eir-writer/, "x.eirwriter"], [/^\/ai\/tools\/bep-from-eir/, "x.bepwriter"], [/^\/ai\/tools\/compliance-matrix/, "x.compliance"],
  [/^\/ai\/tools\/clash-triage/, "x.clash"], [/^\/ai\/tools\/model-qa-explain/, "x.modelqa"], [/^\/ai\/tools\/sheet-qa/, "x.sheetqa"],
  [/^\/ai\/tools\/audit/, "x.audit"], [/^\/ai\/tools\/programme-to-plan/, "x.programme"], [/^\/ai\/tools\/ids-extract/, "b.ids"],
  [/^\/ai\/tools\/minutes/, "b.minutes"], [/^\/ai\/tools\/correspondence/, "b.comms"], [/^\/ai\/tools\/generate\//, "ai.generate"],
  [/^\/ai\/tools\/risk-register/, "ai.risks"], [/^\/ai\/tools\/clash-matrix/, "ai.clash"], [/^\/ai\/tools\/review/, "ai.review"],
  [/^\/ai\/tools\/suitability/, "ai.suitability"], [/^\/ai\/tools\/cobie/, "ai.cobie"], [/^\/ai\/tools\/plan-rows/, "ai.plans"],
  [/^\/ai\/tools\/model-compare/, "m.ifc"], [/^\/projects\/[^/]+\/agent$/, "x.agent"], [/^\/projects\/[^/]+\/assistant$/, "p.assistant"],
  [/^\/projects\/[^/]+\/notebooks/, "p.notebook"], [/^\/projects\/[^/]+\/contract-review$/, "p.contract"],
  [/^\/projects\/[^/]+\/automations/, "p.automations"], [/^\/learn\/interview$/, "s.learn"],
];
export const sectionForApi = (path: string) => API_SECTIONS.find(([re]) => re.test(path))?.[1] ?? null;
