import crypto from "crypto";
import type { RequestHandler } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "storage");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/** Disk upload whose size limit is read on each request, so the admin setting applies without a restart. */
export function diskUpload(maxMb: () => number) {
  const make = () => multer({
    storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_req, _file, cb) => cb(null, crypto.randomUUID()) }),
    limits: { fileSize: Math.max(1, maxMb()) * 1024 * 1024 },
  });
  return { single: (field: string): RequestHandler => (req, res, next) => make().single(field)(req, res, next) };
}
