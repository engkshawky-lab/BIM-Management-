import { useCallback, useEffect, useState } from "react";
import { useSession } from "../App";
import type { Deliverable } from "../../../shared/delivery";
import { api, canEdit } from "../lib/api";
import { exportCsv, parseTabular } from "../lib/export";
import type { ProjectData } from "./Project";

interface Req { id: string; ref: string; text: string; source: string; category: string; response: string; deliverableIds: string[]; coverage: string }
const COV_COLOR: Record<string, string> = { Delivered: "var(--ok)", Planned: "#2563eb", "Response only": "#d97706", "Not addressed": "var(--danger)" };

/** Requirement -> BEP response -> MIDP containers -> delivered, with coverage gaps. */
export default function Traceability({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const editor = canEdit(data.role);
  const [rows, setRows] = useState<Req[] | null>(null);
  const [dels, setDels] = useState<Deliverable[]>([]);
  const [filter, setFilter] = useState("");
  const [adding, setAdding] = useState<"" | "paste" | "ai">("");
  const [input, setInput] = useState(""); const [source, setSource] = useState("EIR");
  const [preview, setPreview] = useState<Omit<Req, "id" | "coverage" | "response" | "deliverableIds">[] | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api<{ requirements: Req[] }>(`/projects/${pid}/requirements`).then((r) => setRows(r.requirements)), [pid]);
  useEffect(() => { load(); api<{ deliverables: Deliverable[] }>(`/projects/${pid}/delivery`).then((r) => setDels(r.deliverables)); }, [pid, load]);
  if (!rows) return <p className="muted">Loading…</p>;

  const put = async (id: string, p: Partial<Req>) => { setRows(rows.map((x) => (x.id === id ? { ...x, ...p } : x))); try { await api(`/projects/${pid}/requirements/${id}`, { method: "PUT", body: p }); if (p.deliverableIds) load(); } catch (e) { toast((e as Error).message, "error"); } };
  const counts = ["Delivered", "Planned", "Response only", "Not addressed"].map((c) => ({ c, n: rows.filter((r) => r.coverage === c).length }));
  const list = rows.filter((r) => !filter || r.coverage === filter);
  const nextRef = (i: number) => `REQ-${String(rows.length + i + 1).padStart(3, "0")}`;

  return (
    <>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <p className="muted" style={{ margin: 0, maxWidth: 720 }}>Trace each requirement from the EIR/AIR to the BEP response and the MIDP containers that deliver it. Coverage updates automatically as containers are shared or published.</p>
        <div className="row">
          {rows.length > 0 && <button onClick={() => exportCsv(`${data.project.code}-traceability`, ["Ref", "Requirement", "Source", "Category", "BEP response", "Containers", "Coverage"], rows.map((r) => [r.ref, r.text, r.source, r.category, r.response, r.deliverableIds.map((x) => dels.find((d) => d.id === x)?.containerName).filter(Boolean).join("; "), r.coverage]))}>⬇ CSV</button>}
          {editor && <><button onClick={() => { setAdding("paste"); setPreview(null); }}>+ Paste requirements</button><button className="primary" onClick={() => { setAdding("ai"); setPreview(null); }}>✨ Extract from document text</button></>}
        </div>
      </div>
      <div className="grid g3" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 12 }}>
        {counts.map(({ c, n }) => <button key={c} className={"card stat-card" + (filter === c ? " on" : "")} onClick={() => setFilter(filter === c ? "" : c)} style={{ textAlign: "left", borderColor: filter === c ? COV_COLOR[c] : undefined }}>
          <div className="stat" style={{ color: COV_COLOR[c] }}>{n}</div><div className="small muted">{c}</div></button>)}
      </div>
      {adding && <div className="card" style={{ marginBottom: 12 }}>
        <div className="row spread"><b>{adding === "ai" ? "Paste the requirements document text — the AI splits it into atomic requirements" : "One requirement per line (or paste from Excel: Ref, Requirement, Category)"}</b><button className="ghost small" onClick={() => setAdding("")}>Close</button></div>
        <div className="row" style={{ margin: "6px 0" }}><label className="check">Source <input value={source} onChange={(e) => setSource(e.target.value)} style={{ width: 200 }} /></label></div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} style={{ minHeight: 140 }} />
        <div className="row" style={{ marginTop: 6 }}>
          <button disabled={busy || !input.trim()} onClick={async () => {
            if (adding === "paste") {
              const t = parseTabular(input);
              setPreview(t.filter((r) => r.some(Boolean)).map((r, i) => (r.length >= 2 ? { ref: r[0] || nextRef(i), text: r[1], category: r[2] ?? "", source } : { ref: nextRef(i), text: r[0], category: "", source })).filter((x) => x.text));
            } else {
              setBusy(true);
              try { const r = await api<{ requirements: Req[] }>(`/projects/${pid}/requirements/extract`, { body: { text: input, source } }); setPreview(r.requirements.map((x, i) => ({ ...x, ref: nextRef(i) }))); } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
            }
          }}>{busy ? "Extracting… (up to a minute)" : "Preview"}</button>
          {preview && <button className="primary" onClick={async () => { await api(`/projects/${pid}/requirements`, { body: { rows: preview } }); toast(`${preview.length} requirements added`); setAdding(""); setInput(""); setPreview(null); load(); }}>Add {preview.length} requirements</button>}
        </div>
        {preview && <div className="table-wrap" style={{ maxHeight: 260, overflow: "auto", marginTop: 8 }}><table className="data"><tbody>{preview.map((p, i) => <tr key={i}><td className="mono small">{p.ref}</td><td className="small">{p.text}</td><td className="small muted">{p.category}</td></tr>)}</tbody></table></div>}
      </div>}
      <div className="table-wrap"><table className="data">
        <thead><tr><th>Ref</th><th style={{ width: "32%" }}>Requirement</th><th>BEP response</th><th>Delivered by (MIDP containers)</th><th>Coverage</th><th /></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id}>
              <td className="mono small">{r.ref}<div className="tiny muted">{r.source}</div></td>
              <td className="small">{r.text}{r.category && <div className="tiny muted">{r.category}</div>}</td>
              <td><textarea disabled={!editor} defaultValue={r.response} placeholder="How the BEP responds…" style={{ minHeight: 40 }} onBlur={(e) => e.target.value !== r.response && put(r.id, { response: e.target.value })} /></td>
              <td>
                <div className="chips">{r.deliverableIds.map((x) => { const d = dels.find((y) => y.id === x); return d ? <span key={x} className="chip">{d.containerName || d.title} {editor && <button className="linklike" onClick={() => put(r.id, { deliverableIds: r.deliverableIds.filter((y) => y !== x) })}>✕</button>}</span> : null; })}</div>
                {editor && dels.length > 0 && <select value="" onChange={(e) => e.target.value && put(r.id, { deliverableIds: [...r.deliverableIds, e.target.value] })} style={{ marginTop: 4 }}><option value="">+ link container…</option>{dels.filter((d) => !r.deliverableIds.includes(d.id)).map((d) => <option key={d.id} value={d.id}>{d.containerName || d.title}</option>)}</select>}
              </td>
              <td style={{ color: COV_COLOR[r.coverage], fontWeight: 600 }} className="small nowrap">{r.coverage}</td>
              <td>{editor && <button className="ghost tiny danger" onClick={async () => { await api(`/projects/${pid}/requirements/${r.id}`, { method: "DELETE" }); load(); }}>✕</button>}</td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan={6} className="muted">{rows.length ? "No requirements match." : "No requirements yet. Paste them or extract them from the EIR text."}</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
