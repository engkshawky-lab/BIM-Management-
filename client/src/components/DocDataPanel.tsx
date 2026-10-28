import { useEffect, useState, type CSSProperties } from "react";
import { tr } from "../i18nDom";
import { useProjectData } from "../lib/projectStore";
import { DOC_STATUSES, OPTIONAL, ORG_ROLES, REQUIRED, SECURITY, STAGES, emptyDocData, missingDocData, suggestReference, type DocData } from "../../../shared/docData";

// "Document data — required before generation": the controlled identity of a document, entered once and
// remembered in this browser. Generators stay disabled until every required field is filled.

const KEY = "bim:docdata";
const load = (): DocData => { try { return { ...emptyDocData(), ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return emptyDocData(); } };

/** Shared document data; `code` (e.g. "EIR") suggests a reference when none is set. */
export function useDocData(code?: string) {
  const [d, setD] = useState<DocData>(load);
  const [p] = useProjectData();
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage unavailable */ } }, [d]);
  // project name, code, client and CDE come from the common project data when not typed here
  useEffect(() => {
    const fill = { projectName: d.projectName || p.name, projectCode: d.projectCode || p.code, appointingParty: d.appointingParty || p.client, cde: d.cde || p.cde };
    if (Object.entries(fill).some(([k, v]) => v !== d[k as keyof DocData])) setD({ ...d, ...fill });
  }, [p.name, p.code, p.client, p.cde]); // eslint-disable-line react-hooks/exhaustive-deps
  const missing = missingDocData(d);
  return { d, setD, missing, ready: missing.length === 0, suggested: code ? suggestReference(d, code) : "" };
}

const SELECTS: Partial<Record<keyof DocData, string[]>> = { orgRole: ORG_ROLES, stage: STAGES, status: DOC_STATUSES, security: SECURITY };

export function DocDataPanel({ data, what, code }: { data: ReturnType<typeof useDocData>; what: string; code?: string }) {
  const { d, setD, missing, suggested } = data;
  const [more, setMore] = useState(false);
  const [touched, setTouched] = useState(false);
  const field = (f: { key: keyof DocData; label: string; placeholder: string }, required: boolean) => {
    const empty = required && !String(d[f.key]).trim();
    const style = touched && empty ? { borderColor: "var(--danger)" } : undefined;
    const onChange = (e: { target: { value: string } }) => { setTouched(true); setD({ ...d, [f.key]: e.target.value }); };
    const opts = SELECTS[f.key];
    return (
      <label key={f.key} className="small" style={{ display: "grid", gap: 4, margin: 0, fontWeight: 400 }}>
        <span className="muted">{f.label}{required && <b style={{ color: "var(--danger)" }}> *</b>}</span>
        {opts ? <select value={d[f.key]} onChange={onChange} style={style}><option value="">{tr("Select…")}</option>{opts.map((o) => <option key={o} value={o}>{tr(o)}</option>)}</select>
          : <input type={f.key === "issueDate" ? "date" : "text"} value={d[f.key]} placeholder={f.key === "reference" && suggested ? suggested : f.placeholder} onChange={onChange} style={style} />}
        {f.key === "reference" && !d.reference && suggested && <button type="button" className="ghost small" style={{ justifySelf: "start", padding: "0 4px" }} onClick={() => setD({ ...d, reference: suggested })}>Use {suggested}</button>}
      </label>
    );
  };
  return (
    <div className="hub-card" style={{ "--c": missing.length ? "var(--warn)" : "var(--ok)", display: "grid", gap: 10 } as CSSProperties}>
      <div className="row spread">
        <div><b>Document data — required before {what}</b><div className="small muted">Controlled project, organisation and appointment details. They are written into the cover page, the document control table and every export.</div></div>
        <span className="badge" style={missing.length ? { background: "var(--warn)", color: "#fff", borderColor: "var(--warn)" } : { background: "var(--ok)", color: "#fff", borderColor: "var(--ok)" }}>{missing.length ? `${missing.length} required` : "✓ Complete"}</span>
      </div>
      <div className="grid g4">{REQUIRED.map((f) => field(f, true))}</div>
      <button type="button" className="ghost small" style={{ justifySelf: "start" }} onClick={() => setMore(!more)}>{more ? "▾ Hide optional details" : "▸ Optional details: project code, owner, checked/approved by, issue date, security, CDE"}</button>
      {more && <div className="grid g4">{OPTIONAL.map((f) => field(f, false))}</div>}
      {missing.length > 0 && <div className="small" style={{ color: "var(--warn)" }}>Complete the required fields before generating{code ? ` the ${code}` : ""}: {missing.join(", ")}.</div>}
    </div>
  );
}
