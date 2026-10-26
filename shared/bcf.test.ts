import { describe, expect, it } from "vitest";
import { markupToTopic, parseClashReport, topicToMarkup, viewpointXml, type BcfTopic } from "./bcf";

const topic: BcfTopic = {
  guid: "6b1e2f0a-1111-4c4c-9c9c-123456789abc", type: "Clash", status: "Open", title: "Duct <> beam at L2", priority: "High", description: "Duct clashes with beam & needs reroute",
  labels: ["MEP", "Structure"], creationDate: "2026-10-26T10:00:00Z", creationAuthor: "alice@x.com", assignedTo: "bob@x.com", dueDate: "2026-11-01",
  components: ["0aaaaaaaaaaaaaaaaaaaa1", "0aaaaaaaaaaaaaaaaaaaa2"], comments: [{ guid: "c1", date: "2026-10-26T11:00:00Z", author: "bob@x.com", text: "Will reroute" }],
};

describe("BCF", () => {
  it("round-trips a topic with escaping, labels, comments and components", () => {
    const back = markupToTopic(topicToMarkup(topic, "vp1"), viewpointXml("vp1", topic.components));
    expect(back).toEqual(topic);
  });
  it("rejects markup without a topic", () => expect(() => markupToTopic("<Markup/>")).toThrow());
});

describe("clash report", () => {
  it("maps common Navisworks columns", () => {
    const rows = [["Clash Name", "Status", "Distance", "Grid Location", "Item1 GUID", "Item2 GUID", "Item1 Name", "Item2 Name"], ["Clash1", "New", "-0.120", "C-4 : L2", "g1", "g2", "Duct", "Beam"], ["", "", "", "", "", "", "", ""]];
    expect(parseClashReport(rows)).toEqual([{ name: "Clash1", status: "New", distance: "-0.120", gridLocation: "C-4 : L2", guidA: "g1", guidB: "g2", itemA: "Duct", itemB: "Beam" }]);
  });
});
