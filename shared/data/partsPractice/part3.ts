// ISO 19650-3 practice material: operational phase of the assets.
// Paraphrased guidance, not the standard's text.
import type { PartPractice } from "./types";

export const part3Practice: PartPractice = {
  part: 3,
  examples: [
    {
      title: "University campus: onboarding a new student residence into the AIM",
      situation: "A university estates team has just taken handover of a 600-bed student residence from its contractor. The PIM is published, but none of it is in the estates AIM yet, and the term maintenance contractor starts in four weeks.",
      steps: [
        "The information manager logs the handover as a trigger event in the trigger event register, listing the residence, its systems and the receiving teams.",
        "The estates team checks the published COBie file and O&M containers against the campus AIR, one asset type at a time.",
        "Gaps are raised with the contractor through the CDE, for example missing warranty dates on fire doors and missing maintenance frequencies on heat pumps.",
        "Corrected containers are resubmitted at S7, and the estates information manager records acceptance against each one.",
        "Accepted asset records are aggregated into the AIM and loaded into the CAFM system with the campus location codes.",
        "The AIM extract for the residence is issued to the term maintenance contractor as reference information before its first planned visit.",
      ],
      result: "The residence enters the maintenance programme with complete asset records, and the estates team holds an acceptance record for every container it took over.",
      lead: "Appointing party (estates information manager)",
      tool: { label: "COBie data checker", path: "/ai-tools/cobie" },
    },
    {
      title: "Hospital estate: replacing a failed air handling unit fan in a theatre suite",
      situation: "A supply fan fails in an air handling unit serving two operating theatres at an acute hospital. The estates team must restore ventilation within hours, and the replacement fan is a different make and model from the original.",
      steps: [
        "The duty estates officer raises an emergency work order, which the trigger event register classes as an unplanned trigger event with a fast-track information route.",
        "The estates information manager sends the maintenance contractor the AIM extract for the unit: asset record, O&M manual, commissioning data and the last ventilation validation report.",
        "The contractor fits the new fan and, within the agreed window, returns the new asset data, the manufacturer's data sheet and the revalidation results to the CDE at S7.",
        "The estates information manager checks the return against the operational EIR, including make, model, serial number, warranty start date and the revised maintenance task.",
        "The new fan record is accepted and aggregated into the AIM, and the old fan record is archived with the date and reason for removal, not deleted.",
      ],
      result: "The theatres reopen with validated ventilation, and the AIM and the maintenance system show the fan that is actually installed.",
      lead: "Facilities / asset manager (estates)",
      tool: { label: "CDE & status codes", path: "/knowledge/iso19650/library/2" },
    },
    {
      title: "Water utility: connecting the AIM to a new CMMS for pumping stations",
      situation: "A regional water utility holds asset data for 140 pumping stations in spreadsheets, survey reports and old drawings. It is introducing a new CMMS and needs one authoritative source for each data item.",
      steps: [
        "The information manager reviews the AIR for pumps, motors, valves and control panels and agrees with operations which attributes the CMMS needs to raise work orders.",
        "For each data set the team records the authoritative source, for example the asset register and condition in the AIM, and work history and spares in the CMMS.",
        "A mapping between AIM attributes and CMMS fields is documented, covering asset identifiers, location codes and classification.",
        "A pilot of five pumping stations is loaded and checked by the operations team. Mismatched identifiers are corrected in the AIM, not in the CMMS.",
        "The integration rules, including what happens when a work order changes asset data, are written into the CDE procedure and the trigger event register.",
        "The remaining stations are loaded in batches, each with a recorded acceptance check.",
      ],
      result: "The CMMS is populated from accepted AIM data, and every data item has a documented master record, so the two systems do not drift apart.",
      lead: "Information manager (asset owner)",
      tool: { label: "Document generator (AIR)", path: "/ai-tools/generate" },
    },
    {
      title: "Office portfolio: auditing the AIM before retendering planned maintenance",
      situation: "A property company owns twelve office buildings and is retendering its planned maintenance contract. Site teams report that the asset lists in the CAFM system do not match what is in the plant rooms.",
      steps: [
        "The asset owner commissions an AIM audit that samples asset records in three buildings and compares them with site walk-down findings.",
        "The audit records missing assets, duplicate records, removed assets that are still live, and out-of-date maintenance documents.",
        "The information manager traces each gap to its cause, for example works completed without an information return, or an event type missing from the trigger event register.",
        "The new operational EIR is written to close those causes: data to be returned after every job, a deadline for each return, and acceptance criteria per asset type.",
        "The tender pack includes the EIR, the information protocol and a cleaned AIM extract as reference information. Bidders must show in their BEP how they will meet the EIR.",
        "An audit interval is set in the asset management plan so that the AIM is sampled again after the first year of the new contract.",
      ],
      result: "The new contract starts from a verified asset list, and the causes of data decay are addressed in the EIR rather than left to the contractor's goodwill.",
      lead: "Appointing party (asset owner)",
      tool: { label: "ISO 19650 templates", path: "/knowledge/iso19650/templates" },
    },
  ],
  faq: [
    {
      q: "What is a trigger event?",
      a: "A trigger event is anything that happens to the asset, planned or unplanned, that means information has to be produced, updated or exchanged. Examples are a planned service, a breakdown, a refurbishment, a change of tenant or a disposal. List each event type in a trigger event register with the information it creates and who provides it.",
    },
    {
      q: "Who maintains the AIM after handover?",
      a: "The appointing party, as asset owner or operator, is accountable for the AIM. In practice an information manager or asset information team keeps it current, while maintenance contractors and other appointed parties provide new information after each trigger event. The contractor who built the asset has no ongoing role unless it is appointed to one.",
    },
    {
      q: "Is the AIM the same as the CAFM system?",
      a: "No. The AIM is the full set of accepted asset information: data, models and documents. A CAFM or CMMS system usually holds part of it in a form that operations teams use every day. Record which system is the authoritative source for each data item so that they do not contradict each other.",
    },
    {
      q: "Does Part 3 only apply to assets delivered under ISO 19650-2?",
      a: "No. Part 3 can be applied to any existing asset, including older buildings with only paper records. The usual first step is to set the AIR, then build or improve the AIM in stages, for example by treating condition surveys as trigger events.",
    },
    {
      q: "Do small reactive repairs really need an EIR?",
      a: "They need information requirements, but not a separate document for every job. A term maintenance contract can carry one operational EIR that states what must be returned for each type of work order. The aim is that even a small repair updates the AIM when it changes an asset's data.",
    },
    {
      q: "Which suitability code is used for operational submissions?",
      a: "Under the UK National Annex, S7 is used for information submitted for AIM authorisation and acceptance. Work shared for information before that can use S2, as in the delivery phase. Once accepted, the information is published, for example with an A code, or a B code where it is accepted with comments.",
    },
    {
      q: "What happens to records for equipment that has been removed?",
      a: "They are archived, not deleted. The archive keeps the asset's history, which matters for warranty claims, incident investigations and future works. Record the date and reason for removal so the archived record can be found and understood later.",
    },
    {
      q: "How often should the AIM be audited?",
      a: "Regular checking is expected good practice, but the interval is for the asset owner to set. Many owners sample critical or high-risk assets every year and the rest on a longer cycle. Set the interval in the asset management plan and record each audit's findings and actions.",
    },
    {
      q: "How does ISO 19650-3 relate to ISO 55001?",
      a: "ISO 55001 sets out the asset management system: how the organisation decides what to do with its assets. ISO 19650-3 manages the information that supports those decisions. Derive the OIR and AIR from the asset management objectives so that the AIM holds what the asset management system actually uses.",
    },
    {
      q: "Who is the appointing party when an asset has several owners or tenants?",
      a: "Agree it for each information set rather than for the whole asset. A landlord may be the appointing party for the structure and shared plant, while a tenant appoints its own fit-out contractor. Write the split into the AIR and the information protocol so each submission goes to the right party for acceptance.",
    },
  ],
  quiz: [
    [
      "A chiller fails and is replaced overnight with a different model. Under Part 3, what is this?",
      ["A project close-out", "An unplanned trigger event", "A tender response", "A level of information need"],
      1,
      "An unplanned event that changes the asset creates a need to exchange information, so it is an unplanned trigger event.",
    ],
    [
      "Where should each trigger event type be listed, with the information it creates and who provides it?",
      ["In the master information delivery plan", "In the clash matrix", "In the trigger event register", "In the security management plan"],
      2,
      "The trigger event register links each event type to its information outputs and the responsible parties.",
    ],
    [
      "A maintenance contractor returns asset data that nobody has checked. What should happen before it is loaded into the CAFM system?",
      ["It is reviewed and accepted through the CDE", "It is loaded now and corrected later", "It is sent back to the original designer", "It is archived straight away"],
      0,
      "Information is reviewed against the EIR and accepted before it is aggregated into the AIM and connected systems.",
    ],
    [
      "What should the appointing party give a new operational appointed party as reference information?",
      ["The full PIM from every past project", "Only the contract price", "Nothing, because the contractor surveys the asset itself", "The relevant extract of the AIM"],
      3,
      "Appointed parties need the part of the AIM that relates to their work, not the whole model or nothing at all.",
    ],
    [
      "Two systems both claim to hold the master asset register. What is the Part 3 fix?",
      ["Switch off the older system", "Document the authoritative source for each data set and the integration between systems", "Let each team choose which one to trust", "Copy both into a spreadsheet"],
      1,
      "Recording the authoritative source and the integration rules stops the systems contradicting each other.",
    ],
    [
      "For how long does the AIM need to be maintained?",
      ["Only until handover", "Only until the asset is sold", "Only during refurbishment projects", "Throughout the asset's operational life"],
      3,
      "Part 3 keeps the AIM current through trigger events for as long as the asset is in use.",
    ],
  ],
};
