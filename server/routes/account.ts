import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { z } from "zod";
import { checkPassword, endSession, hashPassword, requireUser, verificationOn } from "../auth";
import { db, schema } from "../db";
import { mailEnabled, publicUrl } from "../mailer";
import { cancelStripeSubscription } from "../payments";
import { recentErrors, reportError } from "../alerts";
import { logActivity } from "../access";
import { h, parse } from "./auth";
import { sendVerification, tokenHash } from "../verify";
import { deleteProjectData } from "./projects";

// Account self-service: confirming the email address, downloading all of one's data, and deleting the account.
// Also the browser error report and the admin list of recent errors.
const r = Router();
const origin = (req: Request) => publicUrl(`${req.protocol}://${req.get("host")}`);

// ---------- email verification ----------
r.post("/auth/verify", h(async (req, res) => {
  const body = parse(z.object({ token: z.string().regex(/^[0-9a-f]{64}$/) }), req.body, res); if (!body) return;
  const [row] = await db.select().from(schema.emailVerifications).where(eq(schema.emailVerifications.tokenHash, tokenHash(body.token)));
  if (!row || row.usedAt || row.expiresAt < new Date()) return res.status(400).json({ error: "This confirmation link is invalid or has expired. Sign in and ask for a new one." });
  await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(and(eq(schema.users.id, row.userId), isNull(schema.users.emailVerifiedAt)));
  await db.update(schema.emailVerifications).set({ usedAt: new Date() }).where(eq(schema.emailVerifications.userId, row.userId));
  res.json({ ok: true });
}));

const resendHits = new Map<string, number[]>();
r.post("/auth/verify/resend", requireUser, h(async (req, res) => {
  const u = req.user!;
  if (!u.mustVerify) return res.json({ ok: true, message: "Your email address is already confirmed." });
  const now = Date.now();
  const hits = (resendHits.get(u.id) ?? []).filter((t) => now - t < 3600_000);
  if (hits.length >= 5) return res.status(429).json({ error: "Too many requests. Try again in an hour, or ask your administrator." });
  resendHits.set(u.id, [...hits, now]);
  const sent = await sendVerification(u, origin(req));
  res.status(sent ? 200 : 502).json(sent ? { ok: true, message: `We've sent a new link to ${u.email}.` } : { error: "The email could not be sent. Try again later or ask your administrator." });
}));

// ---------- download my data ----------
// Every table that holds rows created by or about one user. Sign-in tokens and sessions are left out on purpose.
const MINE = [
  ["subscription", schema.subscriptions, schema.subscriptions.userId], ["aiUsage", schema.aiUsage, schema.aiUsage.userId],
  ["talentProfile", schema.talentProfiles, schema.talentProfiles.userId], ["talentProfileViews", schema.talentViews, schema.talentViews.userId],
  ["lessonProgress", schema.lessonProgress, schema.lessonProgress.userId], ["quizAttempts", schema.quizAttempts, schema.quizAttempts.userId],
  ["courseAssignments", schema.courseAssignments, schema.courseAssignments.userId], ["adoptionProgress", schema.adoptionProgress, schema.adoptionProgress.userId],
  ["projectMemberships", schema.projectMembers, schema.projectMembers.userId], ["notifications", schema.notifications, schema.notifications.userId],
  ["feedback", schema.feedback, schema.feedback.userId], ["comments", schema.comments, schema.comments.userId],
  ["activity", schema.activity, schema.activity.userId], ["documentsAuthored", schema.documents, schema.documents.authorId],
  ["filesUploaded", schema.files, schema.files.uploadedBy], ["issuesRaised", schema.issues, schema.issues.createdBy],
  ["meetingsCreated", schema.meetings, schema.meetings.createdBy], ["notebooks", schema.notebooks, schema.notebooks.createdBy],
  ["automations", schema.agents, schema.agents.createdBy], ["estimates", schema.estimates, schema.estimates.createdBy],
  ["clientStandards", schema.clientStandards, schema.clientStandards.ownerId], ["houseTemplates", schema.houseTemplates, schema.houseTemplates.createdBy],
  ["projectsOwned", schema.projects, schema.projects.ownerId],
] as const;

export async function exportUserData(userId: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u) return null;
  const { passwordHash: _p, ...account } = u;
  const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), account };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [name, table, col] of MINE) out[name] = await db.select().from(table as any).where(eq(col, userId)).limit(5000);
  out.invitationsToMyEmail = await db.select().from(schema.invitations).where(eq(schema.invitations.email, u.email));
  return out;
}

r.get("/profile/export", requireUser, h(async (req, res) => {
  const data = await exportUserData(req.user!.id);
  res.setHeader("Content-Disposition", `attachment; filename="my-portal-data-${new Date().toISOString().slice(0, 10)}.json"`);
  res.type("application/json").send(JSON.stringify(data, null, 2));
}));

// ---------- delete my account ----------
// Personal details are erased and sign-in is removed. Work shared in projects (comments, issues, documents) stays with
// the project team and shows as "Deleted user". Projects where the user is the only member are deleted; shared
// projects they own pass to another member (a manager first).
export async function deleteAccount(userId: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u) return { deletedProjects: 0, handedOver: 0 };
  let deletedProjects = 0, handedOver = 0;
  const mine = await db.select().from(schema.projectMembers).where(eq(schema.projectMembers.userId, userId));
  for (const m of mine) {
    const others = await db.select().from(schema.projectMembers).where(and(eq(schema.projectMembers.projectId, m.projectId), ne(schema.projectMembers.userId, userId))).orderBy(asc(schema.projectMembers.joinedAt));
    if (!others.length) { await deleteProjectData(m.projectId); deletedProjects++; continue; }
    if (m.role === "owner") {
      const next = others.find((o) => o.role === "manager") ?? others.find((o) => o.role === "editor") ?? others[0];
      await db.update(schema.projectMembers).set({ role: "owner" }).where(and(eq(schema.projectMembers.projectId, m.projectId), eq(schema.projectMembers.userId, next.userId)));
      await db.update(schema.projects).set({ ownerId: next.userId }).where(eq(schema.projects.id, m.projectId));
      await logActivity(m.projectId, next.userId, "member.owner", "Became project owner after the previous owner deleted their account");
      handedOver++;
    }
  }
  const [sub] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId));
  await cancelStripeSubscription(sub?.stripeSubscriptionId);
  for (const [table, col] of [
    [schema.projectMembers, schema.projectMembers.userId], [schema.sessions, schema.sessions.userId], [schema.passwordResets, schema.passwordResets.userId],
    [schema.emailVerifications, schema.emailVerifications.userId], [schema.notifications, schema.notifications.userId], [schema.feedback, schema.feedback.userId],
    [schema.talentProfiles, schema.talentProfiles.userId], [schema.talentViews, schema.talentViews.userId], [schema.subscriptions, schema.subscriptions.userId],
    [schema.aiUsage, schema.aiUsage.userId], [schema.lessonProgress, schema.lessonProgress.userId], [schema.quizAttempts, schema.quizAttempts.userId],
    [schema.courseAssignments, schema.courseAssignments.userId], [schema.adoptionProgress, schema.adoptionProgress.userId],
  ] as const) await db.delete(table).where(eq(col, userId));
  await db.delete(schema.invitations).where(and(eq(schema.invitations.email, u.email), isNull(schema.invitations.acceptedAt)));
  await db.update(schema.users).set({
    email: `deleted-${u.id}@deleted.invalid`, name: "Deleted user", organization: "", jobTitle: "", phone: "", bio: null, bimRole: null, favourites: null,
    passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")), disabled: 1, emailPref: "off", role: "user",
  }).where(eq(schema.users.id, userId));
  return { deletedProjects, handedOver };
}

r.delete("/profile", requireUser, h(async (req, res) => {
  const body = parse(z.object({ password: z.string(), confirm: z.literal("DELETE") }), req.body, res); if (!body) return;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, req.user!.id));
  if (!(await checkPassword(body.password, u.passwordHash))) return res.status(400).json({ error: "Password is incorrect." });
  if (u.role === "admin") {
    const admins = await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.role, "admin"), eq(schema.users.disabled, 0), ne(schema.users.id, u.id))).limit(1);
    if (!admins.length) return res.status(409).json({ error: "You are the only administrator. Make another user an administrator first." });
  }
  const result = await deleteAccount(u.id);
  console.log(`[account] user ${u.id} deleted their account (${result.deletedProjects} projects deleted, ${result.handedOver} handed over)`);
  await endSession(req, res);
  res.json({ ok: true, ...result });
}));

// what deleting would do, shown in the confirmation dialog
r.get("/profile/delete-preview", requireUser, h(async (req, res) => {
  const mine = await db.select({ projectId: schema.projectMembers.projectId, role: schema.projectMembers.role, name: schema.projects.name, code: schema.projects.code })
    .from(schema.projectMembers).innerJoin(schema.projects, eq(schema.projects.id, schema.projectMembers.projectId)).where(eq(schema.projectMembers.userId, req.user!.id));
  const ids = mine.map((m) => m.projectId);
  const shared = new Set(ids.length ? (await db.select({ p: schema.projectMembers.projectId }).from(schema.projectMembers).where(and(inArray(schema.projectMembers.projectId, ids), ne(schema.projectMembers.userId, req.user!.id)))).map((x) => x.p) : []);
  const [sub] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, req.user!.id));
  res.json({
    deleted: mine.filter((m) => !shared.has(m.projectId)).map((m) => `${m.code} — ${m.name}`),
    handedOver: mine.filter((m) => shared.has(m.projectId) && m.role === "owner").map((m) => `${m.code} — ${m.name}`),
    paidPlan: !!sub && sub.plan !== "free",
  });
}));

// ---------- error reports ----------
// Pages that crash report here (visitors too), at most 10 a minute from one address.
const pageHits = new Map<string, number[]>();
export const clientErrors = Router();
clientErrors.post("/client-error", (req, res) => {
  const body = z.object({ message: z.string().max(1000), where: z.string().max(300).default(""), stack: z.string().max(4000).default("") }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Bad report." });
  const now = Date.now(); const key = req.ip ?? "";
  const hits = (pageHits.get(key) ?? []).filter((t) => now - t < 60_000);
  if (hits.length >= 10) return res.status(429).json({ error: "Too many reports." });
  pageHits.set(key, [...hits, now]);
  const err = Object.assign(new Error(body.data.message), { stack: `Error: ${body.data.message}\n${body.data.stack}` });
  console.error(JSON.stringify({ t: new Date().toISOString(), page: body.data.where, error: body.data.message, u: req.user?.id }));
  reportError("page", err, body.data.where.replace(/[?].*$/, ""));
  res.json({ ok: true });
});

const requireAdmin = (req: Request, res: Response, next: NextFunction) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Administrators only." }));
r.get("/admin/errors", requireAdmin, (_req, res) => res.json({ errors: recentErrors(), mail: mailEnabled(), verification: verificationOn() }));

// administrators can confirm an address by hand, e.g. when the email never arrived
r.post("/admin/users/:id/verify", requireAdmin, h(async (req, res) => {
  await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(and(eq(schema.users.id, req.params.id), isNull(schema.users.emailVerifiedAt)));
  console.log(`[admin] ${req.user!.email} confirmed the email of user ${req.params.id}`);
  res.json({ ok: true });
}));

// administrators answer data requests made by email: download or delete one user's data
r.get("/admin/users/:id/export", requireAdmin, h(async (req, res) => {
  const data = await exportUserData(req.params.id);
  if (!data) return res.status(404).json({ error: "User not found." });
  console.log(`[admin] ${req.user!.email} exported the data of user ${req.params.id}`);
  res.setHeader("Content-Disposition", `attachment; filename="user-data-${req.params.id.slice(0, 8)}.json"`);
  res.type("application/json").send(JSON.stringify(data, null, 2));
}));
r.delete("/admin/users/:id", requireAdmin, h(async (req, res) => {
  if (req.params.id === req.user!.id) return res.status(400).json({ error: "Delete your own account from your profile." });
  const result = await deleteAccount(req.params.id);
  console.log(`[admin] ${req.user!.email} deleted user ${req.params.id}: ${JSON.stringify(result)}`);
  res.json({ ok: true, ...result });
}));

export default r;
