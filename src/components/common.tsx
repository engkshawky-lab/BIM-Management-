import type { StandardId } from "../data/types";
import { cdeStates } from "../data/iso19650";

export function StdBadge({ std }: { std: StandardId }) {
  return <span className={"badge " + (std === "iso19650" ? "b19650" : "b42001")}>{std === "iso19650" ? "ISO 19650" : "ISO/IEC 42001"}</span>;
}

export function StateTag({ state }: { state: string }) {
  const s = cdeStates.find((c) => c.id === state);
  return <span className="state" style={{ background: s?.color ?? "#64748b" }}>{state}</span>;
}

export function Progress({ value }: { value: number }) {
  return <div className="progress"><div style={{ width: `${Math.round(value * 100)}%` }} /></div>;
}
