// Content model for the topic hubs (Scan to BIM, BIM dimensions, implementation).
// A hub has one or more sections; each section has tabs; each tab is a list of blocks.

export type Tone = "blue" | "green" | "amber" | "purple" | "red" | "teal";

export type HubBlock =
  | { kind: "text"; title: string; body: string[] }
  | { kind: "cards"; title: string; cards: { title: string; body: string; tone?: Tone }[] }
  | { kind: "stats"; title: string; stats: { value: string; label: string; source?: string }[] }
  | { kind: "steps"; title: string; steps: { title: string; body: string }[] }
  | { kind: "table"; title: string; columns: string[]; rows: string[][] }
  | { kind: "list"; title: string; items: string[] }
  | { kind: "checklist"; title: string; items: string[] }
  | { kind: "callout"; title: string; body: string; tone: "info" | "warn" | "ok" }
  | { kind: "faq"; title: string; items: { q: string; a: string }[] }
  | { kind: "quiz"; title: string; questions: { q: string; options: string[]; answer: number; why: string }[] }
  /** Interactive widget rendered by the page, e.g. the scan-to-BIM cost estimator. */
  | { kind: "widget"; widget: "scan-cost" | "ask-ai" | "generate"; title: string; docType?: string }
  /** Clickable process diagram: steps in swimlanes (parties); clicking a step shows its detail. */
  | { kind: "process"; title: string; lanes: { id: string; label: string; tone: Tone }[]; steps: ProcessStep[] }
  /** Stage × party grid of document cards with stage/party filters; clicking a card shows its detail. */
  | { kind: "rolematrix"; title: string; parties: { id: string; label: string; tone: Tone }[]; stages: { id: string; label: string; clause: string }[]; docs: RoleDoc[] }
  /** Built-in explanatory illustration drawn by the page (SVG), with an optional caption. */
  | { kind: "graphic"; graphic: GraphicId; title: string; caption?: string }
  /** COBie sheet-by-sheet column reference and blank workbook download, rendered from shared/data/cobieSchema.ts. */
  | { kind: "cobie-schema"; title: string };

export type GraphicId = "lod-progression" | "loin-framework" | "loin-example" | "lod-vs-loi" | "cobie-hierarchy" | "cde-states" | "infra-breakdown" | "mcp-architecture";

export interface RoleDoc {
  stage: string;         // stage id
  party: string;         // party id
  name: string;          // document name, e.g. "Exchange Information Requirements (EIR)"
  summary: string;       // one line shown on the card
  purpose: string;
  keyContent: string[];  // what it must contain
  clause: string;        // e.g. "ISO 19650-2 5.2.1"
  template?: string;     // portal template code when one exists (EIR, BEP-PRE, …)
}

export interface ProcessStep {
  id: string;
  title: string;
  subtitle: string;
  lane: string;          // lane id of the responsible party
  clause: string;        // e.g. "ISO 19650-2 5.1"
  inputs: string[];
  activities: string[];
  outputs: string[];
  documents: string[];   // document names (match template titles/codes where possible)
  tip?: string;          // practical tip or common pitfall
}

export interface HubTab { id: string; label: string; blocks: HubBlock[] }
export interface HubSection { id: string; label: string; tabs: HubTab[] }

export interface Hub {
  id: "scan-to-bim" | "dimensions" | "implementation" | "cobie" | "revit" | "infrastructure" | "loin" | "appointment" | "documents-roles" | "mcp";
  /** Accent colour for the hub's header and cards. */
  tone?: Tone;
  eyebrow: string;
  title: string;
  intro: string;
  sections: HubSection[];
  /** Suggested questions for the hub's AI tutor. */
  aiPrompts: string[];
}
