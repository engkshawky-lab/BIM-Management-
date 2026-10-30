import { describe, expect, it } from "vitest";
import { partsPractice } from ".";
import { ALL_PAGES } from "../../../client/src/shell/nav";

describe("ISO 19650 practice material", () => {
  it("has examples, questions and a quiz for all six parts", () => {
    expect(partsPractice.map((p) => p.part)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const p of partsPractice) {
      expect(p.examples.length, `part ${p.part} examples`).toBeGreaterThanOrEqual(4);
      expect(p.faq.length, `part ${p.part} faq`).toBeGreaterThanOrEqual(10);
      expect(p.quiz.length, `part ${p.part} quiz`).toBeGreaterThanOrEqual(6);
    }
  });

  it("has well-formed quiz questions with one valid answer", () => {
    for (const p of partsPractice) for (const [q, options, right, why] of p.quiz) {
      expect(options.length, q).toBe(4);
      expect(right, q).toBeGreaterThanOrEqual(0);
      expect(right, q).toBeLessThan(options.length);
      expect(new Set(options).size, q).toBe(4);
      expect(why.length, q).toBeGreaterThan(10);
    }
  });

  it("links examples only to pages that exist", () => {
    const paths = new Set(ALL_PAGES.filter((x) => x.scope === "global").map((x) => x.path));
    for (const p of partsPractice) for (const ex of p.examples) if (ex.tool) expect(paths.has(ex.tool.path), `${ex.title}: ${ex.tool.path}`).toBe(true);
  });
});
