import { describe, expect, it } from "vitest";
import { complianceScore, matchTemplate } from "./aiDocs";
import { parseInline, parseMarkdown, placeholders } from "./mdBlocks";

describe("parseMarkdown", () => {
  const md = [
    "```markdown", "# EIR — Riverside", "", "> Draft status: not approved.", "", "---", "## 1 Introduction", "### 1.1 Purpose",
    "Line one", "continues here.", "", "1. First", "2. Second", "   - nested **bold**", "",
    "| Role | Duty |", "|:---|---|", "| Lead \\| LAP | Line 1<br>Line 2 |", "| IM | [CONFIRM] |", "```",
  ].join("\n");
  const b = parseMarkdown(md);
  it("recognises every block kind", () => {
    expect(b.map((x) => x.k)).toEqual(["h", "quote", "hr", "h", "h", "p", "list", "table"]);
  });
  it("keeps heading levels, joins paragraphs, nests list items", () => {
    expect(b[0]).toEqual({ k: "h", level: 1, text: "EIR — Riverside" });
    expect(b[4]).toMatchObject({ k: "h", level: 3 });
    expect(b[5]).toEqual({ k: "p", text: "Line one continues here." });
    expect(b[6]).toMatchObject({ k: "list", ordered: true, items: [{ text: "First", level: 0, n: 1 }, { text: "Second", level: 0, n: 2 }, { text: "nested **bold**", level: 1 }] });
  });
  it("handles escaped pipes and <br> in tables", () => {
    expect(b[7]).toEqual({ k: "table", header: ["Role", "Duty"], rows: [["Lead | LAP", "Line 1\nLine 2"], ["IM", "[CONFIRM]"]] });
  });
  it("parses inline markup and placeholders", () => {
    expect(parseInline("A **b** *c* `d` [CONFIRM: date] [ISO](https://iso.org)").map((x) => x.t)).toEqual(["text", "b", "text", "i", "text", "code", "text", "ph", "text", "link"]);
    expect(placeholders("Use [CONFIRM] and [Project name] but not [link](https://x.y)")).toEqual(["[CONFIRM]", "[Project name]"]);
  });
});

describe("document structure helpers", () => {
  it("matches document types to the portal templates", () => {
    expect(matchTemplate("Exchange Information Requirements (EIR)")?.code).toBe("EIR");
    expect(matchTemplate("Post-appointment BIM Execution Plan")?.code).toBe("BEP-POST");
    expect(matchTemplate("Mobilisation plan")?.code).toBe("MOB");
    expect(matchTemplate("Project Information Requirements (PIR)")).toBeUndefined();
  });
  it("scores from coverage and penalises serious findings", () => {
    const cov = [{ status: "met" }, { status: "met" }, { status: "partial" }, { status: "missing" }];
    expect(complianceScore(cov, [])).toMatchObject({ score: 65, verdict: "Major revisions", coveragePct: 65 });
    expect(complianceScore(cov, [{ severity: "critical" }, { severity: "major" }]).score).toBe(60);
    expect(complianceScore([{ status: "met" }], []).verdict).toBe("Fit for issue");
    // the penalty is capped, so a thorough draft with many open findings is not marked "not fit"
    const thorough = [...Array(13).fill({ status: "met" }), ...Array(19).fill({ status: "partial" })];
    const many = [...Array(2).fill({ severity: "critical" }), ...Array(12).fill({ severity: "major" }), ...Array(6).fill({ severity: "minor" })];
    expect(complianceScore(thorough, many)).toMatchObject({ score: 56, verdict: "Major revisions" });
  });
});
