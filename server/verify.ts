import crypto from "crypto";
import { db, newId, schema } from "./db";
import { sendMail } from "./mailer";

// Email confirmation for new accounts: a one-time link, valid 48 hours, stored only as a hash.
export const tokenHash = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

export async function sendVerification(user: { id: string; email: string; name: string }, base: string) {
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(schema.emailVerifications).values({ id: newId(), userId: user.id, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 48 * 3600_000), createdAt: new Date() });
  const sent = await sendMail(user.email, "Confirm your email address", [`Hello ${user.name},`, "Welcome to the portal. Confirm your email address to start using your account. The link works once and expires in 48 hours.", "If you didn't create an account, ignore this email."], { label: "Confirm my email", url: `${base}/#/verify/${token}` });
  if (!sent) console.log(`[verify email] could not send to ${user.email}`);
  return sent;
}
