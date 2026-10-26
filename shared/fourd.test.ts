import { describe, expect, it } from "vitest";
import { analyse4d, gridFromElements, percentComplete, stateAt, type Activity } from "./fourd";

const grid = gridFromElements([
  { type: "IfcSlab", storey: "L1" }, { type: "IfcSlab", storey: "L1" }, { type: "IfcWall", storey: "L1" },
  { type: "IfcSlab", storey: "L2" }, { type: "IfcDuctSegment", storey: "L2" },
]);
const act = (p: Partial<Activity>): Activity => ({ id: p.code!, code: "", name: "", start: "", finish: "", actualStart: "", actualFinish: "", storeys: [], classes: [], ...p });
const acts = [
  act({ code: "A1", start: "2026-01-01", finish: "2026-01-10", storeys: ["L1"], classes: ["IfcSlab", "IfcWall"] }),
  act({ code: "A2", start: "2026-01-11", finish: "2026-01-20", storeys: ["L2"], classes: ["IfcSlab"], actualStart: "2026-01-12" }),
];

describe("4D", () => {
  it("counts linked, unlinked and per-activity elements", () => {
    const a = analyse4d(grid, acts);
    expect(a.total).toBe(5);
    expect(a.linked).toBe(4);
    expect(a.unlinked).toEqual([{ storey: "L2", cls: "IfcDuctSegment", n: 1 }]);
    expect(a.perActivity.find((x) => x.id === "A1")!.elements).toBe(3);
  });
  it("planned and actual states at a date", () => {
    expect(stateAt(grid, acts, "2026-01-15")["L2|IfcSlab"]).toBe("in-progress");
    expect(stateAt(grid, acts, "2026-01-15")["L1|IfcSlab"]).toBe("complete");
    expect(stateAt(grid, acts, "2026-01-15", true)["L1|IfcSlab"]).toBe("not-started");
    expect(percentComplete(grid, acts, "2026-01-25")).toBe(80);
  });
  it("flags overlapping activities", () => {
    const a = analyse4d(grid, [...acts, act({ code: "A3", storeys: ["L1"], classes: ["IfcWall"] })]);
    expect(a.overlaps).toEqual([{ storey: "L1", cls: "IfcWall", activities: ["A1", "A3"] }]);
  });
});
