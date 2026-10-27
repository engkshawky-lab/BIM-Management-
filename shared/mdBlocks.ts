// Markdown → simple block/inline structure for AI-written documents, shared by the on-screen renderer and the
// Word export: headings, paragraphs, nested and numbered lists, tables (with <br> and escaped pipes),
// quotes, rules, bold/italic/code, links and [PLACEHOLDER] markers. No HTML is ever produced.

export type Block =
  | { k: "h"; level: 1 | 2 | 3 | 4; text: string }
  | { k: "p"; text: string }
  | { k: "list"; ordered: boolean; items: { text: string; level: number; n?: number }[] }
  | { k: "table"; header: string[]; rows: string[][] }
  | { k: "quote"; text: string }
  | { k: "hr" };

export type Inline = { t: "text" | "b" | "i" | "code" | "ph"; v: string } | { t: "link"; v: string; href: string };

const LIST = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const cells = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|").replace(/<br\s*\/?>/gi, "\n"));

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r/g, "").replace(/^```(?:markdown|md)?\s*\n?/i, "").replace(/\n?```\s*$/, "").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { out.push({ k: "hr" }); i++; continue; }
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(l);
    if (h) { out.push({ k: "h", level: Math.min(4, h[1].length) as 1 | 2 | 3 | 4, text: h[2] }); i++; continue; }
    if (/^\s*\|/.test(l)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { if (!/^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i]) || !/-/.test(lines[i])) rows.push(cells(lines[i])); i++; }
      const width = Math.max(...rows.map((r) => r.length));
      const pad = (r: string[]) => [...r, ...Array(Math.max(0, width - r.length)).fill("")].slice(0, width);
      if (rows.length) out.push({ k: "table", header: pad(rows[0]), rows: rows.slice(1).map(pad) });
      continue;
    }
    if (/^\s*>/.test(l)) {
      const q: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      out.push({ k: "quote", text: q.join(" ").trim() });
      continue;
    }
    if (LIST.test(l)) {
      const items: { text: string; level: number; n?: number }[] = [];
      const ordered = /^\s*\d/.test(l);
      while (i < lines.length && (LIST.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        const m = LIST.exec(lines[i]);
        if (m) items.push({ text: m[3], level: Math.min(3, Math.floor(m[1].replace(/\t/g, "  ").length / 2)), n: /^\d/.test(m[2]) ? parseInt(m[2], 10) : undefined });
        else items[items.length - 1].text += " " + lines[i].trim();
        i++;
      }
      out.push({ k: "list", ordered, items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*\||\s*>)/.test(lines[i]) && !LIST.test(lines[i]) && !/^\s*([-*_])(\s*\1){2,}\s*$/.test(lines[i])) { para.push(lines[i].trim()); i++; }
    out.push({ k: "p", text: para.join(" ") });
  }
  return out;
}

/** Inline markup: **bold**, *italic* / _italic_, `code`, [text](https://…) and [PLACEHOLDER] / [CONFIRM: …] markers. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\)|\[[^\]\n]{2,120}\])/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: "text", v: text.slice(last, m.index) });
    const s = m[0];
    if (s.startsWith("**") || s.startsWith("__")) out.push({ t: "b", v: s.slice(2, -2) });
    else if (s.startsWith("`")) out.push({ t: "code", v: s.slice(1, -1) });
    else if (s.startsWith("[") && m[2]) out.push({ t: "link", v: s.slice(1, s.indexOf("](")), href: m[2] });
    else if (s.startsWith("[")) out.push({ t: "ph", v: s });
    else out.push({ t: "i", v: s.slice(1, -1) });
    last = m.index + s.length;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

/** Placeholders still to resolve, e.g. [CONFIRM] or [Project name]. */
export const placeholders = (md: string) => (md.match(/\[(?:CONFIRM|TBC|TBD)[^\]]*\]|\[[A-Z][^\]\n(]{2,60}\](?!\()/g) ?? []);
