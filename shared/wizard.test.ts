import { describe, expect, it } from "vitest";
import { templateById } from "./data/templates";
import { recommend, type WizardAnswers } from "./wizard";

const base: WizardAnswers = { role: "appointing", stage: "brief", assetType: "building", operations: true, sensitive: false, usesAi: false };
const ids = (a: Partial<WizardAnswers>) => recommend({ ...base, ...a }).documents.map((d) => d.templateId);

describe("setup wizard", () => {
  it("gives an appointing party the requirement documents", () => {
    expect(ids({})).toEqual(expect.arrayContaining(["oir", "air", "eir", "info-standard", "cde-procedure", "info-protocol"]));
    expect(ids({ operations: false })).not.toContain("air");
  });
  it("gives a lead appointed party a pre- or post-appointment BEP by stage", () => {
    expect(ids({ role: "lead", stage: "tender" })).toEqual(expect.arrayContaining(["bep-pre", "capability"]));
    expect(ids({ role: "lead", stage: "production" })).toContain("bep-post");
    expect(ids({ role: "lead", stage: "production" })).not.toContain("bep-pre");
  });
  it("adds security, specialist and AI documents when relevant", () => {
    expect(ids({ sensitive: true })).toContain("security-triage");
    expect(ids({ assetType: "infrastructure" })).toContain("infra-requirements");
    expect(ids({ assetType: "facade" })).toContain("facade-requirements");
    const ai = recommend({ ...base, usesAi: true });
    expect(ai.standards).toEqual(["iso19650", "iso42001"]);
    expect(ai.documents.map((d) => d.templateId)).toContain("ai-policy");
  });
  it("only recommends templates that exist and can be created by hand", () => {
    for (const role of ["appointing", "lead", "task"] as const) for (const stage of ["brief", "tender", "mobilize", "production", "handover"] as const)
      for (const d of recommend({ ...base, role, stage, usesAi: true, sensitive: true, assetType: "infrastructure" }).documents) {
        const t = templateById(d.templateId);
        expect(t, d.templateId).toBeDefined();
        expect(t!.generatedFrom, d.templateId).toBeUndefined();
      }
  });
});
