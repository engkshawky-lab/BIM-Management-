import { and, asc, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { logActivity, requireProject } from "../access";
import { AGENT_KINDS, runAgent, snapshotProject, type AgentKind } from "../agents";
import { db, newId, schema } from "../db";
import { h, parse } from "./auth";

const r = Router();
const P = "/projects/:projectId";
const kinds = Object.keys(AGENT_KINDS) as AgentKind[];

r.get(P + "/agents", requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  const [agents, runs] = await Promise.all([
    db.select().from(schema.agents).where(eq(schema.agents.projectId, pid)),
    db.select().from(schema.agentRuns).where(eq(schema.agentRuns.projectId, pid)).orderBy(desc(schema.agentRuns.startedAt)).limit(50),
  ]);
  res.json({ agents: kinds.map((k) => ({ kind: k, ...AGENT_KINDS[k], config: agents.find((a) => a.kind === k) ?? null })), runs: runs.map((x) => ({ ...x, kind: agents.find((a) => a.id === x.agentId)?.kind })) });
}));

async function ensure(pid: string, kind: AgentKind, uid: string) {
  const [a] = await db.select().from(schema.agents).where(and(eq(schema.agents.projectId, pid), eq(schema.agents.kind, kind)));
  if (a) return a;
  const row = { id: newId(), projectId: pid, kind, enabled: false, frequency: "weekly", createdBy: uid, createdAt: new Date() };
  await db.insert(schema.agents).values(row);
  return { ...row, lastRunAt: null };
}

r.put(P + "/agents/:kind", requireProject("manager"), h(async (req, res) => {
  const kind = req.params.kind as AgentKind; if (!kinds.includes(kind)) return res.status(404).json({ error: "Unknown automation." });
  const body = parse(z.object({ enabled: z.boolean(), frequency: z.enum(["daily", "weekly"]) }), req.body, res); if (!body) return;
  const a = await ensure(req.params.projectId, kind, req.user!.id);
  await db.update(schema.agents).set(body).where(eq(schema.agents.id, a.id));
  await logActivity(req.params.projectId, req.user!.id, "agent.updated", `${body.enabled ? "Enabled" : "Disabled"} automation "${AGENT_KINDS[kind].label}" (${body.frequency})`, `/projects/${req.params.projectId}/automations`);
  res.json({ ok: true });
}));

r.post(P + "/agents/:kind/run", requireProject("manager"), h(async (req, res) => {
  const kind = req.params.kind as AgentKind; if (!kinds.includes(kind)) return res.status(404).json({ error: "Unknown automation." });
  const a = await ensure(req.params.projectId, kind, req.user!.id);
  res.json(await runAgent(a, "manual"));
}));

r.get(P + "/trends", requireProject(), h(async (req, res) => {
  const pid = req.params.projectId;
  const day = new Date().toISOString().slice(0, 10);
  const [last] = await db.select({ day: schema.qualitySnapshots.day }).from(schema.qualitySnapshots).where(eq(schema.qualitySnapshots.projectId, pid)).orderBy(desc(schema.qualitySnapshots.day)).limit(1);
  if (last?.day !== day) await snapshotProject(pid);
  res.json({ snapshots: await db.select().from(schema.qualitySnapshots).where(eq(schema.qualitySnapshots.projectId, pid)).orderBy(asc(schema.qualitySnapshots.day)).limit(365) });
}));

export default r;
