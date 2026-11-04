// In-page tabs that administrators can open or close per plan (Admin › Plans & access). A tab's access key is its
// page's sidebar key followed by the tab ids down to it: "s.19650.part2/ask", "s.hub.cde/setup/naming",
// "w.docguides/deep-dive/rubric". Tabs that are sidebar pages themselves (AI studio, BIM tools, workflow…) are
// controlled as pages and are not listed here. Pages import their tab lists from here so the two never drift.

export interface TabNode { id: string; label: string; children?: TabNode[] }

/** ISO 19650 Part hub (/parts/19650-n/:tab), the same seven tabs for Parts 1 to 6. */
export const PART_TABS = [
  { id: "overview", label: "Overview" },
  { id: "clauses", label: "Clauses & checklist" },
  { id: "examples", label: "Practical examples" },
  { id: "qa", label: "Questions & answers" },
  { id: "quiz", label: "Quiz" },
  { id: "documents", label: "Documents & mistakes" },
  { id: "ask", label: "Ask AI" },
] as const;

/** Deep dive inside a document guide: a worked example and its tabs. */
export const DEEP_DIVE_TABS = [
  { id: "example", label: "Full worked example" },
  { id: "cases", label: "Case studies" },
  { id: "variants", label: "Other project types" },
  { id: "clauses", label: "Clause library" },
  { id: "rubric", label: "Assessment rubric" },
] as const;

/** Platform guide (/guide/:tab). */
export const GUIDE_TABS = [
  { id: "start", label: "Start here" },
  { id: "sections", label: "Every section" },
  { id: "first-day", label: "First day" },
  { id: "first-week", label: "First week" },
  { id: "flows", label: "How it fits together" },
  { id: "roles", label: "By role" },
  { id: "faq", label: "FAQ" },
] as const;

/** IFC Hub, after a model is read. */
export const IFC_HUB_TABS = [
  { id: "overview", label: "Building analysis" },
  { id: "elements", label: "Elements" },
  { id: "properties", label: "Property coverage" },
  { id: "requirements", label: "LOIN / IDS validator" },
  { id: "ai", label: "AI comparison with your EIR" },
] as const;

/** Document review & compare: the three review modes. */
export const REVIEW_MODES = [
  { id: "single", label: "Single document review" },
  { id: "eir-bep", label: "EIR ↔ BEP compliance" },
  { id: "bep-versions", label: "BEP version compare" },
] as const;

export const DEEP_DIVE_ID = "deep-dive";

const list = (tabs: readonly { id: string; label: string }[]): TabNode[] => tabs.map((x) => ({ id: x.id, label: x.label }));

/** Tabs under pages, by the page's sidebar key. Topic hubs add their own sections and tabs (see hubTabNodes). */
export const PAGE_TABS: Record<string, TabNode[]> = {
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`s.19650.part${n}`, list(PART_TABS)])),
  "r.guide": list(GUIDE_TABS),
  "m.ifc": list(IFC_HUB_TABS),
  "ai.review": list(REVIEW_MODES),
  "w.docguides": [{ id: DEEP_DIVE_ID, label: "Deep dive (worked examples)", children: list(DEEP_DIVE_TABS) }],
};

/** A topic hub's tabs: grouped by section when it has more than one, otherwise the tabs alone. */
export function hubTabNodes(hub: { sections: { id: string; label: string; tabs: { id: string; label: string }[] }[] }): TabNode[] {
  if (hub.sections.length === 1) return list(hub.sections[0]!.tabs);
  return hub.sections.map((s) => ({ id: s.id, label: s.label, children: list(s.tabs) }));
}

/** The access key of a tab under a page. */
export const tabKey = (pageKey: string, ...ids: string[]) => [pageKey, ...ids].join("/");

/** The access key of a hub tab: page / section / tab, or page / tab for a hub with one section. */
export const hubTabKey = (pageKey: string, sectionCount: number, sectionId: string, tabId?: string) =>
  sectionCount > 1 ? tabKey(pageKey, sectionId, ...(tabId ? [tabId] : [])) : tabKey(pageKey, ...(tabId ? [tabId] : []));
