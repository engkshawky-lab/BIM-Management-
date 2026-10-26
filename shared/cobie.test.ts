import { describe, expect, it } from "vitest";
import { validateCobie, type Sheets } from "./cobie";

const meta = { CreatedBy: "im@fo.com", CreatedOn: "2026-10-01T09:00:00" };
const good = (): Sheets => ({
  Contact: [{ Email: "im@fo.com", Company: "First Option", Category: "Ro_10: Client", Phone: "1", ...meta }, { Email: "sales@acme.com", Company: "Acme", Category: "Ro_20: Supplier", Phone: "2", ...meta }],
  Facility: [{ Name: "Tower A", Category: "Co_25: Office", ProjectName: "TWA", SiteName: "Cairo", LinearUnits: "millimeters", AreaUnits: "square meters", VolumeUnits: "cubic meters", CurrencyUnit: "EGP", AreaMeasurement: "NRM", ...meta }],
  Floor: [{ Name: "Level 01", Category: "Floor: Floor", Elevation: "3500", Height: "3500", ...meta }],
  Space: [{ Name: "101", Category: "SL_20: Office", FloorName: "Level 01", Description: "Office", RoomTag: "101", UsableHeight: "2700", GrossArea: "20", NetArea: "18", ...meta }],
  Type: [{ Name: "Door 900", Category: "Pr_30_59_24: Doorsets", Description: "Single door", AssetType: "Fixed", Manufacturer: "sales@acme.com", ModelNumber: "AX-9", WarrantyGuarantorParts: "sales@acme.com", WarrantyDurationParts: "2", WarrantyGuarantorLabor: "sales@acme.com", WarrantyDurationLabor: "1", WarrantyDurationUnit: "year", ExpectedLife: "25", DurationUnit: "year", ...meta }],
  Component: [{ Name: "D-101", TypeName: "Door 900", Space: "101", Description: "Door to 101", SerialNumber: "n/a", InstallationDate: "2026-09-01", WarrantyStartDate: "2026-09-01", TagNumber: "D101", BarCode: "n/a", AssetIdentifier: "A1", ...meta }],
});

describe("validateCobie", () => {
  it("accepts a clean workbook", () => {
    const r = validateCobie(good());
    expect(r.findings.filter((f) => f.severity !== "info")).toEqual([]);
    expect(r.stats).toMatchObject({ spaces: 1, components: 1 });
    expect(r.score).toBe(100);
  });
  it("reports missing sheets and broken references", () => {
    const s = good();
    delete (s as Partial<Sheets>).Floor;
    s.Component.push({ ...s.Component[0], Name: "D-102", TypeName: "Door 1200", Space: "101, 999" });
    s.Component.push({ ...s.Component[0] }); // duplicate name
    const msgs = validateCobie(s).findings.map((f) => `${f.severity}:${f.message}`).join("\n");
    expect(msgs).toMatch(/error:Required worksheet "Floor" is missing/);
    expect(msgs).toMatch(/error:FloorName "Level 01" does not exist in Floor/);
    expect(msgs).toMatch(/TypeName "Door 1200" does not exist in Type/);
    expect(msgs).toMatch(/Space "999" does not exist in Space/);
    expect(msgs).toMatch(/Name must be unique/);
  });
  it("groups repeated row problems and checks mandatory fields and contacts", () => {
    const s = good();
    s.Space = Array.from({ length: 8 }, (_, i) => ({ ...s.Space[0], Name: `S${i}`, Description: "", CreatedBy: "nobody@x.com" }));
    const r = validateCobie(s);
    const empty = r.findings.find((f) => f.message.startsWith('Mandatory "Description" is empty'))!;
    expect(empty.message).toMatch(/8 rows/);
    expect(empty.ref).toMatch(/\+3$/);
    expect(r.findings.some((f) => /CreatedBy "nobody@x.com" does not exist in Contact/.test(f.message))).toBe(true);
    expect(r.sheets.find((x) => x.name === "Space")!.errors).toBe(2);
  });
});
