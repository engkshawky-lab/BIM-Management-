// Batch checker for ISO 19650-2 (UK National Annex) container and file names: parses each name, checks every
// field, suggests a corrected name, flags duplicates and, when a delivery plan is given, matches names to its
// containers. Runs entirely in the browser: only names are read, never file contents.

/** UK National Annex type codes (ISO 19650-2 NA.2, table NA.1 and NA.2). */
export const NA_TYPE_CODES: Record<string, string> = {
  AF: "Animation file", BQ: "Bill of quantities", CA: "Calculation", CM: "Combined model", CO: "Correspondence", CP: "Cost plan",
  CR: "Clash rendition", DB: "Database", DR: "Drawing", FN: "File note", HS: "Health and safety", IE: "Information exchange file",
  M2: "2D model", M3: "3D model", MI: "Minutes / action notes", MR: "Model rendition", MS: "Method statement", PP: "Presentation",
  PR: "Programme", RD: "Room data sheet", RI: "Request for information", RP: "Report", SA: "Schedule of accommodation", SH: "Schedule",
  SN: "Snagging list", SP: "Specification", SU: "Survey", VS: "Visualisation",
};
/** UK National Annex role codes. */
export const NA_ROLE_CODES: Record<string, string> = {
  A: "Architect", B: "Building surveyor", C: "Civil engineer", D: "Drainage, highways engineer", E: "Electrical engineer",
  F: "Facilities manager", G: "Geographical and land surveyor", H: "Heating and ventilation designer", I: "Interior designer",
  K: "Client", L: "Landscape architect", M: "Mechanical engineer", P: "Public health engineer", Q: "Quantity surveyor",
  S: "Structural engineer", T: "Town and country planner", W: "Contractor", X: "Subcontractor", Y: "Specialist designer", Z: "General (non-disciplinary)",
};

/** A message as a template with {placeholders}, so the interface can translate the sentence and keep the values. */
export interface Msg { t: string; v?: Record<string, string | number> }
export const formatMsg = (m: Msg, translate: (s: string) => string = (s) => s) =>
  translate(m.t).replace(/\{(\w+)\}/g, (_, k) => { const v = String(m.v?.[k] ?? ""); return k === "field" || k === "hint" ? translate(v) : v; });

export interface FieldRule { id: string; label: string; hint: string; pattern: RegExp; codes?: Record<string, string> }

export const NAME_FIELDS: FieldRule[] = [
  { id: "project", label: "Project", hint: "2–6 letters or digits", pattern: /^[A-Z0-9]{2,6}$/ },
  { id: "originator", label: "Originator", hint: "3–6 letters or digits", pattern: /^[A-Z0-9]{3,6}$/ },
  { id: "volume", label: "Volume / System", hint: "1–2 letters or digits", pattern: /^[A-Z0-9]{1,2}$/ },
  { id: "level", label: "Level / Location", hint: "2 letters or digits", pattern: /^[A-Z0-9]{2}$/ },
  { id: "type", label: "Type", hint: "2 letters or digits", pattern: /^[A-Z0-9]{2}$/, codes: NA_TYPE_CODES },
  { id: "role", label: "Role", hint: "1–2 letters", pattern: /^[A-Z]{1,2}$/, codes: NA_ROLE_CODES },
  { id: "number", label: "Number", hint: "4–6 digits", pattern: /^\d{4,6}$/ },
];

const SUITABILITY = /^(S[0-7]|A[1-9]|B[1-9]|CR|D[1-4])$/;
const REVISION = /^[PC]\d{2}(\.\d{1,2})?$/;

export interface NamingRules {
  separator: string;
  /** When set, the Project field must match. */
  projectCode?: string;
  /** When non-empty, originator codes outside this list are flagged. */
  originators?: string[];
}

export interface NameCheck {
  line: number;
  input: string;
  /** Name without folder path and extension. */
  base: string;
  ext: string;
  /** The seven container fields joined, used to match the delivery plan. */
  container: string;
  fields: Record<string, string>;
  suitability?: string;
  revision?: string;
  errors: Msg[];
  warnings: Msg[];
  /** A corrected name (with the original extension) when one can be derived. */
  suggestion?: string;
  /** True or false when a plan was given; undefined otherwise. */
  inPlan?: boolean;
}

export interface NamingReport {
  results: NameCheck[];
  /** Plan containers with no matching name in the list. */
  notDelivered: string[];
  counts: { total: number; ok: number; errors: number; warnings: number };
}

/** Split "folder/PRJ-ORG-…-0001.pdf" into the base name and extension. */
export function splitName(input: string): { base: string; ext: string } {
  const file = input.trim().split(/[\\/]/).pop() ?? "";
  const m = /^(.*)\.([A-Za-z0-9]{1,5})$/.exec(file);
  return m && m[1] ? { base: m[1], ext: m[2].toLowerCase() } : { base: file, ext: "" };
}

/** Parse and check one base name against the rules; returns fields, extras and problems. */
function checkBase(base: string, rules: NamingRules) {
  const sep = rules.separator || "-";
  const errors: Msg[] = []; const warnings: Msg[] = [];
  const parts = base.split(sep);
  const fields: Record<string, string> = {};
  let suitability: string | undefined; let revision: string | undefined;
  const n = NAME_FIELDS.length;
  if (parts.some((p) => p === "")) errors.push({ t: 'Empty field: check for doubled or trailing "{sep}".', v: { sep } });
  if (parts.length < n) {
    // field-by-field messages would only be noise when the structure itself is wrong
    const other = ["-", "_", " "].find((c) => c !== sep && base.includes(c));
    errors.push(other === " " ? { t: 'Uses spaces between fields instead of "{sep}".', v: { sep } }
      : other ? { t: 'Uses "{other}" between fields instead of "{sep}".', v: { other, sep } }
      : { t: 'Expected {n} fields separated by "{sep}", found {found}.', v: { n, sep, found: parts.length } });
    return { fields, suitability, revision, errors, warnings };
  }
  const extra = parts.slice(n);
  for (const x of extra) {
    if (!suitability && !revision && SUITABILITY.test(x)) suitability = x;
    else if (!revision && REVISION.test(x)) revision = x;
    else { errors.push({ t: 'Unexpected extra field "{x}" after the number (only a status code and a revision may follow).', v: { x } }); break; }
  }
  NAME_FIELDS.forEach((f, i) => {
    const v = parts[i]; if (v === undefined) return;
    fields[f.id] = v;
    if (v !== v.toUpperCase()) errors.push({ t: '{field} "{value}" must be upper case.', v: { field: f.label, value: v } });
    else if (!f.pattern.test(v)) errors.push({ t: '{field} "{value}" is invalid ({hint}).', v: { field: f.label, value: v, hint: f.hint } });
    else if (f.codes && !f.codes[v]) warnings.push({ t: '{field} "{value}" is not a UK National Annex code: confirm it is in the project information standard.', v: { field: f.label, value: v } });
  });
  if (rules.projectCode && fields.project && fields.project.toUpperCase() !== rules.projectCode.toUpperCase())
    errors.push({ t: 'Project "{value}" does not match the project code {code}.', v: { value: fields.project, code: rules.projectCode.toUpperCase() } });
  const orgs = (rules.originators ?? []).map((o) => o.trim().toUpperCase()).filter(Boolean);
  if (orgs.length && fields.originator && !orgs.includes(fields.originator.toUpperCase()))
    warnings.push({ t: "Originator \"{value}\" is not in the project's originator list ({list}).", v: { value: fields.originator, list: orgs.join(", ") } });
  return { fields, suitability, revision, errors, warnings };
}

/** Best-effort fix: upper case, unify separators, drop empty fields, pad the number, set the project code. */
export function suggestName(base: string, rules: NamingRules): string {
  const sep = rules.separator || "-";
  const parts = base.trim().toUpperCase().split(/[\s_\-]+/).filter(Boolean);
  if (rules.projectCode && parts.length >= NAME_FIELDS.length && /^[A-Z0-9]{2,6}$/.test(parts[0])) parts[0] = rules.projectCode.toUpperCase();
  const i = NAME_FIELDS.length - 1;
  if (parts[i] && /^\d{1,3}$/.test(parts[i])) parts[i] = parts[i].padStart(4, "0");
  return parts.join(sep);
}

const containerOf = (fields: Record<string, string>, sep: string) => NAME_FIELDS.map((f) => (fields[f.id] ?? "").toUpperCase()).join(sep);

/** Check a list of names (one per entry; blank entries are skipped). planContainers are container names from a TIDP/MIDP. */
export function checkNames(inputs: string[], rules: NamingRules, planContainers?: string[]): NamingReport {
  const sep = rules.separator || "-";
  const seen = new Map<string, number>();
  const plan = planContainers ? new Set(planContainers.map((c) => c.toUpperCase())) : null;
  const matched = new Set<string>();
  const results: NameCheck[] = [];
  inputs.forEach((raw, idx) => {
    if (!raw.trim()) return;
    const { base, ext } = splitName(raw);
    const c = checkBase(base, rules);
    const container = containerOf(c.fields, sep);
    const r: NameCheck = { line: idx + 1, input: raw.trim(), base, ext, container, fields: c.fields, suitability: c.suitability, revision: c.revision, errors: c.errors, warnings: c.warnings };
    const key = `${base.toUpperCase()}.${ext}`;
    if (seen.has(key)) r.errors.push({ t: "Duplicate of line {line}.", v: { line: seen.get(key)! } }); else seen.set(key, r.line);
    if (r.errors.length) {
      const s = suggestName(base, rules);
      const again = checkBase(s, rules);
      if (s !== base && !again.errors.length) r.suggestion = ext ? `${s}.${ext}` : s;
    }
    if (plan) {
      const target = r.suggestion ? containerOf(checkBase(splitName(r.suggestion).base, rules).fields, sep) : container;
      r.inPlan = plan.has(target);
      if (r.inPlan) matched.add(target);
      else if (!r.errors.length || r.suggestion) r.warnings.push({ t: "Not in the delivery plan (TIDP/MIDP): add it to the plan or check the number." });
    }
    results.push(r);
  });
  const notDelivered = plan ? [...plan].filter((c) => !matched.has(c)) : [];
  return {
    results, notDelivered,
    counts: { total: results.length, ok: results.filter((r) => !r.errors.length && !r.warnings.length).length, errors: results.filter((r) => r.errors.length).length, warnings: results.filter((r) => !r.errors.length && r.warnings.length).length },
  };
}
