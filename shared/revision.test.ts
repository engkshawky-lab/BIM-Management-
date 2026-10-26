import { describe, expect, it } from "vitest";
import { initialValues, nextRevision } from "./documents";
import { templates } from "./data/templates";

describe("nextRevision", () => {
  it("bumps WIP versions", () => expect(nextRevision("P01.01", "WIP")).toBe("P01.02"));
  it("drops the version when shared", () => expect(nextRevision("P01.03", "SHARED")).toBe("P01"));
  it("starts the next preliminary after sharing", () => expect(nextRevision("P01", "WIP")).toBe("P02.01"));
  it("publishes as C01, then C02", () => {
    expect(nextRevision("P02", "PUBLISHED")).toBe("C01");
    expect(nextRevision("C01", "PUBLISHED")).toBe("C02");
  });
  it("reopens a published revision as the next preliminary", () => expect(nextRevision("C02", "WIP")).toBe("P03.01"));
});

describe("initialValues", () => {
  it("pre-fills project facts", () => {
    const eir = templates.find((t) => t.id === "eir")!;
    const v = initialValues(eir, { name: "Tower A", code: "TWA", appointingParty: "City Council", location: "Cairo", description: null });
    expect(v.projectName).toBe("Tower A");
    expect(v.projectCode).toBe("TWA");
    expect(Array.isArray(v.purposes)).toBe(true);
  });
});
