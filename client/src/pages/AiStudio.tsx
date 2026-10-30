import type { CSSProperties } from "react";
import { t } from "../i18n";
import { TONES } from "./HubPage";
import ClashTriage from "./tools/ClashTriage";
import ComplianceMatrix from "./tools/ComplianceMatrix";
import ModelQa from "./tools/ModelQa";
import ProgrammePlan from "./tools/ProgrammePlan";
import ProjectAgent from "./tools/ProjectAgent";
import AuditAssistant from "./tools/AuditAssistant";
import BepWriter from "./tools/BepWriter";
import EirWriter from "./tools/EirWriter";
import SheetQa from "./tools/SheetQa";

// Advanced AI tools for the BIM manager and coordinator. Each does the heavy lifting in the
// browser or with plain rules first, and sends AI only the summary it needs. /ai-studio/:tool

const TOOLS = [
  { id: "eir-writer", label: "EIR writer", title: "Write the EIR and AIR from a short brief", hint: "Answer a few questions about the project and get a complete EIR and a matching AIR in the platform's templates, with assumptions and items to confirm listed.", body: () => <EirWriter /> },
  { id: "bep-writer", label: "BEP from EIR", title: "Answer the EIR with a BEP", hint: "Upload the client's EIR and your company profile, and get a BEP that answers every requirement, with an EIR response matrix and the questions to raise at tender.", body: () => <BepWriter /> },
  { id: "compliance", label: "EIR ↔ BEP compliance", title: "Does the BEP answer every EIR requirement?", hint: "A requirement-by-requirement matrix with evidence, gaps and ready-to-paste BEP wording, exported to Excel and as a BEP addendum.", body: () => <ComplianceMatrix /> },
  { id: "model-qa", label: "Model QA from IDS", title: "Check a model against IDS, explained", hint: "Check an IFC model against IDS requirements in your browser, get each failure explained with how to fix it, and send the issues out as BCF.", body: () => <ModelQa /> },
  { id: "clash", label: "Clash triage", title: "From thousands of clashes to a short list", hint: "Read Navisworks or CSV clash reports, group duplicates and clusters, find the root cause, assign teams and priorities, and export BCF and a meeting agenda.", body: () => <ClashTriage /> },
  { id: "sheet-qa", label: "Drawing & sheet QA", title: "Check drawing title blocks", hint: "Upload PDF drawings; AI reads each title block and the platform checks the number, revision, status code, scale and dates against your naming rules and delivery plan.", body: () => <SheetQa /> },
  { id: "audit", label: "ISO 19650 audit", title: "Audit a project against ISO 19650", hint: "Upload the project's evidence and get each requirement of Parts 1, 2 and 5 assessed, with findings, actions, a score and an audit report.", body: () => <AuditAssistant /> },
  { id: "agent", label: "Project agent", title: "Ask your project what needs attention", hint: "Live facts from the project — overdue containers, changes, status codes, open issues — with a briefing and an assistant that answers from those facts.", body: () => <ProjectAgent /> },
  { id: "programme", label: "TIDP / MIDP from programme", title: "Turn the programme into delivery plans", hint: "Read MS Project, Primavera P6 or CSV, generate TIDP or MIDP rows with ISO 19650 names and dates, and see which containers move when the programme changes.", body: () => <ProgrammePlan /> },
] as const;

export default function AiStudio({ tool }: { tool?: string }) {
  const cur = TOOLS.find((x) => x.id === tool) ?? TOOLS[0];
  return (
    <div className="hub" style={{ "--hub": TONES.purple } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">{t("AI STUDIO")}</div><h1>{t(cur.title)}</h1><p>{t(cur.hint)}</p></div>
      <nav className="tabs" aria-label={t("AI studio")}>
        {TOOLS.map((x) => <a key={x.id} className={"tab" + (x.id === cur.id ? " on" : "")} href={`#/ai-studio/${x.id}`}>{t(x.label)}</a>)}
      </nav>
      <div key={cur.id}>{cur.body()}</div>
      <p className="tiny muted">{t("AI output is decision support. The accountable person reviews it before anything is issued.")}</p>
    </div>
  );
}
