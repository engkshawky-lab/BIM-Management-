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
  | { kind: "widget"; widget: "scan-cost" | "ask-ai" | "generate"; title: string; docType?: string };

export interface HubTab { id: string; label: string; blocks: HubBlock[] }
export interface HubSection { id: string; label: string; tabs: HubTab[] }

export interface Hub {
  id: "scan-to-bim" | "dimensions" | "implementation";
  eyebrow: string;
  title: string;
  intro: string;
  sections: HubSection[];
  /** Suggested questions for the hub's AI tutor. */
  aiPrompts: string[];
}
