import type { Hub } from "./types";

// MCP hub: how to connect AI assistants to BIM tools using the Model Context Protocol.
// Facts are drawn from modelcontextprotocol.io (specification and connection guides), Anthropic's
// Claude Code and Claude help documentation, and Autodesk's MCP help pages and blogs (checked October 2026). MCP clients, commands and
// server availability change quickly: keep descriptions general, label community projects clearly
// and confirm details against the current documentation before relying on them.

export const mcpHub: Hub = {
  id: "mcp",
  tone: "purple",
  eyebrow: "AI · MODEL CONTEXT PROTOCOL",
  title: "Connect AI to your BIM tools with MCP",
  intro:
    "The Model Context Protocol (MCP) is an open standard that lets AI assistants such as Claude use tools and data from other applications. This hub explains how MCP works, how to connect servers in Claude Desktop and Claude Code, which BIM-related servers exist today, realistic ISO 19650 use cases, and how to keep the set-up secure and governed.",
  sections: [
    {
      id: "main",
      label: "MCP",
      tabs: [
        // ------------------------------------------------------------------ What is MCP
        {
          id: "what",
          label: "What is MCP",
          blocks: [
            {
              kind: "text",
              title: "MCP in plain terms",
              body: [
                "MCP is an open protocol for connecting AI applications to external tools and data. Instead of every AI product building its own integration with every piece of software, a tool vendor or developer writes one MCP server and any MCP-compatible client can use it.",
                "The specification describes three roles. The host is the AI application you use, such as Claude Desktop or Claude Code. Inside it, a client manages the connection to each server. A server is a program that offers capabilities, for example reading a Revit model, querying a Speckle project or listing files exported from the CDE. Messages are exchanged as JSON-RPC.",
              ],
            },
            {
              kind: "graphic",
              graphic: "mcp-architecture",
              title: "How MCP connects AI to BIM tools",
              caption: "The AI application (host) runs an MCP client for each connected server. Local servers run on your computer and talk over stdio; remote servers are reached over HTTP. Each server exposes tools, resources and prompts from a BIM application or data source, and the host asks for your approval before tools act.",
            },
            {
              kind: "table",
              title: "What a server can offer",
              columns: ["Feature", "What it is", "BIM example"],
              rows: [
                ["Tools", "Functions the AI model can call to read data or take actions", "List rooms without numbers, or count doors missing a fire rating"],
                ["Resources", "Context and data the user or model can read", "A model's project information, or an exported schedule"],
                ["Prompts", "Templated messages or workflows offered to the user", "A reusable 'run model QA for this stage' prompt"],
              ],
            },
            {
              kind: "table",
              title: "Local and remote servers",
              columns: ["Aspect", "Local server (stdio)", "Remote server (HTTP)"],
              rows: [
                ["Where it runs", "On your computer, started by the AI application", "On a web service run by the vendor or your organisation"],
                ["Transport", "Standard input and output of a local process", "Streamable HTTP to a single endpoint; older servers may still use the deprecated SSE transport"],
                ["Typical use", "Desktop software such as Revit or Blender, local files", "Cloud platforms and shared services"],
                ["Sign-in", "Usually inherits your local account; secrets set as environment variables", "Usually OAuth sign-in or an access token in a header"],
                ["How you add it", "Configuration file or command line", "Connector settings or command line with a URL"],
              ],
            },
            {
              kind: "callout",
              title: "MCP is a connector, not a source of truth",
              body: "An MCP server only gives the AI access to what the underlying application exposes. The model and the CDE remain the authoritative information; answers produced through MCP still need checking before they are used in a deliverable.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Claude Desktop
        {
          id: "claude-desktop",
          label: "Connect in Claude Desktop",
          blocks: [
            {
              kind: "steps",
              title: "Add a local MCP server",
              steps: [
                { title: "Install the desktop app", body: "Download Claude Desktop from claude.ai/download (macOS, Windows and Linux are listed) and sign in. Update to the latest version." },
                { title: "Install the server's prerequisites", body: "Many servers need Node.js or Python with the uv tool. Some BIM servers also need an add-in installed in the host application, such as a Revit or Blender add-on. Follow the server's own instructions." },
                { title: "Open the configuration file", body: "Open Settings from the Claude menu in the system menu bar (not the settings inside the chat window), go to the Developer tab and choose Edit Config. This creates or opens claude_desktop_config.json. Some installers, such as Autodesk's Revit MCP server, write this entry for you." },
                { title: "Add the server entry", body: "Add an entry under mcpServers with the command, arguments and any environment variables. Use absolute paths and valid JSON." },
                { title: "Restart completely", body: "Quit Claude Desktop fully, not just the window, and start it again so it launches the server." },
                { title: "Check the tools", body: "Click the add files and connectors button at the bottom left of the message box, go to Connectors, choose Manage connectors and select the server to see its tools. Approve tool calls only when you understand what they will do." },
              ],
            },
            {
              kind: "table",
              title: "Configuration file locations",
              columns: ["Operating system", "Config file", "MCP log files"],
              rows: [
                ["macOS", "~/Library/Application Support/Claude/claude_desktop_config.json", "~/Library/Logs/Claude"],
                ["Windows", "%APPDATA%\\Claude\\claude_desktop_config.json", "%APPDATA%\\Claude\\logs"],
              ],
            },
            {
              kind: "table",
              title: "Shape of a server entry",
              columns: ["Key", "Example value", "Meaning"],
              rows: [
                ["mcpServers", "{ ... }", "Top-level object; one named entry per server"],
                ["Server name", "\"cde-exports\"", "Friendly name shown in Claude Desktop"],
                ["command", "\"npx\"", "Program that starts the server, such as npx, uvx, python or a full path to an executable"],
                ["args", "[\"-y\", \"@modelcontextprotocol/server-filesystem\", \"C:\\\\Projects\\\\PRJ01\\\\Exports\"]", "Arguments passed to the command; here the filesystem server limited to one folder"],
                ["env", "{ \"SPECKLE_TOKEN\": \"...\" }", "Optional environment variables, for example an access token"],
              ],
            },
            {
              kind: "text",
              title: "Example configuration",
              body: [
                "{ \"mcpServers\": { \"cde-exports\": { \"command\": \"npx\", \"args\": [\"-y\", \"@modelcontextprotocol/server-filesystem\", \"C:\\\\Projects\\\\PRJ01\\\\Exports\"] } } }",
                "On Windows, backslashes in paths must be doubled inside JSON strings. On macOS use paths such as /Users/name/Projects/PRJ01/Exports. The filesystem server can read and modify files in the folders you list, so give it only the folders it needs.",
              ],
            },
            {
              kind: "steps",
              title: "Add a remote connector",
              steps: [
                { title: "Check your plan", body: "Custom connectors to remote MCP servers are listed for Free, Pro, Max, Team and Enterprise plans, with Free limited to one custom connector. On Team and Enterprise plans an owner adds them in Organization settings first. Availability changes, so check the Claude help centre." },
                { title: "Add the connector", body: "Open Customize, then Connectors, choose Add and then Add custom connector, and enter a name and the remote server URL. Claude detects the sign-in method; you can choose how to sign in, use your own OAuth client, or add request headers such as an API key if the server does not use OAuth." },
                { title: "Connect and sign in", body: "Each user connects and authenticates with their own account, so Claude can reach only what that user is allowed to see." },
                { title: "Enable per conversation", body: "Click the + button at the bottom left of the message box, open Connectors and use the toggle to turn the connector on or off for that conversation." },
              ],
            },
            {
              kind: "callout",
              title: "Server not appearing?",
              body: "Check the JSON is valid, the paths are absolute, the command runs on its own in a terminal, and then read mcp.log and the server's own log file in the logs folder. Menu names in Claude Desktop change between versions, so follow the current help if a step looks different.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ Claude Code
        {
          id: "claude-code",
          label: "Connect in Claude Code",
          blocks: [
            {
              kind: "table",
              title: "Adding servers with claude mcp add",
              columns: ["Server type", "Command form", "Notes"],
              rows: [
                ["Remote HTTP (recommended for remote)", "claude mcp add --transport http <name> <url>", "Add --header \"Authorization: Bearer <token>\" if the server uses a token rather than OAuth"],
                ["Remote SSE (deprecated)", "claude mcp add --transport sse <name> <url>", "Only for servers that do not yet support HTTP; recent Claude Code versions try HTTP first and fall back to SSE"],
                ["Local stdio", "claude mcp add --transport stdio <name> -- <command> [args...]", "Everything after -- is the command that starts the server"],
                ["Local with secrets", "claude mcp add --env KEY=value --transport stdio <name> -- <command>", "Short forms are -t, -H and -e; keep another option between --env and the name"],
                ["From JSON", "claude mcp add-json <name> '<json>'", "Pass the object for one server, not the whole mcpServers wrapper"],
              ],
            },
            {
              kind: "table",
              title: "Scopes",
              columns: ["Scope", "Flag", "Where it is stored", "Who sees it"],
              rows: [
                ["Local (default)", "--scope local", "~/.claude.json, under the current project's path", "Only you, only in this project"],
                ["Project", "--scope project", ".mcp.json in the project root", "Everyone who uses the repository; Claude Code asks for approval before first use"],
                ["User", "--scope user", "~/.claude.json", "Only you, in all your projects"],
              ],
            },
            {
              kind: "table",
              title: "Managing servers",
              columns: ["Task", "Command", "Notes"],
              rows: [
                ["List servers", "claude mcp list", "Shows configured servers and their health"],
                ["Show one server", "claude mcp get <name>", "Shows its configuration"],
                ["Remove a server", "claude mcp remove <name>", "Also deletes stored sign-in tokens for remote servers"],
                ["Check status or sign in", "/mcp inside a session", "Authenticate with remote servers and see which tools are available"],
                ["Reset project approvals", "claude mcp reset-project-choices", "Asks again about servers defined in .mcp.json"],
              ],
            },
            {
              kind: "steps",
              title: "Share a server with your team",
              steps: [
                { title: "Add at project scope", body: "Run claude mcp add with --scope project so the entry is written to .mcp.json in the repository root." },
                { title: "Keep secrets out", body: "Use environment variable references such as ${SPECKLE_TOKEN} in .mcp.json instead of real tokens; each user sets the variable locally." },
                { title: "Review and commit", body: "Review .mcp.json like any other change before committing it, because it tells every team member's client what to run." },
              ],
            },
            {
              kind: "callout",
              title: "Check against your version",
              body: "Command options in Claude Code change between versions. Run claude mcp --help to see the options your installation supports. On native Windows, some local servers started with npx may need to be wrapped with cmd /c; check the Claude Code MCP documentation if a server fails to start.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ BIM-related servers
        {
          id: "bim-servers",
          label: "BIM-related MCP servers",
          blocks: [
            {
              kind: "table",
              title: "Servers you may come across",
              columns: ["Name", "What it exposes", "Official or community", "Source"],
              rows: [
                ["Autodesk Revit MCP Server (Revit Public MCP Server)", "Local server over stdio, installed as a separate Revit add-on from Autodesk Account. Tools query the model, read element data, open, export and zoom to views and select elements. Offered as Read-Tools (read only), Write-Tools and Experimental-Tools installers; the write and experimental versions can change the model. The help pages list Revit 2027.2 for the current preview", "Official, Autodesk (Tech Preview, public beta)", "Autodesk MCP Server help (help.autodesk.com, ADSKMCP); Autodesk AEC blog, June 2026; Autodesk developer blog, April and September 2026"],
                ["Autodesk AutoCAD and Civil 3D MCP Server", "Local server for AutoCAD and Civil 3D; check Autodesk's help for supported releases and tools", "Official, Autodesk (Tech Preview, public beta)", "Autodesk MCP Server help (help.autodesk.com, ADSKMCP)"],
                ["Autodesk Product Help MCP", "Remote server giving agents access to Autodesk product help content", "Official, Autodesk (generally available)", "Autodesk MCP Server help (help.autodesk.com, ADSKMCP)"],
                ["Autodesk Fusion MCP and Fusion Data MCP", "Fusion MCP runs locally with a live Fusion session; Fusion Data MCP is a remote server for Fusion data. Relevant to product and fabrication workflows rather than BIM authoring", "Official, Autodesk (generally available)", "Autodesk MCP Server help (help.autodesk.com, ADSKMCP)"],
                ["FirstOption MCP Suite", "Connectors for Revit, AutoCAD, Civil 3D, Plant 3D and Navisworks that run code inside the open application, used from Claude Code or Codex, with a shared command library, reviewed staged releases and an audit log. See the Revit hub, section MCP for Revit & Autodesk", "Commercial, FirstOption", "mcp-hub.firstoption-es.com"],
                ["mcp-servers-for-revit", "An MCP server, a Revit plug-in and a command set for querying and editing Revit models", "Community, unofficial", "GitHub organisation mcp-servers-for-revit"],
                ["speckle-mcp", "List Speckle projects, retrieve model versions and query object properties using a personal access token", "Community, unofficial", "GitHub bimgeek/speckle-mcp"],
                ["Bonsai_mcp", "Read and modify IFC models through the Bonsai add-on in Blender; a fork of BlenderMCP", "Community, unofficial", "GitHub JotaDeRodriguez/Bonsai_mcp"],
                ["ifc-bonsai-mcp", "Create and edit IFC elements such as walls, doors and roofs through Bonsai", "Community, unofficial", "GitHub Show2Instruct/ifc-bonsai-mcp"],
                ["BlenderMCP", "Inspect and change Blender scenes, including running Python code in Blender", "Community, not affiliated with the Blender Foundation", "GitHub ahujasid/mcp-for-blender (formerly blender-mcp)"],
                ["Filesystem server", "Read, write and search files in folders you allow, such as a local copy of CDE exports", "Official reference server from the MCP project", "GitHub modelcontextprotocol/servers"],
              ],
            },
            {
              kind: "cards",
              title: "Choosing a server",
              cards: [
                { title: "Prefer read-only first", body: "Start with servers or tools that only read data. Add write tools later, once you trust the set-up and have a way to undo changes.", tone: "green" },
                { title: "Check who maintains it", body: "Look at the publisher, recent activity, licence and open issues. Community projects can be excellent but come with no vendor support.", tone: "blue" },
                { title: "Read the code or the docs", body: "Understand which tools a server offers and what each can change before connecting it to a live project model.", tone: "amber" },
                { title: "Match the software version", body: "Add-in based servers support specific releases of Revit, Blender or Bonsai. Check compatibility before installing.", tone: "purple" },
              ],
            },
            {
              kind: "callout",
              title: "This list changes quickly",
              body: "MCP servers for AEC software appear and change every few months, and the official Revit and AutoCAD servers are still previews. Confirm status, supported versions and licensing at the source before adopting a server on a project.",
              tone: "warn",
            },
          ],
        },
        // ------------------------------------------------------------------ ISO 19650 use cases
        {
          id: "use-cases",
          label: "ISO 19650 use cases",
          blocks: [
            {
              kind: "table",
              title: "Use cases with example prompts",
              columns: ["Use case", "Example prompt", "Typical servers", "Human check"],
              rows: [
                ["Model QA queries", "\"List all doors on Level 02 with no fire rating and give their element IDs.\"", "Revit MCP server, IFC or Bonsai server", "Spot-check results in a Revit schedule before fixing"],
                ["Naming checks", "\"Check these exported file names against our naming rules: project PRJ01, originators ABC and DEF, roles A, S, M. Report any that fail and why.\"", "Filesystem server on the export folder", "Confirm the rules match the project information standard"],
                ["COBie extraction support", "\"From this model, list in-scope components missing manufacturer, model number or asset identifier, grouped by type.\"", "Revit MCP server, Speckle server", "Verify against the COBie deliverable and AIR before issue"],
                ["MIDP and TIDP status questions", "\"From the MIDP spreadsheet export, which deliverables due this month are still in work in progress?\"", "Filesystem server on a register export", "Confirm status in the CDE, which remains the record"],
                ["Room and space data", "\"Which rooms are not enclosed or have duplicate numbers?\"", "Revit MCP server", "Fix in the model and rerun the room schedule"],
                ["Comparing versions", "\"Compare the two latest versions of the structural model and summarise elements added or removed.\"", "Speckle server", "Review the change summary with the task team"],
              ],
            },
            {
              kind: "steps",
              title: "A model QA session step by step",
              steps: [
                { title: "Set the context", body: "Tell the assistant the project, stage, and which requirements apply, for example by pasting the relevant LOIN table or attaching the IDS." },
                { title: "Ask focused questions", body: "Ask one check at a time, such as missing classification or duplicate marks, and ask for element identifiers so results can be traced." },
                { title: "Verify a sample", body: "Open a few of the reported elements in Revit to confirm the result is right." },
                { title: "Record the outcome", body: "Copy the findings into the QA record for the container, noting that an AI-assisted check was used." },
              ],
            },
            {
              kind: "cards",
              title: "Where MCP helps and where it does not",
              cards: [
                { title: "Good fit", body: "Finding gaps, summarising large models, cross-checking names and registers, and drafting issue descriptions.", tone: "green" },
                { title: "Use with care", body: "Bulk edits to parameters or names. Prefer a reviewed script or a dry run that lists changes first.", tone: "amber" },
                { title: "Not a substitute", body: "Approvals, authorization and acceptance under ISO 19650 remain decisions for named people, recorded in the CDE.", tone: "red" },
              ],
            },
            {
              kind: "callout",
              title: "Keep the assistant on shared information",
              body: "For checks that inform decisions, point servers at shared or published information, not colleagues' work in progress, in line with the CDE states in ISO 19650.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Security & governance
        {
          id: "security",
          label: "Security & governance",
          blocks: [
            {
              kind: "text",
              title: "Why MCP needs governance",
              body: [
                "The MCP specification notes that tools can amount to arbitrary code execution and that hosts must obtain user consent before invoking them. A connected server acts with the permissions of the account it runs under, so a careless set-up can expose project information or change models without anyone noticing.",
                "Treat each MCP server like any other software that touches project information: approve it, configure it with the least access it needs, and record its use.",
              ],
            },
            {
              kind: "table",
              title: "Risks and controls",
              columns: ["Risk", "Example", "Control"],
              rows: [
                ["Excessive permissions", "A filesystem server given the whole project drive", "Limit to the folders and models needed; prefer read-only tools"],
                ["Leaked secrets", "Access tokens committed to a shared .mcp.json", "Use environment variables or OS secret stores; rotate tokens; use short-lived OAuth where offered"],
                ["Prompt injection", "Text in a model parameter, document or web page telling the assistant to send data elsewhere", "Treat tool output as data; review tool calls before approving; avoid combining untrusted content with write or send tools"],
                ["Untrusted servers", "Installing an unknown package that runs on your machine", "Use approved sources, check the publisher and pin versions"],
                ["Unreviewed changes", "An assistant renames hundreds of sheets", "Require approval for each write, work on a copy, and keep undo or version history"],
                ["Data leaving the organisation", "Sensitive asset data sent to an external AI service", "Classify information first and follow the security management plan and AI service terms"],
              ],
            },
            {
              kind: "callout",
              title: "ISO 19650-5: security-minded approach",
              body: "On projects or assets with a security triage outcome that calls for it, ISO 19650-5 expects a security management plan that controls who can access sensitive information and how. Assess MCP connections against that plan before use, and keep sensitive built asset information away from servers and AI services that are not approved for it.",
              tone: "warn",
            },
            {
              kind: "callout",
              title: "ISO/IEC 42001: AI management",
              body: "ISO/IEC 42001 sets out requirements for an AI management system, including policies, risk and impact assessment, and controls over the AI life cycle. Organisations that adopt it can record MCP-connected tools in their AI inventory, assess their risks and assign owners.",
              tone: "info",
            },
            {
              kind: "checklist",
              title: "Governance controls",
              items: [
                "Approved list of MCP clients and servers, with owners",
                "Least-privilege configuration for each server",
                "Secrets kept out of configuration files committed to repositories",
                "Write and send tools disabled or approval required for each call",
                "Logs of tool calls retained where the client provides them",
                "AI use noted in the BEP and in QA records where it affects deliverables",
                "Periodic review of installed servers and their versions",
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ Setup checklist
        {
          id: "checklist",
          label: "Setup checklist",
          blocks: [
            {
              kind: "checklist",
              title: "Before you connect",
              items: [
                "Purpose agreed: which questions or tasks the connection will support",
                "Server chosen from an approved or reputable source, official or community status noted",
                "Compatibility checked with your Revit, Blender, Bonsai or platform version",
                "Information security classification checked against the security management plan",
                "AI service approved for the type of information involved",
              ],
            },
            {
              kind: "checklist",
              title: "While configuring",
              items: [
                "Prerequisites installed (for example Node.js, Python and uv, or the host application add-in)",
                "Configuration written with absolute paths and valid JSON",
                "Access limited to the folders, projects or models needed",
                "Tokens supplied through environment variables or OAuth, not pasted into shared files",
                "Scope chosen deliberately in Claude Code: local, project or user",
              ],
            },
            {
              kind: "checklist",
              title: "After connecting",
              items: [
                "Tools listed and understood before first use",
                "Test query run on a copy or sample model",
                "Results verified against a Revit schedule or the CDE",
                "Use recorded in the BIM manual or BEP where relevant",
                "Review date set to recheck versions and permissions",
              ],
            },
            {
              kind: "callout",
              title: "Start small",
              body: "A single read-only server pointed at a folder of exported schedules is a safe first step. Expand to live model connections once the team is comfortable with the approval prompts and the quality of answers.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ FAQ
        {
          id: "faq",
          label: "FAQ",
          blocks: [
            {
              kind: "faq",
              title: "Frequently asked questions",
              items: [
                { q: "Do I need to be a developer to use MCP?", a: "No, but you need to be comfortable editing a configuration file or running a command. Remote connectors added through Claude's settings need the least technical effort." },
                { q: "Is MCP only for Claude?", a: "No. MCP is an open protocol and many AI applications act as MCP clients. This hub uses Claude Desktop and Claude Code as examples." },
                { q: "Does Autodesk provide an official Revit MCP server?", a: "Yes, as a Tech Preview (public beta). The Autodesk Revit MCP Server is a separate add-on for Revit 2027 that runs locally over stdio. The first release in April 2026 was read only; since the Revit 2027.2 update it is offered as Read-Tools, Write-Tools and Experimental-Tools versions, and the write versions can change the model. Check Autodesk's MCP help for the supported Revit updates before installing." },
                { q: "Can an MCP server change my model?", a: "It depends on the tools the server provides. Some community servers include write tools. The client asks for approval before tool calls; review each one, and test write tools on a copy first." },
                { q: "Where does my model data go?", a: "Data returned by a tool is passed to the AI service as part of the conversation. Check that the AI service and plan are approved for the information involved, especially for sensitive assets." },
                { q: "What is the difference between a local and a remote server?", a: "A local server runs on your computer and talks to the client over stdio. A remote server runs as a web service and is reached over HTTP, usually with a sign-in." },
                { q: "Why does my server not show up in Claude Desktop?", a: "Usually invalid JSON, a relative path, a missing prerequisite such as Node.js, or the app not being fully restarted. The MCP logs in the Claude logs folder show the error." },
                { q: "Can I share an MCP set-up with my project team?", a: "In Claude Code, add the server with project scope so it is written to .mcp.json in the repository, and keep secrets in environment variables. Each user approves project servers before first use." },
              ],
            },
            {
              kind: "callout",
              title: "Commands and menus change",
              body: "MCP clients are updated frequently. If a step here does not match what you see, follow the current documentation at modelcontextprotocol.io and Anthropic's Claude help and Claude Code documentation.",
              tone: "info",
            },
            {
              kind: "cards",
              title: "Where to look next",
              cards: [
                { title: "Set-up help", body: "See the Connect in Claude Desktop and Connect in Claude Code tabs for step-by-step instructions.", tone: "blue" },
                { title: "Choosing servers", body: "See the BIM-related MCP servers tab for official and community options.", tone: "purple" },
                { title: "Staying safe", body: "See the Security and governance tab before connecting live project data.", tone: "red" },
              ],
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "How do I connect a local MCP server to Claude Desktop on Windows?",
    "What is the difference between local, project and user scope in Claude Code?",
    "Which MCP servers can read Revit or IFC models, and which are official?",
    "How should we govern MCP connections under ISO 19650-5 on a sensitive project?",
  ],
};
