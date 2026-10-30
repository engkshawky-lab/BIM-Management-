import { describe, expect, it } from "vitest";
import { buildModel, parseStep } from "./ifc";
import { parseIds, toRequirements } from "./ids";
import { compactForAi, disciplineOf, entityLabel, failuresToBcfTopics, groupFailures, groupTitle, runQa } from "./modelQa";

const IFC = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [ReferenceView]'),'2;1');
FILE_NAME('tiny.ifc','2026-01-01T00:00:00',('qa'),('Test Ltd'),'hand','Revit','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCPROJECT('0YvctVUKr0kugbFTf53O9L',$,'Project',$,$,$,$,$,$);
#10=IFCBUILDINGSTOREY('1YvctVUKr0kugbFTf53O9L',$,'Level 1',$,$,$,$,$,.ELEMENT.,0.);
#11=IFCBUILDINGSTOREY('1ZvctVUKr0kugbFTf53O9L',$,'Level 2',$,$,$,$,$,.ELEMENT.,3.);
#20=IFCDOOR('2YvctVUKr0kugbFTf53O9L',$,'Door A',$,$,$,$,'D1',$,$,$,$,$);
#21=IFCDOOR('3YvctVUKr0kugbFTf53O9L',$,'Door B',$,$,$,$,'D2',$,$,$,$,$);
#22=IFCDOOR('4YvctVUKr0kugbFTf53O9L',$,'Door C',$,$,$,$,'D3',$,$,$,$,$);
#30=IFCBEAM('5YvctVUKr0kugbFTf53O9L',$,'Beam 1',$,$,$,$,$,$);
#31=IFCDUCTSEGMENT('6YvctVUKr0kugbFTf53O9L',$,'Duct 1',$,$,$,$,$,$);
#40=IFCPROPERTYSINGLEVALUE('FireRating',$,IFCLABEL('EI30'),$);
#41=IFCPROPERTYSINGLEVALUE('IsExternal',$,IFCBOOLEAN(.T.),$);
#42=IFCPROPERTYSET('7YvctVUKr0kugbFTf53O9L',$,'Pset_DoorCommon',$,(#40,#41));
#43=IFCRELDEFINESBYPROPERTIES('8YvctVUKr0kugbFTf53O9L',$,$,$,(#20),#42);
#44=IFCPROPERTYSET('9YvctVUKr0kugbFTf53O9L',$,'Pset_DoorCommon',$,(#41));
#45=IFCRELDEFINESBYPROPERTIES('AYvctVUKr0kugbFTf53O9L',$,$,$,(#21),#44);
#50=IFCRELCONTAINEDINSPATIALSTRUCTURE('BYvctVUKr0kugbFTf53O9L',$,$,$,(#20,#21,#30,#31),#10);
#51=IFCRELCONTAINEDINSPATIALSTRUCTURE('CYvctVUKr0kugbFTf53O9L',$,$,$,(#22),#11);
ENDSEC;
END-ISO-10303-21;`;

const IDS = `<?xml version="1.0" encoding="UTF-8"?>
<ids xmlns="http://standards.buildingsmart.org/IDS"><info><title>Tiny IDS</title></info><specifications>
<specification name="Doors" ifcVersion="IFC4"><applicability minOccurs="0" maxOccurs="unbounded"><entity><name><simpleValue>IFCDOOR</simpleValue></name></entity></applicability>
<requirements>
<property dataType="IFCLABEL"><propertySet><simpleValue>Pset_DoorCommon</simpleValue></propertySet><baseName><simpleValue>FireRating</simpleValue></baseName><value><simpleValue>EI60</simpleValue></value></property>
<property dataType="IFCBOOLEAN"><propertySet><simpleValue>Pset_DoorCommon</simpleValue></propertySet><baseName><simpleValue>IsExternal</simpleValue></baseName></property>
</requirements></specification>
<specification name="Beams" ifcVersion="IFC4"><applicability><entity><name><simpleValue>IFCBEAM</simpleValue></name></entity></applicability>
<requirements><property><propertySet><simpleValue>Pset_BeamCommon</simpleValue></propertySet><baseName><simpleValue>LoadBearing</simpleValue></baseName></property></requirements></specification>
<specification name="Ducts" ifcVersion="IFC4"><applicability><entity><name><simpleValue>IFCDUCTSEGMENT</simpleValue></name></entity></applicability>
<requirements><attribute><name><simpleValue>Name</simpleValue></name></attribute><property><propertySet><simpleValue>Pset_DuctSegmentCommon</simpleValue></propertySet><baseName><simpleValue>Reference</simpleValue></baseName></property></requirements></specification>
<specification name="Windows" ifcVersion="IFC4"><applicability><entity><name><simpleValue>IFCWINDOW</simpleValue></name></entity></applicability>
<requirements><property><propertySet><simpleValue>Pset_WindowCommon</simpleValue></propertySet><baseName><simpleValue>FireRating</simpleValue></baseName></property></requirements></specification>
</specifications></ids>`;

const model = buildModel(parseStep(IFC));
const reqs = toRequirements(parseIds(IDS));

describe("disciplineOf", () => {
  it("guesses the discipline from the IFC class", () => {
    expect(disciplineOf("IFCDOOR")).toBe("architecture");
    expect(disciplineOf("IFCRAILING")).toBe("architecture");
    expect(disciplineOf("IFCBEAM")).toBe("structure");
    expect(disciplineOf("IFCDUCTSEGMENT")).toBe("MEP");
    expect(disciplineOf("IFCSPACEHEATER")).toBe("MEP");
    expect(disciplineOf("IFCPAVEMENT")).toBe("civil");
    expect(disciplineOf("IFCBUILDINGELEMENTPROXY")).toBe("other");
  });
});

describe("runQa", () => {
  const qa = runQa(model, reqs);
  it("checks every matched element and reports per-requirement results", () => {
    expect(reqs).toHaveLength(4);
    expect(qa.elementsChecked).toBe(5);
    expect(qa.elementsPassed).toBe(0);
    expect(qa.requirements.map((r) => [r.name, r.applicable, r.failed])).toEqual([["Doors", 3, 3], ["Beams", 1, 1], ["Ducts", 1, 1], ["Windows", 0, 0]]);
    expect(qa.checks).toBe(5);
  });
  it("carries type, storey and discipline on each failure", () => {
    const c = qa.failures.find((f) => f.name === "Door C")!;
    expect(c).toMatchObject({ type: "IFCDOOR", storey: "Level 2", discipline: "architecture", guid: "4YvctVUKr0kugbFTf53O9L" });
    expect(c.missing).toEqual(["Pset_DoorCommon.FireRating", "Pset_DoorCommon.IsExternal"]);
    expect(qa.failures.find((f) => f.name === "Duct 1")).toMatchObject({ discipline: "MEP", missing: ["Pset_DuctSegmentCommon.Reference"] });
  });

  const groups = groupFailures(qa.failures);
  it("groups by discipline, requirement and missing item", () => {
    const sig = groups.map((g) => [g.discipline, g.requirement, g.item, g.kind, g.count]);
    expect(sig).toContainEqual(["architecture", "Doors", "Pset_DoorCommon.FireRating", "missing", 2]);
    expect(sig).toContainEqual(["architecture", "Doors", 'Pset_DoorCommon.FireRating = "EI60"', "value", 1]);
    expect(sig).toContainEqual(["architecture", "Doors", "Pset_DoorCommon.IsExternal", "missing", 1]);
    expect(sig).toContainEqual(["structure", "Beams", "Pset_BeamCommon.LoadBearing", "missing", 1]);
    expect(sig).toContainEqual(["MEP", "Ducts", "Pset_DuctSegmentCommon.Reference", "missing", 1]);
    expect(groups).toHaveLength(5);
    expect(groups[0].count).toBe(2);
    expect(new Set(groups.map((g) => g.key)).size).toBe(groups.length);
    const fire = groups[0];
    expect(fire.sampleGuids).toEqual(["3YvctVUKr0kugbFTf53O9L", "4YvctVUKr0kugbFTf53O9L"]);
    expect(fire.storeys).toEqual([{ name: "Level 1", count: 1 }, { name: "Level 2", count: 1 }]);
  });
  it("keys are stable across runs", () => {
    expect(groupFailures(runQa(model, reqs).failures).map((g) => g.key)).toEqual(groups.map((g) => g.key));
  });

  it("builds readable titles", () => {
    expect(entityLabel("IFCAIRTERMINAL")).toBe("Air Terminals");
    expect(entityLabel("IFCBUILDINGSTOREY")).toBe("Building Storeys");
    expect(groupTitle(groups[0])).toBe("Doors missing Pset_DoorCommon.FireRating (2)");
    expect(groupTitle(groups.find((g) => g.kind === "value")!)).toBe('Doors with wrong Pset_DoorCommon.FireRating (expected "EI60") (1)');
  });

  it("compacts for the AI without GUIDs and within the size limit", () => {
    const c = compactForAi(groups);
    expect(c.groups).toHaveLength(5);
    expect(c.totalFailures).toBe(6);
    const json = JSON.stringify(c);
    expect(json).not.toContain("YvctVUKr0kugbFTf53O9L");
    expect(json.length).toBeLessThan(30_000);
    expect(c.groups[0]).toMatchObject({ entity: "IfcDoor", examples: ["Door B", "Door C"] });
    const many = Array.from({ length: 400 }, (_, i) => ({ ...groups[0], key: "k" + i, item: "Pset_X.Property" + "x".repeat(150) + i }));
    const big = compactForAi(many);
    expect(JSON.stringify(big).length).toBeLessThanOrEqual(30_000);
    expect(big.omitted).toBeGreaterThan(0);
  });

  it("turns groups into BCF topics", () => {
    const topics = failuresToBcfTopics(groups, { teams: { architecture: "Arch team", MEP: "MEP team" }, advice: { [groups[0].key]: { priority: "high", fix: "Map FireRating in the IFC export." } } });
    expect(topics).toHaveLength(5);
    expect(topics[0]).toMatchObject({ title: "Doors missing Pset_DoorCommon.FireRating (2)", assignedTo: "Arch team", labels: ["IDS", "architecture"], priority: "High", components: fire2() });
    expect(topics[0].description).toContain("Map FireRating");
    expect(topics.find((t) => t.labels[1] === "structure")!.assignedTo).toBe("");
    function fire2() { return ["3YvctVUKr0kugbFTf53O9L", "4YvctVUKr0kugbFTf53O9L"]; }
  });
});
