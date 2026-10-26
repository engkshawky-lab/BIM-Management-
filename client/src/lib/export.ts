import { saveAs } from "file-saver";
import type { DocTemplate } from "../../../shared/data/types";
import type { FieldValue } from "../../../shared/documents";

const STANDARD_NAME = { iso19650: "ISO 19650", iso42001: "ISO/IEC 42001" } as const;

export interface ExportDoc {
  title: string;
  containerName: string;
  revision: string;
  state: string;
  suitability: string;
  authorName: string;
  reviewerName?: string | null;
  values: Record<string, FieldValue>;
  history: { revision: string; date: string; author: string; status: string; note: string }[];
}
export interface ExportProject { name: string; code: string; appointingParty: string; location: string }

export const fileBase = (doc: ExportDoc, t: DocTemplate) =>
  (doc.containerName || `${t.code}-${doc.title}`).replace(/[^\w.-]+/g, "_") + `_${doc.revision}`;

/** Builds a fully formatted Word document: cover, document control, contents, numbered sections. */
export async function buildDocx(doc: ExportDoc, t: DocTemplate, project: ExportProject): Promise<Blob> {
  // docx is large; load it only when a Word export is requested
  const {
    AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, Packer, PageBreak, PageNumber, Paragraph,
    ShadingType, Table, TableCell, TableOfContents, TableRow, TextRun, WidthType,
  } = await import("docx");
  type Block = InstanceType<typeof Paragraph> | InstanceType<typeof Table> | InstanceType<typeof TableOfContents>;
  const NAVY = "1E3A5F";

  const cell = (text: string, opts: { header?: boolean; label?: boolean; width?: number } = {}) => new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.header ? { type: ShadingType.CLEAR, color: "auto", fill: NAVY } : opts.label ? { type: ShadingType.CLEAR, color: "auto", fill: "EEF2F6" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: String(text || "").split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, bold: opts.header || opts.label, color: opts.header ? "FFFFFF" : undefined, size: 18 })] })),
  });
  const borders = Object.fromEntries(["top", "bottom", "left", "right", "insideHorizontal", "insideVertical"].map((k) => [k, { style: BorderStyle.SINGLE, size: 4, color: "B8C2CC" }]));
  const grid = (rows: string[][], header?: string[]) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, borders,
    rows: [...(header ? [new TableRow({ tableHeader: true, children: header.map((h) => cell(h, { header: true })) })] : []), ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) }))],
  });
  const kv = (rows: [string, string][]) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, borders,
    rows: rows.map(([k, v]) => new TableRow({ children: [cell(k, { label: true, width: 32 }), cell(v, { width: 68 })] })),
  });
  const gap = () => new Paragraph({ text: "" });

  const cover: Block[] = [
    new Paragraph({ spacing: { before: 2400 }, children: [new TextRun({ text: `${STANDARD_NAME[t.standard]} · ${t.code}`, color: "0E7C86", bold: true, size: 24 })] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: doc.title, bold: true, size: 56, color: NAVY })] }),
    new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: `${project.code} — ${project.name}`, size: 30 })] }),
    kv([
      ["Document number", doc.containerName || "—"], ["Revision", doc.revision], ["Status / suitability", `${doc.state} / ${doc.suitability}`],
      ["Appointing party", project.appointingParty || "—"], ["Location", project.location || "—"], ["Prepared by", doc.authorName || "—"],
      ["Clause references", t.clauseRefs.join(", ")], ["Date", new Date().toISOString().slice(0, 10)],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const control: Block[] = [
    new Paragraph({ text: "Document control", heading: HeadingLevel.HEADING_1 }),
    grid(doc.history.map((h) => [h.revision, h.date, h.author, h.status, h.note]), ["Rev", "Date", "Author", "Status", "Description"]),
    gap(),
    new Paragraph({ text: "Approval", heading: HeadingLevel.HEADING_2 }),
    grid([["Prepared", doc.authorName || "", "", ""], ["Reviewed", doc.reviewerName || "", "", ""], ["Authorized", "", "", ""]], ["Role", "Name", "Signature", "Date"]),
    gap(),
    new Paragraph({ text: "Contents", heading: HeadingLevel.HEADING_1 }),
    new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
    new Paragraph({ children: [new TextRun({ text: "Right-click the contents and choose Update Field to refresh page numbers.", italics: true, size: 16, color: "888888" })] }),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ text: "Purpose", heading: HeadingLevel.HEADING_1 }),
    new Paragraph(t.purpose),
  ];

  const body: Block[] = [];
  t.sections.forEach((s, i) => {
    body.push(new Paragraph({ text: `${i + 1}. ${s.title}`, heading: HeadingLevel.HEADING_1 }));
    for (const f of s.fields) {
      const v = doc.values[f.id];
      if (f.type === "table") {
        body.push(new Paragraph({ text: f.label, heading: HeadingLevel.HEADING_2 }));
        const rows = ((v as string[][]) ?? []).filter((r) => r.some(Boolean));
        body.push(rows.length ? grid(rows, f.columns) : new Paragraph({ children: [new TextRun({ text: "Not provided.", italics: true, color: "888888" })] }));
        body.push(gap());
      } else if (f.type === "textarea") {
        body.push(new Paragraph({ text: f.label, heading: HeadingLevel.HEADING_2 }));
        const lines = String(v || "").split("\n").filter((l) => l.trim());
        if (!lines.length) body.push(new Paragraph({ children: [new TextRun({ text: "Not provided.", italics: true, color: "888888" })] }));
        // Multi-line answers read as lists.
        lines.forEach((line) => body.push(lines.length > 1 ? new Paragraph({ text: line.replace(/^[-•*]\s*/, ""), bullet: { level: 0 } }) : new Paragraph(line)));
      } else {
        body.push(new Paragraph({ children: [new TextRun({ text: f.label + ": ", bold: true }), new TextRun(String(v || "—"))] }));
      }
    }
  });

  const d = new Document({
    creator: doc.authorName, title: doc.title, description: `${t.code} ${doc.revision}`,
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: "Calibri", size: 21 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { size: 30, bold: true, color: NAVY }, paragraph: { spacing: { before: 360, after: 120 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { size: 24, bold: true, color: "0E7C86" }, paragraph: { spacing: { before: 200, after: 80 } } },
      ],
    },
    sections: [{
      properties: { titlePage: true },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${doc.containerName || doc.title}   Rev ${doc.revision}   ${doc.state}/${doc.suitability}`, size: 16, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${project.code} · ${t.code} · Page `, size: 16, color: "666666" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "666666" }), new TextRun({ text: " of ", size: 16, color: "666666" }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "666666" })] })] }) },
      children: [...cover, ...control, ...body],
    }],
  });
  return Packer.toBlob(d);
}

export async function exportDocx(doc: ExportDoc, t: DocTemplate, project: ExportProject) {
  saveAs(await buildDocx(doc, t, project), fileBase(doc, t) + ".docx");
}

export function toMarkdown(doc: ExportDoc, t: DocTemplate): string {
  const md: string[] = [`# ${doc.title}`, "", `**${STANDARD_NAME[t.standard]} · ${t.code}** — ${t.clauseRefs.join(", ")}`, ""];
  md.push(`| Document | Revision | State | Suitability | Author |`, `|---|---|---|---|---|`, `| ${doc.containerName || "—"} | ${doc.revision} | ${doc.state} | ${doc.suitability} | ${doc.authorName || "—"} |`, "");
  t.sections.forEach((s, i) => {
    md.push(`## ${i + 1}. ${s.title}`, "");
    for (const f of s.fields) {
      const v = doc.values[f.id];
      if (f.type === "table") {
        md.push(`**${f.label}**`, "", `| ${f.columns!.join(" | ")} |`, `|${f.columns!.map(() => "---").join("|")}|`);
        ((v as string[][]) ?? []).forEach((r) => md.push(`| ${r.map((c) => c.replace(/\|/g, "\\|")).join(" | ")} |`));
        md.push("");
      } else md.push(`**${f.label}:** ${String(v || "—")}`, "");
    }
  });
  return md.join("\n");
}

export function exportMarkdown(doc: ExportDoc, t: DocTemplate) {
  saveAs(new Blob([toMarkdown(doc, t)], { type: "text/markdown" }), fileBase(doc, t) + ".md");
}

export function exportCsv(name: string, header: string[], rows: string[][]) {
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  saveAs(new Blob(["﻿" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" }), name + ".csv");
}

/** Parse rows pasted from Excel / Sheets (tab-separated) or CSV text, honouring quoted cells. */
export function parseTabular(text: string): string[][] {
  const src = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  const sep = src.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  row.push(cell); rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim()));
}
