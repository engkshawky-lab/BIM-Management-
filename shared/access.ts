// Section access by plan: which plans can open each page of the portal. Keys are the sidebar keys in
// client/src/shell/nav.ts. Administrators can tick any combination of plans per section (Admin › Plans & access);
// these defaults apply until they do. Access is enforced only with BILLING=on, and administrators can open everything.
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
