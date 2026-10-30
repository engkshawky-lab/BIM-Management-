import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { markVisited } from "../lib/progress";
import { partDetailById, partDetails19650, type PartDetail } from "../../../shared/data/parts19650Detail";
import { PART_LINKS, PART_ROLES, PART_STAGES } from "../../../shared/data/partsMap";
import { practiceFor } from "../../../shared/data/partsPractice";
import type { PracticeQuiz } from "../../../shared/data/partsPractice/types";
import { templates } from "../../../shared/data/templates";
import { t } from "../i18n";
import { AskPartChat } from "./AiTools";
import { TONES } from "./HubPage";

// ISO 19650 learning hub. The index shows how the six parts fit together; each part has tabs:
// overview, clauses, practical examples, questions and answers, a quiz, documents, and an AI tutor.

type Level = "beginner" | "intermediate" | "expert";
const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: "beginner", label: "Beginner", hint: "Core ideas in plain English" },
  { id: "intermediate", label: "Intermediate", hint: "Applying it on a project" },
  { id: "expert", label: "Expert", hint: "Clause nuance, edge cases, audit" },
];
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "clauses", label: "Clauses & checklist" },
  { id: "examples", label: "Practical examples" },
  { id: "qa", label: "Questions & answers" },
  { id: "quiz", label: "Quiz" },
  { id: "documents", label: "Documents & mistakes" },
  { id: "ask", label: "Ask AI" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const cv = (c: string) => ({ "--c": c }) as CSSProperties;
const load = <T,>(key: string, fallback: T): T => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } };
const store = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } };

const Box = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="hub-card"><div className="hub-title">{title}</div>{children}</div>
);

// ---------------------------------------------------------------- index: how the parts fit together

function PartsDiagram() {
  const role = (n: number) => PART_ROLES.find((r) => r.part === n)!;
  const Node = ({ n, wide }: { n: number; wide?: boolean }) => (
    <a href={`#/parts/19650-${n}`} className={"pmap-node" + (wide ? " wide" : "")}>
      <span className="pmap-num">{n}</span><span><b>{t(role(n).short)}</b><small>{t(partDetails19650[n - 1].title)}</small></span>
    </a>
  );
  return (
    <div className="pmap" aria-label="How the six parts connect">
      <div className="pmap-layer pmap-overlay"><Node n={5} wide /><span className="pmap-note">{t("Security applies to every part: triage first, then controlled sharing")}</span></div>
      <div className="pmap-life">
        <div className="pmap-phase"><div className="pmap-phase-title">{t("Delivery phase")}</div><Node n={2} /><span className="pmap-out">{t("produces the PIM")}</span></div>
        <div className="pmap-arrows">
          <span className="pmap-arrow">{t("Handover: PIM → AIM")} →</span>
          <span className="pmap-arrow back">← {t("Trigger event: new appointment")}</span>
        </div>
        <div className="pmap-phase"><div className="pmap-phase-title">{t("Operational phase")}</div><Node n={3} /><span className="pmap-out">{t("maintains the AIM")}</span></div>
      </div>
      <div className="pmap-layer"><Node n={4} wide /><span className="pmap-note">{t("Every exchange in both phases is reviewed and accepted")}</span></div>
      <div className="pmap-layer"><Node n={6} wide /><span className="pmap-note">{t("Health and safety information flows through the whole life")}</span></div>
      <div className="pmap-layer pmap-base"><Node n={1} wide /><span className="pmap-note">{t("The foundation: shared terms, requirements, PIM, AIM and the CDE")}</span></div>
    </div>
  );
}

function Overview() {
  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">ISO 19650 · LEARNING HUB</div><h1>All six parts</h1>
        <p>Start with how the parts fit together, then open a part for its explanation, clauses, practical examples from real projects, questions and answers, and a short quiz.</p>
        <div className="facts"><span>6 parts</span><span>{[1, 2, 3, 4, 5, 6].reduce((a, n) => a + practiceFor(n).examples.length + 1, 0)} practical examples</span><span>{[1, 2, 3, 4, 5, 6].reduce((a, n) => a + practiceFor(n).faq.length, 0)} questions & answers</span><span>AI tutor</span></div>
      </div>
      <RevisionNotice />

      <Box title="How the six parts fit together">
        <PartsDiagram />
        <div className="grid g3" style={{ marginTop: 14 }}>
          {PART_ROLES.map((r) => (
            <a key={r.part} href={`#/parts/19650-${r.part}`} className="hub-tile" style={{ color: "inherit" }}>
              <b>Part {r.part} · {t(r.short)}</b><div className="small" style={{ marginTop: 4 }}>{t(r.role)}</div><div className="small muted" style={{ marginTop: 6 }}>→ {t(r.feeds)}</div>
            </a>))}
        </div>
      </Box>

      <Box title="Which part applies at each stage">
        <div className="table-wrap"><table className="data hub-table parts-stage">
          <thead><tr><th>{t("Stage")}</th>{[1, 2, 3, 4, 5, 6].map((n) => <th key={n} style={{ textAlign: "center" }}>Part {n}</th>)}</tr></thead>
          <tbody>{PART_STAGES.map((s) => (
            <tr key={s.stage}><td><b>{t(s.stage)}</b><div className="small muted">{t(s.what)}</div></td>
              {[1, 2, 3, 4, 5, 6].map((n) => <td key={n} style={{ textAlign: "center" }}>{s.use[n] === "core" ? <span className="use-dot core" title={t("Main part at this stage")}>●</span> : s.use[n] === "applies" ? <span className="use-dot" title={t("Also applies")}>○</span> : ""}</td>)}
            </tr>))}</tbody>
        </table></div>
        <div className="small muted" style={{ marginTop: 6 }}>● {t("Main part at this stage")} · ○ {t("Also applies")}</div>
      </Box>

      <Box title="How each part links to the others">
        <div className="grid g2">{PART_LINKS.map((l) => (
          <div key={`${l.from}-${l.to}`} className="row" style={{ flexWrap: "nowrap", gap: 10, alignItems: "start" }}>
            <span className="badge" style={{ flexShrink: 0 }}>{l.from} → {l.to}</span><span className="small">{t(l.how)}</span>
          </div>))}</div>
      </Box>

      <Box title="Open a part">
        <div className="grid g3">
          {partDetails19650.map((p) => (
            <a key={p.id} className="hub-tile" href={`#/parts/${p.id}`} style={{ color: "inherit", display: "grid", gap: 8 }}>
              <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
                <span className="part-num">{p.number}</span>
                <div><b style={{ fontSize: 15 }}>{p.title}</b><div className="small muted">{p.edition}</div></div>
              </div>
              <div className="small">{p.oneLiner}</div>
              <Progress part={p} />
            </a>))}
        </div>
      </Box>
    </div>
  );
}

const REVISION_NOTE: Record<number, string> = {
  1: "The 2026 draft revises the concepts for whole-life information management and simplifies the terms.",
  2: "The 2026 draft widens this process to the whole asset life and is retitled 'Information management process'.",
  3: "The 2026 draft turns this part into guidance for the unified process in Part 2.",
};

/** Points to the 2026 revision hub; on a part page, says what the draft changes for that part. */
function RevisionNotice({ part }: { part?: number }) {
  return (
    <a href="#/hubs/revision-2026" className="hub-tile row spread" style={{ ...cv(TONES.red), color: "inherit" }}>
      <span><b>ISO 19650 is being revised (2026 drafts)</b><span className="small" style={{ display: "block", marginTop: 2 }}>{part ? REVISION_NOTE[part] : "Parts 1, 2 and 3 are being revised into one whole-life process."} The current editions stay in force until the new ones are published.</span></span>
      <span className="btn">What is changing →</span>
    </a>
  );
}

function Progress({ part }: { part: PartDetail }) {
  const done = load<number[]>(`bim:part-check:${part.id}`, []).length;
  const pct = part.checklist.length ? Math.round((done / part.checklist.length) * 100) : 0;
  return <div className="small muted"><div className="progress" style={{ marginBottom: 4 }}><div style={{ width: pct + "%" }} /></div>Checklist {done}/{part.checklist.length}</div>;
}

// ---------------------------------------------------------------- part tabs

function Quiz({ partId, items }: { partId: string; items: PracticeQuiz[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const answered = Object.keys(picked).length;
  const score = items.filter((q, i) => picked[i] === q[2]).length;
  useEffect(() => { if (answered === items.length) store(`bim:part-quiz:${partId}`, { score, of: items.length, at: Date.now() }); }, [answered, items.length, partId, score]);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="row spread"><span className="small muted">{answered}/{items.length} {t("answered")}</span>{answered === items.length && <b>{t("Score")}: {score}/{items.length}</b>}
        {answered > 0 && <button className="small" onClick={() => setPicked({})}>{t("Start again")}</button>}</div>
      {items.map(([q, options, right, why], i) => {
        const p = picked[i];
        return (
          <div key={i} className="hub-tile">
            <b>{i + 1}. {q}</b>
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
              {options.map((o, k) => (
                <button key={k} className={"choice" + (p === undefined ? "" : k === right ? " right" : k === p ? " wrong" : "")} disabled={p !== undefined} onClick={() => setPicked({ ...picked, [i]: k })}>{o}</button>
              ))}
            </div>
            {p !== undefined && <div className="small" style={{ marginTop: 8 }}><b>{p === right ? t("Correct.") : t("Not quite.")}</b> {why}</div>}
          </div>
        );
      })}
    </div>
  );
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [q, setQ] = useState("");
  const shown = items.filter((x) => !q || (x.q + " " + x.a + " " + t(x.q) + " " + t(x.a)).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <input placeholder={t("Search the questions…")} value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 10 }} />
      {shown.map((x, i) => (
        <details key={x.q} className="clause" open={i === 0 && !q}>
          <summary><b>{x.q}</b></summary>
          <p style={{ margin: "6px 0 2px" }}>{x.a}</p>
        </details>
      ))}
      {!shown.length && <p className="muted small">{t("No question matches.")}</p>}
    </>
  );
}

export default function PartsHub({ partId, tab: tabArg }: { partId?: string; tab?: string }) {
  const part = partId ? partDetailById(partId) : undefined;
  const [level, setLevelState] = useState<Level>(() => (part ? load<Level>(`bim:part-level:${part.id}`, "beginner") : "beginner"));
  const [checked, setChecked] = useState<number[]>(() => (part ? load<number[]>(`bim:part-check:${part.id}`, []) : []));
  useEffect(() => { if (part) markVisited("parts", part.id, `/parts/${part.id}`, `ISO 19650 Part ${part.number} — ${part.title}`); }, [part]);
  if (!part) return <Overview />;

  const tab: Tab = (TABS.find((x) => x.id === tabArg)?.id ?? "overview");
  const practice = practiceFor(part.number);
  const prevPart = partDetails19650[part.number - 2], nextPart = partDetails19650[part.number];
  const setLevel = (l: Level) => { setLevelState(l); store(`bim:part-level:${part.id}`, l); };
  const toggle = (i: number) => { const next = checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i]; setChecked(next); store(`bim:part-check:${part.id}`, next); };
  const lv = part.levels[level];
  const tplFor = (code?: string) => (code ? templates.find((x) => x.code === code) : undefined);
  const pct = Math.round((checked.length / Math.max(1, part.checklist.length)) * 100);
  const count: Partial<Record<Tab, number>> = { clauses: part.clauses.length, examples: practice.examples.length + 1, qa: practice.faq.length, quiz: practice.quiz.length, documents: part.keyDocuments.length };
  const role = PART_ROLES.find((r) => r.part === part.number)!;

  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero">
        <div className="row" style={{ flexWrap: "nowrap", gap: 18, alignItems: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, opacity: .9 }}>{part.number}</div>
          <div><div className="eyebrow">ISO 19650 · {part.edition}</div><h1>{part.title}</h1><p>{part.oneLiner}</p></div>
        </div>
      </div>
      <div className="hub-sections">
        <a href="#/parts">All parts</a>
        {partDetails19650.map((p) => <a key={p.id} className={p.id === part.id ? "on" : ""} href={`#/parts/${p.id}/${tab}`}>Part {p.number}</a>)}
      </div>
      <nav className="tabs" aria-label="Part sections">
        {TABS.map((x) => <a key={x.id} className={"tab" + (tab === x.id ? " on" : "")} href={`#/parts/${part.id}/${x.id}`}>{t(x.label)}{count[x.id] ? <span className="tab-count">{count[x.id]}</span> : null}</a>)}
      </nav>

      {tab === "overview" && <>
        {part.number <= 3 && <RevisionNotice part={part.number} />}
        <div className="grid g2">
          <div className="hub-tile"><b>In plain terms</b><div style={{ marginTop: 4 }}>{part.plainTerms}</div></div>
          <div className="hub-tile"><b>Why it matters</b><div style={{ marginTop: 4 }}>{part.whyItMatters}</div></div>
        </div>
        <div className="hub-tile"><b>{t("Its place in the series")}</b><div style={{ marginTop: 4 }}>{t(role.role)}</div><div className="small muted" style={{ marginTop: 4 }}>→ {t(role.feeds)} <a href="#/parts">{t("See how all six parts connect")} →</a></div></div>
        <div className="row small">{part.whoUsesIt.map((w) => <span key={w} className="badge">{w}</span>)}</div>
        <div className="seg">{LEVELS.map((l) => <button key={l.id} className={level === l.id ? "on" : ""} onClick={() => setLevel(l.id)} title={t(l.hint)}>{t(l.label)}</button>)}</div>
        <Box title={`${t(LEVELS.find((l) => l.id === level)!.label)} · ${t(LEVELS.find((l) => l.id === level)!.hint)}`}>
          <p style={{ marginTop: 0, fontSize: 15 }}>{lv.summary}</p>
          <ol style={{ margin: 0, paddingInlineStart: 20, display: "grid", gap: 6 }}>{lv.points.map((x, i) => <li key={i}>{x}</li>)}</ol>
        </Box>
        <Box title="Key concepts">
          <div className="grid g3">{part.keyConcepts.map((k) => <div key={k.term} className="hub-tile"><b>{k.term}</b><div className="small" style={{ marginTop: 4 }}>{k.explanation}</div></div>)}</div>
        </Box>
        <Box title="Links to other parts and standards">
          {part.interfaces.map((x) => <div key={x.ref} style={{ marginBottom: 8, borderInlineStart: "3px solid var(--hub)", paddingInlineStart: 10 }}><b>{x.ref}</b><div className="small muted">{x.relation}</div></div>)}
        </Box>
      </>}

      {tab === "clauses" && <>
        <div className="grid g2" style={{ alignItems: "start" }}>
          <Box title="Key requirements"><ul style={{ margin: 0 }}>{part.keyRequirements.map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}</ul></Box>
          <Box title={`${t("Compliance checklist")} · ${checked.length}/${part.checklist.length}`}>
            <div className="progress" style={{ marginBottom: 8 }}><div style={{ width: `${pct}%`, background: "var(--ok)" }} /></div>
            {part.checklist.map((x, i) => <label key={i} className={"hub-check small" + (checked.includes(i) ? " done" : "")}><input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} style={{ marginTop: 2 }} /><span>{x}</span></label>)}
            <div className="tiny muted">Ticks are saved in this browser.</div>
          </Box>
        </div>
        <Box title="Deep dive — clause by clause">
          {part.clauses.map((cl) => (
            <details key={cl.ref} className="clause">
              <summary><span className="badge" style={{ marginInlineEnd: 6 }}>{cl.ref}</span>{cl.title}</summary>
              <div>
                <p className="muted" style={{ marginTop: 4 }}>{cl.summary}</p>
                <ul>{cl.requirements.map((x, i) => <li key={i}>{x}</li>)}</ul>
                {!!cl.outputs?.length && <div className="small">Outputs: {cl.outputs.map((o) => <span key={o} className="badge" style={{ marginInlineEnd: 4 }}>{o}</span>)}</div>}
              </div>
            </details>
          ))}
        </Box>
      </>}

      {tab === "examples" && <>
        <Box title={`${t("Worked example")} — ${part.workedExample.title}`}>
          <p style={{ marginTop: 0 }}>{part.workedExample.scenario}</p>
          <ol style={{ margin: "0 0 10px", paddingInlineStart: 20, display: "grid", gap: 4 }}>{part.workedExample.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <div className="hub-tile" style={cv("var(--ok)")}><b>Outcome:</b> {part.workedExample.outcome}</div>
        </Box>
        {practice.examples.map((ex) => (
          <Box key={ex.title} title={ex.title}>
            <p style={{ marginTop: 0 }}>{ex.situation}</p>
            <div className="small muted" style={{ marginBottom: 6 }}><b>{t("Led by")}:</b> {ex.lead}</div>
            <ol style={{ margin: "0 0 10px", paddingInlineStart: 20, display: "grid", gap: 4 }}>{ex.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <div className="hub-tile row spread" style={cv("var(--ok)")}><span><b>{t("Result")}:</b> {ex.result}</span>{ex.tool && <a className="btn small" href={"#" + ex.tool.path}>{ex.tool.label} →</a>}</div>
          </Box>
        ))}
      </>}

      {tab === "qa" && <Box title={`${t("Questions & answers")} · Part ${part.number}`}><Faq items={practice.faq} /></Box>}
      {tab === "quiz" && <Box title={`${t("Quiz")} · Part ${part.number}`}><Quiz key={part.id} partId={part.id} items={practice.quiz} /><a className="small" href="#/learn">{t("More practice: full question bank and mock exam")} →</a></Box>}

      {tab === "documents" && <>
        <Box title="Key documents">
          <div className="grid g2">{part.keyDocuments.map((d) => { const tp = tplFor(d.templateCode); return (
            <div key={d.name} className="hub-tile">
              <div className="row spread"><b>{d.name}</b>{tp && <a className="small" href={`#/knowledge/${tp.standard}/templates/${tp.id}`}>Open template ↗</a>}</div>
              <div className="small">{d.purpose}</div>
            </div>); })}</div>
          <a className="small" href="#/ai-tools/generate">Draft any of these with the AI document generator ↗</a>
        </Box>
        <Box title="Common mistakes and how to avoid them">
          <div className="table-wrap"><table className="data hub-table"><thead><tr><th style={{ width: "45%" }}>✗ Mistake</th><th>✓ Fix</th></tr></thead>
            <tbody>{part.commonMistakes.map((m, i) => <tr key={i}><td style={{ color: "var(--danger)" }}>{m.mistake}</td><td>{m.fix}</td></tr>)}</tbody></table></div>
        </Box>
      </>}

      {tab === "ask" && <Box title={`Ask AI about Part ${part.number}`}>
        <AskPartChat partId={part.id} partLabel={`Part ${part.number}`} suggestions={[
          `Explain Part ${part.number} to a new BIM coordinator`,
          `What evidence would an auditor ask for on Part ${part.number}?`,
          `Common mistakes with ${part.keyDocuments[0]?.name ?? "the key documents"}`,
        ]} />
      </Box>}

      <div className="row spread">
        {prevPart ? <a href={`#/parts/${prevPart.id}/${tab}`} className="hub-tile" style={{ color: "inherit", flex: "1 1 220px" }}><span className="small muted">← Previous part</span><div><b>Part {prevPart.number} — {prevPart.title}</b></div></a> : <span />}
        {nextPart ? <a href={`#/parts/${nextPart.id}/${tab}`} className="hub-tile" style={{ color: "inherit", flex: "1 1 220px", textAlign: "end" }}><span className="small muted">Next part →</span><div><b>Part {nextPart.number} — {nextPart.title}</b></div></a>
          : <a href="#/hubs" className="hub-tile" style={{ color: "inherit", flex: "1 1 220px", textAlign: "end" }}><span className="small muted">All six parts done?</span><div><b>Go deeper in the topic hubs →</b></div></a>}
      </div>
      <p className="tiny muted">Paraphrased guidance, not the standard's text. Always verify against the licensed edition of {part.edition}.</p>
    </div>
  );
}
