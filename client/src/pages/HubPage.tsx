import { useState, type CSSProperties, type ReactNode } from "react";
import type { Hub, HubBlock, ProcessStep, Tone } from "../../../shared/data/hubs/types";
import { AskPartChat, generateHref } from "./AiTools";

// Renders a topic hub (Scan to BIM, BIM dimensions, COBie, LOIN…): coloured header, section switch, tabs, content blocks.

export const TONES: Record<Tone, string> = { blue: "#3b82f6", green: "#16a34a", amber: "#d97706", purple: "#9333ea", red: "#dc2626", teal: "#0d9488" };
export const ORDER: Tone[] = ["blue", "green", "purple", "amber", "red", "teal"];
const cycle = (i: number) => TONES[ORDER[i % ORDER.length]];
const cv = (c: string) => ({ "--c": c }) as CSSProperties;

function Quiz({ questions }: { questions: { q: string; options: string[]; answer: number; why: string }[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const done = Object.keys(picked).length;
  const score = questions.filter((q, i) => picked[i] === q.answer).length;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {done === questions.length && <div className="hub-tile" style={cv(score / questions.length >= 0.7 ? TONES.green : TONES.amber)}>
        <b>{score / questions.length >= 0.7 ? "Well done!" : "Keep going!"}</b> You scored {score} out of {questions.length}.</div>}
      {questions.map((q, i) => (
        <div key={i}>
          <b>{i + 1}. {q.q}</b>
          <div style={{ display: "grid", gap: 4, marginTop: 6 }}>
            {q.options.map((o, j) => {
              const chosen = picked[i] === j, answered = picked[i] !== undefined, right = j === q.answer;
              const c = answered && right ? TONES.green : chosen ? TONES.red : "";
              return <button key={j} disabled={answered} onClick={() => setPicked({ ...picked, [i]: j })} style={{ textAlign: "start", ...(c ? { borderColor: c, background: `color-mix(in srgb, ${c} 14%, transparent)` } : {}) }}>{answered && right ? "✓ " : chosen ? "✗ " : ""}{o}</button>;
            })}
          </div>
          {picked[i] !== undefined && <div className="small" style={{ marginTop: 4, color: picked[i] === q.answer ? "var(--ok)" : "var(--danger)" }}>{picked[i] === q.answer ? "Correct. " : "Not quite. "}<span className="muted">{q.why}</span></div>}
        </div>
      ))}
      <div className="row"><b>Score: {score}/{questions.length}</b>{done > 0 && <button className="ghost small" onClick={() => setPicked({})}>Try again</button>}</div>
    </div>
  );
}

function ScanCost() {
  const [f, setF] = useState({ area: 5000, complexity: 1, lod: 300, scope: 1.35, rate: 650, travel: 0 });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: Number(e.target.value) });
  // Indicative planning figures only: setups per area, setups per day, modelling hours per 1,000 m² by LOD.
  const setups = Math.ceil(f.area / 80 * f.complexity);
  const scanDays = Math.max(1, Math.ceil(setups / 30));
  const regDays = Math.max(0.5, Math.round((setups / 150) * 2) / 2);
  const modelHours = (f.area / 1000) * ({ 200: 15, 300: 30, 350: 45, 400: 65 }[f.lod] ?? 30) * f.scope * f.complexity;
  const modelDays = Math.ceil(modelHours / 7.5);
  const qaDays = Math.max(1, Math.ceil(modelDays * 0.15));
  const days = scanDays + regDays + modelDays + qaDays + f.travel;
  const rows: [string, number][] = [["Site scanning", scanDays], ["Registration & cleaning", regDays], ["Modelling", modelDays], ["QA & deviation checks", qaDays], ["Travel / mobilisation", f.travel]];
  return (
    <div className="grid g2" style={{ alignItems: "start" }}>
      <div className="grid g2">
        <label className="small">Floor area (m²)<input type="number" min={100} value={f.area} onChange={set("area")} /></label>
        <label className="small">Complexity<select value={f.complexity} onChange={set("complexity")}><option value={0.8}>Simple (open plan)</option><option value={1}>Standard</option><option value={1.3}>Complex (plant, heritage)</option><option value={1.6}>Highly complex</option></select></label>
        <label className="small">Model LOD<select value={f.lod} onChange={set("lod")}>{[200, 300, 350, 400].map((l) => <option key={l} value={l}>LOD {l}</option>)}</select></label>
        <label className="small">Scope<select value={f.scope} onChange={set("scope")}><option value={1}>Architecture</option><option value={1.35}>Architecture + structure</option><option value={1.9}>Architecture + structure + MEP</option></select></label>
        <label className="small">Day rate<input type="number" min={0} value={f.rate} onChange={set("rate")} /></label>
        <label className="small">Travel days<input type="number" min={0} value={f.travel} onChange={set("travel")} /></label>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <div className="grid g2">
          <div className="hub-stat" style={cv(TONES.blue)}><div className="v">{days} days</div><div className="small">total effort</div></div>
          <div className="hub-stat" style={cv(TONES.green)}><div className="v">{(days * f.rate).toLocaleString()}</div><div className="small">at your day rate</div></div>
        </div>
        <table className="data hub-table"><tbody>
          {rows.map(([k, v], i) => <tr key={k}><td><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: cycle(i), marginInlineEnd: 6 }} />{k}</td><td style={{ textAlign: "end" }}>{v} d</td></tr>)}
          <tr><td className="muted">{setups} scan setups</td><td /></tr>
        </tbody></table>
        <p className="tiny muted" style={{ margin: 0 }}>Indicative planning figures, not a quotation. Real effort depends on access, control survey, accuracy class (LOA), deliverable formats and client review cycles.</p>
      </div>
    </div>
  );
}

function Process({ b }: { b: Extract<HubBlock, { kind: "process" }> }) {
  const [lane, setLane] = useState("");
  const [sel, setSel] = useState(b.steps[0]?.id ?? "");
  const laneColor = (id: string) => TONES[b.lanes.find((l) => l.id === id)?.tone ?? "blue"];
  const step = b.steps.find((s) => s.id === sel);
  const List = ({ title, items, c }: { title: string; items: string[]; c: string }) => !items.length ? null : (
    <div className="hub-tile" style={cv(c)}><div className="hub-title" style={cv(c)}>{title}</div><ul style={{ margin: 0, paddingInlineStart: 18 }}>{items.map((x, i) => <li key={i} style={{ marginBottom: 3 }}>{x}</li>)}</ul></div>);
  return (
    <>
      <div className="proc-lanes">
        <button className={!lane ? "on" : ""} style={cv("var(--hub)")} onClick={() => setLane("")}>Full process</button>
        {b.lanes.map((l) => <button key={l.id} className={lane === l.id ? "on" : ""} style={cv(TONES[l.tone])} onClick={() => setLane(lane === l.id ? "" : l.id)}>{l.label}</button>)}
        <span className="small muted" style={{ alignSelf: "center" }}>Click a step for details</span>
      </div>
      <div className="proc-steps">
        {b.steps.map((s, i) => [
          i > 0 && <span key={"a" + s.id} className="proc-arrow">→</span>,
          <button key={s.id} className={"proc-step" + (s.id === sel ? " on" : "") + (lane && s.lane !== lane ? " dim" : "")} style={cv(laneColor(s.lane))} onClick={() => setSel(s.id)}>
            <small>Step {i + 1}</small><b>{s.title}</b><small>{s.subtitle}</small>
          </button>])}
      </div>
      {step && <StepDetail step={step} n={b.steps.indexOf(step) + 1} c={laneColor(step.lane)} laneLabel={b.lanes.find((l) => l.id === step.lane)?.label ?? ""} List={List} />}
    </>
  );
}

function StepDetail({ step, n, c, laneLabel, List }: { step: ProcessStep; n: number; c: string; laneLabel: string; List: (p: { title: string; items: string[]; c: string }) => ReactNode }) {
  return (
    <div className="proc-detail" style={cv(c)}>
      <div className="row spread"><div><h3>{n}. {step.title} — {step.subtitle}</h3><div className="small muted">Responsible: <b style={{ color: c }}>{laneLabel}</b> · {step.clause}</div></div>
        {!!step.documents.length && <div className="row">{step.documents.map((d) => <span key={d} className="badge" style={{ borderColor: c, color: c, background: "transparent" }}>{d}</span>)}</div>}</div>
      <div className="grid g3" style={{ marginTop: 12 }}>
        <List title="Inputs" items={step.inputs} c={TONES.blue} />
        <List title="Activities" items={step.activities} c={TONES.purple} />
        <List title="Outputs" items={step.outputs} c={TONES.green} />
      </div>
      {step.tip && <div className="hub-tile" style={{ ...cv(TONES.amber), marginTop: 10 }}><b>Tip:</b> {step.tip}</div>}
    </div>
  );
}

function Block({ b, hub, i }: { b: HubBlock; hub: Hub; i: number }) {
  const c = cycle(i);
  const title = <div className="hub-title" style={cv(c)}>{b.title}</div>;
  const card = (children: ReactNode, extra?: CSSProperties) => <div className="hub-card" style={{ ...cv(c), ...extra }}>{title}{children}</div>;
  switch (b.kind) {
    case "text": return card(b.body.map((p, k) => <p key={k} style={{ marginTop: 0 }}>{p}</p>));
    case "list": return card(<ul style={{ margin: 0 }}>{b.items.map((x, k) => <li key={k} style={{ marginBottom: 4 }}>{x}</li>)}</ul>);
    case "checklist": return card(<Checklist items={b.items} />);
    case "cards": return <div>{title}<div className="grid g3">{b.cards.map((x, k) => { const col = TONES[x.tone ?? ORDER[(k + i) % ORDER.length]]; return (
      <div key={k} className="hub-tile" style={cv(col)}><b>{x.title}</b><div className="small" style={{ marginTop: 4 }}>{x.body}</div></div>); })}</div></div>;
    case "stats": return card(<div className="grid g4">{b.stats.map((s, k) => (
      <div key={k} className="hub-stat" style={cv(cycle(k + i))}><div className="v">{s.value}</div><div className="small">{s.label}</div>{s.source && <div className="tiny muted">{s.source}</div>}</div>))}</div>);
    case "steps": return card(<div className="hub-flow">{b.steps.map((s, k) => <div key={k} style={cv(cycle(k))}><b>{k + 1}. {s.title}</b><span>{s.body}</span></div>)}</div>);
    case "table": return card(<div className="table-wrap"><table className="data hub-table"><thead><tr>{b.columns.map((x) => <th key={x}>{x}</th>)}</tr></thead>
      <tbody>{b.rows.map((r, k) => <tr key={k}>{r.map((x, j) => <td key={j} className={j ? "small" : undefined}>{j === 0 ? <b>{x}</b> : x}</td>)}</tr>)}</tbody></table></div>);
    case "callout": { const col = b.tone === "warn" ? TONES.amber : b.tone === "ok" ? TONES.green : TONES.blue; return <div className="hub-tile" style={{ ...cv(col), borderInlineStart: `4px solid ${col}` }}><b>{b.title}</b><div style={{ marginTop: 4 }}>{b.body}</div></div>; }
    case "faq": return card(b.items.map((x, k) => <details key={k} className="clause"><summary>{x.q}</summary><div style={{ padding: "4px 0 8px" }}>{x.a}</div></details>));
    case "quiz": return card(<Quiz questions={b.questions} />);
    case "process": return card(<Process b={b} />);
    case "widget":
      if (b.widget === "scan-cost") return card(<ScanCost />);
      if (b.widget === "ask-ai") return card(<AskPartChat hubId={hub.id} partLabel={hub.title} suggestions={hub.aiPrompts.slice(0, 3)} />);
      return <div className="hub-tile row spread" style={cv(TONES.purple)}><div><b>{b.title}</b><div className="small muted">AI drafts a structured document you review and edit.</div></div><a href={generateHref(b.docType ?? b.title)}><button className="primary">Open in AI document generator</button></a></div>;
  }
}

function Checklist({ items }: { items: string[] }) {
  const [done, setDone] = useState<number[]>([]);
  return <>
    <div className="progress" style={{ marginBottom: 8 }}><div style={{ width: `${Math.round((done.length / Math.max(1, items.length)) * 100)}%`, background: "var(--ok)" }} /></div>
    {items.map((x, k) => <label key={k} className={"hub-check small" + (done.includes(k) ? " done" : "")}><input type="checkbox" checked={done.includes(k)} onChange={() => setDone(done.includes(k) ? done.filter((d) => d !== k) : [...done, k])} style={{ marginTop: 2 }} /><span>{x}</span></label>)}
  </>;
}

export default function HubPage({ hub, sectionId, tabId }: { hub: Hub; sectionId?: string; tabId?: string }) {
  const section = hub.sections.find((s) => s.id === sectionId) ?? hub.sections[0];
  const tab = section.tabs.find((t) => t.id === tabId) ?? section.tabs[0];
  const base = `#/hubs/${hub.id}`;
  const tabs = hub.sections.reduce((a, s) => a + s.tabs.length, 0);
  const quizzes = hub.sections.flatMap((s) => s.tabs.flatMap((t) => t.blocks)).filter((b) => b.kind === "quiz").length;
  return (
    <div className="hub" style={{ "--hub": TONES[hub.tone ?? "blue"] } as CSSProperties}>
      <div className="hub-hero">
        <div className="eyebrow">{hub.eyebrow}</div><h1>{hub.title}</h1><p>{hub.intro}</p>
        <div className="facts">{hub.sections.length > 1 && <span>{hub.sections.length} sections</span>}<span>{tabs} topics</span>{quizzes > 0 && <span>{quizzes} quiz{quizzes > 1 ? "zes" : ""}</span>}<span>AI tutor</span></div>
      </div>
      {hub.sections.length > 1 && <div className="hub-sections">{hub.sections.map((s, i) => <a key={s.id} href={`${base}/${s.id}`} className={s.id === section.id ? "on" : ""} style={cv(cycle(i))}>{s.label}</a>)}</div>}
      <div className="hub-tabs">{section.tabs.map((t) => <a key={t.id} className={t.id === tab.id ? "on" : ""} href={`${base}/${section.id}/${t.id}`}>{t.label}</a>)}</div>
      {tab.blocks.map((b, i) => <Block key={`${section.id}-${tab.id}-${i}`} b={b} hub={hub} i={i} />)}
    </div>
  );
}

/** Landing page listing every topic hub as a coloured card. */
export function HubsIndex({ hubs }: { hubs: Hub[] }) {
  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">ISO 19650 · TOPIC HUBS</div><h1>Advanced topics</h1>
        <p>Practical, in-depth guides that sit alongside the ISO 19650 parts: each has topics, worked examples, checklists, quizzes and an AI tutor.</p></div>
      <div className="grid g3">{hubs.map((h) => { const c = TONES[h.tone ?? "blue"]; const tabs = h.sections.reduce((a, s) => a + s.tabs.length, 0); return (
        <a key={h.id} href={`#/hubs/${h.id}`} className="hub-card" style={{ ...cv(c), color: "inherit", display: "grid", gap: 6 }}>
          <div className="hub-title" style={cv(c)}>{h.eyebrow}</div><b style={{ fontSize: 16 }}>{h.title}</b>
          <div className="small muted">{h.intro.length > 180 ? h.intro.slice(0, 177) + "…" : h.intro}</div>
          <div className="small" style={{ color: c, fontWeight: 600 }}>{tabs} topics →</div>
        </a>); })}</div>
    </div>
  );
}
