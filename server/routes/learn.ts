import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { COURSES } from "../../shared/data/courses";
import { QUESTIONS } from "../../shared/data/learn";
import { STANDARD_UPDATES, type Update } from "../../shared/data/updates";
import { ask } from "../claude";
import { db, newId, schema } from "../db";
import { h, parse } from "./auth";

// Quiz results are scored on the server from the answers, so history can be trusted.
const r = Router();

r.post("/learn/attempts", h(async (req, res) => {
  const body = parse(z.object({ mode: z.enum(["practice", "exam"]), topic: z.string().max(60).default(""), answers: z.record(z.string(), z.number().int()).refine((a) => Object.keys(a).length <= 100), seconds: z.number().int().min(0).max(86400).default(0) }), req.body, res); if (!body) return;
  const byTopic: Record<string, [number, number]> = {};
  let score = 0;
  for (const [id, a] of Object.entries(body.answers)) {
    const q = QUESTIONS.find((x) => x.id === id); if (!q) continue;
    const t = (byTopic[q.topic] ??= [0, 0]);
    t[1]++; if (q.answer === a) { t[0]++; score++; }
  }
  const total = Object.values(byTopic).reduce((a, [, n]) => a + n, 0);
  if (!total) return res.status(400).json({ error: "No valid answers." });
  await db.insert(schema.quizAttempts).values({ id: newId(), userId: req.user!.id, mode: body.mode, topic: body.topic, score, total, byTopic, seconds: body.seconds, createdAt: new Date() });
  res.status(201).json({ score, total, byTopic });
}));

r.get("/learn/attempts", h(async (req, res) => {
  const rows = await db.select().from(schema.quizAttempts).where(eq(schema.quizAttempts.userId, req.user!.id)).orderBy(desc(schema.quizAttempts.createdAt)).limit(50);
  // skill profile: all answers per topic across attempts
  const profile: Record<string, [number, number]> = {};
  for (const x of rows) for (const [t, [c, n]] of Object.entries(x.byTopic)) { const p = (profile[t] ??= [0, 0]); p[0] += c; p[1] += n; }
  res.json({ attempts: rows, profile });
}));

// ---------- courses ----------
r.get("/learn/courses", h(async (req, res) => {
  const done = await db.select().from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, req.user!.id));
  const [videos] = await db.select().from(schema.settings).where(eq(schema.settings.key, "lessonVideos"));
  res.json({ completed: done.map((d) => `${d.courseId}/${d.lessonId}`), videos: videos?.value ?? {} });
}));
r.post("/learn/courses/:courseId/:lessonId/complete", h(async (req, res) => {
  const c = COURSES.find((x) => x.id === req.params.courseId);
  if (!c?.lessons.some((l) => l.id === req.params.lessonId)) return res.status(404).json({ error: "Lesson not found." });
  await db.insert(schema.lessonProgress).values({ userId: req.user!.id, courseId: c.id, lessonId: req.params.lessonId, completedAt: new Date() }).onDuplicateKeyUpdate({ set: { completedAt: new Date() } });
  res.json({ ok: true });
}));
r.put("/learn/videos", h(async (req, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Administrators only." });
  const body = parse(z.object({ key: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/), url: z.string().url().max(500).or(z.literal("")) }), req.body, res); if (!body) return;
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "lessonVideos"));
  const value = { ...((row?.value ?? {}) as Record<string, string>) };
  if (body.url) value[body.key] = body.url; else delete value[body.key];
  await db.insert(schema.settings).values({ key: "lessonVideos", value }).onDuplicateKeyUpdate({ set: { value } });
  res.json({ ok: true });
}));

// ---------- standards updates (curated, extendable by admins) ----------
r.get("/learn/updates", h(async (_req, res) => {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "standardsUpdates"));
  const custom = ((row?.value as { items?: Update[] })?.items ?? []);
  res.json({ updates: [...custom, ...STANDARD_UPDATES].sort((a, b) => b.date.localeCompare(a.date)) });
}));
r.put("/learn/updates", h(async (req, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Administrators only." });
  const body = parse(z.object({ items: z.array(z.object({ date: z.string().regex(/^\d{4}(-\d{2})?$/), standard: z.string().max(80), title: z.string().max(200), note: z.string().max(600).default(""), link: z.string().max(300).default("") })).max(200) }), req.body, res); if (!body) return;
  await db.insert(schema.settings).values({ key: "standardsUpdates", value: body }).onDuplicateKeyUpdate({ set: { value: body } });
  res.json({ ok: true });
}));

// ---------- AI interview coach ----------
r.post("/learn/interview", h(async (req, res) => {
  const body = parse(z.object({ role: z.string().max(80), level: z.enum(["Junior", "Mid", "Senior"]).default("Mid"), transcript: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(6000) })).max(30) }), req.body, res); if (!body) return;
  const system = `You are an interviewer for a ${body.level} ${body.role} position in BIM / ISO 19650 information management. Run a realistic interview: ask ONE question at a time (technical, process and scenario questions; adapt to the candidate's answers). After each candidate answer, give brief feedback first in the form "**Feedback:** … **Score:** n/5", then ask the next question. After 6 questions, stop asking and give a final summary: strengths, gaps, an overall score out of 5, and three things to study. Be encouraging but honest. British English.`;
  const messages = body.transcript.length ? body.transcript : [{ role: "user" as const, content: "I'm ready to start the interview." }];
  const { text } = await ask({ system, messages, maxTokens: 2000, effort: "low" });
  res.json({ reply: text });
}));

export default r;
