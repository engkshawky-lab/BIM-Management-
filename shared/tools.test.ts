import { describe, expect, it } from "vitest";
import { ASSESSMENTS, estimateCarbon, estimateFee, scoreAssessment } from "./tools";

describe("tools", () => {
  it("fee estimate applies minimum days and complexity", () => {
    const r = estimateFee({ areaM2: 1000, complexity: "Complex", services: ["im"], dayRate: 500, months: 10 });
    expect(r.lines[0].days).toBe(26); // max(20, 1.2) × 1.3
    expect(r.cost).toBe(13000);
  });
  it("carbon estimate totals and bands per m²", () => {
    const r = estimateCarbon([{ materialId: "c32", qty: 1000 }, { materialId: "rebar", qty: 100 }], 1000);
    expect(r.totalKg).toBe(310000 + 199000);
    expect(r.band).toBe("B (good)");
  });
  it("assessment averages answered questions only", () => {
    const a = ASSESSMENTS[0];
    const s = scoreAssessment(a, { "0.0": 4, "0.1": 2, "1.0": 3 });
    expect(s.areas[0].score).toBe(3);
    expect(s.overall).toBe(3);
    expect(s.level.startsWith("3")).toBe(true);
  });
});
