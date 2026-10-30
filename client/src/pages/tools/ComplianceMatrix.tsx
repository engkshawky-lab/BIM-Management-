import { Fragment, useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { api } from "../../lib/api";
import { csvText } from "../../lib/export";
import { saveMarkdownDocx } from "../../lib/mdDocx";
import { t } from "../../i18n";
import {
  MATRIX_CATEGORIES, MATRIX_PRIORITIES, MATRIX_STATUSES, ROW_HEADER, isGap, scoreMatrix, toAddendumMarkdown, toRows,
  type MatrixCategory, type MatrixConflict, type MatrixPriority, type MatrixRow, type MatrixStatus,
} from "../../../../shared/complianceMatrix";
import "./compliance.css";

// EIR ↔ BEP compliance matrix: requirement-by-requirement traceability with gaps, ready-to-paste BEP wording and exports.
// Decision support for the accountable person of the lead appointed party, never an approval.

interface MatrixResult {
  projectName: string; strictness: Strictness; summary: string; score: number; verdict: string;
  requirements: MatrixRow[]; conflicts: MatrixConflict[]; truncated?: boolean;
}
type Strictness = "lenient" | "normal" | "strict";
type SortKey = "id" | "status" | "priority" | "category";

const KEY = "bim:compliance-matrix:last";
const STATUS_LABEL: Record<MatrixStatus, string> = { met: "Met", partial: "Partial", missing: "Missing", conflict: "Conflict" };
const PRIORITY_LABEL: Record<MatrixPriority, string> = { high: "High", medium: "Medium", low: "Low" };
const STRICT_LABEL: Record<Strictness, string> = { lenient: "Lenient", normal: "Normal", strict: "Strict" };
const XL_FILL: Record<MatrixStatus, string> = { met: "FFDCFCE7", partial: "FFFEF3C7", missing: "FFFEE2E2", conflict: "FFEDE9FE" };
const XL_PRIORITY: Record<MatrixPriority, string> = { high: "FFB91C1C", medium: "FFB45309", low: "FF475569" };
const ORDER = { status: { conflict: 0, missing: 1, partial: 2, met: 3 }, priority: { high: 0, medium: 1, low: 2 } };

const slug = (s: string) => s.trim().replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "project";
const verdictLabel = (score: number) => (score >= 85 ? "Compliant" : score >= 70 ? "Minor gaps" : score >= 45 ? "Significant gaps" : "Not compliant");

function loadLast(): { result: MatrixResult; accepted: string[] } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as { result: MatrixResult; accepted: string[] };
    if (d?.result && Array.isArray(d.result.requirements) && Array.isArray(d.accepted)) return d;
  } catch { /* unreadable: start fresh */ }
  return null;
}

function DocInput({ label, file, setFile, text, setText }: { label: string; file: File | null; setFile: (f: File | null) => void; text: string; setText: (s: string) => void }) {
  return (
    <div className="hub-card cm-input">
      <b>{label}</b>
      <input type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label={label} />
      {file ? <div className="small muted">{file.name} · {(file.size / 1024).toFixed(0)} KB <button className="ghost small" onClick={() => setFile(null)}>{t("Remove")}</button></div>
        : <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("…or paste the document text here")} />}
    </div>
  );
}

function Gauge({ score }: { score: number }) {
  const r = 52, c = 2 * Math.PI * r, tone = score >= 85 ? "met" : score >= 70 ? "partial" : score >= 45 ? "missing" : "conflict";
  return (
    <svg className={"cm-gauge cm-" + tone} viewBox="0 0 128 128" role="img" aria-label={`${t("Compliance score")} ${score}/100`}>
      <circle cx="64" cy="64" r={r} className="cm-gauge-track" />
      <circle cx="64" cy="64" r={r} className="cm-gauge-bar" strokeDasharray={`${(c * score) / 100} ${c}`} transform="rotate(-90 64 64)" />
      <text x="64" y="62" textAnchor="middle" className="cm-gauge-num">{score}</text>
      <text x="64" y="82" textAnchor="middle" className="cm-gauge-sub">/ 100</text>
    </svg>
  );
}

const Chip = ({ s }: { s: MatrixStatus }) => <span className={"cm-chip cm-" + s}>{t(STATUS_LABEL[s])}</span>;

async function exportXlsx(res: MatrixResult, rows: MatrixRow[], accepted: Set<string>) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "EIR-BEP compliance matrix";
  const s = scoreMatrix(rows);
  const head = (ws: import("exceljs").Worksheet, cols: number) => {
    const h = ws.getRow(1);
    h.font = { bold: true, color: { argb: "FFFFFFFF" } };
    h.alignment = { vertical: "middle", wrapText: true };
    for (let c = 1; c <= cols; c++) h.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };

  const sum = wb.addWorksheet("Summary");
  sum.columns = [{ header: "Item", width: 30 }, { header: "Value", width: 90 }];
  const add = (k: string, v: string | number) => sum.addRow([k, v]);
  add("Project", res.projectName || "—"); add("Strictness", res.strictness);
  add("Compliance score", `${s.score}/100`); add("Verdict", verdictLabel(s.score));
  for (const st of MATRIX_STATUSES) add(`Requirements ${st}`, s.byStatus[st]);
  add("Summary", res.summary);
  add("Note", "AI-assisted analysis. It must be reviewed and accepted by the accountable person before use; it does not approve or certify either document.");
  head(sum, 2);
  sum.getColumn(2).alignment = { wrapText: true, vertical: "top" };
  sum.addRow([]);
  const ch = sum.addRow(["Category", "Score / met / partial / missing / conflict"]); ch.font = { bold: true };
  for (const c of s.byCategory) sum.addRow([c.category, `${c.score}% — ${c.met} / ${c.partial} / ${c.missing} / ${c.conflict} (${c.total})`]);

  const ws = wb.addWorksheet("Matrix");
  const widths = [10, 14, 50, 22, 11, 10, 14, 45, 45, 70, 10];
  ws.columns = [...ROW_HEADER, "Accepted"].map((h, i) => ({ header: h, width: widths[i] ?? 16 }));
  toRows(rows).slice(1).forEach((r, i) => {
    const row = ws.addRow([...r, accepted.has(rows[i].id) ? "Yes" : ""]);
    row.alignment = { wrapText: true, vertical: "top" };
    const st = rows[i].status;
    row.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: XL_FILL[st] } };
    row.getCell(5).font = { bold: true };
    row.getCell(6).font = { bold: true, color: { argb: XL_PRIORITY[rows[i].priority] } };
  });
  head(ws, ROW_HEADER.length + 1);
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ROW_HEADER.length + 1 } };

  if (res.conflicts.length) {
    const cs = wb.addWorksheet("Conflicts");
    cs.columns = [{ header: "EIR reference", width: 18 }, { header: "BEP reference", width: 18 }, { header: "Conflict", width: 60 }, { header: "Resolution", width: 60 }];
    res.conflicts.forEach((c) => { const row = cs.addRow([c.eirRef, c.bepRef, c.description, c.resolution]); row.alignment = { wrapText: true, vertical: "top" }; });
    head(cs, 4);
  }
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `EIR-BEP-compliance-matrix_${slug(res.projectName)}.xlsx`);
}

export default function ComplianceMatrix() {
  const last = useMemo(loadLast, []);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [eirFile, setEirFile] = useState<File | null>(null); const [eirText, setEirText] = useState("");
  const [bepFile, setBepFile] = useState<File | null>(null); const [bepText, setBepText] = useState("");
  const [projectName, setProjectName] = useState(last?.result.projectName ?? "");
  const [strictness, setStrictness] = useState<Strictness>(last?.result.strictness ?? "normal");
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatrixResult | null>(last?.result ?? null);
  const [accepted, setAccepted] = useState<Set<string>>(() => new Set(last?.accepted ?? []));
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [fStatus, setFStatus] = useState<MatrixStatus | "">("");
  const [fCat, setFCat] = useState<MatrixCategory | "">("");
  const [fPri, setFPri] = useState<MatrixPriority | "">("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "id", dir: 1 });
  const [copied, setCopied] = useState("");

  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  useEffect(() => {
    if (!busy) return;
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [busy]);
  useEffect(() => {
    try { if (result) localStorage.setItem(KEY, JSON.stringify({ result, accepted: [...accepted] })); } catch { /* storage full or blocked */ }
  }, [result, accepted]);

  const rows = result?.requirements ?? [];
  const stats = useMemo(() => scoreMatrix(rows), [rows]);
  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter((r) => (!fStatus || r.status === fStatus) && (!fCat || r.category === fCat) && (!fPri || r.priority === fPri)
      && (!needle || [r.id, r.eirSection, r.requirement, r.bepSection, r.evidence, r.gap, r.suggestedText].some((x) => x.toLowerCase().includes(needle))));
    const idx = new Map(rows.map((r, i) => [r.id, i]));
    const val = (r: MatrixRow): number | string => sort.key === "status" ? ORDER.status[r.status] : sort.key === "priority" ? ORDER.priority[r.priority]
      : sort.key === "category" ? MATRIX_CATEGORIES.indexOf(r.category) : idx.get(r.id) ?? 0;
    return [...list].sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : (idx.get(a.id) ?? 0) - (idx.get(b.id) ?? 0)) * sort.dir; });
  }, [rows, q, fStatus, fCat, fPri, sort]);

  const ready = (eirFile || eirText.trim()) && (bepFile || bepText.trim());
  const run = async () => {
    setBusy(true); setError("");
    try {
      const form = new FormData();
      if (eirFile) form.set("eir", eirFile); else form.set("eirText", eirText);
      if (bepFile) form.set("bep", bepFile); else form.set("bepText", bepText);
      form.set("projectName", projectName); form.set("strictness", strictness);
      const r = await api<MatrixResult>("/ai/tools/compliance-matrix", { form });
      setResult(r); setAccepted(new Set()); setOpen(new Set()); setFStatus(""); setFCat(""); setFPri(""); setQ("");
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const toggle = (set: Set<string>, id: string) => { const n = new Set(set); if (n.has(id)) n.delete(id); else n.add(id); return n; };
  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied((c) => (c === id ? "" : c)), 1500); } catch { setError(t("Copy failed. Select the text and copy it manually.")); }
  };
  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));
  const arrow = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? " ▲" : " ▼") : "");
  const gapRows = rows.filter(isGap);
  const acceptedGaps = gapRows.filter((r) => accepted.has(r.id));
  const addendum = () => {
    if (!result) return;
    const use = acceptedGaps.length ? acceptedGaps : gapRows;
    void saveMarkdownDocx(toAddendumMarkdown(use, { projectName: result.projectName, date: new Date().toISOString().slice(0, 10) }), `BEP-addendum_${slug(result.projectName)}`,
      { title: "BEP addendum — response to EIR gaps", project: result.projectName || undefined, status: "Draft for review", date: new Date().toISOString().slice(0, 10) });
  };
  const csv = () => {
    if (!result) return;
    const [h, ...body] = toRows(rows);
    saveAs(new Blob([csvText(h, body)], { type: "text/csv;charset=utf-8" }), `EIR-BEP-compliance-matrix_${slug(result.projectName)}.csv`);
  };
  const stages = [t("Reading the EIR and listing its requirements"), t("Tracing each requirement to the BEP"), t("Writing gaps and suggested BEP text")];
  const at = busy ? Math.min(2, Math.floor(seconds / 30)) : -1;

  return (
    <div className="cm">
      {enabled === false && <div className="hub-card cm-note">{t("AI is not configured on this server, so the compliance matrix is unavailable. Ask an administrator to set the Claude API key.")}</div>}
      <div className="grid g2">
        <DocInput label={t("EIR (Exchange Information Requirements)")} file={eirFile} setFile={setEirFile} text={eirText} setText={setEirText} />
        <DocInput label={t("BEP (BIM Execution Plan)")} file={bepFile} setFile={setBepFile} text={bepText} setText={setBepText} />
      </div>
      <div className="cm-opts">
        <label className="cm-field"><span className="small muted">{t("Project name")}</span><input value={projectName} onChange={(e) => setProjectName(e.target.value)} maxLength={160} /></label>
        <label className="cm-field"><span className="small muted">{t("Strictness")}</span>
          <select value={strictness} onChange={(e) => setStrictness(e.target.value as Strictness)}>{(["lenient", "normal", "strict"] as const).map((s) => <option key={s} value={s}>{t(STRICT_LABEL[s])}</option>)}</select></label>
        <button className="primary" disabled={busy || !ready || enabled !== true} onClick={run}>{busy ? `${t("Building matrix…")} ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : t("Build compliance matrix")}</button>
      </div>
      <p className="small muted">{t("PDF, DOCX or TXT up to 25 MB each. AI output is decision support: it must be reviewed by the accountable person before it is relied on or issued.")}</p>
      {error && <div className="hub-card cm-error" role="alert">{error}</div>}
      {busy && <div className="hub-card gen-steps">{stages.map((s, i) => <div key={s} className={"gen-step " + (i < at ? "done" : i === at ? "busy" : "")}><span className="gen-dot">{i < at ? "✓" : i + 1}</span><span className="small">{s}</span></div>)}
        <div className="small muted">{t("A full matrix usually takes 1–3 minutes.")}</div></div>}

      {result && !busy && <>
        <div className="cm-summary">
          <div className="hub-card cm-scorecard">
            <Gauge score={stats.score} />
            <div>
              <div className="cm-verdict">{t(verdictLabel(stats.score))}</div>
              <div className="small muted">{rows.length} {t("EIR requirements")}{result.projectName ? ` · ${result.projectName}` : ""} · {t(STRICT_LABEL[result.strictness])}</div>
              <div className="cm-counts">{MATRIX_STATUSES.map((s) => (
                <button key={s} className={"cm-count cm-" + s + (fStatus === s ? " on" : "")} onClick={() => setFStatus(fStatus === s ? "" : s)} aria-pressed={fStatus === s}>
                  <b>{stats.byStatus[s]}</b><span>{t(STATUS_LABEL[s])}</span></button>))}</div>
            </div>
          </div>
          <div className="hub-card cm-cats">
            <b>{t("By category")}</b>
            {stats.byCategory.map((c) => (
              <button key={c.category} className={"cm-cat" + (fCat === c.category ? " on" : "")} onClick={() => setFCat(fCat === c.category ? "" : c.category)} aria-pressed={fCat === c.category}>
                <span className="cm-cat-name">{t(c.category)}</span>
                <span className="cm-bar" title={`${c.met} ${t("Met")} · ${c.partial} ${t("Partial")} · ${c.missing} ${t("Missing")} · ${c.conflict} ${t("Conflict")}`}>
                  {MATRIX_STATUSES.map((s) => c[s] > 0 && <span key={s} className={"cm-seg cm-" + s} style={{ flexGrow: c[s] }} />)}
                </span>
                <span className="cm-cat-pct">{c.score}%</span>
              </button>))}
          </div>
        </div>
        {result.summary && <div className="hub-card"><b>{t("Summary")}</b><p className="cm-p">{result.summary}</p></div>}
        {result.truncated && <div className="hub-card cm-note">{t("The AI response reached its length limit, so some requirements may be missing. Split very long documents and run again.")}</div>}
        {result.conflicts.length > 0 && <div className="hub-card"><b>{t("Conflicts between EIR and BEP")}</b>
          <ul className="cm-conflicts">{result.conflicts.map((c, i) => <li key={i}><span className="small muted">{[c.eirRef && `EIR ${c.eirRef}`, c.bepRef && `BEP ${c.bepRef}`].filter(Boolean).join(" ↔ ")}</span> {c.description}{c.resolution && <div className="small"><b>{t("Resolution")}:</b> {c.resolution}</div>}</li>)}</ul></div>}

        <div className="cm-toolbar">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search requirements, evidence, suggested text…")} aria-label={t("Search")} />
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value as MatrixStatus | "")} aria-label={t("Status")}><option value="">{t("All statuses")}</option>{MATRIX_STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}</select>
          <select value={fCat} onChange={(e) => setFCat(e.target.value as MatrixCategory | "")} aria-label={t("Category")}><option value="">{t("All categories")}</option>{MATRIX_CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select>
          <select value={fPri} onChange={(e) => setFPri(e.target.value as MatrixPriority | "")} aria-label={t("Priority")}><option value="">{t("All priorities")}</option>{MATRIX_PRIORITIES.map((p) => <option key={p} value={p}>{t(PRIORITY_LABEL[p])}</option>)}</select>
          <span className="small muted">{view.length} / {rows.length}</span>
        </div>
        <div className="cm-exports">
          <button onClick={() => void exportXlsx(result, rows, accepted)}>{t("Export Excel")}</button>
          <button onClick={addendum} disabled={!gapRows.length}>{acceptedGaps.length ? `${t("BEP addendum (Word)")} · ${acceptedGaps.length} ${t("accepted")}` : `${t("BEP addendum (Word)")} · ${t("all gaps")}`}</button>
          <button onClick={csv}>{t("Export CSV")}</button>
          <button className="ghost small" onClick={() => setAccepted(new Set(gapRows.map((r) => r.id)))} disabled={!gapRows.length}>{t("Accept all suggestions")}</button>
          <button className="ghost small" onClick={() => setAccepted(new Set())} disabled={!accepted.size}>{t("Clear accepted")}</button>
        </div>

        <div className="table-wrap">
          <table className="data cm-table">
            <thead><tr>
              <th><button className="cm-sort" onClick={() => sortBy("id")}>{t("ID")}{arrow("id")}</button></th>
              <th>{t("Requirement")}</th>
              <th><button className="cm-sort" onClick={() => sortBy("category")}>{t("Category")}{arrow("category")}</button></th>
              <th><button className="cm-sort" onClick={() => sortBy("status")}>{t("Status")}{arrow("status")}</button></th>
              <th><button className="cm-sort" onClick={() => sortBy("priority")}>{t("Priority")}{arrow("priority")}</button></th>
              <th>{t("BEP section")}</th>
              <th>{t("Accept")}</th>
            </tr></thead>
            <tbody>{view.map((r) => {
              const isOpen = open.has(r.id);
              return (
                <Fragment key={r.id}>
                  <tr className={"cm-row" + (isOpen ? " open" : "")}>
                    <td><button className="cm-expand" onClick={() => setOpen(toggle(open, r.id))} aria-expanded={isOpen}>{isOpen ? "▾" : "▸"} <span className="cm-id">{r.id}</span></button></td>
                    <td><div className="cm-req">{r.requirement}</div>{r.eirSection && <div className="small muted">EIR {r.eirSection}</div>}</td>
                    <td className="small">{t(r.category)}</td>
                    <td><Chip s={r.status} /></td>
                    <td><span className={"cm-pri cm-pri-" + r.priority}>{t(PRIORITY_LABEL[r.priority])}</span></td>
                    <td className="small">{r.bepSection || "—"}</td>
                    <td>{isGap(r) && r.suggestedText ? <input type="checkbox" className="cm-check" checked={accepted.has(r.id)} onChange={() => setAccepted(toggle(accepted, r.id))} aria-label={`${t("Accept suggestion")} ${r.id}`} /> : <span className="muted">—</span>}</td>
                  </tr>
                  {isOpen && <tr className="cm-detail"><td colSpan={7}>
                    <div className="cm-detail-grid">
                      <div><div className="cm-label">{t("Evidence in BEP")}</div><div className="small">{r.evidence ? `“${r.evidence}”` : t("No response found in the BEP.")}</div></div>
                      <div><div className="cm-label">{t("Gap")}</div><div className="small">{r.gap || "—"}</div></div>
                      {r.suggestedText && <div className="cm-suggest">
                        <div className="cm-label">{t("Suggested BEP text")}</div>
                        <p className="cm-p">{r.suggestedText}</p>
                        <div className="cm-suggest-actions">
                          <button className="small" onClick={() => void copy(r.id, r.suggestedText)}>{copied === r.id ? t("Copied") : t("Copy")}</button>
                          {isGap(r) && <label className="cm-accept"><input type="checkbox" checked={accepted.has(r.id)} onChange={() => setAccepted(toggle(accepted, r.id))} /> {t("Accept suggestion")}</label>}
                        </div>
                      </div>}
                    </div>
                  </td></tr>}
                </Fragment>
              );
            })}
            {!view.length && <tr><td colSpan={7} className="muted small">{t("No requirements match the filters.")}</td></tr>}</tbody>
          </table>
        </div>
        <p className="small muted">{t("Generated with AI from the documents provided. The accountable person must review every row and suggested text before it is relied on or added to the BEP.")}</p>
      </>}
    </div>
  );
}
