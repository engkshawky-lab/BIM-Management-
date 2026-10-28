// Controlled document data: what the author must provide before any document or plan is generated.
// The values are written into the cover page, the document control table and every export.

export interface DocData {
  projectName: string; reference: string; version: string; organisation: string; orgRole: string; stage: string; status: string; preparedBy: string;
  projectCode: string; appointingParty: string; checkedBy: string; approvedBy: string; issueDate: string; security: string; informationManager: string; cde: string;
}

export const ORG_ROLES = ["Appointing party", "Lead appointed party", "Appointed party (task team)", "Information management consultant for the appointing party"];
export const STAGES = ["0 Strategic definition", "1 Preparation and briefing", "2 Concept design", "3 Spatial coordination", "4 Technical design", "5 Manufacturing and construction", "6 Handover", "7 Use (operational phase)"];
export const DOC_STATUSES = ["Draft for review", "S0 Work in progress", "S1 Shared for coordination", "S2 Shared for information", "S3 Shared for review and comment", "S4 Shared for stage approval", "A Published (authorized and accepted)"];
export const SECURITY = ["Not sensitive", "Sensitive — need-to-know (ISO 19650-5)", "Commercially confidential"];

export const REQUIRED: { key: keyof DocData; label: string; placeholder: string }[] = [
  { key: "projectName", label: "Project name", placeholder: "e.g. Riverside Clinic" },
  { key: "reference", label: "Document reference", placeholder: "e.g. RVC-ABC-ZZ-XX-RP-Z-0001" },
  { key: "version", label: "Version / revision", placeholder: "P01" },
  { key: "organisation", label: "Organisation name", placeholder: "Your organisation" },
  { key: "orgRole", label: "Organisation role", placeholder: "" },
  { key: "stage", label: "Project stage", placeholder: "" },
  { key: "status", label: "Status", placeholder: "" },
  { key: "preparedBy", label: "Prepared by", placeholder: "Name / role" },
];
export const OPTIONAL: { key: keyof DocData; label: string; placeholder: string }[] = [
  { key: "projectCode", label: "Project code", placeholder: "e.g. RVC" },
  { key: "appointingParty", label: "Appointing party (document owner)", placeholder: "Client organisation" },
  { key: "checkedBy", label: "Checked by", placeholder: "Name / role" },
  { key: "approvedBy", label: "Approved by", placeholder: "Name / role" },
  { key: "issueDate", label: "Issue date", placeholder: "" },
  { key: "security", label: "Security classification", placeholder: "" },
  { key: "informationManager", label: "Information manager", placeholder: "Name / organisation" },
  { key: "cde", label: "CDE platform", placeholder: "e.g. Autodesk Construction Cloud" },
];

export const emptyDocData = (): DocData => ({ projectName: "", reference: "", version: "P01", organisation: "", orgRole: "", stage: "", status: "Draft for review", preparedBy: "", projectCode: "", appointingParty: "", checkedBy: "", approvedBy: "", issueDate: "", security: "", informationManager: "", cde: "" });

/** Labels of required fields that are still empty. */
export const missingDocData = (d: DocData) => REQUIRED.filter((f) => !String(d[f.key] ?? "").trim()).map((f) => f.label);

/** Suggested reference for a document type, e.g. RVC-EIR-001. */
export const suggestReference = (d: Pick<DocData, "projectCode" | "projectName">, code: string) =>
  `${(d.projectCode || d.projectName.replace(/[^A-Za-z0-9]/g, "").slice(0, 4) || "PROJ").toUpperCase()}-${code.toUpperCase()}-001`;

/** Plain-text block describing the document data, for AI prompts. */
export const docDataText = (d: DocData) => [
  `Project: ${d.projectName}${d.projectCode ? ` (${d.projectCode})` : ""}`, `Document reference: ${d.reference} · version ${d.version} · status ${d.status}`,
  `Author organisation: ${d.organisation} — role: ${d.orgRole}`, `Project stage: ${d.stage}`, `Prepared by: ${d.preparedBy}`,
  d.appointingParty && `Appointing party: ${d.appointingParty}`, d.informationManager && `Information manager: ${d.informationManager}`, d.cde && `CDE platform: ${d.cde}`, d.security && `Security classification: ${d.security}`,
].filter(Boolean).join("\n");
