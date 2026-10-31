import { desc, eq, sql } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { z } from "zod";
import { COMPANY_VIDEO_TOPICS, VIDEO_FILE_TYPES, VIDEO_LANGS, parseVideoLink } from "../../shared/companyVideos";
import { db, newId, schema } from "../db";
import { UPLOAD_DIR } from "../storage";
import { h, parse } from "./auth";

// Our videos: administrators upload the organisation's own training videos (or add a YouTube / Vimeo link);
// every signed-in user can watch them. Uploaded files are streamed with HTTP range support so players can seek.

const r = Router();
const upload = multer({
  storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_req, _file, cb) => cb(null, newId()) }),
  limits: { fileSize: Number(process.env.VIDEO_MAX_MB ?? 2048) * 1024 * 1024 },
});
const requireAdmin = (req: Request, res: Response, next: NextFunction) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Only administrators can manage videos." }));
const BY_EXT: Record<string, string> = { ".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm", ".ogv": "video/ogg", ".mov": "video/quicktime" };
const videoType = (file: Express.Multer.File) => {
  const t = (file.mimetype || "").toLowerCase();
  if ((VIDEO_FILE_TYPES as readonly string[]).includes(t)) return t;
  return BY_EXT[path.extname(file.originalname).toLowerCase()] ?? null;
};
const meta = z.object({
  title: z.string().trim().min(2, "Give the video a title.").max(200), description: z.string().trim().max(2000).default(""),
  topic: z.enum(COMPANY_VIDEO_TOPICS), lang: z.enum(VIDEO_LANGS).default("en"),
});
const fileOf = (key: string) => path.join(UPLOAD_DIR, path.basename(key));

r.get("/company-videos", h(async (_req, res) => {
  const rows = await db.select({
    id: schema.companyVideos.id, title: schema.companyVideos.title, description: schema.companyVideos.description, topic: schema.companyVideos.topic,
    lang: schema.companyVideos.lang, source: schema.companyVideos.source, url: schema.companyVideos.url, fileName: schema.companyVideos.fileName,
    mimeType: schema.companyVideos.mimeType, size: schema.companyVideos.size, views: schema.companyVideos.views, createdAt: schema.companyVideos.createdAt,
    uploadedByName: schema.users.name,
  }).from(schema.companyVideos).leftJoin(schema.users, eq(schema.users.id, schema.companyVideos.uploadedBy)).orderBy(desc(schema.companyVideos.createdAt));
  res.json({ videos: rows.map((v) => ({ ...v, uploadedByName: v.uploadedByName ?? "" })), topics: COMPANY_VIDEO_TOPICS });
}));

// multipart: a video file, or a "link" field with a YouTube / Vimeo address
r.post("/company-videos", requireAdmin, upload.single("file"), h(async (req, res) => {
  const drop = () => req.file && fs.promises.unlink(req.file.path).catch(() => {});
  const body = parse(meta, req.body, res); if (!body) { drop(); return; }
  const base = { id: newId(), ...body, uploadedBy: req.user!.id, createdAt: new Date() };
  if (req.file) {
    const type = videoType(req.file);
    if (!type) { drop(); return res.status(400).json({ error: "Upload an MP4, WebM, OGG or MOV video. MP4 (H.264) plays in every browser." }); }
    await db.insert(schema.companyVideos).values({ ...base, source: "file", fileName: req.file.originalname.slice(0, 255), mimeType: type, size: req.file.size, storageKey: req.file.filename });
  } else {
    const link = parseVideoLink(String(req.body.link ?? ""));
    if (!link) return res.status(400).json({ error: "Choose a video file, or paste a YouTube or Vimeo link." });
    await db.insert(schema.companyVideos).values({ ...base, source: link.source, url: link.id });
  }
  res.status(201).json({ id: base.id });
}));

r.put("/company-videos/:id", requireAdmin, h(async (req, res) => {
  const body = parse(meta, req.body, res); if (!body) return;
  await db.update(schema.companyVideos).set(body).where(eq(schema.companyVideos.id, req.params.id));
  res.json({ ok: true });
}));

r.delete("/company-videos/:id", requireAdmin, h(async (req, res) => {
  const [row] = await db.select().from(schema.companyVideos).where(eq(schema.companyVideos.id, req.params.id));
  if (!row) return res.status(404).json({ error: "Not found." });
  await db.delete(schema.companyVideos).where(eq(schema.companyVideos.id, row.id));
  if (row.storageKey) fs.promises.unlink(fileOf(row.storageKey)).catch(() => {});
  res.json({ ok: true });
}));

// counted once per play from the client, not per range request
r.post("/company-videos/:id/view", h(async (req, res) => {
  await db.update(schema.companyVideos).set({ views: sql`${schema.companyVideos.views} + 1` }).where(eq(schema.companyVideos.id, req.params.id));
  res.json({ ok: true });
}));

r.get("/company-videos/:id/file", h(async (req, res) => {
  const [row] = await db.select().from(schema.companyVideos).where(eq(schema.companyVideos.id, req.params.id));
  if (!row || row.source !== "file") return res.status(404).json({ error: "Not found." });
  const full = fileOf(row.storageKey);
  if (!fs.existsSync(full)) return res.status(410).json({ error: "Stored file is missing." });
  // sendFile answers Range requests (206) so the player can seek and start before the whole file arrives
  res.sendFile(full, {
    headers: {
      "Content-Type": row.mimeType, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(row.fileName)}`,
    },
  });
}));

export default r;
