import { describe, expect, it } from "vitest";
import { ALL_PAGES, TEMPLATE_PAGES } from "../../../client/src/shell/nav";
import { PAGE_GUIDES, guideFor } from "./index";

describe("page guides", () => {
  const pages = ALL_PAGES.filter((p) => !TEMPLATE_PAGES.includes(p));
  it("cover every sidebar page exactly once, and only real pages", () => {
    const keys = PAGE_GUIDES.map((g) => g.key);
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
    expect(pages.map((p) => p.key).filter((k) => !keys.includes(k))).toEqual([]);
    expect(keys.filter((k) => !pages.some((p) => p.key === k))).toEqual([]);
  });
  it("have a description, steps and an Arabic version of the same shape", () => {
    for (const g of PAGE_GUIDES) {
      expect(g.what.length, g.key).toBeGreaterThan(30);
      expect(g.steps.length, g.key).toBeGreaterThanOrEqual(2);
      expect(g.steps.length, g.key).toBeLessThanOrEqual(8);
      for (const k of ["steps", "outputs", "required"] as const) expect(g.ar[k].length, `${g.key}.${k}`).toBe(g[k].length);
      expect(g.ar.tips?.length ?? 0, `${g.key}.tips`).toBe(g.tips?.length ?? 0);
      expect(/[؀-ۿ]/.test(g.ar.what), `${g.key} Arabic`).toBe(true);
      for (const t of [g.what, ...g.steps, ...g.outputs, ...g.required, ...(g.tips ?? [])]) expect(t.trim(), g.key).toBe(t);
    }
  });
  it("template pages fall back to the template library guide", () => {
    expect(guideFor(TEMPLATE_PAGES[0].key)).toBeDefined();
    expect(guideFor("p.plan", "ar")?.what).toMatch(/[؀-ۿ]/);
  });
});
