import type { Hub } from "./types";

// BIM dimensions hub: 4D scheduling, 5D cost, 6D carbon, 7D asset/FM and net zero.
// "nD" labels are industry shorthand and are not defined terms in ISO 19650.

export const dimensionsHub: Hub = {
  id: "dimensions",
  eyebrow: "ADVANCED · BIM DIMENSIONS",
  title: "BIM dimensions hub",
  intro:
    "Practical guidance on linking model information to time (4D scheduling), cost (5D), sustainability and embodied carbon (6D), and asset and facilities management (7D), plus how BIM data supports net zero pathways. Note that the \"nD\" labels are industry shorthand, not ISO 19650 terms: ISO 19650 speaks of information requirements and the purposes (uses) the information serves. The meaning of 6D and 7D also varies by region, with some markets treating 6D as facilities management and 7D as sustainability, so always define the terms in your EIR and BEP.",
  sections: [
    // ---------------------------------------------------------------- 4D
    {
      id: "4d",
      label: "4D BIM",
      tabs: [
        {
          id: "overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "What is 4D BIM?",
              body: [
                "4D BIM links model elements to activities in the construction programme so that the sequence of work can be visualised, tested and communicated over time. Each object or group of objects is associated with a start and finish date, and the resulting simulation shows the asset being built, demolished or temporarily altered.",
                "It is used to check constructability, logistics and phasing before work starts on site, to communicate the plan to clients, neighbours and the supply chain, and to compare planned against actual progress during construction.",
                "4D does not replace planning software or the planner. The programme remains the source of logic and durations; the model provides the spatial context that makes sequencing problems visible.",
              ],
            },
            {
              kind: "cards",
              title: "BIM dimensions explained",
              cards: [
                { title: "3D: geometry and coordination", body: "Spatially coordinated models used for design review, clash detection and drawing production. The base for every other dimension.", tone: "blue" },
                { title: "4D: time", body: "Model elements linked to programme activities to simulate construction sequence, phasing and logistics.", tone: "teal" },
                { title: "5D: cost", body: "Quantities derived from the model, combined with rates to support estimates, cost plans, valuations and change control.", tone: "amber" },
                { title: "6D: sustainability (commonly)", body: "Environmental performance, especially whole-life and embodied carbon, derived from model quantities and product data. In some regions 6D refers to facilities management instead.", tone: "green" },
                { title: "7D: asset and FM (commonly)", body: "Structured asset information for operation and maintenance, such as COBie and the AIM. In some regions 7D refers to sustainability instead.", tone: "purple" },
              ],
            },
            {
              kind: "table",
              title: "4D simulation compared with a traditional Gantt / CPM programme",
              columns: ["Aspect", "Gantt / CPM programme", "4D simulation"],
              rows: [
                ["Primary output", "Bar chart with logic links and critical path", "Animated sequence of the model over time"],
                ["Spatial awareness", "None; location held in activity names or codes", "Explicit; shows where work happens and what is around it"],
                ["Stakeholder communication", "Requires planning literacy", "Accessible to non-specialists, clients and the public"],
                ["Detecting sequencing errors", "Relies on logic checks and planner experience", "Visual checks expose missing, out-of-order or unsupported work"],
                ["Logistics and temporary works", "Usually separate drawings", "Cranes, laydown, access routes and props can be modelled and sequenced"],
                ["Critical path analysis", "Native strength", "Inherited from the linked programme, not calculated by most 4D tools"],
                ["Progress monitoring", "Percentage complete and earned value", "Planned versus actual visual comparison, often with site capture"],
                ["Effort to maintain", "Moderate", "Higher; links must be kept current as model and programme change"],
              ],
            },
            {
              kind: "callout",
              title: "Terminology",
              body: "ISO 19650 does not define 4D. In your information requirements, describe it as an information use (for example construction sequencing or logistics planning) and specify the level of information need that the model must reach to support it.",
              tone: "info",
            },
          ],
        },
        {
          id: "workflow",
          label: "Workflow",
          blocks: [
            {
              kind: "steps",
              title: "A typical 4D workflow",
              steps: [
                { title: "Structure the programme (WBS)", body: "Agree a work breakdown structure that reflects how the asset will be built: zones, levels, sequences and trades. Activity codes should map cleanly to model locations and systems." },
                { title: "Break down the model and build search sets", body: "Split or tag model elements so they match programme granularity, for example by pour, level, grid zone or work package. Create saved selection or search sets using properties such as level, zone and classification." },
                { title: "Link model to programme", body: "Associate selection sets with activities, either manually or by rules that match shared codes. Assign task types such as construct, demolish and temporary so the simulation shows the right behaviour." },
                { title: "Run the simulation", body: "Play the sequence, add logistics objects (cranes, hoists, hoarding, laydown areas) and check for unsupported elements, access conflicts and illogical order." },
                { title: "Review with the team", body: "Hold structured 4D reviews with the planner, site team, temporary works and key subcontractors. Record issues and feed changes back into the programme, not only the 4D file." },
                { title: "Update with actuals", body: "Import actual start and finish dates and compare planned against actual. Site capture such as photos or laser scans can be used to verify progress." },
              ],
            },
            {
              kind: "checklist",
              title: "Before you start linking",
              items: [
                "Programme and model use a common location and zoning convention",
                "Model elements are split at the same boundaries as activities (for example pours and phases)",
                "Required properties (level, zone, classification, work package) are populated",
                "Temporary works and logistics objects are modelled or available as a library",
                "Programme baseline is agreed and version controlled in the CDE",
                "Responsibility for maintaining links is assigned in the BEP",
              ],
            },
            {
              kind: "callout",
              title: "Keep the programme as the master",
              body: "Change logic and durations in the planning tool and re-import. Editing dates directly in the 4D environment creates two versions of the truth.",
              tone: "warn",
            },
          ],
        },
        {
          id: "software",
          label: "Software comparison",
          blocks: [
            {
              kind: "table",
              title: "4D software capabilities (indicative, check current versions)",
              columns: ["Tool", "Typical strengths", "Programme links", "Notes"],
              rows: [
                ["Bentley SYNCHRO (4D / Pro)", "Dedicated 4D planning with its own scheduling engine, resource and logistics modelling, progress tracking", "Imports and exports common planning formats such as Primavera P6 and Microsoft Project", "Can be used for planning as well as visualisation; strong in infrastructure"],
                ["Autodesk Navisworks Manage (TimeLiner)", "Familiar federation environment combining clash detection and 4D", "Links to P6, Microsoft Project and CSV data sources", "TimeLiner is simpler than dedicated 4D tools but widely available"],
                ["Fuzor", "Real-time rendering, VR, logistics and equipment simulation", "Imports common schedule formats", "Often used for visual communication and site logistics"],
                ["Bentley iTwin and related products", "Digital twin context for large infrastructure programmes", "Integrates with Bentley planning and project tools", "Suited to linear and network infrastructure"],
                ["Autodesk Construction Cloud / Autodesk Docs", "Cloud model viewing and coordination", "Limited native 4D; often paired with other tools", "Check current feature set as cloud capabilities change frequently"],
                ["Trimble Connect / Tekla tools", "Model-based status tracking, particularly for steel and precast", "Status and scheduling data on model objects", "Useful for fabrication and erection sequencing"],
                ["Open source and IFC-based tools", "IFC 4D concepts (tasks and sequences) can be exchanged in open formats", "Varies by tool", "Support is still maturing; test before relying on it"],
              ],
            },
            {
              kind: "list",
              title: "Selection criteria",
              items: [
                "Compatibility with the planning tool and the model authoring formats you use, including IFC",
                "Ability to handle the size of your federated model without excessive splitting",
                "Rule-based linking and update performance when the programme changes",
                "Logistics, temporary works and resource modelling if site planning matters",
                "Progress capture and planned versus actual reporting",
                "Licensing model and skills available in your team and supply chain",
              ],
            },
            {
              kind: "callout",
              title: "Prices are not listed",
              body: "Licence costs change frequently and depend on agreements. Compare capabilities against your information uses first, then obtain current quotations.",
              tone: "info",
            },
          ],
        },
        {
          id: "iso19650",
          label: "ISO 19650",
          blocks: [
            {
              kind: "text",
              title: "Where 4D fits in ISO 19650",
              body: [
                "ISO 19650 is neutral about dimensions. 4D enters through information requirements: the appointing party states in the EIR that information is needed to support construction sequencing, logistics or phasing decisions, and the delivery team responds in the BEP with the approach, tools and responsibilities.",
                "Delivery milestones in the MIDP and TIDPs should align with the programme so that model information needed for 4D is produced in time. The 4D model itself is an information container and should be managed in the CDE like any other.",
              ],
            },
            {
              kind: "table",
              title: "ISO 19650 concepts applied to 4D",
              columns: ["Concept", "Application to 4D"],
              rows: [
                ["EIR", "State the 4D information uses, review points and expected outputs such as sequence animations or logistics plans"],
                ["BEP", "Describe the 4D approach, software, linking method, update frequency and responsibilities"],
                ["MIDP / TIDP", "Schedule model deliverables so geometry and properties are ready before each 4D review"],
                ["Level of information need", "Define geometry split, location and zoning properties, and identifiers needed for linking"],
                ["Information container", "Treat programmes, 4D files and simulation outputs as containers with metadata and status"],
                ["CDE states", "Work in progress for drafting links, shared for coordination reviews, published for approved sequences, archived for record"],
                ["Responsibility matrix", "Assign who maintains links, who reviews simulations and who accepts outputs"],
              ],
            },
            {
              kind: "callout",
              title: "Level of information need for 4D",
              body: "4D usually needs geometry split by construction sequence rather than by design discipline, plus consistent location and work package properties. Specify these explicitly, because design models rarely provide them by default.",
              tone: "ok",
            },
          ],
        },
        {
          id: "use-cases",
          label: "Use cases",
          blocks: [
            {
              kind: "cards",
              title: "Common 4D use cases",
              cards: [
                { title: "Construction sequencing", body: "Test the order of work, identify unsupported elements and optimise sequences before mobilisation.", tone: "blue" },
                { title: "Site logistics", body: "Plan crane positions and lift zones, deliveries, laydown and access routes for each phase.", tone: "teal" },
                { title: "Phasing in occupied buildings", body: "Show how live operations, decants and temporary arrangements change over time.", tone: "amber" },
                { title: "Tender and bid communication", body: "Demonstrate the proposed method and programme in a way evaluators can understand quickly.", tone: "purple" },
                { title: "Health and safety planning", body: "Visualise hazards such as working at height, exclusion zones and overlapping trades.", tone: "red" },
                { title: "Progress monitoring", body: "Compare planned and actual status visually to support reporting and recovery planning.", tone: "green" },
              ],
            },
            {
              kind: "list",
              title: "Stakeholders who benefit",
              items: [
                "Clients and funders reviewing programme risk",
                "Planners and construction managers testing method",
                "Temporary works designers checking stages",
                "Subcontractors coordinating interfaces",
                "Local authorities and neighbours affected by logistics",
                "Operators of live facilities during phased works",
              ],
            },
            {
              kind: "callout",
              title: "Start with a decision",
              body: "Choose 4D use cases by the decisions they support. A short, focused simulation of a risky phase is often more valuable than animating the whole project.",
              tone: "ok",
            },
          ],
        },
        {
          id: "challenges",
          label: "Challenges",
          blocks: [
            {
              kind: "table",
              title: "Challenges and mitigations",
              columns: ["Challenge", "Mitigation"],
              rows: [
                ["Model breakdown does not match programme activities", "Agree zoning and splitting rules early and include them in the level of information need"],
                ["Programme changes break links", "Use rule-based linking on shared codes rather than manual one-to-one links"],
                ["Large federated models perform poorly", "Use lighter federated formats, filter to relevant disciplines and split by zone"],
                ["Planners and modellers work in silos", "Hold joint 4D workshops and name a 4D coordinator in the BEP"],
                ["Temporary works and logistics are not modelled", "Maintain a logistics object library and include temporary works in scope"],
                ["4D becomes a marketing animation only", "Tie each simulation to a review, a decision and a recorded outcome"],
                ["Effort underestimated in fees", "Scope 4D explicitly in appointments; use the BIM fee estimator under Tools for a first view"],
              ],
            },
            {
              kind: "callout",
              title: "Quality of the programme matters most",
              body: "A 4D simulation can only be as reliable as the programme logic behind it. Poor logic produces convincing but misleading animations.",
              tone: "warn",
            },
            {
              kind: "checklist",
              title: "4D health check",
              items: [
                "All model elements in scope are linked to at least one activity",
                "No activities in scope lack linked elements, unless intentionally",
                "Simulation date matches the current programme version",
                "Logistics objects reflect the current site plan",
                "Review outcomes are recorded and fed back into the programme",
              ],
            },
          ],
        },
        {
          id: "case-studies",
          label: "Case studies",
          blocks: [
            {
              kind: "callout",
              title: "Illustrative scenarios",
              body: "The scenarios below are generic and illustrative. They are composites of common practice, not descriptions of named projects, and any outcomes described are qualitative.",
              tone: "info",
            },
            {
              kind: "cards",
              title: "Illustrative 4D scenarios",
              cards: [
                { title: "Illustrative: hospital refurbishment in a live site", body: "The contractor used 4D to plan ward decants and temporary corridors. Reviews with clinical staff exposed a phase where two departments lost access at once, and the sequence was revised before works began.", tone: "blue" },
                { title: "Illustrative: city-centre tower with constrained logistics", body: "Crane lift zones and delivery bays were modelled for each phase. The simulation showed a clash between a mobile crane and façade deliveries, leading to a revised delivery window.", tone: "teal" },
                { title: "Illustrative: rail possession planning", body: "Short possessions were rehearsed in 4D with plant movements and access points, helping the team confirm the work could be completed within each window.", tone: "amber" },
                { title: "Illustrative: school extension over the holidays", body: "A 4D sequence helped the client understand which areas would be handed back at the start of term and which would remain behind hoarding.", tone: "green" },
              ],
            },
            {
              kind: "list",
              title: "Lessons that recur across scenarios",
              items: [
                "Involve site teams early; they spot practical problems quickly",
                "Model the temporary state, not only the permanent works",
                "Keep simulations short and focused on decisions",
                "Record changes made as a result of 4D reviews",
              ],
            },
          ],
        },
        {
          id: "clash",
          label: "Clash detection",
          blocks: [
            {
              kind: "text",
              title: "Spatio-temporal clash detection",
              body: [
                "Conventional clash detection compares static geometry. Spatio-temporal (4D) clash detection adds time, checking whether objects or workspaces conflict only during particular periods, for example a scaffold that is fine on completion but blocks an access route during a specific phase.",
                "Workspace clashes model the space needed to carry out an activity, such as a crane swing radius, mobile elevating work platform footprint, or a trade's working zone, and check it against other activities happening at the same time.",
              ],
            },
            {
              kind: "cards",
              title: "Types of time-based clash",
              cards: [
                { title: "Hard clash in time", body: "Two physical objects occupy the same space at the same time, such as temporary props and a newly installed duct.", tone: "red" },
                { title: "Workspace clash", body: "Two activities need the same working area simultaneously, such as two trades on one floor plate.", tone: "amber" },
                { title: "Logistics clash", body: "Plant, deliveries or storage conflict with access routes or exclusion zones.", tone: "purple" },
                { title: "Sequence clash", body: "An element is installed before what supports it, or after something that blocks its installation.", tone: "blue" },
              ],
            },
            {
              kind: "steps",
              title: "Running a 4D clash test",
              steps: [
                { title: "Model workspaces", body: "Create simple volumes representing working zones and plant envelopes, linked to the activities that use them." },
                { title: "Configure time-based tests", body: "Set clash rules that only report conflicts when both items are active or present at the same date." },
                { title: "Review and assign", body: "Group results by phase and assign them to planners or package managers through your issue tracking process." },
                { title: "Resolve in the programme", body: "Adjust sequence or logistics in the planning tool, re-import and re-run the test." },
              ],
            },
          ],
        },
        {
          id: "quiz",
          label: "Quiz",
          blocks: [
            {
              kind: "callout",
              title: "How to use this quiz",
              body: "Answer each question, then read the explanation. The questions cover model breakdown, linking, ISO 19650 terminology, CDE states and workspace clashes.",
              tone: "info",
            },
            {
              kind: "list",
              title: "Revise first",
              items: ["Overview and Workflow tabs in this section", "ISO 19650 tab in this section", "Challenges and mitigations"],
            },
            {
              kind: "quiz",
              title: "4D BIM knowledge check",
              questions: [
                { q: "What does 4D BIM add to a 3D model?", options: ["Cost data", "Time and sequence information", "Asset maintenance data", "Carbon factors"], answer: 1, why: "4D links model elements to programme activities so the construction sequence can be simulated over time." },
                { q: "Is 4D a defined term in ISO 19650?", options: ["Yes, in ISO 19650-1", "Yes, in ISO 19650-2", "No, it is industry shorthand; ISO 19650 talks about information requirements and uses", "Only in the UK National Annex"], answer: 2, why: "ISO 19650 does not define nD terms. 4D should be expressed as an information use in the EIR and BEP." },
                { q: "Where should programme logic and durations be changed?", options: ["Directly in the 4D tool", "In the planning tool, then re-imported", "In the authoring model", "In the CDE metadata"], answer: 1, why: "Keeping the planning tool as the master avoids two inconsistent versions of the programme." },
                { q: "What is a workspace clash?", options: ["Two design models using different coordinate systems", "Two activities needing the same working area at the same time", "A clash between file naming conventions", "A conflict between two CDE platforms"], answer: 1, why: "Workspace clashes model the space needed to carry out an activity and test it against concurrent activities." },
                { q: "Which document should describe the 4D approach, tools and responsibilities?", options: ["The BEP", "The OIR", "The asset register", "The RFI log"], answer: 0, why: "The delivery team sets out how it will meet the information requirements, including 4D, in the BEP." },
                { q: "Why is model breakdown important for 4D?", options: ["It reduces file size only", "Elements must be split at the same boundaries as programme activities to be linked meaningfully", "It is required for COBie", "It sets the coordinate system"], answer: 1, why: "If a whole slab is one object but is poured in four stages, the simulation cannot show the real sequence." },
                { q: "In which CDE state would an approved 4D sequence typically sit?", options: ["Work in progress", "Shared", "Published", "Archived"], answer: 2, why: "Approved, authorised information is placed in the published state for use; shared is for coordination." },
              ],
            },
          ],
        },
        {
          id: "ai-tools",
          label: "AI tools",
          blocks: [
            { kind: "widget", widget: "ask-ai", title: "Ask AI about BIM dimensions" },
            { kind: "widget", widget: "generate", title: "Generate a 4D planning execution plan", docType: "4D planning execution plan" },
            {
              kind: "callout",
              title: "Review AI output",
              body: "Generated plans are a starting point. Check them against your EIR, BEP, programme and contract before issuing them through the CDE.",
              tone: "warn",
            },
          ],
        },
      ],
    },

    // ---------------------------------------------------------------- 5D
    {
      id: "5d",
      label: "5D cost",
      tabs: [
        {
          id: "overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "What is 5D BIM?",
              body: [
                "5D BIM uses quantities derived from model elements, combined with rates and cost data, to produce estimates, cost plans, bills of quantities, valuations and forecasts. Because quantities are linked to objects, the cost impact of design changes can be identified faster than with traditional take-off from drawings.",
                "The model does not replace the cost consultant. Professional judgement is still needed for items that are not modelled, for preliminaries, risk, inflation, and for interpreting what the model actually represents at each stage.",
              ],
            },
            {
              kind: "cards",
              title: "What 5D supports",
              cards: [
                { title: "Early cost planning", body: "Elemental cost plans from massing and early design models, refined as the design develops.", tone: "blue" },
                { title: "Design option appraisal", body: "Compare cost of alternatives quickly using consistent quantities.", tone: "teal" },
                { title: "Tender documentation", body: "Model-based quantities support bills of quantities and pricing schedules.", tone: "amber" },
                { title: "Change control", body: "Compare model versions to quantify the effect of design changes.", tone: "purple" },
                { title: "Valuation and cash flow", body: "Combine with 4D to forecast spend over time and support interim valuations.", tone: "green" },
              ],
            },
            {
              kind: "callout",
              title: "Combine with 6D",
              body: "The same quantities that drive cost can drive embodied carbon estimates. For a first carbon view, use the embodied carbon (6D) tool under Tools.",
              tone: "info",
            },
          ],
        },
        {
          id: "workflow",
          label: "Workflow",
          blocks: [
            {
              kind: "steps",
              title: "A typical 5D workflow",
              steps: [
                { title: "Agree classification", body: "Use a consistent classification system, such as Uniclass or a regional equivalent, so model elements can be grouped into cost elements and work sections." },
                { title: "Define modelling rules for quantities", body: "Agree how elements are modelled (for example walls split by type, floors by finish) so that quantities are measurable and not double counted." },
                { title: "Quantity take-off", body: "Extract quantities from the model or a federated model using a QTO tool, checking units and filtering out non-construction objects." },
                { title: "Apply a measurement standard", body: "Map quantities to the measurement rules in use, such as the RICS New Rules of Measurement (NRM) for cost planning and bills, or the International Cost Management Standard (ICMS) for reporting across projects and countries." },
                { title: "Apply rates and add non-modelled items", body: "Combine quantities with rates from cost databases or market pricing; add preliminaries, risk, overheads and items not represented in the model." },
                { title: "Track changes", body: "Compare model versions, report quantity and cost differences, and record decisions in the change control process." },
              ],
            },
            {
              kind: "table",
              title: "Model quantities and their typical use",
              columns: ["Quantity type", "Typical element", "Common checks"],
              rows: [
                ["Count (nr)", "Doors, windows, sanitaryware, equipment", "Duplicates and nested families"],
                ["Length (m)", "Pipes, ducts, cable trays, beams, skirting", "Segments split by fittings; insulation included or not"],
                ["Area (m²)", "Walls, floors, ceilings, cladding, finishes", "Net or gross of openings; finishes modelled separately or as layers"],
                ["Volume (m³)", "Concrete, excavation, fill", "Overlaps at junctions; join order between elements"],
                ["Mass (t)", "Structural steel, reinforcement", "Whether reinforcement is modelled or estimated by ratio"],
                ["Gross internal area", "Whole building or zone", "Measured to the agreed standard, not a model default"],
              ],
            },
            {
              kind: "checklist",
              title: "QTO readiness",
              items: [
                "Classification codes populated on all costed elements",
                "Element types named consistently and unambiguously",
                "Units and measurement conventions agreed",
                "Non-construction objects (reference planes, placeholders) excluded",
                "Model version and status recorded with each take-off",
              ],
            },
          ],
        },
        {
          id: "iso19650",
          label: "ISO 19650",
          blocks: [
            {
              kind: "text",
              title: "5D and information requirements",
              body: [
                "Within ISO 19650, model-based cost estimating is an information use like any other. The appointing party should state in the EIR when cost information is needed, at what reliability, and in what format, so the delivery team can plan model content accordingly.",
                "The level of information need is the key tool. It defines the geometry, alphanumeric information and documentation required at each milestone, which determines whether quantities can be extracted reliably.",
              ],
            },
            {
              kind: "table",
              title: "Level of information need for QTO",
              columns: ["Aspect", "What to specify for 5D"],
              rows: [
                ["Purpose", "Cost planning, tender pricing, valuation or change control at a named milestone"],
                ["Geometry detail", "Elements modelled to the extent they are measured; layers or separate elements for finishes"],
                ["Geometry dimensionality", "3D solids for volumetric items; 2D or symbolic acceptable for some fixtures"],
                ["Identification", "Unique identifiers and type names that remain stable between versions"],
                ["Classification", "Classification codes for cost grouping and work sections"],
                ["Alphanumeric properties", "Material, specification reference, fire rating or other cost drivers"],
                ["Documentation", "Specifications and schedules that complement the model for unmodelled scope"],
              ],
            },
            {
              kind: "callout",
              title: "State what is not modelled",
              body: "Ask task teams to declare which scope is excluded from the model at each stage. This protects the cost consultant from assuming a quantity is complete.",
              tone: "warn",
            },
          ],
        },
        {
          id: "software",
          label: "Software",
          blocks: [
            {
              kind: "table",
              title: "5D and QTO software (indicative)",
              columns: ["Tool", "Typical strengths", "Notes"],
              rows: [
                ["CostX (RIB)", "2D and model-based take-off, workbooks, revision comparison", "Widely used by cost consultants"],
                ["iTWO / RIB 4.0", "Integrated 5D with scheduling and cost management", "Suited to contractor-led 5D"],
                ["Autodesk Navisworks (Quantification)", "Take-off from federated models", "Often used where Navisworks is already in place"],
                ["Vico Office (Trimble)", "Location-based quantities and cost linked to scheduling", "Check current product roadmap"],
                ["Bexel Manager", "Combined 4D, 5D and 6D on IFC models", "Open format focus"],
                ["Revit schedules and add-ins", "Quick quantities direct from authoring models", "Good for checks; limited for formal cost reporting"],
                ["Spreadsheets and cost databases", "Flexible and transparent", "Prone to errors if links to model versions are lost"],
              ],
            },
            {
              kind: "list",
              title: "What to look for",
              items: [
                "IFC support and handling of native formats used by your designers",
                "Version comparison to quantify change",
                "Mapping to your measurement standard and cost breakdown",
                "Audit trail from cost line back to model object",
                "Integration with scheduling for cash flow",
              ],
            },
            {
              kind: "callout",
              title: "Check licensing directly",
              body: "Prices and product bundles change frequently. Shortlist on capability, then request current terms.",
              tone: "info",
            },
          ],
        },
        {
          id: "challenges",
          label: "Challenges",
          blocks: [
            {
              kind: "table",
              title: "5D challenges and mitigations",
              columns: ["Challenge", "Mitigation"],
              rows: [
                ["Models not built for measurement", "Agree modelling rules for quantities in the BEP and level of information need"],
                ["Missing or inconsistent classification", "Use automated property checks before each take-off"],
                ["Double counting at junctions", "Define join rules and run overlap checks"],
                ["Scope not modelled (temporary works, small items)", "Maintain an explicit list of unmodelled scope with allowances"],
                ["Quantities change without explanation", "Compare versions and require change notes from task teams"],
                ["Mismatch with measurement standards", "Map model quantities to the agreed standard rather than using model defaults"],
                ["Low trust from cost professionals", "Run parallel checks on early projects and document reconciliation"],
              ],
            },
            {
              kind: "callout",
              title: "Model quantities are not automatically measured quantities",
              body: "Model quantities are geometric. Measurement standards contain rules on deductions, grouping and descriptions that need interpretation before quantities are used in contract documents.",
              tone: "warn",
            },
            {
              kind: "faq",
              title: "Common questions",
              items: [
                { q: "Can a model produce a full bill of quantities automatically?", a: "Rarely. A model can supply a large share of measured items, but preliminaries, unmodelled scope and descriptions still need professional input." },
                { q: "Who owns the quantities?", a: "Responsibility should be stated in appointments. Typically the cost consultant remains responsible for the cost report, while task teams are responsible for model content meeting the level of information need." },
              ],
            },
          ],
        },
        {
          id: "quiz",
          label: "Quiz",
          blocks: [
            {
              kind: "callout",
              title: "How to use this quiz",
              body: "Answer each question, then read the explanation. The questions cover classification, measurement standards, level of information need and take-off checks.",
              tone: "info",
            },
            {
              kind: "list",
              title: "Revise first",
              items: ["Overview and Workflow tabs in this section", "ISO 19650 tab in this section", "Challenges and mitigations"],
            },
            {
              kind: "quiz",
              title: "5D cost knowledge check",
              questions: [
                { q: "What does 5D BIM primarily add?", options: ["Time", "Cost derived from model quantities", "Facilities management data", "Point clouds"], answer: 1, why: "5D combines model quantities with rates to support estimates and cost control." },
                { q: "Which ISO 19650 concept defines the information a model must contain to support QTO?", options: ["Level of information need", "Suitability code", "Trigger event", "Federation strategy"], answer: 0, why: "The level of information need specifies geometry, alphanumeric data and documentation for each purpose and milestone." },
                { q: "What is NRM?", options: ["A file format", "A set of RICS measurement rules for cost planning and works", "A CDE workflow", "An IFC schema"], answer: 1, why: "The RICS New Rules of Measurement provide rules for measuring building works for cost planning, procurement and maintenance." },
                { q: "Why is classification important for 5D?", options: ["It sets model colours", "It groups elements into cost elements and work sections consistently", "It is required for clash detection", "It defines CDE states"], answer: 1, why: "Classification lets quantities be grouped and reported in line with the cost breakdown." },
                { q: "Which is a common source of error in model-based take-off?", options: ["Double counting at element junctions", "Using a CDE", "Using IFC", "Recording model versions"], answer: 0, why: "Overlapping elements at junctions can inflate volumes and areas unless join rules are checked." },
                { q: "What should accompany every take-off?", options: ["A rendered image", "The model version and status it was based on", "The authoring software licence key", "A clash report"], answer: 1, why: "Recording the version and status ensures quantities can be traced and compared later." },
              ],
            },
          ],
        },
      ],
    },

    // ---------------------------------------------------------------- 6D
    {
      id: "6d",
      label: "6D carbon",
      tabs: [
        {
          id: "overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "Whole-life carbon and BIM",
              body: [
                "In this hub, 6D means using model information to assess environmental performance, particularly whole-life carbon: the emissions associated with an asset across its life cycle, including materials, construction, use, maintenance, replacement and end of life. Some regions use 6D for facilities management instead, so define the term in your EIR.",
                "Embodied carbon covers emissions from materials and construction processes, maintenance and replacement, and end of life. Operational carbon covers emissions from energy and, in some frameworks, water use during operation. Model quantities, combined with product carbon data, are the basis for embodied carbon assessment.",
              ],
            },
            {
              kind: "stats",
              title: "Why it matters",
              stats: [
                { value: "39%", label: "Reported share of global energy-related carbon emissions attributed to buildings", source: "World Green Building Council, Bringing Embodied Carbon Upfront (2019)" },
                { value: "28% / 11%", label: "Reported split between operational emissions and materials and construction", source: "World Green Building Council, Bringing Embodied Carbon Upfront (2019)" },
                { value: "Rising", label: "Share of whole-life carbon from embodied emissions as operational energy improves (qualitative trend)" },
              ],
            },
            {
              kind: "table",
              title: "EN 15978 life-cycle modules (summary)",
              columns: ["Module", "Stage", "What it covers in general terms"],
              rows: [
                ["A1–A3", "Product stage", "Raw material supply, transport to the factory and manufacturing"],
                ["A4–A5", "Construction process stage", "Transport to site and construction or installation activities, including waste"],
                ["B1–B5", "Use stage (fabric)", "Use, maintenance, repair, replacement and refurbishment"],
                ["B6–B7", "Use stage (operation)", "Operational energy use and operational water use"],
                ["C1–C4", "End-of-life stage", "Deconstruction, transport, waste processing and disposal"],
                ["D", "Beyond the system boundary", "Potential benefits and loads from reuse, recovery and recycling, reported separately"],
              ],
            },
            {
              kind: "text",
              title: "Environmental product declarations",
              body: [
                "Environmental product declarations (EPDs) provide verified life-cycle data for construction products. In Europe they are produced to EN 15804, which sets core rules so EPDs report the same modules and indicators; ISO 21930 provides comparable core rules internationally.",
                "Product-specific EPDs are preferred once products are known. Earlier in design, generic or average data from recognised databases is typically used, with appropriate caution about its representativeness.",
              ],
            },
          ],
        },
        {
          id: "workflow",
          label: "Workflow",
          blocks: [
            {
              kind: "steps",
              title: "Model-based carbon assessment workflow",
              steps: [
                { title: "Define scope and method", body: "Agree the assessment standard, life-cycle modules, reference study period, building parts included and the milestones at which assessments are needed." },
                { title: "Map materials", body: "Ensure model elements carry material information (for example concrete grade, cement replacement, steel type, timber product) and classification, so each can be matched to carbon data." },
                { title: "Select carbon data", body: "Match materials to EPDs or generic datasets, recording the source, version and any assumptions. Replace generic data with product-specific EPDs as procurement progresses." },
                { title: "Calculate", body: "Multiply quantities by carbon factors, add transport, construction, replacement cycles and end-of-life scenarios as required by the method." },
                { title: "Report and compare", body: "Report results by module and building element, normalised by floor area where appropriate, and compare against project targets and benchmarks." },
                { title: "Optimise and iterate", body: "Identify carbon hotspots, test alternatives and update the assessment at each design and construction milestone." },
              ],
            },
            {
              kind: "callout",
              title: "Quick estimate",
              body: "For a first order-of-magnitude view of embodied carbon from key material quantities, use the embodied carbon (6D) tool under Tools. Formal assessments should follow a recognised method and use project-specific data.",
              tone: "info",
            },
            {
              kind: "checklist",
              title: "Data quality checks",
              items: [
                "Every significant material has an assigned carbon dataset",
                "Data source and version recorded for each factor",
                "Units consistent between quantities and factors (m³, t, m²)",
                "Biogenic carbon treated as the chosen method requires",
                "Results reconcile with the cost plan quantities",
              ],
            },
          ],
        },
        {
          id: "standards",
          label: "Standards & frameworks",
          blocks: [
            {
              kind: "table",
              title: "Key standards and frameworks (described generally)",
              columns: ["Standard or framework", "What it does", "Typical use"],
              rows: [
                ["EN 15978", "Method for assessing the environmental performance of buildings over their life cycle, using modules A to D", "Basis for building-level whole-life assessments in Europe and the UK"],
                ["EN 15804", "Core rules for EPDs of construction products", "Producing and comparing product carbon data"],
                ["ISO 21930", "International core rules for EPDs of construction products and services", "EPDs outside or alongside the European framework"],
                ["ISO 14040 / ISO 14044", "General principles and requirements for life cycle assessment", "Underlying LCA methodology"],
                ["RICS whole life carbon assessment professional standard", "Practical rules for carrying out and reporting whole-life carbon assessments of built assets", "Consistent assessments and reporting in UK and international practice"],
                ["LETI embodied carbon guidance", "Industry guidance with target bands for embodied carbon by building type", "Setting ambitions and benchmarking design performance"],
                ["RIBA 2030 Climate Challenge", "Voluntary targets for operational energy, embodied carbon and water", "Practice-level and project-level ambition setting"],
                ["UK Net Zero Carbon Buildings Standard", "Cross-industry standard defining limits and requirements for net zero carbon buildings in the UK", "Verifying net zero claims (see the Net zero section)"],
              ],
            },
            {
              kind: "callout",
              title: "Check editions",
              body: "Several of these standards and frameworks have been revised recently or are under revision. Confirm which edition your client or planning authority requires before starting an assessment.",
              tone: "warn",
            },
            {
              kind: "callout",
              title: "Targets are not fixed numbers",
              body: "Target values differ between frameworks, building types and versions. Use them as indicative ranges and quote the framework and version alongside any target you adopt.",
              tone: "info",
            },
          ],
        },
        {
          id: "iso19650",
          label: "ISO 19650",
          blocks: [
            {
              kind: "text",
              title: "Carbon data in ISO 19650 information requirements",
              body: [
                "Carbon information should be traced through the ISO 19650 requirements hierarchy. Organisational sustainability goals belong in the OIR; asset-level needs for carbon reporting during operation belong in the AIR; project assessments and their milestones belong in the PIR and EIR.",
                "The delivery team responds in the BEP with the assessment method, tools, data sources and responsibilities, and plans the deliverables in the MIDP and TIDPs.",
              ],
            },
            {
              kind: "table",
              title: "Where carbon information sits",
              columns: ["Requirement or concept", "Carbon-related content"],
              rows: [
                ["OIR", "Organisational net zero commitments and reporting obligations"],
                ["AIR", "Carbon data to retain in the AIM, such as product EPD references, replacement cycles and as-built quantities"],
                ["PIR", "Project carbon targets and key decision points where assessments inform choices"],
                ["EIR", "Assessment method, life-cycle modules, milestones, formats and acceptance criteria"],
                ["Level of information need", "Material properties, quantities and EPD references required at each stage"],
                ["Property sets", "Agreed properties such as material, EPD identifier, carbon factor, data source and assessment stage"],
                ["CDE", "Assessment reports and calculation files managed as information containers with status and revision"],
              ],
            },
            {
              kind: "list",
              title: "Example properties for carbon data",
              items: [
                "Material description and specification reference",
                "EPD identifier or dataset reference",
                "Declared unit and carbon factor for modules A1–A3",
                "Data source type (product-specific, manufacturer average, generic)",
                "Expected service life for replacement calculations",
                "Recycled content and end-of-life scenario, where required",
              ],
            },
          ],
        },
        {
          id: "tools",
          label: "Tools",
          blocks: [
            {
              kind: "table",
              title: "Carbon assessment tools (indicative)",
              columns: ["Tool type", "Examples", "Notes"],
              rows: [
                ["Model-integrated LCA", "One Click LCA, Tally-style plug-ins", "Read quantities and materials directly from authoring or IFC models"],
                ["Standalone LCA software", "General LCA tools such as SimaPro or GaBi-type platforms", "Detailed and flexible; usually used by specialists"],
                ["Free calculators", "Industry calculators such as EC3 or structural carbon calculators", "Useful for early comparisons; check scope and data sources"],
                ["Multi-dimensional BIM platforms", "Tools combining 4D, 5D and 6D on federated models", "Share quantities between cost and carbon"],
                ["Spreadsheet methods", "In-house templates", "Transparent but need strong version control"],
                ["Portal estimator", "The embodied carbon (6D) tool under Tools", "Quick order-of-magnitude estimates from key material quantities"],
              ],
            },
            {
              kind: "list",
              title: "Selection criteria",
              items: [
                "Compliance with the method you need to report against",
                "Quality, coverage and regional relevance of the EPD database",
                "Import from your model formats, including IFC",
                "Transparency of assumptions and audit trail",
                "Reporting outputs that match client and planning requirements",
              ],
            },
            {
              kind: "callout",
              title: "Same quantities, different factors",
              body: "Results from different tools can vary because of data sources and assumptions. Compare like with like and document the tool, data versions and scope.",
              tone: "warn",
            },
          ],
        },
        {
          id: "quiz",
          label: "Quiz",
          blocks: [
            {
              kind: "callout",
              title: "How to use this quiz",
              body: "Answer each question, then read the explanation. The questions cover EN 15978 modules, EPDs, information requirements and carbon data sources.",
              tone: "info",
            },
            {
              kind: "list",
              title: "Revise first",
              items: ["Overview and Workflow tabs in this section", "ISO 19650 tab in this section", "Standards and Tools tabs in this section"],
            },
            {
              kind: "quiz",
              title: "6D carbon knowledge check",
              questions: [
                { q: "Which EN 15978 modules cover the product stage?", options: ["A1–A3", "A4–A5", "B1–B7", "C1–C4"], answer: 0, why: "A1–A3 cover raw material supply, transport to the factory and manufacturing." },
                { q: "Which standard sets core rules for EPDs of construction products in Europe?", options: ["EN 15804", "ISO 19650-3", "ISO 9001", "EN 17412-1"], answer: 0, why: "EN 15804 defines core product category rules so EPDs are consistent." },
                { q: "What does module D represent?", options: ["Demolition on site", "Benefits and loads beyond the system boundary, reported separately", "Design stage emissions", "Daily operational energy"], answer: 1, why: "Module D captures potential benefits from reuse, recovery and recycling outside the main life cycle." },
                { q: "Which module covers operational energy use?", options: ["A5", "B6", "C3", "D"], answer: 1, why: "B6 is operational energy use; B7 is operational water use." },
                { q: "Where should asset-level carbon data to be kept in operation be specified?", options: ["AIR", "TIDP", "Clash report", "RFI"], answer: 0, why: "Asset information requirements define information needed to operate the asset, including carbon data to retain." },
                { q: "Why do 6D and 7D sometimes mean different things?", options: ["ISO 19650 changed them", "Regional industry usage differs; they are not standardised terms", "They refer to software versions", "They depend on the CDE"], answer: 1, why: "nD labels are informal and vary by region, so they should be defined in project documents." },
                { q: "Early in design, which carbon data is usually used?", options: ["Product-specific EPDs only", "Generic or average data from recognised databases", "No data", "Operational meter readings"], answer: 1, why: "Products are often not yet selected, so generic data is used and replaced as procurement progresses." },
              ],
            },
          ],
        },
        {
          id: "ai-tools",
          label: "AI tools",
          blocks: [
            { kind: "widget", widget: "ask-ai", title: "Ask AI about BIM dimensions" },
            { kind: "widget", widget: "generate", title: "Generate a whole-life carbon assessment plan", docType: "Whole-life carbon assessment plan" },
            {
              kind: "callout",
              title: "Review AI output",
              body: "Check generated plans against the assessment standard your client requires, and confirm data sources and target values with a qualified assessor.",
              tone: "warn",
            },
          ],
        },
      ],
    },

    // ---------------------------------------------------------------- 7D
    {
      id: "7d",
      label: "7D asset & FM",
      tabs: [
        {
          id: "overview",
          label: "Overview",
          blocks: [
            {
              kind: "text",
              title: "What is 7D BIM?",
              body: [
                "In this hub, 7D refers to using structured model and asset information to operate, maintain and manage a built asset. In some regions this is called 6D. Whatever the label, the aim is a reliable asset information model (AIM) that supports operations from day one of handover.",
                "Operational costs over an asset's life generally exceed its construction cost, so good asset information can have significant long-term value, although the size of that benefit varies by asset type and organisation.",
              ],
            },
            {
              kind: "cards",
              title: "What asset information supports",
              cards: [
                { title: "Planned maintenance", body: "Asset types, locations, maintenance tasks and intervals feed planned preventive maintenance schedules.", tone: "blue" },
                { title: "Space management", body: "Rooms, zones and areas support occupancy, allocation and charging.", tone: "teal" },
                { title: "Compliance", body: "Statutory inspections, fire safety and safety-critical information are easier to find and evidence.", tone: "red" },
                { title: "Capital planning", body: "Condition, expected life and replacement data inform lifecycle budgets.", tone: "amber" },
                { title: "Energy and carbon", body: "Meter and system data support operational carbon monitoring and net zero reporting.", tone: "green" },
              ],
            },
            {
              kind: "callout",
              title: "Start from the operator's needs",
              body: "Asset information requirements should come from the people who will run the asset. Collecting every possible property creates cost without value.",
              tone: "ok",
            },
          ],
        },
        {
          id: "cobie",
          label: "COBie and AIM handover",
          blocks: [
            {
              kind: "text",
              title: "COBie in brief",
              body: [
                "COBie (Construction Operations Building information exchange) is a structured, non-geometric data schema for exchanging asset information such as facilities, floors, spaces, zones, types, components, systems, documents and attributes. It is commonly delivered as a spreadsheet or derived from IFC.",
                "COBie is a delivery format, not the requirement itself. The AIR should define which assets and properties are needed; COBie may then be one way to deliver them.",
              ],
            },
            {
              kind: "table",
              title: "Main COBie sheets and their purpose",
              columns: ["Sheet", "Purpose"],
              rows: [
                ["Contact", "People and organisations referenced elsewhere"],
                ["Facility, Floor, Space, Zone", "The spatial breakdown of the asset"],
                ["Type", "Product types with manufacturer, model and warranty information"],
                ["Component", "Individual installed instances with location and serial or tag numbers"],
                ["System", "Groupings of components that work together, such as a heating system"],
                ["Job and Resource", "Maintenance tasks and resources needed"],
                ["Document", "References to O&M manuals, certificates and drawings"],
                ["Attribute", "Additional properties required by the client"],
              ],
            },
            {
              kind: "steps",
              title: "AIM handover approach",
              steps: [
                { title: "Define AIR early", body: "Agree asset types, properties and formats with the operator before design begins." },
                { title: "Progressive population", body: "Add design data during design and installed product data during construction, rather than at the end." },
                { title: "Validate at each drop", body: "Check completeness and consistency at planned information exchanges using automated rules." },
                { title: "Accept and transfer", body: "Review and accept information into the AIM and load it into operational systems before handover." },
              ],
            },
          ],
        },
        {
          id: "iso19650-3",
          label: "ISO 19650-3",
          blocks: [
            {
              kind: "text",
              title: "Operational phase information management",
              body: [
                "ISO 19650-3 covers information management during the operational phase of assets. It describes how the AIM is created, maintained and updated in response to trigger events, such as planned maintenance, replacement, refurbishment or changes of use.",
                "It connects to ISO 19650-2 at handover: information delivered as the PIM is reviewed and accepted into the AIM, and future projects draw on the AIM as their starting point.",
              ],
            },
            {
              kind: "table",
              title: "Key operational concepts",
              columns: ["Concept", "Meaning in practice"],
              rows: [
                ["OIR", "What the organisation needs to know to achieve its objectives"],
                ["AIR", "Information needed about specific assets to meet the OIR"],
                ["AIM", "The federated set of information supporting asset management"],
                ["Trigger event", "An event that requires information to be exchanged or updated"],
                ["Appointment", "Maintenance and service contracts should include information requirements too"],
                ["Asset management systems", "Linkage to organisational asset management practice, such as ISO 55000-series approaches"],
              ],
            },
            {
              kind: "callout",
              title: "The AIM must be maintained",
              body: "An AIM that is not updated after maintenance and minor works quickly loses trust. Put information requirements into operational contracts, not only into construction appointments.",
              tone: "warn",
            },
          ],
        },
        {
          id: "cafm",
          label: "CAFM / CMMS integration",
          blocks: [
            {
              kind: "text",
              title: "Connecting asset information to operations",
              body: [
                "Computer-aided facilities management (CAFM) and computerised maintenance management systems (CMMS) are where operators actually use asset data. Integration means the AIM populates these systems at handover and receives updates from them afterwards.",
                "Geometry is often secondary for operators; reliable identifiers, locations, types, systems and maintenance data matter most.",
              ],
            },
            {
              kind: "steps",
              title: "Integration steps",
              steps: [
                { title: "Map data structures", body: "Map AIR properties and classification to the fields, asset hierarchies and codes used in the CAFM or CMMS." },
                { title: "Agree identifiers", body: "Use asset tags and unique identifiers that persist from design through operation." },
                { title: "Test with sample data", body: "Run a trial import with a sample of the handover data well before practical completion." },
                { title: "Load and verify", body: "Import the full dataset and verify on site that tags, locations and assets match." },
                { title: "Establish update routines", body: "Define how changes in operation flow back into the AIM and models." },
              ],
            },
            {
              kind: "checklist",
              title: "Integration readiness",
              items: [
                "Target CAFM / CMMS identified and its import formats known",
                "Asset hierarchy and location structure agreed",
                "Asset tagging convention agreed and applied on site",
                "Maintenance task templates mapped to asset types",
                "Owner for data updates in operation named",
              ],
            },
          ],
        },
        {
          id: "challenges",
          label: "Challenges",
          blocks: [
            {
              kind: "table",
              title: "7D challenges and mitigations",
              columns: ["Challenge", "Mitigation"],
              rows: [
                ["Requirements defined too late", "Engage the operator at the start and publish the AIR with the EIR"],
                ["Excessive data requested", "Prioritise assets that are maintained, safety critical or high value"],
                ["Handover data incomplete or inconsistent", "Progressive delivery with automated validation at each exchange"],
                ["Identifiers change between design and construction", "Agree persistent identifiers and asset tags early"],
                ["Data does not fit the CAFM / CMMS", "Map structures and trial imports before completion"],
                ["AIM not maintained in operation", "Include information duties in maintenance contracts and assign ownership"],
              ],
            },
            {
              kind: "callout",
              title: "Soft Landings",
              body: "Approaches such as Government Soft Landings in the UK encourage operator involvement and aftercare, which helps asset information be useful in practice.",
              tone: "info",
            },
            {
              kind: "faq",
              title: "Common questions",
              items: [
                { q: "Is COBie mandatory?", a: "Not under ISO 19650 itself. It may be required by a client or national programme. Define the format in the EIR based on what the operator can use." },
                { q: "Do operators need the 3D model?", a: "Sometimes for complex plant or spatial tasks, but most operational value comes from structured data and documents. Specify geometry only where it supports a use." },
              ],
            },
          ],
        },
      ],
    },

    // ---------------------------------------------------------------- Net zero
    {
      id: "netzero",
      label: "Net zero",
      tabs: [
        {
          id: "pathway",
          label: "Pathway",
          blocks: [
            {
              kind: "text",
              title: "Net zero for buildings and infrastructure",
              body: [
                "A net zero pathway addresses both operational carbon (energy used to run the asset) and embodied carbon (materials, construction, maintenance, replacement and end of life). As grids decarbonise and buildings become more efficient, embodied carbon becomes a larger share of the total.",
                "Most frameworks follow a hierarchy: reduce demand and material use first, optimise systems and specifications, supply remaining energy from renewable sources, and only then address residual emissions with credible offsets.",
              ],
            },
            {
              kind: "steps",
              title: "Carbon reduction hierarchy",
              steps: [
                { title: "Build less or reuse", body: "Challenge the need for new construction; retain and refurbish existing structures where possible." },
                { title: "Build clever", body: "Efficient structural forms, lighter design and reduced material quantities." },
                { title: "Build efficiently", body: "Lower-carbon materials and products, efficient construction and reduced waste." },
                { title: "Optimise operation", body: "Low energy demand, efficient systems, electrification and on-site or procured renewables." },
                { title: "Offset residual emissions", body: "Use credible, verified offsets only for remaining emissions, as a last resort." },
              ],
            },
            {
              kind: "cards",
              title: "Operational and embodied carbon",
              cards: [
                { title: "Operational carbon", body: "Energy for heating, cooling, ventilation, lighting, equipment and, in some frameworks, water. Measured in operation and reduced through design and management.", tone: "blue" },
                { title: "Embodied carbon", body: "Emissions from materials and construction, maintenance and replacement, and end of life. Largely locked in at design and procurement.", tone: "amber" },
                { title: "Whole-life carbon", body: "The sum of both across the life cycle, allowing trade-offs to be assessed fairly.", tone: "green" },
              ],
            },
          ],
        },
        {
          id: "targets",
          label: "Targets & frameworks",
          blocks: [
            {
              kind: "table",
              title: "Frameworks (described generally)",
              columns: ["Framework", "Scope", "What it asks for in general terms"],
              rows: [
                ["UK Net Zero Carbon Buildings Standard", "UK buildings, new and existing", "Limits on energy use and upfront embodied carbon by building type, plus requirements on fossil fuel use, renewables and verification"],
                ["World Green Building Council Net Zero Carbon Buildings Commitment", "Organisations worldwide", "Commitments to net zero operational carbon in owned or controlled assets, with growing emphasis on embodied carbon"],
                ["WorldGBC embodied carbon vision", "Industry-wide", "A vision for substantial reductions in embodied carbon by 2030 and net zero whole-life carbon by 2050"],
                ["Science Based Targets initiative (SBTi)", "Companies, including real estate and construction", "Emission reduction targets aligned with climate science, with sector guidance for buildings"],
                ["RIBA 2030 Climate Challenge", "Architectural practices and projects", "Voluntary targets for operational energy, embodied carbon and water"],
                ["LETI targets", "UK industry guidance", "Target bands for operational energy and embodied carbon by building type"],
              ],
            },
            {
              kind: "callout",
              title: "Frameworks evolve",
              body: "Several frameworks are new or being revised. Confirm the current version and whether your project is being assessed against a pilot or final version before setting targets.",
              tone: "warn",
            },
            {
              kind: "callout",
              title: "Avoid unverified net zero claims",
              body: "Claims of net zero should be tied to a named framework, clear boundaries and independent verification where the framework requires it.",
              tone: "info",
            },
          ],
        },
        {
          id: "bim-data",
          label: "Role of BIM data",
          blocks: [
            {
              kind: "text",
              title: "Why structured information matters",
              body: [
                "Net zero claims depend on evidence. Model quantities and material data underpin embodied carbon assessments; system and meter information underpins operational monitoring; and the AIM provides the long-term record needed to report and improve performance.",
                "Using ISO 19650 processes to define, deliver and accept this information makes it auditable and reusable rather than recreated for each report.",
              ],
            },
            {
              kind: "cards",
              title: "BIM data across the pathway",
              cards: [
                { title: "Design", body: "Quantities and options for embodied carbon comparison; energy model inputs.", tone: "blue" },
                { title: "Procurement", body: "Product-specific EPDs linked to specified items.", tone: "amber" },
                { title: "Construction", body: "As-built quantities, site energy and waste data for modules A4–A5.", tone: "teal" },
                { title: "Handover", body: "Asset, system and meter data loaded into the AIM and operational systems.", tone: "purple" },
                { title: "Operation", body: "Energy monitoring, maintenance and replacement records for reporting.", tone: "green" },
              ],
            },
            {
              kind: "callout",
              title: "Link to the 6D tool",
              body: "For an early indication of embodied carbon from material quantities, use the embodied carbon (6D) tool under Tools, then follow up with a formal assessment.",
              tone: "info",
            },
          ],
        },
        {
          id: "checklist",
          label: "Checklist",
          blocks: [
            {
              kind: "checklist",
              title: "Net zero information checklist",
              items: [
                "Organisational net zero commitments captured in the OIR",
                "Project carbon targets and framework named in the PIR and EIR",
                "Assessment method and life-cycle modules defined",
                "Carbon-related properties included in the level of information need",
                "Assessment milestones scheduled in the MIDP",
                "EPD references captured for procured products",
                "As-built quantities recorded for final assessment",
                "Meter and system data included in the AIR",
                "Responsibility for operational monitoring assigned",
                "Verification route agreed where the framework requires it",
              ],
            },
            {
              kind: "list",
              title: "Quick wins",
              items: [
                "Add material and EPD properties to your standard property sets",
                "Run carbon and cost from the same quantity take-off",
                "Report carbon at every design stage, not just at the end",
                "Include carbon in design review agendas",
              ],
            },
            {
              kind: "callout",
              title: "Keep it proportionate",
              body: "Focus first on the elements that typically dominate embodied carbon, such as substructure, frame, floors and façade, before refining smaller items.",
              tone: "ok",
            },
          ],
        },
      ],
    },

    // ---------------------------------------------------------------- Benchmark
    {
      id: "benchmark",
      label: "Industry benchmark",
      tabs: [
        {
          id: "maturity",
          label: "Maturity benchmark",
          blocks: [
            {
              kind: "callout",
              title: "Indicative only",
              body: "Adoption levels below are qualitative and indicative, based on general industry experience. They vary widely by region, sector and organisation size.",
              tone: "info",
            },
            {
              kind: "table",
              title: "Benchmark by dimension",
              columns: ["Dimension", "Indicative adoption", "Typical deliverables", "Skills needed"],
              rows: [
                ["3D coordination", "Widespread on medium and large projects", "Federated models, clash reports, coordinated drawings", "Authoring, federation, clash management"],
                ["4D sequencing", "Common on complex and constrained projects", "Sequence simulations, logistics plans, progress comparisons", "Planning, model breakdown, 4D software"],
                ["5D cost", "Growing, often partial", "Model-based quantities, cost plans, change reports", "Quantity surveying, QTO tools, classification"],
                ["6D carbon", "Growing quickly, driven by client and regulatory pressure", "Whole-life carbon assessments, option comparisons", "LCA, EPD interpretation, model-based quantities"],
                ["7D asset and FM", "Varies; strongest with mature client organisations", "COBie or equivalent datasets, AIM, CAFM / CMMS loads", "Asset management, data validation, FM systems"],
                ["Net zero reporting", "Emerging", "Verified carbon reporting against a named framework", "Energy modelling, carbon accounting, verification"],
              ],
            },
            {
              kind: "table",
              title: "Maturity levels per dimension",
              columns: ["Level", "Description"],
              rows: [
                ["1. Ad hoc", "Dimension used occasionally by individuals; no standard process"],
                ["2. Repeatable", "Templates and basic methods exist; results depend on key people"],
                ["3. Defined", "Process documented in BEPs and standards; consistent across projects"],
                ["4. Managed", "Information requirements, validation and KPIs in place; outputs inform decisions"],
                ["5. Optimised", "Data reused across projects and operation; continuous improvement from feedback"],
                ["Cross-cutting", "Integration of dimensions, for example shared quantities across cost and carbon"],
              ],
            },
          ],
        },
        {
          id: "faq",
          label: "FAQ",
          blocks: [
            {
              kind: "faq",
              title: "Frequently asked questions",
              items: [
                { q: "Are 4D, 5D, 6D and 7D part of ISO 19650?", a: "No. They are industry shorthand. ISO 19650 deals with information requirements, delivery and management; the uses of information, such as sequencing or cost estimating, are defined by the appointing party in its requirements." },
                { q: "Why does 6D mean sustainability in some places and FM in others?", a: "Usage grew informally in different markets. Define each term in your EIR and BEP to avoid confusion." },
                { q: "Do we need every dimension on every project?", a: "No. Select information uses based on the decisions and outcomes the client needs. Many projects benefit from one or two well-executed uses." },
                { q: "Can one model serve cost and carbon?", a: "Yes, if the level of information need covers both. Shared quantities and classification make cost and carbon consistent." },
                { q: "How do we estimate the effort for these services?", a: "Scope each use explicitly. The BIM fee estimator under Tools gives a first indication, which should be refined for your project." },
                { q: "What is the first step for an organisation starting out?", a: "Choose a pilot use with a clear decision to support, define the information requirements, and record lessons learnt for the next project." },
              ],
            },
            {
              kind: "callout",
              title: "Next steps",
              body: "Use the AI tools in the 4D and 6D sections to draft execution plans, then refine them with your team.",
              tone: "ok",
            },
            {
              kind: "list",
              title: "Related portal resources",
              items: [
                "BIM fee estimator under Tools",
                "Embodied carbon (6D) tool under Tools",
                "ISO 19650 process guidance for EIR, BEP, MIDP and TIDP",
                "Templates for OIR and AIR",
              ],
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "How do I specify 4D requirements in an EIR without using the term 4D?",
    "What level of information need does a model require for reliable quantity take-off?",
    "Which EN 15978 modules should a typical embodied carbon assessment cover at design stage?",
    "How should COBie handover data be validated before loading into a CAFM system?",
  ],
};
