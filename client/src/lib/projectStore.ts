import { useSyncExternalStore } from "react";
import { emptyProjectData, type ProjectData } from "../../../shared/projectData";

// Common project data, entered once and shared by every generator on this browser.
// One in-memory copy with subscribers, persisted to localStorage (and kept in step across tabs).

const KEY = "bim:projectdata";
const read = (): ProjectData => { try { const v = localStorage.getItem(KEY); return v ? { ...emptyProjectData(), ...JSON.parse(v) } : emptyProjectData(); } catch { return emptyProjectData(); } };
let current = read();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function setProjectData(next: ProjectData | ((p: ProjectData) => ProjectData)) {
  current = typeof next === "function" ? next(current) : next;
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* storage unavailable */ }
  emit();
}
/** Record that a document of this kind was produced (feeds the generation-order guide). */
export const markGenerated = (kind: string | undefined) => kind && setProjectData((p) => ({ ...p, generated: { ...p.generated, [kind]: new Date().toISOString().slice(0, 10) } }));

if (typeof window !== "undefined") window.addEventListener("storage", (e) => { if (e.key === KEY) { current = read(); emit(); } });

export const getProjectData = () => current;

export function useProjectData():[ProjectData, typeof setProjectData] {
  const p = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => current);
  return [p, setProjectData];
}
