import { useEffect, useState, type CSSProperties } from "react";
import { getLocale, t } from "../i18n";
import { api } from "../lib/api";
import { embedFor, placementsOf, type CompanyVideo } from "../../../shared/companyVideos";
import { AutodeskNext, type Cert } from "./Certificate";
import { LEARNING_PATHS, pathById, pathMinutes, type LearningPath, type StepKind } from "../../../shared/data/learningPaths";
import { pathVideoCount, stepVideos } from "../../../shared/data/pathVideos";
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

// Our own videos (Admin › Our videos, placed on paths and steps), loaded once per visit.
let oursCache: Promise<CompanyVideo[]> | null = null;
function useOurVideos() {
  const [v, setV] = useState<CompanyVideo[]>([]);
  useEffect(() => { (oursCache ??= api<{ videos: CompanyVideo[] }>("/company-videos").then((r) => r.videos).catch(() => [])).then(setV); }, []);
  return v;
}
const placedOn = (ours: CompanyVideo[], pathId: string, step: string) => ours.filter((v) => placementsOf(v).some((p) => p.pathId === pathId && p.step === step));

interface Clip { key: string; ours: boolean; title: string; by: string; thumb: string; embed: string; file: string; open: string; lang: string; level: string; summary: string }
const fromOurs = (v: CompanyVideo): Clip => ({ key: "o:" + v.id, ours: true, title: v.title, by: v.uploadedByName, lang: v.lang, level: "", summary: v.description,
  thumb: v.source === "youtube" ? `https://i.ytimg.com/vi/${v.url}/mqdefault.jpg` : "", embed: v.source === "file" ? "" : embedFor(v.source, v.url) + "?autoplay=1&rel=0",
  file: v.source === "file" ? `/api/company-videos/${v.id}/file` : "", open: v.source === "youtube" ? `https://www.youtube.com/watch?v=${v.url}` : v.source === "vimeo" ? `https://vimeo.com/${v.url}` : "" });

/** Videos for a step or a path: ours first, then the curated library, in the interface language first; they play inline. */
function StepVideos({ pathId, title, ours }: { pathId: string; title: string; ours: CompanyVideo[] }) {
  const lang = getLocale() === "ar" ? "ar" : "en";
  const lib: Clip[] = title ? stepVideos(pathId, title, lang).map((v) => ({ key: "l:" + v.id, ours: false, title: v.title, by: v.channel, lang: v.lang, level: v.level, summary: lang === "ar" ? v.summaryAr : v.summary,
    thumb: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`, embed: `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`, file: "", open: `https://www.youtube.com/watch?v=${v.id}` })) : [];
  const mine = placedOn(ours, pathId, title).map(fromOurs);
  const clips = [...mine.filter((c) => c.lang === lang), ...mine.filter((c) => c.lang !== lang), ...lib.filter((c) => !mine.some((m) => m.open && m.open === c.open))];
  const [playing, setPlaying] = useState<string | null>(null);
  if (!clips.length) return null;
  const current = clips.find((v) => v.key === playing);
  const play = (c: Clip) => { setPlaying(c.key === playing ? null : c.key); if (c.ours && c.key !== playing) api(`/company-videos/${c.key.slice(2)}/view`, { method: "POST" }).catch(() => {}); };
  return (
    <div className="lp-videos">
      <div className="tiny muted lp-videos-label">▶ {title ? t("Videos for this step") : t("Our videos for this path")} ({clips.length}){mine.length > 0 && title && <> · <b>{mine.length} {t("from our team")}</b></>}</div>
      {current && (
        <div className="lp-player">
          <div className="lp-frame">
            {current.file ? <video src={current.file} controls autoPlay playsInline />
              : <iframe src={current.embed} title={current.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
          </div>
          <div className="row spread lp-player-bar">
            <span className="small"><b className="no-i18n" dir="auto">{current.title}</b> <span className="muted">· {current.by}</span></span>
            <span className="row" style={{ gap: 8 }}>
              {current.open && <a className="small" href={current.open} target="_blank" rel="noreferrer">{t("Open on YouTube")} ↗</a>}
              <button className="ghost small" onClick={() => setPlaying(null)}>{t("Close video")}</button>
            </span>
          </div>
        </div>
      )}
      <div className="lp-thumbs">
        {clips.map((v) => (
          <button key={v.key} className={"lp-thumb" + (v.key === playing ? " on" : "") + (v.ours ? " ours" : "")} onClick={() => play(v)} title={v.summary} aria-pressed={v.key === playing}>
            <span className="lp-thumb-img">{v.thumb ? <img src={v.thumb} alt="" loading="lazy" width={320} height={180} /> : v.file ? <video src={v.file + "#t=1"} preload="metadata" muted playsInline tabIndex={-1} /> : <span className="lp-thumb-vimeo">Vimeo</span>}<span className="lp-play" aria-hidden="true">▶</span></span>
            <span className="lp-thumb-text">
              <b className="no-i18n" dir="auto">{v.title}</b>
              <span className="tiny muted no-i18n" dir="auto">{v.by}</span>
              <span className="lp-thumb-tags">{v.ours && <span className="badge lp-ours">{t("Our video")}</span>}{v.level && <span className="badge">{t(v.level)}</span>}{v.lang !== lang && <span className="badge">{v.lang === "ar" ? "عربي" : "English"}</span>}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- final exam and certificate

interface ExamQ { id: string; topic: string; q: string; options: string[] }
interface ExamStart { examId: string; expiresAt: string; minutes: number; passMark: number; questions: ExamQ[] }
interface ExamResult { score: number; total: number; pct: number; passed: boolean; late: boolean; passMark: number; byTopic: Record<string, [number, number]>;
  review: { id: string; topic: string; q: string; options: string[]; answer: number; given: number; ok: boolean; why: string }[]; certificate: Cert | null; autodeskUrl: string }
interface ExamInfo { certificates: Cert[]; exams: Record<string, { attemptsToday: number; best: number }>; passMark: number; attemptsPerDay: number; sizes: Record<string, { questions: number; minutes: number } | null> }

function useExamInfo() {
  const [info, setInfo] = useState<ExamInfo | null>(null);
  const load = () => api<ExamInfo>("/learn/exams").then(setInfo).catch(() => setInfo(null));
  useEffect(() => { load(); }, []);
  return [info, load] as const;
}

function ExamRunner({ start, onDone }: { start: ExamStart; onDone: (r: ExamResult) => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [left, setLeft] = useState(() => Math.max(0, new Date(start.expiresAt).getTime() - Date.now()));
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy) return; setBusy(true);
    try { onDone(await api<ExamResult>(`/learn/exams/${start.examId}/submit`, { method: "POST", body: { answers } })); } catch (e) { alert((e as Error).message); setBusy(false); }
  };
  useEffect(() => { const i = setInterval(() => setLeft(Math.max(0, new Date(start.expiresAt).getTime() - Date.now())), 1000); return () => clearInterval(i); }, [start.expiresAt]);
  useEffect(() => { if (left === 0) void submit(); }, [left === 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = Object.keys(answers).length;
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  return (
    <div className="hub-card lp-exam">
      <div className="row spread lp-exam-bar">
        <b>{t("Final exam")} · {n}/{start.questions.length} {t("answered")}</b>
        <span className={"badge" + (left < 120000 ? " warn" : "")}>⏱ {mm}:{String(ss).padStart(2, "0")}</span>
      </div>
      <ol className="lp-exam-qs">
        {start.questions.map((q) => (
          <li key={q.id}><div className="small muted">{t(q.topic)}</div><b className="no-i18n">{q.q}</b>
            <div className="lp-exam-opts">{q.options.map((o, j) => (
              <label key={j} className={"lp-exam-opt" + (answers[q.id] === j ? " on" : "")}><input type="radio" name={q.id} checked={answers[q.id] === j} onChange={() => setAnswers({ ...answers, [q.id]: j })} /> <span className="no-i18n">{o}</span></label>))}</div>
          </li>))}
      </ol>
      <div className="row spread"><span className="small muted">{n < start.questions.length ? `${start.questions.length - n} ${t("questions unanswered — they count as wrong.")}` : t("All questions answered.")}</span>
        <button className="primary" disabled={busy} onClick={() => { if (n < start.questions.length && !confirm(t("Some questions are unanswered. Submit anyway?"))) return; void submit(); }}>{busy ? t("Marking…") : t("Submit exam")}</button></div>
    </div>
  );
}

function ExamResultView({ r, onRetake, canRetake }: { r: ExamResult; onRetake: () => void; canRetake: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className={"hub-card lp-result " + (r.passed ? "pass" : "fail")}>
      <div className="lp-result-score"><b>{r.pct}%</b><span>{r.score}/{r.total}</span></div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <h3 style={{ margin: "0 0 4px" }}>{r.passed ? t("Passed — congratulations!") : t("Not passed this time")}</h3>
        <p className="small">{r.passed ? t("Your certificate has been issued. Open it to print it or save it as PDF; share its link so anyone can check it.") : `${t("The pass mark is")} ${r.passMark}%. ${t("Review the answers below, revisit the steps for the weaker topics and try again.")}`}{r.late ? " " + t("The time had run out, so no answers were counted.") : ""}</p>
        <div className="lp-topics">{Object.entries(r.byTopic).map(([k, [c, n]]) => <span key={k} className="badge">{t(k)} {c}/{n}</span>)}</div>
        <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {r.certificate && <a className="btn primary" href={`#/certificate/${r.certificate.code}`}>🎓 {t("Open my certificate")}</a>}
          {!r.passed && canRetake && <button onClick={onRetake}>{t("Retake the exam")}</button>}
          <button className="ghost small" onClick={() => setShow(!show)}>{show ? t("Hide answers") : t("Review answers")}</button>
        </div>
      </div>
      {r.passed && <div style={{ flexBasis: "100%" }}><AutodeskNext url={r.autodeskUrl} /></div>}
      {show && <ol className="lp-review" style={{ flexBasis: "100%" }}>{r.review.map((q) => (
        <li key={q.id} className={q.ok ? "ok" : "bad"}><b className="no-i18n">{q.q}</b>
          <div className="small no-i18n">{q.ok ? "✓" : "✗"} {q.given >= 0 ? q.options[q.given] : t("(no answer)")}{!q.ok && <> — <b>{q.options[q.answer]}</b></>}</div>
          <div className="tiny muted no-i18n">{q.why}</div></li>))}</ol>}
    </div>
  );
}

function FinalExam({ p, ready }: { p: LearningPath; ready: boolean }) {
  const [info, reload] = useExamInfo();
  const [start, setStart] = useState<ExamStart | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [err, setErr] = useState("");
  if (!info) return null;
  const size = info.sizes[p.id];
  if (!size) return null;
  const cert = info.certificates.find((c) => c.pathId === p.id);
  const used = info.exams[p.id]?.attemptsToday ?? 0;
  const begin = async () => { setErr(""); setResult(null); try { setStart(await api<ExamStart>(`/learn/paths/${p.id}/exam`, { method: "POST" })); } catch (e) { setErr((e as Error).message); } };
  return (
    <section className="lp-final" id="final-exam">
      <h2>🎓 {t("Final exam and certificate")}</h2>
      {start && !result ? <ExamRunner start={start} onDone={(r) => { setResult(r); setStart(null); reload(); }} />
        : result ? <ExamResultView r={result} canRetake={used < info.attemptsPerDay} onRetake={begin} />
          : <div className="hub-card lp-exam-intro">
            <div className="lp-meta"><span className="badge">{size.questions} {t("questions")}</span><span className="badge">{size.minutes} min</span><span className="badge">{t("Pass mark")} {info.passMark}%</span><span className="badge">{info.attemptsPerDay - used} {t("attempts left today")}</span>{info.exams[p.id]?.best ? <span className="badge">{t("Best score")} {info.exams[p.id]!.best}%</span> : null}</div>
            <p className="small">{t("Questions are drawn at random from the topics of this path and marked by the portal. Score 75% or more to receive a certificate signed by the portal, which anyone can verify from its link.")}</p>
            {cert ? <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><span className="badge ok">✓ {t("Certificate earned")} · {cert.pct}%</span><a className="btn primary" href={`#/certificate/${cert.code}`}>🎓 {t("Open my certificate")}</a></div>
              : <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button className="primary" disabled={!ready || used >= info.attemptsPerDay} onClick={begin}>{t("Start the final exam")}</button>
                {!ready && <span className="small muted">{t("Mark every step as done to unlock the exam.")}</span>}
              </div>}
            {err && <div className="small" style={{ color: "var(--danger)", marginTop: 6 }}>{err}</div>}
          </div>}
    </section>
  );
}

function Index() {
  const total = LEARNING_PATHS.reduce((a, p) => a + p.steps.length, 0);
  const [info] = useExamInfo();
  const certOf = (id: string) => info?.certificates.find((c) => c.pathId === id);
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
            <div className="lp-meta"><span className="badge">{p.weeks} {t("weeks")}</span><span className="badge">{p.steps.length} {t("steps")}</span><span className="badge">{hours(pathMinutes(p))}</span>{pathVideoCount(p) > 0 && <span className="badge">▶ {pathVideoCount(p)} {t("videos")}</span>}<span className="badge">🎓 {t("Final exam")}</span>{certOf(p.id) && <span className="badge ok">✓ {t("Certified")}</span>}</div>
            <Progress done={done} total={p.steps.length} />
          </a>); })}
      </div>
      {info && info.certificates.length > 0 && <div className="hub-card"><b>🎓 {t("My certificates")}</b>
        <ul className="lp-certs">{info.certificates.map((c) => <li key={c.code}><a href={`#/certificate/${c.code}`}>{t(c.title)}</a> <span className="small muted">· {c.pct}% · {new Date(c.issuedAt).toLocaleDateString()} · <span className="mono">{c.code}</span></span></li>)}</ul></div>}
      <p className="tiny muted">{t("Paths link to paraphrased guidance on this platform; always check the licensed editions of the standards.")}</p>
    </div>
  );
}

function PathView({ p }: { p: LearningPath }) {
  const ours = useOurVideos();
  const [done, setDone] = useState<number[]>(() => loadDone(p.id));
  const toggle = (i: number) => { const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i].sort((a, b) => a - b); setDone(next); saveDone(p.id, next); };
  const reset = () => { setDone([]); saveDone(p.id, []); };
  const count = done.filter((i) => i < p.steps.length).length;
  const nextStep = p.steps.findIndex((_, i) => !done.includes(i));
  return (
    <div className="hub" style={{ "--hub": tone(p) } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">{t("LEARNING PATH")} · {t(p.role)}</div><h1>{t(p.title)}</h1><p>{t(p.summary)}</p>
        <div className="facts"><span>{p.weeks} {t("weeks")}</span><span>{p.steps.length} {t("steps")}</span><span>{hours(pathMinutes(p))}</span>{pathVideoCount(p) > 0 && <span>▶ {pathVideoCount(p)} {t("videos")}</span>}</div>
      </div>
      <div className="row spread lp-top">
        <a className="small" href="#/learning-paths">← {t("All learning paths")}</a>
        <div className="row" style={{ gap: 8 }}>
          {nextStep >= 0 && <a className="btn primary" href={"#" + p.steps[nextStep].href}>{t("Continue")}: {t(p.steps[nextStep].title)} →</a>}
          {count > 0 && <button className="ghost small" onClick={reset}>{t("Reset progress")}</button>}
        </div>
      </div>
      <div className="hub-card"><Progress done={count} total={p.steps.length} /></div>
      {placedOn(ours, p.id, "").length > 0 && <div className="hub-card"><StepVideos pathId={p.id} title="" ours={ours} /></div>}
      <ol className="lp-steps">
        {p.steps.map((s, i) => { const on = done.includes(i); return (
          <li key={s.title} className={"lp-step" + (on ? " done" : "")}>
            <span className="lp-n" aria-hidden="true">{on ? "✓" : i + 1}</span>
            <div className="lp-body">
              <div className="lp-head"><b>{t(s.title)}</b><span className={`lp-kind k-${s.kind}`}>{t(KIND_LABEL[s.kind])}</span><span className="tiny muted">{s.minutes} min</span></div>
              <p className="small lp-why">{t(s.why)}</p>
              <StepVideos pathId={p.id} title={s.title} ours={ours} />
              <div className="row" style={{ gap: 10 }}>
                <a className="btn small" href={"#" + s.href}>{s.kind === "read" ? t("Read the written lesson") : s.kind === "quiz" ? t("Open the quiz") : t("Open")} →</a>
                <label className="lp-tick small"><input type="checkbox" checked={on} onChange={() => toggle(i)} /> {t("Mark as done")}</label>
              </div>
            </div>
          </li>); })}
      </ol>
      {count === p.steps.length && <div className="hub-card lp-finish"><b>{t("Path complete.")}</b> <span className="small">{t("Take the final exam below to earn your certificate.")}</span></div>}
      <FinalExam p={p} ready={count === p.steps.length} />
    </div>
  );
}

export default function LearningPaths({ id }: { id?: string }) {
  const p = id ? pathById(id) : undefined;
  return p ? <PathView key={p.id} p={p} /> : <Index />;
}
