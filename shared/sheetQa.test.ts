import { describe, expect, it } from "vitest";
import {
  checkRows, checkSheet, emptyTitleBlock, issuesText, latestRevision, overall, parseSheetDate, revisionRank, sanitiseSheets, sanitiseTitleBlock,
  summarise, toRows, transmittalList, type SheetResult, type TitleBlock,
} from "./sheetQa";

const rules = { separator: "-", projectCode: "HOS01" };
const good = (over: Partial<TitleBlock> = {}): TitleBlock => ({
  ...emptyTitleBlock(),
  drawingNumber: "HOS01-ABC-ZZ-01-DR-A-0001", title: "Ground floor plan", revision: "P02", status: "S3", scale: "1:100", paperSize: "A1",
  date: "12/03/2026", drawnBy: "AB", checkedBy: "CD", approvedBy: "EF", projectName: "City Hospital", projectCode: "HOS01", originator: "ABC",
  purpose: "For review and comment",
  revisions: [{ rev: "P01", date: "01/02/2026", description: "First issue", by: "AB" }, { rev: "P02", date: "12/03/2026", description: "Updated to comments", by: "AB" }],
  ...over,
});
const get = (b: TitleBlock, id: string, fileName = "HOS01-ABC-ZZ-01-DR-A-0001.pdf", extra: object = {}) =>
  checkSheet(b, { fileName, rules, ...extra }).checks.find((c) => c.id === id);

describe("checkSheet", () => {
  it("passes a clean sheet", () => {
    const r = checkSheet(good(), { fileName: "HOS01-ABC-ZZ-01-DR-A-0001-S3-P02.pdf", rules });
    expect(r.checks.filter((c) => c.status !== "pass")).toEqual([]);
    expect(r.score).toBe(100);
    expect(overall(r.checks)).toBe("pass");
  });

  it("fails a bad container name and suggests a fix", () => {
    const c = get(good({ drawingNumber: "hos01-abc-zz-01-dr-a-1" }), "number");
    expect(c?.status).toBe("fail");
    expect(c?.detail).toMatch(/upper case/);
    expect(c?.detail).toMatch(/Suggested name: HOS01-ABC-ZZ-01-DR-A-0001/);
  });

  it("flags a wrong project code against the rules", () => {
    expect(get(good({ drawingNumber: "XYZ99-ABC-ZZ-01-DR-A-0001" }), "number")?.status).toBe("fail");
  });

  it("checks revision format and status/revision consistency", () => {
    expect(get(good({ revision: "REV A" }), "revision")?.status).toBe("fail");
    expect(get(good({ revision: "P02.01" }), "revision")?.status).toBe("warn");
    expect(get(good({ status: "A1", revision: "P02" }), "status-revision")?.status).toBe("fail");
    expect(get(good({ status: "S2", revision: "C01" }), "status-revision")?.status).toBe("fail");
    expect(get(good({ status: "A1", revision: "C01", revisions: [{ rev: "C01", date: "", description: "", by: "" }], purpose: "For construction" }), "status-revision")?.status).toBe("pass");
    expect(get(good({ status: "X9" }), "status")?.status).toBe("fail");
    expect(get(good({ status: "S0" }), "status")?.status).toBe("warn");
  });

  it("compares the title block revision with the latest revision table row", () => {
    const c = get(good({ revision: "P01" }), "revision-table");
    expect(c?.status).toBe("fail");
    expect(c?.detail).toMatch(/latest revision table entry is P02/);
    expect(get(good({ revisions: [] }), "revision-table")?.status).toBe("warn");
    // table listed newest first still finds the latest
    expect(get(good({ revisions: [{ rev: "P02", date: "", description: "", by: "" }, { rev: "P01", date: "", description: "", by: "" }] }), "revision-table")?.status).toBe("pass");
  });

  it("checks the file name against the drawing number", () => {
    expect(get(good(), "file-name", "HOS01-ABC-ZZ-01-DR-A-0001.pdf")?.status).toBe("pass");
    expect(get(good(), "file-name", "Ground floor FINAL.pdf")?.status).toBe("fail");
    expect(get(good(), "file-name", "HOS01-ABC-ZZ-01-DR-A-0001-S3-P01.pdf")?.status).toBe("fail");
    expect(get(good(), "file-name", "Drawing set.pdf", { sheetsInFile: 12 })?.status).toBe("pass");
  });

  it("requires date and scale, and sign-off for S3+", () => {
    expect(get(good({ date: "" }), "date")?.status).toBe("fail");
    expect(get(good({ date: "sometime" }), "date")?.status).toBe("warn");
    expect(get(good({ scale: "" }), "scale")?.status).toBe("fail");
    expect(get(good({ scale: "1:50 @ A1, 1:20" }), "scale")?.status).toBe("pass");
    expect(get(good({ scale: "NTS" }), "scale")?.status).toBe("pass");
    expect(get(good({ checkedBy: "", approvedBy: "" }), "signoff")?.status).toBe("fail");
    expect(get(good({ status: "S2", purpose: "For information", approvedBy: "" }), "signoff")?.status).toBe("warn");
  });

  it("warns when the purpose of issue does not match the status", () => {
    expect(get(good({ purpose: "For construction" }), "purpose")?.status).toBe("warn");
    expect(get(good({ purpose: "" }), "purpose")?.status).toBe("warn");
  });

  it("matches the delivery plan, with due dates", () => {
    const plan = [{ name: "HOS01-ABC-ZZ-01-DR-A-0001", due: "2026-03-01" }];
    expect(get(good(), "plan")).toBeUndefined();
    expect(get(good(), "plan", undefined, { planContainers: plan })?.status).toBe("warn"); // dated after due
    expect(get(good(), "plan", undefined, { planContainers: [{ name: "HOS01-ABC-ZZ-01-DR-A-0001", due: "2026-04-01" }] })?.status).toBe("pass");
    expect(get(good(), "plan", undefined, { planContainers: ["HOS01-ABC-ZZ-01-DR-A-0002"] })?.status).toBe("warn");
  });
});

describe("helpers", () => {
  it("ranks revisions", () => {
    expect(revisionRank("C01")! > revisionRank("P09.02")!).toBe(true);
    expect(revisionRank("P01.02")! > revisionRank("P01")!).toBe(true);
    expect(revisionRank("A")).toBeNull();
    expect(latestRevision([{ rev: "A", date: "", description: "", by: "" }, { rev: "B", date: "", description: "", by: "" }])?.rev).toBe("B");
  });
  it("parses common dates", () => {
    expect(parseSheetDate("12/03/2026")).toBe("2026-03-12");
    expect(parseSheetDate("2026-03-12")).toBe("2026-03-12");
    expect(parseSheetDate("12 Mar 26")).toBe("2026-03-12");
    expect(parseSheetDate("MAR 2026")).toBe("2026-03-01");
    expect(parseSheetDate("31/02/2026")).toBeNull();
  });
  it("sanitises AI output", () => {
    const s = sanitiseSheets({ sheets: [{ page: "2", confidence: "HIGH", titleBlock: { drawingNumber: " HOS01 - ABC ", revision: "p02", status: "n/a", revisions: [{ rev: "p01" }, {}] } }, "junk", { titleBlock: null }] });
    expect(s).toHaveLength(2);
    expect(s[0]).toMatchObject({ page: 2, confidence: "high" });
    expect(s[0].titleBlock).toMatchObject({ drawingNumber: "HOS01-ABC", revision: "P02", status: "" });
    expect(s[0].titleBlock.revisions).toEqual([{ rev: "P01", date: "", description: "", by: "" }]);
    expect(s[1]).toMatchObject({ page: 3, confidence: "medium" });
    expect(sanitiseTitleBlock("x")).toEqual(emptyTitleBlock());
  });
  it("summarises and exports", () => {
    const mk = (b: TitleBlock, file: string): SheetResult => ({ file, page: 1, titleBlock: b, confidence: "high", notes: "", ...checkSheet(b, { fileName: file, rules }) });
    const res = [mk(good(), "HOS01-ABC-ZZ-01-DR-A-0001.pdf"), mk(good({ revision: "P01" }), "bad.pdf")];
    const s = summarise(res);
    expect(s).toMatchObject({ sheets: 2, pass: 1, fail: 1 });
    expect(s.byCheck["revision-table"]).toEqual({ pass: 1, warn: 0, fail: 1 });
    const t = toRows(res);
    expect(t.rows[0]).toHaveLength(t.header.length);
    expect(checkRows(res).rows.length).toBe(res[0].checks.length + res[1].checks.length);
    expect(transmittalList(res)).toBe("HOS01-ABC-ZZ-01-DR-A-0001\tS3\tP01\tGround floor plan");
    expect(issuesText(res)).toMatch(/\[FAIL\] Revision table matches title block/);
  });
});
