import { useEffect, useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import type { CellValue } from "exceljs";
import { useSession } from "../../App";
import { api } from "../../lib/api";
import { saveMarkdownDocx } from "../../lib/mdDocx";
import { t } from "../../i18n";
import { parseCsv, toCsv, writeBcfZip } from "../../../../shared/bcfStudio";
import {
  agendaMarkdown, compactGroups, DEFAULT_TEAMS, DISCIPLINES, groupClashes, isClosedStatus, parseClashFile, parseCsvClashes, PRIORITIES, suggestTriage,
  toBcfTopics, toRows, totals, uniqueIds, type Clash, type ClashGroup, type GroupKind, type GroupTriage, type Priority, type TriageResult,
} from "../../../../shared/clashTriage";
import "./clash.css";

// Clash triage: load Navisworks / Solibri / Revizto clash reports, bundle clashes into root-cause groups,
// triage them (rules of thumb or AI) and export BCF, Excel, CSV and a meeting agenda. Reports stay in the browser.

const AI_MAX = 200;
type Loaded = { name: string; clashes: Clash[] };
const KIND_LABEL: Record<GroupKind, string> = { duplicate: "Duplicate", cluster: "Cluster", pair: "Category pair" };

function cellText(v: CellValue): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("text" in v) return String(v.text);
    if ("result" in v) return cellText((v.result ?? "") as CellValue);
    if ("error" in v) return "";
  }
  return String(v);
}

/** Every worksheet of an Excel clash report as rows (several tests are often one sheet each). */
async function readSheets(buf: ArrayBuffer): Promise<{ name: string; rows: string[][] }[]> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  return wb.worksheets.map((ws) => {
    const rows: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const out: string[] = [];
      for (let c = 1; c <= ws.columnCount; c++) out.push(cellText(row.getCell(c).value).trim());
      rows.push(out);
    });
    return { name: ws.name, rows };
  });
}

async function exportXlsx(rows: { groups: string[][]; clashes: string[][] }, name: string) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Clash Triage";
  const sheet = (title: string, data: string[][], widths: number[]) => {
    const ws = wb.addWorksheet(title);
    ws.columns = data[0].map((h, i) => ({ header: h, key: String(i), width: widths[i] ?? 16 }));
    data.slice(1).forEach((r) => ws.addRow(r));
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    for (let c = 1; c <= data[0].length; c++) head.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: data[0].length } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };
  sheet("Groups", rows.groups, [12, 12, 50, 9, 20, 20, 30, 14, 30, 12, 10, 14, 10, 50, 50]);
  sheet("Clashes", rows.clashes, [12, 24, 16, 10, 12, 14, 12, 9, 9, 9, 30, 20, 14, 30, 26, 12, 30, 20, 14, 30, 26, 12, 24]);
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${name}.xlsx`);
}

/** Navisworks can write UTF-16 reports; honour a BOM, default to UTF-8. */
function decode(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf.slice(0, 2));
  const enc = b[0] === 0xff && b[1] === 0xfe ? "utf-16le" : b[0] === 0xfe && b[1] === 0xff ? "utf-16be" : "utf-8";
  return new TextDecoder(enc).decode(buf).replace(/^﻿/, "");
}

const mm = (m: number | null) => (m === null ? "—" : `${Math.round(m * 1000)}`);
const today = () => new Date().toISOString().slice(0, 10);

function useAiEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  return enabled;
}

function Totals({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="clash-total">
      <b className="small">{title}</b>
      <table className="data">
        <tbody>
          {rows.slice(0, 12).map(([k, n]) => <tr key={k}><td className="no-i18n">{k}</td><td className="clash-num">{n}</td></tr>)}
          {rows.length > 12 && <tr><td className="muted">{t("Others")}</td><td className="clash-num">{rows.slice(12).reduce((s, r) => s + r[1], 0)}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function ClashTriage() {
  const { toast } = useSession();
  const aiOn = useAiEnabled();
  const [files, setFiles] = useState<Loaded[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [distance, setDistance] = useState(1.5);
  const [dupes, setDupes] = useState(true);
  const [teams, setTeams] = useState<string[]>(DEFAULT_TEAMS);
  const [teamInput, setTeamInput] = useState("");
  const [stage, setStage] = useState("");
  const [tolerances, setTolerances] = useState("");
  const [triage, setTriage] = useState<Record<string, GroupTriage>>({});
  const [ai, setAi] = useState<Pick<TriageResult, "summary" | "patterns"> | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [fPriority, setFPriority] = useState("");
  const [fTeam, setFTeam] = useState("\u0000");
  const [fKind, setFKind] = useState("");
  const [fLevel, setFLevel] = useState("\u0000");
  const [fFp, setFFp] = useState<"" | "hide" | "only">("");
  const input = useRef<HTMLInputElement>(null);

  const all = useMemo(() => uniqueIds(files.flatMap((f) => f.clashes)), [files]);
  const clashes = useMemo(() => (includeClosed ? all : all.filter((c) => !isClosedStatus(c.status))), [all, includeClosed]);
  const sums = useMemo(() => totals(clashes), [clashes]);
  const closedCount = all.length - all.filter((c) => !isClosedStatus(c.status)).length;
  const groups = useMemo(() => groupClashes(clashes, { clusterDistance: distance, duplicates: dupes }), [clashes, distance, dupes]);
  const byId = useMemo(() => new Map(clashes.map((c) => [c.id, c])), [clashes]);
  const levels = useMemo(() => [...new Set(groups.flatMap((g) => g.levels))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [groups]);
  const triaged = groups.filter((g) => triage[g.key]).length;

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return groups.filter((g) => {
      const tr = triage[g.key];
      if (fPriority && (tr?.priority ?? "") !== fPriority) return false;
      if (fTeam !== "\u0000" && (tr?.responsible ?? "") !== fTeam) return false;
      if (fKind && g.kind !== fKind) return false;
      if (fLevel !== "\u0000" && !(fLevel === "" ? g.levels.length === 0 : g.levels.includes(fLevel))) return false;
      if (fFp === "hide" && tr?.falsePositive) return false;
      if (fFp === "only" && !tr?.falsePositive) return false;
      if (needle && ![g.label, g.key, ...g.categories, ...g.grids, ...g.tests, tr?.rootCause ?? "", tr?.action ?? ""].join(" ").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [groups, triage, q, fPriority, fTeam, fKind, fLevel, fFp]);
  const filtersOn = !!(q || fPriority || fTeam !== "\u0000" || fKind || fLevel !== "\u0000" || fFp);
  const clearFilters = () => { setQ(""); setFPriority(""); setFTeam("\u0000"); setFKind(""); setFLevel("\u0000"); setFFp(""); };

  const load = async (list: FileList | File[]) => {
    setBusy(true);
    const added: Loaded[] = [];
    for (const f of Array.from(list)) {
      try {
        let cs: Clash[] = [];
        if (/\.xlsx$/i.test(f.name)) {
          for (const s of await readSheets(await f.arrayBuffer())) cs.push(...parseCsvClashes(s.rows, s.name, f.name));
        } else if (/\.(xml|html?|csv|tsv|txt)$/i.test(f.name)) {
          cs = parseClashFile(f.name, decode(await f.arrayBuffer()), parseCsv);
        } else { toast(`${f.name}: ${t("unsupported file type")}`, "error"); continue; }
        if (!cs.length) { toast(`${f.name}: ${t("no clashes found")}`, "error"); continue; }
        added.push({ name: f.name, clashes: cs.map((c) => ({ ...c, id: `${f.name}|${c.id}`, source: f.name })) });
        toast(`${f.name}: ${cs.length} ${t("clashes loaded")}`);
      } catch (e) { toast(`${t("Could not read the file")} ${f.name}: ${(e as Error).message}`, "error"); }
    }
    setFiles((prev) => [...prev.filter((p) => !added.some((a) => a.name === p.name)), ...added]);
    setBusy(false);
  };

  const addTeam = () => {
    const v = teamInput.trim().slice(0, 40);
    if (v && !teams.some((x) => x.toLowerCase() === v.toLowerCase())) setTeams([...teams, v]);
    setTeamInput("");
  };
  const setOne = (g: ClashGroup, patch: Partial<GroupTriage>) =>
    setTriage((m) => ({ ...m, [g.key]: { ...(m[g.key] ?? { key: g.key, rootCause: "", responsible: "", priority: "Normal" as Priority, falsePositive: false, action: "" }), ...patch } }));
  const suggestAll = () => {
    setTriage((m) => { const n = { ...m }; for (const g of groups) if (!n[g.key]) n[g.key] = suggestTriage(g, teams); return n; });
    toast(t("Rule-of-thumb suggestions added to untriaged groups"));
  };

  const runAi = async () => {
    setAiBusy(true);
    try {
      const res = await api<TriageResult>("/ai/tools/clash-triage", { body: { groups: compactGroups(groups, AI_MAX), teams, stage: stage.trim() || undefined, tolerances: tolerances.trim() || undefined } });
      setTriage((m) => { const n = { ...m }; for (const g of res.groups) n[g.key] = g; return n; });
      setAi({ summary: res.summary, patterns: res.patterns });
      toast(`${res.groups.length} ${t("groups triaged")}`);
    } catch (e) { toast((e as Error).message, "error"); } finally { setAiBusy(false); }
  };

  const base = `clash-triage-${today()}`;
  const exportSet = () => shown;
  const exportBcf = async () => {
    setBusy(true);
    try {
      const blob = await writeBcfZip(toBcfTopics(exportSet(), triage, clashes, { author: "Clash Triage" }), { output: "blob", project: "Clash triage" });
      saveAs(blob as Blob, `${base}.bcfzip`);
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const exportExcel = async () => {
    const set = exportSet(); const ids = new Set(set.flatMap((g) => g.clashIds));
    setBusy(true);
    try { await exportXlsx(toRows(set, triage, clashes.filter((c) => ids.has(c.id))), base); } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const exportCsvFile = () => saveAs(new Blob(["﻿" + toCsv(toRows(exportSet(), triage, []).groups)], { type: "text/csv;charset=utf-8" }), `${base}-groups.csv`);
  const exportAgenda = async () => {
    setBusy(true);
    try {
      const md = agendaMarkdown(exportSet(), triage, { title: "Clash coordination meeting", summary: ai?.summary, patterns: ai?.patterns });
      await saveMarkdownDocx(md, `${base}-agenda`, { title: "Clash coordination meeting" });
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };

  return (
    <div className="clash-triage">
      <div
        className={"card dropzone dashed clash-drop" + (drag ? " drag" : "")}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) load(e.dataTransfer.files); }}
      >
        <b>Drop clash reports here (.xml, .html, .csv, .xlsx)</b>
        <div className="row">
          <button className="primary" disabled={busy} onClick={() => input.current?.click()}>Open clash reports</button>
          {files.length > 0 && <button className="ghost" onClick={() => { if (window.confirm(t("Clear all loaded reports?"))) { setFiles([]); setTriage({}); setAi(null); } }}>Clear session</button>}
        </div>
        <input ref={input} type="file" accept=".xml,.html,.htm,.csv,.tsv,.txt,.xlsx" multiple onChange={(e) => { if (e.target.files?.length) load(e.target.files); e.target.value = ""; }} />
        <div className="small muted">Reads Navisworks Clash Detective XML and HTML (tabular) reports, and CSV or Excel exports from Navisworks, Solibri, Revizto or BIMcollab. Load several reports to find duplicates across tests.</div>
        <div className="small muted">Files stay in your browser. Only grouped summaries (no files, no geometry) are sent to the AI when you ask for a triage.</div>
        {busy && <div className="small">Working…</div>}
      </div>

      {files.length === 0 ? (
        <div className="card muted small">Open a clash report to start.</div>
      ) : (
        <>
          <div className="card clash-panel">
            <div className="row spread">
              <div className="row small">
                {files.map((f) => (
                  <span key={f.name} className="badge clash-file">
                    <span className="no-i18n">{f.name}</span> · {f.clashes.length}
                    <button className="clash-x" aria-label={t("Remove")} title={t("Remove")} onClick={() => setFiles((p) => p.filter((x) => x.name !== f.name))}>×</button>
                  </span>
                ))}
              </div>
              <label className="row small clash-inline">
                <input type="checkbox" checked={includeClosed} onChange={(e) => setIncludeClosed(e.target.checked)} />
                <span>Include approved and resolved clashes</span> <span className="muted">({closedCount})</span>
              </label>
            </div>
            <div className="clash-kpis">
              <div><b>{sums.total}</b><span className="small muted">clashes</span></div>
              <div><b>{groups.length}</b><span className="small muted">groups</span></div>
              <div><b>{groups.filter((g) => g.kind === "duplicate").reduce((s, g) => s + g.count, 0)}</b><span className="small muted">in duplicate pairs</span></div>
              <div><b>{triaged}</b><span className="small muted">groups triaged</span></div>
            </div>
            <div className="clash-totals">
              <Totals title={t("By test")} rows={sums.byTest} />
              <Totals title={t("By status")} rows={sums.byStatus} />
              <Totals title={t("By level")} rows={sums.byLevel} />
            </div>
          </div>

          <div className="card clash-panel">
            <b>Grouping</b>
            <div className="clash-settings">
              <label className="clash-field">
                <span className="small">Cluster distance: <b>{distance.toFixed(2)} m</b></span>
                <input type="range" min={0} max={5} step={0.25} value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
                <span className="small muted">Clashes on the same level and category pair whose points chain within this distance form one cluster. 0 turns clustering off.</span>
              </label>
              <label className="row small clash-inline">
                <input type="checkbox" checked={dupes} onChange={(e) => setDupes(e.target.checked)} />
                <span>Group the same element pair reported more than once</span>
              </label>
            </div>
            <b>Triage</b>
            <div className="clash-settings">
              <div className="clash-field">
                <span className="small">Task teams</span>
                <div className="clash-chips">
                  {teams.map((x) => (
                    <span key={x} className="chip clash-chip"><span className="no-i18n">{x}</span>
                      <button className="clash-x" aria-label={t("Remove")} onClick={() => setTeams(teams.filter((y) => y !== x))}>×</button></span>
                  ))}
                  <input value={teamInput} placeholder={t("Add team…")} onChange={(e) => setTeamInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTeam(); } }} />
                  <button className="small" onClick={addTeam} disabled={!teamInput.trim()}>Add</button>
                  <button className="small ghost" onClick={() => setTeams(DEFAULT_TEAMS)}>Reset</button>
                </div>
              </div>
              <label className="clash-field"><span className="small">Stage (optional)</span>
                <input value={stage} maxLength={80} placeholder={t("e.g. RIBA 4 technical design")} onChange={(e) => setStage(e.target.value)} /></label>
              <label className="clash-field"><span className="small">Tolerances and test settings (optional)</span>
                <input value={tolerances} maxLength={1000} placeholder={t("e.g. hard 10 mm; services clearance 50 mm; insulation excluded")} onChange={(e) => setTolerances(e.target.value)} /></label>
            </div>
            <div className="row">
              <button className="primary" disabled={!aiOn || aiBusy || groups.length === 0} onClick={runAi}
                title={aiOn === false ? t("AI isn't switched on yet. Ask your platform administrator to add a Claude API key to the server.") : undefined}>
                {aiBusy ? t("Triaging…") : t("Triage with AI")}
              </button>
              <button className="ghost" disabled={groups.length === 0} onClick={suggestAll}>Fill rule-of-thumb suggestions</button>
              {Object.keys(triage).length > 0 && <button className="ghost" onClick={() => { if (window.confirm(t("Clear all triage answers?"))) { setTriage({}); setAi(null); } }}>Clear triage</button>}
            </div>
            {aiOn === false && <div className="small muted">AI isn't switched on yet. Grouping, manual triage and every export still work without it.</div>}
            {groups.length > AI_MAX && <div className="small muted">{t("Only the largest groups are sent to the AI:")} {AI_MAX} / {groups.length}</div>}
          </div>

          {ai && (ai.summary || ai.patterns.length > 0) && (
            <div className="card clash-panel clash-ai">
              <b>AI summary</b>
              {ai.summary && <p className="no-i18n">{ai.summary}</p>}
              {ai.patterns.length > 0 && <><b className="small">Recurring patterns to raise at the coordination meeting</b>
                <ul className="no-i18n">{ai.patterns.map((p, i) => <li key={i}>{p}</li>)}</ul></>}
              <div className="small muted">AI suggestions are decision support. Check them before they go into the BCF file or the meeting agenda.</div>
            </div>
          )}

          <div className="card clash-panel">
            <div className="row spread">
              <div className="clash-filters">
                <input type="search" placeholder={t("Search groups, categories, grids, root causes…")} value={q} onChange={(e) => setQ(e.target.value)} />
                <select value={fKind} onChange={(e) => setFKind(e.target.value)}>
                  <option value="">{t("All group types")}</option>
                  {(Object.keys(KIND_LABEL) as GroupKind[]).map((k) => <option key={k} value={k}>{t(KIND_LABEL[k])}</option>)}
                </select>
                <select value={fPriority} onChange={(e) => setFPriority(e.target.value)}>
                  <option value="">{t("All priorities")}</option>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
                </select>
                <select value={fTeam} onChange={(e) => setFTeam(e.target.value)}>
                  <option value={"\u0000"}>{t("All teams")}</option>
                  <option value="">{t("Unassigned")}</option>
                  {teams.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <select value={fLevel} onChange={(e) => setFLevel(e.target.value)}>
                  <option value={"\u0000"}>{t("All levels")}</option>
                  <option value="">{t("No level")}</option>
                  {levels.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <select value={fFp} onChange={(e) => setFFp(e.target.value as "" | "hide" | "only")}>
                  <option value="">{t("Include false positives")}</option>
                  <option value="hide">{t("Hide false positives")}</option>
                  <option value="only">{t("Only false positives")}</option>
                </select>
                {filtersOn && <button className="small ghost" onClick={clearFilters}>Clear filters</button>}
              </div>
              <div className="row">
                <span className="small muted">{shown.length} / {groups.length}</span>
                <button className="small" disabled={busy || !shown.length} onClick={exportBcf} title={t("One BCF topic per shown group, with every clash GUID as a component")}>Export BCF 2.1</button>
                <button className="small" disabled={busy || !shown.length} onClick={exportExcel}>Export Excel</button>
                <button className="small" disabled={busy || !shown.length} onClick={exportCsvFile}>Export CSV</button>
                <button className="small" disabled={busy || !shown.length} onClick={exportAgenda}>Meeting agenda (Word)</button>
              </div>
            </div>

            <div className="clash-table-wrap">
              <table className="data clash-table">
                <thead>
                  <tr>
                    <th>Group</th><th className="clash-num">Clashes</th><th className="clash-num">Max mm</th><th>Disciplines</th>
                    <th>Priority</th><th>Responsible</th><th>False positive</th><th>Root cause</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((g) => {
                    const tr = triage[g.key];
                    const isOpen = open === g.key;
                    return [
                      <tr key={g.key} className={"clash-row" + (tr?.falsePositive ? " fp" : "") + (tr ? " p-" + tr.priority.toLowerCase() : "")}>
                        <td>
                          <button className="clash-expand" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : g.key)}>{isOpen ? "▾" : "▸"}</button>
                          <span className={"chip clash-kind k-" + g.kind}>{t(KIND_LABEL[g.kind])}</span>
                          <div className="no-i18n clash-label">{g.label}</div>
                          <div className="small muted no-i18n">{[g.levels.join(", "), g.grids.slice(0, 4).join(", ") + (g.grids.length > 4 ? "…" : "")].filter(Boolean).join(" · ")}</div>
                        </td>
                        <td className="clash-num">{g.count}</td>
                        <td className="clash-num">{mm(g.maxPenetration)}</td>
                        <td className="no-i18n">{g.disciplines.map((d) => <span key={d} className="chip" title={t(DISCIPLINES[d] ?? d)}>{d}</span>)}</td>
                        <td>
                          <select value={tr?.priority ?? ""} onChange={(e) => setOne(g, { priority: (e.target.value || "Normal") as Priority })}>
                            {!tr && <option value="">—</option>}
                            {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
                          </select>
                        </td>
                        <td>
                          <select value={tr?.responsible ?? ""} onChange={(e) => setOne(g, { responsible: e.target.value })}>
                            <option value="">—</option>
                            {[...new Set([...teams, ...(tr?.responsible && !teams.includes(tr.responsible) ? [tr.responsible] : [])])].map((x) => <option key={x} value={x}>{x}</option>)}
                          </select>
                        </td>
                        <td className="center-cell"><input type="checkbox" aria-label={t("False positive")} checked={!!tr?.falsePositive} onChange={(e) => setOne(g, { falsePositive: e.target.checked })} /></td>
                        <td><textarea className="no-i18n" rows={2} value={tr?.rootCause ?? ""} maxLength={400} placeholder={t("Root cause…")} onChange={(e) => setOne(g, { rootCause: e.target.value })} /></td>
                        <td><textarea className="no-i18n" rows={2} value={tr?.action ?? ""} maxLength={500} placeholder={t("Action…")} onChange={(e) => setOne(g, { action: e.target.value })} /></td>
                      </tr>,
                      isOpen && (
                        <tr key={g.key + ":d"} className="clash-detail">
                          <td colSpan={9}>
                            <table className="data">
                              <thead><tr><th>Test</th><th>Clash</th><th>Status</th><th className="clash-num">mm</th><th>Level</th><th>Grid</th><th>Item 1</th><th>Item 2</th><th>GUID</th></tr></thead>
                              <tbody className="no-i18n">
                                {g.clashIds.slice(0, 100).map((id) => byId.get(id)).filter((c): c is Clash => !!c).map((c) => (
                                  <tr key={c.id}>
                                    <td>{c.test}</td><td>{c.name}</td><td>{c.status}</td><td className="clash-num">{c.distance === null ? "" : Math.round(c.distance * 1000)}</td>
                                    <td>{c.level}</td><td>{c.grid}</td>
                                    <td>{c.itemA.name || c.itemA.elementId}<div className="small muted">{c.itemA.category}</div></td>
                                    <td>{c.itemB.name || c.itemB.elementId}<div className="small muted">{c.itemB.category}</div></td>
                                    <td className="clash-guid">{[c.itemA.guid, c.itemB.guid].filter(Boolean).join(" ")}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {g.clashIds.length > 100 && <div className="small muted">{t("Showing the first 100 clashes of")} {g.clashIds.length}</div>}
                          </td>
                        </tr>
                      ),
                    ];
                  })}
                  {shown.length === 0 && <tr><td colSpan={9} className="muted">No groups match the filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
