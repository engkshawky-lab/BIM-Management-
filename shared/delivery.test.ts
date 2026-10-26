import { describe, expect, it } from "vitest";
import { templates } from "./data/templates";
import { analysePlan, findCycles, planStats, type Deliverable } from "./delivery";
import { containerName, validateContainerName } from "./naming";
import { checkDocument, checkProjectSet } from "./quality";
import { initialValues } from "./documents";

const d = (over: Partial<Deliverable>): Deliverable => ({
  id: "x", taskTeamId: "t1", containerName: "TWA-ARC-ZZ-ZZ-M3-A-0001", title: "Model", typeCode: "M3", loin: "LOIN-03", milestoneId: "m1",
  startDate: "2026-01-01", dueDate: "2026-02-01", status: "planned", dependsOn: [], assigneeId: "u1", fileId: null, documentId: null, notes: "", ...over,
});
const base = { milestones: [{ id: "m1", name: "Stage 3", date: "2026-03-01", description: "" }], teams: [{ id: "t1", name: "Architecture", organization: "", originatorCode: "ARC", roleCode: "A", leadUserId: null }], projectCode: "TWA", today: "2026-01-15" };

describe("naming", () => {
  it("builds and validates names", () => {
    const n = containerName({ project: "twa", originator: "arc", type: "M3", role: "A", number: 7 });
    expect(n).toBe("TWA-ARC-ZZ-ZZ-M3-A-0007");
    expect(validateContainerName(n, "TWA")).toEqual([]);
  });
  it("flags wrong project code and bad fields", () => {
    expect(validateContainerName("ABC-ARC-ZZ-ZZ-M3-A-0001", "TWA")[0]).toMatch(/does not match/);
    expect(validateContainerName("TWA-A-ZZ-ZZ-M3-A-1", "TWA").length).toBe(2);
  });
});

describe("analysePlan", () => {
  it("passes a clean plan", () => expect(analysePlan({ ...base, deliverables: [d({})] }).filter((f) => f.severity !== "info")).toEqual([]));
  it("flags overdue, after-milestone and inverted dates", () => {
    const f = analysePlan({ ...base, today: "2026-04-01", deliverables: [d({ startDate: "2026-03-10", dueDate: "2026-03-05" })] });
    const msgs = f.map((x) => x.message).join("|");
    expect(msgs).toMatch(/Overdue/); expect(msgs).toMatch(/after milestone/); expect(msgs).toMatch(/Starts/);
  });
  it("flags duplicate names, originator mismatch and dependency timing", () => {
    const a = d({ id: "a", dueDate: "2026-02-20" });
    const b = d({ id: "b", containerName: "TWA-STR-ZZ-ZZ-M3-S-0001", startDate: "2026-02-01", dependsOn: ["a"] });
    const c = d({ id: "c" });
    const msgs = analysePlan({ ...base, deliverables: [a, b, c] }).map((x) => x.message).join("|");
    expect(msgs).toMatch(/used 2 times/); expect(msgs).toMatch(/Originator STR differs/); expect(msgs).toMatch(/before it starts/);
  });
  it("detects cycles", () => {
    expect(findCycles([{ id: "a", dependsOn: ["b"] }, { id: "b", dependsOn: ["a"] }]).length).toBe(1);
    expect(findCycles([{ id: "a", dependsOn: ["b"] }, { id: "b", dependsOn: [] }])).toEqual([]);
  });
  it("computes stats", () => {
    const s = planStats([d({ status: "published" }), d({ dueDate: "2026-01-01" })], "2026-01-15");
    expect(s).toMatchObject({ total: 2, published: 1, overdue: 1, progress: 0.5 });
  });
});

describe("document quality", () => {
  const eir = templates.find((t) => t.id === "eir")!;
  it("reports an empty document once", () => {
    const empty = Object.fromEntries(Object.keys(initialValues(eir)).map((k) => [k, Array.isArray(initialValues(eir)[k]) ? [] : ""]));
    expect(checkDocument(eir, empty, { containerName: "", projectCode: "TWA" })).toEqual([expect.objectContaining({ message: "Document is empty." })]);
  });
  it("flags EIR without milestones and placeholder container", () => {
    const v = initialValues(eir, { name: "T", code: "TWA", appointingParty: "C", location: "L", description: "D" });
    const msgs = checkDocument(eir, v, { containerName: "TWA-XXX-ZZ-ZZ-RP-Z-0001", projectCode: "TWA" }).map((f) => f.message).join("|");
    expect(msgs).toMatch(/No information delivery milestones/);
  });
  it("requires SoA justifications for excluded controls", () => {
    const soa = templates.find((t) => t.id === "ai-soa")!;
    const v = initialValues(soa);
    (v.controls as string[][])[0][2] = "N";
    const msgs = checkDocument(soa, v, { containerName: "TWA-ABC-ZZ-ZZ-RP-Z-0001", projectCode: "TWA" }).map((f) => f.message).join("|");
    expect(msgs).toMatch(/1 excluded controls have no justification/);
  });
  it("lists missing documents for the project's standards", () => {
    const f = checkProjectSet({ standards: ["iso42001"], docs: [{ templateId: "ai-policy", state: "WIP", title: "" }], milestoneCount: 0, planCount: 0 });
    expect(f.length).toBe(5);
  });
});
