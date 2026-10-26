import type { DocTemplate } from "./data/types";
import type { Finding } from "./delivery";
import { validateContainerName } from "./naming";

type Values = Record<string, unknown>;
const PLACEHOLDER = /\b(TBC|TBD|XXX|lorem ipsum|insert here)\b|\[\s*[^\]]{0,30}\s*\]/i;
const rowsOf = (v: unknown) => (Array.isArray(v) ? (v as string[][]).filter((r) => Array.isArray(r) && r.some((c) => String(c).trim())) : []);

// Template-specific rules that encode what ISO 19650-2 / ISO/IEC 42001 expect each document to contain.
const RULES: Record<string, (v: Values) => Finding[]> = {
  eir: (v) => [
    ...(rowsOf(v.purposes).length < 2 ? [{ severity: "warning" as const, area: "Content", message: "List at least two information purposes with key decision points.", clause: "19650-2 5.2.1" }] : []),
    ...(rowsOf(v.milestones).length === 0 ? [{ severity: "error" as const, area: "Content", message: "No information delivery milestones in the EIR.", clause: "19650-2 5.1.3" }] : []),
    ...(rowsOf(v.milestones).some((r) => !r[1]) ? [{ severity: "warning" as const, area: "Content", message: "Some milestones have no date." }] : []),
    ...(rowsOf(v.loin).length === 0 ? [{ severity: "error" as const, area: "Content", message: "Level of information need is not defined.", clause: "ISO 7817-1" }] : []),
    ...(!String(v.acceptanceCriteria ?? "").trim() ? [{ severity: "error" as const, area: "Content", message: "Acceptance criteria are missing — the appointing party cannot accept deliverables without them.", clause: "19650-2 5.2.1 c" }] : []),
  ],
  "bep-pre": (v) => [
    ...(rowsOf(v.team).length === 0 ? [{ severity: "error" as const, area: "Content", message: "Proposed delivery team is empty.", clause: "19650-2 5.3.2" }] : []),
    ...(!String(v.federation ?? "").trim() ? [{ severity: "error" as const, area: "Content", message: "Proposed federation strategy is missing.", clause: "19650-2 5.3.2" }] : []),
    ...(rowsOf(v.hlrm).length === 0 ? [{ severity: "warning" as const, area: "Content", message: "High-level responsibility matrix is empty." }] : []),
  ],
  "bep-post": (v) => [
    ...(rowsOf(v.people).some((r) => !r[1]) ? [{ severity: "error" as const, area: "Content", message: "Information management roles must name individuals after appointment.", clause: "19650-2 5.4.1" }] : []),
    ...(rowsOf(v.breakdown).length === 0 ? [{ severity: "warning" as const, area: "Content", message: "Container breakdown structure is empty." }] : []),
    ...(!String(v.midpRef ?? "").trim() ? [{ severity: "warning" as const, area: "Consistency", message: "BEP does not reference the MIDP." }] : []),
  ],
  midp: (v) => [
    ...(rowsOf(v.plan).length === 0 ? [{ severity: "error" as const, area: "Content", message: "MIDP has no containers. Use the delivery planner to generate it.", clause: "19650-2 5.4.5" }] : []),
  ],
  tidp: (v) => [
    ...(rowsOf(v.containers).some((r) => !r[5]) ? [{ severity: "warning" as const, area: "Content", message: "Some TIDP containers have no due date." }] : []),
  ],
  "ai-soa": (v) => {
    const rows = rowsOf(v.controls);
    const f: Finding[] = [];
    const excluded = rows.filter((r) => /^n/i.test(r[2] ?? ""));
    if (excluded.some((r) => !String(r[3] ?? "").trim())) f.push({ severity: "error", area: "Content", message: `${excluded.filter((r) => !String(r[3] ?? "").trim()).length} excluded controls have no justification.`, clause: "42001 6.1.3 d" });
    if (rows.some((r) => !/^[yn]/i.test(r[2] ?? ""))) f.push({ severity: "warning", area: "Content", message: "Some controls have no applicability decision (Y/N)." });
    if (rows.length < 38) f.push({ severity: "warning", area: "Content", message: `Only ${rows.length} of 38 Annex A controls listed.` });
    return f;
  },
  "ai-risk": (v) => {
    const rows = rowsOf(v.risks);
    return [
      ...(rows.length === 0 ? [{ severity: "error" as const, area: "Content", message: "No AI risks recorded.", clause: "42001 6.1.2" }] : []),
      ...(rows.some((r) => !r[7]) ? [{ severity: "warning" as const, area: "Content", message: "Some risks have no treatment.", clause: "42001 6.1.3" }] : []),
      ...(rows.some((r) => !r[9]) ? [{ severity: "warning" as const, area: "Content", message: "Some risks have no owner." }] : []),
    ];
  },
  "ai-impact": (v) => [
    ...(rowsOf(v.indImpacts).length === 0 ? [{ severity: "error" as const, area: "Content", message: "Impacts on individuals or groups not assessed.", clause: "42001 A.5.4" }] : []),
    ...(rowsOf(v.socImpacts).length === 0 ? [{ severity: "warning" as const, area: "Content", message: "Societal impacts not assessed.", clause: "42001 A.5.5" }] : []),
  ],
  "ai-policy": (v) => [
    ...(!String(v.approvedBy ?? "").trim() ? [{ severity: "error" as const, area: "Approval", message: "AI policy has no top management approval.", clause: "42001 5.2" }] : []),
  ],
};

/** Completeness and content checks for one controlled document. */
export function checkDocument(t: DocTemplate, values: Values, meta: { containerName: string; projectCode: string }): Finding[] {
  const f: Finding[] = [];
  if (!meta.containerName) f.push({ severity: "warning", area: "Naming", message: "Document has no container name / number." });
  else {
    const errs = validateContainerName(meta.containerName, meta.projectCode);
    if (errs.length) f.push({ severity: "error", area: "Naming", message: errs.join(" ") });
  }
  let empty = 0;
  for (const s of t.sections) for (const field of s.fields) {
    const v = values[field.id];
    const isEmpty = field.type === "table" ? rowsOf(v).length === 0 : !String(v ?? "").trim();
    if (isEmpty) { empty++; f.push({ severity: "warning", area: s.title, message: `"${field.label}" is empty.` }); continue; }
    const text = field.type === "table" ? rowsOf(v).flat().join(" ") : String(v);
    if (PLACEHOLDER.test(text)) f.push({ severity: "warning", area: s.title, message: `"${field.label}" contains placeholder text (TBC / XXX / [ ]).` });
  }
  if (empty === t.sections.reduce((n, s) => n + s.fields.length, 0)) return [{ severity: "error", area: "Content", message: "Document is empty." }];
  return [...f, ...(RULES[t.id]?.(values) ?? [])];
}

/** Project-level checks across documents: required document set per standard and cross-document consistency. */
export function checkProjectSet(input: { standards: string[]; docs: { templateId: string; state: string; title: string }[]; milestoneCount: number; planCount: number }): Finding[] {
  const f: Finding[] = [];
  const has = (id: string) => input.docs.some((d) => d.templateId === id);
  const required19650: [string, string, string][] = [
    ["eir", "Exchange Information Requirements", "19650-2 5.2.1"], ["info-standard", "Project Information Standard", "19650-2 5.1.4"],
    ["info-protocol", "Information Protocol", "19650-2 5.1.8"], ["bep-post", "Post-appointment BEP", "19650-2 5.4.1"],
    ["resp-matrix", "Detailed Responsibility Matrix", "19650-2 5.4.2"], ["midp", "MIDP", "19650-2 5.4.5"],
  ];
  const required42001: [string, string, string][] = [
    ["ai-context", "Context & AIMS scope", "42001 4.3"], ["ai-policy", "AI policy", "42001 5.2"], ["ai-risk", "AI risk assessment", "42001 6.1.2"],
    ["ai-impact", "AI system impact assessment", "42001 6.1.4"], ["ai-soa", "Statement of Applicability", "42001 6.1.3"], ["ai-objectives", "AI objectives", "42001 6.2"],
  ];
  if (input.standards.includes("iso19650")) {
    for (const [id, name, clause] of required19650) if (!has(id)) f.push({ severity: "warning", area: "Document set", message: `${name} has not been created.`, clause });
    if (input.milestoneCount === 0) f.push({ severity: "warning", area: "Delivery plan", message: "No delivery milestones in the planner.", clause: "19650-2 5.1.3" });
    if (has("midp") && input.planCount === 0) f.push({ severity: "warning", area: "Consistency", message: "An MIDP document exists but the delivery planner is empty — generate the MIDP from the planner to keep them aligned." });
  }
  if (input.standards.includes("iso42001")) for (const [id, name, clause] of required42001) if (!has(id)) f.push({ severity: "warning", area: "Document set", message: `${name} has not been created.`, clause });
  return f;
}
