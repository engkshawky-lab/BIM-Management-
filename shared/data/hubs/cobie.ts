import type { Hub } from "./types";

// COBie hub: Construction Operations Building information exchange as used in the UK through
// BS 1192-4, framed against ISO 19650. Content is paraphrased practical guidance, not the text of
// any standard. Sheet and column names follow COBie 2.4 and match the portal's checker (shared/cobie.ts).
// Colour coding and delivery timing are described as common conventions; always follow the
// project's own information requirements and template.

export const cobieHub: Hub = {
  id: "cobie",
  tone: "green",
  eyebrow: "REFERENCE · COBIE (BS 1192-4)",
  title: "COBie: complete practical guide",
  intro:
    "COBie is the structured, spreadsheet-friendly way to hand over the information an owner needs to run a building: spaces, assets, types, systems, documents and maintenance data. This guide explains every sheet, the colour conventions used in templates, what to deliver at each stage, how to author COBie from Revit and Archicad, the quality checks that catch most errors, and how COBie fits the ISO 19650 asset information requirements.",
  sections: [
    {
      id: "main",
      label: "COBie",
      tabs: [
        // ------------------------------------------------------------------ Overview
        {
          id: "overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "What COBie is",
              body: [
                "COBie (Construction Operations Building information exchange) is an information exchange specification for the managed assets of a facility. It describes what is in a building, where it is, what type it is, who made it, how it is grouped into systems and what documents and maintenance information go with it.",
                "COBie is a data structure, not a piece of software. The same information can be carried in an IFC file using a defined model view, or in a spreadsheet workbook with one worksheet per kind of object. The spreadsheet form is the one most people meet, because it can be opened, reviewed and imported by facility and asset management systems without specialist BIM tools.",
                "In the UK, BS 1192-4 sets out a code of practice for using COBie to fulfil the employer's information exchange requirements. It explains who provides which information, how sheets relate to each other and how classification should be applied. It remains widely referenced on projects that follow ISO 19650.",
              ],
            },
            {
              kind: "cards",
              title: "Why owners ask for COBie",
              cards: [
                { title: "Ready for operations on day one", body: "Asset registers, spaces and warranties arrive in a structured form that can be imported into CAFM or CMMS systems instead of being retyped from O&M manuals.", tone: "green" },
                { title: "Software neutral", body: "A workbook can be produced from any authoring tool and read by any system, so the owner is not locked into a single vendor.", tone: "blue" },
                { title: "Checkable", body: "Because every sheet has defined columns and references, completeness and consistency can be tested automatically at every data drop.", tone: "teal" },
                { title: "Progressive", body: "COBie is delivered in stages, so the client can check the information early, when gaps are cheap to fix, rather than at handover.", tone: "amber" },
                { title: "Links to documents", body: "O&M manuals, certificates, warranties and drawings can be linked to the exact type, component or space they describe.", tone: "purple" },
                { title: "Supports the AIM", body: "COBie is a convenient carrier for part of the asset information model required by the appointing party under ISO 19650-3.", tone: "red" },
              ],
            },
            {
              kind: "table",
              title: "The two COBie hierarchies",
              columns: ["Hierarchy", "Levels", "What it answers"],
              rows: [
                ["Spatial", "Facility, then Floor, then Space; Spaces grouped into Zones", "Where is it? Which room, which floor, which fire or lettable zone?"],
                ["Physical", "Type, then Component; Components grouped into Systems", "What is it? Which product, which installed instance, which system does it belong to?"],
                ["Connecting the two", "Each Component references the Space it is located in", "Which assets are in this room, and which room is this asset in?"],
                ["Supporting information", "Document, Attribute, Spare, Resource, Job, Impact, Coordinate, Issue", "How is it maintained, what documents describe it, what else do we know?"],
                ["People and organisations", "Contact, referenced by CreatedBy and by manufacturer and warranty fields", "Who created the data, who made the product, who gives the guarantee?"],
                ["Shared vocabularies", "PickLists, including classification codes", "Which values are allowed in category and unit fields?"],
              ],
            },
            {
              kind: "steps",
              title: "How the data hangs together",
              steps: [
                { title: "Facility", body: "One row describing the building or facility, its project and site names and the units used throughout the workbook." },
                { title: "Floor", body: "Each storey or level, including roof and external levels where the project needs them, with elevation and height." },
                { title: "Space", body: "Each room or area, linked to its Floor by name, with description, room tag and areas." },
                { title: "Zone", body: "Groups of Spaces for a purpose such as fire compartments, heating zones, security zones or lettable areas. A Space can be in several Zones." },
                { title: "Type", body: "Each product type, for example a particular boiler model or door type, with manufacturer, model number, warranty and expected life." },
                { title: "Component", body: "Each installed, individually managed instance of a Type, located in a Space, with serial number, installation date and tag." },
                { title: "System", body: "Groups of Components that work together, such as a heating system, a fire alarm system or a lighting circuit." },
              ],
            },
            {
              kind: "callout",
              title: "Only managed assets belong in COBie",
              body: "COBie is not a dump of every modelled element. Walls, slabs and ceilings are rarely needed as components; boilers, pumps, luminaires, doors, sanitaryware and fire equipment usually are. The appointing party's asset information requirements should say which product categories are in scope.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Sheets explained
        {
          id: "sheets",
          label: "Sheets explained",
          blocks: [
            {
              kind: "table",
              title: "Core sheets: people, places and assets",
              columns: ["Sheet", "Purpose", "Key fields", "Who usually fills it", "When"],
              rows: [
                ["Contact", "People and organisations referenced elsewhere in the workbook", "Email (the unique key), Company, Phone, Category, CreatedBy, CreatedOn", "Every author adds itself; contractor adds manufacturers and installers", "From the first drop, growing through construction"],
                ["Facility", "The single building or facility being handed over, with project, site and unit settings", "Name, ProjectName, SiteName, LinearUnits, AreaUnits, VolumeUnits, CurrencyUnit, Category", "Lead designer or information manager", "First drop; checked at every drop"],
                ["Floor", "Storeys, levels and other vertical divisions", "Name, Category, Elevation, Height", "Architect", "Concept design onwards"],
                ["Space", "Rooms and areas that are managed, cleaned, let or maintained", "Name, FloorName, Description, RoomTag, UsableHeight, GrossArea, NetArea, Category", "Architect", "Concept and spatial coordination onwards"],
                ["Zone", "Named groups of spaces for a purpose such as fire, HVAC, security or occupancy", "Name, Category, SpaceNames", "Architect and building services engineer", "Spatial coordination onwards"],
                ["Type", "Product types, specifications and warranty information", "Name, Category, Description, AssetType, Manufacturer, ModelNumber, warranty fields, ExpectedLife", "Designers for generic types; contractor completes product data", "Technical design and construction"],
                ["Component", "Individually managed installed instances of a type", "Name, TypeName, Space, Description, SerialNumber, InstallationDate, WarrantyStartDate, TagNumber, BarCode, AssetIdentifier", "Designers create; contractor and installers complete", "Technical design onwards; serial numbers at construction"],
                ["System", "Groups of components that provide a service", "Name, Category, ComponentNames", "Building services and other system designers", "Technical design onwards"],
                ["Assembly", "Types or components made up of other types or components", "Name, SheetName, ParentName, ChildNames, AssemblyType", "Specialist designers or contractor where required", "Only when the requirements ask for it"],
                ["Connection", "Logical or physical connections between components", "Name, ConnectionType, SheetName, RowName1, RowName2", "Building services designers where required", "Only when the requirements ask for it"],
              ],
            },
            {
              kind: "table",
              title: "Supporting sheets: operations, documents and extensions",
              columns: ["Sheet", "Purpose", "Key fields", "Who usually fills it", "When"],
              rows: [
                ["Spare", "Spare parts, consumables and replacement items for a type", "Name, Category, TypeName, Suppliers, SetNumber, PartNumber", "Contractor, from manufacturer information", "Construction and handover"],
                ["Resource", "Materials, tools and training needed for maintenance", "Name, Category, Description", "Contractor or maintenance planner", "Handover, if required"],
                ["Job", "Planned maintenance, inspection and safety tasks for a type", "Name, Category, Status, TypeName, Description, Duration, Frequency, Priors, ResourceNames", "Contractor with manufacturers and FM team", "Handover"],
                ["Impact", "Environmental, cost or other impacts over the life cycle", "Name, ImpactType, ImpactStage, SheetName, RowName, Value, ImpactUnit", "Specialists where the client asks for it", "Rarely used; only when specified"],
                ["Document", "References to documents that describe any row in another sheet", "Name, Category, ApprovalBy, Stage, SheetName, RowName, Directory, File", "Every author for its own information; contractor for O&M", "Throughout; heavily at handover"],
                ["Attribute", "Extra properties for any row, beyond the standard columns", "Name, SheetName, RowName, Value, Unit, Category", "Designers and contractor, as listed in the requirements", "Throughout, matched to the stage"],
                ["Coordinate", "Locations and bounding points for floors, spaces and components", "Name, Category, SheetName, RowName, CoordinateXAxis, CoordinateYAxis, CoordinateZAxis", "Usually generated by the export tool", "When location data is required"],
                ["Issue", "Known risks, problems or deviations attached to rows", "Name, Type, Risk, Chance, Impact, SheetName1, RowName1, Description, Mitigation", "Any author", "As needed; often used for exceptions"],
                ["PickLists", "Allowed values for category, unit and type fields, including classification", "Columns per list, for example categories, units and asset types", "Information manager sets it up from the template", "Before the first drop"],
              ],
            },
            {
              kind: "cards",
              title: "Fields you will see on nearly every sheet",
              cards: [
                { title: "Name", body: "The unique key on most sheets. Other sheets refer to rows by this name, so it must be unique and stable between drops.", tone: "green" },
                { title: "CreatedBy", body: "The email of the person or organisation that created the row. It must exist on the Contact sheet.", tone: "blue" },
                { title: "CreatedOn", body: "The date and time the row was created, in a consistent, machine-readable date format.", tone: "teal" },
                { title: "Category", body: "Classification, usually written as code and title from the agreed system such as Uniclass, for example a code followed by a colon and its description.", tone: "purple" },
                { title: "External fields", body: "ExtSystem, ExtObject and ExtIdentifier record the authoring tool, object type and GUID the row came from, so it can be traced back to the model.", tone: "amber" },
                { title: "Description", body: "A short, human-readable description that makes sense to the facility manager, not an internal family or layer name.", tone: "red" },
              ],
            },
            {
              kind: "callout",
              title: "What the portal's COBie checker looks for",
              body: "The checker treats Contact, Facility, Floor, Space, Type and Component as required worksheets, and checks Zone, System, Document and Attribute when they are present. It tests mandatory columns, unique names, a single Facility row, valid dates, classification in code: title form, and cross-references such as Space to Floor, Component to Type and Space, System to Component and CreatedBy to Contact.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ Colour coding
        {
          id: "colours",
          label: "Colour coding",
          blocks: [
            {
              kind: "text",
              title: "Why COBie templates are colour coded",
              body: [
                "Most COBie spreadsheet templates colour the column headers so that people filling them in can see at a glance which fields must be completed, which must match a value somewhere else and which are produced by software.",
                "The colours are a convention used in widely shared templates, not a requirement of the data format. Different templates and tools use slightly different shades and meanings, so always check the legend in the template your project has adopted.",
              ],
            },
            {
              kind: "table",
              title: "Common header colour convention",
              columns: ["Colour (typical)", "Meaning", "Examples", "What to do"],
              rows: [
                ["Yellow", "Required: a value must be provided", "Name, CreatedBy, CreatedOn, Description", "Always fill in; use n/a only where the requirements allow it"],
                ["Orange or salmon", "Reference: the value must match another sheet or a picklist", "FloorName, TypeName, Space, Category, units", "Pick from the referenced sheet or picklist; do not type free text"],
                ["Purple or lilac", "External: generated by software to trace the source", "ExtSystem, ExtObject, ExtIdentifier", "Leave to the export tool; do not edit by hand"],
                ["Green", "Optional or as specified: only needed if the requirements ask", "Optional attributes, some warranty or area fields", "Fill in when listed in the AIR or EIR; otherwise leave blank or n/a"],
                ["Blue or another template-specific colour", "Project or client extension columns added to the standard sheets", "Client asset codes, maintenance contract references", "Follow the client legend; these are defined in the project requirements"],
                ["Grey or uncoloured", "Not used for this project or secondary information", "Rarely used sheets and columns", "Ignore unless the project states otherwise"],
              ],
            },
            {
              kind: "cards",
              title: "Reading the colours in practice",
              cards: [
                { title: "Yellow means stop and check", body: "A blank yellow cell is the most common reason a drop is rejected. Run a filter for blanks on every required column before issuing.", tone: "amber" },
                { title: "Orange means look it up", body: "If a reference field does not match exactly, including spaces and case in some tools, the relationship breaks and the asset becomes an orphan.", tone: "red" },
                { title: "Purple means hands off", body: "External identifiers link the row to a model object. Editing them by hand breaks traceability between the model and the workbook.", tone: "purple" },
                { title: "Green means read the brief", body: "Optional fields become mandatory when the client asks for them. The AIR or the project's COBie responsibility matrix decides.", tone: "green" },
              ],
            },
            {
              kind: "callout",
              title: "Colours do not survive every tool",
              body: "Exporters, CSV conversions and some viewers drop cell formatting. Do not rely on colour to carry meaning in the delivered data; rely on the column definitions and the checker instead.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ Delivery timing
        {
          id: "timing",
          label: "Delivery timing",
          blocks: [
            {
              kind: "text",
              title: "Progressive delivery, not a handover surprise",
              body: [
                "COBie is best delivered in stages, often called data drops, aligned to project milestones. Each drop adds detail to the same workbook structure, and each is checked before the next stage begins.",
                "The stage names below follow the RIBA Plan of Work, which many UK projects use. Your project's information delivery milestones in the MIDP and the client's information requirements define the actual content and dates.",
              ],
            },
            {
              kind: "table",
              title: "What is typically delivered at each stage",
              columns: ["Stage", "Typical COBie content", "Main contributors", "Client check focus"],
              rows: [
                ["Stage 2 Concept Design", "Contact, Facility, Floor and an initial Space list with names, descriptions and target areas", "Architect, information manager", "Structure set up correctly, naming and classification agreed"],
                ["Stage 3 Spatial Coordination", "Full Space schedule, Zones, generic Types for main asset categories, first Systems", "Architect, building services and structural engineers", "Space and zone completeness, classification of types"],
                ["Stage 4 Technical Design", "Specified Types with performance attributes, Components placed in Spaces, Systems with components, design Documents", "All designers, specialist designers", "Every in-scope asset modelled, located and grouped"],
                ["Stage 5 Manufacturing and Construction", "Manufacturer, model number, serial numbers, installation dates, tags and barcodes; Spare and Job data begins", "Contractor, subcontractors, manufacturers", "Product data replaces generic data; installed reality matches"],
                ["Stage 6 Handover", "Complete and verified workbook with warranties, O&M documents, Jobs, Spares and final as-built attributes", "Contractor, commissioning manager, information manager", "Acceptance against the AIR and import into the client's systems"],
                ["Stage 7 Use", "Updates for replacements, refurbishment and changes to the asset register", "Client FM team and maintenance contractors", "The AIM stays current as assets change"],
              ],
            },
            {
              kind: "steps",
              title: "Running a data drop",
              steps: [
                { title: "Confirm the scope", body: "Check the responsibility matrix for which sheets, columns and attributes are due at this milestone." },
                { title: "Export from the models", body: "Each task team exports its COBie data using the agreed tool and settings, with consistent names and classification." },
                { title: "Merge", body: "The lead appointed party merges task team outputs into one workbook, removing duplicates and resolving references between teams." },
                { title: "Self-check", body: "Run the COBie checker and the project's own rules, fix errors and record known exceptions on the Issue sheet." },
                { title: "Share and review", body: "Upload to the CDE in the shared state, then the appointing party reviews it against the information requirements for that stage." },
                { title: "Accept or reject", body: "Accepted drops are published; rejected drops come back with a clear list of issues and a date for resubmission." },
              ],
            },
            {
              kind: "callout",
              title: "Early drops are the cheapest",
              body: "The structure, names and classification set up at stage 2 are reused in every later drop. Getting them right early avoids renaming thousands of rows during construction, when time is shortest.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ Authoring
        {
          id: "authoring",
          label: "Authoring from Revit/Archicad",
          blocks: [
            {
              kind: "text",
              title: "Authoring COBie from models",
              body: [
                "Most COBie data starts in the authoring models. Spaces come from rooms or zones, types from family types or object types, and components from placed instances. Parameters on those objects map to COBie columns and to the Attribute sheet.",
                "The key decision is where each field is maintained. Geometry-related fields such as floor, space and area are best taken directly from the model. Product data such as serial numbers and warranty dates is often added later in a spreadsheet, database or CAFM-preparation tool and merged in.",
              ],
            },
            {
              kind: "cards",
              title: "Revit and Archicad in general terms",
              cards: [
                { title: "Revit: rooms and spaces", body: "Rooms (and MEP spaces) become COBie Spaces. Level names become Floors. Room number and name should follow the agreed naming so that Space names are unique and meaningful.", tone: "blue" },
                { title: "Revit: types and components", body: "Family types become Types and placed instances become Components. Shared parameters hold COBie fields such as description, asset type, manufacturer, model number and warranty values.", tone: "teal" },
                { title: "Revit: export tools", body: "Autodesk provides a COBie extension and the IFC exporter can include COBie-related property sets. Third-party tools also offer mapping and checking. Availability varies by version.", tone: "purple" },
                { title: "Archicad: zones and objects", body: "Zones become Spaces, stories become Floors, and objects and library parts become Types and Components. Classification and properties are managed in the classification and property manager.", tone: "green" },
                { title: "Archicad: export", body: "COBie data can be produced through IFC with appropriate translators and property mapping, or through schedule exports and translator templates provided for COBie.", tone: "amber" },
                { title: "Other tools", body: "Plant, structural and MEP tools often export COBie through IFC. Specialist COBie tools can merge, validate and enrich data from several sources.", tone: "red" },
              ],
            },
            {
              kind: "table",
              title: "Typical model-to-COBie mapping",
              columns: ["COBie field", "Typical model source", "Tips"],
              rows: [
                ["Floor.Name", "Level or story name", "Use the agreed level naming; exclude reference and working levels from export"],
                ["Space.Name", "Room or zone number", "Keep unique across the whole facility, not just per floor"],
                ["Space.Description", "Room or zone name", "Use names a facility manager recognises"],
                ["Space.Category", "Room classification parameter", "Code and title from the agreed table, for example Uniclass spaces"],
                ["Type.Name", "Family and type name, or object type", "Avoid generic names such as Type 1; make them readable"],
                ["Type.Category", "Classification parameter on the type", "Use the products or systems table agreed in the information standard"],
                ["Type.Manufacturer", "Shared parameter on the type", "Enter the manufacturer's Contact email, not just the company name"],
                ["Component.Name", "Mark, tag or generated asset name", "Unique and stable; often type name plus a sequence number"],
                ["Component.Space", "Room or space containing the instance", "Check items in ceiling voids, risers and plant areas resolve to a space"],
                ["Component.SerialNumber", "Added during construction", "Usually managed outside the design model and merged in"],
                ["System.ComponentNames", "MEP system or a system parameter", "List component names exactly as they appear on the Component sheet"],
              ],
            },
            {
              kind: "checklist",
              title: "Set up before you model",
              items: [
                "Agree which object categories are in COBie scope and flag them in the model",
                "Load the shared parameter file or property set that holds COBie fields",
                "Agree naming rules for floors, spaces, types and components",
                "Load the agreed classification tables and assign codes to rooms and types",
                "Configure the export tool settings once and share them with every task team",
                "Exclude non-managed elements such as walls, floors and generic annotation from the Component export",
                "Test a small export at mobilization and run the checker on it",
              ],
            },
            {
              kind: "callout",
              title: "Features vary by software version",
              body: "Export tools, extensions and settings change between releases of Revit, Archicad and third-party products. Treat the descriptions here as general guidance and confirm the exact workflow for the versions your project uses.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ Quality checks
        {
          id: "quality",
          label: "Quality checks",
          blocks: [
            {
              kind: "checklist",
              title: "COBie quality checklist",
              items: [
                "All required sheets are present: Contact, Facility, Floor, Space, Type and Component",
                "Facility sheet has exactly one row",
                "Units on the Facility sheet are filled in and match the model",
                "Every Name is unique within its sheet",
                "Every Contact email is unique and well formed",
                "Every CreatedBy value exists on the Contact sheet",
                "CreatedOn values are valid dates in a consistent format",
                "No required (yellow) cell is blank; n/a used only where permitted",
                "Every Space.FloorName exists on the Floor sheet",
                "Every Zone.SpaceNames entry exists on the Space sheet",
                "Every Component.TypeName exists on the Type sheet",
                "Every Component.Space entry exists on the Space sheet",
                "Every System.ComponentNames entry exists on the Component sheet",
                "Category values use the agreed classification in code: title form",
                "Type.Manufacturer references a Contact email",
                "Every Type has at least one Component, or the exception is explained",
                "Document and Attribute rows point to a real SheetName and RowName",
                "Only managed assets are included; no walls, slabs or annotation as components",
                "Serial numbers, installation and warranty dates are complete at handover",
                "Spot checks on site confirm that tags and locations match the workbook",
              ],
            },
            {
              kind: "table",
              title: "Common errors and how to fix them",
              columns: ["Error", "Likely cause", "Fix"],
              rows: [
                ["Duplicate space names", "Room numbers repeated on different floors", "Include a floor prefix or use facility-wide numbering"],
                ["Orphan components", "Component.Space blank or not matching a space name", "Make sure items are within a room boundary or assign the space parameter manually"],
                ["Component references a missing type", "Type renamed after components were exported", "Re-export both sheets together, or update TypeName references"],
                ["CreatedBy not found in Contact", "Exporter used a login name instead of an email", "Set the author email in the export settings and add it to Contact"],
                ["Category in the wrong format", "Only a code or only a title was entered", "Use code and title together from the agreed table"],
                ["Thousands of irrelevant components", "Every modelled element exported", "Filter export by category and the in-scope flag"],
                ["Manufacturer as company name", "Template expects a Contact reference", "Add the manufacturer to Contact and reference its email"],
                ["Dates rejected", "Mixed regional date formats or text values", "Use one consistent ISO-style date format throughout"],
                ["Systems with no components", "System names created but components not assigned", "Assign components in the model or the system parameter, then re-export"],
                ["Generic data at handover", "Design-stage types never updated to installed products", "Update Type and Component data from approved submittals and site records"],
                ["Broken document links", "Files renamed or moved after the Document sheet was made", "Freeze file names in the CDE before final export and check every link"],
              ],
            },
            {
              kind: "cards",
              title: "Three layers of checking",
              cards: [
                { title: "Format checks", body: "Sheets, columns, required values, dates and unique names. Fully automatic and the first gate for every drop.", tone: "blue" },
                { title: "Content checks", body: "Classification, naming rules, references between sheets and project-specific attribute rules. Mostly automatic with a rule set.", tone: "green" },
                { title: "Reality checks", body: "Sampling on site and against approved submittals to prove the data describes what was actually installed. Needs people.", tone: "amber" },
              ],
            },
            {
              kind: "callout",
              title: "Valid is not the same as useful",
              body: "A workbook can pass every format check and still be useless to an FM team if descriptions are cryptic, the wrong assets are included or serial numbers are placeholders. Involve the people who will use the data in the review.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ ISO 19650 link
        {
          id: "iso19650",
          label: "ISO 19650 link",
          blocks: [
            {
              kind: "text",
              title: "Where COBie sits in ISO 19650",
              body: [
                "ISO 19650 does not mandate COBie. It requires the appointing party to define its information requirements and expects information to be delivered in a structured, open and checkable way. COBie is one widely used means of meeting the asset-related part of those requirements, especially in the UK.",
                "The chain runs from the organisation's needs to the project deliverables: organisational information requirements inform the asset information requirements, which inform the exchange information requirements for each appointment, which are delivered through the master information delivery plan and end up in the asset information model.",
              ],
            },
            {
              kind: "table",
              title: "COBie and the ISO 19650 information requirements",
              columns: ["ISO 19650 concept", "What it means", "How COBie relates"],
              rows: [
                ["OIR (organisational information requirements)", "Information the organisation needs for its strategic objectives", "Explains why asset data is needed, for example maintenance planning or compliance"],
                ["AIR (asset information requirements)", "Information needed to manage the assets, defined under ISO 19650-3", "Specifies which asset categories, attributes and documents COBie must carry"],
                ["EIR (exchange information requirements)", "Requirements for a specific appointment, including acceptance criteria", "States COBie format, version, scope, data drop content and checking rules"],
                ["BEP (BIM execution plan)", "How the delivery team will meet the requirements", "Confirms the COBie tools, responsibilities, export settings and checks"],
                ["MIDP and TIDPs", "Delivery plans for information containers by milestone", "List each COBie drop as a deliverable with an owner and a date"],
                ["PIM (project information model)", "Information produced during delivery", "COBie drops build up within the PIM during design and construction"],
                ["AIM (asset information model)", "Information supporting operation and maintenance", "The accepted handover COBie is transferred into the AIM and kept current"],
                ["CDE (common data environment)", "Managed environment for information containers", "COBie workbooks move through WIP, shared, published and archived states like any container"],
              ],
            },
            {
              kind: "cards",
              title: "Parts of ISO 19650 that matter most",
              cards: [
                { title: "ISO 19650-1", body: "Concepts and principles: the information requirements hierarchy, the PIM and AIM, and the role of open, structured information.", tone: "blue" },
                { title: "ISO 19650-2", body: "The delivery phase: where EIRs, BEPs, MIDPs and the acceptance of COBie drops are managed for each appointment.", tone: "teal" },
                { title: "ISO 19650-3", body: "The operational phase: defines AIR and how the AIM is maintained, which is where handover COBie is used and kept up to date.", tone: "green" },
                { title: "ISO 19650-4", body: "Information exchange: sets out criteria for reviewing and exchanging information, which apply to each COBie submission and acceptance decision.", tone: "purple" },
                { title: "ISO 19650-5", body: "Security-minded information management: asset registers can reveal sensitive information, so apply the security assessment before sharing.", tone: "red" },
              ],
            },
            {
              kind: "callout",
              title: "Write COBie into the requirements, not just the contract",
              body: "A clause that simply says provide COBie leads to disputes. The EIR should name the version, the in-scope asset categories, the attributes by stage, the classification system, the checker and the acceptance criteria.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ Delivery playbook
        {
          id: "playbook",
          label: "Delivery playbook",
          blocks: [
            {
              kind: "cards",
              title: "Who does what",
              cards: [
                { title: "Appointing party (client)", body: "Defines AIR and EIR, provides the template and picklists, names the receiving system and accepts each drop.", tone: "green" },
                { title: "Client FM or asset manager", body: "Confirms which assets and attributes are really needed and tests imports into CAFM or CMMS systems.", tone: "teal" },
                { title: "Lead appointed party information manager", body: "Sets up export settings, merges task team data, runs checks and submits drops.", tone: "blue" },
                { title: "Design task teams", body: "Create spaces, zones, types, components and systems in the models with correct names and classification.", tone: "purple" },
                { title: "Main contractor and subcontractors", body: "Replace generic data with installed product data, serial numbers, dates, spares and maintenance jobs.", tone: "amber" },
                { title: "Commissioning manager", body: "Confirms systems, components and tags match what has been commissioned and tested.", tone: "red" },
              ],
            },
            {
              kind: "table",
              title: "COBie RACI by activity",
              columns: ["Activity", "Appointing party", "Lead appointed party", "Design teams", "Contractor", "FM team"],
              rows: [
                ["Define AIR and COBie scope", "A", "C", "I", "I", "R"],
                ["Provide template, picklists and classification", "A", "R", "I", "I", "C"],
                ["Set up export and naming rules", "I", "A", "R", "C", "I"],
                ["Spatial data (Floor, Space, Zone)", "I", "A", "R", "I", "C"],
                ["Design types and components", "I", "A", "R", "C", "I"],
                ["Product, serial and warranty data", "I", "A", "C", "R", "I"],
                ["Spares and maintenance jobs", "C", "A", "I", "R", "C"],
                ["Merge and check each drop", "I", "A", "C", "R", "I"],
                ["Review and accept drops", "A", "I", "I", "I", "R"],
                ["Import into CAFM and maintain the AIM", "A", "I", "I", "C", "R"],
              ],
            },
            {
              kind: "steps",
              title: "Acceptance process for a COBie drop",
              steps: [
                { title: "Submission", body: "The lead appointed party shares the workbook in the CDE with the right status, revision and a short submission note listing known exceptions." },
                { title: "Automated check", body: "The client runs the agreed checker and rule set and records the result against the acceptance criteria." },
                { title: "Content review", body: "FM and asset representatives sample descriptions, classification and attributes for usefulness." },
                { title: "Test import", body: "Where possible, the workbook is imported into a test instance of the receiving system to prove it loads cleanly." },
                { title: "Decision", body: "The drop is accepted and published, or rejected with an issue list, owners and a resubmission date." },
                { title: "Lessons learned", body: "Recurring errors are fed back into export settings and modelling guidance so the next drop is better." },
              ],
            },
            {
              kind: "callout",
              title: "Agree a COBie responsibility matrix",
              body: "Columns change hands during a project. A matrix that lists each sheet and column, the stage it is due, and who provides it removes most arguments about missing data.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ FAQ
        {
          id: "faq",
          label: "FAQ",
          blocks: [
            {
              kind: "faq",
              title: "Frequently asked questions",
              items: [
                { q: "Is COBie mandatory under ISO 19650?", a: "No. ISO 19650 requires clear information requirements and structured delivery, but does not name COBie. Many clients, especially in the UK, choose COBie to meet their asset information requirements." },
                { q: "Which COBie version should we use?", a: "COBie 2.4 is the version most widely used with BS 1192-4 and by common tools. Whatever you choose, state it in the EIR and make sure the export tools and the checker use the same version." },
                { q: "Do we have to fill every sheet?", a: "No. Contact, Facility, Floor, Space, Type and Component form the core. Other sheets are completed only when the client's requirements ask for them." },
                { q: "Should walls and floors be components?", a: "Usually not. COBie is for managed assets. Include building fabric only if the client manages it as an asset, for example for specific finishes or roofs with warranties." },
                { q: "What does n/a mean in a COBie cell?", a: "It is commonly used to show that a required field does not apply to that row. Agree with the client when it may be used, because overuse hides genuinely missing data." },
                { q: "Who provides serial numbers?", a: "The contractor or installer, from the installed equipment. They are not known at design stage and are added during construction or commissioning." },
                { q: "Can COBie be delivered as IFC instead of a spreadsheet?", a: "Yes. COBie can be carried in IFC using an appropriate model view. Many clients still ask for the spreadsheet because it is easy to review and import." },
                { q: "How do we handle items outside any room, such as external lighting?", a: "Create external spaces or areas on an external floor so every component has a valid location. Agree the approach in the naming rules." },
                { q: "What classification should be used?", a: "The one stated in the project information standard. In the UK this is usually Uniclass. Use code and title together in the Category fields." },
                { q: "How big should a COBie workbook be?", a: "As big as the in-scope assets require and no bigger. A sudden jump in components usually means non-managed elements are being exported." },
                { q: "Who owns the COBie data after handover?", a: "Ownership and licence terms are set in the appointment and information protocol. In practice the appointing party receives it into its AIM and maintains it." },
                { q: "Can we fix COBie errors directly in the spreadsheet?", a: "For product data maintained outside the model, yes. For model-derived data, fix the model and re-export, otherwise the next drop will reintroduce the error." },
              ],
            },
            {
              kind: "callout",
              title: "Still unsure?",
              body: "Use the AI tools tab to ask a specific question about your project, or run your workbook through the COBie checker to see exactly which rows need attention.",
              tone: "info",
            },
            {
              kind: "cards",
              title: "Quick answers by role",
              cards: [
                { title: "Client", body: "Define scope and attributes in the AIR, provide the template and picklists, and check every drop, not just the last one.", tone: "green" },
                { title: "Designer", body: "Get names, classification, spaces and types right in the model; most later errors start here.", tone: "blue" },
                { title: "Contractor", body: "Plan how product, serial and warranty data will be collected from subcontractors well before handover.", tone: "amber" },
                { title: "FM team", body: "Say early what your CAFM or CMMS system needs and test imports with each drop.", tone: "purple" },
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ Quiz
        {
          id: "quiz",
          label: "Quiz",
          blocks: [
            {
              kind: "quiz",
              title: "Test your COBie knowledge",
              questions: [
                { q: "Which UK document is the code of practice for using COBie to fulfil employer information requirements?", options: ["BS EN ISO 19650-5", "BS 1192-4", "PAS 1192-6", "BS 8536-1"], answer: 1, why: "BS 1192-4 sets out how COBie is used to meet the employer's information exchange requirements." },
                { q: "Which sheet should contain exactly one row?", options: ["Floor", "Contact", "Facility", "System"], answer: 2, why: "The Facility sheet describes the single facility being handed over." },
                { q: "What is the unique key on the Contact sheet?", options: ["Company", "Email", "Phone", "Name"], answer: 1, why: "Contacts are identified by email, and other sheets reference them through CreatedBy and manufacturer fields." },
                { q: "A Component must reference which two sheets?", options: ["Type and Space", "Floor and Zone", "System and Document", "Facility and Contact only"], answer: 0, why: "Each component is an instance of a Type and is located in a Space." },
                { q: "What does a Zone group together?", options: ["Components", "Types", "Spaces", "Documents"], answer: 2, why: "Zones are named groups of spaces, such as fire compartments or heating zones." },
                { q: "What does a System group together?", options: ["Spaces", "Components", "Floors", "Contacts"], answer: 1, why: "Systems group components that work together to provide a service." },
                { q: "In common COBie templates, what does an orange or salmon header usually indicate?", options: ["Optional field", "Value generated by software", "Reference to another sheet or picklist", "Field not used"], answer: 2, why: "By convention, reference fields must match a value on another sheet or a picklist." },
                { q: "At which stage are serial numbers normally added?", options: ["Concept design", "Spatial coordination", "Technical design", "Manufacturing and construction"], answer: 3, why: "Serial numbers come from installed equipment, so they are added during construction or commissioning." },
                { q: "Which ISO 19650 requirement most directly defines what asset data COBie must carry?", options: ["Asset information requirements (AIR)", "Task information delivery plan (TIDP)", "Responsibility matrix only", "Mobilization plan"], answer: 0, why: "The AIR, defined in ISO 19650-3, states the information needed to manage assets." },
                { q: "How should Category values usually be written?", options: ["Free text chosen by the modeller", "A code and title from the agreed classification", "The family name", "Left blank"], answer: 1, why: "Classification is written as code and title from the agreed system, usually Uniclass in the UK." },
                { q: "Which of these is normally out of COBie scope as a component?", options: ["A boiler", "A fire extinguisher", "A structural floor slab", "A luminaire"], answer: 2, why: "COBie components are managed assets. Structural slabs are rarely maintained as individual assets." },
              ],
            },
            {
              kind: "checklist",
              title: "Revise these before you start",
              items: [
                "The spatial hierarchy: Facility, Floor, Space, Zone",
                "The physical hierarchy: Type, Component, System",
                "Which sheets reference Contact, Floor, Space and Type",
                "The common header colour convention",
                "What is delivered at each stage",
                "How AIR, EIR and AIM relate to COBie",
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
        // ------------------------------------------------------------------ AI tools
        {
          id: "ai",
          label: "AI tools",
          blocks: [
            { kind: "widget", widget: "ask-ai", title: "Ask AI about COBie" },
            { kind: "widget", widget: "generate", title: "Draft a COBie data requirements schedule", docType: "COBie data requirements schedule" },
            {
              kind: "callout",
              title: "Check your workbook with the COBie checker",
              body: "The COBie checker is under AI tools, then COBie checker. Upload your workbook to see missing sheets and columns, blank required fields, duplicate names, broken references and classification problems, with a score for each drop.",
              tone: "ok",
            },
            {
              kind: "callout",
              title: "Check AI output",
              body: "AI drafts are a starting point. The information manager and the client's FM team should confirm asset scope, attributes, stages and acceptance criteria before a schedule is issued.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "Which assets and attributes should be in COBie for a new primary school?",
    "How do I fix orphan components that have no valid Space in my COBie export?",
    "What COBie content should be delivered at RIBA Stage 4 compared with Stage 6?",
    "How should COBie be written into the EIR and acceptance criteria under ISO 19650?",
  ],
};
