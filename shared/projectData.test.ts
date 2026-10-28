import { describe, expect, it } from "vitest";
import { HARD_MINIMUM, docKind, emptyProjectData, hardMinimumGaps, missingDocInputs, missingPrerequisites, projectDataText, type ProjectData } from "./projectData";

const complete = (): ProjectData => ({
  ...emptyProjectData(), name: "Riverside Clinic", code: "RVC", client: "Example Health Trust",
  stages: [{ code: "2", name: "Concept design", start: "2027-01-04", end: "2027-03-26" }],
  disciplines: [{ discipline: "Architecture", organisation: "XYZ Architects", lead: "" }],
  purposes: ["Design coordination"], classification: "Uniclass 2015", cde: "Autodesk Construction Cloud",
  deliverables: [{ name: "Architectural model", format: "IFC 4", milestone: "Stage 2" }],
});

describe("hard minimum for a first draft", () => {
  it("has the eight inputs from the mandatory input guidance", () => {
    expect(HARD_MINIMUM.map((h) => h.label)).toEqual(["Project name, code and client", "Project stages with dates", "Disciplines and responsible organisations", "Information purposes (uses of BIM)", "Naming convention fields", "Classification system", "CDE platform", "Deliverables list with formats and milestones"]);
  });
  it("reports every gap on blank data (naming has defaults)", () => {
    expect(hardMinimumGaps(emptyProjectData()).map((g) => g.id)).toEqual(["identity", "stages", "disciplines", "purposes", "classification", "cde", "deliverables"]);
  });
  it("passes when complete, and explains partial entries", () => {
    expect(hardMinimumGaps(complete())).toEqual([]);
    expect(hardMinimumGaps({ ...complete(), code: "", client: " " })[0].reason).toBe("Missing code, client");
    expect(hardMinimumGaps({ ...complete(), stages: [{ code: "", name: "Concept", start: "", end: "" }] }).map((g) => g.id)).toEqual(["stages"]);
    expect(hardMinimumGaps({ ...complete(), deliverables: [{ name: "Model", format: "", milestone: "S2" }] }).map((g) => g.id)).toEqual(["deliverables"]);
  });
});

describe("document-specific inputs and order", () => {
  it("recognises document kinds", () => {
    expect(docKind("Exchange Information Requirements (EIR)")).toBe("EIR");
    expect(docKind("Post-appointment BIM Execution Plan")).toBe("BEP-POST");
    expect(docKind("Pre-appointment BIM Execution Plan")).toBe("BEP-PRE");
    expect(docKind("Asset Information Requirements (AIR)")).toBe("AIR");
    expect(docKind("Information protocol")).toBeUndefined();
  });
  it("lists required inputs still missing for a document", () => {
    const p = complete();
    expect(missingDocInputs(p, "AIR")).toHaveLength(5);
    p.docInputs.AIR = { purpose: "FM", breakdown: "Plant", attributes: "Serial", format: "COBie", handover: "Stage 6" };
    expect(missingDocInputs(p, "AIR")).toEqual([]);
    expect(missingDocInputs(p, undefined)).toEqual([]);
  });
  it("names earlier documents in the chain that are not produced yet", () => {
    const p = complete();
    expect(missingPrerequisites(p, "BEP-PRE")).toEqual(["OIR", "AIR", "EIR"]);
    p.generated = { OIR: "2027-01-10", PIR: "2027-01-12" };
    expect(missingPrerequisites(p, "BEP-PRE")).toEqual(["EIR"]);
    expect(missingPrerequisites(p, "OIR")).toEqual([]);
  });
  it("writes the project data and the document inputs into the AI brief", () => {
    const p = { ...complete(), docInputs: { EIR: { acceptance: "IDS checks pass" } } };
    const t = projectDataText(p, "EIR");
    expect(t).toMatch(/PROJECT: Riverside Clinic \(RVC\)/);
    expect(t).toMatch(/Naming convention: Project-Originator-Volume \/ System/);
    expect(t).toMatch(/Disciplines and organisations: Architecture — XYZ Architects/);
    expect(t).toMatch(/EIR INPUTS FROM THE AUTHOR:\n- Acceptance criteria and the review \/ approval process: IDS checks pass/);
  });
});
