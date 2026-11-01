import { LEGAL_DOCS } from "./data/legal";

// Title and description of each public page, used by the server (index.html for search engines and link previews)
// and by the browser as the page title.
export interface PageMeta { title: string; description: string; index: boolean }

export function pageMeta(path: string, site: string): PageMeta | null {
  const p = path.replace(/\/+$/, "") || "/";
  if (p === "/") return { title: `${site} — ISO 19650 and AI management for BIM teams`, description: "ISO 19650 information management and ISO/IEC 42001 AI management in one portal: projects, common data environment, BIM tools, AI assistants and learning for BIM teams.", index: true };
  if (p === "/pricing") return { title: `Plans and pricing — ${site}`, description: "Compare the Free, Starter, Professional and Expert plans: yearly prices, limits, and which tools and sections each plan opens.", index: true };
  if (p === "/about") return { title: `About — ${site}`, description: "Who builds the portal and what it covers: ISO 19650 information management, BIM tools, learning and AI assistants for construction teams.", index: true };
  if (p === "/login") return { title: `Sign in — ${site}`, description: `Sign in to ${site}.`, index: false };
  if (p === "/signup") return { title: `Create an account — ${site}`, description: `Create a free account on ${site}.`, index: false };
  const legal = /^\/legal(?:\/([a-z]+))?$/.exec(p);
  if (legal) {
    const doc = LEGAL_DOCS.find((d) => d.id === (legal[1] ?? "privacy"));
    if (doc) return { title: `${doc.title} — ${site}`, description: doc.summary, index: true };
  }
  return null;
}
