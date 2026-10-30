import { useEffect, useState, type ReactNode } from "react";
import { t } from "../i18n";
import { roleDocs } from "../../../shared/data/hubs/documentsRoles";
import type { RoleDoc } from "../../../shared/data/hubs/types";
import { guideByCode } from "../../../shared/data/docGuides";
import { WF_DUTIES } from "../../../shared/data/workflow/duties";
import { WF_STAGES } from "../../../shared/data/workflow/stages";
import { ROLE_TITLES, type StageId } from "../../../shared/data/workflow/types";
import { generateHref } from "./AiTools";

// ISO 19650-2 stage × party table of documents. Every stage and every document opens a
// detail panel: purpose and contents, and — where a full guide exists — who writes and
// approves it, what to write in each section, how to create it and what to check.

const STAGES: { id: string; label: string; short: string; wf: StageId[] }[] = [
  { id: "5.1", short: "Assessment", label: "Assessment & need", wf: ["need"] },
  { id: "5.2", short: "Tender", label: "Invitation to tender", wf: ["tender"] },
  { id: "5.3", short: "Response", label: "Tender response", wf: ["response"] },
  { id: "5.4", short: "Appointment", label: "Appointment", wf: ["appointment"] },
  { id: "5.5", short: "Mobilisation", label: "Mobilisation", wf: ["mobilisation"] },
  { id: "5.6", short: "Production", label: "Collaborative production", wf: ["design", "construction"] },
  { id: "5.7", short: "Delivery", label: "Information model delivery", wf: ["delivery"] },
  { id: "5.8", short: "Close-out", label: "Project close-out", wf: ["handover"] },
];
const PARTIES = [
  { id: "appointing", label: "Appointing party", icon: "🏛" },
  { id: "lead", label: "Lead appointed party", icon: "🏗" },
  { id: "taskteams", label: "Task teams / sub-appointed", icon: "✏" },
] as const;
type Pick = { kind: "doc"; doc: RoleDoc } | { kind: "stage"; id: string } | null;
/** Short label for a folded cell: the template code, the abbreviation in brackets, or the first words. */
const abbr = (d: RoleDoc) => d.template ?? /\(([^)]{1,12})\)\s*$/.exec(d.name)?.[1] ?? d.name.split(" ").slice(0, 3).join(" ");

const Sub = ({ title, children }: { title: string; children: ReactNode }) => <div className="dt-sub"><div className="wf-sub">{t(title)}</div>{children}</div>;

function DocDetail({ doc }: { doc: RoleDoc }) {
  const g = doc.template ? guideByCode(doc.template) : undefined;
  const party = PARTIES.find((p) => p.id === doc.party);
  const stage = STAGES.find((s) => s.id === doc.stage);
  return (
    <>
      <div className="dt-panel-head">
        <span className={"dt-party-dot p-" + doc.party} />
        <div><b className="dt-panel-title">{t(doc.name)}</b>
          <div className="small muted">{party && t(party.label)} · {doc.stage} {stage && t(stage.label)} · {doc.clause}</div></div>
      </div>
      <p>{t(doc.purpose)}</p>
      <Sub title="What it must contain"><ul className="wf-ul">{doc.keyContent.map((x) => <li key={x}>{t(x)}</li>)}</ul></Sub>
      {g ? <>
        <div className="grid g2" style={{ gap: 10 }}>
          <Sub title="Written by"><a className="dg-role" href={`#/workflow/roles/${g.writer}`}>{t(ROLE_TITLES[g.writer])}</a></Sub>
          <Sub title="Approved by"><a className="dg-role" href={`#/workflow/roles/${g.approver}`}>{t(ROLE_TITLES[g.approver])}</a></Sub>
        </div>
        <Sub title="Why it matters"><p style={{ margin: 0 }}>{t(g.why)}</p></Sub>
        <Sub title="Document chain">
          <div className="row small" style={{ gap: 6 }}><span className="muted">{t("Draws on")}:</span>{g.inputs.map((c) => <span key={c} className="dg-chip plain">{c}</span>)}</div>
          <div className="row small" style={{ gap: 6, marginTop: 4 }}><span className="muted">{t("Feeds")}:</span>{g.feeds.map((c) => <span key={c} className="dg-chip plain">{c}</span>)}</div>
        </Sub>
        <Sub title="What to write, section by section">
          {g.sections.map((s, i) => <details key={i} className="clause"><summary><b>{i + 1}. {t(s.title)}</b></summary><p style={{ margin: "4px 0" }}>{t(s.whatToWrite)}</p><div className="dg-example">{t(s.example)}</div></details>)}
        </Sub>
        <Sub title="How to create it"><ol className="wf-list">{g.howTo.map((h, i) => <li key={i}>{t(h.step)}</li>)}</ol></Sub>
        <Sub title="Check before issue"><ul className="wf-ul">{g.checklist.map((x, i) => <li key={i}>{t(x)}</li>)}</ul></Sub>
        <Sub title="Common mistakes">{g.mistakes.map((m, i) => <div key={i} className="small" style={{ marginBottom: 6 }}><span style={{ color: "var(--danger)" }}>✗ {t(m.mistake)}</span><br />✓ {t(m.fix)}</div>)}</Sub>
        <div className="row" style={{ gap: 8 }}>
          <a className="btn primary" href={`#/doc-guides/${g.id}`}>{t("Open the full guide")} →</a>
          <a className="btn" href={`#/knowledge/iso19650/templates/${g.id}`}>{t("Open the template")}</a>
          <a className="btn" href={generateHref(g.name)}>{t("Draft it with AI")}</a>
        </div>
      </> : <div className="small muted">{t("This item is a record or deliverable rather than a template document. Its purpose and contents are above; the stage explains who produces it.")}</div>}
    </>
  );
}

function StageDetail({ id }: { id: string }) {
  const s = STAGES.find((x) => x.id === id)!;
  const wf = WF_STAGES.filter((x) => s.wf.includes(x.id));
  const docs = roleDocs.filter((d) => d.stage === id);
  return (
    <>
      <div className="dt-panel-head"><span className="dt-stage-n">{id}</span><div><b className="dt-panel-title">{t(s.label)}</b><div className="small muted">ISO 19650-2 · {docs.length} {t("documents")}</div></div></div>
      {wf.map((w) => {
        const people = WF_DUTIES.filter((d) => d.stage === w.id && (d.raci === "A" || d.raci === "R"));
        return (
          <div key={w.id}>
            {wf.length > 1 && <h4 style={{ margin: "10px 0 4px" }}>{t(w.title)}</h4>}
            <p>{t(w.purpose)}</p>
            <Sub title="What happens, in order"><ol className="wf-list">{w.steps.map((x, i) => <li key={i}>{t(x)}</li>)}</ol></Sub>
            <Sub title="Who does what">{people.map((d) => <div key={d.role} className="small" style={{ marginBottom: 6 }}><span className={"rc rc-" + d.raci}>{d.raci}</span> <b>{t(ROLE_TITLES[d.role])}</b> — {t(d.duty)}</div>)}</Sub>
            <Sub title="Gate: done when">{w.gate.map((x, i) => <div key={i} className="wf-gate">✓ <span>{t(x)}</span></div>)}</Sub>
            <a className="btn" href={`#/workflow/project/${w.id}`}>{t("Open the stage in the project workflow")} →</a>
          </div>
        );
      })}
    </>
  );
}

export default function DocTable() {
  const [stage, setStage] = useState("all");
  const [party, setParty] = useState("all");
  const [pick, setPick] = useState<Pick>(null);
  useEffect(() => { const on = (e: KeyboardEvent) => { if (e.key === "Escape") setPick(null); }; window.addEventListener("keydown", on); return () => window.removeEventListener("keydown", on); }, []);
  const stages = STAGES.filter((s) => stage === "all" || s.id === stage);
  const parties = PARTIES.filter((p) => party === "all" || p.id === party);
  // Cells start folded to one line; open one cell, a whole stage row, or everything.
  const [open, setOpen] = useState<Set<string>>(new Set());
  const cellKey = (s: string, p: string) => `${s}|${p}`;
  const allKeys = STAGES.flatMap((s) => PARTIES.map((p) => cellKey(s.id, p.id)));
  const toggle = (keys: string[]) => setOpen((o) => { const n = new Set(o); const on = keys.every((k) => n.has(k)); keys.forEach((k) => (on ? n.delete(k) : n.add(k))); return n; });
  const rowOpen = (s: string) => PARTIES.every((p) => open.has(cellKey(s, p.id)));
  return (
    <div className={"dt-wrap" + (pick ? " with-panel" : "")}>
      <div style={{ minWidth: 0, display: "grid", gap: 10 }}>
        <div className="row spread" style={{ gap: 8 }}>
          <div className="row small" style={{ gap: 6 }}><span className="muted">{t("Filter by stage")}:</span>
            <button className={"dt-filter" + (stage === "all" ? " on" : "")} onClick={() => setStage("all")}>{t("All stages")}</button>
            {STAGES.map((s) => <button key={s.id} className={"dt-filter" + (stage === s.id ? " on" : "")} onClick={() => setStage(s.id)} title={t(s.label)}>{s.id} {t(s.short)}</button>)}
          </div>
          <div className="row small" style={{ gap: 6 }}>
            <button className={"dt-filter" + (party === "all" ? " on" : "")} onClick={() => setParty("all")}>{t("All parties")}</button>
            {PARTIES.map((p) => <button key={p.id} className={"dt-filter p-" + p.id + (party === p.id ? " on" : "")} onClick={() => setParty(p.id)}>{t(p.label)}</button>)}
          </div>
        </div>
        <div className="row spread" style={{ gap: 8 }}>
          <div className="small muted">💡 {t("Click any stage or document to see its detailed explanation: purpose, contents, who writes and approves it, how to create it and what to check.")}</div>
          <div className="row" style={{ gap: 6 }}>
            <button className="small" onClick={() => setOpen(new Set(allKeys))}>▾ {t("Expand all")}</button>
            <button className="small" onClick={() => setOpen(new Set())}>▸ {t("Collapse all")}</button>
          </div>
        </div>
        <div className="table-wrap"><table className="dt-table">
          <thead><tr><th>{t("ISO 19650-2 stage")}</th>{parties.map((p) => <th key={p.id} className={"p-" + p.id}>{p.icon} {t(p.label)}</th>)}</tr></thead>
          <tbody>{stages.map((s) => (
            <tr key={s.id}>
              <th>
                <button className={"dt-stage" + (pick?.kind === "stage" && pick.id === s.id ? " on" : "")} onClick={() => setPick({ kind: "stage", id: s.id })}><span className="mono small muted">Cl. {s.id}</span><b>{t(s.label)}</b></button>
                <button className="dt-row-toggle" onClick={() => toggle(PARTIES.map((p) => cellKey(s.id, p.id)))} aria-expanded={rowOpen(s.id)}>{rowOpen(s.id) ? "▾ " + t("Collapse row") : "▸ " + t("Expand row")}</button>
              </th>
              {parties.map((p) => { const docs = roleDocs.filter((d) => d.stage === s.id && d.party === p.id); const k = cellKey(s.id, p.id); const isOpen = open.has(k); return (
                <td key={p.id}>{!docs.length ? <span className="muted small">—</span> : <>
                  <button className={"dt-fold p-" + p.id} aria-expanded={isOpen} onClick={() => toggle([k])}>
                    <span className="dt-arrow">{isOpen ? "▾" : "▸"}</span>
                    <b>{docs.length} {t(docs.length === 1 ? "document" : "documents")}</b>
                    {!isOpen && <span className="dt-codes">{docs.map((d) => <span key={d.name} className="dt-code-chip">{abbr(d)}</span>)}</span>}
                  </button>
                  {isOpen && docs.map((d) => (
                    <button key={d.name} className={"dt-doc p-" + p.id + (pick?.kind === "doc" && pick.doc === d ? " on" : "")} onClick={() => setPick({ kind: "doc", doc: d })}>
                      <b>{t(d.name)}</b><small>{t(d.summary)}</small>{d.template && guideByCode(d.template) && <span className="dt-guide">{d.template} · {t("guide")}</span>}
                    </button>))}
                </>}</td>); })}
            </tr>))}</tbody>
        </table></div>
      </div>
      {pick && (
        <aside className="dt-panel" aria-label={t("Details")}>
          <button className="icon-btn dt-close" onClick={() => setPick(null)} aria-label={t("Close")}>✕</button>
          {pick.kind === "doc" ? <DocDetail key={pick.doc.name} doc={pick.doc} /> : <StageDetail key={pick.id} id={pick.id} />}
        </aside>
      )}
    </div>
  );
}
