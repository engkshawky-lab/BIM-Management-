import { describe, expect, it } from "vitest";
import { templates } from "../templates";
import { DEEP_DIVES, deepDiveFor } from ".";

describe("document deep dives", () => {
  it("covers the EIR, BEP and AIR with full content", () => {
    expect(DEEP_DIVES.map((d) => d.id)).toEqual(["eir", "bep-post", "air"]);
    expect(deepDiveFor("bep-pre")?.id).toBe("bep-post");
    for (const d of DEEP_DIVES) {
      expect(templates.some((t) => t.id === d.id), d.id).toBe(true);
      expect(d.example.length, d.id).toBeGreaterThanOrEqual(6);
      expect(d.caseStudies.length, d.id).toBeGreaterThanOrEqual(5);
      expect(d.clauses.length, d.id).toBeGreaterThanOrEqual(25);
      expect(d.rubric.reduce((a, r) => a + r.weight, 0), d.id).toBe(100);
      for (const s of d.example) if (s.table) for (const r of s.table.rows) expect(r.length, `${d.id} ${s.title}`).toBe(s.table.columns.length);
    }
  });

  it("uses one fictional project across the set", () => {
    expect(new Set(DEEP_DIVES.map((d) => d.project.code))).toEqual(new Set(["GHX"]));
  });
});
