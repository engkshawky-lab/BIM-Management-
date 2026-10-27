import { Packer } from "docx";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { markdownToDocx } from "./mdDocx";

describe("markdownToDocx", () => {
  it("writes headings, tables, bold runs and lists into a valid Word file", async () => {
    const md = "# EIR\n\n| Field | Value |\n|---|---|\n| Revision | P01 \\| draft |\n\n## 1 Introduction\n\nSome **bold** text.\n- bullet\n1. step";
    const zip = await JSZip.loadAsync(await Packer.toBuffer(markdownToDocx(md)));
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("Introduction");
    expect(xml).toContain("<w:tbl>");
    expect(xml).toContain("P01 | draft");
    expect(xml).toMatch(/<w:b\/>.*bold/s);
    expect(xml).not.toContain("---");
  });
});
