// BCF 2.1 markup (buildingSMART BIM Collaboration Format) — topic XML read/write.

export interface BcfComment { guid: string; date: string; author: string; text: string }
export interface BcfTopic {
  guid: string; type: string; status: string; title: string; priority: string; description: string; labels: string[];
  creationDate: string; creationAuthor: string; assignedTo: string; dueDate: string; components: string[]; comments: BcfComment[];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const el = (tag: string, v?: string) => (v ? `<${tag}>${esc(v)}</${tag}>` : "");
const tagText = (xml: string, tag: string) => { const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`).exec(xml); return m ? unesc(m[1].trim()) : ""; };
const attr = (xml: string, name: string) => { const m = new RegExp(`\\b${name}="([^"]*)"`).exec(xml); return m ? unesc(m[1]) : ""; };

export const BCF_VERSION_XML = `<?xml version="1.0" encoding="UTF-8"?>\n<Version VersionId="2.1"><DetailedVersion>2.1</DetailedVersion></Version>`;

export function topicToMarkup(t: BcfTopic, viewpointGuid?: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Markup>
  <Topic Guid="${esc(t.guid)}" TopicType="${esc(t.type)}" TopicStatus="${esc(t.status)}">
    ${el("Title", t.title)}${el("Priority", t.priority)}${t.labels.map((l) => el("Labels", l)).join("")}
    ${el("CreationDate", t.creationDate)}${el("CreationAuthor", t.creationAuthor)}${el("AssignedTo", t.assignedTo)}${el("DueDate", t.dueDate)}${el("Description", t.description)}
  </Topic>
${t.comments.map((c) => `  <Comment Guid="${esc(c.guid)}">${el("Date", c.date)}${el("Author", c.author)}${el("Comment", c.text)}${viewpointGuid ? `<Viewpoint Guid="${viewpointGuid}"/>` : ""}</Comment>`).join("\n")}
${viewpointGuid ? `  <Viewpoints Guid="${viewpointGuid}"><Viewpoint>viewpoint.bcfv</Viewpoint></Viewpoints>` : ""}
</Markup>`;
}

/** A minimal viewpoint that selects the issue's IFC elements (no camera), valid for BCF 2.1 consumers. */
export function viewpointXml(guid: string, components: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<VisualizationInfo Guid="${guid}"><Components><Selection>${components.map((c) => `<Component IfcGuid="${esc(c)}"/>`).join("")}</Selection><Visibility DefaultVisibility="true"/></Components></VisualizationInfo>`;
}

export function markupToTopic(markup: string, viewpoint?: string): BcfTopic {
  const topic = /<Topic\b[^>]*>([\s\S]*?)<\/Topic>/.exec(markup);
  if (!topic) throw new Error("markup.bcf has no <Topic>.");
  const head = /<Topic\b[^>]*>/.exec(markup)![0];
  const body = topic[1];
  // <Comment Guid="…"> wraps a child <Comment> text element, so slice each block up to the next block instead of regex-matching the pair.
  const starts = [...markup.matchAll(/<Comment\s[^>]*Guid="[^"]*"[^>]*>/g)];
  const comments = starts.map((m, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index! : markup.search(/<Viewpoints\b|<\/Markup>/);
    const block = markup.slice(m.index! + m[0].length, end > m.index! ? end : undefined);
    const text = /<Comment>([\s\S]*?)<\/Comment>/.exec(block);
    return { guid: attr(m[0], "Guid"), date: tagText(block, "Date"), author: tagText(block, "Author"), text: text ? unesc(text[1].trim()) : "" };
  }).filter((c) => c.text);
  return {
    guid: attr(head, "Guid"), type: attr(head, "TopicType") || "Issue", status: attr(head, "TopicStatus") || "Open",
    title: tagText(body, "Title") || "Untitled", priority: tagText(body, "Priority"), description: tagText(body, "Description"),
    labels: [...body.matchAll(/<Labels>([\s\S]*?)<\/Labels>/g)].map((m) => unesc(m[1].trim())),
    creationDate: tagText(body, "CreationDate"), creationAuthor: tagText(body, "CreationAuthor"), assignedTo: tagText(body, "AssignedTo"), dueDate: tagText(body, "DueDate"),
    components: viewpoint ? [...viewpoint.matchAll(/<Component\b[^>]*IfcGuid="([^"]+)"/g)].map((m) => m[1]) : [], comments,
  };
}

/** Parse a clash report exported as CSV/TSV (Navisworks, Solibri, Revizto…): returns one row per clash. */
export function parseClashReport(rows: string[][]): { name: string; status: string; distance: string; gridLocation: string; guidA: string; guidB: string; itemA: string; itemB: string }[] {
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  // Exact header matches win; partial matches skip id/guid columns unless an id column is wanted ("item1guid" must not satisfy "item1").
  const idLike = (h: string) => /guid|id[12ab]?$/.test(h);
  const col = (...names: string[]) => {
    const exact = header.findIndex((h) => names.includes(h));
    if (exact >= 0) return exact;
    const wantsId = names.some(idLike);
    return header.findIndex((h) => names.some((n) => h.includes(n)) && (wantsId || !idLike(h)));
  };

  const c = { name: col("clashname", "name", "clash"), status: col("status"), distance: col("distance"), grid: col("gridlocation", "grid"),
    guidA: col("item1guid", "guida", "elementid1", "ifcguid1", "item1id"), guidB: col("item2guid", "guidb", "elementid2", "ifcguid2", "item2id"),
    itemA: col("item1name", "item1", "elementa"), itemB: col("item2name", "item2", "elementb") };
  const at = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  return rows.slice(1).filter((r) => r.some(Boolean)).map((r, i) => ({
    name: at(r, c.name) || `Clash ${i + 1}`, status: at(r, c.status), distance: at(r, c.distance), gridLocation: at(r, c.grid),
    guidA: at(r, c.guidA), guidB: at(r, c.guidB), itemA: at(r, c.itemA), itemB: at(r, c.itemB),
  }));
}
