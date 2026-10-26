// Learning content: original question bank by topic and decision scenarios. Paraphrased
// guidance only — verify against the licensed editions of the standards.

export interface Question { id: string; topic: string; q: string; options: string[]; answer: number; why: string }
export const TOPICS = ["Concepts & terms", "Delivery process", "CDE, naming & status", "Plans & responsibilities", "Asset information & handover", "Security (19650-5)", "AI management (42001)"] as const;

const Q = (topic: (typeof TOPICS)[number], list: [string, string[], number, string][]): Question[] =>
  list.map(([q, options, answer, why], i) => ({ id: `${TOPICS.indexOf(topic)}-${i + 1}`, topic, q, options, answer, why }));

export const QUESTIONS: Question[] = [
  ...Q("Concepts & terms", [
    ["Which model holds the information needed for the operational phase of an asset?", ["Project information model", "Asset information model", "Federated model", "Design intent model"], 1, "The AIM supports operation and maintenance; the PIM supports the delivery phase."],
    ["Who is the 'appointing party'?", ["The party receiving information from the lead appointed party", "The task team leader", "The CDE provider", "The main contractor's subcontractor"], 0, "The appointing party receives information about works, goods or services from the lead appointed party."],
    ["What does 'level of information need' define?", ["Only the geometric detail of objects", "The quality, quantity and granularity of information required for a purpose", "The number of models per discipline", "The software version to be used"], 1, "LOIN covers geometry, alphanumeric information and documentation needed for a purpose at a milestone."],
    ["Which requirement set is defined by the appointing party for each appointment?", ["OIR", "AIR", "EIR", "PIR"], 2, "Exchange information requirements are set per appointment and describe what, when, how and for what purpose information is needed."],
    ["Organisational information requirements (OIR) are mainly derived from…", ["The clash matrix", "The organisation's strategic and operational objectives", "The task team's software", "The CDE folder structure"], 1, "OIR explain the information an organisation needs for its high-level objectives."],
    ["A 'task team' is…", ["The appointing party's legal team", "A group of people performing a specific task within a delivery team", "The CDE administrators", "Any external consultant"], 1, "Task teams are assembled to carry out a specific task and are led by a task team manager."],
    ["What is an 'information container'?", ["Only a native model file", "A named persistent set of information retrievable from a file or system hierarchy", "A folder on the CDE", "A clash test group"], 1, "A container may be a model, drawing, schedule or database record — anything named and retrievable."],
  ]),
  ...Q("Delivery process", [
    ["Which activity comes first in the ISO 19650-2 delivery process?", ["Tender response", "Assessment and need", "Mobilisation", "Information model delivery"], 1, "The process starts with assessment and need, before invitation to tender."],
    ["When is the pre-appointment BIM execution plan produced?", ["After project close-out", "As part of the tender response", "During mobilisation only", "After the information model is accepted"], 1, "The prospective lead appointed party includes a pre-appointment BEP in its tender response."],
    ["Mobilisation activities include…", ["Archiving the PIM", "Testing information production methods and IT before production", "Writing the OIR", "Accepting the information model"], 1, "Mobilisation confirms resources and tests IT, methods and procedures."],
    ["Who authorises the information model before submission to the appointing party?", ["Each author", "The lead appointed party", "The CDE vendor", "The facility manager"], 1, "The lead appointed party reviews and authorises before submitting for acceptance."],
    ["What is checked before information is shared in the CDE?", ["Only file size", "A quality assurance check against the standard, methods and LOIN", "Nothing — WIP is shared automatically", "Only the drawing title block"], 1, "Each container is checked (and reviewed) before it moves from WIP to Shared."],
    ["Lessons learned are captured during…", ["Invitation to tender", "Project close-out", "Mobilisation", "Assessment and need only"], 1, "Close-out archives the PIM and records lessons learned for future projects."],
    ["The detailed responsibility matrix is established during…", ["Appointment", "Close-out", "Operation", "Assessment"], 0, "During appointment, the delivery team refines responsibilities into a detailed matrix."],
  ]),
  ...Q("CDE, naming & status", [
    ["Which CDE state holds information approved for use, e.g. construction?", ["WIP", "Shared", "Published", "Archived"], 2, "Published information has been authorised for use by the appointing party."],
    ["A container in WIP is visible to…", ["Everyone on the project", "Only its task team", "The public", "Only the appointing party"], 1, "Work in progress stays within the task team until it is checked and shared."],
    ["Which status code typically indicates 'suitable for coordination'?", ["S1", "S4", "A1", "AR"], 0, "In the UK National Annex S1 indicates suitability for coordination."],
    ["Revision 'P02.03' indicates…", ["Contractual revision 2", "Preliminary revision 2, version 3 (WIP)", "Published revision 3", "Archive 2"], 1, "P revisions are preliminary; the decimal part tracks WIP versions."],
    ["Why use a field-based naming convention?", ["To make files shorter", "So containers are uniquely identifiable and sortable by project, originator, volume, level, type, role and number", "Because software requires it", "To hide information"], 1, "Consistent fields make information unique, searchable and automatable."],
    ["Archived information should be…", ["Deleted after 30 days", "Retained as a record of the PIM/AIM history", "Moved back to WIP", "Shared publicly"], 1, "The archive keeps a journal of changes and superseded information."],
  ]),
  ...Q("Plans & responsibilities", [
    ["The MIDP is…", ["One task team's schedule", "The aggregation of all TIDPs aligned to project milestones", "The client's OIR", "A clash report"], 1, "The lead appointed party aggregates TIDPs into the MIDP."],
    ["A TIDP lists…", ["Each task team's information containers, dates and dependencies", "Client objectives", "Only meetings", "Site logistics"], 0, "Each task team prepares a TIDP describing what it will deliver and when."],
    ["In a RACI matrix, how many parties should be 'Accountable' for an item?", ["None", "Exactly one", "At least two", "All task teams"], 1, "One accountable party per item avoids ambiguity."],
    ["The capability and capacity assessment is used to…", ["Choose CDE colours", "Show each task team can deliver the information requirements", "Calculate fees only", "Replace the BEP"], 1, "It evidences skills, IT and resources against the requirements."],
    ["The information delivery risk register covers…", ["Only health and safety risks", "Risks to timely delivery of information and their mitigation", "Commercial risks only", "Insurance"], 1, "It records risks affecting information delivery, with owners and mitigation."],
    ["A model responsibility matrix (MRM) defines…", ["Who models each element and to what level at each milestone", "The meeting agenda", "The CDE access list", "The fee"], 0, "It assigns element authorship and level of development per stage."],
  ]),
  ...Q("Asset information & handover", [
    ["COBie is mainly used to deliver…", ["Clash results", "Structured facility and asset data for operations", "Drawings", "Cost plans"], 1, "COBie carries spaces, types, components, systems and documents for FM."],
    ["Asset information requirements (AIR) specify…", ["Information needed about assets for operation and maintenance", "Model colours", "Meeting minutes", "Tender evaluation criteria"], 0, "AIR derive from OIR and define the asset information the AIM must contain."],
    ["Why use unique asset tags?", ["Decoration", "To link physical assets, data, documents and maintenance records reliably", "To satisfy software licences", "They are optional and rarely useful"], 1, "A unique tag joins the field asset to its data throughout its life."],
    ["Asset information is best delivered…", ["All at once after handover", "Progressively during construction and verified before handover", "Only as PDFs", "By the facility manager alone"], 1, "Staged delivery with verification reduces handover risk."],
    ["ISO 19650-3 addresses…", ["The operational phase of assets", "Tendering only", "Security", "Model clash tolerances"], 0, "Part 3 covers information management during operation."],
  ]),
  ...Q("Security (19650-5)", [
    ["The first step of a security-minded approach is…", ["Encrypting every file", "A security triage / sensitivity assessment", "Removing the CDE", "Hiring guards"], 1, "Triage decides whether a security-minded approach is required."],
    ["Aggregation risk means…", ["Too many models slow the computer", "Combining individually harmless information can reveal sensitive information", "Duplicate files", "Late delivery"], 1, "Federated information can expose patterns not visible in single files."],
    ["Who should have access to sensitive information?", ["Everyone on the project", "Only those with a need to know", "The public", "Only the CDE vendor"], 1, "Need-to-know access is a core control."],
    ["A security breach should be…", ["Ignored if minor", "Reported, investigated and lessons learned", "Fixed silently", "Deleted from logs"], 1, "Breach management includes reporting, investigation and improvement."],
  ]),
  ...Q("AI management (42001)", [
    ["ISO/IEC 42001 specifies requirements for…", ["An AI management system", "A specific AI algorithm", "BIM software", "Data centres"], 0, "It is a management system standard for organisations using or providing AI."],
    ["An AI system impact assessment considers…", ["Only cost", "Potential consequences for individuals, groups and society", "Server uptime", "Only accuracy"], 1, "Impact assessment looks at effects on people and society."],
    ["The Statement of Applicability lists…", ["All Annex A controls with justification for inclusion or exclusion", "Staff salaries", "Only implemented software", "Model clash results"], 0, "The SoA records which controls apply and why."],
    ["Human oversight of AI outputs in BIM workflows is important because…", ["AI is always correct", "Outputs can be wrong and accountability stays with people", "It is required by IFC", "It slows projects"], 1, "People remain accountable for decisions informed by AI."],
    ["Which belongs in an AI system inventory?", ["Each AI system's purpose, owner, data and risk level", "Only the vendor's logo", "Meeting minutes", "Room data sheets"], 0, "An inventory records what AI is used, by whom, for what and with what risk."],
  ]),
];

// ---------------------------------------------------------------- scenarios

export interface ScenarioStep { text: string; choices: { label: string; next: number | null; score: number; feedback: string }[] }
export interface Scenario { id: string; title: string; topic: string; steps: ScenarioStep[] }

export const SCENARIOS: Scenario[] = [
  { id: "late-model", title: "A model arrives late and unchecked", topic: "Delivery process", steps: [
    { text: "The MEP task team uploads its model straight to Shared two days after the milestone, without the QA checklist. The architect has already started coordinating against it. What do you do first?", choices: [
      { label: "Return it to WIP and ask for the QA check before re-sharing", next: 1, score: 2, feedback: "Right: information is checked before it is shared. Notify the architect that the container was withdrawn." },
      { label: "Leave it — coordination has started", next: 1, score: 0, feedback: "Unchecked information in Shared undermines trust and spreads errors to other teams." },
      { label: "Delete the file", next: 1, score: 0, feedback: "Never delete — the CDE keeps an audit trail. Change its state instead." },
    ] },
    { text: "The MEP lead says the delay was caused by late structural information. How do you handle the programme impact?", choices: [
      { label: "Run a change-impact check on the MIDP and update the risk register", next: null, score: 2, feedback: "Good: dependencies show knock-on effects; the risk register captures the cause and mitigation." },
      { label: "Ask everyone to work harder", next: null, score: 0, feedback: "Without analysing dependencies you cannot see which milestones are now at risk." },
      { label: "Move the milestone date silently", next: null, score: 0, feedback: "Milestones belong to the appointing party; changes need agreement and a record." },
    ] },
  ] },
  { id: "naming", title: "Naming convention pushback", topic: "CDE, naming & status", steps: [
    { text: "A subcontractor says your naming convention is 'too complicated' and wants to use their own file names. What do you do?", choices: [
      { label: "Explain the purpose and give them a naming tool / template; check at upload", next: 1, score: 2, feedback: "Make compliance easy and automatic — validation at upload catches mistakes early." },
      { label: "Allow their names for this package only", next: 1, score: 0, feedback: "Exceptions break search, automation and the audit trail across the project." },
      { label: "Rename their files yourself every week", next: 1, score: 1, feedback: "It works short-term but hides the problem and costs you time." },
    ] },
    { text: "Two weeks later 30% of uploads still fail the naming check. Next step?", choices: [
      { label: "Raise it at the coordination meeting, record an action with an owner and date, and track it", next: null, score: 2, feedback: "Visible actions with owners drive improvement." },
      { label: "Turn off the naming check", next: null, score: 0, feedback: "That removes the control instead of fixing the cause." },
    ] },
  ] },
  { id: "handover", title: "COBie at handover", topic: "Asset information & handover", steps: [
    { text: "Six weeks before handover the contractor submits its first COBie file. Validation shows 2,400 errors. What should have happened earlier?", choices: [
      { label: "Progressive COBie drops at each stage, validated against the client standard", next: 1, score: 2, feedback: "Staged delivery spreads the effort and exposes problems early." },
      { label: "Nothing — COBie is always done at the end", next: 1, score: 0, feedback: "Leaving it to the end is the most common cause of poor asset data." },
    ] },
    { text: "What do you do now?", choices: [
      { label: "Group errors by type, agree priorities with FM, set a recovery plan with dates", next: null, score: 2, feedback: "Prioritise what FM needs on day one (spaces, maintainable assets, tags) and track the rest." },
      { label: "Accept the file to avoid delaying handover", next: null, score: 0, feedback: "Accepting non-compliant data transfers the cost to operations." },
    ] },
  ] },
];
