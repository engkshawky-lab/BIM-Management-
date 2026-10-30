import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import type { BcfTopic } from "./bcf";
import { parseCsv, readBcfZip, ROW_HEADER, rowsToTopics, summarise, toCsv, topicsToRows, writeBcfZip } from "./bcfStudio";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const base = (o: Partial<BcfTopic>): BcfTopic => ({
  guid: "", type: "Issue", status: "Open", title: "", priority: "", description: "", labels: [], creationDate: "2026-10-01T09:00:00Z", creationAuthor: "alice@x.com",
  assignedTo: "", dueDate: "", components: [], comments: [], ...o,
});
const topics: BcfTopic[] = [
  base({ guid: "11111111-1111-4111-8111-111111111111", type: "Clash", title: "Duct <> beam & L2", priority: "High", status: "Open", assignedTo: "bob@x.com", dueDate: "2026-11-01",
    labels: ["MEP", "Structure"], components: ["0aaaaaaaaaaaaaaaaaaaa1", "0aaaaaaaaaaaaaaaaaaaa2"], description: "Reroute the duct",
    comments: [{ guid: "c1", date: "2026-10-02T10:00:00Z", author: "bob@x.com", text: "Will reroute" }, { guid: "c2", date: "2026-10-03T10:00:00Z", author: "alice@x.com", text: "Thanks" }] }),
  base({ guid: "22222222-2222-4222-8222-222222222222", title: "Missing door", status: "Closed", priority: "Low", labels: ["ARC"] }),
];

describe("BCF Studio zip", () => {
  it("round-trips write → read (2.1) with snapshot", async () => {
    const data = await writeBcfZip([{ ...topics[0], snapshot: PNG }, topics[1]]) as Uint8Array;
    const back = await readBcfZip(data, { snapshots: true });
    expect(back.version).toBe("2.1");
    expect(back.topics).toHaveLength(2);
    const a = back.topics.find((t) => t.guid === topics[0].guid)!;
    expect(a.title).toBe("Duct <> beam & L2");
    expect(a.status).toBe("Open");
    expect(a.type).toBe("Clash");
    expect(a.priority).toBe("High");
    expect(a.assignedTo).toBe("bob@x.com");
    expect(a.dueDate.slice(0, 10)).toBe("2026-11-01");
    expect(a.labels).toEqual(["MEP", "Structure"]);
    expect(a.components).toEqual(topics[0].components);
    expect(a.comments.map((c) => [c.author, c.text])).toEqual([["bob@x.com", "Will reroute"], ["alice@x.com", "Thanks"]]);
    expect(a.viewpointCount).toBe(1);
    expect(a.snapshot).toBe(PNG);
    const b = back.topics.find((t) => t.guid === topics[1].guid)!;
    expect(b.status).toBe("Closed");
    expect(b.snapshot).toBeUndefined();
    // snapshots are not decoded unless asked
    expect((await readBcfZip(data)).topics.every((t) => !t.snapshot)).toBe(true);
  });

  it("reads a BCF 3.0 archive (Labels/Label, Comments, ViewPoint, namespaced root)", async () => {
    const zip = new JSZip();
    zip.file("bcf.version", `<?xml version="1.0"?><Version VersionId="3.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`);
    zip.file("project.bcfp", `<?xml version="1.0"?><ProjectInfo><Project ProjectId="p1"><Name>Tower A</Name></Project></ProjectInfo>`);
    zip.file("aaaa-3/markup.bcf", `<?xml version="1.0" encoding="UTF-8"?>
<Markup xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Topic Guid="aaaa-3" TopicType="Issue" TopicStatus="Active" ServerAssignedId="12">
    <ReferenceLinks><ReferenceLink>https://example.com/1</ReferenceLink></ReferenceLinks>
    <Title>Slab edge &amp; façade gap</Title><Priority>Critical</Priority><Index>1</Index>
    <Labels><Label>Facade</Label><Label>Structure</Label></Labels>
    <CreationDate>2026-09-01T08:00:00Z</CreationDate><CreationAuthor>carol@x.com</CreationAuthor>
    <AssignedTo>dan@x.com</AssignedTo><DueDate>2026-09-15T00:00:00Z</DueDate><Description>Gap of 40 mm</Description>
    <Comments>
      <Comment Guid="k1"><Date>2026-09-02T08:00:00Z</Date><Author>dan@x.com</Author><Comment>Checking</Comment><Viewpoint Guid="v1"/></Comment>
      <Comment Guid="k2"><Date>2026-09-03T08:00:00Z</Date><Author>carol@x.com</Author><Comment>Please fix</Comment></Comment>
    </Comments>
    <Viewpoints>
      <ViewPoint Guid="v1"><Viewpoint>v1.bcfv</Viewpoint><Snapshot>v1.jpg</Snapshot></ViewPoint>
      <ViewPoint Guid="v2"><Viewpoint>v2.bcfv</Viewpoint></ViewPoint>
    </Viewpoints>
  </Topic>
</Markup>`);
    zip.file("aaaa-3/v1.bcfv", `<VisualizationInfo Guid="v1"><Components><Selection><Component IfcGuid="3abc"/></Selection></Components></VisualizationInfo>`);
    zip.file("aaaa-3/v2.bcfv", `<VisualizationInfo Guid="v2"><Components><Selection><Component IfcGuid="3abc"/><Component IfcGuid="3def"/></Selection></Components></VisualizationInfo>`);
    zip.file("aaaa-3/v1.jpg", "/9j/4AAQ", { base64: true });
    const back = await readBcfZip(await zip.generateAsync({ type: "uint8array" }), { snapshots: true });
    expect(back.version).toBe("3.0");
    expect(back.project).toBe("Tower A");
    const [t] = back.topics;
    expect(t.title).toBe("Slab edge & façade gap");
    expect(t.status).toBe("Active");
    expect(t.priority).toBe("Critical");
    expect(t.labels).toEqual(["Facade", "Structure"]);
    expect(t.assignedTo).toBe("dan@x.com");
    expect(t.creationDate).toBe("2026-09-01T08:00:00Z");
    expect(t.comments.map((c) => c.text)).toEqual(["Checking", "Please fix"]);
    expect(t.comments[0].author).toBe("dan@x.com");
    expect(t.components).toEqual(["3abc", "3def"]);
    expect(t.viewpointCount).toBe(2);
    expect(t.snapshot?.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  it("rejects an archive without markup", async () => {
    const zip = new JSZip(); zip.file("readme.txt", "hi");
    await expect(readBcfZip(await zip.generateAsync({ type: "uint8array" }))).rejects.toThrow();
  });
});

describe("issue lists", () => {
  it("topicsToRows → rowsToTopics keeps the key fields", () => {
    const rows = topicsToRows(topics);
    expect(rows[0]).toHaveLength(ROW_HEADER.length);
    const back = rowsToTopics(rows, ROW_HEADER);
    expect(back[0]).toMatchObject({ guid: topics[0].guid, title: topics[0].title, status: "Open", priority: "High", assignedTo: "bob@x.com", dueDate: "2026-11-01",
      labels: ["MEP", "Structure"], components: topics[0].components });
    expect(back[0].comments[0].text).toBe("Thanks");
  });

  it("maps header names case-insensitively and fills defaults", () => {
    const header = ["ISSUE NAME", "assignee", "Due", "Tags", "Severity", "ifc guid"];
    const rows = [["Wall clash", "eve@x.com", "45962", "ARC, MEP", "High", "g1;g2"], ["", "", "", "", "", ""], ["No status", "", "2026-12-24", "", "", ""]];
    const out = rowsToTopics(rows, header);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ title: "Wall clash", assignedTo: "eve@x.com", dueDate: "2025-11-01", labels: ["ARC", "MEP"], priority: "High", components: ["g1", "g2"], status: "Open", type: "Issue" });
    expect(out[0].guid).toMatch(/^[0-9a-f-]{36}$/);
    expect(out[0].guid).not.toBe(out[1].guid);
    expect(out[1].dueDate).toBe("2026-12-24");
  });

  it("parses and writes CSV with quotes and semicolons", () => {
    const rows = [["Title", "Description"], ["A, b", 'say "hi"\nnext']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
    expect(parseCsv("Title;Status\r\nX;Open\r\n")).toEqual([["Title", "Status"], ["X", "Open"]]);
  });
});

describe("summarise", () => {
  it("counts by status, priority, assignee, label and overdue", () => {
    const s = summarise([...topics, base({ title: "Late", dueDate: "2026-01-01", priority: "High", labels: ["MEP"] })], "2026-10-30");
    expect(s.total).toBe(3);
    expect(s.open).toBe(2);
    expect(s.closed).toBe(1);
    expect(s.overdue).toBe(1);
    expect(s.byStatus).toEqual({ Open: 2, Closed: 1 });
    expect(s.byPriority).toEqual({ High: 2, Low: 1 });
    expect(s.byAssignee).toEqual({ "bob@x.com": 1, "": 2 });
    expect(s.byLabel).toEqual({ MEP: 2, Structure: 1, ARC: 1 });
  });
});
