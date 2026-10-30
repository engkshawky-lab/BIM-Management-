import { describe, expect, it } from "vitest";
import { nextTransmittalNumber, parseLine, parseTransmittalList, purposeOfIssue, transmittalCsvRows, transmittalMarkdown, transmittalNumber } from "./transmittal";
import { parseMarkdown } from "./mdBlocks";

describe("transmittal", () => {
  it("maps status codes to a purpose of issue", () => {
    expect(purposeOfIssue("S1")).toBe("For coordination");
    expect(purposeOfIssue("s2")).toBe("For information");
    expect(purposeOfIssue("S3")).toBe("For review and comment");
    expect(purposeOfIssue("S4")).toMatch(/authorisation/);
    expect(purposeOfIssue("S6")).toBe("For PIM authorisation");
    expect(purposeOfIssue("S7")).toBe("For AIM authorisation");
    expect(purposeOfIssue("A2")).toMatch(/^For construction.*stage 2/);
    expect(purposeOfIssue("CR")).toBe("As-constructed record");
    expect(purposeOfIssue("ZZ")).toBe("");
  });

  it("splits tab, comma and space separated lines", () => {
    expect(parseLine("PRJ01-ABC-ZZ-00-DR-A-0001.pdf\tS2\tP01\tGround floor plan")).toEqual({ name: "PRJ01-ABC-ZZ-00-DR-A-0001.pdf", status: "S2", revision: "P01", title: "Ground floor plan" });
    expect(parseLine("PRJ01-ABC-ZZ-00-DR-A-0001.pdf, p02, s3")).toMatchObject({ status: "S3", revision: "P02" });
    expect(parseLine("PRJ01-ABC-ZZ-00-DR-A-0001.pdf S1 P03")).toMatchObject({ status: "S1", revision: "P03", title: "" });
  });

  it("builds rows from names with suffix fields or columns and flags problems", () => {
    const rows = parseTransmittalList([
      "PRJ01-ABC-ZZ-00-DR-A-0001-S2-P01.pdf",
      "PRJ01-ABC-ZZ-00-M3-S-0002.ifc\tS1\tP02\tStructural model",
      "prj01-abc-zz-00-dr-a-0003.pdf",
      "",
      "PRJ01-ABC-ZZ-00-DR-A-0004.pdf, A1, P01",
    ].join("\n"), { projectCode: "PRJ01" });
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ status: "S2", revision: "P01", purpose: "For information", valid: true, issues: [] });
    expect(rows[1]).toMatchObject({ status: "S1", revision: "P02", title: "Structural model", valid: true });
    expect(rows[2].valid).toBe(false);
    expect(rows[2].issues.join(" ")).toMatch(/upper case/);
    expect(rows[2].issues.join(" ")).toMatch(/No status/);
    expect(rows[2].issues.join(" ")).toMatch(/Suggested name: PRJ01-ABC-ZZ-00-DR-A-0003.pdf/);
    expect(rows[3].valid).toBe(false);
    expect(rows[3].issues.join(" ")).toMatch(/contractual revision/);
  });

  it("checks the project code when it is a valid code", () => {
    const [r] = parseTransmittalList("XYZ-ABC-ZZ-00-DR-A-0001-S2-P01", { projectCode: "PRJ01" });
    expect(r.valid).toBe(false);
    expect(r.issues.join(" ")).toMatch(/does not match the project code/);
    const [ok] = parseTransmittalList("XYZ-ABC-ZZ-00-DR-A-0001-S2-P01", { projectCode: "Hospital extension" });
    expect(ok.valid).toBe(true);
  });

  it("numbers transmittals", () => {
    expect(transmittalNumber("prj01", 7)).toBe("PRJ01-TRN-0007");
    expect(transmittalNumber("", 0)).toBe("PRJ-TRN-0001");
    expect(nextTransmittalNumber("PRJ01", ["PRJ01-TRN-0003", "PRJ01-TRN-0011", "OTH-TRN-0050"])).toBe("PRJ01-TRN-0012");
    expect(nextTransmittalNumber("PRJ01")).toBe("PRJ01-TRN-0001");
  });

  it("writes a transmittal sheet that parses as Markdown tables", () => {
    const rows = parseTransmittalList("PRJ01-ABC-ZZ-00-DR-A-0001-S3-P01.pdf\tPlan | level 0\nbad name");
    const md = transmittalMarkdown({ project: "PRJ01", from: "ABC Architects", to: "Client", date: "2026-10-30", number: "PRJ01-TRN-0001", reason: "Stage 3 review" }, rows);
    const blocks = parseMarkdown(md);
    expect(blocks[0]).toEqual({ k: "h", level: 1, text: "Transmittal PRJ01-TRN-0001" });
    const tables = blocks.filter((b) => b.k === "table");
    expect(tables).toHaveLength(3);
    const schedule = tables[1] as { header: string[]; rows: string[][] };
    expect(schedule.rows[0][2]).toBe("Plan | level 0");
    expect(schedule.rows[0][5]).toBe("For review and comment");
    expect(md).toMatch(/Naming and status exceptions/);
    expect(md).toMatch(/Acknowledgement of receipt/);
  });

  it("exports CSV rows", () => {
    const { header, rows } = transmittalCsvRows(parseTransmittalList("PRJ01-ABC-ZZ-00-DR-A-0001-S2-P01.pdf"));
    expect(header[1]).toBe("Container name");
    expect(rows[0]).toEqual(["1", "PRJ01-ABC-ZZ-00-DR-A-0001-S2-P01.pdf", "pdf", "", "S2", "P01", "For information", "Yes", ""]);
  });
});
