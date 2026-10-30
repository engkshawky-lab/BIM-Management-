import { describe, expect, it } from "vitest";
import { ALL_PAGES, DAILY_TOOLS, DOCUMENT_PAGES, HOME_PAGES, MODEL_PAGES, RAIL, RESOURCE_PAGES, STANDARD_PAGES, pageByKey, sectionFor } from "./nav";

describe("navigation layout", () => {
  it("defines every page once", () => {
    const keys = ALL_PAGES.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    const paths = ALL_PAGES.filter((p) => p.scope === "global").map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("opens the section a page is listed in", () => {
    const sections: [string, typeof HOME_PAGES][] = [["home", HOME_PAGES], ["documents", DOCUMENT_PAGES], ["tools", MODEL_PAGES], ["standards", STANDARD_PAGES], ["resources", RESOURCE_PAGES]];
    for (const [id, items] of sections) for (const p of items) expect([p.path, sectionFor(p.path)]).toEqual([p.path, id]);
    expect(RAIL.map((r) => r.id)).toEqual(["home", "projects", "documents", "tools", "standards", "resources"]);
  });

  it("routes pages outside the menu to a sensible section", () => {
    expect(sectionFor("/")).toBe("home");
    expect(sectionFor("/projects/abc/delivery/plan")).toBe("projects");
    expect(sectionFor("/hubs/revit/mcp/videos")).toBe("standards");
    expect(sectionFor("/hubs/theme/process")).toBe("standards");
    expect(sectionFor("/learn/guides/coordinator")).toBe("standards");
    expect(sectionFor("/knowledge/iso19650/templates/eir")).toBe("documents");
    expect(sectionFor("/ai-tools/plans")).toBe("documents");
    expect(sectionFor("/model-tools/revit")).toBe("tools");
    expect(sectionFor("/tools/fee")).toBe("resources");
    expect(sectionFor("/admin/users")).toBe("resources");
  });

  it("keeps the daily tools pointing at real pages", () => {
    for (const k of DAILY_TOOLS) expect(pageByKey(k), k).toBeTruthy();
  });
});
