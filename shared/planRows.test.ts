import { describe, expect, it } from "vitest";
import { aggregateTidps, checkContainers, containerName, emptyRow, numberRows, starterRows, type PlanHeader } from "./planRows";

const header: PlanHeader = { projectName: "Riverside", projectCode: "rvc", appointingParty: "", leadAppointedParty: "", taskTeam: "", originator: "abc", discipline: "architecture", preparedBy: "", revision: "P01" };
const ms = [{ code: "M1", name: "Concept", date: "2027-03-01" }, { code: "M2", name: "Technical", date: "2027-09-01" }];

describe("delivery plan rows", () => {
  it("builds ISO 19650 container names", () => {
    expect(containerName(header, { volume: "z1", level: "02", type: "dr", role: "a", number: "12" })).toBe("RVC-ABC-Z1-02-DR-A-0012");
    expect(containerName({ projectCode: "", originator: "" }, { volume: "", level: "", type: "", role: "", number: "" })).toBe("PRJ-ORG-ZZ-XX-XX-Z-0001");
  });

  it("numbers rows uniquely per type and role, keeping given numbers", () => {
    const rows = numberRows([{ ...emptyRow(0, "A"), type: "DR", number: "0001" }, { ...emptyRow(1, "A"), type: "DR" }, { ...emptyRow(2, "A"), type: "M3" }]);
    expect(rows.map((r) => r.number)).toEqual(["0001", "0002", "0001"]);
  });

  it("flags duplicates, late dates, unknown milestones and circular dependencies", () => {
    const base = { ...emptyRow(0, "A"), title: "GA plans", type: "DR", number: "0001", loin: "1:100", responsible: "Lead", milestone: "M1", due: "2027-02-01" };
    const issues = checkContainers(header, [
      base,
      { ...base, ref: "C002" },                                             // same name as row 1
      { ...base, ref: "C003", number: "0003", due: "2027-04-01" },          // after M1
      { ...base, ref: "C004", number: "0004", milestone: "M9" },            // unknown milestone
      { ...base, ref: "C005", number: "0005", dependsOn: "C006" },
      { ...base, ref: "C006", number: "0006", dependsOn: "C005" },          // cycle
    ], ms);
    const text = issues.map((x) => x.message).join("\n");
    expect(text).toMatch(/Container RVC-ABC-ZZ-XX-DR-A-0001 is planned twice at M1/);
    expect(text).toMatch(/after milestone M1/);
    expect(text).toMatch(/Milestone M9 is not in the milestone list/);
    expect(text).toMatch(/Circular dependency/);
  });

  it("starter rows put models at every milestone and documents at the last", () => {
    const rows = starterRows(["architecture"], ms);
    const models = rows.filter((r) => r.type === "M3"), docs = rows.filter((r) => r.type !== "M3");
    expect(models.map((r) => r.milestone)).toEqual(["M1", "M2"]);
    expect(docs.every((r) => r.milestone === "M2" && r.due === "2027-09-01")).toBe(true);
    expect(new Set(rows.map((r) => containerName(header, r))).size).toBe(rows.length);
    expect(checkContainers(header, rows, ms).filter((x) => x.level === "error")).toEqual([]);
  });

  it("aggregates TIDPs into a MIDP with task teams and new refs", () => {
    const midp = aggregateTidps([{ taskTeam: "Architecture", rows: [emptyRow(0)] }, { taskTeam: "Structure", rows: [emptyRow(0), emptyRow(1)] }]);
    expect(midp.map((r) => `${r.ref} ${r.taskTeam}`)).toEqual(["C001 Architecture", "C002 Structure", "C003 Structure"]);
  });

  it("allows a container at several exchanges and converts to and from the MIDP template layout", async () => {
    const { rowsToMidp, midpToRows } = await import("./planRows");
    const base = { ...emptyRow(0, "A"), title: "Architectural model", type: "M3", number: "0001", loin: "LOD 300", responsible: "Lead", description: "Federated model", format: "RVT", exchange: "IFC" };
    const ms2 = [{ code: "M1", name: "Concept", date: "2027-02-15" }, { code: "M2", name: "Detailed", date: "2027-06-15" }];
    const rows = [{ ...base, milestone: "M1", due: "2027-02-01" }, { ...base, ref: "C002", milestone: "M2", due: "2027-06-01" }];
    expect(checkContainers(header, rows, ms2).map((x) => x.message).join()).not.toMatch(/planned twice/);
    const { exchanges, lines } = rowsToMidp(header, rows, ms2);
    expect(exchanges.map((x) => [x.key, x.name])).toEqual([["M1", "M1 Concept"], ["M2", "M2 Detailed"]]);
    expect(lines.map((l) => [l.container, l.exchange, l.planned, l.nativeFormat, l.exchangeFormats])).toEqual([["RVC-ABC-ZZ-XX-M3-A-0001", "M1", "2027-02-01", "RVT", "IFC"], ["RVC-ABC-ZZ-XX-M3-A-0001", "M2", "2027-06-01", "RVT", "IFC"]]);
    const back = midpToRows({ sheets: ["TIDP"], warnings: [], exchanges: exchanges.map((x, i) => ({ ...x, key: `X${i}` })), lines: lines.map((l, i) => ({ ...l, exchange: `X${i}` })) });
    expect(back.milestones.map((m) => m.code)).toEqual(["M1", "M2"]);
    expect(back.rows.map((r) => [r.volume, r.level, r.type, r.role, r.number, r.milestone, r.due, r.description])).toEqual([["ZZ", "XX", "M3", "A", "0001", "M1", "2027-02-01", "Federated model"], ["ZZ", "XX", "M3", "A", "0001", "M2", "2027-06-01", "Federated model"]]);
  });
});
