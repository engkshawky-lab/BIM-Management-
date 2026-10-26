// 4D planning: link programme activities to model elements by storey and IFC class, then
// read the model's construction state at any date (planned, and actual where recorded).

export interface ModelGrid { storeys: string[]; classes: string[]; counts: Record<string, number> }
export interface Activity { id: string; code: string; name: string; start: string; finish: string; actualStart: string; actualFinish: string; storeys: string[]; classes: string[] }
export type CellState = "none" | "not-started" | "in-progress" | "complete";

export const cellKey = (storey: string, cls: string) => `${storey}|${cls}`;

/** Count elements per storey × class from IFC elements (only physical, non-spatial ones). */
export function gridFromElements(elements: { type: string; storey: string }[]): ModelGrid {
  const counts: Record<string, number> = {};
  for (const e of elements) { const k = cellKey(e.storey || "(no storey)", e.type); counts[k] = (counts[k] ?? 0) + 1; }
  const storeys = [...new Set(elements.map((e) => e.storey || "(no storey)"))];
  const classes = [...new Set(elements.map((e) => e.type))].sort();
  return { storeys, classes, counts };
}

const covers = (a: Activity, storey: string, cls: string) => (!a.storeys.length || a.storeys.includes(storey)) && (!a.classes.length || a.classes.includes(cls));

export function analyse4d(grid: ModelGrid, activities: Activity[]) {
  const perActivity = activities.map((a) => ({ id: a.id, elements: Object.entries(grid.counts).filter(([k]) => { const [s, c] = k.split("|"); return covers(a, s, c); }).reduce((n, [, v]) => n + v, 0) }));
  const unlinked: { storey: string; cls: string; n: number }[] = [];
  const overlaps: { storey: string; cls: string; activities: string[] }[] = [];
  for (const [k, n] of Object.entries(grid.counts)) {
    const [s, c] = k.split("|");
    const by = activities.filter((a) => covers(a, s, c));
    if (!by.length) unlinked.push({ storey: s, cls: c, n });
    else if (by.length > 1) overlaps.push({ storey: s, cls: c, activities: by.map((a) => a.code || a.name) });
  }
  const total = Object.values(grid.counts).reduce((a, b) => a + b, 0);
  const linked = total - unlinked.reduce((a, u) => a + u.n, 0);
  return { perActivity, unlinked, overlaps, total, linked };
}

/** State of each storey × class cell at a date; `actual` uses actual dates where recorded. */
export function stateAt(grid: ModelGrid, activities: Activity[], date: string, actual = false): Record<string, CellState> {
  const out: Record<string, CellState> = {};
  for (const k of Object.keys(grid.counts)) {
    const [s, c] = k.split("|");
    const acts = activities.filter((a) => covers(a, s, c));
    if (!acts.length) { out[k] = "none"; continue; }
    const st = acts.map((a): CellState => {
      const start = actual ? a.actualStart : a.start, finish = actual ? a.actualFinish : a.finish;
      if (finish && finish <= date) return "complete";
      if (start && start <= date) return "in-progress";
      return "not-started";
    });
    out[k] = st.every((x) => x === "complete") ? "complete" : st.some((x) => x !== "not-started") ? "in-progress" : "not-started";
  }
  return out;
}

/** Share of elements complete at a date (planned or actual). */
export function percentComplete(grid: ModelGrid, activities: Activity[], date: string, actual = false) {
  const st = stateAt(grid, activities, date, actual);
  const total = Object.values(grid.counts).reduce((a, b) => a + b, 0);
  const done = Object.entries(grid.counts).filter(([k]) => st[k] === "complete").reduce((a, [, n]) => a + n, 0);
  return total ? Math.round((done / total) * 100) : 0;
}
