import fs from "fs";
import { Router } from "express";
import { setting } from "./appSettings";
import { LEGAL_DOCS } from "../shared/data/legal";
import { pageMeta, type PageMeta } from "../shared/pageMeta";

// Public pages have real addresses (/pricing, /about, /legal/privacy …) so search engines and link previews can read
// them: index.html is sent with that page's title, description, canonical address and Open Graph tags. The signed-in
// app keeps its #/ addresses. robots.txt and sitemap.xml list the public pages.

export { pageMeta, type PageMeta } from "../shared/pageMeta";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function withMeta(html: string, meta: PageMeta, url: string, site: string) {
  const tags = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    ...(meta.index ? [] : [`<meta name="robots" content="noindex" />`]),
    ...(url ? [`<link rel="canonical" href="${esc(url)}" />`, `<meta property="og:url" content="${esc(url)}" />`] : []),
    `<meta property="og:type" content="website" />`, `<meta property="og:site_name" content="${esc(site)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`, `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:card" content="summary" />`,
  ].join("\n    ");
  return html.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`).replace(/\s*<meta name="description"[^>]*>/, "").replace("</head>", `    ${tags}\n  </head>`);
}

export function sitemap(base: string, pricing: boolean) {
  const paths = ["/", ...(pricing ? ["/pricing"] : []), "/about", ...LEGAL_DOCS.map((d) => `/legal/${d.id}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${esc(base + p)}</loc></url>`).join("\n")}\n</urlset>\n`;
}

export function seoRoutes(indexFile: string) {
  const r = Router();
  const html = fs.readFileSync(indexFile, "utf8");
  const base = (req: { protocol: string; get: (h: string) => string | undefined }) => (setting<string>("publicUrl") || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  r.get("/robots.txt", (req, res) => res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${base(req)}/sitemap.xml\n`));
  r.get("/sitemap.xml", (req, res) => res.type("application/xml").send(sitemap(base(req), setting<boolean>("showPricing"))));
  r.get("*", (req, res) => {
    const site = setting<string>("siteName");
    const meta = pageMeta(req.path, site);
    // any other address belongs to the app, which uses #/ addresses: send it to the home page
    if (!meta) return res.redirect(302, "/");
    if (req.path === "/pricing" && !setting<boolean>("showPricing")) return res.redirect(302, "/");
    res.set("Cache-Control", "no-cache").type("html").send(withMeta(html, meta, meta.index ? base(req) + (req.path.replace(/\/+$/, "") || "/") : "", site));
  });
  return r;
}
