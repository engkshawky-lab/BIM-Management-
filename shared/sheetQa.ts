// Drawing & sheet QA: the title block Claude reads from each PDF sheet, and the deterministic checks run on it
// (ISO 19650-2 UK National Annex container naming, revision format, status / revision consistency, revision table,
// file name, date, scale, sign-off for S3+ and an optional match against the TIDP / MIDP). Pure functions, shared
// by the server (sanitising the AI answer) and the browser (checks re-run locally after edits).

import { checkNames, formatMsg, splitName, type Msg, type NamingRules } from "./namingCheck";
import { parseTransmittalList, purposeOfIssue } from "./transmittal";

export interface RevisionEntry { rev: string; date: string; description: string; by: string }

/** The fields read from one sheet's title block ("" when not shown on the sheet). */
export interface TitleBlock {
  drawingNumber: string; title: string; revision: string; status: string; scale: string; paperSize: string; date: string;
  drawnBy: string; checkedBy: string; approvedBy: string; projectName: string; projectCode: string; originator: string; purpose: string;
  /** Revision table rows, oldest first. */
  revisions: RevisionEntry[];
}
export type Confidence = "high" | "medium" | "low";
export interface ExtractedSheet { page: number; titleBlock: TitleBlock; confidence: Confidence; notes: string }

export type CheckStatus = "pass" | "warn" | "fail";
export interface SheetCheck { id: string; label: string; status: CheckStatus; /** English detail (for export). */ detail: string; /** The same as templates, for translation. */ msgs: Msg[] }
export interface SheetQaResult { checks: SheetCheck[]; score: number }

/** A container from the delivery plan: its name and, when known, its due date, title and planned suitability. */
export interface PlanEntry { name: string; due?: string; title?: string; suitability?: string }
export interface SheetContext {
  fileName: string;
  rules: NamingRules;
  /** Containers from the active TIDP / MIDP; omit to skip the plan check. */
  planContainers?: (string | PlanEntry)[];
  /** Number of sheets read from the same file: a multi-page set is not named after each sheet. */
  sheetsInFile?: number;
}

export const TITLE_FIELDS: { key: Exclude<keyof TitleBlock, "revisions">; label: string }[] = [
  { key: "drawingNumber", label: "Drawing number" }, { key: "title", label: "Title" }, { key: "revision", label: "Revision" },
  { key: "status", label: "Status code" }, { key: "scale", label: "Scale" }, { key: "paperSize", label: "Paper size" }, { key: "date", label: "Date" },
  { key: "drawnBy", label: "Drawn" }, { key: "checkedBy", label: "Checked" }, { key: "approvedBy", label: "Approved" },
  { key: "projectName", label: "Project name" }, { key: "projectCode", label: "Project code" }, { key: "originator", label: "Originator" },
  { key: "purpose", label: "Purpose of issue" },
];

/** Every check, in display order, with a short label for chips. */
export const CHECKS: { id: string; label: string; short: string }[] = [
  { id: "number", label: "Drawing number / container name", short: "Name" },
  { id: "title", label: "Drawing title", short: "Title" },
  { id: "revision", label: "Revision format", short: "Rev" },
  { id: "status", label: "Status (suitability) code", short: "Status" },
  { id: "status-revision", label: "Status matches revision", short: "S/R" },
  { id: "revision-table", label: "Revision table matches title block", short: "Rev table" },
  { id: "file-name", label: "File name matches drawing number", short: "File" },
  { id: "date", label: "Date present", short: "Date" },
  { id: "scale", label: "Scale present", short: "Scale" },
  { id: "paper", label: "Paper size", short: "Paper" },
  { id: "signoff", label: "Drawn / checked / approved", short: "Sign-off" },
  { id: "project", label: "Project code and originator", short: "Project" },
  { id: "purpose", label: "Purpose of issue", short: "Purpose" },
  { id: "plan", label: "Listed in the delivery plan", short: "Plan" },
];
const LABEL = Object.fromEntries(CHECKS.map((c) => [c.id, c.label]));

export const emptyTitleBlock = (): TitleBlock => ({
  drawingNumber: "", title: "", revision: "", status: "", scale: "", paperSize: "", date: "", drawnBy: "", checkedBy: "", approvedBy: "",
  projectName: "", projectCode: "", originator: "", purpose: "", revisions: [],
});

// ---------------------------------------------------------------- sanitising (AI answers and pasted data)

const clean = (v: unknown, max: number) =>
  (typeof v === "string" || typeof v === "number" ? String(v) : "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const NULLISH = /^(n\/?a|none|null|undefined|unknown|not shown|-+|—)$/i;
const field = (v: unknown, max = 200) => { const s = clean(v, max); return NULLISH.test(s) ? "" : s; };

export function sanitiseTitleBlock(raw: unknown): TitleBlock {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const b = emptyTitleBlock();
  for (const f of TITLE_FIELDS) b[f.key] = field(o[f.key], f.key === "title" || f.key === "projectName" || f.key === "purpose" ? 300 : 120);
  b.drawingNumber = b.drawingNumber.replace(/\s+/g, "");
  b.revision = b.revision.replace(/\s+/g, "").toUpperCase();
  b.status = b.status.replace(/\s+/g, "").toUpperCase();
  const rows = Array.isArray(o.revisions) ? o.revisions : [];
  b.revisions = rows.slice(0, 60).flatMap((r) => {
    const x = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
    const e = { rev: field(x.rev, 20).replace(/\s+/g, "").toUpperCase(), date: field(x.date, 40), description: field(x.description, 300), by: field(x.by, 60) };
    return e.rev || e.description ? [e] : [];
  });
  return b;
}

/** The AI's {"sheets":[…]} for one file, sanitised; pages are 1-based and kept in order. */
export function sanitiseSheets(raw: unknown, maxSheets = 200): ExtractedSheet[] {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const list = Array.isArray(o.sheets) ? o.sheets : [];
  return list.slice(0, maxSheets).flatMap((s, i) => {
    if (!s || typeof s !== "object") return [];
    const x = s as Record<string, unknown>;
    const page = Math.min(2000, Math.max(1, Math.round(Number(x.page)) || i + 1));
    const c = clean(x.confidence, 10).toLowerCase();
    return [{ page, titleBlock: sanitiseTitleBlock(x.titleBlock), confidence: (c === "high" || c === "low" ? c : "medium") as Confidence, notes: clean(x.notes, 600) }];
  }).sort((a, b) => a.page - b.page);
}

// ---------------------------------------------------------------- revisions

const REV = /^([PC])(\d{2})(?:\.(\d{1,2}))?$/;
const STATUS = /^(S[0-7]|A[1-9]\d?|B[1-9]\d?|CR|D[1-4])$/;
/** Sort key for a UK NA revision (C after P, then number, then point); null when it is not one. */
export function revisionRank(rev: string): number | null {
  const m = REV.exec(rev.trim().toUpperCase());
  return m ? (m[1] === "C" ? 1_000_000 : 0) + Number(m[2]) * 1000 + Number(m[3] ?? 0) : null;
}
/** The latest revision table row: the highest UK NA revision, or the last row when the table uses other codes. */
export function latestRevision(rows: RevisionEntry[]): RevisionEntry | undefined {
  const withRev = rows.filter((r) => r.rev);
  if (!withRev.length) return undefined;
  const ranks = withRev.map((r) => revisionRank(r.rev));
  if (ranks.some((x) => x === null)) return withRev[withRev.length - 1];
  return withRev.reduce((best, r, i) => (ranks[i]! > revisionRank(best.rev)! ? r : best), withRev[0]);
}

const isSignOffStatus = (s: string) => /^(S[3-7]|A\d+|B\d+|CR)$/.test(s);
const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");
/** Keywords that identify the purpose of issue for a status code (see purposeOfIssue in shared/transmittal). */
const PURPOSE_WORDS: [RegExp, RegExp][] = [
  [/^S0$/, /work in progress|wip|not for issue/i], [/^S1$/, /coordinat/i], [/^S2$/, /information/i], [/^S3$/, /review|comment/i],
  [/^S4$/, /approv|authoris|authoriz|sign.?off|stage/i], [/^S6$/, /pim|authoris|authoriz/i], [/^S7$/, /aim|authoris|authoriz/i],
  [/^[AB]\d+$/, /construction|accepted|authoris|authoriz/i], [/^CR$/, /record|as.?(built|constructed)/i],
  [/^D1$/, /cost/i], [/^D2$/, /tender/i], [/^D3$/, /contractor|design/i], [/^D4$/, /manufactur|procure|fabricat/i],
];

/** Accept common date forms: ISO, DD/MM/YYYY, DD.MM.YY, "12 Mar 2026", "MAR 2026". */
export function parseSheetDate(s: string): string | null {
  const t = s.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})$/.exec(t);
  if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  m = /^(?:(\d{1,2})(?:st|nd|rd|th)?[\s.\-/]+)?([A-Za-z]{3,9})[\s.\-/,]+(\d{2}|\d{4})$/.exec(t);
  if (m) { const mo = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1; if (mo) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], mo, m[1] ? +m[1] : 1); }
  return null;
}
function iso(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1950 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCDate() === d ? dt.toISOString().slice(0, 10) : null;
}

const SCALE = /^(\d+\s*:\s*\d+([.,]\d+)?|NTS|N\.T\.S\.?|NOT TO SCALE|AS SHOWN|AS INDICATED|VARIES|VARIOUS|1\s*\/\s*\d+"?\s*=\s*1'(-0")?)$/i;
const PAPER = /^(A[0-4]|B[0-4]|ANSI\s?[A-E]|ARCH\s?[A-E]|[A-E])(\s*(L|P|LANDSCAPE|PORTRAIT|\(?EXTENDED\)?))?$/i;

// ---------------------------------------------------------------- the checks

const many = (id: string, status: CheckStatus, msgs: Msg[]): SheetCheck => ({ id, label: LABEL[id] ?? id, status, detail: msgs.map((m) => formatMsg(m)).join(" "), msgs });
const mk = (id: string, status: CheckStatus, t: string, v?: Msg["v"]): SheetCheck => many(id, status, [{ t, v }]);
/** A check's detail in the interface language. */
export const checkDetail = (c: SheetCheck, translate: (s: string) => string = (s) => s) => c.msgs.map((m) => formatMsg(m, translate)).join(" ");

export function checkSheet(block: TitleBlock, ctx: SheetContext): SheetQaResult {
  const checks: SheetCheck[] = [];
  const sep = ctx.rules.separator || "-";
  const num = block.drawingNumber.trim();
  const status = norm(block.status);
  const rev = norm(block.revision);

  // 1. drawing number against the naming convention
  const naming = num ? checkNames([num], ctx.rules).results[0] : undefined;
  if (!num) checks.push(mk("number", "fail", "No drawing number found in the title block."));
  else if (naming?.errors.length) checks.push(many("number", "fail", [...naming.errors, ...(naming.suggestion ? [{ t: "Suggested name: {name}", v: { name: naming.suggestion } }] : [])]));
  else if (naming?.warnings.length) checks.push(many("number", "warn", naming.warnings));
  else checks.push(mk("number", "pass", "{number} follows the naming convention.", { number: num }));

  // 2. title
  checks.push(block.title.trim() ? mk("title", "pass", "Title shown.") : mk("title", "fail", "No drawing title found."));

  // 3. revision format
  if (!rev) checks.push(mk("revision", "fail", "No revision found in the title block."));
  else if (!REV.test(rev)) checks.push(mk("revision", "fail", 'Revision "{rev}" is not in the UK National Annex form P01, P01.02 or C01.', { rev }));
  else if (/\./.test(rev) && status && status !== "S0") checks.push(mk("revision", "warn", "{rev} is a work-in-progress (point) revision: shared and published sheets take a whole revision such as {whole}.", { rev, whole: rev.split(".")[0] }));
  else checks.push(mk("revision", "pass", "{rev} is a valid revision.", { rev }));

  // 4. status code
  if (!status) checks.push(mk("status", "fail", "No status (suitability) code found."));
  else if (!STATUS.test(status)) checks.push(mk("status", "fail", 'Status "{status}" is not a UK National Annex code (S0–S7, A1…, B1…, CR, D1–D4).', { status }));
  else if (status === "S0") checks.push(mk("status", "warn", "S0 is work in progress: the sheet should not be issued."));
  else if (status === "S5") checks.push(mk("status", "warn", "S5 was withdrawn from the UK National Annex: confirm the code."));
  else checks.push(mk("status", "pass", "{status}: {purpose}.", { status, purpose: purposeOfIssue(status) }));

  // 5. status against revision (the transmittal builder's rules)
  if (status && rev && STATUS.test(status) && REV.test(rev)) {
    const t = parseTransmittalList(`X\t${status}\t${rev}`)[0];
    const clash = t?.issueMsgs.find((m) => /normally takes/.test(m.t));
    if (clash) checks.push(mk("status-revision", "fail", clash.t, clash.v));
    else if (status === "S0" && !/\./.test(rev)) checks.push(mk("status-revision", "warn", "S0 (work in progress) normally takes a point revision such as {rev}.01.", { rev }));
    else checks.push(mk("status-revision", "pass", "{status} with {rev} is consistent.", { status, rev }));
  } else checks.push(mk("status-revision", "warn", "Cannot compare: status or revision missing or invalid."));

  // 6. revision table
  const latest = latestRevision(block.revisions);
  if (!block.revisions.length) checks.push(mk("revision-table", "warn", "No revision table was read from the sheet."));
  else if (!latest) checks.push(mk("revision-table", "warn", "The revision table has no revision codes."));
  else if (rev && norm(latest.rev) !== rev) checks.push(mk("revision-table", "fail", "Title block shows {rev} but the latest revision table entry is {latest}.", { rev, latest: latest.rev }));
  else if (!rev) checks.push(mk("revision-table", "warn", "Latest revision table entry is {latest}, but the title block has no revision.", { latest: latest.rev }));
  else {
    const bad = block.revisions.filter((r) => r.rev && !REV.test(norm(r.rev))).map((r) => r.rev);
    const dup = block.revisions.map((r) => norm(r.rev)).filter((r, i, a) => r && a.indexOf(r) !== i);
    if (bad.length) checks.push(mk("revision-table", "warn", "Latest entry matches, but some revisions are not in UK National Annex form: {list}.", { list: bad.join(", ") }));
    else if (dup.length) checks.push(mk("revision-table", "warn", "Latest entry matches, but revisions are repeated: {list}.", { list: [...new Set(dup)].join(", ") }));
    else checks.push(mk("revision-table", "pass", "Latest revision table entry is {latest}.", { latest: latest.rev }));
  }

  // 7. file name against the drawing number
  const base = norm(splitName(ctx.fileName).base);
  const n = norm(num);
  if (!n) checks.push(mk("file-name", "warn", "No drawing number to compare with the file name."));
  else if (base === n) checks.push(mk("file-name", "pass", "File name matches the drawing number."));
  else if (base.startsWith(n + sep)) {
    const extra = base.slice(n.length + sep.length).split(sep);
    const fileRev = extra.find((x) => REV.test(x)); const fileStatus = extra.find((x) => STATUS.test(x));
    if (fileRev && rev && fileRev !== rev) checks.push(mk("file-name", "fail", "File name has revision {fileRev} but the title block shows {rev}.", { fileRev, rev }));
    else if (fileStatus && status && fileStatus !== status) checks.push(mk("file-name", "fail", "File name has status {fileStatus} but the title block shows {status}.", { fileStatus, status }));
    else checks.push(mk("file-name", "pass", "File name matches the drawing number (with status / revision suffix)."));
  } else if ((ctx.sheetsInFile ?? 1) > 1) checks.push(mk("file-name", "pass", "Multi-sheet set: the file name is not compared with each sheet."));
  else checks.push(mk("file-name", "fail", 'File name "{file}" does not match the drawing number {number}.', { file: splitName(ctx.fileName).base, number: num }));

  // 8. date
  if (!block.date.trim()) checks.push(mk("date", "fail", "No date found in the title block."));
  else if (!parseSheetDate(block.date)) checks.push(mk("date", "warn", 'Date "{date}" could not be read: use an unambiguous form such as 2026-03-12.', { date: block.date }));
  else checks.push(mk("date", "pass", "Dated {date}.", { date: parseSheetDate(block.date)! }));

  // 9. scale
  if (!block.scale.trim()) checks.push(mk("scale", "fail", "No scale found (state 1:100, NTS or As shown)."));
  else if (block.scale.split(/[,;&]|\band\b/i).map((s) => s.replace(/@\s*(A\d|B\d)\b/i, "").trim()).filter(Boolean).every((s) => SCALE.test(s))) checks.push(mk("scale", "pass", "Scale {scale}.", { scale: block.scale }));
  else checks.push(mk("scale", "warn", 'Scale "{scale}" is not in a recognised form (1:100, NTS, As shown).', { scale: block.scale }));

  // 10. paper size
  if (!block.paperSize.trim()) checks.push(mk("paper", "warn", "No paper size shown: a scale only holds at the stated sheet size."));
  else if (PAPER.test(block.paperSize.trim())) checks.push(mk("paper", "pass", "Paper size {size}.", { size: block.paperSize }));
  else checks.push(mk("paper", "warn", 'Paper size "{size}" is not a standard sheet size.', { size: block.paperSize }));

  // 11. sign-off
  const missing = [!block.drawnBy.trim() && "drawn", !block.checkedBy.trim() && "checked", !block.approvedBy.trim() && "approved"].filter(Boolean) as string[];
  if (status && isSignOffStatus(status) && (missing.includes("checked") || missing.includes("approved")))
    checks.push(mk("signoff", "fail", "{status} needs checked and approved initials; missing: {list}.", { status, list: missing.join(", ") }));
  else if (missing.length) checks.push(mk("signoff", "warn", "Missing: {list}.", { list: missing.join(", ") }));
  else if (block.drawnBy.trim() && norm(block.drawnBy) === norm(block.checkedBy)) checks.push(mk("signoff", "warn", "Drawn and checked by the same person ({who}).", { who: block.drawnBy }));
  else checks.push(mk("signoff", "pass", "Drawn, checked and approved filled in."));

  // 12. project code and originator against the rules and the drawing number
  const probs: Msg[] = [];
  const code = norm(ctx.rules.projectCode ?? "");
  const pc = norm(block.projectCode);
  if (code && pc && pc !== code && !pc.includes(code)) probs.push({ t: "Title block project code {value} is not {code}.", v: { value: block.projectCode, code } });
  if (pc && naming?.fields.project && !pc.includes(norm(naming.fields.project))) probs.push({ t: "Project code {value} differs from the drawing number ({field}).", v: { value: block.projectCode, field: naming.fields.project } });
  const org = norm(block.originator);
  if (org && naming?.fields.originator && org !== norm(naming.fields.originator) && !org.includes(norm(naming.fields.originator)))
    probs.push({ t: "Originator {value} differs from the drawing number ({code}).", v: { value: block.originator, code: naming.fields.originator } });
  if (!block.projectName.trim() && !pc) probs.push({ t: "No project name or code in the title block." });
  if (probs.length) checks.push(many("project", "warn", probs));
  else checks.push(mk("project", "pass", "Project and originator consistent."));

  // 13. purpose of issue
  const expected = status ? purposeOfIssue(status) : "";
  const words = PURPOSE_WORDS.find(([s]) => s.test(status))?.[1];
  if (!block.purpose.trim()) checks.push(mk("purpose", expected && status !== "S0" ? "warn" : "pass", expected ? "No purpose of issue shown; {status} means: {expected}." : "No purpose of issue shown.", { status, expected }));
  else if (words && !words.test(block.purpose)) checks.push(mk("purpose", "warn", '"{purpose}" does not match {status} ({expected}).', { purpose: block.purpose, status, expected }));
  else checks.push(mk("purpose", "pass", "{purpose}", { purpose: block.purpose }));

  // 14. delivery plan
  if (ctx.planContainers) {
    const entries = ctx.planContainers.map((p) => (typeof p === "string" ? { name: p } : p));
    const container = naming ? naming.container.toUpperCase() : "";
    const hit = container ? entries.find((e) => norm(e.name) === norm(container)) : undefined;
    if (!num) checks.push(mk("plan", "warn", "No drawing number to look up in the plan."));
    else if (!hit) checks.push(mk("plan", "warn", "{container} is not in the delivery plan (TIDP/MIDP): add it or check the number.", { container: container || num }));
    else {
      const sheetDate = parseSheetDate(block.date);
      const due = hit.due ? parseSheetDate(hit.due) ?? hit.due : "";
      if (due && sheetDate && sheetDate > due) checks.push(mk("plan", "warn", "In the plan, due {due}; the sheet is dated {date} (late).", { due, date: sheetDate }));
      else if (hit.suitability && status && norm(hit.suitability) !== status) checks.push(mk("plan", "warn", "In the plan with suitability {planned}; the sheet shows {status}.", { planned: hit.suitability, status }));
      else checks.push(mk("plan", "pass", due ? "In the plan, due {due}." : "In the plan (no due date).", { due }));
    }
  }

  return { checks, score: scoreOf(checks) };
}

export const scoreOf = (checks: SheetCheck[]) =>
  checks.length ? Math.round((100 * checks.reduce((s, c) => s + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0)) / checks.length) : 0;
export const overall = (checks: SheetCheck[]): CheckStatus => (checks.some((c) => c.status === "fail") ? "fail" : checks.some((c) => c.status === "warn") ? "warn" : "pass");

// ---------------------------------------------------------------- results, summary and exports

export interface SheetResult extends ExtractedSheet, SheetQaResult { file: string }

export interface SheetQaSummary {
  sheets: number; pass: number; warn: number; fail: number; averageScore: number;
  byCheck: Record<string, { pass: number; warn: number; fail: number }>;
}
export function summarise(results: SheetResult[]): SheetQaSummary {
  const byCheck: SheetQaSummary["byCheck"] = {};
  for (const r of results) for (const c of r.checks) (byCheck[c.id] ??= { pass: 0, warn: 0, fail: 0 })[c.status]++;
  const st = results.map((r) => overall(r.checks));
  return {
    sheets: results.length, pass: st.filter((s) => s === "pass").length, warn: st.filter((s) => s === "warn").length, fail: st.filter((s) => s === "fail").length,
    averageScore: results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0, byCheck,
  };
}

/** One row per sheet (header first) for Excel and CSV. */
export function toRows(results: SheetResult[]): { header: string[]; rows: string[][] } {
  const header = ["File", "Page", ...TITLE_FIELDS.map((f) => f.label), "Revision table", "AI confidence", "AI notes", "Score", "Result",
    ...CHECKS.map((c) => c.label), "Failures", "Warnings"];
  const rows = results.map((r) => {
    const by = new Map(r.checks.map((c) => [c.id, c]));
    return [r.file, String(r.page), ...TITLE_FIELDS.map((f) => r.titleBlock[f.key]),
      r.titleBlock.revisions.map((x) => [x.rev, x.date, x.description].filter(Boolean).join(" ")).join(" | "), r.confidence, r.notes, String(r.score), overall(r.checks),
      ...CHECKS.map((c) => by.get(c.id)?.status ?? ""),
      r.checks.filter((c) => c.status === "fail").map((c) => `${c.label}: ${c.detail}`).join(" | "),
      r.checks.filter((c) => c.status === "warn").map((c) => `${c.label}: ${c.detail}`).join(" | ")];
  });
  return { header, rows };
}

/** One row per check (header first), for the detail sheet of the Excel export. */
export function checkRows(results: SheetResult[]): { header: string[]; rows: string[][] } {
  return {
    header: ["File", "Page", "Drawing number", "Check", "Result", "Detail"],
    rows: results.flatMap((r) => r.checks.map((c) => [r.file, String(r.page), r.titleBlock.drawingNumber, c.label, c.status, c.detail])),
  };
}

/** Sheets with problems as a list for the transmittal builder (name, status, revision, title; tab separated). */
export function transmittalList(results: SheetResult[], onlyIssues = true): string {
  return results.filter((r) => !onlyIssues || overall(r.checks) !== "pass")
    .map((r) => [r.titleBlock.drawingNumber || splitName(r.file).base, r.titleBlock.status, r.titleBlock.revision, r.titleBlock.title].join("\t")).join("\n");
}

/** Plain-text issues list (for a rejection notice or transmittal cover note). */
export function issuesText(results: SheetResult[]): string {
  return results.filter((r) => overall(r.checks) !== "pass").map((r) => {
    const head = `${r.titleBlock.drawingNumber || r.file}${r.titleBlock.revision ? ` ${r.titleBlock.revision}` : ""}${r.titleBlock.title ? ` — ${r.titleBlock.title}` : ""} (${r.file}, p.${r.page})`;
    const lines = r.checks.filter((c) => c.status !== "pass").map((c) => `  - [${c.status === "fail" ? "FAIL" : "WARN"}] ${c.label}: ${c.detail}`);
    return [head, ...lines].join("\n");
  }).join("\n\n");
}
