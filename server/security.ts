import type { NextFunction, Request, Response } from "express";

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

// Short burst limit on AI requests per user, on top of the monthly counts in billing.ts: stops runaway scripts
// and double-clicks from spending the API budget. AI_PER_MINUTE (default 20) sets it; 0 turns it off.
const hits = new Map<string, number[]>();
export function aiBurstExceeded(userId: string, now = Date.now()) {
  const max = Number(process.env.AI_PER_MINUTE ?? 20);
  if (!max) return false;
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= max) { hits.set(userId, recent); return true; }
  recent.push(now); hits.set(userId, recent);
  return false;
}
