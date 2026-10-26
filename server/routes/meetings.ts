import { and, asc, eq, max } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { ACTION_STATUSES, MEETING_TYPES } from "../../shared/meetings";
import { logActivity, memberRole, notify, requireProject } from "../access";
import { db, newId, schema } from "../db";
import { h, parse, sentKeys } from "./auth";

const r = Router();
const P = "/projects/:projectId/meetings";

const meetingSchema = z.object({
  title: z.string().trim().min(1).max(255), type: z.enum(Object.keys(MEETING_TYPES) as [string, ...string[]]),
  date: z.string().regex(/^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?)?$/).default(""), location: z.string().max(160).default(""),
  attendees: z.array(z.string().max(160)).max(80).default([]),
  agenda: z.array(z.object({ item: z.string().max(300), presenter: z.string().max(120).default(""), minutes: z.string().max(5000).default("") })).max(60).optional(),
  actions: z.array(z.object({ id: z.string().max(36), text: z.string().max(500), ownerId: z.string().max(36).default(""), due: z.string().max(10).default(""), status: z.enum(ACTION_STATUSES).default("Open") })).max(200).default([]),
  status: z.enum(["Planned", "Held", "Minutes issued"]).default("Planned"),
});

const load = async (pid: string, id: string) => (await db.select().from(schema.meetings).where(and(eq(schema.meetings.id, id), eq(schema.meetings.projectId, pid))))[0];

r.get(P, requireProject(), h(async (req, res) => {
  res.json({ meetings: await db.select().from(schema.meetings).where(eq(schema.meetings.projectId, req.params.projectId)).orderBy(asc(schema.meetings.number)) });
}));

r.get(P + "/:id", requireProject(), h(async (req, res) => {
  const m = await load(req.params.projectId, req.params.id);
  if (!m) return res.status(404).json({ error: "Meeting not found." });
  res.json({ meeting: m });
}));

r.post(P, requireProject("editor"), h(async (req, res) => {
  const body = parse(meetingSchema, req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const [{ n }] = await db.select({ n: max(schema.meetings.number) }).from(schema.meetings).where(eq(schema.meetings.projectId, pid));
  // carry open actions forward from the previous meeting of the same type
  const prev = (await db.select().from(schema.meetings).where(and(eq(schema.meetings.projectId, pid), eq(schema.meetings.type, body.type)))).sort((a, b) => b.number - a.number)[0];
  const carried = (prev?.actions ?? []).filter((a) => a.status !== "Done");
  const id = newId(); const now = new Date();
  await db.insert(schema.meetings).values({
    ...body, agenda: body.agenda ?? MEETING_TYPES[body.type].map((item) => ({ item, presenter: "", minutes: "" })),
    actions: [...carried, ...body.actions], id, projectId: pid, number: (n ?? 0) + 1, createdBy: req.user!.id, createdAt: now, updatedAt: now,
  });
  await logActivity(pid, req.user!.id, "meeting.created", `Scheduled ${body.type} meeting: ${body.title}`, `/projects/${pid}/meetings/${id}`);
  res.status(201).json({ id, carried: carried.length });
}));

r.put(P + "/:id", requireProject("editor"), h(async (req, res) => {
  const parsed = parse(meetingSchema.partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  const pid = req.params.projectId;
  const m = await load(pid, req.params.id);
  if (!m) return res.status(404).json({ error: "Meeting not found." });
  // notify newly assigned action owners
  if (body.actions) {
    const before = new Map(m.actions.map((a) => [a.id, a.ownerId]));
    for (const a of body.actions) if (a.ownerId && before.get(a.id) !== a.ownerId && (await memberRole(pid, a.ownerId)))
      await notify(pid, req.user!.id, `Action assigned to you: ${a.text}`, `/projects/${pid}/meetings/${m.id}`, a.ownerId);
  }
  await db.update(schema.meetings).set({ ...body, updatedAt: new Date() }).where(eq(schema.meetings.id, m.id));
  if (body.status && body.status !== m.status) await logActivity(pid, req.user!.id, "meeting.status", `${m.title}: ${body.status}`, `/projects/${pid}/meetings/${m.id}`);
  res.json({ ok: true });
}));

r.delete(P + "/:id", requireProject("manager"), h(async (req, res) => {
  await db.delete(schema.meetings).where(and(eq(schema.meetings.id, req.params.id), eq(schema.meetings.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

export default r;
