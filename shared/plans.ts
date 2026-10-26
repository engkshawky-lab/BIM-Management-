// Subscription plans. Limits apply only when billing is switched on (BILLING=on).
export interface Plan { id: "free" | "pro" | "enterprise"; name: string; price: string; projects: number; members: number; storageGb: number; aiPerMonth: number; features: string[] }

export const PLANS: Plan[] = [
  { id: "free", name: "Free", price: "0", projects: 2, members: 5, storageGb: 2, aiPerMonth: 20, features: ["Documents & templates", "CDE files", "Delivery planner", "Learn"] },
  { id: "pro", name: "Professional", price: "per user / month", projects: 25, members: 50, storageGb: 100, aiPerMonth: 1000, features: ["Everything in Free", "Validation & COBie client standards", "AI assistant, notebook & triage", "Automations & email"] },
  { id: "enterprise", name: "Enterprise", price: "contact us", projects: 100000, members: 100000, storageGb: 5000, aiPerMonth: 100000, features: ["Everything in Professional", "Unlimited projects", "Branding & admin console", "Priority support"] },
];
export const planById = (id: string) => PLANS.find((p) => p.id === id) ?? PLANS[0];
