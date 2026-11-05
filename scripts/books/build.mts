// Builds the two PDF books from the portal's own content, so they always match the running platform:
//   docs/books/Platform-Guideline-Book.pdf          — how to use every section and page (from the page guides)
//   docs/books/Information-Management-Handbook.pdf  — the ISO 19650 practice behind it (process, documents, CDE, LOIN, COBie, handover …)
// Run: npm run books   (needs Playwright with Chromium; the HTML is written next to the PDF either way)

import { mkdirSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { ACCOUNT_PAGES, PROJECT_PAGES, SECTIONS, groupsOf, pageByKey, type NavItem } from "../../client/src/shell/nav";
import { FAQ, FIRST_DAY, FIRST_WEEK, FLOWS, ROLE_ROUTES, SECTION_GUIDE } from "../../shared/data/platformGuide";
import { PAGE_GUIDES, type PageGuide } from "../../shared/data/pageGuides";
import { cdeStates, namingFields, parts19650, process19650, roleCodes, suitabilityCodes, typeCodes, workflow19650 } from "../../shared/data/iso19650";
import { hubById } from "../../shared/data/hubs";
import type { HubBlock } from "../../shared/data/hubs/types";
import { INFO_USES } from "../../shared/data/infoUses";
import { templates } from "../../shared/data/templates";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "../../shared/data/glossary";
import type { Clause } from "../../shared/data/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const out = join(root, "docs/books");
const pkg = JSON.parse(await import("fs").then((f) => f.readFileSync(join(root, "package.json"), "utf8")));
const today = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- HTML helpers

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const list = (items: string[], cls = "") => (items.length ? `<ul${cls ? ` class="${cls}"` : ""}>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
const olist = (items: string[]) => (items.length ? `<ol>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ol>` : "");
const table = (head: string[], rows: (string | number)[][], cls = "") =>
  `<table class="${cls}"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const label = (key: string) => pageByKey(key)?.label ?? key;

interface Chapter { id: string; title: string; html: string; sub?: { id: string; title: string }[] }

const CSS = `
@page { size: A4; margin: 20mm 17mm 20mm 17mm; }
:root { --ink:#1d2a36; --muted:#5b6b78; --accent:#2f4f8a; --line:#d5dde3; --soft:#eef2f6; }
* { box-sizing: border-box; }
body { font-family: "Segoe UI", "Noto Sans", "DejaVu Sans", Arial, sans-serif; color: var(--ink); font-size: 10.2pt; line-height: 1.5; margin: 0; }
h1, h2, h3, h4 { color: var(--accent); line-height: 1.25; break-after: avoid; }
h1 { font-size: 22pt; margin: 0 0 6mm; padding-bottom: 3mm; border-bottom: 2px solid var(--accent); }
h2 { font-size: 14pt; margin: 8mm 0 3mm; }
h3 { font-size: 11.5pt; margin: 6mm 0 2mm; }
h4 { font-size: 10.5pt; margin: 4mm 0 1.5mm; color: var(--ink); }
p { margin: 0 0 2.5mm; }
ul, ol { margin: 0 0 3mm; padding-left: 6mm; } li { margin: 0 0 1mm; }
table { width: 100%; border-collapse: collapse; margin: 2mm 0 4mm; font-size: 8.8pt; break-inside: auto; }
th { background: var(--soft); text-align: left; font-weight: 600; }
th, td { border: 1px solid var(--line); padding: 1.5mm 2mm; vertical-align: top; }
tr { break-inside: avoid; }
a { color: var(--accent); text-decoration: none; }
.chapter { break-before: page; }
.muted { color: var(--muted); } .small { font-size: 8.8pt; }
.cover { height: 250mm; display: flex; flex-direction: column; justify-content: center; padding: 0 8mm; break-after: page; }
.cover .band { background: var(--accent); color: #fff; padding: 14mm 12mm; border-radius: 4mm; }
.cover h1 { color: #fff; border: 0; font-size: 30pt; margin: 0 0 4mm; padding: 0; }
.cover .sub { font-size: 13pt; opacity: .92; }
.cover .meta { margin-top: 14mm; color: var(--muted); font-size: 10pt; }
.toc { break-after: page; } .toc ol { list-style: none; padding: 0; } .toc > ol > li { margin: 0 0 2mm; font-weight: 600; }
.toc ol ol { padding-left: 6mm; font-weight: 400; font-size: 9.2pt; columns: 2; column-gap: 8mm; } .toc ol ol li { break-inside: avoid; margin: 0 0 .6mm; }
.box { border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 2mm; padding: 3mm 4mm; margin: 0 0 4mm; background: #fafcfd; break-inside: avoid; }
.box.warn { border-left-color: #b4561a; } .box.ok { border-left-color: #2e7d4f; }
.page { border-top: 1px solid var(--line); padding-top: 3mm; margin-top: 5mm; }
.page h3 { margin-top: 0; }
.kv { display: grid; grid-template-columns: 1fr 1fr; gap: 0 6mm; }
.kv h4 { margin-top: 2mm; }
.tag { display: inline-block; font-size: 8pt; padding: .3mm 2mm; border-radius: 2mm; background: var(--soft); color: var(--muted); margin-right: 1.5mm; }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin: 0 0 4mm; }
.card { border: 1px solid var(--line); border-radius: 2mm; padding: 2.5mm 3mm; break-inside: avoid; }
.card b { display: block; margin-bottom: 1mm; }
.flow { display: flex; flex-wrap: wrap; gap: 1.5mm; align-items: center; margin: 1mm 0 3mm; }
.flow span.step { border: 1px solid var(--line); border-radius: 2mm; padding: .8mm 2mm; font-size: 8.8pt; background: #fafcfd; }
.flow span.arrow { color: var(--muted); }
.glossary dt { font-weight: 600; margin-top: 2mm; } .glossary dd { margin: 0 0 1mm 0; }
`;

function book(title: string, subtitle: string, chapters: Chapter[], intro: string) {
  const toc = `<section class="toc"><h1>Contents</h1><ol>${chapters.map((c, i) => `<li><a href="#${c.id}">${i + 1}. ${esc(c.title)}</a>${c.sub?.length ? `<ol>${c.sub.map((s) => `<li><a href="#${s.id}">${esc(s.title)}</a></li>`).join("")}</ol>` : ""}</li>`).join("")}</ol></section>`;
  const body = chapters.map((c, i) => `<section class="chapter" id="${c.id}"><h1>${i + 1}. ${esc(c.title)}</h1>${c.html}</section>`).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>
<section class="cover"><div class="band"><h1>${esc(title)}</h1><div class="sub">${esc(subtitle)}</div></div>
<div class="meta">BIM Management Portal · ISO 19650 &amp; ISO/IEC 42001<br>Edition ${esc(pkg.version)} · generated ${today} from the platform's own content<br><br>${intro}</div></section>
${toc}${body}</body></html>`;
}

// ---------------------------------------------------------------- Book 1: Platform Guideline Book

const guideByKey = new Map(PAGE_GUIDES.map((g) => [g.key, g]));
function pageEntry(item: NavItem, g: PageGuide | undefined) {
  const id = "pg-" + slug(item.key);
  if (!g) return { id, html: `<div class="page" id="${id}"><h3>${esc(item.label)}</h3>${item.hint ? `<p>${esc(item.hint)}</p>` : ""}</div>` };
  return {
    id,
    html: `<div class="page" id="${id}"><h3>${esc(item.label)}</h3>
<p>${esc(g.what)}</p>
<h4>How to use</h4>${olist(g.steps)}
<div class="kv"><div><h4>Outputs</h4>${g.outputs.length ? list(g.outputs) : `<p class="muted small">Reading page: no files or records produced.</p>`}</div>
<div><h4>Mandatory inputs</h4>${g.required.length ? list(g.required) : `<p class="muted small">Nothing is mandatory.</p>`}</div></div>
${g.tips?.length ? `<h4>Tips</h4>${list(g.tips)}` : ""}</div>`,
  };
}

function sectionChapter(id: string, title: string, items: NavItem[], guide = SECTION_GUIDE.find((s) => s.id === id)): Chapter {
  const sub: Chapter["sub"] = [];
  let html = guide ? `<div class="box"><p><b>Purpose.</b> ${esc(guide.purpose)}</p><p><b>When to use it.</b> ${esc(guide.whenToUse)}</p>
<p><b>Start with:</b> ${esc(label(guide.startWith))}. ${esc(guide.order)}</p></div>` : "";
  for (const grp of groupsOf(items)) {
    html += `<h2>${esc(grp)}</h2>${guide?.groups[grp] ? `<p class="muted">${esc(guide.groups[grp])}</p>` : ""}`;
    for (const it of items.filter((i) => i.group === grp)) {
      const e = pageEntry(it, guideByKey.get(it.key));
      html += e.html; sub.push({ id: e.id, title: it.label });
    }
  }
  return { id: "ch-" + id, title, html, sub };
}

function guidelineBook() {
  const chapters: Chapter[] = [];
  chapters.push({
    id: "ch-intro", title: "Getting started",
    html: `<p>The portal supports the whole ISO 19650 information management process — from the appointing party's requirements to handover —
and an ISO/IEC 42001 AI management system. Each page explains itself through the <b>Guide</b> button at the top right; this book collects those
guides in one place, in the same order as the sidebar.</p>
<h2>How the platform is organised</h2>
${table(["Sidebar section", "What it is for", "Start with"], SECTION_GUIDE.map((s) => [s.title, s.purpose, label(s.startWith)]))}
<h2>Your first day</h2>
${table(["#", "Step", "Why", "Page", "Done when"], FIRST_DAY.map((s, i) => [i + 1, s.title, s.why, label(s.pageKey), s.doneWhen]))}
<h2>Your first week</h2>
${table(["Day", "Theme", "Focus", "Pages"], FIRST_WEEK.map((d) => [d.day, d.title, d.focus, d.links.map((l) => l.label ?? label(l.pageKey)).join(", ")]))}
<h2>Common rules on every page</h2>
${list([
  "Fields marked * are mandatory; the page will not save or generate until they are filled.",
  "Most project pages need a project: open one from Projects, or create one with the setup wizard.",
  "AI output is decision support. It must be reviewed by the accountable person before it is issued or relied on.",
  "Every page has an English and an Arabic interface (Account → Language) and a light or dark theme; the theme colour is set under Theme colour in the account menu.",
  "Exports (Word, Excel, CSV, PDF, IFC/IDS/BCF) are generated in the browser or by the server on demand; uploaded files are kept only where the page says so.",
])}`,
  });
  chapters.push({
    id: "ch-flows", title: "How the pieces connect",
    html: FLOWS.map((f) => `<h2>${esc(f.title)}</h2><p>${esc(f.summary)}</p><div class="flow">${f.nodes.map((n, i) => `${i ? `<span class="arrow">→</span>` : ""}<span class="step">${esc(label(n.pageKey))}</span>`).join("")}</div>
${list(f.nodes.map((n) => `${label(n.pageKey)} — ${n.note}`), "small")}`).join(""),
  });
  chapters.push({
    id: "ch-roles", title: "Routes by role",
    html: ROLE_ROUTES.map((r) => `<h2>${esc(r.title)}</h2><p>${esc(r.summary)}</p><p class="small"><b>First pages:</b> ${esc(r.firstPages.map(label).join(" · "))}</p>`).join(""),
  });
  chapters.push(sectionChapter("projects", "Project workspace", PROJECT_PAGES));
  for (const s of SECTIONS) chapters.push(sectionChapter(s.id, s.label, s.items.filter((i) => !i.key.startsWith("t.") || ["t.lib19650", "t.lib42001"].includes(i.key))));
  chapters.push(sectionChapter("account", "Account & settings", ACCOUNT_PAGES));
  chapters.push({
    id: "ch-templates", title: "Document template library",
    html: `<p>Every template opens as a structured form with ISO clause references, quality checks and Word export. Templates marked “generated” are produced from project data rather than typed.</p>
${table(["Code", "Template", "Standard", "Category", "Purpose", "Clauses"], templates.map((t) => [t.code, t.title + (t.generatedFrom ? " (generated)" : ""), t.standard === "iso19650" ? "ISO 19650" : "ISO/IEC 42001", t.category, t.purpose, t.clauseRefs.join(", ")]), "small")}`,
  });
  chapters.push({ id: "ch-faq", title: "Frequently asked questions", html: FAQ.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>${f.links?.length ? `<p class="small muted">See: ${esc(f.links.map((l) => l.label ?? label(l.pageKey)).join(" · "))}</p>` : ""}`).join("") });
  return book("Platform Guideline Book", "How to use every section and page of the platform: purpose, steps, outputs and mandatory inputs",
    chapters, "Chapters follow the sidebar. For each page: what it is for, how to use it, what it produces and what you must provide.");
}

// ---------------------------------------------------------------- Book 2: Information Management Handbook

function clauseRows(cs: Clause[], depth = 0): string {
  return cs.map((c) => `<div style="margin-left:${depth * 5}mm"><h${depth ? 4 : 3}>${esc(c.id)} ${esc(c.title)}</h${depth ? 4 : 3}><p>${esc(c.summary)}</p>${c.outputs?.length ? `<p class="small"><b>Outputs:</b> ${esc(c.outputs.join(" · "))}</p>` : ""}${c.children ? clauseRows(c.children, depth + 1) : ""}</div>`).join("");
}

function block(b: HubBlock): string {
  switch (b.kind) {
    case "text": return `<h3>${esc(b.title)}</h3>${b.body.map((p) => `<p>${esc(p)}</p>`).join("")}`;
    case "cards": return `<h3>${esc(b.title)}</h3><div class="cards">${b.cards.map((c) => `<div class="card"><b>${esc(c.title)}</b>${esc(c.body)}</div>`).join("")}</div>`;
    case "stats": return `<h3>${esc(b.title)}</h3>${table(["Figure", "Meaning", "Source"], b.stats.map((s) => [s.value, s.label, s.source ?? ""]))}`;
    case "steps": return `<h3>${esc(b.title)}</h3><ol>${b.steps.map((s) => `<li><b>${esc(s.title)}.</b> ${esc(s.body)}</li>`).join("")}</ol>`;
    case "table": return `<h3>${esc(b.title)}</h3>${table(b.columns, b.rows, "small")}`;
    case "list": return `<h3>${esc(b.title)}</h3>${list(b.items)}`;
    case "checklist": return `<h3>${esc(b.title)}</h3>${list(b.items.map((i) => "☐ " + i), "plain")}`;
    case "callout": return `<div class="box ${b.tone === "warn" ? "warn" : b.tone === "ok" ? "ok" : ""}"><b>${esc(b.title)}</b><p>${esc(b.body)}</p></div>`;
    case "faq": return `<h3>${esc(b.title)}</h3>${b.items.map((f) => `<h4>${esc(f.q)}</h4><p>${esc(f.a)}</p>`).join("")}`;
    case "process": return `<h3>${esc(b.title)}</h3>${b.steps.map((s) => `<div class="box"><b>${esc(s.title)}</b> <span class="tag">${esc(b.lanes.find((l) => l.id === s.lane)?.label ?? s.lane)}</span><span class="tag">${esc(s.clause)}</span>
<p class="muted small">${esc(s.subtitle)}</p><div class="kv"><div><h4>Inputs</h4>${list(s.inputs)}</div><div><h4>Outputs</h4>${list(s.outputs)}</div></div><h4>Activities</h4>${list(s.activities)}${s.tip ? `<p class="small"><b>Tip:</b> ${esc(s.tip)}</p>` : ""}</div>`).join("")}`;
    case "rolematrix": return `<h3>${esc(b.title)}</h3>${b.stages.map((st) => { const docs = b.docs.filter((d) => d.stage === st.id); return docs.length ? `<h4>${esc(st.label)} <span class="tag">${esc(st.clause)}</span></h4>${table(["Document", "Party", "Purpose", "Must contain", "Clause"], docs.map((d) => [d.name + (d.template ? ` [${d.template}]` : ""), b.parties.find((p) => p.id === d.party)?.label ?? d.party, d.purpose, d.keyContent.join("; "), d.clause]), "small")}` : ""; }).join("")}`;
    case "links": return `<h3>${esc(b.title)}</h3>${list(b.links.map((l) => `${l.label}${l.note ? ` — ${l.note}` : ""} (${l.href})`), "small")}`;
    case "graphic": return b.caption ? `<p class="small muted"><i>${esc(b.title)}: ${esc(b.caption)}</i></p>` : "";
    default: return ""; // quizzes, widgets and live tables stay in the platform
  }
}

function hubChapter(hubId: Parameters<typeof hubById>[0], title?: string): Chapter {
  const h = hubById(hubId)!;
  const sub: Chapter["sub"] = [];
  let html = `<p>${esc(h.intro)}</p>`;
  for (const s of h.sections) for (const t of s.tabs) {
    const id = `hb-${h.id}-${slug(s.id)}-${slug(t.id)}`;
    const name = h.sections.length > 1 ? `${s.label} — ${t.label}` : t.label;
    const body = t.blocks.map(block).join("");
    if (!body.trim()) continue;
    html += `<h2 id="${id}">${esc(name)}</h2>${body}`; sub.push({ id, title: name });
  }
  return { id: "ch-" + h.id, title: title ?? h.title, html, sub };
}

function handbook() {
  const chapters: Chapter[] = [];
  chapters.push({
    id: "ch-standards", title: "The ISO 19650 series",
    html: `<p>ISO 19650 sets out how information about built assets is specified, produced, shared, checked and handed over using building information modelling. This handbook summarises the practice as implemented in the platform; it explains the standards in our own words and does not reproduce their text.</p>
${parts19650.map((p) => `<h3>${esc(p.title)} <span class="tag">${esc(p.year)}</span></h3><p>${esc(p.scope)}</p><p class="small"><b>Key topics:</b> ${esc(p.keyTopics.join(" · "))}</p>`).join("")}`,
  });
  chapters.push({
    id: "ch-process", title: "The information management process (ISO 19650-2)",
    html: `<p>${esc(workflow19650.description)}</p>
${workflow19650.stages.map((s) => `<h2>${esc(s.title)}</h2><p>${esc(s.description)}</p><div class="box ok small"><b>Gate:</b> ${esc(s.gate)}</div>
${table(["Activity", "Owner", "Outputs"], s.activities.map((a) => [a.title, a.owner, a.outputs.join(", ")]))}`).join("")}
<h2>Clause by clause</h2>${clauseRows(process19650)}`,
  });
  chapters.push(hubChapter("documents-roles", "Documents and who produces them"));
  chapters.push(hubChapter("appointment", "Appointment: requirements, tender and BEP"));
  chapters.push({
    id: "ch-uses", title: "Information uses",
    html: `<p>Information uses state why information is produced. They drive the level of information need, the delivery plan and the BEP.</p>
${INFO_USES.map((u) => `<div class="box"><b>${esc(u.code)} ${esc(u.name)}</b> <span class="tag">${esc(u.category)}</span><span class="tag">${esc(u.phases.join(" · "))}</span>
<p>${esc(u.description)} <i>${esc(u.value)}</i></p><div class="kv"><div><h4>Inputs</h4>${list(u.inputs)}</div><div><h4>Deliverables</h4>${list(u.deliverables)}</div></div>
<p class="small"><b>Level of information need:</b> ${esc(u.loin)} · <b>Skills:</b> ${esc(u.skills.join(", "))}</p></div>`).join("")}`,
  });
  chapters.push({
    id: "ch-naming", title: "Containers, naming and status",
    html: `<h2>CDE states</h2>${table(["State", "Name", "Meaning"], cdeStates.map((s) => [s.id, s.title, s.desc]))}
<h2>Suitability / status codes</h2><p class="small muted">Codes commonly used under the UK National Annex; clients may define their own scheme in the information protocol.</p>${table(["Code", "CDE state", "Meaning"], suitabilityCodes.map((s) => [s.code, s.state, s.desc]))}
<h2>Container naming fields</h2><p>Fields are joined with a hyphen, e.g. ${esc(namingFields.map((f) => f.example).join("-"))}. Projects can adopt a client-specific scheme where the EIR requires one.</p>${table(["Field", "Length", "Example"], namingFields.map((f) => [f.label, f.hint, f.example]))}
<h2>Common type codes</h2>${list(typeCodes)}<h2>Common role codes</h2>${list(roleCodes)}`,
  });
  chapters.push(hubChapter("cde", "The common data environment"));
  chapters.push(hubChapter("loin", "Level of information need"));
  chapters.push(hubChapter("cobie", "COBie and asset information"));
  chapters.push(hubChapter("bcf", "Issues and coordination (BCF)"));
  chapters.push(hubChapter("handover", "Handover and the asset information model"));
  chapters.push(hubChapter("implementation", "Implementing ISO 19650 in an organisation"));
  chapters.push(hubChapter("iso42001", "AI management (ISO/IEC 42001)"));
  chapters.push({
    id: "ch-glossary", title: "Glossary",
    html: GLOSSARY_CATEGORIES.map((c) => { const es = GLOSSARY.filter((e) => e.category === c).sort((a, b) => a.term.localeCompare(b.term)); return es.length ? `<h2>${esc(c)}</h2><dl class="glossary">${es.map((e) => `<dt>${esc(e.term)}${e.abbr ? ` (${esc(e.abbr)})` : ""}</dt><dd>${esc(e.definition)}</dd>`).join("")}</dl>` : ""; }).join(""),
  });
  return book("Information Management Handbook", "ISO 19650 information management in practice — process, documents, CDE, level of information need, asset information and handover",
    chapters, "A practical reference for appointing parties, lead appointed parties and task teams. It explains the standards in our own words; refer to the published standards for their exact requirements.");
}

// ---------------------------------------------------------------- write

mkdirSync(out, { recursive: true });
const books = [["Platform-Guideline-Book", guidelineBook()], ["Information-Management-Handbook", handbook()]] as const;
for (const [name, html] of books) writeFileSync(join(out, name + ".html"), html);
let chromium: typeof import("playwright").chromium | undefined;
try { ({ chromium } = await import("playwright")); } catch {
  // a globally installed Playwright is visible to require (NODE_PATH) but not to import
  try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch { console.log("Playwright not installed: HTML written to docs/books; open it in a browser and print to PDF."); }
}
if (chromium) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name] of books) {
    await page.goto("file://" + join(out, name + ".html"), { waitUntil: "load" });
    const title = name.replace(/-/g, " ");
    await page.pdf({
      path: join(out, name + ".pdf"), format: "A4", printBackground: true, outline: true, tagged: true, displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:7pt;color:#7a8794;width:100%;padding:0 17mm;text-align:right">${title}</div>`,
      footerTemplate: `<div style="font-size:7pt;color:#7a8794;width:100%;padding:0 17mm;display:flex;justify-content:space-between"><span>BIM Management Portal · ${today}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
      margin: { top: "20mm", bottom: "18mm", left: "17mm", right: "17mm" },
    });
    console.log("wrote docs/books/" + name + ".pdf");
  }
  await browser.close();
}
