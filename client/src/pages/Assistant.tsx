import { useEffect, useRef, useState } from "react";
import { useSession } from "../App";
import { Markdown } from "../components/Markdown";
import { api, canEdit } from "../lib/api";
import type { ProjectData } from "./Project";

interface Source { n: number; title: string; link: string; kind: string }
interface Turn { role: "user" | "assistant"; content: string; sources?: Source[] }

const SUGGESTIONS = [
  "What is overdue in the MIDP and who is responsible?",
  "Summarise open coordination issues by priority.",
  "Which requirements are not yet addressed?",
  "What did we agree in the last coordination meeting?",
  "Draft a short progress summary for the client.",
];

/** Project assistant: answers from the project's documents, plan, issues, risks, reviews and meetings, with citations. */
export function ProjectAssistant({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const key = `bim:chat:${pid}`;
  const [turns, setTurns] = useState<Turn[]>(() => { try { return JSON.parse(sessionStorage.getItem(key) ?? "[]"); } catch { return []; } });
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(turns.slice(-20))); } catch { /* storage unavailable */ } end.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, key]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: text.trim() }];
    setTurns(next); setQ(""); setBusy(true);
    try {
      const r = await api<{ answer: string; sources: Source[]; truncated: boolean }>(`/projects/${pid}/assistant`, { body: { messages: next.slice(-10).map(({ role, content }) => ({ role, content })) } });
      setTurns([...next, { role: "assistant", content: r.answer + (r.truncated ? "\n\n*(answer shortened)*" : ""), sources: r.sources }]);
    } catch (e) { toast((e as Error).message, "error"); setTurns(turns); setQ(text); } finally { setBusy(false); }
  };

  if (enabled === false) return <div className="card"><h3 style={{ marginTop: 0 }}>Project assistant</h3><p className="muted">The assistant needs a Claude API key on the server. Set <code>CLAUDE_API_KEY</code> in the server's environment (<code>.env</code>) and restart.</p></div>;
  return (
    <div className="chat">
      <p className="muted small">Answers come from this project's records — documents, MIDP, issues, risks, reviews, meetings and requirements — with numbered sources you can open. {canEdit(data.role) ? "" : "You have read-only access; answers only cover what you can see."}</p>
      <div className="chat-log">
        {!turns.length && <div className="chips">{SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}</div>}
        {turns.map((t, i) => (
          <div key={i} className={"bubble " + t.role}>
            {t.role === "user" ? t.content : <Markdown text={t.content} cite={(n) => { const s = t.sources?.find((x) => x.n === n); return s ? <a className="cite" href={`#${s.link}`} title={s.title}>[{n}]</a> : <span className="cite">[{n}]</span>; }} />}
            {!!t.sources?.length && <div className="tiny muted" style={{ marginTop: 6 }}>{t.sources.map((s) => <div key={s.n}>[{s.n}] <a href={`#${s.link}`}>{s.title}</a></div>)}</div>}
          </div>
        ))}
        {busy && <div className="bubble assistant muted">Reading the project records…</div>}
        <div ref={end} />
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); send(q); }}>
        <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about this project…" style={{ minHeight: 44, flex: 1 }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(q); } }} />
        <button className="primary" disabled={busy || !q.trim()}>Ask</button>
        {turns.length > 0 && <button type="button" className="ghost" onClick={() => setTurns([])}>New chat</button>}
      </form>
    </div>
  );
}

interface ReviewResult { summary: string; items: { item: string; status: string; evidence: string; recommendation: string }[]; risks: string[] }

/** Appointment / contract review for ISO 19650 obligations. */
export function ContractReview({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<ReviewResult | null>(null);
  const run = async () => {
    const form = new FormData(); if (file) form.append("file", file); else form.append("text", text);
    setBusy(true); setR(null);
    try { setR(await api<ReviewResult>(`/projects/${data.project.id}/contract-review`, { form })); } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const color: Record<string, string> = { present: "var(--ok)", partial: "#d97706", missing: "var(--danger)" };
  return (
    <>
      <p className="muted">Upload an appointment, contract or BIM specification (PDF) or paste its text. The AI checks it for ISO 19650 information-management obligations — information protocol, EIR, BEP, MIDP/TIDP, CDE, IP and licence, liability, security, handover — with clause references. This is a checklist aid, not legal advice.</p>
      <div className="card">
        <div className="row"><input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /><span className="small muted">or paste text below</span></div>
        {!file && <textarea value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 120, marginTop: 8 }} placeholder="Paste contract text…" />}
        <button className="primary" style={{ marginTop: 8 }} disabled={busy || (!file && text.length < 200)} onClick={run}>{busy ? "Reviewing… (up to a minute)" : "Review document"}</button>
      </div>
      {r && <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Summary</h3><p>{r.summary}</p>
        <table className="data"><thead><tr><th>Obligation</th><th>Status</th><th>Evidence</th><th>Recommendation</th></tr></thead><tbody>
          {r.items.map((x) => <tr key={x.item}><td><b>{x.item}</b></td><td style={{ color: color[x.status] ?? undefined, fontWeight: 600 }}>{x.status}</td><td className="small">{x.evidence}</td><td className="small">{x.recommendation}</td></tr>)}
        </tbody></table>
        {r.risks?.length > 0 && <><h3>Points for legal review</h3><ul>{r.risks.map((x) => <li key={x}>{x}</li>)}</ul></>}
      </div>}
    </>
  );
}
