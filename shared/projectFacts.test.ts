import { describe, expect, it } from "vitest";
import { briefingMarkdown, buildProjectFacts, CONTEXT_LIMIT, factLines, factsToContext, lastMonday, type RawFactsInput } from "./projectFacts";

const raw = (over: Partial<RawFactsInput> = {}): RawFactsInput => ({
  project: { id: "p1", code: "TWA", name: "Tower A", stage: "Stage 4" },
  teams: [
    { id: "t1", name: "Architecture", originatorCode: "ARC", leadUserId: "u1" },
    { id: "t2", name: "MEP", originatorCode: "MEP", leadUserId: "u2" },
  ],
  milestones: [
    { id: "m1", name: "Stage 3 sign-off", date: "2026-10-01" },
    { id: "m2", name: "Stage 4 design freeze", date: "2026-11-20" },
  ],
  deliverables: [
    { id: "d1", taskTeamId: "t1", containerName: "TWA-ARC-ZZ-ZZ-M3-A-0001", title: "Arch model", milestoneId: "m2", dueDate: "2026-10-20", status: "in_progress", assigneeId: "u1", documentId: null, fileId: "f1", actualDate: "" },
    { id: "d2", taskTeamId: "t2", containerName: "TWA-MEP-ZZ-ZZ-M3-M-0001", title: "MEP model", milestoneId: "m2", dueDate: "2026-10-28", status: "planned", assigneeId: "u2", documentId: null, fileId: null, actualDate: "" },
    { id: "d3", taskTeamId: "t2", containerName: "TWA-MEP-ZZ-ZZ-DR-M-0101", title: "Plant room layout", milestoneId: "m2", dueDate: "2026-11-02", status: "in_progress", assigneeId: "u2", documentId: "doc1", fileId: null, actualDate: "" },
    { id: "d4", taskTeamId: "t1", containerName: "TWA-ARC-ZZ-ZZ-DR-A-0100", title: "GA plans", milestoneId: "m1", dueDate: "2026-09-30", status: "published", assigneeId: "u1", documentId: null, fileId: null, actualDate: "2026-09-29" },
    { id: "d5", taskTeamId: "t1", containerName: "", title: "Door schedule", milestoneId: null, dueDate: "2026-12-01", status: "planned", assigneeId: null, documentId: null, fileId: null, actualDate: "" },
  ],
  documents: [
    { id: "doc1", title: "Plant room layout", containerName: "TWA-MEP-ZZ-ZZ-DR-M-0101", revision: "P02", state: "SHARED", suitability: "S3", reviewStatus: "none", reviewerId: null, authorId: "u2", updatedAt: new Date("2026-10-27T09:00:00Z") },
    { id: "doc2", title: "BEP", containerName: "TWA-XIM-ZZ-ZZ-BEP-Z-0001", revision: "P01.03", state: "WIP", suitability: "S0", reviewStatus: "requested", reviewerId: "u3", authorId: "u3", updatedAt: new Date("2026-10-22T09:00:00Z") },
  ],
  files: [
    { id: "f1", name: "TWA-ARC-ZZ-ZZ-M3-A-0001.ifc", containerName: "TWA-ARC-ZZ-ZZ-M3-A-0001", state: "WIP", suitability: "S0", revision: "P01.04", documentId: null, uploadedBy: "u1", updatedAt: new Date("2026-10-28T10:00:00Z") },
    { id: "f2", name: "Plant room layout.pdf", containerName: "TWA-MEP-ZZ-ZZ-DR-M-0101", state: "SHARED", suitability: "S3", revision: "P02", documentId: "doc1", uploadedBy: "u2", updatedAt: new Date("2026-10-27T09:00:00Z") },
  ],
  revisions: [
    { documentId: "doc1", revision: "P01", state: "WIP", suitability: "S0", note: "", authorId: "u2", createdAt: new Date("2026-10-10T09:00:00Z") },
    { documentId: "doc1", revision: "P02", state: "SHARED", suitability: "S3", note: "For review", authorId: "u2", createdAt: new Date("2026-10-27T09:00:00Z") },
  ],
  fileVersions: [{ fileId: "f1", version: 4, note: "Level 3 updated", uploadedBy: "u1", createdAt: new Date("2026-10-28T10:00:00Z") }],
  activity: [
    { userId: "u1", action: "file.upload", summary: "Uploaded TWA-ARC-ZZ-ZZ-M3-A-0001.ifc v4", link: "/projects/p1/files", createdAt: new Date("2026-10-28T10:00:00Z") },
    { userId: "u2", action: "doc.state", summary: "Shared plant room layout", link: "", createdAt: new Date("2026-10-20T10:00:00Z") },
  ],
  issues: [
    { id: "i1", number: 12, title: "Duct clashes with beam", type: "Clash", status: "Open", priority: "High", taskTeamId: "t2", assigneeId: "u2", dueDate: "2026-10-25", createdAt: new Date("2026-10-01T00:00:00Z"), updatedAt: new Date("2026-10-01T00:00:00Z") },
    { id: "i2", number: 13, title: "Missing door tags", type: "Issue", status: "In progress", priority: "Low", taskTeamId: "t1", assigneeId: "u1", dueDate: "", createdAt: new Date("2026-10-20T00:00:00Z"), updatedAt: new Date("2026-10-20T00:00:00Z") },
    { id: "i3", number: 14, title: "Sprinkler vs ceiling", type: "Clash", status: "Open", priority: "Critical", taskTeamId: "t2", assigneeId: null, dueDate: "2026-11-05", createdAt: new Date("2026-10-29T00:00:00Z"), updatedAt: new Date("2026-10-29T00:00:00Z") },
  ],
  modelReviews: [{ id: "r1", number: 3, title: "Stage 4 MEP QA", discipline: "MEP", taskTeamId: "t2", reviewerId: "u3", status: "Draft", updatedAt: new Date("2026-10-15T00:00:00Z") }],
  meetings: [
    { id: "mt1", number: 1, title: "Coordination 1", type: "coordination", date: "2026-10-16", status: "Minutes issued", actions: [{ id: "a1", text: "Old action", ownerId: "u1", due: "2026-10-20", status: "Open" }] },
    { id: "mt2", number: 2, title: "Coordination 2", type: "coordination", date: "2026-10-23", status: "Minutes issued", actions: [
      { id: "a1", text: "Issue revised MEP model", ownerId: "u2", due: "2026-10-27", status: "Open" },
      { id: "a2", text: "Confirm ceiling heights", ownerId: "u1", due: "2026-11-06", status: "In progress" },
      { id: "a3", text: "Done thing", ownerId: "u1", due: "2026-10-24", status: "Done" },
    ] },
    { id: "mt3", number: 3, title: "Coordination 3", type: "design", date: "2026-10-31T10:00", status: "Planned", actions: [] },
  ],
  members: [
    { userId: "u1", name: "Amal Architect", role: "editor", organization: "ArcCo", lastActive: new Date("2026-10-28T10:00:00Z") },
    { userId: "u2", name: "Mo MEP", role: "editor", organization: "MepCo", lastActive: new Date("2026-10-20T10:00:00Z") },
    { userId: "u3", name: "Ivy Manager", role: "manager", organization: "Client", lastActive: null },
  ],
  userNames: {},
  ...over,
});

const opts = { today: "2026-10-30", since: "2026-10-26", generatedAt: "2026-10-30T08:00:00.000Z" };

describe("lastMonday", () => {
  it("returns the previous Monday, a week back on Mondays", () => {
    expect(lastMonday(new Date(2026, 9, 30))).toBe("2026-10-26"); // Friday
    expect(lastMonday(new Date(2026, 9, 26))).toBe("2026-10-19"); // Monday
    expect(lastMonday(new Date(2026, 10, 1))).toBe("2026-10-26"); // Sunday
  });
});

describe("buildProjectFacts", () => {
  const f = buildProjectFacts(raw(), opts);

  it("finds overdue and due-this-week containers, most urgent first", () => {
    expect(f.overdue.items.map((c) => c.id)).toEqual(["d1", "d2"]);
    expect(f.overdue.items[0]).toMatchObject({ team: "Architecture", assignee: "Amal Architect", daysLate: 10, suitability: "S0", state: "WIP" });
    expect(f.dueThisWeek.items.map((c) => c.id)).toEqual(["d3"]);
    expect(f.dueThisWeek.items[0].link).toBe("/projects/p1/documents/doc1");
    expect(f.totals).toMatchObject({ containers: 5, done: 1, overdue: 2, dueThisWeek: 1 });
  });

  it("reports TIDP lateness by team and assignee", () => {
    expect(f.teams.map((t) => [t.team, t.overdue, t.dueThisWeek])).toEqual([["MEP", 1, 1], ["Architecture", 1, 0]]);
    expect(f.lateAssignees).toEqual([{ name: "Amal Architect", overdue: 1 }, { name: "Mo MEP", overdue: 1 }]);
  });

  it("groups containers by CDE state and suitability", () => {
    expect(f.byStatus).toEqual([
      { code: "WIP/S0", state: "WIP", suitability: "S0", documents: 1, files: 1 },
      { code: "SHARED/S3", state: "SHARED", suitability: "S3", documents: 1, files: 1 },
    ]);
  });

  it("lists items awaiting review without duplicating a container", () => {
    expect(f.awaitingReview.items.map((r) => r.kind)).toEqual(["model-review", "review-requested", "shared-for-review"]);
    expect(f.awaitingReview.items.find((r) => r.kind === "review-requested")).toMatchObject({ reviewer: "Ivy Manager", daysWaiting: 8 });
  });

  it("lists changes since the date with from → to", () => {
    expect(f.changes.items.map((c) => c.kind)).toEqual(["file-version", "revision"]);
    expect(f.changes.items[1]).toMatchObject({ from: "P01 WIP S0", to: "P02 SHARED S3", by: "Mo MEP" });
    expect(f.activity.total).toBe(1);
  });

  it("sorts open issues by priority and groups by team", () => {
    expect(f.issues.items.map((i) => i.number)).toEqual([14, 12, 13]);
    expect(f.issues.items[1]).toMatchObject({ overdue: true, ageDays: 29 });
    expect(f.issuesByTeam[0]).toEqual({ team: "MEP", open: 2, clash: 2, critical: 1, high: 1, overdue: 1 });
    expect(f.issuesByPriority).toEqual({ Critical: 1, High: 1, Low: 1 });
  });

  it("keeps only live meeting actions, next milestones, upcoming meetings and inactive members", () => {
    expect(f.actions.items.map((a) => [a.text, a.overdue])).toEqual([["Issue revised MEP model", true], ["Confirm ceiling heights", false]]);
    expect(f.milestones).toEqual([{ id: "m2", name: "Stage 4 design freeze", date: "2026-11-20", daysTo: 21, containers: 3, outstanding: 3, link: "/projects/p1/delivery/plan" }]);
    expect(f.meetings.map((m) => m.title)).toEqual(["#3 Coordination 3"]);
    expect(f.inactiveMembers.items.map((m) => m.name)).toEqual(["Ivy Manager"]);
  });

  it("bounds lists at 50 while keeping the total", () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ ...raw().deliverables[1], id: `x${i}`, containerName: `C-${String(i).padStart(3, "0")}`, dueDate: "2026-10-01" }));
    const g = buildProjectFacts(raw({ deliverables: many }), opts);
    expect(g.overdue.total).toBe(80);
    expect(g.overdue.items).toHaveLength(50);
  });
});

describe("factLines / factsToContext", () => {
  const f = buildProjectFacts(raw(), opts);

  it("gives every fact a sequential id and a platform link", () => {
    const lines = factLines(f);
    expect(lines.map((l) => l.id)).toEqual(lines.map((_, i) => `F${i + 1}`));
    expect(lines.every((l) => l.link.startsWith("/projects/p1/"))).toBe(true);
    const ctx = factsToContext(f);
    expect(ctx).toContain("[F1] Project TWA");
    expect(ctx).toContain("## Overdue containers");
    expect(ctx).toContain("TWA-ARC-ZZ-ZZ-M3-A-0001");
  });

  it("stays within the character limit and notes omissions", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ ...raw().issues[0], id: `i${i}`, number: 100 + i, title: "x".repeat(200) }));
    const g = buildProjectFacts(raw({ issues: many }), opts);
    const ctx = factsToContext(g, 5000);
    expect(ctx.length).toBeLessThanOrEqual(5000);
    expect(ctx).toMatch(/further fact lines omitted/);
    expect(factsToContext(g).length).toBeLessThanOrEqual(CONTEXT_LIMIT);
  });
});

describe("briefingMarkdown", () => {
  it("is deterministic and covers the agenda sections", () => {
    const f = buildProjectFacts(raw(), opts);
    const md = briefingMarkdown(f);
    expect(md).toBe(briefingMarkdown(buildProjectFacts(raw(), opts)));
    for (const h of ["# Coordination briefing — TWA Tower A", "## Overdue information containers", "## Due this week", "## TIDP status by task team", "## Changes since 2026-10-26", "## Open coordination issues", "## Next milestones", "## Suggested agenda"]) expect(md).toContain(h);
    expect(md).toContain("| TWA-ARC-ZZ-ZZ-M3-A-0001 | Arch model | Architecture | Amal Architect | 2026-10-20 | 10 | in progress |");
  });

  it("says so when there is nothing to report", () => {
    const md = briefingMarkdown(buildProjectFacts(raw({ deliverables: [], issues: [], meetings: [], documents: [], files: [], revisions: [], fileVersions: [], modelReviews: [] }), opts));
    expect(md).toContain("Nothing is overdue.");
    expect(md).toContain("No open issues.");
  });
});
