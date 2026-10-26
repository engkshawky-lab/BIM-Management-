// Model responsibility matrix: for each model element, which task team models it and to what
// level of development (LOD 100–500) at each milestone. Element list by discipline / system.

export const LODS = ["100", "200", "300", "350", "400", "500"] as const;
export type Lod = (typeof LODS)[number];

export const LOD_MEANING: Record<Lod, string> = {
  "100": "Symbol or mass showing existence, approximate size and location",
  "200": "Generic system/object with approximate quantity, size, shape and location",
  "300": "Specific object with accurate quantity, size, shape, location and orientation",
  "350": "As 300 plus interfaces and connections with other systems",
  "400": "Fabrication / installation detail",
  "500": "Field-verified as-built",
};

export interface MrmCell { teamId: string; lod: Lod | "" }

const g = (discipline: string, system: string, elements: string[]) => elements.map((element) => ({ discipline, system, element }));

/** Generic starter list; projects edit, add and remove rows. */
export const MRM_STARTER = [
  ...g("Architecture", "Envelope", ["External walls", "Curtain walls & glazing", "Roofs", "External doors & windows"]),
  ...g("Architecture", "Interior", ["Internal walls & partitions", "Internal doors", "Ceilings", "Floor finishes", "Wall finishes", "Stairs, ramps & railings", "Fixed furniture & joinery", "Sanitary fixtures"]),
  ...g("Architecture", "Spaces", ["Rooms / spaces", "Fire compartments & zones"]),
  ...g("Structure", "Substructure", ["Piles & pile caps", "Foundations", "Retaining walls"]),
  ...g("Structure", "Superstructure", ["Columns", "Beams", "Slabs", "Shear / core walls", "Structural steel & connections", "Openings & sleeves"]),
  ...g("MEP", "HVAC", ["Air handling units & fans", "Ductwork & accessories", "Chillers / pumps", "Chilled water piping", "Terminal units & diffusers"]),
  ...g("MEP", "Plumbing & drainage", ["Domestic water piping", "Drainage piping", "Pumps & tanks"]),
  ...g("MEP", "Fire protection", ["Sprinkler piping & heads", "Fire pumps", "Fire hose reels / cabinets"]),
  ...g("MEP", "Electrical", ["Switchgear & panels", "Cable trays & containment", "Lighting fixtures", "Small power", "Generators / transformers"]),
  ...g("MEP", "ELV", ["Fire alarm devices", "Security / CCTV / access control", "Data & telecom"]),
  ...g("Infrastructure", "Roads", ["Road alignment & pavement", "Kerbs & footpaths", "Road markings & signage"]),
  ...g("Infrastructure", "Wet utilities", ["Potable water network", "Sewer network & manholes", "Storm water network", "Irrigation network"]),
  ...g("Infrastructure", "Dry utilities", ["Power ducts & chambers", "Telecom ducts & chambers", "Street lighting"]),
  ...g("Landscape", "Hardscape", ["Paving", "Site walls & steps", "Site furniture", "Fences & gates"]),
  ...g("Landscape", "Softscape", ["Planting & trees", "Water features"]),
];

/** Rows whose LOD goes down from one milestone to the next, or a cell with LOD but no team. */
export function mrmFindings(rows: { element: string; cells: Record<string, MrmCell> }[], milestoneIds: string[]) {
  const out: string[] = [];
  for (const r of rows) {
    let prev = 0;
    for (const m of milestoneIds) {
      const c = r.cells[m];
      if (!c) continue;
      if (c.lod && !c.teamId) out.push(`${r.element}: LOD ${c.lod} set without a responsible team`);
      const v = Number(c.lod || 0);
      if (v && v < prev) out.push(`${r.element}: LOD drops from ${prev} to ${v}`);
      if (v) prev = v;
    }
  }
  return out;
}
