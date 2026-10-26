import { usePortal } from "../App";
import { Progress, StateTag, StdBadge } from "../components/common";
import { cdeStates } from "../data/iso19650";
import { templateById, templates } from "../data/templates";
import type { StandardId } from "../data/types";
import { workflowFor, workflowPct } from "./Workflows";

export default function Dashboard() {
  const { docs, progress, user, setUser } = usePortal();
  const stds: StandardId[] = ["iso19650", "iso42001"];

  return (
    <>
      <h1>Information Management Portal</h1>
      <p className="muted">Knowledge, workflows, templates and controlled document creation for ISO 19650 (BIM) and ISO/IEC 42001 (AI management systems).</p>

      <div className="card row no-print" style={{ margin: "16px 0" }}>
        <label style={{ margin: 0 }}>Your name (used as author / approver):</label>
        <input style={{ maxWidth: 280 }} value={user} onChange={(e) => setUser(e.target.value)} placeholder="e.g. K. Shawky — Information Manager" />
      </div>

      <div className="grid g2">
        {stds.map((std) => {
          const wf = workflowFor(std);
          const pct = workflowPct(wf, progress[wf.id]);
          const approved = wf.stages.filter((s) => progress[wf.id]?.gates[s.id]?.approved).length;
          return (
            <div key={std} className="card">
              <StdBadge std={std} />
              <h3>{wf.title}</h3>
              <Progress value={pct} />
              <p className="small muted">{Math.round(pct * 100)}% activities · {approved}/{wf.stages.length} gates approved</p>
              <div className="row">
                <a className="btn" href={`#/workflow/${std}`}>Open workflow</a>
                <a className="btn" href={`#/library/${std}`}>Library</a>
                <a className="btn" href={`#/templates/${std}`}>{templates.filter((t) => t.standard === std).length} templates</a>
              </div>
            </div>
          );
        })}
      </div>

      <h2>Document register</h2>
      <div className="grid g4">
        {cdeStates.map((s) => (
          <div key={s.id} className="card">
            <StateTag state={s.id} />
            <div className="stat">{docs.filter((d) => d.state === s.id).length}</div>
            <div className="small muted">{s.title}</div>
          </div>
        ))}
      </div>

      <h2>Recently updated</h2>
      {docs.length === 0 ? (
        <div className="card muted">No documents yet. Start from a <a href="#/templates">template</a> or from a workflow activity.</div>
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead><tr><th>Document</th><th>Standard</th><th>Revision</th><th>State</th><th>Updated</th></tr></thead>
            <tbody>
              {[...docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8).map((d) => {
                const t = templateById(d.templateId);
                return (
                  <tr key={d.id}>
                    <td><a href={"#/builder/" + d.id}>{d.title}</a><div className="small muted">{d.containerName}</div></td>
                    <td>{t && <StdBadge std={t.standard} />}</td>
                    <td>{d.revision}</td>
                    <td><StateTag state={d.state} /> <span className="small">{d.suitability}</span></td>
                    <td className="small muted">{d.updatedAt.slice(0, 16).replace("T", " ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
