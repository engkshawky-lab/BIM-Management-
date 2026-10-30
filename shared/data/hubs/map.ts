import type { Hub } from "./types";

// How the topic hubs fit together: themes in a suggested learning order, and for each hub the
// related hubs, the portal tools that put it into practice and the ISO 19650 parts behind it.
// The hubs index, the side panel and the "Related topics" panel at the end of every hub read this.

export type HubId = Hub["id"];

export interface Theme { id: string; label: string; blurb: string; hubs: HubId[] }

export const THEMES: Theme[] = [
  { id: "process", label: "The ISO 19650 process", blurb: "Who does what, when, and which documents each party produces.", hubs: ["revision-2026", "appointment", "documents-roles", "cde"] },
  { id: "requirements", label: "Information requirements", blurb: "How much information is needed, and how it is handed over.", hubs: ["loin", "cobie", "handover"] },
  { id: "software", label: "Software, models & AI", blurb: "Producing and checking information with Revit, reality capture and AI.", hubs: ["revit", "mcp", "ai-connect", "bcf", "scan-to-bim"] },
  { id: "strategy", label: "Sectors & strategy", blurb: "Applying ISO 19650 to infrastructure, beyond 3D, and across an organisation.", hubs: ["infrastructure", "facade", "dimensions", "implementation"] },
  { id: "governance", label: "Standards & AI governance", blurb: "Where the standards came from, and managing AI responsibly under ISO/IEC 42001.", hubs: ["timeline", "iso42001"] },
];

/** Hubs in learning order, theme by theme. */
export const HUB_ORDER: HubId[] = THEMES.flatMap((t) => t.hubs);
export const themeOf = (id: string) => THEMES.find((t) => t.hubs.includes(id as HubId));

export interface HubLinks {
  /** Related hubs, each with a short reason shown on the link. */
  related: { hub: HubId; why: string }[];
  /** Portal pages (nav keys) that put the topic into practice. */
  tools: string[];
  /** ISO 19650 parts behind the topic. */
  parts: number[];
}

export const HUB_LINKS: Record<HubId, HubLinks> = {
  "ai-connect": {
    related: [
      { hub: "mcp", why: "How MCP works, and the security rules behind every connection" },
      { hub: "revit", why: "Revit set-up that makes AI answers reliable" },
      { hub: "iso42001", why: "Governing AI use under ISO/IEC 42001" },
    ],
    tools: ["ai.mcp", "x.modelqa", "x.clash", "m.revit"],
    parts: [2, 5],
  },
  cde: {
    related: [
      { hub: "appointment", why: "Where the CDE is set up and tested in the process" },
      { hub: "bcf", why: "Issues raised against shared information" },
      { hub: "handover", why: "Archiving the PIM and publishing the AIM" },
    ],
    tools: ["s.19650.cde", "w.documents", "m.naming", "ai.suitability"],
    parts: [1, 2, 5],
  },
  bcf: {
    related: [
      { hub: "cde", why: "Issues follow shared and published information" },
      { hub: "revit", why: "Raising and resolving issues in the authoring tool" },
      { hub: "mcp", why: "AI help to triage and summarise issues" },
    ],
    tools: ["b.bcf", "ai.clash", "m.ifc"],
    parts: [2, 4],
  },
  facade: {
    related: [
      { hub: "loin", why: "Level of information need for façade packages" },
      { hub: "handover", why: "Panel, glass and warranty data for operation" },
      { hub: "bcf", why: "Coordinating façade interfaces as issues" },
    ],
    tools: ["ai.generate", "ai.clash", "b.ids"],
    parts: [2, 6],
  },
  handover: {
    related: [
      { hub: "cobie", why: "The structured asset data at handover" },
      { hub: "cde", why: "Statuses and archiving at close-out" },
      { hub: "loin", why: "What information the operator needs" },
    ],
    tools: ["ai.cobie", "w.docguides", "w.table", "b.ids"],
    parts: [2, 3, 6],
  },
  timeline: {
    related: [
      { hub: "revision-2026", why: "The next chapter of the series" },
      { hub: "appointment", why: "The process the standards describe" },
      { hub: "iso42001", why: "The AI management standard alongside ISO 19650" },
    ],
    tools: ["s.19650.parts", "s.glossary"],
    parts: [1, 2, 3, 4, 5, 6],
  },
  iso42001: {
    related: [
      { hub: "mcp", why: "AI connected to BIM tools needs governance" },
      { hub: "implementation", why: "Rolling out a management system" },
      { hub: "timeline", why: "How the standards landscape fits together" },
    ],
    tools: ["s.42001.clauses", "s.42001.annex", "t.lib42001", "ai.generate"],
    parts: [1],
  },
  "revision-2026": {
    related: [
      { hub: "appointment", why: "The 2018 process that stays in force until the new editions" },
      { hub: "documents-roles", why: "The documents whose names may change" },
      { hub: "loin", why: "ISO 7817-1, which the drafts align with" },
    ],
    tools: ["s.19650.parts", "s.19650.glossary", "ai.generate"],
    parts: [1, 2, 3],
  },
  appointment: {
    related: [
      { hub: "documents-roles", why: "The documents each step produces, by party" },
      { hub: "loin", why: "Setting the level of information need in the EIR" },
      { hub: "implementation", why: "Rolling the process out across your organisation" },
    ],
    tools: ["ai.projectdata", "ai.generate", "ai.plans", "ai.review"],
    parts: [1, 2],
  },
  "documents-roles": {
    related: [
      { hub: "appointment", why: "The process steps behind each document" },
      { hub: "cobie", why: "The handover data the documents call for" },
      { hub: "loin", why: "What the EIR and BEP say about information need" },
    ],
    tools: ["ai.generate", "r.samples", "ai.review", "ai.plans"],
    parts: [1, 2, 3],
  },
  loin: {
    related: [
      { hub: "cobie", why: "Delivering the alphanumeric information at handover" },
      { hub: "revit", why: "Modelling and parameters that meet the need" },
      { hub: "documents-roles", why: "Where LOIN is written: EIR, BEP, MIDP" },
    ],
    tools: ["m.ifc", "m.qaqc", "ai.generate"],
    parts: [1, 2],
  },
  cobie: {
    related: [
      { hub: "loin", why: "Deciding which data each asset needs" },
      { hub: "revit", why: "Authoring COBie data and exporting it from Revit" },
      { hub: "dimensions", why: "Using COBie for facility management (7D)" },
    ],
    tools: ["ai.cobie", "m.ifc", "m.qaqc"],
    parts: [3, 4],
  },
  revit: {
    related: [
      { hub: "mcp", why: "Connecting AI to Revit and other tools in general" },
      { hub: "loin", why: "The information each element must carry" },
      { hub: "cobie", why: "COBie parameters and export" },
      { hub: "scan-to-bim", why: "Modelling existing buildings from point clouds" },
    ],
    tools: ["m.revit", "m.ifc", "m.qaqc", "ai.mcp", "s.naming"],
    parts: [2, 4],
  },
  mcp: {
    related: [
      { hub: "revit", why: "MCP for Revit and Autodesk products, step by step" },
      { hub: "implementation", why: "Governing AI and new technology in your organisation" },
    ],
    tools: ["ai.mcp", "m.revit", "ai.generate", "ai.review"],
    parts: [2, 5],
  },
  "scan-to-bim": {
    related: [
      { hub: "revit", why: "Modelling the scan in Revit" },
      { hub: "loin", why: "Agreeing accuracy and level of detail" },
      { hub: "infrastructure", why: "Surveying linear and existing assets" },
    ],
    tools: ["r.scan", "m.qaqc"],
    parts: [2, 3],
  },
  infrastructure: {
    related: [
      { hub: "appointment", why: "The same appointment process on infrastructure projects" },
      { hub: "dimensions", why: "4D, 5D and carbon on linear assets" },
      { hub: "scan-to-bim", why: "Reality capture of existing networks" },
    ],
    tools: ["ai.generate", "ai.plans", "m.ifc"],
    parts: [2, 3, 5],
  },
  dimensions: {
    related: [
      { hub: "cobie", why: "Asset data for 7D facility management" },
      { hub: "infrastructure", why: "Time, cost and carbon on infrastructure" },
      { hub: "implementation", why: "Building the case and the capability" },
    ],
    tools: ["r.carbon", "r.dt", "r.fee"],
    parts: [2, 3],
  },
  implementation: {
    related: [
      { hub: "appointment", why: "The process you are implementing" },
      { hub: "documents-roles", why: "The documents each party must own" },
      { hub: "mcp", why: "Adding AI to your production methods safely" },
    ],
    tools: ["r.maturity", "r.wizard", "r.fee"],
    parts: [1, 2, 5],
  },
};
