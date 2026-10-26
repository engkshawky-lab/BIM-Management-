import { useEffect, useState } from "react";
import { navigate, useSession } from "../App";
import { StdBadge } from "../components/common";
import { templates } from "../../../shared/data/templates";
import type { DocTemplate, StandardId } from "../../../shared/data/types";
import { api, canEdit, type Project } from "../lib/api";
import { GeneratedNotice } from "./Documents";

function UseDialog({ t, onClose }: { t: DocTemplate; onClose: () => void }) {
  const { toast } = useSession();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [pid, setPid] = useState("");
  useEffect(() => { api<{ projects: Project[] }>("/projects").then((r) => {
    const ok = r.projects.filter((p) => canEdit(p.role) && p.standards.includes(t.standard));
    setProjects(ok); setPid(ok[0]?.id ?? "");
  }); }, [t.standard]);
  const create = async () => {
    const p = projects!.find((x) => x.id === pid)!;
    try {
      const r = await api<{ id: string }>(`/projects/${pid}/documents`, { body: { templateId: t.id, containerName: `${p.code}-XXX-ZZ-ZZ-RP-Z-0001` } });
      navigate(`/projects/${pid}/documents/${r.id}`);
    } catch (e) { toast((e as Error).message, "error"); }
  };
  return (
    <div className="modal-bg" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}>
      <h2 style={{ marginTop: 0 }}>Use {t.code} in a project</h2>
      {projects === null ? <p className="muted">Loading…</p> : projects.length === 0 ? (
        <p className="muted">You need a project with {t.standard === "iso19650" ? "ISO 19650" : "ISO/IEC 42001"} in scope where you are an editor. <a href="#/projects/new">Create a project</a>.</p>
      ) : <>
        <label>Project</label>
        <select value={pid} onChange={(e) => setPid(e.target.value)}>{projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select>
        {t.generatedFrom ? <GeneratedNotice projectId={pid} t={t} onClose={onClose} />
          : <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}><button onClick={onClose}>Cancel</button><button className="primary" onClick={create}>Create document</button></div>}
      </>}
    </div></div>
  );
}

export default function Templates({ std }: { std?: StandardId }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [use, setUse] = useState<DocTemplate | null>(null);
  const list = templates.filter((t) => (!std || t.standard === std) && (!q || (t.title + t.code + t.purpose + t.category).toLowerCase().includes(q.toLowerCase())));
  const categories = [...new Set(list.map((t) => t.category))];

  return (
    <>
      <h2 style={{ marginTop: 4 }}>Template library</h2>
      <p className="muted">Structured templates with guidance, worked examples and clause references. Use one in a project to create a controlled document your team can edit, review and publish.</p>
      <input placeholder="Search templates…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 420, margin: "8px 0 4px" }} />
      {categories.map((c) => (
        <div key={c}>
          <h2>{c}</h2>
          <div className="grid g3">
            {list.filter((t) => t.category === c).map((t) => (
              <div key={t.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div className="row spread"><span className="badge">{t.code}</span><StdBadge std={t.standard} /></div>
                <h3>{t.title}</h3>
                <p className="small muted" style={{ flex: 1 }}>{t.purpose}</p>
                <div className="small muted">{t.clauseRefs.join(" · ")} · {t.sections.length} sections</div>
                {t.generatedFrom && <div className="tiny" style={{ color: "var(--accent)" }}>⚙ Generated from the {t.generatedFrom.label}</div>}
                {open === t.id && <ol className="small" style={{ paddingLeft: 18 }}>{t.sections.map((s) => <li key={s.id}><b>{s.title}</b> — {s.fields.map((f) => f.label).join(", ")}</li>)}</ol>}
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="primary" onClick={() => setUse(t)}>Use in project…</button>
                  <button className="ghost" onClick={() => setOpen(open === t.id ? null : t.id)}>{open === t.id ? "Hide" : "Contents"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {use && <UseDialog t={use} onClose={() => setUse(null)} />}
    </>
  );
}
