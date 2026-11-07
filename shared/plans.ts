// Subscription plans: Free, Starter, Professional and Expert. Limits and section access apply only when billing
// is switched on (BILLING=on). Administrators can change names, prices, features and limits (Admin › Plans & access);
// the values below are the defaults, and saved changes are merged over them.

export const PLAN_IDS = ["free", "starter", "pro", "expert"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface PlanPrice { amount: number | null; currency: string; period: "month" | "year"; note: string }
export interface Plan {
  id: PlanId; name: string; color: string; tagline: string; audience: string; price: PlanPrice;
  projects: number; members: number; storageGb: number; aiPerMonth: number; features: string[];
}
/** What an administrator may change on a plan. */
export type PlanOverride = Partial<Pick<Plan, "name" | "tagline" | "audience" | "projects" | "members" | "storageGb" | "aiPerMonth" | "features">> & { price?: Partial<PlanPrice> };

export const UNLIMITED = 100000;

export const DEFAULT_PLANS: Plan[] = [
  {
    id: "free", name: "Free", color: "#22c55e", tagline: "Start learning ISO 19650 and try the portal on a small project.", audience: "Students and anyone new to ISO 19650",
    price: { amount: 0, currency: "USD", period: "year", note: "No card needed" },
    projects: 2, members: 5, storageGb: 2, aiPerMonth: 20,
    features: ["ISO 19650 parts and process", "CDE and status codes", "Video library", "2 small projects"],
  },
  {
    id: "starter", name: "Starter", color: "#3b82f6", tagline: "Learn the standard properly, with practice and progress tracking.", audience: "Individuals building ISO 19650 knowledge",
    price: { amount: 75, currency: "USD", period: "year", note: "Billed yearly" },
    projects: 5, members: 10, storageGb: 10, aiPerMonth: 100,
    features: ["Our training videos", "Interactive quiz", "Glossary & games", "COBie guide", "Leaderboard"],
  },
  {
    id: "pro", name: "Professional", color: "#a855f7", tagline: "Write the documents and run projects with your team.", audience: "BIM managers, coordinators and consultants",
    price: { amount: 150, currency: "USD", period: "year", note: "Billed yearly" },
    projects: 25, members: 50, storageGb: 100, aiPerMonth: 1000,
    features: ["Everything in Starter", "Expert exams & certs", "EIR / BEP builders", "RACI & COBie tools", "Templates & downloads"],
  },
  {
    id: "expert", name: "Expert", color: "#f59e0b", tagline: "Every tool, for organisations and senior information managers.", audience: "Information managers, BIM leads and organisations",
    price: { amount: 250, currency: "USD", period: "year", note: "Billed yearly" },
    projects: UNLIMITED, members: UNLIMITED, storageGb: 1000, aiPerMonth: 5000,
    features: ["Everything in Professional", "Gap analysis & LOIN", "Project simulator", "ACC live monitor", "CPD log & org training"],
  },
];
/** Kept for older imports: the default plans. Use mergePlans() for the plans an administrator has edited. */
export const PLANS = DEFAULT_PLANS;

/** Older installations used "enterprise"; it maps to Expert. Unknown ids fall back to Free. */
export const normalizePlanId = (id: string | null | undefined): PlanId =>
  id === "enterprise" ? "expert" : (PLAN_IDS as readonly string[]).includes(id ?? "") ? (id as PlanId) : "free";

export function mergePlans(overrides: Partial<Record<PlanId, PlanOverride>> | null | undefined): Plan[] {
  return DEFAULT_PLANS.map((p) => {
    const o = overrides?.[p.id];
    if (!o) return p;
    return { ...p, ...o, id: p.id, color: p.color, price: { ...p.price, ...o.price }, features: o.features?.length ? o.features : p.features };
  });
}
export const planFrom = (plans: Plan[], id: string) => plans.find((p) => p.id === normalizePlanId(id)) ?? plans[0]!;
export const planById = (id: string) => planFrom(DEFAULT_PLANS, id);

const money = (amount: number, currency: string) => {
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount); }
  catch { return `${amount} ${currency}`; }
};
/** "Free", "$75 / year" or "Contact us", for cards and tables. */
export function priceText(p: Plan) {
  if (p.price.amount === 0) return "Free";
  if (p.price.amount === null) return "Contact us";
  return `${money(p.price.amount, p.price.currency)} / ${p.price.period}`;
}
export const limitText = (n: number, unit = "") => (n >= UNLIMITED ? "Unlimited" : `${n.toLocaleString("en")}${unit}`);

/** Capacity rows for the comparison table. */
export function capacityRows(plans: Plan[]) {
  const row = (label: string, k: "projects" | "members" | "storageGb" | "aiPerMonth", unit = "") => ({ label, cells: plans.map((p) => limitText(p[k], unit)) });
  return [row("Projects you own", "projects"), row("Members per project", "members"), row("Project storage", "storageGb", " GB"), row("AI requests per month", "aiPerMonth")];
}
