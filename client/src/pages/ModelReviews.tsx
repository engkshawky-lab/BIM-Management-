import { useCallback, useEffect, useMemo, useState } from "react";
import { navigate, useSession } from "../App";
import { DISCIPLINES, GRADES, checklistFor, scoreReview, type Grade, type QaCheck, type QaResult } from "../../../shared/qaqc";
import type { TaskTeam } from "../../../shared/delivery";
import { api, canEdit, canManage, fmtDate } from "../lib/api";
import { exportCsv } from "../lib/export";
import type { ProjectData } from "./Project";

interface Review { id: string; number: number; title: string; discipline: string; taskTeamId: string | null; fileId: string | null; milestone: string; reviewerId: string; results: Record<string, QaResult>; status: "Draft" | "Completed"; score: number; grade: string; updatedAt: string }

const GRADE_COLOR: Record<string, string> = { A: "#16a34a", B: "#65a30d", C: "#38bdf8", D: "#dc2626", "—": "#64748b" };
const tag = (n: number) => `QA-${String(n).padStart(3, "0")}`;
export const GradeBadge = ({ g }: { g: string }) => <span className="badge" style={{ background: GRADE_COLOR[g] ?? "#64748b", color: "#fff" }}>{g}</span>;

function List({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [rows, setRows] = useState<Review[] | null>(null);
  const [teams, setTeams] = useState<TaskTeam[]>([]);
  const [f, setF] = useState({ title: "", discipline: DISCIPLINES[0], taskTeamId: "", milestone: "" });
  useEffect(() => {
    api<{ reviews: Review[] }>(`/projects/${pid}/reviews`).then((r) => setRows(r.reviews));
    api<{ teams: TaskTeam[] }>(`/projects/${pid}/delivery`).then((r) => setTeams(r.teams));
  }, [pid]);
  if (!rows) return <p className="muted">Loading…</p>;
  const byDisc = DISCIPLINES.map((d) => ({ d, last: [...rows].reverse().find((r) => r.discipline === d && r.status === "Completed") }));

  return (
    <>
      <p className="muted">Graded model checks before information is shared (ISO 19650-2 §5.6.3). Each check is weighted by priority; a failed critical check caps the review at D. Checks graded C or D can be raised as issues for the task team.</p>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${DISCIPLINES.length}, 1fr)`, gap: 10, marginBottom: 14 }}>
        {byDisc.map(({ d, last }) => <div key={d} className="card"><div className="small muted">{d}</div>{last ? <div className="row"><GradeBadge g={last.grade} /><b>{last.score}%</b></div> : <div className="small muted">No completed review</div>}</div>)}
      </div>
      {canEdit(data.role) && <form className="card row" style={{ marginBottom: 14 }} onSubmit={async (e) => {
        e.preventDefault();
        try { const r = await api<{ id: string }>(`/projects/${pid}/reviews`, { body: { ...f, taskTeamId: f.taskTeamId || null } }); navigate(`/projects/${pid}/reviews/${r.id}`); } catch (err) { toast((err as Error).message, "error"); }
      }}>
        <b>New review</b>
        <input required placeholder="Model / review title, e.g. ARC model – Stage 3" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} style={{ maxWidth: 300 }} />
        <select value={f.discipline} onChange={(e) => setF({ ...f, discipline: e.target.value })} style={{ maxWidth: 160 }}>{DISCIPLINES.map((d) => <option key={d}>{d}</option>)}</select>
        <select value={f.taskTeamId} onChange={(e) => setF({ ...f, taskTeamId: e.target.value })} style={{ maxWidth: 200 }}><option value="">Task team —</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <input placeholder="Milestone / stage" value={f.milestone} onChange={(e) => setF({ ...f, milestone: e.target.value })} style={{ maxWidth: 180 }} />
        <button className="primary">Start review</button>
      </form>}
      <div className="table-wrap"><table className="data">
        <thead><tr><th>Ref</th><th>Review</th><th>Discipline</th><th>Task team</th><th>Milestone</th><th>Score</th><th>Status</th><th>Updated</th></tr></thead>
        <tbody>
          {rows.map((r) => <tr key={r.id}>
            <td className="mono small">{tag(r.number)}</td><td><a href={`#/projects/${pid}/reviews/${r.id}`}>{r.title}</a></td><td>{r.discipline}</td>
            <td className="small">{teams.find((t) => t.id === r.taskTeamId)?.name ?? "—"}</td><td className="small">{r.milestone}</td>
            <td><GradeBadge g={r.grade} /> {r.score}%</td><td><span className={"state " + (r.status === "Completed" ? "PUBLISHED" : "WIP")}>{r.status}</span></td><td className="small muted">{fmtDate(r.updatedAt)}</td>
          </tr>)}
          {!rows.length && <tr><td colSpan={8} className="muted">No reviews yet.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}

function Editor({ data, id }: { data: ProjectData; id: string }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [rv, setRv] = useState<Review | null>(null);
  const [checks, setChecks] = useState<QaCheck[]>([]);
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => api<{ review: Review; checks: QaCheck[] }>(`/projects/${pid}/reviews/${id}`).then((r) => { setRv(r.review); setChecks(r.checks); }), [pid, id]);
  useEffect(() => { load(); }, [load]);
  const s = useMemo(() => (rv ? scoreReview(checks.length ? checks : checklistFor(rv.discipline), rv.results) : null), [rv, checks]);
  if (!rv || !s) return <p className="muted">Loading…</p>;
  const editable = canEdit(data.role) && rv.status === "Draft";

  const setResult = async (checkId: string, p: Partial<QaResult>) => {
    const next = { ...(rv.results[checkId] ?? { grade: "", comment: "" }), ...p };
    setRv({ ...rv, results: { ...rv.results, [checkId]: next } });
    setSaving(true);
    try { await api(`/projects/${pid}/reviews/${id}`, { method: "PUT", body: { results: { [checkId]: next } } }); } catch (e) { toast((e as Error).message, "error"); } finally { setSaving(false); }
  };
  const setStatus = async (status: Review["status"]) => {
    try { await api(`/projects/${pid}/reviews/${id}`, { method: "PUT", body: { status } }); toast(status === "Completed" ? "Review completed" : "Review reopened"); load(); } catch (e) { toast((e as Error).message, "error"); }
  };
  const areas = [...new Set(checks.map((c) => c.area))];

  return (
    <>
      <a className="small" href={`#/projects/${pid}/reviews`}>← All reviews</a>
      <div className="row spread" style={{ marginTop: 6 }}>
        <div><h2 style={{ margin: 0 }}>{tag(rv.number)} · {rv.title}</h2><div className="small muted">{rv.discipline}{rv.milestone && ` · ${rv.milestone}`} · {s.graded}/{s.total} checks graded {saving ? "· saving…" : "· saved"}</div></div>
        <div className="row">
          <GradeBadge g={s.grade} /><span className="stat" style={{ fontSize: 22 }}>{s.score}%</span>
          <button onClick={() => exportCsv(`${data.project.code}-${tag(rv.number)}`, ["Check", "Area", "Priority", "Check text", "Grade", "Comment"], checks.map((c) => [c.id, c.area, String(c.priority), c.text, rv.results[c.id]?.grade ?? "", rv.results[c.id]?.comment ?? ""]))}>⬇ CSV</button>
          {canEdit(data.role) && (s.counts.C + s.counts.D > 0) && <button onClick={async () => { const r = await api<{ created: number }>(`/projects/${pid}/reviews/${id}/issues`, { body: {} }); toast(`${r.created} issues raised`); }}>Raise issues for C/D</button>}
          {canEdit(data.role) && (rv.status === "Draft" ? <button className="primary" disabled={s.graded < s.total} title={s.graded < s.total ? "Grade every check first (use N/A where not applicable)" : ""} onClick={() => setStatus("Completed")}>Complete review</button> : <button onClick={() => setStatus("Draft")}>Reopen</button>)}
          {canManage(data.role) && <button className="ghost danger" onClick={async () => { if (!confirm("Delete this review?")) return; await api(`/projects/${pid}/reviews/${id}`, { method: "DELETE" }); navigate(`/projects/${pid}/reviews`); }}>Delete</button>}
        </div>
      </div>
      {s.critical > 0 && <div className="banner">⛔ {s.critical} critical check{s.critical > 1 ? "s" : ""} graded D — the review is capped at D.</div>}
      <div className="row small muted" style={{ margin: "8px 0" }}>{GRADES.map((g) => <span key={g.g}><b>{g.g}</b> {g.label} ({s.counts[g.g]})</span>)}</div>
      {areas.map((a) => (
        <div key={a} className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>{a}</h3>
          <table className="data"><tbody>{checks.filter((c) => c.area === a).map((c) => {
            const res = rv.results[c.id] ?? { grade: "", comment: "" };
            return (
              <tr key={c.id}>
                <td className="mono tiny" style={{ width: 70 }}>{c.id}</td>
                <td>{c.text} {c.priority === 3 && <span className="badge" title="Critical check">critical</span>}</td>
                <td style={{ width: 230 }}><div className="seg">{GRADES.map((g) => (
                  <button key={g.g} disabled={!editable} title={g.label} className={res.grade === g.g ? "on" : ""} style={res.grade === g.g && g.g !== "NA" ? { background: GRADE_COLOR[g.g], color: "#fff" } : undefined}
                    onClick={() => setResult(c.id, { grade: (res.grade === g.g ? "" : g.g) as Grade | "" })}>{g.g === "NA" ? "N/A" : g.g}</button>
                ))}</div></td>
                <td style={{ width: "30%" }}><input disabled={!editable} defaultValue={res.comment} placeholder="Comment / evidence" onBlur={(e) => e.target.value !== res.comment && setResult(c.id, { comment: e.target.value })} /></td>
              </tr>
            );
          })}</tbody></table>
        </div>
      ))}
    </>
  );
}

export default function ModelReviews({ data, sub }: { data: ProjectData; sub?: string }) {
  return sub ? <Editor data={data} id={sub} /> : <List data={data} />;
}
