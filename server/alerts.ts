import { setting } from "./appSettings";
import { mailEnabled, publicUrl, sendMail } from "./mailer";

// Error alerts: server failures (500s, unhandled rejections) and page crashes reported by browsers are kept in a
// short in-memory list for Admin › Settings and sent to the alert email (or every administrator) and the optional
// webhook. Each kind of error is sent at most once an hour, and no more than 20 alerts go out in any hour.

export interface ErrorEntry { key: string; source: "server" | "page"; message: string; where: string; first: string; last: string; count: number; requestId?: string }

const recent: ErrorEntry[] = [];
const lastSent = new Map<string, number>();
let sent: number[] = [];
const HOUR = 3600_000;

export const recentErrors = () => recent.map(({ key: _k, ...e }) => e);

/** Record an error and send an alert unless this kind was sent within the hour. Never throws. */
export function reportError(source: ErrorEntry["source"], err: unknown, where = "", requestId?: string, now = Date.now()) {
  try {
    const message = (err instanceof Error ? err.message : String(err)).replace(/\s+/g, " ").slice(0, 500) || "Unknown error";
    const stack = err instanceof Error ? (err.stack ?? "").split("\n").slice(1, 6).map((l) => l.trim()).join("\n") : "";
    const key = `${source}|${where}|${message.slice(0, 200)}`;
    const at = new Date(now).toISOString();
    const hit = recent.find((e) => e.key === key);
    if (hit) { hit.count++; hit.last = at; hit.requestId = requestId ?? hit.requestId; recent.splice(recent.indexOf(hit), 1); recent.unshift(hit); }
    else { recent.unshift({ key, source, message, where, first: at, last: at, count: 1, requestId }); recent.length = Math.min(recent.length, 50); }
    if (!shouldSend(key, now)) return;
    void deliver({ source, message, where, at, requestId, stack }).catch((e) => console.error("[alerts] could not send:", (e as Error).message));
  } catch { /* alerts must never break the request that failed */ }
}

function shouldSend(key: string, now: number) {
  if (!setting<boolean>("errorAlerts")) return false;
  const last = lastSent.get(key);
  if (last !== undefined && now - last < HOUR) return false;
  sent = sent.filter((t) => now - t < HOUR);
  if (sent.length >= 20) return false;
  lastSent.set(key, now); sent.push(now);
  return true;
}

async function deliver(e: { source: string; message: string; where: string; at: string; requestId?: string; stack: string }) {
  const site = setting<string>("siteName");
  const title = `${site}: ${e.source === "page" ? "a page failed in a browser" : "server error"}`;
  const lines = [
    `${title}.`,
    `Error: ${e.message}`,
    ...(e.where ? [`Where: ${e.where}`] : []),
    `When: ${e.at}${e.requestId ? ` · request id ${e.requestId}` : ""}`,
    ...(e.stack ? [`Code: ${e.stack.replace(/\n/g, " ← ")}`] : []),
    "Repeats of this error are not sent again for an hour. Recent errors are listed in Admin › Settings.",
  ];
  const hook = setting<string>("alertWebhook");
  if (hook) {
    await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: lines.join("\n") }), signal: AbortSignal.timeout(5000) })
      .catch((err) => console.error("[alerts] webhook failed:", (err as Error).message));
  }
  if (!mailEnabled()) return;
  let to = setting<string>("alertEmail") ? [setting<string>("alertEmail")] : [];
  if (!to.length) {
    const { db, schema } = await import("./db"); // lazily, so tests of this module need no database
    const { and, eq } = await import("drizzle-orm");
    to = (await db.select({ email: schema.users.email }).from(schema.users).where(and(eq(schema.users.role, "admin"), eq(schema.users.disabled, 0)))).map((u) => u.email);
  }
  const url = publicUrl();
  for (const addr of to) await sendMail(addr, `[Alert] ${title}`, lines, url ? { label: "Open Admin › Settings", url: `${url}/#/admin/settings` } : undefined, { badge: { text: "Portal alert", tone: "danger" }, reason: "You receive this because you are an administrator of the portal." });
}

/** test hook */
export function _resetAlerts() { recent.length = 0; lastSent.clear(); sent = []; }
