import { describe, expect, it } from "vitest";
import { LEGAL_DOCS, TRADEMARK_NOTICE } from "./legal";

describe("legal data", () => {
  it("has the four documents", () => {
    expect(LEGAL_DOCS.map((d) => d.id).sort()).toEqual(["cookies", "notices", "privacy", "terms"]);
  });

  it("gives every doc a title, a summary and sections", () => {
    for (const doc of LEGAL_DOCS) {
      expect(doc.title.trim(), doc.id).not.toBe("");
      expect(doc.summary.trim(), doc.id).not.toBe("");
      expect(doc.sections.length, doc.id).toBeGreaterThan(0);
    }
  });

  it("gives every section a heading and at least one paragraph", () => {
    for (const doc of LEGAL_DOCS) {
      for (const s of doc.sections) {
        expect(s.heading.trim(), doc.id).not.toBe("");
        expect(s.paragraphs.length, `${doc.id}: ${s.heading}`).toBeGreaterThan(0);
        expect(s.paragraphs.every((p) => p.trim() !== ""), `${doc.id}: ${s.heading}`).toBe(true);
      }
    }
  });

  it("mentions Autodesk and ISO in the trademark notice", () => {
    expect(TRADEMARK_NOTICE).toContain("Autodesk");
    expect(TRADEMARK_NOTICE).toContain("ISO");
  });
});
