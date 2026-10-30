import { describe, expect, it } from "vitest";
import { ALL_PAGES } from "../../../client/src/shell/nav";
import { templates } from "../templates";
import { ROLE_IDS, STAGE_IDS } from "../workflow/types";
import { DOC_GUIDES } from ".";

const iso19650 = templates.filter((t) => t.standard === "iso19650");
const paths = new Set(ALL_PAGES.filter((x) => x.scope === "global").map((x) => x.path));

describe("document guides", () => {
  it("has one guide for every ISO 19650 template", () => {
    expect(DOC_GUIDES.map((g) => g.id).sort()).toEqual(iso19650.map((t) => t.id).sort());
    for (const g of DOC_GUIDES) expect(g.code, g.id).toBe(templates.find((t) => t.id === g.id)!.code);
  });

  it("explains the template's sections in order", () => {
    for (const g of DOC_GUIDES) {
      const titles = templates.find((t) => t.id === g.id)!.sections.map((s) => s.title);
      const guide = g.sections.map((s) => s.title);
      // every guide section is a template section, in the template's order (the identification section may be skipped)
      expect(guide.every((x) => titles.includes(x)), g.id).toBe(true);
      expect(guide, g.id).toEqual(titles.filter((x) => guide.includes(x)));
      expect(guide.length, g.id).toBeGreaterThanOrEqual(titles.length - 1);
    }
  });

  it("uses real roles, stages and pages", () => {
    for (const g of DOC_GUIDES) {
      for (const r of [g.writer, g.approver, ...g.contributors]) expect(ROLE_IDS, `${g.id}: ${r}`).toContain(r);
      for (const s of g.stages) expect(STAGE_IDS, `${g.id}: ${s}`).toContain(s);
      for (const x of g.tools) expect(paths.has(x.path) || /^\/parts\/19650-[1-6]$/.test(x.path), `${g.id}: ${x.path}`).toBe(true);
      expect(g.checklist.length, g.id).toBeGreaterThanOrEqual(7);
      expect(g.howTo.length, g.id).toBeGreaterThanOrEqual(6);
    }
  });
});
