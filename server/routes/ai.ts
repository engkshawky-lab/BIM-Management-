import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { templateById } from "../../shared/data/templates";
import { logActivity, requireProject } from "../access";
import { db, schema } from "../db";
import { h, parse } from "./auth";

import multer from "multer";
import { apiKey, ask, parseJson } from "../claude";
import { pickSources, projectSources } from "../projectCorpus";

const r = Router();

r.get("/ai/status", (_req, res) => res.json({ enabled: !!apiKey() }));

/** Draft one template section with Claude; returns proposed values for the client to review before applying. */
r.post("/projects/:projectId/documents/:docId/ai-draft", requireProject("editor"), h(async (req, res) => {
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

  const { text } = await ask({ system, messages: [{ role: "user", content: user }] });
  let parsed: Record<string, unknown>;
  try { parsed = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }

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

// ---------- project assistant: answers from the project's own records, with citations ----------
r.post("/projects/:projectId/assistant", requireProject(), h(async (req, res) => {
  const body = parse(z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(8000) })).min(1).max(20) }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const question = body.messages.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join(" ");
  const sources = pickSources(await projectSources(pid), question);
  const system = `You are the project's ISO 19650 information management assistant. Answer using the numbered project sources provided with the question, and general ISO 19650 / ISO/IEC 42001 knowledge where the sources are silent (say when you do). Cite sources inline as [S1], [S2]. Never invent project facts (names, dates, numbers) that are not in the sources. Be concise and practical; use short lists and tables in Markdown where helpful. British English. Do not quote standard text verbatim.`;
  const context = sources.map((s, i) => `[S${i + 1}] ${s.title}\n${s.text}`).join("\n\n");
  const msgs = body.messages.map((m, i) => (i === body.messages.length - 1 ? { role: m.role, content: `Project sources:\n${context}\n\nQuestion: ${m.content}` } : m));
  const { text, truncated } = await ask({ system, messages: msgs, maxTokens: 8000 });
  const cited = [...new Set([...text.matchAll(/\[S(\d+)\]/g)].map((m) => +m[1]))].filter((n) => n >= 1 && n <= sources.length);
  res.json({ answer: text, truncated, sources: cited.map((n) => ({ n, title: sources[n - 1].title, link: sources[n - 1].link, kind: sources[n - 1].kind })), searched: sources.length });

}));

// ---------- requirements extraction from a requirements document (EIR/AIR) ----------
r.post("/projects/:projectId/requirements/extract", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ text: z.string().min(50).max(150_000), source: z.string().max(160).default("") }), req.body, res); if (!body) return;
  const system = "You extract atomic, testable information requirements from construction-project requirement documents (EIR, AIR, BIM specifications). Return JSON only.";
  const user = `Extract every distinct requirement the delivery team must satisfy. Split compound sentences into atomic requirements. Keep the wording close to the source but concise.
Return {"requirements":[{"ref":"REQ-001","text":"...","category":"one of: Standards, Deliverables, Process, Technology, Asset information, Security, Other"}]}.

Document:
${body.text}`;
  try {
    const { text } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 16000 });
    const parsed = parseJson<{ requirements?: { ref?: string; text?: string; category?: string }[] }>(text);
    res.json({ requirements: (parsed.requirements ?? []).filter((x) => x.text).slice(0, 400).map((x, i) => ({ ref: String(x.ref || `REQ-${String(i + 1).padStart(3, "0")}`).slice(0, 40), text: String(x.text).slice(0, 2000), category: String(x.category ?? "").slice(0, 60), source: body.source })) });
  } catch (e) { if (e instanceof SyntaxError) return res.status(502).json({ error: "The AI response could not be read. Try again." }); throw e; }
}));

// ---------- appointment / contract review ----------
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
r.post("/projects/:projectId/contract-review", requireProject("editor"), upload.single("file"), h(async (req, res) => {
  const f = req.file;
  const pasted = typeof req.body?.text === "string" ? req.body.text : "";
  if (!f && pasted.length < 200) return res.status(400).json({ error: "Upload a PDF or paste at least a page of contract text." });
  if (f && f.mimetype !== "application/pdf" && !/\.txt$/i.test(f.originalname)) return res.status(400).json({ error: "Upload a PDF or .txt file." });
  const system = "You review construction appointment documents for ISO 19650 information management obligations. Be specific and cite clause numbers or page numbers from the document. Do not give legal advice; flag points for legal review. Return JSON only.";
  const instruction = `Check the appointment for these items and report each as present / partial / missing with evidence and a recommendation:
1 Information protocol incorporated; 2 Exchange information requirements referenced; 3 BIM execution plan and its status; 4 MIDP/TIDP obligations; 5 CDE use and ownership; 6 Information standard and production methods; 7 Intellectual property and licence to use information; 8 Liability for information and reliance; 9 Information security (ISO 19650-5) obligations; 10 Asset information / handover obligations; 11 Change and reissue of information; 12 Retention and archiving.
Return {"summary":"...","items":[{"item":"...","status":"present|partial|missing","evidence":"clause/page + short paraphrase","recommendation":"..."}],"risks":["..."]}`;
  const content: unknown[] = f && f.mimetype === "application/pdf"
    ? [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.buffer.toString("base64") } }, { type: "text", text: instruction }]
    : [{ type: "text", text: `${instruction}\n\nDocument:\n${f ? f.buffer.toString("utf8") : pasted}` }];
  try {
    const { text } = await ask({ system, messages: [{ role: "user", content: content as never }], maxTokens: 12000, effort: "high" });
    res.json(parseJson(text));
  } catch (e) { if (e instanceof SyntaxError) return res.status(502).json({ error: "The AI response could not be read. Try again." }); throw e; }
}));

export default r;
