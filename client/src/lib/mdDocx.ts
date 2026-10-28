import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, LevelFormat, Packer, PageBreak, PageNumber, Paragraph,
  ShadingType, Table, TableCell, TableOfContents, TableRow, TextRun, WidthType,
} from "docx";
import { saveAs } from "file-saver";
import { parseInline, parseMarkdown, type Block } from "../../../shared/mdBlocks";

// Word export for AI-written Markdown: optional cover page and document control, contents, real heading styles,
// bordered tables with a repeating header row, numbered/bulleted lists, quotes and highlighted [PLACEHOLDER]s.

export interface DocMeta {
  title: string; project?: string; organisation?: string; orgRole?: string; appointingParty?: string; stage?: string;
  reference?: string; revision?: string; status?: string; date?: string; preparedBy?: string; checkedBy?: string; approvedBy?: string; security?: string;
}

const NAVY = "1E3A5F", GRID = "B8C2CC";
const border = { style: BorderStyle.SINGLE, size: 4, color: GRID };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

function runs(text: string, opts: { bold?: boolean; color?: string; size?: number } = {}) {
  return parseInline(text).map((x) => {
    const base = { bold: opts.bold || x.t === "b", italics: x.t === "i", color: opts.color, size: opts.size };
    if (x.t === "code") return new TextRun({ ...base, text: x.v, font: "Consolas" });
    if (x.t === "ph") return new TextRun({ ...base, text: x.v, bold: true, highlight: "yellow" });
    if (x.t === "link") return new TextRun({ ...base, text: x.v, color: "2563EB", underline: {} });
    return new TextRun({ ...base, text: x.v });
  });
}
const multiline = (text: string, opts: { bold?: boolean; color?: string; size?: number } = {}) =>
  text.split("\n").map((line) => new Paragraph({ spacing: { after: 40 }, children: runs(line, opts) }));

const cell = (text: string, header: boolean, width?: number) => new TableCell({
  width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  shading: header ? { type: ShadingType.CLEAR, color: "auto", fill: NAVY } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: multiline(text, header ? { bold: true, color: "FFFFFF", size: 19 } : { size: 19 }),
});

function blocksToDocx(blocks: Block[]) {
  const out: (Paragraph | Table)[] = [];
  const headings = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_1, 3: HeadingLevel.HEADING_2, 4: HeadingLevel.HEADING_3 } as const;
  let skippedTitle = false;
  for (const b of blocks) {
    if (b.k === "h") {
      // the cover page already carries the document title
      if (b.level === 1 && !skippedTitle) { skippedTitle = true; continue; }
      out.push(new Paragraph({ heading: headings[b.level], children: runs(b.text) }));
    } else if (b.k === "p") out.push(new Paragraph({ spacing: { after: 120 }, children: runs(b.text) }));
    else if (b.k === "quote") out.push(new Paragraph({ spacing: { before: 80, after: 120 }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "EEF4FB" }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: "3B82F6", space: 8 } }, children: runs(b.text, { color: NAVY }) }));
    else if (b.k === "hr") out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GRID, space: 1 } }, children: [] }));
    else if (b.k === "list") {
      const base = Math.min(...b.items.map((x) => x.level));
      for (const it of b.items) {
        const level = Math.min(2, it.level - base);
        out.push(b.ordered ? new Paragraph({ numbering: { reference: "num", level }, children: runs(it.text) }) : new Paragraph({ bullet: { level }, children: runs(it.text) }));
      }
    } else if (b.k === "table") {
      out.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, borders,
        rows: [new TableRow({ tableHeader: true, children: b.header.map((c) => cell(c, true)) }), ...b.rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c) => cell(c, false)) }))],
      }));
      out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    }
  }
  return out;
}

export function markdownToDocx(md: string, meta?: DocMeta): Document {
  const body = blocksToDocx(parseMarkdown(md));
  const front: (Paragraph | Table)[] = [];
  if (meta) {
    const kv = (rows: [string, string][]) => new Table({
      width: { size: 100, type: WidthType.PERCENTAGE }, borders,
      rows: rows.map(([k, v]) => new TableRow({ children: [
        new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "EEF2F6" }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 19 })] })] }),
        new TableCell({ width: { size: 68, type: WidthType.PERCENTAGE }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: runs(v || "—", { size: 19 }) })] }),
      ] })),
    });
    front.push(
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 200 }, children: [new TextRun({ text: meta.title, bold: true, size: 52, color: NAVY })] }),
      ...(meta.project ? [new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: meta.project, size: 32, color: "334155" })] })] : []),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: NAVY, space: 4 } }, spacing: { after: 400 }, children: [] }),
      kv(([["Document reference", meta.reference ?? ""], ["Version / revision", meta.revision ?? "P01"], ["Status", meta.status ?? "Draft for review"], ["Project stage", meta.stage ?? ""],
        ["Organisation", [meta.organisation, meta.orgRole && `(${meta.orgRole})`].filter(Boolean).join(" ")], ["Appointing party", meta.appointingParty ?? ""], ["Prepared by", meta.preparedBy ?? ""],
        ["Issue date", meta.date ?? new Date().toISOString().slice(0, 10)], ["Security classification", meta.security ?? ""]] as [string, string][]).filter(([k, v]) => v || ["Document reference", "Version / revision", "Status"].includes(k))),
      new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "This is a working draft for review. It is not approved and is not a statement of compliance.", italics: true, size: 18, color: "64748B" })] }),
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Document control")] }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, borders,
        rows: [new TableRow({ tableHeader: true, children: ["Revision", "Date", "Status", "Description", "Prepared", "Checked", "Approved"].map((h) => cell(h, true)) }),
          new TableRow({ children: [meta.revision ?? "P01", meta.date ?? new Date().toISOString().slice(0, 10), meta.status ?? "Draft for review", "First issue for review", meta.preparedBy || "[Name]", meta.checkedBy || "[Name]", meta.approvedBy || "[Name]"].map((v) => cell(v, false)) })],
      }),
      new Paragraph({ spacing: { before: 300 }, heading: HeadingLevel.HEADING_1, children: [new TextRun("Contents")] }),
      new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
      new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Right-click the contents and choose Update Field if it is empty.", italics: true, size: 16, color: "94A3B8" })] }),
      new Paragraph({ children: [new PageBreak()] }),
    );
  }
  const small = { size: 16, color: "64748B" };
  return new Document({
    features: { updateFields: !!meta },
    numbering: { config: [{ reference: "num", levels: [0, 1, 2].map((level) => ({ level, format: [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN][level], text: `%${level + 1}.`, alignment: AlignmentType.START, style: { paragraph: { indent: { left: 360 * (level + 1), hanging: 260 } } } })) }] },
    styles: {
      default: { document: { run: { font: "Calibri", size: 21 }, paragraph: { spacing: { line: 276 } } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 30, bold: true, color: NAVY }, paragraph: { spacing: { before: 360, after: 120 }, keepNext: true } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 25, bold: true, color: "27466F" }, paragraph: { spacing: { before: 240, after: 80 }, keepNext: true } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, color: "334155" }, paragraph: { spacing: { before: 200, after: 60 }, keepNext: true } },
      ],
    },
    sections: [{
      properties: { page: { margin: { top: 1200, bottom: 1100, left: 1100, right: 1100 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: [meta?.title, meta?.project].filter(Boolean).join(" · "), ...small })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ ...small, children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES] }), new TextRun({ text: meta?.reference ? `   ·   ${meta.reference} ${meta.revision ?? ""}` : "", ...small })] })] }) },
      children: [...front, ...body],
    }],
  });
}

export async function saveMarkdownDocx(md: string, name: string, meta?: DocMeta) {
  saveAs(await Packer.toBlob(markdownToDocx(md, meta)), name + ".docx");
}
