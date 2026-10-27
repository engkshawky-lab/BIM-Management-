import { useCallback, useEffect, useState } from "react";
import { useSession } from "../App";
import { api, canEdit, canManage } from "../lib/api";
import { exportCsv } from "../lib/export";
import type { ProjectData } from "./Project";

// Health & safety information register (ISO 19650-6): hazards and residual risks that people
// building, operating, maintaining or demolishing the asset need to know about.

interface HsItem { id: string; number: number; hazard: string; location: string; phase: string; description: string; controls: string; residual: string; audience: string; fileId: string | null; ownerId: string | null; status: string }
const PHASES = ["Design", "Construction", "Operation", "Maintenance", "Demolition"];
const RESIDUAL_TONE: Record<string, string> = { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" };
const ref = (n: number) => `HS${String(n).padStart(2, "0")}`;
const BLANK: Partial<HsItem> = { hazard: "", location: "", phase: "Construction", description: "", controls: "", residual: "Medium", audience: "", fileId: null, ownerId: null, status: "Open" };

export default function HealthSafety({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [items, setItems] = useState<HsItem[]>([]);
  const [files, setFiles] = useState<{ id: string; name: string; state: string }[]>([]);
  const [phase, setPhase] = useState("");
  const [edit, setEdit] = useState<Partial<HsItem> | null>(null);
  const load = useCallback(() => api<{ items: HsItem[] }>(`/projects/${pid}/hs`).then((r) => setItems(r.items)), [pid]);
  useEffect(() => { load(); api<{ files: { id: string; name: string; state: string }[] }>(`/projects/${pid}/files`).then((r) => setFiles(r.files)); }, [load, pid]);
  const member = (id: string | null) => data.members.find((m) => m.userId === id)?.name ?? "—";
  const list = phase ? items.filter((i) => i.phase === phase) : items;
  const open = items.filter((i) => i.status === "Open");

  const save = async () => {
    if (!edit) return;
    const { id, number: _n, ...body } = edit as HsItem;
    try { if (id) await api(`/projects/${pid}/hs/${id}`, { method: "PUT", body }); else await api(`/projects/${pid}/hs`, { body }); setEdit(null); load(); }
    catch (e) { toast((e as Error).message, "error"); }
  };

  return (
    <>
      <div className="grid g2" style={{ marginBottom: 12 }}>
        <div className="card">
          <b>Health & safety information</b>
          <p className="small muted">ISO 19650-6: record hazards and residual risks so the information reaches the people who build, operate, maintain and demolish the asset. Link the supporting information container from the CDE.</p>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {canEdit(data.role) && <button className="primary" onClick={() => setEdit({ ...BLANK })}>+ H&S item</button>}
            <button onClick={() => exportCsv(`${data.project.code}-hs-register`, ["Ref", "Hazard", "Location", "Phase", "Description", "Controls", "Residual risk", "Shared with", "Owner", "Status", "Information container"],
              items.map((i) => [ref(i.number), i.hazard, i.location, i.phase, i.description, i.controls, i.residual, i.audience, member(i.ownerId), i.status, files.find((f) => f.id === i.fileId)?.name ?? ""]))}>⬇ CSV</button>
          </div>
        </div>
        <div className="card">
          <b>Summary</b>
          <p className="small">{open.length} open · {open.filter((i) => i.residual === "High").length} high residual · {items.filter((i) => !i.fileId).length} without linked information</p>
          <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
            <button className={phase ? "ghost small" : "small primary"} onClick={() => setPhase("")}>All ({items.length})</button>
            {PHASES.map((p) => <button key={p} className={phase === p ? "small primary" : "ghost small"} onClick={() => setPhase(p)}>{p} ({items.filter((i) => i.phase === p).length})</button>)}
          </div>
        </div>
      </div>
      <div className="card table-wrap"><table className="data">
        <thead><tr><th>Ref</th><th>Hazard</th><th>Phase</th><th>Controls</th><th>Residual</th><th>Shared with</th><th>Owner</th><th>Status</th></tr></thead>
        <tbody>{list.map((i) => (
          <tr key={i.id} className="clickable" onClick={() => canEdit(data.role) && setEdit(i)}>
            <td className="mono small">{ref(i.number)}</td>
            <td>{i.hazard}<div className="tiny muted">{[i.location, i.description].filter(Boolean).join(" · ")}</div></td>
            <td className="small">{i.phase}</td>
            <td className="small">{i.controls}</td>
            <td><span className="state" style={{ background: RESIDUAL_TONE[i.residual] }}>{i.residual}</span></td>
            <td className="small">{i.audience || "—"}</td>
            <td className="small">{member(i.ownerId)}{i.fileId && <div className="tiny"><a href={`/api/projects/${pid}/files/${i.fileId}/download`} onClick={(e) => e.stopPropagation()}>⬇ {files.find((f) => f.id === i.fileId)?.name ?? "file"}</a></div>}</td>
            <td className="small">{i.status}</td>
          </tr>
        ))}{list.length === 0 && <tr><td colSpan={8} className="muted">No H&S information{phase ? ` for ${phase.toLowerCase()}` : " yet"}.</td></tr>}</tbody>
      </table></div>
      {edit && (
        <div className="modal-bg" onClick={() => setEdit(null)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 style={{ marginTop: 0 }}>{edit.id ? ref(edit.number!) : "New H&S item"}</h2>
          <label>Hazard *</label><input value={edit.hazard} onChange={(e) => setEdit({ ...edit, hazard: e.target.value })} placeholder="e.g. Work at height to access roof plant" />
          <div className="grid g2">
            <div><label>Location</label><input value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} /></div>
            <div><label>Lifecycle phase</label><select value={edit.phase} onChange={(e) => setEdit({ ...edit, phase: e.target.value })}>{PHASES.map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><label>Residual risk</label><select value={edit.residual} onChange={(e) => setEdit({ ...edit, residual: e.target.value })}>{["Low", "Medium", "High"].map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><label>Status</label><select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{["Open", "Closed"].map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><label>Owner</label><select value={edit.ownerId ?? ""} onChange={(e) => setEdit({ ...edit, ownerId: e.target.value || null })}><option value="">—</option>{data.members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}</select></div>
            <div><label>Information container</label><select value={edit.fileId ?? ""} onChange={(e) => setEdit({ ...edit, fileId: e.target.value || null })}><option value="">—</option>{files.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.state})</option>)}</select></div>
          </div>
          <label>Description</label><textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
          <label>Control measures</label><textarea value={edit.controls} onChange={(e) => setEdit({ ...edit, controls: e.target.value })} placeholder="Design changes, permanent measures and safe systems of work" />
          <label>Shared with</label><input value={edit.audience} onChange={(e) => setEdit({ ...edit, audience: e.target.value })} placeholder="e.g. Contractor, facilities management, maintenance team" />
          <div className="row spread" style={{ marginTop: 12 }}>
            {edit.id && canManage(data.role) ? <button className="danger" onClick={async () => { if (!confirm("Delete this item?")) return; await api(`/projects/${pid}/hs/${edit.id}`, { method: "DELETE" }); setEdit(null); load(); }}>Delete</button> : <span />}
            <div className="row"><button onClick={() => setEdit(null)}>Cancel</button><button className="primary" disabled={!edit.hazard?.trim()} onClick={save}>Save</button></div>
          </div>
        </div></div>
      )}
    </>
  );
}
