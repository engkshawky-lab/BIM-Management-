import { navigate, usePortal } from "../App";
import { Progress, StdBadge } from "../components/common";
import { workflow19650 } from "../data/iso19650";
import { workflow42001 } from "../data/iso42001";
import { templateById } from "../data/templates";
import type { StandardId, Workflow } from "../data/types";
import { newDocument, today, type WorkflowProgress } from "../lib/store";

export const workflowFor = (std: StandardId) => (std === "iso19650" ? workflow19650 : workflow42001);
const empty: WorkflowProgress = { activities: {}, gates: {} };

export function workflowPct(wf: Workflow, p?: WorkflowProgress) {
  const all = wf.stages.flatMap((s) => s.activities);
  const done = all.filter((a) => p?.activities[a.id] === "done").length;
  return all.length ? done / all.length : 0;
}

const NEXT = { todo: "doing", doing: "done", done: "todo" } as const;
const LABEL = { todo: "○ To do", doing: "◐ In progress", done: "● Done" };

export default function Workflows({ std }: { std: StandardId }) {
  const { progress, setProgress, docs, setDocs, user } = usePortal();
  const wf = workflowFor(std);
  const p = progress[wf.id] ?? empty;

  const update = (fn: (p: WorkflowProgress) => WorkflowProgress) => setProgress((all) => ({ ...all, [wf.id]: fn(all[wf.id] ?? empty) }));
  const firstOpen = wf.stages.findIndex((s) => !p.gates[s.id]?.approved);

  const createDoc = (templateId: string) => {
    const t = templateById(templateId)!;
    const existing = docs.find((d) => d.templateId === templateId);
    if (existing) return navigate("/builder/" + existing.id);
    const d = newDocument(t, user);
    setDocs((all) => [d, ...all]);
    navigate("/builder/" + d.id);
  };

  return (
    <>
      <div className="row spread">
        <div><StdBadge std={std} /><h1>{wf.title}</h1><p className="muted">{wf.description}</p></div>
        <div style={{ minWidth: 200 }}><div className="small muted">{Math.round(workflowPct(wf, p) * 100)}% of activities complete</div><Progress value={workflowPct(wf, p)} /></div>
      </div>
      <div className="row no-print" style={{ margin: "8px 0 16px" }}>
        <button onClick={() => confirm("Reset all progress for this workflow?") && update(() => empty)}>Reset progress</button>
        <button onClick={() => window.print()}>Print status report</button>
      </div>

      {wf.stages.map((s, i) => {
        const gate = p.gates[s.id];
        const acts = s.activities;
        const doneCount = acts.filter((a) => p.activities[a.id] === "done").length;
        const allDone = doneCount === acts.length;
        return (
          <div key={s.id} className={"card stage " + (gate?.approved ? "done" : i === firstOpen ? "active" : "")} style={{ marginBottom: 12 }}>
            <div className="row spread">
              <h3 style={{ margin: 0 }}>Stage {i + 1} · {s.title}</h3>
              <span className="small muted">{doneCount}/{acts.length} activities</span>
            </div>
            <p className="muted">{s.description}</p>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Activity</th><th>Owner</th><th>Outputs</th><th>Status</th><th className="no-print">Template</th></tr></thead>
                <tbody>
                  {acts.map((a) => {
                    const st = p.activities[a.id] ?? "todo";
                    return (
                      <tr key={a.id}>
                        <td>{a.title}</td>
                        <td className="muted">{a.owner}</td>
                        <td className="small">{a.outputs.join(", ")}</td>
                        <td><button className="ghost" onClick={() => update((p) => ({ ...p, activities: { ...p.activities, [a.id]: NEXT[st] } }))}>{LABEL[st]}</button></td>
                        <td className="no-print">{a.templateIds?.map((tid) => (
                          <button key={tid} className="ghost" onClick={() => createDoc(tid)}>📄 {templateById(tid)?.code}</button>
                        ))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="guidance" style={{ marginTop: 10 }}>
              <b>Gate:</b> {s.gate}
              {gate?.approved ? (
                <div className="row spread" style={{ marginTop: 6 }}>
                  <span style={{ color: "var(--ok)" }}>✔ Approved by {gate.by || "—"} on {gate.date}{gate.note ? ` — ${gate.note}` : ""}</span>
                  <button className="no-print" onClick={() => update((p) => { const g = { ...p.gates }; delete g[s.id]; return { ...p, gates: g }; })}>Revoke</button>
                </div>
              ) : (
                <div className="row no-print" style={{ marginTop: 6 }}>
                  <button className="primary" disabled={!allDone} title={allDone ? "" : "Complete all activities first"}
                    onClick={() => {
                      const by = prompt("Approved by (name / role):", user) ?? "";
                      if (!by) return;
                      const note = prompt("Approval note (optional):") ?? "";
                      update((p) => ({ ...p, gates: { ...p.gates, [s.id]: { approved: true, by, date: today(), note } } }));
                    }}>Approve gate</button>
                  {!allDone && <span className="small muted">Complete all activities to approve this gate.</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
