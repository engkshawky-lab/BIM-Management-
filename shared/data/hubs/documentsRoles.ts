import type { Hub, RoleDoc } from "./types";

// Documents aligned with roles: which ISO 19650 documents each party produces, receives
// and reviews at each stage of the ISO 19650-2 process (5.1 to 5.8). Clause references
// follow process19650 in ../iso19650.ts; document names follow the template titles in
// ../templates*.ts. Content is paraphrased practical guidance, not reproduced standard text.

// Stage × party document cards for the "Document table" tab. Stage ids match the
// process19650 clause numbers; party ids match the hub sections.
export const roleDocs: RoleDoc[] = [
  // ------------------------------------------------------------ 5.1 Assessment and need
  {
    stage: "5.1", party: "appointing", name: "Information management assignment matrix",
    summary: "Who carries out each information management task for the appointing party",
    purpose: "Records which individuals or organisations perform the appointing party's information management function. It is updated as parties are appointed and tasks are delegated.",
    keyContent: ["Information management tasks", "Party and named individual responsible", "Tasks delegated to third parties", "Authority to accept information", "Revision history"],
    clause: "ISO 19650-2 5.1.1",
  },
  {
    stage: "5.1", party: "appointing", name: "Organizational Information Requirements (OIR)",
    summary: "Information the organisation needs to meet its strategic objectives",
    purpose: "Sets out the information the organisation needs at a strategic level, independent of any single project. It is a key input to the AIR and the project information requirements.",
    keyContent: ["Business and asset management objectives", "Decisions the information must support", "Reporting and regulatory needs", "Links to asset management systems", "Owner and review cycle"],
    clause: "ISO 19650-2 5.1.2", template: "OIR",
  },
  {
    stage: "5.1", party: "appointing", name: "Asset Information Requirements (AIR)",
    summary: "Information needed to operate and maintain the asset after handover",
    purpose: "States the asset information the operator needs, so that the delivery team can produce it during the project rather than collect it afterwards.",
    keyContent: ["Asset types and systems covered", "Attributes required for each asset type", "Documents required, such as manuals and certificates", "Formats and target systems", "Timing of delivery"],
    clause: "ISO 19650-2 5.1.2", template: "AIR",
  },
  {
    stage: "5.1", party: "appointing", name: "Project information requirements (PIR)",
    summary: "The decisions this project must support and the information they need",
    purpose: "Defines the information the appointing party needs to make its key decisions on this project. It links the organisational and asset needs to the requirements in each EIR.",
    keyContent: ["Project scope and purpose", "Key decision points", "Questions the information must answer", "Information purposes, such as approvals, cost and programme", "Links to the OIR and AIR"],
    clause: "ISO 19650-2 5.1.2",
  },
  {
    stage: "5.1", party: "appointing", name: "Information delivery milestones",
    summary: "When information is needed, aligned with the project programme",
    purpose: "Establishes the points at which information must be delivered so that it is available for each key decision. Every EIR and delivery plan is built around these milestones.",
    keyContent: ["Milestone identifiers and dates", "Linked key decision points", "Stage boundaries", "Information purpose at each milestone", "Alignment with the project programme"],
    clause: "ISO 19650-2 5.1.3",
  },
  {
    stage: "5.1", party: "appointing", name: "Project Information Standard (PIS)",
    summary: "Naming, metadata, formats, codes and coordinates for every container",
    purpose: "Defines how information is structured, classified and exchanged on the project, so that every appointment produces consistent information.",
    keyContent: ["Exchange formats and versions", "Container naming convention", "Classification system", "Metadata, status and suitability codes", "Method for defining the level of information need", "Units, coordinates and origin"],
    clause: "ISO 19650-2 5.1.4", template: "PIS",
  },
  {
    stage: "5.1", party: "appointing", name: "Information production methods and procedures",
    summary: "How information is captured, produced, reviewed, approved and delivered",
    purpose: "Describes the procedures every task team follows to produce and deliver information, so that review, approval and security are handled the same way across the project.",
    keyContent: ["Capture of existing asset information", "Container breakdown structure", "Review and approval procedure", "Security and access procedure", "Delivery to the appointing party"],
    clause: "ISO 19650-2 5.1.5",
  },
  {
    stage: "5.1", party: "appointing", name: "Reference information and shared resources register",
    summary: "Existing information and resources the delivery team will be given",
    purpose: "Lists the existing information, libraries and templates the appointing party will make available, with notes on their status and reliability.",
    keyContent: ["Surveys and existing models", "Existing asset records", "Templates, title blocks and object libraries", "Status and reliability of each item", "How and when each item is made available"],
    clause: "ISO 19650-2 5.1.6",
  },
  {
    stage: "5.1", party: "appointing", name: "CDE Workflow & Procedure (CDE)",
    summary: "How the common data environment is set up and used on the project",
    purpose: "Describes the common data environment the appointing party establishes before tender, so that every party can share and manage information in it from the start.",
    keyContent: ["States: work in progress, shared, published, archived", "Workflows between states", "Roles and permissions", "Metadata and revision rules", "Onboarding of new parties", "Archive and retention"],
    clause: "ISO 19650-2 5.1.7", template: "CDE",
  },
  {
    stage: "5.1", party: "appointing", name: "Information Protocol (IP)",
    summary: "Contractual obligations, licences and liabilities for project information",
    purpose: "Sets the information-related obligations of each party and is incorporated into every appointment, so the requirements are contractually binding at every tier.",
    keyContent: ["Parties and appointments covered", "Obligations of each party", "Licences to use information and their limits", "Liabilities relating to information", "Security requirements", "References to the standard and methods"],
    clause: "ISO 19650-2 5.1.8", template: "IP",
  },
  {
    stage: "5.1", party: "appointing", name: "Security Triage & Security Management Plan (SEC)",
    summary: "Sensitivity assessment and the security measures that follow from it",
    purpose: "Assesses whether the project or asset is sensitive and, where it is, sets proportionate security measures for handling information.",
    keyContent: ["Outcome of the sensitivity assessment", "Security measures required", "Access controls and vetting", "Handling of sensitive containers", "Incident management and reporting"],
    clause: "ISO 19650-5; ISO 19650-2 5.1.5", template: "SEC",
  },

  // ------------------------------------------------------------ 5.2 Invitation to tender
  {
    stage: "5.2", party: "appointing", name: "Exchange Information Requirements (EIR)",
    summary: "What one appointment must deliver, when, how and how it will be accepted",
    purpose: "Defines the information requirements for a specific appointment. It is the document the lead appointed party tenders and contracts against.",
    keyContent: ["Information requirements for the appointment", "Level of information need", "Acceptance criteria for each requirement", "Information delivery milestones", "Supporting information provided", "Interfaces with other appointments"],
    clause: "ISO 19650-2 5.2.1", template: "EIR",
  },
  {
    stage: "5.2", party: "appointing", name: "Tender response requirements and evaluation criteria",
    summary: "What tenderers must submit and how information management will be scored",
    purpose: "Tells tenderers which information management submissions are required and how they will be evaluated, so responses can be compared fairly.",
    keyContent: ["Required submissions, such as the pre-appointment BEP", "Scoring method and weightings", "Minimum thresholds", "Format and page limits", "Clarification process"],
    clause: "ISO 19650-2 5.2.3",
  },
  {
    stage: "5.2", party: "appointing", name: "BIM Specification & Scope of Services (SPEC)",
    summary: "The information management services required in the appointment",
    purpose: "Describes the information management tasks and deliverables the appointment includes, so they can be priced and do not fall between appointments.",
    keyContent: ["Information management tasks", "Deliverables", "Interfaces with other appointments", "Links to the EIR", "Exclusions"],
    clause: "ISO 19650-2 5.2.4", template: "SPEC",
  },
  {
    stage: "5.2", party: "appointing", name: "Invitation to tender pack",
    summary: "Everything tenderers need to price and plan information delivery",
    purpose: "Bundles the requirements, standards, methods, protocol and reference information into one invitation, so all tenderers respond to the same information.",
    keyContent: ["EIR", "Project information standard", "Production methods and procedures", "Information protocol", "Reference information and shared resources", "Tender response requirements and evaluation criteria"],
    clause: "ISO 19650-2 5.2.4",
  },
  {
    stage: "5.2", party: "lead", name: "Tender queries and EIR review notes",
    summary: "Questions and observations raised after reviewing the invitation to tender",
    purpose: "Records the prospective lead appointed party's review of the invitation to tender and the clarifications it needs before it can commit to the EIR.",
    keyContent: ["Requirements that are unclear or conflicting", "Questions on the standard, methods and protocol", "Gaps in reference information", "Proposed amendments to raise in the BEP", "Responses received"],
    clause: "ISO 19650-2 5.2.4",
  },

  // ------------------------------------------------------------ 5.3 Tender response
  {
    stage: "5.3", party: "appointing", name: "Tender clarification responses",
    summary: "Answers to tenderers' questions, issued to all tenderers",
    purpose: "Resolves ambiguity in the invitation to tender and keeps the competition fair by giving every tenderer the same answers.",
    keyContent: ["Question received", "Response", "Documents amended as a result", "Date issued", "Distribution to all tenderers"],
    clause: "ISO 19650-2 5.2.4",
  },
  {
    stage: "5.3", party: "lead", name: "Nomination of information management individuals",
    summary: "Who will perform the delivery team's information management function",
    purpose: "Names the individuals who will carry out information management for the delivery team and shows they have the experience and authority to do it.",
    keyContent: ["Names and roles", "Relevant experience", "Authority within the delivery team", "Availability for the appointment", "Deputies"],
    clause: "ISO 19650-2 5.3.1",
  },
  {
    stage: "5.3", party: "lead", name: "BIM Execution Plan (Pre-appointment) (BEP-PRE)",
    summary: "Proposed approach for meeting the EIR, submitted with the tender",
    purpose: "Explains how the delivery team proposes to meet the EIR. It is scored at tender and becomes the starting point for the confirmed BEP.",
    keyContent: ["Proposed information management individuals", "Information delivery strategy", "Federation strategy", "High-level responsibility matrix", "Proposed amendments to the standard and methods", "Proposed software and IT"],
    clause: "ISO 19650-2 5.3.2", template: "BEP-PRE",
  },
  {
    stage: "5.3", party: "lead", name: "High-level responsibility matrix",
    summary: "Which task team will deliver which information, at a high level",
    purpose: "Shows how responsibility for the information deliverables will be split across task teams, so the appointing party can see the delivery team covers the whole EIR.",
    keyContent: ["Information deliverables", "Task team responsible", "Milestones", "Interfaces between task teams"],
    clause: "ISO 19650-2 5.3.2",
  },
  {
    stage: "5.3", party: "lead", name: "Delivery team capability and capacity summary",
    summary: "Aggregated capability and capacity of every task team",
    purpose: "Combines the task team assessments into one view of whether the delivery team can deliver the information required, and how any gaps will be closed.",
    keyContent: ["Skills and experience", "Software and IT", "Capacity against the programme", "Gaps identified", "Actions to close gaps"],
    clause: "ISO 19650-2 5.3.4",
  },
  {
    stage: "5.3", party: "lead", name: "Mobilization Plan (MOB)",
    summary: "How people, IT and methods will be mobilised and tested after appointment",
    purpose: "Sets out how the delivery team will get ready to produce information, including how it will test the production methods before production starts.",
    keyContent: ["Resources and timescales", "Training and induction", "IT and CDE setup", "Tests of the production methods", "Responsibilities"],
    clause: "ISO 19650-2 5.3.5", template: "MOB",
  },
  {
    stage: "5.3", party: "lead", name: "Information Delivery Risk Register (RR)",
    summary: "Risks to timely, compliant information delivery and their mitigation",
    purpose: "Identifies the risks that could stop the delivery team meeting the EIR and milestones, with owners and mitigations. It is maintained throughout delivery.",
    keyContent: ["Risk description", "Owner", "Likelihood and impact", "Mitigation", "Assumptions about client inputs", "Status"],
    clause: "ISO 19650-2 5.3.6", template: "RR",
  },
  {
    stage: "5.3", party: "lead", name: "Delivery team tender response",
    summary: "The compiled information management submission for the tender",
    purpose: "Brings together the delivery team's information management documents into the response required by the invitation to tender.",
    keyContent: ["Pre-appointment BEP", "Capability and capacity summary", "Mobilisation plan", "Risk register", "Any other required responses"],
    clause: "ISO 19650-2 5.3.7",
  },
  {
    stage: "5.3", party: "taskteams", name: "Capability & Capacity Assessment (CCA)",
    summary: "Evidence that the task team can deliver the information required",
    purpose: "Assesses the task team's skills, IT and capacity against the requirements, so the lead appointed party can build an honest delivery team summary.",
    keyContent: ["Skills and experience", "Software and hardware", "IT infrastructure", "Capacity against the programme", "Gaps and training needs"],
    clause: "ISO 19650-2 5.3.3", template: "CCA",
  },

  // ------------------------------------------------------------ 5.4 Appointment
  {
    stage: "5.4", party: "appointing", name: "Tender evaluation record",
    summary: "How information management responses were scored and why",
    purpose: "Records the evaluation of each tender against the published criteria and any amendments agreed before appointment. It is the appointing party's decision record for selection.",
    keyContent: ["Scores against each criterion", "Clarifications relied on", "Amendments agreed with the preferred tenderer", "Decision and rationale", "Decision maker and date"],
    clause: "ISO 19650-2 5.2.3",
  },
  {
    stage: "5.4", party: "appointing", name: "Lead appointed party appointment documents",
    summary: "The appointment that makes the information requirements contractual",
    purpose: "Incorporates the information management documents into the lead appointed party's appointment, so the requirements and plans are binding.",
    keyContent: ["EIR", "Project information standard", "Production methods and procedures", "Information protocol", "Confirmed BEP", "MIDP"],
    clause: "ISO 19650-2 5.4.6",
  },
  {
    stage: "5.4", party: "lead", name: "BIM Execution Plan (Post-appointment) (BEP-POST)",
    summary: "The confirmed plan for how the delivery team will deliver information",
    purpose: "Confirms the delivery team's approach after appointment, replacing the tender proposal with an agreed commitment that is kept up to date.",
    keyContent: ["Named information management individuals", "Information delivery strategy", "Confirmed federation strategy", "Agreed amendments to the standard and methods", "Schedule of software, hardware and IT"],
    clause: "ISO 19650-2 5.4.1", template: "BEP-POST",
  },
  {
    stage: "5.4", party: "lead", name: "Detailed Responsibility Matrix (DRM)",
    summary: "Every information deliverable assigned to a task team",
    purpose: "Refines the high-level matrix so that each deliverable has one responsible task team, a level of information need and a milestone.",
    keyContent: ["Information deliverables", "Responsible task team", "Level of information need", "Milestone", "Interfaces and exclusions", "Link to the EIR requirement"],
    clause: "ISO 19650-2 5.4.2", template: "DRM",
  },
  {
    stage: "5.4", party: "lead", name: "Model Production and Delivery Table (MPDT)",
    summary: "Model element responsibilities and delivery stages for each author",
    purpose: "Sets out who models which elements at each stage and to what level of information need, supporting the detailed responsibility matrix.",
    keyContent: ["Elements or systems", "Responsible task team by stage", "Level of information need by stage", "Delivery milestone", "Notes on interfaces"],
    clause: "ISO 19650-2 5.4.2", template: "MPDT",
  },
  {
    stage: "5.4", party: "lead", name: "Lead appointed party EIR",
    summary: "Client requirements flowed down to each appointed party",
    purpose: "Passes the relevant client requirements, plus the lead appointed party's own requirements, to each appointed party in the delivery team.",
    keyContent: ["Requirements for the appointed party", "Level of information need", "Acceptance criteria", "Milestones", "Supporting information"],
    clause: "ISO 19650-2 5.4.3", template: "EIR",
  },
  {
    stage: "5.4", party: "lead", name: "Master Information Delivery Plan (MIDP)",
    summary: "All TIDPs combined into one plan aligned with the client milestones",
    purpose: "Combines every task team's plan into one schedule of information containers, so the delivery team and client can track delivery against the milestones.",
    keyContent: ["Containers from every TIDP", "Responsible task team", "Planned delivery dates", "Milestone served", "Dependencies", "Baseline and forecast"],
    clause: "ISO 19650-2 5.4.5", template: "MIDP",
  },
  {
    stage: "5.4", party: "lead", name: "Appointed party appointment documents",
    summary: "The appointment that binds each appointed party to its requirements",
    purpose: "Incorporates the information management documents into each appointed party's appointment, so the requirements are binding at every tier.",
    keyContent: ["Lead appointed party EIR", "Project information standard", "Production methods and procedures", "Information protocol", "Confirmed BEP", "TIDP"],
    clause: "ISO 19650-2 5.4.7",
  },
  {
    stage: "5.4", party: "taskteams", name: "Acknowledgement of the lead appointed party EIR",
    summary: "Confirmation that the task team understands and accepts its requirements",
    purpose: "Records that the appointed party has reviewed its EIR, raised any queries and accepts the requirements it will deliver against.",
    keyContent: ["Requirements accepted", "Queries raised", "Clarifications received", "Scope boundaries confirmed", "Date and signatory"],
    clause: "ISO 19650-2 5.4.3",
  },
  {
    stage: "5.4", party: "taskteams", name: "Task Information Delivery Plan (TIDP)",
    summary: "The task team's containers, authors, durations and dependencies",
    purpose: "Plans the information containers one task team will produce and when, including what it needs from other task teams. It feeds the MIDP.",
    keyContent: ["Container names following the naming convention", "Level of information need", "Author", "Production duration", "Dependencies and need-by dates", "Planned delivery dates"],
    clause: "ISO 19650-2 5.4.4", template: "TIDP",
  },

  // ------------------------------------------------------------ 5.5 Mobilisation
  {
    stage: "5.5", party: "appointing", name: "CDE access and permissions record",
    summary: "Who in the delivery team can access the CDE and with what rights",
    purpose: "Records the CDE accounts and permissions granted to the delivery team, so access matches roles and can be withdrawn when people leave.",
    keyContent: ["Organisations and users", "Roles and permissions", "Date granted", "Approver", "Review and removal process"],
    clause: "ISO 19650-2 5.5.2",
  },
  {
    stage: "5.5", party: "lead", name: "Training and induction records",
    summary: "Evidence that people are available, inducted and trained",
    purpose: "Shows that the delivery team's resources are confirmed and that everyone has been inducted into the project's requirements and methods.",
    keyContent: ["Resources confirmed against the mobilisation plan", "Induction content", "Attendance", "Training completed", "Outstanding actions"],
    clause: "ISO 19650-2 5.5.1",
  },
  {
    stage: "5.5", party: "lead", name: "IT and CDE mobilisation record",
    summary: "Software, hardware and CDE access set up and confirmed working",
    purpose: "Records that the information technology the delivery team needs has been procured, configured and tested, including access to the CDE.",
    keyContent: ["Software and versions", "Hardware and network", "CDE access for each task team", "Interoperability checks", "Issues and resolutions"],
    clause: "ISO 19650-2 5.5.2",
  },
  {
    stage: "5.5", party: "lead", name: "Production methods test report",
    summary: "Results of testing naming, breakdown, federation and delivery",
    purpose: "Records the outcome of testing the production methods and procedures before production starts, and the changes made to the BEP as a result.",
    keyContent: ["Container breakdown structure tested", "Naming and metadata tested", "Federation tested", "Delivery workflow tested", "Issues found and actions", "Resulting BEP updates"],
    clause: "ISO 19650-2 5.5.3",
  },
  {
    stage: "5.5", party: "taskteams", name: "Training and competence records",
    summary: "Task team members inducted and trained on the project methods",
    purpose: "Shows that each task team member understands the project's standard, methods and CDE before producing information.",
    keyContent: ["Team members", "Induction attended", "Training completed", "Competence gaps", "Planned actions"],
    clause: "ISO 19650-2 5.5.1",
  },
  {
    stage: "5.5", party: "taskteams", name: "Test containers and configuration record",
    summary: "Sample containers and software set-up used to prove the methods",
    purpose: "Provides the sample information and software configuration that the delivery team uses to test the production methods.",
    keyContent: ["Sample containers produced", "Templates and settings used", "Software versions", "Test results", "Corrections made"],
    clause: "ISO 19650-2 5.5.3",
  },

  // ------------------------------------------------------------ 5.6 Collaborative production
  {
    stage: "5.6", party: "appointing", name: "Client review comments and change instructions",
    summary: "Appointing party feedback and instructed changes during production",
    purpose: "Records the appointing party's comments on shared information at agreed review points and any changes it instructs, so they can be traced into the plans.",
    keyContent: ["Containers reviewed", "Comments and responses", "Change instructed", "Impact on the EIR, BEP and MIDP", "Date and author"],
    clause: "ISO 19650-2 5.6",
  },
  {
    stage: "5.6", party: "lead", name: "Information model review record and issue log",
    summary: "Federated model review results and coordination issues to resolve",
    purpose: "Records the lead appointed party's review of the federated information model and tracks the coordination issues it raises through to closure.",
    keyContent: ["Containers federated", "Coordination and completeness checks", "Issues and owners", "Due dates and status", "Actions agreed"],
    clause: "ISO 19650-2 5.6.5",
  },
  {
    stage: "5.6", party: "lead", name: "BIM Progress Report (BPR)",
    summary: "Progress against the MIDP, risks and milestone forecast",
    purpose: "Reports information delivery progress against the plan, so that milestones at risk are visible to the appointing party early.",
    keyContent: ["Progress against the MIDP", "Milestone forecast", "Open issues", "Risks", "Actions"],
    clause: "ISO 19650-2 5.6", template: "BPR",
  },
  {
    stage: "5.6", party: "taskteams", name: "Reference information availability check",
    summary: "Confirmation that required inputs are accessible before work starts",
    purpose: "Confirms that the reference information and shared resources the task team needs are available, so production does not start on missing inputs.",
    keyContent: ["Information required", "Source and status", "Date confirmed", "Gaps", "Actions raised"],
    clause: "ISO 19650-2 5.6.1",
  },
  {
    stage: "5.6", party: "taskteams", name: "Task information model",
    summary: "The task team's models, drawings, schedules and documents",
    purpose: "The information containers the task team produces, generated to the information standard and level of information need and coordinated with other task teams.",
    keyContent: ["Containers named to the standard", "Level of information need met", "Status and revision", "Coordination with shared information", "Metadata"],
    clause: "ISO 19650-2 5.6.2",
  },
  {
    stage: "5.6", party: "taskteams", name: "Information Container QA Checklist (QA)",
    summary: "Check against the information standard before review",
    purpose: "Records that each container conforms to the information standard and methods before its content is reviewed.",
    keyContent: ["Container checked", "Naming", "Metadata", "Format", "Status and revision", "Result and checker"],
    clause: "ISO 19650-2 5.6.3", template: "QA",
  },
  {
    stage: "5.6", party: "taskteams", name: "Review and approval record",
    summary: "Content review and approval for sharing, with suitability assigned",
    purpose: "Records the review of container content against the requirements and the approval to move it to the shared state.",
    keyContent: ["Container reviewed", "Reviewer, other than the author", "Checks against requirements", "Suitability assigned", "Decision and date"],
    clause: "ISO 19650-2 5.6.4",
  },

  // ------------------------------------------------------------ 5.7 Information model delivery
  {
    stage: "5.7", party: "appointing", name: "Acceptance record",
    summary: "Appointing party decision to accept the information model at a milestone",
    purpose: "Records the appointing party's review of the submitted information model against the EIR and its decision to accept it into the published state.",
    keyContent: ["Milestone", "Containers accepted, with revision", "Acceptance criteria checked", "Decision and date", "Decision maker"],
    clause: "ISO 19650-2 5.7.4",
  },
  {
    stage: "5.7", party: "appointing", name: "Rejection record (appointing party)",
    summary: "Reasons the information model was not accepted and what must change",
    purpose: "Records why a submission was rejected, so the lead appointed party knows exactly what to correct and resubmit.",
    keyContent: ["Containers rejected", "Reasons, linked to acceptance criteria", "Corrections required", "Resubmission date", "Decision maker"],
    clause: "ISO 19650-2 5.7.4",
  },
  {
    stage: "5.7", party: "lead", name: "Authorisation record",
    summary: "Lead appointed party sign-off of the information model before submission",
    purpose: "Records that the lead appointed party has reviewed the information model against the EIR and authorised it for submission to the appointing party.",
    keyContent: ["Milestone", "Containers authorised", "Checks against the EIR", "Decision and date", "Decision maker"],
    clause: "ISO 19650-2 5.7.2",
  },
  {
    stage: "5.7", party: "lead", name: "Rejection record (lead appointed party)",
    summary: "Reasons a task team submission was not authorised",
    purpose: "Records why task team information was rejected at authorisation, so it can be corrected before the client milestone.",
    keyContent: ["Containers rejected", "Reasons", "Corrections required", "Task team responsible", "Resubmission date"],
    clause: "ISO 19650-2 5.7.2",
  },
  {
    stage: "5.7", party: "lead", name: "Submission for appointing party acceptance",
    summary: "Authorised information model submitted to the client through the CDE",
    purpose: "Formally submits the authorised information model to the appointing party for review and acceptance at the milestone.",
    keyContent: ["Milestone", "Containers submitted, with revision and suitability", "Link to the authorisation record", "Transmittal", "Date"],
    clause: "ISO 19650-2 5.7.3",
  },
  {
    stage: "5.7", party: "taskteams", name: "Submission for authorisation",
    summary: "Task team information submitted to the lead appointed party",
    purpose: "Submits the task team's information containers due at the milestone for the lead appointed party to review and authorise.",
    keyContent: ["Milestone", "Containers due", "QA and review records", "Suitability for authorisation", "Transmittal"],
    clause: "ISO 19650-2 5.7.1",
  },

  // ------------------------------------------------------------ 5.8 Project close-out
  {
    stage: "5.8", party: "appointing", name: "Archive record",
    summary: "What was archived, for how long, and what goes into the AIM",
    purpose: "Records the archiving of the project information model with its access, retention and future-use rules, and the information transferred to the asset information model.",
    keyContent: ["Containers archived", "Retention period", "Access rules", "Future-use requirements", "Information transferred to the AIM"],
    clause: "ISO 19650-2 5.8.1",
  },
  {
    stage: "5.8", party: "appointing", name: "Lessons Learned Report (LL)",
    summary: "Lessons from all parties to improve the next project",
    purpose: "Captures what worked and what did not, from the appointing party and the delivery teams, and records the changes to make to requirements and standards.",
    keyContent: ["What worked", "What did not", "Root causes", "Changes to the OIR, standard, methods and EIR", "Owners of follow-up actions"],
    clause: "ISO 19650-2 5.8.2", template: "LL",
  },
  {
    stage: "5.8", party: "lead", name: "Final information for archive",
    summary: "The delivery team's complete, accepted information ready to archive",
    purpose: "Confirms that the delivery team's information is complete, in the correct states and ready for the appointing party to archive.",
    keyContent: ["Containers in the published state", "Superseded containers identified", "Metadata complete", "Outstanding items", "Confirmation of completeness"],
    clause: "ISO 19650-2 5.8.1",
  },
  {
    stage: "5.8", party: "lead", name: "Delivery team lessons learned input",
    summary: "The delivery team's lessons, compiled from every task team",
    purpose: "Brings together the delivery team's lessons for the appointing party's lessons learned report.",
    keyContent: ["Successes", "Problems and causes", "Recommendations", "Task team contributions"],
    clause: "ISO 19650-2 5.8.2",
  },
  {
    stage: "5.8", party: "taskteams", name: "Final containers for archive",
    summary: "The task team's final containers, checked and correctly classified",
    purpose: "Provides the task team's final information in the agreed state and with complete metadata, ready to be archived.",
    keyContent: ["Final containers", "Revisions and suitability", "Metadata complete", "Superseded containers withdrawn"],
    clause: "ISO 19650-2 5.8.1",
  },
  {
    stage: "5.8", party: "taskteams", name: "Task team lessons learned input",
    summary: "What worked and what did not for the task team",
    purpose: "Shares the task team's lessons with the lead appointed party for inclusion in the delivery team's input.",
    keyContent: ["What worked", "What did not", "Recommendations", "Contact for follow-up"],
    clause: "ISO 19650-2 5.8.2",
  },
];

export const documentsRolesHub: Hub = {
  id: "documents-roles",
  tone: "blue",
  eyebrow: "ISO 19650 · REFERENCE",
  title: "ISO 19650 documents aligned with roles",
  intro:
    "A single reference for every key ISO 19650 document: who writes it, when, what it must contain and the mistakes to avoid. Start with the workflow matrix to see which party produces what at each stage, then open the section for your role, or use the document guide for a full checklist of contents.",
  sections: [
    // ==================================================================== Overview
    {
      id: "overview",
      label: "Workflow overview",
      tabs: [
        {
          id: "table",
          label: "Document table",
          blocks: [
            {
              kind: "text",
              title: "How to read the table",
              body: [
                "Each row is a stage of the ISO 19650-2 delivery process, from assessment and need (5.1) to project close-out (5.8). Each column is a party. A card shows a document that party produces or owns at that stage, so reading across a row shows how information passes between parties, and reading down a column shows one party's full set of documents.",
                "Select a card to see its purpose, key content and the clause it relates to. Use the stage and party filters to focus on your own role. Empty cells mean the party has no document of its own at that stage, usually because it is not yet appointed or is reviewing another party's work.",
              ],
            },
            {
              kind: "rolematrix",
              title: "Documents by stage and party",
              parties: [
                { id: "appointing", label: "Appointing party", tone: "amber" },
                { id: "lead", label: "Lead appointed party", tone: "green" },
                { id: "taskteams", label: "Task teams / sub-appointed", tone: "teal" },
              ],
              stages: [
                { id: "5.1", label: "Assessment & need", clause: "ISO 19650-2 5.1" },
                { id: "5.2", label: "Invitation to tender", clause: "ISO 19650-2 5.2" },
                { id: "5.3", label: "Tender response", clause: "ISO 19650-2 5.3" },
                { id: "5.4", label: "Appointment", clause: "ISO 19650-2 5.4" },
                { id: "5.5", label: "Mobilisation", clause: "ISO 19650-2 5.5" },
                { id: "5.6", label: "Collaborative production", clause: "ISO 19650-2 5.6" },
                { id: "5.7", label: "Information model delivery", clause: "ISO 19650-2 5.7" },
                { id: "5.8", label: "Project close-out", clause: "ISO 19650-2 5.8" },
              ],
              docs: roleDocs,
            },
            {
              kind: "callout",
              title: "Practical guidance, not a fixed RACI",
              body: "ISO 19650-2 defines activities and parties, not a document list or job titles. The stage and party mapping here is practical guidance: some records, such as clarification responses or progress reports, are common practice rather than named outputs of the standard. Agree the actual responsibilities in the information management assignment matrix and the BEP, as job titles and tiers vary between projects.",
              tone: "info",
            },
          ],
        },
        {
          id: "matrix",
          label: "Summary matrix",
          blocks: [
            {
              kind: "text",
              title: "One table, every document",
              body: [
                "The matrix shows the documents each party produces at each stage of ISO 19650-2. Read across a row to see how documents pass between parties at a stage; read down a column to see everything one party is responsible for across the project.",
                "Where a party mainly reviews rather than produces at a stage, the cell starts with Reviews. Names match the templates in this portal where one exists.",
              ],
            },
            {
              kind: "table",
              title: "Documents by stage and party",
              columns: ["Stage", "Appointing party", "Lead appointed party", "Task teams / sub-appointed"],
              rows: [
                [
                  "5.1 Assessment and need",
                  "Information management assignment matrix; Organizational Information Requirements; Asset Information Requirements; project information requirements; information delivery milestones; Project Information Standard; production methods and procedures; reference information register; CDE Workflow & Procedure; Information Protocol; Security Triage & Security Management Plan",
                  "Not yet appointed",
                  "Not yet appointed",
                ],
                [
                  "5.2 Invitation to tender",
                  "Exchange Information Requirements; tender response requirements; evaluation criteria; BIM Specification & Scope of Services; invitation to tender pack",
                  "Reviews the invitation to tender, EIR, standard, methods and protocol",
                  "Reviews the EIR and standards passed on by the prospective lead appointed party",
                ],
                [
                  "5.3 Tender response",
                  "Clarification responses; Reviews tender responses",
                  "Nomination of information management individuals; BIM Execution Plan (Pre-appointment); high-level responsibility matrix; delivery team capability and capacity summary; Mobilization Plan; Information Delivery Risk Register; tender response",
                  "Capability & Capacity Assessment; input to the pre-appointment BEP",
                ],
                [
                  "5.4 Appointment",
                  "Tender evaluation record; lead appointed party appointment documents; Reviews the confirmed BEP and MIDP",
                  "BIM Execution Plan (Post-appointment); Detailed Responsibility Matrix; Model Production and Delivery Table; lead appointed party EIR for each appointed party; Master Information Delivery Plan; appointed party appointment documents",
                  "Task Information Delivery Plan; acknowledgement of the lead appointed party EIR",
                ],
                [
                  "5.5 Mobilisation",
                  "CDE access permissions; client induction material; Reviews mobilisation test results",
                  "Training and induction records; IT and CDE mobilisation record; production methods test report; updated Information Delivery Risk Register",
                  "Training attendance; test containers; software configuration records",
                ],
                [
                  "5.6 Collaborative production",
                  "Responses to queries; change instructions; Reviews shared information at agreed review points",
                  "Federated information model; coordination reports; issue log; BIM Progress Report; BIM Meeting Minutes; updated MIDP",
                  "Information containers in work in progress; Information Container QA Checklist records; review records; shared containers with suitability codes",
                ],
                [
                  "5.7 Information model delivery",
                  "Acceptance records; rejection records with reasons",
                  "Authorisation records; rejection records with reasons; submission of the authorised model for acceptance",
                  "Submission for authorisation; revised containers after rejection",
                ],
                [
                  "5.8 Project close-out",
                  "Archive record; updated asset information model; Lessons Learned Report",
                  "Lessons learned input; Information Handover Strategy contributions; final information for archive",
                  "Final containers for archive; lessons learned input",
                ],
              ],
            },
            {
              kind: "callout",
              title: "Tiered delivery teams",
              body: "Where an appointed party appoints its own sub-consultants or specialists, it takes the lead role for that tier. It issues an EIR, collects TIDPs and authorises information in the same way, so the middle column repeats one level down.",
              tone: "info",
            },
            {
              kind: "list",
              title: "Documents that must appear in every appointment",
              items: [
                "The relevant exchange information requirements",
                "The project information standard",
                "The information production methods and procedures",
                "The information protocol",
                "The confirmed BIM execution plan",
                "The MIDP for a lead appointed party, or the TIDP for an appointed party",
              ],
            },
          ],
        },
        {
          id: "flow",
          label: "Document flow",
          blocks: [
            {
              kind: "steps",
              title: "How the documents build on each other",
              steps: [
                { title: "1. OIR and AIR set the organisation's needs", body: "The appointing party records what information its organisation and its assets need, independent of any single project." },
                { title: "2. PIR and milestones focus on this project", body: "Project information requirements and information delivery milestones say which decisions this project must support and when." },
                { title: "3. Standard, methods, CDE and protocol set the rules", body: "The project information standard, production methods, CDE procedure and information protocol apply to every appointment on the project." },
                { title: "4. The EIR defines one appointment", body: "Each appointment gets its own EIR, drawn from the PIR and AIR, with acceptance criteria and milestones." },
                { title: "5. The pre-appointment BEP responds", body: "The prospective lead appointed party explains how it would meet the EIR, with a high-level responsibility matrix, capability summary, mobilisation plan and risk register." },
                { title: "6. The confirmed BEP and responsibility matrix commit", body: "After appointment the BEP is confirmed and the detailed responsibility matrix assigns every deliverable to a task team." },
                { title: "7. Lead EIRs flow down", body: "The lead appointed party issues an EIR to each appointed party so the client requirements reach every task team." },
                { title: "8. TIDPs and the MIDP schedule delivery", body: "Each task team plans its containers in a TIDP; the lead appointed party combines them into the MIDP." },
                { title: "9. Containers, QA and review records prove quality", body: "Task teams produce containers, record QA checks and reviews, and share them through the CDE." },
                { title: "10. Authorisation and acceptance records close each milestone", body: "The lead appointed party authorises and the appointing party accepts, each with records and reasons for any rejection." },
                { title: "11. Archive and lessons learned complete the loop", body: "The PIM is archived, relevant content goes to the AIM, and lessons learned improve the next project's OIR, standards and EIR." },
              ],
            },
            {
              kind: "text",
              title: "Golden thread",
              body: [
                "Every document should be traceable to the one before it. An auditor should be able to pick a container in the MIDP and follow it back through the TIDP, the responsibility matrix, the BEP and the EIR to the client requirement it satisfies.",
                "Keep these links explicit with requirement identifiers, so that a change to the EIR can be traced to every plan and container it affects.",
              ],
            },
            {
              kind: "callout",
              title: "Change control",
              body: "When a requirement changes, update the documents in order: EIR, BEP, responsibility matrix, TIDPs and MIDP. Changing the MIDP alone hides the reason for the change.",
              tone: "warn",
            },
          ],
        },
        {
          id: "legend",
          label: "Colour legend",
          blocks: [
            {
              kind: "cards",
              title: "Who each colour represents",
              cards: [
                { title: "Amber: appointing party", body: "The client side. Sets requirements, standards, methods, the CDE and the protocol, and accepts information at each milestone.", tone: "amber" },
                { title: "Green: lead appointed party", body: "Receives the appointment from the client, plans and coordinates the delivery team, and authorises the information model.", tone: "green" },
                { title: "Teal: task teams and sub-appointed parties", body: "Produce the information: plan in TIDPs, generate, check, review and share containers.", tone: "teal" },
                { title: "Blue: shared activities", body: "Activities several parties carry out together, such as mobilisation and close-out, under one lead.", tone: "blue" },
              ],
            },
            {
              kind: "text",
              title: "Parties and roles are not the same",
              body: [
                "ISO 19650 talks about parties: the appointing party, the lead appointed party and appointed parties. It does not prescribe job titles. One person can fill several roles on a small project, and a large organisation can split one role across a team.",
                "Record who actually does each task in the information management assignment matrix and the BEP, rather than relying on job titles.",
              ],
            },
            {
              kind: "list",
              title: "Common job titles and the party they usually sit in",
              items: [
                "Client information manager, asset manager, project sponsor: appointing party",
                "Lead information manager, design manager, project manager: lead appointed party",
                "Task team manager, task information manager, BIM coordinator: task teams",
                "BIM author, modeller, engineer, designer: task teams",
                "CDE administrator: often appointing party, sometimes delegated",
              ],
            },
          ],
        },
      ],
    },
    // ==================================================================== Appointing party
    {
      id: "appointing",
      label: "Appointing party",
      tabs: [
        {
          id: "requirements",
          label: "Requirements",
          blocks: [
            {
              kind: "text",
              title: "The requirements hierarchy",
              body: [
                "The appointing party's requirements run from the general to the specific: OIR for the organisation, AIR for the asset, PIR for the project, and an EIR for each appointment. The EIR is the only one the delivery team contracts against, so everything the client needs must eventually land in an EIR.",
              ],
            },
            {
              kind: "table",
              title: "Requirements documents",
              columns: ["Document", "Purpose", "When", "Key content", "Common mistakes"],
              rows: [
                ["Organizational Information Requirements (OIR)", "Records the information the organisation needs for its strategic objectives", "Before the project, reviewed periodically", "Business objectives; decisions supported; reporting needs; links to asset management", "Written as a wish list with no link to real decisions"],
                ["Asset Information Requirements (AIR)", "States the information needed to operate and maintain the asset", "Before tender, informed by the operator", "Asset types; attributes; documents; formats; handover timing; links to CAFM or CMMS systems", "Asking for every attribute of every object, including ones nobody will use"],
                ["Project information requirements (PIR)", "Defines what information the project needs to support its key decisions", "During assessment and need (5.1.2)", "Key decision points; questions to answer; purposes such as approvals, cost and programme", "Confusing PIR with the EIR and skipping it"],
                ["Information delivery milestones", "Sets when information is required across the project", "During assessment and need (5.1.3)", "Milestone dates; linked decision points; stage boundaries", "Milestones that do not match the project programme"],
                ["Exchange Information Requirements (EIR)", "Defines what one appointment must deliver, when, how and to what level of information need", "Before tender (5.2.1)", "Requirements; acceptance criteria; milestones; supporting information; level of information need", "No acceptance criteria, or copied from another project"],
                ["EIR per appointment (several lead appointed parties)", "Gives each lead appointed party requirements specific to its scope", "Before each tender", "Scope-specific requirements; interfaces with other appointments; shared milestones", "One generic EIR for every appointment, leaving interfaces undefined"],
                ["Tender response requirements and evaluation criteria", "Explains what tenderers must submit and how information management will be scored", "With the invitation to tender (5.2.3)", "Required submissions; scoring method; weightings; minimum thresholds", "Information management not scored at all"],
              ],
            },
            {
              kind: "checklist",
              title: "Requirements quality check",
              items: [
                "Every EIR requirement traces to the PIR or AIR",
                "Every requirement has an acceptance criterion",
                "Level of information need stated for each deliverable",
                "Milestones match the project programme",
                "Interfaces between appointments are defined",
                "Evaluation criteria include information management",
              ],
            },
            {
              kind: "callout",
              title: "Write it once, flow it down",
              body: "The appointing party writes the EIR for the lead appointed party. The lead appointed party then writes its own EIR for each appointed party. Both are needed in a tiered delivery team.",
              tone: "info",
            },
          ],
        },
        {
          id: "framework",
          label: "Standards & methods",
          blocks: [
            {
              kind: "text",
              title: "The project rulebook",
              body: [
                "These documents apply to every appointment on the project. They are established during assessment and need (5.1.4 to 5.1.8) and issued with the invitation to tender, so tenderers can price and plan against them.",
              ],
            },
            {
              kind: "table",
              title: "Standards, methods and environment",
              columns: ["Document", "Purpose", "When", "Key content", "Common mistakes"],
              rows: [
                ["Project Information Standard (PIS)", "Defines how information is structured and exchanged", "Before tender (5.1.4)", "Exchange formats; naming convention; classification; metadata; status and suitability codes; level of information need method; units and coordinates", "Leaving out coordinates and units, causing federation errors"],
                ["Information production methods and procedures", "Explains how information is captured, produced, reviewed, approved, secured and delivered", "Before tender (5.1.5)", "Capture of existing information; container breakdown; review and approval; security; delivery to the client", "Describing software features instead of procedures"],
                ["Reference information and shared resources register", "Lists existing information and resources made available to the delivery team", "Before tender (5.1.6, 5.2.2)", "Surveys; existing models; asset records; templates; object libraries; title blocks", "Issuing reference information without status or reliability notes"],
                ["CDE Workflow & Procedure (CDE)", "Describes how the common data environment works on the project", "Before tender (5.1.7)", "States; workflows; permissions; metadata; revision rules; archive; access for new parties", "CDE configured after appointment"],
                ["Information Protocol (IP)", "Sets the contractual obligations, licences and liabilities for information", "Before tender, incorporated into appointments (5.1.8)", "Licences to use information; obligations of each party; liabilities; security requirements; references to the standard and methods", "Included only in the top-tier appointment"],
                ["Security Triage & Security Management Plan (SEC)", "Assesses sensitivity and sets security measures where needed", "During assessment and need, following ISO 19650-5", "Sensitivity assessment outcome; security measures; access controls; incident management", "Skipping the triage because the project seems routine"],
                ["BIM Specification & Scope of Services (SPEC)", "Describes the information management services required in the appointment", "With the invitation to tender", "Information management tasks; deliverables; interfaces; links to the EIR", "Duplicating or contradicting the EIR"],
              ],
            },
            {
              kind: "checklist",
              title: "Ready to issue",
              items: [
                "Naming convention tested with real examples",
                "Coordinate system and units defined",
                "Status and suitability codes listed",
                "CDE configured and tested with a sample workflow",
                "Information protocol reviewed by legal advisers",
                "Reference information has status and reliability notes",
              ],
            },
            {
              kind: "callout",
              title: "National annexes",
              body: "If the project adopts a national annex, such as the UK National Annex, state it in the information standard and record any deviations from it.",
              tone: "info",
            },
          ],
        },
        {
          id: "acceptance",
          label: "Tender, acceptance & close-out",
          blocks: [
            {
              kind: "text",
              title: "Decisions and records",
              body: [
                "After the tender is issued, the appointing party's documents are mostly decision records: who it appointed and why, which information it accepted at each milestone, and what it archived. These are short documents, but they carry the most weight in audits and disputes.",
              ],
            },
            {
              kind: "table",
              title: "Decision and close-out documents",
              columns: ["Document", "Purpose", "When", "Key content", "Common mistakes"],
              rows: [
                ["Information management assignment matrix", "Records who carries out each information management task", "Assessment and need (5.1.1), updated as parties are appointed", "Tasks; party responsible; named individuals; delegated tasks", "Never updated after appointment"],
                ["Invitation to tender pack", "Bundles everything tenderers need", "Invitation to tender (5.2.4)", "EIR; standard; methods; protocol; reference information; tender requirements", "Missing the CDE details or protocol"],
                ["Tender evaluation record", "Shows how information management responses were scored", "Appointment (5.4)", "Scores against criteria; clarifications; agreed amendments", "No record of why amendments were accepted"],
                ["Appointment documents", "Makes the information requirements contractual", "Appointment (5.4.6)", "EIR; standard; methods; protocol; confirmed BEP; MIDP", "Signing before the confirmed BEP and MIDP are attached, with no route to add them"],
                ["Acceptance record", "Records acceptance of the information model at a milestone", "Information model delivery (5.7.4)", "Milestone; containers accepted; criteria checked; date; decision maker", "Acceptance by email with no link to the containers"],
                ["Rejection record", "Records why a submission was rejected", "Information model delivery (5.7.4)", "Containers rejected; reasons; required corrections; resubmission date", "Rejecting without reasons"],
                ["Archive record", "Records what was archived and how it may be used", "Close-out (5.8.1)", "Containers archived; retention period; access rules; future-use requirements", "Archiving everything with no retention or access rules"],
                ["Lessons Learned Report (LL)", "Captures lessons for future projects", "Close-out (5.8.2), with input throughout", "What worked; what did not; changes to standards and requirements", "Written only at the end, by one party"],
              ],
            },
            {
              kind: "checklist",
              title: "Acceptance record essentials",
              items: [
                "Milestone identified",
                "Containers listed with revision and suitability",
                "Acceptance criteria checked",
                "Decision and date recorded",
                "Decision maker named",
                "Reasons recorded for any rejection",
              ],
            },
            {
              kind: "callout",
              title: "Keep decisions in the CDE",
              body: "Store acceptance, rejection and archive records in the CDE alongside the containers they relate to. Decisions kept in email inboxes are lost when people move on.",
              tone: "ok",
            },
          ],
        },
      ],
    },
    // ==================================================================== Lead appointed party
    {
      id: "lead",
      label: "Lead appointed party",
      tabs: [
        {
          id: "tender",
          label: "Tender documents",
          blocks: [
            {
              kind: "text",
              title: "Winning the appointment",
              body: [
                "At tender, the prospective lead appointed party shows the appointing party how its delivery team will meet the EIR and proves it has the capability and capacity to do so (5.3). These documents are scored, so they must answer the specific requirements rather than describe the company in general.",
              ],
            },
            {
              kind: "table",
              title: "Tender response documents",
              columns: ["Document", "Purpose", "When", "Key content", "Common mistakes"],
              rows: [
                ["Nomination of information management individuals", "Names who will perform the information management function", "Tender (5.3.1)", "Names; roles; experience; authority", "Naming people who will not actually be available"],
                ["BIM Execution Plan (Pre-appointment) (BEP-PRE)", "Proposes how the delivery team will meet the EIR", "Tender (5.3.2)", "Information delivery strategy; federation strategy; high-level responsibility matrix; proposed amendments to standard and methods; software and IT", "Generic company BEP that ignores the EIR"],
                ["High-level responsibility matrix", "Shows which task team delivers which information at a high level", "Tender (5.3.2)", "Information deliverables; task teams; milestones", "Too detailed to be useful or too vague to score"],
                ["Delivery team capability and capacity summary", "Aggregates task team assessments", "Tender (5.3.4)", "Skills; IT; capacity; gaps and how they will be closed", "Summary that hides weak task teams"],
                ["Mobilization Plan (MOB)", "Explains how people, IT and methods will be mobilised and tested", "Tender (5.3.5)", "Resources; training; IT setup; CDE access; test plan; timescales", "No testing of methods planned"],
                ["Information Delivery Risk Register (RR)", "Identifies risks to timely, compliant information delivery", "Tender (5.3.6), maintained throughout", "Risks; owners; likelihood; impact; mitigations; assumptions", "Only generic risks, nothing about this EIR"],
                ["Tender response", "Compiles and submits the delivery team's offer", "Tender (5.3.7)", "All of the above, plus any responses required by the tender", "Missing items required by the tender response requirements"],
              ],
            },
            {
              kind: "checklist",
              title: "Tender submission check",
              items: [
                "Every EIR requirement answered in the BEP",
                "Proposed amendments to the standard clearly listed",
                "Capability assessment for every task team",
                "Mobilisation plan includes method testing",
                "Risk register covers client-side dependencies",
                "Named individuals confirmed available",
              ],
            },
            {
              kind: "callout",
              title: "Answer line by line",
              body: "Number your BEP responses to match the EIR requirements. Evaluators can then score you quickly, and you have a ready-made traceability record for the confirmed BEP.",
              tone: "ok",
            },
          ],
        },
        {
          id: "appointment",
          label: "Appointment documents",
          blocks: [
            {
              kind: "text",
              title: "From offer to plan",
              body: [
                "Once appointed, the lead appointed party confirms its BEP, assigns every deliverable, flows the requirements down and builds the master plan (5.4). These documents are incorporated into appointments, so they carry contractual weight.",
              ],
            },
            {
              kind: "table",
              title: "Appointment documents",
              columns: ["Document", "Purpose", "When", "Key content", "Common mistakes"],
              rows: [
                ["BIM Execution Plan (Post-appointment) (BEP-POST)", "Confirms how the delivery team will deliver the information", "Appointment (5.4.1)", "Named individuals; information delivery strategy; confirmed federation strategy; agreed amendments; software schedule", "Pre-appointment BEP resubmitted unchanged"],
                ["Detailed Responsibility Matrix (DRM)", "Assigns each information deliverable to a task team", "Appointment (5.4.2)", "Deliverables; task team; level of information need; milestone", "Deliverables in the EIR left unassigned"],
                ["Model Responsibility Matrix (MRM)", "Assigns model elements and systems to authors by stage", "Appointment, alongside the DRM", "Elements or systems; author by stage; level of information need", "Overlaps where two teams model the same element"],
                ["Model Production and Delivery Table (MPDT)", "Details model production responsibilities and delivery stages", "Appointment, alongside the DRM", "Elements; responsible party; stage; level of information need", "Out of step with the DRM"],
                ["Lead appointed party EIR", "Flows the client requirements down to each appointed party", "Appointment (5.4.3)", "Requirements; acceptance criteria; milestones; supporting information", "Client requirements not flowed down"],
                ["Master Information Delivery Plan (MIDP)", "Combines all TIDPs into one delivery plan", "Appointment (5.4.5), maintained throughout", "Containers; task teams; dates; milestones; dependencies", "Not re-baselined after change"],
                ["Appointed party appointment documents", "Makes the requirements contractual for each appointed party", "Appointment (5.4.7)", "Lead EIR; standard; methods; protocol; BEP; TIDP", "Missing the information protocol"],
              ],
            },
            {
              kind: "checklist",
              title: "Appointment documents check",
              items: [
                "Confirmed BEP agreed with the appointing party",
                "Every EIR deliverable appears in the DRM",
                "DRM, MRM and MPDT consistent with each other",
                "Lead EIR issued to every appointed party",
                "MIDP aligned with the client milestones",
                "Information protocol in every appointed party appointment",
              ],
            },
            {
              kind: "callout",
              title: "Proportionality",
              body: "On small appointments the DRM, MRM and MPDT can be combined into one table, as long as each required piece of information is still clearly identifiable.",
              tone: "info",
            },
          ],
        },
        {
          id: "delivery",
          label: "Delivery & close-out",
          blocks: [
            {
              kind: "text",
              title: "Running delivery",
              body: [
                "During mobilisation, production and delivery the lead appointed party keeps the plans live and records the decisions it makes. Authorisation records are the most important: they show that the delivery team checked its own work before passing it to the client.",
              ],
            },
            {
              kind: "table",
              title: "Delivery and close-out documents",
              columns: ["Document", "Purpose", "When", "Key content", "Common mistakes"],
              rows: [
                ["Mobilisation records", "Shows people, IT and methods are ready", "Mobilisation (5.5)", "Training attendance; CDE access list; software versions; test results", "No evidence that tests were actually run"],
                ["Production methods test report", "Records the outcome of method tests", "Mobilisation (5.5.3)", "Naming; breakdown structure; federation; delivery workflow; issues found", "Problems found but not fixed in the BEP"],
                ["Coordination reports and issue log", "Records federated model reviews and issues", "Collaborative production (5.6.5)", "Clashes; issues; owners; due dates; status", "Issues tracked outside the agreed channel"],
                ["BIM Progress Report (BPR)", "Reports delivery progress against the MIDP", "Regularly during production", "Progress; risks; issues; milestone forecast", "Reporting activity rather than progress against the plan"],
                ["BIM Meeting Minutes (MOM)", "Records information management decisions and actions", "Throughout", "Attendees; decisions; actions; owners; dates", "Decisions not reflected in the BEP or MIDP"],
                ["Authorisation record", "Records authorisation of the information model", "Information model delivery (5.7.2)", "Milestone; containers; criteria checked; decision maker; date", "Authorising without checking against the EIR"],
                ["Rejection record", "Records why a task team submission was rejected", "Information model delivery (5.7.2)", "Containers; reasons; corrections required; resubmission date", "Verbal rejections with no record"],
                ["Lessons Learned Report (LL) input", "Captures the delivery team's lessons", "Throughout, compiled at close-out (5.8.2)", "Successes; problems; recommendations", "Left until the team has disbanded"],
              ],
            },
            {
              kind: "checklist",
              title: "Milestone readiness",
              items: [
                "All containers due at the milestone are in the shared state",
                "Federated model reviewed",
                "Open issues closed or agreed",
                "Authorisation checked against the EIR acceptance criteria",
                "Authorisation record stored in the CDE",
                "MIDP updated with actual delivery",
              ],
            },
            {
              kind: "callout",
              title: "Plan for resubmission",
              body: "Allow time in the MIDP for corrections between authorisation and acceptance at critical milestones. Rejection is a normal part of the process, not a failure of it.",
              tone: "ok",
            },
          ],
        },
      ],
    },
    // ==================================================================== Task teams
    {
      id: "taskteams",
      label: "Task teams / sub-appointed",
      tabs: [
        {
          id: "planning",
          label: "Planning documents",
          blocks: [
            {
              kind: "text",
              title: "Planning your part",
              body: [
                "Task teams and sub-appointed parties contribute to the tender and then plan their own deliverables. Their planning documents feed directly into the lead appointed party's BEP and MIDP, so accuracy here prevents problems across the whole delivery team.",
              ],
            },
            {
              kind: "table",
              title: "Task team planning documents",
              columns: ["Document", "Purpose", "When", "Key content", "Common mistakes"],
              rows: [
                ["Capability & Capacity Assessment (CCA)", "Shows the task team can deliver the information required", "Tender (5.3.3)", "Skills; experience; software; hardware; capacity; gaps and training needs", "Overstating capacity"],
                ["Input to the pre-appointment BEP", "Provides discipline-specific content for the BEP", "Tender (5.3.2)", "Proposed container breakdown; software; exchange formats; proposed amendments", "Not reading the client EIR before contributing"],
                ["Acknowledgement of the lead appointed party EIR", "Confirms the task team understands its requirements", "Appointment (5.4.3)", "Requirements accepted; queries; clarifications", "Accepting requirements without querying unclear ones"],
                ["Task Information Delivery Plan (TIDP)", "Plans the task team's information containers and dates", "Appointment (5.4.4)", "Container names; level of information need; author; production duration; dependencies; delivery dates", "Missing dependencies on other task teams"],
                ["Input to the responsibility matrix", "Confirms scope boundaries", "Appointment (5.4.2)", "Deliverables accepted; interfaces; elements excluded", "Leaving gaps at interfaces between disciplines"],
                ["Task team appointment documents", "Makes the requirements contractual", "Appointment (5.4.7)", "Lead EIR; standard; methods; protocol; BEP; TIDP", "Signing without the information protocol"],
              ],
            },
            {
              kind: "checklist",
              title: "TIDP ready to submit",
              items: [
                "Every deliverable from the DRM listed",
                "Container names follow the naming convention",
                "Level of information need set for each container",
                "Author named for each container",
                "Dependencies and need-by dates recorded",
                "Dates align with the MIDP milestones",
              ],
            },
            {
              kind: "callout",
              title: "Be honest about capacity",
              body: "Overstating capacity at tender leads to missed milestones later. Lead appointed parties value a realistic assessment that names gaps and a plan to close them.",
              tone: "warn",
            },
          ],
        },
        {
          id: "production",
          label: "Production documents",
          blocks: [
            {
              kind: "text",
              title: "Producing and proving quality",
              body: [
                "During production the task team's documents are the information itself and the records that show it was checked. ISO 19650-2 separates the quality assurance check (5.6.3), which looks at conformance with the information standard, from the review (5.6.4), which looks at the content.",
              ],
            },
            {
              kind: "table",
              title: "Task team production documents",
              columns: ["Document", "Purpose", "When", "Key content", "Common mistakes"],
              rows: [
                ["Task information model", "The task team's information containers: models, drawings, schedules, documents", "Collaborative production (5.6.2)", "Containers to the information standard and level of information need", "Using information from other teams that is still in their work in progress"],
                ["Information Container QA Checklist (QA)", "Records the check against the information standard", "Before review (5.6.3)", "Naming; metadata; format; status; revision; result", "Checking only the file name"],
                ["Review and approval record", "Records content review and approval for sharing", "Before sharing (5.6.4)", "Reviewer; checks against requirements; suitability assigned; date", "Author reviewing their own work"],
                ["Shared containers", "Information made available for coordination", "After approval (5.6.4)", "Container with status, suitability and revision", "Wrong suitability code"],
                ["Coordination issues (for example BCF)", "Raises and tracks issues with other task teams", "Collaborative production", "Issue; location; owner; status", "Issues raised by email outside the agreed channel"],
                ["Submission for authorisation", "Submits information at a milestone", "Information model delivery (5.7.1)", "Containers due; suitability for authorisation; transmittal", "Submitting containers that have not passed QA"],
                ["Lessons learned input", "Shares the task team's lessons", "Throughout and at close-out (5.8.2)", "What worked; what did not; recommendations", "No input from task teams at all"],
              ],
            },
            {
              kind: "checklist",
              title: "Before sharing",
              items: [
                "QA check passed and recorded",
                "Content reviewed by someone other than the author",
                "Suitability code correct",
                "Metadata complete",
                "Superseded versions withdrawn",
                "Coordination issues addressed or recorded",
              ],
            },
            {
              kind: "callout",
              title: "Use only shared or published information",
              body: "When coordinating with another task team, base your work on their shared or published containers. Their work in progress may change without notice.",
              tone: "info",
            },
          ],
        },
      ],
    },
    // ==================================================================== Document guide
    {
      id: "guide",
      label: "Document guide",
      tabs: [
        {
          id: "eir",
          label: "EIR",
          blocks: [
            {
              kind: "cards",
              title: "Exchange Information Requirements at a glance",
              cards: [
                { title: "Purpose", body: "Defines what information an appointment must deliver, when, in what form and how it will be accepted.", tone: "blue" },
                { title: "Owner", body: "The appointing party for the lead appointed party (5.2.1); the lead appointed party for each appointed party (5.4.3).", tone: "amber" },
                { title: "Timing", body: "Before the invitation to tender, and before each lower-tier appointment.", tone: "green" },
              ],
            },
            {
              kind: "checklist",
              title: "What a good EIR contains",
              items: [
                "Project and appointment identification",
                "Reference to the project information requirements it serves",
                "Information requirements for the appointment",
                "Level of information need for each requirement",
                "Acceptance criteria for each requirement",
                "Information delivery milestones",
                "Supporting information the delivery team needs to meet the requirements",
                "Reference to the project information standard",
                "Reference to the production methods and procedures",
                "Reference information and shared resources provided",
                "Asset information requirements relevant to this appointment",
                "Tender response requirements for information management",
                "Security requirements, where applicable",
                "Interfaces with other appointments",
              ],
            },
            {
              kind: "callout",
              title: "Test every requirement",
              body: "For each requirement ask: how will we know it has been met? If there is no answer, add an acceptance criterion or remove the requirement.",
              tone: "ok",
            },
          ],
        },
        {
          id: "bep",
          label: "BEP",
          blocks: [
            {
              kind: "cards",
              title: "BIM Execution Plan at a glance",
              cards: [
                { title: "Purpose", body: "Explains how the delivery team will carry out the information management aspects of the appointment.", tone: "blue" },
                { title: "Owner", body: "The lead appointed party, with input from every task team.", tone: "green" },
                { title: "Timing", body: "Pre-appointment BEP with the tender (5.3.2); confirmed BEP after appointment (5.4.1), then kept up to date.", tone: "amber" },
              ],
            },
            {
              kind: "checklist",
              title: "What a confirmed BEP contains",
              items: [
                "Names and roles of the individuals performing the information management function",
                "Information delivery strategy for meeting the EIR",
                "Federation strategy",
                "Information container breakdown structure",
                "High-level responsibility matrix, refined by the detailed matrix",
                "Agreed additions or amendments to the information standard",
                "Agreed additions or amendments to the production methods and procedures",
                "Schedule of software, hardware and IT infrastructure",
                "Exchange formats and versions",
                "Coordination and clash management process",
                "Review, authorisation and submission process",
                "CDE use within the delivery team",
                "Response to each EIR requirement",
                "Change control and revision history",
              ],
            },
            {
              kind: "callout",
              title: "Two BEPs, two purposes",
              body: "The pre-appointment BEP is a proposal that is scored at tender. The confirmed BEP is a commitment that is incorporated into the appointment. Make sure the second really replaces the first.",
              tone: "warn",
            },
          ],
        },
        {
          id: "midp",
          label: "MIDP",
          blocks: [
            {
              kind: "cards",
              title: "Master Information Delivery Plan at a glance",
              cards: [
                { title: "Purpose", body: "Brings all TIDPs together into one plan showing when each information container will be delivered and by whom.", tone: "blue" },
                { title: "Owner", body: "The lead appointed party.", tone: "green" },
                { title: "Timing", body: "Established at appointment (5.4.5), baselined, and maintained under change control throughout delivery.", tone: "amber" },
              ],
            },
            {
              kind: "checklist",
              title: "What an MIDP contains",
              items: [
                "Every container from every TIDP",
                "Task team responsible for each container",
                "Container name or reference",
                "Level of information need",
                "Planned production start and duration",
                "Planned delivery date",
                "Information delivery milestone the container serves",
                "Dependencies between containers and task teams",
                "Required suitability at each milestone",
                "Baseline and current forecast dates",
                "Actual delivery dates",
                "Revision history and change references",
              ],
            },
            {
              kind: "callout",
              title: "Keep it live",
              body: "An MIDP is only useful if it shows the current forecast. Update it regularly and tell the appointing party when a milestone is at risk.",
              tone: "ok",
            },
          ],
        },
        {
          id: "tidp",
          label: "TIDP",
          blocks: [
            {
              kind: "cards",
              title: "Task Information Delivery Plan at a glance",
              cards: [
                { title: "Purpose", body: "Lists the information containers one task team will produce, with dates and dependencies.", tone: "blue" },
                { title: "Owner", body: "Each task team, agreed with the lead appointed party.", tone: "teal" },
                { title: "Timing", body: "Established at appointment (5.4.4) and updated as the work develops.", tone: "amber" },
              ],
            },
            {
              kind: "checklist",
              title: "What a TIDP contains",
              items: [
                "Task team name and task team manager",
                "Container name following the naming convention",
                "Container title or description",
                "Container type, such as model, drawing or schedule",
                "Level of information need",
                "Author responsible",
                "Estimated production duration",
                "Dependencies on information from other task teams",
                "Need-by dates for incoming information",
                "Planned delivery date",
                "Milestone served",
                "Required suitability at delivery",
              ],
            },
            {
              kind: "callout",
              title: "Dependencies are the point",
              body: "The most valuable part of a TIDP is often the dependencies column. It tells other task teams what you need from them and when.",
              tone: "info",
            },
          ],
        },
        {
          id: "matrix",
          label: "Responsibility matrix",
          blocks: [
            {
              kind: "cards",
              title: "Responsibility matrices at a glance",
              cards: [
                { title: "Purpose", body: "Assigns information deliverables to task teams so nothing is missed and nothing is duplicated.", tone: "blue" },
                { title: "Owner", body: "The lead appointed party, agreed with task teams. The appointing party keeps its own information management assignment matrix.", tone: "green" },
                { title: "Timing", body: "High-level matrix with the pre-appointment BEP (5.3.2); detailed matrix at appointment (5.4.2).", tone: "amber" },
              ],
            },
            {
              kind: "checklist",
              title: "What a detailed responsibility matrix contains",
              items: [
                "Every information deliverable from the EIR",
                "Task team responsible for each deliverable",
                "Element, system or document covered",
                "Level of information need for each deliverable",
                "Information delivery milestone",
                "Interfaces between task teams",
                "Elements explicitly excluded from a task team's scope",
                "Links to the TIDP entries",
                "Reference to the EIR requirement satisfied",
                "Stage-by-stage changes in responsibility",
                "Agreement by each task team",
                "Revision history",
              ],
            },
            {
              kind: "callout",
              title: "Look for gaps at the edges",
              body: "Most responsibility problems sit at interfaces, such as builder's work in connection or fire stopping. Name an owner for each interface element explicitly.",
              tone: "warn",
            },
          ],
        },
        {
          id: "protocol",
          label: "Information protocol",
          blocks: [
            {
              kind: "cards",
              title: "Information Protocol at a glance",
              cards: [
                { title: "Purpose", body: "Sets the contractual obligations, licences and liabilities for information on the project.", tone: "blue" },
                { title: "Owner", body: "The appointing party, with legal advice.", tone: "amber" },
                { title: "Timing", body: "Established during assessment and need (5.1.8) and incorporated into every appointment.", tone: "green" },
              ],
            },
            {
              kind: "checklist",
              title: "What an information protocol covers",
              items: [
                "Parties and the appointments it applies to",
                "Precedence relative to other appointment documents",
                "Obligations of the appointing party",
                "Obligations of the lead appointed party and appointed parties",
                "Licences to use information and their limits",
                "Use of information after the appointment ends",
                "Liabilities and limitations relating to information",
                "Reference to the EIR, information standard and production methods",
                "Reference to the BEP and delivery plans",
                "Use of the CDE",
                "Security requirements and incident reporting",
                "Process for changing the protocol",
              ],
            },
            {
              kind: "callout",
              title: "Flow it through every tier",
              body: "The protocol should be referenced in each appointment in the chain, not only the top tier. Otherwise licences granted to the client may not be backed by licences from the parties who created the information.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "Which documents does the lead appointed party produce at tender, and which after appointment?",
    "What should a TIDP contain and how does it feed the MIDP?",
    "What is the difference between the appointing party's EIR and the lead appointed party's EIR?",
    "Which records should an appointing party keep to show it accepted the information model?",
  ],
};
