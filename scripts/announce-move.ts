// Tell the people brought over from the old ISO 19650 platform that it has moved here. Their email and password are
// unchanged (scripts/sync-old-platform.ts copied the password hashes), so the email is a notice, not a reset link.
// Sends through the portal's own mailer (SMTP_* variables). Nothing is sent without --send or --test-to.
//
//   npx tsx scripts/announce-move.ts --public-url https://iso.example.com                    dry run: who would get it
//   npx tsx scripts/announce-move.ts --public-url https://iso.example.com --test-to me@x.com  one sample to yourself
//   npx tsx scripts/announce-move.ts --public-url https://iso.example.com --send [--limit 20] [--only a@b.com]
//
// Audience: approved, enabled accounts that came from the old platform. Every address that was sent to is recorded in
// .local/announce-move/sent.txt, and a re-run skips them, so an interrupted send can simply be started again.
import { parseArgs } from "node:util";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { EmailBlocks } from "../server/emailLayout";

const { values } = parseArgs({ options: {
  "public-url": { type: "string" }, "test-to": { type: "string" }, send: { type: "boolean" },
  limit: { type: "string" }, only: { type: "string" }, "delay-ms": { type: "string" },
} });
const origin = (() => { try { return new URL(values["public-url"] ?? "").origin; } catch { return ""; } })();
const LOG_DIR = ".local/announce-move", LOG = `${LOG_DIR}/sent.txt`;
const delay = Number(values["delay-ms"] ?? 4000);

const PLAN_NAMES: Record<string, string> = { free: "Free", starter: "Starter", pro: "Professional", expert: "Expert" };
const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function message(name: string, email: string, plan: string, renewsAt: Date | null): EmailBlocks {
  const planName = PLAN_NAMES[plan];
  const ended = !!renewsAt && renewsAt < new Date();
  const host = new URL(origin).host;
  return {
    subject: "The ISO 19650 platform has moved to a new home",
    preheader: "Same email, same password: sign in at the new address.",
    badge: { text: "Platform moved", tone: "gold" },
    heading: "Your platform has a new home",
    intro: `Dear ${name}, the BIM Management and ISO 19650 learning platform has moved to a new, faster portal. Your account came with it.`,
    paragraphs: ["Sign in with the same email address and password you used before. Nothing needs to be set up again."],
    rows: [
      ["New address", host],
      ["Your email", email],
      ["Your plan", planName && plan !== "free" ? planName : null],
      [ended ? "Plan ended" : "Valid until", planName && plan !== "free" ? (renewsAt ? day(renewsAt) : "No end date") : null],
    ],
    steps: [
      `Open ${host}.`,
      "Sign in with your usual email and password.",
      "Forgotten it? Choose “Forgot password” on the sign-in page and we’ll email you a link.",
    ],
    notice: ended
      ? { tone: "info", text: `Your ${planName} plan ended on ${day(renewsAt!)}. You can still sign in; to renew, open Plan & billing or reply to this email.` }
      : { tone: "info", dir: "rtl", text: "انتقلت منصة BIM Management و ISO 19650 إلى عنوان جديد. سجّل الدخول بنفس البريد الإلكتروني وكلمة المرور، ويمكنك اختيار العربية من قائمة اللغة داخل المنصة." },
    button: { label: "Open the new portal", url: `${origin}/#/login` },
    reason: "You receive this because you have an account on the BIM Management and ISO 19650 platform, which has moved.",
    portalUrl: origin,
  };
}

async function main() {
  if (!origin.startsWith("https://")) throw new Error("--public-url must be the portal's https:// address");
  const { sendEmail, mailEnabled } = await import("../server/mailer");
  if ((values.send || values["test-to"]) && !mailEnabled()) throw new Error("SMTP is not configured (SMTP_HOST missing)");

  if (values["test-to"]) {
    const m = message("Ahmed", values["test-to"], "expert", new Date(Date.UTC(2027, 0, 31)));
    const ok = await sendEmail(values["test-to"], { ...m, subject: `[TEST] ${m.subject}` });
    console.log(JSON.stringify({ test: true, sent: ok }));
    return;
  }

  const { db, pool, schema } = await import("../server/db");
  const { and, eq, inArray } = await import("drizzle-orm");
  try {
    const rows = await db.select({ email: schema.users.email, name: schema.users.name, plan: schema.subscriptions.plan, renewsAt: schema.subscriptions.renewsAt })
      .from(schema.users).innerJoin(schema.subscriptions, eq(schema.subscriptions.userId, schema.users.id))
      .where(and(eq(schema.users.disabled, 0), inArray(schema.subscriptions.source, ["old-platform", "manus-import"])));
    const sent = new Set(existsSync(LOG) ? readFileSync(LOG, "utf8").split(/\r?\n/).filter(Boolean) : []);
    const only = values.only?.trim().toLowerCase();
    const limit = values.limit ? Number(values.limit) : Infinity;
    const todo = rows.filter((r) => !sent.has(r.email.toLowerCase()) && (!only || r.email.toLowerCase() === only))
      .filter((r) => !/\.(example|test|invalid|localhost)$/i.test(r.email)).slice(0, limit);
    console.log(JSON.stringify({ audience: rows.length, alreadySent: sent.size, toSend: todo.length, mode: values.send ? "send" : "dry-run" }));
    if (!values.send) return;
    mkdirSync(LOG_DIR, { recursive: true });
    let ok = 0, failed = 0;
    for (const r of todo) {
      const m = message(r.name, r.email, r.plan, r.renewsAt);
      if (await sendEmail(r.email, m)) { appendFileSync(LOG, r.email.toLowerCase() + "\n"); ok++; } else failed++;
      await sleep(delay); // stay well under the mailbox's hourly sending limit
    }
    console.log(JSON.stringify({ sent: ok, failed }));
  } finally { await pool.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => { console.error("announce failed:", (e as Error).message); process.exit(1); });
}
