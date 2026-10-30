import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { saveAs } from "file-saver";
import { api } from "../../lib/api";
import { exportCsv, parseTabular } from "../../lib/export";
import { getProjectData } from "../../lib/projectStore";
import { readPlan, updatePlanRow, type SavedPlanKind } from "../../lib/planStore";
import { t } from "../../i18n";
import {
  CONTAINER_COLUMNS, DISCIPLINES, TYPE_CODES, checkContainers, containerName, numberRows,
  type ContainerRow, type PlanHeader, type PlanMilestone,
} from "../../../../shared/planRows";
import { checkNames, formatMsg } from "../../../../shared/namingCheck";
import {
  actKey, diffProgrammes, impact, parseCsvProgramme, parseProgrammeText, type Activity, type ImpactFlag, type ImpactRow, type ProgrammeDiff,
} from "../../../../shared/programme";
import "./programme.css";

// TIDP / MIDP from the programme: load an MS Project, Primavera P6 or spreadsheet programme, pick the activities
// that produce information, let the AI propose the containers, name them with the shared ISO 19650 helpers and
// merge them into the plan generator's saved plan. A later programme version shows which containers move.

type Kind = SavedPlanKind;
/** A plan row produced here: the generator's row plus the programme link (kept as an extra field and in the ref). */
type GenRow = ContainerRow & { activityId: string; originator: string; notes: string };
interface AiContainer { activityId: string; title: string; type: string; role: string; volume: string; level: string; originator: string; due: string; format: string; loin: string; notes: string }

const BASE_KEY = "bim:programme:base";
const SUGGEST = /design|stage|concept|scheme|spatial|technical|coordinat|model|drawing|issue|submi|report|survey|specification|spec\b|calc|schedule|tender|planning|approval|review|as[- ]built|o&m|handover|information|cobie|package|fire strategy|strategy/i;
const MAX_AI = 400;
const cv = (c: string) => ({ "--c": c }) as CSSProperties;
const EMPTY_HEADER: PlanHeader = { projectName: "", projectCode: "", appointingParty: "", leadAppointedParty: "", taskTeam: "", originator: "", discipline: "architecture", preparedBy: "", revision: "P01" };
const FLAG_LABEL: Record<ImpactFlag, string> = { moved: "Moved", overdue: "Now overdue", beforePredecessor: "Before predecessor finishes", afterActivity: "Capped at activity finish", removed: "Activity removed" };

const storageKey = (k: Kind) => `bim:plan:${k}`;
function rawPlan(k: Kind): Record<string, unknown> & { header?: Partial<PlanHeader>; milestones?: PlanMilestone[]; rows?: ContainerRow[] } {
  try { const v = localStorage.getItem(storageKey(k)); return v ? JSON.parse(v) : {}; } catch { return {}; }
}

function useAiEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  return enabled;
}

async function fileText(f: File) {
  const buf = await f.arrayBuffer();
  try { return new TextDecoder("utf-8", { fatal: true }).decode(buf); } catch { return new TextDecoder("windows-1252").decode(buf); }
}

async function readSheetRows(buf: ArrayBuffer): Promise<unknown[][]> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets.find((w) => w.rowCount > 1) ?? wb.worksheets[0];
  if (!ws) return [];
  const rows: unknown[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const vals = (row.values as unknown[]).slice(1);
    rows.push(vals.map((v) => {
      if (v && typeof v === "object" && !(v instanceof Date)) {
        const o = v as { result?: unknown; text?: unknown; richText?: { text: string }[] };
        if (o.richText) return o.richText.map((x) => x.text).join("");
        if (o.result !== undefined) return o.result;
        if (o.text !== undefined) return o.text;
      }
      return v ?? "";
    }));
  });
  return rows;
}

async function loadProgramme(f: File): Promise<Activity[]> {
  const n = f.name.toLowerCase();
  if (n.endsWith(".xlsx")) return parseCsvProgramme(await readSheetRows(await f.arrayBuffer()));
  if (n.endsWith(".mpp")) throw new Error(t("MS Project .mpp files cannot be read in the browser. In MS Project use File > Save As > XML, then load the .xml file."));
  return parseProgrammeText(f.name, await fileText(f), parseTabular);
}

/** Milestone that a due date falls into: the earliest one dated on or after it. */
const milestoneFor = (due: string, ms: PlanMilestone[]) => ms.filter((m) => m.code && m.date && (!due || m.date >= due)).sort((a, b) => a.date.localeCompare(b.date))[0]?.code ?? "";

/** Merge generated rows into saved ones: same ref (same activity link) replaces content but keeps number and status; others are appended. */
function mergeRows(prev: ContainerRow[], gen: GenRow[]) {
  const byRef = new Map(prev.map((r, i) => [r.ref, i]));
  const out: ContainerRow[] = [...prev];
  let replaced = 0, added = 0;
  for (const g of gen) {
    const i = byRef.get(g.ref);
    if (i !== undefined) { out[i] = { ...g, number: prev[i].number, status: prev[i].status || g.status }; replaced++; }
    else { out.push({ ...g, number: "" }); added++; }
  }
  return { rows: numberRows(out), replaced, added };
}

export default function ProgrammePlan() {
  const p = getProjectData();
  const ai = useAiEnabled();
  const fileRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [fileName, setFileName] = useState("");
  const [acts, setActs] = useState<Activity[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [hideSummary, setHideSummary] = useState(true);
  const [onlySelected, setOnlySelected] = useState(false);

  const [kind, setKind] = useState<Kind>("tidp");
  const saved0 = rawPlan("tidp").header ?? {};
  const [code, setCode] = useState(saved0.projectCode || p.code);
  const [originators, setOriginators] = useState(saved0.originator || "");
  const [team, setTeam] = useState(saved0.taskTeam || "");
  const [discipline, setDiscipline] = useState(saved0.discipline || "architecture");
  const [stage, setStage] = useState(p.stages.find((s) => s.name.trim())?.name ?? "");
  const [responsibility, setResponsibility] = useState("");
  const [busy, setBusy] = useState(false);
  const [gen, setGen] = useState<GenRow[]>([]);
  const [confirm, setConfirm] = useState(false);

  const [diff, setDiff] = useState<ProgrammeDiff | null>(null);
  const [nextActs, setNextActs] = useState<Activity[] | null>(null);
  const [nextName, setNextName] = useState("");
  const [planTick, setPlanTick] = useState(0);

  const projectMilestones: PlanMilestone[] = useMemo(() => p.stages.filter((s) => s.name.trim()).map((s, i) => ({ code: (s.code || `M${i + 1}`).slice(0, 12), name: s.name, date: s.end || s.start })), [p.stages]);
  const saved = useMemo(() => rawPlan(kind), [kind, planTick, confirm]); // eslint-disable-line react-hooks/exhaustive-deps
  const savedRows: ContainerRow[] = Array.isArray(saved.rows) ? saved.rows : [];
  const milestones: PlanMilestone[] = saved.milestones?.length ? saved.milestones : projectMilestones;
  const origList = originators.split(/[,;\s]+/).map((o) => o.trim().toUpperCase()).filter(Boolean);
  const header: PlanHeader = {
    ...EMPTY_HEADER, projectName: p.name, appointingParty: p.client, ...(saved.header ?? {}),
    projectCode: saved.header?.projectCode || code, originator: saved.header?.originator || origList[0] || "",
    ...(kind === "tidp" && !saved.header?.taskTeam ? { taskTeam: team } : {}), ...(!saved.header?.discipline ? { discipline } : {}),
  };

  // keep the programme between visits so a later version can be compared with it
  useEffect(() => { try { const v = localStorage.getItem(BASE_KEY); if (v) { const s = JSON.parse(v); if (Array.isArray(s.acts)) { setActs(s.acts); setFileName(s.fileName ?? ""); setSelected(new Set(s.selected ?? [])); } } } catch { /* storage unavailable */ } }, []);
  const persist = (a: Activity[], name: string, sel: Set<string>) => { try { localStorage.setItem(BASE_KEY, JSON.stringify({ fileName: name, acts: a.slice(0, 8000), selected: [...sel] })); } catch { /* too large or unavailable */ } };
  useEffect(() => { if (acts.length) persist(acts, fileName, selected); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggest = (a: Activity[]) => new Set(a.filter((x) => !x.summary && SUGGEST.test(x.name)).map(actKey));

  async function onFile(f: File | undefined) {
    if (!f) return;
    setNotice(null);
    try {
      const a = await loadProgramme(f);
      if (!a.length) throw new Error(t("No activities found in the file."));
      const sel = suggest(a);
      setActs(a); setFileName(f.name); setSelected(sel); setGen([]); setDiff(null); setNextActs(null);
      persist(a, f.name, sel);
      setNotice({ kind: "ok", text: `${a.length} ${t("activities loaded from")} ${f.name}` });
    } catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
  }

  const byKey = useMemo(() => new Map(acts.map((a) => [actKey(a), a])), [acts]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return acts.filter((a) => (!hideSummary || !a.summary) && (!onlySelected || selected.has(actKey(a)))
      && (!q || `${a.code} ${a.id} ${a.name} ${a.wbs} ${a.group ?? ""}`.toLowerCase().includes(q)));
  }, [acts, query, hideSummary, onlySelected, selected]);
  const toggle = (k: string) => setSelected((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  async function generate() {
    const pick = acts.filter((a) => selected.has(actKey(a)) && !a.summary);
    if (!pick.length) return setNotice({ kind: "error", text: t("Pick at least one activity.") });
    if (pick.length > MAX_AI) return setNotice({ kind: "error", text: t("At most 400 activities per request. Narrow the selection.") });
    setBusy(true); setNotice(null);
    try {
      const r = await api<{ containers: AiContainer[] }>("/ai/tools/programme-to-plan", { body: {
        activities: pick.map((a) => ({ id: actKey(a), name: a.name.slice(0, 300), start: a.start, finish: a.finish, milestone: a.milestone, wbs: [a.wbs, a.group].filter(Boolean).join(" / ").slice(0, 120) })),
        project: { code: code.trim().toUpperCase(), originators: origList, disciplines: p.disciplines.map((d) => d.discipline).filter(Boolean).slice(0, 20), stage },
        kind, team: team.trim(), responsibility: responsibility.slice(0, 20_000),
      } });
      if (!r.containers.length) throw new Error(t("The AI found no information-producing activities in the selection."));
      setGen(buildRows(r.containers));
      setConfirm(false);
    } catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
    finally { setBusy(false); }
  }

  /** Deterministic rows from the AI fields: refs from the activity link, names from the shared helpers. */
  function buildRows(cs: AiContainer[]): GenRow[] {
    const count = new Map<string, number>();
    const rows: GenRow[] = cs.map((c) => {
      const a = byKey.get(c.activityId);
      const n = (count.get(c.activityId) ?? 0) + 1; count.set(c.activityId, n);
      const due = c.due || a?.finish || "";
      const start = a?.start && (!due || a.start <= due) ? a.start : "";
      return {
        ref: n === 1 ? `P-${c.activityId}` : `P-${c.activityId}-${n}`, taskTeam: kind === "tidp" ? team : (a?.group || a?.wbs || team),
        title: c.title, volume: c.volume, level: c.level, type: TYPE_CODES[c.type] ? c.type : "M3", role: c.role || DISCIPLINES[discipline]?.role || "Z", number: "",
        format: c.format, loin: c.loin, milestone: milestoneFor(due, milestones), start, due, dependsOn: "", responsible: team || `${DISCIPLINES[discipline]?.label ?? ""} lead`.trim(),
        suitability: c.type === "M3" ? "S1" : "S2", status: "Planned", activityId: c.activityId, originator: c.originator, notes: c.notes,
      };
    });
    // dependencies follow the programme: a container depends on the first container of each predecessor activity
    const firstRef = new Map<string, string>();
    rows.forEach((r) => { if (!firstRef.has(r.activityId)) firstRef.set(r.activityId, r.ref); });
    return rows.map((r) => ({ ...r, dependsOn: (byKey.get(r.activityId)?.predecessors ?? []).map((k) => firstRef.get(k)).filter((x): x is string => !!x && x !== r.ref).join(", ") }));
  }

  const merged = useMemo(() => mergeRows(savedRows, gen), [savedRows, gen]);
  const numbered: GenRow[] = useMemo(() => {
    const byRef = new Map(merged.rows.map((r) => [r.ref, r]));
    return gen.map((g) => ({ ...g, number: byRef.get(g.ref)?.number ?? g.number }));
  }, [merged, gen]);
  const nameOf = (r: GenRow) => containerName({ projectCode: header.projectCode, originator: r.originator || header.originator }, r);
  const issues = useMemo(() => {
    const out = new Map<string, string[]>();
    const add = (ref: string, m: string) => out.set(ref, [...(out.get(ref) ?? []), m]);
    const all = checkContainers(header, merged.rows, milestones);
    const refAt = merged.rows.map((r) => r.ref);
    const mine = new Set(gen.map((g) => g.ref));
    all.forEach((i) => { const ref = refAt[i.row]; if (mine.has(ref)) add(ref, i.message); });
    const rep = checkNames(numbered.map(nameOf), { separator: "-", projectCode: header.projectCode, originators: origList.length ? origList : undefined });
    rep.results.forEach((res, i) => [...res.errors, ...res.warnings].forEach((m) => add(numbered[i].ref, formatMsg(m, t))));
    numbered.forEach((r) => { const a = byKey.get(r.activityId); if (a?.finish && r.due && r.due > a.finish) add(r.ref, t("Due after the activity finish.")); });
    return out;
  }, [merged, numbered, milestones]); // eslint-disable-line react-hooks/exhaustive-deps
  const setRow = (i: number, patch: Partial<GenRow>) => setGen((g) => g.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  function save() {
    try {
      const prev = rawPlan(kind);
      const m = mergeRows(Array.isArray(prev.rows) ? prev.rows : [], gen);
      const next = { ...prev, header: { ...header, ...(prev.header ?? {}), projectCode: prev.header?.projectCode || header.projectCode, originator: prev.header?.originator || header.originator, projectName: prev.header?.projectName || header.projectName },
        milestones: prev.milestones?.length ? prev.milestones : milestones, rows: m.rows };
      localStorage.setItem(storageKey(kind), JSON.stringify(next));
      setConfirm(false); setPlanTick((x) => x + 1);
      setNotice({ kind: "ok", text: `${t("Saved to the")} ${kind.toUpperCase()}: ${m.added} ${t("added")}, ${m.replaced} ${t("updated")}. ${t("Open the plan generator to review it.")}` });
    } catch { setNotice({ kind: "error", text: t("The plan could not be saved in this browser.") }); }
  }
  const saveClick = () => (savedRows.length ? setConfirm(true) : save());

  const exportHead = ["Container name", ...CONTAINER_COLUMNS.map((c) => c.label), "Originator", "Activity", "Activity name", "Notes"];
  const exportBody = () => numbered.map((r) => [nameOf(r), ...CONTAINER_COLUMNS.map((c) => String(r[c.key] ?? "")), r.originator || header.originator, r.activityId, byKey.get(r.activityId)?.name ?? "", r.notes]);
  const fileBase = `${(header.projectCode || "PRJ").toUpperCase()}-${kind.toUpperCase()}-from-programme`;
  async function toExcel() {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "TIDP / MIDP from the programme";
    const ws = wb.addWorksheet(kind.toUpperCase());
    ws.columns = exportHead.map((h, i) => ({ header: h, key: String(i), width: i === 0 ? 34 : (CONTAINER_COLUMNS[i - 1]?.width ?? 24) + 2 }));
    exportBody().forEach((r) => ws.addRow(r));
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    for (let c = 1; c <= exportHead.length; c++) head.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: exportHead.length } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    const ps = wb.addWorksheet("Programme link");
    ps.columns = [{ header: "Activity", width: 16 }, { header: "Activity name", width: 50 }, { header: "Start", width: 12 }, { header: "Finish", width: 12 }, { header: "Containers", width: 12 }];
    const per = new Map<string, number>(); numbered.forEach((r) => per.set(r.activityId, (per.get(r.activityId) ?? 0) + 1));
    [...per].forEach(([k, n]) => { const a = byKey.get(k); ps.addRow([k, a?.name ?? "", a?.start ?? "", a?.finish ?? "", n]); });
    ps.getRow(1).font = { bold: true };
    saveAs(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileBase}.xlsx`);
  }

  // ------------------------------------------------ programme changed
  async function onNext(f: File | undefined) {
    if (!f) return;
    setNotice(null);
    try {
      if (!acts.length) throw new Error(t("Load the current programme first, then the new version."));
      const a = await loadProgramme(f);
      setNextActs(a); setNextName(f.name); setDiff(diffProgrammes(acts, a));
    } catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
  }
  const affected: ImpactRow[] = useMemo(() => {
    if (!diff) return [];
    const plan = readPlan(kind);
    return plan ? impact(plan.rows as (ContainerRow & { activityId?: string })[], diff) : [];
  }, [diff, kind, planTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const applicable = affected.filter((x) => !x.flags.includes("removed") && x.newDue !== x.oldDue);
  function applyDates() {
    applicable.forEach((x) => { const m = milestoneFor(x.newDue, milestones); updatePlanRow(kind, x.ref, m ? { due: x.newDue, milestone: m } : { due: x.newDue }); });
    if (nextActs) { setActs(nextActs); setFileName(nextName); persist(nextActs, nextName, selected); }
    setDiff(null); setNextActs(null); setPlanTick((x) => x + 1);
    setNotice({ kind: "ok", text: `${applicable.length} ${t("due dates updated in the")} ${kind.toUpperCase()}. ${t("The new programme is now the base version.")}` });
  }

  const selCount = acts.filter((a) => selected.has(actKey(a)) && !a.summary).length;
  const linked = savedRows.filter((r) => (r as GenRow).activityId || r.ref.startsWith("P-")).length;

  return (
    <div className="grid prog" style={{ gap: 16 }}>
      <p className="small muted" style={{ margin: 0, maxWidth: 820 }}>
        Load the project programme, pick the activities that produce information and let the AI propose the information containers for each. Names follow the ISO 19650-2 UK National Annex fields and are built by the platform, not the AI. Rows are saved into the plan generator and keep their link to the activity.
      </p>
      {notice && <div className={`card small ${notice.kind === "error" ? "danger" : ""}`} role="status">
        <div className="row spread"><span>{notice.text}</span><button className="tiny ghost" aria-label={t("Dismiss")} onClick={() => setNotice(null)}>✕</button></div></div>}

      <section className="hub-card" style={cv("#0e7490")}>
        <div className="hub-title">1. Programme</div>
        <div className="row">
          <input ref={fileRef} type="file" accept=".xml,.xer,.csv,.txt,.xlsx" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
          <button className="primary" onClick={() => fileRef.current?.click()}>Load programme</button>
          <span className="small muted">MS Project XML (.xml), Primavera P6 (.xer), CSV or Excel (.xlsx)</span>
          {fileName && <span className="chip no-i18n">{fileName}</span>}
        </div>
        {acts.length > 0 && <>
          <div className="row prog-filters">
            <input type="search" placeholder={t("Filter by code, name or WBS")} value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className="prog-check"><input type="checkbox" checked={hideSummary} onChange={(e) => setHideSummary(e.target.checked)} />Hide summary rows</label>
            <label className="prog-check"><input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />Selected only</label>
            <button className="small" onClick={() => setSelected(suggest(acts))}>Select suggested</button>
            <button className="small" onClick={() => setSelected((s) => new Set([...s, ...shown.filter((a) => !a.summary).map(actKey)]))}>Select all shown</button>
            <button className="small ghost" onClick={() => setSelected(new Set())}>Clear selection</button>
            <span className="small muted"><b>{selCount}</b> of <b>{acts.length}</b> activities selected</span>
          </div>
          <div className="table-wrap prog-acts">
            <table className="data">
              <thead><tr><th /><th>Code</th><th>Activity</th><th>Start</th><th>Finish</th><th>WBS / discipline</th></tr></thead>
              <tbody>{shown.slice(0, 600).map((a) => { const k = actKey(a); return (
                <tr key={k} className={a.summary ? "prog-summary" : undefined}>
                  <td><input type="checkbox" aria-label={t("Select activity")} disabled={a.summary} checked={selected.has(k)} onChange={() => toggle(k)} /></td>
                  <td className="no-i18n nowrap"><code>{k}</code></td>
                  <td className="no-i18n">{a.milestone && <span className="prog-mile" title={t("Milestone")}>◆</span>}{a.name}</td>
                  <td className="nowrap">{a.start}</td><td className="nowrap">{a.finish}</td>
                  <td className="no-i18n small">{[a.wbs, a.group].filter(Boolean).join(" · ")}</td>
                </tr>); })}</tbody>
            </table>
            {shown.length > 600 && <p className="small muted">Showing the first 600 rows. Use the filter to narrow the list.</p>}
          </div>
        </>}
      </section>

      <section className="hub-card" style={cv("#4f46e5")}>
        <div className="hub-title">2. Plan settings</div>
        <div className="grid g3">
          <label className="small">Plan<select value={kind} onChange={(e) => { setKind(e.target.value as Kind); setConfirm(false); }}><option value="tidp">TIDP</option><option value="midp">MIDP</option></select></label>
          <label className="small">Project code<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PRJ" /></label>
          <label className="small">Originator codes<input value={originators} onChange={(e) => setOriginators(e.target.value)} placeholder={t("e.g. ABC, XYZ")} /></label>
          <label className="small">Task team<input value={team} onChange={(e) => setTeam(e.target.value)} /></label>
          <label className="small">Discipline<select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>{Object.entries(DISCIPLINES).map(([k, d]) => <option key={k} value={k}>{t(d.label)}</option>)}</select></label>
          <label className="small">Stage<select value={stage} onChange={(e) => setStage(e.target.value)}><option value="">—</option>{p.stages.filter((s) => s.name.trim()).map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}</select></label>
        </div>
        <label className="small prog-block">Responsibility matrix or scope (optional)
          <textarea rows={4} value={responsibility} onChange={(e) => setResponsibility(e.target.value)} placeholder={t("Paste the design responsibility matrix or each task team's scope, so containers go to the right originator and role.")} /></label>
        {saved.header && <p className="small muted">The saved {kind.toUpperCase()} already sets project code <code className="no-i18n">{saved.header.projectCode || "—"}</code> and originator <code className="no-i18n">{saved.header.originator || "—"}</code>; those are used for the names.</p>}
        <div className="row">
          <button className="primary" disabled={ai !== true || busy || !selCount || selCount > MAX_AI} onClick={() => void generate()}>{busy ? t("Generating…") : t("Generate TIDP/MIDP with AI")}</button>
          {ai === false && <span className="small muted">AI is not configured on this server, so containers cannot be generated.</span>}
          {selCount > MAX_AI && <span className="small danger">Select at most 400 activities.</span>}
        </div>
      </section>

      {gen.length > 0 && <section className="hub-card" style={cv("#15803d")}>
        <div className="row spread">
          <div className="hub-title" style={{ margin: 0 }}>3. Information containers</div>
          <div className="row">
            <button className="small" onClick={() => void toExcel()}>Excel (.xlsx)</button>
            <button className="small" onClick={() => exportCsv(fileBase, exportHead, exportBody())}>CSV</button>
            <button className="primary small" onClick={saveClick}>Save to plan generator</button>
          </div>
        </div>
        {confirm && <div className="card small prog-confirm" role="alertdialog">
          <p style={{ marginBlockStart: 0 }}>The saved {kind.toUpperCase()} has <b>{savedRows.length}</b> rows. Saving adds <b>{merged.added}</b> new rows and updates <b>{merged.replaced}</b> rows linked to the same activities. No other rows are changed.</p>
          <div className="row"><button className="primary small" onClick={save}>Merge into plan</button><button className="small ghost" onClick={() => setConfirm(false)}>Cancel</button></div>
        </div>}
        <p className="small muted">{gen.length} containers from {new Set(gen.map((g) => g.activityId)).size} activities. {[...issues.values()].filter((x) => x.length).length} with naming or plan issues.</p>
        <div className="table-wrap prog-rows">
          <table className="data">
            <thead><tr><th>Container name</th><th>Activity</th><th>Title / description</th><th>Volume</th><th>Level</th><th>Type</th><th>Role</th><th>Milestone</th><th>Due</th><th>Level of information need</th><th>Checks</th><th /></tr></thead>
            <tbody>{numbered.map((r, i) => { const iss = issues.get(r.ref) ?? []; const a = byKey.get(r.activityId); return (
              <tr key={r.ref} className={iss.length ? "prog-warn" : undefined}>
                <td><code className="no-i18n nowrap">{nameOf(r)}</code></td>
                <td className="no-i18n small" title={a?.name}><code>{r.activityId}</code>{a?.finish && <div className="muted">≤ {a.finish}</div>}</td>
                <td><input className="cell-input" value={r.title} onChange={(e) => setRow(i, { title: e.target.value })} />{r.notes && <div className="small muted no-i18n">{r.notes}</div>}</td>
                <td><input className="cell-input prog-code" value={r.volume} onChange={(e) => setRow(i, { volume: e.target.value })} /></td>
                <td><input className="cell-input prog-code" value={r.level} onChange={(e) => setRow(i, { level: e.target.value })} /></td>
                <td><select className="cell-input prog-code" value={r.type} title={TYPE_CODES[r.type]} onChange={(e) => setRow(i, { type: e.target.value })}>{Object.keys(TYPE_CODES).map((x) => <option key={x} value={x}>{x}</option>)}</select></td>
                <td><input className="cell-input prog-code" value={r.role} onChange={(e) => setRow(i, { role: e.target.value })} /></td>
                <td className="nowrap">{r.milestone || "—"}</td>
                <td><input className="cell-input" type="date" value={r.due} max={a?.finish || undefined} onChange={(e) => setRow(i, { due: e.target.value, milestone: milestoneFor(e.target.value, milestones) })} /></td>
                <td className="no-i18n small">{r.loin}</td>
                <td className="small">{iss.length ? <span className="prog-issue" title={iss.join("\n")}>{iss.length} ⚠</span> : <span className="prog-ok">✓</span>}</td>
                <td><button className="ghost small" aria-label={t("Remove row")} onClick={() => setGen((g) => g.filter((_, j) => j !== i))}>✕</button></td>
              </tr>); })}</tbody>
          </table>
        </div>
        {kind === "midp" && new Set(numbered.map((r) => r.originator || header.originator)).size > 1 && <p className="small muted prog-note">The plan generator names every container with one originator ({header.originator || "—"}). The originator proposed for each row is kept in the exports.</p>}
      </section>}

      <section className="hub-card" style={cv("#b45309")}>
        <div className="hub-title">Programme changed?</div>
        <p className="small muted" style={{ marginBlockStart: 0 }}>Load the new version of the programme to see which containers in the saved {kind.toUpperCase()} are linked to activities that moved or were removed. {linked} saved rows are linked to activities.</p>
        <div className="row">
          <input ref={nextRef} type="file" accept=".xml,.xer,.csv,.txt,.xlsx" hidden onChange={(e) => { void onNext(e.target.files?.[0]); e.target.value = ""; }} />
          <button disabled={!acts.length} onClick={() => nextRef.current?.click()}>Load new programme version</button>
          {nextName && <span className="chip no-i18n">{nextName}</span>}
        </div>
        {diff && <>
          <div className="row prog-stats">
            <span className="badge">{diff.moved.length} moved</span><span className="badge">{diff.added.length} added</span>
            <span className="badge">{diff.removed.length} removed</span><span className="badge">{diff.unchanged} unchanged</span>
          </div>
          {affected.length === 0 ? <p className="small muted">No saved containers are affected.</p> : <>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Ref</th><th>Title / description</th><th>Activity</th><th>Old due</th><th>New due</th><th>Shift (days)</th><th>Flags</th></tr></thead>
                <tbody>{affected.map((x) => <tr key={x.ref} className={x.flags.some((f) => f === "overdue" || f === "beforePredecessor" || f === "removed") ? "prog-warn" : undefined}>
                  <td className="no-i18n"><code>{x.ref}</code></td><td className="no-i18n">{x.title}</td>
                  <td className="no-i18n small"><code>{x.activity}</code> {x.activityName}</td>
                  <td className="nowrap">{x.oldDue || "—"}</td><td className="nowrap"><b>{x.newDue || "—"}</b></td>
                  <td className="nowrap">{x.shift > 0 ? `+${x.shift}` : x.shift}</td>
                  <td>{x.flags.map((f) => <span key={f} className={`chip prog-flag prog-flag-${f}`}>{t(FLAG_LABEL[f])}</span>)}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="row">
              <button className="primary" disabled={!applicable.length} onClick={applyDates}>Apply new dates</button>
              <span className="small muted">Updates {applicable.length} due dates in the saved {kind.toUpperCase()}. Removed activities are listed for review only.</span>
            </div>
          </>}
        </>}
      </section>
    </div>
  );
}
