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

export const PROJECT_PAGES: NavItem[] = [
  p("p.summary", "Summary", "overview", "grid", "Overview"),
  p("p.activity", "Activity", "activity", "activity", "Overview"),
  p("p.assistant", "Project assistant (AI)", "assistant", "sparkles", "Overview", "Ask questions answered from project records"),
  p("p.notebook", "Research notebook (AI)", "notebook", "book", "Overview", "Summarise and compare sources with citations"),
  p("p.documents", "Documents", "documents", "file", "Information (CDE)", "Controlled documents, reviews, revisions"),
  p("p.files", "Files", "files", "folder", "Information (CDE)", "WIP · Shared · Published · Archived"),
  p("p.plan", "MIDP / TIDP planner", "delivery/plan", "calendar", "Delivery", "Information containers, Gantt, change impact"),
  p("p.setup", "Teams & milestones", "delivery/setup", "users", "Delivery"),
  p("p.trace", "Requirements traceability", "traceability", "flow", "Delivery", "EIR → BEP → MIDP → delivered"),
  p("p.contract", "Appointment review (AI)", "contract", "file", "Delivery", "Check contracts for ISO 19650 obligations"),
  p("p.uses", "Information uses", "delivery/uses", "target", "Delivery", "Why information is produced — drives LOIN & MIDP"),
  p("p.raci", "Responsibility matrix", "delivery/responsibility", "table", "Delivery", "RACI per task team"),
  p("p.mrm", "Model responsibility (MRM)", "delivery/mrm", "grid", "Delivery", "Who models each element, LOD per milestone"),
  p("p.loin", "Level of information need", "delivery/loin", "layers", "Delivery", "LOIN per element & milestone"),
  p("p.gates", "Process gates", "workflow", "flow", "Delivery", "ISO 19650-2 / 42001 stage gates"),
  p("p.risks", "Risk register", "delivery/risks", "alert", "Delivery"),
  p("p.hs", "Health & safety information", "delivery/hs", "alert", "Delivery", "ISO 19650-6 hazards and residual risks"),
  p("p.handover", "Handover", "delivery/handover", "handshake", "Delivery", "PIM → AIM checklist"),
  p("p.validation", "Model validation", "validation", "check", "Model & coordination", "IFC, COBie, LOIN & IDS checks"),
  p("p.reviews", "Model QA/QC reviews", "reviews", "shield", "Model & coordination", "Graded discipline checklists A–D"),
  p("p.issues", "Issues (BCF)", "coordination/issues", "flag", "Model & coordination"),
  p("p.clash", "Clash matrix", "coordination/clash", "grid", "Model & coordination"),
  p("p.4d", "4D planning", "4d", "calendar", "Model & coordination", "Link programme to model; planned vs actual by date"),
  p("p.tags", "Asset tags", "tags", "check", "Model & coordination", "Build and check asset tags"),
  p("p.quality", "Quality hub", "quality", "shield", "Quality & team", "Document, plan and document-set checks"),
  p("p.meetings", "Meetings & progress report", "meetings", "calendar", "Quality & team", "Agendas, minutes, actions, progress report"),
  p("p.automations", "Automations", "automations", "sparkles", "Quality & team", "Scheduled chasers and quality reviews"),
  p("p.training", "Team training", "training", "book", "Quality & team", "Assign courses and track completion"),
  p("p.team", "Team", "team", "users", "Quality & team"),
  p("p.settings", "Project settings", "settings", "settings", "Quality & team"),
];

export const STANDARD_PAGES: NavItem[] = [
  g("s.learn", "Learn: quizzes, mock exam, scenarios", "/learn", "sparkles", "Learn", "Practice questions, timed exam, skill profile"),
  g("s.guides", "Best-practice guides", "/learn/guides", "book", "Learn", "Practical guidance for modellers, coordinators and managers"),
  g("s.hubs", "All topic hubs", "/hubs", "grid", "Advanced topics", "Every in-depth guide in one place"),
  g("s.hub.appointment", "Appointment process diagram", "/hubs/appointment", "flow", "Advanced topics", "Interactive ISO 19650-2 process: who does what, inputs, outputs"),
  g("s.hub.docroles", "Documents aligned with roles", "/hubs/documents-roles", "file", "Advanced topics", "Which party produces which document at each stage"),
  g("s.hub.loin", "LOD / LOI / LOIN hub", "/hubs/loin", "layers", "Advanced topics", "Level of information need, LOD 100–500, element library"),
  g("s.hub.cobie", "COBie practical guide", "/hubs/cobie", "table", "Advanced topics", "Sheets, timing, authoring, quality checks"),
  g("s.hub.infra", "Infrastructure BIM & ISO 19650", "/hubs/infrastructure", "layers", "Advanced topics", "Roads, rail, bridges, utilities"),
  g("s.hub.revit", "Revit best practices", "/hubs/revit", "settings", "Advanced topics", "Setup, naming, parameters, IFC export, QA"),
  g("s.hub.implementation", "BIM implementation best practices", "/hubs/implementation", "flow", "Advanced topics", "Strategy, maturity, people, process, technology, KPIs"),
  g("s.hub.scan", "Scan to BIM", "/hubs/scan-to-bim", "layers", "Advanced topics", "Reality capture, accuracy, workflow, cost estimator"),
  g("s.hub.dimensions", "BIM dimensions (4D–7D, net zero)", "/hubs/dimensions", "layers", "Advanced topics", "4D time, 5D cost, 6D carbon, 7D FM, net zero"),
  g("s.adoption", "Implementation guide", "/learn/adoption", "flow", "Learn", "Adopt ISO 19650 across your organization, step by step"),
  g("s.19650.parts", "All parts (1–6): learning hub", "/parts", "book", "ISO 19650", "Beginner to expert, clause deep dives, checklists, Ask AI"),
  ...[1, 2, 3, 4, 5, 6].map((n) => g(`s.19650.part${n}`, `Part ${n}`, `/parts/19650-${n}`, "book", "ISO 19650")),
  g("s.19650.summary", "Parts at a glance", "/knowledge/iso19650/library/0", "book", "ISO 19650"),
  g("s.19650.process", "Delivery process (19650-2)", "/knowledge/iso19650/library/1", "flow", "ISO 19650"),
  g("s.19650.cde", "CDE & status codes", "/knowledge/iso19650/library/2", "layers", "ISO 19650"),
  g("s.19650.glossary", "Glossary & acronyms", "/knowledge/iso19650/library/3", "text", "ISO 19650"),
  g("s.uses", "Information uses library", "/knowledge/iso19650/uses", "target", "ISO 19650"),
  g("s.naming", "Naming & status code tool", "/knowledge/iso19650/naming", "tag", "ISO 19650"),
  g("s.42001.clauses", "Clauses 4–10", "/knowledge/iso42001/library/0", "book", "ISO/IEC 42001"),
  g("s.42001.annex", "Annex A controls", "/knowledge/iso42001/library/1", "shield", "ISO/IEC 42001"),
  g("s.42001.aibim", "AI in BIM", "/knowledge/iso42001/library/2", "sparkles", "ISO/IEC 42001"),
  g("s.42001.glossary", "Glossary", "/knowledge/iso42001/library/3", "text", "ISO/IEC 42001"),
];

export const TEMPLATE_PAGES: NavItem[] = templates.map((t) =>
  g(`t.${t.id}`, `${t.code} — ${t.title}`, `/knowledge/${t.standard}/templates/${t.id}`, "file", `${t.standard === "iso19650" ? "ISO 19650" : "ISO/IEC 42001"} · ${t.category}`, t.purpose));

export const RESOURCE_PAGES: NavItem[] = [
  g("r.downloads", "Downloads library", "/downloads", "library", "References", "Templates, checklists and guides curated by administrators"),
  g("r.samples", "Sample documents (EIR, AIR, OIR, BEP…)", "/samples", "file", "References", "Structured Word samples with guidance"),
  g("r.news", "BIM & ISO 19650 news", "/news", "activity", "References", "AI-compiled news with relevance ratings"),
  g("r.19650", "ISO 19650 references", "/knowledge/iso19650/references", "library", "References"),
  g("r.42001", "ISO/IEC 42001 references", "/knowledge/iso42001/references", "library", "References"),
  g("r.wizard", "Setup wizard", "/wizard", "sparkles", "My work", "Answer a few questions; get the documents and workflow you need"),
  g("r.myday", "My Day", "/my-day", "calendar", "My work", "Everything waiting on you"),
  g("r.portfolio", "Portfolio dashboard", "/portfolio", "grid", "My work", "Health across your projects"),
  g("ai.review", "Document review & compare", "/ai-tools/review", "sparkles", "AI tools", "Review EIR/BEP/MIDP; EIR ↔ BEP check; BEP versions"),
  g("ai.generate", "Document generator", "/ai-tools/generate", "sparkles", "AI tools", "EIR, AIR, PIR, OIR, BEP, TIDP, MIDP or any custom template"),
  g("ai.risks", "Risk register generator", "/ai-tools/risks", "sparkles", "AI tools"),
  g("ai.clash", "Clash matrix builder", "/ai-tools/clash", "sparkles", "AI tools"),
  g("ai.suitability", "Suitability code hub", "/ai-tools/suitability", "sparkles", "AI tools"),
  g("ai.cobie", "COBie data checker", "/ai-tools/cobie", "sparkles", "AI tools"),
  g("r.fee", "BIM fee estimator", "/tools/fee", "table", "Tools"),
  g("r.carbon", "Embodied carbon (6D)", "/tools/carbon", "layers", "Tools"),
  g("r.maturity", "BIM maturity assessment", "/tools/maturity", "check", "Tools"),
  g("r.dt", "Digital twin readiness", "/tools/dt", "check", "Tools"),
  g("r.scan", "Scan-to-BIM readiness", "/tools/scan", "check", "Tools"),
  g("r.talentme", "My talent profile", "/talent/me", "user", "Careers", "Opt-in profile for recruiters"),
  g("r.talent", "Talent pool (recruiters)", "/talent", "users", "Careers"),
  g("r.standards", "Client standards", "/standards", "book", "Client requirements"),
  g("r.profile", "My profile", "/profile", "user", "Account"),
  g("r.support", "Help & support", "/support", "help", "Account", "Ask a question or report a problem; see replies"),
];

export const ALL_PAGES = [...PROJECT_PAGES, ...STANDARD_PAGES, ...TEMPLATE_PAGES, ...RESOURCE_PAGES];
export const pageByKey = (key: string) => ALL_PAGES.find((x) => x.key === key);

export interface RailSection { id: string; label: string; icon: IconName; title: string }
export const RAIL: RailSection[] = [
  { id: "home", label: "Home", icon: "home", title: "Home" },
  { id: "standards", label: "Standards", icon: "book", title: "ISO standards & guides" },
  { id: "documents", label: "Documents", icon: "files", title: "Documents & templates" },
  { id: "projects", label: "Projects", icon: "folder", title: "Projects" },
  { id: "resources", label: "Resources", icon: "library", title: "Resources" },
];

/** Which rail section a route belongs to, so the right panel opens on navigation. */
export function sectionFor(route: string): string {
  if (route.startsWith("/projects")) return "projects";
  if (/^\/knowledge\/[^/]+\/templates/.test(route)) return "documents";
  if (/^\/knowledge\/[^/]+\/references/.test(route) || route.startsWith("/profile") || /^\/(my-day|portfolio|tools|ai-tools|downloads|samples|news|standards|talent|admin|wizard|support)/.test(route)) return "resources";
  if (route.startsWith("/knowledge") || route.startsWith("/learn") || route.startsWith("/parts") || route.startsWith("/hubs")) return "standards";
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
