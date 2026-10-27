import { useState } from "react";
import type { Hub, HubBlock, Tone } from "../../../shared/data/hubs/types";
import { AskPartChat, generateHref } from "./AiTools";

// Renders a topic hub (Scan to BIM, BIM dimensions, implementation): section switch, tabs, content blocks.

const TONES: Record<Tone, string> = { blue: "#3b82f6", green: "#22c55e", amber: "#f59e0b", purple: "#a855f7", red: "#ef4444", teal: "#14b8a6" };
const ORDER: Tone[] = ["blue", "green", "purple", "amber", "red", "teal"];
const tint = (c: string, pct = 12) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

function Quiz({ questions }: { questions: { q: string; options: string[]; answer: number; why: string }[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const done = Object.keys(picked).length;
  const score = questions.filter((q, i) => picked[i] === q.answer).length;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {questions.map((q, i) => (
        <div key={i}>
          <b>{i + 1}. {q.q}</b>
          <div style={{ display: "grid", gap: 4, marginTop: 6 }}>
            {q.options.map((o, j) => {
              const chosen = picked[i] === j, answered = picked[i] !== undefined, right = j === q.answer;
              return <button key={j} disabled={answered} onClick={() => setPicked({ ...picked, [i]: j })} style={{ textAlign: "start",
                borderColor: answered && right ? "var(--ok)" : chosen ? "var(--danger)" : undefined, background: answered && right ? tint("var(--ok)") : chosen ? tint("var(--danger)") : undefined }}>{o}</button>;
            })}
          </div>
          {picked[i] !== undefined && <div className="small muted" style={{ marginTop: 4 }}>{picked[i] === q.answer ? "Correct. " : "Not quite. "}{q.why}</div>}
        </div>
      ))}
      <div className="row"><b>Score: {score}/{questions.length}</b>{done > 0 && <button className="ghost small" onClick={() => setPicked({})}>Reset</button>}</div>
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
      <div>
        <table className="data"><tbody>
          {rows.map(([k, v]) => <tr key={k}><td>{k}</td><td style={{ textAlign: "end" }}>{v} d</td></tr>)}
          <tr><td><b>Total</b> ({setups} scan setups)</td><td style={{ textAlign: "end" }}><b>{days} d · {(days * f.rate).toLocaleString()}</b></td></tr>
        </tbody></table>
        <p className="tiny muted">Indicative planning figures, not a quotation. Real effort depends on access, control survey, accuracy class (LOA), deliverable formats and client review cycles.</p>
      </div>
    </div>
  );
}

function Block({ b, hub }: { b: HubBlock; hub: Hub }) {
  const title = <div className="small muted" style={{ letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>{b.title}</div>;
  switch (b.kind) {
    case "text": return <div className="card">{title}{b.body.map((p, i) => <p key={i} style={{ marginTop: 0 }}>{p}</p>)}</div>;
    case "list": return <div className="card">{title}<ul style={{ margin: 0 }}>{b.items.map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}</ul></div>;
    case "checklist": return <div className="card">{title}{b.items.map((x, i) => <label key={i} className="row small" style={{ flexWrap: "nowrap", alignItems: "start", marginBottom: 6 }}><input type="checkbox" style={{ marginTop: 2 }} /><span>{x}</span></label>)}</div>;
    case "cards": return <div>{title}<div className="grid g3">{b.cards.map((c, i) => { const col = TONES[c.tone ?? ORDER[i % ORDER.length]]; return (
      <div key={i} className="card" style={{ borderTop: `3px solid ${col}` }}><b style={{ color: col }}>{c.title}</b><div className="small" style={{ marginTop: 4 }}>{c.body}</div></div>); })}</div></div>;
    case "stats": return <div className="card">{title}<div className="grid g4">{b.stats.map((s, i) => { const col = TONES[ORDER[i % ORDER.length]]; return (
      <div key={i} style={{ background: tint(col, 10), borderRadius: 8, padding: 12, textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: col }}>{s.value}</div><div className="small">{s.label}</div>{s.source && <div className="tiny muted">{s.source}</div>}</div>); })}</div></div>;
    case "steps": return <div className="card">{title}<div className="process-map">{b.steps.map((s, i) => [
      i > 0 && <div key={"a" + i} className="pm-arrow">→</div>,
      <div key={i} className="pm-stage" style={{ borderColor: TONES[ORDER[i % ORDER.length]], background: tint(TONES[ORDER[i % ORDER.length]], 10) }}><b>{i + 1}. {s.title}</b><span className="small muted">{s.body}</span></div>])}</div></div>;
    case "table": return <div className="card table-wrap">{title}<table className="data"><thead><tr>{b.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j ? "small" : undefined}>{j === 0 ? <b>{c}</b> : c}</td>)}</tr>)}</tbody></table></div>;
    case "callout": { const col = b.tone === "warn" ? "var(--warn)" : b.tone === "ok" ? "var(--ok)" : "var(--accent)"; return <div className="card" style={{ borderInlineStart: `4px solid ${col}`, background: tint(col, 8) }}><b>{b.title}</b><div style={{ marginTop: 4 }}>{b.body}</div></div>; }
    case "faq": return <div className="card">{title}{b.items.map((x, i) => <details key={i} className="clause"><summary>{x.q}</summary><div style={{ padding: "4px 0 8px" }}>{x.a}</div></details>)}</div>;
    case "quiz": return <div className="card">{title}<Quiz questions={b.questions} /></div>;
    case "widget":
      if (b.widget === "scan-cost") return <div className="card">{title}<ScanCost /></div>;
      if (b.widget === "ask-ai") return <div className="card">{title}<AskPartChat hubId={hub.id} partLabel={hub.title} suggestions={hub.aiPrompts.slice(0, 3)} /></div>;
      return <div className="card row spread">{<b>{b.title}</b>}<a href={generateHref(b.docType ?? b.title)}><button className="primary">Open in AI document generator</button></a></div>;
  }
}

export default function HubPage({ hub, sectionId, tabId }: { hub: Hub; sectionId?: string; tabId?: string }) {
  const section = hub.sections.find((s) => s.id === sectionId) ?? hub.sections[0];
  const tab = section.tabs.find((t) => t.id === tabId) ?? section.tabs[0];
  const base = `#/hubs/${hub.id}`;
  return (
    <>
      <div className="page-head"><div className="small muted">{hub.eyebrow}</div><h1>{hub.title}</h1><p className="muted" style={{ margin: 0, maxWidth: 760 }}>{hub.intro}</p></div>
      {hub.sections.length > 1 && <div className="row" style={{ marginBottom: 10 }}>{hub.sections.map((s) => <a key={s.id} href={`${base}/${s.id}`}><button className={"chip" + (s.id === section.id ? " on" : "")} style={{ fontSize: 13, padding: "4px 12px" }}>{s.label}</button></a>)}</div>}
      <div className="tabs" style={{ flexWrap: "wrap" }}>{section.tabs.map((t) => <a key={t.id} className={"tab" + (t.id === tab.id ? " on" : "")} href={`${base}/${section.id}/${t.id}`}>{t.label}</a>)}</div>
      <div style={{ display: "grid", gap: 12 }}>{tab.blocks.map((b, i) => <Block key={`${tab.id}-${i}`} b={b} hub={hub} />)}</div>
    </>
  );
}
