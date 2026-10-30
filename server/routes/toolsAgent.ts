import { Router } from "express";
import { z } from "zod";
import { requireProject } from "../access";
import { ask } from "../claude";
import { factLines, factsToContext, projectFacts } from "../projectFacts";
import { h, parse } from "./auth";

// Project Agent: answers operational questions (overdue, due, changes, reviews, issues, briefings) from live
// project facts gathered server-side. The model only sees the id'd fact lines and must cite them as [F12].

const r = Router();
const P = "/projects/:projectId/agent";
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.");
const toDate = (s?: string) => (s && !isNaN(Date.parse(s)) ? new Date(`${s}T00:00:00.000Z`) : undefined);

r.get(P + "/facts", requireProject(), h(async (req, res) => {
  const q = typeof req.query.since === "string" && req.query.since ? req.query.since : undefined;
  if (q && !day.safeParse(q).success) return res.status(400).json({ error: "since must be a YYYY-MM-DD date." });
  res.json(await projectFacts(req.params.projectId, { since: toDate(q) }));
}));

const SYSTEM = `You are the project's ISO 19650 information manager acting as an operational project agent.
Answer ONLY from the numbered project facts supplied with the question. Each fact line starts with an id such as [F12].
- Cite every project-specific statement with the fact id(s) it comes from, inline, e.g. "3 containers are overdue [F2][F7]". Use one id per bracket.
- Never invent names, dates, numbers, containers, issues or statuses. If the facts do not cover something, say plainly that the platform data does not show it (and, where useful, which page or register would hold it).
- Lists in the facts may be truncated ("showing N of M"); quote totals from the summary lines and say when you are only seeing part of a list.
- "This week" means the date range stated in the facts. "Overdue" means past due and not yet shared or published.
- You may use general ISO 19650 practice to suggest next steps (e.g. chase the task team lead, re-baseline the TIDP), clearly labelled as advice, never as project fact.
- Be concise and practical: short headings, bullet lists and Markdown tables. British English. Do not quote standard text verbatim.`;

r.post(P, requireProject(), h(async (req, res) => {
  const body = parse(z.object({
    question: z.string().trim().min(1, "Ask a question.").max(4000),
    since: day.optional(),
    history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) })).max(20).default([]),
  }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const facts = await projectFacts(pid, { since: toDate(body.since) });
  const lines = factLines(facts);
  const context = factsToContext(facts);

  // earlier turns must alternate and start with the user; the new question is always the final user turn
  const history: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of body.history.slice(-10)) {
    if (!m.content.trim() || (!history.length && m.role !== "user")) continue;
    const prev = history[history.length - 1];
    if (prev && prev.role === m.role) prev.content += "\n\n" + m.content; else history.push({ role: m.role, content: m.content });
  }
  if (history.length && history[history.length - 1].role === "user") history.pop();

  const { text, truncated } = await ask({
    system: SYSTEM,
    messages: [...history, { role: "user", content: `Project facts:\n${context}\n\nQuestion: ${body.question}` }],
    maxTokens: 6000,
  });
  // normalise grouped citations "[F1, F2]" / "[F1,3]" into "[F1][F2]"
  const answer = text.replace(/\[F\d+(?:\s*[,;]\s*F?\d+)+\]/g, (m) => m.slice(1, -1).split(/[,;]/).map((x) => `[F${x.trim().replace(/^F/, "")}]`).join(""));
  const byId = new Map(lines.map((l) => [l.id, l]));
  const ids = [...new Set([...answer.matchAll(/\[F(\d+)\]/g)].map((m) => `F${m[1]}`))].filter((id) => byId.has(id));
  res.json({
    answer, truncated,
    citations: ids.map((id) => { const l = byId.get(id)!; return { id, label: l.label, link: l.link, text: l.text }; }),
    facts: lines.length, today: facts.today, since: facts.since,
  });
}));

export default r;
