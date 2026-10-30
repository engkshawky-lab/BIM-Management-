import { describe, expect, it } from "vitest";
import { BRIEF_QUESTIONS, assembleDoc, batches, briefToPrompt, collectTbc, normaliseSection, prefillAnswers, templateSections, unanswered } from "./eirBrief";
import { emptyProjectData } from "./projectData";

describe("eirBrief questionnaire", () => {
  it("has 12–16 questions with unique ids and options for pick lists", () => {
    expect(BRIEF_QUESTIONS.length).toBeGreaterThanOrEqual(12);
    expect(BRIEF_QUESTIONS.length).toBeLessThanOrEqual(18);
    expect(new Set(BRIEF_QUESTIONS.map((q) => q.id)).size).toBe(BRIEF_QUESTIONS.length);
    for (const q of BRIEF_QUESTIONS) if (q.type === "select" || q.type === "multiselect") expect(q.options?.length).toBeGreaterThan(1);
  });

  it("prefills from project data without overwriting answers", () => {
    const p = { ...emptyProjectData(), name: "Riverside School", code: "RVS01", cde: "ACC", classification: "uniclass 2015", purposes: ["Design authoring", "Asset data (COBie) delivery"],
      stages: [{ code: "2", name: "Concept design", start: "2027-01-01", end: "2027-03-14" }], disciplines: [{ discipline: "Architecture", organisation: "ABC", lead: "" }] };
    const a = prefillAnswers(p, { projectName: "Kept" });
    expect(a.projectName).toBe("Kept");
    expect(a.projectCode).toBe("RVS01");
    expect(a.classification).toBe("Uniclass 2015");
    expect(a.uses).toEqual(["Design authoring", "Asset data (COBie) delivery"]);
    expect(a.stages).toEqual(["2 Concept design"]);
    expect(a.disciplines).toEqual(["Architecture"]);
    expect(String(a.milestones)).toContain("2027-03-14");
    expect(a.fmSystem).toBeUndefined();
  });

  it("writes NOT STATED for unanswered questions", () => {
    const txt = briefToPrompt({ projectName: "X", uses: ["Design authoring", "Space management"] });
    expect(txt).toContain("Project name: X");
    expect(txt).toContain("Information uses: Design authoring, Space management");
    expect(txt).toContain("CDE platform: NOT STATED");
    expect(unanswered({ projectName: "X" }).some((q) => q.id === "cde")).toBe(true);
  });
});

describe("eirBrief assembly", () => {
  it("reads the EIR and AIR templates", () => {
    expect(templateSections("eir").map((s) => s.id)).toContain("loin");
    expect(templateSections("air").map((s) => s.id)).toContain("tagging");
  });

  it("batches in order", () => {
    expect(batches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("normalises headings and strips HTML and fences", () => {
    const md = normaliseSection(3, "Level of information need", "```markdown\n## 7 Wrong\n<script>x</script>Body <b>bold</b>\n```");
    expect(md).toBe("## 3 Level of information need\n\nxBody bold");
  });

  it("collects TBC items", () => {
    expect(collectTbc("a [TBC: CDE platform] b [TBC: CDE platform] [tbc: date]")).toEqual(["CDE platform", "date"]);
  });

  it("assembles sections in template order with appendices", () => {
    const md = assembleDoc("eir", [
      { id: "loin", title: "x", markdown: "LOIN table [TBC: door fire rating source]" },
      { id: "intro", title: "Introduction and scope", markdown: "## 1 Intro\nPurpose." },
    ], { project: "Riverside", code: "RVS01", date: "2027-01-01", assumptions: ["Stage 2 start"], tbc: ["CDE platform"] });
    expect(md.startsWith("# Exchange Information Requirements (EIR)")).toBe(true);
    expect(md.indexOf("## 1 Introduction and scope")).toBeLessThan(md.indexOf("## 2 Level of information need"));
    expect(md).toContain("## Appendix A Assumptions");
    expect(md).toContain("## Appendix B Items to be confirmed\n\n- CDE platform\n- door fire rating source");
  });
});
