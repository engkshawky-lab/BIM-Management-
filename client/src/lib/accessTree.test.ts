import { describe, expect, it } from "vitest";
import { hubs } from "../../../shared/data/hubs";
import { cleanTabAccess } from "../../../shared/access";
import { ALL_PAGES } from "../shell/nav";
import { buildAccessTree, descendantsOf } from "./accessTree";

describe("access tree", () => {
  const tree = buildAccessTree();
  const all = tree.flatMap((n) => [n, ...descendantsOf(n)]);

  it("has every row once", () => {
    const keys = all.map((n) => n.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("lists every sidebar page except the account pages", () => {
    const pages = new Set(all.filter((n) => n.kind === "page").map((n) => n.key));
    const missing = ALL_PAGES.filter((p) => p.group !== "Account" && !pages.has(p.key)).map((p) => p.key);
    expect(missing).toEqual([]);
  });

  it("puts every topic hub's tabs under its page, nested by section", () => {
    for (const hub of hubs) {
      const page = all.find((n) => n.kind === "page" && ALL_PAGES.find((p) => p.key === n.key)?.path === `/hubs/${hub.id}`);
      expect(page, hub.id).toBeTruthy();
      const tabs = descendantsOf(page!).filter((n) => n.children.length === 0);
      expect(tabs.length).toBe(hub.sections.reduce((a, s) => a + s.tabs.length, 0));
    }
  });

  it("nests Part hub, deep dive and hub tabs below their pages with keys the server keeps", () => {
    const part2 = all.find((n) => n.key === "s.19650.part2")!;
    expect(part2.children.map((n) => n.key)).toContain("s.19650.part2/ask");
    expect(all.find((n) => n.key === "w.docguides/deep-dive")!.children.map((n) => n.level)).toEqual([2, 2, 2, 2, 2]);
    const tabs = all.filter((n) => n.kind === "tab");
    const kept = cleanTabAccess(Object.fromEntries(tabs.map((n) => [n.key, { free: false }])));
    expect(Object.keys(kept).length).toBe(tabs.length);
  });
});
