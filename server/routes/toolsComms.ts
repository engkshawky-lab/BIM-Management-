import { Router } from "express";
import { z } from "zod";
import { suitabilityCodes } from "../../shared/data/iso19650";
import { ask, parseJson } from "../claude";
import { h, parse } from "./auth";

// Standalone AI tools for meetings and correspondence: structured minutes from rough notes or a transcript,
// and drafted project correspondence (RFI, rejection, non-conformance, reminder, transmittal cover, general).
// Output is a draft for an accountable person to check; facts not in the input are never invented.

const r = Router();
const T = "/ai/tools";

const EXPERT = `You are a senior ISO 19650 information manager and BIM lead with delivery experience on buildings and infrastructure.
Be precise and practical. Refer to clauses by number (e.g. ISO 19650-2 5.6.4) and never quote standard text verbatim. Use British English.
If something depends on the appointment or the client's own requirements, say so rather than inventing a requirement.`;
const JSON_ONLY = "Respond with one JSON object only, no Markdown fences.";
const NO_INVENT = `Never invent names, organisations, dates, figures, document numbers or commitments that are not in the input. Where something is needed but not given, write "TBC".`;

const str = (v: unknown, max = 2000) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);
const strs = (v: unknown, n = 30, max = 600) => (Array.isArray(v) ? v.slice(0, n).map((x) => str(x, max)).filter(Boolean) : []);
const objs = (v: unknown, n: number) => (Array.isArray(v) ? v.slice(0, n).filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : []);
const tbc = (v: unknown, max = 200) => str(v, max) || "TBC";

// ---------------------------------------------------------------- Meeting minutes

const ACTION_STATUS = ["Open", "In progress", "Closed", "On hold"];

r.post(T + "/minutes", h(async (req, res) => {
  const body = parse(z.object({
    notes: z.string().trim().min(20, "Paste the notes or transcript (at least a few lines).").max(120_000),
    meeting: z.object({
      title: z.string().max(200).optional(), date: z.string().max(40).optional(), project: z.string().max(200).optional(),
      chair: z.string().max(120).optional(), attendees: z.string().max(4000).optional(),
    }).optional(),
  }), req.body, res); if (!body) return;
  const m = body.meeting ?? {};
  const known = [m.title && `Title: ${m.title}`, m.date && `Date: ${m.date}`, m.project && `Project: ${m.project}`, m.chair && `Chair: ${m.chair}`, m.attendees && `Attendees (as given):\n${m.attendees}`].filter(Boolean).join("\n");

  const system = `${EXPERT}
You write formal minutes of project and BIM coordination meetings from rough notes or a Teams/Zoom transcript.
Style: formal minute style, third person, past tense ("The lead appointed party confirmed…", "It was agreed that…"); concise; no small talk, no verbatim quotes, no speaker timestamps.
Use ISO 19650 terms where they fit the discussion (appointing party, lead appointed party, task team, information container, CDE states WIP/Shared/Published/Archived, status codes such as S1–S4, BEP, EIR, MIDP/TIDP, information model review, level of information need). Do not force them in where the notes do not support it.
${NO_INVENT} If the date or a due date is not stated, use "TBC"; resolve relative dates ("next Friday") only when the meeting date is known, otherwise keep the wording.
Every action must have one owner taken from the notes (or "TBC") and a reference A01, A02… in order. Status is "Open" unless the notes say it was completed.
Decisions are things agreed or confirmed in the meeting, not opinions. Risks are threats to information delivery raised in the meeting.
${JSON_ONLY}
Schema: {"title": string, "date": string, "attendees": [{"name": string, "org": string, "role": string}], "apologies": string[],
"agenda": [{"item": string, "discussion": string (formal minute, 1–5 sentences), "decisions": string[]}], "decisions": string[] (all decisions, numbered implicitly in order),
"actions": [{"ref": string, "action": string, "owner": string, "due": string, "status": "Open" | "In progress" | "Closed" | "On hold"}],
"risks": [{"risk": string, "owner": string}], "nextMeeting": string ("TBC" if not stated)}
Use "" for an unknown organisation or role of an attendee, never a guess.`;
  const user = `${known ? `Meeting details supplied by the user:\n${known}\n\n` : ""}Notes / transcript:\n${body.notes}`;
  const { text, truncated } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 16000, effort: "low" });
  let out: Record<string, unknown>;
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }

  const actions = objs(out.actions, 80).map((a, i) => ({
    ref: str(a.ref, 12) || `A${String(i + 1).padStart(2, "0")}`, action: str(a.action, 1000), owner: tbc(a.owner, 120), due: tbc(a.due, 40),
    status: ACTION_STATUS.includes(String(a.status)) ? String(a.status) : "Open",
  })).filter((a) => a.action);
  res.json({
    title: str(out.title, 200) || m.title || "Meeting minutes",
    date: str(out.date, 40) || m.date || "TBC",
    attendees: objs(out.attendees, 60).map((a) => ({ name: str(a.name, 120), org: str(a.org, 120), role: str(a.role, 120) })).filter((a) => a.name),
    apologies: strs(out.apologies, 40, 160),
    agenda: objs(out.agenda, 40).map((a) => ({ item: str(a.item, 300), discussion: str(a.discussion, 3000), decisions: strs(a.decisions, 20, 600) })).filter((a) => a.item || a.discussion),
    decisions: strs(out.decisions, 60, 600),
    actions,
    risks: objs(out.risks, 40).map((x) => ({ risk: str(x.risk, 600), owner: tbc(x.owner, 120) })).filter((x) => x.risk),
    nextMeeting: str(out.nextMeeting, 300) || "TBC",
    truncated,
  });
}));

// ---------------------------------------------------------------- Correspondence writer

const KINDS = {
  rfi: "a Request for Information (RFI): state the question precisely, why the information is needed, what is affected, and the date by which a response is needed (TBC if not given). Number questions if there are several.",
  rejection: "a rejection of a submitted model or document following the information container review (ISO 19650-2 5.6.4 / 5.7.2): identify the container(s) and status/revision, state which acceptance criteria were not met (information standard, production methods and procedures, level of information need, naming, metadata, coordination), list exactly what must be corrected, and ask for resubmission with a new revision and the expected status code. Do not invent defects: only cite failures given in the context.",
  nonconformance: "a non-conformance notice: describe the non-conformance against the stated requirement (EIR, BEP, information standard or protocol), its impact, the corrective action required and the date for close-out (TBC if not given).",
  reminder: "a polite but firm reminder that information is overdue: reference the deliverable(s) and the TIDP/MIDP date if given, the impact on the programme, and request a revised delivery date.",
  "transmittal-cover": "a short cover note for a transmittal: what is issued, the status code(s) and what they permit the recipient to use the information for, any limitations, and a request to acknowledge receipt.",
  general: "a general project letter or email on the subject in the context.",
} as const;

r.post(T + "/correspondence", h(async (req, res) => {
  const body = parse(z.object({
    kind: z.enum(Object.keys(KINDS) as [keyof typeof KINDS, ...(keyof typeof KINDS)[]]),
    context: z.string().trim().min(10, "Describe the situation (at least a sentence).").max(20_000),
    to: z.string().max(200).optional(), from: z.string().max(200).optional(), project: z.string().max(200).optional(),
    refs: z.array(z.string().max(300)).max(200).optional(),
  }), req.body, res); if (!body) return;
  const codes = suitabilityCodes.map((c) => `${c.code} (${c.state}): ${c.desc}`).join("\n");
  const system = `${EXPERT}
You draft professional project correspondence for an information manager. Write ${KINDS[body.kind]}
Tone: professional, courteous, concise (usually under 350 words), plain British English. Cite ISO 19650 activities or clauses and status (suitability) codes only where they are relevant.
${NO_INVENT} Do not add contractual threats or claims that are not in the context. Use [TBC] in the body where the writer must fill something in.
Status codes in use on the project:
${codes}
The body is Markdown: a salutation line, short paragraphs, a list or table where it helps, and a sign-off with the sender's name (or [Name]). Do not repeat the subject inside the body.
${JSON_ONLY}
Schema: {"subject": string (under 120 characters, including the project and any reference given), "body": string (Markdown), "isoRefs": string[] (the clauses or codes cited, e.g. "ISO 19650-2 5.6.4", "S3")}`;
  const user = [
    body.project && `Project: ${body.project}`, body.to && `To: ${body.to}`, body.from && `From: ${body.from}`,
    body.refs?.length && `References / information containers:\n${body.refs.slice(0, 200).join("\n")}`,
    `Context:\n${body.context}`,
  ].filter(Boolean).join("\n\n");
  const { text, truncated } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 6000, effort: "low" });
  let out: Record<string, unknown>;
  try { out = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  const bodyMd = str(out.body, 20_000);
  if (!bodyMd) return res.status(502).json({ error: "The AI returned an empty letter. Try again." });
  res.json({ subject: str(out.subject, 200) || "TBC", body: bodyMd, isoRefs: strs(out.isoRefs, 20, 80), truncated });
}));

export default r;
