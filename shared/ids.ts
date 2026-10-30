// buildingSMART IDS 1.0 (Information Delivery Specification) authoring: model, XML writer,
// tolerant XML reader, presets and an adapter to the model checker in ./ifc.
// Pure TypeScript, no DOM, so it runs in the browser, on the server and in tests.

import type { Requirement } from "./ifc";

export type IfcVersion = "IFC2X3" | "IFC4" | "IFC4X3_ADD2";
export const IFC_VERSIONS: IfcVersion[] = ["IFC2X3", "IFC4", "IFC4X3_ADD2"];
export type Cardinality = "required" | "optional" | "prohibited";
export const CARDINALITIES: Cardinality[] = ["required", "optional", "prohibited"];

export interface IdsInfo { title: string; description?: string; author?: string; version?: string; date?: string; purpose?: string; milestone?: string; copyright?: string }

export type IdsReq =
  | { kind: "attribute"; name: string; value?: string; pattern?: string; cardinality: Cardinality }
  | { kind: "property"; pset: string; name: string; dataType?: string; value?: string; pattern?: string; cardinality: Cardinality }
  | { kind: "classification"; system?: string; value?: string; pattern?: string; cardinality: Cardinality }
  | { kind: "material"; value?: string; pattern?: string; cardinality: Cardinality };
export type IdsReqKind = IdsReq["kind"];
export const REQ_KINDS: IdsReqKind[] = ["attribute", "property", "classification", "material"];

export interface IdsSpec {
  name: string; description?: string; ifcVersion: IfcVersion[];
  /** `entity` is an IFC class such as IfcDoor; several classes may be joined with "|" (written as an xs:enumeration). */
  applicability: { entity: string; predefinedType?: string };
  requirements: IdsReq[];
  /** Applicability cardinality: required = at least one such element must exist; prohibited = none may exist. */
  cardinality?: Cardinality;
}
export interface IdsDoc { info: IdsInfo; specs: IdsSpec[] }

export const IDS_NS = "http://standards.buildingsmart.org/IDS";
export const IDS_XSD = "http://standards.buildingsmart.org/IDS/1.0/ids.xsd";

// ---------------------------------------------------------------- IFC entity names

/** Common IFC classes in PascalCase, used for the entity picker and to restore casing from upper-case XML. */
export const IFC_ENTITIES = [
  "IfcProject", "IfcSite", "IfcBuilding", "IfcBuildingStorey", "IfcSpace", "IfcZone", "IfcFacility", "IfcFacilityPart", "IfcBridge", "IfcRoad", "IfcRailway",
  "IfcWall", "IfcWallStandardCase", "IfcCurtainWall", "IfcDoor", "IfcWindow", "IfcSlab", "IfcRoof", "IfcBeam", "IfcColumn", "IfcMember", "IfcPlate",
  "IfcStair", "IfcStairFlight", "IfcRamp", "IfcRampFlight", "IfcRailing", "IfcCovering", "IfcFooting", "IfcPile", "IfcBuildingElementProxy",
  "IfcChimney", "IfcShadingDevice", "IfcBuildingElement", "IfcBuiltElement", "IfcElement", "IfcElementAssembly", "IfcOpeningElement",
  "IfcFurniture", "IfcFurnishingElement", "IfcSystemFurnitureElement", "IfcTransportElement",
  "IfcFlowTerminal", "IfcFlowSegment", "IfcFlowFitting", "IfcFlowController", "IfcFlowMovingDevice", "IfcFlowStorageDevice", "IfcFlowTreatmentDevice", "IfcEnergyConversionDevice", "IfcDistributionElement", "IfcDistributionControlElement",
  "IfcPipeSegment", "IfcPipeFitting", "IfcDuctSegment", "IfcDuctFitting", "IfcCableSegment", "IfcCableCarrierSegment", "IfcCableFitting", "IfcCableCarrierFitting",
  "IfcAirTerminal", "IfcSanitaryTerminal", "IfcLightFixture", "IfcLamp", "IfcOutlet", "IfcSwitchingDevice", "IfcValve", "IfcPump", "IfcFan", "IfcBoiler", "IfcChiller",
  "IfcUnitaryEquipment", "IfcElectricDistributionBoard", "IfcFireSuppressionTerminal", "IfcSensor", "IfcAlarm", "IfcActuator", "IfcController", "IfcTank", "IfcDamper",
  "IfcSpaceHeater", "IfcWasteTerminal", "IfcCommunicationsAppliance", "IfcElectricAppliance", "IfcAudioVisualAppliance", "IfcMedicalDevice", "IfcProtectiveDevice",
  "IfcReinforcingBar", "IfcReinforcingMesh", "IfcTendon", "IfcMechanicalFastener", "IfcFastener", "IfcDiscreteAccessory", "IfcGeographicElement", "IfcCivilElement",
  "IfcGrid", "IfcAnnotation", "IfcVirtualElement", "IfcAlignment", "IfcCourse", "IfcPavement", "IfcKerb", "IfcEarthworksFill", "IfcEarthworksCut",
  "IfcElementType", "IfcTypeProduct", "IfcWallType", "IfcDoorType", "IfcWindowType", "IfcSlabType", "IfcBeamType", "IfcColumnType", "IfcMemberType", "IfcPlateType",
  "IfcStairType", "IfcRoofType", "IfcCoveringType", "IfcRailingType", "IfcFurnitureType", "IfcCurtainWallType", "IfcBuildingElementProxyType",
  "IfcPipeSegmentType", "IfcDuctSegmentType", "IfcAirTerminalType", "IfcSanitaryTerminalType", "IfcLightFixtureType", "IfcValveType", "IfcPumpType", "IfcFanType",
  "IfcBoilerType", "IfcChillerType", "IfcUnitaryEquipmentType", "IfcElectricDistributionBoardType", "IfcFireSuppressionTerminalType", "IfcSensorType", "IfcOutletType",
  "IfcSwitchingDeviceType", "IfcSpaceType", "IfcSystem", "IfcDistributionSystem", "IfcGroup",
];
const ENTITY_CASE = new Map(IFC_ENTITIES.map((e) => [e.toUpperCase(), e]));

/** Normalise any casing (IFCDOOR, ifcdoor, IfcDoor, "door") to IfcXxx PascalCase. Unknown classes keep their letters with an Ifc prefix. */
export function ifcPascal(raw: string): string {
  const s = raw.trim().replace(/[^A-Za-z0-9_]/g, "");
  if (!s) return "";
  const up = s.toUpperCase();
  const known = ENTITY_CASE.get(up) ?? ENTITY_CASE.get("IFC" + up);
  if (known) return known;
  if (/^Ifc[A-Z]/.test(s)) return s;
  const body = /^ifc/i.test(s) ? s.slice(3) : s;
  return "Ifc" + body.charAt(0).toUpperCase() + (body === body.toUpperCase() ? body.slice(1).toLowerCase() : body.slice(1));
}
const entityList = (entity: string) => entity.split("|").map((e) => e.trim()).filter(Boolean);

// ---------------------------------------------------------------- writer

export const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const EMAIL = /^[^@\s]+@[^.\s]+\..+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** An idsValue: exact simpleValue, xs:pattern restriction, or an xs:enumeration (for entity lists). */
function valueXml(tag: string, opts: { value?: string; pattern?: string; enumeration?: string[] }, pad: string): string {
  if (opts.enumeration && opts.enumeration.length > 1)
    return `${pad}<ids:${tag}>\n${pad}  <xs:restriction base="xs:string">\n${opts.enumeration.map((v) => `${pad}    <xs:enumeration value="${escapeXml(v)}"/>\n`).join("")}${pad}  </xs:restriction>\n${pad}</ids:${tag}>\n`;
  if (opts.pattern) return `${pad}<ids:${tag}>\n${pad}  <xs:restriction base="xs:string">\n${pad}    <xs:pattern value="${escapeXml(opts.pattern)}"/>\n${pad}  </xs:restriction>\n${pad}</ids:${tag}>\n`;
  const v = opts.enumeration?.[0] ?? opts.value;
  return v === undefined || v === "" ? "" : `${pad}<ids:${tag}>\n${pad}  <ids:simpleValue>${escapeXml(v)}</ids:simpleValue>\n${pad}</ids:${tag}>\n`;
}

const KIND_ORDER: Record<IdsReqKind, number> = { classification: 0, attribute: 1, property: 2, material: 3 };

function facetXml(q: IdsReq, pad: string): string {
  const inner = pad + "  ";
  const val = { value: q.value, pattern: q.pattern };
  const card = ` cardinality="${q.cardinality}"`;
  switch (q.kind) {
    case "attribute":
      return `${pad}<ids:attribute${card}>\n${valueXml("name", { value: q.name }, inner)}${valueXml("value", val, inner)}${pad}</ids:attribute>\n`;
    case "property":
      return `${pad}<ids:property${q.dataType ? ` dataType="${escapeXml(q.dataType.trim().toUpperCase())}"` : ""}${card}>\n${valueXml("propertySet", { value: q.pset }, inner)}${valueXml("baseName", { value: q.name }, inner)}${valueXml("value", val, inner)}${pad}</ids:property>\n`;
    case "classification":
      return `${pad}<ids:classification${card}>\n${valueXml("value", val, inner)}${valueXml("system", { value: q.system }, inner)}${pad}</ids:classification>\n`;
    case "material":
      return `${pad}<ids:material${card}>\n${valueXml("value", val, inner)}${pad}</ids:material>\n`;
  }
}

const OCCURS: Record<Cardinality, string> = { required: 'minOccurs="1" maxOccurs="unbounded"', optional: 'minOccurs="0" maxOccurs="unbounded"', prohibited: 'minOccurs="0" maxOccurs="0"' };

/** Write an IDS 1.0 document. Facets are ordered as ids.xsd requires; author/date are only written when they match the schema (e-mail, YYYY-MM-DD). */
export function buildIds(doc: IdsDoc): string {
  const i = doc.info;
  const el = (tag: string, v?: string) => (v && v.trim() ? `    <ids:${tag}>${escapeXml(v.trim())}</ids:${tag}>\n` : "");
  const info = `  <ids:info>\n    <ids:title>${escapeXml(i.title?.trim() || "Untitled IDS")}</ids:title>\n${el("copyright", i.copyright)}${el("version", i.version)}${el("description", i.description)}${el("author", i.author && EMAIL.test(i.author.trim()) ? i.author : undefined)}${el("date", i.date && DATE.test(i.date.trim()) ? i.date : undefined)}${el("purpose", i.purpose)}${el("milestone", i.milestone)}  </ids:info>\n`;
  const specs = doc.specs.map((s) => {
    const versions = (s.ifcVersion.length ? s.ifcVersion : ["IFC4"]).filter((v, k, a) => IFC_VERSIONS.includes(v as IfcVersion) && a.indexOf(v) === k);
    const entities = entityList(s.applicability.entity).map((e) => ifcPascal(e).toUpperCase());
    const pt = s.applicability.predefinedType?.trim();
    const reqs = [...s.requirements].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
    return `    <ids:specification name="${escapeXml(s.name.trim() || "Specification")}" ifcVersion="${versions.join(" ")}"${s.description?.trim() ? ` description="${escapeXml(s.description.trim())}"` : ""}>\n`
      + `      <ids:applicability ${OCCURS[s.cardinality ?? "required"]}>\n`
      + `        <ids:entity>\n${valueXml("name", { enumeration: entities }, "          ")}${pt ? valueXml("predefinedType", { value: pt.toUpperCase() }, "          ") : ""}        </ids:entity>\n`
      + `      </ids:applicability>\n`
      + (reqs.length ? `      <ids:requirements>\n${reqs.map((q) => facetXml(q, "        ")).join("")}      </ids:requirements>\n` : "")
      + `    </ids:specification>\n`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<ids:ids xmlns:ids="${IDS_NS}" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${IDS_NS} ${IDS_XSD}">\n${info}  <ids:specifications>\n${specs}  </ids:specifications>\n</ids:ids>\n`;
}

// ---------------------------------------------------------------- reader (tiny XML tree, no DOM)

interface XNode { tag: string; attrs: Record<string, string>; children: XNode[]; text: string }

export const unescapeXml = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|lt|gt|amp|quot|apos);/gi, (_, e: string) => {
  const k = e.toLowerCase();
  if (k[0] === "#") return String.fromCodePoint(k[1] === "x" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
  return ({ lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" } as Record<string, string>)[k];
});
const local = (name: string) => name.slice(name.indexOf(":") + 1);

function parseXmlTree(xml: string): XNode {
  const root: XNode = { tag: "#root", attrs: {}, children: [], text: "" };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/\s*([^\s>]+)\s*>|<([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  for (const m of xml.matchAll(re)) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) top.text += m[1];
    else if (m[2]) { const t = local(m[2]); for (let k = stack.length - 1; k > 0; k--) if (stack[k].tag === t) { stack.length = k; break; } }
    else if (m[3]) {
      const attrs: Record<string, string> = {};
      for (const a of (m[4] ?? "").matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[local(a[1])] = unescapeXml(a[2] ?? a[3] ?? "");
      const node: XNode = { tag: local(m[3]), attrs, children: [], text: "" };
      top.children.push(node);
      if (!m[5]) stack.push(node);
    } else if (m[6] !== undefined) top.text += unescapeXml(m[6]);
  }
  return root;
}
const kid = (n: XNode | undefined, tag: string) => n?.children.find((c) => c.tag === tag);
const kids = (n: XNode | undefined, tag: string) => n?.children.filter((c) => c.tag === tag) ?? [];
function find(n: XNode, tag: string): XNode | undefined {
  for (const c of n.children) { if (c.tag === tag) return c; const f = find(c, tag); if (f) return f; }
}
const txt = (n?: XNode) => n?.text.trim() || undefined;
const regexEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Read an idsValue element: simpleValue → value; xs:pattern → pattern; xs:enumeration → values (and an equivalent pattern). */
function readValue(n?: XNode): { value?: string; pattern?: string; values?: string[] } {
  if (!n) return {};
  const simple = kid(n, "simpleValue");
  if (simple) return { value: simple.text.trim() };
  const restr = kid(n, "restriction");
  if (restr) {
    const pat = kid(restr, "pattern")?.attrs.value;
    if (pat !== undefined) return { pattern: pat };
    const en = kids(restr, "enumeration").map((e) => e.attrs.value ?? "").filter((v) => v !== "");
    if (en.length === 1) return { value: en[0], values: en };
    if (en.length) return { pattern: en.map(regexEscape).join("|"), values: en };
    return {};
  }
  const t = txt(n);
  return t ? { value: t } : {};
}

function readCardinality(a: Record<string, string>): Cardinality {
  const c = (a.cardinality ?? a.use ?? "").toLowerCase();
  if (c === "required" || c === "optional" || c === "prohibited") return c;
  if (a.maxOccurs === "0") return "prohibited";
  if (a.minOccurs !== undefined) return Number(a.minOccurs) >= 1 ? "required" : "optional";
  return "required";
}
/** Drop undefined keys so objects compare cleanly (round trips, tests). */
const opt = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

/** Tolerant IDS reader: IDS 1.0 (with or without namespace prefixes) and the common 0.9 variants. Unsupported facets (partOf, bounds) are skipped. */
export function parseIds(xml: string): IdsDoc {
  const tree = parseXmlTree(xml);
  const infoN = find(tree, "info");
  const info: IdsInfo = opt({
    title: txt(kid(infoN, "title")) ?? "", copyright: txt(kid(infoN, "copyright")), version: txt(kid(infoN, "version")), description: txt(kid(infoN, "description")),
    author: txt(kid(infoN, "author")), date: txt(kid(infoN, "date")), purpose: txt(kid(infoN, "purpose")), milestone: txt(kid(infoN, "milestone")),
  });
  info.title ??= "";
  const specsN = find(tree, "specifications");
  const specs: IdsSpec[] = (specsN ? kids(specsN, "specification") : []).map((s) => {
    const app = kid(s, "applicability");
    const ent = kid(app, "entity");
    const nameV = readValue(kid(ent, "name"));
    const entity = (nameV.values ?? (nameV.value ? [nameV.value] : nameV.pattern ? [nameV.pattern] : [])).map(ifcPascal).join("|");
    const pt = readValue(kid(ent, "predefinedType"));
    const versions = (s.attrs.ifcVersion ?? "").split(/\s+/).map((v) => v.toUpperCase()).filter((v): v is IfcVersion => IFC_VERSIONS.includes(v as IfcVersion));
    const occ = app && (app.attrs.minOccurs !== undefined || app.attrs.maxOccurs !== undefined) ? app.attrs : s.attrs;
    const requirements: IdsReq[] = [];
    for (const f of kid(s, "requirements")?.children ?? []) {
      const cardinality = readCardinality(f.attrs);
      const v = readValue(kid(f, "value"));
      const val = opt({ value: v.value || undefined, pattern: v.pattern || undefined });
      if (f.tag === "attribute") requirements.push({ kind: "attribute", name: readValue(kid(f, "name")).value ?? "", ...val, cardinality });
      else if (f.tag === "property") {
        const pset = readValue(kid(f, "propertySet")), base = readValue(kid(f, "baseName") ?? kid(f, "name"));
        requirements.push(opt({ kind: "property" as const, pset: pset.value ?? pset.pattern ?? "", name: base.value ?? base.pattern ?? "", dataType: (f.attrs.dataType ?? f.attrs.datatype)?.toUpperCase() || undefined, ...val, cardinality }));
      } else if (f.tag === "classification") requirements.push(opt({ kind: "classification" as const, system: readValue(kid(f, "system")).value || undefined, ...val, cardinality }));
      else if (f.tag === "material") requirements.push({ kind: "material", ...val, cardinality });
    }
    return opt({
      name: s.attrs.name ?? "", description: s.attrs.description, ifcVersion: versions.length ? versions : ["IFC4" as IfcVersion],
      applicability: opt({ entity, predefinedType: pt.value || undefined }), requirements, cardinality: readCardinality(occ),
    });
  });
  return { info, specs };
}

// ---------------------------------------------------------------- validation

export interface IdsIssue { spec?: number; level: "error" | "warning"; message: string }

/** Check a pattern compiles. XSD regex is close to, but not the same as, JavaScript regex; this catches typos. */
export function patternError(p: string): string | undefined {
  try { new RegExp(`^(?:${p})$`, "u"); return undefined; } catch (e) { return e instanceof Error ? e.message : "Invalid pattern"; }
}

export function validateIds(doc: IdsDoc): IdsIssue[] {
  const out: IdsIssue[] = [];
  if (!doc.info.title.trim()) out.push({ level: "error", message: "The IDS needs a title." });
  if (doc.info.author?.trim() && !EMAIL.test(doc.info.author.trim())) out.push({ level: "warning", message: "Author must be an e-mail address in IDS 1.0; it is left out of the file." });
  if (doc.info.date?.trim() && !DATE.test(doc.info.date.trim())) out.push({ level: "warning", message: "Date must be YYYY-MM-DD; it is left out of the file." });
  if (!doc.specs.length) out.push({ level: "error", message: "Add at least one specification." });
  doc.specs.forEach((s, k) => {
    const add = (level: IdsIssue["level"], message: string) => out.push({ spec: k, level, message });
    if (!s.name.trim()) add("error", "Specification has no name.");
    if (!entityList(s.applicability.entity).length) add("error", "Applicability needs an IFC entity.");
    if (!s.ifcVersion.length) add("error", "Select at least one IFC version.");
    if (!s.requirements.length && s.cardinality !== "prohibited") add("warning", "Specification has no requirements.");
    s.requirements.forEach((q, n) => {
      const where = `Requirement ${n + 1}`;
      if (q.kind === "attribute" && !q.name.trim()) add("error", `${where}: attribute name is empty.`);
      if (q.kind === "property" && (!q.pset.trim() || !q.name.trim())) add("error", `${where}: property set and property name are required.`);
      if (q.value && q.pattern) add("warning", `${where}: both value and pattern are set; the pattern wins.`);
      if (q.pattern) { const e = patternError(q.pattern); if (e) add("error", `${where}: invalid pattern (${e}).`); }
    });
  });
  return out;
}

// ---------------------------------------------------------------- adapter to the model checker

/**
 * Requirements for shared/ifc.ts `checkRequirements`. One Requirement per applicable entity; only
 * required attribute and property facets are checked (exact values compared, patterns checked for presence).
 */
export function toRequirements(doc: IdsDoc): Requirement[] {
  return doc.specs.flatMap((s) => entityList(s.applicability.entity).map((e) => ({
    source: "IDS" as const, name: s.name, entity: ifcPascal(e).toUpperCase(),
    attributes: s.requirements.filter((q) => q.kind === "attribute" && q.cardinality === "required").map((q) => (q as { name: string }).name.trim()).filter(Boolean),
    properties: s.requirements.flatMap((q) => (q.kind === "property" && q.cardinality === "required" && q.name.trim()
      ? [opt({ pset: q.pset.trim() || undefined, property: q.name.trim(), value: q.pattern ? undefined : q.value })] : [])),
  })));
}

// ---------------------------------------------------------------- sanitising untrusted specs (AI output, localStorage)

const s = (v: unknown, max: number) => (typeof v === "string" || typeof v === "number" ? String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "");
const sOpt = (v: unknown, max: number) => s(v, max) || undefined;
const card = (v: unknown, d: Cardinality = "required"): Cardinality => { const c = s(v, 20).toLowerCase(); return (CARDINALITIES as string[]).includes(c) ? (c as Cardinality) : d; };

export function sanitiseReq(raw: unknown): IdsReq | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const kind = s(r.kind, 20).toLowerCase();
  const base = opt({ value: sOpt(r.value, 300), pattern: sOpt(r.pattern, 300) });
  if (base.pattern && patternError(base.pattern)) delete base.pattern;
  const cardinality = card(r.cardinality);
  if (kind === "attribute") { const name = s(r.name, 100).replace(/[^\w]/g, ""); return name ? { kind, name, ...base, cardinality } : null; }
  if (kind === "property") {
    const pset = s(r.pset ?? r.propertySet, 120), name = s(r.name ?? r.baseName, 120);
    const dataType = s(r.dataType, 40).toUpperCase().replace(/[^A-Z0-9_]/g, "");
    return pset && name ? opt({ kind: "property" as const, pset, name, dataType: dataType ? (dataType.startsWith("IFC") ? dataType : "IFC" + dataType) : undefined, ...base, cardinality }) : null;
  }
  if (kind === "classification") return opt({ kind: "classification" as const, system: sOpt(r.system, 120), ...base, cardinality });
  if (kind === "material") return { kind, ...base, cardinality };
  return null;
}

export function sanitiseSpec(raw: unknown, defVersion: IfcVersion = "IFC4"): IdsSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const app = (r.applicability && typeof r.applicability === "object" ? r.applicability : {}) as Record<string, unknown>;
  const entity = s(app.entity ?? r.entity, 600).split(/[|,\s]+/).map(ifcPascal).filter(Boolean).slice(0, 30).join("|");
  if (!entity) return null;
  const versions = (Array.isArray(r.ifcVersion) ? r.ifcVersion : [r.ifcVersion]).map((v) => s(v, 20).toUpperCase().replace(/^IFC4X3.*/, "IFC4X3_ADD2"))
    .filter((v, k, a): v is IfcVersion => IFC_VERSIONS.includes(v as IfcVersion) && a.indexOf(v) === k);
  const pt = s(app.predefinedType, 60).toUpperCase().replace(/[^A-Z0-9_]/g, "");
  return opt({
    name: s(r.name, 200) || `${entity.split("|")[0]} requirements`, description: sOpt(r.description, 1000), ifcVersion: versions.length ? versions : [defVersion],
    applicability: opt({ entity, predefinedType: pt || undefined }),
    requirements: (Array.isArray(r.requirements) ? r.requirements : []).slice(0, 60).map(sanitiseReq).filter((q): q is IdsReq => !!q),
    cardinality: r.cardinality === undefined ? undefined : card(r.cardinality),
  });
}
export const sanitiseSpecs = (raw: unknown, max = 40, defVersion: IfcVersion = "IFC4"): IdsSpec[] => (Array.isArray(raw) ? raw : []).slice(0, max).map((x) => sanitiseSpec(x, defVersion)).filter((x): x is IdsSpec => !!x);

// ---------------------------------------------------------------- presets

const ALL: IfcVersion[] = ["IFC4", "IFC4X3_ADD2"];
const BUILDING_ELEMENTS = "IfcWall|IfcSlab|IfcRoof|IfcBeam|IfcColumn|IfcMember|IfcPlate|IfcDoor|IfcWindow|IfcStair|IfcRamp|IfcRailing|IfcCovering|IfcCurtainWall|IfcFooting|IfcBuildingElementProxy";
const COBIE_TYPES = "IfcDoorType|IfcWindowType|IfcFurnitureType|IfcSanitaryTerminalType|IfcLightFixtureType|IfcAirTerminalType|IfcPumpType|IfcFanType|IfcBoilerType|IfcValveType|IfcUnitaryEquipmentType";

export const IDS_PRESETS: { id: string; label: string; description: string; spec: IdsSpec }[] = [
  { id: "doors-fire", label: "Doors: fire rating and external", description: "Every door carries Pset_DoorCommon.FireRating and IsExternal.", spec: {
    name: "Doors – fire rating and external flag", description: "Fire strategy and envelope checks need these on every door.", ifcVersion: ALL, cardinality: "required",
    applicability: { entity: "IfcDoor" },
    requirements: [
      { kind: "property", pset: "Pset_DoorCommon", name: "FireRating", dataType: "IFCLABEL", cardinality: "required" },
      { kind: "property", pset: "Pset_DoorCommon", name: "IsExternal", dataType: "IFCBOOLEAN", cardinality: "required" },
    ] } },
  { id: "walls-structure", label: "Walls: load bearing, external, classified", description: "Walls state LoadBearing and IsExternal and carry a classification.", spec: {
    name: "Walls – structural and envelope data", ifcVersion: ALL, cardinality: "required",
    applicability: { entity: "IfcWall" },
    requirements: [
      { kind: "classification", cardinality: "required" },
      { kind: "property", pset: "Pset_WallCommon", name: "LoadBearing", dataType: "IFCBOOLEAN", cardinality: "required" },
      { kind: "property", pset: "Pset_WallCommon", name: "IsExternal", dataType: "IFCBOOLEAN", cardinality: "required" },
    ] } },
  { id: "spaces", label: "Spaces: name, long name and area", description: "Spaces have a number (Name), a room name (LongName) and a net floor area.", spec: {
    name: "Spaces – identification and area", ifcVersion: ALL, cardinality: "required",
    applicability: { entity: "IfcSpace" },
    requirements: [
      { kind: "attribute", name: "Name", cardinality: "required" },
      { kind: "attribute", name: "LongName", cardinality: "required" },
      { kind: "property", pset: "Qto_SpaceBaseQuantities", name: "NetFloorArea", dataType: "IFCAREAMEASURE", cardinality: "required" },
    ] } },
  { id: "cobie-types", label: "COBie-style minimum for types", description: "Maintainable element types have a Name, a Description and a classification.", spec: {
    name: "COBie minimum – element types", description: "Minimum type data for COBie Type sheet hand-over.", ifcVersion: ALL, cardinality: "optional",
    applicability: { entity: COBIE_TYPES },
    requirements: [
      { kind: "classification", cardinality: "required" },
      { kind: "attribute", name: "Name", cardinality: "required" },
      { kind: "attribute", name: "Description", cardinality: "required" },
    ] } },
  { id: "uniclass", label: "Uniclass on building elements", description: "Building elements carry a Uniclass 2015 code (EF, Ss or Pr table).", spec: {
    name: "Uniclass 2015 classification on building elements", description: "IDS entity facets do not include subtypes, so the common building element classes are listed.", ifcVersion: ALL, cardinality: "required",
    applicability: { entity: BUILDING_ELEMENTS },
    requirements: [
      { kind: "classification", system: "Uniclass 2015", pattern: "(EF|Ss|Pr)_[0-9]{2}(_[0-9]{2}){1,3}", cardinality: "required" },
    ] } },
];

export const emptySpec = (): IdsSpec => ({ name: "", ifcVersion: ["IFC4"], applicability: { entity: "" }, requirements: [], cardinality: "required" });
export const emptyReq = (kind: IdsReqKind): IdsReq =>
  kind === "attribute" ? { kind, name: "", cardinality: "required" }
    : kind === "property" ? { kind, pset: "", name: "", cardinality: "required" }
      : { kind, cardinality: "required" };
