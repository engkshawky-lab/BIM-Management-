import { describe, expect, it } from "vitest";
import { REQUIRED, docDataText, emptyDocData, missingDocData, suggestReference } from "./docData";

describe("document data required before generation", () => {
  it("requires the eight controlled fields", () => {
    expect(REQUIRED.map((f) => f.label)).toEqual(["Project name", "Document reference", "Version / revision", "Organisation name", "Organisation role", "Project stage", "Status", "Prepared by"]);
    // version and status have sensible defaults, so a blank form is missing the other six
    expect(missingDocData(emptyDocData())).toEqual(["Project name", "Document reference", "Organisation name", "Organisation role", "Project stage", "Prepared by"]);
  });

  it("is complete once every required field has a value", () => {
    const d = { ...emptyDocData(), projectName: "Riverside Clinic", reference: "RVC-EIR-001", organisation: "Example Health Trust", orgRole: "Appointing party", stage: "2 Concept design", preparedBy: "A. Author" };
    expect(missingDocData(d)).toEqual([]);
    expect(missingDocData({ ...d, preparedBy: "   " })).toEqual(["Prepared by"]);
    expect(docDataText(d)).toMatch(/Author organisation: Example Health Trust — role: Appointing party/);
  });

  it("suggests a reference from the project code or name", () => {
    expect(suggestReference({ projectCode: "rvc", projectName: "" }, "EIR")).toBe("RVC-EIR-001");
    expect(suggestReference({ projectCode: "", projectName: "Riverside Clinic" }, "tidp")).toBe("RIVE-TIDP-001");
  });
});
