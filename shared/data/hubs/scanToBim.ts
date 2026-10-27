import type { Hub } from "./types";

// Scan to BIM hub: reality capture, point cloud processing and as-built modelling,
// framed against the ISO 19650 information management process.
// Content is paraphrased practical guidance. Accuracy figures are indicative; always
// confirm against the instrument manufacturer's specification and the project survey specification.

export const scanToBimHub: Hub = {
  id: "scan-to-bim",
  eyebrow: "ADVANCED · REALITY CAPTURE",
  title: "Scan to BIM",
  intro:
    "Turn laser scans, SLAM and photogrammetry into reliable as-built information models. This hub covers the workflow, accuracy and level of detail, hardware and software choices, how a measured survey appointment fits the ISO 19650 process, and the QA checks that make scan-derived models trustworthy.",
  sections: [
    {
      id: "main",
      label: "Scan to BIM",
      tabs: [
        // ------------------------------------------------------------------ Overview
        {
          id: "overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "What is Scan to BIM",
              body: [
                "Scan to BIM is the process of capturing the existing condition of a building, structure or site with reality capture equipment (terrestrial laser scanners, mobile or SLAM scanners, drones and cameras), registering the captured data into a single georeferenced point cloud, and then using that point cloud as the reference for an information model of what is actually there.",
                "The output is not only geometry. A useful as-built or as-found model carries classification, identifiers and properties that the appointing party asked for in its information requirements, so that the model can support design, construction, refurbishment or asset management decisions.",
                "Under ISO 19650 the point cloud and the model are both information containers. They are specified in the exchange information requirements, produced to the project information standard, shared through the common data environment and checked against acceptance criteria like any other deliverable.",
              ],
            },
            {
              kind: "steps",
              title: "Process at a glance",
              steps: [
                { title: "Plan", body: "Agree purpose, extent, accuracy (LOA), level of detail and information (LOD / LOIN), coordinate system, deliverables and programme. Walk the site, identify access constraints and plan scan positions and control." },
                { title: "Scan", body: "Establish survey control with a total station or GNSS, capture the site with the chosen scanners and cameras, and record field notes, targets and any areas that could not be reached." },
                { title: "Process", body: "Register scans into one point cloud, tie it to control, check registration statistics, clean noise and moving objects, colourise, segment and publish in agreed formats." },
                { title: "Model", body: "Model elements against the point cloud to the agreed LOD and tolerance, add classification and properties to the LOIN, and run cloud-to-model deviation checks." },
                { title: "Deliver", body: "Share the point cloud, model, survey report and QA evidence through the CDE for review, authorization and acceptance against the EIR." },
              ],
            },
            {
              kind: "table",
              title: "Scan to BIM compared with traditional measured survey",
              columns: ["Aspect", "Traditional measured survey", "Scan to BIM"],
              rows: [
                ["Data captured", "Selected points and dimensions chosen in the field", "Millions of points recording the full visible surface, plus imagery"],
                ["Site time", "Long for complex or congested spaces", "Usually shorter on site; more effort moves to the office"],
                ["Revisiting the site", "Often needed when a dimension was missed", "Missed dimensions can usually be extracted from the point cloud later"],
                ["Output", "2D plans, sections and elevations", "Registered point cloud, 3D information model, drawings derived from the model"],
                ["Accuracy evidence", "Depends on surveyor notes and checks", "Registration reports, control residuals and cloud-to-model deviation maps"],
                ["Complex geometry", "Simplified or approximated", "Irregular, out-of-plumb and deformed surfaces are recorded as they are"],
                ["Reuse", "Limited to the drawn information", "Point cloud can be reused for later stages, clash checks and verification"],
                ["Data volume", "Small files", "Very large datasets that need a storage, viewing and CDE strategy"],
                ["Skills", "Measured building surveyor", "Surveyor, point cloud technician and BIM modeller working together"],
              ],
            },
            {
              kind: "cards",
              title: "Why clients commission it",
              cards: [
                { title: "Reduce design risk", body: "Designing refurbishment or extensions against a verified as-found condition reduces surprises, redesign and site clashes.", tone: "blue" },
                { title: "Better asset information", body: "A structured model of existing assets can seed the asset information model for operation and maintenance.", tone: "green" },
                { title: "Construction verification", body: "Repeated scans compare what was built against the design model and track progress objectively.", tone: "amber" },
                { title: "Permanent record", body: "A point cloud is a dated, measurable record of the asset, valuable for heritage, disputes and future works.", tone: "purple" },
              ],
            },
            {
              kind: "callout",
              title: "Define the purpose first",
              body: "Most Scan to BIM disappointments come from an unclear purpose. A model for space planning, one for MEP retrofit design and one for structural assessment need very different accuracy, detail and properties. Write the purpose into the EIR before choosing equipment or asking for prices.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Workflow
        {
          id: "workflow",
          label: "Workflow",
          blocks: [
            {
              kind: "steps",
              title: "End-to-end workflow in detail",
              steps: [
                { title: "1. Brief and requirements", body: "Appointing party states purpose, extent, required accuracy per element type, LOD and LOIN, coordinate reference system, formats and delivery milestones in the EIR." },
                { title: "2. Pre-survey reconnaissance", body: "Survey lead visits or reviews existing drawings, photographs and access arrangements; identifies hazards, restricted areas, reflective or dark surfaces and occupancy constraints." },
                { title: "3. Survey control", body: "A control network is established and observed with a total station and, where needed, GNSS, so that all scans can be tied to a stable, known coordinate frame." },
                { title: "4. Data capture", body: "Scanners are set up on planned positions with enough overlap; targets or natural features are recorded; photographs and field notes document conditions, gaps and occlusions." },
                { title: "5. Registration", body: "Individual scans are aligned with target-based, cloud-to-cloud or hybrid registration and constrained to control. Registration statistics are reviewed and weak links fixed." },
                { title: "6. Cleaning and segmentation", body: "Noise, people, vehicles and reflections are removed; the cloud is split by level, zone or system to keep files manageable for modelling." },
                { title: "7. Publishing the point cloud", body: "The registered cloud is exported in agreed formats, named to the information standard and shared in the CDE with a survey report." },
                { title: "8. Modelling", body: "Modellers create elements against the cloud to the agreed LOD and modelling tolerance, using levels and grids derived from the survey." },
                { title: "9. Information enrichment", body: "Classification, identifiers, materials, condition and other properties required by the LOIN are added, often with site photographs as evidence." },
                { title: "10. QA and delivery", body: "Cloud-to-model deviation analysis, model checks and a QA report are completed before the containers are shared for review and acceptance." },
              ],
            },
            {
              kind: "table",
              title: "Who does what",
              columns: ["Role", "Main responsibilities", "Key outputs"],
              rows: [
                ["Appointing party / information manager", "Defines purpose and requirements, accepts deliverables", "EIR clauses, acceptance decisions"],
                ["Survey lead (task team manager)", "Plans the survey, control and capture; signs off accuracy", "Survey method statement, survey report"],
                ["Field surveyor", "Control observations, scanning, photography, field notes", "Raw scan data, control observations"],
                ["Point cloud technician", "Registration, cleaning, segmentation, publishing", "Registered point cloud, registration report"],
                ["BIM modeller", "Models elements against the cloud to the LOD and LOIN", "As-built or as-found model"],
                ["Task information manager", "Naming, metadata, CDE uploads, checks against the information standard", "Compliant information containers"],
                ["QA reviewer", "Independent deviation checks and model audit", "QA report and deviation maps"],
              ],
            },
            {
              kind: "checklist",
              title: "Before you go to site",
              items: [
                "Purpose, extent and exclusions are agreed in writing",
                "Accuracy (LOA) is stated for measured and represented data",
                "LOD and properties are defined per element category",
                "Coordinate reference system, vertical datum and project base point are agreed",
                "Access, permits, induction and working hours are confirmed",
                "Risk assessment and method statement are approved",
                "Scan positions and control layout are planned on existing drawings",
                "Data storage, transfer and CDE upload route are arranged for large files",
                "Security requirements for sensitive areas are understood",
              ],
            },
            {
              kind: "faq",
              title: "Workflow questions",
              items: [
                { q: "Can modelling start before all scanning is finished?", a: "Yes, if the site is split into zones and each zone is registered and checked against control before modelling starts. Avoid modelling against an unregistered or provisionally registered cloud." },
                { q: "Should the surveyor or the design team do the modelling?", a: "Either can work. What matters is that responsibility for accuracy is clear. If the design team models, the surveyor should still deliver a registered, checked point cloud and the modeller should report deviations." },
                { q: "How are areas that could not be scanned handled?", a: "They should be recorded in the survey report and shown in the model with a clear status, for example as assumed or inferred geometry, so users know the information is not measured." },
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ Accuracy & LOD
        {
          id: "accuracy",
          label: "Accuracy & LOD",
          blocks: [
            {
              kind: "text",
              title: "Accuracy, detail and information are different things",
              body: [
                "Level of accuracy (LOA) describes how close measured or modelled positions are to the true positions. Level of development or detail (LOD) describes how much of the element is represented geometrically. Level of information need (LOIN, ISO 7817-1) describes the geometry, alphanumeric information and documentation required for a purpose at a milestone.",
                "A model can be highly detailed but inaccurate, or accurate but simplified. Specifications should therefore state all three, and should distinguish the accuracy of the point cloud (measured accuracy) from the accuracy of the modelled elements (represented accuracy).",
              ],
            },
            {
              kind: "table",
              title: "USIBD level of accuracy (LOA) bands",
              columns: ["Level", "Indicative range (at 95% confidence)", "Typical use"],
              rows: [
                ["LOA10", "User defined, coarser than about 50 mm", "Massing, early feasibility, site context"],
                ["LOA20", "About 15 mm to 50 mm", "Space planning, general architectural as-found models"],
                ["LOA30", "About 5 mm to 15 mm", "Most refurbishment design, MEP coordination, structural layouts"],
                ["LOA40", "About 1 mm to 5 mm", "Prefabrication interfaces, plant replacement, detailed heritage elements"],
                ["LOA50", "Up to about 1 mm", "Specialist industrial, metrology and fabrication tasks"],
              ],
            },
            {
              kind: "table",
              title: "LOD for as-built and as-found models",
              columns: ["LOD", "What is modelled", "Suitable for"],
              rows: [
                ["LOD 200", "Generic elements with approximate size, shape, location and orientation", "Massing, space planning, early option studies"],
                ["LOD 300", "Specific elements with accurate size, shape, location and orientation; main openings and thicknesses", "Refurbishment design, coordination, quantity take-off"],
                ["LOD 350", "As LOD 300 plus interfaces and connections with other systems", "MEP retrofit, interface-heavy coordination"],
                ["LOD 400", "Detailed elements including fabrication-level detail where visible", "Prefabrication, replacement of plant, specialist fit-out"],
                ["LOD 500", "Field-verified representation of the element as it exists", "As-built record and asset management where verification is required"],
              ],
            },
            {
              kind: "cards",
              title: "Registration accuracy and point density",
              cards: [
                { title: "Registration accuracy", body: "Judge registration on control residuals and independent check points, not only on the software's cloud-to-cloud error. A tidy overall statistic can hide a drifting floor or a weak link between buildings.", tone: "blue" },
                { title: "Point density", body: "Specify point spacing on the surface at the working distance, for example a few millimetres for detailed MEP and coarser for facades seen from distance. Density does not equal accuracy.", tone: "teal" },
                { title: "Range and angle", body: "Accuracy and density fall with distance and with shallow angles of incidence. Plan more scan positions rather than relying on long, oblique shots.", tone: "amber" },
                { title: "Surface effects", body: "Glass, mirrors, polished metal, water and very dark surfaces return noisy or false points. Record them in the survey report and handle them in modelling.", tone: "red" },
              ],
            },
            {
              kind: "callout",
              title: "Indicative figures only",
              body: "The LOA bands follow the USIBD level of accuracy specification and are shown here as a summary. Always confirm the current edition of the specification you reference, and confirm instrument accuracy from the manufacturer's data sheet for the conditions on site.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ Hardware
        {
          id: "hardware",
          label: "Hardware",
          blocks: [
            {
              kind: "cards",
              title: "Capture technology categories",
              cards: [
                { title: "Terrestrial laser scanners (TLS)", body: "Tripod-mounted scanners that capture high-accuracy, dense point clouds from each set-up. Well-known families include Leica RTC360 and ScanStation, FARO Focus, Trimble X-series, Z+F IMAGER and RIEGL VZ. Best for accurate interiors, plant rooms, facades and structure.", tone: "blue" },
                { title: "Mobile and SLAM scanners", body: "Handheld, backpack or trolley systems that scan while moving and use simultaneous localisation and mapping. Examples include NavVis, Leica BLK2GO, FARO Orbis and GeoSLAM ZEB lines, and Emesent Hovermap. Fast for large floor plates and corridors, usually with lower absolute accuracy than TLS.", tone: "teal" },
                { title: "Drones and photogrammetry", body: "UAVs carrying cameras or lidar payloads (for example DJI enterprise platforms with lidar modules) capture roofs, facades, sites and infrastructure. Photogrammetry builds a point cloud from overlapping images and needs good ground control.", tone: "green" },
                { title: "Total stations and GNSS", body: "Used to establish and check survey control, not to capture the whole scene. Leica, Trimble, Topcon and Sokkia are common families. Control ties scans together and to the project coordinate system.", tone: "purple" },
                { title: "Panoramic and 360 cameras", body: "Capture imagery for context, progress records and colourising point clouds. Useful alongside scanning but not a substitute for measured data.", tone: "amber" },
                { title: "Specialist sensors", body: "Ground penetrating radar and utility detection for buried services, thermal cameras for condition surveys, and borehole or tunnel scanners for infrastructure.", tone: "red" },
              ],
            },
            {
              kind: "table",
              title: "Choosing a capture method",
              columns: ["Method", "Strengths", "Limitations", "Typical uses"],
              rows: [
                ["Terrestrial laser scanning", "High accuracy and density, repeatable", "Slower per area, many set-ups in congested spaces", "Plant rooms, structure, heritage detail, facades"],
                ["Mobile / SLAM scanning", "Very fast coverage, good for large interiors", "Drift over long trajectories, lower absolute accuracy", "Office floors, warehouses, corridors, tunnels"],
                ["Drone photogrammetry", "Covers roofs and large sites quickly", "Depends on light, texture and ground control", "Roofs, site topography, stockpiles, facades"],
                ["Drone lidar", "Penetrates vegetation, good for terrain", "Lower density on vertical surfaces", "Corridors, terrain models, infrastructure"],
                ["Total station", "Highest accuracy for individual points", "Discrete points only", "Control networks, check points, setting out"],
                ["Hybrid (TLS + SLAM + drone)", "Right tool for each zone", "More registration and QA effort", "Complex campuses, hospitals, industrial sites"],
              ],
            },
            {
              kind: "checklist",
              title: "Hardware selection questions",
              items: [
                "What accuracy does the purpose need, and can the instrument achieve it at the working ranges?",
                "How congested is the space and how many set-ups will be needed?",
                "Are there access, height or occupancy constraints that favour mobile capture?",
                "Is colour imagery needed for modelling or for the client?",
                "Does the instrument have current calibration certificates?",
                "Will the data import cleanly into the registration software you use?",
                "Are there flight restrictions, permissions or privacy rules for drones on this site?",
                "Is there a plan for battery, storage and data back-up in the field?",
              ],
            },
            {
              kind: "callout",
              title: "Buy, rent or subcontract",
              body: "Equipment prices vary widely by specification, region and licensing. Many organisations start by subcontracting to a specialist survey firm or renting equipment, and only invest once they have a steady pipeline and trained staff. Compare total cost including software, training, calibration and processing time, not the instrument price alone.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Software
        {
          id: "software",
          label: "Software",
          blocks: [
            {
              kind: "table",
              title: "Software by workflow stage",
              columns: ["Stage", "What it does", "Common tools"],
              rows: [
                ["Registration", "Aligns scans, ties to control, reports statistics", "Leica Cyclone REGISTER 360, FARO SCENE, Trimble RealWorks, Autodesk ReCap Pro"],
                ["Photogrammetry", "Builds point clouds and meshes from images", "Pix4D, Agisoft Metashape, RealityCapture, Bentley iTwin Capture"],
                ["Point cloud management and viewing", "Hosts, streams and shares very large clouds", "Leica Cyclone ENTERPRISE, Cintoo, NavVis IVION, Trimble Clarity, Bentley iTwin"],
                ["Plug-ins for authoring", "Brings clouds into authoring tools with snapping and fitting", "Leica CloudWorx, FARO As-Built, Undet, PointSense"],
                ["Modelling", "Creates the as-built information model", "Autodesk Revit, Graphisoft Archicad, Bentley OpenBuildings and OpenPlant, Vectorworks, Tekla for steel"],
                ["Automated feature extraction", "Detects walls, pipes, steel and other features semi-automatically", "ClearEdge3D EdgeWise, Revit and plug-in auto-fitting tools, AI-assisted segmentation tools"],
                ["Deviation and verification", "Compares point clouds with models", "ClearEdge3D Verity, Navisworks with point clouds, CloudCompare, Cintoo, Leica tools"],
                ["Open source", "General point cloud processing and analysis", "CloudCompare, PDAL, Potree for web viewing"],
              ],
            },
            {
              kind: "table",
              title: "Authoring platform comparison for Scan to BIM",
              columns: ["Criterion", "Revit", "Archicad", "Other platforms"],
              rows: [
                ["Native point cloud format", "RCP / RCS via ReCap", "E57 and other formats imported to native point cloud object", "Varies; most accept E57 or LAS"],
                ["Handling very large clouds", "Good with indexed RCP; plug-ins help", "Good for moderate sizes; segmenting recommended", "Plant and infrastructure tools often handle large clouds well"],
                ["Irregular geometry", "Limited native tools; plug-ins or adaptive families help", "Morph and shell tools help with irregular forms", "Mesh-based or specialist tools may suit heritage better"],
                ["MEP modelling from scans", "Strong with plug-ins for pipe and duct fitting", "Possible; fewer dedicated fitting tools", "Plant design tools are strong for process piping"],
                ["IFC export for delivery", "Good with mapped parameters", "Good with property mapping", "Check exporter certification and property mapping"],
                ["Market prevalence", "Widely used in many regions", "Common in Europe and for architectural practice", "Depends on sector, especially infrastructure and plant"],
              ],
            },
            {
              kind: "cards",
              title: "Automated feature extraction: what to expect",
              cards: [
                { title: "Works well", body: "Regular geometry: walls, floors, ceilings, straight pipes, ducts, structural steel sections and levels.", tone: "green" },
                { title: "Needs supervision", body: "Fittings, junctions, cable trays, partially occluded elements and anything mixed with clutter.", tone: "amber" },
                { title: "Still mainly manual", body: "Heritage ornament, irregular masonry, complex plant and anything where the purpose needs judgement about what an element is.", tone: "red" },
                { title: "Always check", body: "Automated results still need deviation checks, classification and property enrichment. Automation saves modelling time, not QA time.", tone: "blue" },
              ],
            },
            {
              kind: "callout",
              title: "Product names change",
              body: "Tools in this space are frequently renamed, merged or acquired. Treat the names here as examples of categories, and check current capabilities, licensing and file format support before you commit.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ ISO 19650
        {
          id: "iso19650",
          label: "ISO 19650",
          blocks: [
            {
              kind: "table",
              title: "A survey and scan appointment through the delivery process",
              columns: ["Activity", "What it means for Scan to BIM"],
              rows: [
                ["5.1 Assessment and need", "Identify the need for as-found information, existing reference information, the project information standard (including coordinates) and the CDE capacity for large datasets."],
                ["5.2 Invitation to tender", "Write EIR clauses for the survey: purpose, extent, LOA, LOD, LOIN, formats, deliverables, milestones and acceptance criteria. Supply existing drawings as reference information."],
                ["5.3 Tender response", "The survey team proposes method, equipment, control strategy, programme and a pre-appointment BEP, and demonstrates capability and capacity."],
                ["5.4 Appointment", "Confirm the post-appointment BEP, responsibility matrix, TIDP for survey deliverables and the information protocol, including licence to use the point cloud."],
                ["5.5 Mobilization", "Test the end-to-end route: upload a sample point cloud to the CDE, check naming and metadata, confirm the coordinate set-up in authoring tools."],
                ["5.6 Collaborative production", "Capture, register, model and check. Share containers in the shared state for review by the design team before authorization."],
                ["5.7 Information model delivery", "Lead appointed party authorizes; appointing party reviews against the EIR acceptance criteria and accepts into the published state."],
                ["5.8 Project close-out", "Archive raw and registered data, record lessons learned, and pass the point cloud and model to the asset information model where required."],
              ],
            },
            {
              kind: "checklist",
              title: "EIR clauses for a measured survey",
              items: [
                "Purpose of the survey and the decisions it supports",
                "Extent, inclusions and exclusions, shown on a plan",
                "Coordinate reference system, vertical datum, project base point and units",
                "Required accuracy (LOA) for the point cloud and for modelled elements",
                "LOD and LOIN per element category and per milestone",
                "Point cloud deliverables, density, colour and segmentation",
                "File formats for point clouds, models and drawings",
                "Survey report content, including control, registration statistics and gaps",
                "QA requirements and the cloud-to-model tolerance to be demonstrated",
                "Security and privacy requirements, including treatment of sensitive areas",
                "Licence, ownership and permitted reuse of captured data",
              ],
            },
            {
              kind: "table",
              title: "File formats and CDE treatment",
              columns: ["Format", "What it is", "CDE guidance"],
              rows: [
                ["E57", "Vendor-neutral point cloud and imagery format (ASTM E2807)", "Preferred open exchange format for registered point clouds"],
                ["LAS / LAZ", "ASPRS lidar format; LAZ is the compressed version", "Common for drone, terrain and infrastructure data"],
                ["RCP / RCS", "Autodesk ReCap project and indexed scan files", "Convenient for Revit users; supply E57 as well for openness"],
                ["Native scanner formats", "Raw project data from registration software", "Archive as raw data; not usually shared for coordination"],
                ["IFC", "Open model exchange format (ISO 16739)", "Deliver the as-built model in IFC alongside the native model where required"],
                ["PDF survey report", "Method, control, statistics, gaps and QA", "Share with the point cloud so users can judge fitness for purpose"],
              ],
            },
            {
              kind: "cards",
              title: "CDE states, naming and security",
              cards: [
                { title: "Work in progress", body: "Raw scans and provisional registration stay in the survey task team's WIP area until registration has been checked against control.", tone: "blue" },
                { title: "Shared", body: "Checked point clouds are shared, often segmented by zone or level, so designers can start work. Use a status code that makes clear whether the cloud is suitable for coordination.", tone: "teal" },
                { title: "Published and archived", body: "Accepted point clouds and models are published as reference information; superseded versions are archived with their survey reports.", tone: "green" },
                { title: "Naming", body: "Name point cloud containers with the project information standard fields. Use the volume or zone field for segmentation and a type code agreed for point clouds or surveys.", tone: "purple" },
                { title: "Security (ISO 19650-5)", body: "Point clouds and imagery can reveal security features, access routes and occupants. Apply the security-minded approach: assess sensitivity, restrict access, remove or mask sensitive areas, and control onward sharing.", tone: "red" },
              ],
            },
            {
              kind: "callout",
              title: "Large files need a plan",
              body: "Point clouds can run to hundreds of gigabytes. Agree in mobilization whether the CDE stores full clouds, segmented clouds or links to a dedicated point cloud platform, and how version control and acceptance will be recorded if the cloud lives outside the CDE.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Use cases
        {
          id: "use-cases",
          label: "Use cases",
          blocks: [
            {
              kind: "cards",
              title: "Where Scan to BIM delivers value",
              cards: [
                { title: "Heritage and conservation", body: "Records irregular, historic fabric precisely; supports condition surveys, conservation planning and a permanent archive. Often uses mesh or detailed modelling where the purpose needs it.", tone: "purple" },
                { title: "Refurbishment and retrofit", body: "Provides a verified base for design where existing drawings are missing or unreliable, reducing redesign and site surprises.", tone: "blue" },
                { title: "FM and digital twin", body: "Seeds the asset information model with spaces, assets and identifiers, and gives operators a navigable record of the building.", tone: "green" },
                { title: "Construction verification and progress", body: "Repeated scans compare installed work with the design model, check tolerances before follow-on trades, and evidence progress for valuations.", tone: "amber" },
                { title: "MEP retrofit", body: "Captures congested plant rooms and ceiling voids so new services can be routed and prefabricated with confidence.", tone: "teal" },
                { title: "Infrastructure", body: "Bridges, tunnels, rail and highways: clearance checks, deformation monitoring, as-built records and inputs to IFC 4.3 models.", tone: "red" },
              ],
            },
            {
              kind: "table",
              title: "Typical settings by use case",
              columns: ["Use case", "Typical LOA", "Typical LOD", "Main capture method"],
              rows: [
                ["Space planning and lease plans", "LOA20", "LOD 200", "SLAM or TLS"],
                ["Architectural refurbishment", "LOA20 to LOA30", "LOD 300", "TLS, SLAM for large floors"],
                ["Structural assessment", "LOA30", "LOD 300 to 350", "TLS"],
                ["MEP retrofit and prefabrication", "LOA30 to LOA40", "LOD 350 to 400", "TLS"],
                ["Heritage record", "LOA30 to LOA40 for key elements", "LOD 300 to 400, or mesh", "TLS and photogrammetry"],
                ["Construction verification", "LOA30", "Compared with design model", "TLS or SLAM at agreed intervals"],
                ["Site and topography", "LOA10 to LOA20", "Terrain surface", "Drone photogrammetry or lidar"],
              ],
            },
            {
              kind: "text",
              title: "Choosing the right level for each use",
              body: [
                "The table shows indicative settings. A single project often mixes them: a plant room at higher accuracy and detail, office floors at a lower level, and the site from a drone. Specify by zone or element category rather than one level for everything.",
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ Challenges
        {
          id: "challenges",
          label: "Challenges",
          blocks: [
            {
              kind: "table",
              title: "Common challenges and mitigations",
              columns: ["Challenge", "Why it matters", "Mitigation"],
              rows: [
                ["Unclear purpose", "Leads to over or under specification and disputes", "Write purpose, LOA, LOD and LOIN in the EIR before tender"],
                ["Occlusion and access", "Hidden areas cannot be measured", "Plan extra set-ups, schedule access, record gaps and show inferred geometry clearly"],
                ["Registration drift", "Errors accumulate across floors or long corridors", "Use a control network and independent check points; constrain registration to control"],
                ["Reflective and dark surfaces", "Noisy or false points", "Adjust scanner settings, add viewpoints, flag affected areas in the survey report"],
                ["Huge datasets", "Slow software, storage and CDE problems", "Segment clouds, use indexed formats and a point cloud platform, agree storage early"],
                ["Modelling interpretation", "Modellers idealise walls as plumb and floors as flat", "State modelling tolerance and when to model deviations; check with deviation maps"],
                ["Mismatched coordinates", "Models do not line up with design or site", "Agree CRS, datum and base point in the information standard and test in mobilization"],
                ["Changing site conditions", "Scan becomes out of date", "Date-stamp clouds, rescan changed areas, record survey date in metadata"],
                ["Security and privacy", "Sensitive features or people captured", "Apply ISO 19650-5 assessment, mask or remove sensitive areas, restrict access"],
                ["Skills gaps", "Poor registration or modelling quality", "Train staff, use experienced survey partners, and require QA evidence"],
              ],
            },
            {
              kind: "callout",
              title: "The model is only as good as the control",
              body: "Without an independent control network, it is very hard to prove that a large or multi-storey point cloud is accurate. Ask for control and check point results in the survey report.",
              tone: "warn",
            },
            {
              kind: "faq",
              title: "Challenge questions",
              items: [
                { q: "Can we use existing drawings instead of scanning hidden areas?", a: "Yes, but record the source and status of that information in the model so users know it was not measured. Consider intrusive surveys where hidden conditions are critical." },
                { q: "Who is liable if the scan is wrong?", a: "Liability should be set out in the appointment and information protocol. Clear accuracy specifications, QA evidence and documented gaps reduce disputes." },
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ Cost estimator
        {
          id: "cost",
          label: "Cost estimator",
          blocks: [
            { kind: "widget", widget: "scan-cost", title: "Scan-to-BIM cost estimator" },
            {
              kind: "text",
              title: "What drives Scan to BIM cost",
              body: [
                "Floor area and complexity are the starting point, but they are rarely the biggest factor. Congested plant rooms, ceiling voids and irregular historic fabric need far more scan set-ups and modelling effort per square metre than open-plan offices.",
                "Required accuracy (LOA) and detail (LOD) have a large effect. Moving from LOD 200 to LOD 350 or LOD 400 can multiply modelling time, and tighter accuracy needs more control, more set-ups and more QA.",
                "Scope of disciplines matters: architecture only is quicker than architecture plus structure plus MEP. Properties required by the LOIN add effort beyond geometry.",
                "Site conditions add cost: restricted access, out-of-hours working, occupied buildings, inductions, height access and travel.",
                "Deliverables beyond the model, such as 2D drawings, survey reports, deviation maps, IFC exports and point cloud hosting, should be priced explicitly.",
                "Treat any estimate as indicative. Rates vary by region, market and supplier, so use the estimator to compare options and to check the reasonableness of quotations, not as a price.",
              ],
            },
            {
              kind: "checklist",
              title: "Make quotations comparable",
              items: [
                "Same extent plan and exclusions for every bidder",
                "Same LOA, LOD and LOIN per element category",
                "Same formats and deliverables list",
                "Same QA evidence requirements and tolerance",
                "Clear assumptions about access and working hours",
                "Separate prices for survey, registration, modelling and drawings",
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
              title: "Test your Scan to BIM knowledge",
              questions: [
                { q: "What does LOA describe in a Scan to BIM specification?", options: ["How much of an element is modelled", "How close measured or modelled positions are to true positions", "The properties required for an element", "The file format of the point cloud"], answer: 1, why: "Level of accuracy is about positional accuracy. Detail is covered by LOD and information by LOIN." },
                { q: "Which format is the vendor-neutral standard for exchanging point clouds and imagery?", options: ["RCP", "DWG", "E57", "NWD"], answer: 2, why: "E57 is the open, vendor-neutral format defined by ASTM E2807." },
                { q: "What is the main purpose of a survey control network?", options: ["To colourise the point cloud", "To reduce file size", "To tie scans to a stable, known coordinate frame and check accuracy", "To replace the need for scanning"], answer: 2, why: "Control provides the reference frame and independent checks that prove registration accuracy." },
                { q: "Which capture method is usually fastest for large open office floors?", options: ["Total station", "Mobile or SLAM scanning", "Ground penetrating radar", "Hand measurement"], answer: 1, why: "Mobile and SLAM systems cover large interiors quickly, usually with lower absolute accuracy than terrestrial scanning." },
                { q: "Where should the purpose, LOA and LOD for a scan survey be stated under ISO 19650?", options: ["In the exchange information requirements", "Only in the survey report", "In the project close-out report", "In the modeller's notes"], answer: 0, why: "The EIR sets out the appointing party's requirements and acceptance criteria for the appointment." },
                { q: "Which part of ISO 19650 covers the security-minded approach relevant to sensitive point clouds?", options: ["Part 1", "Part 3", "Part 4", "Part 5"], answer: 3, why: "ISO 19650-5 covers security-minded information management." },
                { q: "What does a cloud-to-model deviation analysis show?", options: ["How many clashes the design has", "The distance between modelled surfaces and the point cloud", "The scanner's battery life", "The number of scan positions"], answer: 1, why: "Deviation analysis compares modelled geometry with the measured cloud, usually as a colour map against tolerance bands." },
                { q: "Which statement about point density is correct?", options: ["Higher density always means higher accuracy", "Density and accuracy are independent of distance", "Density describes point spacing and is not the same as accuracy", "Density only matters for drone surveys"], answer: 2, why: "Density is about spacing on the surface; accuracy is about positional correctness. Both degrade with range and angle." },
                { q: "In which CDE state should raw, unchecked scans normally remain?", options: ["Work in progress", "Shared", "Published", "Archived"], answer: 0, why: "Raw and provisionally registered data stays in the task team's WIP area until it has been checked." },
                { q: "Which LOD is usually described as a field-verified representation?", options: ["LOD 100", "LOD 200", "LOD 300", "LOD 500"], answer: 3, why: "LOD 500 refers to field verification of size, shape, location and quantity." },
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ AI tools
        {
          id: "ai",
          label: "AI tools",
          blocks: [
            { kind: "widget", widget: "ask-ai", title: "Ask AI about scan to BIM" },
            { kind: "widget", widget: "generate", title: "Draft a scan survey specification", docType: "Measured survey and scan-to-BIM specification" },
            {
              kind: "callout",
              title: "Check AI output",
              body: "AI drafts are a starting point. A competent surveyor and information manager should check accuracy values, coordinate systems and contractual wording before a specification is issued.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ Advanced workflow
        {
          id: "advanced",
          label: "Advanced workflow",
          blocks: [
            {
              kind: "steps",
              title: "Control networks",
              steps: [
                { title: "Design the network", body: "Place primary control around and through the site with good geometry, intervisibility and stable monumentation. Add secondary control on each floor and in each building." },
                { title: "Observe and adjust", body: "Observe with a total station using redundant measurements; tie to GNSS or existing grid where the project coordinate system requires it. Run a least squares adjustment and record residuals." },
                { title: "Connect scans", body: "Use targets on control points, or scan from control, so each registration block is constrained to the network." },
                { title: "Hold back check points", body: "Keep independent points out of the registration so they can be used to test the final cloud objectively." },
              ],
            },
            {
              kind: "checklist",
              title: "Registration QA",
              items: [
                "Registration constrained to the control network, not floating",
                "Target and cloud-to-cloud residuals reviewed link by link, not just as one overall figure",
                "Independent check points within the specified tolerance",
                "Floor-to-floor and building-to-building links checked through stairs, risers and facades",
                "Sections cut through the cloud show no doubled walls or slabs",
                "Moving objects and noise removed",
                "Registration report saved with the point cloud in the CDE",
              ],
            },
            {
              kind: "table",
              title: "Cloud-to-model tolerance checks",
              columns: ["Check", "Method", "Typical acceptance approach"],
              rows: [
                ["Element deviation", "Colour map of distance from model surfaces to the cloud", "Most points within the stated tolerance band; outliers explained"],
                ["Level and grid check", "Compare modelled levels and grids with surveyed values", "Differences within the represented accuracy for the LOA"],
                ["Wall verticality and floor flatness", "Analyse deviation of planar elements", "Deviations beyond tolerance modelled or flagged, per the specification"],
                ["Opening positions", "Spot checks of doors, windows and penetrations", "Positions within the agreed tolerance"],
                ["MEP centrelines", "Compare pipe and duct centrelines with fitted cylinders", "Within the tolerance needed for prefabrication or routing"],
                ["Missing elements", "Visual and automated comparison for unmodelled features", "All in-scope elements modelled or listed as excluded"],
                ["Statistical summary", "Histogram and percentages by tolerance band", "Reported in the QA report for acceptance"],
              ],
            },
            {
              kind: "cards",
              title: "Scan versus BIM in construction",
              cards: [
                { title: "Scan versus design", body: "Compare as-built scans with the design model to find installation errors before they are covered up, such as slab edges, embeds, sleeves and steel positions.", tone: "blue" },
                { title: "Clash against design", body: "Run clash detection between the point cloud and new design elements to find conflicts with existing structure and services in refurbishment.", tone: "amber" },
                { title: "Progress tracking", body: "Repeat scans at agreed intervals to measure installed quantities and verify progress claims objectively.", tone: "green" },
                { title: "Issue management", body: "Record deviations as issues, ideally using BCF, assign owners and close them out through the coordination process.", tone: "purple" },
              ],
            },
            {
              kind: "callout",
              title: "Report deviations, do not hide them",
              body: "A good as-built model either models significant deviations or flags them. Agree in the specification which approach applies to each element category, so designers know whether a straight wall in the model is really straight.",
              tone: "ok",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "What LOA and LOD should I specify for a refurbishment of an occupied office building?",
    "How should a measured survey be written into the EIR under ISO 19650?",
    "When should I use SLAM scanning instead of a terrestrial laser scanner?",
    "How do I check that a scan-derived model meets the agreed tolerance?",
  ],
};
