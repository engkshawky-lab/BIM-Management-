import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { navigate, useSession } from "../App";
import type { TaskTeam } from "../../../shared/delivery";
import { api, canEdit, fmtDate } from "../lib/api";
import { exportCsv, parseTabular } from "../lib/export";
import { Comments } from "./DocumentEditor";
import type { ProjectData } from "./Project";

interface Issue {
  id: string; number: number; title: string; description: string | null; type: string; status: string; priority: string; assigneeId: string | null; assigneeName: string;
  taskTeamId: string | null; dueDate: string; fileId: string | null; documentId: string | null; validationRunId: string | null; elementGuids: string[]; labels: string[];
  createdBy: string; createdAt: string; updatedAt: string; closedAt: string | null;
}
const TYPES = ["Issue", "Clash", "RFI", "Request", "Comment", "Error", "Remark"];
const STATUSES = ["Open", "In progress", "Resolved", "Closed"];
const PRIORITIES = ["Low", "Normal", "High", "Critical"];
const PRIORITY_COLOR: Record<string, string> = { Low: "#94a3b8", Normal: "#0e7c86", High: "#d97706", Critical: "#dc2626" };
const today = () => new Date().toISOString().slice(0, 10);
const issueIdFromHash = () => window.location.hash.split("/")[5];

function useTeams(pid: string) {
  const [teams, setTeams] = useState<TaskTeam[]>([]);
  useEffect(() => { api<{ teams: TaskTeam[] }>(`/projects/${pid}/delivery`).then((r) => setTeams(r.teams)); }, [pid]);
  return teams;
}

function NewIssue({ data, teams, onDone }: { data: ProjectData; teams: TaskTeam[]; onDone: () => void }) {
  const { toast } = useSession();
  const [f, setF] = useState({ title: "", description: "", type: "Issue", priority: "Normal", assigneeId: "", taskTeamId: "", dueDate: "" });
  return (
    <div className="modal-bg" onClick={onDone}><form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
      e.preventDefault();
      try { await api(`/projects/${data.project.id}/issues`, { body: { ...f, assigneeId: f.assigneeId || null, taskTeamId: f.taskTeamId || null } }); toast("Issue raised"); onDone(); }
      catch (err) { toast((err as Error).message, "error"); }
    }}>
      <h2 style={{ marginTop: 0 }}>Raise issue</h2>
      <label>Title *</label><input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <label>Description</label><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="grid g3">
        <div><label>Type</label><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label>Priority</label><select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>{PRIORITIES.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label>Due</label><input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
        <div><label>Assignee</label><select value={f.assigneeId} onChange={(e) => setF({ ...f, assigneeId: e.target.value })}><option value="">—</option>{data.members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}</select></div>
        <div><label>Task team</label><select value={f.taskTeamId} onChange={(e) => setF({ ...f, taskTeamId: e.target.value })}><option value="">—</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
      </div>
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}><button type="button" onClick={onDone}>Cancel</button><button className="primary">Raise issue</button></div>
    </form></div>
  );
}

function IssueDetail({ data, issue, teams, onChanged }: { data: ProjectData; issue: Issue; teams: TaskTeam[]; onChanged: () => void }) {
  const { toast, user } = useSession();
  const pid = data.project.id;
  const may = canEdit(data.role) || issue.createdBy === user.id || issue.assigneeId === user.id;
  const set = async (body: Partial<Issue>) => { try { await api(`/projects/${pid}/issues/${issue.id}`, { method: "PUT", body }); onChanged(); } catch (e) { toast((e as Error).message, "error"); } };
  return (
    <div className="card issue-detail">
      <div className="row spread"><b>#{issue.number}</b><button className="ghost" onClick={() => navigate(`/projects/${pid}/coordination/issues`)}>✕</button></div>
      <h3 style={{ margin: "4px 0" }}>{issue.title}</h3>
      <div className="tiny muted">Raised {fmtDate(issue.createdAt)} · updated {fmtDate(issue.updatedAt)}{issue.closedAt && ` · closed ${fmtDate(issue.closedAt)}`}</div>
      <fieldset disabled={!may} style={{ border: 0, padding: 0, margin: "8px 0" }}>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><label>Status</label><select value={issue.status} onChange={(e) => set({ status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label>Priority</label><select value={issue.priority} onChange={(e) => set({ priority: e.target.value })}>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label>Assignee</label><select value={issue.assigneeId ?? ""} onChange={(e) => set({ assigneeId: e.target.value || null })}><option value="">—</option>{data.members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}</select></div>
          <div><label>Due</label><input type="date" value={issue.dueDate} onChange={(e) => set({ dueDate: e.target.value })} /></div>
          <div><label>Type</label><select value={issue.type} onChange={(e) => set({ type: e.target.value })}>{TYPES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label>Task team</label><select value={issue.taskTeamId ?? ""} onChange={(e) => set({ taskTeamId: e.target.value || null })}><option value="">—</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        </div>
      </fieldset>
      {issue.description && <p style={{ whiteSpace: "pre-wrap" }} className="small">{issue.description}</p>}
      <div className="row small">
        {issue.labels.map((l) => <span key={l} className="badge">{l}</span>)}
        {issue.fileId && <a href={`#/projects/${pid}/files`}>📁 linked file</a>}
        {issue.validationRunId && <a href={`#/projects/${pid}/validation/${issue.validationRunId}`}>🔍 validation report</a>}
      </div>
      {issue.elementGuids.length > 0 && <details className="small" style={{ margin: "8px 0" }}><summary>{issue.elementGuids.length} model elements</summary><div className="mono tiny" style={{ wordBreak: "break-all" }}>{issue.elementGuids.join(", ")}</div></details>}
      <h4>Discussion</h4>
      <Comments projectId={pid} target={{ issueId: issue.id }} />
    </div>
  );
}

function Issues({ data, teams }: { data: ProjectData; teams: TaskTeam[] }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [q, setQ] = useState(""); const [status, setStatus] = useState("active"); const [type, setType] = useState(""); const [mine, setMine] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | undefined>(issueIdFromHash());
  const bcf = useRef<HTMLInputElement>(null);
  const { user } = useSession();
  const load = useCallback(() => api<{ issues: Issue[] }>(`/projects/${pid}/issues`).then((r) => setIssues(r.issues)), [pid]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const on = () => setSelected(issueIdFromHash()); window.addEventListener("hashchange", on); return () => window.removeEventListener("hashchange", on); }, []);

  const list = useMemo(() => (issues ?? []).filter((i) =>
    (status === "" || (status === "active" ? i.status !== "Closed" && i.status !== "Resolved" : i.status === status)) && (!type || i.type === type) && (!mine || i.assigneeId === user.id) &&
    (!q || `#${i.number} ${i.title} ${i.labels.join(" ")}`.toLowerCase().includes(q.toLowerCase()))), [issues, q, status, type, mine, user.id]);
  const sel = issues?.find((i) => i.id === selected);
  const counts = (s: string) => (issues ?? []).filter((i) => i.status === s).length;
  const overdue = (issues ?? []).filter((i) => i.dueDate && i.dueDate < today() && i.status !== "Closed" && i.status !== "Resolved").length;

  return (
    <>
      <div className="grid g4" style={{ marginBottom: 12 }}>
        {STATUSES.map((s) => <div key={s} className="card"><div className="small muted">{s}</div><div className="stat">{counts(s)}</div></div>)}
      </div>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <div className="row">
          <input placeholder="Search issues…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 220 }} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "auto" }}><option value="active">Open & in progress</option><option value="">All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "auto" }}><option value="">All types</option>{TYPES.map((s) => <option key={s}>{s}</option>)}</select>
          <label className="check"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Assigned to me</label>
          {overdue > 0 && <span className="badge" style={{ color: "var(--danger)" }}>{overdue} overdue</span>}
        </div>
        <div className="row">
          <button className="primary" onClick={() => setCreating(true)}>+ Issue</button>
          <a className="btn" href={`/api/projects/${pid}/issues/bcf`}>⬇ BCF</a>
          {canEdit(data.role) && <><button onClick={() => bcf.current?.click()}>⬆ Import BCF</button>
            <input ref={bcf} type="file" accept=".bcf,.bcfzip,.zip" hidden onChange={async (e) => {
              const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
              const form = new FormData(); form.append("file", file);
              try { const r = await api<{ created: number; updated: number; errors: string[] }>(`/projects/${pid}/issues/bcf`, { form }); toast(`BCF: ${r.created} new, ${r.updated} updated${r.errors.length ? `, ${r.errors.length} skipped` : ""}`); load(); }
              catch (err) { toast((err as Error).message, "error"); }
            }} /></>}
          <button onClick={() => exportCsv(`${data.project.code}-issues`, ["#", "Title", "Type", "Status", "Priority", "Assignee", "Due", "Labels", "Created"], list.map((i) => [String(i.number), i.title, i.type, i.status, i.priority, i.assigneeName, i.dueDate, i.labels.join("; "), i.createdAt.slice(0, 10)]))}>⬇ CSV</button>
        </div>
      </div>
      <div className={sel ? "issues-layout" : ""}>
        <div className="card table-wrap">
          {issues === null ? <p className="muted">Loading…</p> : list.length === 0 ? <p className="muted">No issues{issues.length ? " match the filter" : " yet"}.</p> : (
            <table className="data">
              <thead><tr><th>#</th><th>Issue</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due</th></tr></thead>
              <tbody>{list.map((i) => {
                const late = i.dueDate && i.dueDate < today() && i.status !== "Closed" && i.status !== "Resolved";
                return (
                  <tr key={i.id} className={"clickable" + (i.id === selected ? " selected" : "") + (late ? " late" : "")} onClick={() => navigate(`/projects/${pid}/coordination/issues/${i.id}`)}>
                    <td className="muted">{i.number}</td>
                    <td>{i.title}<div className="tiny muted"><span className="badge">{i.type}</span> {i.labels.slice(0, 3).join(" · ")}</div></td>
                    <td className="small nowrap">{i.status}</td>
                    <td><span className="dot-label" style={{ background: PRIORITY_COLOR[i.priority] }} /> <span className="small">{i.priority}</span></td>
                    <td className="small">{i.assigneeName || "—"}</td>
                    <td className="small nowrap">{i.dueDate}{late && <div className="tiny error">overdue</div>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
        {sel && <IssueDetail data={data} issue={sel} teams={teams} onChanged={load} />}
      </div>
      {creating && <NewIssue data={data} teams={teams} onDone={() => { setCreating(false); load(); }} />}
    </>
  );
}

interface ClashTest { id: string; teamA: string; teamB: string; kind: string; toleranceMm: number; priority: string; frequency: string; notes: string }

function ClashMatrix({ data, teams }: { data: ProjectData; teams: TaskTeam[] }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [tests, setTests] = useState<ClashTest[]>([]);
  const [edit, setEdit] = useState<{ a: string; b: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const load = useCallback(() => api<{ tests: ClashTest[] }>(`/projects/${pid}/clash-tests`).then((r) => setTests(r.tests)), [pid]);
  useEffect(() => { load(); }, [load]);
  const find = (a: string, b: string) => { const [x, y] = [a, b].sort(); return tests.find((t) => t.teamA === x && t.teamB === y); };
  const editor = canEdit(data.role);
  if (teams.length < 1) return <div className="card muted">Add task teams in Delivery plan → Task teams first.</div>;
  const cur = edit ? find(edit.a, edit.b) : undefined;

  return (
    <>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <p className="small muted" style={{ margin: 0 }}>Clash detection matrix between task teams: test type, tolerance, priority and frequency. Click a cell to define a test. Import clash reports from Navisworks, Solibri or Revizto (CSV) to raise issues.</p>
        {editor && <button className="primary" onClick={() => setImporting(true)}>⬆ Import clash report</button>}
      </div>
      <div className="card table-wrap">
        <table className="data clash-matrix">
          <thead><tr><th />{teams.map((t) => <th key={t.id} className="center-cell">{t.name}</th>)}</tr></thead>
          <tbody>{teams.map((row, i) => (
            <tr key={row.id}><th>{row.name}</th>{teams.map((col, j) => {
              if (j < i) return <td key={col.id} className="muted center-cell">·</td>;
              const t = find(row.id, col.id);
              return <td key={col.id} className="center-cell"><button className={"clash-cell" + (t ? " set p-" + t.priority : "")} disabled={!editor} onClick={() => setEdit({ a: row.id, b: col.id })}>
                {t ? <><b>{t.kind === "hard" ? "Hard" : t.kind === "clearance" ? `${t.toleranceMm} mm` : "Dup"}</b><span className="tiny">{t.frequency}</span></> : "+"}</button></td>;
            })}</tr>
          ))}</tbody>
        </table>
      </div>
      {edit && <ClashEditor key={edit.a + edit.b} initial={cur} label={`${teams.find((t) => t.id === edit.a)?.name} × ${teams.find((t) => t.id === edit.b)?.name}`} onClose={() => setEdit(null)}
        onDelete={cur ? async () => { await api(`/projects/${pid}/clash-tests/${cur.id}`, { method: "DELETE" }); setEdit(null); load(); } : undefined}
        onSave={async (v) => { try { await api(`/projects/${pid}/clash-tests`, { method: "PUT", body: { ...v, teamA: edit.a, teamB: edit.b } }); setEdit(null); load(); } catch (e) { toast((e as Error).message, "error"); } }} />}
      {importing && <ClashImport data={data} teams={teams} onClose={() => setImporting(false)} />}
    </>
  );
}

function ClashEditor({ initial, label, onSave, onDelete, onClose }: { initial?: ClashTest; label: string; onSave: (v: Omit<ClashTest, "id" | "teamA" | "teamB">) => void; onDelete?: () => void; onClose: () => void }) {
  const [v, setV] = useState({ kind: initial?.kind ?? "hard", toleranceMm: initial?.toleranceMm ?? 0, priority: initial?.priority ?? "Normal", frequency: initial?.frequency ?? "Weekly", notes: initial?.notes ?? "" });
  return (
    <div className="modal-bg" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}>
      <h2 style={{ marginTop: 0 }}>Clash test: {label}</h2>
      <div className="grid g2">
        <div><label>Type</label><select value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value })}><option value="hard">Hard clash</option><option value="clearance">Clearance</option><option value="duplicate">Duplicates</option></select></div>
        <div><label>Tolerance (mm)</label><input type="number" min={0} value={v.toleranceMm} onChange={(e) => setV({ ...v, toleranceMm: +e.target.value })} /></div>
        <div><label>Priority</label><select value={v.priority} onChange={(e) => setV({ ...v, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
        <div><label>Frequency</label><select value={v.frequency} onChange={(e) => setV({ ...v, frequency: e.target.value })}>{["Daily", "Weekly", "Fortnightly", "Per milestone"].map((p) => <option key={p}>{p}</option>)}</select></div>
      </div>
      <label>Notes / rules</label><input value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} placeholder="e.g. exclude insulation; ducts vs primary steel only" />
      <div className="row spread" style={{ marginTop: 12 }}>{onDelete ? <button className="danger" onClick={onDelete}>Remove test</button> : <span />}<div className="row"><button onClick={onClose}>Cancel</button><button className="primary" onClick={() => onSave(v)}>Save</button></div></div>
    </div></div>
  );
}

function ClashImport({ data, teams, onClose }: { data: ProjectData; teams: TaskTeam[]; onClose: () => void }) {
  const { toast } = useSession();
  const [text, setText] = useState("");
  const [testName, setTestName] = useState("MEP vs Structure");
  const [assigneeId, setAssigneeId] = useState(""); const [taskTeamId, setTaskTeamId] = useState(""); const [group, setGroup] = useState(true);
  const rows = useMemo(() => parseTabular(text), [text]);
  return (
    <div className="modal-bg" onClick={onClose}><div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <h2 style={{ marginTop: 0 }}>Import clash report</h2>
      <p className="small muted">Paste the clash report (CSV/TSV with headers such as Clash Name, Status, Distance, Grid Location, Item1 GUID, Item2 GUID, Item1 Name, Item2 Name) or choose a CSV file. Resolved/approved clashes are skipped.</p>
      <input type="file" accept=".csv,.txt,.tsv" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
      <textarea style={{ minHeight: 140, marginTop: 8 }} value={text} onChange={(e) => setText(e.target.value)} />
      {rows.length > 1 && <p className="small">{rows.length - 1} clash rows detected · columns: {rows[0].slice(0, 8).join(", ")}</p>}
      <div className="grid g2">
        <div><label>Test name</label><input value={testName} onChange={(e) => setTestName(e.target.value)} /></div>
        <div><label>Assign to</label><select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}><option value="">—</option>{data.members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}</select></div>
        <div><label>Responsible task team</label><select value={taskTeamId} onChange={(e) => setTaskTeamId(e.target.value)}><option value="">—</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        <div><label>Grouping</label><label className="check"><input type="checkbox" checked={group} onChange={(e) => setGroup(e.target.checked)} /> One issue per grid location</label></div>
      </div>
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}><button onClick={onClose}>Cancel</button>
        <button className="primary" disabled={rows.length < 2} onClick={async () => {
          try { const r = await api<{ clashes: number; created: number }>(`/projects/${data.project.id}/clash-import`, { body: { rows, testName, assigneeId: assigneeId || null, taskTeamId: taskTeamId || null, group } }); toast(`${r.clashes} clashes → ${r.created} issues`); onClose(); navigate(`/projects/${data.project.id}/coordination/issues`); }
          catch (e) { toast((e as Error).message, "error"); }
        }}>Import</button></div>
    </div></div>
  );
}

export default function Coordination({ data, sub }: { data: ProjectData; sub?: string }) {
  const teams = useTeams(data.project.id);
  return sub === "clash" ? <ClashMatrix data={data} teams={teams} /> : <Issues data={data} teams={teams} />;
}

// ---------------------------------------------------------------- risk register

interface Risk { id: string; number: number; title: string; category: string; cause: string; likelihood: number; impact: number; mitigation: string; ownerId: string | null; status: string; residualLikelihood: number | null; residualImpact: number | null; reviewDate: string }
const riskTone = (s: number) => (s >= 15 ? "#dc2626" : s >= 8 ? "#d97706" : "#16a34a");
const RISK_CATEGORIES = ["Information delivery", "Technology / CDE", "Resources & capability", "Programme", "Security (19650-5)", "Commercial", "AI (42001)"];

export function Risks({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [risks, setRisks] = useState<Risk[]>([]);
  const [edit, setEdit] = useState<Risk | "new" | null>(null);
  const [cell, setCell] = useState<[number, number] | null>(null);
  const load = useCallback(() => api<{ risks: Risk[] }>(`/projects/${pid}/risks`).then((r) => setRisks(r.risks)), [pid]);
  useEffect(() => { load(); }, [load]);
  const open = risks.filter((r) => r.status !== "Closed");
  const list = cell ? open.filter((r) => r.likelihood === cell[0] && r.impact === cell[1]) : risks;
  const member = (id: string | null) => data.members.find((m) => m.userId === id)?.name ?? "—";
  return (
    <>
      <div className="grid g2" style={{ marginBottom: 12 }}>
        <div className="card">
          <b>Heat map</b> <span className="small muted">(open risks, click a cell to filter)</span>
          <div className="heat" style={{ marginTop: 8 }}>
            {[5, 4, 3, 2, 1].map((l) => [<div key={"l" + l} className="tiny muted">{l}</div>, ...[1, 2, 3, 4, 5].map((i) => {
              const n = open.filter((r) => r.likelihood === l && r.impact === i).length;
              const on = cell && cell[0] === l && cell[1] === i;
              return <div key={l + "-" + i} onClick={() => setCell(on ? null : [l, i])} style={{ background: riskTone(l * i) + (n ? "" : "33"), color: n ? "#fff" : "transparent", cursor: "pointer", outline: on ? "2px solid var(--text)" : undefined }}>{n || "·"}</div>;
            })])}
            <div />{[1, 2, 3, 4, 5].map((i) => <div key={"i" + i} className="tiny muted">{i}</div>)}
          </div>
          <div className="tiny muted">Likelihood ↑ · Impact →</div>
        </div>
        <div className="card">
          <b>Summary</b>
          <p className="small">{open.length} open · {open.filter((r) => r.likelihood * r.impact >= 15).length} high · {risks.filter((r) => r.reviewDate && r.reviewDate < today() && r.status !== "Closed").length} past review date</p>
          <p className="small muted">ISO 19650-2 5.3.6 requires the delivery team to keep a risk register for the timely delivery of information. Residual scores show the effect of mitigation.</p>
          {canEdit(data.role) && <><button className="primary" onClick={() => setEdit("new")}>+ Risk</button>
            <button onClick={async () => { try { const r = await api<{ id: string }>(`/projects/${pid}/delivery/generate`, { body: { kind: "risk-register" } }); navigate(`/projects/${pid}/documents/${r.id}`); } catch (e) { toast((e as Error).message, "error"); } }}>📄 Generate register document</button></>}
          <button onClick={() => exportCsv(`${data.project.code}-risk-register`, ["Ref", "Risk", "Category", "Cause", "L", "I", "Score", "Mitigation", "Residual", "Owner", "Status", "Review"], risks.map((r) => [`R${String(r.number).padStart(2, "0")}`, r.title, r.category, r.cause, String(r.likelihood), String(r.impact), String(r.likelihood * r.impact), r.mitigation, r.residualLikelihood && r.residualImpact ? String(r.residualLikelihood * r.residualImpact) : "", member(r.ownerId), r.status, r.reviewDate]))}>⬇ CSV</button>
        </div>
      </div>
      <div className="card table-wrap"><table className="data">
        <thead><tr><th>Ref</th><th>Risk</th><th>Score</th><th>Mitigation</th><th>Residual</th><th>Owner</th><th>Status</th></tr></thead>
        <tbody>{list.map((r) => (
          <tr key={r.id} className="clickable" onClick={() => canEdit(data.role) && setEdit(r)}>
            <td className="mono small">R{String(r.number).padStart(2, "0")}</td>
            <td>{r.title}<div className="tiny muted">{r.category}{r.cause && ` · ${r.cause}`}</div></td>
            <td><span className="state" style={{ background: riskTone(r.likelihood * r.impact) }}>{r.likelihood * r.impact}</span><div className="tiny muted">L{r.likelihood} × I{r.impact}</div></td>
            <td className="small">{r.mitigation}</td>
            <td>{r.residualLikelihood && r.residualImpact ? <span className="state" style={{ background: riskTone(r.residualLikelihood * r.residualImpact) }}>{r.residualLikelihood * r.residualImpact}</span> : "—"}</td>
            <td className="small">{member(r.ownerId)}{r.reviewDate && <div className={"tiny " + (r.reviewDate < today() && r.status !== "Closed" ? "error" : "muted")}>review {r.reviewDate}</div>}</td>
            <td className="small">{r.status}</td>
          </tr>
        ))}{list.length === 0 && <tr><td colSpan={7} className="muted">No risks{cell ? " in this cell" : " yet"}.</td></tr>}</tbody>
      </table></div>
      {edit && <RiskDialog data={data} initial={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} onSave={async (v) => {
        try { if (edit === "new") await api(`/projects/${pid}/risks`, { body: v }); else await api(`/projects/${pid}/risks/${edit.id}`, { method: "PUT", body: v }); setEdit(null); load(); }
        catch (e) { toast((e as Error).message, "error"); }
      }} onDelete={edit !== "new" && data.role && ["manager", "owner"].includes(data.role) ? async () => { await api(`/projects/${pid}/risks/${(edit as Risk).id}`, { method: "DELETE" }); setEdit(null); load(); } : undefined} />}
    </>
  );
}

function RiskDialog({ data, initial, onSave, onDelete, onClose }: { data: ProjectData; initial?: Risk; onSave: (v: Partial<Risk>) => void; onDelete?: () => void; onClose: () => void }) {
  const [v, setV] = useState<Partial<Risk>>(initial ?? { title: "", category: RISK_CATEGORIES[0], cause: "", likelihood: 3, impact: 3, mitigation: "", ownerId: null, status: "Open", residualLikelihood: null, residualImpact: null, reviewDate: "" });
  const num = (k: keyof Risk) => <select value={(v[k] as number | null) ?? ""} onChange={(e) => setV({ ...v, [k]: e.target.value ? +e.target.value : null })}>{(k.startsWith("residual") ? ["", 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5]).map((n) => <option key={n} value={n}>{n || "—"}</option>)}</select>;
  return (
    <div className="modal-bg" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}>
      <h2 style={{ marginTop: 0 }}>{initial ? `Risk R${String(initial.number).padStart(2, "0")}` : "New risk"}</h2>
      <label>Risk *</label><input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="e.g. Late survey information delays design models" />
      <div className="grid g2">
        <div><label>Category</label><select value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>{RISK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label>Owner</label><select value={v.ownerId ?? ""} onChange={(e) => setV({ ...v, ownerId: e.target.value || null })}><option value="">—</option>{data.members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}</select></div>
        <div><label>Likelihood (1–5)</label>{num("likelihood")}</div><div><label>Impact (1–5)</label>{num("impact")}</div>
        <div><label>Residual likelihood</label>{num("residualLikelihood")}</div><div><label>Residual impact</label>{num("residualImpact")}</div>
        <div><label>Status</label><select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>{["Open", "Mitigating", "Closed"].map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label>Next review</label><input type="date" value={v.reviewDate} onChange={(e) => setV({ ...v, reviewDate: e.target.value })} /></div>
      </div>
      <label>Cause</label><input value={v.cause} onChange={(e) => setV({ ...v, cause: e.target.value })} />
      <label>Mitigation / treatment</label><textarea value={v.mitigation} onChange={(e) => setV({ ...v, mitigation: e.target.value })} />
      <div className="row spread" style={{ marginTop: 12 }}>{onDelete ? <button className="danger" onClick={() => confirm("Delete this risk?") && onDelete()}>Delete</button> : <span />}
        <div className="row"><button onClick={onClose}>Cancel</button><button className="primary" disabled={!v.title} onClick={() => onSave(v)}>Save</button></div></div>
    </div></div>
  );
}

// ---------------------------------------------------------------- handover

interface HandoverItem { id: string; category: string; title: string; clause: string; status: string; ownerId: string | null; fileId: string | null; notes: string }

export function Handover({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const [items, setItems] = useState<HandoverItem[]>([]);
  const [files, setFiles] = useState<{ id: string; name: string; state: string }[]>([]);
  const [newItem, setNewItem] = useState({ category: "Documentation", title: "" });
  const load = useCallback(() => api<{ items: HandoverItem[] }>(`/projects/${pid}/handover`).then((r) => setItems(r.items)), [pid]);
  useEffect(() => { load(); api<{ files: { id: string; name: string; state: string }[] }>(`/projects/${pid}/files`).then((r) => setFiles(r.files)); }, [load, pid]);
  const set = async (id: string, body: Partial<HandoverItem>) => { try { await api(`/projects/${pid}/handover/${id}`, { method: "PUT", body }); load(); } catch (e) { toast((e as Error).message, "error"); } };
  const applicable = items.filter((i) => i.status !== "N/A");
  const done = applicable.filter((i) => i.status === "Complete").length;
  const cats = [...new Set(items.map((i) => i.category))];
  const editor = canEdit(data.role);
  return (
    <>
      <div className="card row spread" style={{ marginBottom: 12 }}>
        <div><b>Handover readiness</b><div className="small muted">PIM → AIM transfer checklist (ISO 19650-2 5.7–5.8, ISO 19650-3). Link evidence files from the CDE to each item.</div></div>
        <div style={{ minWidth: 220 }}><div className="stat">{applicable.length ? Math.round((done / applicable.length) * 100) : 0}%</div><div className="progress"><div style={{ width: `${applicable.length ? (done / applicable.length) * 100 : 0}%` }} /></div><div className="tiny muted">{done} of {applicable.length} items complete</div></div>
      </div>
      {cats.map((c) => (
        <div key={c} className="card" style={{ marginBottom: 10 }}>
          <b>{c}</b>
          <table className="data" style={{ marginTop: 6 }}><tbody>{items.filter((i) => i.category === c).map((i) => (
            <tr key={i.id} className={i.status === "Complete" ? "done-row" : ""}>
              <td style={{ width: "40%" }}>{i.title}<div className="tiny muted">{i.clause}</div></td>
              <td><select disabled={!editor} value={i.status} onChange={(e) => set(i.id, { status: e.target.value })} style={{ width: "auto" }}>{["Not started", "In progress", "Complete", "N/A"].map((s) => <option key={s}>{s}</option>)}</select></td>
              <td><select disabled={!editor} value={i.ownerId ?? ""} onChange={(e) => set(i.id, { ownerId: e.target.value || null })} style={{ width: "auto" }}><option value="">Owner —</option>{data.members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}</select></td>
              <td><select disabled={!editor} value={i.fileId ?? ""} onChange={(e) => set(i.id, { fileId: e.target.value || null })} style={{ maxWidth: 220 }}><option value="">Evidence file —</option>{files.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.state})</option>)}</select>
                {i.fileId && <a className="small" href={`/api/projects/${pid}/files/${i.fileId}/download`}> ⬇</a>}</td>
            </tr>
          ))}</tbody></table>
        </div>
      ))}
      {editor && <form className="row" onSubmit={async (e) => { e.preventDefault(); await api(`/projects/${pid}/handover`, { body: newItem }); setNewItem({ ...newItem, title: "" }); load(); }}>
        <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} style={{ width: "auto" }}>{[...new Set([...cats, "Documentation"])].map((c) => <option key={c}>{c}</option>)}</select>
        <input required placeholder="Add a project-specific handover item" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} style={{ maxWidth: 360 }} />
        <button>+ Add item</button>
      </form>}
    </>
  );
}
