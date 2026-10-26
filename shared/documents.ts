import type { DocTemplate } from "./data/types";

export type FieldValue = string | string[][];
export type CdeState = "WIP" | "SHARED" | "PUBLISHED" | "ARCHIVED";

export const SUITABILITY: Record<CdeState, string[]> = {
  WIP: ["S0"],
  SHARED: ["S1", "S2", "S3", "S4", "S6", "S7"],
  PUBLISHED: ["A1", "A2", "A3", "A4", "A5", "A6", "B1", "B2", "CR"],
  ARCHIVED: ["AR"],
};

export interface ProjectFacts {
  name: string;
  code: string;
  appointingParty: string;
  location: string;
  description: string | null;
}

// Template fields that are filled from the project so nobody retypes them.
const PROJECT_FIELDS: Record<string, (p: ProjectFacts) => string> = {
  projectName: (p) => p.name,
  projectCode: (p) => p.code,
  appointingParty: (p) => p.appointingParty,
  location: (p) => p.location,
  description: (p) => p.description ?? "",
  orgName: (p) => p.appointingParty,
};

export function initialValues(t: DocTemplate, project?: ProjectFacts): Record<string, FieldValue> {
  const v: Record<string, FieldValue> = {};
  for (const s of t.sections)
    for (const f of s.fields) {
      const fromProject = project && PROJECT_FIELDS[f.id]?.(project);
      v[f.id] = f.type === "table" ? (f.defaultRows ?? []).map((r) => [...r]) : fromProject || f.defaultValue || "";
    }
  return v;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** P01.01 → P01.02 (WIP), P01.03 → P01 (Shared), P0n → C01 / C01 → C02 (Published). */
export function nextRevision(current: string, toState: CdeState): string {
  const p = /^P(\d+)(?:\.(\d+))?$/.exec(current);
  const c = /^C(\d+)$/.exec(current);
  if (toState === "WIP") {
    if (p && p[2]) return `P${p[1]}.${pad(+p[2] + 1)}`;
    if (p) return `P${pad(+p[1] + 1)}.01`;
    if (c) return `P${pad(+c[1] + 1)}.01`;
  }
  if (toState === "SHARED" && p) return `P${p[1]}`;
  if (toState === "PUBLISHED") return c ? `C${pad(+c[1] + 1)}` : "C01";
  return current;
}

/** Share of fields with content, per section — drives the completeness indicators. */
export function completeness(t: DocTemplate, values: Record<string, unknown>): number[] {
  return t.sections.map((s) => {
    const filled = s.fields.filter((f) => {
      const v = values[f.id];
      return Array.isArray(v) ? v.some((r) => Array.isArray(r) && r.some(Boolean)) : !!v;
    }).length;
    return s.fields.length ? filled / s.fields.length : 1;
  });
}
