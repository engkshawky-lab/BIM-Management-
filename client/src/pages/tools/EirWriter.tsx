import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { t } from "../../i18n";
import { getProjectData } from "../../lib/projectStore";
import { saveMarkdownDocx } from "../../lib/mdDocx";
import { Markdown } from "../../components/Markdown";
import {
  BRIEF_QUESTIONS, DOC_TITLES, assembleDoc, batches, prefillAnswers, templateSections, unanswered,
  type BriefAnswers, type BriefQuestion, type EirDocId, type GenSection,
} from "../../../../shared/eirBrief";
import "./eirwriter.css";

// EIR writer from a brief: answer a short questionnaire, then draft a full EIR and a matching AIR section by section.

const KEY = "bim:eir-brief";
const BATCH = 3;
type Status = "pending" | "running" | "done" | "error";
interface DocResult { sections: GenSection[]; assumptions: string[]; tbc: string[] }
interface ApiOut { sections: GenSection[]; assumptions: string[]; tbc: string[]; truncated?: boolean }

function loadAnswers(): BriefAnswers {
  let saved: BriefAnswers = {};
  try { const v = localStorage.getItem(KEY); if (v) saved = JSON.parse(v) as BriefAnswers; } catch { /* storage unavailable */ }
  return prefillAnswers(getProjectData(), saved && typeof saved === "object" ? saved : {});
}
const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))];

function Question({ q, value, onChange }: { q: BriefQuestion; value: string | string[] | undefined; onChange: (v: string | string[]) => void }) {
  const id = "eirw-" + q.id;
  if (q.type === "multiselect") {
    const sel = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <fieldset className="eirw-q eirw-wide">
        <legend><b>{t(q.label)}</b> <span className="small muted">{t(q.hint)}</span></legend>
        <div className="eirw-chips">
          {(q.options ?? []).map((o) => { const on = sel.includes(o); return (
            <button type="button" key={o} className={"chip" + (on ? " on" : "")} aria-pressed={on} onClick={() => onChange(on ? sel.filter((x) => x !== o) : [...sel, o])}>{t(o)}</button>
          ); })}
        </div>
      </fieldset>
    );
  }
  const v = Array.isArray(value) ? value.join(", ") : value ?? "";
  return (
    <label className={"eirw-q" + (q.type === "textarea" ? " eirw-wide" : "")} htmlFor={id}>
      <b>{t(q.label)}</b>
      <span className="small muted">{t(q.hint)}</span>
      {q.type === "select"
        ? <select id={id} value={v} onChange={(e) => onChange(e.target.value)}>
            <option value="">{t("— Not stated —")}</option>
            {(q.options ?? []).map((o) => <option key={o} value={o}>{t(o)}</option>)}
            {v && !(q.options ?? []).includes(v) && <option value={v}>{v}</option>}
          </select>
        : q.type === "textarea"
          ? <textarea id={id} rows={4} value={v} onChange={(e) => onChange(e.target.value)} />
          : <input id={id} value={v} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

export default function EirWriter() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<BriefAnswers>(loadAnswers);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(answers)); } catch { /* storage unavailable */ } }, [answers]);
  const [docs, setDocs] = useState<Record<EirDocId, boolean>>({ eir: true, air: true });
  const [results, setResults] = useState<Partial<Record<EirDocId, DocResult>>>({});
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const chosen = (["eir", "air"] as EirDocId[]).filter((d) => docs[d]);
  const gaps = useMemo(() => unanswered(answers), [answers]);
  const aiOff = enabled === false;

  const merge = (doc: EirDocId, out: ApiOut) => setResults((prev) => {
    const cur = prev[doc] ?? { sections: [], assumptions: [], tbc: [] };
    const map = new Map(cur.sections.map((s) => [s.id, s]));
    for (const s of out.sections) if (s.markdown) map.set(s.id, s);
    const order = templateSections(doc).map((s) => s.id);
    const sections = [...map.values()].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    return { ...prev, [doc]: { sections, assumptions: uniq([...cur.assumptions, ...(out.assumptions ?? [])]), tbc: uniq([...cur.tbc, ...(out.tbc ?? [])]) } };
  });

  async function runBatch(doc: EirDocId, ids: string[]) {
    setStatus((s) => ({ ...s, ...Object.fromEntries(ids.map((id) => [`${doc}:${id}`, "running" as Status])) }));
    try {
      const out = await api<ApiOut>("/ai/tools/eir-writer", { method: "POST", body: { answers, doc, sectionIds: ids } });
      merge(doc, out);
      const got = new Set(out.sections.filter((s) => s.markdown).map((s) => s.id));
      setStatus((s) => ({ ...s, ...Object.fromEntries(ids.map((id) => [`${doc}:${id}`, (got.has(id) ? "done" : "error") as Status])) }));
    } catch (e) {
      setStatus((s) => ({ ...s, ...Object.fromEntries(ids.map((id) => [`${doc}:${id}`, "error" as Status])) }));
      setError((e as Error).message || t("Generation failed."));
    }
  }

  async function generate() {
    if (!chosen.length || aiOff) return;
    setBusy(true); setError(""); setStep(3);
    setResults((prev) => { const next = { ...prev }; for (const d of chosen) delete next[d]; return next; });
    setStatus(Object.fromEntries(chosen.flatMap((d) => templateSections(d).map((s) => [`${d}:${s.id}`, "pending" as Status]))));
    for (const d of chosen) for (const ids of batches(templateSections(d).map((s) => s.id), BATCH)) await runBatch(d, ids);
    setBusy(false); setStep(4);
  }

  async function retryFailed() {
    setBusy(true); setError("");
    for (const d of chosen) {
      const failed = templateSections(d).map((s) => s.id).filter((id) => status[`${d}:${id}`] === "error");
      for (const ids of batches(failed, BATCH)) await runBatch(d, ids);
    }
    setBusy(false);
  }

  async function regenerate(doc: EirDocId, id: string) {
    setBusy(true); setError("");
    await runBatch(doc, [id]);
    setBusy(false);
  }

  const setSection = (doc: EirDocId, id: string, markdown: string) => setResults((prev) => {
    const cur = prev[doc]; if (!cur) return prev;
    return { ...prev, [doc]: { ...cur, sections: cur.sections.map((s) => (s.id === id ? { ...s, markdown } : s)) } };
  });

  const meta = (doc: EirDocId) => ({
    project: String(answers.projectName ?? "") || undefined, code: String(answers.projectCode ?? "") || undefined, client: String(answers.client ?? "") || undefined,
    assumptions: results[doc]?.assumptions, tbc: results[doc]?.tbc,
  });
  const fullMd = (doc: EirDocId) => assembleDoc(doc, results[doc]?.sections ?? [], meta(doc));
  const readyDocs = chosen.filter((d) => results[d]?.sections.length);

  async function download(doc: EirDocId) {
    const code = String(answers.projectCode ?? "").trim();
    await saveMarkdownDocx(fullMd(doc), `${code ? code + "-" : ""}${doc.toUpperCase()}`, {
      title: `${DOC_TITLES[doc]} (${doc.toUpperCase()})`, project: String(answers.projectName ?? "") || undefined, appointingParty: String(answers.client ?? "") || undefined,
      organisation: String(answers.client ?? "") || undefined, orgRole: "Appointing party", status: "Draft for review", revision: "P01",
      security: String(answers.security ?? "") || undefined,
    });
  }
  async function copyAll() {
    try { await navigator.clipboard.writeText(readyDocs.map(fullMd).join("\n\n---\n\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setError(t("Could not copy to the clipboard.")); }
  }

  const steps = ["Brief", "Documents", "Generate", "Review"];
  const total = Object.keys(status).length, done = Object.values(status).filter((s) => s === "done").length;

  return (
    <div className="eirw">
      {aiOff && <div className="hub-card eirw-note">{t("AI is not configured on this server, so the EIR writer is unavailable. Ask an administrator to set the Claude API key.")}</div>}
      <div className="row spread">
        <ol className="eirw-steps" aria-label={t("Steps")}>
          {steps.map((s, i) => (
            <li key={s} className={step === i + 1 ? "on" : step > i + 1 ? "past" : ""}>
              <button type="button" className="ghost small" disabled={busy || (i + 1 >= 3 && !Object.keys(results).length && i + 1 !== step)} onClick={() => setStep(i + 1)}>{i + 1}. {t(s)}</button>
            </li>
          ))}
        </ol>
        <a className="small" href="#/doc-guides/eir">{t("Open the EIR guide")}</a>
      </div>

      {step === 1 && (
        <div className="hub-card eirw-brief">
          <p className="small muted">{t("Answers are prefilled from Project data where available and saved in this browser. Anything you leave blank is marked [TBC] in the document — the AI will not invent client facts.")}</p>
          <div className="eirw-grid">
            {BRIEF_QUESTIONS.map((q) => <Question key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />)}
          </div>
          <div className="row spread">
            <span className="small muted">{gaps.length ? `${gaps.length} ${t("questions unanswered")}` : t("All questions answered")}</span>
            <div className="row">
              <button type="button" className="ghost small" onClick={() => setAnswers(prefillAnswers(getProjectData(), {}))}>{t("Reset from Project data")}</button>
              <button type="button" className="primary" onClick={() => setStep(2)}>{t("Next")}</button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="hub-card eirw-docs">
          <p>{t("Choose the documents to write. Both are drafted from the same brief so references, milestones and formats match.")}</p>
          {(["eir", "air"] as EirDocId[]).map((d) => (
            <label key={d} className="eirw-doc">
              <input type="checkbox" checked={docs[d]} onChange={(e) => setDocs((x) => ({ ...x, [d]: e.target.checked }))} />
              <span><b>{d.toUpperCase()}</b> — {t(DOC_TITLES[d])} <span className="small muted">({templateSections(d).length} {t("sections")})</span></span>
            </label>
          ))}
          <div className="row spread">
            <button type="button" className="ghost" onClick={() => setStep(1)}>{t("Back")}</button>
            <button type="button" className="primary" disabled={!chosen.length || busy || enabled !== true} onClick={generate}>{t("Generate")}</button>
          </div>
        </div>
      )}

      {error && <div className="hub-card eirw-error" role="alert">{error}</div>}

      {step === 3 && (
        <div className="hub-card eirw-progress" aria-live="polite">
          <div className="row spread"><b>{busy ? t("Writing sections…") : t("Generation finished")}</b><span className="small muted">{done} / {total}</span></div>
          <progress max={total || 1} value={done} />
          {chosen.map((d) => (
            <div key={d}>
              <div className="small"><b>{d.toUpperCase()}</b></div>
              <ul className="eirw-status">
                {templateSections(d).map((s) => { const st = status[`${d}:${s.id}`] ?? "pending"; return (
                  <li key={s.id} className={"eirw-" + st}><span className="eirw-dot" aria-hidden="true" />{s.n}. {t(s.title)} <span className="small muted">{t(st === "pending" ? "Waiting" : st === "running" ? "Writing…" : st === "done" ? "Done" : "Failed")}</span></li>
                ); })}
              </ul>
            </div>
          ))}
          {!busy && <div className="row"><button type="button" className="primary" onClick={() => setStep(4)}>{t("Review the result")}</button></div>}
        </div>
      )}

      {step === 4 && (
        <div className="eirw-result">
          <div className="hub-card row spread">
            <div className="row">
              {readyDocs.map((d) => <button type="button" key={d} className="primary" onClick={() => download(d)}>{t("Download Word")} ({d.toUpperCase()})</button>)}
              <button type="button" className="ghost" disabled={!readyDocs.length} onClick={copyAll}>{copied ? t("Copied") : t("Copy all")}</button>
            </div>
            <div className="row">
              {Object.values(status).includes("error") && <button type="button" className="ghost small" disabled={busy || aiOff} onClick={retryFailed}>{t("Retry failed sections")}</button>}
              <button type="button" className="ghost small" disabled={busy} onClick={() => setStep(1)}>{t("Edit the brief")}</button>
            </div>
          </div>
          {!readyDocs.length && <div className="hub-card muted">{t("Nothing generated yet.")}</div>}
          {readyDocs.map((d) => {
            const r = results[d]!;
            return (
              <section key={d} className="eirw-doc-result">
                <h2>{t(DOC_TITLES[d])} ({d.toUpperCase()})</h2>
                {(r.assumptions.length > 0 || r.tbc.length > 0) && (
                  <div className="eirw-lists">
                    {r.assumptions.length > 0 && <div className="hub-card"><b>{t("Assumptions")}</b><ul className="small">{r.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></div>}
                    {r.tbc.length > 0 && <div className="hub-card eirw-tbc"><b>{t("To be confirmed (TBC)")}</b><ul className="small">{r.tbc.map((a) => <li key={a}>{a}</li>)}</ul></div>}
                  </div>
                )}
                {templateSections(d).map((s) => {
                  const g = r.sections.find((x) => x.id === s.id);
                  const k = `${d}:${s.id}`;
                  const st = status[k];
                  return (
                    <article key={s.id} className="hub-card eirw-section">
                      <div className="row spread">
                        <b>{s.n}. {t(s.title)}</b>
                        <div className="row">
                          {g && <button type="button" className="ghost small" onClick={() => setEditing((e) => ({ ...e, [k]: !e[k] }))}>{editing[k] ? t("Preview") : t("Edit")}</button>}
                          <button type="button" className="ghost small" disabled={busy || aiOff} onClick={() => regenerate(d, s.id)}>{st === "running" ? t("Writing…") : t("Regenerate this section")}</button>
                        </div>
                      </div>
                      {!g ? <div className="small muted">{st === "error" ? t("This section failed. Regenerate it.") : t("Not generated.")}</div>
                        : editing[k]
                          ? <textarea className="eirw-md" rows={18} value={g.markdown} onChange={(e) => setSection(d, s.id, e.target.value)} aria-label={t(s.title)} />
                          : <div className="eirw-preview"><Markdown text={g.markdown} /></div>}
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
