import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { setting } from "./appSettings";

// Security headers for every response. The CSP allows only what the client uses: its own scripts and workers,
// Google Fonts, YouTube and Vimeo lesson embeds, and YouTube thumbnails. Routes can still set a stricter CSP
// (file previews do). Off in development, where Vite serves the client with inline scripts and HMR.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "media-src 'self' blob:",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Content-Security-Policy", CSP);
    // HSTS only over HTTPS (behind a proxy, req.secure follows X-Forwarded-Proto because "trust proxy" is set)
    if (req.secure) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

// One log line per API request: request id, method, path, status, time and user id. Bodies, query strings and
// cookies are never logged. The id is returned as X-Request-Id so a user's error report can be matched to the log.
// The logRequests setting: "errors" logs only 4xx/5xx and slow (>3 s) requests; "off" turns it off.
export function requestLog(req: Request, res: Response, next: NextFunction) {
  const mode = setting<string>("logRequests");
  if (mode === "off") return next();
  const id = randomUUID().slice(0, 8);
  const start = Date.now();
  res.setHeader("X-Request-Id", id);
  res.on("finish", () => {
    const ms = Date.now() - start;
    if (mode === "errors" && res.statusCode < 400 && ms < 3000) return;
    const line = JSON.stringify({ t: new Date().toISOString(), id, m: req.method, p: req.baseUrl + req.path, s: res.statusCode, ms, u: req.user?.id });
    if (res.statusCode >= 500) console.error(line); else console.log(line);
  });
  next();
}

// Short burst limit on AI requests per user, on top of the monthly counts in billing.ts: stops runaway scripts
// and double-clicks from spending the API budget. The aiPerMinute setting (default 20) sets it; 0 turns it off.
const hits = new Map<string, number[]>();
export function aiBurstExceeded(userId: string, now = Date.now()) {
  const max = Number(setting<number>("aiPerMinute"));
  if (!max) return false;
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= max) { hits.set(userId, recent); return true; }
  recent.push(now); hits.set(userId, recent);
  return false;
}
