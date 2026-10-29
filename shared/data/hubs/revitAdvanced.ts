import type { HubSection } from "./types";

// Revit hub, advanced sections: federation and the CDE, data governance with IDS, model health
// metrics, the Revit API, and connecting Claude to Revit and other Autodesk products through MCP.
// MCP product facts come from the FirstOption MCP Hub public pages (mcp-hub.firstoption-es.com,
// read October 2026). Versions, plans and features change, so the page tells readers to check there.

const HUB = "https://mcp-hub.firstoption-es.com";

export const revitAdvancedSection: HubSection = {
  id: "advanced",
  label: "Advanced Revit",
  tabs: [
    // ------------------------------------------------------------------ Federation and the CDE
    {
      id: "federation",
      label: "Federation & CDE",
      blocks: [
        {
          kind: "text",
          title: "Splitting and federating models deliberately",
          body: [
            "On anything beyond a small building, one model per discipline is not enough. Split models by discipline first, then by zone, building or volume where file size, team size or the delivery programme calls for it. Each split must match a volume code in the container naming, so the model breakdown, the information container breakdown and the MIDP all describe the same structure.",
            "Federation means bringing the separate models together for review without merging them. Each task team keeps authority over its own model; the federated view is read only and built from shared or published containers, never from work in progress.",
          ],
        },
        {
          kind: "table",
          title: "When to split a Revit model",
          columns: ["Trigger", "Suggested response", "Naming effect"],
          rows: [
            ["File over roughly 300–500 MB, or slow sync even after tidying", "Split by building, zone or level group", "New volume code per model"],
            ["More than about 15 people working in one model", "Split by zone or by sub-discipline, such as façade or interiors", "New volume or role code"],
            ["Separate design packages or contractors", "One model per package so each can be issued and approved on its own", "Originator and volume codes match the package"],
            ["Large site or infrastructure context", "Keep site, topography and context in their own model and link it", "Site volume code, for example ZZ or 00"],
            ["Repeated identical units", "Model one unit and link it several times, or use groups with care", "Unit model named as its own container"],
          ],
        },
        {
          kind: "steps",
          title: "Mapping Revit work to the CDE states",
          steps: [
            { title: "Work in progress", body: "The team models in its own central or cloud model. Nothing here is referenced by other teams." },
            { title: "Check before sharing", body: "Run the model QA checklist, purge working views, fill status and revision parameters and confirm the file name matches the container naming." },
            { title: "Shared", body: "Publish or issue the container with a suitability code such as S1 or S2. In Autodesk Construction Cloud, a Design Collaboration package plays this role; other teams consume the package rather than the live model." },
            { title: "Consume and coordinate", body: "Other teams link the shared version, not the live one, so their coordination is based on a known revision." },
            { title: "Published", body: "After the authorisation and acceptance steps, the accepted containers move to published with an A-series status and a contractual revision." },
            { title: "Archive", body: "Superseded versions are kept with their history so any decision can be traced back to the information used at the time." },
          ],
        },
        {
          kind: "cards",
          title: "Linking rules for federated projects",
          cards: [
            { title: "Overlay, not attachment", body: "Link other teams' models as overlay so they do not chain through to everyone who links yours. Use attachment only for your own sub-models.", tone: "blue" },
            { title: "Link the shared version", body: "Point links to shared or consumed packages, not to another team's work in progress folder.", tone: "green" },
            { title: "One workset per link", body: "Put every link on its own workset so people can close links they do not need and open models faster.", tone: "teal" },
            { title: "Record link versions", body: "Note which revision of each link was used for each issue, for example in the transmittal or a link-version schedule.", tone: "purple" },
            { title: "Copy/Monitor sparingly", body: "Monitor levels, grids and a few key elements. Monitoring large numbers of elements slows the model and creates noise.", tone: "amber" },
            { title: "Never bind to avoid links", body: "Binding a link into your model copies another team's information into your container and breaks ownership.", tone: "red" },
          ],
        },
        {
          kind: "callout",
          title: "Write the split into the BEP",
          body: "The model breakdown, the volume codes, the link type and who owns each model belong in the BIM execution plan and the MIDP. If the split changes during the project, update both and tell every task team.",
          tone: "info",
        },
      ],
    },
    // ------------------------------------------------------------------ Data governance with IDS
    {
      id: "ids",
      label: "Data governance & IDS",
      blocks: [
        {
          kind: "text",
          title: "From requirements to checkable rules",
          body: [
            "The level of information need tells you what each element must carry at each stage. The weak point on most projects is that this stays in a PDF. buildingSMART's Information Delivery Specification (IDS), approved as version 1.0 in 2024, turns those requirements into a machine-readable file that IFC checking tools can test automatically.",
            "A good Revit data strategy works backwards from the checks: decide what the IDS will test, map each requirement to a Revit parameter, make sure the IFC export maps that parameter to the right property set, and check the exported IFC rather than trusting the model.",
          ],
        },
        {
          kind: "steps",
          title: "Requirement-to-IFC chain",
          steps: [
            { title: "Requirement", body: "From the EIR and LOIN: for example, every door in scope needs a fire rating at stage 4." },
            { title: "IDS specification", body: "Applicability: IfcDoor. Requirement: property FireRating in Pset_DoorCommon must exist and use an allowed value." },
            { title: "Revit parameter", body: "A shared parameter or the built-in Fire Rating parameter, on the type, with a key schedule or allowed values." },
            { title: "Export mapping", body: "The IFC export setup or a user-defined property set file maps the Revit parameter to Pset_DoorCommon.FireRating." },
            { title: "Automated check", body: "Run the exported IFC against the IDS in a checking tool and attach the report to the QA record." },
            { title: "Fix at the source", body: "Correct the Revit parameter or mapping, never the IFC file, then export and check again." },
          ],
        },
        {
          kind: "table",
          title: "Classification and data sources",
          columns: ["Source", "What it gives you", "How it is used in Revit"],
          rows: [
            ["Uniclass 2015", "UK classification tables such as Ss systems, Pr products and EF elements", "Classification parameters on types, exported to IfcClassificationReference"],
            ["OmniClass", "North American classification tables, including table 23 for products", "Assembly code or a shared parameter, depending on the project"],
            ["buildingSMART Data Dictionary (bSDD)", "Shared definitions of classes and properties from many dictionaries", "Reference for property names and allowed values; some tools link to it directly"],
            ["IFC property sets (Pset_)", "Standard properties for each IFC class", "Target of the export mapping"],
            ["Project property sets", "Properties the client asks for that no standard set covers", "Custom property set with an agreed prefix, defined in the information standard"],
          ],
        },
        {
          kind: "cards",
          title: "Governance practices",
          cards: [
            { title: "One parameter register", body: "Keep one controlled list of every parameter: name, GUID, data type, type or instance, categories, IFC mapping and the stage it is needed.", tone: "blue" },
            { title: "Cloud parameter service", body: "Recent Revit releases used with Autodesk Construction Cloud can share parameters through an account-level parameters service, a modern alternative to the shared parameter text file. Check availability for your release and licence.", tone: "teal" },
            { title: "Lock the GUIDs", body: "A parameter is identified by its GUID. Creating a second parameter with the same name but a new GUID splits your data in two.", tone: "red" },
            { title: "Version the export setup", body: "Keep IFC export setups and mapping files under version control with the template, and record which version produced each issued file.", tone: "purple" },
          ],
        },
        {
          kind: "callout",
          title: "Check the IFC, not the model",
          body: "The receiving party gets the IFC, so the IFC is what must pass. A parameter that is filled in Revit but not mapped in the export does not exist for the client.",
          tone: "warn",
        },
      ],
    },
    // ------------------------------------------------------------------ Model health metrics
    {
      id: "health",
      label: "Model health KPIs",
      blocks: [
        {
          kind: "text",
          title: "Measure model health, don't guess it",
          body: [
            "Model health problems build up slowly and then make a model hard to use. Track a small set of numbers for every model at each sharing point, show them as a trend and agree thresholds in the BIM manual. The numbers below are suggested starting points for a building model, not industry rules; set your own from your projects.",
          ],
        },
        {
          kind: "table",
          title: "Suggested health metrics",
          columns: ["Metric", "Why it matters", "Suggested target", "How to measure"],
          rows: [
            ["Warnings", "Duplicate elements, overlaps and join problems slow the model and hide errors", "Falling trend; under about 200 for a large model", "Review Warnings, export the list and count by type"],
            ["File size", "Large files sync slowly and fail more often", "Within the split rules in the BEP", "File properties or the cloud model size"],
            ["Imported CAD", "Imported DWG bloats files and brings in line styles and patterns", "Zero imports; link CAD instead", "Manage Links and Object Styles for imported categories"],
            ["In-place families", "Hard to schedule, classify and reuse", "Only for genuinely unique elements", "Schedule or script counting in-place instances"],
            ["Groups", "Large or nested groups make edits and syncs slow", "Few, small and not nested", "Group count and instance count"],
            ["Unplaced or redundant rooms and spaces", "Wrong areas and broken COBie spaces", "Zero", "Room schedule filtered on area = 0 or Not placed"],
            ["Views not on sheets", "Clutter and larger files", "Working views kept under a prefix and purged before issue", "View list filtered on sheet number empty"],
            ["Unused families and types", "Larger file, confusing type lists", "Purged before each issue", "Purge Unused preview count"],
            ["Elements on the wrong workset", "Visibility and loading problems", "Zero links outside their workset", "Workset check script or schedule"],
            ["Missing required data", "Failed IDS checks and incomplete handover", "Zero blanks for the current stage", "QA schedules and the IFC check report"],
          ],
        },
        {
          kind: "steps",
          title: "A health dashboard routine",
          steps: [
            { title: "Collect", body: "Before each share, record the metrics for every model, by hand, with a script or through an MCP prompt." },
            { title: "Compare", body: "Put this share next to the last few. A rising trend matters more than any single value." },
            { title: "Act", body: "Agree one or two fixes per model for the next cycle, with an owner, rather than a long list nobody does." },
            { title: "Report", body: "Show the trend in the coordination meeting and keep it in the QA record for audit." },
          ],
        },
        {
          kind: "callout",
          title: "Warnings are not equal",
          body: "Room separation overlaps and duplicate instances matter far more than a slightly off-axis line. Sort warnings by type and fix the types that affect quantities, rooms and clashes first.",
          tone: "info",
        },
      ],
    },
    // ------------------------------------------------------------------ Advanced modelling
    {
      id: "modelling",
      label: "Phases, options & assemblies",
      blocks: [
        {
          kind: "cards",
          title: "Advanced modelling features and when to use them",
          cards: [
            { title: "Phases", body: "Use phases for existing, demolition and new construction so that refurbishment quantities and drawings come from one model. Agree phase names and phase filters in the template; do not invent phases for programme sequencing.", tone: "blue" },
            { title: "Design options", body: "Good for comparing a few alternatives in one model. Accept or delete options before the design is frozen; leftover options confuse schedules and IFC export.", tone: "purple" },
            { title: "Assemblies", body: "Group elements that are fabricated or delivered together, such as precast units or modular risers, and generate their own views and sheets.", tone: "green" },
            { title: "Parts", body: "Split layered elements into parts for construction sequencing or trade quantities without changing the design element.", tone: "teal" },
            { title: "Groups", body: "Useful for repeated layouts, but keep them small and never nest deeply. Large groups are a common cause of slow syncs.", tone: "amber" },
            { title: "Scope boxes", body: "Control the extent of levels, grids and reference planes, and keep dependent views aligned across a large plan.", tone: "blue" },
          ],
        },
        {
          kind: "table",
          title: "Effect on IFC and COBie",
          columns: ["Feature", "What happens on export", "What to check"],
          rows: [
            ["Phases", "The export uses the phase set in the export setup", "Export the phase the receiving party needs, usually New Construction"],
            ["Design options", "Only the primary option is normally exported", "Remove or accept options before handover"],
            ["Assemblies", "Can export as IfcElementAssembly with the members inside", "Confirm the receiving tool reads assemblies"],
            ["Parts", "Can replace the original element when parts are visible in the view", "Export from a view set up for the purpose"],
            ["Groups", "Group members export as separate elements; group names may be lost", "Do not use groups to carry asset data"],
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ Revit API
    {
      id: "api",
      label: "Revit API essentials",
      blocks: [
        {
          kind: "text",
          title: "What you need to know before automating",
          body: [
            "Every automation route, from Dynamo and pyRevit to C# add-ins and MCP connectors, ends up calling the same Revit API. Knowing a few of its rules helps you judge whether a script, or an AI-generated command, is safe to run on a project model.",
          ],
        },
        {
          kind: "table",
          title: "Key API concepts",
          columns: ["Concept", "What it means", "Why it matters for ISO 19650 work"],
          rows: [
            ["Transaction", "Every change to the model happens inside a named transaction that can be committed or rolled back", "A change made in one transaction can be undone in one step; good tools use one per task"],
            ["ElementId vs UniqueId", "ElementId is a number local to the file; UniqueId is a stable string", "Use UniqueId, or the IFC GUID, to track assets between versions and to match spreadsheet data"],
            ["64-bit ElementId", "Revit 2024 moved element ids to 64-bit values", "Older scripts that read ids as 32-bit integers must be updated"],
            ["FilteredElementCollector", "The efficient way to find elements by category, class or parameter", "Quick, precise selection of elements for QA checks"],
            ["Parameters and storage types", "Each parameter stores text, integer, double or an element id, in internal units", "Lengths are stored in feet internally; convert units before comparing values"],
            ["Extensible storage", "Lets an add-in store its own data in the model", "Useful for tool settings, but invisible to schedules and IFC; keep project data in parameters"],
            ["Dynamic model updaters", "Code that reacts automatically when certain elements change", "Powerful, but can surprise users; document any updater in the BEP"],
            ["External events", "The safe way for a modeless tool or outside process to ask Revit to run code", "This is how connectors such as MCP bridges run commands in a live session"],
            [".NET version", "Revit 2025 and 2026 use .NET 8; 2027 moves to .NET 10; earlier releases use .NET Framework", "Compiled add-ins need a build per release family"],
          ],
        },
        {
          kind: "checklist",
          title: "Reviewing a script or AI-generated command",
          items: [
            "It says which elements it will touch and how it selects them",
            "It changes the model inside one named transaction",
            "It has been run as a dry run or on a detached copy first",
            "It reports what it changed: element ids, old and new values",
            "It handles missing parameters and read-only values without crashing",
            "It converts units before comparing or writing numbers",
            "It does not delete elements without an explicit confirmation",
            "It is stored with a version and an owner so it can be rerun",
          ],
        },
      ],
    },
  ],
};

export const revitMcpSection: HubSection = {
  id: "mcp",
  label: "MCP for Revit & Autodesk",
  tabs: [
    // ------------------------------------------------------------------ Overview
    {
      id: "overview",
      label: "Overview",
      blocks: [
        {
          kind: "text",
          title: "AI working inside your Autodesk software",
          body: [
            "The Model Context Protocol (MCP) is an open standard that lets an AI assistant such as Claude use tools provided by other software. An MCP connector for Revit gives Claude a controlled way to read a live model, run checks and, when you allow it, make changes: auditing names, filling parameters, preparing sheets for issue or reporting model health, all from a plain-language request.",
            "The FirstOption MCP Hub provides connectors for Revit, AutoCAD, Civil 3D, Plant 3D and Navisworks. Claude Code or Codex runs on your PC, the connector runs code inside the Autodesk application, and the hub shares a library of commands that worked across your office.",
          ],
        },
        { kind: "graphic", graphic: "autodesk-mcp-flow", title: "How the pieces fit together", caption: "Claude runs on the workstation and talks to the connector; the connector runs code inside the open application. The hub holds the shared command library, skills, releases and audit log, not your models." },
        {
          kind: "links",
          title: "FirstOption MCP Hub",
          links: [
            { label: "MCP Hub home", href: `${HUB}/`, note: "Overview, download and frequently asked questions", tone: "blue" },
            { label: "Revit MCP", href: `${HUB}/products/revit-mcp?public`, note: "Capabilities, supported versions and installation", tone: "purple" },
            { label: "All products", href: `${HUB}/products?public`, note: "AutoCAD, Civil 3D, Plant 3D and Navisworks connectors", tone: "teal" },
            { label: "Sign up", href: `${HUB}/signup`, note: "Create your company and get the code to connect each PC", tone: "green" },
            { label: "Sign in", href: `${HUB}/login`, note: "Company admin: PCs, subscription, library and audit log", tone: "amber" },
          ],
        },
        {
          kind: "table",
          title: "The connectors",
          columns: ["Connector", "Application versions", "What it runs", "Typical disciplines"],
          rows: [
            ["Revit MCP (firstoption-revit)", "Revit 2017–2027", "IronPython and C# inside Revit through pyRevit Routes and a Revit add-in", "Architecture, structure, MEP, BIM management, documentation, QA/QC"],
            ["AutoCAD MCP (firstoption-autocad)", "AutoCAD 2015–2027, not AutoCAD LT", "AutoLISP for quick queries and edits, C# for heavy geometry, blocks, attributes and layouts", "Drafting, documentation, CAD data extraction"],
            ["Civil 3D MCP (firstoption-civil3d)", "Civil 3D 2015–2027", "C# through the Civil 3D .NET API and AutoLISP", "Civil, infrastructure"],
            ["Plant 3D MCP (firstoption-plant3d)", "AutoCAD Plant 3D 2015–2027", "C# through the Plant 3D .NET API and AutoLISP; reads piping, equipment and project properties", "Piping, plant design, equipment"],
            ["Navisworks MCP (firstoption-navisworks)", "Navisworks Manage or Simulate 2020–2027, not Freedom", "C# through the Navisworks .NET API: models, selection sets, viewpoints and clash tests", "Coordination, clash detection"],
          ],
        },
        {
          kind: "cards",
          title: "What makes it suitable for project work",
          cards: [
            { title: "One undo step", body: "Each Revit command runs as a single undo step, so a change can be reversed in one go.", tone: "blue" },
            { title: "Dry run first", body: "A dry run reports what would change and then rolls back, so you can check before anything is kept.", tone: "green" },
            { title: "Verification and rollback", body: "A verification step rolls the change back if it fails, and Revit warnings come back as text instead of dialogs.", tone: "teal" },
            { title: "Shared command library", body: "Commands that worked are saved with their inputs and reused, so the office builds up tested tools rather than one-off prompts.", tone: "purple" },
            { title: "Reviewed, staged releases", body: "FirstOption reviews library changes and releases them to a pilot group of PCs before everyone.", tone: "amber" },
            { title: "Models stay local", body: "Code runs inside the application on the PC. The hub stores the library, skills, usage figures and the audit log, without model content or prompts.", tone: "red" },
          ],
        },
        {
          kind: "callout",
          title: "Check the hub for current details",
          body: "Supported versions, plans and features are taken from the FirstOption MCP Hub pages in October 2026. At that time the hub described the suite as free for now, with one Engineering Automation Suite subscription covering every connector. Confirm the current position on the hub before rolling it out.",
          tone: "info",
        },
      ],
    },
    // ------------------------------------------------------------------ Install and connect
    {
      id: "install",
      label: "Install & connect",
      blocks: [
        {
          kind: "checklist",
          title: "What each PC needs",
          items: [
            "Windows 10 or 11",
            "The Autodesk application in a supported version (Revit 2017–2027 for the Revit MCP)",
            "Claude Code or Codex; the suite setup adds Claude Code, Codex and Node.js when they are missing",
            "pyRevit 5 or later for the Revit MCP; the setup installs it when missing",
            "A company account on the hub and the code to connect the PC",
          ],
        },
        {
          kind: "steps",
          title: "Set up the FirstOption MCP Suite",
          steps: [
            { title: "Sign up your company", body: "Create the company on the hub at mcp-hub.firstoption-es.com/signup. The company admin manages PCs, the subscription and the library." },
            { title: "Download the suite", body: "Download the FirstOption MCP Suite for Windows from the hub. One setup covers every connector and needs no admin rights." },
            { title: "Run the setup on each PC", body: "Run it on every workstation that will use AI. It installs the add-ins and MCP servers, and adds Claude Code, Codex, Node.js and pyRevit if they are missing." },
            { title: "Connect the PC", body: "Open the Autodesk application and go to First Option > Hub Settings. Enter your company's code to connect the PC to the hub." },
            { title: "Assign the PC", body: "The company admin assigns the PC to the subscription in the hub." },
            { title: "Sign in to Claude", body: "Start Claude Code on the PC and sign in with your Claude account. Codex works the same way with an OpenAI account." },
            { title: "Check the connection", body: "With the model open, run /mcp in Claude Code and confirm the connector, for example firstoption-revit, is listed and connected. Then ask a read-only question such as 'How many levels and sheets are in the open model?'" },
          ],
        },
        {
          kind: "table",
          title: "Supported Revit versions",
          columns: ["Revit", "Runtime", "Note from the hub"],
          rows: [
            ["2027", ".NET 10", "The add-in has a build for this version"],
            ["2025–2026", ".NET 8", "The hub connector is tested against Revit 2026"],
            ["2021–2024", ".NET Framework 4.8", "The add-in has builds for these versions"],
            ["2017–2020", ".NET Framework 4.7.2", "Supported; 2015–2016 are not, because pyRevit does not run in them"],
          ],
        },
        {
          kind: "faq",
          title: "Troubleshooting",
          items: [
            { q: "The connector does not appear in /mcp.", a: "Make sure the setup finished on this PC, restart Claude Code, and start it again with the Autodesk application already open. Check that the PC is connected under First Option > Hub Settings and assigned to the subscription." },
            { q: "Revit shows no First Option menu.", a: "Check that your Revit version is supported and that pyRevit loaded; the pyRevit tab should be visible. Run the suite setup again if the add-in did not install." },
            { q: "Commands time out.", a: "Revit can only run commands while it is not busy. Close dialogs, finish any edit mode and let syncs complete, then try again." },
            { q: "Can I use it with Revit LT or AutoCAD LT?", a: "No. The LT products have no API for add-ins to use." },
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ How it works
    {
      id: "how",
      label: "How it works",
      blocks: [
        {
          kind: "steps",
          title: "What happens when you ask",
          steps: [
            { title: "You ask", body: "For example: 'List every sheet whose number does not follow our naming rule.'" },
            { title: "Claude plans", body: "Claude reads the request, checks the office skill tree and the command library for a command that already does this, and decides what code to run." },
            { title: "Dry run", body: "For a change, the command first runs as a dry run that reports what would change and rolls back." },
            { title: "Run in Revit", body: "When you agree, the code runs inside Revit through the add-in as one undo step." },
            { title: "Verify", body: "A verification step checks the result and rolls the change back if it fails. Warnings come back as text." },
            { title: "Save to the library", body: "A command that worked is saved with its inputs, so the next request reuses tested code instead of writing it again." },
          ],
        },
        {
          kind: "cards",
          title: "Library, skills and releases",
          cards: [
            { title: "Command library", body: "Reusable commands with their inputs, shared across the company's PCs through the hub. The add-in's Sync button sends and receives updates.", tone: "blue" },
            { title: "Skill tree", body: "Records how your office does things, discipline by discipline: your naming rules, parameter names and QA steps. Claude follows it, so results match your standards.", tone: "green" },
            { title: "Reviewed changes", body: "Changes to the company library are reviewed and merged by a FirstOption version manager assigned to your company.", tone: "purple" },
            { title: "Pilot ring", body: "Releases go to a pilot group of PCs first, then to everyone. Each PC reports what it installed.", tone: "amber" },
            { title: "Audit trail", body: "Every change and release is recorded on a hash-chained, tamper-evident log the company can export.", tone: "teal" },
            { title: "QA, families and captures", body: "Rule-set audits that select failing elements, family editing for parameters, types, reference planes and extrusions, and view or sheet captures as images.", tone: "red" },
          ],
        },
        {
          kind: "callout",
          title: "Put your standards into the skill tree",
          body: "The more of your information standard the skill tree holds, such as field codes, parameter names, view naming and QA rules, the less you need to explain in each prompt and the more consistent the results across the team.",
          tone: "ok",
        },
      ],
    },
    // ------------------------------------------------------------------ ISO 19650 workflows
    {
      id: "workflows",
      label: "ISO 19650 workflows",
      blocks: [
        {
          kind: "table",
          title: "Revit tasks you can hand to Claude",
          columns: ["Task", "Example prompt", "ISO 19650 link"],
          rows: [
            ["Naming audit", "Check every sheet number and view name against our naming rules in the skill tree. Select the failures and list them with the rule each one breaks.", "Information container naming, ISO 19650-2 5.1.7"],
            ["Required data check", "For doors, windows and mechanical equipment, list elements with an empty Fire Rating, Manufacturer, Model or Classification. Group the result by level.", "Level of information need, ISO 19650-1 11"],
            ["Parameter fill", "Do a dry run: copy the room number into the Space Number parameter of every mechanical equipment element inside that room. Report how many would change.", "Information model for COBie and asset data"],
            ["Sheet issue preparation", "For the sheets in the 'Stage 4 Issue' set, set revision P03, suitability S2 and today's date, then export PDFs named from the sheet number.", "Status and revision codes, CDE workflow"],
            ["Model health report", "Count warnings by type, imported CAD files, in-place families, groups, unplaced rooms and views not on sheets. Compare with last week's numbers in the library.", "Quality assurance before sharing"],
            ["Workset check", "Find elements and links that are not on their agreed workset and list them with their category.", "Information production methods"],
            ["Classification", "List types in scope that have no Uniclass Pr code, and suggest codes from the type names for me to review.", "Classification in the information standard"],
            ["IFC preparation", "Check that every IFC export parameter mapped in our setup exists on the categories that need it, and list the gaps.", "Exchange in open formats, ISO 19650-1 and -4"],
          ],
        },
        {
          kind: "table",
          title: "Other Autodesk products",
          columns: ["Product", "Task", "Example prompt"],
          rows: [
            ["AutoCAD", "Layer standard check", "List layers that are not in our layer standard, with the number of objects on each, and do a dry run of moving them to the correct layers."],
            ["AutoCAD", "Title block update", "In every layout, update the title block attributes for revision, status and date from this table."],
            ["Civil 3D", "Alignment and corridor report", "List every alignment with its length, design speed and start and end stations, and every corridor with its baseline and regions."],
            ["Civil 3D", "Object naming", "Check alignment, profile and surface names against our naming rule and list the ones that do not match."],
            ["Plant 3D", "Line list check", "List pipe lines with missing line numbers, specs or sizes, and lines whose tag does not follow our tag format."],
            ["Navisworks", "Clash run and report", "Run all clash tests, group new clashes by level and discipline pair, and list the top 20 by count."],
            ["Navisworks", "Search and selection sets", "Create selection sets for each discipline model and for each level, using the source file name and level property."],
          ],
        },
        {
          kind: "steps",
          title: "Example: weekly pre-share check in Revit",
          steps: [
            { title: "Health", body: "'Give me the model health report and compare it with last week.'" },
            { title: "Data", body: "'List required parameters that are empty for this stage, by category.'" },
            { title: "Naming", body: "'Audit sheet numbers, view names and the file name against our rules.'" },
            { title: "Fix", body: "'Dry run the fixes for the naming failures you can correct automatically; list the rest for me.'" },
            { title: "Apply and record", body: "'Apply the dry run, then write a short QA note with the before and after numbers for the share record.'" },
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ Prompting
    {
      id: "prompting",
      label: "Writing good prompts",
      blocks: [
        {
          kind: "cards",
          title: "Prompt patterns that work",
          cards: [
            { title: "Scope it", body: "Say which elements: the active view, the current selection, one category or one level. 'All doors on Level 02' is safer than 'the doors'.", tone: "blue" },
            { title: "Name the rule", body: "Point to the rule: 'our naming rule in the skill tree' or 'this list of allowed codes'. Do not leave Claude to guess your standard.", tone: "green" },
            { title: "Ask for a dry run", body: "For any change, ask for a dry run first and the number of elements affected. Approve only when the numbers make sense.", tone: "amber" },
            { title: "Ask for evidence", body: "Ask Claude to select the failing elements or list their ids, so you can see them in the model.", tone: "purple" },
            { title: "Save what works", body: "When a command did exactly what you needed, ask for it to be saved to the library with a clear name.", tone: "teal" },
            { title: "Read before you write", body: "Start a session with read-only questions to confirm Claude is looking at the right model, phase and view.", tone: "red" },
          ],
        },
        {
          kind: "table",
          title: "Weak and strong prompts",
          columns: ["Weak", "Stronger"],
          rows: [
            ["Fix the parameters.", "For mechanical equipment on Level 03, dry run filling Manufacturer and Model from the type name pattern 'Manufacturer_Model'. Show me ten examples before applying."],
            ["Rename the sheets.", "List sheets whose number does not match the pattern in our skill tree, and propose new numbers. Do not rename anything yet."],
            ["Check the model.", "Run the stage 4 QA rule set, select the failing elements and summarise the failures by rule."],
            ["Delete unused stuff.", "List unused view templates, families and working views with the WIP_ prefix. Wait for my confirmation before purging."],
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ Governance
    {
      id: "governance",
      label: "Governance & security",
      blocks: [
        {
          kind: "checklist",
          title: "Before using MCP on a live project",
          items: [
            "The appointing party and the lead appointed party accept AI-assisted production, and it is described in the BEP",
            "Your IT policy allows the suite, Claude Code or Codex, pyRevit and the hub connection",
            "Users start on a detached copy until they trust the workflow",
            "Every change is run as a dry run first and checked before it is kept",
            "Commands that write data are saved in the reviewed library rather than retyped each time",
            "Changes are synced to the central model only after the result has been checked",
            "The audit log is exported and kept with the project QA records at key milestones",
            "Someone is named as owner of the office skill tree and library",
          ],
        },
        {
          kind: "cards",
          title: "Data and responsibility",
          cards: [
            { title: "Where the data goes", body: "According to the hub, models stay on your PCs and the hub keeps the command library, skills, usage figures and audit log without model content or prompts. What Claude reads is still sent to the AI provider to answer your request, under your Claude or OpenAI account terms.", tone: "blue" },
            { title: "Confidential projects", body: "Check the appointment for restrictions on AI services and on information security, for example under ISO 19650-5, before using AI on sensitive assets.", tone: "red" },
            { title: "You remain responsible", body: "AI-made changes are your task team's production work. They go through the same checks, review and authorisation as any other change.", tone: "amber" },
            { title: "Least privilege", body: "Give write access only to the people who need it, and keep read-only questions as the default habit.", tone: "green" },
          ],
        },
        {
          kind: "table",
          title: "Other MCP options for Autodesk products",
          columns: ["Option", "Notes"],
          rows: [
            ["FirstOption MCP Suite", "Revit, AutoCAD, Civil 3D, Plant 3D and Navisworks connectors with a shared, reviewed command library, staged releases and an audit log"],
            ["Autodesk MCP servers", "Autodesk has released its own MCP servers for Revit, AutoCAD and Civil 3D as tech previews; see the MCP hub in this portal for details"],
            ["Community servers", "Open-source projects for Revit and other tools; check maintenance, licence and what each tool can change before using them on a project"],
          ],
        },
        {
          kind: "callout",
          title: "Learn MCP in general",
          body: "For how MCP works, connecting Claude Desktop and Claude Code, other BIM servers and security in more depth, see the MCP hub in this portal under Hubs.",
          tone: "info",
        },
      ],
    },
    // ------------------------------------------------------------------ Free videos
    {
      id: "videos",
      label: "Videos & references",
      blocks: [
        {
          kind: "callout",
          title: "Free public videos, made by others",
          body: "These videos are free on YouTube and were made by independent creators, not by FirstOption or this portal. Tools change quickly: check the Revit version each video uses before you follow it, and try new set-ups on a copy of the model. Links checked in October 2026.",
          tone: "warn",
        },
        {
          kind: "links",
          title: "Autodesk's official Revit MCP server: documentation",
          links: [
            { label: "Revit Public MCP Server (Autodesk Help)", href: "https://help.autodesk.com/cloudhelp/ENU/ADSKMCP-RevitMcp/files/ADSKMCP_RevitMcp_revit_mcp_server_html.html", note: "Official set-up guide. Technical Preview for Revit 2027.2, with Read, Write and Experimental modes", tone: "blue" },
            { label: "Introducing the Revit Public MCP Server (Autodesk blog)", href: "https://www.autodesk.com/blogs/aec/2026/06/17/revit-public-mcp-server/", note: "Autodesk's announcement, 17 June 2026", tone: "blue" },
            { label: "APS sample: MCP server for Revit Automation", href: "https://github.com/autodesk-platform-services/aps-sample-mcp-server-revit-automation", note: "Autodesk Platform Services sample on GitHub; runs Revit in the cloud through the Automation API (for developers)", tone: "purple" },
          ],
        },
        {
          kind: "links",
          title: "Videos: connecting Revit 2027 with Autodesk's official MCP server",
          links: [
            { label: "New in Revit 2027 - Revit MCP Server + Claude", href: "https://www.youtube.com/watch?v=Neb7g5xPfFk", note: "BIM Pure · English", tone: "red" },
            { label: "Cómo conectar Revit 2027 a Claude con el MCP Oficial de Autodesk", href: "https://www.youtube.com/watch?v=LjDPTc1Lq1k", note: "De punto y línea · Spanish", tone: "red" },
            { label: "Claude AI + Revit 2027 vía MCP Público · Tutorial completo", href: "https://www.youtube.com/watch?v=s_9966Fvsxc", note: "StruktureLab Academy · Spanish", tone: "red" },
          ],
        },
        {
          kind: "links",
          title: "Videos: step-by-step set-up for beginners",
          links: [
            { label: "Revit + Claude MCP Set Up for Beginners – Step-by-Step Tutorial", href: "https://www.youtube.com/watch?v=Qm_vRncHHGU", note: "AYDrafting · English", tone: "green" },
            { label: "Revit + Claude MCP for Beginners | Step-by-Step", href: "https://www.youtube.com/watch?v=MAQ9hm3Crao", note: "Prof Rino and Caroline the boss · English", tone: "green" },
            { label: "How to Install Revit MCP with Claude Code (Full Setup Tutorial)", href: "https://www.youtube.com/watch?v=3fYxg7iIJZA", note: "Prof Rino and Caroline the boss · English", tone: "green" },
            { label: "Connect Claude AI to Revit — Full Setup, No Code", href: "https://www.youtube.com/watch?v=YklvqIz8PBI", note: "AI BIM Lab | iWorkstation · English", tone: "green" },
          ],
        },
        {
          kind: "links",
          title: "Videos: pyRevit, community servers and connectors",
          links: [
            { label: "Revit AI Tutorial: pyRevit MCP + Claude Code", href: "https://www.youtube.com/watch?v=STy8v26dOfw", note: "BIM Pure · pyRevit Routes, the same base the FirstOption Revit MCP uses", tone: "teal" },
            { label: "CLAUDE Controls Revit! (AI & MCP Tutorial)", href: "https://www.youtube.com/watch?v=Pj_OGbCHYys", note: "Pro BIM NK · English", tone: "teal" },
            { label: "How To Make Claude Do Anything You Want Inside Revit", href: "https://www.youtube.com/watch?v=lX2sVJeZo4g", note: "Nagash Architecture · English", tone: "teal" },
            { label: "Control Revit with Claude — Pilot Connector (MCP)", href: "https://www.youtube.com/watch?v=qszhueSWYYM", note: "AEC Pilot · a commercial connector", tone: "amber" },
          ],
        },
        {
          kind: "list",
          title: "Which video to watch first",
          items: [
            "On Revit 2027.2 or later: start with BIM Pure's \"New in Revit 2027\" video, then read Autodesk's help page.",
            "On Revit 2026 or earlier: Autodesk's server does not support these versions. Use the pyRevit video, or the FirstOption Revit MCP (Revit 2017–2027) from the Install & connect tab.",
            "New to MCP: watch one beginner video from start to finish before installing anything.",
            "Whichever video you follow, connect a Read-only set-up first and switch on changes only when you trust it.",
          ],
        },
      ],
    },
    // ------------------------------------------------------------------ FAQ and quiz
    {
      id: "faq",
      label: "FAQ & quiz",
      blocks: [
        {
          kind: "faq",
          title: "Frequently asked questions",
          items: [
            { q: "Do I need to know how to code?", a: "No. You describe the task in plain language. Knowing what a transaction, a parameter and a category are helps you review what Claude proposes." },
            { q: "Can it break my model?", a: "Changes run as one undo step, with a dry run and a verification step that rolls back on failure. Still start on a copy, check the dry run and sync only when you are happy." },
            { q: "Does it replace Dynamo or pyRevit?", a: "No. The Revit MCP runs through pyRevit, and your existing scripts stay useful. MCP adds a plain-language way to create and run tools, and a shared library for the ones that work." },
            { q: "Which AI app do I use?", a: "The FirstOption connectors work with Claude Code or Codex on the PC." },
            { q: "Can several people share the same commands?", a: "Yes. The command library and skill tree are shared across your company's PCs through the hub." },
          ],
        },
        {
          kind: "quiz",
          title: "Check your understanding",
          questions: [
            { q: "Where does the code run when you ask Claude to change a Revit model through the Revit MCP?", options: ["On the hub's servers", "Inside Revit on your PC", "In Autodesk's cloud"], answer: 1, why: "The connector runs code inside the open Revit session on the workstation; the hub only syncs the library and skills." },
            { q: "What should you ask for before any change is kept?", options: ["A dry run with the number of elements affected", "A new central model", "An IFC export"], answer: 0, why: "A dry run shows what would change and rolls back, so you can check first." },
            { q: "Which product cannot be used with these connectors?", options: ["Navisworks Manage", "AutoCAD LT", "Civil 3D"], answer: 1, why: "AutoCAD LT has no .NET API for add-ins." },
            { q: "Why save a working command to the library?", options: ["To make the model smaller", "So the office reuses tested code instead of new code each time", "To upload the model"], answer: 1, why: "Reusing reviewed commands gives consistent, checked results." },
            { q: "Which identifier should you use to match model elements to spreadsheet data across versions?", options: ["ElementId", "UniqueId or IFC GUID", "The element's mark"], answer: 1, why: "ElementId is local to the file and can change; UniqueId and the IFC GUID are stable." },
          ],
        },
      ],
    },
  ],
};
