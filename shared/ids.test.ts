import { describe, expect, it } from "vitest";
import { requirementsFromIds } from "./ifc";
import { IDS_PRESETS, buildIds, ifcPascal, parseIds, sanitiseSpecs, toRequirements, validateIds, type IdsDoc } from "./ids";

const doc: IdsDoc = {
  info: { title: "Project X – IDS", description: "Stage 4 handover", author: "bim@example.com", version: "1.2", date: "2026-10-30", purpose: "Handover", milestone: "Stage 4", copyright: "Example Ltd" },
  specs: [
    { name: "Doors", description: "Door data", ifcVersion: ["IFC4", "IFC4X3_ADD2"], cardinality: "required", applicability: { entity: "IfcDoor", predefinedType: "DOOR" },
      requirements: [
        { kind: "classification", system: "Uniclass 2015", pattern: "Pr_[0-9]{2}(_[0-9]{2}){3}", cardinality: "required" },
        { kind: "attribute", name: "Name", cardinality: "required" },
        { kind: "property", pset: "Pset_DoorCommon", name: "FireRating", dataType: "IFCLABEL", cardinality: "required" },
        { kind: "property", pset: "Pset_DoorCommon", name: "IsExternal", dataType: "IFCBOOLEAN", value: "TRUE", cardinality: "optional" },
        { kind: "material", value: "Timber", cardinality: "prohibited" },
      ] },
    { name: "Walls", ifcVersion: ["IFC2X3"], cardinality: "optional", applicability: { entity: "IfcWall" },
      requirements: [{ kind: "property", pset: "Pset_WallCommon", name: "LoadBearing", dataType: "IFCBOOLEAN", cardinality: "required" }] },
  ],
};

/** Minimal well-formedness check: every open tag is closed in order. */
function balanced(xml: string) {
  const stack: string[] = [];
  for (const m of xml.replace(/<\?[\s\S]*?\?>/g, "").matchAll(/<(\/?)([\w:.-]+)[^>]*?(\/?)>/g)) {
    if (m[3]) continue;
    if (m[1]) { if (stack.pop() !== m[2]) return false; } else stack.push(m[2]);
  }
  return stack.length === 0;
}

describe("IDS builder", () => {
  it("round-trips build → parse", () => {
    expect(parseIds(buildIds(doc))).toEqual(doc);
  });

  it("round-trips every preset", () => {
    for (const p of IDS_PRESETS) {
      const d: IdsDoc = { info: { title: p.label }, specs: [p.spec] };
      expect(parseIds(buildIds(d))).toEqual(d);
    }
  });

  it("writes well-formed IDS 1.0 XML", () => {
    const xml = buildIds(doc);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(balanced(xml)).toBe(true);
    expect(xml).toContain('xmlns:ids="http://standards.buildingsmart.org/IDS"');
    expect(xml).toContain("http://standards.buildingsmart.org/IDS/1.0/ids.xsd");
    for (const tag of ["ids:info", "ids:title", "ids:specifications", "ids:specification", "ids:applicability", "ids:requirements", "ids:entity"]) expect(xml).toContain(`<${tag}`);
    expect(xml).toContain("<ids:simpleValue>IFCDOOR</ids:simpleValue>");
    expect(xml).toContain('ifcVersion="IFC4 IFC4X3_ADD2"');
    expect(xml).toContain('<ids:property dataType="IFCLABEL" cardinality="required">');
    expect(xml).toContain('<xs:pattern value="Pr_[0-9]{2}(_[0-9]{2}){3}"/>');
    expect(xml).toContain('<ids:applicability minOccurs="0" maxOccurs="unbounded">');
    // info children in schema order
    const order = ["title", "copyright", "version", "description", "author", "date", "purpose", "milestone"].map((t) => xml.indexOf(`<ids:${t}>`));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // facets in schema order even when authored out of order
    const shuffled = buildIds({ info: { title: "t" }, specs: [{ ...doc.specs[0], requirements: [...doc.specs[0].requirements].reverse() }] });
    expect(shuffled.indexOf("<ids:classification")).toBeLessThan(shuffled.indexOf("<ids:attribute"));
    expect(shuffled.indexOf("<ids:property")).toBeLessThan(shuffled.indexOf("<ids:material"));
  });

  it("escapes special characters", () => {
    const d: IdsDoc = { info: { title: `A & B <"quoted"> 'x'` }, specs: [{ name: `R&D "lab" <1>`, description: "a<b & c>d", ifcVersion: ["IFC4"], cardinality: "required", applicability: { entity: "IfcSpace" },
      requirements: [{ kind: "attribute", name: "LongName", value: "Café & <Bar>", cardinality: "required" }, { kind: "property", pset: "Pset_X", name: "Y", pattern: `[^"<>&]+`, cardinality: "required" }] }] };
    const xml = buildIds(d);
    expect(xml).toContain("<ids:title>A &amp; B &lt;&quot;quoted&quot;&gt; &apos;x&apos;</ids:title>");
    expect(xml).toContain('name="R&amp;D &quot;lab&quot; &lt;1&gt;"');
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
    expect(balanced(xml)).toBe(true);
    expect(parseIds(xml)).toEqual(d);
  });

  it("drops author/date that the schema would reject and warns", () => {
    const d: IdsDoc = { info: { title: "t", author: "Jane", date: "30/10/2026" }, specs: [] };
    const xml = buildIds(d);
    expect(xml).not.toContain("<ids:author>");
    expect(xml).not.toContain("<ids:date>");
    expect(validateIds(d).map((i) => i.message).join(" ")).toMatch(/e-mail.*YYYY-MM-DD.*at least one/s);
  });

  it("validation flags empty names, no requirements and bad patterns", () => {
    const issues = validateIds({ info: { title: "t" }, specs: [{ name: "", ifcVersion: ["IFC4"], applicability: { entity: "IfcWall" }, requirements: [] },
      { name: "x", ifcVersion: ["IFC4"], applicability: { entity: "IfcWall" }, requirements: [{ kind: "attribute", name: "Name", pattern: "([a-z", cardinality: "required" }] }] });
    const msgs = issues.map((i) => i.message);
    expect(msgs).toContain("Specification has no name.");
    expect(msgs).toContain("Specification has no requirements.");
    expect(msgs.some((m) => m.includes("invalid pattern"))).toBe(true);
  });

  it("toRequirements matches requirementsFromIds on the built XML", () => {
    const simple: IdsDoc = { info: { title: "t" }, specs: [
      { name: "Doors", ifcVersion: ["IFC4"], cardinality: "required", applicability: { entity: "IfcDoor" }, requirements: [
        { kind: "attribute", name: "Name", cardinality: "required" },
        { kind: "property", pset: "Pset_DoorCommon", name: "FireRating", cardinality: "required" },
        { kind: "property", pset: "Pset_DoorCommon", name: "IsExternal", value: "TRUE", cardinality: "required" }] },
      { name: "Spaces", ifcVersion: ["IFC4"], cardinality: "required", applicability: { entity: "IfcSpace" }, requirements: [{ kind: "attribute", name: "LongName", cardinality: "required" }] },
    ] };
    const fromXml = requirementsFromIds(buildIds(simple)).requirements;
    const mine = toRequirements(simple);
    expect(mine.map((r) => [r.entity, r.name, r.attributes])).toEqual(fromXml.map((r) => [r.entity, r.name, r.attributes]));
    expect(mine.map((r) => r.properties)).toEqual(fromXml.map((r) => r.properties.map((p) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)))));
    expect(mine[0]).toMatchObject({ source: "IDS", entity: "IFCDOOR", properties: [{ pset: "Pset_DoorCommon", property: "FireRating" }, { pset: "Pset_DoorCommon", property: "IsExternal", value: "TRUE" }] });
  });

  it("entity lists become an enumeration and one requirement per class", () => {
    const d: IdsDoc = { info: { title: "t" }, specs: [{ name: "Elements", ifcVersion: ["IFC4"], cardinality: "required", applicability: { entity: "IfcWall|IfcSlab" }, requirements: [{ kind: "classification", cardinality: "required" }] }] };
    const xml = buildIds(d);
    expect(xml).toContain('<xs:enumeration value="IFCWALL"/>');
    expect(parseIds(xml)).toEqual(d);
    expect(toRequirements(d).map((r) => r.entity)).toEqual(["IFCWALL", "IFCSLAB"]);
  });

  it("parses typical third-party IDS (default namespace, no prefixes)", () => {
    const xml = `<?xml version="1.0"?>
<ids xmlns="http://standards.buildingsmart.org/IDS" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <!-- comment -->
  <info><title>Real &amp; file</title><author>a@b.com</author></info>
  <specifications>
    <specification name="Windows" ifcVersion="IFC4" description="desc">
      <applicability minOccurs="1" maxOccurs="unbounded"><entity><name><simpleValue>IFCWINDOW</simpleValue></name></entity></applicability>
      <requirements>
        <property dataType="IfcLabel" cardinality="required"><propertySet><simpleValue>Pset_WindowCommon</simpleValue></propertySet><baseName><simpleValue>FireRating</simpleValue></baseName>
          <value><xs:restriction base="xs:string"><xs:enumeration value="EI30"/><xs:enumeration value="EI60"/></xs:restriction></value></property>
        <attribute cardinality="optional"><name><simpleValue>Description</simpleValue></name></attribute>
        <partOf relation="IFCRELAGGREGATES"><entity><name><simpleValue>IFCBUILDING</simpleValue></name></entity></partOf>
      </requirements>
    </specification>
  </specifications>
</ids>`;
    const d = parseIds(xml);
    expect(d.info).toEqual({ title: "Real & file", author: "a@b.com" });
    expect(d.specs[0]).toEqual({ name: "Windows", description: "desc", ifcVersion: ["IFC4"], cardinality: "required", applicability: { entity: "IfcWindow" }, requirements: [
      { kind: "property", pset: "Pset_WindowCommon", name: "FireRating", dataType: "IFCLABEL", pattern: "EI30|EI60", cardinality: "required" },
      { kind: "attribute", name: "Description", cardinality: "optional" },
    ] });
  });

  it("normalises entity names and sanitises AI output", () => {
    expect(ifcPascal("IFCBUILDINGSTOREY")).toBe("IfcBuildingStorey");
    expect(ifcPascal("ifcdoor")).toBe("IfcDoor");
    expect(ifcPascal("Wall")).toBe("IfcWall");
    const specs = sanitiseSpecs([
      { name: "x".repeat(500), ifcVersion: ["ifc4", "IFC4X3", "IFC5"], applicability: { entity: "IFCDOOR", predefinedType: "fire exit" },
        requirements: [{ kind: "property", pset: "Pset_DoorCommon", name: "FireRating", dataType: "label", cardinality: "MUST" }, { kind: "bogus" }, { kind: "attribute", name: "Name", pattern: "([" }] },
      { name: "no entity", applicability: {} }, "junk",
    ]);
    expect(specs).toHaveLength(1);
    expect(specs[0].name).toHaveLength(200);
    expect(specs[0].ifcVersion).toEqual(["IFC4", "IFC4X3_ADD2"]);
    expect(specs[0].applicability).toEqual({ entity: "IfcDoor", predefinedType: "FIREEXIT" });
    expect(specs[0].requirements).toEqual([
      { kind: "property", pset: "Pset_DoorCommon", name: "FireRating", dataType: "IFCLABEL", cardinality: "required" },
      { kind: "attribute", name: "Name", cardinality: "required" },
    ]);
  });
});
