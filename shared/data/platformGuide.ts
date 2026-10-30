// Platform guide: what every sidebar section is for, where to start, and how the pieces connect.
// Content is keyed to the page registry (client/src/shell/nav.ts) by page key and group name, so the
// guide page lists the real pages automatically and platformGuide.test.ts fails when the menu changes.

export interface SectionGuide {
  /** Section id from nav.ts SECTIONS, plus "projects" (built from the user's projects). */
  id: string;
  /** Same as the sidebar label. */
  title: string;
  purpose: string;
  whenToUse: string;
  /** Page key of the best first page in this section. */
  startWith: string;
  /** Why the groups appear in this order. */
  order: string;
  /** One sentence per group, keyed by the group name used in nav.ts. */
  groups: Record<string, string>;
}

export interface GuideLink { pageKey: string; href?: string; label?: string }
export interface GuideStep { id: string; title: string; why: string; pageKey: string; href?: string; doneWhen: string }
export interface WeekDay { day: number; title: string; focus: string; links: GuideLink[] }
export interface FlowNode { pageKey: string; note: string; href?: string }
export interface GuideFlow { id: string; title: string; summary: string; nodes: FlowNode[] }
export interface GuideFaq { q: string; a: string; links?: GuideLink[] }
export interface RoleRoute {
  id: string;
  title: string;
  summary: string;
  /** Learning path id (shared/data/learningPaths.ts). */
  pathId: string;
  /** Workflow role profile id (shared/data/workflow/roles.ts), if there is one. */
  roleProfile?: string;
  /** Sidebar "View by role" id (client/src/shell/roles.ts). */
  sidebarRole?: string;
  /** Pages this role uses first. */
  firstPages: string[];
}

/** In sidebar order. */
export const SECTION_GUIDE: SectionGuide[] = [
  {
    id: "home", title: "My work",
    purpose: "Your own starting point: today's work, recent pages and your projects in one place. Nothing here needs setting up except a saved delivery plan for My Day.",
    whenToUse: "Every morning, and whenever you want to get back to where you left off.",
    startWith: "r.home",
    order: "Home first because it is where you land, then this guide, then the two dashboards that fill up as you use the platform.",
    groups: {
      "My work": "Home, this guide, My Day (what is due from your delivery plan) and Portfolio (health across your projects).",
    },
  },
  {
    id: "projects", title: "Projects",
    purpose: "The records of one real project: its CDE, documents, delivery plan, issues, team and gates, shared with everyone you invite. Pick the project at the top of the section; every page below opens inside it.",
    whenToUse: "Once you have created a project and want to store information your team works on together.",
    startWith: "p.summary",
    order: "The groups follow the ISO 19650-2 sequence: appoint and plan, produce and share information in the CDE, coordinate models, then control quality and hand over. Team pages sit last because you set them up once.",
    groups: {
      "Overview": "The project summary, the activity log and the two AI helpers that answer from the project's own records.",
      "Appointment & planning": "Everything agreed before production starts: appointment review, information uses, teams, responsibilities, level of information need and the MIDP/TIDP.",
      "Information (CDE)": "The common data environment: controlled documents with reviews and revisions, and files moving through WIP, Shared, Published and Archived.",
      "Model & coordination": "Model validation, QA/QC reviews, BCF issues, the clash matrix, 4D planning and asset tags.",
      "Control & handover": "Quality checks, requirements traceability, stage gates, risks, health and safety information and the PIM to AIM handover.",
      "Team": "Meetings and progress reports, automations, team training, members and project settings.",
    },
  },
  {
    id: "documents", title: "Documents & delivery",
    purpose: "Tools to understand, write and check ISO 19650 documents without needing a project. Each document is explained, generated from your project data and checked before you issue it.",
    whenToUse: "When you need to write an EIR, BEP, TIDP, MIDP or any other document, or check names and codes before sharing.",
    startWith: "w.project",
    order: "The numbered steps follow the order work is done: understand the workflow and roles, enter project data once, create documents, check them, then reach for templates and samples.",
    groups: {
      "Workflow & roles": "The ten project stages, every document by stage, how files move through the CDE, who does what, and a guide to every ISO 19650 document.",
      "Project data & setup": "Enter the project's mandatory facts once and every generator reuses them; the setup wizard tells you which documents and workflow you need.",
      "Create": "Generators for documents, delivery plans, risk registers, clash matrices, meeting minutes and transmittals.",
      "Check": "Review and compare documents, check file names in bulk, build a single container name and look up status and suitability codes.",
      "Templates & samples": "ISO 19650 and ISO/IEC 42001 templates, structured sample documents and the curated downloads library.",
    },
  },
  {
    id: "models", title: "Models & coordination",
    purpose: "Checks you run on model files and the issue tools you coordinate with. Files are checked in the page; you do not need a project to try them.",
    whenToUse: "Before you share a model, before a coordination meeting and when you write model requirements.",
    startWith: "m.revit",
    order: "Check your own models first, then coordinate with others through IDS requirements and BCF issues.",
    groups: {
      "Check models": "Revit project health, graded IFC QA/QC, the IFC hub for LOIN and IDS checks, and the COBie data checker.",
      "Coordination": "Write model requirements as an IDS file and open, edit and convert BCF issue files.",
    },
  },
  {
    id: "ai", title: "AI",
    purpose: "The AI studio: tools that write and check information for you, each showing its sources and a result you can edit. It also covers connecting AI to authoring software and governing AI under ISO/IEC 42001.",
    whenToUse: "When you want a first draft fast, a compliance matrix, clash grouping or an audit, once your administrator has switched AI on.",
    startWith: "x.eirwriter",
    order: "Studio tools first, in project order from EIR to audit and programme; then connecting AI to your software; then the governance standard that applies to using AI at all.",
    groups: {
      "AI studio": "EIR and BEP writers, EIR to BEP compliance, model QA from IDS, clash triage, sheet QA, ISO 19650 audit, the project agent and plans from a programme.",
      "Connect AI to BIM software": "How to connect Claude or ChatGPT to Revit, AutoCAD, Navisworks and Civil 3D, what MCP is, and a setup tool.",
      "AI governance": "Everything on ISO/IEC 42001 in one place: the learning hub, clauses 4 to 10, Annex A controls, AI in BIM and the glossary.",
    },
  },
  {
    id: "learn", title: "ISO standards & learning",
    purpose: "The standards themselves, explained from beginner to expert, with in-depth topic hubs, practice and references. Everything here works without a project or AI.",
    whenToUse: "When you meet a term, clause or process you do not know, and for structured learning by role.",
    startWith: "s.paths",
    order: "Start here gives you a route; then the six parts of ISO 19650, the essentials you look up daily, the in-depth topic hubs, ISO/IEC 42001 and finally the references.",
    groups: {
      "Start here": "Learning paths by role, best-practice guides, videos, the implementation guide and practice quizzes.",
      "ISO 19650 parts": "Parts 1 to 6, each from overview to clauses, examples, Q&A and a quiz, plus the 2026 revision status.",
      "ISO 19650 essentials": "The parts at a glance, the delivery process, CDE and status codes, glossaries and the information uses library.",
      "Topic hubs": "In-depth guides on appointment, LOIN, COBie, Revit, CDE, BCF, handover, infrastructure and more.",
      "References": "The published sources behind the ISO 19650 and ISO/IEC 42001 content.",
    },
  },
  {
    id: "resources", title: "Resources",
    purpose: "Calculators for fees, carbon and readiness, plus client standards, news and careers. Use them for proposals, assessments and keeping up to date.",
    whenToUse: "When you prepare a fee or proposal, assess maturity or readiness, or look for client standards and news.",
    startWith: "r.maturity",
    order: "Calculators first because they produce numbers for your work; industry and career pages after.",
    groups: {
      "Calculators": "BIM fee estimate, embodied carbon (6D), BIM maturity, digital twin readiness and scan-to-BIM readiness.",
      "Industry & careers": "Client information standards, BIM and ISO 19650 news, your opt-in talent profile and the recruiter talent pool.",
    },
  },
];

/** Day one, in order: nothing depends on a later step. */
export const FIRST_DAY: GuideStep[] = [
  { id: "guide", title: "Read the Start here tab of this guide", why: "Two minutes on the sidebar saves an hour of searching later.", pageKey: "r.guide", href: "/guide/start", doneWhen: "You know what search, Favourites, View by role and the sections do." },
  { id: "role", title: "Set your role", why: "Your role adds the tools you use most to Favourites and lets you filter the menu.", pageKey: "r.home", doneWhen: "Your role shows in the account menu and Favourites is no longer empty." },
  { id: "data", title: "Enter Project data once", why: "Every generator, the naming checker and the Revit check reuse it, so you never type the project code twice.", pageKey: "ai.projectdata", doneWhen: "Project code, name, parties and naming fields are filled in." },
  { id: "project", title: "Create a project", why: "A project holds your CDE, documents, delivery plan, issues and team on the server.", pageKey: "r.home", href: "/projects/new", doneWhen: "The project appears in the Projects section and its summary opens." },
  { id: "workflow", title: "Open the project workflow", why: "The ten stages show what happens when, who does it and which documents each stage needs.", pageKey: "w.project", doneWhen: "You have clicked through the ten stages and know which one your project is in." },
  { id: "docguide", title: "Read the document guide for the EIR", why: "The EIR drives the BEP, the plans and the checks; the guide explains every section and how to check it.", pageKey: "w.docguides", href: "/doc-guides/eir", doneWhen: "You know who writes the EIR, what goes in each section and what to check." },
  { id: "naming", title: "Try the file naming checker", why: "Naming errors are the most common reason information is rejected, and the cheapest to fix.", pageKey: "m.naming", doneWhen: "You have pasted a list of file names and read the results." },
  { id: "plan", title: "Save a delivery plan", why: "My Day, the Today card on Home and the naming checker read the TIDP or MIDP saved by the generator.", pageKey: "ai.plans", doneWhen: "A TIDP or MIDP is saved and My Day shows what is due." },
  { id: "learn", title: "Open the six ISO 19650 parts", why: "Each part has an overview, clauses, examples and a quiz; Part 1 and Part 2 cover most daily work.", pageKey: "s.19650.parts", doneWhen: "You have read the Part 1 overview." },
  { id: "favs", title: "Pin your favourites", why: "Pin the pages you will use every week so they sit at the top of the sidebar.", pageKey: "r.home", doneWhen: "At least three pages you use are in Favourites." },
];

export const FIRST_WEEK: WeekDay[] = [
  { day: 1, title: "Orientation", focus: "Learn the layout, set your role, enter project data and create a project.", links: [{ pageKey: "r.guide", href: "/guide/first-day" }, { pageKey: "w.project" }, { pageKey: "ai.projectdata" }, { pageKey: "s.19650.part1" }] },
  { day: 2, title: "Requirements", focus: "Understand the EIR and how a client sets requirements, then draft one.", links: [{ pageKey: "w.docguides", href: "/doc-guides/eir" }, { pageKey: "s.hub.appointment" }, { pageKey: "x.eirwriter" }, { pageKey: "t.lib19650" }] },
  { day: 3, title: "Planning and naming", focus: "Build a delivery plan, check names against it and see what is due.", links: [{ pageKey: "ai.plans" }, { pageKey: "s.naming" }, { pageKey: "m.naming" }, { pageKey: "r.myday" }] },
  { day: 4, title: "Models and coordination", focus: "Check a model, write requirements as IDS and manage issues as BCF.", links: [{ pageKey: "m.revit" }, { pageKey: "m.ifc" }, { pageKey: "b.ids" }, { pageKey: "b.bcf" }] },
  { day: 5, title: "Quality and your route", focus: "Review a document, look at your project's quality hub and choose your learning path.", links: [{ pageKey: "ai.review" }, { pageKey: "p.quality" }, { pageKey: "s.learn" }, { pageKey: "s.paths" }] },
];

export const FLOWS: GuideFlow[] = [
  {
    id: "enter-once", title: "Enter once, reuse everywhere",
    summary: "Project data you type once fills every document, and the guides and review tools check what you produced.",
    nodes: [
      { pageKey: "ai.projectdata", note: "Code, parties, naming fields" },
      { pageKey: "ai.generate", note: "Draft EIR, BEP and more" },
      { pageKey: "t.lib19650", note: "Or fill a template" },
      { pageKey: "w.docguides", note: "Check each section" },
      { pageKey: "ai.review", note: "Review and compare" },
    ],
  },
  {
    id: "plan-day", title: "From delivery plan to your day",
    summary: "The TIDP or MIDP saved by the generator drives My Day, the Today card on Home and the naming and sheet checks.",
    nodes: [
      { pageKey: "ai.plans", note: "Save a TIDP or MIDP" },
      { pageKey: "r.myday", note: "What is due and overdue" },
      { pageKey: "r.home", note: "Today card" },
      { pageKey: "m.naming", note: "Names checked against the plan" },
      { pageKey: "x.sheetqa", note: "Title blocks against the plan" },
    ],
  },
  {
    id: "model-issues", title: "From model check to project issues",
    summary: "Check a model, turn requirements into IDS, and send failures as BCF issues into the project.",
    nodes: [
      { pageKey: "m.revit", note: "Model health" },
      { pageKey: "b.ids", note: "Requirements as IDS" },
      { pageKey: "x.modelqa", note: "IFC checked against IDS" },
      { pageKey: "b.bcf", note: "Issues as BCF" },
      { pageKey: "p.issues", note: "Tracked in the project" },
    ],
  },
  {
    id: "clash", title: "From clash report to meeting minutes",
    summary: "Set the clash rules, group the results by root cause, assign them as BCF and close them in the coordination meeting.",
    nodes: [
      { pageKey: "ai.clash", note: "Pairs and tolerances" },
      { pageKey: "x.clash", note: "Group by root cause" },
      { pageKey: "b.bcf", note: "Assign as BCF" },
      { pageKey: "p.issues", note: "Project issues" },
      { pageKey: "b.minutes", note: "Minutes and actions" },
    ],
  },
  {
    id: "eir-bep", title: "From EIR to a compliant BEP",
    summary: "The client's requirements become a BEP that answers them point by point, checked requirement by requirement.",
    nodes: [
      { pageKey: "x.eirwriter", note: "EIR from a brief" },
      { pageKey: "x.bepwriter", note: "BEP that answers it" },
      { pageKey: "x.compliance", note: "Gaps and wording" },
      { pageKey: "p.trace", note: "Traced to delivery" },
    ],
  },
  {
    id: "learn", title: "From the standard to your learning route",
    summary: "Read the parts, go deeper in the topic hubs, test yourself and follow the path for your role.",
    nodes: [
      { pageKey: "s.19650.parts", note: "Parts 1 to 6" },
      { pageKey: "s.hubs", note: "In-depth topics" },
      { pageKey: "s.learn", note: "Quizzes and mock exam" },
      { pageKey: "s.paths", note: "Route for your role" },
    ],
  },
];

export const FAQ: GuideFaq[] = [
  { q: "Where do I start?", a: "Follow the First day tab of this guide, in order. Home also shows a short Get started card until your role, first project and first EIR are done.", links: [{ pageKey: "r.guide", href: "/guide/first-day" }, { pageKey: "r.home" }] },
  { q: "Do I need a project to use the tools?", a: "No. Everything under Documents & delivery, Models & coordination, AI, ISO standards & learning and Resources works without a project. You need a project for the pages in the Projects section: CDE files, controlled documents, issues, the project planner, team and gates.", links: [{ pageKey: "r.home", href: "/projects/new", label: "Create a project" }] },
  { q: "Where is my data stored: browser or server?", a: "Projects and everything inside them, your profile, role and favourites are stored on the server and shared with your project team. Project data (enter once), the plan saved by the TIDP / MIDP generator, Revit check rules, learning progress, checklist ticks and sidebar preferences stay in this browser only: they do not follow you to another device and are lost if you clear site data.", links: [{ pageKey: "ai.projectdata" }, { pageKey: "ai.plans" }] },
  { q: "Which tools use AI, and does it cost anything?", a: "Pages marked (AI), the AI studio and the Generate with AI buttons in the generators use AI. Your administrator must add a Claude API key to the server first; until then these pages say so and everything else works. Each AI request counts towards your plan's monthly AI allowance, shown on Plan & billing.", links: [{ pageKey: "x.eirwriter" }] },
  { q: "Can I work without AI?", a: "Yes. Workflows, document guides, templates, the naming checker, model checks, IDS and BCF tools, calculators and all learning content work without AI. The delivery plan generator has a standard starter list that needs no AI.", links: [{ pageKey: "ai.plans" }, { pageKey: "m.naming" }] },
  { q: "How do I switch to Arabic?", a: "Open My profile from the account menu and choose Arabic under Email & language, or pick the language on the sign-in page. The layout switches to right to left; any text not yet translated stays in English.", links: [{ pageKey: "r.profile" }] },
  { q: "What is a favourite?", a: "A page pinned to the Favourites list at the top of the sidebar. Use the Add to favourites button at the top right of any menu page to pin or unpin it. Favourites are saved in your profile, so they follow you to any browser.", links: [] },
  { q: "How do roles filter the menu?", a: "Set my role (account menu or Home) saves your BIM role and adds its tools to Favourites. The View by role chips in the sidebar only change what the menu shows; choose All to see every page again.", links: [] },
  { q: "How do I find a page fast?", a: "Press Ctrl+K (Cmd+K on a Mac) to search every page, template and project by name. The search box at the top of the sidebar filters the menu. Ctrl+\\ hides or shows the sidebar.", links: [] },
  { q: "What is the difference between Documents & delivery and the Projects section?", a: "Documents & delivery holds tools and guides you can use any time, without saving anything for a team. The Projects section holds one project's records on the server: controlled documents, files, plan, issues and team.", links: [{ pageKey: "w.project" }, { pageKey: "p.summary" }] },
  { q: "Why is My Day empty?", a: "My Day reads the TIDP or MIDP saved by the TIDP / MIDP / MPDT generator in this browser, plus items assigned to you in projects. Save a plan in the generator and it fills up.", links: [{ pageKey: "ai.plans" }, { pageKey: "r.myday" }] },
  { q: "Which delivery plan tool should I use?", a: "Use the TIDP / MIDP / MPDT generator to build and save a plan that feeds My Day and the checks. Use TIDP / MIDP from programme to turn an MS Project or P6 programme into a plan. Use the project's MIDP / TIDP planner to keep the plan with the project for the whole team.", links: [{ pageKey: "ai.plans" }, { pageKey: "x.programme" }, { pageKey: "p.plan" }] },
  { q: "Where are the templates?", a: "Under Documents & delivery, Templates & samples: the ISO 19650 and ISO/IEC 42001 template libraries, sample documents and downloads. Every template also has its own page you can find with Ctrl+K.", links: [{ pageKey: "t.lib19650" }, { pageKey: "r.samples" }] },
  { q: "Where do I learn ISO 19650 from scratch?", a: "Pick the learning path for your role, then work through the parts hub from Part 1. Use the glossary whenever you meet an acronym.", links: [{ pageKey: "s.paths" }, { pageKey: "s.19650.parts" }, { pageKey: "s.glossary" }] },
  { q: "How do I get help?", a: "Use Help & support at the bottom of the sidebar to ask a question or report a problem; replies appear there. Ask AI at the top of the sidebar searches the built-in ISO knowledge base.", links: [{ pageKey: "r.support" }] },
];

/** Routes by role: each links to its learning path and its role profile. */
export const ROLE_ROUTES: RoleRoute[] = [
  { id: "modeller", title: "BIM modeller", summary: "Model to the agreed level of information need, name files correctly and share clean, checked models.", pathId: "modeller", roleProfile: "author", sidebarRole: "modeller", firstPages: ["m.naming", "m.revit", "s.hub.loin", "b.bcf"] },
  { id: "coordinator", title: "BIM coordinator", summary: "Federate models, run clash and model checks and manage issues through to the coordination meeting.", pathId: "coordinator", roleProfile: "coordinator", sidebarRole: "coordinator", firstPages: ["ai.clash", "m.ifc", "b.ids", "x.clash"] },
  { id: "bim-manager", title: "BIM manager / information manager", summary: "Write and maintain the BEP and delivery plans, run the CDE and keep the project compliant.", pathId: "bim-manager", roleProfile: "bim-manager", sidebarRole: "manager", firstPages: ["ai.projectdata", "x.bepwriter", "ai.plans", "p.quality"] },
  { id: "client", title: "Client / appointing party", summary: "Set clear requirements, appoint the delivery team and accept the information you receive.", pathId: "client", roleProfile: "client", sidebarRole: "section-head", firstPages: ["x.eirwriter", "s.hub.appointment", "x.compliance", "p.handover"] },
  { id: "ai-governance", title: "AI governance lead", summary: "Run an ISO/IEC 42001 AI management system for how your organization uses AI in BIM.", pathId: "ai-governance", sidebarRole: "ai-lead", firstPages: ["s.hub.iso42001", "s.42001.clauses", "s.42001.annex", "t.lib42001"] },
];

/** Every page key the guide refers to. */
export function guidePageKeys(): string[] {
  const keys = [
    ...SECTION_GUIDE.map((s) => s.startWith),
    ...FIRST_DAY.map((s) => s.pageKey),
    ...FIRST_WEEK.flatMap((d) => d.links.map((l) => l.pageKey)),
    ...FLOWS.flatMap((f) => f.nodes.map((n) => n.pageKey)),
    ...FAQ.flatMap((f) => (f.links ?? []).map((l) => l.pageKey)),
    ...ROLE_ROUTES.flatMap((r) => r.firstPages),
  ];
  return [...new Set(keys)];
}

/** Page keys used by the guide that are not in the page registry (pass ALL_PAGES from nav.ts). Empty when all resolve. */
export function unknownGuideKeys(pages: { key: string }[]): string[] {
  const known = new Set(pages.map((p) => p.key));
  return guidePageKeys().filter((k) => !known.has(k));
}
