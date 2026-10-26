import type { Clause, GlossaryTerm, Reference, Workflow } from "./types";

// ISO/IEC 42001:2023 — AI management system (AIMS).
// Content is paraphrased guidance, not reproduced standard text.

export const clauses42001: Clause[] = [
  {
    id: "4", title: "Context of the organization",
    summary: "Understand the organization, its role relative to AI (provider, producer, user, etc.), interested parties and the scope of the AIMS.",
    children: [
      { id: "4.1", title: "Understanding the organization and its context", summary: "Determine internal/external issues, the intended purpose of AI systems and the organization's AI roles; consider climate change relevance.", outputs: ["Context analysis"] },
      { id: "4.2", title: "Needs and expectations of interested parties", summary: "Identify interested parties and their relevant requirements, including legal and regulatory ones.", outputs: ["Interested parties register"] },
      { id: "4.3", title: "Scope of the AI management system", summary: "Determine and document boundaries and applicability of the AIMS.", outputs: ["AIMS scope statement"] },
      { id: "4.4", title: "AI management system", summary: "Establish, implement, maintain and continually improve the AIMS and its processes." },
    ],
  },
  {
    id: "5", title: "Leadership",
    summary: "Top management commitment, AI policy and assignment of roles, responsibilities and authorities.",
    children: [
      { id: "5.1", title: "Leadership and commitment", summary: "Top management demonstrates leadership: policy, objectives, resources, integration into business processes." },
      { id: "5.2", title: "AI policy", summary: "Establish an AI policy appropriate to the organization's purpose, providing a framework for AI objectives.", outputs: ["AI policy"] },
      { id: "5.3", title: "Roles, responsibilities and authorities", summary: "Assign and communicate responsibilities for the AIMS and reporting on its performance.", outputs: ["RACI / role descriptions"] },
    ],
  },
  {
    id: "6", title: "Planning",
    summary: "Address risks and opportunities, perform AI risk assessment, risk treatment and AI system impact assessment; set AI objectives.",
    children: [
      { id: "6.1.1", title: "Actions to address risks and opportunities — general", summary: "Plan actions considering context, interested parties and intended use; establish AI risk criteria." },
      { id: "6.1.2", title: "AI risk assessment", summary: "Define and apply a repeatable process to identify, analyse and evaluate AI risks.", outputs: ["AI risk assessment"] },
      { id: "6.1.3", title: "AI risk treatment", summary: "Select treatment options and controls (comparing with Annex A), produce the Statement of Applicability and a risk treatment plan.", outputs: ["Statement of Applicability", "Risk treatment plan"] },
      { id: "6.1.4", title: "AI system impact assessment", summary: "Assess potential consequences of AI systems for individuals, groups and societies.", outputs: ["AI system impact assessment"] },
      { id: "6.2", title: "AI objectives and planning to achieve them", summary: "Set measurable AI objectives and plan what, who, resources, when and how results are evaluated.", outputs: ["AI objectives plan"] },
      { id: "6.3", title: "Planning of changes", summary: "Carry out changes to the AIMS in a planned manner." },
    ],
  },
  {
    id: "7", title: "Support",
    summary: "Resources, competence, awareness, communication and documented information.",
    children: [
      { id: "7.1", title: "Resources", summary: "Determine and provide resources needed for the AIMS." },
      { id: "7.2", title: "Competence", summary: "Ensure competence of persons affecting AI performance; retain evidence.", outputs: ["Competence matrix"] },
      { id: "7.3", title: "Awareness", summary: "Persons are aware of the AI policy, their contribution and implications of nonconformity." },
      { id: "7.4", title: "Communication", summary: "Determine internal and external communications relevant to the AIMS." },
      { id: "7.5", title: "Documented information", summary: "Create, update and control documented information required by the AIMS.", outputs: ["Document control procedure"] },
    ],
  },
  {
    id: "8", title: "Operation",
    summary: "Plan and control processes; perform risk assessments, treatments and impact assessments at planned intervals.",
    children: [
      { id: "8.1", title: "Operational planning and control", summary: "Plan, implement and control processes, including externally provided ones." },
      { id: "8.2", title: "AI risk assessment", summary: "Perform AI risk assessments at planned intervals or on significant change." },
      { id: "8.3", title: "AI risk treatment", summary: "Implement the AI risk treatment plan and verify effectiveness." },
      { id: "8.4", title: "AI system impact assessment", summary: "Perform impact assessments at planned intervals or on significant change." },
    ],
  },
  {
    id: "9", title: "Performance evaluation",
    summary: "Monitoring, measurement, internal audit and management review.",
    children: [
      { id: "9.1", title: "Monitoring, measurement, analysis and evaluation", summary: "Determine what is monitored, methods, timing and evaluation of results.", outputs: ["KPI dashboard"] },
      { id: "9.2", title: "Internal audit", summary: "Conduct internal audits at planned intervals under an audit programme.", outputs: ["Internal audit plan", "Audit report"] },
      { id: "9.3", title: "Management review", summary: "Top management reviews the AIMS for suitability, adequacy and effectiveness.", outputs: ["Management review minutes"] },
    ],
  },
  {
    id: "10", title: "Improvement",
    summary: "Continual improvement, nonconformity and corrective action.",
    children: [
      { id: "10.1", title: "Continual improvement", summary: "Continually improve suitability, adequacy and effectiveness of the AIMS." },
      { id: "10.2", title: "Nonconformity and corrective action", summary: "React to nonconformities, determine causes, take corrective action and retain evidence.", outputs: ["Corrective action log"] },
    ],
  },
];

export interface Control {
  id: string;
  title: string;
  objective: string;
}

export interface ControlGroup {
  id: string;
  title: string;
  controls: Control[];
}

export const annexA42001: ControlGroup[] = [
  { id: "A.2", title: "Policies related to AI", controls: [
    { id: "A.2.2", title: "AI policy", objective: "Document a policy for the development or use of AI systems." },
    { id: "A.2.3", title: "Alignment with other organizational policies", objective: "Determine where other policies are affected by or apply to AI objectives." },
    { id: "A.2.4", title: "Review of the AI policy", objective: "Review the AI policy at planned intervals or on significant change." },
  ]},
  { id: "A.3", title: "Internal organization", controls: [
    { id: "A.3.2", title: "AI roles and responsibilities", objective: "Define and allocate roles and responsibilities for AI." },
    { id: "A.3.3", title: "Reporting of concerns", objective: "Provide a process to report concerns about the organization's role in AI systems." },
  ]},
  { id: "A.4", title: "Resources for AI systems", controls: [
    { id: "A.4.2", title: "Resource documentation", objective: "Identify and document resources required for AI system life cycle stages." },
    { id: "A.4.3", title: "Data resources", objective: "Document information about data resources used for the AI system." },
    { id: "A.4.4", title: "Tooling resources", objective: "Document information about tooling resources used." },
    { id: "A.4.5", title: "System and computing resources", objective: "Document information about system and computing resources." },
    { id: "A.4.6", title: "Human resources", objective: "Document human resources and competences used." },
  ]},
  { id: "A.5", title: "Assessing impacts of AI systems", controls: [
    { id: "A.5.2", title: "AI system impact assessment process", objective: "Establish a process to assess potential consequences of AI systems." },
    { id: "A.5.3", title: "Documentation of AI system impact assessments", objective: "Document and retain the results of impact assessments." },
    { id: "A.5.4", title: "Assessing AI system impact on individuals or groups", objective: "Assess and document impacts on individuals or groups of individuals." },
    { id: "A.5.5", title: "Assessing societal impacts of AI systems", objective: "Assess and document potential societal impacts." },
  ]},
  { id: "A.6", title: "AI system life cycle", controls: [
    { id: "A.6.1.2", title: "Objectives for responsible development of AI system", objective: "Identify and document objectives guiding responsible development." },
    { id: "A.6.1.3", title: "Processes for responsible AI system design and development", objective: "Define processes for responsible design and development." },
    { id: "A.6.2.2", title: "AI system requirements and specification", objective: "Specify and document requirements for new systems or material enhancements." },
    { id: "A.6.2.3", title: "Documentation of AI system design and development", objective: "Document design and development based on objectives and requirements." },
    { id: "A.6.2.4", title: "AI system verification and validation", objective: "Define and document verification and validation measures and criteria." },
    { id: "A.6.2.5", title: "AI system deployment", objective: "Document a deployment plan and ensure requirements are met before deployment." },
    { id: "A.6.2.6", title: "AI system operation and monitoring", objective: "Define elements for ongoing operation: monitoring, repairs, updates, support." },
    { id: "A.6.2.7", title: "AI system technical documentation", objective: "Determine and provide technical documentation for relevant interested parties." },
    { id: "A.6.2.8", title: "AI system recording of event logs", objective: "Determine at which life cycle phases event logging is enabled." },
  ]},
  { id: "A.7", title: "Data for AI systems", controls: [
    { id: "A.7.2", title: "Data for development and enhancement of AI system", objective: "Define and implement data management processes." },
    { id: "A.7.3", title: "Acquisition of data", objective: "Determine and document details about acquisition and selection of data." },
    { id: "A.7.4", title: "Quality of data for AI systems", objective: "Define and document data quality requirements and ensure data meets them." },
    { id: "A.7.5", title: "Data provenance", objective: "Define and document a process to record data provenance over the life cycle." },
    { id: "A.7.6", title: "Data preparation", objective: "Define and document criteria for selecting data preparation methods." },
  ]},
  { id: "A.8", title: "Information for interested parties", controls: [
    { id: "A.8.2", title: "System documentation and information for users", objective: "Determine and provide necessary information to users of the AI system." },
    { id: "A.8.3", title: "External reporting", objective: "Provide capabilities for interested parties to report adverse impacts." },
    { id: "A.8.4", title: "Communication of incidents", objective: "Determine and document a plan for communicating incidents to users." },
    { id: "A.8.5", title: "Information for interested parties", objective: "Determine and document obligations to report information about the AI system." },
  ]},
  { id: "A.9", title: "Use of AI systems", controls: [
    { id: "A.9.2", title: "Processes for responsible use of AI systems", objective: "Define and document processes for responsible use." },
    { id: "A.9.3", title: "Objectives for responsible use of AI system", objective: "Identify and document objectives guiding responsible use." },
    { id: "A.9.4", title: "Intended use of the AI system", objective: "Ensure the AI system is used according to intended uses and documentation." },
  ]},
  { id: "A.10", title: "Third-party and customer relationships", controls: [
    { id: "A.10.2", title: "Allocating responsibilities", objective: "Allocate responsibilities between the organization, partners, suppliers and customers." },
    { id: "A.10.3", title: "Suppliers", objective: "Ensure supplier services, products or materials align with responsible AI." },
    { id: "A.10.4", title: "Customers", objective: "Ensure the responsible approach considers customer expectations and needs." },
  ]},
];

export const allControls42001 = annexA42001.flatMap((g) => g.controls.map((c) => ({ ...c, group: g.title })));

export const workflow42001: Workflow = {
  id: "wf-42001-aims",
  standard: "iso42001",
  title: "ISO/IEC 42001 AIMS Implementation Workflow",
  description: "Implement an AI management system from scoping through certification readiness, following the Plan-Do-Check-Act cycle.",
  stages: [
    { id: "p1", title: "Context & scope", description: "Understand context, AI roles and interested parties; define AIMS scope.", gate: "Scope statement approved by top management.", activities: [
      { id: "k1", title: "Context analysis & AI roles", owner: "AIMS lead", outputs: ["Context analysis"], templateIds: ["ai-context"] },
      { id: "k2", title: "Interested parties register", owner: "AIMS lead", outputs: ["Interested parties register"], templateIds: ["ai-context"] },
      { id: "k3", title: "AI system inventory", owner: "AI system owners", outputs: ["AI system inventory"], templateIds: ["ai-inventory"] },
    ]},
    { id: "p2", title: "Leadership & policy", description: "Top management commitment, AI policy, roles.", gate: "AI policy approved and communicated.", activities: [
      { id: "l1", title: "AI policy", owner: "Top management", outputs: ["AI policy"], templateIds: ["ai-policy"] },
      { id: "l2", title: "Roles & responsibilities (RACI)", owner: "Top management", outputs: ["AIMS RACI"], templateIds: ["ai-raci"] },
    ]},
    { id: "p3", title: "Risk & impact planning", description: "AI risk assessment, impact assessment, treatment and SoA.", gate: "Risk treatment plan and Statement of Applicability approved.", activities: [
      { id: "m1", title: "AI risk assessment", owner: "Risk owner", outputs: ["AI risk register"], templateIds: ["ai-risk"] },
      { id: "m2", title: "AI system impact assessment", owner: "AI system owner", outputs: ["AISIA"], templateIds: ["ai-impact"] },
      { id: "m3", title: "Statement of Applicability", owner: "AIMS lead", outputs: ["SoA"], templateIds: ["ai-soa"] },
      { id: "m4", title: "AI objectives", owner: "Top management", outputs: ["AI objectives plan"], templateIds: ["ai-objectives"] },
    ]},
    { id: "p4", title: "Support & operation", description: "Competence, awareness, document control; operate controls across the AI life cycle.", gate: "Controls implemented with evidence.", activities: [
      { id: "n1", title: "Competence & awareness programme", owner: "HR / AIMS lead", outputs: ["Training records"] },
      { id: "n2", title: "AI system life cycle procedures", owner: "Engineering", outputs: ["Life cycle procedure"], templateIds: ["ai-lifecycle"] },
      { id: "n3", title: "Data management & provenance", owner: "Data owner", outputs: ["Data quality records"] },
    ]},
    { id: "p5", title: "Performance evaluation", description: "Monitoring, internal audit, management review.", gate: "Internal audit completed and management review held.", activities: [
      { id: "o1", title: "Monitoring & KPIs", owner: "AIMS lead", outputs: ["KPI report"] },
      { id: "o2", title: "Internal audit", owner: "Internal auditor", outputs: ["Audit plan & report"], templateIds: ["ai-audit"] },
      { id: "o3", title: "Management review", owner: "Top management", outputs: ["Review minutes"], templateIds: ["ai-mgmt-review"] },
    ]},
    { id: "p6", title: "Improvement & certification", description: "Corrective actions, continual improvement, certification audit.", gate: "Stage 1 & 2 certification audit readiness.", activities: [
      { id: "q1", title: "Nonconformity & corrective action", owner: "AIMS lead", outputs: ["Corrective action log"], templateIds: ["ai-capa"] },
      { id: "q2", title: "Certification readiness check", owner: "AIMS lead", outputs: ["Readiness report"] },
    ]},
  ],
};

export const glossary42001: GlossaryTerm[] = [
  { term: "AI management system", abbr: "AIMS", definition: "Set of interrelated elements of an organization to establish policies, objectives and processes for the responsible development, provision or use of AI systems." },
  { term: "AI system", definition: "Engineered system that generates outputs such as content, forecasts, recommendations or decisions for a given set of human-defined objectives (see ISO/IEC 22989)." },
  { term: "AI system impact assessment", abbr: "AISIA", definition: "Formal, documented process to identify, evaluate and address impacts of an AI system on individuals, groups and societies." },
  { term: "Statement of Applicability", abbr: "SoA", definition: "Documentation of all necessary controls, justification for inclusion or exclusion, and implementation status." },
  { term: "AI risk", definition: "Effect of uncertainty on objectives, in the context of AI systems." },
  { term: "Interested party", definition: "Person or organization that can affect, be affected by, or perceive itself to be affected by a decision or activity." },
  { term: "Data provenance", definition: "Record of the origin and history of data, including transformations." },
  { term: "Top management", definition: "Person or group who directs and controls an organization at the highest level." },
  { term: "Nonconformity", definition: "Non-fulfilment of a requirement." },
  { term: "Continual improvement", definition: "Recurring activity to enhance performance." },
];

export const references42001: Reference[] = [
  { title: "ISO/IEC 42001:2023", publisher: "ISO / IEC", note: "AI management system — requirements." },
  { title: "ISO/IEC 42005:2025", publisher: "ISO / IEC", note: "AI system impact assessment guidance." },
  { title: "ISO/IEC 42006", publisher: "ISO / IEC", note: "Requirements for bodies auditing and certifying AIMS." },
  { title: "ISO/IEC 23894:2023", publisher: "ISO / IEC", note: "Guidance on AI risk management." },
  { title: "ISO/IEC 22989:2022", publisher: "ISO / IEC", note: "AI concepts and terminology." },
  { title: "ISO/IEC 38507:2022", publisher: "ISO / IEC", note: "Governance implications of the use of AI by organizations." },
  { title: "ISO/IEC 27001:2022", publisher: "ISO / IEC", note: "Information security management — integrates with the AIMS (Annex SL structure)." },
  { title: "NIST AI Risk Management Framework 1.0", publisher: "NIST", note: "Voluntary AI risk framework; maps well to 42001.", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
  { title: "EU AI Act (Regulation (EU) 2024/1689)", publisher: "European Union", note: "Risk-based AI regulation; 42001 supports conformity evidence.", url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj" },
];

// Applying AI in BIM — ties both standards together.
export const aiInBimUseCases = [
  { title: "Automated model checking / clash triage", risk: "Medium", note: "Validate outputs against human review before status change to Shared." },
  { title: "Generative drafting of EIR/BEP text", risk: "Medium", note: "Human author remains accountable; record AI assistance in revision notes." },
  { title: "Classification / metadata auto-tagging", risk: "Low", note: "Sample-check accuracy as part of 5.6.3 QA." },
  { title: "Predictive maintenance on AIM data", risk: "High", note: "Requires data provenance (A.7.5) and impact assessment on occupants." },
  { title: "Site progress monitoring via computer vision", risk: "High", note: "Privacy impact on workers — AISIA (A.5.4) required." },
];
