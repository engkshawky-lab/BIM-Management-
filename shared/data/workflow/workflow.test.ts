import { describe, expect, it } from "vitest";
import { ALL_PAGES } from "../../../client/src/shell/nav";
import { DOC_FLOWS } from "./docflow";
import { WF_DUTIES } from "./duties";
import { WF_ROLES } from "./roles";
import { WF_STAGES } from "./stages";
import { ROLE_IDS, ROLE_TITLES, STAGE_IDS } from "./types";

const paths = new Set(ALL_PAGES.filter((x) => x.scope === "global").map((x) => x.path));

describe("project and document workflow", () => {
  it("has the ten stages in order", () => {
    expect(WF_STAGES.map((s) => s.id)).toEqual(STAGE_IDS);
  });

  it("says what every role does in every stage, with one accountable role per stage", () => {
    expect(WF_DUTIES).toHaveLength(ROLE_IDS.length * STAGE_IDS.length);
    for (const s of STAGE_IDS) {
      for (const r of ROLE_IDS) expect(WF_DUTIES.filter((d) => d.role === r && d.stage === s), `${r} @ ${s}`).toHaveLength(1);
      expect(WF_DUTIES.filter((d) => d.stage === s && d.raci === "A"), s).toHaveLength(1);
    }
    for (const d of WF_DUTIES) if (d.raci) expect(d.duty.length, `${d.role} @ ${d.stage}`).toBeGreaterThan(20);
  });

  it("has a profile for every role", () => {
    expect(WF_ROLES.map((r) => r.id)).toEqual(ROLE_IDS);
    for (const r of WF_ROLES) expect(r.title).toBe(ROLE_TITLES[r.id]);
  });

  it("has the three document flows", () => {
    expect(DOC_FLOWS.map((f) => f.id)).toEqual(["container", "document", "handover"]);
    for (const f of DOC_FLOWS) expect(f.steps.length, f.id).toBeGreaterThanOrEqual(6);
  });

  it("links only to pages that exist", () => {
    const tools = [...WF_STAGES.flatMap((s) => s.tools), ...WF_ROLES.flatMap((r) => r.tools)];
    for (const x of tools) expect(paths.has(x.path) || /^\/parts\/19650-[1-6]$/.test(x.path), x.path).toBe(true);
  });
});
