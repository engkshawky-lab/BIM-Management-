import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { Router, type NextFunction, type Request, type Response } from "express";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import { db, newId, schema } from "../db";
import { ask, parseJson } from "../claude";
import { renderLayout, type EmailBlocks } from "../emailLayout";
import { LOGO_PNG_BASE64 } from "../emailLogo";
import { deliverEmail, mailEnabled, publicUrl } from "../mailer";
import { draftProblems, personalize, PLACEHOLDERS, placeholderValues, TEMPLATES } from "../emailTemplates";
import { DEFAULT_FILTER, describeFilter, matchesAudience, type AudienceFilter, type Person } from "../../shared/emailAudience";
import { h, parse } from "./auth";

// Admin › Email users: pick people with a filter, start from one of the mockups (server/emailTemplates.ts), edit it
// with a live preview, send yourself a test, then send to everyone picked. Sending runs in the background one email
// at a time with a pause between them (mailboxes limit how fast they send); each recipient's result is stored, so a
// send can be paused, resumed after a restart, or retried for the failed ones. A Claude assistant can set the
// filter, write the email and adjust the mockup; for pictures it writes a prompt to paste into ChatGPT.
const r = Router();
const requireAdmin = (req: Request, res: Response, next: NextFunction) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Administrators only." }));
const P = "/admin/email";

// ---------- who ----------
const day = (d: Date | null) => (d ? d.toISOString() : null);
export async function loadPeople(): Promise<Person[]> {
  const u = schema.users;
  const users = await db.select({ id: u.id, name: u.name, email: u.email, organization: u.organization, jobTitle: u.jobTitle, bimRole: u.bimRole, role: u.role, disabled: u.disabled, emailPref: u.emailPref, locale: u.locale, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, emailVerifiedAt: u.emailVerifiedAt }).from(u);
  const subs = new Map((await db.select().from(schema.subscriptions)).map((s) => [s.userId, s]));
  const counts = async (q: Promise<{ id: string; n: number | string | null }[]>) => new Map((await q).map((x) => [x.id, Number(x.n ?? 0)]));
  const projects = await counts(db.select({ id: schema.projectMembers.userId, n: count() }).from(schema.projectMembers).groupBy(schema.projectMembers.userId));
  const ai = await counts(db.select({ id: schema.aiUsage.userId, n: sql<number>`sum(${schema.aiUsage.count})` }).from(schema.aiUsage).groupBy(schema.aiUsage.userId));
  const lessons = await counts(db.select({ id: schema.lessonProgress.userId, n: count() }).from(schema.lessonProgress).groupBy(schema.lessonProgress.userId));
  return users.map((x) => {
    const s = subs.get(x.id);
    const plan = (s?.plan === "enterprise" ? "expert" : s?.plan ?? "free") as Person["plan"];
    return {
      id: x.id, name: x.name, email: x.email, organization: x.organization, jobTitle: x.jobTitle, bimRole: x.bimRole, role: x.role,
      status: x.disabled === 2 ? "pending" : x.disabled ? "disabled" : "active", plan, renewsAt: plan === "free" ? null : day(s?.renewsAt ?? null), source: s?.source ?? "",
      verified: !!x.emailVerifiedAt, locale: x.locale, emailPref: x.emailPref, createdAt: x.createdAt.toISOString(), lastLoginAt: day(x.lastLoginAt),
      projects: projects.get(x.id) ?? 0, aiRequests: ai.get(x.id) ?? 0, lessons: lessons.get(x.id) ?? 0,
    };
  });
}

function facets(people: Person[]) {
  const tally = (vals: string[], top = 200) => [...vals.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]).slice(0, top).map(([value, n]) => ({ value, n }));
  return {
    total: people.length, roles: tally(people.map((p) => p.role)), sources: tally(people.map((p) => p.source)),
    locales: tally(people.map((p) => p.locale)), organizations: tally(people.map((p) => p.organization.trim()).filter(Boolean)),
    bimRoles: tally(people.map((p) => p.bimRole ?? "").filter(Boolean)),
  };
}

const list = z.array(z.string().max(160)).max(200).optional();
const filterSchema = z.object({
  q: z.string().max(200).optional(), roles: list, statuses: z.array(z.enum(["active", "disabled", "pending"])).optional(),
  plans: z.array(z.enum(["free", "starter", "pro", "expert"])).optional(), planState: z.enum(["any", "current", "expired", "no-end"]).optional(),
  planEndsWithinDays: z.number().int().min(0).max(3650).nullable().optional(), sources: list, verified: z.enum(["any", "yes", "no"]).optional(),
  locales: list, emailPrefs: list, joinedFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")), joinedTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  lastLogin: z.enum(["any", "never", "within", "not-within"]).optional(), lastLoginDays: z.number().int().min(1).max(3650).nullable().optional(),
  projects: z.enum(["any", "none", "some"]).optional(), ai: z.enum(["any", "used", "never"]).optional(), learning: z.enum(["any", "started", "none"]).optional(),
  organizations: list, bimRoles: list, excludeTest: z.boolean().optional(),
});

r.get(P + "/facets", requireAdmin, h(async (_req, res) => res.json(facets(await loadPeople()))));
r.post(P + "/audience", requireAdmin, h(async (req, res) => {
  const body = parse(z.object({ filter: filterSchema }), req.body, res); if (!body) return;
  const people = (await loadPeople()).filter((p) => matchesAudience(p, body.filter)).sort((a, b) => a.name.localeCompare(b.name));
  res.json({ count: people.length, people, summary: describeFilter(body.filter) });
}));

// ---------- what ----------
const tone = z.enum(["gold", "info", "danger", "success"]);
const text = (max: number) => z.string().max(max);
const link = z.string().trim().max(500);
export const blocksSchema = z.object({
  lang: z.enum(["en", "ar"]).optional(), subject: z.string().trim().min(1, "Write a subject.").max(200), preheader: text(300).optional(),
  badge: z.object({ text: text(60), tone }).optional(), heading: z.string().trim().min(1, "Write a heading.").max(200), intro: text(3000),
  paragraphs: z.array(text(3000)).max(20).optional(), steps: z.array(text(500)).max(10).optional(),
  rows: z.array(z.tuple([text(80), text(300)])).max(12).optional(),
  notice: z.object({ text: text(1500), tone, dir: z.enum(["rtl", "ltr"]).optional() }).optional(),
  button: z.object({ label: text(60), url: link }).optional(), secondary: z.object({ label: text(80), url: link }).optional(),
  image: z.object({
    src: z.string().max(2_800_000).regex(/^(data:image\/(png|jpeg|gif);base64,[A-Za-z0-9+/=]+|https:\/\/\S+)$/, "The banner must be a PNG, JPEG or GIF, or an https address."),
    alt: text(200).optional(), url: link.optional(),
  }).optional(),
  reason: text(300).optional(),
});
type Blocks = z.infer<typeof blocksSchema>;

/** Drop empty optional blocks, and links that aren't web or mail addresses after personalisation. */
function tidy(b: EmailBlocks): EmailBlocks {
  const ok = (u?: string) => !!u && /^(https?:\/\/|mailto:)\S+$/i.test(u.trim());
  return {
    ...b, paragraphs: b.paragraphs?.filter((p) => (typeof p === "string" ? p.trim() : p.text.trim())), steps: b.steps?.filter((s) => s.trim()),
    rows: b.rows?.filter(([l, v]) => l.trim() && v?.trim()), badge: b.badge?.text.trim() ? b.badge : undefined, notice: b.notice?.text.trim() ? b.notice : undefined,
    button: b.button?.label.trim() && ok(b.button.url) ? b.button : undefined, secondary: b.secondary?.label.trim() && ok(b.secondary.url) ? b.secondary : undefined,
    image: b.image?.src ? { ...b.image, url: ok(b.image.url) ? b.image.url : undefined } : undefined,
  };
}
const portal = (req: Request) => publicUrl(`${req.protocol}://${req.get("host")}`);
const varsFor = (p: { name: string; email: string; organization: string; plan: string; renewsAt: string | Date | null }, portalUrl: string) => placeholderValues({ ...p, portalUrl });
/** The email one person gets. */
const forPerson = (b: Blocks, p: Parameters<typeof varsFor>[0], portalUrl: string): EmailBlocks => tidy({ ...personalize(b as EmailBlocks, varsFor(p, portalUrl)), portalUrl });

async function personById(id: string) { return (await loadPeople()).find((p) => p.id === id); }

const sampleMe = (req: Request) => ({ name: req.user!.name, email: req.user!.email, organization: req.user!.organization ?? "", plan: "pro", renewsAt: new Date(Date.now() + 90 * 864e5) });
r.get(P + "/templates", requireAdmin, (req, res) => res.json({
  templates: TEMPLATES.map((t) => ({ ...t, html: renderLayout({ ...forPerson(t.blocks as Blocks, sampleMe(req), portal(req)), logoSrc: `/api${P}/logo.png` }).html })),
  placeholders: PLACEHOLDERS, mail: mailEnabled(),
}));
r.get(P + "/logo.png", requireAdmin, (_req, res) => { res.setHeader("Content-Type", "image/png"); res.setHeader("Cache-Control", "private, max-age=86400"); res.send(Buffer.from(LOGO_PNG_BASE64, "base64")); });

r.post(P + "/preview", requireAdmin, h(async (req, res) => {
  const body = parse(z.object({ blocks: blocksSchema, userId: z.string().max(36).optional() }), req.body, res); if (!body) return;
  const who = (body.userId && await personById(body.userId)) || sampleMe(req);
  const m = forPerson(body.blocks, who, portal(req));
  const { html } = renderLayout({ ...m, logoSrc: `/api${P}/logo.png` });
  res.json({ html, subject: m.subject, to: who.email, problems: draftProblems(body.blocks as EmailBlocks) });
}));

r.post(P + "/test", requireAdmin, h(async (req, res) => {
  const body = parse(z.object({ blocks: blocksSchema }), req.body, res); if (!body) return;
  if (!mailEnabled()) return res.status(400).json({ error: "Email is not configured on the server (SMTP_HOST)." });
  const me = (await personById(req.user!.id))!;
  const m = forPerson(body.blocks, me, portal(req));
  const sent = await deliverEmail(me.email, { ...m, subject: `[TEST] ${m.subject}` });
  if (!sent.ok) return res.status(502).json({ error: `Sending failed: ${sent.error ?? "see the server log"}` });
  res.json({ ok: true, to: me.email });
}));

// ---------- sending ----------
const running = new Map<string, { stop: null | "pause" | "cancel" }>();

async function setStatus(id: string, status: string, finished = false) {
  await db.update(schema.emailCampaigns).set({ status, ...(finished ? { finishedAt: new Date() } : {}) }).where(eq(schema.emailCampaigns.id, id));
}

/** Send a campaign's pending recipients one by one. Safe to call again: a running campaign isn't started twice. */
async function run(id: string) {
  if (running.has(id)) return;
  const ctl = { stop: null as null | "pause" | "cancel" };
  running.set(id, ctl);
  try {
    const [c] = await db.select().from(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, id));
    if (!c) return;
    await setStatus(id, "sending");
    const blocks = c.blocks as unknown as Blocks & { portalUrl?: string };
    const R = schema.emailCampaignRecipients;
    for (;;) {
      if (ctl.stop === "cancel") {
        await db.update(R).set({ status: "skipped", error: "Cancelled" }).where(and(eq(R.campaignId, id), eq(R.status, "pending")));
        await setStatus(id, "cancelled", true); break;
      }
      if (ctl.stop === "pause") { await setStatus(id, "paused"); break; }
      const [next] = await db.select().from(R).where(and(eq(R.campaignId, id), eq(R.status, "pending"))).limit(1);
      if (!next) { await setStatus(id, "done", true); break; }
      const at = and(eq(R.campaignId, id), eq(R.userId, next.userId));
      // the person's current details: they may have changed, been disabled or deleted since the send started
      const [u] = await db.select({ name: schema.users.name, email: schema.users.email, organization: schema.users.organization, disabled: schema.users.disabled, emailPref: schema.users.emailPref }).from(schema.users).where(eq(schema.users.id, next.userId));
      if (!u || u.disabled === 1 || u.email.endsWith("@deleted.invalid")) { await db.update(R).set({ status: "skipped", error: u ? "Account disabled or deleted" : "Account deleted" }).where(at); continue; }
      const [s] = await db.select({ plan: schema.subscriptions.plan, renewsAt: schema.subscriptions.renewsAt }).from(schema.subscriptions).where(eq(schema.subscriptions.userId, next.userId));
      const plan = s?.plan === "enterprise" ? "expert" : s?.plan ?? "free";
      const m = forPerson(blocks, { ...u, plan, renewsAt: s?.renewsAt ?? null }, blocks.portalUrl ?? publicUrl());
      const result = await deliverEmail(u.email, m);
      await db.update(R).set({ status: result.ok ? "sent" : "failed", error: (result.error ?? "").slice(0, 255), sentAt: new Date(), email: u.email }).where(at);
      await sleep(c.delayMs);
    }
  } catch (e) {
    console.error(`[admin-email] campaign ${id} stopped:`, (e as Error).message);
    await setStatus(id, "paused").catch(() => undefined);
  } finally { running.delete(id); }
}

r.post(P + "/campaigns", requireAdmin, h(async (req, res) => {
  const body = parse(z.object({ blocks: blocksSchema, userIds: z.array(z.string().max(36)).min(1, "Pick at least one person.").max(20000), filter: filterSchema.optional(), delayMs: z.number().int().min(500).max(60000).default(3000) }), req.body, res); if (!body) return;
  if (!mailEnabled()) return res.status(400).json({ error: "Email is not configured on the server (SMTP_HOST)." });
  const problems = draftProblems(body.blocks as EmailBlocks);
  if (problems.length) return res.status(400).json({ error: `Fix the email first. ${problems.join(" · ")}` });
  if (running.size) return res.status(409).json({ error: "Another email is still being sent. Wait for it to finish or pause it first." });
  const wanted = new Set(body.userIds);
  const people = (await loadPeople()).filter((p) => wanted.has(p.id) && p.status !== "disabled" && !p.email.endsWith("@deleted.invalid"));
  const seen = new Set<string>();
  const targets = people.filter((p) => { const e = p.email.toLowerCase(); if (seen.has(e)) return false; seen.add(e); return true; });
  if (!targets.length) return res.status(400).json({ error: "None of the picked people can receive email." });
  const id = newId();
  await db.insert(schema.emailCampaigns).values({ id, subject: body.blocks.subject, blocks: { ...body.blocks, portalUrl: portal(req) }, filter: (body.filter ?? null) as Record<string, unknown> | null, status: "sending", total: targets.length, delayMs: body.delayMs, createdBy: req.user!.id, createdAt: new Date() });
  for (let i = 0; i < targets.length; i += 500) await db.insert(schema.emailCampaignRecipients).values(targets.slice(i, i + 500).map((p) => ({ campaignId: id, userId: p.id, email: p.email })));
  console.log(`[admin-email] ${req.user!.email} started "${body.blocks.subject}" to ${targets.length} people`);
  void run(id);
  res.status(201).json({ id, total: targets.length });
}));

r.get(P + "/campaigns", requireAdmin, h(async (_req, res) => {
  const C = schema.emailCampaigns, R = schema.emailCampaignRecipients;
  const rows = await db.select({ id: C.id, subject: C.subject, status: C.status, total: C.total, delayMs: C.delayMs, filter: C.filter, createdAt: C.createdAt, finishedAt: C.finishedAt, by: schema.users.name })
    .from(C).leftJoin(schema.users, eq(schema.users.id, C.createdBy)).orderBy(desc(C.createdAt)).limit(30);
  const tallies = rows.length ? await db.select({ id: R.campaignId, status: R.status, n: count() }).from(R).where(inArray(R.campaignId, rows.map((x) => x.id))).groupBy(R.campaignId, R.status) : [];
  res.json({ campaigns: rows.map((c) => {
    const n = (s: string) => Number(tallies.find((t) => t.id === c.id && t.status === s)?.n ?? 0);
    return { ...c, filter: c.filter ? describeFilter(c.filter as AudienceFilter) : [], sent: n("sent"), failed: n("failed"), skipped: n("skipped"), pending: n("pending"),
      // "sending" in the database but no sender running: the server restarted mid-send
      state: c.status === "sending" && !running.has(c.id) ? "interrupted" : c.status };
  }) });
}));

r.get(P + "/campaigns/:id", requireAdmin, h(async (req, res) => {
  const [c] = await db.select().from(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, req.params.id));
  if (!c) return res.status(404).json({ error: "Not found." });
  const R = schema.emailCampaignRecipients;
  const problems = await db.select({ email: R.email, status: R.status, error: R.error }).from(R).where(and(eq(R.campaignId, c.id), inArray(R.status, ["failed", "skipped"]))).limit(500);
  const { portalUrl: _p, ...blocks } = c.blocks as Record<string, unknown>;
  res.json({ blocks, problems });
}));

r.post(P + "/campaigns/:id/:action", requireAdmin, h(async (req, res) => {
  const action = req.params.action;
  if (!["pause", "resume", "cancel", "retry"].includes(action)) return res.status(404).json({ error: "Not found." });
  const [c] = await db.select().from(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, req.params.id));
  if (!c) return res.status(404).json({ error: "Not found." });
  const ctl = running.get(c.id);
  if (action === "pause" || action === "cancel") {
    if (ctl) ctl.stop = action;
    else if (action === "cancel" && c.status !== "done") {
      const R = schema.emailCampaignRecipients;
      await db.update(R).set({ status: "skipped", error: "Cancelled" }).where(and(eq(R.campaignId, c.id), eq(R.status, "pending")));
      await setStatus(c.id, "cancelled", true);
    } else if (action === "pause" && c.status === "sending") await setStatus(c.id, "paused");
    return res.json({ ok: true });
  }
  if (ctl) return res.json({ ok: true });
  if (running.size) return res.status(409).json({ error: "Another email is still being sent. Wait for it to finish or pause it first." });
  if (!mailEnabled()) return res.status(400).json({ error: "Email is not configured on the server (SMTP_HOST)." });
  if (action === "retry") {
    const R = schema.emailCampaignRecipients;
    await db.update(R).set({ status: "pending", error: "" }).where(and(eq(R.campaignId, c.id), eq(R.status, "failed")));
  } else if (c.status === "done" || c.status === "cancelled") return res.status(400).json({ error: "This email has finished. Use Retry failed to send the failed ones again." });
  console.log(`[admin-email] ${req.user!.email} ${action === "retry" ? "retried failed sends of" : "resumed"} campaign ${c.id}`);
  void run(c.id);
  res.json({ ok: true });
}));

// ---------- assistant ----------
const SYSTEM = `You are the email assistant on the "Email users" page of the BIM Management portal admin console (FirstOption Engineering Services, an ISO 19650 BIM consultancy). The administrator sends emails to the portal's users. You help with three jobs:

1. FIND USERS. Set "filter" to a complete audience filter (it replaces the current one). The page then counts and lists the people; you never see their personal data, only the facet counts given. Filter fields (all optional; an empty list or "any" means no condition):
   q (text matched against name, email, organisation, job title; every word must match), roles ["user","recruiter","admin"], statuses ["active","disabled","pending"] (pending = waiting for approval), plans ["free","starter","pro","expert"], planState "any"|"current"|"expired"|"no-end", planEndsWithinDays (number: paid plan ending within N days), sources (where the plan came from, e.g. "old-platform", "stripe"; use the facet values), verified "any"|"yes"|"no" (email confirmed), locales (e.g. ["ar"]), emailPrefs ["instant","digest","off"], joinedFrom / joinedTo ("YYYY-MM-DD"), lastLogin "any"|"never"|"within"|"not-within" with lastLoginDays, projects "any"|"none"|"some", ai "any"|"used"|"never", learning "any"|"started"|"none" (completed lessons), organizations (exact names from the facets), bimRoles, excludeTest (true leaves out test and deleted addresses).
   Unless asked otherwise keep statuses ["active"], emailPrefs ["instant","digest"] (people who turned email off are left out) and excludeTest true.

2. WRITE THE EMAIL. Set "draft" to the complete email (it replaces the current one, so carry over everything that should stay). Email fields:
   lang "en"|"ar", subject, preheader (the grey line shown after the subject), badge {text, tone}, heading, intro, paragraphs [strings], steps [short strings, numbered], rows [[label, value]] (a details table), notice {text, tone, dir?} (a highlighted box), button {label, url}, secondary {label, url} (a text link under the button), image {alt, url?} (the banner picture; see images), reason (footer line saying why they get it).
   tone is "gold" (default, brand), "info" (blue), "success" (green) or "danger" (red).
   Placeholders filled per person: {{firstName}}, {{name}}, {{email}}, {{organization}}, {{plan}}, {{planEnds}}, {{portalUrl}}. Link to portal pages as {{portalUrl}}/#/login, /#/billing (plans and promo codes), /#/learn, /#/learning-paths, /#/profile (email settings), /#/support, /#/videos, /#/tools, /#/news.
   Never invent facts the administrator didn't give (dates, prices, codes, names, links, features): write [square bracket notes] such as [date] for them to fill in; the page refuses to send while any are left. Short, clear, friendly and professional. British English; when the email is in Arabic set lang "ar" and write Modern Standard Arabic. Keep the footer reason telling people they can turn email off in their profile.

3. ADJUST THE MOCKUP. The design (FirstOption's approved dark layout: logo, gold accents, card, footer) is fixed, but you can change everything inside it: which blocks appear and their order of content, badge text and colour, notice colour, button text and link, language and direction, and the banner image's alt text. Edits like "make it shorter", "red badge", "add a details table", "move this into a notice" are draft changes.

IMAGES: you cannot create, draw or edit pictures. When a request needs a new or changed picture (banner, illustration, photo, icon, graphic, a different picture), do not pretend. Put in "imagePrompt" a complete, ready-to-paste prompt for ChatGPT's image generator, and in "reply" tell the administrator to paste it into ChatGPT, download the picture, and upload it with "Banner image" in the editor (you may set draft.image.alt to describe it). The prompt must ask for: a wide 2:1 banner, 1200×600 px; dark navy background #0a0e16 with gold #e0af36 accents and light text colour #dfe2ee, matching a dark professional email; clean, modern, engineering and BIM (building information modelling) style; the subject the administrator asked for; little or no text in the image (if any, a few large words, spelled exactly as given); no logos (the FirstOption logo is already in the email header). If they describe changes to a picture they already have, write the prompt so ChatGPT edits the uploaded picture and say they should attach it in ChatGPT.

Answer with one JSON object only, no Markdown fences:
{"reply": "what you did or your answer, short; Arabic if the administrator wrote in Arabic", "filter": {…} or null, "draft": {…} or null, "imagePrompt": "…" or null}
Use null for whatever you are not changing. If the request is unclear, ask one short question in "reply" and change nothing.`;

const chatSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(6000) })).min(1).max(30),
  draft: z.unknown().optional(), filter: filterSchema.optional(),
});

r.post(P + "/assistant", requireAdmin, h(async (req, res) => {
  const body = parse(chatSchema, req.body, res); if (!body) return;
  const people = await loadPeople();
  const filter = body.filter ?? DEFAULT_FILTER;
  const current = blocksSchema.safeParse(body.draft);
  const draft = current.success ? { ...current.data, image: current.data.image ? { alt: current.data.image.alt ?? "", url: current.data.image.url, picture: "uploaded" } : undefined } : null;
  const state = {
    today: new Date().toISOString().slice(0, 10), currentFilter: filter, matchingNow: people.filter((p) => matchesAudience(p, filter)).length,
    facets: facets(people), mockups: TEMPLATES.map((t) => `${t.id}: ${t.name} — ${t.description}`), currentDraft: draft,
  };
  const turns = body.messages.slice(-12);
  while (turns.length && turns[0].role !== "user") turns.shift();
  const last = turns.pop();
  if (!last || last.role !== "user") return res.status(400).json({ error: "Write a message first." });
  const messages = [...turns.map((m) => ({ role: m.role, content: m.content })), { role: "user" as const, content: `<page_state>\n${JSON.stringify(state)}\n</page_state>\n\n${last.content}` }];
  const { text } = await ask({ system: SYSTEM, messages, maxTokens: 8000, effort: "medium" });
  let out: { reply?: unknown; filter?: unknown; draft?: unknown; imagePrompt?: unknown };
  try { out = parseJson(text); } catch { return res.json({ reply: text.slice(0, 4000) }); }

  const result: { reply: string; filter?: AudienceFilter; audience?: { count: number; sample: string[] }; draft?: Blocks; imagePrompt?: string; notes: string[] } = { reply: String(out.reply ?? "").slice(0, 4000), notes: [] };
  if (out.filter && typeof out.filter === "object") {
    const f = filterSchema.safeParse(out.filter);
    if (f.success) {
      const hits = people.filter((p) => matchesAudience(p, f.data));
      result.filter = f.data; result.audience = { count: hits.length, sample: hits.slice(0, 6).map((p) => p.name) };
    } else result.notes.push("The assistant's filter wasn't valid, so it wasn't applied.");
  }
  if (out.draft && typeof out.draft === "object") {
    const d = { ...(out.draft as Record<string, unknown>) };
    // the assistant never sees the uploaded picture: keep it unless it removed the banner on purpose
    const img = d.image as { alt?: string; url?: string } | null | undefined;
    const had = current.success ? current.data.image : undefined;
    if (img === null) delete d.image;
    else if (had) d.image = { ...had, ...(img?.alt !== undefined ? { alt: img.alt } : {}), ...(img?.url !== undefined ? { url: img.url } : {}) };
    else delete d.image;
    const parsed = blocksSchema.safeParse(d);
    if (parsed.success) result.draft = parsed.data;
    else result.notes.push(`The assistant's email draft wasn't valid (${parsed.error.issues[0]?.message ?? "format"}), so it wasn't applied.`);
  }
  if (typeof out.imagePrompt === "string" && out.imagePrompt.trim()) result.imagePrompt = out.imagePrompt.trim().slice(0, 4000);
  res.json(result);
}));

export default r;
