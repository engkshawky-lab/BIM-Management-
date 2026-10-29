import { useMemo, useState, type CSSProperties } from "react";
import { checkNames, formatMsg, NA_ROLE_CODES, NA_TYPE_CODES, type NameCheck } from "../../../shared/namingCheck";
import { exportCsv } from "../lib/export";
import { activePlan, planContainers } from "../lib/planStore";
import { useProjectData } from "../lib/projectStore";
import { tr } from "../i18nDom";
import { TONES } from "./hubTheme";

// Batch file-naming checker: paste names or drop files/folders (only names are read), check every name against
// ISO 19650-2 UK National Annex fields and the project code, get corrected names, and match them to the delivery plan.

const trf = (t: string, n: number) => formatMsg({ t, v: { n } }, tr);
const cv = (c: string) => ({ "--c": c }) as CSSProperties;
type Filter = "all" | "errors" | "warnings" | "ok" | "plan";
const state = (r: NameCheck) => (r.errors.length ? "error" : r.warnings.length ? "warning" : "ok");
/** Example names built from the current project code and plan, so the example shows matches as well as mistakes. */
const sample = (code: string, org: string, planned?: string[]) => {
  const c = code || "HOS01"; const o = org || "ABC";
  const ok = planned?.[0] ?? `${c}-${o}-ZZ-01-DR-A-0001`;
  return [`${ok}-S2-P01.pdf`, `${c.toLowerCase()}_${o.toLowerCase()}_zz_01_dr_a_2.dwg`, `${ok}-S2-P01.pdf`, `${c}-${o}-ZZ-01-M3-A-0099.rvt`, `${c}-${o}-ZZ-02-QQ-S-0004.pdf`, "Ground floor plan FINAL v3.pdf"].join("\n");
};

export default function NamingCheck() {
  const [p] = useProjectData();
  const plan = useMemo(() => activePlan(), []);
  const [text, setText] = useState("");
  const [code, setCode] = useState(() => p.code || plan?.header.projectCode || "");
  const [orgs, setOrgs] = useState(() => plan?.header.originator || "");
  const [sep, setSep] = useState(() => p.separator || "-");
  const [usePlan, setUsePlan] = useState(!!plan);
  const [filter, setFilter] = useState<Filter>("all");
  const [over, setOver] = useState(false);
  const [copied, setCopied] = useState("");

  const lines = text.split(/\r?\n/);
  const report = useMemo(() => checkNames(lines, { separator: sep, projectCode: code.trim() || undefined, originators: orgs.split(/[,;\s]+/) }, usePlan && plan ? planContainers(plan) : undefined),
    [text, sep, code, orgs, usePlan, plan]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = report.results.filter((r) => filter === "all" || (filter === "errors" ? r.errors.length : filter === "warnings" ? !r.errors.length && r.warnings.length : filter === "ok" ? state(r) === "ok" : r.inPlan === false));
  const fixes = report.results.filter((r) => r.suggestion);

  const addNames = (names: string[]) => setText((t) => [t.trim(), ...names].filter(Boolean).join("\n"));
  const fromFiles = (files: FileList | File[]) => addNames([...files].map((f) => (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name));
  const copy = (s: string, what: string) => { navigator.clipboard?.writeText(s); setCopied(what); setTimeout(() => setCopied(""), 1500); };
  const csv = () => exportCsv(`${code || "PRJ"}-naming-check`, ["Line", "Name", "Result", "Problems", "Suggested name", "In delivery plan"],
    report.results.map((r) => [String(r.line), r.input, state(r), [...r.errors, ...r.warnings].map((m) => formatMsg(m)).join(" | "), r.suggestion ?? "", r.inPlan === undefined ? "" : r.inPlan ? "Yes" : "No"]));

  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="page-head">
        <h1>File naming checker</h1>
        <p className="muted">Check hundreds of file or container names at once against ISO 19650-2 (UK National Annex) fields, your project code and your delivery plan. Only names are read: files never leave your computer.</p>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="grid g4">
          <div><label>Project code</label><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. HOS01" /></div>
          <div><label>Originator codes <span className="muted small">(comma separated, optional)</span></label><input value={orgs} onChange={(e) => setOrgs(e.target.value.toUpperCase())} placeholder="e.g. ABC, XYZ" /></div>
          <div><label>Field separator</label><select value={sep} onChange={(e) => setSep(e.target.value)}><option value="-">- (hyphen)</option><option value="_">_ (underscore)</option></select></div>
          <div><label>Delivery plan</label>
            {plan ? <label className="row small" style={{ gap: 6, marginTop: 6 }}><input type="checkbox" checked={usePlan} onChange={(e) => setUsePlan(e.target.checked)} style={{ width: "auto" }} />Match against the {plan.kind.toUpperCase()} ({plan.rows.length} containers)</label>
              : <div className="small muted" style={{ marginTop: 6 }}>No TIDP or MIDP saved yet. <a href="#/ai-tools/plans">Create one</a> to check names against it.</div>}
          </div>
        </div>
        <div className="small muted" style={{ marginTop: 8 }}>Fields: Project-Originator-Volume-Level-Type-Role-Number, optionally followed by a status code (S0–S7, A1…, CR) and a revision (P01, C01). Example: HOS01-ABC-ZZ-01-DR-A-0001-S2-P01.pdf</div>
      </div>

      <div className="grid g2" style={{ marginBottom: 12, alignItems: "stretch" }}>
        <div className="card" style={{ display: "grid", gap: 8 }}>
          <div className="row spread"><b>Names to check</b><span className="row" style={{ gap: 6 }}>
            <button className="ghost small" onClick={() => setText(sample(code.trim(), orgs.split(/[,;\s]+/)[0] ?? "", plan ? planContainers(plan) : undefined))}>Try an example</button>
            {text && <button className="ghost small" onClick={() => setText("")}>Clear</button>}</span></div>
          <textarea rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={"One name per line. Paste from Explorer, Excel, the CDE or a transmittal.\nHOS01-ABC-ZZ-01-DR-A-0001-S2-P01.pdf"} style={{ fontFamily: "var(--mono, monospace)", fontSize: 12 }} />
        </div>
        <label className="hub-tile" onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); fromFiles(e.dataTransfer.files); }}
          style={{ ...cv(over ? TONES.green : "var(--hub)"), display: "grid", placeItems: "center", gap: 8, padding: 24, borderStyle: "dashed", cursor: "pointer", textAlign: "center", margin: 0 }}>
          <b>Drop files here, or click to choose</b>
          <span className="small muted">Only the names are read. Nothing is uploaded.</span>
          <input type="file" multiple style={{ display: "none" }} onChange={(e) => { if (e.target.files) fromFiles(e.target.files); e.target.value = ""; }} />
          <span className="small">or <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); (document.getElementById("naming-folder") as HTMLInputElement)?.click(); }}>choose a whole folder</a></span>
          <input id="naming-folder" type="file" style={{ display: "none" }} {...({ webkitdirectory: "" } as object)} onChange={(e) => { if (e.target.files) fromFiles(e.target.files); e.target.value = ""; }} />
        </label>
      </div>

      {report.counts.total > 0 && <>
        <div className="grid g4" style={{ marginBottom: 12 }}>
          {([["all", report.counts.total, "names checked", "var(--hub)"], ["ok", report.counts.ok, "correct", TONES.green], ["warnings", report.counts.warnings, "to confirm", TONES.amber], ["errors", report.counts.errors, "wrong", TONES.red]] as const).map(([f, n, l, c]) => (
            <button key={f} className="hub-stat" style={{ ...cv(c), cursor: "pointer", outline: filter === f ? `2px solid ${c}` : undefined }} onClick={() => setFilter(f)}><div className="v">{n}</div><div className="small">{l}</div></button>))}
        </div>

        <div className="row" style={{ gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {fixes.length > 0 && <button onClick={() => copy(fixes.map((r) => r.suggestion).join("\n"), "fixes")}>{copied === "fixes" ? tr("Copied ✓") : trf("Copy {n} corrected names", fixes.length)}</button>}
          {fixes.length > 0 && <button className="ghost" onClick={() => copy(fixes.map((r) => `ren "${r.input.split(/[\\/]/).pop()}" "${r.suggestion}"`).join("\r\n"), "ren")}>{copied === "ren" ? tr("Copied ✓") : tr("Copy Windows rename commands")}</button>}
          <button className="ghost" onClick={csv}>Export CSV</button>
          {usePlan && plan && <button className={"ghost" + (filter === "plan" ? " on" : "")} onClick={() => setFilter(filter === "plan" ? "all" : "plan")}>{trf("Not in plan: {n}", report.results.filter((r) => r.inPlan === false).length)}</button>}
        </div>

        <div className="card table-wrap" style={{ marginBottom: 12 }}>
          <table className="data">
            <thead><tr><th>#</th><th>Name</th><th>Result</th><th>What to fix</th><th>Suggested name</th></tr></thead>
            <tbody>{shown.map((r) => { const s = state(r); const c = s === "error" ? "var(--danger)" : s === "warning" ? "var(--warn)" : "var(--ok)"; return (
              <tr key={r.line}>
                <td className="small muted">{r.line}</td>
                <td className="mono small no-i18n" style={{ wordBreak: "break-all" }}>{r.input}</td>
                <td className="nowrap"><b style={{ color: c }}>{s === "error" ? "✗ Wrong" : s === "warning" ? "⚠ Confirm" : "✓ Correct"}</b>{r.inPlan === true && <div className="tiny muted">In plan</div>}</td>
                <td className="small">{[...r.errors, ...r.warnings].map((m, i) => <div key={i} className="no-i18n">{formatMsg(m, tr)}</div>)}</td>
                <td className="mono small">{r.suggestion ? <button className="ghost small no-i18n" title={tr("Copy")} onClick={() => copy(r.suggestion!, String(r.line))}>{copied === String(r.line) ? tr("Copied ✓") : r.suggestion}</button> : <span className="muted">—</span>}</td>
              </tr>); })}</tbody>
          </table>
          {!shown.length && <p className="muted small">Nothing in this filter.</p>}
        </div>

        {usePlan && plan && report.notDelivered.length > 0 && <details className="card" style={{ marginBottom: 12 }}>
          <summary><b>{trf("{n} planned containers have no file in this list", report.notDelivered.length)}</b> <span className="small muted">— not delivered yet, or named differently</span></summary>
          <div className="mono small no-i18n" style={{ marginTop: 8, columns: "2 280px" }}>{report.notDelivered.map((n) => <div key={n}>{n}</div>)}</div>
        </details>}
      </>}

      <details className="card">
        <summary><b>Code lists used</b> <span className="small muted">— UK National Annex type and role codes; other codes are flagged to confirm against your project information standard</span></summary>
        <div className="grid g2" style={{ marginTop: 8 }}>
          <div className="small">{Object.entries(NA_TYPE_CODES).map(([k, v]) => <div key={k}><b className="mono no-i18n">{k}</b> {v}</div>)}</div>
          <div className="small">{Object.entries(NA_ROLE_CODES).map(([k, v]) => <div key={k}><b className="mono no-i18n">{k}</b> {v}</div>)}</div>
        </div>
      </details>
    </div>
  );
}
