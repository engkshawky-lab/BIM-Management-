import type { Clause, GlossaryTerm, Part, Reference, Workflow } from "./types";

// Content is paraphrased guidance, not reproduced standard text.
// Always verify against the licensed edition of BS EN ISO 19650.

export const parts19650: Part[] = [
  {
    id: "19650-1",
    title: "Part 1 — Concepts and principles",
    year: "2018",
    scope:
      "Defines the concepts and principles of information management using BIM across the whole asset life cycle: information requirements, information models, the information delivery cycle, the CDE and the roles of appointing and appointed parties.",
    keyTopics: ["OIR / AIR / PIR / EIR hierarchy", "PIM and AIM", "Level of information need", "Information container", "CDE concept", "Delivery team structure"],
  },
  {
    id: "19650-2",
    title: "Part 2 — Delivery phase of the assets",
    year: "2018",
    scope:
      "Specifies the information management process during the delivery phase through eight activities, from assessment and need to project close-out.",
    keyTopics: ["Information management process (5.1–5.8)", "EIR and BEP", "MIDP / TIDP", "Responsibility matrix", "Information protocol", "Authorization and acceptance"],
  },
  {
    id: "19650-3",
    title: "Part 3 — Operational phase of the assets",
    year: "2020",
    scope:
      "Specifies the information management process during operation, including trigger events, the AIM and its maintenance, and integration with asset management (ISO 55000).",
    keyTopics: ["Trigger events", "AIM maintenance", "OIR to AIR", "Asset management integration"],
  },
  {
    id: "19650-4",
    title: "Part 4 — Information exchange",
    year: "2022",
    scope:
      "Details the process and criteria for each information exchange, including CDE state transitions and the review criteria for sharing, authorization and acceptance.",
    keyTopics: ["Exchange criteria", "Status and revision", "Review criteria", "Open data / interoperability"],
  },
  {
    id: "19650-5",
    title: "Part 5 — Security-minded approach",
    year: "2020",
    scope:
      "Specifies a security-minded approach to information management: sensitivity assessment, security strategy, security management plan and breach/incident management.",
    keyTopics: ["Sensitivity assessment", "Security triage", "Security management plan", "Incident management plan"],
  },
  {
    id: "19650-6",
    title: "Part 6 — Health and safety information",
    year: "2025",
    scope:
      "Specifies requirements for collaborative sharing of structured health and safety information throughout the project and asset life cycle.",
    keyTopics: ["H&S information requirements", "Risk information", "Hazard communication"],
  },
];

export const process19650: Clause[] = [
  {
    id: "5.1",
    title: "Assessment and need",
    summary: "The appointing party establishes the project's information requirements, standards, methods and the CDE before any appointment.",
    children: [
      { id: "5.1.1", title: "Name who will manage information for the client", summary: "Assign internal or external resources responsible for information management on behalf of the appointing party." },
      { id: "5.1.2", title: "Set out the project's information requirements", summary: "Define PIR derived from OIR/AIR, covering purpose, key decision points and the information needed." },
      { id: "5.1.3", title: "Set the information delivery milestones", summary: "Align information delivery milestones with the project programme and key decision points." },
      { id: "5.1.4", title: "Set the project information standard", summary: "Define exchange formats, structure, classification, naming, metadata and level of information need." },
      { id: "5.1.5", title: "Set the production methods and procedures", summary: "Capture, generation, review, approval, security and delivery procedures." },
      { id: "5.1.6", title: "Gather reference information and shared resources", summary: "Existing asset information, libraries, templates and shared resources to be provided to tenderers." },
      { id: "5.1.7", title: "Set up the common data environment", summary: "Implement, configure and support the CDE before inviting tenders." },
      { id: "5.1.8", title: "Agree the information protocol", summary: "Define the information-related obligations, licences and liabilities incorporated into appointments." },
    ],
  },
  {
    id: "5.2",
    title: "Invitation to tender",
    summary: "The appointing party compiles the EIR and tender response requirements for each prospective lead appointed party.",
    children: [
      { id: "5.2.1", title: "Write the client's exchange information requirements", summary: "EIR per appointment: requirements, acceptance criteria, supporting information and milestones." },
      { id: "5.2.2", title: "Collect reference information and shared resources for tenderers", summary: "Issue relevant reference information and shared resources to tenderers." },
      { id: "5.2.3", title: "Decide what tenders must contain and how they are scored", summary: "Define what the tender response shall contain and how it will be evaluated." },
      { id: "5.2.4", title: "Put together the tender package", summary: "Bundle EIR, information standard, methods, protocol and resources into the invitation." },
    ],
  },
  {
    id: "5.3",
    title: "Tender response",
    summary: "The prospective lead appointed party demonstrates capability and capacity, producing the pre-appointment BEP.",
    children: [
      { id: "5.3.1", title: "Name who will manage information in the delivery team", summary: "Nominate the delivery team's information management roles." },
      { id: "5.3.2", title: "Prepare the pre-appointment BEP", summary: "Proposed approach, high-level responsibility matrix, federation strategy and proposed amendments to standards." },
      { id: "5.3.3", title: "Check each task team's capability and capacity", summary: "Assess skills, IT and capacity of each task team." },
      { id: "5.3.4", title: "Summarise the delivery team's capability and capacity", summary: "Aggregate task team assessments into a delivery team summary." },
      { id: "5.3.5", title: "Plan how the delivery team will mobilize", summary: "How information technology and processes will be mobilized and tested." },
      { id: "5.3.6", title: "Record information delivery risks", summary: "Risks relating to timely delivery of information and their mitigation." },
      { id: "5.3.7", title: "Submit the tender response", summary: "Submit the pre-appointment BEP, capability summary, mobilization plan and risk register." },
    ],
  },
  {
    id: "5.4",
    title: "Appointment",
    summary: "Confirm the BEP, produce detailed responsibility matrix, TIDPs and MIDP, and complete appointment documents.",
    children: [
      { id: "5.4.1", title: "Confirm the BEP", summary: "Update and agree the BEP, including names of individuals and confirmed federation strategy." },
      { id: "5.4.2", title: "Build the detailed responsibility matrix", summary: "Who produces which information container, when, and to which level of information need." },
      { id: "5.4.3", title: "Write the lead appointed party's EIR for each appointed party", summary: "EIR issued by the lead appointed party to each appointed party." },
      { id: "5.4.4", title: "Prepare the task information delivery plans", summary: "Each task team's TIDP listing containers, LOIN, durations and dependencies." },
      { id: "5.4.5", title: "Prepare the master information delivery plan", summary: "Aggregate TIDPs into the MIDP aligned to delivery milestones." },
      { id: "5.4.6", title: "Finalise the lead appointed party's appointment", summary: "Incorporate EIR, information standard, methods, protocol, BEP and MIDP." },
      { id: "5.4.7", title: "Finalise each appointed party's appointment", summary: "Incorporate the lead appointed party's EIR, protocol, BEP and TIDP." },
    ],
  },
  {
    id: "5.5",
    title: "Mobilization",
    summary: "Mobilize resources and IT, and test the proposed information production methods and procedures.",
    children: [
      { id: "5.5.1", title: "Get people ready", summary: "Confirm resource availability and deliver training/induction." },
      { id: "5.5.2", title: "Get IT and CDE access ready", summary: "Procure, implement, configure and test IT and CDE access." },
      { id: "5.5.3", title: "Trial the production methods and procedures", summary: "Test container breakdown, naming, federation, shared resources and delivery." },
    ],
  },
  {
    id: "5.6",
    title: "Collaborative production of information",
    summary: "Task teams generate information in WIP, check it, review it and share it through the CDE.",
    children: [
      { id: "5.6.1", title: "Confirm reference information and shared resources are available", summary: "Confirm required information is accessible before production." },
      { id: "5.6.2", title: "Produce the information", summary: "Produce information to the information standard and LOIN, coordinating with other task teams." },
      { id: "5.6.3", title: "Run the quality assurance check", summary: "Check conformance with the information standard (naming, metadata, format) before review." },
      { id: "5.6.4", title: "Review and approve information for sharing", summary: "Review content against requirements; approve and assign suitability for the Shared state." },
      { id: "5.6.5", title: "Review the federated information model", summary: "Lead appointed party reviews the federated information model for coordination and completeness." },
    ],
  },
  {
    id: "5.7",
    title: "Information model delivery",
    summary: "Submit the information model for authorization by the lead appointed party and acceptance by the appointing party.",
    children: [
      { id: "5.7.1", title: "Submit the model for authorization", summary: "Task teams submit the information model for authorization." },
      { id: "5.7.2", title: "Check and authorize the model", summary: "Lead appointed party reviews against EIR and authorizes, or rejects with reasons." },
      { id: "5.7.3", title: "Submit the model for client acceptance", summary: "Authorized model is submitted to the appointing party." },
      { id: "5.7.4", title: "Check and accept the model", summary: "Appointing party reviews and accepts into the Published state, or rejects." },
    ],
  },
  {
    id: "5.8",
    title: "Project close-out",
    summary: "Archive the project information model and capture lessons learned for future projects.",
    children: [
      { id: "5.8.1", title: "Archive the PIM", summary: "Archive containers with access, retention and future-use requirements; hand over to the AIM." },
      { id: "5.8.2", title: "Record lessons learned", summary: "Capture lessons learned from appointing and appointed parties." },
    ],
  },
];

export const workflow19650: Workflow = {
  id: "wf-19650-delivery",
  standard: "iso19650",
  title: "ISO 19650-2 Delivery Phase Workflow",
  description: "End-to-end information management process for a project delivery, with stage gates, owners and the documents each stage produces.",
  stages: [
    {
      id: "s1", title: "Assessment & need", description: "Appointing party sets up requirements, standards and the CDE.",
      gate: "Project information requirements, standard, methods, CDE and protocol established.",
      activities: [
        { id: "a1", title: "Appoint information management function", owner: "Appointing party", outputs: ["Information management appointment"] },
        { id: "a2", title: "Define OIR / AIR / PIR", owner: "Appointing party", outputs: ["OIR", "AIR", "PIR"], templateIds: ["oir", "air"] },
        { id: "a3", title: "Set information delivery milestones", owner: "Appointing party", outputs: ["Milestone schedule"] },
        { id: "a4", title: "Publish information standard & naming convention", owner: "Appointing party", outputs: ["Project information standard"], templateIds: ["info-standard"] },
        { id: "a5", title: "Configure CDE and workflow", owner: "Appointing party", outputs: ["CDE procedure"], templateIds: ["cde-procedure"] },
        { id: "a6", title: "Draft information protocol", owner: "Appointing party", outputs: ["Information protocol"], templateIds: ["info-protocol"] },
      ],
    },
    {
      id: "s2", title: "Invitation to tender", description: "EIR and tender requirements issued to prospective lead appointed parties.",
      gate: "Invitation to tender issued with EIR and evaluation criteria.",
      activities: [
        { id: "b1", title: "Write appointing party EIR", owner: "Appointing party", outputs: ["EIR"], templateIds: ["eir"] },
        { id: "b2", title: "Assemble reference information", owner: "Appointing party", outputs: ["Reference information register"] },
        { id: "b3", title: "Define tender response & evaluation criteria", owner: "Appointing party", outputs: ["Tender evaluation criteria"] },
        { id: "b4", title: "BIM scope of services for each appointment", owner: "Appointing party", outputs: ["Scope of services"], templateIds: ["bim-scope"] },
      ],
    },
    {
      id: "s3", title: "Tender response", description: "Delivery team proves capability and proposes its approach.",
      gate: "Tender response submitted: pre-appointment BEP, capability assessment, mobilization plan, risk register.",
      activities: [
        { id: "c1", title: "Pre-appointment BEP", owner: "Prospective lead appointed party", outputs: ["Pre-appointment BEP"], templateIds: ["bep-pre"] },
        { id: "c2", title: "Capability & capacity assessment", owner: "Task teams", outputs: ["Capability assessment"], templateIds: ["capability"] },
        { id: "c3", title: "Mobilization plan", owner: "Prospective lead appointed party", outputs: ["Mobilization plan"], templateIds: ["mobilization"] },
        { id: "c4", title: "Information delivery risk register", owner: "Prospective lead appointed party", outputs: ["Risk register"], templateIds: ["risk-register"] },
      ],
    },
    {
      id: "s4", title: "Appointment", description: "BEP confirmed, responsibilities and delivery plans agreed.",
      gate: "Appointment documents complete incl. post-appointment BEP, responsibility matrix, MIDP and TIDPs.",
      activities: [
        { id: "d1", title: "Post-appointment BEP", owner: "Lead appointed party", outputs: ["Post-appointment BEP"], templateIds: ["bep-post"] },
        { id: "d2", title: "Detailed responsibility matrix", owner: "Lead appointed party", outputs: ["Responsibility matrix"], templateIds: ["resp-matrix", "mpdt"] },
        { id: "d3", title: "TIDPs", owner: "Task teams", outputs: ["TIDP"], templateIds: ["tidp"] },
        { id: "d4", title: "MIDP", owner: "Lead appointed party", outputs: ["MIDP"], templateIds: ["midp"] },
      ],
    },
    {
      id: "s5", title: "Mobilization", description: "People, IT and methods mobilized and tested.",
      gate: "Resources inducted, IT mobilized, production methods tested.",
      activities: [
        { id: "e1", title: "Induct and train delivery team", owner: "Lead appointed party", outputs: ["Training record"] },
        { id: "e2", title: "Mobilize IT & CDE access", owner: "Lead appointed party", outputs: ["IT mobilization record"] },
        { id: "e3", title: "Test production methods (naming, federation)", owner: "Lead appointed party", outputs: ["Test report"] },
      ],
    },
    {
      id: "s6", title: "Collaborative production", description: "Information produced, checked, reviewed and shared.",
      gate: "Information models coordinated, QA checked and shared at the required suitability.",
      activities: [
        { id: "f1", title: "Generate information in WIP", owner: "Task teams", outputs: ["Information containers"] },
        { id: "f2", title: "QA check (naming / metadata / format)", owner: "Task teams", outputs: ["QA checklist"], templateIds: ["qa-checklist"] },
        { id: "f3", title: "Review & approve for sharing", owner: "Task team manager", outputs: ["Shared containers"] },
        { id: "f4", title: "Federated model review / clash coordination", owner: "Lead appointed party", outputs: ["Coordination report"] },
      ],
    },
    {
      id: "s7", title: "Information model delivery", description: "Authorization by lead appointed party, acceptance by appointing party.",
      gate: "Information model accepted and Published.",
      activities: [
        { id: "g1", title: "Submit for authorization", owner: "Task teams", outputs: ["Submission"] },
        { id: "g2", title: "Review & authorize", owner: "Lead appointed party", outputs: ["Authorization record"] },
        { id: "g3", title: "Review & accept", owner: "Appointing party", outputs: ["Acceptance record"] },
      ],
    },
    {
      id: "s8", title: "Project close-out", description: "Archive the PIM and capture lessons learned.",
      gate: "PIM archived, AIM updated, lessons learned recorded.",
      activities: [
        { id: "h1", title: "Archive PIM / transfer to AIM", owner: "Appointing party", outputs: ["Archive record"] },
        { id: "h2", title: "Lessons learned", owner: "All parties", outputs: ["Lessons learned report"], templateIds: ["lessons"] },
      ],
    },
  ],
};

export const cdeStates = [
  { id: "WIP", title: "Work in progress", desc: "Information being developed by its task team; not visible to other task teams.", color: "#64748b" },
  { id: "SHARED", title: "Shared", desc: "Approved for sharing with others for coordination; not for construction.", color: "#2563eb" },
  { id: "PUBLISHED", title: "Published", desc: "Authorized and accepted information for use (e.g., construction, handover).", color: "#16a34a" },
  { id: "ARCHIVED", title: "Archived", desc: "Journal of transactions and superseded information, retained for audit.", color: "#0e7490" },
];

// UK National Annex (BS EN ISO 19650-2:2018 NA, 2021 update) — commonly used codes.
export const suitabilityCodes = [
  { code: "S0", state: "WIP", desc: "Initial status / work in progress" },
  { code: "S1", state: "SHARED", desc: "Suitable for coordination" },
  { code: "S2", state: "SHARED", desc: "Suitable for information" },
  { code: "S3", state: "SHARED", desc: "Suitable for review and comment" },
  { code: "S4", state: "SHARED", desc: "Suitable for stage approval" },
  { code: "S6", state: "SHARED", desc: "Suitable for PIM authorization" },
  { code: "S7", state: "SHARED", desc: "Suitable for AIM authorization" },
  { code: "A1–An", state: "PUBLISHED", desc: "Authorized and accepted (stage n)" },
  { code: "B1–Bn", state: "PUBLISHED", desc: "Partially authorized and accepted, with comments" },
  { code: "CR", state: "PUBLISHED", desc: "As-constructed record" },
];

export const namingFields = [
  { id: "project", label: "Project", hint: "2–6 chars", example: "PRJ01" },
  { id: "originator", label: "Originator", hint: "3–6 chars", example: "ABC" },
  { id: "volume", label: "Volume / System", hint: "1–2 chars", example: "ZZ" },
  { id: "level", label: "Level / Location", hint: "2 chars", example: "00" },
  { id: "type", label: "Type", hint: "2 chars", example: "M3" },
  { id: "role", label: "Role", hint: "1–2 chars", example: "A" },
  { id: "number", label: "Number", hint: "4–6 digits", example: "0001" },
];

export const typeCodes = ["M3 – 3D model", "M2 – 2D model", "DR – Drawing", "SP – Specification", "RP – Report", "SH – Schedule", "CA – Calculation", "MI – Minutes", "PP – Presentation", "CO – Correspondence"];
export const roleCodes = ["A – Architect", "C – Civil engineer", "E – Electrical engineer", "M – Mechanical engineer", "P – Public health engineer", "S – Structural engineer", "K – Client", "Q – Quantity surveyor", "W – Contractor", "X – Subcontractor", "Z – General (non-disciplinary)"];

export const glossary19650: GlossaryTerm[] = [
  { term: "Organizational information requirements", abbr: "OIR", definition: "Information needed to answer or inform high-level strategic objectives of the appointing party." },
  { term: "Asset information requirements", abbr: "AIR", definition: "Information requirements relating to the operation of an asset." },
  { term: "Project information requirements", abbr: "PIR", definition: "The information the client needs to make decisions while the asset is being designed and built." },
  { term: "Exchange information requirements", abbr: "EIR", definition: "Information requirements relating to an appointment: what, when, how and to what level of need." },
  { term: "BIM execution plan", abbr: "BEP", definition: "Plan explaining how the information management aspects of the appointment will be carried out by the delivery team." },
  { term: "Master information delivery plan", abbr: "MIDP", definition: "The combined delivery schedule, built from all the TIDPs, showing what information is produced, when, by whom and to which procedures." },
  { term: "Task information delivery plan", abbr: "TIDP", definition: "Schedule of information containers and delivery dates for a specific task team." },
  { term: "Project information model", abbr: "PIM", definition: "The information model built up during design and construction (the delivery phase)." },
  { term: "Asset information model", abbr: "AIM", definition: "The information model used to operate and maintain the asset once it is in use." },
  { term: "Common data environment", abbr: "CDE", definition: "The agreed single place, with its workflow, where project or asset information is collected, controlled and shared; each container moves through set states." },
  { term: "Information container", definition: "Any uniquely named set of information, such as a file, model, drawing or database record, that can be stored and found again." },
  { term: "Level of information need", abbr: "LOIN", definition: "Framework defining the extent and granularity of information (geometry, alphanumeric, documentation). See ISO 7817-1." },
  { term: "Appointing party", definition: "The client: the party that sets the requirements and receives information from the lead appointed party." },
  { term: "Lead appointed party", definition: "The party appointed directly by the client, which manages and coordinates the information produced by its own appointed parties." },
  { term: "Appointed party", definition: "A party that produces information for the works, goods or services it has been engaged to provide." },
  { term: "Task team", definition: "A group of people brought together to carry out a particular piece of work, such as one discipline's design." },
  { term: "Delivery team", definition: "The lead appointed party together with all of the appointed parties working under it." },
  { term: "Federation strategy", definition: "How information models are divided into separate containers and combined for coordination." },
  { term: "Information protocol", definition: "The appointment schedule that sets out duties, licences, liabilities and limits on how information may be used." },
  { term: "Trigger event", definition: "Planned or unplanned event that changes an asset or its status during operation, requiring information exchange (ISO 19650-3)." },
];

export const references19650: Reference[] = [
  { title: "BS EN ISO 19650-1:2018", publisher: "ISO / BSI", note: "Concepts and principles." },
  { title: "BS EN ISO 19650-2:2018 (incl. UK National Annex 2021)", publisher: "ISO / BSI", note: "Delivery phase; NA defines naming fields and status codes." },
  { title: "BS EN ISO 19650-3:2020", publisher: "ISO / BSI", note: "Operational phase." },
  { title: "BS EN ISO 19650-4:2022", publisher: "ISO / BSI", note: "Information exchange." },
  { title: "BS EN ISO 19650-5:2020", publisher: "ISO / BSI", note: "Security-minded approach." },
  { title: "ISO 19650-6:2025", publisher: "ISO", note: "Health and safety information." },
  { title: "ISO 7817-1:2024", publisher: "ISO", note: "Level of information need — concepts and principles." },
  { title: "ISO 16739-1 (IFC)", publisher: "ISO / buildingSMART", note: "Industry Foundation Classes data schema. The 2018 edition (IFC4 ADD2 TC1) has been replaced by ISO 16739-1:2024 (IFC 4.3)." },
  { title: "Information Delivery Specification (IDS)", publisher: "buildingSMART", note: "Machine-readable information requirements.", url: "https://technical.buildingsmart.org/projects/information-delivery-specification-ids/" },
  { title: "BCF — BIM Collaboration Format", publisher: "buildingSMART", note: "Issue exchange between BIM tools.", url: "https://technical.buildingsmart.org/standards/bcf/" },
  { title: "UK BIM Framework guidance", publisher: "UK BIM Framework", note: "Free guidance series on ISO 19650 implementation.", url: "https://www.ukbimframework.org/" },
  { title: "Uniclass", publisher: "NBS", note: "UK classification system.", url: "https://www.thenbs.com/our-tools/uniclass" },
  { title: "BS 1192-4 / COBie", publisher: "BSI", note: "Structured facility information exchange (COBie)." },
];
