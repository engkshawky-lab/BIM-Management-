import { NAME_FIELDS } from "./namingCheck";

// Revit-side checks against the project's own rules. The portal builds a rules pack from the project data
// (project code, naming, classification) plus editable parameter and health rules; a generated read-only
// pyRevit script (or Claude through a Revit MCP) checks the open model and writes a results file in the format
// below, which the portal grades. Nothing is sent anywhere: the files move by hand.

export const RULES_SCHEMA = "iso19650-revit-rules/1";
export const RESULTS_SCHEMA = "iso19650-revit-results/1";

export interface CategoryRule { category: string; label: string; params: string[] }
export interface RevitRules {
  schema: typeof RULES_SCHEMA;
  project: { code: string; name: string };
  naming: { checkFileName: boolean; separator: string; projectCode: string; fields: { label: string; pattern: string }[]; suffixPattern: string };
  projectInfo: { param: string; expected?: string }[];
  categories: CategoryRule[];
  sheets: { numberPattern: string; params: string[] };
  thresholds: { maxWarnings: number; maxInPlace: number; maxImportedCad: number; missingShareWarn: number };
}

/** Revit categories offered in the rules editor (BuiltInCategory names). */
export const REVIT_CATEGORIES: Record<string, string> = {
  OST_Walls: "Walls", OST_Doors: "Doors", OST_Windows: "Windows", OST_Floors: "Floors", OST_Roofs: "Roofs", OST_Ceilings: "Ceilings",
  OST_Rooms: "Rooms", OST_Stairs: "Stairs", OST_StructuralColumns: "Structural columns", OST_StructuralFraming: "Structural framing",
  OST_StructuralFoundation: "Structural foundations", OST_MechanicalEquipment: "Mechanical equipment", OST_DuctCurves: "Ducts",
  OST_PipeCurves: "Pipes", OST_PlumbingFixtures: "Plumbing fixtures", OST_ElectricalEquipment: "Electrical equipment",
  OST_ElectricalFixtures: "Electrical fixtures", OST_LightingFixtures: "Lighting fixtures", OST_FireAlarmDevices: "Fire alarm devices",
  OST_Furniture: "Furniture", OST_GenericModel: "Generic models",
};

/** The Revit parameter that usually carries each classification system's code. */
export function classificationParam(system: string): string {
  if (/uniclass/i.test(system)) return "Classification.Uniclass.Pr.Number";
  if (/omniclass/i.test(system)) return "OmniClass Number";
  if (/uniformat/i.test(system)) return "Assembly Code";
  return "";
}

export function defaultRules(p: { code?: string; name?: string; separator?: string; classification?: string; client?: string }): RevitRules {
  const cls = classificationParam(p.classification ?? "");
  const withCls = (params: string[]) => (cls ? [...params, cls] : params);
  return {
    schema: RULES_SCHEMA,
    project: { code: (p.code ?? "").toUpperCase(), name: p.name ?? "" },
    naming: {
      checkFileName: true, separator: p.separator || "-", projectCode: (p.code ?? "").toUpperCase(),
      fields: NAME_FIELDS.map((f) => ({ label: f.label, pattern: f.pattern.source })),
      suffixPattern: "^(S[0-7]|A[1-9]|B[1-9]|CR|D[1-4]|[PC][0-9]{2})$",
    },
    projectInfo: [
      { param: "Project Number", expected: (p.code ?? "").toUpperCase() || undefined }, { param: "Project Name", expected: p.name || undefined },
      { param: "Client Name", expected: p.client || undefined }, { param: "Project Address" }, { param: "Project Status" },
    ],
    categories: [
      { category: "OST_Walls", label: "Walls", params: withCls(["Type Mark", "Fire Rating"]) },
      { category: "OST_Doors", label: "Doors", params: withCls(["Mark", "Fire Rating"]) },
      { category: "OST_Windows", label: "Windows", params: withCls(["Mark"]) },
      { category: "OST_Rooms", label: "Rooms", params: ["Number", "Name"] },
      { category: "OST_MechanicalEquipment", label: "Mechanical equipment", params: withCls(["Mark", "Manufacturer", "Model"]) },
    ],
    sheets: { numberPattern: "", params: ["Drawn By", "Checked By"] },
    thresholds: { maxWarnings: 200, maxInPlace: 10, maxImportedCad: 0, missingShareWarn: 0.05 },
  };
}

// ---------------------------------------------------------------- results

export type CheckStatus = "pass" | "warn" | "fail" | "info";
export interface CheckItem { id: number | null; name: string; problem: string }
export interface RevitCheck { id: string; group: string; label: string; status: CheckStatus; value?: string | number | null; expected?: string | null; count: number; items: CheckItem[]; note?: string | null }
export interface RevitResults { schema: typeof RESULTS_SCHEMA; rulesFor: string; checked: string; model: { title: string; path?: string; revitVersion?: string; user?: string }; checks: RevitCheck[] }

const STATUSES: CheckStatus[] = ["pass", "warn", "fail", "info"];

/** Parse a results file (from the script, or JSON pasted from Claude, possibly inside a ```json fence). Throws a readable error. */
export function parseResults(text: string): RevitResults {
  const body = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  let j: unknown;
  try { j = JSON.parse(body); } catch { throw new Error("This is not a valid results file: it is not JSON."); }
  const r = j as Partial<RevitResults>;
  if (!r || r.schema !== RESULTS_SCHEMA) throw new Error(`This is not a results file from the Revit check (expected schema "${RESULTS_SCHEMA}").`);
  if (!Array.isArray(r.checks)) throw new Error("The results file has no checks.");
  const checks = r.checks.map((c, i) => ({
    id: String(c.id ?? `check-${i}`), group: String(c.group ?? "Other"), label: String(c.label ?? c.id ?? "Check"),
    status: STATUSES.includes(c.status as CheckStatus) ? (c.status as CheckStatus) : "info",
    value: c.value ?? null, expected: c.expected ?? null, note: c.note ?? null,
    items: Array.isArray(c.items) ? c.items.map((x) => ({ id: typeof x.id === "number" ? x.id : null, name: String(x.name ?? ""), problem: String(x.problem ?? "") })) : [],
    count: typeof c.count === "number" ? c.count : Array.isArray(c.items) ? c.items.length : 0,
  }));
  return { schema: RESULTS_SCHEMA, rulesFor: String(r.rulesFor ?? ""), checked: String(r.checked ?? ""), model: { title: String(r.model?.title ?? "Model"), path: r.model?.path, revitVersion: r.model?.revitVersion ? String(r.model.revitVersion) : undefined, user: r.model?.user }, checks };
}

/** Score: pass 1, warn ½, fail 0; info checks don't count. Grades match the QA/QC checker: A ≥ 90, B ≥ 75, C ≥ 60, D ≥ 40, else F. */
export function scoreResults(r: RevitResults) {
  const scored = r.checks.filter((c) => c.status !== "info");
  const counts = { pass: 0, warn: 0, fail: 0, info: 0 } as Record<CheckStatus, number>;
  for (const c of r.checks) counts[c.status]++;
  const score = scored.length ? Math.round(((counts.pass + counts.warn / 2) / scored.length) * 100) : 0;
  const grade = !scored.length ? "–" : score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  return { score, grade, counts };
}

// ---------------------------------------------------------------- the pyRevit script

/** JSON safe to embed in a Python r'''…''' string: ASCII only, and no triple quotes. */
const pyJson = (v: unknown) => JSON.stringify(v, null, 1).replace(/[\u007f-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).replace(/'''/g, "\\u0027\\u0027\\u0027");

/** A read-only Revit check script (IronPython 2.7 and CPython 3) with the rules embedded. */
export function pyRevitScript(rules: RevitRules, generated: string): string {
  // replacer functions, so "$" in user patterns is never read as a replacement token
  return PY.replace("__CODE__", () => rules.project.code || "the project").replace("__DATE__", () => generated).replace("__RULES__", () => pyJson(rules));
}

/** The pyRevit extension folder layout, so the check appears as a button on its own ribbon tab. */
export const PYREVIT_SCRIPT_PATH = "ISO19650.extension/ISO 19650.tab/Checks.panel/Project rules check.pushbutton/script.py";

const PY = `# -*- coding: utf-8 -*-
"""Check the open model against the ISO 19650 project rules."""
# ISO 19650 project rules check for Revit
# Generated by the ISO Information Management Portal for __CODE__ on __DATE__.
# Read-only: it reads the open model and never changes it. Results are saved to
# Documents/ISO19650 checks; drop that file on the portal's Revit checker page.
# Runs in pyRevit (IronPython, the default engine) and RevitPythonShell.
import datetime
import json
import os
import re
from Autodesk.Revit.DB import (BasePoint, BuiltInCategory, BuiltInParameter, FilteredElementCollector,
                               FamilyInstance, ImportInstance, ModelPathUtils, ViewSheet)

RULES = json.loads(r'''__RULES__''')
MAX_ITEMS = 200

doc = __revit__.ActiveUIDocument.Document
app = __revit__.Application
checks = []


def add(cid, group, label, status, value=None, expected=None, items=None, note=None):
    items = items or []
    checks.append({"id": cid, "group": group, "label": label, "status": status, "value": value,
                   "expected": expected, "count": len(items), "items": items[:MAX_ITEMS], "note": note})


def idval(i):
    v = getattr(i, "Value", None)  # Revit 2024 and later
    if v is None:
        v = i.IntegerValue
    return int(v)


def ename(e):
    try:
        return e.Name or ""
    except Exception:
        return ""


def text(p):
    if p is None or not p.HasValue:
        return ""
    s = p.AsString()
    if s is None:
        s = p.AsValueString()
    return (s or "").strip()


def find_param(e, name):
    p = e.LookupParameter(name)
    if p is None:
        t = doc.GetElement(e.GetTypeId())
        if t is not None:
            p = t.LookupParameter(name)
    return p


def item(e, problem):
    return {"id": idval(e.Id), "name": ename(e), "problem": problem}


def share_status(bad, total, warn_share):
    if bad == 0:
        return "pass"
    if total and float(bad) / total <= warn_share:
        return "warn"
    return "fail"


def model_name():
    path = doc.PathName or doc.Title
    if doc.IsWorkshared:
        try:
            path = ModelPathUtils.ConvertModelPathToUserVisiblePath(doc.GetWorksharingCentralModelPath()) or path
        except Exception:
            pass
    return os.path.splitext(os.path.basename(path))[0]


def check_file_name():
    n = RULES["naming"]
    if not n.get("checkFileName"):
        return
    name = model_name()
    parts = name.split(n["separator"])
    fields = n["fields"]
    problems = []
    if len(parts) < len(fields):
        problems.append('Expected %d fields separated by "%s", found %d' % (len(fields), n["separator"], len(parts)))
    else:
        for f, v in zip(fields, parts):
            if not re.search(f["pattern"], v):
                problems.append('%s "%s" is invalid' % (f["label"], v))
        for v in parts[len(fields):]:
            if not re.search(n["suffixPattern"], v):
                problems.append('Unexpected extra field "%s"' % v)
        if n.get("projectCode") and parts[0] != n["projectCode"]:
            problems.append('Project "%s" does not match the project code %s' % (parts[0], n["projectCode"]))
    add("file-name", "Naming", "Model file name follows the naming convention", "fail" if problems else "pass",
        name, n.get("projectCode") or None, note="; ".join(problems) or None)


def check_project_info():
    pi = doc.ProjectInformation
    for r in RULES["projectInfo"]:
        p = pi.LookupParameter(r["param"])
        v = text(p)
        exp = r.get("expected") or None
        cid = "info:" + r["param"]
        if p is None:
            add(cid, "Project information", r["param"], "fail", None, exp, note="Parameter not found in Project Information")
        elif not v:
            add(cid, "Project information", r["param"], "fail", "", exp, note="Empty")
        elif exp and v.strip().upper() != exp.strip().upper():
            add(cid, "Project information", r["param"], "fail", v, exp, note="Does not match the project data")
        else:
            add(cid, "Project information", r["param"], "pass", v, exp)


def elements_of(cat):
    bic = getattr(BuiltInCategory, cat, None)
    if bic is None:
        return None
    els = list(FilteredElementCollector(doc).OfCategory(bic).WhereElementIsNotElementType().ToElements())
    if cat == "OST_Rooms":
        els = [e for e in els if e.Location is not None]
    return els


def check_parameters():
    warn_share = RULES["thresholds"]["missingShareWarn"]
    for c in RULES["categories"]:
        els = elements_of(c["category"])
        if els is None:
            add("cat:" + c["category"], "Parameters", c["label"], "info", note="Category not found in this Revit version")
            continue
        for name in c["params"]:
            bad = []
            missing = 0
            for e in els:
                p = find_param(e, name)
                if p is None:
                    missing += 1
                if not text(p):
                    bad.append(item(e, "No value for " + name))
            note = None
            if els and missing == len(els):
                note = "The parameter does not exist on these elements: add it as a shared or project parameter"
            add("param:%s:%s" % (c["category"], name), "Parameters", "%s: %s" % (c["label"], name),
                share_status(len(bad), len(els), warn_share) if els else "info",
                "%d of %d filled" % (len(els) - len(bad), len(els)), None, bad, note)


def check_sheets():
    s = RULES["sheets"]
    sheets = [v for v in FilteredElementCollector(doc).OfClass(ViewSheet).ToElements() if not v.IsPlaceholder]
    if s.get("numberPattern"):
        rx = re.compile(s["numberPattern"])
        bad = [{"id": idval(v.Id), "name": v.SheetNumber + " - " + v.Name, "problem": "Sheet number does not match the pattern"}
               for v in sheets if not rx.search(v.SheetNumber)]
        add("sheet-number", "Sheets", "Sheet numbers follow the pattern", share_status(len(bad), len(sheets), 0),
            "%d of %d match" % (len(sheets) - len(bad), len(sheets)), s["numberPattern"], bad)
    for name in s.get("params", []):
        bad = [{"id": idval(v.Id), "name": v.SheetNumber + " - " + v.Name, "problem": "No value for " + name}
               for v in sheets if not text(v.LookupParameter(name))]
        add("sheet-param:" + name, "Sheets", "Sheets: " + name, share_status(len(bad), len(sheets), 0) if sheets else "info",
            "%d of %d filled" % (len(sheets) - len(bad), len(sheets)), None, bad)


def check_health():
    t = RULES["thresholds"]
    warnings = list(doc.GetWarnings())
    groups = {}
    for w in warnings:
        d = w.GetDescriptionText()
        if d not in groups:
            ids = list(w.GetFailingElements())
            groups[d] = {"id": idval(ids[0]) if ids else None, "name": d, "count": 0}
        groups[d]["count"] += 1
    items = sorted(groups.values(), key=lambda g: -g["count"])
    items = [{"id": g["id"], "name": g["name"], "problem": "%d warnings" % g["count"]} for g in items]
    n = len(warnings)
    add("warnings", "Model health", "Revit warnings", "pass" if n <= t["maxWarnings"] else ("warn" if n <= t["maxWarnings"] * 2 else "fail"),
        n, "<= %d" % t["maxWarnings"], items)

    inplace = []
    for e in FilteredElementCollector(doc).OfClass(FamilyInstance).ToElements():
        sym = doc.GetElement(e.GetTypeId())
        if sym is not None and sym.Family is not None and sym.Family.IsInPlace:
            inplace.append(item(e, "In-place family"))
    add("in-place", "Model health", "In-place families", "pass" if len(inplace) <= t["maxInPlace"] else "warn",
        len(inplace), "<= %d" % t["maxInPlace"], inplace)

    cad = [item(e, "Imported (not linked) CAD") for e in FilteredElementCollector(doc).OfClass(ImportInstance).ToElements() if not e.IsLinked]
    add("imported-cad", "Model health", "Imported CAD (use links instead)", "pass" if len(cad) <= t["maxImportedCad"] else "fail",
        len(cad), "<= %d" % t["maxImportedCad"], cad)

    rooms = list(FilteredElementCollector(doc).OfCategory(BuiltInCategory.OST_Rooms).WhereElementIsNotElementType().ToElements())
    unplaced = [item(e, "Not placed") for e in rooms if e.Location is None]
    open_rooms = []
    for e in rooms:
        a = e.get_Parameter(BuiltInParameter.ROOM_AREA)
        if e.Location is not None and a is not None and a.AsDouble() <= 0:
            open_rooms.append(item(e, "Not enclosed or redundant"))
    add("rooms", "Model health", "Rooms placed and enclosed", "pass" if not (unplaced or open_rooms) else "warn",
        len(unplaced) + len(open_rooms), "0", unplaced + open_rooms)


def model_info():
    add("revit-version", "Model information", "Revit version", "info", app.VersionNumber)
    add("workshared", "Model information", "Worksharing", "info", "Yes" if doc.IsWorkshared else "No")
    for bp in FilteredElementCollector(doc).OfClass(BasePoint).ToElements():
        e = bp.get_Parameter(BuiltInParameter.BASEPOINT_EASTWEST_PARAM)
        n = bp.get_Parameter(BuiltInParameter.BASEPOINT_NORTHSOUTH_PARAM)
        z = bp.get_Parameter(BuiltInParameter.BASEPOINT_ELEVATION_PARAM)
        if e is None or n is None or z is None:
            continue
        label = "Survey point" if bp.IsShared else "Project base point"
        add("point:" + label, "Model information", label + " (E, N, elevation in m)", "info",
            "%.3f, %.3f, %.3f" % (e.AsDouble() * 0.3048, n.AsDouble() * 0.3048, z.AsDouble() * 0.3048))


def main():
    for step in (check_file_name, check_project_info, check_parameters, check_sheets, check_health, model_info):
        try:
            step()
        except Exception as ex:
            add("error:" + step.__name__, "Errors", "Could not run " + step.__name__, "info", note=str(ex))
    now = datetime.datetime.now()
    result = {"schema": "iso19650-revit-results/1", "rulesFor": RULES["project"]["code"], "checked": now.strftime("%Y-%m-%d %H:%M"),
              "model": {"title": model_name(), "path": doc.PathName, "revitVersion": app.VersionNumber, "user": app.Username},
              "checks": checks}
    folder = os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), "Documents", "ISO19650 checks")
    if not os.path.isdir(folder):
        os.makedirs(folder)
    path = os.path.join(folder, "%s-%s.json" % (model_name(), now.strftime("%Y%m%d-%H%M")))
    with open(path, "w") as f:
        f.write(json.dumps(result, indent=1))
    count = lambda s: len([c for c in checks if c["status"] == s])
    print("ISO 19650 project rules check: %d passed, %d to confirm, %d failed." % (count("pass"), count("warn"), count("fail")))
    for c in checks:
        if c["status"] == "fail":
            print("  FAILED  %s (%s)" % (c["label"], c["note"] or c["value"]))
    print("Results saved to: " + path)
    print("Open the portal's Revit project check page and drop this file on it.")
    try:
        os.startfile(folder)
    except Exception:
        pass


main()
`;

/** A prompt for Claude with a Revit MCP connector: run the same read-only checks and answer with the results file. */
export function mcpPrompt(rules: RevitRules): string {
  return [
    "Use the Revit MCP connection to check the model that is open in Revit against these ISO 19650 project rules.",
    "Work read-only: do not change, save or sync the model, and do not run anything that modifies it.",
    "",
    "Checks to run:",
    "1. Model file name (central model name for workshared models) against the naming fields, separator, optional status/revision suffix and project code in rules.naming.",
    "2. Each Project Information parameter in rules.projectInfo exists, has a value and, where expected is given, matches it (case-insensitive).",
    "3. For each category in rules.categories (BuiltInCategory names; rooms only when placed), each parameter in params has a value on the instance or its type. Status: pass when none missing, warn when the missing share is at or below thresholds.missingShareWarn, otherwise fail.",
    "4. Sheets (not placeholders): sheet number matches sheets.numberPattern when given, and each parameter in sheets.params has a value.",
    "5. Model health: Revit warnings (pass at or below thresholds.maxWarnings, warn up to twice that, otherwise fail; group items by warning text), in-place families (warn above thresholds.maxInPlace), imported CAD that is not linked (fail above thresholds.maxImportedCad), rooms that are unplaced or not enclosed (warn).",
    "6. Information only: Revit version, worksharing, survey point and project base point (E, N, elevation in metres).",
    "",
    `Answer with only one JSON object, no other text, in this format (schema "${RESULTS_SCHEMA}"):`,
    `{"schema":"${RESULTS_SCHEMA}","rulesFor":"${rules.project.code}","checked":"YYYY-MM-DD HH:MM","model":{"title":"…","revitVersion":"…"},"checks":[{"id":"…","group":"Naming | Project information | Parameters | Sheets | Model health | Model information","label":"…","status":"pass | warn | fail | info","value":"…","expected":"…","count":0,"items":[{"id":123456,"name":"element name","problem":"what is wrong"}],"note":"…"}]}`,
    "List at most 200 items per check, with real element ids. I will paste your JSON into the portal to grade it.",
    "",
    "Rules:",
    JSON.stringify(rules),
  ].join("\n");
}
