// Model QA/QC reviews (ISO 19650-2 §5.6.3 check before sharing). Each check has a priority
// weight; each result is graded A–D. The score is the weighted share of compliance.

export type Grade = "A" | "B" | "C" | "D" | "NA";
export type Priority = 1 | 2 | 3; // 3 = critical

export interface QaCheck { id: string; area: string; text: string; priority: Priority }
export interface QaResult { grade: Grade | ""; comment: string }

export const GRADES: { g: Grade; label: string; value: number }[] = [
  { g: "A", label: "Compliant", value: 1 },
  { g: "B", label: "Minor issues", value: 0.75 },
  { g: "C", label: "Major issues", value: 0.4 },
  { g: "D", label: "Not compliant", value: 0 },
  { g: "NA", label: "Not applicable", value: NaN },
];
const VALUE = Object.fromEntries(GRADES.map((x) => [x.g, x.value])) as Record<Grade, number>;

const c = (prefix: string, area: string, list: [string, Priority][]): QaCheck[] => list.map(([text, priority], i) => ({ id: `${prefix}-${String(i + 1).padStart(2, "0")}`, area, text, priority }));

const GENERAL: QaCheck[] = [
  ...c("GEN", "File & setup", [
    ["File named per the project naming convention; status and revision metadata correct", 3],
    ["Shared coordinates / survey point and project base point as per the BEP", 3],
    ["Units, true north and levels/grids match the coordination model", 3],
    ["Correct authoring software version and IFC export settings", 2],
    ["Model purged: no unused families, views, imported CAD or links left over", 1],
    ["Worksets / layers named and used per the BEP", 1],
    ["Warnings reviewed; no critical warnings (duplicates, overlaps)", 2],
  ]),
  ...c("INF", "Information", [
    ["Elements classified (e.g. Uniclass) per the information requirements", 3],
    ["Level of information need met for the milestone (geometry, properties, documentation)", 3],
    ["Required parameters / property sets populated (no blanks, no placeholders)", 2],
    ["Elements hosted on the correct level and zone", 2],
    ["Asset tags / identifiers follow the client codification", 2],
    ["Spaces / rooms bounded, named and numbered", 2],
  ]),
  ...c("COR", "Coordination", [
    ["Clash tests run per the clash matrix; open clashes logged as issues", 3],
    ["Previous review comments closed or responded to", 2],
    ["Model aligned with the latest shared models of other disciplines", 2],
    ["Drawings and schedules generated from the model and consistent with it", 2],
  ]),
];

export const DISCIPLINE_CHECKS: Record<string, QaCheck[]> = {
  Architecture: c("ARC", "Architecture", [
    ["Walls, floors, roofs and ceilings modelled with correct types and build-ups", 2],
    ["Doors and windows with fire rating, acoustic and hardware data where required", 2],
    ["Vertical circulation (stairs, ramps, lifts) compliant and coordinated with structure", 2],
    ["Finishes assigned per room data sheets", 1],
    ["Fire compartments and escape routes represented", 3],
  ]),
  Structure: c("STR", "Structure", [
    ["Structural elements use correct materials, grades and sizes", 3],
    ["Columns, beams and walls continuous and connected; analytical model consistent", 2],
    ["Openings / penetrations coordinated with MEP (sleeves provided)", 3],
    ["Foundations and slabs at correct levels and thicknesses", 2],
  ]),
  MEP: c("MEP", "MEP", [
    ["Systems connected end-to-end with correct system classification", 3],
    ["Equipment with manufacturer / model / capacity data per stage", 2],
    ["Clearance and maintenance access zones modelled", 2],
    ["Insulation, slopes and gradients modelled where required", 2],
    ["Fire protection, plumbing and drainage routed and sized", 2],
    ["Electrical / ELV containment and equipment coordinated", 2],
  ]),
  Infrastructure: c("INFRA", "Infrastructure", [
    ["Alignments, profiles and corridors match the design surface", 3],
    ["Wet utilities with inverts, slopes and manholes", 3],
    ["Dry utilities (power, telecom) ducts and chambers modelled", 2],
    ["Crossings between utilities checked for vertical clearance", 3],
  ]),
  Landscape: c("LAN", "Landscape", [
    ["Hardscape and softscape areas with materials and levels", 2],
    ["Planting with species and sizes per schedule", 1],
    ["Irrigation, lighting and site furniture coordinated with utilities", 2],
    ["Site grading and drainage consistent with civil levels", 2],
  ]),
};

export const DISCIPLINES = Object.keys(DISCIPLINE_CHECKS);
export const checklistFor = (discipline: string): QaCheck[] => [...GENERAL, ...(DISCIPLINE_CHECKS[discipline] ?? [])];

export interface QaScore { score: number; grade: Grade | "—"; graded: number; total: number; counts: Record<Grade, number>; critical: number }

/** Weighted score 0–100 over graded, applicable checks; overall grade by threshold.
 *  Any critical (priority 3) check graded D caps the review at D. */
export function scoreReview(checks: QaCheck[], results: Record<string, QaResult>): QaScore {
  const counts: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0, NA: 0 };
  let w = 0, got = 0, graded = 0, critical = 0;
  for (const ch of checks) {
    const g = results[ch.id]?.grade;
    if (!g) continue;
    counts[g]++; graded++;
    if (g === "NA") continue;
    w += ch.priority; got += ch.priority * VALUE[g];
    if (g === "D" && ch.priority === 3) critical++;
  }
  const score = w ? Math.round((got / w) * 100) : 0;
  const grade: QaScore["grade"] = !w ? "—" : critical ? "D" : score >= 90 ? "A" : score >= 75 ? "B" : score >= 50 ? "C" : "D";
  return { score, grade, graded, total: checks.length, counts, critical };
}
