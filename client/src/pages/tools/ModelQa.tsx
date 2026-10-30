import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { saveAs } from "file-saver";
import { api } from "../../lib/api";
import { t } from "../../i18n";
import type { Requirement } from "../../../../shared/ifc";
import { IDS_PRESETS, parseIds, sanitiseSpecs, toRequirements, type IdsDoc, type IdsSpec } from "../../../../shared/ids";
import { writeBcfZip } from "../../../../shared/bcfStudio";
import { compactForAi, DISCIPLINES, entityLabel, failuresToBcfTopics, groupTitle, type Discipline, type GroupAdvice, type QaGroup } from "../../../../shared/modelQa";
import type { ModelInfo, QaSummary, QaWorkerIn, QaWorkerOut } from "./modelQa.worker";
import "./modelqa.css";

// AI model QA from IDS: check an IFC model against IDS requirements in the browser, group the failures
// by discipline, optionally ask the AI why each group matters and how to fix it, then export BCF / Excel.

const MAX_MB = 500;
const IDS_DRAFT_KEY = "bim:ids:draft";
const SOFTWARE = ["Revit", "Archicad", "Tekla", "Civil 3D", "Other"] as const;
type Software = (typeof SOFTWARE)[number];
const DISC_LABEL: Record<Discipline, string> = { architecture: "Architecture", structure: "Structure", MEP: "MEP", civil: "Civil", other: "Other" };
const DISC_COLOR: Record<Discipline, string> = { architecture: "#2563eb", structure: "#b45309", MEP: "#0d9488", civil: "#65a30d", other: "#64748b" };
const PRIO_COLOR = { high: "var(--danger)", medium: "var(--warn)", low: "var(--muted)" } as const;
const STAGE: Record<string, string> = { read: "Reading the file…", parse: "Parsing IFC entities…", model: "Building the model (property sets, storeys)…", check: "Checking requirements…" };

interface ReqSet { label: string; reqs: Requirement[]; skipped: number; specs: number; noChecks: number }
interface AiAnswer { summary: string; groups: (GroupAdvice & { key: string })[]; nextSteps: string[] }

/** IDS document → checkable requirements, counting the facets this checker does not evaluate. */
function reqSetFrom(label: string, doc: IdsDoc): ReqSet {
  const skipped = doc.specs.reduce((n, s) => n + s.requirements.filter((q) => q.kind === "classification" || q.kind === "material" || q.cardinality !== "required").length, 0);
  const all = toRequirements(doc);
  const reqs = all.filter((r) => r.properties.length || r.attributes.length);
  return { label, reqs, skipped, specs: doc.specs.length, noChecks: all.length - reqs.length };
}

function readDraft(): IdsDoc | null {
  try {
    const raw = localStorage.getItem(IDS_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as { info?: { title?: unknown }; specs?: unknown };
    const specs: IdsSpec[] = sanitiseSpecs(d?.specs, 200);
    if (!specs.length) return null;
    return { info: { title: typeof d.info?.title === "string" ? d.info.title : "" }, specs };
  } catch { return null; }
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 100);
const slug = (s: string) => s.trim().replace(/\.ifc$/i, "").replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "model";

export default function ModelQa() {
  // model
  const workerRef = useRef<Worker | null>(null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  // requirements
  const [reqSet, setReqSet] = useState<ReqSet | null>(null);
  const [presets, setPresets] = useState<string[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const idsRef = useRef<HTMLInputElement>(null);
  // result
  const [summary, setSummary] = useState<QaSummary | null>(null);
  const [groups, setGroups] = useState<QaGroup[]>([]);
  const [disc, setDisc] = useState<Discipline | "">("");
  const [kind, setKind] = useState<"" | "missing" | "value">("");
  const [prio, setPrio] = useState<"" | "high" | "medium" | "low">("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState("");
  // AI
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [software, setSoftware] = useState<Software>("Revit");
  const [ai, setAi] = useState<AiAnswer | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  // export
  const [teams, setTeams] = useState<Partial<Record<Discipline, string>>>({});
  const [exporting, setExporting] = useState("");

  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setAiEnabled(r.enabled)).catch(() => setAiEnabled(false)); }, []);
  useEffect(() => { setHasDraft(!!readDraft()); }, []);
  useEffect(() => () => workerRef.current?.terminate(), []);

  const worker = () => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL("./modelQa.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<QaWorkerOut>) => {
      const m = e.data;
      if (m.kind === "progress") setStage(m.stage);
      else if (m.kind === "loaded") { setInfo(m.info); setStage(""); }
      else if (m.kind === "result") { setSummary(m.summary); setGroups(m.groups); setStage(""); setOpen(new Set()); setAi(null); }
      else { setError(m.error); setStage(""); }
    };
    w.onerror = (e) => { setError(e.message || t("The file could not be read.")); setStage(""); w.terminate(); workerRef.current = null; };
    workerRef.current = w;
    return w;
  };

  const loadIfc = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    if (!/\.ifc$/i.test(f.name)) { setError(t("Choose an .ifc file (IFC ZIP and IFCXML are not supported).")); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`${t("The file is larger than the limit (MB):")} ${MAX_MB}`); return; }
    setInfo(null); setSummary(null); setGroups([]); setAi(null); setStage("read");
    try {
      const buffer = await f.arrayBuffer();
      worker().postMessage({ kind: "load", buffer, name: f.name } satisfies QaWorkerIn, [buffer]);
    } catch { setError(t("The file could not be read.")); setStage(""); }
  };

  const loadIdsFile = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    try {
      const doc = parseIds(await f.text());
      if (!doc.specs.length) { setError(t("No specifications found in that file. Is it a buildingSMART IDS file?")); return; }
      setReqSet(reqSetFrom(doc.info.title || f.name, doc)); setPresets([]);
    } catch { setError(t("Could not read that IDS file.")); }
    finally { if (idsRef.current) idsRef.current.value = ""; }
  };

  const applyDraft = () => {
    const d = readDraft();
    if (!d) { setError(t("No IDS builder draft found in this browser. Open the IDS builder first.")); setHasDraft(false); return; }
    setError(""); setReqSet(reqSetFrom(d.info.title || t("IDS builder draft"), d)); setPresets([]);
  };

  const togglePreset = (id: string) => {
    const next = presets.includes(id) ? presets.filter((p) => p !== id) : [...presets, id];
    setPresets(next);
    const specs = IDS_PRESETS.filter((p) => next.includes(p.id)).map((p) => p.spec);
    setReqSet(specs.length ? reqSetFrom(t("IDS presets"), { info: { title: "IDS presets" }, specs }) : null);
  };

  const runCheck = () => { if (info && reqSet?.reqs.length) { setError(""); setStage("check"); worker().postMessage({ kind: "check", reqs: reqSet.reqs } satisfies QaWorkerIn); } };

  const advice = useMemo(() => Object.fromEntries((ai?.groups ?? []).map((g) => [g.key, g])) as Record<string, GroupAdvice | undefined>, [ai]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((g) => (!disc || g.discipline === disc) && (!kind || g.kind === kind) && (!prio || advice[g.key]?.priority === prio)
      && (!q || `${g.entity} ${g.item} ${g.requirement} ${g.samples.map((s) => `${s.name} ${s.guid} ${s.storey}`).join(" ")}`.toLowerCase().includes(q)));
  }, [groups, disc, kind, prio, query, advice]);
  const byDisc = useMemo(() => DISCIPLINES.map((d) => ({ d, rows: filtered.filter((g) => g.discipline === d) })).filter((x) => x.rows.length), [filtered]);
  const discCounts = useMemo(() => Object.fromEntries(DISCIPLINES.map((d) => [d, groups.filter((g) => g.discipline === d).length])) as Record<Discipline, number>, [groups]);

  const toggle = (k: string) => setOpen((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const copy = async (g: QaGroup) => {
    try { await navigator.clipboard.writeText(g.guids.join("\n")); setCopied(g.key); setTimeout(() => setCopied(""), 1500); }
    catch { setError(t("Copy failed. Your browser blocked clipboard access.")); }
  };

  const explain = async () => {
    setAiBusy(true); setAiError("");
    try {
      const compact = compactForAi(filtered.length ? filtered : groups);
      const r = await api<AiAnswer>("/ai/tools/model-qa-explain", { body: { groups: compact, modelName: info?.name, software } });
      setAi(r);
    } catch (e) { setAiError(e instanceof Error ? e.message : t("AI request failed.")); }
    finally { setAiBusy(false); }
  };

  const exportBcf = async () => {
    setExporting("bcf");
    try {
      const topics = failuresToBcfTopics(filtered, { teams, advice, modelName: info?.name, idsName: reqSet?.label });
      const blob = await writeBcfZip(topics, { output: "blob", project: info?.name });
      saveAs(blob as Blob, `${slug(info?.name ?? "model")}_IDS-QA.bcfzip`);
    } catch (e) { setError(e instanceof Error ? e.message : t("Export failed.")); }
    finally { setExporting(""); }
  };

  const exportExcel = async () => {
    setExporting("xlsx");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const head = (ws: import("exceljs").Worksheet, cols: { header: string; key: string; width: number }[]) => {
        ws.columns = cols;
        ws.getRow(1).eachCell((c) => { c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } }; });
        ws.views = [{ state: "frozen", ySplit: 1 }];
        ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
      };
      const s = wb.addWorksheet("Summary");
      s.columns = [{ width: 28 }, { width: 80 }];
      const rows: [string, string | number][] = [
        ["Model", info?.name ?? ""], ["Schema", info?.schema ?? ""], ["Authoring software", info?.software ?? ""], ["Requirements", reqSet?.label ?? ""],
        ["Elements checked", summary?.elementsChecked ?? 0], ["Elements passing", summary?.elementsPassed ?? 0], ["Pass %", pct(summary?.elementsPassed ?? 0, summary?.elementsChecked ?? 0)],
        ["Failing groups", groups.length], ["Groups in this export", filtered.length], ["Date", new Date().toISOString().slice(0, 16).replace("T", " ")],
      ];
      if (ai?.summary) rows.push(["AI summary", ai.summary]);
      ai?.nextSteps.forEach((n, i) => rows.push([`Next step ${i + 1}`, n]));
      s.addRow(["Model QA from IDS"]).font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } };
      rows.forEach((r) => { const x = s.addRow(r); x.getCell(1).font = { bold: true }; x.alignment = { wrapText: true, vertical: "top" }; });

      const rq = wb.addWorksheet("Requirements");
      head(rq, [{ header: "Requirement", key: "name", width: 40 }, { header: "IFC class", key: "entity", width: 22 }, { header: "Checks", key: "checks", width: 60 }, { header: "Applicable", key: "applicable", width: 12 }, { header: "Passed", key: "passed", width: 10 }, { header: "Failed", key: "failed", width: 10 }]);
      summary?.requirements.forEach((r) => rq.addRow({ name: r.name, entity: r.entity, checks: r.checks.join(", "), applicable: r.applicable, passed: r.passed, failed: r.failed }));

      const gs = wb.addWorksheet("Failure groups");
      head(gs, [{ header: "Key", key: "key", width: 12 }, { header: "Discipline", key: "discipline", width: 14 }, { header: "Title", key: "title", width: 50 }, { header: "Requirement", key: "requirement", width: 30 }, { header: "IFC class", key: "entity", width: 20 },
        { header: "Property / attribute", key: "item", width: 40 }, { header: "Issue", key: "kind", width: 12 }, { header: "Elements", key: "count", width: 10 }, { header: "Storeys", key: "storeys", width: 30 },
        { header: "Assigned to", key: "team", width: 20 }, { header: "Priority", key: "priority", width: 10 }, { header: "Why it matters", key: "explanation", width: 60 }, { header: "How to fix", key: "fix", width: 60 }]);
      filtered.forEach((g) => { const a = advice[g.key]; gs.addRow({ key: g.key, discipline: g.discipline, title: groupTitle(g), requirement: g.requirement, entity: g.entity, item: g.item, kind: g.kind === "value" ? "Wrong value" : "Missing", count: g.count,
        storeys: g.storeys.slice(0, 6).map((x) => `${x.name} (${x.count})`).join(", "), team: teams[g.discipline] ?? "", priority: a?.priority ?? "", explanation: a?.explanation ?? "", fix: a?.fix ?? "" }).alignment = { wrapText: true, vertical: "top" }; });

      const es = wb.addWorksheet("Failing elements");
      head(es, [{ header: "Group key", key: "key", width: 12 }, { header: "Group", key: "title", width: 50 }, { header: "GUID", key: "guid", width: 26 }, { header: "Name", key: "name", width: 36 }, { header: "IFC class", key: "type", width: 22 }, { header: "Storey", key: "storey", width: 20 }]);
      for (const g of filtered) {
        const title = groupTitle(g);
        const known = new Map(g.samples.map((x) => [x.guid, x]));
        for (const guid of g.guids) { const x = known.get(guid); es.addRow({ key: g.key, title, guid, name: x?.name ?? "", type: x?.type ?? "", storey: x?.storey ?? "" }); }
      }
      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${slug(info?.name ?? "model")}_IDS-QA.xlsx`);
    } catch (e) { setError(e instanceof Error ? e.message : t("Export failed.")); }
    finally { setExporting(""); }
  };

  const busy = !!stage;
  const failingElements = summary ? summary.elementsChecked - summary.elementsPassed : 0;
  const passPct = summary ? pct(summary.elementsPassed, summary.elementsChecked) : 0;

  return (
    <div className="grid mqa" style={{ gap: 16 }}>
      <p className="small muted" style={{ margin: 0, maxWidth: 820 }}>
        {t("Check an IFC model against IDS requirements, see the failures grouped by discipline, ask the AI why each group matters and how to fix it, then hand the issues to the teams as BCF.")}
      </p>
      <p className="small mqa-note">{t("Files stay in your browser. Only the failure summary (counts, property names, storey names and a few element names) is sent to the AI, and only when you click Explain with AI.")}</p>

      {error && <div className="card small danger" role="alert"><div className="row spread"><span>{error}</span><button className="tiny ghost" aria-label={t("Dismiss")} onClick={() => setError("")}>✕</button></div></div>}

      <div className="mqa-steps">
        {/* 1 model */}
        <section className="hub-card">
          <div className="hub-title">{t("1. IFC model")}</div>
          <label className={"mqa-drop" + (over ? " over" : "")} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); loadIfc(e.dataTransfer.files[0]); }}>
            <b>{stage && stage !== "check" ? t(STAGE[stage]) : t("Drop an .ifc file here or click to choose")}</b>
            <span className="tiny muted">{t("IFC 2x3, IFC 4 or IFC 4.3, read in your browser")} · ≤ {MAX_MB} MB</span>
            <input type="file" accept=".ifc" hidden disabled={busy} onChange={(e) => { loadIfc(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {stage && stage !== "check" && <div className="mqa-bar" role="progressbar" aria-label={t(STAGE[stage])}><div /></div>}
          {info && (
            <dl className="mqa-facts small">
              <dt>{t("File")}</dt><dd className="mono">{info.name}</dd>
              <dt>{t("Schema")}</dt><dd>{info.schema || "–"}</dd>
              <dt>{t("Software")}</dt><dd>{info.software || "–"}</dd>
              <dt>{t("Elements")}</dt><dd>{info.elements.toLocaleString()} · {t("Storeys")} {info.storeys}</dd>
              <dt>{t("Read in")}</dt><dd>{info.seconds} s{info.parseErrors ? ` · ${t("Unreadable statements:")} ${info.parseErrors}` : ""}</dd>
            </dl>
          )}
        </section>

        {/* 2 requirements */}
        <section className="hub-card">
          <div className="hub-title">{t("2. Requirements")}</div>
          <div className="row">
            <input ref={idsRef} type="file" accept=".ids,.xml" hidden onChange={(e) => loadIdsFile(e.target.files?.[0])} />
            <button className="small" onClick={() => idsRef.current?.click()}>{t("Load .ids file")}</button>
            <button className="small" onClick={applyDraft} title={hasDraft ? undefined : t("No draft saved in this browser yet")}>{t("Use my IDS builder draft")}</button>
          </div>
          <div className="small muted" style={{ marginBlock: "10px 4px" }}>{t("Or choose IDS presets:")}</div>
          <div className="mqa-presets">
            {IDS_PRESETS.map((p) => (
              <label key={p.id} className="mqa-check" title={t(p.description)}>
                <input type="checkbox" checked={presets.includes(p.id)} onChange={() => togglePreset(p.id)} /> {t(p.label)}
              </label>
            ))}
          </div>
          {reqSet && (
            <div className="hub-tile small" style={{ marginTop: 10 }}>
              <b>{reqSet.label}</b>
              <div>{t("Specifications:")} {reqSet.specs} · {t("Checkable requirements:")} {reqSet.reqs.length}</div>
              {(reqSet.skipped > 0 || reqSet.noChecks > 0) && <div className="muted">{t("Not checked here (classification, material, optional or prohibited facets):")} {reqSet.skipped + reqSet.noChecks}</div>}
            </div>
          )}
        </section>

        {/* 3 run */}
        <section className="hub-card">
          <div className="hub-title">{t("3. Run the check")}</div>
          <p className="small muted" style={{ marginTop: 0 }}>{t("A deterministic check of property sets and attributes. No AI is used in this step.")}</p>
          <button className="primary" disabled={!info || !reqSet?.reqs.length || busy} onClick={runCheck}>{stage === "check" ? t("Checking requirements…") : t("Run check")}</button>
          {!info && <div className="tiny muted" style={{ marginTop: 6 }}>{t("Load an IFC file first.")}</div>}
          {info && !reqSet?.reqs.length && <div className="tiny muted" style={{ marginTop: 6 }}>{t("Choose requirements first.")}</div>}
          {summary && <div className="tiny muted" style={{ marginTop: 6 }}>{t("Checked in")} {summary.seconds} s</div>}
        </section>
      </div>

      {summary && (
        <>
          <div className="grid g4">
            <div className="card stat-card"><span className="small muted">{t("Elements checked")}</span><span className="stat">{summary.elementsChecked.toLocaleString()}</span></div>
            <div className="card stat-card"><span className="small muted">{t("Pass rate")}</span><span className="stat" style={{ color: passPct >= 90 ? "var(--ok, #16a34a)" : passPct >= 60 ? "var(--warn)" : "var(--danger)" }}>{passPct}%</span>
              <div className="mqa-meter"><div style={{ inlineSize: passPct + "%" }} /></div></div>
            <div className="card stat-card"><span className="small muted">{t("Failing elements")}</span><span className="stat">{failingElements.toLocaleString()}</span></div>
            <div className="card stat-card"><span className="small muted">{t("Failing groups")}</span><span className="stat">{groups.length.toLocaleString()}</span></div>
          </div>

          <details className="hub-card">
            <summary className="hub-title" style={{ cursor: "pointer" }}>{t("Results per requirement")}</summary>
            <div className="table-wrap"><table className="data">
              <thead><tr><th>{t("Requirement")}</th><th>{t("IFC class")}</th><th>{t("Checks")}</th><th>{t("Applicable")}</th><th>{t("Passed")}</th><th>{t("Failed")}</th></tr></thead>
              <tbody>{summary.requirements.map((r) => (
                <tr key={r.index}><td>{r.name}</td><td className="mono">{r.entity}</td><td className="small mono">{r.checks.join(", ")}</td><td>{r.applicable}</td><td>{r.passed}</td>
                  <td style={{ color: r.failed ? "var(--danger)" : undefined }}>{r.applicable ? r.failed : <span className="muted">{t("no elements")}</span>}</td></tr>
              ))}</tbody>
            </table></div>
          </details>

          {groups.length === 0 ? (
            <div className="hub-tile"><b>{t("Every checked element meets the requirements.")}</b></div>
          ) : (
            <section className="hub-card">
              <div className="row spread">
                <div className="hub-title">{t("Failing groups")}</div>
                <span className="small muted">{t("Showing")} {filtered.length} / {groups.length}</span>
              </div>
              <div className="row mqa-filters">
                <button className={"chip" + (!disc ? " on" : "")} onClick={() => setDisc("")}>{t("All")} {groups.length}</button>
                {DISCIPLINES.filter((d) => discCounts[d]).map((d) => (
                  <button key={d} className={"chip" + (disc === d ? " on" : "")} onClick={() => setDisc(disc === d ? "" : d)}>{t(DISC_LABEL[d])} {discCounts[d]}</button>
                ))}
                <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label={t("Issue")} style={{ inlineSize: "auto" }}>
                  <option value="">{t("Missing and wrong values")}</option><option value="missing">{t("Missing")}</option><option value="value">{t("Wrong value")}</option>
                </select>
                {ai && <select value={prio} onChange={(e) => setPrio(e.target.value as typeof prio)} aria-label={t("Priority")} style={{ inlineSize: "auto" }}>
                  <option value="">{t("Any priority")}</option><option value="high">{t("High")}</option><option value="medium">{t("Medium")}</option><option value="low">{t("Low")}</option>
                </select>}
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Search property, class, name, GUID…")} aria-label={t("Search")} className="mqa-search" />
              </div>

              <div className="table-wrap"><table className="data mqa-table">
                <thead><tr><th aria-label={t("Expand")} /><th>{t("IFC class")}</th><th>{t("Property / attribute")}</th><th>{t("Issue")}</th><th>{t("Requirement")}</th><th>{t("Elements")}</th><th>{t("Storeys")}</th>{ai && <th>{t("Priority")}</th>}</tr></thead>
                <tbody>
                  {byDisc.map(({ d, rows }) => (
                    <Fragment key={d}>
                      <tr className="mqa-disc"><td colSpan={ai ? 8 : 7} style={{ "--c": DISC_COLOR[d] } as CSSProperties}>{t(DISC_LABEL[d])} · {rows.length}</td></tr>
                      {rows.map((g) => {
                        const a = advice[g.key];
                        const isOpen = open.has(g.key);
                        return (
                          <Fragment key={g.key}>
                            <tr className={isOpen ? "on" : ""}>
                              <td><button className="tiny ghost" aria-expanded={isOpen} aria-label={isOpen ? t("Collapse") : t("Expand")} onClick={() => toggle(g.key)}>{isOpen ? "▾" : "▸"}</button></td>
                              <td>{entityLabel(g.entity)}</td>
                              <td className="mono">{g.item}</td>
                              <td><span className="badge" style={{ color: g.kind === "value" ? "var(--warn)" : "var(--danger)", borderColor: "currentColor", background: "transparent" }}>{g.kind === "value" ? t("Wrong value") : t("Missing")}</span></td>
                              <td className="small">{g.requirement}</td>
                              <td><b>{g.count.toLocaleString()}</b></td>
                              <td className="small muted">{g.storeys.slice(0, 2).map((s) => `${s.name} (${s.count})`).join(", ")}{g.storeys.length > 2 ? " …" : ""}</td>
                              {ai && <td>{a?.priority ? <span className="badge" style={{ color: PRIO_COLOR[a.priority], borderColor: "currentColor", background: "transparent" }}>{t(a.priority === "high" ? "High" : a.priority === "medium" ? "Medium" : "Low")}</span> : "–"}</td>}
                            </tr>
                            {isOpen && (
                              <tr className="mqa-detail"><td colSpan={ai ? 8 : 7}>
                                {a && (a.explanation || a.fix) && (
                                  <div className="mqa-advice">
                                    {a.explanation && <div><b>{t("Why it matters")}</b><p>{a.explanation}</p></div>}
                                    {a.fix && <div><b>{t("How to fix in")} {software}</b><p>{a.fix}</p></div>}
                                  </div>
                                )}
                                <div className="row spread">
                                  <span className="small muted">{t("Sample elements")} ({g.samples.length} / {g.count.toLocaleString()})</span>
                                  <button className="tiny" onClick={() => copy(g)}>{copied === g.key ? t("Copied") : `${t("Copy GUIDs")} (${g.guids.length.toLocaleString()})`}</button>
                                </div>
                                <table className="data mqa-samples">
                                  <thead><tr><th>{t("Name")}</th><th>{t("IFC class")}</th><th>{t("Storey")}</th><th>GUID</th></tr></thead>
                                  <tbody>{g.samples.map((s) => <tr key={s.guid}><td>{s.name}</td><td className="mono small">{s.type}</td><td>{s.storey || "–"}</td><td className="mono small mqa-guid">{s.guid}</td></tr>)}</tbody>
                                </table>
                              </td></tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </Fragment>
                  ))}
                  {!filtered.length && <tr><td colSpan={ai ? 8 : 7} className="muted">{t("No groups match the filters.")}</td></tr>}
                </tbody>
              </table></div>
            </section>
          )}

          {groups.length > 0 && (
            <div className="mqa-steps">
              {/* 4 AI */}
              <section className="hub-card" style={{ "--c": "#7c3aed" } as CSSProperties}>
                <div className="hub-title">{t("4. Explain with AI (optional)")}</div>
                {aiEnabled === false && <div className="hub-tile small" style={{ marginBottom: 10 }}><b>{t("AI isn't switched on yet.")}</b> {t("Once it is, you can get a plain-language explanation, a fix for your authoring software and a priority for each group. The check and exports work without it.")}</div>}
                <div className="row">
                  <label className="small" style={{ display: "grid", gap: 4 }}><span className="muted">{t("Authoring software")}</span>
                    <select value={software} onChange={(e) => setSoftware(e.target.value as Software)} style={{ inlineSize: "auto" }}>
                      {SOFTWARE.map((s) => <option key={s} value={s}>{s === "Other" ? t("Other") : s}</option>)}
                    </select>
                  </label>
                  <button className="primary" style={{ alignSelf: "end" }} disabled={!aiEnabled || aiBusy} onClick={explain}>{aiBusy ? t("Explaining…") : t("Explain with AI")}</button>
                </div>
                <p className="tiny muted">{t("Sends the groups shown (up to 150, largest first) without GUIDs.")}</p>
                {aiError && <p className="small danger">{aiError}</p>}
                {ai && (
                  <div className="mqa-ai small">
                    {ai.summary && <p>{ai.summary}</p>}
                    {ai.nextSteps.length > 0 && <><b>{t("Next steps")}</b><ol>{ai.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol></>}
                    <p className="tiny muted">{t("AI advice is decision support. Check each fix against the EIR and your project's standards before you change the model.")}</p>
                  </div>
                )}
              </section>

              {/* 5 export */}
              <section className="hub-card">
                <div className="hub-title">{t("5. Export")}</div>
                <details>
                  <summary className="small" style={{ cursor: "pointer" }}>{t("Assign groups to task teams (BCF Assigned to)")}</summary>
                  <div className="mqa-teams">
                    {DISCIPLINES.filter((d) => discCounts[d]).map((d) => (
                      <label key={d} className="small"><span className="muted">{t(DISC_LABEL[d])}</span>
                        <input value={teams[d] ?? ""} onChange={(e) => setTeams((x) => ({ ...x, [d]: e.target.value.slice(0, 120) }))} placeholder={t("e.g. team e-mail or name")} /></label>
                    ))}
                  </div>
                </details>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="primary" disabled={!filtered.length || !!exporting} onClick={exportBcf}>{exporting === "bcf" ? t("Exporting…") : t("Download BCF 2.1 (.bcfzip)")}</button>
                  <button disabled={!filtered.length || !!exporting} onClick={exportExcel}>{exporting === "xlsx" ? t("Exporting…") : t("Download Excel report")}</button>
                </div>
                <p className="tiny muted">{t("One BCF topic per group shown, with the failing elements selected in its viewpoint (up to 500 per topic).")}</p>
                <p className="small">{t("Next: open the .bcfzip in")} <a href="#/bim-tools/bcf">{t("BCF studio")}</a> {t("to review, edit and assign the topics, or import it into Revit, Solibri, BIMcollab or ACC.")}</p>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
