// One-off: bring accounts over from the old ISO 19650 platform database (the Manus-era app on Railway).
// Copies each user's bcrypt password hash (so people keep their passwords), role, approval status, plan and plan
// expiry, and the old promo codes. The old database is the source of truth; users only in the new portal are left alone.
// A user who has already set a password in the new portal (used reset link) keeps it.
//
//   OLD_DATABASE_URL=mysql://... DATABASE_URL=mysql://... npx tsx scripts/sync-old-platform.ts            (dry run)
//   OLD_DATABASE_URL=mysql://... DATABASE_URL=mysql://... npx tsx scripts/sync-old-platform.ts --apply
//
// Prints counts only, never personal data.
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

type OldUser = {
  id: string; name: string; email: string; password_hash: string | null; org: string | null; job_title: string | null; mobile: string | null;
  role: string; status: string; subscription_plan: string | null; plan_expires_at: string | null; created_at: string | number | null; last_login_at: string | number | null;
};
type OldPromo = { code: string; type: string; value: number; plans: string[]; expiresAt: string | null; maxRedemptions: number | null; redemptions: number; active: boolean };

const apply = process.argv.includes("--apply");
const PLAN: Record<string, string> = { starter: "starter", professional: "pro", expert: "expert" };
/** old dates: epoch milliseconds (created_at, last_login_at) or ISO strings (plan_expires_at) */
const date = (v: string | number | null) => {
  if (v === null || v === undefined || v === "") return null;
  const d = /^d{11,}$/.test(String(v)) ? new Date(Number(v)) : new Date(String(v).includes("T") ? String(v) : String(v).replace(" ", "T") + "Z");
  return Number.isFinite(d.getTime()) ? d : null;
};
const clip = (v: string | null | undefined, n: number) => (v ?? "").trim().replace(/^'/, "").slice(0, n);
const validHash = (h: string | null) => { try { return !!h && /^\$2[aby]\$/.test(h) && bcrypt.getRounds(h) >= 4; } catch { return false; } };

async function main() {
  if (!process.env.OLD_DATABASE_URL || !process.env.DATABASE_URL) throw new Error("Set OLD_DATABASE_URL and DATABASE_URL");
  const old = await mysql.createConnection({ uri: process.env.OLD_DATABASE_URL, dateStrings: true });
  const neu = await mysql.createConnection({ uri: process.env.DATABASE_URL, timezone: "Z" });
  try {
    const [oldUsers] = await old.query("select id,name,email,password_hash,org,job_title,mobile,role,status,subscription_plan,plan_expires_at,created_at,last_login_at from platform_users") as unknown as [OldUser[]];
    const [[promoRow]] = await old.query("select value from platform_settings where `key`='promo_codes'") as unknown as [{ value: unknown }[]];
    const promos: OldPromo[] = typeof promoRow?.value === "string" ? JSON.parse(promoRow.value) : (promoRow?.value as OldPromo[]) ?? [];

    const [newUsers] = await neu.query("select id, lower(trim(email)) email from users") as unknown as [{ id: string; email: string }[]];
    const byEmail = new Map(newUsers.map((u) => [u.email, u.id]));
    // people who already chose a password in the new portal keep it
    const [usedResets] = await neu.query("select distinct user_id from password_resets where used_at is not null") as unknown as [{ user_id: string }[]];
    const ownPassword = new Set(usedResets.map((r) => r.user_id));

    const c = { old: oldUsers.length, updated: 0, inserted: 0, passwordCopied: 0, passwordKeptNew: 0, badHash: 0, admins: 0, pending: 0, newOnly: 0 };
    const seen = new Set<string>();
    if (apply) await neu.beginTransaction();
    for (const u of oldUsers) {
      const email = u.email.trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      const role = u.role === "admin" ? "admin" : "user";
      // pending -> waiting for approval (2); rejected / inactive / closed -> disabled (1)
      const disabled = u.status === "pending" ? 2 : u.status === "approved" ? 0 : 1;
      const plan = PLAN[u.subscription_plan ?? ""] ?? "free";
      const renewsAt = date(u.plan_expires_at);
      if (role === "admin") c.admins++;
      if (disabled === 2) c.pending++;
      if (!validHash(u.password_hash)) c.badHash++;
      let id = byEmail.get(email);
      if (id) {
        const copy = validHash(u.password_hash) && !ownPassword.has(id);
        if (copy) c.passwordCopied++; else if (ownPassword.has(id)) c.passwordKeptNew++;
        if (apply) {
          await neu.query("update users set role=?, disabled=?, last_login_at=coalesce(?, last_login_at)" + (copy ? ", password_hash=?" : "") + " where id=?",
            [role, disabled, date(u.last_login_at), ...(copy ? [u.password_hash] : []), id]);
        }
        c.updated++;
      } else {
        id = randomUUID();
        const hash = validHash(u.password_hash) ? u.password_hash! : await bcrypt.hash(randomUUID() + randomUUID(), 12);
        if (validHash(u.password_hash)) c.passwordCopied++;
        if (apply) {
          await neu.query("insert into users (id,email,name,password_hash,organization,job_title,phone,role,created_at,last_login_at,disabled,email_pref,locale,email_verified_at) values (?,?,?,?,?,?,?,?,?,?,?,'instant','en',?)",
            [id, email, clip(u.name, 120) || email, hash, clip(u.org, 160), clip(u.job_title, 120), clip(u.mobile, 40), role, date(u.created_at) ?? new Date(), date(u.last_login_at), disabled, date(u.created_at) ?? new Date()]);
        }
        c.inserted++;
      }
      if (apply) {
        await neu.query("insert into subscriptions (user_id,plan,status,renews_at,source,updated_at) values (?,?,'active',?,'old-platform',now()) on duplicate key update plan=values(plan), status='active', renews_at=values(renews_at), source=values(source), updated_at=now()",
          [id, plan, renewsAt]);
      }
    }
    c.newOnly = newUsers.filter((u) => !seen.has(u.email)).length;

    // promo codes: old codes were discounts on a chosen plan, and a 100% code made the plan free until the code's date.
    // The new portal's codes grant a plan for N months, so: 100% / free codes -> Expert (or the code's single plan) for
    // the months left until the old date (12 when it had none). Partial discounts need card payments, so they are skipped.
    const p = { ported: 0, skipped: 0 };
    for (const pc of promos) {
      const full = pc.type === "free" || (pc.type === "percent" && pc.value >= 100);
      if (!full || !pc.active) { p.skipped++; continue; }
      const exp = pc.expiresAt ? new Date(pc.expiresAt) : null;
      const months = exp ? Math.max(1, Math.ceil((exp.getTime() - Date.now()) / (30.44 * 86400_000))) : 12;
      const plan = PLAN[pc.plans?.length === 1 ? pc.plans[0] : "expert"] ?? "expert";
      if (apply) {
        await neu.query("insert into promo_codes (code,plan,months,max_uses,uses,expires_at,created_at) values (?,?,?,?,?,?,now()) on duplicate key update plan=values(plan), months=values(months), max_uses=values(max_uses), uses=greatest(uses, values(uses)), expires_at=values(expires_at)",
          [pc.code.toUpperCase().slice(0, 40), plan, months, pc.maxRedemptions ?? 100000, pc.redemptions ?? 0, exp]);
      }
      p.ported++;
    }
    if (apply) await neu.commit();
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", users: c, promoCodes: p }));
  } catch (e) {
    if (apply) await neu.rollback().catch(() => undefined);
    throw e;
  } finally { await old.end(); await neu.end(); }
}

main().catch((e) => { console.error("sync failed:", (e as { code?: string }).code ?? (e as Error).message); process.exit(1); });
