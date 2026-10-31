import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { SETTINGS, baseSettings, publicSettings } from "../../shared/appSettings";
import { allSettings, hiddenPages, saveAppSettings, savedSettings, setting } from "../appSettings";
import { apiKey } from "../claude";
import { mailEnabled } from "../mailer";
import { paymentsEnabled } from "../payments";
import { h, parse } from "./auth";

// Admin › Settings, plus the public settings every browser needs (name, announcement, maintenance, sign-ups).
const requireAdmin = (req: Request, res: Response, next: NextFunction) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Administrators only." }));

export const publicSite = Router();
publicSite.get("/public/site", (_req, res) => {
  res.set("Cache-Control", "no-cache").json({ settings: publicSettings(allSettings()), hiddenPages: hiddenPages() });
});

/** While maintenance mode is on, only administrators (and signing in) can use the API. */
export function maintenanceGate(req: Request, res: Response, next: NextFunction) {
  if (!setting<boolean>("maintenanceMode") || req.user?.role === "admin") return next();
  if (/^\/(auth|public|health)(\/|$)/.test(req.path)) return next();
  res.status(503).json({ error: setting<string>("maintenanceMessage") || "The portal is under maintenance.", maintenance: true });
}

// What lives in the server environment, shown as set / not set (values are never sent to the browser).
function integrations() {
  const set = (...keys: string[]) => keys.every((k) => !!process.env[k]?.trim());
  return [
    { name: "Claude API key", ok: !!apiKey(), env: "CLAUDE_API_KEY", note: "Needed for every AI tool." },
    { name: "Email (SMTP)", ok: mailEnabled(), env: "SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM", note: "Without it, reset links show in the admin console and notifications stay in the portal." },
    { name: "Card payments (Stripe)", ok: paymentsEnabled(), env: "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_STARTER / _PRO / _EXPERT", note: "Without it, plans are given with promo codes or by an administrator." },
    { name: "Autodesk ACC connector", ok: set("APS_CLIENT_ID", "APS_CLIENT_SECRET", "APS_CALLBACK_URL"), env: "APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL", note: "Needed to browse ACC / BIM 360 projects." },
    { name: "Secure session cookie", ok: process.env.COOKIE_SECURE === "true", env: "COOKIE_SECURE=true", note: "Set when the portal is served only over HTTPS." },
    { name: "Database TLS", ok: !!process.env.DATABASE_SSL && process.env.DATABASE_SSL !== "disable", env: "DATABASE_SSL", note: "Recommended for a managed cloud database." },
  ];
}

export const adminSettings = Router();
adminSettings.get("/admin/settings", requireAdmin, (_req, res) => {
  res.json({ settings: allSettings(), saved: savedSettings(), defaults: baseSettings(process.env), hiddenPages: hiddenPages(), integrations: integrations() });
});
adminSettings.put("/admin/settings", requireAdmin, h(async (req, res) => {
  const keys = SETTINGS.map((s) => s.key);
  const body = parse(z.object({
    settings: z.record(z.string(), z.union([z.string().max(1000), z.number(), z.boolean(), z.null()])).refine((o) => Object.keys(o).every((k) => keys.includes(k)), "Unknown setting."),
    hiddenPages: z.array(z.string().max(60)).max(500).optional(),
  }), req.body, res); if (!body) return;
  await saveAppSettings(body.settings, body.hiddenPages);
  res.json({ settings: allSettings(), saved: savedSettings(), hiddenPages: hiddenPages() });
}));
