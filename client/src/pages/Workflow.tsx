import { useState, type CSSProperties, type ReactNode } from "react";
import { t } from "../i18n";
import { DOC_FLOWS } from "../../../shared/data/workflow/docflow";
import { WF_DUTIES } from "../../../shared/data/workflow/duties";
import { WF_ROLES } from "../../../shared/data/workflow/roles";
import { WF_STAGES } from "../../../shared/data/workflow/stages";
import { ROLE_IDS, ROLE_TITLES, type Raci, type RoleId, type StageId } from "../../../shared/data/workflow/types";
import { TONES } from "./HubPage";

// Project workflow, document workflow and who does what: one page with four tabs.
// /workflow/project/:stage · /workflow/documents/:flow · /workflow/matrix · /workflow/roles/:role

const TABS = [
  { id: "project", label: "Project workflow", hint: "Ten stages from need to operation" },
  { id: "documents", label: "Document workflow", hint: "How files and documents move through the CDE" },
  { id: "matrix", label: "Roles by stage", hint: "Who is responsible, accountable, consulted, informed" },
  { id: "roles", label: "Role profiles", hint: "What each stakeholder does and owns" },
] as const;

const RACI_LABEL: Record<Exclude<Raci, "">, string> = { A: "Accountable", R: "Responsible", C: "Consulted", I: "Informed" };
const STATE_COLOR: Record<string, string> = { WIP: "var(--muted)", Shared: TONES.blue, Published: "var(--ok)", Archived: TONES.purple ?? "var(--muted)" };
const ACTION_LABEL = { create: "Create", update: "Update", approve: "Approve", use: "Use" } as const;
const cv = (c: string) => ({ "--c": c }) as CSSProperties;
const stageById = (id: string) => WF_STAGES.find((s) => s.id === id);
const duty = (role: RoleId, stage: StageId) => WF_DUTIES.find((d) => d.role === role && d.stage === stage);

const Box = ({ title, children }: { title: string; children: ReactNode }) => <div className="hub-card"><div className="hub-title">{t(title)}</div>{children}</div>;
const Raci = ({ v }: { v: Raci }) => (v ? <span className={"rc rc-" + v} title={t(RACI_LABEL[v])}>{v}</span> : <span className="rc rc-none">–</span>);

// ---------------------------------------------------------------- project workflow

function ProjectWorkflow({ stageId }: { stageId?: string }) {
  const stage = stageById(stageId ?? "") ?? WF_STAGES[0];
  const i = WF_STAGES.indexOf(stage);
  const people = WF_DUTIES.filter((d) => d.stage === stage.id && d.raci).sort((a, b) => "ARCI".indexOf(a.raci) - "ARCI".indexOf(b.raci));
  return (
    <>
      <div className="wf-stepper" role="tablist" aria-label={t("Project stages")}>
        {WF_STAGES.map((s, n) => (
          <a key={s.id} role="tab" aria-selected={s.id === stage.id} className={"wf-step" + (s.id === stage.id ? " on" : n < i ? " done" : "")} href={`#/workflow/project/${s.id}`}>
            <span className="wf-step-n">{n + 1}</span><span className="wf-step-text"><b>{t(s.title)}</b><small>{t(s.phase)}</small></span>
          </a>))}
      </div>

      <div className="hub-tile">
        <div className="row spread"><b style={{ fontSize: 17 }}>{i + 1}. {t(stage.title)}</b><span className="badge">{t(stage.iso)}</span></div>
        <div style={{ marginTop: 6 }}>{t(stage.purpose)}</div>
      </div>

      <div className="grid g2" style={{ alignItems: "start" }}>
        <Box title="What happens, in order">
          <ol className="wf-list">{stage.steps.map((x, n) => <li key={n}>{t(x)}</li>)}</ol>
        </Box>
        <div style={{ display: "grid", gap: 14 }}>
          <Box title="Gate: done when">
            {stage.gate.map((x, n) => <div key={n} className="wf-gate">✓ <span>{t(x)}</span></div>)}
          </Box>
          <Box title="Documents in this stage">
            {stage.documents.map((d, n) => (
              <div key={n} className="wf-doc"><span className={"wf-act wf-act-" + d.action}>{t(ACTION_LABEL[d.action])}</span><span>{t(d.name)}{d.code && <span className="muted small"> · {d.code}</span>}</span></div>
            ))}
          </Box>
        </div>
      </div>

      <Box title="Who does what in this stage">
        <div className="wf-people">{people.map((d) => (
          <a key={d.role} className="wf-person" href={`#/workflow/roles/${d.role}`}>
            <Raci v={d.raci} /><span><b>{t(ROLE_TITLES[d.role])}</b><small>{t(d.duty)}</small></span>
          </a>))}</div>
        <div className="small muted" style={{ marginTop: 8 }}><a href="#/workflow/matrix">{t("See every role across every stage")} →</a></div>
      </Box>

      <div className="grid g2" style={{ alignItems: "start" }}>
        <Box title="Pitfalls and how to prevent them">
          <div className="table-wrap"><table className="data hub-table"><tbody>{stage.pitfalls.map((p, n) => <tr key={n}><td style={{ color: "var(--danger)", width: "45%" }}>{t(p.problem)}</td><td>{t(p.prevent)}</td></tr>)}</tbody></table></div>
        </Box>
        <Box title="Tools for this stage">
          <div className="row" style={{ gap: 8 }}>{stage.tools.map((x) => <a key={x.path} className="btn" href={"#" + x.path}>{t(x.label)} →</a>)}</div>
        </Box>
      </div>

      <div className="row spread">
        {i > 0 ? <a className="btn" href={`#/workflow/project/${WF_STAGES[i - 1].id}`}>← {t(WF_STAGES[i - 1].title)}</a> : <span />}
        {i < WF_STAGES.length - 1 && <a className="btn primary" href={`#/workflow/project/${WF_STAGES[i + 1].id}`}>{t(WF_STAGES[i + 1].title)} →</a>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- document workflow

function DocumentWorkflow({ flowId }: { flowId?: string }) {
  const flow = DOC_FLOWS.find((f) => f.id === flowId) ?? DOC_FLOWS[0];
  return (
    <>
      <div className="seg">{DOC_FLOWS.map((f) => <a key={f.id} className={"btn" + (f.id === flow.id ? " on-chip" : "")} href={`#/workflow/documents/${f.id}`}>{t(f.title)}</a>)}</div>
      <div className="hub-tile">{t(flow.summary)}</div>
      <div className="wf-states">{(["WIP", "Shared", "Published", "Archived"] as const).map((s) => (
        <span key={s} className="wf-state" style={cv(STATE_COLOR[s])}><b>{t(s)}</b><small>{flow.steps.filter((x) => x.state === s).length} {t("steps")}</small></span>))}</div>
      <div className="wf-flow">
        {flow.steps.map((s, n) => (
          <div key={s.id} className="wf-card" style={cv(STATE_COLOR[s.state])}>
            <div className="wf-card-head">
              <span className="wf-step-n">{n + 1}</span>
              <b>{t(s.title)}</b>
              <span className="wf-tags"><span className="wf-tag">{t(s.state)}</span><span className="wf-tag mono">{s.code}</span><span className="wf-tag mono">{s.revision}</span></span>
            </div>
            <div className="small muted" style={{ margin: "4px 0 8px" }}><b>{t("Who")}:</b> {t(s.who)}</div>
            <div className="grid g2" style={{ alignItems: "start" }}>
              <div><div className="wf-sub">{t("Actions")}</div><ul className="wf-ul">{s.actions.map((x, k) => <li key={k}>{t(x)}</li>)}</ul></div>
              <div><div className="wf-sub">{t("Checks")}</div><ul className="wf-ul">{s.checks.map((x, k) => <li key={k}>{t(x)}</li>)}</ul></div>
            </div>
            <div className="wf-fail">⚠ {t(s.failure)}</div>
          </div>))}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <a className="btn" href="#/knowledge/iso19650/library/2">{t("CDE & status codes")} →</a>
        <a className="btn" href="#/tools/naming-check">{t("File naming checker")} →</a>
        <a className="btn" href="#/ai-tools/suitability">{t("Suitability code hub")} →</a>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- roles by stage

function Matrix() {
  const [cell, setCell] = useState<{ role: RoleId; stage: StageId } | null>(null);
  const [focus, setFocus] = useState<RoleId | "">("");
  const picked = cell && duty(cell.role, cell.stage);
  return (
    <>
      <div className="row" style={{ gap: 6 }}>
        {(["A", "R", "C", "I"] as const).map((v) => <span key={v} className="row small" style={{ gap: 4 }}><Raci v={v} />{t(RACI_LABEL[v])}</span>)}
        <span className="small muted">· {t("Click a cell to read the duty.")}</span>
      </div>
      <div className="table-wrap wf-matrix-wrap"><table className="data wf-matrix">
        <thead><tr><th>{t("Role")}</th>{WF_STAGES.map((s, n) => <th key={s.id} title={t(s.title)}><a href={`#/workflow/project/${s.id}`}>{n + 1}</a><small>{t(s.title)}</small></th>)}</tr></thead>
        <tbody>{ROLE_IDS.map((r) => (
          <tr key={r} className={focus === r ? "focus" : ""}>
            <th><button className="linklike" onClick={() => setFocus(focus === r ? "" : r)}>{t(ROLE_TITLES[r])}</button></th>
            {WF_STAGES.map((s) => { const d = duty(r, s.id); const on = cell?.role === r && cell?.stage === s.id; return (
              <td key={s.id} className={on ? "on" : ""}><button className="wf-cell" onClick={() => setCell({ role: r, stage: s.id })} aria-label={`${ROLE_TITLES[r]} · ${s.title}`}><Raci v={d?.raci ?? ""} /></button></td>); })}
          </tr>))}</tbody>
      </table></div>
      {picked && cell && (
        <div className="hub-tile">
          <div className="row spread"><b>{t(ROLE_TITLES[cell.role])} · {t(stageById(cell.stage)!.title)}</b><Raci v={picked.raci} /></div>
          <div style={{ marginTop: 6 }}>{t(picked.duty)}</div>
          <div className="row small" style={{ gap: 12, marginTop: 8 }}><a href={`#/workflow/project/${cell.stage}`}>{t("Open the stage")} →</a><a href={`#/workflow/roles/${cell.role}`}>{t("Open the role profile")} →</a></div>
        </div>)}
    </>
  );
}

// ---------------------------------------------------------------- role profiles

function RoleProfiles({ roleId }: { roleId?: string }) {
  const role = WF_ROLES.find((r) => r.id === roleId) ?? WF_ROLES.find((r) => r.id === "bim-manager") ?? WF_ROLES[0];
  return (
    <div className="wf-roles">
      <nav className="wf-role-list" aria-label={t("Roles")}>
        {WF_ROLES.map((r) => <a key={r.id} className={r.id === role.id ? "on" : ""} href={`#/workflow/roles/${r.id}`}><b>{t(r.title)}</b><small>{t(r.party)}</small></a>)}
      </nav>
      <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
        <div className="hub-tile"><div className="row spread"><b style={{ fontSize: 18 }}>{t(role.title)}</b><span className="badge">{t(role.party)}</span></div><div style={{ marginTop: 6 }}>{t(role.summary)}</div></div>
        <div className="grid g2" style={{ alignItems: "start" }}>
          <Box title="Responsibilities"><ul className="wf-ul">{role.responsibilities.map((x, n) => <li key={n}>{t(x)}</li>)}</ul></Box>
          <div style={{ display: "grid", gap: 14 }}>
            <Box title="Documents this role owns"><ul className="wf-ul">{role.owns.map((x, n) => <li key={n}>{t(x)}</li>)}</ul></Box>
            <Box title="Measures of success"><ul className="wf-ul">{role.kpis.map((x, n) => <li key={n}>{t(x)}</li>)}</ul></Box>
          </div>
        </div>
        <Box title="Across the project">
          <div className="wf-people">{WF_STAGES.map((s, n) => { const d = duty(role.id, s.id); return (
            <a key={s.id} className={"wf-person" + (d?.raci ? "" : " idle")} href={`#/workflow/project/${s.id}`}><Raci v={d?.raci ?? ""} /><span><b>{n + 1}. {t(s.title)}</b><small>{t(d?.duty ?? "")}</small></span></a>); })}</div>
        </Box>
        <div className="grid g2" style={{ alignItems: "start" }}>
          <Box title="Skills"><div className="row" style={{ gap: 6 }}>{role.skills.map((x) => <span key={x} className="badge">{t(x)}</span>)}</div></Box>
          <Box title="Tools for this role"><div className="row" style={{ gap: 8 }}>{role.tools.map((x) => <a key={x.path} className="btn" href={"#" + x.path}>{t(x.label)} →</a>)}</div></Box>
        </div>
      </div>
    </div>
  );
}

export default function Workflow({ tab, arg }: { tab?: string; arg?: string }) {
  const cur = TABS.find((x) => x.id === tab) ?? TABS[0];
  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">ISO 19650 · {t("WORKFLOW & ROLES")}</div><h1>{t(cur.label)}</h1><p>{t(cur.hint)}</p></div>
      <nav className="tabs" aria-label={t("Workflow sections")}>
        {TABS.map((x) => <a key={x.id} className={"tab" + (cur.id === x.id ? " on" : "")} href={`#/workflow/${x.id}`}>{t(x.label)}</a>)}
      </nav>
      {cur.id === "project" && <ProjectWorkflow stageId={arg} />}
      {cur.id === "documents" && <DocumentWorkflow flowId={arg} />}
      {cur.id === "matrix" && <Matrix />}
      {cur.id === "roles" && <RoleProfiles roleId={arg} />}
      <p className="tiny muted">{t("Practical guidance aligned to ISO 19650-2 and -3 with UK National Annex codes; adapt it to your appointment and project information standard.")}</p>
    </div>
  );
}
