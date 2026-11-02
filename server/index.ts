import express, { type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadUser, requireUser, requireVerified } from "./auth";
import { db, runMigrations } from "./db";
import ai from "./routes/ai";
import aitools from "./routes/aitools";
import toolsIds from "./routes/toolsIds";
import toolsComms from "./routes/toolsComms";
import connectors from "./routes/connectors";
import toolsCompliance from "./routes/toolsCompliance";
import toolsModelQa from "./routes/toolsModelQa";
import toolsClash from "./routes/toolsClash";
import toolsAgent from "./routes/toolsAgent";
import toolsProgramme from "./routes/toolsProgramme";
import toolsEirWriter from "./routes/toolsEirWriter";
import toolsBepWriter from "./routes/toolsBepWriter";
import toolsSheetQa from "./routes/toolsSheetQa";
import toolsAudit from "./routes/toolsAudit";
import library from "./routes/library";
import companyVideos from "./routes/companyVideos";
import news, { startNewsSchedule } from "./routes/news";
import delivery from "./routes/delivery";
import auth from "./routes/auth";
import account, { clientErrors } from "./routes/account";
import adminInsights, { publicContact } from "./routes/adminInsights";
import { reportError } from "./alerts";
import { seoRoutes } from "./seo";
import documents from "./routes/documents";
import files from "./routes/files";
import projects from "./routes/projects";
import validation from "./routes/validation";
import coordination from "./routes/coordination";
import registers from "./routes/registers";
import reviews from "./routes/reviews";
import meetings from "./routes/meetings";
import traceability from "./routes/traceability";
import dashboard from "./routes/dashboard";
import learn from "./routes/learn";
import admin from "./routes/admin";
import automation from "./routes/automation";
import aiwork from "./routes/aiwork";
import fourd from "./routes/fourd";
import talent from "./routes/talent";
import billing, { publicPlans } from "./routes/billing";
import { adminSettings, maintenanceGate, publicSite } from "./routes/siteSettings";
import { loadAppSettings } from "./appSettings";
import { aiQuota, sectionGate } from "./billing";
import { paymentsRouter, stripeWebhook } from "./payments";
import { startScheduler } from "./agents";
import standards from "./routes/standards";
import { requestLog, securityHeaders } from "./security";
import { sql } from "drizzle-orm";
import { runPreflight } from "./preflight";

import { aiUsageContext } from "./aiMetering";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use("/api", requestLog);
// Stripe needs the raw body for signature checks, so its webhook is mounted before the JSON parser.
app.post("/api/stripe/webhook", ...stripeWebhook);
app.use(express.json({ limit: "5mb" }));
app.use(loadUser);
app.use(aiUsageContext);

// Reject cross-site state-changing requests (cookies are SameSite=Lax, this is defence in depth).
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  // "null" (sandboxed frames, some redirects) and malformed origins are treated as cross-site
  const host = (() => { try { return origin ? new URL(origin).host : null; } catch { return ""; } })();
  if (host !== null && host !== req.headers.host) return res.status(403).json({ error: "Cross-origin request blocked." });
  next();
});

// health for uptime monitors: also checks the database answers
app.get("/api/health", async (_req, res) => {
  try { await db.execute(sql`select 1`); res.json({ ok: true }); }
  catch { res.status(503).json({ ok: false, error: "Database unavailable." }); }
});
app.use("/api", publicPlans, publicSite, clientErrors, publicContact);
app.use("/api", maintenanceGate);
app.use("/api", auth, account);
app.use("/api", requireUser, requireVerified, sectionGate, aiQuota, billing, paymentsRouter, projects, files, documents, delivery, validation, coordination, registers, reviews, meetings, traceability, dashboard, learn, admin, automation, aiwork, fourd, talent, standards, ai, aitools, toolsIds, toolsComms, toolsCompliance, toolsModelQa, toolsClash, toolsAgent, toolsProgramme, toolsEirWriter, toolsBepWriter, toolsSheetQa, toolsAudit, connectors, library, companyVideos, news, adminSettings, adminInsights);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

app.use((err: Error & { code?: string }, req: Request, res: Response, _next: NextFunction) => {
  if ((err as { type?: string }).type === "entity.parse.failed") return res.status(400).json({ error: "Malformed request body." });
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File is too large." });
  console.error(err);
  reportError("server", err, `${req.method} ${req.baseUrl}${req.path}`, res.getHeader("X-Request-Id") as string | undefined);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../client");
if (process.env.NODE_ENV === "production" && fs.existsSync(clientDir)) {
  // hashed bundles never change, so browsers keep them a year; index.html is always revalidated so a release shows at once
  app.use("/assets", express.static(path.join(clientDir, "assets"), { index: false, immutable: true, maxAge: "365d" }));
  app.use(express.static(clientDir, { index: false, maxAge: "1h" }));
  app.use(seoRoutes(path.join(clientDir, "index.html")));
}

// failures outside a request still reach the administrators; an uncaught exception leaves the process unsafe, so it exits
// (the process manager or container restarts it) once the alert has had a moment to go out
process.on("unhandledRejection", (e) => { console.error("[unhandled rejection]", e); reportError("server", e, "background task"); });
process.on("uncaughtException", (e) => { console.error("[uncaught exception]", e); reportError("server", e, "process"); setTimeout(() => process.exit(1), 3000).unref(); });

const port = Number(process.env.PORT ?? 3001);
await runMigrations();
await loadAppSettings();
runPreflight();
app.listen(port, () => { console.log(`Portal API listening on http://localhost:${port}`); startScheduler(); startNewsSchedule(); });
