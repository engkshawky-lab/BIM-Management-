import { createHash, randomBytes, randomUUID } from "node:crypto";

/** Shared token format for /auth/reset. Only the SHA-256 digest is persisted. */
export function passwordReset(userId: string, origin: string, lifetimeMs = 3600_000, now = new Date()) {
  if (!Number.isSafeInteger(lifetimeMs) || lifetimeMs <= 0) throw new Error("Invalid reset lifetime");
  const token = randomBytes(32).toString("hex");
  return {
    row: { id: randomUUID(), userId, tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(now.getTime() + lifetimeMs), createdAt: now },
    link: `${origin.replace(/\/$/, "")}/#/reset/${token}`,
  };
}
