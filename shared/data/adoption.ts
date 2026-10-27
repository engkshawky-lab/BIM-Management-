// Organization implementation guide: a step-by-step plan for adopting ISO 19650 across an organization.
// Each step is tracked per user (status, owner, due date, note).

export interface AdoptionStep { id: string; title: string; detail: string; outputs: string[]; link?: string }
export interface AdoptionPhase { id: string; title: string; goal: string; steps: AdoptionStep[] }

const S = (id: string, title: string, detail: string, outputs: string[], link?: string): AdoptionStep => ({ id, title, detail, outputs, link });

export const ADOPTION_PHASES: AdoptionPhase[] = [
  { id: "assess", title: "Assess where you are", goal: "Understand current practice, gaps and what the organization needs from information.", steps: [
    S("sponsor", "Appoint a sponsor and an information management lead", "Name an executive sponsor and the person who will run the adoption. Agree the scope (appointing party, delivery organization or both).", ["Sponsor and lead named", "Adoption scope"]),
    S("maturity", "Assess current maturity", "Score how the organization manages information today: requirements, standards, CDE, roles, training and asset information.", ["Maturity score and gap list"], "/tools/maturity"),
    S("drivers", "Agree business drivers", "Write down why you are adopting ISO 19650 (client mandates, rework, handover quality, asset data) and how success will be measured.", ["Business case", "Success measures"]),
  ] },
  { id: "foundation", title: "Build the foundation", goal: "Create the standards, methods and resources every project will reuse.", steps: [
    S("oir", "Define organizational information requirements", "Capture the information the organization needs for strategic and operational decisions (OIR), and the asset information requirements (AIR) if you own assets.", ["OIR", "AIR"], "/knowledge/iso19650/templates/oir"),
    S("standard", "Publish an information standard", "Naming convention, status and revision codes, classification, metadata, units and coordinates, drawing standards.", ["Information standard"], "/knowledge/iso19650/templates/info-standard"),
    S("cde", "Select and configure a CDE", "Choose a CDE, set up the WIP / Shared / Published / Archived workflow, permissions and folder structure.", ["CDE procedure", "Configured CDE"], "/knowledge/iso19650/templates/cde-procedure"),
    S("templates", "Prepare house templates", "Create organization versions of the EIR, BEP, responsibility matrix, MIDP/TIDP and minutes so projects start from approved content.", ["House template library"]),
    S("protocol", "Agree an information protocol", "Licences, obligations, liability and security wording to include in every appointment.", ["Information protocol"], "/knowledge/iso19650/templates/info-protocol"),
  ] },
  { id: "people", title: "Prepare people", goal: "Give every role the knowledge and responsibilities it needs.", steps: [
    S("roles", "Define information management roles", "Agree who acts as information manager, task information manager, BIM coordinator and CDE administrator on projects.", ["Role descriptions", "Responsibility matrix"]),
    S("training", "Train staff by role", "Foundation training for everyone; practitioner training for information managers and coordinators. Track completion.", ["Training plan", "Completion records"], "/learn"),
    S("supply", "Brief the supply chain", "Share your standards and templates with consultants and contractors and check their capability before appointment.", ["Supply chain briefing", "Capability assessments"], "/knowledge/iso19650/templates/capability"),
  ] },
  { id: "pilot", title: "Pilot on a project", goal: "Prove the process on a real project before rolling it out.", steps: [
    S("select", "Select a pilot project", "Choose a project with a supportive team and enough time to learn. Set up the project in the portal with its standards.", ["Pilot project"], "/projects/new"),
    S("run", "Run the full delivery process", "EIR → BEP → responsibility matrix → TIDP/MIDP → production in the CDE → reviews → handover, using the process gates.", ["Pilot documents and plan"]),
    S("measure", "Measure results", "Track quality score, overdue containers, issues and rework through the pilot and compare with previous projects.", ["Pilot metrics"], "/portfolio"),
    S("lessons", "Capture lessons learned", "Record what worked and what did not; update the standard, templates and training.", ["Lessons learned log", "Updated templates"]),
  ] },
  { id: "rollout", title: "Roll out and improve", goal: "Make ISO 19650 the normal way of working and keep improving it.", steps: [
    S("mandate", "Mandate the process for new projects", "Make the standard, templates and CDE workflow mandatory for new projects above an agreed size.", ["Policy statement"]),
    S("audit", "Audit projects regularly", "Run quality checks and audits on live projects; export audit evidence packs and follow up nonconformities.", ["Audit schedule", "Audit reports"]),
    S("review", "Review annually", "Review the OIR, standard and templates every year and after each major lesson; re-assess maturity.", ["Annual review", "Updated maturity score"], "/tools/maturity"),
  ] },
];

export const ADOPTION_STEP_IDS = ADOPTION_PHASES.flatMap((p) => p.steps.map((s) => s.id));
