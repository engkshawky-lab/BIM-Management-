import fs from "fs";
import JSZip from "jszip";
import multer from "multer";
import os from "os";
import path from "path";
import { Router, type Request } from "express";
import { z } from "zod";
import { validateCobie } from "../../shared/cobie";
import { partDetailById, partDetails19650 } from "../../shared/data/parts19650Detail";
import { suitabilityCodes } from "../../shared/data/iso19650";
import { hubById, hubDigest } from "../../shared/data/hubs";
import { AiError, ask, parseJson } from "../claude";
import { h, parse } from "./auth";
import { readWorkbook } from "./validation";

// Standalone AI tools (not tied to a project): ask-a-part, document review, risk register,
// clash matrix, suitability advisor, COBie checker and document generator.

const r = Router();
const T = "/ai/tools";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 2 } });

const EXPERT = `You are a senior ISO 19650 information manager and BIM lead with delivery experience on buildings and infrastructure.
Be precise and practical. Refer to clauses by number (e.g. ISO 19650-2 5.4.1) and never quote standard text verbatim. Use British English.
If something depends on the appointment or the client's own requirements, say so rather than inventing a requirement.`;
const JSON_ONLY = "Respond with one JSON object only, no Markdown fences.";

type Block = { type: "text"; text: string } | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

/** Plain text from a DOCX body (paragraphs and table cells), enough for review. */
async function docxText(buf: Buffer) {
  const xml = await (await JSZip.loadAsync(buf)).file("word/document.xml")?.async("string");
  if (!xml) return "";
  return xml.replace(/<\/w:p>/g, "\n").replace(/<\/w:tc>/g, " | ").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n").trim();
}

/** An uploaded file or pasted text as content blocks; PDFs go to Claude as documents. */
async function sourceBlocks(label: string, file: Express.Multer.File | undefined, text: string | undefined): Promise<Block[]> {
  if (file) {
    const name = file.originalname;
    if (file.mimetype === "application/pdf" || /\.pdf$/i.test(name))
      return [{ type: "text", text: `${label}: ${name} (PDF attached)` }, { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.buffer.toString("base64") } }];
    const body = /\.docx$/i.test(name) ? await docxText(file.buffer) : file.buffer.toString("utf8");
    if (!body.trim()) throw new AiError(`Could not read text from ${name}. Upload PDF, DOCX or TXT.`, 400);
    return [{ type: "text", text: `${label}: ${name}\n${body.slice(0, 150_000)}` }];
  }
  if (text?.trim()) return [{ type: "text", text: `${label} (pasted)\n${text.slice(0, 150_000)}` }];
  return [];
}

const files = (req: Request) => (req.files ?? {}) as Record<string, Express.Multer.File[] | undefined>;
const clamp = (n: unknown, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(n) || lo)));
const str = (v: unknown, max = 2000) => String(v ?? "").slice(0, max);
const strs = (v: unknown, n = 20) => (Array.isArray(v) ? v.slice(0, n).map((x) => str(x, 600)) : []);

// ---------------------------------------------------------------- Ask AI about a part

r.post(T + "/ask-part", h(async (req, res) => {
  const body = parse(z.object({
    partId: z.string(),
    messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(8000) })).min(1).max(12),
  }), req.body, res); if (!body) return;
  const part = partDetailById(body.partId);
  if (!part) return res.status(404).json({ error: "Unknown part." });
  if (body.messages.at(-1)!.role !== "user") return res.status(400).json({ error: "The last message must be a question." });
  const others = partDetails19650.filter((p) => p.id !== part.id).map((p) => `${p.edition} — ${p.title}: ${p.oneLiner}`).join("\n");
  const system = `${EXPERT}
You are tutoring someone on ${part.edition} (${part.title}). Ground answers in the reference notes below, add practical experience, and say when a point comes from another part.
Answer in Markdown, short paragraphs and bullet lists, under 400 words unless asked for more. End with one follow-up question the learner could explore.

Reference notes for ${part.edition}:
${JSON.stringify({ oneLiner: part.oneLiner, keyConcepts: part.keyConcepts, clauses: part.clauses, keyRequirements: part.keyRequirements, keyDocuments: part.keyDocuments, commonMistakes: part.commonMistakes })}

Other parts of the series:
${others}`;
  const { text, truncated } = await ask({ system, messages: body.messages, maxTokens: 4000, effort: "low" });
  res.json({ answer: text, truncated });
}));

// ---------------------------------------------------------------- Ask AI about a topic hub

r.post(T + "/ask-hub", h(async (req, res) => {
  const body = parse(z.object({
    hubId: z.string(),
    messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(8000) })).min(1).max(12),
  }), req.body, res); if (!body) return;
  const hub = hubById(body.hubId);
  if (!hub) return res.status(404).json({ error: "Unknown hub." });
  if (body.messages.at(-1)!.role !== "user") return res.status(400).json({ error: "The last message must be a question." });
  const system = `${EXPERT}
You are tutoring someone on ${hub.title}. Ground answers in the reference notes below and your practical experience; relate answers to ISO 19650 where relevant.
Answer in Markdown, short paragraphs and bullet lists, under 400 words unless asked for more. Do not invent statistics; give ranges and say they are indicative.

Reference notes:
${hubDigest(hub)}`;
  const { text, truncated } = await ask({ system, messages: body.messages, maxTokens: 4000, effort: "low" });
  res.json({ answer: text, truncated });
}));

// ---------------------------------------------------------------- Document review & compare

r.post(T + "/review", upload.fields([{ name: "fileA", maxCount: 1 }, { name: "fileB", maxCount: 1 }]), h(async (req, res) => {
  const body = parse(z.object({
    mode: z.enum(["single", "eir-bep", "bep-versions"]),
    docType: z.string().max(80).default("auto"),
    textA: z.string().max(200_000).optional(), textB: z.string().max(200_000).optional(),
  }), req.body, res); if (!body) return;
  const f = files(req);
  const [labelA, labelB] = body.mode === "eir-bep" ? ["EIR", "BEP"] : body.mode === "bep-versions" ? ["Previous BEP", "Revised BEP"] : ["Document", ""];
  const a = await sourceBlocks(labelA, f.fileA?.[0], body.textA);
  const b = body.mode === "single" ? [] : await sourceBlocks(labelB, f.fileB?.[0], body.textB);
  if (!a.length || (body.mode !== "single" && !b.length)) return res.status(400).json({ error: body.mode === "single" ? "Upload or paste a document." : `Provide both the ${labelA} and the ${labelB}.` });

  const task = body.mode === "single"
    ? `Review the document${body.docType !== "auto" ? ` as a ${body.docType}` : " (identify its type first)"} for ISO 19650 compliance and fitness for purpose: completeness against what this document type should contain, clarity of responsibilities, measurable acceptance criteria, consistency, and unresolved placeholders.`
    : body.mode === "eir-bep"
      ? "Check whether the BEP responds to every requirement in the EIR (ISO 19650-2 5.3.2 / 5.4.1). Build a coverage list with one row per EIR requirement."
      : "Compare the two BEP versions: what changed, what was added or removed, and whether changes weaken commitments made to the appointing party. Use the coverage list for each significant change.";
  const system = `${EXPERT}
You review information-management documents as decision support; you do not approve or certify them. ${JSON_ONLY}
Schema: {"docType": string, "score": 0-100, "verdict": "Fit for issue" | "Minor revisions" | "Major revisions" | "Not fit for purpose", "summary": string,
"strengths": string[], "findings": [{"severity": "critical" | "major" | "minor", "clause": string, "issue": string, "evidence": string, "recommendation": string}],
"missing": string[], "coverage": [{"item": string, "status": "met" | "partial" | "missing" | "changed", "evidence": string, "action": string}]}
Quote short evidence from the document where you can (under 25 words). Leave "coverage" empty for a single-document review. Give at most 25 findings, most severe first.`;
  const { text } = await ask({ system, messages: [{ role: "user", content: [...a, ...b, { type: "text", text: task }] as never }], maxTokens: 12000 });
  let out: Record<string, unknown>;
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  const findings = (Array.isArray(out.findings) ? out.findings : []).slice(0, 40).map((x: Record<string, unknown>) => ({
    severity: ["critical", "major", "minor"].includes(String(x.severity)) ? String(x.severity) : "minor",
    clause: str(x.clause, 80), issue: str(x.issue), evidence: str(x.evidence, 400), recommendation: str(x.recommendation),
  }));
  const coverage = (Array.isArray(out.coverage) ? out.coverage : []).slice(0, 80).map((x: Record<string, unknown>) => ({
    item: str(x.item, 600), status: ["met", "partial", "missing", "changed"].includes(String(x.status)) ? String(x.status) : "partial", evidence: str(x.evidence, 400), action: str(x.action, 600),
  }));
  res.json({ docType: str(out.docType, 80), score: clamp(out.score, 0, 100), verdict: str(out.verdict, 40), summary: str(out.summary, 3000), strengths: strs(out.strengths), findings, missing: strs(out.missing, 40), coverage });
}));

// ---------------------------------------------------------------- Risk register

r.post(T + "/risk-register", h(async (req, res) => {
  const body = parse(z.object({
    projectType: z.string().max(120), stage: z.string().max(120), teamSize: z.string().max(60).default(""), cde: z.string().max(120).default(""),
    procurement: z.string().max(120).default(""), notes: z.string().max(3000).default(""), count: z.number().int().min(10).max(40).default(25),
  }), req.body, res); if (!body) return;
  const system = `${EXPERT}
Produce an information-management risk register for the project below (ISO 19650-2 5.3.6 risk register; include ISO 19650-5 security and handover risks). ${JSON_ONLY}
Schema: {"risks": [{"ref": "IM-01", "category": "Requirements" | "Appointment" | "CDE" | "Delivery planning" | "Production" | "Security" | "Handover" | "Capability" | "Interoperability" | "Health & safety",
"risk": string, "cause": string, "consequence": string, "likelihood": 1-5, "impact": 1-5, "clause": string, "mitigation": string, "owner": string, "residualLikelihood": 1-5, "residualImpact": 1-5}]}
Make the risks specific to the project context, not generic. Owners are roles (e.g. Lead appointed party information manager).`;
  const user = `Project type: ${body.projectType}\nStage: ${body.stage}\nDelivery team size: ${body.teamSize || "n/a"}\nCDE platform: ${body.cde || "n/a"}\nProcurement route: ${body.procurement || "n/a"}\nNotes: ${body.notes || "none"}\nNumber of risks: ${body.count}`;
  const { text } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 12000 });
  let out: { risks?: Record<string, unknown>[] };
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  const risks = (out.risks ?? []).slice(0, 50).map((x, i) => ({
    ref: str(x.ref, 20) || `IM-${String(i + 1).padStart(2, "0")}`, category: str(x.category, 40), risk: str(x.risk), cause: str(x.cause), consequence: str(x.consequence),
    likelihood: clamp(x.likelihood, 1, 5), impact: clamp(x.impact, 1, 5), clause: str(x.clause, 80), mitigation: str(x.mitigation), owner: str(x.owner, 120),
    residualLikelihood: clamp(x.residualLikelihood, 1, 5), residualImpact: clamp(x.residualImpact, 1, 5),
  }));
  res.json({ risks });
}));

// ---------------------------------------------------------------- Clash matrix

r.post(T + "/clash-matrix", h(async (req, res) => {
  const body = parse(z.object({
    projectType: z.string().max(120), stage: z.string().max(120), software: z.string().max(80), lod: z.string().max(80),
    disciplines: z.array(z.string().max(40)).min(2).max(14), notes: z.string().max(3000).default(""),
  }), req.body, res); if (!body) return;
  const system = `${EXPERT}
Build a clash detection test matrix for the disciplines given. One test per meaningful discipline pair (and self-tests where useful, e.g. MEP vs MEP). ${JSON_ONLY}
Schema: {"tests": [{"code": "CT-01", "a": string, "b": string, "type": "Hard" | "Clearance" | "Duplicate", "tolerance": number (mm), "priority": "High" | "Medium" | "Low", "frequency": string, "notes": string}],
"guidance": string[]}
Tolerances must suit the stage and LOD (coarser at concept, tighter at technical design / construction). Notes should name search sets or element categories to include or exclude for the software given. Guidance: 4–8 practical points on running and reporting the tests.`;
  const user = `Project type: ${body.projectType}\nStage: ${body.stage}\nSoftware: ${body.software}\nLOD: ${body.lod}\nDisciplines: ${body.disciplines.join(", ")}\nNotes: ${body.notes || "none"}`;
  const { text } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 10000 });
  let out: { tests?: Record<string, unknown>[]; guidance?: unknown };
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  const tests = (out.tests ?? []).slice(0, 120).map((x, i) => ({
    code: str(x.code, 20) || `CT-${String(i + 1).padStart(2, "0")}`, a: str(x.a, 60), b: str(x.b, 60),
    type: ["Hard", "Clearance", "Duplicate"].includes(String(x.type)) ? String(x.type) : "Hard",
    tolerance: Math.max(0, Math.round(Number(x.tolerance) || 0)), priority: ["High", "Medium", "Low"].includes(String(x.priority)) ? String(x.priority) : "Medium",
    frequency: str(x.frequency, 60), notes: str(x.notes, 800),
  }));
  res.json({ tests, guidance: strs(out.guidance, 12) });
}));

// ---------------------------------------------------------------- Suitability advisor

r.post(T + "/suitability", h(async (req, res) => {
  const body = parse(z.object({ situation: z.string().trim().min(10).max(4000) }), req.body, res); if (!body) return;
  const codes = suitabilityCodes.map((c) => `${c.code} (${c.state}): ${c.desc}`).join("\n");
  const system = `${EXPERT}
Advise which status (suitability) code applies to an information container. Only use codes from this list, which is the project's code set:
${codes}
${JSON_ONLY}
Schema: {"code": string, "state": string, "explanation": string, "nextStep": string, "alternatives": [{"code": string, "when": string}], "cautions": string[]}`;
  const { text } = await ask({ system, messages: [{ role: "user", content: body.situation }], maxTokens: 3000, effort: "low" });
  let out: Record<string, unknown>;
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  const known = new Set(suitabilityCodes.map((c) => c.code));
  const code = known.has(String(out.code)) ? String(out.code) : "";
  res.json({
    code, state: suitabilityCodes.find((c) => c.code === code)?.state ?? str(out.state, 20), explanation: str(out.explanation, 3000), nextStep: str(out.nextStep, 1000),
    alternatives: (Array.isArray(out.alternatives) ? out.alternatives : []).filter((x: Record<string, unknown>) => known.has(String(x.code))).slice(0, 4).map((x: Record<string, unknown>) => ({ code: String(x.code), when: str(x.when, 600) })),
    cautions: strs(out.cautions, 6),
  });
}));

// ---------------------------------------------------------------- COBie checker

r.post(T + "/cobie", upload.single("file"), h(async (req, res) => {
  const body = parse(z.object({ stage: z.string().max(80).default("Handover"), text: z.string().max(200_000).optional() }), req.body, res); if (!body) return;
  let report: ReturnType<typeof validateCobie> | null = null;
  let sample = "";
  if (req.file) {
    if (!/\.xlsx$/i.test(req.file.originalname)) return res.status(400).json({ error: "Upload a COBie .xlsx workbook, or paste sheet data." });
    const tmp = path.join(os.tmpdir(), `cobie-${Date.now()}-${Math.random().toString(36).slice(2)}.xlsx`);
    await fs.promises.writeFile(tmp, req.file.buffer);
    try {
      const sheets = await readWorkbook(tmp);
      report = validateCobie(sheets);
      sample = Object.entries(sheets).map(([name, rows]) => `## ${name} (${rows.length} rows)\nColumns: ${Object.keys(rows[0] ?? {}).join(", ")}\n${rows.slice(0, 3).map((x) => JSON.stringify(x)).join("\n")}`).join("\n\n");
    } catch { return res.status(400).json({ error: "The workbook could not be read." }); }
    finally { fs.promises.unlink(tmp).catch(() => {}); }
  } else if (body.text?.trim()) sample = body.text.slice(0, 60_000);
  else return res.status(400).json({ error: "Upload a COBie workbook or paste sheet data." });

  const system = `${EXPERT}
You check COBie (BS 1192-4) deliverables for readiness at the stated stage. Automated rule results are given when available; interpret them, add issues the rules cannot see (naming quality, plausibility, missing maintainable assets, type/component granularity) and prioritise fixes. ${JSON_ONLY}
Schema: {"readiness": "Ready" | "Minor fixes" | "Not ready", "summary": string, "priorities": [{"priority": "P1" | "P2" | "P3", "sheet": string, "issue": string, "fix": string, "owner": string}], "goodPractice": string[]}`;
  const user = `Stage: ${body.stage}\n\n${report ? `Automated checks (score ${report.score}/100):\nSheets: ${JSON.stringify(report.sheets)}\nStats: ${JSON.stringify(report.stats)}\nFindings (first 80): ${JSON.stringify(report.findings.slice(0, 80))}\n\n` : ""}Data sample:\n${sample.slice(0, 60_000)}`;
  const { text } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 8000 });
  let out: Record<string, unknown>;
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  res.json({
    report,
    readiness: ["Ready", "Minor fixes", "Not ready"].includes(String(out.readiness)) ? String(out.readiness) : "Minor fixes",
    summary: str(out.summary, 3000),
    priorities: (Array.isArray(out.priorities) ? out.priorities : []).slice(0, 40).map((x: Record<string, unknown>) => ({
      priority: ["P1", "P2", "P3"].includes(String(x.priority)) ? String(x.priority) : "P2", sheet: str(x.sheet, 40), issue: str(x.issue), fix: str(x.fix), owner: str(x.owner, 120),
    })),
    goodPractice: strs(out.goodPractice, 10),
  });
}));

// ---------------------------------------------------------------- Document generator / custom template builder

r.post(T + "/generate", h(async (req, res) => {
  const body = parse(z.object({
    docType: z.string().trim().min(2).max(160), projectName: z.string().max(200).default(""), organisation: z.string().max(200).default(""),
    appointingParty: z.string().max(200).default(""), stage: z.string().max(120).default(""), brief: z.string().max(6000).default(""),
    style: z.enum(["template", "draft"]).default("draft"),
  }), req.body, res); if (!body) return;
  const system = `${EXPERT}
Write a complete, professional ${body.style === "template" ? "reusable template with guidance notes in [square brackets] where the author must fill in" : "project-specific working draft"} for the document requested.
Output GitHub-flavoured Markdown only: start with "# <title>", then a document control table (Document title, Reference, Revision P01, Status: Draft for review, Prepared by, Checked by, Approved by, Date),
numbered sections ("## 1 Introduction" …), tables where a register or matrix belongs, and the relevant ISO 19650 clause references per section.
Mark anything that must be confirmed by the appointing party as [CONFIRM]. Do not claim the document is approved or compliant.`;
  const user = `Document: ${body.docType}\nProject: ${body.projectName || "[Project name]"}\nOrganisation: ${body.organisation || "[Organisation]"}\nAppointing party: ${body.appointingParty || "[Appointing party]"}\nStage: ${body.stage || "n/a"}\nRequirements / brief:\n${body.brief || "none given"}`;
  const { text, truncated } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 16000 });
  res.json({ markdown: text.replace(/^```(?:markdown|md)?\s*/i, "").replace(/\s*```$/, ""), truncated });
}));

export default r;
