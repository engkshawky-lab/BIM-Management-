import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { navigate, useSession } from "../App";
import { StateTag, StdBadge } from "../components/common";
import { suitabilityCodes } from "../../../shared/data/iso19650";
import { templateById } from "../../../shared/data/templates";
import type { DocTemplate, TemplateField } from "../../../shared/data/types";
import { SUITABILITY, completeness, type CdeState, type FieldValue } from "../../../shared/documents";
import { diffValues } from "../../../shared/impact";
import { api, ApiError, canEdit, canManage, fmtDate, type CommentRow, type DocRow, type Folder, type RevisionRow } from "../lib/api";
import { buildDocx, exportDocx, exportMarkdown, fileBase, parseTabular, type ExportDoc } from "../lib/export";
import type { ProjectData } from "./Project";

interface DocResponse {
  document: DocRow; revisions: RevisionRow[]; authorName: string | null; reviewerName: string | null;
  lock: { userId: string; name: string; at: string } | null;
}
type Values = Record<string, FieldValue>;

const suitDesc = (code: string) => suitabilityCodes.find((s) => s.code === code || (s.code.includes("–") && s.code[0] === code[0]))?.desc ?? "";

// ---------------------------------------------------------------- fields

function AutoTextarea({ value, onChange, placeholder, disabled }: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = Math.max(90, el.scrollHeight + 2) + "px"; } }, [value]);
  return <textarea ref={ref} value={value} disabled={disabled} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function TableField({ f, rows, onChange, disabled }: { f: TemplateField; rows: string[][]; onChange: (v: string[][]) => void; disabled?: boolean }) {
  const cols = f.columns!;
  const set = (r: number, c: number, v: string) => onChange(rows.map((row, i) => (i === r ? cols.map((_, j) => (j === c ? v : row[j] ?? "")) : row)));
  const move = (r: number, d: number) => { const n = [...rows]; const [x] = n.splice(r, 1); n.splice(r + d, 0, x); onChange(n); };
  // Pasting a block copied from Excel fills cells to the right and below, adding rows as needed.
  const paste = (r: number, c: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!/[\t\n]/.test(text)) return;
    e.preventDefault();
    const block = parseTabular(text);
    const next = rows.map((row) => cols.map((_, j) => row[j] ?? ""));
    block.forEach((br, i) => {
      while (next.length <= r + i) next.push(cols.map(() => ""));
      br.forEach((v, j) => { if (c + j < cols.length) next[r + i][c + j] = v; });
    });
    onChange(next);
  };
  return (
    <div className="table-wrap">
      <table className="data edit">
        <thead><tr><th className="num">#</th>{cols.map((c) => <th key={c}>{c}</th>)}{!disabled && <th />}</tr></thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <td className="num muted">{r + 1}</td>
              {cols.map((_, c) => <td key={c}><input value={row[c] ?? ""} disabled={disabled} onChange={(e) => set(r, c, e.target.value)} onPaste={(e) => paste(r, c, e)} /></td>)}
              {!disabled && <td className="nowrap">
                <button className="ghost tiny" title="Move up" disabled={r === 0} onClick={() => move(r, -1)}>↑</button>
                <button className="ghost tiny" title="Move down" disabled={r === rows.length - 1} onClick={() => move(r, 1)}>↓</button>
                <button className="ghost tiny danger" title="Remove row" onClick={() => onChange(rows.filter((_, i) => i !== r))}>✕</button>
              </td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && <div className="row">
        <button className="ghost small" onClick={() => onChange([...rows, cols.map(() => "")])}>+ Add row</button>
        <span className="small muted">Tip: paste a block copied from Excel into any cell to fill several rows at once.</span>
      </div>}
    </div>
  );
}

function FieldInput({ f, value, onChange, disabled }: { f: TemplateField; value: FieldValue | undefined; onChange: (v: FieldValue) => void; disabled?: boolean }) {
  if (f.type === "table") return <TableField f={f} rows={(value as string[][]) ?? []} onChange={onChange} disabled={disabled} />;
  const v = (value as string) ?? "";
  if (f.type === "textarea") return <AutoTextarea value={v} onChange={onChange} placeholder={f.hint ?? "One item per line becomes a bulleted list in Word"} disabled={disabled} />;
  if (f.type === "date") return <input type="date" value={v} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === "select") return <select value={v} disabled={disabled} onChange={(e) => onChange(e.target.value)}>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>;
  return <input value={v} disabled={disabled} placeholder={f.hint} onChange={(e) => onChange(e.target.value)} />;
}

// ---------------------------------------------------------------- preview

export function Preview({ title, doc, values, t }: { title: string; doc: DocRow; values: Values; t: DocTemplate }) {
  return (
    <div className="preview">
      <div className="small" style={{ color: "#5b6b7b" }}>{t.standard === "iso19650" ? "ISO 19650" : "ISO/IEC 42001"} · {t.code} · {t.clauseRefs.join(", ")}</div>
      <h1>{title}</h1>
      <table><tbody>
        <tr><th>Document no.</th><td>{doc.containerName || "—"}</td><th>Revision</th><td>{doc.revision}</td></tr>
        <tr><th>Status</th><td>{doc.state} / {doc.suitability}</td><th>Author</th><td>{doc.authorName || "—"}</td></tr>
      </tbody></table>
      <h2>Purpose</h2><p>{t.purpose}</p>
      {t.sections.map((s, i) => (
        <div key={s.id}>
          <h2>{i + 1}. {s.title}</h2>
          {s.fields.map((f) => {
            const v = values[f.id];
            if (f.type === "table") {
              const rows = ((v as string[][]) ?? []).filter((r) => r.some(Boolean));
              return <div key={f.id}><b>{f.label}</b><table><thead><tr>{f.columns!.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{rows.length ? rows.map((r, j) => <tr key={j}>{f.columns!.map((_, k) => <td key={k}>{r[k]}</td>)}</tr>) : <tr><td colSpan={f.columns!.length} className="empty-cell">Not provided</td></tr>}</tbody></table></div>;
            }
            if (f.type === "textarea") {
              const lines = String(v || "").split("\n").filter((l) => l.trim());
              return <div key={f.id}><b>{f.label}</b>{lines.length > 1 ? <ul>{lines.map((l, k) => <li key={k}>{l.replace(/^[-•*]\s*/, "")}</li>)}</ul> : <p>{lines[0] ?? <span className="empty-cell">Not provided</span>}</p>}</div>;
            }
            return <p key={f.id}><b>{f.label}:</b> {String(v || "—")}</p>;
          })}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- comments

export function Comments({ projectId, target, sectionId, readOnly }: { projectId: string; target: { documentId?: string; fileId?: string; issueId?: string }; sectionId?: string; readOnly?: boolean }) {
  const { toast, user } = useSession();
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [text, setText] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const q = target.documentId ? `documentId=${target.documentId}` : target.issueId ? `issueId=${target.issueId}` : `fileId=${target.fileId}`;
  const load = useCallback(() => api<{ comments: CommentRow[] }>(`/projects/${projectId}/comments?${q}`).then((r) => setRows(r.comments)), [projectId, q]);
  useEffect(() => { load(); const t = setInterval(load, 15_000); return () => clearInterval(t); }, [load]);
  const list = rows.filter((c) => (sectionId === undefined || c.sectionId === sectionId) && (showResolved || !c.resolved));
  const resolvedCount = rows.filter((c) => (sectionId === undefined || c.sectionId === sectionId) && c.resolved).length;

  return (
    <div className="comments">
      {list.length === 0 && <p className="small muted">No open comments{sectionId !== undefined ? " on this section" : ""}.</p>}
      {list.map((c) => (
        <div key={c.id} className={"comment" + (c.resolved ? " resolved" : "")}>
          <div className="row spread"><b className="small">{c.userName}</b><span className="tiny muted">{fmtDate(c.createdAt)}</span></div>
          <div style={{ whiteSpace: "pre-wrap" }}>{c.body}</div>
          <button className="ghost tiny" onClick={() => api(`/projects/${projectId}/comments/${c.id}`, { method: "PUT", body: { resolved: !c.resolved } }).then(load).catch((e) => toast(e.message, "error"))}>{c.resolved ? "Reopen" : "✓ Resolve"}</button>
        </div>
      ))}
      {resolvedCount > 0 && <button className="ghost tiny" onClick={() => setShowResolved(!showResolved)}>{showResolved ? "Hide" : "Show"} {resolvedCount} resolved</button>}
      {!readOnly && <form onSubmit={async (e) => {
        e.preventDefault(); if (!text.trim()) return;
        try { await api(`/projects/${projectId}/comments`, { body: { ...target, sectionId, body: text } }); setText(""); load(); }
        catch (err) { toast((err as Error).message, "error"); }
      }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={`Comment as ${user.name}… use @Name to mention a teammate`} style={{ minHeight: 60 }} />
        <button className="small" disabled={!text.trim()}>Post comment</button>
      </form>}
    </div>
  );
}

// ---------------------------------------------------------------- dialogs

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="modal-bg" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}><div className="row spread"><h2 style={{ margin: 0 }}>{title}</h2><button className="ghost" onClick={onClose}>✕</button></div>{children}</div></div>;
}

// ---------------------------------------------------------------- editor

export default function DocumentEditor({ data, docId }: { data: ProjectData; docId: string }) {
  const { toast, user } = useSession();
  const pid = data.project.id;
  const [res, setRes] = useState<DocResponse | null>(null);
  const [values, setValues] = useState<Values>({});
  const [title, setTitle] = useState("");
  const [container, setContainer] = useState("");
  const [section, setSection] = useState(0);
  const [panel, setPanel] = useState<"preview" | "comments" | "history">("preview");
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [hasLock, setHasLock] = useState(false);
  const [dialog, setDialog] = useState<null | "transition" | "review" | "reviewDecision" | "ai" | "saveFile" | { revisionId: string }>(null);
  const dirty = useRef<{ values: Set<string>; title: boolean; container: boolean }>({ values: new Set(), title: false, container: false });
  const flushRef = useRef<(keepalive?: boolean) => Promise<void>>(async () => undefined);
  const latest = useRef({ values, title, container });
  latest.current = { values, title, container };

  const load = useCallback(async (replaceContent: boolean) => {
    try {
      const r = await api<DocResponse>(`/projects/${pid}/documents/${docId}`);
      setRes(r);
      if (replaceContent) { setValues(r.document.values); setTitle(r.document.title); setContainer(r.document.containerName); }
      return r;
    } catch (e) { toast((e as Error).message, "error"); }
  }, [pid, docId, toast]);

  const doc = res?.document;
  const t = doc ? templateById(doc.templateId) : undefined;
  const editable = !!doc && doc.state === "WIP" && canEdit(data.role);
  const lockedByOther = !!res?.lock && res.lock.userId !== user.id;
  const canType = editable && hasLock;

  // Initial load + acquire the edit lock; heartbeat while open; release on leave.
  useEffect(() => { load(true); }, [load]);
  useEffect(() => {
    if (!editable) { setHasLock(false); return; }
    let alive = true;
    const acquire = () => api(`/projects/${pid}/documents/${docId}/lock`, { body: {} })
      .then(() => { if (alive) setHasLock((had) => { if (!had) load(true); return true; }); })
      .catch((e) => { if (alive && e instanceof ApiError && e.status === 423) { setHasLock(false); load(true); } });
    acquire();
    const t = setInterval(acquire, 30_000);
    const release = () => {
      const d = dirty.current;
      // Pending edits go out with keepalive so they survive a reload or closed tab; the lock then times out by itself.
      if (d.values.size || d.title || d.container) flushRef.current(true);
      else navigator.sendBeacon?.(`/api/projects/${pid}/documents/${docId}/lock-release`);
    };
    window.addEventListener("beforeunload", release);
    return () => {
      alive = false; clearInterval(t); window.removeEventListener("beforeunload", release);
      // Save pending edits before giving the lock up, or the save would re-take it.
      flushRef.current().finally(() => api(`/projects/${pid}/documents/${docId}/lock`, { method: "DELETE" }).catch(() => undefined));
    };
  }, [editable, pid, docId, load]);

  // Read-only viewers see live changes.
  useEffect(() => { if (canType) return; const t = setInterval(() => load(true), 6_000); return () => clearInterval(t); }, [canType, load]);

  const flush = useCallback(async (keepalive = false) => {
    const d = dirty.current;
    if (!d.values.size && !d.title && !d.container) return;
    const cur = latest.current;
    const body: Record<string, unknown> = {};
    if (d.values.size) body.values = Object.fromEntries([...d.values].map((k) => [k, cur.values[k]]));
    if (d.title) body.title = cur.title;
    if (d.container) body.containerName = cur.container;
    dirty.current = { values: new Set(), title: false, container: false };
    setSaveState("saving");
    try { await api(`/projects/${pid}/documents/${docId}`, { method: "PUT", body, keepalive }); setSaveState((s) => (s === "saving" ? "saved" : s)); }
    catch (e) {
      setSaveState("error"); toast((e as Error).message, "error");
      // put the keys back so the next attempt retries them
      Object.keys((body.values as object) ?? {}).forEach((k) => dirty.current.values.add(k));
      if (body.title) dirty.current.title = true; if (body.containerName !== undefined) dirty.current.container = true;
    }
  }, [pid, docId, toast]);

  useEffect(() => { if (saveState !== "dirty") return; const t = setTimeout(flush, 1000); return () => clearTimeout(t); }, [saveState, values, title, container, flush]);
  flushRef.current = flush;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); flush().then(() => toast("Saved")); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [flush, toast]);

  const setValue = (id: string, v: FieldValue) => { setValues((all) => ({ ...all, [id]: v })); dirty.current.values.add(id); setSaveState("dirty"); };

  const done = useMemo(() => (t ? completeness(t, values) : []), [t, values]);
  if (!res || !doc || !t) return <p className="muted">Loading document…</p>;
  const s = t.sections[Math.min(section, t.sections.length - 1)];
  const overall = done.reduce((a, b) => a + b, 0) / (done.length || 1);
  const isReviewer = doc.reviewerId === user.id;

  const exportDoc = (): ExportDoc => ({
    title, containerName: container, revision: doc.revision, state: doc.state, suitability: doc.suitability,
    authorName: res.authorName ?? "", reviewerName: res.reviewerName, values,
    history: res.revisions.map((r) => ({ revision: r.revision, date: r.createdAt.slice(0, 10), author: r.authorName ?? "", status: `${r.state}/${r.suitability}`, note: r.note })),
  });

  const transition = async (to: CdeState, suitability: string, note: string) => {
    await flush();
    try { await api(`/projects/${pid}/documents/${docId}/transition`, { body: { to, suitability, note } }); toast(`Document ${to === doc.state ? "version saved" : `moved to ${to}`}`); setDialog(null); setHasLock(false); load(true); }
    catch (e) { toast((e as Error).message, "error"); }
  };

  return (
    <>
      <div className="no-print">
        <div className="row spread">
          <a href={`#/projects/${pid}/documents`} className="small">← {data.project.code} documents</a>
          <span className="row">{canType && <>
            <button className="small" disabled={saveState === "saving"} title="Ctrl+S" onClick={() => flush().then(() => toast("Saved"))}>💾 Save</button>
            <button className="small primary" onClick={async () => { await flush(); navigate(`/projects/${pid}/documents`); }}>Save & close</button>
          </>}
          <span className={"save-state " + saveState}>{!editable ? "Read-only" : !hasLock ? "" : saveState === "saved" ? "✓ All changes saved" : saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Unsaved changes…" : "⚠ Save failed — press Save to retry"}</span></span>
        </div>
        <div className="row spread" style={{ marginTop: 6 }}>
          <div className="row"><StdBadge std={t.standard} /><span className="badge">{t.code}</span><StateTag state={doc.state} /><span className="small">{doc.suitability} — {suitDesc(doc.suitability)}</span><span className="badge">Rev {doc.revision}</span>
            {doc.reviewStatus !== "none" && <span className={"badge review-" + doc.reviewStatus}>{doc.reviewStatus === "requested" ? `Review requested from ${res.reviewerName}` : doc.reviewStatus === "approved" ? `Approved by ${res.reviewerName}` : `Changes requested by ${res.reviewerName}`}</span>}
          </div>
          <div className="row">
            <button onClick={async () => { await flush(); exportDocx(exportDoc(), t, data.project); }}>⬇ Word</button>
            <button onClick={() => exportMarkdown(exportDoc(), t)}>⬇ Markdown</button>
            <button onClick={() => { setPanel("preview"); setTimeout(() => window.print(), 50); }}>🖨 PDF</button>
            {canEdit(data.role) && <button onClick={() => setDialog("saveFile")}>💾 Save to project files</button>}
            {canEdit(data.role) && !t.generatedFrom && <button title="Reuse this content as the starting point for new documents in your organization" onClick={async () => {
              const name = prompt("Name for the house template (shared with your organization):", `${t.code} — ${data.project.code}`); if (!name?.trim()) return;
              try { await flush(); await api(`/projects/${pid}/documents/${doc.id}/house-template`, { body: { name: name.trim() } }); toast("Saved as a house template. Choose it when you create a new document."); }
              catch (e) { toast((e as Error).message, "error"); }
            }}>⭐ Save as house template</button>}
          </div>
        </div>

        {lockedByOther && editable && <div className="banner">🔒 <b>{res.lock!.name}</b> is editing this document. You're seeing their changes live; editing unlocks when they leave.</div>}
        {doc.state !== "WIP" && <div className="banner info">This revision is {doc.state.toLowerCase()} and locked. {canEdit(data.role) && doc.state !== "ARCHIVED" && "Start a new revision to make changes."}</div>}

        <input className="title-input" value={title} disabled={!canType} onChange={(e) => { setTitle(e.target.value); dirty.current.title = true; setSaveState("dirty"); }} />
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="small muted">Document no.</span>
          <input className="mono" style={{ maxWidth: 360 }} value={container} disabled={!canType} onChange={(e) => { setContainer(e.target.value.toUpperCase()); dirty.current.container = true; setSaveState("dirty"); }} />
          <span className="small muted">Author: {res.authorName} · {Math.round(overall * 100)}% complete</span>
        </div>

        <div className="card row workflow-bar">
          <b>CDE workflow</b>
          {doc.state === "WIP" && canEdit(data.role) && <>
            <button onClick={() => { const note = prompt("Version note:", "Work in progress update"); if (note) transition("WIP", "S0", note); }}>Save version</button>
            <button onClick={() => setDialog("review")}>Request review…</button>
            {(canManage(data.role) || isReviewer) && <button className="primary" onClick={() => setDialog("transition")}>Approve for sharing →</button>}
          </>}
          {isReviewer && doc.reviewStatus === "requested" && <button className="primary" onClick={() => setDialog("reviewDecision")}>Complete my review…</button>}
          {doc.state === "SHARED" && <>
            {canEdit(data.role) && <button onClick={() => { const note = prompt("Reason for returning to WIP:"); if (note) transition("WIP", "S0", note); }}>← Return to WIP</button>}
            {canManage(data.role) && <button className="primary" onClick={() => setDialog("transition")}>Authorize & publish →</button>}
          </>}
          {doc.state === "PUBLISHED" && <>
            {canEdit(data.role) && <button onClick={() => { const note = prompt("Why is a new revision needed?"); if (note) transition("WIP", "S0", note); }}>Start new revision</button>}
            {canManage(data.role) && <button onClick={() => { const note = prompt("Archive note:", "Superseded"); if (note) transition("ARCHIVED", "AR", note); }}>Archive</button>}
          </>}
          <span style={{ flex: 1 }} />
          {canManage(data.role) && <button className="ghost danger" onClick={async () => { if (!confirm("Delete this document and its history?")) return; await api(`/projects/${pid}/documents/${docId}`, { method: "DELETE" }); navigate(`/projects/${pid}/documents`); }}>Delete</button>}
        </div>
      </div>

      <div className="editor-layout">
        <nav className="section-nav no-print">
          {t.sections.map((x, i) => (
            <button key={x.id} className={i === section ? "on" : ""} onClick={() => setSection(i)}>
              <span>{i + 1}. {x.title}</span>
              <span className="mini-progress"><span style={{ width: `${done[i] * 100}%` }} /></span>
            </button>
          ))}
        </nav>

        <div className="no-print">
          <div className="card">
            <div className="row spread">
              <h3 style={{ margin: 0 }}>{section + 1}. {s.title}</h3>
              {canType && <button className="ai-btn" onClick={() => setDialog("ai")}>✨ Draft with AI</button>}
            </div>
            <div className="guidance">{s.guidance}</div>
            {s.fields.map((f) => (
              <div key={f.id}><label>{f.label}</label><FieldInput f={f} value={values[f.id]} disabled={!canType} onChange={(v) => setValue(f.id, v)} /></div>
            ))}
            <div className="row spread" style={{ marginTop: 14 }}>
              <button disabled={section === 0} onClick={() => setSection(section - 1)}>← Previous</button>
              <button disabled={section >= t.sections.length - 1} onClick={() => setSection(section + 1)}>Next section →</button>
            </div>
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <b>Comments on this section</b>
            <Comments projectId={pid} target={{ documentId: docId }} sectionId={s.id} />
          </div>
        </div>

        <div className="side-panel">
          <div className="tabs no-print">
            {(["preview", "comments", "history"] as const).map((p) => <button key={p} className={panel === p ? "on" : ""} onClick={() => setPanel(p)}>{p === "preview" ? "Live preview" : p === "comments" ? "All comments" : `History (${res.revisions.length})`}</button>)}
          </div>
          {panel === "preview" && <Preview title={title} doc={{ ...doc, containerName: container, authorName: res.authorName ?? "" }} values={values} t={t} />}
          {panel === "comments" && <div className="card no-print"><Comments projectId={pid} target={{ documentId: docId }} /></div>}
          {panel === "history" && <div className="card no-print">
            {[...res.revisions].reverse().map((r) => (
              <div key={r.id} className="list-item">
                <span><b>{r.revision}</b> <StateTag state={r.state} /> <span className="small">{r.suitability}</span><div className="small">{r.note}</div><div className="tiny muted">{r.authorName} · {fmtDate(r.createdAt)}</div></span>
                <button className="ghost small" onClick={() => setDialog({ revisionId: r.id })}>View</button>
              </div>
            ))}
          </div>}
        </div>
      </div>

      {dialog === "transition" && <TransitionDialog doc={doc} onClose={() => setDialog(null)} onConfirm={transition} />}
      {dialog === "review" && <ReviewRequestDialog data={data} onClose={() => setDialog(null)} onSend={async (reviewerId, message) => {
        await flush();
        try { await api(`/projects/${pid}/documents/${docId}/review-request`, { body: { reviewerId, message } }); toast("Review requested"); setDialog(null); load(false); }
        catch (e) { toast((e as Error).message, "error"); }
      }} />}
      {dialog === "reviewDecision" && <Dialog title="Complete review" onClose={() => setDialog(null)}><ReviewDecision onSubmit={async (decision, note) => {
        try { await api(`/projects/${pid}/documents/${docId}/review`, { body: { decision, note } }); toast("Review submitted"); setDialog(null); load(false); }
        catch (e) { toast((e as Error).message, "error"); }
      }} /></Dialog>}
      {dialog === "ai" && <AiDialog pid={pid} docId={docId} t={t} sectionIndex={section} flush={flush} onClose={() => setDialog(null)} onApply={(vals) => { Object.entries(vals).forEach(([k, v]) => setValue(k, v)); setDialog(null); toast("AI draft applied — review and edit as needed"); }} />}
      {dialog === "saveFile" && <SaveToFilesDialog data={data} doc={doc} onClose={() => setDialog(null)} build={async () => { await flush(); return { blob: await buildDocx(exportDoc(), t, data.project), name: fileBase(exportDoc(), t) + ".docx" }; }} />}
      {dialog && typeof dialog === "object" && <RevisionDialog pid={pid} docId={docId} revisionId={dialog.revisionId} doc={doc} t={t} canRestore={canType} current={values}
        onRestore={(vals) => { Object.entries(vals).forEach(([k, v]) => setValue(k, v)); setDialog(null); toast("Revision content restored into the working copy"); }} onClose={() => setDialog(null)} />}
    </>
  );
}

function TransitionDialog({ doc, onClose, onConfirm }: { doc: DocRow; onClose: () => void; onConfirm: (to: CdeState, s: string, note: string) => void }) {
  const to: CdeState = doc.state === "WIP" ? "SHARED" : "PUBLISHED";
  const [suit, setSuit] = useState(to === "SHARED" ? "S3" : "A1");
  const [note, setNote] = useState(to === "SHARED" ? "QA checked and approved for sharing" : "Authorized and accepted");
  return (
    <Dialog title={to === "SHARED" ? "Approve for sharing" : "Authorize & publish"} onClose={onClose}>
      <p className="muted small">{to === "SHARED" ? "ISO 19650-2 5.6.3–5.6.4: confirm the QA check and review are complete. The document becomes visible to the wider team as Shared." : "ISO 19650-2 5.7: the information is authorized and accepted and becomes Published (contractual revision)."}</p>
      {to === "SHARED" && doc.reviewStatus !== "approved" && <div className="banner">No approved review recorded for this revision.</div>}
      <label>Suitability</label>
      <select value={suit} onChange={(e) => setSuit(e.target.value)}>{SUITABILITY[to].map((c) => <option key={c} value={c}>{c} — {suitDesc(c)}</option>)}</select>
      <label>Revision note</label><input value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}><button onClick={onClose}>Cancel</button><button className="primary" disabled={!note.trim()} onClick={() => onConfirm(to, suit, note)}>Confirm</button></div>
    </Dialog>
  );
}

function ReviewRequestDialog({ data, onClose, onSend }: { data: ProjectData; onClose: () => void; onSend: (id: string, msg: string) => void }) {
  const { user } = useSession();
  const [members, setMembers] = useState(data.members);
  useEffect(() => { api<ProjectData>(`/projects/${data.project.id}`).then((r) => setMembers(r.members)).catch(() => undefined); }, [data.project.id]);
  const reviewers = members.filter((m) => m.userId !== user.id && canEdit(m.role));
  const [id, setId] = useState("");
  useEffect(() => { if (!reviewers.some((m) => m.userId === id)) setId(reviewers[0]?.userId ?? ""); }, [reviewers, id]);
  const [msg, setMsg] = useState("");
  return (
    <Dialog title="Request review" onClose={onClose}>
      {reviewers.length === 0 ? <p className="muted">Add a teammate with editor or manager role in the Team tab first.</p> : <>
        <label>Reviewer</label>
        <select value={id} onChange={(e) => setId(e.target.value)}>{reviewers.map((m) => <option key={m.userId} value={m.userId}>{m.name} ({m.role})</option>)}</select>
        <label>Message</label><textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="What should they focus on?" />
        <p className="small muted">The reviewer is notified and can approve the document for sharing.</p>
        <div className="row" style={{ justifyContent: "flex-end" }}><button onClick={onClose}>Cancel</button><button className="primary" onClick={() => onSend(id, msg)}>Send request</button></div>
      </>}
    </Dialog>
  );
}

function ReviewDecision({ onSubmit }: { onSubmit: (d: "approved" | "changes", note: string) => void }) {
  const [note, setNote] = useState("");
  return <>
    <label>Comments for the author</label><textarea value={note} onChange={(e) => setNote(e.target.value)} />
    <div className="row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
      <button onClick={() => onSubmit("changes", note)}>✎ Request changes</button>
      <button className="primary" onClick={() => onSubmit("approved", note)}>✔ Approve</button>
    </div>
  </>;
}

function AiDialog({ pid, docId, t, sectionIndex, flush, onClose, onApply }: { pid: string; docId: string; t: DocTemplate; sectionIndex: number; flush: () => Promise<void>; onClose: () => void; onApply: (v: Values) => void }) {
  const s = t.sections[sectionIndex];
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Values | null>(null);
  const [error, setError] = useState("");
  const run = async () => {
    setBusy(true); setError(""); setResult(null);
    try { await flush(); const r = await api<{ values: Values }>(`/projects/${pid}/documents/${docId}/ai-draft`, { body: { sectionId: s.id, instruction } }); setResult(r.values); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <Dialog title={`✨ Draft "${s.title}" with AI`} onClose={onClose}>
      <p className="small muted">Uses the project details and what you've already written. You review the draft before anything changes; the author stays accountable for the content (ISO/IEC 42001 A.9).</p>
      <label>Instructions (optional)</label>
      <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. Hospital project, COBie handover, Revit + Navisworks, 4 task teams" />
      <button className="primary" disabled={busy} onClick={run}>{busy ? "Drafting…" : result ? "Regenerate" : "Generate draft"}</button>
      {error && <p className="error">{error}</p>}
      {result && <>
        <div className="ai-result">
          {s.fields.filter((f) => result[f.id] !== undefined).map((f) => (
            <div key={f.id}><b>{f.label}</b>
              {f.type === "table" ? <table className="data"><thead><tr>{f.columns!.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{(result[f.id] as string[][]).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>
                : <p style={{ whiteSpace: "pre-wrap" }}>{result[f.id] as string}</p>}
            </div>
          ))}
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}><button onClick={onClose}>Discard</button><button className="primary" onClick={() => onApply(result)}>Apply to document</button></div>
      </>}
    </Dialog>
  );
}

function SaveToFilesDialog({ data, doc, onClose, build }: { data: ProjectData; doc: DocRow; onClose: () => void; build: () => Promise<{ blob: Blob; name: string }> }) {
  const { toast } = useSession();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<{ folders: Folder[] }>(`/projects/${data.project.id}/folders`).then((r) => {
    setFolders(r.folders); setFolderId(r.folders.find((f) => f.cdeState === doc.state && !f.parentId)?.id ?? r.folders[0]?.id ?? "");
  }); }, [data.project.id, doc.state]);
  const save = async () => {
    setBusy(true);
    try {
      const { blob, name } = await build();
      const form = new FormData();
      form.append("folderId", folderId); form.append("documentId", doc.id); form.append("containerName", doc.containerName);
      form.append("note", `Generated from ${doc.title} rev ${doc.revision}`);
      form.append("file", new File([blob], name, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
      const r = await api<{ version: number }>(`/projects/${data.project.id}/files`, { form });
      toast(r.version > 1 ? `Saved as version ${r.version} in project files` : "Saved to project files"); onClose();
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  return (
    <Dialog title="Save to project files" onClose={onClose}>
      <p className="small muted">Generates the Word document and stores it in the project CDE. Saving again to the same folder adds a new version of the same file.</p>
      <label>Folder</label>
      <select value={folderId} onChange={(e) => setFolderId(e.target.value)}>{folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}><button onClick={onClose}>Cancel</button><button className="primary" disabled={busy || !folderId} onClick={save}>{busy ? "Saving…" : "Save"}</button></div>
    </Dialog>
  );
}

function RevisionDialog({ pid, docId, revisionId, doc, t, canRestore, current, onRestore, onClose }: {
  pid: string; docId: string; revisionId: string; doc: DocRow; t: DocTemplate; canRestore: boolean; current: Values; onRestore: (v: Values) => void; onClose: () => void;
}) {
  const [rev, setRev] = useState<{ revision: string; state: CdeState; suitability: string; values: Values; note: string } | null>(null);
  const [mode, setMode] = useState<"view" | "compare">("compare");
  const labels = useMemo(() => new Map(t.sections.flatMap((s) => s.fields.map((f) => [f.id, `${s.title} › ${f.label}`] as const))), [t]);
  const changes = useMemo(() => (rev ? diffValues(rev.values, current) : []), [rev, current]);
  useEffect(() => { api<{ revision: typeof rev }>(`/projects/${pid}/documents/${docId}/revisions/${revisionId}`).then((r) => setRev(r.revision)); }, [pid, docId, revisionId]);
  return (
    <Dialog title={rev ? `Revision ${rev.revision} — ${rev.state}` : "Revision"} onClose={onClose}>
      {!rev ? <p className="muted">Loading…</p> : <>
        <p className="small muted">{rev.note}</p>
        <div className="row spread">
          <div className="seg"><button className={mode === "compare" ? "on" : ""} onClick={() => setMode("compare")}>Compare with current ({changes.length})</button><button className={mode === "view" ? "on" : ""} onClick={() => setMode("view")}>View revision</button></div>
          {canRestore && <button onClick={() => confirm("Replace the working copy with this revision's content?") && onRestore(rev.values)}>↺ Restore into working copy</button>}
        </div>
        <div style={{ maxHeight: "60vh", overflow: "auto", marginTop: 10 }}>
          {mode === "view" ? <Preview title={doc.title} doc={{ ...doc, revision: rev.revision, state: rev.state, suitability: rev.suitability }} values={rev.values} t={t} />
            : changes.length === 0 ? <p style={{ color: "var(--ok)" }}>✔ The working copy is identical to {rev.revision}.</p>
            : changes.map((c) => (
              <div key={c.field} className="card" style={{ marginBottom: 8 }}>
                <b className="small">{labels.get(c.field) ?? c.field}</b>
                {c.kind === "text" ? <div className="small" style={{ whiteSpace: "pre-wrap" }}><div className="diff-del">{c.before || "(empty)"}</div><div className="diff-add">{c.after || "(empty)"}</div></div>
                  : <div className="small">{c.removed.map((r) => <div key={"r" + r} className="diff-del">− {r}</div>)}{c.added.map((r) => <div key={"a" + r} className="diff-add">+ {r}</div>)}</div>}
              </div>
            ))}
        </div>
      </>}
    </Dialog>
  );
}
