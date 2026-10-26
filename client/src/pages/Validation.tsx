import { useCallback, useEffect, useState } from "react";
import { navigate, useSession } from "../App";
import type { CobieReport } from "../../../shared/cobie";
import type { IfcReport } from "../../../shared/ifc";
import { api, canEdit, fmtDate, type FileRow } from "../lib/api";
import { exportCsv } from "../lib/export";
import { FindingList } from "./Delivery";
import type { ProjectData } from "./Project";

interface RunRow { id: string; fileId: string; fileVersion: number; kind: "ifc" | "cobie"; status: string; score: number; errors: number; warnings: number; summary: string; createdAt: string; by: string | null }
interface Overview { files: FileRow[]; runs: RunRow[]; requirementSources: { loinRows: number; idsFiles: { id: string; name: string }[] } }

export const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  pass: { label: "PASS", color: "var(--ok)" }, warn: { label: "PASS with warnings", color: "var(--warn)" },
  fail: { label: "FAIL", color: "var(--danger)" }, error: { label: "ERROR", color: "var(--danger)" },
};
export const RunBadge = ({ status }: { status: string }) => <span className="state" style={{ background: STATUS_STYLE[status]?.color ?? "#64748b" }}>{STATUS_STYLE[status]?.label ?? status}</span>;

function Overview({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [o, setO] = useState<Overview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => api<Overview>(`/projects/${pid}/validation`).then(setO), [pid]);
  useEffect(() => { load(); }, [load]);
  if (!o) return <p className="muted">Loading…</p>;
  const models = o.files.filter((f) => !/\.ids$/i.test(f.name));
  const latest = (f: FileRow) => o.runs.find((r) => r.fileId === f.id);
  const run = async (f: FileRow) => {
    setBusy(f.id);
    try { const r = await api<{ id: string; status: string }>(`/projects/${pid}/files/${f.id}/validate`, { body: {} }); toast(`${f.name}: ${STATUS_STYLE[r.status]?.label ?? r.status}`, r.status === "fail" || r.status === "error" ? "error" : "ok"); navigate(`/projects/${pid}/validation/${r.id}`); }
    catch (e) { toast((e as Error).message, "error"); } finally { setBusy(null); load(); }
  };

  return (
    <>
      <div className="grid g3" style={{ marginBottom: 12 }}>
        <div className="card"><b>How it works</b><p className="small muted">Upload IFC models and COBie workbooks (name containing "COBie") to the Files tab. They are validated automatically on every new version; a failing version cannot be shared until fixed (managers can override with a reason).</p></div>
        <div className="card"><b>Requirement sources</b>
          <p className="small">📐 {o.requirementSources.loinRows} LOIN rows <a href={`#/projects/${pid}/delivery/loin`}>(edit)</a><br />
            📄 {o.requirementSources.idsFiles.length ? o.requirementSources.idsFiles.map((f) => f.name).join(", ") : "No IDS files"} </p>
          <p className="tiny muted">LOIN rows with an IFC class and properties like <code>Pset_DoorCommon.FireRating</code> become checks. Upload buildingSMART <code>.ids</code> files to add more.</p></div>
        <div className="card"><b>Checks performed</b><p className="small muted">IFC: header, spatial structure, names, property sets, classification, georeferencing, units, GUID uniqueness, COBie attributes, LOIN & IDS requirements. COBie: sheets, columns, mandatory fields, references, uniqueness.</p></div>
      </div>
      {models.length === 0 ? <div className="card empty"><h3>No models yet</h3><p className="muted">Upload an .ifc model or a COBie .xlsx in Files (CDE).</p><a className="btn primary" href={`#/projects/${pid}/files`}>Go to Files</a></div> : (
        <div className="card table-wrap">
          <table className="data">
            <thead><tr><th>File</th><th>Type</th><th>Latest result</th><th>Score</th><th>Checked</th><th /></tr></thead>
            <tbody>{models.map((f) => {
              const r = latest(f);
              const stale = r && r.fileVersion !== f.currentVersion;
              return (
                <tr key={f.id}>
                  <td>{f.name}<div className="tiny muted">v{f.currentVersion} · {f.state}</div></td>
                  <td><span className="badge">{/\.ifc$/i.test(f.name) ? "IFC model" : "COBie"}</span></td>
                  <td>{r ? <><RunBadge status={r.status} />{stale && <div className="tiny error">for v{r.fileVersion} — re-run</div>}<div className="tiny muted">{r.errors} errors · {r.warnings} warnings</div></> : <span className="muted small">Not validated</span>}</td>
                  <td><b>{r?.score ?? "—"}</b></td>
                  <td className="small muted">{r ? `${fmtDate(r.createdAt)} · ${r.by}` : ""}</td>
                  <td className="nowrap">
                    {r && <button className="small" onClick={() => navigate(`/projects/${pid}/validation/${r.id}`)}>Report</button>}
                    {canEdit(data.role) && <button className="small primary" disabled={busy === f.id} onClick={() => run(f)}>{busy === f.id ? "Checking…" : "Validate"}</button>}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
      {o.runs.length > 0 && <>
        <h3>History</h3>
        <div className="card">{o.runs.slice(0, 20).map((r) => (
          <a key={r.id} className="list-item" href={`#/projects/${pid}/validation/${r.id}`}>
            <span><RunBadge status={r.status} /> {o.files.find((f) => f.id === r.fileId)?.name} v{r.fileVersion} <span className="small muted">{r.summary}</span></span>
            <span className="small muted nowrap">{fmtDate(r.createdAt)}</span>
          </a>
        ))}</div>
      </>}
    </>
  );
}

function IfcView({ rep }: { rep: IfcReport & { sources?: { loin: number; ids: string[] } } }) {
  const [open, setOpen] = useState<number | null>(null);
  const classes = Object.entries(rep.classCounts).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <div className="grid g4" style={{ margin: "12px 0" }}>
        <div className="card"><div className="small muted">Schema</div><div className="stat">{rep.schema}</div><div className="tiny muted">{rep.header.originatingSystem || rep.header.preprocessor}</div></div>
        <div className="card"><div className="small muted">Elements</div><div className="stat">{rep.elementCount}</div><div className="tiny muted">{rep.entityCount} STEP entities</div></div>
        <div className="card"><div className="small muted">Storeys</div><div className="stat">{rep.storeys.length}</div><div className="tiny muted">{rep.storeys.map((s) => s.name).join(", ")}</div></div>
        <div className="card"><div className="small muted">Classification</div><div className="stat">{rep.classificationSystems.length}</div><div className="tiny muted">{rep.classificationSystems.join(", ") || "none"}</div></div>
      </div>
      <div className="grid g3">
        {rep.checks.map((c) => (
          <div key={c.id} className="card check-card" style={{ borderLeft: `4px solid ${c.failed ? "var(--danger)" : "var(--ok)"}` }}>
            <div className="row spread"><b>{c.name}</b><span className="small">{c.failed ? `✗ ${c.failed}` : "✓"}</span></div>
            <div className="small muted">{c.detail}</div>
          </div>
        ))}
      </div>
      <h3>Requirements (LOIN & IDS)</h3>
      {rep.requirements.length === 0 ? <div className="card muted small">No requirements defined. Add IFC classes and properties to the LOIN matrix or upload an IDS file.</div> : (
        <div className="card table-wrap"><table className="data">
          <thead><tr><th>Source</th><th>Requirement</th><th>Entity</th><th>Checks</th><th>Result</th></tr></thead>
          <tbody>{rep.requirements.map((q, i) => [
            <tr key={i} className="clickable" onClick={() => setOpen(open === i ? null : i)}>
              <td><span className="badge">{q.source}</span></td><td>{q.name}</td><td className="mono small">{q.entity}</td>
              <td className="small">{q.checks.join(", ")}</td>
              <td>{q.applicable === 0 ? <span className="muted small">no elements</span> : <b style={{ color: q.failures.length ? "var(--danger)" : "var(--ok)" }}>{q.passed}/{q.applicable} pass</b>}</td>
            </tr>,
            open === i && q.failures.length > 0 && <tr key={i + "f"}><td colSpan={5}><table className="data"><tbody>{q.failures.slice(0, 200).map((x) => <tr key={x.guid}><td className="mono tiny">{x.guid}</td><td>{x.name}</td><td className="small error">missing {x.missing.join(", ")}</td></tr>)}</tbody></table></td></tr>,
          ])}</tbody>
        </table></div>
      )}
      <div className="grid g2" style={{ marginTop: 12 }}>
        <div className="card"><h3 style={{ marginTop: 0 }}>Elements by class</h3>
          {classes.map(([k, n]) => <div key={k} className="bar-row"><span className="mono tiny">{k}</span><span className="bar"><span style={{ width: `${(n / classes[0][1]) * 100}%` }} /></span><b className="small">{n}</b></div>)}</div>
        <div className="card"><h3 style={{ marginTop: 0 }}>Property set coverage</h3>
          {rep.psetCoverage.slice(0, 15).map((p) => <div key={p.pset} className="bar-row"><span className="tiny">{p.pset}</span><span className="bar"><span style={{ width: `${(p.elements / Math.max(1, rep.elementCount)) * 100}%` }} /></span><b className="small">{Math.round((p.elements / Math.max(1, rep.elementCount)) * 100)}%</b></div>)}
          {rep.psetCoverage.length === 0 && <p className="muted small">No property sets.</p>}</div>
      </div>
    </>
  );
}

function CobieView({ rep }: { rep: CobieReport }) {
  return (
    <>
      <div className="grid g4" style={{ margin: "12px 0" }}>
        {Object.entries(rep.stats).map(([k, v]) => <div key={k} className="card"><div className="small muted">{k}</div><div className="stat">{v}</div></div>)}
      </div>
      <div className="card table-wrap"><table className="data">
        <thead><tr><th>Worksheet</th><th>Rows</th><th>Errors</th><th>Warnings</th></tr></thead>
        <tbody>{rep.sheets.map((s) => <tr key={s.name} className={!s.present || s.errors ? "late" : ""}><td>{s.name}{!s.present && <span className="tiny muted"> (missing)</span>}</td><td>{s.rows}</td><td>{s.errors || ""}</td><td>{s.warnings || ""}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}

function Report({ data, runId }: { data: ProjectData; runId: string }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [d, setD] = useState<{ run: RunRow & { report: (IfcReport | CobieReport) & { error?: string } }; file: FileRow } | null>(null);
  useEffect(() => { api<typeof d>(`/projects/${pid}/validation/${runId}`).then(setD).catch((e) => toast(e.message, "error")); }, [pid, runId, toast]);
  if (!d) return <p className="muted">Loading report…</p>;
  const rep = d.run.report;
  const raise = async () => {
    const r = await api<{ created: number }>(`/projects/${pid}/issues/from-validation`, { body: { runId } }).catch((e) => { toast(e.message, "error"); return null; });
    if (r) { toast(`${r.created} issues raised`); navigate(`/projects/${pid}/coordination/issues`); }
  };
  return (
    <>
      <a className="small" href={`#/projects/${pid}/validation`}>← All validations</a>
      <div className="row spread" style={{ marginTop: 6 }}>
        <div><h2 style={{ margin: 0 }}>{d.file?.name} <span className="muted small">v{d.run.fileVersion}</span></h2><div className="small muted">{d.run.summary} · {fmtDate(d.run.createdAt)}{"standard" in rep && (rep as { standard?: { name: string; stage: string } }).standard && <> · checked against <b>{(rep as { standard: { name: string; stage: string } }).standard.name}</b> at {(rep as { standard: { name: string; stage: string } }).standard.stage}</>}</div></div>
        <div className="row"><RunBadge status={d.run.status} /><span className="stat" style={{ fontSize: 22 }}>{d.run.score}</span>
          {"findings" in rep && <button onClick={() => exportCsv(`${d.file?.name}-validation`, ["Severity", "Area", "Finding", "Reference"], rep.findings.map((f) => [f.severity, f.area, f.message, f.ref ?? ""]))}>⬇ CSV</button>}
          {canEdit(data.role) && "findings" in rep && rep.findings.some((f) => f.severity === "error") && <button className="primary" onClick={raise}>Raise issues for errors</button>}
        </div>
      </div>
      {rep.error ? <div className="banner">Validation could not run: {rep.error}</div> : d.run.kind === "ifc" ? <IfcView rep={rep as IfcReport} /> : <CobieView rep={rep as CobieReport} />}
      {"findings" in rep && <div className="card" style={{ marginTop: 12 }}><h3 style={{ marginTop: 0 }}>Findings</h3><FindingList findings={rep.findings} empty="No issues found." /></div>}
    </>
  );
}

export default function Validation({ data, sub }: { data: ProjectData; sub?: string }) {
  return sub ? <Report data={data} runId={sub} /> : <Overview data={data} />;
}
