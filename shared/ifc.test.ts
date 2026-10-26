import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { analyseIfc, buildModel, checkRequirements, parseArgs, parseStep, requirementsFromIds, requirementsFromLoin } from "./ifc";

const RICH = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [ReferenceView]'),'2;1');
FILE_NAME('tower.ifc','2026-10-01T10:00:00',('K. Shawky'),('First Option'),'IfcOpenShell','Revit 2027','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);
#2=IFCUNITASSIGNMENT((#1));
#8=IFCPROJECT('0YvctVUKr0kugbFTf53O9L',$,'Tower; A',$,$,$,$,$,#2);
#10=IFCSITE('1hqIFTRjfV6AWq_bMtnZwI',$,'Site',$,$,$,$,$,.ELEMENT.,(30,2,0),(31,14,0),0.,$,$);
#11=IFCBUILDING('2hqIFTRjfV6AWq_bMtnZwI',$,'Tower',$,$,$,$,$,.ELEMENT.,$,$,$);
#12=IFCBUILDINGSTOREY('3hqIFTRjfV6AWq_bMtnZwI',$,'Level 01',$,$,$,$,$,.ELEMENT.,3500.);
#20=IFCDOOR('0aaaaaaaaaaaaaaaaaaaa1',$,'D-01 Caf\\X2\\00E9\\X0\\',$,$,$,$,'T1',2100.,900.,$,$,$);
#21=IFCDOOR('0aaaaaaaaaaaaaaaaaaaa2',$,'Default',$,$,$,$,$,2100.,900.,$,$,$);
#22=IFCWALLSTANDARDCASE('0aaaaaaaaaaaaaaaaaaaa3',$,'W-01',$,$,$,$,$,$);
#23=IFCWALL('0aaaaaaaaaaaaaaaaaaaa3',$,'W-02',$,$,$,$,$,$);
#30=IFCPROPERTYSINGLEVALUE('FireRating',$,IFCLABEL('FD30'),$);
#31=IFCPROPERTYSINGLEVALUE('IsExternal',$,IFCBOOLEAN(.F.),$);
#32=IFCPROPERTYSET('1aaaaaaaaaaaaaaaaaaaa1',$,'Pset_DoorCommon',$,(#30,#31));
#33=IFCRELDEFINESBYPROPERTIES('1aaaaaaaaaaaaaaaaaaaa2',$,$,$,(#20),#32);
#40=IFCPROPERTYSINGLEVALUE('Manufacturer',$,IFCLABEL('Acme'),$);
#41=IFCPROPERTYSINGLEVALUE('ModelReference',$,IFCLABEL('AX-9'),$);
#42=IFCPROPERTYSET('1aaaaaaaaaaaaaaaaaaaa3',$,'Pset_ManufacturerTypeInformation',$,(#40,#41));
#43=IFCDOORTYPE('1aaaaaaaaaaaaaaaaaaaa4',$,'Single 900',$,$,(#42),$,$,$,.DOOR.,.SINGLE_SWING_LEFT.,$,$);
#44=IFCRELDEFINESBYTYPE('1aaaaaaaaaaaaaaaaaaaa5',$,$,$,(#20,#21),#43);
#50=IFCCLASSIFICATION('NBS',$,$,'Uniclass 2015',$,$,$);
#51=IFCCLASSIFICATIONREFERENCE($,'Pr_30_59_24',' Doorsets',#50,$,$);
#52=IFCRELASSOCIATESCLASSIFICATION('1aaaaaaaaaaaaaaaaaaaa6',$,$,$,(#20,#21,#22),#51);
#60=IFCRELCONTAINEDINSPATIALSTRUCTURE('1aaaaaaaaaaaaaaaaaaaa7',$,$,$,(#20,#21,#22),#12);
ENDSEC;
END-ISO-10303-21;`;

describe("STEP parsing", () => {
  it("parses values", () => {
    expect(parseArgs("'a''b',$,*,#12,(1.,2.5E2),.T.,.ELEMENT.,IFCLABEL('x')")).toEqual([
      "a'b", null, "*", { ref: 12 }, [1, 250], true, { enum: "ELEMENT" }, { type: "IFCLABEL", value: "x" },
    ]);
  });
  it("reads header, unicode escapes and strings containing ';'", () => {
    const f = parseStep(RICH);
    expect(f.header).toMatchObject({ schema: ["IFC4"], author: ["K. Shawky"], organization: ["First Option"], originatingSystem: "Revit 2027" });
    expect(f.errors).toEqual([]);
    const m = buildModel(f);
    expect(m.elements.find((e) => e.guid.endsWith("1"))!.name).toBe("D-01 Café");
    expect(f.entities.get(8)!.args[2]).toBe("Tower; A");
  });
  it("merges type and instance property sets, classification and containment", () => {
    const m = buildModel(parseStep(RICH));
    const d1 = m.elements.find((e) => e.name.startsWith("D-01"))!;
    expect(d1.psets.Pset_DoorCommon).toEqual({ FireRating: "FD30", IsExternal: "FALSE" });
    expect(d1.psets.Pset_ManufacturerTypeInformation.Manufacturer).toBe("Acme");
    expect(d1.typeName).toBe("Single 900");
    expect(d1.classification[0]).toMatchObject({ system: "Uniclass 2015", code: "Pr_30_59_24" });
    expect(d1.storey).toBe("Level 01");
    expect(m.duplicateGuids).toEqual(["0aaaaaaaaaaaaaaaaaaaa3"]);
    expect(m.georeferenced.siteLatLong).toBe(true);
  });
});

describe("analyseIfc", () => {
  it("analyses the legacy platform fixture", () => {
    const r = analyseIfc(readFileSync(new URL("./fixtures/sample.ifc", import.meta.url), "utf8"));
    expect(r.schema).toBe("IFC4");
    expect(r.classCounts).toEqual({ IFCCOLUMN: 1, IFCPIPESEGMENT: 1 });
    expect(r.storeys).toEqual([{ name: "Level 00", elevation: 0 }]);
    expect(r.findings.map((f) => f.area)).toEqual(expect.arrayContaining(["File header", "Property sets", "Classification", "Georeferencing"]));
  });
  it("reports naming, duplicates and requirement failures", () => {
    const reqs = requirementsFromLoin([{ ref: "LOIN-03", element: "Door", ifcClass: "IfcDoor", alphanumeric: "Pset_DoorCommon.FireRating, IsExternal = false" }]);
    const r = analyseIfc(RICH, { requirements: reqs });
    expect(r.checks.find((c) => c.id === "naming")!.failed).toBe(1);
    expect(r.findings.some((f) => f.area === "GUIDs" && f.severity === "error")).toBe(true);
    expect(r.requirements[0]).toMatchObject({ applicable: 2, passed: 1 });
    expect(r.requirements[0].failures[0].missing).toEqual(["Pset_DoorCommon.FireRating", "IsExternal"]);
    expect(r.checks.find((c) => c.id === "cobie")).toMatchObject({ passed: 2, failed: 0 });
  });
  it("rejects non-IFC files", () => expect(() => analyseIfc("hello")).toThrow(/Not an IFC/));
});

describe("IDS", () => {
  const IDS = `<?xml version="1.0"?><ids:ids xmlns:ids="http://standards.buildingsmart.org/IDS"><ids:specifications>
    <ids:specification name="Walls need fire rating" ifcVersion="IFC4">
      <ids:applicability><ids:entity><ids:name><ids:simpleValue>IFCWALL</ids:simpleValue></ids:name></ids:entity></ids:applicability>
      <ids:requirements>
        <ids:property><ids:propertySet><ids:simpleValue>Pset_WallCommon</ids:simpleValue></ids:propertySet><ids:baseName><ids:simpleValue>FireRating</ids:simpleValue></ids:baseName></ids:property>
        <ids:attribute><ids:name><ids:simpleValue>Name</ids:simpleValue></ids:name></ids:attribute>
        <ids:classification><ids:system><ids:simpleValue>Uniclass</ids:simpleValue></ids:system></ids:classification>
      </ids:requirements>
    </ids:specification></ids:specifications></ids:ids>`;
  it("parses specifications and checks walls incl. standard-case subtypes", () => {
    const { requirements, unsupported } = requirementsFromIds(IDS);
    expect(unsupported).toBe(1);
    expect(requirements[0]).toMatchObject({ entity: "IFCWALL", attributes: ["Name"], properties: [{ pset: "Pset_WallCommon", property: "FireRating" }] });
    const res = checkRequirements(buildModel(parseStep(RICH)), requirements)[0];
    expect(res.applicable).toBe(2);
    expect(res.failures).toHaveLength(2);
  });
});
