// Specialist calculators: BIM fee estimator, embodied-carbon estimator and readiness assessments.
// Figures are indicative planning values, editable by the user — not a substitute for a QS or LCA.

// ---------------------------------------------------------------- BIM fee estimator

export interface FeeService { id: string; label: string; daysPer1000m2: number; minDays: number }
export const FEE_SERVICES: FeeService[] = [
  { id: "im", label: "Information management function (EIR, BEP, CDE, audits)", daysPer1000m2: 1.2, minDays: 20 },
  { id: "model", label: "Discipline model authoring support", daysPer1000m2: 4, minDays: 30 },
  { id: "coord", label: "Federation & clash coordination", daysPer1000m2: 1.5, minDays: 15 },
  { id: "qa", label: "Model QA/QC reviews & validation", daysPer1000m2: 0.8, minDays: 10 },
  { id: "qto", label: "Model-based quantity take-off (5D)", daysPer1000m2: 0.9, minDays: 8 },
  { id: "4d", label: "4D planning & simulation", daysPer1000m2: 0.7, minDays: 10 },
  { id: "cobie", label: "Asset information / COBie delivery", daysPer1000m2: 0.8, minDays: 10 },
  { id: "asbuilt", label: "As-built (record) models", daysPer1000m2: 1.2, minDays: 10 },
  { id: "scan", label: "Scan-to-BIM of existing conditions", daysPer1000m2: 2, minDays: 5 },
];
export const COMPLEXITY = { Simple: 0.8, Standard: 1, Complex: 1.3, "Highly complex": 1.6 } as const;

export function estimateFee(input: { areaM2: number; complexity: keyof typeof COMPLEXITY; services: string[]; dayRate: number; months: number }) {
  const k = COMPLEXITY[input.complexity] ?? 1;
  const lines = FEE_SERVICES.filter((s) => input.services.includes(s.id)).map((s) => {
    const days = Math.round(Math.max(s.minDays, (input.areaM2 / 1000) * s.daysPer1000m2) * k);
    return { id: s.id, label: s.label, days, cost: days * input.dayRate };
  });
  const days = lines.reduce((a, l) => a + l.days, 0);
  const cost = days * input.dayRate;
  return { lines, days, cost, perM2: input.areaM2 ? cost / input.areaM2 : 0, fte: input.months ? days / (input.months * 20) : 0 };
}

// ---------------------------------------------------------------- embodied carbon (A1–A3)

export interface CarbonMaterial { id: string; label: string; unit: string; factor: number /* kgCO2e per unit */ }
/** Typical cradle-to-gate factors (indicative; replace with EPD values where available). */
export const CARBON_MATERIALS: CarbonMaterial[] = [
  { id: "c32", label: "Concrete C32/40 (in-situ)", unit: "m³", factor: 310 },
  { id: "c40", label: "Concrete C40/50 (in-situ)", unit: "m³", factor: 360 },
  { id: "c32ggbs", label: "Concrete C32/40, 50% GGBS", unit: "m³", factor: 190 },
  { id: "rebar", label: "Reinforcement steel", unit: "t", factor: 1990 },
  { id: "steel", label: "Structural steel sections", unit: "t", factor: 1550 },
  { id: "block", label: "Concrete blockwork", unit: "m²", factor: 28 },
  { id: "brick", label: "Clay brickwork", unit: "m²", factor: 55 },
  { id: "glass", label: "Double glazing", unit: "m²", factor: 35 },
  { id: "alu", label: "Aluminium (curtain wall framing)", unit: "t", factor: 9200 },
  { id: "timber", label: "Glulam / CLT timber", unit: "m³", factor: 230 },
  { id: "plaster", label: "Plasterboard partitions", unit: "m²", factor: 9 },
  { id: "screed", label: "Cement screed 75 mm", unit: "m²", factor: 18 },
  { id: "duct", label: "Galvanised ductwork", unit: "t", factor: 2700 },
  { id: "pipe", label: "Copper pipework", unit: "t", factor: 3800 },
];

export function estimateCarbon(rows: { materialId: string; qty: number; factor?: number }[], gifaM2: number) {
  const lines = rows.map((r) => {
    const m = CARBON_MATERIALS.find((x) => x.id === r.materialId);
    const factor = r.factor ?? m?.factor ?? 0;
    return { ...r, label: m?.label ?? r.materialId, unit: m?.unit ?? "", factor, kg: r.qty * factor };
  });
  const totalKg = lines.reduce((a, l) => a + l.kg, 0);
  const perM2 = gifaM2 ? totalKg / gifaM2 : 0;
  // indicative bands for upfront (A1–A5) building carbon, kgCO2e/m² GIFA
  const band = !gifaM2 ? "—" : perM2 < 350 ? "A (excellent)" : perM2 < 550 ? "B (good)" : perM2 < 750 ? "C (typical)" : perM2 < 950 ? "D (high)" : "E (very high)";
  return { lines, totalKg, perM2, band };
}

// ---------------------------------------------------------------- readiness assessments

export interface Assessment { id: string; title: string; intro: string; areas: { area: string; questions: string[] }[] }
const A = (id: string, title: string, intro: string, areas: [string, string[]][]): Assessment => ({ id, title, intro, areas: areas.map(([area, questions]) => ({ area, questions })) });

export const ASSESSMENTS: Assessment[] = [
  A("maturity", "Organisation BIM / ISO 19650 maturity", "How far ISO 19650 is embedded in your organisation.", [
    ["Strategy & leadership", ["Leadership sponsors information management", "There is a documented BIM / information management strategy", "Roles for information management are defined and resourced"]],
    ["Process", ["Standard BEP, MIDP/TIDP and responsibility matrix templates are used", "A CDE workflow (WIP/Shared/Published/Archived) is enforced", "Naming, status and revision conventions are applied on every project"]],
    ["People", ["Staff are trained on ISO 19650 roles and processes", "Competence is assessed and recorded", "Lessons learned are captured and reused"]],
    ["Technology", ["Authoring and coordination software is standardised", "Model QA/QC and validation are automated", "Asset information (COBie/AIR) can be delivered and checked"]],
  ]),
  A("dt", "Digital twin readiness", "Readiness of an asset owner to operate a digital twin.", [
    ["Asset information", ["An AIM exists with unique asset tags", "Asset data follows a structured standard (e.g. COBie / AIR)", "As-built geometry is verified"]],
    ["Data & integration", ["BMS / IoT points are identified per asset", "Systems (CAFM, BMS, ERP) exchange data", "Data ownership and quality rules are defined"]],
    ["Use cases", ["Priority operational use cases are defined", "Benefits and KPIs are measurable", "Operations staff are engaged"]],
    ["Governance & security", ["Security-minded approach (ISO 19650-5) is in place", "Access and change control for the twin exist", "Funding for operation is secured"]],
  ]),
  A("scan", "Scan-to-BIM readiness", "Readiness to capture and model existing conditions.", [
    ["Scope", ["Purpose and level of accuracy are defined", "Areas, access and constraints are known", "Required LOD / LOIN for the model is defined"]],
    ["Survey control", ["Survey control network and coordinate system are agreed", "Registration accuracy targets are set", "Point cloud formats and delivery are specified"]],
    ["Modelling & QA", ["Modelling standards and tolerances are defined", "Deviation analysis (cloud vs model) is planned", "Responsibility for verification is assigned"]],
  ]),
];

export const MATURITY_LEVELS = ["0 — Not started", "1 — Initial", "2 — Developing", "3 — Defined", "4 — Managed", "5 — Optimised"];

/** Answers 0–5 per question; returns per-area and overall average and a level label. */
export function scoreAssessment(a: Assessment, answers: Record<string, number>) {
  const areas = a.areas.map((ar, i) => {
    const vals = ar.questions.map((_, j) => answers[`${i}.${j}`]).filter((v): v is number => typeof v === "number");
    return { area: ar.area, score: vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : 0, answered: vals.length, total: ar.questions.length };
  });
  const answered = areas.filter((x) => x.answered);
  const overall = answered.length ? answered.reduce((x, y) => x + y.score, 0) / answered.length : 0;
  const weakest = [...answered].sort((x, y) => x.score - y.score)[0]?.area ?? "";
  return { areas, overall, level: MATURITY_LEVELS[Math.round(overall)], weakest };
}
