// Client information standards: the rules a client's EIR appendices impose (COBie schema,
// picklists, stage-by-stage requirements, classification mapping, asset tag format),
// held as data so one client's standard can be applied to any of their projects.

import type { Finding } from "./delivery";
import type { Sheets } from "./cobie";

export interface CobieRule {
  sheet: string;
  field: string;
  /** e.g. "Contact.Email", "PickList.Category-Role", "Uniclass Pr Products" */
  foreignKey?: string;
  /** AlphaNumeric | Numeric | ISO Date | PickList Values only | Sheet.Name … */
  allowed?: string;
  maxLength?: number;
  /** stage name -> required */
  required: Record<string, boolean>;
}

export interface TagPart {
  id: string;
  label: string;
  group: "location" | "equipment";
  /** exact length, or [min, max] */
  length: number | [number, number];
  charset: "alnum" | "alpha" | "digits";
  /** allowed codes; empty = any value matching length/charset */
  codes?: string[];
}

export interface TagFormat { separator: string; parts: TagPart[]; cobieField: string }

export interface ClassificationEntry { system: string; systemCode: string; equipment: string; equipmentCode: string; uniclassSs?: string; uniclassPr?: string; ifcEntity?: string }

export interface ClientStandardData {
  stages: string[];
  cobie: CobieRule[];
  picklists: Record<string, string[]>;
  classification: ClassificationEntry[];
  tag: TagFormat | null;
  sources: { file: string; imported: string[]; importedAt: string }[];
}

export const emptyStandard = (): ClientStandardData => ({ stages: [], cobie: [], picklists: {}, classification: [], tag: null, sources: [] });

/** A generic tag structure (location + equipment). Clients override lengths and code lists. */
export const DEFAULT_TAG_FORMAT: TagFormat = {
  separator: "-",
  cobieField: "TagNumber",
  parts: [
    { id: "portfolio", label: "Sub-portfolio", group: "location", length: 2, charset: "alnum" },
    { id: "district", label: "District", group: "location", length: 3, charset: "alnum" },
    { id: "wbs", label: "Project WBS", group: "location", length: 3, charset: "alnum" },
    { id: "building", label: "Building", group: "location", length: 4, charset: "alnum" },
    { id: "level", label: "Level / floor", group: "location", length: 2, charset: "alnum" },
    { id: "zone", label: "Zone", group: "location", length: 3, charset: "alnum" },
    { id: "space", label: "Space / room", group: "location", length: [1, 5], charset: "alnum" },
    { id: "system", label: "System category", group: "equipment", length: 4, charset: "alnum" },
    { id: "equipment", label: "Equipment category", group: "equipment", length: 4, charset: "alnum" },
    { id: "number", label: "Unique number", group: "equipment", length: 6, charset: "alnum" },
  ],
};

// ---------------------------------------------------------------- asset tags

const CHARSET: Record<TagPart["charset"], RegExp> = { alnum: /^[A-Z0-9]+$/, alpha: /^[A-Z]+$/, digits: /^[0-9]+$/ };
const lenOk = (s: string, l: TagPart["length"]) => (Array.isArray(l) ? s.length >= l[0] && s.length <= l[1] : s.length === l);
const lenText = (l: TagPart["length"]) => (Array.isArray(l) ? `${l[0]}–${l[1]}` : `${l}`);

/** Validate a full tag (all parts) or only the parts of one group. Returns problems; empty = valid. */
export function validateTag(tag: string, fmt: TagFormat, group?: TagPart["group"]): string[] {
  const parts = fmt.parts.filter((p) => !group || p.group === group);
  const values = tag.trim().toUpperCase().split(fmt.separator);
  if (values.length !== parts.length) return [`Expected ${parts.length} parts separated by "${fmt.separator}", found ${values.length}.`];
  const errs: string[] = [];
  parts.forEach((p, i) => {
    const v = values[i];
    if (!lenOk(v, p.length)) errs.push(`${p.label} "${v}" must be ${lenText(p.length)} characters.`);
    else if (!CHARSET[p.charset].test(v)) errs.push(`${p.label} "${v}" may only contain ${p.charset === "digits" ? "digits" : p.charset === "alpha" ? "letters" : "letters and digits"}.`);
    else if (p.codes?.length && !p.codes.includes(v)) errs.push(`${p.label} "${v}" is not in the approved code list.`);
  });
  return errs;
}

/** Accept either the full tag or the equipment part alone (projects often keep the location tag separately). */
export function validateTagAuto(tag: string, fmt: TagFormat): string[] {
  const n = tag.trim().split(fmt.separator).length;
  const eqParts = fmt.parts.filter((p) => p.group === "equipment").length;
  return n === eqParts ? validateTag(tag, fmt, "equipment") : validateTag(tag, fmt);
}

/** Drop picklist entries that are guidance text rather than codes; a list left empty is not enforced. */
export function cleanPicklist(values: string[]): string[] {
  return values.filter((v) => v.length <= 60 && !/^(refer|this value|shall|should|values? to be|tbc|tbd)\b/i.test(v.trim()) && !/^[A-Z]{2,5}_[A-Z]\d_/.test(v.trim()));
}

export const buildTag = (fmt: TagFormat, values: Record<string, string>) => fmt.parts.map((p) => (values[p.id] ?? "").toUpperCase()).join(fmt.separator);

// ---------------------------------------------------------------- COBie against a client standard

const blank = (v: string | undefined) => !v || !v.trim();
const isNA = (v: string | undefined) => !!v && /^n\/?a$/i.test(v.trim());
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/;
// Reference fields holding comma-separated lists (…Names, Component.Space)
const isMulti = (sheet: string, field: string) => /Names$/.test(field) || `${sheet}.${field}` === "Component.Space";

/** Picklist codes accept "CODE" or "CODE: description" / "CODE - description" forms. */
function inPicklist(value: string, list: string[]) {
  const v = value.trim().toLowerCase();
  return list.some((x) => { const l = x.trim().toLowerCase(); return l === v || v.startsWith(l + ":") || v.startsWith(l + " -") || l.startsWith(v + ":"); });
}

export function validateCobieAgainstStandard(sheets: Sheets, std: ClientStandardData, stage: string): Finding[] {
  const byName = new Map(Object.entries(sheets).map(([k, v]) => [k.toLowerCase(), v]));
  const rows = (s: string) => byName.get(s.toLowerCase()) ?? [];
  const bucket = new Map<string, { severity: Finding["severity"]; area: string; message: string; refs: string[] }>();
  const add = (severity: Finding["severity"], area: string, message: string, ref: string) => {
    const k = `${severity}|${area}|${message}`;
    const b = bucket.get(k) ?? { severity, area, message, refs: [] };
    b.refs.push(ref); bucket.set(k, b);
  };
  const keyOf = (sheet: string, row: Record<string, string>) => (sheet.toLowerCase() === "contact" ? row.Email : row.Name) || "?";

  for (const rule of std.cobie) {
    const data = rows(rule.sheet);
    const required = !!rule.required[stage];
    if (!byName.has(rule.sheet.toLowerCase())) continue; // missing sheets are reported by the base check
    const hasColumn = data.length > 0 && rule.field in data[0];
    if (!hasColumn) { if (required && data.length) add("error", rule.sheet, `Column "${rule.field}" is required at ${stage} but missing`, rule.sheet); continue; }
    for (const row of data) {
      const v = row[rule.field] ?? "";
      const ref = keyOf(rule.sheet, row);
      if (blank(v)) { if (required) add("error", rule.sheet, `"${rule.field}" is required at ${stage}`, ref); continue; }
      if (isNA(v)) { if (required && rule.foreignKey?.startsWith("PickList")) add("warning", rule.sheet, `"${rule.field}" is n/a but required at ${stage}`, ref); continue; }
      if (rule.maxLength && v.length > rule.maxLength) add("error", rule.sheet, `"${rule.field}" longer than ${rule.maxLength} characters`, ref);
      const allowed = (rule.allowed ?? "").toLowerCase();
      if (allowed === "iso date" && !ISO_DATE.test(v)) add("error", rule.sheet, `"${rule.field}" must be an ISO date (YYYY-MM-DDThh:mm:ss)`, ref);
      if (allowed === "numeric" && Number.isNaN(Number(v.replace(/,/g, "")))) add("error", rule.sheet, `"${rule.field}" must be numeric`, ref);
      const fk = rule.foreignKey ?? "";
      if (fk.startsWith("PickList.")) {
        const list = cleanPicklist(std.picklists[fk.slice(9)] ?? []);
        if (list.length && !inPicklist(v, list)) add("error", rule.sheet, `"${rule.field}" value not in picklist ${fk.slice(9)}`, `${ref}: ${v}`);
      } else if (/^Uniclass\s+(\w+)/i.test(fk)) {
        const table = /^Uniclass\s+(\w+)/i.exec(fk)![1];
        if (!new RegExp(`^${table}_\\d`, "i").test(v.trim())) add("warning", rule.sheet, `"${rule.field}" should be a Uniclass ${table} code (e.g. ${table}_..: title)`, `${ref}: ${v}`);
      } else if (/^[A-Za-z]+\.[A-Za-z]+$/.test(fk) && rule.sheet + "." + rule.field !== fk) {
        const [ts, tf] = fk.split(".");
        const pool = new Set(rows(ts).map((r) => (r[tf] ?? "").trim().toLowerCase()));
        if (pool.size || byName.has(ts.toLowerCase())) {
          const values = isMulti(rule.sheet, rule.field) ? v.split(",").map((s) => s.trim()).filter(Boolean) : [v.trim()];
          for (const x of values) if (!isNA(x) && !pool.has(x.toLowerCase())) add("error", rule.sheet, `"${rule.field}" refers to ${fk} that does not exist`, `${ref}: ${x}`);
        }
      }
    }
  }

  // asset tags
  if (std.tag) {
    const field = std.tag.cobieField;
    for (const c of rows("Component")) {
      const v = c[field];
      if (blank(v) || isNA(v)) { add("warning", "Asset tags", `Component has no ${field}`, c.Name || "?"); continue; }
      const errs = validateTagAuto(v, std.tag);
      if (errs.length) add("error", "Asset tags", `${field} does not follow the asset tag format`, `${c.Name}: ${v} (${errs[0]})`);
    }
  }

  // classification mapping: a component's type category should match the dictionary for its equipment code
  if (std.classification.length && std.tag) {
    const eqIdx = std.tag.parts.findIndex((p) => p.id === "equipment");
    const byEq = new Map(std.classification.map((c) => [c.equipmentCode.toUpperCase(), c]));
    const types = new Map(rows("Type").map((t) => [(t.Name ?? "").toLowerCase(), t]));
    for (const c of rows("Component")) {
      const parts = (c[std.tag.cobieField] ?? "").toUpperCase().split(std.tag.separator);
      const eqCount = std.tag.parts.filter((p) => p.group === "equipment").length;
      // equipment-only tags put the equipment code in the 2nd of 3 parts
      const code = parts.length === eqCount ? parts[std.tag.parts.filter((p) => p.group === "equipment").findIndex((p) => p.id === "equipment")] : parts[eqIdx];
      const entry = code ? byEq.get(code) : undefined;
      const type = types.get((c.TypeName ?? "").toLowerCase());
      if (entry?.uniclassPr && type?.Category && !type.Category.trim().toUpperCase().startsWith(entry.uniclassPr.toUpperCase()))
        add("warning", "Classification", `Type category does not match the classification dictionary for its equipment code`, `${c.Name}: ${code} expects ${entry.uniclassPr}, type has ${type.Category}`);
    }
  }

  return [...bucket.values()].map((b) => ({
    severity: b.severity, area: b.area,
    message: `${b.message} — ${b.refs.length} row${b.refs.length > 1 ? "s" : ""}.`,
    ref: b.refs.slice(0, 5).join(", ") + (b.refs.length > 5 ? ` … +${b.refs.length - 5}` : ""),
    clause: "Client standard",
  }));
}

/** Summary used by the UI: how many columns are required at each stage. */
export const requiredCounts = (std: ClientStandardData) => std.stages.map((s) => ({ stage: s, required: std.cobie.filter((r) => r.required[s]).length }));
