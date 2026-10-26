import Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { templateById } from "../../shared/data/templates";
import { logActivity, requireProject } from "../access";
import { db, schema } from "../db";
import { h, parse } from "./auth";

const MODEL = process.env.CLAUDE_MODEL?.trim() || "claude-opus-5-5";
const apiKey = () => process.env.CLAUDE_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim();

const r = Router();

r.get("/ai/status", (_req, res) => res.json({ enabled: !!apiKey() }));

/** Draft one template section with Claude; returns proposed values for the client to review before applying. */
r.post("/projects/:projectId/documents/:docId/ai-draft", requireProject("editor"), h(async (req, res) => {
  const key = apiKey();
  if (!key) return res.status(503).json({ error: "AI drafting is not configured. Set CLAUDE_API_KEY on the server." });
  const body = parse(z.object({ sectionId: z.string(), instruction: z.string().max(2000).default("") }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const [doc] = await db.select().from(schema.documents).where(and(eq(schema.documents.id, req.params.docId), eq(schema.documents.projectId, pid)));
  if (!doc) return res.status(404).json({ error: "Document not found." });
  const t = templateById(doc.templateId)!;
  const section = t.sections.find((s) => s.id === body.sectionId);
  if (!section) return res.status(400).json({ error: "Unknown section." });
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, pid));

  const fieldSpec = section.fields.map((f) => f.type === "table"
    ? `- "${f.id}" (${f.label}): table, array of rows; each row is an array of ${f.columns!.length} strings for columns [${f.columns!.join(", ")}]`
    : `- "${f.id}" (${f.label}): string${f.options ? `, one of: ${f.options.join(" | ")}` : ""}${f.type === "date" ? " in YYYY-MM-DD" : ""}`).join("\n");

  const system = `You are an expert ${t.standard === "iso19650" ? "ISO 19650 information manager" : "ISO/IEC 42001 AI management system lead"} drafting controlled project documents.
Write precise, professional, project-specific content. Do not quote standard text verbatim; refer to clauses by number. Use British English.
Respond with one JSON object only, no Markdown fences, whose keys are the field ids below.`;
  const user = `Project: ${project.code} — ${project.name}
Appointing party: ${project.appointingParty || "n/a"}; Location: ${project.location || "n/a"}; Stage: ${project.stage || "n/a"}
Description: ${project.description || "n/a"}

Document: ${t.title} (${t.code}), clause references: ${t.clauseRefs.join(", ")}
Purpose: ${t.purpose}
Section: ${section.title} — ${section.guidance}
Current section content (improve and complete it; keep anything the author already wrote unless it is wrong):
${JSON.stringify(Object.fromEntries(section.fields.map((f) => [f.id, (doc.values as Record<string, unknown>)[f.id] ?? ""])))}
Other filled sections for context:
${JSON.stringify(Object.fromEntries(Object.entries(doc.values as Record<string, unknown>).filter(([k, v]) => !section.fields.some((f) => f.id === k) && v && JSON.stringify(v).length < 2000))).slice(0, 6000)}

Fields to return:
${fieldSpec}
${body.instruction ? `\nAuthor's instruction: ${body.instruction}` : ""}`;

  const client = new Anthropic({ apiKey: key });
  const msg = await client.messages.create({ model: MODEL, max_tokens: 8000, system, messages: [{ role: "user", content: user }] });
  if (msg.stop_reason === "refusal") return res.status(422).json({ error: "The AI model declined this request." });
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }

  // Keep only known fields with the right shape.
  const values: Record<string, string | string[][]> = {};
  for (const f of section.fields) {
    const v = parsed[f.id];
    if (f.type === "table" && Array.isArray(v)) values[f.id] = v.filter(Array.isArray).map((row) => f.columns!.map((_, i) => String((row as unknown[])[i] ?? "")));
    else if (f.type !== "table" && v != null) values[f.id] = f.options && !f.options.includes(String(v)) ? f.options[0] : String(v);
  }
  await logActivity(pid, req.user!.id, "ai.draft", `AI drafted section "${section.title}" of ${doc.title}`, `/projects/${pid}/documents/${doc.id}`);
  res.json({ values });
}));

export default r;
