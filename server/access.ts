import { mailEnabled, publicUrl, sendMail } from "./mailer";
import { and, eq, inArray, ne } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db, newId, schema } from "./db";

export const ROLES = ["viewer", "editor", "manager", "owner"] as const;
export type ProjectRole = (typeof ROLES)[number];
export const atLeast = (role: string | undefined, min: ProjectRole) => ROLES.indexOf(role as ProjectRole) >= ROLES.indexOf(min);

declare module "express-serve-static-core" {
  interface Request { projectRole?: ProjectRole }
}

export async function memberRole(projectId: string, userId: string): Promise<ProjectRole | undefined> {
  const [m] = await db.select().from(schema.projectMembers)
    .where(and(eq(schema.projectMembers.projectId, projectId), eq(schema.projectMembers.userId, userId)));
  return m?.role as ProjectRole | undefined;
}

/** Route guard: user must be a project member with at least `min` role. Uses :projectId param. */
export const requireProject = (min: ProjectRole = "viewer") => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await memberRole(req.params.projectId, req.user!.id);
    if (!role) return res.status(404).json({ error: "Project not found." });
    if (!atLeast(role, min)) return res.status(403).json({ error: `This action needs the ${min} role or higher.` });
    req.projectRole = role;
    next();
  } catch (e) { next(e); }
};

export async function logActivity(projectId: string, userId: string, action: string, summary: string, link = "") {
  await db.insert(schema.activity).values({ id: newId(), projectId, userId, action, summary: summary.slice(0, 500), link, createdAt: new Date() });
}

/** Notify one user, or every other project member when `userId` is omitted. */
export async function notify(projectId: string, actorId: string, message: string, link: string, userId?: string) {
  const targets = userId
    ? [userId]
    : (await db.select({ id: schema.projectMembers.userId }).from(schema.projectMembers)
        .where(and(eq(schema.projectMembers.projectId, projectId), ne(schema.projectMembers.userId, actorId)))).map((r) => r.id);
  const now = new Date();
  const rows = targets.filter((t) => t !== actorId).map((t) => ({ id: newId(), userId: t, projectId, message: message.slice(0, 500), link, createdAt: now }));
  if (!rows.length) return;
  await db.insert(schema.notifications).values(rows);
  // instant email for users who want it; digest users get them in the daily summary
  if (!mailEnabled()) return;
  const users = await db.select({ id: schema.users.id, email: schema.users.email, pref: schema.users.emailPref, disabled: schema.users.disabled }).from(schema.users).where(inArray(schema.users.id, rows.map((r) => r.userId)));
  const [project] = await db.select({ code: schema.projects.code, name: schema.projects.name }).from(schema.projects).where(eq(schema.projects.id, projectId));
  for (const u of users.filter((x) => x.pref === "instant" && !x.disabled)) {
    const row = rows.find((r) => r.userId === u.id)!;
    void sendMail(u.email, `[${project?.code ?? "Portal"}] ${message.slice(0, 120)}`, [message, `Project: ${project?.code} — ${project?.name}`], link ? { label: "Open in the portal", url: `${publicUrl()}/#${link}` } : undefined)
      .then(async (ok) => { if (ok) await db.update(schema.notifications).set({ emailed: true }).where(eq(schema.notifications.id, row.id)); })
      .catch(() => undefined);
  }
}
