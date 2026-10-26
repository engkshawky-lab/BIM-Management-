import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db, newId, schema } from "./db";

export const SESSION_COOKIE = "portal_session";
const TTL_SECONDS = 60 * 60 * 24 * 14;

export type PublicUser = Omit<typeof schema.users.$inferSelect, "passwordHash">;
declare module "express-serve-static-core" {
  interface Request { user?: PublicUser }
}

function secret() {
  const s = process.env.SESSION_SECRET ?? "";
  if (s.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return s;
}

export function parseCookieHeader(header: string | undefined): Record<string, string> {
  return Object.fromEntries((header || "").split(";").map((part) => {
    const i = part.indexOf("=");
    if (i < 0) return ["", ""] as const;
    try { return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1))] as const; } catch { return ["", ""] as const; }
  }).filter(([k]) => k));
}

export function signSessionToken(sessionId: string, key = secret()) {
  const sig = createHmac("sha256", key).update(sessionId).digest("base64url");
  return `${sessionId}.${sig}`;
}

export function verifySessionToken(token: string | undefined, key = secret()): string | null {
  if (!token) return null;
  const [sid, sig, ...rest] = token.split(".");
  if (!sid || !sig || rest.length) return null;
  const expected = Buffer.from(createHmac("sha256", key).update(sid).digest("base64url"));
  const supplied = Buffer.from(sig);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected) ? sid : null;
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export function toPublic(u: typeof schema.users.$inferSelect): PublicUser {
  const { passwordHash: _omit, ...rest } = u;
  return rest;
}

export async function startSession(res: Response, userId: string) {
  const id = newId();
  const now = new Date();
  await db.insert(schema.sessions).values({ id, userId, createdAt: now, expiresAt: new Date(now.getTime() + TTL_SECONDS * 1000) });
  await db.update(schema.users).set({ lastLoginAt: now }).where(eq(schema.users.id, userId));
  res.cookie(SESSION_COOKIE, signSessionToken(id), {
    // Secure when the request arrived over HTTPS (directly or via a proxy), so plain-HTTP LAN installs still work
    httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : res.req.secure, maxAge: TTL_SECONDS * 1000, path: "/",
  });
}

export async function endSession(req: Request, res: Response) {
  const sid = verifySessionToken(parseCookieHeader(req.headers.cookie)[SESSION_COOKIE]);
  if (sid) await db.delete(schema.sessions).where(eq(schema.sessions.id, sid));
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const sid = verifySessionToken(parseCookieHeader(req.headers.cookie)[SESSION_COOKIE]);
    if (sid) {
      const [row] = await db.select({ user: schema.users }).from(schema.sessions)
        .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
        .where(and(eq(schema.sessions.id, sid), gt(schema.sessions.expiresAt, new Date())));
      if (row && !row.user.disabled) req.user = toPublic(row.user);
    }
    next();
  } catch (e) { next(e); }
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Please sign in." });
  next();
}
