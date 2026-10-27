import type { Hub } from "./types";

// LOIN hub: level of information need (ISO 7817-1), level of development (BIMForum LOD)
// and the UK legacy level of information (LOI), with practical specification guidance.
// Content is paraphrased. Always check the current editions of ISO 7817-1 and the
// BIMForum LOD Specification before relying on precise definitions.

export const loinHub: Hub = {
  id: "loin",
  tone: "purple",
  eyebrow: "REFERENCE · LEVEL OF INFORMATION NEED",
  title: "LOD / LOI / LOIN unified hub",
  intro:
    "LOD, LOI and LOIN are three ways of answering one question: how much information is enough? This hub explains the purpose-driven level of information need framework of ISO 7817-1, the BIMForum level of development scale, and the UK legacy level of information, then shows how to specify, transfer and check information requirements in real EIRs, BEPs and asset information models.",
  sections: [
    {
      id: "main",
      label: "Level of information need",
      tabs: [
        // ------------------------------------------------------------------ Overview
        {
          id: "overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "Three terms, one goal",
              body: [
                "Level of information need (LOIN) is the international framework for defining the extent and granularity of information required. It is set out in ISO 7817-1, which superseded the European standard EN 17412-1 that first introduced the concepts. ISO 19650 uses the term level of information need when it describes how information requirements should be specified.",
                "Level of development (LOD) is a scale published by BIMForum in its LOD Specification. It describes how far an element's geometry and attached information have been developed, and therefore how much other people can rely on it, using levels such as 100, 200, 300, 350, 400 and 500.",
                "Level of information (LOI) is a UK legacy term from the PAS 1192 era, used alongside level of model detail to describe the non-graphical content expected at each stage. It still appears in older contracts and templates.",
              ],
            },
            {
              kind: "cards",
              title: "The three approaches at a glance",
              cards: [
                { title: "LOIN (ISO 7817-1)", body: "Purpose-driven. Defines geometry, alphanumeric information and documentation separately for each object, purpose, milestone and actor. No fixed numbered levels.", tone: "purple" },
                { title: "LOD (BIMForum)", body: "Scale-driven. Numbered levels describe how developed and reliable an element is, from conceptual to fabrication and field-verified.", tone: "blue" },
                { title: "LOI (UK legacy)", body: "Stage-driven. Describes the non-graphical information expected at each stage, paired with level of model detail in PAS 1192-2.", tone: "amber" },
              ],
            },
            {
              kind: "steps",
              title: "Why LOIN is purpose-driven",
              steps: [
                { title: "Purpose", body: "Start with why the information is needed: cost estimating, coordination, energy analysis, fabrication, maintenance planning." },
                { title: "Milestone", body: "Decide when it is needed: which information delivery milestone or decision point." },
                { title: "Actor", body: "Identify who requests it and who delivers it, so responsibility is clear." },
                { title: "Object", body: "Name the object or object type the requirement applies to, using an agreed breakdown or classification." },
                { title: "Then define the information", body: "Only now specify geometry, alphanumeric information and documentation that meet that purpose, at that milestone, for that actor and object." },
              ],
            },
            {
              kind: "callout",
              title: "Less is more",
              body: "The aim of LOIN is to deliver exactly what is needed and nothing more. Over-specifying wastes effort and can create false confidence; under-specifying leaves gaps. Every requirement should trace back to a purpose.",
              tone: "info",
            },
            {
              kind: "stats",
              title: "LOIN in four words",
              stats: [
                { value: "Purpose", label: "Why the information is needed" },
                { value: "Milestone", label: "When it is needed" },
                { value: "Actor", label: "Who asks and who delivers" },
                { value: "Object", label: "What it is about" },
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ LOIN explained
        {
          id: "explained",
          label: "LOIN explained",
          blocks: [
            {
              kind: "text",
              title: "The framework in plain terms",
              body: [
                "ISO 7817-1 describes a framework with two parts. First come the prerequisites, which set the context: purpose, information delivery milestone, actors and the object breakdown. Then comes the detailed description of the information required, split into geometrical information, alphanumeric information and documentation.",
                "The standard does not prescribe numbered levels. Instead it gives a consistent structure so that requirements can be written in the same way by any appointing party and understood by any delivery team, including in machine-readable form.",
              ],
            },
            {
              kind: "cards",
              title: "Prerequisites: set the context first",
              cards: [
                { title: "Purpose", body: "Why is the information needed? Example: quantity take-off for cost planning.", tone: "purple" },
                { title: "Information delivery milestone", body: "When is it needed? Example: the end of the spatial coordination stage.", tone: "blue" },
                { title: "Actors", body: "Who requests it and who provides it? Example: requested by the cost consultant, delivered by the architect.", tone: "teal" },
                { title: "Object breakdown", body: "Which objects does it apply to? Example: internal walls identified through an agreed classification system.", tone: "amber" },
              ],
            },
            {
              kind: "table",
              title: "Information types and their aspects",
              columns: ["Information type", "Aspect", "What it describes", "Example range"],
              rows: [
                ["Geometrical", "Detail", "How simplified or detailed the shape is", "From a symbolic box to a fully detailed object with fixings"],
                ["Geometrical", "Dimensionality", "How many dimensions are represented", "0D point, 1D line, 2D surface or 3D solid"],
                ["Geometrical", "Location", "How the object is placed and positioned", "Relative to a space, or absolute in project coordinates"],
                ["Geometrical", "Appearance", "How realistic the visual representation is", "Symbolic colour, through to realistic materials and textures"],
                ["Geometrical", "Parametric behaviour", "Whether the shape can be changed by parameters", "Fixed geometry, or parametric with adjustable dimensions"],
                ["Alphanumeric", "Identification", "How the object is identified: name, identifier, type, classification code", "A type name only, through to a unique asset tag and classification"],
                ["Alphanumeric", "Information content", "The properties required, ideally referenced to a data dictionary following ISO 23386 and data templates following ISO 23387", "A few performance properties, through to full product and maintenance data"],
                ["Documentation", "Documents", "The documents that must accompany the object", "None, through to data sheets, certificates, manuals, warranties or calculations"],
              ],
            },
            {
              kind: "callout",
              title: "Geometry is not the whole story",
              body: "A fire damper may need only a simple 3D box for coordination, but a rich set of properties and test certificates for handover. LOIN lets you specify each of these independently instead of forcing them to rise together.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ LOD 100–500
        {
          id: "lod",
          label: "LOD 100–500",
          blocks: [
            {
              kind: "text",
              title: "Level of development in BIMForum terms",
              body: [
                "The BIMForum LOD Specification defines levels of development that describe how much an element has been thought through and how far other people can rely on it. The emphasis is on reliability for others, not just on how detailed the geometry looks.",
                "Levels are applied per element, not to the whole model. A model at a given stage usually contains elements at several levels.",
              ],
            },
            {
              kind: "table",
              title: "LOD levels and their meaning",
              columns: ["LOD", "Geometric meaning", "Typical use"],
              rows: [
                ["LOD 100", "Symbol or generic representation; element shown but not geometrically defined, information may be derived from other elements", "Massing, early cost per area, feasibility"],
                ["LOD 200", "Generic placeholder with approximate size, shape, location and orientation", "Concept design, early coordination, option studies"],
                ["LOD 300", "Specific element with defined size, shape, location and orientation that can be measured directly", "Developed and spatially coordinated design, quantities, drawings"],
                ["LOD 350", "As LOD 300 plus the parts needed for coordination with nearby or attached elements, such as supports and connections", "Detailed multi-discipline coordination"],
                ["LOD 400", "Element modelled with enough detail and accuracy for fabrication, including assembly and installation information", "Fabrication, prefabrication, shop drawings"],
                ["LOD 500", "Field-verified representation of size, shape, location, quantity and orientation", "As-built record and asset management"],
              ],
            },
            {
              kind: "cards",
              title: "Three levels people often misunderstand",
              cards: [
                { title: "LOD 350 is about coordination", body: "It adds interfaces and connections with other systems, such as hangers, supports and clearance zones, so that disciplines can coordinate reliably.", tone: "blue" },
                { title: "LOD 400 is about fabrication", body: "It is modelled to a level where a fabricator could make or install the element from it, often by the specialist contractor rather than the designer.", tone: "amber" },
                { title: "LOD 500 is about verification", body: "By BIMForum convention it indicates field verification of the element, not a further step of geometric detail beyond LOD 400.", tone: "green" },
              ],
            },
            {
              kind: "callout",
              title: "Development, detail and accuracy are different",
              body: "Level of development is about reliability. Level of detail describes how much geometry is shown. Level of accuracy, as used in measured survey, describes positional tolerance. Make sure everyone knows which one a contract means.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ LOD 400 in Revit
        {
          id: "lod400-revit",
          label: "LOD 400 in Revit",
          blocks: [
            {
              kind: "text",
              title: "What LOD 400 means in an authoring tool",
              body: [
                "Modelling to LOD 400 in Revit means elements are detailed and accurate enough for fabrication and installation. That usually involves manufacturer-specific families, real connection details, fabrication parts for MEP and structural connections for steel, and properties needed for ordering and assembly.",
                "It is rarely sensible to model everything to LOD 400. Agree which systems and zones need it, typically prefabricated risers, plant rooms, steel connections, facade units and modular components.",
              ],
            },
            {
              kind: "steps",
              title: "Practical modelling notes",
              steps: [
                { title: "Use fabrication-ready content", body: "Use manufacturer families or fabrication parts with real dimensions, connectors and service clearances rather than generic placeholders." },
                { title: "Model connections and supports", body: "Include hangers, brackets, unistrut, fixings and steel connections where they affect fabrication or installation." },
                { title: "Set tolerances and offsets", body: "Model insulation, clearances for access and maintenance, and installation tolerances explicitly." },
                { title: "Add fabrication properties", body: "Add spool or assembly numbers, product codes, material grades, weights and installation sequence where the fabricator needs them." },
                { title: "Split by assembly", body: "Use assemblies, worksets or separate models for prefabricated modules so they can be issued and tracked individually." },
                { title: "Check and export", body: "Run clash and clearance checks, generate shop drawings and schedules, and export to the fabricator's format and to IFC as agreed." },
              ],
            },
            {
              kind: "table",
              title: "LOD 300 versus LOD 400 in Revit",
              columns: ["Element", "Typical LOD 300 content", "Typical LOD 400 content"],
              rows: [
                ["Ductwork", "Ducts and main fittings at correct size and route", "Fabrication parts, joints, stiffeners, hangers, insulation and spool numbers"],
                ["Pipework", "Pipes at size and route with main valves", "Fabrication parts, couplings, supports, welds or joints, spool sheets"],
                ["Structural steel", "Members at correct section and position", "Connections, plates, bolts, cleats, cambers and erection marks"],
                ["Precast concrete", "Element outline and size", "Reinforcement, lifting inserts, connection details, embeds"],
                ["Curtain wall", "Panels and mullions at correct layout", "Unit system with brackets, fixings and manufacturer details"],
                ["Plant", "Generic object at correct size", "Manufacturer object with connections, access zones and weights"],
              ],
            },
            {
              kind: "checklist",
              title: "LOD 400 readiness checks",
              items: [
                "Scope of LOD 400 agreed by system and zone in the BEP",
                "Manufacturer or fabricator content approved",
                "Connections, supports and fixings modelled",
                "Clearances and maintenance access zones modelled",
                "Fabrication properties populated and checked",
                "Clash and clearance checks completed against the federated model",
                "Shop drawing and export outputs tested with the fabricator",
              ],
            },
            {
              kind: "callout",
              title: "Who models LOD 400?",
              body: "LOD 400 is usually produced by the specialist contractor or fabricator, not the design consultant. Make the responsibility explicit in the responsibility matrix so design teams are not asked to model fabrication detail they cannot warrant.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ LOI
        {
          id: "loi",
          label: "LOI levels",
          blocks: [
            {
              kind: "text",
              title: "Level of information in UK legacy practice",
              body: [
                "Under PAS 1192-2, levels of definition were tied to project stages. Each level combined a level of model detail for graphical content with a level of information for non-graphical content. Later UK tools and templates also used numbered LOD and LOI levels per element.",
                "PAS 1192-2 has been withdrawn and replaced by the ISO 19650 series, which uses level of information need. LOI still appears in older appointments and templates, so it is useful to understand and translate it.",
              ],
            },
            {
              kind: "table",
              title: "UK legacy levels of definition (indicative)",
              columns: ["Level", "Stage meaning", "Typical non-graphical information (LOI)"],
              rows: [
                ["1", "Brief", "Project requirements, performance targets, constraints and benchmarks"],
                ["2", "Concept", "Outline performance, areas, volumes and key system choices"],
                ["3", "Developed design", "Specified performance, generic materials and system types, cost data"],
                ["4", "Technical design", "Specific performance values, specification references, regulatory data"],
                ["5", "Construction and commissioning", "Manufacturer and product data, installation and commissioning records"],
                ["6", "Handover and close-out", "Verified asset data, O&M information, warranties and spares"],
                ["7", "Operation and in use", "Maintenance history, performance in use and condition data"],
              ],
            },
            {
              kind: "callout",
              title: "Translating LOI into LOIN",
              body: "When inheriting a legacy LOI requirement, ask what purpose and milestone it was meant to serve. Then restate it as LOIN: the specific properties and documents needed for that purpose, for each object type, at that milestone.",
              tone: "ok",
            },
            {
              kind: "faq",
              title: "LOI questions",
              items: [
                { q: "Is LOI still valid in contracts?", a: "If a contract references it, it still applies to that contract. For new appointments, ISO 19650 and ISO 7817-1 terminology is the better choice." },
                { q: "Can LOI numbers map directly to LOD numbers?", a: "Not reliably. They come from different frameworks and were defined with different intentions, so map them by purpose rather than by number." },
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ Compare
        {
          id: "compare",
          label: "Compare",
          blocks: [
            {
              kind: "table",
              title: "LOIN compared with LOD and LOI",
              columns: ["Criterion", "LOIN (ISO 7817-1)", "LOD (BIMForum)", "LOI (UK legacy)"],
              rows: [
                ["Origin", "International standard, developed from EN 17412-1", "US industry specification published by BIMForum", "UK PAS 1192 era practice and tools"],
                ["Basis", "Purpose, milestone, actor and object", "Numbered levels of element development", "Numbered levels tied to project stages"],
                ["Fixed levels", "No; requirements are described per need", "Yes: 100, 200, 300, 350, 400, 500", "Yes, stage-based numbers"],
                ["Geometry", "Described by detail, dimensionality, location, appearance, parametric behaviour", "Implied by each level", "Covered separately by level of model detail"],
                ["Alphanumeric data", "Identification and information content specified explicitly", "Attached information described per level", "Main focus of LOI"],
                ["Documentation", "An explicit, separate information type", "Not a primary focus", "Partly covered"],
                ["Granularity", "Per object type, purpose and milestone", "Per element", "Per stage, sometimes per element"],
                ["Machine readability", "Designed to be expressed in structured, machine-readable form", "Usually tables in specifications", "Usually tables in templates"],
                ["Relation to ISO 19650", "The term used by ISO 19650", "Commonly referenced alongside it", "Superseded with PAS 1192"],
                ["Main risk", "Needs effort to write well", "Levels applied to whole models or misread as detail only", "Outdated terminology and ambiguous meaning"],
                ["Best used for", "Information requirements in EIRs and BEPs", "Communicating element reliability and model progression", "Understanding legacy contracts"],
              ],
            },
            {
              kind: "cards",
              title: "Can they work together?",
              cards: [
                { title: "LOIN as the frame", body: "Use LOIN to structure requirements by purpose, milestone, actor and object.", tone: "purple" },
                { title: "LOD as shorthand for geometry", body: "Inside a LOIN requirement, referencing an LOD level can be a convenient shorthand for the geometric aspect, if its meaning is agreed.", tone: "blue" },
                { title: "LOI as a legacy bridge", body: "Translate legacy LOI requirements into explicit properties and documents within the LOIN.", tone: "amber" },
              ],
            },
            {
              kind: "callout",
              title: "Pick one language per contract",
              body: "Mixing terms without definitions creates disputes. State in the information standard which framework is used, and define any LOD shorthand in terms of LOIN aspects.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ By stage
        {
          id: "by-stage",
          label: "By stage",
          blocks: [
            {
              kind: "text",
              title: "How information grows through the stages",
              body: [
                "The table uses RIBA Plan of Work style stages 0 to 7 as a familiar reference. Other frameworks use different names, but the principle is the same: information grows as decisions are made, and the focus shifts from design intent to construction and then to operation.",
              ],
            },
            {
              kind: "table",
              title: "Typical geometry and information by stage and discipline",
              columns: ["Stage", "Architecture", "Structure", "MEP", "Information focus"],
              rows: [
                ["0 Strategic definition", "Site context, existing information", "Existing structure records", "Existing utilities and capacity", "Business case, outcomes, OIR"],
                ["1 Preparation and briefing", "Area schedules, massing studies", "Structural strategy assumptions", "Services strategy and loads", "Brief, PIR, EIR for design team"],
                ["2 Concept design", "Massing and generic elements", "Grid, outline frame and transfer zones", "Plant space allowances, main routes", "Option decisions, cost plan, sustainability targets"],
                ["3 Spatial coordination", "Specific walls, floors, openings, coordinated", "Sized members and slabs, coordinated", "Main distribution coordinated with support zones", "Coordinated design, planning information, cost check"],
                ["4 Technical design", "Specified elements with performance data", "Detailed members, connections intent, reinforcement design", "Full systems with sizes and specified equipment", "Specifications, regulatory approval, tender information"],
                ["5 Manufacturing and construction", "Fabrication and installation detail where needed", "Fabrication models for steel and precast", "Fabrication parts and installed product data", "Construction records, product data, commissioning"],
                ["6 Handover", "As-built record, verified spaces", "As-built record", "As-built systems, asset data, test results", "AIM data, O&M, health and safety file"],
                ["7 Use", "Updated as changes occur", "Updated as changes occur", "Updated with maintenance and replacement", "Maintenance history, performance in use"],
              ],
            },
            {
              kind: "callout",
              title: "Stages are milestones, not deliverables",
              body: "In ISO 19650 terms, each stage end is an information delivery milestone. LOIN should be written against those milestones, so the delivery team knows exactly what each container must contain at that point.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Element & LOIN library
        {
          id: "library",
          label: "Element & LOIN library",
          blocks: [
            {
              kind: "text",
              title: "A starter library",
              body: [
                "The library below shows typical geometric levels and key properties for common elements. Geometric levels use LOD numbers as shorthand. Treat it as a starting point and adjust to the purposes on your project.",
              ],
            },
            {
              kind: "table",
              title: "Common elements: geometry by stage and key properties",
              columns: ["Element", "Concept", "Coordinated design", "Technical design", "Handover", "Key properties"],
              rows: [
                ["Wall", "LOD 100 to 200", "LOD 300", "LOD 300 to 350", "LOD 500 where verified", "Type, fire rating, acoustic rating, thermal performance, finish"],
                ["Slab", "LOD 200", "LOD 300", "LOD 350", "LOD 500 where verified", "Thickness, concrete grade, fire rating, loading"],
                ["Column", "LOD 200", "LOD 300", "LOD 350 to 400", "LOD 500 where verified", "Section, material grade, fire protection, load"],
                ["Beam", "LOD 200", "LOD 300", "LOD 350 to 400", "LOD 500 where verified", "Section, material grade, connection type, camber"],
                ["Door", "LOD 100", "LOD 300", "LOD 350", "LOD 500 where verified", "Fire rating, hardware set, access control, manufacturer, warranty"],
                ["Window", "LOD 100", "LOD 300", "LOD 350", "LOD 500 where verified", "U-value, glazing type, opening type, manufacturer"],
                ["Duct", "LOD 100", "LOD 300", "LOD 350 to 400", "LOD 500 where verified", "System, size, material, insulation, pressure class"],
                ["Pipe", "LOD 100", "LOD 300", "LOD 350 to 400", "LOD 500 where verified", "System, size, material, insulation, pressure rating"],
                ["Air handling unit", "LOD 100 space allowance", "LOD 200 to 300", "LOD 350", "LOD 500 with product data", "Airflow, duty, manufacturer, model, serial number, maintenance regime"],
                ["Pump", "LOD 100", "LOD 200 to 300", "LOD 350", "LOD 500 with product data", "Flow, head, power, manufacturer, model, serial number"],
                ["Light fitting", "Not modelled", "LOD 200", "LOD 300", "LOD 500 with product data", "Type, lumen output, power, emergency function, manufacturer"],
                ["Fire damper", "Not modelled", "LOD 200", "LOD 350", "LOD 500 with product data", "Fire rating, actuator type, access, test certificate, manufacturer"],
                ["Lift", "LOD 100 shaft allowance", "LOD 200", "LOD 350", "LOD 500 with product data", "Capacity, speed, stops, manufacturer, maintenance contract"],
                ["Road pavement", "Corridor surface", "Typical cross-section layers", "Layered model by section", "As-built layers", "Layer materials, thicknesses, surface course, construction date"],
                ["Bridge bearing", "Not modelled", "Type and position", "LOD 350 with set-out", "Installed product data", "Type, capacities, movement range, manufacturer, installation date"],
              ],
            },
            {
              kind: "callout",
              title: "Properties should come from a dictionary",
              body: "Key property names, definitions and units are best taken from a data dictionary that follows ISO 23386, so that the same property means the same thing across tools and projects.",
              tone: "ok",
            },
            {
              kind: "checklist",
              title: "Adapting the library to your project",
              items: [
                "Remove elements that do not appear on the project",
                "Add elements specific to the asset type, such as process plant or rail systems",
                "Confirm purposes for each property and delete any without a purpose",
                "Align stage names with the project's milestones",
                "Map properties to the owner's asset data requirements",
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ Practical specification
        {
          id: "specification",
          label: "Practical specification",
          blocks: [
            {
              kind: "steps",
              title: "How to write LOIN into an EIR, BEP and MIDP",
              steps: [
                { title: "1. List the purposes", body: "Work with the client and future operator to list the uses of information at each milestone: cost, coordination, approvals, procurement, handover, maintenance." },
                { title: "2. Define milestones and actors", body: "Name each information delivery milestone and who requests and who delivers the information." },
                { title: "3. Choose the object breakdown", body: "Use an agreed classification system so objects are named consistently across disciplines and tools." },
                { title: "4. Specify geometry", body: "For each object and milestone, state detail, dimensionality, location, appearance and parametric behaviour, or an agreed LOD shorthand." },
                { title: "5. Specify alphanumeric information", body: "List identification requirements and properties with units, referencing a data dictionary where possible." },
                { title: "6. Specify documentation", body: "List the documents needed per object, such as data sheets, certificates, manuals and calculations." },
                { title: "7. Make it checkable", body: "Express alphanumeric requirements in a machine-readable form such as buildingSMART IDS so models can be validated automatically." },
                { title: "8. Put it in the EIR", body: "Include the LOIN matrix in the EIR, with acceptance criteria and links to the information standard." },
              ],
            },
            {
              kind: "table",
              title: "LOIN matrix template",
              columns: ["Object", "Purpose", "Milestone", "Requested by", "Delivered by", "Geometry", "Alphanumeric", "Documentation"],
              rows: [
                ["Internal wall", "Cost plan", "Concept", "Cost consultant", "Architect", "Generic 3D, approximate location", "Type, area", "None"],
                ["Internal wall", "Coordination", "Spatial coordination", "Lead designer", "Architect", "Specific 3D, accurate location", "Type, fire rating, thickness", "None"],
                ["Fire damper", "Coordination", "Technical design", "Lead designer", "MEP engineer", "Simple 3D box with access zone", "System, size, fire rating", "None"],
                ["Fire damper", "Handover", "Handover", "Facilities manager", "MEP contractor", "Simple 3D, verified location", "Manufacturer, model, serial number, test date", "Test certificate, data sheet"],
                ["Pump", "Procurement", "Technical design", "Contractor", "MEP engineer", "3D with connections", "Duty, power, performance requirements", "Specification"],
                ["Pump", "Maintenance", "Handover", "Facilities manager", "MEP contractor", "3D with access zone", "Manufacturer, model, serial number, maintenance regime", "O&M manual, warranty"],
              ],
            },
            {
              kind: "checklist",
              title: "Quality checks for a LOIN specification",
              items: [
                "Every requirement traces to a purpose",
                "Every requirement has a milestone and actors",
                "Objects use the agreed classification",
                "Geometry, data and documentation are specified separately",
                "Properties have definitions and units",
                "Requirements are checkable, ideally automatically",
                "The delivery team has confirmed it can meet the requirements",
              ],
            },
            {
              kind: "callout",
              title: "Start small",
              body: "A short LOIN matrix covering the most important objects and purposes, done well, is more useful than an enormous table nobody reads. Grow it over projects as you learn what your organisation actually uses.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ EIR/BEP transfer
        {
          id: "transfer",
          label: "EIR/BEP transfer",
          blocks: [
            {
              kind: "steps",
              title: "How LOIN flows through the appointment",
              steps: [
                { title: "EIR", body: "The appointing party states the LOIN for the appointment as part of the exchange information requirements, with acceptance criteria." },
                { title: "Pre-appointment BEP", body: "The prospective lead appointed party confirms how it will meet the LOIN, and flags any requirements it proposes to change." },
                { title: "Responsibility matrix", body: "The detailed responsibility matrix allocates each object, milestone and LOIN requirement to a task team." },
                { title: "TIDPs", body: "Each task team lists the information containers it will produce, with the LOIN each container must meet at each milestone." },
                { title: "MIDP", body: "The lead appointed party combines TIDPs into the master information delivery plan, checking coverage of every LOIN requirement." },
                { title: "Review and acceptance", body: "Delivered containers are checked against the LOIN and acceptance criteria before authorization and acceptance." },
              ],
            },
            {
              kind: "table",
              title: "Example BEP responsibility matrix extract",
              columns: ["Object or system", "Milestone", "Task team", "Geometry", "Alphanumeric", "Documentation"],
              rows: [
                ["Architectural walls and doors", "Spatial coordination", "Architect", "Specific 3D", "Type, fire rating", "None"],
                ["Structural frame", "Spatial coordination", "Structural engineer", "Specific 3D", "Section, grade", "Design basis report"],
                ["Ventilation system", "Technical design", "MEP engineer", "Full system 3D with support zones", "System, size, duty", "Specification"],
                ["Ventilation system", "Construction", "MEP contractor", "Fabrication 3D", "Spool and product data", "Shop drawings"],
                ["Ventilation system", "Handover", "MEP contractor", "Verified 3D", "Asset data", "O&M manual, test certificates"],
                ["Lifts", "Handover", "Lift contractor", "Simple 3D", "Asset data", "O&M manual, certificates"],
              ],
            },
            {
              kind: "cards",
              title: "Who owns what",
              cards: [
                { title: "Appointing party", body: "Defines the LOIN in the EIR and accepts deliverables against it.", tone: "purple" },
                { title: "Lead appointed party", body: "Confirms it can meet the LOIN, allocates it in the responsibility matrix and checks MIDP coverage.", tone: "blue" },
                { title: "Task teams", body: "Produce containers to the LOIN, check them before sharing and record compliance in TIDPs.", tone: "teal" },
              ],
            },
            {
              kind: "callout",
              title: "Gaps hide at the handovers",
              body: "The most common LOIN failures happen where responsibility passes from designer to contractor, or from contractor to operator. Make those transitions explicit in the responsibility matrix.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ AIM guide
        {
          id: "aim",
          label: "AIM guide",
          blocks: [
            {
              kind: "text",
              title: "LOIN for handover and operation",
              body: [
                "The asset information model supports the operation, maintenance and eventual disposal of the asset. Its LOIN is driven by the asset information requirements, which in turn come from the organisation's information requirements and asset management processes.",
                "For handover, geometry is often less important than data and documentation. Operators need reliable identifiers, locations, maintenance information and certificates, loaded into the systems they actually use.",
              ],
            },
            {
              kind: "table",
              title: "Typical handover LOIN by asset category",
              columns: ["Asset category", "Geometry", "Alphanumeric", "Documentation"],
              rows: [
                ["Spaces", "Verified boundaries and areas", "Name, number, use, area, finishes", "Room data sheets"],
                ["Maintainable equipment", "Simple 3D with access zone", "Identifier, manufacturer, model, serial number, install date, warranty", "O&M manual, warranty, certificates"],
                ["Life safety systems", "Verified location", "System, rating, test dates", "Test and commissioning certificates"],
                ["Building fabric", "As-built record", "Type, materials, performance", "Product data, maintenance guidance"],
                ["Distribution systems", "As-built routes", "System, size, material, connectivity", "Commissioning records"],
                ["Infrastructure assets", "Georeferenced point, line or 3D", "Identifier, network reference, type, condition", "Inspection and as-built records"],
              ],
            },
            {
              kind: "checklist",
              title: "AIM readiness checklist",
              items: [
                "AIR agreed with the operator and mapped to the LOIN",
                "Identifiers follow the owner's convention",
                "Data validated against IDS or equivalent rules",
                "Documents linked to the correct assets",
                "Data loaded successfully into the owner's systems in a trial",
                "Responsibilities for keeping the AIM updated after handover are clear",
              ],
            },
            {
              kind: "callout",
              title: "Test the load before handover day",
              body: "Ask for a sample of handover data early in construction and try loading it into the operator's systems. It is the quickest way to find naming, property and format problems while there is still time to fix them.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ Quiz
        {
          id: "quiz",
          label: "Quiz",
          blocks: [
            {
              kind: "text",
              title: "Ten questions to check your understanding",
              body: [
                "The questions cover the LOIN framework, the BIMForum LOD levels, the UK legacy LOI and how requirements move through an appointment. Each answer includes a short explanation, so the quiz doubles as a revision aid.",
              ],
            },
            {
              kind: "quiz",
              title: "Test your LOD, LOI and LOIN knowledge",
              questions: [
                { q: "Which standard sets out the level of information need concepts internationally?", options: ["ISO 16739-1", "ISO 7817-1", "ISO 12006-2", "ISO 55000"], answer: 1, why: "ISO 7817-1 sets out the LOIN concepts and principles, superseding EN 17412-1." },
                { q: "Which of these is a prerequisite in the LOIN framework?", options: ["File format", "Purpose", "Software version", "Model size"], answer: 1, why: "Purpose, milestone, actors and object breakdown are the prerequisites that frame a requirement." },
                { q: "What are the three types of information described in LOIN?", options: ["2D, 3D and 4D", "Geometrical, alphanumeric and documentation", "Cost, time and quality", "Design, construction and operation"], answer: 1, why: "LOIN specifies geometrical information, alphanumeric information and documentation." },
                { q: "Which is a geometrical aspect in LOIN?", options: ["Warranty", "Dimensionality", "Classification code", "Serial number"], answer: 1, why: "Geometrical aspects are detail, dimensionality, location, appearance and parametric behaviour." },
                { q: "In BIMForum terms, what does LOD 350 add to LOD 300?", options: ["Field verification", "Fabrication detail", "Interfaces and connections for coordination", "Cost data"], answer: 2, why: "LOD 350 adds the parts needed to coordinate with nearby or attached elements." },
                { q: "What does LOD 500 indicate by BIMForum convention?", options: ["The highest geometric detail", "Field verification", "Conceptual design", "Energy analysis"], answer: 1, why: "LOD 500 refers to field verification rather than further geometric progression." },
                { q: "Who usually produces LOD 400 fabrication models?", options: ["The appointing party", "The specialist contractor or fabricator", "The planning authority", "The cost consultant"], answer: 1, why: "Fabrication-level models are normally produced by those who will make or install the element." },
                { q: "LOI is mainly associated with which framework?", options: ["UK PAS 1192 practice", "BIMForum LOD Specification", "ISO 7817-1", "IFC 4.3"], answer: 0, why: "Level of information was used in UK PAS 1192 era practice alongside level of model detail." },
                { q: "Where should LOIN requirements first be stated for an appointment?", options: ["In the TIDP", "In the EIR", "In the O&M manual", "In the clash report"], answer: 1, why: "The appointing party states its requirements, including LOIN, in the exchange information requirements." },
                { q: "Which buildingSMART standard helps check alphanumeric LOIN requirements automatically?", options: ["BCF", "IDS", "COBie", "gbXML"], answer: 1, why: "Information delivery specifications express requirements in a machine-readable way that tools can check models against." },
              ],
            },
            {
              kind: "callout",
              title: "Revisit the weak spots",
              body: "If you missed questions on LOD 350 or LOD 500, revisit the LOD 100 to 500 tab. If the prerequisites or information types tripped you up, the LOIN explained tab walks through each one.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ AI tools
        {
          id: "ai",
          label: "AI tools",
          blocks: [
            { kind: "widget", widget: "ask-ai", title: "Ask AI about LOD, LOI and LOIN" },
            { kind: "widget", widget: "generate", title: "Draft a LOIN specification", docType: "Level of information need specification" },
            {
              kind: "callout",
              title: "Check AI output",
              body: "AI drafts are a starting point. Check that each requirement has a purpose, milestone and actors, and that properties match your data dictionary and the owner's asset information requirements.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "What is the difference between LOIN, LOD and LOI?",
    "How do I write a LOIN matrix for MEP equipment at handover?",
    "When should I ask for LOD 400 and who should produce it?",
    "How can IDS be used to check level of information need requirements?",
  ],
};
