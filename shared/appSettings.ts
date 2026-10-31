// Portal settings an administrator can change at runtime (Admin › Settings). Each has a default; an environment
// variable, when set, replaces the default; a value saved by an administrator replaces both.
// Passwords, API keys and infrastructure (database, storage folder, session secret) stay in the server environment.

export type SettingType = "bool" | "number" | "text" | "textarea" | "email" | "url" | "select";
export type SettingValue = string | number | boolean;
export interface SettingDef {
  key: string; group: SettingGroup; label: string; help: string; type: SettingType; default: SettingValue;
  options?: { value: string; label: string }[]; min?: number; max?: number;
  /** environment variable that replaces the default, and how to read it */
  env?: string; fromEnv?: (v: string) => SettingValue;
  /** sent to every browser, including visitors (never put anything private here) */
  public?: boolean;
}

export const SETTING_GROUPS = ["General", "Sign-up & access", "Announcement", "Plans & billing", "AI", "Uploads", "Email & schedules", "Logging"] as const;
export type SettingGroup = (typeof SETTING_GROUPS)[number];

const onOff = (v: string) => v === "on" || v === "true" || v === "1";
const num = (v: string) => Number(v) || 0;

export const SETTINGS: SettingDef[] = [
  // General
  { key: "siteName", group: "General", label: "Portal name", help: "Shown on the home page, sign-in page and browser tab.", type: "text", default: "ISO Information Management Portal", public: true },
  { key: "siteShort", group: "General", label: "Short name", help: "Used where space is tight, such as the sidebar.", type: "text", default: "BIM Management", public: true },
  { key: "maker", group: "General", label: "Company name", help: "Who makes and runs the portal, shown on the About page.", type: "text", default: "FirstOption", public: true },
  { key: "contactEmail", group: "General", label: "Contact email", help: "Sales and support address for the Talk to us buttons. Leave empty to send visitors to sign-up instead.", type: "email", default: "", public: true },
  { key: "publicUrl", group: "General", label: "Public address", help: "The portal's web address, used in email links, e.g. https://bim.example.com.", type: "url", default: "", env: "PUBLIC_URL" },
  { key: "defaultLocale", group: "General", label: "Default language", help: "Language for visitors and new users who have not chosen one.", type: "select", default: "en", options: [{ value: "en", label: "English" }, { value: "ar", label: "Arabic" }], public: true },
  // Sign-up & access
  { key: "allowSignups", group: "Sign-up & access", label: "Allow new sign-ups", help: "When off, only invited people (and the first administrator) can create an account.", type: "bool", default: true, public: true },
  { key: "maintenanceMode", group: "Sign-up & access", label: "Maintenance mode", help: "When on, only administrators can use the portal; everyone else sees the maintenance message.", type: "bool", default: false, public: true },
  { key: "maintenanceMessage", group: "Sign-up & access", label: "Maintenance message", help: "Shown to users while maintenance mode is on.", type: "textarea", default: "The portal is being updated and will be back shortly. Thank you for your patience.", public: true },
  // Announcement
  { key: "announcementOn", group: "Announcement", label: "Show announcement", help: "A banner at the top of every page, for signed-in users and visitors.", type: "bool", default: false, public: true },
  { key: "announcementText", group: "Announcement", label: "Announcement text", help: "One or two short sentences.", type: "textarea", default: "", public: true },
  { key: "announcementLevel", group: "Announcement", label: "Announcement style", help: "Colour of the banner.", type: "select", default: "info", options: [{ value: "info", label: "Information" }, { value: "success", label: "Good news" }, { value: "warning", label: "Warning" }], public: true },
  { key: "announcementLink", group: "Announcement", label: "Announcement link", help: "Optional page or web address the banner links to, e.g. #/pricing.", type: "text", default: "", public: true },
  // Plans & billing
  { key: "billing", group: "Plans & billing", label: "Plan limits and section access", help: "When on, each plan's limits and section access apply. When off, everyone can use everything.", type: "bool", default: false, env: "BILLING", fromEnv: onOff, public: true },
  { key: "showPricing", group: "Plans & billing", label: "Show the pricing page", help: "Show Pricing in the public menu and plans on the home page.", type: "bool", default: true, public: true },
  // AI
  { key: "aiEnabled", group: "AI", label: "AI tools", help: "Turn every AI tool off, for example while the API budget is reviewed.", type: "bool", default: true, public: true },
  { key: "claudeModel", group: "AI", label: "Main AI model", help: "Used for every AI tool unless the light model applies.", type: "select", default: "claude-opus-5-5", env: "CLAUDE_MODEL",
    options: [{ value: "claude-opus-5-5", label: "Claude Opus 5.5 (recommended)" }, { value: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" }, { value: "claude-fable-5-1", label: "Claude Fable 5.1" }] },
  { key: "claudeModelLight", group: "AI", label: "Light model", help: "Optional cheaper model for short, low-effort requests. Empty = use the main model.", type: "select", default: "", env: "CLAUDE_MODEL_LIGHT",
    options: [{ value: "", label: "Same as the main model" }, { value: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" }, { value: "claude-haiku-5-5", label: "Claude Haiku 5.5" }] },
  { key: "aiPerMinute", group: "AI", label: "AI requests per user per minute", help: "Stops runaway scripts and double clicks. 0 = no limit.", type: "number", default: 20, min: 0, max: 1000, env: "AI_PER_MINUTE", fromEnv: num },
  { key: "aiMonthlyLimit", group: "AI", label: "AI requests per user per month (without plans)", help: "Applies when plan limits are off. 0 = no limit.", type: "number", default: 0, min: 0, max: 100000, env: "AI_MONTHLY_LIMIT", fromEnv: num },
  { key: "newsRefresh", group: "AI", label: "News feed refresh", help: "Hourly refresh uses a paid web search each time.", type: "select", default: "off", env: "NEWS_REFRESH", options: [{ value: "off", label: "On demand only" }, { value: "hourly", label: "Every hour" }] },
  // Uploads
  { key: "maxUploadMb", group: "Uploads", label: "Largest project file (MB)", help: "For project files and the downloads library. A reverse proxy needs the same limit.", type: "number", default: 250, min: 1, max: 10240, env: "MAX_UPLOAD_MB", fromEnv: num },
  { key: "videoMaxMb", group: "Uploads", label: "Largest video (MB)", help: "For Our videos.", type: "number", default: 2048, min: 1, max: 20480, env: "VIDEO_MAX_MB", fromEnv: num },
  // Email & schedules
  { key: "scheduler", group: "Email & schedules", label: "Background jobs", help: "Daily quality snapshots, the email digest and scheduled automations.", type: "bool", default: true, env: "SCHEDULER", fromEnv: (v) => v !== "off" },
  { key: "digestHourUtc", group: "Email & schedules", label: "Daily digest hour (UTC)", help: "When the daily email digest is sent, 0–23.", type: "number", default: 6, min: 0, max: 23, env: "DIGEST_HOUR_UTC", fromEnv: num },
  // Logging
  { key: "logRequests", group: "Logging", label: "API request log", help: "One line per request with an id, never bodies or cookies.", type: "select", default: "all", env: "LOG_REQUESTS",
    options: [{ value: "all", label: "Every request" }, { value: "errors", label: "Errors and slow requests" }, { value: "off", label: "Off" }] },
];

export const settingDef = (key: string) => SETTINGS.find((s) => s.key === key);
export type SettingsMap = Record<string, SettingValue>;

/** Default (or environment) value of every setting. */
export function baseSettings(env: Record<string, string | undefined> = {}): SettingsMap {
  return Object.fromEntries(SETTINGS.map((s) => {
    const raw = s.env ? env[s.env]?.trim() : undefined;
    return [s.key, raw ? (s.fromEnv ? s.fromEnv(raw) : raw) : s.default];
  }));
}

/** Check and coerce values from the admin form; unknown keys and bad values are dropped. */
export function cleanSettings(input: Record<string, unknown>): SettingsMap {
  const out: SettingsMap = {};
  for (const s of SETTINGS) {
    if (!(s.key in input)) continue;
    const v = input[s.key];
    if (s.type === "bool") { if (typeof v === "boolean") out[s.key] = v; continue; }
    if (s.type === "number") {
      const n = Number(v);
      if (Number.isFinite(n)) out[s.key] = Math.round(Math.min(s.max ?? Infinity, Math.max(s.min ?? -Infinity, n)));
      continue;
    }
    if (typeof v !== "string") continue;
    const str = v.trim().slice(0, s.type === "textarea" ? 1000 : 200);
    if (s.type === "select" && !s.options?.some((o) => o.value === str)) continue;
    if (s.type === "email" && str && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) continue;
    if (s.type === "url" && str && !/^https?:\/\/[^\s]+$/.test(str)) continue;
    if (s.key === "announcementLink" && str && !/^(#\/|https?:\/\/)/.test(str)) continue;
    out[s.key] = str;
  }
  return out;
}

export const publicSettings = (all: SettingsMap): SettingsMap => Object.fromEntries(SETTINGS.filter((s) => s.public).map((s) => [s.key, all[s.key]!]));
