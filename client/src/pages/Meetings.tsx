import { useCallback, useEffect, useRef, useState } from "react";
import { navigate, useSession } from "../App";
import { ACTION_STATUSES, MEETING_TYPES } from "../../../shared/meetings";
import { api, canEdit, canManage } from "../lib/api";
import type { ProjectData } from "./Project";

interface Action { id: string; text: string; ownerId: string; due: string; status: (typeof ACTION_STATUSES)[number] }
interface Meeting { id: string; number: number; title: string; type: string; date: string; location: string; attendees: string[]; agenda: { item: string; presenter: string; minutes: string }[]; actions: Action[]; status: "Planned" | "Held" | "Minutes issued" }

const TYPES = Object.keys(MEETING_TYPES);
const today = () => new Date().toISOString().slice(0, 10);

function generate(pid: string, body: object, toast: (m: string, k?: "ok" | "error") => void) {
  return api<{ id: string }>(`/projects/${pid}/delivery/generate`, { body }).then((r) => navigate(`/projects/${pid}/documents/${r.id}`)).catch((e) => toast((e as Error).message, "error"));
}

function List({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [rows, setRows] = useState<Meeting[] | null>(null);
  const [f, setF] = useState({ title: "", type: TYPES[1], date: today() });
  useEffect(() => { api<{ meetings: Meeting[] }>(`/projects/${pid}/meetings`).then((r) => setRows(r.meetings)); }, [pid]);
  if (!rows) return <p className="muted">Loading…</p>;
  const name = (id: string) => data.members.find((m) => m.userId === id)?.name ?? "—";
  const latest = new Map<string, Meeting>(); rows.forEach((m) => latest.set(m.type, m));
  const open = [...latest.values()].flatMap((m) => m.actions.filter((a) => a.status !== "Done").map((a) => ({ m, a })));
  const overdue = open.filter(({ a }) => a.due && a.due < today());

  return (
    <>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <p className="muted" style={{ margin: 0, maxWidth: 720 }}>Kick-off, coordination, progress and model review meetings with standing agendas. Open actions carry forward to the next meeting of the same type. Minutes and the progress report are generated as controlled documents.</p>
        {canEdit(data.role) && <button className="primary" onClick={() => generate(pid, { kind: "progress-report" }, toast)}>📊 Generate progress report</button>}
      </div>
      {canEdit(data.role) && <form className="card row" style={{ marginBottom: 14 }} onSubmit={async (e) => {
        e.preventDefault();
        try { const r = await api<{ id: string; carried: number }>(`/projects/${pid}/meetings`, { body: f }); if (r.carried) toast(`${r.carried} open actions carried forward`); navigate(`/projects/${pid}/meetings/${r.id}`); } catch (err) { toast((err as Error).message, "error"); }
      }}>
        <b>New meeting</b>
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} style={{ maxWidth: 200 }}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <input required placeholder="Title, e.g. Coordination meeting 05" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} style={{ maxWidth: 300 }} />
        <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} style={{ maxWidth: 170 }} />
        <button className="primary">Create with standard agenda</button>
      </form>}
      <div className="grid g2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Meetings</h3>
          <table className="data"><tbody>
            {[...rows].reverse().map((m) => <tr key={m.id}><td className="small mono">#{m.number}</td><td><a href={`#/projects/${pid}/meetings/${m.id}`}>{m.title}</a><div className="tiny muted">{m.type}</div></td><td className="small">{m.date.replace("T", " ")}</td><td className="small">{m.status}</td></tr>)}
            {!rows.length && <tr><td className="muted">No meetings yet.</td></tr>}
          </tbody></table>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Open actions <span className="small muted">({open.length}{overdue.length ? `, ${overdue.length} overdue` : ""})</span></h3>
          <table className="data"><tbody>
            {open.map(({ m, a }) => <tr key={m.id + a.id} className={a.due && a.due < today() ? "late" : ""}><td>{a.text}<div className="tiny muted">{m.title}</div></td><td className="small">{name(a.ownerId)}</td><td className="small">{a.due}</td><td className="small">{a.status}</td></tr>)}
            {!open.length && <tr><td className="muted">No open actions.</td></tr>}
          </tbody></table>
        </div>
      </div>
    </>
  );
}

function Editor({ data, id }: { data: ProjectData; id: string }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [m, setM] = useState<Meeting | null>(null);
  const [state, setState] = useState<"saved" | "dirty" | "saving">("saved");
  const pending = useRef<Partial<Meeting>>({});
  useEffect(() => { api<{ meeting: Meeting }>(`/projects/${pid}/meetings/${id}`).then((r) => setM(r.meeting)); }, [pid, id]);
  const flush = useCallback(async () => {
    const body = pending.current; if (!Object.keys(body).length) return;
    pending.current = {}; setState("saving");
    try { await api(`/projects/${pid}/meetings/${id}`, { method: "PUT", body }); setState("saved"); } catch (e) { toast((e as Error).message, "error"); setState("dirty"); }
  }, [pid, id, toast]);
  useEffect(() => { if (state !== "dirty") return; const t = setTimeout(flush, 800); return () => clearTimeout(t); }, [state, m, flush]);
  useEffect(() => () => { flush(); }, [flush]);
  if (!m) return <p className="muted">Loading…</p>;
  const editor = canEdit(data.role);
  const set = (p: Partial<Meeting>) => { setM({ ...m, ...p }); Object.assign(pending.current, p); setState("dirty"); };
  const newAction = (): Action => ({ id: crypto.randomUUID(), text: "", ownerId: "", due: "", status: "Open" });

  return (
    <>
      <div className="row spread">
        <a className="small" href={`#/projects/${pid}/meetings`}>← All meetings</a>
        <span className="small muted">{state === "saved" ? "✓ All changes saved" : state === "saving" ? "Saving…" : "Unsaved changes…"}</span>
      </div>
      <div className="row spread" style={{ marginTop: 6 }}>
        <input className="title-input" value={m.title} disabled={!editor} onChange={(e) => set({ title: e.target.value })} style={{ maxWidth: 600 }} />
        <div className="row">
          {editor && <select value={m.status} onChange={(e) => set({ status: e.target.value as Meeting["status"] })} style={{ width: "auto" }}><option>Planned</option><option>Held</option><option>Minutes issued</option></select>}
          {editor && <button className="primary" onClick={async () => { await flush(); generate(pid, { kind: "minutes", meetingId: id }, toast); }}>📄 Generate minutes</button>}
          {canManage(data.role) && <button className="ghost danger" onClick={async () => { if (!confirm("Delete this meeting?")) return; await api(`/projects/${pid}/meetings/${id}`, { method: "DELETE" }); navigate(`/projects/${pid}/meetings`); }}>Delete</button>}
        </div>
      </div>
      <div className="card grid g3" style={{ marginBottom: 12 }}>
        <div><label>Type</label><div>{m.type} #{m.number}</div></div>
        <div><label>Date & time</label><input type="datetime-local" disabled={!editor} value={m.date.length === 10 ? m.date + "T10:00" : m.date} onChange={(e) => set({ date: e.target.value })} /></div>
        <div><label>Location / link</label><input disabled={!editor} value={m.location} onChange={(e) => set({ location: e.target.value })} /></div>
        <div style={{ gridColumn: "1 / -1" }}><label>Attendees</label>
          <div className="chips">{data.members.map((x) => <button key={x.userId} disabled={!editor} className={"chip" + (m.attendees.includes(x.name) ? " on" : "")} onClick={() => set({ attendees: m.attendees.includes(x.name) ? m.attendees.filter((a) => a !== x.name) : [...m.attendees, x.name] })}>{x.name}</button>)}
            {m.attendees.filter((a) => !data.members.some((x) => x.name === a)).map((a) => <span key={a} className="chip on">{a} {editor && <button className="linklike" onClick={() => set({ attendees: m.attendees.filter((y) => y !== a) })}>✕</button>}</span>)}
            {editor && <input placeholder="+ external attendee (Enter)" style={{ maxWidth: 220 }} onKeyDown={(e) => { const v = (e.target as HTMLInputElement).value.trim(); if (e.key === "Enter" && v) { set({ attendees: [...m.attendees, v] }); (e.target as HTMLInputElement).value = ""; } }} />}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Agenda & minutes</h3>
        {m.agenda.map((a, i) => (
          <div key={i} className="grid" style={{ gridTemplateColumns: "28px 1fr 160px 28px", gap: 8, marginBottom: 8, alignItems: "start" }}>
            <b className="small" style={{ paddingTop: 8 }}>{i + 1}.</b>
            <div><input disabled={!editor} value={a.item} onChange={(e) => set({ agenda: m.agenda.map((x, j) => (j === i ? { ...x, item: e.target.value } : x)) })} style={{ fontWeight: 600 }} />
              <textarea disabled={!editor} placeholder="Minutes / decisions" value={a.minutes} onChange={(e) => set({ agenda: m.agenda.map((x, j) => (j === i ? { ...x, minutes: e.target.value } : x)) })} style={{ minHeight: 48, marginTop: 4 }} /></div>
            <input disabled={!editor} placeholder="Presenter" value={a.presenter} onChange={(e) => set({ agenda: m.agenda.map((x, j) => (j === i ? { ...x, presenter: e.target.value } : x)) })} />
            {editor && <button className="ghost tiny danger" onClick={() => set({ agenda: m.agenda.filter((_, j) => j !== i) })}>✕</button>}
          </div>
        ))}
        {editor && <button className="ghost small" onClick={() => set({ agenda: [...m.agenda, { item: "New item", presenter: "", minutes: "" }] })}>+ Agenda item</button>}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Actions</h3>
        <table className="data"><thead><tr><th>Action</th><th>Owner</th><th>Due</th><th>Status</th><th /></tr></thead><tbody>
          {m.actions.map((a, i) => {
            const up = (p: Partial<Action>) => set({ actions: m.actions.map((x, j) => (j === i ? { ...x, ...p } : x)) });
            return <tr key={a.id} className={a.status !== "Done" && a.due && a.due < today() ? "late" : ""}>
              <td><input disabled={!editor} value={a.text} onChange={(e) => up({ text: e.target.value })} /></td>
              <td><select disabled={!editor} value={a.ownerId} onChange={(e) => up({ ownerId: e.target.value })}><option value="">—</option>{data.members.map((x) => <option key={x.userId} value={x.userId}>{x.name}</option>)}</select></td>
              <td><input type="date" disabled={!editor} value={a.due} onChange={(e) => up({ due: e.target.value })} /></td>
              <td><select disabled={!editor} value={a.status} onChange={(e) => up({ status: e.target.value as Action["status"] })}>{ACTION_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
              <td>{editor && <button className="ghost tiny danger" onClick={() => set({ actions: m.actions.filter((_, j) => j !== i) })}>✕</button>}</td>
            </tr>;
          })}
          {!m.actions.length && <tr><td colSpan={5} className="muted">No actions.</td></tr>}
        </tbody></table>
        {editor && <button className="ghost small" onClick={() => set({ actions: [...m.actions, newAction()] })}>+ Action</button>}
      </div>
    </>
  );
}

export default function Meetings({ data, sub }: { data: ProjectData; sub?: string }) {
  return sub ? <Editor data={data} id={sub} /> : <List data={data} />;
}
