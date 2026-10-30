// Project workflow, document workflow and who does what at each stage.
// Paraphrased practical guidance aligned to ISO 19650-2/-3 (UK National Annex codes); not the standard's text.

export type StageId = "need" | "tender" | "response" | "appointment" | "mobilisation" | "design" | "construction" | "delivery" | "handover" | "operation";
export type RoleId =
  | "client" | "client-im" | "pm" | "lead-designer" | "bim-manager" | "lap-im" | "coordinator"
  | "ttm" | "author" | "contractor" | "specialist" | "fm" | "security" | "hs";

/** Stage order and short names; content in stages.ts follows this order. */
export const STAGE_IDS: StageId[] = ["need", "tender", "response", "appointment", "mobilisation", "design", "construction", "delivery", "handover", "operation"];
/** Role order and titles; profiles in roles.ts and duties in duties.ts use these ids. */
export const ROLE_TITLES: Record<RoleId, string> = {
  client: "Client / asset owner",
  "client-im": "Client information manager",
  pm: "Project manager",
  "lead-designer": "Lead designer / lead consultant",
  "bim-manager": "BIM manager",
  "lap-im": "Information manager (delivery team)",
  coordinator: "BIM coordinator",
  ttm: "Task team manager",
  author: "Modeller / information author",
  contractor: "Main contractor",
  specialist: "Specialist subcontractor",
  fm: "Facility / asset manager",
  security: "Security lead",
  hs: "Health and safety lead (principal designer)",
};
export const ROLE_IDS = Object.keys(ROLE_TITLES) as RoleId[];

export interface Link { label: string; path: string }

export interface WfStage {
  id: StageId;
  title: string;
  phase: "Pre-appointment" | "Appointment" | "Delivery" | "Handover" | "Operation";
  /** e.g. "ISO 19650-2, assessment and need" */
  iso: string;
  purpose: string;
  /** What happens, in order. */
  steps: string[];
  /** Exit criteria: what must be true before moving on. */
  gate: string[];
  /** Documents created, updated, approved or used in this stage. */
  documents: { name: string; code?: string; action: "create" | "update" | "approve" | "use" }[];
  /** Typical problems and how to prevent them. */
  pitfalls: { problem: string; prevent: string }[];
  tools: Link[];
}

export type Raci = "R" | "A" | "C" | "I" | "";
/** One role in one stage. raci "" means no part in that stage (duty may then be empty). */
export interface WfDuty { role: RoleId; stage: StageId; raci: Raci; duty: string }

export interface WfRole {
  id: RoleId;
  title: string;
  party: "Appointing party" | "Lead appointed party" | "Appointed party" | "Depends on the appointment";
  summary: string;
  responsibilities: string[];
  /** Documents this role writes or is accountable for. */
  owns: string[];
  skills: string[];
  kpis: string[];
  tools: Link[];
}

export interface DocStep {
  id: string;
  title: string;
  state: "WIP" | "Shared" | "Published" | "Archived";
  /** Suitability code or codes, e.g. "S0" or "S1–S4". */
  code: string;
  /** Example revision, e.g. "P01.01". */
  revision: string;
  who: string;
  actions: string[];
  checks: string[];
  /** What goes wrong here most often. */
  failure: string;
}

export interface DocFlow { id: string; title: string; summary: string; steps: DocStep[] }
