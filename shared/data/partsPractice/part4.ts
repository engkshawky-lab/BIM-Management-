// ISO 19650-4 practice material: information exchange.
// Paraphrased guidance, not the standard's text. No clause numbers are cited for Part 4.
import type { PartPractice } from "./types";

export const part4Practice: PartPractice = {
  part: 4,
  examples: [
    {
      title: "Metro line extension: acceptance review of a station container set",
      situation: "A metro authority receives the information container set for a new underground station at the end of a design stage. The lead appointed party has authorised it and submitted it at S6, and the authority's review team has ten working days to respond.",
      steps: [
        "The authority's information manager lists the containers expected at this exchange from the MIDP and compares that list with what was actually submitted.",
        "Container-level checks are run on every file: name against the information standard, S6 status, revision on the agreed convention, agreed format and file integrity.",
        "Content checks follow the EIR acceptance criteria: the IFC models are checked for the required property sets, and the drawings and reports for scope and completeness.",
        "Reviewers record each finding against the container it relates to, and separate blocking issues from comments.",
        "The authority records a decision for each container in the CDE: accepted, accepted with comments, or rejected with reasons.",
      ],
      result: "The authority has a container-by-container acceptance record linked to the EIR, and the lead appointed party knows exactly which items to fix.",
      lead: "Appointing party (information manager)",
      tool: { label: "IFC Hub", path: "/model-tools/ifc" },
    },
    {
      title: "Retail mall extension: COBie and IFC exchange at handover",
      situation: "A shopping mall owner is taking handover of a new extension with escalators, sprinklers and HVAC serving 40 shop units. The FM team needs asset data it can load into its CAFM system, and models it can use for future fit-out works.",
      steps: [
        "At mobilisation the owner and contractor agreed the exchange: COBie for asset data, IFC with a stated schema version and model view for the models, and searchable PDF for O&M documents.",
        "The contractor's BIM coordinator runs COBie checks before sharing: required sheets present, unique component names, and complete type and system links.",
        "The IFC models are checked against the handover IDS so that component identifiers in the models match the component names in COBie.",
        "The lead appointed party authorises the set and submits it at S7 for AIM authorisation and acceptance.",
        "Before accepting, the owner's FM team test-loads the COBie file into a copy of the CAFM system. Two systems fail to import because their names do not match the component list.",
        "The contractor corrects the system names and resubmits a new revision, which is accepted and published with a CR code as the as-constructed record.",
      ],
      result: "The CAFM system is populated from data that has already loaded once in test, and the models and asset register use the same identifiers.",
      lead: "Lead appointed party (BIM coordinator)",
      tool: { label: "COBie data checker", path: "/ai-tools/cobie" },
    },
    {
      title: "Airport apron works: a rejected submission and its resubmission",
      situation: "A contractor resurfacing an airport apron submits its airfield ground lighting drawings and cable schedule for acceptance. The airport's reviewer rejects the package within a day.",
      steps: [
        "The reviewer records three issues: six drawings still carry S2 instead of the status required for the submission, two drawings show a different revision in the title block from the CDE metadata, and the cable schedule omits the circuit numbers required by the EIR.",
        "The rejection is recorded in the CDE with a reason against each container, so the contractor does not have to guess what is wrong.",
        "The contractor's task team corrects the metadata, adds the missing circuit numbers, and runs a naming and metadata check across the whole package, not only the flagged files.",
        "The corrected containers are approved for sharing again, authorised by the lead appointed party, and resubmitted with new revisions.",
        "The reviewer checks the changes against the original rejection reasons, then accepts the package. The rejected revisions are kept in the archive.",
      ],
      result: "The package is accepted at the second submission, and the CDE log shows the rejection, its reasons and the fix.",
      lead: "Lead appointed party (information manager)",
      tool: { label: "File naming checker", path: "/tools/naming-check" },
    },
    {
      title: "Hospital wing: agreeing exchange formats and structured data",
      situation: "A health authority is appointing a delivery team for a new cancer care wing. On its last project, asset data arrived as hundreds of scanned PDFs that the estates team could not use.",
      steps: [
        "The appointing party's information manager lists who will receive each type of information and which systems they use: the estates CAFM system, the medical equipment database and the document management system.",
        "For each information type the team decides whether it must be structured or can be unstructured: asset attributes and room data as structured data, O&M manuals and certificates as searchable PDF documents.",
        "The exchange formats and versions are written into the information standard: IFC with a stated schema version and model view, COBie for asset data, and native files only where the EIR asks for them.",
        "Acceptance criteria are added to the EIR so that each structured data set can be validated, for example the required attributes per asset type and the classification to use.",
        "During mobilisation the lead appointed party sends a sample exchange, and the estates team confirms that it loads into its systems before production starts.",
      ],
      result: "Formats and data structures are agreed before any information is produced, so later acceptance reviews test against criteria that everyone signed up to.",
      lead: "Appointing party (information manager)",
      tool: { label: "ISO 19650 templates", path: "/knowledge/iso19650/templates" },
    },
  ],
  faq: [
    {
      q: "What does acceptance check that authorisation does not?",
      a: "Authorisation is the lead appointed party checking that the delivery team's federated information is coordinated, complete and ready to submit. Acceptance is the appointing party checking that it meets the appointing party's own EIR and is fit for the purpose it was requested for. The same container passes both gates, but the reviewer and the question asked are different.",
    },
    {
      q: "Can an exchange be accepted with comments?",
      a: "Yes. Under the UK National Annex, a B code shows that information is partially accepted, with comments still to be addressed. Agree in advance what may be relied on while comments are open, and track each comment until it is closed and the container is reissued.",
    },
    {
      q: "Is COBie mandatory?",
      a: "No. ISO 19650 does not require COBie or any other specific format. COBie is needed only when the appointing party specifies it, usually in the EIR or information standard. What the standard does expect is that exchange formats are agreed and stated before production.",
    },
    {
      q: "Does specifying IFC make an exchange open and interoperable?",
      a: "Not on its own. State the schema version and model view, and check that the receiving party's software can read and validate the file. An IFC file that the receiver cannot use is no more useful than a proprietary file.",
    },
    {
      q: "What is the difference between structured and unstructured information?",
      a: "Structured information follows a defined schema that software can read, such as COBie, IFC properties or a database table. Unstructured information is a document, such as a PDF manual or a photograph. Asset attributes that systems need to use should be structured; supporting evidence can stay as documents linked to the asset they describe.",
    },
    {
      q: "Who sets the review criteria for each exchange?",
      a: "The appointing party sets the acceptance criteria through the EIR. The lead appointed party sets the criteria for authorisation and for task team sharing in its own procedures, within the project information standard. All criteria should be agreed before production so that nobody is surprised at review.",
    },
    {
      q: "What should a rejection record contain?",
      a: "The container and revision rejected, who reviewed it and when, and the reason against each failed criterion. A rejection without reasons forces guesswork and often leads to a second rejection. Keep the rejected revision in the CDE rather than overwriting it.",
    },
    {
      q: "Can the review criteria change halfway through a stage?",
      a: "They can, but only as a recorded change to the EIR or information standard that the affected parties are told about. Applying new criteria without notice at a review is unfair to the delivery team and hard to defend in a dispute.",
    },
    {
      q: "Does Part 4 also apply to exchanges during operation?",
      a: "Yes. The same container-level and content-level checks apply when a maintenance contractor submits information for the AIM. In operation the exchanges are smaller and more frequent, so lighter and partly automated checks are often used.",
    },
    {
      q: "What is IDS and how does it help an exchange review?",
      a: "IDS (Information Delivery Specification) is a buildingSMART format for writing information requirements so that software can check them. It lets reviewers test an IFC model automatically for required entities, properties and values. It speeds up content checks, but a person still has to judge whether the information is fit for purpose.",
    },
  ],
  quiz: [
    [
      "Which of these is a container-level check rather than a content-level check?",
      ["Clash status between disciplines", "Whether the file name follows the information standard", "Completeness against the EIR", "Geometry detail against the level of information need"],
      1,
      "Container-level checks look at the container itself, such as its name, metadata, format and integrity.",
    ],
    [
      "A submission is acceptable but has minor comments to close out. Under the UK National Annex, which code fits?",
      ["S0, work in progress", "S3, suitable for review and comment", "An A code, accepted", "A B code, partially accepted with comments"],
      3,
      "B codes show partial acceptance with comments that must be tracked to close-out.",
    ],
    [
      "An EIR asks for IFC but states no schema version or model view. What is the main risk?",
      ["The receiver may not be able to read or validate the file as intended", "The file cannot be given a name", "The file becomes a proprietary format", "The suitability code becomes invalid"],
      0,
      "Without a stated version and model view, sender and receiver may be working to different expectations of the same format.",
    ],
    [
      "A reviewer rejects a container. What must the rejection record include?",
      ["Only the date of the review", "The reviewer's opinion of the author", "The reason against each failed criterion", "A new file name chosen by the reviewer"],
      2,
      "Recorded reasons tell the author exactly what to fix and give an audit trail of the decision.",
    ],
    [
      "When should the review criteria for an exchange be agreed?",
      ["Before the information is produced", "At the acceptance review itself", "After the first rejection", "At project close-out"],
      0,
      "Criteria agreed before production let the delivery team check its own work against the same tests the reviewer will use.",
    ],
    [
      "An automated model check passes with no errors. What else is needed before acceptance?",
      ["Nothing, because automated checks are sufficient", "Changing the status to S0", "Deleting the previous revision", "A human review of fitness for purpose"],
      3,
      "Automated checks support the review, but a person must still judge whether the information is fit for its purpose.",
    ],
  ],
};
