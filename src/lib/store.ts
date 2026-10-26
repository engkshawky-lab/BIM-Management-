import { useEffect, useState } from "react";
import type { DocTemplate } from "../data/types";

export type FieldValue = string | string[][];

export interface RevisionEntry {
  revision: string;
  date: string;
  author: string;
  note: string;
  state: string;
  suitability: string;
}

export interface PortalDocument {
  id: string;
  templateId: string;
  title: string;
  containerName: string;
  revision: string;
  state: "WIP" | "SHARED" | "PUBLISHED" | "ARCHIVED";
  suitability: string;
  author: string;
  values: Record<string, FieldValue>;
  history: RevisionEntry[];
  updatedAt: string;
}

export interface WorkflowProgress {
  // activity id -> status
  activities: Record<string, "todo" | "doing" | "done">;
  // stage id -> gate approval
  gates: Record<string, { approved: boolean; by: string; date: string; note: string }>;
}

const KEY = "iso-portal:v1:";

function read<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY + name);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(name: string, value: T) {
  try {
    localStorage.setItem(KEY + name, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep in memory only */
  }
}

export function usePersistent<T>(name: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(name, fallback));
  useEffect(() => write(name, value), [name, value]);
  return [value, setValue] as const;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const today = () => new Date().toISOString().slice(0, 10);

export function initialValues(t: DocTemplate): Record<string, FieldValue> {
  const v: Record<string, FieldValue> = {};
  for (const s of t.sections)
    for (const f of s.fields) v[f.id] = f.type === "table" ? (f.defaultRows ?? []).map((r) => [...r]) : f.defaultValue ?? "";
  return v;
}

export function newDocument(t: DocTemplate, author: string): PortalDocument {
  return {
    id: uid(),
    templateId: t.id,
    title: t.title,
    containerName: "",
    revision: "P01.01",
    state: "WIP",
    suitability: "S0",
    author,
    values: initialValues(t),
    history: [{ revision: "P01.01", date: today(), author, note: "Created from template " + t.code, state: "WIP", suitability: "S0" }],
    updatedAt: new Date().toISOString(),
  };
}

// P01.01 -> P01.02 (WIP version); P01.03 -> P01 when shared; P01 -> C01 when published
export function nextRevision(current: string, toState: PortalDocument["state"]): string {
  const p = /^P(\d+)(?:\.(\d+))?$/.exec(current);
  const c = /^C(\d+)$/.exec(current);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (toState === "WIP") {
    if (p && p[2]) return `P${p[1]}.${pad(+p[2] + 1)}`;
    if (p) return `P${pad(+p[1] + 1)}.01`;
    if (c) return `P${pad(+c[1] + 1)}.01`;
  }
  if (toState === "SHARED" && p) return `P${p[1]}`;
  if (toState === "PUBLISHED") {
    if (c) return `C${pad(+c[1] + 1)}`;
    return "C01";
  }
  return current;
}
