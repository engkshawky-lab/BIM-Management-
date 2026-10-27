import { useCallback, useEffect, useState } from "react";
import { useSession } from "../App";
import { COURSES } from "../../../shared/data/courses";
import { api, canManage } from "../lib/api";
import { exportCsv } from "../lib/export";
import type { ProjectData } from "./Project";

// Team training: a project manager assigns courses to members; completion comes from lesson progress.

interface Assignment { id: string; courseId: string; userId: string; userName: string; dueDate: string; progress: number }
const today = () => new Date().toISOString().slice(0, 10);

export default function Training({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [rows, setRows] = useState<Assignment[]>([]);
  const [form, setForm] = useState({ courseId: COURSES[0].id, userIds: [] as string[], dueDate: "" });
  const load = useCallback(() => api<{ assignments: Assignment[] }>(`/projects/${pid}/training`).then((r) => setRows(r.assignments)), [pid]);
  useEffect(() => { load(); }, [load]);
  const course = (id: string) => COURSES.find((c) => c.id === id)?.title ?? id;
  const done = rows.filter((r) => r.progress >= 1).length;
  const overdue = rows.filter((r) => r.progress < 1 && r.dueDate && r.dueDate < today()).length;
  const manager = canManage(data.role);

  const assign = async () => {
    try { await api(`/projects/${pid}/training`, { body: form }); toast(`Assigned to ${form.userIds.length} member${form.userIds.length > 1 ? "s" : ""}.`); setForm({ ...form, userIds: [] }); load(); }
    catch (e) { toast((e as Error).message, "error"); }
  };

  return (
    <>
      <div className="grid g2" style={{ marginBottom: 12 }}>
        <div className="card">
          <b>Assign training</b>
          {manager ? <>
            <label>Course</label><select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>{COURSES.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.lessons.length} lessons)</option>)}</select>
            <label>Team members</label>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>{data.members.map((m) => (
              <label key={m.userId} className="row small" style={{ gap: 4, margin: 0 }}><input type="checkbox" style={{ width: "auto" }} checked={form.userIds.includes(m.userId)} onChange={(e) => setForm({ ...form, userIds: e.target.checked ? [...form.userIds, m.userId] : form.userIds.filter((x) => x !== m.userId) })} />{m.name}</label>
            ))}</div>
            <label>Due date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <button className="primary" style={{ marginTop: 10 }} disabled={!form.userIds.length} onClick={assign}>Assign</button>
          </> : <p className="small muted">A project manager assigns training. Your assigned courses appear in Learn.</p>}
        </div>
        <div className="card">
          <b>Completion</b>
          <div className="stat">{rows.length ? Math.round((done / rows.length) * 100) : 0}%</div>
          <div className="progress"><div style={{ width: `${rows.length ? (done / rows.length) * 100 : 0}%` }} /></div>
          <p className="small">{done} of {rows.length} assignments complete · {overdue} overdue</p>
          <p className="small muted">Supports ISO 19650-2 5.3.3 / 5.5.2 (capability and mobilization) and ISO/IEC 42001 7.2 (competence) evidence.</p>
          <button onClick={() => exportCsv(`${data.project.code}-training`, ["Member", "Course", "Due", "Progress"], rows.map((r) => [r.userName, course(r.courseId), r.dueDate, `${Math.round(r.progress * 100)}%`]))}>⬇ CSV</button>
        </div>
      </div>
      <div className="card table-wrap"><table className="data">
        <thead><tr><th>Member</th><th>Course</th><th>Due</th><th>Progress</th>{manager && <th />}</tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}>
            <td>{r.userName}</td><td>{course(r.courseId)}</td>
            <td className={"small " + (r.progress < 1 && r.dueDate && r.dueDate < today() ? "error" : "")}>{r.dueDate || "—"}</td>
            <td style={{ minWidth: 140 }}><div className="progress"><div style={{ width: `${r.progress * 100}%` }} /></div><span className="tiny muted">{r.progress >= 1 ? "Complete" : `${Math.round(r.progress * 100)}%`}</span></td>
            {manager && <td><button className="ghost small" onClick={async () => { await api(`/projects/${pid}/training/${r.id}`, { method: "DELETE" }); load(); }}>Remove</button></td>}
          </tr>
        ))}{rows.length === 0 && <tr><td colSpan={5} className="muted">No training assigned yet.</td></tr>}</tbody>
      </table></div>
    </>
  );
}
