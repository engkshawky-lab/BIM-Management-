import { useEffect, useMemo, useState } from "react";
import { useSession } from "../App";
import { analyse4d, cellKey, percentComplete, stateAt, type Activity, type CellState, type ModelGrid } from "../../../shared/fourd";
import { api, canEdit } from "../lib/api";
import { exportCsv, parseTabular } from "../lib/export";
import type { ProjectData } from "./Project";

interface Plan { fileId: string | null; fileName: string; fileVersion: number; grid: ModelGrid | null; activities: Activity[] }
const STATE: Record<CellState, { label: string; bg: string; fg: string }> = {
  none: { label: "Not linked", bg: "transparent", fg: "var(--muted)" },
  "not-started": { label: "Not started", bg: "var(--surface-2)", fg: "var(--text)" },
  "in-progress": { label: "In progress", bg: "color-mix(in srgb, var(--accent) 40%, var(--surface))", fg: "var(--text)" },
  complete: { label: "Complete", bg: "var(--accent)", fg: "#fff" },
};
const blank = (): Activity => ({ id: crypto.randomUUID(), code: "", name: "", start: "", finish: "", actualStart: "", actualFinish: "", storeys: [], classes: [] });
const addDays = (d: string, n: number) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);

export default function FourD({ data }: { data: ProjectData }) {
  const { toast } = useSession();
  const pid = data.project.id;
  const editor = canEdit(data.role);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const [acts, setActs] = useState<Activity[]>([]);
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<"planned" | "actual">("planned");
  const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
  const [paste, setPaste] = useState<string | null>(null);
  const load = () => api<{ plan: Plan; ifcFiles: { id: string; name: string }[] }>(`/projects/${pid}/4d`).then((r) => { setPlan(r.plan); setActs(r.plan.activities); setFiles(r.ifcFiles); setDirty(false); });
  useEffect(() => { load(); }, [pid]); // eslint-disable-line react-hooks/exhaustive-deps

  const range = useMemo(() => {
    const ds = acts.flatMap((a) => [a.start, a.finish, a.actualStart, a.actualFinish]).filter(Boolean).sort();
    return ds.length ? { min: ds[0], max: ds[ds.length - 1] } : null;
  }, [acts]);
  if (!plan) return <p className="muted">Loading…</p>;
  const grid = plan.grid;
  const a = grid ? analyse4d(grid, acts) : null;
  const st = grid ? stateAt(grid, acts, day, mode === "actual") : {};
  const set = (i: number, p: Partial<Activity>) => { setActs(acts.map((x, j) => (j === i ? { ...x, ...p } : x))); setDirty(true); };
  const save = async () => { try { await api(`/projects/${pid}/4d/activities`, { method: "PUT", body: { activities: acts } }); toast("4D plan saved"); setDirty(false); } catch (e) { toast((e as Error).message, "error"); } };
  const span = range ? Math.max(1, Math.round((Date.parse(range.max) - Date.parse(range.min)) / 864e5)) : 0;

  return (
    <>
      <p className="muted">Link programme activities to the model by storey and IFC class, then move through time to see what should be built (planned) and what has been built (actual). Elements no activity covers are flagged.</p>
      <div className="card row spread" style={{ marginBottom: 12 }}>
        <div className="row"><b>Model</b>
          <select disabled={!editor} value={plan.fileId ?? ""} onChange={async (e) => { if (!e.target.value) return; try { const r = await api<{ elements: number }>(`/projects/${pid}/4d/model`, { body: { fileId: e.target.value } }); toast(`${r.elements} elements read`); load(); } catch (err) { toast((err as Error).message, "error"); } }} style={{ width: "auto" }}>
            <option value="">{files.length ? "Choose an IFC file…" : "Upload an IFC file to Files first"}</option>{files.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          {plan.fileName && <span className="small muted">{plan.fileName} v{plan.fileVersion} · {a?.total} elements · {a ? Math.round((a.linked / Math.max(1, a.total)) * 100) : 0}% linked</span>}
        </div>
        {editor && grid && plan.fileId && <button className="small" onClick={async () => { await api(`/projects/${pid}/4d/model`, { body: { fileId: plan.fileId } }); load(); }}>Refresh from latest version</button>}
      </div>

      {grid && <>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="row spread">
            <div className="seg"><button className={mode === "planned" ? "on" : ""} onClick={() => setMode("planned")}>Planned</button><button className={mode === "actual" ? "on" : ""} onClick={() => setMode("actual")}>Actual</button></div>
            <div className="row"><input type="date" value={day} onChange={(e) => setDay(e.target.value)} style={{ width: "auto" }} />
              <span className="small">Planned <b>{percentComplete(grid, acts, day)}%</b> · Actual <b>{percentComplete(grid, acts, day, true)}%</b> complete</span></div>
          </div>
          {range && <input type="range" min={0} max={span} value={Math.min(span, Math.max(0, Math.round((Date.parse(day) - Date.parse(range.min)) / 864e5)))} onChange={(e) => setDay(addDays(range.min, +e.target.value))} style={{ width: "100%", marginTop: 8 }} aria-label="Timeline" />}
          <div className="row small" style={{ gap: 14, margin: "6px 0" }}>{(Object.keys(STATE) as CellState[]).map((k) => <span key={k} className="row" style={{ gap: 4 }}><span style={{ width: 14, height: 14, borderRadius: 3, background: STATE[k].bg, border: k === "none" ? "1px dashed var(--muted)" : "1px solid var(--border)" }} />{STATE[k].label}</span>)}</div>
          <div className="table-wrap" style={{ maxHeight: 460, overflow: "auto" }}><table className="data fourd">
            <thead><tr><th>Storey \ class</th>{grid.classes.map((c) => <th key={c} className="tiny" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap" }}>{c.replace(/^ifc/i, "")}</th>)}</tr></thead>
            <tbody>{grid.storeys.map((s) => <tr key={s}><th className="small nowrap">{s}</th>{grid.classes.map((c) => {
              const k = cellKey(s, c); const n = grid.counts[k]; const state = st[k] ?? "none";
              return <td key={c} title={n ? `${s} · ${c}: ${n} elements — ${STATE[state].label}` : ""} style={n ? { background: STATE[state].bg, color: STATE[state].fg, textAlign: "center", border: state === "none" ? "1px dashed var(--muted)" : undefined } : undefined} className="tiny">{n ?? ""}</td>;
            })}</tr>)}</tbody>
          </table></div>
        </div>
        {a && (a.unlinked.length > 0 || a.overlaps.length > 0) && <div className="card" style={{ marginBottom: 12 }}>
          {a.unlinked.length > 0 && <div className="finding warning">⚠ {a.unlinked.reduce((x, u) => x + u.n, 0)} elements not covered by any activity: {a.unlinked.slice(0, 8).map((u) => `${u.storey} · ${u.cls.replace(/^ifc/i, "")} (${u.n})`).join(", ")}{a.unlinked.length > 8 ? "…" : ""}</div>}
          {a.overlaps.length > 0 && <div className="finding info">ℹ {a.overlaps.length} storey/class groups are covered by more than one activity, e.g. {a.overlaps.slice(0, 3).map((o) => `${o.storey} · ${o.cls.replace(/^ifc/i, "")} (${o.activities.join(", ")})`).join("; ")}</div>}
        </div>}
      </>}

      <div className="card">
        <div className="row spread"><h3 style={{ margin: 0 }}>Activities ({acts.length})</h3>
          <div className="row">
            {acts.length > 0 && <button className="small" onClick={() => exportCsv(`${data.project.code}-4D`, ["Code", "Activity", "Start", "Finish", "Actual start", "Actual finish", "Storeys", "Classes", "Elements"], acts.map((x) => [x.code, x.name, x.start, x.finish, x.actualStart, x.actualFinish, x.storeys.join("; "), x.classes.join("; "), String(a?.perActivity.find((p) => p.id === x.id)?.elements ?? "")]))}>⬇ CSV</button>}
            {editor && <><button className="small" onClick={() => setPaste("")}>Paste from programme</button><button className="small" onClick={() => { setActs([...acts, blank()]); setDirty(true); }}>+ Activity</button><button className="small primary" disabled={!dirty} onClick={save}>Save</button></>}
          </div></div>
        {paste !== null && <div style={{ margin: "8px 0" }}>
          <p className="small muted">Paste rows from Primavera, MS Project or Excel with columns: <b>Code, Activity, Start, Finish, Storeys, Classes</b> (storeys/classes separated by ";"; empty = all). Dates as YYYY-MM-DD.</p>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} style={{ minHeight: 100 }} />
          <div className="row"><button className="small primary" onClick={() => {
            const rows = parseTabular(paste).filter((r) => r.length >= 2 && r[1]);
            const body = /activity|name/i.test(rows[0]?.join(" ") ?? "") ? rows.slice(1) : rows;
            const split = (v?: string) => (v ?? "").split(";").map((x) => x.trim()).filter(Boolean);
            setActs([...acts, ...body.map((r) => ({ ...blank(), code: r[0] ?? "", name: r[1], start: r[2] ?? "", finish: r[3] ?? "", storeys: split(r[4]), classes: split(r[5]) }))]); setDirty(true); setPaste(null);
          }}>Add rows</button><button className="small ghost" onClick={() => setPaste(null)}>Cancel</button></div>
        </div>}
        <div className="table-wrap"><table className="data">
          <thead><tr><th>Code</th><th>Activity</th><th>Start</th><th>Finish</th><th>Actual start</th><th>Actual finish</th><th>Storeys</th><th>IFC classes</th><th>Elements</th><th /></tr></thead>
          <tbody>{acts.map((x, i) => (
            <tr key={x.id}>
              <td><input disabled={!editor} value={x.code} onChange={(e) => set(i, { code: e.target.value })} style={{ width: 70 }} /></td>
              <td><input disabled={!editor} value={x.name} onChange={(e) => set(i, { name: e.target.value })} /></td>
              {(["start", "finish", "actualStart", "actualFinish"] as const).map((k) => <td key={k}><input type="date" disabled={!editor} value={x[k]} onChange={(e) => set(i, { [k]: e.target.value })} /></td>)}
              {(["storeys", "classes"] as const).map((k) => <td key={k} style={{ minWidth: 150 }}>
                <div className="chips">{x[k].map((v) => <span key={v} className="chip">{k === "classes" ? v.replace(/^ifc/i, "") : v}{editor && <button className="linklike" onClick={() => set(i, { [k]: x[k].filter((y) => y !== v) })}> ✕</button>}</span>)}{!x[k].length && <span className="tiny muted">all</span>}</div>
                {editor && grid && <select value="" onChange={(e) => e.target.value && set(i, { [k]: [...x[k], e.target.value] })} className="tiny"><option value="">+ add</option>{(k === "storeys" ? grid.storeys : grid.classes).filter((v) => !x[k].includes(v)).map((v) => <option key={v} value={v}>{v}</option>)}</select>}
              </td>)}
              <td>{a?.perActivity.find((p) => p.id === x.id)?.elements ?? "—"}</td>
              <td>{editor && <button className="ghost tiny danger" onClick={() => { setActs(acts.filter((_, j) => j !== i)); setDirty(true); }}>✕</button>}</td>
            </tr>
          ))}
          {!acts.length && <tr><td colSpan={10} className="muted">No activities yet — add them or paste from your programme.</td></tr>}</tbody>
        </table></div>
      </div>
    </>
  );
}
