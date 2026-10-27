import type { Hub } from "./types";

// Revit hub: practical Autodesk Revit guidance for projects following ISO 19650.
// Content is paraphrased practical guidance. Revit features, menus and defaults change between
// releases, so descriptions are kept general; always confirm against the version in use and the
// project's BIM execution plan and information standard.

export const revitHub: Hub = {
  id: "revit",
  tone: "blue",
  eyebrow: "SOFTWARE · AUTODESK REVIT",
  title: "Revit best practices for ISO 19650",
  intro:
    "Practical guidance for producing Revit models that are well organised, correctly located, sensibly named, rich in the right information and easy to exchange. Covers model setup and coordinates, modelling by discipline, naming, shared parameters, worksharing, families, IFC export, coordination, performance and QA, with tips, a quiz and AI tools to help you write your own BIM manual.",
  sections: [
    {
      id: "main",
      label: "Revit",
      tabs: [
        // ------------------------------------------------------------------ Model setup
        {
          id: "setup",
          label: "Model setup",
          blocks: [
            {
              kind: "steps",
              title: "Setting up a new project model",
              steps: [
                { title: "Start from the project template", body: "Use the organisation or project template that carries agreed view templates, line styles, title blocks, browser organisation, shared parameters and object styles. Never start from a blank or default template on a live project." },
                { title: "Set project information", body: "Fill in project name, number, client, address and the project information parameters used on sheets and in exports." },
                { title: "Establish coordinates", body: "Agree the survey point, project base point and shared coordinates with the whole team, usually from a coordination or site model, and acquire or publish them before anyone models." },
                { title: "Create levels and grids", body: "Copy or monitor levels and grids from the agreed coordination model so that every discipline uses the same datum and naming." },
                { title: "Enable worksharing", body: "Create the central or cloud model, set up the agreed worksets and save with the right file name before inviting the team." },
                { title: "Link reference models", body: "Link other disciplines' models by shared coordinates, on their own worksets, and set up the coordination views." },
                { title: "Test an export", body: "Run a trial IFC and, where required, COBie export at mobilization to prove coordinates, naming and parameters work end to end." },
              ],
            },
            {
              kind: "table",
              title: "Coordinate points explained",
              columns: ["Element", "What it represents", "Good practice"],
              rows: [
                ["Survey point", "The link between the model and a real-world coordinate system, such as a national grid", "Set from the survey or site model; keep it pinned and do not move it casually"],
                ["Project base point", "A project-specific reference point, often a grid intersection or building corner", "Place at an agreed, meaningful location; record its shared coordinates in the BEP"],
                ["Internal origin", "The fixed origin of the Revit file", "Keep geometry reasonably close to it to avoid precision problems with large coordinates"],
                ["Shared coordinates", "The coordinate system shared between linked models", "Publish from one master model; acquire rather than adjust in each discipline model"],
                ["True north and project north", "Real orientation versus the drawing orientation", "Set true north from the survey; use project north for convenient sheet layout"],
                ["Elevation datum", "The height reference, for example above ordnance datum or a project zero", "State which datum levels report and keep it consistent across disciplines"],
              ],
            },
            {
              kind: "cards",
              title: "Levels, grids, worksets and links",
              cards: [
                { title: "Levels", body: "Name levels consistently, for example with a storey code and description. Use separate non-storey levels for setting out, and exclude them from schedules and exports where needed.", tone: "blue" },
                { title: "Grids", body: "Create grids once in the agreed model and copy or monitor them into others. Pin them so they cannot be dragged by accident.", tone: "teal" },
                { title: "Worksets", body: "Set up a small, agreed list of worksets by zone, system or function, plus one per linked model. Too many worksets are as unhelpful as too few.", tone: "green" },
                { title: "Linking", body: "Link models rather than importing them, place by shared coordinates and pin the link instance once positioned.", tone: "purple" },
              ],
            },
            {
              kind: "callout",
              title: "Features vary by Revit version",
              body: "Revit menus, coordinate tools, toposolid and site tools, cloud worksharing and export options change between releases. The guidance in this hub is deliberately general; check the behaviour of the release your project has agreed in its BEP.",
              tone: "warn",
            },
            {
              kind: "callout",
              title: "Coordinates are a project decision",
              body: "Record the agreed survey point values, project base point location, true north and elevation datum in the project information standard. A wrong coordinate set-up spreads to every linked model and every export.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Modelling by discipline
        {
          id: "disciplines",
          label: "Modelling by discipline",
          blocks: [
            {
              kind: "cards",
              title: "Architecture",
              cards: [
                { title: "Do: model as built", body: "Model walls, floors and roofs storey by storey, using layered types that reflect real build-ups, and bind elements to levels.", tone: "green" },
                { title: "Do: use rooms properly", body: "Place rooms in every space, with agreed numbering and names, and check room bounding so areas and COBie spaces are correct.", tone: "blue" },
                { title: "Don't: fake it in views", body: "Avoid in-view detail lines or masking regions to show what should be modelled. They do not appear in schedules, IFC or other views.", tone: "red" },
                { title: "Don't: overuse in-place families", body: "In-place families are hard to schedule, classify and reuse. Keep them for genuinely unique elements.", tone: "amber" },
              ],
            },
            {
              kind: "cards",
              title: "Structure",
              cards: [
                { title: "Do: separate physical and analytical intent", body: "Model physical elements with correct materials and use the analytical model features as required by the structural engineer's workflow.", tone: "green" },
                { title: "Do: use structural categories", body: "Use structural framing, columns, foundations and floors so elements export to the correct IFC classes and schedules.", tone: "blue" },
                { title: "Don't: duplicate architecture", body: "Agree who models which elements, such as structural slabs and cores, so they are not modelled twice.", tone: "red" },
                { title: "Don't: ignore openings", body: "Coordinate builder's work openings and penetrations through an agreed process rather than unmanaged voids.", tone: "amber" },
              ],
            },
            {
              kind: "cards",
              title: "MEP (building services)",
              cards: [
                { title: "Do: build real systems", body: "Connect equipment, ducts, pipes and fittings into systems with system classifications so flow, sizing and system schedules work.", tone: "green" },
                { title: "Do: use MEP spaces", body: "Place spaces for calculations and to give each component a valid location for COBie and asset data.", tone: "blue" },
                { title: "Don't: leave open ends", body: "Disconnected elements and open connectors break system logic. Review and resolve them before each issue.", tone: "red" },
                { title: "Don't: skip clearance zones", body: "Model maintenance and access zones for plant so clashes with access space are found in coordination.", tone: "amber" },
              ],
            },
            {
              kind: "cards",
              title: "Site and toposolid",
              cards: [
                { title: "Do: model terrain from survey", body: "Create site terrain from the survey data, using toposolid in recent releases or topography surfaces in older ones, in shared coordinates.", tone: "green" },
                { title: "Do: separate existing and proposed", body: "Use phases or separate elements so existing and proposed ground can be compared for earthworks.", tone: "blue" },
                { title: "Don't: model the whole region", body: "Large, dense terrain slows every view. Limit extent and simplify where the purpose allows.", tone: "red" },
                { title: "Don't: mix datums", body: "Check that survey heights and level elevations use the same datum before modelling.", tone: "amber" },
              ],
            },
            {
              kind: "callout",
              title: "Agree the modelling responsibility matrix",
              body: "The clearest way to avoid double modelling or gaps is a matrix in the BEP that lists element types by discipline and stage, together with the required level of information need.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ Naming
        {
          id: "naming",
          label: "Naming",
          blocks: [
            {
              kind: "text",
              title: "Applying ISO 19650 naming in Revit",
              body: [
                "ISO 19650-2 and its national annexes describe a field-based naming convention for information containers, typically project, originator, volume or system, level or location, type, role and number, separated by hyphens. Revit files, exported files and sheets that become containers should follow it exactly.",
                "Inside the model, views, families and types are not containers but they still benefit from consistent naming. Agree the rules in the project information standard so that anyone opening the model can find what they need.",
              ],
            },
            {
              kind: "table",
              title: "Naming examples",
              columns: ["Item", "Example", "Notes"],
              rows: [
                ["Revit model file", "PRJ01-ABC-ZZ-XX-M3-A-0001.rvt", "Project, originator, volume, level, type (M3 for a 3D model), role, number"],
                ["Structural model file", "PRJ01-DEF-ZZ-XX-M3-S-0001.rvt", "Same fields, different originator and role"],
                ["IFC export", "PRJ01-ABC-ZZ-XX-M3-A-0001.ifc", "Matches the native model name so containers are easy to relate"],
                ["Sheet number", "PRJ01-ABC-ZZ-01-DR-A-1001", "Drawing type DR with level code; the number field follows the project numbering plan"],
                ["Floor plan view", "01 - General Arrangement - Level 01", "Purpose prefix, content, level; keep working views clearly separate"],
                ["Working view", "WIP - J.Smith - Level 01 clash check", "Prefix so it can be filtered out and purged before issue"],
                ["Family name", "ABC_Door_Single_Timber", "Originator or library prefix, category, description; no spaces if the standard asks"],
                ["Type name", "900x2100 FD30", "Describe key dimensions or performance, not Type 1"],
                ["Wall type", "EXT_Brick-Cavity-Block_350", "Function, build-up summary and overall thickness"],
                ["Shared parameter", "ABC_FireRating", "Prefix shows ownership and avoids clashes with built-in parameters"],
              ],
            },
            {
              kind: "checklist",
              title: "Naming rules to put in the BIM manual",
              items: [
                "Field codes and allowed values for every container name field",
                "Rules for when level is XX (no level) or ZZ (multiple levels)",
                "View naming and browser organisation by purpose",
                "Sheet numbering ranges per discipline and drawing type",
                "Family and type naming pattern and allowed abbreviations",
                "Material naming pattern",
                "Workset naming list",
                "Prefix for project shared parameters",
              ],
            },
            {
              kind: "callout",
              title: "Use the project's codes, not these",
              body: "The example codes above are illustrative. Field lengths, allowed codes and separators come from the project information standard and any national annex your project uses.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Shared parameters
        {
          id: "parameters",
          label: "Shared parameters",
          blocks: [
            {
              kind: "text",
              title: "A shared parameter strategy",
              body: [
                "Shared parameters are defined in an external file with fixed identifiers, so the same parameter can be used in families, projects, schedules, tags and exports. Project parameters that are not shared cannot be tagged and are harder to map consistently.",
                "Keep one controlled shared parameter file for the organisation or project, grouped logically, with clear names and descriptions. Never create a new parameter with the same name as an existing one: Revit treats them as different parameters and schedules and exports will split.",
              ],
            },
            {
              kind: "table",
              title: "Recommended parameters",
              columns: ["Parameter", "Applies to", "Instance or type", "Purpose"],
              rows: [
                ["Classification code and title", "Types and rooms", "Type for products, instance for rooms", "Uniclass or agreed classification for schedules, IFC and COBie"],
                ["COBie Type description", "In-scope types", "Type", "Readable description for asset registers"],
                ["Manufacturer", "In-scope types", "Type", "Product manufacturer, mapped to COBie and IFC"],
                ["Model number", "In-scope types", "Type", "Product reference from approved submittals"],
                ["Asset type", "In-scope types", "Type", "Fixed or movable, as COBie expects"],
                ["Expected life", "In-scope types", "Type", "Life expectancy for maintenance planning"],
                ["Warranty duration and guarantor", "In-scope types", "Type", "Warranty information for handover"],
                ["Serial number", "In-scope components", "Instance", "Added during construction"],
                ["Tag or asset identifier", "In-scope components", "Instance", "Unique asset reference for labels and CAFM"],
                ["Fire rating", "Walls, doors, floors, penetration seals", "Type or instance", "Fire strategy compliance and IFC property sets"],
                ["Acoustic rating", "Walls, doors, floors", "Type", "Performance requirement tracking"],
                ["Status or suitability", "Elements in design", "Instance", "Design status or responsibility, where the BEP asks for it"],
                ["IFC export as and predefined type", "Families and types", "Type", "Override IFC class and predefined type where the category mapping is not enough"],
              ],
            },
            {
              kind: "cards",
              title: "Rules that keep parameters clean",
              cards: [
                { title: "One source of truth", body: "Keep the shared parameter file under version control and issue it with the project template.", tone: "blue" },
                { title: "Type versus instance", body: "Put product data that is the same for every instance on the type; put location, serial and tag data on the instance.", tone: "green" },
                { title: "Units and data types", body: "Choose the right data type, such as length, area, text or yes/no, at creation. It cannot be changed later.", tone: "amber" },
                { title: "Map once", body: "Map parameters to IFC property sets and COBie fields in shared mapping files rather than editing each export.", tone: "purple" },
              ],
            },
            {
              kind: "callout",
              title: "Start from the level of information need",
              body: "Only add parameters the requirements actually ask for. Every extra parameter has to be filled, checked and maintained. Derive the list from the LOIN and the EIR, not from a generic list of everything possible.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ Worksets & collaboration
        {
          id: "worksets",
          label: "Worksets & collaboration",
          blocks: [
            {
              kind: "cards",
              title: "Worksharing options",
              cards: [
                { title: "File-based central model", body: "A central model on a network share with local copies for each user. Works well on a fast local network within one office.", tone: "blue" },
                { title: "Cloud worksharing", body: "The central model is hosted in Autodesk's cloud through Autodesk Docs or BIM Collaborate Pro, allowing teams in different offices and organisations to work in the same model.", tone: "teal" },
                { title: "Linked models", body: "Each discipline or organisation keeps its own model and links others. This is the normal way to separate responsibility under ISO 19650.", tone: "green" },
              ],
            },
            {
              kind: "table",
              title: "Workset and collaboration good practice",
              columns: ["Topic", "Good practice", "Avoid"],
              rows: [
                ["Workset list", "A short list agreed in the BEP, for example shell, core, interiors, site and one per link", "Workset per person or one workset for everything"],
                ["Element ownership", "Borrow elements as needed and relinquish on every sync", "Taking ownership of whole worksets for long periods"],
                ["Synchronising", "Sync regularly with clear comments and relinquish all", "Working for hours without syncing"],
                ["Opening models", "Open only the worksets you need for the task", "Opening every workset and link on a large model"],
                ["Local copies", "Create a new local copy regularly as the project requires", "Reusing old local files across weeks"],
                ["Links", "Link by shared coordinates, place on a dedicated workset and pin", "Importing CAD or models into the project"],
                ["CAD files", "Link DWG files to a view only where needed, on a separate workset", "Importing and exploding DWG files"],
                ["Model ownership", "Each organisation authors only its own model, linking others as reference", "Editing another organisation's model without agreement"],
              ],
            },
            {
              kind: "checklist",
              title: "Collaboration routine",
              items: [
                "Sync with central at regular intervals and before breaks",
                "Relinquish all elements when you finish",
                "Close the model properly at the end of the day",
                "Reload links to pick up the latest shared versions",
                "Use only shared or published containers from the CDE as reference",
                "Record significant changes in sync comments",
              ],
            },
            {
              kind: "callout",
              title: "Links and the CDE",
              body: "Under ISO 19650 you should reference other teams' information only once it is in the shared state. Link the shared version from the CDE, not a colleague's work in progress copy.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Families
        {
          id: "families",
          label: "Families",
          blocks: [
            {
              kind: "steps",
              title: "Family creation rules",
              steps: [
                { title: "Choose the right template and category", body: "The category decides schedules, visibility, IFC mapping and behaviour. Changing it later can break hosted relationships." },
                { title: "Build a reference framework", body: "Set reference planes and dimensions first, then lock geometry to them so parameters flex predictably." },
                { title: "Flex as you go", body: "Test every parameter with extreme values before adding the next. A family that breaks when flexed causes errors in the project." },
                { title: "Control visibility", body: "Use subcategories and detail level settings so plans show simple symbols and 3D views show appropriate geometry." },
                { title: "Add information", body: "Add shared parameters for classification, product data and IFC mapping as required by the LOIN." },
                { title: "Test in a project", body: "Load into a test project, check tags, schedules, IFC export and performance before adding to the library." },
              ],
            },
            {
              kind: "table",
              title: "Level of detail in families",
              columns: ["Detail level", "Typical geometry", "Used for"],
              rows: [
                ["Coarse", "Simple box or symbolic lines", "Small-scale plans and early stages"],
                ["Medium", "Main shapes and frames", "General arrangement drawings and coordination"],
                ["Fine", "Detailed profiles, handles, connections", "Large-scale details and visualisation"],
                ["Clearance geometry", "Invisible or subcategory solids for access zones", "Clash detection for maintenance and operation space"],
                ["Symbolic lines", "2D representation in plan or elevation", "Clear drawings without heavy 3D geometry"],
                ["Information only", "No extra geometry; parameters carry the detail", "Products where geometry does not need to be detailed"],
              ],
            },
            {
              kind: "cards",
              title: "Nesting and performance",
              cards: [
                { title: "Nest with purpose", body: "Nest families to reuse components or to schedule parts separately with shared nested families. Avoid deep nesting chains.", tone: "blue" },
                { title: "Keep geometry light", body: "Use extrusions and simple sweeps; avoid imported CAD geometry, detailed curves and arrays of tiny elements.", tone: "green" },
                { title: "Limit type catalogues", body: "Do not load hundreds of types into the project. Use type catalogues to pick only what is needed.", tone: "amber" },
                { title: "Purge before publishing", body: "Remove unused materials, line patterns and nested families from library families.", tone: "purple" },
                { title: "Manufacturer content", body: "Check downloaded manufacturer families carefully; many are heavy, mis-categorised or carry unwanted parameters.", tone: "red" },
              ],
            },
            {
              kind: "callout",
              title: "Geometry is not the same as information",
              body: "Many elements need rich information but simple geometry. Match family detail to the level of information need for the stage rather than to how good it looks.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ IFC export
        {
          id: "ifc",
          label: "IFC export",
          blocks: [
            {
              kind: "steps",
              title: "Setting up IFC export",
              steps: [
                { title: "Agree the schema and view", body: "Confirm in the EIR and BEP which IFC version and model view the client expects, for example IFC 4 Reference View or IFC 2x3 Coordination View." },
                { title: "Map categories to IFC classes", body: "Review the category mapping table and override per family or type with IFC export parameters where needed." },
                { title: "Map properties", body: "Export the required property sets, including common property sets and user-defined sets mapped from shared parameters." },
                { title: "Set coordinates", body: "Choose the coordinate base that matches the agreed shared coordinates so models align in coordination tools." },
                { title: "Save the setup", body: "Save a named export configuration and share it with all task teams so every export is identical." },
                { title: "Check the result", body: "Open the IFC in an independent viewer or checker to confirm classes, properties, location and spatial structure." },
              ],
            },
            {
              kind: "table",
              title: "Category to IFC class mapping examples",
              columns: ["Revit category", "Typical IFC class", "Notes"],
              rows: [
                ["Walls", "IfcWall", "Check predefined types such as standard, partitioning or shear"],
                ["Floors", "IfcSlab", "Use predefined types for floor, roof or landing"],
                ["Roofs", "IfcRoof or IfcSlab", "Roof assemblies may export as an aggregate with slabs"],
                ["Doors and windows", "IfcDoor and IfcWindow", "Openings are created in host walls"],
                ["Structural columns and framing", "IfcColumn and IfcBeam", "Check materials and load-bearing properties"],
                ["Rooms", "IfcSpace", "Rooms must be enabled for export to create spaces"],
                ["Mechanical equipment", "Distribution element classes, depending on schema and mapping", "IFC 4 offers more specific classes; set predefined types"],
                ["Ducts and pipes", "IfcDuctSegment and IfcPipeSegment", "Fittings map to corresponding fitting classes"],
                ["Generic models", "IfcBuildingElementProxy by default", "Override with an IFC class parameter; avoid proxies where possible"],
              ],
            },
            {
              kind: "table",
              title: "IFC 4 compared with IFC 2x3",
              columns: ["Aspect", "IFC 2x3", "IFC 4"],
              rows: [
                ["Status", "Older, still widely supported", "Current, published as ISO 16739-1"],
                ["Typical views", "Coordination View 2.0", "Reference View and Design Transfer View"],
                ["Class coverage", "Fewer specific classes, more proxies", "More specific classes and predefined types, especially for services"],
                ["Geometry", "Mainly simple boundary and swept geometry", "Richer geometry options, though support varies by tool"],
                ["Properties", "Common property sets", "Expanded and revised property sets"],
                ["Use today", "Where receiving tools or clients still require it", "Preferred where the receiving tools support it"],
              ],
            },
            {
              kind: "table",
              title: "Common IFC problems and fixes",
              columns: ["Problem", "Likely cause", "Fix"],
              rows: [
                ["Model in the wrong place", "Wrong coordinate base or shared coordinates not set", "Use the agreed coordinate option and check against a reference model"],
                ["Too many proxies", "Generic or unmapped categories", "Set IFC class parameters on families or update the mapping table"],
                ["Missing properties", "Property sets not enabled or mapping file not loaded", "Enable required sets and load the shared mapping file"],
                ["No spaces in IFC", "Room export disabled or rooms not placed", "Enable room export and check rooms are placed and bounded"],
                ["Elements on wrong storey", "Elements hosted to non-storey levels", "Mark only true storeys as building storeys and rehost elements"],
                ["Huge file size", "Detailed families, links or point clouds included", "Export only required views or elements and simplify heavy families"],
                ["Wrong materials or colours", "Materials not assigned or not exported", "Assign materials in families and enable material export"],
              ],
            },
            {
              kind: "callout",
              title: "Export settings change between releases",
              body: "The IFC exporter is updated regularly and its options and defaults differ between Revit releases. Save your configuration, note the exporter version in the BEP and retest after any upgrade.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ Coordination
        {
          id: "coordination",
          label: "Coordination",
          blocks: [
            {
              kind: "steps",
              title: "Clash detection workflow",
              steps: [
                { title: "Share", body: "Each task team shares its model, usually native and IFC, in the CDE at the agreed coordination interval." },
                { title: "Federate", body: "The coordinator combines models in a coordination tool such as Navisworks or Autodesk Construction Cloud model coordination." },
                { title: "Run tests", body: "Run agreed clash tests by discipline pair, with tolerances and rules that remove known false clashes." },
                { title: "Group and prioritise", body: "Group clashes into meaningful issues by location and system, and prioritise by risk." },
                { title: "Issue as BCF", body: "Raise issues with viewpoints, assignees and due dates, often using BCF so they open directly in the authoring tool." },
                { title: "Resolve and verify", body: "Teams fix their models, re-share, and the coordinator closes issues once the next test confirms the fix." },
              ],
            },
            {
              kind: "table",
              title: "Coordination tools in general terms",
              columns: ["Tool or format", "What it does", "Tips"],
              rows: [
                ["Navisworks Manage", "Federates models, runs clash tests, reviews and simulates", "Save clash test templates and reuse them every round"],
                ["Autodesk Construction Cloud model coordination", "Cloud-based automatic clash detection and issue tracking", "Set up coordination spaces and folders that match the CDE structure"],
                ["BCF (BIM Collaboration Format)", "Open format for issues with viewpoints and comments", "Use BCF so issues move between tools without retyping"],
                ["Revit interference check", "Basic clash check within Revit between categories or links", "Useful for quick checks before sharing, not a full coordination process"],
                ["IFC viewers and checkers", "Independent review of IFC exports", "Check IFC as well as native models, because clients often receive IFC"],
                ["Coordination meetings", "Agree resolution of high-priority issues", "Review issues in the model, assign actions and record decisions"],
              ],
            },
            {
              kind: "cards",
              title: "Make clash detection meaningful",
              cards: [
                { title: "Test what matters", body: "Focus on hard clashes between primary systems and on clearance zones, rather than every touching element.", tone: "blue" },
                { title: "Agree tolerances", body: "Set tolerances for each test so insulation thickness or minor overlaps do not swamp real issues.", tone: "amber" },
                { title: "Measure trends", body: "Track open and closed issues by discipline and zone between rounds to see whether coordination is improving.", tone: "green" },
                { title: "Own the fix", body: "Each issue needs one responsible team and a due date, or it will be reported again and again.", tone: "red" },
              ],
            },
            {
              kind: "callout",
              title: "Coordinate shared information",
              body: "Run coordination on shared-state containers so every team is working from the same version. Record the container revisions used for each round.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Performance
        {
          id: "performance",
          label: "Performance",
          blocks: [
            {
              kind: "cards",
              title: "What slows Revit models down",
              cards: [
                { title: "Imported CAD", body: "Imported and exploded DWG files add many line styles and heavy geometry. Link instead and only where needed.", tone: "red" },
                { title: "Heavy families", body: "Highly detailed manufacturer families with complex geometry multiply quickly across a model.", tone: "amber" },
                { title: "Warnings", body: "A large number of unresolved warnings, especially overlapping and duplicate elements, can make the model unstable.", tone: "purple" },
                { title: "Too many views", body: "Hundreds of unused working views and legends increase file size and opening time.", tone: "blue" },
                { title: "Large groups and arrays", body: "Big model groups and arrays are expensive to regenerate when edited.", tone: "teal" },
                { title: "Unnecessary links", body: "Loading every link, including point clouds, in every session slows opening and navigation.", tone: "green" },
              ],
            },
            {
              kind: "checklist",
              title: "Regular model audit",
              items: [
                "Open with audit periodically, as the BIM manual specifies",
                "Review and resolve warnings, starting with duplicates and overlaps",
                "Purge unused families, types, materials and patterns",
                "Delete unused working views, schedules and legends",
                "Remove imported CAD and replace with links where needed",
                "Check for in-place families that should be loadable families",
                "Check model groups for size and nesting",
                "Review file size trend against previous audits",
                "Compact the central model when the BIM manual recommends it",
                "Check that links are on their own worksets and pinned",
              ],
            },
            {
              kind: "table",
              title: "Common warnings and what to do",
              columns: ["Warning", "Why it matters", "Action"],
              rows: [
                ["Identical instances in the same place", "Duplicated elements double quantities and exports", "Delete duplicates"],
                ["Elements slightly off axis", "Causes small gaps, dimension and join problems", "Correct the alignment of the original element"],
                ["Room not enclosed", "Areas and COBie spaces are wrong", "Fix boundaries or add room separation lines"],
                ["Walls overlap", "Wrong quantities and odd joins", "Trim or rebuild overlapping walls"],
                ["Highlighted lines overlap", "Messy drawings and extra geometry", "Delete or adjust overlapping lines"],
                ["Elements have duplicate mark values", "Tags and schedules become ambiguous", "Renumber marks to agreed rules"],
              ],
            },
            {
              kind: "callout",
              title: "Performance is part of quality",
              body: "A model that takes too long to open or sync discourages good habits such as frequent syncing and reviewing links. Schedule regular audits rather than waiting for problems.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ Model QA checklist
        {
          id: "qa",
          label: "Model QA checklist",
          blocks: [
            {
              kind: "checklist",
              title: "General (all disciplines)",
              items: [
                "File named to the project information standard",
                "Correct template used and project information complete",
                "Shared coordinates acquired and survey point unchanged",
                "Levels and grids match the coordination model",
                "Links placed by shared coordinates, pinned and on their own worksets",
                "No imported CAD; linked CAD only where needed",
                "Warnings reviewed and critical ones resolved",
                "Model purged and working views removed or separated",
                "Classification applied to all in-scope types and rooms",
                "Required shared parameters filled for this stage",
                "IFC export checked in an independent viewer",
                "Container status, revision and metadata correct in the CDE",
              ],
            },
            {
              kind: "checklist",
              title: "Architecture",
              items: [
                "Rooms placed, numbered, named and enclosed",
                "Wall, floor and roof types reflect agreed build-ups",
                "Doors and windows have fire, acoustic and security data where required",
                "Areas and room schedules reconcile with the brief",
                "Finishes and materials assigned to the agreed level",
              ],
            },
            {
              kind: "checklist",
              title: "Structure",
              items: [
                "Structural elements use structural categories and materials",
                "Columns and walls run between the correct levels",
                "Foundations and slabs coordinated with architecture",
                "Openings and penetrations follow the agreed process",
                "Analytical model aligned where analysis is required",
              ],
            },
            {
              kind: "checklist",
              title: "MEP",
              items: [
                "Systems connected with no open ends or disconnected elements",
                "System classifications and names follow the standard",
                "MEP spaces placed for every room served",
                "Equipment has product, asset and maintenance parameters",
                "Clearance and access zones modelled for plant",
                "Components are within spaces for location and COBie export",
              ],
            },
            {
              kind: "callout",
              title: "Record the check",
              body: "Keep a signed QA record for each model issue, listing the checks run and any accepted exceptions. ISO 19650 expects information to be checked before it is shared or submitted for authorization.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Tips & shortcuts
        {
          id: "tips",
          label: "Tips & shortcuts",
          blocks: [
            {
              kind: "cards",
              title: "Everyday productivity tips",
              cards: [
                { title: "Learn the keyboard shortcuts", body: "Two-letter shortcuts for common commands save time. Customise them in the keyboard shortcuts dialog and share the file with your team.", tone: "blue" },
                { title: "Use view templates", body: "Control graphics, visibility and detail with view templates rather than overrides on individual views.", tone: "green" },
                { title: "Filters over overrides", body: "Use parameter-based filters to colour or hide elements; they are repeatable and auditable.", tone: "teal" },
                { title: "Select similar wisely", body: "Select all instances visible in view or in the project to change many elements at once, then double-check the selection count.", tone: "amber" },
                { title: "Pin what matters", body: "Pin grids, levels, links and coordination elements so they cannot be moved by accident.", tone: "red" },
                { title: "Schedules as editors", body: "Edit parameter values in schedules to fill information quickly and spot blanks.", tone: "purple" },
                { title: "Scope boxes", body: "Use scope boxes to keep grids, levels and view crops consistent across many views.", tone: "blue" },
                { title: "Automate repetitive tasks", body: "Dynamo and add-ins can rename views, fill parameters or check models. Test scripts on a copy first.", tone: "green" },
                { title: "Worksharing display", body: "Turn on worksharing display modes to see who owns elements and which workset they are on.", tone: "teal" },
              ],
            },
            {
              kind: "table",
              title: "Commonly used default shortcuts",
              columns: ["Shortcut", "Command", "Tip"],
              rows: [
                ["WA", "Wall", "Set the type and location line before drawing"],
                ["DR", "Door", "Tag on placement to number as you go"],
                ["CM", "Place a component", "Use type catalogues to load only what you need"],
                ["AL", "Align", "Lock alignments only where you want a permanent constraint"],
                ["TR", "Trim and extend to corner", "Quick way to clean wall junctions"],
                ["VV", "Visibility and graphics", "Prefer view templates for permanent settings"],
                ["HH", "Temporarily hide element", "Reset with the temporary hide toggle before issuing"],
                ["SY", "Sync with central (if customised)", "Many teams add a custom shortcut for frequent syncing"],
              ],
            },
            {
              kind: "callout",
              title: "Shortcuts can differ",
              body: "Default shortcuts can change between Revit releases and many offices customise them. Check the keyboard shortcuts dialog in your installation.",
              tone: "warn",
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
                { q: "Should each discipline have its own Revit model?", a: "Yes, normally. ISO 19650 assigns responsibility for information to task teams, so each organisation and discipline authors its own model and links others as reference." },
                { q: "Where should the project base point go?", a: "At an agreed, meaningful location such as a main grid intersection. Record its position and shared coordinate values in the BEP or information standard." },
                { q: "Is it acceptable to move the survey point?", a: "Only as part of a deliberate, documented coordinate set-up. Moving it casually breaks alignment with other models and with site data." },
                { q: "When should we use cloud worksharing?", a: "When team members in different offices or organisations need to work in the same model. It requires the appropriate Autodesk cloud subscription and agreement on who hosts the model." },
                { q: "Can Revit export IFC 4?", a: "Yes, current releases can export IFC 4 views. Check the exporter version and test the result with the receiving tools." },
                { q: "How do we stop generic models exporting as proxies?", a: "Set the IFC export class parameter on the family or type, or update the category mapping, so elements export to the correct IFC class." },
                { q: "How many warnings are acceptable?", a: "There is no single right number. Agree in the BIM manual which warning types must be resolved before issue and track the trend over time." },
                { q: "Should we model to manufacturer families?", a: "Use generic families during design and swap for checked manufacturer content when products are selected, if the LOIN requires it." },
                { q: "How do we keep shared parameters consistent across firms?", a: "Agree a project shared parameter file and mapping files in the BEP and distribute them to every task team at mobilization." },
                { q: "What should go in a Revit BIM manual?", a: "Template and version, coordinates, naming, worksets, parameters, modelling rules by discipline, export settings, QA checks and the issue process." },
              ],
            },
            {
              kind: "callout",
              title: "Need a project-specific answer?",
              body: "Use the AI tools tab to ask about your project situation or to draft a Revit modelling standard and BIM manual.",
              tone: "info",
            },
            {
              kind: "cards",
              title: "Where to look next",
              cards: [
                { title: "Coordinates problems", body: "See the Model setup tab for survey point, project base point and shared coordinates.", tone: "blue" },
                { title: "Export problems", body: "See the IFC export tab for mapping, property sets and the common problems table.", tone: "purple" },
                { title: "Slow models", body: "See the Performance tab for the audit checklist and warnings table.", tone: "amber" },
                { title: "Before issuing", body: "See the Model QA checklist tab for general and discipline checks.", tone: "green" },
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
              title: "Test your Revit and ISO 19650 knowledge",
              questions: [
                { q: "Which point links a Revit model to a real-world coordinate system?", options: ["Internal origin", "Survey point", "Project base point", "Scope box"], answer: 1, why: "The survey point represents a known point in the real-world coordinate system." },
                { q: "What is the best way to bring another discipline's model into yours?", options: ["Import it", "Copy and paste elements", "Link it by shared coordinates", "Export it to DWG first"], answer: 2, why: "Linking by shared coordinates keeps responsibility separate and models aligned." },
                { q: "Why use shared parameters rather than non-shared project parameters?", options: ["They are faster to create", "They can be tagged, scheduled and mapped consistently across files", "They hide data from exports", "They are required for worksets"], answer: 1, why: "Shared parameters have fixed identifiers, so they work in tags, families, schedules and exports consistently." },
                { q: "Which category usually exports as IfcBuildingElementProxy unless overridden?", options: ["Walls", "Doors", "Generic models", "Rooms"], answer: 2, why: "Generic models have no specific IFC class, so override them with an IFC class parameter." },
                { q: "What should you do with elements you borrowed when you finish working?", options: ["Keep them until next week", "Relinquish them when you sync", "Delete them", "Move them to another workset"], answer: 1, why: "Relinquishing lets colleagues edit those elements." },
                { q: "Which ISO 19650 state should linked reference models come from?", options: ["Work in progress", "Shared", "Archived", "Any state"], answer: 1, why: "Teams should reference information only once it is in the shared state." },
                { q: "What is BCF used for?", options: ["Storing families", "Exchanging issues with viewpoints between tools", "Exporting COBie", "Compressing models"], answer: 1, why: "BIM Collaboration Format carries issues, comments and viewpoints between coordination and authoring tools." },
                { q: "Which of these most commonly harms model performance?", options: ["Pinned grids", "View templates", "Imported and exploded CAD files", "Shared coordinates"], answer: 2, why: "Imported CAD brings heavy geometry and many styles into the model." },
                { q: "Where should product data such as manufacturer and model number normally be stored?", options: ["Instance parameters", "Type parameters", "View parameters", "Sheet parameters"], answer: 1, why: "Product data is the same for every instance of a type, so it belongs on the type." },
                { q: "Which IFC version is published as ISO 16739-1 and offers more specific classes?", options: ["IFC 2x3", "IFC 4", "IFC 1.5", "IFC XML only"], answer: 1, why: "IFC 4 is the current schema published as ISO 16739-1, with more classes and predefined types." },
              ],
            },
            {
              kind: "checklist",
              title: "Revise these before you start",
              items: [
                "Survey point, project base point and shared coordinates",
                "Linking versus importing",
                "Shared parameters and type versus instance data",
                "Worksharing habits: borrowing, syncing and relinquishing",
                "IFC class mapping and IFC 4 versus IFC 2x3",
                "Clash workflow and BCF",
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
            { kind: "widget", widget: "ask-ai", title: "Ask AI about Revit" },
            { kind: "widget", widget: "generate", title: "Draft a Revit modelling standard", docType: "Revit modelling standards and BIM manual" },
            {
              kind: "callout",
              title: "Check AI output",
              body: "AI drafts are a starting point. Confirm coordinates, naming codes, parameters and export settings against your project information standard and the Revit release you use before issuing the manual.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "How should I set up shared coordinates for a multi-discipline Revit project?",
    "Which shared parameters do I need for COBie and IFC export from Revit?",
    "How do I stop my Revit IFC export producing so many proxies?",
    "What should a Revit model QA check include before sharing under ISO 19650?",
  ],
};
