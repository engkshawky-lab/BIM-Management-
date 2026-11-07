import { describe, expect, it } from "vitest";
import { libraryVideos } from "./libraryVideos";
import { VIDEOS } from "./data/videos";
import type { CompanyVideo } from "./companyVideos";

const saved = (overrides: Partial<CompanyVideo>): CompanyVideo => ({
  id: "saved-link", title: "Public training", description: "A saved public video", topic: "ISO 19650 basics", lang: "en",
  source: "youtube", url: "dQw4w9WgXcQ", fileName: "", mimeType: "", size: 0, views: 7,
  uploadedByName: "Administrator", createdAt: "2026-11-07T00:00:00Z", placements: [{ pathId: "modeller", step: "" }], ...overrides,
});

describe("public Video library", () => {
  it("includes saved YouTube and Vimeo links while excluding uploaded subscriber videos", () => {
    const youtube = saved({});
    const vimeo = saved({ id: "vimeo-link", source: "vimeo", url: "76979871", lang: "ar", description: "شرح الفيديو" });
    const result = libraryVideos([saved({ source: "file" }), youtube, vimeo], []);
    expect(result.map((v) => v.source)).toEqual(["youtube", "vimeo"]);
    expect(result[0]).toMatchObject({ id: youtube.url, record: youtube, level: "", verified: "", channel: "YouTube" });
    expect(result[1]).toMatchObject({ id: "vimeo:76979871", videoId: "76979871", summaryAr: "شرح الفيديو", record: vimeo });
  });

  it("shows a duplicate curated link once, preserving attribution, watch-history id and saved placements", () => {
    const curated = VIDEOS[0]!;
    const record = saved({ url: curated.id });
    const result = libraryVideos([record], [curated]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: curated.id, channel: curated.channel, level: curated.level, verified: curated.verified,
      title: record.title, summary: record.description, source: "youtube", videoId: curated.id, record,
    });
    expect(result[0].record?.placements).toEqual(record.placements);
  });

  it("keeps YouTube and Vimeo ids separate and does not claim saved links were verified or assign a level", () => {
    const result = libraryVideos([saved({ url: "12345678901" }), saved({ id: "vimeo", source: "vimeo", url: "12345678901" })], []);
    expect(new Set(result.map((v) => v.id)).size).toBe(2);
    expect(result.every((v) => v.level === "" && v.verified === "")).toBe(true);
  });
});
