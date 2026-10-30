import type { PartPractice } from "./types";

// ISO 19650-1 practice material. Paraphrased guidance, not the standard's text.

export const part1Practice: PartPractice = {
  part: 1,
  examples: [
    {
      title: "University estates: tracing a classroom data request back to the OIR",
      situation: "A university estates department is procuring a new teaching building under a traditional contract. Its draft EIR asks for every door, window and light fitting to be modelled with 40 data fields. Nobody can say who will use the data or why.",
      steps: [
        "The appointing party's information manager lists the strategic questions the university must answer, such as room utilisation, energy cost per student and statutory compliance, and records them in the OIR.",
        "Estates and FM staff derive the AIR from those OIR items, for example fire door inspection data and luminaire replacement cycles, and drop fields with no named user.",
        "The project team writes PIR for the key decisions, such as stage 2 sign-off of teaching space areas and the funding body's energy target.",
        "Each EIR line is given a reference back to the AIR or PIR item it serves, plus an acceptance criterion and a milestone.",
        "The information manager reviews the requirements register and removes any EIR item that cannot be traced to an OIR purpose.",
      ],
      result: "The EIR shrinks from 40 fields per object to a focused set, and every remaining requirement shows which university decision or operational task it supports.",
      lead: "Appointing party (information manager)",
      tool: { label: "Information requirements templates", path: "/knowledge/iso19650/templates" },
    },
    {
      title: "Rail station upgrade: setting the level of information need by purpose",
      situation: "A rail infrastructure owner is upgrading a station under a framework call-off. The designer has proposed one blanket 'LOD 400' for the whole model. The owner's maintenance team only needs detail for lifts, escalators and platform edge assets.",
      steps: [
        "The appointing party lists the purposes for each milestone: options appraisal, construction coordination and asset registration.",
        "For each purpose the information manager defines the geometry, alphanumeric data and documentation needed, rather than a single level for all objects.",
        "Platform canopies are set to simple massing for options appraisal, while lifts and escalators carry manufacturer data, asset tags and O&M documents at handover.",
        "The level of information need is written into the EIR and later into the responsibility matrix against each deliverable.",
        "The BIM coordinator checks a sample of model objects against the agreed level at the first milestone and reports gaps.",
      ],
      result: "Modelling effort goes where the owner needs it, and the designer has a clear, testable definition of 'enough' for each milestone.",
      lead: "Appointing party (information manager)",
      tool: { label: "Level of information need hub", path: "/hubs/loin" },
    },
    {
      title: "Residential tower: making the CDE states work for a new contractor",
      situation: "A housing developer appoints a contractor for a 32-storey residential tower. The contractor's teams are used to a shared network drive and email. Drawings marked 'final' keep changing after issue.",
      steps: [
        "The information manager configures the CDE with the four states: work in progress, shared, published and archived.",
        "Task teams are told that their own drafts stay in work in progress with S0 and are not visible to other teams.",
        "When the architect shares a floor plan for coordination it is checked and moved to shared with S1; a schedule issued for information only uses S2.",
        "Only information the appointing party has accepted moves to published with an A code, and superseded revisions move to archived instead of being deleted.",
        "The BIM coordinator runs a weekly report of containers with missing status or revision metadata and returns them to their task team.",
      ],
      result: "Every container now shows what it may be used for, and site teams build only from published information with a clear revision history.",
      lead: "Lead appointed party (information manager)",
      tool: { label: "CDE & status codes", path: "/knowledge/iso19650/library/2" },
    },
    {
      title: "Airport pier extension: mapping the delivery team before tender",
      situation: "An airport operator plans a pier extension using a design-and-build contract. The operator also has a separate baggage system supplier. Early meetings show confusion about who is the lead appointed party for which information.",
      steps: [
        "The appointing party draws the appointment structure: one appointment with the design-and-build contractor and a separate appointment with the baggage system supplier.",
        "Each appointment is shown with its own lead appointed party, delivery team and task teams, such as architecture, structures, MEP and baggage controls.",
        "The information management assignment matrix records which party performs each information management function for each appointment.",
        "Interfaces between the two delivery teams, such as baggage hall structural openings, are listed as shared information exchanges with named owners.",
        "Each prospective task team is asked to evidence its capability and capacity rather than relying on the company's reputation.",
      ],
      result: "Both delivery teams know who leads them, who receives their information and how the interface information flows between appointments.",
      lead: "Appointing party (information manager)",
      tool: { label: "Appointment and roles hub", path: "/hubs/appointment" },
    },
  ],
  faq: [
    {
      q: "Is Part 1 something a project can comply with on its own?",
      a: "Not really. Part 1 sets out concepts and principles, while the processes you are assessed against sit in Part 2 for delivery and Part 3 for operation. In practice you read Part 1 alongside those parts to understand the terms they use.",
    },
    {
      q: "Do we need an OIR before we can write an EIR?",
      a: "You can write an EIR without one, but it is weaker. Without OIR and AIR behind it, requirements tend to be copied from other projects and nobody can explain why they are needed. Even a short OIR with a handful of strategic questions gives the EIR a purpose to trace back to.",
    },
    {
      q: "Who owns the CDE?",
      a: "The appointing party is responsible for establishing the project CDE, even if a contractor or consultant hosts or administers it on its behalf. Whoever runs it, the appointing party should keep access to the information and the audit trail after the appointment ends.",
    },
    {
      q: "Is the CDE just the software platform?",
      a: "No. The CDE is the combination of a technical solution and an agreed workflow of states, transitions, approvals and metadata. Two projects on the same software can have very different CDEs if their workflows differ.",
    },
    {
      q: "What is the practical difference between the PIM and the AIM?",
      a: "The PIM is built during design and construction to support delivery decisions and coordination. The AIM supports operation and maintenance and lives as long as the asset. At handover only the relevant part of the PIM, such as asset data, as-built records and O&M documents, is transferred into the AIM.",
    },
    {
      q: "Is level of information need the same as LOD?",
      a: "No. LOD schemes usually describe a single level of detail per object. Level of information need defines what geometry, data and documentation are needed for a specific purpose at a specific milestone, so one object can have different needs for different purposes.",
    },
    {
      q: "Can the same company be both the appointing party and a lead appointed party?",
      a: "Yes, the roles describe a relationship in an appointment, not a type of company. A main contractor is a lead appointed party to the client, but it acts as the appointing party when it appoints its own subcontractors. Each appointment should make that relationship clear.",
    },
    {
      q: "Can we keep using our own internal terms instead of the ISO 19650 terms?",
      a: "You can, but map them. Keep a glossary that links each local term, such as 'employer's information requirements' or 'BIM protocol', to the ISO 19650 term it represents. Mixed terms across appointments are a common source of contract disputes.",
    },
    {
      q: "Does ISO 19650 apply to a small refurbishment project?",
      a: "Yes, the principles apply to assets of any size, but the effort should be proportionate. A small project might use a short EIR, a simple CDE workflow and combined documents, as long as requirements, responsibilities and approvals are still clear.",
    },
    {
      q: "Is information security part of Part 1?",
      a: "Part 1 treats security as a principle that runs through all information management. The detailed approach, including the sensitivity assessment and security management plan, is in ISO 19650-5. Check sensitivity before information is shared, not after.",
    },
  ],
  quiz: [
    [
      "A hospital trust wants to forecast maintenance costs across its estate. In the requirements hierarchy, where does this need first appear?",
      ["In the EIR for the mechanical designer", "In the organisational information requirements", "In the TIDP of the FM contractor", "In the project information standard"],
      1,
      "Strategic needs such as cost forecasting start in the OIR and are then translated into AIR and EIR.",
    ],
    [
      "A main contractor appoints a facade subcontractor. In that appointment, what is the main contractor's role?",
      ["Task team", "Appointed party", "Appointing party", "Information manager"],
      2,
      "Roles depend on the appointment, so the contractor is the appointing party to its own subcontractor.",
    ],
    [
      "Which of these is the best example of level of information need?",
      ["All objects modelled to LOD 300 for the whole project", "Native files issued in the latest software version", "One model per discipline per building", "Pump objects carry manufacturer, model and maintenance interval at handover for the FM system"],
      3,
      "Level of information need ties specific geometry, data and documents to a defined purpose and milestone.",
    ],
    [
      "A superseded drawing revision is no longer current. What should happen to it in the CDE?",
      ["It moves to the archived state and keeps its history", "It is deleted to avoid confusion", "It returns to work in progress", "It stays in published with a note"],
      0,
      "The archive keeps superseded information as a record instead of deleting it.",
    ],
    [
      "Which information is typically transferred from the PIM to the AIM at handover?",
      ["Clash reports and coordination meeting minutes", "Asset data, as-built records and O&M documents", "Every work in progress file from all task teams", "The tender evaluation scores"],
      1,
      "Only the information needed to operate and maintain the asset moves into the AIM.",
    ],
    [
      "Why should each task team's capability and capacity be assessed, rather than the delivery team as a whole?",
      ["Because the CDE licence is priced per task team", "Because Part 1 bans subcontracting", "Because a strong lead firm can hide a task team that lacks the skills or people to deliver", "Because task teams set the OIR"],
      2,
      "Delivery risk often sits in one under-resourced task team, so each one should show it can deliver.",
    ],
  ],
};
