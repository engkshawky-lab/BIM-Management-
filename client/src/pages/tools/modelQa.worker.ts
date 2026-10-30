import { buildModel, parseStep, type IfcModel, type Requirement } from "../../../../shared/ifc";
import { groupFailures, runQa, type QaGroup, type QaResult } from "../../../../shared/modelQa";

// Model QA worker: parses the IFC once, keeps the model in memory and re-runs checks on demand,
// so large files never block the page and changing the IDS does not re-parse the file.

export type QaWorkerIn = { kind: "load"; buffer: ArrayBuffer; name: string } | { kind: "check"; reqs: Requirement[] };
export interface ModelInfo { name: string; schema: string; software: string; elements: number; spatial: number; entities: number; storeys: number; parseErrors: number; seconds: number }
export type QaSummary = Omit<QaResult, "failures"> & { seconds: number };
export type QaWorkerOut =
  | { kind: "progress"; stage: "read" | "parse" | "model" | "check" }
  | { kind: "loaded"; info: ModelInfo }
  | { kind: "result"; summary: QaSummary; groups: QaGroup[] }
  | { kind: "error"; error: string };

const post = (m: QaWorkerOut) => (self as unknown as { postMessage(m: unknown): void }).postMessage(m);
let model: IfcModel | null = null;

self.onmessage = (e: MessageEvent<QaWorkerIn>) => {
  const t0 = performance.now();
  const secs = () => Math.round((performance.now() - t0) / 100) / 10;
  try {
    if (e.data.kind === "load") {
      model = null;
      post({ kind: "progress", stage: "read" });
      const text = new TextDecoder("utf-8").decode(e.data.buffer);
      post({ kind: "progress", stage: "parse" });
      const file = parseStep(text);
      post({ kind: "progress", stage: "model" });
      model = buildModel(file);
      const h = model.header;
      post({ kind: "loaded", info: {
        name: e.data.name, schema: model.schema, software: h.originatingSystem || h.preprocessor, elements: model.elements.length, spatial: model.spatial.length,
        entities: model.entityCount, storeys: model.storeys.length, parseErrors: model.parseErrors.length, seconds: secs(),
      } });
    } else {
      if (!model) throw new Error("Load an IFC file first.");
      post({ kind: "progress", stage: "check" });
      const { failures, ...rest } = runQa(model, e.data.reqs);
      post({ kind: "result", summary: { ...rest, seconds: secs() }, groups: groupFailures(failures) });
    }
  } catch (err) {
    post({ kind: "error", error: err instanceof Error ? err.message : String(err) });
  }
};
