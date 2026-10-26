import { useState } from "react";
import { navigate, usePortal } from "../App";
import { StateTag, StdBadge } from "../components/common";
import { suitabilityCodes } from "../data/iso19650";
import { templateById } from "../data/templates";
import type { DocTemplate, TemplateField } from "../data/types";
import { exportDocx, exportMarkdown } from "../lib/export";
import { nextRevision, today, type FieldValue, type PortalDocument } from "../lib/store";

const SUITABILITY: Record<PortalDocument["state"], string[]> = {
  WIP: ["S0"],
  SHARED: ["S1", "S2", "S3", "S4", "S6", "S7"],
  PUBLISHED: ["A1", "A2", "A3", "A4", "A5", "A6", "B1", "B2", "CR"],
  ARCHIVED: ["—"],
};
const suitDesc = (code: string) => suitabilityCodes.find((s) => s.code === code || (s.code.includes("–") && s.code[0] === code[0]))?.desc ?? "";

function FieldInput({ f, value, onChange }: { f: TemplateField; value: FieldValue; onChange: (v: FieldValue) => void }) {
  if (f.type === "textarea") return <textarea value={value as string} onChange={(e) => onChange(e.target.value)} placeholder={f.hint} />;
  if (f.type === "date") return <input type="date" value={value as string} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === "select") return <select value={value as string} onChange={(e) => onChange(e.target.value)}>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>;
  if (f.type === "table") {
    const rows = (value as string[][]) ?? [];
    const cols = f.columns!;
    const set = (r: number, c: number, v: string) => onChange(rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)));
    return (
      <div className="table-wrap">
        <table className="data edit">
          <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}<th /></tr></thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {cols.map((_, c) => <td key={c}><input value={row[c] ?? ""} onChange={(e) => set(r, c, e.target.value)} /></td>)}
                <td><button className="ghost danger" title="Remove row" onClick={() => onChange(rows.filter((_, i) => i !== r))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="ghost" onClick={() => onChange([...rows, cols.map(() => "")])}>+ Add row</button>
      </div>
    );
  }
  return <input value={value as string} onChange={(e) => onChange(e.target.value)} placeholder={f.hint} />;
}

function Preview({ doc, t }: { doc: PortalDocument; t: DocTemplate }) {
  return (
    <div className="preview">
      <div style={{ fontSize: 11, color: "#5b6b7b" }}>{t.standard === "iso19650" ? "ISO 19650" : "ISO/IEC 42001"} · {t.code} · {t.clauseRefs.join(", ")}</div>
      <h1>{doc.title}</h1>
      <table><tbody>
        <tr><th>Document no.</th><td>{doc.containerName || "—"}</td><th>Revision</th><td>{doc.revision}</td></tr>
        <tr><th>Status</th><td>{doc.state} / {doc.suitability}</td><th>Author</th><td>{doc.author || "—"}</td></tr>
      </tbody></table>
      <h2>Revision history</h2>
      <table><thead><tr><th>Rev</th><th>Date</th><th>Author</th><th>Status</th><th>Description</th></tr></thead>
        <tbody>{doc.history.map((h, i) => <tr key={i}><td>{h.revision}</td><td>{h.date}</td><td>{h.author}</td><td>{h.state} / {h.suitability}</td><td>{h.note}</td></tr>)}</tbody>
      </table>
      <h2>Purpose</h2><p>{t.purpose}</p>
      {t.sections.map((s, i) => (
        <div key={s.id}>
          <h2>{i + 1}. {s.title}</h2>
          {s.fields.map((f) => {
            const v = doc.values[f.id];
            if (f.type === "table") {
              const rows = (v as string[][]) ?? [];
              return (
                <div key={f.id}><b>{f.label}</b>
                  <table><thead><tr>{f.columns!.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>{rows.length ? rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>) : <tr><td colSpan={f.columns!.length}>—</td></tr>}</tbody>
                  </table>
                </div>
              );
            }
            return <p key={f.id} style={{ whiteSpace: "pre-wrap" }}><b>{f.label}:</b> {String(v || "—")}</p>;
          })}
        </div>
      ))}
    </div>
  );
}

export default function Builder({ docId }: { docId: string }) {
  const { docs, setDocs, user } = usePortal();
  const doc = docs.find((d) => d.id === docId);
  const t = doc && templateById(doc.templateId);
  const [section, setSection] = useState(0);
  if (!doc || !t) return <div className="card">Document not found. <a href="#/register">Back to register</a></div>;

  const patch = (p: Partial<PortalDocument>) => setDocs((all) => all.map((d) => (d.id === doc.id ? { ...d, ...p, updatedAt: new Date().toISOString() } : d)));
  const setValue = (id: string, v: FieldValue) => patch({ values: { ...doc.values, [id]: v } });

  const transition = (state: PortalDocument["state"], suitability: string, defaultNote: string) => {
    const note = prompt("Revision note:", defaultNote);
    if (note === null) return;
    const revision = state === "ARCHIVED" ? doc.revision : nextRevision(doc.revision, state);
    patch({ state, suitability, revision, history: [...doc.history, { revision, date: today(), author: user || doc.author, note, state, suitability }] });
  };

  const s = t.sections[Math.min(section, t.sections.length - 1)];
  const filled = t.sections.map((sec) => sec.fields.filter((f) => { const v = doc.values[f.id]; return Array.isArray(v) ? v.some((r) => r.some(Boolean)) : !!v; }).length / sec.fields.length);

  return (
    <>
      <div className="no-print">
        <div className="row spread">
          <div className="row"><StdBadge std={t.standard} /><span className="badge">{t.code}</span><StateTag state={doc.state} /><span className="small">{doc.suitability} {suitDesc(doc.suitability) && `— ${suitDesc(doc.suitability)}`}</span></div>
          <div className="row">
            <button onClick={() => exportDocx(doc, t)}>⬇ Word (.docx)</button>
            <button onClick={() => exportMarkdown(doc, t)}>⬇ Markdown</button>
            <button onClick={() => window.print()}>🖨 Print / PDF</button>
          </div>
        </div>
        <div className="grid g4" style={{ margin: "12px 0" }}>
          <div><label>Title</label><input value={doc.title} onChange={(e) => patch({ title: e.target.value })} /></div>
          <div><label>Container name / document no.</label>
            <div className="row" style={{ flexWrap: "nowrap" }}><input value={doc.containerName} onChange={(e) => patch({ containerName: e.target.value })} placeholder="PRJ-ORG-ZZ-ZZ-RP-Z-0001" /><a href="#/naming" title="Naming tool">⚙</a></div>
          </div>
          <div><label>Author</label><input value={doc.author} onChange={(e) => patch({ author: e.target.value })} /></div>
          <div><label>Revision</label><input value={doc.revision} readOnly /></div>
        </div>

        <div className="card row" style={{ marginBottom: 12 }}>
          <b>CDE workflow:</b>
          {doc.state === "WIP" && <>
            <button onClick={() => transition("WIP", "S0", "Work in progress update")}>Save new WIP version</button>
            <select style={{ width: "auto" }} id="suit" defaultValue="S3">{SUITABILITY.SHARED.map((c) => <option key={c} value={c}>{c} — {suitDesc(c)}</option>)}</select>
            <button className="primary" onClick={() => transition("SHARED", (document.getElementById("suit") as HTMLSelectElement).value, "QA checked and approved for sharing")}>Approve for sharing →</button>
          </>}
          {doc.state === "SHARED" && <>
            <button onClick={() => transition("WIP", "S0", "Returned to WIP for revision")}>← Return to WIP</button>
            <select style={{ width: "auto" }} id="suitP" defaultValue="A1">{SUITABILITY.PUBLISHED.map((c) => <option key={c}>{c}</option>)}</select>
            <button className="primary" onClick={() => transition("PUBLISHED", (document.getElementById("suitP") as HTMLSelectElement).value, "Authorized and accepted")}>Authorize & publish →</button>
          </>}
          {doc.state === "PUBLISHED" && <>
            <button onClick={() => transition("WIP", "S0", "New revision started")}>Start new revision (WIP)</button>
            <button onClick={() => transition("ARCHIVED", "—", "Superseded / archived")}>Archive</button>
          </>}
          {doc.state === "ARCHIVED" && <span className="muted">Archived — read-only record.</span>}
          <span style={{ flex: 1 }} />
          <button className="danger" onClick={() => { if (confirm("Delete this document?")) { setDocs((all) => all.filter((d) => d.id !== doc.id)); navigate("/register"); } }}>Delete</button>
        </div>
      </div>

      <div className="split">
        <div className="no-print">
          <div className="tabs">{t.sections.map((x, i) => <button key={x.id} className={i === section ? "on" : ""} onClick={() => setSection(i)}>{i + 1}. {x.title} {filled[i] === 1 ? "✓" : ""}</button>)}</div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>{s.title}</h3>
            <div className="guidance">{s.guidance}</div>
            <fieldset disabled={doc.state === "ARCHIVED" || doc.state === "PUBLISHED"} style={{ border: 0, padding: 0, margin: 0 }}>
              {s.fields.map((f) => (
                <div key={f.id}><label>{f.label}</label><FieldInput f={f} value={doc.values[f.id]} onChange={(v) => setValue(f.id, v)} /></div>
              ))}
            </fieldset>
            <div className="row spread" style={{ marginTop: 12 }}>
              <button disabled={section === 0} onClick={() => setSection(section - 1)}>← Previous</button>
              <button disabled={section >= t.sections.length - 1} onClick={() => setSection(section + 1)}>Next →</button>
            </div>
          </div>
        </div>
        <Preview doc={doc} t={t} />
      </div>
    </>
  );
}
