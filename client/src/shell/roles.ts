import type { IconName } from "./icons";

export interface BimRole {
  id: string; title: string; short: string; description: string; icon: IconName;
  /** Project pages and templates for this role; they become the user's favourites when they pick the role. */
  tools: string[];
  /** Platform pages for this role that work without a project, so the "View by role" filter is useful from day one. */
  pages: string[];
  /** The learning path for this role (shared/data/learningPaths.ts). */
  path: string;
  /** The detailed role profile in Workflow & roles (shared/data/workflow/types.ts ROLE_IDS). */
  profile: string;
}

// One role list for the whole platform: the sidebar's "View by role" filter, the role picker and favourites,
// each linked to its learning path and its role profile.
export const BIM_ROLES: BimRole[] = [
  { id: "modeller", title: "BIM Modeller", short: "Modeller", icon: "grid", description: "Creates and maintains BIM models, applies LOD/LOI standards, and manages geometry.",
    tools: ["p.files", "p.validation", "p.issues", "p.loin", "p.plan", "s.naming", "s.19650.cde", "t.mpdt", "t.qa-checklist"],
    pages: ["m.naming", "s.naming", "m.revit", "m.qaqc", "m.ifc", "b.bcf", "x.modelqa", "s.hub.revit", "s.hub.loin", "s.hub.aiconnect", "w.roles"],
    path: "modeller", profile: "author" },
  { id: "coordinator", title: "BIM Coordinator", short: "Coordinator", icon: "link", description: "Coordinates federated models, manages clash detection, and ensures data quality.",
    tools: ["p.validation", "p.issues", "p.clash", "p.files", "p.loin", "p.quality", "t.qa-checklist", "s.naming", "s.19650.cde"],
    pages: ["m.qaqc", "m.ifc", "m.revit", "b.ids", "b.bcf", "x.clash", "x.modelqa", "x.sheetqa", "ai.clash", "m.naming", "s.hub.bcf", "s.hub.aiconnect", "w.table"],
    path: "coordinator", profile: "coordinator" },
  { id: "manager", title: "BIM Manager", short: "Manager", icon: "landmark", description: "Develops BIM strategy, manages EIR/BEP documents, and oversees CDE implementation.",
    tools: ["p.documents", "t.eir", "t.bep-post", "p.plan", "p.raci", "p.quality", "p.gates", "p.files", "s.19650.process", "p.team"],
    pages: ["w.project", "w.table", "w.docguides", "ai.projectdata", "ai.plans", "x.bepwriter", "x.compliance", "x.audit", "x.agent", "x.programme", "ai.review", "b.minutes", "s.hub.cde"],
    path: "bim-manager", profile: "bim-manager" },
  { id: "team-lead", title: "BIM Team Lead", short: "Team lead", icon: "users", description: "Leads the BIM team, reviews deliverables, and ensures ISO 19650 compliance.",
    tools: ["p.documents", "p.plan", "p.issues", "p.quality", "p.validation", "p.raci", "p.risks", "p.activity", "s.19650.process", "t.bep-post"],
    pages: ["w.table", "w.roles", "ai.plans", "x.agent", "x.sheetqa", "x.modelqa", "m.naming", "b.minutes", "b.comms", "s.paths"],
    path: "bim-manager", profile: "ttm" },
  { id: "technical-head", title: "Technical Section Head", short: "Technical head", icon: "building", description: "Manages a technical section, oversees deliverables, and ensures project-wide BIM standards.",
    tools: ["p.summary", "p.quality", "p.plan", "p.gates", "p.risks", "p.documents", "p.issues", "t.info-standard", "s.19650.parts", "p.team"],
    pages: ["w.project", "w.table", "w.docguides", "x.audit", "x.compliance", "r.portfolio", "s.19650.parts", "s.hub.implementation"],
    path: "bim-manager", profile: "lead-designer" },
  { id: "section-head", title: "BIM Section Head", short: "BIM head", icon: "award", description: "Heads the BIM section, drives ISO 19650 adoption, and manages client relationships.",
    tools: ["p.summary", "p.quality", "p.gates", "p.risks", "p.handover", "t.eir", "t.bim-scope", "s.19650.parts", "p.team", "p.activity"],
    pages: ["r.portfolio", "w.project", "x.audit", "x.compliance", "s.adoption", "s.hub.implementation", "s.hub.timeline", "r.maturity", "r.fee"],
    path: "bim-manager", profile: "bim-manager" },
  { id: "client", title: "Client / Appointing Party", short: "Client", icon: "landmark", description: "Sets the information requirements, appoints the delivery team and accepts the information at each milestone.",
    tools: ["p.summary", "p.documents", "p.gates", "p.quality", "p.handover", "t.oir", "t.air", "t.eir", "t.info-standard", "t.info-protocol"],
    pages: ["w.project", "w.table", "w.docguides", "ai.projectdata", "x.eirwriter", "x.compliance", "x.audit", "s.hub.appointment", "s.hub.handover", "s.hub.cobie"],
    path: "client", profile: "client" },
  { id: "ai-lead", title: "AI Governance Lead", short: "AI lead", icon: "sparkles", description: "Runs the ISO/IEC 42001 AI management system: policy, risk, impact and controls.",
    tools: ["s.42001.clauses", "s.42001.annex", "t.ai-policy", "t.ai-risk", "t.ai-impact", "t.ai-soa", "p.documents", "p.quality", "p.gates", "s.42001.aibim"],
    pages: ["s.hub.iso42001", "s.42001.clauses", "s.42001.annex", "s.42001.aibim", "t.lib42001", "s.hub.aiconnect", "s.hub.mcp", "x.audit"],
    path: "ai-governance", profile: "bim-manager" },
];

export const roleById = (id: string | null | undefined) => BIM_ROLES.find((r) => r.id === id);
/** Everything a role covers: its project pages and templates, and the platform pages that work without a project. */
export const roleKeys = (r: BimRole) => new Set([...r.tools, ...r.pages]);
