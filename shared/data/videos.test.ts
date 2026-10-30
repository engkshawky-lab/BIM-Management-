import { describe, expect, it } from "vitest";
import { VIDEOS, VIDEO_TOPICS, VIDEO_LEVELS } from "./videos";

describe("video library", () => {
  it("has unique, well-formed YouTube ids", () => {
    const ids = VIDEOS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[\w-]{11}$/);
  });

  it("uses every topic", () => {
    for (const t of VIDEO_TOPICS) expect(VIDEOS.some((v) => v.topic === t), t).toBe(true);
  });

  it("has titles, channels, summaries and a valid verification date", () => {
    for (const v of VIDEOS) {
      expect(v.title.trim().length, v.id).toBeGreaterThan(0);
      expect(v.channel.trim().length, v.id).toBeGreaterThan(0);
      expect(v.summary.trim().length, v.id).toBeGreaterThan(20);
      expect(v.summaryAr.trim().length, v.id).toBeGreaterThan(10);
      expect(/[؀-ۿ]/.test(v.summaryAr), v.id).toBe(true);
      expect(VIDEO_LEVELS).toContain(v.level);
      expect(["en", "ar"]).toContain(v.lang);
      expect(v.verified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
