import { describe, expect, it } from "vitest";
import { embedFor, parseVideoLink } from "./companyVideos";

describe("parseVideoLink", () => {
  it("reads YouTube watch, short, embed and shorts links", () => {
    for (const u of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ", "https://youtube.com/shorts/dQw4w9WgXcQ", "https://m.youtube.com/watch?v=dQw4w9WgXcQ"])
      expect(parseVideoLink(u)).toEqual({ source: "youtube", id: "dQw4w9WgXcQ" });
  });
  it("reads Vimeo page and player links", () => {
    expect(parseVideoLink("https://vimeo.com/76979871")).toEqual({ source: "vimeo", id: "76979871" });
    expect(parseVideoLink("https://player.vimeo.com/video/76979871?h=abc")).toEqual({ source: "vimeo", id: "76979871" });
  });
  it("rejects other sites, bad ids and non-http links", () => {
    for (const u of ["https://example.com/watch?v=dQw4w9WgXcQ", "https://youtube.com/watch?v=short", "javascript:alert(1)", "not a url", "https://evil.com/youtube.com/embed/dQw4w9WgXcQ"])
      expect(parseVideoLink(u)).toBeNull();
  });
  it("builds privacy-friendly embed addresses", () => {
    expect(embedFor("youtube", "dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(embedFor("vimeo", "76979871")).toBe("https://player.vimeo.com/video/76979871");
  });
});
