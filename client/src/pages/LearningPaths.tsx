import { useState, type CSSProperties } from "react";
import { t } from "../i18n";
import { LEARNING_PATHS, pathById, pathMinutes, type LearningPath, type StepKind } from "../../../shared/data/learningPaths";
import { TONES } from "./HubPage";
import "./learningPaths.css";

// Learning paths by role: /learning-paths and /learning-paths/:id. Progress is kept per path in this browser.

const KIND_LABEL: Record<StepKind, string> = { read: "Read", practise: "Practise", tool: "Tool", quiz: "Quiz" };
const TONE_OF: Record<string, string> = { modeller: TONES.blue, coordinator: TONES.teal, "bim-manager": TONES.purple, client: TONES.green, "ai-governance": TONES.red };
const tone = (p: LearningPath) => TONE_OF[p.id] ?? TONES.blue;

const key = (id: string) => `bim:path:${id}`;
const loadDone = (id: string): number[] => { try { const v = localStorage.getItem(key(id)); const a = v ? JSON.parse(v) : []; return Array.isArray(a) ? a.filter((x) => typeof x === "number") : []; } catch { return []; } };
const saveDone = (id: string, v: number[]) => { try { localStorage.setItem(key(id), JSON.stringify(v)); } catch { /* storage unavailable */ } };
const hours = (m: number) => (m >= 60 ? `${Math.round(m / 6) / 10} h` : `${m} min`);

function Progress({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="lp-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={t("Progress")}>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      <span className="tiny muted">{done}/{total} {t("steps done")} · {pct}%</span>
    </div>
  );
}

function Index() {
  const total = LEARNING_PATHS.reduce((a, p) => a + p.steps.length, 0);
  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">ISO 19650 · ISO/IEC 42001 · {t("LEARNING PATHS")}</div><h1>{t("Learning paths by role")}</h1>
        <p>{t("A step-by-step plan through the platform for your role: what to read, which tools to try and which quizzes prove you are ready.")}</p>
        <div className="facts"><span>{LEARNING_PATHS.length} {t("paths")}</span><span>{total} {t("steps")}</span><span>{t("Progress saved in this browser")}</span></div>
      </div>
      <div className="lp-cards">
        {LEARNING_PATHS.map((p) => { const done = loadDone(p.id).filter((i) => i < p.steps.length).length; return (
          <a key={p.id} className="hub-card lp-card" href={`#/learning-paths/${p.id}`} style={{ "--c": tone(p) } as CSSProperties}>
            <div className="hub-title">{t(p.role)}</div>
            <b className="lp-card-title">{t(p.title)}</b>
            <p className="small muted">{t(p.summary)}</p>
            <div className="lp-meta"><span className="badge">{p.weeks} {t("weeks")}</span><span className="badge">{p.steps.length} {t("steps")}</span><span className="badge">{hours(pathMinutes(p))}</span></div>
            <Progress done={done} total={p.steps.length} />
          </a>); })}
      </div>
      <p className="tiny muted">{t("Paths link to paraphrased guidance on this platform; always check the licensed editions of the standards.")}</p>
    </div>
  );
}

function PathView({ p }: { p: LearningPath }) {
  const [done, setDone] = useState<number[]>(() => loadDone(p.id));
  const toggle = (i: number) => { const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i].sort((a, b) => a - b); setDone(next); saveDone(p.id, next); };
  const reset = () => { setDone([]); saveDone(p.id, []); };
  const count = done.filter((i) => i < p.steps.length).length;
  const nextStep = p.steps.findIndex((_, i) => !done.includes(i));
  return (
    <div className="hub" style={{ "--hub": tone(p) } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">{t("LEARNING PATH")} · {t(p.role)}</div><h1>{t(p.title)}</h1><p>{t(p.summary)}</p>
        <div className="facts"><span>{p.weeks} {t("weeks")}</span><span>{p.steps.length} {t("steps")}</span><span>{hours(pathMinutes(p))}</span></div>
      </div>
      <div className="row spread lp-top">
        <a className="small" href="#/learning-paths">← {t("All learning paths")}</a>
        <div className="row" style={{ gap: 8 }}>
          {nextStep >= 0 && <a className="btn primary" href={"#" + p.steps[nextStep].href}>{t("Continue")}: {t(p.steps[nextStep].title)} →</a>}
          {count > 0 && <button className="ghost small" onClick={reset}>{t("Reset progress")}</button>}
        </div>
      </div>
      <div className="hub-card"><Progress done={count} total={p.steps.length} /></div>
      <ol className="lp-steps">
        {p.steps.map((s, i) => { const on = done.includes(i); return (
          <li key={s.title} className={"lp-step" + (on ? " done" : "")}>
            <span className="lp-n" aria-hidden="true">{on ? "✓" : i + 1}</span>
            <div className="lp-body">
              <div className="lp-head"><b>{t(s.title)}</b><span className={`lp-kind k-${s.kind}`}>{t(KIND_LABEL[s.kind])}</span><span className="tiny muted">{s.minutes} min</span></div>
              <p className="small muted">{t(s.why)}</p>
              <div className="row" style={{ gap: 10 }}>
                <a className="btn small" href={"#" + s.href}>{t("Open")} →</a>
                <label className="lp-tick small"><input type="checkbox" checked={on} onChange={() => toggle(i)} /> {t("Mark as done")}</label>
              </div>
            </div>
          </li>); })}
      </ol>
      {count === p.steps.length && <div className="hub-card lp-finish"><b>{t("Path complete.")}</b> <span className="small">{t("Try the mock exams on the Learn page to confirm what you have learned.")}</span> <a className="small" href="#/learn">{t("Go to Learn")} →</a></div>}
    </div>
  );
}

export default function LearningPaths({ id }: { id?: string }) {
  const p = id ? pathById(id) : undefined;
  return p ? <PathView key={p.id} p={p} /> : <Index />;
}
