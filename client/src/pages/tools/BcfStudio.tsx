import { useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import type { CellValue } from "exceljs";
import { useSession } from "../../App";
import { t } from "../../i18n";
import type { BcfTopic } from "../../../../shared/bcf";
import { isClosed, isOverdue, newGuid, parseCsv, readBcfZip, ROW_HEADER, rowsToTopics, summarise, toCsv, topicsToRows, writeBcfZip, type StudioTopic } from "../../../../shared/bcfStudio";
import "./bcf.css";

// BCF Studio: open, review, edit and convert BCF issue files entirely in the browser (nothing is uploaded).

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITIES = ["Critical", "High", "Normal", "Low"];
type StateFilter = "" | "open" | "closed" | "overdue";

const today = () => new Date().toISOString().slice(0, 10);
const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b));
const fmtDate = (s: string) => (s ? s.slice(0, 10) : "");
const fmtDateTime = (s: string) => (s ? s.replace("T", " ").slice(0, 16) : "");

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

async function readSheetRows(buf: ArrayBuffer): Promise<string[][]> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  // the sheet with the most rows is usually the issue list (skips cover / instruction sheets)
  const ws = [...wb.worksheets].sort((a, b) => b.actualRowCount - a.actualRowCount)[0];
  if (!ws) return [];
  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const out: string[] = [];
    for (let c = 1; c <= ws.columnCount; c++) out.push(cellText(row.getCell(c).value).trim());
    rows.push(out);
  });
  return rows;
}

/** Use the first row (among the first 10) that looks like a header with a title column. */
function splitHeader(rows: string[][]): { header: string[]; body: string[][] } {
  const looks = (r: string[]) => r.some((c) => /^(title|name|issue|issue ?name|subject|summary|topic)$/i.test(c.trim()));
  const i = Math.max(0, rows.slice(0, 10).findIndex(looks));
  return { header: rows[i] ?? [], body: rows.slice(i + 1) };
}

async function exportXlsx(topics: BcfTopic[], name: string) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "BCF Studio";
  const ws = wb.addWorksheet("Issues");
  const widths = [38, 40, 14, 12, 12, 24, 12, 24, 20, 24, 50, 10, 40, 40];
  ws.columns = ROW_HEADER.map((h, i) => ({ header: h, key: h, width: widths[i] ?? 16 }));
  topicsToRows(topics).forEach((r) => ws.addRow(r));
  const style = (sheet: typeof ws, cols: number) => {
    const head = sheet.getRow(1);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.alignment = { vertical: "middle" };
    for (let c = 1; c <= cols; c++) head.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols } };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  };
  style(ws, ROW_HEADER.length);
  const cs = wb.addWorksheet("Comments");
  cs.columns = [{ header: "Issue Guid", width: 38 }, { header: "Issue title", width: 40 }, { header: "Date", width: 20 }, { header: "Author", width: 24 }, { header: "Comment", width: 70 }];
  for (const tp of topics) for (const c of tp.comments) cs.addRow([tp.guid, tp.title, c.date, c.author, c.text]);
  style(cs, 5);
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${name}.xlsx`);
}

export default function BcfStudio() {
  const { user, toast } = useSession();
  const [topics, setTopics] = useState<StudioTopic[]>([]);
  const [source, setSource] = useState<{ name: string; version: string; project?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [q, setQ] = useState("");
  const [fState, setFState] = useState<StateFilter>("");
  const [fStatus, setFStatus] = useState<string | null>(null);
  const [fPriority, setFPriority] = useState<string | null>(null);
  const [fAssignee, setFAssignee] = useState<string | null>(null);
  const [fLabel, setFLabel] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const bcfInput = useRef<HTMLInputElement>(null);
  const listInput = useRef<HTMLInputElement>(null);

  const now = today();
  const summary = useMemo(() => summarise(topics, now), [topics, now]);
  const statuses = uniq([...STATUSES, ...topics.map((x) => x.status)]);
  const priorities = uniq([...PRIORITIES, ...topics.map((x) => x.priority)]);
  const assignees = uniq(topics.map((x) => x.assignedTo));
  const labels = uniq(topics.flatMap((x) => x.labels));

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return topics.filter((x) => {
      if (fState === "open" && isClosed(x.status)) return false;
      if (fState === "closed" && !isClosed(x.status)) return false;
      if (fState === "overdue" && !isOverdue(x, now)) return false;
      if (fStatus !== null && x.status !== fStatus) return false;
      if (fPriority !== null && x.priority !== fPriority) return false;
      if (fAssignee !== null && x.assignedTo !== fAssignee) return false;
      if (fLabel !== null && !x.labels.includes(fLabel)) return false;
      if (!term) return true;
      return [x.title, x.description, x.guid, x.assignedTo, x.creationAuthor, x.labels.join(" "), x.components.join(" "), ...x.comments.map((c) => c.text)].join(" ").toLowerCase().includes(term);
    });
  }, [topics, q, fState, fStatus, fPriority, fAssignee, fLabel, now]);

  const current = topics.find((x) => x.guid === active) ?? null;
  const baseName = (source?.name ?? "issues").replace(/\.(bcfzip|bcf|zip|xlsx|csv|tsv|txt)$/i, "") || "issues";
  const filtersOn = !!(q || fState || fStatus !== null || fPriority !== null || fAssignee !== null || fLabel !== null);

  const merge = (incoming: StudioTopic[]) => setTopics((prev) => {
    const byGuid = new Map(prev.map((x) => [x.guid, x]));
    for (const x of incoming) byGuid.set(x.guid, x);
    return [...byGuid.values()];
  });
  const update = (guid: string, patch: Partial<StudioTopic>) => setTopics((prev) => prev.map((x) => (x.guid === guid ? { ...x, ...patch } : x)));
  const updateMany = (guids: Set<string>, patch: Partial<StudioTopic>) => setTopics((prev) => prev.map((x) => (guids.has(x.guid) ? { ...x, ...patch } : x)));
  const remove = (guids: Set<string>) => {
    setTopics((prev) => prev.filter((x) => !guids.has(x.guid)));
    setSelected(new Set());
    if (active && guids.has(active)) setActive(null);
  };

  async function openFiles(files: FileList | File[]) {
    setBusy(true);
    try {
      for (const f of [...files]) {
        const lower = f.name.toLowerCase();
        if (/\.(bcf|bcfzip|zip)$/.test(lower)) {
          const res = await readBcfZip(await f.arrayBuffer(), { snapshots: true });
          merge(res.topics);
          setSource({ name: f.name, version: res.version, project: res.project });
          toast(`${f.name}: ${res.topics.length} ${t("issues loaded")}`);
        } else if (/\.(xlsx|csv|tsv|txt)$/.test(lower)) {
          const rows = lower.endsWith(".xlsx") ? await readSheetRows(await f.arrayBuffer()) : parseCsv(await f.text());
          const { header, body } = splitHeader(rows);
          const list = rowsToTopics(body, header).map((x) => ({ ...x, creationAuthor: x.creationAuthor || user.name || user.email, viewpointCount: 0 }));
          if (!list.length) { toast(t("No issues found in the sheet."), "error"); continue; }
          merge(list);
          setSource((s) => s ?? { name: f.name, version: "", project: undefined });
          toast(`${f.name}: ${list.length} ${t("issues loaded")}`);
        } else toast(`${f.name}: ${t("unsupported file type")}`, "error");
      }
    } catch (e) {
      toast(`${t("Could not read the file")}: ${(e as Error).message}`, "error");
    } finally { setBusy(false); }
  }

  const addIssue = () => {
    const guid = newGuid();
    setTopics((prev) => [{ guid, type: "Issue", status: "Open", title: t("New issue"), priority: "Normal", description: "", labels: [], creationDate: new Date().toISOString(),
      creationAuthor: user.name || user.email, assignedTo: "", dueDate: "", components: [], comments: [], viewpointCount: 0 }, ...prev]);
    setActive(guid);
  };
  const addComment = () => {
    if (!current || !comment.trim()) return;
    update(current.guid, { comments: [...current.comments, { guid: newGuid(), date: new Date().toISOString(), author: user.name || user.email, text: comment.trim() }] });
    setComment("");
  };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast(t("Copied")); } catch { toast(t("Copy failed"), "error"); } };
  const clearFilters = () => { setQ(""); setFState(""); setFStatus(null); setFPriority(null); setFAssignee(null); setFLabel(null); };
  const toggle = <T,>(cur: T | null, v: T, set: (x: T | null) => void) => set(cur === v ? null : v);
  const exportSet = () => (selected.size ? topics.filter((x) => selected.has(x.guid)) : shown);

  async function exportBcf() {
    setBusy(true);
    try {
      const blob = await writeBcfZip(exportSet(), { version: "2.1", output: "blob", project: source?.project });
      saveAs(blob as Blob, `${baseName}.bcfzip`);
    } finally { setBusy(false); }
  }
  async function exportExcel() { setBusy(true); try { await exportXlsx(exportSet(), baseName); } finally { setBusy(false); } }
  const exportCsvFile = () => saveAs(new Blob(["﻿" + toCsv([ROW_HEADER, ...topicsToRows(exportSet())])], { type: "text/csv;charset=utf-8" }), `${baseName}.csv`);

  const allShownSelected = shown.length > 0 && shown.every((x) => selected.has(x.guid));
  const toggleAll = () => setSelected(allShownSelected ? new Set() : new Set(shown.map((x) => x.guid)));
  const toggleOne = (g: string) => setSelected((s) => { const n = new Set(s); if (n.has(g)) n.delete(g); else n.add(g); return n; });

  return (
    <div className="bcf-studio">
      <div
        className={"card dropzone dashed bcf-drop" + (drag ? " drag" : "")}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) openFiles(e.dataTransfer.files); }}
      >
        <b>Drop BCF files (.bcf, .bcfzip) or an Excel/CSV issue list here</b>
        <div className="row">
          <button className="primary" disabled={busy} onClick={() => bcfInput.current?.click()}>Open BCF file</button>
          <button className="ghost" disabled={busy} onClick={() => listInput.current?.click()}>Import Excel/CSV issue list</button>
          <button className="ghost" disabled={busy} onClick={addIssue}>Add issue</button>
        </div>
        <input ref={bcfInput} type="file" accept=".bcf,.bcfzip,.zip" multiple onChange={(e) => { if (e.target.files?.length) openFiles(e.target.files); e.target.value = ""; }} />
        <input ref={listInput} type="file" accept=".xlsx,.csv,.tsv,.txt" onChange={(e) => { if (e.target.files?.length) openFiles(e.target.files); e.target.value = ""; }} />
        <div className="small muted">Reads BCF 2.0, 2.1 and 3.0 from Navisworks, Revizto, BIMcollab, Solibri, ACC and Revit plugins. Exports BCF 2.1.</div>
        <div className="small muted">Everything stays in your browser. Files are never uploaded, and the session is cleared when you leave this page.</div>
        {busy && <div className="small">Working…</div>}
      </div>

      {topics.length === 0 ? (
        <div className="card muted small">Open a BCF file to start, or build one from an Excel/CSV issue list.</div>
      ) : (
        <>
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <div className="row spread">
              <div className="row small">
                {source && <span className="badge no-i18n">{source.name}</span>}
                {source?.version && <span className="badge">BCF {source.version}</span>}
                {source?.project && <span className="badge no-i18n">{source.project}</span>}
                <span className="muted">{shown.length} / {topics.length}</span>
              </div>
              <div className="row">
                <button className="small" disabled={busy} onClick={exportBcf} title={t("Exports the selected issues, or all shown issues when none are selected")}>Export BCF 2.1</button>
                <button className="small" disabled={busy} onClick={exportExcel}>Export Excel</button>
                <button className="small" disabled={busy} onClick={exportCsvFile}>Export CSV</button>
                <button className="small ghost" onClick={() => { if (window.confirm(t("Clear all issues from this session?"))) { setTopics([]); setSource(null); setSelected(new Set()); setActive(null); } }}>Clear session</button>
              </div>
            </div>

            <div className="bcf-chips">
              <span className="bcf-chip-group">Status</span>
              <button className={"chip" + (fState === "open" ? " on" : "")} onClick={() => setFState(fState === "open" ? "" : "open")}><span>Open</span> · {summary.open}</button>
              <button className={"chip" + (fState === "closed" ? " on" : "")} onClick={() => setFState(fState === "closed" ? "" : "closed")}><span>Closed</span> · {summary.closed}</button>
              <button className={"chip bcf-chip-over" + (fState === "overdue" ? " on" : "")} onClick={() => setFState(fState === "overdue" ? "" : "overdue")}><span>Overdue</span> · {summary.overdue}</button>
              <span className="bcf-chip-group">Priority</span>
              {Object.entries(summary.byPriority).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
                <button key={"p" + k} className={"chip" + (fPriority === k ? " on" : "")} onClick={() => toggle(fPriority, k, setFPriority)}>{k || t("No priority")} · {n}</button>
              ))}
              <span className="bcf-chip-group">Assignee</span>
              {Object.entries(summary.byAssignee).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => (
                <button key={"a" + k} className={"chip" + (fAssignee === k ? " on" : "")} onClick={() => toggle(fAssignee, k, setFAssignee)}>{k || t("Unassigned")} · {n}</button>
              ))}
            </div>

            <div className="bcf-filters">
              <input type="search" placeholder={t("Search title, description, GUID, comments…")} value={q} onChange={(e) => setQ(e.target.value)} />
              <select value={fStatus ?? "\u0000"} onChange={(e) => setFStatus(e.target.value === "\u0000" ? null : e.target.value)}>
                <option value={"\u0000"}>{t("All statuses")}</option>
                {Object.keys(summary.byStatus).sort().map((s) => <option key={s} value={s}>{s} ({summary.byStatus[s]})</option>)}
              </select>
              <select value={fPriority ?? "\u0000"} onChange={(e) => setFPriority(e.target.value === "\u0000" ? null : e.target.value)}>
                <option value={"\u0000"}>{t("All priorities")}</option>
                {Object.keys(summary.byPriority).sort().map((s) => <option key={s} value={s}>{s || t("No priority")} ({summary.byPriority[s]})</option>)}
              </select>
              <select value={fAssignee ?? "\u0000"} onChange={(e) => setFAssignee(e.target.value === "\u0000" ? null : e.target.value)}>
                <option value={"\u0000"}>{t("All assignees")}</option>
                {Object.keys(summary.byAssignee).sort().map((s) => <option key={s} value={s}>{s || t("Unassigned")} ({summary.byAssignee[s]})</option>)}
              </select>
              {labels.length > 0 && (
                <select value={fLabel ?? "\u0000"} onChange={(e) => setFLabel(e.target.value === "\u0000" ? null : e.target.value)}>
                  <option value={"\u0000"}>{t("All labels")}</option>
                  {labels.map((s) => <option key={s} value={s}>{s} ({summary.byLabel[s]})</option>)}
                </select>
              )}
              {filtersOn && <button className="small ghost" onClick={clearFilters}>Clear filters</button>}
            </div>
          </div>

          {selected.size > 0 && (
            <div className="card bcf-bulk">
              <b>{selected.size}</b><span>selected</span>
              <select value="" onChange={(e) => e.target.value && updateMany(selected, { status: e.target.value })}>
                <option value="">{t("Set status…")}</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value="" onChange={(e) => e.target.value && updateMany(selected, { priority: e.target.value })}>
                <option value="">{t("Set priority…")}</option>
                {priorities.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input list="bcf-assignees" placeholder={t("Assign to…")} value={bulkAssignee} onChange={(e) => setBulkAssignee(e.target.value)} style={{ width: 200 }} />
              <button className="small" onClick={() => { updateMany(selected, { assignedTo: bulkAssignee.trim() }); setBulkAssignee(""); }}>Assign</button>
              <button className="small ghost" onClick={() => { if (window.confirm(t("Delete the selected issues?"))) remove(selected); }}>Delete selected</button>
              <button className="small ghost" onClick={() => setSelected(new Set())}>Clear selection</button>
            </div>
          )}
          <datalist id="bcf-assignees">{assignees.map((a) => <option key={a} value={a} />)}</datalist>
          <datalist id="bcf-statuses">{statuses.map((a) => <option key={a} value={a} />)}</datalist>
          <datalist id="bcf-priorities">{priorities.map((a) => <option key={a} value={a} />)}</datalist>

          <div className={"bcf-layout" + (current ? " has-detail" : "")}>
            <div className="card bcf-table-wrap" style={{ padding: 0 }}>
              <table className="data bcf-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" checked={allShownSelected} onChange={toggleAll} aria-label={t("Select all")} /></th>
                    <th>Snapshot</th><th>Title</th><th>Status</th><th>Priority</th><th>Assigned to</th><th>Due date</th><th>Labels</th><th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((x) => {
                    const over = isOverdue(x, now);
                    return (
                      <tr key={x.guid} className={"bcf-row" + (x.guid === active ? " on" : "")} onClick={() => setActive(x.guid === active ? null : x.guid)}>
                        <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.has(x.guid)} onChange={() => toggleOne(x.guid)} /></td>
                        <td>{x.snapshot ? <img className="bcf-thumb" src={x.snapshot} alt="" loading="lazy" /> : <span className="bcf-thumb empty">—</span>}</td>
                        <td className="no-i18n"><b>{x.title}</b>{x.type && <div className="small muted">{x.type}</div>}</td>
                        <td><span className="badge">{x.status}</span></td>
                        <td>{x.priority}</td>
                        <td className="no-i18n">{x.assignedTo}</td>
                        <td className={over ? "bcf-over" : ""}>{fmtDate(x.dueDate)}</td>
                        <td><div className="bcf-labels no-i18n">{x.labels.map((l) => <span key={l} className="chip">{l}</span>)}</div></td>
                        <td>{x.comments.length}</td>
                      </tr>
                    );
                  })}
                  {shown.length === 0 && <tr><td colSpan={9} className="muted">No issues match the filters.</td></tr>}
                </tbody>
              </table>
            </div>

            {current && (
              <div className="card bcf-detail">
                <div className="row spread">
                  <span className="small muted no-i18n">{current.guid}</span>
                  <button className="small ghost" onClick={() => setActive(null)}>Close</button>
                </div>
                {current.snapshot && <img className="bcf-snap" src={current.snapshot} alt="" />}
                <label>Title<input value={current.title} onChange={(e) => update(current.guid, { title: e.target.value })} /></label>
                <div className="bcf-fields">
                  <label>Status<input list="bcf-statuses" value={current.status} onChange={(e) => update(current.guid, { status: e.target.value })} /></label>
                  <label>Priority<input list="bcf-priorities" value={current.priority} onChange={(e) => update(current.guid, { priority: e.target.value })} /></label>
                  <label>Assigned to<input list="bcf-assignees" value={current.assignedTo} onChange={(e) => update(current.guid, { assignedTo: e.target.value })} /></label>
                  <label>Due date<input type="date" value={fmtDate(current.dueDate)} onChange={(e) => update(current.guid, { dueDate: e.target.value })} /></label>
                  <label>Type<input value={current.type} onChange={(e) => update(current.guid, { type: e.target.value })} /></label>
                  <label>Labels (comma separated)
                    <input key={current.guid + current.labels.join("|")} defaultValue={current.labels.join(", ")}
                      onBlur={(e) => update(current.guid, { labels: [...new Set(e.target.value.split(/[,;]/).map((s) => s.trim()).filter(Boolean))] })} />
                  </label>
                </div>
                <label>Description<textarea rows={3} value={current.description} onChange={(e) => update(current.guid, { description: e.target.value })} /></label>
                <div className="small muted">
                  <span>Created</span> <span className="no-i18n">{fmtDateTime(current.creationDate)} · {current.creationAuthor}</span> · <span>Viewpoints</span> {current.viewpointCount}
                </div>

                <div>
                  <div className="row spread"><b>Comments</b><span className="small muted">{current.comments.length}</span></div>
                  {current.comments.length === 0 && <div className="small muted">No comments yet.</div>}
                  {current.comments.map((c) => (
                    <div key={c.guid} className="bcf-comment">
                      <div className="bcf-comment-meta no-i18n">{c.author} · {fmtDateTime(c.date)}</div>
                      <p className="no-i18n">{c.text}</p>
                    </div>
                  ))}
                  <textarea rows={2} placeholder={t("Add a comment…")} value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: "100%" }} />
                  <div className="row"><button className="small primary" disabled={!comment.trim()} onClick={addComment}>Add comment</button></div>
                </div>

                <div>
                  <div className="row spread">
                    <b>Components (IFC GUIDs)</b>
                    {current.components.length > 0 && <button className="small ghost" onClick={() => copy(current.components.join("\n"))}>Copy all</button>}
                  </div>
                  {current.components.length === 0 ? <div className="small muted">No components in the viewpoints.</div> : (
                    <div className="bcf-guids">
                      {current.components.map((g) => (
                        <div key={g} className="bcf-guid"><span className="no-i18n">{g}</span><button className="small ghost" onClick={() => copy(g)}>Copy</button></div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="row"><button className="small ghost" onClick={() => { if (window.confirm(t("Delete this issue?"))) remove(new Set([current.guid])); }}>Delete issue</button></div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
