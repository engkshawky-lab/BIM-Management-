import type { IconName } from "./icons";

export interface BimRole { id: string; title: string; description: string; icon: IconName; tools: string[] }

// Each role's tools become that person's Favourites and drive the "Focus" filter in the side panel.
export const BIM_ROLES: BimRole[] = [
  { id: "modeller", title: "BIM Modeller", icon: "grid", description: "Creates and maintains BIM models, applies LOD/LOI standards, and manages geometry.",
    tools: ["p.files", "p.validation", "p.issues", "p.loin", "p.plan", "s.naming", "s.19650.cde", "t.mpdt", "t.qa-checklist"] },
  { id: "coordinator", title: "BIM Coordinator", icon: "link", description: "Coordinates federated models, manages clash detection, and ensures data quality.",
    tools: ["p.validation", "p.issues", "p.clash", "p.files", "p.loin", "p.quality", "t.qa-checklist", "s.naming", "s.19650.cde"] },
  { id: "manager", title: "BIM Manager", icon: "landmark", description: "Develops BIM strategy, manages EIR/BEP documents, and oversees CDE implementation.",
    tools: ["p.documents", "t.eir", "t.bep-post", "p.plan", "p.raci", "p.quality", "p.gates", "p.files", "s.19650.process", "p.team"] },
  { id: "team-lead", title: "BIM Team Lead", icon: "users", description: "Leads the BIM team, reviews deliverables, and ensures ISO 19650 compliance.",
    tools: ["p.documents", "p.plan", "p.issues", "p.quality", "p.validation", "p.raci", "p.risks", "p.activity", "s.19650.process", "t.bep-post"] },
  { id: "technical-head", title: "Technical Section Head", icon: "building", description: "Manages a technical section, oversees deliverables, and ensures project-wide BIM standards.",
    tools: ["p.summary", "p.quality", "p.plan", "p.gates", "p.risks", "p.documents", "p.issues", "t.info-standard", "s.19650.parts", "p.team"] },
  { id: "section-head", title: "BIM Section Head", icon: "award", description: "Heads the BIM section, drives ISO 19650 adoption, and manages client relationships.",
    tools: ["p.summary", "p.quality", "p.gates", "p.risks", "p.handover", "t.eir", "t.bim-scope", "s.19650.parts", "p.team", "p.activity"] },
  { id: "ai-lead", title: "AI Governance Lead", icon: "sparkles", description: "Runs the ISO/IEC 42001 AI management system: policy, risk, impact and controls.",
    tools: ["s.42001.clauses", "s.42001.annex", "t.ai-policy", "t.ai-risk", "t.ai-impact", "t.ai-soa", "p.documents", "p.quality", "p.gates", "s.42001.aibim"] },
];

export const roleById = (id: string | null | undefined) => BIM_ROLES.find((r) => r.id === id);
