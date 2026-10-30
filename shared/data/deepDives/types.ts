// Deep dives for the key ISO 19650 documents (EIR, BEP, AIR): a complete worked example,
// variants for other project types, case studies, a clause library and an assessment rubric.
// Paraphrased practical guidance with fictional projects; not the standard's text.

export interface DeepSection {
  /** Matches a section title of the template where possible. */
  title: string;
  /** Short note on why this section is written the way it is. */
  note: string;
  /** The section as written in the example document: paragraphs in order. */
  paragraphs: string[];
  /** Optional table as it appears in the document. */
  table?: { columns: string[]; rows: string[][] };
}

export interface DeepDive {
  /** Template id in shared/data/templates.ts: "eir" | "bep-pre" | "bep-post" | "air". */
  id: string;
  code: string;
  /** The fictional project the full example is written for. */
  project: { name: string; code: string; type: string; client: string; value: string; stages: string; location: string; summary: string };
  /** The complete document, section by section. */
  example: DeepSection[];
  /** How the document changes for other project types. */
  variants: { title: string; projectType: string; differences: string[]; sample: string }[];
  /** Case studies: realistic, fictionalised. */
  caseStudies: { title: string; sector: string; situation: string; whatHappened: string[]; outcome: string; lessons: string[]; good: boolean }[];
  /** Reusable wording by topic. */
  clauses: { topic: string; label: string; text: string }[];
  /** How to assess the document. */
  rubric: { criterion: string; weight: number; excellent: string; poor: string }[];
}
