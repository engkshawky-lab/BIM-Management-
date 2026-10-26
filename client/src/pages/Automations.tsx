import { useCallback, useEffect, useState } from "react";
import { useSession } from "../App";
import { LineChart } from "../components/LineChart";
import { api, canManage, fmtDate } from "../lib/api";
import { exportCsv } from "../lib/export";
import type { ProjectData } from "./Project";

interface Snap { day: string; qualityScore: number; errors: number; warnings: number; progress: number; overdue: number; openIssues: number; modelQuality: number | null }

/** Health over time: one small chart per measure (no shared axis), plus a table view. */
export function Trends({ projectId, code }: { projectId: string; code: string }) {
  const [s, setS] = useState<Snap[] | null>(null);
  const [table, setTable] = useState(false);
  useEffect(() => { api<{ snapshots: Snap[] }>(`/projects/${projectId}/trends`).then((r) => setS(r.snapshots)); }, [projectId]);
  if (!s) return null;
  const pts = (k: keyof Snap) => s.map((x) => ({ x: x.day.slice(5), y: x[k] as number | null }));
  return (
    <div style={{ marginTop: 16 }}>
      <div className="row spread"><h3 style={{ margin: 0 }}>Trends <span className="small muted">— one snapshot per day</span></h3>
        <div className="row"><button className="small" onClick={() => setTable(!table)}>{table ? "Charts" : "Table view"}</button>
          <button className="small" onClick={() => exportCsv(`${code}-trends`, ["Day", "Quality %", "Errors", "Warnings", "Delivery %", "Overdue", "Open issues", "Model QA %"], s.map((x) => [x.day, String(x.qualityScore), String(x.errors), String(x.warnings), String(x.progress), String(x.overdue), String(x.openIssues), x.modelQuality === null ? "" : String(x.modelQuality)]))}>⬇ CSV</button></div></div>
      {s.length < 2 && <p className="small muted">Trends build up as the portal records a snapshot each day.</p>}
      {table ? <div className="table-wrap" style={{ marginTop: 8 }}><table className="data"><thead><tr><th>Day</th><th>Quality</th><th>Errors</th><th>Delivery</th><th>Overdue</th><th>Open issues</th><th>Model QA</th></tr></thead>
        <tbody>{[...s].reverse().map((x) => <tr key={x.day}><td>{x.day}</td><td>{x.qualityScore}%</td><td>{x.errors}</td><td>{x.progress}%</td><td>{x.overdue}</td><td>{x.openIssues}</td><td>{x.modelQuality ?? "—"}</td></tr>)}</tbody></table></div>
        : <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginTop: 8 }}>
          <LineChart title="Quality score" points={pts("qualityScore")} unit="%" max={100} />
          <LineChart title="Delivery progress" points={pts("progress")} unit="%" max={100} />
          <LineChart title="Overdue containers" points={pts("overdue")} />
          <LineChart title="Open issues" points={pts("openIssues")} />
          <LineChart title="Quality errors" points={pts("errors")} />
          <LineChart title="Model QA score (avg)" points={pts("modelQuality")} unit="%" max={100} />
        </div>}
    </div>
  );
}

interface Agent { kind: string; label: string; description: string; config: { enabled: boolean; frequency: string; lastRunAt: string | null } | null }
interface Run { id: string; kind: string; startedAt: string; status: string; summary: string; trigger: string }

export default function Automations({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const manager = canManage(data.role);
  const [d, setD] = useState<{ agents: Agent[]; runs: Run[] } | null>(null);
  const [busy, setBusy] = useState("");
  const load = useCallback(() => api<typeof d>(`/projects/${pid}/agents`).then(setD), [pid]);
  useEffect(() => { load(); }, [load]);
  if (!d) return <p className="muted">Loading…</p>;
  const set = async (kind: string, enabled: boolean, frequency: string) => { try { await api(`/projects/${pid}/agents/${kind}`, { method: "PUT", body: { enabled, frequency } }); load(); } catch (e) { toast((e as Error).message, "error"); } };
  return (
    <>
      <p className="muted">Automations run on a schedule in the background and post notifications (and emails, if configured) to the right people. Every run is logged below.</p>
      <div className="grid g3">{d.agents.map((a) => {
        const on = !!a.config?.enabled, freq = a.config?.frequency ?? "weekly";
        return (
          <div key={a.kind} className="card">
            <div className="row spread"><b>{a.label}</b><label className="check"><input type="checkbox" disabled={!manager} checked={on} onChange={(e) => set(a.kind, e.target.checked, freq)} /> {on ? "On" : "Off"}</label></div>
            <p className="small muted">{a.description}</p>
            <div className="row">
              <select disabled={!manager} value={freq} onChange={(e) => set(a.kind, on, e.target.value)} style={{ width: "auto" }}><option value="daily">Daily</option><option value="weekly">Weekly</option></select>
              {manager && <button className="small" disabled={busy === a.kind} onClick={async () => { setBusy(a.kind); try { const r = await api<{ summary: string }>(`/projects/${pid}/agents/${a.kind}/run`, { body: {} }); toast(r.summary.split("\n")[0].slice(0, 160)); load(); } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(""); } }}>{busy === a.kind ? "Running…" : "Run now"}</button>}
            </div>
            <div className="tiny muted" style={{ marginTop: 6 }}>Last run: {a.config?.lastRunAt ? fmtDate(a.config.lastRunAt) : "never"}</div>
          </div>
        );
      })}</div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Run history</h3>
        {d.runs.length ? <table className="data"><tbody>{d.runs.map((r) => <tr key={r.id}><td className="small nowrap muted">{fmtDate(r.startedAt)}</td><td className="small">{d.agents.find((a) => a.kind === r.kind)?.label}</td><td className="small">{r.trigger}</td><td className={"small " + (r.status === "ok" ? "" : "error")} style={{ whiteSpace: "pre-wrap" }}>{r.summary}</td></tr>)}</tbody></table> : <p className="muted small">No runs yet.</p>}
      </div>
    </>
  );
}
