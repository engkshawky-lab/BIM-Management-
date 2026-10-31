// Subscription plans. Limits apply only when billing is switched on (BILLING=on).
// Every plan includes every tool; plans differ in capacity (projects, members, storage, AI requests) and in support.
// Prices: set `amount` (per month, in `currency`) when they are decided; null shows "Contact us" / "Free".

export interface PlanPrice { amount: number | null; currency: string; period: string; note: string }
export interface Plan {
  id: "free" | "pro" | "enterprise"; name: string; tagline: string; audience: string; price: PlanPrice;
  projects: number; members: number; storageGb: number; aiPerMonth: number; features: string[];
}

export const UNLIMITED = 100000;

export const PLANS: Plan[] = [
  {
    id: "free", name: "Free", tagline: "Learn ISO 19650 and try every tool on a small project.", audience: "Individuals, students and small teams getting started",
    price: { amount: 0, currency: "USD", period: "month", note: "No card needed" },
    projects: 2, members: 5, storageGb: 2, aiPerMonth: 20,
    features: ["All learning hubs, quizzes and exams", "All document templates and guides", "Every tool, with 20 AI requests a month", "2 projects with up to 5 members each"],
  },
  {
    id: "pro", name: "Professional", tagline: "Run real projects with your delivery team.", audience: "BIM managers, coordinators and consultancies delivering projects",
    price: { amount: null, currency: "USD", period: "month", note: "Per account, billed monthly" },
    projects: 25, members: 50, storageGb: 100, aiPerMonth: 1000,
    features: ["Everything in Free", "25 projects with up to 50 members each", "100 GB of project storage", "1,000 AI requests a month", "Email support"],
  },
  {
    id: "enterprise", name: "Enterprise", tagline: "For organisations rolling ISO 19650 out across many projects.", audience: "Clients, contractors and design firms with many projects or teams",
    price: { amount: null, currency: "USD", period: "month", note: "Annual agreement" },
    projects: UNLIMITED, members: UNLIMITED, storageGb: 5000, aiPerMonth: UNLIMITED,
    features: ["Everything in Professional", "Unlimited projects and members", "5 TB of storage and unlimited AI requests", "Private installation on your own server available", "Onboarding and training for your team", "Priority support"],
  },
];
export const planById = (id: string) => PLANS.find((p) => p.id === id) ?? PLANS[0];

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
/** "Free", "$49 / month" or "Contact us", for cards and tables. */
export function priceText(p: Plan) {
  if (p.price.amount === 0) return "Free";
  if (p.price.amount === null) return "Contact us";
  return `${money(p.price.amount, p.price.currency)} / ${p.price.period}`;
}
export const limitText = (n: number, unit = "") => (n >= UNLIMITED ? "Unlimited" : `${n.toLocaleString("en")}${unit}`);

/** The plan comparison table on the pricing page. A cell is true / false or a short text. */
export interface CompareRow { label: string; cells: [boolean | string, boolean | string, boolean | string] }
export interface CompareGroup { title: string; rows: CompareRow[] }
const [free, pro, ent] = PLANS as [Plan, Plan, Plan];
const lim = (k: "projects" | "members" | "storageGb" | "aiPerMonth", unit = "") =>
  [limitText(free[k], unit), limitText(pro[k], unit), limitText(ent[k], unit)] as [string, string, string];
const all: [boolean, boolean, boolean] = [true, true, true];

export const PLAN_COMPARISON: CompareGroup[] = [
  { title: "Capacity", rows: [
    { label: "Projects you own", cells: lim("projects") },
    { label: "Members per project", cells: lim("members") },
    { label: "Project storage", cells: lim("storageGb", " GB") },
    { label: "AI requests per month", cells: lim("aiPerMonth") },
  ] },
  { title: "Learn ISO standards", rows: [
    { label: "ISO 19650 parts 1–6 and ISO/IEC 42001 learning hubs", cells: all },
    { label: "Learning paths by role, quizzes and practice exams", cells: all },
    { label: "Glossary in English and Arabic, video library", cells: all },
  ] },
  { title: "Documents and delivery", rows: [
    { label: "EIR, BEP, MIDP/TIDP and 30+ document templates", cells: all },
    { label: "Document guides with worked examples", cells: all },
    { label: "Delivery planner, responsibility matrix and file naming checks", cells: all },
  ] },
  { title: "Projects and the common data environment", rows: [
    { label: "Shared files with WIP, Shared, Published and Archived states", cells: all },
    { label: "Issues, risks, meetings, reviews and approval gates", cells: all },
    { label: "Email notifications and daily digest", cells: all },
  ] },
  { title: "Models and coordination", rows: [
    { label: "IFC model checks, IDS builder and BCF studio", cells: all },
    { label: "Clash test matrix and COBie checks", cells: all },
    { label: "Connectors for Autodesk Construction Cloud and Speckle", cells: all },
  ] },
  { title: "AI tools", rows: [
    { label: "EIR writer, BEP writer and EIR ↔ BEP compliance matrix", cells: all },
    { label: "Clash triage, model QA from IDS, sheet QA and audit assistant", cells: all },
    { label: "Project assistant that answers from your project records", cells: all },
  ] },
  { title: "Administration and support", rows: [
    { label: "Admin console, organisation videos and downloads library", cells: all },
    { label: "Support", cells: ["Help centre", "Email", "Priority"] },
    { label: "Onboarding and training for your team", cells: [false, false, true] },
    { label: "Private installation on your own server", cells: [false, false, true] },
  ] },
];
