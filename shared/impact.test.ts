import { describe, expect, it } from "vitest";
import type { Deliverable } from "./delivery";
import { changeImpact, diffValues } from "./impact";

const d = (id: string, start: string, due: string, dependsOn: string[] = [], milestoneId: string | null = "m1"): Deliverable => ({
  id, taskTeamId: "t", containerName: id.toUpperCase(), title: id, typeCode: "", loin: "", milestoneId, startDate: start, dueDate: due, status: "planned",
  dependsOn, assigneeId: null, fileId: null, documentId: id === "c" ? "doc-c" : null, notes: "",
});

describe("changeImpact", () => {
  const items = [d("a", "2026-01-01", "2026-01-10"), d("b", "2026-01-11", "2026-01-20", ["a"]), d("c", "2026-01-25", "2026-02-05", ["b"]), d("x", "2026-01-01", "2026-01-05")];
  const ms = [{ id: "m1", name: "Stage 3", date: "2026-02-10", description: "" }];
  it("cascades a delay through finish-to-start dependencies", () => {
    const r = changeImpact(items, ms, "a", 10);
    expect(r.shifted).toEqual([
      { id: "a", label: "A", from: "2026-01-10", to: "2026-01-20" },
      { id: "b", label: "B", from: "2026-01-20", to: "2026-01-30" },
      { id: "c", label: "C", from: "2026-02-05", to: "2026-02-11" }, // 4 days of float absorbed
    ]);
    expect(r.milestoneBreaches).toEqual([{ milestone: "Stage 3", date: "2026-02-10", containers: ["C"] }]);
    expect(r.documents).toEqual(["doc-c"]);
  });
  it("absorbs a delay when there is float", () => {
    const r = changeImpact(items, ms, "b", 3);
    expect(r.shifted.map((s) => s.id)).toEqual(["b"]);
  });
});

describe("diffValues", () => {
  it("reports text and table changes", () => {
    expect(diffValues({ a: "x", t: [["1", "2"]], same: "s" }, { a: "y", t: [["1", "2"], ["3", "4"]], same: "s" })).toEqual([
      { field: "a", kind: "text", before: "x", after: "y" },
      { field: "t", kind: "table", added: ["3 | 4"], removed: [] },
    ]);
  });
});
