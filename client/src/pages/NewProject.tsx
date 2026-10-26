import { useState, type FormEvent } from "react";
import { navigate, useSession } from "../App";
import { api, type Project } from "../lib/api";

export const STAGES = ["Strategic definition", "Preparation & briefing", "Concept design", "Spatial coordination", "Technical design", "Manufacturing & construction", "Handover", "In use"];

export function ProjectForm({ initial, submitLabel, onSubmit }: { initial?: Partial<Project>; submitLabel: string; onSubmit: (p: Partial<Project>) => Promise<void> }) {
  const [f, setF] = useState({
    name: initial?.name ?? "", code: initial?.code ?? "", appointingParty: initial?.appointingParty ?? "", location: initial?.location ?? "",
    stage: initial?.stage ?? "", description: initial?.description ?? "", standards: initial?.standards ?? (["iso19650"] as Project["standards"]),
  });
  const [busy, setBusy] = useState(false);
  const toggle = (s: "iso19650" | "iso42001") => setF({ ...f, standards: f.standards.includes(s) ? f.standards.filter((x) => x !== s) : [...f.standards, s] });

  return (
    <form className="card" onSubmit={async (e: FormEvent) => { e.preventDefault(); setBusy(true); try { await onSubmit(f); } finally { setBusy(false); } }}>
      <div className="grid g2">
        <div><label>Project name *</label><input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label>Project code * <span className="muted small">(2–6 chars, first field of every container name)</span></label>
          <input required pattern="[A-Za-z0-9]{2,6}" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="e.g. TWA01" /></div>
        <div><label>Appointing party (client)</label><input value={f.appointingParty} onChange={(e) => setF({ ...f, appointingParty: e.target.value })} /></div>
        <div><label>Location</label><input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
        <div><label>Current stage</label><select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}><option value="">—</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label>Standards in scope *</label>
          <div className="row">
            <label className="check"><input type="checkbox" checked={f.standards.includes("iso19650")} onChange={() => toggle("iso19650")} /> ISO 19650 (BIM information management)</label>
            <label className="check"><input type="checkbox" checked={f.standards.includes("iso42001")} onChange={() => toggle("iso42001")} /> ISO/IEC 42001 (AI management system)</label>
          </div>
        </div>
      </div>
      <label>Description</label><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Scope, asset type, key objectives…" />
      <button className="primary" style={{ marginTop: 12 }} disabled={busy || f.standards.length === 0}>{busy ? "Saving…" : submitLabel}</button>
    </form>
  );
}

export default function NewProject() {
  const { toast } = useSession();
  return (
    <>
      <h1>New project</h1>
      <p className="muted">Creates the project with standard CDE folders (WIP, Shared, Published, Archived, Client information, Reference). You become the project owner and can invite your team.</p>
      <ProjectForm submitLabel="Create project" onSubmit={async (p) => {
        try { const r = await api<{ id: string }>("/projects", { body: p }); toast("Project created"); navigate(`/projects/${r.id}`); }
        catch (e) { toast((e as Error).message, "error"); }
      }} />
    </>
  );
}
