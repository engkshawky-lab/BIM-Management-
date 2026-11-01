import { describe, expect, it } from "vitest";
import { pageMeta, sitemap, withMeta } from "./seo";

const html = `<html><head><title>Old</title>\n    <meta name="description" content="old" />\n</head><body></body></html>`;

describe("public page addresses", () => {
  it("gives the public pages their own title and description", () => {
    expect(pageMeta("/", "Portal")!.title).toContain("Portal");
    expect(pageMeta("/pricing/", "Portal")!.title).toBe("Plans and pricing — Portal");
    expect(pageMeta("/legal/terms", "Portal")!.index).toBe(true);
    expect(pageMeta("/login", "Portal")!.index).toBe(false);
    expect(pageMeta("/projects/1", "Portal")).toBeNull();
    expect(pageMeta("/legal/unknown", "Portal")).toBeNull();
  });
  it("writes the tags into index.html, escaped, with one description", () => {
    const out = withMeta(html, { title: 'A "B" <C>', description: "D & E", index: false }, "https://x.test/about", "S");
    expect(out).toContain("<title>A &quot;B&quot; &lt;C&gt;</title>");
    expect(out.match(/name="description"/g)).toHaveLength(1);
    expect(out).toContain('content="D &amp; E"');
    expect(out).toContain('<link rel="canonical" href="https://x.test/about" />');
    expect(out).toContain('name="robots" content="noindex"');
  });
  it("lists the public pages in the sitemap", () => {
    const xml = sitemap("https://x.test", false);
    expect(xml).toContain("<loc>https://x.test/</loc>");
    expect(xml).toContain("<loc>https://x.test/legal/privacy</loc>");
    expect(xml).not.toContain("/pricing");
  });
});
