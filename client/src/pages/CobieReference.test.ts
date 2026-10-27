import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { cobieSchema } from "../../../shared/data/cobieSchema";
import { buildCobieWorkbook } from "./CobieReference";

describe("COBie schema and blank workbook", () => {
  it("has unique sheets and columns, and references point at real sheets", () => {
    const names = new Set(cobieSchema.map((s) => s.name));
    expect(names.size).toBe(cobieSchema.length);
    for (const s of cobieSchema) {
      expect(new Set(s.columns.map((c) => c.name)).size, `${s.name} column names`).toBe(s.columns.length);
      // polymorphic links ("Name on the sheet given in SheetName") have no single target sheet
      for (const c of s.columns) if (c.references && /^[A-Z][A-Za-z]+\.[\w-]+$/.test(c.references)) expect(names.has(c.references.split(".")[0]), `${s.name}.${c.name} → ${c.references}`).toBe(true);
    }
  });

  it("builds a workbook with every sheet and colour-coded headers", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await buildCobieWorkbook() as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Instruction", ...cobieSchema.map((s) => s.name)]);
    const comp = wb.getWorksheet("Component")!;
    const first = cobieSchema.find((s) => s.name === "Component")!.columns[0];
    expect(comp.getRow(1).getCell(1).value).toBe(first.name);
    expect((comp.getRow(1).getCell(1).fill as ExcelJS.FillPattern).fgColor?.argb).toMatch(/^FF[0-9A-F]{6}$/);
    expect(wb.getWorksheet("Instruction")!.rowCount).toBe(1 + cobieSchema.reduce((a, s) => a + s.columns.length, 0));
  });
});
