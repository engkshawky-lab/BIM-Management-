import { useState, type ReactNode } from "react";
import { navigate } from "../App";
import { partDetailById, partDetails19650, type PartDetail } from "../../../shared/data/parts19650Detail";
import { templates } from "../../../shared/data/templates";
import { AskPartChat } from "./AiTools";

// ISO 19650 learning hub: one page per part with levels, clause deep dive, checklist, documents,
// mistakes, a worked example and an AI tutor grounded in the part's notes.

type Level = "beginner" | "intermediate" | "expert";
const LEVELS: { id: Level; label: string }[] = [{ id: "beginner", label: "Beginner" }, { id: "intermediate", label: "Intermediate" }, { id: "expert", label: "Expert" }];

const load = <T,>(key: string, fallback: T): T => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } };
const store = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } };

const Box = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="card"><div className="small muted" style={{ letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>{title}</div>{children}</div>
);

function Overview() {
  return (
    <>
      <div className="page-head"><div className="small muted">ISO 19650 · LEARNING HUB</div><h1>All six parts</h1>
        <p className="muted" style={{ margin: 0, maxWidth: 760 }}>Structured learning for every part of ISO 19650. Pick your level per part — you can be expert on Part 2 while starting out on Part 5. Each part has a clause-by-clause deep dive, a compliance checklist you can tick off, key documents, common mistakes, a worked example and an AI tutor.</p></div>
      <div className="grid g3">
        {partDetails19650.map((p) => (
          <a key={p.id} className="card" href={`#/parts/${p.id}`} style={{ color: "inherit", textDecoration: "none", display: "grid", gap: 6 }}>
            <div className="row" style={{ gap: 12 }}><div style={{ fontSize: 40, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{p.number}</div><div><b>{p.title}</b><div className="small muted">{p.edition}</div></div></div>
            <div className="small">{p.oneLiner}</div>
            <Progress part={p} />
          </a>
        ))}
      </div>
    </>
  );
}

function Progress({ part }: { part: PartDetail }) {
  const done = load<number[]>(`bim:part-check:${part.id}`, []).length;
  const pct = part.checklist.length ? Math.round((done / part.checklist.length) * 100) : 0;
  return <div className="small muted"><div className="progress" style={{ marginBottom: 4 }}><div style={{ width: pct + "%" }} /></div>Checklist {done}/{part.checklist.length}</div>;
}

export default function PartsHub({ partId }: { partId?: string }) {
  const part = partId ? partDetailById(partId) : undefined;
  const [level, setLevelState] = useState<Level>(() => (part ? load<Level>(`bim:part-level:${part.id}`, "beginner") : "beginner"));
  const [checked, setChecked] = useState<number[]>(() => (part ? load<number[]>(`bim:part-check:${part.id}`, []) : []));
  if (!part) return <Overview />;

  const setLevel = (l: Level) => { setLevelState(l); store(`bim:part-level:${part.id}`, l); };
  const toggle = (i: number) => { const next = checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i]; setChecked(next); store(`bim:part-check:${part.id}`, next); };
  const lv = part.levels[level];
  const tplFor = (code?: string) => (code ? templates.find((t) => t.code === code) : undefined);

  return (
    <>
      <div className="page-head"><div className="small muted">ISO 19650 · {part.edition}</div><h1>Part {part.number} — {part.title}</h1>
        <p className="muted" style={{ margin: 0, maxWidth: 760 }}>{part.oneLiner}</p></div>
      <div className="tabs">
        <a className="tab" href="#/parts">All parts</a>
        {partDetails19650.map((p) => <a key={p.id} className={"tab" + (p.id === part.id ? " on" : "")} href={`#/parts/${p.id}`}>Part {p.number}</a>)}
      </div>

      <div className="card row" style={{ alignItems: "stretch", gap: 18, flexWrap: "nowrap", marginBottom: 12 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "var(--accent)", lineHeight: 1, opacity: .6 }}>{part.number}</div>
        <div style={{ display: "grid", gap: 8, flex: 1 }}>
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "color-mix(in srgb, var(--ok) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--ok) 35%, transparent)" }}><b>In plain terms:</b> {part.plainTerms}</div>
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "color-mix(in srgb, var(--warn) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--warn) 35%, transparent)" }}><b>Why it matters:</b> {part.whyItMatters}</div>
          <div className="small muted">Who needs it: {part.whoUsesIt.join(" · ")}</div>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <div className="seg">{LEVELS.map((l) => <button key={l.id} className={level === l.id ? "on" : ""} onClick={() => setLevel(l.id)}>{l.label}</button>)}</div>
        <button onClick={() => document.getElementById("ask-ai")?.scrollIntoView({ behavior: "smooth" })}>Ask AI about Part {part.number}</button>
        <button onClick={() => navigate("/learn")}>Quiz &amp; mock exam</button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <Box title={`${LEVELS.find((l) => l.id === level)!.label} level`}>
          <p style={{ marginTop: 0 }}>{lv.summary}</p>
          <ul style={{ margin: 0 }}>{lv.points.map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}</ul>
        </Box>

        <div className="grid g2" style={{ alignItems: "start" }}>
          <Box title="Key requirements"><ul style={{ margin: 0 }}>{part.keyRequirements.map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}</ul></Box>
          <Box title={`Compliance checklist · ${checked.length}/${part.checklist.length}`}>
            <div className="progress" style={{ marginBottom: 8 }}><div style={{ width: `${Math.round((checked.length / Math.max(1, part.checklist.length)) * 100)}%` }} /></div>
            {part.checklist.map((x, i) => <label key={i} className="row small" style={{ flexWrap: "nowrap", alignItems: "start", marginBottom: 6 }}><input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} style={{ marginTop: 2 }} /><span>{x}</span></label>)}
            <div className="tiny muted">Ticks are saved in this browser.</div>
          </Box>
        </div>

        <Box title="Key concepts">
          <div className="grid g3">{part.keyConcepts.map((c) => <div key={c.term} style={{ borderInlineStart: "3px solid var(--accent)", paddingInlineStart: 10 }}><b>{c.term}</b><div className="small muted">{c.explanation}</div></div>)}</div>
        </Box>

        <Box title="Deep dive — clause by clause">
          {part.clauses.map((c) => (
            <details key={c.ref} className="clause" open={level === "expert" && part.clauses.length <= 4}>
              <summary><b>{c.ref}</b> — {c.title}</summary>
              <div>
                <p className="muted" style={{ marginTop: 4 }}>{c.summary}</p>
                <ul>{c.requirements.map((x, i) => <li key={i}>{x}</li>)}</ul>
                {!!c.outputs?.length && <div className="small">Outputs: {c.outputs.map((o) => <span key={o} className="badge" style={{ marginInlineEnd: 4 }}>{o}</span>)}</div>}
              </div>
            </details>
          ))}
        </Box>

        <div className="grid g2" style={{ alignItems: "start" }}>
          <Box title="Key documents">
            {part.keyDocuments.map((d) => { const t = tplFor(d.templateCode); return (
              <div key={d.name} style={{ marginBottom: 8 }}>
                <div className="row spread"><b>{d.name}</b>{t && <a className="small" href={`#/knowledge/${t.standard}/templates/${t.id}`}>Open template ↗</a>}</div>
                <div className="small muted">{d.purpose}</div>
              </div>); })}
            <a className="small" href="#/ai-tools/generate">Draft any of these with the AI document generator ↗</a>
          </Box>
          <Box title="Links to other parts and standards">
            {part.interfaces.map((x) => <div key={x.ref} style={{ marginBottom: 8 }}><b>{x.ref}</b><div className="small muted">{x.relation}</div></div>)}
          </Box>
        </div>

        <Box title="Common mistakes and how to avoid them">
          <div className="table-wrap"><table className="data"><thead><tr><th style={{ width: "45%" }}>Mistake</th><th>Fix</th></tr></thead>
            <tbody>{part.commonMistakes.map((m, i) => <tr key={i}><td>{m.mistake}</td><td>{m.fix}</td></tr>)}</tbody></table></div>
        </Box>

        <Box title={`Worked example — ${part.workedExample.title}`}>
          <p style={{ marginTop: 0 }}>{part.workedExample.scenario}</p>
          <ol>{part.workedExample.steps.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}</ol>
          <p style={{ marginBottom: 0 }}><b>Outcome:</b> {part.workedExample.outcome}</p>
        </Box>

        <div id="ask-ai"><Box title={`Ask AI about Part ${part.number}`}>
          <AskPartChat partId={part.id} partLabel={`Part ${part.number}`} suggestions={[
            `Explain Part ${part.number} to a new BIM coordinator`,
            `What evidence would an auditor ask for on Part ${part.number}?`,
            `Common mistakes with ${part.keyDocuments[0]?.name ?? "the key documents"}`,
          ]} />
        </Box></div>
        <p className="tiny muted">Paraphrased guidance, not the standard's text. Always verify against the licensed edition of {part.edition}.</p>
      </div>
    </>
  );
}
