import type { Hub } from "./types";

// Façade BIM coordination hub: the façade package as a specialist appointment under ISO 19650,
// from design intent through fabrication models to the asset register. Content is paraphrased
// practical guidance, consistent with the FAC template (templatesRequirements.ts) and the FAC
// document guide (docGuides/plans.ts). Always follow the project's own EIR, BEP and FAC addendum.

export const facadeHub: Hub = {
  id: "facade",
  tone: "amber",
  eyebrow: "SPECIALIST · FAÇADES",
  title: "Façade BIM coordination guide",
  intro:
    "The façade is one of the most complex packages on a building. It is designed in two halves, by the architect and by a specialist contractor, it is fabricated off site to tight tolerances, and it touches structure, services, fire safety and maintenance access. This guide sets the façade package in ISO 19650 terms, shows the level of information need at each stage, the key interfaces, how to model and mark panels, how to run façade coordination, how to record mock-ups and tests, and what the owner needs at handover to maintain and replace units.",
  sections: [
    // ==================================================================== PACKAGE
    {
      id: "package",
      label: "The façade package",
      tabs: [
        {
          id: "overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "A specialist package inside the delivery team",
              body: [
                "In ISO 19650 terms the façade contractor is usually an appointed party working under the main contractor, who is the lead appointed party. It forms its own task team, with its own designers, fabricators and installers, and it receives the façade information requirements from the lead appointed party.",
                "What makes the façade different is the split of design responsibility. The architect sets the design intent: appearance, performance targets, setting out and the principles of each system. The specialist then develops the detailed design that can actually be fabricated: frames, brackets, gaskets, glass make-ups and fixings. Both halves must be in the information model, and the hand-off between them must be clear.",
                "Because units are made off site, mistakes in the model become mistakes in aluminium and glass. A bracket clash found in the factory costs days; one found on the crane costs weeks. Good information management for façades is mostly about finding problems in the model before the order is placed.",
              ],
            },
            {
              kind: "cards",
              title: "Why façades need their own approach",
              cards: [
                { title: "Split design responsibility", body: "Design intent and fabrication design are produced by different parties, often in different software. The boundary must be written down and reflected in the responsibility matrix.", tone: "amber" },
                { title: "Long lead times", body: "Glass, extrusions and brackets are ordered months ahead. The information needed to place orders must be frozen early, so late design changes are expensive.", tone: "red" },
                { title: "Tight tolerances", body: "Units are made to millimetres but fixed to a frame built to centimetres. The model must carry the tolerances and movement allowances, not just nominal geometry.", tone: "blue" },
                { title: "Many interfaces", body: "Slab edges, embeds, firestopping, MEP penetrations, roof edges, soffits and the building maintenance unit all meet the façade.", tone: "purple" },
                { title: "Performance evidence", body: "Thermal, air, water, acoustic, fire and structural performance must be proven by calculation, test or mock-up and linked to the façade types.", tone: "teal" },
                { title: "Long service life", body: "The owner will clean, inspect and replace units for decades. Every unit needs an identity that works in the asset register and on site.", tone: "green" },
              ],
            },
            {
              kind: "table",
              title: "Typical façade systems in a package",
              columns: ["System", "How it is built", "Main information challenge"],
              rows: [
                ["Unitised curtain wall", "Factory-assembled, storey-high units hung from slab-edge brackets", "Unit marks, bracket coordination and installation sequence"],
                ["Stick curtain wall", "Mullions and transoms assembled on site, then glazed", "Setting out, site tolerances and many small components"],
                ["Rainscreen cladding", "Panels on a subframe over insulation and a backing wall", "Subframe layout, cavity barriers and panel cutting lists"],
                ["Precast or GRC panels", "Heavy panels cast off site and fixed to the frame", "Fixings, lifting points, weights and crane planning"],
                ["Glazed doors and windows", "Framed openings within walls or curtain wall", "Ironmongery, door schedules and access control interfaces"],
                ["Brise soleil and fins", "Projecting shading elements fixed back to the façade or frame", "Fixing loads, cleaning access and thermal bridging"],
              ],
            },
            {
              kind: "callout",
              title: "Use the façade addendum",
              body: "The platform's Façade Information Requirements template (FAC) is an addendum to the EIR for the façade package. It covers scope, panel identification, interfaces, performance information and fabrication-to-handover exchanges. This hub explains how to fill and use it in practice.",
              tone: "info",
            },
          ],
        },
        {
          id: "responsibility",
          label: "Design responsibility",
          blocks: [
            {
              kind: "text",
              title: "Design intent versus fabrication design",
              body: [
                "Most façade disputes start with a vague boundary. If the architect's model shows mullions at a nominal size and the specialist later changes them, who updates the architectural model, and who checks that sightlines still work? The answer must be written into the appointment, the BEP and the responsibility matrix before the specialist starts.",
                "A common approach is that the architect's model stays the design intent model and is not updated with fabrication detail. The specialist's coordination model, exported from its fabrication tools, then becomes the reference for façade geometry from detailed design onwards. The architect reviews it against the intent, rather than remodelling it.",
              ],
            },
            {
              kind: "table",
              title: "Who is responsible for what",
              columns: ["Information", "Architect (design intent)", "Façade specialist (fabrication design)", "Main contractor"],
              rows: [
                ["Setting out and grid lines", "Defines façade zones, setting-out lines and module", "Works to the setting out and reports conflicts", "Confirms setting out on site with survey"],
                ["Appearance and finishes", "Sets colours, glass appearance and sightlines", "Proposes products that meet the intent", "Manages sample approvals"],
                ["Performance targets", "States U-values, air, water, acoustic and fire targets", "Proves compliance by calculation and test", "Tracks evidence before orders are placed"],
                ["Frame and profile geometry", "Indicative profiles only", "Detailed profiles, gaskets, drainage paths", "Coordinates with other packages"],
                ["Brackets and fixings", "Indicative zone at slab edge", "Bracket design, loads and positions", "Coordinates embeds with the structural engineer and frame contractor"],
                ["Movement joints and tolerances", "States movement principles", "Designs joints for building and thermal movement", "Checks frame tolerances on site"],
                ["Fire separation at slab edge", "Sets the compartment lines with the fire engineer", "Designs and models cavity barriers and spandrels", "Inspects firestopping before closing up"],
                ["Unit marks and asset data", "Agrees type marks with the client", "Assigns instance marks and records as-installed data", "Merges into the asset information for handover"],
              ],
            },
            {
              kind: "cards",
              title: "The parties around the façade",
              cards: [
                { title: "Appointing party", body: "Sets the asset information requirements, including how façade units are identified, maintained and replaced.", tone: "green" },
                { title: "Lead appointed party", body: "Usually the main contractor. Issues the façade information requirements, runs federated coordination and accepts the specialist's information.", tone: "blue" },
                { title: "Architect", body: "Owns the design intent and reviews the specialist's model against it.", tone: "purple" },
                { title: "Façade specialist task team", body: "Produces detailed design, fabrication models, coordination exports, test records and as-installed data.", tone: "amber" },
                { title: "Façade consultant", body: "Often appointed by the client or architect to write the performance specification and review the specialist's design and tests.", tone: "teal" },
                { title: "Structural and fire engineers", body: "Review bracket loads, embeds, slab edge deflection and fire separation details.", tone: "red" },
              ],
            },
            {
              kind: "callout",
              title: "Write the boundary into the responsibility matrix",
              body: "For each façade element, the matrix should say who models it at each stage, who checks it and which model is the reference. When the specialist joins, update the matrix rather than relying on emails.",
              tone: "warn",
            },
          ],
        },
        {
          id: "loin",
          label: "LOIN by stage",
          blocks: [
            {
              kind: "text",
              title: "Level of information need for façades",
              body: [
                "The level of information need should grow with the decisions being made. Early on, the façade is a set of zones with performance targets. By fabrication, each unit is defined to the millimetre with its components, finishes and fixings. At handover, the useful information is the identity, product data and maintenance needs of each installed unit.",
                "Set LOIN by purpose, not by habit. Fabrication geometry is not needed in the federated model for clash detection; a simplified envelope with accurate brackets and edges is usually better. Keep detail where the decision needs it.",
              ],
            },
            {
              kind: "table",
              title: "Façade LOIN by stage",
              columns: ["Stage", "Purpose", "Geometry", "Alphanumeric information", "Documentation"],
              rows: [
                ["Concept", "Massing, appearance and energy strategy", "Façade zones as simple surfaces with openings and solid-to-glazed ratio", "System type, target U-value and g-value", "Façade strategy note and precedent images"],
                ["Spatial coordination", "Setting out and interfaces with structure", "Module grid, typical bays, slab edge zone and indicative brackets", "Performance targets per system, fire strategy lines", "Outline specification and typical sections"],
                ["Technical design (intent)", "Tender for the specialist package", "Each system modelled with nominal profiles, openings and typical panels", "Type marks, finishes, glass make-up intent, acoustic and fire ratings", "Performance specification, elevations and key details"],
                ["Detailed design (specialist)", "Coordinate and approve before fabrication", "Every unit with true outer envelope, brackets, embeds and cavity barriers", "Instance marks, weights, glass build-ups, profile systems", "Calculations, test plan, shop drawings"],
                ["Fabrication", "Manufacture and installation planning", "Full fabrication model in the specialist's tool; coordination export to the CDE", "Cutting lists, batch and delivery numbers, installation sequence", "Fabrication drawings, mock-up and test reports"],
                ["As installed and handover", "Operation, maintenance and replacement", "Unit envelopes at installed position; fabrication detail stays with the specialist", "Manufacturer, product, glass type, warranty dates, cleaning regime", "O&M manual, warranties, test certificates, replacement method"],
              ],
            },
            {
              kind: "list",
              title: "Attributes that façade types usually carry",
              items: [
                "Type mark and system name",
                "Manufacturer and profile system",
                "Glass make-up: panes, thicknesses, coatings, interlayers and cavity gas",
                "Thermal transmittance and solar factor",
                "Air permeability and water tightness classes",
                "Acoustic rating",
                "Reaction to fire and fire resistance where relevant",
                "Finish and colour reference",
                "Design wind load and unit weight",
                "Expected life and warranty periods for frame, glass, finish and sealants",
              ],
            },
            {
              kind: "callout",
              title: "Do not federate fabrication detail",
              body: "Fabrication models with every gasket and screw make federated models slow and clash reports noisy. Ask for a coordination export at an agreed level of detail, and keep native fabrication models with the specialist.",
              tone: "ok",
            },
          ],
        },
      ],
    },
    // ==================================================================== INTERFACES AND MODELLING
    {
      id: "modelling",
      label: "Interfaces & modelling",
      tabs: [
        {
          id: "interfaces",
          label: "Interfaces",
          blocks: [
            {
              kind: "text",
              title: "Where the façade meets everything else",
              body: [
                "Interfaces are where façade information most often fails. Each one involves two task teams, and each assumes the other will model or check the junction. List every interface in the façade addendum with the other party, the information needed and the milestone by which it must be agreed.",
              ],
            },
            {
              kind: "table",
              title: "Façade interfaces",
              columns: ["Interface", "With", "Information needed", "Milestone"],
              rows: [
                ["Brackets and slab edge", "Structural engineer and frame contractor", "Bracket positions and loads, slab edge profile, edge tolerance, deflection limits", "Before bracket design is frozen"],
                ["Cast-in embeds and channels", "Structural engineer and concrete contractor", "Embed type, position, setting-out tolerance and pour sequence", "Before the slab pour drawings are issued"],
                ["Steel frame connections", "Steel fabricator", "Cleat positions, fixing holes and erection tolerances", "Before steel fabrication"],
                ["Fire separation and firestopping", "Architect and fire engineer", "Compartment lines, cavity barriers, spandrel and slab edge firestop details", "Detailed design"],
                ["MEP penetrations and louvres", "Building services engineer", "Louvre sizes, free area, duct connections, sleeve positions", "Before unit fabrication"],
                ["Façade lighting and power", "Electrical engineer", "Fitting positions, cable routes, access for maintenance", "Detailed design"],
                ["Building maintenance unit", "BMU supplier", "Restraint points, cradle reach, tie-back positions and loads on mullions", "Before mullion design is frozen"],
                ["Roof edge, parapet and soffit", "Architect and roofing contractor", "Membrane upstands, copings, drainage and fall arrest", "Detailed design"],
                ["Internal finishes", "Fit-out contractor", "Head, sill and jamb details, blinds and perimeter heating zones", "Before internal finishes design"],
                ["Groundworks and plinth", "Groundworks contractor", "Damp-proofing, threshold levels and drainage at base", "Detailed design"],
              ],
            },
            {
              kind: "cards",
              title: "Interfaces that cause the most rework",
              cards: [
                { title: "Embeds poured in the wrong place", body: "Once concrete is poured, a misplaced channel means drilled fixings, extra calculations and delays. Coordinate embeds before the pour drawings are issued.", tone: "red" },
                { title: "Slab edge firestopping missing", body: "The gap between slab and façade is a fire path. If nobody models it, it is often left for site to solve, and then it is hard to inspect.", tone: "amber" },
                { title: "BMU restraints added late", body: "Restraint points put loads on mullions. If the BMU supplier is appointed after the mullions are designed, profiles may need to change.", tone: "purple" },
                { title: "Louvres sized by services, drawn by architect", body: "Louvre sizes change as services design develops. Without a named owner and a milestone, the façade is fabricated with the wrong openings.", tone: "blue" },
              ],
            },
            {
              kind: "callout",
              title: "One interface, one owner",
              body: "For every interface name the party that models the junction and the party that checks it. Record the agreement in the interface register and close it only when both models show the same solution.",
              tone: "warn",
            },
          ],
        },
        {
          id: "modelling-approach",
          label: "Modelling approach",
          blocks: [
            {
              kind: "text",
              title: "Modelling façades so the model is useful",
              body: [
                "The design intent model and the specialist's model have different jobs. The intent model needs to show appearance, setting out and performance zones, and to be easy to change. The specialist's model needs to describe every unit for fabrication. A coordination model sits between them: true outer envelope, true brackets and edges, simplified internals.",
                "Whichever tool is used, the same principles apply: model systems as systems, not as loose walls and windows; give each unit a mark; keep types and instances separate; and carry tolerances and movement joints as real gaps, not hidden overlaps.",
              ],
            },
            {
              kind: "cards",
              title: "Modelling curtain wall systems",
              cards: [
                { title: "Use system objects", body: "Model curtain walls with the authoring tool's curtain wall or system object so grids, mullions and panels stay linked and can be scheduled.", tone: "blue" },
                { title: "Panels as types", body: "Each panel or unit type is one type with its own mark, glass make-up and attributes. Instances inherit type data and carry their own instance mark.", tone: "teal" },
                { title: "Assemblies for units", body: "A unitised unit is an assembly of frame, glass, spandrel and brackets. Model it as one assembly so it can be counted, marked and sequenced as one item.", tone: "purple" },
                { title: "Brackets as separate elements", body: "Brackets and embeds belong to different packages. Model them as separate elements so they can be clash tested and scheduled for the right contractor.", tone: "amber" },
                { title: "Rainscreen on a subframe", body: "Model the subframe, insulation and cavity barriers as well as the panels, because most coordination problems sit behind the panel face.", tone: "green" },
                { title: "Classify everything", body: "Apply the agreed classification to systems, types and products so façade elements can be filtered, checked and exported to the asset register.", tone: "red" },
              ],
            },
            {
              kind: "table",
              title: "Families, assemblies and fabrication models",
              columns: ["Model content", "Who produces it", "Typical tool", "Shared in the CDE as"],
              rows: [
                ["Design intent curtain wall and cladding", "Architect", "BIM authoring tool", "Native model and IFC at each milestone"],
                ["Façade unit types and families", "Architect at intent stage, specialist from detailed design", "BIM authoring tool or specialist library", "Part of the coordination model"],
                ["Unit assemblies with frame, glass and brackets", "Façade specialist", "Fabrication or mechanical design tool", "Coordination IFC with simplified internals"],
                ["Fabrication models and machine data", "Façade specialist", "Fabrication tool and CNC export", "Kept native by the specialist; shared on request"],
                ["Shop drawings and cutting lists", "Façade specialist", "Fabrication tool", "PDF drawings and schedules for review"],
                ["Installation sequence", "Façade specialist with main contractor", "Scheduling tool linked to unit marks", "Programme and sequence model or 4D link"],
              ],
            },
            {
              kind: "callout",
              title: "Agree the coordination export early",
              body: "Fabrication tools export IFC in different ways. Test one bay at mobilisation: check that unit marks, classification and brackets survive the export and open correctly in the federated model.",
              tone: "info",
            },
          ],
        },
        {
          id: "naming",
          label: "Panel identification",
          blocks: [
            {
              kind: "text",
              title: "One mark from model to site to asset register",
              body: [
                "Every façade unit needs two identities: a type mark that says what it is and a unique instance mark that says which one it is. The same instance mark must appear in the model, on fabrication drawings, on the label of the delivered unit, in the installation records and in the asset register.",
                "A good instance mark can be read by a person on site. Many projects build it from the elevation, the level and a sequence number along the elevation. Agree the format with the facility manager, because they will use it for decades.",
              ],
            },
            {
              kind: "table",
              title: "Example marking scheme",
              columns: ["Part", "Meaning", "Example", "Rule"],
              rows: [
                ["Type mark", "System and unit type", "CW-01", "One per distinct unit type; never reused for a different build-up"],
                ["Elevation", "Which face of the building", "N", "Agreed letters for each elevation, including returns and atria"],
                ["Level", "Floor the unit is hung from", "L03", "Same level codes as the project information standard"],
                ["Sequence", "Position along the elevation", "014", "Numbered in one direction from an agreed start grid"],
                ["Instance mark", "Unique unit identity", "N-L03-014", "Unique across the building and stable once fabrication starts"],
                ["Replacement suffix", "A unit replaced in operation", "N-L03-014-R1", "Added by the FM team so history is kept"],
              ],
            },
            {
              kind: "steps",
              title: "Setting up unit marks",
              steps: [
                { title: "Agree the format", body: "Agree the type and instance mark format with the architect, specialist and facility manager, and write it into the façade addendum." },
                { title: "Set the parameters", body: "Create shared parameters or properties for type mark and instance mark, and map them to the asset identifier used in COBie or the asset register." },
                { title: "Test one elevation", body: "Mark one elevation in the model, export it and check the marks survive in the coordination IFC and the schedules." },
                { title: "Freeze before fabrication", body: "Lock instance marks when fabrication starts. Any change after that must go through change control." },
                { title: "Label the units", body: "The factory prints the instance mark, often with a barcode or QR code, on each unit and on its delivery note." },
                { title: "Record installation", body: "The installer records each mark as installed, with date and any deviation, and the record is merged into the asset data." },
              ],
            },
            {
              kind: "checklist",
              title: "Panel identification checks",
              items: [
                "Every unit has a type mark and a unique instance mark",
                "No instance mark is duplicated across the building",
                "Marks in the model match the fabrication drawings",
                "Marks survive the IFC export and appear in the federated model",
                "Marks map to the asset identifier field in the asset register",
                "Physical labels on site match the model marks on a sample check",
              ],
            },
          ],
        },
        {
          id: "tolerances",
          label: "Tolerances & movement",
          blocks: [
            {
              kind: "text",
              title: "Modelling the gaps",
              body: [
                "A façade has to accommodate the difference between a frame built to site tolerances and units made to factory tolerances, as well as building movement, thermal expansion and wind sway. If the model shows everything touching at nominal dimensions, the clash test will pass and the site will fail.",
                "Carry tolerances and movement allowances as information in the model: as real gaps at joints, as adjustment ranges on brackets and as clearance zones in clash tests.",
              ],
            },
            {
              kind: "table",
              title: "Tolerances and movement to capture",
              columns: ["Item", "What to record", "Where it lives in the information model"],
              rows: [
                ["Slab edge position", "Allowed deviation from setting-out line, in plan and level", "Structural model attribute and the bracket adjustment range"],
                ["Bracket adjustment", "Range of adjustment in three directions", "Bracket type attributes; used as clash clearance"],
                ["Slab deflection", "Live load and long-term deflection at the edge", "Structural calculation linked to the interface register"],
                ["Inter-storey drift", "Lateral movement between floors under wind or seismic load", "Façade design basis; drives stack joint design"],
                ["Thermal movement", "Expansion and contraction of frames and panels", "Joint widths modelled as real gaps"],
                ["Stack and movement joints", "Joint width, sealant or gasket type, and movement capacity", "Joint elements or type attributes, with positions in the model"],
                ["Installation tolerance", "Allowed deviation of installed units", "Inspection and survey records against the model"],
              ],
            },
            {
              kind: "callout",
              title: "Survey the frame before fabrication",
              body: "Survey slab edges and embeds as soon as the frame is built, compare the survey with the model and feed deviations to the specialist before units are made. Scan data or a total station survey linked to the CDE works well.",
              tone: "ok",
            },
          ],
        },
      ],
    },
    // ==================================================================== COORDINATION
    {
      id: "coordination",
      label: "Coordination & testing",
      tabs: [
        {
          id: "cycle",
          label: "Coordination cycle",
          blocks: [
            {
              kind: "steps",
              title: "The façade coordination cycle",
              steps: [
                { title: "Share the coordination model", body: "The specialist shares its coordination export in the CDE in the shared state, with the agreed revision and status, at the frequency set in the BEP." },
                { title: "Check against the intent", body: "The architect reviews setting out, sightlines, finishes and openings against the design intent and records comments." },
                { title: "Federate and run façade clash tests", body: "The lead appointed party's coordinator federates the model with structure, MEP and architecture and runs the façade-specific clash tests." },
                { title: "Review issues together", body: "Clashes and comments are reviewed in a coordination meeting with the specialist, structural, services and fire representatives. Each issue gets an owner and a due date, usually tracked in BCF." },
                { title: "Update the models", body: "Each task team fixes its own model. The interface register is updated when a junction is agreed." },
                { title: "Sign off for fabrication", body: "When a zone has no open issues, the lead appointed party accepts the coordination model and the specialist releases that zone to fabrication." },
                { title: "Survey and verify", body: "As the frame is built, surveys are compared with the model, and deviations go back into the next cycle before units are made." },
              ],
            },
            {
              kind: "table",
              title: "Coordination rhythm by stage",
              columns: ["Stage", "Frequency", "Focus"],
              rows: [
                ["Technical design", "Every two to four weeks", "Façade zones, setting out, performance and fire lines"],
                ["Detailed design", "Weekly or fortnightly", "Brackets, embeds, penetrations, BMU and firestopping"],
                ["Pre-fabrication sign-off", "Per zone or elevation", "Zero open issues before release to the factory"],
                ["Installation", "Weekly with site survey", "Deviations, installation records and as-installed updates"],
              ],
            },
            {
              kind: "callout",
              title: "Release by zone, not all at once",
              body: "Façades are fabricated and installed in sequence. Sign off coordination elevation by elevation, or zone by zone, so that the factory can start while later zones are still being coordinated.",
              tone: "info",
            },
          ],
        },
        {
          id: "clash-tests",
          label: "Façade clash tests",
          blocks: [
            {
              kind: "text",
              title: "Tests that find façade problems",
              body: [
                "Generic all-against-all clash tests produce thousands of false hits around the façade, because units sit tight to slabs by design. Set up specific tests with clearances that reflect tolerances and access needs, and name them so the results can be tracked from cycle to cycle.",
              ],
            },
            {
              kind: "table",
              title: "Typical façade clash tests",
              columns: ["Test", "Selection A", "Selection B", "Rule or clearance", "What it finds"],
              rows: [
                ["Brackets to slab edge", "Façade brackets", "Structural slabs and edge beams", "Hard clash plus bracket adjustment range", "Brackets that do not land on the slab or hit the edge beam"],
                ["Brackets to embeds", "Façade brackets", "Cast-in channels and plates", "Bracket must sit within the embed length", "Brackets with no fixing or fixings off the channel"],
                ["Brackets to reinforcement zone", "Drilled fixings", "Rebar and post-tensioning zones", "No drilling within the tendon zone", "Fixings that would cut tendons or main bars"],
                ["Units to structure", "Façade units", "Columns, beams and bracing", "Clearance equal to the slab edge tolerance", "Units that will not fit when the frame is out of tolerance"],
                ["Firestopping continuity", "Slab edge firestop and cavity barriers", "Compartment slabs and walls", "Barrier present at every compartment line", "Gaps in fire separation at the façade"],
                ["MEP penetrations", "Louvres, sleeves and ducts", "Façade units and mullions", "Opening and sleeve must match the services element", "Louvres in the wrong unit or ducts hitting mullions"],
                ["BMU reach and restraints", "BMU cradle envelope and restraint points", "Façade units and projecting fins", "Clearance for cradle travel", "Areas the cradle cannot reach and fins in its path"],
                ["Internal interfaces", "Façade units", "Ceilings, partitions and perimeter heating", "Clearance for installation and blinds", "Partitions landing on mullions or ceilings hitting transoms"],
              ],
            },
            {
              kind: "cards",
              title: "Making clash results useful",
              cards: [
                { title: "Group by unit mark", body: "Group clashes by unit instance mark so the specialist can see which units are affected and plan the fix in the factory sequence.", tone: "blue" },
                { title: "Use tolerances as clearances", body: "Set clearance values from the tolerance table, not zero. A unit that touches the frame in the model may not fit on site.", tone: "amber" },
                { title: "Track with BCF", body: "Raise issues as BCF topics with viewpoints so they can be opened in each team's own tool and closed with evidence.", tone: "purple" },
                { title: "Approve by exception", body: "Some contact is intended, for example brackets bearing on slabs. Approve these once with a reason so they do not reappear every cycle.", tone: "green" },
              ],
            },
          ],
        },
        {
          id: "mockups",
          label: "Mock-ups & testing",
          blocks: [
            {
              kind: "text",
              title: "Proving performance before production",
              body: [
                "Façades are usually proven by a visual mock-up, which confirms appearance and workmanship, and a performance mock-up, which is tested for air, water and structural behaviour. Results decide whether the design can go into production, so the records must be complete, linked to the right types and easy to find.",
                "Treat each mock-up and test as an information deliverable. Plan it in the delivery plan, record it as a container in the CDE and link the evidence to the façade types it proves.",
              ],
            },
            {
              kind: "table",
              title: "Mock-up and test records",
              columns: ["Record", "What it contains", "Linked to", "When"],
              rows: [
                ["Visual mock-up approval", "Photos, approved samples, comments and the signed approval", "Façade types shown on the mock-up", "Before production of finishes"],
                ["Performance test report", "Air permeability, water tightness and wind resistance results with test conditions", "Each façade type tested", "Before production release"],
                ["Thermal calculations", "U-values, thermal bridging and condensation risk", "Façade types and junction details", "Detailed design"],
                ["Acoustic report", "Sound insulation results or calculations", "Façade types facing noise sources", "Detailed design"],
                ["Fire classification", "Reaction to fire classification and cavity barrier test evidence", "Materials and barrier types", "Before procurement"],
                ["Structural calculations", "Wind load, glass and bracket calculations", "Unit types and bracket types", "Detailed design"],
                ["Site water tests", "Hose or spray test results on installed units", "Instance marks of tested units", "During installation"],
                ["Inspection records", "Firestopping, bracket fixing and sealant inspections with photos", "Instance marks and zones", "Before closing up each zone"],
              ],
            },
            {
              kind: "checklist",
              title: "Test record checklist",
              items: [
                "Each test is in the delivery plan with an owner and a date",
                "The test specimen matches the type marks it is meant to prove",
                "Reports name the test standard, conditions and pass criteria",
                "Failed tests and the changes made are recorded, not just the final pass",
                "Evidence is linked to the façade type in the model or asset data",
                "Records are shared and accepted in the CDE before production release",
                "Site inspection photos are tagged with instance marks",
              ],
            },
            {
              kind: "callout",
              title: "Record the failures too",
              body: "If a mock-up fails and the design is changed, keep the failed report and the change record. They explain why the installed design differs from the tender design and help future replacement work.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ==================================================================== HANDOVER
    {
      id: "handover",
      label: "Fabrication & handover",
      tabs: [
        {
          id: "fabrication",
          label: "Digital fabrication",
          blocks: [
            {
              kind: "text",
              title: "From model to factory and back",
              body: [
                "Many façade specialists drive their factories directly from fabrication models: cutting lists, machining data and assembly drawings all come from the same source. This is efficient, but it means the fabrication model is the true record of what was made, and the project needs a controlled way to receive the information that matters from it.",
                "The usual approach is that native fabrication models stay with the specialist, who shares coordination exports and schedules in the CDE. At handover the specialist issues as-installed information keyed to unit marks, and keeps the fabrication data available for replacement units, as agreed in the appointment.",
              ],
            },
            {
              kind: "table",
              title: "Fabrication-to-handover exchanges",
              columns: ["Exchange", "Content", "Format", "Status in the CDE"],
              rows: [
                ["Coordination model", "Unit envelopes, brackets, embeds, barriers and marks", "IFC", "Shared for coordination; accepted per zone"],
                ["Shop drawings", "Unit assemblies, details and fixings", "PDF", "Shared for review, then published for construction"],
                ["Unit schedule", "Instance marks, type marks, weights, glass, batch and delivery numbers", "Spreadsheet or CSV", "Shared at each release; final as-installed at handover"],
                ["Installation records", "Mark, date installed, installer, deviations and inspection result", "Spreadsheet or app export", "Updated through installation"],
                ["As-installed model", "Unit envelopes at installed position with asset data", "IFC and native, as agreed", "Submitted for AIM authorisation at handover"],
                ["Replacement data", "Information needed to make a replacement unit", "Specialist's format, with an index", "Held as agreed in the appointment, with access rules"],
              ],
            },
            {
              kind: "callout",
              title: "Agree rights to fabrication data",
              body: "If the owner may need replacement units after the specialist has gone, the appointment should say what fabrication information is handed over or held in escrow, and who may use it. Settle this before the specialist is appointed.",
              tone: "warn",
            },
          ],
        },
        {
          id: "asset-information",
          label: "Asset information",
          blocks: [
            {
              kind: "text",
              title: "What the owner needs to look after the façade",
              body: [
                "The facility manager does not need fabrication detail. They need to know which unit is which, what it is made of, who supplied it, how long it is guaranteed, how it is cleaned and inspected, and how to replace a broken pane or a whole unit.",
                "Whether every unit is a separate asset or only types are recorded is a decision for the asset information requirements. Many owners record glazed units individually because glass breakage is the most common façade repair, and record rainscreen panels by zone.",
              ],
            },
            {
              kind: "table",
              title: "Façade asset information",
              columns: ["Information", "Example", "Typical COBie or register field", "Provided by"],
              rows: [
                ["Unit identity", "N-L03-014", "Component name or asset identifier, tag number", "Façade specialist"],
                ["Unit type", "CW-01 unitised curtain wall", "Type name and category", "Architect, completed by specialist"],
                ["Location", "North elevation, level 3", "Space or zone, plus elevation attribute", "Specialist from the model"],
                ["Glass type", "Double glazed, laminated inner pane, solar control coating", "Type attributes", "Specialist from approved submittals"],
                ["Manufacturer and supplier", "Glass processor and system supplier", "Manufacturer contact, model reference", "Specialist"],
                ["Warranties", "Frame, glass, finish and sealant warranties with start dates", "Warranty fields and documents", "Specialist and main contractor"],
                ["Cleaning regime", "Frequency and method for external and internal faces", "Maintenance job", "Specialist with FM team"],
                ["Access for cleaning and repair", "BMU, abseil or MEWP zones and restraint points", "Zone and document", "BMU supplier and specialist"],
                ["Replacement method", "Steps, equipment and lead time to replace a unit or pane", "Document linked to the type", "Specialist"],
                ["Spares", "Attic stock of glass, panels and gaskets", "Spare", "Specialist"],
              ],
            },
            {
              kind: "checklist",
              title: "Façade handover checklist",
              items: [
                "As-installed unit schedule with every instance mark",
                "Asset data for façade types and units loaded into the COBie workbook or register",
                "Glass types and build-ups recorded for each type",
                "Warranties with start dates and the warranty provider",
                "Cleaning and inspection jobs with frequencies",
                "BMU and access information, including restraint points and load test certificates",
                "Replacement method statement for panes and units",
                "Test certificates and inspection records linked to types and marks",
                "Spare units and attic stock recorded with their location",
                "Labels on site checked against the asset data on a sample",
              ],
            },
          ],
        },
        {
          id: "mistakes",
          label: "Common mistakes",
          blocks: [
            {
              kind: "table",
              title: "Common façade information mistakes",
              columns: ["Mistake", "Result", "How to avoid it"],
              rows: [
                ["Fabrication marks differ from model marks", "The asset register cannot be matched to the building", "Set one marking rule in the façade addendum and check it at every exchange"],
                ["Design responsibility left vague", "Nobody updates the model after the specialist changes profiles", "Write the boundary into the appointment and the responsibility matrix"],
                ["Federating full fabrication models", "Slow models and noisy clash results", "Ask for a coordination export at an agreed level of detail"],
                ["Clash tests with zero clearance", "Units that pass in the model but do not fit on site", "Use the tolerance table to set clearances"],
                ["Embeds coordinated after the pour", "Drilled fixings, extra calculations and delay", "Make embeds a milestone before slab pour drawings"],
                ["Slab edge firestopping not modelled", "Gaps in fire separation found late or never", "List it as an interface and run a continuity check"],
                ["BMU supplier appointed late", "Mullion redesign for restraint loads", "Fix BMU requirements before mullion design is frozen"],
                ["Performance evidence requested at handover", "Production released without proof", "Set a milestone for each piece of evidence"],
                ["No replacement information", "The owner cannot replace a broken unit after the specialist has gone", "Require a replacement method and agree access to fabrication data"],
              ],
            },
            {
              kind: "callout",
              title: "Most façade problems are information problems",
              body: "Late marks, unclear responsibility and missing interfaces cause more rework than poor workmanship. Spend time at mobilisation agreeing marks, exports, interfaces and tests, and the rest of the package runs much more smoothly.",
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
                { q: "Is the façade contractor an appointed party under ISO 19650?", a: "Usually yes. It is appointed by the main contractor, who acts as lead appointed party, and forms its own task team. It receives information requirements and produces its own delivery plan for the façade package." },
                { q: "Who owns the façade geometry after the specialist is appointed?", a: "It depends on the appointment, but a common approach is that the specialist's coordination model becomes the reference for façade geometry from detailed design, while the architect's model remains the design intent. Write the rule into the BEP and responsibility matrix." },
                { q: "Should the specialist hand over its native fabrication models?", a: "Usually not. Ask for coordination exports during delivery and as-installed information at handover. Agree separately what fabrication data is kept for replacement units and who can use it." },
                { q: "How detailed should the façade be in the federated model?", a: "Detailed enough for the decisions being made: true outer envelope, brackets, embeds, barriers and openings. Profile internals, gaskets and screws are rarely needed for coordination." },
                { q: "Should every façade unit be an asset in COBie?", a: "The asset information requirements decide. Many owners record glazed units individually because glass replacement is common, and record opaque cladding by type or zone." },
                { q: "How do we handle tolerances in clash detection?", a: "Use clearance values based on the slab edge tolerance and bracket adjustment range, and model movement joints as real gaps. Approve intended contacts once so they do not reappear." },
                { q: "When should embeds be coordinated?", a: "Before the slab pour drawings are issued. This often means the façade specialist must be appointed, or at least bracket design advanced, earlier than the rest of the package." },
                { q: "Where do mock-up and test reports go?", a: "Into the CDE as information containers, planned in the delivery plan and linked to the façade types they prove. Keep failed reports and the change records as well as the final pass." },
                { q: "Who provides cleaning and maintenance information?", a: "The façade specialist, with the BMU supplier for access and the FM team for the regime they will actually use. It should be planned well before handover." },
                { q: "Which template does the platform offer for façades?", a: "The Façade Information Requirements (FAC) template, an addendum to the EIR covering scope, identification, interfaces, performance and handover. You can also draft one with the AI document generator." },
              ],
            },
            {
              kind: "cards",
              title: "Quick answers by role",
              cards: [
                { title: "Architect", body: "Set the design intent clearly, agree type marks with the client and review the specialist's model against the intent rather than remodelling it.", tone: "purple" },
                { title: "Façade specialist", body: "Agree the coordination export and marks at mobilisation, keep marks stable and record tests and installation by mark.", tone: "amber" },
                { title: "Main contractor", body: "Run façade-specific clash tests, close interfaces before fabrication and survey the frame before units are made.", tone: "blue" },
                { title: "Facility manager", body: "Say early how units should be identified and what you need to clean, inspect and replace them.", tone: "green" },
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
              title: "Test your façade coordination knowledge",
              questions: [
                { q: "In ISO 19650 terms, the façade specialist working for the main contractor is usually which kind of party?", options: ["Appointing party", "Appointed party with its own task team", "Lead appointed party", "Third-party reviewer"], answer: 1, why: "The main contractor is usually the lead appointed party, and the façade specialist is an appointed party forming its own task team." },
                { q: "Which party normally sets the façade design intent?", options: ["The façade specialist", "The BMU supplier", "The architect", "The facility manager"], answer: 2, why: "The architect sets appearance, setting out and performance targets; the specialist develops the fabrication design." },
                { q: "What should the same unit instance mark appear on?", options: ["Only the model", "Only the fabrication drawings", "The model, fabrication drawings, the delivered unit and the asset register", "Only the asset register"], answer: 2, why: "One mark from model to site to asset register lets every record be matched to the physical unit." },
                { q: "When should cast-in embeds be coordinated?", options: ["After the slab is poured", "Before the slab pour drawings are issued", "At handover", "During operation"], answer: 1, why: "Once concrete is poured, a misplaced embed means drilled fixings, extra calculations and delay." },
                { q: "Why use clearances in façade clash tests?", options: ["To reduce the number of tests", "To reflect site tolerances and bracket adjustment", "Because IFC cannot show contact", "To hide clashes from the client"], answer: 1, why: "A unit that touches the frame at nominal dimensions may not fit when the frame is built within tolerance." },
                { q: "What does a facility manager most need from the façade at handover?", options: ["Machining data for every profile", "Unit identity, glass types, warranties, cleaning and replacement information", "The specialist's native fabrication model", "Clash reports from detailed design"], answer: 1, why: "Operation needs identity, product data and maintenance information, not fabrication detail." },
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
            { kind: "widget", widget: "ask-ai", title: "Ask AI about façade coordination" },
            { kind: "widget", widget: "generate", title: "Draft façade information requirements", docType: "Façade Information Requirements" },
            {
              kind: "checklist",
              title: "Give the AI good inputs",
              items: [
                "Façade systems in the package and the building height",
                "Who holds design intent and who holds fabrication design",
                "The stage and the decisions being made",
                "The client's asset identification and handover format, if known",
                "Known interfaces such as BMU, embeds or louvres",
              ],
            },
            {
              kind: "callout",
              title: "Check AI output",
              body: "AI drafts are a starting point. The information manager, the façade consultant and the specialist should check responsibilities, interfaces, performance evidence and marking rules against the project's own documents before issue.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "How should design responsibility be split between the architect and the façade specialist in the BEP?",
    "What clash tests should we run between façade brackets, slab edges and embeds?",
    "How should unitised curtain wall panels be marked so the marks work in the asset register?",
    "What façade information should the facility manager receive at handover?",
  ],
};
