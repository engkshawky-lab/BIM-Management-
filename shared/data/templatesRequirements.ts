// Full-length appointing-party templates (OIR, AIR, EIR, information standard, CDE procedure,
// information protocol). Generic wording; structure follows ISO 19650-2 §5.1–5.2 and common EIR
// appendix practice. Field ids are kept stable so documents saved from earlier versions still load.
import type { DocTemplate, TemplateField, TemplateSection } from "./types";

const text = (id: string, label: string, hint?: string, defaultValue?: string): TemplateField => ({ id, label, type: "text", hint, defaultValue });
const area = (id: string, label: string, hint?: string, defaultValue?: string): TemplateField => ({ id, label, type: "textarea", hint, defaultValue });
const select = (id: string, label: string, options: string[]): TemplateField => ({ id, label, type: "select", options, defaultValue: options[0] });
const table = (id: string, label: string, columns: string[], defaultRows: string[][] = [], hint?: string): TemplateField => ({ id, label, type: "table", columns, defaultRows, hint });
const sec = (id: string, title: string, guidance: string, fields: TemplateField[]): TemplateSection => ({ id, title, guidance, fields });

export function requirementsTemplates(projectInfo: TemplateSection, orgInfo: TemplateSection): DocTemplate[] {
  const statusCodes = [
    ["S0", "WIP", "Work in progress — initial status", "Task team only"], ["S1", "Shared", "Suitable for coordination", "Delivery team"],
    ["S2", "Shared", "Suitable for information", "Delivery team"], ["S3", "Shared", "Suitable for review and comment", "Delivery team / appointing party"],
    ["S4", "Shared", "Suitable for stage approval", "Appointing party"], ["S6", "Shared", "Suitable for PIM authorization", "Appointing party"],
    ["S7", "Shared", "Suitable for AIM authorization", "Appointing party"], ["A1–An", "Published", "Authorized and accepted for stage n", "All"],
    ["B1–Bn", "Published", "Partially signed off, with minor comments", "All"], ["CR", "Published", "As constructed record", "All"],
  ];
  return [
    {
      id: "oir", standard: "iso19650", code: "OIR", category: "Requirements", title: "Organizational Information Requirements",
      purpose: "Captures the strategic information the appointing party needs to run its business and its asset portfolio, and which later drives the AIR and PIR.",
      clauseRefs: ["19650-1 §5.2", "19650-3 §5.1"],
      sections: [
        orgInfo,
        sec("context", "Organizational context", "Why the organization needs information about its assets, and who uses it.", [
          area("drivers", "Business drivers", undefined, "Reduce whole-life cost of the asset portfolio\nMeet statutory and regulatory obligations\nImprove space utilization and service quality\nSupport capital investment decisions with reliable data"),
          table("stakeholders", "Information stakeholders", ["Stakeholder / function", "Interest", "Decisions they make"], [["Executive / board", "Portfolio performance and risk", "Investment and disposal"], ["Asset management", "Condition, lifecycle and risk", "Renewal and maintenance plans"], ["Facilities management", "Day-to-day operation", "Planned and reactive maintenance"], ["Finance", "Asset value and cost", "Budgets and depreciation"], ["Health, safety & environment", "Compliance and incidents", "Statutory inspections and permits"]]),
        ]),
        sec("objectives", "Strategic objectives", "List the organizational objectives information must support and the decision each one informs.", [
          table("objectives", "Objectives", ["Objective", "Decision supported", "Information needed", "Owner"], [["Reduce operational cost", "Annual maintenance budgeting", "Asset condition and maintenance history", "Facilities director"], ["Demonstrate compliance", "Inspection and certification programme", "Statutory asset register and certificates", "HSE manager"], ["Plan capital renewal", "Five-year capital plan", "Asset age, condition and replacement cost", "Asset manager"]]),
        ]),
        sec("functions", "Business functions", "Business functions that consume asset information.", [
          area("functions", "Functions", undefined, "Strategic planning\nAsset management\nFinance & reporting\nHealth & safety\nRegulatory compliance"),
        ]),
        sec("plainQuestions", "Plain language questions", "Questions the organization must be able to answer at each decision point; each becomes a requirement in the AIR or EIR.", [
          table("questions", "Plain language questions", ["Ref", "Question", "Decision point", "Answered by (AIR / PIR)"], [["PLQ-01", "What assets do we own, where are they and what condition are they in?", "Annual asset review", "AIR"], ["PLQ-02", "Does the design meet the agreed brief and budget?", "Design stage gates", "PIR"], ["PLQ-03", "What maintenance is due and what will it cost?", "Annual budgeting", "AIR"]]),
        ]),
        sec("systems", "Enterprise systems", "Systems that hold or will receive asset information, so requirements can name the target format.", [
          table("systems", "Systems", ["System", "Purpose", "Owner", "Data exchange format"], [["CAFM / CMMS", "Maintenance management", "", "COBie / spreadsheet"], ["Enterprise asset management", "Asset register and lifecycle", "", "API / spreadsheet"], ["GIS", "Location and spatial data", "", "Shapefile / GeoJSON"], ["Document management", "Records and certificates", "", "PDF / native"]]),
        ]),
        sec("governance", "Governance and review", "How the OIR is owned, reviewed and kept consistent with the AIR and project requirements.", [
          area("governanceText", "Governance arrangements", undefined, "The OIR is owned by the appointing party's information lead, reviewed annually and whenever organizational objectives change. Changes are cascaded to the AIR and to the EIR of current appointments."),
        ]),
      ],
    },
    {
      id: "air", standard: "iso19650", code: "AIR", category: "Requirements", title: "Asset Information Requirements",
      purpose: "Defines the managerial, commercial and technical information needed about assets, feeding the asset information model (AIM).",
      clauseRefs: ["19650-1 §5.3", "19650-3 §5.1.5"],
      sections: [
        projectInfo,
        sec("scope", "Scope and purpose", "Which assets and systems this AIR covers and how it traces to the OIR.", [
          area("scopeText", "Scope", undefined, "Applies to all maintainable assets, spaces and systems delivered by the project. Each requirement traces back to an organizational information requirement (OIR)."),
          table("assetScope", "Asset categories in scope", ["Category", "Examples", "Maintainable", "Tagged"], [["Spaces and zones", "Rooms, floors, fire zones", "No", "No"], ["Building fabric", "Doors, windows, roofs", "Yes", "Selected"], ["Mechanical", "AHU, pumps, chillers, fans", "Yes", "Yes"], ["Electrical", "Panels, transformers, generators", "Yes", "Yes"], ["Public health & fire", "Sprinklers, pumps, alarms", "Yes", "Yes"], ["External works & infrastructure", "Lighting, drainage, roads", "Yes", "Selected"]]),
        ]),
        sec("assets", "Asset types and attributes", "For each asset type, define required attributes, format and source.", [
          table("assetReqs", "Asset requirements", ["Asset type", "Attribute", "Format", "Source stage", "Purpose (OIR ref)"], [
            ["AHU", "Manufacturer, model, serial no.", "COBie", "Construction", "Maintenance planning"],
            ["Door", "Fire rating", "IFC Pset", "Design", "Compliance"],
            ["Pump", "Duty, power, warranty start and duration", "COBie", "Handover", "Lifecycle costing"],
            ["Space", "Name, number, area, usage", "IFC / COBie", "Design", "Space management"],
          ]),
        ]),
        sec("tagging", "Asset tagging and identification", "How assets are identified so the same reference appears in the model, on site labels and in the CAFM system.", [
          area("tagFormat", "Tag format", "Use the asset tag builder to check codes", "Site–Building–Level–System–Type–Number, unique across the portfolio; the same tag is used in the model, on the physical label and in the CAFM system."),
          text("labelSpec", "Physical label specification", undefined, "Durable label with tag text and QR code, fixed in a visible position"),
        ]),
        sec("aimFormat", "AIM structure and handover", "Define the target CAFM/EAM system, structure and exchange format.", [
          text("targetSystem", "Target CAFM / EAM system"),
          select("exchangeFormat", "Exchange format", ["COBie (xlsx)", "IFC 4.3", "IFC 2x3", "Native + COBie", "Custom spreadsheet"]),
          text("classification", "Classification system", undefined, "Uniclass 2015"),
          table("documents", "Asset documentation", ["Document", "Format", "Linked to", "Stage"], [["O&M manuals", "PDF", "Asset type", "Handover"], ["Warranties and guarantees", "PDF", "Asset", "Handover"], ["Test and commissioning certificates", "PDF", "System / asset", "Commissioning"], ["As-built drawings", "PDF + native", "Space / system", "Handover"], ["Spare parts lists", "Spreadsheet", "Asset type", "Handover"]]),
        ]),
        sec("drops", "Information exchanges", "When asset information is delivered and verified before handover.", [
          table("exchanges", "Asset information exchanges", ["Exchange", "Stage", "Content", "Verified by"], [["Design data drop", "Detailed design", "Spaces, systems and asset types", "Information manager"], ["Construction data drop", "Construction", "Installed assets with manufacturer data", "Information manager"], ["Handover data drop", "Handover", "Complete COBie, documents and tags", "Appointing party"]]),
        ]),
        sec("quality", "Data quality and acceptance", "Checks the asset information must pass before it is accepted into the AIM.", [
          area("dataQuality", "Acceptance checks", undefined, "COBie validated without errors against the project picklists\nEvery maintainable asset has a unique tag that matches the site label\nAll required attributes populated for the stage\nDocuments linked and readable\nSample site verification of installed assets"),
        ]),
      ],
    },
    {
      id: "eir", standard: "iso19650", code: "EIR", category: "Requirements", title: "Exchange Information Requirements",
      purpose: "Sets out the appointing party's information requirements for an appointment: what, when, how and to what level of need.",
      clauseRefs: ["19650-2 §5.2.1", "19650-2 §5.1"],
      sections: [
        projectInfo,
        sec("intro", "Introduction and scope", "Purpose of the EIR, the appointment it applies to and the documents it should be read with.", [
          area("introText", "Purpose and scope", undefined, "This document sets out the information the appointing party requires from the appointed parties, and the standards, methods and procedures they must follow, in line with ISO 19650-2. It forms part of the appointment."),
          table("references", "Related documents", ["Document", "Reference", "Revision"], [["Organizational information requirements (OIR)", "", ""], ["Asset information requirements (AIR)", "", ""], ["Project information standard", "", ""], ["CDE workflow & procedure", "", ""], ["Information protocol", "", ""]]),
          area("definitions", "Definitions and abbreviations", undefined, "Terms and abbreviations follow ISO 19650-1 and the portal glossary."),
        ]),
        sec("info-reqs", "Information requirements", "Requirements derived from OIR / AIR / PIR, including purposes and key decision points.", [
          table("purposes", "Information purposes", ["Purpose", "Key decision point", "Information required", "LOIN reference"], [
            ["Design coordination", "Stage 3 sign-off", "Federated discipline models", "LOIN-03"],
            ["Cost planning", "Stage 2 / 3 / 4", "Quantities by element", "LOIN-02"],
            ["Asset handover", "Practical completion", "COBie + O&M", "LOIN-06"],
          ]),
          table("bimUses", "Required BIM uses", ["Use", "Stage", "Required"], [["Design authoring", "All design stages", "Yes"], ["3D coordination and clash detection", "Design and construction", "Yes"], ["Quantity take-off", "Design", "Yes"], ["4D programme simulation", "Construction", "Optional"], ["Record (as-built) modelling", "Handover", "Yes"], ["Asset information (COBie)", "Handover", "Yes"]]),
        ]),
        sec("loin", "Level of information need", "Define geometry, alphanumeric information and documentation per milestone (ISO 7817-1).", [
          table("loin", "LOIN matrix", ["Ref", "Milestone", "Geometry", "Alphanumeric", "Documentation"], [
            ["LOIN-02", "Concept", "Massing, indicative", "Area, function", "Design statement"],
            ["LOIN-03", "Spatial coordination", "Coordinated systems", "Type properties", "GA drawings"],
            ["LOIN-06", "Handover", "As-built", "COBie complete", "O&M manuals"],
          ]),
        ]),
        sec("milestones", "Information delivery milestones", "Align with the project programme and decision points.", [
          table("milestones", "Milestones", ["Milestone", "Date", "Information deliverable", "Acceptance criteria"]),
          table("exchangeSchedule", "Information exchange schedule", ["Deliverable", "Format", "Frequency / milestone", "Recipient"], [["Discipline models", "IFC + native", "Each milestone", "Appointing party"], ["Federated coordination model", "NWD / IFC", "Weekly", "Delivery team"], ["Drawings", "PDF + DWG", "Each milestone", "Appointing party"], ["Clash and issue reports", "BCF / PDF", "Weekly", "Delivery team"], ["Asset information", "COBie", "Design, construction, handover", "Appointing party"]]),
        ]),
        sec("standards", "Information standard, methods and procedures", "Reference the project information standard and production methods.", [
          text("naming", "Naming convention", undefined, "ISO 19650-2 national annex field structure"),
          text("cde", "CDE platform", "e.g. Autodesk Construction Cloud, Viewpoint, ProjectWise"),
          select("format", "Primary exchange format", ["IFC 4.3", "IFC 4", "IFC 2x3", "Native + IFC"]),
          text("units", "Units & coordinates", undefined, "Metric (mm), project base point per survey"),
          text("classificationSystem", "Classification system", undefined, "Uniclass 2015"),
          table("software", "Software and versions", ["Discipline", "Authoring software", "Minimum version", "Exchange format"], [["Architecture", "", "", "IFC"], ["Structure", "", "", "IFC"], ["MEP", "", "", "IFC"], ["Infrastructure", "", "", "IFC / LandXML"], ["Coordination", "", "", "NWD / BCF"]]),
        ]),
        sec("resources", "Reference information and shared resources", "Information the appointing party provides, and shared resources every task team must use (ISO 19650-2 §5.1.5–5.1.6).", [
          table("referenceInfo", "Reference information provided", ["Information", "Format", "Status / reliability", "Available from"], [["Topographic survey", "DWG / point cloud", "", ""], ["Existing building records", "PDF / native", "", ""], ["Geotechnical report", "PDF", "", ""], ["Utilities survey", "DWG", "", ""]]),
          table("sharedResources", "Shared resources", ["Resource", "Description", "Location in CDE"], [["Project template files", "Discipline start files with shared coordinates", ""], ["Object library", "Approved families / objects with property sets", ""], ["Title blocks and drawing templates", "Standard sheets", ""], ["COBie picklists", "Project picklists for asset data", ""]]),
        ]),
        sec("roles", "Roles and responsibilities", "Information management roles the appointing party and the appointed parties must fill.", [
          table("roles", "Information management roles", ["Role", "Party", "Key responsibilities"], [["Appointing party information lead", "Appointing party", "Requirements, acceptance, AIM"], ["Information manager", "Lead appointed party", "CDE, MIDP, audits, QA"], ["Task information manager", "Each task team", "TIDP, model production, checks"], ["BIM coordinator", "Lead appointed party", "Federation, clash detection, issues"]]),
        ]),
        sec("coordination", "Collaboration and coordination", "How models are federated, checked for clashes and how issues are tracked to closure.", [
          area("coordinationText", "Coordination requirements", undefined, "Discipline models are uploaded to the CDE and federated weekly. Clash detection follows the clash matrix (tests, tolerances, frequency). Issues are exchanged in BCF and tracked to closure in coordination meetings."),
        ]),
        sec("security", "Information security", "Security requirements from the ISO 19650-5 security triage.", [
          select("securityOutcome", "Security triage outcome", ["Not sensitive", "Sensitive — security-minded approach required"]),
          area("securityText", "Security requirements", undefined, "Access is granted by role and reviewed monthly. Sensitive information is identified, marked and shared only with named individuals. Information may not be shared outside the delivery team without the appointing party's consent."),
        ]),
        sec("handover", "Asset information and handover", "What must be handed over for the asset information model and how it is verified.", [
          area("handoverText", "Handover requirements", undefined, "As-constructed models, COBie validated against the AIR, O&M manuals, warranties and certificates linked to assets, and a site-verified asset register."),
        ]),
        sec("acceptance", "Acceptance criteria", "How the appointing party will review and accept each deliverable.", [
          area("acceptanceCriteria", "Acceptance criteria", undefined, "Conforms to naming and metadata standard\nMeets LOIN for the milestone\nModel checked for clashes with zero critical issues\nCOBie validated without errors"),
          area("reviewProcess", "Review and authorization process", undefined, "Shared information is reviewed within 10 working days. Accepted information is authorized and published (A status); rejected information is returned with comments and resubmitted."),
        ]),
        sec("tender", "Tender response requirements", "What tenderers must submit and how it will be evaluated.", [
          area("tenderReqs", "Required submissions", undefined, "Pre-appointment BEP\nCapability and capacity assessment\nMobilization plan\nInformation delivery risk register"),
          table("evaluation", "Evaluation criteria", ["Criterion", "Weight (%)"], [["Pre-appointment BEP and response to the EIR", "40"], ["Capability and capacity", "30"], ["Mobilization plan", "15"], ["Risk register", "15"]]),
        ]),
      ],
    },
    {
      id: "info-standard", standard: "iso19650", code: "PIS", category: "Standards", title: "Project Information Standard",
      purpose: "Defines naming, metadata, classification, formats, status codes and modelling rules for all information containers.",
      clauseRefs: ["19650-2 §5.1.4", "UK NA"],
      sections: [
        projectInfo,
        sec("naming", "Container naming convention", "Field codes for Project-Originator-Volume-Level-Type-Role-Number.", [
          area("namingPattern", "Naming pattern", "Check names with the naming tool", "Project–Originator–Volume/System–Level/Location–Type–Role–Number, e.g. PRJ01-ABC-ZZ-01-M3-A-0001. Fields are separated by hyphens; only letters A–Z and digits are allowed."),
          table("originators", "Originator codes", ["Code", "Organization"]),
          table("volumes", "Volume / system codes", ["Code", "Description"], [["ZZ", "All volumes"], ["XX", "No volume applies"]]),
          table("levels", "Level / location codes", ["Code", "Description"], [["00", "Ground floor"], ["01", "Level 1"], ["ZZ", "Multiple levels"], ["XX", "No level applies"]]),
          table("types", "Type codes", ["Code", "Description"], [["M3", "3D model"], ["DR", "Drawing"], ["SP", "Specification"], ["RP", "Report"], ["SH", "Schedule"], ["MI", "Minutes"]]),
          table("roleCodes", "Role codes", ["Code", "Discipline"], [["A", "Architect"], ["S", "Structural engineer"], ["M", "Mechanical engineer"], ["E", "Electrical engineer"], ["P", "Public health engineer"], ["C", "Civil engineer"], ["L", "Landscape architect"], ["Z", "General (non-disciplinary)"]]),
        ]),
        sec("metadata", "Metadata", "Mandatory metadata on every container in the CDE.", [
          table("metadataFields", "Metadata fields", ["Field", "Values", "Mandatory"], [["Status (suitability)", "S0–S7, A1–An, CR", "Yes"], ["Revision", "P01.01 / C01", "Yes"], ["Classification", "Uniclass", "Yes"], ["Title", "Free text", "Yes"]]),
          table("statusCodes", "Status (suitability) codes", ["Code", "State", "Description", "Audience"], statusCodes),
        ]),
        sec("revision", "Revision convention", "Preliminary (P) and contractual (C) revisions with versions.", [
          area("revisionRules", "Revision rules", undefined, "WIP versions: P01.01, P01.02 …\nShared: P01, P02 …\nPublished: C01, C02 …"),
        ]),
        sec("classification", "Classification", "Classification system and the tables used for each kind of information.", [
          table("classTables", "Classification tables", ["Table", "Applies to"], [["Uniclass Co / En / SL", "Complexes, entities, spaces"], ["Uniclass EF / Ss", "Elements and systems"], ["Uniclass Pr", "Products"], ["Uniclass PM", "Project management documents"]]),
        ]),
        sec("modelling", "Modelling rules", "Coordinates, units, levels and object rules every model must follow.", [
          area("coordinates", "Coordinates and units", undefined, "Shared site coordinate system and project base point as surveyed; millimetres for building models, metres for site and infrastructure; true north defined in all models."),
          area("modelRules", "Object and model rules", undefined, "Model each element with the correct object type (no generic or in-place objects for maintainable assets)\nOne building or zone per model; models linked, not imported\nLevels and grids taken from the architectural model\nRemove unused views, links and objects before sharing\nIFC entity and predefined type set for every element"),
        ]),
        sec("formats", "File formats and software", "Authoring tools, versions and exchange formats.", [
          table("software", "Software schedule", ["Discipline", "Authoring tool", "Version", "Exchange format"]),
          table("deliverableFormats", "Deliverable formats", ["Deliverable", "Format"], [["Models", "Native + IFC"], ["Drawings", "PDF + DWG"], ["Documents", "PDF + native"], ["Schedules", "XLSX"], ["Issues", "BCF 2.1 / 3.0"], ["Asset data", "COBie (xlsx)"]]),
        ]),
        sec("drawings", "Drawing and document standards", "Sheet sizes, title blocks, scales and layers.", [
          area("drawingRules", "Drawing rules", undefined, "Standard sheet sizes and the project title block; title block shows container name, status and revision; scales from the approved list; layers named per ISO 13567."),
        ]),
      ],
    },
    {
      id: "cde-procedure", standard: "iso19650", code: "CDE", category: "Standards", title: "CDE Workflow & Procedure",
      purpose: "Defines the CDE solution, states, transitions, approvers, folder structure and access rules.",
      clauseRefs: ["19650-1 §12", "19650-2 §5.1.7", "19650-4"],
      sections: [
        projectInfo,
        sec("platform", "CDE solution", "Platform, administrator and access rules.", [
          text("platform", "Platform"), text("admin", "CDE administrator"), area("access", "Access & permissions policy", undefined, "Access is requested through the information manager, granted per role and organization, and reviewed monthly and when people leave the project."),
          table("permissions", "Permissions by state", ["Organization / role", "WIP", "Shared", "Published", "Archived"], [["Task team", "Edit own", "Read", "Read", "Read"], ["Lead appointed party", "—", "Read / approve", "Read", "Read"], ["Appointing party", "—", "Read", "Authorize", "Read"], ["CDE administrator", "Manage", "Manage", "Manage", "Manage"]]),
        ]),
        sec("states", "Information states", "What each CDE state means and who can see it.", [
          table("stateDefs", "States", ["State", "Purpose", "Visible to"], [["Work in progress (WIP)", "Information being developed by a task team", "Task team"], ["Shared", "Checked information shared for coordination or review", "Delivery team and appointing party"], ["Published", "Authorized information for use in the next stage", "All project members"], ["Archived", "Superseded and historical record", "All project members (read only)"]]),
        ]),
        sec("transitions", "State transitions", "Who checks, reviews and approves each transition.", [
          table("transitions", "Transitions", ["From", "To", "Check / review", "Approver", "Suitability"], [
            ["WIP", "Shared", "QA check + technical review", "Task team manager", "S1–S4"],
            ["Shared", "Published", "Authorization + acceptance", "Lead appointed party / Appointing party", "A1–An"],
            ["Published", "Archived", "Superseded", "Information manager", "—"],
          ]),
          area("rejection", "Rejection and resubmission", undefined, "Rejected information returns to WIP with comments recorded in the CDE; the next upload takes the next version and is resubmitted through the same checks."),
        ]),
        sec("folders", "Folder structure", "Top-level folder structure in the CDE.", [
          area("folderTree", "Folders", undefined, "00_WIP/<Task team>\n01_SHARED/<Discipline>\n02_PUBLISHED/<Stage>\n03_ARCHIVED\n04_CLIENT_INFORMATION\n05_REFERENCE"),
        ]),
        sec("uploads", "Upload and transmittal rules", "Checks every container must pass when uploaded, and how transmittals are issued.", [
          area("uploadRules", "Upload rules", undefined, "File name must follow the naming convention and match the container name\nStatus, revision and classification metadata completed\nOne container per file; no zipped files unless agreed\nTransmittals issued through the CDE, never by email"),
        ]),
        sec("continuity", "Backup, retention and continuity", "How the CDE is backed up, how long information is kept and what happens at the end of the project.", [
          area("backup", "Backup and retention", undefined, "Daily backups held for 30 days; information retained for the period set in the information protocol; the CDE is exported to the appointing party's systems at project close."),
        ]),
      ],
    },
    {
      id: "info-protocol", standard: "iso19650", code: "IP", category: "Contract", title: "Information Protocol",
      purpose: "Defines obligations, licences and liabilities for information, incorporated into each appointment.",
      clauseRefs: ["19650-2 §5.1.8"],
      sections: [
        projectInfo,
        sec("definitions", "Definitions and precedence", "Key terms and how this protocol ranks against the other appointment documents.", [
          area("definitionsText", "Definitions", undefined, "Terms follow ISO 19650-1. 'Information' means any information container delivered under the appointment, including models, drawings, documents and data."),
          area("precedence", "Order of precedence", undefined, "If this protocol conflicts with the appointment conditions, the appointment conditions prevail, except for matters of information security, where this protocol prevails."),
        ]),
        sec("obligations", "Obligations", "Obligations of the appointing party and appointed parties.", [
          area("appointingObl", "Appointing party obligations", undefined, "Provide the EIR, information standard, reference information and shared resources\nProvide and maintain the CDE\nReview and accept information within the agreed periods"),
          area("appointedObl", "Appointed party obligations", undefined, "Produce information to the EIR, information standard and BEP\nDeliver information at the milestones in the MIDP / TIDP\nUse the CDE for all information exchange\nFlow these obligations down to every sub-appointment"),
        ]),
        sec("licences", "Licensing and use", "Permitted purposes and licence terms for information.", [
          area("licence", "Licence terms", undefined, "Each appointed party grants the appointing party a non-exclusive, royalty-free licence to use, copy and adapt the information for the permitted purposes, transferable to future owners and operators of the asset."),
          area("permittedUse", "Permitted purposes", undefined, "Design, construction, operation, maintenance, alteration, extension and demolition of the asset"),
        ]),
        sec("security", "Security", "Requirements derived from the ISO 19650-5 security triage.", [select("sensitivity", "Sensitivity outcome", ["Not sensitive", "Sensitive — security-minded approach required"]), area("securityReqs", "Security requirements")]),
        sec("liability", "Liability and IP", "Liability limits, intellectual property and retention.", [
          area("liabilityText", "Liability provisions", undefined, "Each party remains liable for the information it produces. No party is liable for changes made by others to its information after it is published, nor for use outside the permitted purposes."),
          text("retention", "Retention period", undefined, "12 years after practical completion"),
        ]),
        sec("disputes", "Changes and disputes", "How changes to information requirements are agreed and how disputes are resolved.", [
          area("changes", "Changes to requirements", undefined, "Changes to the EIR or information standard are issued as instructions under the appointment and assessed for time and cost impact before they take effect."),
          area("disputesText", "Dispute resolution", undefined, "Disputes follow the dispute resolution procedure of the appointment."),
        ]),
      ],
    },
  ];
}
