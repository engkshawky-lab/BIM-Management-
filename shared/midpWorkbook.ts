import type ExcelJS from "exceljs";

// MIDP / TIDP workbooks in the layout appointing parties commonly issue with their EIR: one row per deliverable,
// grouped as Models / Documents, schedules & reports / Drawings / Others, the file name split into its naming
// fields, and a column group per data exchange (stage + programme reference) holding owner, planned and issued
// dates. The same module writes the workbook (project planner and the standalone generators) and reads a filled
// one back, so a client's template can be imported and re-exported.

/** One deliverable at one data exchange. A container issued at several exchanges has one line per exchange. */
export interface MidpLine {
  container: string; title: string; description: string; taskTeam: string;
  /** short code for the task team's TIDP sheet name (originator / discipline) */
  teamCode: string; type: string; nativeFormat: string; exchangeFormats: string; modelRef: string;
  classification: string; costCode: string; revision: string; suitability: string; loin: string;
  /** exchange key (MidpExchange.key); "" when the line is not tied to an exchange */
  exchange: string; planned: string; issued: string; owner: string; status: string;
}
export interface MidpExchange { key: string; name: string; programmeRef: string; date: string }
export interface MidpHeader {
  projectName: string; projectCode: string; appointingParty: string; leadAppointedParty: string;
  preparedBy: string; revision: string; date: string;
}

export const CATEGORIES = ["Models", "Documents, schedules & reports", "Drawings", "Others"] as const;
export type Category = (typeof CATEGORIES)[number];
export function categoryOf(type: string): Category {
  const t = type.trim().toUpperCase().slice(0, 2);
  if (["M2", "M3", "MD"].includes(t)) return "Models";
  if (t === "DR") return "Drawings";
  if (["RP", "SH", "SP", "SC", "CA", "SU", "MI", "MS", "PP", "CO", "IE", "PL", "RD", "RI", "TB", "TN", "TS"].includes(t)) return "Documents, schedules & reports";
  return "Others";
}

/** ISO 19650-2 national annex field names, used when a name splits into seven fields. */
export const NAMING_FIELDS = ["Project", "Originator", "Volume / system", "Level / location", "Type", "Role", "Number"];
export const splitName = (name: string) => (name.trim() ? name.trim().split("-") : []);

/** A deliverable with its cells per exchange (pivot of MidpLine by container). */
export interface MidpItem {
  line: MidpLine;
  cells: Record<string, { planned: string; issued: string; owner: string }>;
}

const itemKey = (l: MidpLine) => (l.container.trim() || `${l.taskTeam}|${l.title}`).toUpperCase();

/** Group lines into deliverables (one per container) with a cell per exchange, by category in template order. */
export function pivot(lines: MidpLine[]): { category: Category; items: MidpItem[] }[] {
  const items = new Map<string, MidpItem>();
  for (const l of lines) {
    const k = itemKey(l);
    let it = items.get(k);
    if (!it) { it = { line: { ...l }, cells: {} }; items.set(k, it); }
    else for (const f of ["description", "nativeFormat", "exchangeFormats", "modelRef", "classification", "costCode", "revision", "suitability", "loin"] as const)
      if (!it.line[f] && l[f]) it.line[f] = l[f];
    if (l.exchange) it.cells[l.exchange] = { planned: l.planned, issued: l.issued, owner: l.owner };
  }
  return CATEGORIES.map((category) => ({ category, items: [...items.values()].filter((i) => categoryOf(i.line.type) === category) }));
}

// ---------------------------------------------------------------- write

const NAVY = "FF1E3A5F", LIGHT = "FFE8EEF6", BAND = "FFD9E2EF", GREY = "FF475569";
const STATIC_COLUMNS: { label: string; width: number; get: (l: MidpLine) => string }[] = [
  { label: "Deliverable (file name)", width: 36, get: (l) => l.container },
  { label: "Description", width: 34, get: (l) => l.description },
  { label: "Title", width: 30, get: (l) => l.title },
  { label: "Task team", width: 18, get: (l) => l.taskTeam },
  { label: "Native format", width: 12, get: (l) => l.nativeFormat },
  { label: "Exchange formats", width: 16, get: (l) => l.exchangeFormats },
  { label: "Model reference (for deliverables extracted from a model)", width: 28, get: (l) => l.modelRef },
];
const TAIL_COLUMNS: { label: string; width: number; get: (l: MidpLine) => string }[] = [
  { label: "Revision (metadata)", width: 11, get: (l) => l.revision },
  { label: "Status code (metadata)", width: 11, get: (l) => l.suitability },
  { label: "Classification", width: 18, get: (l) => l.classification },
  { label: "Cost code", width: 12, get: (l) => l.costCode },
  { label: "LOIN", width: 12, get: (l) => l.loin },
];
export const INSTRUCTIONS = [
  "The lead appointed party creates, maintains and updates this MIDP throughout the appointment. It reflects the appointing party's delivery stages, agreed milestones and accepted formats.",
  "Each task team prepares its TIDP on its own sheet (named with its discipline code) in this workbook, so all TIDPs stay consistent and traceable within the MIDP.",
  "The lead appointed party checks (QA) every TIDP before consolidating it into the MIDP.",
  "Any change to agreed deliverables, formats or dates is recorded in the BEP and agreed in writing with the appointing party before the MIDP is updated.",
  "File names follow the project naming convention in the information standard. Enter the full name in the first column; the naming fields are split out alongside it.",
  "One row per deliverable. Each data exchange has its own column group: owner, planned date and issued date. Leave a group empty when the deliverable is not issued at that exchange.",
  "Submit the MIDP in Excel and PDF and keep it current in the CDE under version control.",
];

function header(ws: ExcelJS.Worksheet, h: MidpHeader, title: string) {
  ws.getCell("A1").value = title; ws.getCell("A1").font = { bold: true, size: 14, color: { argb: NAVY } };
  const rows: [string, string][] = [["Project", `${h.projectName}${h.projectCode ? ` (${h.projectCode})` : ""}`], ["Appointing party", h.appointingParty], ["Lead appointed party", h.leadAppointedParty], ["Prepared by", h.preparedBy], ["Revision", h.revision], ["Date", h.date]];
  rows.forEach(([k, v], i) => { const r = ws.getRow(2 + i); r.getCell(1).value = k; r.getCell(1).font = { bold: true, color: { argb: GREY } }; r.getCell(2).value = v || "—"; });
  return 2 + rows.length + 1;
}

function planSheet(wb: ExcelJS.Workbook, name: string, title: string, h: MidpHeader, exchanges: MidpExchange[], lines: MidpLine[]) {
  const ws = wb.addWorksheet(name.slice(0, 31), { views: [{ state: "frozen", xSplit: 1 }] });
  let r = header(ws, h, title);
  const groups = pivot(lines);
  const nameWidth = Math.max(7, ...lines.map((l) => splitName(l.container).length));
  const fieldLabels = Array.from({ length: nameWidth }, (_, i) => (nameWidth === NAMING_FIELDS.length ? NAMING_FIELDS[i] : `Field ${i + 1}`));
  const staticCount = STATIC_COLUMNS.length + fieldLabels.length + TAIL_COLUMNS.length;
  const exStart = staticCount + 1;
  // exchange group headers: DATA EXCHANGE #n / stage / programme reference
  const rEx = ws.getRow(r), rStage = ws.getRow(r + 1), rRef = ws.getRow(r + 2), rHead = ws.getRow(r + 3);
  rEx.getCell(1).value = "Naming fields follow the project information standard";
  rEx.getCell(1).font = { italic: true, color: { argb: GREY } };
  exchanges.forEach((x, i) => {
    const c = exStart + i * 3;
    ws.mergeCells(rEx.number, c, rEx.number, c + 2); ws.mergeCells(rStage.number, c, rStage.number, c + 2); ws.mergeCells(rRef.number, c, rRef.number, c + 2);
    rEx.getCell(c).value = `DATA EXCHANGE #${String(i + 1).padStart(2, "0")}${x.date ? ` · ${x.date}` : ""}`;
    rStage.getCell(c).value = `STAGE: ${x.name}`;
    rRef.getCell(c).value = `PROGRAMME REF: ${x.programmeRef || "—"}`;
    for (const row of [rEx, rStage, rRef]) { const cell = row.getCell(c); cell.alignment = { horizontal: "center" }; cell.font = { bold: row === rEx, color: { argb: row === rEx ? "FFFFFFFF" : NAVY } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: row === rEx ? NAVY : LIGHT } }; }
  });
  const heads = [...STATIC_COLUMNS.map((c) => c.label), ...fieldLabels, ...TAIL_COLUMNS.map((c) => c.label), ...exchanges.flatMap(() => ["Owner", "Planned date", "Issued date"])];
  heads.forEach((t, i) => { const c = rHead.getCell(i + 1); c.value = t; c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } }; c.alignment = { vertical: "middle", wrapText: true }; });
  rHead.height = 42;
  r = rHead.number + 1;
  for (const g of groups) {
    const band = ws.getRow(r++);
    band.getCell(1).value = g.category.toUpperCase();
    for (let c = 1; c <= heads.length; c++) band.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND } };
    band.getCell(1).font = { bold: true, color: { argb: NAVY } };
    for (const it of g.items) {
      const l = it.line; const fields = splitName(l.container);
      const row = ws.getRow(r++);
      row.values = [
        ...STATIC_COLUMNS.map((c) => c.get(l)), ...fieldLabels.map((_, i) => fields[i] ?? ""), ...TAIL_COLUMNS.map((c) => c.get(l)),
        ...exchanges.flatMap((x) => { const cell = it.cells[x.key]; return cell ? [cell.owner, cell.planned, cell.issued] : ["", "", ""]; }),
      ];
      row.alignment = { vertical: "top", wrapText: true };
    }
    if (!g.items.length) ws.getRow(r++).getCell(1).value = "—";
  }
  ws.columns.forEach((col, i) => { col.width = i < STATIC_COLUMNS.length ? STATIC_COLUMNS[i].width : i < STATIC_COLUMNS.length + fieldLabels.length ? 10 : i < staticCount ? TAIL_COLUMNS[i - STATIC_COLUMNS.length - fieldLabels.length].width : 13; });
  ws.autoFilter = { from: { row: rHead.number, column: 1 }, to: { row: rHead.number, column: heads.length } };
  ws.views = [{ state: "frozen", xSplit: 1, ySplit: rHead.number }];
  return ws;
}

/** Sheet name for a task team's TIDP: "TIDP-<code> <team>". */
export const tidpSheetName = (code: string, team: string) => `TIDP-${(code || "TEAM").replace(/[^A-Za-z0-9]/g, "").toUpperCase()} ${team}`.replace(/[\\/*?:[\]]/g, "").slice(0, 31).trim();

/**
 * Fill a workbook with the MIDP layout: document control, instructions, the consolidated MIDP and one TIDP sheet per
 * task team. kind "tidp" writes only the TIDP sheet(s).
 */
export function writeMidpWorkbook(wb: ExcelJS.Workbook, input: { kind: "midp" | "tidp"; header: MidpHeader; exchanges: MidpExchange[]; lines: MidpLine[] }) {
  const { kind, header: h, exchanges, lines } = input;
  if (kind === "midp") {
    const dc = wb.addWorksheet("00_Document control");
    let r = header(dc, h, "Master Information Delivery Plan (MIDP)");
    dc.getRow(r).values = ["Document history"]; dc.getRow(r).font = { bold: true, color: { argb: NAVY } }; r++;
    dc.getRow(r).values = ["Revision", "Date", "Prepared by", "Reviewed by", "Approved by", "Description"]; dc.getRow(r).font = { bold: true }; r++;
    dc.getRow(r).values = [h.revision, h.date, h.preparedBy, "", "", "Issued from the delivery plan"];
    dc.columns.forEach((c) => { c.width = 22; });
    const ins = wb.addWorksheet("01_Instructions");
    ins.getCell("A1").value = "MIDP / TIDP instructions"; ins.getCell("A1").font = { bold: true, size: 14, color: { argb: NAVY } };
    INSTRUCTIONS.forEach((t, i) => { const row = ins.getRow(3 + i); row.values = [i + 1, t]; row.alignment = { vertical: "top", wrapText: true }; });
    ins.getColumn(1).width = 5; ins.getColumn(2).width = 120;
    planSheet(wb, "MIDP", "Master Information Delivery Plan (MIDP)", h, exchanges, lines);
  }
  const teams = new Map<string, { code: string; lines: MidpLine[] }>();
  for (const l of lines) { const k = l.taskTeam || "Unassigned"; (teams.get(k) ?? teams.set(k, { code: l.teamCode, lines: [] }).get(k)!).lines.push(l); }
  const used = new Set<string>();
  for (const [team, t] of teams) {
    let name = tidpSheetName(t.code, team); let n = 2;
    while (used.has(name)) name = `${tidpSheetName(t.code, team).slice(0, 28)} ${n++}`;
    used.add(name);
    planSheet(wb, name, `Task Information Delivery Plan (TIDP) — ${team}`, h, exchanges, t.lines);
  }
  if (!teams.size) planSheet(wb, "TIDP", "Task Information Delivery Plan (TIDP)", h, exchanges, []);
}

// ---------------------------------------------------------------- read

export interface ParsedPlan { exchanges: MidpExchange[]; lines: MidpLine[]; sheets: string[]; warnings: string[] }

const text = (v: ExcelJS.CellValue): string => {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("result" in v && v.result != null) return text(v.result as ExcelJS.CellValue);
    if ("richText" in v) return v.richText.map((x) => x.text).join("");
    if ("text" in v) return String(v.text);
    return "";
  }
  return String(v).trim();
};
const asDate = (v: ExcelJS.CellValue): string => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = text(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  if (/^\d{5}$/.test(s)) return new Date(Date.UTC(1899, 11, 30) + Number(s) * 86_400_000).toISOString().slice(0, 10);
  return "";
};
const PLACEHOLDER = /X{3,}|^FIELD \d|^—$/i;
const CATEGORY_TYPE: [RegExp, string][] = [[/^MODELS?$/i, "M3"], [/^DRAWINGS?/i, "DR"], [/^(DOCUMENTS|REPORTS|SPECIFICATIONS|SCHEDULES)/i, "RP"], [/^(VISUALI[SZ]ATIONS?|OTHERS?)$/i, ""]];

/** Read MIDP / TIDP sheets laid out as above (or as the common client templates). Sheets without a deliverable header row are skipped. */
export function parseMidpWorkbook(wb: ExcelJS.Workbook): ParsedPlan {
  const exchanges: MidpExchange[] = []; const lines: MidpLine[] = []; const sheets: string[] = []; const warnings: string[] = [];
  const exByName = new Map<string, MidpExchange>();
  // a consolidated MIDP sheet repeats the TIDP rows: read TIDP sheets when there are any, otherwise the MIDP
  const plans = wb.worksheets.filter((ws) => findHeader(ws));
  const tidps = plans.filter((ws) => /TIDP/i.test(ws.name));
  for (const ws of tidps.length ? tidps : plans) {
    const hr = findHeader(ws)!;
    sheets.push(ws.name);
    const cols = new Map<number, string>();
    ws.getRow(hr).eachCell((c, n) => { if (c.master.address === c.address) cols.set(n, text(c.value).toUpperCase().replace(/\s+/g, " ")); });
    const find = (re: RegExp, not?: RegExp) => [...cols].find(([, t]) => re.test(t) && !(not && not.test(t)))?.[0];
    const deliverable = find(/^DELIVERABLE/);
    const fileName = find(/^FILE NAME/);
    const isTitleCol = !!deliverable && /TITLE/.test(cols.get(deliverable)!);
    const c = {
      container: fileName ?? (isTitleCol ? undefined : deliverable), title: isTitleCol ? deliverable : find(/^TITLE$/),
      description: find(/^DESCRIPTION/), team: find(/^TASK TEAM/), native: find(/^NATIVE/), formats: find(/EXCHANGE FORMAT|ADDITIONAL FORMAT/),
      model: find(/MODEL REF|EXTRACTED FROM MODEL/), revision: find(/^REVISION/), status: find(/^STATUS/),
      classification: find(/CLASSIFICATION/) ?? find(/^CODE$/), cost: find(/NRM|COST CODE/), loin: find(/^LOIN|LEVEL OF INFORMATION/),
    };
    // format tick boxes: a sub-header row under "Additional format" with ".pdf", ".ifc", … and "Y"/"x" marks
    const tickCols = new Map<number, string>();
    ws.getRow(hr + 1).eachCell((cell, n) => { const t = text(cell.value); if (/^\.[a-z0-9]{2,5}$/i.test(t) || /^other$/i.test(t)) tickCols.set(n, t.replace(/^\./, "").toUpperCase()); });
    // exchange groups: "DATA EXCHANGE" labels above the header row; each group runs to the next label
    const labels: { col: number; row: number }[] = [];
    // merged cells report the master's value in every column they span: count only the top-left cell
    for (let r = Math.max(1, hr - 6); r < hr; r++) ws.getRow(r).eachCell((cell, n) => { if (cell.master.address === cell.address && /DATA EXCHANGE/i.test(text(cell.value))) labels.push({ col: n, row: r }); });
    labels.sort((a, b) => a.col - b.col);
    const groups = labels.map((l, i) => {
      const end = (labels[i + 1]?.col ?? ws.columnCount + 1) - 1;
      const texts: string[] = [];
      for (let r = l.row + 1; r < hr; r++) for (let cc = l.col; cc <= end; cc++) { const cell = ws.getRow(r).getCell(cc); const t = cell.master.address === cell.address ? text(cell.value) : ""; if (t) texts.push(t); }
      const after = (re: RegExp) => {
        const idx = texts.findIndex((t) => re.test(t)); if (idx < 0) return "";
        const v = texts[idx].replace(re, "").trim() || (texts[idx + 1] && !/:$/.test(texts[idx + 1]) ? texts[idx + 1] : "");
        return v === "—" ? "" : v;
      };
      const stage = after(/^(STAGE|RIBA STAGE \d+)\s*:?/i) || texts.find((t) => !/:$/.test(t) && !/^PROGRAMME REF/i.test(t)) || `Exchange ${i + 1}`;
      const ref = after(/^PROGRAMME REF\s*:?/i);
      // our own export writes the milestone name as the stage; a client template's "stage + milestone" both matter
      const name = [stage, ref && !/DATA VALIDATION/i.test(ref) ? ref : ""].filter(Boolean).join(" — ");
      const labelDate = /(\d{4}-\d{2}-\d{2})/.exec(text(ws.getRow(l.row).getCell(l.col).value))?.[1] ?? "";
      let x = exByName.get(name.toUpperCase());
      if (!x) { x = { key: `X${String(exchanges.length + 1).padStart(2, "0")}`, name, programmeRef: ref, date: labelDate }; exchanges.push(x); exByName.set(name.toUpperCase(), x); }
      const inGroup = [...cols].filter(([n]) => n >= l.col && n <= end);
      const owner = inGroup.find(([, t]) => /OWNER/.test(t))?.[0], issued = inGroup.find(([, t]) => /ACTUAL|ISSUED/.test(t))?.[0];
      // some templates leave the planned-date header blank: take the group's unlabelled column
      let planned = inGroup.find(([, t]) => /PLANNED/.test(t))?.[0];
      if (!planned) for (let cc = l.col; cc <= Math.min(end, l.col + 2); cc++) if (!cols.get(cc) && cc !== owner && cc !== issued) { planned = cc; break; }
      return { x, owner, planned, issued };
    });
    if (!labels.length) warnings.push(`${ws.name}: no "DATA EXCHANGE" columns found; rows were read without exchange dates.`);
    const team = /TIDP/i.test(ws.name) ? ws.name.replace(/^.*TIDP[^A-Za-z0-9]*(TEMPLATE)?[\s-]*/i, "").trim() : "";
    let typeHint = "";
    for (let r = hr + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const get = (n?: number) => (n ? text(row.getCell(n).value) : "");
      const first = get(c.container ?? c.title ?? deliverable);
      const filled = row.actualCellCount;
      if (!first) continue;
      const cat = CATEGORY_TYPE.find(([re]) => re.test(first));
      if (cat && filled <= 2) { typeHint = cat[1]; continue; }
      if (PLACEHOLDER.test(first) || tickCols.size && r === hr + 1) continue;
      const container = c.container ? get(c.container).toUpperCase() : "";
      const fields = splitName(container);
      // type / form is third from the end and the originator sixth from the end in 7- and 8-field conventions
      const type = (fields.length >= 7 ? fields[fields.length - 3] : "") || typeHint;
      const ticked = [...tickCols].filter(([n]) => /^(Y|YES|X|✓|✔|1|TRUE)$/i.test(get(n))).map(([, f]) => f);
      const base: MidpLine = {
        container, title: get(c.title) || get(c.description) || container, description: get(c.description), taskTeam: get(c.team) || team,
        teamCode: fields.length >= 7 ? fields[fields.length - 6] : "", type, nativeFormat: get(c.native).replace(/^\./, "").toUpperCase(),
        exchangeFormats: [get(c.formats), ...ticked].filter((v) => v && !/^(Y|YES)$/i.test(v)).join(", ").toUpperCase(),
        modelRef: get(c.model), classification: get(c.classification), costCode: get(c.cost), revision: get(c.revision), suitability: get(c.status),
        loin: get(c.loin), exchange: "", planned: "", issued: "", owner: "", status: "",
      };
      const hits = groups.map((g) => ({ g, planned: g.planned ? asDate(row.getCell(g.planned).value) : "", issued: g.issued ? asDate(row.getCell(g.issued).value) : "", owner: g.owner ? get(g.owner) : "" }))
        .filter((h) => h.planned || h.issued || h.owner);
      if (!hits.length) lines.push(base);
      for (const h of hits) lines.push({ ...base, exchange: h.g.x.key, planned: h.planned, issued: h.issued, owner: h.owner });
    }
  }
  for (const x of exchanges) x.date ||= lines.filter((l) => l.exchange === x.key && l.planned).map((l) => l.planned).sort().pop() ?? "";
  return { exchanges: exchanges.filter((x) => lines.some((l) => l.exchange === x.key)), lines, sheets, warnings };
}

function findHeader(ws: ExcelJS.Worksheet): number | undefined {
  for (let r = 1; r <= Math.min(ws.rowCount, 40); r++) {
    let hit = false;
    ws.getRow(r).eachCell((c) => { if (/^DELIVERABLE\b/i.test(text(c.value))) hit = true; });
    if (hit) return r;
  }
  return undefined;
}

// ---------------------------------------------------------------- map a parsed workbook onto a project

export interface ImportPlan {
  /** task teams to create, keyed by the name the rows refer to */
  newTeams: { key: string; name: string; originatorCode: string }[];
  /** milestones to create (exchanges with a date that match no milestone) */
  newMilestones: { key: string; name: string; date: string }[];
  rows: {
    teamKey: string; milestoneKey: string | null; containerName: string; title: string; typeCode: string; description: string; nativeFormat: string;
    formats: string[]; modelRef: string; classification: string; costCode: string; loin: string; dueDate: string; actualDate: string;
  }[];
  warnings: string[];
}
const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ");

/**
 * Decide how imported lines land in a project: task teams matched by originator code or name, exchanges matched to
 * milestones by name (or the stage part before " — "), and what has to be created. Keys of existing teams and
 * milestones are their ids; new ones get "new:" keys the caller replaces after creating them.
 */
export function planImport(p: ParsedPlan, teams: { id: string; name: string; originatorCode: string }[], milestones: { id: string; name: string }[]): ImportPlan {
  const out: ImportPlan = { newTeams: [], newMilestones: [], rows: [], warnings: [...p.warnings] };
  const teamKey = (l: MidpLine) => {
    const code = norm(l.teamCode); const name = norm(l.taskTeam);
    const hit = teams.find((t) => (code && norm(t.originatorCode) === code) || (name && norm(t.name) === name));
    if (hit) return hit.id;
    const key = `new:${code || name || "TEAM"}`;
    if (!out.newTeams.some((t) => t.key === key)) out.newTeams.push({ key, name: l.taskTeam || l.teamCode || "Imported task team", originatorCode: /^[A-Z0-9]{3,6}$/.test(code) ? code : "" });
    return key;
  };
  const msKey = new Map<string, string | null>();
  for (const x of p.exchanges) {
    const full = norm(x.name), stage = norm(x.name.split(" — ")[0]);
    const hit = milestones.find((m) => norm(m.name) === full) ?? milestones.find((m) => norm(m.name) === stage);
    if (hit) { msKey.set(x.key, hit.id); continue; }
    if (x.date) { const key = `new:${x.key}`; out.newMilestones.push({ key, name: x.name.slice(0, 160), date: x.date }); msKey.set(x.key, key); }
    else { msKey.set(x.key, null); out.warnings.push(`Exchange "${x.name}" matches no milestone and has no dates, so its rows are imported without a milestone.`); }
  }
  for (const l of p.lines) {
    if (!l.title && !l.container) continue;
    out.rows.push({
      teamKey: teamKey(l), milestoneKey: l.exchange ? msKey.get(l.exchange) ?? null : null, containerName: l.container, title: (l.title || l.container).slice(0, 255),
      typeCode: l.type.slice(0, 2), description: l.description, nativeFormat: l.nativeFormat.slice(0, 20),
      formats: l.exchangeFormats.split(/[,;/\s]+/).map((f) => f.replace(/^\./, "").toUpperCase()).filter(Boolean).slice(0, 10),
      modelRef: l.modelRef, classification: l.classification, costCode: l.costCode, loin: l.loin, dueDate: l.planned, actualDate: l.issued,
    });
  }
  return out;
}
