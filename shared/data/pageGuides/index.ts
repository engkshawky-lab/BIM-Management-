import { GUIDES_DELIVERY } from "./delivery";
import { GUIDES_DOCUMENTS } from "./documents";
import { GUIDES_LEARN } from "./learn";
import { GUIDES_PROJECT_A } from "./projectA";
import { GUIDES_PROJECT_B } from "./projectB";
import { GUIDES_TOOLS_AI } from "./toolsAi";
import type { GuideText, PageGuide } from "./types";

export type { GuideText, PageGuide } from "./types";

/** Every page's guide, keyed by nav.ts page key. */
export const PAGE_GUIDES: PageGuide[] = [...GUIDES_PROJECT_A, ...GUIDES_DELIVERY, ...GUIDES_PROJECT_B, ...GUIDES_DOCUMENTS, ...GUIDES_TOOLS_AI, ...GUIDES_LEARN];
const byKey = new Map(PAGE_GUIDES.map((g) => [g.key, g]));

/** The guide for a page in the interface language (template pages share the template library's guide). */
export function guideFor(key: string, lang: "en" | "ar" = "en"): GuideText | undefined {
  const g = byKey.get(key) ?? (key.startsWith("t.") ? byKey.get(key.includes("42001") ? "t.lib42001" : "t.lib19650") : undefined);
  return g && (lang === "ar" ? g.ar : g);
}
