// ISO 19650 audit assistant: a deterministic audit checklist built from the platform's part and stage data,
// scoring of assessed items and a formal audit report in Markdown.
// The checklist is paraphrased guidance from the platform, not the standard's text. Output is decision support
// for an auditor, never certification.

import { partDetailById, type PartDetail } from "./data/parts19650Detail";
import { WF_STAGES } from "./data/workflow/stages";
import { STAGE_IDS, type StageId } from "./data/workflow/types";

export type AuditPart = 1 | 2 | 5;
export type AuditRole = "appointing" | "lead";
export type AuditStatus = "conformant" | "partially" | "nonconformant" | "not evidenced" | "not applicable";
export type AuditSeverity = "major" | "minor" | "observation";
export type ItemSource = "checklist" | "clause" | "gate";

export const AUDIT_PARTS: AuditPart[] = [1, 2, 5];
export const AUDIT_STATUSES: AuditStatus[] = ["conformant", "partially", "nonconformant", "not evidenced", "not applicable"];
export const AUDIT_SEVERITIES: AuditSeverity[] = ["major", "minor", "observation"];
export const STATUS_LABEL: Record<AuditStatus, string> = {
  conformant: "Conformant", partially: "Partially conformant", nonconformant: "Nonconformant", "not evidenced": "Not evidenced", "not applicable": "Not applicable",
};
export const SEVERITY_LABEL: Record<AuditSeverity, string> = { major: "Major", minor: "Minor", observation: "Observation" };
export const ROLE_LABEL: Record<AuditRole, string> = { appointing: "Appointing party", lead: "Lead appointed party" };
export const PART_LABEL: Record<AuditPart, string> = { 1: "ISO 19650-1 Concepts and principles", 2: "ISO 19650-2 Delivery phase", 5: "ISO 19650-5 Security-minded approach" };
export const MAX_ITEMS = 120;
export const MIN_ITEMS = 40;

export interface AuditScope { parts: AuditPart[]; role: AuditRole; stage: StageId }
export interface ChecklistItem {
  id: string;
  part: AuditPart;
  clauseOrActivity: string;
  requirement: string;
  evidenceHint: string;
  weight: number;
  source: ItemSource;
}
export interface AuditResult { id: string; status: AuditStatus; evidence: string; finding: string; action: string; severity: AuditSeverity }
export interface AuditRow extends ChecklistItem, AuditResult { edited?: boolean; aiMissing?: boolean }
export interface EvidenceEntry { file: string; describes: string }

type Party = AuditRole | "both";
interface Candidate extends ChecklistItem { party: Party; minStage: StageId; priority: number }

const stageIdx = (s: StageId) => STAGE_IDS.indexOf(s);
const stageTitle = (s: StageId) => WF_STAGES.find((x) => x.id === s)?.title ?? s;
export const STAGE_TITLE = (s: StageId) => stageTitle(s);

// ---------------------------------------------------------------- evidence hints

const HINTS: [RegExp, string][] = [
  [/\bOIR\b|organisational information/i, "OIR document"],
  [/\bAIR\b|asset information requirement/i, "AIR"],
  [/\bPIR\b|project('s)? information requirement/i, "PIR"],
  [/\bEIR\b|exchange information/i, "EIR"],
  [/\bBEP\b|execution plan/i, "BEP (pre- or post-appointment)"],
  [/\bMIDP\b|\bTIDP|delivery plan/i, "MIDP / TIDPs"],
  [/responsibility matrix|assignment matrix|every container to a task team|owner/i, "Responsibility / assignment matrix"],
  [/protocol/i, "Information protocol"],
  [/\bCDE\b|common data environment|suitability|status and revision|archiv/i, "CDE procedure, configuration screenshots or audit trail"],
  [/information standard|naming|classification|metadata|formats?\b|glossary|terms/i, "Project information standard"],
  [/milestone|programme|decision point/i, "Programme and delivery milestones"],
  [/capabilit|capacity/i, "Capability and capacity assessments"],
  [/mobilis|training|induction|software|test federation|shared coordinates/i, "Mobilisation plan, training records or test reports"],
  [/risk register|risk/i, "Information delivery risk register"],
  [/tender|evaluation|bidder/i, "Invitation to tender pack and evaluation records"],
  [/appointment|contract|clauses/i, "Appointment documents"],
  [/authoris|accept|reject/i, "Authorisation / acceptance records and transmittals"],
  [/QA\b|quality|check/i, "QA records and checklists"],
  [/clash|coordinat|federat/i, "Coordination reports and federation strategy"],
  [/sensitiv|triage|security|need-to-know|classification marking|breach|incident|aggregation|leaver/i, "Security triage / security management plan"],
  [/access/i, "CDE access group listing or screenshots"],
  [/lessons/i, "Lessons learned report"],
  [/handover|AIM\b|asset data|health and safety file/i, "Handover strategy and AIM records"],
  [/meeting|minutes|record|approved|approval/i, "Meeting minutes or approval records"],
];

function evidenceHint(text: string, outputs: string[] = []) {
  const hits: string[] = [];
  for (const [re, label] of HINTS) if (re.test(text) && !hits.includes(label)) hits.push(label);
  for (const o of outputs) if (hits.length < 3 && !hits.some((h) => h.toLowerCase().includes(o.toLowerCase()))) hits.push(o);
  return (hits.length ? hits.slice(0, 3) : ["Project procedures, meeting minutes or CDE records"]).join("; ");
}

const pad = (n: number) => String(n + 1).padStart(2, "0");
const req = (part: PartDetail["id"]) => {
  const p = partDetailById(part);
  if (!p) throw new Error(`Missing part data ${part}`);
  return p;
};

// ---------------------------------------------------------------- Part 1 (principles; apply to both roles)

const P1_APPOINTING_CHECKLIST = new Set([0, 1, 2]); // OIR, AIR/PIR, EIR per appointment
const P1_LATE: Record<number, StageId> = { 2: "tender", 5: "response", 10: "design", 11: "response", 12: "appointment" };

function part1(): Candidate[] {
  const p = req("19650-1");
  const out: Candidate[] = [];
  p.checklist.forEach((text, i) => out.push({
    id: `P1-CL-${pad(i)}`, part: 1, clauseOrActivity: "ISO 19650-1 checklist", requirement: text, evidenceHint: evidenceHint(text),
    weight: 2, source: "checklist", party: P1_APPOINTING_CHECKLIST.has(i) ? "appointing" : "both", minStage: P1_LATE[i] ?? "need", priority: 1,
  }));
  p.clauses.forEach((c, ci) => c.requirements.forEach((text, ri) => out.push({
    id: `P1-C${ci + 1}-${ri + 1}`, part: 1, clauseOrActivity: `ISO 19650-1 ${c.ref} ${c.title}`, requirement: text, evidenceHint: evidenceHint(text, c.outputs),
    weight: 1, source: "clause", party: c.ref === "Cl. 5" || c.ref === "Cl. 7" ? "appointing" : "both", minStage: "need", priority: 3,
  })));
  return out;
}

// ---------------------------------------------------------------- Part 2 (delivery activities)

/** Stage at which each ISO 19650-2 activity is carried out. */
const ACTIVITY_STAGE: Record<string, StageId> = {
  "§5.1": "need", "§5.2": "tender", "§5.3": "response", "§5.4": "appointment", "§5.5": "mobilisation",
  "§5.6": "design", "§5.7": "delivery", "§5.8": "handover", "Annex A": "appointment",
};
/** Who performs each ISO 19650-2 activity (the appointing party prepares, the lead appointed party responds and delivers). */
function activityParty(ref: string, sub: string): Party {
  if (ref === "§5.1" || ref === "§5.2") return "appointing";
  if (ref === "Annex A") return "both";
  if (sub === "5.4.6" || sub === "5.7.4" || sub === "5.8.1" || sub === "5.8.2") return "appointing";
  if (sub === "5.4.1") return "both";
  return "lead";
}
// Part 2 checklist: [party, stage] per item, in data order.
const P2_CHECKLIST: [Party, StageId][] = [
  ["appointing", "need"], ["appointing", "need"], ["appointing", "tender"], ["appointing", "tender"], ["both", "appointment"],
  ["appointing", "tender"], ["appointing", "tender"], ["appointing", "response"], ["lead", "response"], ["both", "appointment"],
  ["lead", "appointment"], ["lead", "appointment"], ["lead", "appointment"], ["lead", "mobilisation"], ["lead", "design"],
  ["both", "delivery"], ["both", "delivery"], ["both", "handover"],
];
// Stage gates: default party per stage, with overrides by gate index.
const GATE_PARTY: Record<StageId, Party> = {
  need: "appointing", tender: "appointing", response: "lead", appointment: "lead", mobilisation: "lead",
  design: "lead", construction: "lead", delivery: "both", handover: "both", operation: "appointing",
};
const GATE_OVERRIDE: Partial<Record<StageId, Record<number, Party>>> = {
  appointment: { 0: "both", 3: "both" },
  delivery: { 0: "lead", 1: "appointing" },
  handover: { 3: "appointing" },
};

function part2(): Candidate[] {
  const p = req("19650-2");
  const out: Candidate[] = [];
  p.clauses.forEach((c, ci) => c.requirements.forEach((text, ri) => {
    const sub = /^(\d\.\d\.\d)\s/.exec(text)?.[1] ?? "";
    const requirement = sub ? text.slice(sub.length).trim() : text;
    out.push({
      id: sub ? `P2-${sub}` : `P2-C${ci + 1}-${ri + 1}`, part: 2,
      clauseOrActivity: `ISO 19650-2 ${sub || c.ref} ${c.title}`, requirement, evidenceHint: evidenceHint(text, c.outputs),
      weight: 3, source: "clause", party: activityParty(c.ref, sub), minStage: ACTIVITY_STAGE[c.ref] ?? "need", priority: 2,
    });
  }));
  p.checklist.forEach((text, i) => {
    const [party, minStage] = P2_CHECKLIST[i] ?? ["both", "need"];
    out.push({ id: `P2-CL-${pad(i)}`, part: 2, clauseOrActivity: "ISO 19650-2 checklist", requirement: text, evidenceHint: evidenceHint(text), weight: 3, source: "checklist", party, minStage, priority: 1 });
  });
  for (const st of WF_STAGES) st.gate.forEach((text, i) => out.push({
    id: `P2-G-${st.id}-${i + 1}`, part: 2, clauseOrActivity: `Stage gate: ${st.title}`, requirement: text, evidenceHint: evidenceHint(text),
    weight: 2, source: "gate", party: GATE_OVERRIDE[st.id]?.[i] ?? GATE_PARTY[st.id], minStage: st.id, priority: 2,
  }));
  return out;
}

// ---------------------------------------------------------------- Part 5 (security)

// Clause index → party (asset owner = appointing party; Cl. 7 controls and Cl. 9 flow-down also bind the delivery team).
const P5_CLAUSE_PARTY: Party[] = ["appointing", "appointing", "appointing", "appointing", "both", "both", "both"];
const P5_CLAUSE_STAGE: StageId[] = ["need", "need", "need", "need", "need", "need", "tender"];
const P5_CHECKLIST: [Party, StageId][] = [
  ["appointing", "need"], ["appointing", "need"], ["appointing", "need"], ["appointing", "need"], ["both", "need"],
  ["both", "mobilisation"], ["both", "mobilisation"], ["both", "design"], ["both", "need"], ["both", "mobilisation"],
  ["appointing", "tender"], ["both", "appointment"], ["both", "mobilisation"], ["both", "design"], ["both", "design"], ["appointing", "response"],
];

function part5(): Candidate[] {
  const p = req("19650-5");
  const out: Candidate[] = [];
  p.checklist.forEach((text, i) => {
    const [party, minStage] = P5_CHECKLIST[i] ?? ["both", "need"];
    out.push({ id: `P5-CL-${pad(i)}`, part: 5, clauseOrActivity: "ISO 19650-5 checklist", requirement: text, evidenceHint: evidenceHint(text), weight: 2, source: "checklist", party, minStage, priority: 1 });
  });
  p.clauses.forEach((c, ci) => c.requirements.forEach((text, ri) => out.push({
    id: `P5-C${ci + 1}-${ri + 1}`, part: 5, clauseOrActivity: `ISO 19650-5 ${c.ref} ${c.title}`, requirement: text, evidenceHint: evidenceHint(text, c.outputs),
    weight: 2, source: "clause", party: P5_CLAUSE_PARTY[ci] ?? "both", minStage: P5_CLAUSE_STAGE[ci] ?? "need", priority: 2,
  })));
  return out;
}

// ---------------------------------------------------------------- build

const STOP = new Set(["the", "and", "for", "each", "every", "with", "that", "are", "is", "a", "an", "of", "to", "in", "on", "by", "or", "be", "has", "have", "been", "its", "from", "into", "where", "exist", "exists", "are", "is", "was", "were"]);
const tokens = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ies|es|s)$/, "")));
function similar(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return false;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter) >= 0.7;
}

/**
 * Deterministic audit checklist for a scope: the selected parts' checklists, clause requirements and the stage gates
 * reached, filtered by the audited role and the stage reached, de-duplicated and capped at MAX_ITEMS.
 * Same scope → same items, ids and order.
 */
export function buildChecklist(scope: AuditScope): ChecklistItem[] {
  const parts = AUDIT_PARTS.filter((p) => scope.parts.includes(p));
  const reached = stageIdx(scope.stage) < 0 ? STAGE_IDS.length - 1 : stageIdx(scope.stage);
  const all: Candidate[] = [...(parts.includes(1) ? part1() : []), ...(parts.includes(2) ? part2() : []), ...(parts.includes(5) ? part5() : [])];
  const inStage = all.filter((c) => stageIdx(c.minStage) <= reached);
  const rank = (list: Candidate[]) => [...list].sort((a, b) => a.priority - b.priority || inStage.indexOf(a) - inStage.indexOf(b));
  const own = rank(inStage.filter((c) => c.party === "both" || c.party === scope.role));
  const others = rank(inStage.filter((c) => c.party !== "both" && c.party !== scope.role));

  // de-duplicate within a part, keeping the higher-priority (then earlier) item
  const kept: Candidate[] = [];
  const seen: { part: AuditPart; tok: Set<string> }[] = [];
  const add = (c: Candidate) => {
    const tok = tokens(c.requirement);
    if (seen.some((s) => s.part === c.part && similar(s.tok, tok))) return;
    seen.push({ part: c.part, tok });
    kept.push(c);
  };
  own.forEach(add);
  // A narrow scope still needs depth: pad to MIN_ITEMS with the interface items the audited party receives or reviews.
  for (const c of others) { if (kept.length >= MIN_ITEMS) break; add(c); }

  // cap: share MAX_ITEMS across parts in proportion to their size, filling each by priority
  let final = kept;
  if (kept.length > MAX_ITEMS) {
    const byPart = parts.map((p) => kept.filter((c) => c.part === p));
    const quotas = byPart.map((l) => Math.floor((MAX_ITEMS * l.length) / kept.length));
    let spare = MAX_ITEMS - quotas.reduce((a, b) => a + b, 0);
    for (let i = 0; spare > 0; i = (i + 1) % quotas.length) if (quotas[i] < byPart[i].length) { quotas[i]++; spare--; }
    const pick = new Set(byPart.flatMap((l, i) => l.slice(0, quotas[i]))); // l is already in priority order
    final = kept.filter((c) => pick.has(c));
  }
  const order = new Map(all.map((c, i) => [c.id, i]));
  return final
    .sort((a, b) => parts.indexOf(a.part) - parts.indexOf(b.part) || (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map(({ party: _p, minStage: _m, priority: _r, ...item }) => item);
}

// ---------------------------------------------------------------- sanitise AI output

const STATUS_ALIASES: Record<string, AuditStatus> = {
  conformant: "conformant", conforming: "conformant", compliant: "conformant", met: "conformant", yes: "conformant",
  partially: "partially", partial: "partially", "partially conformant": "partially", "partially compliant": "partially",
  nonconformant: "nonconformant", "non-conformant": "nonconformant", "non conformant": "nonconformant", nonconformity: "nonconformant", "not conformant": "nonconformant", noncompliant: "nonconformant",
  "not evidenced": "not evidenced", "no evidence": "not evidenced", missing: "not evidenced", unknown: "not evidenced",
  "not applicable": "not applicable", "n/a": "not applicable", na: "not applicable",
};
export const normaliseStatus = (v: unknown): AuditStatus => {
  const k = String(v ?? "").trim().toLowerCase();
  return STATUS_ALIASES[k] ?? STATUS_ALIASES[k.replace(/[-_]+/g, " ")] ?? "not evidenced";
};
export const normaliseSeverity = (v: unknown, status: AuditStatus): AuditSeverity => {
  if (status === "conformant" || status === "not applicable") return "observation";
  const s = String(v ?? "").trim().toLowerCase();
  return s === "major" || s === "critical" || s === "high" ? "major" : s === "observation" || s === "low" || s === "ofi" ? "observation" : "minor";
};
const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
/** Evidence reference "file: “quote”" with the quote limited to 20 words. */
export function clipEvidence(v: unknown) {
  const s = clip(v, 600);
  const m = /^(.*?)([“"])(.+?)([”"])(.*)$/.exec(s);
  if (!m) return s.split(" ").slice(0, 30).join(" ");
  const words = m[3].trim().split(" ");
  return `${m[1]}“${words.slice(0, 20).join(" ")}${words.length > 20 ? "…" : ""}”${m[5]}`.trim();
}

/** Keep only results for the requested ids (one each), coerce enums and fill any id the AI skipped. */
export function sanitiseResults(raw: unknown, ids: string[]): (AuditResult & { aiMissing?: boolean })[] {
  const want = new Set(ids);
  const got = new Map<string, AuditResult>();
  for (const x of Array.isArray(raw) ? raw : []) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = String(o.id ?? "").trim();
    if (!want.has(id) || got.has(id)) continue;
    const status = normaliseStatus(o.status);
    got.set(id, { id, status, evidence: clipEvidence(o.evidence), finding: clip(o.finding, 1200), action: clip(o.action, 800), severity: normaliseSeverity(o.severity, status) });
  }
  return ids.map((id) => got.get(id) ?? { id, status: "not evidenced", evidence: "", finding: "The AI did not return an assessment for this item. Assess it manually.", action: "", severity: "minor", aiMissing: true });
}

export function sanitiseRegister(raw: unknown, max = 40): EvidenceEntry[] {
  const out: EvidenceEntry[] = [];
  for (const x of Array.isArray(raw) ? raw : []) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const file = clip(o.file, 200);
    if (file && !out.some((e) => e.file === file)) out.push({ file, describes: clip(o.describes, 400) });
    if (out.length >= max) break;
  }
  return out;
}

// ---------------------------------------------------------------- score

const CREDIT: Record<AuditStatus, number> = { conformant: 1, partially: 0.5, nonconformant: 0, "not evidenced": 0, "not applicable": 0 };
export const isFinding = (r: Pick<AuditRow, "status">) => r.status === "partially" || r.status === "nonconformant" || r.status === "not evidenced";
export const verdictFor = (score: number) => (score >= 85 ? "Substantially conformant" : score >= 70 ? "Conformant with minor findings" : score >= 45 ? "Significant gaps" : "Not conformant");

/** Weighted conformance: conformant 1, partially 0.5, nonconformant / not evidenced 0; not applicable excluded. */
export function scoreAudit(rows: AuditRow[]) {
  const pct = (list: AuditRow[]) => {
    const scored = list.filter((r) => r.status !== "not applicable");
    const w = scored.reduce((a, r) => a + r.weight, 0);
    return w ? Math.round((100 * scored.reduce((a, r) => a + r.weight * CREDIT[r.status], 0)) / w) : 0;
  };
  const count = (list: AuditRow[]) => Object.fromEntries(AUDIT_STATUSES.map((s) => [s, list.filter((r) => r.status === s).length])) as Record<AuditStatus, number>;
  const findings = rows.filter(isFinding);
  const score = pct(rows);
  return {
    score,
    verdict: verdictFor(score),
    byStatus: count(rows),
    byPart: AUDIT_PARTS.filter((p) => rows.some((r) => r.part === p)).map((p) => {
      const list = rows.filter((r) => r.part === p);
      return { part: p, score: pct(list), total: list.length, ...count(list) };
    }),
    bySeverity: Object.fromEntries(AUDIT_SEVERITIES.map((s) => [s, findings.filter((r) => r.severity === s).length])) as Record<AuditSeverity, number>,
    majors: findings.filter((r) => r.severity === "major"),
  };
}

// ---------------------------------------------------------------- report

export interface AuditMeta {
  projectName: string; scope: AuditScope; date: string; auditor?: string; summary?: string;
  evidence?: EvidenceEntry[]; files?: string[];
}
const cell = (s: string) => (s || "—").replace(/\|/g, "\\|").replace(/\n+/g, " ");

export const ROW_HEADER = ["ID", "Part", "Clause / activity", "Requirement", "Status", "Severity", "Evidence", "Finding", "Recommended action", "Weight", "Edited"];
export const toRows = (rows: AuditRow[]): string[][] => [ROW_HEADER, ...rows.map((r) => [
  r.id, `ISO 19650-${r.part}`, r.clauseOrActivity, r.requirement, STATUS_LABEL[r.status], isFinding(r) ? SEVERITY_LABEL[r.severity] : "", r.evidence, r.finding, r.action, String(r.weight), r.edited ? "Yes" : "",
])];

/** A formal audit report: scope, method, summary, score, findings, nonconformities with actions, observations, evidence register, disclaimer. */
export function auditReportMarkdown(meta: AuditMeta, rows: AuditRow[]): string {
  const s = scoreAudit(rows);
  const { scope } = meta;
  const findings = rows.filter(isFinding);
  const ncs = findings.filter((r) => r.severity !== "observation");
  const obs = rows.filter((r) => (isFinding(r) && r.severity === "observation") || (r.status === "conformant" && r.finding && r.action));
  const edited = rows.filter((r) => r.edited).length;
  const L: string[] = [];
  L.push(`# ISO 19650 information management audit report`, "");
  L.push(`**Project:** ${meta.projectName || "[PROJECT NAME]"}  `, `**Date:** ${meta.date}  `, `**Auditor:** ${meta.auditor || "[AUDITOR NAME]"}  `,
    `**Audited party:** ${ROLE_LABEL[scope.role]}  `, `**Stage reached:** ${stageTitle(scope.stage)}`, "");
  L.push("## 1. Scope", "",
    `The audit covered ${scope.parts.map((p) => PART_LABEL[p]).join("; ")}, for the ${ROLE_LABEL[scope.role].toLowerCase()}, up to and including the stage "${stageTitle(scope.stage)}". Activities and gates later than the stage reached were excluded.`, "");
  L.push("## 2. Method", "",
    `A checklist of ${rows.length} items was generated deterministically from the platform's ISO 19650 guidance (part checklists, clause requirements and the stage gates reached), filtered by party and stage. Each item was assessed against the evidence supplied with AI assistance and then reviewed by the auditor${edited ? ` (${edited} item${edited === 1 ? "" : "s"} changed by the auditor)` : ""}.`,
    "", "Status scale: conformant (credit 1), partially conformant (0.5), nonconformant (0), not evidenced (0), not applicable (excluded). Items are weighted: delivery activities and part checklists carry more weight than principles. Severity: major (requirement not met in a way that affects information delivery or security), minor (isolated lapse), observation (opportunity for improvement).", "");
  L.push("## 3. Summary", "");
  if (meta.summary?.trim()) L.push(meta.summary.trim(), "");
  L.push(`| Measure | Result |`, `| --- | --- |`,
    `| Weighted conformance score | ${s.score} / 100 |`, `| Indicative verdict | ${s.verdict} |`,
    ...AUDIT_STATUSES.map((st) => `| ${STATUS_LABEL[st]} | ${s.byStatus[st]} |`),
    `| Major findings | ${s.bySeverity.major} |`, `| Minor findings | ${s.bySeverity.minor} |`, `| Observations | ${s.bySeverity.observation} |`, "");
  L.push("### Score by part", "", "| Part | Items | Score | Conformant | Partially | Nonconformant | Not evidenced | Not applicable |", "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...s.byPart.map((p) => `| ${PART_LABEL[p.part]} | ${p.total} | ${p.score}% | ${p.conformant} | ${p.partially} | ${p.nonconformant} | ${p["not evidenced"]} | ${p["not applicable"]} |`), "");
  L.push("## 4. Findings", "", "| ID | Clause / activity | Requirement | Status | Severity | Evidence |", "| --- | --- | --- | --- | --- | --- |",
    ...rows.map((r) => `| ${r.id} | ${cell(r.clauseOrActivity)} | ${cell(r.requirement)} | ${STATUS_LABEL[r.status]}${r.edited ? " (edited)" : ""} | ${isFinding(r) ? SEVERITY_LABEL[r.severity] : "—"} | ${cell(r.evidence)} |`), "");
  L.push("## 5. Nonconformities and corrective actions", "");
  if (!ncs.length) L.push("No major or minor findings were recorded.", "");
  const sorted = [...ncs].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "major" ? -1 : 1));
  sorted.forEach((r, i) => {
    L.push(`### NC-${String(i + 1).padStart(2, "0")} (${SEVERITY_LABEL[r.severity]}) ${r.id}: ${r.clauseOrActivity}`, "",
      `- **Requirement:** ${r.requirement}`, `- **Status:** ${STATUS_LABEL[r.status]}${r.edited ? " (edited by auditor)" : ""}`,
      `- **Evidence:** ${r.evidence || "None supplied"}`, `- **Finding:** ${r.finding || "—"}`, `- **Corrective action:** ${r.action || "[ACTION TO BE AGREED]"}`,
      `- **Owner / due date:** [TBC]`, "");
  });
  L.push("## 6. Observations and opportunities for improvement", "");
  if (!obs.length) L.push("None recorded.", "");
  else L.push(...obs.map((r) => `- **${r.id}** ${r.requirement}: ${r.finding || "—"}${r.action ? ` *Suggested:* ${r.action}` : ""}`), "");
  L.push("## 7. Evidence register", "");
  const reg = meta.evidence?.length ? meta.evidence : (meta.files ?? []).map((f) => ({ file: f, describes: "" }));
  if (!reg.length) L.push("No evidence files were recorded.", "");
  else L.push("| # | File | Describes |", "| --- | --- | --- |", ...reg.map((e, i) => `| ${i + 1} | ${cell(e.file)} | ${cell(e.describes)} |`), "");
  L.push("## 8. Disclaimer", "",
    "This report is decision support, not certification. Assessments were prepared with AI assistance from the evidence supplied and paraphrased platform guidance, not the licensed text of BS EN ISO 19650. The auditor is responsible for every conclusion, must verify each finding against the source evidence and the licensed edition of the standard, and decides the final status of every item.", "");
  return L.join("\n");
}
