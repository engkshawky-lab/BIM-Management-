import { templates } from "./data/templates";
import type { DocTemplate } from "./data/types";

// Structure knowledge shared by the AI document generator and the AI document review:
// the portal's own ISO 19650 templates define what each document type must contain.

const authored = () => templates.filter((t) => t.standard === "iso19650" && !t.generatedFrom);

/** The portal template a free-text document type refers to, e.g. "Exchange Information Requirements (EIR)" → eir. */
export function matchTemplate(docType: string): DocTemplate | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/isation/g, "ization").replace(/&/g, " ");
  const d = norm(docType);
  const code = /\(([A-Z][A-Z-]{1,8})\)/.exec(docType)?.[1];
  const list = authored();
  if (/\bbep\b|execution plan/.test(d)) return list.find((t) => t.code === (/post/.test(d) ? "BEP-POST" : "BEP-PRE"));
  // an explicit code decides: "(PIR)" has no template, so it must not fall back to a similar title such as OIR
  if (code) return list.find((t) => t.code === code);
  const words = (s: string) => norm(s).split(/[^a-z]+/).filter((w) => w.length > 3);
  return list
    .map((t) => ({ t, score: words(t.title).filter((w) => d.includes(w)).length / Math.max(1, words(t.title).length) }))
    .filter((x) => x.score >= 0.6)
    .sort((a, b) => b.score - a.score)[0]?.t;
}

export interface OutlineSection { title: string; purpose: string; contents: string[]; clauses: string[] }

/** Outline taken from a portal template: one section per template section, with its fields as required contents. */
export const templateOutline = (t: DocTemplate): OutlineSection[] => t.sections.map((s) => ({
  title: s.title,
  purpose: s.guidance,
  contents: s.fields.map((f) => (f.type === "table" ? `${f.label} (table: ${f.columns!.join(", ")})` : f.label)),
  clauses: t.clauseRefs,
}));

/** Compact checklist of what each document type must contain, for the reviewer's system prompt. */
export function reviewChecklists() {
  return authored().map((t) => `### ${t.code} — ${t.title} (${t.clauseRefs.join(", ")})\n${t.sections.map((s, i) => `${i + 1}. ${s.title}: ${s.fields.map((f) => f.label).join("; ")}`).join("\n")}`).join("\n\n");
}

export const reviewTypes = () => authored().map((t) => ({ code: t.code, title: t.title }));

/** Score from requirement coverage, reduced for critical and major findings, so results are consistent run to run. */
export function complianceScore(coverage: { status: string }[], findings: { severity: string }[]) {
  const scored = coverage.filter((c) => ["met", "partial", "missing"].includes(c.status));
  const base = scored.length ? (100 * scored.reduce((a, c) => a + (c.status === "met" ? 1 : c.status === "partial" ? 0.6 : 0), 0)) / scored.length : 50;
  // findings refine the coverage score but must not swamp it: a thorough draft with open items is "major revisions", not "not fit"
  const penalty = Math.min(25, findings.filter((f) => f.severity === "critical").length * 4 + findings.filter((f) => f.severity === "major").length);
  const score = Math.max(0, Math.min(100, Math.round(base - penalty)));
  const verdict = score >= 85 ? "Fit for issue" : score >= 70 ? "Minor revisions" : score >= 45 ? "Major revisions" : "Not fit for purpose";
  return { score, verdict, coveragePct: Math.round(base) };
}
