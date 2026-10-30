import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSession } from "../App";
import { DocMarkdown } from "../components/DocMarkdown";
import { api } from "../lib/api";
import { exportCsv } from "../lib/export";
import { saveMarkdownDocx, type DocMeta } from "../lib/mdDocx";
import { placeholders } from "../../../shared/mdBlocks";
import { docDataText } from "../../../shared/docData";
import { DocDataPanel, useDocData } from "../components/DocDataPanel";
import { markGenerated } from "../lib/projectStore";
import { projectDataText } from "../../../shared/projectData";
import { ProjectDataGate, useGenerationReady } from "./ProjectData";

// AI document generator (outline → section-by-section drafting) and AI document review (compliance matrix).

const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="small" style={{ display: "grid", gap: 4, fontWeight: 400, margin: 0 }}><span className="muted">{label}</span>{children}</label>;
const tone = (s: string) => (["critical", "missing", "Not fit for purpose"].includes(s) ? "var(--danger)" : ["major", "partial", "Major revisions", "changed"].includes(s) ? "var(--warn)" : ["minor", "Minor revisions"].includes(s) ? "#3b82f6" : "var(--ok)");
const Pill = ({ text }: { text: string }) => <span className="badge" style={{ color: tone(text), borderColor: tone(text), background: "transparent", textTransform: "capitalize" }}>{text}</span>;
const slug = (s: string) => s.replace(/[^\w-]+/g, "-").replace(/-+/g, "-").slice(0, 60);
const load = <T,>(k: string): T | null => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : null; } catch { return null; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or unavailable */ } };

function useElapsed(active: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => { if (!active) return; setS(0); const t = setInterval(() => setS((x) => x + 1), 1000); return () => clearInterval(t); }, [active]);
  return { seconds: s, label: s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s` };
}

// ================================================================ Document generator

const QUICK: { group: string; docs: string[] }[] = [
  { group: "Information requirements", docs: ["Organisational Information Requirements (OIR)", "Asset Information Requirements (AIR)", "Project Information Requirements (PIR)", "Exchange Information Requirements (EIR)"] },
  { group: "Execution plans", docs: ["Pre-appointment BIM Execution Plan", "Post-appointment BIM Execution Plan", "Mobilisation plan", "Information production methods and procedures"] },
  { group: "CDE & protocols", docs: ["CDE procedure and workflow", "Information protocol", "Project information standard", "Information production methods and procedures"] },
  { group: "Data & compliance", docs: ["COBie data requirements schedule", "Level of information need specification", "Security management plan (ISO 19650-5)", "Health and safety information requirements (ISO 19650-6)"] },
  { group: "Risk & handover", docs: ["Information delivery risk register", "Information handover strategy", "Capability and capacity assessment", "Lessons learned report"] },
];

interface Brief { docType: string; projectName: string; organisation: string; appointingParty: string; stage: string; brief: string; style: "draft" | "template" }
interface Sec { title: string; purpose: string; contents: string[]; clauses: string[]; on: boolean }
interface Outline { title: string; source: "template" | "ai"; templateCode?: string; clauses: string[]; sections: Sec[] }
interface Draft { status: "wait" | "busy" | "done" | "error"; md: string; error?: string }
interface GenState { f: Brief; outline: Outline | null; drafts: Draft[] }
const KEY = "bim:gen:last";
const CONCURRENCY = 3;

export function GenerateTool({ initial = "" }: { initial?: string }) {
  const { toast } = useSession();
  const saved = load<GenState>(KEY);
  const fresh: Brief = { docType: initial, projectName: "", organisation: "", appointingParty: "", stage: "", brief: "", style: "draft" };
  const [f, setF] = useState<Brief>(() => (initial ? { ...(saved?.f ?? fresh), docType: initial } : saved?.f ?? fresh));
  const [outline, setOutline] = useState<Outline | null>(() => (initial && saved?.f.docType !== initial ? null : saved?.outline ?? null));
  const [drafts, setDrafts] = useState<Draft[]>(() => (initial && saved?.f.docType !== initial ? [] : (saved?.drafts ?? []).map((d) => (d.status === "busy" ? { ...d, status: "wait" } : d))));
  const [group, setGroup] = useState(0);
  const [planning, setPlanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [redo, setRedo] = useState<{ i: number; text: string } | null>(null);
  const draftsRef = useRef(drafts); draftsRef.current = drafts;
  const elapsed = useElapsed(running || planning).label;
  const set = (k: keyof Brief) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { save(KEY, { f, outline, drafts } satisfies GenState); }, [f, outline, drafts]);
  // controlled document data (project, reference, version, organisation, role, stage, status, prepared by) is required first
  const code = /(([A-Z][A-Z-]{1,8}))/.exec(f.docType)?.[1];
  const doc = useDocData(code);
  // the hard minimum and this document's own inputs (common project data, entered once) are required too
  const gen = useGenerationReady(f.docType);
  const ready = doc.ready && gen.ready;
  const req = { ...f, projectName: doc.d.projectName, organisation: doc.d.organisation, appointingParty: doc.d.appointingParty, stage: doc.d.stage, docData: docDataText(doc.d), projectData: projectDataText(gen.p, gen.kind) };

  const active = outline?.sections.filter((s) => s.on) ?? [];
  const done = drafts.filter((d) => d.status === "done").length;
  const assembled = outline ? [`# ${outline.title}`, ...drafts.map((d, i) => d.status === "done" ? d.md : d.status === "error" ? `## ${i + 1} ${active[i]?.title}\n\n> This section could not be drafted: ${d.error}. Use Redo to try again.` : `## ${i + 1} ${active[i]?.title}\n\n> Drafting this section…`)].join("\n\n") : "";
  const finished = outline && drafts.length > 0 && drafts.every((d) => d.status === "done" || d.status === "error");
  const toConfirm = finished ? [...new Set(placeholders(assembled))] : [];

  const plan = async () => {
    setPlanning(true);
    try {
      const r = await api<Omit<Outline, "sections"> & { sections: Omit<Sec, "on">[] }>("/ai/tools/generate/outline", { body: req });
      setOutline({ ...r, sections: r.sections.map((s) => ({ ...s, on: true })) }); setDrafts([]);
    } catch (e) { toast((e as Error).message, "error"); } finally { setPlanning(false); }
  };

  const draftOne = async (i: number, sections: Sec[], instruction = "") => {
    setDrafts((d) => d.map((x, j) => (j === i ? { ...x, status: "busy", error: undefined } : x)));
    try {
      const s = sections[i];
      const r = await api<{ markdown: string }>("/ai/tools/generate/section", { body: { ...req, title: outline!.title, index: i, outline: sections.map((x) => x.title), section: { title: s.title, purpose: s.purpose, contents: s.contents, clauses: s.clauses }, instruction } });
      setDrafts((d) => d.map((x, j) => (j === i ? { status: "done", md: r.markdown } : x)));
    } catch (e) { setDrafts((d) => d.map((x, j) => (j === i ? { ...x, status: "error", error: (e as Error).message } : x))); }
  };

  const draftAll = async () => {
    const sections = active;
    const start = draftsRef.current.length === sections.length ? draftsRef.current : sections.map((): Draft => ({ status: "wait", md: "" }));
    setDrafts(start);
    setRunning(true);
    const queue = start.map((d, i) => (d.status === "done" ? -1 : i)).filter((i) => i >= 0);
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (queue.length) await draftOne(queue.shift()!, sections); }));
    setRunning(false);
  };

  const meta = (): DocMeta => ({ title: outline?.title ?? f.docType, project: doc.d.projectName, organisation: doc.d.organisation, orgRole: doc.d.orgRole, appointingParty: doc.d.appointingParty, reference: doc.d.reference, revision: doc.d.version, status: doc.d.status, stage: doc.d.stage, date: doc.d.issueDate || undefined, preparedBy: doc.d.preparedBy, checkedBy: doc.d.checkedBy, approvedBy: doc.d.approvedBy, security: doc.d.security });
  const editSec = (i: number, patch: Partial<Sec>) => outline && setOutline({ ...outline, sections: outline.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const startOver = () => { setOutline(null); setDrafts([]); };

  const step = !outline ? 1 : !drafts.length ? 2 : finished ? 4 : 3;
  const STEPS = ["Describe the document", "Check the outline", "Draft section by section", "Review and export"];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="hub-tile small">Writing a full EIR and AIR, or a BEP that answers a client's EIR? The AI studio has dedicated tools: <a href="#/ai-studio/eir-writer">EIR writer</a> · <a href="#/ai-studio/bep-writer">BEP from EIR</a>.</div>
      <div className="row">{STEPS.map((s, i) => <span key={s} className="chip" style={i + 1 === step ? { background: "var(--hub)", color: "#fff" } : i + 1 < step ? { color: "var(--ok)" } : undefined}>{i + 1 < step ? "✓" : i + 1}. {s}</span>)}</div>

      {!outline && <ProjectDataGate docType={f.docType} what={f.docType || "this document"} />}
      {!outline && <DocDataPanel data={doc} what="generating the document" code={code} />}
      {!outline && <div className="hub-card" style={{ display: "grid", gap: 10 }}>
        <div className="row spread"><b>Which ISO 19650 document do you need?</b>
          <div className="seg"><button className={f.style === "draft" ? "on" : ""} onClick={() => setF({ ...f, style: "draft" })}>Project draft</button><button className={f.style === "template" ? "on" : ""} onClick={() => setF({ ...f, style: "template" })}>Reusable template</button></div></div>
        <div className="row">{QUICK.map((q, i) => <button key={q.group} className={"chip" + (group === i ? " on" : "")} onClick={() => setGroup(i)}>{q.group}</button>)}</div>
        <div className="row">{QUICK[group].docs.map((d) => <button key={d} className="small" style={f.docType === d ? { borderColor: "var(--hub)", color: "var(--hub)", fontWeight: 600 } : undefined} onClick={() => setF({ ...f, docType: d })}>{d}</button>)}</div>
        <div className="grid g2">
          <Field label="Document type *"><input value={f.docType} onChange={set("docType")} placeholder="e.g. Information delivery risk register" /></Field>
        </div>
        <Field label="Project facts and requirements (the more you give, the less is marked [CONFIRM])"><textarea value={f.brief} onChange={set("brief")} placeholder="e.g. 12,000 m² clinic, D&B, ACC as CDE, Uniclass 2015, IFC 4 Reference View, COBie at stages 4 and 6, client FM system Planon, 4 task teams…" style={{ minHeight: 90 }} /></Field>
        <div className="row"><button className="primary" disabled={planning || f.docType.trim().length < 2 || !ready} onClick={plan}>{planning ? `Planning the outline… ${elapsed}` : "Plan the document →"}</button>
          <span className="small muted">{ready ? "You'll check the outline before anything is drafted." : !gen.ready ? "Complete the project data hard minimum and this document's required inputs first." : "Complete the required document data above first."}</span></div>
      </div>}

      {outline && !drafts.length && <div className="hub-card" style={{ display: "grid", gap: 10 }}>
        <div className="row spread"><div><b style={{ fontSize: 16 }}>{outline.title}</b>
          <div className="small muted">{outline.source === "template" ? `Structure from the portal's ${outline.templateCode} template` : "Structure proposed by AI"} · {active.length} of {outline.sections.length} sections selected{outline.clauses.length ? ` · ${outline.clauses.join(", ")}` : ""}</div></div>
          <button className="ghost" onClick={startOver}>← Change the brief</button></div>
        <div style={{ display: "grid", gap: 6 }}>{outline.sections.map((s, i) => (
          <div key={i} className="hub-tile" style={{ "--c": s.on ? "var(--hub)" : "var(--muted)", opacity: s.on ? 1 : 0.55, display: "grid", gap: 4 } as CSSProperties}>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input type="checkbox" checked={s.on} onChange={(e) => editSec(i, { on: e.target.checked })} style={{ width: "auto" }} />
              <span className="small muted" style={{ minWidth: 22 }}>{outline.sections.slice(0, i + 1).filter((x) => x.on).length || "–"}</span>
              <input value={s.title} onChange={(e) => editSec(i, { title: e.target.value })} style={{ fontWeight: 600 }} />
            </div>
            <div className="small muted" style={{ paddingInlineStart: 52 }}>{s.contents.slice(0, 6).join(" · ")}{s.contents.length > 6 ? " …" : ""}</div>
          </div>))}</div>
        <div className="row">
          <button onClick={() => outline && setOutline({ ...outline, sections: [...outline.sections, { title: "New section", purpose: "", contents: [], clauses: outline.clauses, on: true }] })}>+ Add a section</button>
          <button className="primary" disabled={!active.length || !ready} onClick={draftAll}>Draft {active.length} sections →</button>
          <span className="small muted">Sections are drafted {CONCURRENCY} at a time; you can watch them appear.</span>
        </div>
      </div>}

      {outline && drafts.length > 0 && <div className="grid" style={{ gridTemplateColumns: "minmax(240px, 320px) minmax(0, 1fr)", alignItems: "start", gap: 14 }}>
        <div className="hub-card" style={{ display: "grid", gap: 8, position: "sticky", top: 8 }}>
          <b>{finished ? "Draft ready" : `Drafting… ${elapsed}`}</b>
          <div className="progress"><div style={{ width: `${Math.round((done / drafts.length) * 100)}%`, background: "var(--ok)" }} /></div>
          <div className="small muted">{done} of {drafts.length} sections drafted</div>
          <div className="gen-steps">{drafts.map((d, i) => (
            <div key={i} className={"gen-step " + d.status} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8 }}>
              <span className="gen-dot">{d.status === "done" ? "✓" : d.status === "error" ? "!" : i + 1}</span>
              <span className="small">{active[i]?.title}{d.status === "error" && <div className="small" style={{ color: "var(--danger)" }}>{d.error}</div>}</span>
              {(d.status === "done" || d.status === "error") && !running && <button className="ghost small" onClick={() => setRedo({ i, text: "" })}>Redo</button>}
            </div>))}</div>
          {redo && <div className="hub-tile" style={{ "--c": "var(--hub)", display: "grid", gap: 6 } as CSSProperties}>
            <b className="small">Redo section {redo.i + 1}</b>
            <textarea value={redo.text} onChange={(e) => setRedo({ ...redo, text: e.target.value })} placeholder="Optional: what should change? e.g. add a RACI table, shorter, use our naming convention…" style={{ minHeight: 60 }} />
            <div className="row"><button className="primary small" onClick={() => { const r = redo; setRedo(null); void draftOne(r.i, active, r.text); }}>Redo now</button><button className="ghost small" onClick={() => setRedo(null)}>Cancel</button></div>
          </div>}
          {finished && <>
            <button className="primary" disabled={!ready} onClick={() => { void saveMarkdownDocx(assembled, slug(outline.title), meta()); markGenerated(gen.kind); }}>Download Word (.docx)</button>
            <div className="row">
              <button className="small" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([assembled], { type: "text/markdown" })); a.download = slug(outline.title) + ".md"; a.click(); }}>Markdown</button>
              <button className="small" onClick={() => { void navigator.clipboard?.writeText(assembled); toast("Copied."); }}>Copy</button>
              <button className="ghost small" onClick={startOver}>New document</button>
            </div>
            {toConfirm.length > 0 && <div className="hub-tile" style={{ "--c": "#ca8a04" } as CSSProperties}>
              <b className="small">{toConfirm.length} item{toConfirm.length > 1 ? "s" : ""} to confirm</b>
              <div className="small muted">Highlighted in yellow in the draft and in Word.</div>
              <ul className="small" style={{ margin: "4px 0 0", maxHeight: 160, overflow: "auto" }}>{toConfirm.slice(0, 30).map((p) => <li key={p}>{p}</li>)}</ul>
            </div>}
          </>}
          {!running && !finished && <button className="primary" onClick={draftAll}>Continue drafting</button>}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="hub-tile row spread" style={{ "--c": "var(--hub)", marginBottom: 10 } as CSSProperties}>
            <span className="small"><b>{outline.title}</b> · {doc.d.projectName}{doc.d.appointingParty && ` · for ${doc.d.appointingParty}`} · <span className="no-i18n">{doc.d.reference}</span></span>
            <span className="small muted">{doc.d.version} · {doc.d.status}</span>
          </div>
          <DocMarkdown text={assembled} />
        </div>
      </div>}
    </div>
  );
}

// ================================================================ Document review & compare

interface Finding { severity: string; section: string; clause: string; issue: string; evidence: string; recommendation: string }
interface Coverage { item: string; status: string; evidence: string; action: string }
interface Review { docType: string; score: number; verdict: string; coveragePct: number; summary: string; strengths: string[]; missing: string[]; findings: Finding[]; coverage: Coverage[] }

function DocInput({ label, file, setFile, text, setText }: { label: string; file: File | null; setFile: (f: File | null) => void; text: string; setText: (t: string) => void }) {
  return (
    <div className="hub-card" style={{ display: "grid", gap: 8 }}>
      <b>{label}</b>
      <input type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      {file ? <div className="small muted">{file.name} · {(file.size / 1024).toFixed(0)} KB <button className="ghost small" onClick={() => setFile(null)}>Remove</button></div>
        : <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="…or paste the document text here" style={{ minHeight: 140 }} />}
    </div>
  );
}

const REVIEW_TYPES = ["auto", "Exchange Information Requirements (EIR)", "Asset Information Requirements (AIR)", "Organisational Information Requirements (OIR)", "Pre-appointment BIM Execution Plan", "Post-appointment BIM Execution Plan", "Project information standard", "Information protocol", "CDE procedure and workflow", "Security management plan (ISO 19650-5)", "Capability and capacity assessment", "Information handover strategy", "Mobilisation plan"];

export function ReviewTool() {
  const { toast } = useSession();
  const [mode, setMode] = useState<"single" | "eir-bep" | "bep-versions">("single");
  const [docType, setDocType] = useState("auto");
  const [fa, setFa] = useState<File | null>(null); const [ta, setTa] = useState("");
  const [fb, setFb] = useState<File | null>(null); const [tb, setTb] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Review | null>(null);
  const timer = useElapsed(busy);
  const elapsed = timer.label;
  const go = async () => {
    setBusy(true); setResult(null);
    try {
      const form = new FormData();
      form.set("mode", mode); form.set("docType", docType);
      if (fa) form.set("fileA", fa); else form.set("textA", ta);
      if (mode !== "single") { if (fb) form.set("fileB", fb); else form.set("textB", tb); }
      setResult(await api<Review>("/ai/tools/review", { form }));
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const labels = mode === "eir-bep" ? ["EIR", "BEP"] : mode === "bep-versions" ? ["Previous BEP", "Revised BEP"] : ["Document to review"];
  const stages = ["Reading the document", mode === "single" ? "Checking every required section of this document type" : mode === "eir-bep" ? "Matching each EIR requirement to the BEP" : "Comparing the two versions", "Writing findings and fixes"];
  const at = busy ? Math.min(2, Math.floor(timer.seconds / 25)) : -1;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="row">
        <div className="seg">{([["single", "Single document review"], ["eir-bep", "EIR ↔ BEP compliance"], ["bep-versions", "BEP version compare"]] as const).map(([k, l]) => <button key={k} className={mode === k ? "on" : ""} onClick={() => { setMode(k); setResult(null); }}>{l}</button>)}</div>
        {mode === "eir-bep" && <div className="hub-tile small" style={{ flexBasis: "100%" }}>For a requirement-by-requirement matrix with suggested BEP wording and an addendum, use the <a href="#/ai-studio/compliance">EIR ↔ BEP compliance matrix</a> in the AI studio.</div>}
        {mode === "single" && <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ width: "auto" }}>
          {REVIEW_TYPES.map((d) => <option key={d} value={d}>{d === "auto" ? "Auto-detect document type" : d}</option>)}</select>}
      </div>
      <div className="grid g2">
        <DocInput label={labels[0]} file={fa} setFile={setFa} text={ta} setText={setTa} />
        {mode !== "single" && <DocInput label={labels[1]} file={fb} setFile={setFb} text={tb} setText={setTb} />}
      </div>
      <div className="row"><button className="primary" disabled={busy || (!fa && !ta.trim()) || (mode !== "single" && !fb && !tb.trim())} onClick={go}>{busy ? `Reviewing… ${elapsed}` : "Run compliance review"}</button>
        <span className="small muted">PDF, DOCX or TXT up to 25 MB. Decision support for an accountable reviewer — it does not approve or certify a document.</span></div>
      {busy && <div className="hub-card gen-steps">{stages.map((s, i) => <div key={s} className={"gen-step " + (i < at ? "done" : i === at ? "busy" : "")}><span className="gen-dot">{i < at ? "✓" : i + 1}</span><span className="small">{s}</span></div>)}
        <div className="small muted">A full review usually takes 1–2 minutes.</div></div>}
      {result && <ReviewResult r={result} mode={mode} />}
    </div>
  );
}

function reportMarkdown(r: Review, mode: string) {
  const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    `# Document review report`,
    `**Document type:** ${r.docType || "—"}  `, ``,
    `| Score | Verdict | Requirement coverage | Critical | Major | Minor |`, `|---|---|---|---|---|---|`,
    `| ${r.score}/100 | ${r.verdict} | ${r.coveragePct}% | ${r.findings.filter((f) => f.severity === "critical").length} | ${r.findings.filter((f) => f.severity === "major").length} | ${r.findings.filter((f) => f.severity === "minor").length} |`, ``,
    `## 1 Summary`, r.summary, ``,
    ...(r.strengths.length ? [`## 2 Strengths`, ...r.strengths.map((s) => `- ${s}`), ``] : []),
    `## 3 ${mode === "eir-bep" ? "EIR requirement coverage" : mode === "bep-versions" ? "Changes between versions" : "Compliance matrix"}`,
    `| # | Requirement | Status | Evidence | Action |`, `|---|---|---|---|---|`,
    ...r.coverage.map((c, i) => `| ${i + 1} | ${esc(c.item)} | ${c.status} | ${esc(c.evidence)} | ${esc(c.action)} |`), ``,
    `## 4 Findings`,
    `| # | Severity | Section | Clause | Issue | Recommendation |`, `|---|---|---|---|---|---|`,
    ...r.findings.map((f, i) => `| ${i + 1} | ${f.severity} | ${esc(f.section)} | ${esc(f.clause)} | ${esc(f.issue)}${f.evidence ? ` — "${esc(f.evidence)}"` : ""} | ${esc(f.recommendation)} |`), ``,
    `> This review is decision support produced with AI. It does not approve, certify or accept the document; the accountable reviewer must confirm each finding.`,
  ].join("\n");
}

function ReviewResult({ r, mode }: { r: Review; mode: string }) {
  const [cov, setCov] = useState("");
  const [sev, setSev] = useState("");
  const counts = (s: string) => r.coverage.filter((c) => c.status === s).length;
  const fc = (s: string) => r.findings.filter((f) => f.severity === s).length;
  const ring = tone(r.verdict);
  const total = Math.max(1, r.coverage.length);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="hub-card row" style={{ gap: 20, alignItems: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: `conic-gradient(${ring} ${r.score * 3.6}deg, var(--surface-2) 0)`, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <div style={{ width: 74, height: 74, borderRadius: "50%", background: "var(--surface)", display: "grid", placeItems: "center", textAlign: "center" }}><div><b style={{ fontSize: 24, color: ring }}>{r.score}</b><div className="tiny muted">of 100</div></div></div>
        </div>
        <div style={{ flex: 1, minWidth: 220, display: "grid", gap: 6 }}>
          <div className="row"><span className="badge" style={{ background: ring, color: "#fff", borderColor: ring, fontSize: 13 }}>{r.verdict}</span><b>{r.docType || "Document"}</b></div>
          <div className="small muted">Requirement coverage {r.coveragePct}% · {fc("critical")} critical · {fc("major")} major · {fc("minor")} minor findings</div>
          <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "var(--surface-2)" }}>
            {[["met", "var(--ok)"], ["partial", "var(--warn)"], ["missing", "var(--danger)"], ["changed", "#3b82f6"]].map(([s, c]) => counts(s) > 0 && <div key={s} title={`${counts(s)} ${s}`} style={{ width: `${(counts(s) / total) * 100}%`, background: c }} />)}
          </div>
          <div className="row small">{[["met", "Met"], ["partial", "Partly met"], ["missing", "Missing"], ["changed", "Changed"]].map(([s, l]) => counts(s) > 0 && <span key={s} style={{ color: tone(s === "met" ? "ok" : s) }}>● {counts(s)} {l}</span>)}</div>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <button className="primary" onClick={() => saveMarkdownDocx(reportMarkdown(r, mode), "Document-review-report", { title: "Document review report", project: r.docType, status: "Review record" })}>Download report (Word)</button>
          <button className="small" onClick={() => exportCsv("compliance-matrix", ["Requirement", "Status", "Evidence", "Action"], r.coverage.map((c) => [c.item, c.status, c.evidence, c.action]))}>Compliance matrix (CSV)</button>
          <button className="small" onClick={() => exportCsv("review-findings", ["Severity", "Section", "Clause", "Issue", "Evidence", "Recommendation"], r.findings.map((f) => [f.severity, f.section, f.clause, f.issue, f.evidence, f.recommendation]))}>Findings (CSV)</button>
        </div>
      </div>

      <div className="hub-card"><div className="hub-title">Summary</div><p style={{ marginTop: 0, whiteSpace: "pre-wrap" }}>{r.summary}</p>
        {!!r.strengths.length && <><div className="hub-title" style={{ "--c": "var(--ok)" } as CSSProperties}>What is done well</div><ul style={{ margin: 0 }}>{r.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
      </div>

      {!!r.coverage.length && <div className="hub-card" style={{ display: "grid", gap: 8 }}>
        <div className="row spread"><div className="hub-title" style={{ margin: 0 }}>{mode === "eir-bep" ? "EIR requirement coverage" : mode === "bep-versions" ? "Changes between versions" : "Compliance matrix"}</div>
          <div className="row">{[["", "All", r.coverage.length], ["missing", "Missing", counts("missing")], ["partial", "Partly met", counts("partial")], ["met", "Met", counts("met")], ["changed", "Changed", counts("changed")]].filter(([, , n]) => n).map(([s, l, n]) => <button key={String(s)} className={"chip" + (cov === s ? " on" : "")} onClick={() => setCov(String(s))}>{l} {n}</button>)}</div></div>
        <div className="table-wrap"><table className="data hub-table"><thead><tr><th>#</th><th>Requirement</th><th>Status</th><th>Evidence in the document</th><th>Action needed</th></tr></thead>
          <tbody>{r.coverage.map((c, i) => ({ c, i })).filter(({ c }) => !cov || c.status === cov).map(({ c, i }) => <tr key={i}><td className="small muted">{i + 1}</td><td><b style={{ fontWeight: 600 }}>{c.item}</b></td><td><Pill text={c.status} /></td><td className="small muted">{c.evidence ? `“${c.evidence}”` : "—"}</td><td className="small">{c.action || "—"}</td></tr>)}</tbody></table></div>
      </div>}

      {!!r.findings.length && <div className="hub-card" style={{ display: "grid", gap: 8 }}>
        <div className="row spread"><div className="hub-title" style={{ margin: 0 }}>Findings</div>
          <div className="row">{[["", "All", r.findings.length], ["critical", "Critical", fc("critical")], ["major", "Major", fc("major")], ["minor", "Minor", fc("minor")]].filter(([, , n]) => n).map(([s, l, n]) => <button key={String(s)} className={"chip" + (sev === s ? " on" : "")} onClick={() => setSev(String(s))}>{l} {n}</button>)}</div></div>
        {r.findings.filter((f) => !sev || f.severity === sev).map((f, i) => (
          <div key={i} className="hub-tile" style={{ "--c": tone(f.severity), borderInlineStart: `4px solid ${tone(f.severity)}`, display: "grid", gap: 4 } as CSSProperties}>
            <div className="row"><Pill text={f.severity} />{f.section && <span className="small"><b>Where:</b> {f.section}</span>}{f.clause && <span className="badge">{f.clause}</span>}</div>
            <div><b>{f.issue}</b></div>
            {f.evidence && <div className="small muted">“{f.evidence}”</div>}
            {f.recommendation && <div className="small"><b style={{ color: "var(--ok)" }}>Fix:</b> {f.recommendation}</div>}
          </div>))}
      </div>}
    </div>
  );
}
