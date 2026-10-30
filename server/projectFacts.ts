import { and, desc, eq, gte, inArray, max, ne } from "drizzle-orm";
import { buildProjectFacts, isoDay, lastMonday, type ProjectFacts, type RawFactsInput } from "../shared/projectFacts";
import { db, schema } from "./db";

// Live operational facts for the Project Agent. Only compact columns are read (no document bodies or JSON reports);
// the pure builder in shared/projectFacts.ts sorts, groups and bounds the lists.
export type { ProjectFacts } from "../shared/projectFacts";
export { briefingMarkdown, factLines, factsToContext } from "../shared/projectFacts";

const ROW_CAP = 2000;

export async function projectFacts(pid: string, opts: { since?: Date; today?: Date } = {}): Promise<ProjectFacts> {
  const now = opts.today ?? new Date();
  const today = isoDay(now);
  const since = opts.since ? isoDay(opts.since) : lastMonday(now);
  const sinceDate = new Date(`${since}T00:00:00.000Z`);
  const S = schema;

  const [[project], teams, milestones, deliverables, documents, files, changedRevs, fileVersions, activity, issues, modelReviews, meetings, members, lastActive] = await Promise.all([
    db.select({ id: S.projects.id, code: S.projects.code, name: S.projects.name, stage: S.projects.stage }).from(S.projects).where(eq(S.projects.id, pid)),
    db.select({ id: S.taskTeams.id, name: S.taskTeams.name, originatorCode: S.taskTeams.originatorCode, leadUserId: S.taskTeams.leadUserId }).from(S.taskTeams).where(eq(S.taskTeams.projectId, pid)),
    db.select({ id: S.milestones.id, name: S.milestones.name, date: S.milestones.date }).from(S.milestones).where(eq(S.milestones.projectId, pid)),
    db.select({
      id: S.deliverables.id, taskTeamId: S.deliverables.taskTeamId, containerName: S.deliverables.containerName, title: S.deliverables.title,
      milestoneId: S.deliverables.milestoneId, dueDate: S.deliverables.dueDate, status: S.deliverables.status, assigneeId: S.deliverables.assigneeId,
      documentId: S.deliverables.documentId, fileId: S.deliverables.fileId, actualDate: S.deliverables.actualDate,
    }).from(S.deliverables).where(eq(S.deliverables.projectId, pid)).limit(ROW_CAP),
    db.select({
      id: S.documents.id, title: S.documents.title, containerName: S.documents.containerName, revision: S.documents.revision, state: S.documents.state,
      suitability: S.documents.suitability, reviewStatus: S.documents.reviewStatus, reviewerId: S.documents.reviewerId, authorId: S.documents.authorId, updatedAt: S.documents.updatedAt,
    }).from(S.documents).where(eq(S.documents.projectId, pid)).limit(ROW_CAP),
    db.select({
      id: S.files.id, name: S.files.name, containerName: S.files.containerName, state: S.files.state, suitability: S.files.suitability,
      revision: S.files.revision, documentId: S.files.documentId, uploadedBy: S.files.uploadedBy, updatedAt: S.files.updatedAt,
    }).from(S.files).where(eq(S.files.projectId, pid)).limit(ROW_CAP),
    db.select({ documentId: S.documentRevisions.documentId }).from(S.documentRevisions)
      .innerJoin(S.documents, eq(S.documents.id, S.documentRevisions.documentId))
      .where(and(eq(S.documents.projectId, pid), gte(S.documentRevisions.createdAt, sinceDate))).orderBy(desc(S.documentRevisions.createdAt)).limit(200),
    db.select({ fileId: S.fileVersions.fileId, version: S.fileVersions.version, note: S.fileVersions.note, uploadedBy: S.fileVersions.uploadedBy, createdAt: S.fileVersions.createdAt })
      .from(S.fileVersions).innerJoin(S.files, eq(S.files.id, S.fileVersions.fileId))
      .where(and(eq(S.files.projectId, pid), gte(S.fileVersions.createdAt, sinceDate))).orderBy(desc(S.fileVersions.createdAt)).limit(200),
    db.select({ userId: S.activity.userId, action: S.activity.action, summary: S.activity.summary, link: S.activity.link, createdAt: S.activity.createdAt })
      .from(S.activity).where(and(eq(S.activity.projectId, pid), gte(S.activity.createdAt, sinceDate))).orderBy(desc(S.activity.createdAt)).limit(200),
    db.select({
      id: S.issues.id, number: S.issues.number, title: S.issues.title, type: S.issues.type, status: S.issues.status, priority: S.issues.priority,
      taskTeamId: S.issues.taskTeamId, assigneeId: S.issues.assigneeId, dueDate: S.issues.dueDate, createdAt: S.issues.createdAt, updatedAt: S.issues.updatedAt,
    }).from(S.issues).where(and(eq(S.issues.projectId, pid), ne(S.issues.status, "Closed"))).limit(ROW_CAP),
    db.select({
      id: S.modelReviews.id, number: S.modelReviews.number, title: S.modelReviews.title, discipline: S.modelReviews.discipline, taskTeamId: S.modelReviews.taskTeamId,
      reviewerId: S.modelReviews.reviewerId, status: S.modelReviews.status, updatedAt: S.modelReviews.updatedAt,
    }).from(S.modelReviews).where(and(eq(S.modelReviews.projectId, pid), ne(S.modelReviews.status, "Completed"))).limit(500),
    db.select({ id: S.meetings.id, number: S.meetings.number, title: S.meetings.title, type: S.meetings.type, date: S.meetings.date, status: S.meetings.status, actions: S.meetings.actions })
      .from(S.meetings).where(eq(S.meetings.projectId, pid)).orderBy(desc(S.meetings.number)).limit(200),
    db.select({ userId: S.projectMembers.userId, role: S.projectMembers.role, name: S.users.name, organization: S.users.organization })
      .from(S.projectMembers).innerJoin(S.users, eq(S.users.id, S.projectMembers.userId)).where(eq(S.projectMembers.projectId, pid)),
    db.select({ userId: S.activity.userId, last: max(S.activity.createdAt) }).from(S.activity).where(eq(S.activity.projectId, pid)).groupBy(S.activity.userId),
  ]);
  if (!project) throw new Error("Project not found.");

  // every revision of the documents that changed, so the builder can show "from → to"
  const changedIds = [...new Set(changedRevs.map((r) => r.documentId))];
  const revisions = changedIds.length
    ? await db.select({
      documentId: S.documentRevisions.documentId, revision: S.documentRevisions.revision, state: S.documentRevisions.state, suitability: S.documentRevisions.suitability,
      note: S.documentRevisions.note, authorId: S.documentRevisions.authorId, createdAt: S.documentRevisions.createdAt,
    }).from(S.documentRevisions).where(inArray(S.documentRevisions.documentId, changedIds)).limit(ROW_CAP)
    : [];

  // names for people referenced who are not current members
  const memberIds = new Set(members.map((m) => m.userId));
  const refs = new Set<string>();
  const note = (id: string | null | undefined) => { if (id && !memberIds.has(id)) refs.add(id); };
  teams.forEach((t) => note(t.leadUserId)); deliverables.forEach((d) => note(d.assigneeId));
  documents.forEach((d) => { note(d.authorId); note(d.reviewerId); }); revisions.forEach((r) => note(r.authorId));
  fileVersions.forEach((v) => note(v.uploadedBy)); activity.forEach((a) => note(a.userId)); issues.forEach((i) => note(i.assigneeId));
  modelReviews.forEach((r) => note(r.reviewerId)); meetings.forEach((m) => m.actions.forEach((a) => note(a.ownerId)));
  const others = refs.size ? await db.select({ id: S.users.id, name: S.users.name }).from(S.users).where(inArray(S.users.id, [...refs].slice(0, 500))) : [];

  const last = new Map(lastActive.map((x) => [x.userId, x.last]));
  const raw: RawFactsInput = {
    project, teams, milestones, deliverables, documents, files, revisions, fileVersions, activity, issues, modelReviews, meetings,
    members: members.map((m) => ({ ...m, lastActive: last.get(m.userId) ?? null })),
    userNames: Object.fromEntries(others.map((u) => [u.id, u.name])),
  };
  return buildProjectFacts(raw, { today, since, generatedAt: now.toISOString() });
}
