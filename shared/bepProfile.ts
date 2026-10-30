// "BEP from the EIR": the bidder's company profile, prompt rendering, sanitising of the AI answer
// and assembly of the BEP Markdown with an EIR response matrix appendix. Shared by client, server and tests.

export type BepKind = "pre" | "post";

export interface CompanyField {
  id: string; label: string; hint?: string;
  type: "text" | "textarea" | "select"; options?: string[]; defaultValue: string;
}

export const COMPANY_ROLES = ["Lead appointed party", "Appointed party"] as const;

export const COMPANY_FIELDS: CompanyField[] = [
  { id: "companyName", label: "Company name", type: "text", defaultValue: "" },
  { id: "role", label: "Role on this appointment", type: "select", options: [...COMPANY_ROLES], defaultValue: "Lead appointed party",
    hint: "Lead appointed party: you lead the delivery team; appointed party: you deliver a task team's information" },
  { id: "experience", label: "Relevant experience (projects)", type: "textarea", defaultValue: "",
    hint: "Comparable projects delivered with BIM: name, client, value, your role and the information uses delivered" },
  { id: "people", label: "Key people and roles", type: "textarea", defaultValue: "",
    hint: "Information manager, BIM manager, BIM coordinators, task information managers: name, experience, certifications" },
  { id: "software", label: "Software and versions per discipline", type: "textarea",
    defaultValue: "Architecture: \nStructure: \nMEP: \nCoordination: \nCDE: ",
    hint: "Authoring and coordination software with versions, and the exchange formats you can deliver (IFC, BCF, COBie)" },
  { id: "cde", label: "CDE experience", type: "textarea", defaultValue: "",
    hint: "CDE platforms used, workflow states, who administers it, projects run on it" },
  { id: "it", label: "IT and security set-up", type: "textarea", defaultValue: "",
    hint: "Hardware, network, backups, remote access, ISO 27001 / Cyber Essentials, ISO 19650-5 experience" },
  { id: "training", label: "Training", type: "textarea", defaultValue: "",
    hint: "ISO 19650 and software training, certifications held, induction for new staff" },
  { id: "standards", label: "Standards and templates owned", type: "textarea", defaultValue: "",
    hint: "In-house BIM standards, model templates, object libraries, QA checklists, ISO 9001 / BS EN ISO 19650 certification" },
  { id: "capacity", label: "Capacity", type: "textarea", defaultValue: "",
    hint: "Staff available for this appointment, current workload, how you would scale up" },
];

export type BepProfile = Record<string, string>;

export const defaultProfile = (): BepProfile => Object.fromEntries(COMPANY_FIELDS.map((f) => [f.id, f.defaultValue]));

/** Any stored or posted value as a complete profile with bounded strings. */
export function normaliseProfile(v: unknown): BepProfile {
  const src = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const out = defaultProfile();
  for (const f of COMPANY_FIELDS) {
    const x = src[f.id];
    if (typeof x === "string") out[f.id] = x.slice(0, f.type === "textarea" ? 6000 : 200);
  }
  if (!COMPANY_ROLES.includes(out.role as (typeof COMPANY_ROLES)[number])) out.role = "Lead appointed party";
  return out;
}

/** The profile as plain text for the prompt; blank fields are flagged so the model writes [TBC: …]. */
export function profileToPrompt(profile: BepProfile): string {
  const p = normaliseProfile(profile);
  return COMPANY_FIELDS.map((f) => {
    const v = (p[f.id] ?? "").trim();
    const blank = !v || (f.id === "software" && v.replace(/^[^:\n]*:\s*$/gm, "").trim() === "");
    return `${f.label}: ${blank ? "(not provided)" : v}`;
  }).join("\n");
}

// ---------------------------------------------------------------- AI answer shapes

export interface EirRequirement { ref: string; requirement: string }
export interface BepSection { id: string; title: string; markdown: string }
export interface TraceRow { ref: string; response: string; section: string }

const s = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export function sanitiseRequirements(v: unknown, max = 150): EirRequirement[] {
  const seen = new Set<string>();
  const out: EirRequirement[] = [];
  for (const x of Array.isArray(v) ? v : []) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const requirement = s(o.requirement, 400);
    if (!requirement) continue;
    let ref = s(o.ref, 40) || `EIR-${String(out.length + 1).padStart(2, "0")}`;
    while (seen.has(ref)) ref = `${ref}*`;
    seen.add(ref);
    out.push({ ref, requirement });
    if (out.length >= max) break;
  }
  return out;
}

/** Demote headings so each section's content sits under the "## n. Title" heading that assembleBep writes. */
export function demoteHeadings(md: string): string {
  return md.replace(/^(#{1,2})(\s)/gm, "###$2");
}

/** Keep only the requested sections, in template order, titled from the template. */
export function sanitiseSections(v: unknown, wanted: { id: string; title: string }[]): BepSection[] {
  const got = new Map<string, string>();
  for (const x of Array.isArray(v) ? v : []) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = String(o.id ?? "");
    const match = wanted.find((w) => w.id === id) ?? wanted.find((w) => w.title.toLowerCase() === String(o.title ?? "").trim().toLowerCase());
    if (match && !got.has(match.id)) got.set(match.id, demoteHeadings(String(o.markdown ?? "").trim()).slice(0, 30_000));
  }
  return wanted.filter((w) => got.has(w.id)).map((w) => ({ id: w.id, title: w.title, markdown: got.get(w.id)! }));
}

/** Trace rows must point at a known EIR ref and one of the given sections (by id or title). */
export function sanitiseTrace(v: unknown, refs: string[], sections: { id: string; title: string }[], max = 400): TraceRow[] {
  const known = new Set(refs);
  const out: TraceRow[] = [];
  const dup = new Set<string>();
  for (const x of Array.isArray(v) ? v : []) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const ref = s(o.ref, 40), raw = s(o.section, 120);
    const sec = sections.find((w) => w.id === raw) ?? sections.find((w) => w.title.toLowerCase() === raw.toLowerCase());
    if (!known.has(ref) || !sec || dup.has(ref + "\u0000" + sec.id)) continue;
    dup.add(ref + "\u0000" + sec.id);
    out.push({ ref, response: s(o.response, 600), section: sec.id });
    if (out.length >= max) break;
  }
  return out;
}

export const sanitiseStrings = (v: unknown, max = 30, len = 600): string[] =>
  (Array.isArray(v) ? v : []).map((x) => s(x, len)).filter(Boolean).slice(0, max);

/** How many EIR requirements the BEP responds to, and which it does not. */
export function coverage(requirements: EirRequirement[], trace: TraceRow[]) {
  const answered = new Set(trace.filter((t) => t.response.trim()).map((t) => t.ref));
  const uncovered = requirements.filter((r) => !answered.has(r.ref)).map((r) => r.ref);
  const covered = requirements.length - uncovered.length;
  const bySection: Record<string, number> = {};
  for (const t of trace) bySection[t.section] = (bySection[t.section] ?? 0) + 1;
  return { total: requirements.length, covered, uncovered, percent: requirements.length ? Math.round((covered / requirements.length) * 100) : 0, bySection };
}

/** Split section ids into batches for separate AI calls. */
export function batchIds(ids: string[], size = 4): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += Math.max(1, size)) out.push(ids.slice(i, i + Math.max(1, size)));
  return out;
}

// ---------------------------------------------------------------- Markdown assembly

export interface AssembleMeta {
  title?: string; kind?: BepKind; project?: string; company?: string;
  requirements?: EirRequirement[]; risks?: string[]; clarifications?: string[];
}

const cell = (v: string) => v.replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim() || "—";

/** BEP sections, then risks, tender clarifications and the "EIR response matrix" appendix. */
export function assembleBep(sections: BepSection[], traceRows: TraceRow[], meta: AssembleMeta = {}): string {
  const kind = meta.kind ?? "pre";
  const title = meta.title || `BIM Execution Plan (${kind === "post" ? "Post" : "Pre"}-appointment)`;
  const out: string[] = [`# ${title}`];
  const sub = [meta.project && `Project: ${meta.project}`, meta.company && `Prepared by: ${meta.company}`].filter(Boolean);
  if (sub.length) out.push("", sub.join(" · "));
  const num = new Map<string, string>();
  sections.forEach((sec, i) => {
    num.set(sec.id, `${i + 1}`);
    out.push("", `## ${i + 1}. ${sec.title}`, "", sec.markdown.trim() || "[TBC: section to be written]");
  });
  if (meta.risks?.length) out.push("", "## Risks to information delivery", "", ...meta.risks.map((r) => `- ${r}`));
  if (meta.clarifications?.length) out.push("", "## Clarifications to raise at tender", "", ...meta.clarifications.map((c, i) => `${i + 1}. ${c}`));

  const reqText = new Map((meta.requirements ?? []).map((r) => [r.ref, r.requirement]));
  const titleOf = (id: string) => { const sec = sections.find((x) => x.id === id); return sec ? `${num.get(id)}. ${sec.title}` : id; };
  const rows: string[][] = [];
  const traced = new Set<string>();
  const order = meta.requirements?.length ? meta.requirements.map((r) => r.ref) : [...new Set(traceRows.map((t) => t.ref))];
  for (const ref of order) {
    const hits = traceRows.filter((t) => t.ref === ref);
    if (hits.length) { traced.add(ref); for (const t of hits) rows.push([ref, reqText.get(ref) ?? "", t.response, titleOf(t.section)]); }
    else rows.push([ref, reqText.get(ref) ?? "", "[TBC: no response in this BEP]", "—"]);
  }
  for (const t of traceRows) if (!order.includes(t.ref) && !traced.has(t.ref)) rows.push([t.ref, "", t.response, titleOf(t.section)]);

  out.push("", "## Appendix A. EIR response matrix", "");
  if (meta.requirements?.length) {
    const c = coverage(meta.requirements, traceRows);
    out.push(`${c.covered} of ${c.total} EIR requirements have a response in this BEP (${c.percent}%).`, "");
  }
  out.push("| EIR ref | Requirement | How the BEP responds | BEP section |", "| --- | --- | --- | --- |");
  for (const r of rows) out.push(`| ${r.map(cell).join(" | ")} |`);
  return out.join("\n") + "\n";
}
