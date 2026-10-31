import type { Hub } from "./types";

// Connect AI to Revit, AutoCAD, Navisworks & Civil 3D: practical routes for using Claude (Claude Desktop, Claude Code)
// and ChatGPT (web, desktop app, Codex) with Autodesk desktop software.
// Facts checked in October 2026 against: Autodesk MCP Servers help (help.autodesk.com/view/ADSKMCP, including the Revit
// Public MCP Server set-up and tools pages, the AutoCAD and Civil 3D MCP Server page and the Product Help MCP page),
// the Autodesk developer blog (blog.autodesk.io), the APS Automation API pages, the APS Navisworks developer overview,
// Anthropic's Claude help centre and Claude Code docs, OpenAI's ChatGPT help centre, developer docs and Codex docs,
// the README files of the community repositories named below, and the FirstOption MCP Hub (mcp-hub.firstoption-es.com),
// whose facts match the Revit hub's MCP section (revitAdvanced.ts). General MCP concepts live in the MCP hub (/hubs/mcp).
// Tech previews, menus and plan rules change quickly: keep wording hedged and recheck before relying on details.

const FO = "https://mcp-hub.firstoption-es.com";

export const aiConnectHub: Hub = {
  id: "ai-connect",
  tone: "purple",
  eyebrow: "AI · AUTODESK SOFTWARE",
  title: "Connect AI to Revit, AutoCAD, Navisworks & Civil 3D",
  intro:
    "A practical guide for BIM managers, coordinators and modellers who want to use Claude or ChatGPT with Autodesk Revit, AutoCAD, Navisworks and Civil 3D. It compares the four ways to connect, shows how to install each route step by step, works through real prompts and what happens next, and sets out the safety and governance checks to make before an AI touches a live project. For how MCP itself works, see the MCP hub.",
  sections: [
    // ======================================================================== 1. Overview
    {
      id: "overview",
      label: "Overview",
      tabs: [
        {
          id: "firstoption",
          label: "FirstOption MCP Hub",
          blocks: [
            {
              kind: "text",
              title: "Our connectors: the FirstOption MCP Suite",
              body: [
                "The FirstOption MCP Hub is our own way to connect AI to Autodesk desktop software. One Windows setup installs MCP connectors for Revit, AutoCAD, Civil 3D, Plant 3D and Navisworks. Claude Code or Codex runs on your PC, the connector runs code inside the open application, and the hub shares a library of tested commands across the company.",
                "It is route 1 (an MCP server to the live application) with project controls added: dry runs, one undo step per Revit command, verification with rollback and an audit log. The other tabs in this guide compare it with Autodesk's own MCP servers, community projects, the Automation API and file-based checks.",
              ],
            },
            {
              kind: "links",
              title: "FirstOption MCP Hub",
              links: [
                { label: "MCP Hub home", href: `${FO}/`, note: "Overview, download and frequently asked questions", tone: "blue" },
                { label: "Revit MCP", href: `${FO}/products/revit-mcp?public`, note: "Capabilities, supported versions and installation", tone: "purple" },
                { label: "All products", href: `${FO}/products?public`, note: "AutoCAD, Civil 3D, Plant 3D and Navisworks connectors", tone: "teal" },
                { label: "Sign up", href: `${FO}/signup`, note: "Create your company and get the code to connect each PC", tone: "green" },
                { label: "Sign in", href: `${FO}/login`, note: "Company admin: PCs, subscription, library and audit log", tone: "amber" },
              ],
            },
            {
              kind: "table",
              title: "The connectors",
              columns: ["Connector", "Application versions", "What it runs", "Typical disciplines"],
              rows: [
                ["Revit MCP (firstoption-revit)", "Revit 2017–2027", "IronPython and C# inside Revit through pyRevit Routes and a Revit add-in", "Architecture, structure, MEP, BIM management, documentation, QA/QC"],
                ["AutoCAD MCP (firstoption-autocad)", "AutoCAD 2015–2027, not AutoCAD LT", "AutoLISP for quick queries and edits, C# for heavy geometry, blocks, attributes and layouts", "Drafting, documentation, CAD data extraction"],
                ["Civil 3D MCP (firstoption-civil3d)", "Civil 3D 2015–2027", "C# through the Civil 3D .NET API and AutoLISP", "Civil, infrastructure"],
                ["Plant 3D MCP (firstoption-plant3d)", "AutoCAD Plant 3D 2015–2027", "C# through the Plant 3D .NET API and AutoLISP; reads piping, equipment and project properties", "Piping, plant design, equipment"],
                ["Navisworks MCP (firstoption-navisworks)", "Navisworks Manage or Simulate 2020–2027, not Freedom", "C# through the Navisworks .NET API: models, selection sets, viewpoints and clash tests", "Coordination, clash detection"],
              ],
            },
            {
              kind: "cards",
              title: "Why it suits project work",
              cards: [
                { title: "One undo step", body: "Each Revit command runs as a single undo step, so a change can be reversed in one go.", tone: "blue" },
                { title: "Dry run first", body: "A dry run reports what would change and then rolls back, so you can check before anything is kept.", tone: "green" },
                { title: "Verification and rollback", body: "A verification step rolls the change back if it fails, and Revit warnings come back as text instead of dialogs.", tone: "teal" },
                { title: "Shared command library", body: "Commands that worked are saved with their inputs and reused, so the office builds up tested tools rather than one-off prompts.", tone: "purple" },
                { title: "Reviewed, staged releases", body: "FirstOption reviews library changes and releases them to a pilot group of PCs before everyone.", tone: "amber" },
                { title: "Models stay local", body: "Code runs inside the application on the PC. The hub stores the library, skills, usage figures and the audit log, without model content or prompts.", tone: "red" },
              ],
            },
            {
              kind: "steps",
              title: "Set it up",
              steps: [
                { title: "Sign up your company", body: "Create the company on the hub at mcp-hub.firstoption-es.com/signup. The company admin manages PCs, the subscription and the library." },
                { title: "Download the suite", body: "Download the FirstOption MCP Suite for Windows from the hub. One setup covers every connector and needs no admin rights." },
                { title: "Run the setup on each PC", body: "Run it on every workstation that will use AI. It installs the add-ins and MCP servers, and adds Claude Code, Codex, Node.js and pyRevit if they are missing." },
                { title: "Connect the PC", body: "Open the Autodesk application and go to First Option > Hub Settings. Enter your company's code to connect the PC to the hub." },
                { title: "Assign the PC", body: "The company admin assigns the PC to the subscription in the hub." },
                { title: "Sign in to Claude or Codex", body: "Start Claude Code on the PC and sign in with your Claude account. Codex works the same way with an OpenAI account." },
                { title: "Check the connection", body: "With the model or drawing open, run /mcp in Claude Code and confirm the connector, for example firstoption-revit, is listed and connected. Then ask a read-only question first." },
              ],
            },
            {
              kind: "callout",
              title: "Full install guide and troubleshooting",
              body: "The Revit hub's MCP section (/hubs/revit) has the requirements for each PC, the supported Revit versions, troubleshooting and example prompts. Supported versions and plans are taken from the FirstOption MCP Hub in October 2026, when the suite was described as free for now with one Engineering Automation Suite subscription covering every connector. Check the hub for current details.",
              tone: "info",
            },
          ],
        },
        {
          id: "routes",
          label: "Four ways to connect",
          blocks: [
            {
              kind: "cards",
              title: "The four routes",
              cards: [
                { title: "1. MCP server to the live application", body: "An MCP server lets the AI call tools inside the open application: query elements, read parameters, select, export and, with write tools, change the model. Most direct, and the route that needs the most care.", tone: "purple" },
                { title: "2. Cloud APIs and Automation API", body: "Autodesk Platform Services (APS) runs Revit, AutoCAD and other engines headless in the cloud through the Automation API, formerly called the Design Automation API. Suited to repeatable batch jobs built by a developer.", tone: "blue" },
                { title: "3. Scripts the AI writes and you run", body: "The AI drafts a pyRevit or Dynamo script, an AutoLISP routine or a .NET add-in. A person reads it, tests it on a copy and runs it. No connection to the model at all, so the lowest risk.", tone: "green" },
                { title: "4. File-based analysis", body: "Export IFC, BCF, clash reports, schedules or CSV and let AI analyse the files, for example in this platform's AI studio. The model is never touched; you choose exactly what leaves the office.", tone: "teal" },
              ],
            },
            {
              kind: "table",
              title: "How the routes compare",
              columns: ["Route", "Set-up effort", "Risk to the model", "What it can do", "Typical cost"],
              rows: [
                ["MCP server to the live application", "Low to medium: install an add-in and edit one config file", "Read-only tools: low. Write tools: medium to high", "Answer questions about the open model, select and show elements, export views and schedules, edit parameters with write tools", "AI plan plus your Autodesk licence; Autodesk's servers are free tech previews at the time of writing"],
                ["APS Automation API", "High: developer, APS app, cloud models and app bundles", "Medium: jobs run on copies in the cloud, but can write results back", "Batch reports, model creation, linking, export and documentation jobs without a desktop", "Developer time plus APS cloud usage charges; check Autodesk's current APS pricing"],
                ["Scripts the AI writes", "Low: an AI chat plus pyRevit, Dynamo or AutoCAD", "Low if reviewed and tested on a copy", "Anything the product API allows, run when you decide", "AI plan only; pyRevit and Dynamo are free"],
                ["File-based analysis", "Very low: export and upload", "None: works on exported files", "Clash triage, IDS checks on IFC, naming checks, COBie checks, sheet QA", "AI plan or platform tools"],
              ],
            },
            {
              kind: "graphic",
              graphic: "autodesk-mcp-flow",
              title: "Route 1 in one picture",
              caption: "The AI client runs on the workstation and starts the MCP server; the server talks to the add-in inside the open Autodesk application, which reads or changes the model. Nothing reaches the AI service except what the tools return.",
            },
            {
              kind: "callout",
              title: "Start with routes 3 and 4",
              body: "Most teams get value fastest from AI-written scripts and file-based checks, because they need no new software on project machines and cannot change a model by accident. Add a live MCP connection once the team trusts the answers and the governance is in place.",
              tone: "ok",
            },
          ],
        },
        {
          id: "clients",
          label: "Which AI client does what",
          blocks: [
            {
              kind: "table",
              title: "AI clients and local MCP servers",
              columns: ["Client", "Local MCP servers (stdio)", "Remote MCP servers", "How you add a server"],
              rows: [
                ["Claude Desktop", "Yes", "Yes, as custom connectors", "Desktop extensions (.mcpb files) from Settings, or by editing claude_desktop_config.json under Settings > Developer > Edit Config"],
                ["Claude Code", "Yes", "Yes", "claude mcp add on the command line, or a .mcp.json file shared in a project"],
                ["ChatGPT on the web", "No: it cannot start programs on your PC", "Yes, as custom MCP servers on Business and Enterprise/Edu plans", "Plugins > Add custom MCP server, with a public HTTPS URL or an OpenAI Secure MCP Tunnel"],
                ["ChatGPT desktop app, Codex CLI and IDE extension", "Yes, according to OpenAI's Codex documentation", "Yes", "Settings > MCP servers > Add server > STDIO, or codex mcp add; settings are shared in ~/.codex/config.toml"],
                ["Autodesk Assistant", "Built in to the product", "Not applicable", "Panel inside the Autodesk application; Autodesk's AutoCAD and Civil 3D MCP Server runs inside it"],
              ],
            },
            {
              kind: "table",
              title: "Autodesk's own MCP servers (checked October 2026)",
              columns: ["Server", "Status", "Runs", "Documented clients"],
              rows: [
                ["Revit Public MCP Server", "Tech Preview (public beta), Revit 2027.2", "Locally, as a Revit add-on with a stdio server", "Claude Desktop and Cursor; Autodesk says the same pattern generally applies to other clients that support local servers"],
                ["AutoCAD and Civil 3D MCP Server", "Tech Preview (public beta)", "Locally, on Windows", "Autodesk Assistant inside AutoCAD or Civil 3D"],
                ["Product Help MCP", "Generally available", "Remote, public endpoint, no sign-in", "Autodesk lists Claude, ChatGPT and Microsoft Copilot"],
                ["Navisworks", "No Autodesk MCP server listed", "-", "Use files, the .NET API or a third-party server"],
              ],
            },
            {
              kind: "callout",
              title: "ChatGPT and local Autodesk servers",
              body: "Autodesk's Revit server is a local stdio program. ChatGPT on the web cannot run it. OpenAI documents local stdio servers for the ChatGPT desktop app, Codex CLI and IDE extension, but Autodesk does not document this pairing. Treat it as untested: try it on a copy of a model first. Plan names, menus and eligibility change often, so check the vendor's current documentation.",
              tone: "warn",
            },
            {
              kind: "text",
              title: "What about Autodesk Assistant?",
              body: [
                "Autodesk Assistant is Autodesk's own AI panel inside the 2027 products. Autodesk's developer blog describes it in Revit 2027 as a technical preview that, once the preview is enabled, can query model data, create and export schedules, views and sheets, edit parameters, tag elements and apply view templates, using a built-in Revit MCP server.",
                "It needs no external AI account, but it is a separate product from Claude and ChatGPT. Check your organisation's view on Autodesk's AI terms before turning it on for project work.",
              ],
            },
          ],
        },
        {
          id: "pick",
          label: "Pick your route",
          blocks: [
            {
              kind: "checklist",
              title: "Answer these before you choose",
              items: [
                "Do you need answers about the open model now (route 1), or a repeatable report every week (routes 2 or 3)?",
                "Is your Autodesk version supported? Autodesk's Revit server needs Revit 2027.2; older versions need a script or a third-party server",
                "Will the AI only read, or must it change the model? Start read-only whatever you choose",
                "Has the client or appointing party approved sending model data to the AI service?",
                "Is the AI plan an approved business plan with suitable data terms?",
                "Can you install add-ins on project machines, or is the workstation locked down by IT?",
                "Who will review scripts, tool calls and results before they reach a deliverable?",
              ],
            },
            {
              kind: "table",
              title: "Quick decision guide",
              columns: ["If you are...", "Start with"],
              rows: [
                ["A modeller on Revit 2027.2 with Claude Desktop", "Autodesk's Revit server, Read-Tools version"],
                ["On Revit 2026 or earlier", "AI-written pyRevit or Dynamo scripts, or the platform's Revit project check"],
                ["A coordinator in Navisworks", "Export the clash report and use the platform's Clash triage"],
                ["A CAD manager on AutoCAD", "AI-written AutoLISP for audits; Autodesk Assistant for in-product questions"],
                ["A Civil 3D user", "Dynamo for Civil 3D or AutoLISP written by AI; IFC 4.3 export checked with the IFC tools"],
                ["A team with a developer and cloud models", "The APS Automation API and Autodesk's APS MCP sample"],
                ["On ChatGPT Business with no local install allowed", "File-based analysis, or a remote MCP server set up by IT"],
              ],
            },
          ],
        },
      ],
    },
    // ======================================================================== 2. Revit
    {
      id: "revit",
      label: "Revit",
      tabs: [
        {
          id: "revit-what",
          label: "What you can ask",
          blocks: [
            {
              kind: "callout",
              title: "With the FirstOption Revit MCP",
              body: "Our Revit connector (firstoption-revit) works in Revit 2017–2027, not only the 2027 preview below. Claude Code or Codex runs IronPython or C# inside Revit through pyRevit Routes, with a dry run, one undo step per command and rollback if verification fails. Set-up is in Overview › FirstOption MCP Hub.",
              tone: "ok",
            },
            {
              kind: "text",
              title: "Autodesk's Revit Public MCP Server",
              body: [
                "Autodesk publishes a Revit MCP server as a Tech Preview (public beta). Its help pages list Revit 2027.2 as the only supported version during the preview. It is installed as a separate Revit add-on and runs locally; the AI client starts a small program called Autodesk.RevitMcpServer.Stdio.exe that talks to the open Revit session.",
                "There are three versions, each a separate installer: Read-Tools, which never changes the model; Write-Tools, which adds controlled write tools; and Experimental-Tools, which adds a wider set of preview tools. Features may change before general availability.",
              ],
            },
            {
              kind: "table",
              title: "Tools by version (from Autodesk's tools page)",
              columns: ["Version", "Tools", "Typical questions"],
              rows: [
                ["Read (in all versions)", "query_model, get_element_data, get_active_context, get_running_revit_instances, open_view, show_elements, select_elements, export_views", "Which walls have no fire rating? What is selected? Export this schedule to CSV. Zoom to these doors."],
                ["Write (Write-Tools and Experimental-Tools)", "modify_element_parameters, move_elements, rotate_elements", "Set Fire Rating to 60 on these 12 doors. Change these elements to another type."],
                ["Experimental (Experimental-Tools only)", "Sheets: get_sheets, create_sheet, rename_sheet, set_sheet_number. Views: get_views, create_plan_views, create_section_view, get_all_view_templates. Schedules: create_schedule, get_schedulable_fields, modify_schedule_filters and more. Rooms: get_rooms, get_room_boundaries. Also export_ifc, export_gbxml, tag_elements, override_elements_graphics, delete_elements", "Create a door schedule with these fields. Renumber these sheets. Export IFC. Tag all untagged rooms in this view."],
              ],
            },
            {
              kind: "cards",
              title: "Good first questions",
              cards: [
                { title: "Orientation", body: "'Which Revit sessions and documents are open, and what is the active view?'", tone: "blue" },
                { title: "Counting", body: "'How many doors, by type and level, are in this model?'", tone: "green" },
                { title: "Gaps", body: "'List rooms with no number or no department, with their element IDs.'", tone: "amber" },
                { title: "Export", body: "'Export the Door Schedule to CSV in my project export folder.'", tone: "purple" },
              ],
            },
            {
              kind: "table",
              title: "Other ways to connect Revit",
              columns: ["Option", "Type", "Notes"],
              rows: [
                ["Autodesk Assistant (Revit 2027)", "Autodesk, built in, technical preview", "In-product AI panel; no external AI client needed"],
                ["APS sample MCP server for Revit Automation", "Autodesk sample code for developers", "Remote HTTP server that runs Revit in the cloud through the Automation API; tools create_model and link_models on ACC or BIM 360 models"],
                ["mcp-servers-for-revit", "Community, open source (MIT), third party", "Revit 2020 to 2026; an MCP server, a Revit plug-in and a command set; includes write tools and a tool that runs C# code inside Revit; a fork of revit-mcp"],
                ["revit-mcp", "Community, open source, third party", "The original project that mcp-servers-for-revit was forked from"],
                ["Commercial connectors", "Vendors, third party", "Several vendors sell Revit connectors; see the Revit hub's MCP section for one example"],
                ["pyRevit or Dynamo script written by AI", "No connection", "Works on any version pyRevit or Dynamo supports; you review and run the script"],
              ],
            },
            {
              kind: "callout",
              title: "Third-party servers",
              body: "Community and commercial servers are not supported by Autodesk. Some can run arbitrary code inside Revit. Read the code or documentation, check the licence and activity, and test on a copy before any project use.",
              tone: "warn",
            },
          ],
        },
        {
          id: "revit-install",
          label: "Install & connect",
          blocks: [
            {
              kind: "list",
              title: "Prerequisites",
              items: [
                "Windows workstation with Revit 2027 updated to 2027.2",
                "The Revit Public MCP Server add-on in the version you want: Read-Tools, Write-Tools or Experimental-Tools. Autodesk's developer blog says it is offered with the Revit 2027 extensions; check Autodesk's help for the current download location",
                "An AI client that supports local MCP servers, such as Claude Desktop, and a plan approved by your organisation",
                "Permission from IT to install add-ins, and a copy of a model to test on",
              ],
            },
            {
              kind: "steps",
              title: "Claude Desktop, step by step",
              steps: [
                { title: "Install the add-on", body: "Install the Read-Tools version first. It installs to C:\\Program Files\\Autodesk\\Revit 2027 MCP Server Read-Tools Technical Preview\\ with the program Autodesk.RevitMcpServer.Stdio.exe." },
                { title: "Turn on Developer mode", body: "In Claude Desktop open Settings and turn on Developer mode. Autodesk's set-up page says Claude Desktop must be configured by hand." },
                { title: "Open the config file", body: "Go to Settings > Developer and choose Edit Config. This opens claude_desktop_config.json." },
                { title: "Add the server entry", body: "Add an entry under mcpServers whose command is the full path to Autodesk.RevitMcpServer.Stdio.exe and whose args contain --ManageConfigurationWithAutodeskRevitPluginInstaller=true. Double every backslash in the path." },
                { title: "Restart Claude Desktop", body: "Save the file and quit Claude Desktop completely. If it still does not connect, end its process in Task Manager and start it again." },
                { title: "Open Revit and a model", body: "Start Revit 2027.2 and open the test copy of the model." },
                { title: "Test", body: "In Claude, ask 'List the available Revit MCP tools.' If you get the tool list back, the connection works. Then ask a read-only question." },
              ],
            },
            {
              kind: "text",
              title: "Example entry for the Read-Tools version",
              body: [
                "{ \"mcpServers\": { \"revit-mcp-read\": { \"command\": \"C:\\\\Program Files\\\\Autodesk\\\\Revit 2027 MCP Server Read-Tools Technical Preview\\\\Autodesk.RevitMcpServer.Stdio.exe\", \"args\": [\"--ManageConfigurationWithAutodeskRevitPluginInstaller=true\"] } } }",
                "For the Write-Tools version, Autodesk's page shows two entries pointing at the Write-Tools folder: one with --tool-permission=StableReadOnly and one with --tool-min-permission=Stable, both with the same installer flag. Copy the exact entries from Autodesk's set-up page for your version.",
              ],
            },
            {
              kind: "steps",
              title: "Claude Code",
              steps: [
                { title: "Check the pattern", body: "Autodesk documents Claude Desktop and Cursor and says the same configuration generally applies to other clients with local server support. Claude Code is not named, so treat this as untested." },
                { title: "Add the server", body: "In a terminal run: claude mcp add --transport stdio revit-mcp-read -- \"C:\\Program Files\\Autodesk\\Revit 2027 MCP Server Read-Tools Technical Preview\\Autodesk.RevitMcpServer.Stdio.exe\" --ManageConfigurationWithAutodeskRevitPluginInstaller=true" },
                { title: "Start with Revit open", body: "Open Revit 2027.2 and the model, then start Claude Code and run /mcp to check the server is connected." },
                { title: "Ask a read-only question", body: "For example 'What is the active view and how many elements are selected?'" },
              ],
            },
            {
              kind: "steps",
              title: "ChatGPT (desktop app or Codex)",
              steps: [
                { title: "Know the limit", body: "ChatGPT on the web connects only to remote servers, so it cannot start Autodesk's local Revit server. OpenAI's Codex documentation says the ChatGPT desktop app, Codex CLI and IDE extension support local stdio servers." },
                { title: "Add the server", body: "In the ChatGPT desktop app open Settings > MCP servers > Add server, choose STDIO and enter the full path to Autodesk.RevitMcpServer.Stdio.exe with the installer argument. In Codex CLI the equivalent is codex mcp add revit-mcp-read -- followed by the path and argument." },
                { title: "Restart and test", body: "Restart the app, open Revit 2027.2 with a test model and ask 'List the available Revit MCP tools.'" },
                { title: "Record it as unsupported", body: "Neither Autodesk nor OpenAI documents this pairing. Note it as an experiment in your AI register and do not rely on it for deliverables until it has been tested." },
              ],
            },
            {
              kind: "callout",
              title: "If the server does not appear",
              body: "Autodesk's troubleshooting notes: check claude_desktop_config.json is valid JSON, because a single backslash in a Windows path or a trailing comma stops it loading; restart the client fully; and for Cursor use the Windows short path to the program. Logs are in %APPDATA%\\Claude\\logs.",
              tone: "warn",
            },
          ],
        },
        {
          id: "revit-examples",
          label: "Worked examples",
          blocks: [
            {
              kind: "steps",
              title: "Example 1: rooms missing area or department",
              steps: [
                { title: "Prompt", body: "'Using read-only tools, list every room in this model where Area is zero or Department is empty. Give number, name, level and element ID, as a table.'" },
                { title: "What the AI does", body: "Calls query_model to find elements in the Rooms category, then get_element_data to read Area, Department, Number and Level for each one." },
                { title: "Result", body: "A table of failing rooms. Rooms with zero area are usually unplaced, not enclosed or redundant; empty department is a data gap." },
                { title: "What to check", body: "Open a Revit room schedule filtered the same way and compare the count. Ask 'Show elements 123456 and 123457' to zoom to two of them and confirm." },
              ],
            },
            {
              kind: "steps",
              title: "Example 2: doors without a fire rating, then a schedule",
              steps: [
                { title: "Prompt", body: "'Find all doors whose Fire Rating parameter is empty, grouped by level. Then create a schedule called QA - Doors without fire rating with Mark, Level, Type and Fire Rating.'" },
                { title: "What the AI does", body: "Reads doors with query_model and get_element_data. The schedule step needs the Experimental-Tools version: create_schedule, get_schedulable_fields and modify_schedule_filters." },
                { title: "Result", body: "A list by level and, with Experimental-Tools, a new QA schedule in the model that the team can work from." },
                { title: "What to check", body: "Confirm whether Fire Rating is a type or instance parameter in your template, because an empty instance value may be filled at type level. Check the schedule filter before sharing it." },
              ],
            },
            {
              kind: "steps",
              title: "Example 3: sheet numbers against the project naming standard",
              steps: [
                { title: "Prompt", body: "'Get all sheets. Our sheet numbers must follow the pattern role code, hyphen, four digits, for example A-1001, and the project information standard allows roles A, S and M. List the sheets that fail and say why. Do not change anything.'" },
                { title: "What the AI does", body: "With Experimental-Tools it calls get_sheets; with Read-Tools it uses query_model on the Sheets category. It then compares each number with the pattern you gave." },
                { title: "Result", body: "A pass and fail list with reasons, such as wrong role code or three digits instead of four." },
                { title: "What to check", body: "Make sure the rule you typed matches the BEP and the project information standard. If you later ask it to fix numbers with set_sheet_number, review the proposed list first and approve each call." },
              ],
            },
            {
              kind: "steps",
              title: "Example 4: rename views to the office standard",
              steps: [
                { title: "Prompt", body: "'List all floor plan views not on a sheet whose names do not start with the level name. Propose new names in the form Level - Discipline - Purpose. Show me the old and new names as a table and wait for my approval.'" },
                { title: "What the AI does", body: "Reads views with get_views (Experimental-Tools) or query_model, and drafts new names. The tools list has no dedicated view rename tool, so renaming may need modify_element_parameters on the view name, if the server accepts it, or a pyRevit script." },
                { title: "Result", body: "A rename table for review. After approval, either controlled write calls or a script you run yourself." },
                { title: "What to check", body: "Views referenced by sheets, view templates or dependent views. Run the change on a copy and use Undo if something goes wrong." },
              ],
            },
            {
              kind: "steps",
              title: "Example 5: a COBie-like component table",
              steps: [
                { title: "Prompt", body: "'For Mechanical Equipment and Plumbing Fixtures, list Type Name, Manufacturer, Model, Mark, Level and Room, and flag empty values. Export the result as CSV.'" },
                { title: "What the AI does", body: "Uses query_model and get_element_data to collect the values. For a file, it can create a schedule (Experimental-Tools) and use export_views to write the schedule to CSV." },
                { title: "Result", body: "A component table with gaps marked, ready to compare with the asset information requirements." },
                { title: "What to check", body: "This is not a full COBie file. Check the result against the AIR and run the platform's COBie data checker on the real deliverable." },
              ],
            },
            {
              kind: "steps",
              title: "Example 6: IFC export, then an IDS check",
              steps: [
                { title: "Prompt", body: "'Export the active document to IFC in C:\\Projects\\PRJ01\\Exports using the project's IFC settings.'" },
                { title: "What the AI does", body: "With Experimental-Tools it calls export_ifc." },
                { title: "Result", body: "An IFC file in the export folder." },
                { title: "What to check", body: "Check the export settings used. Then load the IFC and the project IDS in the platform's Model QA from IDS, which explains failures and writes them as BCF." },
              ],
            },
            {
              kind: "callout",
              title: "Make prompts traceable",
              body: "Always ask for element IDs, say whether changes are allowed, and ask for a table. A result you can trace back to elements is a result you can check.",
              tone: "info",
            },
          ],
        },
        {
          id: "revit-limits",
          label: "Limits & safety",
          blocks: [
            {
              kind: "callout",
              title: "Write tools change the model",
              body: "Autodesk warns that the Write and Experimental servers can modify the model, and advises backing up the model before write operations and reviewing proposed changes before accepting them. Install Read-Tools first and move up only when you need to.",
              tone: "warn",
            },
            {
              kind: "checklist",
              title: "Safe working rules",
              items: [
                "Work on a detached or saved-as copy until the workflow is proven",
                "Start with the Read-Tools version",
                "Ask the AI to list proposed changes as a table before any write",
                "Approve each tool call yourself; do not switch on automatic approval for write tools",
                "Check results with a Revit schedule or by zooming to a sample of elements",
                "Use Undo or the backup if a change is wrong; save only when satisfied",
                "Never sync a central model straight after an AI change without a human review",
              ],
            },
            {
              kind: "list",
              title: "Known limits",
              items: [
                "Tech preview: tools, names and behaviour may change before general availability",
                "One version supported during the preview: Revit 2027.2",
                "The AI sees only what the tools return; it can misread parameters or units, so check values",
                "Large models can return long results; ask for counts or filtered lists first",
                "Answers vary between runs; keep the prompt and the output with your QA record",
              ],
            },
            {
              kind: "steps",
              title: "The low-risk alternative: AI writes, you run",
              steps: [
                { title: "Describe the check", body: "Ask Claude or ChatGPT for a pyRevit script or Dynamo graph that only reads, for example 'list doors without a fire rating to CSV'." },
                { title: "Review the code", body: "Look for Transaction blocks. A read-only script should have none." },
                { title: "Run on a copy", body: "Run it in pyRevit or Dynamo on a copy and compare the output with a schedule." },
                { title: "Keep it", body: "Save working scripts in the office library. The platform's Revit project check can also generate a read-only pyRevit button from your rules." },
              ],
            },
          ],
        },
      ],
    },
    // ======================================================================== 3. AutoCAD
    {
      id: "autocad",
      label: "AutoCAD",
      tabs: [
        {
          id: "autocad-options",
          label: "Options",
          blocks: [
            {
              kind: "callout",
              title: "With the FirstOption AutoCAD MCP",
              body: "Our AutoCAD connector (firstoption-autocad) works in AutoCAD 2015–2027, not AutoCAD LT. It runs AutoLISP for quick queries and edits and C# for heavy geometry, blocks, attributes and layouts. The same setup also installs the Plant 3D connector for AutoCAD Plant 3D 2015–2027.",
              tone: "ok",
            },
            {
              kind: "table",
              title: "Ways to use AI with AutoCAD",
              columns: ["Option", "How it works", "Good for", "Notes"],
              rows: [
                ["FirstOption AutoCAD MCP (firstoption-autocad)","Our connector from the FirstOption MCP Suite; Claude Code or Codex runs AutoLISP or C# inside the open drawing","Layer and block audits, attribute extraction, layouts and repeated drafting edits","AutoCAD 2015–2027, not LT. Shared command library and audit log"],
                ["AutoLISP or script written by AI", "The AI drafts a .lsp routine or .scr script; you load it with APPLOAD and run it", "Layer audits, attribute extraction, block counts, purge and naming checks", "Lowest risk; works without any connection. AutoLISP needs full AutoCAD, or AutoCAD LT 2024 or later on Windows"],
                [".NET add-in written by AI", "The AI drafts C# against the AutoCAD .NET API; a developer builds and tests it", "Heavier or repeated tasks", "Needs Visual Studio and a developer to review"],
                ["Autodesk AutoCAD and Civil 3D MCP Server", "Autodesk's local server inside Autodesk Assistant on Windows", "Questions about the open drawing: object types, queries, counts, view and selection, comparison with a template", "Tech preview. In AutoCAD it exposes read and analysis tools only. Autodesk documents Autodesk Assistant as the client"],
                ["autocad-mcp (puran-water)", "Community MCP server (MIT) for Claude Desktop or Claude Code; drives AutoCAD LT 2024 or later through an AutoLISP dispatcher, or edits DXF headless with ezdxf", "Experiments with drawing, layers, blocks and annotation", "Third party. Includes execute_lisp, which runs arbitrary AutoLISP, and a drawing create action that erases the current drawing"],
                ["APS Automation API for AutoCAD", "Runs AutoCAD headless in the cloud with your AutoLISP or add-in", "Batch title block updates, CAD standards checks, purge and plot across many DWGs", "Developer project; Autodesk lists these as typical uses"],
              ],
            },
            {
              kind: "callout",
              title: "Check the version first",
              body: "AutoCAD LT for Mac does not support AutoLISP. Some features used below, such as the CAD Standards checker and Data Extraction, are in full AutoCAD but not in every LT release. Check what your licence includes.",
              tone: "info",
            },
          ],
        },
        {
          id: "autocad-setup",
          label: "Set up",
          blocks: [
            {
              kind: "steps",
              title: "AI-written AutoLISP, step by step",
              steps: [
                { title: "Describe the task", body: "Tell the AI the AutoCAD product and version, the CAD standard rules and the output you want, for example 'a CSV of every layer with colour, linetype and whether it matches our list'." },
                { title: "Ask for read-only code", body: "Ask it to read only and write a report file, and to explain each function it uses." },
                { title: "Review", body: "Read the routine. Look for commands that erase, purge, rename or save; remove them if you asked for a report." },
                { title: "Load and run on a copy", body: "Save the code as a .lsp file, use APPLOAD in a copy of the drawing, and type the command name the routine defines." },
                { title: "Check and keep", body: "Compare the report with the Layer Properties Manager. Keep working routines in a shared, version-controlled folder." },
              ],
            },
            {
              kind: "steps",
              title: "A community MCP server with Claude",
              steps: [
                { title: "Get approval", body: "Ask IT and the BIM or CAD manager before installing third-party software that controls AutoCAD." },
                { title: "Follow the project's README", body: "For autocad-mcp this means Windows-native Python 3.10 or later, loading mcp_dispatch.lsp with APPLOAD, and adding the server to claude_desktop_config.json or Claude Code." },
                { title: "Test on a blank drawing", body: "Some actions erase content. Never test on a live project drawing." },
                { title: "Limit what it can run", body: "Decline any execute_lisp call you do not understand." },
              ],
            },
            {
              kind: "steps",
              title: "APS Automation API (developer route)",
              steps: [
                { title: "Create an APS app", body: "Register an application on Autodesk Platform Services with the Automation API enabled." },
                { title: "Package the routine", body: "Package the AutoLISP or .NET code as an app bundle and define an activity that runs it." },
                { title: "Submit work items", body: "Send each DWG as a work item and collect the output reports." },
                { title: "Check costs and data location", body: "Cloud processing is charged; confirm the current APS pricing and that the client allows drawings to be processed in Autodesk's cloud." },
              ],
            },
          ],
        },
        {
          id: "autocad-examples",
          label: "Worked examples",
          blocks: [
            {
              kind: "steps",
              title: "Example 1: layer audit against the CAD standard",
              steps: [
                { title: "Prompt", body: "'Write an AutoLISP routine called LAYAUDIT that reads every layer in the current drawing and writes a CSV with name, colour, linetype, lineweight, plot flag and whether the name is in this approved list: [paste list]. Read only.'" },
                { title: "What the AI does", body: "Writes a routine that walks the layer table with tblnext, collects the properties and writes the file." },
                { title: "Result", body: "A CSV listing non-standard layers, ready for Excel." },
                { title: "What to check", body: "Spot-check three layers in the Layer Properties Manager. In full AutoCAD you can also compare with a .dws file using the CAD Standards checker." },
              ],
            },
            {
              kind: "steps",
              title: "Example 2: title block attributes to a register",
              steps: [
                { title: "Prompt", body: "'Write AutoLISP that finds every insert of the block TB-A1 in model and paper space and exports the attributes DRG_NO, TITLE, REV, STATUS and DATE to CSV, one row per layout.'" },
                { title: "What the AI does", body: "Writes a routine that selects block references by name, reads their attributes and writes one row per layout." },
                { title: "Result", body: "A drawing register extract to compare with the delivery plan." },
                { title: "What to check", body: "Run the exported numbers through the platform's file naming checker, and check status and revision codes against the project's codes." },
              ],
            },
            {
              kind: "steps",
              title: "Example 3: block counts to Excel",
              steps: [
                { title: "Prompt", body: "'Count every block reference by block name and layer in model space and write the result to CSV.'" },
                { title: "What the AI does", body: "Drafts AutoLISP, or suggests the built-in Data Extraction wizard in full AutoCAD, which can write to Excel." },
                { title: "Result", body: "A count table for quantity checks." },
                { title: "What to check", body: "Nested and dynamic blocks can be counted differently; compare one block name with a manual count." },
              ],
            },
            {
              kind: "steps",
              title: "Example 4: purge and naming checks before issue",
              steps: [
                { title: "Prompt", body: "'Write a script that lists unused blocks, layers and text styles without purging them, and reports any layer or block names that contain spaces or lower-case letters.'" },
                { title: "What the AI does", body: "Writes a routine that checks usage and names without calling PURGE." },
                { title: "Result", body: "A list of what would be purged and what breaks the naming rules." },
                { title: "What to check", body: "Review before purging; purge on a copy, then save. Keep the report with the issue record." },
              ],
            },
          ],
        },
        {
          id: "autocad-limits",
          label: "Limits",
          blocks: [
            {
              kind: "list",
              title: "Limits to plan for",
              items: [
                "AI-written AutoLISP often looks right but uses a wrong function or DXF group code; always test on a copy",
                "Autodesk's AutoCAD and Civil 3D MCP Server is a tech preview and is documented for Autodesk Assistant, not for Claude or ChatGPT",
                "Community servers can send keystrokes or run arbitrary code inside AutoCAD",
                "Xrefs, nested blocks and annotative objects need explicit handling in prompts",
                "Results depend on drawing units; say which units the drawing uses",
              ],
            },
            {
              kind: "callout",
              title: "Keep the master safe",
              body: "Run every AI-written routine on a copy of the drawing. Do not save over a shared or published container until a person has checked the result.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ======================================================================== 4. Navisworks
    {
      id: "navisworks",
      label: "Navisworks",
      tabs: [
        {
          id: "nw-options",
          label: "Options",
          blocks: [
            {
              kind: "callout",
              title: "With the FirstOption Navisworks MCP",
              body: "Autodesk lists no MCP server for Navisworks, but our Navisworks connector (firstoption-navisworks) works in Navisworks Manage or Simulate 2020–2027, not Freedom. It uses the Navisworks .NET API to read models, selection sets, viewpoints and clash tests, so you can ask Claude Code or Codex about clash results in the open file.",
              tone: "ok",
            },
            {
              kind: "table",
              title: "Ways to use AI with Navisworks",
              columns: ["Option", "How it works", "Good for", "Notes"],
              rows: [
                ["FirstOption Navisworks MCP (firstoption-navisworks)","Our connector from the FirstOption MCP Suite; Claude Code or Codex works through the Navisworks .NET API","Reading models, selection sets, viewpoints and clash tests in the open file","Manage or Simulate 2020–2027, not Freedom"],
                ["Clash report export, then AI triage", "Export Clash Detective results as XML or HTML and load them in the platform's Clash triage", "Grouping clashes by root cause, assigning teams, meeting agendas, BCF", "No install; the report is read in the browser; AI triage sends a compact summary of groups"],
                ["BCF exchange", "Move issues between Navisworks and authoring tools as BCF, through a BCF plug-in or a connected issue service", "Getting clash issues back to Revit or other tools", "Check whether your Navisworks set-up has a BCF add-in; the platform's BCF studio can open and edit BCF files"],
                ["Navisworks .NET API add-in", "A plug-in, automation or control written in C#; the AI can draft it", "Search sets from rules, selection by GUID, custom reports", "Autodesk recommends the .NET API for new work; the SDK is installed in the api folder of Navisworks Manage and Simulate"],
                ["navisworks-mcp (xuantinhnbs-rgb)", "Community MCP server (MIT) using Navisworks COM automation from Python", "Browsing the model tree, reading properties, search, select, colour, hide and screenshots", "Third party. Verified by its author on Navisworks Manage 2026. Does not support Clash Detective, TimeLiner or Quantification"],
                ["Autodesk MCP server", "None listed by Autodesk at October 2026", "-", "Check Autodesk's MCP help for changes"],
              ],
            },
            {
              kind: "callout",
              title: "Files are the safe default",
              body: "Navisworks coordination is mostly about reports and issues, not model edits. Exporting clash results and working on the files gives most of the value with none of the risk.",
              tone: "ok",
            },
          ],
        },
        {
          id: "nw-examples",
          label: "Worked examples",
          blocks: [
            {
              kind: "steps",
              title: "Example 1: clash triage end to end with the platform",
              steps: [
                { title: "Run the tests", body: "In Navisworks Manage run the clash tests in Clash Detective." },
                { title: "Export the report", body: "On the Report tab choose the clashes and fields to include, then write the report as XML or HTML." },
                { title: "Load it in Clash triage", body: "Open AI studio > Clash triage on this platform and drop in the report. Clashes are grouped into duplicates, clusters and category pairs." },
                { title: "Triage with AI", body: "Add the stage and tolerances, then ask the AI to suggest priority, responsible team and likely cause for each group." },
                { title: "Review and export", body: "Correct the suggestions, then export BCF for the authoring teams, Excel for the record and a meeting agenda." },
                { title: "What to check", body: "False positives such as insulation or tolerance clashes, and groups that hide two different causes. The coordinator owns the final triage." },
              ],
            },
            {
              kind: "steps",
              title: "Example 2: search sets and a clash test matrix",
              steps: [
                { title: "Prompt", body: "'We have architecture, structure, mechanical, electrical and drainage models from Revit. Suggest Navisworks search sets based on Revit category and system properties, and a clash test matrix with hard and clearance tests and tolerances for stage 4.'" },
                { title: "What the AI does", body: "Drafts a list of search sets with their property conditions and a test matrix by discipline pair." },
                { title: "Result", body: "A starting matrix to refine with the task teams, and a definition list to build the sets in Navisworks." },
                { title: "What to check", body: "Property names must match what your exported models actually contain. Compare with the platform's Clash matrix builder and agree tolerances in the BEP." },
              ],
            },
            {
              kind: "steps",
              title: "Example 3: a selection set from a list of GUIDs",
              steps: [
                { title: "Prompt", body: "'Here are 40 IFC GUIDs from a QA report. Write a Navisworks .NET API plug-in that finds items whose IfcGUID property matches the list and saves them as a selection set called QA-Fails.'" },
                { title: "What the AI does", body: "Drafts C# that builds a search on the property, runs it and adds the result to the saved selection sets." },
                { title: "Result", body: "Code a developer can build and load, or a manual route using Find Items for small lists." },
                { title: "What to check", body: "The property name and category differ between IFC and native Revit files. Test on a copy of the federated model and confirm the count." },
              ],
            },
          ],
        },
        {
          id: "nw-limits",
          label: "Limits",
          blocks: [
            {
              kind: "list",
              title: "Limits to plan for",
              items: [
                "Autodesk listed no MCP server of its own for Navisworks when this guide was checked; the FirstOption Navisworks MCP covers Manage and Simulate 2020–2027",
                "AI triage is a suggestion; responsibility for clash decisions stays with the coordinator and task teams",
                "Clash reports can include file paths and names that reveal project information; check before uploading",
                "Plan add-ins for Navisworks Manage or Simulate, where the API SDK is installed; the free Freedom viewer is not the target for them",
                "Third-party servers that control Navisworks can open, append and save models",
              ],
            },
            {
              kind: "callout",
              title: "Keep BCF as the record",
              body: "Track coordination issues in BCF or the CDE issue tool, not in an AI chat. The chat helps you prepare; the issue record is what the project relies on.",
              tone: "info",
            },
          ],
        },
      ],
    },
    // ======================================================================== 5. Civil 3D
    {
      id: "civil3d",
      label: "Civil 3D",
      tabs: [
        {
          id: "c3d-options",
          label: "Options",
          blocks: [
            {
              kind: "callout",
              title: "With the FirstOption Civil 3D MCP",
              body: "Our Civil 3D connector (firstoption-civil3d) works in Civil 3D 2015–2027. It runs C# through the Civil 3D .NET API and AutoLISP inside the open drawing, with the same shared command library and audit log as the other connectors.",
              tone: "ok",
            },
            {
              kind: "table",
              title: "Ways to use AI with Civil 3D",
              columns: ["Option", "How it works", "Good for", "Notes"],
              rows: [
                ["FirstOption Civil 3D MCP (firstoption-civil3d)","Our connector from the FirstOption MCP Suite; Claude Code or Codex runs C# or AutoLISP inside Civil 3D","Reports and checks on alignments, profiles, surfaces and corridors","Civil 3D 2015–2027. Shared command library and audit log"],
                ["Dynamo for Civil 3D, graph or Python written by AI", "The AI drafts a Dynamo graph outline or Python node; you build and run it in Dynamo", "Reports on alignments, profiles, corridors and pipe networks", "Low risk when read-only; the Dynamo primer treats the Civil 3D .NET API guides as essential reading for Python"],
                ["Civil 3D .NET API add-in", "The AI drafts C#; a developer builds and tests it", "Repeated reports and checks across many drawings", "Autodesk's Civil 3D help includes an API developer's guide"],
                ["AutoLISP and command scripts", "As for AutoCAD; Civil 3D objects are better read through Dynamo or .NET", "Layer, block and drawing checks", "Simple and quick"],
                ["Autodesk AutoCAD and Civil 3D MCP Server", "Local server inside Autodesk Assistant", "Querying and counting objects; in Civil 3D also updating slope analysis data on surfaces (Civil 3D 2027.1 or later) and querying or changing styles", "Tech preview; documented for Autodesk Assistant"],
                ["civil3d-mcp (barbosaihan)", "Community MCP server (MIT): the AI writes C# that a Civil 3D plug-in compiles and runs", "Experiments by developers", "Third party. Has a read-only query tool and an execute tool that commits changes to the drawing"],
              ],
            },
          ],
        },
        {
          id: "c3d-examples",
          label: "Worked examples",
          blocks: [
            {
              kind: "steps",
              title: "Example 1: alignment and profile report",
              steps: [
                { title: "Prompt", body: "'Write a Dynamo for Civil 3D Python node that lists every alignment with name, start and end station, length and its profiles with minimum and maximum grade. Output a list I can write to Excel.'" },
                { title: "What the AI does", body: "Drafts Python that opens the drawing's alignments through the Civil 3D API, reads their properties and profiles and returns a table." },
                { title: "Result", body: "An Excel report for design review." },
                { title: "What to check", body: "Station equations and units. Compare two alignments with Civil 3D's own reports." },
              ],
            },
            {
              kind: "steps",
              title: "Example 2: pipe network data checks",
              steps: [
                { title: "Prompt", body: "'List all pipes in the network Storm-01 with start and end structure, diameter, material, slope and cover, and flag slopes below 0.5 percent or cover below 1.2 metres.'" },
                { title: "What the AI does", body: "Drafts a Dynamo Python node or .NET routine that reads pipe and structure properties and applies the thresholds you gave." },
                { title: "Result", body: "A flagged list of pipes to review." },
                { title: "What to check", body: "The thresholds are yours, not the AI's; take them from the project's design standard. Check that cover is measured to the surface you expect." },
              ],
            },
            {
              kind: "steps",
              title: "Example 3: corridor properties to Excel",
              steps: [
                { title: "Prompt", body: "'For each corridor, list baselines, regions, assemblies used, start and end stations and frequency, and write them to Excel.'" },
                { title: "What the AI does", body: "Drafts code that walks corridors, baselines and regions and collects the values." },
                { title: "Result", body: "A corridor register for model review." },
                { title: "What to check", body: "Out-of-date corridors give misleading results; rebuild first in a copy." },
              ],
            },
            {
              kind: "steps",
              title: "Example 4: IFC 4.3 export checks",
              steps: [
                { title: "Export", body: "Export IFC from Civil 3D with the IFCEXPORT command, choosing the schema in the export options. Which schema versions and objects are offered depends on your release and IFC extension, so check Autodesk's help for your version." },
                { title: "Prompt", body: "In the platform's IFC tools, ask: 'Which alignments, surfaces and pipe networks are in this IFC, and which elements are missing the properties our IDS requires?'" },
                { title: "Result", body: "A list of missing or wrongly mapped elements, with BCF issues from Model QA." },
                { title: "What to check", body: "Open the IFC in a second viewer and confirm alignments and georeferencing before sharing." },
              ],
            },
          ],
        },
        {
          id: "c3d-limits",
          label: "Limits",
          blocks: [
            {
              kind: "list",
              title: "Limits to plan for",
              items: [
                "The Civil 3D API is large and changes between releases; say your version in every prompt",
                "Dynamo node names and packages differ by release; AI suggestions may name nodes that do not exist",
                "Data shortcuts and references mean an object may live in another drawing",
                "Write tools in Autodesk's server and in community servers can change styles or drawing data",
              ],
            },
            {
              kind: "callout",
              title: "Read-only first",
              body: "Ask for reports, not edits, until the code has been reviewed and tested on a copy. Store working graphs and routines in the office library.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ======================================================================== 6. Security & governance
    {
      id: "security",
      label: "Security & governance",
      tabs: [
        {
          id: "sec-risks",
          label: "Risks & controls",
          blocks: [
            {
              kind: "table",
              title: "Risks when AI meets Autodesk software",
              columns: ["Risk", "Example", "Control"],
              rows: [
                ["Data leaving the office", "Element data, room names or clash reports sent to an AI service", "Use an approved business plan, classify the information, send only what the task needs"],
                ["Wrong account or licence", "Personal AI accounts used for client work; Autodesk products shared beyond the licence", "Company accounts only; follow Autodesk and AI vendor terms"],
                ["Too much permission", "Write or experimental tools installed on every PC", "Read-only tools by default; write tools only for named users on copies"],
                ["Unreviewed changes", "Hundreds of parameters changed in one prompt", "Proposed changes as a table first, approval for each call, backup and Undo"],
                ["Prompt injection", "Text in a parameter, comment, file name or PDF telling the AI to run other tools or send data", "Treat model content as data; review tool calls; do not mix untrusted content with write tools"],
                ["Untrusted software", "A community server that runs arbitrary code inside Revit or AutoCAD", "Approved list of servers, code review, pinned versions"],
                ["No record", "Nobody can say which AI changed what", "Keep prompts, tool calls and outputs with the QA record; note AI use in the BEP"],
              ],
            },
            {
              kind: "callout",
              title: "Model content can carry instructions",
              body: "Anything the AI reads, including element comments, sheet names, linked files and PDFs, could contain text written to mislead it. The AI should treat such text as data. If a tool call looks unrelated to your request, decline it.",
              tone: "warn",
            },
          ],
        },
        {
          id: "sec-gov",
          label: "Governance",
          blocks: [
            {
              kind: "text",
              title: "Who decides",
              body: [
                "Connecting AI to project models is an information management decision. The appointing party may set rules for AI use in the exchange information requirements or the appointment, and the lead appointed party should record the agreed approach in the BEP.",
                "Inside your organisation, the BIM manager, IT and information security should agree which clients, servers and versions are allowed, and who may use write tools.",
              ],
            },
            {
              kind: "callout",
              title: "ISO 19650-5 sensitivity",
              body: "Where the security triage calls for a security-minded approach, ISO 19650-5 expects a security management plan controlling access to sensitive information. Check AI connections against that plan. Sensitive asset information should not be sent to AI services that the plan does not approve.",
              tone: "warn",
            },
            {
              kind: "callout",
              title: "ISO/IEC 42001 controls",
              body: "If your organisation runs an AI management system under ISO/IEC 42001, record each connection in the AI inventory, assess risk and impact, assign an owner and keep evidence of human review. See the ISO/IEC 42001 hub on this platform at /hubs/iso42001.",
              tone: "info",
            },
            {
              kind: "list",
              title: "Logging",
              items: [
                "Keep the conversation or an export of it for any AI-assisted check that affects a deliverable",
                "Claude Desktop writes MCP logs to %APPDATA%\\Claude\\logs on Windows",
                "Note the server name, version and tool set (Read, Write or Experimental) used",
                "Record AI use in the container's QA record, with the person who checked it",
              ],
            },
          ],
        },
        {
          id: "sec-checklist",
          label: "Before a live project",
          blocks: [
            {
              kind: "checklist",
              title: "Checklist before connecting a live project",
              items: [
                "Client or appointing party agrees to AI use and to where data will be processed",
                "Security triage and any security management plan checked",
                "AI plan is a company business plan with approved data terms",
                "Server is official or on the approved list, with version recorded",
                "Read-only version installed; write tools disabled or limited to named users",
                "Tested on a copy of the model or drawing with known answers",
                "Users trained to read tool calls before approving them",
                "Backup and rollback route confirmed",
                "AI use recorded in the BEP and the AI register",
                "Review date set to recheck versions, terms and permissions",
              ],
            },
          ],
        },
      ],
    },
    // ======================================================================== 7. FAQ, quiz & resources
    {
      id: "resources",
      label: "FAQ & resources",
      tabs: [
        {
          id: "faq",
          label: "FAQ",
          blocks: [
            {
              kind: "faq",
              title: "Frequently asked questions",
              items: [
                { q: "Is there an official Revit MCP server?", a: "Yes. Autodesk's Revit Public MCP Server is a Tech Preview (public beta) for Revit 2027.2, offered as Read-Tools, Write-Tools and Experimental-Tools add-ons. Check Autodesk's MCP help for the current status." },
                { q: "Can I use it with Revit 2025 or 2026?", a: "Not during the preview: Autodesk lists Revit 2027.2 only. For older versions use AI-written pyRevit or Dynamo scripts, file-based checks, or a third-party server that supports your version." },
                { q: "Does ChatGPT work with the Revit server?", a: "ChatGPT on the web cannot run a local server. OpenAI documents local stdio servers for the ChatGPT desktop app and Codex, but Autodesk does not document the pairing, so treat it as an untested experiment." },
                { q: "Is there an official AutoCAD or Civil 3D MCP server?", a: "Autodesk documents an AutoCAD and Civil 3D MCP Server as a tech preview that runs inside Autodesk Assistant on Windows. It is not documented for Claude or ChatGPT." },
                { q: "Is there an MCP server for Navisworks?", a: "Autodesk did not list one when this guide was checked. A community server exists for Navisworks Manage and Simulate. Most teams get more value from exporting clash reports to the platform's Clash triage." },
                { q: "Will the AI change my model without asking?", a: "Read-only tools cannot change it. With write tools, Claude asks before each tool call unless you have allowed it automatically. Keep approval on, and work on a copy." },
                { q: "Can I undo an AI change in Revit?", a: "Changes are made inside Revit, so Undo and your backups still apply. Check before you save or sync with central." },
                { q: "Do I need to code?", a: "Not for the official Revit server or file-based checks. You do need to edit a config file once. Scripts written by AI need someone who can read and test them." },
                { q: "What is the Automation API?", a: "The APS cloud service, formerly called the Design Automation API, that runs AutoCAD, Revit, Inventor, 3ds Max and Fusion engines without a desktop. It suits batch jobs built by a developer." },
                { q: "What does the AI service see?", a: "Your prompt and whatever the tools return, such as element data or file contents. It does not get the whole model unless a tool sends it. Check your plan's data terms." },
                { q: "Should I use Autodesk Assistant or Claude?", a: "Autodesk Assistant works inside the product with no extra set-up. Claude or ChatGPT can combine Revit data with other sources and files. Many teams will use both; follow your organisation's approved list." },
                { q: "How do I record AI use under ISO 19650?", a: "Note the approach in the BEP, keep prompts and outputs with the QA record, and make sure a named person checks results before a container is shared." },
              ],
            },
            {
              kind: "quiz",
              title: "Check your understanding",
              questions: [
                { q: "Which Revit version does Autodesk's Revit Public MCP Server support during the tech preview?", options: ["Revit 2025", "Revit 2026", "Revit 2027.2"], answer: 2, why: "Autodesk's help pages list Revit 2027.2 as the only supported version during the preview." },
                { q: "Which version of the Revit server should you install first?", options: ["Read-Tools", "Write-Tools", "Experimental-Tools"], answer: 0, why: "Read-Tools cannot change the model, so it is the safe starting point." },
                { q: "Why can ChatGPT on the web not use Autodesk's local Revit server directly?", options: ["It only connects to remote servers over HTTPS", "Autodesk blocks ChatGPT", "It needs Revit 2028"], answer: 0, why: "ChatGPT on the web adds custom MCP servers by URL or tunnel; it cannot start a program on your PC." },
                { q: "What is the lowest-risk way to automate a Revit check with AI?", options: ["Experimental-Tools on the central model", "AI writes a read-only script that a person reviews and runs on a copy", "Letting the AI approve its own tool calls"], answer: 1, why: "The model is never connected, and a person controls what runs." },
                { q: "What should you do with a Navisworks clash report on this platform?", options: ["Paste it into a public chatbot", "Load it into Clash triage, review the groups and export BCF", "Email it to all task teams unchanged"], answer: 1, why: "Clash triage groups clashes, suggests owners and exports BCF while a person keeps control." },
                { q: "Text in an element comment tells the AI to delete views. What is this?", options: ["A normal instruction", "Prompt injection", "A Revit warning"], answer: 1, why: "Content inside the model is data. Instructions hidden in it are prompt injection and must be ignored." },
              ],
            },
          ],
        },
        {
          id: "links",
          label: "Links & ask AI",
          blocks: [
            {
              kind: "links",
              title: "FirstOption MCP Hub",
              links: [
                { label: "MCP Hub home", href: `${FO}/`, note: "Overview, download and frequently asked questions", tone: "blue" },
                { label: "All products", href: `${FO}/products?public`, note: "Revit, AutoCAD, Civil 3D, Plant 3D and Navisworks connectors", tone: "teal" },
                { label: "Sign up", href: `${FO}/signup`, note: "Create your company and get the code to connect each PC", tone: "green" },
                { label: "Revit hub: MCP for Revit & Autodesk", href: "/hubs/revit", note: "On this platform: install, supported versions and troubleshooting", tone: "purple" },
              ],
            },
            {
              kind: "links",
              title: "Autodesk documentation",
              links: [
                { label: "Autodesk MCP Servers help", href: "https://help.autodesk.com/view/ADSKMCP/ENU/", note: "All Autodesk MCP servers, status and governance pages", tone: "blue" },
                { label: "Revit Public MCP Server", href: "https://help.autodesk.com/cloudhelp/ENU/ADSKMCP-RevitMcp/files/ADSKMCP_RevitMcp_revit_mcp_server_html.html", note: "Overview, versions and modes", tone: "blue" },
                { label: "Setting up the Revit Public MCP Server", href: "https://help.autodesk.com/cloudhelp/ENU/ADSKMCP-RevitMcp/files/ADSKMCP_RevitMcp_setting_up_revit_mcp_server_html.html", note: "Claude Desktop and Cursor configuration, verification, troubleshooting", tone: "blue" },
                { label: "Revit MCP tools", href: "https://help.autodesk.com/cloudhelp/ENU/ADSKMCP-RevitMcp/files/revitmcp_tools.html", note: "Read, Write and Experimental tools", tone: "blue" },
                { label: "AutoCAD and Civil 3D MCP Server", href: "https://help.autodesk.com/cloudhelp/ENU/ADSKMCP-AutoCADCivil3DMcp/files/ADSKMCP_AutoCADCivil3DMcp_autodesk_autocad_civil_3d_mcp_html.html", note: "Tech preview inside Autodesk Assistant", tone: "blue" },
                { label: "Product Help MCP Server", href: "https://help.autodesk.com/cloudhelp/ENU/ADSKMCP-KnowledgeMcp/files/ADSKMCP_KnowledgeMcp_autodesk_product_help_mcp_server_html.html", note: "Remote server for Autodesk help content", tone: "blue" },
                { label: "Revit 2027 and Autodesk Assistant", href: "https://blog.autodesk.io/revit-2027-and-autodesk-assistant-release-announcement/", note: "Autodesk developer blog (Japanese)", tone: "blue" },
                { label: "APS sample: MCP server for Revit Automation", href: "https://github.com/autodesk-platform-services/aps-sample-mcp-server-revit-automation", note: "For developers; runs Revit in the cloud", tone: "purple" },
                { label: "Automation API", href: "https://aps.autodesk.com/design-automation-apis", note: "AutoCAD, Revit, Inventor, 3ds Max and Fusion in the cloud", tone: "purple" },
                { label: "Design Automation is now Automation API", href: "https://aps.autodesk.com/blog/name-change-design-automation-api-now-automation-api", note: "APS blog, name change", tone: "purple" },
                { label: "Navisworks API overview", href: "https://aps.autodesk.com/developer/overview/navisworks", note: ".NET API, COM API and NWcreate", tone: "purple" },
                { label: "Civil 3D developer's guide", href: "https://help.autodesk.com/view/CIV3D/2026/ENU/?contextId=developer-guide", note: "Civil 3D 2026 help", tone: "purple" },
              ],
            },
            {
              kind: "links",
              title: "AI clients and scripting tools",
              links: [
                { label: "Local MCP servers on Claude Desktop", href: "https://support.claude.com/en/articles/10949351-get-started-with-local-mcp-servers-on-claude-desktop", note: "Desktop extensions and set-up", tone: "teal" },
                { label: "Claude Code MCP documentation", href: "https://code.claude.com/docs/en/mcp", note: "claude mcp add, scopes and troubleshooting", tone: "teal" },
                { label: "ChatGPT custom MCP servers", href: "https://help.openai.com/en/articles/12584461", note: "OpenAI help centre: plans, permissions and set-up", tone: "teal" },
                { label: "Add a custom MCP server to ChatGPT", href: "https://developers.openai.com/api/docs/guides/custom-mcp-server", note: "OpenAI developer docs", tone: "teal" },
                { label: "Secure MCP Tunnel", href: "https://developers.openai.com/api/docs/guides/secure-mcp-tunnels", note: "Reach a private server from ChatGPT", tone: "teal" },
                { label: "MCP in Codex and the ChatGPT desktop app", href: "https://developers.openai.com/codex/mcp", note: "Local stdio servers, codex mcp add", tone: "teal" },
                { label: "pyRevit", href: "https://github.com/pyrevitlabs/pyRevit", note: "Free Revit scripting add-in", tone: "green" },
                { label: "Dynamo Primer: Dynamo for Civil 3D", href: "https://primer2.dynamobim.org/dynamo-for-civil-3d", note: "Graphs and Python for Civil 3D", tone: "green" },
              ],
            },
            {
              kind: "links",
              title: "Community MCP servers (third party, not supported by Autodesk)",
              links: [
                { label: "mcp-servers-for-revit", href: "https://github.com/mcp-servers-for-revit/mcp-servers-for-revit", note: "Revit 2020-2026, read and write, MIT", tone: "amber" },
                { label: "revit-mcp", href: "https://github.com/revit-mcp/revit-mcp", note: "Original Revit MCP project", tone: "amber" },
                { label: "autocad-mcp", href: "https://github.com/puran-water/autocad-mcp", note: "AutoCAD LT 2024+ via AutoLISP, or DXF with ezdxf, MIT", tone: "amber" },
                { label: "civil3d-mcp", href: "https://github.com/barbosaihan/civil3d-mcp", note: "AI-written C# run inside Civil 3D, MIT", tone: "amber" },
                { label: "navisworks-mcp", href: "https://github.com/xuantinhnbs-rgb/navisworks-mcp", note: "Navisworks Manage or Simulate via COM, MIT", tone: "amber" },
              ],
            },
            {
              kind: "links",
              title: "On this platform",
              links: [
                { label: "MCP hub", href: "/hubs/mcp", note: "On this platform: how MCP works, Claude Desktop and Claude Code set-up", tone: "purple" },
                { label: "Connect via MCP (setup tool)", href: "/ai-tools/mcp", note: "On this platform: connect Claude to Revit, IFC and CDE tools", tone: "purple" },
                { label: "Clash triage", href: "/ai-studio/clash", note: "On this platform: Navisworks reports to groups, owners and BCF", tone: "green" },
                { label: "Model QA from IDS", href: "/ai-studio/model-qa", note: "On this platform: check IFC against IDS, issues as BCF", tone: "green" },
                { label: "Revit project check", href: "/model-tools/revit", note: "On this platform: read-only pyRevit check and grading", tone: "green" },
                { label: "BCF studio", href: "/bim-tools/bcf", note: "On this platform: open, edit and convert BCF", tone: "blue" },
                { label: "IDS builder", href: "/bim-tools/ids", note: "On this platform: write model requirements as IDS", tone: "blue" },
                { label: "ISO/IEC 42001 hub", href: "/hubs/iso42001", note: "On this platform: AI management system controls", tone: "red" },
              ],
            },
            { kind: "widget", widget: "ask-ai", title: "Ask AI about connecting Autodesk software" },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "How do I connect Autodesk's Revit MCP server to Claude Desktop step by step?",
    "Which route should our team use to bring AI into Navisworks clash coordination?",
    "Write a read-only AutoLISP routine that audits layers against our CAD standard.",
    "What should we check before connecting AI to a live project model under ISO 19650-5?",
  ],
};
