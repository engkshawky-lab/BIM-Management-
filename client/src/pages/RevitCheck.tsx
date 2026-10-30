import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { saveAs } from "file-saver";
import {
  PYREVIT_SCRIPT_PATH, REVIT_CATEGORIES, defaultRules, mcpPrompt, parseResults, pyRevitScript, scoreResults,
  type CheckStatus, type RevitCheck as Check, type RevitResults, type RevitRules,
} from "../../../shared/revitRules";
import { exportCsv } from "../lib/export";
import { useProjectData } from "../lib/projectStore";
import { TONES } from "./hubTheme";

// Revit project check: edit the project's rules, run them in Revit (a generated read-only pyRevit button, or Claude
// through a Revit MCP connector), then drop the results file here for a grade, the failing elements and a history.

const cv = (c: string) => ({ "--c": c }) as CSSProperties;
const RULES_KEY = "bim:revit:rules";
const HISTORY_KEY = "bim:revit:history";
const load = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };
const list = (s: string) => s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
const today = () => new Date().toISOString().slice(0, 10);

const STATUS: Record<CheckStatus, { label: string; icon: string; color: string }> = {
  fail: { label: "Failed", icon: "✗", color: "var(--danger)" }, warn: { label: "To confirm", icon: "⚠", color: "var(--warn)" },
  pass: { label: "Passed", icon: "✓", color: "var(--ok)" }, info: { label: "Information", icon: "ℹ", color: "var(--muted)" },
};
const gradeColor = (g: string) => ({ A: TONES.green, B: TONES.teal, C: TONES.amber, D: TONES.red, F: TONES.red } as Record<string, string>)[g] ?? "var(--muted)";

interface HistoryRow { model: string; checked: string; score: number; grade: string; fail: number; warn: number }

function RulesEditor({ rules, setRules, onReset }: { rules: RevitRules; setRules: (r: RevitRules) => void; onReset: () => void }) {
  const set = (patch: Partial<RevitRules>) => setRules({ ...rules, ...patch });
  const cats = rules.categories;
  const setCat = (i: number, patch: Partial<RevitRules["categories"][number]>) => set({ categories: cats.map((c, k) => (k === i ? { ...c, ...patch } : c)) });
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="grid g4">
        <div><label>Project code</label><div className="code no-i18n">{rules.project.code || "—"}</div><div className="tiny muted">From <a href="#/project-data">Project data</a></div></div>
        <div><label>Model file name</label><label className="row small" style={{ gap: 6, marginTop: 6 }}><input type="checkbox" style={{ width: "auto" }} checked={rules.naming.checkFileName} onChange={(e) => set({ naming: { ...rules.naming, checkFileName: e.target.checked } })} />Check against the naming convention</label></div>
        <div><label>Sheet number pattern <span className="muted small">(optional)</span></label><input className="no-i18n" value={rules.sheets.numberPattern} placeholder="e.g. ^[A-Z]{1,2}-\d{3}$" onChange={(e) => set({ sheets: { ...rules.sheets, numberPattern: e.target.value } })} /></div>
        <div><label>Sheet parameters to fill</label><input value={rules.sheets.params.join(", ")} onChange={(e) => set({ sheets: { ...rules.sheets, params: list(e.target.value) } })} /></div>
      </div>
      <div>
        <label>Project Information parameters <span className="muted small">(those with a value in Project data must match it)</span></label>
        <input value={rules.projectInfo.map((x) => x.param).join(", ")} onChange={(e) => { const old = new Map(rules.projectInfo.map((x) => [x.param, x.expected])); set({ projectInfo: list(e.target.value).map((param) => ({ param, expected: old.get(param) })) }); }} />
      </div>
      <div>
        <div className="row spread"><label style={{ margin: 0 }}>Parameters each category must carry <span className="muted small">(instance or type)</span></label>
          <button className="ghost small" onClick={() => set({ categories: [...cats, { category: "OST_GenericModel", label: REVIT_CATEGORIES.OST_GenericModel, params: ["Mark"] }] })}>+ Add category</button></div>
        <div className="table-wrap"><table className="data"><tbody>{cats.map((c, i) => (
          <tr key={i}>
            <td style={{ width: 220 }}><select value={c.category} onChange={(e) => setCat(i, { category: e.target.value, label: REVIT_CATEGORIES[e.target.value] ?? e.target.value })}>{Object.entries(REVIT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
            <td><input value={c.params.join(", ")} onChange={(e) => setCat(i, { params: list(e.target.value) })} aria-label="Parameters" /></td>
            <td style={{ width: 40 }}><button className="ghost small" title="Remove" onClick={() => set({ categories: cats.filter((_, k) => k !== i) })}>✕</button></td>
          </tr>))}</tbody></table></div>
      </div>
      <div className="grid g4">
        <div><label>Max Revit warnings</label><input type="number" min={0} value={rules.thresholds.maxWarnings} onChange={(e) => set({ thresholds: { ...rules.thresholds, maxWarnings: +e.target.value || 0 } })} /></div>
        <div><label>Max in-place families</label><input type="number" min={0} value={rules.thresholds.maxInPlace} onChange={(e) => set({ thresholds: { ...rules.thresholds, maxInPlace: +e.target.value || 0 } })} /></div>
        <div><label>Max imported CAD</label><input type="number" min={0} value={rules.thresholds.maxImportedCad} onChange={(e) => set({ thresholds: { ...rules.thresholds, maxImportedCad: +e.target.value || 0 } })} /></div>
        <div><label>Missing values allowed before "failed"</label><select value={rules.thresholds.missingShareWarn} onChange={(e) => set({ thresholds: { ...rules.thresholds, missingShareWarn: +e.target.value } })}>{[0, 0.02, 0.05, 0.1].map((v) => <option key={v} value={v}>{v * 100}%</option>)}</select></div>
      </div>
      <div className="row" style={{ gap: 8 }}><button className="ghost small" onClick={onReset}>Reset to defaults from Project data</button><span className="tiny muted">Rules are saved in this browser.</span></div>
    </div>
  );
}

function RunInRevit({ rules }: { rules: RevitRules }) {
  const [how, setHow] = useState<"pyrevit" | "mcp">("pyrevit");
  const [copied, setCopied] = useState(false);
  const name = rules.project.code || "PROJECT";
  const zip = async () => {
    const JSZip = (await import("jszip")).default;
    const z = new JSZip();
    z.file(PYREVIT_SCRIPT_PATH, pyRevitScript(rules, today()));
    z.file("ISO19650.extension/README.txt", "ISO 19650 project rules check for Revit (pyRevit extension)\r\n\r\n1. Unzip this folder somewhere permanent, e.g. Documents\\pyRevit extensions.\r\n2. In Revit: pyRevit tab > Settings > Custom Extension Directories > Add folder: choose the folder that contains ISO19650.extension. Save settings and reload.\r\n3. An 'ISO 19650' tab appears with a 'Project rules check' button. Open a model and click it.\r\n4. The check is read-only. Results are saved to Documents\\ISO19650 checks. Drop the .json file on the portal's Revit project check page.\r\n\r\nGenerate the extension again from the portal whenever the project rules change.\r\n");
    saveAs(await z.generateAsync({ type: "blob" }), `${name}-ISO19650-pyRevit-extension.zip`);
  };
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="seg"><button className={how === "pyrevit" ? "on" : ""} onClick={() => setHow("pyrevit")}>pyRevit button</button><button className={how === "mcp" ? "on" : ""} onClick={() => setHow("mcp")}>Claude through MCP</button></div>
      {how === "pyrevit" ? <>
        <ol className="small" style={{ margin: 0, paddingInlineStart: 20, display: "grid", gap: 4 }}>
          <li>Install <a href="https://github.com/pyrevitlabs/pyRevit/releases" target="_blank" rel="noopener noreferrer">pyRevit</a> (free) if it is not installed.</li>
          <li>Download the extension below, unzip it to a permanent folder, then in Revit open <b>pyRevit › Settings › Custom Extension Directories</b>, add that folder and reload.</li>
          <li>Open the model and click <b>ISO 19650 › Project rules check</b>. It only reads the model and saves the results to <span className="mono no-i18n">Documents\ISO19650 checks</span>.</li>
          <li>Drop the results file in step 3 below.</li>
        </ol>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button className="primary" onClick={zip}>Download pyRevit extension (.zip)</button>
          <button className="ghost" onClick={() => saveAs(new Blob([pyRevitScript(rules, today())], { type: "text/x-python" }), `${name}-iso19650-check.py`)}>Script only (.py)</button>
          <button className="ghost" onClick={() => saveAs(new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" }), `${name}-revit-rules.json`)}>Rules (.json)</button>
        </div>
        <div className="tiny muted">The rules are written into the script, so download it again after changing them. The script uses IronPython, pyRevit's default engine; the script-only file also runs in RevitPythonShell.</div>
      </> : <>
        <div className="small">If Claude is connected to Revit through an MCP connector (the <a href="#/hubs/revit/mcp">FirstOption Revit MCP or Autodesk's Revit MCP server</a>), copy this prompt into Claude with the model open. Claude runs the same read-only checks and answers with a results file; paste its answer in step 3.</div>
        <div className="row" style={{ gap: 8 }}><button className="primary" onClick={() => { navigator.clipboard?.writeText(mcpPrompt(rules)); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied ✓" : "Copy the prompt for Claude"}</button></div>
        <div className="tiny muted">Check the model is a copy or that your connector is set to read-only before you start, and review what Claude reports against the model.</div>
      </>}
    </div>
  );
}

function CheckRow({ c }: { c: Check }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const s = STATUS[c.status];
  const ids = c.items.map((x) => x.id).filter((x): x is number => x !== null);
  return (
    <>
      <tr>
        <td className="nowrap"><b style={{ color: s.color }}>{s.icon} {s.label}</b></td>
        <td><b>{c.label}</b>{c.note && <div className="small muted">{c.note}</div>}</td>
        <td className="small no-i18n">{c.value === null || c.value === undefined || c.value === "" ? "—" : String(c.value)}{c.expected && <div className="tiny muted">expected {c.expected}</div>}</td>
        <td className="nowrap">{c.items.length > 0 && <button className="ghost small" onClick={() => setOpen(!open)}>{open ? "Hide" : `${c.count} elements`}</button>}</td>
      </tr>
      {open && <tr><td colSpan={4}>
        <div className="row spread" style={{ marginBottom: 6 }}>
          <span className="tiny muted">{c.count > c.items.length ? `First ${c.items.length} of ${c.count}` : ""}</span>
          {ids.length > 0 && <button className="small" onClick={() => { navigator.clipboard?.writeText(ids.join(";")); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied ✓" : "Copy element IDs for Revit's Select by ID"}</button>}
        </div>
        <div className="table-wrap" style={{ maxHeight: 280, overflow: "auto" }}><table className="data"><tbody>{c.items.map((x, i) => (
          <tr key={i}><td className="mono small no-i18n" style={{ width: 90 }}>{x.id ?? "—"}</td><td className="small no-i18n">{x.name}</td><td className="small">{x.problem}</td></tr>))}</tbody></table></div>
      </td></tr>}
    </>
  );
}

function Report({ r }: { r: RevitResults }) {
  const [filter, setFilter] = useState<CheckStatus | "">("");
  const { score, grade, counts } = scoreResults(r);
  const groups = [...new Set(r.checks.map((c) => c.group))];
  const shown = r.checks.filter((c) => !filter || c.status === filter);
  const order: CheckStatus[] = ["fail", "warn", "pass", "info"];
  const csv = () => exportCsv(`${r.model.title}-revit-check`, ["Group", "Check", "Result", "Value", "Expected", "Note", "Element id", "Element", "Problem"],
    r.checks.flatMap((c) => (c.items.length ? c.items : [null]).map((x) => [c.group, c.label, STATUS[c.status].label, String(c.value ?? ""), c.expected ?? "", c.note ?? "", x?.id == null ? "" : String(x.id), x?.name ?? "", x?.problem ?? ""])));
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, background: gradeColor(grade), color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><div style={{ textAlign: "center" }}><b style={{ fontSize: 28, lineHeight: 1 }}>{grade}</b><div className="tiny" style={{ opacity: .9 }}>{score}/100</div></div></div>
        <div style={{ flex: 1 }}><b className="no-i18n">{r.model.title}</b>
          <div className="small muted">Checked {r.checked}{r.model.revitVersion ? ` · Revit ${r.model.revitVersion}` : ""}{r.model.user ? ` · ${r.model.user}` : ""}{r.rulesFor ? ` · rules for ${r.rulesFor}` : ""}</div>
          <div className="tiny muted">Grade: A ≥ 90, B ≥ 75, C ≥ 60, D ≥ 40. Passed checks count 1, checks to confirm count ½, information is not scored.</div></div>
        <button className="ghost" onClick={csv}>Export CSV</button>
      </div>
      <div className="grid g4">{order.map((s) => (
        <button key={s} className="hub-stat" style={{ ...cv(STATUS[s].color), cursor: "pointer", outline: filter === s ? `2px solid ${STATUS[s].color}` : undefined }} onClick={() => setFilter(filter === s ? "" : s)}><div className="v">{counts[s]}</div><div className="small">{STATUS[s].label}</div></button>))}</div>
      {groups.map((g) => { const rows = shown.filter((c) => c.group === g).sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status)); return rows.length ? (
        <div key={g} className="hub-card"><div className="hub-title">{g}</div>
          <div className="table-wrap"><table className="data"><tbody>{rows.map((c) => <CheckRow key={c.id} c={c} />)}</tbody></table></div></div>) : null; })}
    </div>
  );
}

export default function RevitCheck() {
  const [p] = useProjectData();
  const fromProject = () => defaultRules({ code: p.code, name: p.name, separator: p.separator, classification: p.classification, client: p.client });
  const [rules, setRules] = useState<RevitRules>(() => { const saved = load<RevitRules | null>(RULES_KEY, null); return saved && saved.project?.code === (p.code ?? "").toUpperCase() ? saved : fromProject(); });
  const [results, setResults] = useState<RevitResults | null>(null);
  const [error, setError] = useState("");
  const [paste, setPaste] = useState("");
  const [over, setOver] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>(() => load(HISTORY_KEY, []));
  const [showRules, setShowRules] = useState(false);
  useEffect(() => save(RULES_KEY, rules), [rules]);

  const open = (text: string) => {
    try {
      const r = parseResults(text); setResults(r); setError(""); setPaste("");
      const { score, grade, counts } = scoreResults(r);
      const row = { model: r.model.title, checked: r.checked, score, grade, fail: counts.fail, warn: counts.warn };
      const next = [row, ...history.filter((h) => !(h.model === row.model && h.checked === row.checked))].slice(0, 30);
      setHistory(next); save(HISTORY_KEY, next);
    } catch (e) { setError((e as Error).message); }
  };
  const readFile = (f?: File) => f && f.text().then(open);
  const models = useMemo(() => [...new Set(history.map((h) => h.model))], [history]);
  const step = (n: number, title: string, hint: string) => <div className="row" style={{ gap: 10, marginBottom: 8 }}><span className="hub-theme-n" style={cv("var(--hub)")}>{n}</span><div><b>{title}</b><div className="small muted">{hint}</div></div></div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {!p.code && <div className="hub-tile small" style={cv(TONES.amber)}><b>No project code yet.</b> Add it in <a href="#/project-data">Project data</a> so the file name and Project Number are checked against it.</div>}

      <div className="card">
        {step(1, "Project rules", `${rules.categories.length} categories · ${rules.categories.reduce((a, c) => a + c.params.length, 0)} parameter checks · naming, Project Information, sheets and model health`)}
        <button className="ghost small" onClick={() => setShowRules(!showRules)}>{showRules ? "Hide rules" : "Review or edit the rules"}</button>
        {showRules && <div style={{ marginTop: 10 }}><RulesEditor rules={rules} setRules={setRules} onReset={() => setRules(fromProject())} /></div>}
      </div>

      <div className="card">
        {step(2, "Run the check in Revit", "A read-only button in Revit, or Claude through a Revit MCP connector")}
        <RunInRevit rules={rules} />
      </div>

      <div className="card">
        {step(3, "Open the results", "Drop the results file, or paste Claude's answer")}
        <div className="grid g2">
          <label className="hub-tile" onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); readFile(e.dataTransfer.files[0]); }}
            style={{ ...cv(over ? TONES.green : "var(--hub)"), display: "grid", placeItems: "center", gap: 6, padding: 20, borderStyle: "dashed", cursor: "pointer", textAlign: "center", margin: 0 }}>
            <b>Drop the results file (.json) here, or click to choose</b>
            <span className="small muted">From Documents\ISO19650 checks. Read in this browser only.</span>
            <input type="file" accept=".json,application/json" style={{ display: "none" }} onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <div style={{ display: "grid", gap: 6 }}>
            <textarea rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="…or paste the JSON Claude returned" className="no-i18n" style={{ fontSize: 12 }} />
            <div><button disabled={!paste.trim()} onClick={() => open(paste)}>Open pasted results</button></div>
          </div>
        </div>
        {error && <div className="hub-tile small" style={{ ...cv(TONES.red), marginTop: 8 }}>{error}</div>}
      </div>

      {results && <div className="card"><Report r={results} /></div>}

      {history.length > 0 && <div className="card">
        <div className="row spread"><b>History</b><button className="ghost small" onClick={() => { setHistory([]); save(HISTORY_KEY, []); }}>Clear</button></div>
        <div className="table-wrap"><table className="data"><thead><tr><th>Model</th><th>Checks run (newest first)</th></tr></thead><tbody>{models.map((m) => (
          <tr key={m}><td className="mono small no-i18n">{m}</td><td><div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{history.filter((h) => h.model === m).map((h) => (
            <span key={h.checked} className="chip" title={`${h.fail} failed · ${h.warn} to confirm`}><b style={{ color: gradeColor(h.grade) }}>{h.grade}</b>&nbsp;{h.score} · {h.checked}</span>))}</div></td></tr>))}</tbody></table></div>
        <div className="tiny muted">Saved in this browser so you can see each model improve from one check to the next.</div>
      </div>}
    </div>
  );
}
