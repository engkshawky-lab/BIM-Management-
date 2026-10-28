import { useMemo, useState, type CSSProperties } from "react";
import { useSession } from "../App";
import { api } from "../lib/api";
import { exportCsv } from "../lib/export";
import type { ElementRow, IfcJob, IfcJobResult } from "../lib/ifcWorker";
import { saveMarkdownDocx } from "../lib/mdDocx";
import { TONES } from "./hubTheme";

// Model tools: IFC Hub (analysis, LOIN/IDS validation, AI comparison) and the QA/QC model checker (single or batch).
// Files are read and checked in this browser; only a compact summary is sent to AI when you ask for the AI comparison.

export const MODEL_TOOLS = [
  { id: "ifc", label: "IFC Hub", hint: "Analyse an IFC model, check it against LOIN or IDS requirements, and compare it with your EIR using AI" },
  { id: "qaqc", label: "QA/QC model checker", hint: "Grade IFC models A–F against ISO 19650 checks, one file or up to 10 side by side" },
] as const;

const MAX_MB = 300;
const cv = (c: string) => ({ "--c": c }) as CSSProperties;
const grade = (score: number) => (score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F");
const gradeColor = (g: string) => ({ A: TONES.green, B: TONES.teal, C: TONES.amber, D: TONES.red, F: TONES.red } as Record<string, string>)[g] ?? TONES.blue;
const sevColor = (s: string) => (s === "error" ? "var(--danger)" : s === "warning" ? "var(--warn)" : "var(--muted)");
const pretty = (t: string) => t.replace(/^IFC/, "Ifc").replace(/STANDARDCASE$/, "StandardCase").replace(/(?<=Ifc)([A-Z]+)/, (m) => m.charAt(0) + m.slice(1).toLowerCase());

/** Run one IFC file through the worker. */
export function runIfc(file: File, job: Omit<IfcJob, "text"> = {}): Promise<IfcJobResult> {
  return new Promise(async (resolve, reject) => {
    if (!/\.ifc$/i.test(file.name)) return reject(new Error(`${file.name} is not an .ifc file. Export IFC from your authoring tool first (IFC ZIP and IFCXML are not supported).`));
    if (file.size > MAX_MB * 1024 * 1024) return reject(new Error(`${file.name} is larger than ${MAX_MB} MB.`));
    const worker = new Worker(new URL("../lib/ifcWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<{ ok: boolean; result?: IfcJobResult; error?: string }>) => { worker.terminate(); e.data.ok ? resolve(e.data.result!) : reject(new Error(e.data.error)); };
    worker.onerror = (e) => { worker.terminate(); reject(new Error(e.message || "The file could not be read.")); };
    worker.postMessage({ ...job, text: await file.text() });
  });
}

function Drop({ multiple, onFiles, busy, label }: { multiple?: boolean; onFiles: (f: File[]) => void; busy: boolean; label: string }) {
  const [over, setOver] = useState(false);
  return (
    <label onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); onFiles([...e.dataTransfer.files]); }}
      className="hub-tile" style={{ ...cv(over ? TONES.green : "var(--hub)"), display: "grid", placeItems: "center", gap: 6, padding: 28, borderStyle: "dashed", cursor: "pointer", textAlign: "center", margin: 0 }}>
      <span style={{ fontSize: 30 }}>🧊</span>
      <b>{busy ? "Reading the model…" : label}</b>
      <span className="small muted">IFC 2x3, IFC 4 or IFC 4.3 · up to {MAX_MB} MB{multiple ? " each · up to 10 files" : ""} · checked in your browser, nothing is uploaded</span>
      <input type="file" accept=".ifc" multiple={multiple} style={{ display: "none" }} onChange={(e) => onFiles([...(e.target.files ?? [])])} />
    </label>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const g = grade(score);
  return <div style={{ width: 72, height: 72, borderRadius: 16, background: gradeColor(g), color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><div style={{ textAlign: "center" }}><b style={{ fontSize: 28, lineHeight: 1 }}>{g}</b><div className="tiny" style={{ opacity: .9 }}>{score}/100</div></div></div>;
}

function Checks({ r }: { r: IfcJobResult }) {
  return (
    <div className="grid g3">{r.report.checks.map((c, i) => { const total = c.passed + c.failed; const pct = total ? Math.round((c.passed / total) * 100) : 100; const col = pct >= 90 ? TONES.green : pct >= 60 ? TONES.amber : TONES.red; return (
      <div key={c.id} className="hub-tile" style={cv(col)}>
        <div className="row spread"><b>{i + 1}. {c.name}</b><span className="badge" style={{ background: col, color: "#fff", borderColor: col }}>{pct}%</span></div>
        <div className="progress" style={{ margin: "6px 0" }}><div style={{ width: pct + "%", background: col }} /></div>
        <div className="small muted">{c.detail}</div>
      </div>); })}</div>
  );
}

function Findings({ r }: { r: IfcJobResult }) {
  const [sev, setSev] = useState("");
  const f = r.report.findings.filter((x) => !sev || x.severity === sev);
  const n = (s: string) => r.report.findings.filter((x) => x.severity === s).length;
  if (!r.report.findings.length) return <div className="hub-tile" style={cv(TONES.green)}><b>No issues found.</b></div>;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div className="row">{[["", "All", r.report.findings.length], ["error", "Errors", n("error")], ["warning", "Warnings", n("warning")], ["info", "Notes", n("info")]].filter(([, , c]) => c).map(([s, l, c]) => <button key={String(s)} className={"chip" + (sev === s ? " on" : "")} onClick={() => setSev(String(s))}>{l} {c}</button>)}</div>
      {f.map((x, i) => <div key={i} className="hub-tile" style={{ ...cv(sevColor(x.severity)), borderInlineStart: `4px solid ${sevColor(x.severity)}` }}><span className="badge" style={{ color: sevColor(x.severity), borderColor: sevColor(x.severity), background: "transparent", textTransform: "capitalize" }}>{x.severity}</span> <b>{x.area}:</b> {x.message}</div>)}
    </div>
  );
}

// ---------------------------------------------------------------- IFC Hub

function PropertyCoverage({ elements }: { elements: ElementRow[] }) {
  const classes = useMemo(() => {
    const by = new Map<string, ElementRow[]>();
    for (const e of elements) by.set(e.type, [...(by.get(e.type) ?? []), e]);
    return [...by.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 12).map(([type, els]) => {
      const props = new Map<string, number>();
      for (const e of els) for (const [ps, p] of Object.entries(e.psets)) for (const k of Object.keys(p)) props.set(`${ps}.${k}`, (props.get(`${ps}.${k}`) ?? 0) + 1);
      return { type, count: els.length, props: [...props.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, c]) => ({ k, pct: Math.round((c / els.length) * 100) })) };
    });
  }, [elements]);
  const [open, setOpen] = useState(classes[0]?.type ?? "");
  const cur = classes.find((c) => c.type === open);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className="row">{classes.map((c) => <button key={c.type} className={"chip no-i18n" + (c.type === open ? " on" : "")} onClick={() => setOpen(c.type)}>{pretty(c.type)} {c.count}</button>)}</div>
      {cur && <div className="table-wrap"><table className="data hub-table"><thead><tr><th>Property</th><th style={{ width: "45%" }}>Filled on</th></tr></thead>
        <tbody>{cur.props.map((p) => <tr key={p.k}><td><code className="no-i18n">{p.k}</code></td><td><div className="row" style={{ flexWrap: "nowrap" }}><div className="progress" style={{ flex: 1 }}><div style={{ width: p.pct + "%", background: p.pct >= 95 ? "var(--ok)" : p.pct >= 60 ? "var(--warn)" : "var(--danger)" }} /></div><span className="small">{p.pct}%</span></div></td></tr>)}</tbody></table></div>}
    </div>
  );
}

function ElementBrowser({ r }: { r: IfcJobResult }) {
  const [q, setQ] = useState(""); const [type, setType] = useState(""); const [sel, setSel] = useState<ElementRow | null>(null);
  const types = useMemo(() => Object.entries(r.report.classCounts).sort((a, b) => b[1] - a[1]), [r]);
  const rows = r.elements.filter((e) => (!type || e.type === type) && (!q || `${e.name} ${e.guid} ${e.typeName} ${e.storey}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 200);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className="row"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, GUID, type or storey…" style={{ flex: 1, minWidth: 200 }} />
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "auto" }}><option value="">All classes</option>{types.map(([t, n]) => <option key={t} value={t}>{pretty(t)} ({n})</option>)}</select>
        <button className="small" onClick={() => exportCsv("ifc-elements", ["GUID", "Class", "Name", "Type", "Storey", "Classification"], r.elements.map((e) => [e.guid, e.type, e.name, e.typeName, e.storey, e.classification]))}>Elements (CSV)</button></div>
      {r.truncated && <div className="small muted">Showing the first {r.elements.length.toLocaleString()} elements.</div>}
      <div className="table-wrap" style={{ maxHeight: 420, overflow: "auto" }}><table className="data hub-table"><thead><tr><th>Class</th><th>Name</th><th>Type</th><th>Storey</th><th>Psets</th></tr></thead>
        <tbody className="no-i18n">{rows.map((e) => <tr key={e.guid} onClick={() => setSel(e)} style={{ cursor: "pointer", ...(sel?.guid === e.guid ? { outline: "2px solid var(--hub)" } : {}) }}><td className="small">{pretty(e.type)}</td><td>{e.name || <span className="muted">(no name)</span>}</td><td className="small">{e.typeName}</td><td className="small">{e.storey}</td><td className="small">{Object.keys(e.psets).length}</td></tr>)}</tbody></table></div>
      {sel && <div className="proc-detail" style={cv("var(--hub)")}>
        <div className="row spread"><h3 className="no-i18n">{sel.name || "(no name)"} · {pretty(sel.type)}</h3><button className="ghost" onClick={() => setSel(null)}>Close</button></div>
        <div className="small muted no-i18n">GUID {sel.guid} · {sel.storey || "no storey"}{sel.classification && ` · ${sel.classification}`}</div>
        <div className="grid g3" style={{ marginTop: 8 }}>{Object.entries(sel.psets).map(([ps, props]) => <div key={ps} className="hub-tile no-i18n" style={cv(TONES.purple)}><b className="small">{ps}</b>{Object.entries(props).slice(0, 20).map(([k, v]) => <div key={k} className="small"><span className="muted">{k}:</span> {v || "—"}</div>)}</div>)}</div>
      </div>}
    </div>
  );
}

interface LoinRow { ref: string; element: string; ifcClass: string; alphanumeric: string }
const STARTER: LoinRow[] = [
  { ref: "L1", element: "Doors", ifcClass: "IfcDoor", alphanumeric: "Pset_DoorCommon.FireRating, Pset_DoorCommon.IsExternal, Pset_DoorCommon.AcousticRating" },
  { ref: "L2", element: "Walls", ifcClass: "IfcWall", alphanumeric: "Pset_WallCommon.IsExternal, Pset_WallCommon.LoadBearing, Pset_WallCommon.FireRating" },
  { ref: "L3", element: "Spaces", ifcClass: "IfcSpace", alphanumeric: "Pset_SpaceCommon.Reference" },
];

/** Compact model description for the AI comparison: classes, coverage of their most common properties, classification, storeys. */
function modelSummary(r: IfcJobResult) {
  const by = new Map<string, ElementRow[]>();
  for (const e of r.elements) by.set(e.type, [...(by.get(e.type) ?? []), e]);
  const classes = [...by.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 25).map(([type, els]) => {
    const props = new Map<string, number>();
    for (const e of els) for (const [ps, p] of Object.entries(e.psets)) for (const [k, v] of Object.entries(p)) if (v) props.set(`${ps}.${k}`, (props.get(`${ps}.${k}`) ?? 0) + 1);
    return `${type} (${els.length}): ${[...props.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, c]) => `${k} ${Math.round((c / els.length) * 100)}%`).join(", ")}`;
  });
  return [`Schema ${r.report.schema}; ${r.report.elementCount} elements; storeys: ${r.report.storeys.map((s) => s.name).join(", ")}`,
    `Classification systems: ${r.report.classificationSystems.join(", ") || "none"}`, `Checks: ${r.report.checks.map((c) => `${c.name} ${c.passed}/${c.passed + c.failed}`).join("; ")}`, ...classes].join("\n").slice(0, 40000);
}

interface AiCompare { summary: string; rows: { requirement: string; status: string; evidence: string; action: string }[] }

function IfcHub() {
  const { toast } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<IfcJobResult | null>(null);
  const [tab, setTab] = useState("overview");
  const [loin, setLoin] = useState<LoinRow[]>(STARTER);
  const [ids, setIds] = useState<{ name: string; xml: string } | null>(null);
  const [reqText, setReqText] = useState("");
  const [ai, setAi] = useState<AiCompare | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const analyse = async (f: File | null = file, withReqs = false) => {
    if (!f) return;
    setFile(f); setBusy(true); setAi(null);
    try { setR(await runIfc(f, withReqs ? { loin, ids: ids?.xml } : {})); if (withReqs) setTab("requirements"); }
    catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const compare = async () => {
    if (!r) return; setAiBusy(true);
    try { setAi(await api<AiCompare>("/ai/tools/model-compare", { body: { summary: modelSummary(r), requirements: reqText, fileName: file?.name ?? "model.ifc" } })); }
    catch (e) { toast((e as Error).message, "error"); } finally { setAiBusy(false); }
  };
  const tabs = [["overview", "Building analysis"], ["elements", "Elements"], ["properties", "Property coverage"], ["requirements", "LOIN / IDS validator"], ["ai", "AI comparison with your EIR"]];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {!r ? <Drop busy={busy} onFiles={(fs) => fs[0] && analyse(fs[0])} label="Drop an IFC file here, or click to browse" />
        : <div className="hub-card row" style={{ gap: 16 }}>
          <ScoreBadge score={r.report.score} />
          <div style={{ flex: 1, minWidth: 200 }}><b className="no-i18n" style={{ fontSize: 16 }}>{file?.name}</b>
            <div className="small muted">{r.report.schema} · {r.report.elementCount.toLocaleString()} elements · {r.report.storeys.length} storeys · {Object.keys(r.report.classCounts).length} classes · read in {r.seconds}s</div>
            <div className="small muted no-i18n">{[r.report.header.originatingSystem, r.report.header.author.join(", "), r.report.header.organization.join(", ")].filter(Boolean).join(" · ")}</div></div>
          <button className="ghost" onClick={() => { setR(null); setFile(null); }}>Check another file</button>
        </div>}
      {r && <>
        <div className="hub-tabs">{tabs.map(([id, l]) => <a key={id} className={tab === id ? "on" : ""} href="#" onClick={(e) => { e.preventDefault(); setTab(id); }}>{l}</a>)}</div>
        {tab === "overview" && <div style={{ display: "grid", gap: 12 }}>
          <div className="grid g4">{[["Elements", r.report.elementCount.toLocaleString(), TONES.blue], ["Storeys", String(r.report.storeys.length), TONES.teal], ["Classification", r.report.classificationSystems[0] ?? "None", TONES.purple], ["Georeferenced", r.report.checks.find((c) => c.id === "georef")?.failed ? "No" : "Yes", TONES.amber]].map(([l, v, c]) => <div key={l} className="hub-stat" style={cv(c)}><div className="v no-i18n">{v}</div><div className="small">{l}</div></div>)}</div>
          <div className="grid g2" style={{ alignItems: "start" }}>
            <div className="hub-card"><div className="hub-title">Elements by class</div>{Object.entries(r.report.classCounts).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t, n], i, all) => (
              <div key={t} className="row small" style={{ flexWrap: "nowrap", marginBottom: 4 }}><span className="no-i18n" style={{ width: 150, flexShrink: 0 }}>{pretty(t)}</span><div style={{ flex: 1, height: 12, borderRadius: 3, background: "var(--surface-2)" }}><div style={{ width: `${(n / all[0][1]) * 100}%`, height: "100%", borderRadius: 3, background: Object.values(TONES)[i % 6] }} /></div><b style={{ width: 50, textAlign: "end" }}>{n}</b></div>))}</div>
            <div className="hub-card"><div className="hub-title">Storeys</div><table className="data hub-table"><thead><tr><th>Storey</th><th>Elevation</th><th>Elements</th></tr></thead>
              <tbody className="no-i18n">{r.report.storeys.map((s) => <tr key={s.name}><td>{s.name}</td><td>{s.elevation ?? "—"}</td><td>{r.storeyCounts[s.name] ?? 0}</td></tr>)}{r.storeyCounts["(not in a storey)"] ? <tr><td className="muted">(not in a storey)</td><td>—</td><td>{r.storeyCounts["(not in a storey)"]}</td></tr> : null}</tbody></table></div>
          </div>
          <div className="hub-card"><div className="hub-title">ISO 19650 model checks</div><Checks r={r} /></div>
          <div className="hub-card"><div className="hub-title">Issues</div><Findings r={r} /></div>
        </div>}
        {tab === "elements" && <div className="hub-card"><ElementBrowser r={r} /></div>}
        {tab === "properties" && <div className="hub-card"><div className="hub-title">How often each property is filled, per class</div><PropertyCoverage elements={r.elements} /></div>}
        {tab === "requirements" && <div className="hub-card" style={{ display: "grid", gap: 10 }}>
          <div className="small">List the properties each IFC class must carry (from your LOIN matrix), or load a buildingSMART IDS file. Use <code>Pset.Property</code>, and <code>=value</code> to require a value.</div>
          <div className="table-wrap"><table className="data hub-table"><thead><tr><th>Ref</th><th>Element</th><th>IFC class</th><th>Required properties (comma-separated)</th><th /></tr></thead>
            <tbody>{loin.map((row, i) => <tr key={i}>{(["ref", "element", "ifcClass", "alphanumeric"] as const).map((k) => <td key={k}><input className="cell-input no-i18n" value={row[k]} onChange={(e) => setLoin(loin.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} /></td>)}<td><button className="ghost small" onClick={() => setLoin(loin.filter((_, j) => j !== i))}>✕</button></td></tr>)}</tbody></table></div>
          <div className="row"><button className="small" onClick={() => setLoin([...loin, { ref: `L${loin.length + 1}`, element: "", ifcClass: "", alphanumeric: "" }])}>+ Add row</button>
            <label className="small" style={{ margin: 0 }}><input type="file" accept=".ids,.xml" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files?.[0]; if (f) setIds({ name: f.name, xml: await f.text() }); }} /><span className="btn">Load IDS file</span></label>
            {ids && <span className="small">IDS: <b className="no-i18n">{ids.name}</b> <button className="ghost small" onClick={() => setIds(null)}>✕</button></span>}
            <button className="primary" disabled={busy} onClick={() => analyse(file, true)}>{busy ? "Checking…" : "Check requirements"}</button></div>
          {r.report.requirements.length > 0 && <div className="table-wrap"><table className="data hub-table"><thead><tr><th>Requirement</th><th>Class</th><th>Elements</th><th>Passed</th><th>Missing (first elements)</th></tr></thead>
            <tbody>{r.report.requirements.map((q, i) => { const pct = q.applicable ? Math.round((q.passed / q.applicable) * 100) : 0; return <tr key={i}><td><span className="badge">{q.source}</span> {q.name}</td><td className="small no-i18n">{pretty(q.entity)}</td><td>{q.applicable}</td><td><b style={{ color: !q.applicable ? "var(--muted)" : pct === 100 ? "var(--ok)" : pct >= 60 ? "var(--warn)" : "var(--danger)" }}>{q.applicable ? `${pct}%` : "n/a"}</b></td><td className="small no-i18n">{q.failures.slice(0, 3).map((f) => `${f.name || f.guid}: ${f.missing.join(", ")}`).join(" · ") || "—"}</td></tr>; })}</tbody></table></div>}
          {r.unsupportedIds > 0 && <div className="small muted">{r.unsupportedIds} IDS facets (classification, material or part-of) are not checked yet.</div>}
        </div>}
        {tab === "ai" && <div className="hub-card" style={{ display: "grid", gap: 10 }}>
          <div className="small">Paste the information requirements for this model (EIR extract, LOIN table, client data requirements). AI compares them with a summary of the model: classes, property fill rates and checks. The model file itself is not sent.</div>
          <textarea value={reqText} onChange={(e) => setReqText(e.target.value)} placeholder="e.g. All doors shall carry FireRating and AcousticRating. Spaces shall be classified with Uniclass SL codes. COBie manufacturer and model number for all maintainable equipment…" style={{ minHeight: 120 }} />
          <div className="row"><button className="primary" disabled={aiBusy || reqText.trim().length < 20} onClick={compare}>{aiBusy ? "Comparing…" : "Compare with AI"}</button><span className="small muted">Takes about a minute.</span></div>
          {ai && <>
            <div className="hub-tile" style={cv("var(--hub)")}>{ai.summary}</div>
            <div className="table-wrap"><table className="data hub-table"><thead><tr><th>Requirement</th><th>Status</th><th>What the model shows</th><th>Action</th></tr></thead>
              <tbody>{ai.rows.map((x, i) => { const c = x.status === "met" ? "var(--ok)" : x.status === "partial" ? "var(--warn)" : x.status === "missing" ? "var(--danger)" : "var(--muted)"; return <tr key={i}><td>{x.requirement}</td><td><span className="badge" style={{ color: c, borderColor: c, background: "transparent" }}>{x.status}</span></td><td className="small">{x.evidence}</td><td className="small">{x.action}</td></tr>; })}</tbody></table></div>
            <button className="small" onClick={() => exportCsv("model-vs-requirements", ["Requirement", "Status", "Evidence", "Action"], ai.rows.map((x) => [x.requirement, x.status, x.evidence, x.action]))}>Comparison (CSV)</button>
          </>}
        </div>}
      </>}
    </div>
  );
}

// ---------------------------------------------------------------- QA/QC checker

interface Batch { file: File; status: "wait" | "busy" | "done" | "error"; result?: IfcJobResult; error?: string }

function qaReport(items: Batch[]) {
  const done = items.filter((b) => b.result);
  const esc = (s: string) => s.replace(/\|/g, "\\|");
  return [`# IFC model QA/QC report`, ``, `| File | Schema | Elements | Score | Grade | Errors | Warnings |`, `|---|---|---|---|---|---|---|`,
    ...done.map((b) => { const r = b.result!.report; return `| ${esc(b.file.name)} | ${r.schema} | ${r.elementCount} | ${r.score} | ${grade(r.score)} | ${r.findings.filter((f) => f.severity === "error").length} | ${r.findings.filter((f) => f.severity === "warning").length} |`; }), ``,
    ...done.flatMap((b, i) => { const r = b.result!.report; return [`## ${i + 1} ${b.file.name}`, ``, `| Check | Passed | Failed | Detail |`, `|---|---|---|---|`, ...r.checks.map((c) => `| ${c.name} | ${c.passed} | ${c.failed} | ${esc(c.detail)} |`), ``, ...r.findings.map((f) => `- **${f.severity}** ${f.area}: ${esc(f.message)}`), ``]; }),
    `> Automated checks against ISO 19650 information-quality expectations. They support, and do not replace, the delivery team's own QA and the appointing party's review.`].join("\n");
}

function QaChecker() {
  const { toast } = useSession();
  const [items, setItems] = useState<Batch[]>([]);
  const [open, setOpen] = useState(0);
  const running = items.some((b) => b.status === "busy" || b.status === "wait");
  const add = async (files: File[]) => {
    const list = files.filter((f) => /\.ifc$/i.test(f.name)).slice(0, 10);
    if (!list.length) return toast("Choose .ifc files.", "error");
    const next: Batch[] = list.map((file) => ({ file, status: "wait" }));
    setItems(next); setOpen(0);
    for (let i = 0; i < next.length; i++) { // one at a time keeps memory use low for big models
      setItems((s) => s.map((b, j) => (j === i ? { ...b, status: "busy" } : b)));
      try { const result = await runIfc(next[i].file); setItems((s) => s.map((b, j) => (j === i ? { ...b, status: "done", result } : b))); }
      catch (e) { setItems((s) => s.map((b, j) => (j === i ? { ...b, status: "error", error: (e as Error).message } : b))); }
    }
  };
  const done = items.filter((b) => b.result);
  const cur = items[open]?.result;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Drop multiple busy={running} onFiles={add} label={items.length ? "Drop more files to start a new comparison" : "Drop one IFC file, or up to 10 to compare"} />
      {items.length > 0 && <div className="hub-card" style={{ display: "grid", gap: 8 }}>
        <div className="row spread"><div className="hub-title" style={{ margin: 0 }}>{items.length > 1 ? "Comparison" : "Result"}</div>
          {done.length > 0 && !running && <div className="row">
            <button className="primary" onClick={() => saveMarkdownDocx(qaReport(items), "IFC-QA-QC-report", { title: "IFC model QA/QC report", project: `${done.length} model${done.length > 1 ? "s" : ""}`, status: "QA record" })}>Download report (Word)</button>
            <button className="small" onClick={() => exportCsv("ifc-qaqc", ["File", "Schema", "Elements", "Score", "Grade", ...done[0].result!.report.checks.map((c) => c.name)], done.map((b) => { const r = b.result!.report; return [b.file.name, r.schema, String(r.elementCount), String(r.score), grade(r.score), ...r.checks.map((c) => `${c.passed}/${c.passed + c.failed}`)]; }))}>Comparison (CSV)</button></div>}</div>
        <div className="table-wrap"><table className="data hub-table"><thead><tr><th>File</th><th>Grade</th><th>Score</th><th>Schema</th><th>Elements</th><th>Errors</th><th>Warnings</th>{done[0]?.result!.report.checks.map((c) => <th key={c.id} className="small">{c.name}</th>)}</tr></thead>
          <tbody>{items.map((b, i) => { const r = b.result?.report; return (
            <tr key={i} onClick={() => b.result && setOpen(i)} style={{ cursor: b.result ? "pointer" : "default", ...(open === i ? { outline: "2px solid var(--hub)" } : {}) }}>
              <td className="no-i18n">{b.file.name}{b.error && <div className="small" style={{ color: "var(--danger)" }}>{b.error}</div>}</td>
              <td>{r ? <b style={{ color: gradeColor(grade(r.score)), fontSize: 16 }}>{grade(r.score)}</b> : b.status === "busy" ? "…" : b.status === "wait" ? <span className="muted">waiting</span> : "—"}</td>
              <td>{r?.score ?? ""}</td><td className="small">{r?.schema}</td><td>{r?.elementCount.toLocaleString()}</td>
              <td style={{ color: "var(--danger)" }}>{r?.findings.filter((f) => f.severity === "error").length}</td><td style={{ color: "var(--warn)" }}>{r?.findings.filter((f) => f.severity === "warning").length}</td>
              {done[0]?.result!.report.checks.map((c) => { const x = r?.checks.find((y) => y.id === c.id); const t = x ? x.passed + x.failed : 0; const pct = x && t ? Math.round((x.passed / t) * 100) : null; return <td key={c.id} className="small" style={{ color: pct === null ? undefined : pct >= 90 ? "var(--ok)" : pct >= 60 ? "var(--warn)" : "var(--danger)" }}>{pct === null ? "" : `${pct}%`}</td>; })}
            </tr>); })}</tbody></table></div>
      </div>}
      {cur && <div className="hub-card" style={{ display: "grid", gap: 10 }}>
        <div className="row" style={{ gap: 14 }}><ScoreBadge score={cur.report.score} /><div><b className="no-i18n">{items[open].file.name}</b><div className="small muted">{cur.report.schema} · {cur.report.elementCount.toLocaleString()} elements · grade {grade(cur.report.score)}: A ≥ 90, B ≥ 75, C ≥ 60, D ≥ 40</div></div></div>
        <Checks r={cur} />
        <Findings r={cur} />
      </div>}
    </div>
  );
}

export default function ModelTools({ tool }: { tool?: string }) {
  const cur = MODEL_TOOLS.find((t) => t.id === tool) ?? MODEL_TOOLS[0];
  return (
    <div className="hub" style={{ "--hub": TONES.teal } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">TOOLS · BIM MODELS</div><h1>{cur.label}</h1><p>{cur.hint}</p>
        <div className="facts"><span>IFC 2x3 · 4 · 4.3</span><span>Checked in your browser</span><span>Word and CSV reports</span></div></div>
      <div className="hub-tabs">{MODEL_TOOLS.map((t) => <a key={t.id} className={cur.id === t.id ? "on" : ""} href={`#/model-tools/${t.id}`}>{t.label}</a>)}</div>
      {cur.id === "ifc" ? <IfcHub /> : <QaChecker />}
    </div>
  );
}
