import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import { api } from "../../lib/api";
import { csvText } from "../../lib/export";
import { saveMarkdownDocx } from "../../lib/mdDocx";
import { t } from "../../i18n";
import {
  AUDIT_PARTS, AUDIT_SEVERITIES, AUDIT_STATUSES, PART_LABEL, ROLE_LABEL, ROW_HEADER, SEVERITY_LABEL, STAGE_TITLE, STATUS_LABEL,
  auditReportMarkdown, buildChecklist, isFinding, scoreAudit, toRows,
  type AuditPart, type AuditResult, type AuditRole, type AuditRow, type AuditScope, type AuditSeverity, type AuditStatus, type ChecklistItem, type EvidenceEntry,
} from "../../../../shared/auditChecklist";
import { STAGE_IDS, type StageId } from "../../../../shared/data/workflow/types";
import "./audit.css";

// ISO 19650 audit assistant: deterministic checklist from the platform's ISO 19650 data, AI assessment against
// uploaded evidence in batches, auditor overrides and formal exports. Decision support only; the auditor decides.

const KEY = "bim:audit-assistant:last";
const BATCH = 30;
const MAX_FILES = 12, MAX_SIZE = 25 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,.xlsx,.txt,.md,.csv,.png,.jpg,.jpeg";
const STATUS_CLASS: Record<AuditStatus, string> = { conformant: "ok", partially: "part", nonconformant: "nc", "not evidenced": "ne", "not applicable": "na" };
const XL_FILL: Record<AuditStatus, string> = { conformant: "FFDCFCE7", partially: "FFFEF3C7", nonconformant: "FFFEE2E2", "not evidenced": "FFF1F5F9", "not applicable": "FFE2E8F0" };
const ROLES: AuditRole[] = ["appointing", "lead"];

interface Saved { meta: { projectName: string; auditor: string; scope: AuditScope; date: string }; rows: AuditRow[]; original: Record<string, AuditResult>; summaries: string[]; register: EvidenceEntry[]; files: string[] }

const slug = (s: string) => s.trim().replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "project";
const today = () => new Date().toISOString().slice(0, 10);
const kind = (name: string) => {
  const ext = (/\.([a-z0-9]+)$/i.exec(name)?.[1] ?? "").toLowerCase();
  return ext === "pdf" ? "PDF" : ext === "docx" ? "DOC" : ext === "xlsx" || ext === "csv" ? "XLS" : ["png", "jpg", "jpeg"].includes(ext) ? "IMG" : "TXT";
};
const fmtSize = (n: number) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1)} MB`);

function loadLast(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Saved;
    if (d?.meta?.scope && Array.isArray(d.rows)) return d;
  } catch { /* unreadable: start fresh */ }
  return null;
}

function Gauge({ score }: { score: number }) {
  const r = 52, c = 2 * Math.PI * r, tone = score >= 85 ? "ok" : score >= 70 ? "part" : "nc";
  return (
    <svg className={"au-gauge au-" + tone} viewBox="0 0 128 128" role="img" aria-label={`${t("Conformance score")} ${score}/100`}>
      <circle cx="64" cy="64" r={r} className="au-gauge-track" />
      <circle cx="64" cy="64" r={r} className="au-gauge-bar" strokeDasharray={`${(c * score) / 100} ${c}`} transform="rotate(-90 64 64)" />
      <text x="64" y="62" textAnchor="middle" className="au-gauge-num">{score}</text>
      <text x="64" y="82" textAnchor="middle" className="au-gauge-sub">/ 100</text>
    </svg>
  );
}

const Chip = ({ s }: { s: AuditStatus }) => <span className={"au-chip au-" + STATUS_CLASS[s]}>{t(STATUS_LABEL[s])}</span>;

async function exportXlsx(saved: Saved) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "ISO 19650 audit assistant";
  const s = scoreAudit(saved.rows);
  const head = (ws: import("exceljs").Worksheet, cols: number) => {
    const h = ws.getRow(1);
    h.font = { bold: true, color: { argb: "FFFFFFFF" } };
    h.alignment = { vertical: "middle", wrapText: true };
    for (let c = 1; c <= cols; c++) h.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };
  const sum = wb.addWorksheet("Summary");
  sum.columns = [{ header: "Item", width: 32 }, { header: "Value", width: 90 }];
  const { meta } = saved;
  const add = (k: string, v: string | number) => sum.addRow([k, v]);
  add("Project", meta.projectName || "—"); add("Auditor", meta.auditor || "—"); add("Date", meta.date);
  add("Scope", meta.scope.parts.map((p) => PART_LABEL[p]).join("; ")); add("Audited party", ROLE_LABEL[meta.scope.role]); add("Stage reached", STAGE_TITLE(meta.scope.stage));
  add("Weighted conformance score", `${s.score}/100`); add("Indicative verdict", s.verdict);
  for (const st of AUDIT_STATUSES) add(STATUS_LABEL[st], s.byStatus[st]);
  for (const sv of AUDIT_SEVERITIES) add(`${SEVERITY_LABEL[sv]} findings`, s.bySeverity[sv]);
  for (const p of s.byPart) add(PART_LABEL[p.part], `${p.score}% (${p.total} items)`);
  add("AI summary", saved.summaries.join("\n\n"));
  add("Note", "Decision support, not certification. The auditor reviews every item and decides the final status.");
  head(sum, 2);
  sum.getColumn(2).alignment = { wrapText: true, vertical: "top" };

  const ws = wb.addWorksheet("Findings");
  const widths = [14, 12, 34, 50, 18, 12, 40, 50, 50, 8, 8];
  ws.columns = ROW_HEADER.map((h, i) => ({ header: h, width: widths[i] ?? 16 }));
  toRows(saved.rows).slice(1).forEach((r, i) => {
    const row = ws.addRow(r);
    row.alignment = { wrapText: true, vertical: "top" };
    row.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: XL_FILL[saved.rows[i].status] } };
    row.getCell(5).font = { bold: true };
    if (saved.rows[i].severity === "major" && isFinding(saved.rows[i])) row.getCell(6).font = { bold: true, color: { argb: "FFB91C1C" } };
  });
  head(ws, ROW_HEADER.length);
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ROW_HEADER.length } };

  const ev = wb.addWorksheet("Evidence register");
  ev.columns = [{ header: "File", width: 40 }, { header: "Describes", width: 80 }];
  const reg = saved.register.length ? saved.register : saved.files.map((f) => ({ file: f, describes: "" }));
  reg.forEach((e) => { const row = ev.addRow([e.file, e.describes]); row.alignment = { wrapText: true, vertical: "top" }; });
  head(ev, 2);
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `ISO19650-audit_${slug(meta.projectName)}.xlsx`);
}

export default function AuditAssistant() {
  const last = useMemo(loadLast, []);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [step, setStep] = useState(last?.rows.length ? 5 : 1);
  const [parts, setParts] = useState<AuditPart[]>(last?.meta.scope.parts ?? [1, 2]);
  const [role, setRole] = useState<AuditRole>(last?.meta.scope.role ?? "lead");
  const [stage, setStage] = useState<StageId>(last?.meta.scope.stage ?? "design");
  const [projectName, setProjectName] = useState(last?.meta.projectName ?? "");
  const [auditor, setAuditor] = useState(last?.meta.auditor ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [fileMsg, setFileMsg] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, batch: 0, batches: 0 });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Saved | null>(last);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [fStatus, setFStatus] = useState<AuditStatus | "">("");
  const [fSev, setFSev] = useState<AuditSeverity | "">("");
  const [fPart, setFPart] = useState<AuditPart | 0>(0);
  const [findingsOnly, setFindingsOnly] = useState(false);
  const [q, setQ] = useState("");
  const cancel = useRef(false);

  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  useEffect(() => { try { if (saved) localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* storage full or blocked */ } }, [saved]);

  const scope: AuditScope = useMemo(() => ({ parts: AUDIT_PARTS.filter((p) => parts.includes(p)), role, stage }), [parts, role, stage]);
  const checklist = useMemo(() => (scope.parts.length ? buildChecklist(scope) : []), [scope]);
  const selected = checklist.filter((i) => !excluded.has(i.id));
  useEffect(() => setExcluded(new Set()), [scope]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const msgs: string[] = [];
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!/\.(pdf|docx|xlsx|txt|md|csv|png|jpe?g)$/i.test(f.name)) { msgs.push(`${f.name}: ${t("unsupported file type")}`); continue; }
      if (f.size > MAX_SIZE) { msgs.push(`${f.name}: ${t("over 25 MB")}`); continue; }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      if (next.length >= MAX_FILES) { msgs.push(t("At most 12 files.")); break; }
      next.push(f);
    }
    setFiles(next); setFileMsg(msgs.join(" · "));
  };

  /** Assess the given items in batches, merging into the current result set. */
  const assess = async (items: ChecklistItem[], base: Saved) => {
    setBusy(true); setError(""); cancel.current = false;
    const batches = Math.ceil(items.length / BATCH);
    let cur = base;
    const skippedAll = new Set<string>();
    try {
      for (let b = 0; b < batches; b++) {
        if (cancel.current) break;
        const chunk = items.slice(b * BATCH, (b + 1) * BATCH);
        setProgress({ done: b * BATCH, total: items.length, batch: b + 1, batches });
        const form = new FormData();
        for (const f of files) form.append("files", f);
        form.set("scope", JSON.stringify(base.meta.scope));
        form.set("checklist", JSON.stringify(chunk.map(({ id, part, clauseOrActivity, requirement, evidenceHint }) => ({ id, part, clauseOrActivity, requirement, evidenceHint }))));
        form.set("projectName", base.meta.projectName);
        const r = await api<{ results: (AuditResult & { aiMissing?: boolean })[]; summary: string; evidenceRegister: EvidenceEntry[]; skipped?: string[] }>("/ai/tools/audit", { form });
        const byId = new Map(r.results.map((x) => [x.id, x]));
        const newRows: AuditRow[] = chunk.map((i) => ({ ...i, ...(byId.get(i.id) ?? { id: i.id, status: "not evidenced", evidence: "", finding: "", action: "", severity: "minor", aiMissing: true }) }));
        const original = { ...cur.original };
        for (const nr of newRows) original[nr.id] = { id: nr.id, status: nr.status, evidence: nr.evidence, finding: nr.finding, action: nr.action, severity: nr.severity };
        const merged = new Map(cur.rows.map((x) => [x.id, x]));
        for (const nr of newRows) merged.set(nr.id, nr);
        const order = new Map(checklist.map((c, i) => [c.id, i]));
        const register = [...cur.register];
        for (const e of r.evidenceRegister) if (!register.some((x) => x.file === e.file)) register.push(e);
        (r.skipped ?? []).forEach((s) => skippedAll.add(s));
        cur = { ...cur, rows: [...merged.values()].sort((a, c) => (order.get(a.id) ?? 0) - (order.get(c.id) ?? 0)), original, register, summaries: r.summary ? [...cur.summaries, r.summary] : cur.summaries };
        setSaved(cur);
        setProgress({ done: Math.min(items.length, (b + 1) * BATCH), total: items.length, batch: b + 1, batches });
      }
      setStep(5);
    } catch (e) { setError((e as Error).message); setStep(cur.rows.length ? 5 : 4); }
    finally { setBusy(false); setSkipped([...skippedAll]); }
  };

  const run = () => {
    const base: Saved = { meta: { projectName, auditor, scope, date: today() }, rows: [], original: {}, summaries: [], register: [], files: files.map((f) => f.name) };
    setSaved(base); setOpen(new Set()); setFStatus(""); setFSev(""); setFPart(0); setQ(""); setFindingsOnly(false);
    void assess(selected, base);
  };
  const remaining = saved ? selected.filter((i) => !saved.rows.some((r) => r.id === i.id)) : [];
  const resume = () => { if (saved) void assess(remaining, saved); };

  const rows = saved?.rows ?? [];
  const stats = useMemo(() => scoreAudit(rows), [rows]);
  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => (!fStatus || r.status === fStatus) && (!fSev || (isFinding(r) && r.severity === fSev)) && (!fPart || r.part === fPart) && (!findingsOnly || isFinding(r))
      && (!needle || [r.id, r.clauseOrActivity, r.requirement, r.evidence, r.finding, r.action].some((x) => x.toLowerCase().includes(needle))));
  }, [rows, q, fStatus, fSev, fPart, findingsOnly]);

  const edit = (id: string, patch: Partial<AuditResult>) => setSaved((s) => s && ({
    ...s, rows: s.rows.map((r) => {
      if (r.id !== id) return r;
      const n = { ...r, ...patch };
      const o = s.original[id];
      n.edited = !o || o.status !== n.status || o.finding !== n.finding || o.action !== n.action || o.severity !== n.severity;
      return n;
    }),
  }));
  const revert = (id: string) => setSaved((s) => s && ({ ...s, rows: s.rows.map((r) => (r.id === id && s.original[id] ? { ...r, ...s.original[id], edited: false } : r)) }));
  const toggle = (set: Set<string>, id: string) => { const n = new Set(set); if (n.has(id)) n.delete(id); else n.add(id); return n; };

  const word = () => {
    if (!saved) return;
    const { meta } = saved;
    const md = auditReportMarkdown({ projectName: meta.projectName, auditor: meta.auditor, scope: meta.scope, date: meta.date, summary: saved.summaries.join("\n\n"), evidence: saved.register, files: saved.files }, saved.rows);
    void saveMarkdownDocx(md, `ISO19650-audit-report_${slug(meta.projectName)}`, { title: "ISO 19650 information management audit report", project: meta.projectName || undefined, status: "Draft for auditor review", date: meta.date, preparedBy: meta.auditor || undefined });
  };
  const csv = () => {
    if (!saved) return;
    const [h, ...body] = toRows(saved.rows);
    saveAs(new Blob([csvText(h, body)], { type: "text/csv;charset=utf-8" }), `ISO19650-audit_${slug(saved.meta.projectName)}.csv`);
  };

  const countBy = (p: AuditPart) => selected.filter((i) => i.part === p).length;
  const steps = [t("Scope"), t("Evidence"), t("Checklist"), t("Run"), t("Results")];
  const canGo = (n: number) => n === 5 ? rows.length > 0 : n === 1 || (scope.parts.length > 0 && (n < 4 || (files.length > 0 && selected.length > 0)));

  return (
    <div className="au">
      {enabled === false && <div className="hub-card au-note">{t("AI is not configured on this server, so the audit assistant cannot assess evidence. Ask an administrator to set the Claude API key.")}</div>}
      <div className="hub-card au-disclaimer">{t("Decision support only: the AI suggests a status for each checklist item from the evidence you upload. The auditor reviews every item and decides. This is not certification.")}</div>

      <ol className="au-steps">{steps.map((s, i) => (
        <li key={s}><button className={"au-step" + (step === i + 1 ? " on" : "") + (step > i + 1 ? " done" : "")} disabled={busy || !canGo(i + 1)} onClick={() => setStep(i + 1)} aria-current={step === i + 1 ? "step" : undefined}>
          <span className="au-step-n">{i + 1}</span>{s}</button></li>))}</ol>

      {step === 1 && <div className="hub-card au-panel">
        <b>{t("Audit scope")}</b>
        <fieldset className="au-fs"><legend className="small muted">{t("Parts audited")}</legend>
          {AUDIT_PARTS.map((p) => <label key={p} className="au-check"><input type="checkbox" checked={parts.includes(p)} onChange={() => setParts(parts.includes(p) ? parts.filter((x) => x !== p) : [...parts, p])} /> {t(PART_LABEL[p])}</label>)}
        </fieldset>
        <fieldset className="au-fs"><legend className="small muted">{t("Audited party")}</legend>
          {ROLES.map((r) => <label key={r} className="au-check"><input type="radio" name="au-role" checked={role === r} onChange={() => setRole(r)} /> {t(ROLE_LABEL[r])}</label>)}
        </fieldset>
        <div className="au-opts">
          <label className="au-field"><span className="small muted">{t("Stage reached")}</span>
            <select value={stage} onChange={(e) => setStage(e.target.value as StageId)}>{STAGE_IDS.map((s, i) => <option key={s} value={s}>{i + 1}. {t(STAGE_TITLE(s))}</option>)}</select></label>
          <label className="au-field"><span className="small muted">{t("Project name")}</span><input value={projectName} onChange={(e) => setProjectName(e.target.value)} maxLength={160} /></label>
          <label className="au-field"><span className="small muted">{t("Auditor")}</span><input value={auditor} onChange={(e) => setAuditor(e.target.value)} maxLength={120} /></label>
        </div>
        {!scope.parts.length && <div className="small au-warn">{t("Select at least one part.")}</div>}
        <div className="au-nav"><span className="small muted">{checklist.length} {t("checklist items")}</span><button className="primary" disabled={!scope.parts.length} onClick={() => setStep(2)}>{t("Next")}</button></div>
      </div>}

      {step === 2 && <div className="hub-card au-panel">
        <b>{t("Project evidence")}</b>
        <p className="small muted">{t("Upload the EIR, BEP, MIDP/TIDPs, responsibility matrix, information protocol, CDE procedure, security triage, meeting minutes and screenshots. PDF, DOCX, XLSX, TXT, PNG or JPG; up to 12 files of 25 MB each.")}</p>
        <label className="au-drop">
          <input type="file" multiple accept={ACCEPT} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} aria-label={t("Add evidence files")} />
          <span>{t("Add evidence files")}</span>
        </label>
        {fileMsg && <div className="small au-warn">{fileMsg}</div>}
        {files.length > 0 ? <ul className="au-files">{files.map((f, i) => (
          <li key={f.name + f.size}><span className={"au-ficon au-f-" + kind(f.name).toLowerCase()}>{kind(f.name)}</span><span className="au-fname">{f.name}</span><span className="small muted">{fmtSize(f.size)}</span>
            <button className="ghost small" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`${t("Remove")} ${f.name}`}>{t("Remove")}</button></li>))}</ul>
          : <div className="small muted">{t("No evidence files added yet.")}</div>}
        {saved?.files.length && !files.length ? <div className="small muted">{t("Files are not kept after the page is closed; add them again to run a new assessment.")}</div> : null}
        <div className="au-nav"><button onClick={() => setStep(1)}>{t("Back")}</button><button className="primary" disabled={!files.length} onClick={() => setStep(3)}>{t("Next")}</button></div>
      </div>}

      {step === 3 && <div className="hub-card au-panel">
        <b>{t("Generated checklist")}</b>
        <p className="small muted">{t("Built from the platform's ISO 19650 part checklists, clause requirements and the stage gates reached, filtered by audited party and stage. Untick items outside the agreed audit scope.")}</p>
        <div className="au-partcounts">{scope.parts.map((p) => <span key={p} className="au-pc"><b>{countBy(p)}</b> {t(PART_LABEL[p])}</span>)}<span className="au-pc"><b>{selected.length}</b> / {checklist.length} {t("selected")}</span></div>
        <div className="au-nav-inline">
          <button className="ghost small" onClick={() => setExcluded(new Set())}>{t("Select all")}</button>
          <button className="ghost small" onClick={() => setExcluded(new Set(checklist.map((c) => c.id)))}>{t("Clear all")}</button>
        </div>
        <div className="table-wrap au-preview">
          <table className="data">
            <thead><tr><th></th><th>{t("ID")}</th><th>{t("Clause / activity")}</th><th>{t("Requirement")}</th><th>{t("Typical evidence")}</th><th>{t("Weight")}</th></tr></thead>
            <tbody>{checklist.map((c) => (
              <tr key={c.id} className={excluded.has(c.id) ? "au-off" : ""}>
                <td><input type="checkbox" className="au-cb" checked={!excluded.has(c.id)} onChange={() => setExcluded(toggle(excluded, c.id))} aria-label={`${t("Include")} ${c.id}`} /></td>
                <td><span className="au-id">{c.id}</span></td><td className="small">{c.clauseOrActivity}</td><td>{c.requirement}</td><td className="small muted">{c.evidenceHint}</td><td className="small">{c.weight}</td>
              </tr>))}</tbody>
          </table>
        </div>
        <div className="au-nav"><button onClick={() => setStep(2)}>{t("Back")}</button><button className="primary" disabled={!selected.length || !files.length} onClick={() => setStep(4)}>{t("Next")}</button></div>
      </div>}

      {step === 4 && <div className="hub-card au-panel">
        <b>{t("Run the assessment")}</b>
        <p className="small muted">{selected.length} {t("items")} · {files.length} {t("evidence files")} · {Math.ceil(selected.length / BATCH)} {t("batches of up to 30 items")}. {t("Each batch sends the same evidence files; a batch usually takes 1–3 minutes.")}</p>
        {busy && <div className="au-progress" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
          <div className="au-progress-bar"><span style={{ inlineSize: `${progress.total ? (100 * progress.done) / progress.total : 0}%` }} /></div>
          <div className="small">{t("Batch")} {progress.batch} / {progress.batches} · {progress.done} / {progress.total} {t("items assessed")}</div>
        </div>}
        {error && <div className="au-error" role="alert">{error}</div>}
        <div className="au-nav">
          <button onClick={() => setStep(3)} disabled={busy}>{t("Back")}</button>
          {busy ? <button onClick={() => { cancel.current = true; }}>{t("Stop after this batch")}</button>
            : <button className="primary" disabled={enabled !== true || !files.length || !selected.length} onClick={run}>{t("Start assessment")}</button>}
        </div>
      </div>}

      {step === 5 && saved && <>
        {error && <div className="hub-card au-error" role="alert">{error}</div>}
        {remaining.length > 0 && !busy && <div className="hub-card au-note">{remaining.length} {t("selected items have not been assessed yet.")} <button className="small" disabled={enabled !== true || !files.length} onClick={resume}>{t("Assess remaining items")}</button>{!files.length && <span className="small muted"> {t("Add the evidence files again first.")}</span>}</div>}
        {busy && <div className="hub-card small">{t("Batch")} {progress.batch} / {progress.batches} · {progress.done} / {progress.total} {t("items assessed")}</div>}
        {skipped.length > 0 && <div className="hub-card au-note small">{t("Some files could not be read and were treated as not supplied:")} {skipped.join(", ")}</div>}
        <div className="au-summary">
          <div className="hub-card au-scorecard">
            <Gauge score={stats.score} />
            <div>
              <div className="au-verdict">{t(stats.verdict)}</div>
              <div className="small muted">{rows.length} {t("items")}{saved.meta.projectName ? ` · ${saved.meta.projectName}` : ""} · {t(ROLE_LABEL[saved.meta.scope.role])} · {t(STAGE_TITLE(saved.meta.scope.stage))}</div>
              <div className="au-sev">{AUDIT_SEVERITIES.map((s) => (
                <button key={s} className={"au-sevc au-s-" + s + (fSev === s ? " on" : "")} onClick={() => setFSev(fSev === s ? "" : s)} aria-pressed={fSev === s}>
                  <b>{stats.bySeverity[s]}</b><span>{t(s === "observation" ? "Observations" : s === "major" ? "Majors" : "Minors")}</span></button>))}</div>
            </div>
          </div>
          <div className="hub-card au-parts">
            <b>{t("By part")}</b>
            {stats.byPart.map((p) => (
              <button key={p.part} className={"au-partrow" + (fPart === p.part ? " on" : "")} onClick={() => setFPart(fPart === p.part ? 0 : p.part)} aria-pressed={fPart === p.part}>
                <span className="small">{t(PART_LABEL[p.part])}</span>
                <span className="au-bar">{AUDIT_STATUSES.map((s) => p[s] > 0 && <span key={s} className={"au-seg au-" + STATUS_CLASS[s]} style={{ flexGrow: p[s] }} title={`${p[s]} ${t(STATUS_LABEL[s])}`} />)}</span>
                <span className="au-pct">{p.score}%</span>
              </button>))}
            <div className="au-legend">{AUDIT_STATUSES.map((s) => <span key={s} className="small"><i className={"au-dot au-" + STATUS_CLASS[s]} /> {t(STATUS_LABEL[s])} {stats.byStatus[s]}</span>)}</div>
          </div>
        </div>
        {saved.summaries.length > 0 && <div className="hub-card"><b>{t("AI summary")}</b>{saved.summaries.map((s, i) => <p key={i} className="au-p">{s}</p>)}</div>}

        <div className="au-toolbar">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search requirements, evidence, findings…")} aria-label={t("Search")} />
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value as AuditStatus | "")} aria-label={t("Status")}><option value="">{t("All statuses")}</option>{AUDIT_STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}</select>
          <select value={fSev} onChange={(e) => setFSev(e.target.value as AuditSeverity | "")} aria-label={t("Severity")}><option value="">{t("All severities")}</option>{AUDIT_SEVERITIES.map((s) => <option key={s} value={s}>{t(SEVERITY_LABEL[s])}</option>)}</select>
          <select value={fPart} onChange={(e) => setFPart(Number(e.target.value) as AuditPart | 0)} aria-label={t("Part")}><option value={0}>{t("All parts")}</option>{saved.meta.scope.parts.map((p) => <option key={p} value={p}>ISO 19650-{p}</option>)}</select>
          <label className="au-check small"><input type="checkbox" checked={findingsOnly} onChange={(e) => setFindingsOnly(e.target.checked)} /> {t("Findings only")}</label>
          <span className="small muted">{view.length} / {rows.length}</span>
        </div>
        <div className="au-exports">
          <button onClick={word}>{t("Audit report (Word)")}</button>
          <button onClick={() => void exportXlsx(saved)}>{t("Export Excel")}</button>
          <button onClick={csv}>{t("Export CSV")}</button>
          <button className="ghost small" onClick={() => { setStep(1); }}>{t("New audit")}</button>
        </div>

        <div className="table-wrap">
          <table className="data au-table">
            <thead><tr><th>{t("ID")}</th><th>{t("Requirement")}</th><th>{t("Status")}</th><th>{t("Severity")}</th><th>{t("Evidence")}</th></tr></thead>
            <tbody>{view.map((r) => {
              const isOpen = open.has(r.id);
              return (
                <Fragment key={r.id}>
                  <tr className={"au-row" + (isOpen ? " open" : "")}>
                    <td><button className="au-expand" onClick={() => setOpen(toggle(open, r.id))} aria-expanded={isOpen}>{isOpen ? "▾" : "▸"} <span className="au-id">{r.id}</span></button></td>
                    <td><div className="au-req">{r.requirement}</div><div className="small muted">{r.clauseOrActivity}</div></td>
                    <td><Chip s={r.status} />{r.edited && <span className="au-edited">{t("edited")}</span>}{r.aiMissing && <span className="au-edited">{t("not assessed by AI")}</span>}</td>
                    <td>{isFinding(r) ? <span className={"au-sevtag au-s-" + r.severity}>{t(SEVERITY_LABEL[r.severity])}</span> : <span className="muted">—</span>}</td>
                    <td className="small">{r.evidence || "—"}</td>
                  </tr>
                  {isOpen && <tr className="au-detail"><td colSpan={5}>
                    <div className="au-edit">
                      <label className="au-field"><span className="small muted">{t("Status")}</span>
                        <select value={r.status} onChange={(e) => edit(r.id, { status: e.target.value as AuditStatus })}>{AUDIT_STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}</select></label>
                      <label className="au-field"><span className="small muted">{t("Severity")}</span>
                        <select value={r.severity} onChange={(e) => edit(r.id, { severity: e.target.value as AuditSeverity })}>{AUDIT_SEVERITIES.map((s) => <option key={s} value={s}>{t(SEVERITY_LABEL[s])}</option>)}</select></label>
                      <label className="au-field au-wide"><span className="small muted">{t("Finding")}</span><textarea value={r.finding} onChange={(e) => edit(r.id, { finding: e.target.value })} /></label>
                      <label className="au-field au-wide"><span className="small muted">{t("Recommended action")}</span><textarea value={r.action} onChange={(e) => edit(r.id, { action: e.target.value })} /></label>
                      <div className="au-wide small muted">{t("Typical evidence")}: {r.evidenceHint} · {t("Weight")} {r.weight}</div>
                      {r.edited && <div className="au-wide"><button className="ghost small" onClick={() => revert(r.id)}>{t("Revert to AI suggestion")}</button></div>}
                    </div>
                  </td></tr>}
                </Fragment>
              );
            })}
            {!view.length && <tr><td colSpan={5} className="muted small">{t("No items match the filters.")}</td></tr>}</tbody>
          </table>
        </div>
        {saved.register.length > 0 && <div className="hub-card"><b>{t("Evidence register")}</b>
          <ul className="au-reg">{saved.register.map((e) => <li key={e.file}><span className={"au-ficon au-f-" + kind(e.file).toLowerCase()}>{kind(e.file)}</span> <b>{e.file}</b> <span className="small muted">{e.describes}</span></li>)}</ul></div>}
        <p className="small muted">{t("Generated with AI from the evidence provided and the platform's paraphrased ISO 19650 guidance. Decision support, not certification: the auditor verifies each item against the source evidence and the licensed standard and decides the final status.")}</p>
      </>}
    </div>
  );
}
