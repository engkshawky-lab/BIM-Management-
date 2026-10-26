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
  p("p.documents", "Documents", "documents", "file", "Information (CDE)", "Controlled documents, reviews, revisions"),
  p("p.files", "Files", "files", "folder", "Information (CDE)", "WIP · Shared · Published · Archived"),
  p("p.plan", "MIDP / TIDP planner", "delivery/plan", "calendar", "Delivery", "Information containers, Gantt, change impact"),
  p("p.setup", "Teams & milestones", "delivery/setup", "users", "Delivery"),
  p("p.uses", "Information uses", "delivery/uses", "target", "Delivery", "Why information is produced — drives LOIN & MIDP"),
  p("p.raci", "Responsibility matrix", "delivery/responsibility", "table", "Delivery", "RACI per task team"),
  p("p.mrm", "Model responsibility (MRM)", "delivery/mrm", "grid", "Delivery", "Who models each element, LOD per milestone"),
  p("p.loin", "Level of information need", "delivery/loin", "layers", "Delivery", "LOIN per element & milestone"),
  p("p.gates", "Process gates", "workflow", "flow", "Delivery", "ISO 19650-2 / 42001 stage gates"),
  p("p.risks", "Risk register", "delivery/risks", "alert", "Delivery"),
  p("p.handover", "Handover", "delivery/handover", "handshake", "Delivery", "PIM → AIM checklist"),
  p("p.validation", "Model validation", "validation", "check", "Model & coordination", "IFC, COBie, LOIN & IDS checks"),
  p("p.reviews", "Model QA/QC reviews", "reviews", "shield", "Model & coordination", "Graded discipline checklists A–D"),
  p("p.issues", "Issues (BCF)", "coordination/issues", "flag", "Model & coordination"),
  p("p.clash", "Clash matrix", "coordination/clash", "grid", "Model & coordination"),
  p("p.tags", "Asset tags", "tags", "check", "Model & coordination", "Build and check asset tags"),
  p("p.quality", "Quality hub", "quality", "shield", "Quality & team", "Document, plan and document-set checks"),
  p("p.meetings", "Meetings & progress report", "meetings", "calendar", "Quality & team", "Agendas, minutes, actions, progress report"),
  p("p.team", "Team", "team", "users", "Quality & team"),
  p("p.settings", "Project settings", "settings", "settings", "Quality & team"),
];

export const STANDARD_PAGES: NavItem[] = [
  g("s.19650.parts", "All parts (1–6)", "/knowledge/iso19650/library/0", "book", "ISO 19650"),
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
  g("r.19650", "ISO 19650 references", "/knowledge/iso19650/references", "library", "References"),
  g("r.42001", "ISO/IEC 42001 references", "/knowledge/iso42001/references", "library", "References"),
  g("r.standards", "Client standards", "/standards", "book", "Client requirements"),
  g("r.profile", "My profile", "/profile", "user", "Account"),
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
  if (/^\/knowledge\/[^/]+\/references/.test(route) || route.startsWith("/profile")) return "resources";
  if (route.startsWith("/knowledge")) return "standards";
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
