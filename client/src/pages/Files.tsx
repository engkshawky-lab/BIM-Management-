import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "../App";
import { StateTag } from "../components/common";
import { SUITABILITY, type CdeState } from "../../../shared/documents";
import { api, canEdit, canManage, fmtDate, fmtSize, type FileRow, type FileVersion, type Folder } from "../lib/api";
import { Comments } from "./DocumentEditor";
import type { ProjectData } from "./Project";

const ICON: Record<string, string> = { pdf: "📕", docx: "📘", doc: "📘", xlsx: "📗", xls: "📗", csv: "📗", ifc: "🏗", rvt: "🏗", dwg: "📐", png: "🖼", jpg: "🖼", jpeg: "🖼", zip: "🗜", md: "📝", txt: "📝" };
const icon = (name: string) => ICON[name.split(".").pop()?.toLowerCase() ?? ""] ?? "📄";

export default function Files({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState<string>("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const loadFolders = useCallback(() => api<{ folders: Folder[] }>(`/projects/${pid}/folders`).then((r) => {
    setFolders(r.folders);
    setFolderId((cur) => cur || r.folders.find((f) => !f.parentId)?.id || "");
  }), [pid]);
  const loadFiles = useCallback(() => folderId && api<{ files: FileRow[] }>(`/projects/${pid}/files?folderId=${folderId}`).then((r) => setFiles(r.files)), [pid, folderId]);
  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => { loadFiles(); setSelected(null); }, [loadFiles]);

  const folder = folders.find((f) => f.id === folderId);
  const upload = async (list: FileList | File[], fileId?: string) => {
    for (const file of Array.from(list)) {
      const form = new FormData();
      form.append("folderId", folderId); if (fileId) form.append("fileId", fileId);
      form.append("file", file);
      setUploading((n) => n + 1);
      try { await api(`/projects/${pid}/files`, { form }); toast(`Uploaded ${file.name}`); }
      catch (e) { toast(`${file.name}: ${(e as Error).message}`, "error"); }
      finally { setUploading((n) => n - 1); }
    }
    loadFiles();
  };

  const tree = (parent: string | null, depth = 0): JSX.Element[] => folders.filter((f) => f.parentId === parent).flatMap((f) => [
    <button key={f.id} className={"folder" + (f.id === folderId ? " on" : "")} style={{ paddingLeft: 10 + depth * 16 }} onClick={() => setFolderId(f.id)}>
      📁 {f.name} {f.cdeState && <span className="tiny-state">{f.cdeState}</span>}
    </button>,
    ...tree(f.id, depth + 1),
  ]);

  return (
    <div className="files-layout">
      <div className="card folder-tree">
        <div className="row spread"><b>Folders</b>
          {canEdit(data.role) && <button className="ghost small" onClick={async () => {
            const name = prompt(`New folder inside "${folder?.name ?? "root"}":`); if (!name) return;
            try { await api(`/projects/${pid}/folders`, { body: { name, parentId: folderId || null } }); loadFolders(); } catch (e) { toast((e as Error).message, "error"); }
          }}>+ Folder</button>}
        </div>
        {tree(null)}
      </div>

      <div className={"card dropzone" + (drag ? " drag" : "")}
        onDragOver={(e) => { if (canEdit(data.role)) { e.preventDefault(); setDrag(true); } }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (canEdit(data.role) && e.dataTransfer.files.length) upload(e.dataTransfer.files); }}>
        <div className="row spread">
          <div><b>{folder?.name}</b> {folder?.cdeState && <StateTag state={folder.cdeState} />}<div className="small muted">{files.length} files{uploading > 0 && ` · uploading ${uploading}…`}</div></div>
          <div className="row">
            {canManage(data.role) && folder && !folder.cdeState && files.length === 0 && <button className="ghost danger small" onClick={async () => {
              if (!confirm(`Delete empty folder ${folder.name}?`)) return;
              try { await api(`/projects/${pid}/folders/${folder.id}`, { method: "DELETE" }); setFolderId(""); loadFolders(); } catch (e) { toast((e as Error).message, "error"); }
            }}>Delete folder</button>}
            {canEdit(data.role) && <><button className="primary" onClick={() => input.current?.click()}>⬆ Upload files</button>
              <input ref={input} type="file" multiple hidden onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = ""; }} /></>}
          </div>
        </div>
        {files.length === 0 ? <div className="empty muted">{canEdit(data.role) ? "Drag files here or use Upload. Any format: PDF, DOCX, XLSX, IFC, RVT, DWG, images…" : "No files in this folder."}</div> : (
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Name</th><th>Status</th><th>Rev / ver</th><th>Updated by</th><th /></tr></thead>
            <tbody>{files.map((f) => (
              <tr key={f.id} className={"clickable" + (selected === f.id ? " selected" : "")} onClick={() => setSelected(f.id)}>
                <td>{icon(f.name)} {f.name}{f.containerName && <div className="small muted"><code>{f.containerName}</code></div>}{f.documentId && <div className="small"><a href={`#/projects/${pid}/documents/${f.documentId}`} onClick={(e) => e.stopPropagation()}>↳ source document</a></div>}</td>
                <td><StateTag state={f.state} /> <span className="small">{f.suitability}</span></td>
                <td className="small">{f.revision} · v{f.currentVersion}</td>
                <td className="small">{f.uploadedByName}<div className="muted">{fmtDate(f.updatedAt)}</div></td>
                <td><a className="btn small" href={`/api/projects/${pid}/files/${f.id}/download`} onClick={(e) => e.stopPropagation()}>⬇</a></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {selected && <FileDetail data={data} fileId={selected} folders={folders} onChanged={loadFiles} onClose={() => setSelected(null)} onNewVersion={(list) => upload(list, selected)} />}
    </div>
  );
}

function FileDetail({ data, fileId, folders, onChanged, onClose, onNewVersion }: {
  data: ProjectData; fileId: string; folders: Folder[]; onChanged: () => void; onClose: () => void; onNewVersion: (f: FileList) => void;
}) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [info, setInfo] = useState<{ file: FileRow; versions: FileVersion[] } | null>(null);
  const ver = useRef<HTMLInputElement>(null);
  const load = useCallback(() => api<{ file: FileRow; versions: FileVersion[] }>(`/projects/${pid}/files/${fileId}`).then(setInfo), [pid, fileId]);
  useEffect(() => { load(); }, [load]);
  if (!info) return <div className="card file-detail muted">Loading…</div>;
  const f = info.file;
  const update = async (body: Partial<FileRow> & { overrideReason?: string }) => {
    try { await api(`/projects/${pid}/files/${fileId}`, { method: "PUT", body }); load(); onChanged(); toast("Updated"); }
    catch (e) {
      const msg = (e as Error).message;
      // Failed validation blocks sharing; managers may override with a recorded reason.
      if (/failed validation/.test(msg) && canManage(data.role) && !body.overrideReason) {
        const reason = prompt(`${msg}\n\nAs a manager you can override. Reason (recorded in the activity log):`);
        if (reason) return update({ ...body, overrideReason: reason });
      }
      toast(msg, "error"); load();
    }
  };
  const previewable = /\.(pdf|png|jpe?g|gif|txt)$/i.test(f.name);

  return (
    <div className="card file-detail">
      <div className="row spread"><b>{icon(f.name)} {f.name}</b><button className="ghost" onClick={onClose}>✕</button></div>
      {/\.ifc$|cobie.*\.xlsx$/i.test(f.name) && <div className="row small" style={{ margin: "6px 0" }}>
        <a href={`#/projects/${pid}/validation`}>🔍 Validation results</a>
        {canEdit(data.role) && <button className="small" onClick={async () => { try { const r = await api<{ id: string }>(`/projects/${pid}/files/${fileId}/validate`, { body: {} }); window.location.hash = `/projects/${pid}/validation/${r.id}`; } catch (e) { toast((e as Error).message, "error"); } }}>Validate now</button>}
      </div>}
      {previewable && <a className="small" href={`/api/projects/${pid}/files/${fileId}/download?inline=1`} target="_blank" rel="noreferrer">Open preview ↗</a>}
      <fieldset disabled={!canEdit(data.role)} style={{ border: 0, padding: 0, margin: 0 }}>
        <label>Container name</label>
        <input defaultValue={f.containerName} onBlur={(e) => e.target.value !== f.containerName && update({ containerName: e.target.value.toUpperCase() })} placeholder="PRJ-ORG-ZZ-ZZ-DR-A-0001" />
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div><label>CDE state</label><select value={f.state} onChange={(e) => { const s = e.target.value as CdeState; update({ state: s, suitability: SUITABILITY[s][0] }); }}>
            {(["WIP", "SHARED", "PUBLISHED", "ARCHIVED"] as CdeState[]).map((s) => <option key={s} disabled={(s === "PUBLISHED" || s === "ARCHIVED") && !canManage(data.role)}>{s}</option>)}</select></div>
          <div><label>Suitability</label><select value={f.suitability} onChange={(e) => update({ suitability: e.target.value })}>{SUITABILITY[f.state].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label>Revision</label><input defaultValue={f.revision} onBlur={(e) => e.target.value !== f.revision && update({ revision: e.target.value.toUpperCase() })} /></div>
        </div>
        <label>Move to folder</label>
        <select value={f.folderId} onChange={(e) => update({ folderId: e.target.value })}>{folders.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      </fieldset>

      <div className="row spread" style={{ marginTop: 14 }}><b>Versions</b>
        {canEdit(data.role) && <><button className="small" onClick={() => ver.current?.click()}>⬆ Upload new version</button>
          <input ref={ver} type="file" hidden onChange={(e) => { if (e.target.files?.length) { onNewVersion(e.target.files); setTimeout(load, 800); } e.target.value = ""; }} /></>}
      </div>
      {info.versions.map((v) => (
        <div key={v.id} className="list-item">
          <span><b>v{v.version}</b> <span className="small muted">{fmtSize(v.size)} · {v.uploadedByName} · {fmtDate(v.createdAt)}</span>{v.note && <div className="small">{v.note}</div>}</span>
          <a className="small" href={`/api/projects/${pid}/files/${fileId}/download?version=${v.version}`}>⬇</a>
        </div>
      ))}
      <h4>Comments</h4>
      <Comments projectId={pid} target={{ fileId }} />
      {canManage(data.role) && <button className="ghost danger small" style={{ marginTop: 10 }} onClick={async () => {
        if (!confirm(`Delete ${f.name} and all its versions?`)) return;
        await api(`/projects/${pid}/files/${fileId}`, { method: "DELETE" }); onClose(); onChanged();
      }}>Delete file</button>}
    </div>
  );
}
