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
      { id: "5.1.1", title: "Appoint individuals to undertake the information management function", summary: "Assign internal or external resources responsible for information management on behalf of the appointing party." },
      { id: "5.1.2", title: "Establish the project's information requirements", summary: "Define PIR derived from OIR/AIR, covering purpose, key decision points and the information needed." },
      { id: "5.1.3", title: "Establish the project's information delivery milestones", summary: "Align information delivery milestones with the project programme and key decision points." },
      { id: "5.1.4", title: "Establish the project's information standard", summary: "Define exchange formats, structure, classification, naming, metadata and level of information need." },
      { id: "5.1.5", title: "Establish the project's information production methods and procedures", summary: "Capture, generation, review, approval, security and delivery procedures." },
      { id: "5.1.6", title: "Establish the project's reference information and shared resources", summary: "Existing asset information, libraries, templates and shared resources to be provided to tenderers." },
      { id: "5.1.7", title: "Establish the project's common data environment", summary: "Implement, configure and support the CDE before inviting tenders." },
      { id: "5.1.8", title: "Establish the project's information protocol", summary: "Define the information-related obligations, licences and liabilities incorporated into appointments." },
    ],
  },
  {
    id: "5.2",
    title: "Invitation to tender",
    summary: "The appointing party compiles the EIR and tender response requirements for each prospective lead appointed party.",
    children: [
      { id: "5.2.1", title: "Establish the appointing party's exchange information requirements", summary: "EIR per appointment: requirements, acceptance criteria, supporting information and milestones." },
      { id: "5.2.2", title: "Assemble reference information and shared resources", summary: "Issue relevant reference information and shared resources to tenderers." },
      { id: "5.2.3", title: "Establish tender response requirements and evaluation criteria", summary: "Define what the tender response shall contain and how it will be evaluated." },
      { id: "5.2.4", title: "Compile invitation to tender information", summary: "Bundle EIR, information standard, methods, protocol and resources into the invitation." },
    ],
  },
  {
    id: "5.3",
    title: "Tender response",
    summary: "The prospective lead appointed party demonstrates capability and capacity, producing the pre-appointment BEP.",
    children: [
      { id: "5.3.1", title: "Nominate individuals to undertake the information management function", summary: "Nominate the delivery team's information management roles." },
      { id: "5.3.2", title: "Establish the delivery team's (pre-appointment) BIM execution plan", summary: "Proposed approach, high-level responsibility matrix, federation strategy and proposed amendments to standards." },
      { id: "5.3.3", title: "Assess each task team's capability and capacity", summary: "Assess skills, IT and capacity of each task team." },
      { id: "5.3.4", title: "Establish the delivery team's capability and capacity", summary: "Aggregate task team assessments into a delivery team summary." },
      { id: "5.3.5", title: "Establish the delivery team's proposed mobilization plan", summary: "How information technology and processes will be mobilized and tested." },
      { id: "5.3.6", title: "Establish the delivery team's risk register", summary: "Risks relating to timely delivery of information and their mitigation." },
      { id: "5.3.7", title: "Compile the delivery team's tender response", summary: "Submit the pre-appointment BEP, capability summary, mobilization plan and risk register." },
    ],
  },
  {
    id: "5.4",
    title: "Appointment",
    summary: "Confirm the BEP, produce detailed responsibility matrix, TIDPs and MIDP, and complete appointment documents.",
    children: [
      { id: "5.4.1", title: "Confirm the delivery team's BIM execution plan", summary: "Update and agree the BEP, including names of individuals and confirmed federation strategy." },
      { id: "5.4.2", title: "Establish the delivery team's detailed responsibility matrix", summary: "Who produces which information container, when, and to which level of information need." },
      { id: "5.4.3", title: "Establish the lead appointed party's exchange information requirements", summary: "EIR issued by the lead appointed party to each appointed party." },
      { id: "5.4.4", title: "Establish the task information delivery plan(s)", summary: "Each task team's TIDP listing containers, LOIN, durations and dependencies." },
      { id: "5.4.5", title: "Establish the master information delivery plan", summary: "Aggregate TIDPs into the MIDP aligned to delivery milestones." },
      { id: "5.4.6", title: "Complete lead appointed party's appointment documents", summary: "Incorporate EIR, information standard, methods, protocol, BEP and MIDP." },
      { id: "5.4.7", title: "Complete appointed party's appointment documents", summary: "Incorporate the lead appointed party's EIR, protocol, BEP and TIDP." },
    ],
  },
  {
    id: "5.5",
    title: "Mobilization",
    summary: "Mobilize resources and IT, and test the proposed information production methods and procedures.",
    children: [
      { id: "5.5.1", title: "Mobilize resources", summary: "Confirm resource availability and deliver training/induction." },
      { id: "5.5.2", title: "Mobilize information technology", summary: "Procure, implement, configure and test IT and CDE access." },
      { id: "5.5.3", title: "Test the project's information production methods and procedures", summary: "Test container breakdown, naming, federation, shared resources and delivery." },
    ],
  },
  {
    id: "5.6",
    title: "Collaborative production of information",
    summary: "Task teams generate information in WIP, check it, review it and share it through the CDE.",
    children: [
      { id: "5.6.1", title: "Check availability of reference information and shared resources", summary: "Confirm required information is accessible before production." },
      { id: "5.6.2", title: "Generate information", summary: "Produce information to the information standard and LOIN, coordinating with other task teams." },
      { id: "5.6.3", title: "Undertake quality assurance check", summary: "Check conformance with the information standard (naming, metadata, format) before review." },
      { id: "5.6.4", title: "Review information and approve for sharing", summary: "Review content against requirements; approve and assign suitability for the Shared state." },
      { id: "5.6.5", title: "Information model review", summary: "Lead appointed party reviews the federated information model for coordination and completeness." },
    ],
  },
  {
    id: "5.7",
    title: "Information model delivery",
    summary: "Submit the information model for authorization by the lead appointed party and acceptance by the appointing party.",
    children: [
      { id: "5.7.1", title: "Submit information model for lead appointed party authorization", summary: "Task teams submit the information model for authorization." },
      { id: "5.7.2", title: "Review and authorize the information model", summary: "Lead appointed party reviews against EIR and authorizes, or rejects with reasons." },
      { id: "5.7.3", title: "Submit information model for appointing party acceptance", summary: "Authorized model is submitted to the appointing party." },
      { id: "5.7.4", title: "Review and accept the information model", summary: "Appointing party reviews and accepts into the Published state, or rejects." },
    ],
  },
  {
    id: "5.8",
    title: "Project close-out",
    summary: "Archive the project information model and capture lessons learned for future projects.",
    children: [
      { id: "5.8.1", title: "Archive the project information model", summary: "Archive containers with access, retention and future-use requirements; hand over to the AIM." },
      { id: "5.8.2", title: "Compile lessons learned for future projects", summary: "Capture lessons learned from appointing and appointed parties." },
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
        { id: "d2", title: "Detailed responsibility matrix", owner: "Lead appointed party", outputs: ["Responsibility matrix"], templateIds: ["resp-matrix"] },
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
  { id: "ARCHIVED", title: "Archived", desc: "Journal of transactions and superseded information, retained for audit.", color: "#9333ea" },
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
  { term: "Project information requirements", abbr: "PIR", definition: "Information requirements relating to the delivery of an asset." },
  { term: "Exchange information requirements", abbr: "EIR", definition: "Information requirements relating to an appointment: what, when, how and to what level of need." },
  { term: "BIM execution plan", abbr: "BEP", definition: "Plan explaining how the information management aspects of the appointment will be carried out by the delivery team." },
  { term: "Master information delivery plan", abbr: "MIDP", definition: "Plan incorporating all relevant TIDPs, stating when project information is to be prepared, by whom and using what protocols." },
  { term: "Task information delivery plan", abbr: "TIDP", definition: "Schedule of information containers and delivery dates for a specific task team." },
  { term: "Project information model", abbr: "PIM", definition: "Information model relating to the delivery phase of the asset." },
  { term: "Asset information model", abbr: "AIM", definition: "Information model relating to the operational phase of the asset." },
  { term: "Common data environment", abbr: "CDE", definition: "Agreed source of information for a project or asset for collecting, managing and disseminating each information container through a managed process." },
  { term: "Information container", definition: "Named persistent set of information retrievable from within a file, system or application storage hierarchy." },
  { term: "Level of information need", abbr: "LOIN", definition: "Framework defining the extent and granularity of information (geometry, alphanumeric, documentation). See ISO 7817-1." },
  { term: "Appointing party", definition: "Receiver of information concerning works, goods or services from a lead appointed party (the client)." },
  { term: "Lead appointed party", definition: "Receiver of an appointment from the appointing party, coordinating information from its appointed parties." },
  { term: "Appointed party", definition: "Provider of information concerning works, goods or services." },
  { term: "Task team", definition: "Individuals assembled to perform a specific task." },
  { term: "Delivery team", definition: "Lead appointed party and their appointed parties." },
  { term: "Federation strategy", definition: "How information models are divided into separate containers and combined for coordination." },
  { term: "Information protocol", definition: "Specific obligations, liabilities and associated limitations on the use of information, incorporated into appointments." },
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
  { title: "ISO 16739-1 (IFC)", publisher: "ISO / buildingSMART", note: "Industry Foundation Classes data schema." },
  { title: "Information Delivery Specification (IDS)", publisher: "buildingSMART", note: "Machine-readable information requirements.", url: "https://technical.buildingsmart.org/projects/information-delivery-specification-ids/" },
  { title: "BCF — BIM Collaboration Format", publisher: "buildingSMART", note: "Issue exchange between BIM tools.", url: "https://technical.buildingsmart.org/standards/bcf/" },
  { title: "UK BIM Framework guidance", publisher: "UK BIM Framework", note: "Free guidance series on ISO 19650 implementation.", url: "https://www.ukbimframework.org/" },
  { title: "Uniclass", publisher: "NBS", note: "UK classification system.", url: "https://www.thenbs.com/our-tools/uniclass" },
  { title: "BS 1192-4 / COBie", publisher: "BSI", note: "Structured facility information exchange (COBie)." },
];
