import { templates } from "../../../shared/data/templates";
import type { IconName } from "./icons";

// Single registry of every page. The side panel, Ctrl+K search, favourites, roles and
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

/** Home: your own work across projects. */
export const HOME_PAGES: NavItem[] = [
  g("r.myday", "My Day", "/my-day", "calendar", "My work", "What is due from your delivery plan and what is waiting on you"),
  g("r.portfolio", "Portfolio dashboard", "/portfolio", "grid", "My work", "Health across your projects"),
  g("r.wizard", "Setup wizard", "/wizard", "sparkles", "My work", "Answer a few questions; get the documents and workflow you need"),
];
/** Daily tools, shown on the Home panel as shortcuts; each page lives in its own section. */
export const DAILY_TOOLS = ["m.naming", "m.revit", "ai.plans"];

export const TEMPLATE_PAGES: NavItem[] = templates.map((t) =>
  g(`t.${t.id}`, `${t.code} — ${t.title}`, `/knowledge/${t.standard}/templates/${t.id}`, "file", `${t.standard === "iso19650" ? "ISO 19650" : "ISO/IEC 42001"} · ${t.category}`, t.purpose));

/** Documents, in the order they are made: enter the project data, create, check, then samples and templates. */
export const DOCUMENT_PAGES: NavItem[] = [
  g("ai.projectdata", "Project data (enter once)", "/project-data", "table", "1 · Project data", "Mandatory inputs every document reuses: the eight-item hard minimum and per-document inputs"),
  g("ai.generate", "Document generator", "/ai-tools/generate", "sparkles", "2 · Create", "EIR, AIR, PIR, OIR, BEP, TIDP, MIDP or any custom template"),
  g("ai.plans", "TIDP / MIDP / MPDT generator", "/ai-tools/plans", "calendar", "2 · Create", "Delivery plan tables with naming, checks and Excel export"),
  g("ai.risks", "Risk register generator", "/ai-tools/risks", "sparkles", "2 · Create"),
  g("ai.clash", "Clash matrix builder", "/ai-tools/clash", "sparkles", "2 · Create"),
  g("ai.review", "Document review & compare", "/ai-tools/review", "sparkles", "3 · Check", "Review EIR/BEP/MIDP; EIR ↔ BEP check; BEP versions"),
  g("m.naming", "File naming checker", "/tools/naming-check", "tag", "3 · Check", "Check hundreds of file names at once; get corrected names and match them to the plan"),
  g("s.naming", "Naming & status code tool", "/knowledge/iso19650/naming", "tag", "3 · Check", "Build one container name and look up status codes"),
  g("ai.suitability", "Suitability code hub", "/ai-tools/suitability", "sparkles", "3 · Check"),
  g("r.samples", "Sample documents (EIR, AIR, OIR, BEP…)", "/samples", "file", "Samples & downloads", "Structured Word samples with guidance"),
  g("r.downloads", "Downloads library", "/downloads", "library", "Samples & downloads", "Templates, checklists and guides curated by administrators"),
  ...TEMPLATE_PAGES,
];

/** Models: check them, then connect AI to the authoring tools. */
export const MODEL_PAGES: NavItem[] = [
  g("m.revit", "Revit project check", "/model-tools/revit", "check", "Check models", "Check the open Revit model against your project rules: parameters, naming, sheets, model health"),
  g("m.qaqc", "QA/QC model checker", "/model-tools/qaqc", "check", "Check models", "Grade IFC models A–F, compare up to 10"),
  g("m.ifc", "IFC Hub", "/model-tools/ifc", "layers", "Check models", "Analyse IFC models, check LOIN/IDS, compare with your EIR"),
  g("ai.cobie", "COBie data checker", "/ai-tools/cobie", "sparkles", "Check models"),
  g("ai.mcp", "Connect via MCP", "/ai-tools/mcp", "link", "Connect AI", "Connect Claude to Revit, IFC and CDE tools with MCP"),
];

/** Learn: where to start, the standard itself, the in-depth topic hubs (hubs index order), ISO/IEC 42001, references. */
export const STANDARD_PAGES: NavItem[] = [
  g("s.learn", "Learn: quizzes, mock exam, scenarios", "/learn", "sparkles", "Start here", "Practice questions, timed exam, skill profile"),
  g("s.guides", "Best-practice guides", "/learn/guides", "book", "Start here", "Practical guidance for modellers, coordinators and managers"),
  g("s.adoption", "Implementation guide", "/learn/adoption", "flow", "Start here", "Adopt ISO 19650 across your organization, step by step"),
  g("s.19650.parts", "All parts (1–6): learning hub", "/parts", "book", "ISO 19650", "Beginner to expert, clause deep dives, checklists, Ask AI"),
  ...[1, 2, 3, 4, 5, 6].map((n) => g(`s.19650.part${n}`, `Part ${n}`, `/parts/19650-${n}`, "book", "ISO 19650")),
  g("s.19650.revision", "2026 revision (draft): what is changing", "/hubs/revision-2026", "alert", "ISO 19650", "Status of the Parts 1–3 revision, confirmed vs proposed changes, what to do now"),
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
  g("r.fee", "BIM fee estimator", "/tools/fee", "table", "Calculators & assessments"),
  g("r.carbon", "Embodied carbon (6D)", "/tools/carbon", "layers", "Calculators & assessments"),
  g("r.maturity", "BIM maturity assessment", "/tools/maturity", "check", "Calculators & assessments"),
  g("r.dt", "Digital twin readiness", "/tools/dt", "check", "Calculators & assessments"),
  g("r.scan", "Scan-to-BIM readiness", "/tools/scan", "check", "Calculators & assessments"),
  g("r.standards", "Client standards", "/standards", "book", "Industry", "Client information standards and requirements"),
  g("r.news", "BIM & ISO 19650 news", "/news", "activity", "Industry", "AI-compiled news with relevance ratings"),
  g("r.talentme", "My talent profile", "/talent/me", "user", "Careers", "Opt-in profile for recruiters"),
  g("r.talent", "Talent pool (recruiters)", "/talent", "users", "Careers"),
  g("r.profile", "My profile", "/profile", "user", "Account"),
  g("r.support", "Help & support", "/support", "help", "Account", "Ask a question or report a problem; see replies"),
];

export const ALL_PAGES = [...PROJECT_PAGES, ...HOME_PAGES, ...DOCUMENT_PAGES, ...MODEL_PAGES, ...STANDARD_PAGES, ...RESOURCE_PAGES];
export const pageByKey = (key: string) => ALL_PAGES.find((x) => x.key === key);

export interface RailSection { id: string; label: string; icon: IconName; title: string }
/** The rail follows the working order: your day, your projects, the documents and models you produce, then learning and resources. */
export const RAIL: RailSection[] = [
  { id: "home", label: "Home", icon: "home", title: "Home" },
  { id: "projects", label: "Projects", icon: "folder", title: "Projects" },
  { id: "documents", label: "Documents", icon: "files", title: "Documents & templates" },
  { id: "tools", label: "Models", icon: "layers", title: "Model checks & AI" },
  { id: "standards", label: "Learn", icon: "book", title: "Learn ISO 19650" },
  { id: "resources", label: "Resources", icon: "library", title: "Resources" },
];

const SECTION_PAGES: [string, NavItem[]][] = [["home", HOME_PAGES], ["documents", DOCUMENT_PAGES], ["tools", MODEL_PAGES], ["standards", STANDARD_PAGES], ["resources", RESOURCE_PAGES]];

/** Which rail section a route belongs to, so the right panel opens on navigation: the section of the menu page with the longest matching path. */
export function sectionFor(route: string): string {
  if (route.startsWith("/projects")) return "projects";
  let best = ""; let section = "";
  for (const [id, items] of SECTION_PAGES) for (const i of items)
    if ((route === i.path || route.startsWith(i.path + "/")) && i.path.length > best.length) { best = i.path; section = id; }
  if (section) return section;
  // pages that are not in the menu themselves
  if (/^\/knowledge\/[^/]+\/templates/.test(route)) return "documents";
  if (/^\/(ai-tools|model-tools)(\/|$)/.test(route)) return "tools";
  if (/^\/(admin|talent|standards|profile|support|billing)(\/|$)/.test(route)) return "resources";
  if (/^\/(knowledge|learn|parts|hubs)(\/|$)/.test(route)) return "standards";
  return "home";
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
