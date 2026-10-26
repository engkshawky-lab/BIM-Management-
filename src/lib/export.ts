import { saveAs } from "file-saver";
import type { DocTemplate } from "../data/types";
import type { PortalDocument } from "./store";

const STANDARD_NAME = { iso19650: "ISO 19650", iso42001: "ISO/IEC 42001" } as const;

const fileBase = (doc: PortalDocument, t: DocTemplate) =>
  (doc.containerName || `${t.code}-${doc.title}`).replace(/[^\w.-]+/g, "_") + `_${doc.revision}`;

export async function exportDocx(doc: PortalDocument, t: DocTemplate) {
  // docx is large; load it only when a Word export is requested
  const { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } = await import("docx");
  type Block = InstanceType<typeof Paragraph> | InstanceType<typeof Table>;

const cell = (text: string, header = false) =>
  new TableCell({
    shading: header ? { type: ShadingType.CLEAR, color: "auto", fill: "1E3A5F" } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: header, color: header ? "FFFFFF" : undefined, size: 18 })] })],
  });

const grid = (rows: string[][], header?: string[]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: Object.fromEntries(["top", "bottom", "left", "right", "insideHorizontal", "insideVertical"].map((k) => [k, { style: BorderStyle.SINGLE, size: 4, color: "B8C2CC" }])),
    rows: [...(header ? [new TableRow({ tableHeader: true, children: header.map((h) => cell(h, true)) })] : []), ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) }))],
  });

  const body: Block[] = [
    new Paragraph({ text: STANDARD_NAME[t.standard] + " · " + t.code, alignment: AlignmentType.LEFT, children: [] }),
    new Paragraph({ text: doc.title, heading: HeadingLevel.TITLE }),
    grid([
      ["Document number", doc.containerName || "—"],
      ["Revision", doc.revision],
      ["CDE state / suitability", `${doc.state} / ${doc.suitability}`],
      ["Author", doc.author || "—"],
      ["Clause references", t.clauseRefs.join(", ")],
    ]),
    new Paragraph({ text: "Revision history", heading: HeadingLevel.HEADING_2 }),
    grid(doc.history.map((h) => [h.revision, h.date, h.author, `${h.state} / ${h.suitability}`, h.note]), ["Rev", "Date", "Author", "Status", "Description"]),
    new Paragraph({ text: "Purpose", heading: HeadingLevel.HEADING_1 }),
    new Paragraph(t.purpose),
  ];
  t.sections.forEach((s, i) => {
    body.push(new Paragraph({ text: `${i + 1}. ${s.title}`, heading: HeadingLevel.HEADING_1 }));
    body.push(new Paragraph({ children: [new TextRun({ text: s.guidance, italics: true, color: "5B6B7B", size: 18 })] }));
    for (const f of s.fields) {
      const v = doc.values[f.id];
      if (f.type === "table") {
        body.push(new Paragraph({ text: f.label, heading: HeadingLevel.HEADING_3 }));
        const rows = (v as string[][]) ?? [];
        body.push(rows.length ? grid(rows, f.columns) : new Paragraph("—"));
      } else {
        body.push(new Paragraph({ children: [new TextRun({ text: f.label + ": ", bold: true })] }));
        String(v || "—").split("\n").forEach((line) => body.push(new Paragraph(line)));
      }
    }
  });
  const d = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
    sections: [{ children: body }],
  });
  saveAs(await Packer.toBlob(d), fileBase(doc, t) + ".docx");
}

export function toMarkdown(doc: PortalDocument, t: DocTemplate): string {
  const md: string[] = [`# ${doc.title}`, "", `**${STANDARD_NAME[t.standard]} · ${t.code}** — ${t.clauseRefs.join(", ")}`, ""];
  md.push(`| Document | Revision | State | Suitability | Author |`, `|---|---|---|---|---|`, `| ${doc.containerName || "—"} | ${doc.revision} | ${doc.state} | ${doc.suitability} | ${doc.author || "—"} |`, "");
  t.sections.forEach((s, i) => {
    md.push(`## ${i + 1}. ${s.title}`, "", `_${s.guidance}_`, "");
    for (const f of s.fields) {
      const v = doc.values[f.id];
      if (f.type === "table") {
        const rows = (v as string[][]) ?? [];
        md.push(`**${f.label}**`, "", `| ${f.columns!.join(" | ")} |`, `|${f.columns!.map(() => "---").join("|")}|`);
        rows.forEach((r) => md.push(`| ${r.map((c) => c.replace(/\|/g, "\\|")).join(" | ")} |`));
        md.push("");
      } else md.push(`**${f.label}:** ${String(v || "—")}`, "");
    }
  });
  return md.join("\n");
}

export function exportMarkdown(doc: PortalDocument, t: DocTemplate) {
  saveAs(new Blob([toMarkdown(doc, t)], { type: "text/markdown" }), fileBase(doc, t) + ".md");
}

export function exportCsv(name: string, header: string[], rows: string[][]) {
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  saveAs(new Blob(["﻿" + csv], { type: "text/csv" }), name + ".csv");
}
