// How the six parts of ISO 19650 fit together, and which part applies at each stage of an asset's life.
// Paraphrased guidance, not the standard's text.

export interface PartLink { from: number; to: number; how: string }

/** One line per part: its job in the series. */
export const PART_ROLES: { part: number; short: string; role: string; feeds: string }[] = [
  { part: 1, short: "Concepts", role: "The foundation: the shared terms, the requirements cascade (OIR → AIR / PIR → EIR), the two information models (PIM and AIM) and the CDE.", feeds: "Every other part uses its terms and principles." },
  { part: 2, short: "Delivery", role: "The process for delivering a project: from assessing need, through tender and appointment, to producing, checking and handing over the project information model (PIM).", feeds: "Its output, the PIM, becomes part of the AIM in Part 3." },
  { part: 3, short: "Operation", role: "The process for running an asset: keeping the asset information model (AIM) up to date, and starting new appointments when a trigger event happens.", feeds: "Each trigger event starts a new appointment that runs the Part 2 process." },
  { part: 4, short: "Exchange", role: "How each exchange of information is reviewed and accepted: the criteria, formats and decisions applied whenever information passes from one party to another.", feeds: "Used at every exchange in Parts 2 and 3." },
  { part: 5, short: "Security", role: "A security-minded layer over everything: triage to decide if the asset is sensitive, then a security strategy and plan that control who sees what.", feeds: "Sets the access rules the CDE and every exchange must follow." },
  { part: 6, short: "Health & safety", role: "How health and safety risk information is captured, shared and kept through the life of the asset, so designers, builders and operators can act on it.", feeds: "H&S information is produced in Part 2, kept in the AIM under Part 3 and exchanged under Part 4." },
];

/** The main relationships between parts, shown as arrows. */
export const PART_LINKS: PartLink[] = [
  { from: 1, to: 2, how: "Defines the terms and requirements that the delivery process uses" },
  { from: 1, to: 3, how: "Defines the AIM and the asset requirements the operational process maintains" },
  { from: 2, to: 3, how: "Handover: the accepted PIM is transferred into the AIM" },
  { from: 3, to: 2, how: "Trigger event: refurbishment or replacement starts a new delivery appointment" },
  { from: 4, to: 2, how: "Review and acceptance of each information exchange during delivery" },
  { from: 4, to: 3, how: "Review and acceptance of each exchange during operation" },
  { from: 5, to: 2, how: "Security triage before tender; security plan controls sharing in the CDE" },
  { from: 5, to: 3, how: "Need-to-know access to the AIM and secure disposal of information" },
  { from: 6, to: 2, how: "Designers and contractors identify hazards and record residual risks" },
  { from: 6, to: 3, how: "Operators receive and update H&S information for maintenance and works" },
];

export type Use = "core" | "applies" | "";
/** Life-cycle stages with how strongly each part applies. */
export const PART_STAGES: { stage: string; what: string; use: Record<number, Use> }[] = [
  { stage: "Strategy & need", what: "The client defines its organisational and asset information needs", use: { 1: "core", 2: "applies", 3: "applies", 4: "", 5: "core", 6: "applies" } },
  { stage: "Tender & appointment", what: "EIR issued, BEP and resources assessed, appointments signed", use: { 1: "applies", 2: "core", 3: "", 4: "applies", 5: "core", 6: "applies" } },
  { stage: "Design & construction", what: "Task teams produce the PIM in the CDE against the MIDP", use: { 1: "applies", 2: "core", 3: "", 4: "core", 5: "applies", 6: "core" } },
  { stage: "Handover", what: "The PIM is checked, accepted and transferred into the AIM", use: { 1: "applies", 2: "core", 3: "core", 4: "core", 5: "applies", 6: "core" } },
  { stage: "Operation & maintenance", what: "The AIM is kept accurate as the asset is used and maintained", use: { 1: "applies", 2: "", 3: "core", 4: "core", 5: "applies", 6: "core" } },
  { stage: "Refurbishment / trigger event", what: "A new appointment starts; the AIM informs the new EIR", use: { 1: "applies", 2: "core", 3: "core", 4: "applies", 5: "applies", 6: "core" } },
];
