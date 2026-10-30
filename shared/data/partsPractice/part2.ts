import type { PartPractice } from "./types";

// ISO 19650-2 practice material. Paraphrased guidance, not the standard's text.

export const part2Practice: PartPractice = {
  part: 2,
  examples: [
    {
      title: "Secondary school: building a pre-appointment BEP for a tender",
      situation: "A contractor is bidding for a new secondary school for a local authority under a design-and-build contract. The tender pack contains an EIR, an information standard and a CDE procedure. The bid team has two weeks to respond.",
      steps: [
        "The bid manager nominates an information manager for the delivery team and names the proposed task team managers for architecture, structures, MEP and landscape.",
        "The information manager reads the EIR line by line and drafts the pre-appointment BEP, covering the proposed approach, federation strategy and a high-level responsibility matrix.",
        "Proposed changes to the client's information standard, such as an extra naming field for phase, are listed in the BEP for the client to consider rather than applied silently.",
        "Each prospective task team completes a capability and capacity assessment, and the results are summarised for the whole delivery team.",
        "The team adds a mobilisation plan and an information delivery risk register, then compiles the tender response.",
      ],
      result: "The local authority receives a complete tender response that it can score against its information management evaluation criteria.",
      lead: "Prospective lead appointed party (information manager)",
      tool: { label: "BEP and plan generator", path: "/ai-tools/plans" },
    },
    {
      title: "Office fit-out: aggregating TIDPs into the MIDP",
      situation: "A commercial landlord appoints a fit-out contractor for six floors of an existing office building. Four task teams, interior design, MEP, fire and AV, each send a delivery schedule in a different format. The client's milestones are stage 4 design and handover.",
      steps: [
        "The lead appointed party issues its own EIR to each appointed party, passing down the client's requirements that apply to their scope.",
        "The information manager issues one TIDP template with fixed columns: container name, level of information need, author, duration, dependencies and milestone.",
        "Each task team manager lists every container their team will produce and flags dependencies, for example the AV layout depending on the ceiling grid from interior design.",
        "The information manager aggregates the TIDPs into the MIDP and checks every container against the detailed responsibility matrix.",
        "Gaps are resolved before the appointment documents are completed: two fire strategy drawings with no author are assigned to the fire task team.",
        "The MIDP is aligned to the client's milestones and incorporated into the appointment along with the confirmed BEP.",
      ],
      result: "One MIDP shows every container, author and date for the fit-out, and each TIDP stays traceable to it when dates change.",
      lead: "Lead appointed party (information manager)",
      tool: { label: "Documents and roles hub", path: "/hubs/documents-roles" },
    },
    {
      title: "Hotel development: testing the CDE during mobilisation",
      situation: "A hotel operator has appointed a lead consultant for a 250-room hotel. The CDE has been set up, but no task team has yet used it. Production is due to start in three weeks.",
      steps: [
        "The information manager confirms that every named person in the BEP has a CDE account with the right role and has completed an induction.",
        "Each task team uploads a test container named to the project naming convention, and the naming check flags two teams using the wrong originator code.",
        "The architect and structural engineer share test models with S1 to check that shared coordinates and federation work as described in the BEP.",
        "The team runs a full mock transition from work in progress to shared, including the QA check and approval step, and records how long it takes.",
        "Problems found, such as a missing approval role for the MEP task team manager, are fixed and the mobilisation record is updated.",
      ],
      result: "Production starts with a tested CDE workflow, working accounts and naming that passes the check first time.",
      lead: "Lead appointed party (information manager)",
      tool: { label: "Naming checker", path: "/tools/naming-check" },
    },
    {
      title: "Light rail depot: a rejected information model at a milestone",
      situation: "A transport authority is building a light rail maintenance depot with a main contractor. At the detailed design milestone the contractor submits the federated model for acceptance. The authority's review finds the maintenance pit equipment has no asset tags.",
      steps: [
        "Before submission the contractor's information manager reviewed the model and authorised it, then submitted it to the authority with S6.",
        "The authority's information manager reviews the model against the EIR acceptance criteria and finds the asset tagging requirement is not met.",
        "The authority rejects the submission, records the reason against the specific EIR requirement and agrees a resubmission date.",
        "The contractor returns the affected containers to work in progress, the MEP task team adds the tags, and the containers pass the QA check again before sharing.",
        "The lead appointed party re-authorises the model and resubmits it, and the authority accepts it into the published state as A3.",
        "The information manager logs the cause in the lessons learned register so the tagging check is added to the QA checklist for future milestones.",
      ],
      result: "The depot model is accepted with complete asset tags, and the rejection, its reason and the fix are all on record.",
      lead: "Appointing party (information manager)",
      tool: { label: "Model QA/QC checks", path: "/model-tools/qaqc" },
    },
  ],
  faq: [
    {
      q: "Is a BEP required for small appointments?",
      a: "Yes, but it can be short. Part 2 expects every delivery team to explain how it will meet the EIR. For a small appointment the BEP might be a few pages that combine the responsibility matrix and delivery plan, as long as each required item can still be found.",
    },
    {
      q: "What is the difference between authorisation and acceptance?",
      a: "Authorisation is the lead appointed party's decision that the information model is ready to submit. Acceptance is the appointing party's decision that it meets the EIR. They are two separate gates with separate records, and either can reject with reasons.",
    },
    {
      q: "Can the EIR change after appointment?",
      a: "Yes, but through a controlled change, not by email. A change to the EIR can affect the BEP, the MIDP, fees and programme, so it should go through the appointment's change process and the affected plans should be reissued.",
    },
    {
      q: "Does the lead appointed party need to write its own EIR?",
      a: "Yes, where it appoints other parties. The lead appointed party passes the relevant client requirements down to each appointed party in its own EIR and adds any of its own. Without it, subconsultants often have no clear acceptance criteria.",
    },
    {
      q: "Who signs off the MIDP?",
      a: "The lead appointed party builds and owns the MIDP by aggregating the TIDPs. It is then agreed with the appointing party and incorporated into the appointment, so changes to it later should be agreed and recorded.",
    },
    {
      q: "Which suitability code should a model carry when it is submitted for authorisation?",
      a: "Under the UK National Annex, S6 is used for information submitted for PIM authorisation at a stage. Once the appointing party accepts it, it moves to published with an A code, or B where it is accepted with comments. As-built records at the end carry CR.",
    },
    {
      q: "Can we skip mobilisation if the team has used the same CDE before?",
      a: "You can shorten it, but do not skip it. Each project has its own naming fields, coordinates, roles and approval steps. A one-day test exchange usually finds problems that would otherwise appear in the first live milestone.",
    },
    {
      q: "Who should carry out the QA check before information is shared?",
      a: "The task team that produced the information. The QA check confirms naming, metadata and format against the information standard. The content review and approval for sharing then follows, normally by the task team manager or someone they delegate.",
    },
    {
      q: "What happens to the information model at project close-out?",
      a: "The PIM is archived in line with the agreed access, retention and future-use requirements, and the information the appointing party needs for operation is handed into the AIM. Lessons learned from both sides are compiled for future projects.",
    },
    {
      q: "Is the pre-appointment BEP binding?",
      a: "Not as it stands. It is a tender submission used to evaluate the bid. After appointment the BEP is confirmed with named people and an agreed federation strategy, and that confirmed version becomes part of the appointment documents.",
    },
  ],
  quiz: [
    [
      "A bidder wants to propose an extra naming field for phase. Where should it record this?",
      ["In the pre-appointment BEP as a proposed change to the information standard", "Directly in the client's information standard", "In the lessons learned log", "Nowhere, because the standard cannot change"],
      0,
      "Proposed amendments go in the pre-appointment BEP so the appointing party can agree them.",
    ],
    [
      "The appointing party rejects an information model at a milestone. What must the rejection include?",
      ["A new fee proposal", "Recorded reasons linked to the requirements not met", "A new CDE", "A replacement lead appointed party"],
      1,
      "Rejections need clear reasons so the delivery team knows what to fix before resubmitting.",
    ],
    [
      "During which activity are the TIDPs aggregated into the MIDP?",
      ["Tender response", "Mobilisation", "Appointment", "Collaborative production of information"],
      2,
      "TIDPs and the MIDP are established during appointment and incorporated into the appointment documents.",
    ],
    [
      "A task team shares a model for coordination with other teams. Which suitability code is most appropriate?",
      ["A1", "CR", "S6", "S1"],
      3,
      "S1 indicates information suitable for coordination in the shared state.",
    ],
    [
      "Who is responsible for establishing the project's information protocol?",
      ["The appointing party", "Each task team manager", "The CDE software vendor", "The BIM coordinator of the architect"],
      0,
      "The appointing party sets the protocol during assessment and need so it can be included in each appointment.",
    ],
    [
      "Which of these should be in place before the appointing party issues the invitation to tender?",
      ["The MIDP", "The project CDE", "The confirmed BEP", "The task teams' TIDPs"],
      1,
      "The appointing party establishes the CDE during assessment and need, so tenderers can plan against it; the other items come after appointment.",
    ],
  ],
};
