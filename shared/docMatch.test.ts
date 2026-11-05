import { describe, expect, it } from "vitest";
import { judgeRelation, namesOverlap, sanitiseMatch } from "./docMatch";

const id = (project: string, code = "", client = "", expected = true, type = "") => ({ type, expected, project, code, client });
const L: [string, string] = ["EIR", "BEP"];

describe("do two documents belong together", () => {
  it("accepts the same project", () => {
    const r = judgeRelation({ a: id("Harbour View Tower", "HVT"), b: id("Harbour View Tower — Stage 4", "HVT"), sameProject: "yes", reason: "" }, L);
    expect(r.status).toBe("related");
  });
  it("flags different projects even when asked to compare them", () => {
    const r = judgeRelation({ a: id("Harbour View Tower", "P1001", "Alpha Estates"), b: id("Desert Logistics Park", "P2002", "Beta Holdings"), sameProject: "no", reason: "Different sites and clients." }, L);
    expect(r.status).toBe("unrelated");
    expect(r.message).toMatch(/not related.*Harbour View Tower.*Desert Logistics Park/);
    expect(r.messageAr).toMatch(/غير مرتبطين/);
  });
  it("decides from the names when the AI is unsure", () => {
    expect(judgeRelation({ a: id("Harbour View Tower"), b: id("Desert Logistics Park"), sameProject: "unclear", reason: "" }, L).status).toBe("unrelated");
    expect(judgeRelation({ a: id("Harbour View Tower"), b: id(""), sameProject: "unclear", reason: "" }, L).status).toBe("unclear");
    expect(judgeRelation({ a: id("Harbour View"), b: id("Harbour View Tower BEP"), sameProject: "unclear", reason: "" }, L).status).not.toBe("unrelated");
  });
  it("asks for a check when the AI says yes but names, codes and clients all differ", () => {
    expect(judgeRelation({ a: id("Harbour View Tower", "P1001", "Alpha"), b: id("Desert Park", "P2002", "Beta"), sameProject: "yes", reason: "" }, L).status).toBe("unclear");
  });
  it("reports a file that is not the expected kind of document", () => {
    const r = judgeRelation({ a: id("Harbour View Tower"), b: id("Harbour View Tower", "", "", false, "Asset Information Requirements"), sameProject: "yes", reason: "" }, L);
    expect(r.status).toBe("wrong-type");
    expect(r.message).toMatch(/BEP file looks like an Asset Information Requirements, not a BEP/);
  });
  it("reads the AI object defensively and treats a missing one as unconfirmed", () => {
    expect(sanitiseMatch("nonsense")).toBeNull();
    expect(sanitiseMatch({ sameProject: "maybe" })!.sameProject).toBe("unclear");
    expect(judgeRelation(null, L).status).toBe("unclear");
    expect(namesOverlap("The Project", "Project Plan")).toBe(false);
  });
});
