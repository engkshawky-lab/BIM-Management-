// Learning paths by role: an ordered set of steps through existing platform pages.
// Every href is a hash path that already exists (checked in learningPaths.test.ts).

export type StepKind = "read" | "practise" | "tool" | "quiz";
export interface PathStep { title: string; why: string; href: string; minutes: number; kind: StepKind }
export interface LearningPath { id: string; role: string; title: string; summary: string; weeks: number; steps: PathStep[] }

const s = (kind: StepKind, href: string, minutes: number, title: string, why: string): PathStep => ({ title, why, href, minutes, kind });

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "modeller", role: "BIM modeller", weeks: 4,
    title: "From modelling to managed information",
    summary: "Learn the ISO 19650 basics a modeller needs every day: naming, CDE states, level of information need and how to share clean, checked models.",
    steps: [
      s("read", "/parts/19650-1/overview", 30, "ISO 19650 in plain terms", "Learn the parties, requirements and information models you will hear about on every project."),
      s("read", "/knowledge/iso19650/library/3", 20, "Glossary and acronyms", "Know what EIR, BEP, TIDP and LOIN mean before you meet them in a brief."),
      s("read", "/workflow/roles/author", 15, "Your role profile", "See what a modeller is responsible for at each stage and which tools you will use."),
      s("read", "/knowledge/iso19650/library/2", 25, "CDE states and status codes", "Understand WIP, Shared, Published and Archived, and what S0 to S4 mean for your files."),
      s("tool", "/knowledge/iso19650/naming", 15, "Build a compliant container name", "Practise the UK National Annex naming fields on one of your own files."),
      s("tool", "/tools/naming-check", 15, "Check a batch of file names", "Catch naming errors before upload, when they are cheapest to fix."),
      s("read", "/hubs/loin", 40, "Level of information need", "Model only what each milestone needs: geometry, data and documentation."),
      s("read", "/doc-guides/tidp", 20, "How your task team plans its deliverables", "Your work appears as containers in the TIDP, with dates and dependencies."),
      s("read", "/hubs/revit", 45, "Revit best practices", "Set up models, parameters and IFC export the way coordinators expect."),
      s("tool", "/model-tools/revit", 20, "Check your Revit project", "Run a health check on naming, parameters and sheets before you share."),
      s("read", "/workflow/documents", 20, "How documents move through the CDE", "Follow a file from WIP to Published, including the checks and reviews on the way."),
      s("practise", "/parts/19650-2/examples", 25, "Part 2 practical examples", "See how real task teams produce, check and share information."),
      s("tool", "/bim-tools/bcf", 20, "Respond to issues in BCF", "Open coordination issues, fix the model and reply with viewpoints."),
      s("quiz", "/parts/19650-1/quiz", 10, "Part 1 quiz", "Confirm the core concepts have stuck."),
      s("quiz", "/learn", 30, "Practice questions and the Part 2 mock exam", "Answer the CDE, naming and status set, then try the timed Part 2 mock exam."),
    ],
  },
  {
    id: "coordinator", role: "BIM coordinator", weeks: 6,
    title: "Coordinating models and exchanges",
    summary: "Run federation, clash and issue management, model checks and exchange reviews in line with ISO 19650-2 and -4.",
    steps: [
      s("read", "/workflow/roles/coordinator", 15, "The BIM coordinator role", "See your duties, the documents you touch and the tools you use at each stage."),
      s("read", "/parts/19650-2/overview", 30, "The delivery process", "Understand the eight activities your coordination work sits inside."),
      s("read", "/knowledge/iso19650/library/1", 25, "Delivery process diagram", "Follow who does what, from appointment to information model delivery."),
      s("read", "/doc-guides/bep-post", 30, "The post-appointment BEP", "Find the federation strategy, methods and procedures you must coordinate to."),
      s("read", "/doc-guides/mrm", 20, "Model responsibility matrix", "Know who models each element and to what level at each milestone."),
      s("read", "/hubs/loin", 40, "Level of information need", "Check models against what each milestone actually requires."),
      s("tool", "/ai-tools/clash", 20, "Build a clash matrix", "Set discipline pairs, tolerances and priorities before running tests."),
      s("tool", "/model-tools/ifc", 30, "Analyse IFC models against requirements", "Check federated IFC models for level of information need and IDS rules."),
      s("tool", "/bim-tools/ids", 30, "Write model checks as IDS", "Turn requirements into machine-readable checks that every task team can run."),
      s("tool", "/model-tools/qaqc", 20, "Grade models with the QA/QC checker", "Compare model quality across disciplines before a coordination meeting."),
      s("tool", "/bim-tools/bcf", 20, "Manage issues in BCF", "Raise, assign and close coordination issues with viewpoints."),
      s("read", "/doc-guides/qa-checklist", 20, "Quality check before sharing", "Apply a consistent checklist before information moves from WIP to Shared."),
      s("read", "/parts/19650-4/overview", 30, "Information exchange reviews", "Learn how exchanges are reviewed and accepted or rejected."),
      s("quiz", "/parts/19650-4/quiz", 10, "Part 4 quiz", "Test your understanding of exchange reviews."),
      s("quiz", "/learn", 25, "Part 2 mock exam", "Sit the timed Part 2 mock exam and review your weak topics."),
    ],
  },
  {
    id: "bim-manager", role: "BIM manager / information manager", weeks: 8,
    title: "Leading information management on a delivery team",
    summary: "Respond to EIR, write the BEP, build the delivery plans, manage risk and lead the team from appointment to handover.",
    steps: [
      s("read", "/workflow/roles/bim-manager", 15, "The BIM manager role", "See what you own and approve at each stage of the project."),
      s("read", "/workflow/roles/lap-im", 15, "The delivery team information manager", "Understand the information management function on the lead appointed party's side."),
      s("read", "/workflow/project", 30, "The project workflow", "Walk the ten stages from need to operation with their gates and documents."),
      s("read", "/parts/19650-2/clauses", 45, "Part 2 clauses and checklist", "Go through the delivery requirements clause by clause."),
      s("read", "/doc-guides/eir", 30, "Read the EIR like a bidder", "Find the requirements, gaps and risks you must answer in the tender."),
      s("read", "/doc-guides/bep-pre", 30, "Write the pre-appointment BEP", "Set out your team, strategy and proposed methods to win the appointment."),
      s("read", "/doc-guides/capability", 20, "Capability and capacity assessment", "Evidence that each task team can deliver what the EIR asks."),
      s("tool", "/ai-tools/plans", 30, "Generate TIDPs and the MIDP", "Build the delivery plans with names, dependencies and milestones."),
      s("read", "/doc-guides/risk-register", 20, "Information delivery risk register", "Record risks to information delivery with owners and treatment."),
      s("tool", "/ai-tools/review", 25, "Check the BEP against the EIR", "Find requirements your BEP does not yet answer."),
      s("read", "/workflow/matrix", 20, "Roles by stage", "Agree who is responsible and accountable at each stage."),
      s("read", "/parts/19650-5/overview", 30, "Security-minded information management", "Know when a security-minded approach applies and what it changes."),
      s("read", "/doc-guides/handover-strategy", 20, "Plan the handover", "Agree how and when information will transfer into the AIM."),
      s("read", "/hubs/implementation", 40, "BIM implementation best practices", "Build the people, process and technology around your projects."),
      s("quiz", "/parts/19650-2/quiz", 10, "Part 2 quiz", "Check your grasp of the delivery process."),
      s("quiz", "/learn", 40, "Mock exam: all parts", "Sit the all-parts mock exam and focus on your weakest topic."),
    ],
  },
  {
    id: "client", role: "Client / appointing party", weeks: 6,
    title: "Setting requirements as the appointing party",
    summary: "Define what information you need and why, set up the project's standards and CDE, and accept information you can use in operation.",
    steps: [
      s("read", "/workflow/roles/client", 15, "The client role", "See the decisions and approvals the appointing party owns."),
      s("read", "/workflow/roles/client-im", 15, "The client information manager", "Understand who carries out the information management function for you."),
      s("read", "/parts/19650-1/overview", 30, "ISO 19650 concepts", "Learn the requirements hierarchy and the information models."),
      s("read", "/doc-guides/oir", 25, "Organisational information requirements", "Start from what your organisation needs to run its assets and business."),
      s("read", "/doc-guides/air", 25, "Asset information requirements", "Define the asset data operations will rely on."),
      s("read", "/doc-guides/eir", 30, "Exchange information requirements", "Write what each appointment must deliver, when and in what form."),
      s("read", "/doc-guides/info-standard", 20, "Project information standard", "Set naming, codes and formats every delivery team must follow."),
      s("read", "/doc-guides/cde-procedure", 20, "CDE procedure", "Decide how information moves through the CDE and who approves it."),
      s("read", "/doc-guides/security-triage", 20, "Security triage", "Decide whether a security-minded approach is needed before tender."),
      s("tool", "/ai-tools/generate", 30, "Draft your EIR with the document generator", "Turn your requirements into a first draft you can review."),
      s("read", "/parts/19650-3/overview", 30, "Information in the operational phase", "See how the AIM is kept current after handover."),
      s("read", "/hubs/cobie", 40, "COBie practical guide", "Know what structured handover data to ask for and when."),
      s("tool", "/tools/maturity", 20, "Assess your organisation's maturity", "Find the gaps to close before you ask suppliers to work this way."),
      s("read", "/learn/adoption", 30, "Implementation guide", "Plan how to adopt ISO 19650 across your organisation."),
      s("quiz", "/parts/19650-3/quiz", 10, "Part 3 quiz", "Check your understanding of the operational phase."),
    ],
  },
  {
    id: "ai-governance", role: "AI governance lead", weeks: 5,
    title: "Governing AI in BIM with ISO/IEC 42001",
    summary: "Set up an AI management system for AI used in design and information management: policy, risk, impact, controls and oversight.",
    steps: [
      s("read", "/knowledge/iso42001/library/0", 45, "ISO/IEC 42001 clauses 4 to 10", "Understand what the management system must contain."),
      s("read", "/knowledge/iso42001/library/1", 40, "Annex A controls", "See the reference controls you will select and justify."),
      s("read", "/knowledge/iso42001/library/3", 15, "AI glossary", "Use consistent AI terms in policies and assessments."),
      s("read", "/knowledge/iso42001/library/2", 30, "AI in BIM", "See where AI is used in design and information management and what can go wrong."),
      s("tool", "/knowledge/iso42001/templates", 40, "AI management system templates", "Start your AI policy, risk assessment and impact assessment from templates."),
      s("read", "/hubs/mcp", 30, "Connecting AI to BIM tools", "Understand how AI assistants reach models and the CDE, and the security choices involved."),
      s("tool", "/ai-tools/mcp", 20, "Review an AI connection set-up", "See the permissions and data an AI connection would have."),
      s("read", "/parts/19650-5/overview", 30, "Security-minded information management", "Align AI data use with the project's security approach."),
      s("read", "/workflow/roles/security", 15, "The security lead role", "Agree how AI governance and information security work together."),
      s("read", "/learn/guides", 30, "Best-practice guides", "Pick up practical guidance you can share with project teams."),
      s("read", "/knowledge/iso42001/references", 15, "ISO/IEC 42001 references", "Find related standards and guidance for deeper study."),
      s("quiz", "/learn", 20, "AI management practice questions", "Practise the AI management (42001) question set."),
    ],
  },
];

export const pathById = (id: string) => LEARNING_PATHS.find((p) => p.id === id);
export const pathMinutes = (p: LearningPath) => p.steps.reduce((a, x) => a + x.minutes, 0);
