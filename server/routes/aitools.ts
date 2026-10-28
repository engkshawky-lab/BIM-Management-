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
import { complianceScore, matchTemplate, reviewChecklists, templateOutline } from "../../shared/aiDocs";
import { TYPE_CODES } from "../../shared/planRows";
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

  const target = body.docType !== "auto" ? matchTemplate(body.docType) : undefined;
  const task = body.mode === "single"
    ? `Review the document${body.docType !== "auto" ? ` as a ${body.docType}${target ? ` (checklist ${target.code})` : ""}` : " — first identify which document type it is and use that type's checklist"} for ISO 19650 compliance and fitness for purpose.
Build "coverage" with ONE row per checklist item of that document type (every numbered section of its checklist, plus any further requirement of the clauses cited), each "met", "partial" or "missing", with short evidence and the action needed.
Then list findings for problems the checklist does not capture: unclear responsibilities, requirements without measurable acceptance criteria, contradictions, unresolved placeholders or [TBC] items, wrong clause use, and anything that would block issue.`
    : body.mode === "eir-bep"
      ? "Check whether the BEP responds to every requirement in the EIR (ISO 19650-2 5.3.2 / 5.4.1). Build \"coverage\" with one row per EIR requirement (met / partial / missing), quoting where the BEP responds."
      : "Compare the two BEP versions: what changed, what was added or removed, and whether changes weaken commitments made to the appointing party. Build \"coverage\" with one row per significant change (status \"changed\"), or \"missing\" where a commitment was removed.";
  const system = `${EXPERT}
You review information-management documents as decision support for an accountable reviewer; you do not approve or certify them. Be specific: cite the section of the reviewed document, quote short evidence (under 25 words) and give a concrete fix.
${body.mode === "single" ? `Checklists of what each document type must contain (from the portal's ISO 19650 templates):\n${reviewChecklists()}\n` : ""}${JSON_ONLY}
Schema: {"docType": string (short, e.g. "Exchange Information Requirements (EIR)"), "summary": string (4–6 sentences: overall state, biggest gaps, what to do first), "strengths": string[] (at most 6),
"coverage": [{"item": string, "status": "met" | "partial" | "missing" | "changed", "evidence": string, "action": string}],
"findings": [{"severity": "critical" | "major" | "minor", "section": string (where in the reviewed document), "clause": string, "issue": string, "evidence": string, "recommendation": string}]}
critical = would block issue or breach an appointment obligation; major = must be fixed before issue; minor = improvement. Give at most 20 findings, most severe first.
Keep it tight: evidence under 20 words, actions and recommendations under 30 words, at most 40 coverage rows. Write "summary" first and "findings" last.`;
  // long documents need room: the model reasons before answering and both count towards the limit
  const { text } = await ask({ system, messages: [{ role: "user", content: [...a, ...b, { type: "text", text: task }] as never }], maxTokens: 32000 });
  let out: Record<string, unknown>;
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  const findings = (Array.isArray(out.findings) ? out.findings : []).slice(0, 40).map((x: Record<string, unknown>) => ({
    severity: ["critical", "major", "minor"].includes(String(x.severity)) ? String(x.severity) : "minor",
    section: str(x.section, 120), clause: str(x.clause, 80), issue: str(x.issue), evidence: str(x.evidence, 400), recommendation: str(x.recommendation),
  }));
  const coverage = (Array.isArray(out.coverage) ? out.coverage : []).slice(0, 80).map((x: Record<string, unknown>) => ({
    item: str(x.item, 600), status: ["met", "partial", "missing", "changed"].includes(String(x.status)) ? String(x.status) : "partial", evidence: str(x.evidence, 400), action: str(x.action, 600),
  }));
  const { score, verdict, coveragePct } = complianceScore(coverage, findings);
  const missing = coverage.filter((c) => c.status === "missing").map((c) => c.item);
  res.json({ docType: str(out.docType, 80) || target?.title || "", score, verdict, coveragePct, summary: str(out.summary, 3000), strengths: strs(out.strengths), findings, missing, coverage });
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

// ---------------------------------------------------------------- Delivery plans (TIDP / MIDP / MPDT rows)

r.post(T + "/plan-rows", h(async (req, res) => {
  const body = parse(z.object({
    kind: z.enum(["tidp", "midp", "mpdt"]), projectName: z.string().max(200).default(""), projectType: z.string().max(200).default(""),
    disciplines: z.array(z.string().max(60)).min(1).max(12), taskTeam: z.string().max(120).default(""),
    milestones: z.array(z.object({ code: z.string().max(12), name: z.string().max(120), date: z.string().max(10) })).max(12),
    stages: z.array(z.string().max(40)).max(8).default([]), notes: z.string().max(4000).default(""), count: z.number().int().min(5).max(80).default(30),
    projectData: z.string().max(20_000).default(""),
  }), req.body, res); if (!body) return;
  const ms = body.milestones.map((m) => `${m.code} ${m.name}${m.date ? ` (${m.date})` : ""}`).join("; ");
  const typeCodes = Object.entries(TYPE_CODES).map(([k, v]) => `${k} ${v}`).join(", ");
  const system = body.kind === "mpdt"
    ? `${EXPERT}
Build a Model Production and Delivery Table: which task team models each element or system, with its level of information need at each stage. ${JSON_ONLY}
Schema: {"rows": [{"element": string, "classification": string (Uniclass 2015 code and title, e.g. "Ss_25_10_32 Curtain wall systems"), "author": string (task team), "loin": {${body.stages.map((s) => `"${s}": string`).join(", ")}}, "notes": string}]}
Each loin value is short and specific: geometry level (e.g. "LOD 300") plus the key properties needed at that stage (e.g. "LOD 300; FireRating, U-value"). Cover every discipline given; ${body.count} rows.`
    : `${EXPERT}
Build the information containers of a ${body.kind === "tidp" ? "Task Information Delivery Plan for one task team" : "Master Information Delivery Plan across the task teams"} (ISO 19650-2 5.4.4 / 5.4.5). ${JSON_ONLY}
Schema: {"rows": [{"taskTeam": string, "title": string, "type": string (one of: ${typeCodes}), "role": string (one-letter role code), "volume": string (2 chars, "ZZ" if whole project), "level": string (2 chars, "XX" if not level-specific), "format": string, "loin": string, "milestone": string (milestone code), "start": "YYYY-MM-DD" or "", "due": "YYYY-MM-DD" or "", "dependsOn": string (refs like "C003", comma-separated, or ""), "responsible": string (role), "suitability": "S1" | "S2" | "S3" | "S4"}]}
Rows are given refs C001, C002 … in order, so dependsOn must use those refs. Make containers specific to the project (real deliverables, not generic). Respect the milestone dates: every due date on or before its milestone date, and start dates before due dates. ${body.count} rows.`;
  const user = `Project: ${body.projectName || "n/a"} — ${body.projectType || "building project"}\nDisciplines / task teams: ${body.disciplines.join(", ")}${body.taskTeam ? `\nTask team: ${body.taskTeam}` : ""}\nMilestones: ${ms || "none given"}${body.kind === "mpdt" ? `\nStages: ${body.stages.join(", ")}` : ""}\nNotes: ${body.notes || "none"}${body.projectData ? `\n\n${body.projectData}\n\nUse the deliverables, disciplines and stages above as the basis for the rows.` : ""}`;
  const { text } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 16000 });
  let out: { rows?: Record<string, unknown>[] };
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  const date = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : "");
  const rows = (out.rows ?? []).slice(0, 100).map((x) => body.kind === "mpdt"
    ? { element: str(x.element, 200), classification: str(x.classification, 120), author: str(x.author, 120), notes: str(x.notes, 400), loin: Object.fromEntries(body.stages.map((s) => [s, str((x.loin as Record<string, unknown> | undefined)?.[s], 300)])) }
    : { taskTeam: str(x.taskTeam, 120), title: str(x.title, 300), type: str(x.type, 4).toUpperCase(), role: str(x.role, 2).toUpperCase(), volume: str(x.volume, 4), level: str(x.level, 4), format: str(x.format, 60), loin: str(x.loin, 200), milestone: str(x.milestone, 12), start: date(x.start), due: date(x.due), dependsOn: str(x.dependsOn, 80), responsible: str(x.responsible, 120), suitability: str(x.suitability, 4) });
  res.json({ rows });
}));

// ---------------------------------------------------------------- Model vs requirements (IFC Hub)

r.post(T + "/model-compare", h(async (req, res) => {
  const body = parse(z.object({ summary: z.string().min(20).max(45_000), requirements: z.string().trim().min(20).max(30_000), fileName: z.string().max(255).default("model.ifc") }), req.body, res); if (!body) return;
  const system = `${EXPERT}
You compare an information model with the information requirements it must meet (EIR / LOIN / client data requirements).
You only see a SUMMARY of the IFC model: element classes with how often each property is filled, classification systems, storeys and automated check results. Judge from that summary; say "cannot tell from the summary" rather than guessing. ${JSON_ONLY}
Schema: {"summary": string (3–5 sentences), "rows": [{"requirement": string, "status": "met" | "partial" | "missing" | "unclear", "evidence": string (what the summary shows, with fill rates), "action": string (what the model author should fix)}]}
One row per distinct requirement in the text (at most 40). Use IFC class and property set names as they appear in the summary.`;
  const user = `Model: ${body.fileName}\n\nMODEL SUMMARY\n${body.summary}\n\nREQUIREMENTS\n${body.requirements}`;
  const { text } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 12000 });
  let out: { summary?: unknown; rows?: Record<string, unknown>[] };
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  res.json({
    summary: str(out.summary, 2000),
    rows: (out.rows ?? []).slice(0, 60).map((x) => ({ requirement: str(x.requirement, 600), status: ["met", "partial", "missing", "unclear"].includes(String(x.status)) ? String(x.status) : "unclear", evidence: str(x.evidence, 600), action: str(x.action, 600) })),
  });
}));

// ---------------------------------------------------------------- Document generator / custom template builder

// Two steps so long documents never get cut off and the author sees progress: an outline (from the portal's
// own template when the document type has one), then each section drafted on its own.

const docBrief = z.object({
  docType: z.string().trim().min(2).max(160), projectName: z.string().max(200).default(""), organisation: z.string().max(200).default(""),
  appointingParty: z.string().max(200).default(""), stage: z.string().max(120).default(""), brief: z.string().max(6000).default(""),
  style: z.enum(["template", "draft"]).default("draft"),
  /** controlled document data (reference, version, author role, status…) as text */
  docData: z.string().max(3000).default(""),
  /** common project data and this document's inputs (the mandatory input set) as text */
  projectData: z.string().max(20_000).default(""),
});
const outlineSection = z.object({ title: z.string().max(200), purpose: z.string().max(2000), contents: z.array(z.string().max(400)).max(30), clauses: z.array(z.string().max(80)).max(12) });
const briefText = (b: z.infer<typeof docBrief>) =>
  `Document: ${b.docType}\n${b.docData || `Project: ${b.projectName || "[Project name]"}\nOrganisation (author): ${b.organisation || "[Organisation]"}\nStage: ${b.stage || "not stated"}`}\nAppointing party: ${b.appointingParty || "[Appointing party]"}
${b.projectData ? `\n${b.projectData}\n\nTreat the project data above as fact and do not mark it [CONFIRM]; propose and mark [CONFIRM] only what it does not give.\n` : ""}Write from the point of view of the author organisation in its stated role, and pitch the content to the stated project stage and document status.
Author's requirements:\n${b.brief || "none given"}`;

r.post(T + "/generate/outline", h(async (req, res) => {
  const body = parse(docBrief, req.body, res); if (!body) return;
  const t = matchTemplate(body.docType);
  if (t) return res.json({ title: t.title, source: "template", templateCode: t.code, clauses: t.clauseRefs, sections: templateOutline(t) });
  const system = `${EXPERT}
Plan the structure of the document requested, as a senior author would before drafting. ${JSON_ONLY}
Schema: {"title": string, "clauses": string[], "sections": [{"title": string, "purpose": string, "contents": string[], "clauses": string[]}]}
Use 6–14 sections in a logical order (start with introduction/purpose and scope; end with review, approval and change control where it fits).
"contents" lists 3–8 concrete items the section must contain (name registers or tables where they belong). Clause references must be real ISO 19650 clauses (or other standards) that apply.`;
  const { text } = await ask({ system, messages: [{ role: "user", content: briefText(body) }], maxTokens: 4000, effort: "low" });
  let out: { title?: string; clauses?: unknown; sections?: Record<string, unknown>[] };
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  const sections = (out.sections ?? []).slice(0, 20).map((s) => ({ title: str(s.title, 200), purpose: str(s.purpose), contents: strs(s.contents, 12), clauses: strs(s.clauses, 6) })).filter((s) => s.title);
  if (!sections.length) return res.status(502).json({ error: "The AI did not return an outline. Try again." });
  res.json({ title: str(out.title, 200) || body.docType, source: "ai", clauses: strs(out.clauses, 8), sections });
}));

r.post(T + "/generate/section", h(async (req, res) => {
  const body = parse(docBrief.extend({
    title: z.string().max(200), index: z.number().int().min(0).max(40), outline: z.array(z.string().max(200)).max(40),
    section: outlineSection, instruction: z.string().max(2000).default(""),
  }), req.body, res); if (!body) return;
  const n = body.index + 1;
  const system = `${EXPERT}
You are drafting ONE section of a controlled ISO 19650 document. Write it as the final text an information manager would issue, not as advice about the document.
${body.style === "template"
    ? "This is a reusable TEMPLATE: write the standard text, and put guidance for the author in [square brackets] wherever project-specific content is needed."
    : "This is a PROJECT-SPECIFIC working draft: use the project details given. Where a fact is not given, write a sensible proposed value and mark it [CONFIRM] — never leave a section empty."}
Format (GitHub Markdown):
- Start with exactly "## ${n} ${body.section.title}". Use "### ${n}.1 …", "### ${n}.2 …" for sub-sections.
- Cover every required content item. Prefer short paragraphs, numbered requirements ("${n}.1.1 The lead appointed party shall …") and tables for registers, matrices, roles, milestones and schedules (3–10 realistic rows, no empty tables).
- Put the applicable clause references in the text, e.g. "(ISO 19650-2 5.2.1)". Do not quote standard text.
- No document title, no document control table, no closing summary, no horizontal rules, no HTML. 300–900 words.
Do not claim the document is approved or compliant.`;
  const user = `${briefText(body)}

Full document outline (for consistency — draft only section ${n}):
${body.outline.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Section ${n}: ${body.section.title}
Purpose: ${body.section.purpose}
Must contain:
${body.section.contents.map((c) => `- ${c}`).join("\n") || "- (as appropriate)"}
Relevant clauses: ${body.section.clauses.join(", ") || "as applicable"}${body.instruction ? `\n\nAuthor's instruction for this section: ${body.instruction}` : ""}`;
  const { text, truncated } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 6000 });
  let md = text.replace(/^```(?:markdown|md)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (!md.startsWith("## ")) md = `## ${n} ${body.section.title}\n\n${md}`;
  res.json({ markdown: md, truncated });
}));

export default r;
