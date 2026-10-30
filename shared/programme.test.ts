import { describe, expect, it } from "vitest";
import { diffProgrammes, impact, parseCsvProgramme, parseMsProjectXml, parseXer, rowActivity, toIsoDate, type Activity } from "./programme";

const MSP = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>Demo</Name>
  <Tasks>
    <Task><UID>0</UID><ID>0</ID><Name>Demo</Name><OutlineLevel>0</OutlineLevel><Summary>1</Summary><Start>2025-01-06T08:00:00</Start><Finish>2025-06-30T17:00:00</Finish></Task>
    <Task><UID>1</UID><ID>1</ID><Name>Stage 2 &amp; Concept</Name><WBS>1</WBS><OutlineLevel>1</OutlineLevel><Summary>1</Summary><Start>2025-01-06T08:00:00</Start><Finish>2025-03-28T17:00:00</Finish></Task>
    <Task><UID>2</UID><ID>2</ID><Name>Architectural concept design</Name><WBS>1.1</WBS><OutlineLevel>2</OutlineLevel><Summary>0</Summary><Milestone>0</Milestone>
      <Start>2025-01-06T08:00:00</Start><Finish>2025-02-28T17:00:00</Finish><Duration>PT320H0M0S</Duration>
      <Baseline><Number>0</Number><Start>2024-12-01T08:00:00</Start><Finish>2024-12-20T17:00:00</Finish></Baseline></Task>
    <Task><UID>3</UID><ID>3</ID><Name>Concept design sign-off</Name><WBS>1.2</WBS><OutlineLevel>2</OutlineLevel><Summary>0</Summary><Milestone>1</Milestone>
      <Start>2025-03-28T17:00:00</Start><Finish>2025-03-28T17:00:00</Finish><Duration>PT0H0M0S</Duration>
      <PredecessorLink><PredecessorUID>2</PredecessorUID><Type>1</Type></PredecessorLink></Task>
  </Tasks>
  <Resources><Resource><UID>1</UID><Name>Arch</Name></Resource></Resources>
</Project>`;

const XER = [
  "ERMHDR\t19.12\t2025-01-01\tProject\tadmin",
  "%T\tPROJWBS",
  "%F\twbs_id\twbs_short_name\twbs_name",
  "%R\t10\tARC\tArchitecture",
  "%T\tTASK",
  "%F\ttask_id\twbs_id\ttask_code\ttask_name\ttask_type\ttarget_start_date\ttarget_end_date\tact_start_date\tact_end_date",
  "%R\t100\t10\tA1000\tStage 3 spatial coordination design\tTT_Task\t2025-04-01 08:00\t2025-06-27 17:00\t2025-04-02 08:00\t",
  "%R\t101\t10\tA1010\tStage 3 design freeze\tTT_FinMile\t2025-06-27 17:00\t2025-06-27 17:00\t\t",
  "%R\t102\t10\tA0001\tDesign management (LOE)\tTT_LOE\t2025-04-01 08:00\t2025-06-27 17:00\t\t",
  "%T\tTASKPRED",
  "%F\ttask_pred_id\ttask_id\tpred_task_id\tpred_type",
  "%R\t1\t101\t100\tPR_FS",
  "%E",
].join("\r\n");

describe("dates", () => {
  it("normalises common programme formats", () => {
    expect(toIsoDate("2025-02-28T17:00:00")).toBe("2025-02-28");
    expect(toIsoDate("28/02/2025")).toBe("2025-02-28");
    expect(toIsoDate("15-Jan-25 08:00 A")).toBe("2025-01-15");
    expect(toIsoDate("Mon 3 March 2025")).toBe("2025-03-03");
    expect(toIsoDate("March 3, 2025")).toBe("2025-03-03");
    expect(toIsoDate(45716)).toBe("2025-02-28");
    expect(toIsoDate("31/02/2025")).toBe("");
  });
});

describe("parseMsProjectXml", () => {
  const acts = parseMsProjectXml(MSP);
  it("reads tasks, skipping the project summary and baseline dates", () => {
    expect(acts.map((a) => a.id)).toEqual(["1", "2", "3"]);
    expect(acts[0]).toMatchObject({ name: "Stage 2 & Concept", summary: true });
    expect(acts[1]).toMatchObject({ start: "2025-01-06", finish: "2025-02-28", milestone: false, wbs: "1.1", group: "Stage 2 & Concept" });
    expect(acts[2]).toMatchObject({ milestone: true, predecessors: ["2"] });
  });
  it("rejects other XML", () => expect(() => parseMsProjectXml("<root/>")).toThrow());
});

describe("parseXer", () => {
  const acts = parseXer(XER);
  it("reads TASK rows with actual dates first, milestones, WBS and predecessors by code", () => {
    expect(acts).toHaveLength(3);
    expect(acts[0]).toMatchObject({ id: "100", code: "A1000", start: "2025-04-02", finish: "2025-06-27", wbs: "ARC", milestone: false });
    expect(acts[1]).toMatchObject({ code: "A1010", milestone: true, predecessors: ["A1000"] });
    expect(acts[2].summary).toBe(true);
  });
});

describe("parseCsvProgramme", () => {
  it("detects columns by name in any case", () => {
    const acts = parseCsvProgramme([
      ["Activity ID", "Activity Name", "Original Duration", "Start", "Finish", "Predecessors", "Discipline"],
      ["S100", "Structural scheme design", "20d", "03/03/2025", "28/03/2025", "", "Structure"],
      ["S110", "Scheme design issue", "0d", "28/03/2025", "28/03/2025", "S100FS+2d; A1000", "Structure"],
      ["", "", "", "", "", "", ""],
    ]);
    expect(acts).toHaveLength(2);
    expect(acts[0]).toMatchObject({ id: "S100", code: "S100", name: "Structural scheme design", start: "2025-03-03", finish: "2025-03-28", wbs: "Structure", milestone: false });
    expect(acts[1]).toMatchObject({ milestone: true, predecessors: ["S100", "A1000"] });
  });
  it("needs a name column", () => expect(() => parseCsvProgramme([["id", "start"], ["1", "2025-01-01"]])).toThrow());
});

describe("diff and impact", () => {
  const a = (code: string, name: string, start: string, finish: string, predecessors: string[] = []): Activity => ({ id: code, code, name, start, finish, milestone: false, wbs: "", predecessors });
  const v1 = [a("A1", "Concept design", "2025-01-06", "2025-02-28"), a("A2", "Spatial coordination", "2025-03-03", "2025-05-30", ["A1"]), a("A3", "Planning submission", "2025-06-02", "2025-06-06")];
  const v2 = [a("A1", "Concept design", "2025-01-06", "2025-03-14"), a("A2", "Spatial coordination", "2025-03-17", "2025-05-30", ["A1"]), a("A9", "Fire strategy", "2025-04-01", "2025-04-30")];
  const d = diffProgrammes(v1, v2);
  it("finds added, removed and moved activities", () => {
    expect(d.added.map((x) => x.code)).toEqual(["A9"]);
    expect(d.removed.map((x) => x.code)).toEqual(["A3"]);
    expect(d.moved.map((m) => [m.key, m.startShift, m.finishShift])).toEqual([["A1", 0, 14], ["A2", 14, 0]]);
  });
  it("pairs renumbered activities by unique name", () => {
    const r = diffProgrammes([a("X1", "Stage 4 design", "2025-01-01", "2025-02-01")], [a("Y7", "Stage 4 design", "2025-01-01", "2025-02-08")]);
    expect(r.added).toHaveLength(0);
    expect(r.moved[0]).toMatchObject({ key: "X1", finishShift: 7 });
  });
  it("shifts linked rows and flags overdue, predecessor and removed", () => {
    const rows = [
      { ref: "P-A1", title: "Concept model", due: "2025-02-28", status: "Planned" },
      { ref: "P-A2-2", title: "Coordination drawings", due: "2025-03-12", status: "Planned" },
      { ref: "C001", title: "Unlinked", due: "2025-03-01", activityId: "A3" },
      { ref: "C002", title: "Not linked", due: "2025-03-01" },
    ];
    const out = impact(rows, d, "2025-03-10");
    expect(out.map((x) => x.ref)).toEqual(["P-A1", "P-A2-2", "C001"]);
    expect(out[0]).toMatchObject({ newDue: "2025-03-14", shift: 14, flags: ["moved"] });
    expect(out[1]).toMatchObject({ newDue: "2025-03-12", flags: ["moved", "beforePredecessor"] });
    expect(out[2].flags).toEqual(["removed"]);
    expect(impact([{ ref: "P-A1", title: "x", due: "2025-02-01" }], d, "2025-03-10")[0].flags).toEqual(["moved", "overdue"]);
  });
  it("reads the activity link from the ref", () => {
    expect(rowActivity({ ref: "P-A1010-3" }, new Set(["A1010"]))).toBe("A1010");
    expect(rowActivity({ ref: "P-12" })).toBe("12");
    expect(rowActivity({ ref: "C001" })).toBe("");
  });
});
