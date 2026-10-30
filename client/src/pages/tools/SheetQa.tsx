import { Fragment, useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { useSession } from "../../App";
import { t } from "../../i18n";
import { ApiError, api } from "../../lib/api";
import { exportCsv } from "../../lib/export";
import { activePlan } from "../../lib/planStore";
import { useProjectData } from "../../lib/projectStore";
import { formatMsg } from "../../../../shared/namingCheck";
import { containerName } from "../../../../shared/planRows";
import {
  CHECKS, TITLE_FIELDS, checkDetail, checkRows, checkSheet, emptyTitleBlock, issuesText, overall, summarise, toRows, transmittalList,
  type CheckStatus, type Confidence, type ExtractedSheet, type PlanEntry, type SheetResult, type TitleBlock,
} from "../../../../shared/sheetQa";
import "./sheetqa.css";

// Drawing & sheet QA: drop PDF drawings, the AI reads each sheet's title block, then the checks (ISO 19650 naming,
// revision and status rules, revision table, file name, date, scale, sign-off, delivery plan) run here in the browser.
// Extracted fields can be corrected and the checks re-run instantly. Nothing is stored.

const BATCH = 10;
const MAX_MB = 25;
const tf = (s: string, v: Record<string, string | number>) => formatMsg({ t: s, v }, t);

interface Sheet { key: string; file: string; page: number; sheetsInFile: number; block: TitleBlock; original: TitleBlock; confidence: Confidence; notes: string; manual?: boolean }
interface FileError { name: string; error: string }
interface Answer { files: { name: string; sheets: ExtractedSheet[]; error?: string }[] }
type Filter = "all" | CheckStatus;

const STATUS_LABEL: Record<CheckStatus, string> = { pass: "Pass", warn: "Warning", fail: "Fail" };
const CONF_LABEL: Record<Confidence, string> = { high: "High", medium: "Medium", low: "Low" };

function useAiEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  return enabled;
}

const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
let seq = 0;
const nextKey = () => `s${++seq}`;

async function exportXlsx(results: SheetResult[], name: string) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Drawing & sheet QA";
  const head = (ws: import("exceljs").Worksheet, cols: number) => {
    const r = ws.getRow(1);
    r.font = { bold: true, color: { argb: "FFFFFFFF" } };
    for (let c = 1; c <= cols; c++) r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };
  const fill: Record<string, string> = { pass: "FFDCFCE7", warn: "FFFEF3C7", fail: "FFFEE2E2" };
  const main = toRows(results);
  const ws = wb.addWorksheet("Sheets");
  ws.columns = main.header.map((h, i) => ({ header: h, width: i === 0 ? 34 : /Drawing number|Title|Failures|Warnings|Revision table|notes/i.test(h) ? 36 : 14 }));
  main.rows.forEach((r) => {
    const row = ws.addRow(r);
    r.forEach((v, i) => { if (fill[v]) row.getCell(i + 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill[v] } }; });
  });
  head(ws, main.header.length);
  const det = checkRows(results);
  const cs = wb.addWorksheet("Checks");
  cs.columns = det.header.map((h, i) => ({ header: h, width: [34, 8, 34, 34, 10, 80][i] }));
  det.rows.forEach((r) => { const row = cs.addRow(r); if (fill[r[4]]) row.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill[r[4]] } }; });
  head(cs, det.header.length);
  const s = summarise(results);
  const ss = wb.addWorksheet("Summary");
  ss.columns = [{ header: "Check", width: 40 }, { header: "Pass", width: 10 }, { header: "Warning", width: 10 }, { header: "Fail", width: 10 }];
  ss.addRow(["All sheets", s.pass, s.warn, s.fail]);
  ss.addRow(["Average score", s.averageScore, "", ""]);
  for (const c of CHECKS) { const b = s.byCheck[c.id]; if (b) ss.addRow([c.label, b.pass, b.warn, b.fail]); }
  head(ss, 4);
  saveAs(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${name}.xlsx`);
}

export default function SheetQa() {
  const { toast } = useSession();
  const ai = useAiEnabled();
  const [p] = useProjectData();
  const plan = useMemo(() => activePlan(), []);

  const [code, setCode] = useState(() => p.code || plan?.header.projectCode || "");
  const [orgs, setOrgs] = useState(() => plan?.header.originator || "");
  const [sep, setSep] = useState(() => p.separator || "-");
  const [usePlan, setUsePlan] = useState(!!plan);

  const [queue, setQueue] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ batch: number; batches: number; done: number; total: number } | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [fileErrors, setFileErrors] = useState<FileError[]>([]);

  const [filter, setFilter] = useState<Filter>("all");
  const [checkFilter, setCheckFilter] = useState("");
  const [conf, setConf] = useState<"" | Confidence>("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [showTrn, setShowTrn] = useState(false);

  const planEntries: PlanEntry[] | undefined = useMemo(() => (usePlan && plan
    ? plan.rows.map((r) => ({ name: containerName(plan.header, r), due: r.due, title: r.title, suitability: r.suitability })) : undefined), [usePlan, plan]);
  const rules = useMemo(() => ({ separator: sep, projectCode: code.trim() || undefined, originators: orgs.split(/[,;\s]+/).filter(Boolean) }), [sep, code, orgs]);

  const results = useMemo(() => sheets.map((s): SheetResult & { key: string; manual?: boolean } => ({
    key: s.key, manual: s.manual, file: s.file, page: s.page, titleBlock: s.block, confidence: s.confidence, notes: s.notes,
    ...checkSheet(s.block, { fileName: s.file, rules, planContainers: planEntries, sheetsInFile: s.sheetsInFile }),
  })), [sheets, rules, planEntries]);
  const summary = useMemo(() => summarise(results), [results]);
  const shown = results.filter((r) => {
    if (filter !== "all" && overall(r.checks) !== filter) return false;
    if (checkFilter && r.checks.find((c) => c.id === checkFilter)?.status === "pass") return false;
    if (checkFilter && !r.checks.some((c) => c.id === checkFilter)) return false;
    if (conf && r.confidence !== conf) return false;
    const q = search.trim().toLowerCase();
    return !q || [r.file, r.titleBlock.drawingNumber, r.titleBlock.title].some((x) => x.toLowerCase().includes(q));
  });
  const checksInUse = CHECKS.filter((c) => summary.byCheck[c.id]);

  const addFiles = (list: FileList | File[]) => {
    const all = [...list];
    const pdfs = all.filter(isPdf);
    const big = pdfs.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (all.length > pdfs.length) toast(t("Only PDF files are read; other files were skipped."), "error");
    if (big.length) toast(tf("{n} PDFs are larger than 25 MB and were skipped.", { n: big.length }), "error");
    const ok = pdfs.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    setQueue((q) => [...q, ...ok.filter((f) => !q.some((x) => x.name === f.name && x.size === f.size))]);
  };

  const run = async () => {
    if (!queue.length || busy) return;
    setBusy(true);
    const batches: File[][] = [];
    for (let i = 0; i < queue.length; i += BATCH) batches.push(queue.slice(i, i + BATCH));
    let done = 0;
    const left: File[] = [];
    try {
      for (let b = 0; b < batches.length; b++) {
        setProgress({ batch: b + 1, batches: batches.length, done, total: queue.length });
        const form = new FormData();
        batches[b].forEach((f) => form.append("files", f, f.name));
        try {
          const ans = await api<Answer>("/ai/tools/sheet-qa", { form });
          const add: Sheet[] = []; const errs: FileError[] = [];
          for (const f of ans.files) {
            if (f.error) errs.push({ name: f.name, error: f.error });
            for (const s of f.sheets) add.push({ key: nextKey(), file: f.name, page: s.page, sheetsInFile: f.sheets.length, block: s.titleBlock, original: s.titleBlock, confidence: s.confidence, notes: s.notes });
          }
          setSheets((x) => [...x, ...add]);
          setFileErrors((x) => [...x.filter((e) => !ans.files.some((f) => f.name === e.name)), ...errs]);
        } catch (e) {
          const msg = e instanceof Error ? e.message : t("The request failed.");
          // the AI service is busy or off: stop and keep the rest in the queue
          if (e instanceof ApiError && (e.status === 429 || e.status === 503)) { left.push(...batches.slice(b).flat()); toast(msg, "error"); break; }
          setFileErrors((x) => [...x, ...batches[b].map((f) => ({ name: f.name, error: msg }))]);
        }
        done += batches[b].length;
        setProgress({ batch: b + 1, batches: batches.length, done, total: queue.length });
      }
    } finally {
      setQueue(left);
      setBusy(false);
      setProgress(null);
    }
  };

  const addManual = () => {
    const key = nextKey();
    setSheets((x) => [...x, { key, file: "manual.pdf", page: 1, sheetsInFile: 1, block: emptyTitleBlock(), original: emptyTitleBlock(), confidence: "high", notes: "", manual: true }]);
    setOpen((o) => new Set(o).add(key));
  };
  const edit = (key: string, patch: Partial<TitleBlock>) => setSheets((x) => x.map((s) => (s.key === key ? { ...s, block: { ...s.block, ...patch } } : s)));
  const editSheet = (key: string, patch: Partial<Sheet>) => setSheets((x) => x.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const toggle = (key: string) => setOpen((o) => { const n = new Set(o); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast(t("Copied to the clipboard.")); } catch { toast(t("Could not copy. Select the text and copy it manually."), "error"); }
  };
  const base = `${code.trim() || "PRJ"}-sheet-qa`;
  const csv = () => { const r = toRows(results); exportCsv(base, r.header, r.rows); };
  const xlsx = () => exportXlsx(results, base).catch(() => toast(t("The Excel file could not be created."), "error"));

  const chip = (s: CheckStatus, label: string, title?: string, key?: string) =>
    <span key={key} className={`sqa-chip sqa-${s}`} title={title}>{s === "pass" ? "✓" : s === "warn" ? "!" : "✗"} {label}</span>;

  return (
    <div className="sqa">
      <p className="small muted sqa-lead">
        {t("Drop PDF drawings (single sheets or multi-page sets). The AI reads each sheet's title block, then the portal checks the drawing number against your naming convention, the revision and status codes, the revision table, the file name, date, scale, sign-off and, optionally, your delivery plan.")}
      </p>
      <p className="small sqa-note">{t("PDFs are sent to the AI service only to read the title blocks; nothing is stored. Checks run in your browser.")}</p>

      {ai === false && <div className="card sqa-off">
        <b>AI is not available</b>
        <p className="small muted">The AI service is not configured on this server, so PDFs cannot be read. You can still enter a title block by hand to run the checks.</p>
      </div>}

      <div className="card">
        <div className="grid g4">
          <label className="sqa-field"><span>Project code</span><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. HOS01" /></label>
          <label className="sqa-field"><span>Originator codes (optional)</span><input value={orgs} onChange={(e) => setOrgs(e.target.value.toUpperCase())} placeholder="e.g. ABC, XYZ" /></label>
          <label className="sqa-field"><span>Field separator</span><select value={sep} onChange={(e) => setSep(e.target.value)}><option value="-">- (hyphen)</option><option value="_">_ (underscore)</option></select></label>
          <div className="sqa-field"><span>Delivery plan</span>
            {plan ? <label className="row small sqa-check"><input type="checkbox" checked={usePlan} onChange={(e) => setUsePlan(e.target.checked)} />{tf("Match against my {kind} ({n} containers)", { kind: plan.kind.toUpperCase(), n: plan.rows.length })}</label>
              : <span className="small muted">No TIDP or MIDP saved yet. <a href="#/ai-tools/plans">Create one</a> to check sheets against it.</span>}
          </div>
        </div>
        <div className="small muted sqa-hint">Rules are prefilled from Project data. Naming: Project-Originator-Volume-Level-Type-Role-Number (ISO 19650-2 UK National Annex).</div>
      </div>

      <div className="grid g2 sqa-top">
        <label className={"sqa-drop" + (over ? " over" : "") + (ai === false || busy ? " disabled" : "")}
          onDragOver={(e) => { e.preventDefault(); if (ai !== false) setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); if (ai !== false && !busy) addFiles(e.dataTransfer.files); }}>
          <b>Drop PDF drawings here, or click to choose</b>
          <span className="small muted">{tf("Up to {mb} MB per PDF; sent {n} at a time.", { mb: MAX_MB, n: BATCH })}</span>
          <input type="file" accept="application/pdf,.pdf" multiple disabled={ai === false || busy} onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
        </label>
        <div className="card sqa-queue">
          <div className="row spread"><b>{tf("{n} PDFs ready", { n: queue.length })}</b>
            {queue.length > 0 && !busy && <button className="ghost small" onClick={() => setQueue([])}>Clear</button>}</div>
          {queue.length > 0 && <ul className="sqa-files no-i18n">{queue.slice(0, 8).map((f) => <li key={f.name + f.size}>{f.name} <span className="muted">({(f.size / 1048576).toFixed(1)} MB)</span></li>)}
            {queue.length > 8 && <li className="muted">{tf("…and {n} more", { n: queue.length - 8 })}</li>}</ul>}
          {progress && <div className="sqa-progress" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
            <div className="bar"><div style={{ inlineSize: `${Math.round((100 * progress.done) / Math.max(1, progress.total))}%` }} /></div>
            <span className="small">{tf("Reading batch {b} of {n} ({done} of {total} PDFs done)…", { b: progress.batch, n: progress.batches, done: progress.done, total: progress.total })}</span>
          </div>}
          <div className="row sqa-actions">
            <button onClick={run} disabled={!queue.length || busy || ai !== true}>{busy ? t("Reading title blocks…") : t("Read title blocks")}</button>
            <button className="ghost" onClick={addManual} disabled={busy}>Enter a title block by hand</button>
          </div>
        </div>
      </div>

      {fileErrors.length > 0 && <div className="card sqa-errors">
        <div className="row spread"><b>{tf("{n} files could not be read", { n: fileErrors.length })}</b><button className="ghost small" onClick={() => setFileErrors([])}>Dismiss</button></div>
        <ul>{fileErrors.map((e, i) => <li key={i}><span className="mono no-i18n">{e.name}</span>: {t(e.error)}</li>)}</ul>
      </div>}

      {results.length > 0 && <>
        <div className="grid g4">
          {([["all", summary.sheets, "sheets checked"], ["pass", summary.pass, "all checks pass"], ["warn", summary.warn, "with warnings"], ["fail", summary.fail, "with failures"]] as const).map(([f, n, l]) => (
            <button key={f} className={`sqa-stat sqa-${f}` + (filter === f ? " on" : "")} onClick={() => setFilter(f)}><div className="v">{n}</div><div className="small">{t(l)}</div></button>))}
        </div>

        <div className="row sqa-toolbar">
          <input className="sqa-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search file, number or title")} />
          <select value={checkFilter} onChange={(e) => setCheckFilter(e.target.value)} aria-label={t("Filter by check")}>
            <option value="">All checks</option>
            {checksInUse.map((c) => { const b = summary.byCheck[c.id]; return <option key={c.id} value={c.id}>{`${t(c.label)} (${b.fail + b.warn})`}</option>; })}
          </select>
          <select value={conf} onChange={(e) => setConf(e.target.value as "" | Confidence)} aria-label={t("AI confidence")}>
            <option value="">Any confidence</option><option value="high">High confidence</option><option value="medium">Medium confidence</option><option value="low">Low confidence</option>
          </select>
          <span className="small muted">{tf("Average score {n}%", { n: summary.averageScore })}</span>
          <span className="sqa-spacer" />
          <button className="ghost" onClick={xlsx}>Export Excel</button>
          <button className="ghost" onClick={csv}>Export CSV</button>
          <button className={"ghost" + (showTrn ? " on" : "")} onClick={() => setShowTrn((v) => !v)}>Issues as a transmittal</button>
          <button className="ghost" onClick={() => { setSheets([]); setOpen(new Set()); setFileErrors([]); }}>Clear results</button>
        </div>

        {showTrn && <div className="card sqa-trn">
          <p className="small muted">Paste the list into the transmittal builder in <a href="#/bim-tools/comms">Transmittals & correspondence</a> (name, status, revision and title, tab separated). Use the issues text in a rejection notice or a cover note.</p>
          <div className="grid g2">
            <div className="sqa-field"><span className="row spread">Transmittal list (sheets with issues)<button className="ghost small" onClick={() => copy(transmittalList(results))}>Copy</button></span>
              <textarea readOnly rows={8} value={transmittalList(results)} className="mono" /></div>
            <div className="sqa-field"><span className="row spread">Issues<button className="ghost small" onClick={() => copy(issuesText(results))}>Copy</button></span>
              <textarea readOnly rows={8} value={issuesText(results)} className="mono" /></div>
          </div>
        </div>}

        <div className="card table-wrap sqa-table">
          <table className="data">
            <thead><tr><th aria-label={t("Expand")} /><th>File / page</th><th>Drawing number</th><th>Title</th><th>Rev</th><th>Status</th><th>Scale</th><th>Date</th><th>Score</th><th>Checks</th></tr></thead>
            <tbody>{shown.map((r) => {
              const isOpen = open.has(r.key); const o = overall(r.checks); const s = sheets.find((x) => x.key === r.key)!;
              const edited = JSON.stringify(s.block) !== JSON.stringify(s.original);
              return (
                <Fragment key={r.key}>
                  <tr className={isOpen ? "on" : ""}>
                    <td><button className="tiny ghost" aria-expanded={isOpen} aria-label={isOpen ? t("Collapse") : t("Expand")} onClick={() => toggle(r.key)}>{isOpen ? "▾" : "▸"}</button></td>
                    <td className="small"><span className="mono no-i18n sqa-name">{r.file}</span><div className="tiny muted">{tf("Page {n}", { n: r.page })}{edited && <> · {t("edited")}</>}{r.confidence !== "high" && <> · <span className={`sqa-conf-${r.confidence}`}>{t(`${CONF_LABEL[r.confidence]} confidence`)}</span></>}</div></td>
                    <td className="mono small no-i18n sqa-name">{r.titleBlock.drawingNumber || "—"}</td>
                    <td className="small no-i18n">{r.titleBlock.title || "—"}</td>
                    <td className="mono small no-i18n">{r.titleBlock.revision || "—"}</td>
                    <td className="mono small no-i18n">{r.titleBlock.status || "—"}</td>
                    <td className="small no-i18n">{r.titleBlock.scale || "—"}</td>
                    <td className="small no-i18n nowrap">{r.titleBlock.date || "—"}</td>
                    <td><b className={`sqa-score sqa-${o}`}>{r.score}%</b></td>
                    <td><div className="sqa-chips">{r.checks.filter((c) => c.status !== "pass").map((c) => chip(c.status, t(CHECKS.find((x) => x.id === c.id)?.short ?? c.id), `${t(c.label)}: ${checkDetail(c, t)}`, c.id))}
                      {o === "pass" && chip("pass", t("All checks pass"))}</div></td>
                  </tr>
                  {isOpen && <tr className="sqa-detail"><td /><td colSpan={9}>
                    <div className="grid g2">
                      <div>
                        <div className="row spread"><b>Extracted title block</b>
                          <span className="row sqa-actions">{!s.manual && edited && <button className="ghost small" onClick={() => editSheet(r.key, { block: s.original })}>Reset to AI values</button>}
                            <button className="ghost small" onClick={() => { setSheets((x) => x.filter((y) => y.key !== r.key)); }}>Remove</button></span></div>
                        {s.manual && <label className="sqa-field"><span>File name</span><input value={s.file} onChange={(e) => editSheet(r.key, { file: e.target.value })} /></label>}
                        <div className="sqa-fields">{TITLE_FIELDS.map((f) => (
                          <label key={f.key} className="sqa-field"><span>{t(f.label)}</span>
                            <input value={s.block[f.key]} onChange={(e) => edit(r.key, { [f.key]: e.target.value } as Partial<TitleBlock>)} className={s.block[f.key] !== s.original[f.key] ? "edited" : ""} /></label>))}</div>
                        <div className="sqa-revs">
                          <div className="row spread"><b className="small">Revision table (oldest first)</b>
                            <button className="ghost small" onClick={() => edit(r.key, { revisions: [...s.block.revisions, { rev: "", date: "", description: "", by: "" }] })}>Add row</button></div>
                          {s.block.revisions.length ? <table className="data"><thead><tr><th>Rev</th><th>Date</th><th>Description</th><th>By</th><th /></tr></thead>
                            <tbody>{s.block.revisions.map((x, i) => (
                              <tr key={i}>{(["rev", "date", "description", "by"] as const).map((k) => <td key={k}><input value={x[k]} onChange={(e) => edit(r.key, { revisions: s.block.revisions.map((y, j) => (j === i ? { ...y, [k]: k === "rev" ? e.target.value.toUpperCase() : e.target.value } : y)) })} /></td>)}
                                <td><button className="ghost tiny" aria-label={t("Remove")} onClick={() => edit(r.key, { revisions: s.block.revisions.filter((_, j) => j !== i) })}>✕</button></td></tr>))}</tbody></table>
                            : <p className="small muted">No revision table read.</p>}
                        </div>
                      </div>
                      <div>
                        <b>Checks</b>
                        <ul className="sqa-checklist">{r.checks.map((c) => (
                          <li key={c.id} className={`sqa-${c.status}`}>{chip(c.status, t(STATUS_LABEL[c.status]))} <b>{t(c.label)}</b><div className="small no-i18n">{checkDetail(c, t)}</div></li>))}</ul>
                        {!s.manual && <p className="small"><b>{t("AI confidence")}:</b> <span className={`sqa-conf-${r.confidence}`}>{t(CONF_LABEL[r.confidence])}</span>{r.notes && <> · <span className="muted no-i18n">{r.notes}</span></>}</p>}
                        <p className="tiny muted">Edit any field to re-run the checks. Always confirm against the drawing: the AI can misread small or scanned text.</p>
                      </div>
                    </div>
                  </td></tr>}
                </Fragment>
              );
            })}</tbody>
          </table>
          {!shown.length && <p className="muted small">Nothing in this filter.</p>}
        </div>
      </>}
    </div>
  );
}
