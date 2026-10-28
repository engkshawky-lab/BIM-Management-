import { analyseModel, buildModel, parseStep, requirementsFromIds, requirementsFromLoin, type IfcReport, type Requirement } from "../../../shared/ifc";

// Parses an IFC file off the main thread and returns the QA report plus a compact element list for browsing.

export interface ElementRow { guid: string; type: string; name: string; storey: string; typeName: string; psets: Record<string, Record<string, string>>; classification: string }
export interface IfcJobResult { report: IfcReport; elements: ElementRow[]; truncated: boolean; storeyCounts: Record<string, number>; seconds: number; unsupportedIds: number }
export interface IfcJob { text: string; loin?: { ref: string; element: string; ifcClass: string; alphanumeric: string }[]; ids?: string; maxElements?: number }

// typed narrowly so this file compiles with the page (DOM) libraries
const post = (message: unknown) => (self as unknown as { postMessage(m: unknown): void }).postMessage(message);

self.onmessage = (e: MessageEvent<IfcJob>) => {
  const t0 = performance.now();
  try {
    const { text, loin, ids, maxElements = 20000 } = e.data;
    const model = buildModel(parseStep(text));
    const requirements: Requirement[] = [];
    let unsupportedIds = 0;
    if (loin?.length) requirements.push(...requirementsFromLoin(loin));
    if (ids) { const r = requirementsFromIds(ids); requirements.push(...r.requirements); unsupportedIds = r.unsupported; }
    const report = analyseModel(model, { requirements });
    const storeyCounts: Record<string, number> = {};
    for (const el of model.elements) storeyCounts[el.storey || "(not in a storey)"] = (storeyCounts[el.storey || "(not in a storey)"] ?? 0) + 1;
    const elements = model.elements.slice(0, maxElements).map((el) => ({
      guid: el.guid, type: el.type, name: el.name, storey: el.storey, typeName: el.typeName, psets: el.psets,
      classification: el.classification.map((c) => [c.system, c.code, c.name].filter(Boolean).join(" ")).join("; "),
    }));
    post({ ok: true, result: { report, elements, truncated: model.elements.length > maxElements, storeyCounts, seconds: Math.round((performance.now() - t0) / 100) / 10, unsupportedIds } satisfies IfcJobResult });
  } catch (err) {
    post({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
