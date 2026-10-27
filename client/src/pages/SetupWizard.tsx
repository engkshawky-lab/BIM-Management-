import { useEffect, useState } from "react";
import { navigate, useSession } from "../App";
import { templateById } from "../../../shared/data/templates";
import { recommend, type WizardAnswers } from "../../../shared/wizard";
import { api, type DocRow } from "../lib/api";

// Guided setup: a few questions → the documents, standards and tools to start with, then create
// a project (or add to an existing one) with those documents ready to edit.

type Q = { key: keyof WizardAnswers; question: string; options: [string, string | boolean][] };
const QUESTIONS: Q[] = [
  { key: "role", question: "What is your role on the project?", options: [["Client / appointing party", "appointing"], ["Lead appointed party (lead designer or main contractor)", "lead"], ["Task team (consultant or subcontractor)", "task"]] },
  { key: "stage", question: "Where is the project now?", options: [["Defining the brief and requirements", "brief"], ["Tendering", "tender"], ["Appointed — mobilizing", "mobilize"], ["Producing information (design or construction)", "production"], ["Handover and close-out", "handover"]] },
  { key: "assetType", question: "What kind of asset is it?", options: [["Building", "building"], ["Infrastructure (roads, rail, utilities)", "infrastructure"], ["Façade or specialist package", "facade"]] },
  { key: "operations", question: "Will asset information be handed over for operation and maintenance?", options: [["Yes", true], ["No", false]] },
  { key: "sensitive", question: "Is the asset or its information security-sensitive?", options: [["Yes", true], ["No / not sure", false]] },
  { key: "usesAi", question: "Does the team use AI tools to produce or check information?", options: [["Yes — manage them under ISO/IEC 42001", true], ["No", false]] },
];

export default function SetupWizard() {
  const { toast } = useSession();
  const [a, setA] = useState<Partial<WizardAnswers>>({});
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [target, setTarget] = useState<"new" | string>("new");
  const [form, setForm] = useState({ name: "", code: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<{ projects: { id: string; name: string; code: string }[] }>("/projects").then((r) => setProjects(r.projects)); }, []);
  const done = step >= QUESTIONS.length;
  const result = done ? recommend(a as WizardAnswers) : null;
  useEffect(() => { if (result) setPicked(result.documents.map((d) => d.templateId)); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    if (!result) return;
    setBusy(true);
    try {
      let pid = target;
      if (target === "new") pid = (await api<{ id: string }>("/projects", { body: { name: form.name, code: form.code, standards: result.standards } })).id;
      const existing = (await api<{ documents: DocRow[] }>(`/projects/${pid}/documents`)).documents.map((d) => d.templateId);
      const todo = picked.filter((t) => !existing.includes(t));
      for (const templateId of todo) await api(`/projects/${pid}/documents`, { body: { templateId } });
      toast(`${todo.length} document${todo.length === 1 ? "" : "s"} created${picked.length > todo.length ? `; ${picked.length - todo.length} already existed` : ""}.`);
      navigate(`/projects/${pid}/documents`);
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };

  if (!done) {
    const q = QUESTIONS[step];
    return (
      <>
        <div className="page-head"><h1>Setup wizard</h1><p className="muted">Answer {QUESTIONS.length} questions and get the ISO 19650 documents, standards and tools to start with.</p></div>
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="tiny muted">Question {step + 1} of {QUESTIONS.length}</div>
          <div className="progress" style={{ margin: "6px 0 12px" }}><div style={{ width: `${(step / QUESTIONS.length) * 100}%` }} /></div>
          <h3 style={{ marginTop: 0 }}>{q.question}</h3>
          {q.options.map(([label, value]) => (
            <button key={label} className={"wizard-option" + (a[q.key] === value ? " primary" : "")} style={{ display: "block", width: "100%", textAlign: "start", marginBottom: 8 }}
              onClick={() => { setA({ ...a, [q.key]: value }); setStep(step + 1); }}>{label}</button>
          ))}
          {step > 0 && <button className="ghost small" onClick={() => setStep(step - 1)}>← Back</button>}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head"><h1>Your starting set</h1><p className="muted">Recommended for your answers. Untick anything you don't need, then create the documents.</p></div>
      <div className="grid g2">
        <div className="card">
          <b>Documents</b>
          {result!.documents.map((d) => { const t = templateById(d.templateId)!; return (
            <label key={d.templateId} className="row" style={{ alignItems: "flex-start", gap: 8, margin: "8px 0" }}>
              <input type="checkbox" style={{ width: "auto", marginTop: 3 }} checked={picked.includes(d.templateId)} onChange={(e) => setPicked(e.target.checked ? [...picked, d.templateId] : picked.filter((x) => x !== d.templateId))} />
              <span><span className="badge">{t.code}</span> <b>{t.title}</b><div className="small muted">{d.reason}</div></span>
            </label>
          ); })}
        </div>
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <b>Standards</b><p className="small">{result!.standards.map((s) => (s === "iso19650" ? "ISO 19650" : "ISO/IEC 42001")).join(" + ")}</p>
            <b>Tools to use next</b>
            <ul className="small">{result!.tools.map((t) => <li key={t.path}><b>{t.label}</b> — {t.reason}</li>)}</ul>
          </div>
          <div className="card">
            <b>Create the documents in</b>
            <select value={target} onChange={(e) => setTarget(e.target.value)} style={{ marginTop: 6 }}>
              <option value="new">A new project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
            {target === "new" && <div className="grid g2">
              <div><label>Project name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label>Project code</label><input value={form.code} maxLength={6} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="2–6 letters or digits" /></div>
            </div>}
            <div className="row" style={{ marginTop: 12 }}>
              <button className="primary" disabled={busy || !picked.length || (target === "new" && (form.name.trim().length < 2 || !/^[A-Z0-9]{2,6}$/.test(form.code)))} onClick={create}>{busy ? "Creating…" : `Create ${picked.length} document${picked.length === 1 ? "" : "s"}`}</button>
              <button className="ghost" onClick={() => { setStep(0); setA({}); }}>Start again</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
