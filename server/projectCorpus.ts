import { eq } from "drizzle-orm";
import { useByCode } from "../shared/data/infoUses";
import { templateById } from "../shared/data/templates";
import { db, schema } from "./db";

// Turns a project's records into short, citable text sources for the AI assistant.
import type { Source } from "../shared/retrieval";
export type { Source };

const flat = (v: unknown): string => (Array.isArray(v) ? v.map((r) => (Array.isArray(r) ? r.join(" | ") : String(r))).join("\n") : v == null ? "" : String(v));

export async function projectSources(pid: string): Promise<Source[]> {
  const [[project], docs, dels, teams, milestones, issues, risks, reviews, meetings, reqs] = await Promise.all([
    db.select().from(schema.projects).where(eq(schema.projects.id, pid)),
    db.select().from(schema.documents).where(eq(schema.documents.projectId, pid)),
    db.select().from(schema.deliverables).where(eq(schema.deliverables.projectId, pid)),
    db.select().from(schema.taskTeams).where(eq(schema.taskTeams.projectId, pid)),
    db.select().from(schema.milestones).where(eq(schema.milestones.projectId, pid)),
    db.select().from(schema.issues).where(eq(schema.issues.projectId, pid)),
    db.select().from(schema.risks).where(eq(schema.risks.projectId, pid)),
    db.select().from(schema.modelReviews).where(eq(schema.modelReviews.projectId, pid)),
    db.select().from(schema.meetings).where(eq(schema.meetings.projectId, pid)),
    db.select().from(schema.requirements).where(eq(schema.requirements.projectId, pid)),
  ]);
  const team = new Map(teams.map((t) => [t.id, t.name]));
  const ms = new Map(milestones.map((m) => [m.id, `${m.name} (${m.date})`]));
  const P = `/projects/${pid}`;
  const out: Source[] = [{
    kind: "project", title: `Project ${project.code} — ${project.name}`, link: `${P}/overview`,
    text: [`Appointing party: ${project.appointingParty}`, `Location: ${project.location}`, `Stage: ${project.stage}`, `Description: ${project.description ?? ""}`,
      `Task teams: ${teams.map((t) => `${t.name} (${t.originatorCode})`).join(", ")}`, `Milestones: ${milestones.map((m) => `${m.name} ${m.date}`).join(", ")}`,
      `Information uses: ${(project.infoUses ?? []).map((u) => `${u.code} ${useByCode(u.code)?.name ?? ""} [${u.priority}]`).join(", ")}`].join("\n"),
  }];
  for (const d of docs) {
    const t = templateById(d.templateId);
    const values = d.values as Record<string, unknown>;
    // one source per section keeps sources small enough to cite precisely
    for (const s of t?.sections ?? []) {
      const body = s.fields.map((f) => { const v = flat(values[f.id]); return v ? `${f.label}: ${v}` : ""; }).filter(Boolean).join("\n");
      if (body) out.push({ kind: "document", title: `${d.title} (${d.containerName}, ${d.revision} ${d.state}) — ${s.title}`, link: `${P}/documents/${d.id}`, text: body.slice(0, 4000) });
    }
  }
  for (const d of dels) out.push({ kind: "container", title: `MIDP container ${d.containerName || d.title}`, link: `${P}/delivery/plan`,
    text: `${d.title}; task team ${team.get(d.taskTeamId) ?? ""}; milestone ${ms.get(d.milestoneId ?? "") ?? "—"}; due ${d.dueDate}; actual ${d.actualDate || "—"}; status ${d.status}; LOIN ${d.loin}; formats ${(d.formats ?? []).join(", ")}` });
  for (const i of issues) out.push({ kind: "issue", title: `Issue #${i.number}: ${i.title}`, link: `${P}/coordination/issues`, text: `${i.type}, ${i.status}, priority ${i.priority}, due ${i.dueDate}. ${i.description ?? ""}`.slice(0, 2000) });
  for (const r of risks) out.push({ kind: "risk", title: `Risk R${String(r.number).padStart(2, "0")}: ${r.title}`, link: `${P}/delivery/risks`, text: `Score ${r.likelihood * r.impact} (L${r.likelihood}×I${r.impact}), ${r.status}. Cause: ${r.cause}. Mitigation: ${r.mitigation}` });
  for (const rv of reviews) out.push({ kind: "review", title: `Model review QA-${String(rv.number).padStart(3, "0")}: ${rv.title}`, link: `${P}/reviews/${rv.id}`,
    text: `${rv.discipline}, ${rv.status}, grade ${rv.grade}, score ${rv.score}%. ${Object.entries(rv.results).filter(([, x]) => ["C", "D"].includes(x.grade)).map(([k, x]) => `${k} ${x.grade}: ${x.comment}`).join("; ")}` });
  for (const m of meetings) out.push({ kind: "meeting", title: `Meeting #${m.number}: ${m.title} (${m.date})`, link: `${P}/meetings/${m.id}`,
    text: [...m.agenda.filter((a) => a.minutes).map((a) => `${a.item}: ${a.minutes}`), ...m.actions.map((a) => `Action (${a.status}, due ${a.due}): ${a.text}`)].join("\n").slice(0, 4000) });
  for (const r of reqs) out.push({ kind: "requirement", title: `Requirement ${r.ref}`, link: `${P}/traceability`, text: `${r.text} (source: ${r.source}; BEP response: ${r.response || "none"})` });
  return out;
}

export { pickSources } from "../shared/retrieval";
