import { describe, expect, it } from "vitest";
import ar from "./ar.json";

// The DOM translation layer re-translates every text change, so a value equal to its key, or a value
// that is itself another key, would loop or chain on the page.
describe("Arabic dictionary", () => {
  const dict = ar as Record<string, string>;
  it("has no self-mapped entries", () => {
    expect(Object.keys(dict).filter((k) => dict[k] === k)).toEqual([]);
  });
  it("has no values that are themselves keys", () => {
    expect(Object.entries(dict).filter(([, v]) => dict[v] !== undefined).map(([k]) => k)).toEqual([]);
  });
  it("has no empty values", () => {
    expect(Object.keys(dict).filter((k) => !dict[k].trim())).toEqual([]);
  });
});
