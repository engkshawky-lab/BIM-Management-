import type { Hub } from "./types";

// Infrastructure BIM hub: linear and networked assets (roads, rail, bridges, utilities)
// framed against the ISO 19650 information management process and IFC 4.3.
// Content is paraphrased practical guidance. Client-specific standards change often;
// always confirm the current edition of any client or national requirement you reference.

export const infrastructureHub: Hub = {
  id: "infrastructure",
  tone: "teal",
  eyebrow: "REFERENCE · INFRASTRUCTURE",
  title: "Infrastructure BIM & ISO 19650",
  intro:
    "Roads, railways, bridges, tunnels and utility networks are long, linear, geographically spread and owned for decades. This hub shows how ISO 19650 information management works for infrastructure: IFC 4.3 and alignment-based modelling, chainage-driven CDE structures, asset information requirements for owners and operators, LOIN examples by element and stage, worked examples and the challenges you will meet on real schemes.",
  sections: [
    // ==================================================================== OVERVIEW
    {
      id: "overview",
      label: "Overview",
      tabs: [
        {
          id: "why-different",
          label: "Why infrastructure differs",
          blocks: [
            {
              kind: "text",
              title: "Same principles, different shape",
              body: [
                "ISO 19650 applies to any built asset, so the same concepts apply to a motorway as to an office: information requirements, appointments, a common data environment, information containers, review and acceptance. What changes is the shape of the asset and the information around it.",
                "Infrastructure assets are usually linear or networked. They are located by chainage, kilometre posts or network references rather than by floor and grid. They cross land ownership, administrative and environmental boundaries, connect to existing networks that must keep running, and are operated for a very long time by owners who already hold large asset databases and GIS.",
                "Good infrastructure information management therefore leans heavily on geospatial thinking, on the owner's existing asset data standards, and on breaking the work down into manageable sections that can be designed, built, accepted and handed over in phases.",
              ],
            },
            {
              kind: "cards",
              title: "Five things that make infrastructure special",
              cards: [
                { title: "Linear assets", body: "Roads, rail lines, pipelines and cables are defined along an alignment. Geometry is built from horizontal and vertical alignment plus cross-sections, not from levels and walls.", tone: "teal" },
                { title: "Chainage and linear referencing", body: "Locations are described as a distance along a reference line (chainage, stationing or kilometre posts) with offsets. Models, documents and asset records must all speak the same referencing language.", tone: "blue" },
                { title: "Long programmes", body: "Development consent, design, phased construction and operation can span many years. Teams, software and even standards change during the life of the scheme.", tone: "amber" },
                { title: "Multiple asset owners", body: "A single scheme can touch the highway authority, rail operator, water company, power distributor, telecoms providers and local authorities, each with their own asset data requirements.", tone: "purple" },
                { title: "GIS at the core", body: "Owners manage networks in GIS and asset management systems. BIM information must be georeferenced and able to flow into GIS without losing its meaning.", tone: "green" },
                { title: "Live networks", body: "Work is often done next to traffic, trains or live services. Possessions, closures and outage windows drive the programme and the information needed for each stage.", tone: "red" },
              ],
            },
            {
              kind: "stats",
              title: "What to expect on a typical scheme",
              stats: [
                { value: "Many owners", label: "Several asset owners and statutory undertakers usually need information from one project" },
                { value: "Decades", label: "Operational life over which asset information must stay useful" },
                { value: "Phased", label: "Handover is often section by section rather than one big completion" },
                { value: "Georeferenced", label: "Everything must sit in an agreed coordinate reference system and datum" },
              ],
            },
            {
              kind: "callout",
              title: "Start from the owner's asset data",
              body: "On infrastructure, the asset information requirements usually already exist in some form: an asset data dictionary, inventory schema or GIS data model held by the operator. Begin there, and map the project's model properties to it, rather than inventing a new property set that the operator cannot load.",
              tone: "info",
            },
          ],
        },
        {
          id: "ifc43",
          label: "IFC 4.3 & alignment",
          blocks: [
            {
              kind: "text",
              title: "IFC 4.3 is now an ISO standard",
              body: [
                "IFC 4.3 extends the Industry Foundation Classes from buildings into infrastructure. It was published by ISO as ISO 16739-1:2024, replacing the earlier ISO 16739-1 edition based on IFC 4. It adds spatial structures, elements and positioning concepts for roads, railways, bridges, ports and waterways, alongside the common concepts needed for earthworks and geotechnics.",
                "The most important addition for linear assets is a full alignment model. Alignment describes the reference line of the asset in plan and profile, with optional cant for railways, and lets other elements be positioned along it by distance and offset.",
                "Software support for IFC 4.3 has been growing since publication, but it is still uneven across tools and domains. Test export and import between the actual tools on your project during mobilization before you rely on IFC 4.3 for coordination or handover.",
              ],
            },
            {
              kind: "table",
              title: "Key IFC 4.3 concepts for infrastructure",
              columns: ["Concept", "What it represents", "Why it matters"],
              rows: [
                ["IfcAlignment", "The reference line of a linear asset, combining horizontal, vertical and (for rail) cant layouts", "The backbone for positioning and chainage on roads, rail and pipelines"],
                ["Horizontal, vertical and cant segments", "Straights, arcs, transition curves, gradients and vertical curves, and superelevation for track", "Preserves the design intent of the alignment rather than just a polyline"],
                ["IfcLinearPlacement", "Placing an object by distance along an alignment plus offsets", "Lets signs, drainage, OLE masts or valves be located by chainage"],
                ["IfcReferent", "Named points along an alignment such as kilometre posts or stationing references", "Connects the model to the owner's linear referencing system"],
                ["IfcRoad with IfcFacilityPart (road part types)", "Spatial structure for road facilities, such as carriageways, lanes, junctions and shoulders", "Organises road models in a way owners recognise"],
                ["IfcRailway with IfcFacilityPart (railway part types)", "Spatial structure for rail facilities, such as track sections and station areas", "Supports breakdown by route section and asset system"],
                ["IfcBridge with IfcFacilityPart (bridge part types)", "Spatial structure for bridges: deck, piers, abutments, foundations", "Gives structures a consistent breakdown for review and asset handover"],
                ["IfcMarineFacility", "Spatial structure for ports and waterways", "Extends coverage to quays, breakwaters and navigation assets"],
                ["IfcCourse, IfcPavement, IfcKerb", "Road and track layers, pavement build-ups and kerbs", "Supports quantities and maintenance information for layered construction"],
                ["IfcEarthworksCut and IfcEarthworksFill", "Excavation and embankment volumes", "Supports earthworks quantities and mass-haul planning"],
                ["IfcGeotechnicalElement family", "Boreholes, strata and geotechnical assemblies", "Lets ground information be shared alongside the design"],
                ["IfcMapConversion and IfcProjectedCRS", "The link from the model's local coordinates to a mapped coordinate reference system", "Essential for alignment with GIS and survey data"],
              ],
            },
            {
              kind: "cards",
              title: "Alignment-based modelling in practice",
              cards: [
                { title: "Alignment first", body: "Design and agree the alignment, then generate corridors, cross-sections and elements from it. Changing the alignment then updates the model consistently.", tone: "teal" },
                { title: "One reference, many disciplines", body: "Drainage, structures, systems and utilities all reference the same alignment and chainage, so a clash or an asset record can be located unambiguously.", tone: "blue" },
                { title: "Export the semantics", body: "Ask for alignment to be exchanged as IFC alignment entities, not just as 3D lines, so receiving tools and GIS keep the chainage and curve definitions.", tone: "purple" },
                { title: "Version the alignment", body: "Treat the alignment as a controlled information container with its own revision history. Many downstream containers depend on it.", tone: "amber" },
              ],
            },
            {
              kind: "callout",
              title: "Mind the coordinate system",
              body: "Long linear schemes can suffer from the difference between grid distances and ground distances, and from mismatched vertical datums. Agree the coordinate reference system, any scale factor approach, the vertical datum and the model origin in the project information standard, and record them in the IFC map conversion.",
              tone: "warn",
            },
          ],
        },
        {
          id: "standards",
          label: "Key standards",
          blocks: [
            {
              kind: "text",
              title: "ISO 19650 rarely works alone",
              body: [
                "Infrastructure schemes combine ISO 19650 with open data standards, national annexes, owner-specific asset data standards and sector design standards. The table below groups the main families. Names are given generally on purpose: owners revise and renumber their documents, so always confirm the current versions listed in the appointing party's information requirements.",
              ],
            },
            {
              kind: "table",
              title: "Standards and guidance used alongside ISO 19650",
              columns: ["Region or group", "Standard or source", "What it is used for"],
              rows: [
                ["International", "ISO 19650 parts 1 to 6", "Information management across the asset life cycle, including security (part 5) and health and safety information (part 6)"],
                ["International", "ISO 16739-1:2024 (IFC 4.3)", "Open data schema for exchanging building and infrastructure models"],
                ["International", "ISO 7817-1", "Level of information need concepts and principles for specifying information"],
                ["International", "ISO 23386 and ISO 23387", "Describing and maintaining properties in interconnected data dictionaries, and data templates for construction objects"],
                ["International", "ISO 12006-2 and ISO 12006-3", "Frameworks for classification and for object-oriented information"],
                ["International", "ISO 55000 series", "Asset management systems that the asset information model should serve"],
                ["International", "ISO 19100 series (geographic information)", "Geospatial data standards that matter when BIM data meets GIS"],
                ["International", "buildingSMART BCF and IDS", "Issue exchange between tools, and machine-readable information delivery specifications for checking models"],
                ["UK highways", "Design Manual for Roads and Bridges and National Highways information and asset data requirements", "Design standards for the strategic road network and the owner's requirements for asset data and information delivery"],
                ["UK rail", "Network Rail standards for information management, asset data and engineering", "Rail-specific requirements for design information, asset data and handover into the owner's asset systems"],
                ["UK general", "UK BIM Framework guidance and Uniclass classification", "National guidance on applying ISO 19650 and a classification system that covers infrastructure"],
                ["MENA / GCC", "Government and authority BIM mandates and guidelines", "Several GCC authorities and giga-project clients publish their own BIM and digital delivery requirements, often based on ISO 19650"],
                ["MENA / GCC", "Utility and transport authority asset standards", "Owner-specific asset data, GIS and as-built submission requirements for networks"],
              ],
            },
            {
              kind: "callout",
              title: "Do not guess document numbers",
              body: "Client standards are frequently superseded and renumbered. In your EIR or BEP, reference the owner's documents by the title and version supplied by the appointing party, and keep a register of standards with their status so the team always works to the current set.",
              tone: "warn",
            },
            {
              kind: "checklist",
              title: "Standards register essentials",
              items: [
                "Standard or document title as issued by the owner",
                "Version or edition and date",
                "Whether it is mandatory, recommended or for information",
                "Which parts of the scheme or disciplines it applies to",
                "Who is responsible for monitoring updates",
                "Any agreed departures or deviations and their approval reference",
              ],
            },
          ],
        },
        {
          id: "delivery-pack",
          label: "Information delivery pack",
          blocks: [
            {
              kind: "text",
              title: "Information changes as the scheme matures",
              body: [
                "Infrastructure life cycles often follow an owner's project control framework rather than building work stages. The names vary, but the pattern is similar: decide the need, choose an option, gain consent, design in detail, construct, hand over and operate. The table maps the information focus and the controlled outputs you would typically expect at each stage.",
              ],
            },
            {
              kind: "table",
              title: "Lifecycle stage information pack",
              columns: ["Stage", "Information focus", "Controlled outputs"],
              rows: [
                ["Strategy and need", "Problem definition, network performance, constraints and outcomes", "Business case inputs, OIR, high-level PIR, existing asset data review"],
                ["Option identification", "Corridor options, environmental and land constraints, outline costs", "Option models and GIS layers, option assessment reports, constraints mapping"],
                ["Option selection", "Preferred route or solution, risks, stakeholder input", "Preferred option model, alignment, outline quantities, risk register"],
                ["Preliminary design and consent", "Land take, environmental impact, consent drawings", "Federated preliminary design model, consent drawings and plans, environmental information"],
                ["Detailed design", "Construction-ready design, specifications, interfaces with networks", "Detailed design models by section, drawings, specifications, quantities, interface registers"],
                ["Construction", "Temporary works, sequencing, possessions, as-built capture", "Construction models, method statements, inspection and test records, as-built surveys"],
                ["Handover and commissioning", "Asset data, test certificates, O&M information, health and safety file", "AIM data in the owner's format, as-built models and drawings, handover documentation"],
                ["Operation and maintenance", "Condition, inspection, maintenance and performance", "Updated AIM, inspection records, maintenance histories, renewals planning data"],
              ],
            },
            {
              kind: "steps",
              title: "Building the pack for an appointment",
              steps: [
                { title: "Collect the owner's requirements", body: "Gather OIR, AIR, asset data dictionaries, GIS schemas, naming conventions and existing asset records before writing the EIR." },
                { title: "Define stages and milestones", body: "Map the owner's stage gateways to information delivery milestones so each decision point has a clear set of information." },
                { title: "Set LOIN per stage", body: "For each key object type and milestone, state the geometry, alphanumeric information and documentation needed for the purpose." },
                { title: "Write acceptance criteria", body: "Describe how each deliverable will be checked: naming, metadata, model checks, IDS validation and data loading tests into owner systems." },
                { title: "Agree the handover route", body: "Explain how and when asset data moves into the owner's systems, including phased handover by section." },
              ],
            },
            {
              kind: "callout",
              title: "Phased handover is the norm",
              body: "Sections of a road or railway often open before the whole scheme finishes. Plan information delivery and AIM updates section by section, so the operator has accepted asset data before taking each section into service.",
              tone: "ok",
            },
          ],
        },
        {
          id: "document-structures",
          label: "Sample document structures",
          blocks: [
            {
              kind: "table",
              title: "Sample EIR structure for an infrastructure appointment",
              columns: ["Section", "Typical content for infrastructure"],
              rows: [
                ["1. Introduction and purpose", "Scheme description, extent by chainage or network reference, purposes of information at each stage"],
                ["2. Information requirements", "Links to OIR, AIR and PIR; key decisions supported at each stage gateway"],
                ["3. Information standard", "Coordinate reference system, datum, alignment and chainage conventions, classification, naming and metadata"],
                ["4. Information production methods", "Model breakdown by section and discipline, alignment control, survey and ground model management"],
                ["5. Level of information need", "LOIN tables by object type and milestone, including asset data properties"],
                ["6. Reference information and shared resources", "Existing asset records, GIS layers, surveys, ground investigation data, templates"],
                ["7. CDE requirements", "Platform, states, status codes, folder and container structure by section and discipline, access rules"],
                ["8. Security requirements", "Outcome of the security triage, sensitive asset handling, controls on location and network data"],
                ["9. Asset data and handover", "Owner asset data formats, loading tests, phased handover, AIM update obligations"],
                ["10. Acceptance criteria", "Model checks, IDS rules, data validation, drawing checks and review workflows"],
                ["11. Milestones and programme", "Information delivery milestones aligned to stage gateways and construction phases"],
              ],
            },
            {
              kind: "table",
              title: "Sample BEP structure for an infrastructure delivery team",
              columns: ["Section", "Typical content for infrastructure"],
              rows: [
                ["1. Delivery team and roles", "Lead appointed party, task teams, interface owners for each network and asset owner"],
                ["2. Information delivery strategy", "How the team will meet the EIR, including sectional delivery and early works"],
                ["3. Federation strategy", "Breakdown by section, chainage range, discipline and system; federation and clash rules"],
                ["4. Alignment and coordinates", "Who owns the alignment, how changes are issued, coordinate and origin set-up"],
                ["5. Responsibility matrix", "Who produces each information container and element type by milestone"],
                ["6. Software and exchange", "Authoring tools, IFC 4.3 and other exchange formats, tested exchanges and known limits"],
                ["7. Methods and procedures", "Survey integration, ground model management, design change control, model checking"],
                ["8. Asset data delivery", "How asset properties are captured, validated and transferred into the owner's systems"],
                ["9. Risk register", "Information risks such as data loss, interface gaps, software limitations and mitigations"],
                ["10. MIDP and TIDPs", "Summary of master and task information delivery plans by section and milestone"],
              ],
            },
            {
              kind: "checklist",
              title: "Infrastructure clauses people forget",
              items: [
                "How chainage is defined and what happens if the alignment changes",
                "Which network references the owner uses and how they map to chainage",
                "How existing assets that remain in place are shown and recorded",
                "Treatment of temporary works and traffic management information",
                "Handling of statutory undertakers' records and their accuracy",
                "Security handling for location data of critical assets",
                "Sectional handover and what counts as complete for each section",
              ],
            },
          ],
        },
        {
          id: "infra-vs-buildings",
          label: "Infra vs buildings",
          blocks: [
            {
              kind: "table",
              title: "Infrastructure compared with buildings",
              columns: ["Aspect", "Buildings", "Infrastructure"],
              rows: [
                ["Spatial structure", "Site, building, storey, space", "Facility, facility part, section, chainage range"],
                ["Location reference", "Grids and levels", "Alignment, chainage, offsets and network references"],
                ["Geometry driver", "Walls, slabs and rooms", "Alignment, cross-sections, corridors and terrain"],
                ["Coordinate concerns", "Usually a local site grid tied to survey", "Mapped CRS, scale factors, datums over long distances"],
                ["Owners", "Usually one client and future occupier", "Several asset owners and statutory undertakers"],
                ["Programme", "Typically shorter, single completion", "Long, phased, with sectional completion and possessions"],
                ["Existing context", "Neighbouring buildings and services", "Live traffic, trains and networks that must keep operating"],
                ["Asset data", "Equipment and spaces for FM", "Linear assets, network topology, inspection regimes"],
                ["GIS integration", "Helpful", "Essential for operation and maintenance"],
                ["Main IFC schema", "IFC 4 and IFC 4.3 building concepts", "IFC 4.3 alignment, road, rail, bridge and earthworks concepts"],
                ["Typical model size issue", "Many detailed components", "Very long extents, terrain and point clouds"],
              ],
            },
            {
              kind: "cards",
              title: "What transfers directly from buildings",
              cards: [
                { title: "The ISO 19650 process", body: "Appointment, mobilization, collaborative production, delivery and close-out work the same way.", tone: "green" },
                { title: "CDE states and status codes", body: "Work in progress, shared, published and archived still apply, with containers broken down by section.", tone: "blue" },
                { title: "Naming and metadata", body: "The same field-based naming approach works; use the volume or zone field for sections and chainage ranges.", tone: "purple" },
                { title: "LOIN thinking", body: "Purpose, milestone, actor and object still drive the geometry, data and documentation required.", tone: "teal" },
              ],
            },
            {
              kind: "callout",
              title: "Mixed schemes need both mindsets",
              body: "A rail scheme with new stations, or a road scheme with a maintenance depot, combines linear and building-type assets. Use alignment-based structures for the route and building-type structures for the facilities, and link them through shared coordinates and references.",
              tone: "info",
            },
          ],
        },
      ],
    },
    // ==================================================================== ROADS
    {
      id: "roads",
      label: "Roads & highways",
      tabs: [
        {
          id: "roads-overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "Information management for roads",
              body: [
                "A road scheme combines earthworks, pavements, drainage, structures, technology, lighting, signs, road restraint systems, landscaping and utilities diversions, all organised along one or more alignments. Many schemes also involve junction remodelling and temporary traffic management while the network stays open.",
                "Highway authorities usually maintain asset inventories for each asset type, with inspection and maintenance regimes attached. The aim of information management is to design and build efficiently, and then to hand over asset data the authority can load and use from the first day of operation.",
              ],
            },
            {
              kind: "cards",
              title: "Main road asset groups",
              cards: [
                { title: "Pavements", body: "Layer build-ups, materials, thicknesses and construction dates support maintenance planning and renewal decisions.", tone: "teal" },
                { title: "Drainage", body: "Gullies, chambers, pipes, outfalls, ponds and filter drains form a network with connectivity, levels and inspection needs.", tone: "blue" },
                { title: "Road restraint systems", body: "Safety barriers, terminals and crash cushions with working width, containment and installation details.", tone: "red" },
                { title: "Signs, signals and technology", body: "Signs, gantries, cameras, detectors, cabinets and ducts with power and communications connections.", tone: "amber" },
                { title: "Earthworks and geotechnics", body: "Cuttings, embankments, slopes and ground models, linked to ground investigation data and monitoring.", tone: "green" },
                { title: "Structures and lighting", body: "Bridges, culverts, retaining walls, lighting columns and their foundations, each with inspection records.", tone: "purple" },
              ],
            },
            {
              kind: "list",
              title: "Typical information uses on a road scheme",
              items: [
                "Option assessment with GIS constraints and corridor models",
                "Earthworks volumes and mass-haul optimisation",
                "Visibility and sightline checks on the 3D model",
                "Drainage network design and capacity analysis",
                "Clash avoidance with existing and diverted utilities",
                "Traffic management phasing visualised in 4D",
                "Asset inventory handover for maintenance contracts",
              ],
            },
            {
              kind: "callout",
              title: "Talk to the maintainer early",
              body: "The organisation that maintains the road after opening is often different from the one delivering the scheme. Involve the maintainer in agreeing asset data requirements and handover formats during the early stages, not in the last month of construction.",
              tone: "info",
            },
          ],
        },
        {
          id: "roads-requirements",
          label: "Information requirements",
          blocks: [
            {
              kind: "cards",
              title: "From OIR to EIR for a road",
              cards: [
                { title: "OIR", body: "The authority wants to keep the network safe, available and maintained at the lowest whole-life cost, and to report on asset condition.", tone: "blue" },
                { title: "AIR", body: "Asset inventory data for each asset type: identifier, location by network reference and coordinates, type, materials, installation date and maintenance regime.", tone: "teal" },
                { title: "PIR", body: "Information to support consent, option selection, cost and programme decisions, and safety reviews at each gateway.", tone: "purple" },
                { title: "EIR", body: "The appointment-specific requirements: deliverables, LOIN, standards, CDE, acceptance criteria and milestones for this design or construction contract.", tone: "amber" },
              ],
            },
            {
              kind: "table",
              title: "Road asset data examples",
              columns: ["Asset type", "Identification", "Location", "Key properties", "Documentation"],
              rows: [
                ["Pavement section", "Section ID, carriageway, lane", "Start and end chainage, lane, network reference", "Layer materials, thicknesses, surface course type, construction date", "Construction records, test results"],
                ["Gully", "Asset ID", "Chainage, offset, coordinates", "Grating type, pot size, outlet connection, cover level", "Inspection photo, as-built survey"],
                ["Drainage pipe", "Asset ID, upstream and downstream nodes", "Node coordinates, invert levels", "Diameter, material, gradient, length", "CCTV survey report"],
                ["Safety barrier", "Asset ID, run reference", "Start and end chainage, side, offset", "System type, containment level, working width, post spacing", "Installation certificate"],
                ["Sign", "Asset ID, sign reference", "Chainage, side, coordinates", "Sign face, size, illumination, post type, foundation", "Sign schedule, photo"],
                ["Lighting column", "Asset ID", "Chainage, offset, coordinates", "Height, lantern type, power supply, mounting", "Electrical test certificate"],
                ["Earthworks slope", "Asset ID", "Chainage range, side", "Slope angle, height, material, drainage, vegetation", "Geotechnical report, monitoring records"],
                ["Technology cabinet", "Asset ID", "Chainage, coordinates", "Equipment housed, power and comms connections", "Wiring diagrams, test records"],
              ],
            },
            {
              kind: "checklist",
              title: "EIR clauses specific to roads",
              items: [
                "Network referencing method and how it relates to design chainage",
                "Asset inventory schema and property naming of the owner",
                "Pavement layer recording and construction record requirements",
                "Drainage connectivity and node-link structure",
                "Traffic management phase models and temporary asset records",
                "Utilities diversion records and statutory undertakers' handover",
                "Format for asset data loading into the owner's asset system",
              ],
            },
          ],
        },
        {
          id: "roads-cde",
          label: "CDE & federation",
          blocks: [
            {
              kind: "text",
              title: "Break the road down so people can find things",
              body: [
                "A road model covering many kilometres cannot be a single file. Split it in a way that matches how the work is designed, built and handed over: by section or chainage range, then by discipline or asset system. Keep the alignment, terrain and existing conditions as separate shared reference containers that everyone links to.",
              ],
            },
            {
              kind: "table",
              title: "Example federation structure for a road scheme",
              columns: ["Level", "Example breakdown", "Naming field"],
              rows: [
                ["Project", "Whole scheme", "Project code"],
                ["Section", "Section 1 junction, section 2 mainline, section 3 link road", "Volume or zone"],
                ["Chainage range", "Ch 0+000 to 2+000, 2+000 to 4+000", "Volume or zone (sub-code) or metadata"],
                ["Discipline", "Highways, drainage, structures, geotechnics, lighting, technology", "Role"],
                ["System or asset group", "Pavement, restraint, signs, drainage network", "Type or classification metadata"],
                ["Shared reference", "Alignment, terrain, existing utilities, survey", "Separate containers with their own status"],
              ],
            },
            {
              kind: "steps",
              title: "Federation routine",
              steps: [
                { title: "Publish the reference set", body: "Issue the alignment, terrain and existing conditions as shared reference containers with a clear status and revision." },
                { title: "Model by section and discipline", body: "Each task team models its discipline within agreed chainage ranges and links the reference set." },
                { title: "Federate regularly", body: "Combine shared containers into a federated model for each section at agreed intervals for coordination and clash review." },
                { title: "Record issues by location", body: "Log clashes and design issues with section and chainage so they can be found and resolved, ideally using BCF." },
                { title: "Control boundaries", body: "Agree who owns elements that cross section boundaries, such as junctions, drainage runs and ducts." },
              ],
            },
            {
              kind: "callout",
              title: "Overlap at section boundaries",
              body: "Allow a small overlap between adjacent sections in coordination models, so clashes and gaps at the joins are visible. Make sure each element is owned by only one container to avoid double counting quantities.",
              tone: "warn",
            },
          ],
        },
        {
          id: "roads-loin",
          label: "LOIN examples",
          blocks: [
            {
              kind: "table",
              title: "Road elements: LOIN by stage",
              columns: ["Element", "Option selection", "Preliminary design", "Detailed design", "Handover"],
              rows: [
                ["Alignment", "Indicative centreline in GIS", "Designed horizontal and vertical alignment", "Final alignment with curves, transitions and chainage", "As-built alignment and network reference link"],
                ["Pavement", "Corridor surface only", "Typical cross-sections with layer types", "Layer build-ups modelled by section", "As-built layers with materials and dates"],
                ["Drainage", "Outline strategy and outfalls", "Main runs and attenuation features", "All chambers, pipes and gullies with levels", "As-built network with asset IDs and survey levels"],
                ["Safety barrier", "Not modelled", "Indicative runs as lines", "Runs with system, terminals and working width", "Installed system, certificates and asset IDs"],
                ["Signs and gantries", "Not modelled", "Key locations", "Modelled signs with faces, posts and foundations", "Asset data with sign schedule references"],
                ["Earthworks", "Approximate volumes from corridor", "Cut and fill surfaces", "Detailed earthworks with layers and treatment", "As-built surfaces and slope records"],
                ["Lighting", "Not modelled", "Lighting strategy", "Columns, ducts and cabinets modelled", "As-built positions, test certificates, asset data"],
              ],
            },
            {
              kind: "text",
              title: "Read the table as purpose-driven",
              body: [
                "Each cell answers the question: what geometry, data and documentation does this element need, at this milestone, for the decisions being made? Early stages need enough to compare options and estimate cost; detailed design needs enough to build; handover needs enough to maintain. Do not ask for detailed design geometry at option selection just because the software can produce it.",
              ],
            },
            {
              kind: "callout",
              title: "Express it in IDS where you can",
              body: "Alphanumeric requirements per element and stage can be written as an information delivery specification, so models can be checked automatically against the agreed LOIN before they are shared or delivered.",
              tone: "ok",
            },
          ],
        },
        {
          id: "roads-example",
          label: "Worked example",
          blocks: [
            {
              kind: "steps",
              title: "Worked example: junction improvement with drainage renewal",
              steps: [
                { title: "1. Capture the need", body: "The highway authority wants to reduce congestion at a busy junction and replace failing drainage. OIR: safety, journey time reliability and lower maintenance." },
                { title: "2. Gather reference information", body: "Supply existing asset inventory, drainage records, utilities records, traffic data and a topographic and scan survey as reference information." },
                { title: "3. Write the EIR", body: "Define sections (approach roads and junction), chainage conventions, LOIN for pavement, drainage, signals and barriers, and handover in the authority's asset data format." },
                { title: "4. Mobilize", body: "Test the CDE structure, the coordinate set-up and an IFC 4.3 alignment exchange between the highway design tool and the coordination tool." },
                { title: "5. Design and coordinate", body: "Model the new alignment, pavement and drainage; federate weekly with utilities and signals; manage issues with BCF by chainage." },
                { title: "6. Plan traffic management", body: "Build a 4D sequence of phases showing temporary lanes, closures and diversions to check safety and buildability." },
                { title: "7. Construct and capture", body: "Record as-built drainage levels and pavement layers as work progresses; scan key areas before covering up." },
                { title: "8. Validate asset data", body: "Check asset data against the IDS and run a trial load into the authority's asset system before final handover." },
                { title: "9. Hand over", body: "Deliver as-built models, drawings and asset data through the CDE; the authority accepts and updates its AIM." },
              ],
            },
            {
              kind: "callout",
              title: "What made it work",
              body: "Agreeing the asset data format and testing a trial load early meant there were no surprises at handover, and the maintainer could inspect and maintain the new drainage immediately.",
              tone: "ok",
            },
            {
              kind: "checklist",
              title: "Handover pack for the junction",
              items: [
                "As-built alignment and federated as-built model by section",
                "Drainage network data with asset IDs, levels and connectivity",
                "Pavement layer records with materials and construction dates",
                "Signal, sign and barrier asset data with certificates",
                "Updated utilities records for any diversions",
                "Health and safety file information and residual risks",
              ],
            },
          ],
        },
        {
          id: "roads-challenges",
          label: "Challenges",
          blocks: [
            {
              kind: "table",
              title: "Road scheme challenges and mitigations",
              columns: ["Challenge", "Why it matters", "Mitigation"],
              rows: [
                ["Chainage changes when the alignment moves", "Asset references and issues lose their location", "Version the alignment, store coordinates as well as chainage, and re-reference systematically"],
                ["Inaccurate utilities records", "Clashes and strikes during construction", "Use surveys and trial holes, record accuracy of each source, model uncertainty zones"],
                ["Very large terrain and point cloud data", "Slow models and CDE storage problems", "Tile terrain by section, use streaming viewers, keep raw data archived"],
                ["Owner asset schema differs from model properties", "Data cannot be loaded at handover", "Map properties early and test loads during design"],
                ["Phased traffic management", "Temporary states are poorly recorded", "Model temporary phases and keep them as separate containers"],
                ["Different maintainers for different assets", "Handover packages get mixed up", "Tag assets with the receiving organisation and split handover packages accordingly"],
                ["Software exchange gaps", "Alignment or properties lost in exchange", "Test IFC 4.3 exchanges and document known limits in the BEP"],
              ],
            },
            {
              kind: "faq",
              title: "Road questions",
              items: [
                { q: "Should every gully and sign be modelled in 3D?", a: "Only if the purpose needs it. For many maintenance uses, a point object with accurate location and properties is enough. Model full geometry where it supports design coordination or construction." },
                { q: "Is chainage enough to locate assets?", a: "Chainage is convenient but depends on the alignment. Always record coordinates too, and link to the owner's network reference so the location survives future alignment changes." },
              ],
            },
            {
              kind: "callout",
              title: "The alignment is a single point of failure",
              body: "So much depends on the alignment that an uncontrolled change can quietly break chainage references, issues and quantities across every discipline. Put alignment changes under formal change control with notification to all task teams.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ==================================================================== RAIL
    {
      id: "rail",
      label: "Rail & transit",
      tabs: [
        {
          id: "rail-overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "Information management for rail and transit",
              body: [
                "Rail projects bring together track, civils, structures, stations, overhead line or third rail electrification, signalling, telecoms, power and control systems. Many of these systems are safety critical, and changes must pass through rigorous engineering acceptance and assurance processes.",
                "Work frequently takes place during short possessions of an operating railway. That makes planning information, temporary works records and the accuracy of existing asset data especially important. Asset data at handover must fit the operator's asset register and maintenance systems.",
              ],
            },
            {
              kind: "cards",
              title: "Rail asset systems",
              cards: [
                { title: "Track", body: "Rails, sleepers, ballast or slab track, switches and crossings, with geometry, cant and maintenance data.", tone: "teal" },
                { title: "Electrification", body: "Overhead line equipment, masts, portals, foundations, feeders and earthing and bonding.", tone: "amber" },
                { title: "Signalling and control", body: "Signals, train detection, interlocking, lineside equipment and cable routes, subject to strict assurance.", tone: "red" },
                { title: "Telecoms", body: "Radio, CCTV, public information systems, fibre and cable management systems.", tone: "blue" },
                { title: "Civils and structures", body: "Earthworks, drainage, bridges, tunnels, retaining walls and platforms.", tone: "green" },
                { title: "Stations", body: "Buildings with passenger flow, accessibility, fire and FM needs, closer to building BIM practice.", tone: "purple" },
              ],
            },
            {
              kind: "callout",
              title: "Assurance and information go together",
              body: "Rail engineering acceptance relies on evidence. Plan the information containers that support design assurance, safety cases and system integration, and keep their status traceable in the CDE so reviewers can see exactly which version was accepted.",
              tone: "info",
            },
          ],
        },
        {
          id: "rail-requirements",
          label: "Information requirements",
          blocks: [
            {
              kind: "cards",
              title: "From OIR to EIR for rail",
              cards: [
                { title: "OIR", body: "The rail owner wants a safe, reliable, maintainable network and evidence that changes meet engineering and safety standards.", tone: "blue" },
                { title: "AIR", body: "Asset register data per asset class: identifier, location by route and mileage or kilometre reference, type, configuration and maintenance regime.", tone: "teal" },
                { title: "PIR", body: "Information for gateway decisions, possession planning, assurance reviews and system integration.", tone: "purple" },
                { title: "EIR", body: "Deliverables, LOIN, linear referencing rules, CDE structure, assurance evidence and acceptance criteria for this appointment.", tone: "amber" },
              ],
            },
            {
              kind: "table",
              title: "Rail asset data examples",
              columns: ["Asset type", "Identification", "Location", "Key properties", "Documentation"],
              rows: [
                ["Track section", "Asset ID, line and track reference", "Start and end mileage or kilometre, track", "Rail section, sleeper type, fastening, ballast depth, design speed", "Track geometry records, installation records"],
                ["Switch and crossing", "Asset ID, points number", "Mileage or kilometre, track", "Type, hand, crossing angle, drive and detection", "Installation and test records"],
                ["OLE mast", "Asset ID, structure number", "Mileage or kilometre, offset", "Mast type, foundation type, cantilever arrangement", "Foundation records, as-built drawing"],
                ["Signal", "Asset ID, signal number", "Mileage or kilometre, side", "Signal type, aspects, mounting, associated equipment", "Signalling design records, test certificates"],
                ["Location case", "Asset ID", "Mileage or kilometre, coordinates", "Equipment housed, power and cable connections", "Wiring diagrams, test records"],
                ["Cable route", "Asset ID, route section", "Start and end mileage or kilometre, side", "Route type, capacity, cables carried", "Cable schedules, as-built survey"],
                ["Platform", "Asset ID, platform number", "Station, mileage or kilometre range", "Length, height, offset from track, surface, edge type", "Gauging records, accessibility information"],
                ["Culvert", "Asset ID, structure number", "Mileage or kilometre", "Span, shape, material, invert levels", "Inspection records, as-built drawing"],
              ],
            },
            {
              kind: "checklist",
              title: "EIR clauses specific to rail",
              items: [
                "Linear referencing method used by the owner and its relation to design chainage",
                "Asset classes and register attributes required at handover",
                "Assurance evidence and how it is linked to information containers",
                "Possession planning information and temporary works records",
                "Gauging and clearance information requirements",
                "Interfaces between systems: track, OLE, signalling, telecoms and civils",
                "Security handling for signalling and operational system information",
              ],
            },
          ],
        },
        {
          id: "rail-cde",
          label: "CDE & federation",
          blocks: [
            {
              kind: "table",
              title: "Example federation structure for a rail scheme",
              columns: ["Level", "Example breakdown", "Notes"],
              rows: [
                ["Project", "Whole route upgrade or new line", "One project code across all contracts"],
                ["Route section", "Section between two stations or junctions", "Matches construction phasing and possessions"],
                ["Mileage or chainage range", "Defined ranges within each route section", "Keeps file sizes manageable"],
                ["Asset system", "Track, OLE, signalling, telecoms, civils, stations", "Systems often have separate assurance routes"],
                ["Discipline task team", "Design organisation responsible", "Recorded in the role field of names"],
                ["Shared reference", "Alignment, track geometry, existing asset survey, gauging envelope", "Issued and versioned centrally"],
                ["Stations", "Each station as its own facility", "Often modelled to building practice"],
              ],
            },
            {
              kind: "steps",
              title: "Coordinating systems along a route",
              steps: [
                { title: "Fix the track alignment", body: "Issue the track alignment and cant as the controlling reference for all systems." },
                { title: "Define clearance envelopes", body: "Share structure gauge and kinematic envelopes so civils, OLE and signalling can check clearance." },
                { title: "Federate by route section", body: "Combine systems for each route section and review interfaces such as OLE foundations versus drainage and cable routes." },
                { title: "Check signal sighting", body: "Use the federated model to review signal sighting and visibility against structures and OLE." },
                { title: "Track issues with mileage", body: "Record issues with route section, mileage and system so owners can resolve them during the right possession." },
              ],
            },
            {
              kind: "callout",
              title: "Keep stations and route separate",
              body: "Stations behave like buildings and route sections behave like linear assets. Give them separate spatial structures and containers, linked by shared references, so each can follow the most suitable modelling approach.",
              tone: "info",
            },
          ],
        },
        {
          id: "rail-loin",
          label: "LOIN examples",
          blocks: [
            {
              kind: "table",
              title: "Rail elements: LOIN by stage",
              columns: ["Element", "Option selection", "Preliminary design", "Detailed design", "Handover"],
              rows: [
                ["Track alignment", "Indicative route", "Designed alignment and profile", "Final alignment with cant and transitions", "As-built track geometry linked to referencing"],
                ["Track form", "Type only", "Typical cross-sections", "Modelled by section with components", "As-built with component data and dates"],
                ["Switches and crossings", "Locations only", "Layout and type", "Full layout with geometry and drives", "Asset data, test and installation records"],
                ["OLE", "Strategy", "Mast positions and wiring concept", "Masts, foundations and cantilevers modelled", "As-built positions and configuration data"],
                ["Signalling", "Concept scheme", "Signal positions and principles", "Equipment positions, cable routes and location cases", "Asset data with test certificates"],
                ["Platforms", "Indicative extent", "Length and height defined", "Full geometry and edge details", "As-built gauging and asset data"],
                ["Drainage and culverts", "Outline strategy", "Main elements and outfalls", "Full network with levels", "As-built network and inspection data"],
              ],
            },
            {
              kind: "callout",
              title: "Safety-critical systems need their own sign-off",
              body: "For signalling and electrification, the LOIN may be satisfied in the model while engineering acceptance is still pending. Track the assurance status separately from the CDE status so the two are not confused.",
              tone: "warn",
            },
            {
              kind: "cards",
              title: "Geometry, data and documentation for an OLE mast",
              cards: [
                { title: "Geometry", body: "Detailed design: mast, foundation and cantilever as modelled objects positioned by kilometre reference and offset, with clearance envelopes.", tone: "teal" },
                { title: "Alphanumeric", body: "Structure number, mast and foundation type, cantilever arrangement, electrical section and installation date at handover.", tone: "blue" },
                { title: "Documentation", body: "Foundation records, as-built drawings and test results linked to the asset in the CDE.", tone: "purple" },
              ],
            },
          ],
        },
        {
          id: "rail-example",
          label: "Worked example",
          blocks: [
            {
              kind: "steps",
              title: "Worked example: platform extension at an operational station",
              steps: [
                { title: "1. Define the outcome", body: "The owner needs longer platforms to accommodate longer trains, without disrupting daily services more than necessary." },
                { title: "2. Survey the existing", body: "Commission a scan and track geometry survey during a possession; register to the owner's coordinate system and referencing." },
                { title: "3. Set requirements", body: "EIR sets LOIN for platform, track, OLE, signalling and drainage, plus gauging checks and asset register attributes at handover." },
                { title: "4. Model and coordinate", body: "Model the extension, check clearances against the structure gauge, and federate with OLE and signalling changes." },
                { title: "5. Plan possessions", body: "Use 4D to sequence work into possessions, showing temporary works and access routes." },
                { title: "6. Gather assurance evidence", body: "Link design checks, gauging results and approvals to the relevant containers in the CDE." },
                { title: "7. Build and record", body: "Capture as-built platform edge positions and heights with survey; update the model." },
                { title: "8. Hand over", body: "Deliver asset register data, as-built drawings and model; the owner accepts and updates its asset systems." },
              ],
            },
            {
              kind: "callout",
              title: "Lesson learned",
              body: "Scanning during an early possession avoided relying on old drawings, and showed existing services in the platform that were missing from records.",
              tone: "ok",
            },
            {
              kind: "checklist",
              title: "Handover pack for the platform extension",
              items: [
                "As-built platform geometry with gauging results",
                "Updated track, OLE and signalling asset register data",
                "Assurance evidence and acceptance records linked to containers",
                "As-built drawings and federated as-built model",
                "Accessibility and passenger information asset data",
                "Health and safety file information",
              ],
            },
          ],
        },
        {
          id: "rail-challenges",
          label: "Challenges",
          blocks: [
            {
              kind: "table",
              title: "Rail challenges and mitigations",
              columns: ["Challenge", "Why it matters", "Mitigation"],
              rows: [
                ["Short possessions", "Little time for survey and construction", "Plan capture and work precisely, use 4D and rehearse sequences"],
                ["Multiple referencing systems", "Design chainage and owner mileage do not match", "Agree a conversion and store coordinates for every asset"],
                ["Safety-critical assurance", "Information must be traceable to acceptance", "Link assurance evidence to containers and keep audit trails"],
                ["Legacy asset records", "Incomplete or inaccurate existing data", "Survey and verify, and record the confidence of each data source"],
                ["System integration", "Interfaces between systems are missed", "Maintain interface registers and federate systems regularly"],
                ["Security of operational systems", "Sensitive information on signalling and control", "Apply ISO 19650-5 controls and restrict access by need to know"],
                ["Tool support for rail in IFC 4.3", "Exchange of rail elements may be incomplete", "Test exchanges and document workarounds in the BEP"],
              ],
            },
            {
              kind: "faq",
              title: "Rail questions",
              items: [
                { q: "Can stations follow building BIM practice?", a: "Yes, largely. Stations often use building-style spatial structures and LOIN, linked to the route model through shared references and coordinates." },
                { q: "Where does signalling design data live?", a: "Signalling often uses specialist tools and data formats. Agree in the BEP how its outputs are stored in the CDE and linked to the federated model, even if not all of it is in IFC." },
              ],
            },
            {
              kind: "callout",
              title: "Plan information around possessions",
              body: "If a survey or as-built capture is missed during a possession, the next opportunity may be weeks away. Treat information capture as a planned activity in the possession plan, with named people and equipment.",
              tone: "info",
            },
          ],
        },
      ],
    },
    // ==================================================================== BRIDGES
    {
      id: "bridges",
      label: "Bridges & structures",
      tabs: [
        {
          id: "bridges-overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "Information management for bridges and structures",
              body: [
                "Bridges, culverts, retaining walls, tunnels and gantries are discrete structures sitting on linear networks. They are designed with detailed structural analysis, built with significant temporary works and inspected regularly for decades.",
                "The asset owner needs reliable records of the as-built structure, its components such as bearings and expansion joints, and the information that supports inspection, assessment and maintenance throughout its life.",
              ],
            },
            {
              kind: "cards",
              title: "Structure information priorities",
              cards: [
                { title: "Geometry tied to alignment", body: "Deck geometry follows the road or rail alignment above, so the structure model must reference the same alignment and coordinates.", tone: "teal" },
                { title: "Analysis and design", body: "Analysis models and design calculations are key information containers, linked to the physical model they describe.", tone: "blue" },
                { title: "Reinforcement and prestress", body: "Detailed reinforcement and tendon information supports fabrication, construction and later assessment.", tone: "purple" },
                { title: "Bearings and joints", body: "Replaceable components with manufacturers, types, movement capacity and replacement access.", tone: "amber" },
                { title: "Temporary works", body: "Falsework, cofferdams and launching systems must be coordinated with permanent works and site constraints.", tone: "red" },
                { title: "Inspection regime", body: "The structure is split into inspectable elements, each with condition records over its life.", tone: "green" },
              ],
            },
            {
              kind: "callout",
              title: "Think about the first inspection",
              body: "Ask what the inspector will need on their first visit: an element breakdown, as-built dimensions, bearing and joint details, access arrangements and the design loads. Specify those for handover from the start.",
              tone: "info",
            },
          ],
        },
        {
          id: "bridges-requirements",
          label: "Information requirements",
          blocks: [
            {
              kind: "cards",
              title: "From OIR to EIR for structures",
              cards: [
                { title: "OIR", body: "The owner wants structures to remain safe and serviceable, to be inspected on time and to have assessment data available.", tone: "blue" },
                { title: "AIR", body: "Structure records: identifier, location, type, spans, materials, components, design standards and loading, inspection element breakdown.", tone: "teal" },
                { title: "PIR", body: "Information for approval in principle or technical approval processes, cost, programme and buildability decisions.", tone: "purple" },
                { title: "EIR", body: "Deliverables, LOIN, analysis and design documentation, temporary works information and handover records for this appointment.", tone: "amber" },
              ],
            },
            {
              kind: "table",
              title: "Structure asset data examples",
              columns: ["Asset or element", "Identification", "Location", "Key properties", "Documentation"],
              rows: [
                ["Bridge (whole)", "Structure ID and name", "Chainage, coordinates, obstacle crossed", "Form, number of spans, overall length, width, design loading", "Design and check certificates, as-built drawings"],
                ["Deck", "Element ID", "Span reference", "Material, depth, construction type, waterproofing", "Construction records"],
                ["Pier", "Element ID", "Support reference", "Material, dimensions, foundation type", "Foundation records, as-built drawing"],
                ["Abutment", "Element ID", "End reference", "Type, material, wing walls, drainage", "As-built drawing"],
                ["Bearing", "Component ID", "Support and position", "Type, manufacturer, movement and load capacity, installation date", "Manufacturer data, installation records"],
                ["Expansion joint", "Component ID", "Deck end", "Type, manufacturer, movement range", "Manufacturer data, maintenance guidance"],
                ["Parapet", "Component ID", "Side and span", "Type, containment, height, fixing", "Test certificates, installation records"],
                ["Retaining wall", "Structure ID", "Chainage range and side", "Type, height, material, drainage", "Design records, inspection records"],
              ],
            },
            {
              kind: "checklist",
              title: "EIR clauses specific to structures",
              items: [
                "Element breakdown aligned with the owner's inspection system",
                "Link between analysis models, calculations and the physical model",
                "Reinforcement and prestress modelling requirements by stage",
                "Bearing and joint data, including replacement information",
                "Temporary works information and its retention after construction",
                "Records for technical approval or equivalent processes",
                "As-built survey and scanning requirements before concealment",
              ],
            },
          ],
        },
        {
          id: "bridges-cde",
          label: "CDE & federation",
          blocks: [
            {
              kind: "table",
              title: "Example federation structure for a bridge",
              columns: ["Level", "Example breakdown", "Notes"],
              rows: [
                ["Structure", "Each bridge or major structure", "Use the structure ID in the volume or zone field"],
                ["Part", "Substructure, superstructure, foundations, finishes", "Aligns with IFC 4.3 bridge parts"],
                ["Discipline", "Structural, geotechnical, highways or rail, drainage, utilities", "Role field in names"],
                ["Detail models", "Reinforcement, prestress, steel fabrication", "Often separate due to size"],
                ["Analysis", "Analysis models and calculation packages", "Linked to the physical model by revision"],
                ["Temporary works", "Falsework, cofferdams, launching, cranes", "Own containers and status"],
                ["Shared reference", "Alignment, terrain, ground model, existing structure scan", "Issued centrally"],
              ],
            },
            {
              kind: "steps",
              title: "Keeping analysis and geometry consistent",
              steps: [
                { title: "Agree the master", body: "Decide whether the physical model or the analysis model is the master for geometry at each stage." },
                { title: "Link by revision", body: "Record which revision of the physical model each analysis and calculation package used." },
                { title: "Check after changes", body: "When geometry changes, flag dependent analysis and calculations for review before they are shared again." },
                { title: "Federate with the network", body: "Combine the structure with highway or rail, drainage and utilities to check clearances and interfaces." },
              ],
            },
            {
              kind: "callout",
              title: "Detail models are big",
              body: "Reinforcement and fabrication models can be very large. Keep them as separate containers federated with the main structure model, and agree which views are used for review.",
              tone: "warn",
            },
          ],
        },
        {
          id: "bridges-loin",
          label: "LOIN examples",
          blocks: [
            {
              kind: "table",
              title: "Bridge elements: LOIN by stage",
              columns: ["Element", "Option selection", "Preliminary design", "Detailed design", "Handover"],
              rows: [
                ["Deck", "Form and span arrangement", "Outline section and depth", "Full geometry, reinforcement zones or prestress", "As-built dimensions, materials, construction records"],
                ["Piers and abutments", "Indicative positions", "Outline dimensions", "Full geometry with reinforcement", "As-built dimensions and records"],
                ["Foundations", "Type assumed", "Type and outline size", "Piles or footings with levels and capacities", "As-built pile records and test results"],
                ["Bearings", "Not modelled", "Type and position", "Specified type, capacities and set-out", "Installed product data, installation records"],
                ["Expansion joints", "Not modelled", "Type and position", "Specified type and movement range", "Installed product data and maintenance guidance"],
                ["Parapets", "Not modelled", "Containment requirement", "Modelled type and fixings", "Installed system, certificates"],
                ["Drainage", "Strategy", "Outlets and outfalls", "Full drainage with levels", "As-built and inspection access data"],
              ],
            },
            {
              kind: "callout",
              title: "Inspection elements at handover",
              body: "Make sure the handover model can be split into the element breakdown used by the owner's inspection regime. A beautiful model that cannot map to inspection elements creates rework for the maintainer.",
              tone: "ok",
            },
            {
              kind: "cards",
              title: "Geometry, data and documentation for a bearing",
              cards: [
                { title: "Geometry", body: "Detailed design: bearing modelled with its plinth and set-out at the support, enough to check clearances and replacement access.", tone: "teal" },
                { title: "Alphanumeric", body: "Type, manufacturer, product reference, vertical and horizontal capacities, movement range and installation date.", tone: "amber" },
                { title: "Documentation", body: "Manufacturer data sheet, installation record, preset and orientation records, and replacement guidance.", tone: "purple" },
              ],
            },
          ],
        },
        {
          id: "bridges-example",
          label: "Worked example",
          blocks: [
            {
              kind: "steps",
              title: "Worked example: replacement of a highway overbridge",
              steps: [
                { title: "1. Assess the existing", body: "Scan the existing structure and gather inspection and assessment records as reference information." },
                { title: "2. Set requirements", body: "EIR defines structure breakdown, LOIN for deck, supports, bearings and joints, temporary works information and handover records." },
                { title: "3. Develop options", body: "Compare span arrangements and construction methods using simple models and constraints such as possession windows." },
                { title: "4. Design in detail", body: "Model the chosen bridge, link analysis models by revision, detail reinforcement and coordinate with highway and utilities." },
                { title: "5. Plan the demolition and installation", body: "Use 4D to plan removal of the old deck and installation of the new one during a weekend closure." },
                { title: "6. Record construction", body: "Scan before concealment, record bearing installation and capture product data." },
                { title: "7. Hand over", body: "Deliver the as-built model split into inspection elements, with bearing and joint data and construction records." },
              ],
            },
            {
              kind: "callout",
              title: "What made it work",
              body: "Rehearsing the installation sequence in 4D with the contractor and network operator gave everyone confidence the closure plan was realistic.",
              tone: "ok",
            },
            {
              kind: "checklist",
              title: "Handover pack for the bridge",
              items: [
                "As-built model split into the owner's inspection elements",
                "Bearing and expansion joint product data and installation records",
                "Design, check and approval records",
                "Pile and foundation records",
                "Retained temporary works information where relevant",
                "Inspection access arrangements and health and safety file information",
              ],
            },
          ],
        },
        {
          id: "bridges-challenges",
          label: "Challenges",
          blocks: [
            {
              kind: "table",
              title: "Structures challenges and mitigations",
              columns: ["Challenge", "Why it matters", "Mitigation"],
              rows: [
                ["Analysis and physical models diverge", "Design checks based on old geometry", "Link by revision and review dependencies after every change"],
                ["Complex geometry on curved alignments", "Hard to model and exchange", "Drive geometry from the alignment and test IFC exchange early"],
                ["Large reinforcement models", "Performance and review problems", "Split detail models and use agreed review views"],
                ["Temporary works information lost", "Valuable for future works and incidents", "Retain temporary works records in the AIM where relevant"],
                ["Existing structure uncertainty", "Hidden defects and dimensions", "Scan, inspect and record confidence levels in the model"],
                ["Product data at handover", "Bearings and joints missing manufacturer data", "Require product data submittals as part of construction information"],
                ["Inspection breakdown mismatch", "Model cannot feed inspection systems", "Agree element breakdown with the owner during design"],
              ],
            },
            {
              kind: "faq",
              title: "Structures questions",
              items: [
                { q: "Do we need to model all reinforcement?", a: "Only if the purpose and LOIN require it, typically for fabrication and congested zones. Otherwise reinforcement drawings and schedules can satisfy the need." },
                { q: "Should analysis models be handed over?", a: "Often yes, or at least the key results and calculation packages, because they support future assessment. Agree format and retention in the AIR." },
              ],
            },
            {
              kind: "callout",
              title: "Scan before you cover",
              body: "Once reinforcement, bearings and drainage are concealed, checking them becomes expensive. Make a scan or survey before concealment a hold point in the inspection and test plan.",
              tone: "info",
            },
          ],
        },
      ],
    },
    // ==================================================================== UTILITIES
    {
      id: "utilities",
      label: "Utilities (water, power, telecoms)",
      tabs: [
        {
          id: "utilities-overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "Information management for utility networks",
              body: [
                "Water, wastewater, power and telecoms networks combine linear assets such as pipes and cables with point assets such as valves, chambers, substations and cabinets, and with treatment plants or exchanges that behave more like buildings or process facilities.",
                "Utility owners manage these networks in GIS and asset management systems, with network topology, connectivity and operational status at the centre. Project information must feed those systems accurately, and must respect the security sensitivity of critical national infrastructure.",
              ],
            },
            {
              kind: "cards",
              title: "Utility network types",
              cards: [
                { title: "Water supply", body: "Mains, service pipes, valves, hydrants, meters, reservoirs and pumping stations with pressure zones.", tone: "blue" },
                { title: "Wastewater and drainage", body: "Sewers, manholes, pumping stations, storage and treatment works with gravity and rising main networks.", tone: "teal" },
                { title: "Power", body: "Cables, overhead lines, substations, transformers and switchgear with voltage levels and protection.", tone: "amber" },
                { title: "Telecoms", body: "Ducts, chambers, fibre and copper cables, cabinets and exchanges with capacity and connectivity.", tone: "purple" },
                { title: "Process facilities", body: "Treatment works and substations combine building, process and equipment information.", tone: "green" },
                { title: "Third-party diversions", body: "Many schemes divert other owners' utilities, each with its own records and handover requirements.", tone: "red" },
              ],
            },
            {
              kind: "callout",
              title: "Topology matters as much as geometry",
              body: "For a utility network, knowing what is connected to what, and in which direction flow or power runs, is often more important than precise 3D shape. Specify connectivity in the information requirements, not only geometry.",
              tone: "info",
            },
          ],
        },
        {
          id: "utilities-requirements",
          label: "Information requirements",
          blocks: [
            {
              kind: "cards",
              title: "From OIR to EIR for utilities",
              cards: [
                { title: "OIR", body: "The utility wants resilient, compliant networks, efficient maintenance and reliable records to avoid strikes and outages.", tone: "blue" },
                { title: "AIR", body: "GIS and asset system data per asset type: identifier, location, connectivity, material, size, installation date, status and criticality.", tone: "teal" },
                { title: "PIR", body: "Information for capacity planning, investment decisions, regulatory reporting and outage planning.", tone: "purple" },
                { title: "EIR", body: "Deliverables, LOIN, GIS data formats, connectivity rules, security handling and handover requirements for the appointment.", tone: "amber" },
              ],
            },
            {
              kind: "table",
              title: "Utility asset data examples",
              columns: ["Asset type", "Identification", "Location", "Key properties", "Documentation"],
              rows: [
                ["Water main", "Asset ID", "Start and end nodes, coordinates, depth", "Material, diameter, pressure class, installation date", "As-laid survey, pressure test records"],
                ["Valve", "Asset ID", "Coordinates, depth, network node", "Type, size, normal position, operating direction", "Installation record, photo"],
                ["Sewer pipe", "Asset ID, upstream and downstream manholes", "Node coordinates, invert levels", "Material, diameter, gradient, flow type", "CCTV survey, as-laid records"],
                ["Manhole", "Asset ID", "Coordinates, cover level", "Depth, chamber size, cover type, connections", "Inspection record"],
                ["Power cable", "Asset ID, circuit reference", "Route, depth, joint locations", "Voltage, conductor, size, installation date", "Cable records, test results"],
                ["Substation", "Asset ID", "Coordinates, site", "Voltage levels, transformer rating, switchgear", "Equipment schedules, test certificates"],
                ["Telecoms duct", "Asset ID, route section", "Route, depth, chambers", "Duct count, sizes, occupancy", "As-built route survey"],
                ["Fibre cable", "Asset ID", "Duct route and chambers", "Fibre count, type, splice points", "Splice and test records"],
              ],
            },
            {
              kind: "checklist",
              title: "EIR clauses specific to utilities",
              items: [
                "GIS data model and formats of the receiving owner",
                "Connectivity and topology rules, including flow direction",
                "Depth and position accuracy requirements for buried assets",
                "Survey methods for as-laid records before backfill",
                "Security handling of network location and criticality data",
                "Handover packages per owner for diverted third-party utilities",
                "Treatment of abandoned and decommissioned assets",
              ],
            },
          ],
        },
        {
          id: "utilities-cde",
          label: "CDE & federation",
          blocks: [
            {
              kind: "table",
              title: "Example federation structure for a utility scheme",
              columns: ["Level", "Example breakdown", "Notes"],
              rows: [
                ["Project", "Network reinforcement or new connection scheme", "One project code"],
                ["Network area", "Pressure zone, catchment, circuit or exchange area", "Matches how the owner manages the network"],
                ["Route section", "Chainage range along the main route", "Keeps containers manageable"],
                ["Network type", "Water, wastewater, power, telecoms", "Separate containers per owner where diversions are involved"],
                ["Facility", "Pumping station, treatment works, substation", "Facilities follow building or process modelling practice"],
                ["Shared reference", "Route alignment, terrain, existing utilities survey", "Record survey quality and source"],
              ],
            },
            {
              kind: "steps",
              title: "Coordinating buried services",
              steps: [
                { title: "Collect records", body: "Request records from all utility owners and register them as reference information with their source and date." },
                { title: "Survey and verify", body: "Use detection, ground penetrating radar and trial holes to verify key locations, and record confidence for each asset." },
                { title: "Model existing and proposed", body: "Model existing utilities with confidence attributes and proposed works with clearance zones." },
                { title: "Federate and check clearances", body: "Federate by route section and check clearances against design rules and owner requirements." },
                { title: "Package handover by owner", body: "Split as-laid records and data by owner so each receives exactly what it needs." },
              ],
            },
            {
              kind: "callout",
              title: "Record the confidence of existing data",
              body: "Not all utility records are equally reliable. Tag each existing asset with its source and confidence level, so designers and contractors know which locations have been verified.",
              tone: "warn",
            },
          ],
        },
        {
          id: "utilities-loin",
          label: "LOIN examples",
          blocks: [
            {
              kind: "table",
              title: "Utility elements: LOIN by stage",
              columns: ["Element", "Option selection", "Preliminary design", "Detailed design", "Handover"],
              rows: [
                ["Pipeline route", "Corridor in GIS", "Designed route and profile", "Final route with fittings and levels", "As-laid route with surveyed positions and depths"],
                ["Valves and hydrants", "Not modelled", "Key locations", "All valves with types and sizes", "Asset data with normal position and operation"],
                ["Manholes and chambers", "Not modelled", "Main chambers", "All chambers with levels and connections", "As-built levels and inspection data"],
                ["Cables", "Route corridor", "Route and type", "Route, depth, joints and ducts", "As-laid records and test results"],
                ["Substations and pumping stations", "Location options", "Outline layout", "Building and equipment modelled", "Equipment asset data and O&M information"],
                ["Existing utilities", "Records in GIS", "Records with verified key points", "Modelled with confidence and clearances", "Updated records of diverted and abandoned assets"],
                ["Ducts and chambers (telecoms)", "Not modelled", "Route concept", "Duct counts and chamber positions", "As-built route and occupancy"],
              ],
            },
            {
              kind: "callout",
              title: "Point objects can be enough",
              body: "For many network assets, a georeferenced point or line with the right attributes and connectivity satisfies the operational need. Reserve detailed 3D geometry for facilities and congested crossings.",
              tone: "ok",
            },
            {
              kind: "cards",
              title: "Geometry, data and documentation for a valve",
              cards: [
                { title: "Geometry", body: "Handover: georeferenced point with depth, or a simple 3D object where it sits in a congested chamber.", tone: "teal" },
                { title: "Alphanumeric", body: "Asset ID, type, size, normal position, operating direction, network node and installation date.", tone: "blue" },
                { title: "Documentation", body: "Installation record, photograph and any commissioning or pressure test record.", tone: "green" },
              ],
            },
          ],
        },
        {
          id: "utilities-example",
          label: "Worked example",
          blocks: [
            {
              kind: "steps",
              title: "Worked example: water main replacement through a town centre",
              steps: [
                { title: "1. Define the need", body: "The water company needs to replace an ageing main with frequent bursts, while minimising disruption to businesses and traffic." },
                { title: "2. Gather records", body: "Collect GIS records of the main and all other utilities in the street; register them with source and date." },
                { title: "3. Set requirements", body: "EIR defines LOIN for the new main, valves, hydrants and connections, GIS handover format and as-laid survey rules." },
                { title: "4. Survey and verify", body: "Detect existing services and dig trial holes at critical crossings; record confidence levels." },
                { title: "5. Design and coordinate", body: "Model the new main with clearance zones and federate with existing utilities and highway layout." },
                { title: "6. Plan the works", body: "Phase the works by street section with traffic management and customer supply interruptions planned." },
                { title: "7. Capture as-laid", body: "Survey the main and fittings before backfill and update the model and GIS data." },
                { title: "8. Hand over", body: "Load validated GIS data and asset records into the water company's systems; record abandoned assets." },
              ],
            },
            {
              kind: "callout",
              title: "What made it work",
              body: "Capturing as-laid positions before backfill and loading them directly into GIS meant the network records were accurate from the day the main went into service.",
              tone: "ok",
            },
            {
              kind: "checklist",
              title: "Handover pack for the water main",
              items: [
                "Validated GIS data for the new main, valves, hydrants and connections",
                "As-laid survey with positions and depths",
                "Pressure test and disinfection records",
                "Records of abandoned sections and their status",
                "Updated third-party utility records where diversions occurred",
                "Health and safety file information",
              ],
            },
          ],
        },
        {
          id: "utilities-challenges",
          label: "Challenges",
          blocks: [
            {
              kind: "table",
              title: "Utility challenges and mitigations",
              columns: ["Challenge", "Why it matters", "Mitigation"],
              rows: [
                ["Unreliable existing records", "Strikes, delays and safety risks", "Survey, verify, and record confidence levels"],
                ["Many owners in one street", "Coordination and handover complexity", "Interface registers and owner-specific handover packages"],
                ["GIS and BIM data models differ", "Data cannot be loaded into GIS", "Agree mapping early and test loading"],
                ["Security of network data", "Location data of critical assets is sensitive", "Apply ISO 19650-5 controls and need-to-know access"],
                ["Connectivity not captured", "Network analysis and outage planning fail", "Specify topology and validate it before handover"],
                ["Abandoned assets", "Future works hit old pipes and cables", "Record abandoned and decommissioned assets explicitly"],
                ["As-laid survey missed before backfill", "Positions become uncertain", "Make as-laid capture a hold point in the inspection and test plan"],
              ],
            },
            {
              kind: "faq",
              title: "Utility questions",
              items: [
                { q: "Do utilities really need BIM if they already use GIS?", a: "They need information management. BIM methods help design and construction coordination, while GIS remains the operational home. The goal is a clean flow from one to the other." },
                { q: "How accurate should buried asset positions be?", a: "State the accuracy in the information requirements for each asset type, and record how each position was captured. Surveyed as-laid positions are far more useful than positions copied from design." },
              ],
            },
            {
              kind: "callout",
              title: "Critical infrastructure is a security matter",
              body: "Combined location, capacity and criticality data for utility networks can be sensitive. Carry out the security triage early and decide what can be shared with whom, in line with ISO 19650-5 and the owner's policies.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ==================================================================== AI
    {
      id: "ai",
      label: "AI tools",
      tabs: [
        {
          id: "ai-tools",
          label: "AI tools",
          blocks: [
            { kind: "widget", widget: "ask-ai", title: "Ask AI about infrastructure BIM" },
            { kind: "widget", widget: "generate", title: "Draft an infrastructure EIR", docType: "Infrastructure EIR (linear asset)" },
            {
              kind: "checklist",
              title: "Give the AI good inputs",
              items: [
                "Asset type and extent, for example a road section by chainage range",
                "Stage of the scheme and the decisions being made",
                "The owner's asset data standards and handover format, if known",
                "Coordinate reference system and referencing conventions",
                "Security sensitivity of the asset",
              ],
            },
            {
              kind: "callout",
              title: "Check AI output",
              body: "AI drafts are a starting point. An information manager and the relevant engineering leads should check standards references, asset data requirements and contractual wording against the owner's current documents before issue.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "How should I break down a long road scheme in the CDE by section and chainage?",
    "What does IFC 4.3 add for alignment and linear referencing?",
    "What asset data should a rail owner require at handover for overhead line equipment?",
    "How do I write LOIN for buried utilities at each design stage?",
  ],
};
