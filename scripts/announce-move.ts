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

const { values } = parseArgs({ options: {
  "public-url": { type: "string" }, "test-to": { type: "string" }, send: { type: "boolean" },
  limit: { type: "string" }, only: { type: "string" }, "delay-ms": { type: "string" },
} });
const origin = (() => { try { return new URL(values["public-url"] ?? "").origin; } catch { return ""; } })();
const LOG_DIR = ".local/announce-move", LOG = `${LOG_DIR}/sent.txt`;
const delay = Number(values["delay-ms"] ?? 4000);

const PLAN_NAMES: Record<string, string> = { free: "Free", starter: "Starter", pro: "Professional", expert: "Expert" };
const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function message(name: string, plan: string, renewsAt: Date | null) {
  const planLine = plan === "free" || !PLAN_NAMES[plan] ? "" : !renewsAt ? `Your ${PLAN_NAMES[plan]} plan has come over with you.`
    : renewsAt < new Date() ? `Your ${PLAN_NAMES[plan]} plan ended on ${day(renewsAt)}. You can still sign in, and renew under Plan & billing or contact us.`
      : `Your ${PLAN_NAMES[plan]} plan has come over with you and runs until ${day(renewsAt)}.`;
  return {
    subject: "The ISO 19650 platform has moved to a new home",
    lines: [
      `Dear ${name},`,
      `The BIM Management and ISO 19650 platform has moved to a new, faster portal at ${origin}.`,
      "Sign in with the same email address and password you used before. Nothing needs to be set up again.",
      ...(planLine ? [planLine] : []),
      "If you don't remember your password, choose \"Forgot password\" on the sign-in page and we'll email you a link.",
      "انتقلت منصة إدارة معلومات البناء (BIM) ومعايير ISO 19650 إلى عنوان جديد. سجّل الدخول بنفس البريد الإلكتروني وكلمة المرور السابقة، ويمكنك اختيار العربية من قائمة اللغة.",
      "Thank you for learning with us. If anything doesn't work, reply to this email.",
      "FirstOption BIM Management team",
    ],
    action: { label: "Open the new portal", url: `${origin}/#/login` },
  };
}

async function main() {
  if (!origin.startsWith("https://")) throw new Error("--public-url must be the portal's https:// address");
  const { sendMail, mailEnabled } = await import("../server/mailer");
  if ((values.send || values["test-to"]) && !mailEnabled()) throw new Error("SMTP is not configured (SMTP_HOST missing)");

  if (values["test-to"]) {
    const m = message("Ahmed", "expert", new Date(Date.UTC(2027, 0, 31)));
    const ok = await sendMail(values["test-to"], `[TEST] ${m.subject}`, m.lines, m.action);
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
      const m = message(r.name, r.plan, r.renewsAt);
      if (await sendMail(r.email, m.subject, m.lines, m.action)) { appendFileSync(LOG, r.email.toLowerCase() + "\n"); ok++; } else failed++;
      await sleep(delay); // stay well under the mailbox's hourly sending limit
    }
    console.log(JSON.stringify({ sent: ok, failed }));
  } finally { await pool.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => { console.error("announce failed:", (e as Error).message); process.exit(1); });
}
