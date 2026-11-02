import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { and, eq, gt, isNull } from "drizzle-orm";
import { csv, HEADERS, MANUS_XLSX_OPTIONS, normalizeEmail, parseWorkbook } from "./manus-data";
import { passwordReset } from "../server/passwordReset";

const outputRoot = path.resolve(".local/manus-import");
async function outputPath(input: string) {
  const destination = path.resolve(input);
  if (path.dirname(destination) !== outputRoot) throw new Error("Outputs must be directly inside .local/manus-import/");
  await mkdir(outputRoot, { recursive: true, mode: 0o700 });
  if ((await realpath(outputRoot)).toLowerCase() !== outputRoot.toLowerCase()) throw new Error("Output folder must not be a symlink");
  return destination;
}
const save = (file: string, rows: unknown[][]) => writeFile(file, csv(rows), { flag: "wx", mode: 0o600 });

export async function main(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    apply: { type: "boolean" }, offline: { type: "boolean" }, report: { type: "string" },
    "invite-links": { type: "string" }, "public-url": { type: "string" }, only: { type: "string" }, limit: { type: "string" },
  } });
  if (positionals.length !== 1) throw new Error("Usage: npx tsx scripts/import-manus-users.ts <xlsx> [--offline | --apply] [--report .local/manus-import/report.csv] [--invite-links .local/manus-import/invites.csv --public-url https://portal.example]");
  if (values.offline && (values.apply || values["invite-links"])) throw new Error("--offline cannot write to the database");
  const inviteMode = !!values["invite-links"];
  if (inviteMode && !values.apply) throw new Error("Token creation requires --apply (separate invitation mode; does not import users)");
  if (!inviteMode && (values.only || values.limit || values["public-url"])) throw new Error("--only, --limit and --public-url require --invite-links");
  const limit = values.limit === undefined ? Infinity : Number(values.limit);
  if (values.limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) throw new Error("--limit must be a positive integer");
  let origin = "";
  if (inviteMode) {
    const url = new URL(values["public-url"] ?? "");
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("--public-url must be an HTTPS origin without credentials/path/query/fragment");
    origin = url.origin;
  }
  const workbook = new ExcelJS.Workbook();
  // Export table relationships use a target form ExcelJS cannot reconcile. Table
  // definitions are presentation metadata; cell values and styles/dates remain loaded.
  await workbook.xlsx.readFile(positionals[0], MANUS_XLSX_OPTIONS);
  const { records, skipped } = parseWorkbook(workbook);
  const countBy = (key: "role" | "status" | "plan") => records.reduce<Record<string, number>>((acc, r) => { acc[r[key]] = (acc[r[key]] ?? 0) + 1; return acc; }, {});
  console.log(JSON.stringify({ mode: inviteMode ? "invites" : values.apply ? "apply" : "dry-run", valid: records.length, skipped: skipped.length,
    roles: countBy("role"), statuses: countBy("status"), plans: countBy("plan"), rejectedRows: skipped }, null, 2));
  if (values.apply && skipped.length) throw new Error("Apply refused: resolve rejected workbook rows first");
  if (values.offline) {
    console.log("Database comparison: NOT CHECKED (--offline). No database module loaded.");
    if (values.report) await save(await outputPath(values.report), [["row", "email", "result", ...HEADERS], ...records.map(r => [r.row, r.email, "offline-not-checked", ...HEADERS.map(key => r.metadata[key])])]);
    return;
  }
  // Only this branch loads the DB module. There is no environment-file loading or migration execution.
  const { db, pool, schema } = await import("../server/db");
  try {
    const existing = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users);
    const matches = new Map<string, string>();
    for (const user of existing) {
      const email = normalizeEmail(user.email);
      if (matches.has(email)) throw new Error("Database has ambiguous normalized emails; resolve before import");
      matches.set(email, user.id);
    }
    const present = records.filter(r => matches.has(r.email));
    console.log(JSON.stringify({ existing: present.length, wouldInsert: records.length - present.length }));
    const report = values.report || (values.apply && !inviteMode ? `.local/manus-import/mapping-${Date.now()}.csv` : undefined);
    // Save the complete source mapping BEFORE commit, so no unsupported data is lost if filesystem writes fail.
    // IDs are allocated up front; result=planned is intentional (transaction may subsequently fail).
    const ids = new Map(records.map(r => [r.email, matches.get(r.email) ?? randomUUID()]));
    if (report) await save(await outputPath(report), [["row", "portal_user_id", "normalized_email", "result", ...HEADERS],
      ...records.map(r => [r.row, ids.get(r.email), r.email, matches.has(r.email) ? "existing-skipped" : values.apply && !inviteMode ? "planned-insert" : "would-insert", ...HEADERS.map(key => r.metadata[key])]),
      ...skipped.map(r => [r.row, "", "", r.reason])]);
    else if (present.length) console.log("Use --report .local/manus-import/report.csv for the private list of existing emails.");
    if (!values.apply) return;
    if (inviteMode) {
      const destination = await outputPath(values["invite-links"]!);
      const candidates = records.filter(r => matches.has(r.email) && (!values.only || r.email === normalizeEmail(values.only))).slice(0, limit);
      let issued = 0;
      await db.transaction(async tx => {
        const links: unknown[][] = [["email", "name", "link"]];
        for (const r of candidates) {
          const userId = matches.get(r.email)!;
          const [subscription] = await tx.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId));
          // Avoid generating links for unrelated pre-existing portal accounts, disabled or pending accounts.
          const [user] = await tx.select().from(schema.users).where(eq(schema.users.id, userId)).for("update");
          if (!user || user.disabled || subscription?.source !== "manus-import") continue;
          const [active] = await tx.select().from(schema.passwordResets).where(and(eq(schema.passwordResets.userId, userId), isNull(schema.passwordResets.usedAt), gt(schema.passwordResets.expiresAt, new Date())));
          if (active) continue; // Never rotate a usable link on a repeated run.
          const reset = passwordReset(userId, origin, 14 * 86400_000);
          await tx.insert(schema.passwordResets).values(reset.row);
          links.push([user.email, user.name, reset.link]);
          issued++;
        }
        await save(destination, links);
      });
      console.log(JSON.stringify({ issued, candidates: candidates.length, emailSent: 0 }));
      return;
    }
    let inserted = 0;
    await db.transaction(async tx => {
      for (const r of records) {
        if (matches.has(r.email)) continue;
        const id = ids.get(r.email)!;
        await tx.insert(schema.users).values({ id, ...r.user, passwordHash: await bcrypt.hash(randomBytes(48).toString("hex"), 12) });
        await tx.insert(schema.subscriptions).values({ userId: id, plan: r.plan, status: "active", renewsAt: r.renewsAt, source: "manus-import", updatedAt: new Date() });
        inserted++;
      }
    });
    console.log(JSON.stringify({ committed: true, inserted, skippedExisting: present.length }));
  } finally { await pool.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  // Driver errors can contain complete INSERT values. Fail loudly without leaking personal data or tokens.
  main().catch(error => {
    console.error("Manus import FAILED. No success should be inferred. Inspect the private report and database state before retrying.");
    console.error(error instanceof Error && !('sql' in error) && !('query' in error) && !('cause' in error) ? error.message : "Database operation failed (SQL/parameters withheld).");
    process.exitCode = 1;
  });
}
