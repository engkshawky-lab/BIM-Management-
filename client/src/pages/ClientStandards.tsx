import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { navigate, useSession } from "../App";
import { DEFAULT_TAG_FORMAT, requiredCounts, type ClientStandardData, type TagFormat, type TagPart } from "../../../shared/standards";
import { api, fmtDate } from "../lib/api";
import { Icon } from "../shell/icons";

interface Summary { id: string; name: string; client: string; ownerId: string; updatedAt: string; stages: string[]; rules: number; picklists: number; classification: number; hasTag: boolean; sources: ClientStandardData["sources"] }
interface Detail extends Summary { data: ClientStandardData; canEdit: boolean }

function List() {
  const { toast } = useSession();
  const [rows, setRows] = useState<Summary[] | null>(null);
  const [f, setF] = useState({ name: "", client: "" });
  useEffect(() => { api<{ standards: Summary[] }>("/standards").then((r) => setRows(r.standards)); }, []);
  return (
    <>
      <div className="page-head"><h1>Client standards</h1>
        <p className="muted">Each client's information requirements (COBie schema and picklists, stage-by-stage requirements, classification dictionary, asset tag format) imported once from their EIR appendices and applied to their projects. Only the extracted rules are stored, not the files.</p></div>
      <form className="card row" style={{ marginBottom: 14 }} onSubmit={async (e) => {
        e.preventDefault();
        try { const r = await api<{ id: string }>("/standards", { body: f }); navigate(`/standards/${r.id}`); } catch (err) { toast((err as Error).message, "error"); }
      }}>
        <b>New standard</b>
        <input required minLength={2} placeholder="Name, e.g. Asset Information Standard R0" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={{ maxWidth: 320 }} />
        <input placeholder="Client" value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} style={{ maxWidth: 220 }} />
        <button className="primary"><Icon name="plus" size={16} /> Create</button>
      </form>
      {rows === null ? <p className="muted">Loading…</p> : rows.length === 0 ? <div className="card empty muted">No client standards yet. Create one, then import the client's appendix workbooks.</div> : (
        <div className="grid g3">{rows.map((s) => (
          <a key={s.id} className="card project-card" href={`#/standards/${s.id}`}>
            <h3 style={{ marginTop: 0 }}>{s.name}</h3>
            <p className="small muted">{s.client || "—"} · updated {fmtDate(s.updatedAt)}</p>
            <div className="row small muted">{s.stages.length} stages · {s.rules} COBie rules · {s.picklists} picklists · {s.classification} classes{s.hasTag && " · tag format"}</div>
          </a>
        ))}</div>
      )}
    </>
  );
}

function TagEditor({ tag, canEdit, onSave }: { tag: TagFormat | null; canEdit: boolean; onSave: (t: TagFormat | null) => void }) {
  const [t, setT] = useState<TagFormat>(tag ?? structuredClone(DEFAULT_TAG_FORMAT));
  const setPart = (i: number, p: Partial<TagPart>) => setT({ ...t, parts: t.parts.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <div className="card">
      <div className="row spread"><h3 style={{ margin: 0 }}>Asset tag format</h3>
        {canEdit && <div className="row">{tag && <button className="ghost danger small" onClick={() => onSave(null)}>Remove</button>}<button className="primary small" onClick={() => onSave(t)}>Save tag format</button></div>}</div>
      <p className="small muted">Parts in order, joined by the separator. Coded parts only accept their approved codes (system and equipment codes come from the imported classification dictionary).</p>
      <div className="row small" style={{ marginBottom: 8 }}>
        <label className="check">Separator <input value={t.separator} disabled={!canEdit} onChange={(e) => setT({ ...t, separator: e.target.value })} style={{ width: 50 }} /></label>
        <label className="check">COBie field <input value={t.cobieField} disabled={!canEdit} onChange={(e) => setT({ ...t, cobieField: e.target.value })} style={{ width: 160 }} /></label>
      </div>
      <div className="table-wrap"><table className="data">
        <thead><tr><th>Part</th><th>Group</th><th>Length</th><th>Characters</th><th>Approved codes</th><th /></tr></thead>
        <tbody>{t.parts.map((p, i) => (
          <tr key={i}>
            <td><input value={p.label} disabled={!canEdit} onChange={(e) => setPart(i, { label: e.target.value })} /></td>
            <td><select value={p.group} disabled={!canEdit} onChange={(e) => setPart(i, { group: e.target.value as TagPart["group"] })}><option value="location">Location</option><option value="equipment">Equipment</option></select></td>
            <td><input value={Array.isArray(p.length) ? p.length.join("-") : String(p.length)} disabled={!canEdit} style={{ width: 70 }}
              onChange={(e) => { const m = /^(\d+)(?:-(\d+))?$/.exec(e.target.value); if (m) setPart(i, { length: m[2] ? [+m[1], +m[2]] : +m[1] }); }} /></td>
            <td><select value={p.charset} disabled={!canEdit} onChange={(e) => setPart(i, { charset: e.target.value as TagPart["charset"] })}><option value="alnum">Letters & digits</option><option value="alpha">Letters</option><option value="digits">Digits</option></select></td>
            <td><input value={(p.codes ?? []).join(", ")} disabled={!canEdit} placeholder="any" title={(p.codes ?? []).join(", ")}
              onChange={(e) => setPart(i, { codes: e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) })} />
              {!!p.codes?.length && <div className="tiny muted">{p.codes.length} codes</div>}</td>
            <td>{canEdit && <button className="ghost tiny danger" onClick={() => setT({ ...t, parts: t.parts.filter((_, j) => j !== i) })}>✕</button>}</td>
          </tr>
        ))}</tbody>
      </table></div>
      {canEdit && <button className="ghost small" onClick={() => setT({ ...t, parts: [...t.parts, { id: `part${t.parts.length + 1}`, label: "New part", group: "equipment", length: 3, charset: "alnum" }] })}>+ Add part</button>}
      <p className="small muted" style={{ marginTop: 8 }}>Example: <code>{t.parts.map((p) => p.codes?.[0] ?? "X".repeat(Array.isArray(p.length) ? p.length[1] : p.length)).join(t.separator)}</code></p>
    </div>
  );
}

function Detail({ id }: { id: string }) {
  const { toast } = useSession();
  const [s, setS] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState("");
  const [cls, setCls] = useState("");
  const [sheet, setSheet] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const load = useCallback(() => api<{ standard: Detail }>(`/standards/${id}`).then((r) => setS(r.standard)).catch((e) => toast(e.message, "error")), [id, toast]);
  useEffect(() => { load(); }, [load]);
  const counts = useMemo(() => (s ? requiredCounts(s.data) : []), [s]);
  if (!s) return <p className="muted">Loading…</p>;
  const d = s.data;
  const sheets = [...new Set(d.cobie.map((r) => r.sheet))];
  const curSheet = sheet || sheets[0];
  const lists = Object.keys(d.picklists);
  const curList = pick || lists[0];
  const clsHits = d.classification.filter((c) => !cls || `${c.system} ${c.systemCode} ${c.equipment} ${c.equipmentCode} ${c.uniclassPr ?? ""} ${c.ifcEntity ?? ""}`.toLowerCase().includes(cls.toLowerCase())).slice(0, 60);

  const importFiles = async (files: FileList) => {
    const form = new FormData(); Array.from(files).forEach((f) => form.append("files", f));
    setBusy(true);
    try {
      const r = await api<{ results: { file: string; found: string[]; error?: string }[] }>(`/standards/${id}/import`, { form });
      for (const x of r.results) toast(x.error ? `${x.file}: ${x.error}` : x.found.length ? `${x.file}: ${x.found.join(", ")}` : `${x.file}: no recognised tables`, x.error || !x.found.length ? "error" : "ok");
      load();
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="page-head">
        <div className="crumbs"><a href="#/standards">Client standards</a><span>›</span><b>{s.name}</b></div>
        <h1>{s.name}</h1>
        <p className="muted">{s.client || "No client set"} · {d.stages.length} stages · {d.cobie.length} COBie rules · {lists.length} picklists · {d.classification.length} classification entries</p>
      </div>

      {s.canEdit && <div className="card dropzone" style={{ marginBottom: 14 }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files); }}>
        <div className="row spread">
          <div><b>Import appendix workbooks</b><div className="small muted">Drop .xlsx files: COBie schema & picklists, stage responsibility matrix, classification dictionary. Tables are recognised by their headers; files are not kept.</div></div>
          <button className="primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Importing…" : "⬆ Import workbooks"}</button>
          <input ref={input} type="file" accept=".xlsx" multiple hidden onChange={(e) => { if (e.target.files?.length) importFiles(e.target.files); e.target.value = ""; }} />
        </div>
        {d.sources.length > 0 && <div className="small muted" style={{ marginTop: 8 }}>{d.sources.map((x) => <div key={x.file + x.importedAt}>✓ {x.file} — {x.imported.join(", ")}</div>)}</div>}
      </div>}

      <div className="grid g2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Required COBie fields by stage</h3>
          {counts.length ? counts.map((c) => (
            <div key={c.stage} className="bar-row"><span className="small">{c.stage}</span><span className="bar"><span style={{ width: `${(c.required / Math.max(1, d.cobie.length)) * 100}%` }} /></span><b className="small">{c.required}</b></div>
          )) : <p className="muted small">Import the stage responsibility matrix to see this.</p>}
        </div>
        <div className="card">
          <div className="row spread"><h3 style={{ margin: 0 }}>Picklists</h3>
            {lists.length > 0 && <select value={curList} onChange={(e) => setPick(e.target.value)} style={{ width: "auto" }}>{lists.map((l) => <option key={l}>{l}</option>)}</select>}</div>
          {lists.length ? <div className="chips">{(d.picklists[curList] ?? []).slice(0, 120).map((v) => <span key={v} className="chip">{v}</span>)}{(d.picklists[curList]?.length ?? 0) > 120 && <span className="small muted">… +{d.picklists[curList].length - 120}</span>}</div>
            : <p className="muted small">No picklists imported.</p>}
        </div>
      </div>

      {sheets.length > 0 && <div className="card" style={{ marginTop: 14 }}>
        <div className="row spread"><h3 style={{ margin: 0 }}>COBie rules</h3>
          <div className="seg">{sheets.map((x) => <button key={x} className={x === curSheet ? "on" : ""} onClick={() => setSheet(x)}>{x}</button>)}</div></div>
        <div className="table-wrap" style={{ marginTop: 8 }}><table className="data">
          <thead><tr><th>Field</th><th>Reference / picklist</th><th>Allowed</th><th>Max</th>{d.stages.map((st) => <th key={st} className="center-cell tiny">{st}</th>)}</tr></thead>
          <tbody>{d.cobie.filter((r) => r.sheet === curSheet).map((r) => (
            <tr key={r.field}><td><b>{r.field}</b></td><td className="small">{r.foreignKey ?? "—"}</td><td className="small">{r.allowed ?? ""}</td><td className="small">{r.maxLength ?? ""}</td>
              {d.stages.map((st) => <td key={st} className="center-cell">{r.required[st] ? "●" : <span className="muted">·</span>}</td>)}</tr>
          ))}</tbody>
        </table></div>
      </div>}

      <div className="grid g2" style={{ marginTop: 14 }}>
        <TagEditor key={JSON.stringify(d.tag)} tag={d.tag} canEdit={s.canEdit} onSave={async (tag) => {
          try { await api(`/standards/${id}`, { method: "PUT", body: { tag } }); toast("Tag format saved"); load(); } catch (e) { toast((e as Error).message, "error"); }
        }} />
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Classification dictionary</h3>
          {d.classification.length ? <>
            <label className="search-box" style={{ margin: "0 0 8px" }}><Icon name="search" size={15} /><input placeholder="Search equipment, codes, Uniclass, IFC…" value={cls} onChange={(e) => setCls(e.target.value)} /></label>
            <div className="table-wrap" style={{ maxHeight: 380, overflow: "auto" }}><table className="data">
              <thead><tr><th>System</th><th>Equipment</th><th>Uniclass Pr</th><th>IFC</th></tr></thead>
              <tbody>{clsHits.map((c) => <tr key={c.equipmentCode}><td className="small"><b>{c.systemCode}</b> {c.system}</td><td className="small"><b>{c.equipmentCode}</b> {c.equipment}</td><td className="small mono">{c.uniclassPr ?? "—"}</td><td className="small mono">{c.ifcEntity ?? "—"}</td></tr>)}</tbody>
            </table></div>
          </> : <p className="muted small">Import the classification / asset mapping workbook.</p>}
        </div>
      </div>
      {s.canEdit && <button className="ghost danger" style={{ marginTop: 14 }} onClick={async () => { if (!confirm(`Delete ${s.name}? Projects using it will be detached.`)) return; await api(`/standards/${id}`, { method: "DELETE" }); navigate("/standards"); }}>Delete standard</button>}
    </>
  );
}

export default function ClientStandards({ id }: { id?: string }) {
  return id ? <Detail id={id} /> : <List />;
}
