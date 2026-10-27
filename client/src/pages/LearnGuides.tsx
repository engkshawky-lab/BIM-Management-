import { useEffect, useState } from "react";
import { navigate, useSession } from "../App";
import { ADOPTION_PHASES } from "../../../shared/data/adoption";
import { COURSES } from "../../../shared/data/courses";
import { GUIDES } from "../../../shared/data/guides";
import { templateById } from "../../../shared/data/templates";
import { Markdown } from "../components/Markdown";
import { api } from "../lib/api";
import { exportCsv } from "../lib/export";
import { tr } from "../i18nDom";

/** Courses a project manager assigned to the signed-in user (shown at the top of Learn). */
export function AssignedTraining() {
  const [rows, setRows] = useState<{ id: string; courseId: string; project: string; dueDate: string; progress: number }[]>([]);
  useEffect(() => { api<{ assignments: typeof rows }>("/learn/assignments").then((r) => setRows(r.assignments)).catch(() => undefined); }, []);
  const open = rows.filter((r) => r.progress < 1);
  if (!open.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <b>Assigned to you</b>
      <table className="data" style={{ marginTop: 6 }}><tbody>{open.map((r) => (
        <tr key={r.id}><td>{COURSES.find((c) => c.id === r.courseId)?.title}</td><td className="small muted">{r.project}</td>
          <td className={"small " + (r.dueDate && r.dueDate < today ? "error" : "muted")}>{r.dueDate ? `due ${r.dueDate}` : ""}</td>
          <td style={{ minWidth: 120 }}><div className="progress"><div style={{ width: `${r.progress * 100}%` }} /></div></td></tr>
      ))}</tbody></table>
      <p className="tiny muted">Open the course below to continue; progress updates as you complete lessons.</p>
    </div>
  );
}

export function GuidesPage({ id }: { id?: string }) {
  const g = GUIDES.find((x) => x.id === id);
  if (g) return (
    <>
      <button className="ghost small" onClick={() => navigate("/learn/guides")}>← All guides</button>
      <div className="page-head"><h1>{g.title}</h1><p className="muted">{g.summary}</p><div className="small muted">For: {g.audience}</div></div>
      <div className="card"><Markdown text={tr(g.body)} /></div>
      {g.templateIds.some((t) => templateById(t)) && <p className="small">Related templates: {g.templateIds.map((t) => templateById(t)).filter(Boolean).map((t) => <a key={t!.id} className="badge" style={{ marginRight: 6 }} href={`#/knowledge/${t!.standard}/templates/${t!.id}`}>{t!.code} — {t!.title}</a>)}</p>}
    </>
  );
  return (
    <>
      <div className="page-head"><h1>Best-practice guides</h1><p className="muted">Short practical guides for modellers, coordinators and information managers. Original guidance; check your project's information standard first.</p></div>
      <div className="grid g2">{GUIDES.map((x) => (
        <a key={x.id} className="card clickable" href={`#/learn/guides/${x.id}`} style={{ color: "inherit", textDecoration: "none" }}>
          <b>{x.title}</b><p className="small" style={{ margin: "6px 0" }}>{x.summary}</p><div className="tiny muted">{x.audience}</div>
        </a>
      ))}</div>
    </>
  );
}

type Step = { status: string; owner: string; due: string; note: string };
const STATUSES = ["To do", "In progress", "Done", "N/A"];

export function AdoptionGuide() {
  const { toast } = useSession();
  const [steps, setSteps] = useState<Record<string, Step> | null>(null);
  useEffect(() => { api<{ steps: Record<string, Step> }>("/learn/adoption").then((r) => setSteps(r.steps)); }, []);
  if (!steps) return <p className="muted">Loading…</p>;
  const get = (id: string): Step => steps[id] ?? { status: "To do", owner: "", due: "", note: "" };
  const update = async (id: string, patch: Partial<Step>) => {
    const next = { ...steps, [id]: { ...get(id), ...patch } }; const prev = steps; setSteps(next);
    try { await api("/learn/adoption", { method: "PUT", body: { steps: next } }); } catch (e) { setSteps(prev); toast((e as Error).message, "error"); }
  };
  const all = ADOPTION_PHASES.flatMap((p) => p.steps);
  const applicable = all.filter((s) => get(s.id).status !== "N/A");
  const done = applicable.filter((s) => get(s.id).status === "Done").length;
  return (
    <>
      <div className="page-head"><h1>ISO 19650 implementation guide</h1><p className="muted">A step-by-step plan for adopting ISO 19650 across your organization. Track each step with an owner and a due date; your progress is saved to your account.</p></div>
      <div className="card row spread" style={{ marginBottom: 12 }}>
        <div style={{ minWidth: 240 }}><div className="stat">{applicable.length ? Math.round((done / applicable.length) * 100) : 0}%</div><div className="progress"><div style={{ width: `${applicable.length ? (done / applicable.length) * 100 : 0}%` }} /></div><div className="tiny muted">{done} of {applicable.length} steps done</div></div>
        <button onClick={() => exportCsv("iso19650-implementation-plan", ["Phase", "Step", "Outputs", "Status", "Owner", "Due", "Note"], ADOPTION_PHASES.flatMap((p) => p.steps.map((s) => [p.title, s.title, s.outputs.join("; "), get(s.id).status, get(s.id).owner, get(s.id).due, get(s.id).note])))}>⬇ CSV</button>
      </div>
      {ADOPTION_PHASES.map((p, i) => (
        <div key={p.id} className="card" style={{ marginBottom: 10 }}>
          <h3 style={{ marginTop: 0 }}>Phase {i + 1} · {p.title}</h3>
          <p className="small muted">{p.goal}</p>
          <div className="table-wrap"><table className="data"><tbody>{p.steps.map((s) => {
            const st = get(s.id);
            return (
              <tr key={s.id} className={st.status === "Done" ? "done-row" : ""}>
                <td style={{ width: "40%" }}><b>{s.title}</b><div className="small">{s.detail}</div><div className="tiny muted">Outputs: {s.outputs.join(", ")}{s.link && <> · <a href={`#${s.link}`}>Open</a></>}</div></td>
                <td><select value={st.status} onChange={(e) => update(s.id, { status: e.target.value })} style={{ width: "auto" }}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></td>
                <td><input placeholder="Owner" defaultValue={st.owner} onBlur={(e) => e.target.value !== st.owner && update(s.id, { owner: e.target.value })} style={{ width: 130 }} /></td>
                <td><input type="date" value={st.due} onChange={(e) => update(s.id, { due: e.target.value })} style={{ width: "auto" }} /></td>
                <td><input placeholder="Note" defaultValue={st.note} onBlur={(e) => e.target.value !== st.note && update(s.id, { note: e.target.value })} /></td>
              </tr>
            );
          })}</tbody></table></div>
        </div>
      ))}
    </>
  );
}
