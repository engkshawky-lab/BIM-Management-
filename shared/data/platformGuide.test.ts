import { describe, expect, it } from "vitest";
import { ALL_PAGES, PROJECT_PAGES, SECTIONS, groupsOf, pageByKey } from "../../client/src/shell/nav";
import { BIM_ROLES } from "../../client/src/shell/roles";
import { LEARNING_PATHS } from "./learningPaths";
import { DOC_GUIDES } from "./docGuides";
import { WF_ROLES } from "./workflow/roles";
import { FAQ, FIRST_DAY, FIRST_WEEK, FLOWS, ROLE_ROUTES, SECTION_GUIDE, guidePageKeys, unknownGuideKeys } from "./platformGuide";

// The sidebar as rendered: My work, then Projects, then the other sections.
// the sidebar shows Projects right after My work
const sidebar = SECTIONS.flatMap((s) => [
  { id: s.id, label: s.label, items: s.items },
  ...(s.id === "home" ? [{ id: "projects", label: "Projects", items: PROJECT_PAGES }] : []),
]);

describe("platform guide", () => {
  it("has one entry per sidebar section, in sidebar order, titled as in the sidebar", () => {
    expect(SECTION_GUIDE.map((s) => s.id)).toEqual(sidebar.map((s) => s.id));
    for (const s of sidebar) expect(SECTION_GUIDE.find((g) => g.id === s.id)?.title).toBe(s.label);
  });

  it("explains exactly the groups each section has", () => {
    for (const s of sidebar) {
      const guide = SECTION_GUIDE.find((g) => g.id === s.id)!;
      expect(Object.keys(guide.groups), s.id).toEqual(groupsOf(s.items));
    }
  });

  it("starts each section with one of its own pages", () => {
    for (const s of sidebar) {
      const guide = SECTION_GUIDE.find((g) => g.id === s.id)!;
      expect(s.items.some((i) => i.key === guide.startWith), guide.startWith).toBe(true);
    }
  });

  it("refers only to pages that exist", () => {
    expect(guidePageKeys().length).toBeGreaterThan(20);
    expect(unknownGuideKeys(ALL_PAGES)).toEqual([]);
  });

  it("links to existing document guides and global pages", () => {
    const hrefs = [...FIRST_DAY.map((s) => s.href), ...FIRST_WEEK.flatMap((d) => d.links.map((l) => l.href)), ...FAQ.flatMap((f) => (f.links ?? []).map((l) => l.href))].filter((h): h is string => !!h);
    for (const h of hrefs) {
      const doc = /^\/doc-guides\/(.+)$/.exec(h)?.[1];
      if (doc) expect(DOC_GUIDES.some((g) => g.id === doc), h).toBe(true);
      else expect(/^\/(guide\/[a-z-]+|projects\/new)$/.test(h), h).toBe(true);
    }
  });

  it("has a complete first day, first week, flows and FAQ", () => {
    expect(FIRST_DAY.length).toBeGreaterThanOrEqual(8);
    expect(FIRST_DAY.length).toBeLessThanOrEqual(10);
    expect(new Set(FIRST_DAY.map((s) => s.id)).size).toBe(FIRST_DAY.length);
    expect(FIRST_WEEK.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
    for (const d of FIRST_WEEK) expect(d.links.length).toBeGreaterThanOrEqual(3);
    expect(FLOWS.length).toBeGreaterThanOrEqual(5);
    for (const f of FLOWS) expect(f.nodes.length).toBeGreaterThanOrEqual(3);
    expect(FAQ.length).toBeGreaterThanOrEqual(12);
    expect(pageByKey("r.guide")?.path).toBe("/guide");
  });

  it("routes each role to a real learning path, role profile and sidebar role", () => {
    for (const r of ROLE_ROUTES) {
      expect(LEARNING_PATHS.some((p) => p.id === r.pathId), r.pathId).toBe(true);
      if (r.roleProfile) expect(WF_ROLES.some((w) => w.id === r.roleProfile), r.roleProfile).toBe(true);
      if (r.sidebarRole) expect(BIM_ROLES.some((b) => b.id === r.sidebarRole), r.sidebarRole).toBe(true);
    }
    for (const p of LEARNING_PATHS) expect(ROLE_ROUTES.some((r) => r.pathId === p.id), p.id).toBe(true);
  });
});
