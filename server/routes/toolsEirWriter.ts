import { Router } from "express";
import { z } from "zod";
import { guideById } from "../../shared/data/docGuides";
import { DOC_TITLES, briefToPrompt, collectTbc, normaliseSection, templateSections, type EirDocId } from "../../shared/eirBrief";
import { AiError, ask, parseJson } from "../claude";
import { h, parse } from "./auth";

// EIR writer from a brief: drafts every section of the portal's EIR or AIR template from the appointing party's
// answers. The client may request the sections in batches (sectionIds) so long documents are never cut off.

const r = Router();

const EXPERT = `You are a senior ISO 19650 information manager writing requirement documents for appointing parties on buildings and infrastructure.
Be precise and practical. Refer to clauses by number (e.g. ISO 19650-2 5.2.1) and never quote standard text verbatim. Use British English.`;
const JSON_ONLY = "Respond with one JSON object only, no Markdown fences.";

const str = (v: unknown, max = 2000) => String(v ?? "").replace(/<\/?[a-zA-Z][^<>\n]{0,200}>/g, "").slice(0, max).trim();
const strs = (v: unknown, n = 40, max = 400) => (Array.isArray(v) ? v.slice(0, n).map((x) => str(x, max)).filter(Boolean) : []);

const answer = z.union([z.string().max(6000), z.array(z.string().max(300)).max(60)]);

/** What each template section must contain: guide advice plus the template's fields and table columns. */
function sectionSpec(doc: EirDocId, ids?: string[]) {
  const guide = guideById(doc);
  const all = templateSections(doc);
  const chosen = ids?.length ? all.filter((s) => ids.includes(s.id)) : all;
  return {
    all, chosen,
    text: chosen.map((s) => {
      const g = guide?.sections.find((x) => x.title.toLowerCase() === s.title.toLowerCase());
      const fields = s.fields.map((f) => f.type === "table" ? `table "${f.label}" with columns ${(f.columns ?? []).join(" | ")}` : `${f.label}${f.options ? ` (one of: ${f.options.join(", ")})` : ""}`).join("; ");
      return `- id "${s.id}" — §${s.n} ${s.title}: ${s.guidance}${g ? ` Advice: ${g.whatToWrite}` : ""}\n  Must cover: ${fields}`;
    }).join("\n"),
  };
}

r.post("/ai/tools/eir-writer", h(async (req, res) => {
  const body = parse(z.object({
    answers: z.record(z.string().max(60), answer),
    doc: z.enum(["eir", "air"]),
    sectionIds: z.array(z.string().max(60)).max(30).optional(),
  }), req.body, res); if (!body) return;
  const doc = body.doc;
  const spec = sectionSpec(doc, body.sectionIds);
  if (!spec.chosen.length) return res.status(400).json({ error: "No known sections were requested." });

  const other = doc === "eir" ? "AIR" : "EIR";
  const system = `${EXPERT}
You are drafting sections of the appointing party's ${DOC_TITLES[doc]} (${doc.toUpperCase()}) from the brief the user gives. A matching ${other} is written from the same brief, so keep references, milestones and formats consistent with it (refer to it as "the ${other}").
Rules:
- Write the final issued text, not advice about the document. Use "shall" for requirements and give each requirement a reference (e.g. ${doc === "eir" ? "ER-01" : "AR-01"}) so the BEP can respond to it.
- Be specific and measurable: dates and milestones, formats with versions (e.g. IFC 4 ADD2 TC1, COBie 2.4 xlsx), review periods in working days, numeric tolerances, pass/fail acceptance criteria.
- ${doc === "eir" ? "The LOIN section must contain Markdown tables per milestone or element group with geometry, alphanumeric information and documentation columns." : "The asset types section must contain a Markdown table of asset types with attributes, format, source stage and purpose; include a LOIN-style table for operational data."}
- Use Markdown tables for registers, matrices, roles, milestones and schedules (3–12 realistic rows, no empty tables).
- NEVER invent client facts (names, dates, budgets, systems, organisations, sizes). Where the brief says NOT STATED or lacks a fact, write [TBC: what is needed] in place of the fact. Industry-standard practice may be proposed, but record each such proposal in "assumptions".
- Each section's markdown starts with "## <number> <title>" and uses "### <number>.1 …" for sub-sections. No document title, no HTML, no horizontal rules, no closing summary. 250–800 words per section.
- Do not claim the document is approved or compliant.
${JSON_ONLY}
Schema: {"sections":[{"id": string (the section id given), "title": string, "markdown": string}], "assumptions": string[] (proposals not stated in the brief, each under 30 words), "tbc": string[] (facts the appointing party must supply, each under 20 words)}
Return one entry per requested section, in the order given.`;
  const user = `${briefToPrompt(body.answers)}

Full ${doc.toUpperCase()} structure (for consistency): ${spec.all.map((s) => `§${s.n} ${s.title}`).join("; ")}

Draft ONLY these sections:
${spec.text}`;
  const { text, truncated } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: Math.min(32000, 6000 + spec.chosen.length * 3500) });
  let out: { sections?: Record<string, unknown>[]; assumptions?: unknown; tbc?: unknown };
  try { out = parseJson(text); } catch { throw new AiError(truncated ? "The AI answer was cut off. Generate fewer sections at a time." : "The AI response could not be read. Try again.", 502); }

  const got = new Map((Array.isArray(out.sections) ? out.sections : []).map((x) => [str(x.id, 60), x]));
  const sections = spec.chosen.map((s, i) => {
    const x = got.get(s.id) ?? (Array.isArray(out.sections) ? out.sections[i] : undefined);
    const md = str(x?.markdown, 24_000);
    return { id: s.id, title: s.title, markdown: md ? normaliseSection(s.n, s.title, md) : "" };
  });
  if (!sections.some((s) => s.markdown)) throw new AiError("The AI did not return any sections. Try again.", 502);
  const tbc = [...new Set([...strs(out.tbc), ...sections.flatMap((s) => collectTbc(s.markdown))])].slice(0, 80);
  res.json({ sections, assumptions: strs(out.assumptions), tbc, truncated });
}));

export default r;
