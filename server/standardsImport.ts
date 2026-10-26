import ExcelJS from "exceljs";
import { DEFAULT_TAG_FORMAT, type ClassificationEntry, type ClientStandardData, type CobieRule } from "../shared/standards";

// Reads a client's EIR appendix workbooks and extracts their rules. Sheets are recognised
// by their header rows (not by name), so differently titled workbooks still import.

const text = (v: ExcelJS.CellValue): string => {
  if (v === null || v === undefined) return "";
  // whole-day dates stay date-only so length rules on date columns hold
  if (v instanceof Date) return v.toISOString().endsWith("T00:00:00.000Z") ? v.toISOString().slice(0, 10) : v.toISOString().slice(0, 19);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("result" in v) return text(v.result as ExcelJS.CellValue);
    if ("text" in v) return String(v.text);
    return "";
  }
  return String(v).replace(/\s+/g, " ").trim();
};
const norm = (s: string | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function rowsOf(ws: ExcelJS.Worksheet, max = 5000) {
  const out: string[][] = [];
  const n = Math.min(ws.rowCount, max);
  for (let i = 1; i <= n; i++) {
    const vals = ws.getRow(i).values as ExcelJS.CellValue[];
    out.push(Array.isArray(vals) ? Array.from(vals.slice(1), text) : []);
  }
  return out;
}
const findHeader = (rows: string[][], need: string[], limit = 30) =>
  rows.slice(0, limit).findIndex((r) => need.every((n) => r.some((c) => norm(c) === norm(n))));
const col = (header: string[], name: string) => header.findIndex((c) => norm(c) === norm(name));

/** "COBie Sheet | Column | COBie Name | Foreign Key | Definition | Allowed Values | Max. Length …" */
function importSchema(rows: string[][], into: Map<string, CobieRule>) {
  const h = findHeader(rows, ["COBie Sheet", "COBie Name", "Foreign Key"]);
  if (h < 0) return false;
  const hd = rows[h];
  const [cs, cn, cf, ca, cm] = [col(hd, "COBie Sheet"), col(hd, "COBie Name"), col(hd, "Foreign Key"), col(hd, "Allowed Values"), hd.findIndex((c) => /max/i.test(c) && /length/i.test(c))];
  for (const r of rows.slice(h + 1)) {
    const sheet = r[cs], field = r[cn];
    if (!sheet || !field || norm(sheet) === "cobiesheet") continue;
    const key = `${sheet}.${field}`;
    const rule = into.get(key) ?? { sheet, field, required: {} };
    const fk = r[cf];
    if (fk && fk !== "-") rule.foreignKey = fk;
    if (ca >= 0 && r[ca]) rule.allowed = r[ca];
    const len = cm >= 0 ? parseInt(r[cm], 10) : NaN;
    if (Number.isFinite(len)) rule.maxLength = len;
    into.set(key, rule);
  }
  return true;
}

/** "COBie Sheet | Column | COBie Name | <stage> | <stage> … | REMARKS" with Yes/No cells. */
function importStageMatrix(rows: string[][], into: Map<string, CobieRule>, stages: string[]) {
  const h = findHeader(rows, ["COBie Sheet", "COBie Name"]);
  if (h < 0 || rows[h].some((c) => norm(c) === "foreignkey")) return false;
  const hd = rows[h];
  const [cs, cn] = [col(hd, "COBie Sheet"), col(hd, "COBie Name")];
  const stageCols = hd.map((c, i) => ({ c, i })).filter(({ c, i }) => i > cn && c && !/remark|note|comment/i.test(c));
  if (!stageCols.length) return false;
  for (const { c } of stageCols) if (!stages.includes(c)) stages.push(c);
  for (const r of rows.slice(h + 1)) {
    const sheet = r[cs], field = r[cn];
    if (!sheet || !field || /^(yes|no|required)$/i.test(r[stageCols[0].i] ?? "") === false) continue;
    const key = `${sheet}.${field}`;
    const rule = into.get(key) ?? { sheet, field, required: {} };
    for (const { c, i } of stageCols) rule.required[c] = /^y/i.test(r[i] ?? "");
    into.set(key, rule);
  }
  return true;
}

/** A row of list names like "Category-Role | | | YesNo-Common …" with values underneath. */
function importPicklists(rows: string[][], into: Record<string, string[]>) {
  const h = rows.slice(0, 15).findIndex((r) => r.filter((c) => /^[A-Za-z]+-[A-Za-z]+$/.test(c)).length >= 3);
  if (h < 0) return false;
  rows[h].forEach((name, i) => {
    if (!/^[A-Za-z]+-[A-Za-z]+$/.test(name)) return;
    const values: string[] = [];
    for (const r of rows.slice(h + 1)) { const v = r[i]; if (v && !/^values? to be added$/i.test(v)) values.push(v); }
    if (values.length) into[name] = [...new Set(values)];
  });
  return true;
}

/** "System Category | System Code | Equipment Category | Equipment Category Code | … Uniclass … | IFC Entity" */
function importClassification(rows: string[][], into: ClassificationEntry[]) {
  const h = findHeader(rows, ["System Code", "Equipment Category Code"]);
  if (h < 0) return false;
  const hd = rows[h];
  const find = (re: RegExp) => hd.findIndex((c) => re.test(c));
  const c = { sys: find(/^system category$/i), sysCode: find(/^system code$/i), eq: find(/^equipment category$/i), eqCode: find(/^equipment category code$/i),
    ss: find(/uniclass.*systems.*code/i), pr: find(/uniclass.*products.*code/i), ifc: find(/ifc entity/i) };
  // placeholder cells ("to be added", "TBC", "-") are not codes
  const val = (i: number) => { const v = i >= 0 ? r0[i] ?? "" : ""; return v && !/^(to be added|tbc|tbd|n\/?a|-)$/i.test(v.trim()) ? v : undefined; };
  let r0: string[] = [];
  for (const r of rows.slice(h + 1)) {
    r0 = r;
    if (!r[c.sysCode] || !r[c.eqCode]) continue;
    into.push({ system: r[c.sys] ?? "", systemCode: r[c.sysCode], equipment: r[c.eq] ?? "", equipmentCode: r[c.eqCode],
      uniclassSs: val(c.ss), uniclassPr: val(c.pr), ifcEntity: val(c.ifc) });
  }
  return true;
}

/** Asset tag codification picklists: "System Category Description | System Category Code | Equipment Category Description | Equipment Category Code"
 *  and/or "Level/Floor Code | Level/Floor Description". Codes found feed the tag format directly. */
function importTagCodes(rows: string[][], into: ClassificationEntry[], levels: Set<string>) {
  const isCode = (v: string | undefined) => !!v && /^[A-Z0-9]{1,6}$/.test(v.trim());
  let hit = false;
  const he = findHeader(rows, ["System Category Description", "System Category Code", "Equipment Category Description", "Equipment Category Code"], 12);
  if (he >= 0) {
    const hd = rows[he];
    const c = { sys: col(hd, "System Category Description"), sysCode: col(hd, "System Category Code"), eq: col(hd, "Equipment Category Description"), eqCode: col(hd, "Equipment Category Code") };
    for (const r of rows.slice(he + 1)) if (isCode(r[c.sysCode]) && isCode(r[c.eqCode]) && !/^\d+$/.test(r[c.eqCode])) {
      into.push({ system: r[c.sys] ?? "", systemCode: r[c.sysCode].trim(), equipment: r[c.eq] ?? "", equipmentCode: r[c.eqCode].trim() }); hit = true;
    }
  }
  const hl = findHeader(rows, ["Level/Floor Code", "Level/Floor Description"], 12);
  if (hl >= 0) {
    const lc = col(rows[hl], "Level/Floor Code");
    for (const r of rows.slice(hl + 1)) if (isCode(r[lc]) && r[lc].trim().length <= 3) { levels.add(r[lc].trim()); hit = true; }
  }
  return hit;
}

export async function importWorkbook(file: string, name: string, std: ClientStandardData): Promise<string[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const rules = new Map(std.cobie.map((r) => [`${r.sheet}.${r.field}`, r]));
  const found: string[] = [];
  const classification: ClassificationEntry[] = [];
  const levels = new Set<string>();
  for (const ws of wb.worksheets) {
    const rows = rowsOf(ws);
    if (importSchema(rows, rules)) found.push(`COBie schema (${ws.name})`);
    else if (importStageMatrix(rows, rules, std.stages)) found.push(`Stage requirements (${ws.name})`);
    else if (!/aux|wip|temp/i.test(ws.name) && importPicklists(rows, std.picklists)) found.push(`Picklists (${ws.name})`);
    else if (importClassification(rows, classification)) found.push(`Classification dictionary (${ws.name})`);
    else if (importTagCodes(rows, classification, levels)) found.push(`Asset tag codes (${ws.name})`);
  }
  std.cobie = [...rules.values()];
  if (levels.size) {
    std.tag ??= structuredClone(DEFAULT_TAG_FORMAT);
    const p = std.tag.parts.find((x) => x.id === "level");
    if (p) p.codes = [...new Set([...(p.codes ?? []), ...levels])].sort();
  }
  if (classification.length) {
    // one entry per equipment code, preferring the most complete row across sheets
    const merged = new Map(std.classification.map((c) => [c.equipmentCode, c]));
    for (const c of classification) {
      const cur = merged.get(c.equipmentCode);
      merged.set(c.equipmentCode, cur ? { ...c, ...Object.fromEntries(Object.entries(cur).filter(([, v]) => v)) } as ClassificationEntry : c);
    }
    std.classification = [...merged.values()];
    // approved system / equipment codes feed the asset tag format
    const tag = std.tag ?? structuredClone(DEFAULT_TAG_FORMAT);
    const codes = (id: string, pick: (c: ClassificationEntry) => string) => { const p = tag.parts.find((x) => x.id === id); if (p) p.codes = [...new Set(std.classification.map(pick).map((s) => s.toUpperCase()))].sort(); };
    codes("system", (c) => c.systemCode); codes("equipment", (c) => c.equipmentCode);
    std.tag = tag;
  }
  if (found.length) std.sources.push({ file: name, imported: found, importedAt: new Date().toISOString() });
  return found;
}
