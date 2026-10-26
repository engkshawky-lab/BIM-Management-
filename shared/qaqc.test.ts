import { describe, expect, it } from "vitest";
import { checklistFor, scoreReview, type QaCheck } from "./qaqc";

const checks: QaCheck[] = [
  { id: "a", area: "x", text: "", priority: 3 },
  { id: "b", area: "x", text: "", priority: 1 },
  { id: "c", area: "x", text: "", priority: 2 },
];

describe("QA/QC scoring", () => {
  it("weights by priority and ignores N/A and ungraded checks", () => {
    const s = scoreReview(checks, { a: { grade: "A", comment: "" }, b: { grade: "D", comment: "" }, c: { grade: "NA", comment: "" } });
    expect(s.score).toBe(75); // 3 of 4 weight
    expect(s.grade).toBe("B");
    expect(s.graded).toBe(3);
  });
  it("a failed critical check caps the review at D", () => {
    const s = scoreReview(checks, { a: { grade: "D", comment: "" }, b: { grade: "A", comment: "" }, c: { grade: "A", comment: "" } });
    expect(s.critical).toBe(1);
    expect(s.grade).toBe("D");
  });
  it("no grades yet gives no grade", () => {
    expect(scoreReview(checks, {}).grade).toBe("—");
  });
  it("discipline checklists include the general checks and unique ids", () => {
    const list = checklistFor("MEP");
    expect(list.some((c) => c.id.startsWith("GEN"))).toBe(true);
    expect(new Set(list.map((c) => c.id)).size).toBe(list.length);
  });
});
