import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSession } from "../App";
import { Markdown } from "../components/Markdown";
import { api } from "../lib/api";
import { exportCsv } from "../lib/export";
import { saveMarkdownDocx } from "../lib/mdDocx";
import { suitabilityCodes } from "../../../shared/data/iso19650";

// Standalone AI tools: document review, risk register, clash matrix, suitability, COBie, document generator.
// Every result is decision support for an accountable reviewer, never an approval.

export const AI_TOOLS = [
  { id: "review", label: "Document review", hint: "Review an EIR, BEP, MIDP…; EIR ↔ BEP check; BEP version compare" },
  { id: "generate", label: "Document generator", hint: "Draft EIR, AIR, PIR, OIR, BEP, TIDP, MIDP or any custom template" },
  { id: "risks", label: "Risk register", hint: "Project-specific information-management risks with scores and mitigations" },
  { id: "clash", label: "Clash matrix", hint: "Discipline test matrix with tolerances for your stage and software" },
  { id: "suitability", label: "Suitability codes", hint: "Quick wizard plus AI advisor for tricky cases" },
  { id: "cobie", label: "COBie checker", hint: "Rule checks plus AI readiness review and prioritised fixes" },
] as const;

function useAiEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  return enabled;
}

function AiOff() {
  return <div className="card"><b>AI is not configured.</b><p className="muted" style={{ marginBottom: 0 }}>Set <code>CLAUDE_API_KEY</code> in the server's <code>.env</code> and restart the server to use the AI tools.</p></div>;
}

/** Runs an AI request with busy state and error toasts. */
function useRun<T>() {
  const { toast } = useSession();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const run = async (fn: () => Promise<T>) => {
    setBusy(true);
    try { setResult(await fn()); } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  return { busy, result, setResult, run };
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="small" style={{ display: "grid", gap: 4 }}><span className="muted">{label}</span>{children}</label>;
const sevColor = (s: string) => (s === "critical" || s === "missing" || s === "P1" || s === "Not ready" ? "var(--danger)" : s === "major" || s === "partial" || s === "P2" || s === "Minor fixes" || s === "changed" ? "var(--warn)" : "var(--ok)");
const Pill = ({ text }: { text: string }) => <span className="badge" style={{ color: sevColor(text), borderColor: sevColor(text), background: "transparent" }}>{text}</span>;
const Busy = ({ text }: { text: string }) => <div className="card muted">{text}</div>;

// ---------------------------------------------------------------- Document review & compare

interface Review {
  docType: string; score: number; verdict: string; summary: string; strengths: string[]; missing: string[];
  findings: { severity: string; clause: string; issue: string; evidence: string; recommendation: string }[];
  coverage: { item: string; status: string; evidence: string; action: string }[];
}

function DocInput({ label, file, setFile, text, setText }: { label: string; file: File | null; setFile: (f: File | null) => void; text: string; setText: (t: string) => void }) {
  return (
    <div className="card" style={{ display: "grid", gap: 8 }}>
      <b>{label}</b>
      <input type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      {file ? <div className="small muted">{file.name} · {(file.size / 1024).toFixed(0)} KB <button className="ghost small" onClick={() => setFile(null)}>Remove</button></div>
        : <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="…or paste the document text here" style={{ minHeight: 140 }} />}
    </div>
  );
}

function ReviewTool() {
  const [mode, setMode] = useState<"single" | "eir-bep" | "bep-versions">("single");
  const [docType, setDocType] = useState("auto");
  const [fa, setFa] = useState<File | null>(null); const [ta, setTa] = useState("");
  const [fb, setFb] = useState<File | null>(null); const [tb, setTb] = useState("");
  const { busy, result, run } = useRun<Review>();
  const go = () => run(() => {
    const form = new FormData();
    form.set("mode", mode); form.set("docType", docType);
    if (fa) form.set("fileA", fa); else form.set("textA", ta);
    if (mode !== "single") { if (fb) form.set("fileB", fb); else form.set("textB", tb); }
    return api<Review>("/ai/tools/review", { form });
  });
  const labels = mode === "eir-bep" ? ["EIR", "BEP"] : mode === "bep-versions" ? ["Previous BEP", "Revised BEP"] : ["Document"];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="row">
        <div className="seg">{([["single", "Single document review"], ["eir-bep", "EIR ↔ BEP compliance"], ["bep-versions", "BEP version compare"]] as const).map(([k, l]) => <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{l}</button>)}</div>
        {mode === "single" && <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ width: "auto" }}>
          {["auto", "OIR", "AIR", "PIR", "EIR", "Pre-appointment BEP", "Post-appointment BEP", "MIDP", "TIDP", "Responsibility matrix", "Information protocol", "Information standard", "Security management plan"].map((d) => <option key={d} value={d}>{d === "auto" ? "Auto-detect document type" : d}</option>)}
        </select>}
      </div>
      <div className="grid g2">
        <DocInput label={labels[0]} file={fa} setFile={setFa} text={ta} setText={setTa} />
        {mode !== "single" && <DocInput label={labels[1]} file={fb} setFile={setFb} text={tb} setText={setTb} />}
      </div>
      <div className="row"><button className="primary" disabled={busy} onClick={go}>{busy ? "Reviewing…" : "Analyse"}</button><span className="small muted">PDF, DOCX or TXT up to 25 MB. Results are review support; they do not approve or certify a document.</span></div>
      {busy && <Busy text="Reading the document and checking it against ISO 19650… this can take a minute." />}
      {result && <ReviewResult r={result} mode={mode} />}
    </div>
  );
}

function ReviewResult({ r, mode }: { r: Review; mode: string }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="grid g4">
        <div className="card"><div className="muted small">Score</div><div className="stat" style={{ color: r.score >= 75 ? "var(--ok)" : r.score >= 50 ? "var(--warn)" : "var(--danger)" }}>{r.score}</div></div>
        <div className="card"><div className="muted small">Verdict</div><b>{r.verdict}</b></div>
        <div className="card"><div className="muted small">Document type</div><b>{r.docType || "—"}</b></div>
        <div className="card"><div className="muted small">Findings</div><b>{r.findings.filter((f) => f.severity === "critical").length} critical · {r.findings.filter((f) => f.severity === "major").length} major · {r.findings.filter((f) => f.severity === "minor").length} minor</b></div>
      </div>
      <div className="card"><h3 style={{ marginTop: 0 }}>Summary</h3><p style={{ whiteSpace: "pre-wrap" }}>{r.summary}</p>
        {!!r.strengths.length && <><b>Strengths</b><ul>{r.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
        {!!r.missing.length && <><b>Missing content</b><ul>{r.missing.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
      </div>
      {mode !== "single" && !!r.coverage.length && <div className="card table-wrap">
        <div className="row spread"><h3 style={{ margin: 0 }}>{mode === "eir-bep" ? "EIR requirement coverage" : "Changes between versions"}</h3>
          <button onClick={() => exportCsv("coverage", ["Item", "Status", "Evidence", "Action"], r.coverage.map((c) => [c.item, c.status, c.evidence, c.action]))}>CSV</button></div>
        <table className="data"><thead><tr><th>Item</th><th>Status</th><th>Evidence</th><th>Action</th></tr></thead>
          <tbody>{r.coverage.map((c, i) => <tr key={i}><td>{c.item}</td><td><Pill text={c.status} /></td><td className="small muted">{c.evidence}</td><td className="small">{c.action}</td></tr>)}</tbody></table>
      </div>}
      {!!r.findings.length && <div className="card table-wrap">
        <div className="row spread"><h3 style={{ margin: 0 }}>Findings</h3>
          <button onClick={() => exportCsv("review-findings", ["Severity", "Clause", "Issue", "Evidence", "Recommendation"], r.findings.map((f) => [f.severity, f.clause, f.issue, f.evidence, f.recommendation]))}>CSV</button></div>
        <table className="data"><thead><tr><th>Severity</th><th>Clause</th><th>Issue</th><th>Recommendation</th></tr></thead>
          <tbody>{r.findings.map((f, i) => <tr key={i}><td><Pill text={f.severity} /></td><td className="small">{f.clause}</td><td>{f.issue}{f.evidence && <div className="small muted">“{f.evidence}”</div>}</td><td className="small">{f.recommendation}</td></tr>)}</tbody></table>
      </div>}
    </div>
  );
}

// ---------------------------------------------------------------- Document generator & custom template builder

const QUICK: { group: string; docs: string[] }[] = [
  { group: "Information requirements", docs: ["Organisational Information Requirements (OIR)", "Asset Information Requirements (AIR)", "Project Information Requirements (PIR)", "Exchange Information Requirements (EIR)"] },
  { group: "Execution plans", docs: ["Pre-appointment BIM Execution Plan", "Post-appointment BIM Execution Plan", "Task Information Delivery Plan (TIDP)", "Master Information Delivery Plan (MIDP)", "Model Production and Delivery Table (MPDT)"] },
  { group: "CDE & protocols", docs: ["CDE procedure and workflow", "Information protocol", "Project information standard", "Information production methods and procedures"] },
  { group: "Data & compliance", docs: ["COBie data requirements schedule", "Level of information need specification", "Security management plan (ISO 19650-5)", "Health and safety information requirements (ISO 19650-6)"] },
  { group: "Risk & handover", docs: ["Information delivery risk register", "Handover checklist and AIM acceptance plan", "Mobilisation plan", "Capability and capacity assessment"] },
];

function GenerateTool({ initial = "" }: { initial?: string }) {
  const [f, setF] = useState({ docType: initial,projectName: "", organisation: "", appointingParty: "", stage: "", brief: "", style: "draft" as "draft" | "template" });
  const [group, setGroup] = useState(0);
  const { busy, result, run } = useRun<{ markdown: string; truncated: boolean }>();
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const name = (f.docType || "document").replace(/[^\w-]+/g, "-").slice(0, 60);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card" style={{ display: "grid", gap: 10 }}>
        <div className="row spread"><b>Describe any ISO 19650 document you need</b>
          <div className="seg"><button className={f.style === "draft" ? "on" : ""} onClick={() => setF({ ...f, style: "draft" })}>Project draft</button><button className={f.style === "template" ? "on" : ""} onClick={() => setF({ ...f, style: "template" })}>Reusable template</button></div></div>
        <div className="row">{QUICK.map((q, i) => <button key={q.group} className={"chip" + (group === i ? " on" : "")} onClick={() => setGroup(i)}>{q.group}</button>)}</div>
        <div className="row">{QUICK[group].docs.map((d) => <button key={d} className="small" onClick={() => setF({ ...f, docType: d })}>{d}</button>)}</div>
        <div className="grid g2">
          <Field label="Document type *"><input value={f.docType} onChange={set("docType")} placeholder="e.g. Information delivery risk register" /></Field>
          <Field label="Project name"><input value={f.projectName} onChange={set("projectName")} placeholder="e.g. New Hospital Block B" /></Field>
          <Field label="Organisation"><input value={f.organisation} onChange={set("organisation")} /></Field>
          <Field label="Appointing party"><input value={f.appointingParty} onChange={set("appointingParty")} /></Field>
          <Field label="Stage"><input value={f.stage} onChange={set("stage")} placeholder="e.g. RIBA Stage 3 / Concept design" /></Field>
        </div>
        <Field label="Extra requirements"><textarea value={f.brief} onChange={set("brief")} placeholder="e.g. align to UK BIM Framework, include a RACI table, Uniclass 2015, COBie at stage 4 and 6…" style={{ minHeight: 80 }} /></Field>
        <div className="row"><button className="primary" disabled={busy || f.docType.trim().length < 2} onClick={() => run(() => api("/ai/tools/generate", { body: f }))}>{busy ? "Drafting…" : "Generate preview"}</button>
          <span className="small muted">Items needing the appointing party's confirmation are marked [CONFIRM].</span></div>
      </div>
      {busy && <Busy text="Drafting the document… long documents take up to two minutes." />}
      {result && <div className="card">
        <div className="row spread" style={{ marginBottom: 8 }}><b>Preview</b>
          <div className="row">
            <button className="primary" onClick={() => saveMarkdownDocx(result.markdown, name)}>Download Word</button>
            <button onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([result.markdown], { type: "text/markdown" })); a.download = name + ".md"; a.click(); }}>Markdown</button>
            <button onClick={() => navigator.clipboard?.writeText(result.markdown)}>Copy</button>
          </div></div>
        {result.truncated && <p className="small" style={{ color: "var(--warn)" }}>The draft hit the length limit; generate remaining sections separately.</p>}
        <div className="preview"><Markdown text={result.markdown} /></div>
      </div>}
    </div>
  );
}

// ---------------------------------------------------------------- Risk register

interface Risk { ref: string; category: string; risk: string; cause: string; consequence: string; likelihood: number; impact: number; clause: string; mitigation: string; owner: string; residualLikelihood: number; residualImpact: number }
const scoreColor = (s: number) => (s >= 15 ? "var(--danger)" : s >= 8 ? "var(--warn)" : "var(--ok)");

function RiskTool() {
  const [f, setF] = useState({ projectType: "Healthcare building", stage: "Concept design", teamSize: "6–10 task teams", cde: "Autodesk Construction Cloud", procurement: "Design and build", notes: "", count: 25 });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: k === "count" ? Number(e.target.value) : e.target.value });
  const { busy, result, run } = useRun<{ risks: Risk[] }>();
  const risks = result?.risks ?? [];
  const md = () => ["# Information management risk register", "", `Project type: ${f.projectType} · Stage: ${f.stage} · CDE: ${f.cde} · Procurement: ${f.procurement}`, "",
    "| Ref | Category | Risk | L | I | Score | Clause | Mitigation | Owner | Residual |", "|---|---|---|---|---|---|---|---|---|---|",
    ...risks.map((r) => `| ${r.ref} | ${r.category} | ${r.risk} | ${r.likelihood} | ${r.impact} | ${r.likelihood * r.impact} | ${r.clause} | ${r.mitigation} | ${r.owner} | ${r.residualLikelihood * r.residualImpact} |`)].join("\n");
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card grid g3">
        <Field label="Project type"><input value={f.projectType} onChange={set("projectType")} /></Field>
        <Field label="Stage"><input value={f.stage} onChange={set("stage")} /></Field>
        <Field label="Delivery team size"><input value={f.teamSize} onChange={set("teamSize")} /></Field>
        <Field label="CDE platform"><input value={f.cde} onChange={set("cde")} /></Field>
        <Field label="Procurement route"><input value={f.procurement} onChange={set("procurement")} /></Field>
        <Field label="Number of risks"><select value={f.count} onChange={set("count")}>{[15, 25, 35].map((n) => <option key={n}>{n}</option>)}</select></Field>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Notes (constraints, client concerns, known issues)"><textarea value={f.notes} onChange={set("notes")} style={{ minHeight: 60 }} /></Field></div>
        <div><button className="primary" disabled={busy} onClick={() => run(() => api("/ai/tools/risk-register", { body: f }))}>{busy ? "Generating…" : "Generate risk register"}</button></div>
      </div>
      {busy && <Busy text="Identifying project-specific risks…" />}
      {!!risks.length && <>
        <div className="grid g2">
          <div className="card"><b>Heat map (inherent)</b><HeatMap risks={risks} /></div>
          <div className="card"><b>By category</b>{Object.entries(risks.reduce<Record<string, number>>((a, r) => ({ ...a, [r.category]: (a[r.category] ?? 0) + 1 }), {})).map(([c, n]) => <div key={c} className="row spread small"><span>{c}</span><b>{n}</b></div>)}</div>
        </div>
        <div className="card table-wrap">
          <div className="row spread"><h3 style={{ margin: 0 }}>Risk register ({risks.length})</h3><div className="row">
            <button onClick={() => exportCsv("risk-register", ["Ref", "Category", "Risk", "Cause", "Consequence", "Likelihood", "Impact", "Score", "Clause", "Mitigation", "Owner", "Residual L", "Residual I", "Residual score"],
              risks.map((r) => [r.ref, r.category, r.risk, r.cause, r.consequence, String(r.likelihood), String(r.impact), String(r.likelihood * r.impact), r.clause, r.mitigation, r.owner, String(r.residualLikelihood), String(r.residualImpact), String(r.residualLikelihood * r.residualImpact)]))}>Excel (CSV)</button>
            <button onClick={() => saveMarkdownDocx(md(), "risk-register")}>Word</button></div></div>
          <table className="data"><thead><tr><th>Ref</th><th>Risk</th><th>L×I</th><th>Clause</th><th>Mitigation</th><th>Owner</th><th>Residual</th></tr></thead>
            <tbody>{risks.map((r) => <tr key={r.ref}><td className="small">{r.ref}<div className="muted">{r.category}</div></td><td>{r.risk}<div className="small muted">Cause: {r.cause} · Effect: {r.consequence}</div></td>
              <td><b style={{ color: scoreColor(r.likelihood * r.impact) }}>{r.likelihood * r.impact}</b></td><td className="small">{r.clause}</td><td className="small">{r.mitigation}</td><td className="small">{r.owner}</td>
              <td><b style={{ color: scoreColor(r.residualLikelihood * r.residualImpact) }}>{r.residualLikelihood * r.residualImpact}</b></td></tr>)}</tbody></table>
        </div>
      </>}
    </div>
  );
}

function HeatMap({ risks }: { risks: Risk[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto repeat(5, 1fr)", gap: 3, marginTop: 8, fontSize: 12 }}>
      {[5, 4, 3, 2, 1].map((l) => [<div key={"l" + l} className="muted" style={{ alignSelf: "center" }}>L{l}</div>,
        ...[1, 2, 3, 4, 5].map((i) => { const n = risks.filter((r) => r.likelihood === l && r.impact === i).length; return <div key={l + "-" + i} title={`Likelihood ${l} × impact ${i}`} style={{ background: `color-mix(in srgb, ${scoreColor(l * i)} ${n ? 55 : 15}%, transparent)`, borderRadius: 4, textAlign: "center", padding: "8px 0", fontWeight: 700 }}>{n || ""}</div>; })])}
      <div />{[1, 2, 3, 4, 5].map((i) => <div key={"i" + i} className="muted" style={{ textAlign: "center" }}>I{i}</div>)}
    </div>
  );
}

// ---------------------------------------------------------------- Clash matrix

const DISCIPLINES = ["Architecture", "Structure", "HVAC", "Plumbing", "Electrical", "Fire protection", "Civil / site", "Landscape", "Façade", "Drainage", "Vertical transport", "Telecoms / ICT"];
interface ClashTest { code: string; a: string; b: string; type: string; tolerance: number; priority: string; frequency: string; notes: string }

function ClashTool() {
  const [f, setF] = useState({ projectType: "Commercial / office", stage: "Technical design", software: "Autodesk Navisworks", lod: "LOD 300", disciplines: ["Architecture", "Structure", "HVAC", "Plumbing", "Electrical"], notes: "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const { busy, result, run } = useRun<{ tests: ClashTest[]; guidance: string[] }>();
  const sel = (o: string[]) => o.map((x) => <option key={x}>{x}</option>);
  const tests = result?.tests ?? [];
  const pair = (a: string, b: string) => tests.find((t) => (t.a === a && t.b === b) || (t.a === b && t.b === a));
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card grid g2">
        <Field label="Project type"><select value={f.projectType} onChange={set("projectType")}>{sel(["Commercial / office", "Healthcare", "Residential", "Education", "Industrial / data centre", "Transport hub", "Highway / bridge", "Rail", "Utilities"])}</select></Field>
        <Field label="Stage"><select value={f.stage} onChange={set("stage")}>{sel(["Concept design", "Spatial coordination", "Technical design", "Manufacturing & construction"])}</select></Field>
        <Field label="Software"><select value={f.software} onChange={set("software")}>{sel(["Autodesk Navisworks", "Solibri", "Revizto", "Autodesk Construction Cloud (Model Coordination)", "BIMcollab Zoom", "Trimble Connect"])}</select></Field>
        <Field label="LOD"><select value={f.lod} onChange={set("lod")}>{sel(["LOD 200", "LOD 300", "LOD 350", "LOD 400"])}</select></Field>
        <div style={{ gridColumn: "1 / -1" }}><span className="small muted">Disciplines</span><div className="row" style={{ marginTop: 4 }}>{DISCIPLINES.map((d) => <label key={d} className="small row" style={{ gap: 4 }}><input type="checkbox" checked={f.disciplines.includes(d)} onChange={(e) => setF({ ...f, disciplines: e.target.checked ? [...f.disciplines, d] : f.disciplines.filter((x) => x !== d) })} />{d}</label>)}</div></div>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Special requirements"><textarea value={f.notes} onChange={set("notes")} placeholder="e.g. tight ceiling void, prefabricated MEP modules, seismic zone…" style={{ minHeight: 60 }} /></Field></div>
        <div><button className="primary" disabled={busy || f.disciplines.length < 2} onClick={() => run(() => api("/ai/tools/clash-matrix", { body: f }))}>{busy ? "Building…" : "Build clash matrix"}</button></div>
      </div>
      {busy && <Busy text="Building the test matrix and tolerances…" />}
      {!!tests.length && <>
        <div className="card table-wrap"><b>Matrix (tolerance mm · priority)</b>
          <table className="data" style={{ marginTop: 8 }}><thead><tr><th />{f.disciplines.map((d) => <th key={d} className="small">{d}</th>)}</tr></thead>
            <tbody>{f.disciplines.map((a, i) => <tr key={a}><th className="small">{a}</th>{f.disciplines.map((b, j) => { const t = j >= i ? pair(a, b) : undefined; return <td key={b} className="small" style={{ textAlign: "center", color: t ? (t.priority === "High" ? "var(--danger)" : t.priority === "Medium" ? "var(--warn)" : "var(--ok)") : "var(--muted)" }}>{t ? `${t.tolerance} · ${t.priority[0]}` : j >= i ? "—" : ""}</td>; })}</tr>)}</tbody></table>
        </div>
        <div className="card table-wrap">
          <div className="row spread"><h3 style={{ margin: 0 }}>Clash tests ({tests.length})</h3>
            <button onClick={() => exportCsv("clash-matrix", ["Code", "Selection A", "Selection B", "Type", "Tolerance (mm)", "Priority", "Frequency", "Notes"], tests.map((t) => [t.code, t.a, t.b, t.type, String(t.tolerance), t.priority, t.frequency, t.notes]))}>CSV</button></div>
          <table className="data"><thead><tr><th>Code</th><th>A vs B</th><th>Type</th><th>Tol. mm</th><th>Priority</th><th>Frequency</th><th>Notes</th></tr></thead>
            <tbody>{tests.map((t) => <tr key={t.code}><td>{t.code}</td><td>{t.a} vs {t.b}</td><td>{t.type}</td><td>{t.tolerance}</td><td>{t.priority}</td><td className="small">{t.frequency}</td><td className="small">{t.notes}</td></tr>)}</tbody></table>
        </div>
        {!!result?.guidance.length && <div className="card"><b>Running and reporting</b><ul>{result.guidance.map((g, i) => <li key={i}>{g}</li>)}</ul></div>}
      </>}
    </div>
  );
}

// ---------------------------------------------------------------- Suitability codes

type Q = { q: string; options: { label: string; next?: Q; code?: string }[] };
const WIZARD: Q = {
  q: "What is the current status of this information?",
  options: [
    { label: "Still being worked on — not ready for sharing", code: "S0" },
    { label: "Ready to share with others in the delivery team or appointing party", next: {
      q: "What will the recipients do with it?",
      options: [
        { label: "Coordinate their own models / design against it", code: "S1" },
        { label: "Use it for information only", code: "S2" },
        { label: "Review it and return comments", code: "S3" },
        { label: "Approve it at the end of a stage", code: "S4" },
        { label: "Authorize it as part of the PIM for acceptance", code: "S6" },
        { label: "Authorize it as part of the AIM (operational phase)", code: "S7" },
      ] } },
    { label: "It has been authorized and accepted by the appointing party", next: {
      q: "How was it accepted?",
      options: [
        { label: "Fully accepted for the stage", code: "A1–An" },
        { label: "Accepted with comments to be addressed", code: "B1–Bn" },
        { label: "It records the as-constructed condition", code: "CR" },
      ] } },
  ],
};

function SuitabilityTool({ ai }: { ai: boolean }) {
  const [path, setPath] = useState<number[]>([]);
  let node = WIZARD; let code: string | undefined;
  for (const i of path) { const o = node.options[i]; if (o.next) node = o.next; else code = o.code; }
  const hit = suitabilityCodes.find((c) => c.code === code);
  const [situation, setSituation] = useState("");
  const { busy, result, run } = useRun<{ code: string; state: string; explanation: string; nextStep: string; alternatives: { code: string; when: string }[]; cautions: string[] }>();
  return (
    <div className="grid g2" style={{ alignItems: "start" }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div className="card">
          <b>Quick wizard</b>
          {!code ? <><p>{path.length + 1}. {node.q}</p>
            <div style={{ display: "grid", gap: 6 }}>{node.options.map((o, i) => <button key={i} style={{ textAlign: "start" }} onClick={() => setPath([...path, i])}>{o.label}</button>)}</div></>
            : <div style={{ marginTop: 10 }}><div className="code">{code}</div><p><b>{hit?.desc}</b> — CDE state {hit?.state}.</p></div>}
          {!!path.length && <button className="ghost small" style={{ marginTop: 8 }} onClick={() => setPath([])}>Start again</button>}
        </div>
        {ai && <div className="card" style={{ display: "grid", gap: 8 }}>
          <b>AI advisor for complex situations</b>
          <textarea value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="e.g. Structural engineer is issuing a federated model to the contractor for temporary works design while the stage 4 approval is still pending…" style={{ minHeight: 100 }} />
          <div><button className="primary" disabled={busy || situation.trim().length < 10} onClick={() => run(() => api("/ai/tools/suitability", { body: { situation } }))}>{busy ? "Thinking…" : "Advise"}</button></div>
          {result && <div>
            <div className="row"><div className="code">{result.code || "?"}</div><span className="badge">{result.state}</span></div>
            <p style={{ whiteSpace: "pre-wrap" }}>{result.explanation}</p>
            {result.nextStep && <p><b>Next step:</b> {result.nextStep}</p>}
            {!!result.alternatives.length && <><b>Alternatives</b><ul>{result.alternatives.map((a) => <li key={a.code}><b>{a.code}</b> — {a.when}</li>)}</ul></>}
            {!!result.cautions.length && <><b>Cautions</b><ul>{result.cautions.map((c, i) => <li key={i}>{c}</li>)}</ul></>}
          </div>}
        </div>}
      </div>
      <div className="card"><b>Quick reference</b>
        <table className="data" style={{ marginTop: 8 }}><tbody>{suitabilityCodes.map((c) => <tr key={c.code} style={c.code === code || c.code === result?.code ? { background: "var(--surface-2)" } : undefined}><td><b>{c.code}</b></td><td>{c.desc}</td><td className="small muted">{c.state}</td></tr>)}</tbody></table>
        <p className="small muted">Code set per the UK National Annex to ISO 19650-2. Your project's information standard may define its own codes.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- COBie checker

interface CobieResult {
  report: { score: number; sheets: { name: string; rows: number; present: boolean; errors: number; warnings: number }[]; stats: Record<string, number>; findings: { severity: string; area: string; message: string }[] } | null;
  readiness: string; summary: string; priorities: { priority: string; sheet: string; issue: string; fix: string; owner: string }[]; goodPractice: string[];
}

function CobieTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [stage, setStage] = useState("Handover / practical completion");
  const { busy, result, run } = useRun<CobieResult>();
  const go = () => run(() => { const form = new FormData(); form.set("stage", stage); if (file) form.set("file", file); else form.set("text", text); return api<CobieResult>("/ai/tools/cobie", { form }); });
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card" style={{ display: "grid", gap: 8 }}>
        <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {!file && <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="…or paste COBie sheet data (Facility, Floor, Space, Type, Component, System…) copied from Excel" style={{ minHeight: 120 }} />}
        <div className="row">
          <select value={stage} onChange={(e) => setStage(e.target.value)} style={{ width: "auto" }}>{["Stage 2 — Concept", "Stage 3 — Spatial coordination", "Stage 4 — Technical design", "Stage 5 — Construction", "Handover / practical completion"].map((s) => <option key={s}>{s}</option>)}</select>
          <button className="primary" disabled={busy || (!file && !text.trim())} onClick={go}>{busy ? "Checking…" : "Check COBie data"}</button>
          <span className="small muted">Workbooks get the built-in rule checks first; AI then prioritises fixes.</span>
        </div>
      </div>
      {busy && <Busy text="Checking sheets, cross-references and mandatory fields…" />}
      {result && <>
        <div className="grid g4">
          <div className="card"><div className="muted small">Readiness</div><b style={{ color: sevColor(result.readiness) }}>{result.readiness}</b></div>
          {result.report && <div className="card"><div className="muted small">Rule score</div><div className="stat">{result.report.score}</div></div>}
          {result.report && Object.entries(result.report.stats).slice(0, 2).map(([k, v]) => <div key={k} className="card"><div className="muted small">{k}</div><div className="stat">{v}</div></div>)}
        </div>
        <div className="card"><p style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>{result.summary}</p>
          {!!result.goodPractice.length && <><b>Good practice</b><ul>{result.goodPractice.map((g, i) => <li key={i}>{g}</li>)}</ul></>}</div>
        {!!result.priorities.length && <div className="card table-wrap">
          <div className="row spread"><h3 style={{ margin: 0 }}>Prioritised fixes</h3>
            <button onClick={() => exportCsv("cobie-fixes", ["Priority", "Sheet", "Issue", "Fix", "Owner"], result.priorities.map((p) => [p.priority, p.sheet, p.issue, p.fix, p.owner]))}>CSV</button></div>
          <table className="data"><thead><tr><th>Priority</th><th>Sheet</th><th>Issue</th><th>Fix</th><th>Owner</th></tr></thead>
            <tbody>{result.priorities.map((p, i) => <tr key={i}><td><Pill text={p.priority} /></td><td>{p.sheet}</td><td>{p.issue}</td><td className="small">{p.fix}</td><td className="small">{p.owner}</td></tr>)}</tbody></table>
        </div>}
        {result.report && <div className="card table-wrap"><b>Sheets</b>
          <table className="data" style={{ marginTop: 8 }}><thead><tr><th>Sheet</th><th>Rows</th><th>Errors</th><th>Warnings</th></tr></thead>
            <tbody>{result.report.sheets.map((s) => <tr key={s.name}><td>{s.name}{!s.present && <span className="small danger"> missing</span>}</td><td>{s.rows}</td><td>{s.errors}</td><td>{s.warnings}</td></tr>)}</tbody></table></div>}
      </>}
    </div>
  );
}

// ---------------------------------------------------------------- Ask AI about a part (used by the parts hub)

export function AskPartChat({ partId, hubId, partLabel, suggestions }: { partId?: string; hubId?: string; partLabel: string; suggestions: string[] }) {
  const { toast } = useSession();
  const ai = useAiEnabled();
  const [turns, setTurns] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { setTurns([]); }, [partId, hubId]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [turns]);
  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next = [...turns, { role: "user" as const, content: text.trim() }];
    setTurns(next); setQ(""); setBusy(true);
    try {
      const r = await api<{ answer: string; truncated: boolean }>(hubId ? "/ai/tools/ask-hub" : "/ai/tools/ask-part", { body: { ...(hubId ? { hubId } : { partId }), messages: next.slice(-10) } });
      setTurns([...next, { role: "assistant", content: r.answer }]);
    } catch (e) { toast((e as Error).message, "error"); setTurns(turns); setQ(text); } finally { setBusy(false); }
  };
  if (ai === false) return <AiOff />;
  return (
    <div className="chat">
      <div className="chat-log" style={{ maxHeight: 420 }}>
        {!turns.length && <div className="row">{suggestions.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}</div>}
        {turns.map((t, i) => <div key={i} className={"bubble " + t.role}>{t.role === "user" ? t.content : <Markdown text={t.content} />}</div>)}
        {busy && <div className="bubble assistant muted">Thinking…</div>}
        <div ref={end} />
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); send(q); }}>
        <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Ask about ${partLabel}…`} style={{ minHeight: 44, flex: 1 }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(q); } }} />
        <button className="primary" disabled={busy || !q.trim()}>Ask</button>
        {!!turns.length && <button type="button" className="ghost" onClick={() => setTurns([])}>New chat</button>}
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- Page

/** Link that opens the generator with a document type filled in. */
export const generateHref = (docType: string) => `#/ai-tools/generate/${encodeURIComponent(docType)}`;

export default function AiTools({ tool, arg }: { tool?: string; arg?: string }) {
  const cur = AI_TOOLS.find((t) => t.id === tool) ?? AI_TOOLS[0];
  const ai = useAiEnabled();
  return (
    <div className="hub" style={{ "--hub": "#7c3aed" } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">AI TOOLS · ISO 19650</div><h1>{cur.label}</h1><p>{cur.hint}</p>
        <div className="facts"><span>Powered by Claude</span><span>Review-first: you stay accountable</span><span>Export to Word / CSV</span></div></div>
      <div className="hub-tabs">{AI_TOOLS.map((t) => <a key={t.id} className={cur.id === t.id ? "on" : ""} href={`#/ai-tools/${t.id}`}>{t.label}</a>)}</div>
      <div>{ai === null ? <div className="muted">Loading…</div>
        : cur.id === "suitability" ? <SuitabilityTool ai={ai} />
          : !ai ? <AiOff />
            : cur.id === "review" ? <ReviewTool /> : cur.id === "generate" ? <GenerateTool key={arg ?? ""} initial={arg ? decodeURIComponent(arg) : ""} /> : cur.id === "risks" ? <RiskTool /> : cur.id === "clash" ? <ClashTool /> : <CobieTool />}</div>
    </div>
  );
}
