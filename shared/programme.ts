// Project programme import for the "TIDP / MIDP from the programme" tool: pure parsers for MS Project XML,
// Primavera P6 XER and CSV / spreadsheet rows into one Activity shape, a version-to-version diff, and the
// impact of that diff on delivery plan rows linked to activities. No DOM or Node APIs, so it runs anywhere.

export interface Activity {
  /** Native id: MS Project UID, P6 task_id, or the CSV id column. */
  id: string;
  /** Activity code shown to people (P6 task_code, CSV code column); "" when the format has none. */
  code: string;
  name: string;
  /** ISO dates (YYYY-MM-DD) or "". */
  start: string;
  finish: string;
  milestone: boolean;
  /** WBS code or discipline / group text. */
  wbs: string;
  /** Predecessors as activity keys (see actKey). */
  predecessors: string[];
  /** Summary / WBS roll-up rows (MS Project summary tasks, P6 level of effort / WBS summary). */
  summary?: boolean;
  /** Name of the parent summary task or WBS node, when known. */
  group?: string;
}

/** The stable key used to link activities across programme versions and to plan rows. */
export const actKey = (a: Pick<Activity, "id" | "code">) => a.code || a.id;

// ---------------------------------------------------------------- dates

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => {
  if (y < 100) y += y < 70 ? 2000 : 1900;
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 1900 && y < 2200)) return "";
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 ? `${y}-${pad(m)}-${pad(d)}` : "";
};

/** Normalise a programme date to YYYY-MM-DD: ISO, D/M/Y (UK order), "15-Jan-24", "15 January 2024", Excel serials. */
export function toIsoDate(v: unknown): string {
  if (v instanceof Date) return isNaN(v.getTime()) ? "" : v.toISOString().slice(0, 10);
  if (typeof v === "number") return excelSerial(v);
  let s = String(v ?? "").trim();
  if (!s) return "";
  s = s.replace(/\s*[A*]$/, "").trim(); // P6 actual / constraint markers: "15-Jan-24 A", "15-Jan-24*"
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})/.exec(s);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})/.exec(s);
  if (m) {
    const a = +m[1], b = +m[2];
    // UK order unless the first part cannot be a day-of-month pairing (e.g. 01/25/2024)
    return b > 12 && a <= 12 ? iso(+m[3], a, b) : iso(+m[3], b, a);
  }
  m = /^(?:[A-Za-z]{3,9},?\s+)?(\d{1,2})[\s-]+([A-Za-z]{3,9})[\s,-]+(\d{2,4})/.exec(s);
  if (m && MONTHS[m[2].toLowerCase().slice(0, 3)]) return iso(+m[3], MONTHS[m[2].toLowerCase().slice(0, 3)], +m[1]);
  m = /^(?:[A-Za-z]{3,9},?\s+)?([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/.exec(s);
  if (m && MONTHS[m[1].toLowerCase().slice(0, 3)]) return iso(+m[3], MONTHS[m[1].toLowerCase().slice(0, 3)], +m[2]);
  if (/^\d{5}(\.\d+)?$/.test(s)) return excelSerial(parseFloat(s));
  return "";
}
function excelSerial(n: number) {
  if (!(n > 20000 && n < 80000)) return "";
  return new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86_400_000).toISOString().slice(0, 10);
}

/** Whole days from a to b (ISO dates); 0 when either is missing. */
export const daysBetween = (a: string, b: string) => (a && b ? Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) : 0);
export const addDays = (d: string, n: number) => (d ? new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10) : "");

// ---------------------------------------------------------------- MS Project XML

const decode = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");
const tag = (xml: string, name: string) => { const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml); return m ? decode(m[1]).trim() : ""; };
const flag = (v: string) => v === "1" || v.toLowerCase() === "true";

/** MS Project XML (File > Save As > XML): Tasks/Task with UID, Name, Start, Finish, Duration, OutlineLevel, Summary, Milestone, PredecessorLink. */
export function parseMsProjectXml(xml: string): Activity[] {
  const tasksBlock = /<Tasks(?:\s[^>]*)?>([\s\S]*?)<\/Tasks>/.exec(xml)?.[1];
  if (tasksBlock === undefined) throw new Error("Not an MS Project XML file: no <Tasks> element found.");
  const out: Activity[] = [];
  const parents: string[] = [];
  for (const m of tasksBlock.matchAll(/<Task(?:\s[^>]*)?>([\s\S]*?)<\/Task>/g)) {
    const body = m[1];
    const preds = [...body.matchAll(/<PredecessorLink>([\s\S]*?)<\/PredecessorLink>/g)].map((p) => tag(p[1], "PredecessorUID")).filter(Boolean);
    // nested blocks carry their own Start / Finish (baselines, extended attributes): read only the task's own fields
    const own = body.replace(/<(PredecessorLink|Baseline|ExtendedAttribute|TimephasedData|OutlineCode)>[\s\S]*?<\/\1>/g, "");
    const uid = tag(own, "UID");
    const level = parseInt(tag(own, "OutlineLevel") || "1", 10);
    const name = tag(own, "Name");
    if (!uid || level === 0 || flag(tag(own, "IsNull"))) continue; // project summary task and blank rows
    const summary = flag(tag(own, "Summary"));
    const duration = tag(own, "Duration");
    const zeroDuration = /^PT0H0M0S$/.test(duration) || /^P0D$/.test(duration);
    parents.length = Math.max(0, level - 1);
    const group = parents.filter(Boolean).slice(-1)[0] ?? "";
    out.push({
      id: uid, code: "", name, start: toIsoDate(tag(own, "Start")), finish: toIsoDate(tag(own, "Finish")),
      milestone: flag(tag(own, "Milestone")) || (zeroDuration && !summary), wbs: tag(own, "WBS") || tag(own, "OutlineNumber"),
      predecessors: preds, summary, group,
    });
    if (summary) parents[level - 1] = name;
  }
  return out;
}

// ---------------------------------------------------------------- Primavera P6 XER

/** Tables of an XER file: %T name, %F field list, %R rows (tab separated). */
export function xerTables(text: string): Record<string, Record<string, string>[]> {
  const tables: Record<string, Record<string, string>[]> = {};
  let cur: Record<string, string>[] | null = null, fields: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const cells = raw.split("\t");
    const head = cells[0].trim();
    if (head === "%T") { cur = tables[(cells[1] ?? "").trim()] = []; fields = []; }
    else if (head === "%F") fields = cells.slice(1).map((f) => f.trim());
    else if (head === "%R" && cur) cur.push(Object.fromEntries(fields.map((f, i) => [f, (cells[i + 1] ?? "").trim()])));
  }
  return tables;
}

/** Primavera P6 XER export: TASK (task_id, task_code, task_name, dates, task_type), TASKPRED, PROJWBS. */
export function parseXer(text: string): Activity[] {
  if (!/^\s*ERMHDR/.test(text) && !/%T\tTASK/.test(text)) throw new Error("Not a Primavera P6 XER file: no ERMHDR header or TASK table.");
  const t = xerTables(text);
  const tasks = t.TASK ?? [];
  if (!tasks.length) throw new Error("The XER file has no TASK table.");
  const wbs = new Map((t.PROJWBS ?? []).map((w) => [w.wbs_id, w]));
  const keyOf = new Map(tasks.map((x) => [x.task_id, x.task_code || x.task_id]));
  const preds = new Map<string, string[]>();
  for (const p of t.TASKPRED ?? []) {
    const k = keyOf.get(p.pred_task_id);
    if (k) (preds.get(p.task_id) ?? preds.set(p.task_id, []).get(p.task_id)!).push(k);
  }
  return tasks.map((x) => {
    const w = wbs.get(x.wbs_id);
    const type = x.task_type ?? "";
    return {
      id: x.task_id, code: x.task_code ?? "", name: x.task_name ?? "",
      start: toIsoDate(x.act_start_date || x.early_start_date || x.target_start_date || x.restart_date),
      finish: toIsoDate(x.act_end_date || x.early_end_date || x.target_end_date || x.reend_date),
      milestone: type === "TT_Mile" || type === "TT_FinMile",
      wbs: w?.wbs_short_name || w?.wbs_name || x.wbs_id || "",
      predecessors: preds.get(x.task_id) ?? [],
      summary: type === "TT_LOE" || type === "TT_WBS",
      group: w?.wbs_name ?? "",
    };
  });
}

// ---------------------------------------------------------------- CSV / spreadsheet

const COLS: Record<string, RegExp[]> = {
  id: [/^(activity|task)?\s*_?id$/, /^uid$/, /^unique\s*id$/, /^(activity|task)\s*code$/, /^code$/, /^ref(erence)?$/, /^no\.?$/, /^#$/],
  name: [/^(activity|task)?\s*_?name$/, /^description$/, /^(activity|task)$/, /^title$/, /name/],
  start: [/^(planned|baseline|target|early|forecast)?\s*_?start(\s*date)?$/, /start/],
  finish: [/^(planned|baseline|target|early|forecast)?\s*_?(finish|end)(\s*date)?$/, /finish|end\b|end date/],
  predecessors: [/^predecessors?$/, /pred/],
  wbs: [/^wbs$/, /^discipline$/, /wbs|discipline|outline number|group|package/],
  milestone: [/^milestone$/, /^(activity|task)\s*type$/, /^type$/],
  duration: [/^(original\s*|planned\s*)?duration$/, /duration/],
  summary: [/^summary$/],
};
const truthy = (v: string) => /^(1|y|yes|true|milestone|tt_mile|tt_finmile|start milestone|finish milestone)$/i.test(v.trim());

/** Rows from a CSV or worksheet, first row headers. Columns are found by name, case-insensitively. */
export function parseCsvProgramme(rows: unknown[][]): Activity[] {
  const headerAt = rows.findIndex((r) => r.filter((c) => String(c ?? "").trim()).length >= 2);
  if (headerAt < 0) throw new Error("The file has no header row.");
  const header = rows[headerAt].map((c) => String(c ?? "").trim().toLowerCase());
  const used = new Set<number>();
  const col = (k: keyof typeof COLS) => {
    for (const re of COLS[k]) { const i = header.findIndex((h, j) => !used.has(j) && re.test(h)); if (i >= 0) { used.add(i); return i; } }
    return -1;
  };
  // exact-ish columns first so "Activity ID" is not taken as the name and "Start" not as the finish
  const c = { id: col("id"), start: col("start"), finish: col("finish"), predecessors: col("predecessors"), milestone: col("milestone"), duration: col("duration"), summary: col("summary"), wbs: col("wbs"), name: col("name") };
  if (c.name < 0) throw new Error("No activity name column found (expected a column such as Name, Task Name or Activity Name).");
  if (c.start < 0 && c.finish < 0) throw new Error("No start or finish column found.");
  const cell = (r: unknown[], i: number) => (i < 0 ? "" : r[i] instanceof Date ? (r[i] as Date).toISOString().slice(0, 10) : String(r[i] ?? "").trim());
  const out: Activity[] = [];
  rows.slice(headerAt + 1).forEach((r, n) => {
    const name = cell(r, c.name);
    if (!name) return;
    const id = cell(r, c.id) || String(n + 1);
    const start = toIsoDate(c.start < 0 ? "" : r[c.start]), finish = toIsoDate(c.finish < 0 ? "" : r[c.finish]);
    const dur = cell(r, c.duration);
    out.push({
      id, code: c.id >= 0 ? cell(r, c.id) : "", name, start: start || finish, finish: finish || start,
      milestone: (c.milestone >= 0 && truthy(cell(r, c.milestone))) || (dur !== "" && /^0+(\.0+)?\s*(d|days?|h|hrs?|w|wks?|e?days?)?$/i.test(dur)) || (!start && !!finish),
      wbs: cell(r, c.wbs),
      predecessors: cell(r, c.predecessors).split(/[,;]+/).map((p) => p.replace(/\s*(FS|SS|FF|SF)\s*([+-].*)?$/i, "").trim()).filter(Boolean),
      summary: c.summary >= 0 ? truthy(cell(r, c.summary)) : false,
    });
  });
  return out;
}

/** Pick the parser from the file name (and content as a fallback). CSV / XLSX rows are parsed by the caller into rows first. */
export function parseProgrammeText(fileName: string, text: string, csvRows?: (t: string) => unknown[][]): Activity[] {
  const n = fileName.toLowerCase();
  if (n.endsWith(".xer") || /^\s*ERMHDR/.test(text)) return parseXer(text);
  if (n.endsWith(".xml") || /^\s*<\?xml|<Project[\s>]/.test(text)) return parseMsProjectXml(text);
  if (!csvRows) throw new Error("Unsupported programme format.");
  return parseCsvProgramme(csvRows(text));
}

// ---------------------------------------------------------------- diff and impact

export interface MovedActivity { key: string; name: string; before: Activity; after: Activity; startShift: number; finishShift: number }
export interface ProgrammeDiff { added: Activity[]; removed: Activity[]; moved: MovedActivity[]; unchanged: number; next: Activity[] }

/** Compare two versions of a programme: activities matched by key (code or id), then by unique name. */
export function diffProgrammes(oldActs: Activity[], newActs: Activity[]): ProgrammeDiff {
  const oldBy = new Map(oldActs.map((a) => [actKey(a), a]));
  const matched = new Map<Activity, Activity>(); // new -> old
  const unmatchedNew: Activity[] = [];
  for (const a of newActs) { const o = oldBy.get(actKey(a)); if (o) { matched.set(a, o); oldBy.delete(actKey(a)); } else unmatchedNew.push(a); }
  // renumbered activities: pair by name when the name is unique on both sides
  const countNames = (xs: Activity[]) => xs.reduce((m, a) => m.set(a.name.trim().toLowerCase(), (m.get(a.name.trim().toLowerCase()) ?? 0) + 1), new Map<string, number>());
  const leftOld = [...oldBy.values()];
  const on = countNames(leftOld), nn = countNames(unmatchedNew);
  const added: Activity[] = [];
  for (const a of unmatchedNew) {
    const k = a.name.trim().toLowerCase();
    const o = k && on.get(k) === 1 && nn.get(k) === 1 ? leftOld.find((x) => x.name.trim().toLowerCase() === k) : undefined;
    if (o) { matched.set(a, o); oldBy.delete(actKey(o)); } else added.push(a);
  }
  const moved: MovedActivity[] = [];
  let unchanged = 0;
  for (const [a, o] of matched) {
    const startShift = daysBetween(o.start, a.start), finishShift = daysBetween(o.finish, a.finish);
    if (startShift || finishShift || (!o.finish) !== (!a.finish)) moved.push({ key: actKey(o), name: a.name, before: o, after: a, startShift, finishShift });
    else unchanged++;
  }
  return { added, removed: [...oldBy.values()], moved, unchanged, next: newActs };
}

export type ImpactFlag = "moved" | "overdue" | "beforePredecessor" | "afterActivity" | "removed";
export interface ImpactRow { ref: string; title: string; activity: string; activityName: string; oldDue: string; newDue: string; shift: number; flags: ImpactFlag[] }
export interface LinkedPlanRow { ref: string; title: string; due: string; status?: string; activityId?: string }

/** The activity key a plan row is linked to: the activityId field, or a ref written as "P-<key>" / "P-<key>-<n>". */
export function rowActivity(r: Pick<LinkedPlanRow, "ref" | "activityId">, known?: Set<string>): string {
  if (r.activityId) return r.activityId;
  const m = /^P-(.+)$/.exec(r.ref ?? "");
  if (!m) return "";
  if (known?.has(m[1])) return m[1];
  const base = m[1].replace(/-\d+$/, "");
  return !known || known.has(base) ? base : m[1];
}

/**
 * Plan rows whose linked activity moved or disappeared: the due date shifts with the activity finish (and never
 * past it), and the row is flagged when it is now overdue or due before one of the activity's predecessors finishes.
 */
export function impact(planRows: LinkedPlanRow[], diff: ProgrammeDiff, today = new Date().toISOString().slice(0, 10)): ImpactRow[] {
  const next = new Map(diff.next.map((a) => [actKey(a), a]));
  const movedBy = new Map(diff.moved.map((m) => [m.key, m]));
  const removed = new Map(diff.removed.map((a) => [actKey(a), a]));
  const known = new Set([...next.keys(), ...removed.keys(), ...movedBy.keys()]);
  const out: ImpactRow[] = [];
  for (const r of planRows) {
    const key = rowActivity(r, known);
    if (!key) continue;
    const gone = removed.get(key);
    if (gone) { out.push({ ref: r.ref, title: r.title, activity: key, activityName: gone.name, oldDue: r.due, newDue: r.due, shift: 0, flags: ["removed"] }); continue; }
    const mv = movedBy.get(key);
    if (!mv) continue;
    const act = mv.after;
    const shift = mv.finishShift;
    let newDue = r.due ? addDays(r.due, shift) : act.finish;
    const flags: ImpactFlag[] = ["moved"];
    if (act.finish && newDue > act.finish) { newDue = act.finish; flags.push("afterActivity"); }
    if (r.status !== "Published" && newDue && newDue < today) flags.push("overdue");
    const predFinish = act.predecessors.map((p) => next.get(p)?.finish ?? "").filter(Boolean).sort().pop();
    if (predFinish && newDue && newDue < predFinish) flags.push("beforePredecessor");
    out.push({ ref: r.ref, title: r.title, activity: key, activityName: act.name, oldDue: r.due, newDue, shift: daysBetween(r.due, newDue), flags });
  }
  return out;
}
