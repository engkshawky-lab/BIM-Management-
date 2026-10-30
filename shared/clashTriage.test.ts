import { describe, expect, it } from "vitest";
import { parseCsv } from "./bcfStudio";
import {
  agendaMarkdown, compactGroups, disciplineOf, groupClashes, parseClashFile, parseCsvClashes, parseLength, parseNavisworksHtml, parseNavisworksXml,
  parsePoint, sanitiseTriage, splitGrid, suggestTriage, toBcfTopics, toRows, totals, type Clash, type ClashItem,
} from "./clashTriage";

const obj = (id: string, layer: string, file: string, name: string, cat: string, guid: string) => `
  <clashobject>
    <objectattribute><name>Element ID</name><value>${id}</value></objectattribute>
    <layer>${layer}</layer>
    <pathlink><node>File</node><node>${file}</node><node>${layer}</node><node>${cat}</node><node>${name}</node></pathlink>
    <smarttags>
      <smarttag><name>Item Name</name><value>${name}</value></smarttag>
      <smarttag><name>Item GUID</name><value>${guid}</value></smarttag>
    </smarttags>
  </clashobject>`;

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<exchange xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" units="m" filename="Federated.nwd">
 <batchtest name="Report" internal_name="Report" units="m">
  <clashtests>
   <clashtest name="MEP vs STR" test_type="hard" status="old" tolerance="0.010">
    <clashresults>
     <clashresult name="Clash1" guid="aaa-1" status="new" distance="-0.120">
      <description>Hard</description>
      <gridlocation>C-4 : Level 3</gridlocation>
      <clashpoint><pos3f x="10.000" y="5.000" z="9.500"/></clashpoint>
      <clashobjects>${obj("1001", "Level 3", "PRJ-ABC-ZZ-03-M3-M-0001.nwc", "Rect Duct 600x400", "Ducts", "1aB2cD3eF4gH5iJ6kL7mN8")}${obj("2001", "Level 3", "PRJ-ABC-ZZ-03-M3-S-0001.nwc", "Transfer Beam TB1", "Structural Framing", "2aB2cD3eF4gH5iJ6kL7mN8")}</clashobjects>
     </clashresult>
     <clashgroup name="Group A" status="active">
      <clashresults>
       <clashresult name="Clash2" guid="aaa-2" status="active" distance="-0.080">
        <gridlocation>C-5 : Level 3</gridlocation>
        <clashpoint><pos3f x="10.800" y="5.200" z="9.500"/></clashpoint>
        <clashobjects>${obj("1002", "Level 3", "PRJ-ABC-ZZ-03-M3-M-0001.nwc", "Rect Duct 600x400", "Ducts", "3aB2cD3eF4gH5iJ6kL7mN8")}${obj("2001", "Level 3", "PRJ-ABC-ZZ-03-M3-S-0001.nwc", "Transfer Beam TB1", "Structural Framing", "2aB2cD3eF4gH5iJ6kL7mN8")}</clashobjects>
       </clashresult>
      </clashresults>
     </clashgroup>
     <clashresult name="Clash3" guid="aaa-3" status="approved" distance="-0.005">
      <gridlocation>F-1 : Level 3</gridlocation>
      <clashpoint><pos3f x="40" y="30" z="9.5"/></clashpoint>
      <clashobjects>${obj("1003", "Level 3", "PRJ-ABC-ZZ-03-M3-M-0001.nwc", "Rect Duct 300x200", "Ducts", "4aB2cD3eF4gH5iJ6kL7mN8")}${obj("2002", "Level 3", "PRJ-ABC-ZZ-03-M3-S-0001.nwc", "Beam B7", "Structural Framing", "5aB2cD3eF4gH5iJ6kL7mN8")}</clashobjects>
     </clashresult>
    </clashresults>
   </clashtest>
   <clashtest name="MEP vs STR (repeat)" test_type="hard">
    <clashresults>
     <clashresult name="Clash1" guid="bbb-1" status="new" distance="-0.120">
      <gridlocation>C-4 : Level 3</gridlocation>
      <clashpoint><pos3f x="10.000" y="5.000" z="9.500"/></clashpoint>
      <clashobjects>${obj("1001", "Level 3", "PRJ-ABC-ZZ-03-M3-M-0001.nwc", "Rect Duct 600x400", "Ducts", "1aB2cD3eF4gH5iJ6kL7mN8")}${obj("2001", "Level 3", "PRJ-ABC-ZZ-03-M3-S-0001.nwc", "Transfer Beam TB1", "Structural Framing", "2aB2cD3eF4gH5iJ6kL7mN8")}</clashobjects>
     </clashresult>
    </clashresults>
   </clashtest>
  </clashtests>
 </batchtest>
</exchange>`;

const HTML = `<html><head><title>Clash Report</title></head><body>
<h2>ARC vs PLU</h2>
<table>
 <tr><th>Image</th><th>Clash Name</th><th>Status</th><th>Distance</th><th>Grid Location</th><th>Clash Point</th><th colspan="3">Item 1</th><th colspan="3">Item 2</th></tr>
 <tr><td></td><td></td><td></td><td></td><td></td><td></td><td>Item ID</td><td>Layer</td><td>Item Name</td><td>Item ID</td><td>Layer</td><td>Item Name</td></tr>
 <tr><td><img src="a.jpg"/></td><td>Clash1</td><td>New</td><td>-0.045 m</td><td>B-2 : Level 1</td><td>x:1.000 m, y:2.000 m, z:3.000 m</td><td>Element ID: 501</td><td>Level 1</td><td>Basic Wall</td><td>Element ID: 601</td><td>Level 1</td><td>Sanitary Pipe &amp; Fittings</td></tr>
 <tr><td></td><td>Clash2</td><td>Active</td><td>-30 mm</td><td>B-3 : Level 1</td><td>x:1.500 m, y:2.200 m, z:3.000 m</td><td>Element ID: 502</td><td>Level 1</td><td>Basic Wall</td><td>Element ID: 602</td><td>Level 1</td><td>Sanitary Pipe</td></tr>
</table></body></html>`;

const HTML_DUP_HEADERS = `<table><tr><td>Test name</td><td>STR vs FP</td></tr></table>
<table><tr><th>Name</th><th>Status</th><th>Distance</th><th>Item ID</th><th>Item Name</th><th>Item ID</th><th>Item Name</th></tr>
<tr><td>C1</td><td>New</td><td>-0.1</td><td>11</td><td>Column C1</td><td>22</td><td>Sprinkler Pipe</td></tr></table>`;

const CSV = `Clash Name,Status,Distance,Grid Location,Level,Item1 Name,Item1 Category,Item1 GUID,Item2 Name,Item2 Category,Item2 GUID,Clash Point
C-01,Active,-0.150,A-1,Level 2,Cable Tray,Cable Trays,g1,Beam,Structural Framing,g2,"10, 10, 6"
C-02,New,-0.140,A-1,Level 2,Cable Tray,Cable Trays,g3,Beam,Structural Framing,g2,"10.5, 10.2, 6"
C-03,New,-0.010,D-4,Level 2,Cable Tray,Cable Trays,g4,Beam,Structural Framing,g5,"50, 50, 6"`;

describe("parseNavisworksXml", () => {
  const cs = parseNavisworksXml(XML, "fed.xml");
  it("reads every clashresult including those inside clash groups", () => {
    expect(cs.map((c) => c.name)).toEqual(["Clash1", "Clash2", "Clash3", "Clash1"]);
    expect(cs[0].test).toBe("MEP vs STR");
    expect(cs[3].test).toBe("MEP vs STR (repeat)");
    expect(new Set(cs.map((c) => c.id)).size).toBe(4);
  });
  it("reads status, distance, grid, level, point and items", () => {
    const c = cs[0];
    expect(c.status).toBe("New");
    expect(c.distance).toBeCloseTo(-0.12);
    expect(c.grid).toBe("C-4");
    expect(c.level).toBe("Level 3");
    expect([c.x, c.y, c.z]).toEqual([10, 5, 9.5]);
    expect(c.itemA).toMatchObject({ name: "Rect Duct 600x400", layer: "Level 3", file: "PRJ-ABC-ZZ-03-M3-M-0001.nwc", elementId: "1001", guid: "1aB2cD3eF4gH5iJ6kL7mN8", category: "Ducts" });
    expect(c.itemB.category).toBe("Structural Framing");
    expect(cs[2].status).toBe("Approved");
  });
  it("converts units to metres", () => {
    const mm = parseNavisworksXml(XML.replace('units="m" filename', 'units="mm" filename'));
    expect(mm[0].x).toBeCloseTo(0.01);
    expect(mm[0].distance).toBeCloseTo(-0.00012);
  });
});

describe("parseNavisworksHtml", () => {
  it("reads the tabular report with Item 1 / Item 2 spans", () => {
    const cs = parseNavisworksHtml(HTML);
    expect(cs).toHaveLength(2);
    expect(cs[0]).toMatchObject({ test: "ARC vs PLU", name: "Clash1", status: "New", grid: "B-2", level: "Level 1" });
    expect(cs[0].distance).toBeCloseTo(-0.045);
    expect(cs[1].distance).toBeCloseTo(-0.03);
    expect([cs[0].x, cs[0].y, cs[0].z]).toEqual([1, 2, 3]);
    expect(cs[0].itemA).toMatchObject({ elementId: "501", layer: "Level 1", name: "Basic Wall" });
    expect(cs[0].itemB.name).toBe("Sanitary Pipe & Fittings");
  });
  it("splits repeated headers and takes the test name from a key/value table", () => {
    const cs = parseNavisworksHtml(HTML_DUP_HEADERS);
    expect(cs).toHaveLength(1);
    expect(cs[0]).toMatchObject({ test: "STR vs FP", name: "C1" });
    expect(cs[0].itemA).toMatchObject({ elementId: "11", name: "Column C1" });
    expect(cs[0].itemB).toMatchObject({ elementId: "22", name: "Sprinkler Pipe" });
  });
});

describe("parseCsvClashes", () => {
  it("reads common columns and the clash point", () => {
    const cs = parseCsvClashes(parseCsv(CSV), "Tray vs STR");
    expect(cs).toHaveLength(3);
    expect(cs[0]).toMatchObject({ test: "Tray vs STR", name: "C-01", status: "Active", grid: "A-1", level: "Level 2", x: 10, y: 10, z: 6 });
    expect(cs[0].itemA).toMatchObject({ name: "Cable Tray", category: "Cable Trays", guid: "g1" });
    expect(cs[0].itemB.guid).toBe("g2");
  });
  it("falls back to parseClashReport column names and skips preamble rows", () => {
    const rows = [["Exported from Solibri"], ["Clash Name", "Status", "Item1 GUID", "Item2 GUID", "Item 1", "Item 2"], ["X1", "Open", "ga", "gb", "Door", "Pipe"]];
    const [c] = parseCsvClashes(rows);
    expect(c).toMatchObject({ name: "X1", status: "Open" });
    expect(c.itemA).toMatchObject({ guid: "ga", name: "Door" });
    expect(c.itemB).toMatchObject({ guid: "gb", name: "Pipe" });
  });
  it("sniffs formats", () => {
    expect(parseClashFile("a.xml", XML)).toHaveLength(4);
    expect(parseClashFile("a.html", HTML)).toHaveLength(2);
    expect(parseClashFile("a.csv", CSV, parseCsv)).toHaveLength(3);
  });
});

describe("helpers", () => {
  it("parses lengths, points and grid locations", () => {
    expect(parseLength("-85 mm")).toBeCloseTo(-0.085);
    expect(parseLength("−0,25 m")).toBeCloseTo(-0.25);
    expect(parseLength("1 ft")).toBeCloseTo(0.3048);
    expect(parseLength("")).toBeNull();
    expect(parsePoint("x:1 m, y:-2 m, z:3000 mm")).toEqual({ x: 1, y: -2, z: 3 });
    expect(splitGrid("C-4 : Level 3")).toEqual({ grid: "C-4", level: "Level 3" });
    expect(splitGrid("C-4")).toEqual({ grid: "C-4", level: "" });
  });
  it("guesses disciplines from ISO 19650 file names, layers and categories", () => {
    expect(disciplineOf("PRJ-ABC-ZZ-03-M3-S-0001.nwc")).toBe("STR");
    expect(disciplineOf("PRJ-ABC-ZZ-03-M3-M-0001.nwc")).toBe("MEC");
    expect(disciplineOf("Tower_FP_L03.nwc")).toBe("FP");
    expect(disciplineOf("", "Sprinklers")).toBe("FP");
    expect(disciplineOf("Cable Trays")).toBe("ELE");
    expect(disciplineOf("Ducts")).toBe("MEC");
    expect(disciplineOf("Sanitary Pipe")).toBe("PLU");
    expect(disciplineOf("Structural Framing")).toBe("STR");
    expect(disciplineOf("Basic Wall")).toBe("ARC");
    expect(disciplineOf("Road kerb")).toBe("CIV");
    expect(disciplineOf("", "zzz")).toBe("");
  });
  it("totals by test, status and level", () => {
    const tt = totals(parseNavisworksXml(XML));
    expect(tt.total).toBe(4);
    expect(tt.byTest[0]).toEqual(["MEP vs STR", 3]);
    expect(tt.byLevel).toEqual([["Level 3", 4]]);
  });
});

describe("groupClashes", () => {
  const cs = parseNavisworksXml(XML);
  it("puts every clash in exactly one group, duplicates first", () => {
    const gs = groupClashes(cs);
    expect(gs.reduce((n, g) => n + g.count, 0)).toBe(cs.length);
    expect(new Set(gs.flatMap((g) => g.clashIds)).size).toBe(cs.length);
    const dup = gs.find((g) => g.kind === "duplicate")!;
    expect(dup.count).toBe(2);
    expect([...dup.tests].sort()).toEqual(["MEP vs STR", "MEP vs STR (repeat)"]);
  });
  it("clusters nearby clashes on the same level and category pair", () => {
    const gs = groupClashes(cs, { duplicates: false });
    const cl = gs.find((g) => g.kind === "cluster")!;
    expect(cl.count).toBe(3);
    expect(cl.levels).toEqual(["Level 3"]);
    expect(cl.disciplines).toEqual(["MEC", "STR"]);
    expect(cl.maxPenetration).toBeCloseTo(0.12);
    const pair = gs.find((g) => g.kind === "pair")!;
    expect(pair.count).toBe(1);
    expect(pair.label).toBe("Ducts × Structural Framing on Level 3");
  });
  it("respects the cluster distance and is deterministic", () => {
    const tight = groupClashes(cs, { duplicates: false, clusterDistance: 0.5 });
    expect(tight.find((g) => g.kind === "cluster")?.count).toBe(2);
    expect(groupClashes([...cs].reverse()).map((g) => g.key)).toEqual(groupClashes(cs).map((g) => g.key));
    expect(groupClashes(cs, { clusterDistance: 0, duplicates: false }).map((g) => g.kind)).toEqual(["pair"]);
  });
  it("handles clashes without points or categories", () => {
    const it0: ClashItem = { name: "", layer: "", file: "", guid: "", elementId: "", category: "" };
    const c = (id: string): Clash => ({ id, test: "T", name: id, status: "", distance: null, grid: "", level: "", x: null, y: null, z: null, itemA: it0, itemB: it0 });
    const gs = groupClashes([c("a"), c("b")]);
    expect(gs).toHaveLength(1);
    expect(gs[0]).toMatchObject({ kind: "pair", count: 2, maxPenetration: null, centroid: null });
  });
});

describe("triage and exports", () => {
  const cs = parseNavisworksXml(XML);
  const gs = groupClashes(cs);
  it("compacts groups for the AI", () => {
    const cg = compactGroups(gs, 1);
    expect(cg).toHaveLength(1);
    expect(cg[0].sample.length).toBeLessThanOrEqual(3);
    expect(cg[0]).not.toHaveProperty("clashIds");
  });
  it("sanitises the AI answer", () => {
    const res = sanitiseTriage({
      summary: "Ducts under transfer beam.",
      groups: [
        { key: gs[0].key, rootCause: "Duct below transfer beam", responsible: "mep", priority: "critical", falsePositive: false, action: "Re-route" },
        { key: gs[0].key, rootCause: "dup" }, { key: "nope", rootCause: "x" }, { key: gs[1].key, responsible: "Nobody", priority: "Urgent", falsePositive: "true" },
      ],
      patterns: ["Ducts not coordinated with beams", 3],
    }, gs.map((g) => g.key), ["ARC", "STR", "MEP"]);
    expect(res.groups).toHaveLength(2);
    expect(res.groups[0]).toMatchObject({ responsible: "MEP", priority: "Critical", falsePositive: false });
    expect(res.groups[1]).toMatchObject({ responsible: "", priority: "Normal", falsePositive: true });
    expect(res.patterns).toEqual(["Ducts not coordinated with beams", "3"]);
  });
  it("suggests a rule-of-thumb triage", () => {
    const cl = groupClashes(cs, { duplicates: false }).find((g) => g.kind === "cluster")!;
    expect(suggestTriage(cl, ["ARC", "STR", "MEP"])).toMatchObject({ responsible: "MEP", priority: "High", falsePositive: false });
  });
  it("builds BCF topics with all GUIDs, spreadsheet rows and the agenda", () => {
    const triage = { [gs[0].key]: { key: gs[0].key, rootCause: "Duct below transfer beam on Level 3", responsible: "MEP", priority: "Critical" as const, falsePositive: false, action: "Re-route above" } };
    const topics = toBcfTopics(gs, triage, cs, { date: "2026-01-01T00:00:00Z" });
    expect(topics).toHaveLength(gs.length);
    expect(topics[0]).toMatchObject({ title: "Duct below transfer beam on Level 3", priority: "Critical", assignedTo: "MEP", type: "Clash" });
    const all = new Set(cs.flatMap((c) => [c.itemA.guid, c.itemB.guid]));
    expect(new Set(topics.flatMap((t) => t.components))).toEqual(all);
    const rows = toRows(gs, triage, cs);
    expect(rows.groups).toHaveLength(gs.length + 1);
    expect(rows.clashes).toHaveLength(cs.length + 1);
    expect(rows.clashes.slice(1).every((r) => r[0])).toBe(true);
    const md = agendaMarkdown(gs, triage, { summary: "S", patterns: ["P1"], date: "2026-01-01" });
    expect(md).toContain("### Critical (1)");
    expect(md).toContain("### MEP");
    expect(md).toContain("- P1");
  });
});
