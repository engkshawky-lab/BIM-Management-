import { describe, expect, it } from "vitest";
import { ALL_PAGES } from "../../client/src/shell/nav";
import { DOC_GUIDES } from "./docGuides";
import { hubs } from "./hubs";
import { LEARNING_PATHS } from "./learningPaths";
import { partDetails19650 } from "./parts19650Detail";
import { DOC_FLOWS } from "./workflow/docflow";
import { ROLE_IDS, STAGE_IDS } from "./workflow/types";

// Tabs of the part pages (client/src/pages/PartsHub.tsx) and the workflow pages (Workflow.tsx).
const PART_TABS = ["overview", "clauses", "examples", "qa", "quiz", "documents", "ask"];
const WORKFLOW_ARGS: Record<string, string[]> = { project: STAGE_IDS, documents: DOC_FLOWS.map((f) => f.id), matrix: [], roles: ROLE_IDS };

function exists(href: string): boolean {
  if (ALL_PAGES.some((p) => p.scope === "global" && p.path === href)) return true;
  const [a, b, c, ...rest] = href.split("/").filter(Boolean);
  if (rest.length) return false;
  if (a === "parts") return partDetails19650.some((p) => p.id === b) && (c === undefined || PART_TABS.includes(c));
  if (a === "workflow") return b in WORKFLOW_ARGS && (c === undefined || WORKFLOW_ARGS[b].includes(c));
  if (a === "doc-guides") return c === undefined && DOC_GUIDES.some((g) => g.id === b);
  if (a === "hubs") return c === undefined && hubs.some((h) => h.id === b);
  return false;
}

describe("learning paths", () => {
  it("have unique ids and the expected roles", () => {
    expect(new Set(LEARNING_PATHS.map((p) => p.id)).size).toBe(LEARNING_PATHS.length);
    expect(LEARNING_PATHS.length).toBeGreaterThanOrEqual(5);
  });

  for (const p of LEARNING_PATHS) {
    it(`${p.id}: 10–16 well-formed steps linking to existing pages`, () => {
      expect(p.steps.length).toBeGreaterThanOrEqual(10);
      expect(p.steps.length).toBeLessThanOrEqual(16);
      expect(p.weeks).toBeGreaterThan(0);
      expect(new Set(p.steps.map((s) => s.title)).size, "unique step titles").toBe(p.steps.length);
      for (const s of p.steps) {
        expect(exists(s.href), `${p.id}: ${s.href}`).toBe(true);
        expect(s.minutes).toBeGreaterThan(0);
        expect(["read", "practise", "tool", "quiz"]).toContain(s.kind);
        expect(s.why.length).toBeGreaterThan(10);
      }
    });
  }

  it("rejects pages that do not exist", () => {
    expect(exists("/parts/19650-7")).toBe(false);
    expect(exists("/doc-guides/nope")).toBe(false);
    expect(exists("/workflow/roles/nobody")).toBe(false);
    expect(exists("/no-such-page")).toBe(false);
  });
});
