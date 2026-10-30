import { describe, expect, it } from "vitest";
import { ROW_HEADER, sanitiseConflicts, sanitiseRows, scoreMatrix, toAddendumMarkdown, toRows, type MatrixRow } from "./complianceMatrix";

const row = (p: Partial<MatrixRow>): MatrixRow => ({
  id: "EIR-01", eirSection: "3.1", requirement: "Use ISO 19650 naming", category: "Standards & methods", status: "met",
  bepSection: "4.2", evidence: "", gap: "", suggestedText: "", priority: "low", ...p,
});

describe("scoreMatrix", () => {
  it("weights met 1, partial 0.5, missing and conflict 0", () => {
    const s = scoreMatrix([row({ status: "met" }), row({ status: "partial" }), row({ status: "missing" }), row({ status: "conflict" })]);
    expect(s.score).toBe(38); // 1.5 / 4
    expect(s.byStatus).toEqual({ met: 1, partial: 1, missing: 1, conflict: 1 });
  });
  it("breaks down by category in canonical order and skips empty categories", () => {
    const s = scoreMatrix([row({ category: "Security", status: "missing" }), row({ category: "CDE & workflow", status: "met" }), row({ category: "CDE & workflow", status: "partial" })]);
    expect(s.byCategory.map((c) => c.category)).toEqual(["CDE & workflow", "Security"]);
    expect(s.byCategory[0]).toMatchObject({ total: 2, met: 1, partial: 1, score: 75 });
    expect(s.byCategory[1].score).toBe(0);
  });
  it("returns 0 for no rows", () => {
    expect(scoreMatrix([]).score).toBe(0);
  });
});

describe("sanitiseRows", () => {
  it("coerces enums, drops empty requirements, de-duplicates ids and caps rows", () => {
    const rows = sanitiseRows([
      { id: "EIR-01", requirement: "A", category: "security", status: "MET", priority: "HIGH" },
      { id: "EIR-01", requirement: "B", category: "nonsense", status: "unknown" },
      { requirement: "" },
      "junk",
      { requirement: "C", evidence: Array(40).fill("word").join(" ") },
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ category: "Security", status: "met", priority: "high" });
    expect(rows[1].id).not.toBe("EIR-01");
    expect(rows[1]).toMatchObject({ category: "Other", status: "partial", priority: "medium" });
    expect(rows[2].id).toBe("EIR-03");
    expect(rows[2].evidence.split(" ").length).toBe(25);
    expect(sanitiseRows(Array.from({ length: 200 }, (_, i) => ({ requirement: `R${i}` }))).length).toBe(120);
    expect(sanitiseRows(null)).toEqual([]);
  });
  it("sanitises conflicts", () => {
    expect(sanitiseConflicts([{ description: "x", eirRef: 1 }, { description: "" }, 3])).toEqual([{ eirRef: "1", bepRef: "", description: "x", resolution: "" }]);
  });
});

describe("toAddendumMarkdown", () => {
  const rows = [
    row({ id: "EIR-01", status: "met", suggestedText: "ignored" }),
    row({ id: "EIR-02", category: "Security", status: "missing", eirSection: "7", requirement: "Security plan", suggestedText: "We will maintain a security management plan." }),
    row({ id: "EIR-03", category: "CDE & workflow", status: "partial", requirement: "CDE states", suggestedText: "" }),
  ];
  it("writes one numbered section per category with gap rows and EIR references", () => {
    const md = toAddendumMarkdown(rows, { projectName: "Tower A" });
    expect(md).toContain("**Project:** Tower A");
    expect(md).not.toContain("ignored");
    expect(md.indexOf("## 2 CDE & workflow")).toBeGreaterThan(0);
    expect(md.indexOf("## 3 Security")).toBeGreaterThan(md.indexOf("## 2 CDE & workflow"));
    expect(md).toContain("**3.1** We will maintain a security management plan.");
    expect(md).toContain("EIR reference: EIR-02, EIR 7");
    expect(md).toContain("[TBC: response to CDE states]");
  });
  it("says so when there are no gaps", () => {
    expect(toAddendumMarkdown([row({})])).toContain("No gaps were identified");
  });
});

describe("toRows", () => {
  it("has a header and one line per row", () => {
    const out = toRows([row({ suggestedText: "S" })]);
    expect(out[0]).toEqual(ROW_HEADER);
    expect(out[1]).toHaveLength(ROW_HEADER.length);
    expect(out[1].at(-1)).toBe("S");
  });
});
