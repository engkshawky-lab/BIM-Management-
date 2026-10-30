import { templates } from "../../../shared/data/templates";
import type { IconName } from "./icons";

// Single registry of every page. The sidebar, breadcrumbs, Ctrl+K search, favourites, roles and
// "recently visited" all read from here, so a page is defined exactly once.

export interface NavItem {
  key: string;
  label: string;
  /** Global pages: absolute hash path. Project pages: path relative to /projects/:id/. */
  path: string;
  scope: "global" | "project";
  icon: IconName;
  group: string;
  hint?: string;
}

const g = (key: string, label: string, path: string, icon: IconName, group: string, hint?: string): NavItem => ({ key, label, path, scope: "global", icon, group, hint });
const p = (key: string, label: string, path: string, icon: IconName, group: string, hint?: string): NavItem => ({ key, label, path, scope: "project", icon, group, hint });

// Projects follow the ISO 19650-2 sequence: appointment and planning, then producing and sharing information,
// then coordination, control and handover.
export const PROJECT_PAGES: NavItem[] = [
  p("p.summary", "Summary", "overview", "grid", "Overview"),
  p("p.activity", "Activity", "activity", "activity", "Overview"),
  p("p.assistant", "Project assistant (AI)", "assistant", "sparkles", "Overview", "Ask questions answered from project records"),
  p("p.notebook", "Research notebook (AI)", "notebook", "book", "Overview", "Summarise and compare sources with citations"),
  p("p.contract", "Appointment review (AI)", "contract", "file", "Appointment & planning", "Check contracts for ISO 19650 obligations"),
  p("p.uses", "Information uses", "delivery/uses", "target", "Appointment & planning", "Why information is produced — drives LOIN & MIDP"),
  p("p.setup", "Teams & milestones", "delivery/setup", "users", "Appointment & planning"),
  p("p.raci", "Responsibility matrix", "delivery/responsibility", "table", "Appointment & planning", "RACI per task team"),
  p("p.loin", "Level of information need", "delivery/loin", "layers", "Appointment & planning", "LOIN per element & milestone"),
  p("p.mrm", "Model responsibility (MRM)", "delivery/mrm", "grid", "Appointment & planning", "Who models each element, LOD per milestone"),
  p("p.plan", "MIDP / TIDP planner", "delivery/plan", "calendar", "Appointment & planning", "Information containers, Gantt, change impact"),
  p("p.documents", "Documents", "documents", "file", "Information (CDE)", "Controlled documents, reviews, revisions"),
  p("p.files", "Files", "files", "folder", "Information (CDE)", "WIP · Shared · Published · Archived"),
  p("p.validation", "Model validation", "validation", "check", "Model & coordination", "IFC, COBie, LOIN & IDS checks"),
  p("p.reviews", "Model QA/QC reviews", "reviews", "shield", "Model & coordination", "Graded discipline checklists A–D"),
  p("p.issues", "Issues (BCF)", "coordination/issues", "flag", "Model & coordination"),
  p("p.clash", "Clash matrix", "coordination/clash", "grid", "Model & coordination"),
  p("p.4d", "4D planning", "4d", "calendar", "Model & coordination", "Link programme to model; planned vs actual by date"),
  p("p.tags", "Asset tags", "tags", "check", "Model & coordination", "Build and check asset tags"),
  p("p.quality", "Quality hub", "quality", "shield", "Control & handover", "Document, plan and document-set checks"),
  p("p.trace", "Requirements traceability", "traceability", "flow", "Control & handover", "EIR → BEP → MIDP → delivered"),
  p("p.gates", "Process gates", "workflow", "flow", "Control & handover", "ISO 19650-2 / 42001 stage gates"),
  p("p.risks", "Risk register", "delivery/risks", "alert", "Control & handover"),
  p("p.hs", "Health & safety information", "delivery/hs", "alert", "Control & handover", "ISO 19650-6 hazards and residual risks"),
  p("p.handover", "Handover", "delivery/handover", "handshake", "Control & handover", "PIM → AIM checklist"),
  p("p.meetings", "Meetings & progress report", "meetings", "calendar", "Team", "Agendas, minutes, actions, progress report"),
  p("p.automations", "Automations", "automations", "sparkles", "Team", "Scheduled chasers and quality reviews"),
  p("p.training", "Team training", "training", "book", "Team", "Assign courses and track completion"),
  p("p.team", "Team", "team", "users", "Team"),
  p("p.settings", "Project settings", "settings", "settings", "Team"),
];

/** Your own work across projects. */
export const HOME_PAGES: NavItem[] = [
  g("r.home", "Home", "/", "home", "My work", "Today, recent pages and your projects"),
  g("r.myday", "My Day", "/my-day", "calendar", "My work", "What is due from your delivery plan and what is waiting on you"),
  g("r.portfolio", "Portfolio", "/portfolio", "grid", "My work", "Health across your projects"),
];
/** Daily tools, offered on Home. */
export const DAILY_TOOLS = ["m.naming", "m.revit", "ai.plans"];

/** Each template has its own page; the sidebar links to the two template libraries and search finds the rest. */
export const TEMPLATE_PAGES: NavItem[] = templates.map((t) =>
  g(`t.${t.id}`, `${t.code} — ${t.title}`, `/knowledge/${t.standard}/templates/${t.id}`, "file", "Templates & samples", t.purpose));

/** Documents and delivery, in the order work is done: project data and setup, create, check, then templates. */
export const DOCUMENT_PAGES: NavItem[] = [
  g("w.project", "Project workflow", "/workflow/project", "flow", "Workflow & roles", "Ten stages from need to operation: steps, gates, documents"),
  g("w.documents", "Document workflow", "/workflow/documents", "files", "Workflow & roles", "How files and documents move through the CDE, step by step"),
  g("w.matrix", "Roles by stage", "/workflow/matrix", "table", "Workflow & roles", "Who is responsible, accountable, consulted and informed at each stage"),
  g("w.roles", "Role profiles", "/workflow/roles", "users", "Workflow & roles", "BIM manager, information manager, BIM coordinator and every other role"),
  g("w.docguides", "Document guides", "/doc-guides", "book", "Workflow & roles", "Every ISO 19650 document explained: sections, how to create it, checks"),
  g("ai.projectdata", "Project data (enter once)", "/project-data", "table", "Project data & setup", "Mandatory inputs every document reuses"),
  g("r.wizard", "Setup wizard", "/wizard", "sparkles", "Project data & setup", "Answer a few questions; get the documents and workflow you need"),
  g("ai.generate", "Document generator", "/ai-tools/generate", "sparkles", "Create", "EIR, AIR, PIR, OIR, BEP or any custom template"),
  g("ai.plans", "TIDP / MIDP / MPDT generator", "/ai-tools/plans", "calendar", "Create", "Delivery plan tables with naming, checks and Excel export"),
  g("ai.risks", "Risk register generator", "/ai-tools/risks", "sparkles", "Create", "Information delivery risks with owners and treatment"),
  g("ai.clash", "Clash matrix builder", "/ai-tools/clash", "sparkles", "Create", "Discipline pairs, tolerances and priorities"),
  g("b.minutes", "Meeting minutes (AI)", "/bim-tools/minutes", "calendar", "Create", "Notes or a transcript into minutes, decisions and actions"),
  g("b.comms", "Transmittals & letters", "/bim-tools/comms", "file", "Create", "Transmittals from file names; AI drafts RFIs and notices"),
  g("ai.review", "Document review & compare", "/ai-tools/review", "sparkles", "Check", "Review EIR/BEP/MIDP; EIR ↔ BEP check; BEP versions"),
  g("m.naming", "File naming checker", "/tools/naming-check", "tag", "Check", "Check hundreds of file names at once"),
  g("s.naming", "Naming & status code tool", "/knowledge/iso19650/naming", "tag", "Check", "Build one container name and look up status codes"),
  g("ai.suitability", "Suitability code hub", "/ai-tools/suitability", "sparkles", "Check", "Status and suitability codes and when to use them"),
  g("t.lib19650", "ISO 19650 templates", "/knowledge/iso19650/templates", "files", "Templates & samples", "EIR, BEP, TIDP, MIDP and every other ISO 19650 document"),
  g("t.lib42001", "ISO/IEC 42001 templates", "/knowledge/iso42001/templates", "files", "Templates & samples", "AI policy, risk, impact assessment and the other AIMS documents"),
  g("r.samples", "Sample documents", "/samples", "file", "Templates & samples", "Structured Word samples for EIR, AIR, OIR, BEP and more"),
  g("r.downloads", "Downloads library", "/downloads", "library", "Templates & samples", "Templates, checklists and guides curated by administrators"),
];

/** Models: check them, then connect AI to the authoring tools. */
export const MODEL_PAGES: NavItem[] = [
  g("m.revit", "Revit project check", "/model-tools/revit", "check", "Check models", "Parameters, naming, sheets and model health against your rules"),
  g("m.qaqc", "QA/QC model checker", "/model-tools/qaqc", "check", "Check models", "Grade IFC models A–F, compare up to 10"),
  g("m.ifc", "IFC Hub", "/model-tools/ifc", "layers", "Check models", "Analyse IFC models, check LOIN/IDS, compare with your EIR"),
  g("ai.cobie", "COBie data checker", "/ai-tools/cobie", "sparkles", "Check models", "Sheets, required fields and handover readiness"),
  g("b.ids", "IDS builder", "/bim-tools/ids", "check", "Coordination", "Write model requirements as a buildingSMART IDS file"),
  g("b.bcf", "BCF studio", "/bim-tools/bcf", "flag", "Coordination", "Open, review, edit and convert BCF issue files"),
  g("ai.mcp", "Connect AI via MCP", "/ai-tools/mcp", "link", "Connect AI", "Connect Claude to Revit, IFC and CDE tools"),
];

/** Learn: where to start, the standard itself, the in-depth topic hubs (hubs index order), ISO/IEC 42001, references. */
export const LEARN_PAGES: NavItem[] = [
  g("s.learn", "Quizzes, mock exam, scenarios", "/learn", "sparkles", "Start here", "Practice questions, timed exam, skill profile"),
  g("s.guides", "Best-practice guides", "/learn/guides", "book", "Start here", "Practical guidance for modellers, coordinators and managers"),
  g("s.adoption", "Implementation guide", "/learn/adoption", "flow", "Start here", "Adopt ISO 19650 across your organization, step by step"),
  g("s.19650.parts", "All parts (1–6): learning hub", "/parts", "book", "ISO 19650 parts", "Beginner to expert, clause deep dives, checklists, Ask AI"),
  ...[1, 2, 3, 4, 5, 6].map((n) => g(`s.19650.part${n}`, `Part ${n}`, `/parts/19650-${n}`, "book", "ISO 19650 parts")),
  g("s.19650.revision", "2026 revision (draft): what is changing", "/hubs/revision-2026", "alert", "ISO 19650 parts", "Status of the Parts 1–3 revision, confirmed vs proposed changes, what to do now"),
  g("s.19650.summary", "Parts at a glance", "/knowledge/iso19650/library/0", "book", "ISO 19650 essentials"),
  g("s.19650.process", "Delivery process (19650-2)", "/knowledge/iso19650/library/1", "flow", "ISO 19650 essentials"),
  g("s.19650.cde", "CDE & status codes", "/knowledge/iso19650/library/2", "layers", "ISO 19650 essentials"),
  g("s.19650.glossary", "Glossary & acronyms", "/knowledge/iso19650/library/3", "text", "ISO 19650 essentials"),
  g("s.uses", "Information uses library", "/knowledge/iso19650/uses", "target", "ISO 19650 essentials"),
  g("s.hubs", "All topic hubs", "/hubs", "grid", "Topic hubs", "Every in-depth guide, grouped by theme"),
  g("s.hub.appointment", "Appointment process diagram", "/hubs/appointment", "flow", "Topic hubs", "Interactive ISO 19650-2 process: who does what, inputs, outputs"),
  g("s.hub.docroles", "Documents aligned with roles", "/hubs/documents-roles", "file", "Topic hubs", "Which party produces which document at each stage"),
  g("s.hub.loin", "LOD / LOI / LOIN hub", "/hubs/loin", "layers", "Topic hubs", "Level of information need, LOD 100–500, element library"),
  g("s.hub.cobie", "COBie practical guide", "/hubs/cobie", "table", "Topic hubs", "Sheets, timing, authoring, quality checks"),
  g("s.hub.revit", "Revit best practices", "/hubs/revit", "settings", "Topic hubs", "Setup, naming, parameters, IFC, advanced topics, MCP for Autodesk"),
  g("s.hub.mcp", "Connect AI to BIM tools (MCP)", "/hubs/mcp", "link", "Topic hubs", "What MCP is, Claude Desktop and Code, BIM servers, security"),
  g("s.hub.scan", "Scan to BIM", "/hubs/scan-to-bim", "layers", "Topic hubs", "Reality capture, accuracy, workflow, cost estimator"),
  g("s.hub.infra", "Infrastructure BIM & ISO 19650", "/hubs/infrastructure", "layers", "Topic hubs", "Roads, rail, bridges, utilities"),
  g("s.hub.dimensions", "BIM dimensions (4D–7D, net zero)", "/hubs/dimensions", "layers", "Topic hubs", "4D time, 5D cost, 6D carbon, 7D FM, net zero"),
  g("s.hub.implementation", "BIM implementation best practices", "/hubs/implementation", "flow", "Topic hubs", "Strategy, maturity, people, process, technology, KPIs"),
  g("s.42001.clauses", "Clauses 4–10", "/knowledge/iso42001/library/0", "book", "ISO/IEC 42001"),
  g("s.42001.annex", "Annex A controls", "/knowledge/iso42001/library/1", "shield", "ISO/IEC 42001"),
  g("s.42001.aibim", "AI in BIM", "/knowledge/iso42001/library/2", "sparkles", "ISO/IEC 42001"),
  g("s.42001.glossary", "Glossary", "/knowledge/iso42001/library/3", "text", "ISO/IEC 42001"),
  g("r.19650", "ISO 19650 references", "/knowledge/iso19650/references", "library", "References"),
  g("r.42001", "ISO/IEC 42001 references", "/knowledge/iso42001/references", "library", "References"),
];

export const RESOURCE_PAGES: NavItem[] = [
  g("r.fee", "BIM fee estimator", "/tools/fee", "table", "Calculators"),
  g("r.carbon", "Embodied carbon (6D)", "/tools/carbon", "layers", "Calculators"),
  g("r.maturity", "BIM maturity assessment", "/tools/maturity", "check", "Calculators"),
  g("r.dt", "Digital twin readiness", "/tools/dt", "check", "Calculators"),
  g("r.scan", "Scan-to-BIM readiness", "/tools/scan", "check", "Calculators"),
  g("r.standards", "Client standards", "/standards", "book", "Industry & careers", "Client information standards and requirements"),
  g("r.news", "BIM & ISO 19650 news", "/news", "activity", "Industry & careers", "AI-compiled news with relevance ratings"),
  g("r.talentme", "My talent profile", "/talent/me", "user", "Industry & careers", "Opt-in profile for recruiters"),
  g("r.talent", "Talent pool (recruiters)", "/talent", "users", "Industry & careers"),
];

/** Reached from the account menu and the Help link rather than the sidebar sections. */
export const ACCOUNT_PAGES: NavItem[] = [
  g("r.profile", "My profile", "/profile", "user", "Account"),
  g("r.support", "Help & support", "/support", "help", "Account", "Ask a question or report a problem; see replies"),
];

export const ALL_PAGES = [...PROJECT_PAGES, ...HOME_PAGES, ...DOCUMENT_PAGES, ...MODEL_PAGES, ...TEMPLATE_PAGES, ...LEARN_PAGES, ...RESOURCE_PAGES, ...ACCOUNT_PAGES];
export const pageByKey = (key: string) => ALL_PAGES.find((x) => x.key === key);

export interface NavSection { id: string; label: string; icon: IconName; items: NavItem[]; numbered?: boolean }
/** Sidebar sections, one open at a time. Projects sits after My work and is built from the user's projects. */
export const SECTIONS: NavSection[] = [
  { id: "home", label: "My work", icon: "home", items: HOME_PAGES },
  { id: "documents", label: "Documents & delivery", icon: "files", items: DOCUMENT_PAGES, numbered: true },
  { id: "models", label: "Models & AI", icon: "layers", items: MODEL_PAGES },
  { id: "learn", label: "ISO standards & learning", icon: "book", items: LEARN_PAGES },
  { id: "resources", label: "Resources", icon: "library", items: RESOURCE_PAGES },
];

export const groupsOf = (items: NavItem[]) => [...new Set(items.map((i) => i.group))];

export interface Location { section: string; sectionLabel: string; group?: string; item?: NavItem }
const SECTION_LABEL: Record<string, string> = { projects: "Projects", account: "Account", ...Object.fromEntries(SECTIONS.map((s) => [s.id, s.label])) };
const at = (section: string, item?: NavItem, group = item?.group): Location => ({ section, sectionLabel: SECTION_LABEL[section], group, item });

/** Where a route sits in the sidebar: its section, group and page (the menu page with the longest matching path). */
export function locate(route: string): Location {
  const proj = /^\/projects\/[^/]+\/(.+)$/.exec(route)?.[1];
  if (proj) return at("projects", PROJECT_PAGES.find((x) => proj === x.path || proj.startsWith(x.path + "/")));
  if (route.startsWith("/projects")) return at("projects");
  const lists: [string, NavItem[]][] = [...SECTIONS.map((s) => [s.id, s.items] as [string, NavItem[]]), ["documents", TEMPLATE_PAGES], ["account", ACCOUNT_PAGES]];
  let best: Location | null = null; let len = 0;
  for (const [id, items] of lists) for (const i of items)
    if ((route === i.path || route.startsWith(i.path + "/")) && i.path.length > len) { len = i.path.length; best = at(id, i); }
  if (best) return best;
  // pages that are not in the menu themselves
  if (/^\/knowledge\/[^/]+\/templates/.test(route)) return at("documents", undefined, "Templates & samples");
  if (/^\/(ai-tools|workflow)(\/|$)/.test(route)) return at("documents");
  if (/^\/model-tools(\/|$)/.test(route)) return at("models");
  if (/^\/(admin|billing)(\/|$)/.test(route)) return at("account");
  if (/^\/(talent|standards|tools)(\/|$)/.test(route)) return at("resources");
  if (/^\/(knowledge|learn|parts|hubs)(\/|$)/.test(route)) return at("learn");
  return at("home");
}

/** Resolve a page to a hash path; project pages need a project. */
export const hrefFor = (item: NavItem, projectId?: string) => (item.scope === "global" ? item.path : projectId ? `/projects/${projectId}/${item.path}` : "/projects");

/** Label for a route, used by "recently visited". */
export function labelForRoute(route: string): string | null {
  const proj = /^\/projects\/[^/]+\/(.+)$/.exec(route);
  if (proj) {
    const rest = proj[1];
    if (/^documents\/[0-9a-f-]{36}/.test(rest)) return null; // document titles are recorded by the editor
    const hit = PROJECT_PAGES.find((x) => rest === x.path || rest.startsWith(x.path + "/"));
    return hit?.label ?? null;
  }
  return ALL_PAGES.find((x) => x.scope === "global" && x.path === route)?.label ?? null;
}
