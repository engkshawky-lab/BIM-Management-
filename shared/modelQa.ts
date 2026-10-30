// AI model QA from IDS: deterministic checks of an IFC model against IDS / LOIN requirements,
// grouped failures, a compact summary for the AI and BCF topics per failure group.
// Pure TypeScript (no DOM), so it runs in a Web Worker, on the server and in tests.

import type { BcfTopic } from "./bcf";
import { newGuid } from "./bcfStudio";
import { checkRequirements, type IfcElement, type IfcModel, type Requirement, type RequirementResult } from "./ifc";
import { ifcPascal } from "./ids";

export type Discipline = "architecture" | "structure" | "MEP" | "civil" | "other";
export const DISCIPLINES: Discipline[] = ["architecture", "structure", "MEP", "civil", "other"];

const STRUCTURE = /^IFC(BEAM|COLUMN|FOOTING|PILE|DEEPFOUNDATION|CAISSONFOUNDATION|MEMBER|PLATE|REINFORCING|TENDON|MECHANICALFASTENER|FASTENER|STRUCTURAL|BEARING)/;
const MEP = /^IFC(FLOW|DUCT|PIPE|CABLE|AIRTERMINAL|AIRTOAIR|SANITARY|LIGHTFIXTURE|LAMP|OUTLET|SWITCHINGDEVICE|VALVE|PUMP|FAN|BOILER|CHILLER|UNITARY|ELECTRIC|FIRESUPPRESSION|SENSOR|ALARM|ACTUATOR|CONTROLLER|TANK|DAMPER|SPACEHEATER|WASTETERMINAL|COMMUNICATIONSAPPLIANCE|AUDIOVISUAL|PROTECTIVEDEVICE|DISTRIBUTION|ENERGYCONVERSION|COIL|HEATEXCHANGER|COOLINGTOWER|COOLEDBEAM|COMPRESSOR|CONDENSER|EVAPORAT|HUMIDIFIER|FILTER|INTERCEPTOR|MOTORCONNECTION|ELECTRICMOTOR|TRANSFORMER|JUNCTIONBOX|MEDICALDEVICE|SOLARDEVICE|BURNER|ENGINE|GENERATOR|TUBEBUNDLE|STACKTERMINAL|FLOWMETER|UNITARYCONTROL|TRANSPORTELEMENT|MOBILETELECOMMUNICATIONS)/;
const CIVIL = /^IFC(COURSE|PAVEMENT|KERB|EARTHWORKS|GEOGRAPHIC|CIVIL|ALIGNMENT|ROAD|RAILWAY|RAIL$|RAILTYPE|TRACKELEMENT|BRIDGE|SIGN|GEOTECHNICAL|BOREHOLE|GEOMODEL|GEOSLICE|REINFORCEDSOIL|MARINE|NAVIGATIONELEMENT|SITE$)/;
const ARCH = /^IFC(WALL|DOOR|WINDOW|SLAB|ROOF|STAIR|RAMP|RAILING|COVERING|CURTAINWALL|FURNI|SYSTEMFURNITURE|CHIMNEY|SHADINGDEVICE|SPACE|ZONE|BUILDINGSTOREY|BUILDING$|BUILDINGELEMENTPART)/;

/** Discipline guess from the IFC class (instance or type class). */
export function disciplineOf(ifcClass: string): Discipline {
  const c = ifcClass.toUpperCase();
  if (STRUCTURE.test(c)) return "structure";
  if (MEP.test(c)) return "MEP";
  if (CIVIL.test(c)) return "civil";
  if (ARCH.test(c)) return "architecture";
  return "other";
}

// ---------------------------------------------------------------- run

export interface QaFailure { reqIndex: number; requirement: string; entity: string; guid: string; type: string; name: string; storey: string; discipline: Discipline; missing: string[] }
export interface QaRequirementResult extends Omit<RequirementResult, "failures"> { index: number; failed: number }
export interface QaResult {
  requirements: QaRequirementResult[]; failures: QaFailure[];
  /** Unique elements matched by at least one requirement. */
  elementsChecked: number;
  /** Unique matched elements that pass every applicable requirement. */
  elementsPassed: number;
  /** Element × requirement checks and how many passed. */
  checks: number; checksPassed: number;
}

// Same matching rule as shared/ifc.ts checkRequirements (kept in step so the counts agree).
const STANDARD_CASE = new Set(["IFCWALL", "IFCSLAB", "IFCBEAM", "IFCCOLUMN"]);
const matchesEntity = (type: string, entity: string) => type === entity || (STANDARD_CASE.has(entity) && type === entity + "STANDARDCASE");

export function runQa(model: IfcModel, reqs: Requirement[]): QaResult {
  const all: IfcElement[] = [...model.elements, ...model.spatial];
  const byGuid = new Map<string, IfcElement>();
  for (const el of all) if (!byGuid.has(el.guid)) byGuid.set(el.guid, el);
  const results = checkRequirements(model, reqs);
  const matched = new Set<string>();
  for (const r of reqs) for (const el of all) if (matchesEntity(el.type, r.entity)) matched.add(el.guid);
  const failing = new Set<string>();
  const failures: QaFailure[] = [];
  results.forEach((r, index) => {
    for (const f of r.failures) {
      failing.add(f.guid);
      const el = byGuid.get(f.guid);
      const type = el?.type ?? r.entity;
      failures.push({ reqIndex: index, requirement: r.name, entity: r.entity, guid: f.guid, type, name: el?.name || f.name, storey: el?.storey ?? "", discipline: disciplineOf(type), missing: f.missing });
    }
  });
  const checks = results.reduce((n, r) => n + r.applicable, 0);
  return {
    requirements: results.map(({ failures: fs, ...r }, index) => ({ ...r, index, failed: fs.length })),
    failures, elementsChecked: matched.size, elementsPassed: [...matched].filter((g) => !failing.has(g)).length,
    checks, checksPassed: results.reduce((n, r) => n + r.passed, 0),
  };
}

// ---------------------------------------------------------------- groups

export interface QaSample { guid: string; name: string; storey: string; type: string }
export interface QaGroup {
  key: string; discipline: Discipline; reqIndex: number; requirement: string; entity: string;
  /** Property / attribute path, e.g. Pset_DoorCommon.FireRating, or `Pset_DoorCommon.FireRating = "EI60"` for a wrong value. */
  item: string; kind: "missing" | "value";
  count: number; sampleGuids: string[]; samples: QaSample[];
  /** Every failing GUID (capped at MAX_GUIDS) for BCF components and exports. */
  guids: string[];
  storeys: { name: string; count: number }[]; types: string[];
}
export const MAX_SAMPLES = 20;
export const MAX_GUIDS = 10_000;

/** Short, stable key (FNV-1a) so AI answers can be matched back to groups. */
function hashKey(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return "g" + (h >>> 0).toString(16).padStart(8, "0");
}

/** `Pset.Prop = "x" (found "y")` → { item: `Pset.Prop = "x"`, kind: "value" }. */
function normalise(missing: string): { item: string; kind: QaGroup["kind"] } {
  const m = /^(.*?) \(found "[\s\S]*"\)$/.exec(missing);
  return m ? { item: m[1], kind: "value" } : { item: missing, kind: "missing" };
}

export function groupFailures(failures: QaFailure[]): QaGroup[] {
  const map = new Map<string, QaGroup & { storeyMap: Map<string, number>; typeSet: Set<string> }>();
  const keys = new Set<string>();
  for (const f of failures) {
    for (const miss of f.missing) {
      const { item, kind } = normalise(miss);
      const id = `${f.discipline}|${f.reqIndex}|${item}`;
      let g = map.get(id);
      if (!g) {
        let key = hashKey(id);
        while (keys.has(key)) key = hashKey(key + id);
        keys.add(key);
        g = { key, discipline: f.discipline, reqIndex: f.reqIndex, requirement: f.requirement, entity: f.entity, item, kind, count: 0, sampleGuids: [], samples: [], guids: [], storeys: [], types: [], storeyMap: new Map(), typeSet: new Set() };
        map.set(id, g);
      }
      g.count++;
      if (g.samples.length < MAX_SAMPLES) { g.samples.push({ guid: f.guid, name: f.name, storey: f.storey, type: f.type }); g.sampleGuids.push(f.guid); }
      if (g.guids.length < MAX_GUIDS) g.guids.push(f.guid);
      const st = f.storey || "(no storey)";
      g.storeyMap.set(st, (g.storeyMap.get(st) ?? 0) + 1);
      g.typeSet.add(f.type);
    }
  }
  return [...map.values()].map(({ storeyMap, typeSet, ...g }) => ({
    ...g, storeys: [...storeyMap].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count), types: [...typeSet].sort(),
  })).sort((a, b) => b.count - a.count || a.discipline.localeCompare(b.discipline) || a.item.localeCompare(b.item));
}

// ---------------------------------------------------------------- labels

/** IFCAIRTERMINAL → "Air Terminals". */
export function entityLabel(entity: string, plural = true): string {
  const words = ifcPascal(entity).replace(/^Ifc/, "").replace(/StandardCase$/, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim() || entity;
  if (!plural) return words;
  if (/[^aeiou]y$/i.test(words)) return words.slice(0, -1) + "ies";
  if (/(s|x|z|ch|sh)$/i.test(words)) return words + "es";
  return words + "s";
}

export function groupTitle(g: Pick<QaGroup, "entity" | "item" | "kind" | "count">): string {
  if (g.kind === "value") {
    const m = /^(.*?) = "([\s\S]*)"$/.exec(g.item);
    return m ? `${entityLabel(g.entity)} with wrong ${m[1]} (expected "${m[2]}") (${g.count})` : `${entityLabel(g.entity)} with wrong ${g.item} (${g.count})`;
  }
  return `${entityLabel(g.entity)} missing ${g.item} (${g.count})`;
}

// ---------------------------------------------------------------- AI summary

export interface CompactGroup { key: string; discipline: Discipline; entity: string; requirement: string; item: string; kind: QaGroup["kind"]; count: number; storeys: string[]; examples: string[] }
export interface CompactQa { groups: CompactGroup[]; omitted: number; totalGroups: number; totalFailures: number }
export const AI_MAX_CHARS = 30_000;
export const AI_MAX_GROUPS = 150;

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Small JSON for the AI: no GUIDs, a few storeys and element names per group, biggest groups first, ≤ 30k chars. */
export function compactForAi(groups: QaGroup[], maxChars = AI_MAX_CHARS): CompactQa {
  const sorted = [...groups].sort((a, b) => b.count - a.count);
  const out: CompactGroup[] = [];
  let size = 120; // envelope
  for (const g of sorted) {
    if (out.length >= AI_MAX_GROUPS) break;
    const c: CompactGroup = {
      key: g.key, discipline: g.discipline, entity: ifcPascal(g.entity), requirement: cut(g.requirement, 120), item: cut(g.item, 200), kind: g.kind, count: g.count,
      storeys: g.storeys.slice(0, 3).map((s) => cut(`${s.name} (${s.count})`, 60)),
      examples: [...new Set(g.samples.map((s) => s.name).filter(Boolean))].slice(0, 3).map((n) => cut(n, 60)),
    };
    const len = JSON.stringify(c).length + 1;
    if (size + len > maxChars) break;
    out.push(c); size += len;
  }
  return { groups: out, omitted: groups.length - out.length, totalGroups: groups.length, totalFailures: groups.reduce((n, g) => n + g.count, 0) };
}

// ---------------------------------------------------------------- BCF

export interface GroupAdvice { explanation?: string; fix?: string; priority?: "high" | "medium" | "low" }
export interface BcfFromGroupsOptions {
  /** Discipline → task team name, used as AssignedTo. */
  teams?: Partial<Record<Discipline, string>>;
  advice?: Record<string, GroupAdvice | undefined>;
  author?: string; modelName?: string; idsName?: string;
  /** Components per topic (the viewpoint selection). Default 500. */
  maxComponents?: number;
  date?: string; status?: string; type?: string;
}

const PRIORITY: Record<string, string> = { high: "High", medium: "Normal", low: "Low" };

export function failuresToBcfTopics(groups: QaGroup[], opts: BcfFromGroupsOptions = {}): BcfTopic[] {
  const date = opts.date ?? new Date().toISOString();
  const max = opts.maxComponents ?? 500;
  return groups.map((g) => {
    const a = opts.advice?.[g.key];
    const comps = (g.guids.length ? g.guids : g.sampleGuids).slice(0, max);
    const lines = [
      `Requirement: ${g.requirement} (${ifcPascal(g.entity)})`,
      `${g.kind === "value" ? "Wrong value" : "Missing"}: ${g.item}`,
      `Failing elements: ${g.count}${comps.length < g.count ? ` (${comps.length} selected in the viewpoint)` : ""}`,
      g.storeys.length ? `Storeys: ${g.storeys.slice(0, 8).map((s) => `${s.name} (${s.count})`).join(", ")}` : "",
      opts.modelName ? `Model: ${opts.modelName}` : "", opts.idsName ? `IDS: ${opts.idsName}` : "",
      a?.explanation ? `\nWhy it matters: ${a.explanation}` : "", a?.fix ? `How to fix: ${a.fix}` : "",
    ].filter(Boolean);
    return {
      guid: newGuid(), type: opts.type ?? "Issue", status: opts.status ?? "Open", title: groupTitle(g),
      priority: a?.priority ? PRIORITY[a.priority] : g.count >= 50 ? "High" : "Normal",
      description: lines.join("\n"), labels: ["IDS", g.discipline], creationDate: date, creationAuthor: opts.author ?? "Model QA",
      assignedTo: opts.teams?.[g.discipline] ?? "", dueDate: "", components: comps, comments: [],
    };
  });
}
