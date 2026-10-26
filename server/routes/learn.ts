import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { QUESTIONS } from "../../shared/data/learn";
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

export default r;
