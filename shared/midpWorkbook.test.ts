import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { categoryOf, parseMidpWorkbook, pivot, tidpSheetName, writeMidpWorkbook, type MidpLine } from "./midpWorkbook";

const line = (o: Partial<MidpLine>): MidpLine => ({
  container: "", title: "", description: "", taskTeam: "Architecture", teamCode: "ARC", type: "M3", nativeFormat: "", exchangeFormats: "", modelRef: "",
  classification: "", costCode: "", revision: "", suitability: "", loin: "", exchange: "", planned: "", issued: "", owner: "", status: "", ...o,
});
const header = { projectName: "Tower A", projectCode: "TWA", appointingParty: "City", leadAppointedParty: "Lead Co", preparedBy: "IM", revision: "P01", date: "2026-11-04" };
const exchanges = [{ key: "S2", name: "Concept design", programmeRef: "100% concept", date: "2026-03-01" }, { key: "S3", name: "Spatial coordination", programmeRef: "", date: "2026-06-01" }];
/** Put values in consecutive columns from column B (index 2), like the templates. */
const put = (ws: ExcelJS.Worksheet, row: number, values: unknown[]) => values.forEach((v, i) => { if (v !== undefined && v !== "") ws.getRow(row).getCell(2 + i).value = v as ExcelJS.CellValue; });
const roundTrip = async (wb: ExcelJS.Workbook) => { const out = new ExcelJS.Workbook(); await out.xlsx.load(await wb.xlsx.writeBuffer()); return parseMidpWorkbook(out); };

describe("MIDP / TIDP workbook", () => {
  it("groups by category and pivots one row per container across exchanges", () => {
    expect(categoryOf("M3")).toBe("Models"); expect(categoryOf("DR")).toBe("Drawings"); expect(categoryOf("SH")).toBe("Documents, schedules & reports"); expect(categoryOf("ZZ")).toBe("Others");
    const g = pivot([
      line({ container: "TWA-ARC-ZZ-ZZ-M3-A-0001", title: "Model", exchange: "S2", planned: "2026-02-20" }),
      line({ container: "TWA-ARC-ZZ-ZZ-M3-A-0001", title: "Model", exchange: "S3", planned: "2026-05-20", description: "Federated" }),
      line({ container: "TWA-ARC-ZZ-01-DR-A-0001", type: "DR", title: "Plan", exchange: "S3", planned: "2026-05-25" }),
    ]);
    const models = g.find((x) => x.category === "Models")!.items;
    expect(models).toHaveLength(1);
    expect(Object.keys(models[0].cells)).toEqual(["S2", "S3"]);
    expect(models[0].line.description).toBe("Federated");
    expect(g.find((x) => x.category === "Drawings")!.items).toHaveLength(1);
  });

  it("writes document control, instructions, the MIDP and a TIDP per team, and reads them back", async () => {
    const lines = [
      line({ container: "TWA-ARC-ZZ-ZZ-M3-A-0001", title: "Architectural model", description: "Federated architectural model", nativeFormat: "RVT", exchangeFormats: "IFC, NWC", classification: "PM_40_30", revision: "P01", suitability: "S2", exchange: "S2", planned: "2026-02-20", owner: "Ana" }),
      line({ container: "TWA-ARC-ZZ-ZZ-M3-A-0001", title: "Architectural model", exchange: "S3", planned: "2026-05-20", issued: "2026-05-22", owner: "Ana" }),
      line({ container: "TWA-STR-ZZ-01-DR-S-0001", taskTeam: "Structure", teamCode: "STR", type: "DR", title: "Level 1 slab plan", modelRef: "TWA-STR-ZZ-ZZ-M3-S-0001", exchange: "S3", planned: "2026-05-28", owner: "Sam" }),
    ];
    const wb = new ExcelJS.Workbook();
    writeMidpWorkbook(wb, { kind: "midp", header, exchanges, lines });
    expect(wb.worksheets.map((w) => w.name)).toEqual(["00_Document control", "01_Instructions", "MIDP", tidpSheetName("ARC", "Architecture"), tidpSheetName("STR", "Structure")]);
    const p = await roundTrip(wb);
    expect(p.sheets).toEqual([tidpSheetName("ARC", "Architecture"), tidpSheetName("STR", "Structure")]); // TIDP sheets, not the MIDP copy
    expect(p.exchanges.map((x) => [x.name, x.date])).toEqual([["Concept design — 100% concept", "2026-03-01"], ["Spatial coordination", "2026-06-01"]]);
    expect(p.lines).toHaveLength(3);
    const m = p.lines.filter((l) => l.container === "TWA-ARC-ZZ-ZZ-M3-A-0001");
    expect(m.map((l) => [l.planned, l.issued, l.owner])).toEqual([["2026-02-20", "", "Ana"], ["2026-05-20", "2026-05-22", "Ana"]]);
    expect(m[0]).toMatchObject({ description: "Federated architectural model", nativeFormat: "RVT", exchangeFormats: "IFC, NWC", classification: "PM_40_30", revision: "P01", suitability: "S2", type: "M3", teamCode: "ARC" });
    expect(p.lines.find((l) => l.type === "DR")).toMatchObject({ modelRef: "TWA-STR-ZZ-ZZ-M3-S-0001", teamCode: "STR" });
  });

  it("reads a template with owner / planned / actual groups and format tick boxes", async () => {
    // layout of a common client MIDP template (generic data)
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet("MIDP Template");
    ws.getCell("B2").value = "Master Information Delivery Plan (MIDP) Template";
    ws.getCell("P12").value = "DATA EXCHANGE #01"; ws.getCell("S12").value = "DATA EXCHANGE #02";
    ws.getCell("P13").value = "STAGE:"; ws.getCell("Q13").value = "Concept Design"; ws.getCell("S13").value = "STAGE:"; ws.getCell("T13").value = "Detailed Design";
    ws.getCell("P14").value = "PROGRAMME REF:"; ws.getCell("S14").value = "PROGRAMME REF:";
    put(ws, 15, ["DELIVERABLE (TITLE)", "DESCRIPTION", "Native Format", "Additional format", , , , , , , "Extracted from Model", "File Name", "Classification System", "NRM1 CODE", "OWNER", "Planned Date", "Actual date", "OWNER", "Planned Date", "Actual Date"]);
    put(ws, 16, [, , , ".pdf", ".nwc", ".nwd", ".ifc", ".mp4", ".avi", "Other"]);
    ws.getCell("B17").value = "MODELS";
    put(ws, 18, ["Architectural model", "Coordinated model", ".rvt", , "Y", , "Y", , , , , "PRJ-ARC-ZZ-ZZ-M3-A-0001", "Pr_20", "2.1", "Lead architect", new Date(Date.UTC(2026, 2, 1)), , "Lead architect", "15/06/2026", ""]);
    ws.getCell("B21").value = "DRAWINGS (CUT FROM MODEL)";
    put(ws, 22, ["Ground floor plan", "", ".dwg", "Y", , , , , , , "PRJ-ARC-ZZ-ZZ-M3-A-0001", "PRJ-ARC-ZZ-00-DR-A-0001", "", "", , , , "Lead architect", "2026-06-20", ""]);
    const p = await roundTrip(wb);
    expect(p.exchanges.map((x) => x.name)).toEqual(["Concept Design", "Detailed Design"]);
    expect(p.lines).toHaveLength(3);
    const model = p.lines.filter((l) => l.container === "PRJ-ARC-ZZ-ZZ-M3-A-0001");
    expect(model.map((l) => l.planned)).toEqual(["2026-03-01", "2026-06-15"]);
    expect(model[0]).toMatchObject({ title: "Architectural model", nativeFormat: "RVT", exchangeFormats: "NWC, IFC", classification: "Pr_20", costCode: "2.1", owner: "Lead architect", type: "M3" });
    expect(p.lines.find((l) => l.type === "DR")).toMatchObject({ modelRef: "PRJ-ARC-ZZ-ZZ-M3-A-0001", exchangeFormats: "PDF", planned: "2026-06-20" });
  });

  it("reads a TIDP template with 8-field names and planned / issued / owner groups, skipping placeholders", async () => {
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet("02_TIDP Template - AR");
    ws.getCell("R9").value = "DATA EXCHANGE #01"; ws.getCell("U9").value = "DATA EXCHANGE #02";
    ws.getCell("R10").value = "RIBA STAGE 2:"; ws.getCell("S10").value = "CONCEPT DESIGN"; ws.getCell("U10").value = "RIBA STAGE 3:"; ws.getCell("V10").value = "SPATIAL COORDINATION";
    ws.getCell("R11").value = "PROGRAMME REF:"; ws.getCell("S11").value = "100% CONCEPT DESIGN"; ws.getCell("U11").value = "PROGRAMME REF:"; ws.getCell("V11").value = "50% SCHEMATIC DESIGN";
    put(ws, 13, ["DELIVERABLE (FILE NAME)", "DESCRIPTION", "EXCHANGE FORMATS", "MODEL REFERENCE (For deliverables exported from models)", "PROJECT NUMBER", "PACKAGE NUMBER", "ORIGINATOR", "FUNCTIONAL BREAKDOWN", "SPATIAL BREAKDOWN", "FORM (FILE TYPE)", "DISCIPLINE", "NUMBER", "REVISION CODE (Metadata)", "STATUS CODE (Metadata)", " CODE", "TITLE", "PLANNED ISSUE DATE #01", "ISSUED DATE #01", "OWNER", "PLANNED ISSUE DATE #02", "ISSUED DATE #02", "OWNER2"]);
    ws.getCell("B14").value = "MODELS";
    put(ws, 15, ["Field 1-Field 2-Field 3", , , , "Field 1"]);
    put(ws, 16, ["XXXX-XXX-XX-XX-XX-X-0001", , , , "XXXX"]);
    put(ws, 17, ["P0001-K00001-ARC-B001-L01-M3-AR-000001", "Building model", "IFC", "", "P0001", "K00001", "ARC", "B001", "L01", "M3", "AR", "000001", "P01", "S1", "PM_40_30", "Architecture model", "2026-03-01", "2026-03-03", "Arch lead", "2026-06-01", "", "Arch lead"]);
    ws.getCell("B23").value = "DOCUMENTS, SCHEDULES, & REPORTS";
    const p = await roundTrip(wb);
    expect(p.exchanges.map((x) => x.name)).toEqual(["CONCEPT DESIGN — 100% CONCEPT DESIGN", "SPATIAL COORDINATION — 50% SCHEMATIC DESIGN"]);
    expect(p.lines).toHaveLength(2);
    expect(p.lines[0]).toMatchObject({ container: "P0001-K00001-ARC-B001-L01-M3-AR-000001", title: "Architecture model", description: "Building model", taskTeam: "AR", teamCode: "ARC", type: "M3", exchangeFormats: "IFC", classification: "PM_40_30", revision: "P01", suitability: "S1", planned: "2026-03-01", issued: "2026-03-03", owner: "Arch lead" });
    expect(p.lines[1]).toMatchObject({ planned: "2026-06-01", issued: "" });
  });
});

describe("importing a workbook into a project", () => {
  it("matches teams and milestones, and lists what must be created", async () => {
    const { planImport } = await import("./midpWorkbook");
    const p = {
      sheets: ["TIDP-ARC"], warnings: [],
      exchanges: [{ key: "X01", name: "Concept design — 100% concept", programmeRef: "100% concept", date: "2026-03-01" }, { key: "X02", name: "Tender", programmeRef: "", date: "2026-08-01" }, { key: "X03", name: "Undated", programmeRef: "", date: "" }],
      lines: [
        line({ container: "TWA-ARC-ZZ-ZZ-M3-A-0001", title: "Model", teamCode: "ARC", exchange: "X01", planned: "2026-02-20", exchangeFormats: "IFC, .nwc" }),
        line({ container: "TWA-ARC-ZZ-ZZ-M3-A-0001", title: "Model", teamCode: "ARC", exchange: "X02", planned: "2026-07-20" }),
        line({ container: "TWA-MEP-ZZ-ZZ-M3-M-0001", title: "MEP model", teamCode: "MEP", taskTeam: "Mechanical", exchange: "X03" }),
      ],
    };
    const r = planImport(p, [{ id: "t1", name: "Architecture", originatorCode: "ARC" }], [{ id: "m1", name: "Concept design" }]);
    expect(r.rows.map((x) => [x.teamKey, x.milestoneKey, x.dueDate])).toEqual([["t1", "m1", "2026-02-20"], ["t1", "new:X02", "2026-07-20"], ["new:MEP", null, ""]]);
    expect(r.rows[0].formats).toEqual(["IFC", "NWC"]);
    expect(r.newTeams).toEqual([{ key: "new:MEP", name: "Mechanical", originatorCode: "MEP" }]);
    expect(r.newMilestones).toEqual([{ key: "new:X02", name: "Tender", date: "2026-08-01" }]);
    expect(r.warnings.join()).toMatch(/Undated/);
  });
});
