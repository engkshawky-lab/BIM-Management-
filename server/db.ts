import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";

export function requireDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  return url;
}

function ssl(env: NodeJS.ProcessEnv = process.env) {
  const mode = (env.DATABASE_SSL ?? "disable").trim().toLowerCase();
  if (mode === "disable" || mode === "off" || mode === "false") return undefined;
  if (mode === "no-verify") return { rejectUnauthorized: false };
  const ca = env.DATABASE_CA_CERT?.trim();
  return ca ? { ca: ca.replace(/\\n/g, "\n"), rejectUnauthorized: true } : { rejectUnauthorized: true };
}

export const pool = mysql.createPool({ uri: requireDatabaseUrl(), ssl: ssl(), connectionLimit: 10, timezone: "Z" });
export const db = drizzle(pool, { schema, mode: "default" });
export { schema };

export async function runMigrations() {
  await migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? "drizzle/migrations" });
}

export const newId = () => crypto.randomUUID();
