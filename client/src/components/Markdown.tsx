import { Fragment, type ReactNode } from "react";

// Small, safe Markdown renderer for AI answers: headings, lists, tables, bold/italic, code,
// and [S1] citation markers rendered as links. No HTML is ever injected.

function inline(text: string, cite?: (n: number) => ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[SN]\d+\])/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<b key={k++}>{t.slice(2, -2)}</b>);
    else if (t.startsWith("`")) out.push(<code key={k++}>{t.slice(1, -1)}</code>);
    else if (/^\[[SN]/.test(t)) out.push(<Fragment key={k++}>{cite ? cite(+t.slice(2, -1)) : t}</Fragment>);
    else out.push(<i key={k++}>{t.slice(1, -1)}</i>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, cite }: { text: string; cite?: (n: number) => ReactNode }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0; let k = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const h = /^(#{1,4})\s+(.*)/.exec(l);
    if (h) { blocks.push(<div key={k++} className="md-h" style={{ fontSize: h[1].length <= 2 ? 16 : 14 }}>{inline(h[2], cite)}</div>); i++; continue; }
    if (/^\s*\|/.test(l)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) rows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())); i++; }
      blocks.push(<div key={k++} className="table-wrap"><table className="data"><thead><tr>{rows[0].map((c, j) => <th key={j}>{inline(c, cite)}</th>)}</tr></thead><tbody>{rows.slice(1).map((r, a) => <tr key={a}>{r.map((c, j) => <td key={j}>{inline(c, cite)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l); const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "")); i++; }
      const L = ordered ? "ol" : "ul";
      blocks.push(<L key={k++}>{items.map((x, j) => <li key={j}>{inline(x, cite)}</li>)}</L>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*\||\s*([-*]|\d+\.)\s+)/.test(lines[i])) { para.push(lines[i]); i++; }
    blocks.push(<p key={k++}>{inline(para.join(" "), cite)}</p>);
  }
  return <div className="md">{blocks}</div>;
}
