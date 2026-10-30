import type { Hub } from "./types";

// Handover hub: moving the project information model (PIM) into the asset information model (AIM).
// Content is paraphrased practical guidance, consistent with the HOS document guide
// (docGuides/delivery.ts), the handover and operation stages (workflow/stages.ts) and the COBie hub.
// Suitability codes follow the common UK convention (S7, A, B, CR); always use the project's own codes.

export const handoverHub: Hub = {
  id: "handover",
  tone: "green",
  eyebrow: "DELIVERY · HANDOVER",
  title: "Handover guide (PIM → AIM)",
  intro:
    "Handover is the moment the project information model becomes the owner's asset information model. Done well, the facility team opens its systems on the first day of operation and finds every asset, document and warranty ready to use. Done badly, they inherit boxes of PDFs and months of retyping. This guide covers the handover strategy and timeline, what to hand over, acceptance and status codes, data quality checks, loading into CAFM and CMMS systems, roles, a twelve-week plan, a readiness checklist, KPIs, and how the AIM stays alive after handover.",
  sections: [
    // ==================================================================== STRATEGY
    {
      id: "strategy",
      label: "Strategy & timeline",
      tabs: [
        {
          id: "overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "Handover starts at the beginning",
              body: [
                "Under ISO 19650 the appointing party sets out what it needs to operate the asset in its asset information requirements. The delivery team builds the project information model to meet those requirements, and at the end the relevant parts are checked, accepted and transferred into the asset information model. Handover is the last step of that chain, but it is decided at the first.",
                "The information handover strategy is the document that makes this concrete. It says what will be handed over, in what format, when, how it will be checked, which system it will be loaded into and who is responsible for each step. It is written by the client's information manager with the facility manager and agreed with the delivery team.",
                "The best handovers follow a soft landings mindset: the people who will operate the building are involved from early design, asset data is collected while installation happens, and support continues after occupation until the building and its information settle down.",
              ],
            },
            {
              kind: "cards",
              title: "What good handover looks like",
              cards: [
                { title: "Planned from day one", body: "The handover strategy is agreed before construction and priced into the appointments, not invented at practical completion.", tone: "green" },
                { title: "Progressive", body: "Asset data arrives in staged drops tied to installation and commissioning, so gaps are found when they are cheap to fix.", tone: "blue" },
                { title: "Structured", body: "Asset data is in a structured, checkable format such as COBie or the client's template, with documents linked to the assets they describe.", tone: "teal" },
                { title: "Checked against the AIR", body: "Acceptance uses measurable criteria from the asset information requirements, not a judgement of complete and correct.", tone: "amber" },
                { title: "Loaded and tested", body: "Data is trial loaded into the receiving CAFM or CMMS before the final drop, so the import works on handover day.", tone: "purple" },
                { title: "Owned afterwards", body: "A named person owns the AIM after the project team leaves, and trigger events keep it up to date.", tone: "red" },
              ],
            },
            {
              kind: "stats",
              title: "Handover at a glance",
              stats: [
                { value: "PIM → AIM", label: "Relevant project information is accepted and transferred into the asset information model" },
                { value: "S7", label: "Common suitability code for information submitted for AIM authorisation" },
                { value: "CR", label: "Common status for accepted as-constructed record information" },
                { value: "Staged", label: "Asset data is delivered in drops during construction, not once at the end" },
              ],
            },
            {
              kind: "callout",
              title: "Read with the HOS guide and the COBie hub",
              body: "The platform's document guide for the Information Handover Strategy (HOS), at /doc-guides/handover-strategy, explains each section of the document with examples. The COBie hub explains the asset data format in detail. This hub ties them together into a working handover process.",
              tone: "info",
            },
          ],
        },
        {
          id: "timeline",
          label: "Timeline",
          blocks: [
            {
              kind: "text",
              title: "Early planning, staged delivery",
              body: [
                "Handover activities run through the whole project. Most of the work happens in the last third of construction, but the decisions that make it possible are taken in briefing and design. The table shows a typical timeline; your project's MIDP sets the actual dates.",
              ],
            },
            {
              kind: "table",
              title: "Handover activities through the project",
              columns: ["Project stage", "Handover activity", "Lead", "Output"],
              rows: [
                ["Briefing", "Define organisational and asset information requirements with the operations team", "Client information manager", "OIR and AIR"],
                ["Tender", "Issue the handover strategy and COBie template with the EIR so the effort is priced", "Client information manager", "HOS and EIR issued to tenderers"],
                ["Appointment and mobilisation", "Confirm deliverables, formats, responsibilities and the receiving system", "Lead appointed party", "BEP and MIDP with handover containers"],
                ["Design", "Build spaces, types, systems and classification into the models", "Design task teams", "Design-stage COBie drops"],
                ["Early construction", "Agree how product, serial and warranty data will be collected from subcontractors", "Main contractor", "Data collection plan and trial drop"],
                ["Installation and commissioning", "Collect installed data progressively by area and system; trial load into CAFM", "Main contractor and specialists", "Progressive drops and a trial import"],
                ["Pre-completion", "Final drop, verification, site sampling, H&S file and O&M documents", "Main contractor with client FM", "Handover package submitted as S7"],
                ["Handover", "Acceptance, transfer to the AIM and load into the live systems", "Client information manager and FM", "Accepted AIM and live systems"],
                ["Aftercare", "Resolve defects in data, review after occupation and record lessons", "Client and delivery team", "Updated AIM and lessons learned"],
              ],
            },
            {
              kind: "steps",
              title: "Soft landings style handover",
              steps: [
                { title: "Involve operations early", body: "Bring the facility manager into briefing and design reviews so the AIR reflects how the building will really be run." },
                { title: "Set expectations", body: "Agree the handover outcomes, formats and receiving systems before construction and write them into the appointments." },
                { title: "Collect data as you build", body: "Capture product, serial and installation data at the time of installation, not from memory at the end." },
                { title: "Rehearse the handover", body: "Trial load early drops into the receiving system and walk the FM team through the data and documents." },
                { title: "Hand over with support", body: "Keep delivery team contacts available for an agreed aftercare period to resolve data and performance issues." },
                { title: "Review after occupation", body: "Review how the information is being used after occupation, fix gaps and feed lessons into the next project's requirements." },
              ],
            },
            {
              kind: "callout",
              title: "Phased and sectional handover",
              body: "Large or phased projects often hand over by building, section or system. Plan a separate set of drops and acceptance for each, so the operations team can take over part of the asset while the rest is still being built.",
              tone: "ok",
            },
          ],
        },
        {
          id: "roles",
          label: "Roles",
          blocks: [
            {
              kind: "cards",
              title: "Who does what at handover",
              cards: [
                { title: "Client information manager", body: "Writes the handover strategy, sets acceptance criteria, accepts the information and transfers it into the AIM.", tone: "green" },
                { title: "Facility manager", body: "Confirms which assets and data operations need, reviews drops, tests imports into CAFM or CMMS and owns the AIM afterwards.", tone: "teal" },
                { title: "Lead appointed party information manager", body: "Plans handover containers in the MIDP, merges task team data, runs checks and submits the handover package.", tone: "blue" },
                { title: "Main contractor", body: "Collects product, serial, warranty and installation data from subcontractors and suppliers and compiles O&M information.", tone: "amber" },
                { title: "Specialist subcontractors", body: "Provide product data, commissioning records, test certificates and maintenance requirements for their systems.", tone: "purple" },
                { title: "Health and safety lead", body: "Compiles the health and safety file from residual risks and as-built information and issues it to the client.", tone: "red" },
              ],
            },
            {
              kind: "table",
              title: "Handover RACI",
              columns: ["Activity", "Client IM", "Facility manager", "Lead appointed party IM", "Main contractor", "Specialists"],
              rows: [
                ["Write the handover strategy", "R", "C", "C", "I", "I"],
                ["Define acceptance criteria", "A", "R", "C", "I", "I"],
                ["Plan handover containers in the MIDP", "I", "I", "A", "R", "C"],
                ["Collect product and installation data", "I", "I", "A", "R", "R"],
                ["Compile O&M manuals and warranties", "I", "C", "A", "R", "R"],
                ["Run COBie and naming checks", "C", "I", "A", "R", "C"],
                ["Site sample of asset tags", "A", "R", "C", "R", "I"],
                ["Trial import into CAFM or CMMS", "A", "R", "C", "C", "I"],
                ["Accept handover information", "A", "R", "I", "I", "I"],
                ["Maintain the AIM after handover", "A", "R", "I", "I", "C"],
              ],
            },
            {
              kind: "callout",
              title: "Name people, not companies",
              body: "Handover tasks fall between organisations. Name the role and the person for each task in the strategy, and make sure the facility manager is a named contributor from the start.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ==================================================================== CONTENT AND ACCEPTANCE
    {
      id: "content",
      label: "Content & acceptance",
      tabs: [
        {
          id: "aim-content",
          label: "What to hand over",
          blocks: [
            {
              kind: "text",
              title: "The content of the asset information model",
              body: [
                "Not everything in the project information model belongs in the asset information model. Design options, coordination models, superseded drawings and correspondence are archived with the PIM. What transfers is the information the owner needs to operate, maintain, alter and eventually dispose of the asset, as set out in the AIR.",
              ],
            },
            {
              kind: "table",
              title: "Typical handover content",
              columns: ["Content", "What it includes", "Typical format", "Usually provided by"],
              rows: [
                ["Record models", "As-constructed geometry of the building and its systems, at the level of information need set in the AIR", "IFC plus native files where agreed", "Design task teams and contractor"],
                ["Asset data", "Spaces, zones, types, components, systems, serial numbers, tags and installation dates", "COBie workbook or the client's asset template", "Contractor, merged by the lead appointed party"],
                ["O&M documents", "Operation and maintenance manuals, maintenance schedules, spare parts lists", "PDF linked to assets, plus structured job and spare data", "Contractor and specialists"],
                ["Warranties and guarantees", "Product and workmanship warranties with start dates, periods and providers", "Warranty fields in asset data plus certificates", "Contractor and suppliers"],
                ["Test and commissioning records", "Commissioning sheets, test certificates and witness records", "PDF linked to systems and components", "Commissioning manager and specialists"],
                ["Health and safety file", "Residual risks, hazardous materials, safe access and information for future works", "Structured file as required by the client", "Health and safety lead"],
                ["As-constructed drawings", "Record drawings where the client still needs drawings", "PDF and native where agreed", "Design task teams and contractor"],
                ["Statutory and compliance certificates", "Fire, lift, electrical, gas and other certificates", "PDF linked to systems and spaces", "Contractor and specialists"],
                ["Training records", "Who was trained on which systems and when", "Register or document", "Contractor"],
              ],
            },
            {
              kind: "list",
              title: "Usually archived with the PIM, not transferred",
              items: [
                "Design options and feasibility models",
                "Coordination and clash detection models",
                "Superseded revisions of drawings and models",
                "Correspondence, meeting minutes and requests for information",
                "Programme and cost information not needed in operation",
                "Work in progress containers that were never shared",
              ],
            },
            {
              kind: "callout",
              title: "Trace every deliverable to the AIR",
              body: "If a handover deliverable cannot be traced to an asset information requirement, ask whether it is needed. If an AIR requirement has no deliverable, the strategy has a gap.",
              tone: "ok",
            },
          ],
        },
        {
          id: "status-flow",
          label: "Acceptance & status",
          blocks: [
            {
              kind: "text",
              title: "How handover information is accepted",
              body: [
                "Handover information moves through the CDE like any other information container, but its last step is different. Instead of being authorised for the next stage of design or construction, it is submitted for acceptance into the asset information model.",
                "Under the common UK convention, containers submitted for AIM acceptance carry the suitability S7. When the client accepts them, they are given an authorised status, and record information is published as CR, as-constructed record. Use the codes your project's information standard defines.",
              ],
            },
            {
              kind: "steps",
              title: "Acceptance flow for a handover container",
              steps: [
                { title: "Work in progress", body: "The task team prepares the as-constructed model, asset data or document set in its WIP area and runs its own checks." },
                { title: "Shared for review", body: "The container is shared with the lead appointed party, who checks it against the AIR, the naming rules and the other task teams' data." },
                { title: "Submitted for AIM acceptance", body: "The lead appointed party submits the handover package to the client with the S7 suitability, a revision and a submission note listing any exceptions." },
                { title: "Client review", body: "The client information manager and facility manager check it against the acceptance criteria: COBie checks, site samples, trial import and document links." },
                { title: "Accepted or rejected", body: "Accepted containers receive an authorised status. Rejected containers return with an issue list, owners and a resubmission date." },
                { title: "Published as record", body: "Accepted record models and drawings are published as CR and transferred into the AIM; the rest of the PIM is archived." },
              ],
            },
            {
              kind: "table",
              title: "Common statuses around handover",
              columns: ["Code", "Meaning", "Used for"],
              rows: [
                ["S6", "Suitable for PIM authorisation", "Information submitted at the end of a design or construction stage"],
                ["S7", "Suitable for AIM authorisation", "Handover information submitted for acceptance into the AIM"],
                ["A1, A2 and so on", "Authorised and accepted", "Containers accepted by the client"],
                ["B1, B2 and so on", "Partially authorised, with comments", "Containers accepted subject to minor changes"],
                ["CR", "As-constructed record", "Accepted record models and drawings"],
              ],
            },
            {
              kind: "callout",
              title: "Acceptance must be measurable",
              body: "Write acceptance criteria that anyone can check: for example zero errors in the COBie checker, a ten per cent site sample of asset tags with no mismatches, every O&M document linked to an asset, and a clean trial import.",
              tone: "warn",
            },
          ],
        },
        {
          id: "documents",
          label: "Documents & H&S file",
          blocks: [
            {
              kind: "text",
              title: "Documents that make the data usable",
              body: [
                "Structured asset data tells the facility team what they own. Documents tell them how to look after it. The two must be linked: each O&M manual, certificate and warranty should be attached to the type, component, system or space it describes, so it can be found from the asset record.",
                "The health and safety file is a special case. It holds the information needed to carry out future work safely, such as residual risks, hazardous materials and safe access. It should be structured, kept up to date and easy to find from the spaces and assets it relates to.",
              ],
            },
            {
              kind: "table",
              title: "Linking documents to assets",
              columns: ["Document", "Link to", "Tip"],
              rows: [
                ["Product data sheet", "Type", "One sheet per product type, not per installed item"],
                ["O&M manual section", "Type or System", "Split large manuals so each section links to what it describes"],
                ["Warranty certificate", "Type or Component", "Record the start date and provider as data, not only in the PDF"],
                ["Commissioning record", "System or Component", "Name the file with the system or asset tag"],
                ["Test certificate", "Component or Space", "Link statutory certificates to the asset or area they cover"],
                ["Health and safety file entry", "Space, Component or Facility", "Record residual risks against the location where they apply"],
                ["Record drawing", "Floor, Space or System", "Use the same names as the asset data so drawings can be found from it"],
              ],
            },
            {
              kind: "checklist",
              title: "Document handover checks",
              items: [
                "Every in-scope asset type has its product data and O&M information",
                "Documents are linked to assets in the COBie Document sheet or the client's register",
                "File names follow the project naming standard and are frozen before the final export",
                "Warranty start dates and periods are recorded as data",
                "Commissioning and test records are complete for every system",
                "The health and safety file is issued and its entries are linked to locations",
                "Hazardous materials and residual risks are recorded where they apply",
              ],
            },
          ],
        },
      ],
    },
    // ==================================================================== QUALITY AND SYSTEMS
    {
      id: "quality",
      label: "Data quality & systems",
      tabs: [
        {
          id: "checks",
          label: "Data quality checks",
          blocks: [
            {
              kind: "text",
              title: "Check early, check often",
              body: [
                "Handover data quality is built up drop by drop. Each drop should pass the same checks, so that by the final drop only the installed data is new. Checks fall into three layers: format, content and reality.",
              ],
            },
            {
              kind: "table",
              title: "Handover data quality checks",
              columns: ["Check", "What it tests", "How", "Who"],
              rows: [
                ["COBie structure", "Required sheets, columns, unique names and valid dates", "COBie checker", "Lead appointed party, then client"],
                ["References", "Components to types and spaces, systems to components, contacts to CreatedBy", "COBie checker", "Lead appointed party"],
                ["Naming", "Asset, space and file names follow the project naming standard", "Rule set or script", "Lead appointed party"],
                ["Classification", "Every type and space has the agreed classification in the right form", "Rule set", "Lead appointed party"],
                ["Completeness", "Every in-scope asset has the attributes listed in the AIR", "Attribute matrix against the AIR", "Client information manager"],
                ["Asset tags", "Tags in the data match labels on site", "Site sample, often ten per cent", "Facility manager with contractor"],
                ["Installed data", "Serial numbers, install dates and warranty dates are real values, not placeholders", "Spot checks against submittals and site", "Facility manager"],
                ["Document links", "Every linked document exists and opens", "Link check", "Lead appointed party"],
                ["Model to data", "Assets in the record model match the asset data", "Comparison report", "Lead appointed party"],
              ],
            },
            {
              kind: "cards",
              title: "Signs that data is not ready",
              cards: [
                { title: "Placeholder values", body: "Serial numbers like TBC or 0000 and identical install dates for every asset show data was filled to pass a check.", tone: "red" },
                { title: "Sudden jumps in count", body: "A large rise in components between drops often means non-managed elements are being exported.", tone: "amber" },
                { title: "Orphan assets", body: "Components without a valid space or type cannot be found in the CAFM system.", tone: "purple" },
                { title: "Documents not linked", body: "A folder of PDFs with no links to assets is an archive, not part of the AIM.", tone: "blue" },
              ],
            },
            {
              kind: "callout",
              title: "Run the COBie checker on every drop",
              body: "The platform's COBie checker, at /ai-tools/cobie, tests sheets, required columns, unique names, dates, classification and references between sheets, and scores each drop. Run it before every submission and share the report with the drop.",
              tone: "ok",
            },
          ],
        },
        {
          id: "cafm",
          label: "Loading into CAFM/CMMS",
          blocks: [
            {
              kind: "text",
              title: "From workbook to working system",
              body: [
                "The handover is only finished when the data works in the systems the facility team uses every day: computer-aided facility management for space and services, a computerised maintenance management system for planned and reactive maintenance, and sometimes a document system and a building management system.",
                "Each system has its own data structure. The handover strategy should name the receiving system early, so the mapping from COBie or the client template to that system can be agreed and tested before the final drop.",
              ],
            },
            {
              kind: "steps",
              title: "Loading asset data into the receiving system",
              steps: [
                { title: "Name the receiving system", body: "Record the CAFM or CMMS product and version, and who administers it, in the handover strategy." },
                { title: "Agree the field mapping", body: "Map each COBie sheet and column, or each template field, to the receiving system's fields. Get the mapping signed off by the system owner." },
                { title: "Prepare reference data", body: "Load sites, buildings, floors, classification codes and asset categories into the system before asset data arrives." },
                { title: "Trial import", body: "Import an early drop into a test instance, record errors and fix the template, mapping or source data." },
                { title: "Final import", body: "Import the accepted final drop into the live system and reconcile counts of spaces, types and components." },
                { title: "Set up maintenance", body: "Turn job and spare data into planned maintenance schedules and check them with the maintenance team." },
                { title: "Train and hand over", body: "Train the facility team on the data and how to keep it current, and confirm who owns updates." },
              ],
            },
            {
              kind: "table",
              title: "Typical mapping from COBie to a maintenance system",
              columns: ["COBie source", "Receiving system field", "Notes"],
              rows: [
                ["Facility and Floor", "Site, building and level hierarchy", "Load before assets so locations exist"],
                ["Space", "Location or room", "Space name usually becomes the location code"],
                ["Type", "Asset class or model", "Holds manufacturer, model and warranty defaults"],
                ["Component", "Asset", "Name or tag becomes the asset number"],
                ["System", "System or asset group", "Used for planned maintenance and fault reporting"],
                ["Job", "Planned maintenance task", "Frequency and duration drive the schedule"],
                ["Spare", "Inventory item", "Linked to the asset class"],
                ["Document", "Attachment or document link", "Check the system can store or link the files"],
              ],
            },
            {
              kind: "callout",
              title: "Do the trial import early",
              body: "A trial import of an early construction drop is the single most effective handover check. It finds mapping, template and naming problems while there is still time to change how data is collected.",
              tone: "info",
            },
          ],
        },
        {
          id: "kpis",
          label: "KPIs",
          blocks: [
            {
              kind: "text",
              title: "Measuring handover quality",
              body: [
                "Agree a small set of handover KPIs in the strategy and report them at every drop. They give the client an early warning and give the delivery team a clear target. Targets below are examples; set your own in the strategy.",
              ],
            },
            {
              kind: "table",
              title: "Handover KPIs",
              columns: ["KPI", "How it is measured", "Example target"],
              rows: [
                ["Data completeness", "Required AIR attributes filled, as a percentage of all required attributes for in-scope assets", "100% at final drop; agreed percentage at earlier drops"],
                ["COBie errors", "Errors reported by the checker per drop", "Zero at final drop"],
                ["Tag accuracy", "Site sample of tags that match the data", "100% of the sample"],
                ["Document coverage", "In-scope types with linked O&M information", "100% at final drop"],
                ["Data defects", "Open data issues raised by the client after each drop", "Falling drop on drop; none open at acceptance"],
                ["Drops on time", "Drops submitted by the MIDP date", "All drops on time"],
                ["First-time acceptance", "Drops accepted without resubmission", "Rising through construction"],
                ["Import success", "Records imported into CAFM or CMMS without error", "100% at final import"],
                ["Post-handover data defects", "Data issues found by the FM team in the first months of operation", "Tracked and closed within the aftercare period"],
              ],
            },
            {
              kind: "stats",
              title: "Example dashboard at the final drop",
              stats: [
                { value: "98%", label: "Data completeness against the AIR (example)" },
                { value: "0", label: "COBie checker errors (target)" },
                { value: "10%", label: "Asset tags sampled on site (typical)" },
                { value: "12", label: "Open data defects to close before acceptance (example)" },
              ],
            },
          ],
        },
      ],
    },
    // ==================================================================== PLAN AND OPERATION
    {
      id: "plan",
      label: "Plan & operation",
      tabs: [
        {
          id: "twelve-weeks",
          label: "12-week plan",
          blocks: [
            {
              kind: "steps",
              title: "Twelve weeks before handover",
              steps: [
                { title: "Week 12: confirm the scope", body: "Review the handover strategy with the client, confirm deliverables, formats, the receiving system and acceptance criteria, and check the MIDP dates." },
                { title: "Week 11: chase product data", body: "Issue a data request to every subcontractor and supplier for missing product, warranty and maintenance information, with a due date." },
                { title: "Week 10: progressive drop", body: "Submit a progressive asset data drop for completed areas and run the COBie checker. Share the report with the client." },
                { title: "Week 9: trial import", body: "The facility manager trial imports the drop into a test instance of the CAFM or CMMS, and the team fixes mapping and data issues." },
                { title: "Week 8: O&M structure", body: "Agree the O&M document structure and file naming, and start linking documents to assets." },
                { title: "Week 7: tag on site", body: "Fix asset labels on site as systems are commissioned, using the tag format in the AIR." },
                { title: "Week 6: H&S file draft", body: "The health and safety lead issues a draft health and safety file for client review." },
                { title: "Week 5: record models", body: "Task teams update models to as-constructed and share them for review against the asset data." },
                { title: "Week 4: final data drop", body: "Submit the near-complete asset data with serial numbers, install dates and warranties, and run all checks." },
                { title: "Week 3: site sample", body: "The facility manager and contractor check a sample of asset tags and installed data on site and record mismatches." },
                { title: "Week 2: close defects", body: "Fix data defects from the checks and the site sample, freeze file names and complete document links." },
                { title: "Week 1: submit as S7", body: "Submit the handover package for AIM acceptance with a submission note, train the FM team and confirm the transfer and archive plan." },
              ],
            },
            {
              kind: "callout",
              title: "Twelve weeks is the end, not the start",
              body: "This plan assumes the strategy, template and data collection were set up at mobilisation and that progressive drops have been made through construction. If not, start immediately and expect handover data to lag behind practical completion.",
              tone: "warn",
            },
          ],
        },
        {
          id: "readiness",
          label: "Readiness checklist",
          blocks: [
            {
              kind: "checklist",
              title: "Handover readiness checklist",
              items: [
                "Handover strategy agreed, current and known to the whole delivery team",
                "Every deliverable traced to the AIR with an owner and a due date",
                "Receiving CAFM or CMMS named, with a signed-off field mapping",
                "Trial import completed and issues closed",
                "Final COBie drop passes the checker with zero errors",
                "Every in-scope asset has a tag, a space and a type",
                "Serial numbers, install dates and warranty dates are real values",
                "Site sample of asset tags completed with no open mismatches",
                "O&M documents complete and linked to assets",
                "Test, commissioning and statutory certificates complete",
                "Health and safety file issued to the client",
                "Record models and drawings updated to as-constructed",
                "File names frozen and document links checked",
                "Facility team trained on the systems and the data",
                "AIM owner named and trigger events defined",
                "PIM archive plan agreed with access and retention rules",
              ],
            },
            {
              kind: "callout",
              title: "Use the checklist as a gate",
              body: "Agree with the client that the handover package is only submitted for acceptance when every item is ticked or has an agreed exception recorded in the submission note.",
              tone: "info",
            },
          ],
        },
        {
          id: "operation",
          label: "After handover",
          blocks: [
            {
              kind: "text",
              title: "Keeping the AIM alive",
              body: [
                "The asset information model is only valuable if it stays true to the building. ISO 19650-3 describes the operational phase as a series of information exchanges started by trigger events: something happens to the asset, and information must be delivered to update the AIM.",
                "The client information manager defines the trigger events and the information each must deliver, and puts those requirements into maintenance and works contracts. The facility manager checks the returned information and accepts it into the AIM.",
              ],
            },
            {
              kind: "table",
              title: "Typical trigger events",
              columns: ["Trigger event", "Information to return", "Usually provided by"],
              rows: [
                ["Planned maintenance", "Task completion, readings and any defects found", "Maintenance contractor"],
                ["Asset replacement", "New product data, serial number, install date and warranty; old asset retired", "Maintenance or works contractor"],
                ["Fit-out or refurbishment", "Updated spaces, assets, record models and documents", "Fit-out appointed party"],
                ["Failure or incident", "Fault, cause, repair and any change to the asset", "Maintenance contractor"],
                ["Survey or inspection", "Condition data and survey records", "Surveyor or specialist"],
                ["Change of use or ownership", "Updated spaces, zones, responsibilities and access", "Client information manager"],
                ["End of warranty or defects period", "Defect closure records and warranty status", "Client and contractor"],
              ],
            },
            {
              kind: "steps",
              title: "Post-occupancy review",
              steps: [
                { title: "Gather feedback", body: "After a few months of occupation, ask the facility and maintenance teams which information they use, what is missing and what is wrong." },
                { title: "Measure", body: "Count data defects raised since handover and check how many assets have had their data updated." },
                { title: "Fix", body: "Close data defects within the aftercare period with the delivery team." },
                { title: "Improve the requirements", body: "Update the OIR, AIR and handover strategy template so the next project asks for the right information." },
              ],
            },
            {
              kind: "callout",
              title: "Write data updates into every contract",
              body: "If maintenance and works contracts do not require information to be returned, the AIM drifts out of date within months. Include information requirements and acceptance in every contract that touches the asset.",
              tone: "warn",
            },
          ],
        },
        {
          id: "mistakes",
          label: "Common mistakes",
          blocks: [
            {
              kind: "table",
              title: "Common handover mistakes",
              columns: ["Mistake", "Result", "How to avoid it"],
              rows: [
                ["Asking for full COBie with no template or field list", "Disputes about scope and data nobody can use", "Issue the client template and AIR field list with the strategy"],
                ["All asset data due at practical completion", "Rushed, incomplete data and late acceptance", "Plan progressive drops tied to installation and commissioning"],
                ["Facility manager involved only at the end", "Data in the wrong structure for operations", "Make the FM a contributor from briefing and in every drop review"],
                ["No receiving system named", "Data that cannot be imported", "Name the CAFM or CMMS and plan a trial import"],
                ["Acceptance criteria written as complete and correct", "Endless argument about whether data is good enough", "Use measurable checks with thresholds and a named checker"],
                ["O&M manuals as one large PDF", "Information that cannot be found from the asset", "Split documents and link them to types, systems and components"],
                ["Tags in the data differ from labels on site", "Maintenance staff cannot find the asset", "Use one tag format from the AIR and sample on site"],
                ["Placeholder values to pass checks", "Data passes format checks but is useless", "Spot check installed data against submittals and site"],
                ["No AIM owner after handover", "The AIM drifts out of date", "Name the owner in the strategy and define trigger events"],
              ],
            },
            {
              kind: "callout",
              title: "Handover is a process, not an event",
              body: "Almost every handover failure comes from leaving the work to the end. Plan it at the start, deliver it in drops and rehearse it with the people who will use it.",
              tone: "info",
            },
          ],
        },
      ],
    },
    // ==================================================================== LEARN
    {
      id: "learn",
      label: "FAQ, quiz & AI",
      tabs: [
        {
          id: "faq",
          label: "FAQ",
          blocks: [
            {
              kind: "faq",
              title: "Frequently asked questions",
              items: [
                { q: "Who writes the information handover strategy?", a: "The client's information manager, working with the facility manager. It is agreed with the delivery team and ideally issued with the tender documents so the effort is priced." },
                { q: "Is the PIM handed over in full?", a: "No. The relevant parts of the PIM, as set out in the AIR, are accepted and transferred into the AIM. The rest is archived with access and retention rules." },
                { q: "What does S7 mean?", a: "Under the common UK convention it means suitable for AIM authorisation: the container is submitted for acceptance into the asset information model. Use the codes in your project's information standard." },
                { q: "What does CR mean?", a: "As-constructed record. It is commonly used for accepted record models and drawings that describe the asset as built." },
                { q: "Is COBie required for handover?", a: "Not by ISO 19650 itself. The client decides the format in its requirements. COBie is widely used because it is structured, open and can be checked automatically." },
                { q: "When should the first asset data drop be made?", a: "During design for spaces and types, and early in construction for installed data. A trial drop early in construction finds template and mapping problems while they are cheap to fix." },
                { q: "Who checks asset tags on site?", a: "Usually the facility manager with the contractor, on an agreed sample such as ten per cent of tagged assets. Any mismatch should trigger a wider check." },
                { q: "What is a trigger event?", a: "Something that happens to the asset during operation, such as maintenance, replacement or fit-out, that requires information to be delivered to update the AIM." },
                { q: "What if the receiving CAFM system is chosen late?", a: "Deliver to a neutral structured format such as COBie, keep the mapping step in the plan and do the trial import as soon as the system is known." },
                { q: "How long should aftercare last?", a: "It is set in the appointments. Many projects keep delivery team support available through the first year of operation, or until the end of the defects period." },
              ],
            },
            {
              kind: "cards",
              title: "Quick answers by role",
              cards: [
                { title: "Client information manager", body: "Write the strategy early, make acceptance measurable and name the AIM owner.", tone: "green" },
                { title: "Facility manager", body: "Say what you need, review every drop and run the trial import yourself.", tone: "teal" },
                { title: "Main contractor", body: "Collect data at installation, chase subcontractors early and tag assets as you commission.", tone: "amber" },
                { title: "Lead appointed party information manager", body: "Put every handover container in the MIDP and run the checks before the client does.", tone: "blue" },
              ],
            },
          ],
        },
        {
          id: "quiz",
          label: "Quiz",
          blocks: [
            {
              kind: "quiz",
              title: "Test your handover knowledge",
              questions: [
                { q: "Which requirements define what information the AIM must contain?", options: ["Task information delivery plan", "Asset information requirements", "Mobilisation plan", "Risk register"], answer: 1, why: "The AIR sets out the information the appointing party needs to manage its assets." },
                { q: "Under the common UK convention, which suitability is used for information submitted for AIM acceptance?", options: ["S2", "S4", "S6", "S7"], answer: 3, why: "S7 means suitable for AIM authorisation." },
                { q: "When should asset data delivery start?", options: ["At practical completion", "After occupation", "Progressively during design and construction", "Only when the CAFM system is bought"], answer: 2, why: "Progressive drops find gaps when they are cheap to fix and spread the effort." },
                { q: "What is the most effective early check that handover data will work?", options: ["A trial import into the receiving system", "Printing the COBie workbook", "Counting the PDFs", "Asking the architect"], answer: 0, why: "A trial import tests the template, mapping and data together while there is time to change them." },
                { q: "Which of these is usually archived with the PIM rather than transferred to the AIM?", options: ["Warranties", "Clash detection models", "Asset data", "Health and safety file"], answer: 1, why: "Coordination models support delivery, not operation, so they are archived." },
                { q: "In ISO 19650-3, what starts an information exchange during operation?", options: ["A trigger event", "A design review", "A tender", "A clash report"], answer: 0, why: "Trigger events such as maintenance, replacement or fit-out require information to be delivered to update the AIM." },
              ],
            },
            {
              kind: "callout",
              title: "Learn from the answers",
              body: "Each answer has a short explanation. If you get one wrong, revisit the matching tab before trying again.",
              tone: "info",
            },
          ],
        },
        {
          id: "ai",
          label: "AI tools",
          blocks: [
            { kind: "widget", widget: "ask-ai", title: "Ask AI about handover" },
            { kind: "widget", widget: "generate", title: "Draft an information handover strategy", docType: "Information Handover Strategy" },
            {
              kind: "callout",
              title: "Check your COBie with the checker",
              body: "Open the COBie checker at /ai-tools/cobie to test each drop for missing sheets and columns, blank required fields, duplicate names, broken references and classification problems.",
              tone: "ok",
            },
            {
              kind: "callout",
              title: "Read the HOS document guide",
              body: "The Information Handover Strategy guide at /doc-guides/handover-strategy explains each section of the strategy, with examples, a step-by-step method, a checklist and common mistakes.",
              tone: "info",
            },
            {
              kind: "links",
              title: "Related tools on this platform",
              links: [
                { label: "COBie checker", href: "/ai-tools/cobie", note: "Check each asset data drop before submission", tone: "green" },
                { label: "Handover strategy guide", href: "/doc-guides/handover-strategy", note: "How to write the HOS, section by section", tone: "blue" },
                { label: "COBie hub", href: "/hubs/cobie", note: "Every COBie sheet, delivery timing and quality checks", tone: "teal" },
              ],
            },
            {
              kind: "callout",
              title: "Check AI output",
              body: "AI drafts are a starting point. The client information manager and the facility manager should confirm scope, formats, acceptance criteria and responsibilities before the strategy is issued.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "What should an information handover strategy contain for a new hospital?",
    "How do we plan progressive COBie drops during construction?",
    "What acceptance criteria should we use for handover asset data?",
    "Which trigger events should keep the AIM up to date after handover?",
  ],
};
