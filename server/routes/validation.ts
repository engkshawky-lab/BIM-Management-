import ExcelJS from "exceljs";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Router } from "express";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { validateCobie, type Sheets } from "../../shared/cobie";
import { validateCobieAgainstStandard, type ClientStandardData } from "../../shared/standards";
import { analyseIfc, requirementsFromIds, requirementsFromLoin, type Requirement } from "../../shared/ifc";
import { logActivity, notify, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { h, parse } from "./auth";
import { UPLOAD_DIR } from "../storage";

const r = Router();
const P = "/projects/:projectId";
const MAX_IFC_BYTES = 300 * 1024 * 1024;

export type ValidationKind = "ifc" | "cobie";
export const validationKind = (name: string): ValidationKind | null =>
  /\.ifc$/i.test(name) ? "ifc" : /\.xlsx$/i.test(name) && /cobie/i.test(name) ? "cobie" : null;

async function storedPath(fileId: string, version: number) {
  const [v] = await db.select().from(schema.fileVersions).where(and(eq(schema.fileVersions.fileId, fileId), eq(schema.fileVersions.version, version)));
  return v ? { full: path.join(UPLOAD_DIR, path.basename(v.storageKey)), size: v.size } : null;
}

const cellText = (v: ExcelJS.CellValue): string => {
  if (v === null || v === undefined) return "";
  // whole-day dates stay date-only so length rules on date columns hold
  if (v instanceof Date) return v.toISOString().endsWith("T00:00:00.000Z") ? v.toISOString().slice(0, 10) : v.toISOString().slice(0, 19);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
    if ("text" in v) return String(v.text);
    if ("error" in v) return "";
  }
  return String(v).trim();
};

export async function readWorkbook(file: string): Promise<Sheets> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const out: Sheets = {};
  wb.eachSheet((ws) => {
    const header = (ws.getRow(1).values as ExcelJS.CellValue[]).map(cellText);
    const rows: Record<string, string>[] = [];
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const values = row.values as ExcelJS.CellValue[];
      const rec: Record<string, string> = {};
      let any = false;
      header.forEach((h, i) => { if (h) { rec[h] = cellText(values[i]); if (rec[h]) any = true; } });
      if (any) rows.push(rec);
    });
    out[ws.name] = rows;
  });
  return out;
}

/** Requirement sources for IFC checks: the project's LOIN matrix plus any IDS files in the CDE. */
async function projectRequirements(projectId: string, idsFileId?: string) {
  const loin = await db.select().from(schema.loinRows).where(eq(schema.loinRows.projectId, projectId));
  const reqs: Requirement[] = requirementsFromLoin(loin);
  const notes: string[] = [];
  const idsFiles = (await db.select().from(schema.files).where(eq(schema.files.projectId, projectId)))
    .filter((f) => (idsFileId ? f.id === idsFileId : /\.ids$/i.test(f.name)));
  for (const f of idsFiles) {
    const p = await storedPath(f.id, f.currentVersion);
    if (!p || !fs.existsSync(p.full)) continue;
    const { requirements, unsupported } = requirementsFromIds(fs.readFileSync(p.full, "utf8"));
    reqs.push(...requirements.map((q) => ({ ...q, name: `${f.name}: ${q.name}` })));
    if (unsupported) notes.push(`${f.name}: ${unsupported} IDS facets (classification/material/partOf) are not evaluated yet.`);
  }
  return { reqs, notes, sources: { loin: loin.length, ids: idsFiles.map((f) => f.name) } };
}

export async function runValidation(projectId: string, fileId: string, userId: string, idsFileId?: string) {
  const [file] = await db.select().from(schema.files).where(and(eq(schema.files.id, fileId), eq(schema.files.projectId, projectId)));
  if (!file) throw Object.assign(new Error("File not found."), { status: 404 });
  const kind = validationKind(file.name);
  if (!kind) throw Object.assign(new Error("Only .ifc models and COBie .xlsx workbooks (with 'COBie' in the name) can be validated."), { status: 400 });
  const stored = await storedPath(file.id, file.currentVersion);
  if (!stored || !fs.existsSync(stored.full)) throw Object.assign(new Error("Stored file is missing."), { status: 410 });

  let report: unknown, status: string, score: number, errors: number, warnings: number, summary: string;
  try {
    if (kind === "ifc") {
      if (stored.size > MAX_IFC_BYTES) throw new Error(`Model is larger than ${MAX_IFC_BYTES / 1048576} MB.`);
      const { reqs, notes, sources } = await projectRequirements(projectId, idsFileId);
      const rep = analyseIfc(fs.readFileSync(stored.full, "latin1"), { requirements: reqs });
      for (const n of notes) rep.findings.push({ severity: "info", area: "IDS", message: n });
      report = { ...rep, sources };
      errors = rep.findings.filter((x) => x.severity === "error").length; warnings = rep.findings.filter((x) => x.severity === "warning").length; score = rep.score;
      summary = `${rep.schema} · ${rep.elementCount} elements · ${rep.requirements.length} requirement sets`;
    } else {
      const sheets = await readWorkbook(stored.full);
      const rep = validateCobie(sheets);
      // The project's client standard adds schema, picklist, stage, tag and classification rules.
      const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
      const [std] = project.standardId ? await db.select().from(schema.clientStandards).where(eq(schema.clientStandards.id, project.standardId)) : [];
      if (std) {
        const data = std.data as ClientStandardData;
        const stage = project.standardStage || data.stages[data.stages.length - 1] || "";
        rep.findings.push(...validateCobieAgainstStandard(sheets, data, stage));
        const order = { error: 0, warning: 1, info: 2 } as const;
        rep.findings.sort((a, z2) => order[a.severity] - order[z2.severity]);
        rep.score = Math.max(0, rep.score - rep.findings.filter((x) => x.clause === "Client standard" && x.severity === "error").length * 4);
        (rep as typeof rep & { standard?: { name: string; stage: string } }).standard = { name: std.name, stage };
      }
      report = rep;
      errors = rep.findings.filter((x) => x.severity === "error").length; warnings = rep.findings.filter((x) => x.severity === "warning").length; score = rep.score;
      summary = `${rep.stats.components} components · ${rep.stats.types} types · ${rep.stats.spaces} spaces`;
    }
    status = errors ? "fail" : warnings ? "warn" : "pass";
  } catch (e) {
    report = { error: (e as Error).message }; status = "error"; score = 0; errors = 1; warnings = 0; summary = (e as Error).message.slice(0, 500);
  }
  const id = newId();
  await db.insert(schema.validationRuns).values({ id, projectId, fileId, fileVersion: file.currentVersion, kind, status, score, errors, warnings, summary, report, createdBy: userId, createdAt: new Date() });
  const link = `/projects/${projectId}/validation/${id}`;
  await logActivity(projectId, userId, "validation.run", `Validated ${file.name} v${file.currentVersion}: ${status.toUpperCase()} (score ${score})`, link);
  if (status === "fail" || status === "error") await notify(projectId, userId, `${file.name} v${file.currentVersion} failed validation (${errors} errors)`, link, file.uploadedBy);
  return { id, status, score, errors, warnings };
}

/** Sharing gate: latest validation of the current version must not have failed. */
export async function sharingBlocker(fileId: string, version: number): Promise<string | null> {
  const [run] = await db.select().from(schema.validationRuns).where(and(eq(schema.validationRuns.fileId, fileId), eq(schema.validationRuns.fileVersion, version))).orderBy(desc(schema.validationRuns.createdAt)).limit(1);
  if (run && (run.status === "fail" || run.status === "error")) return `Version ${version} failed validation with ${run.errors} errors. Fix the model or ask a manager to override.`;
  return null;
}

r.post(P + "/files/:fileId/validate", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ idsFileId: z.string().optional() }), req.body ?? {}, res); if (!body) return;
  try { res.status(201).json(await runValidation(req.params.projectId, req.params.fileId, req.user!.id, body.idsFileId)); }
  catch (e) { const err = e as Error & { status?: number }; if (!err.status) throw e; res.status(err.status).json({ error: err.message }); }
}));

r.get(P + "/validation", requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  const files = (await db.select().from(schema.files).where(eq(schema.files.projectId, pid))).filter((f) => validationKind(f.name) || /\.ids$/i.test(f.name));
  const runs = files.length ? await db.select({
    id: schema.validationRuns.id, fileId: schema.validationRuns.fileId, fileVersion: schema.validationRuns.fileVersion, kind: schema.validationRuns.kind,
    status: schema.validationRuns.status, score: schema.validationRuns.score, errors: schema.validationRuns.errors, warnings: schema.validationRuns.warnings,
    summary: schema.validationRuns.summary, createdAt: schema.validationRuns.createdAt, by: schema.users.name,
  }).from(schema.validationRuns).leftJoin(schema.users, eq(schema.users.id, schema.validationRuns.createdBy))
    .where(and(eq(schema.validationRuns.projectId, pid), inArray(schema.validationRuns.fileId, files.map((f) => f.id)))).orderBy(desc(schema.validationRuns.createdAt)) : [];
  const loin = await db.select({ id: schema.loinRows.id }).from(schema.loinRows).where(eq(schema.loinRows.projectId, pid));
  res.json({ files, runs, requirementSources: { loinRows: loin.length, idsFiles: files.filter((f) => /\.ids$/i.test(f.name)).map((f) => ({ id: f.id, name: f.name })) } });
}));

r.get(P + "/validation/:runId", requireProject(), h(async (req, res) => {
  const [run] = await db.select().from(schema.validationRuns).where(and(eq(schema.validationRuns.id, req.params.runId), eq(schema.validationRuns.projectId, req.params.projectId)));
  if (!run) return res.status(404).json({ error: "Validation run not found." });
  const [file] = await db.select().from(schema.files).where(eq(schema.files.id, run.fileId));
  res.json({ run, file });
}));

export default r;
