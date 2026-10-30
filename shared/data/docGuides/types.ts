// Detailed guides for each ISO 19650 document template: what it is, who writes and approves it,
// what goes in each section, how to create it, and how to check it. Paraphrased guidance, not the standard's text.
import type { Link, RoleId, StageId } from "../workflow/types";

export interface DocGuide {
  /** Template id in shared/data/templates.ts, e.g. "eir". */
  id: string;
  /** Template code, e.g. "EIR". */
  code: string;
  name: string;
  /** One sentence. */
  oneLiner: string;
  /** What the document is: 2–3 sentences. */
  what: string;
  /** Why it matters: what goes wrong without it. 2 sentences. */
  why: string;
  /** e.g. "ISO 19650-2 · Invitation to tender" */
  iso: string;
  /** Stages where it is created or updated (ids from workflow/types). */
  stages: StageId[];
  writer: RoleId;
  approver: RoleId;
  contributors: RoleId[];
  /** Codes of documents it draws on (template codes, or "PIR" etc. for documents without a template). */
  inputs: string[];
  /** Codes of documents it feeds. */
  feeds: string[];
  /** One entry per section of the template, in template order. */
  sections: { title: string; whatToWrite: string; example: string }[];
  /** How to create it, in order. */
  howTo: { step: string; tip?: string }[];
  /** Checks before issue. */
  checklist: string[];
  mistakes: { mistake: string; fix: string }[];
  /** Platform tools that help create or check it. */
  tools: Link[];
}
