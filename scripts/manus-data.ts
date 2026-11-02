import ExcelJS from "exceljs";
import { z } from "zod";

// Some exports use absolute table relationship targets unsupported by ExcelJS.
// These definitions do not affect the row values or date styles we import.
export const MANUS_XLSX_OPTIONS = { ignoreNodes: ["tableParts"] };

export const HEADERS = ["User ID", "Full Name", "Email", "Organisation", "Country", "Job Title", "Purpose", "Mobile", "Level", "Region", "Role", "Account Status", "Subscription Type", "Subscription Expiry Date", "Payment Confirmed", "Payment Method", "Payment Date", "Applied Promo Code", "Promo Expiry Date", "Original Price", "Final Price", "Campaign Source", "Campaign Medium", "Campaign Name", "Campaign Content", "Registered At (UTC)", "Last Login At (UTC)"];
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export function excelDate(value: unknown, field: string, required = false): Date | null {
  if (value === null || value === undefined || value === "") {
    if (required) throw new Error(`${field}: required`);
    return null;
  }
  // Excel's fictitious 1900-02-29 is rejected. Dates after it use the usual epoch.
  const date = value instanceof Date ? new Date(value) : typeof value === "number" && value >= 1 && value < 2958466 && Math.floor(value) !== 60
    ? new Date(Date.UTC(1899, 11, value < 60 ? 31 : 30) + Math.round(value * 86400_000)) : null;
  if (!date || !Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1000 || date.getUTCFullYear() > 9999) throw new Error(`${field}: invalid date`);
  return date;
}
function scalar(value: ExcelJS.CellValue): string | number | Date | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) return value;
  if (typeof value === "object" && "richText" in value) return value.richText.map(v => v.text).join("");
  if (typeof value === "object" && "hyperlink" in value) return value.text;
  throw new Error("Unsupported cell value (formula/error/boolean)");
}
export function mapRecord(raw: Record<string, unknown>, row: number) {
  const text = (key: string, max = Infinity) => {
    const value = String(raw[key] ?? "").trim();
    if (value.length > max) throw new Error(`${key}: exceeds ${max} characters`);
    return value;
  };
  const email = normalizeEmail(text("Email", 255));
  if (!z.email().safeParse(email).success) throw new Error("Email: invalid");
  const name = text("Full Name", 120);
  if (!name || !text("User ID")) throw new Error("Full Name/User ID: required");
  const role = text("Role").toLowerCase();
  if (role !== "user" && role !== "admin") throw new Error("Role: unsupported");
  const status = text("Account Status").toLowerCase();
  if (status !== "pending" && status !== "approved") throw new Error("Account Status: unsupported");
  const sourcePlan = text("Subscription Type").toLowerCase();
  const plan = sourcePlan === "professional" ? "pro" : sourcePlan === "expert" || sourcePlan === "starter" ? sourcePlan : role === "admin" && !sourcePlan ? "free" : null;
  if (!plan) throw new Error("Subscription Type: unsupported or missing");
  const createdAt = excelDate(raw["Registered At (UTC)"], "Registered At (UTC)", true)!;
  const renewsAt = excelDate(raw["Subscription Expiry Date"], "Subscription Expiry Date");
  // Validate archived date fields too, preserving a UTC representation in the sidecar.
  const metadata = { ...raw };
  for (const key of ["Payment Date", "Promo Expiry Date"]) metadata[key] = excelDate(raw[key], key)?.toISOString() ?? "";
  return { row, email, role, status, plan, renewsAt, metadata,
    user: { email, name, organization: text("Organisation", 160), jobTitle: text("Job Title", 120),
      phone: text("Mobile").replace(/^'/, "").trim(), role, createdAt,
      lastLoginAt: excelDate(raw["Last Login At (UTC)"], "Last Login At (UTC)"), disabled: status === "pending" ? 2 : 0,
      emailVerifiedAt: createdAt, locale: "en" },
  };
}
export type ManusRecord = ReturnType<typeof mapRecord>;
export function parseWorkbook(workbook: ExcelJS.Workbook) {
  if (workbook.properties.date1904) throw new Error("Expected Excel 1900 date system");
  for (const name of ["Summary", "Data Dictionary", "User Register"]) if (!workbook.getWorksheet(name)) throw new Error(`Missing sheet: ${name}`);
  const sheet = workbook.getWorksheet("User Register")!;
  const columns = new Map<string, number>();
  sheet.getRow(4).eachCell((cell, column) => {
    const key = String(cell.value ?? "").trim();
    if (columns.has(key)) throw new Error("Duplicate header");
    columns.set(key, column);
  });
  for (const header of HEADERS) if (!columns.has(header)) throw new Error(`Missing header: ${header}`);
  const records: ManusRecord[] = [], skipped: { row: number; reason: string }[] = [];
  const seen = new Set<string>();
  sheet.eachRow((r, index) => {
    if (index <= 4 || !r.hasValues) return;
    // Catch only per-row validation errors so an operator can review all rejected rows.
    try {
      const raw = Object.fromEntries(HEADERS.map(key => [key, scalar(r.getCell(columns.get(key)!).value)]));
      const record = mapRecord(raw, index);
      if (record.user.phone.length > 40) throw new Error("Mobile: exceeds 40 characters");
      if (seen.has(record.email)) throw new Error("Duplicate normalized email in workbook");
      seen.add(record.email);
      records.push(record);
    } catch (error) { skipped.push({ row: index, reason: (error as Error).message }); }
  });
  return { records, skipped };
}
export function csv(rows: unknown[][]) {
  // RFC4180 quoting plus spreadsheet formula injection protection.
  return rows.map(row => row.map(value => {
    let text = value instanceof Date ? value.toISOString() : String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n") + "\r\n";
}
