import { describe, expect, it } from "vitest";
import { blockedAt, canOpenKey, cheapestForKey, cleanTabAccess, tabChain, tabForApi } from "./access";
import { hubs } from "./data/hubs";
import { PAGE_TABS, hubTabKey, hubTabNodes, tabKey } from "./tabs";

describe("tab access", () => {
  it("lists a tab key's parents, outermost first", () => {
    expect(tabChain("s.hub.cde/setup/naming")).toEqual(["s.hub.cde/setup", "s.hub.cde/setup/naming"]);
    expect(tabChain("r.guide")).toEqual([]);
  });

  it("opens a tab on every plan that opens its page, until the tab is closed to a plan", () => {
    // Part 2 is on every plan by default
    expect(canOpenKey("s.19650.part2/ask", "free")).toBe(true);
    const tabs = { "s.19650.part2/ask": { free: false, starter: false } };
    expect(canOpenKey("s.19650.part2/ask", "free", null, tabs)).toBe(false);
    expect(canOpenKey("s.19650.part2/ask", "pro", null, tabs)).toBe(true);
    expect(cheapestForKey("s.19650.part2/ask", null, tabs)).toBe("pro");
    expect(canOpenKey("s.19650.part2/overview", "free", null, tabs)).toBe(true);
  });

  it("never opens a tab to a plan its page or a parent tab closes", () => {
    const access = { "s.19650.part2": ["pro", "expert"] as ("pro" | "expert")[] };
    expect(blockedAt("s.19650.part2/quiz", "starter", access)).toBe("s.19650.part2");
    const tabs = { "w.docguides/deep-dive": { pro: false } };
    expect(blockedAt("w.docguides/deep-dive/rubric", "pro", null, tabs)).toBe("w.docguides/deep-dive");
    expect(canOpenKey("w.docguides/deep-dive/rubric", "expert", null, tabs)).toBe(true);
  });

  it("lets a plan added to the page later reach its tabs", () => {
    const tabs = { "r.guide/faq": { starter: false } };
    expect(canOpenKey("r.guide/faq", "free", { "r.guide": ["starter", "pro", "expert"] }, tabs)).toBe(false);
    expect(canOpenKey("r.guide/faq", "free", { "r.guide": ["free", "starter", "pro", "expert"] }, tabs)).toBe(true);
  });

  it("keeps only valid tab keys and closed marks", () => {
    expect(cleanTabAccess({
      "s.19650.part2/ask": { free: false, pro: true, gold: false },
      "no-slash": { free: false },
      "bad key/x": { free: false },
      "r.guide/faq": { starter: true },
      "r.guide/a/b/c/d/e": { free: false },
    })).toEqual({ "s.19650.part2/ask": { free: false } });
    expect(cleanTabAccess(null)).toEqual({});
  });

  it("finds the tab behind AI calls", () => {
    expect(tabForApi("/ai/tools/ask-part", { partId: "19650-3" })).toBe("s.19650.part3/ask");
    expect(tabForApi("/ai/tools/ask-part", { partId: "x" })).toBeNull();
    expect(tabForApi("/ai/tools/model-compare", {})).toBe("m.ifc/ai");
    expect(tabForApi("/ai/tools/review", {})).toBeNull();
  });
});

describe("tab registry", () => {
  it("gives every tab a unique id under its parent", () => {
    const check = (nodes: { id: string; children?: { id: string }[] }[]) => {
      expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length);
      for (const n of nodes) if (n.children) check(n.children);
    };
    for (const nodes of Object.values(PAGE_TABS)) check(nodes);
    for (const hub of hubs) check(hubTabNodes(hub));
  });

  it("builds keys the cleaner accepts, for hubs with one section and with several", () => {
    for (const hub of hubs) {
      const s = hub.sections[0]!; const tab = s.tabs[0]!;
      const key = hubTabKey("s.hub.x", hub.sections.length, s.id, tab.id);
      expect(Object.keys(cleanTabAccess({ [key]: { free: false } }))).toEqual([key]);
    }
    expect(hubTabKey("s.hub.x", 1, "main", "intro")).toBe("s.hub.x/intro");
    expect(hubTabKey("s.hub.x", 3, "setup", "naming")).toBe("s.hub.x/setup/naming");
    expect(tabKey("w.docguides", "deep-dive", "rubric")).toBe("w.docguides/deep-dive/rubric");
  });
});
