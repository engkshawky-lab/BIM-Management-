import express, { type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { loadUser, requireUser } from "./auth";
import { runMigrations } from "./db";
import ai from "./routes/ai";
import delivery from "./routes/delivery";
import auth from "./routes/auth";
import documents from "./routes/documents";
import files from "./routes/files";
import projects from "./routes/projects";
import validation from "./routes/validation";
import coordination from "./routes/coordination";
import registers from "./routes/registers";
import reviews from "./routes/reviews";
import meetings from "./routes/meetings";
import traceability from "./routes/traceability";
import standards from "./routes/standards";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "5mb" }));
app.use(loadUser);

// Reject cross-site state-changing requests (cookies are SameSite=Lax, this is defence in depth).
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ error: "Cross-origin request blocked." });
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", auth);
app.use("/api", requireUser, projects, files, documents, delivery, validation, coordination, registers, reviews, meetings, traceability, standards, ai);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

app.use((err: Error & { code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if ((err as { type?: string }).type === "entity.parse.failed") return res.status(400).json({ error: "Malformed request body." });
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File is too large." });
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const clientDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../client");
if (process.env.NODE_ENV === "production" && fs.existsSync(clientDir)) {
  app.use(express.static(clientDir, { index: false, maxAge: "1h" }));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDir, "index.html")));
}

const port = Number(process.env.PORT ?? 3001);
await runMigrations();
app.listen(port, () => console.log(`Portal API listening on http://localhost:${port}`));
