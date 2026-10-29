import { describe, expect, it } from "vitest";
import { checkNames, formatMsg, splitName, suggestName, type Msg } from "./namingCheck";
import { dueBucket } from "./planRows";

const text = (ms: Msg[]) => ms.map((m) => formatMsg(m)).join(" ");

const rules = { separator: "-", projectCode: "HOS01" };

describe("naming checker", () => {
  it("accepts a conforming name with status and revision, and strips path and extension", () => {
    const r = checkNames(["C:\\CDE\\WIP\\HOS01-ABC-ZZ-01-DR-A-0001-S2-P01.pdf"], rules).results[0];
    expect(r.errors).toEqual([]);
    expect(r.ext).toBe("pdf");
    expect(r.suitability).toBe("S2");
    expect(r.revision).toBe("P01");
    expect(r.container).toBe("HOS01-ABC-ZZ-01-DR-A-0001");
  });

  it("splits names without an extension", () => {
    expect(splitName("HOS01-ABC-ZZ-01-M3-A-0001")).toEqual({ base: "HOS01-ABC-ZZ-01-M3-A-0001", ext: "" });
  });

  it("flags wrong project code, bad fields and suggests a fix", () => {
    const r = checkNames(["hos01_abc_zz_01_dr_a_12.dwg"], rules).results[0];
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.suggestion).toBe("HOS01-ABC-ZZ-01-DR-A-0012.dwg");
    expect(checkNames(["XYZ-ABC-ZZ-01-DR-A-0001"], rules).results[0].errors.map((m) => formatMsg(m)).join(" ")).toMatch(/does not match the project code HOS01/);
  });

  it("warns on non-standard codes and unknown originators", () => {
    const r = checkNames(["HOS01-QQQ-ZZ-01-QQ-A-0001"], { ...rules, originators: ["ABC"] }).results[0];
    expect(r.errors).toEqual([]);
    expect(text(r.warnings)).toMatch(/Type "QQ" is not a UK National Annex code/);
    expect(text(r.warnings)).toMatch(/not in the project's originator list/);
  });

  it("rejects unexpected trailing fields and finds duplicates", () => {
    expect(checkNames(["HOS01-ABC-ZZ-01-DR-A-0001-FINAL"], rules).results[0].errors.map((m) => formatMsg(m)).join(" ")).toMatch(/Unexpected extra field "FINAL"/);
    const rep = checkNames(["HOS01-ABC-ZZ-01-DR-A-0001.pdf", "", "HOS01-ABC-ZZ-01-DR-A-0001.pdf", "HOS01-ABC-ZZ-01-DR-A-0001.dwg"], rules);
    expect(rep.results).toHaveLength(3);
    expect(text(rep.results[1].errors)).toBe("Duplicate of line 1.");
    expect(rep.results[2].errors).toEqual([]);
  });

  it("matches names to the delivery plan and lists containers not delivered", () => {
    const plan = ["HOS01-ABC-ZZ-01-DR-A-0001", "HOS01-ABC-ZZ-01-DR-A-0002"];
    const rep = checkNames(["HOS01-ABC-ZZ-01-DR-A-0001-S2-P01.pdf", "HOS01-ABC-ZZ-01-DR-A-0009.pdf"], rules, plan);
    expect(rep.results[0].inPlan).toBe(true);
    expect(rep.results[1].inPlan).toBe(false);
    expect(text(rep.results[1].warnings)).toMatch(/Not in the delivery plan/);
    expect(rep.notDelivered).toEqual(["HOS01-ABC-ZZ-01-DR-A-0002"]);
    expect(rep.counts).toEqual({ total: 2, ok: 1, errors: 0, warnings: 1 });
  });

  it("keeps the configured separator and project code in suggestions", () => {
    expect(suggestName("abc ORG zz 01 dr a 7", { separator: "-", projectCode: "HOS01" })).toBe("HOS01-ORG-ZZ-01-DR-A-0007");
  });
});

describe("due buckets", () => {
  const today = "2026-10-29";
  it("sorts open containers by due date and skips published ones", () => {
    expect(dueBucket({ due: "2026-10-28", status: "Planned" }, today)).toBe("overdue");
    expect(dueBucket({ due: "2026-11-05", status: "In progress" }, today)).toBe("week");
    expect(dueBucket({ due: "2026-11-10", status: "Shared" }, today)).toBe("fortnight");
    expect(dueBucket({ due: "2026-12-30", status: "Planned" }, today)).toBe("later");
    expect(dueBucket({ due: "", status: "Planned" }, today)).toBe("undated");
    expect(dueBucket({ due: "2026-10-01", status: "Published" }, today)).toBeNull();
  });
});
