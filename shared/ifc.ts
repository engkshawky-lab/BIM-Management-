// Pure TypeScript IFC (ISO 10303-21 STEP) reader and model checks.
// Works for IFC2X3, IFC4 and IFC4X3 exchange files without any native/Python dependency.

import type { Finding } from "./delivery";

export type StepValue = null | "*" | number | string | boolean | StepRef | StepEnum | StepTyped | StepValue[];
export interface StepRef { ref: number }
export interface StepEnum { enum: string }
export interface StepTyped { type: string; value: StepValue }
export interface StepEntity { id: number; type: string; args: StepValue[] }

const isRef = (v: StepValue): v is StepRef => !!v && typeof v === "object" && "ref" in v;
const isTyped = (v: StepValue): v is StepTyped => !!v && typeof v === "object" && "type" in v && "value" in v;

/** Decode STEP string escapes: '' quote, \X2\hhhh\X0\ unicode, \X\hh latin-1, \S\ shift. */
function decodeString(s: string): string {
  return s
    .replace(/\\X2\\((?:[0-9A-F]{4})+)\\X0\\/gi, (_, hex: string) => String.fromCharCode(...hex.match(/.{4}/g)!.map((h) => parseInt(h, 16))))
    .replace(/\\X\\([0-9A-F]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\S\\(.)/g, (_, c: string) => String.fromCharCode(c.charCodeAt(0) + 128));
}

/** Parse a STEP argument list body, e.g. `'abc',$,#12,(1.,2.),.T.,IFCLABEL('x')`. */
export const parseArgs = (body: string) => parseArgsList("(" + body + ")") as StepValue[];

/** Parse one STEP value (a parenthesised list for argument lists). */
function parseArgsList(src: string): StepValue {
  let i = 0;
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const value = (): StepValue => {
    ws();
    const c = src[i];
    if (c === "$") { i++; return null; }
    if (c === "*") { i++; return "*"; }
    if (c === "'") {
      let out = ""; i++;
      while (i < src.length) {
        if (src[i] === "'" && src[i + 1] === "'") { out += "'"; i += 2; }
        else if (src[i] === "'") { i++; break; }
        else out += src[i++];
      }
      return decodeString(out);
    }
    if (c === "#") { const m = /^#(\d+)/.exec(src.slice(i))!; i += m[0].length; return { ref: +m[1] }; }
    if (c === ".") {
      const m = /^\.([A-Z0-9_]+)\./i.exec(src.slice(i));
      if (m) {
        i += m[0].length;
        const e = m[1].toUpperCase();
        return e === "T" ? true : e === "F" ? false : e === "U" ? null : { enum: e };
      }
    }
    if (c === "(") {
      i++;
      const out: StepValue[] = [];
      ws();
      if (src[i] === ")") { i++; return out; }
      for (;;) {
        out.push(value()); ws();
        if (src[i] === ",") { i++; continue; }
        if (src[i] === ")") { i++; return out; }
        throw new Error(`Expected "," or ")" at "${src.slice(i, i + 20)}"`);
      }
    }
    if (c === '"') { const end = src.indexOf('"', i + 1); const v = src.slice(i + 1, end); i = end + 1; return v; }
    const num = /^[-+]?(\d+\.?\d*(E[-+]?\d+)?|\.\d+)/i.exec(src.slice(i));
    if (num) { i += num[0].length; return parseFloat(num[0]); }
    const typed = /^([A-Z0-9_]+)\s*(?=\()/i.exec(src.slice(i));
    if (typed) { i += typed[0].length; const inner = value() as StepValue[]; return { type: typed[1].toUpperCase(), value: inner.length === 1 ? inner[0] : inner }; }
    throw new Error(`Unexpected token "${src.slice(i, i + 20)}"`);
  };
  return value();
}

export interface StepFile {
  header: { description: string[]; name: string; timestamp: string; author: string[]; organization: string[]; preprocessor: string; originatingSystem: string; schema: string[] };
  entities: Map<number, StepEntity>;
  byType: Map<string, StepEntity[]>;
  errors: string[];
}

/** Split the DATA section into statements, respecting quoted strings (which may contain ';'). */
function* statements(text: string): Generator<string> {
  let start = 0, inStr = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'") { if (inStr && text[i + 1] === "'") { i++; continue; } inStr = !inStr; }
    else if (c === "/" && !inStr && text[i + 1] === "*") { const end = text.indexOf("*/", i + 2); i = end < 0 ? text.length : end + 1; }
    else if (c === ";" && !inStr) { yield text.slice(start, i).trim(); start = i + 1; }
  }
}

export function parseStep(text: string): StepFile {
  if (!/ISO-10303-21/i.test(text.slice(0, 200))) throw new Error("Not an IFC STEP file (missing ISO-10303-21 header).");
  const errors: string[] = [];
  const entities = new Map<number, StepEntity>();
  const byType = new Map<string, StepEntity[]>();
  const header: StepFile["header"] = { description: [], name: "", timestamp: "", author: [], organization: [], preprocessor: "", originatingSystem: "", schema: [] };
  const str = (v: StepValue) => (typeof v === "string" ? v : "");
  const strs = (v: StepValue) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x !== "") : []);

  let section = "";
  for (const st of statements(text)) {
    if (!st) continue;
    const upper = st.slice(0, 20).toUpperCase();
    if (upper.startsWith("HEADER") || upper.startsWith("DATA")) { section = upper.startsWith("DATA") ? "DATA" : "HEADER"; continue; }
    if (upper.startsWith("ENDSEC")) { section = ""; continue; }
    if (section === "HEADER") {
      const m = /^([A-Z_]+)\s*\(([\s\S]*)\)$/i.exec(st);
      if (!m) continue;
      try {
        const args = parseArgsList("(" + m[2] + ")") as StepValue[];
        const kind = m[1].toUpperCase();
        if (kind === "FILE_DESCRIPTION") header.description = strs(args[0]);
        if (kind === "FILE_NAME") Object.assign(header, { name: str(args[0]), timestamp: str(args[1]), author: strs(args[2]), organization: strs(args[3]), preprocessor: str(args[4]), originatingSystem: str(args[5]) });
        if (kind === "FILE_SCHEMA") header.schema = strs(args[0]);
      } catch (e) { errors.push(`Header: ${(e as Error).message}`); }
    } else if (section === "DATA") {
      const m = /^#(\d+)\s*=\s*([A-Z0-9_]+)\s*\(([\s\S]*)\)$/i.exec(st);
      if (!m) { if (errors.length < 50) errors.push(`Unparsed statement: ${st.slice(0, 60)}`); continue; }
      try {
        const e: StepEntity = { id: +m[1], type: m[2].toUpperCase(), args: parseArgsList("(" + m[3] + ")") as StepValue[] };
        entities.set(e.id, e);
        let list = byType.get(e.type); if (!list) byType.set(e.type, (list = []));
        list.push(e);
      } catch (err) { if (errors.length < 50) errors.push(`#${m[1]}: ${(err as Error).message}`); }
    }
  }
  return { header, entities, byType, errors };
}

// ---------------------------------------------------------------- model

const SPATIAL = new Set(["IFCSITE", "IFCBUILDING", "IFCBUILDINGSTOREY", "IFCSPACE", "IFCFACILITY", "IFCFACILITYPART", "IFCBRIDGE", "IFCROAD", "IFCRAILWAY"]);
const NON_ELEMENT = new Set(["IFCPROJECT", "IFCOWNERHISTORY", "IFCANNOTATION", "IFCGRID", "IFCOPENINGELEMENT", "IFCVIRTUALELEMENT", "IFCPROJECTLIBRARY", "IFCGROUP", "IFCSYSTEM", "IFCZONE", "IFCDISTRIBUTIONSYSTEM", "IFCDISTRIBUTIONPORT", "IFCPORT", "IFCALIGNMENT"]);
const GUID = /^[0-9A-Za-z_$]{22}$/;

export interface IfcElement {
  id: number; guid: string; type: string; name: string; description: string; objectType: string; tag: string;
  storey: string; typeName: string; psets: Record<string, Record<string, string>>; classification: { system: string; code: string; name: string }[];
}

export interface IfcModel {
  schema: string; header: StepFile["header"]; elements: IfcElement[]; spatial: IfcElement[];
  storeys: { name: string; elevation: number | null }[]; units: { type: string; unit: string }[];
  georeferenced: { mapConversion: boolean; crs: string; siteLatLong: boolean }; duplicateGuids: string[]; parseErrors: string[]; entityCount: number;
}

const display = (v: StepValue): string => {
  if (v === null || v === undefined || v === "*") return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(+v.toFixed(6));
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (isTyped(v)) return display(v.value);
  if (Array.isArray(v)) return v.map(display).join(", ");
  if ("enum" in v) return v.enum;
  return "";
};

export function buildModel(file: StepFile): IfcModel {
  const E = file.entities;
  const get = (v: StepValue) => (isRef(v) ? E.get(v.ref) : undefined);
  const refs = (v: StepValue) => (Array.isArray(v) ? v.filter(isRef).map((r) => E.get(r.ref)).filter((x): x is StepEntity => !!x) : []);
  const all = (t: string) => file.byType.get(t) ?? [];

  // property definitions -> { psetName: { prop: value } }
  const readPset = (p: StepEntity | undefined): [string, Record<string, string>] | null => {
    if (!p) return null;
    if (p.type === "IFCPROPERTYSET") {
      const props: Record<string, string> = {};
      for (const prop of refs(p.args[4])) {
        const name = display(prop.args[0]);
        if (prop.type === "IFCPROPERTYSINGLEVALUE") props[name] = display(prop.args[2]);
        else if (prop.type === "IFCPROPERTYENUMERATEDVALUE" || prop.type === "IFCPROPERTYLISTVALUE") props[name] = display(prop.args[2]);
        else if (prop.type === "IFCPROPERTYBOUNDEDVALUE") props[name] = [display(prop.args[3]), display(prop.args[2])].filter(Boolean).join(" – ");
        else props[name] = display(prop.args[2] ?? null);
      }
      return [display(p.args[2]), props];
    }
    if (p.type === "IFCELEMENTQUANTITY") {
      const props: Record<string, string> = {};
      for (const q of refs(p.args[5])) props[display(q.args[0])] = display(q.args[3]);
      return [display(p.args[2]), props];
    }
    return null;
  };

  const instPsets = new Map<number, Record<string, Record<string, string>>>();
  const addPset = (target: number, pset: [string, Record<string, string>] | null, override: boolean) => {
    if (!pset) return;
    const cur = instPsets.get(target) ?? {};
    cur[pset[0]] = override ? { ...(cur[pset[0]] ?? {}), ...pset[1] } : { ...pset[1], ...(cur[pset[0]] ?? {}) };
    instPsets.set(target, cur);
  };
  // type psets first (instance values override them)
  const typeName = new Map<number, string>();
  for (const rel of all("IFCRELDEFINESBYTYPE")) {
    const t = get(rel.args[5]);
    if (!t) continue;
    for (const obj of refs(rel.args[4])) {
      typeName.set(obj.id, display(t.args[2]));
      for (const p of refs(t.args[5])) addPset(obj.id, readPset(p), false);
    }
  }
  for (const rel of all("IFCRELDEFINESBYPROPERTIES")) {
    const pset = readPset(get(rel.args[5]));
    for (const obj of refs(rel.args[4])) addPset(obj.id, pset, true);
  }

  const classification = new Map<number, IfcElement["classification"]>();
  for (const rel of all("IFCRELASSOCIATESCLASSIFICATION")) {
    const c = get(rel.args[5]);
    if (!c) continue;
    let entry: IfcElement["classification"][number];
    if (c.type === "IFCCLASSIFICATIONREFERENCE") {
      const src = get(c.args[3]);
      entry = { code: display(c.args[1]), name: display(c.args[2]), system: src ? display(src.type === "IFCCLASSIFICATION" ? src.args[3] : src.args[2]) : "" };
    } else entry = { code: "", name: display(c.args[3] ?? c.args[0]), system: display(c.args[3] ?? "") };
    for (const obj of refs(rel.args[4])) classification.set(obj.id, [...(classification.get(obj.id) ?? []), entry]);
  }

  const container = new Map<number, string>();
  for (const rel of all("IFCRELCONTAINEDINSPATIALSTRUCTURE")) {
    const s = get(rel.args[5]);
    for (const obj of refs(rel.args[4])) container.set(obj.id, s ? display(s.args[2]) : "");
  }

  const elements: IfcElement[] = [];
  const spatial: IfcElement[] = [];
  const guidCount = new Map<string, number>();
  for (const e of E.values()) {
    const guid = e.args[0];
    if (typeof guid !== "string" || !GUID.test(guid)) continue;
    guidCount.set(guid, (guidCount.get(guid) ?? 0) + 1);
    // IfcProduct instances have ObjectPlacement (arg 5) and Representation (arg 6) slots
    if (e.type.startsWith("IFCREL") || e.type.endsWith("TYPE") || e.type.endsWith("STYLE") || NON_ELEMENT.has(e.type) || e.args.length < 7) continue;
    if (e.type === "IFCPROPERTYSET" || e.type === "IFCELEMENTQUANTITY") continue;
    const el: IfcElement = {
      id: e.id, guid, type: e.type, name: display(e.args[2]), description: display(e.args[3]), objectType: display(e.args[4]),
      tag: SPATIAL.has(e.type) ? "" : display(e.args[7] ?? null), storey: container.get(e.id) ?? "", typeName: typeName.get(e.id) ?? "",
      psets: instPsets.get(e.id) ?? {}, classification: classification.get(e.id) ?? [],
    };
    (SPATIAL.has(e.type) ? spatial : elements).push(el);
  }

  const storeys = all("IFCBUILDINGSTOREY").map((s) => ({ name: display(s.args[2]), elevation: typeof s.args[9] === "number" ? s.args[9] : null }));
  const units = all("IFCSIUNIT").map((u) => ({ type: display(u.args[1]), unit: [display(u.args[2]), display(u.args[3])].filter(Boolean).join(" ") }))
    .concat(all("IFCCONVERSIONBASEDUNIT").map((u) => ({ type: display(u.args[1]), unit: display(u.args[2]) })));
  const crs = all("IFCPROJECTEDCRS")[0];
  const site = all("IFCSITE")[0];
  return {
    schema: file.header.schema[0] ?? "", header: file.header, elements, spatial, storeys, units,
    georeferenced: { mapConversion: all("IFCMAPCONVERSION").length > 0, crs: crs ? display(crs.args[0]) : "", siteLatLong: !!site && Array.isArray(site.args[9]) && site.args[9].length > 0 },
    duplicateGuids: [...guidCount].filter(([, n]) => n > 1).map(([g]) => g), parseErrors: file.errors, entityCount: E.size,
  };
}

// ---------------------------------------------------------------- requirements (LOIN / IDS)

export interface PropertyRequirement { pset?: string; property: string; value?: string }
export interface Requirement { source: "LOIN" | "IDS"; name: string; entity: string; properties: PropertyRequirement[]; attributes: string[] }

/** LOIN alphanumeric text like "Pset_DoorCommon.FireRating, IsExternal, Pset_ManufacturerTypeInformation.Manufacturer". */
export function requirementsFromLoin(rows: { ref: string; element: string; ifcClass: string; alphanumeric: string }[]): Requirement[] {
  return rows.filter((r) => r.ifcClass.trim() && r.alphanumeric.trim()).map((r) => ({
    source: "LOIN" as const, name: `${r.ref} ${r.element}`, entity: r.ifcClass.trim().toUpperCase(), attributes: [],
    properties: r.alphanumeric.split(/[,;\n]/).map((s) => s.trim()).filter((s) => /^[A-Za-z_][\w.]*(\s*=\s*.+)?$/.test(s)).map((s) => {
      const [path, value] = s.split("=").map((x) => x.trim());
      const parts = path.split(".");
      return parts.length > 1 ? { pset: parts[0], property: parts.slice(1).join("."), value } : { property: parts[0], value };
    }),
  })).filter((r) => r.properties.length);
}

const xmlText = (block: string, tag: string) => {
  const m = new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`, "i").exec(block);
  if (!m) return undefined;
  const simple = /<(?:\w+:)?simpleValue>([\s\S]*?)<\/(?:\w+:)?simpleValue>/i.exec(m[1]);
  return (simple ? simple[1] : m[1]).trim();
};
const blocks = (xml: string, tag: string) => [...xml.matchAll(new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*?(?:/>|>([\\s\\S]*?)</(?:\\w+:)?${tag}>)`, "gi"))].map((m) => ({ attrs: m[0].slice(0, m[0].indexOf(">")), body: m[1] ?? "" }));

/** buildingSMART IDS 1.0 subset: entity applicability with property and attribute requirements (simple values). */
export function requirementsFromIds(xml: string): { requirements: Requirement[]; unsupported: number } {
  const requirements: Requirement[] = [];
  let unsupported = 0;
  for (const spec of blocks(xml, "specification")) {
    const name = /name="([^"]*)"/.exec(spec.attrs)?.[1] ?? "Specification";
    const applicability = blocks(spec.body, "applicability")[0]?.body ?? "";
    const entityBlock = blocks(applicability, "entity")[0]?.body;
    const entity = entityBlock ? xmlText(entityBlock, "name") : undefined;
    if (!entity) { unsupported++; continue; }
    const reqBody = blocks(spec.body, "requirements")[0]?.body ?? "";
    const properties = blocks(reqBody, "property").map((p) => ({ pset: xmlText(p.body, "propertySet"), property: xmlText(p.body, "baseName") ?? xmlText(p.body, "name") ?? "", value: xmlText(p.body, "value") })).filter((p) => p.property);
    const attributes = blocks(reqBody, "attribute").map((a) => xmlText(a.body, "name") ?? "").filter(Boolean);
    unsupported += blocks(reqBody, "classification").length + blocks(reqBody, "material").length + blocks(reqBody, "partOf").length;
    requirements.push({ source: "IDS", name, entity: entity.toUpperCase(), properties, attributes });
  }
  return { requirements, unsupported };
}

const matchesEntity = (type: string, entity: string) => type === entity || (entity === "IFCWALL" && type === "IFCWALLSTANDARDCASE") || (entity === "IFCSLAB" && type === "IFCSLABSTANDARDCASE") || (entity === "IFCBEAM" && type === "IFCBEAMSTANDARDCASE") || (entity === "IFCCOLUMN" && type === "IFCCOLUMNSTANDARDCASE");

function findProp(el: IfcElement, req: PropertyRequirement): string | undefined {
  if (req.pset) return el.psets[req.pset]?.[req.property];
  for (const props of Object.values(el.psets)) if (req.property in props) return props[req.property];
}

export interface RequirementResult { source: Requirement["source"]; name: string; entity: string; applicable: number; passed: number; checks: string[]; failures: { guid: string; name: string; missing: string[] }[] }

export function checkRequirements(model: IfcModel, reqs: Requirement[]): RequirementResult[] {
  return reqs.map((r) => {
    const els = [...model.elements, ...model.spatial].filter((e) => matchesEntity(e.type, r.entity));
    const failures: RequirementResult["failures"] = [];
    for (const el of els) {
      const missing: string[] = [];
      for (const a of r.attributes) {
        const v = (el as unknown as Record<string, string>)[a.charAt(0).toLowerCase() + a.slice(1)];
        if (!v) missing.push(a);
      }
      for (const p of r.properties) {
        const v = findProp(el, p);
        const label = (p.pset ? `${p.pset}.` : "") + p.property;
        if (v === undefined || v === "") missing.push(label);
        else if (p.value && v.toLowerCase() !== p.value.toLowerCase()) missing.push(`${label} = "${p.value}" (found "${v}")`);
      }
      if (missing.length) failures.push({ guid: el.guid, name: el.name || el.type, missing });
    }
    return { source: r.source, name: r.name, entity: r.entity, applicable: els.length, passed: els.length - failures.length,
      checks: [...r.attributes, ...r.properties.map((p) => (p.pset ? `${p.pset}.` : "") + p.property + (p.value ? ` = ${p.value}` : ""))], failures };
  });
}

// ---------------------------------------------------------------- report

export interface IfcCheck { id: string; name: string; passed: number; failed: number; detail: string }
export interface IfcReport {
  schema: string; entityCount: number; elementCount: number; classCounts: Record<string, number>; storeys: IfcModel["storeys"];
  header: IfcModel["header"]; checks: IfcCheck[]; requirements: RequirementResult[]; findings: Finding[]; score: number;
  classificationSystems: string[]; psetCoverage: { pset: string; elements: number }[];
}

const GENERIC_NAME = /^(default|generic|unnamed|new |copy of|basic wall|undefined|none)\b/i;

export function analyseIfc(text: string, opts: { requirements?: Requirement[] } = {}): IfcReport {
  return analyseModel(buildModel(parseStep(text)), opts);
}

/** The same checks on an already-parsed model (lets callers reuse the model, e.g. to list elements). */
export function analyseModel(model: IfcModel, opts: { requirements?: Requirement[] } = {}): IfcReport {
  const f: Finding[] = [];
  const checks: IfcCheck[] = [];
  const add = (id: string, name: string, passed: number, failed: number, detail: string) => checks.push({ id, name, passed, failed, detail });
  const els = model.elements;
  const h = model.header;

  // 1 header
  const headerItems: [string, boolean][] = [["Schema declared", h.schema.length > 0], ["Author", h.author.length > 0], ["Organization", h.organization.length > 0], ["Originating system", !!(h.originatingSystem || h.preprocessor)]];
  add("header", "File header", headerItems.filter(([, ok]) => ok).length, headerItems.filter(([, ok]) => !ok).length, headerItems.map(([l, ok]) => `${ok ? "✓" : "✗"} ${l}`).join(" · "));
  for (const [l, ok] of headerItems) if (!ok) f.push({ severity: l === "Schema declared" ? "error" : "warning", area: "File header", message: `${l} is missing in the file header.` });
  if (model.schema && !/^IFC(2X3|4|4X3)/i.test(model.schema)) f.push({ severity: "warning", area: "File header", message: `Unusual schema ${model.schema}.` });

  // 2 spatial
  const count = (t: string) => model.spatial.filter((s) => s.type === t).length;
  const spatial: [string, number, boolean][] = [["IfcSite", count("IFCSITE"), true], ["IfcBuilding / facility", count("IFCBUILDING") + count("IFCFACILITY") + count("IFCBRIDGE") + count("IFCROAD") + count("IFCRAILWAY"), true], ["IfcBuildingStorey", count("IFCBUILDINGSTOREY"), true], ["IfcSpace", count("IFCSPACE"), false]];
  add("spatial", "Spatial structure", spatial.filter(([, n, req]) => n > 0 || !req).length, spatial.filter(([, n, req]) => !n && req).length, spatial.map(([l, n]) => `${l}: ${n}`).join(" · "));
  for (const [l, n, req] of spatial) if (!n) f.push({ severity: req ? "error" : "info", area: "Spatial structure", message: `No ${l} defined.` });
  const uncontained = els.filter((e) => !e.storey && !["IFCFURNISHINGELEMENT"].includes(e.type));
  if (uncontained.length) f.push({ severity: "warning", area: "Spatial structure", message: `${uncontained.length} elements are not contained in a storey/spatial element.`, ref: uncontained.slice(0, 3).map((e) => e.name || e.guid).join(", ") });

  // 3 naming
  const badNames = els.filter((e) => !e.name.trim() || GENERIC_NAME.test(e.name));
  add("naming", "Element names", els.length - badNames.length, badNames.length, `${badNames.length} missing or generic names`);
  if (badNames.length) f.push({ severity: "warning", area: "Naming", message: `${badNames.length} of ${els.length} elements have missing or generic names.`, ref: badNames.slice(0, 3).map((e) => e.guid).join(", ") });

  // 4 property sets
  const noPsets = els.filter((e) => !Object.keys(e.psets).some((k) => !/^Qto_|BaseQuantities/i.test(k)));
  add("psets", "Property sets", els.length - noPsets.length, noPsets.length, `${noPsets.length} elements without any property set`);
  if (noPsets.length) f.push({ severity: "warning", area: "Property sets", message: `${noPsets.length} elements have no property sets.` });
  const coverage = new Map<string, number>();
  for (const e of els) for (const p of Object.keys(e.psets)) coverage.set(p, (coverage.get(p) ?? 0) + 1);

  // 5 classification
  const classified = els.filter((e) => e.classification.length);
  const systems = [...new Set(els.flatMap((e) => e.classification.map((c) => c.system)).filter(Boolean))];
  add("classification", "Classification", classified.length, els.length - classified.length, systems.length ? `Systems: ${systems.join(", ")}` : "No classification system");
  if (els.length && classified.length / els.length < 0.8) f.push({ severity: "warning", area: "Classification", message: `Only ${Math.round((classified.length / els.length) * 100)}% of elements are classified (e.g. Uniclass).` });

  // 6 georeferencing
  const geo = model.georeferenced;
  const geoOk = geo.mapConversion || geo.siteLatLong;
  add("georef", "Georeferencing", geoOk ? 1 : 0, geoOk ? 0 : 1, geo.mapConversion ? `IfcMapConversion${geo.crs ? ` (${geo.crs})` : ""}` : geo.siteLatLong ? "Site latitude/longitude" : "None");
  if (!geoOk) f.push({ severity: "warning", area: "Georeferencing", message: "Model is not georeferenced (no IfcMapConversion or site latitude/longitude)." });

  // 7 units
  const length = model.units.find((u) => u.type === "LENGTHUNIT");
  add("units", "Units", length ? 1 : 0, length ? 0 : 1, model.units.map((u) => `${u.type.replace("UNIT", "").toLowerCase()}: ${u.unit}`).join(" · ") || "None");
  if (!length) f.push({ severity: "error", area: "Units", message: "No length unit defined." });

  // 8 GUIDs
  add("guids", "GUID uniqueness", els.length + model.spatial.length - model.duplicateGuids.length, model.duplicateGuids.length, `${model.duplicateGuids.length} duplicates`);
  if (model.duplicateGuids.length) f.push({ severity: "error", area: "GUIDs", message: `${model.duplicateGuids.length} duplicate GlobalIds — elements cannot be tracked reliably.`, ref: model.duplicateGuids.slice(0, 3).join(", ") });

  // 9 COBie-relevant attributes on components (manufacturer/model on maintainable components)
  const maintainable = els.filter((e) => /DOOR|WINDOW|FLOW|TERMINAL|PUMP|FAN|BOILER|CHILLER|VALVE|AIRTERMINAL|LIGHTFIXTURE|SANITARY|UNITARY|COIL|TANK|FIRESUPPRESSION|ALARM|SENSOR|ELECTRICAPPLIANCE|TRANSPORT/i.test(e.type));
  const withMfr = maintainable.filter((e) => findProp(e, { property: "Manufacturer" }) && (findProp(e, { property: "ModelReference" }) || findProp(e, { property: "ModelLabel" })));
  add("cobie", "COBie attributes", withMfr.length, maintainable.length - withMfr.length, `${maintainable.length} maintainable components, ${withMfr.length} with manufacturer & model`);
  if (maintainable.length && withMfr.length < maintainable.length) f.push({ severity: "info", area: "COBie", message: `${maintainable.length - withMfr.length} maintainable components lack Manufacturer / ModelReference (Pset_ManufacturerTypeInformation).` });

  if (model.parseErrors.length) f.push({ severity: "warning", area: "File", message: `${model.parseErrors.length} statements could not be read.`, ref: model.parseErrors[0] });

  // requirements
  const requirements = checkRequirements(model, opts.requirements ?? []);
  for (const r of requirements) {
    if (!r.applicable) f.push({ severity: "info", area: `${r.source} requirements`, message: `${r.name}: no ${r.entity} elements in this model.` });
    else if (r.failures.length) f.push({ severity: "error", area: `${r.source} requirements`, message: `${r.name}: ${r.failures.length} of ${r.applicable} ${r.entity} elements miss ${[...new Set(r.failures.flatMap((x) => x.missing))].slice(0, 4).join(", ")}.` });
  }

  const classCounts: Record<string, number> = {};
  for (const e of els) classCounts[e.type] = (classCounts[e.type] ?? 0) + 1;
  const errors = f.filter((x) => x.severity === "error").length, warnings = f.filter((x) => x.severity === "warning").length;
  return {
    schema: model.schema, entityCount: model.entityCount, elementCount: els.length, classCounts, storeys: model.storeys, header: h, checks, requirements, findings: f,
    score: Math.max(0, 100 - errors * 12 - warnings * 4), classificationSystems: systems,
    psetCoverage: [...coverage].map(([pset, n]) => ({ pset, elements: n })).sort((a, b) => b.elements - a.elements),
  };
}
