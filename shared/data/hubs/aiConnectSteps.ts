import type { HubSection } from "./types";

// "Claude & ChatGPT step by step" for the ai-connect hub: how MCP works under the hood, then exact set-up paths for
// Claude (Desktop and Code) and ChatGPT (desktop app, Codex, web) with Revit and AutoCAD, and a troubleshooting table.
// Checked November 2026 against Anthropic's Claude help centre and Claude Code docs, OpenAI's ChatGPT help centre and
// Codex docs, Autodesk's MCP Servers help, the MCP specification (modelcontextprotocol.io) and the READMEs of the
// community projects named. Menus, plan rules and preview status change often: wording is hedged on purpose.

const FO = "https://mcp-hub.firstoption-es.com";

export const CLAUDE_CHATGPT_SECTION: HubSection = {
  id: "step-by-step",
  label: "Claude & ChatGPT step by step",
  tabs: [
    // ---------------------------------------------------------------- how it works
    {
      id: "how",
      label: "How MCP really works",
      blocks: [
        {
          kind: "text",
          title: "Three pieces, always",
          body: [
            "Every set-up in this hub has the same three pieces. The host is the AI app you type into: Claude Desktop, Claude Code, the ChatGPT desktop app or Codex. The MCP server is a small program that offers tools, such as 'list the rooms' or 'export the schedule'. The application is Revit or AutoCAD itself, where the model or drawing is open.",
            "The host never touches Revit directly. It asks the server to run a tool; the server passes the request into Revit or AutoCAD through an add-in, waits for the answer and hands back plain text or JSON. The AI then reads that answer and decides what to say or which tool to call next.",
          ],
        },
        {
          kind: "steps",
          title: "One request, from your question to the model and back",
          steps: [
            { title: "Start-up", body: "When the host starts, it launches each configured local server (stdio) or connects to each remote one (HTTPS). It asks every server for its list of tools, each with a name, a description and the inputs it accepts." },
            { title: "Your question", body: "You ask, for example, 'How many doors have no fire rating?'. The host sends your message to the model together with the tool descriptions." },
            { title: "The model picks a tool", body: "The model replies with a tool call, such as query_model with category Doors, instead of an answer." },
            { title: "Approval", body: "The host shows you the tool and its inputs. Approve it once, or allow it for the conversation. Write tools should always ask." },
            { title: "The server runs it", body: "The server forwards the call to the add-in inside Revit or AutoCAD. Revit only accepts API calls on its own main thread, so the add-in queues the request (for example with an ExternalEvent) and runs it when Revit is idle." },
            { title: "The result comes back", body: "The add-in returns the data; the server sends it to the host; the model reads it and either calls another tool or writes the answer for you." },
          ],
        },
        {
          kind: "table",
          title: "Words you will meet",
          columns: ["Term", "What it means in practice"],
          rows: [
            ["Host / client", "The AI app (Claude Desktop, Claude Code, ChatGPT desktop, Codex). It holds the conversation and asks for your approval."],
            ["MCP server", "The program that offers tools. For Revit and AutoCAD it runs on the same PC as the application."],
            ["Tool", "One action with a name, description and inputs, e.g. get_element_data(elementIds). Read tools look; write tools change the model."],
            ["Resource / prompt", "Optional extras a server can offer: files or data to read, and ready-made prompt templates."],
            ["stdio transport", "The host starts the server as a local program and talks to it through standard input and output. Used for desktop software on your PC."],
            ["Streamable HTTP transport", "The server runs as a web service at an HTTPS address. Used for cloud services; it replaced the older SSE transport."],
            ["Add-in / plug-in", "The part loaded inside Revit or AutoCAD that actually calls the product's API. Without it the server has nothing to talk to."],
            ["Bridge", "How server and add-in talk: a named pipe, a local port or a file queue. It should accept connections from this PC only."],
          ],
        },
        {
          kind: "table",
          title: "Local or remote: which one Revit and AutoCAD need",
          columns: ["", "Local server (stdio)", "Remote server (HTTPS)"],
          rows: [
            ["Where it runs", "Your PC, next to Revit or AutoCAD", "A cloud or company server"],
            ["Reaches the open model", "Yes", "Only through a tunnel back to the PC, or by working on files in the cloud (APS)"],
            ["Hosts that support it", "Claude Desktop, Claude Code, ChatGPT desktop app (where offered), Codex CLI and IDE", "Claude (custom connectors), ChatGPT on the web (custom MCP servers on eligible plans), and the desktop hosts"],
            ["Sign-in", "Inherits your Windows session", "OAuth or a token per user"],
            ["Typical BIM use", "Live Revit or AutoCAD sessions", "APS cloud data, ACC documents, Autodesk Product Help MCP"],
          ],
        },
        {
          kind: "callout",
          title: "Why ChatGPT on the web cannot see your open Revit model",
          body: "A web page cannot start programs on your PC, so ChatGPT on the web connects only to remote HTTPS servers. To reach a live Revit or AutoCAD session you either use a desktop host that can start local servers, or expose the local server through an HTTPS bridge and tunnel, which needs IT approval and strong access control.",
          tone: "info",
        },
      ],
    },

    // ---------------------------------------------------------------- Claude + Revit
    {
      id: "claude-revit",
      label: "Claude → Revit",
      blocks: [
        {
          kind: "table",
          title: "Pick a Revit server",
          columns: ["Server", "Revit versions", "Can change the model", "Best for"],
          rows: [
            ["FirstOption Revit MCP (our suite)", "See the product page", "Yes, with dry run, verification and one undo step per command", "Office use with a shared command library and audit log"],
            ["Autodesk Revit Public MCP Server (Tech Preview)", "Revit 2027.2 per Autodesk's set-up page", "Read-Tools version: no. Experimental-Tools version: some tools (schedules, exports, parameters)", "Trying Autodesk's own tools on a test model"],
            ["Community servers (e.g. mcp-servers-for-revit, pyRevit-based servers)", "Varies; many cover Revit 2023–2026 or later", "Often yes, including create and delete", "Experiments on copies, with IT approval"],
          ],
        },
        {
          kind: "steps",
          title: "Claude Desktop on Windows, step by step",
          steps: [
            { title: "Install Claude Desktop", body: "Download it from claude.ai/download and sign in. Note which installer you used: the direct .exe installer and the Microsoft Store / WinGet version keep their settings in different folders." },
            { title: "Install the Revit side", body: "Install the server's Revit add-in and companion program with the vendor's installer (FirstOption suite, Autodesk's Revit MCP add-on, or the community project's instructions). Close Revit while installing." },
            { title: "Prefer a desktop extension", body: "If the server is offered as a desktop extension (.mcpb file), open Settings > Extensions in Claude Desktop and install it there; it needs no manual configuration. Otherwise continue with the configuration file." },
            { title: "Open the configuration file", body: "Settings > Developer > Edit Config opens claude_desktop_config.json. For the .exe installer it is %APPDATA%\\Claude\\claude_desktop_config.json; Store installs keep it under %LOCALAPPDATA%\\Packages. Edit the file that Edit Config opens." },
            { title: "Add the server entry", body: "Under \"mcpServers\" add a name and the command (full path to the server program) with any arguments. In JSON every backslash in a Windows path must be doubled: C:\\\\Program Files\\\\…" },
            { title: "Restart Claude completely", body: "Quit from the system tray (or end Claude in Task Manager) and start it again. Closing the window is not enough." },
            { title: "Open Revit first, then test", body: "Start Revit, open a copy of a model, then in Claude open the + menu > Connectors and check the server is on. Ask 'List the available Revit tools' and then a read-only question such as 'How many levels are in this model?'." },
          ],
        },
        {
          kind: "table",
          title: "Configuration entries (examples — use the paths your installer created)",
          columns: ["Server", "Entry under \"mcpServers\""],
          rows: [
            ["Autodesk Revit MCP (Read-Tools)", "\"revit-read\": { \"command\": \"C:\\\\Program Files\\\\Autodesk\\\\Revit 2027 MCP Server\\\\Autodesk.RevitMcpServer.Stdio.exe\", \"args\": [] }"],
            ["Node.js community server", "\"revit\": { \"command\": \"cmd\", \"args\": [\"/c\", \"npx\", \"-y\", \"<package-name>\"] }"],
            ["Python community server (uv)", "\"revit\": { \"command\": \"uv\", \"args\": [\"run\", \"--directory\", \"C:\\\\tools\\\\revit-mcp\", \"main.py\"] }"],
          ],
        },
        {
          kind: "steps",
          title: "Claude Code, step by step",
          steps: [
            { title: "Install and sign in", body: "Install Claude Code, open a terminal (PowerShell or Windows Terminal) and run claude once to sign in with your Claude account." },
            { title: "Add the server", body: "claude mcp add --transport stdio revit -- \"C:\\Program Files\\…\\Server.exe\". For an npx-based server on Windows wrap it: claude mcp add --transport stdio revit -- cmd /c npx -y <package-name>." },
            { title: "Choose the scope", body: "Default (local) keeps it for you in this folder; --scope user makes it available everywhere for you; --scope project writes .mcp.json so the team shares it (keep tokens out, use ${VARIABLES})." },
            { title: "Check", body: "Open Revit with a test model, start claude and type /mcp. The server should show as connected with its tools. claude mcp list and claude mcp get revit show the configuration." },
            { title: "Work", body: "Ask in plain language. Claude Code asks before each tool call; keep write tools on 'ask every time'. FirstOption suite users run the same check with /mcp after connecting the PC to the hub." },
          ],
        },
        {
          kind: "links",
          title: "Where to get the servers",
          links: [
            { label: "FirstOption Revit MCP", href: `${FO}/products/revit-mcp?public`, note: "Our Revit connector: install guide and versions", tone: "purple" },
            { label: "Autodesk MCP Servers help", href: "https://help.autodesk.com/view/ADSKMCP/ENU/", note: "Revit Public MCP Server set-up, tools and limits", tone: "blue" },
            { label: "Claude Desktop download", href: "https://claude.ai/download", note: "Windows and macOS", tone: "teal" },
          ],
        },
      ],
    },

    // ---------------------------------------------------------------- Claude + AutoCAD
    {
      id: "claude-autocad",
      label: "Claude → AutoCAD",
      blocks: [
        {
          kind: "table",
          title: "Ways to connect Claude to AutoCAD",
          columns: ["Route", "Works with", "What it can do", "Notes"],
          rows: [
            ["FirstOption AutoCAD MCP (our suite)", "Claude Code (and Codex)", "Read and change drawings through tested commands with an audit log", "Install the suite, connect the PC to the hub, run /mcp to check"],
            ["Autodesk's AutoCAD and Civil 3D MCP Server (Tech Preview)", "Autodesk Assistant inside AutoCAD / Civil 3D", "Drawing queries and commands from Autodesk's own panel", "Autodesk documents it for its Assistant, not for Claude"],
            ["Community servers (e.g. autocad-mcp)", "Claude Desktop, Claude Code", "Often runs AutoLISP sent by the AI, including drawing and erasing", "Blank or copied drawings only; read the README and decline LISP you do not understand"],
            ["No MCP: Claude writes AutoLISP or .NET", "Any Claude app", "Reports, checks and clean-ups you review and run yourself", "Lowest risk; works in full AutoCAD and in AutoCAD LT 2024 or later (which runs AutoLISP, with fewer functions)"],
          ],
        },
        {
          kind: "steps",
          title: "Claude Desktop with a community AutoCAD server",
          steps: [
            { title: "Get approval", body: "Ask IT and the CAD manager before installing software that sends commands to AutoCAD." },
            { title: "Install the prerequisites", body: "Follow the project's README; for Python-based servers that usually means Windows Python 3.10 or later and uv, plus a LISP file loaded in AutoCAD with APPLOAD (add it to the Startup Suite so it loads every time)." },
            { title: "Add the entry", body: "In claude_desktop_config.json add, for example, \"autocad\": { \"command\": \"uv\", \"args\": [\"run\", \"--directory\", \"C:\\\\tools\\\\autocad-mcp\", \"server.py\"] } — use the exact command from the README." },
            { title: "Restart and test on a blank drawing", body: "Quit Claude fully, open AutoCAD with a new blank drawing, and ask 'List the layers in the current drawing'. Only then try a copy of a project drawing." },
            { title: "Keep it read-mostly", body: "Ask for reports (layers, blocks, attributes, text styles) and review any tool call that would erase, purge, rename or save." },
          ],
        },
        {
          kind: "table",
          title: "Good first AutoCAD prompts",
          columns: ["Goal", "Prompt"],
          rows: [
            ["Layer audit", "'List every layer with colour, linetype and whether it is used. Flag names that do not follow AIA-style DISCIPLINE-MAJOR-MINOR.'"],
            ["Title block register", "'Read the attributes DRG_NO, TITLE, REV and STATUS from every TB-A1 block on each layout and give me a table.'"],
            ["Block counts", "'Count block references by name and layer in model space.'"],
            ["Before issue", "'List unused layers, blocks and text styles without purging anything.'"],
          ],
        },
      ],
    },

    // ---------------------------------------------------------------- ChatGPT
    {
      id: "chatgpt",
      label: "ChatGPT → Revit & AutoCAD",
      blocks: [
        {
          kind: "table",
          title: "Which ChatGPT product can reach Revit or AutoCAD",
          columns: ["ChatGPT product", "Local servers on your PC", "How to add a server", "Use it for"],
          rows: [
            ["ChatGPT desktop app (Windows / macOS)", "Where your plan and app version offer it: Settings > MCP servers > Add server > STDIO", "Enter a name, the full path to the server program and its arguments", "Live Revit / AutoCAD sessions, if offered on your account"],
            ["Codex CLI and IDE extension", "Yes", "codex mcp add <name> -- <command> [args], or edit ~/.codex/config.toml", "Live sessions from a terminal or VS Code; FirstOption suite supports Codex"],
            ["ChatGPT on the web", "No (a web page cannot start programs)", "Custom MCP server with a public HTTPS address, on eligible plans", "Cloud data (APS, ACC), Autodesk Product Help MCP, or a local server behind an approved tunnel"],
            ["No MCP at all", "—", "—", "Ask ChatGPT to write pyRevit, Dynamo, AutoLISP or .NET code that you review and run"],
          ],
        },
        {
          kind: "steps",
          title: "Codex (OpenAI) with Revit or AutoCAD, step by step",
          steps: [
            { title: "Install Codex", body: "Install the Codex CLI or the Codex extension for VS Code and sign in with your ChatGPT account." },
            { title: "Add the server", body: "Run codex mcp add revit -- \"C:\\Program Files\\…\\Server.exe\" (or the server's documented command). Codex stores it in ~/.codex/config.toml, which the CLI and the IDE extension share." },
            { title: "Or edit config.toml", body: "[mcp_servers.revit] then command = \"C:\\\\Program Files\\\\…\\\\Server.exe\" and args = [] on the next lines. Use doubled backslashes inside quoted TOML strings, or single quotes for literal paths." },
            { title: "Open the application first", body: "Start Revit or AutoCAD with a test model or drawing, then start Codex in a folder of your choice." },
            { title: "Check and ask", body: "Run /mcp in Codex to see connected servers and tools, then ask a read-only question. Codex asks before running tools according to its approval mode; keep it on asking for anything that writes." },
          ],
        },
        {
          kind: "steps",
          title: "ChatGPT desktop app, step by step (where offered)",
          steps: [
            { title: "Check your account", body: "Open Settings in the ChatGPT desktop app and look for MCP servers (or connectors / plugins with a local option). If it is not there, your plan or region does not offer local servers yet: use Codex instead." },
            { title: "Add a STDIO server", body: "Choose Add server, pick STDIO, give it a name such as revit, and enter the full path to the server program and any arguments." },
            { title: "Restart and test", body: "Restart the app, open Revit or AutoCAD with a test file and ask 'List the available tools'. Autodesk does not document ChatGPT for its Revit server, so record this as an experiment in your AI register." },
          ],
        },
        {
          kind: "steps",
          title: "ChatGPT on the web through a bridge (advanced, IT only)",
          steps: [
            { title: "Decide whether you should", body: "This publishes a way to control a CAD application over the internet. Only do it with IT approval, read-only tools and strong sign-in; for most teams Codex or Claude Desktop is the better route." },
            { title: "Turn the local server into an HTTP one", body: "Run a stdio-to-HTTP bridge (open-source tools such as mcp-proxy or supergateway do this) on the PC, pointing it at the server program. Check the tool's README for its current options." },
            { title: "Publish it safely", body: "Expose the bridge through an approved tunnel or reverse proxy with HTTPS and OAuth or token sign-in (OpenAI documents a Secure MCP Tunnel for this). Never publish it without authentication." },
            { title: "Add it in ChatGPT", body: "In ChatGPT add a custom MCP server (from Plugins or the connectors settings, depending on your plan) with the HTTPS address, then enable it in a conversation and test with a read-only question." },
          ],
        },
        {
          kind: "callout",
          title: "Plans and menus change",
          body: "OpenAI and Anthropic regularly rename menus and change which plans include custom or local MCP servers. If a step does not match what you see, check the vendor's help centre; the order of the steps (install the server, register it in the host, restart, open the application, test read-only) stays the same.",
          tone: "warn",
        },
      ],
    },

    // ---------------------------------------------------------------- troubleshooting
    {
      id: "troubleshooting",
      label: "Troubleshooting",
      blocks: [
        {
          kind: "table",
          title: "Symptom, likely cause, fix",
          columns: ["Symptom", "Likely cause", "Fix"],
          rows: [
            ["The server is not listed in Claude", "Edited the wrong config file, invalid JSON, or Claude not fully restarted", "Use Settings > Developer > Edit Config; check the JSON (commas, doubled backslashes); quit Claude from the tray and reopen"],
            ["Server listed but 'failed' or 'disconnected'", "Wrong path, missing Node.js / Python / uv, or the program crashes on start", "Run the exact command in PowerShell to see the error; install the missing runtime; check the logs"],
            ["npx server fails only on Windows", "npx is a script, not an .exe", "Use command cmd with args /c npx -y <package>"],
            ["Tools appear but every call fails or times out", "Revit or AutoCAD is closed, no document is open, or the add-in did not load", "Open the application and a file first; check the add-in tab or ribbon is present; restart the application"],
            ["Calls time out during long operations", "Revit is busy (dialog open, sync, regeneration)", "Close dialogs, wait for the sync to finish, ask for smaller batches"],
            ["Wrong Revit version", "Add-in built for another release", "Install the build for your exact version (Autodesk's preview needs Revit 2027.2)"],
            ["ChatGPT web cannot find the server", "Web ChatGPT needs a public HTTPS address", "Use the desktop app or Codex, or an approved bridge and tunnel"],
            ["AI made an unwanted change", "A write tool was approved", "Use Undo in Revit or AutoCAD (FirstOption commands are one undo step), restore the copy, and set write tools to ask every time"],
          ],
        },
        {
          kind: "table",
          title: "Where to look for logs",
          columns: ["Host", "Logs"],
          rows: [
            ["Claude Desktop (Windows)", "%APPDATA%\\Claude\\logs — files named mcp*.log, one per server"],
            ["Claude Code", "Run claude --debug, or /mcp to see each server's status and error"],
            ["Codex", "Run Codex with verbose logging as described in its docs; /mcp shows server status"],
            ["The server itself", "Many servers write their own log next to the program or in %LOCALAPPDATA%; check the README"],
          ],
        },
        {
          kind: "checklist",
          title: "Before you call it working",
          items: [
            "The server lists its tools in the host (/mcp or Connectors).",
            "A read-only question returns the same count as a Revit schedule or the AutoCAD Layer Properties Manager.",
            "Write tools ask for approval every time.",
            "You tested on a copy of the model or drawing, not the live project file.",
            "The set-up is recorded in the AI register (tool, version, data it can reach, who approved it).",
          ],
        },
      ],
    },
  ],
};
