// Types for the COBie sheet-by-sheet column reference (data in cobieSchema.ts).

/** COBie spreadsheet column convention: required, reference (to another sheet or a picklist), external (system-filled), or optional / as specified. */
export type CobieColumnKind = "required" | "reference" | "external" | "optional";

export interface CobieColumn {
  name: string;          // exact COBie column header, e.g. "TypeName"
  kind: CobieColumnKind;
  description: string;   // what goes in it, in plain English
  example: string;       // a realistic example value
  references?: string;   // for reference columns: the sheet or picklist it points to, e.g. "Type.Name" or "PickLists.Category-Product"
}

export interface CobieSheet {
  name: string;          // sheet name, e.g. "Component"
  group: "Contacts" | "Spatial" | "Physical" | "Operations" | "Supporting";
  purpose: string;
  oneRowPer: string;     // e.g. "installed, maintainable item"
  filledBy: string;      // who typically provides it
  firstDelivered: string;// typical stage first populated
  tips: string[];
  columns: CobieColumn[];
}
