// EIR writer from a brief: the questionnaire an appointing party answers, the prompt text built from it,
// and pure helpers that assemble generated sections into one Markdown document (EIR and matching AIR).
import { templateById } from "./data/templates";
import { INFO_USES } from "./data/infoUses";
import type { ProjectData } from "./projectData";

export type BriefQuestionType = "text" | "textarea" | "select" | "multiselect";
export type BriefAnswers = Record<string, string | string[]>;
export type EirDocId = "eir" | "air";

export interface BriefQuestion {
  id: string; label: string; hint: string; type: BriefQuestionType; options?: string[];
  /** ProjectData key used to prefill the answer */
  prefillFrom?: keyof ProjectData;
}

export const STAGE_OPTIONS = ["0 Strategic definition", "1 Preparation and briefing", "2 Concept design", "3 Spatial coordination", "4 Technical design", "5 Manufacturing and construction", "6 Handover", "7 Use"];
export const DISCIPLINE_OPTIONS = ["Architecture", "Structural engineering", "Mechanical (HVAC)", "Electrical", "Public health / plumbing", "Fire engineering", "Civil engineering", "Landscape", "Interior design", "Geotechnical", "Survey", "Cost management", "Facilities management"];

export const BRIEF_QUESTIONS: BriefQuestion[] = [
  { id: "projectName", label: "Project name", hint: "As used in the appointment", type: "text", prefillFrom: "name" },
  { id: "projectCode", label: "Project code", hint: "First field of the naming convention, e.g. RVS01", type: "text", prefillFrom: "code" },
  { id: "client", label: "Appointing party (client)", hint: "Organisation issuing the EIR", type: "text", prefillFrom: "client" },
  { id: "assetType", label: "Asset type", hint: "e.g. secondary school, 12-storey office, 4 km road link", type: "text", prefillFrom: "assetType" },
  { id: "clientType", label: "Client type", hint: "Shapes governance, security and handover expectations", type: "select",
    options: ["Public sector", "Private developer", "Owner-occupier", "Infrastructure operator", "Healthcare trust", "Education authority", "Other"] },
  { id: "procurement", label: "Procurement route", hint: "Determines who the lead appointed party is and when", type: "select",
    options: ["Traditional (design-bid-build)", "Design and build", "Two-stage design and build", "Construction management", "Management contracting", "Framework / alliance", "Early contractor involvement"] },
  { id: "stages", label: "Stages in scope", hint: "Stages the appointment covers", type: "multiselect", options: STAGE_OPTIONS, prefillFrom: "stages" },
  { id: "milestones", label: "Key milestones with dates", hint: "One per line, e.g. Stage 3 sign-off – 2027-03-14", type: "textarea", prefillFrom: "stages" },
  { id: "uses", label: "Information uses", hint: "Purposes the information must serve", type: "multiselect", options: INFO_USES.map((u) => u.name), prefillFrom: "purposes" },
  { id: "disciplines", label: "Disciplines", hint: "Task teams expected in the delivery team", type: "multiselect", options: DISCIPLINE_OPTIONS, prefillFrom: "disciplines" },
  { id: "formats", label: "Required formats", hint: "Exchange formats the appointing party will accept", type: "multiselect",
    options: ["IFC 4.3", "IFC 4", "IFC 2x3", "Native authoring files", "PDF", "DWG", "BCF", "COBie (xlsx)", "IDS"] },
  { id: "cde", label: "CDE platform", hint: "e.g. Autodesk Construction Cloud, Viewpoint, ProjectWise", type: "text", prefillFrom: "cde" },
  { id: "classification", label: "Classification system", hint: "Used for elements, systems and spaces", type: "select",
    options: ["Uniclass 2015", "OmniClass", "CoClass", "Uniformat II", "MasterFormat", "Client / local system"], prefillFrom: "classification" },
  { id: "security", label: "Security sensitivity", hint: "Outcome of the ISO 19650-5 security triage", type: "select",
    options: ["Not sensitive", "Sensitive — security-minded approach required", "Not yet assessed"] },
  { id: "fmSystem", label: "Asset data / FM system", hint: "Target CAFM, CMMS or EAM system for handover data", type: "text" },
  { id: "cobie", label: "COBie required?", hint: "Whether asset data is delivered as COBie", type: "select", options: ["Yes", "No", "To be decided"] },
  { id: "special", label: "Special requirements", hint: "Anything else: client standards, sustainability targets, digital twin, local mandates", type: "textarea", prefillFrom: "description" },
];

const asList = (v: string | string[] | undefined) => (Array.isArray(v) ? v : String(v ?? "").split(/\r?\n|,\s*/)).map((s) => s.trim()).filter(Boolean);
const asText = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : String(v ?? "")).trim();
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Match free strings against a question's options (case and punctuation insensitive, prefix or contains). */
function matchOptions(values: string[], options: string[]) {
  return options.filter((o) => values.some((v) => { const a = norm(o), b = norm(v); return !!b && (a === b || a.includes(b) || b.includes(a)); }));
}

/** The prefilled answer for one question from Project data, or undefined when Project data has nothing. */
export function prefillValue(q: BriefQuestion, p: Partial<ProjectData>): string | string[] | undefined {
  if (!q.prefillFrom) return undefined;
  const raw = p[q.prefillFrom];
  if (raw == null) return undefined;
  if (q.id === "milestones" && Array.isArray(raw)) {
    const lines = (raw as ProjectData["stages"]).filter((s) => s.name?.trim()).map((s) => `${[s.code, s.name].filter(Boolean).join(" ")}${s.start || s.end ? ` – ${[s.start, s.end].filter(Boolean).join(" to ")}` : ""}`);
    return lines.length ? lines.join("\n") : undefined;
  }
  let values: string[];
  if (Array.isArray(raw)) values = raw.map((x) => (typeof x === "string" ? x : (x as { name?: string; discipline?: string }).name ?? (x as { discipline?: string }).discipline ?? "")).filter(Boolean);
  else if (typeof raw === "string") values = raw.trim() ? [raw.trim()] : [];
  else return undefined;
  if (!values.length) return undefined;
  if (q.type === "multiselect") { const m = matchOptions(values, q.options ?? []); return m.length ? m : undefined; }
  if (q.type === "select") return matchOptions(values, q.options ?? [])[0] ?? values[0];
  return values.join(q.type === "textarea" ? "\n" : ", ");
}

/** Fill empty answers from Project data; answers the user already gave are kept. */
export function prefillAnswers(p: Partial<ProjectData>, existing: BriefAnswers = {}): BriefAnswers {
  const out: BriefAnswers = { ...existing };
  for (const q of BRIEF_QUESTIONS) {
    if (asList(out[q.id]).length) continue;
    const v = prefillValue(q, p);
    if (v !== undefined) out[q.id] = v;
  }
  return out;
}

/** Questions the brief leaves unanswered (their facts become [TBC] in the document). */
export const unanswered = (a: BriefAnswers) => BRIEF_QUESTIONS.filter((q) => !asList(a[q.id]).length);

/** The brief as prompt text: one line per question, "not stated" where unanswered. */
export function briefToPrompt(a: BriefAnswers): string {
  const lines = BRIEF_QUESTIONS.map((q) => {
    const v = q.type === "textarea" ? asText(a[q.id]).replace(/\n+/g, "; ") : asText(a[q.id]);
    return `- ${q.label}: ${v ? v.slice(0, 3000) : "NOT STATED"}`;
  });
  return `BRIEF FROM THE APPOINTING PARTY\n${lines.join("\n")}`;
}

// ---------------------------------------------------------------- document assembly

export interface GenSection { id: string; title: string; markdown: string }
export interface AssembleMeta { project?: string; code?: string; client?: string; date?: string; assumptions?: string[]; tbc?: string[] }

export const DOC_TITLES: Record<EirDocId, string> = { eir: "Exchange Information Requirements", air: "Asset Information Requirements" };

/** The template's sections in order, with 1-based numbers. */
export function templateSections(id: EirDocId) {
  const t = templateById(id);
  return (t?.sections ?? []).map((s, i) => ({ id: s.id, title: s.title, guidance: s.guidance, n: i + 1, fields: s.fields }));
}

/** Split section ids into batches of a given size (in template order). */
export function batches<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += Math.max(1, size)) out.push(items.slice(i, i + Math.max(1, size)));
  return out;
}

/** Strip fences, HTML and a leading heading, then put the canonical "## n Title" on top. */
export function normaliseSection(n: number, title: string, md: string): string {
  let body = String(md ?? "").replace(/^\s*```(?:markdown|md)?\s*/i, "").replace(/\s*```\s*$/, "")
    .replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, "").replace(/<\/?[a-zA-Z][^<>\n]{0,200}>/g, "").trim();
  body = body.replace(/^#{1,2}\s+[^\n]*\n?/, "").trim();
  return `## ${n} ${title}\n\n${body}`.trim();
}

/** Every distinct [TBC: …] item found in the text. */
export function collectTbc(md: string): string[] {
  const seen = new Set<string>();
  for (const m of String(md).matchAll(/\[TBC:?\s*([^\]]*)\]/gi)) { const s = m[1].trim(); if (s) seen.add(s); }
  return [...seen];
}

const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];

/** One Markdown document from the generated sections, in template order, with assumptions and TBC appendices. */
export function assembleDoc(templateId: EirDocId, sections: GenSection[], meta: AssembleMeta = {}): string {
  const byId = new Map(sections.map((s) => [s.id, s]));
  const order = templateSections(templateId);
  const known = new Set(order.map((s) => s.id));
  const parts: string[] = [];
  let n = 0;
  for (const s of order) { const g = byId.get(s.id); if (g?.markdown.trim()) parts.push(normaliseSection(++n, s.title, g.markdown)); }
  for (const g of sections) if (!known.has(g.id) && g.markdown.trim()) parts.push(normaliseSection(++n, g.title || g.id, g.markdown));
  const code = templateId.toUpperCase();
  const head = [`# ${DOC_TITLES[templateId]} (${code})`, "",
    [meta.project && `**Project:** ${meta.project}${meta.code ? ` (${meta.code})` : ""}`, meta.client && `**Appointing party:** ${meta.client}`, `**Date:** ${meta.date ?? new Date().toISOString().slice(0, 10)}`, "**Status:** Draft for review"].filter(Boolean).join("  \n")];
  const tbc = uniq([...(meta.tbc ?? []), ...parts.flatMap(collectTbc)]);
  const tail: string[] = [];
  if (meta.assumptions?.length) tail.push(`## Appendix A Assumptions\n\n${uniq(meta.assumptions).map((a) => `- ${a}`).join("\n")}`);
  if (tbc.length) tail.push(`## Appendix ${meta.assumptions?.length ? "B" : "A"} Items to be confirmed\n\n${tbc.map((x) => `- ${x}`).join("\n")}`);
  return [head.join("\n"), ...parts, ...tail].join("\n\n") + "\n";
}
