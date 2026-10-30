// BCF Studio: read any BCF 2.0 / 2.1 / 3.0 zip, write BCF 2.1, and convert to / from tabular issue lists.
// Pure TypeScript (jszip works in node and the browser); reuses the BCF 2.1 helpers in ./bcf.

import JSZip from "jszip";
import { BCF_VERSION_XML, markupToTopic, topicToMarkup, viewpointXml, type BcfComment, type BcfTopic } from "./bcf";

export type StudioTopic = BcfTopic & { snapshot?: string; viewpointCount: number };
export interface BcfFile { version: string; topics: StudioTopic[]; project?: string }

const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&amp;/g, "&");
const tagText = (xml: string, tag: string) => { const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`).exec(xml); return m ? unesc(m[1].trim()) : ""; };
const attr = (xml: string, name: string) => { const m = new RegExp(`\\b${name}="([^"]*)"`).exec(xml); return m ? unesc(m[1]) : ""; };
/** Strip XML namespace prefixes (<bcf:Topic> → <Topic>) so the regex readers work on any exporter's output. */
const stripNs = (xml: string) => xml.replace(/<(\/?)[A-Za-z_][\w.-]*:([A-Za-z_][\w.-]*)/g, "<$1$2");

export function newGuid(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Parse one markup.bcf, tolerating 2.x (Labels repeated, Comment/Viewpoints under Markup) and 3.0 (Labels/Label, Comments/Comment, Viewpoints/ViewPoint inside Topic). */
export function parseMarkup(raw: string): { topic: BcfTopic; viewpoints: { file: string; snapshot: string }[] } {
  const markup = stripNs(raw);
  const base = markupToTopic(markup);
  const body = /<Topic\b[^>]*>([\s\S]*?)<\/Topic>/.exec(markup)?.[1] ?? "";
  // header fields only (before any Comments block), so a comment's <Date>/<Author> never leaks into the topic
  const head = body.split(/<Comments\b|<Comment\b|<Viewpoints\b/)[0];
  const labels: string[] = [];
  for (const m of head.matchAll(/<Labels>([\s\S]*?)<\/Labels>/g)) {
    const inner = [...m[1].matchAll(/<Label>([\s\S]*?)<\/Label>/g)];
    if (inner.length) inner.forEach((x) => labels.push(unesc(x[1].trim()))); else if (m[1].trim()) labels.push(unesc(m[1].trim()));
  }
  const comments: BcfComment[] = [];
  const starts = [...markup.matchAll(/<Comment\b[^>]*\bGuid="[^"]*"[^>]*>/g)];
  starts.forEach((m, i) => {
    const from = m.index! + m[0].length;
    const next = i + 1 < starts.length ? starts[i + 1].index! : markup.length;
    const block = markup.slice(from, next);
    const text = /<Comment>([\s\S]*?)<\/Comment>/.exec(block);
    if (text && text[1].trim()) comments.push({ guid: attr(m[0], "Guid"), date: tagText(block, "Date"), author: tagText(block, "Author"), text: unesc(text[1].trim()) });
  });
  const viewpoints: { file: string; snapshot: string }[] = [];
  // 3.0: <Viewpoints><ViewPoint Guid>…</ViewPoint></Viewpoints>; 2.x: repeated <Viewpoints Guid>…</Viewpoints>
  const vpRe = /<ViewPoint\b/.test(markup) ? /<ViewPoint\b[^>]*>([\s\S]*?)<\/ViewPoint>/g : /<Viewpoints\b[^>]*>([\s\S]*?)<\/Viewpoints>/g;
  for (const m of markup.matchAll(vpRe)) viewpoints.push({ file: tagText(m[1], "Viewpoint"), snapshot: tagText(m[1], "Snapshot") });
  const topic: BcfTopic = {
    ...base,
    title: tagText(head, "Title") || base.title, priority: tagText(head, "Priority"), description: tagText(head, "Description"),
    creationDate: tagText(head, "CreationDate"), creationAuthor: tagText(head, "CreationAuthor"), assignedTo: tagText(head, "AssignedTo"), dueDate: tagText(head, "DueDate"),
    labels, comments: comments.length || !base.comments.length ? comments : base.comments,
  };
  return { topic, viewpoints };
}

const componentGuids = (vp: string) => [...stripNs(vp).matchAll(/<Component\b[^>]*\bIfcGuid="([^"]+)"/g)].map((m) => m[1]);
const mimeOf = (name: string) => (/\.jpe?g$/i.test(name) ? "image/jpeg" : "image/png");

/** Read a .bcf / .bcfzip archive (BCF 2.0, 2.1 or 3.0). Snapshots are returned as data URLs only when `snapshots` is true. */
export async function readBcfZip(data: ArrayBuffer | Uint8Array, opts: { snapshots?: boolean } = {}): Promise<BcfFile> {
  const zip = await JSZip.loadAsync(data);
  const files = Object.values(zip.files).filter((f) => !f.dir);
  const find = (re: RegExp) => files.find((f) => re.test(f.name));
  const versionFile = find(/(^|\/)bcf\.version$/i);
  let version = "";
  if (versionFile) { const v = stripNs(await versionFile.async("string")); version = attr(v, "VersionId") || tagText(v, "DetailedVersion"); }
  const projectFile = find(/(^|\/)project\.bcfp$/i);
  let project: string | undefined;
  if (projectFile) { const p = stripNs(await projectFile.async("string")); project = tagText(p, "Name") || undefined; }

  const markups = files.filter((f) => /(^|\/)markup\.bcf$/i.test(f.name));
  if (!markups.length) throw new Error("No markup.bcf found — this does not look like a BCF archive.");
  const topics: StudioTopic[] = [];
  for (const mf of markups) {
    const dir = mf.name.slice(0, mf.name.length - "markup.bcf".length);
    const inDir = files.filter((f) => f.name.startsWith(dir) && !f.name.slice(dir.length).includes("/"));
    let parsed;
    try { parsed = parseMarkup(await mf.async("string")); } catch { continue; }
    const { topic, viewpoints } = parsed;
    if (!topic.guid) topic.guid = dir.replace(/\/$/, "").split("/").pop() || newGuid();
    const vpFiles = inDir.filter((f) => /\.bcfv$/i.test(f.name));
    const components = new Set<string>();
    for (const f of vpFiles) componentGuids(await f.async("string")).forEach((g) => components.add(g));
    topic.components = [...components];
    let snapshot: string | undefined;
    if (opts.snapshots) {
      const named = viewpoints.map((v) => v.snapshot).filter(Boolean);
      const img = named.map((n) => inDir.find((f) => f.name.slice(dir.length).toLowerCase() === n.toLowerCase())).find(Boolean)
        ?? inDir.find((f) => /(^|\/)snapshot\.(png|jpe?g)$/i.test(f.name)) ?? inDir.find((f) => /\.(png|jpe?g)$/i.test(f.name));
      if (img) snapshot = `data:${mimeOf(img.name)};base64,${await img.async("base64")}`;
    }
    topics.push({ ...topic, snapshot, viewpointCount: Math.max(vpFiles.length, viewpoints.filter((v) => v.file).length) });
  }
  if (!version) version = markups.length && /<Comments\b|<Label>/.test(await markups[0].async("string")) ? "3.0" : "2.1";
  return { version, topics, project };
}

const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const toDateTime = (s: string) => (isDateOnly(s) ? `${s}T00:00:00Z` : s);

/** Write BCF 2.1 (one folder per topic: markup.bcf, viewpoint.bcfv, snapshot.png/jpg when present). */
export async function writeBcfZip(topics: (BcfTopic & { snapshot?: string })[], opts: { version?: "2.1"; output?: "blob" | "uint8array"; project?: string } = {}): Promise<Blob | Uint8Array> {
  const zip = new JSZip();
  zip.file("bcf.version", BCF_VERSION_XML);
  if (opts.project) {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    zip.file("project.bcfp", `<?xml version="1.0" encoding="UTF-8"?>\n<ProjectExtension><Project ProjectId="${newGuid()}"><Name>${esc(opts.project)}</Name></Project><ExtensionSchema></ExtensionSchema></ProjectExtension>`);
  }
  const now = new Date().toISOString();
  for (const t of topics) {
    const guid = t.guid || newGuid();
    const vp = newGuid();
    // BCF 2.1 requires CreationDate/CreationAuthor and xs:dateTime values
    const clean: BcfTopic = {
      ...t, guid, type: t.type || "Issue", status: t.status || "Open", title: t.title || "Untitled",
      creationDate: toDateTime(t.creationDate || now), creationAuthor: t.creationAuthor || "BCF Studio", dueDate: t.dueDate ? toDateTime(t.dueDate) : "",
      comments: t.comments.map((c) => ({ ...c, guid: c.guid || newGuid(), date: toDateTime(c.date || now), author: c.author || "BCF Studio" })),
    };
    let markup = topicToMarkup(clean, vp);
    const folder = zip.folder(guid)!;
    const snap = t.snapshot ? /^data:(image\/[\w+.-]+);base64,(.*)$/s.exec(t.snapshot) : null;
    if (snap) {
      const name = snap[1] === "image/jpeg" ? "snapshot.jpg" : "snapshot.png";
      folder.file(name, snap[2], { base64: true });
      markup = markup.replace("<Viewpoint>viewpoint.bcfv</Viewpoint></Viewpoints>", `<Viewpoint>viewpoint.bcfv</Viewpoint><Snapshot>${name}</Snapshot></Viewpoints>`);
    }
    folder.file("markup.bcf", markup);
    folder.file("viewpoint.bcfv", viewpointXml(vp, t.components));
  }
  const output = opts.output ?? "uint8array";
  return zip.generateAsync({ type: output, compression: "DEFLATE" });
}

/* ---------- tabular issue lists ---------- */

export const ROW_HEADER = ["Guid", "Title", "Status", "Type", "Priority", "Assigned to", "Due date", "Labels", "Created", "Author", "Description", "Comments count", "Last comment", "Components"];
const LIST_SEP = "; ";

export function topicsToRows(topics: BcfTopic[]): string[][] {
  return topics.map((t) => {
    const last = t.comments[t.comments.length - 1];
    return [t.guid, t.title, t.status, t.type, t.priority, t.assignedTo, t.dueDate.slice(0, 10), t.labels.join(LIST_SEP), t.creationDate, t.creationAuthor, t.description,
      String(t.comments.length), last ? last.text : "", t.components.join(LIST_SEP)];
  });
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
const ALIASES: Record<string, string[]> = {
  guid: ["guid", "id", "issueid", "topicguid", "topicid", "uuid"],
  title: ["title", "name", "issue", "issuename", "subject", "summary", "topic", "clashname"],
  status: ["status", "state", "topicstatus", "issuestatus"],
  type: ["type", "topictype", "issuetype", "category"],
  priority: ["priority", "severity", "importance"],
  assignedTo: ["assignedto", "assignee", "assigned", "owner", "responsible", "responsibleparty"],
  dueDate: ["duedate", "due", "deadline", "targetdate", "datedue"],
  labels: ["labels", "label", "tags", "tag", "discipline"],
  creationDate: ["created", "creationdate", "datecreated", "createdon", "createdat", "date"],
  creationAuthor: ["author", "creationauthor", "createdby", "creator", "reporter", "raisedby"],
  description: ["description", "details", "desc", "notes"],
  comment: ["lastcomment", "comment", "comments", "latestcomment"],
  components: ["components", "ifcguid", "ifcguids", "elementguids", "elementids", "guids", "elements"],
};

/** Excel serial date (e.g. 45231) or any parseable date → yyyy-mm-dd; ISO strings and unknown text pass through. */
function normDate(v: string): string {
  const s = v.trim();
  if (!s || /^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  if (/^\d{5}(\.\d+)?$/.test(s)) { const n = +s; if (n > 20000 && n < 80000) return new Date(Math.round((n - 25569) * 86400000)).toISOString().slice(0, 10); }
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
}
const splitList = (s: string) => s.split(/[;,|\n]/).map((x) => x.trim()).filter(Boolean);

/** Build topics from an issue list (Excel/CSV). Header names are matched case- and punctuation-insensitively. */
export function rowsToTopics(rows: string[][], header: string[]): BcfTopic[] {
  const h = header.map((x) => norm(String(x ?? "")));
  const col: Record<string, number> = {};
  for (const [key, names] of Object.entries(ALIASES)) {
    // first alias that appears wins, so "Title" beats a generic "Name" column further right
    for (const n of names) { const i = h.indexOf(n); if (i >= 0 && !Object.values(col).includes(i)) { col[key] = i; break; } }
  }
  const at = (r: string[], k: string) => (col[k] !== undefined ? String(r[col[k]] ?? "").trim() : "");
  const now = new Date().toISOString();
  return rows.filter((r) => r.some((c) => String(c ?? "").trim())).map((r) => {
    const author = at(r, "creationAuthor");
    const created = normDate(at(r, "creationDate"));
    const comment = at(r, "comment");
    return {
      guid: at(r, "guid") || newGuid(), title: at(r, "title") || "Untitled", status: at(r, "status") || "Open", type: at(r, "type") || "Issue",
      priority: at(r, "priority"), assignedTo: at(r, "assignedTo"), dueDate: normDate(at(r, "dueDate")), labels: splitList(at(r, "labels")),
      creationDate: created || now, creationAuthor: author, description: at(r, "description"), components: splitList(at(r, "components")),
      comments: comment ? [{ guid: newGuid(), date: created || now, author, text: comment }] : [],
    };
  });
}

/* ---------- CSV ---------- */

/** RFC 4180-ish CSV parser; detects comma, semicolon or tab from the first line. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1]);
  const sep = counts[0][1] > 1 ? counts[0][0] : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
    } else if (ch === '"' && cell === "") q = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && src[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => (/[",\n\r;]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\r\n");
}

/* ---------- summary ---------- */

export const isClosed = (status: string) => /closed|resolved|done|fixed|complete|approved|inactive/i.test(status);
export const isOverdue = (t: Pick<BcfTopic, "dueDate" | "status">, today = new Date().toISOString().slice(0, 10)) =>
  !!t.dueDate && t.dueDate.slice(0, 10) < today && !isClosed(t.status);

export interface BcfSummary {
  total: number; open: number; closed: number; overdue: number;
  byStatus: Record<string, number>; byPriority: Record<string, number>; byAssignee: Record<string, number>; byLabel: Record<string, number>; byType: Record<string, number>;
}

/** Counts by status, priority, assignee, label and type. Empty priority/assignee are counted under "". Overdue = due before today and not closed. */
export function summarise(topics: BcfTopic[], today = new Date().toISOString().slice(0, 10)): BcfSummary {
  const s: BcfSummary = { total: topics.length, open: 0, closed: 0, overdue: 0, byStatus: {}, byPriority: {}, byAssignee: {}, byLabel: {}, byType: {} };
  const inc = (m: Record<string, number>, k: string) => { m[k] = (m[k] ?? 0) + 1; };
  for (const t of topics) {
    if (isClosed(t.status)) s.closed++; else s.open++;
    if (isOverdue(t, today)) s.overdue++;
    inc(s.byStatus, t.status); inc(s.byPriority, t.priority); inc(s.byAssignee, t.assignedTo); inc(s.byType, t.type);
    for (const l of new Set(t.labels)) inc(s.byLabel, l);
  }
  return s;
}
