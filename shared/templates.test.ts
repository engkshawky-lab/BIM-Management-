import { describe, expect, it } from "vitest";
import { templates } from "./data/templates";
import { checkDocument } from "./quality";

// Structural quality of every document template.
describe("document templates", () => {
  it("have unique ids and codes", () => {
    expect(new Set(templates.map((t) => t.id)).size).toBe(templates.length);
    const dup = templates.map((t) => t.code).filter((c, i, a) => a.indexOf(c) !== i);
    expect(dup).toEqual([]);
  });
  for (const t of templates) {
    describe(`${t.code} ${t.title}`, () => {
      it("has title, purpose, clause references and sections", () => {
        expect(t.title.length).toBeGreaterThan(5);
        expect(t.purpose.length).toBeGreaterThan(20);
        expect(t.clauseRefs.length).toBeGreaterThan(0);
        expect(t.sections.length).toBeGreaterThan(0);
      });
      it("has unique section and field ids, and sections with guidance and fields", () => {
        expect(new Set(t.sections.map((s) => s.id)).size).toBe(t.sections.length);
        const fields = t.sections.flatMap((s) => s.fields.map((f) => f.id));
        expect(fields.filter((f, i) => fields.indexOf(f) !== i)).toEqual([]);
        // exports number sections automatically, so titles must not carry their own numbers
        for (const s of t.sections) { expect(s.title, s.title).not.toMatch(/^\d+\.\s/); expect(s.title.trim()).not.toBe(""); expect(s.guidance.trim().length).toBeGreaterThan(5); expect(s.fields.length).toBeGreaterThan(0); }
      });
      it("tables have columns and default rows of matching width", () => {
        for (const f of t.sections.flatMap((s) => s.fields)) {
          if (f.type !== "table") continue;
          expect(f.columns?.length ?? 0).toBeGreaterThan(1);
          for (const r of f.defaultRows ?? []) expect(r.length, `${f.id} row ${JSON.stringify(r)}`).toBe(f.columns!.length);
        }
      });
      it("selects have options and labels are clean", () => {
        for (const f of t.sections.flatMap((s) => s.fields)) {
          if (f.type === "select") expect(f.options?.length ?? 0).toBeGreaterThan(1);
          expect(f.label).toBe(f.label.trim());
          expect(f.label).not.toMatch(/\s{2,}|undefined|TODO|TBD/);
        }
      });
      it("the quality checker runs on an empty document without crashing", () => {
        expect(() => checkDocument(t, {}, { containerName: "", projectCode: "TWA" })).not.toThrow();
      });
    });
  }
});
