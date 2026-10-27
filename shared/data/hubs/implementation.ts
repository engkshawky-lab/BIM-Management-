import type { Hub } from "./types";

// BIM implementation hub: organisation-level best practice that goes deeper than the
// step-by-step adoption guide (shared/data/adoption.ts). Content is paraphrased practical
// guidance, not reproduced standard text.

export const implementationHub: Hub = {
  id: "implementation",
  eyebrow: "BIM · IMPLEMENTATION",
  title: "BIM implementation best practices",
  intro:
    "How organisations make information management according to ISO 19650 the normal way of working: strategy and business case, maturity assessment, people and change, process, technology, standards and the KPIs that show whether it is working. Use it alongside the adoption guide, which tracks the individual steps.",
  sections: [
    {
      id: "main",
      label: "Implementation",
      tabs: [
        // ------------------------------------------------------------------ Strategy
        {
          id: "strategy",
          label: "Strategy",
          blocks: [
            {
              kind: "text",
              title: "Start from the business, not the software",
              body: [
                "BIM implementation succeeds when it is framed as a change in how the organisation specifies, produces, checks and uses information. Software is an enabler. Begin by stating which business problems information management should solve: rework and late changes, poor handover data, client mandates, risk, or the cost of running assets.",
                "The adoption guide in this portal sets out the individual steps. This hub explains the decisions behind them: how to phase the roadmap, how to make the case for investment, and how to govern the programme so it survives beyond the first pilot.",
              ],
            },
            {
              kind: "steps",
              title: "Phased roadmap",
              steps: [
                { title: "Phase 0: Mobilise (first weeks)", body: "Appoint a sponsor and implementation lead, agree scope (appointing party, delivery organisation or both) and baseline current maturity." },
                { title: "Phase 1: Foundation (first few months)", body: "Publish the organisational information requirements, information standard, CDE procedure and house templates. Configure the CDE." },
                { title: "Phase 2: Pilot (one or two projects)", body: "Run the full ISO 19650 process on selected projects with close support. Measure results against the baseline and capture lessons." },
                { title: "Phase 3: Scale (following year)", body: "Mandate the process for new projects above a threshold, train by role, extend to the supply chain and automate checks." },
                { title: "Phase 4: Optimise (ongoing)", body: "Audit, review KPIs, connect project information to asset information and operations, and update standards annually." },
              ],
            },
            {
              kind: "cards",
              title: "Building the business case",
              cards: [
                { title: "Benefits", body: "Less rework, fewer RFIs and site clashes, faster approvals, better handover data, lower operating cost, stronger bids where clients require ISO 19650.", tone: "green" },
                { title: "Costs", body: "Software and CDE licences, hardware, training, consultancy, internal time for standards and templates, and the productivity dip during transition.", tone: "amber" },
                { title: "Risks of not acting", body: "Losing work from clients who require ISO 19650, disputes over information quality, and asset data that has to be recreated after handover.", tone: "red" },
                { title: "Evidence", body: "Use your own baseline data where possible: rework logs, RFI counts, handover defects. Internal evidence persuades boards more than generic industry claims.", tone: "blue" },
              ],
            },
            {
              kind: "table",
              title: "Governance structure",
              columns: ["Body or role", "Purpose", "Typical frequency"],
              rows: [
                ["Executive sponsor", "Owns the business case, removes blockers, secures budget", "Monthly review"],
                ["Steering group", "Approves standards, priorities and funding; tracks KPIs", "Monthly or quarterly"],
                ["Implementation lead", "Runs the programme day to day and reports progress", "Continuous"],
                ["Standards working group", "Maintains the information standard, templates and methods", "Monthly"],
                ["Champions network", "Discipline and office champions support projects and feed back issues", "Fortnightly or monthly"],
                ["Project information managers", "Apply the process on projects and report lessons", "Per project milestone"],
                ["Internal audit", "Checks compliance and effectiveness on live projects", "Quarterly or per milestone"],
              ],
            },
            {
              kind: "callout",
              title: "Protect the pilot",
              body: "Choose pilot projects with a supportive client and team, a realistic programme and enough time to learn. A pilot that fails for unrelated commercial reasons can set implementation back by years.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ Maturity
        {
          id: "maturity",
          label: "Maturity",
          blocks: [
            {
              kind: "table",
              title: "Information management maturity levels",
              columns: ["Level", "Characteristics", "Typical next step"],
              rows: [
                ["1. Ad hoc", "Practice varies by project and person; no shared standard; CAD and email-based exchange", "Appoint a lead and write a basic information standard"],
                ["2. Emerging", "Some projects use models and a CDE; templates exist but are not consistent", "Publish house templates and a CDE procedure; train key roles"],
                ["3. Defined", "Organisation-wide standards, roles and CDE workflow aligned with ISO 19650", "Pilot the full process and measure results"],
                ["4. Managed", "Process mandated and audited; KPIs tracked; supply chain assessed before appointment", "Automate checks and connect to asset information"],
                ["5. Optimising", "Continuous improvement from data; information flows into operations and decision-making", "Integrate with digital twins and portfolio analytics"],
              ],
            },
            {
              kind: "text",
              title: "How this relates to the older BIM levels",
              body: [
                "Many organisations still describe themselves using the UK BIM maturity levels (0 to 3) from the Bew and Richards diagram. ISO 19650 replaced that language: in the UK the phrase BIM according to the ISO 19650 series is now used instead of BIM Level 2. The levels above are a practical internal scale, not a formal classification in the standard.",
              ],
            },
            {
              kind: "steps",
              title: "How to assess maturity",
              steps: [
                { title: "Choose dimensions", body: "Assess requirements, standards and methods, CDE, roles and responsibilities, competence, technology, supply chain, and asset information." },
                { title: "Gather evidence", body: "Review documents and live projects, not only questionnaires. Look at real EIRs, BEPs, MIDPs and CDE audit trails." },
                { title: "Score consistently", body: "Use defined criteria for each level so different assessors reach the same score. Record evidence for each score." },
                { title: "Prioritise gaps", body: "Rank gaps by business impact and effort. Fix foundations, such as the information standard and CDE workflow, before advanced uses." },
                { title: "Reassess", body: "Repeat at least annually and after major changes, using the same criteria to show progress." },
              ],
            },
            {
              kind: "cards",
              title: "Capability and capacity under ISO 19650",
              cards: [
                { title: "What the standard asks", body: "During tender response (activity 5.3), each task team's capability and capacity is assessed and summarised for the delivery team. Appointing parties use this when evaluating tenders.", tone: "blue" },
                { title: "Capability", body: "Skills, knowledge and experience of the people, and the suitability of the information technology, for the information management tasks required.", tone: "teal" },
                { title: "Capacity", body: "Whether the team has enough people and IT resources available when the work is needed, alongside its other commitments.", tone: "purple" },
                { title: "Use it internally", body: "Run the same assessment on your own organisation and supply chain before tenders. It doubles as a practical maturity check.", tone: "green" },
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ People
        {
          id: "people",
          label: "People",
          blocks: [
            {
              kind: "table",
              title: "Roles and core competencies",
              columns: ["Role", "Focus", "Core competencies"],
              rows: [
                ["Executive sponsor", "Strategy and investment", "Business case, change leadership, client expectations"],
                ["Implementation or digital lead", "Running the programme", "ISO 19650, programme management, stakeholder management"],
                ["Information manager (appointing party)", "Requirements and acceptance", "OIR, AIR, EIR, information protocol, review and acceptance"],
                ["Lead information manager (delivery team)", "BEP, MIDP and federation", "BEP authoring, planning, CDE workflow, coordination"],
                ["Task information manager", "Task team compliance", "Information standard, naming, metadata, TIDP, QA"],
                ["BIM coordinator", "Model coordination", "Federation, clash detection, issue management, BCF"],
                ["CDE administrator", "Platform configuration", "Permissions, workflows, metadata, audit trail"],
                ["Modeller or author", "Producing information", "Authoring tools, modelling standards, LOIN, IFC export"],
                ["Asset or FM manager", "Using information in operation", "AIR, COBie, CAFM integration, ISO 19650-3"],
              ],
            },
            {
              kind: "steps",
              title: "Training paths by audience",
              steps: [
                { title: "Everyone", body: "Short awareness session: why the organisation is adopting ISO 19650, the CDE states, naming and where to find standards." },
                { title: "Project leaders and directors", body: "Requirements, appointments, responsibilities and how information management affects risk, fees and programme." },
                { title: "Information managers", body: "Practitioner-level training on the full process, authoring EIRs and BEPs, planning and acceptance, ideally with assessed certification." },
                { title: "Modellers and coordinators", body: "Software skills tied to the house templates, LOIN, model QA and IFC exchange; coordination workflow and BCF." },
                { title: "Supply chain", body: "Briefings on your standards and templates, with capability assessment before appointment." },
              ],
            },
            {
              kind: "list",
              title: "Change management practices that work",
              items: [
                "Explain the reasons for change in terms each audience cares about",
                "Visible sponsorship: leaders use the CDE and ask for the outputs",
                "Champions in each office or discipline who others can ask",
                "Early wins publicised internally, with real project examples",
                "Time and budget allowed for learning on pilot projects",
                "Simple, well-maintained templates that make the right way the easy way",
                "Feedback channels so issues reach the standards group quickly",
                "Recognition of good practice in reviews and appraisals",
                "Consistent enforcement once the process is mandated",
              ],
            },
            {
              kind: "callout",
              title: "Resistance is information",
              body: "When staff resist, find out why. Often the template is too complicated, the software is too slow, or the process duplicates work. Fixing the cause works better than insisting on compliance.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Process
        {
          id: "process",
          label: "Process",
          blocks: [
            {
              kind: "cards",
              title: "Standard methods and procedures",
              cards: [
                { title: "Information standard", body: "Naming, status and revision codes, classification, metadata, units, coordinates, drawing and model standards.", tone: "blue" },
                { title: "Production methods", body: "How information is captured, generated, reviewed, approved, secured and delivered, written once and reused on every project.", tone: "teal" },
                { title: "CDE procedure", body: "States, transitions, who can approve each transition, permissions and how transmittals and audit trails work.", tone: "green" },
                { title: "Review and acceptance", body: "Checks before sharing, authorization by the lead appointed party and acceptance by the appointing party, with defined criteria.", tone: "purple" },
              ],
            },
            {
              kind: "checklist",
              title: "House template library",
              items: [
                "Organisational and asset information requirements (OIR, AIR)",
                "Exchange information requirements (EIR) with clause library",
                "Pre- and post-appointment BIM execution plans",
                "Responsibility matrix",
                "Task and master information delivery plans (TIDP, MIDP)",
                "Information protocol wording for appointments",
                "Capability and capacity assessment forms",
                "Model QA and IFC export checklists",
                "Coordination meeting agenda and minutes",
                "Lessons learned log",
              ],
            },
            {
              kind: "steps",
              title: "CDE workflow in practice",
              steps: [
                { title: "Work in progress", body: "Task team develops information in its own area. Not visible to other teams." },
                { title: "Check and share", body: "Task team checks against the information standard and suitability, then shares. Other teams can now use it as reference." },
                { title: "Review and authorize", body: "Lead appointed party reviews shared information against the EIR and authorizes it for delivery." },
                { title: "Accept and publish", body: "Appointing party reviews and accepts; the container is published for construction, operation or other agreed use." },
                { title: "Archive", body: "Superseded and close-out information is archived with its audit trail for future reference." },
              ],
            },
            {
              kind: "table",
              title: "Quality assurance layers",
              columns: ["Layer", "Who", "What is checked"],
              rows: [
                ["Self-check", "Author", "Content, naming, metadata, model health"],
                ["Task team check", "Task information manager", "Compliance with information standard and LOIN"],
                ["Coordination check", "BIM coordinator", "Clashes, spatial coordination, federation"],
                ["Authorization", "Lead appointed party", "Completeness against the MIDP and EIR"],
                ["Acceptance", "Appointing party", "Acceptance criteria in the EIR"],
                ["Audit", "Internal or third party", "Process compliance across projects"],
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ Technology
        {
          id: "technology",
          label: "Technology",
          blocks: [
            {
              kind: "table",
              title: "Technology selection criteria",
              columns: ["Criterion", "Questions to ask"],
              rows: [
                ["Fit to process", "Does it support the CDE states, approvals and metadata your standard requires?"],
                ["Openness", "Does it read and write IFC, BCF and other open formats reliably?"],
                ["Interoperability", "Does it integrate with authoring, coordination, CAFM and document tools you already use?"],
                ["Security", "Does it support ISO 19650-5 controls, access levels, audit trails and data residency needs?"],
                ["Scalability", "Can it handle your largest projects, data volumes and number of external users?"],
                ["Usability", "Can occasional users, including clients and contractors, use it without heavy training?"],
                ["Total cost", "Licences, storage, integration, training, administration and exit costs"],
                ["Vendor stability", "Roadmap, support, user community and data export if you leave"],
              ],
            },
            {
              kind: "cards",
              title: "The technology stack",
              cards: [
                { title: "CDE", body: "The single source of information with states, metadata, workflows and audit trail. Choose this carefully; it shapes daily practice.", tone: "blue" },
                { title: "Authoring", body: "Discipline tools for architecture, structure, MEP and civil. Standardise templates and object libraries rather than forcing a single vendor.", tone: "green" },
                { title: "Coordination", body: "Federation, clash detection and issue management tools, ideally exchanging issues with BCF.", tone: "amber" },
                { title: "Checking and validation", body: "Rule-based model checking, IFC validation and information delivery specification checks to automate QA.", tone: "purple" },
                { title: "Asset information", body: "CAFM, asset registers and digital twin platforms that receive structured handover data.", tone: "teal" },
              ],
            },
            {
              kind: "text",
              title: "openBIM and interoperability",
              body: [
                "openBIM means exchanging information through open, vendor-neutral standards so that teams can use different tools and clients are not locked in. The main ones are IFC for models, BCF for issues, IDS for machine-readable information requirements and bSDD for shared data dictionary content, all promoted by buildingSMART International.",
                "Interoperability does not happen by default. Agree IFC versions and model view definitions, map properties from authoring tools to IFC property sets, and test exports during mobilization rather than at the first deadline.",
              ],
            },
            {
              kind: "callout",
              title: "Avoid tool-first implementation",
              body: "Buying a CDE or authoring tool before the information standard and workflows are agreed usually means configuring the tool twice. Define the process, then configure the technology to it.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ Standards
        {
          id: "standards",
          label: "Standards",
          blocks: [
            {
              kind: "table",
              title: "Core standards for BIM implementation",
              columns: ["Standard", "Subject", "Why it matters for implementation"],
              rows: [
                ["ISO 19650-1", "Concepts and principles", "Shared vocabulary and the requirements and information model hierarchy"],
                ["ISO 19650-2", "Delivery phase", "The eight-activity process (5.1 to 5.8) your project procedures follow"],
                ["ISO 19650-3", "Operational phase", "Managing the asset information model and trigger events in operation"],
                ["ISO 19650-4", "Information exchange", "Criteria and process for each exchange and CDE transition"],
                ["ISO 19650-5", "Security-minded approach", "Assessing sensitivity and applying proportionate security controls"],
                ["ISO 7817-1", "Level of information need", "Method for specifying geometry, information and documentation by purpose and milestone"],
                ["ISO 12006-2 and Uniclass", "Classification framework", "Uniclass is a UK classification system aligned with the ISO 12006-2 framework"],
                ["ISO 16739 (IFC)", "Industry Foundation Classes", "Open data schema for exchanging models; IFC 4.3 extends to infrastructure"],
                ["BS 1192-4 (COBie)", "Facility information exchange", "Structured handover data for operation and maintenance"],
                ["ISO 23386", "Properties in data dictionaries", "Methodology to describe, author and maintain properties consistently"],
                ["ISO 23387", "Data templates", "Structuring product data templates linked to data dictionaries"],
                ["National annexes and frameworks", "Local application", "For example the UK National Annex to ISO 19650-2 and the UK BIM Framework guidance"],
              ],
            },
            {
              kind: "cards",
              title: "Using standards sensibly",
              cards: [
                { title: "Adopt, then adapt", body: "Use the international standards as written and record any local choices in your information standard, rather than rewriting them.", tone: "blue" },
                { title: "Buy the licensed text", body: "Guidance like this hub paraphrases the standards. Teams who write procedures need the licensed editions.", tone: "amber" },
                { title: "Check editions", body: "Standards are revised. Record which edition each procedure references and review when new editions are published.", tone: "red" },
                { title: "Follow national guidance", body: "National annexes and frameworks fill in details such as naming fields and roles. Apply the one for the project's jurisdiction.", tone: "green" },
              ],
            },
            {
              kind: "faq",
              title: "Standards questions",
              items: [
                { q: "Do we need to comply with every part of ISO 19650?", a: "No. Parts 1 and 2 are central for delivery. Part 3 matters if you own or operate assets, Part 5 when information is sensitive. Apply what your role and projects require." },
                { q: "Is LOD the same as level of information need?", a: "No. LOD schemes describe model development. Level of information need, as set out in ISO 7817-1, covers geometry, alphanumeric information and documentation together, tied to purpose and milestone." },
                { q: "Is COBie still required?", a: "Many clients still ask for COBie or COBie-like data for handover. Specify what the client actually needs in the AIR and EIR, whether COBie, IFC or a direct CAFM import." },
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ KPIs
        {
          id: "kpis",
          label: "KPIs",
          blocks: [
            {
              kind: "table",
              title: "Implementation KPIs",
              columns: ["KPI", "Definition", "How measured", "Target guidance"],
              rows: [
                ["Process adoption", "Share of eligible projects using the mandated ISO 19650 process", "Project register against policy threshold", "Increase steadily towards all eligible projects"],
                ["Information standard compliance", "Share of containers passing naming and metadata checks first time", "Automated CDE or checker reports", "Rising trend; set internal targets from baseline"],
                ["First-time acceptance", "Share of deliverables accepted by the appointing party without rework", "CDE review and acceptance records", "Improve on baseline each quarter"],
                ["Overdue deliverables", "Containers delivered after their MIDP date", "MIDP against CDE dates", "Low and falling"],
                ["Clash and issue closure", "Average time to close coordination issues", "Issue tracker or BCF records", "Shorter cycle time than baseline"],
                ["RFIs and rework", "RFIs or rework items attributable to information quality", "Project logs, categorised", "Reduction against comparable past projects"],
                ["Training coverage", "Staff in each role who completed role-based training", "Training records", "Near complete for key roles before mandate"],
                ["Supply chain capability", "Appointed parties assessed and meeting minimum capability", "Capability assessment records", "All key appointments assessed"],
                ["Handover data quality", "Asset data complete and valid against the AIR at handover", "Validation reports against AIR", "High completeness before practical completion"],
                ["Maturity score", "Overall internal maturity assessment", "Annual assessment with fixed criteria", "Agreed improvement per year"],
              ],
            },
            {
              kind: "stats",
              title: "Setting targets without inventing benchmarks",
              stats: [
                { value: "Baseline first", label: "Measure two or three recent projects before setting targets" },
                { value: "Trend over point", label: "Judge KPIs by direction of travel rather than one-off values" },
                { value: "Few and owned", label: "A small set of KPIs, each with a named owner, beats a long dashboard" },
              ],
            },
            {
              kind: "callout",
              title: "Measure what you can automate",
              body: "KPIs that depend on manual data collection tend to lapse. Prefer measures you can pull from the CDE, issue tracker and checking tools.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Common mistakes
        {
          id: "mistakes",
          label: "Common mistakes",
          blocks: [
            {
              kind: "table",
              title: "Mistakes and fixes",
              columns: ["Mistake", "Consequence", "Fix"],
              rows: [
                ["Treating BIM as a software purchase", "Tools configured without a process; low adoption", "Define standards and workflows first, then configure tools"],
                ["No executive sponsor", "Programme stalls when budgets tighten", "Name a sponsor accountable for the business case"],
                ["Generic, copied EIRs", "Requirements that do not reflect what the client needs", "Derive EIRs from OIR, AIR and project purpose"],
                ["BEP written only to win the tender", "Plan not followed during delivery", "Review the BEP at every stage gate and keep it current"],
                ["Over-specifying information", "Wasted modelling effort and cost", "Specify the level of information need by purpose and milestone"],
                ["Ignoring the supply chain", "Inconsistent quality from consultants and contractors", "Brief and assess capability before appointment"],
                ["Training once, then stopping", "Skills fade and new starters miss out", "Role-based training with refreshers and onboarding"],
                ["Too many KPIs", "Nobody acts on them", "Track a small set with owners and review monthly"],
                ["Late interoperability testing", "IFC exchanges fail at deadlines", "Test exchanges in mobilization"],
                ["Skipping lessons learned", "The same problems repeat", "Hold lessons sessions and update templates each time"],
              ],
            },
            {
              kind: "checklist",
              title: "Health check for your implementation",
              items: [
                "Sponsor and lead are named and active",
                "Information standard and CDE procedure are published and current",
                "House templates are used on live projects",
                "Role-based training records are up to date",
                "Supply chain capability is assessed before appointment",
                "KPIs are reviewed by the steering group",
                "Lessons learned feed back into templates",
              ],
            },
            {
              kind: "callout",
              title: "Simplicity wins",
              body: "If a procedure is too complex for project teams to follow under pressure, it will be ignored. Keep standards short, link to detail, and remove steps that nobody uses.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ AI tools
        {
          id: "ai",
          label: "AI tools",
          blocks: [
            { kind: "widget", widget: "ask-ai", title: "Ask AI about BIM implementation" },
            { kind: "widget", widget: "generate", title: "Draft a BIM implementation strategy", docType: "BIM implementation strategy" },
            {
              kind: "callout",
              title: "Make it yours",
              body: "Use the generated strategy as a first draft. Replace generic statements with your own business drivers, baseline data, roles and timescales before it goes to the steering group.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "How should a mid-sized design practice phase its ISO 19650 implementation?",
    "Which KPIs best show whether our BIM implementation is working?",
    "How do I assess the capability and capacity of our supply chain?",
    "What should a BIM implementation business case include for the board?",
  ],
};
