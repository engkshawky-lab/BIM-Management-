import { findCycles } from "./delivery";

// Delivery plan tables for the standalone TIDP / MIDP / MPDT generator: row shapes, ISO 19650 container naming,
// checks, and a starter library so a useful plan exists without any AI call.

export type PlanKind = "tidp" | "midp" | "mpdt";

export interface PlanHeader {
  projectName: string; projectCode: string; appointingParty: string; leadAppointedParty: string;
  taskTeam: string; originator: string; discipline: string; preparedBy: string; revision: string;
}
export interface PlanMilestone { code: string; name: string; date: string }

/** One information container (TIDP and MIDP rows). */
export interface ContainerRow {
  ref: string; taskTeam: string; title: string; volume: string; level: string; type: string; role: string; number: string;
  format: string; loin: string; milestone: string; start: string; due: string; dependsOn: string; responsible: string; suitability: string; status: string;
}
/** One element or system in the MPDT, with its level of information need per stage. */
export interface MpdtRow { element: string; classification: string; author: string; loin: Record<string, string>; notes: string }

export const STATUSES = ["Planned", "In progress", "Shared", "Published"];
export const SUITABILITY = ["S0", "S1", "S2", "S3", "S4", "S6", "S7", "A1", "CR"];
export const TYPE_CODES: Record<string, string> = { M3: "3D model", M2: "2D model", DR: "Drawing", SP: "Specification", RP: "Report", SH: "Schedule", CA: "Calculation", SU: "Survey", MI: "Minutes", PP: "Presentation", CO: "Correspondence", VS: "Visualisation" };
export const DISCIPLINES: Record<string, { role: string; label: string }> = {
  architecture: { role: "A", label: "Architecture" }, structure: { role: "S", label: "Structure" }, mechanical: { role: "M", label: "Mechanical (HVAC)" },
  electrical: { role: "E", label: "Electrical" }, publichealth: { role: "P", label: "Public health / plumbing" }, civil: { role: "C", label: "Civil / site" },
  landscape: { role: "L", label: "Landscape" }, im: { role: "Z", label: "Information management (general)" },
};

const clean = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
/** ISO 19650-2 (UK National Annex style) container name: Project-Originator-Volume-Level-Type-Role-Number. */
export const containerName = (h: Pick<PlanHeader, "projectCode" | "originator">, r: Pick<ContainerRow, "volume" | "level" | "type" | "role" | "number">) =>
  [clean(h.projectCode) || "PRJ", clean(h.originator) || "ORG", clean(r.volume) || "ZZ", clean(r.level) || "XX", clean(r.type) || "XX", clean(r.role) || "Z", (r.number.replace(/\D/g, "") || "1").padStart(4, "0")].join("-");

/** Give rows without a number the next free number per type/role, so names stay unique. */
export function numberRows(rows: ContainerRow[]): ContainerRow[] {
  const used = new Map<string, Set<number>>();
  const key = (r: ContainerRow) => `${clean(r.volume)}-${clean(r.level)}-${clean(r.type)}-${clean(r.role)}`;
  for (const r of rows) if (r.number) { const k = key(r); (used.get(k) ?? used.set(k, new Set()).get(k)!).add(parseInt(r.number, 10)); }
  return rows.map((r) => {
    if (r.number) return r;
    const k = key(r); const set = used.get(k) ?? used.set(k, new Set()).get(k)!;
    let n = 1; while (set.has(n)) n++; set.add(n);
    return { ...r, number: String(n).padStart(4, "0") };
  });
}

export interface PlanIssue { level: "error" | "warning"; row: number; message: string }

export function checkContainers(h: PlanHeader, rows: ContainerRow[], milestones: PlanMilestone[]): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const names = new Map<string, number>();
  const ms = new Map(milestones.map((m) => [m.code, m]));
  rows.forEach((r, i) => {
    const name = containerName(h, r);
    if (names.has(name)) issues.push({ level: "error", row: i, message: `Duplicate container name ${name} (also row ${names.get(name)! + 1}).` });
    names.set(name, i);
    if (!r.title.trim()) issues.push({ level: "error", row: i, message: "No title or description." });
    if (!r.due) issues.push({ level: "warning", row: i, message: "No due date." });
    if (r.start && r.due && r.start > r.due) issues.push({ level: "error", row: i, message: "Start date is after the due date." });
    const m = ms.get(r.milestone);
    if (!r.milestone) issues.push({ level: "warning", row: i, message: "Not linked to a delivery milestone." });
    else if (!m) issues.push({ level: "warning", row: i, message: `Milestone ${r.milestone} is not in the milestone list.` });
    else if (m.date && r.due && r.due > m.date) issues.push({ level: "error", row: i, message: `Due ${r.due} is after milestone ${m.code} (${m.date}).` });
    if (!r.responsible.trim()) issues.push({ level: "warning", row: i, message: "No responsible person or role." });
    if (!r.loin.trim()) issues.push({ level: "warning", row: i, message: "No level of information need." });
  });
  const byRef = new Map(rows.map((r, i) => [r.ref, i]));
  rows.forEach((r, i) => r.dependsOn.split(/[,;\s]+/).filter(Boolean).forEach((d) => { if (!byRef.has(d)) issues.push({ level: "warning", row: i, message: `Depends on ${d}, which is not in this plan.` }); }));
  for (const cycle of findCycles(rows.map((r) => ({ id: r.ref, dependsOn: r.dependsOn.split(/[,;\s]+/).filter((d) => byRef.has(d)) }))))
    issues.push({ level: "error", row: byRef.get(cycle[0]) ?? 0, message: `Circular dependency: ${cycle.join(" → ")}.` });
  return issues;
}

export const emptyRow = (i: number, role = "Z"): ContainerRow => ({ ref: `C${String(i + 1).padStart(3, "0")}`, taskTeam: "", title: "", volume: "ZZ", level: "XX", type: "M3", role, number: "", format: "", loin: "", milestone: "", start: "", due: "", dependsOn: "", responsible: "", suitability: "S2", status: "Planned" });

/** Typical deliverables per discipline (type code, title, format, LOIN hint). Planning starter only — tailor to the EIR. */
const STARTER: Record<string, [string, string, string, string][]> = {
  architecture: [["M3", "Architectural federated model", "IFC 4 + RVT", "LOD 300 / LOI 3"], ["DR", "General arrangement plans — all levels", "PDF", "1:100"], ["DR", "Elevations", "PDF", "1:100"], ["DR", "Sections", "PDF", "1:100"], ["SH", "Room data sheets / space schedule", "XLSX", "Per EIR"], ["SH", "Door and window schedules", "XLSX", "LOI 3"], ["SP", "Architectural specification", "PDF", "Per EIR"], ["RP", "Design and access statement", "PDF", "—"]],
  structure: [["M3", "Structural analysis and design model", "IFC 4 + RVT", "LOD 300 / LOI 3"], ["DR", "Foundation layout", "PDF", "1:100"], ["DR", "Framing plans — all levels", "PDF", "1:100"], ["CA", "Structural calculations", "PDF", "—"], ["SP", "Structural specification", "PDF", "Per EIR"], ["SH", "Steelwork / reinforcement schedule", "XLSX", "LOI 3"]],
  mechanical: [["M3", "Mechanical services model (HVAC)", "IFC 4 + RVT", "LOD 300 / LOI 3"], ["DR", "Ventilation layouts", "PDF", "1:100"], ["DR", "Heating and cooling layouts", "PDF", "1:100"], ["DR", "Plant room layouts", "PDF", "1:50"], ["CA", "Heat load and energy calculations", "PDF", "—"], ["SH", "Equipment schedule (COBie-ready)", "XLSX", "LOI 3"], ["SP", "Mechanical specification", "PDF", "Per EIR"]],
  electrical: [["M3", "Electrical services model", "IFC 4 + RVT", "LOD 300 / LOI 3"], ["DR", "Lighting layouts", "PDF", "1:100"], ["DR", "Small power and containment layouts", "PDF", "1:100"], ["DR", "Schematic distribution diagram", "PDF", "NTS"], ["CA", "Lighting and cable calculations", "PDF", "—"], ["SP", "Electrical specification", "PDF", "Per EIR"]],
  publichealth: [["M3", "Public health services model", "IFC 4 + RVT", "LOD 300 / LOI 3"], ["DR", "Above-ground drainage layouts", "PDF", "1:100"], ["DR", "Water services layouts", "PDF", "1:100"], ["SP", "Public health specification", "PDF", "Per EIR"]],
  civil: [["M3", "Civil / site model (levels, drainage, roads)", "IFC 4.3 + DWG", "LOD 300 / LOI 3"], ["DR", "Site layout and setting out", "PDF", "1:200"], ["DR", "Below-ground drainage layout", "PDF", "1:200"], ["CA", "Drainage and flood risk calculations", "PDF", "—"], ["SU", "Topographical survey", "DWG + E57", "Survey grade"]],
  landscape: [["M3", "Landscape model", "IFC 4 + RVT", "LOD 200 / LOI 2"], ["DR", "Landscape general arrangement", "PDF", "1:200"], ["SH", "Planting schedule", "XLSX", "LOI 2"], ["SP", "Landscape specification", "PDF", "Per EIR"]],
  im: [["RP", "BIM execution plan (post-appointment)", "PDF + DOCX", "—"], ["SH", "Master information delivery plan", "XLSX", "—"], ["M3", "Federated coordination model", "IFC 4 / NWD", "As task teams"], ["RP", "Clash detection report", "PDF + BCF", "—"], ["SH", "COBie data drop", "XLSX", "Per stage"], ["RP", "Model QA/QC report", "PDF", "—"]],
};

export function starterRows(disciplines: string[], milestones: PlanMilestone[], taskTeam = ""): ContainerRow[] {
  const rows: ContainerRow[] = [];
  const ms = milestones.filter((m) => m.code);
  for (const d of disciplines) {
    const items = STARTER[d] ?? [];
    items.forEach(([type, title, format, loin]) => {
      // models feed every milestone; documents go to the last milestone unless they are early-stage reports
      const targets = type === "M3" ? ms : ms.slice(-1);
      for (const m of targets.length ? targets : [undefined]) {
        rows.push({ ...emptyRow(rows.length, DISCIPLINES[d]?.role ?? "Z"), taskTeam: taskTeam || DISCIPLINES[d]?.label || "", title: m && targets.length > 1 ? `${title} — ${m.name}` : title, type, format, loin, milestone: m?.code ?? "", due: m?.date ?? "", responsible: `${DISCIPLINES[d]?.label ?? d} lead`, suitability: type === "M3" ? "S1" : "S2" });
      }
    });
  }
  return numberRows(rows);
}

export const DEFAULT_MILESTONES: PlanMilestone[] = [
  { code: "M1", name: "Concept design", date: "" }, { code: "M2", name: "Spatial coordination", date: "" },
  { code: "M3", name: "Technical design", date: "" }, { code: "M4", name: "Construction / as-built", date: "" },
];

/** Combine TIDP rows from several task teams into a MIDP, keeping the task team on each row and renumbering refs. */
export const aggregateTidps = (plans: { taskTeam: string; rows: ContainerRow[] }[]): ContainerRow[] =>
  plans.flatMap((p) => p.rows.map((r) => ({ ...r, taskTeam: r.taskTeam || p.taskTeam }))).map((r, i) => ({ ...r, ref: `C${String(i + 1).padStart(3, "0")}` }));

export const CONTAINER_COLUMNS: { key: keyof ContainerRow; label: string; width: number }[] = [
  { key: "ref", label: "Ref", width: 7 }, { key: "taskTeam", label: "Task team", width: 16 }, { key: "title", label: "Title / description", width: 36 },
  { key: "volume", label: "Volume", width: 8 }, { key: "level", label: "Level", width: 7 }, { key: "type", label: "Type", width: 7 }, { key: "role", label: "Role", width: 6 },
  { key: "number", label: "Number", width: 8 }, { key: "format", label: "Format", width: 14 }, { key: "loin", label: "Level of information need", width: 18 },
  { key: "milestone", label: "Milestone", width: 10 }, { key: "start", label: "Start", width: 12 }, { key: "due", label: "Due", width: 12 },
  { key: "dependsOn", label: "Depends on", width: 12 }, { key: "responsible", label: "Responsible", width: 18 }, { key: "suitability", label: "Suitability", width: 10 }, { key: "status", label: "Status", width: 12 },
];
