import { useEffect, useMemo, useState } from "react";
import { navigate, useSession } from "../App";
import { StateTag, StdBadge } from "../components/common";
import { templateById, templates } from "../../../shared/data/templates";
import type { DocTemplate } from "../../../shared/data/types";
import { api, canEdit, fmtDate, type DocRow } from "../lib/api";
import type { ProjectData } from "./Project";

const REVIEW_LABEL: Record<string, string> = { requested: "🕓 review requested", approved: "✔ review approved", changes: "✎ changes requested" };

/** Templates fed by structured data are generated, never typed twice. */
export function GeneratedNotice({ projectId, t, onClose }: { projectId: string; t: DocTemplate; onClose: () => void }) {
  const { toast } = useSession();
  const g = t.generatedFrom!;
  return (
    <div className="banner info">
      <b>{t.code} is generated from the {g.label}.</b> Keep the data there and generate the document, so the plan and the document never disagree.
      <div className="row" style={{ marginTop: 8 }}>
        <button className="primary" onClick={() => { onClose(); navigate(`/projects/${projectId}/${g.hubPath}`); }}>Open {g.label}</button>
        {g.kind !== "tidp" && <button onClick={async () => {
          try { const r = await api<{ id: string }>(`/projects/${projectId}/delivery/generate`, { body: { kind: g.kind } }); onClose(); navigate(`/projects/${projectId}/documents/${r.id}`); }
          catch (e) { toast((e as Error).message, "error"); }
        }}>Generate {t.code} now</button>}
      </div>
    </div>
  );
}

export function NewDocumentDialog({ data, initialTemplate, onClose }: { data: ProjectData; initialTemplate?: string; onClose: () => void }) {
  const { toast } = useSession();
  const { project } = data;
  const available = templates.filter((t) => project.standards.includes(t.standard));
  const [templateId, setTemplateId] = useState(initialTemplate && available.some((t) => t.id === initialTemplate) ? initialTemplate : available[0]?.id);
  const t = templateById(templateId ?? "");
  const [title, setTitle] = useState("");
  const [container, setContainer] = useState("");
  useEffect(() => { if (t) setContainer(`${project.code}-XXX-ZZ-ZZ-${t.standard === "iso19650" ? "RP" : "RP"}-Z-0001`); }, [t, project.code]);

  const create = async () => {
    try {
      const r = await api<{ id: string }>(`/projects/${project.id}/documents`, { body: { templateId, title: title || undefined, containerName: container } });
      toast("Document created"); onClose(); navigate(`/projects/${project.id}/documents/${r.id}`);
    } catch (e) { toast((e as Error).message, "error"); }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>New controlled document</h2>
        <label>Template</label>
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {(["iso19650", "iso42001"] as const).filter((s) => project.standards.includes(s)).map((s) => (
            <optgroup key={s} label={s === "iso19650" ? "ISO 19650" : "ISO/IEC 42001"}>
              {available.filter((x) => x.standard === s).map((x) => <option key={x.id} value={x.id}>{x.code} — {x.title}</option>)}
            </optgroup>
          ))}
        </select>
        {t && <p className="small muted">{t.purpose} <br />{t.clauseRefs.join(" · ")} · {t.sections.length} sections. Project details are filled in automatically.</p>}
        {t?.generatedFrom ? <GeneratedNotice projectId={project.id} t={t} onClose={onClose} /> : <>
        <label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t?.title} />
        <label>Container name / document number</label><input value={container} onChange={(e) => setContainer(e.target.value.toUpperCase())} />
        <p className="small muted">Replace XXX with your originator code. See the <a href="#/knowledge/iso19650/naming" target="_blank">naming tool</a>.</p>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}><button onClick={onClose}>Cancel</button><button className="primary" onClick={create}>Create document</button></div>
        </>}
      </div>
    </div>
  );
}

export default function Documents({ data }: { data: ProjectData }) {
  const pid = data.project.id;
  const [docs, setDocs] = useState<DocRow[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [q, setQ] = useState(""); const [state, setState] = useState("");
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    api<{ documents: DocRow[] }>(`/projects/${pid}/documents`).then((r) => setDocs(r.documents));
    api<{ counts: Record<string, number> }>(`/projects/${pid}/comment-counts`).then((r) => setCounts(r.counts));
  }, [pid]);

  const list = useMemo(() => (docs ?? []).filter((d) => (!state || d.state === state) && (!q || (d.title + d.containerName + d.templateId).toLowerCase().includes(q.toLowerCase()))), [docs, q, state]);

  return (
    <>
      <div className="row spread" style={{ marginBottom: 12 }}>
        <div className="row">
          <input placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 260 }} />
          <select value={state} onChange={(e) => setState(e.target.value)} style={{ width: "auto" }}><option value="">All states</option>{["WIP", "SHARED", "PUBLISHED", "ARCHIVED"].map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        {canEdit(data.role) && <button className="primary" onClick={() => setCreating(true)}>+ New document</button>}
      </div>
      {docs === null ? <p className="muted">Loading…</p> : docs.length === 0 ? (
        <div className="card empty"><h3>No documents yet</h3><p className="muted">Create an EIR, BEP, MIDP, AI policy or any other controlled document from the template library.</p>
          {canEdit(data.role) && <button className="primary" onClick={() => setCreating(true)}>+ New document</button>}</div>
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead><tr><th>Document</th><th>Template</th><th>Rev</th><th>Status</th><th>Review</th><th>Author</th><th>Updated</th></tr></thead>
            <tbody>
              {list.map((d) => {
                const t = templateById(d.templateId);
                return (
                  <tr key={d.id} className="clickable" onClick={() => navigate(`/projects/${pid}/documents/${d.id}`)}>
                    <td><a href={`#/projects/${pid}/documents/${d.id}`}>{d.title}</a>{counts[d.id] ? <span className="badge" title="Open comments" style={{ marginLeft: 6 }}>💬 {counts[d.id]}</span> : null}<div className="small muted"><code>{d.containerName}</code></div></td>
                    <td>{t && <><span className="badge">{t.code}</span> <StdBadge std={t.standard} /></>}</td>
                    <td>{d.revision}</td>
                    <td><StateTag state={d.state} /> <span className="small">{d.suitability}</span></td>
                    <td className="small">{REVIEW_LABEL[d.reviewStatus] ?? ""}</td>
                    <td className="small">{d.authorName}</td>
                    <td className="small muted nowrap">{fmtDate(d.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {creating && <NewDocumentDialog data={data} onClose={() => setCreating(false)} />}
    </>
  );
}
