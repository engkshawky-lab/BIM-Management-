import { describe, expect, it } from "vitest";
import { partDetails19650 } from "../parts19650Detail";
import { templates } from "../templates";
import { hubDigest, hubs } from "./index";

describe("topic hubs", () => {
  for (const hub of hubs) {
    it(`${hub.id}: ids are unique and blocks are well formed`, () => {
      expect(new Set(hub.sections.map((s) => s.id)).size).toBe(hub.sections.length);
      for (const s of hub.sections) {
        expect(new Set(s.tabs.map((t) => t.id)).size, `${s.id} tab ids`).toBe(s.tabs.length);
        for (const t of s.tabs) {
          expect(t.blocks.length, `${s.id}/${t.id} has blocks`).toBeGreaterThan(0);
          for (const b of t.blocks) {
            if (b.kind === "table") for (const r of b.rows) expect(r.length, `${s.id}/${t.id} "${b.title}" row width`).toBe(b.columns.length);
            if (b.kind === "quiz") for (const q of b.questions) expect(q.answer, `quiz answer for "${q.q}"`).toBeLessThan(q.options.length);
          }
        }
      }
      expect(hubDigest(hub).length).toBeGreaterThan(2000);
    });
  }
});

describe("ISO 19650 part details", () => {
  it("covers all six parts and links only to real templates", () => {
    expect(partDetails19650.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6]);
    const codes = new Set(templates.map((t) => t.code));
    for (const p of partDetails19650) for (const d of p.keyDocuments) if (d.templateCode) expect(codes.has(d.templateCode), `${p.id} → ${d.templateCode}`).toBe(true);
  });
});
