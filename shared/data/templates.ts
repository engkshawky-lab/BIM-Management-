import type { DocTemplate, TemplateField, TemplateSection } from "./types";
import { allControls42001 } from "./iso42001";

const text = (id: string, label: string, hint?: string, defaultValue?: string): TemplateField => ({ id, label, type: "text", hint, defaultValue });
const area = (id: string, label: string, hint?: string, defaultValue?: string): TemplateField => ({ id, label, type: "textarea", hint, defaultValue });
const date = (id: string, label: string): TemplateField => ({ id, label, type: "date" });
const select = (id: string, label: string, options: string[]): TemplateField => ({ id, label, type: "select", options, defaultValue: options[0] });
const table = (id: string, label: string, columns: string[], defaultRows: string[][] = [], hint?: string): TemplateField => ({ id, label, type: "table", columns, defaultRows, hint });
const sec = (id: string, title: string, guidance: string, fields: TemplateField[]): TemplateSection => ({ id, title, guidance, fields });

const projectInfo = sec("project", "Project information", "Identify the project, the parties and the document context.", [
  text("projectName", "Project name"),
  text("projectCode", "Project code", "Used as the first field of the naming convention"),
  text("appointingParty", "Appointing party"),
  text("location", "Site / location"),
  area("description", "Project description"),
]);

const aimsInfo = sec("org", "Organization information", "Identify the organization and the AIMS scope this document applies to.", [
  text("orgName", "Organization name"),
  text("aimsScope", "AIMS scope reference"),
  select("aiRole", "Organization's AI role", ["AI provider", "AI producer", "AI customer / user", "AI partner", "Multiple roles"]),
  text("owner", "Document owner"),
]);

export const templates: DocTemplate[] = [
  // ---------------- ISO 19650 ----------------
  {
    id: "oir", standard: "iso19650", code: "OIR", category: "Requirements", title: "Organizational Information Requirements",
    purpose: "Captures the strategic information the appointing party needs to run its business and its asset portfolio.",
    clauseRefs: ["19650-1 §5.2", "19650-3 §5.1"],
    sections: [
      aimsInfoAs19650(),
      sec("objectives", "Strategic objectives", "List the organizational objectives information must support (e.g. asset performance, compliance, cost).", [
        table("objectives", "Objectives", ["Objective", "Decision supported", "Information needed", "Owner"], [["Reduce operational cost", "Annual maintenance budgeting", "Asset condition and maintenance history", "FM Director"]]),
      ]),
      sec("functions", "Business functions", "Business functions that consume asset information.", [
        area("functions", "Functions", undefined, "Strategic planning\nAsset management\nFinance & reporting\nHealth & safety\nRegulatory compliance"),
      ]),
    ],
  },
  {
    id: "air", standard: "iso19650", code: "AIR", category: "Requirements", title: "Asset Information Requirements",
    purpose: "Defines the managerial, commercial and technical information needed about assets, feeding the AIM.",
    clauseRefs: ["19650-1 §5.3", "19650-3 §5.1.5"],
    sections: [
      projectInfo,
      sec("assets", "Asset types and attributes", "For each asset type, define required attributes, format and source.", [
        table("assetReqs", "Asset requirements", ["Asset type", "Attribute", "Format", "Source stage", "Purpose (OIR ref)"], [
          ["AHU", "Manufacturer, model, serial no.", "COBie", "Construction", "Maintenance planning"],
          ["Door", "Fire rating", "IFC Pset", "Design", "Compliance"],
        ]),
      ]),
      sec("aimFormat", "AIM structure and handover", "Define the target CAFM/EAM system, structure and exchange format.", [
        text("targetSystem", "Target CAFM / EAM system"),
        select("exchangeFormat", "Exchange format", ["COBie (xlsx)", "IFC 4.3", "IFC 2x3", "Native + COBie", "Custom spreadsheet"]),
        text("classification", "Classification system", undefined, "Uniclass 2015"),
      ]),
    ],
  },
  {
    id: "eir", standard: "iso19650", code: "EIR", category: "Requirements", title: "Exchange Information Requirements",
    purpose: "Sets out the appointing party's information requirements for an appointment: what, when, how and to what level of need.",
    clauseRefs: ["19650-2 §5.2.1"],
    sections: [
      projectInfo,
      sec("info-reqs", "Information requirements", "Requirements derived from OIR / AIR / PIR, including purposes and key decision points.", [
        table("purposes", "Information purposes", ["Purpose", "Key decision point", "Information required", "LOIN reference"], [
          ["Design coordination", "Stage 3 sign-off", "Federated discipline models", "LOIN-03"],
          ["Cost planning", "Stage 2 / 3 / 4", "Quantities by element", "LOIN-02"],
          ["Asset handover", "Practical completion", "COBie + O&M", "LOIN-06"],
        ]),
      ]),
      sec("loin", "Level of information need", "Define geometry, alphanumeric information and documentation per milestone (ISO 7817-1).", [
        table("loin", "LOIN matrix", ["Ref", "Milestone", "Geometry", "Alphanumeric", "Documentation"], [
          ["LOIN-02", "Concept", "Massing, indicative", "Area, function", "Design statement"],
          ["LOIN-03", "Spatial coordination", "Coordinated systems", "Type properties", "GA drawings"],
          ["LOIN-06", "Handover", "As-built", "COBie complete", "O&M manuals"],
        ]),
      ]),
      sec("milestones", "Information delivery milestones", "Align with the project programme and decision points.", [
        table("milestones", "Milestones", ["Milestone", "Date", "Information deliverable", "Acceptance criteria"]),
      ]),
      sec("standards", "Information standard, methods and procedures", "Reference the project information standard and production methods.", [
        text("naming", "Naming convention", undefined, "BS EN ISO 19650-2 UK NA field structure"),
        text("cde", "CDE platform", "e.g. Autodesk Construction Cloud, Viewpoint, ProjectWise"),
        select("format", "Primary exchange format", ["IFC 4.3", "IFC 4", "IFC 2x3", "Native + IFC"]),
        text("units", "Units & coordinates", undefined, "Metric (mm), project base point per survey"),
      ]),
      sec("acceptance", "Acceptance criteria", "How the appointing party will review and accept each deliverable.", [
        area("acceptanceCriteria", "Acceptance criteria", undefined, "Conforms to naming and metadata standard\nMeets LOIN for the milestone\nModel checked for clashes with zero critical issues\nCOBie validated without errors"),
      ]),
      sec("tender", "Tender response requirements", "What tenderers must submit and how it will be evaluated.", [
        area("tenderReqs", "Required submissions", undefined, "Pre-appointment BEP\nCapability and capacity assessment\nMobilization plan\nInformation delivery risk register"),
      ]),
    ],
  },
  {
    id: "info-standard", standard: "iso19650", code: "PIS", category: "Standards", title: "Project Information Standard",
    purpose: "Defines naming, metadata, classification, formats and status codes for all information containers.",
    clauseRefs: ["19650-2 §5.1.4", "UK NA"],
    sections: [
      projectInfo,
      sec("naming", "Container naming convention", "Field codes for Project-Originator-Volume-Level-Type-Role-Number.", [
        table("originators", "Originator codes", ["Code", "Organization"]),
        table("volumes", "Volume / system codes", ["Code", "Description"], [["ZZ", "All volumes"], ["XX", "No volume applies"]]),
        table("levels", "Level / location codes", ["Code", "Description"], [["00", "Ground floor"], ["01", "Level 1"], ["ZZ", "Multiple levels"], ["XX", "No level applies"]]),
      ]),
      sec("metadata", "Metadata", "Mandatory metadata on every container in the CDE.", [
        table("metadataFields", "Metadata fields", ["Field", "Values", "Mandatory"], [["Status (suitability)", "S0–S7, A1–An, CR", "Yes"], ["Revision", "P01.01 / C01", "Yes"], ["Classification", "Uniclass", "Yes"]]),
      ]),
      sec("revision", "Revision convention", "Preliminary (P) and contractual (C) revisions with versions.", [
        area("revisionRules", "Revision rules", undefined, "WIP versions: P01.01, P01.02 …\nShared: P01, P02 …\nPublished: C01, C02 …"),
      ]),
      sec("formats", "File formats and software", "Authoring tools, versions and exchange formats.", [
        table("software", "Software schedule", ["Discipline", "Authoring tool", "Version", "Exchange format"]),
      ]),
    ],
  },
  {
    id: "cde-procedure", standard: "iso19650", code: "CDE", category: "Standards", title: "CDE Workflow & Procedure",
    purpose: "Defines CDE states, transitions, approvers and folder structure.",
    clauseRefs: ["19650-1 §12", "19650-2 §5.1.7", "19650-4"],
    sections: [
      projectInfo,
      sec("platform", "CDE solution", "Platform, administrator and access rules.", [
        text("platform", "Platform"), text("admin", "CDE administrator"), area("access", "Access & permissions policy"),
      ]),
      sec("transitions", "State transitions", "Who checks, reviews and approves each transition.", [
        table("transitions", "Transitions", ["From", "To", "Check / review", "Approver", "Suitability"], [
          ["WIP", "Shared", "QA check + technical review", "Task team manager", "S1–S4"],
          ["Shared", "Published", "Authorization + acceptance", "Lead appointed party / Appointing party", "A1–An"],
          ["Published", "Archived", "Superseded", "Information manager", "—"],
        ]),
      ]),
      sec("folders", "Folder structure", "Top-level folder structure in the CDE.", [
        area("folderTree", "Folders", undefined, "00_WIP/<Task team>\n01_SHARED/<Discipline>\n02_PUBLISHED/<Stage>\n03_ARCHIVED\n04_CLIENT_INFORMATION\n05_REFERENCE"),
      ]),
    ],
  },
  {
    id: "info-protocol", standard: "iso19650", code: "IP", category: "Contract", title: "Information Protocol",
    purpose: "Defines obligations, licences and liabilities for information, incorporated into each appointment.",
    clauseRefs: ["19650-2 §5.1.8"],
    sections: [
      projectInfo,
      sec("obligations", "Obligations", "Obligations of the appointing party and appointed parties.", [area("appointingObl", "Appointing party obligations"), area("appointedObl", "Appointed party obligations")]),
      sec("licences", "Licensing and use", "Permitted purposes and licence terms for information.", [area("licence", "Licence terms"), area("permittedUse", "Permitted purposes")]),
      sec("security", "Security", "Requirements derived from the ISO 19650-5 security triage.", [select("sensitivity", "Sensitivity outcome", ["Not sensitive", "Sensitive — security-minded approach required"]), area("securityReqs", "Security requirements")]),
      sec("liability", "Liability and IP", "Liability limits, intellectual property and retention.", [area("liabilityText", "Liability provisions")]),
    ],
  },
  {
    id: "bep-pre", standard: "iso19650", code: "BEP-PRE", category: "Plans", title: "BIM Execution Plan (Pre-appointment)",
    purpose: "Tender-stage plan demonstrating how the delivery team will meet the EIR.",
    clauseRefs: ["19650-2 §5.3.2"],
    sections: [
      projectInfo,
      sec("team", "Proposed delivery team", "Lead appointed party, task teams and the information management function.", [
        table("team", "Delivery team", ["Organization", "Task team / discipline", "Information manager", "Contact"]),
      ]),
      sec("strategy", "Information delivery strategy", "How the EIR will be met, key milestones and approach.", [area("deliveryStrategy", "Delivery strategy")]),
      sec("federation", "Proposed federation strategy", "How models are broken down and federated.", [area("federation", "Federation strategy", undefined, "One model per discipline per building zone; federated weekly in coordination software.")]),
      sec("matrix", "High-level responsibility matrix", "Which task team is responsible for which information.", [table("hlrm", "Responsibility", ["Information / element", "Responsible task team", "LOIN"])]),
      sec("amendments", "Proposed amendments", "Proposed amendments to the information standard or methods.", [area("amendments", "Amendments")]),
      sec("software", "Proposed software & IT", "Software and hardware schedule.", [table("it", "IT schedule", ["Discipline", "Software", "Version", "Exchange"])]),
    ],
  },
  {
    id: "bep-post", standard: "iso19650", code: "BEP-POST", category: "Plans", title: "BIM Execution Plan (Post-appointment)",
    purpose: "Confirmed BEP after appointment, with named individuals, confirmed federation and delivery plans.",
    clauseRefs: ["19650-2 §5.4.1"],
    sections: [
      projectInfo,
      sec("people", "Named information management roles", "Named individuals and their responsibilities.", [table("people", "Roles", ["Role", "Name", "Organization", "Responsibilities"], [["Information manager", "", "", "CDE governance, QA checks"], ["BIM coordinator", "", "", "Federation and clash coordination"]])]),
      sec("federation", "Confirmed federation strategy & container breakdown", "Final breakdown structure.", [area("federation", "Federation strategy"), table("breakdown", "Container breakdown", ["Container", "Discipline", "Zone / volume", "Owner"])]),
      sec("methods", "Information production methods", "Confirmed methods, procedures and coordination workflow.", [area("coordination", "Coordination and clash detection process", undefined, "Weekly federation, clash tests per matrix, BCF issue tracking, review in coordination meeting.")]),
      sec("schedule", "Delivery schedule", "Reference to MIDP and TIDPs.", [text("midpRef", "MIDP reference"), date("baselineDate", "Baseline date")]),
      sec("risks", "Information risks", "Confirmed risk register reference.", [area("risks", "Key risks")]),
    ],
  },
  {
    id: "resp-matrix", standard: "iso19650", generatedFrom: { kind: "resp-matrix", hubPath: "delivery/responsibility", label: "Responsibility matrix" }, code: "DRM", category: "Plans", title: "Detailed Responsibility Matrix",
    purpose: "Defines who produces which information, when and to what level of information need.",
    clauseRefs: ["19650-2 §5.4.2"],
    sections: [projectInfo, sec("matrix", "Matrix", "One row per deliverable / element per milestone.", [
      table("matrix", "Responsibility matrix", ["Information / element", "Milestone", "Responsible (R)", "Accountable (A)", "Consulted (C)", "Informed (I)", "LOIN"], [["Structural frame model", "Stage 3", "Structural engineer", "Lead appointed party", "Architect", "Client", "LOIN-03"]]),
    ])],
  },
  {
    id: "tidp", standard: "iso19650", generatedFrom: { kind: "tidp", hubPath: "delivery/plan", label: "MIDP / TIDP planner" }, code: "TIDP", category: "Plans", title: "Task Information Delivery Plan",
    purpose: "Task team schedule of information containers, durations and dependencies.",
    clauseRefs: ["19650-2 §5.4.4"],
    sections: [projectInfo, sec("team", "Task team", "Identify the task team.", [text("taskTeam", "Task team"), text("manager", "Task team manager")]),
      sec("schedule", "Container schedule", "One row per information container.", [
        table("containers", "Containers", ["Container name", "Description", "LOIN", "Duration (days)", "Dependencies", "Due date", "Milestone"], [["PRJ01-ABC-ZZ-ZZ-M3-A-0001", "Architectural model", "LOIN-03", "20", "Survey", "", "Stage 3"]]),
      ])],
  },
  {
    id: "midp", standard: "iso19650", generatedFrom: { kind: "midp", hubPath: "delivery/plan", label: "MIDP / TIDP planner" }, code: "MIDP", category: "Plans", title: "Master Information Delivery Plan",
    purpose: "Aggregates all TIDPs into one plan aligned with delivery milestones.",
    clauseRefs: ["19650-2 §5.4.5"],
    sections: [projectInfo, sec("milestones", "Milestones", "Delivery milestones from the EIR.", [table("milestones", "Milestones", ["Milestone", "Date", "Purpose"])]),
      sec("plan", "Aggregated plan", "Rows from all TIDPs.", [table("plan", "MIDP", ["Task team", "Container", "LOIN", "Due date", "Milestone", "Status"])]),
      sec("risks", "Risks to delivery", "Risks identified when aggregating TIDPs.", [area("risks", "Risks")])],
  },
  {
    id: "capability", standard: "iso19650", code: "CCA", category: "Tender", title: "Capability & Capacity Assessment",
    purpose: "Assesses each task team's information management capability, IT and capacity.",
    clauseRefs: ["19650-2 §5.3.3", "§5.3.4"],
    sections: [projectInfo, sec("assessment", "Assessment", "Score 1–5 for each criterion.", [
      table("scores", "Task team scores", ["Task team", "IM skills", "Software skills", "IT / hardware", "Capacity (FTE)", "Prior ISO 19650 projects", "Comments"]),
    ]), sec("summary", "Summary", "Delivery team overall capability and gaps.", [area("summary", "Summary and actions")])],
  },
  {
    id: "mobilization", standard: "iso19650", code: "MOB", category: "Tender", title: "Mobilization Plan",
    purpose: "How resources, IT and methods will be mobilized and tested.",
    clauseRefs: ["19650-2 §5.3.5", "§5.5"],
    sections: [projectInfo, sec("plan", "Mobilization activities", "Activities, owners and dates.", [
      table("activities", "Activities", ["Activity", "Owner", "Start", "Finish", "Evidence"], [["CDE setup & user access", "Information manager", "", "", "Access list"], ["Naming convention test", "BIM coordinator", "", "", "Test report"], ["Federation test", "BIM coordinator", "", "", "Federated model"]]),
    ])],
  },
  {
    id: "risk-register", standard: "iso19650", generatedFrom: { kind: "risk-register", hubPath: "delivery/risks", label: "Risk register" }, code: "RR", category: "Tender", title: "Information Delivery Risk Register",
    purpose: "Risks to timely delivery of information and their mitigation.",
    clauseRefs: ["19650-2 §5.3.6"],
    sections: [projectInfo, sec("risks", "Risks", "Score likelihood and impact 1–5.", [
      table("risks", "Risk register", ["ID", "Risk", "Likelihood", "Impact", "Score", "Mitigation", "Owner"], [["R01", "Late survey information", "3", "4", "12", "Early procurement of survey", "Client"]]),
    ])],
  },
  {
    id: "info-uses", standard: "iso19650", generatedFrom: { kind: "info-uses", hubPath: "delivery/uses", label: "Information uses" }, code: "IU", category: "Plans", title: "Information Uses Schedule",
    purpose: "The purposes for which information is produced on this project, with priority, responsible task teams, deliverables and information need.",
    clauseRefs: ["19650-1 §5.1", "19650-2 §5.1.2", "§5.3.2"],
    sections: [projectInfo, sec("uses", "Information uses", "Generated from the project's selected information uses.", [
      table("uses", "Information uses", ["Code", "Use", "Phases", "Priority", "Task teams", "Deliverables", "Information need", "Notes"], []),
    ])],
  },
  {
    id: "qa-checklist", standard: "iso19650", code: "QA", category: "Quality", title: "Information Container QA Checklist",
    purpose: "QA check before a container moves from WIP to Shared.",
    clauseRefs: ["19650-2 §5.6.3"],
    sections: [projectInfo, sec("checks", "Checks", "Record result for each check.", [
      text("container", "Container name"),
      table("checks", "QA checks", ["Check", "Result (Pass/Fail)", "Comment"], [["Name conforms to naming convention", "", ""], ["Metadata complete (status, revision, classification)", "", ""], ["Correct file format & version", "", ""], ["Coordinates / units per standard", "", ""], ["LOIN met for milestone", "", ""], ["Model purged / no unused content", "", ""], ["Clash check complete", "", ""]]),
      text("checkedBy", "Checked by"), date("checkDate", "Date"),
    ])],
  },
  {
    id: "lessons", standard: "iso19650", code: "LL", category: "Close-out", title: "Lessons Learned Report",
    purpose: "Captures lessons for future projects at close-out.",
    clauseRefs: ["19650-2 §5.8.2"],
    sections: [projectInfo, sec("lessons", "Lessons", "What went well, what didn't, and recommendation.", [
      table("lessons", "Lessons", ["Topic", "What happened", "Impact", "Recommendation", "Owner"]),
    ])],
  },

  {
    id: "bim-scope", standard: "iso19650", code: "SCOPE", category: "Contract", title: "BIM Scope of Services",
    purpose: "Defines the information management and BIM services each appointed party provides, by stage, for inclusion in the appointment.",
    clauseRefs: ["19650-2 5.2.3", "19650-2 5.4.6"],
    sections: [projectInfo,
      sec("services", "Services by stage", "Tick the stages each service applies to and who provides it.", [
        table("services", "Services", ["Service", "Provider", "Stage 2", "Stage 3", "Stage 4", "Stage 5", "Stage 6", "Deliverable"], [
          ["Information management function", "Lead appointed party", "✓", "✓", "✓", "✓", "✓", "IM reports"],
          ["Discipline information models", "Each task team", "✓", "✓", "✓", "✓", "", "IFC + native models"],
          ["Federation & clash coordination", "BIM coordinator", "", "✓", "✓", "✓", "", "Coordination reports, BCF"],
          ["Quantity take-off from models", "Cost consultant", "✓", "✓", "✓", "", "", "Cost plan"],
          ["COBie / asset data", "Contractor", "", "", "✓", "✓", "✓", "Validated COBie"],
          ["As-constructed models", "Contractor", "", "", "", "✓", "✓", "CR models"],
        ]),
      ]),
      sec("exclusions", "Exclusions and assumptions", "Services not included and assumptions the fee is based on.", [area("exclusions", "Exclusions"), area("assumptions", "Assumptions")]),
      sec("resources", "Resources and fee basis", "Key roles and effort.", [table("roles", "Roles", ["Role", "Organization", "Effort (days/month)", "Stages"])]),
    ],
  },
  {
    id: "mpdt", standard: "iso19650", code: "MPDT", category: "Plans", title: "Model Production and Delivery Table",
    purpose: "States who models which element, to what level of information need, at each stage — the element-level companion to the responsibility matrix.",
    clauseRefs: ["19650-2 5.4.2", "ISO 7817-1"],
    sections: [projectInfo,
      sec("table", "Model production and delivery", "One row per element or system. Use LOIN references from the delivery plan.", [
        table("rows", "MPDT", ["Element / system", "Classification", "Model author (task team)", "Stage 2 LOIN", "Stage 3 LOIN", "Stage 4 LOIN", "Stage 5 LOIN", "Notes"], [
          ["External walls", "Ss_25_10", "Architecture", "LOIN-02", "LOIN-03", "LOIN-04", "LOIN-05", ""],
          ["Structural frame", "Ss_20_10", "Structures", "LOIN-02", "LOIN-03", "LOIN-04", "LOIN-05", ""],
          ["Ductwork", "Ss_65_40", "MEP", "", "LOIN-03", "LOIN-04", "LOIN-05", "Fabrication model by contractor at Stage 5"],
        ]),
      ]),
      sec("rules", "Modelling rules", "Ownership hand-over between designers and contractor, origin and coordinates.", [area("ownership", "Ownership transfer rules"), area("coordinates", "Origin, units and coordinate system")]),
    ],
  },

  // ---------------- ISO/IEC 42001 ----------------
  {
    id: "ai-context", standard: "iso42001", code: "AI-CTX", category: "Context", title: "Context, Interested Parties & AIMS Scope",
    purpose: "Documents internal/external issues, interested parties and the AIMS scope.",
    clauseRefs: ["42001 §4.1", "§4.2", "§4.3"],
    sections: [aimsInfo,
      sec("issues", "Internal & external issues", "Issues relevant to the organization's purpose and AI.", [table("issues", "Issues", ["Type (Internal/External)", "Issue", "Effect on AIMS"], [["External", "EU AI Act obligations", "Conformity evidence required"], ["Internal", "Use of generative AI for design documentation", "Need for responsible use policy"]])]),
      sec("parties", "Interested parties", "Parties and their requirements.", [table("parties", "Interested parties", ["Party", "Requirements / expectations", "Addressed by AIMS? (Y/N)"], [["Clients", "Reliable, explainable AI-assisted deliverables", "Y"], ["Regulators", "Legal compliance", "Y"], ["Employees", "Training and clear responsibilities", "Y"]])]),
      sec("scope", "Scope statement", "Boundaries and applicability of the AIMS.", [area("scope", "Scope"), area("exclusions", "Exclusions and justification")]),
    ],
  },
  {
    id: "ai-inventory", standard: "iso42001", code: "AI-INV", category: "Context", title: "AI System Inventory",
    purpose: "Register of all AI systems developed, provided or used by the organization.",
    clauseRefs: ["42001 §4.1", "A.4.2"],
    sections: [aimsInfo, sec("inventory", "Inventory", "One row per AI system.", [
      table("systems", "AI systems", ["System", "Purpose / intended use", "Role (provider/user)", "Owner", "Data used", "Risk level", "Impact assessment ref"], [["Clash triage assistant", "Prioritize BIM clashes", "User", "BIM manager", "Federated IFC models", "Medium", ""]]),
    ])],
  },
  {
    id: "ai-policy", standard: "iso42001", code: "AI-POL", category: "Leadership", title: "AI Policy",
    purpose: "Top-level AI policy providing a framework for AI objectives.",
    clauseRefs: ["42001 §5.2", "A.2.2"],
    sections: [aimsInfo,
      sec("purpose", "Purpose and scope", "Why the policy exists and to what it applies.", [area("purpose", "Purpose", undefined, "This policy sets the organization's commitment to the responsible development, provision and use of AI systems in line with ISO/IEC 42001.")]),
      sec("principles", "Principles", "Responsible AI principles the organization commits to.", [area("principles", "Principles", undefined, "Accountability — a named human owner for every AI system\nTransparency — users are told when AI is used\nFairness — bias is assessed and mitigated\nSafety & security — AI systems are tested before deployment\nPrivacy — personal data is minimized and protected\nHuman oversight — critical decisions remain with competent people")]),
      sec("commitments", "Commitments", "Commitment to satisfy requirements and continual improvement.", [area("commitments", "Commitments", undefined, "Satisfy applicable requirements\nContinually improve the AIMS\nProvide a framework for setting AI objectives")]),
      sec("roles", "Roles", "Who owns and approves the policy.", [text("approvedBy", "Approved by (top management)"), date("approvalDate", "Approval date"), select("reviewCycle", "Review cycle", ["Annual", "Every 6 months", "On significant change"])]),
    ],
  },
  {
    id: "ai-raci", standard: "iso42001", code: "AI-RACI", category: "Leadership", title: "AIMS Roles & Responsibilities",
    purpose: "Allocates AIMS roles and responsibilities.",
    clauseRefs: ["42001 §5.3", "A.3.2"],
    sections: [aimsInfo, sec("raci", "RACI", "Assign responsibility for AIMS activities.", [
      table("raci", "RACI", ["Activity", "Top management", "AIMS lead", "AI system owner", "Data owner", "Internal audit"], [["AI policy", "A", "R", "C", "C", "I"], ["AI risk assessment", "I", "A", "R", "C", "I"], ["Impact assessment", "I", "A", "R", "C", "I"], ["Internal audit", "I", "C", "C", "C", "R/A"]]),
    ]), sec("concerns", "Reporting of concerns", "Channel for reporting AI concerns (A.3.3).", [area("concernsProcess", "Process")])],
  },
  {
    id: "ai-risk", standard: "iso42001", code: "AI-RISK", category: "Planning", title: "AI Risk Assessment & Treatment Plan",
    purpose: "Identifies, analyses and evaluates AI risks and records treatment.",
    clauseRefs: ["42001 §6.1.2", "§6.1.3", "§8.2", "§8.3"],
    sections: [aimsInfo,
      sec("criteria", "Risk criteria", "Likelihood and consequence scales and acceptance threshold.", [area("criteria", "Criteria", undefined, "Likelihood 1–5, Consequence 1–5; Score = L × C\nAcceptable ≤ 6; Treat 8–14; Intolerable ≥ 15")]),
      sec("register", "Risk register", "One row per risk.", [table("risks", "Risks", ["ID", "AI system", "Risk source", "Risk description", "L", "C", "Score", "Treatment", "Annex A controls", "Owner"], [["AR-01", "Clash triage assistant", "Model error", "Critical clash classified as minor", "3", "4", "12", "Mitigate: human review of all high-severity outputs", "A.6.2.4, A.9.4", ""]])]),
    ],
  },
  {
    id: "ai-impact", standard: "iso42001", code: "AISIA", category: "Planning", title: "AI System Impact Assessment",
    purpose: "Assesses consequences of an AI system for individuals, groups and society.",
    clauseRefs: ["42001 §6.1.4", "§8.4", "A.5", "ISO/IEC 42005"],
    sections: [aimsInfo,
      sec("system", "System description", "The AI system, its intended use and foreseeable misuse.", [text("systemName", "AI system"), area("intendedUse", "Intended use"), area("misuse", "Reasonably foreseeable misuse"), area("dataSources", "Data sources")]),
      sec("individuals", "Impacts on individuals or groups", "Fairness, privacy, safety, autonomy (A.5.4).", [table("indImpacts", "Impacts", ["Affected party", "Impact", "Severity", "Likelihood", "Mitigation"])]),
      sec("society", "Societal impacts", "Environment, economy, employment, public trust (A.5.5).", [table("socImpacts", "Impacts", ["Area", "Impact", "Severity", "Mitigation"])]),
      sec("decision", "Conclusion", "Decision and sign-off.", [select("decision", "Decision", ["Proceed", "Proceed with mitigations", "Do not proceed"]), text("assessor", "Assessor"), date("assessDate", "Date")]),
    ],
  },
  {
    id: "ai-soa", standard: "iso42001", code: "SoA", category: "Planning", title: "Statement of Applicability (Annex A)",
    purpose: "Lists all Annex A controls with applicability, justification and implementation status.",
    clauseRefs: ["42001 §6.1.3"],
    sections: [aimsInfo, sec("soa", "Controls", "Mark each control applicable or not, with justification and status.", [
      table("controls", "Annex A controls", ["Control", "Title", "Applicable (Y/N)", "Justification", "Implementation status", "Evidence"],
        allControls42001.map((c) => [c.id, c.title, "Y", "", "Planned", ""])),
    ])],
  },
  {
    id: "ai-objectives", standard: "iso42001", code: "AI-OBJ", category: "Planning", title: "AI Objectives Plan",
    purpose: "Measurable AI objectives and how they will be achieved.",
    clauseRefs: ["42001 §6.2"],
    sections: [aimsInfo, sec("objectives", "Objectives", "SMART objectives consistent with the AI policy.", [
      table("objectives", "Objectives", ["Objective", "KPI / measure", "Target", "Owner", "Resources", "Due date"], [["All AI systems have an impact assessment", "% systems with AISIA", "100%", "AIMS lead", "", ""]]),
    ])],
  },
  {
    id: "ai-lifecycle", standard: "iso42001", code: "AI-LC", category: "Operation", title: "AI System Life Cycle Procedure",
    purpose: "Responsible design, development, verification, deployment and monitoring of AI systems.",
    clauseRefs: ["42001 §8.1", "A.6", "A.7"],
    sections: [aimsInfo,
      sec("requirements", "Requirements & design", "A.6.2.2 / A.6.2.3.", [area("reqProcess", "Requirements and design process")]),
      sec("data", "Data management", "Acquisition, quality, provenance, preparation (A.7).", [area("dataProcess", "Data management process")]),
      sec("vv", "Verification & validation", "A.6.2.4 — criteria and evidence.", [table("vv", "V&V criteria", ["Test", "Metric", "Threshold", "Evidence"])]),
      sec("deploy", "Deployment, operation & monitoring", "A.6.2.5 – A.6.2.8.", [area("deploy", "Deployment plan"), area("monitor", "Monitoring and event logging")]),
    ],
  },
  {
    id: "ai-audit", standard: "iso42001", code: "AI-AUD", category: "Evaluation", title: "Internal Audit Plan & Report",
    purpose: "Plan and report internal audits of the AIMS.",
    clauseRefs: ["42001 §9.2"],
    sections: [aimsInfo,
      sec("plan", "Audit plan", "Scope, criteria, auditors and schedule.", [text("auditScope", "Scope"), text("auditor", "Lead auditor"), date("auditDate", "Audit date"), table("schedule", "Schedule", ["Clause / control", "Auditee", "Time"])]),
      sec("findings", "Findings", "Findings by clause.", [table("findings", "Findings", ["Ref", "Clause / control", "Type (NC major / NC minor / OFI)", "Finding", "Evidence", "Action owner"])]),
      sec("conclusion", "Conclusion", "Overall conclusion.", [area("conclusion", "Conclusion")]),
    ],
  },
  {
    id: "ai-mgmt-review", standard: "iso42001", code: "AI-MR", category: "Evaluation", title: "Management Review Minutes",
    purpose: "Records top management review of the AIMS.",
    clauseRefs: ["42001 §9.3"],
    sections: [aimsInfo,
      sec("meeting", "Meeting", "Date and attendees.", [date("meetingDate", "Date"), area("attendees", "Attendees")]),
      sec("inputs", "Review inputs", "Required inputs.", [table("inputs", "Inputs", ["Input", "Summary"], [["Status of actions from previous reviews", ""], ["Changes in external and internal issues", ""], ["Changes in needs of interested parties", ""], ["Nonconformities and corrective actions", ""], ["Monitoring and measurement results", ""], ["Audit results", ""], ["Opportunities for continual improvement", ""]])]),
      sec("outputs", "Decisions & actions", "Decisions on improvement and changes.", [table("actions", "Actions", ["Action", "Owner", "Due date"])]),
    ],
  },
  {
    id: "ai-capa", standard: "iso42001", code: "AI-CAPA", category: "Improvement", title: "Nonconformity & Corrective Action Log",
    purpose: "Tracks nonconformities, root causes and corrective actions.",
    clauseRefs: ["42001 §10.2"],
    sections: [aimsInfo, sec("log", "Log", "One row per nonconformity.", [
      table("ncs", "Nonconformities", ["Ref", "Date", "Description", "Root cause", "Correction", "Corrective action", "Owner", "Effectiveness verified"]),
    ])],
  },
];

function aimsInfoAs19650(): TemplateSection {
  return sec("org", "Organization information", "Identify the appointing organization and its asset portfolio.", [
    text("orgName", "Organization name"), area("portfolio", "Asset portfolio description"), text("owner", "Document owner"),
  ]);
}

export const templateById = (id: string) => templates.find((t) => t.id === id);
