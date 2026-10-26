// Information uses: why information is produced (ISO 19650-1 §5.1 purposes; taxonomy after the
// BIM Project Execution Planning Guide). A project selects the uses it needs; each use drives
// the LOIN, deliverables and capability the appointed parties must show.

export type UsePhase = "Plan" | "Design" | "Construct" | "Operate";

export interface InfoUse {
  code: string;
  name: string;
  phases: UsePhase[];
  category: "Capture" | "Design & analysis" | "Coordination" | "Quantities & cost" | "Time & logistics" | "Field & quality" | "Handover & assets" | "Operations";
  description: string;
  value: string;
  inputs: string[];
  deliverables: string[];
  /** typical geometry / information need */
  loin: string;
  skills: string[];
  clause: string;
}

const u = (code: string, name: string, phases: UsePhase[], category: InfoUse["category"], description: string, value: string, inputs: string[], deliverables: string[], loin: string, skills: string[], clause = "19650-1 §5.1"): InfoUse =>
  ({ code, name, phases, category, description, value, inputs, deliverables, loin, skills, clause });

export const INFO_USES: InfoUse[] = [
  u("IU-01", "Existing conditions capture", ["Plan", "Design", "Construct"], "Capture", "Survey existing site, structures and services (laser scan, photogrammetry, utility survey) and model them.", "Reliable baseline; fewer surprises on site.", ["Topographic & utility survey", "Point cloud"], ["Existing conditions model", "Registered point cloud", "Survey report"], "Geometry to survey tolerance; asset identity for retained elements", ["Scan-to-BIM", "Survey coordination"]),
  u("IU-02", "Site analysis", ["Plan"], "Capture", "Use GIS and site data to evaluate site options, access, constraints and orientation.", "Better site decisions early.", ["GIS data", "Planning constraints"], ["Site analysis report", "Massing study"], "Low geometry; rich GIS attributes", ["GIS", "Urban analysis"]),
  u("IU-03", "Programming / space planning", ["Plan", "Design"], "Design & analysis", "Validate the design against the brief: areas, adjacencies, room data.", "Design meets client requirements.", ["Client brief", "Room data sheets"], ["Area schedule", "Brief compliance report"], "Spaces with area, function and occupancy", ["Space management"], "19650-2 §5.1.2"),
  u("IU-04", "Design authoring", ["Design"], "Design & analysis", "Create the discipline models from which drawings and schedules are produced.", "Consistent drawings and data from one source.", ["Brief", "Standards & methods"], ["Discipline models", "Drawings", "Schedules"], "Per LOIN matrix by stage", ["Authoring software", "Modelling standards"], "19650-2 §5.6"),
  u("IU-05", "Design review & visualisation", ["Design"], "Design & analysis", "Stakeholders review the model in 3D / VR, renderings and walkthroughs.", "Faster approvals, fewer misunderstandings.", ["Federated model"], ["Review sessions", "Renderings", "Comments (BCF)"], "Appearance and spatial geometry", ["Visualisation", "Review facilitation"]),
  u("IU-06", "Structural analysis", ["Design"], "Design & analysis", "Analytical models for structural design and checking.", "Optimised, verifiable structure.", ["Structural model", "Loads"], ["Analysis model", "Calculations"], "Analytical geometry, materials, loads", ["Structural analysis software"]),
  u("IU-07", "Energy & environmental analysis", ["Design"], "Design & analysis", "Energy, daylight, thermal comfort and CFD from the model.", "Lower operating cost; certification evidence.", ["Architectural & MEP models", "Weather data"], ["Energy model", "Simulation report"], "Spaces, envelope properties, zones", ["Energy simulation"]),
  u("IU-08", "MEP engineering analysis", ["Design"], "Design & analysis", "Load calculations, sizing and system analysis from the MEP model.", "Right-sized systems.", ["MEP model", "Space data"], ["Calculations", "System schematics"], "Systems connected, flow and capacity parameters", ["MEP analysis software"]),
  u("IU-09", "Code & regulation validation", ["Design"], "Design & analysis", "Check egress, fire, accessibility and planning rules against the model.", "Fewer authority comments.", ["Discipline models", "Regulations"], ["Compliance report"], "Spaces, doors, fire ratings", ["Rule-based checking"]),
  u("IU-10", "Sustainability certification", ["Design", "Construct"], "Design & analysis", "Collect model data and evidence for LEED / BREEAM / local rating systems.", "Credits evidenced from model data.", ["Models", "Product data"], ["Credit evidence", "Material schedules"], "Material and product properties", ["Sustainability assessment"]),
  u("IU-11", "3D coordination & clash detection", ["Design", "Construct"], "Coordination", "Federate models, run clash tests per matrix and resolve issues through BCF.", "Fewer RFIs and rework on site.", ["Discipline models", "Clash matrix"], ["Clash reports", "Issue log (BCF)", "Coordinated model"], "Spatially correct geometry incl. clearance zones", ["Federation", "Clash management"], "19650-2 §5.6.3"),
  u("IU-12", "Drawing production from model", ["Design", "Construct"], "Coordination", "All drawings derived from coordinated models.", "Drawings always consistent with the model.", ["Coordinated models"], ["Drawing sets", "Sheet register"], "Per drawing scale", ["Sheet & view management"]),
  u("IU-13", "Quantity take-off", ["Design", "Construct"], "Quantities & cost", "Extract quantities from models by classification for BOQ and estimates.", "Faster, traceable quantities.", ["Classified models"], ["Quantity schedules", "BOQ input"], "Classified elements with measurable geometry", ["5D / QTO", "Measurement rules (e.g. NRM)"]),
  u("IU-14", "Cost estimation (5D)", ["Design", "Construct"], "Quantities & cost", "Link quantities to rates for cost plans and cost checks per milestone.", "Cost certainty and option comparison.", ["Quantities", "Rates"], ["Cost plan", "Cost reports"], "Classification, quantities", ["Cost management"]),
  u("IU-15", "Phase planning (4D)", ["Plan", "Design", "Construct"], "Time & logistics", "Link model elements to the programme to simulate sequence.", "Validated sequence; clear communication.", ["Model", "Programme"], ["4D simulation", "Sequence reviews"], "Elements split by pour / zone / work package", ["4D software", "Planning"]),
  u("IU-16", "Site logistics planning", ["Construct"], "Time & logistics", "Model cranes, hoarding, access, laydown and temporary works.", "Safer, efficient sites.", ["Site model", "Programme"], ["Logistics plans per phase"], "Temporary works and site equipment", ["Logistics modelling"]),
  u("IU-17", "Construction progress monitoring", ["Construct"], "Time & logistics", "Track planned vs actual using the model (status parameters, scans, site capture).", "Early warning of delay; evidence for payment.", ["4D model", "Site captures"], ["Progress dashboard", "Progress reports"], "Status / installation date per element", ["Progress tracking", "Reality capture"]),
  u("IU-18", "Digital fabrication & prefabrication", ["Construct"], "Field & quality", "Shop / fabrication models for steel, MEP spools, precast and modular units.", "Less waste, higher quality.", ["Coordinated model"], ["Fabrication models", "Spool drawings", "CNC data"], "Fabrication-level geometry (LOD 400)", ["Fabrication software"]),
  u("IU-19", "Field layout & setting out", ["Construct"], "Field & quality", "Set out from the model with total stations / robotic layout.", "Accurate installation.", ["Coordinated model", "Control points"], ["Setting-out points", "Layout reports"], "Accurate positions and grid / survey coordinates", ["Survey & layout tools"]),
  u("IU-20", "Model-based QA/QC & inspections", ["Construct"], "Field & quality", "Inspection and test plans, snags and NCRs linked to model elements.", "Traceable quality records.", ["Model", "ITPs"], ["Inspection records", "Snag lists"], "Element identity and location", ["Field BIM apps"]),
  u("IU-21", "Health & safety planning", ["Design", "Construct"], "Field & quality", "Identify and communicate hazards using the model (design risk register, safety zones).", "Hazards removed at design stage.", ["Models", "Programme"], ["Design risk register", "Safety plans"], "Hazard tags, temporary works", ["CDM / H&S"]),
  u("IU-22", "Record (as-built) modelling", ["Construct", "Operate"], "Handover & assets", "Update models to reflect what was built, verified by survey.", "Trustworthy information for operations.", ["Approved changes", "Site verification"], ["As-built models", "As-built drawings"], "As-built geometry and installed product data", ["As-built verification"], "19650-2 §5.8"),
  u("IU-23", "Asset data (COBie) delivery", ["Construct", "Operate"], "Handover & assets", "Deliver structured asset data per the client's AIR at each stage.", "Ready-to-load CAFM data.", ["Models", "Product data", "Client AIR / COBie standard"], ["COBie workbook", "Asset register"], "Asset attributes per AIR", ["COBie", "Data validation"], "19650-3 §5"),
  u("IU-24", "Asset tagging & labelling", ["Construct", "Operate"], "Handover & assets", "Assign unique asset tags per the client's codification and label assets on site.", "Every asset traceable between field and data.", ["Asset register", "Tag format"], ["Tagged asset register", "Labels / barcodes / QR"], "Tag, location and system codes", ["Asset codification"]),
  u("IU-25", "O&M and handover documentation", ["Construct", "Operate"], "Handover & assets", "Manuals, warranties, certificates and test records linked to assets.", "Complete, searchable handover.", ["Submittals", "Asset register"], ["O&M manuals", "Warranty register"], "Document links per asset", ["Document control"], "19650-2 §5.7"),
  u("IU-26", "Commissioning", ["Construct", "Operate"], "Handover & assets", "Plan and record testing & commissioning against systems in the model.", "Systems proven before handover.", ["Systems model", "Commissioning plan"], ["Test records", "Commissioning certificates"], "System membership per asset", ["Commissioning management"]),
  u("IU-27", "Space management", ["Operate"], "Operations", "Manage occupancy, allocation and area using the AIM.", "Better space utilisation.", ["AIM spaces"], ["Space reports"], "Spaces, zones, areas, occupancy", ["CAFM / IWMS"]),
  u("IU-28", "Planned maintenance", ["Operate"], "Operations", "Drive planned and reactive maintenance from AIM asset data.", "Lower lifecycle cost.", ["Asset register", "Maintenance jobs"], ["Maintenance schedules"], "Maintainable assets with jobs and spares", ["CAFM / CMMS"], "19650-3 §5"),
  u("IU-29", "Building systems analysis & BMS integration", ["Operate"], "Operations", "Link AIM with BMS / IoT for performance monitoring.", "Optimised operation; fault detection.", ["AIM", "BMS points"], ["Integrated dashboards"], "Point and system identifiers", ["BMS / IoT integration"]),
  u("IU-30", "Emergency management", ["Operate"], "Operations", "Use the AIM for evacuation planning, shut-off locations and emergency response.", "Faster, safer response.", ["AIM", "Fire strategy"], ["Emergency plans"], "Fire / life safety assets and zones", ["Emergency planning"]),
  u("IU-31", "Digital twin", ["Operate"], "Operations", "Live AIM connected to operational data and analytics.", "Data-driven decisions over the asset lifecycle.", ["AIM", "Live data"], ["Digital twin platform"], "As per AIR plus live data identifiers", ["Data integration", "Analytics"]),
  u("IU-32", "Disposal & renovation planning", ["Operate"], "Operations", "Use the AIM to plan refurbishment, demolition and material recovery.", "Circular-economy evidence.", ["AIM", "Material data"], ["Refurbishment options", "Material passport"], "Material composition and condition", ["Lifecycle assessment"]),
];

export const USE_CATEGORIES = [...new Set(INFO_USES.map((x) => x.category))];
export const useByCode = (code: string) => INFO_USES.find((x) => x.code === code);

export type UsePriority = "High" | "Medium" | "Low";
export interface ProjectInfoUse { code: string; priority: UsePriority; taskTeams: string[]; notes: string }
