import type { Hub } from "./types";

// BCF hub: the buildingSMART BIM Collaboration Format and how issues support ISO 19650 collaborative
// production and clash coordination. Paraphrased practical guidance, not the text of any standard.
// The platform's BCF studio (shared/bcf.ts, shared/bcfStudio.ts) reads BCF 2.0, 2.1 and 3.0 and
// writes BCF 2.1. Software descriptions are neutral and general; check the current version.

export const bcfHub: Hub = {
  id: "bcf",
  tone: "purple",
  eyebrow: "REFERENCE · BIM COLLABORATION FORMAT",
  title: "BCF learning hub",
  intro:
    "BCF is the open format for passing model-based issues between tools. Instead of sending screenshots and spreadsheets, a BCF issue carries the camera view, a snapshot, the affected objects and the full conversation. This hub explains what BCF contains, how the versions and the BCF API differ, how issues move from creation to closure, how BCF supports ISO 19650 coordination, how it works in common tools, and how to run a clash coordination routine that actually closes issues.",
  sections: [
    // ==================================================================== 1. Basics
    {
      id: "basics",
      label: "BCF basics",
      tabs: [
        {
          id: "what",
          label: "What BCF is",
          blocks: [
            {
              kind: "text",
              title: "Issues that point at the model",
              body: [
                "BCF, the BIM Collaboration Format, is an open standard from buildingSMART for exchanging issues about building models. It was created so that people using different authoring and checking tools could talk about the same problem in the same place in the model.",
                "A BCF issue, called a topic, does not contain the model. It refers to it. It stores where the camera was, what the viewer saw, which objects are involved and what people have said about the problem. The receiver opens the topic in their own tool and is taken straight to the problem.",
                "Objects are identified by their IFC GUID. As long as GUIDs are kept stable between model versions, an issue raised on one export can still find the right objects in the next.",
              ],
            },
            {
              kind: "table",
              title: "What a BCF topic carries",
              columns: ["Part", "What it holds", "Why it matters"],
              rows: [
                ["Topic", "Title, type, status, priority, labels, assignee, due date, stage and description", "Lets the issue be filtered, assigned and tracked"],
                ["Comments", "A dated conversation with the author of each comment", "Keeps the decision history with the issue instead of in email"],
                ["Viewpoint", "Camera position, direction and field of view, plus clipping planes", "Takes the receiver to exactly the same view"],
                ["Snapshot", "An image of the view when the issue was raised", "Shows the problem even if the model is not open"],
                ["Components", "The IFC GUIDs of selected, visible, hidden or coloured objects", "Highlights the affected elements in the receiver's tool"],
                ["Related files and documents", "References to the models and documents the topic relates to", "Shows which model version the issue was raised on"],
              ],
            },
            {
              kind: "cards",
              title: "Why teams use BCF",
              cards: [
                { title: "Tool neutral", body: "A Solibri check result can be opened in Revit, Archicad, Tekla or a web viewer without retyping.", tone: "purple" },
                { title: "Precise", body: "The viewpoint and GUIDs take everyone to the same objects, so there is no doubt about which pipe or beam is meant.", tone: "blue" },
                { title: "Traceable", body: "Status, assignee and comments show who must act and what was decided.", tone: "teal" },
                { title: "Measurable", body: "Issue counts by status, age and discipline give a clear picture of coordination progress.", tone: "green" },
              ],
            },
            {
              kind: "callout",
              title: "BCF depends on stable GUIDs",
              body: "If an authoring tool or export setting changes IFC GUIDs between versions, old issues can no longer find their objects. Check GUID stability during mobilisation by exporting the same model twice.",
              tone: "warn",
            },
          ],
        },
        {
          id: "versions",
          label: "Versions & BCF API",
          blocks: [
            {
              kind: "table",
              title: "BCF versions compared",
              columns: ["Version", "Main points", "In practice"],
              rows: [
                ["BCF 1.0", "The original file-based format, introduced by tool vendors and then adopted by buildingSMART", "Rarely used now; most tools have moved on"],
                ["BCF 2.0", "Added richer topic fields and the idea of a server-based exchange alongside the file", "Still read by many tools; some older projects use it"],
                ["BCF 2.1", "Refined 2.0 with clearer viewpoints, visibility and colouring of components, and better consistency", "The most widely supported version for file exchange; the platform's BCF studio writes 2.1"],
                ["BCF 3.0", "Cleaner schema, an extensions file that lists allowed types, statuses, priorities, labels and users, and better handling of documents", "Growing support; check that every tool on the project can read and write it before choosing it"],
              ],
            },
            {
              kind: "cards",
              title: "File-based or server-based",
              cards: [
                { title: "BCF-XML (file)", body: "Topics are zipped into a .bcf or .bcfzip file and sent or uploaded. Simple, works offline, but every exchange is a copy and status can drift between copies.", tone: "purple" },
                { title: "BCF API (server)", body: "A RESTful web service where tools read and write topics on a shared server. Everyone sees the same live issue, with no file round trips.", tone: "blue" },
                { title: "Which to use", body: "Use the API where your tools and platform support it well. Fall back to files for tools that do not, and agree one master issue list either way.", tone: "teal" },
              ],
            },
            {
              kind: "list",
              title: "Agree these in the BEP",
              items: [
                "The BCF version to use for file exchange",
                "Whether a BCF API server is used, and which platform hosts it",
                "Where the master issue list lives",
                "The allowed values for type, status, priority and labels",
                "How issue files are named and stored in the CDE when files are used",
              ],
            },
            {
              kind: "callout",
              title: "The BCF studio reads all three",
              body: "This platform's BCF studio opens BCF 2.0, 2.1 and 3.0 files, writes BCF 2.1, and converts issues to and from spreadsheets. It is useful when two tools disagree on versions.",
              tone: "ok",
            },
          ],
        },
        {
          id: "iso",
          label: "BCF and ISO 19650",
          blocks: [
            {
              kind: "text",
              title: "Where BCF fits",
              body: [
                "ISO 19650 does not mention BCF by name. It expects task teams to coordinate their information during collaborative production, to review it before sharing and to resolve problems through the CDE. BCF is a practical, open way of doing that for model-based problems.",
                "Clash coordination, design reviews, model checking against requirements and site snagging can all produce BCF topics. The issue log becomes part of the project information and should be managed like any other information.",
              ],
            },
            {
              kind: "table",
              title: "BCF in the ISO 19650 activities",
              columns: ["Activity", "How BCF helps"],
              rows: [
                ["Collaborative production of information", "Teams raise and answer issues on shared models instead of by email"],
                ["Quality assurance check before sharing", "Model checking tools export rule failures as topics for the author to fix"],
                ["Review of shared information", "Reviewers place comments on the exact view and objects"],
                ["Information model review and authorisation", "The lead appointed party checks that critical issues are closed before submission"],
                ["Review and acceptance by the appointing party", "Client comments can be returned as topics linked to the submitted models"],
                ["Mobilisation", "BCF exchange between tools and the CDE is tested before production starts"],
              ],
            },
            {
              kind: "callout",
              title: "An issue is not a change of status",
              body: "Closing a BCF topic does not move a model to Shared or Published. The fix is made in a new WIP revision, which is then checked and shared through the CDE in the normal way.",
              tone: "info",
            },
          ],
        },
      ],
    },
    // ==================================================================== 2. Lifecycle
    {
      id: "lifecycle",
      label: "Issue lifecycle",
      tabs: [
        {
          id: "flow",
          label: "From open to closed",
          blocks: [
            {
              kind: "steps",
              title: "The issue lifecycle",
              steps: [
                { title: "Create", body: "Raise the topic on the current shared model, with a clear title, a snapshot, the viewpoint and the affected objects selected." },
                { title: "Assign", body: "Give it to one responsible person or task team, with a priority and a due date." },
                { title: "Comment", body: "Discuss the solution in the topic. Add new viewpoints where they help explain a proposal." },
                { title: "Resolve", body: "The assignee fixes the model in WIP and marks the topic as resolved, saying which revision contains the fix." },
                { title: "Verify", body: "The person who raised the issue, or the coordinator, checks the fix in the next shared model." },
                { title: "Close", body: "If the fix is confirmed, the topic is closed. If not, it is reopened with a comment explaining why." },
              ],
            },
            {
              kind: "process",
              title: "Who acts at each step",
              lanes: [
                { id: "coord", label: "BIM coordinator", tone: "purple" },
                { id: "team", label: "Responsible task team", tone: "blue" },
                { id: "lead", label: "Lead appointed party", tone: "teal" },
              ],
              steps: [
                {
                  id: "raise",
                  title: "Raise the issue",
                  subtitle: "Status: Open",
                  lane: "coord",
                  clause: "ISO 19650-2, collaborative production of information",
                  inputs: ["Current shared models", "Clash test or model check results"],
                  activities: ["Group related clashes into one problem", "Create a topic with a snapshot and viewpoint", "Select the affected objects"],
                  outputs: ["Open BCF topic"],
                  documents: ["Issue log"],
                  tip: "One topic per problem, not one per clash.",
                },
                {
                  id: "assign",
                  title: "Assign and prioritise",
                  subtitle: "Status: Open or In progress",
                  lane: "coord",
                  clause: "ISO 19650-2, collaborative production of information",
                  inputs: ["Open topic"],
                  activities: ["Assign one responsible party", "Set priority and due date", "Add labels for discipline and zone"],
                  outputs: ["Assigned topic"],
                  documents: ["Issue log"],
                },
                {
                  id: "fix",
                  title: "Fix in WIP",
                  subtitle: "Status: Resolved",
                  lane: "team",
                  clause: "ISO 19650-2, collaborative production of information",
                  inputs: ["Assigned topic", "Own WIP model"],
                  activities: ["Agree the solution in comments", "Change the model in WIP", "Mark resolved and name the revision with the fix"],
                  outputs: ["Resolved topic", "Revised model shared through the CDE"],
                  documents: ["Shared model revision"],
                  tip: "Resolved means fixed in a model others can see, not just fixed on your screen.",
                },
                {
                  id: "verify",
                  title: "Verify",
                  subtitle: "Status: Closed or reopened",
                  lane: "coord",
                  clause: "ISO 19650-2, review of shared information",
                  inputs: ["Resolved topic", "New shared model"],
                  activities: ["Re-run the clash test or check", "Confirm the fix in the viewpoint", "Close or reopen with a comment"],
                  outputs: ["Closed topic"],
                  documents: ["Issue log"],
                },
                {
                  id: "report",
                  title: "Report and authorise",
                  subtitle: "Before milestone submission",
                  lane: "lead",
                  clause: "ISO 19650-2, information model review and authorisation",
                  inputs: ["Issue log", "Federated model"],
                  activities: ["Review open critical issues", "Agree what can remain open with a reason", "Authorise the submission"],
                  outputs: ["Issue status report with the submission"],
                  documents: ["Issue status report", "Submission transmittal"],
                },
              ],
            },
            {
              kind: "table",
              title: "A simple status set",
              columns: ["Status", "Meaning", "Who sets it"],
              rows: [
                ["Open", "Raised and waiting for action", "Issue author or coordinator"],
                ["In progress", "The assignee is working on it", "Assignee"],
                ["Resolved", "Fixed in a shared model and ready to check", "Assignee"],
                ["Closed", "Fix verified, no further action", "Issue author or coordinator"],
                ["Reopened", "The fix did not work or caused a new problem", "Issue author or coordinator"],
                ["Not an issue", "Accepted as it is, with a reason recorded", "Coordinator, with agreement of the teams"],
              ],
            },
          ],
        },
        {
          id: "clash",
          label: "Clash coordination",
          blocks: [
            {
              kind: "text",
              title: "From clash results to BCF issues",
              body: [
                "Clash detection tools often find hundreds or thousands of clashes. Most are repeats of the same problem or are not real problems at all. Sending every clash as an issue buries the team in noise.",
                "The coordinator's job is to turn raw clashes into a short list of real problems, each with a clear owner. BCF is the format that carries those problems back into the authoring tools.",
              ],
            },
            {
              kind: "steps",
              title: "Turning clashes into useful issues",
              steps: [
                { title: "Set up clash tests", body: "Define tests by discipline pair and zone, with tolerances and rules that ignore known acceptable overlaps." },
                { title: "Run on current shared models", body: "Use only the current shared revisions so results reflect what everyone can see." },
                { title: "Group", body: "Group clashes by cause, for example one duct run hitting a row of beams, and treat the group as one problem." },
                { title: "Filter", body: "Remove false positives such as insulation touching, and approved penetrations." },
                { title: "Create topics", body: "Create one BCF topic per problem, with the clash test name and group in the description or labels." },
                { title: "Re-run and close", body: "After each model update, re-run the tests and close the topics whose clashes have gone." },
              ],
            },
            {
              kind: "callout",
              title: "Link topics to the clash test",
              body: "Put the clash test name and the group reference in the topic. When the test is re-run, the coordinator can quickly see which topics are cleared.",
              tone: "ok",
            },
          ],
        },
        {
          id: "meeting",
          label: "Coordination meeting",
          blocks: [
            {
              kind: "steps",
              title: "A weekly clash coordination meeting",
              steps: [
                { title: "Before the meeting", body: "Teams share updated models in the CDE by an agreed cut-off. The coordinator federates them, runs the clash tests and updates the issue list." },
                { title: "Review the numbers", body: "Start with open, resolved and closed counts by discipline and zone, and the oldest open issues." },
                { title: "Verify resolved issues", body: "Go through resolved topics and close or reopen each one on screen." },
                { title: "Work the priorities", body: "Discuss high-priority open issues in the model, agree solutions and owners, and record decisions as comments." },
                { title: "Raise new issues", body: "Add new topics from this week's tests, assign them and set due dates." },
                { title: "After the meeting", body: "Export or sync the updated topics, share the issue report and confirm the next model cut-off date." },
              ],
            },
            {
              kind: "checklist",
              title: "Meeting readiness checklist",
              items: [
                "All teams have shared models by the cut-off",
                "Models are the current shared revisions and federate correctly",
                "Clash tests have been run and grouped",
                "Resolved topics from last week are ready to verify",
                "The issue report is prepared with counts and ageing",
                "Each discipline has someone present who can make decisions",
              ],
            },
            {
              kind: "callout",
              title: "Decide in the room",
              body: "A coordination meeting that only reviews issues and decides nothing makes the list longer. Agree an owner and a date for every high-priority issue before moving on.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ==================================================================== 3. Tools
    {
      id: "tools",
      label: "BCF by software",
      tabs: [
        {
          id: "table",
          label: "Tool comparison",
          blocks: [
            {
              kind: "callout",
              title: "General guidance only",
              body: "Tools, add-ins and versions change often. The notes below describe common workflows in general terms. Check the current version and the vendor's documentation, and test the round trip on your own project.",
              tone: "warn",
            },
            {
              kind: "table",
              title: "BCF workflow in common tools",
              columns: ["Tool", "Typical role", "How BCF is used", "Notes"],
              rows: [
                ["Autodesk Revit", "Authoring", "Through add-ins such as BCF managers from several vendors, or through issue connectors from coordination platforms", "Check that the add-in matches your Revit version and maps GUIDs to Revit elements correctly"],
                ["BIMcollab Zoom and BIMcollab", "Model checking, issue management", "Creates and reads BCF topics; the BIMcollab service can act as a shared issue server with connectors for authoring tools", "Often used as the central issue list across tools"],
                ["Autodesk Navisworks", "Clash detection, federation", "Clash results are usually turned into BCF through add-ins or by moving them to a coordination platform", "Group clashes before exporting, or the list becomes unmanageable"],
                ["Solibri", "Model checking, clash detection", "Exports and imports BCF topics from checking results and presentations", "Strong for rule-based checking; one of the original BCF tools"],
                ["Revizto", "Coordination, issue tracking", "Supports BCF import and export alongside its own issue tracker", "Check how statuses map between Revizto and BCF"],
                ["Autodesk Construction Cloud Issues", "Platform issue tracking", "Issues can be exchanged with BCF through import, export or connected tools; check current support", "Decide whether ACC or another tool holds the master issue list"],
                ["Trimble Connect", "CDE, viewing, issue tracking", "Works natively with BCF topics and connects to tools that use BCF", "Useful when teams use Tekla, SketchUp or other Trimble tools alongside others"],
                ["Archicad and Tekla", "Authoring", "Both offer BCF import and export, built in or through add-ons", "Check GUID handling when exchanging IFC with other tools"],
              ],
            },
            {
              kind: "cards",
              title: "Choosing a set-up",
              cards: [
                { title: "One master list", body: "Pick one place where the official status of each issue lives. Every other tool reads from it or syncs to it.", tone: "purple" },
                { title: "Prefer live connections", body: "Where a BCF API or a direct connector is available, use it. File round trips create copies with conflicting status.", tone: "blue" },
                { title: "Map the fields", body: "Check how type, status, priority and labels map between tools before production starts.", tone: "teal" },
                { title: "Test the round trip", body: "Raise a topic in the checking tool, open it in each authoring tool, comment, resolve and close it, and check nothing is lost.", tone: "green" },
              ],
            },
          ],
        },
        {
          id: "platform",
          label: "On this platform",
          blocks: [
            {
              kind: "callout",
              title: "Open the BCF studio",
              body: "The BCF studio at /bim-tools/bcf opens BCF 2.0, 2.1 and 3.0 files, shows topics with snapshots, comments and viewpoints, lets you edit them, writes BCF 2.1 and converts issues to and from spreadsheets or clash reports.",
              tone: "ok",
            },
            {
              kind: "callout",
              title: "Track issues on the project Issues page",
              body: "Inside a project, the Issues (BCF) page under Model and coordination keeps the project issue list, with status, priority, labels and assignees, and can import and export BCF.",
              tone: "info",
            },
            {
              kind: "list",
              title: "Good uses of the studio",
              items: [
                "Check a BCF file from another team before importing it into your tool",
                "Convert a spreadsheet of clashes into BCF topics",
                "Export topics to a spreadsheet for a meeting report",
                "Convert a newer BCF file to 2.1 for a tool that cannot read 3.0",
                "Clean up titles, labels and assignees in bulk before issuing",
              ],
            },
          ],
        },
      ],
    },
    // ==================================================================== 4. Best practice
    {
      id: "practice",
      label: "Best practice",
      tabs: [
        {
          id: "writing",
          label: "Writing good issues",
          blocks: [
            {
              kind: "table",
              title: "Topic fields and how to use them",
              columns: ["Field", "Good practice", "Example"],
              rows: [
                ["Title", "Say what and where in a few words, starting with the location", "L02 grid C4: duct clashes with primary beam"],
                ["Description", "Say what is wrong, why it matters and what is proposed", "Duct passes through the beam web. Reroute below or agree an opening with structures."],
                ["Type", "Use the agreed list, such as clash, design query, request for information or model quality", "Clash"],
                ["Status", "Use the agreed status set and keep it current", "Open"],
                ["Priority", "Use a short scale with clear meanings", "High: blocks the next milestone"],
                ["Labels", "Add discipline, zone and the clash test name", "MEP, Zone B, Duct vs Structure"],
                ["Assigned to", "One person or team, never a list", "Mechanical task team lead"],
                ["Due date", "A real date tied to the next model share or milestone", "Before next Thursday's model cut-off"],
              ],
            },
            {
              kind: "list",
              title: "Rules for good topics",
              items: [
                "One issue per problem. Do not put three unrelated problems in one topic.",
                "Always include a snapshot and a viewpoint with the affected objects selected.",
                "Write titles that make sense in a list without opening the topic.",
                "Raise issues on current shared models, never on someone else's WIP.",
                "Record decisions as comments in the topic, not in meeting minutes only.",
                "Close topics only after the fix has been seen in a shared model.",
              ],
            },
            {
              kind: "callout",
              title: "Keep the lists short",
              body: "Agree short lists for type, status, priority and labels at mobilisation. Long free-text lists make filtering and reporting impossible. BCF 3.0 can carry these allowed values in its extensions file.",
              tone: "info",
            },
          ],
        },
        {
          id: "kpis",
          label: "KPIs & reporting",
          blocks: [
            {
              kind: "stats",
              title: "Issue KPIs worth tracking",
              stats: [
                { value: "Open vs closed", label: "Issues opened and closed each week; the gap shows whether coordination is keeping up" },
                { value: "Ageing", label: "How long open issues have been open, grouped by age band" },
                { value: "By discipline", label: "Open issues assigned to each task team" },
                { value: "By priority", label: "High-priority issues open against the next milestone" },
                { value: "Reopen rate", label: "Share of resolved issues that had to be reopened" },
                { value: "By zone", label: "Open issues by building zone or level, to focus effort" },
              ],
            },
            {
              kind: "table",
              title: "A weekly issue report",
              columns: ["Section", "What to show"],
              rows: [
                ["Summary", "Total open, resolved and closed, with the change since last week"],
                ["Ageing", "Open issues by age band, such as under a week, one to four weeks and over four weeks"],
                ["By discipline", "Open and overdue issues for each task team"],
                ["Top risks", "High-priority issues that could delay the next milestone"],
                ["Decisions needed", "Issues waiting for a client or design decision"],
              ],
            },
            {
              kind: "callout",
              title: "Watch the trend, not just the total",
              body: "A total that stays flat can hide many new issues and many closures. Track opened and closed each week, and the age of what is left.",
              tone: "ok",
            },
          ],
        },
        {
          id: "mistakes",
          label: "Common mistakes",
          blocks: [
            {
              kind: "table",
              title: "Common mistakes and fixes",
              columns: ["Mistake", "Effect", "Fix"],
              rows: [
                ["Every clash sent as a separate issue", "Thousands of topics nobody reads", "Group clashes into problems before creating topics"],
                ["Vague titles such as Clash 145", "Nobody can tell what the issue is from the list", "Use location plus a short description"],
                ["Issues assigned to several people", "Nobody feels responsible", "Assign one owner and mention others in comments"],
                ["Closed without checking", "Problems come back on site", "Close only after the fix is seen in a shared model"],
                ["Different status sets in each tool", "Statuses get lost or mapped wrongly", "Agree one status set and map it in each tool"],
                ["Issues raised on old models", "Teams fix problems that are already gone", "Federate only current shared revisions"],
                ["GUIDs change between exports", "Topics no longer highlight the objects", "Fix export settings and test GUID stability"],
                ["Several copies of the issue list", "Conflicting statuses and arguments in meetings", "Agree one master list, ideally on a BCF API server"],
              ],
            },
            {
              kind: "callout",
              title: "BCF is not a substitute for talking",
              body: "Complex problems often need a short call or a meeting. Use BCF to record the problem and the decision, not to hold a long argument in comments.",
              tone: "info",
            },
          ],
        },
      ],
    },
    // ==================================================================== 5. Learn
    {
      id: "learn",
      label: "FAQ, quiz & resources",
      tabs: [
        {
          id: "faq",
          label: "FAQ",
          blocks: [
            {
              kind: "faq",
              title: "Frequently asked questions",
              items: [
                { q: "Does a BCF file contain the model?", a: "No. It contains issues that refer to the model through viewpoints and IFC GUIDs. The receiver needs the model in their own tool to see the objects." },
                { q: "Which BCF version should we use?", a: "BCF 2.1 is the safest choice for file exchange because most tools support it. Use BCF 3.0 only if every tool on the project reads and writes it reliably." },
                { q: "What is the BCF API?", a: "A RESTful web service defined by buildingSMART that lets tools read and write topics on a shared server, so everyone works on the same live issue list." },
                { q: "Can BCF be used without IFC?", a: "Topics can still carry snapshots, viewpoints and comments, but object references rely on IFC GUIDs. Tools that map their own element IDs to IFC GUIDs can still use them." },
                { q: "Why do my issues not highlight any objects?", a: "Usually the GUIDs in the topic do not match the model you opened, because export settings changed or a different model version is loaded." },
                { q: "Should every clash become a BCF topic?", a: "No. Group clashes into real problems and create one topic per problem. Ignore false positives and approved overlaps." },
                { q: "Who should close an issue?", a: "The person who raised it or the coordinator, after checking the fix in a shared model. The assignee marks it resolved, not closed." },
                { q: "Where should BCF files be stored?", a: "In the CDE, named and managed like other project information, unless a BCF API server holds the live issues. Either way, agree one master list." },
                { q: "Does closing an issue change the model's status in the CDE?", a: "No. The fix goes into a new WIP revision, which is checked and shared through the CDE in the normal way." },
                { q: "Can the client raise issues in BCF?", a: "Yes. Review comments on submitted models can be returned as BCF topics, which makes them easy to locate and track." },
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
              title: "Test your BCF knowledge",
              questions: [
                { q: "Which organisation maintains BCF?", options: ["ISO", "buildingSMART International", "Autodesk", "The UK BIM Framework"], answer: 1, why: "BCF is an open standard maintained by buildingSMART International." },
                { q: "How does a BCF topic identify the affected objects?", options: ["By file name", "By IFC GUID", "By layer name", "By element colour"], answer: 1, why: "Components are referenced by their IFC GUIDs." },
                { q: "What is the main difference between BCF-XML and the BCF API?", options: ["The API has no comments", "BCF-XML is file-based; the API is a shared web service", "The API only works with Revit", "BCF-XML cannot hold snapshots"], answer: 1, why: "BCF-XML exchanges zipped files; the BCF API lets tools work on topics held on a server." },
                { q: "Who should normally close an issue?", options: ["The assignee as soon as they change the model", "The issue author or coordinator after verifying the fix", "Anyone in the meeting", "The CDE administrator"], answer: 1, why: "The assignee resolves; the author or coordinator verifies and closes." },
                { q: "What is the best way to handle 800 raw clashes?", options: ["Create 800 topics", "Ignore them", "Group them into real problems and create one topic per problem", "Email a spreadsheet"], answer: 2, why: "Grouping turns noise into a short list of real, owned problems." },
                { q: "Which BCF version does this platform's BCF studio write?", options: ["1.0", "2.0", "2.1", "3.0"], answer: 2, why: "The studio reads 2.0, 2.1 and 3.0 and writes BCF 2.1 for the widest compatibility." },
              ],
            },
          ],
        },
        {
          id: "resources",
          label: "Resources & AI",
          blocks: [
            {
              kind: "links",
              title: "buildingSMART BCF resources",
              links: [
                { label: "BCF-XML on GitHub", href: "https://github.com/buildingSMART/BCF-XML", note: "Schemas, documentation and examples for the file-based format", tone: "purple" },
                { label: "BCF API on GitHub", href: "https://github.com/buildingSMART/BCF-API", note: "Specification of the RESTful BCF web service", tone: "blue" },
                { label: "buildingSMART International", href: "https://www.buildingsmart.org/", note: "The organisation behind IFC, BCF and other open standards", tone: "teal" },
                { label: "UK BIM Framework", href: "https://www.ukbimframework.org/", note: "Guidance on ISO 19650 information management, including collaborative production", tone: "green" },
              ],
            },
            {
              kind: "callout",
              title: "Practise in the BCF studio",
              body: "Open a sample BCF file in the BCF studio at /bim-tools/bcf, edit a topic and export it again. Then try the same round trip with your own tools.",
              tone: "ok",
            },
            { kind: "widget", widget: "ask-ai", title: "Ask AI about BCF" },
            { kind: "widget", widget: "generate", title: "Draft a BCF and issue management procedure", docType: "BCF issue management procedure" },
            {
              kind: "callout",
              title: "Check AI output",
              body: "AI drafts are a starting point. Confirm statuses, priorities, tools and responsibilities with the BIM coordinators and the BEP before issuing a procedure.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "How should we set up BCF statuses and priorities for weekly clash coordination?",
    "What is the difference between BCF 2.1 and BCF 3.0, and which should our project use?",
    "How do I turn a Navisworks clash report into a manageable list of BCF issues?",
    "How does BCF issue management fit into ISO 19650 collaborative production?",
  ],
};
