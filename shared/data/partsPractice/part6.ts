import type { PartPractice } from "./types";

export const part6Practice: PartPractice = {
  part: 6,
  examples: [
    {
      title: "Secondary school: designing out roof access hazards",
      situation: "A local authority is designing a new secondary school with roof-mounted plant and large rooflights. Early models show that maintenance staff would have to cross fragile rooflights to reach the air handling units. The client wants hazards removed in design and the remaining risks recorded where people will see them.",
      steps: [
        "The client's EIR asks for structured hazard records linked to model objects at each design stage, using an agreed set of fields.",
        "At a design review, the principal designer (the UK CDM duty holder, used here as the example) leads a hazard session with the architect and building services engineer.",
        "The team moves the plant to a ground-level compound and specifies non-fragile rooflights, eliminating the fall-through hazard rather than adding barriers.",
        "Remaining risks, such as working near the roof edge to clean gutters, are recorded against the roof objects with mitigation, residual risk, owner and status.",
        "The decisions and the updated records are shared in the CDE and noted in the BIM meeting minutes.",
        "The information manager checks at authorisation that every significant hazard has an owner and is linked to an object or space.",
      ],
      result: "The main fall-through hazard is removed in design, and the remaining roof risks are attached to the roof objects that the contractor and school estates team will use.",
      lead: "Principal designer, with the lead designer",
      tool: { label: "Information delivery risk register", path: "/ai-tools/risks" },
    },
    {
      title: "Office refurbishment: relying on existing asbestos and fragile roof records",
      situation: "A property owner is refurbishing a 1970s office building that it has operated for years. Its asset information includes an asbestos register and a survey marking fragile roof sheets, but these sit in old PDF reports. The design team and contractor need to know exactly where these hazards are before any intrusive work.",
      steps: [
        "The appointing party pulls the asbestos register and roof survey from the AIM and checks their dates and scope before issuing them.",
        "The EIR asks the design team to turn the survey findings into structured risk records linked to rooms and roof zones in the existing-conditions model.",
        "Where the records are incomplete, the client commissions a refurbishment survey of the areas to be disturbed before design is fixed.",
        "Designers plan the strip-out and new service routes to avoid known asbestos where possible, and record each decision.",
        "The contractor receives filtered views of the hazard locations in each work zone before starting, and site-identified findings are fed back as managed revisions.",
        "At completion, the updated records go back into the AIM so the next project starts from current information.",
      ],
      result: "Intrusive work starts with known hazard locations, and the owner ends up with an up-to-date, model-linked record instead of an old PDF.",
      lead: "Appointing party (property owner's asset manager)",
      tool: { label: "Project data", path: "/project-data" },
    },
    {
      title: "Multi-storey car park: temporary works and safe access planning",
      situation: "A contractor is building a precast concrete car park next to a live road. The erection sequence relies on temporary propping, and crane lifts pass close to the public footpath. The site team needs to see where the temporary works and exclusion zones are at each stage, not just in a written method statement.",
      steps: [
        "The temporary works coordinator registers each temporary works item, such as propping and edge protection, with its design check status in the CDE.",
        "The BIM coordinator models the temporary works and crane exclusion zones as separate objects, linked to the construction sequence.",
        "Risk records for each lift and each propping stage are attached to those objects, with the control measures and the person responsible.",
        "Before each shift, the site manager uses the sequenced model to brief the gangs on access routes, exclusion zones and props that must not be removed.",
        "When the precast supplier changes the erection order, the risk records and the sequence are updated as a new revision and shared again, instead of being changed by hand on site.",
        "Removal of temporary works is only recorded as complete after the permanent works are confirmed as able to carry the load.",
      ],
      result: "Site teams see the current temporary works and exclusion zones for each stage, and every change to the sequence leaves a revision trail.",
      lead: "Contractor (temporary works coordinator, with the BIM coordinator)",
      tool: { label: "Model QA/QC", path: "/model-tools/qaqc" },
    },
    {
      title: "Acute hospital handover: residual risks in the AIM for maintenance teams",
      situation: "A hospital trust is receiving a new clinical block with high-voltage switchrooms, medical gas systems and plant in confined ceiling voids. Maintenance staff work around patients and need to know isolation points and residual risks before opening up any area. In previous projects this information was lost inside O&M manuals.",
      steps: [
        "The trust's AIR lists the health and safety information it needs in operation, such as isolation points, confined spaces and permit-to-work requirements.",
        "The information handover strategy states that residual risks must be delivered as structured data linked to assets and spaces, not only in manuals.",
        "The contractor adds the residual risk fields to the asset data exchange, so each asset record carries its hazards and controls.",
        "The information manager checks the handover data against the acceptance criteria: every risk record has an owner, a status and a linked asset or space.",
        "The trust loads the data into its maintenance system, so a work order for a valve shows the related isolation and confined-space risks.",
        "Estates staff are given a short walk-through of where to find the information and how to report a new hazard.",
      ],
      result: "Maintenance teams see the relevant risks on each work order, and the trust can update them when the building changes.",
      lead: "Information manager (lead appointed party), with the trust's estates team",
      tool: { label: "COBie tools", path: "/ai-tools/cobie" },
    },
  ],
  faq: [
    {
      q: "How does Part 6 relate to the health and safety file?",
      a: "In the UK, the health and safety file is a legal requirement under the CDM Regulations, and the duties stay with the duty holders. Part 6 does not replace it; it gives a structured way to produce and manage the information that can feed it. With the client's agreement, much of the file can be delivered as structured data in the AIM rather than as a stack of reports.",
    },
    {
      q: "What goes into a risk information cycle?",
      a: "In practice it is a repeating loop: identify the hazard, assess it, eliminate or reduce it, record what remains, share it, use it on site or in operation, and update it when something changes. The loop runs at every design stage, through construction and during operation. Each pass should leave a revision in the CDE, so you can see how the risk developed.",
    },
    {
      q: "Do we need special software to deliver structured risk information?",
      a: "No. A spreadsheet or database with agreed fields and a reliable link to object or space identifiers can meet the need. Model properties or IFC property sets help with visualisation, but consistency of fields and identifiers matters more than the tool.",
    },
    {
      q: "Should every hazard be recorded in the model?",
      a: "No. Focus on significant and unusual risks, and on those a competent contractor or operator would not expect. Listing every routine hazard buries the important ones and makes the records harder to use.",
    },
    {
      q: "Who owns a risk record when several designers contribute to the same hazard?",
      a: "Agree one owner for each record, usually the designer whose decision most affects the risk, and record the others as contributors. The owner keeps the record current and agrees changes with the others. Write the ownership rule in the information protocol or BEP so it is clear before disputes arise.",
    },
    {
      q: "How do we link risk records to model objects so the links survive revisions?",
      a: "Use stable identifiers, such as IFC GUIDs, agreed asset tags or space codes, rather than element IDs from native software that may change. Check a sample of links at each authorisation. If an object is replaced, the record should move to the new object as a managed change.",
    },
    {
      q: "How do site operatives who never open a model get the information?",
      a: "Provide it in the form they use: filtered views on tablets, marked-up drawings, briefing sheets or labels on site. The structured record is the source; the format of the output should suit the people facing the risk. Give it to them before the work starts, not after.",
    },
    {
      q: "Does Part 6 apply to existing buildings and operation?",
      a: "Yes. It covers the whole life cycle, including maintenance, refurbishment and demolition. Risk information in the AIM should be updated on trigger events, such as a new survey, an incident or a change of use.",
    },
    {
      q: "Can health and safety information also be sensitive under Part 5?",
      a: "Yes. The location of hazardous chemicals, gas stores or critical isolation points could be misused, so it should be covered by the security triage. The balance is that people who face the risk must still receive the information, so restrict wide publication, not the safety briefing.",
    },
    {
      q: "How do we check risk information before accepting it?",
      a: "Set acceptance criteria in the EIR, such as required fields complete, owner and status set, a link to an object or space, and plain wording. Check against them at authorisation and acceptance, as you would for any other container. Return records that fail, with a clear reason.",
    },
  ],
  quiz: [
    [
      "What is residual risk?",
      ["A hazard that was eliminated during design", "Risk that remains after design and other measures have been applied", "A risk that only affects demolition", "The total of all risks on the project"],
      1,
      "Residual risk is what remains after measures are applied, and it must be communicated to the people who will face it.",
    ],
    [
      "Which way of holding risk information best fits Part 6?",
      ["Notes on drawings only", "A narrative report issued at handover", "Structured records linked to model objects, spaces or locations", "Emails between designers"],
      2,
      "Part 6 favours structured records that can be linked, filtered and exchanged through the CDE.",
    ],
    [
      "Where should the appointing party first set out its health and safety information needs?",
      ["In its information requirements, such as the AIR, PIR and EIR", "In the contractor's method statements", "In the clash detection report", "In the CDE folder names"],
      0,
      "Health and safety information is requested through the same requirements hierarchy as other information.",
    ],
    [
      "The contractor changes the erection sequence on site. What should happen to the related risk records?",
      ["Nothing until handover", "They are corrected by hand on the printed drawings", "They are deleted and rewritten at close-out", "They are updated as a managed revision and fed back to the design team"],
      3,
      "Changes to risk information are treated as managed revisions, and site findings are fed back to designers.",
    ],
    [
      "Does ISO 19650-6 replace legal health and safety duties such as those under the UK CDM Regulations?",
      ["Yes, it replaces them completely", "Yes, but only on public projects", "No, information responsibilities are mapped to the existing duty holders", "No, because it only applies to design"],
      2,
      "The standard supports legal duties with structured information; it does not take them over.",
    ],
    [
      "Why should risk records focus on significant and unusual risks?",
      ["So important information is not lost among trivial entries", "Because routine hazards are not allowed in the CDE", "To keep the model file smaller", "Because only designers may record risks"],
      0,
      "Filling the register with routine hazards hides the risks that people most need to know about.",
    ],
  ],
};
