// Who gets an admin email: one row of facts per user, and a filter over every fact the portal holds about accounts
// (role, account status, plan and its end date, where the plan came from, email confirmed, language, email
// preference, joining date, last sign-in, projects, AI use, learning, organisation, BIM role). Pure, so the server
// filters with it and tests can check it; the Admin › Email users page and the assistant both send this filter.

export type AccountStatus = "active" | "disabled" | "pending";
export type PlanId = "free" | "starter" | "pro" | "expert";
export const PLAN_NAMES: Record<PlanId, string> = { free: "Free", starter: "Starter", pro: "Professional", expert: "Expert" };

export interface Person {
  id: string; name: string; email: string; organization: string; jobTitle: string; bimRole: string | null;
  role: string; status: AccountStatus; plan: PlanId; renewsAt: string | null; source: string;
  verified: boolean; locale: string; emailPref: string; createdAt: string; lastLoginAt: string | null;
  projects: number; aiRequests: number; lessons: number;
}

export interface AudienceFilter {
  /** name, email, organisation or job title contains */
  q?: string;
  roles?: string[];
  /** empty = any; the page starts with active accounts only */
  statuses?: AccountStatus[];
  plans?: PlanId[];
  /** current: no end date or ends in the future; expired: end date passed; no-end: paid with no end date */
  planState?: "any" | "current" | "expired" | "no-end";
  /** paid plan that ends within this many days from now (and has not ended yet) */
  planEndsWithinDays?: number | null;
  sources?: string[];
  verified?: "any" | "yes" | "no";
  locales?: string[];
  emailPrefs?: string[];
  /** YYYY-MM-DD, inclusive */
  joinedFrom?: string; joinedTo?: string;
  lastLogin?: "any" | "never" | "within" | "not-within";
  lastLoginDays?: number | null;
  projects?: "any" | "none" | "some";
  ai?: "any" | "used" | "never";
  learning?: "any" | "started" | "none";
  organizations?: string[];
  bimRoles?: string[];
  /** leave out deleted accounts and example/test addresses */
  excludeTest?: boolean;
}

/** What the page starts with: active accounts that haven't turned email off, without test addresses. */
export const DEFAULT_FILTER: AudienceFilter = { statuses: ["active"], emailPrefs: ["instant", "digest"], excludeTest: true };

const DAY = 864e5;
const TEST_ADDRESS = /(@deleted\.invalid|\.(example|test|invalid|localhost))$/i;
export const isTestAddress = (email: string) => TEST_ADDRESS.test(email);
const has = <T>(list: T[] | undefined, v: T) => !list?.length || list.includes(v);
const dayStart = (d: string) => Date.parse(`${d}T00:00:00Z`);

export function matchesAudience(p: Person, f: AudienceFilter, now = Date.now()): boolean {
  if (f.excludeTest !== false && isTestAddress(p.email)) return false;
  if (f.q?.trim()) {
    const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    const hay = `${p.name} ${p.email} ${p.organization} ${p.jobTitle}`.toLowerCase();
    if (!words.every((w) => hay.includes(w))) return false;
  }
  if (!has(f.roles, p.role) || !has(f.statuses, p.status) || !has(f.plans, p.plan) || !has(f.sources, p.source)) return false;
  if (!has(f.locales, p.locale) || !has(f.emailPrefs, p.emailPref)) return false;
  if (f.organizations?.length && !f.organizations.some((o) => o.toLowerCase() === p.organization.toLowerCase())) return false;
  if (f.bimRoles?.length && !f.bimRoles.includes(p.bimRole ?? "")) return false;

  const ends = p.renewsAt ? Date.parse(p.renewsAt) : null;
  const paid = p.plan !== "free";
  if (f.planState === "current" && ends !== null && ends <= now) return false;
  if (f.planState === "expired" && !(ends !== null && ends <= now)) return false;
  if (f.planState === "no-end" && !(paid && ends === null)) return false;
  if (f.planEndsWithinDays != null && !(paid && ends !== null && ends > now && ends <= now + f.planEndsWithinDays * DAY)) return false;

  if (f.verified === "yes" && !p.verified) return false;
  if (f.verified === "no" && p.verified) return false;

  const joined = Date.parse(p.createdAt);
  if (f.joinedFrom && joined < dayStart(f.joinedFrom)) return false;
  if (f.joinedTo && joined >= dayStart(f.joinedTo) + DAY) return false;

  const seen = p.lastLoginAt ? Date.parse(p.lastLoginAt) : null;
  const days = f.lastLoginDays ?? 30;
  if (f.lastLogin === "never" && seen !== null) return false;
  if (f.lastLogin === "within" && !(seen !== null && now - seen <= days * DAY)) return false;
  if (f.lastLogin === "not-within" && seen !== null && now - seen <= days * DAY) return false;

  if (f.projects === "none" && p.projects > 0) return false;
  if (f.projects === "some" && p.projects === 0) return false;
  if (f.ai === "used" && p.aiRequests === 0) return false;
  if (f.ai === "never" && p.aiRequests > 0) return false;
  if (f.learning === "started" && p.lessons === 0) return false;
  if (f.learning === "none" && p.lessons > 0) return false;
  return true;
}

/** One line per active condition, for the confirmation step and the send history. */
export function describeFilter(f: AudienceFilter): string[] {
  const out: string[] = [];
  const list = (label: string, v?: string[]) => { if (v?.length) out.push(`${label}: ${v.join(", ")}`); };
  if (f.q?.trim()) out.push(`Matches “${f.q.trim()}”`);
  list("Status", f.statuses); list("Role", f.roles); list("Plan", f.plans?.map((p) => PLAN_NAMES[p] ?? p)); list("Plan source", f.sources);
  if (f.planState && f.planState !== "any") out.push({ current: "Plan current", expired: "Plan ended", "no-end": "Paid plan with no end date" }[f.planState]);
  if (f.planEndsWithinDays != null) out.push(`Plan ends within ${f.planEndsWithinDays} days`);
  if (f.verified === "yes") out.push("Email confirmed"); else if (f.verified === "no") out.push("Email not confirmed");
  list("Language", f.locales); list("Email setting", f.emailPrefs); list("Organisation", f.organizations); list("BIM role", f.bimRoles);
  if (f.joinedFrom || f.joinedTo) out.push(`Joined ${f.joinedFrom ? `from ${f.joinedFrom}` : ""}${f.joinedFrom && f.joinedTo ? " " : ""}${f.joinedTo ? `to ${f.joinedTo}` : ""}`);
  const d = f.lastLoginDays ?? 30;
  if (f.lastLogin === "never") out.push("Never signed in");
  if (f.lastLogin === "within") out.push(`Signed in within ${d} days`);
  if (f.lastLogin === "not-within") out.push(`Not signed in for ${d} days`);
  if (f.projects === "none") out.push("No projects"); else if (f.projects === "some") out.push("Has projects");
  if (f.ai === "used") out.push("Has used AI"); else if (f.ai === "never") out.push("Never used AI");
  if (f.learning === "started") out.push("Has completed lessons"); else if (f.learning === "none") out.push("No lessons completed");
  if (f.excludeTest !== false) out.push("Test and deleted addresses left out");
  return out;
}
