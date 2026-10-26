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

// ---------------------------------------------------------------- clash triage

interface Triage { number: number; priority: string; taskTeamId: string | null; team: string; action: string; falsePositive: boolean; reason: string }

/** AI suggestions for open clash issues; nothing changes until the reviewer accepts the selected rows. */
export function ClashTriage({ projectId, onClose, onApplied }: { projectId: string; onClose: () => void; onApplied: () => void }) {
  const { toast } = useSession();
  const [items, setItems] = useState<(Triage & { on: boolean })[] | null>(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    api<{ items: Triage[] }>(`/projects/${projectId}/issues/ai-triage`, { body: {} })
      .then((r) => setItems(r.items.map((x) => ({ ...x, on: true })))).catch((e) => { toast((e as Error).message, "error"); onClose(); }).finally(() => setBusy(false));
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="modal-bg" onClick={onClose}><div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <h2 style={{ marginTop: 0 }}>✨ AI clash triage</h2>
      <p className="small muted">Suggested priority, responsible task team and action for each open clash. Review, untick anything you disagree with, then apply — a comment records each accepted suggestion.</p>
      {busy ? <p className="muted">Analysing clashes… (up to a minute)</p> : items && <>
        <div className="table-wrap" style={{ maxHeight: 420, overflow: "auto" }}><table className="data">
          <thead><tr><th /><th>#</th><th>Priority</th><th>Team</th><th>Action</th><th>False positive?</th></tr></thead>
          <tbody>{items.map((x, i) => <tr key={x.number} style={x.on ? undefined : { opacity: 0.5 }}>
            <td><input type="checkbox" checked={x.on} onChange={() => setItems(items.map((y, j) => (j === i ? { ...y, on: !y.on } : y)))} /></td>
            <td className="mono small">{x.number}</td><td><b>{x.priority}</b></td><td className="small">{x.team || "—"}</td>
            <td className="small">{x.action}<div className="tiny muted">{x.reason}</div></td><td>{x.falsePositive ? "⚠ likely" : ""}</td>
          </tr>)}</tbody>
        </table></div>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}><button onClick={onClose}>Cancel</button>
          <button className="primary" disabled={!items.some((x) => x.on)} onClick={async () => { const r = await api<{ updated: number }>(`/projects/${projectId}/issues/ai-triage/apply`, { body: { items: items.filter((x) => x.on) } }); toast(`${r.updated} issues updated`); onApplied(); onClose(); }}>Apply {items.filter((x) => x.on).length} suggestions</button></div>
      </>}
    </div></div>
  );
}

// ---------------------------------------------------------------- research notebook

interface NbSummary { id: string; title: string; sources: number; notes: number; updatedAt: string }
interface Nb { id: string; title: string; sources: { id: string; kind: string; name: string; chars: number }[]; notes: { id: string; question: string; answer: string; at: string }[] }

export function Notebooks({ data, sub }: { data: ProjectData; sub?: string }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [list, setList] = useState<NbSummary[] | null>(null);
  const [title, setTitle] = useState("");
  useEffect(() => { if (!sub) api<{ notebooks: NbSummary[] }>(`/projects/${pid}/notebooks`).then((r) => setList(r.notebooks)); }, [pid, sub]);
  if (sub) return <Notebook data={data} id={sub} />;
  if (!list) return <p className="muted">Loading…</p>;
  return (
    <>
      <p className="muted">Collect sources — pasted text, project documents, PDFs from the project files — then ask questions to summarise, compare or check them. Answers cite the sources and are saved as notes.</p>
      {canEdit(data.role) && <form className="card row" style={{ marginBottom: 12 }} onSubmit={async (e) => { e.preventDefault(); try { const r = await api<{ id: string }>(`/projects/${pid}/notebooks`, { body: { title } }); location.hash = `#/projects/${pid}/notebook/${r.id}`; } catch (err) { toast((err as Error).message, "error"); } }}>
        <input required placeholder="Notebook title, e.g. Compare client EIRs" value={title} onChange={(e) => setTitle(e.target.value)} style={{ maxWidth: 360 }} /><button className="primary">New notebook</button></form>}
      <div className="grid g3">{list.map((n) => <a key={n.id} className="card project-card" href={`#/projects/${pid}/notebook/${n.id}`}><h3 style={{ marginTop: 0 }}>{n.title}</h3><p className="small muted">{n.sources} sources · {n.notes} notes</p></a>)}</div>
      {!list.length && <p className="muted">No notebooks yet.</p>}
    </>
  );
}

function Notebook({ data, id }: { data: ProjectData; id: string }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const editor = canEdit(data.role);
  const [nb, setNb] = useState<Nb | null>(null);
  const [docs, setDocs] = useState<{ id: string; title: string; containerName: string }[]>([]);
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const [paste, setPaste] = useState({ name: "", text: "" });
  const [q, setQ] = useState(""); const [busy, setBusy] = useState(false);
  const load = () => api<{ notebook: Nb }>(`/projects/${pid}/notebooks/${id}`).then((r) => setNb(r.notebook));
  useEffect(() => {
    load();
    api<{ documents: { id: string; title: string; containerName: string }[] }>(`/projects/${pid}/documents`).then((r) => setDocs(r.documents));
    api<{ files: { id: string; name: string }[] }>(`/projects/${pid}/files?all=1`).then((r) => setFiles(r.files ?? [])).catch(() => undefined);
  }, [pid, id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!nb) return <p className="muted">Loading…</p>;
  const put = async (body: object) => { try { await api(`/projects/${pid}/notebooks/${id}`, { method: "PUT", body }); load(); } catch (e) { toast((e as Error).message, "error"); } };
  return (
    <>
      <a className="small" href={`#/projects/${pid}/notebook`}>← All notebooks</a>
      <h2 style={{ marginTop: 6 }}>{nb.title}</h2>
      <div className="grid g2" style={{ gridTemplateColumns: "minmax(280px, 1fr) 2fr" }}>
        <div className="card" style={{ alignSelf: "start" }}>
          <h3 style={{ marginTop: 0 }}>Sources ({nb.sources.length}/20)</h3>
          {nb.sources.map((s, i) => <div key={s.id} className="row spread small" style={{ marginBottom: 4 }}><span><b>[N{i + 1}]</b> {s.name} <span className="tiny muted">{s.kind}</span></span>{editor && <button className="ghost tiny danger" onClick={() => put({ removeSource: s.id })}>✕</button>}</div>)}
          {editor && <>
            <label>Add a project document</label>
            <select value="" onChange={(e) => { const d = docs.find((x) => x.id === e.target.value); if (d) put({ addSource: { kind: "document", name: d.title, refId: d.id } }); }}><option value="">Choose…</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select>
            {files.length > 0 && <><label>Add a project file (PDF or text)</label>
              <select value="" onChange={(e) => { const f = files.find((x) => x.id === e.target.value); if (f) put({ addSource: { kind: "file", name: f.name, refId: f.id } }); }}><option value="">Choose…</option>{files.filter((f) => /\.(pdf|txt|md|csv)$/i.test(f.name)).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></>}
            <label>Or paste text</label>
            <input placeholder="Source name" value={paste.name} onChange={(e) => setPaste({ ...paste, name: e.target.value })} />
            <textarea value={paste.text} onChange={(e) => setPaste({ ...paste, text: e.target.value })} style={{ minHeight: 80, marginTop: 4 }} />
            <button className="small" disabled={!paste.name || paste.text.length < 20} onClick={async () => { await put({ addSource: { kind: "text", name: paste.name, text: paste.text } }); setPaste({ name: "", text: "" }); }}>Add text source</button>
          </>}
        </div>
        <div>
          <form className="card row" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await api(`/projects/${pid}/notebooks/${id}/ask`, { body: { question: q } }); setQ(""); load(); } catch (err) { toast((err as Error).message, "error"); } finally { setBusy(false); } }}>
            <textarea required value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Compare the handover requirements across the sources" style={{ minHeight: 44, flex: 1 }} />
            <button className="primary" disabled={busy || !nb.sources.length}>{busy ? "Thinking…" : "Ask"}</button>
          </form>
          {[...nb.notes].reverse().map((n) => (
            <div key={n.id} className="card" style={{ marginTop: 10 }}>
              <div className="row spread"><b>{n.question}</b>{editor && <button className="ghost tiny danger" onClick={() => put({ removeNote: n.id })}>✕</button>}</div>
              <Markdown text={n.answer} cite={(k) => <span className="cite" title={nb.sources[k - 1]?.name}>[N{k}]</span>} />
              <div className="tiny muted">{new Date(n.at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
