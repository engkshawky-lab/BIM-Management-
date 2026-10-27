import { useCallback, useEffect, useMemo, useState } from "react";
import { navigate, useSession } from "../App";
import { Progress } from "../components/common";
import { roleCodes, typeCodes } from "../../../shared/data/iso19650";
import { DELIVERABLE_STATUSES, addDays, daysBetween, variance, type Deliverable, type DeliverableStatus, type Finding, type Milestone, type TaskTeam } from "../../../shared/delivery";
import { containerName } from "../../../shared/naming";
import { changeImpact } from "../../../shared/impact";
import { RACI_STARTER } from "../../../shared/data/raciStarter";
import { LODS, LOD_MEANING, mrmFindings, type Lod, type MrmCell } from "../../../shared/mrm";
import { api, canEdit, type Member } from "../lib/api";
import { exportCsv, parseTabular } from "../lib/export";
import { Handover, Risks } from "./Coordination";
import type { ProjectData } from "./Project";
import ProjectInfoUses from "./InfoUses";
import HealthSafety from "./HealthSafety";

interface RespRow { id: string; item: string; stage: string; loin: string; cells: Record<string, string>; sortOrder: number }
interface LoinRow { id: string; ref: string; element: string; ifcClass: string; milestoneId: string | null; purpose: string; geometry: string; alphanumeric: string; documentation: string }
interface MrmRow { id: string; discipline: string; system: string; element: string; cells: Record<string, MrmCell>; sortOrder: number }
interface DeliveryData {
  teams: TaskTeam[]; milestones: Milestone[]; deliverables: (Deliverable & { updatedAt: string })[]; responsibility: RespRow[]; loin: LoinRow[]; mrm: MrmRow[];
  stats: { total: number; planned: number; inProgress: number; shared: number; published: number; overdue: number; progress: number };
  findings: Finding[];
}

const STATUS_LABEL: Record<DeliverableStatus, string> = { planned: "Planned", in_progress: "In progress", shared: "Shared", published: "Published" };
const STATUS_COLOR: Record<DeliverableStatus, string> = { planned: "#94a3b8", in_progress: "#0e7c86", shared: "#2563eb", published: "#16a34a" };
const today = () => new Date().toISOString().slice(0, 10);
const SEV_ICON = { error: "⛔", warning: "⚠", info: "ℹ" };

export function FindingList({ findings, empty = "No issues found." }: { findings: Finding[]; empty?: string }) {
  const [show, setShow] = useState<"all" | "error" | "warning">("all");
  const list = findings.filter((f) => show === "all" || f.severity === show);
  if (!findings.length) return <p style={{ color: "var(--ok)" }}>✔ {empty}</p>;
  return (
    <>
      <div className="row small" style={{ marginBottom: 6 }}>
        {(["all", "error", "warning"] as const).map((s) => <button key={s} className={"ghost tiny" + (show === s ? " on-chip" : "")} onClick={() => setShow(s)}>{s === "all" ? `All (${findings.length})` : `${SEV_ICON[s]} ${s}s (${findings.filter((f) => f.severity === s).length})`}</button>)}
      </div>
      {list.map((f, i) => (
        <div key={i} className={"finding " + f.severity}>
          <span>{SEV_ICON[f.severity]}</span>
          <span><b>{f.area}</b>{f.ref && <> · <code>{f.ref}</code></>} — {f.message}{f.clause && <span className="muted small"> ({f.clause})</span>}</span>
        </div>
      ))}
    </>
  );
}

function useDelivery(pid: string) {
  const { toast } = useSession();
  const [data, setData] = useState<DeliveryData | null>(null);
  const reload = useCallback(() => api<DeliveryData>(`/projects/${pid}/delivery`).then(setData).catch((e) => toast(e.message, "error")), [pid, toast]);
  useEffect(() => { reload(); }, [reload]);
  const call = useCallback(async (path: string, method: string, body?: unknown, ok?: string) => {
    try { const r = await api(`/projects/${pid}/${path}`, { method, body: body ?? (method === "POST" ? {} : undefined) }); if (ok) toast(ok); await reload(); return r; }
    catch (e) { toast((e as Error).message, "error"); }
  }, [pid, reload, toast]);
  return { data, reload, call };
}

/** One-line plan health; the full list lives in the Quality hub so it is not duplicated here. */
function PlanCheckSummary({ findings, projectId }: { findings: Finding[]; projectId: string }) {
  const e = findings.filter((f) => f.severity === "error").length, w = findings.filter((f) => f.severity === "warning").length;
  const first = findings.find((f) => f.severity === "error") ?? findings.find((f) => f.severity === "warning");
  return (
    <div className={"card row spread plan-summary " + (e ? "bad" : w ? "warn" : "good")} style={{ marginTop: 12 }}>
      <span>{e || w ? <><b>{e ? `⛔ ${e} errors` : ""}{e && w ? " · " : ""}{w ? `⚠ ${w} warnings` : ""}</b> in the plan{first && <span className="small muted"> — e.g. {first.ref ? `${first.ref}: ` : ""}{first.message}</span>}</> : <b>✔ The delivery plan passes all checks.</b>}</span>
      <a className="small nowrap" href={`#/projects/${projectId}/quality`}>See all in Quality →</a>
    </div>
  );
}

// ---------------------------------------------------------------- planner

function DeliverableDialog({ initial, data, members, projectCode, onSave, onClose }: {
  initial?: DeliveryData["deliverables"][number]; data: DeliveryData; members: Member[]; projectCode: string;
  onSave: (row: Partial<Deliverable>) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Partial<Deliverable>>(initial ?? { taskTeamId: data.teams[0]?.id, title: "", typeCode: "M3", loin: "", milestoneId: data.milestones[0]?.id ?? null, startDate: today(), dueDate: addDays(today(), 14), status: "planned", dependsOn: [], assigneeId: null, containerName: "", notes: "" });
  const set = (k: keyof Deliverable, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const team = data.teams.find((t) => t.id === f.taskTeamId);
  const suggest = () => {
    if (!team) return;
    const prefix = `${projectCode}-${team.originatorCode || "XXX"}-`;
    const used = data.deliverables.map((d) => d.containerName).filter((n) => n.startsWith(prefix)).map((n) => parseInt(n.split("-")[6] ?? "0", 10)).filter(Number.isFinite);
    set("containerName", containerName({ project: projectCode, originator: team.originatorCode || "XXX", type: f.typeCode || "M3", role: team.roleCode || "Z", number: Math.max(0, ...used) + 1 }));
  };
  return (
    <div className="modal-bg" onClick={onClose}><div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <h2 style={{ marginTop: 0 }}>{initial ? "Edit information container" : "Add information container"}</h2>
      <div className="grid g2">
        <div><label>Task team *</label><select value={f.taskTeamId} onChange={(e) => set("taskTeamId", e.target.value)}>{data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        <div><label>Title / description *</label><input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Architectural model — Level 1" /></div>
        <div><label>Type</label><select value={f.typeCode} onChange={(e) => set("typeCode", e.target.value)}>{typeCodes.map((c) => <option key={c} value={c.slice(0, 2)}>{c}</option>)}</select></div>
        <div><label>Container name</label><div className="row" style={{ flexWrap: "nowrap" }}><input className="mono" value={f.containerName} onChange={(e) => set("containerName", e.target.value.toUpperCase())} /><button type="button" onClick={suggest} title="Next free number for this task team">Auto</button></div></div>
        <div><label>Delivery milestone</label><select value={f.milestoneId ?? ""} onChange={(e) => set("milestoneId", e.target.value || null)}><option value="">—</option>{data.milestones.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.date})</option>)}</select></div>
        <div><label>Level of information need</label><input list="loin-refs" value={f.loin} onChange={(e) => set("loin", e.target.value)} placeholder="e.g. LOIN-03" /><datalist id="loin-refs">{data.loin.map((l) => <option key={l.id} value={l.ref}>{l.element}</option>)}</datalist></div>
        <div><label>Start</label><input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
        <div><label>Due</label><input type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></div>
        <div><label>Responsible person</label><select value={f.assigneeId ?? ""} onChange={(e) => set("assigneeId", e.target.value || null)}><option value="">—</option>{members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}</select></div>
        <div><label>Status</label><select value={f.status} onChange={(e) => set("status", e.target.value)}>{DELIVERABLE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
      </div>
      <label>Depends on (predecessors)</label>
      <div className="dep-list">{data.deliverables.filter((d) => d.id !== initial?.id).map((d) => (
        <label key={d.id} className="check"><input type="checkbox" checked={f.dependsOn?.includes(d.id)} onChange={(e) => set("dependsOn", e.target.checked ? [...(f.dependsOn ?? []), d.id] : (f.dependsOn ?? []).filter((x) => x !== d.id))} />{d.containerName || d.title}</label>
      ))}{data.deliverables.length <= (initial ? 1 : 0) && <span className="small muted">No other containers yet.</span>}</div>
      <div className="grid g3">
        <div><label>Formats</label><input value={(f.formats ?? []).join(", ")} placeholder="IFC, NWC, PDF, DWG, COBie" onChange={(e) => setF({ ...f, formats: e.target.value.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean) })} /></div>
        <div><label>Classification</label><input value={f.classification ?? ""} placeholder="e.g. Uniclass Ss_25 / NRM1 2.5" onChange={(e) => setF({ ...f, classification: e.target.value })} /></div>
        <div><label>Actual delivery date</label><input type="date" value={f.actualDate ?? ""} onChange={(e) => setF({ ...f, actualDate: e.target.value })} /></div>
      </div>
      <label>Notes</label><input value={f.notes} onChange={(e) => set("notes", e.target.value)} />
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}><button onClick={onClose}>Cancel</button><button className="primary" disabled={!f.title || !f.taskTeamId} onClick={() => onSave(f)}>Save</button></div>
    </div></div>
  );
}

function ImportDialog({ data, onImport, onClose }: { data: DeliveryData; onImport: (rows: object[]) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const rows = useMemo(() => parseTabular(text).filter((r) => !/^task team$/i.test(r[0] ?? "")), [text]);
  const team = (name: string) => data.teams.find((t) => t.name.toLowerCase() === name.trim().toLowerCase() || t.originatorCode === name.trim().toUpperCase());
  const ms = (name: string) => data.milestones.find((m) => m.name.toLowerCase() === name.trim().toLowerCase());
  const parsed = rows.map((r) => ({ team: team(r[0] ?? ""), row: r }));
  const bad = parsed.filter((p) => !p.team || !p.row[2]).length;
  const normDate = (s = "") => (/^\d{4}-\d{2}-\d{2}$/.test(s.trim()) ? s.trim() : /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(s.trim()) ? s.trim().replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, (_, d, m, y) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`) : "");
  return (
    <div className="modal-bg" onClick={onClose}><div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <h2 style={{ marginTop: 0 }}>Import containers from Excel / CSV</h2>
      <p className="small muted">Paste rows with columns: <b>Task team</b> (name or originator code) · <b>Container name</b> · <b>Title</b> · <b>LOIN</b> · <b>Milestone</b> (name) · <b>Start</b> · <b>Due</b>. Dates as YYYY-MM-DD or DD/MM/YYYY.</p>
      <textarea style={{ minHeight: 160 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Architecture\tTWA-ARC-ZZ-ZZ-M3-A-0001\tArchitectural model\tLOIN-03\tStage 3\t2026-01-05\t2026-02-20"} />
      {rows.length > 0 && <p className="small">{rows.length} rows · {bad > 0 ? <span className="error">{bad} rows have an unknown task team or no title and will be skipped</span> : "all rows valid"}</p>}
      <div className="row" style={{ justifyContent: "flex-end" }}><button onClick={onClose}>Cancel</button>
        <button className="primary" disabled={!rows.length || rows.length === bad} onClick={() => onImport(parsed.filter((p) => p.team && p.row[2]).map(({ team: t, row: r }) => ({
          taskTeamId: t!.id, containerName: r[1] ?? "", title: r[2], loin: r[3] ?? "", milestoneId: ms(r[4] ?? "")?.id ?? null, startDate: normDate(r[5]), dueDate: normDate(r[6]),
        })))}>Import {rows.length - bad} rows</button></div>
    </div></div>
  );
}

function Gantt({ data, items }: { data: DeliveryData; items: DeliveryData["deliverables"] }) {
  const dated = items.filter((d) => d.dueDate);
  if (!dated.length) return <p className="muted">Add start and due dates to see the programme.</p>;
  const dates = [...dated.flatMap((d) => [d.startDate || d.dueDate, d.dueDate]), ...data.milestones.map((m) => m.date), today()].sort();
  const start = addDays(dates[0], -3), end = addDays(dates[dates.length - 1], 7);
  const span = Math.max(1, daysBetween(start, end));
  const x = (d: string) => `${(daysBetween(start, d) / span) * 100}%`;
  const team = new Map(data.teams.map((t) => [t.id, t.name]));
  const months: string[] = [];
  for (let d = start.slice(0, 7) + "-01"; d <= end; d = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7), 1)).toISOString().slice(0, 10)) if (d >= start) months.push(d);
  return (
    <div className="gantt">
      <div className="gantt-row gantt-head"><div className="gantt-label" /><div className="gantt-track">
        {months.map((m) => <span key={m} className="gantt-month" style={{ left: x(m) }}>{new Date(m).toLocaleDateString(undefined, { month: "short", year: "2-digit" })}</span>)}
      </div></div>
      {dated.map((d) => {
        const s = d.startDate && d.startDate <= d.dueDate ? d.startDate : d.dueDate;
        const late = d.dueDate < today() && d.status !== "shared" && d.status !== "published";
        return (
          <div key={d.id} className="gantt-row">
            <div className="gantt-label" title={d.title}><span className="mono tiny">{d.containerName || "—"}</span><span className="small">{d.title}</span><span className="tiny muted">{team.get(d.taskTeamId)}</span></div>
            <div className="gantt-track">
              <div className="gantt-bar" title={`${s} → ${d.dueDate} · ${STATUS_LABEL[d.status]}`} style={{ left: x(s), width: `max(6px, calc(${x(addDays(d.dueDate, 1))} - ${x(s)}))`, background: late ? "var(--danger)" : STATUS_COLOR[d.status] }} />
            </div>
          </div>
        );
      })}
      <div className="gantt-overlay">
        <div className="gantt-label" />
        <div className="gantt-track">
          {data.milestones.map((m) => <div key={m.id} className="gantt-milestone" style={{ left: x(m.date) }}><span>◆ {m.name}</span></div>)}
          <div className="gantt-today" style={{ left: x(today()) }}><span>Today</span></div>
        </div>
      </div>
    </div>
  );
}

function Planner({ d, project, members, role, call }: { d: DeliveryData; project: ProjectData["project"]; members: Member[]; role: ProjectData["role"]; call: ReturnType<typeof useDelivery>["call"] }) {
  const [teamFilter, setTeamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState<"table" | "gantt">("table");
  const [edit, setEdit] = useState<null | "new" | DeliveryData["deliverables"][number]>(null);
  const [importing, setImporting] = useState(false);
  const [impact, setImpact] = useState<DeliveryData["deliverables"][number] | null>(null);
  const editor = canEdit(role);
  const team = new Map(d.teams.map((t) => [t.id, t]));
  const ms = new Map(d.milestones.map((m) => [m.id, m]));
  const member = new Map(members.map((m) => [m.userId, m.name]));
  const items = d.deliverables.filter((x) => (!teamFilter || x.taskTeamId === teamFilter) && (!statusFilter || x.status === statusFilter));

  const generate = async (kind: "midp" | "tidp", taskTeamId?: string) => {
    const r = (await call("delivery/generate", "POST", { kind, taskTeamId }, kind === "midp" ? "MIDP document generated" : "TIDP document generated")) as { id: string } | undefined;
    if (r) navigate(`/projects/${project.id}/documents/${r.id}`);
  };

  if (!d.teams.length) return <div className="card empty"><h3>Start with task teams and milestones</h3><p className="muted">The MIDP is built from each task team's TIDP, aligned to the delivery milestones.</p><a className="btn primary" href={`#/projects/${project.id}/delivery/setup`}>Set up task teams & milestones</a></div>;

  return (
    <>
      <div className="grid g4" style={{ marginBottom: 12 }}>
        <div className="card"><div className="small muted">Containers</div><div className="stat">{d.stats.total}</div><Progress value={d.stats.progress} /><div className="tiny muted">{Math.round(d.stats.progress * 100)}% shared or published</div></div>
        <div className="card"><div className="small muted">In progress</div><div className="stat">{d.stats.inProgress}</div><div className="tiny muted">{d.stats.planned} planned</div></div>
        <div className="card"><div className="small muted">Shared / published</div><div className="stat">{d.stats.shared + d.stats.published}</div></div>
        <div className="card"><div className="small muted">Overdue</div><div className="stat" style={{ color: d.stats.overdue ? "var(--danger)" : undefined }}>{d.stats.overdue}</div></div>
      </div>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <div className="row">
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} style={{ width: "auto" }}><option value="">MIDP — all task teams</option>{d.teams.map((t) => <option key={t.id} value={t.id}>TIDP — {t.name}</option>)}</select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto" }}><option value="">All statuses</option>{DELIVERABLE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
          <div className="seg"><button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>Table</button><button className={view === "gantt" ? "on" : ""} onClick={() => setView("gantt")}>Gantt</button></div>
        </div>
        <div className="row">
          {editor && <><button className="primary" onClick={() => setEdit("new")}>+ Container</button><button onClick={() => setImporting(true)}>Import from Excel</button>
            <button onClick={() => generate("midp")}>📄 Generate MIDP</button>
            {teamFilter && <button onClick={() => generate("tidp", teamFilter)}>📄 Generate TIDP</button>}</>}
          <a className="btn" href={`/api/projects/${project.id}/midp.xlsx${teamFilter ? `?team=${teamFilter}` : ""}`}>⬇ Excel</a>
          <button onClick={() => exportCsv(`${project.code}-${teamFilter ? "TIDP-" + team.get(teamFilter)?.name : "MIDP"}`, ["Task team", "Container name", "Title", "Type", "LOIN", "Milestone", "Start", "Due", "Status", "Responsible", "Depends on"],
            items.map((x) => [team.get(x.taskTeamId)?.name ?? "", x.containerName, x.title, x.typeCode, x.loin, ms.get(x.milestoneId ?? "")?.name ?? "", x.startDate, x.dueDate, STATUS_LABEL[x.status], member.get(x.assigneeId ?? "") ?? "",
              x.dependsOn.map((id) => d.deliverables.find((y) => y.id === id)?.containerName).filter(Boolean).join("; ")]))}>⬇ CSV</button>
        </div>
      </div>

      {view === "gantt" ? <div className="card"><Gantt data={d} items={items} /></div> : (
        <div className="card table-wrap">
          <table className="data">
            <thead><tr><th>Container</th><th>Task team</th><th>LOIN</th><th>Milestone</th><th>Start</th><th>Due</th><th>Actual</th><th>Status</th><th>Responsible</th><th /></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={10} className="muted">No containers{teamFilter || statusFilter ? " match the filter" : " yet — add one or import from Excel"}.</td></tr>}
              {items.map((x) => {
                const late = x.dueDate && x.dueDate < today() && x.status !== "shared" && x.status !== "published";
                const m = ms.get(x.milestoneId ?? "");
                return (
                  <tr key={x.id} className={late ? "late" : ""}>
                    <td><span className="mono small">{x.containerName || "—"}</span><div>{x.title}</div>{(x.formats?.length || x.classification) ? <div className="tiny muted">{[x.formats?.join(" · "), x.classification].filter(Boolean).join(" — ")}</div> : null}{x.dependsOn.length > 0 && <div className="tiny muted">after {x.dependsOn.map((id) => d.deliverables.find((y) => y.id === id)?.containerName || "?").join(", ")}</div>}</td>
                    <td className="small">{team.get(x.taskTeamId)?.name}</td>
                    <td className="small">{x.loin}</td>
                    <td className="small">{m ? <>{m.name}<div className="tiny muted">{m.date}</div></> : "—"}</td>
                    <td className="small nowrap">{x.startDate}</td>
                    <td className="small nowrap">{x.dueDate}{late && <div className="tiny error">overdue</div>}</td>
                    <td className="small nowrap">{x.actualDate || "—"}{(() => { const v = variance(x); return v === null ? null : <div className={"tiny " + (v > 0 ? "error" : "muted")}>{v > 0 ? `+${v} d late` : v < 0 ? `${-v} d early` : "on time"}</div>; })()}</td>
                    <td><select className="status-select" disabled={!editor} value={x.status} style={{ borderColor: STATUS_COLOR[x.status] }} onChange={(e) => call(`deliverables/${x.id}`, "PUT", { status: e.target.value })}>
                      {DELIVERABLE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></td>
                    <td className="small">{member.get(x.assigneeId ?? "") ?? "—"}</td>
                    <td className="nowrap"><button className="ghost tiny" title="What if this is late?" onClick={() => setImpact(x)}>Impact</button>{editor && <><button className="ghost tiny" onClick={() => setEdit(x)}>Edit</button><button className="ghost tiny danger" onClick={() => confirm(`Delete ${x.containerName || x.title}?`) && call(`deliverables/${x.id}`, "DELETE")}>✕</button></>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <PlanCheckSummary findings={d.findings} projectId={project.id} />

      {edit && <DeliverableDialog initial={edit === "new" ? undefined : edit} data={d} members={members} projectCode={project.code} onClose={() => setEdit(null)}
        onSave={async (row) => { const { id: _id, ...rest } = row as Deliverable; const r = edit === "new" ? await call("deliverables", "POST", rest, "Container added") : await call(`deliverables/${(edit as Deliverable).id}`, "PUT", rest, "Container updated"); if (r) setEdit(null); }} />}
      {impact && <ImpactDialog d={d} item={impact} editor={editor} projectId={project.id} call={call} onClose={() => setImpact(null)} />}
      {importing && <ImportDialog data={d} onClose={() => setImporting(false)} onImport={async (rows) => { const r = await call("deliverables-import", "POST", { rows }, `Imported ${rows.length} containers`); if (r) setImporting(false); }} />}
    </>
  );
}

function ImpactDialog({ d, item, editor, projectId, call, onClose }: { d: DeliveryData; item: DeliveryData["deliverables"][number]; editor: boolean; projectId: string; call: ReturnType<typeof useDelivery>["call"]; onClose: () => void }) {
  const [days, setDays] = useState(7);
  const r = useMemo(() => changeImpact(d.deliverables, d.milestones, item.id, days), [d, item.id, days]);
  const apply = async () => {
    for (const s of r.shifted) {
      const cur = d.deliverables.find((x) => x.id === s.id)!;
      const delta = daysBetween(s.from, s.to);
      await call(`deliverables/${s.id}`, "PUT", { dueDate: s.to, ...(cur.startDate ? { startDate: addDays(cur.startDate, delta) } : {}) });
    }
    onClose();
  };
  return (
    <div className="modal-bg" onClick={onClose}><div className="modal wide" onClick={(e) => e.stopPropagation()}>
      <h2 style={{ marginTop: 0 }}>Change impact: {item.containerName || item.title}</h2>
      {!item.dueDate ? <p className="muted">This container has no due date.</p> : <>
        <div className="row"><label style={{ margin: 0 }}>If it is delayed by</label><input type="number" min={-60} max={365} value={days} onChange={(e) => setDays(+e.target.value)} style={{ width: 90 }} /><span>days (due {item.dueDate} → {addDays(item.dueDate, days)})</span></div>
        <h3>Containers affected ({r.shifted.length})</h3>
        <table className="data"><thead><tr><th>Container</th><th>Due now</th><th>New due</th></tr></thead>
          <tbody>{r.shifted.map((s) => <tr key={s.id}><td>{s.label}</td><td>{s.from}</td><td><b>{s.to}</b></td></tr>)}</tbody></table>
        <h3>Milestones at risk</h3>
        {r.milestoneBreaches.length ? r.milestoneBreaches.map((b) => <div key={b.milestone} className="finding error">⛔ {b.milestone} ({b.date}) — {b.containers.join(", ")} would be late</div>) : <p style={{ color: "var(--ok)" }}>✔ No milestone is breached.</p>}
        {r.documents.length > 0 && <><h3>Linked documents to revisit</h3>{r.documents.map((id) => <a key={id} className="list-item" href={`#/projects/${projectId}/documents/${id}`}>Open document</a>)}</>}
        <p className="small muted">Dependencies are finish-to-start; float before a successor's start absorbs part of the delay.</p>
      </>}
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}><button onClick={onClose}>Close</button>{editor && r.shifted.length > 0 && <button className="primary" onClick={apply}>Apply new dates</button>}</div>
    </div></div>
  );
}

// ---------------------------------------------------------------- setup: teams & milestones

function Setup({ d, members, role, call }: { d: DeliveryData; members: Member[]; role: ProjectData["role"]; call: ReturnType<typeof useDelivery>["call"] }) {
  const editor = canEdit(role);
  const [team, setTeam] = useState({ name: "", organization: "", originatorCode: "", roleCode: "A", leadUserId: "" });
  const [ms, setMs] = useState({ name: "", date: "", description: "" });
  return (
    <div className="grid g2">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Task teams</h3>
        <p className="small muted">Each task team produces its own TIDP. The originator and role codes drive container names.</p>
        <table className="data"><thead><tr><th>Team</th><th>Originator</th><th>Role</th><th>Lead</th><th /></tr></thead><tbody>
          {d.teams.map((t) => <tr key={t.id}><td>{t.name}<div className="tiny muted">{t.organization}</div></td><td className="mono">{t.originatorCode}</td><td>{t.roleCode}</td>
            <td className="small">{members.find((m) => m.userId === t.leadUserId)?.name ?? "—"}</td>
            <td>{editor && <button className="ghost tiny danger" onClick={() => confirm(`Delete ${t.name}?`) && call(`task-teams/${t.id}`, "DELETE")}>✕</button>}</td></tr>)}
          {d.teams.length === 0 && <tr><td colSpan={5} className="muted">No task teams yet.</td></tr>}
        </tbody></table>
        {editor && <form className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }} onSubmit={async (e) => { e.preventDefault(); if (await call("task-teams", "POST", { ...team, leadUserId: team.leadUserId || null }, "Task team added")) setTeam({ name: "", organization: "", originatorCode: "", roleCode: "A", leadUserId: "" }); }}>
          <input required placeholder="Team name, e.g. Architecture" value={team.name} onChange={(e) => setTeam({ ...team, name: e.target.value })} />
          <input placeholder="Organization" value={team.organization} onChange={(e) => setTeam({ ...team, organization: e.target.value })} />
          <input placeholder="Originator code (3–6)" pattern="[A-Za-z0-9]{3,6}" value={team.originatorCode} onChange={(e) => setTeam({ ...team, originatorCode: e.target.value.toUpperCase() })} />
          <select value={team.roleCode} onChange={(e) => setTeam({ ...team, roleCode: e.target.value })}>{roleCodes.map((c) => <option key={c} value={c.split(" ")[0]}>{c}</option>)}</select>
          <select value={team.leadUserId} onChange={(e) => setTeam({ ...team, leadUserId: e.target.value })}><option value="">Team lead —</option>{members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}</select>
          <button className="primary">+ Add task team</button>
        </form>}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Information delivery milestones</h3>
        <p className="small muted">Key decision points from the EIR (ISO 19650-2 5.1.3). Containers are planned to meet these dates.</p>
        <table className="data"><thead><tr><th>Milestone</th><th>Date</th><th /></tr></thead><tbody>
          {d.milestones.map((m) => <tr key={m.id}><td>{m.name}<div className="tiny muted">{m.description}</div></td><td className="nowrap">{m.date}</td>
            <td>{editor && <button className="ghost tiny danger" onClick={() => confirm(`Delete ${m.name}?`) && call(`milestones/${m.id}`, "DELETE")}>✕</button>}</td></tr>)}
          {d.milestones.length === 0 && <tr><td colSpan={3} className="muted">No milestones yet.</td></tr>}
        </tbody></table>
        {editor && <form className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }} onSubmit={async (e) => { e.preventDefault(); if (await call("milestones", "POST", ms, "Milestone added")) setMs({ name: "", date: "", description: "" }); }}>
          <input required placeholder="e.g. Stage 3 — Spatial coordination" value={ms.name} onChange={(e) => setMs({ ...ms, name: e.target.value })} />
          <input required type="date" value={ms.date} onChange={(e) => setMs({ ...ms, date: e.target.value })} />
          <input placeholder="Purpose / decision" value={ms.description} onChange={(e) => setMs({ ...ms, description: e.target.value })} style={{ gridColumn: "1 / -1" }} />
          <button className="primary">+ Add milestone</button>
        </form>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- responsibility matrix

const RACI_CYCLE = ["", "R", "A", "C", "I", "R/A"];

function Responsibility({ d, project, role, call }: { d: DeliveryData; project: ProjectData["project"]; role: ProjectData["role"]; call: ReturnType<typeof useDelivery>["call"] }) {
  const editor = canEdit(role);
  const [item, setItem] = useState(""); const [stage, setStage] = useState("");
  const missingA = d.responsibility.filter((r) => !Object.values(r.cells).some((v) => v.includes("A")));
  const missingR = d.responsibility.filter((r) => !Object.values(r.cells).some((v) => v.includes("R")));
  const multiA = d.responsibility.filter((r) => Object.values(r.cells).filter((v) => v.includes("A")).length > 1);
  if (!d.teams.length) return <div className="card muted">Add task teams first (Setup).</div>;
  return (
    <>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <p className="small muted" style={{ margin: 0 }}>Click a cell to cycle R → A → C → I → R/A. Exactly one <b>A</b>ccountable and at least one <b>R</b>esponsible per row (ISO 19650-2 5.4.2).</p>
        {editor && <button onClick={async () => { const r = (await call("delivery/generate", "POST", { kind: "resp-matrix" }, "Responsibility matrix document generated")) as { id: string } | undefined; if (r) navigate(`/projects/${project.id}/documents/${r.id}`); }}>📄 Generate DRM document</button>}
      </div>
      <div className="card table-wrap">
        <table className="data raci">
          <thead><tr><th>Information / element</th><th>Stage</th><th>LOIN</th>{d.teams.map((t) => <th key={t.id} className="center-cell">{t.name}</th>)}<th /></tr></thead>
          <tbody>
            {d.responsibility.map((r) => (
              <tr key={r.id} className={missingA.includes(r) || missingR.includes(r) || multiA.includes(r) ? "late" : ""}>
                <td>{r.item}</td><td className="small">{r.stage}</td><td className="small">{r.loin}</td>
                {d.teams.map((t) => {
                  const v = r.cells[t.id] ?? "";
                  return <td key={t.id} className="center-cell"><button className={"raci-cell raci-" + (v.replace("/", "") || "none")} disabled={!editor}
                    onClick={() => call(`responsibility/${r.id}`, "PUT", { cells: { ...r.cells, [t.id]: RACI_CYCLE[(RACI_CYCLE.indexOf(v) + 1) % RACI_CYCLE.length] } })}>{v || "·"}</button></td>;
                })}
                <td>{editor && <button className="ghost tiny danger" onClick={() => call(`responsibility/${r.id}`, "DELETE")}>✕</button>}</td>
              </tr>
            ))}
            {d.responsibility.length === 0 && <tr><td colSpan={d.teams.length + 4} className="muted">No rows yet.</td></tr>}
          </tbody>
        </table>
        {editor && <form className="row" style={{ marginTop: 10 }} onSubmit={async (e) => { e.preventDefault(); if (await call("responsibility", "POST", { item, stage, sortOrder: d.responsibility.length })) { setItem(""); } }}>
          <input required placeholder="Information / element, e.g. Structural frame model" value={item} onChange={(e) => setItem(e.target.value)} style={{ maxWidth: 340 }} />
          <input placeholder="Stage / milestone" value={stage} onChange={(e) => setStage(e.target.value)} style={{ maxWidth: 200 }} />
          <button className="primary">+ Add row</button>
          {d.deliverables.length > 0 && d.responsibility.length === 0 && <button type="button" onClick={async () => {
            for (const [i, x] of d.deliverables.entries()) await call("responsibility", "POST", { item: x.title, stage: d.milestones.find((m) => m.id === x.milestoneId)?.name ?? "", loin: x.loin, cells: { [x.taskTeamId]: "R" }, sortOrder: i });
          }}>Seed from MIDP</button>}
          {d.responsibility.length === 0 && <button type="button" onClick={async () => {
            for (const [i, x] of RACI_STARTER.entries()) await call("responsibility", "POST", { ...x, sortOrder: i });
          }}>Add ISO 19650-2 activity list ({RACI_STARTER.length})</button>}
        </form>}
      </div>
      {(missingA.length > 0 || missingR.length > 0 || multiA.length > 0) && <div className="card" style={{ marginTop: 12 }}>
        {missingA.length > 0 && <div className="finding error">⛔ No accountable party: {missingA.map((r) => r.item).join(", ")}</div>}
        {multiA.length > 0 && <div className="finding error">⛔ More than one accountable party: {multiA.map((r) => r.item).join(", ")}</div>}
        {missingR.length > 0 && <div className="finding warning">⚠ No responsible party: {missingR.map((r) => r.item).join(", ")}</div>}
      </div>}
    </>
  );
}

// ---------------------------------------------------------------- LOIN

function Loin({ d, role, call }: { d: DeliveryData; role: ProjectData["role"]; call: ReturnType<typeof useDelivery>["call"] }) {
  const editor = canEdit(role);
  const nextRef = `LOIN-${String(d.loin.length + 1).padStart(2, "0")}`;
  const blank: Omit<LoinRow, "id"> = { ref: nextRef, element: "", ifcClass: "", milestoneId: d.milestones[0]?.id ?? null, purpose: "", geometry: "", alphanumeric: "", documentation: "" };
  const [row, setRow] = useState(blank);
  useEffect(() => setRow((r) => ({ ...r, ref: nextRef })), [nextRef]);
  const save = (id: string, k: keyof LoinRow, v: string) => call(`loin/${id}`, "PUT", { [k]: v });
  const cell = (r: LoinRow, k: keyof LoinRow, multiline = false) => {
    const v = String(r[k] ?? "");
    if (!editor) return <span className="small">{v}</span>;
    return multiline
      ? <textarea className="cell-input" defaultValue={v} onBlur={(e) => e.target.value !== v && save(r.id, k, e.target.value)} />
      : <input className="cell-input" defaultValue={v} onBlur={(e) => e.target.value !== v && save(r.id, k, e.target.value)} />;
  };
  return (
    <>
      <p className="small muted">Level of information need per element and milestone (ISO 7817-1): geometrical information, alphanumerical information and documentation. Reference these in the planner and EIR.</p>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Ref</th><th>Element</th><th>IFC class</th><th>Milestone</th><th>Purpose</th><th>Geometry</th><th>Alphanumeric</th><th>Documentation</th><th /></tr></thead>
          <tbody>
            {d.loin.map((r) => (
              <tr key={r.id}>
                <td className="mono small">{r.ref}</td><td>{cell(r, "element")}</td><td>{cell(r, "ifcClass")}</td>
                <td className="small">{d.milestones.find((m) => m.id === r.milestoneId)?.name ?? "—"}</td>
                <td>{cell(r, "purpose", true)}</td><td>{cell(r, "geometry", true)}</td><td>{cell(r, "alphanumeric", true)}</td><td>{cell(r, "documentation", true)}</td>
                <td>{editor && <button className="ghost tiny danger" onClick={() => call(`loin/${r.id}`, "DELETE")}>✕</button>}</td>
              </tr>
            ))}
            {d.loin.length === 0 && <tr><td colSpan={9} className="muted">No LOIN entries yet.</td></tr>}
          </tbody>
        </table>
        {editor && <form className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 8, marginTop: 10 }} onSubmit={async (e) => { e.preventDefault(); if (await call("loin", "POST", row, "LOIN entry added")) setRow(blank); }}>
          <input required value={row.ref} onChange={(e) => setRow({ ...row, ref: e.target.value })} />
          <input required placeholder="Element, e.g. Door" value={row.element} onChange={(e) => setRow({ ...row, element: e.target.value })} />
          <input placeholder="IFC class, e.g. IfcDoor" value={row.ifcClass} onChange={(e) => setRow({ ...row, ifcClass: e.target.value })} />
          <select value={row.milestoneId ?? ""} onChange={(e) => setRow({ ...row, milestoneId: e.target.value || null })}><option value="">Milestone —</option>{d.milestones.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <input placeholder="Purpose" value={row.purpose} onChange={(e) => setRow({ ...row, purpose: e.target.value })} />
          <input placeholder="Geometry (detail, dimensionality, location, appearance)" value={row.geometry} onChange={(e) => setRow({ ...row, geometry: e.target.value })} />
          <input placeholder="Alphanumeric (properties)" value={row.alphanumeric} onChange={(e) => setRow({ ...row, alphanumeric: e.target.value })} />
          <input placeholder="Documentation" value={row.documentation} onChange={(e) => setRow({ ...row, documentation: e.target.value })} />
          <button className="primary">+ Add LOIN</button>
        </form>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- model responsibility matrix

function Mrm({ d, project, role, call }: { d: DeliveryData; project: ProjectData["project"]; role: ProjectData["role"]; call: ReturnType<typeof useDelivery>["call"] }) {
  const editor = canEdit(role);
  const [filter, setFilter] = useState("");
  const [row, setRow] = useState({ discipline: "", system: "", element: "" });
  if (!d.teams.length || !d.milestones.length) return <div className="card muted">Add task teams and milestones first (Teams & milestones).</div>;
  const disciplines = [...new Set(d.mrm.map((r) => r.discipline))];
  const rows = d.mrm.filter((r) => !filter || r.discipline === filter);
  const findings = mrmFindings(d.mrm, d.milestones.map((m) => m.id));
  const setCell = (r: MrmRow, mid: string, p: Partial<MrmCell>) => call(`mrm/${r.id}`, "PUT", { cells: { ...r.cells, [mid]: { ...({ teamId: "", lod: "" } as MrmCell), ...r.cells[mid], ...p } } });
  return (
    <>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <p className="small muted" style={{ margin: 0, maxWidth: 760 }}>For each model element and milestone, choose the task team that models it and its level of development. LOD should never go down between milestones. Hover an LOD for its meaning.</p>
        <div className="row">
          {disciplines.length > 1 && <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: "auto" }}><option value="">All disciplines</option>{disciplines.map((x) => <option key={x}>{x}</option>)}</select>}
          <button onClick={() => exportCsv(`${project.code}-MRM`, ["Discipline", "System", "Element", ...d.milestones.flatMap((m) => [`${m.name} team`, `${m.name} LOD`])], d.mrm.map((r) => [r.discipline, r.system, r.element, ...d.milestones.flatMap((m) => [d.teams.find((t) => t.id === r.cells[m.id]?.teamId)?.name ?? "", r.cells[m.id]?.lod ?? ""])]))}>⬇ CSV</button>
          {editor && d.mrm.length > 0 && <button onClick={async () => { const r = (await call("delivery/generate", "POST", { kind: "mrm" }, "MRM document generated")) as { id: string } | undefined; if (r) navigate(`/projects/${project.id}/documents/${r.id}`); }}>📄 Generate MRM document</button>}
        </div>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Discipline</th><th>System</th><th>Element</th>{d.milestones.map((m) => <th key={m.id} className="center-cell">{m.name}</th>)}<th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="small">{r.discipline}</td><td className="small">{r.system}</td><td>{r.element}</td>
                {d.milestones.map((m) => { const c = r.cells[m.id] ?? { teamId: "", lod: "" }; return (
                  <td key={m.id} className="center-cell" style={{ minWidth: 150 }}>
                    <select className="tiny" disabled={!editor} value={c.teamId} onChange={(e) => setCell(r, m.id, { teamId: e.target.value })}><option value="">—</option>{d.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                    <select className="tiny" disabled={!editor} value={c.lod} title={c.lod ? LOD_MEANING[c.lod as Lod] : ""} onChange={(e) => setCell(r, m.id, { lod: e.target.value as Lod })}><option value="">LOD</option>{LODS.map((l) => <option key={l} value={l} title={LOD_MEANING[l]}>{l}</option>)}</select>
                  </td>); })}
                <td>{editor && <button className="ghost tiny danger" onClick={() => call(`mrm/${r.id}`, "DELETE")}>✕</button>}</td>
              </tr>
            ))}
            {!d.mrm.length && <tr><td colSpan={d.milestones.length + 4} className="muted">No elements yet.{editor && <> <button className="small" onClick={() => call("mrm-seed", "POST", {}, "Starter elements added")}>Add starter element list</button></>}</td></tr>}
          </tbody>
        </table>
        {editor && <form className="row" style={{ marginTop: 10 }} onSubmit={async (e) => { e.preventDefault(); if (await call("mrm", "POST", { ...row, sortOrder: d.mrm.length })) setRow({ ...row, element: "" }); }}>
          <input required placeholder="Discipline" value={row.discipline} onChange={(e) => setRow({ ...row, discipline: e.target.value })} style={{ maxWidth: 160 }} list="mrm-disc" />
          <datalist id="mrm-disc">{disciplines.map((x) => <option key={x} value={x} />)}</datalist>
          <input placeholder="System" value={row.system} onChange={(e) => setRow({ ...row, system: e.target.value })} style={{ maxWidth: 180 }} />
          <input required placeholder="Element, e.g. Cable trays" value={row.element} onChange={(e) => setRow({ ...row, element: e.target.value })} style={{ maxWidth: 260 }} />
          <button className="primary">+ Add element</button>
        </form>}
      </div>
      {findings.length > 0 && <div className="card" style={{ marginTop: 12 }}>{findings.map((f) => <div key={f} className="finding warning">⚠ {f}</div>)}</div>}
    </>
  );
}

// ---------------------------------------------------------------- page

const SUBTABS = ["plan", "setup", "uses", "responsibility", "mrm", "loin", "risks", "hs", "handover"];

export default function Delivery({ data, sub }: { data: ProjectData; sub?: string }) {
  const { data: d, call } = useDelivery(data.project.id);
  const tab = SUBTABS.includes(sub ?? "") ? sub! : "plan";
  if (!d) return <p className="muted">Loading…</p>;
  return (
    <>
      {tab === "plan" && <Planner d={d} project={data.project} members={data.members} role={data.role} call={call} />}
      {tab === "setup" && <Setup d={d} members={data.members} role={data.role} call={call} />}
      {tab === "uses" && <ProjectInfoUses data={data} />}
      {tab === "responsibility" && <Responsibility d={d} project={data.project} role={data.role} call={call} />}
      {tab === "mrm" && <Mrm d={d} project={data.project} role={data.role} call={call} />}
      {tab === "loin" && <Loin d={d} role={data.role} call={call} />}
      {tab === "risks" && <Risks data={data} />}
      {tab === "hs" && <HealthSafety data={data} />}
      {tab === "handover" && <Handover data={data} />}
    </>
  );
}
