import type { Hub } from "./types";

// ISO/IEC 42001:2023 — AI management system (AIMS), explained for BIM and engineering firms.
// Clause and Annex A numbers follow shared/data/iso42001.ts. The text paraphrases; it never quotes the standard.

export const iso42001Hub: Hub = {
  id: "iso42001",
  tone: "purple",
  eyebrow: "ISO/IEC 42001 · AI MANAGEMENT SYSTEM",
  title: "ISO/IEC 42001 AI management system",
  intro:
    "ISO/IEC 42001:2023 sets the requirements for an AI management system (AIMS): the policies, roles, risk processes and controls an organisation uses to develop, provide or use AI responsibly. This hub explains the clauses and Annex A controls in plain terms, shows how they apply to a BIM consultancy using AI for design checks and document drafting, and links each step to the platform templates that help you produce the evidence.",
  sections: [
    // ======================================================================== OVERVIEW
    {
      id: "overview",
      label: "Overview",
      tabs: [
        {
          id: "what",
          label: "What an AIMS is",
          blocks: [
            {
              kind: "text",
              title: "An AI management system in plain terms",
              body: [
                "An AIMS is the set of rules, people and processes that keeps your use of AI under control. It answers simple questions: which AI systems do we use, what could go wrong, who is responsible, and how do we know it is working?",
                "ISO/IEC 42001 follows the same high-level structure as ISO 9001 and ISO/IEC 27001: clauses 4 to 10 set the management system requirements, and Annex A lists controls you select based on your risks.",
                "It is certifiable. An accredited certification body can audit your AIMS and issue a certificate, usually valid for three years with surveillance audits in between.",
              ],
            },
            {
              kind: "stats",
              title: "Key facts",
              stats: [
                { value: "2023", label: "Year ISO/IEC 42001 was published", source: "ISO/IEC" },
                { value: "7", label: "Requirement clauses (4 to 10)", source: "ISO/IEC 42001" },
                { value: "38", label: "Annex A controls in 9 control areas", source: "ISO/IEC 42001 Annex A" },
                { value: "3 years", label: "Typical certification cycle", source: "Certification practice" },
              ],
            },
            {
              kind: "callout",
              title: "It is about management, not the algorithm",
              body: "ISO/IEC 42001 does not tell you how to build a model. It asks you to show that AI is used for a defined purpose, its risks and impacts are assessed, controls are in place, and people stay accountable.",
              tone: "info",
            },
          ],
        },
        {
          id: "who",
          label: "Who it is for",
          blocks: [
            {
              kind: "cards",
              title: "AI roles an organisation can hold",
              cards: [
                { title: "AI provider", body: "Offers an AI product or service to others, such as a software vendor selling an automated model checker.", tone: "purple" },
                { title: "AI producer or developer", body: "Designs, trains or fine-tunes AI systems, such as a firm building its own clash classification model.", tone: "blue" },
                { title: "AI user", body: "Uses AI systems in its own work, such as a BIM consultancy using a language model to draft BEP sections.", tone: "green" },
                { title: "AI partner or customer", body: "Supplies data, tools or integration, or receives AI-assisted outputs, such as a client receiving AI-checked models.", tone: "amber" },
              ],
            },
            {
              kind: "text",
              title: "A typical BIM consultancy",
              body: [
                "Most design and BIM firms are AI users, and some are also developers when they build scripts, plug-ins or connectors around AI models.",
                "Typical systems in scope are general-purpose AI assistants for writing, AI features in authoring and checking tools, computer vision on site photos and in-house automations that call AI through an API or an MCP connector.",
              ],
            },
          ],
        },
        {
          id: "related",
          label: "Related standards",
          blocks: [
            {
              kind: "table",
              title: "Standards that work with ISO/IEC 42001",
              columns: ["Standard", "What it covers", "How it relates"],
              rows: [
                ["ISO/IEC 27001:2022", "Information security management system", "Same structure; many firms run one integrated system covering both"],
                ["ISO/IEC 23894:2023", "Guidance on AI risk management", "Helps you design the AI risk assessment in clauses 6.1.2 and 8.2"],
                ["ISO/IEC 42005:2025", "Guidance on AI system impact assessment", "Helps with the impact assessment in clauses 6.1.4 and 8.4 and Annex A.5"],
                ["ISO/IEC 22989:2022", "AI concepts and terminology", "Defines the vocabulary used in the AIMS"],
                ["ISO/IEC 42006", "Requirements for bodies that audit and certify an AIMS", "Relevant when choosing a certification body"],
                ["ISO 19650 series", "Information management for built assets", "AI outputs entering the CDE still follow ISO 19650 review and approval"],
              ],
            },
            {
              kind: "callout",
              title: "Regulation is separate",
              body: "Certification to ISO/IEC 42001 does not by itself prove legal compliance, for example with the EU AI Act. It gives you a structured way to collect the evidence that regulation may ask for.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ======================================================================== CLAUSES
    {
      id: "clauses",
      label: "Clauses 4–10",
      tabs: [
        {
          id: "c4-5",
          label: "Context and leadership",
          blocks: [
            {
              kind: "table",
              title: "Clauses 4 and 5",
              columns: ["Clause", "What it asks", "What auditors look for", "Platform template"],
              rows: [
                ["4.1 Context", "Understand internal and external issues, the purpose of your AI systems and your AI roles", "A context analysis that names your roles (user, developer, provider) and real issues", "AI-CTX"],
                ["4.2 Interested parties", "Identify who cares about your AI use and what they require", "A register with clients, staff, regulators and suppliers and their requirements", "AI-CTX"],
                ["4.3 Scope", "Set the boundaries of the AIMS", "A scope statement that matches the AI inventory, with justified exclusions", "AI-CTX, AI-INV"],
                ["4.4 AIMS", "Establish, run and improve the system", "Evidence the processes link together and are maintained", "All templates"],
                ["5.1 Leadership", "Top management leads and resources the AIMS", "Directors in reviews, budget and decisions on record", "AI-MR"],
                ["5.2 AI policy", "Set an AI policy that frames objectives", "An approved, communicated and reviewed policy", "AI-POL"],
                ["5.3 Roles", "Assign responsibilities and authorities", "A RACI and named owners for each AI system", "AI-RACI"],
              ],
            },
            {
              kind: "widget",
              widget: "generate",
              title: "Draft your AI policy",
              docType: "AI Policy",
            },
          ],
        },
        {
          id: "c6",
          label: "Planning",
          blocks: [
            {
              kind: "table",
              title: "Clause 6",
              columns: ["Clause", "What it asks", "What auditors look for", "Platform template"],
              rows: [
                ["6.1.1 Risks and opportunities", "Plan actions on risks and opportunities and set AI risk criteria", "Documented risk criteria: likelihood, consequence and acceptance levels", "AI-RISK"],
                ["6.1.2 AI risk assessment", "Identify, analyse and evaluate AI risks with a repeatable method", "A risk register per AI system using the agreed criteria", "AI-RISK"],
                ["6.1.3 AI risk treatment", "Choose treatments and controls, compare with Annex A, produce the SoA", "A treatment plan and a Statement of Applicability with justifications", "AI-RISK, SoA"],
                ["6.1.4 Impact assessment", "Assess consequences for individuals, groups and society", "Impact assessments for systems that affect people", "AISIA"],
                ["6.2 AI objectives", "Set measurable objectives and plan how to meet them", "Objectives with targets, owners, dates and results", "AI-OBJ"],
                ["6.3 Planning of changes", "Change the AIMS in a planned way", "Change records for new tools or major updates", "AI-CAPA"],
              ],
            },
            {
              kind: "callout",
              title: "Risk and impact are different",
              body: "The risk assessment looks at risks to your organisation and its objectives. The impact assessment looks outward, at the consequences for people and society. Auditors expect both.",
              tone: "info",
            },
          ],
        },
        {
          id: "c7-8",
          label: "Support and operation",
          blocks: [
            {
              kind: "table",
              title: "Clauses 7 and 8",
              columns: ["Clause", "What it asks", "What auditors look for", "Platform template"],
              rows: [
                ["7.1 Resources", "Provide what the AIMS needs", "Budget, tools and time allocated", "AI-MR"],
                ["7.2 Competence", "Make sure people affecting AI performance are competent", "Training records and a competence matrix", "AI-RACI"],
                ["7.3 Awareness", "People know the policy and their part", "Staff can explain the AI policy and how to report concerns", "AI-POL"],
                ["7.4 Communication", "Decide what is communicated, to whom and when", "A communication plan, including to clients", "AI-CTX"],
                ["7.5 Documented information", "Control AIMS documents and records", "Version control, approval and retention", "All templates"],
                ["8.1 Operational control", "Plan and control AI processes, including outsourced ones", "Life cycle procedures followed in practice", "AI-LC"],
                ["8.2 Risk assessment", "Repeat risk assessments at intervals or on change", "Dated reassessments after tool or model changes", "AI-RISK"],
                ["8.3 Risk treatment", "Carry out the treatment plan and check it works", "Evidence controls are operating", "AI-RISK"],
                ["8.4 Impact assessment", "Repeat impact assessments at intervals or on change", "Updated assessments when use or data changes", "AISIA"],
              ],
            },
          ],
        },
        {
          id: "c9-10",
          label: "Evaluation and improvement",
          blocks: [
            {
              kind: "table",
              title: "Clauses 9 and 10",
              columns: ["Clause", "What it asks", "What auditors look for", "Platform template"],
              rows: [
                ["9.1 Monitoring", "Decide what to measure, how and when, and evaluate results", "KPIs such as error rates in AI-drafted text and review coverage", "AI-OBJ"],
                ["9.2 Internal audit", "Audit the AIMS at planned intervals", "An audit programme, independent auditors and reports", "AI-AUD"],
                ["9.3 Management review", "Top management reviews the AIMS", "Minutes with inputs, decisions and actions", "AI-MR"],
                ["10.1 Continual improvement", "Keep improving the AIMS", "Improvements tracked over time", "AI-CAPA"],
                ["10.2 Nonconformity", "Fix problems, find causes and prevent repeats", "A corrective action log with root causes and closure", "AI-CAPA"],
              ],
            },
            {
              kind: "checklist",
              title: "Evidence auditors commonly ask for",
              items: [
                "AIMS scope statement and AI system inventory",
                "Approved AI policy and evidence it was communicated",
                "RACI with named owners",
                "AI risk criteria, risk register and treatment plan",
                "Statement of Applicability with reasons for each control",
                "Impact assessments for systems affecting people",
                "AI objectives with measured results",
                "Training records",
                "Internal audit report and management review minutes",
                "Corrective action log",
              ],
            },
          ],
        },
      ],
    },
    // ======================================================================== ANNEX A
    {
      id: "annex-a",
      label: "Annex A controls",
      tabs: [
        {
          id: "controls",
          label: "Control areas",
          blocks: [
            {
              kind: "table",
              title: "Annex A control areas",
              columns: ["Control area", "Objective in short", "Example evidence in a BIM firm"],
              rows: [
                ["A.2 Policies related to AI", "A documented AI policy aligned with other policies and reviewed", "AI policy referencing the information security policy and the BIM information standard"],
                ["A.3 Internal organization", "Clear AI roles and a way to report concerns", "RACI; a concerns channel on the intranet"],
                ["A.4 Resources for AI systems", "Document data, tools, computing and people used", "Inventory entries listing the model, data sources, hosting and competent users"],
                ["A.5 Assessing impacts of AI systems", "A process to assess and record impacts on people and society", "Impact assessment for site computer vision covering worker privacy"],
                ["A.6 AI system life cycle", "Responsible design, verification, deployment, monitoring and logging", "Validation tests for a clash triage model before use; event logs kept"],
                ["A.7 Data for AI systems", "Data management, quality, provenance and preparation", "Records of which project models trained a classifier and with whose permission"],
                ["A.8 Information for interested parties", "Information for users, external reporting and incident communication", "Note to clients on where AI was used in deliverables; incident contact"],
                ["A.9 Use of AI systems", "Responsible use within the intended purpose", "Rules that AI-drafted BEP text is reviewed by a named author"],
                ["A.10 Third-party and customer relationships", "Allocate responsibilities with suppliers and customers", "AI clauses in software contracts and appointments"],
              ],
            },
            {
              kind: "callout",
              title: "Controls are selected, not automatic",
              body: "You compare your risk treatment with Annex A and record in the Statement of Applicability which controls apply and why. Excluding a control is allowed when you can justify it.",
              tone: "info",
            },
          ],
        },
        {
          id: "key-controls",
          label: "Key controls in detail",
          blocks: [
            {
              kind: "cards",
              title: "Controls that matter most for BIM firms",
              cards: [
                { title: "A.4.3 Data resources", body: "Know which project data goes into each AI tool, including prompts and uploaded models.", tone: "purple" },
                { title: "A.5.4 Impact on individuals or groups", body: "Assess effects on workers, occupants and the public, for example from site monitoring.", tone: "red" },
                { title: "A.6.2.4 Verification and validation", body: "Define tests and acceptance criteria before an AI tool is relied on.", tone: "blue" },
                { title: "A.6.2.8 Event logs", body: "Decide when to log AI use so you can trace an output back to its source.", tone: "teal" },
                { title: "A.7.5 Data provenance", body: "Record where training and reference data came from and who owns it.", tone: "green" },
                { title: "A.9.4 Intended use", body: "Use AI only for the purposes recorded in the inventory and the supplier's documentation.", tone: "amber" },
                { title: "A.10.3 Suppliers", body: "Check AI vendors' terms on data retention, training on your data and hosting location.", tone: "purple" },
                { title: "A.8.4 Communication of incidents", body: "Plan how you tell users and clients when an AI tool fails or leaks data.", tone: "red" },
              ],
            },
          ],
        },
      ],
    },
    // ======================================================================== AI IN BIM
    {
      id: "ai-bim",
      label: "AI in BIM",
      tabs: [
        {
          id: "use-cases",
          label: "Use cases and risks",
          blocks: [
            {
              kind: "table",
              title: "AI use cases, risks and controls",
              columns: ["Use case", "Main risks", "Controls", "Annex A"],
              rows: [
                ["Generative design options", "IP ownership of outputs; options that ignore constraints", "Contract terms on IP; designer approves every option", "A.10.2, A.9.2"],
                ["Clash triage and grouping", "Real clashes hidden as false positives; over-reliance", "Sample-check AI groupings; human decides status changes", "A.6.2.4, A.9.4"],
                ["Document review and drafting (EIR, BEP)", "Hallucinated requirements or clause references; data leakage", "Named author checks every clause reference; approved tools only", "A.9.2, A.4.3"],
                ["Automated model checking", "Rules applied wrongly; missed errors", "Validate rule sets against known test models", "A.6.2.4, A.6.2.6"],
                ["MCP connectors to authoring tools", "Unintended changes to models; broad data access", "Least-privilege access; read-only by default; logged actions", "A.6.2.8, A.4.4"],
                ["Site photo analysis", "Worker privacy; bias in detection", "Impact assessment; consent and retention rules", "A.5.4, A.7.4"],
              ],
            },
            {
              kind: "cards",
              title: "Five risks to name in every assessment",
              cards: [
                { title: "Data leakage", body: "Project or client data sent to a public AI service that keeps or trains on it.", tone: "red" },
                { title: "Hallucinated requirements", body: "Plausible but wrong clauses, standards or quantities in drafted documents.", tone: "amber" },
                { title: "Intellectual property", body: "Unclear ownership of AI outputs and of the data used to produce them.", tone: "purple" },
                { title: "Bias", body: "Models that perform worse for some building types, regions or groups of people.", tone: "blue" },
                { title: "Over-reliance", body: "Staff accepting AI output without the checks they would apply to a colleague's work.", tone: "teal" },
              ],
            },
          ],
        },
        {
          id: "inventory",
          label: "Inventory example",
          blocks: [
            {
              kind: "table",
              title: "AI system inventory (example, AI-INV)",
              columns: ["System", "Purpose", "Our role", "Data used", "Owner", "Risk level"],
              rows: [
                ["Enterprise AI assistant", "Drafting and summarising BEP, EIR and meeting notes", "User", "Project documents, no personal data", "BIM manager", "Medium"],
                ["Clash triage add-in", "Grouping and ranking clashes in federated models", "User", "Federated coordination models", "Lead BIM coordinator", "Medium"],
                ["In-house IDS checker with AI explanations", "Explaining failed checks to modellers", "Developer", "IFC models and IDS files", "Digital lead", "Low"],
                ["MCP connector to authoring tool", "Querying and batch-editing model parameters", "Developer and user", "Live authoring models", "Digital lead", "High"],
                ["Site progress vision service", "Comparing site photos with the 4D model", "User", "Site photos that may show workers", "Project director", "High"],
              ],
            },
            {
              kind: "callout",
              title: "Start with the inventory",
              body: "Your scope, risk assessment, impact assessments and Statement of Applicability all depend on knowing which AI systems you have. Include AI features inside existing software, not only stand-alone tools.",
              tone: "ok",
            },
          ],
        },
        {
          id: "impact",
          label: "Impact assessment example",
          blocks: [
            {
              kind: "steps",
              title: "Worked example: site progress vision service (AISIA)",
              steps: [
                { title: "Describe the system", body: "Cameras and phone photos are compared with the 4D model to report progress each week. A vendor hosts the model." },
                { title: "Identify who is affected", body: "Site workers in the photos, subcontractors whose progress is reported and the client relying on the reports." },
                { title: "Assess impacts on individuals", body: "Workers could be identified and monitored without knowing. Wrong progress data could affect subcontractor payments." },
                { title: "Assess wider impacts", body: "Low societal impact, but trust on site could suffer if monitoring feels covert." },
                { title: "Decide treatments", body: "Blur faces before upload, tell workers through site induction, keep photos for a limited period and have a person confirm any payment-related report." },
                { title: "Record and review", body: "Record the assessment, link it to the risk register and review it when the vendor, cameras or use change." },
              ],
            },
            {
              kind: "table",
              title: "Impact summary",
              columns: ["Impact", "Severity before", "Treatment", "Severity after"],
              rows: [
                ["Worker privacy", "High", "Face blurring, notice, limited retention", "Low"],
                ["Unfair payment decisions", "Medium", "Human confirmation of reports", "Low"],
                ["Loss of trust on site", "Medium", "Clear communication and a concerns channel", "Low"],
              ],
            },
          ],
        },
      ],
    },
    // ======================================================================== IMPLEMENTATION
    {
      id: "implementation",
      label: "Implementation",
      tabs: [
        {
          id: "roadmap",
          label: "12-step roadmap",
          blocks: [
            {
              kind: "steps",
              title: "Implementing an AIMS in 12 steps",
              steps: [
                { title: "1. Get leadership backing", body: "Agree why you want an AIMS, the budget and a named AIMS lead." },
                { title: "2. Build the AI inventory", body: "List every AI system and AI feature in use or planned (AI-INV)." },
                { title: "3. Analyse context and parties", body: "Record issues, AI roles and interested parties (AI-CTX)." },
                { title: "4. Set the scope", body: "Decide which offices, services and systems the AIMS covers." },
                { title: "5. Write the AI policy", body: "Approve and communicate the policy (AI-POL)." },
                { title: "6. Assign roles", body: "Name owners and complete the RACI (AI-RACI)." },
                { title: "7. Assess AI risks", body: "Set criteria, then assess each system (AI-RISK)." },
                { title: "8. Assess impacts", body: "Complete impact assessments where people may be affected (AISIA)." },
                { title: "9. Select controls and write the SoA", body: "Compare treatments with Annex A and justify each decision (SoA)." },
                { title: "10. Set objectives and run controls", body: "Set measurable objectives (AI-OBJ) and follow the life cycle procedure (AI-LC)." },
                { title: "11. Audit and review", body: "Run an internal audit (AI-AUD) and a management review (AI-MR)." },
                { title: "12. Correct and certify", body: "Close nonconformities (AI-CAPA), then book the stage 1 and stage 2 audits." },
              ],
            },
          ],
        },
        {
          id: "soa",
          label: "Statement of Applicability",
          blocks: [
            {
              kind: "text",
              title: "Writing a good SoA",
              body: [
                "The Statement of Applicability lists every Annex A control, says whether it applies, explains why and states whether it is implemented.",
                "Link each decision to the risk treatment plan. A control that applies should point to evidence, such as a procedure, a record or a contract clause.",
                "Keep it current. Update it when you add an AI system, change a supplier or close a corrective action.",
              ],
            },
            {
              kind: "table",
              title: "SoA example rows",
              columns: ["Control", "Applies?", "Justification", "Status"],
              rows: [
                ["A.6.2.4 Verification and validation", "Yes", "We rely on AI clash triage; outputs must be validated", "Implemented"],
                ["A.7.2 Data for development", "Yes", "We fine-tune a classifier on project data", "In progress"],
                ["A.6.2.5 Deployment", "Yes", "In-house tools are deployed to staff", "Implemented"],
                ["A.8.3 External reporting", "Yes", "Clients need a way to report problems with AI-assisted deliverables", "Planned"],
              ],
            },
            {
              kind: "callout",
              title: "Avoid blanket exclusions",
              body: "Excluding whole control areas because 'we only use AI' is a common audit finding. Users still need controls on data, intended use, suppliers and information for interested parties.",
              tone: "warn",
            },
          ],
        },
        {
          id: "certification",
          label: "Audit and certification",
          blocks: [
            {
              kind: "steps",
              title: "From internal audit to certificate",
              steps: [
                { title: "Internal audit", body: "Audit all clauses and the applicable controls using auditors who do not audit their own work." },
                { title: "Management review", body: "Top management reviews audit results, objectives, risks and resources and records decisions." },
                { title: "Choose a certification body", body: "Pick an accredited body that offers ISO/IEC 42001 certification." },
                { title: "Stage 1 audit", body: "The auditor reviews documents and readiness, often remotely, and raises any concerns." },
                { title: "Stage 2 audit", body: "The auditor tests that the AIMS works in practice through interviews, records and sampling." },
                { title: "Certificate and surveillance", body: "After nonconformities are closed, the certificate is issued, with surveillance audits each year and recertification after three years." },
              ],
            },
            {
              kind: "checklist",
              title: "Readiness checklist",
              items: [
                "Scope approved and consistent with the inventory",
                "AI policy approved, published and understood by staff",
                "Risk and impact assessments complete for all in-scope systems",
                "SoA complete with justifications and evidence references",
                "Objectives set and at least one round of results measured",
                "Training delivered and recorded",
                "Internal audit completed across all clauses",
                "Management review held and minuted",
                "Corrective actions raised and on track",
                "Supplier terms for AI tools reviewed",
              ],
            },
          ],
        },
      ],
    },
    // ======================================================================== LEARN
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
                { q: "Do we need ISO/IEC 42001 if we only use AI tools?", a: "It is voluntary, but users are in scope. If clients ask how you control AI in deliverables, an AIMS gives you a clear answer." },
                { q: "Can we combine it with ISO/IEC 27001?", a: "Yes. Both share the same structure, so policy, document control, audit and management review can be shared." },
                { q: "Is ChatGPT-style use in scope?", a: "Yes. General-purpose AI assistants used for work belong in the inventory and the risk assessment." },
                { q: "What is the difference between the risk assessment and the impact assessment?", a: "The risk assessment covers risks to the organisation and its objectives. The impact assessment covers consequences for people and society." },
                { q: "Do we have to apply every Annex A control?", a: "No. You decide based on your risks and record the reasons in the Statement of Applicability." },
                { q: "How long does implementation take?", a: "For a small or medium firm, several months is typical. It depends on the number of AI systems and existing management systems." },
                { q: "Who should own the AIMS?", a: "A named AIMS lead with top management support. Each AI system also needs an owner." },
                { q: "Does certification prove we meet the EU AI Act?", a: "No. It helps you organise evidence, but legal obligations must be checked separately." },
                { q: "How does it fit with ISO 19650?", a: "AI outputs that enter the CDE still go through ISO 19650 checking, review and approval. The AIMS adds controls on how the AI was used." },
                { q: "Should AI-drafted documents be labelled?", a: "Many firms record AI assistance in the revision notes. Agree the approach with clients and set it in your AI policy." },
                { q: "What about MCP connectors?", a: "Treat each connector as an AI system or a component of one. Limit its permissions, log its actions and assess the risk of unintended model changes." },
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
              title: "Check your understanding",
              questions: [
                { q: "Which clause requires the AI policy?", options: ["4.3", "5.2", "9.2"], answer: 1, why: "Clause 5.2 covers the AI policy." },
                { q: "Where do you justify which Annex A controls apply?", options: ["In the Statement of Applicability", "In the BEP", "In the AI inventory"], answer: 0, why: "The SoA records each control, whether it applies and why." },
                { q: "Which assessment looks at consequences for people and society?", options: ["AI risk assessment", "AI system impact assessment", "Internal audit"], answer: 1, why: "The impact assessment (6.1.4 and 8.4) looks outward at individuals, groups and society." },
                { q: "A BIM firm using an AI assistant to draft BEPs is mainly an...", options: ["AI provider", "AI user", "Certification body"], answer: 1, why: "It uses an AI system in its own work." },
                { q: "Which control area covers data provenance?", options: ["A.3", "A.7", "A.10"], answer: 1, why: "A.7 covers data for AI systems, including provenance (A.7.5)." },
                { q: "Which guidance standard supports AI risk management?", options: ["ISO/IEC 23894", "ISO 19650-4", "ISO 7817-1"], answer: 0, why: "ISO/IEC 23894:2023 gives guidance on AI risk management." },
                { q: "What happens in a stage 2 certification audit?", options: ["Only documents are read", "The AIMS is tested in practice", "The certificate is withdrawn"], answer: 1, why: "Stage 2 checks that the system works through interviews, records and sampling." },
                { q: "What is the best control for hallucinated clause references in AI-drafted EIRs?", options: ["Trust the tool's confidence score", "A named author checks every reference", "Remove all references"], answer: 1, why: "Human review against the source is the practical control for responsible use (A.9.2)." },
              ],
            },
          ],
        },
        {
          id: "ai",
          label: "Ask AI & generate",
          blocks: [
            { kind: "widget", widget: "ask-ai", title: "Ask AI about ISO/IEC 42001" },
            { kind: "widget", widget: "generate", title: "Generate an AI policy", docType: "AI Policy" },
            {
              kind: "links",
              title: "Official sources",
              links: [
                { label: "ISO/IEC 42001:2023", href: "https://www.iso.org/standard/81230.html", note: "ISO page for the AI management system standard", tone: "purple" },
                { label: "NIST AI Risk Management Framework", href: "https://www.nist.gov/itl/ai-risk-management-framework", note: "Voluntary AI risk framework that maps well to the AIMS", tone: "blue" },
                { label: "EU AI Act", href: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", note: "Regulation (EU) 2024/1689", tone: "amber" },
              ],
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "Which AI systems in a BIM consultancy should go in the AIMS inventory?",
    "How do I write a Statement of Applicability for an AI user?",
    "Walk me through an impact assessment for AI clash triage.",
    "How can we integrate ISO/IEC 42001 with our ISO/IEC 27001 system?",
  ],
};
