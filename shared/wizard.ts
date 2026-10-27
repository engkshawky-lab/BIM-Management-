// Setup wizard: from a few answers about the user's role and project, recommend the documents,
// standards and tools to start with. Pure function so the rules are testable.

export type WizardRole = "appointing" | "lead" | "task";
export type WizardStage = "brief" | "tender" | "mobilize" | "production" | "handover";
export interface WizardAnswers {
  role: WizardRole; stage: WizardStage; assetType: "building" | "infrastructure" | "facade";
  operations: boolean; sensitive: boolean; usesAi: boolean;
}
export interface Recommendation { templateId: string; reason: string }
export interface WizardResult { standards: ("iso19650" | "iso42001")[]; documents: Recommendation[]; tools: { path: string; label: string; reason: string }[] }

const ORDER: WizardStage[] = ["brief", "tender", "mobilize", "production", "handover"];
const atOrAfter = (s: WizardStage, from: WizardStage) => ORDER.indexOf(s) >= ORDER.indexOf(from);

export function recommend(a: WizardAnswers): WizardResult {
  const docs: Recommendation[] = [];
  const add = (templateId: string, reason: string) => { if (!docs.some((d) => d.templateId === templateId)) docs.push({ templateId, reason }); };
  const tools: WizardResult["tools"] = [];

  if (a.role === "appointing") {
    if (a.operations) { add("oir", "Your organization's information needs drive every later requirement."); add("air", "Operations need asset information at handover."); }
    add("eir", "Tells each appointed party what to deliver, when and to what level of need.");
    add("info-standard", "Naming, metadata and modelling rules every team follows.");
    add("cde-procedure", "How information moves from WIP to Published, and who approves.");
    add("info-protocol", "Licences, obligations and liability for information in each appointment.");
    if (a.sensitive) add("security-triage", "A sensitive asset needs a security-minded approach (ISO 19650-5).");
    if (atOrAfter(a.stage, "handover") || a.operations) add("handover-strategy", "Plans how the project information becomes the asset information model.");
    tools.push({ path: "traceability", label: "Requirements traceability", reason: "Check every EIR requirement is answered and delivered." });
  } else {
    if (!atOrAfter(a.stage, "mobilize")) {
      add("bep-pre", "Your response to the EIR at tender.");
      add("capability", "Shows the delivery team can deliver the information.");
    } else add("bep-post", "Confirms how the team will deliver after appointment.");
    if (a.role === "lead") {
      add("bim-scope", "Defines the information scope for each task team appointment.");
      add("mobilization", "Gets people, IT and methods ready before production.");
      tools.push({ path: "delivery/setup", label: "Teams & milestones", reason: "Set up task teams and milestones before planning." });
      tools.push({ path: "delivery/plan", label: "MIDP / TIDP planner", reason: "Plan every information container; the MIDP and TIDPs are generated from it." });
      tools.push({ path: "delivery/responsibility", label: "Responsibility matrix", reason: "Agree who produces what." });
    } else tools.push({ path: "delivery/plan", label: "MIDP / TIDP planner", reason: "Plan your task team's containers (your TIDP)." });
    add("qa-checklist", "Check information before it is shared.");
    tools.push({ path: "delivery/risks", label: "Risk register", reason: "Record risks to information delivery." });
  }
  if (atOrAfter(a.stage, "production")) {
    tools.push({ path: "reviews", label: "Model QA/QC reviews", reason: "Grade discipline models at each submission." });
    tools.push({ path: "coordination/issues", label: "Issues (BCF)", reason: "Track clashes and comments to closure." });
    tools.push({ path: "meetings", label: "Meetings & progress report", reason: "Minutes, actions and monthly reports." });
  }
  if (atOrAfter(a.stage, "handover")) {
    tools.push({ path: "delivery/handover", label: "Handover", reason: "PIM → AIM checklist with evidence." });
    tools.push({ path: "delivery/hs", label: "Health & safety information", reason: "Hand over hazards and residual risks (ISO 19650-6)." });
    add("lessons", "Capture lessons learned at close-out.");
  }
  if (a.assetType === "infrastructure") add("infra-requirements", "Adds chainage-based breakdown, datums, IFC 4.3 and GIS rules.");
  if (a.assetType === "facade") add("facade-requirements", "Adds panel marks, interfaces, performance data and fabrication exchanges.");
  if (a.usesAi) {
    add("ai-policy", "ISO/IEC 42001 starts with a top-management AI policy.");
    add("ai-inventory", "List the AI systems used on the project.");
    add("ai-risk", "Assess risks of the AI systems in use.");
    add("ai-impact", "Assess impacts on people and society.");
  }
  return { standards: a.usesAi ? ["iso19650", "iso42001"] : ["iso19650"], documents: docs, tools };
}
