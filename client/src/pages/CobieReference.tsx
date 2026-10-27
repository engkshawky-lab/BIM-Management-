import { useState, type CSSProperties } from "react";
import { saveAs } from "file-saver";
import { cobieSchema } from "../../../shared/data/cobieSchema";
import type { CobieColumnKind } from "../../../shared/data/cobieTypes";
import { exportCsv } from "../lib/export";

// Interactive COBie reference: every sheet and column with its colour convention, plus a blank workbook download.

export const KIND: Record<CobieColumnKind, { label: string; fill: string; hint: string }> = {
  required: { label: "Required", fill: "#FFFF99", hint: "Must be filled in" },
  reference: { label: "Reference", fill: "#FFCC99", hint: "Points to another sheet or a picklist" },
  external: { label: "External", fill: "#CC99FF", hint: "Filled by the exporting software" },
  optional: { label: "Optional / as specified", fill: "#CCFFCC", hint: "Fill when the EIR asks for it" },
};
const Swatch = ({ k }: { k: CobieColumnKind }) => <span className="badge" style={{ background: KIND[k].fill, color: "#1f2937", borderColor: "transparent" }}>{KIND[k].label}</span>;

async function downloadWorkbook() {
  saveAs(new Blob([await buildCobieWorkbook()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "COBie-blank-template.xlsx");
}

/** Blank COBie workbook: an Instruction sheet explaining every column, then every sheet with colour-coded headers. */
export async function buildCobieWorkbook() {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "ISO Information Management Portal";
  const guide = wb.addWorksheet("Instruction");
  guide.columns = [{ header: "Sheet", width: 16 }, { header: "Column", width: 24 }, { header: "Kind", width: 22 }, { header: "What goes in it", width: 70 }, { header: "Example", width: 30 }, { header: "References", width: 28 }];
  guide.getRow(1).font = { bold: true };
  for (const s of cobieSchema) {
    const ws = wb.addWorksheet(s.name);
    ws.columns = s.columns.map((c) => ({ header: c.name, key: c.name, width: Math.max(12, Math.min(40, c.name.length + 6)) }));
    s.columns.forEach((c, i) => {
      const cell = ws.getRow(1).getCell(i + 1);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + KIND[c.kind].fill.slice(1) } };
      cell.font = { bold: true };
      cell.note = `${KIND[c.kind].label}: ${c.description}${c.references ? ` (→ ${c.references})` : ""}`;
      guide.addRow([s.name, c.name, KIND[c.kind].label, c.description, c.example, c.references ?? ""]);
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
  }
  return wb.xlsx.writeBuffer();
}

export default function CobieReference() {
  const [sheet, setSheet] = useState(cobieSchema[0]?.name ?? "");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const s = cobieSchema.find((x) => x.name === sheet) ?? cobieSchema[0];
  const term = q.trim().toLowerCase();
  const hits = term.length < 2 ? [] : cobieSchema.flatMap((x) => x.columns.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(term)).map((c) => ({ sheet: x.name, c }))).slice(0, 12);
  const groups = [...new Set(cobieSchema.map((x) => x.group))];
  const total = cobieSchema.reduce((a, x) => a + x.columns.length, 0);
  if (!s) return null;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="row spread">
        <div className="row small">{(Object.keys(KIND) as CobieColumnKind[]).map((k) => <span key={k} title={KIND[k].hint}><Swatch k={k} /> <span className="muted">{KIND[k].hint}</span></span>)}</div>
        <button className="primary" disabled={busy} onClick={async () => { setBusy(true); try { await downloadWorkbook(); } finally { setBusy(false); } }}>{busy ? "Preparing…" : "Download blank COBie workbook (.xlsx)"}</button>
      </div>
      <div className="small muted">{cobieSchema.length} sheets · {total} columns. The workbook has every sheet with colour-coded headers, a note on each header, and an Instruction sheet explaining every column.</div>
      <div style={{ position: "relative" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a column, e.g. SerialNumber or WarrantyDuration…" />
        {hits.length > 0 && <div className="hub-card" style={{ position: "absolute", insetInline: 0, top: 42, zIndex: 20, boxShadow: "0 10px 30px rgba(0,0,0,.25)", display: "grid", gap: 2 }}>
          {hits.map(({ sheet: sh, c }) => <button key={sh + c.name} className="ghost" style={{ textAlign: "start" }} onClick={() => { setSheet(sh); setQ(""); }}><b className="no-i18n">{sh}.{c.name}</b> <span className="small muted">{c.description.slice(0, 90)}</span></button>)}
        </div>}
      </div>
      {groups.map((g) => (
        <div key={g} className="row small"><span className="muted" style={{ minWidth: 80 }}>{g}</span>
          {cobieSchema.filter((x) => x.group === g).map((x) => <button key={x.name} className={"chip no-i18n" + (x.name === s.name ? " on" : "")} style={{ fontSize: 12.5 }} onClick={() => setSheet(x.name)}>{x.name} <span style={{ opacity: .7 }}>{x.columns.length}</span></button>)}
        </div>
      ))}
      <div className="hub-tile" style={{ "--c": "var(--hub)" } as CSSProperties}>
        <div className="row spread"><b className="no-i18n" style={{ fontSize: 16 }}>{s.name}</b><button className="small" onClick={() => exportCsv(`COBie-${s.name}-columns`, ["Column", "Kind", "Description", "Example", "References"], s.columns.map((c) => [c.name, KIND[c.kind].label, c.description, c.example, c.references ?? ""]))}>Columns as CSV</button></div>
        <p style={{ margin: "4px 0 8px" }}>{s.purpose}</p>
        <div className="grid g3 small">
          <div><span className="muted">One row per</span><div><b>{s.oneRowPer}</b></div></div>
          <div><span className="muted">Usually filled by</span><div><b>{s.filledBy}</b></div></div>
          <div><span className="muted">First delivered</span><div><b>{s.firstDelivered}</b></div></div>
        </div>
        {!!s.tips.length && <ul className="small" style={{ margin: "8px 0 0" }}>{s.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>}
      </div>
      <div className="table-wrap">
        <table className="data hub-table">
          <thead><tr><th>#</th><th>Column</th><th>Kind</th><th>What goes in it</th><th>Example</th><th>Links to</th></tr></thead>
          <tbody>{s.columns.map((c, i) => (
            <tr key={c.name}>
              <td className="small muted">{i + 1}</td>
              <td><code className="no-i18n" style={{ background: KIND[c.kind].fill, color: "#1f2937", padding: "1px 6px", borderRadius: 4 }}>{c.name}</code></td>
              <td><Swatch k={c.kind} /></td>
              <td className="small">{c.description}</td>
              <td className="small"><span className="no-i18n">{c.example}</span></td>
              <td className="small">{c.references ? <span className="no-i18n">{c.references}</span> : <span className="muted">—</span>}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
