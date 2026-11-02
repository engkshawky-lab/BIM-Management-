// One-off: move the old ISO 19650 platform's video library into Admin › Our videos, through the portal's own upload
// API (files land on the portal's storage volume exactly as an administrator's upload would). YouTube entries become
// YouTube links. Uses a short-lived admin session created for this run and deleted at the end.
//
//   DATABASE_URL=... SESSION_SECRET=... npx tsx scripts/migrate-old-videos.ts <old-backup-dir> <portal-url> <admin-email> [--apply]
//
// <old-backup-dir> holds db/videos.json (old `videos` table) and bucket/ (the old storage bucket). Re-runs skip videos
// whose title is already in Our videos.
import mysql from "mysql2/promise";
import { randomUUID } from "node:crypto";
import { openAsBlob, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { signSessionToken, SESSION_COOKIE } from "../server/auth";

type OldVideo = { id: string; title: string; category: string | null; description: string | null; storage_key: string; url: string; created_at: string | number; is_hidden: number | string };

const [dir, portal, adminEmail] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");

export function topicFor(category: string | null) {
  const c = (category ?? "").toLowerCase();
  if (c.includes("tools")) return "Software how-to";
  if (c.includes("cde")) return "CDE & workflows";
  return "ISO 19650 basics";
}
export const langFor = (title: string) => (/[؀-ۿ]/.test(title) ? "ar" : "en");

async function main() {
  if (!dir || !portal || !adminEmail) throw new Error("Usage: migrate-old-videos.ts <old-backup-dir> <portal-url> <admin-email> [--apply]");
  const videos = (JSON.parse(await readFile(path.join(dir, "db/videos.json"), "utf8")) as OldVideo[])
    .filter((v) => String(v.is_hidden) !== "1")
    .sort((a, b) => Number(a.created_at) - Number(b.created_at)); // oldest first: the library lists newest first
  const db = await mysql.createConnection({ uri: process.env.DATABASE_URL!, timezone: "Z" });
  let sessionId: string | null = null;
  try {
    const [[admin]] = await db.query("select id from users where lower(email)=? and role='admin'", [adminEmail.toLowerCase()]) as unknown as [{ id: string }[]];
    if (!admin) throw new Error("No administrator with that email");
    const [existing] = await db.query("select title from company_videos") as unknown as [{ title: string }[]];
    const have = new Set(existing.map((r) => r.title.trim().toLowerCase()));
    const todo = videos.filter((v) => !have.has(v.title.trim().slice(0, 200).toLowerCase()));
    const files = todo.filter((v) => v.storage_key !== "embed");
    const missing = files.filter((v) => !existsSync(path.join(dir, "bucket", v.storage_key)));
    console.log(JSON.stringify({ old: videos.length, alreadyThere: videos.length - todo.length, files: files.length, links: todo.length - files.length, missingFiles: missing.length, mode: apply ? "apply" : "dry-run" }));
    if (!apply) return;

    sessionId = randomUUID();
    await db.query("insert into sessions (id, user_id, created_at, expires_at) values (?, ?, now(), date_add(now(), interval 3 hour))", [sessionId, admin.id]);
    const cookie = `${SESSION_COOKIE}=${signSessionToken(sessionId, process.env.SESSION_SECRET!)}`;
    let ok = 0, failed = 0;
    for (const v of todo) {
      const form = new FormData();
      form.set("title", v.title.trim().slice(0, 200));
      form.set("description", (v.description ?? "").slice(0, 2000));
      form.set("topic", topicFor(v.category));
      form.set("lang", langFor(v.title));
      if (v.storage_key === "embed") form.set("link", v.url);
      else {
        const file = path.join(dir, "bucket", v.storage_key);
        if (!existsSync(file)) { failed++; console.log(`missing file: ${path.basename(file)}`); continue; }
        const name = path.basename(v.storage_key).replace(/^\d+_/, "");
        form.set("file", await openAsBlob(file, { type: /\.mov$/i.test(name) ? "video/quicktime" : "video/mp4" }), name);
      }
      const res = await fetch(`${portal.replace(/\/$/, "")}/api/company-videos`, { method: "POST", headers: { cookie, "x-requested-with": "fetch" }, body: form });
      if (res.ok) ok++;
      else { failed++; console.log(`failed (${res.status}): ${v.title.slice(0, 60)} ${(await res.text()).slice(0, 160)}`); }
      if ((ok + failed) % 10 === 0) console.log(`${ok + failed}/${todo.length}`);
    }
    console.log(JSON.stringify({ uploaded: ok, failed }));
  } finally {
    if (sessionId) await db.query("delete from sessions where id=?", [sessionId]);
    await db.end();
  }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]).replace(/\\/g, "/"))) {
  main().then(() => process.exit(0), (e) => { console.error("video migration failed:", (e as Error).message); process.exit(1); });
}
