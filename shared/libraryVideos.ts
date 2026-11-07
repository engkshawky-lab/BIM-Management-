import type { CompanyVideo } from "./companyVideos";
import { VIDEOS, type Video } from "./data/videos";

export interface LibraryVideo extends Omit<Video, "topic" | "level"> {
  source: "youtube" | "vimeo";
  videoId: string;
  topic: string;
  level: Video["level"] | "";
  record?: CompanyVideo;
}

/** Combine the curated catalog and saved public links. Existing watch history uses YouTube ids. */
export function libraryVideos(saved: CompanyVideo[], curated: Video[] = VIDEOS): LibraryVideo[] {
  const videos = new Map<string, LibraryVideo>(curated.map((v) => [v.id, { ...v, source: "youtube", videoId: v.id }]));
  for (const v of saved) {
    if (v.source === "file") continue;
    const id = v.source === "youtube" ? v.url : `vimeo:${v.url}`;
    const existing = videos.get(id);
    videos.set(id, existing ? {
      ...existing, title: v.title, topic: v.topic, lang: v.lang === "ar" ? "ar" : "en",
      summary: v.description || existing.summary,
      summaryAr: v.lang === "ar" ? v.description : existing.summaryAr, record: v,
    } : {
      id, videoId: v.url, source: v.source, title: v.title, channel: v.source === "youtube" ? "YouTube" : "Vimeo",
      topic: v.topic, level: "", lang: v.lang === "ar" ? "ar" : "en",
      summary: v.description, summaryAr: v.lang === "ar" ? v.description : "", verified: "", record: v,
    });
  }
  return [...videos.values()];
}
