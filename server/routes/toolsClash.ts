import { Router } from "express";
import { z } from "zod";
import { sanitiseTriage } from "../../shared/clashTriage";
import { AiError, ask, parseJson } from "../claude";
import { h, parse } from "./auth";

// Clash triage (standalone): the browser parses and groups the clash reports; only compact group
// summaries come here. Claude names the likely root cause, the responsible team and a priority per group.

const r = Router();

const str = (n: number) => z.string().max(n);
const item = z.object({ name: str(200), category: str(120), layer: str(120), file: str(200) }).partial();
const group = z.object({
  key: z.string().min(1).max(80),
  kind: z.enum(["duplicate", "cluster", "pair"]),
  label: str(400),
  count: z.number().int().min(1).max(1_000_000),
  levels: z.array(str(120)).max(20).default([]),
  grids: z.array(str(120)).max(20).default([]),
  categories: z.array(str(120)).max(20).default([]),
  disciplines: z.array(str(20)).max(20).default([]),
  tests: z.array(str(200)).max(20).default([]),
  maxPenetration: z.number().nullable().optional(),
  sample: z.array(z.object({ name: str(200), distance: z.number().nullable().optional(), status: str(60).optional(), a: item, b: item })).max(3).default([]),
});

r.post("/ai/tools/clash-triage", h(async (req, res) => {
  const body = parse(z.object({
    groups: z.array(group).min(1, "Load a clash report first.").max(200, "Send at most 200 groups."),
    teams: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
    stage: z.string().max(80).optional(),
    tolerances: z.string().max(1000).optional(),
  }), req.body, res); if (!body) return;
  const keys = body.groups.map((g) => g.key);
  if (new Set(keys).size !== keys.length) return res.status(400).json({ error: "Group keys must be unique." });
  const teams = [...new Set((body.teams ?? []).map((t) => t.trim()).filter(Boolean))];

  const system = `You are a senior BIM coordinator triaging clash detection results before a design coordination meeting (ISO 19650 information management context).
Be practical: hard clashes on primary structure and large services (main ducts, drainage falls, cable ladders, sprinkler mains) come first; insulation-only, tolerance-level (a few millimetres), duplicate and soft or clearance hits are often false positives.
Each input is a GROUP of clashes the tool has already bundled deterministically: "duplicate" = the same element pair reported several times, "cluster" = clash points within a short distance on the same level and category pair, "pair" = the remaining clashes of one category pair on one level.
Distances are metres; maxPenetration is the deepest overlap in metres. Discipline codes: ARC architecture, STR structure, MEC mechanical/HVAC, ELE electrical, PLU plumbing/drainage, FP fire protection, CIV civil.
For each group give:
- "rootCause": ONE sentence naming the likely design cause with its location, e.g. "Supply duct runs below the transfer beam on Level 3 grid C–D".
- "responsible": the team that should move or resolve it, chosen from the team list${teams.length ? "" : " (or a discipline code if no list is given)"}; usually the more flexible service gives way to structure, smaller services to larger ones, gravity drainage has right of way.
- "priority": "Critical" | "High" | "Normal" | "Low".
- "falsePositive": true only when the group is very likely not a real problem.
- "action": one short practical instruction.
Also return "summary" (3–5 sentences on the overall state and what to fix first) and "patterns": recurring problems worth raising at the coordination meeting (at most 8).
Never invent groups; copy each "key" exactly. British English. Respond with one JSON object only, no Markdown fences:
{"summary":"…","groups":[{"key":"…","rootCause":"…","responsible":"…","priority":"High","falsePositive":false,"action":"…"}],"patterns":["…"]}`;
  const user = `Task teams: ${teams.join(", ") || "not given"}.
Stage: ${body.stage?.trim() || "not given"}.
Tolerances / test settings: ${body.tolerances?.trim() || "not given"}.

Clash groups (${body.groups.length}):
${JSON.stringify(body.groups)}`;

  const { text } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: Math.min(32000, 4000 + body.groups.length * 160) });
  let raw: unknown;
  try { raw = parseJson(text); } catch { throw new AiError("The AI response could not be read. Try again.", 502); }
  res.json(sanitiseTriage(raw, keys, teams));
}));

export default r;
