import { Packer } from "docx";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { markdownToDocx } from "./mdDocx";

const xmlOf = async (doc: ReturnType<typeof markdownToDocx>) => (await JSZip.loadAsync(await Packer.toBuffer(doc))).file("word/document.xml")!.async("string");

describe("markdownToDocx", () => {
  it("writes headings, tables, bold runs and lists into a valid Word file", async () => {
    const md = "# EIR\n\n| Field | Value |\n|---|---|\n| Revision | P01 \\| draft |\n\n## 1 Introduction\n\nSome **bold** text.\n- bullet\n1. step";
    const xml = await xmlOf(markdownToDocx(md));
    expect(xml).toContain("Introduction");
    expect(xml).toContain("<w:tbl>");
    expect(xml).toContain("P01 | draft");
    expect(xml).toMatch(/<w:b\/>.*bold/s);
    expect(xml).not.toContain("---");
  });

  it("adds a cover page, document control and contents, and highlights placeholders", async () => {
    const xml = await xmlOf(markdownToDocx("# Information Protocol\n\n## 1 Scope\n\nOwner: [CONFIRM]\n\n> Draft only.", { title: "Information Protocol", project: "Riverside Clinic", reference: "RC-IP-0001", revision: "P01" }));
    expect(xml).toContain("Riverside Clinic");
    expect(xml).toContain("Document control");
    expect(xml).toContain("RC-IP-0001");
    expect(xml).toMatch(/w:highlight w:val="yellow"/);
    expect(xml).toContain("Draft only.");
    // the document title is on the cover, not repeated as the first heading
    expect(xml.match(/Information Protocol/g)!.length).toBe(1);
  });
});
