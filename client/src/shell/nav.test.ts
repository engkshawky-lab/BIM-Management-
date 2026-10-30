import { describe, expect, it } from "vitest";
import { ALL_PAGES, DAILY_TOOLS, HOME_PAGES, SECTIONS, groupsOf, locate, pageByKey } from "./nav";
import { BIM_ROLES } from "./roles";
import { LEARNING_PATHS } from "../../../shared/data/learningPaths";
import { ROLE_IDS } from "../../../shared/data/workflow/types";

describe("navigation layout", () => {
  it("defines every page once", () => {
    const keys = ALL_PAGES.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    const paths = ALL_PAGES.filter((p) => p.scope === "global").map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("has six sidebar sections, each in a few groups", () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(["learn", "documents", "models", "ai", "resources", "home"]);
    for (const s of SECTIONS) expect(groupsOf(s.items).length).toBeLessThanOrEqual(6);
    expect(HOME_PAGES.map((p) => p.path)).toContain("/");
  });

  it("finds the section and group a page is listed in", () => {
    for (const s of SECTIONS) for (const p of s.items) expect([p.path, locate(p.path).section, locate(p.path).group]).toEqual([p.path, s.id, p.group]);
  });

  it("places pages outside the menu sensibly", () => {
    expect(locate("/")).toMatchObject({ section: "home" });
    expect(locate("/projects/0b7f3c1e-0000-4000-8000-000000000000/delivery/plan")).toMatchObject({ section: "projects", group: "Appointment & planning" });
    expect(locate("/projects/new")).toMatchObject({ section: "projects" });
    expect(locate("/hubs/revit/mcp/videos")).toMatchObject({ section: "learn", group: "Topic hubs" });
    expect(locate("/parts/19650-2/clauses")).toMatchObject({ section: "learn", group: "ISO 19650 parts" });
    expect(locate("/knowledge/iso19650/templates/eir")).toMatchObject({ section: "documents", group: "Templates & samples" });
    expect(locate("/ai-tools/plans")).toMatchObject({ section: "documents", group: "Create" });
    expect(locate("/model-tools/revit")).toMatchObject({ section: "models", group: "Check models" });
    expect(locate("/tools/fee")).toMatchObject({ section: "resources" });
    expect(locate("/admin/users")).toMatchObject({ section: "account" });
  });

  it("keeps shortcuts and role favourites pointing at real pages", () => {
    for (const k of DAILY_TOOLS) expect(pageByKey(k), k).toBeTruthy();
    for (const r of BIM_ROLES) for (const k of [...r.tools, ...r.pages]) expect(pageByKey(k), `${r.id}: ${k}`).toBeTruthy();
    // pages that work without a project, so the role filter is useful from day one
    for (const r of BIM_ROLES) expect(r.pages.every((k) => pageByKey(k)?.scope === "global"), r.id).toBe(true);
    for (const r of BIM_ROLES) { expect(LEARNING_PATHS.some((p) => p.id === r.path), r.path).toBe(true); expect(ROLE_IDS as string[], r.profile).toContain(r.profile); }
  });
});
