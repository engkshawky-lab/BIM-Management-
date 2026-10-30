// Operational project facts for the Project Agent: compact, bounded lists built from live project records
// (MIDP/TIDP containers, CDE documents and files, issues, reviews, milestones, meetings, members).
// Everything here is pure so it can be unit-tested; server/projectFacts.ts only runs the queries.

export const LIST_LIMIT = 50;
export const CONTEXT_LIMIT = 40_000;
/** Members with no project activity for this many days (or since `since`, whichever is earlier) count as inactive. */
export const INACTIVE_DAYS = 14;

type When = Date | string | null | undefined;

// ---------------------------------------------------------------- raw input (rows as the queries return them)

export interface RawFactsInput {
  project: { id: string; code: string; name: string; stage: string };
  teams: { id: string; name: string; originatorCode: string; leadUserId: string | null }[];
  milestones: { id: string; name: string; date: string }[];
  deliverables: {
    id: string; taskTeamId: string; containerName: string; title: string; milestoneId: string | null; dueDate: string; status: string;
    assigneeId: string | null; documentId: string | null; fileId: string | null; actualDate: string;
  }[];
  documents: {
    id: string; title: string; containerName: string; revision: string; state: string; suitability: string;
    reviewStatus: string; reviewerId: string | null; authorId: string; updatedAt: When;
  }[];
  files: { id: string; name: string; containerName: string; state: string; suitability: string; revision: string; documentId: string | null; uploadedBy: string; updatedAt: When }[];
  /** All revisions of documents that changed in the period (older ones give the "from" side). */
  revisions: { documentId: string; revision: string; state: string; suitability: string; note: string; authorId: string; createdAt: When }[];
  /** File versions uploaded in the period. */
  fileVersions: { fileId: string; version: number; note: string; uploadedBy: string; createdAt: When }[];
  /** Activity in the period, newest first. */
  activity: { userId: string; action: string; summary: string; link: string; createdAt: When }[];
  /** Issues that are not closed. */
  issues: {
    id: string; number: number; title: string; type: string; status: string; priority: string; taskTeamId: string | null;
    assigneeId: string | null; dueDate: string; createdAt: When; updatedAt: When;
  }[];
  /** Model (QA) reviews not yet completed. */
  modelReviews: { id: string; number: number; title: string; discipline: string; taskTeamId: string | null; reviewerId: string; status: string; updatedAt: When }[];
  meetings: { id: string; number: number; title: string; type: string; date: string; status: string; actions: { id: string; text: string; ownerId: string; due: string; status: string }[] }[];
  members: { userId: string; name: string; role: string; organization: string; lastActive: When }[];
  /** user id -> display name, for authors/assignees who are not (or no longer) members. */
  userNames: Record<string, string>;
}

// ---------------------------------------------------------------- facts (the JSON the client and the AI see)

export interface ContainerFact {
  id: string; container: string; title: string; team: string; teamId: string; assignee: string; milestone: string;
  dueDate: string; status: string; state: string; suitability: string; daysLate: number; daysToDue: number; link: string;
}
export interface TeamFact { teamId: string; team: string; lead: string; total: number; done: number; overdue: number; dueThisWeek: number; openIssues: number; link: string }
export interface StatusFact { code: string; state: string; suitability: string; documents: number; files: number }
export interface ChangeFact { kind: "revision" | "file-version" | "edit"; title: string; container: string; by: string; when: string; from: string; to: string; note: string; link: string }
export interface ActivityFact { by: string; action: string; summary: string; when: string; link: string }
export interface IssueFact { id: string; number: number; title: string; type: string; status: string; priority: string; team: string; assignee: string; dueDate: string; ageDays: number; overdue: boolean; link: string }
export interface IssueTeamFact { team: string; open: number; clash: number; critical: number; high: number; overdue: number }
export interface ReviewFact { kind: "review-requested" | "shared-for-review" | "model-review"; title: string; container: string; suitability: string; reviewer: string; since: string; daysWaiting: number; link: string }
export interface MilestoneFact { id: string; name: string; date: string; daysTo: number; containers: number; outstanding: number; link: string }
export interface ActionFact { text: string; owner: string; due: string; status: string; overdue: boolean; meeting: string; link: string }
export interface MeetingFact { title: string; type: string; date: string; status: string; link: string }
export interface MemberFact { name: string; role: string; organization: string; lastActive: string; link: string }
export interface Listed<T> { total: number; items: T[] }

export interface ProjectFacts {
  project: { id: string; code: string; name: string; stage: string };
  today: string; weekEnd: string; since: string; generatedAt: string;
  totals: {
    containers: number; done: number; inProgress: number; planned: number; overdue: number; dueThisWeek: number;
    documents: number; files: number; openIssues: number; criticalIssues: number; awaitingReview: number; openActions: number; changes: number;
  };
  overdue: Listed<ContainerFact>;
  dueThisWeek: Listed<ContainerFact>;
  teams: TeamFact[];
  lateAssignees: { name: string; overdue: number }[];
  byStatus: StatusFact[];
  awaitingReview: Listed<ReviewFact>;
  changes: Listed<ChangeFact>;
  activity: Listed<ActivityFact>;
  issues: Listed<IssueFact>;
  issuesByTeam: IssueTeamFact[];
  issuesByPriority: Record<string, number>;
  issuesByType: Record<string, number>;
  milestones: MilestoneFact[];
  actions: Listed<ActionFact>;
  meetings: MeetingFact[];
  inactiveMembers: Listed<MemberFact>;
}

// ---------------------------------------------------------------- date helpers

const DAY = 864e5;
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const toIso = (w: When) => (w == null || w === "" ? "" : typeof w === "string" ? (isNaN(Date.parse(w)) ? w : new Date(w).toISOString()) : w.toISOString());
const dayOf = (w: When) => toIso(w).slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / DAY);
export const addDays = (day: string, n: number) => isoDay(new Date(Date.parse(day) + n * DAY));

/** The most recent Monday before `today` (a week ago when today is a Monday). */
export function lastMonday(today: Date = new Date()): string {
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const back = ((d.getUTCDay() + 6) % 7) || 7;
  return isoDay(new Date(d.getTime() - back * DAY));
}

const DONE = new Set(["shared", "published"]);
const PRIORITY_RANK: Record<string, number> = { Critical: 0, High: 1, Normal: 2, Low: 3 };
const STATE_ORDER = ["WIP", "SHARED", "PUBLISHED", "ARCHIVED"];
const listed = <T>(all: T[], limit = LIST_LIMIT): Listed<T> => ({ total: all.length, items: all.slice(0, limit) });

// ---------------------------------------------------------------- builder

export function buildProjectFacts(raw: RawFactsInput, opts: { today: string; since: string; generatedAt?: string }): ProjectFacts {
  const { today, since } = opts;
  const weekEnd = addDays(today, 6);
  const P = `/projects/${raw.project.id}`;
  const names = new Map<string, string>(Object.entries(raw.userNames));
  for (const m of raw.members) names.set(m.userId, m.name);
  const who = (id: string | null | undefined) => (id ? names.get(id) ?? "Unknown user" : "");
  const team = new Map(raw.teams.map((t) => [t.id, t]));
  const teamName = (id: string | null | undefined) => (id ? team.get(id)?.name ?? "Unassigned" : "Unassigned");
  const ms = new Map(raw.milestones.map((m) => [m.id, m]));
  const docs = new Map(raw.documents.map((d) => [d.id, d]));
  const files = new Map(raw.files.map((f) => [f.id, f]));

  // ---- containers (MIDP / TIDP deliverables)
  const container = (d: RawFactsInput["deliverables"][number]): ContainerFact => {
    const doc = d.documentId ? docs.get(d.documentId) : undefined;
    const file = d.fileId ? files.get(d.fileId) : undefined;
    return {
      id: d.id, container: d.containerName || d.title, title: d.title, team: teamName(d.taskTeamId), teamId: d.taskTeamId, assignee: who(d.assigneeId),
      milestone: d.milestoneId ? ms.get(d.milestoneId)?.name ?? "" : "", dueDate: d.dueDate, status: d.status,
      state: doc?.state ?? file?.state ?? "", suitability: doc?.suitability ?? file?.suitability ?? "",
      daysLate: d.dueDate && d.dueDate < today ? daysBetween(d.dueDate, today) : 0,
      daysToDue: d.dueDate ? daysBetween(today, d.dueDate) : 0,
      link: doc ? `${P}/documents/${doc.id}` : `${P}/delivery/plan`,
    };
  };
  const open = raw.deliverables.filter((d) => !DONE.has(d.status));
  const overdueAll = open.filter((d) => d.dueDate && d.dueDate < today).map(container)
    .sort((a, b) => b.daysLate - a.daysLate || a.container.localeCompare(b.container));
  const weekAll = open.filter((d) => d.dueDate && d.dueDate >= today && d.dueDate <= weekEnd).map(container)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.container.localeCompare(b.container));

  // ---- issues
  const issueFact = (i: RawFactsInput["issues"][number]): IssueFact => ({
    id: i.id, number: i.number, title: i.title, type: i.type, status: i.status, priority: i.priority, team: teamName(i.taskTeamId), assignee: who(i.assigneeId),
    dueDate: i.dueDate, ageDays: Math.max(0, daysBetween(dayOf(i.createdAt) || today, today)), overdue: !!i.dueDate && i.dueDate < today, link: `${P}/coordination/issues`,
  });
  const openIssues = raw.issues.filter((i) => i.status !== "Closed").map(issueFact)
    .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) || Number(b.overdue) - Number(a.overdue) || b.ageDays - a.ageDays || a.number - b.number);
  const issueTeams = new Map<string, IssueTeamFact>();
  for (const i of openIssues) {
    const x = issueTeams.get(i.team) ?? { team: i.team, open: 0, clash: 0, critical: 0, high: 0, overdue: 0 };
    x.open++; if (i.type === "Clash") x.clash++; if (i.priority === "Critical") x.critical++; if (i.priority === "High") x.high++; if (i.overdue) x.overdue++;
    issueTeams.set(i.team, x);
  }
  const countBy = (xs: string[]) => xs.reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});

  // ---- TIDP status by task team
  const teams: TeamFact[] = raw.teams.map((t) => {
    const mine = raw.deliverables.filter((d) => d.taskTeamId === t.id);
    return {
      teamId: t.id, team: t.name, lead: who(t.leadUserId), total: mine.length, done: mine.filter((d) => DONE.has(d.status)).length,
      overdue: overdueAll.filter((d) => d.teamId === t.id).length, dueThisWeek: weekAll.filter((d) => d.teamId === t.id).length,
      openIssues: issueTeams.get(t.name)?.open ?? 0, link: `${P}/delivery/plan`,
    };
  }).sort((a, b) => b.overdue - a.overdue || b.dueThisWeek - a.dueThisWeek || a.team.localeCompare(b.team));
  const late = new Map<string, number>();
  for (const d of overdueAll) { const k = d.assignee || "Unassigned"; late.set(k, (late.get(k) ?? 0) + 1); }
  const lateAssignees = [...late].map(([name, overdue]) => ({ name, overdue })).sort((a, b) => b.overdue - a.overdue || a.name.localeCompare(b.name));

  // ---- containers by CDE state / suitability code
  const status = new Map<string, StatusFact>();
  const bump = (state: string, suitability: string, k: "documents" | "files") => {
    const code = `${state}/${suitability}`;
    const x = status.get(code) ?? { code, state, suitability, documents: 0, files: 0 };
    x[k]++; status.set(code, x);
  };
  raw.documents.forEach((d) => bump(d.state, d.suitability, "documents"));
  raw.files.forEach((f) => bump(f.state, f.suitability, "files"));
  const stateRank = (s: string) => { const i = STATE_ORDER.indexOf(s); return i < 0 ? 9 : i; };
  const byStatus = [...status.values()].sort((a, b) => stateRank(a.state) - stateRank(b.state) || a.suitability.localeCompare(b.suitability));

  // ---- reviews awaiting action
  const reviews: ReviewFact[] = [];
  const waiting = (w: When) => { const d = dayOf(w); return d ? Math.max(0, daysBetween(d, today)) : 0; };
  for (const d of raw.documents) {
    if (d.reviewStatus === "requested") reviews.push({ kind: "review-requested", title: d.title, container: d.containerName, suitability: d.suitability, reviewer: who(d.reviewerId), since: dayOf(d.updatedAt), daysWaiting: waiting(d.updatedAt), link: `${P}/documents/${d.id}` });
    else if (d.state === "SHARED" && (d.suitability === "S3" || d.suitability === "S4")) reviews.push({ kind: "shared-for-review", title: d.title, container: d.containerName, suitability: d.suitability, reviewer: "", since: dayOf(d.updatedAt), daysWaiting: waiting(d.updatedAt), link: `${P}/documents/${d.id}` });
  }
  const seen = new Set(reviews.map((r) => r.container).filter(Boolean));
  for (const f of raw.files) {
    if (f.state !== "SHARED" || (f.suitability !== "S3" && f.suitability !== "S4") || (f.containerName && seen.has(f.containerName))) continue;
    reviews.push({ kind: "shared-for-review", title: f.name, container: f.containerName, suitability: f.suitability, reviewer: "", since: dayOf(f.updatedAt), daysWaiting: waiting(f.updatedAt), link: `${P}/files` });
  }
  for (const r of raw.modelReviews) {
    if (r.status === "Completed") continue;
    reviews.push({ kind: "model-review", title: `QA-${String(r.number).padStart(3, "0")} ${r.title} (${r.discipline})`, container: "", suitability: "", reviewer: who(r.reviewerId), since: dayOf(r.updatedAt), daysWaiting: waiting(r.updatedAt), link: `${P}/reviews/${r.id}` });
  }
  reviews.sort((a, b) => b.daysWaiting - a.daysWaiting || a.title.localeCompare(b.title));

  // ---- changes since `since`
  const inPeriod = (w: When) => { const d = dayOf(w); return !!d && d >= since; };
  const changes: ChangeFact[] = [];
  const revs = [...raw.revisions].sort((a, b) => toIso(a.createdAt).localeCompare(toIso(b.createdAt)));
  const prevByDoc = new Map<string, RawFactsInput["revisions"][number]>();
  const revisedDocs = new Set<string>();
  for (const r of revs) {
    const prev = prevByDoc.get(r.documentId);
    prevByDoc.set(r.documentId, r);
    if (!inPeriod(r.createdAt)) continue;
    const d = docs.get(r.documentId);
    revisedDocs.add(r.documentId);
    changes.push({
      kind: "revision", title: d?.title ?? "Document", container: d?.containerName ?? "", by: who(r.authorId), when: toIso(r.createdAt),
      from: prev ? `${prev.revision} ${prev.state} ${prev.suitability}` : "", to: `${r.revision} ${r.state} ${r.suitability}`, note: r.note, link: `${P}/documents/${r.documentId}`,
    });
  }
  for (const v of raw.fileVersions) {
    if (!inPeriod(v.createdAt)) continue;
    const f = files.get(v.fileId);
    changes.push({
      kind: "file-version", title: f?.name ?? "File", container: f?.containerName ?? "", by: who(v.uploadedBy), when: toIso(v.createdAt),
      from: v.version > 1 ? `v${v.version - 1}` : "", to: `v${v.version}${f ? ` ${f.revision} ${f.state} ${f.suitability}` : ""}`, note: v.note, link: `${P}/files`,
    });
  }
  for (const d of raw.documents) {
    if (revisedDocs.has(d.id) || !inPeriod(d.updatedAt)) continue;
    changes.push({ kind: "edit", title: d.title, container: d.containerName, by: who(d.authorId), when: toIso(d.updatedAt), from: "", to: `${d.revision} ${d.state} ${d.suitability}`, note: "", link: `${P}/documents/${d.id}` });
  }
  changes.sort((a, b) => b.when.localeCompare(a.when));
  const activity = raw.activity.filter((a) => inPeriod(a.createdAt)).sort((a, b) => toIso(b.createdAt).localeCompare(toIso(a.createdAt)))
    .map((a): ActivityFact => ({ by: who(a.userId), action: a.action, summary: a.summary, when: toIso(a.createdAt), link: a.link || `${P}/activity` }));

  // ---- milestones ahead
  const milestones = raw.milestones.filter((m) => m.date && m.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10).map((m): MilestoneFact => {
    const mine = raw.deliverables.filter((d) => d.milestoneId === m.id);
    return { id: m.id, name: m.name, date: m.date, daysTo: daysBetween(today, m.date), containers: mine.length, outstanding: mine.filter((d) => !DONE.has(d.status)).length, link: `${P}/delivery/plan` };
  });

  // ---- meeting actions: only the latest meeting of each type holds the live list (open actions carry forward)
  const latest = new Map<string, RawFactsInput["meetings"][number]>();
  [...raw.meetings].sort((a, b) => a.number - b.number).forEach((m) => latest.set(m.type, m));
  const actions = [...latest.values()].flatMap((m) => m.actions.filter((a) => a.status !== "Done").map((a): ActionFact => ({
    text: a.text, owner: who(a.ownerId) || "Unassigned", due: a.due, status: a.status, overdue: !!a.due && a.due < today, meeting: `#${m.number} ${m.title}`, link: `${P}/meetings/${m.id}`,
  }))).sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.due || "9999").localeCompare(b.due || "9999"));
  const meetings = raw.meetings.filter((m) => m.status === "Planned" && m.date && m.date.slice(0, 10) >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)
    .map((m): MeetingFact => ({ title: `#${m.number} ${m.title}`, type: m.type, date: m.date, status: m.status, link: `${P}/meetings/${m.id}` }));

  // ---- members without recent activity
  const cutoff = [since, addDays(today, -INACTIVE_DAYS)].sort()[0];
  const inactive = raw.members.filter((m) => { const d = dayOf(m.lastActive); return !d || d < cutoff; })
    .map((m): MemberFact => ({ name: m.name, role: m.role, organization: m.organization, lastActive: dayOf(m.lastActive), link: `${P}/team` }))
    .sort((a, b) => (a.lastActive || "0").localeCompare(b.lastActive || "0") || a.name.localeCompare(b.name));

  return {
    project: raw.project, today, weekEnd, since, generatedAt: opts.generatedAt ?? new Date().toISOString(),
    totals: {
      containers: raw.deliverables.length, done: raw.deliverables.filter((d) => DONE.has(d.status)).length,
      inProgress: raw.deliverables.filter((d) => d.status === "in_progress").length, planned: raw.deliverables.filter((d) => d.status === "planned").length,
      overdue: overdueAll.length, dueThisWeek: weekAll.length, documents: raw.documents.length, files: raw.files.length,
      openIssues: openIssues.length, criticalIssues: openIssues.filter((i) => i.priority === "Critical" || i.priority === "High").length,
      awaitingReview: reviews.length, openActions: actions.length, changes: changes.length,
    },
    overdue: listed(overdueAll), dueThisWeek: listed(weekAll), teams: teams.slice(0, LIST_LIMIT), lateAssignees: lateAssignees.slice(0, LIST_LIMIT),
    byStatus: byStatus.slice(0, LIST_LIMIT), awaitingReview: listed(reviews), changes: listed(changes), activity: listed(activity),
    issues: listed(openIssues), issuesByTeam: [...issueTeams.values()].sort((a, b) => b.open - a.open || a.team.localeCompare(b.team)).slice(0, LIST_LIMIT),
    issuesByPriority: countBy(openIssues.map((i) => i.priority)), issuesByType: countBy(openIssues.map((i) => i.type)),
    milestones, actions: listed(actions), meetings, inactiveMembers: listed(inactive),
  };
}

// ---------------------------------------------------------------- fact lines (id'd, citable)

export interface FactLine { id: string; section: string; label: string; link: string; text: string }

const short = (iso: string) => iso.slice(0, 16).replace("T", " ");
const opt = (k: string, v: string | number) => (v === "" || v == null ? "" : `; ${k} ${v}`);
const more = (l: Listed<unknown>) => (l.total > l.items.length ? ` (showing ${l.items.length} of ${l.total})` : "");

/** Every fact as one line with a stable id (F1, F2, …) in section order; ids are what the AI cites. */
export function factLines(f: ProjectFacts): FactLine[] {
  const P = `/projects/${f.project.id}`;
  const out: FactLine[] = [];
  const add = (section: string, label: string, link: string, text: string) => out.push({ id: `F${out.length + 1}`, section, label, link, text });
  const t = f.totals;

  const S = "Summary";
  add(S, `Project ${f.project.code}`, `${P}/overview`, `Project ${f.project.code} — ${f.project.name}; stage ${f.project.stage || "n/a"}; today ${f.today}; this week = ${f.today} to ${f.weekEnd}; changes counted since ${f.since}`);
  add(S, "Delivery totals", `${P}/delivery/plan`, `MIDP containers ${t.containers}: ${t.done} shared/published, ${t.inProgress} in progress, ${t.planned} planned; ${t.overdue} overdue; ${t.dueThisWeek} due this week`);
  add(S, "CDE totals", `${P}/documents`, `${t.documents} documents and ${t.files} files in the CDE; ${t.awaitingReview} awaiting review or approval; ${t.changes} changes since ${f.since}`);
  add(S, "Coordination totals", `${P}/coordination/issues`, `${t.openIssues} open issues (${t.criticalIssues} high/critical); by priority ${Object.entries(f.issuesByPriority).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}; by type ${Object.entries(f.issuesByType).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}; ${t.openActions} open meeting actions`);

  const sec = (name: string) => name;
  const O = sec(`Overdue containers${more(f.overdue)}`);
  f.overdue.items.forEach((c) => add(O, `Overdue: ${c.container}`, c.link, `${c.container} "${c.title}"; team ${c.team}${opt("assignee", c.assignee)}; due ${c.dueDate} (${c.daysLate} days late); status ${c.status}${c.suitability ? `; CDE ${c.state} ${c.suitability}` : ""}${opt("milestone", c.milestone)}`));
  const W = sec(`Due this week${more(f.dueThisWeek)}`);
  f.dueThisWeek.items.forEach((c) => add(W, `Due: ${c.container}`, c.link, `${c.container} "${c.title}"; team ${c.team}${opt("assignee", c.assignee)}; due ${c.dueDate} (in ${c.daysToDue} days); status ${c.status}${c.suitability ? `; CDE ${c.state} ${c.suitability}` : ""}${opt("milestone", c.milestone)}`));
  f.teams.forEach((x) => add("TIDP status by task team", `TIDP: ${x.team}`, x.link, `Task team ${x.team}${opt("lead", x.lead)}: ${x.total} containers, ${x.done} shared/published, ${x.overdue} overdue, ${x.dueThisWeek} due this week, ${x.openIssues} open issues`));
  f.lateAssignees.forEach((x) => add("Overdue containers by assignee", `Late: ${x.name}`, `${P}/delivery/plan`, `${x.name}: ${x.overdue} overdue container${x.overdue === 1 ? "" : "s"}`));
  f.byStatus.forEach((x) => add("Containers by CDE state and suitability", `Status ${x.code}`, `${P}/documents`, `${x.state} ${x.suitability}: ${x.documents} documents, ${x.files} files`));
  const R = sec(`Awaiting review or approval${more(f.awaitingReview)}`);
  const kind = { "review-requested": "review requested", "shared-for-review": "shared for review/approval", "model-review": "model QA review in draft" } as const;
  f.awaitingReview.items.forEach((x) => add(R, `Review: ${x.title}`, x.link, `${x.title}${opt("container", x.container)}; ${kind[x.kind]}${opt("suitability", x.suitability)}${opt("reviewer", x.reviewer)}; since ${x.since || "n/a"} (${x.daysWaiting} days)`));
  const C = sec(`Changes since ${f.since}${more(f.changes)}`);
  f.changes.items.forEach((x) => add(C, `Change: ${x.title}`, x.link, `${short(x.when)} ${x.by || "Unknown"} — ${x.kind === "revision" ? "issued revision" : x.kind === "file-version" ? "uploaded file version" : "edited"} ${x.title}${opt("container", x.container)}; ${x.from ? `${x.from} → ` : ""}${x.to}${x.note ? `; note "${x.note}"` : ""}`));
  const A = sec(`Activity log since ${f.since}${more(f.activity)}`);
  f.activity.items.forEach((x) => add(A, `Activity: ${x.summary.slice(0, 60)}`, x.link, `${short(x.when)} ${x.by || "Unknown"}: ${x.summary}`));
  f.issuesByTeam.forEach((x) => add("Open issues by task team", `Issues: ${x.team}`, `${P}/coordination/issues`, `${x.team}: ${x.open} open (${x.clash} clash, ${x.critical} critical, ${x.high} high, ${x.overdue} overdue)`));
  const I = sec(`Open issues, most urgent first${more(f.issues)}`);
  f.issues.items.forEach((x) => add(I, `Issue #${x.number}`, x.link, `Issue #${x.number} "${x.title}"; ${x.type}, ${x.status}, priority ${x.priority}; team ${x.team}${opt("assignee", x.assignee)}; age ${x.ageDays} days${x.dueDate ? `; due ${x.dueDate}${x.overdue ? " (overdue)" : ""}` : ""}`));
  f.milestones.forEach((x) => add("Next milestones", `Milestone: ${x.name}`, x.link, `${x.name} on ${x.date} (in ${x.daysTo} days): ${x.containers} containers linked, ${x.outstanding} not yet shared/published`));
  const M = sec(`Open meeting actions${more(f.actions)}`);
  f.actions.items.forEach((x) => add(M, `Action: ${x.text.slice(0, 60)}`, x.link, `"${x.text}"; owner ${x.owner}; ${x.status}${x.due ? `; due ${x.due}${x.overdue ? " (overdue)" : ""}` : ""}; from meeting ${x.meeting}`));
  f.meetings.forEach((x) => add("Upcoming meetings", `Meeting: ${x.title}`, x.link, `${x.title} (${x.type}) on ${x.date.replace("T", " ")}; ${x.status}`));
  const N = sec(`Members without recent activity${more(f.inactiveMembers)}`);
  f.inactiveMembers.items.forEach((x) => add(N, `Member: ${x.name}`, x.link, `${x.name} (${x.role}${x.organization ? `, ${x.organization}` : ""}); last project activity ${x.lastActive || "never"}`));
  return out;
}

/** Fact lines as AI context, grouped by section, at most `limit` characters (later lines are dropped with a note). */
export function factsToContext(f: ProjectFacts, limit = CONTEXT_LIMIT): string {
  const lines = factLines(f);
  const parts: string[] = [];
  let size = 0, section = "", dropped = 0;
  const reserve = 200;
  for (const l of lines) {
    const head = l.section !== section ? `\n## ${l.section}\n` : "";
    const text = `${head}[${l.id}] ${l.text}\n`;
    if (size + text.length > limit - reserve) { dropped++; continue; }
    if (head) section = l.section;
    parts.push(text); size += text.length;
  }
  const empty = (["overdue", "dueThisWeek", "awaitingReview", "changes", "issues", "actions"] as const).filter((k) => !f[k].total);
  let out = `# Project facts (${f.project.code}, as of ${f.today})\n` + parts.join("");
  if (empty.length) out += `\nNo records: ${empty.map((k) => ({ overdue: "overdue containers", dueThisWeek: "containers due this week", awaitingReview: "items awaiting review", changes: `changes since ${f.since}`, issues: "open issues", actions: "open meeting actions" })[k]).join(", ")}.\n`;
  if (dropped) out += `\n(${dropped} further fact lines omitted for length.)\n`;
  return out.slice(0, limit);
}

// ---------------------------------------------------------------- deterministic briefing (no AI)

const cell = (s: string | number) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ") || "—";
const table = (head: string[], rows: (string | number)[][]) => [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n");
const note = (l: Listed<unknown>) => (l.total > l.items.length ? `\n\n*Showing ${l.items.length} of ${l.total}.*` : "");

/** A coordination-meeting briefing in Markdown built only from the facts. */
export function briefingMarkdown(f: ProjectFacts): string {
  const t = f.totals;
  const md: string[] = [];
  md.push(`# Coordination briefing — ${f.project.code} ${f.project.name}`);
  md.push(`Prepared ${f.today} from live project records. Changes are counted since ${f.since}; "this week" is ${f.today} to ${f.weekEnd}.`);

  md.push("## Summary");
  md.push([
    `- Information delivery: ${t.done} of ${t.containers} containers shared or published; ${t.inProgress} in progress, ${t.planned} not started.`,
    `- **${t.overdue}** container${t.overdue === 1 ? " is" : "s are"} overdue and ${t.dueThisWeek} ${t.dueThisWeek === 1 ? "is" : "are"} due this week.`,
    `- ${t.awaitingReview} item${t.awaitingReview === 1 ? "" : "s"} awaiting review or approval.`,
    `- ${t.openIssues} open issue${t.openIssues === 1 ? "" : "s"} (${t.criticalIssues} high or critical) and ${t.openActions} open meeting action${t.openActions === 1 ? "" : "s"}.`,
    `- ${t.changes} change${t.changes === 1 ? "" : "s"} to CDE information since ${f.since}.`,
    ...(f.milestones[0] ? [`- Next milestone: ${f.milestones[0].name} on ${f.milestones[0].date} (${f.milestones[0].outstanding} container${f.milestones[0].outstanding === 1 ? "" : "s"} outstanding).`] : []),
  ].join("\n"));

  md.push("## Overdue information containers");
  md.push(f.overdue.total ? table(["Container", "Title", "Task team", "Assignee", "Due", "Days late", "Status"], f.overdue.items.map((c) => [c.container, c.title, c.team, c.assignee, c.dueDate, c.daysLate, c.status.replace("_", " ")])) + note(f.overdue) : "Nothing is overdue.");

  md.push("## Due this week");
  md.push(f.dueThisWeek.total ? table(["Container", "Title", "Task team", "Assignee", "Due", "Status"], f.dueThisWeek.items.map((c) => [c.container, c.title, c.team, c.assignee, c.dueDate, c.status.replace("_", " ")])) + note(f.dueThisWeek) : "Nothing falls due this week.");

  if (f.teams.length) {
    md.push("## TIDP status by task team");
    md.push(table(["Task team", "Lead", "Containers", "Shared/published", "Overdue", "Due this week", "Open issues"], f.teams.map((x) => [x.team, x.lead, x.total, x.done, x.overdue, x.dueThisWeek, x.openIssues])));
  }

  md.push("## Awaiting review or approval");
  const kind = { "review-requested": "Review requested", "shared-for-review": "Shared for review", "model-review": "Model QA (draft)" } as const;
  md.push(f.awaitingReview.total ? table(["Item", "Container", "Type", "Suitability", "Reviewer", "Days waiting"], f.awaitingReview.items.map((x) => [x.title, x.container, kind[x.kind], x.suitability, x.reviewer, x.daysWaiting])) + note(f.awaitingReview) : "No items are waiting for review.");

  md.push(`## Changes since ${f.since}`);
  md.push(f.changes.total ? table(["When", "Item", "By", "Change"], f.changes.items.map((x) => [short(x.when), x.container ? `${x.title} (${x.container})` : x.title, x.by, `${x.from ? `${x.from} → ` : ""}${x.to}`])) + note(f.changes) : "No CDE changes in the period.");

  md.push("## Open coordination issues");
  if (f.issuesByTeam.length) md.push(table(["Task team", "Open", "Clash", "Critical", "High", "Overdue"], f.issuesByTeam.map((x) => [x.team, x.open, x.clash, x.critical, x.high, x.overdue])));
  const urgent = f.issues.items.filter((i) => i.priority === "Critical" || i.priority === "High" || i.overdue).slice(0, 15);
  md.push(urgent.length ? table(["#", "Title", "Type", "Priority", "Team", "Assignee", "Age (days)", "Due"], urgent.map((i) => [i.number, i.title, i.type, i.priority, i.team, i.assignee, i.ageDays, i.dueDate])) : f.issues.total ? "No high-priority or overdue issues." : "No open issues.");

  md.push("## Open actions from previous meetings");
  md.push(f.actions.total ? table(["Action", "Owner", "Due", "Status", "Meeting"], f.actions.items.map((a) => [a.text, a.owner, a.due + (a.overdue ? " (overdue)" : ""), a.status, a.meeting])) + note(f.actions) : "No open actions.");

  md.push("## Next milestones");
  md.push(f.milestones.length ? table(["Milestone", "Date", "In (days)", "Containers", "Outstanding"], f.milestones.map((m) => [m.name, m.date, m.daysTo, m.containers, m.outstanding])) : "No future milestones are planned.");

  if (f.inactiveMembers.total) {
    md.push("## Members without recent activity");
    md.push(table(["Name", "Role", "Organisation", "Last activity"], f.inactiveMembers.items.map((m) => [m.name, m.role, m.organization, m.lastActive || "never"])) + note(f.inactiveMembers));
  }

  md.push("## Suggested agenda");
  const agenda = [
    "Actions from the previous meeting",
    ...(t.overdue ? [`Overdue information containers (${t.overdue}) — recovery dates from each task team`] : []),
    ...(t.dueThisWeek ? [`Containers due this week (${t.dueThisWeek}) — confirm readiness`] : []),
    ...(t.awaitingReview ? [`Information awaiting review or approval (${t.awaitingReview})`] : []),
    ...(t.openIssues ? [`Coordination issues (${t.openIssues} open, ${t.criticalIssues} high/critical)`] : []),
    ...(f.milestones[0] ? [`Readiness for ${f.milestones[0].name} (${f.milestones[0].date})`] : []),
    "Any other business",
  ];
  md.push(agenda.map((a, i) => `${i + 1}. ${a}`).join("\n"));
  return md.join("\n\n") + "\n";
}
