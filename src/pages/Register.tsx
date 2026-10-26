import { useState } from "react";
import { usePortal } from "../App";
import { StateTag, StdBadge } from "../components/common";
import { templateById } from "../data/templates";
import { exportCsv } from "../lib/export";

export default function Register() {
  const { docs } = usePortal();
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [std, setStd] = useState("");

  const rows = docs
    .map((d) => ({ d, t: templateById(d.templateId) }))
    .filter(({ d, t }) => (!state || d.state === state) && (!std || t?.standard === std) && (!q || (d.title + d.containerName + (t?.code ?? "")).toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.d.updatedAt.localeCompare(a.d.updatedAt));

  return (
    <>
      <h1>Document register</h1>
      <p className="muted">All controlled documents with their CDE state, suitability and revision — the information container register.</p>
      <div className="row no-print" style={{ margin: "12px 0" }}>
        <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 260 }} />
        <select value={std} onChange={(e) => setStd(e.target.value)} style={{ width: "auto" }}><option value="">All standards</option><option value="iso19650">ISO 19650</option><option value="iso42001">ISO/IEC 42001</option></select>
        <select value={state} onChange={(e) => setState(e.target.value)} style={{ width: "auto" }}><option value="">All states</option>{["WIP", "SHARED", "PUBLISHED", "ARCHIVED"].map((s) => <option key={s}>{s}</option>)}</select>
        <button onClick={() => exportCsv("document-register", ["Container name", "Title", "Template", "Standard", "Revision", "State", "Suitability", "Author", "Updated"],
          rows.map(({ d, t }) => [d.containerName, d.title, t?.code ?? "", t?.standard ?? "", d.revision, d.state, d.suitability, d.author, d.updatedAt]))}>⬇ Export CSV</button>
        <a className="btn primary" href="#/templates">+ New document</a>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Container name</th><th>Title</th><th>Template</th><th>Rev</th><th>State</th><th>Author</th><th>Updated</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="muted">No documents match.</td></tr>}
            {rows.map(({ d, t }) => (
              <tr key={d.id}>
                <td className="small"><code>{d.containerName || "—"}</code></td>
                <td><a href={"#/builder/" + d.id}>{d.title}</a></td>
                <td>{t && <><span className="badge">{t.code}</span> <StdBadge std={t.standard} /></>}</td>
                <td>{d.revision}</td>
                <td><StateTag state={d.state} /> <span className="small">{d.suitability}</span></td>
                <td className="small">{d.author}</td>
                <td className="small muted">{d.updatedAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
