import type { ReactNode } from "react";
import { parseInline, parseMarkdown, type Block } from "../../../shared/mdBlocks";

// Renders AI-written documents as a paper-style page: real heading levels, nested lists, styled tables,
// quotes and highlighted [CONFIRM] placeholders. Shares its parser with the Word export.

export function InlineText({ text }: { text: string }) {
  return <>{parseInline(text).map((x, i) => {
    if (x.t === "b") return <b key={i}>{x.v}</b>;
    if (x.t === "i") return <i key={i}>{x.v}</i>;
    if (x.t === "code") return <code key={i}>{x.v}</code>;
    if (x.t === "ph") return <mark key={i} className="doc-ph">{x.v}</mark>;
    if (x.t === "link") return <a key={i} href={x.href} target="_blank" rel="noopener noreferrer nofollow">{x.v}</a>;
    return <span key={i}>{x.v}</span>;
  })}</>;
}

const Multi = ({ text }: { text: string }) => <>{text.split("\n").map((line, i) => <span key={i}>{i > 0 && <br />}<InlineText text={line} /></span>)}</>;

function List({ items, ordered }: Extract<Block, { k: "list" }>) {
  // nest by level: each item opens a sub-list when the next one is deeper
  const build = (from: number, level: number): [ReactNode[], number] => {
    const nodes: ReactNode[] = []; let i = from;
    while (i < items.length && items[i].level >= level) {
      if (items[i].level > level) { const [kids, next] = build(i, items[i].level); nodes.push(<li key={"n" + i} style={{ listStyle: "none" }}>{ordered ? <ol>{kids}</ol> : <ul>{kids}</ul>}</li>); i = next; continue; }
      nodes.push(<li key={i}><InlineText text={items[i].text} /></li>); i++;
    }
    return [nodes, i];
  };
  const [nodes] = build(0, Math.min(...items.map((x) => x.level)));
  const start = ordered ? items[0].n : undefined;
  return ordered ? <ol start={start}>{nodes}</ol> : <ul>{nodes}</ul>;
}

export function DocMarkdown({ text }: { text: string }) {
  const blocks = parseMarkdown(text);
  return (
    <div className="doc-paper">
      {blocks.map((b, i) => {
        switch (b.k) {
          case "h": { const H = (`h${b.level}`) as "h1" | "h2" | "h3" | "h4"; return <H key={i}><InlineText text={b.text} /></H>; }
          case "p": return <p key={i}><InlineText text={b.text} /></p>;
          case "list": return <List key={i} {...b} />;
          case "quote": return <blockquote key={i}><InlineText text={b.text} /></blockquote>;
          case "hr": return <hr key={i} />;
          case "table": return (
            <div key={i} className="doc-table"><table>
              <thead><tr>{b.header.map((c, j) => <th key={j}><Multi text={c} /></th>)}</tr></thead>
              <tbody>{b.rows.map((r, a) => <tr key={a}>{r.map((c, j) => <td key={j}><Multi text={c} /></td>)}</tr>)}</tbody>
            </table></div>);
        }
      })}
    </div>
  );
}
