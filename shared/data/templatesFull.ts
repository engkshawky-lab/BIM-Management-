// Full-length ISO 19650 templates (BEP pre/post, capability assessment, handover strategy,
// BIM specification). Generic wording; structure follows common EIR appendix practice.
import type { DocTemplate, TemplateField, TemplateSection } from "./types";

const text = (id: string, label: string, hint?: string, defaultValue?: string): TemplateField => ({ id, label, type: "text", hint, defaultValue });
const area = (id: string, label: string, hint?: string, defaultValue?: string): TemplateField => ({ id, label, type: "textarea", hint, defaultValue });
const date = (id: string, label: string): TemplateField => ({ id, label, type: "date" });
const select = (id: string, label: string, options: string[]): TemplateField => ({ id, label, type: "select", options, defaultValue: options[0] });
const table = (id: string, label: string, columns: string[], defaultRows: string[][] = [], hint?: string): TemplateField => ({ id, label, type: "table", columns, defaultRows, hint });
const sec = (id: string, title: string, guidance: string, fields: TemplateField[]): TemplateSection => ({ id, title, guidance, fields });

export function fullTemplates(projectInfo: TemplateSection): DocTemplate[] {
  const roles = [["Information manager (lead appointed party)", "", "", "CDE governance, information model QA, audits, MIDP"], ["BIM coordinator", "", "", "Federation, clash detection, issue management"], ["Task information manager (per task team)", "", "", "TIDP, model production, compliance checks"], ["Information author / modeller", "", "", "Produce information to the standard and LOIN"], ["CDE administrator", "", "", "Access, folders, workflows, backups"]];
  const software = [["Architecture", "", "", "IFC 4 / native", "Weekly"], ["Structure", "", "", "IFC 4 / native", "Weekly"], ["MEP", "", "", "IFC 4 / native", "Weekly"], ["Infrastructure", "", "", "IFC 4.3 / LandXML", "Weekly"], ["Coordination", "", "", "NWD / BCF", "Weekly"], ["CDE", "", "", "—", "—"]];
  const bepCommon = (post: boolean): TemplateSection[] => [
    sec("intro", "1. Introduction", "Purpose of this BEP, scope of the appointment and how the document is maintained.", [
      area("purpose", "Purpose and scope", undefined, `This ${post ? "post" : "pre"}-appointment BIM execution plan explains how the delivery team will manage and deliver information to meet the exchange information requirements (EIR) of the appointing party, in line with ISO 19650-2.`),
      table("references", "Reference documents", ["Document", "Reference", "Revision"], [["Exchange information requirements (EIR)", "", ""], ["Project information standard", "", ""], ["Project information production methods & procedures", "", ""], ["Information protocol", "", ""]]),
      table("revisions", "Revision history", ["Revision", "Date", "Description", "Author"], [["P01", "", "First issue", ""]]),
    ]),
    sec("project", "2. Project information", "Key project data, milestones and stage definitions.", [
      area("description", "Project description"), text("location", "Site / location"), text("projectType", "Project type"), text("contractForm", "Form of contract / procurement route"),
      table("milestones", "Key project milestones", ["Milestone", "Stage", "Date", "Information exchange"], [["Concept design", "", "", ""], ["Schematic design", "", "", ""], ["Detailed design", "", "", ""], ["Issued for tender", "", "", ""], ["Issued for construction", "", "", ""], ["Handover", "", "", ""]]),
    ]),
    sec("team", "3. Delivery team", "Appointing party, lead appointed party, task teams and contacts.", [
      table("parties", "Parties", ["Role", "Organization", "Contact", "Email"], [["Appointing party", "", "", ""], ["Lead appointed party", "", "", ""], ["Architect", "", "", ""], ["Structural engineer", "", "", ""], ["MEP engineer", "", "", ""], ["Infrastructure / civil", "", "", ""], ["Landscape", "", "", ""], ["Cost consultant", "", "", ""]]),
      table("roles", post ? "Named information management roles" : "Proposed information management roles", ["Role", "Name", "Organization", "Responsibilities"], roles),
    ]),
    sec("uses", "4. Information uses & goals", "Purposes for which information is produced. Reference the generated Information Uses Schedule.", [
      area("goals", "BIM goals"), text("usesRef", "Information Uses Schedule reference", "Generate it under Delivery › Information uses"),
    ]),
    sec("strategy", "5. Information delivery strategy", "How the EIR will be met, the federation strategy and the container breakdown.", [
      area("deliveryStrategy", "Approach to meeting the EIR"),
      area("federation", "Federation strategy", undefined, "One model per discipline per building / zone. Models are federated weekly in the coordination software; the federated model is reviewed in the coordination meeting."),
      table("breakdown", "Information container breakdown structure", ["Volume / zone", "Discipline", "Container (model) name", "Responsible task team"]),
      text("mrmRef", "Model responsibility matrix reference", "Generate under Delivery › Model responsibility"),
    ]),
    sec("standards", "6. Standards, methods & procedures", "Confirm or propose amendments to the project information standard.", [
      area("naming", "Naming convention", undefined, "Project–Originator–Volume/System–Level/Location–Type–Role–Number, with status (S0–S7, A1–A5) and revision (P01.01 / P01 / C01) metadata."),
      area("coordinates", "Coordinates, units and levels", undefined, "Shared site coordinate system and project base point as defined in the information standard; millimetres; levels and grids from the architectural model."),
      text("classification", "Classification system", undefined, "Uniclass 2015"),
      area("loin", "Level of information need", undefined, "As defined in the LOIN / MRM per milestone; geometry, alphanumeric information and documentation."),
      area("amendments", "Proposed amendments to standards / methods"),
    ]),
    sec("cde", "7. Common data environment", "CDE solution, workflow states and approvals.", [
      text("cdeSolution", "CDE solution"), area("cdeWorkflow", "Workflow", undefined, "WIP → Shared (S1–S4 after task team check and lead approval) → Published (A1–A5 after appointing party authorization) → Archived."),
      table("access", "Access rights", ["Organization / role", "WIP", "Shared", "Published", "Archive"], [["Task team", "Edit own", "Read", "Read", "Read"], ["Lead appointed party", "—", "Read / approve", "Read", "Read"], ["Appointing party", "—", "Read", "Authorize", "Read"]]),
    ]),
    sec("coordination", "8. Collaboration & coordination", "Meetings, federation, clash detection and issue management.", [
      table("meetings", "Meetings", ["Meeting", "Frequency", "Chair", "Attendees"], [["BIM kick-off", "Once", "Information manager", "All task teams"], ["BIM coordination", "Weekly", "BIM coordinator", "Task information managers"], ["BIM progress", "Monthly", "Information manager", "Appointing party, leads"]]),
      area("clash", "Clash detection process", undefined, "Clash tests per the clash matrix (search sets, tolerances, frequency). Results are grouped, assigned through BCF issues and tracked to closure."),
    ]),
    sec("quality", "9. Quality assurance", "Checks before information is shared and published.", [
      area("qa", "QA process", undefined, "Each container is checked by the task team (naming, metadata, LOIN, model QA/QC checklist) before sharing; the lead appointed party reviews before publishing. Model reviews are graded A–D."),
      table("checks", "Checks", ["Check", "Tool / method", "By", "Frequency"], [["File naming & metadata", "CDE validation", "Task team", "Each upload"], ["Model QA/QC checklist", "Portal review", "Task information manager", "Each submission"], ["IFC / COBie validation", "Portal validation", "Information manager", "Each milestone"], ["Clash detection", "Coordination software", "BIM coordinator", "Weekly"]]),
    ]),
    sec("software", "10. Software, hardware & IT", "Software, versions and exchange formats.", [
      table("it", "Software schedule", ["Discipline", "Authoring software", "Version", "Exchange format", "Exchange frequency"], software),
      area("security", "Information security", undefined, "Access controlled by role; security-sensitive information handled per the security management plan (ISO 19650-5)."),
    ]),
    ...(post ? [
      sec("schedule", "11. Delivery schedule", "MIDP/TIDP references and baseline.", [text("midpRef", "MIDP reference"), date("baselineDate", "Baseline date"), text("raciRef", "Responsibility matrix reference")]),
      sec("handover", "12. Handover & asset information", "Approach to the AIM, COBie and as-built information.", [area("handover", "Handover approach"), text("handoverRef", "Handover strategy reference")]),
      sec("risks", "13. Risks", "Reference the information delivery risk register.", [text("riskRef", "Risk register reference"), area("risks", "Key risks")]),
    ] : [
      sec("capability", "11. Capability & capacity summary", "Summary of the delivery team's assessment.", [text("ccaRef", "Capability assessment reference"), area("capacity", "Capacity statement")]),
      sec("risks", "12. Proposed risks & mitigation", "Risks to information delivery identified at tender.", [table("risks", "Risks", ["Risk", "Likelihood", "Impact", "Mitigation"])]),
    ]),
  ];

  return [
    { id: "bep-pre", standard: "iso19650", code: "BEP-PRE", category: "Plans", title: "BIM Execution Plan (Pre-appointment)",
      purpose: "Tender-stage plan demonstrating how the prospective delivery team will meet the EIR (team, strategy, standards, CDE, IT, capability, risks).",
      clauseRefs: ["19650-2 §5.3.2"], sections: [projectInfo, ...bepCommon(false)] },
    { id: "bep-post", standard: "iso19650", code: "BEP-POST", category: "Plans", title: "BIM Execution Plan (Post-appointment)",
      purpose: "Confirmed BEP after appointment: named roles, confirmed strategy and methods, delivery schedule, handover and risks.",
      clauseRefs: ["19650-2 §5.4.1"], sections: [projectInfo, ...bepCommon(true)] },
    { id: "capability", standard: "iso19650", code: "CCA", category: "Tender", title: "Capability & Capacity Assessment",
      purpose: "Assesses each prospective task team's information management capability, technology and capacity.",
      clauseRefs: ["19650-2 §5.3.3", "§5.3.4"],
      sections: [projectInfo,
        sec("org", "Organization", "Who is being assessed.", [text("organization", "Organization"), select("teamRole", "Role", ["Lead appointed party", "Appointed party (task team)"]), text("respondent", "Completed by")]),
        sec("im", "Information management capability", "Score each 0 (none) – 5 (proven on several projects); give evidence.", [
          table("imScores", "Capability", ["Criterion", "Score (0–5)", "Evidence"], [["ISO 19650 certified or audited process", "", ""], ["Experience producing BEPs / TIDPs", "", ""], ["CDE workflows (WIP/Shared/Published)", "", ""], ["Naming, metadata and revision control", "", ""], ["Model federation and clash coordination", "", ""], ["Model QA/QC procedures", "", ""], ["COBie / asset information delivery", "", ""], ["Information security (ISO 19650-5)", "", ""]]),
        ]),
        sec("uses", "Information uses capability", "Capability against the project's selected information uses.", [table("useScores", "Information uses", ["Information use", "Capable (Y/N)", "Projects delivered", "Comments"], [["Design authoring", "", "", ""], ["3D coordination & clash detection", "", "", ""], ["Quantity take-off", "", "", ""], ["4D phase planning", "", "", ""], ["Asset data (COBie) delivery", "", "", ""], ["Record (as-built) modelling", "", "", ""]])]),
        sec("tech", "Technology", "Software, hardware and IT.", [table("software", "Software", ["Software", "Version", "Licences", "Users trained"]), area("hardware", "Hardware & IT infrastructure")]),
        sec("capacity", "Capacity & resources", "People available for this appointment.", [table("people", "Resources", ["Role", "Name", "Years of experience", "Availability (%)", "Certifications"])]),
        sec("projects", "Reference projects", "Comparable projects delivered with BIM.", [table("refs", "Projects", ["Project", "Client", "Value", "Role", "Information uses delivered"])]),
        sec("summary", "Assessment summary", "Scores, gaps and actions to close them.", [select("result", "Result", ["Capable", "Capable with actions", "Not capable"]), area("gaps", "Gaps and mobilisation actions")]),
      ] },
    { id: "handover-strategy", standard: "iso19650", code: "HOS", category: "Close-out", title: "Information Handover Strategy",
      purpose: "How the project information model becomes the asset information model: scope, timing, formats, verification and acceptance.",
      clauseRefs: ["19650-2 §5.7", "§5.8", "19650-3 §5.7"],
      sections: [projectInfo,
        sec("scope", "Scope of handover information", "What is handed over and for which assets.", [area("scope", "Scope"), table("deliverables", "Handover deliverables", ["Deliverable", "Format", "Responsible", "Due"], [["As-built models", "IFC + native", "Contractor", ""], ["COBie / asset data", "COBie xlsx", "Contractor", ""], ["Asset register with tags", "xlsx", "Contractor", ""], ["O&M manuals", "PDF (linked to assets)", "Contractor", ""], ["Warranties & certificates", "PDF", "Contractor", ""], ["Test & commissioning records", "PDF", "Commissioning manager", ""], ["Record drawings", "PDF + DWG", "Contractor", ""]])]),
        sec("timeline", "Staged delivery", "Progressive delivery of asset information before practical completion.", [table("stages", "Stages", ["Stage", "Information delivered", "Date", "Acceptance"], [["Issued for construction", "Asset types and tags", "", ""], ["Construction (progressive)", "Installed components, serials, dates", "", ""], ["Pre-handover", "Complete COBie + O&M", "", ""], ["Handover", "Final AIM", "", ""]])]),
        sec("verify", "Verification & acceptance", "How information is checked against the AIR before acceptance.", [area("verification", "Verification", undefined, "COBie validated against the client standard at the handover stage; asset tags checked; site sample verification of 10% of assets; model QA/QC review grade A or B required.")]),
        sec("transfer", "Transfer to the AIM", "Systems receiving the information and the migration approach.", [text("cafm", "Receiving CAFM / CMMS"), area("migration", "Migration and training")]),
        sec("roles", "Responsibilities", "Who does what.", [table("raci", "Roles", ["Activity", "Responsible", "Accountable", "Consulted"], [["Collect asset data", "Contractor", "Lead appointed party", "Specialists"], ["Validate", "Information manager", "Lead appointed party", "Client FM"], ["Accept", "Client FM", "Appointing party", "Information manager"]])]),
      ] },
    { id: "security-triage", standard: "iso19650", code: "SEC", category: "Security", title: "Security Triage & Security Management Plan",
      purpose: "ISO 19650-5 sensitivity assessment: decide whether a security-minded approach is needed and, if so, the controls for sharing information.",
      clauseRefs: ["19650-5 §4", "§5", "§6"],
      sections: [projectInfo,
        sec("triage", "Security triage", "Answer each question; any 'Yes' indicates a security-minded approach is needed.", [
          table("questions", "Sensitivity assessment", ["Question", "Yes / No", "Notes"], [
            ["Is the asset (or part of it) part of national infrastructure or a critical service?", "", ""],
            ["Could the information reveal security measures, vulnerabilities or access routes?", "", ""],
            ["Is the asset used by people or functions that could be targeted (government, defence, VIP, crowds)?", "", ""],
            ["Could aggregation of information (e.g. federated models) reveal sensitive patterns?", "", ""],
            ["Is commercially sensitive or personal information involved?", "", ""],
            ["Would loss or disclosure of information harm safety, operations or reputation?", "", ""],
          ]),
          select("outcome", "Outcome", ["No security-minded approach required", "Security-minded approach required", "Refer to senior responsible owner"]),
        ]),
        sec("strategy", "Security strategy", "Risks and the overall approach if a security-minded approach is required.", [area("risks", "Security risks"), area("strategy", "Strategy")]),
        sec("plan", "Security management plan", "Controls for information handling.", [
          table("controls", "Controls", ["Area", "Control", "Owner"], [["Classification & marking", "Sensitive containers flagged in the CDE", ""], ["Access", "Need-to-know access by role; periodic review", ""], ["Sharing", "Redacted exports / view-only for sensitive areas", ""], ["Personnel", "Vetting and briefing for those with access", ""], ["Breach management", "Report within 24 h; investigate; lessons learned", ""]]),
          table("register", "Sensitive information register", ["Information / container", "Sensitivity", "Handling", "Approved by"]),
        ]),
      ] },
    { id: "bim-scope", standard: "iso19650", code: "SPEC", category: "Contract", title: "BIM Specification & Scope of Services",
      purpose: "Contract BIM specification: general requirements, project database, data extraction, contractor roles, post-contract BIM management and construction progress monitoring, plus services by stage.",
      clauseRefs: ["19650-2 §5.2.3", "§5.4.6"],
      sections: [projectInfo,
        sec("general", "1. General requirements", "Related documents, scope of this section and general obligations.", [
          table("related", "Related documents", ["Document", "Reference"], [["Exchange information requirements", ""], ["BIM execution plan", ""], ["Information protocol", ""]]),
          area("general", "General requirements", undefined, "The contractor shall produce, coordinate and maintain the information models and data described in this specification, using the CDE, standards and methods defined by the appointing party."),
        ]),
        sec("database", "2. Project database & CDE", "Structure and management of the project database.", [area("database", "Project database requirements"), area("access", "Access, backup and security")]),
        sec("extraction", "3. Data extraction", "Information the appointing party will extract from the models.", [table("extraction", "Extracted information", ["Information", "From", "Format", "Frequency"], [["Quantities", "Discipline models", "xlsx", "Each milestone"], ["Room / space data", "Architectural model", "xlsx", "Each milestone"], ["Asset data", "All models", "COBie", "Construction & handover"]])]),
        sec("roles", "4. Roles and responsibilities of each contractor", "Main contractor, subcontractors and specialists.", [table("roles", "Roles", ["Party", "Responsibilities"], [["Main contractor", "Information management, federation, coordination, as-built AIM"], ["MEP subcontractor", "Shop drawings models, installation coordination, asset data"], ["Specialist suppliers", "Fabrication models and product data"]])]),
        sec("post", "5. Post-contract BIM management", "BIM manager, model updates, RFIs and change management.", [area("post", "Post-contract BIM management")]),
        sec("progress", "6. Construction planning & progress monitoring", "4D planning and model-based progress reporting.", [area("fourD", "4D planning", undefined, "Model elements linked to the programme; 4D simulation reviewed monthly."), area("progress", "Progress monitoring", undefined, "Model status parameters updated weekly (planned / installed / inspected) and reported in the BIM progress report.")]),
        sec("services", "7. Services by stage", "Tick the stages each service applies to and who provides it.", [
          table("services", "Services", ["Service", "Provider", "Design", "Tender", "Construction", "Handover", "Deliverable"], [
            ["Information management function", "Lead appointed party", "✓", "✓", "✓", "✓", "IM reports"],
            ["Discipline information models", "Each task team", "✓", "✓", "✓", "", "IFC + native models"],
            ["Federation & clash coordination", "BIM coordinator", "✓", "", "✓", "", "Coordination reports, BCF"],
            ["Quantity take-off from models", "Cost consultant", "✓", "✓", "", "", "Cost plan"],
            ["COBie / asset data", "Contractor", "", "", "✓", "✓", "Validated COBie"],
            ["As-constructed models", "Contractor", "", "", "✓", "✓", "As-built models"],
          ]),
        ]),
        sec("misc", "8. Miscellaneous", "Exclusions, assumptions and other requirements.", [area("exclusions", "Exclusions"), area("assumptions", "Assumptions")]),
      ] },
  ];
}
