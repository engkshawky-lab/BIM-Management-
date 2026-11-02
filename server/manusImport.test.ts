import ExcelJS from "exceljs";
import JSZip from "jszip";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { csv, excelDate, HEADERS, MANUS_XLSX_OPTIONS, mapRecord, parseWorkbook } from "../scripts/manus-data";
import { passwordReset } from "./passwordReset";

const raw = (extra = {}) => ({ "User ID": "legacy-admin-id", "Full Name": "Test Person", Email: " PERSON@EXAMPLE.COM ",
  Organisation: "Example", "Job Title": "Engineer", Mobile: "'+201234", Role: "user", "Account Status": "pending",
  "Subscription Type": "professional", "Registered At (UTC)": 45000.5, "Subscription Expiry Date": 46000, ...extra });
function workbook(rows: Record<string, unknown>[]) {
  const w = new ExcelJS.Workbook();
  w.addWorksheet("Summary"); w.addWorksheet("Data Dictionary");
  const sheet = w.addWorksheet("User Register");
  sheet.getRow(4).values = HEADERS;
  for (const row of rows) sheet.addRow(HEADERS.map(key => row[key] ?? null));
  return w;
}
describe("Manus migration mapping", () => {
  it("reads exports with absolute table relationships without changing source cells", async () => {
    const w = workbook([]);
    w.getWorksheet("User Register")!.addTable({ name: "Register", ref: "A4", headerRow: true,
      columns: HEADERS.map(name => ({ name })), rows: [HEADERS.map(key => raw()[key as keyof ReturnType<typeof raw>] ?? null)] });
    const zip = await JSZip.loadAsync(await w.xlsx.writeBuffer());
    const relationship = "xl/worksheets/_rels/sheet3.xml.rels";
    const xml = await zip.file(relationship)!.async("string");
    zip.file(relationship, xml.replace('../tables/table1.xml', '/xl/tables/table1.xml'));
    const reloaded = new ExcelJS.Workbook();
    await reloaded.xlsx.load(await zip.generateAsync({ type: "nodebuffer" }), MANUS_XLSX_OPTIONS);
    expect(parseWorkbook(reloaded).records).toHaveLength(1);
    expect(parseWorkbook(reloaded).records[0].user.createdAt).toEqual(new Date("2023-03-15T12:00:00Z"));
  });
  it("roundtrips a synthetic XLSX and preserves pending approval and UTC dates", async () => {
    const original = workbook([raw()]);
    const w = new ExcelJS.Workbook();
    await w.xlsx.load(await original.xlsx.writeBuffer());
    const result = parseWorkbook(w);
    expect(result.skipped).toEqual([]);
    expect(result.records[0]).toMatchObject({ email: "person@example.com", plan: "pro", user: {
      phone: "+201234", disabled: 2, organization: "Example", jobTitle: "Engineer", role: "user",
      createdAt: new Date("2023-03-15T12:00:00Z"), emailVerifiedAt: new Date("2023-03-15T12:00:00Z"), lastLoginAt: null,
    } });
  });
  it("keeps admins and supports blank admin subscriptions", () => {
    const record = mapRecord(raw({ Role: "admin", "Account Status": "approved", "Subscription Type": "", "Last Login At (UTC)": new Date("2025-01-01Z") }), 5);
    expect(record.user).toMatchObject({ role: "admin", disabled: 0, lastLoginAt: new Date("2025-01-01Z") });
    expect(record.plan).toBe("free");
  });
  it.each(["starter", "expert"])("maps %s", plan => expect(mapRecord(raw({ "Subscription Type": plan }), 5).plan).toBe(plan));
  it("rejects duplicate normalized emails and malformed records without exposing values", () => {
    const result = parseWorkbook(workbook([raw(), raw({ Email: "person@example.com" }), raw({ Email: "PRIVATE_INVALID_VALUE" }), raw({ Email: "second@example.com", Role: "recruiter" })]));
    expect(result.records).toHaveLength(1);
    expect(result.skipped).toEqual([{ row: 6, reason: "Duplicate normalized email in workbook" }, { row: 7, reason: "Email: invalid" }, { row: 8, reason: "Role: unsupported" }]);
  });
  it("rejects malformed dates, missing plans/status and truncation", () => {
    for (const patch of [{ "Registered At (UTC)": "bad" }, { "Registered At (UTC)": null }, { "Account Status": "unknown" }, { "Subscription Type": "" }, { "Full Name": "x".repeat(121) }, { "Payment Date": "bad" }]) expect(() => mapRecord(raw(patch), 5)).toThrow();
    expect(excelDate(1, "date")).toEqual(new Date("1900-01-01Z"));
    expect(() => excelDate(60, "date")).toThrow();
    expect(excelDate(null, "date")).toBeNull();
  });
  it("ignores calculated expiry formulas but rejects formulas in imported fields", () => {
    const w = workbook([raw()]);
    const sheet = w.getWorksheet("User Register")!;
    sheet.getCell(4, 28).value = "Expiry Status (calculated)";
    sheet.getCell(5, 28).value = { formula: 'TODAY()' };
    expect(parseWorkbook(w).records).toHaveLength(1);
    sheet.getCell(5, 2).value = { formula: 'TODAY()' };
    expect(parseWorkbook(w).skipped).toHaveLength(1);
  });
  it("rejects wrong date systems and headers", () => {
    const w = workbook([]); w.properties.date1904 = true;
    expect(() => parseWorkbook(w)).toThrow("1900");
    w.properties.date1904 = false; w.getWorksheet("User Register")!.getCell(4, 1).value = "wrong";
    expect(() => parseWorkbook(w)).toThrow("Missing header");
  });
  it("escapes CSV quotes, newlines and spreadsheet formulas", () => {
    expect(csv([['=CMD()', 'a"b', 'line\nbreak', '+20123']])).toBe('"\'=CMD()","a""b","line\nbreak","\'+20123"\r\n');
  });
  it("issues app-compatible one-time tokens with a 14-day expiry and only hashes stored", () => {
    const now = new Date("2026-01-01Z");
    const reset = passwordReset("user-id", "https://portal.example/", 14 * 86400_000, now);
    const token = reset.link.split("/").at(-1)!;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(reset.row.tokenHash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(reset.row.expiresAt).toEqual(new Date("2026-01-15Z"));
    expect(JSON.stringify(reset.row)).not.toContain(token);
    expect(passwordReset("user-id", "https://portal.example").link).not.toBe(reset.link);
    expect(() => passwordReset("user-id", "https://portal.example", -1)).toThrow();
  });
});
