// Mandatory input data for ISO 19650 documents: common project data entered once, the hard minimum without
// which no document can be generated, the inputs each document type adds, and the generation order.
// Follows the portal's "BIM Documents: Mandatory Input Data (ISO 19650)" guidance.

export interface Stage { code: string; name: string; start: string; end: string }
export interface DisciplineOrg { discipline: string; organisation: string; lead: string }
export interface Deliverable { name: string; format: string; milestone: string }

export interface ProjectData {
  // identity
  name: string; code: string; location: string; description: string;
  // client
  client: string; clientContact: string; authorisedRep: string;
  projectType: string; assetType: string;
  stages: Stage[];
  standards: string[]; nationalAnnex: string; localMandate: string;
  // project information standard
  namingFields: string[]; separator: string; statusCodes: string; revisionCodes: string;
  classification: string;
  units: string; coordinateSystem: string; basePoint: string; surveyPoint: string;
  cde: string; cdeStates: string;
  disciplines: DisciplineOrg[];
  purposes: string[];
  deliverables: Deliverable[];
  /** answers to the per-document inputs, by document kind then input key */
  docInputs: Partial<Record<DocKind, Record<string, string>>>;
  /** documents already produced, for the generation-order guide */
  generated: Partial<Record<DocKind, string>>;
}

export const NAMING_FIELDS = ["Project", "Originator", "Volume / System", "Level / Location", "Type", "Role", "Number"];
export const STANDARDS = ["ISO 19650-1", "ISO 19650-2", "ISO 19650-3", "ISO 19650-4", "ISO 19650-5", "ISO 19650-6", "ISO 7817-1 (LOIN)"];
export const CLASSIFICATIONS = ["Uniclass 2015", "OmniClass", "CoClass", "Uniformat II", "MasterFormat", "Client / local system"];
export const PROJECT_TYPES = ["Building — new build", "Building — refurbishment", "Infrastructure — linear", "Infrastructure — structures", "Utilities", "Fit-out", "Masterplan / campus"];
export const STAGE_SCHEMES: Record<string, string[]> = {
  "RIBA Plan of Work 2020": ["0 Strategic definition", "1 Preparation and briefing", "2 Concept design", "3 Spatial coordination", "4 Technical design", "5 Manufacturing and construction", "6 Handover", "7 Use"],
  "AIA phases": ["Schematic design", "Design development", "Construction documents", "Bidding / procurement", "Construction administration"],
};

export const emptyProjectData = (): ProjectData => ({
  name: "", code: "", location: "", description: "", client: "", clientContact: "", authorisedRep: "", projectType: "", assetType: "",
  stages: [], standards: ["ISO 19650-1", "ISO 19650-2"], nationalAnnex: "", localMandate: "",
  namingFields: [...NAMING_FIELDS], separator: "-", statusCodes: "S0–S7, A, B, CR (UK National Annex)", revisionCodes: "P01, P02 … (preliminary) · C01, C02 … (contractual)",
  classification: "", units: "Millimetres (mm)", coordinateSystem: "", basePoint: "", surveyPoint: "", cde: "", cdeStates: "WIP → Shared → Published → Archived",
  disciplines: [], purposes: [], deliverables: [], docInputs: {}, generated: {},
});

/** The eight inputs without which no document can be generated; each returns a reason when not met. */
export const HARD_MINIMUM: { id: string; label: string; check: (p: ProjectData) => string | null }[] = [
  { id: "identity", label: "Project name, code and client", check: (p) => (!p.name.trim() || !p.code.trim() || !p.client.trim() ? `Missing ${[!p.name.trim() && "name", !p.code.trim() && "code", !p.client.trim() && "client"].filter(Boolean).join(", ")}` : null) },
  { id: "stages", label: "Project stages with dates", check: (p) => (!p.stages.some((s) => s.name.trim() && (s.start || s.end)) ? "Add at least one stage with a date" : null) },
  { id: "disciplines", label: "Disciplines and responsible organisations", check: (p) => (!p.disciplines.some((d) => d.discipline.trim() && d.organisation.trim()) ? "Add at least one discipline with its organisation" : null) },
  { id: "purposes", label: "Information purposes (uses of BIM)", check: (p) => (!p.purposes.length ? "Choose at least one information purpose" : null) },
  { id: "naming", label: "Naming convention fields", check: (p) => (p.namingFields.filter((f) => f.trim()).length < 3 ? "Define at least three naming fields" : null) },
  { id: "classification", label: "Classification system", check: (p) => (!p.classification.trim() ? "Choose a classification system" : null) },
  { id: "cde", label: "CDE platform", check: (p) => (!p.cde.trim() ? "Name the CDE platform" : null) },
  { id: "deliverables", label: "Deliverables list with formats and milestones", check: (p) => (!p.deliverables.some((d) => d.name.trim() && d.format.trim() && d.milestone.trim()) ? "Add at least one deliverable with a format and a milestone" : null) },
];

export const hardMinimumGaps = (p: ProjectData) => HARD_MINIMUM.map((h) => ({ ...h, reason: h.check(p) })).filter((h) => h.reason);

// ---------------------------------------------------------------- document-specific inputs

export type DocKind = "OIR" | "AIR" | "PIR" | "EIR" | "BEP-PRE" | "TIDP" | "MIDP" | "BEP-POST";
export interface DocInput { key: string; label: string; required: boolean; hint: string; long?: boolean }

export const DOC_INPUTS: Partial<Record<DocKind, DocInput[]>> = {
  AIR: [
    { key: "purpose", label: "Why the owner needs the data (FM, maintenance, lifecycle cost, compliance)", required: true, hint: "e.g. planned maintenance in Planon, statutory compliance, lifecycle replacement planning", long: true },
    { key: "breakdown", label: "Asset breakdown: systems, spaces and component types to track", required: true, hint: "e.g. HVAC plant, lifts, fire systems, all rooms; exclude finishes", long: true },
    { key: "attributes", label: "Attributes required per asset type", required: true, hint: "e.g. manufacturer, model, serial, install date, warranty, maintenance interval", long: true },
    { key: "format", label: "Delivery format and target CAFM / CMMS system", required: true, hint: "e.g. COBie 2.4 XLSX + IFC 4 into Planon" },
    { key: "loin", label: "Level of information need for operational data", required: false, hint: "e.g. LOD 300 geometry, full COBie attributes, O&M manuals per asset" },
    { key: "handover", label: "Handover milestone and who validates the data", required: true, hint: "e.g. Stage 6, validated by the client FM data manager" },
  ],
  EIR: [
    { key: "purposesPerStage", label: "Information purposes per stage", required: true, hint: "e.g. Stage 3: clash detection, cost; Stage 4: 4D, specification; Stage 6: FM", long: true },
    { key: "decisionPoints", label: "Key decision points and the information needed at each", required: true, hint: "e.g. planning submission, stage 4 sign-off, practical completion", long: true },
    { key: "loin", label: "Level of information need per element or stage (geometry, alphanumeric, documentation)", required: true, hint: "Summary or reference to a LOIN matrix", long: true },
    { key: "acceptance", label: "Acceptance criteria and the review / approval process", required: true, hint: "e.g. IDS checks pass, no critical clashes, client review within 10 working days", long: true },
    { key: "reference", label: "Reference information and shared resources the client provides", required: false, hint: "e.g. topographical survey, existing models, templates, object library" },
    { key: "security", label: "Security requirements (ISO 19650-5), if sensitive", required: false, hint: "e.g. not sensitive, or security management plan required" },
    { key: "constraints", label: "Software and hardware constraints imposed", required: false, hint: "e.g. Revit 2025, ACC only, no cloud outside the UK" },
  ],
  "BEP-PRE": [
    { key: "team", label: "Lead appointed party and the full delivery team (companies, roles, contacts)", required: true, hint: "One line per company", long: true },
    { key: "roles", label: "Information manager, BIM coordinator and task team leaders", required: true, hint: "Names or roles" },
    { key: "responsibility", label: "Responsibility matrix: who produces which models and deliverables", required: true, hint: "Summary, or attach the matrix", long: true },
    { key: "federation", label: "Federation strategy and model breakdown (volumes, zones, disciplines)", required: true, hint: "e.g. one model per discipline per building, zones A–C" },
    { key: "methods", label: "Methods and procedures (modelling standards, coordination, clash frequency, QA)", required: true, hint: "e.g. weekly clash runs in Navisworks, model QA before each share", long: true },
    { key: "software", label: "Software list with versions and IFC export settings", required: true, hint: "e.g. Revit 2025, Navisworks 2025, IFC 4 Reference View" },
    { key: "capability", label: "Delivery team capability and capacity", required: false, hint: "e.g. 12 trained Revit users, ISO 19650 certified IM" },
    { key: "risks", label: "Risks to information delivery", required: false, hint: "Top risks and mitigations" },
    { key: "mobilisation", label: "Mobilisation plan (testing the CDE and exchanges before production)", required: false, hint: "e.g. week 1 CDE set-up, week 2 test exchange of each discipline model" },
  ],
  TIDP: [
    { key: "taskTeam", label: "Task team name and discipline", required: true, hint: "e.g. Structure — ABC Engineers" },
    { key: "durations", label: "Production durations and dependencies on other teams", required: true, hint: "e.g. structure model needs architectural grid by week 3", long: true },
    { key: "author", label: "Responsible author(s)", required: true, hint: "Names or roles" },
    { key: "suitability", label: "Required status / suitability code at delivery", required: true, hint: "e.g. S2 for information, S3 for review, A at stage sign-off" },
  ],
  MIDP: [
    { key: "programme", label: "Overall project milestones and programme alignment", required: true, hint: "e.g. aligned to the contractor's programme rev C", long: true },
    { key: "conflicts", label: "Dependencies and resolution of conflicts between teams", required: true, hint: "How clashes in dates between TIDPs were resolved", long: true },
    { key: "signoff", label: "Lead appointed party sign-off", required: true, hint: "Name and role of the person signing off" },
    { key: "risks", label: "Risks to delivery dates", required: false, hint: "Top risks and mitigations" },
  ],
};
DOC_INPUTS["BEP-POST"] = DOC_INPUTS["BEP-PRE"]!.map((x) => (x.key === "capability" ? { ...x, required: false } : x));

/** Which document kind a free-text document type refers to (for the per-document inputs and the order guide). */
export function docKind(docType: string): DocKind | undefined {
  const d = docType.toLowerCase();
  if (/\boir\b|organi[sz]ational information/.test(d)) return "OIR";
  if (/\bair\b|asset information requirements/.test(d)) return "AIR";
  if (/\bpir\b|project information requirements/.test(d)) return "PIR";
  if (/\beir\b|exchange information/.test(d)) return "EIR";
  if (/\bbep\b|execution plan/.test(d)) return /post/.test(d) ? "BEP-POST" : "BEP-PRE";
  if (/\btidp\b|task information delivery/.test(d)) return "TIDP";
  if (/\bmidp\b|master information delivery/.test(d)) return "MIDP";
}

export const missingDocInputs = (p: ProjectData, kind: DocKind | undefined) =>
  !kind ? [] : (DOC_INPUTS[kind] ?? []).filter((i) => i.required && !(p.docInputs[kind]?.[i.key] ?? "").trim()).map((i) => i.label);

// ---------------------------------------------------------------- generation order

export const ORDER: { kind: DocKind; label: string; needs: DocKind[] }[] = [
  { kind: "OIR", label: "OIR — organisational information requirements", needs: [] },
  { kind: "AIR", label: "AIR / PIR — asset and project information requirements", needs: ["OIR"] },
  { kind: "EIR", label: "EIR — exchange information requirements", needs: ["AIR"] },
  { kind: "BEP-PRE", label: "BEP, pre-appointment (tender response)", needs: ["EIR"] },
  { kind: "TIDP", label: "TIDPs, one per task team", needs: ["BEP-PRE"] },
  { kind: "MIDP", label: "MIDP, aggregated from the TIDPs", needs: ["TIDP"] },
  { kind: "BEP-POST", label: "BEP, post-appointment (confirmed)", needs: ["MIDP"] },
];
const orderKind = (k: DocKind): DocKind => (k === "PIR" ? "AIR" : k);
/** Earlier documents in the chain that have not been produced yet. */
export function missingPrerequisites(p: ProjectData, kind: DocKind | undefined): DocKind[] {
  if (!kind) return [];
  const out: DocKind[] = []; const seen = new Set<DocKind>();
  const walk = (k: DocKind) => { for (const n of ORDER.find((o) => o.kind === orderKind(k))?.needs ?? []) { if (seen.has(n)) continue; seen.add(n); if (!p.generated[n] && !(n === "AIR" && p.generated.PIR)) out.push(n); walk(n); } };
  walk(kind);
  return out.reverse();
}

// ---------------------------------------------------------------- AI brief

export function projectDataText(p: ProjectData, kind?: DocKind) {
  const lines = [
    `PROJECT: ${p.name} (${p.code})${p.location ? ` — ${p.location}` : ""}`, p.description && `Description: ${p.description}`,
    `Client (appointing party): ${p.client}${p.clientContact ? `; contact ${p.clientContact}` : ""}${p.authorisedRep ? `; authorised representative ${p.authorisedRep}` : ""}`,
    (p.projectType || p.assetType) && `Project type: ${p.projectType}${p.assetType ? `; asset type: ${p.assetType}` : ""}`,
    p.stages.length && `Stages: ${p.stages.map((s) => `${s.code ? s.code + " " : ""}${s.name}${s.start || s.end ? ` (${[s.start, s.end].filter(Boolean).join(" to ")})` : ""}`).join("; ")}`,
    `Standards: ${p.standards.join(", ")}${p.nationalAnnex ? `; National Annex: ${p.nationalAnnex}` : ""}${p.localMandate ? `; local mandate: ${p.localMandate}` : ""}`,
    `Naming convention: ${p.namingFields.filter(Boolean).join(p.separator || "-")} · status codes ${p.statusCodes} · revisions ${p.revisionCodes}`,
    `Classification: ${p.classification}`,
    [p.units && `units ${p.units}`, p.coordinateSystem && `coordinate system ${p.coordinateSystem}`, p.basePoint && `project base point ${p.basePoint}`, p.surveyPoint && `survey point ${p.surveyPoint}`].filter(Boolean).join(", "),
    `CDE: ${p.cde} (${p.cdeStates})`,
    p.disciplines.length && `Disciplines and organisations: ${p.disciplines.map((d) => `${d.discipline} — ${d.organisation}${d.lead ? ` (lead ${d.lead})` : ""}`).join("; ")}`,
    p.purposes.length && `Information purposes (uses of BIM): ${p.purposes.join(", ")}`,
    p.deliverables.length && `Deliverables: ${p.deliverables.map((d) => `${d.name} [${d.format}] at ${d.milestone}`).join("; ")}`,
  ];
  const inputs = kind ? DOC_INPUTS[kind] ?? [] : [];
  const answers = inputs.map((i) => ({ i, v: (p.docInputs[kind!]?.[i.key] ?? "").trim() })).filter((x) => x.v);
  if (answers.length) lines.push(`\n${kind} INPUTS FROM THE AUTHOR:`, ...answers.map(({ i, v }) => `- ${i.label}: ${v}`));
  return lines.filter(Boolean).join("\n");
}
