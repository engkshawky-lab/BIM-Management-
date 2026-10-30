import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ASSESSMENTS, CARBON_MATERIALS, COMPLEXITY, FEE_SERVICES, estimateCarbon, estimateFee, scoreAssessment } from "../../../shared/tools";
import { useSession } from "../App";
import { api, fmtDate, type Project } from "../lib/api";
import { exportCsv } from "../lib/export";
import { activePlan, planSource, refreshProjectPlan, rowName, setPlanSource, updatePlanRow, type PlanSource } from "../lib/planStore";
import { STATUSES, dueBucket, type DueBucket } from "../../../shared/planRows";

// ---------------------------------------------------------------- My Day

interface InboxItem { kind: string; title: string; project: string; due: string; link: string; overdue: boolean }
const KIND_LABEL: Record<string, string> = { review: "Review", container: "Container", issue: "Issue", action: "Action", risk: "Risk review" };

const QUICK: { label: string; text: string; href: string }[] = [
  { label: "Check file names", text: "Paste or drop names; get fixes", href: "/tools/naming-check" },
  { label: "Check a model", text: "Grade an IFC model A–F", href: "/model-tools/qaqc" },
  { label: "Delivery plans", text: "TIDP, MIDP and MPDT", href: "/ai-tools/plans" },
  { label: "Project data", text: "Codes, stages, standards", href: "/project-data" },
];
const BUCKETS: { id: DueBucket; label: string; color: string }[] = [
  { id: "overdue", label: "Overdue", color: "var(--danger)" }, { id: "week", label: "Due in the next 7 days", color: "var(--warn)" },
  { id: "fortnight", label: "Due in 8–14 days", color: "var(--accent)" }, { id: "undated", label: "No due date", color: "var(--muted)" },
];

/** Which plan My Day, the Today card and the checkers use: the plan generator in this browser, or a project's planner. */
function PlanSourcePicker({ onChange }: { onChange: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [src, setSrc] = useState<PlanSource>(() => planSource());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { api<{ projects: Project[] }>("/projects").then((r) => setProjects(r.projects)).catch(() => undefined); }, []);
  const pick = async (v: string) => {
    setErr("");
    if (v === "browser") { const s: PlanSource = { kind: "browser" }; setPlanSource(s); setSrc(s); onChange(); return; }
    const p = projects.find((x) => x.id === v); if (!p) return;
    setBusy(true);
    try { await refreshProjectPlan(p.id, p.code, p.name); const s: PlanSource = { kind: "project", projectId: p.id, code: p.code, name: p.name }; setPlanSource(s); setSrc(s); onChange(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="row small plan-source" style={{ gap: 8, marginBottom: 10 }}>
      <span className="muted">Plan used by My Day, the Today card and the checkers:</span>
      <select value={src.kind === "project" ? src.projectId : "browser"} onChange={(e) => pick(e.target.value)} disabled={busy} style={{ width: "auto" }} aria-label="Plan source">
        <option value="browser">Plan generator (this browser)</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — MIDP / TIDP planner</option>)}
      </select>
      {src.kind === "project" && <button className="ghost small" disabled={busy} onClick={() => pick(src.projectId)}>Refresh</button>}
      {busy && <span className="muted">Loading the project plan…</span>}{err && <span className="error">{err}</span>}
    </div>
  );
}

/** Open containers from the chosen plan, grouped by due date. Browser plans get a one-click status update; project plans are updated in the project. */
function PlanToday() {
  const [plan, setPlan] = useState(() => activePlan());
  const [open, setOpen] = useState<DueBucket | "">("");
  // keep a project plan current: refresh the snapshot each time My Day opens
  useEffect(() => { const src = planSource(); if (src.kind === "project") refreshProjectPlan(src.projectId, src.code, src.name).then(setPlan).catch(() => undefined); }, []);
  const picker = <PlanSourcePicker onChange={() => setPlan(activePlan())} />;
  if (!plan) return (<>
    {picker}
    <div className="card dashed" style={{ marginBottom: 12 }}><b>No delivery plan yet.</b> <span className="muted">Create a TIDP or MIDP in the plan generator, or choose a project above to use its MIDP / TIDP planner. Its containers then appear here every day, sorted by due date.</span> <a href="#/ai-tools/plans">Open the plan generator →</a></div>
  </>);
  const fromProject = !!plan.project;
  const day = new Date().toISOString().slice(0, 10);
  const rows = plan.rows.map((r) => ({ r, b: dueBucket(r, day) })).filter((x) => x.b && x.b !== "later");
  const later = plan.rows.filter((r) => dueBucket(r, day) === "later").length;
  const done = plan.rows.filter((r) => r.status === "Published").length;
  const setStatus = (ref: string, status: string) => { updatePlanRow(plan.kind, ref, { status }); setPlan(activePlan()); };
  const shown = BUCKETS.filter((b) => (open ? b.id === open : b.id !== "undated"));
  return (
    <section style={{ marginBottom: 16 }}>
      {picker}
      <div className="row spread"><h2 style={{ margin: "8px 0" }}>{fromProject ? "Project plan" : plan.kind.toUpperCase()} · {plan.header.projectCode || plan.header.projectName || "Delivery plan"}</h2>
        <span className="small muted">{done} of {plan.rows.length} published · {later} due later</span></div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 10 }}>
        {BUCKETS.map((b) => <button key={b.id} className={"card stat-card" + (open === b.id ? " on" : "")} style={{ textAlign: "start" }} onClick={() => setOpen(open === b.id ? "" : b.id)}>
          <div className="stat" style={{ color: b.color }}>{rows.filter((x) => x.b === b.id).length}</div><div className="small muted">{b.label}</div></button>)}
      </div>
      {shown.map((b) => { const list = rows.filter((x) => x.b === b.id).sort((x, y) => (x.r.due || "").localeCompare(y.r.due || "")); return list.length ? (
        <div key={b.id} className="card" style={{ marginBottom: 10 }}>
          <b style={{ color: b.color }}>{b.label}</b>
          <div className="table-wrap"><table className="data"><tbody>{list.map(({ r }) => (
            <tr key={r.ref} className={b.id === "overdue" ? "late" : ""}>
              <td className="mono small no-i18n nowrap">{rowName(plan, r)}</td>
              <td className="small">{r.title}<div className="tiny muted">{[r.taskTeam, r.responsible, r.milestone].filter(Boolean).join(" · ")}</div></td>
              <td className="small nowrap">{r.due || "—"}</td>
              <td style={{ width: 140 }}>{fromProject ? <span className="small">{r.status}</span> : <select value={r.status} onChange={(e) => setStatus(r.ref, e.target.value)} aria-label="Status">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>}</td>
            </tr>))}</tbody></table></div>
        </div>) : null; })}
      {!rows.some((x) => x.b !== "undated") && !open && <p style={{ color: "var(--ok)" }}>✔ Nothing due in the next 14 days.</p>}
      {rows.some((x) => x.b === "undated") && !open && <div className="hub-tile small" style={{ "--c": "var(--warn)", marginBottom: 8 } as CSSProperties}>Containers without a due date never show as due. Add due dates in the <a href="#/ai-tools/plans">plan generator</a> (the Due column), or set the milestone dates before you load the starter list.</div>}
      {fromProject
        ? <p className="tiny muted">From the project's MIDP / TIDP planner. Change statuses and dates there. <a href={`#/projects/${plan.project!.id}/delivery/plan`}>Open the project planner →</a></p>
        : <p className="tiny muted">Status changes update the {plan.kind.toUpperCase()} saved in this browser. <a href="#/ai-tools/plans">Open the full plan →</a></p>}
    </section>
  );
}

export function MyDay() {
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [kind, setKind] = useState("");
  useEffect(() => { api<{ items: InboxItem[] }>("/me/inbox").then((r) => setItems(r.items)).catch(() => setItems([])); }, []);
  const kinds = [...new Set((items ?? []).map((i) => i.kind))];
  const list = (items ?? []).filter((i) => !kind || i.kind === kind);
  return (
    <>
      <div className="page-head"><h1>My Day</h1><p className="muted">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · What is due from your delivery plan and what is waiting on you in projects.</p></div>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        {QUICK.map((q) => <a key={q.href} href={"#" + q.href} className="card stat-card" style={{ color: "inherit", display: "grid", gap: 2 }}><b style={{ color: "var(--accent)" }}>{q.label} →</b><span className="small muted">{q.text}</span></a>)}
      </div>
      <PlanToday />
      <h2 style={{ margin: "8px 0" }}>Assigned to you in projects</h2>
      {!items ? <p className="muted">Loading…</p> : <>
        {items.length > 0 && <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 12 }}>
          <div className="card"><div className="stat">{items.length}</div><div className="small muted">open items</div></div>
          <div className="card"><div className="stat" style={{ color: "var(--danger)" }}>{items.filter((i) => i.overdue).length}</div><div className="small muted">overdue</div></div>
          {kinds.map((k) => <button key={k} className={"card stat-card" + (kind === k ? " on" : "")} style={{ textAlign: "start" }} onClick={() => setKind(kind === k ? "" : k)}><div className="stat">{items.filter((i) => i.kind === k).length}</div><div className="small muted">{KIND_LABEL[k]}</div></button>)}
        </div>}
        <div className="card">{list.length ? <table className="data"><tbody>{list.map((i, n) => (
          <tr key={n} className={i.overdue ? "late" : ""}><td style={{ width: 110 }}><span className="chip">{KIND_LABEL[i.kind]}</span></td><td><a href={`#${i.link}`}>{i.title}</a></td><td className="small mono">{i.project}</td><td className="small nowrap">{i.due || "—"}{i.overdue && <div className="tiny error">overdue</div>}</td></tr>
        ))}</tbody></table> : <p style={{ color: "var(--ok)" }}>✔ Nothing waiting on you: reviews, issues, meeting actions and risk reviews assigned to you appear here.</p>}</div>
      </>}
    </>
  );
}

// ---------------------------------------------------------------- Portfolio

interface PRow { id: string; code: string; name: string; role: string; stage: string; progress: number; containers: number; overdue: number; openIssues: number; criticalIssues: number; quality: number | null; requirements: number; covered: number; highRisks: number }

export function Portfolio() {
  const [rows, setRows] = useState<PRow[] | null>(null);
  useEffect(() => { api<{ projects: PRow[] }>("/me/portfolio").then((r) => setRows(r.projects)); }, []);
  if (!rows) return <p className="muted">Loading…</p>;
  const health = (r: PRow) => (r.overdue > 0 || r.criticalIssues > 0 || r.highRisks > 0 || (r.quality !== null && r.quality < 60) ? "bad" : r.openIssues > 10 || (r.quality !== null && r.quality < 80) ? "warn" : "good");
  const tone = { good: "var(--ok)", warn: "#38bdf8", bad: "var(--danger)" } as const;
  return (
    <>
      <div className="page-head"><h1>Portfolio dashboard</h1><p className="muted">Information delivery health across all your projects.</p></div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
        <div className="card"><div className="stat">{rows.length}</div><div className="small muted">projects</div></div>
        <div className="card"><div className="stat">{rows.reduce((a, r) => a + r.containers, 0)}</div><div className="small muted">information containers</div></div>
        <div className="card"><div className="stat" style={{ color: "var(--danger)" }}>{rows.reduce((a, r) => a + r.overdue, 0)}</div><div className="small muted">overdue containers</div></div>
        <div className="card"><div className="stat">{rows.reduce((a, r) => a + r.openIssues, 0)}</div><div className="small muted">open issues</div></div>
      </div>
      <div className="card table-wrap"><table className="data">
        <thead><tr><th /><th>Project</th><th>Your role</th><th>Delivery progress</th><th>Overdue</th><th>Open issues</th><th>Model quality</th><th>Requirements delivered</th><th>High risks</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}>
            <td><span title={health(r)} style={{ display: "inline-block", width: 10, height: 10, borderRadius: 5, background: tone[health(r)] }} /></td>
            <td><a href={`#/projects/${r.id}/overview`}><b>{r.code}</b> {r.name}</a><div className="tiny muted">{r.stage}</div></td>
            <td className="small">{r.role}</td>
            <td style={{ minWidth: 160 }}><div className="bar"><span style={{ width: `${r.progress}%` }} /></div><span className="tiny">{r.progress}% of {r.containers}</span></td>
            <td className={r.overdue ? "error" : ""}>{r.overdue}</td>
            <td>{r.openIssues}{r.criticalIssues > 0 && <span className="tiny error"> ({r.criticalIssues} high)</span>}</td>
            <td>{r.quality === null ? <span className="muted">—</span> : `${r.quality}%`}</td>
            <td>{r.requirements ? `${r.covered}/${r.requirements}` : <span className="muted">—</span>}</td>
            <td className={r.highRisks ? "error" : ""}>{r.highRisks}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </>
  );
}

// ---------------------------------------------------------------- Tools

interface Est { id: string; title: string; summary: string; input: Record<string, unknown>; createdAt: string }
/** Save the current estimate to a project, or reload one saved earlier. */
function SaveEstimate<T extends object>({ kind, input, summary, onLoad }: { kind: "fee" | "carbon"; input: T; summary: string; onLoad: (v: T) => void }) {
  const { toast } = useSession();
  const [projects, setProjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [pid, setPid] = useState(""); const [title, setTitle] = useState("");
  const [saved, setSaved] = useState<Est[]>([]);
  useEffect(() => { api<{ projects: { id: string; code: string; name: string }[] }>("/projects").then((r) => { setProjects(r.projects); if (r.projects[0]) setPid(r.projects[0].id); }); }, []);
  const load = () => pid && api<{ estimates: (Est & { kind: string })[] }>(`/projects/${pid}/estimates`).then((r) => setSaved(r.estimates.filter((e) => e.kind === kind)));
  useEffect(() => { load(); }, [pid]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!projects.length) return null;
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="row"><b>Save to project</b>
        <select value={pid} onChange={(e) => setPid(e.target.value)} style={{ width: "auto" }}>{projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select>
        <input placeholder="Title, e.g. Stage 3 estimate" value={title} onChange={(e) => setTitle(e.target.value)} style={{ maxWidth: 260 }} />
        <button className="primary small" disabled={!title} onClick={async () => { try { await api(`/projects/${pid}/estimates`, { body: { kind, title, input, summary } }); toast("Estimate saved to project"); setTitle(""); load(); } catch (e) { toast((e as Error).message, "error"); } }}>Save</button></div>
      {saved.length > 0 && <table className="data" style={{ marginTop: 8 }}><tbody>{saved.map((e) => <tr key={e.id}><td>{e.title}</td><td className="small muted">{e.summary}</td><td className="small">{fmtDate(e.createdAt)}</td>
        <td className="nowrap"><button className="small" onClick={() => onLoad(e.input as T)}>Load</button><button className="ghost tiny danger" onClick={async () => { await api(`/projects/${pid}/estimates/${e.id}`, { method: "DELETE" }); load(); }}>✕</button></td></tr>)}</tbody></table>}
    </div>
  );
}

const money = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

function FeeTool() {
  const [f, setF] = useState({ areaM2: 20000, complexity: "Standard" as keyof typeof COMPLEXITY, services: ["im", "model", "coord", "qa", "cobie"], dayRate: 600, months: 18 });
  const r = estimateFee(f);
  return (
    <>
      <p className="muted">Indicative effort and fee for BIM / information management services, scaled by area and complexity. Adjust rates to your market.</p>
      <div className="card grid g3">
        <div><label>Gross floor area (m²)</label><input type="number" min={0} value={f.areaM2} onChange={(e) => setF({ ...f, areaM2: +e.target.value })} /></div>
        <div><label>Complexity</label><select value={f.complexity} onChange={(e) => setF({ ...f, complexity: e.target.value as keyof typeof COMPLEXITY })}>{Object.keys(COMPLEXITY).map((k) => <option key={k}>{k}</option>)}</select></div>
        <div><label>Day rate</label><input type="number" min={0} value={f.dayRate} onChange={(e) => setF({ ...f, dayRate: +e.target.value })} /></div>
        <div><label>Programme (months)</label><input type="number" min={1} value={f.months} onChange={(e) => setF({ ...f, months: +e.target.value })} /></div>
        <div style={{ gridColumn: "1 / -1" }}><label>Services</label><div className="chips">{FEE_SERVICES.map((s) => <button key={s.id} className={"chip" + (f.services.includes(s.id) ? " on" : "")} onClick={() => setF({ ...f, services: f.services.includes(s.id) ? f.services.filter((x) => x !== s.id) : [...f.services, s.id] })}>{s.label}</button>)}</div></div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <table className="data"><thead><tr><th>Service</th><th>Days</th><th>Fee</th></tr></thead><tbody>
          {r.lines.map((l) => <tr key={l.id}><td>{l.label}</td><td>{l.days}</td><td>{money(l.cost)}</td></tr>)}
          <tr><td><b>Total</b></td><td><b>{r.days}</b></td><td><b>{money(r.cost)}</b></td></tr>
        </tbody></table>
        <p className="small muted">{r.perM2.toFixed(2)} per m² · average {r.fte.toFixed(2)} FTE over {f.months} months</p>
        <SaveEstimate kind="fee" input={f} summary={`${r.days} days · ${money(r.cost)}`} onLoad={(v) => setF(v)} />
        <button onClick={() => exportCsv("bim-fee-estimate", ["Service", "Days", "Fee"], [...r.lines.map((l) => [l.label, String(l.days), String(l.cost)]), ["Total", String(r.days), String(r.cost)]])}>⬇ CSV</button>
      </div>
    </>
  );
}

function CarbonTool() {
  const [gifa, setGifa] = useState(10000);
  const [rows, setRows] = useState<{ materialId: string; qty: number; factor?: number }[]>([{ materialId: "c32", qty: 4000 }, { materialId: "rebar", qty: 480 }, { materialId: "block", qty: 9000 }]);
  const r = estimateCarbon(rows, gifa);
  return (
    <>
      <p className="muted">Upfront embodied carbon (A1–A3) from material quantities — e.g. a quantity take-off exported from the models. Factors are typical values; replace them with product EPD values where you have them.</p>
      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}><label className="check">GIFA (m²) <input type="number" min={0} value={gifa} onChange={(e) => setGifa(+e.target.value)} style={{ width: 120 }} /></label></div>
        <table className="data"><thead><tr><th>Material</th><th>Quantity</th><th>Factor (kgCO₂e/unit)</th><th>tCO₂e</th><th /></tr></thead><tbody>
          {r.lines.map((l, i) => <tr key={i}>
            <td><select value={l.materialId} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { materialId: e.target.value, qty: x.qty } : x)))}>{CARBON_MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.unit})</option>)}</select></td>
            <td><input type="number" min={0} value={l.qty} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, qty: +e.target.value } : x)))} style={{ width: 110 }} /> {l.unit}</td>
            <td><input type="number" min={0} value={l.factor} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, factor: +e.target.value } : x)))} style={{ width: 100 }} /></td>
            <td>{(l.kg / 1000).toFixed(1)}</td>
            <td><button className="ghost tiny danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button></td>
          </tr>)}
        </tbody></table>
        <button className="ghost small" onClick={() => setRows([...rows, { materialId: "steel", qty: 0 }])}>+ Material</button>
        <p><b>{(r.totalKg / 1000).toFixed(1)} tCO₂e</b> · <b>{r.perM2.toFixed(0)} kgCO₂e/m²</b> GIFA · indicative band <b>{r.band}</b></p>
        <SaveEstimate kind="carbon" input={{ gifa, rows }} summary={`${(r.totalKg / 1000).toFixed(1)} tCO2e · ${r.perM2.toFixed(0)} kg/m²`} onLoad={(v) => { setGifa(v.gifa); setRows(v.rows); }} />
        <button onClick={() => exportCsv("embodied-carbon", ["Material", "Quantity", "Unit", "Factor", "kgCO2e"], r.lines.map((l) => [l.label, String(l.qty), l.unit, String(l.factor), l.kg.toFixed(0)]))}>⬇ CSV</button>
      </div>
    </>
  );
}

function AssessmentTool({ id }: { id: string }) {
  const a = ASSESSMENTS.find((x) => x.id === id)!;
  const key = `bim:assess:${id}`;
  const [ans, setAns] = useState<Record<string, number>>(() => { try { return JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(ans)); } catch { /* storage unavailable */ } }, [ans, key]);
  const s = useMemo(() => scoreAssessment(a, ans), [a, ans]);
  return (
    <>
      <p className="muted">{a.intro} Rate each statement 0 (not at all) to 5 (fully, consistently). Answers stay in this browser.</p>
      <div className="grid g2">
        <div>{a.areas.map((ar, i) => (
          <div key={ar.area} className="card" style={{ marginBottom: 10 }}>
            <h3 style={{ marginTop: 0 }}>{ar.area}</h3>
            {ar.questions.map((q, j) => <div key={q} className="row spread" style={{ marginBottom: 6 }}><span className="small" style={{ flex: 1 }}>{q}</span>
              <div className="seg">{[0, 1, 2, 3, 4, 5].map((v) => <button key={v} className={ans[`${i}.${j}`] === v ? "on" : ""} onClick={() => setAns({ ...ans, [`${i}.${j}`]: v })}>{v}</button>)}</div></div>)}
          </div>
        ))}</div>
        <div className="card" style={{ alignSelf: "start", position: "sticky", top: 70 }}>
          <h3 style={{ marginTop: 0 }}>Result</h3>
          <div className="stat">{s.overall.toFixed(1)} / 5</div><p><b>{s.level}</b></p>
          {s.areas.map((x) => <div key={x.area} className="bar-row"><span className="small">{x.area}</span><span className="bar"><span style={{ width: `${(x.score / 5) * 100}%` }} /></span><b className="small">{x.score.toFixed(1)}</b></div>)}
          {s.weakest && <p className="small">Focus area: <b>{s.weakest}</b> — start your improvement plan here.</p>}
          <button className="ghost small" onClick={() => setAns({})}>Reset</button>
        </div>
      </div>
    </>
  );
}

const TOOLS = [{ id: "fee", label: "BIM fee estimator" }, { id: "carbon", label: "Embodied carbon (6D)" }, ...ASSESSMENTS.map((a) => ({ id: a.id, label: a.title }))];

export function Tools({ tool }: { tool?: string }) {
  const cur = TOOLS.some((t) => t.id === tool) ? tool! : "fee";
  return (
    <>
      <div className="page-head"><h1>Tools</h1></div>
      <div className="tabs">{TOOLS.map((t) => <a key={t.id} className={"tab" + (cur === t.id ? " on" : "")} href={`#/tools/${t.id}`}>{t.label}</a>)}</div>
      {cur === "fee" ? <FeeTool /> : cur === "carbon" ? <CarbonTool /> : <AssessmentTool key={cur} id={cur} />}
    </>
  );
}
export const TOOL_LIST = TOOLS;
