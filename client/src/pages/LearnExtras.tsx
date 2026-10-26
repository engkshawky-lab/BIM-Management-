import { useEffect, useState } from "react";
import { useSession } from "../App";
import { COURSES } from "../../../shared/data/courses";
import { Markdown } from "../components/Markdown";
import { api } from "../lib/api";

/** YouTube / Vimeo links become embeds; anything else is shown as a link. */
function Video({ url }: { url: string }) {
  const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/.exec(url)?.[1];
  const vm = /vimeo\.com\/(\d+)/.exec(url)?.[1];
  const src = yt ? `https://www.youtube-nocookie.com/embed/${yt}` : vm ? `https://player.vimeo.com/video/${vm}` : "";
  return src ? <div style={{ position: "relative", paddingTop: "56.25%", marginBottom: 12 }}><iframe src={src} title="Lesson video" allow="encrypted-media; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, borderRadius: 8 }} /></div>
    : <p><a href={url} target="_blank" rel="noreferrer">▶ Watch the lesson video</a></p>;
}

export function Courses({ onPractise }: { onPractise: (topic: string) => void }) {
  const { user, toast } = useSession();
  const [state, setState] = useState<{ completed: string[]; videos: Record<string, string> } | null>(null);
  const [open, setOpen] = useState<{ c: string; l: number } | null>(null);
  const load = () => api<typeof state>("/learn/courses").then(setState);
  useEffect(() => { load(); }, []);
  if (!state) return null;
  if (open) {
    const c = COURSES.find((x) => x.id === open.c)!; const l = c.lessons[open.l]; const key = `${c.id}/${l.id}`;
    const done = state.completed.includes(key);
    return (
      <div className="card">
        <button className="ghost small" onClick={() => setOpen(null)}>← {c.title}</button>
        <div className="small muted" style={{ marginTop: 6 }}>Lesson {open.l + 1} of {c.lessons.length} · {l.minutes} min</div>
        <h2>{l.title}</h2>
        {state.videos[key] && <Video url={state.videos[key]} />}
        <Markdown text={l.body} />
        {user.role === "admin" && <p className="tiny muted">Admin: <button className="linklike" onClick={async () => { const url = prompt("Video URL for this lesson (YouTube, Vimeo or any link; empty to remove)", state.videos[key] ?? ""); if (url === null) return; try { await api("/learn/videos", { method: "PUT", body: { key, url } }); load(); } catch (e) { toast((e as Error).message, "error"); } }}>{state.videos[key] ? "change" : "add"} lesson video</button></p>}
        <div className="row spread" style={{ marginTop: 12 }}>
          <button disabled={open.l === 0} onClick={() => setOpen({ ...open, l: open.l - 1 })}>← Previous</button>
          <div className="row">
            {!done && <button onClick={async () => { await api(`/learn/courses/${c.id}/${l.id}/complete`, { body: {} }); load(); }}>✔ Mark complete</button>}
            {open.l < c.lessons.length - 1 ? <button className="primary" onClick={async () => { if (!done) await api(`/learn/courses/${c.id}/${l.id}/complete`, { body: {} }); load(); setOpen({ ...open, l: open.l + 1 }); }}>Next lesson →</button>
              : <button className="primary" onClick={async () => { if (!done) await api(`/learn/courses/${c.id}/${l.id}/complete`, { body: {} }); setOpen(null); onPractise(c.topic); }}>Finish & practise questions →</button>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="grid g2" style={{ marginBottom: 14 }}>{COURSES.map((c) => {
      const n = c.lessons.filter((l) => state.completed.includes(`${c.id}/${l.id}`)).length;
      return (
        <div key={c.id} className="card">
          <div className="row spread"><b>{c.title}</b><span className="chip">{c.level}</span></div>
          <p className="small muted">{c.summary}</p>
          <div className="bar" style={{ marginBottom: 6 }}><span style={{ width: `${(n / c.lessons.length) * 100}%` }} /></div>
          <div className="row spread"><span className="tiny muted">{n}/{c.lessons.length} lessons · {c.lessons.reduce((a, l) => a + l.minutes, 0)} min</span>
            <button className="small primary" onClick={() => setOpen({ c: c.id, l: Math.min(n, c.lessons.length - 1) })}>{n ? (n === c.lessons.length ? "Review" : "Continue") : "Start"}</button></div>
        </div>
      );
    })}</div>
  );
}

export function InterviewCoach() {
  const { toast } = useSession();
  const [role, setRole] = useState("Information Manager"); const [level, setLevel] = useState("Mid");
  const [t, setT] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [a, setA] = useState(""); const [busy, setBusy] = useState(false);
  const step = async (next: typeof t) => {
    setBusy(true);
    try { const r = await api<{ reply: string }>("/learn/interview", { body: { role, level, transcript: next } }); setT([...next, { role: "assistant", content: r.reply }]); } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>AI interview coach</h3>
      {!t.length ? <div className="row">
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "auto" }}>{["Information Manager", "BIM Manager", "BIM Coordinator", "BIM Modeller", "Digital Engineering Lead", "AI Governance Lead (42001)"].map((x) => <option key={x}>{x}</option>)}</select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ width: "auto" }}><option>Junior</option><option>Mid</option><option>Senior</option></select>
        <button className="primary" disabled={busy} onClick={() => step([])}>{busy ? "Starting…" : "Start mock interview"}</button>
        <span className="small muted">Six questions with feedback and a score after each answer.</span>
      </div> : <>
        <div className="chat-log" style={{ maxHeight: 420 }}>{t.filter((m, i) => i > 0 || m.role === "assistant").map((m, i) => <div key={i} className={"bubble " + m.role}>{m.role === "assistant" ? <Markdown text={m.content} /> : m.content}</div>)}
          {busy && <div className="bubble assistant muted">…</div>}</div>
        <form className="row" style={{ marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); if (!a.trim()) return; const next = [...(t.length && t[0].role === "assistant" ? [{ role: "user" as const, content: "I'm ready to start the interview." }] : []), ...t, { role: "user" as const, content: a.trim() }]; setA(""); step(next); }}>
          <textarea value={a} onChange={(e) => setA(e.target.value)} placeholder="Your answer…" style={{ minHeight: 60, flex: 1 }} /><button className="primary" disabled={busy}>Answer</button>
          <button type="button" className="ghost" onClick={() => setT([])}>Restart</button>
        </form>
      </>}
    </div>
  );
}

export function StandardsUpdates() {
  const [u, setU] = useState<{ date: string; standard: string; title: string; note: string; link: string }[] | null>(null);
  useEffect(() => { api<{ updates: NonNullable<typeof u> }>("/learn/updates").then((r) => setU(r.updates)); }, []);
  if (!u) return null;
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Standards updates</h3>
      <p className="tiny muted">Editions and new parts relevant to this portal. Always confirm the current status in the ISO catalogue.</p>
      {u.map((x) => <div key={x.standard + x.date} className="small" style={{ marginBottom: 8 }}><b>{x.date}</b> · {x.link ? <a href={x.link} target="_blank" rel="noreferrer">{x.standard}</a> : x.standard} — {x.title}<div className="muted">{x.note}</div></div>)}
    </div>
  );
}
