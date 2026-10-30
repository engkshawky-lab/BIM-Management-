import type { Hub } from "./types";

// CDE hub: the common data environment as solution and workflow, framed against ISO 19650-1/-2 and
// the UK National Annex. Content is paraphrased practical guidance, not the text of any standard.
// Suitability and revision codes match shared/data/iso19650.ts and shared/data/workflow/docflow.ts.
// Platform descriptions are neutral and general; features change between releases, so always check
// the current version and the vendor's own documentation.

export const cdeHub: Hub = {
  id: "cde",
  tone: "teal",
  eyebrow: "REFERENCE · COMMON DATA ENVIRONMENT",
  title: "CDE deep guide",
  intro:
    "The common data environment is where every information container on a project is stored, checked, shared, approved and archived. This guide explains the four CDE states and the metadata behind them, the UK National Annex suitability and revision codes, how to set up containers, permissions and approval workflows, how common CDE platforms compare, and how to run the CDE day to day through to close-out.",
  sections: [
    // ==================================================================== 1. Fundamentals
    {
      id: "fundamentals",
      label: "Fundamentals",
      tabs: [
        {
          id: "what",
          label: "What a CDE is",
          blocks: [
            {
              kind: "text",
              title: "A solution and a workflow, not just software",
              body: [
                "ISO 19650 describes the common data environment as the agreed source of information for a project or asset. It is where each information container is collected, managed and shared through a controlled process.",
                "A CDE has two parts. The first is the technology: one or more systems that store containers, hold their metadata and record every action. The second is the workflow: the agreed rules for who can create, check, share, approve and archive information, and when.",
                "Buying a document management product does not give you a CDE. A shared drive with strict rules can work for a small project, and an expensive platform without agreed rules quickly becomes a dumping ground. The workflow is what makes the difference.",
              ],
            },
            {
              kind: "cards",
              title: "What a working CDE gives the project",
              cards: [
                { title: "One source of truth", body: "Everyone works from the same current revision, so nobody builds or prices from an out-of-date drawing.", tone: "teal" },
                { title: "Controlled sharing", body: "Information moves from one team to another only after it has been checked and given a suitability code.", tone: "blue" },
                { title: "Clear status", body: "Every container shows whether it is work in progress, shared, published or archived, and what it may be used for.", tone: "green" },
                { title: "Audit trail", body: "Every upload, status change, approval and download is recorded with who did it and when.", tone: "amber" },
                { title: "Security", body: "Access is limited by role and by need to know, which supports a security-minded approach.", tone: "red" },
                { title: "Handover ready", body: "Published and archived information becomes the record that feeds the asset information model.", tone: "purple" },
              ],
            },
            {
              kind: "table",
              title: "Who provides and who uses the CDE",
              columns: ["Party", "Typical role in the CDE"],
              rows: [
                ["Appointing party", "Establishes the project CDE, or makes sure one is provided, before appointments start. Owns the published and archived record."],
                ["Lead appointed party", "Uses the project CDE for its delivery team, may run a separate WIP area for its own teams, and coordinates sharing and submissions."],
                ["Task teams", "Create and check information in WIP, share it for coordination and respond to comments."],
                ["Information manager", "Configures containers, permissions, metadata and workflows, and monitors compliance."],
                ["Operator or facility manager", "Receives the published and archived record and uses it for the asset information model."],
              ],
            },
            {
              kind: "callout",
              title: "The CDE should exist before the first appointment",
              body: "The appointing party is expected to set up, or arrange, the project CDE early, so that the tender information and the first deliverables already move through it. Setting it up after design has started means importing chaos.",
              tone: "info",
            },
          ],
        },
        {
          id: "states",
          label: "The four states",
          blocks: [
            {
              kind: "graphic",
              graphic: "cde-states",
              title: "The four CDE states",
              caption: "Information starts in Work in progress, is checked and moved to Shared for coordination, is authorised and accepted into Published, and is moved to Archived when it is superseded or the project closes.",
            },
            {
              kind: "table",
              title: "What each state means",
              columns: ["State", "Who can see it", "What it is for", "Typical codes"],
              rows: [
                ["Work in progress (WIP)", "Only the task team that owns it", "Developing information before it is checked", "S0, revisions such as P01.01"],
                ["Shared", "The wider delivery team and, where agreed, the appointing party", "Coordination, information, review and comment, and submissions for approval", "S1 to S4, S6, S7, revisions such as P01"],
                ["Published", "Everyone who needs to use it, including the appointing party", "Authorised and accepted information that can be used for construction or operation", "A1 to An, B1 to Bn, CR, revisions such as C01"],
                ["Archived", "Read only, controlled access", "A record of every superseded and final container, kept for the audit trail and the asset record", "The last status and revision at the time of archiving"],
              ],
            },
            {
              kind: "steps",
              title: "The normal journey of a container",
              steps: [
                { title: "Create in WIP", body: "The task team creates the container with a compliant name and fills in the required metadata." },
                { title: "Check, review and approve", body: "The task team checks the content, format and naming, and the task team lead approves it for sharing." },
                { title: "Share", body: "The container moves to Shared with a suitability code and a whole revision, for example S1 and P01." },
                { title: "Coordinate and comment", body: "Other teams use it as a reference, raise comments and issues, and the owner revises it in WIP as P02.01." },
                { title: "Authorise", body: "The lead appointed party reviews the full information model for the milestone and authorises it for submission." },
                { title: "Accept and publish", body: "The appointing party reviews and accepts it, and the container is published with an A or B code and a C revision." },
                { title: "Archive", body: "When a newer revision is published, or at project close, the container moves to Archived and stays as a record." },
              ],
            },
            {
              kind: "callout",
              title: "Information does not go backwards",
              body: "A shared or published container is never edited in place. Changes always start as a new WIP revision, which is then checked and shared again. This keeps the history honest.",
              tone: "warn",
            },
          ],
        },
        {
          id: "metadata",
          label: "Metadata",
          blocks: [
            {
              kind: "text",
              title: "Why metadata matters",
              body: [
                "Metadata is the information about a container rather than inside it. The CDE uses it to decide who can see the container, what it can be used for and how it is filtered, reported and found.",
                "ISO 19650 expects each container to carry at least a status, a revision and a classification. Most projects add more fields, such as originator, title and stage, from the project information standard.",
              ],
            },
            {
              kind: "table",
              title: "Core metadata fields",
              columns: ["Field", "What it records", "Example"],
              rows: [
                ["Status (suitability)", "What the information may be used for", "S2, suitable for information"],
                ["Revision", "Which version of the container this is", "P02 when shared, P02.03 in WIP, C01 when published"],
                ["Classification", "What the container is about, using the agreed system", "A Uniclass code and title"],
                ["Unique identifier", "The container name from the naming convention", "PRJ01-ABC-ZZ-00-M3-A-0001"],
                ["Title or description", "A human-readable description", "Ground floor general arrangement"],
                ["Originator", "The organisation responsible for the container", "ABC Architects"],
                ["Stage or milestone", "The delivery milestone it belongs to", "Stage 3 spatial coordination"],
                ["Security classification", "Any sensitivity or access restriction", "Restricted to named roles"],
              ],
            },
            {
              kind: "checklist",
              title: "Metadata quality checks",
              items: [
                "Status and revision in the metadata match the title block or file properties",
                "The container name follows the project naming convention exactly",
                "Classification uses the agreed table and is not left blank",
                "Mandatory fields are enforced by the CDE, not left to memory",
                "Pick lists are used instead of free text wherever possible",
                "Metadata is checked as part of the review before sharing",
              ],
            },
            {
              kind: "callout",
              title: "Status in the file name is a trap",
              body: "Some teams add the status and revision to the file name. When the status changes, the name changes, links break and duplicates appear. Keep status and revision as metadata fields unless the project information standard says otherwise.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ==================================================================== 2. Status & revision codes
    {
      id: "codes",
      label: "Status & revision codes",
      tabs: [
        {
          id: "suitability",
          label: "Suitability codes",
          blocks: [
            {
              kind: "text",
              title: "UK National Annex suitability codes",
              body: [
                "The UK National Annex to ISO 19650-2 gives a set of standard suitability codes. The code tells the receiver what a container may be used for. It does not say how good it is.",
                "Code meanings can differ between editions of the Annex and between projects. Some older lists include codes that later editions withdrew. Always follow the codes set out in your project information standard.",
              ],
            },
            {
              kind: "table",
              title: "Suitability codes and when to use them",
              columns: ["Code", "State", "Meaning", "When to use it"],
              rows: [
                ["S0", "WIP", "Initial status or work in progress", "Any container still being developed inside the task team"],
                ["S1", "Shared", "Suitable for coordination", "Models and drawings shared so other teams can coordinate against them"],
                ["S2", "Shared", "Suitable for information", "Information others may read but should not rely on for design decisions"],
                ["S3", "Shared", "Suitable for review and comment", "Information sent to another party, often the client, for comments"],
                ["S4", "Shared", "Suitable for stage approval", "Information submitted for sign-off at the end of a stage"],
                ["S6", "Shared", "Suitable for PIM authorisation", "The project information model submitted for authorisation and acceptance at a delivery milestone"],
                ["S7", "Shared", "Suitable for AIM authorisation", "Asset information submitted for acceptance into the asset information model"],
                ["A1, A2 to An", "Published", "Authorised and accepted, for stage n", "Information formally accepted by the appointing party, for example for construction"],
                ["B1, B2 to Bn", "Published", "Partially authorised and accepted, with comments", "Information accepted with minor comments that must be addressed in the next revision"],
                ["CR", "Published", "As-constructed record", "The final record of what was built, for handover and the asset record"],
              ],
            },
            {
              kind: "cards",
              title: "Choosing the right code",
              cards: [
                { title: "Ask who will use it", body: "If another team will coordinate against it, use S1. If they just need to know about it, S2 is enough.", tone: "blue" },
                { title: "Ask what they will do", body: "Comments wanted means S3. A formal sign-off at the end of a stage means S4.", tone: "teal" },
                { title: "Milestone submissions", body: "Use S6 for the delivery milestone package and S7 for asset information at handover.", tone: "purple" },
                { title: "Published codes are the client's", body: "Only the appointing party's acceptance gives an A or B code. The delivery team never sets these itself.", tone: "red" },
              ],
            },
            {
              kind: "callout",
              title: "A suitability code is not a quality stamp",
              body: "S1 does not mean the model is good. It means it is fit to be used for coordination. Quality comes from the check, review and approve step that happens before sharing.",
              tone: "info",
            },
          ],
        },
        {
          id: "revisions",
          label: "Revision convention",
          blocks: [
            {
              kind: "text",
              title: "P and C revisions",
              body: [
                "The UK National Annex uses P for preliminary revisions, which cover WIP and Shared, and C for contractual revisions, which are used once information is published.",
                "A whole number such as P01 marks a revision that has been shared. A decimal suffix such as P01.01 marks a version still in WIP. When P01.03 is checked and shared, it becomes P01. The next round of work starts as P02.01 and is shared as P02.",
              ],
            },
            {
              kind: "table",
              title: "Revision examples through a container's life",
              columns: ["Event", "State", "Revision", "Status"],
              rows: [
                ["First draft created", "WIP", "P01.01", "S0"],
                ["Further work before sharing", "WIP", "P01.02, P01.03", "S0"],
                ["Shared for coordination", "Shared", "P01", "S1"],
                ["Revised after comments", "WIP", "P02.01", "S0"],
                ["Shared again for review", "Shared", "P02", "S3"],
                ["Submitted at the milestone", "Shared", "P03", "S6"],
                ["Accepted by the appointing party", "Published", "C01", "A1"],
                ["Contractual change issued", "Published", "C02", "A2"],
                ["Superseded or project closed", "Archived", "Last revision kept", "Last status kept"],
              ],
            },
            {
              kind: "list",
              title: "Revision rules that avoid confusion",
              items: [
                "Never reuse a revision. Once P02 has been shared, the next change is P03.",
                "Only one shared revision of a container is current at a time. The previous one is marked as superseded.",
                "WIP suffixes never leave the task team. Nothing with a decimal suffix should appear in Shared.",
                "Keep the revision history on the drawing or in the file properties in step with the CDE metadata.",
                "Record a short reason for each revision so reviewers know what changed.",
              ],
            },
            {
              kind: "callout",
              title: "Follow the project's own convention",
              body: "Some clients use different prefixes or extra letters for tender or construction issues. The project information standard and the BEP should state the convention and give worked examples.",
              tone: "warn",
            },
          ],
        },
        {
          id: "transitions",
          label: "Transitions & approvals",
          blocks: [
            {
              kind: "table",
              title: "Who approves each transition",
              columns: ["Transition", "Activity", "Who does it", "Who approves"],
              rows: [
                ["WIP to Shared", "Check, review and approve for sharing", "Task team author and checker", "Task team lead"],
                ["Shared to WIP (new revision)", "Respond to comments and revise", "Task team author", "Task team lead, at the next sharing"],
                ["Shared to Shared for submission (S6 or S7)", "Review and authorise the information model", "Lead appointed party information manager", "Lead appointed party"],
                ["Shared to Published", "Review and accept the submission", "Appointing party reviewers", "Appointing party"],
                ["Published to Archived", "Supersede or close out", "Information manager", "Appointing party, through the agreed process"],
                ["Rejected submission", "Return with reasons and a resubmission date", "Appointing party", "Appointing party"],
              ],
            },
            {
              kind: "process",
              title: "Status transitions by party",
              lanes: [
                { id: "tt", label: "Task team", tone: "blue" },
                { id: "lap", label: "Lead appointed party", tone: "teal" },
                { id: "ap", label: "Appointing party", tone: "green" },
              ],
              steps: [
                {
                  id: "wip",
                  title: "Produce in WIP",
                  subtitle: "S0 · P01.01",
                  lane: "tt",
                  clause: "ISO 19650-2, collaborative production of information",
                  inputs: ["TIDP", "Project information standard", "Shared reference information"],
                  activities: ["Create the container with a compliant name", "Fill in status, revision and classification", "Develop the content within the task team"],
                  outputs: ["Container in WIP"],
                  documents: ["TIDP", "Information container register"],
                  tip: "Set up the metadata when the container is created, not just before sharing.",
                },
                {
                  id: "check",
                  title: "Check, review and approve",
                  subtitle: "Quality gate before sharing",
                  lane: "tt",
                  clause: "ISO 19650-2, quality assurance check",
                  inputs: ["Container in WIP"],
                  activities: ["Check naming, metadata and format", "Review content against the requirements", "Task team lead approves for sharing"],
                  outputs: ["Approved container ready to share"],
                  documents: ["Check record"],
                  tip: "A short written checklist is quicker and more reliable than a review from memory.",
                },
                {
                  id: "share",
                  title: "Share",
                  subtitle: "S1 to S4 · P01",
                  lane: "tt",
                  clause: "ISO 19650-2, information sharing",
                  inputs: ["Approved container"],
                  activities: ["Move the container to Shared", "Set the suitability code and whole revision", "Notify the teams that need it"],
                  outputs: ["Shared container"],
                  documents: ["Transmittal or notification"],
                },
                {
                  id: "authorise",
                  title: "Review and authorise",
                  subtitle: "S6 or S7",
                  lane: "lap",
                  clause: "ISO 19650-2, information model review and authorisation",
                  inputs: ["Shared containers for the milestone", "MIDP"],
                  activities: ["Review the federated information model", "Check completeness against the MIDP", "Authorise the package for submission"],
                  outputs: ["Authorised submission"],
                  documents: ["MIDP", "Submission transmittal"],
                  tip: "Reject internally rather than let the client find the gaps.",
                },
                {
                  id: "accept",
                  title: "Review and accept",
                  subtitle: "A1 to An, B · C01",
                  lane: "ap",
                  clause: "ISO 19650-2, information model acceptance",
                  inputs: ["Authorised submission", "EIR acceptance criteria"],
                  activities: ["Review against the acceptance criteria", "Accept, accept with comments or reject", "Publish accepted containers"],
                  outputs: ["Published containers", "Or a rejection with reasons"],
                  documents: ["Acceptance record"],
                },
                {
                  id: "archive",
                  title: "Archive",
                  subtitle: "Read-only record",
                  lane: "ap",
                  clause: "ISO 19650-2, project close-out",
                  inputs: ["Superseded or final containers"],
                  activities: ["Move to Archived", "Keep metadata and audit trail", "Transfer the record to the asset information model where needed"],
                  outputs: ["Archived record"],
                  documents: ["Archive register"],
                },
              ],
            },
            {
              kind: "callout",
              title: "Use the document flow tool",
              body: "The workflow pages of this platform walk a single container through every state with the code, revision, checks and common failures at each step. Use them to train new team members.",
              tone: "ok",
            },
          ],
        },
      ],
    },
    // ==================================================================== 3. Setting up a CDE
    {
      id: "setup",
      label: "Setting up a CDE",
      tabs: [
        {
          id: "structure",
          label: "Structure & naming",
          blocks: [
            {
              kind: "text",
              title: "Design the structure around the workflow",
              body: [
                "The folder or container structure should make the four states obvious and keep each task team's WIP separate. Most platforms either use folders for states or use a status field with filtered views. Either works if it is applied consistently.",
                "Keep the structure shallow. Deep folder trees hide information and encourage people to create their own private copies. Use metadata and saved views to slice information by discipline, zone or stage.",
              ],
            },
            {
              kind: "table",
              title: "A typical top-level structure",
              columns: ["Area", "Contents", "Access"],
              rows: [
                ["00 Project admin", "Information standard, BEP, MIDP, registers, templates", "Read for all, edit by the information manager"],
                ["01 WIP by task team", "One area per task team, for example architecture, structures, MEP", "Owning task team only"],
                ["02 Shared", "Shared containers, often split by originator or discipline", "Read for the delivery team, upload by authorised sharers"],
                ["03 Published", "Accepted containers grouped by milestone or purpose", "Read for all who need it, upload through the acceptance workflow only"],
                ["04 Archived", "Superseded and final containers", "Read only, controlled"],
                ["05 Incoming", "Information from outside the delivery team, such as surveys or client data", "Information manager checks before it is shared"],
              ],
            },
            {
              kind: "list",
              title: "Naming rules to set before go-live",
              items: [
                "Use the project naming convention for every container, for example project, originator, volume, level, type, role and number",
                "Agree the code lists for each field and load them as pick lists",
                "Decide whether the CDE enforces naming on upload or flags errors for correction",
                "Agree how to name containers that come from outside the delivery team",
                "Keep folder names short and stable, and never use them to carry status",
              ],
            },
            {
              kind: "callout",
              title: "Check naming with the platform's tool",
              body: "The naming checker on this platform tests a list of container names against the project convention. Run it on the first uploads during mobilisation.",
              tone: "ok",
            },
          ],
        },
        {
          id: "permissions",
          label: "Permissions & workflows",
          blocks: [
            {
              kind: "table",
              title: "Permissions by role",
              columns: ["Role", "WIP", "Shared", "Published", "Archived"],
              rows: [
                ["Task team author", "Create and edit in own area", "Read; share through the approval step", "Read", "Read on request"],
                ["Task team lead", "Full control of own area", "Approve sharing for own team", "Read", "Read on request"],
                ["Other task teams", "No access", "Read", "Read", "Read on request"],
                ["Lead appointed party information manager", "Read for monitoring where agreed", "Manage and authorise submissions", "Read", "Read"],
                ["Appointing party", "No access", "Read where agreed", "Accept, publish and read", "Read and manage"],
                ["CDE administrator", "Configure", "Configure", "Configure", "Configure"],
              ],
            },
            {
              kind: "steps",
              title: "Configuring approval workflows",
              steps: [
                { title: "Map the transitions", body: "List each state change the project needs, from WIP to Shared to Published to Archived, and who acts at each." },
                { title: "Set the gates", body: "Decide which transitions need a named approver and which can be done by the author after a checklist." },
                { title: "Build the workflows", body: "Configure review and approval workflows in the platform, with reviewers, time limits and outcomes." },
                { title: "Link the metadata", body: "Make each workflow outcome set the status and revision automatically where the platform allows it." },
                { title: "Notify", body: "Set notifications so that reviewers know when something is waiting and authors know the outcome." },
                { title: "Test", body: "Run a dummy container through every workflow with real users before the project goes live." },
              ],
            },
            {
              kind: "callout",
              title: "Permissions follow the appointment",
              body: "Grant access by role and organisation, not by individual favour. When someone leaves a task team, remove their access on the same day.",
              tone: "warn",
            },
          ],
        },
        {
          id: "mobilisation",
          label: "Mobilisation testing",
          blocks: [
            {
              kind: "text",
              title: "Test before you rely on it",
              body: [
                "During mobilisation, the lead appointed party is expected to test the CDE and the information production methods before real work starts. The aim is to find problems with access, naming, workflows and file exchange while they are cheap to fix.",
                "Record the results and any changes in the BEP or the mobilisation plan, so everyone works to the tested set-up.",
              ],
            },
            {
              kind: "checklist",
              title: "CDE mobilisation test checklist",
              items: [
                "Every task team member can log in and sees only the areas they should",
                "A test container can be uploaded with a compliant name and full metadata",
                "A non-compliant name is rejected or flagged",
                "A container moves from WIP to Shared through the approval workflow",
                "The status and revision update correctly at each transition",
                "Other task teams can find and download the shared container",
                "A submission package can be authorised and sent to the appointing party",
                "The appointing party can accept, reject or comment and the outcome is recorded",
                "Superseded revisions move to Archived and remain readable",
                "Native and IFC models open in the viewer and federate correctly",
                "BCF issues can be exchanged between the CDE and the authoring tools",
                "Large files upload and download in an acceptable time from each office and site",
                "The audit trail shows every action from the test",
                "Backup and recovery arrangements are confirmed with the provider",
              ],
            },
            {
              kind: "callout",
              title: "Include the site team",
              body: "Test from site cabins and on tablets as well as from the office. Slow connections and mobile apps are where many CDEs fail in practice.",
              tone: "info",
            },
          ],
        },
        {
          id: "audit",
          label: "Audit trail",
          blocks: [
            {
              kind: "text",
              title: "What the audit trail should record",
              body: [
                "The audit trail is the CDE's memory. It proves who did what and when, which matters for disputes, for security and for the asset record.",
                "A good audit trail cannot be edited by users, is kept for at least as long as the contract requires, and can be exported if the project moves to another platform.",
              ],
            },
            {
              kind: "table",
              title: "Events to record",
              columns: ["Event", "Details to capture"],
              rows: [
                ["Upload and new revision", "User, organisation, date and time, container name, revision"],
                ["Status change", "Old and new status, who approved it, workflow reference"],
                ["Review comments", "Reviewer, comment, response, outcome"],
                ["Downloads and views", "User and date, especially for sensitive containers"],
                ["Permission changes", "Who changed what access, for whom and when"],
                ["Deletion requests", "Who asked, who approved and why, ideally with the container kept in Archived"],
              ],
            },
            {
              kind: "callout",
              title: "Avoid deletion",
              body: "Deleting containers breaks the record. Prefer to supersede or withdraw them with a reason, and keep them in Archived.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ==================================================================== 4. Platforms
    {
      id: "platforms",
      label: "Platforms",
      tabs: [
        {
          id: "compare",
          label: "Comparison",
          blocks: [
            {
              kind: "callout",
              title: "Read this first",
              body: "This comparison is general and neutral. Products change often, features depend on licence level and configuration, and some capabilities need plug-ins or partner tools. Check the current version and the vendor's documentation, and test against your own workflow, before you choose.",
              tone: "warn",
            },
            {
              kind: "table",
              title: "Common CDE platforms at a glance",
              columns: ["Platform", "ISO 19650 workflow support", "Status and revision codes", "BCF", "IFC viewing", "APIs"],
              rows: [
                ["Autodesk Construction Cloud (Autodesk Docs)", "Configurable review and approval workflows; naming standard checks available", "Custom attributes and review outcomes can carry suitability and revision", "Issues can be exchanged with BCF through import, export or connected tools; check current support", "Web viewer opens IFC and many native formats", "Autodesk Platform Services APIs"],
                ["BIM 360 (legacy)", "Document management with review and approval workflows", "Custom attributes for status and revision", "Through plug-ins or partner tools", "Web viewer for IFC and native formats", "Autodesk Platform Services APIs"],
                ["Bentley ProjectWise and iTwin", "Strong document control with configurable states and workflows", "States and attributes can be set up to match project codes", "Issue exchange through iTwin services or partner tools; check current support", "iTwin viewing of IFC and many formats", "ProjectWise and iTwin Platform APIs"],
                ["Trimble Connect", "Folder permissions and approval workflows; often paired with other document control", "Status and custom properties on files", "Native support for BCF topics and widely used with BCF-based tools", "Web and desktop viewing of IFC and Trimble formats", "Trimble Connect APIs"],
                ["Oracle Aconex", "Strong document control, transmittals, mail and review workflows", "Configurable status and revision fields", "Model coordination features; check BCF support for your version", "Model viewer supports IFC", "Aconex APIs"],
                ["Viewpoint For Projects (4Projects)", "Document control and approval workflows, often used on UK projects", "Configurable status and revision fields", "Check current support", "Check current support", "Check with the vendor"],
                ["Asite", "Configurable workflows, often set up around ISO 19650", "Configurable status and revision fields", "Check current support", "Model viewer supports IFC", "Asite APIs"],
                ["Thinkproject", "Document control and workflows, often set up around ISO 19650", "Configurable status and revision fields", "BIM tools in the product family support BCF; check current support", "Model viewing available; check the product", "Thinkproject APIs"],
              ],
            },
            {
              kind: "cards",
              title: "What to look for, whatever the brand",
              cards: [
                { title: "Workflow fit", body: "Can it enforce your states, codes and approval gates without manual workarounds?", tone: "teal" },
                { title: "Metadata control", body: "Can mandatory fields and pick lists be enforced on upload, and checked in bulk?", tone: "blue" },
                { title: "Open standards", body: "Does it handle IFC and BCF well, so teams using different tools can still coordinate?", tone: "green" },
                { title: "Export and exit", body: "Can you export containers, metadata and the audit trail in usable formats at the end of the project?", tone: "amber" },
                { title: "Security", body: "Does it support role-based access, single sign-on, data residency choices and download tracking?", tone: "red" },
                { title: "Usability", body: "Will site teams and occasional users actually use it, including on mobile devices?", tone: "purple" },
              ],
            },
          ],
        },
        {
          id: "select",
          label: "Selecting a platform",
          blocks: [
            {
              kind: "steps",
              title: "A simple selection process",
              steps: [
                { title: "Write the requirements", body: "List your states, codes, workflows, security needs, integrations and number of users from the information requirements." },
                { title: "Shortlist", body: "Pick two or three platforms that appear to meet the core needs, including any your organisation already licenses." },
                { title: "Script a demonstration", body: "Ask each vendor to run your own scenario: upload, check, share, authorise, accept and archive one container." },
                { title: "Run a pilot", body: "Test with real users from at least two task teams and the site, using real file sizes." },
                { title: "Check the exit", body: "Confirm how containers, metadata and audit records are exported at the end of the project or contract." },
                { title: "Decide and record", body: "Record the decision, the configuration and any known limits in the BEP or CDE procedures." },
              ],
            },
            {
              kind: "list",
              title: "Questions to ask every vendor",
              items: [
                "How are WIP, Shared, Published and Archived represented, and can they be enforced?",
                "Can suitability and revision codes be set automatically by workflow outcomes?",
                "How is naming checked, and what happens to a non-compliant upload?",
                "Which BCF versions and BCF API features are supported, natively or through partners?",
                "Which IFC versions does the viewer support, and can models be federated?",
                "Where is data stored, and what certifications does the service hold?",
                "What APIs and connectors are available for reporting and integration?",
                "How long are audit records kept, and how are they exported?",
              ],
            },
            {
              kind: "callout",
              title: "More than one system is normal",
              body: "Many projects use one platform for document control and another for model coordination. That is fine if the information standard says which is the master for each type of container and how they stay in step.",
              tone: "info",
            },
          ],
        },
      ],
    },
    // ==================================================================== 5. Operating the CDE
    {
      id: "operate",
      label: "Operating the CDE",
      tabs: [
        {
          id: "routines",
          label: "Routines, KPIs & failures",
          blocks: [
            {
              kind: "table",
              title: "Daily and weekly routines",
              columns: ["When", "Task", "Who"],
              rows: [
                ["Daily", "Clear the approval and review queues", "Task team leads and reviewers"],
                ["Daily", "Check new uploads for naming and metadata errors", "Information manager"],
                ["Daily", "Respond to access requests and remove leavers", "CDE administrator"],
                ["Weekly", "Share coordinated models before the coordination meeting", "Task teams"],
                ["Weekly", "Report container status against the TIDPs and MIDP", "Information manager"],
                ["Weekly", "Review overdue comments and rejected submissions", "Lead appointed party"],
                ["Monthly", "Audit permissions and a sample of the audit trail", "Information manager"],
                ["Monthly", "Review KPIs and agree corrective actions", "Project leadership"],
              ],
            },
            {
              kind: "stats",
              title: "Useful CDE KPIs",
              stats: [
                { value: "% compliant", label: "Containers with fully compliant names and metadata on first upload" },
                { value: "Days", label: "Average time from submission to acceptance or rejection" },
                { value: "% first time", label: "Submissions accepted without rejection" },
                { value: "Count", label: "Containers overdue against the MIDP" },
                { value: "Count", label: "Containers shared outside the CDE, found in audits" },
                { value: "Count", label: "Open review comments older than the agreed limit" },
              ],
            },
            {
              kind: "callout",
              title: "Measure the process, not just the volume",
              body: "The number of files uploaded says little. Compliance, turnaround time and first-time acceptance tell you whether the CDE is actually working.",
              tone: "info",
            },
            {
              kind: "table",
              title: "Common failures and how to fix them",
              columns: ["Failure", "Why it happens", "Fix"],
              rows: [
                ["Information shared by email instead of the CDE", "The CDE is slow or people do not trust it", "Make the CDE the only route for contractual information and fix the usability problems"],
                ["Two current revisions of the same container", "The old revision was not superseded on sharing", "Configure the platform to supersede automatically and audit weekly"],
                ["WIP revisions in Shared", "Containers shared without the check step", "Enforce the approval workflow and block decimal revisions in Shared"],
                ["Wrong suitability codes", "Authors pick codes at random", "Train with examples and limit the codes offered at each transition"],
                ["Private copies on local drives", "Deep folder trees and poor search", "Simplify the structure and provide saved views"],
                ["Slow approvals", "No named reviewers or time limits", "Set reviewers, deadlines and escalation in the workflow"],
                ["Leavers keep access", "No link between appointments and permissions", "Make removing access part of the leaver process"],
                ["Federated model uses old revisions", "Links point to files, not to current shared revisions", "Federate only from current shared containers and check revisions before each meeting"],
              ],
            },
            {
              kind: "callout",
              title: "Most failures are behaviour, not software",
              body: "Fixing the platform settings helps, but most problems come from habits. Short, regular training and visible leadership support do more than another configuration change.",
              tone: "warn",
            },
          ],
        },
        {
          id: "security",
          label: "Security",
          blocks: [
            {
              kind: "text",
              title: "A security-minded CDE",
              body: [
                "ISO 19650-5 sets out a security-minded approach to information management. It starts with a security triage to decide whether the project or asset handles sensitive information, and then puts proportionate measures in place.",
                "For the CDE this means controlling who can see what, recording access, and making sure sensitive information is not shared more widely than it needs to be.",
              ],
            },
            {
              kind: "checklist",
              title: "Security measures for the CDE",
              items: [
                "Run the security triage and record the outcome before setting up the CDE",
                "Grant access by role and need to know, and review it regularly",
                "Use single sign-on and multi-factor authentication where available",
                "Mark sensitive containers with a security classification and restrict them",
                "Track downloads and external sharing of sensitive information",
                "Agree where data is hosted and who the provider can share it with",
                "Have an incident procedure for lost devices, wrong sharing and breaches",
                "Remove access on the day a person leaves the project",
              ],
            },
            {
              kind: "callout",
              title: "Asset data can be sensitive too",
              body: "Floor plans, security systems and asset registers can reveal how to attack a building. Apply the same controls to handover information as to design information.",
              tone: "warn",
            },
          ],
        },
        {
          id: "closeout",
          label: "Close-out & archiving",
          blocks: [
            {
              kind: "steps",
              title: "Closing out the project CDE",
              steps: [
                { title: "Confirm final acceptance", body: "Make sure every deliverable in the MIDP has been accepted and published, or formally removed with a reason." },
                { title: "Supersede and archive", body: "Move all superseded revisions to Archived and check that nothing is left in WIP or Shared without a reason." },
                { title: "Prepare the record", body: "Collect the as-constructed record, with CR codes where used, and the handover information for the asset information model." },
                { title: "Transfer", body: "Transfer the information needed for operation into the appointing party's asset systems in the agreed formats." },
                { title: "Export the audit trail", body: "Export the audit trail and metadata so the record survives if the platform contract ends." },
                { title: "Remove access", body: "Close access for delivery team members who no longer need it and record the final access list." },
                { title: "Capture lessons learned", body: "Record what worked and what did not in the CDE set-up and share it for the next project." },
              ],
            },
            {
              kind: "callout",
              title: "Plan the exit at the start",
              body: "Agree at mobilisation how the archive will be exported and where it will live after the project. It is much harder to negotiate at the end.",
              tone: "ok",
            },
          ],
        },
        {
          id: "learn",
          label: "FAQ, quiz & resources",
          blocks: [
            {
              kind: "faq",
              title: "Frequently asked questions",
              items: [
                { q: "Is a CDE a piece of software?", a: "No. It is the combination of technology and agreed workflow. The software supports the process but does not replace it." },
                { q: "Who is responsible for providing the CDE?", a: "The appointing party is expected to establish the project CDE, or make sure one is provided, before appointments start. It may ask a delivery team or a third party to host it." },
                { q: "Can a delivery team use its own CDE?", a: "Yes, many lead appointed parties use their own system for WIP and internal sharing. Information shared with the appointing party and published information should still go through the project CDE." },
                { q: "What is the difference between Shared and Published?", a: "Shared information is available to the delivery team for coordination, review or submission. Published information has been authorised and accepted by the appointing party for use, for example for construction." },
                { q: "Who sets the A and B codes?", a: "The appointing party, through its acceptance of a submission. The delivery team never gives itself an A or B code." },
                { q: "What revision does a container get when it is published?", a: "Under the UK convention it moves from a P revision to a C revision, starting at C01, with an A or B suitability code." },
                { q: "Should status and revision be in the file name?", a: "Usually not. Keep them as metadata, so the name stays stable and links do not break. Follow the project information standard if it says otherwise." },
                { q: "What happens to superseded information?", a: "It moves to Archived and stays readable, with its metadata and audit trail, so the history of decisions can be traced." },
                { q: "How do BCF issues fit into the CDE?", a: "BCF issues reference models and objects in the CDE. Many platforms store them alongside the models, and the issue log should be managed as project information like any other." },
                { q: "Can a shared drive be a CDE?", a: "For a small, simple project it can, if the states, naming, permissions and approvals are applied strictly. In practice a dedicated platform makes this far easier to enforce and audit." },
              ],
            },
            {
              kind: "quiz",
              title: "Test your CDE knowledge",
              questions: [
                { q: "Which of these is NOT one of the four CDE states?", options: ["Work in progress", "Shared", "Approved", "Archived"], answer: 2, why: "The four states are Work in progress, Shared, Published and Archived." },
                { q: "Which suitability code means suitable for coordination?", options: ["S0", "S1", "S3", "A1"], answer: 1, why: "S1 is used when containers are shared so other teams can coordinate against them." },
                { q: "A container in WIP has revision P02.03. What will it most likely be when shared?", options: ["P02", "P03", "C01", "P02.04"], answer: 0, why: "The suffix shows work towards P02, so when it is checked and shared the container becomes P02." },
                { q: "Who gives a container an A1 code?", options: ["The task team lead", "The lead appointed party", "The appointing party", "The CDE administrator"], answer: 2, why: "A codes come from the appointing party's acceptance of the information." },
                { q: "What should happen when a shared container needs a change?", options: ["Edit it in Shared", "Start a new WIP revision and share again", "Delete it and upload a new file", "Email the change to the other teams"], answer: 1, why: "Shared and published containers are not edited in place. Changes start as a new WIP revision." },
                { q: "Which code is used for the as-constructed record?", options: ["S7", "B1", "CR", "S4"], answer: 2, why: "CR marks the as-constructed record in the published state." },
              ],
            },
            {
              kind: "links",
              title: "Official and neutral resources",
              links: [
                { label: "UK BIM Framework", href: "https://www.ukbimframework.org/", note: "Guidance on ISO 19650 in the UK, including the information management process and the National Annex", tone: "teal" },
                { label: "buildingSMART International", href: "https://www.buildingsmart.org/", note: "Open standards such as IFC and BCF that CDE platforms use for exchange", tone: "blue" },
                { label: "ISO 19650-1 on iso.org", href: "https://www.iso.org/standard/68078.html", note: "Catalogue page for the concepts and principles part of ISO 19650", tone: "green" },
              ],
            },
            { kind: "widget", widget: "ask-ai", title: "Ask AI about the CDE" },
            { kind: "widget", widget: "generate", title: "Draft CDE procedures", docType: "CDE procedures and workflow" },
            {
              kind: "callout",
              title: "Check AI output",
              body: "AI drafts are a starting point. The information manager should confirm states, codes, permissions and workflows against the project information standard and the chosen platform before issuing procedures.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "What is the difference between Shared and Published in the CDE, and who moves information between them?",
    "Which suitability code should I use when sending a model to the client for comments?",
    "How should we set up folders and permissions in our CDE for three task teams?",
    "What should we test in the CDE during mobilisation?",
  ],
};
