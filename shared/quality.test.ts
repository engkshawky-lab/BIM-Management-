import { describe, expect, it } from "vitest";
import { templateById } from "./data/templates";
import { checkDocument } from "./quality";

const meta = { containerName: "", projectCode: "TWA" };
const msgs = (id: string, v: Record<string, unknown>) => checkDocument(templateById(id)!, v, meta).map((f) => f.message);

// The rules read the fields the templates actually have.
describe("document rules", () => {
  it("pre-appointment BEP: delivery team and roles come from the parties and roles tables", () => {
    expect(msgs("bep-pre", { purpose: "x" })).toContain("Proposed delivery team is empty: name the organization for each party.");
    const ok = msgs("bep-pre", { parties: [["Lead appointed party", "Acme", "", ""]], roles: [["Information manager", "", "Acme", ""]], federation: "By discipline", raciRef: "RACI-01" });
    expect(ok.filter((m) => /delivery team|roles are not assigned|High-level responsibility|federation strategy/.test(m))).toEqual([]);
  });
  it("post-appointment BEP: every role must name a person", () => {
    expect(msgs("bep-post", { roles: [["Information manager", "", "Acme", ""]] })).toContain("Information management roles must name individuals after appointment.");
    expect(msgs("bep-post", { roles: [["Information manager", "A. Person", "Acme", ""]] })).not.toContain("Information management roles must name individuals after appointment.");
  });
  it("capability assessment: scores, evidence, resources and result", () => {
    const m = msgs("capability", { imScores: [["CDE workflows", "1", ""]] });
    expect(m).toEqual(expect.arrayContaining(["1 criteria score 2 or less but no mobilisation actions are given.", "Some scores have no evidence.", "No resources are listed: capacity cannot be assessed.", "The assessment has no result."]));
  });
  it("flags unfilled template prompts and broken cross-references as placeholders", () => {
    for (const v of ["See Error! Reference source not found", "every >specify frequency< weeks", "Values to be added"])
      expect(msgs("bep-pre", { federation: v }).some((x) => /placeholder/.test(x)), v).toBe(true);
  });
});
