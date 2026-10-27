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

export default function Templates({ std, focusId }: { std?: StandardId; focusId?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(focusId ?? null);
  useEffect(() => { if (focusId) { setOpen(focusId); setTimeout(() => document.getElementById("tpl-" + focusId)?.scrollIntoView({ block: "center", behavior: "smooth" }), 50); } }, [focusId]);
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
              <div key={t.id} id={"tpl-" + t.id} className={"card" + (focusId === t.id ? " focus-card" : "")} style={{ display: "flex", flexDirection: "column" }}>
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
      <HouseTemplates />
      {use && <UseDialog t={use} onClose={() => setUse(null)} />}
    </>
  );
}

/** Organization house templates: saved from a document with "Save as house template". */
function HouseTemplates() {
  const { user, toast } = useSession();
  const [rows, setRows] = useState<{ id: string; name: string; templateId: string; createdBy: string; createdByName: string; createdAt: string }[] | null>(null);
  const load = () => api<{ templates: NonNullable<typeof rows> }>("/house-templates").then((r) => setRows(r.templates));
  useEffect(() => { load(); }, []);
  if (!rows) return null;
  return (
    <>
      <h2>House templates</h2>
      <p className="small muted">Your organization's approved versions of the templates above{user.organization ? ` (shared with colleagues in ${user.organization} who work on a project with you)` : " (add your organization to your profile to share them with colleagues on your projects)"}. Open any document and choose ⭐ Save as house template; then pick it when creating a new document.</p>
      {rows.length === 0 ? <div className="card muted small">No house templates yet.</div> : (
        <div className="card table-wrap"><table className="data"><tbody>{rows.map((h) => (
          <tr key={h.id}><td><span className="badge">{templates.find((t) => t.id === h.templateId)?.code}</span> {h.name}</td><td className="small muted">{h.createdByName}</td>
            <td>{(h.createdBy === user.id || user.role === "admin") && <button className="ghost small" onClick={async () => { if (!confirm(`Delete house template "${h.name}"?`)) return; try { await api(`/house-templates/${h.id}`, { method: "DELETE" }); load(); } catch (e) { toast((e as Error).message, "error"); } }}>Delete</button>}</td></tr>
        ))}</tbody></table></div>
      )}
    </>
  );
}
