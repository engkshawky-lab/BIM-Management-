import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { Router } from "express";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { templateById } from "../../shared/data/templates";
import { logActivity, requireProject } from "../access";
import { ask, parseJson } from "../claude";
import { db, newId, schema } from "../db";
import { UPLOAD_DIR } from "../storage";
import { h, parse, sentKeys } from "./auth";

// AI clash triage and the research notebook.
const r = Router();
const P = "/projects/:projectId";

// ---------- clash triage ----------
r.post(P + "/issues/ai-triage", requireProject("editor"), h(async (req, res) => {
  const pid = req.params.projectId;
  const [issues, teams] = await Promise.all([
    db.select().from(schema.issues).where(and(eq(schema.issues.projectId, pid), eq(schema.issues.type, "Clash"), ne(schema.issues.status, "Closed"))).orderBy(asc(schema.issues.number)),
    db.select().from(schema.taskTeams).where(eq(schema.taskTeams.projectId, pid)),
  ]);
  if (!issues.length) return res.status(400).json({ error: "No open clash issues to triage. Import a clash report first." });
  const list = issues.slice(0, 80).map((i) => ({ number: i.number, title: i.title, description: (i.description ?? "").slice(0, 600), labels: i.labels, elements: i.elementGuids.length }));
  const system = "You are a BIM coordinator triaging clash detection results. Be practical: hard clashes on primary structure and large services first; insulation, tolerance-level and duplicate clashes are often false positives. Return JSON only.";
  const user = `Task teams: ${teams.map((t) => t.name).join(", ") || "none defined"}.
For each clash issue, suggest: priority (Low|Normal|High|Critical), responsible task team (one of the task teams, or "" if unclear), a one-sentence action, and whether it is likely a false positive.
Return {"items":[{"number":1,"priority":"High","team":"MEP","action":"…","falsePositive":false,"reason":"…"}]}

Clashes:
${JSON.stringify(list)}`;
  const { text } = await ask({ system, messages: [{ role: "user", content: user }], maxTokens: 12000 });
  let parsed: { items?: { number: number; priority: string; team: string; action: string; falsePositive: boolean; reason: string }[] };
  try { parsed = parseJson(text); } catch { return res.status(502).json({ error: "The AI response could not be read. Try again." }); }
  const nums = new Set(list.map((x) => x.number));
  res.json({ items: (parsed.items ?? []).filter((x) => nums.has(Number(x.number))).map((x) => ({
    number: Number(x.number), priority: ["Low", "Normal", "High", "Critical"].includes(x.priority) ? x.priority : "Normal",
    taskTeamId: teams.find((t) => t.name.toLowerCase() === String(x.team ?? "").toLowerCase())?.id ?? null, team: String(x.team ?? ""),
    action: String(x.action ?? "").slice(0, 500), falsePositive: !!x.falsePositive, reason: String(x.reason ?? "").slice(0, 500),
  })) });
}));

r.post(P + "/issues/ai-triage/apply", requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ items: z.array(z.object({ number: z.number().int(), priority: z.enum(["Low", "Normal", "High", "Critical"]), taskTeamId: z.string().nullable(), action: z.string().max(500), falsePositive: z.boolean() })).max(200) }), req.body, res); if (!body) return;
  const pid = req.params.projectId; const uid = req.user!.id;
  const issues = await db.select().from(schema.issues).where(and(eq(schema.issues.projectId, pid), inArray(schema.issues.number, body.items.map((x) => x.number))));
  for (const it of body.items) {
    const i = issues.find((x) => x.number === it.number); if (!i) continue;
    await db.update(schema.issues).set({ priority: it.priority, ...(it.taskTeamId ? { taskTeamId: it.taskTeamId } : {}), ...(it.falsePositive ? { labels: [...new Set([...i.labels, "possible-false-positive"])] } : {}), updatedAt: new Date() }).where(eq(schema.issues.id, i.id));
    await db.insert(schema.comments).values({ id: newId(), projectId: pid, issueId: i.id, userId: uid, body: `AI triage (accepted by reviewer): ${it.action}${it.falsePositive ? " — flagged as a possible false positive." : ""}`, createdAt: new Date() });
  }
  await logActivity(pid, uid, "issue.triaged", `Applied AI triage to ${body.items.length} clash issues`, `/projects/${pid}/coordination/issues`);
  res.json({ updated: body.items.length });
}));

// ---------- research notebook ----------
const N = P + "/notebooks";
const load = async (pid: string, id: string) => (await db.select().from(schema.notebooks).where(and(eq(schema.notebooks.id, id), eq(schema.notebooks.projectId, pid))))[0];

r.get(N, requireProject(), h(async (req, res) => {
  const rows = await db.select().from(schema.notebooks).where(eq(schema.notebooks.projectId, req.params.projectId)).orderBy(asc(schema.notebooks.createdAt));
  res.json({ notebooks: rows.map((n) => ({ id: n.id, title: n.title, sources: n.sources.length, notes: n.notes.length, updatedAt: n.updatedAt })) });
}));
r.get(N + "/:id", requireProject(), h(async (req, res) => {
  const n = await load(req.params.projectId, req.params.id); if (!n) return res.status(404).json({ error: "Notebook not found." });
  res.json({ notebook: { ...n, sources: n.sources.map(({ text, ...s }) => ({ ...s, chars: text?.length ?? 0 })) } });
}));
r.post(N, requireProject("editor"), h(async (req, res) => {
  const body = parse(z.object({ title: z.string().trim().min(1).max(200) }), req.body, res); if (!body) return;
  const id = newId(); const now = new Date();
  await db.insert(schema.notebooks).values({ id, projectId: req.params.projectId, title: body.title, sources: [], notes: [], createdBy: req.user!.id, createdAt: now, updatedAt: now });
  res.status(201).json({ id });
}));
r.put(N + "/:id", requireProject("editor"), h(async (req, res) => {
  const parsed = parse(z.object({
    title: z.string().trim().min(1).max(200),
    addSource: z.object({ kind: z.enum(["text", "document", "file"]), name: z.string().max(200), text: z.string().max(200_000).optional(), refId: z.string().max(36).optional() }),
    removeSource: z.string(), removeNote: z.string(),
  }).partial(), req.body, res); if (!parsed) return;
  const body = sentKeys(parsed, req.body);
  const n = await load(req.params.projectId, req.params.id); if (!n) return res.status(404).json({ error: "Notebook not found." });
  let sources = n.sources, notes = n.notes;
  if (body.addSource) {
    if (n.sources.length >= 20) return res.status(400).json({ error: "A notebook holds up to 20 sources." });
    sources = [...sources, { id: newId(), ...body.addSource }];
  }
  if (body.removeSource) sources = sources.filter((s) => s.id !== body.removeSource);
  if (body.removeNote) notes = notes.filter((x) => x.id !== body.removeNote);
  await db.update(schema.notebooks).set({ ...(body.title ? { title: body.title } : {}), sources, notes, updatedAt: new Date() }).where(eq(schema.notebooks.id, n.id));
  res.json({ ok: true });
}));
r.delete(N + "/:id", requireProject("editor"), h(async (req, res) => {
  await db.delete(schema.notebooks).where(and(eq(schema.notebooks.id, req.params.id), eq(schema.notebooks.projectId, req.params.projectId)));
  res.json({ ok: true });
}));

/** Resolve sources into content blocks: text inline, project documents flattened, PDFs as document blocks. */
async function sourceBlocks(pid: string, sources: typeof schema.notebooks.$inferSelect["sources"]) {
  const blocks: unknown[] = [];
  for (const [i, s] of sources.entries()) {
    const label = `[N${i + 1}] ${s.name}`;
    if (s.kind === "text") blocks.push({ type: "text", text: `${label}\n${s.text ?? ""}` });
    else if (s.kind === "document") {
      const [d] = await db.select().from(schema.documents).where(and(eq(schema.documents.id, s.refId ?? ""), eq(schema.documents.projectId, pid)));
      if (!d) continue;
      const t = templateById(d.templateId);
      const v = d.values as Record<string, unknown>;
      const body = (t?.sections ?? []).map((sec) => `## ${sec.title}\n${sec.fields.map((f) => { const x = v[f.id]; const txt = Array.isArray(x) ? x.map((r) => (Array.isArray(r) ? r.join(" | ") : r)).join("\n") : String(x ?? ""); return txt ? `${f.label}: ${txt}` : ""; }).filter(Boolean).join("\n")}`).join("\n");
      blocks.push({ type: "text", text: `${label} (${d.containerName} ${d.revision})\n${body}` });
    } else if (s.kind === "file") {
      const [f] = await db.select().from(schema.files).where(and(eq(schema.files.id, s.refId ?? ""), eq(schema.files.projectId, pid)));
      if (!f) continue;
      const [ver] = await db.select().from(schema.fileVersions).where(and(eq(schema.fileVersions.fileId, f.id), eq(schema.fileVersions.version, f.currentVersion)));
      if (!ver) continue;
      const buf = await fs.promises.readFile(path.join(UPLOAD_DIR, ver.storageKey));
      if (ver.mimeType === "application/pdf") { blocks.push({ type: "text", text: label }); blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") } }); }
      else blocks.push({ type: "text", text: `${label}\n${buf.toString("utf8").slice(0, 200_000)}` });
    }
  }
  return blocks;
}

r.post(N + "/:id/ask", requireProject(), h(async (req, res) => {
  const body = parse(z.object({ question: z.string().trim().min(3).max(4000), save: z.boolean().default(true) }), req.body, res); if (!body) return;
  const pid = req.params.projectId;
  const n = await load(pid, req.params.id); if (!n) return res.status(404).json({ error: "Notebook not found." });
  if (!n.sources.length) return res.status(400).json({ error: "Add at least one source first." });
  const system = "You are a research assistant for a construction information manager. Answer only from the numbered notebook sources; cite them inline as [N1], [N2]. When sources disagree, say so and compare them. If the sources do not contain the answer, say what is missing. Use Markdown with short sections and tables where they help. British English.";
  const content = [...await sourceBlocks(pid, n.sources), { type: "text", text: `Question: ${body.question}` }];
  const { text } = await ask({ system, messages: [{ role: "user", content: content as never }], maxTokens: 12000, effort: "high" });
  if (body.save) {
    await db.update(schema.notebooks).set({ notes: [...n.notes, { id: newId(), question: body.question, answer: text, at: new Date().toISOString() }], updatedAt: new Date() }).where(eq(schema.notebooks.id, n.id));
  }
  res.json({ answer: text });
}));

export default r;
