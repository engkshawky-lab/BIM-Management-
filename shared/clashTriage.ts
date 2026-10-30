// Clash triage: read Navisworks (XML / HTML) and tabular (CSV / Excel) clash reports into one shape,
// group them deterministically by likely root cause, and turn triaged groups into BCF topics,
// spreadsheet rows and a coordination-meeting agenda. Pure functions, used by the client and the server.

import { parseClashReport, type BcfTopic } from "./bcf";
import { decodeText } from "./programme";

export interface ClashItem { name: string; layer: string; file: string; guid: string; elementId: string; category: string }
export interface Clash {
  id: string; test: string; name: string; status: string;
  /** Metres; negative = penetration depth (Navisworks convention). */
  distance: number | null;
  grid: string; level: string;
  /** Clash point in metres. */
  x: number | null; y: number | null; z: number | null;
  itemA: ClashItem; itemB: ClashItem;
  source?: string;
  /** Navisworks clash group the result was exported under, when it was grouped. */
  group?: string;
}

export type GroupKind = "duplicate" | "cluster" | "pair";
export interface ClashGroup {
  key: string; kind: GroupKind; label: string; count: number; clashIds: string[];
  levels: string[]; grids: string[]; categories: string[]; disciplines: string[]; tests: string[];
  /** Deepest penetration in metres (positive number), null when no distances. */
  maxPenetration: number | null;
  centroid: { x: number; y: number; z: number } | null;
  sample: Clash[];
}

export const PRIORITIES = ["Critical", "High", "Normal", "Low"] as const;
export type Priority = typeof PRIORITIES[number];
export interface GroupTriage { key: string; rootCause: string; responsible: string; priority: Priority; falsePositive: boolean; action: string }
export interface TriageResult { summary: string; groups: GroupTriage[]; patterns: string[] }

export const DEFAULT_TEAMS = ["ARC", "STR", "MEP", "FP", "ELE", "PLU"];
export const DISCIPLINES: Record<string, string> = { ARC: "Architecture", STR: "Structure", MEC: "Mechanical (HVAC)", ELE: "Electrical", PLU: "Plumbing / drainage", FP: "Fire protection", CIV: "Civil" };

/* ---------------------------------------------------------------- helpers */

const emptyItem = (): ClashItem => ({ name: "", layer: "", file: "", guid: "", elementId: "", category: "" });
const unesc = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const clean = (s: string) => unesc(s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const attr = (tag: string, name: string) => { const m = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag); return m ? unesc(m[1] ?? m[2] ?? "").trim() : ""; };
const child = (xml: string, tag: string) => { const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(xml); return m ? clean(m[1]) : ""; };
const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))];
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

const UNIT: Record<string, number> = { m: 1, meter: 1, meters: 1, metre: 1, metres: 1, mm: 0.001, millimeters: 0.001, millimetres: 0.001, cm: 0.01, centimeters: 0.01, ft: 0.3048, feet: 0.3048, foot: 0.3048, in: 0.0254, inch: 0.0254, inches: 0.0254 };
const unitFactor = (u: string | undefined, dflt = 1) => (u ? UNIT[u.toLowerCase().replace(/[^a-z]/g, "")] ?? dflt : dflt);

/** "-0.120 m", "−85 mm", "0,25" → metres (null when not a number). */
export function parseLength(s: string | number | undefined | null, defaultFactor = 1): number | null {
  if (s === undefined || s === null) return null;
  if (typeof s === "number") return Number.isFinite(s) ? s * defaultFactor : null;
  const m = /([-−–]?\s*\d+(?:[.,]\d+)?(?:e[-+]?\d+)?)\s*(mm|cm|m|ft|in|feet|inch(?:es)?|"|')?/i.exec(s.trim());
  if (!m) return null;
  const n = Number(m[1].replace(/[−–]/, "-").replace(/\s+/g, "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  const u = m[2] === "'" ? "ft" : m[2] === '"' ? "in" : m[2];
  return round(n * (u ? unitFactor(u, defaultFactor) : defaultFactor), 6);
}

/** "x:12.3 m, y:4.5 m, z:6.7 m" or "12.3, 4.5, 6.7" → metres. */
export function parsePoint(s: string, defaultFactor = 1): { x: number | null; y: number | null; z: number | null } {
  const named = (k: string) => { const m = new RegExp(`\\b${k}\\s*[:=]\\s*([-−]?[\\d.,]+(?:e[-+]?\\d+)?\\s*(?:mm|cm|m|ft|in)?)`, "i").exec(s); return m ? parseLength(m[1], defaultFactor) : null; };
  if (/\bx\s*[:=]/i.test(s)) return { x: named("x"), y: named("y"), z: named("z") };
  const parts = s.split(/[;,]\s*|\s+(?=[-−]?\d)/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return { x: parseLength(parts[0], defaultFactor), y: parseLength(parts[1], defaultFactor), z: parseLength(parts[2], defaultFactor) };
  return { x: null, y: null, z: null };
}

/** Navisworks grid location "C-4 : Level 3" → grid + level. */
export function splitGrid(s: string): { grid: string; level: string } {
  const i = s.lastIndexOf(" : ");
  if (i >= 0) return { grid: s.slice(0, i).trim(), level: s.slice(i + 3).trim() };
  const m = /^(.*?)\s*[:|]\s*(.*)$/.exec(s);
  if (m && /level|storey|floor|roof|basement|^l\d|^b\d|gf|ground/i.test(m[2])) return { grid: m[1].trim(), level: m[2].trim() };
  return { grid: s.trim(), level: "" };
}

/* ---------------------------------------------------------------- localised exports */

/** Lower case, accents removed, apostrophes / punctuation collapsed to single spaces: "ID d'élément" → "id d element". */
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Column headings and smart-tag names of non-English Navisworks / Solibri / Revizto exports, keyed by their folded form.
const HEADER_ALIASES: [string, string[]][] = [
  ["Clash Name", ["nom de conflit", "nom du conflit", "nom de la collision", "kollisionsname", "name der kollision", "nombre de conflicto", "nombre del conflicto", "nombre de la interferencia", "nome conflitto", "nome del conflitto", "nome da colisao", "nome do conflito", "naam van conflict", "conflictnaam"]],
  ["Status", ["etat", "statut", "estado", "stato", "situacao", "zustand"]],
  ["Distance", ["abstand", "distancia", "distanza"]],
  ["Grid Location", ["emplacement de grille", "emplacement de la grille", "position de la grille", "rasterposition", "rasterschnittpunkt", "ubicacion de rejilla", "ubicacion de la rejilla", "posizione griglia", "localizacao da grade"]],
  ["Clash Point", ["point de conflit", "point du conflit", "kollisionspunkt", "punto de conflicto", "punto di conflitto", "ponto de conflito", "ponto de colisao"]],
  ["Description", ["beschreibung", "descripcion", "descrizione", "descricao"]],
  ["Item ID", ["id d element", "id de l element", "element id", "elementid", "id de elemento", "id elemento", "id do elemento"]],
  ["Layer", ["calque", "ebene", "capa", "livello", "camada"]],
  ["Item Name", ["element nom", "nom de l element", "nom d element", "elementname", "nombre de elemento", "nombre del elemento", "elemento nome", "nome elemento", "nome do elemento"]],
  ["Item Type", ["element type", "type d element", "type de l element", "elementtyp", "tipo de elemento", "tipo elemento", "elemento tipo", "tipo do elemento"]],
  ["Source File", ["fichier source", "quelldatei", "archivo de origen", "file di origine", "arquivo de origem"]],
  ["Item 1", ["element 1", "elemento 1", "objet 1", "objekt 1"]],
  ["Item 2", ["element 2", "elemento 2", "objet 2", "objekt 2"]],
];
const HEADER_MAP = new Map<string, string>(HEADER_ALIASES.flatMap(([en, xs]) => xs.map((x) => [x, en] as [string, string])));
/** A localised heading → its English Navisworks equivalent; English and unknown headings are returned trimmed. */
export const canonHeader = (h: string) => HEADER_MAP.get(fold(h)) ?? h.trim();

const STATUS_ALIASES: Record<string, string> = {
  nouveau: "New", neu: "New", nuevo: "New", nuovo: "New", novo: "New", nieuw: "New",
  actif: "Active", aktiv: "Active", activo: "Active", attivo: "Active", ativo: "Active", actief: "Active",
  verifie: "Reviewed", revise: "Reviewed", uberpruft: "Reviewed", gepruft: "Reviewed", revisado: "Reviewed", revisionato: "Reviewed", rivisto: "Reviewed", beoordeeld: "Reviewed",
  approuve: "Approved", genehmigt: "Approved", aprobado: "Approved", approvato: "Approved", aprovado: "Approved", goedgekeurd: "Approved",
  resolu: "Resolved", behoben: "Resolved", gelost: "Resolved", resuelto: "Resolved", risolto: "Resolved", resolvido: "Resolved", opgelost: "Resolved",
};

// Navisworks "Item Type" is the geometry kind, not a model category.
const GEOMETRY_TYPES = /^(solid|solide|solido|volumenkorper|korper|shell|coque|line|lines|ligne|linie|point|points|punkt|text|texte|composite object|objet composite|zusammengesetztes objekt|block|insert|geometry|geometrie|geometria)$/;
const realCategory = (s: string) => (GEOMETRY_TYPES.test(fold(s)) ? "" : s);

/** "Element ID: 1234", "ID d'élément: 1234" → "1234". */
const stripIdLabel = (s: string) => s.replace(/^[^:\d]*:\s*/, "").trim();

const looksLikeLevel = (s: string) => /level|storey|story|floor|roof|basement|mezz|podium|ground|^(l|b|lv|lvl)\s?-?\d+|^gf$|^\d{2}$/i.test(s.trim());

/** Make clash ids unique (reports can repeat names, several reports can be loaded together). */
export function uniqueIds(clashes: Clash[]): Clash[] {
  const seen = new Map<string, number>();
  return clashes.map((c) => {
    const base = c.id || `${c.test}#${c.name}`;
    const n = seen.get(base) ?? 0; seen.set(base, n + 1);
    return n ? { ...c, id: `${base}~${n + 1}` } : { ...c, id: base };
  });
}

/* ---------------------------------------------------------------- Navisworks XML */

/** Navisworks Clash Detective XML export (exchange › batchtest › clashtests › clashtest › clashresults › clashresult). */
export function parseNavisworksXml(input: string | ArrayBuffer | Uint8Array, source?: string): Clash[] {
  // comments can quote element names ("<clashtest>") and would derail the regex readers
  const xml = (typeof input === "string" ? input : decodeText(input)).replace(/^\uFEFF/, "").replace(/<!--[\s\S]*?-->/g, "");
  const head = /<exchange\b[^>]*>/i.exec(xml)?.[0] ?? "";
  const f = unitFactor(attr(head, "units") || "m");
  const out: Clash[] = [];
  const tests = [...xml.matchAll(/<clashtest\b([^>]*)>([\s\S]*?)<\/clashtest>/gi)];
  const blocks = tests.length ? tests.map((m) => ({ name: attr(m[1], "name") || "Clash test", body: m[2] })) : [{ name: "Clash test", body: xml }];
  for (const tb of blocks) {
    // Results in document order. A <clashgroup> wrapping <clashresult>s names their group; a group exported with
    // "group headers only" has no results inside and stands in for its clashes (it carries its own point, status, items).
    const results: { tag: string; body: string; group?: string }[] = [];
    let rest = tb.body;
    rest = rest.replace(/<clashgroup\b([^>]*)>([\s\S]*?)<\/clashgroup>/gi, (_, gtag: string, gbody: string) => {
      const gname = attr(gtag, "name");
      const inner = [...gbody.matchAll(/<clashresult\b([^>]*)>([\s\S]*?)<\/clashresult>/gi)];
      if (inner.length) inner.forEach((m) => results.push({ tag: m[1], body: m[2], group: gname || undefined }));
      else results.push({ tag: gtag, body: gbody, group: gname || undefined });
      return `\u0000${results.length}\u0000`;
    });
    // ungrouped results, kept in order relative to the groups
    const ordered: typeof results = [];
    let used = 0;
    for (const m of rest.matchAll(/\u0000(\d+)\u0000|<clashresult\b([^>]*)>([\s\S]*?)<\/clashresult>/gi)) {
      if (m[1]) { const upto = Number(m[1]); while (used < upto) ordered.push(results[used++]); }
      else ordered.push({ tag: m[2], body: m[3] });
    }
    while (used < results.length) ordered.push(results[used++]);
    for (const { tag, body, group } of ordered) {
      const name = attr(tag, "name") || child(body, "name") || `Clash ${out.length + 1}`;
      const status = attr(tag, "status") || child(body, "resultstatus") || attr(tag, "resultstatus");
      const distRaw = attr(tag, "distance") || child(body, "distance");
      const gl = splitGrid(child(body, "gridlocation"));
      // <clashpoint><pos3f x y z/></clashpoint>; some writers put x / y / z on <clashpoint> itself
      const pt = /<clashpoint\b[^>]*>[\s\S]*?<pos3f\b([^>]*)\/?>/i.exec(body)?.[1] ?? /<clashpoint\b([^>]*\bx\s*=[^>]*)>/i.exec(body)?.[1] ?? "";
      const num = (k: string) => { const v = attr(pt, k); return v === "" ? null : parseLength(v, f); };
      const objs = [...body.matchAll(/<clashobject\b[^>]*>([\s\S]*?)<\/clashobject>/gi)].map((o) => xmlItem(o[1]));
      const itemA = objs[0] ?? emptyItem(), itemB = objs[1] ?? emptyItem();
      out.push({
        id: `${tb.name}#${attr(tag, "guid") || name}`, test: tb.name, name, status: normStatus(status),
        distance: distRaw ? parseLength(distRaw, f) : null, grid: gl.grid,
        level: gl.level || (looksLikeLevel(itemA.layer) ? itemA.layer : looksLikeLevel(itemB.layer) ? itemB.layer : ""),
        x: num("x"), y: num("y"), z: num("z"), itemA, itemB, source, ...(group ? { group } : {}),
      });
    }
  }
  return uniqueIds(out);
}

function xmlItem(body: string): ClashItem {
  const props: [string, string][] = [];
  // smart-tag names follow the Navisworks UI language ("Elément Nom", "ID d'élément"): compare them in English
  for (const m of body.matchAll(/<(objectattribute|smarttag)\b[^>]*>([\s\S]*?)<\/\1>/gi)) props.push([canonHeader(child(m[2], "name")), child(m[2], "value")]);
  const prop = (re: RegExp) => props.find(([n, v]) => re.test(n) && v)?.[1] ?? "";
  const layer = child(body, "layer") || prop(/^(item )?layer$/i);
  const path = /<pathlink\b[^>]*>([\s\S]*?)<\/pathlink>/i.exec(body)?.[1] ?? "";
  let nodes = [...path.matchAll(/<node\b[^>]*>([\s\S]*?)<\/node>/gi)].map((n) => clean(n[1]));
  // some writers flatten the path to text: "Model.rvt > Ducts > Rectangular Duct > 300x200"
  if (!nodes.length && clean(path)) nodes = clean(path).split(/\s*(?:>|›|»|\/)\s*/).filter(Boolean);
  const isFile = (n: string) => /\.(nwc|nwd|nwf|rvt|ifc|dwg|dgn|dxf|skp|fbx|3dm|ifczip)$/i.test(n);
  const fileNode = nodes.find(isFile) ?? (nodes[0] === "File" ? nodes.find((n) => n !== "File") : "") ?? "";
  // Revit NWC hierarchy is file › level (layer) › category › family › type › instance.
  const li = layer ? nodes.indexOf(layer) : -1;
  const pathCategory = li >= 0 ? nodes[li + 1] ?? "" : "";
  const elementId = stripIdLabel(prop(/^(element id|id|item id|object id)$/i));
  const last = nodes.filter((n) => n !== "File").at(-1) ?? "";
  return {
    name: prop(/^(item name|name)$/i) || child(body, "itemname") || (last && !isFile(last) ? last : ""),
    layer,
    file: prop(/source file|^file( name)?$/i) || fileNode || "",
    guid: prop(/ifc ?guid|globalid|global id|^(item )?guid$|authoring guid/i),
    elementId,
    category: realCategory(prop(/category/i)) || pathCategory || realCategory(prop(/^item type$/i)),
  };
}

const normStatus = (s: string) => {
  const v = s.trim().toLowerCase();
  return ({ new: "New", active: "Active", reviewed: "Reviewed", approved: "Approved", resolved: "Resolved" } as Record<string, string>)[v] ?? STATUS_ALIASES[fold(s)]
    ?? (s.trim() ? s.trim()[0].toUpperCase() + s.trim().slice(1) : "");
};
export const isClosedStatus = (s: string) => /approved|resolved|closed|fixed|done/i.test(s);

/* ---------------------------------------------------------------- Navisworks HTML */

/** Navisworks HTML (tabular) clash report, best effort: every table with a "Clash Name"/"Name" + "Status"/"Distance" header row. */
export function parseNavisworksHtml(input: string | ArrayBuffer | Uint8Array, source?: string): Clash[] {
  const html = typeof input === "string" ? input.replace(/^\uFEFF/, "") : decodeText(input);
  const out: Clash[] = [];
  const tables = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)];
  const reportTitle = /clash report|report|navisworks|rapport|bericht|informe|relatorio|conflit|kollision|conflicto|conflitto/i;
  const title = clean(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  let fallbackTest = title && !reportTitle.test(title) ? title : title || "Clash test";
  let kvAt = -1;
  for (const t of tables) {
    // `rows` repeats a colspan cell's text across its columns (for "Item 1" / "Item 2" spans); `heads` keeps it in the
    // first column only, in English, so a "Clash Point" spanning three columns is still one heading.
    const rows: string[][] = [], heads: string[][] = [];
    let testName = "";
    for (const r of t[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells: string[] = [], hcells: string[] = [];
      for (const c of r[1].matchAll(/<t([hd])\b([^>]*)>([\s\S]*?)<\/t\1>/gi)) {
        const span = Math.max(1, Math.min(60, Number(attr(c[2], "colspan")) || 1));
        const txt = clean(c[3]);
        if (/\btestname\b/i.test(attr(c[2], "class")) && txt) testName = txt;
        for (let i = 0; i < span; i++) { cells.push(txt); hcells.push(i ? "" : canonHeader(txt)); }
      }
      rows.push(cells); heads.push(hcells);
    }
    // the summary table above each test's results ("<test name> | Tolerance | Clashes | New …") names the test
    if (testName) { fallbackTest = testName; kvAt = t.index ?? 0; }
    const before = html.slice(0, t.index);
    const hs = [...before.matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)];
    const last = hs.at(-1);
    const heading = last && (last.index ?? 0) > kvAt ? clean(last[1]) : "";
    // a small key/value table ("Test name | ARC vs STR") names the test of the next results table
    const hi = heads.findIndex((r) => r.some((c) => /^(clash ?name|name|clash)$/i.test(c)) && r.some((c) => /^(status|distance)$/i.test(c)));
    if (hi < 0) {
      const kv = rows.find((r) => r.length >= 2 && /^(test|test name|clash test|nom du test|testname|nombre de prueba)\s*:?$/i.test(r[0]));
      if (kv) { fallbackTest = kv[1]; kvAt = t.index ?? 0; }
      continue;
    }
    // a second header row under "Item 1" / "Item 2" spans ("Item ID | Layer | Item Name")
    const sub = heads[hi + 1];
    const twoRow = !!sub && sub.some((c) => /^(item id|element id|layer|item name|item type|name|type|guid|source file)$/i.test(c)) && !sub.some((c) => /^clash/i.test(c));
    const above = hi > 0 ? rows[hi - 1].map(canonHeader) : undefined;
    const header = twoRow ? rows[hi].map(canonHeader).map((h, i) => (sub[i] && sub[i] !== h ? `${h} ${sub[i]}` : h)) : disambiguate(heads[hi], above);
    const body = rows.slice(hi + (twoRow ? 2 : 1)).filter((r) => r.length >= Math.min(3, header.length) && !r.every((c) => c === r[0]));
    const test = heading && !reportTitle.test(heading) ? heading : fallbackTest;
    out.push(...rowsToClashes([header, ...body], test, source));
  }
  return uniqueIds(out);
}

/** Repeated item headers ("Item ID, Layer, Item Name" ×2) become "Item1 …" / "Item2 …". A row above with "Item 1"/"Item 2" spans helps too. */
function disambiguate(header: string[], above?: string[]): string[] {
  const counts = new Map<string, number>();
  header.forEach((h) => counts.set(h.toLowerCase(), (counts.get(h.toLowerCase()) ?? 0) + 1));
  const seen = new Map<string, number>();
  return header.map((h, i) => {
    if (!h) return h;
    const sup = above?.[i] ?? "";
    const side = /item\s*1|element\s*1|object\s*1/i.test(sup) ? 1 : /item\s*2|element\s*2|object\s*2/i.test(sup) ? 2 : 0;
    if (side && !/[12]/.test(h)) return `Item${side} ${h}`;
    if ((counts.get(h.toLowerCase()) ?? 0) < 2 || /[12]/.test(h)) return h;
    const n = (seen.get(h.toLowerCase()) ?? 0) + 1; seen.set(h.toLowerCase(), n);
    return n <= 2 ? `Item${n} ${h}` : h;
  });
}

/* ---------------------------------------------------------------- CSV / Excel rows */

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

type ItemField = keyof ClashItem;
function itemField(rest: string): ItemField | null {
  if (rest === "" || /^(item|element|object)?name$/.test(rest)) return "name";
  if (/guid|globalid/.test(rest)) return "guid";
  if (/^(element|item|object|revit)?id$/.test(rest)) return "elementId";
  if (/layer/.test(rest)) return "layer";
  if (/file|source|model/.test(rest)) return "file";
  if (/category|type|class|system/.test(rest)) return "category";
  return null;
}
/** "item1guid", "itema", "elementid1", "guidb", "layer2" → side + item field. */
function itemColumn(h: string): { side: 0 | 1; field: ItemField } | null {
  let m = /^(?:item|element|object|entity|component|selection)(1|2|a|b)(.*)$/.exec(h);
  if (m) { const f = itemField(m[2]); return f ? { side: /1|a/.test(m[1]) ? 0 : 1, field: f } : null; }
  m = /^(.*?)(1|2)$/.exec(h);
  if (m && m[1]) { const f = itemField(m[1].replace(/^(item|element|object)(?=.)/, "")) ?? itemField(m[1]); return f ? { side: m[2] === "1" ? 0 : 1, field: f } : null; }
  m = /^(guid|ifcguid|layer|file|category)(a|b)$/.exec(h);
  if (m) return { side: m[2] === "a" ? 0 : 1, field: itemField(m[1])! };
  return null;
}

/** Header row + body rows → clashes; recognises common Navisworks, Solibri, Revizto, BIMcollab and Excel exports. */
export function rowsToClashes(rows: string[][], test = "", source?: string): Clash[] {
  if (rows.length < 2) return [];
  // localised headings in English; repeated item headings ("Item ID, Layer … Item ID, Layer") split into Item1 / Item2
  const head0 = rows[0].map((h) => canonHeader(String(h ?? "")));
  const named = head0.filter(Boolean).map((h) => h.toLowerCase());
  const headRow = named.length !== new Set(named).size ? disambiguate(head0) : head0;
  const header = headRow.map(norm);
  const find = (re: RegExp) => header.findIndex((h) => re.test(h));
  const col = {
    test: find(/^(test|testname|clashtest|clashtestname|batchtest)$/), name: find(/^(clashname|name|clash|clashid|issuename|title)$/),
    status: find(/^(status|clashstatus|resultstatus)$/), distance: find(/^(distance|penetration|clashdistance|depth)/),
    grid: find(/^(gridlocation|grid|gridintersection|gridref)$/), level: find(/^(level|storey|story|floor|buildingstorey)$/),
    point: find(/^(clashpoint|point|location|position|coordinates)$/),
    x: find(/^(x|pointx|clashpointx|posx|locationx)$/), y: find(/^(y|pointy|clashpointy|posy|locationy)$/), z: find(/^(z|pointz|clashpointz|posz|locationz)$/),
  };
  const items = new Map<string, number>();
  header.forEach((h, i) => { const c = itemColumn(h); if (c && !items.has(`${c.side}.${c.field}`)) items.set(`${c.side}.${c.field}`, i); });
  const at = (r: string[], i: number | undefined) => (i !== undefined && i >= 0 ? (r[i] ?? "").trim() : "");
  const body = rows.slice(1).filter((r) => r.some((c) => (c ?? "").trim()));
  const base = parseClashReport([headRow, ...body]);
  return uniqueIds(body.map((r, i) => {
    const b = base[i];
    const item = (side: 0 | 1): ClashItem => {
      const v = (f: ItemField) => at(r, items.get(`${side}.${f}`));
      return {
        name: v("name") || (side ? b?.itemB : b?.itemA) || "", layer: v("layer"), file: v("file"),
        guid: v("guid") || (side ? b?.guidB : b?.guidA) || "", elementId: stripIdLabel(v("elementId")), category: realCategory(v("category")),
      };
    };
    const itemA = item(0), itemB = item(1);
    const gl = splitGrid(at(r, col.grid) || b?.gridLocation || "");
    const pt = col.point >= 0 ? parsePoint(at(r, col.point)) : { x: parseLength(at(r, col.x) || null), y: parseLength(at(r, col.y) || null), z: parseLength(at(r, col.z) || null) };
    const name = at(r, col.name) || b?.name || `Clash ${i + 1}`;
    const tname = at(r, col.test) || test || "Clash test";
    return {
      id: `${tname}#${name}`, test: tname, name, status: normStatus(at(r, col.status) || b?.status || ""),
      distance: parseLength(at(r, col.distance) || b?.distance || null), grid: gl.grid,
      level: at(r, col.level) || gl.level || (looksLikeLevel(itemA.layer) ? itemA.layer : ""),
      ...pt, itemA, itemB, source,
    };
  }));
}

/** CSV/TSV/Excel rows (first row = header, preamble rows above it are skipped). Builds on parseClashReport. */
export function parseCsvClashes(rows: string[][], test = "", source?: string): Clash[] {
  const hi = Math.max(0, rows.slice(0, 15).findIndex((r) => r.some((c) => /^(clash ?name|name|clash|clash ?id)$/i.test(canonHeader(String(c ?? ""))))));
  return rowsToClashes(rows.slice(hi), test, source);
}

/** Sniff the format from the file name / content. */
export function parseClashFile(name: string, input: string | ArrayBuffer | Uint8Array, csvRows?: (t: string) => string[][]): Clash[] {
  // bytes are decoded here (BOM, UTF-16, Windows-1252 fallback); a string only loses a leading byte-order mark
  const text = typeof input === "string" ? input.replace(/^\uFEFF/, "") : decodeText(input);
  const head = text.slice(0, 4000).toLowerCase();
  if (/\.xml$/i.test(name) || (head.includes("<exchange") && head.includes("clash"))) return parseNavisworksXml(text, name);
  if (/\.html?$/i.test(name) || head.includes("<html") || head.includes("<table")) return parseNavisworksHtml(text, name);
  return csvRows ? parseCsvClashes(csvRows(text), "", name) : [];
}

/* ---------------------------------------------------------------- disciplines */

// Boundaries that treat "_" and "-" as separators (\b does not for "_").
const code = (codes: string) => new RegExp(`(^|[^A-Za-z])(${codes})(?=[^A-Za-z]|$)`);
const RULES: [string, RegExp, RegExp][] = [
  ["FP", /sprinkler|fire ?protection|fire ?fighting|fire ?suppression|hydrant|wet ?riser|dry ?riser|standpipe|fire ?main|fire ?hose/i, code("FP|FF|FPR|SPK|SPR")],
  ["PLU", /plumbing|sanitary|drainage|\bdrain|soil|waste|rainwater|storm ?water|domestic|cold water|hot water|potable|sewer|plumbing fixture|public health|gully|trap/i, code("PLU|PLB|PL|PH|DR|SAN|PHE")],
  ["ELE", /electric|cable ?tray|cable ?ladder|conduit|lighting|light fixture|luminaire|busbar|bus duct|switchboard|panelboard|trunking|power|data|communication|\bfire alarm|security device/i, code("ELE|ELEC|EL|EE|ELC|LTG")],
  ["MEC", /duct|hvac|mechanical|air terminal|\bahu\b|fan ?coil|\bfcu\b|chilled|chiller|ventilat|diffuser|damper|refrigerant|heating|pipe|piping|flex duct/i, code("MEC|MECH|ME|MEP|HVAC|ACMV|MV")],
  ["STR", /struct|beam|framing|foundation|footing|rebar|reinforc|girder|truss|brace|bracing|pile|pile ?cap|transfer|steel ?frame|precast|post.?tension/i, code("STR|ST|STRUC|STRUCT|SE")],
  ["CIV", /civil|road|kerb|curb|topograph|earthwork|utility|utilities|manhole|culvert|pavement|retaining|site ?work|alignment/i, code("CIV|CV|CI|INF")],
  ["ARC", /architect|wall|door|window|ceiling|floor|stair|roof|curtain|mullion|furniture|casework|railing|partition|finish|column|ramp|toilet|generic model/i, code("ARC|ARCH|AR|AA|ID|INT")],
];
// UK National Annex role codes in ISO 19650 file names: Project-Originator-Volume-Level-Type-Role-Number.
const ROLE: Record<string, string> = { A: "ARC", S: "STR", M: "MEC", H: "MEC", E: "ELE", P: "PLU", D: "PLU", C: "CIV", I: "ARC", L: "CIV", F: "FP" };

/** Heuristic discipline code (ARC, STR, MEC, ELE, PLU, FP, CIV) from a file name, layer or category; "" when unknown. */
export function disciplineOf(...parts: (string | undefined | null)[]): string {
  for (const raw of parts) {
    const s = (raw ?? "").trim(); if (!s) continue;
    const base = s.replace(/^.*[\\/]/, "").replace(/\.[a-z0-9]+$/i, "");
    const fields = base.split(/[-_]/);
    if (fields.length >= 6 && /\.(nwc|nwd|rvt|ifc|dwg|ifczip)$/i.test(s)) {
      const role = fields[5]?.toUpperCase();
      if (role && ROLE[role[0]] && role.length <= 2) return ROLE[role[0]];
    }
    for (const [c, , short] of RULES) if (short.test(base)) return c;
    for (const [c, words] of RULES) if (words.test(s)) return c;
  }
  return "";
}
export const itemDiscipline = (i: ClashItem) => disciplineOf(i.file, i.category, i.layer, i.name);

/* ---------------------------------------------------------------- totals */

export function totals(clashes: Clash[]) {
  const by = (f: (c: Clash) => string) => {
    const m = new Map<string, number>();
    for (const c of clashes) { const k = f(c) || "—"; m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  return { total: clashes.length, byTest: by((c) => c.test), byStatus: by((c) => c.status), byLevel: by((c) => c.level) };
}

/* ---------------------------------------------------------------- grouping */

const itemKey = (i: ClashItem) => i.guid ? `g:${i.guid}` : i.elementId ? `e:${i.file}|${i.elementId}` : i.name && i.file ? `n:${i.file}|${i.name}` : "";
export const categoryOf = (i: ClashItem) => i.category || DISCIPLINES[itemDiscipline(i)] || "Unknown";

/** FNV-1a, base36 — short stable keys from group membership. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36).padStart(7, "0");
}

export interface GroupOptions { clusterDistance?: number; duplicates?: boolean }

/**
 * Deterministic root-cause groups; every clash lands in exactly one group:
 *  1. duplicates — the same element pair reported more than once (across tests or reports);
 *  2. spatial clusters — same level and category pair, clash points chained within `clusterDistance` metres (default 1.5);
 *  3. category pair per level — the rest of each level × category pair.
 */
export function groupClashes(clashes: Clash[], opts: GroupOptions = {}): ClashGroup[] {
  const d = opts.clusterDistance ?? 1.5;
  const sorted = [...clashes].sort((a, b) => a.id.localeCompare(b.id));
  const groups: ClashGroup[] = [];
  const used = new Set<string>();

  if (opts.duplicates !== false) {
    const pairs = new Map<string, Clash[]>();
    for (const c of sorted) {
      const a = itemKey(c.itemA), b = itemKey(c.itemB);
      if (!a || !b) continue;
      const k = [a, b].sort().join("~");
      pairs.set(k, [...(pairs.get(k) ?? []), c]);
    }
    for (const list of pairs.values()) if (list.length > 1) {
      list.forEach((c) => used.add(c.id));
      const a = list[0].itemA, b = list[0].itemB;
      groups.push(makeGroup("duplicate", list, `Same element pair reported ${list.length}×: ${a.name || a.elementId || "item 1"} × ${b.name || b.elementId || "item 2"}`));
    }
  }

  const buckets = new Map<string, Clash[]>();
  for (const c of sorted) {
    if (used.has(c.id)) continue;
    const k = `${c.level || "No level"}\u0000${[categoryOf(c.itemA), categoryOf(c.itemB)].sort().join(" × ")}`;
    buckets.set(k, [...(buckets.get(k) ?? []), c]);
  }
  for (const [k, list] of [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const [level, pair] = k.split("\u0000");
    const rest: Clash[] = [];
    for (const cl of d > 0 ? cluster(list, d) : [list]) {
      // clashes without a point are singletons, so any cluster of 2+ is genuinely spatial
      if (d > 0 && cl.length > 1) {
        const grids = uniq(cl.map((c) => c.grid)).slice(0, 3);
        groups.push(makeGroup("cluster", cl, `${pair} — cluster of ${cl.length} on ${level}${grids.length ? `, grid ${grids.join(" / ")}` : ""}`));
      } else rest.push(...cl);
    }
    if (rest.length) groups.push(makeGroup("pair", rest.sort((a, b) => a.id.localeCompare(b.id)), `${pair} on ${level}`));
  }
  return groups.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label) || a.key.localeCompare(b.key));
}

/** Single-linkage clusters (3D, metres) using a spatial hash; clashes without a point stay singletons. */
function cluster(list: Clash[], d: number): Clash[][] {
  const parent = list.map((_, i) => i);
  const findRoot = (i: number): number => (parent[i] === i ? i : (parent[i] = findRoot(parent[i])));
  const cells = new Map<string, number[]>();
  const cell = (c: Clash) => [Math.floor(c.x! / d), Math.floor(c.y! / d), Math.floor((c.z ?? 0) / d)];
  list.forEach((c, i) => {
    if (c.x === null || c.y === null) return;
    const [cx, cy, cz] = cell(c);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      for (const j of cells.get(`${cx + dx},${cy + dy},${cz + dz}`) ?? []) {
        const o = list[j];
        const dist = Math.hypot(c.x - o.x!, c.y - o.y!, (c.z ?? 0) - (o.z ?? 0));
        if (dist <= d) { const a = findRoot(i), b = findRoot(j); if (a !== b) parent[Math.max(a, b)] = Math.min(a, b); }
      }
    }
    const key = `${cx},${cy},${cz}`;
    cells.set(key, [...(cells.get(key) ?? []), i]);
  });
  const out = new Map<number, Clash[]>();
  list.forEach((c, i) => { const r = findRoot(i); out.set(r, [...(out.get(r) ?? []), c]); });
  return [...out.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

function makeGroup(kind: GroupKind, list: Clash[], label: string): ClashGroup {
  const ids = list.map((c) => c.id);
  const pts = list.filter((c) => c.x !== null && c.y !== null);
  const dists = list.map((c) => c.distance).filter((x): x is number => x !== null);
  const minD = dists.length ? Math.min(...dists) : null;
  return {
    key: `${kind[0]}-${hash(ids.join("\n"))}`, kind, label, count: list.length, clashIds: ids,
    levels: uniq(list.map((c) => c.level)), grids: uniq(list.map((c) => c.grid)),
    categories: uniq(list.flatMap((c) => [categoryOf(c.itemA), categoryOf(c.itemB)])),
    disciplines: uniq(list.flatMap((c) => [itemDiscipline(c.itemA), itemDiscipline(c.itemB)])).sort(),
    tests: uniq(list.map((c) => c.test)),
    maxPenetration: minD === null ? null : round(Math.max(0, -minD), 4),
    centroid: pts.length ? { x: round(pts.reduce((s, c) => s + c.x!, 0) / pts.length), y: round(pts.reduce((s, c) => s + c.y!, 0) / pts.length), z: round(pts.reduce((s, c) => s + (c.z ?? 0), 0) / pts.length) } : null,
    sample: [...list].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)).slice(0, 3),
  };
}

/* ---------------------------------------------------------------- AI payload & sanitising */

export interface CompactGroup {
  key: string; kind: GroupKind; label: string; count: number; levels: string[]; grids: string[]; categories: string[]; disciplines: string[]; tests: string[];
  maxPenetration: number | null;
  sample: { name: string; distance: number | null; status: string; a: { name: string; category: string; layer: string; file: string }; b: { name: string; category: string; layer: string; file: string } }[];
}
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const fileName = (s: string) => s.replace(/^.*[\\/]/, "");

/** What goes to the AI: grouped summaries only, capped (largest groups first). */
export function compactGroups(groups: ClashGroup[], max = 200): CompactGroup[] {
  const it = (i: ClashItem) => ({ name: cut(i.name, 120), category: cut(i.category, 80), layer: cut(i.layer, 80), file: cut(fileName(i.file), 120) });
  return groups.slice(0, max).map((g) => ({
    key: g.key, kind: g.kind, label: cut(g.label, 300), count: g.count,
    levels: g.levels.slice(0, 10).map((x) => cut(x, 80)), grids: g.grids.slice(0, 10).map((x) => cut(x, 80)),
    categories: g.categories.slice(0, 10).map((x) => cut(x, 80)), disciplines: g.disciplines.slice(0, 10), tests: g.tests.slice(0, 10).map((x) => cut(x, 120)),
    maxPenetration: g.maxPenetration,
    sample: g.sample.slice(0, 3).map((c) => ({ name: cut(c.name, 120), distance: c.distance, status: cut(c.status, 40), a: it(c.itemA), b: it(c.itemB) })),
  }));
}

const s = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/** Keep only answers for known keys; snap team names to the team list and priorities to the enum. */
export function sanitiseTriage(raw: unknown, keys: string[], teams: string[]): TriageResult {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const known = new Set(keys);
  const seen = new Set<string>();
  const groups: GroupTriage[] = [];
  for (const x of Array.isArray(o.groups) ? o.groups : []) {
    if (!x || typeof x !== "object") continue;
    const g = x as Record<string, unknown>;
    const key = s(g.key, 80);
    if (!known.has(key) || seen.has(key)) continue;
    seen.add(key);
    const team = s(g.responsible, 60);
    const match = teams.find((t) => t.toLowerCase() === team.toLowerCase());
    const pr = PRIORITIES.find((p) => p.toLowerCase() === s(g.priority, 20).toLowerCase()) ?? "Normal";
    groups.push({ key, rootCause: s(g.rootCause, 400), responsible: match ?? (teams.length ? "" : team), priority: pr, falsePositive: g.falsePositive === true || g.falsePositive === "true", action: s(g.action, 500) });
  }
  return { summary: s(o.summary, 2000), groups, patterns: (Array.isArray(o.patterns) ? o.patterns : []).slice(0, 12).map((p) => s(p, 400)).filter(Boolean) };
}

/** Rule-of-thumb starting point when AI is off: services move around structure; duplicates and shallow touches are low. */
export function suggestTriage(g: ClashGroup, teams: string[]): GroupTriage {
  const pick = (code: string) => teams.find((t) => t.toUpperCase() === code) ?? (code === "MEC" ? teams.find((t) => /^(MEP|MEC|MECH|HVAC)$/i.test(t)) : undefined) ?? "";
  const order = ["FP", "PLU", "ELE", "MEC", "ARC", "STR", "CIV"];
  const mover = order.find((c) => g.disciplines.includes(c)) ?? "";
  const pen = g.maxPenetration ?? 0;
  const structural = g.disciplines.includes("STR");
  const priority: Priority = g.kind === "duplicate" ? "Low" : pen < 0.025 ? "Low" : structural && pen >= 0.05 ? (g.count >= 10 ? "Critical" : "High") : g.count >= 10 ? "High" : "Normal";
  return { key: g.key, rootCause: "", responsible: mover ? pick(mover) : "", priority, falsePositive: g.kind === "duplicate" || (pen > 0 && pen < 0.01), action: "" };
}

/* ---------------------------------------------------------------- exports */

const fmtM = (n: number | null) => (n === null ? "" : n.toFixed(3));
const prRank = (p: string) => { const i = PRIORITIES.indexOf(p as Priority); return i < 0 ? 9 : i; };

/** One BCF topic per group with every clash GUID as a component. */
export function toBcfTopics(groups: ClashGroup[], triage: Record<string, GroupTriage | undefined>, clashes: Clash[], opts: { author?: string; date?: string } = {}): BcfTopic[] {
  const byId = new Map(clashes.map((c) => [c.id, c]));
  const date = opts.date ?? new Date().toISOString();
  return groups.map((g) => {
    const tr = triage[g.key];
    const list = g.clashIds.map((id) => byId.get(id)).filter((c): c is Clash => !!c);
    const components = uniq(list.flatMap((c) => [c.itemA.guid, c.itemB.guid]));
    const desc = [
      tr?.rootCause && `Root cause: ${tr.rootCause}`,
      tr?.action && `Action: ${tr.action}`,
      tr?.falsePositive && "Flagged as a likely false positive.",
      `${g.count} clashes · ${g.kind} · levels: ${g.levels.join(", ") || "—"} · grids: ${g.grids.slice(0, 8).join(", ") || "—"}`,
      g.maxPenetration !== null && `Deepest penetration: ${(g.maxPenetration * 1000).toFixed(0)} mm`,
      `Tests: ${g.tests.join(", ")}`,
      "Clashes:",
      ...list.slice(0, 60).map((c) => `- ${c.test} / ${c.name}: ${c.itemA.name || c.itemA.elementId} × ${c.itemB.name || c.itemB.elementId}${c.distance !== null ? ` (${fmtM(c.distance)} m)` : ""}${c.grid ? ` @ ${c.grid}` : ""}`),
      list.length > 60 ? `… and ${list.length - 60} more` : "",
    ].filter(Boolean).join("\n");
    return {
      guid: "", type: "Clash", status: "Open", title: cut(tr?.rootCause || g.label, 200), priority: tr?.priority ?? "Normal", description: desc,
      labels: uniq(["clash-triage", g.kind, ...g.disciplines, tr?.falsePositive ? "possible-false-positive" : ""]),
      creationDate: date, creationAuthor: opts.author ?? "Clash Triage", assignedTo: tr?.responsible ?? "", dueDate: "", components, comments: [],
    };
  });
}

export const GROUP_HEADER = ["Group", "Type", "Label", "Clashes", "Levels", "Grids", "Categories", "Disciplines", "Tests", "Max penetration (m)", "Priority", "Responsible", "False positive", "Root cause", "Action"];
export const CLASH_HEADER = ["Group", "Test", "Clash", "Status", "Distance (m)", "Level", "Grid", "X", "Y", "Z", "Item 1", "Item 1 category", "Item 1 layer", "Item 1 file", "Item 1 GUID", "Item 1 element ID", "Item 2", "Item 2 category", "Item 2 layer", "Item 2 file", "Item 2 GUID", "Item 2 element ID", "Source"];

/** Spreadsheet rows (header first) for the groups and clashes sheets. */
export function toRows(groups: ClashGroup[], triage: Record<string, GroupTriage | undefined>, clashes: Clash[]): { groups: string[][]; clashes: string[][] } {
  const groupOf = new Map<string, string>();
  for (const g of groups) for (const id of g.clashIds) groupOf.set(id, g.key);
  const gRows = groups.map((g) => {
    const tr = triage[g.key];
    return [g.key, g.kind, g.label, String(g.count), g.levels.join(", "), g.grids.join(", "), g.categories.join(", "), g.disciplines.join(", "), g.tests.join(", "), fmtM(g.maxPenetration),
      tr?.priority ?? "", tr?.responsible ?? "", tr ? (tr.falsePositive ? "Yes" : "No") : "", tr?.rootCause ?? "", tr?.action ?? ""];
  });
  const n = (v: number | null) => (v === null ? "" : String(v));
  const cRows = clashes.map((c) => [groupOf.get(c.id) ?? "", c.test, c.name, c.status, fmtM(c.distance), c.level, c.grid, n(c.x), n(c.y), n(c.z),
    c.itemA.name, c.itemA.category, c.itemA.layer, c.itemA.file, c.itemA.guid, c.itemA.elementId,
    c.itemB.name, c.itemB.category, c.itemB.layer, c.itemB.file, c.itemB.guid, c.itemB.elementId, c.source ?? ""]);
  return { groups: [GROUP_HEADER, ...gRows], clashes: [CLASH_HEADER, ...cRows] };
}

/** Coordination-meeting agenda (Markdown): summary, recurring patterns, then groups by priority and by team. */
export function agendaMarkdown(groups: ClashGroup[], triage: Record<string, GroupTriage | undefined>, opts: { title?: string; summary?: string; patterns?: string[]; date?: string; includeFalsePositives?: boolean } = {}): string {
  const real = groups.filter((g) => opts.includeFalsePositives || !triage[g.key]?.falsePositive);
  const fps = groups.filter((g) => triage[g.key]?.falsePositive);
  const line = (g: ClashGroup) => {
    const tr = triage[g.key];
    return `- **${tr?.rootCause || g.label}** (${g.count} clashes; ${g.levels.join(", ") || "no level"}${g.grids.length ? `; grid ${g.grids.slice(0, 4).join(", ")}` : ""})${tr?.responsible ? ` — ${tr.responsible}` : ""}${tr?.action ? `\n  - Action: ${tr.action}` : ""}`;
  };
  const md: string[] = [`# ${opts.title || "Clash coordination meeting"}`, "", `Date: ${opts.date ?? new Date().toISOString().slice(0, 10)}`, "",
    `${groups.reduce((s, g) => s + g.count, 0)} clashes in ${groups.length} groups${fps.length ? ` (${fps.length} groups flagged as likely false positives)` : ""}.`, ""];
  if (opts.summary) md.push("## Summary", "", opts.summary, "");
  if (opts.patterns?.length) md.push("## Recurring patterns to raise", "", ...opts.patterns.map((p) => `- ${p}`), "");
  md.push("## Groups by priority", "");
  for (const p of PRIORITIES) {
    const list = real.filter((g) => (triage[g.key]?.priority ?? "Normal") === p);
    if (list.length) md.push(`### ${p} (${list.length})`, "", ...list.map(line), "");
  }
  md.push("## Actions by team", "");
  const teams = uniq(real.map((g) => triage[g.key]?.responsible || "Unassigned")).sort((a, b) => (a === "Unassigned" ? 1 : b === "Unassigned" ? -1 : a.localeCompare(b)));
  for (const t of teams) {
    const list = real.filter((g) => (triage[g.key]?.responsible || "Unassigned") === t).sort((a, b) => prRank(triage[a.key]?.priority ?? "Normal") - prRank(triage[b.key]?.priority ?? "Normal") || b.count - a.count);
    md.push(`### ${t}`, "", "| Priority | Group | Clashes | Action |", "| --- | --- | --- | --- |",
      ...list.map((g) => `| ${triage[g.key]?.priority ?? "Normal"} | ${(triage[g.key]?.rootCause || g.label).replace(/\|/g, "/")} | ${g.count} | ${(triage[g.key]?.action ?? "").replace(/\|/g, "/")} |`), "");
  }
  if (fps.length && !opts.includeFalsePositives) md.push("## Likely false positives (confirm and approve)", "", ...fps.map(line), "");
  return md.join("\n");
}
