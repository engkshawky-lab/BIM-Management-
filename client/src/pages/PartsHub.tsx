import { useState, type CSSProperties, type ReactNode } from "react";
import { navigate } from "../App";
import { partDetailById, partDetails19650, type PartDetail } from "../../../shared/data/parts19650Detail";
import { templates } from "../../../shared/data/templates";
import { AskPartChat } from "./AiTools";
import { TONES } from "./HubPage";

// ISO 19650 learning hub: one page per part with levels, clause deep dive, checklist, documents,
// mistakes, a worked example and an AI tutor grounded in the part's notes.

type Level = "beginner" | "intermediate" | "expert";
const LEVELS: { id: Level; label: string; c: string; hint: string }[] = [
  { id: "beginner", label: "Beginner", c: TONES.green, hint: "Core ideas in plain English" },
  { id: "intermediate", label: "Intermediate", c: TONES.blue, hint: "Applying it on a project" },
  { id: "expert", label: "Expert", c: TONES.purple, hint: "Clause nuance, edge cases, audit" },
];
/** One colour per part, used across the hub. */
const PART_COLOR: Record<number, string> = { 1: TONES.blue, 2: TONES.green, 3: TONES.teal, 4: TONES.purple, 5: TONES.red, 6: TONES.amber };
const cv = (c: string) => ({ "--c": c }) as CSSProperties;

const load = <T,>(key: string, fallback: T): T => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } };
const store = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } };

const Box = ({ title, c, children }: { title: string; c?: string; children: ReactNode }) => (
  <div className="hub-card" style={c ? cv(c) : undefined}><div className="hub-title" style={c ? cv(c) : undefined}>{title}</div>{children}</div>
);

function Overview() {
  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">ISO 19650 · LEARNING HUB</div><h1>All six parts</h1>
        <p>Structured learning for every part of ISO 19650. Pick your level per part — you can be expert on Part 2 while starting out on Part 5. Each part has a clause-by-clause deep dive, a compliance checklist you can tick off, key documents, common mistakes, a worked example and an AI tutor.</p>
        <div className="facts"><span>6 parts</span><span>{partDetails19650.reduce((a, p) => a + p.clauses.length, 0)} clause notes</span><span>{partDetails19650.reduce((a, p) => a + p.checklist.length, 0)} checklist items</span><span>AI tutor</span></div>
      </div>
      <div className="grid g3">
        {partDetails19650.map((p) => { const c = PART_COLOR[p.number]; return (
          <a key={p.id} className="hub-card" href={`#/parts/${p.id}`} style={{ ...cv(c), color: "inherit", display: "grid", gap: 8 }}>
            <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: c, color: "#fff", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800, flexShrink: 0 }}>{p.number}</div>
              <div><b style={{ fontSize: 15 }}>{p.title}</b><div className="small muted">{p.edition}</div></div>
            </div>
            <div className="small">{p.oneLiner}</div>
            <Progress part={p} c={c} />
          </a>); })}
      </div>
    </div>
  );
}

function Progress({ part, c }: { part: PartDetail; c: string }) {
  const done = load<number[]>(`bim:part-check:${part.id}`, []).length;
  const pct = part.checklist.length ? Math.round((done / part.checklist.length) * 100) : 0;
  return <div className="small muted"><div className="progress" style={{ marginBottom: 4 }}><div style={{ width: pct + "%", background: c }} /></div>Checklist {done}/{part.checklist.length}</div>;
}

export default function PartsHub({ partId }: { partId?: string }) {
  const part = partId ? partDetailById(partId) : undefined;
  const [level, setLevelState] = useState<Level>(() => (part ? load<Level>(`bim:part-level:${part.id}`, "beginner") : "beginner"));
  const [checked, setChecked] = useState<number[]>(() => (part ? load<number[]>(`bim:part-check:${part.id}`, []) : []));
  if (!part) return <Overview />;

  const c = PART_COLOR[part.number];
  const setLevel = (l: Level) => { setLevelState(l); store(`bim:part-level:${part.id}`, l); };
  const toggle = (i: number) => { const next = checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i]; setChecked(next); store(`bim:part-check:${part.id}`, next); };
  const lv = part.levels[level];
  const lvMeta = LEVELS.find((l) => l.id === level)!;
  const tplFor = (code?: string) => (code ? templates.find((t) => t.code === code) : undefined);
  const pct = Math.round((checked.length / Math.max(1, part.checklist.length)) * 100);

  return (
    <div className="hub" style={{ "--hub": c } as CSSProperties}>
      <div className="hub-hero">
        <div className="row" style={{ flexWrap: "nowrap", gap: 18, alignItems: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, opacity: .9 }}>{part.number}</div>
          <div><div className="eyebrow">ISO 19650 · {part.edition}</div><h1>{part.title}</h1><p>{part.oneLiner}</p></div>
        </div>
        <div className="facts"><span>{part.clauses.length} clause notes</span><span>{part.checklist.length} checks</span><span>{part.keyDocuments.length} key documents</span><span>Checklist {pct}% done</span></div>
      </div>
      <div className="hub-sections">
        <a href="#/parts" style={cv("var(--muted)")}>All parts</a>
        {partDetails19650.map((p) => <a key={p.id} className={p.id === part.id ? "on" : ""} href={`#/parts/${p.id}`} style={cv(PART_COLOR[p.number])}>Part {p.number}</a>)}
      </div>

      <div className="grid g2">
        <div className="hub-tile" style={cv(TONES.green)}><b>In plain terms</b><div style={{ marginTop: 4 }}>{part.plainTerms}</div></div>
        <div className="hub-tile" style={cv(TONES.amber)}><b>Why it matters</b><div style={{ marginTop: 4 }}>{part.whyItMatters}</div></div>
      </div>
      <div className="row small">{part.whoUsesIt.map((w, i) => <span key={w} className="badge" style={{ borderColor: Object.values(TONES)[i % 6], color: Object.values(TONES)[i % 6], background: "transparent" }}>{w}</span>)}</div>

      <div className="row">
        {LEVELS.map((l) => <button key={l.id} onClick={() => setLevel(l.id)} style={level === l.id ? { background: l.c, color: "#fff", borderColor: l.c } : { borderColor: l.c, color: l.c }}>
          <b>{l.label}</b> <span className="small" style={{ opacity: .85 }}>· {l.hint}</span></button>)}
        <button onClick={() => document.getElementById("ask-ai")?.scrollIntoView({ behavior: "smooth" })}>Ask AI about Part {part.number}</button>
        <button onClick={() => navigate("/learn")}>Quiz &amp; mock exam</button>
      </div>

      <Box title={`${lvMeta.label} level`} c={lvMeta.c}>
        <p style={{ marginTop: 0, fontSize: 15 }}>{lv.summary}</p>
        <div style={{ display: "grid", gap: 6 }}>{lv.points.map((x, i) => (
          <div key={i} className="row" style={{ flexWrap: "nowrap", alignItems: "start", gap: 10 }}>
            <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 12, background: lvMeta.c, color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</span><span>{x}</span>
          </div>))}</div>
      </Box>

      <div className="grid g2" style={{ alignItems: "start" }}>
        <Box title="Key requirements" c={TONES.blue}><ul style={{ margin: 0 }}>{part.keyRequirements.map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}</ul></Box>
        <Box title={`Compliance checklist · ${checked.length}/${part.checklist.length}`} c={TONES.green}>
          <div className="progress" style={{ marginBottom: 8 }}><div style={{ width: `${pct}%`, background: "var(--ok)" }} /></div>
          {part.checklist.map((x, i) => <label key={i} className={"hub-check small" + (checked.includes(i) ? " done" : "")}><input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} style={{ marginTop: 2 }} /><span>{x}</span></label>)}
          <div className="tiny muted">Ticks are saved in this browser.</div>
        </Box>
      </div>

      <Box title="Key concepts" c={TONES.purple}>
        <div className="grid g3">{part.keyConcepts.map((k, i) => <div key={k.term} className="hub-tile" style={cv(Object.values(TONES)[i % 6])}><b>{k.term}</b><div className="small" style={{ marginTop: 4 }}>{k.explanation}</div></div>)}</div>
      </Box>

      <Box title="Deep dive — clause by clause" c={c}>
        {part.clauses.map((cl) => (
          <details key={cl.ref} className="clause" open={level === "expert" && part.clauses.length <= 4}>
            <summary><span className="badge" style={{ background: c, color: "#fff", borderColor: c, marginInlineEnd: 6 }}>{cl.ref}</span>{cl.title}</summary>
            <div>
              <p className="muted" style={{ marginTop: 4 }}>{cl.summary}</p>
              <ul>{cl.requirements.map((x, i) => <li key={i}>{x}</li>)}</ul>
              {!!cl.outputs?.length && <div className="small">Outputs: {cl.outputs.map((o) => <span key={o} className="badge" style={{ marginInlineEnd: 4, borderColor: TONES.green, color: TONES.green, background: "transparent" }}>{o}</span>)}</div>}
            </div>
          </details>
        ))}
      </Box>

      <div className="grid g2" style={{ alignItems: "start" }}>
        <Box title="Key documents" c={TONES.teal}>
          {part.keyDocuments.map((d) => { const t = tplFor(d.templateCode); return (
            <div key={d.name} className="hub-tile" style={{ ...cv(TONES.teal), marginBottom: 8 }}>
              <div className="row spread"><b>{d.name}</b>{t && <a className="small" href={`#/knowledge/${t.standard}/templates/${t.id}`}>Open template ↗</a>}</div>
              <div className="small">{d.purpose}</div>
            </div>); })}
          <a className="small" href="#/ai-tools/generate">Draft any of these with the AI document generator ↗</a>
        </Box>
        <Box title="Links to other parts and standards" c={TONES.blue}>
          {part.interfaces.map((x) => <div key={x.ref} style={{ marginBottom: 8, borderInlineStart: `3px solid ${TONES.blue}`, paddingInlineStart: 10 }}><b>{x.ref}</b><div className="small muted">{x.relation}</div></div>)}
        </Box>
      </div>

      <Box title="Common mistakes and how to avoid them" c={TONES.red}>
        <div className="table-wrap"><table className="data hub-table"><thead><tr><th style={{ width: "45%" }}>✗ Mistake</th><th>✓ Fix</th></tr></thead>
          <tbody>{part.commonMistakes.map((m, i) => <tr key={i}><td style={{ color: "var(--danger)" }}>{m.mistake}</td><td>{m.fix}</td></tr>)}</tbody></table></div>
      </Box>

      <Box title={`Worked example — ${part.workedExample.title}`} c={TONES.amber}>
        <p style={{ marginTop: 0 }}>{part.workedExample.scenario}</p>
        <div className="hub-flow" style={{ marginBottom: 10 }}>{part.workedExample.steps.map((s, i) => <div key={i} style={cv(Object.values(TONES)[i % 6])}><b>Step {i + 1}</b><span>{s}</span></div>)}</div>
        <div className="hub-tile" style={cv(TONES.green)}><b>Outcome:</b> {part.workedExample.outcome}</div>
      </Box>

      <div id="ask-ai"><Box title={`Ask AI about Part ${part.number}`} c={TONES.purple}>
        <AskPartChat partId={part.id} partLabel={`Part ${part.number}`} suggestions={[
          `Explain Part ${part.number} to a new BIM coordinator`,
          `What evidence would an auditor ask for on Part ${part.number}?`,
          `Common mistakes with ${part.keyDocuments[0]?.name ?? "the key documents"}`,
        ]} />
      </Box></div>
      <p className="tiny muted">Paraphrased guidance, not the standard's text. Always verify against the licensed edition of {part.edition}.</p>
    </div>
  );
}
