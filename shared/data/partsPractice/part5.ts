import type { PartPractice } from "./types";

export const part5Practice: PartPractice = {
  part: 5,
  examples: [
    {
      title: "Colocation data centre: controlling aggregation risk in the federated model",
      situation: "An operator is building a new colocation data centre for financial and government tenants. Each discipline model looks harmless on its own, but the federated model shows power feeds, cooling routes, generator positions and the secure perimeter in one place. The contractor's wider supply chain needs the federated model for clash detection.",
      steps: [
        "The appointing party's security lead runs the security triage and records aggregation in the federated model as the main risk.",
        "The security strategy states that the full federation is restricted, while single-discipline models without the security layers can be shared more widely.",
        "The information manager writes the security management plan: a separate restricted container for security systems, and a federation view with incoming power and fibre routes removed for general coordination.",
        "CDE access groups are set on a need-to-know basis, so only named coordinators can open the complete federation, and every download of it is logged.",
        "The BIM coordinator runs clash detection on the reduced federation and checks the restricted interfaces in a separate session with the named reviewers.",
        "Access groups are reviewed at each information exchange, and leavers lose access on their last working day.",
      ],
      result: "Coordination continues at full pace on the reduced model, and the complete picture of the site's critical systems stays with a small, named group.",
      lead: "Security lead, with the information manager",
      tool: { label: "Information delivery risk register", path: "/ai-tools/risks" },
    },
    {
      title: "National rail station upgrade: reviewing information before it goes public",
      situation: "A rail infrastructure owner is upgrading a busy national station. The project must publish drawings for planning, run public consultation and share fly-through images with the media. The models include CCTV positions, crowd-flow studies and the locations of control and equipment rooms.",
      steps: [
        "The security triage identifies public-facing information as a key route for harm, alongside the CDE.",
        "The security management plan sets a publication review step: nothing leaves the CDE for planning, consultation or marketing until a named security reviewer has checked it.",
        "Designers produce separate presentation models with CCTV, crowd-flow studies and equipment room labels removed, rather than editing exported images by hand.",
        "The reviewer checks each pack against an agreed list of features that must not appear, and records the approval in the CDE.",
        "The communications team is briefed that site hoarding graphics and social media posts follow the same review route.",
        "A single register of everything published is kept, so the team can see what is already in the public domain if the risk changes.",
      ],
      result: "Planning and consultation go ahead on time, and the station's security features are not exposed in public documents or media images.",
      lead: "Appointing party (security lead, in the UK often the built asset security manager)",
      tool: { label: "CDE and status codes", path: "/knowledge/iso19650/library/2" },
    },
    {
      title: "Police station: responding to a breach in the supply chain",
      situation: "A contractor is building a new police station with custody suites and an evidence store. A subcontractor's site engineer sends a custody suite layout to a supplier through a personal messaging app to get a quick price. The task team manager spots it two days later.",
      steps: [
        "The task team manager reports the event straight away to the contact named in the security breach/incident management plan, instead of trying to fix it quietly.",
        "The security lead assesses the harm: what was sent, to whom, and whether it can be recovered or deleted by the recipient.",
        "Containment follows the plan: the supplier is asked to delete the file and confirm in writing, and the engineer's CDE access is suspended while the facts are checked.",
        "The event is recorded in the incident log with the timeline, the actions taken and the residual risk.",
        "The lead appointed party checks that the subcontract actually contains the security clauses, and finds the supplier tier had never been briefed.",
        "Lessons learned lead to a short briefing for every tier and an approved route in the CDE for sharing drawings with suppliers for pricing.",
      ],
      result: "The breach is contained and recorded, the gap in contractual flow-down is closed, and suppliers now receive drawings through a controlled CDE link.",
      lead: "Lead appointed party (contractor), with the security lead",
      tool: { label: "Appointment hub", path: "/hubs/appointment" },
    },
    {
      title: "Hospital: keeping sensitive layouts controlled in the asset information model",
      situation: "A hospital trust is taking handover of a new building that includes a secure mental health unit, a controlled drugs store and a medical gas plant. The facilities team, a maintenance contractor and several equipment suppliers will all need asset information. The trust wants the AIM to stay useful without exposing the sensitive spaces to everyone.",
      steps: [
        "The trust reviews its sensitivity assessment before handover, because the risk profile changes once the building is occupied by patients and staff.",
        "The security management plan is updated for operation: AIM access groups are defined by role, such as estates staff, maintenance contractor and specialist supplier.",
        "Space and asset data for the secure unit and the drugs store are held in a restricted part of the AIM, while routine maintenance data stays generally available.",
        "The handover information is checked to make sure restricted details have not been copied into open documents, such as O&M manuals or exported spreadsheets.",
        "New maintenance contractors receive access only after signing the security obligations and completing a short security briefing.",
        "Access to the AIM is reviewed every quarter and whenever a maintenance contract ends.",
      ],
      result: "Maintenance teams find the asset data they need, while layouts of the secure unit and drugs store are seen only by people whose role requires it.",
      lead: "Appointing party (hospital estates, with the trust's security lead)",
      tool: { label: "Information management plans", path: "/ai-tools/plans" },
    },
  ],
  faq: [
    {
      q: "Does every project need a security triage?",
      a: "Yes, every asset or project should have a sensitivity assessment recorded through the triage. For most ordinary buildings the outcome will be that no security-minded approach is needed, and that is fine. The value is in having a dated record that someone asked the question and gave reasons.",
    },
    {
      q: "Who decides what is sensitive?",
      a: "The appointing party, as asset owner, is accountable for the decision, usually advised by its security lead or a security specialist. Designers and contractors should raise anything they think could be sensitive, but they do not set the classification themselves. The decision and its reasoning go in the triage record.",
    },
    {
      q: "Can sensitive information sit in a public cloud CDE?",
      a: "Part 5 does not ban cloud services; it asks you to treat the CDE provider as part of the risk. The security strategy should cover where data is stored, who at the provider can reach it, encryption, access logging and what happens when the contract ends. For very high-risk assets the appointing party may still decide on a private or on-premises solution.",
    },
    {
      q: "Does a security-minded approach mean we cannot use email or mobile devices?",
      a: "No. It means the security management plan sets clear rules, for example sharing through CDE links instead of attachments, using only approved and encrypted devices, and keeping sensitive containers off personal apps. Rules that are too strict tend to be ignored, so keep them practical.",
    },
    {
      q: "How should we mark sensitive containers in the CDE?",
      a: "Use the classification scheme the appointing party already uses, applied as CDE metadata and on the title block or cover sheet. In the UK public sector this is usually the government security classification scheme, which is a UK example rather than part of ISO 19650. Avoid putting sensitive descriptions in file names, because names are often visible to more people than the content.",
    },
    {
      q: "A designer needs to see a restricted area to do their work. What do we do?",
      a: "Grant access to the specific containers they need, for a defined period, and record who approved it and why. Do not move the whole team into a wider access group to save time. Remove the access when the task is finished and note it in the access review.",
    },
    {
      q: "Does Part 5 require security vetting of project staff?",
      a: "Part 5 expects people-related controls proportionate to the risk, and vetting can be one of them. The standard does not set vetting levels; those come from the security strategy and any national or client schemes. Where vetting is required, it should be stated in the tender and appointment documents so bidders can plan for the time it takes.",
    },
    {
      q: "How does Part 5 relate to ISO/IEC 27001?",
      a: "ISO/IEC 27001 is a management system for an organisation's information security as a whole. Part 5 focuses on information about a specific built asset and how it is handled across a delivery team and supply chain. If an organisation already runs ISO/IEC 27001, align the two so the same incident routes, roles and policies are used.",
    },
    {
      q: "What should happen to sensitive information when an appointment ends?",
      a: "The security management plan should say whether information is returned, securely destroyed or retained under control, and how this is confirmed. CDE and AIM access is removed for the departing party, and their confirmation is filed. The same applies to copies on local drives, laptops and backup media.",
    },
    {
      q: "What should a task team do in the first hour after a suspected breach?",
      a: "Report it to the contact named in the breach/incident management plan, even if you are not sure it is serious. Take simple containment steps the plan allows, such as revoking a shared link, and keep a note of what happened and when. Do not delete evidence or try to hide the event, because that makes recovery and learning much harder.",
    },
  ],
  quiz: [
    [
      "Which document turns the security strategy into practical controls such as CDE permissions, classification markings and redaction rules?",
      ["Security triage record", "Security management plan", "Master information delivery plan", "Information handover strategy"],
      1,
      "The security management plan sets out the specific controls, roles and procedures that implement the strategy.",
    ],
    [
      "A sensitivity assessment concludes that no security-minded approach is needed. What should happen next?",
      ["Nothing, because only positive outcomes need recording", "Apply the full set of controls anyway", "Delete the assessment to avoid confusion", "Record the outcome, the reasoning and a review date or trigger"],
      3,
      "The outcome and its reasoning are recorded even when no approach is needed, with a point at which it will be reviewed.",
    ],
    [
      "Why is classifying all project information as sensitive a poor practice?",
      ["It slows delivery and pushes people towards unsafe workarounds", "It is forbidden by ISO 19650-1", "It makes file names too long", "It prevents the use of IFC"],
      0,
      "Controls should be proportionate, because over-classification hinders collaboration and encourages people to bypass the rules.",
    ],
    [
      "How far down the supply chain should security requirements flow?",
      ["Only to the lead appointed party", "Only to parties working on site", "To every tier, including specialist subcontractors and software providers", "Only to parties based outside the country"],
      2,
      "Security clauses must reach every tier that handles the information, not just the top-level appointment.",
    ],
    [
      "Which of these should be checked for sensitive content even though it sits outside the CDE?",
      ["The CDE audit log", "Drawings submitted with a planning application", "The task information delivery plan", "The responsibility matrix"],
      1,
      "Planning submissions, marketing images and site hoardings can reveal sensitive details, so they need the same review.",
    ],
    [
      "When should the sensitivity assessment be revisited?",
      ["Only at project close-out", "Only if a breach has already happened", "Never, once it has been approved", "At key stages and when trigger events change the risk profile"],
      3,
      "The risk profile changes between design, construction and operation, so the assessment is reviewed at key stages and on trigger events.",
    ],
  ],
};
