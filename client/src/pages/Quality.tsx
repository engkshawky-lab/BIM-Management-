import { Trends } from "./Automations";
import { useEffect, useState } from "react";
import { navigate, useSession } from "../App";
import { StateTag } from "../components/common";
import { templateById } from "../../../shared/data/templates";
import type { Finding } from "../../../shared/delivery";
import { api } from "../lib/api";
import { exportCsv } from "../lib/export";
import { FindingList } from "./Delivery";
import type { ProjectData } from "./Project";

interface Report {
  score: number; counts: { error: number; warning: number; info: number };
  set: Finding[]; plan: { score: number; findings: Finding[] };
  documents: { id: string; title: string; templateId: string; state: string; revision: string; score: number; findings: Finding[] }[];
}

const tone = (s: number) => (s >= 85 ? "var(--ok)" : s >= 60 ? "var(--warn)" : "var(--danger)");

function Gauge({ value, label }: { value: number; label: string }) {
  const v = Math.round(value);
  return (
    <div className="gauge">
      <svg viewBox="0 0 36 36" width="96" height="96" role="img" aria-label={`${label}: ${v} out of 100`}>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-2)" strokeWidth="3.2" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={tone(v)} strokeWidth="3.2" strokeDasharray={`${v} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
        <text x="18" y="21" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">{v}</text>
      </svg>
      <div className="small muted">{label}</div>
    </div>
  );
}

export default function Quality({ data }: { data: ProjectData }) {
  const pid = data.project.id;
  const [r, setR] = useState<Report | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [pack, setPack] = useState("");
  const { toast } = useSession();
  const load = () => api<Report>(`/projects/${pid}/quality`).then(setR);
  useEffect(() => { load(); }, [pid]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!r) return <p className="muted">Running checks…</p>;

  const all = [...r.set.map((f) => ({ ...f, doc: "Project" })), ...r.plan.findings.map((f) => ({ ...f, doc: "Delivery plan" })), ...r.documents.flatMap((d) => d.findings.map((f) => ({ ...f, doc: d.title })))];

  return (
    <>
      <div className="row spread">
        <p className="muted" style={{ margin: 0 }}>Automated checks against ISO 19650-2 and ISO/IEC 42001 expectations: required document set, completeness, placeholders, naming, plan dates and dependencies.</p>
        <div className="row">
          <button onClick={load}>↻ Re-run</button>
          <button disabled={!!pack} title="Zip of every document in Word, the quality report and all registers, indexed by ISO clause" onClick={async () => {
            setPack("Preparing…");
            try { const { buildAuditPack } = await import("../lib/auditPack"); await buildAuditPack(data.project, data.members, setPack); toast("Audit evidence pack downloaded."); }
            catch (e) { toast((e as Error).message, "error"); } finally { setPack(""); }
          }}>{pack || "📦 Audit evidence pack"}</button>
          <button onClick={() => exportCsv(`${data.project.code}-quality-report`, ["Source", "Severity", "Area", "Reference", "Finding", "Clause"], all.map((f) => [f.doc, f.severity, f.area, f.ref ?? "", f.message, f.clause ?? ""]))}>⬇ CSV</button>
        </div>
      </div>
      <div className="card row" style={{ gap: 28, margin: "12px 0" }}>
        <Gauge value={r.score} label="Overall" />
        <Gauge value={r.plan.score} label="Delivery plan" />
        <div><div className="stat" style={{ color: "var(--danger)" }}>{r.counts.error}</div><div className="small muted">errors</div></div>
        <div><div className="stat" style={{ color: "var(--warn)" }}>{r.counts.warning}</div><div className="small muted">warnings</div></div>
        <div><div className="stat">{r.counts.info}</div><div className="small muted">suggestions</div></div>
      </div>
      <div className="grid g2">
        <div className="card"><h3 style={{ marginTop: 0 }}>Document set</h3><FindingList findings={r.set} empty="All required documents exist." /></div>
        <div className="card"><div className="row spread"><h3 style={{ margin: 0 }}>Delivery plan</h3><a className="small" href={`#/projects/${pid}/delivery/plan`}>Open planner</a></div><FindingList findings={r.plan.findings} empty="The delivery plan has no issues." /></div>
      </div>
      <h2>Documents</h2>
      {r.documents.length === 0 ? <div className="card muted">No documents to check yet.</div> : (
        <div className="card table-wrap">
          <table className="data">
            <thead><tr><th>Score</th><th>Document</th><th>Status</th><th>Errors</th><th>Warnings</th><th /></tr></thead>
            <tbody>{r.documents.map((d) => [
              <tr key={d.id} className="clickable" onClick={() => setOpen(open === d.id ? null : d.id)}>
                <td><b style={{ color: tone(d.score) }}>{d.score}</b></td>
                <td><span className="badge">{templateById(d.templateId)?.code}</span> {d.title}</td>
                <td><StateTag state={d.state} /> <span className="small">{d.revision}</span></td>
                <td>{d.findings.filter((f) => f.severity === "error").length}</td>
                <td>{d.findings.filter((f) => f.severity === "warning").length}</td>
                <td className="nowrap"><button className="ghost small" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${pid}/documents/${d.id}`); }}>Open →</button></td>
              </tr>,
              open === d.id && <tr key={d.id + "-f"}><td colSpan={6}><FindingList findings={d.findings} empty="No issues in this document." /></td></tr>,
            ])}</tbody>
          </table>
        </div>
      )}
      <Trends projectId={pid} code={data.project.code} />
    </>
  );
}
