import { describe, expect, it } from "vitest";
import {
  COMPANY_FIELDS, assembleBep, batchIds, coverage, defaultProfile, demoteHeadings, normaliseProfile, profileToPrompt,
  sanitiseRequirements, sanitiseSections, sanitiseStrings, sanitiseTrace,
} from "./bepProfile";

const wanted = [{ id: "intro", title: "Introduction" }, { id: "cde", title: "Common data environment" }];

describe("company profile", () => {
  it("has defaults for every field and a valid role", () => {
    const p = defaultProfile();
    expect(Object.keys(p)).toEqual(COMPANY_FIELDS.map((f) => f.id));
    expect(p.role).toBe("Lead appointed party");
  });
  it("normalises unknown input, bad roles and long strings", () => {
    const p = normaliseProfile({ companyName: "x".repeat(500), role: "Hacker", bogus: "y", people: 3 });
    expect(p.companyName.length).toBe(200);
    expect(p.role).toBe("Lead appointed party");
    expect(p).not.toHaveProperty("bogus");
    expect(p.people).toBe("");
    expect(normaliseProfile(null)).toEqual(defaultProfile());
  });
  it("renders the prompt with blanks flagged as not provided", () => {
    const txt = profileToPrompt({ ...defaultProfile(), companyName: "Meridian", role: "Appointed party" });
    expect(txt).toContain("Company name: Meridian");
    expect(txt).toContain("Role on this appointment: Appointed party");
    expect(txt).toContain("Key people and roles: (not provided)");
    expect(txt).toContain("Software and versions per discipline: (not provided)");
    expect(profileToPrompt({ ...defaultProfile(), software: "Architecture: Revit 2025" })).toContain("Revit 2025");
  });
});

describe("sanitising", () => {
  it("keeps requirements with text, fills and de-duplicates refs", () => {
    const r = sanitiseRequirements([{ ref: "3.1", requirement: "Use IFC 4" }, { ref: "3.1", requirement: "COBie at handover" }, { requirement: "" }, { requirement: "No ref" }, "junk"]);
    expect(r.map((x) => x.ref)).toEqual(["3.1", "3.1*", "EIR-03"]);
  });
  it("keeps requested sections only, in template order, with demoted headings", () => {
    const out = sanitiseSections([{ id: "cde", markdown: "## Platform\ntext" }, { title: "introduction", markdown: "Intro" }, { id: "other", markdown: "x" }], wanted);
    expect(out.map((x) => x.id)).toEqual(["intro", "cde"]);
    expect(out[1].markdown).toBe("### Platform\ntext");
    expect(demoteHeadings("# A\n#### B")).toBe("### A\n#### B");
  });
  it("drops trace rows with unknown refs or sections and duplicates", () => {
    const t = sanitiseTrace([
      { ref: "E1", response: "We use X", section: "cde" }, { ref: "E1", response: "dup", section: "Common data environment" },
      { ref: "E9", response: "?", section: "cde" }, { ref: "E2", response: "Y", section: "nowhere" }, { ref: "E2", response: "Z", section: "Introduction" },
    ], ["E1", "E2"], wanted);
    expect(t).toEqual([{ ref: "E1", response: "We use X", section: "cde" }, { ref: "E2", response: "Z", section: "intro" }]);
  });
  it("cleans string lists", () => {
    expect(sanitiseStrings(["a", "", 3, null, "  b  "])).toEqual(["a", "3", "b"]);
  });
});

describe("coverage and batching", () => {
  it("counts requirements with a response", () => {
    const c = coverage([{ ref: "E1", requirement: "a" }, { ref: "E2", requirement: "b" }], [{ ref: "E1", response: "x", section: "cde" }, { ref: "E2", response: " ", section: "cde" }]);
    expect(c).toMatchObject({ total: 2, covered: 1, uncovered: ["E2"], percent: 50, bySection: { cde: 2 } });
  });
  it("splits ids into batches", () => {
    expect(batchIds(["a", "b", "c", "d", "e"], 2)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
  });
});

describe("assembleBep", () => {
  it("writes numbered sections, risks, clarifications and the response matrix", () => {
    const md = assembleBep(
      [{ id: "intro", title: "Introduction", markdown: "Purpose" }, { id: "cde", title: "Common data environment", markdown: "" }],
      [{ ref: "E1", response: "Platform | hosted", section: "cde" }],
      { kind: "pre", project: "RMC", company: "Meridian", requirements: [{ ref: "E1", requirement: "Use a CDE" }, { ref: "E2", requirement: "COBie" }], risks: ["Late EIR"], clarifications: ["Which CDE?"] },
    );
    expect(md).toMatch(/^# BIM Execution Plan \(Pre-appointment\)/);
    expect(md).toContain("Project: RMC · Prepared by: Meridian");
    expect(md).toContain("## 1. Introduction\n\nPurpose");
    expect(md).toContain("## 2. Common data environment\n\n[TBC: section to be written]");
    expect(md).toContain("- Late EIR");
    expect(md).toContain("1. Which CDE?");
    expect(md).toContain("## Appendix A. EIR response matrix");
    expect(md).toContain("1 of 2 EIR requirements have a response in this BEP (50%).");
    expect(md).toContain("| EIR ref | Requirement | How the BEP responds | BEP section |");
    expect(md).toContain("| E1 | Use a CDE | Platform \\| hosted | 2. Common data environment |");
    expect(md).toContain("| E2 | COBie | [TBC: no response in this BEP] | — |");
  });
  it("works without requirements and uses the post title", () => {
    const md = assembleBep([], [{ ref: "X", response: "r", section: "s" }], { kind: "post" });
    expect(md).toContain("# BIM Execution Plan (Post-appointment)");
    expect(md).toContain("| X | — | r | s |");
  });
});
