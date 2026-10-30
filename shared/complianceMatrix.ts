// EIR ↔ BEP compliance matrix: pure helpers shared by the server route and the client tool.
// One row per EIR requirement, traced to the BEP response, with a gap and ready-to-paste BEP wording.

export const MATRIX_CATEGORIES = [
  "Standards & methods", "Deliverables & LOIN", "Milestones & dates", "CDE & workflow", "Roles & responsibilities",
  "Software & formats", "Security", "Handover & AIM", "Other",
] as const;
export type MatrixCategory = (typeof MATRIX_CATEGORIES)[number];

export const MATRIX_STATUSES = ["met", "partial", "missing", "conflict"] as const;
export type MatrixStatus = (typeof MATRIX_STATUSES)[number];

export const MATRIX_PRIORITIES = ["high", "medium", "low"] as const;
export type MatrixPriority = (typeof MATRIX_PRIORITIES)[number];

export interface MatrixRow {
  id: string; eirSection: string; requirement: string; category: MatrixCategory; status: MatrixStatus;
  bepSection: string; evidence: string; gap: string; suggestedText: string; priority: MatrixPriority;
}

export interface MatrixConflict { eirRef: string; bepRef: string; description: string; resolution: string }

/** Weight of each status in the score: a conflict is as bad as a missing response. */
export const STATUS_WEIGHT: Record<MatrixStatus, number> = { met: 1, partial: 0.5, missing: 0, conflict: 0 };

export interface MatrixScore {
  score: number;
  byStatus: Record<MatrixStatus, number>;
  byCategory: { category: MatrixCategory; total: number; met: number; partial: number; missing: number; conflict: number; score: number }[];
}

const pct = (rows: { status: MatrixStatus }[]) => (rows.length ? Math.round((100 * rows.reduce((a, r) => a + (STATUS_WEIGHT[r.status] ?? 0), 0)) / rows.length) : 0);

export function scoreMatrix(rows: Pick<MatrixRow, "status" | "category">[]): MatrixScore {
  const byStatus = { met: 0, partial: 0, missing: 0, conflict: 0 } as Record<MatrixStatus, number>;
  for (const r of rows) if (r.status in byStatus) byStatus[r.status]++;
  const byCategory = MATRIX_CATEGORIES.map((category) => {
    const rs = rows.filter((r) => r.category === category);
    const n = (s: MatrixStatus) => rs.filter((r) => r.status === s).length;
    return { category, total: rs.length, met: n("met"), partial: n("partial"), missing: n("missing"), conflict: n("conflict"), score: pct(rs) };
  }).filter((c) => c.total > 0);
  return { score: pct(rows), byStatus, byCategory };
}

export const isGap = (r: Pick<MatrixRow, "status">) => r.status !== "met";

const pick = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => {
  const s = String(v ?? "").trim();
  return (list.find((x) => x.toLowerCase() === s.toLowerCase()) ?? fallback);
};
const text = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const words = (s: string, n: number) => { const w = s.split(" ").filter(Boolean); return w.length > n ? w.slice(0, n).join(" ") + "…" : s; };

/** Sanitise model output into matrix rows: known enums only, bounded strings, unique ids, at most `max` rows. */
export function sanitiseRows(raw: unknown, max = 120): MatrixRow[] {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  const out: MatrixRow[] = [];
  for (const x of list) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const requirement = text(o.requirement, 600);
    if (!requirement) continue;
    let id = text(o.id, 24).replace(/[^\w.-]/g, "") || `EIR-${String(out.length + 1).padStart(2, "0")}`;
    while (seen.has(id)) id = `${id}-${out.length + 1}`;
    seen.add(id);
    const status = pick(o.status, MATRIX_STATUSES, "partial");
    out.push({
      id, eirSection: text(o.eirSection, 120), requirement,
      category: pick(o.category, MATRIX_CATEGORIES, "Other"), status,
      bepSection: text(o.bepSection, 120), evidence: words(text(o.evidence, 400), 25),
      gap: text(o.gap, 800), suggestedText: text(o.suggestedText, 2000),
      priority: pick(o.priority, MATRIX_PRIORITIES, status === "met" ? "low" : "medium"),
    });
    if (out.length >= max) break;
  }
  return out;
}

export function sanitiseConflicts(raw: unknown, max = 30): MatrixConflict[] {
  return (Array.isArray(raw) ? raw : []).filter((x) => x && typeof x === "object").slice(0, max).map((x: Record<string, unknown>) => ({
    eirRef: text(x.eirRef, 120), bepRef: text(x.bepRef, 120), description: text(x.description, 800), resolution: text(x.resolution, 800),
  })).filter((c) => c.description);
}

export interface AddendumMeta { projectName?: string; date?: string; preparedBy?: string; eirName?: string; bepName?: string }

const STATUS_LABEL: Record<MatrixStatus, string> = { met: "Met", partial: "Partially met", missing: "Not addressed", conflict: "Conflicts with EIR" };

/** "BEP addendum": one section per category with numbered paragraphs taken from the suggested text of gap rows. */
export function toAddendumMarkdown(rows: MatrixRow[], meta: AddendumMeta = {}): string {
  const gaps = rows.filter(isGap);
  const lines: string[] = [
    `# BEP addendum — response to EIR gaps`,
    ``,
    meta.projectName ? `**Project:** ${meta.projectName}  ` : "",
    meta.eirName ? `**EIR:** ${meta.eirName}  ` : "",
    meta.bepName ? `**BEP:** ${meta.bepName}  ` : "",
    meta.date ? `**Date:** ${meta.date}  ` : "",
    meta.preparedBy ? `**Prepared by:** ${meta.preparedBy}  ` : "",
    ``,
    `## Purpose`,
    ``,
    `This addendum supplements the BIM Execution Plan so that it responds to every requirement of the Exchange Information Requirements (ISO 19650-2 5.3.2 / 5.4.1). ` +
      `Each paragraph references the EIR requirement it addresses. It was drafted with AI assistance and must be reviewed and accepted by the lead appointed party's accountable person before issue.`,
    ``,
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "");
  if (!gaps.length) { lines.push(`No gaps were identified; no additional BEP wording is required.`); return lines.join("\n"); }
  let sec = 1;
  for (const category of MATRIX_CATEGORIES) {
    const rs = gaps.filter((r) => r.category === category);
    if (!rs.length) continue;
    sec++;
    lines.push(`## ${sec} ${category}`, ``);
    rs.forEach((r, i) => {
      const ref = [r.id, r.eirSection].filter(Boolean).join(", EIR ");
      const body = r.suggestedText || `[TBC: response to ${r.requirement}]`;
      lines.push(`**${sec}.${i + 1}** ${body}`, ``, `> EIR reference: ${ref} — ${r.requirement} (${STATUS_LABEL[r.status]}${r.bepSection ? `; current BEP ${r.bepSection}` : ""})`, ``);
    });
  }
  return lines.join("\n").trimEnd() + "\n";
}

export const ROW_HEADER = ["ID", "EIR section", "Requirement", "Category", "Status", "Priority", "BEP section", "Evidence", "Gap", "Suggested BEP text"];

/** Flat rows (header first) for Excel and CSV export. */
export function toRows(rows: MatrixRow[]): string[][] {
  return [ROW_HEADER, ...rows.map((r) => [r.id, r.eirSection, r.requirement, r.category, r.status, r.priority, r.bepSection, r.evidence, r.gap, r.suggestedText])];
}
