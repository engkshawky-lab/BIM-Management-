/*
 * Regression tests against real-world sample files (trimmed excerpts in ./__fixtures__) and against layouts seen in real
 * exports whose licence does not allow copying them (those fixtures are synthetic: same structure, invented values).
 *
 * Fixture sources and licences
 * - navisworks-structural-vs-mep.xml, navisworks-no-pathlink.xml: first clash results of test_data/Structural_vs_All_MEP_Grids_Working.xml
 *   and test_data/StructuralvsMEP.xml, real Navisworks Clash Detective XML exports (units="ft") from
 *   https://github.com/kgiverson/navisworks_clash_util. MIT License, Copyright (c) 2015 Kevin Iverson.
 * - navisworks-tabular-cp1252.csv: first rows of "Test 1.csv" (Navisworks tabular report saved as Windows-1252 CSV) from
 *   https://github.com/saifulkuet18-collab/Naviswork-Clash-Rank-Plugin-and-Dynamo-Script. BSD 3-Clause License,
 *   Copyright (c) 2025, saifulkuet18-collab.
 * - p6-predecessor-calendar.xer (tables trimmed), p6-predecessor-calendar.xml (Calendar block and project settings removed),
 *   msproject-task-links.xml (generated/task-links/task-links-project2019-mspdi.xml, first 9 tasks, task fields trimmed),
 *   msproject-outline.xml (legacy/sample.xml, first 9 tasks, task fields trimmed): MPXJ test data,
 *   https://github.com/joniles/mpxj/tree/master/junit/data. GNU LGPL 2.1; these excerpts are modified copies under the same licence.
 * - bcf30-due-date.bcf, bcf30-related-topics.bcf, bcf21-minimum-information.bcf, bcf20-minimum-information.bcfzip: unmodified
 *   buildingSMART BCF-XML test cases ("Test Cases/v3.0/Markup/Due Date", ".../Related topics with both topics in the same file",
 *   "Test Cases/v2.1/Markup/MinimumInformation", "Test Cases/v2.0/Markup/MinimumInformation"), https://github.com/buildingSMART/BCF-XML
 *   (branch release_3_0). (c) buildingSMART International Ltd., CC BY-ND 4.0 — copied verbatim, not adapted.
 * - navisworks-group-headers.xml: synthetic. Layout of the real grouped Navisworks exports in
 *   https://github.com/dbecher84/Navisworks_grouped_clashes_xml_to_sqlite_database (no licence, so nothing copied).
 * - navisworks-tabular-fr.html: synthetic. Layout and French headings of the real Navisworks HTML (tabular) report
 *   "Sols Vs Ossature0.html" in https://github.com/yormantbt-tech/Navisworks-BIM-4D-Report (no licence, so nothing copied).
 * - Inline XER with "2019-05 -27" and Windows-1252 currency symbols: synthetic, modelled on the real P6 6.1 export
 *   xer-parser/myschedule.xer in https://github.com/ibuilder/PHPSchedule (no licence, so nothing copied).
 * - Inline P6 XML relationships / milestones and BCF viewpoints: synthetic, following the documented schemas.
 */
import { readFileSync } from "fs";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { parseCsv, readBcfZip } from "./bcfStudio";
import { canonHeader, groupClashes, isClosedStatus, parseClashFile, parseNavisworksXml } from "./clashTriage";
import { decodeText, parseP6Xml, parseProgrammeText, parseXer, toIsoDate, xerTables } from "./programme";

const fixture = (name: string) => new Uint8Array(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url)));
const FT = 0.3048;
const latin1 = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0));
const utf16le = (s: string) => {
  const b = new Uint8Array(2 + s.length * 2);
  b[0] = 0xff; b[1] = 0xfe;
  for (let i = 0; i < s.length; i++) { b[2 + i * 2] = s.charCodeAt(i) & 255; b[3 + i * 2] = s.charCodeAt(i) >> 8; }
  return b;
};

describe("Navisworks Clash Detective XML (real exports)", () => {
  it("reads items from the path link, converts feet to metres and splits the grid location", () => {
    const cl = parseClashFile("navisworks-structural-vs-mep.xml", fixture("navisworks-structural-vs-mep.xml"));
    expect(cl).toHaveLength(2);
    const [c] = cl;
    expect(c).toMatchObject({ test: "Structural vs All MEP", name: "Clash59", status: "New", grid: "B-2", level: "Level 2" });
    expect(c.id).toBe("Structural vs All MEP#6444c275-19de-4733-a664-420911120992");
    expect(c.distance).toBeCloseTo(-0.27 * FT, 5);
    expect(c.x).toBeCloseTo(31.46 * FT, 3);
    expect(c.itemA).toMatchObject({ name: "Steel ASTM A992", layer: "Level 1", file: "Struct_2014_Grid Update 3.nwc", elementId: "129743", category: "Structural Framing" });
    expect(c.itemB).toMatchObject({ name: "Steel, Carbon", file: "PLUM_2014_Grid Update 3.nwc", elementId: "130373", category: "Pipes" });
  });

  it("does not take the geometry kind (Item Type = Solid) for a category", () => {
    const cl = parseNavisworksXml(fixture("navisworks-no-pathlink.xml"));
    expect(cl.map((c) => [c.name, c.level, c.grid])).toEqual([["Clash1", "Level 1", ""], ["Clash2", "Roof", "3-6"]]);
    expect(cl[0].itemA).toMatchObject({ name: "Steel ASTM A992", elementId: "129725", category: "" });
    expect(cl[0].itemB).toMatchObject({ name: "Rectangular Duct", elementId: "130363", category: "" });
    expect(cl[0].distance).toBeCloseTo(-1.54 * FT, 5);
  });

  it("keeps clash groups exported as headers only, and names the group of nested results", () => {
    const cl = parseNavisworksXml(fixture("navisworks-group-headers.xml"));
    // matches <summary total="4">: one group header, two grouped results, one ungrouped result, in document order
    expect(cl.map((c) => [c.name, c.status, c.group ?? ""])).toEqual([
      ["H-7 : CLEAR HEIGHT", "Active", "H-7 : CLEAR HEIGHT"],
      ["Clash7", "Reviewed", "J-5 : SPRINKLER MAINS"],
      ["Clash8", "Active", "J-5 : SPRINKLER MAINS"],
      ["Clash43", "Resolved", ""],
    ]);
    expect(cl.every((c) => c.test === "03.04 Fire Protection vs HVAC" && c.level === "LEVEL 1")).toBe(true);
    expect(cl[0]).toMatchObject({ grid: "H-7", distance: null, itemA: { elementId: "1000001" }, itemB: { elementId: "2000001" } });
    expect(groupClashes(cl).reduce((s, g) => s + g.count, 0)).toBe(4);
  });

  it("reads a text path link, <itemname>, x/y/z on <clashpoint> and ignores element names quoted in comments", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<!-- export of <clashtests>/<clashtest> with <clashresult> elements -->
<exchange units="mm"><batchtest name="B"><clashtests><clashtest name="Duct vs Beam">
  <clashresults>
    <clashresult name="Clash1" guid="g1" status="active" distance="-12">
      <clashpoint x="1000" y="2000" z="3500"/>
      <gridlocation>X2-YA : 1F</gridlocation>
      <clashobjects>
        <clashobject><layer>1F</layer><pathlink>MEP_E.rvt &gt; Cable Trays &gt; Cable Tray with Fittings &gt; CT-600x100</pathlink>
          <smarttags><smarttag><name>Category</name><value>Cable Trays</value></smarttag></smarttags></clashobject>
        <clashobject><layer>Beams</layer><itemname>Beam B1 300x500</itemname></clashobject>
      </clashobjects>
    </clashresult>
  </clashresults>
</clashtest></clashtests></batchtest></exchange>`;
    const [c] = parseNavisworksXml(xml);
    expect(c).toMatchObject({ test: "Duct vs Beam", name: "Clash1", status: "Active", distance: -0.012, x: 1, y: 2, z: 3.5, grid: "X2-YA", level: "1F" });
    expect(c.itemA).toMatchObject({ name: "CT-600x100", file: "MEP_E.rvt", category: "Cable Trays" });
    expect(c.itemB).toMatchObject({ name: "Beam B1 300x500", layer: "Beams" });
  });

  it("reads smart tags written in the Navisworks UI language", () => {
    const xml = `<exchange units="m"><batchtest name="Rapport"><clashtests><clashtest name="Gaines vs Poutres"><clashresults>
      <clashresult name="Conflit1" guid="g" status="nouveau" distance="-0.050">
        <clashobjects><clashobject>
          <objectattribute><name>ID d'élément</name><value>4242</value></objectattribute>
          <smarttags><smarttag><name>Elément Nom</name><value>Gaine rectangulaire</value></smarttag>
          <smarttag><name>Elément Type</name><value>Solide</value></smarttag></smarttags>
        </clashobject></clashobjects>
      </clashresult></clashresults></clashtest></clashtests></batchtest></exchange>`;
    const [c] = parseNavisworksXml(xml);
    expect(c).toMatchObject({ name: "Conflit1", status: "New" });
    expect(c.itemA).toMatchObject({ name: "Gaine rectangulaire", elementId: "4242", category: "" });
  });

  it("decodes UTF-16 and UTF-8-with-BOM exports from bytes", () => {
    const xml = `<?xml version="1.0" encoding="UTF-16"?><exchange units="m"><batchtest name="B"><clashtests><clashtest name="Ducts × Beams"><clashresults><clashresult name="Clash1" status="new" distance="-0.1"><resultstatus>New</resultstatus></clashresult></clashresults></clashtest></clashtests></batchtest></exchange>`;
    expect(parseClashFile("report.xml", utf16le(xml)).map((c) => [c.test, c.status, c.distance])).toEqual([["Ducts × Beams", "New", -0.1]]);
    const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(xml)]);
    expect(parseClashFile("report.xml", bom)[0].test).toBe("Ducts × Beams");
  });
});

describe("Navisworks HTML (tabular) and CSV reports", () => {
  it("reads a French HTML report: headings, test name from the summary table, statuses, element IDs and points", () => {
    const cl = parseClashFile("navisworks-tabular-fr.html", fixture("navisworks-tabular-fr.html"));
    expect(cl).toHaveLength(2);
    expect(cl.map((c) => [c.test, c.name, c.status, c.distance])).toEqual([
      ["Planchers Vs Ossature", "Conflit1", "New", -0.03],
      ["Planchers Vs Ossature", "Conflit2", "Resolved", -0.012],
    ]);
    expect(isClosedStatus(cl[1].status)).toBe(true);
    expect(cl[0]).toMatchObject({ x: -9.886, y: 6.34, z: 14.97 });
    expect(cl[0].itemA).toMatchObject({ elementId: "100001", layer: "Plateforme principale", name: "Caillebotis acier galvanisé", category: "" });
    expect(cl[0].itemB).toMatchObject({ elementId: "200001", layer: "Niveau 2", name: "Poteau acier S355" });
  });

  it("maps localised headings to the English ones", () => {
    expect(["Nom de conflit", "Etat", "Kollisionsname", "Abstand", "ID d'élément", "Calque", "Elemento 2"].map(canonHeader))
      .toEqual(["Clash Name", "Status", "Clash Name", "Distance", "Item ID", "Layer", "Item 2"]);
    expect(canonHeader("Clash Name")).toBe("Clash Name");
  });

  it("reads a Windows-1252 CSV with repeated Item ID / Layer / Item Name columns", () => {
    const cl = parseClashFile("navisworks-tabular-cp1252.csv", fixture("navisworks-tabular-cp1252.csv"), parseCsv);
    expect(cl).toHaveLength(4);
    expect(cl[0]).toMatchObject({ name: "Clash1", status: "New", distance: -0.223, grid: "2-6", level: "Level 2", x: -7.735, y: 12.612, z: 5.944 });
    expect(cl[0].itemA).toMatchObject({ elementId: "574839", layer: "Level 3", name: "Beam", category: "" });
    expect(cl[0].itemB).toMatchObject({ elementId: "1366151", layer: "Level 2", name: "Rectangular Duct" });
    expect(cl.map((c) => c.level)).toEqual(["Level 2", "Level 1", "Level 2", "Level 1"]);
  });
});

describe("Primavera P6 and MS Project programmes (real exports)", () => {
  it("reads a P6 XER export", () => {
    const acts = parseProgrammeText("p6-predecessor-calendar.xer", fixture("p6-predecessor-calendar.xer"));
    expect(acts).toEqual([{ id: "1338401", code: "A1000", name: "Test", start: "2019-06-10", finish: "2019-06-12", milestone: false, wbs: "TEST", predecessors: [], summary: false, group: "TEST PROJECT" }]);
  });

  it("reads Windows-1252 XER text and falls back from an unreadable actual date", () => {
    const xer = [
      "ERMHDR\t6.1\t2019-06-10\tProject\tadmin\tadmin\tdbxDatabaseNoName\tProject Management\tUSD",
      "%T\tCURRTYPE", "%F\tcurr_id\tcurr_symbol\tcurr_short_name",
      `%R\t13\t${String.fromCharCode(0xa3)}\tGBP`, `%R\t15\t${String.fromCharCode(0x80)}\tEUR`,
      "%T\tPROJWBS", "%F\twbs_id\twbs_short_name\twbs_name", "%R\t9\t9\tPool Finishes",
      "%T\tTASK", "%F\ttask_id\twbs_id\ttask_type\ttask_code\ttask_name\tact_start_date\tact_end_date\ttarget_start_date\ttarget_end_date",
      "%R\t1\t9\tTT_Task\tA-1030\tSubmittal prep\t2019-05 -27 00:00\t2019-06-05 00:00\t2019-05-29 09:30\t2019-06-04 14:30",
      "%R\t2\t9\tTT_FinMile\tA-1040\tSubmittal approved\t\t\t2019-06-18 17:00\t2019-06-18 17:00",
      "%R\t3\t9\tTT_Task\tA-1050\tFabrication\t\t\t2019-31-02 08:00\t2019-08-15 17:00",
      "%T\tTASKPRED", "%F\ttask_pred_id\ttask_id\tpred_task_id\tpred_type", "%R\t1\t2\t1\tPR_FS", "%R\t2\t3\t2\tPR_FS",
      "%E", "",
    ].join("\r\n");
    const text = decodeText(latin1(xer));
    expect(xerTables(text).CURRTYPE.map((r) => r.curr_symbol)).toEqual(["£", "€"]);
    const acts = parseXer(text);
    expect(acts.map((a) => [a.code, a.start, a.finish, a.milestone, a.predecessors])).toEqual([
      ["A-1030", "2019-05-27", "2019-06-05", false, []],
      ["A-1040", "2019-06-18", "2019-06-18", true, ["A-1030"]],
      ["A-1050", "", "2019-08-15", false, ["A-1040"]],
    ]);
    expect(toIsoDate("2019-05 -27 00:00")).toBe("2019-05-27");
  });

  it("reads a P6 XML export (APIBusinessObjects), which used to be rejected as MS Project XML", () => {
    const acts = parseProgrammeText("p6-predecessor-calendar.xml", fixture("p6-predecessor-calendar.xml"));
    expect(acts).toEqual([{ id: "140001", code: "A1000", name: "Test", start: "2021-02-05", finish: "2021-04-19", milestone: false, wbs: "1", predecessors: [], summary: false, group: "Test Project" }]);
  });

  it("reads P6 XML relationships, milestones and WBS summaries", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<APIBusinessObjects xmlns="http://xmlns.oracle.com/Primavera/P6/V18.1/API/BusinessObjects"><Project><ObjectId>1</ObjectId><Name>Tower</Name>
  <WBS><Code>DES</Code><Name>Design</Name><ObjectId>10</ObjectId></WBS>
  <Activity><FinishDate>2026-03-20T17:00:00</FinishDate><Id>D100</Id><Name>Stage 3 design</Name><ObjectId>100</ObjectId><StartDate>2026-01-05T08:00:00</StartDate><Type>Task Dependent</Type><WBSObjectId>10</WBSObjectId></Activity>
  <Activity><FinishDate>2026-03-20T17:00:00</FinishDate><Id>M100</Id><Name>Stage 3 sign-off</Name><ObjectId>101</ObjectId><StartDate>2026-03-20T17:00:00</StartDate><Type>Finish Milestone</Type><WBSObjectId>10</WBSObjectId></Activity>
  <Activity><FinishDate>2026-03-20T17:00:00</FinishDate><Id>S100</Id><Name>Design summary</Name><ObjectId>102</ObjectId><StartDate>2026-01-05T08:00:00</StartDate><Type>WBS Summary</Type><WBSObjectId>10</WBSObjectId></Activity>
  <Relationship><Lag>0</Lag><ObjectId>900</ObjectId><PredecessorActivityObjectId>100</PredecessorActivityObjectId><SuccessorActivityObjectId>101</SuccessorActivityObjectId><Type>Finish to Start</Type></Relationship>
</Project></APIBusinessObjects>`;
    const acts = parseP6Xml(xml);
    expect(acts.map((a) => [a.code, a.start, a.finish, a.milestone, a.summary, a.wbs, a.group, a.predecessors])).toEqual([
      ["D100", "2026-01-05", "2026-03-20", false, false, "DES", "Design", []],
      ["M100", "2026-03-20", "2026-03-20", true, false, "DES", "Design", ["D100"]],
      ["S100", "2026-01-05", "2026-03-20", false, true, "DES", "Design", []],
    ]);
  });

  it("reads MS Project XML predecessor links", () => {
    const acts = parseProgrammeText("msproject-task-links.xml", fixture("msproject-task-links.xml"));
    expect(acts).toHaveLength(8); // the project summary task (UID 0) is skipped
    expect(acts.map((a) => a.predecessors)).toEqual([[], ["1"], [], ["3"], [], ["5"], [], ["7"]]);
    expect(acts[1]).toMatchObject({ id: "2", name: "Task 2", start: "2018-10-19", finish: "2018-10-19" });
  });

  it("reads MS Project XML outline: summaries, groups and a zero-duration milestone", () => {
    const acts = parseProgrammeText("msproject-outline.xml", fixture("msproject-outline.xml"));
    expect(acts.map((a) => [a.id, a.name, a.wbs, !!a.summary, a.milestone, a.group])).toEqual([
      ["1", "First Task", "1", true, false, ""],
      ["2", "Second Task", "1.1", false, false, "First Task"],
      ["3", "Third task", "1.2", false, true, "First Task"],
      ["6", "Recurring Task", "1.3", true, false, ""],
      ["7", "Recurring Task 1", "1.3.1", false, false, "Recurring Task"],
      ["8", "Recurring Task 2", "1.3.2", false, false, "Recurring Task"],
      ["19", "Task Relationships", "3", true, false, ""],
      ["9", "Related Task 1a", "3.1", false, false, "Task Relationships"],
    ]);
    expect(acts[0]).toMatchObject({ start: "2003-01-07", finish: "2003-03-18" });
  });

  it("decodes UTF-16 MS Project XML from bytes", () => {
    const xml = `<?xml version="1.0" encoding="UTF-16"?><Project xmlns="http://schemas.microsoft.com/project"><Tasks><Task><UID>1</UID><Name>Façade design</Name><Start>2026-02-02T08:00:00</Start><Finish>2026-02-27T17:00:00</Finish><OutlineLevel>1</OutlineLevel></Task></Tasks></Project>`;
    expect(parseProgrammeText("plan.xml", utf16le(xml)).map((a) => [a.name, a.start, a.finish])).toEqual([["Façade design", "2026-02-02", "2026-02-27"]]);
  });
});

describe("buildingSMART BCF test cases", () => {
  it("reads BCF 3.0 due date and assignment", async () => {
    const f = await readBcfZip(fixture("bcf30-due-date.bcf"));
    expect(f.version).toBe("3.0");
    expect(f.project).toBe("BCF 3.0 test cases");
    expect(f.topics).toHaveLength(1);
    expect(f.topics[0]).toMatchObject({
      guid: "fffc1b9d-1f64-46ee-ad84-4fd4a0640e5f", title: "Issue that needs to be fixed by a certain date", status: "Open", type: "Error",
      creationAuthor: "Architect@example.com", assignedTo: "Architect@example.com", dueDate: "2021-03-15T11:00:00.000Z", viewpointCount: 0,
    });
  });

  it("reads two BCF 3.0 topics with comments under Topic/Comments", async () => {
    const f = await readBcfZip(fixture("bcf30-related-topics.bcf"));
    expect(f.topics.map((t) => [t.guid, t.title, t.status, t.comments.length])).toEqual([
      ["a6f801b9-6bf6-4cb9-8b89-1ae24b76074a", "Related topic B", "OPEN", 1],
      ["c69c8879-bd4a-4182-a759-f3c8c5b47c94", "Related topic", "OPEN", 0],
    ]);
    expect(f.topics[0].comments[0]).toMatchObject({ author: "Architect@example.com", date: "2017-05-22T12:12:15.621Z" });
  });

  it("reads the minimum BCF 2.1 and 2.0 archives", async () => {
    for (const [name, version, guid] of [["bcf21-minimum-information.bcf", "2.1", "ae693c83-c932-400e-8570-4a2cf45abcf3"], ["bcf20-minimum-information.bcfzip", "2.0", "9898de65-c0ce-414b-857e-1df97ffaed8d"]]) {
      const f = await readBcfZip(fixture(name));
      expect(f.version).toBe(version);
      expect(f.topics.map((t) => [t.guid, t.title, t.creationAuthor, t.creationDate])).toEqual([[guid, "Minimum information BCFZip topic.", "Developer@example.com", "2015-07-15T13:12:42Z"]]);
    }
  });

  it("keeps a document reference's description out of the topic, and takes selected components over visibility exceptions", async () => {
    const zip = new JSZip();
    zip.file("bcf.version", `<?xml version="1.0"?><Version VersionId="3.0"/>`);
    zip.file("t1/markup.bcf", `<?xml version="1.0"?><Markup><Topic Guid="t1" TopicType="Error" TopicStatus="Open"><Title>Document reference</Title>
      <CreationDate>2021-02-17T09:16:04.160Z</CreationDate><CreationAuthor>Architect@example.com</CreationAuthor>
      <DocumentReferences><DocumentReference Guid="d1"><DocumentGuid>b1</DocumentGuid><Description>ThisIsADocument.txt</Description></DocumentReference></DocumentReferences>
      <Viewpoints><ViewPoint Guid="v1"><Viewpoint>v1.bcfv</Viewpoint></ViewPoint></Viewpoints></Topic></Markup>`);
    zip.file("t1/v1.bcfv", `<VisualizationInfo Guid="v1"><Components><Selection><Component IfcGuid="0KkZ20so9BsO1d1hFcfLOl"/><Component IfcGuid="1XbKhGD91DvhOpYZbhzGTI"/></Selection>
      <Visibility DefaultVisibility="true"><Exceptions><Component IfcGuid="1bbI761TbBCOoIa5Kt6PXt"/></Exceptions></Visibility></Components></VisualizationInfo>`);
    zip.file("t2/markup.bcf", `<?xml version="1.0"?><Markup><Topic Guid="t2" TopicType="Issue" TopicStatus="Open"><Title>2.0 selection</Title><Description>Front wall</Description></Topic>
      <Viewpoints Guid="v2"><Viewpoint>viewpoint.bcfv</Viewpoint></Viewpoints></Markup>`);
    zip.file("t2/viewpoint.bcfv", `<VisualizationInfo><Components><Component IfcGuid="15E6K9CrDFb9snEtxR6WKX" Visible="true"></Component>
      <Component IfcGuid="1E8YkwPMfB$h99jtn_uAjI" Selected="true" Visible="true"></Component></Components></VisualizationInfo>`);
    zip.file("t3/markup.bcf", `<?xml version="1.0"?><Markup><Topic Guid="t3"><Title>Hidden only</Title></Topic><Viewpoints Guid="v3"><Viewpoint>viewpoint.bcfv</Viewpoint></Viewpoints></Markup>`);
    zip.file("t3/viewpoint.bcfv", `<VisualizationInfo><Components><Visibility DefaultVisibility="false"><Exceptions><Component IfcGuid="a"/><Component IfcGuid="b"/></Exceptions></Visibility></Components></VisualizationInfo>`);
    const f = await readBcfZip(await zip.generateAsync({ type: "uint8array" }));
    const by = Object.fromEntries(f.topics.map((t) => [t.guid, t]));
    expect(by.t1.description).toBe("");
    expect(by.t1.components).toEqual(["0KkZ20so9BsO1d1hFcfLOl", "1XbKhGD91DvhOpYZbhzGTI"]);
    expect(by.t2.description).toBe("Front wall");
    expect(by.t2.components).toEqual(["1E8YkwPMfB$h99jtn_uAjI"]);
    expect(by.t3.components).toEqual(["a", "b"]);
  });
});
