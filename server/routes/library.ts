import { desc, eq, sql } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { z } from "zod";
import { db, newId, schema } from "../db";
import { UPLOAD_DIR } from "../storage";
import { h, parse } from "./auth";

// Downloads library: administrators curate files (templates, checklists, guides); every signed-in user can browse and download.

export const LIBRARY_CATEGORIES = ["EIR", "BEP", "OIR / AIR / PIR", "MIDP / TIDP", "Checklist", "Guide", "Worked example", "Standards & annexes", "Model / IFC", "General"] as const;

const r = Router();
const upload = multer({
  storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_req, _file, cb) => cb(null, newId()) }),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB ?? 250) * 1024 * 1024 },
});
const requireAdmin = (req: Request, res: Response, next: NextFunction) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Only administrators can manage the library." }));
const INLINE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp", "text/plain"]);
const meta = z.object({
  title: z.string().trim().min(2).max(200), description: z.string().trim().max(2000).default(""),
  category: z.enum(LIBRARY_CATEGORIES), part: z.string().max(16).default(""),
});

r.get("/library", h(async (_req, res) => {
  const rows = await db.select({
    id: schema.resources.id, title: schema.resources.title, description: schema.resources.description, category: schema.resources.category, part: schema.resources.part,
    fileName: schema.resources.fileName, mimeType: schema.resources.mimeType, size: schema.resources.size, downloads: schema.resources.downloads, createdAt: schema.resources.createdAt,
  }).from(schema.resources).orderBy(desc(schema.resources.createdAt));
  res.json({ resources: rows.map((x) => ({ ...x, previewable: INLINE_TYPES.has(x.mimeType) })), categories: LIBRARY_CATEGORIES });
}));

r.post("/library", requireAdmin, upload.single("file"), h(async (req, res) => {
  const drop = () => req.file && fs.promises.unlink(req.file.path).catch(() => {});
  if (!req.file) return res.status(400).json({ error: "Choose a file to upload." });
  const body = parse(meta, req.body, res); if (!body) { drop(); return; }
  const id = newId();
  await db.insert(schema.resources).values({
    id, ...body, fileName: req.file.originalname.slice(0, 255), mimeType: (req.file.mimetype || "application/octet-stream").slice(0, 120),
    size: req.file.size, storageKey: req.file.filename, uploadedBy: req.user!.id, createdAt: new Date(),
  });
  res.status(201).json({ id });
}));

r.put("/library/:id", requireAdmin, h(async (req, res) => {
  const body = parse(meta, req.body, res); if (!body) return;
  await db.update(schema.resources).set(body).where(eq(schema.resources.id, req.params.id));
  res.json({ ok: true });
}));

r.delete("/library/:id", requireAdmin, h(async (req, res) => {
  const [row] = await db.select().from(schema.resources).where(eq(schema.resources.id, req.params.id));
  if (!row) return res.status(404).json({ error: "Not found." });
  await db.delete(schema.resources).where(eq(schema.resources.id, row.id));
  fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(row.storageKey))).catch(() => {});
  res.json({ ok: true });
}));

r.get("/library/:id/file", h(async (req, res) => {
  const [row] = await db.select().from(schema.resources).where(eq(schema.resources.id, req.params.id));
  if (!row) return res.status(404).json({ error: "Not found." });
  const full = path.join(UPLOAD_DIR, path.basename(row.storageKey));
  if (!fs.existsSync(full)) return res.status(410).json({ error: "Stored file is missing." });
  // Same rules as project files: only passive types render inline, and the sandbox CSP blocks scripts.
  const inline = !!req.query.inline && INLINE_TYPES.has(row.mimeType);
  if (!inline) await db.update(schema.resources).set({ downloads: sql`${schema.resources.downloads} + 1` }).where(eq(schema.resources.id, row.id));
  res.setHeader("Content-Type", inline ? row.mimeType : "application/octet-stream");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(row.fileName)}`);
  fs.createReadStream(full).pipe(res);
}));

export default r;
