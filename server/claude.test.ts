import { describe, expect, it } from "vitest";
import { closeTruncatedJson, parseJson } from "./claude";

describe("parseJson", () => {
  it("reads fenced JSON", () => {
    expect(parseJson<{ a: number }>("```json\n{\"a\": 1}\n```")).toEqual({ a: 1 });
  });

  it("salvages an answer cut off inside the last array item", () => {
    const cut = '{"summary": "Gaps.", "coverage": [{"item": "Milestones", "status": "missing"}, {"item": "LOIN", "status": "par';
    expect(parseJson(cut)).toEqual({ summary: "Gaps.", coverage: [{ item: "Milestones", status: "missing" }] });
  });

  it("salvages an answer cut off inside a string, keeping earlier arrays", () => {
    const cut = '{"coverage": [{"item": "A", "status": "met"}], "findings": [{"severity": "major", "issue": "No acceptance cri';
    // the incomplete findings array is dropped; routes treat a missing array as empty
    expect(closeTruncatedJson(cut)).toEqual({ coverage: [{ item: "A", status: "met" }] });
  });

  it("gives up on text with no JSON object", () => {
    expect(() => parseJson("no json here")).toThrow();
  });
});
