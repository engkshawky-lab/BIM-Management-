import { containerName, type ContainerRow, type PlanHeader, type PlanMilestone } from "../../../shared/planRows";
import { api } from "./api";
import { getProjectData } from "./projectStore";

// The delivery plan that My Day, the Today card, the naming checker and sheet QA work from. It is either the
// TIDP / MIDP saved by the plan generator in this browser, or a project's MIDP / TIDP planner (a snapshot of the
// project's deliverables, refreshed from the server), chosen once with the plan source.

export type SavedPlanKind = "tidp" | "midp";
export interface SavedPlan {
  kind: SavedPlanKind; header: PlanHeader; milestones: PlanMilestone[]; rows: ContainerRow[];
  /** Set when the plan comes from a project's planner; such plans are changed in the project, not here. */
  project?: { id: string; code: string; name: string; at: string };
  /** Container names as recorded in the project, by row ref. */
  names?: Record<string, string>;
}
export type PlanSource = { kind: "browser" } | { kind: "project"; projectId: string; code: string; name: string };

const key = (k: SavedPlanKind) => `bim:plan:${k}`;
const SOURCE = "bim:plan:source";
const snapKey = (pid: string) => `bim:plan:project:${pid}`;
const load = <T,>(k: string): T | null => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : null; } catch { return null; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export function readPlan(kind: SavedPlanKind): SavedPlan | null {
  const s = load<SavedPlan>(key(kind));
  if (!s || !Array.isArray(s.rows) || !s.rows.length) return null;
  // a plan saved before the project data was entered still names its containers with the project code
  const p = getProjectData();
  const header = { ...s.header, projectCode: s.header?.projectCode || p.code, projectName: s.header?.projectName || p.name };
  return { kind, header, milestones: s.milestones ?? [], rows: s.rows };
}

export const planSource = (): PlanSource => load<PlanSource>(SOURCE) ?? { kind: "browser" };
export function setPlanSource(s: PlanSource) { save(SOURCE, s); window.dispatchEvent(new Event("bim:plan-source")); }

/** The browser plan: the MIDP when there is one (it aggregates every TIDP), otherwise the TIDP. */
export const browserPlan = () => readPlan("midp") ?? readPlan("tidp");
export const projectPlan = (projectId: string) => load<SavedPlan>(snapKey(projectId));

/** The plan the daily tools use, following the chosen source. */
export function activePlan(): SavedPlan | null {
  const src = planSource();
  return src.kind === "project" ? projectPlan(src.projectId) : browserPlan();
}

const STATUS: Record<string, string> = { planned: "Planned", wip: "In progress", "in progress": "In progress", shared: "Shared", published: "Published" };

/** Fetch a project's planner and keep a snapshot for the daily tools. */
export async function refreshProjectPlan(projectId: string, code: string, name: string): Promise<SavedPlan> {
  const d = await api<{
    deliverables: { id: string; containerName: string; title: string; typeCode: string; loin: string; milestoneId: string | null; startDate: string; dueDate: string; status: string; dependsOn: string[]; taskTeamId: string }[];
    milestones: { id: string; name: string; date: string }[];
    teams: { id: string; name: string }[];
  }>(`/projects/${projectId}/delivery`);
  const team = new Map(d.teams.map((t) => [t.id, t.name]));
  const ms = new Map(d.milestones.map((m) => [m.id, m.name]));
  const names: Record<string, string> = {};
  const rows: ContainerRow[] = d.deliverables.map((x) => {
    names[x.id] = x.containerName;
    return {
      ref: x.id, taskTeam: team.get(x.taskTeamId) ?? "", title: x.title, volume: "", level: "", type: x.typeCode, role: "", number: "",
      format: "", loin: x.loin, milestone: x.milestoneId ? ms.get(x.milestoneId) ?? "" : "", start: x.startDate, due: x.dueDate,
      dependsOn: (x.dependsOn ?? []).join(", "), responsible: "", suitability: "", status: STATUS[x.status?.toLowerCase()] ?? x.status ?? "Planned",
    };
  });
  const plan: SavedPlan = {
    kind: "midp", rows, names,
    header: { projectName: name, projectCode: code, appointingParty: "", leadAppointedParty: "", taskTeam: "", originator: "", discipline: "", preparedBy: "", revision: "" },
    milestones: d.milestones.map((m) => ({ code: m.name.slice(0, 12), name: m.name, date: m.date })),
    project: { id: projectId, code, name, at: new Date().toISOString() },
  };
  save(snapKey(projectId), plan);
  return plan;
}

/** A row's container name: as recorded in the project, or built from the plan's naming fields. */
export const rowName = (p: SavedPlan, r: ContainerRow) => p.names?.[r.ref] || containerName(p.header, r);
export const planContainers = (p: SavedPlan) => p.rows.map((r) => rowName(p, r));

/** Change fields of one row (matched by ref) in the saved browser plan. Project plans change in the project. */
export function updatePlanRow(kind: SavedPlanKind, ref: string, patch: Partial<ContainerRow>) {
  const s = load<SavedPlan>(key(kind)); if (!s) return;
  s.rows = s.rows.map((r) => (r.ref === ref ? { ...r, ...patch } : r));
  save(key(kind), s);
}
