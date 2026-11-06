import { randomInt } from "crypto";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { pathById } from "../../shared/data/learningPaths";
import { QUESTIONS } from "../../shared/data/learn";
import { ATTEMPTS_PER_DAY, PASS_MARK, certificateCode, drawQuestions, examFor, examSize, gradeExam } from "../../shared/data/pathExams";
import { setting } from "../appSettings";
import { db, newId, schema } from "../db";
import { h, parse } from "./auth";

// Learning-path final exams and the certificates they earn. Questions are drawn and graded on the server, so a
// certificate can be trusted; anyone can check one at /certificate/<code> without signing in.

const rand = () => randomInt(0, 1_000_000) / 1_000_000;
const GRACE_MS = 2 * 60_000;
const SIGNATURE_KEY = "certSignature";
const requireAdmin = (req: Request, res: Response, next: NextFunction) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Administrators only." }));

async function signature(): Promise<string> {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, SIGNATURE_KEY));
  return String((row?.value as { dataUrl?: string } | undefined)?.dataUrl ?? "");
}
const issuer = () => setting<string>("certIssuer") || setting<string>("maker") || setting<string>("siteName");
const publicCert = (c: typeof schema.certificates.$inferSelect) => ({ code: c.code, name: c.name, pathId: c.pathId, title: c.title, pct: c.pct, issuer: c.issuer, signatoryName: c.signatoryName, signatoryTitle: c.signatoryTitle, issuedAt: c.issuedAt });
const questionsFor = (ids: string[]) => ids.map((id) => { const q = QUESTIONS.find((x) => x.id === id)!; return { id, topic: q.topic, q: q.q, options: q.options }; });

export const publicCertificates = Router();
publicCertificates.get("/public/certificates/:code", h(async (req, res) => {
  const code = String(req.params.code).toUpperCase();
  if (!/^BIM-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return res.status(404).json({ error: "Certificate not found." });
  const [c] = await db.select().from(schema.certificates).where(eq(schema.certificates.code, code));
  if (!c) return res.status(404).json({ error: "Certificate not found." });
  res.set("Cache-Control", "no-cache").json({ certificate: publicCert(c), signature: await signature(), siteName: setting<string>("siteName"), autodeskUrl: setting<string>("certAutodeskUrl") });
}));

const r = Router();

/** Start (or resume) the final exam of a learning path. */
r.post("/learn/paths/:pathId/exam", h(async (req, res) => {
  const path = pathById(req.params.pathId), exam = examFor(req.params.pathId);
  if (!path || !exam) return res.status(404).json({ error: "This learning path has no exam." });
  const uid = req.user!.id, now = new Date();
  const [open] = await db.select().from(schema.pathExams).where(and(eq(schema.pathExams.userId, uid), eq(schema.pathExams.pathId, path.id), isNull(schema.pathExams.submittedAt), gte(schema.pathExams.expiresAt, now)));
  if (open) return res.json({ examId: open.id, expiresAt: open.expiresAt, minutes: exam.minutes, passMark: PASS_MARK, questions: questionsFor(open.questionIds) });
  const recent = await db.select({ id: schema.pathExams.id }).from(schema.pathExams).where(and(eq(schema.pathExams.userId, uid), eq(schema.pathExams.pathId, path.id), gte(schema.pathExams.startedAt, new Date(now.getTime() - 86_400_000))));
  if (recent.length >= ATTEMPTS_PER_DAY) return res.status(429).json({ error: `You have used the ${ATTEMPTS_PER_DAY} attempts allowed in 24 hours. Review the steps and try again tomorrow.` });
  const ids = drawQuestions(exam, rand);
  const row = { id: newId(), userId: uid, pathId: path.id, questionIds: ids, startedAt: now, expiresAt: new Date(now.getTime() + exam.minutes * 60_000) };
  await db.insert(schema.pathExams).values(row);
  res.status(201).json({ examId: row.id, expiresAt: row.expiresAt, minutes: exam.minutes, passMark: PASS_MARK, questions: questionsFor(ids) });
}));

/** Submit answers: graded on the server; a pass issues the certificate (once per path). */
r.post("/learn/exams/:id/submit", h(async (req, res) => {
  const body = parse(z.object({ answers: z.record(z.string(), z.number().int().min(-1).max(10)).refine((a) => Object.keys(a).length <= 100) }), req.body, res); if (!body) return;
  const [ex] = await db.select().from(schema.pathExams).where(and(eq(schema.pathExams.id, req.params.id), eq(schema.pathExams.userId, req.user!.id)));
  if (!ex) return res.status(404).json({ error: "Exam not found." });
  if (ex.submittedAt) return res.status(409).json({ error: "This exam has already been submitted." });
  const late = Date.now() > ex.expiresAt.getTime() + GRACE_MS;
  const result = gradeExam(ex.questionIds, late ? {} : body.answers);
  await db.update(schema.pathExams).set({ submittedAt: new Date(), score: result.score, total: result.total, pct: result.pct, passed: result.passed }).where(eq(schema.pathExams.id, ex.id));
  let certificate = null;
  if (result.passed) {
    const [have] = await db.select().from(schema.certificates).where(and(eq(schema.certificates.userId, req.user!.id), eq(schema.certificates.pathId, ex.pathId)));
    if (have) certificate = publicCert(have);
    else {
      const path = pathById(ex.pathId)!;
      for (let i = 0; i < 5 && !certificate; i++) {
        const c = { id: newId(), code: certificateCode(rand), userId: req.user!.id, examId: ex.id, name: req.user!.name.slice(0, 160), pathId: path.id, title: path.title, pct: result.pct,
          issuer: issuer().slice(0, 160), signatoryName: setting<string>("certSignatoryName").slice(0, 160), signatoryTitle: setting<string>("certSignatoryTitle").slice(0, 160), issuedAt: new Date() };
        try { await db.insert(schema.certificates).values(c); certificate = publicCert(c as typeof schema.certificates.$inferSelect); } catch { /* code clash: draw again */ }
      }
    }
  }
  res.json({ ...result, late, passMark: PASS_MARK, certificate, autodeskUrl: setting<string>("certAutodeskUrl") });
}));

/** Attempts and certificate for each path, for the learning-path pages. */
r.get("/learn/exams", h(async (req, res) => {
  const uid = req.user!.id;
  const attempts = await db.select({ id: schema.pathExams.id, pathId: schema.pathExams.pathId, startedAt: schema.pathExams.startedAt, submittedAt: schema.pathExams.submittedAt, pct: schema.pathExams.pct, passed: schema.pathExams.passed })
    .from(schema.pathExams).where(eq(schema.pathExams.userId, uid)).orderBy(desc(schema.pathExams.startedAt)).limit(100);
  const certs = await db.select().from(schema.certificates).where(eq(schema.certificates.userId, uid)).orderBy(desc(schema.certificates.issuedAt));
  const day = Date.now() - 86_400_000;
  const exams = Object.fromEntries([...new Set(attempts.map((a) => a.pathId))].map((p) => [p, { attemptsToday: attempts.filter((a) => a.pathId === p && a.startedAt.getTime() > day).length, best: Math.max(0, ...attempts.filter((a) => a.pathId === p && a.submittedAt).map((a) => a.pct)) }]));
  res.json({ attempts: attempts.filter((a) => a.submittedAt), exams, certificates: certs.map(publicCert), passMark: PASS_MARK, attemptsPerDay: ATTEMPTS_PER_DAY, sizes: Object.fromEntries(["modeller", "coordinator", "bim-manager", "client", "ai-governance"].map((p) => [p, examFor(p) ? { questions: examSize(examFor(p)!), minutes: examFor(p)!.minutes } : null])) });
}));

// ---- administrators: the signature image and the register of issued certificates
r.get("/admin/certificates", requireAdmin, h(async (_req, res) => {
  const rows = await db.select().from(schema.certificates).orderBy(desc(schema.certificates.issuedAt)).limit(500);
  res.json({ certificates: rows.map(publicCert), signature: await signature(), signatoryName: setting<string>("certSignatoryName"), signatoryTitle: setting<string>("certSignatoryTitle") });
}));
r.put("/admin/certificates/signature", requireAdmin, h(async (req, res) => {
  const body = parse(z.object({ dataUrl: z.string().max(400_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Upload a PNG, JPEG or WebP image.").or(z.literal("")) }), req.body, res); if (!body) return;
  await db.insert(schema.settings).values({ key: SIGNATURE_KEY, value: { dataUrl: body.dataUrl } }).onDuplicateKeyUpdate({ set: { value: { dataUrl: body.dataUrl } } });
  res.json({ ok: true });
}));

export default r;
