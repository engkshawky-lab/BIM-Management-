import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { saveAs } from "file-saver";

// Word export for AI-generated Markdown: headings, paragraphs, bullet/numbered lists, tables and **bold**.

const runs = (text: string, bold = false) =>
  text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((t) => t.startsWith("**") ? new TextRun({ text: t.slice(2, -2), bold: true }) : new TextRun({ text: t.replace(/\*([^*]+)\*/g, "$1").replace(/`([^`]+)`/g, "$1"), bold }));

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));

export function markdownToDocx(md: string): Document {
  const lines = md.replace(/\r/g, "").split("\n");
  const body: (Paragraph | Table)[] = [];
  const headings = [HeadingLevel.TITLE, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const h = /^(#{1,5})\s+(.*)$/.exec(line);
    if (h) { body.push(new Paragraph({ heading: headings[h[1].length - 1], children: runs(h[2]) })); continue; }
    if (line.trim().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        if (!/^\s*\|?\s*:?-{2,}/.test(lines[i])) rows.push(cells(lines[i]));
        i++;
      }
      i--;
      const width = Math.max(...rows.map((r) => r.length));
      body.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map((r, ri) => new TableRow({ tableHeader: ri === 0, children: Array.from({ length: width }, (_, ci) => new TableCell({ children: [new Paragraph({ children: runs(r[ci] ?? "", ri === 0) })] })) })),
      }));
      body.push(new Paragraph(""));
      continue;
    }
    const b = /^\s*[-*]\s+(.*)$/.exec(line);
    if (b) { body.push(new Paragraph({ bullet: { level: line.search(/\S/) >= 2 ? 1 : 0 }, children: runs(b[1]) })); continue; }
    const n = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (n) { body.push(new Paragraph({ children: [new TextRun(`${n[1]}. `), ...runs(n[2])] })); continue; }
    body.push(new Paragraph({ children: runs(line) }));
  }
  return new Document({ styles: { default: { document: { run: { font: "Calibri", size: 21 } } } }, sections: [{ children: body }] });
}

export async function saveMarkdownDocx(md: string, name: string) {
  saveAs(await Packer.toBlob(markdownToDocx(md)), name + ".docx");
}
