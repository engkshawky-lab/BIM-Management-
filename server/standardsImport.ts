import ExcelJS from "exceljs";
import { DEFAULT_TAG_FORMAT, stageKey, type AttributeRule, type ClassificationEntry, type ClientStandardData, type CobieRule } from "../shared/standards";

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

function rowsOf(ws: ExcelJS.Worksheet, max = 50000) {
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
    if (!sheet || !field || norm(sheet) === norm(hd[cs]) || norm(field) === norm(hd[cn])) continue;
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
  for (const { c } of stageCols) if (!stages.some((x) => stageKey(x) === stageKey(c))) stages.push(c);
  for (const r of rows.slice(h + 1)) {
    const sheet = r[cs], field = r[cn];
    if (!sheet || !field || norm(sheet) === norm(hd[cs]) || norm(field) === norm(hd[cn]) || /^(yes|no|required)$/i.test(r[stageCols[0].i] ?? "") === false) continue;
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

const PLACEHOLDER_CODE = /^(to be added|tbc|tbd|n\/?a|-|x+)$/i;
const isCode = (v: string | undefined) => !!v && /^[A-Z0-9]{2,8}$/.test(v.trim()) && !PLACEHOLDER_CODE.test(v.trim());
const yes = (v: string | undefined) => /^(y|yes|true|x|✓|required)$/i.test((v ?? "").trim());

/** System / equipment (component) code dictionaries. Headers are matched loosely: "System Code", "System Category Code",
 *  "SYSTEM CODE - E02", "Equipment Category Code", "Component Code" … Optional Uniclass, IFC, MasterFormat and
 *  per-category Yes/No flag columns. Repeated header rows, group headings and placeholders ("to be added") are skipped.
 *  When the system column is only a separate list (far fewer rows than the component column), components are kept
 *  without a system and the systems are returned on their own. */
function importClassification(rows: string[][], into: ClassificationEntry[], systems: Set<string>) {
  const sysCodeRe = /^system( category)? code\b/i, eqCodeRe = /^(equipment( category)?|component|asset( type)?) code\b/i;
  const h = rows.slice(0, 30).findIndex((r) => r.some((c) => sysCodeRe.test(c)) && r.some((c) => eqCodeRe.test(c)));
  if (h < 0) return false;
  const hd = rows[h];
  const find = (re: RegExp) => hd.findIndex((c) => re.test(c));
  const c = {
    sysCode: find(sysCodeRe), eqCode: find(eqCodeRe),
    sys: hd.findIndex((x) => /^system\b/i.test(x) && !/code/i.test(x)), eq: hd.findIndex((x) => /^(equipment|component|asset type)\b/i.test(x) && !/code/i.test(x)),
    ss: find(/uniclass.*(systems|ss).*code|^uniclass ss/i), pr: find(/uniclass.*(products|pr).*code|^uniclass pr/i), ifc: find(/ifc (entity|class)/i), mf: find(/masterformat/i),
  };
  const flagCols = hd.map((x, i) => ({ x, i })).filter(({ x, i }) => i > Math.max(c.sysCode, c.eqCode) && /appears in|required|entry|export|tag/i.test(x) && !/code|name|description|unique|full|part [a-z]/i.test(x));
  const val = (r: string[], i: number) => { const v = i >= 0 ? (r[i] ?? "").trim() : ""; return v && !PLACEHOLDER_CODE.test(v) ? v : undefined; };
  const body = rows.slice(h + 1);
  const withEq = body.filter((r) => isCode(r[c.eqCode]));
  const linked = withEq.filter((r) => isCode(r[c.sysCode])).length >= withEq.length * 0.5;
  let n = 0;
  for (const r of body) {
    const sysCode = (r[c.sysCode] ?? "").trim().toUpperCase(), eqCode = (r[c.eqCode] ?? "").trim().toUpperCase();
    if (isCode(sysCode)) systems.add(sysCode);
    if (!isCode(eqCode)) continue;
    if (linked && !isCode(sysCode)) continue;
    const flags = Object.fromEntries(flagCols.filter(({ i }) => r[i]).map(({ x, i }) => [x.replace(/\s+/g, " ").trim(), yes(r[i])]));
    into.push({ system: linked ? r[c.sys] ?? "" : "", systemCode: linked ? sysCode : "", equipment: r[c.eq] ?? "", equipmentCode: eqCode,
      uniclassSs: val(r, c.ss), uniclassPr: val(r, c.pr), ifcEntity: val(r, c.ifc), masterFormat: val(r, c.mf), ...(Object.keys(flags).length ? { flags } : {}) });
    n++;
  }
  return n > 0 || (systems.size > 0 && withEq.length === 0);
}

/** Level / floor code lists: "Level/Floor Code | Level/Floor Description". Values like "AG_Above ground" give "AG". */
function importLevelCodes(rows: string[][], levels: Set<string>) {
  const hl = rows.slice(0, 30).findIndex((r) => r.some((c) => /^(level|floor|level\/floor) code$/i.test(c)));
  if (hl < 0) return false;
  const lc = rows[hl].findIndex((c) => /^(level|floor|level\/floor) code$/i.test(c));
  let hit = false;
  for (const r of rows.slice(hl + 1)) {
    const code = (r[lc] ?? "").split(/[_:]/)[0].trim().toUpperCase();
    if (/^[A-Z0-9]{1,3}$/.test(code)) { levels.add(code); hit = true; }
  }
  return hit;
}

const CODE_HDR = /^(s\/?n|code|ref(erence)?|id|no\.?|#)$/i;

/** Asset information dictionary: "Code/S-N | Attribute | Description | Format | Type | Unit | Parameter Name | COBie Mapping …".
 *  Rows with only a heading (no attribute) start a new group. */
function importAttributeDictionary(rows: string[][], into: Map<string, AttributeRule>) {
  const h = rows.slice(0, 30).findIndex((r) => r.some((c) => norm(c) === "attribute") && r.some((c) => /parameter name/i.test(c)) && r.some((c) => /^(format|cobie mapping)$/i.test(c)));
  if (h < 0) return false;
  const hd = rows[h];
  const find = (re: RegExp) => hd.findIndex((c) => re.test(c.trim()));
  const c = { code: find(CODE_HDR), name: find(/^attribute$/i), desc: find(/^description$/i), format: find(/^format$/i), type: find(/^(type|data type)$/i), unit: find(/^units?$/i),
    level: find(/^parameter \(?type\/instance|^(type|instance)\s*\/\s*(type|instance)|^parameter$/i), param: find(/^parameter name$/i), map: find(/^cobie mapping$/i), sheet: find(/^cobie sheet$/i), ex: find(/^example/i) };
  let group = "";
  let n = 0;
  for (const r of rows.slice(h + 1)) {
    const name = (r[c.name] ?? "").trim(), code = c.code >= 0 ? (r[c.code] ?? "").trim() : "";
    // merged heading cells repeat the same text across the row
    const others = r.filter((x, i) => i !== c.name && i !== c.code && x?.trim() && x.trim() !== name && x.trim() !== "0").length;
    if (!name || (c.code >= 0 && !code && !others)) { const g = name || r.find((x) => x?.trim()); if (g && g.length < 80) group = g.trim(); continue; }
    if (norm(name) === "attribute") continue;
    const get = (i: number) => (i >= 0 && r[i]?.trim() && r[i].trim() !== "-" ? r[i].trim() : undefined);
    let map = get(c.map);
    if (map && /^attribute\.name$/i.test(map)) map = "Attribute";
    if (!map && get(c.sheet) && /^attribute$/i.test(get(c.sheet)!)) map = "Attribute";
    const key = `${code}|${norm(name)}`;
    const cur = into.get(key);
    into.set(key, { ...(cur ?? { required: {} }), code, group: group || cur?.group || "", name, description: get(c.desc), format: get(c.format), dataType: get(c.type), unit: get(c.unit),
      level: get(c.level), parameterName: get(c.param), cobieMapping: map, example: get(c.ex) } as AttributeRule);
    n++;
  }
  return n > 0;
}

/** Attribute requirements by stage: "Code | Attribute | (Parameter Name) | <stage> | <stage> …" with Yes/No cells, or
 *  stage column pairs "Responsibility | Location" under stage headings (a party code in the cell means required). */
function importAttributeMatrix(rows: string[][], into: Map<string, AttributeRule>, stages: string[]) {
  const h = rows.slice(0, 30).findIndex((r) => r.some((c) => norm(c) === "attribute") && r.some((c) => CODE_HDR.test(c.trim()))
    && !r.some((c) => /^(format|cobie mapping|description)$/i.test(c.trim())));
  if (h < 0) return false;
  const hd = rows[h];
  const cCode = hd.findIndex((c) => CODE_HDR.test(c.trim())), cName = hd.findIndex((c) => norm(c) === "attribute"), cParam = hd.findIndex((c) => /parameter name/i.test(c));
  const first = Math.max(cCode, cName, cParam) + 1;
  const above = (i: number) => rows.slice(Math.max(0, h - 3), h).map((r) => (r[i] ?? "").trim()).filter(Boolean);
  // a stage heading spread over two cells ("STAGE 3:" | "SPATIAL COORDINATION", "PROGRAMME REF:" | "100% SCHEMATIC")
  const headingFor = (i: number) => {
    const lines = rows.slice(Math.max(0, h - 3), h).map((r) => { const a = (r[i] ?? "").trim(), b = (r[i + 1] ?? "").trim(); return /:$/.test(a) ? `${a} ${b}`.trim() : a; }).filter(Boolean);
    const ref = lines.find((l) => /^programme ref/i.test(l))?.replace(/^programme ref:?\s*/i, "");
    return ref || lines.find((l) => /stage/i.test(l)) || lines[0] || "";
  };
  const cols: { i: number; stage: string; party: boolean }[] = [];
  for (let i = first; i < hd.length; i++) {
    const label = (hd[i] ?? "").trim();
    if (/^(location|container)\d*$/i.test(label) || /remark|note|comment/i.test(label)) continue;
    if (/^(responsib|party|role|by)/i.test(label)) { const st = headingFor(i); if (st) cols.push({ i, stage: st, party: true }); continue; }
    if (label && !/^required$/i.test(label)) cols.push({ i, stage: label, party: false });
    else if (!label && above(i).length) cols.push({ i, stage: above(i).join(" "), party: false });
  }
  if (!cols.length) return false;
  let n = 0;
  for (const r of rows.slice(h + 1)) {
    const name = (r[cName] ?? "").trim(), code = (r[cCode] ?? "").trim();
    if (!name || norm(name) === "attribute") continue;
    const cells = cols.map((x) => (r[x.i] ?? "").trim());
    if (!code && into.size && ![...into.keys()].some((k) => k.endsWith(`|${norm(name)}`))) continue;
    if (!cells.some(Boolean)) continue;
    const keys = [...into.keys()];
    const byCode = code ? keys.filter((k) => k.startsWith(`${code}|`)) : [];
    const key = keys.find((k) => k === `${code}|${norm(name)}`) ?? (byCode.length === 1 ? byCode[0] : undefined) ?? keys.find((k) => k.endsWith(`|${norm(name)}`)) ?? `${code}|${norm(name)}`;
    const rule = into.get(key) ?? { code, group: "", name, parameterName: cParam >= 0 ? r[cParam] || undefined : undefined, required: {} };
    cols.forEach((x, j) => {
      const v = cells[j];
      const req = x.party ? !!v && !/^(-|n\/?a|no|none)$/i.test(v) : yes(v);
      rule.required[x.stage] = req;
      if (x.party && req) (rule.responsible ??= {})[x.stage] = v;
    });
    into.set(key, rule); n++;
  }
  if (n) for (const x of cols) if (!stages.some((s) => stageKey(s) === stageKey(x.stage))) stages.push(x.stage);
  return n > 0;
}

export async function importWorkbook(file: string, name: string, std: ClientStandardData): Promise<string[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const rules = new Map(std.cobie.map((r) => [`${r.sheet}.${r.field}`, r]));
  const attrs = new Map((std.attributes ?? []).map((a) => [`${a.code}|${norm(a.name)}`, a]));
  const found: string[] = [];
  const classification: ClassificationEntry[] = [];
  const systems = new Set<string>();
  const levels = new Set<string>();
  const matrices: { rows: string[][]; sheet: string }[] = [];
  for (const ws of wb.worksheets) {
    const rows = rowsOf(ws);
    if (importSchema(rows, rules)) found.push(`COBie schema (${ws.name})`);
    else if (importStageMatrix(rows, rules, std.stages)) found.push(`Stage requirements (${ws.name})`);
    else if (importAttributeDictionary(rows, attrs)) found.push(`Attribute dictionary (${ws.name})`);
    else if (!/aux|wip|temp/i.test(ws.name) && importPicklists(rows, std.picklists)) found.push(`Picklists (${ws.name})`);
    else if (importClassification(rows, classification, systems)) { found.push(`Classification dictionary (${ws.name})`); importLevelCodes(rows, levels); }
    else if (importLevelCodes(rows, levels)) found.push(`Level codes (${ws.name})`);
    else matrices.push({ rows, sheet: ws.name });
  }
  // stage matrices last, so they attach to a dictionary in the same workbook whatever the sheet order
  for (const m of matrices) if (importAttributeMatrix(m.rows, attrs, std.stages)) found.push(`Attribute requirements by stage (${m.sheet})`);
  std.cobie = [...rules.values()];
  std.attributes = [...attrs.values()];
  if (levels.size) {
    std.tag ??= structuredClone(DEFAULT_TAG_FORMAT);
    const p = std.tag.parts.find((x) => x.id === "level");
    if (p) p.codes = [...new Set([...(p.codes ?? []), ...levels])].sort();
  }
  if (classification.length || systems.size) {
    // one entry per system + equipment pair (equipment codes repeat across systems), keeping the most complete row
    const k = (c: ClassificationEntry) => `${c.systemCode.toUpperCase()}|${c.equipmentCode.toUpperCase()}`;
    const merged = new Map(std.classification.map((c) => [k(c), c]));
    for (const c of classification) {
      const cur = merged.get(k(c));
      merged.set(k(c), cur ? { ...c, ...Object.fromEntries(Object.entries(cur).filter(([, v]) => v)) } as ClassificationEntry : c);
    }
    std.classification = [...merged.values()];
    // approved system / equipment codes feed the asset tag format
    const tag = std.tag ?? structuredClone(DEFAULT_TAG_FORMAT);
    const codes = (id: string, list: string[]) => { const p = tag.parts.find((x) => x.id === id); if (p && list.length) p.codes = [...new Set([...(p.codes ?? []), ...list.filter(Boolean).map((s) => s.toUpperCase())])].sort(); };
    codes("system", [...std.classification.map((c) => c.systemCode), ...systems]); codes("equipment", std.classification.map((c) => c.equipmentCode));
    std.tag = tag;
  }
  if (found.length) std.sources.push({ file: name, imported: found, importedAt: new Date().toISOString() });
  return found;
}
