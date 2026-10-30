import { describe, expect, it } from "vitest";
import { GLOSSARY, GLOSSARY_CATEGORIES, categoryCounts, findEntry, lettersIndex, normalise, searchGlossary } from "./glossary";
import { glossary19650 } from "./iso19650";
import { glossary42001 } from "./iso42001";

const ARABIC = /[؀-ۿ]/;

describe("glossary data", () => {
  it("has at least 300 entries", () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(300);
  });

  it("has unique terms and abbreviations", () => {
    const terms = GLOSSARY.map((e) => e.term.toLowerCase());
    expect(terms.filter((t, i) => terms.indexOf(t) !== i)).toEqual([]);
    const abbrs = GLOSSARY.flatMap((e) => (e.abbr ? [e.abbr.toLowerCase()] : []));
    expect(abbrs.filter((a, i) => abbrs.indexOf(a) !== i)).toEqual([]);
    // an abbreviation must not equal another entry's term, or related links would be ambiguous
    const clash = GLOSSARY.filter((e) => e.abbr && GLOSSARY.some((o) => o !== e && o.term.toLowerCase() === e.abbr!.toLowerCase()));
    expect(clash.map((e) => e.abbr)).toEqual([]);
  });

  it("resolves every related reference", () => {
    const missing = GLOSSARY.flatMap((e) => (e.related ?? []).filter((r) => !findEntry(r)).map((r) => `${e.term} → ${r}`));
    expect(missing).toEqual([]);
  });

  it("does not relate an entry to itself", () => {
    const self = GLOSSARY.filter((e) => (e.related ?? []).some((r) => findEntry(r) === e)).map((e) => e.term);
    expect(self).toEqual([]);
  });

  it("gives every entry an Arabic term, an English and an Arabic definition", () => {
    for (const e of GLOSSARY) {
      expect(e.ar.trim(), e.term).not.toBe("");
      expect(ARABIC.test(e.ar) || /^[A-Za-z0-9 ./\-]+$/.test(e.ar), e.term).toBe(true);
      expect(e.definition.trim().length, e.term).toBeGreaterThan(10);
      expect(ARABIC.test(e.definitionAr), e.term).toBe(true);
    }
  });

  it("uses only known categories, and every category has entries", () => {
    for (const e of GLOSSARY) expect(GLOSSARY_CATEGORIES).toContain(e.category);
    for (const c of categoryCounts()) expect(c.count, c.category).toBeGreaterThan(0);
    expect(categoryCounts().reduce((a, c) => a + c.count, 0)).toBe(GLOSSARY.length);
  });

  it("covers the core acronyms a BIM manager meets", () => {
    for (const a of ["AIM", "AIR", "BCF", "BEP", "CDE", "COBie", "DRM", "EIR", "IDS", "IFC", "LOD", "LOI", "LOIN", "MIDP", "MPDT", "MRM", "OIR", "PIM", "PIR", "TIDP", "CAFM", "CMMS", "GUID", "IFC4", "MVD", "BIMcollab", "PAS", "CDM", "RIBA", "NRM", "Uniclass", "OmniClass", "MasterFormat", "UniFormat", "ISO 7817"]) {
      expect(findEntry(a), a).toBeDefined();
    }
  });

  it("covers the existing ISO 19650 and ISO/IEC 42001 glossaries", () => {
    for (const g of [...glossary19650, ...glossary42001]) {
      expect(findEntry(g.abbr ?? g.term) ?? findEntry(g.term.replace("Organizational", "Organisational")), g.term).toBeDefined();
    }
  });

  it("uses the agreed Arabic for key ISO 19650 terms", () => {
    expect(findEntry("Appointing party")?.ar).toBe("الطرف المُعيِّن");
    expect(findEntry("Appointed party")?.ar).toBe("الطرف المُعيَّن");
    expect(findEntry("Lead appointed party")?.ar).toBe("الطرف المُعيَّن الرئيسي");
    expect(findEntry("Task team")?.ar).toBe("فريق المهمة");
    expect(findEntry("Information container")?.ar).toBe("حاوية المعلومات");
    expect(findEntry("CDE")?.ar).toBe("بيئة البيانات المشتركة");
  });
});

describe("searchGlossary", () => {
  it("finds MIDP first by its abbreviation", () => {
    expect(searchGlossary("MIDP")[0].abbr).toBe("MIDP");
    expect(searchGlossary("midp")[0].abbr).toBe("MIDP");
  });

  it("finds Arabic text, with or without diacritics", () => {
    expect(searchGlossary("خطة").length).toBeGreaterThan(3);
    expect(searchGlossary("خطة").some((e) => e.abbr === "BEP")).toBe(true);
    expect(searchGlossary("الطرف المعين")[0].term).toMatch(/appoint/i);
    expect(searchGlossary("حاويه المعلومات").some((e) => e.term === "Information container")).toBe(true);
  });

  it("finds trigger event", () => {
    expect(searchGlossary("trigger").some((e) => e.term === "Trigger event")).toBe(true);
    expect(searchGlossary("Trigger")[0].term).toBe("Trigger event");
  });

  it("returns everything for an empty query and nothing for nonsense", () => {
    expect(searchGlossary("  ").length).toBe(GLOSSARY.length);
    expect(searchGlossary("zzqqxx")).toEqual([]);
  });

  it("strips Arabic diacritics when normalising", () => {
    expect(normalise("المُعيَّن")).toBe(normalise("المعين"));
    expect(normalise("أإآ")).toBe("ااا");
  });
});

describe("lettersIndex", () => {
  it("counts every entry under exactly one letter", () => {
    const idx = lettersIndex();
    expect(idx.map((x) => x.letter)).toEqual(["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]);
    expect(idx.reduce((a, x) => a + x.count, 0)).toBe(GLOSSARY.length);
    expect(idx.find((x) => x.letter === "M")!.count).toBeGreaterThan(0);
  });
});
