import { addDays, type Deliverable, type Milestone } from "./delivery";

export interface ImpactResult {
  shifted: { id: string; label: string; from: string; to: string }[];
  milestoneBreaches: { milestone: string; date: string; containers: string[] }[];
  documents: string[];
}

/**
 * Change impact: delay one container by `days` and push every dependent container
 * whose start would now precede its predecessor's new due date (finish-to-start).
 */
export function changeImpact(items: Deliverable[], milestones: Milestone[], changedId: string, days: number): ImpactResult {
  const byId = new Map(items.map((d) => [d.id, { ...d }]));
  const dependents = new Map<string, string[]>();
  for (const d of items) for (const p of d.dependsOn) dependents.set(p, [...(dependents.get(p) ?? []), d.id]);
  const label = (d: Deliverable) => d.containerName || d.title;
  const shifted = new Map<string, { from: string; to: string }>();

  const root = byId.get(changedId);
  if (!root || !root.dueDate || !days) return { shifted: [], milestoneBreaches: [], documents: [] };
  shifted.set(root.id, { from: root.dueDate, to: addDays(root.dueDate, days) });
  root.startDate = root.startDate ? addDays(root.startDate, days) : root.startDate;
  root.dueDate = addDays(root.dueDate, days);

  const queue = [root.id];
  while (queue.length) {
    const cur = byId.get(queue.shift()!)!;
    for (const depId of dependents.get(cur.id) ?? []) {
      const d = byId.get(depId)!;
      const start = d.startDate || d.dueDate;
      if (!start || !cur.dueDate || start >= addDays(cur.dueDate, 1)) continue;
      const push = Math.round((Date.parse(addDays(cur.dueDate, 1)) - Date.parse(start)) / 86_400_000);
      const original = shifted.get(d.id)?.from ?? d.dueDate;
      d.startDate = d.startDate ? addDays(d.startDate, push) : d.startDate;
      d.dueDate = d.dueDate ? addDays(d.dueDate, push) : d.dueDate;
      shifted.set(d.id, { from: original, to: d.dueDate });
      queue.push(d.id);
    }
  }

  const ms = new Map(milestones.map((m) => [m.id, m]));
  const breaches = new Map<string, { milestone: string; date: string; containers: string[] }>();
  for (const id of shifted.keys()) {
    const d = byId.get(id)!;
    const m = d.milestoneId ? ms.get(d.milestoneId) : undefined;
    if (m && d.dueDate > m.date) {
      const b = breaches.get(m.id) ?? { milestone: m.name, date: m.date, containers: [] };
      b.containers.push(label(d)); breaches.set(m.id, b);
    }
  }
  return {
    shifted: [...shifted].map(([id, s]) => ({ id, label: label(byId.get(id)!), ...s })),
    milestoneBreaches: [...breaches.values()],
    documents: [...new Set([...shifted.keys()].map((id) => byId.get(id)!.documentId).filter((x): x is string => !!x))],
  };
}

/** Field-by-field comparison of two document value snapshots. */
export function diffValues(a: Record<string, unknown>, b: Record<string, unknown>) {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  return keys.filter((k) => JSON.stringify(a[k] ?? "") !== JSON.stringify(b[k] ?? "")).map((k) => {
    const before = a[k], after = b[k];
    if (Array.isArray(before) || Array.isArray(after)) {
      const rb = ((before as string[][]) ?? []).map((r) => r.join(" | ")), ra = ((after as string[][]) ?? []).map((r) => r.join(" | "));
      return { field: k, kind: "table" as const, added: ra.filter((r) => !rb.includes(r)), removed: rb.filter((r) => !ra.includes(r)) };
    }
    return { field: k, kind: "text" as const, before: String(before ?? ""), after: String(after ?? "") };
  });
}
