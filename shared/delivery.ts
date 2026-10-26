import { validateContainerName } from "./naming";

export type DeliverableStatus = "planned" | "in_progress" | "shared" | "published";
export const DELIVERABLE_STATUSES: DeliverableStatus[] = ["planned", "in_progress", "shared", "published"];

export interface TaskTeam { id: string; name: string; organization: string; originatorCode: string; roleCode: string; leadUserId: string | null }
export interface Milestone { id: string; name: string; date: string; description: string }
export interface Deliverable {
  id: string; taskTeamId: string; containerName: string; title: string; typeCode: string; loin: string; milestoneId: string | null;
  startDate: string; dueDate: string; status: DeliverableStatus; dependsOn: string[]; assigneeId: string | null;
  fileId: string | null; documentId: string | null; notes: string;
  formats?: string[] | null; classification?: string; actualDate?: string;
}

export type Severity = "error" | "warning" | "info";
export interface Finding { severity: Severity; area: string; message: string; ref?: string; clause?: string }

const done = (d: Deliverable) => d.status === "shared" || d.status === "published";

/** Finds dependency cycles; returns each cycle as a list of ids. */
export function findCycles(items: Pick<Deliverable, "id" | "dependsOn">[]): string[][] {
  const deps = new Map(items.map((d) => [d.id, d.dependsOn]));
  const state = new Map<string, 1 | 2>();
  const cycles: string[][] = [];
  const stack: string[] = [];
  const visit = (id: string) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { cycles.push(stack.slice(stack.indexOf(id))); return; }
    state.set(id, 1); stack.push(id);
    for (const dep of deps.get(id) ?? []) if (deps.has(dep)) visit(dep);
    stack.pop(); state.set(id, 2);
  };
  for (const d of items) visit(d.id);
  return cycles;
}

/** ISO 19650-2 5.4.4/5.4.5 plan checks: dates, milestones, dependencies, naming, ownership. */
export function analysePlan(input: { deliverables: Deliverable[]; milestones: Milestone[]; teams: TaskTeam[]; projectCode: string; today: string }): Finding[] {
  const { deliverables: items, milestones, teams, projectCode, today } = input;
  const f: Finding[] = [];
  const byId = new Map(items.map((d) => [d.id, d]));
  const ms = new Map(milestones.map((m) => [m.id, m]));
  const team = new Map(teams.map((t) => [t.id, t]));
  const names = new Map<string, number>();

  if (!milestones.length) f.push({ severity: "warning", area: "Milestones", message: "No information delivery milestones defined.", clause: "19650-2 5.1.3" });
  if (!teams.length) f.push({ severity: "warning", area: "Task teams", message: "No task teams defined.", clause: "19650-2 5.3.3" });
  if (!items.length) f.push({ severity: "warning", area: "Plan", message: "The MIDP has no information containers yet.", clause: "19650-2 5.4.5" });
  for (const t of teams) {
    if (!items.some((d) => d.taskTeamId === t.id)) f.push({ severity: "info", area: "TIDP", ref: t.name, message: `${t.name} has no TIDP entries.`, clause: "19650-2 5.4.4" });
    if (!t.originatorCode) f.push({ severity: "warning", area: "Task teams", ref: t.name, message: `${t.name} has no originator code.` });
  }

  for (const d of items) {
    const label = d.containerName || d.title;
    if (!d.containerName) f.push({ severity: "warning", area: "Naming", ref: d.title, message: "Container name missing." });
    else {
      names.set(d.containerName, (names.get(d.containerName) ?? 0) + 1);
      const errs = validateContainerName(d.containerName, projectCode);
      if (errs.length) f.push({ severity: "error", area: "Naming", ref: label, message: errs.join(" ") });
      const t = team.get(d.taskTeamId);
      const originator = d.containerName.split("-")[1];
      if (t?.originatorCode && originator && originator !== t.originatorCode) f.push({ severity: "warning", area: "Naming", ref: label, message: `Originator ${originator} differs from task team code ${t.originatorCode}.` });
    }
    if (!team.has(d.taskTeamId)) f.push({ severity: "error", area: "TIDP", ref: label, message: "Assigned to a task team that no longer exists." });
    if (!d.dueDate) f.push({ severity: "warning", area: "Dates", ref: label, message: "No due date." });
    if (d.startDate && d.dueDate && d.startDate > d.dueDate) f.push({ severity: "error", area: "Dates", ref: label, message: `Starts (${d.startDate}) after it is due (${d.dueDate}).` });
    if (d.dueDate && d.dueDate < today && !done(d)) f.push({ severity: "error", area: "Progress", ref: label, message: `Overdue since ${d.dueDate}.` });
    const m = d.milestoneId ? ms.get(d.milestoneId) : undefined;
    if (!d.milestoneId) f.push({ severity: "info", area: "Milestones", ref: label, message: "Not linked to a delivery milestone." });
    else if (!m) f.push({ severity: "error", area: "Milestones", ref: label, message: "Linked milestone no longer exists." });
    else if (d.dueDate && d.dueDate > m.date) f.push({ severity: "error", area: "Milestones", ref: label, message: `Due ${d.dueDate}, after milestone "${m.name}" (${m.date}).`, clause: "19650-2 5.4.5" });
    if (!d.assigneeId) f.push({ severity: "info", area: "Ownership", ref: label, message: "No responsible person assigned." });
    if (!d.loin) f.push({ severity: "info", area: "LOIN", ref: label, message: "No level of information need reference.", clause: "ISO 7817-1" });
    for (const depId of d.dependsOn) {
      const dep = byId.get(depId);
      if (!dep) { f.push({ severity: "warning", area: "Dependencies", ref: label, message: "Depends on a deleted container." }); continue; }
      const start = d.startDate || d.dueDate;
      if (dep.dueDate && start && dep.dueDate > start) f.push({ severity: "warning", area: "Dependencies", ref: label, message: `Needs ${dep.containerName || dep.title} (due ${dep.dueDate}) before it starts (${start}).` });
    }
  }
  for (const [name, n] of names) if (n > 1) f.push({ severity: "error", area: "Naming", ref: name, message: `Container name used ${n} times — names must be unique.` });
  for (const c of findCycles(items)) f.push({ severity: "error", area: "Dependencies", message: `Circular dependency: ${c.map((id) => byId.get(id)?.containerName || byId.get(id)?.title).join(" → ")}.` });
  return f;
}

export function planStats(items: Deliverable[], today: string) {
  const count = (s: DeliverableStatus) => items.filter((d) => d.status === s).length;
  return {
    total: items.length,
    planned: count("planned"), inProgress: count("in_progress"), shared: count("shared"), published: count("published"),
    overdue: items.filter((d) => d.dueDate && d.dueDate < today && !done(d)).length,
    progress: items.length ? items.filter(done).length / items.length : 0,
  };
}

export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
export const addDays = (d: string, n: number) => new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);

/** Score 0–100 from findings: errors cost more than warnings. */
export const qualityScore = (f: Finding[]) => Math.max(0, 100 - f.filter((x) => x.severity === "error").length * 8 - f.filter((x) => x.severity === "warning").length * 3 - f.filter((x) => x.severity === "info").length);

/** Days late (+) or early (−) against the due date; null until delivered. */
export const variance = (d: Pick<Deliverable, "dueDate" | "actualDate">) => (d.dueDate && d.actualDate ? daysBetween(d.dueDate, d.actualDate) : null);
