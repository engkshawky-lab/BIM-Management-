import { containerName, type ContainerRow, type PlanHeader, type PlanMilestone } from "../../../shared/planRows";
import { getProjectData } from "./projectStore";

// Read and update the TIDP / MIDP saved by the delivery plan generator (localStorage, this browser only),
// so My Day and the naming checker work from the same plan without opening the generator.

export type SavedPlanKind = "tidp" | "midp";
export interface SavedPlan { kind: SavedPlanKind; header: PlanHeader; milestones: PlanMilestone[]; rows: ContainerRow[] }

const key = (k: SavedPlanKind) => `bim:plan:${k}`;

export function readPlan(kind: SavedPlanKind): SavedPlan | null {
  try {
    const v = localStorage.getItem(key(kind)); if (!v) return null;
    const s = JSON.parse(v);
    if (!Array.isArray(s.rows) || !s.rows.length) return null;
    // a plan saved before the project data was entered still names its containers with the project code
    const p = getProjectData();
    const header = { ...s.header, projectCode: s.header?.projectCode || p.code, projectName: s.header?.projectName || p.name };
    return { kind, header, milestones: s.milestones ?? [], rows: s.rows };
  } catch { return null; }
}

/** The MIDP when there is one (it aggregates every TIDP), otherwise the TIDP. */
export const activePlan = () => readPlan("midp") ?? readPlan("tidp");

export const planContainers = (p: SavedPlan) => p.rows.map((r) => containerName(p.header, r));

/** Change fields of one row (matched by ref) in the saved plan. */
export function updatePlanRow(kind: SavedPlanKind, ref: string, patch: Partial<ContainerRow>) {
  try {
    const v = localStorage.getItem(key(kind)); if (!v) return;
    const s = JSON.parse(v);
    s.rows = (s.rows as ContainerRow[]).map((r) => (r.ref === ref ? { ...r, ...patch } : r));
    localStorage.setItem(key(kind), JSON.stringify(s));
  } catch { /* storage unavailable */ }
}
