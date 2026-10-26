import { useEffect, useState } from "react";
import { useSession } from "../App";
import { Progress, StdBadge } from "../components/common";
import { workflow19650 } from "../../../shared/data/iso19650";
import { workflow42001 } from "../../../shared/data/iso42001";
import { templateById } from "../../../shared/data/templates";
import type { Workflow } from "../../../shared/data/types";
import { api, canEdit, canManage, type DocRow } from "../lib/api";
import { NewDocumentDialog } from "./Documents";
import type { ProjectData } from "./Project";

interface Progress { activities: Record<string, "todo" | "doing" | "done">; gates: Record<string, { approved: boolean; by: string; date: string; note: string }> }
const NEXT = { todo: "doing", doing: "done", done: "todo" } as const;
const LABEL = { todo: "○ To do", doing: "◐ In progress", done: "● Done" };

function WorkflowBoard({ wf, data, docs }: { wf: Workflow; data: ProjectData; docs: DocRow[] }) {
  const { toast, user } = useSession();
  const pid = data.project.id;
  const [p, setP] = useState<Progress | null>(null);
  const [newTpl, setNewTpl] = useState<string | null>(null);
  useEffect(() => { api<{ data: Progress }>(`/projects/${pid}/workflow/${wf.id}`).then((r) => setP(r.data)); }, [pid, wf.id]);
  if (!p) return <p className="muted">Loading…</p>;

  const save = async (next: Progress) => {
    const prev = p; setP(next);
    try { await api(`/projects/${pid}/workflow/${wf.id}`, { method: "PUT", body: next }); }
    catch (e) { setP(prev); toast((e as Error).message, "error"); }
  };
  const all = wf.stages.flatMap((s) => s.activities);
  const pct = all.filter((a) => p.activities[a.id] === "done").length / all.length;
  const firstOpen = wf.stages.findIndex((s) => !p.gates[s.id]?.approved);

  return (
    <div style={{ marginBottom: 28 }}>
      <div className="row spread">
        <div><StdBadge std={wf.standard} /><h2 style={{ marginTop: 6 }}>{wf.title}</h2><p className="muted">{wf.description}</p></div>
        <div style={{ minWidth: 220 }}><div className="small muted">{Math.round(pct * 100)}% of activities · {Object.values(p.gates).filter((g) => g.approved).length}/{wf.stages.length} gates</div><Progress value={pct} /></div>
      </div>
      {wf.stages.map((s, i) => {
        const gate = p.gates[s.id];
        const done = s.activities.filter((a) => p.activities[a.id] === "done").length;
        const allDone = done === s.activities.length;
        return (
          <details key={s.id} className={"card stage " + (gate?.approved ? "done" : i === firstOpen ? "active" : "")} style={{ marginBottom: 10 }} open={i === firstOpen}>
            <summary className="row spread" style={{ cursor: "pointer" }}>
              <b>Stage {i + 1} · {s.title}</b>
              <span className="small muted">{gate?.approved ? "✔ gate approved" : `${done}/${s.activities.length} activities`}</span>
            </summary>
            <p className="muted">{s.description}</p>
            <div className="table-wrap"><table className="data">
              <thead><tr><th>Activity</th><th>Owner</th><th>Status</th><th>Documents</th></tr></thead>
              <tbody>{s.activities.map((a) => {
                const st = p.activities[a.id] ?? "todo";
                const linked = docs.filter((d) => a.templateIds?.includes(d.templateId));
                return (
                  <tr key={a.id}>
                    <td>{a.title}<div className="small muted">{a.outputs.join(", ")}</div></td>
                    <td className="small muted">{a.owner}</td>
                    <td><button className="ghost nowrap" disabled={!canEdit(data.role) || gate?.approved} onClick={() => save({ ...p, activities: { ...p.activities, [a.id]: NEXT[st] } })}>{LABEL[st]}</button></td>
                    <td>
                      {linked.map((d) => <a key={d.id} className="badge" style={{ marginRight: 4 }} href={`#/projects/${pid}/documents/${d.id}`}>{templateById(d.templateId)?.code} {d.revision} · {d.state}</a>)}
                      {canEdit(data.role) && a.templateIds?.filter((tid) => !linked.some((d) => d.templateId === tid)).map((tid) => (
                        <button key={tid} className="ghost small" onClick={() => setNewTpl(tid)}>+ {templateById(tid)?.code}</button>
                      ))}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table></div>
            <div className="guidance" style={{ marginTop: 10 }}>
              <b>Gate:</b> {s.gate}
              {gate?.approved ? (
                <div className="row spread" style={{ marginTop: 6 }}>
                  <span style={{ color: "var(--ok)" }}>✔ Approved by {gate.by} on {gate.date}{gate.note && ` — ${gate.note}`}</span>
                  {canManage(data.role) && <button onClick={() => { const g = { ...p.gates }; delete g[s.id]; save({ ...p, gates: g }); }}>Revoke</button>}
                </div>
              ) : canManage(data.role) ? (
                <div className="row" style={{ marginTop: 6 }}>
                  <button className="primary" disabled={!allDone} onClick={() => {
                    const note = prompt("Approval note (optional):"); if (note === null) return;
                    save({ ...p, gates: { ...p.gates, [s.id]: { approved: true, by: user.name, date: new Date().toISOString().slice(0, 10), note } } });
                  }}>Approve gate</button>
                  {!allDone && <span className="small muted">Complete all activities first.</span>}
                </div>
              ) : <div className="small muted" style={{ marginTop: 6 }}>A project manager approves this gate.</div>}
            </div>
          </details>
        );
      })}
      {newTpl && <NewDocumentDialog data={data} initialTemplate={newTpl} onClose={() => setNewTpl(null)} />}
    </div>
  );
}

export default function ProjectWorkflow({ data }: { data: ProjectData }) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  useEffect(() => { api<{ documents: DocRow[] }>(`/projects/${data.project.id}/documents`).then((r) => setDocs(r.documents)); }, [data.project.id]);
  return (
    <>
      {data.project.standards.includes("iso19650") && <WorkflowBoard wf={workflow19650} data={data} docs={docs} />}
      {data.project.standards.includes("iso42001") && <WorkflowBoard wf={workflow42001} data={data} docs={docs} />}
      <button className="no-print" onClick={() => { document.querySelectorAll("details").forEach((d) => (d.open = true)); window.print(); }}>🖨 Print status report</button>
    </>
  );
}
