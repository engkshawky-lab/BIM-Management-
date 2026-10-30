import { Fragment, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { saveMarkdownDocx } from "../../lib/mdDocx";
import { t } from "../../i18n";
import { templateById } from "../../../../shared/data/templates";
import {
  COMPANY_FIELDS, assembleBep, batchIds, coverage, defaultProfile, normaliseProfile,
  type BepKind, type BepProfile, type BepSection, type EirRequirement, type TraceRow,
} from "../../../../shared/bepProfile";
import "./bepwriter.css";

// BEP from the EIR: drafts a pre- or post-appointment BEP that answers a specific EIR from the bidder's company profile,
// with an EIR response matrix, risks and tender clarifications. AI-assisted draft for the accountable person to review.

interface BepResult {
  kind: BepKind; projectName: string;
  requirements: EirRequirement[]; sections: BepSection[]; trace: TraceRow[]; risks: string[]; clarifications: string[];
  truncated?: boolean;
}
interface ApiAnswer {
  requirements: EirRequirement[]; sections: BepSection[]; trace: TraceRow[]; risks: string[]; clarifications: string[]; missing: string[]; truncated?: boolean;
}

const PROFILE_KEY = "bim:bep-profile";
const LAST_KEY = "bim:bep-writer:last";
const BATCH = 3;

const loadProfile = (): BepProfile => { try { const v = localStorage.getItem(PROFILE_KEY); return v ? normaliseProfile(JSON.parse(v)) : defaultProfile(); } catch { return defaultProfile(); } };
function loadLast(): BepResult | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as BepResult;
    if (d && Array.isArray(d.sections) && Array.isArray(d.requirements) && Array.isArray(d.trace)) return d;
  } catch { /* unreadable: start fresh */ }
  return null;
}
const slug = (s: string) => s.trim().replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "project";
const uniq = (a: string[]) => [...new Set(a.map((x) => x.trim()).filter(Boolean))];
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const clock = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
const sectionsOf = (kind: BepKind) => templateById(kind === "post" ? "bep-post" : "bep-pre")?.sections.map((s) => ({ id: s.id, title: s.title })) ?? [];

export default function BepWriter() {
  const last = useMemo(loadLast, []);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  // write from the client's EIR, or from a short project brief when there is no EIR yet
  const [source, setSource] = useState<"eir" | "brief">("eir");
  const [brief, setBrief] = useState("");
  const [profile, setProfile] = useState<BepProfile>(loadProfile);
  const [kind, setKind] = useState<BepKind>(last?.kind ?? "pre");
  const [projectName, setProjectName] = useState(last?.projectName ?? "");
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [regen, setRegen] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<BepResult | null>(last);
  const [copied, setCopied] = useState(false);

  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  useEffect(() => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* storage unavailable */ } }, [profile]);
  useEffect(() => { try { if (result) localStorage.setItem(LAST_KEY, JSON.stringify(result)); } catch { /* storage unavailable */ } }, [result]);
  useEffect(() => {
    if (!busy) return;
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [busy]);

  const hasEir = source === "eir" ? !!file || !!text.trim() : brief.trim().length >= 20;
  const ai = enabled === true;
  const setField = (id: string, v: string) => setProfile((p) => ({ ...p, [id]: v }));

  const call = (sectionIds: string[], requirements?: EirRequirement[], extraNote = "") => {
    const form = new FormData();
    if (source === "brief") form.set("brief", brief); else if (file) form.set("eir", file); else form.set("eirText", text);
    form.set("profile", JSON.stringify(profile));
    form.set("kind", kind);
    form.set("projectName", projectName);
    form.set("sectionIds", JSON.stringify(sectionIds));
    if (requirements?.length) form.set("requirements", JSON.stringify(requirements));
    if (extraNote.trim()) form.set("note", extraNote.trim());
    return api<ApiAnswer>("/ai/tools/bep-from-eir", { form });
  };

  async function generate() {
    const all = sectionsOf(kind);
    const batches = batchIds(all.map((s) => s.id), BATCH);
    setBusy(true); setError("");
    let acc: BepResult = { kind, projectName, requirements: [], sections: [], trace: [], risks: [], clarifications: [] };
    try {
      for (let i = 0; i < batches.length; i++) {
        const titles = batches[i].map((id) => all.find((s) => s.id === id)?.title ?? id).join(", ");
        setProgress({ done: i, total: batches.length, label: titles });
        const out = await call(batches[i], acc.requirements);
        acc = {
          ...acc,
          requirements: acc.requirements.length ? acc.requirements : out.requirements,
          sections: [...acc.sections, ...out.sections],
          trace: [...acc.trace, ...out.trace],
          risks: uniq([...acc.risks, ...out.risks]),
          clarifications: uniq([...acc.clarifications, ...out.clarifications]),
          truncated: acc.truncated || out.truncated,
        };
        setResult({ ...acc, sections: all.filter((s) => acc.sections.some((x) => x.id === s.id)).map((s) => acc.sections.find((x) => x.id === s.id)!) });
      }
      setProgress({ done: batches.length, total: batches.length, label: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function regenerate(id: string) {
    if (!result) return;
    setRegen(id); setBusy(true); setError("");
    try {
      const out = await call([id], result.requirements, note);
      const sec = out.sections.find((s) => s.id === id);
      if (!sec) throw new Error(t("The AI returned no text for this section. Try again."));
      setResult((r) => r && ({
        ...r,
        requirements: r.requirements.length ? r.requirements : out.requirements,
        sections: r.sections.some((s) => s.id === id) ? r.sections.map((s) => (s.id === id ? sec : s)) : [...r.sections, sec],
        trace: [...r.trace.filter((x) => x.section !== id), ...out.trace],
        risks: uniq([...r.risks, ...out.risks]),
        clarifications: uniq([...r.clarifications, ...out.clarifications]),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false); setRegen("");
    }
  }

  const editSection = (id: string, markdown: string) => setResult((r) => r && ({ ...r, sections: r.sections.map((s) => (s.id === id ? { ...s, markdown } : s)) }));
  const editTrace = (i: number, response: string) => setResult((r) => r && ({ ...r, trace: r.trace.map((x, j) => (j === i ? { ...x, response } : x)) }));

  const cov = useMemo(() => (result ? coverage(result.requirements, result.trace) : null), [result]);
  const titleOf = (id: string) => result?.sections.find((s) => s.id === id)?.title ?? id;
  const markdown = () => result ? assembleBep(result.sections, result.trace, {
    kind: result.kind, project: result.projectName, company: profile.companyName,
    requirements: result.requirements, risks: lines(result.risks.join("\n")), clarifications: lines(result.clarifications.join("\n")),
  }) : "";

  const download = () => result && saveMarkdownDocx(markdown(), `BEP-${result.kind === "post" ? "POST" : "PRE"}_${slug(result.projectName)}`, {
    title: result.kind === "post" ? "BIM Execution Plan (Post-appointment)" : "BIM Execution Plan (Pre-appointment)",
    project: result.projectName || undefined, organisation: profile.companyName || undefined, orgRole: profile.role,
    status: "S0 — Work in progress (AI-assisted draft)", date: new Date().toISOString().slice(0, 10),
  });
  const copy = async () => {
    try { await navigator.clipboard.writeText(markdown()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setError(t("Copy failed. Download the Word file instead.")); }
  };

  const expected = sectionsOf(result?.kind ?? kind);
  const missingSections = result ? expected.filter((s) => !result.sections.some((x) => x.id === s.id)) : [];

  return (
    <div className="bw">
      <div className="hub-card">
        <h2 className="bw-h">{t("BEP writer")}</h2>
        <p className="muted bw-p">{t("Draft a BIM execution plan that answers the client's EIR requirement by requirement, using your company profile. The AI writes [TBC: …] where facts are missing. Review every section before you submit it.")}</p>
        <p className="muted bw-p">{t("No EIR yet, or an internal project? Choose \"From a project brief\" in step 1 and the BEP follows ISO 19650 good practice, listing what the client should confirm.")}</p>
      </div>
      {enabled === false && <div className="hub-card bw-note">{t("AI is not configured on this server, so the BEP writer is unavailable. Ask an administrator to set the Claude API key.")}</div>}

      <section className="hub-card bw-step">
        <h3 className="bw-h"><span className="bw-n">1</span>{t(source === "eir" ? "Upload or paste the EIR" : "Describe the project")}</h3>
        <div className="seg" style={{ marginBottom: 8 }}>
          <button className={source === "eir" ? "on" : ""} onClick={() => setSource("eir")}>{t("From the client's EIR")}</button>
          <button className={source === "brief" ? "on" : ""} onClick={() => setSource("brief")}>{t("From a project brief (no EIR)")}</button>
        </div>
        {source === "eir" ? <>
          <input type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label={t("EIR file")} disabled={!ai} />
          {file ? <div className="small muted">{file.name} · {(file.size / 1024).toFixed(0)} KB <button className="ghost small" onClick={() => setFile(null)}>{t("Remove")}</button></div>
            : <textarea className="bw-eir" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("…or paste the EIR text here")} disabled={!ai} />}
        </> : <textarea className="bw-eir" value={brief} onChange={(e) => setBrief(e.target.value)} disabled={!ai}
          placeholder={t("Asset type and size, client, procurement route, stages in scope, key milestones, disciplines, software and CDE, any special requirements (security, COBie, LOIN)…")} />}
        <label className="bw-field">{t("Project name")}<input value={projectName} onChange={(e) => setProjectName(e.target.value)} disabled={!ai} /></label>
      </section>

      <section className="hub-card bw-step">
        <h3 className="bw-h"><span className="bw-n">2</span>{t("Company profile")}</h3>
        <p className="small muted bw-p">{t("Saved in this browser and reused for every BEP. Leave a field blank and the BEP marks it [TBC].")}</p>
        <div className="bw-profile">
          {COMPANY_FIELDS.map((f) => (
            <label key={f.id} className={"bw-field" + (f.type === "textarea" ? " bw-wide" : "")}>
              <span>{t(f.label)}</span>
              {f.type === "select" ? (
                <select value={profile[f.id]} onChange={(e) => setField(f.id, e.target.value)}>
                  {f.options!.map((o) => <option key={o} value={o}>{t(o)}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea value={profile[f.id]} onChange={(e) => setField(f.id, e.target.value)} rows={3} />
              ) : (
                <input value={profile[f.id]} onChange={(e) => setField(f.id, e.target.value)} />
              )}
              {f.hint && <span className="small muted">{t(f.hint)}</span>}
            </label>
          ))}
        </div>
        <button className="ghost small" onClick={() => setProfile(defaultProfile())}>{t("Clear profile")}</button>
      </section>

      <section className="hub-card bw-step">
        <h3 className="bw-h"><span className="bw-n">3</span>{t("Choose the BEP")}</h3>
        <div className="bw-kinds" role="radiogroup" aria-label={t("Choose the BEP")}>
          {(["pre", "post"] as BepKind[]).map((k) => (
            <label key={k} className={"bw-kind" + (kind === k ? " on" : "")}>
              <input type="radio" name="bw-kind" checked={kind === k} onChange={() => setKind(k)} />
              <b>{k === "pre" ? t("Pre-appointment BEP") : t("Post-appointment BEP")}</b>
              <span className="small muted">{k === "pre" ? t("Tender response: proposed team, strategy, capability and risks (ISO 19650-2 5.3.2).") : t("After appointment: named roles, confirmed methods, delivery schedule and handover (ISO 19650-2 5.4.1).")}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="hub-card bw-step">
        <h3 className="bw-h"><span className="bw-n">4</span>{t("Generate")}</h3>
        <div className="bw-row">
          <button className="primary" disabled={busy || !hasEir || !ai} onClick={generate}>
            {busy && !regen ? `${t("Writing the BEP…")} ${clock(seconds)}` : t("Generate BEP")}
          </button>
          {!hasEir && <span className="small muted">{t(source === "eir" ? "Add the EIR first." : "Describe the project first (a few lines).")}</span>}
        </div>
        {busy && !regen && progress && (
          <div className="bw-progress" aria-live="polite">
            <div className="bw-bar"><div style={{ inlineSize: `${Math.max(4, (progress.done / progress.total) * 100)}%` }} /></div>
            <span className="small muted">{t("Batch")} {Math.min(progress.done + 1, progress.total)} / {progress.total}: {progress.label}</span>
          </div>
        )}
        <p className="small muted bw-p">{t("Sections are written in batches; each batch can take a minute or two.")}</p>
        {error && <div className="hub-card bw-error">{error}</div>}
      </section>

      {result && cov && (
        <section className="bw-step bw-result">
          <div className="hub-card">
            <h3 className="bw-h"><span className="bw-n">5</span>{t("Review and edit")}</h3>
            <div className="bw-stats">
              <div className="bw-stat"><b>{cov.total}</b><span>{t("EIR requirements")}</span></div>
              <div className="bw-stat bw-ok"><b>{cov.covered}</b><span>{t("answered")}</span></div>
              <div className="bw-stat bw-gap"><b>{cov.uncovered.length}</b><span>{t("not answered")}</span></div>
              <div className="bw-stat"><b>{cov.percent}%</b><span>{t("coverage")}</span></div>
            </div>
            {result.truncated && <p className="small bw-warn">{t("The AI answer was cut short. Regenerate the affected sections.")}</p>}
            {missingSections.length > 0 && !busy && <p className="small bw-warn">{t("Sections not written yet:")} {missingSections.map((s) => t(s.title)).join(", ")}</p>}
            <div className="bw-row">
              <button className="primary" onClick={download}>{t("Download Word")}</button>
              <button onClick={copy}>{copied ? t("Copied") : t("Copy")}</button>
              <a className="btn ghost" href="#/ai-studio/compliance">{t("Check it with the compliance matrix")}</a>
              <a className="btn ghost" href={`#/doc-guides/${result.kind === "post" ? "bep-post" : "bep-pre"}`}>{t("BEP guide")}</a>
            </div>
            <label className="bw-field bw-wide">{t("Note for regeneration (optional)")}
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("e.g. shorter, add a table of roles, use Autodesk Construction Cloud")} />
            </label>
          </div>

          {[...result.sections, ...missingSections.map((s) => ({ ...s, markdown: "" }))].map((s, i) => (
            <details key={s.id} className="hub-card bw-sec" open={i === 0}>
              <summary>
                <b>{i + 1}. {t(s.title)}</b>
                <span className="small muted"> · {cov.bySection[s.id] ?? 0} {t("EIR responses")}</span>
              </summary>
              <textarea className="bw-md" value={s.markdown} onChange={(e) => editSection(s.id, e.target.value)} aria-label={t(s.title)} />
              <div className="bw-row">
                <button className="ghost small" disabled={busy || !hasEir || !ai} onClick={() => regenerate(s.id)}>
                  {regen === s.id ? `${t("Regenerating…")} ${clock(seconds)}` : t("Regenerate this section")}
                </button>
                {!hasEir && <span className="small muted">{t("Add the EIR again to regenerate.")}</span>}
              </div>
            </details>
          ))}

          <div className="hub-card">
            <h3 className="bw-h">{t("EIR response matrix")}</h3>
            <div className="bw-table-wrap">
              <table className="bw-table">
                <thead><tr><th>{t("EIR ref")}</th><th>{t("Requirement")}</th><th>{t("How the BEP responds")}</th><th>{t("BEP section")}</th></tr></thead>
                <tbody>
                  {result.requirements.map((q) => {
                    const rows = result.trace.map((x, i) => ({ x, i })).filter(({ x }) => x.ref === q.ref);
                    if (!rows.length) return (
                      <tr key={q.ref} className="bw-uncovered"><td>{q.ref}</td><td>{q.requirement}</td><td colSpan={2}>{t("Not answered by any section")}</td></tr>
                    );
                    return (
                      <Fragment key={q.ref}>
                        {rows.map(({ x, i }, k) => (
                          <tr key={i}>
                            {k === 0 && <td rowSpan={rows.length}>{q.ref}</td>}
                            {k === 0 && <td rowSpan={rows.length}>{q.requirement}</td>}
                            <td><textarea className="bw-cell" value={x.response} onChange={(e) => editTrace(i, e.target.value)} aria-label={`${q.ref} ${t("How the BEP responds")}`} /></td>
                            <td>{t(titleOf(x.section))}</td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bw-two">
            <div className="hub-card">
              <h3 className="bw-h">{t("Risks")}</h3>
              <textarea className="bw-list" value={result.risks.join("\n")} onChange={(e) => setResult((r) => r && ({ ...r, risks: e.target.value.split("\n") }))} aria-label={t("Risks")} />
              <span className="small muted">{t("One per line.")}</span>
            </div>
            <div className="hub-card">
              <h3 className="bw-h">{t("Clarifications to raise at tender")}</h3>
              <textarea className="bw-list" value={result.clarifications.join("\n")} onChange={(e) => setResult((r) => r && ({ ...r, clarifications: e.target.value.split("\n") }))} aria-label={t("Clarifications to raise at tender")} />
              <span className="small muted">{t("One per line.")}</span>
            </div>
          </div>
          <p className="small muted">{t("AI-assisted draft. The accountable person of the bidder must review, complete every [TBC] and approve it before submission.")}</p>
        </section>
      )}
    </div>
  );
}
