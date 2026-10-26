import { describe, expect, it } from "vitest";
import { DEFAULT_TAG_FORMAT, buildTag, emptyStandard, validateCobieAgainstStandard, validateTag, type ClientStandardData } from "./standards";

// Synthetic standard only — no client documents in the repository.
const std = (): ClientStandardData => ({
  ...emptyStandard(),
  stages: ["Design", "Handover"],
  picklists: { "Category-Role": ["Owner", "Manufacturer"], "AssetType-Type": ["Fixed", "Moveable"] },
  cobie: [
    { sheet: "Contact", field: "Email", allowed: "AlphaNumeric", maxLength: 255, required: { Design: true, Handover: true } },
    { sheet: "Contact", field: "Category", foreignKey: "PickList.Category-Role", allowed: "PickList Values only", required: { Design: false, Handover: true } },
    { sheet: "Contact", field: "CreatedOn", allowed: "ISO Date", required: { Design: true, Handover: true } },
    { sheet: "Type", field: "AssetType", foreignKey: "PickList.AssetType-Type", required: { Design: false, Handover: true } },
    { sheet: "Type", field: "Category", foreignKey: "Uniclass Pr Products", required: { Design: false, Handover: true } },
    { sheet: "Component", field: "TypeName", foreignKey: "Type.Name", required: { Design: true, Handover: true } },
    { sheet: "Component", field: "SerialNumber", maxLength: 10, required: { Design: false, Handover: true } },
  ],
  tag: DEFAULT_TAG_FORMAT,
  classification: [{ system: "HVAC", systemCode: "HVAC", equipment: "Air handling unit", equipmentCode: "AHUT", uniclassPr: "Pr_60_65_03" }],
});

const sheets = () => ({
  Contact: [{ Email: "a@x.com", Category: "Owner", CreatedOn: "2026-01-01T10:00:00" }, { Email: "b@x.com", Category: "Painter", CreatedOn: "01/01/2026" }],
  Type: [{ Name: "AHU 1", AssetType: "Fixed", Category: "Pr_60_65_03: Air handling units" }, { Name: "Pump", AssetType: "Static", Category: "Pumps" }],
  Component: [
    { Name: "AHU-01", TypeName: "AHU 1", SerialNumber: "SN1", TagNumber: "MD-001-002-BA01-L1-BOH-0203A-HVAC-AHUT-AH0023" },
    { Name: "P-01", TypeName: "Pump 9", SerialNumber: "SERIAL-NUMBER-TOO-LONG", TagNumber: "MD-001-002-BA01-L1" },
  ],
});

describe("asset tags", () => {
  it("accepts a well-formed tag and builds one from parts", () => {
    expect(validateTag("MD-001-002-BA01-L1-BOH-0203A-HVAC-AHUT-AH0023", DEFAULT_TAG_FORMAT)).toEqual([]);
    expect(buildTag(DEFAULT_TAG_FORMAT, { portfolio: "md", district: "001", wbs: "002", building: "ba01", level: "l1", zone: "boh", space: "0203a", system: "hvac", equipment: "ahut", number: "ah0023" })).toBe("MD-001-002-BA01-L1-BOH-0203A-HVAC-AHUT-AH0023");
  });
  it("reports wrong part counts, lengths and codes", () => {
    expect(validateTag("MD-001", DEFAULT_TAG_FORMAT)[0]).toMatch(/Expected 10 parts/);
    expect(validateTag("MD-001-002-BA01-L1-BOH-0203A-HVAC-AHUT-AH23", DEFAULT_TAG_FORMAT)[0]).toMatch(/Unique number "AH23" must be 6/);
    const fmt = { ...DEFAULT_TAG_FORMAT, parts: DEFAULT_TAG_FORMAT.parts.map((p) => (p.id === "system" ? { ...p, codes: ["HVAC"] } : p)) };
    expect(validateTag("MD-001-002-BA01-L1-BOH-0203A-ELEC-AHUT-AH0023", fmt)[0]).toMatch(/not in the approved code list/);
    expect(validateTag("HVAC-AHUT-AH0023", DEFAULT_TAG_FORMAT, "equipment")).toEqual([]);
  });
});

describe("COBie against a client standard", () => {
  it("requires fields only at the stages that need them; present values are always checked", () => {
    const sh = sheets();
    sh.Type[0].AssetType = "";
    const design = validateCobieAgainstStandard(sh, std(), "Design").map((f) => f.message).join("\n");
    expect(design).not.toMatch(/"AssetType" is required/);
    expect(design).toMatch(/"Category" value not in picklist Category-Role/);
    const handover = validateCobieAgainstStandard(sh, std(), "Handover").map((f) => f.message).join("\n");
    expect(handover).toMatch(/"AssetType" is required at Handover/);
  });
  it("checks picklists, dates, lengths, foreign keys, Uniclass, tags and classification", () => {
    const f = validateCobieAgainstStandard(sheets(), std(), "Handover");
    const msgs = f.map((x) => `${x.severity}:${x.message} [${x.ref}]`).join("\n");
    expect(msgs).toMatch(/"CreatedOn" must be an ISO date/);
    expect(msgs).toMatch(/"AssetType" value not in picklist AssetType-Type .*Pump: Static/);
    expect(msgs).toMatch(/warning:"Category" should be a Uniclass Pr code/);
    expect(msgs).toMatch(/"TypeName" refers to Type.Name that does not exist .*Pump 9/);
    expect(msgs).toMatch(/"SerialNumber" longer than 10 characters/);
    expect(msgs).toMatch(/TagNumber does not follow the asset tag format .*P-01/);
    expect(msgs).not.toMatch(/AHU-01/);
  });
});

describe("standard hygiene", () => {
  it("accepts equipment-only tags and splits multi-value references", async () => {
    const { validateTagAuto, cleanPicklist } = await import("./standards");
    expect(validateTagAuto("HVAC-AHUT-AH0023", DEFAULT_TAG_FORMAT)).toEqual([]);
    expect(validateTagAuto("HVAC-AHUT", DEFAULT_TAG_FORMAT)[0]).toMatch(/Expected 10 parts/);
    expect(cleanPicklist(["DG", "Refer to Appendix 01.1", "This value should be the plot ID", "WH"])).toEqual(["DG", "WH"]);
    const s = std();
    s.cobie.push({ sheet: "Job", field: "ResourceNames", foreignKey: "Resource.Name", required: {} });
    const f = validateCobieAgainstStandard({ Job: [{ Name: "J1", ResourceNames: "Filter, Oil" }], Resource: [{ Name: "Filter" }, { Name: "Oil" }] }, s, "Handover");
    expect(f.filter((x) => x.area === "Job")).toEqual([]);
  });
});
