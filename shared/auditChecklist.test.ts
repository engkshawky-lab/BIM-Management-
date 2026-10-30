import { describe, expect, it } from "vitest";
import {
  MAX_ITEMS, auditReportMarkdown, buildChecklist, clipEvidence, normaliseStatus, sanitiseRegister, sanitiseResults, scoreAudit, toRows,
  type AuditRow, type AuditScope,
} from "./auditChecklist";

const row = (p: Partial<AuditRow>): AuditRow => ({
  id: "X", part: 2, clauseOrActivity: "ISO 19650-2 5.1.1", requirement: "Appoint the information management function", evidenceHint: "",
  weight: 1, source: "clause", status: "conformant", evidence: "", finding: "", action: "", severity: "observation", ...p,
});

describe("buildChecklist", () => {
  const full: AuditScope = { parts: [1, 2, 5], role: "appointing", stage: "handover" };

  it("is deterministic with unique ids", () => {
    const a = buildChecklist(full), b = buildChecklist(full);
    expect(a).toEqual(b);
    expect(new Set(a.map((x) => x.id)).size).toBe(a.length);
  });

  it("stays within 40–120 items for typical scopes", () => {
    const scopes: AuditScope[] = [
      full, { parts: [1, 2, 5], role: "lead", stage: "design" }, { parts: [2], role: "lead", stage: "delivery" },
      { parts: [1, 2], role: "appointing", stage: "tender" }, { parts: [1], role: "lead", stage: "need" }, { parts: [2, 5], role: "lead", stage: "operation" },
    ];
    for (const s of scopes) {
      const n = buildChecklist(s).length;
      expect(n, JSON.stringify(s)).toBeGreaterThanOrEqual(40);
      expect(n, JSON.stringify(s)).toBeLessThanOrEqual(MAX_ITEMS);
    }
  });

  it("filters by stage reached", () => {
    const early = buildChecklist({ parts: [2], role: "lead", stage: "appointment" }).map((x) => x.id);
    expect(early).toContain("P2-5.4.2");
    expect(early).not.toContain("P2-5.7.1");
    expect(early.some((id) => id.startsWith("P2-G-handover"))).toBe(false);
    const late = buildChecklist({ parts: [2], role: "lead", stage: "delivery" }).map((x) => x.id);
    expect(late).toContain("P2-5.7.1");
  });

  it("filters by role", () => {
    const lead = buildChecklist({ parts: [2], role: "lead", stage: "handover" }).map((x) => x.id);
    const app = buildChecklist({ parts: [2], role: "appointing", stage: "handover" }).map((x) => x.id);
    expect(lead).toContain("P2-5.3.2");
    expect(lead).not.toContain("P2-5.1.4");
    expect(app).toContain("P2-5.1.4");
    expect(app).toContain("P2-5.7.4");
  });

  it("only includes the selected parts, in part order, with weights", () => {
    const l = buildChecklist({ parts: [5, 1], role: "appointing", stage: "design" });
    expect(new Set(l.map((x) => x.part))).toEqual(new Set([1, 5]));
    const firstFive = l.findIndex((x) => x.part === 5);
    expect(l.slice(firstFive).every((x) => x.part === 5)).toBe(true);
    expect(l.every((x) => x.weight > 0 && x.requirement && x.evidenceHint && x.clauseOrActivity)).toBe(true);
  });
});

describe("sanitiseResults", () => {
  it("keeps requested ids once, coerces enums and fills missing ids", () => {
    const out = sanitiseResults([
      { id: "A", status: "Non-conformant", severity: "CRITICAL", evidence: "bep.pdf: “x”", finding: "f", action: "a" },
      { id: "A", status: "conformant" },
      { id: "Z", status: "conformant" },
      { id: "B", status: "N/A", severity: "major" },
    ], ["A", "B", "C"]);
    expect(out.map((r) => r.id)).toEqual(["A", "B", "C"]);
    expect(out[0]).toMatchObject({ status: "nonconformant", severity: "major" });
    expect(out[1]).toMatchObject({ status: "not applicable", severity: "observation" });
    expect(out[2]).toMatchObject({ status: "not evidenced", aiMissing: true });
  });
  it("limits evidence quotes to 20 words", () => {
    const q = Array.from({ length: 30 }, (_, i) => `w${i}`).join(" ");
    const e = clipEvidence(`EIR.docx: “${q}”`);
    expect(e.startsWith("EIR.docx: “w0")).toBe(true);
    expect(e).toContain("w19…”");
    expect(e).not.toContain("w20");
  });
  it("normalises status synonyms", () => {
    expect(normaliseStatus("partial")).toBe("partially");
    expect(normaliseStatus("not_evidenced")).toBe("not evidenced");
    expect(normaliseStatus("???")).toBe("not evidenced");
  });
  it("de-duplicates the evidence register", () => {
    expect(sanitiseRegister([{ file: "a.pdf", describes: "EIR" }, { file: "a.pdf" }, { describes: "x" }])).toEqual([{ file: "a.pdf", describes: "EIR" }]);
  });
});

describe("scoreAudit", () => {
  it("weights conformance and excludes not applicable", () => {
    const s = scoreAudit([
      row({ id: "1", status: "conformant", weight: 3 }),
      row({ id: "2", status: "partially", weight: 2, severity: "minor" }),
      row({ id: "3", status: "nonconformant", weight: 1, severity: "major" }),
      row({ id: "4", status: "not applicable", weight: 5 }),
    ]);
    expect(s.score).toBe(67); // (3 + 1) / 6
    expect(s.bySeverity).toEqual({ major: 1, minor: 1, observation: 0 });
    expect(s.majors.map((r) => r.id)).toEqual(["3"]);
    expect(s.byPart).toHaveLength(1);
  });
  it("splits by part", () => {
    const s = scoreAudit([row({ part: 1, status: "conformant" }), row({ part: 5, status: "not evidenced", severity: "major" })]);
    expect(s.byPart.map((p) => [p.part, p.score])).toEqual([[1, 100], [5, 0]]);
  });
  it("returns 0 for no rows", () => expect(scoreAudit([]).score).toBe(0));
});

describe("auditReportMarkdown", () => {
  it("contains the formal sections, nonconformities and the disclaimer", () => {
    const rows = [row({ id: "P2-5.1.1", status: "nonconformant", severity: "major", finding: "No IM function named", action: "Appoint one", edited: true }), row({ id: "P2-5.1.2" })];
    const md = auditReportMarkdown({ projectName: "Depot", scope: { parts: [2], role: "appointing", stage: "tender" }, date: "2026-10-30", evidence: [{ file: "eir.pdf", describes: "EIR" }] }, rows);
    for (const h of ["## 1. Scope", "## 2. Method", "## 3. Summary", "## 4. Findings", "## 5. Nonconformities", "## 6. Observations", "## 7. Evidence register", "## 8. Disclaimer"]) expect(md).toContain(h);
    expect(md).toContain("NC-01 (Major) P2-5.1.1");
    expect(md).toContain("decision support, not certification");
    expect(md).toContain("eir.pdf");
    expect(toRows(rows)[1]).toContain("Yes");
  });
});
