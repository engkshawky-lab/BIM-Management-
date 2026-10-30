import { Router } from "express";
import { z } from "zod";
import { DISCIPLINES, TYPE_CODES } from "../../shared/planRows";
import { NA_ROLE_CODES } from "../../shared/namingCheck";
import { ask, parseJson } from "../claude";
import { h, parse } from "./auth";

// TIDP / MIDP from the programme: Claude maps the design and production activities of a project programme to the
// information containers they produce. Only activities in the request are used; container names are built from
// the returned fields by the client with the shared naming helpers, never by the AI.

const r = Router();

const EXPERT = `You are a senior ISO 19650 information manager and BIM lead who builds TIDPs and MIDPs from project programmes.
Be precise and practical. Refer to clauses by number (e.g. ISO 19650-2 5.4.4) and never quote standard text verbatim. Use British English.`;
const JSON_ONLY = "Respond with one JSON object only, no Markdown fences.";

const str = (v: unknown, max = 2000) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);
const code = (v: unknown, re: RegExp, fallback: string) => { const s = str(v, 12).toUpperCase().replace(/[^A-Z0-9]/g, ""); return re.test(s) ? s : fallback; };
const isoDate = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "")) && !isNaN(Date.parse(String(v))) ? String(v) : "");

const Activity = z.object({
  id: z.string().trim().min(1).max(60), name: z.string().max(300), start: z.string().max(10).default(""), finish: z.string().max(10).default(""),
  milestone: z.boolean().default(false), wbs: z.string().max(120).default(""),
});

r.post("/ai/tools/programme-to-plan", h(async (req, res) => {
  const body = parse(z.object({
    activities: z.array(Activity).min(1, "Pick at least one activity.").max(400, "At most 400 activities per request."),
    project: z.object({
      code: z.string().max(12).default(""), originators: z.array(z.string().max(12)).max(30).default([]),
      disciplines: z.array(z.string().max(60)).max(20).default([]), stage: z.string().max(80).default(""),
    }),
    kind: z.enum(["tidp", "midp"]),
    team: z.string().max(120).default(""),
    responsibility: z.string().max(20_000).default(""),
  }), req.body, res); if (!body) return;

  const acts = new Map(body.activities.map((a) => [a.id, a]));
  const originators = body.project.originators.map((o) => code(o, /^[A-Z0-9]{3,6}$/, "")).filter(Boolean);
  const typeCodes = Object.entries(TYPE_CODES).map(([k, v]) => `${k} ${v}`).join(", ");
  const roles = Object.entries(NA_ROLE_CODES).map(([k, v]) => `${k} ${v}`).join(", ");
  const discRoles = Object.values(DISCIPLINES).map((d) => `${d.label} → ${d.role}`).join("; ");

  const system = `${EXPERT}
You turn programme activities into the information containers of a ${body.kind === "tidp" ? "Task Information Delivery Plan for one task team (ISO 19650-2 5.4.4)" : "Master Information Delivery Plan across the task teams (ISO 19650-2 5.4.5)"}.
Rules:
- Use ONLY the activities given, by their exact "id". Never invent activities, dates or organisations.
- Only activities that produce or issue information get containers (design stages, design packages, submittals, surveys, reports, calculations, models, schedules, issues for approval). Skip construction-only work, procurement and site activities unless they produce information (e.g. as-built records, O&M, test certificates).
- Give 1 to 4 containers per producing activity: the model(s), drawings, specifications, reports or schedules it delivers. Titles are specific to the activity, not generic.
- due is an ISO date (YYYY-MM-DD) on or before the activity finish; for a milestone activity, on or before its date.
- Naming fields follow the ISO 19650-2 UK National Annex: volume (1–2 letters or digits, "ZZ" for all volumes), level (2 letters or digits, "XX" when not level-specific), type (one of: ${typeCodes}), role (one of: ${roles}).
- Typical discipline roles: ${discRoles}.${originators.length ? `\n- originator is one of: ${originators.join(", ")} (use the responsibility text to choose).` : "\n- originator: leave \"\" unless the responsibility text gives a 3–6 character organisation code."}
- loin: short level of information need (e.g. "LOD 300 / LOI 3", "1:100", "Per EIR"). notes: at most one short sentence on why this container is needed, or "".
${JSON_ONLY}
Schema: {"containers": [{"activityId": string, "title": string, "type": string, "role": string, "volume": string, "level": string, "originator": string, "due": "YYYY-MM-DD", "format": string, "loin": string, "notes": string}]}`;

  const lines = body.activities.map((a) => `${a.id}\t${a.name}\t${a.start || "-"}\t${a.finish || "-"}\t${a.milestone ? "milestone" : ""}\t${a.wbs}`).join("\n");
  const user = `Project code: ${body.project.code || "n/a"}${body.project.stage ? `\nStage: ${body.project.stage}` : ""}${body.project.disciplines.length ? `\nDisciplines / task teams: ${body.project.disciplines.join(", ")}` : ""}${body.team ? `\nTask team: ${body.team}` : ""}${originators.length ? `\nOriginator codes: ${originators.join(", ")}` : ""}
${body.responsibility.trim() ? `\nRESPONSIBILITY / DESIGN RESPONSIBILITY MATRIX (pasted)\n${body.responsibility}\n` : ""}
ACTIVITIES (id, name, start, finish, milestone, WBS / discipline)
${lines}`;

  const { text } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 32000 });
  let out: { containers?: Record<string, unknown>[] };
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }

  const containers = (Array.isArray(out.containers) ? out.containers : []).slice(0, 800).flatMap((x) => {
    if (!x || typeof x !== "object") return [];
    const act = acts.get(str(x.activityId, 60));
    if (!act) return []; // never accept containers for activities that were not sent
    const title = str(x.title, 300);
    if (!title) return [];
    const finish = isoDate(act.finish);
    let due = isoDate(x.due);
    if (!due || (finish && due > finish)) due = finish;
    const type = str(x.type, 4).toUpperCase();
    const role = code(x.role, /^[A-Z]{1,2}$/, "Z");
    const orig = code(x.originator, /^[A-Z0-9]{3,6}$/, "");
    return [{
      activityId: act.id, title, type: TYPE_CODES[type] ? type : "M3", role: NA_ROLE_CODES[role] ? role : "Z",
      volume: code(x.volume, /^[A-Z0-9]{1,2}$/, "ZZ"), level: code(x.level, /^[A-Z0-9]{2}$/, "XX"),
      originator: originators.length ? (originators.includes(orig) ? orig : originators[0]) : orig,
      due, format: str(x.format, 60), loin: str(x.loin, 200), notes: str(x.notes, 300),
    }];
  });
  res.json({ containers });
}));

export default r;
