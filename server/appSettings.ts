import { eq } from "drizzle-orm";
import { baseSettings, cleanSettings, type SettingValue, type SettingsMap } from "../shared/appSettings";

// Runtime settings: defaults and environment values from shared/appSettings.ts, overridden by what an administrator
// saved (settings row "app"). Kept in memory so every request reads them without a database call; loaded at start-up
// and replaced on save. Hidden menu pages are stored alongside, under "hiddenPages".
let saved: SettingsMap = {};
let hidden: string[] = [];

export async function loadAppSettings() {
  const { db, schema } = await import("./db"); // loaded lazily so code that only reads settings (and its tests) needs no database
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "app"));
  const value = (row?.value ?? {}) as Record<string, unknown>;
  saved = cleanSettings(value);
  hidden = Array.isArray(value.hiddenPages) ? (value.hiddenPages as unknown[]).filter((k): k is string => typeof k === "string" && /^[a-z0-9.-]{2,60}$/i.test(k)) : [];
}

export const allSettings = (): SettingsMap => ({ ...baseSettings(process.env), ...saved });
export const savedSettings = () => saved;
export const hiddenPages = () => hidden;

export function setting<T extends SettingValue>(key: string): T {
  return (key in saved ? saved[key] : baseSettings(process.env)[key]) as T;
}

/** Save the given settings (only those sent change); `null` for a key clears it back to the default. */
export async function saveAppSettings(input: Record<string, unknown>, hiddenList?: string[]) {
  const cleared = Object.entries(input).filter(([, v]) => v === null).map(([k]) => k);
  const next: SettingsMap = { ...saved, ...cleanSettings(input) };
  for (const k of cleared) delete next[k];
  const nextHidden = hiddenList ? hiddenList.filter((k) => /^[a-z0-9.-]{2,60}$/i.test(k)).slice(0, 500) : hidden;
  const value = { ...next, hiddenPages: nextHidden };
  const { db, schema } = await import("./db");
  await db.insert(schema.settings).values({ key: "app", value }).onDuplicateKeyUpdate({ set: { value } });
  saved = next; hidden = nextHidden;
}
