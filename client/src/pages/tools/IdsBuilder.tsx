import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { saveAs } from "file-saver";
import { api } from "../../lib/api";
import { t } from "../../i18n";
import {
  CARDINALITIES, IDS_PRESETS, IFC_ENTITIES, IFC_VERSIONS, REQ_KINDS, buildIds, emptyReq, emptySpec, parseIds, validateIds,
  type Cardinality, type IdsDoc, type IdsInfo, type IdsReq, type IdsReqKind, type IdsSpec, type IfcVersion,
} from "../../../../shared/ids";
import "./ids.css";

// IDS builder: author buildingSMART IDS 1.0 files for Revit, Solibri, BIMcollab, usBIM and the platform's own model checks.

const KEY = "bim:ids:draft";
const PICKER = ["IfcWall", "IfcDoor", "IfcWindow", "IfcSlab", "IfcBeam", "IfcColumn", "IfcSpace", "IfcStair", "IfcRoof", "IfcCovering", "IfcFurniture", "IfcFlowTerminal",
  "IfcPipeSegment", "IfcDuctSegment", "IfcBuildingStorey", "IfcBuilding", "IfcSite", "IfcProject"];
const ENTITY_OPTIONS = [...PICKER, ...IFC_ENTITIES.filter((e) => !PICKER.includes(e))];
const DATA_TYPES = ["IFCLABEL", "IFCTEXT", "IFCIDENTIFIER", "IFCBOOLEAN", "IFCLOGICAL", "IFCREAL", "IFCINTEGER", "IFCLENGTHMEASURE", "IFCPOSITIVELENGTHMEASURE",
  "IFCAREAMEASURE", "IFCVOLUMEMEASURE", "IFCMASSMEASURE", "IFCPLANEANGLEMEASURE", "IFCTHERMALTRANSMITTANCEMEASURE", "IFCPOWERMEASURE", "IFCDATE", "IFCDATETIME", "IFCDURATION"];
const ATTRIBUTES = ["Name", "Description", "LongName", "ObjectType", "Tag", "GlobalId", "PredefinedType"];
const PSETS = ["Pset_DoorCommon", "Pset_WindowCommon", "Pset_WallCommon", "Pset_SlabCommon", "Pset_BeamCommon", "Pset_ColumnCommon", "Pset_SpaceCommon", "Pset_RoofCommon",
  "Pset_CoveringCommon", "Pset_StairCommon", "Pset_ManufacturerTypeInformation", "Pset_ManufacturerOccurrence", "Pset_Warranty", "Pset_ServiceLife", "Pset_Condition",
  "Qto_SpaceBaseQuantities", "Qto_WallBaseQuantities", "Qto_SlabBaseQuantities", "Qto_DoorBaseQuantities", "Qto_WindowBaseQuantities"];
const KIND_LABEL: Record<IdsReqKind, string> = { attribute: "Attribute", property: "Property", classification: "Classification", material: "Material" };
const CARD_LABEL: Record<Cardinality, string> = { required: "Required", optional: "Optional", prohibited: "Prohibited" };

const blankDoc = (): IdsDoc => ({ info: { title: "", date: new Date().toISOString().slice(0, 10) }, specs: [{ ...emptySpec(), name: "New specification" }] });

function loadDraft(): IdsDoc {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blankDoc();
    const d = JSON.parse(raw) as IdsDoc;
    if (d && typeof d === "object" && d.info && typeof d.info.title === "string" && Array.isArray(d.specs)
      && d.specs.every((s) => s && typeof s.name === "string" && Array.isArray(s.ifcVersion) && s.applicability && typeof s.applicability.entity === "string" && Array.isArray(s.requirements)))
      return d;
  } catch { /* unreadable draft: start fresh */ }
  return blankDoc();
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const slug = (s: string) => s.trim().replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "requirements";

export default function IdsBuilder() {
  const [doc, setDoc] = useState<IdsDoc>(loadDraft);
  const [sel, setSel] = useState(0);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [presetOpen, setPresetOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(doc)); } catch { /* storage full or blocked */ } }, [doc]);
  useEffect(() => { if (sel > doc.specs.length - 1) setSel(Math.max(0, doc.specs.length - 1)); }, [doc.specs.length, sel]);

  const xml = useMemo(() => buildIds(doc), [doc]);
  const issues = useMemo(() => validateIds(doc), [doc]);
  const errorsBySpec = useMemo(() => new Set(issues.filter((i) => i.level === "error" && i.spec !== undefined).map((i) => i.spec)), [issues]);
  const errorCount = issues.filter((i) => i.level === "error").length;

  const setInfo = (patch: Partial<IdsInfo>) => setDoc((d) => ({ ...d, info: { ...d.info, ...patch } }));
  const setSpecs = (fn: (specs: IdsSpec[]) => IdsSpec[]) => setDoc((d) => ({ ...d, specs: fn(d.specs) }));
  const updateSpec = (k: number, patch: Partial<IdsSpec>) => setSpecs((ss) => ss.map((s, i) => (i === k ? { ...s, ...patch } : s)));
  const addSpecs = (add: IdsSpec[]) => { setSpecs((ss) => { setSel(ss.length); return [...ss, ...add.map(clone)]; }); };
  const move = (k: number, dir: -1 | 1) => setSpecs((ss) => {
    const j = k + dir; if (j < 0 || j >= ss.length) return ss;
    const next = [...ss]; [next[k], next[j]] = [next[j], next[k]]; setSel(j); return next;
  });
  const duplicate = (k: number) => setSpecs((ss) => { const c = clone(ss[k]); c.name = `${c.name} (copy)`; setSel(k + 1); return [...ss.slice(0, k + 1), c, ...ss.slice(k + 1)]; });
  const remove = (k: number) => { if (!window.confirm(t("Delete this specification?"))) return; setSpecs((ss) => ss.filter((_, i) => i !== k)); };

  const download = () => saveAs(new Blob([xml], { type: "application/xml;charset=utf-8" }), `${slug(doc.info.title)}.ids`);
  const copy = async () => {
    try { await navigator.clipboard.writeText(xml); setNotice({ kind: "ok", text: t("XML copied to the clipboard.") }); }
    catch { setNotice({ kind: "error", text: t("Copy failed. Select the XML preview and copy it manually.") }); }
  };
  const importFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const parsed = parseIds(await f.text());
      if (!parsed.specs.length) { setNotice({ kind: "error", text: t("No specifications found in that file. Is it a buildingSMART IDS file?") }); return; }
      const hasWork = doc.specs.some((s) => s.requirements.length || s.applicability.entity);
      const replace = !hasWork || window.confirm(t("Replace the current draft with the imported file? Choose Cancel to append its specifications instead."));
      if (replace) { setDoc({ info: { ...parsed.info, title: parsed.info.title || f.name.replace(/\.\w+$/, "") }, specs: parsed.specs }); setSel(0); }
      else addSpecs(parsed.specs);
      setNotice({ kind: "ok", text: `${t("Imported specifications:")} ${parsed.specs.length}` });
    } catch { setNotice({ kind: "error", text: t("Could not read that file.") }); }
    finally { if (fileRef.current) fileRef.current.value = ""; }
  };
  const reset = () => { if (window.confirm(t("Start a new IDS? The current draft will be cleared."))) { setDoc(blankDoc()); setSel(0); } };

  const spec = doc.specs[sel];

  return (
    <div className="grid" style={{ gap: 16 }}>
      <datalist id="ids-entities">{ENTITY_OPTIONS.map((e) => <option key={e} value={e} />)}</datalist>
      <datalist id="ids-datatypes">{DATA_TYPES.map((e) => <option key={e} value={e} />)}</datalist>
      <datalist id="ids-attributes">{ATTRIBUTES.map((e) => <option key={e} value={e} />)}</datalist>
      <datalist id="ids-psets">{PSETS.map((e) => <option key={e} value={e} />)}</datalist>

      <div className="row spread">
        <p className="small muted" style={{ margin: 0, maxWidth: 760 }}>
          Write a buildingSMART IDS 1.0 file that model checkers such as Solibri, BIMcollab, usBIM, Revit add-ins and this platform's Validation page can read. Your draft is saved in this browser.
        </p>
        <div className="row">
          <input ref={fileRef} type="file" accept=".ids,.xml" hidden onChange={(e) => importFile(e.target.files?.[0])} />
          <button className="small" onClick={() => fileRef.current?.click()}>Import .ids</button>
          <button className="small ghost" onClick={reset}>New IDS</button>
        </div>
      </div>

      {notice && (
        <div className={`card small ${notice.kind === "error" ? "danger" : ""}`} role="status">
          <div className="row spread"><span>{notice.text}</span><button className="tiny ghost" aria-label={t("Dismiss")} onClick={() => setNotice(null)}>✕</button></div>
        </div>
      )}

      <section className="hub-card" style={{ "--c": "#0e7490" } as CSSProperties}>
        <div className="hub-title">Information</div>
        <div className="grid g3">
          <div><label>Title *</label><input value={doc.info.title} onChange={(e) => setInfo({ title: e.target.value })} placeholder={t("e.g. Project X – Stage 4 handover IDS")} /></div>
          <div><label>Author (e-mail)</label><input type="email" value={doc.info.author ?? ""} onChange={(e) => setInfo({ author: e.target.value })} placeholder="name@company.com" /></div>
          <div><label>Version</label><input value={doc.info.version ?? ""} onChange={(e) => setInfo({ version: e.target.value })} placeholder="1.0" /></div>
          <div><label>Date</label><input type="date" value={doc.info.date ?? ""} onChange={(e) => setInfo({ date: e.target.value })} /></div>
          <div><label>Purpose</label><input value={doc.info.purpose ?? ""} onChange={(e) => setInfo({ purpose: e.target.value })} placeholder={t("e.g. Asset information handover")} /></div>
          <div><label>Milestone</label><input value={doc.info.milestone ?? ""} onChange={(e) => setInfo({ milestone: e.target.value })} placeholder={t("e.g. RIBA Stage 4")} /></div>
          <div><label>Copyright</label><input value={doc.info.copyright ?? ""} onChange={(e) => setInfo({ copyright: e.target.value })} /></div>
        </div>
        <label>Description</label>
        <textarea rows={2} value={doc.info.description ?? ""} onChange={(e) => setInfo({ description: e.target.value })} />
      </section>

      <section className="hub-card" style={{ "--c": "#4f46e5" } as CSSProperties}>
        <div className="row spread" style={{ marginBottom: 10 }}>
          <div className="hub-title" style={{ margin: 0 }}>Specifications</div>
          <div className="row">
            <button className="small primary" onClick={() => addSpecs([{ ...emptySpec(), name: t("New specification") }])}>+ Add specification</button>
            <div className="ids-menu">
              <button className="small" aria-expanded={presetOpen} onClick={() => setPresetOpen((o) => !o)}>Add preset ▾</button>
              {presetOpen && (
                <div className="ids-menu-list" role="menu">
                  {IDS_PRESETS.map((p) => (
                    <button key={p.id} role="menuitem" onClick={() => { addSpecs([p.spec]); setPresetOpen(false); }}>
                      <b className="small">{t(p.label)}</b><div className="tiny muted">{t(p.description)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ids-layout">
          <div className="ids-speclist">
            {doc.specs.length === 0 && <div className="small muted">No specifications yet. Add one or start from a preset.</div>}
            {doc.specs.map((s, k) => (
              <div key={k} className={`ids-specitem ${k === sel ? "on" : ""}`}>
                {errorsBySpec.has(k) && <span className="ids-err" title={t("Has errors")}>!</span>}
                <button className="linklike small" onClick={() => setSel(k)} title={s.name}>
                  <b>{k + 1}.</b> {s.name || t("(unnamed)")} <span className="tiny muted mono">{s.applicability.entity.split("|")[0]}</span>
                </button>
                <button className="ids-iconbtn ghost" aria-label={t("Move up")} title={t("Move up")} disabled={k === 0} onClick={() => move(k, -1)}>↑</button>
                <button className="ids-iconbtn ghost" aria-label={t("Move down")} title={t("Move down")} disabled={k === doc.specs.length - 1} onClick={() => move(k, 1)}>↓</button>
                <button className="ids-iconbtn ghost" aria-label={t("Duplicate")} title={t("Duplicate")} onClick={() => duplicate(k)}>⧉</button>
                <button className="ids-iconbtn ghost danger" aria-label={t("Delete")} title={t("Delete")} onClick={() => remove(k)}>✕</button>
              </div>
            ))}
          </div>

          {spec ? <SpecEditor spec={spec} onChange={(patch) => updateSpec(sel, patch)} /> : <div className="card muted small">Select or add a specification to edit it.</div>}
        </div>
      </section>

      <AiExtract onAdd={(specs) => { addSpecs(specs); setNotice({ kind: "ok", text: `${t("Specifications added by AI, review each one before export:")} ${specs.length}` }); }} />

      <section className="hub-card" style={{ "--c": errorCount ? "#dc2626" : "#16a34a" } as CSSProperties}>
        <div className="hub-title">Checks</div>
        {issues.length === 0 ? <div className="small">No problems found. The file is ready to export.</div> : (
          <ul className="ids-issues small">
            {issues.map((i, k) => (
              <li key={k} className={i.level}>
                {i.spec !== undefined && <button className="linklike" onClick={() => setSel(i.spec!)}><b>{doc.specs[i.spec]?.name || `#${i.spec + 1}`}</b>: </button>}
                {t(i.message)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="hub-card" style={{ "--c": "#0f766e" } as CSSProperties}>
        <div className="row spread">
          <div className="hub-title" style={{ margin: 0 }}>Export</div>
          <div className="row">
            <button className="small" onClick={copy}>Copy XML</button>
            <button className="small primary" onClick={download} disabled={!doc.specs.length}>Download .ids</button>
          </div>
        </div>
        {errorCount > 0 && <p className="small ids-note">There are errors above. You can still download, but checkers may reject the file.</p>}
        <details style={{ marginTop: 10 }}>
          <summary className="small">XML preview</summary>
          <pre className="ids-xml mono no-i18n">{xml}</pre>
        </details>
      </section>
    </div>
  );
}

function SpecEditor({ spec, onChange }: { spec: IdsSpec; onChange: (patch: Partial<IdsSpec>) => void }) {
  const setReq = (k: number, q: IdsReq) => onChange({ requirements: spec.requirements.map((r, i) => (i === k ? q : r)) });
  const toggleVersion = (v: IfcVersion) => onChange({ ifcVersion: spec.ifcVersion.includes(v) ? spec.ifcVersion.filter((x) => x !== v) : IFC_VERSIONS.filter((x) => x === v || spec.ifcVersion.includes(x)) });
  return (
    <div className="card" style={{ minWidth: 0 }}>
      <div className="grid g2">
        <div><label>Specification name *</label><input value={spec.name} onChange={(e) => onChange({ name: e.target.value })} /></div>
        <div><label>Applicability cardinality</label>
          <select value={spec.cardinality ?? "required"} onChange={(e) => onChange({ cardinality: e.target.value as Cardinality })}>
            <option value="required">{t("Required – at least one such element must exist")}</option>
            <option value="optional">{t("Optional – check only if such elements exist")}</option>
            <option value="prohibited">{t("Prohibited – no such element may exist")}</option>
          </select></div>
      </div>
      <label>Description</label>
      <input value={spec.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} placeholder={t("Why this is required, e.g. EIR section 4.2")} />
      <label>IFC versions *</label>
      <div>{IFC_VERSIONS.map((v) => (
        <label key={v} className="ids-check"><input type="checkbox" checked={spec.ifcVersion.includes(v)} onChange={() => toggleVersion(v)} /> <span className="mono">{v}</span></label>
      ))}</div>
      <div className="grid g2">
        <div><label>Applies to IFC entity *</label>
          <input list="ids-entities" value={spec.applicability.entity} onChange={(e) => onChange({ applicability: { ...spec.applicability, entity: e.target.value } })} placeholder="IfcDoor" />
          <div className="tiny muted">IDS does not include subtypes. Separate several classes with |, e.g. IfcWall|IfcSlab.</div></div>
        <div><label>Predefined type</label>
          <input value={spec.applicability.predefinedType ?? ""} onChange={(e) => onChange({ applicability: { ...spec.applicability, predefinedType: e.target.value || undefined } })} placeholder={t("optional, e.g. FIREEXIT")} /></div>
      </div>

      <div className="row spread" style={{ marginTop: 14 }}>
        <b className="small">Requirements <span className="badge">{spec.requirements.length}</span></b>
        <div className="row">
          {REQ_KINDS.map((k) => <button key={k} className="small" onClick={() => onChange({ requirements: [...spec.requirements, emptyReq(k)] })}>+ {t(KIND_LABEL[k])}</button>)}
        </div>
      </div>
      {spec.requirements.length === 0 ? <div className="small muted" style={{ marginTop: 8 }}>No requirements yet. Add an attribute, property, classification or material.</div> : (
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table className="data ids-reqs">
            <thead><tr><th>Kind</th><th>Facet</th><th>Value</th><th>Cardinality</th><th></th></tr></thead>
            <tbody>
              {spec.requirements.map((q, k) => (
                <ReqRow key={k} q={q} onChange={(n) => setReq(k, n)} onRemove={() => onChange({ requirements: spec.requirements.filter((_, i) => i !== k) })} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReqRow({ q, onChange, onRemove }: { q: IdsReq; onChange: (q: IdsReq) => void; onRemove: () => void }) {
  const mode = q.pattern !== undefined ? "pattern" : q.value !== undefined ? "exact" : "any";
  const setKind = (kind: IdsReqKind) => { if (kind !== q.kind) onChange({ ...emptyReq(kind), cardinality: q.cardinality, value: q.value, pattern: q.pattern } as IdsReq); };
  const setMode = (m: string) => {
    const { value: _v, pattern: _p, ...rest } = q; void _v; void _p;
    onChange((m === "exact" ? { ...rest, value: q.value ?? q.pattern ?? "" } : m === "pattern" ? { ...rest, pattern: q.pattern ?? q.value ?? "" } : rest) as IdsReq);
  };
  return (
    <tr>
      <td><select value={q.kind} onChange={(e) => setKind(e.target.value as IdsReqKind)}>{REQ_KINDS.map((k) => <option key={k} value={k}>{t(KIND_LABEL[k])}</option>)}</select></td>
      <td style={{ minWidth: 220 }}>
        <div className="ids-fields">
          {q.kind === "attribute" && <input list="ids-attributes" value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} placeholder={t("Attribute name")} aria-label={t("Attribute name")} />}
          {q.kind === "property" && <>
            <input list="ids-psets" value={q.pset} onChange={(e) => onChange({ ...q, pset: e.target.value })} placeholder={t("Property set")} aria-label={t("Property set")} />
            <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} placeholder={t("Property name")} aria-label={t("Property name")} />
            <input list="ids-datatypes" value={q.dataType ?? ""} onChange={(e) => onChange({ ...q, dataType: e.target.value.toUpperCase() || undefined })} placeholder={t("Data type (optional)")} aria-label={t("Data type (optional)")} />
          </>}
          {q.kind === "classification" && <input value={q.system ?? ""} onChange={(e) => onChange({ ...q, system: e.target.value || undefined })} placeholder={t("System, e.g. Uniclass 2015 (optional)")} aria-label={t("Classification system")} />}
          {q.kind === "material" && <span className="tiny muted">Any material name, or set a value</span>}
        </div>
      </td>
      <td style={{ minWidth: 200 }}>
        <div className="ids-fields">
          <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label={t("Value rule")}>
            <option value="any">{t("Any value")}</option><option value="exact">{t("Exact value")}</option><option value="pattern">{t("Pattern (regex)")}</option>
          </select>
          {mode === "exact" && <input value={q.value ?? ""} onChange={(e) => onChange({ ...q, value: e.target.value })} placeholder={t("Value")} aria-label={t("Value")} />}
          {mode === "pattern" && <input className="mono" value={q.pattern ?? ""} onChange={(e) => onChange({ ...q, pattern: e.target.value })} placeholder="EI[0-9]{2,3}" aria-label={t("Pattern")} />}
        </div>
      </td>
      <td><select value={q.cardinality} onChange={(e) => onChange({ ...q, cardinality: e.target.value as Cardinality })}>{CARDINALITIES.map((c) => <option key={c} value={c}>{t(CARD_LABEL[c])}</option>)}</select></td>
      <td><button className="ids-iconbtn ghost danger" aria-label={t("Remove requirement")} title={t("Remove requirement")} onClick={onRemove}>✕</button></td>
    </tr>
  );
}

function AiExtract({ onAdd }: { onAdd: (specs: IdsSpec[]) => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [text, setText] = useState("");
  const [version, setVersion] = useState<IfcVersion>("IFC4");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  const run = async () => {
    setBusy(true); setError("");
    try {
      const r = await api<{ specs: IdsSpec[] }>("/ai/tools/ids-extract", { body: { text, ifcVersion: version } });
      if (!r.specs?.length) setError(t("The AI found no element requirements in that text."));
      else { onAdd(r.specs); setText(""); }
    } catch (e) { setError(e instanceof Error ? e.message : t("AI request failed.")); }
    finally { setBusy(false); }
  };
  return (
    <section className="hub-card" style={{ "--c": "#7c3aed" } as CSSProperties}>
      <div className="hub-title">AI helper</div>
      {enabled === false && <div className="hub-tile small" style={{ "--c": "#7c3aed", marginBottom: 10 } as CSSProperties}><b>AI isn't switched on yet.</b> Once it is, you can paste EIR or LOIN text here and get draft specifications. Everything else in the IDS builder works without it.</div>}
      <label>Paste EIR / LOIN text</label>
      <textarea rows={6} value={text} onChange={(e) => setText(e.target.value.slice(0, 60000))} disabled={enabled === false}
        placeholder={t("e.g. All doors shall carry a fire rating and state whether they are external. Spaces shall have a room name and net floor area…")} />
      <div className="row spread" style={{ marginTop: 8 }}>
        <div className="row">
          <select value={version} onChange={(e) => setVersion(e.target.value as IfcVersion)} style={{ width: "auto" }} aria-label={t("IFC version")}>
            {IFC_VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <button className="primary" disabled={!enabled || busy || text.trim().length < 20} onClick={run}>{busy ? t("Extracting…") : t("Extract requirements with AI")}</button>
        </div>
        <span className="tiny muted">{text.length.toLocaleString()} / 60,000</span>
      </div>
      {error && <p className="small danger">{error}</p>}
      <p className="small ids-note">AI output is a draft. Review every specification, property set name and pattern against the EIR before you issue the IDS.</p>
    </section>
  );
}
