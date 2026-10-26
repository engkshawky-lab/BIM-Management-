import { progressPct } from "../shared/delivery";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { notify } from "./access";
import { apiKey, ask } from "./claude";
import { db, newId, schema } from "./db";
import { mailEnabled, publicUrl, sendMail } from "./mailer";
import { computeQuality } from "./routes/delivery";

// Scheduled work: project automations ("agents"), daily health snapshots and the email digest.

export const AGENT_KINDS = {
  "overdue-chaser": { label: "Overdue chaser", description: "Reminds each person of their overdue containers, issues and meeting actions." },
  "quality-review": { label: "Quality review", description: "Runs the quality checks and sends managers the score, change since last run and top problems (with an AI commentary when AI is enabled)." },
  "risk-review": { label: "Risk review reminder", description: "Reminds risk owners when a risk's review date has passed." },
} as const;
export type AgentKind = keyof typeof AGENT_KINDS;

const today = () => new Date().toISOString().slice(0, 10);

async function overdueChaser(pid: string, actor: string) {
  const day = today();
  const [dels, issues, meetings] = await Promise.all([
    db.select().from(schema.deliverables).where(eq(schema.deliverables.projectId, pid)),
    db.select().from(schema.issues).where(and(eq(schema.issues.projectId, pid), ne(schema.issues.status, "Closed"))),
    db.select().from(schema.meetings).where(eq(schema.meetings.projectId, pid)),
  ]);
  const per = new Map<string, string[]>();
  const add = (uid: string | null | undefined, what: string) => { if (uid) per.set(uid, [...(per.get(uid) ?? []), what]); };
  for (const d of dels) if (d.dueDate && d.dueDate < day && !["shared", "published"].includes(d.status)) add(d.assigneeId, `container ${d.containerName || d.title} (due ${d.dueDate})`);
  for (const i of issues) if (i.dueDate && i.dueDate < day) add(i.assigneeId, `issue #${i.number} ${i.title} (due ${i.dueDate})`);
  const latest = new Map<string, typeof meetings[number]>(); for (const m of meetings.sort((a, b) => a.number - b.number)) latest.set(m.type, m);
  for (const m of latest.values()) for (const a of m.actions) if (a.status !== "Done" && a.due && a.due < day) add(a.ownerId, `action "${a.text}" (due ${a.due})`);
  for (const [uid, list] of per) await notify(pid, actor, `Reminder: ${list.length} overdue item${list.length > 1 ? "s" : ""} — ${list.slice(0, 3).join("; ")}${list.length > 3 ? "…" : ""}`, "/my-day", uid);
  return per.size ? `Reminded ${per.size} ${per.size > 1 ? "people" : "person"} about ${[...per.values()].reduce((a, l) => a + l.length, 0)} overdue items.` : "Nothing overdue.";
}

async function qualityReview(pid: string, actor: string) {
  const q = await computeQuality(pid);
  const [prev] = await db.select().from(schema.qualitySnapshots).where(eq(schema.qualitySnapshots.projectId, pid)).orderBy(desc(schema.qualitySnapshots.day)).limit(1);
  const score = Math.round(q.score);
  const delta = prev ? score - prev.qualityScore : 0;
  const top = [...q.set, ...q.plan.findings, ...q.documents.flatMap((d) => d.findings.map((f) => ({ ...f, message: `${d.title}: ${f.message}` })))].filter((f) => f.severity === "error").slice(0, 5);
  let text = `Quality score ${score}%${prev ? ` (${delta >= 0 ? "+" : ""}${delta} since ${prev.day})` : ""}; ${q.counts.error} errors, ${q.counts.warning} warnings; delivery ${progressPct(q.stats.progress)}% with ${q.stats.overdue} overdue.`;
  if (top.length) text += ` Top problems: ${top.map((f) => f.message).join(" | ")}`;
  if (apiKey()) {
    try {
      const { text: ai } = await ask({ system: "You are an ISO 19650 information manager. Write three short, specific recommendations (one line each, no preamble) for the project team based on the quality summary.", messages: [{ role: "user", content: text }], maxTokens: 1000, effort: "low" });
      text += `\nRecommendations:\n${ai}`;
    } catch { /* AI is optional here */ }
  }
  const managers = await db.select({ id: schema.projectMembers.userId }).from(schema.projectMembers).where(and(eq(schema.projectMembers.projectId, pid), inArray(schema.projectMembers.role, ["owner", "manager"])));
  for (const m of managers) await notify(pid, actor, `Weekly quality review: ${text.split("\n")[0].slice(0, 400)}`, `/projects/${pid}/quality`, m.id);
  return text;
}

async function riskReview(pid: string, actor: string) {
  const day = today();
  const risks = (await db.select().from(schema.risks).where(and(eq(schema.risks.projectId, pid), ne(schema.risks.status, "Closed")))).filter((r) => r.reviewDate && r.reviewDate <= day && r.ownerId);
  for (const r of risks) await notify(pid, actor, `Risk R${String(r.number).padStart(2, "0")} "${r.title}" is due for review (${r.reviewDate}).`, `/projects/${pid}/delivery/risks`, r.ownerId!);
  return risks.length ? `Reminded owners of ${risks.length} risk${risks.length > 1 ? "s" : ""} due for review.` : "No risks due for review.";
}

export async function runAgent(agent: typeof schema.agents.$inferSelect, trigger: "schedule" | "manual") {
  const startedAt = new Date();
  let status = "ok", summary = "";
  try {
    summary = agent.kind === "overdue-chaser" ? await overdueChaser(agent.projectId, agent.createdBy)
      : agent.kind === "quality-review" ? await qualityReview(agent.projectId, agent.createdBy)
      : agent.kind === "risk-review" ? await riskReview(agent.projectId, agent.createdBy) : "Unknown automation.";
  } catch (e) { status = "error"; summary = (e as Error).message; }
  await db.insert(schema.agentRuns).values({ id: newId(), agentId: agent.id, projectId: agent.projectId, startedAt, status, summary, trigger });
  await db.update(schema.agents).set({ lastRunAt: startedAt }).where(eq(schema.agents.id, agent.id));
  return { status, summary };
}

/** One health snapshot per project per day (powers the trend charts). */
export async function snapshotProject(pid: string) {
  const day = today();
  const q = await computeQuality(pid);
  const issues = await db.select({ status: schema.issues.status }).from(schema.issues).where(eq(schema.issues.projectId, pid));
  const reviews = await db.select().from(schema.modelReviews).where(and(eq(schema.modelReviews.projectId, pid), eq(schema.modelReviews.status, "Completed")));
  const latest = new Map<string, number>(); for (const r of reviews.sort((a, b) => a.number - b.number)) latest.set(r.discipline, r.score);
  const row = { qualityScore: Math.round(q.score), errors: q.counts.error, warnings: q.counts.warning, progress: progressPct(q.stats.progress), overdue: q.stats.overdue,
    openIssues: issues.filter((i) => i.status !== "Closed").length, modelQuality: latest.size ? Math.round([...latest.values()].reduce((a, b) => a + b, 0) / latest.size) : null };
  await db.insert(schema.qualitySnapshots).values({ id: newId(), projectId: pid, day, ...row }).onDuplicateKeyUpdate({ set: row });
}

async function dailyDigest() {
  if (!mailEnabled()) return;
  const since = new Date(Date.now() - 36 * 3600_000);
  const users = await db.select().from(schema.users).where(and(eq(schema.users.emailPref, "digest"), eq(schema.users.disabled, 0)));
  for (const u of users) {
    const notes = (await db.select().from(schema.notifications).where(and(eq(schema.notifications.userId, u.id), eq(schema.notifications.emailed, false)))).filter((n) => n.createdAt > since);
    if (!notes.length) continue;
    const ok = await sendMail(u.email, `Your portal digest — ${notes.length} update${notes.length > 1 ? "s" : ""}`, [`Hello ${u.name}, here is what happened on your projects:`, ...notes.slice(0, 40).map((n) => `• ${n.message}`)], { label: "Open My Day", url: `${publicUrl()}/#/my-day` });
    if (ok) await db.update(schema.notifications).set({ emailed: true }).where(inArray(schema.notifications.id, notes.map((n) => n.id)));
  }
}

const due = (a: typeof schema.agents.$inferSelect) => !a.lastRunAt || Date.now() - a.lastRunAt.getTime() >= (a.frequency === "daily" ? 23 : 24 * 7 - 1) * 3600_000;

async function getSetting(key: string) { const [r] = await db.select().from(schema.settings).where(eq(schema.settings.key, key)); return (r?.value ?? {}) as Record<string, string>; }
async function setSetting(key: string, value: Record<string, string>) { await db.insert(schema.settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } }); }

export async function tick() {
  const day = today();
  const state = await getSetting("scheduler");
  if (state.snapshotDay !== day) {
    for (const p of await db.select({ id: schema.projects.id }).from(schema.projects)) await snapshotProject(p.id).catch((e) => console.error("[snapshot]", e.message));
    await setSetting("scheduler", { ...state, snapshotDay: day });
  }
  const hour = new Date().getUTCHours();
  if (hour >= Number(process.env.DIGEST_HOUR_UTC ?? 6) && state.digestDay !== day) {
    await dailyDigest().catch((e) => console.error("[digest]", e.message));
    await setSetting("scheduler", { ...(await getSetting("scheduler")), digestDay: day });
  }
  for (const a of (await db.select().from(schema.agents).where(eq(schema.agents.enabled, true))).filter(due)) await runAgent(a, "schedule");
}

export function startScheduler() {
  if (process.env.SCHEDULER === "off") return;
  const run = () => tick().catch((e) => console.error("[scheduler]", e));
  setTimeout(run, 30_000);
  setInterval(run, 10 * 60_000);
}
