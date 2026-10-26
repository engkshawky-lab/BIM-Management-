// COBie 2.4 (BS 1192-4) workbook validation. Works on plain sheet data so it can be tested without Excel files.

import type { Finding } from "./delivery";

export type Sheets = Record<string, Record<string, string>[]>;

interface SheetSpec { required: boolean; columns: string[]; mandatory: string[]; category?: boolean }

export const COBIE_SHEETS: Record<string, SheetSpec> = {
  Contact: { required: true, columns: ["Email", "CreatedBy", "CreatedOn", "Category", "Company", "Phone"], mandatory: ["Email", "CreatedBy", "CreatedOn", "Company"], category: true },
  Facility: { required: true, columns: ["Name", "CreatedBy", "CreatedOn", "Category", "ProjectName", "SiteName", "LinearUnits", "AreaUnits", "VolumeUnits", "CurrencyUnit", "AreaMeasurement"], mandatory: ["Name", "CreatedBy", "CreatedOn", "ProjectName", "SiteName", "LinearUnits", "AreaUnits"], category: true },
  Floor: { required: true, columns: ["Name", "CreatedBy", "CreatedOn", "Category", "Elevation", "Height"], mandatory: ["Name", "CreatedBy", "CreatedOn"], category: true },
  Space: { required: true, columns: ["Name", "CreatedBy", "CreatedOn", "Category", "FloorName", "Description", "RoomTag", "UsableHeight", "GrossArea", "NetArea"], mandatory: ["Name", "CreatedBy", "CreatedOn", "FloorName", "Description"], category: true },
  Zone: { required: false, columns: ["Name", "CreatedBy", "CreatedOn", "Category", "SpaceNames"], mandatory: ["Name", "CreatedBy", "CreatedOn", "SpaceNames"], category: true },
  Type: { required: true, columns: ["Name", "CreatedBy", "CreatedOn", "Category", "Description", "AssetType", "Manufacturer", "ModelNumber", "WarrantyGuarantorParts", "WarrantyDurationParts", "WarrantyGuarantorLabor", "WarrantyDurationLabor", "WarrantyDurationUnit", "ExpectedLife", "DurationUnit"], mandatory: ["Name", "CreatedBy", "CreatedOn", "Description", "AssetType", "Manufacturer", "ModelNumber"], category: true },
  Component: { required: true, columns: ["Name", "CreatedBy", "CreatedOn", "TypeName", "Space", "Description", "SerialNumber", "InstallationDate", "WarrantyStartDate", "TagNumber", "BarCode", "AssetIdentifier"], mandatory: ["Name", "CreatedBy", "CreatedOn", "TypeName", "Space", "Description"] },
  System: { required: false, columns: ["Name", "CreatedBy", "CreatedOn", "Category", "ComponentNames"], mandatory: ["Name", "CreatedBy", "CreatedOn", "ComponentNames"], category: true },
  Document: { required: false, columns: ["Name", "CreatedBy", "CreatedOn", "Category", "ApprovalBy", "Stage", "SheetName", "RowName", "Directory", "File"], mandatory: ["Name", "CreatedBy", "CreatedOn", "SheetName", "RowName"], category: true },
  Attribute: { required: false, columns: ["Name", "CreatedBy", "CreatedOn", "Category", "SheetName", "RowName", "Value", "Unit"], mandatory: ["Name", "SheetName", "RowName", "Value"] },
};

const blank = (v: string | undefined) => !v || !v.trim();
const isNA = (v: string | undefined) => !!v && /^n\/?a$/i.test(v.trim());
const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter((s) => s && !isNA(s));

export interface CobieReport {
  sheets: { name: string; rows: number; present: boolean; errors: number; warnings: number }[];
  findings: Finding[];
  stats: { floors: number; spaces: number; types: number; components: number; systems: number; contacts: number };
  score: number;
}

export function validateCobie(sheets: Sheets): CobieReport {
  const f: Finding[] = [];
  // Sheet names in the workbook may differ in case; normalise.
  const byName = new Map(Object.entries(sheets).map(([k, v]) => [k.toLowerCase(), v]));
  const rows = (name: string) => byName.get(name.toLowerCase()) ?? [];
  const perSheet = new Map<string, { errors: number; warnings: number }>();
  const push = (sheet: string, finding: Finding) => {
    f.push(finding);
    const c = perSheet.get(sheet) ?? { errors: 0, warnings: 0 };
    if (finding.severity === "error") c.errors++; else if (finding.severity === "warning") c.warnings++;
    perSheet.set(sheet, c);
  };
  // Collapse repeated row-level problems so reports stay readable.
  const bucket = new Map<string, { sheet: string; severity: Finding["severity"]; message: string; refs: string[] }>();
  const rowIssue = (sheet: string, severity: Finding["severity"], message: string, ref: string) => {
    const key = sheet + "|" + severity + "|" + message;
    const b = bucket.get(key) ?? { sheet, severity, message, refs: [] };
    b.refs.push(ref); bucket.set(key, b);
  };

  for (const [name, spec] of Object.entries(COBIE_SHEETS)) {
    if (!byName.has(name.toLowerCase())) {
      if (spec.required) push(name, { severity: "error", area: name, message: `Required worksheet "${name}" is missing.`, clause: "BS 1192-4" });
      continue;
    }
    const data = rows(name);
    if (spec.required && data.length === 0) push(name, { severity: "error", area: name, message: `Worksheet "${name}" has no rows.` });
    const headers = new Set(data.length ? Object.keys(data[0]) : []);
    const missingCols = data.length ? spec.columns.filter((c) => !headers.has(c)) : [];
    if (missingCols.length) push(name, { severity: spec.mandatory.some((m) => missingCols.includes(m)) ? "error" : "warning", area: name, message: `Missing columns: ${missingCols.join(", ")}.` });

    const key = name === "Contact" ? "Email" : "Name";
    const seen = new Map<string, number>();
    data.forEach((row, i) => {
      const ref = row[key] || `row ${i + 2}`;
      for (const col of spec.mandatory) if (headers.has(col) && blank(row[col])) rowIssue(name, "error", `Mandatory "${col}" is empty`, ref);
      if (spec.category && headers.has("Category") && !blank(row.Category) && !isNA(row.Category) && !row.Category.includes(":")) rowIssue(name, "warning", `Category should be "code: title" from the classification system (e.g. Uniclass)`, ref);
      if (headers.has("CreatedOn") && !blank(row.CreatedOn) && Number.isNaN(Date.parse(row.CreatedOn))) rowIssue(name, "warning", `CreatedOn is not a valid date`, ref);
      const k = (row[key] ?? "").trim().toLowerCase();
      if (k) seen.set(k, (seen.get(k) ?? 0) + 1);
    });
    for (const [k, n] of seen) if (n > 1) rowIssue(name, "error", `${key} must be unique (duplicated ${n}×)`, k);
  }

  // cross-sheet references
  const names = (sheet: string, col = "Name") => new Set(rows(sheet).map((r) => (r[col] ?? "").trim().toLowerCase()).filter(Boolean));
  const contacts = names("Contact", "Email"), floors = names("Floor"), spaces = names("Space"), types = names("Type"), components = names("Component");
  const check = (sheet: string, col: string, target: Set<string>, targetLabel: string, multi = false) => {
    for (const row of rows(sheet)) {
      const values = multi ? list(row[col]) : blank(row[col]) || isNA(row[col]) ? [] : [row[col].trim()];
      for (const v of values) if (!target.has(v.toLowerCase())) rowIssue(sheet, "error", `${col} "${v}" does not exist in ${targetLabel}`, row.Name || row.Email || "?");
    }
  };
  for (const sheet of Object.keys(COBIE_SHEETS)) if (byName.has(sheet.toLowerCase()) && contacts.size) check(sheet, "CreatedBy", contacts, "Contact");
  check("Space", "FloorName", floors, "Floor");
  check("Zone", "SpaceNames", spaces, "Space", true);
  check("Component", "TypeName", types, "Type");
  check("Component", "Space", spaces, "Space", true);
  check("System", "ComponentNames", components, "Component", true);
  for (const row of rows("Type")) if (!blank(row.Manufacturer) && !isNA(row.Manufacturer) && !contacts.has(row.Manufacturer.trim().toLowerCase()))
    rowIssue("Type", "warning", `Manufacturer should reference a Contact email`, row.Name);
  for (const doc of [...rows("Document"), ...rows("Attribute")]) {
    const target = doc.SheetName?.trim();
    if (!target || isNA(target)) continue;
    const spec = COBIE_SHEETS[Object.keys(COBIE_SHEETS).find((s) => s.toLowerCase() === target.toLowerCase()) ?? ""];
    if (!spec) continue;
    const pool = names(target, target.toLowerCase() === "contact" ? "Email" : "Name");
    if (!blank(doc.RowName) && !pool.has(doc.RowName.trim().toLowerCase())) rowIssue(rows("Document").includes(doc) ? "Document" : "Attribute", "warning", `RowName "${doc.RowName}" not found in ${target}`, doc.Name);
  }

  // completeness of the asset register
  const facility = rows("Facility");
  if (byName.has("facility") && facility.length !== 1) push("Facility", { severity: "error", area: "Facility", message: `Facility must have exactly one row (found ${facility.length}).` });
  const typesUsed = new Set(rows("Component").map((c) => (c.TypeName ?? "").trim().toLowerCase()));
  for (const t of rows("Type")) if (t.Name && !typesUsed.has(t.Name.trim().toLowerCase())) rowIssue("Type", "info", "Type has no components", t.Name);
  const spacesUsed = new Set(rows("Component").flatMap((c) => list(c.Space).map((s) => s.toLowerCase())));
  for (const s of rows("Space")) if (s.Name && !spacesUsed.has(s.Name.trim().toLowerCase())) rowIssue("Space", "info", "Space has no components", s.Name);

  for (const b of bucket.values()) {
    const sample = b.refs.slice(0, 5).join(", ") + (b.refs.length > 5 ? ` … +${b.refs.length - 5}` : "");
    push(b.sheet, { severity: b.severity, area: b.sheet, message: `${b.message} — ${b.refs.length} row${b.refs.length > 1 ? "s" : ""}.`, ref: sample });
  }

  const order = { error: 0, warning: 1, info: 2 };
  f.sort((a, z) => order[a.severity] - order[z.severity]);
  const errorRows = [...bucket.values()].filter((b) => b.severity === "error").reduce((n, b) => n + b.refs.length, 0) + f.filter((x) => x.severity === "error" && !bucket.has(x.area)).length;
  const totalRows = Object.keys(COBIE_SHEETS).reduce((n, s) => n + rows(s).length, 0) || 1;
  return {
    sheets: Object.keys(COBIE_SHEETS).map((name) => ({ name, rows: rows(name).length, present: byName.has(name.toLowerCase()), ...(perSheet.get(name) ?? { errors: 0, warnings: 0 }) })),
    findings: f,
    stats: { floors: rows("Floor").length, spaces: rows("Space").length, types: rows("Type").length, components: rows("Component").length, systems: rows("System").length, contacts: rows("Contact").length },
    score: Math.max(0, Math.round(100 - Math.min(100, (errorRows / totalRows) * 100) * 0.8 - f.filter((x) => x.severity === "warning").length * 2)),
  };
}
