import ExcelJS from "exceljs";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterAll, describe, expect, it } from "vitest";
import { emptyStandard, requiredCounts, validateCobieAgainstStandard, validateTag } from "../shared/standards";
import { importWorkbook } from "./standardsImport";

// Synthetic client appendices in the layouts seen in practice (no client content).
const dir = mkdtempSync(join(tmpdir(), "stdimp-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
async function book(name: string, sheets: Record<string, (string | number | undefined)[][]>) {
  const wb = new ExcelJS.Workbook();
  for (const [n, rows] of Object.entries(sheets)) { const ws = wb.addWorksheet(n); rows.forEach((r, i) => r.forEach((v, j) => { if (v !== undefined) ws.getRow(i + 1).getCell(j + 1).value = v; })); }
  const f = join(dir, name); await wb.xlsx.writeFile(f); return f;
}

describe("client standards import", () => {
  it("reads an attribute dictionary with group headings and a Yes/No stage matrix", async () => {
    const f = await book("attrs.xlsx", {
      Structure: [["Asset data structure"], [], ["S/N", "Attribute", "Description", "Format", "Type", "Unit", "Parameter Name", "COBie Mapping", "COBie Sheet", "Example"],
        ["Site information"], ["S1", "Site Name", "Name of the site", "String", "Text", "-", "X_S1_Site Name", "Attribute.Name", "Attribute", "North"],
        ["S2", "Site Height", "Height", "xx,xx", "Length", "mm", "X_S2_Site Height", "Space.UsableHeight", "Space", "3200"],
        ["Asset information"], ["P1", "Serial", "Serial number", "String", "Text", "-", "X_P1_Serial", "Attribute.Name", "Attribute", "SN1"]],
      Matrix: [["Responsibility"], ["S/N", "Attribute", "Parameter Name", "Concept", "Construction", "Handover"], [undefined, undefined, undefined, "Required", "Required", "Required"],
        ["Site information"], ["S1", "Site Name", "X_S1_Site Name", "Yes", "Yes", "Yes"], ["S2", "Site Height", "X_S2_Site Height", "No", "Yes", "Yes"], ["P1", "Serial", "X_P1_Serial", "No", "No", "Yes"]],
    });
    const std = emptyStandard();
    expect(await importWorkbook(f, "attrs.xlsx", std)).toEqual(["Attribute dictionary (Structure)", "Attribute requirements by stage (Matrix)"]);
    expect(std.attributes).toHaveLength(3);
    expect(std.attributes![0]).toMatchObject({ code: "S1", group: "Site information", parameterName: "X_S1_Site Name", cobieMapping: "Attribute", required: { Concept: true } });
    expect(std.attributes![2].group).toBe("Asset information");
    expect(requiredCounts(std).map((c) => c.attributes)).toEqual([1, 2, 3]);
    // COBie check: attributes due at the stage must be on the Attribute sheet / in the mapped column
    const sheets = { Space: [{ Name: "R1", UsableHeight: "" }], Attribute: [{ Name: "X_S1_Site Name", SheetName: "Facility", RowName: "F", Value: "TBC" }] };
    const f1 = validateCobieAgainstStandard(sheets, std, "construction");
    expect(f1.find((x) => /blank but required/.test(x.message))?.ref).toMatch(/X_S2_Site Height/);
    expect(f1.find((x) => /no value/.test(x.message))?.ref).toBe("X_S1_Site Name");
    expect(validateCobieAgainstStandard(sheets, std, "Handover").find((x) => /missing from the COBie Attribute sheet/.test(x.message))?.ref).toBe("X_P1_Serial");
  });

  it("reads a stage matrix whose cells name the responsible party under multi-row stage headings", async () => {
    const f = await book("party.xlsx", {
      Dict: [["Code", "Attribute", "Description", "Format", "Parameter Name", "COBie Mapping"], [undefined, "Regional"], ["R1", "Country", "Country", "Text", "P_Country", ""], ["C1", "Asset Code", "Code", "Text", "P_Asset Code", "Component.AssetIdentifier"]],
      Life: [[undefined, undefined, "EXCHANGE #1", undefined, "EXCHANGE #2"], [undefined, undefined, "STAGE 2:", "CONCEPT", "STAGE 5:", "CONSTRUCTION"], [undefined, undefined, "PROGRAMME REF:", "100% CONCEPT", "PROGRAMME REF:", "CONSTRUCTION"],
        ["Code", "Attribute", "Responsibility", "Location", "Responsibility", "Location"], [undefined, "Regional"], ["R1", "Country", "DES", "PIM", "CON", "PIM"], ["C1", "Asset Code", "", "", "CON", "AIM"]],
    });
    const std = emptyStandard();
    await importWorkbook(f, "party.xlsx", std);
    expect(std.stages).toEqual(["100% CONCEPT", "CONSTRUCTION"]);
    const [country, code] = std.attributes!;
    expect(country).toMatchObject({ group: "Regional", required: { "100% CONCEPT": true, CONSTRUCTION: true }, responsible: { "100% CONCEPT": "DES", CONSTRUCTION: "CON" } });
    expect(code.required["100% CONCEPT"]).toBe(false);
    expect(std.attributes).toHaveLength(2);
  });

  it("keys the classification on system + equipment, skips headers and placeholders, and checks pairs in tags", async () => {
    const f = await book("cls.xlsx", {
      Mapping: [["System Category", "System Code", "Equipment Category", "Equipment Category Code", "Appears in Asset Register", "Physical Tag Required", "Uniclass Pr Products Code"],
        ["System Category", "System Code", "Equipment Category", "Equipment Category Code"], ["MECHANICAL"],
        ["Air", "AIRS", "Fan", "FANS", "Yes", "Yes", "Pr_60"], ["Water", "WATR", "Fan", "FANS", "No", "No", "Pr_61"], ["Water", "WATR", "Pump", "PUMP", "Yes", "Yes", "TO BE ADDED"],
        ["Water", "WATR", "To be added", "TO BE ADDED"], ["Furniture", "FURN", "Chair", "CHR"]],
      Levels: [["Level/Floor Code", "Level/Floor Description"], ["L1", "Level 1"], ["AG_Above ground", "Above ground"]],
    });
    const std = emptyStandard();
    await importWorkbook(f, "cls.xlsx", std);
    expect(std.classification.map((c) => `${c.systemCode}-${c.equipmentCode}`)).toEqual(["AIRS-FANS", "WATR-FANS", "WATR-PUMP", "FURN-CHR"]);
    expect(std.classification[0].flags).toEqual({ "Appears in Asset Register": true, "Physical Tag Required": true });
    expect(std.classification[2].uniclassPr).toBeUndefined();
    const parts = Object.fromEntries(std.tag!.parts.map((p) => [p.id, p.codes ?? []]));
    expect(parts.system).toEqual(["AIRS", "FURN", "WATR"]);
    expect(parts.level).toEqual(["AG", "L1"]);
    expect(validateTag("WATR-PUMP-PU0001", std.tag!, "equipment", std.classification)).toEqual([]);
    expect(validateTag("AIRS-PUMP-PU0001", std.tag!, "equipment", std.classification)[0]).toMatch(/not listed under system "AIRS"/);
    // an approved 3-character code passes although the part is nominally 4 characters
    expect(validateTag("FURN-CHR-CH0001", std.tag!, "equipment", std.classification)).toEqual([]);
  });

  it("keeps separate system and component lists unlinked", async () => {
    const f = await book("lists.xlsx", { Codes: [["SYSTEM CODE - S1", "SYSTEM NAME - S2", "", "COMPONENT CODE - C1", "COMPONENT NAME - C2"], ["AIRS", "Air", "", "FANS", "Fan"], ["WATR", "Water", "", "PUMP", "Pump"], ["", "", "", "VALV", "Valve"], ["", "", "", "TANK", "Tank"], ["", "", "", "COIL", "Coil"]] });
    const std = emptyStandard();
    expect(await importWorkbook(f, "lists.xlsx", std)).toEqual(["Classification dictionary (Codes)"]);
    expect(std.classification.every((c) => c.systemCode === "")).toBe(true);
    expect(std.tag!.parts.find((p) => p.id === "system")!.codes).toEqual(["AIRS", "WATR"]);
    expect(validateTag("WATR-FANS-FA0001", std.tag!, "equipment", std.classification)).toEqual([]);
  });
});
