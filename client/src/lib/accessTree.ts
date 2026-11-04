import { hubs } from "../../../shared/data/hubs";
import { PAGE_TABS, hubTabNodes, tabKey, type TabNode } from "../../../shared/tabs";
import { PROJECT_PAGES, SECTIONS, TEMPLATE_PAGES, groupsOf, type NavItem } from "../shell/nav";

// The tree Admin › Plans & access shows: sidebar section → group → page → tab → nested tab. Sections and groups
// hold no rule of their own (ticking one sets every page and tab under it); pages carry the plan list, tabs the
// per-plan "closed" marks (shared/access.ts).

export type NodeKind = "section" | "group" | "page" | "tab";
export interface AccessNode {
  /** Page key, tab key ("page/tab/…") or a "#…" id for sections and groups. */
  key: string;
  label: string;
  kind: NodeKind;
  /** Depth below the page for tabs (1 = tab, 2 = nested tab…). */
  level: number;
  hint?: string;
  children: AccessNode[];
}

const tabNodes = (pageKey: string, parent: string, nodes: TabNode[], level: number): AccessNode[] =>
  nodes.map((n) => {
    const key = tabKey(parent, n.id);
    return { key, label: n.label, kind: "tab", level, children: tabNodes(pageKey, key, n.children ?? [], level + 1) };
  });

/** Tabs under a page: the fixed list in shared/tabs.ts, or the sections and tabs of the topic hub it opens. */
function tabsOf(item: NavItem): TabNode[] {
  if (PAGE_TABS[item.key]) return PAGE_TABS[item.key]!;
  const hubId = /^\/hubs\/([a-z0-9-]+)$/.exec(item.path)?.[1];
  const hub = hubId ? hubs.find((h) => h.id === hubId) : undefined;
  return hub ? hubTabNodes(hub) : [];
}

const pageNode = (item: NavItem): AccessNode =>
  ({ key: item.key, label: item.label, kind: "page", level: 0, hint: item.hint, children: tabNodes(item.key, item.key, tabsOf(item), 1) });

const grouped = (id: string, items: NavItem[]): AccessNode[] =>
  groupsOf(items).map((g) => ({ key: `#${id}:${g}`, label: g, kind: "group", level: 0, children: items.filter((i) => i.group === g).map(pageNode) }));

export function buildAccessTree(): AccessNode[] {
  return [
    { key: "#projects", label: "Projects", kind: "section", level: 0, children: grouped("projects", PROJECT_PAGES) },
    ...SECTIONS.map((s): AccessNode => ({ key: `#${s.id}`, label: s.label, kind: "section", level: 0, children: grouped(s.id, s.items) })),
    { key: "#templates", label: "Document templates", kind: "section", level: 0, children: TEMPLATE_PAGES.map(pageNode) },
  ];
}

/** Every node under a node, depth first. */
export const descendantsOf = (n: AccessNode): AccessNode[] => n.children.flatMap((c) => [c, ...descendantsOf(c)]);
