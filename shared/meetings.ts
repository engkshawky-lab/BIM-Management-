// BIM meeting types with generic standing agendas (ISO 19650-2 §5.6 collaborative production).

export const MEETING_TYPES: Record<string, string[]> = {
  "BIM kick-off": [
    "Introductions, roles and responsibilities",
    "Exchange information requirements (EIR) walkthrough",
    "BIM execution plan: information uses, standards, methods and procedures",
    "CDE set-up, access and naming convention",
    "Model breakdown, federation strategy and responsibility matrix",
    "Information delivery plan (MIDP/TIDP) and milestones",
    "Software, versions, exchange formats and coordinates",
    "Mobilisation tests and next steps",
  ],
  "BIM coordination": [
    "Review of actions from the previous meeting",
    "Model submissions this period (status, revision, suitability)",
    "Clash detection results per test (new / active / resolved)",
    "Open coordination issues (BCF) by priority",
    "Design changes affecting other disciplines",
    "Model QA/QC review results",
    "Look-ahead: next submissions and clash runs",
    "AOB",
  ],
  "BIM progress": [
    "Review of actions from the previous meeting",
    "MIDP/TIDP progress: delivered, in progress, overdue",
    "Information quality: validation and QA/QC results",
    "Coordination status: open issues and clashes",
    "Risks to information delivery",
    "Asset information (COBie / AIR) progress",
    "Upcoming milestones and decisions required",
    "AOB",
  ],
  "Information model review": [
    "Scope of the model submission",
    "Compliance with information requirements and LOIN",
    "Review comments by discipline",
    "Decision: accept / accept with comments / reject",
    "Actions and resubmission date",
  ],
};

export const ACTION_STATUSES = ["Open", "In progress", "Done"] as const;
