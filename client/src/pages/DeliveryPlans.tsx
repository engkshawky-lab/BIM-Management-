import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { saveAs } from "file-saver";
import { useSession } from "../App";
import { api } from "../lib/api";
import { exportCsv, parseTabular } from "../lib/export";
import { saveMarkdownDocx } from "../lib/mdDocx";
import {
  CONTAINER_COLUMNS, DEFAULT_MILESTONES, DISCIPLINES, STATUSES, SUITABILITY, TYPE_CODES, aggregateTidps, checkContainers, containerName, emptyRow, numberRows, starterRows,
  type ContainerRow, type MpdtRow, type PlanHeader, type PlanKind, type PlanMilestone,
} from "../../../shared/planRows";
import { TONES } from "./hubTheme";

// TIDP / MIDP / MPDT generator: editable tables with ISO 19650 container naming, checks, starter lists,
// optional AI rows, Excel / CSV / Word export and a reset.

const KINDS: { id: PlanKind; label: string; full: string; clause: string; c: string }[] = [
  { id: "tidp", label: "TIDP", full: "Task Information Delivery Plan", clause: "ISO 19650-2 5.4.4", c: TONES.blue },
  { id: "midp", label: "MIDP", full: "Master Information Delivery Plan", clause: "ISO 19650-2 5.4.5", c: TONES.green },
  { id: "mpdt", label: "MPDT", full: "Model Production and Delivery Table", clause: "ISO 19650-2 5.4.2", c: TONES.purple },
];
const cv = (c: string) => ({ "--c": c }) as CSSProperties;
const EMPTY_HEADER: PlanHeader = { projectName: "", projectCode: "", appointingParty: "", leadAppointedParty: "", taskTeam: "", originator: "", discipline: "architecture", preparedBy: "", revision: "P01" };
const MPDT_STAGES = ["Stage 2", "Stage 3", "Stage 4", "Stage 5"];
const MPDT_STARTER: [string, string][] = [
  ["Foundations", "structure"], ["Structural frame (columns, beams)", "structure"], ["Floor slabs", "structure"], ["External walls / façade", "architecture"], ["Internal walls and partitions", "architecture"],
  ["Doors and windows", "architecture"], ["Roofs", "architecture"], ["Stairs and ramps", "architecture"], ["Ceilings and finishes", "architecture"], ["Spaces / rooms", "architecture"],
  ["Ductwork and air terminals", "mechanical"], ["Mechanical plant (AHUs, chillers, boilers)", "mechanical"], ["Pipework and valves", "publichealth"], ["Sanitaryware", "publichealth"],
  ["Lighting and luminaires", "electrical"], ["Power distribution and containment", "electrical"], ["Fire detection and alarm", "electrical"], ["Drainage below ground", "civil"], ["External works and paving", "landscape"],
];
const LOD_STEPS = ["LOD 200 — approximate size and location", "LOD 300 — specified size, location, key properties", "LOD 350 — interfaces and connections", "LOD 400 — fabrication / installation detail"];
const mpdtStarter = (disciplines: string[], stages: string[]): MpdtRow[] =>
  MPDT_STARTER.filter(([, d]) => disciplines.includes(d)).map(([element, d]) => ({ element, classification: "", author: DISCIPLINES[d].label, notes: "", loin: Object.fromEntries(stages.map((s, i) => [s, LOD_STEPS[Math.min(i, LOD_STEPS.length - 1)]])) }));

interface State { header: PlanHeader; milestones: PlanMilestone[]; disciplines: string[]; rows: ContainerRow[]; mpdt: MpdtRow[]; stages: string[]; notes: string }
const fresh = (): State => ({ header: { ...EMPTY_HEADER }, milestones: DEFAULT_MILESTONES.map((m) => ({ ...m })), disciplines: ["architecture", "structure", "mechanical", "electrical"], rows: [], mpdt: [], stages: [...MPDT_STAGES], notes: "" });
const key = (k: PlanKind) => `bim:plan:${k}`;
const load = (k: PlanKind): State => { try { const v = localStorage.getItem(key(k)); return v ? { ...fresh(), ...JSON.parse(v) } : fresh(); } catch { return fresh(); } };

async function toExcel(kind: PlanKind, s: State, title: string) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(kind.toUpperCase());
  const head = kind === "mpdt" ? ["Element / system", "Classification", "Model author", ...s.stages, "Notes"] : ["Container name", ...CONTAINER_COLUMNS.map((c) => c.label)];
  ws.addRow([title]).font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } };
  ws.addRow([`${s.header.projectName || "[Project]"} · ${s.header.projectCode || "[Code]"} · Appointing party: ${s.header.appointingParty || "[ ]"} · Revision ${s.header.revision}${s.header.taskTeam ? ` · Task team: ${s.header.taskTeam}` : ""}`]).font = { color: { argb: "FF475569" } };
  if (kind !== "mpdt") ws.addRow([`Milestones: ${s.milestones.map((m) => `${m.code} ${m.name}${m.date ? ` (${m.date})` : ""}`).join(" · ")}`]).font = { color: { argb: "FF475569" } };
  ws.addRow([]);
  const hr = ws.addRow(head);
  hr.eachCell((c) => { c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } }; c.alignment = { vertical: "middle", wrapText: true }; });
  const body = kind === "mpdt" ? s.mpdt.map((r) => [r.element, r.classification, r.author, ...s.stages.map((st) => r.loin[st] ?? ""), r.notes]) : s.rows.map((r) => [containerName(s.header, r), ...CONTAINER_COLUMNS.map((c) => r[c.key])]);
  body.forEach((row, i) => { const xr = ws.addRow(row); xr.alignment = { vertical: "top", wrapText: true }; if (i % 2) xr.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F7FB" } }; }); });
  ws.columns.forEach((col, i) => { col.width = kind === "mpdt" ? (i === 0 ? 34 : i === head.length - 1 ? 30 : 22) : i === 0 ? 34 : CONTAINER_COLUMNS[i - 1]?.width ?? 12; });
  ws.views = [{ state: "frozen", ySplit: hr.number, xSplit: 1 }];
  ws.autoFilter = { from: { row: hr.number, column: 1 }, to: { row: hr.number, column: head.length } };
  if (kind !== "mpdt") {
    const col = (label: string) => head.indexOf(label) + 1;
    for (let r = hr.number + 1; r <= hr.number + Math.max(1, body.length) + 50; r++) {
      ws.getCell(r, col("Status")).dataValidation = { type: "list", allowBlank: true, formulae: [`"${STATUSES.join(",")}"`] };
      ws.getCell(r, col("Suitability")).dataValidation = { type: "list", allowBlank: true, formulae: [`"${SUITABILITY.join(",")}"`] };
    }
  }
  saveAs(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${s.header.projectCode || "PRJ"}-${kind.toUpperCase()}-${s.header.revision}.xlsx`);
}

function wordMarkdown(kind: PlanKind, s: State, title: string) {
  const esc = (v: string) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  const lines = [`# ${title}`, ``, `## 1 Project and plan details`, ``, `| Item | Value |`, `|---|---|`,
    ...[["Project", s.header.projectName], ["Project code", s.header.projectCode], ["Appointing party", s.header.appointingParty], ["Lead appointed party", s.header.leadAppointedParty], ...(kind === "tidp" ? [["Task team", s.header.taskTeam]] : []), ["Revision", s.header.revision], ["Prepared by", s.header.preparedBy]].map(([k, v]) => `| ${k} | ${esc(v || "[CONFIRM]")} |`), ``];
  if (kind === "mpdt") {
    lines.push(`## 2 Model production and delivery`, ``, `| Element / system | Classification | Model author | ${s.stages.join(" | ")} | Notes |`, `|${Array(s.stages.length + 4).fill("---").join("|")}|`,
      ...s.mpdt.map((r) => `| ${esc(r.element)} | ${esc(r.classification)} | ${esc(r.author)} | ${s.stages.map((st) => esc(r.loin[st] ?? "")).join(" | ")} | ${esc(r.notes)} |`));
  } else {
    lines.push(`## 2 Information delivery milestones`, ``, `| Code | Milestone | Date |`, `|---|---|---|`, ...s.milestones.map((m) => `| ${m.code} | ${esc(m.name)} | ${m.date || "[CONFIRM]"} |`), ``,
      `## 3 Information containers`, ``, `| Container name | Title | Task team | Format | LOIN | Milestone | Due | Responsible | Suitability |`, `|---|---|---|---|---|---|---|---|---|`,
      ...s.rows.map((r) => `| ${containerName(s.header, r)} | ${esc(r.title)} | ${esc(r.taskTeam)} | ${esc(r.format)} | ${esc(r.loin)} | ${r.milestone} | ${r.due || "[CONFIRM]"} | ${esc(r.responsible)} | ${r.suitability} |`));
  }
  return lines.join("\n");
}

export default function DeliveryPlans() {
  const { toast } = useSession();
  const [kind, setKind] = useState<PlanKind>(() => { try { return (localStorage.getItem("bim:plan:kind") as PlanKind) || "tidp"; } catch { return "tidp"; } });
  const [s, setS] = useState<State>(() => load(kind));
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  useEffect(() => { try { localStorage.setItem(key(kind), JSON.stringify(s)); localStorage.setItem("bim:plan:kind", kind); } catch { /* storage unavailable */ } }, [kind, s]);
  const switchKind = (k: PlanKind) => { setKind(k); setS(load(k)); setConfirmReset(false); };
  const meta = KINDS.find((k) => k.id === kind)!;
  const title = `${meta.full} (${meta.label})${kind === "tidp" && s.header.taskTeam ? ` — ${s.header.taskTeam}` : ""}`;
  const H = (k: keyof PlanHeader) => ({ value: s.header[k], onChange: (e: { target: { value: string } }) => setS({ ...s, header: { ...s.header, [k]: e.target.value } }) });
  const issues = useMemo(() => (kind === "mpdt" ? [] : checkContainers(s.header, s.rows, s.milestones)), [kind, s]);
  const rowIssues = (i: number) => issues.filter((x) => x.row === i);
  const setRow = (i: number, patch: Partial<ContainerRow>) => setS({ ...s, rows: s.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const setMpdt = (i: number, patch: Partial<MpdtRow>) => setS({ ...s, mpdt: s.mpdt.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  const starter = () => kind === "mpdt" ? setS({ ...s, mpdt: mpdtStarter(s.disciplines, s.stages) }) : setS({ ...s, rows: starterRows(kind === "tidp" ? [s.header.discipline] : s.disciplines, s.milestones, kind === "tidp" ? s.header.taskTeam : "") });
  const aiRows = async () => {
    setBusy(true);
    try {
      const r = await api<{ rows: (Partial<ContainerRow> & Partial<MpdtRow>)[] }>("/ai/tools/plan-rows", { body: { kind, projectName: s.header.projectName, projectType: s.notes.split("\n")[0] ?? "", disciplines: (kind === "tidp" ? [s.header.discipline] : s.disciplines).map((d) => DISCIPLINES[d]?.label ?? d), taskTeam: s.header.taskTeam, milestones: s.milestones.filter((m) => m.code), stages: s.stages, notes: s.notes, count: kind === "tidp" ? 20 : 40 } });
      if (kind === "mpdt") setS({ ...s, mpdt: r.rows.map((x) => ({ element: x.element ?? "", classification: x.classification ?? "", author: x.author ?? "", notes: x.notes ?? "", loin: (x.loin as Record<string, string>) ?? {} })) });
      else setS({ ...s, rows: numberRows(r.rows.map((x, i) => ({ ...emptyRow(i), ...Object.fromEntries(Object.entries(x).filter(([, v]) => v !== "")), number: "", status: "Planned", taskTeam: x.taskTeam || (kind === "tidp" ? s.header.taskTeam : ""), type: TYPE_CODES[String(x.type)] ? String(x.type) : "M3" }) as ContainerRow)) });
      toast(`${r.rows.length} rows generated — review them before issue.`);
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const importCsv = async (files: FileList | null) => {
    if (!files?.length) return;
    const labels = new Map(CONTAINER_COLUMNS.map((c) => [c.label.toLowerCase(), c.key]));
    const plans: { taskTeam: string; rows: ContainerRow[] }[] = [];
    for (const f of [...files]) {
      const grid = parseTabular((await f.text()).replace(/^﻿/, ""));
      const head = grid.findIndex((r) => r.some((c) => labels.has(c.trim().toLowerCase())));
      if (head < 0) { toast(`${f.name}: no recognised columns (use a CSV exported from this tool).`, "error"); continue; }
      const cols = grid[head].map((c) => labels.get(c.trim().toLowerCase()));
      plans.push({ taskTeam: f.name.replace(/\.[^.]+$/, ""), rows: grid.slice(head + 1).filter((r) => r.some(Boolean)).map((r, i) => ({ ...emptyRow(i), ...Object.fromEntries(cols.map((k, j) => [k, r[j] ?? ""]).filter(([k]) => k)) }) as ContainerRow) });
    }
    if (!plans.length) return;
    setS({ ...s, rows: kind === "midp" ? aggregateTidps([...(s.rows.length ? [{ taskTeam: "", rows: s.rows }] : []), ...plans]) : plans.flatMap((p) => p.rows) });
    toast(`Imported ${plans.reduce((a, p) => a + p.rows.length, 0)} rows from ${plans.length} file${plans.length > 1 ? "s" : ""}.`);
  };
  const reset = () => { const f = fresh(); setS(f); setConfirmReset(false); toast(`${meta.label} reset to a blank plan.`); };
  const csv = () => kind === "mpdt"
    ? exportCsv(`${s.header.projectCode || "PRJ"}-MPDT`, ["Element / system", "Classification", "Model author", ...s.stages, "Notes"], s.mpdt.map((r) => [r.element, r.classification, r.author, ...s.stages.map((st) => r.loin[st] ?? ""), r.notes]))
    : exportCsv(`${s.header.projectCode || "PRJ"}-${kind.toUpperCase()}`, ["Container name", ...CONTAINER_COLUMNS.map((c) => c.label)], s.rows.map((r) => [containerName(s.header, r), ...CONTAINER_COLUMNS.map((c) => r[c.key])]));
  const count = kind === "mpdt" ? s.mpdt.length : s.rows.length;
  const errors = issues.filter((x) => x.level === "error").length, warnings = issues.length - errors;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="row">{KINDS.map((k) => <button key={k.id} onClick={() => switchKind(k.id)} style={kind === k.id ? { background: k.c, color: "#fff", borderColor: k.c } : { borderColor: k.c, color: k.c }}><b>{k.label}</b> <span className="small" style={{ opacity: .85 }}>· {k.full}</span></button>)}
        <span className="small muted">{meta.clause}</span></div>

      <div className="hub-card" style={{ ...cv(meta.c), display: "grid", gap: 10 }}>
        <div className="hub-title" style={cv(meta.c)}>1. Project details</div>
        <div className="grid g4">
          <label className="small">Project name<input {...H("projectName")} placeholder="e.g. Riverside Clinic" /></label>
          <label className="small">Project code<input {...H("projectCode")} placeholder="e.g. RVC" /></label>
          <label className="small">Originator code<input {...H("originator")} placeholder="e.g. ABC" /></label>
          <label className="small">Revision<input {...H("revision")} /></label>
          <label className="small">Appointing party<input {...H("appointingParty")} /></label>
          <label className="small">Lead appointed party<input {...H("leadAppointedParty")} /></label>
          {kind === "tidp" && <label className="small">Task team<input {...H("taskTeam")} placeholder="e.g. Architecture — XYZ Architects" /></label>}
          {kind === "tidp" && <label className="small">Discipline<select value={s.header.discipline} onChange={H("discipline").onChange}>{Object.entries(DISCIPLINES).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}</select></label>}
          <label className="small">Prepared by<input {...H("preparedBy")} /></label>
        </div>
        {kind !== "tidp" && <div><span className="small muted">Disciplines / task teams</span><div className="row" style={{ marginTop: 4 }}>{Object.entries(DISCIPLINES).map(([k, d]) => <label key={k} className="row small" style={{ gap: 4, margin: 0, fontWeight: 400 }}><input type="checkbox" checked={s.disciplines.includes(k)} onChange={(e) => setS({ ...s, disciplines: e.target.checked ? [...s.disciplines, k] : s.disciplines.filter((x) => x !== k) })} />{d.label}</label>)}</div></div>}
        <label className="small">Project notes for AI (type, size, procurement, CDE, special requirements)<textarea value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} placeholder="e.g. 12,000 m² outpatient clinic, design and build, ACC as CDE, COBie at stages 4 and 6" style={{ minHeight: 50 }} /></label>
      </div>

      {kind !== "mpdt" ? <div className="hub-card" style={{ ...cv(meta.c), display: "grid", gap: 8 }}>
        <div className="hub-title" style={cv(meta.c)}>2. Information delivery milestones</div>
        <div className="table-wrap"><table className="data hub-table" style={{ maxWidth: 640 }}><thead><tr><th>Code</th><th>Milestone</th><th>Date</th><th /></tr></thead>
          <tbody>{s.milestones.map((m, i) => <tr key={i}>{(["code", "name", "date"] as const).map((f) => <td key={f}><input className="cell-input" type={f === "date" ? "date" : "text"} value={m[f]} onChange={(e) => setS({ ...s, milestones: s.milestones.map((x, j) => (j === i ? { ...x, [f]: e.target.value } : x)) })} /></td>)}<td><button className="ghost small" onClick={() => setS({ ...s, milestones: s.milestones.filter((_, j) => j !== i) })}>✕</button></td></tr>)}</tbody></table></div>
        <div><button className="small" onClick={() => setS({ ...s, milestones: [...s.milestones, { code: `M${s.milestones.length + 1}`, name: "", date: "" }] })}>+ Add milestone</button></div>
      </div> : <div className="hub-card" style={{ ...cv(meta.c), display: "grid", gap: 8 }}>
        <div className="hub-title" style={cv(meta.c)}>2. Stages (one LOIN column each)</div>
        <div className="row">{s.stages.map((st, i) => <span key={i} className="row" style={{ gap: 2 }}><input className="cell-input" value={st} style={{ width: 110 }} onChange={(e) => { const v = e.target.value; setS({ ...s, stages: s.stages.map((x, j) => (j === i ? v : x)), mpdt: s.mpdt.map((r) => ({ ...r, loin: Object.fromEntries(Object.entries(r.loin).map(([k, val]) => [k === st ? v : k, val])) })) }); }} /><button className="ghost small" onClick={() => setS({ ...s, stages: s.stages.filter((_, j) => j !== i) })}>✕</button></span>)}
          <button className="small" onClick={() => setS({ ...s, stages: [...s.stages, `Stage ${s.stages.length + 2}`] })}>+ Stage</button></div>
      </div>}

      <div className="hub-card" style={{ ...cv(meta.c), display: "grid", gap: 10 }}>
        <div className="row spread"><div className="hub-title" style={{ ...cv(meta.c), margin: 0 }}>3. {kind === "mpdt" ? "Elements and systems" : "Information containers"} · {count}</div>
          <div className="row">
            <button onClick={starter} title="Typical deliverables for the selected disciplines — no AI">Standard starter list</button>
            <button className="primary" disabled={busy} onClick={aiRows}>{busy ? "Generating… (about a minute)" : "Generate with AI"}</button>
            {kind !== "mpdt" && <label className="small" style={{ margin: 0 }}><input type="file" accept=".csv,.txt" multiple={kind === "midp"} style={{ display: "none" }} onChange={(e) => { void importCsv(e.target.files); e.target.value = ""; }} /><span className="btn">{kind === "midp" ? "Import TIDP CSVs" : "Import CSV"}</span></label>}
            <button onClick={() => kind === "mpdt" ? setS({ ...s, mpdt: [...s.mpdt, { element: "", classification: "", author: "", notes: "", loin: {} }] }) : setS({ ...s, rows: numberRows([...s.rows, emptyRow(s.rows.length, DISCIPLINES[s.header.discipline]?.role)]) })}>+ Add row</button>
            {!confirmReset ? <button className="ghost danger" onClick={() => setConfirmReset(true)}>Reset</button>
              : <span className="row hub-tile" style={{ ...cv(TONES.red), padding: "4px 8px" }}><span className="small">Clear this {meta.label} and start again?</span><button className="small" style={{ background: TONES.red, color: "#fff", borderColor: TONES.red }} onClick={reset}>Yes, reset</button><button className="ghost small" onClick={() => setConfirmReset(false)}>Cancel</button></span>}
          </div></div>
        <div className="small muted">{kind === "mpdt" ? "Who models each element, and the level of information need at each stage." : "Container names are built from project code, originator, volume, level, type, role and number (ISO 19650-2 naming). Edit any cell."}{" "}The standard starter list works without AI; "Generate with AI" uses one AI request.</div>

        {kind !== "mpdt" && s.rows.length > 0 && <div className="row">
          <button className={"chip" + (showIssues ? " on" : "")} onClick={() => setShowIssues(!showIssues)} style={{ color: errors ? "var(--danger)" : warnings ? "var(--warn)" : "var(--ok)" }}>{errors || warnings ? `${errors} errors · ${warnings} warnings` : "✓ No issues"}</button>
          <button className="small ghost" onClick={() => setS({ ...s, rows: [...s.rows].sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")) })}>Sort by due date</button>
        </div>}
        {showIssues && issues.length > 0 && <div className="hub-tile" style={{ ...cv(errors ? TONES.red : TONES.amber), maxHeight: 180, overflow: "auto" }}>{issues.map((x, i) => <div key={i} className="small"><b style={{ color: x.level === "error" ? "var(--danger)" : "var(--warn)" }}>Row {x.row + 1}</b> {x.message}</div>)}</div>}

        {count === 0 ? <div className="hub-tile" style={{ ...cv(meta.c), textAlign: "center", padding: 24 }}><b>No rows yet.</b><div className="small muted">Start with the standard starter list, generate with AI, {kind !== "mpdt" ? "import a CSV, " : ""}or add rows by hand.</div></div>
          : kind === "mpdt" ? <div className="table-wrap"><table className="data hub-table" style={{ minWidth: 900 }}>
            <thead><tr><th>Element / system</th><th>Classification</th><th>Model author</th>{s.stages.map((st) => <th key={st}>{st}</th>)}<th>Notes</th><th /></tr></thead>
            <tbody>{s.mpdt.map((r, i) => <tr key={i}>
              <td><input className="cell-input" value={r.element} onChange={(e) => setMpdt(i, { element: e.target.value })} /></td>
              <td><input className="cell-input" value={r.classification} placeholder="Uniclass code" onChange={(e) => setMpdt(i, { classification: e.target.value })} /></td>
              <td><input className="cell-input" value={r.author} onChange={(e) => setMpdt(i, { author: e.target.value })} /></td>
              {s.stages.map((st) => <td key={st}><textarea className="cell-input" value={r.loin[st] ?? ""} onChange={(e) => setMpdt(i, { loin: { ...r.loin, [st]: e.target.value } })} /></td>)}
              <td><textarea className="cell-input" value={r.notes} onChange={(e) => setMpdt(i, { notes: e.target.value })} /></td>
              <td><button className="ghost small" onClick={() => setS({ ...s, mpdt: s.mpdt.filter((_, j) => j !== i) })}>✕</button></td></tr>)}</tbody></table></div>
          : <div className="table-wrap" style={{ maxHeight: 560, overflow: "auto" }}><table className="data hub-table" style={{ minWidth: 1500 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}><tr><th>Container name</th>{CONTAINER_COLUMNS.filter((c) => kind === "midp" || c.key !== "taskTeam").map((c) => <th key={c.key} className="small">{c.label}</th>)}<th /></tr></thead>
            <tbody>{s.rows.map((r, i) => { const ri = rowIssues(i); const err = ri.some((x) => x.level === "error"); return (
              <tr key={i} style={ri.length ? { boxShadow: `inset 3px 0 0 ${err ? "var(--danger)" : "var(--warn)"}` } : undefined} title={ri.map((x) => x.message).join("\n")}>
                <td><code className="no-i18n" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{containerName(s.header, r)}</code></td>
                {CONTAINER_COLUMNS.filter((c) => kind === "midp" || c.key !== "taskTeam").map((c) => <td key={c.key}>{
                  c.key === "status" ? <select className="cell-input" value={r.status} onChange={(e) => setRow(i, { status: e.target.value })}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
                  : c.key === "suitability" ? <select className="cell-input" value={r.suitability} onChange={(e) => setRow(i, { suitability: e.target.value })}>{SUITABILITY.map((x) => <option key={x}>{x}</option>)}</select>
                  : c.key === "type" ? <select className="cell-input" value={r.type} title={TYPE_CODES[r.type]} onChange={(e) => setRow(i, { type: e.target.value })}>{Object.keys(TYPE_CODES).map((x) => <option key={x} value={x}>{x}</option>)}</select>
                  : c.key === "milestone" ? <select className="cell-input" value={r.milestone} onChange={(e) => setRow(i, { milestone: e.target.value })}><option value="">—</option>{s.milestones.map((m) => <option key={m.code} value={m.code}>{m.code}</option>)}</select>
                  : <input className="cell-input" type={c.key === "start" || c.key === "due" ? "date" : "text"} value={r[c.key]} style={{ minWidth: c.width * 6 }} onChange={(e) => setRow(i, { [c.key]: e.target.value } as Partial<ContainerRow>)} />}</td>)}
                <td><button className="ghost small" onClick={() => setS({ ...s, rows: s.rows.filter((_, j) => j !== i) })}>✕</button></td>
              </tr>); })}</tbody></table></div>}
      </div>

      {count > 0 && <div className="hub-card row spread" style={cv(meta.c)}>
        <div className="small">Export the {meta.label}: {count} rows{kind !== "mpdt" && (errors ? ` · ${errors} errors to fix first` : " · no errors")}</div>
        <div className="row">
          <button className="primary" onClick={() => toExcel(kind, s, title)}>Excel (.xlsx)</button>
          <button onClick={() => saveMarkdownDocx(wordMarkdown(kind, s, title), `${s.header.projectCode || "PRJ"}-${kind.toUpperCase()}-${s.header.revision}`, { title, project: s.header.projectName, appointingParty: s.header.appointingParty, organisation: s.header.leadAppointedParty, revision: s.header.revision, preparedBy: s.header.preparedBy })}>Word (.docx)</button>
          <button onClick={csv}>CSV</button>
        </div>
      </div>}
    </div>
  );
}
