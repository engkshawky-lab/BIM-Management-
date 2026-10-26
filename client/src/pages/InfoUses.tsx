import { useEffect, useMemo, useState } from "react";
import { navigate, useSession } from "../App";
import { INFO_USES, USE_CATEGORIES, useByCode, type InfoUse, type ProjectInfoUse, type UsePhase, type UsePriority } from "../../../shared/data/infoUses";
import type { TaskTeam } from "../../../shared/delivery";
import { api, canEdit } from "../lib/api";
import { exportCsv } from "../lib/export";
import { Icon } from "../shell/icons";
import type { ProjectData } from "./Project";

const PHASES: UsePhase[] = ["Plan", "Design", "Construct", "Operate"];

function useFilter() {
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState<UsePhase | "">("");
  const match = (x: InfoUse) => (!phase || x.phases.includes(phase)) && (!q || `${x.code} ${x.name} ${x.description} ${x.category}`.toLowerCase().includes(q.toLowerCase()));
  const bar = (
    <div className="row" style={{ marginBottom: 10 }}>
      <label className="search-box" style={{ margin: 0, maxWidth: 320 }}><Icon name="search" size={15} /><input placeholder="Search uses…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <div className="seg"><button className={!phase ? "on" : ""} onClick={() => setPhase("")}>All phases</button>{PHASES.map((p) => <button key={p} className={phase === p ? "on" : ""} onClick={() => setPhase(p)}>{p}</button>)}</div>
    </div>
  );
  return { match, bar };
}

function UseDetail({ u }: { u: InfoUse }) {
  return (
    <div className="small" style={{ display: "grid", gap: 4, marginTop: 6 }}>
      <div>{u.description}</div>
      <div><b>Value:</b> {u.value}</div>
      <div><b>Inputs:</b> {u.inputs.join(", ")}</div>
      <div><b>Deliverables:</b> {u.deliverables.join(", ")}</div>
      <div><b>Information need:</b> {u.loin}</div>
      <div><b>Capability:</b> {u.skills.join(", ")} <span className="muted">· {u.clause}</span></div>
    </div>
  );
}

/** Knowledge hub: the reference library of information uses. */
export function InfoUseLibrary() {
  const { match, bar } = useFilter();
  return (
    <>
      <p className="muted">Information uses are the purposes for which information is produced (ISO 19650-1 §5.1). Selecting them early drives the information requirements, the level of information need, the deliverables in the MIDP and the capability expected of each task team. Select them for a project under <b>Delivery › Information uses</b>.</p>
      {bar}
      {USE_CATEGORIES.map((c) => {
        const list = INFO_USES.filter((x) => x.category === c && match(x));
        return list.length ? <div key={c} style={{ marginBottom: 14 }}><h3>{c}</h3><div className="grid g2">{list.map((u) => (
          <div key={u.code} className="card"><div className="row spread"><b>{u.code} · {u.name}</b><span className="tiny muted">{u.phases.join(" · ")}</span></div><UseDetail u={u} /></div>
        ))}</div></div> : null;
      })}
    </>
  );
}

/** Project hub: choose uses, priority and responsible task teams; generate the schedule document. */
export default function ProjectInfoUses({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const editor = canEdit(data.role);
  const [sel, setSel] = useState<ProjectInfoUse[] | null>(null);
  const [teams, setTeams] = useState<TaskTeam[]>([]);
  const [open, setOpen] = useState("");
  const [dirty, setDirty] = useState(false);
  const { match, bar } = useFilter();
  useEffect(() => {
    api<{ uses: ProjectInfoUse[] }>(`/projects/${pid}/info-uses`).then((r) => setSel(r.uses));
    api<{ teams: TaskTeam[] }>(`/projects/${pid}/delivery`).then((r) => setTeams(r.teams));
  }, [pid]);
  const byCode = useMemo(() => new Map((sel ?? []).map((x) => [x.code, x])), [sel]);
  if (!sel) return <p className="muted">Loading…</p>;

  const update = (next: ProjectInfoUse[]) => { setSel(next); setDirty(true); };
  const toggle = (code: string) => update(byCode.has(code) ? sel.filter((x) => x.code !== code) : [...sel, { code, priority: "Medium", taskTeams: [], notes: "" }]);
  const patch = (code: string, p: Partial<ProjectInfoUse>) => update(sel.map((x) => (x.code === code ? { ...x, ...p } : x)));
  const save = async () => {
    try { await api(`/projects/${pid}/info-uses`, { method: "PUT", body: { uses: sel } }); setDirty(false); toast("Information uses saved"); } catch (e) { toast((e as Error).message, "error"); }
  };
  const generate = async () => {
    try { if (dirty) await save(); const r = await api<{ id: string }>(`/projects/${pid}/delivery/generate`, { body: { kind: "info-uses" } }); navigate(`/projects/${pid}/documents/${r.id}`); } catch (e) { toast((e as Error).message, "error"); }
  };
  const phaseCount = PHASES.map((p) => ({ p, n: sel.filter((x) => useByCode(x.code)?.phases.includes(p)).length }));

  return (
    <>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <p className="muted" style={{ margin: 0, maxWidth: 760 }}>Choose why information is being produced on this project. The selection, with priority and responsible task teams, becomes the Information Uses Schedule referenced by the EIR and BEP.</p>
        <div className="row">
          {sel.length > 0 && <button onClick={() => exportCsv(`${data.project.code}-information-uses`, ["Code", "Use", "Phases", "Priority", "Task teams", "Notes"], sel.map((x) => { const u = useByCode(x.code)!; return [u.code, u.name, u.phases.join(", "), x.priority, x.taskTeams.map((t) => teams.find((y) => y.id === t)?.name ?? "").join(", "), x.notes]; }))}>⬇ CSV</button>}
          {editor && <button disabled={!dirty} onClick={save}>Save</button>}
          {editor && <button className="primary" disabled={!sel.length} onClick={generate}>📄 Generate schedule</button>}
        </div>
      </div>
      <div className="grid g3" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 12 }}>
        <div className="card"><div className="stat">{sel.length}</div><div className="small muted">uses selected</div></div>
        {phaseCount.map(({ p, n }) => <div key={p} className="card"><div className="stat">{n}</div><div className="small muted">{p}</div></div>)}
      </div>
      {bar}
      <div className="table-wrap"><table className="data">
        <thead><tr><th style={{ width: 30 }} /><th>Use</th><th>Phases</th><th>Priority</th><th>Responsible task teams</th><th>Notes</th></tr></thead>
        <tbody>{INFO_USES.filter(match).map((u) => {
          const s = byCode.get(u.code);
          return (
            <tr key={u.code} style={s ? undefined : { opacity: 0.75 }}>
              <td><input type="checkbox" checked={!!s} disabled={!editor} onChange={() => toggle(u.code)} aria-label={`Select ${u.name}`} /></td>
              <td><button className="linklike" onClick={() => setOpen(open === u.code ? "" : u.code)}><b>{u.code}</b> {u.name}</button>{open === u.code && <UseDetail u={u} />}</td>
              <td className="small">{u.phases.join(", ")}</td>
              <td>{s && <select value={s.priority} disabled={!editor} onChange={(e) => patch(u.code, { priority: e.target.value as UsePriority })}><option>High</option><option>Medium</option><option>Low</option></select>}</td>
              <td>{s && (teams.length ? <div className="chips">{teams.map((t) => (
                <button key={t.id} disabled={!editor} className={"chip" + (s.taskTeams.includes(t.id) ? " on" : "")}
                  onClick={() => patch(u.code, { taskTeams: s.taskTeams.includes(t.id) ? s.taskTeams.filter((x) => x !== t.id) : [...s.taskTeams, t.id] })}>{t.name}</button>
              ))}</div> : <span className="tiny muted">Add task teams under Teams & milestones</span>)}</td>
              <td>{s && <input value={s.notes} disabled={!editor} placeholder="Scope, software, exclusions…" onChange={(e) => patch(u.code, { notes: e.target.value })} />}</td>
            </tr>
          );
        })}</tbody>
      </table></div>
    </>
  );
}
