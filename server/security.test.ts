import { afterEach, describe, expect, it } from "vitest";
import { aiBurstExceeded } from "./security";

describe("aiBurstExceeded", () => {
  afterEach(() => { delete process.env.AI_PER_MINUTE; });

  it("allows up to the per-minute limit, then blocks until the window passes", () => {
    process.env.AI_PER_MINUTE = "3";
    const t = 1_000_000;
    expect([0, 1, 2].map((i) => aiBurstExceeded("u1", t + i))).toEqual([false, false, false]);
    expect(aiBurstExceeded("u1", t + 10)).toBe(true);
    expect(aiBurstExceeded("u2", t + 10)).toBe(false);
    expect(aiBurstExceeded("u1", t + 61_000)).toBe(false);
  });

  it("is off when the limit is 0", () => {
    process.env.AI_PER_MINUTE = "0";
    expect(Array.from({ length: 50 }, () => aiBurstExceeded("u3")).some(Boolean)).toBe(false);
  });
});
