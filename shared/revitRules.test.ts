import { describe, expect, it } from "vitest";
import { classificationParam, defaultRules, mcpPrompt, parseResults, pyRevitScript, scoreResults, RESULTS_SCHEMA } from "./revitRules";

const project = { code: "rvc", name: "Riverside Clinic", separator: "-", classification: "Uniclass 2015", client: "Health Trust" };

/** The rules as Python would read them: the text between r''' and ''', parsed as JSON. */
const embedded = (script: string) => JSON.parse(script.slice(script.indexOf("r'''") + 4, script.indexOf("'''", script.indexOf("r'''") + 4)));

describe("Revit project rules", () => {
  it("builds rules from the project data", () => {
    const r = defaultRules(project);
    expect(r.project.code).toBe("RVC");
    expect(r.naming.fields).toHaveLength(7);
    expect(r.projectInfo.find((x) => x.param === "Project Number")?.expected).toBe("RVC");
    expect(r.categories.find((c) => c.category === "OST_Doors")?.params).toContain("Classification.Uniclass.Pr.Number");
    expect(classificationParam("OmniClass")).toBe("OmniClass Number");
    expect(classificationParam("Client / local system")).toBe("");
  });

  it("embeds the rules in the script so Python reads them back unchanged, even with quotes, $ and Arabic", () => {
    const r = defaultRules({ ...project, name: "مستشفى ''' $' test" });
    r.sheets.numberPattern = "^[A-Z]{1,2}-\\d{3}$";
    const py = pyRevitScript(r, "2026-10-29");
    expect(py).not.toMatch(/[^\x00-\x7f]/);
    expect(embedded(py)).toEqual(JSON.parse(JSON.stringify(r)));
    expect(py).toContain("for RVC on 2026-10-29");
    expect(py).not.toContain("__RULES__");
    // the script must never write to the model
    expect(py).not.toMatch(/Transaction|\.Set\(|Delete\(/);
  });

  it("parses and grades a results file, including JSON pasted from Claude in a code fence", () => {
    const file = { schema: RESULTS_SCHEMA, rulesFor: "RVC", checked: "2026-10-29 09:00", model: { title: "RVC-ABC-ZZ-ZZ-M3-A-0001" }, checks: [
      { id: "a", group: "Naming", label: "File name", status: "pass" },
      { id: "b", group: "Parameters", label: "Doors: Mark", status: "warn", items: [{ id: 101, name: "Door", problem: "No value" }] },
      { id: "c", group: "Model health", label: "Imported CAD", status: "fail", count: 3, items: [] },
      { id: "d", group: "Model information", label: "Revit version", status: "info", value: "2026" },
      { id: "e", group: "Other", label: "Odd", status: "weird" },
    ] };
    const r = parseResults("```json\n" + JSON.stringify(file) + "\n```");
    expect(r.checks[1].items[0]).toEqual({ id: 101, name: "Door", problem: "No value" });
    expect(r.checks[4].status).toBe("info");
    expect(scoreResults(r)).toEqual({ score: 50, grade: "D", counts: { pass: 1, warn: 1, fail: 1, info: 2 } });
    expect(() => parseResults("{}")).toThrow(/not a results file/);
    expect(() => parseResults("hello")).toThrow(/not JSON/);
  });

  it("gives Claude the rules and the exact results format", () => {
    const p = mcpPrompt(defaultRules(project));
    expect(p).toContain(RESULTS_SCHEMA);
    expect(p).toContain("read-only");
    expect(p).toContain('"code":"RVC"');
  });
});
