import { useEffect, useMemo, useState } from "react";
import { QUESTIONS, SCENARIOS, TOPICS, type Question } from "../../../shared/data/learn";
import { api, fmtDate } from "../lib/api";

interface Attempt { id: string; mode: string; topic: string; score: number; total: number; seconds: number; createdAt: string }
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const EXAM = { count: 30, minutes: 40, pass: 0.65 };

function Quiz({ questions, mode, topic, onDone }: { questions: Question[]; mode: "practice" | "exam"; topic: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState(false);
  const [start] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState<{ score: number; total: number; byTopic: Record<string, [number, number]> } | null>(null);
  const left = mode === "exam" ? Math.max(0, EXAM.minutes * 60 - Math.floor((now - start) / 1000)) : null;
  useEffect(() => { if (mode !== "exam" || result) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [mode, result]);
  const submit = async () => { const r = await api<typeof result>("/learn/attempts", { body: { mode, topic, answers, seconds: Math.round((Date.now() - start) / 1000) } }); setResult(r); };
  useEffect(() => { if (left === 0 && !result) submit(); }); // time up
  if (result) {
    const pct = result.score / result.total;
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{result.score} / {result.total} ({Math.round(pct * 100)}%) {mode === "exam" && <span style={{ color: pct >= EXAM.pass ? "var(--ok)" : "var(--danger)" }}>{pct >= EXAM.pass ? "— Pass" : "— Not yet"}</span>}</h2>
        {Object.entries(result.byTopic).map(([t, [c, n]]) => <div key={t} className="bar-row"><span className="small">{t}</span><span className="bar"><span style={{ width: `${(c / n) * 100}%` }} /></span><b className="small">{c}/{n}</b></div>)}
        <h3>Review</h3>
        {questions.map((q) => <div key={q.id} className="small" style={{ marginBottom: 8 }}><b>{answers[q.id] === q.answer ? "✔" : "✖"} {q.q}</b><div>Answer: {q.options[q.answer]}</div><div className="muted">{q.why}</div></div>)}
        <button className="primary" onClick={onDone}>Done</button>
      </div>
    );
  }
  const q = questions[i];
  const chosen = answers[q.id];
  return (
    <div className="card">
      <div className="row spread"><span className="small muted">Question {i + 1} of {questions.length} · {q.topic}</span>{left !== null && <b className={left < 300 ? "error" : ""}>⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</b>}</div>
      <h3>{q.q}</h3>
      <div style={{ display: "grid", gap: 6 }}>{q.options.map((o, k) => {
        const show = mode === "practice" && revealed;
        return <button key={k} className={"choice" + (chosen === k ? " on" : "") + (show && k === q.answer ? " right" : show && chosen === k ? " wrong" : "")} disabled={mode === "practice" && revealed}
          onClick={() => setAnswers({ ...answers, [q.id]: k })}>{o}</button>;
      })}</div>
      {mode === "practice" && revealed && <p className="small" style={{ marginTop: 8 }}>{chosen === q.answer ? "✔ Correct. " : "✖ Not quite. "}{q.why}</p>}
      <div className="row spread" style={{ marginTop: 12 }}>
        <button disabled={i === 0} onClick={() => { setI(i - 1); setRevealed(false); }}>← Back</button>
        <div className="row">
          {mode === "practice" && !revealed && <button disabled={chosen === undefined} onClick={() => setRevealed(true)}>Check</button>}
          {i < questions.length - 1 ? <button className="primary" disabled={chosen === undefined || (mode === "practice" && !revealed)} onClick={() => { setI(i + 1); setRevealed(false); }}>Next →</button>
            : <button className="primary" disabled={Object.keys(answers).length < questions.length && mode === "practice"} onClick={submit}>Finish</button>}
        </div>
      </div>
      {mode === "exam" && <p className="tiny muted">{Object.keys(answers).length}/{questions.length} answered · you can go back and change answers until you finish.</p>}
    </div>
  );
}

function ScenarioPlayer({ id, onDone }: { id: string; onDone: () => void }) {
  const s = SCENARIOS.find((x) => x.id === id)!;
  const [step, setStep] = useState<number | null>(0);
  const [log, setLog] = useState<{ q: string; a: string; fb: string; score: number }[]>([]);
  const max = s.steps.length * 2;
  if (step === null) {
    const total = log.reduce((a, x) => a + x.score, 0);
    return <div className="card"><h2 style={{ marginTop: 0 }}>{s.title} — {total}/{max}</h2>{log.map((x, i) => <div key={i} className="small" style={{ marginBottom: 8 }}><b>{x.q}</b><div>You chose: {x.a}</div><div className={x.score === 2 ? "" : "muted"}>{x.fb}</div></div>)}<button className="primary" onClick={onDone}>Done</button></div>;
  }
  const st = s.steps[step];
  return (
    <div className="card">
      <div className="small muted">{s.topic} · step {step + 1} of {s.steps.length}</div>
      <h3>{st.text}</h3>
      <div style={{ display: "grid", gap: 6 }}>{st.choices.map((c) => <button key={c.label} className="choice" onClick={() => { setLog([...log, { q: st.text, a: c.label, fb: c.feedback, score: c.score }]); setStep(c.next); }}>{c.label}</button>)}</div>
    </div>
  );
}

export default function Learn() {
  const [run, setRun] = useState<{ mode: "practice" | "exam"; topic: string; qs: Question[] } | { scenario: string } | null>(null);
  const [hist, setHist] = useState<{ attempts: Attempt[]; profile: Record<string, [number, number]> } | null>(null);
  const load = () => api<typeof hist>("/learn/attempts").then(setHist);
  useEffect(() => { load(); }, []);
  const counts = useMemo(() => Object.fromEntries(TOPICS.map((t) => [t, QUESTIONS.filter((q) => q.topic === t).length])), []);
  const done = () => { setRun(null); load(); };
  if (run) return <>{"scenario" in run ? <ScenarioPlayer id={run.scenario} onDone={done} /> : <Quiz questions={run.qs} mode={run.mode} topic={run.topic} onDone={done} />}<button className="ghost" style={{ marginTop: 8 }} onClick={() => setRun(null)}>Leave</button></>;
  const weakest = hist ? Object.entries(hist.profile).filter(([, [, n]]) => n >= 3).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])[0] : undefined;

  return (
    <>
      <div className="page-head"><h1>Learn</h1><p className="muted">Practice questions by topic, a timed mock exam, and decision scenarios. Questions are written for learning and paraphrase the standards — always check the licensed editions.</p></div>
      <div className="grid g2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Practice by topic</h3>
          {TOPICS.map((t) => <div key={t} className="row spread" style={{ marginBottom: 6 }}><span>{t} <span className="tiny muted">({counts[t]})</span></span><button className="small" onClick={() => setRun({ mode: "practice", topic: t, qs: shuffle(QUESTIONS.filter((q) => q.topic === t)) })}>Practise</button></div>)}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Mock exam</h3>
          <p className="small">{Math.min(EXAM.count, QUESTIONS.length)} questions across all topics · {EXAM.minutes} minutes · pass mark {EXAM.pass * 100}%. No feedback until you finish.</p>
          <button className="primary" onClick={() => setRun({ mode: "exam", topic: "", qs: shuffle(QUESTIONS).slice(0, EXAM.count) })}>Start mock exam</button>
          <h3>Scenarios</h3>
          {SCENARIOS.map((s) => <div key={s.id} className="row spread" style={{ marginBottom: 6 }}><span>{s.title} <span className="tiny muted">{s.topic}</span></span><button className="small" onClick={() => setRun({ scenario: s.id })}>Play</button></div>)}
        </div>
      </div>
      {hist && hist.attempts.length > 0 && <div className="grid g2" style={{ marginTop: 14 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Skill profile</h3>
          {Object.entries(hist.profile).map(([t, [c, n]]) => <div key={t} className="bar-row"><span className="small">{t}</span><span className="bar"><span style={{ width: `${(c / n) * 100}%` }} /></span><b className="small">{Math.round((c / n) * 100)}%</b></div>)}
          {weakest && <p className="small">Focus next on <b>{weakest[0]}</b>.</p>}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent results</h3>
          <table className="data"><tbody>{hist.attempts.slice(0, 10).map((a) => <tr key={a.id}><td className="small">{fmtDate(a.createdAt)}</td><td className="small">{a.mode === "exam" ? "Mock exam" : a.topic}</td><td><b>{a.score}/{a.total}</b></td><td className="small muted">{Math.round(a.seconds / 60)} min</td></tr>)}</tbody></table>
        </div>
      </div>}
    </>
  );
}
