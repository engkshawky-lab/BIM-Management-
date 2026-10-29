import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useSession } from "../App";
import { api, type Project } from "../lib/api";
import { useProjectData } from "../lib/projectStore";
import { tr } from "../i18nDom";
import { INFO_USES } from "../../../shared/data/infoUses";
import {
  CLASSIFICATIONS, DOC_INPUTS, HARD_MINIMUM, NAMING_FIELDS, ORDER, PROJECT_TYPES, STAGE_SCHEMES, STANDARDS,
  docKind, hardMinimumGaps, missingDocInputs, missingPrerequisites, type DocKind, type ProjectData,
} from "../../../shared/projectData";
import { TONES } from "./hubTheme";

// Project data: the common data every ISO 19650 document reuses, the hard minimum that must exist before any
// document is generated, the inputs specific to each document, and the generation order.

const cv = (c: string) => ({ "--c": c }) as CSSProperties;
const DOC_LABEL: Record<DocKind, string> = { OIR: "OIR", AIR: "AIR", PIR: "PIR", EIR: "EIR", "BEP-PRE": "BEP (pre-appointment)", TIDP: "TIDP", MIDP: "MIDP", "BEP-POST": "BEP (post-appointment)" };

/** Whether a document of this type may be generated, and why not. */
export function useGenerationReady(docType: string | undefined) {
  const [p] = useProjectData();
  const kind = docType ? docKind(docType) : undefined;
  const gaps = hardMinimumGaps(p), inputs = missingDocInputs(p, kind), prereqs = missingPrerequisites(p, kind);
  return { p, kind, gaps, inputs, prereqs, ready: !gaps.length && !inputs.length };
}

function DocInputsForm({ kind }: { kind: DocKind }) {
  const [p, setP] = useProjectData();
  const list = DOC_INPUTS[kind] ?? [];
  const v = p.docInputs[kind] ?? {};
  return (
    <div className="grid g2">{list.map((i) => (
      <label key={i.key} className="small" style={{ display: "grid", gap: 4, margin: 0, fontWeight: 400 }}>
        <span className="muted">{i.label}{i.required && <b style={{ color: "var(--danger)" }}> *</b>}</span>
        {i.long ? <textarea value={v[i.key] ?? ""} placeholder={i.hint} onChange={(e) => setP({ ...p, docInputs: { ...p.docInputs, [kind]: { ...v, [i.key]: e.target.value } } })} style={{ minHeight: 60, ...(i.required && !(v[i.key] ?? "").trim() ? { borderColor: "var(--warn)" } : {}) }} />
          : <input value={v[i.key] ?? ""} placeholder={i.hint} onChange={(e) => setP({ ...p, docInputs: { ...p.docInputs, [kind]: { ...v, [i.key]: e.target.value } } })} style={i.required && !(v[i.key] ?? "").trim() ? { borderColor: "var(--warn)" } : undefined} />}
      </label>))}</div>
  );
}

/** Shown above every generator: hard minimum status, this document's inputs, and order warnings. */
export function ProjectDataGate({ docType, what }: { docType?: string; what: string }) {
  const r = useGenerationReady(docType);
  const [open, setOpen] = useState(false);
  const ok = !r.gaps.length;
  return (
    <div className="hub-card" style={{ ...cv(r.ready ? "var(--ok)" : "var(--danger)"), display: "grid", gap: 10 }}>
      <div className="row spread">
        <div><b>Project data — hard minimum for {what}</b><div className="small muted">Entered once on the Project data page and reused by every document.</div></div>
        <div className="row"><span className="badge" style={{ background: ok ? "var(--ok)" : "var(--danger)", color: "#fff", borderColor: "transparent" }}>{ok ? "✓ 8 of 8" : `${8 - r.gaps.length} of 8`}</span><a href="#/project-data"><button className="small">{ok ? "Edit project data" : "Complete project data →"}</button></a></div>
      </div>
      {!ok && <div className="grid g2">{r.gaps.map((g) => <div key={g.id} className="small" style={{ color: "var(--danger)" }}>✗ <b>{g.label}:</b> {g.reason}</div>)}</div>}
      {r.kind && DOC_INPUTS[r.kind] && <div style={{ display: "grid", gap: 8 }}>
        <div className="row spread"><b className="small">Inputs specific to the {DOC_LABEL[r.kind]}{r.inputs.length ? ` · ${r.inputs.length} required still empty` : " · ✓ complete"}</b>
          <button className="ghost small" onClick={() => setOpen(!open)}>{open || r.inputs.length ? "▾" : "▸ Show"}</button></div>
        {(open || r.inputs.length > 0) && <DocInputsForm kind={r.kind} />}
      </div>}
      {r.prereqs.length > 0 && <div className="hub-tile small" style={cv(TONES.amber)}><b>Generation order:</b> ISO 19650 documents feed each other. Not produced yet: {r.prereqs.map((k) => DOC_LABEL[k]).join(" → ")}. You can continue, but the draft will assume their content.</div>}
    </div>
  );
}

// ---------------------------------------------------------------- page

function Section({ n, title, done, children }: { n: number; title: string; done?: boolean; children: ReactNode }) {
  return <div className="hub-card" style={{ ...cv(done === undefined ? "var(--hub)" : done ? "var(--ok)" : "var(--danger)"), display: "grid", gap: 10 }}>
    <div className="hub-title" style={{ ...cv(done === undefined ? "var(--hub)" : done ? "var(--ok)" : "var(--danger)"), margin: 0 }}>{n}. {title}{done !== undefined && (done ? " ✓" : " — required")}</div>{children}</div>;
}

function FillFromProject() {
  const { toast } = useSession();
  const [, setP] = useProjectData();
  const [projects, setProjects] = useState<Project[]>([]);
  const [id, setId] = useState("");
  useEffect(() => { api<{ projects: Project[] }>("/projects").then((r) => setProjects(r.projects)).catch(() => undefined); }, []);
  if (!projects.length) return null;
  const fill = async () => {
    try {
      const { project } = await api<{ project: Project }>(`/projects/${id}`);
      const b = await api<{ teams: { name: string; organization: string }[]; milestones: { id: string; name: string; date: string }[]; deliverables: { title: string; typeCode: string; formats?: string[] | null; milestoneId: string | null }[] }>(`/projects/${id}/delivery`).catch(() => null);
      const ms = new Map((b?.milestones ?? []).map((m) => [m.id, m.name]));
      setP((p) => ({
        ...p, name: project.name || p.name, code: project.code || p.code, client: project.appointingParty || p.client, location: project.location || p.location, description: project.description || p.description,
        stages: b?.milestones.length ? b.milestones.map((m) => ({ code: "", name: m.name, start: "", end: m.date })) : p.stages,
        disciplines: b?.teams.length ? b.teams.map((t) => ({ discipline: t.name, organisation: t.organization, lead: "" })) : p.disciplines,
        deliverables: b?.deliverables.length ? b.deliverables.slice(0, 200).map((d) => ({ name: d.title, format: d.formats?.join(", ") || d.typeCode, milestone: (d.milestoneId && ms.get(d.milestoneId)) || "" })) : p.deliverables,
        standards: [...new Set([...p.standards, ...(project.standards.includes("iso19650") ? ["ISO 19650-1", "ISO 19650-2"] : [])])],
      }));
      toast(`Filled from ${project.code} — check and complete the rest.`);
    } catch (e) { toast((e as Error).message, "error"); }
  };
  return <div className="row small"><span className="muted">Fill from a portal project:</span><select value={id} onChange={(e) => setId(e.target.value)} style={{ width: "auto" }}><option value="">{tr("Choose a project…")}</option>{projects.map((x) => <option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select><button className="small" disabled={!id} onClick={fill}>Fill</button></div>;
}

export default function ProjectDataPage() {
  const [p, setP] = useProjectData();
  const [docTab, setDocTab] = useState<DocKind>("EIR");
  const gaps = hardMinimumGaps(p), has = (id: string) => !gaps.some((g) => g.id === id);
  const set = (k: keyof ProjectData) => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value });
  const inp = (k: keyof ProjectData, label: string, ph = "", req = false) => <label className="small" style={{ display: "grid", gap: 4, margin: 0, fontWeight: 400 }}><span className="muted">{label}{req && <b style={{ color: "var(--danger)" }}> *</b>}</span><input value={String(p[k] ?? "")} placeholder={ph} onChange={set(k)} /></label>;
  const rows = <K extends "stages" | "disciplines" | "deliverables">(k: K, i: number, patch: Partial<ProjectData[K][number]>) => setP({ ...p, [k]: (p[k] as ProjectData[K][number][]).map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const del = (k: "stages" | "disciplines" | "deliverables", i: number) => setP({ ...p, [k]: (p[k] as unknown[]).filter((_, j) => j !== i) });
  const stageNames = p.stages.map((s) => s.name).filter(Boolean);
  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">ISO 19650 · MANDATORY INPUT DATA</div><h1>Project data</h1>
        <p>Enter the common project data once; every document reuses it. Without the eight hard-minimum inputs no document can be generated. Everything else can default to a template and be refined later.</p>
        <div className="facts"><span>Hard minimum {8 - gaps.length} of 8</span><span>Saved in this browser</span><span>Used by the AI drafts and every export</span></div></div>

      <div className="hub-card" style={{ ...cv(gaps.length ? "var(--danger)" : "var(--ok)"), display: "grid", gap: 8 }}>
        <div className="row spread"><b>Hard minimum for a first draft</b><FillFromProject /></div>
        <div className="grid g4">{HARD_MINIMUM.map((h, i) => { const ok = has(h.id); return <div key={h.id} className="hub-tile small" style={cv(ok ? TONES.green : TONES.red)}><b>{ok ? "✓" : "✗"} {i + 1}. {h.label}</b>{!ok && <div className="muted">{gaps.find((g) => g.id === h.id)?.reason}</div>}</div>; })}</div>
      </div>

      <Section n={1} title="Project and client" done={has("identity")}>
        <div className="grid g4">{inp("name", "Project name", "e.g. Riverside Clinic", true)}{inp("code", "Project code", "e.g. RVC", true)}{inp("client", "Appointing party (client)", "e.g. Example Health Trust", true)}{inp("location", "Location", "City, site")}
          {inp("clientContact", "Client contact", "Name, email")}{inp("authorisedRep", "Client's authorised representative", "Name, role")}
          <label className="small" style={{ display: "grid", gap: 4, margin: 0, fontWeight: 400 }}><span className="muted">Project type</span><select value={p.projectType} onChange={set("projectType")}><option value="">{tr("Select…")}</option>{PROJECT_TYPES.map((t) => <option key={t} value={t}>{tr(t)}</option>)}</select></label>
          {inp("assetType", "Asset type", "e.g. hospital, highway, substation")}</div>
        <label className="small" style={{ display: "grid", gap: 4, margin: 0, fontWeight: 400 }}><span className="muted">Short description</span><textarea value={p.description} onChange={set("description")} style={{ minHeight: 50 }} /></label>
      </Section>

      <Section n={2} title="Project stages with dates" done={has("stages")}>
        <div className="row small"><span className="muted">Quick fill:</span>{Object.entries(STAGE_SCHEMES).map(([k, list]) => <button key={k} className="small" onClick={() => setP({ ...p, stages: list.map((name, i) => ({ code: k.startsWith("RIBA") ? String(i) : "", name: k.startsWith("RIBA") ? name.replace(/^\d\s/, "") : name, start: "", end: "" })) })}>{k}</button>)}</div>
        <div className="table-wrap"><table className="data hub-table"><thead><tr><th>Code</th><th>Stage</th><th>Start</th><th>End / milestone date</th><th /></tr></thead>
          <tbody>{p.stages.map((s, i) => <tr key={i}><td><input className="cell-input" value={s.code} onChange={(e) => rows("stages", i, { code: e.target.value })} style={{ width: 60 }} /></td><td><input className="cell-input" value={s.name} onChange={(e) => rows("stages", i, { name: e.target.value })} /></td><td><input className="cell-input" type="date" value={s.start} onChange={(e) => rows("stages", i, { start: e.target.value })} /></td><td><input className="cell-input" type="date" value={s.end} onChange={(e) => rows("stages", i, { end: e.target.value })} /></td><td><button className="ghost small" onClick={() => del("stages", i)}>✕</button></td></tr>)}</tbody></table></div>
        <div><button className="small" onClick={() => setP({ ...p, stages: [...p.stages, { code: "", name: "", start: "", end: "" }] })}>+ Add stage</button></div>
      </Section>

      <Section n={3} title="Disciplines and responsible organisations" done={has("disciplines")}>
        <div className="table-wrap"><table className="data hub-table"><thead><tr><th>Discipline / task team</th><th>Organisation</th><th>Lead (name / role)</th><th /></tr></thead>
          <tbody>{p.disciplines.map((d, i) => <tr key={i}><td><input className="cell-input" value={d.discipline} onChange={(e) => rows("disciplines", i, { discipline: e.target.value })} /></td><td><input className="cell-input" value={d.organisation} onChange={(e) => rows("disciplines", i, { organisation: e.target.value })} /></td><td><input className="cell-input" value={d.lead} onChange={(e) => rows("disciplines", i, { lead: e.target.value })} /></td><td><button className="ghost small" onClick={() => del("disciplines", i)}>✕</button></td></tr>)}</tbody></table></div>
        <div className="row"><button className="small" onClick={() => setP({ ...p, disciplines: [...p.disciplines, { discipline: "", organisation: "", lead: "" }] })}>+ Add discipline</button>
          {!p.disciplines.length && <button className="small ghost" onClick={() => setP({ ...p, disciplines: ["Architecture", "Structure", "MEP", "Civil"].map((d) => ({ discipline: d, organisation: "", lead: "" })) })}>Start with Architecture, Structure, MEP, Civil</button>}</div>
      </Section>

      <Section n={4} title="Information purposes (uses of BIM)" done={has("purposes")}>
        <div className="row">{INFO_USES.map((u) => { const on = p.purposes.includes(u.name); return <button key={u.code} className={"chip" + (on ? " on" : "")} title={u.description} onClick={() => setP({ ...p, purposes: on ? p.purposes.filter((x) => x !== u.name) : [...p.purposes, u.name] })}>{u.name}</button>; })}</div>
        <div className="small muted">{p.purposes.length} selected. They drive the LOIN, the deliverables and the capability the appointed parties must show.</div>
      </Section>

      <Section n={5} title="Project information standard: naming, codes, classification" done={has("naming") && has("classification")}>
        <div className="small muted">Naming convention fields, in order (ISO 19650-2 naming, UK National Annex style by default):</div>
        <div className="row">{p.namingFields.map((f, i) => <span key={i} className="row" style={{ gap: 2 }}><input className="cell-input" value={f} style={{ width: 130 }} onChange={(e) => setP({ ...p, namingFields: p.namingFields.map((x, j) => (j === i ? e.target.value : x)) })} /><button className="ghost small" onClick={() => setP({ ...p, namingFields: p.namingFields.filter((_, j) => j !== i) })}>✕</button></span>)}
          <button className="small" onClick={() => setP({ ...p, namingFields: [...p.namingFields, ""] })}>+ Field</button><button className="small ghost" onClick={() => setP({ ...p, namingFields: [...NAMING_FIELDS] })}>Reset to ISO order</button></div>
        <div className="row small"><span className="muted">Separator</span><input className="cell-input" value={p.separator} onChange={set("separator")} style={{ width: 40 }} /><span className="muted">Preview:</span><code className="no-i18n">{p.namingFields.filter(Boolean).map((f) => f.replace(/\s*\/.*$/, "").toUpperCase().slice(0, 6)).join(p.separator || "-")}</code></div>
        <div className="grid g4">{inp("statusCodes", "Status / suitability codes")}{inp("revisionCodes", "Revision codes")}
          <label className="small" style={{ display: "grid", gap: 4, margin: 0, fontWeight: 400 }}><span className="muted">Classification system<b style={{ color: "var(--danger)" }}> *</b></span><select value={p.classification} onChange={set("classification")}><option value="">{tr("Select…")}</option>{CLASSIFICATIONS.map((c) => <option key={c} value={c}>{tr(c)}</option>)}</select></label>
          {inp("units", "Units")}{inp("coordinateSystem", "Coordinate system", "e.g. OSGB36 / British National Grid")}{inp("basePoint", "Project base point", "E, N, elevation")}{inp("surveyPoint", "Survey point", "E, N, elevation")}</div>
      </Section>

      <Section n={6} title="CDE and standards" done={has("cde")}>
        <div className="grid g4">{inp("cde", "CDE platform", "e.g. Autodesk Construction Cloud", true)}{inp("cdeStates", "CDE workflow states")}{inp("nationalAnnex", "National Annex", "e.g. UK National Annex")}{inp("localMandate", "Local BIM mandate", "e.g. Dubai Municipality circular")}</div>
        <div className="row">{STANDARDS.map((s) => { const on = p.standards.includes(s); return <button key={s} className={"chip no-i18n" + (on ? " on" : "")} onClick={() => setP({ ...p, standards: on ? p.standards.filter((x) => x !== s) : [...p.standards, s] })}>{s}</button>; })}</div>
      </Section>

      <Section n={7} title="Deliverables list with formats and milestones" done={has("deliverables")}>
        <div className="table-wrap"><table className="data hub-table"><thead><tr><th>Deliverable</th><th>Format(s)</th><th>Milestone / stage</th><th /></tr></thead>
          <tbody>{p.deliverables.map((d, i) => <tr key={i}><td><input className="cell-input" value={d.name} onChange={(e) => rows("deliverables", i, { name: e.target.value })} /></td><td><input className="cell-input" value={d.format} placeholder="e.g. IFC 4, PDF, COBie" onChange={(e) => rows("deliverables", i, { format: e.target.value })} /></td>
            <td>{stageNames.length ? <select className="cell-input" value={d.milestone} onChange={(e) => rows("deliverables", i, { milestone: e.target.value })}><option value="">—</option>{stageNames.map((s) => <option key={s} value={s}>{s}</option>)}</select> : <input className="cell-input" value={d.milestone} onChange={(e) => rows("deliverables", i, { milestone: e.target.value })} />}</td>
            <td><button className="ghost small" onClick={() => del("deliverables", i)}>✕</button></td></tr>)}</tbody></table></div>
        <div className="row"><button className="small" onClick={() => setP({ ...p, deliverables: [...p.deliverables, { name: "", format: "", milestone: "" }] })}>+ Add deliverable</button>
          {!p.deliverables.length && stageNames.length > 0 && <button className="small ghost" onClick={() => setP({ ...p, deliverables: [["Federated design models", "IFC 4 + native"], ["Drawings", "PDF"], ["Specifications", "PDF"], ["Asset data", "COBie 2.4 XLSX"]].map(([name, format], i) => ({ name, format, milestone: i === 3 ? stageNames[stageNames.length - 1] : stageNames[Math.min(2, stageNames.length - 1)] })) })}>Start with a typical list</button>}</div>
      </Section>

      <Section n={8} title="Inputs specific to each document">
        <div className="small muted">These are asked again inside the generator for the document you pick. Required ones are marked *.</div>
        <div className="hub-tabs">{(Object.keys(DOC_INPUTS) as DocKind[]).map((k) => { const m = missingDocInputs(p, k).length; return <a key={k} className={docTab === k ? "on" : ""} href="#" onClick={(e) => { e.preventDefault(); setDocTab(k); }}>{DOC_LABEL[k]} {m ? <span style={{ color: "var(--danger)" }}>· {m}</span> : <span style={{ color: "var(--ok)" }}>✓</span>}</a>; })}</div>
        <DocInputsForm kind={docTab} />
      </Section>

      <Section n={9} title="Generation order">
        <div className="small muted">Under ISO 19650 these documents feed each other in a fixed order, so the inputs build up step by step.</div>
        <div className="hub-flow">{ORDER.map((o, i) => { const done = !!p.generated[o.kind] || (o.kind === "AIR" && !!p.generated.PIR); return <div key={o.kind} style={cv(done ? TONES.green : "var(--hub)")}><b>{i + 1}. {done ? "✓ " : ""}{o.label}</b><span>{done ? `Produced ${p.generated[o.kind] ?? p.generated.PIR}` : o.needs.length ? `Needs: ${o.needs.map((n) => DOC_LABEL[n]).join(", ")}` : "Start here"}</span></div>; })}</div>
        <div className="row"><a href="#/ai-tools/generate"><button className="primary">Open the document generator</button></a><a href="#/ai-tools/plans"><button>Open delivery plans (TIDP / MIDP)</button></a>
          {Object.keys(p.generated).length > 0 && <button className="ghost small" onClick={() => setP({ ...p, generated: {} })}>Clear the produced marks</button>}</div>
      </Section>
    </div>
  );
}
