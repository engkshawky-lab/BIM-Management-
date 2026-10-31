import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { t } from "../../i18n";
import { LangSwitch } from "../Login";
import { LegalFooter } from "../Legal";
import { AI_PAGES, PROJECT_PAGES, SECTIONS, TEMPLATE_PAGES, type NavItem } from "../../shell/nav";
import { api } from "../../lib/api";
import { plansFor, type AccessMap } from "../../../../shared/access";
import { capacityRows, mergePlans, priceText, type Plan } from "../../../../shared/plans";
import { Announcement, useSite } from "../../lib/site";
import "./public.css";

// Public pages for visitors who are not signed in: home (/), pricing (/pricing) and about (/about).
// Signed-in users see pricing and about inside the app shell (embedded = true, no top bar or footer).

type Page = "home" | "pricing" | "about";

/** Where "Start free" goes: sign-up, or sign-in when the administrator has closed sign-ups. */
function useStart() {
  const { site } = useSite();
  return site.allowSignups ? { href: "#/signup", label: "Start free", account: "Create a free account" } : { href: "#/login", label: "Sign in", account: "Sign in" };
}

export function PublicLayout({ page, children }: { page: Page; children: ReactNode }) {
  const { site } = useSite();
  const [, setLang] = useState(0);
  const [menu, setMenu] = useState(false);
  const link = (href: string, label: string, on: boolean) => <a href={href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>{t(label)}</a>;
  return (
    <div className="pub">
      <header className="pub-bar">
        <a className="pub-brand" href="#/"><span className="pub-logo" aria-hidden="true">IM</span><b>{site.siteName}</b></a>
        <button type="button" className="pub-menu-btn" aria-expanded={menu} aria-controls="pub-nav" onClick={() => setMenu(!menu)}>{t("Menu")}</button>
        <nav id="pub-nav" className={"pub-nav" + (menu ? " open" : "")} aria-label={t("Main")}>
          {link("#/", "Home", page === "home")}
          {site.showPricing && link("#/pricing", "Pricing", page === "pricing")}
          {link("#/about", "About", page === "about")}
          <LangSwitch onChange={() => setLang((n) => n + 1)} />
          <a href="#/login" className="btn">{t("Sign in")}</a>
          {site.allowSignups && <a href="#/signup" className="btn primary">{t("Start free")}</a>}
        </nav>
      </header>
      <Announcement />
      <main id="main" tabIndex={-1}>{children}</main>
      <div className="pub-foot"><LegalFooter /></div>
    </div>
  );
}

const PILLARS = [
  { icon: "📘", title: "Learn the standards", body: "ISO 19650 parts 1–6 and ISO/IEC 42001 explained step by step, with worked examples, learning paths by role, quizzes and practice exams.", points: ["Learning hubs for every part", "Paths for clients, BIM managers, coordinators and modellers", "Bilingual glossary, English and Arabic"] },
  { icon: "📄", title: "Write the documents", body: "Templates and guides for every information requirement and plan, from OIR and EIR to BEP, MIDP and TIDP, ready to fill in for your project.", points: ["30+ templates with guidance", "EIR and BEP writers with AI", "Export to Word"] },
  { icon: "🗂️", title: "Run the project", body: "A common data environment with container states, a delivery planner, responsibility matrix, issues, risks, meetings and approval gates.", points: ["WIP, Shared, Published and Archived states", "File naming checks on upload", "Activity log and notifications"] },
  { icon: "🧊", title: "Check the models", body: "Check IFC models against your requirements, write IDS rules, manage BCF issues and plan clash tests, all in the browser.", points: ["IFC checks graded A–F", "IDS builder and BCF studio", "ACC and Speckle connectors"] },
  { icon: "✨", title: "Work faster with AI", body: "AI tools built around ISO 19650: draft an EIR, answer it with a BEP, check one against the other, triage clashes and ask questions about your project.", points: ["EIR ↔ BEP compliance matrix", "Clash triage and model QA", "Project assistant with sources"] },
  { icon: "🛡️", title: "Govern AI use", body: "Set up an AI management system to ISO/IEC 42001 with policy, risk, impact assessment and Annex A controls, with templates for each.", points: ["Clause-by-clause guidance", "Statement of applicability", "AI policy and risk templates"] },
];

const AUDIENCES = [
  { title: "Clients and asset owners", body: "Set clear information requirements, check what tenderers promise and accept information with confidence." },
  { title: "BIM and information managers", body: "Write the BEP, plan delivery, run the CDE and keep every team working to the same standard." },
  { title: "BIM coordinators", body: "Check models, plan clash tests, manage issues and keep the federated model in order." },
  { title: "Modellers and task teams", body: "Know what to deliver and when, name files correctly and learn the standard as you work." },
];

const STEPS = [
  { title: "Create your account", body: "Start free. Pick your role and the portal shows the pages and learning path that fit it." },
  { title: "Set up a project", body: "Enter the project details once, invite your team and choose the documents you need." },
  { title: "Deliver to ISO 19650", body: "Write, check and share information through the CDE, with AI help where it saves time." },
];

const FAQ = [
  { q: "Do I need to know ISO 19650 already?", a: "No. The learning hubs start from the basics and every tool links to the part of the standard it supports." },
  { q: "Does the portal include the ISO standards themselves?", a: "No. The content is practical guidance written in plain language. Buy the standards from ISO or your national standards body for the official text." },
  { q: "Is it available in Arabic?", a: "Yes. Switch the language to Arabic at any time; the interface and most of the guidance are translated, with right-to-left layout." },
  { q: "Where is our project data stored?", a: "On the portal's server. Organisations can also ask for a private installation on their own server." },
  { q: "Is my data used to train AI models?", a: "No. AI features send only the text needed for that request to the AI provider, and the provider does not use it for training under its commercial terms." },
];

export function Landing() {
  const start = useStart();
  const { site } = useSite();
  const aiTools = AI_PAGES.filter((p) => /\/ai-studio\/|\/ai-tools\//.test(p.path)).length;
  const stats = [
    { n: "6", label: "ISO 19650 parts covered" },
    { n: `${TEMPLATE_PAGES.length}+`, label: "document templates" },
    { n: `${Math.max(aiTools, 9)}+`, label: "AI tools" },
    { n: "EN · AR", label: "English and Arabic" },
  ];
  return (
    <PublicLayout page="home">
      <section className="pub-hero">
        <div className="pub-hero-text">
          <p className="pub-eyebrow">{t("ISO 19650 · BIM · ISO/IEC 42001")}</p>
          <h1>{t("Information management to ISO 19650, from learning to delivery")}</h1>
          <p className="pub-lead">{t("One place to learn the standard, write the documents, run the common data environment and check models, with AI tools built for BIM teams.")}</p>
          <div className="pub-cta">
            <a className="btn primary lg" href={start.href}>{t(start.label)}</a>
            {site.showPricing && <a className="btn lg" href="#/pricing">{t("See plans and pricing")}</a>}
          </div>
          <p className="small muted">{t("Free plan, no card needed.")}</p>
        </div>
        <div className="pub-hero-art" aria-hidden="true">
          <div className="mock">
            <div className="mock-side"><i /><i /><i className="on" /><i /><i /><i /></div>
            <div className="mock-main">
              <div className="mock-row"><span className="mock-chip ok">S2</span><span className="mock-line w60" /></div>
              <div className="mock-row"><span className="mock-chip">S0</span><span className="mock-line w80" /></div>
              <div className="mock-row"><span className="mock-chip pub-a">A1</span><span className="mock-line w40" /></div>
              <div className="mock-cards"><span /><span /><span /></div>
              <div className="mock-ai"><b>✨</b><span className="mock-line w70" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-stats" aria-label={t("At a glance")}>
        {stats.map((s) => <div key={s.label}><b>{s.n}</b><span>{t(s.label)}</span></div>)}
      </section>

      <section className="pub-section">
        <h2>{t("Everything an ISO 19650 project needs")}</h2>
        <div className="pub-grid three">
          {PILLARS.map((p) => (
            <article key={p.title} className="pub-card">
              <span className="pub-icon" aria-hidden="true">{p.icon}</span>
              <h3>{t(p.title)}</h3>
              <p>{t(p.body)}</p>
              <ul>{p.points.map((x) => <li key={x}>{t(x)}</li>)}</ul>
            </article>))}
        </div>
      </section>

      <section className="pub-section alt">
        <h2>{t("Built for every role in the delivery team")}</h2>
        <div className="pub-grid four">
          {AUDIENCES.map((a) => <article key={a.title} className="pub-card flat"><h3>{t(a.title)}</h3><p>{t(a.body)}</p></article>)}
        </div>
      </section>

      <section className="pub-section">
        <h2>{t("How it works")}</h2>
        <ol className="pub-steps">
          {STEPS.map((s, i) => <li key={s.title}><span className="pub-step-n">{i + 1}</span><div><h3>{t(s.title)}</h3><p>{t(s.body)}</p></div></li>)}
        </ol>
      </section>

      <section className="pub-section alt">
        <h2>{t("Plans for every stage")}</h2>
        <PlanCards compact />
        <p className="pub-center"><a href="#/pricing">{t("Compare all features →")}</a></p>
      </section>

      <section className="pub-section">
        <h2>{t("Questions")}</h2>
        <Faq items={FAQ} />
      </section>

      <section className="pub-band">
        <h2>{t("Start your first ISO 19650 project today")}</h2>
        <a className="btn primary lg" href={start.href}>{t(start.account)}</a>
      </section>
    </PublicLayout>
  );
}

/** Plans and section access as the administrator set them; the defaults until the server answers. */
function usePlans() {
  const [data, setData] = useState<{ plans: Plan[]; access: AccessMap }>({ plans: mergePlans(null), access: {} });
  useEffect(() => { api<{ plans: Plan[]; access: AccessMap }>("/public/plans").then(setData).catch(() => undefined); }, []);
  return data;
}

function PlanCards({ compact = false, signedIn = false }: { compact?: boolean; signedIn?: boolean }) {
  const { plans } = usePlans();
  return (
    <div className="pub-grid four pub-plans">
      {plans.map((p) => <PlanCard key={p.id} p={p} compact={compact} featured={p.id === "pro"} signedIn={signedIn} />)}
    </div>
  );
}

function PlanCard({ p, compact, featured, signedIn }: { p: Plan; compact: boolean; featured: boolean; signedIn: boolean }) {
  const cta = signedIn ? { href: "#/billing", label: p.id === "free" ? "Your plan & billing" : `Upgrade to ${p.name}` }
    : p.id === "free" ? { href: "#/signup", label: "Start free" }
      : { href: "#/signup", label: `Choose ${p.name}` };
  return (
    <article className={"pub-card plan" + (featured ? " featured" : "")} style={{ "--plan": p.color } as CSSProperties}>
      {featured && <span className="pub-badge">{t("Most popular")}</span>}
      <h3><span className="pub-dot" aria-hidden="true" />{t(p.name)}</h3>
      <p className="pub-price"><b>{t(priceText(p))}</b></p>
      <p className="small muted">{t(p.price.note)}</p>
      <p>{t(p.tagline)}</p>
      {!compact && <p className="small muted">{t("Best for:")} {t(p.audience)}</p>}
      <ul>{p.features.map((f) => <li key={f}>{t(f)}</li>)}</ul>
      <a className={"btn" + (featured || p.id === "free" ? " primary" : "")} href={cta.href}>{t(cta.label)}</a>
    </article>
  );
}

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <span className="pub-yes" aria-label={t("Included")}>✓</span>;
  if (v === false) return <span className="pub-no" aria-label={t("Not included")}>—</span>;
  return <>{t(v)}</>;
}

// The comparison follows the sidebar: one group per section, one row per page, ticked where the plan opens it.
// The 30+ templates share one row; project pages get their own group.
function comparisonGroups(plans: Plan[], access: AccessMap) {
  const cells = (key: string) => plans.map((p) => plansFor(key, access).includes(p.id));
  const rows = (items: NavItem[]) => items.map((i) => ({ label: i.label, cells: cells(i.key) as (boolean | string)[] }));
  const groups = SECTIONS.filter((s) => s.id !== "home").map((s) => ({ title: s.label, rows: rows(s.items) }));
  const docs = groups.find((g) => g.title === "Documents & delivery");
  docs?.rows.push({ label: `Document templates (${TEMPLATE_PAGES.length})`, cells: cells(TEMPLATE_PAGES[0]?.key ?? "t.") });
  return [
    { title: "Capacity", rows: capacityRows(plans) as { label: string; cells: (boolean | string)[] }[] },
    { title: "Projects and the common data environment", rows: rows(PROJECT_PAGES) },
    ...groups,
  ];
}

const PRICING_FAQ = [
  { q: "What is different between the plans?", a: "Each plan opens more of the portal and gives more capacity. Free covers the ISO 19650 basics, Starter adds the learning tools, Professional adds the document builders, templates and project tools, and Expert opens everything, including the model checkers, connectors and advanced AI tools." },
  { q: "Can I change plans later?", a: "Yes. Upgrade from the Plan & billing page at any time; your projects and documents stay as they are." },
  { q: "What counts as an AI request?", a: "Each run of an AI tool or each question to the project assistant counts as one request. Learning content, templates and non-AI checks are not counted." },
  { q: "Who counts as a member?", a: "Anyone you invite to a project. Members can be viewers, editors or managers, and each project has its own team." },
  { q: "Do you offer licences for a whole organisation?", a: "Yes. Contact us for several Expert licences, a private installation on your own server, or training for your team." },
];

export function Pricing({ embedded = false }: { embedded?: boolean }) {
  const { plans, access } = usePlans();
  const groups = comparisonGroups(plans, access);
  const body = (
    <>
      <section className={"pub-section" + (embedded ? " embedded" : "")}>
        <p className="pub-eyebrow">{t("PRICING")}</p>
        <h1>{t("Plans and pricing")}</h1>
        <p className="pub-lead">{t("Start free, then choose the plan that opens the tools you need. Every paid plan is billed yearly and can be upgraded at any time.")}</p>
        <PlanCards signedIn={embedded} />
      </section>
      <section className="pub-section">
        <h2>{t("Compare plans")}</h2>
        <div className="pub-table-wrap">
          <table className="pub-compare">
            <thead><tr><th scope="col">{t("Feature")}</th>{plans.map((p) => <th key={p.id} scope="col" style={{ color: p.color }}>{t(p.name)}<small>{t(priceText(p))}</small></th>)}</tr></thead>
            {groups.map((g) => (
              <tbody key={g.title}>
                <tr className="pub-group"><th colSpan={plans.length + 1} scope="colgroup">{t(g.title)}</th></tr>
                {g.rows.map((r) => <tr key={r.label}><th scope="row">{t(r.label)}</th>{r.cells.map((c, i) => <td key={i}><Cell v={c} /></td>)}</tr>)}
              </tbody>))}
          </table>
        </div>
      </section>
      <section className="pub-section">
        <h2>{t("Pricing questions")}</h2>
        <Faq items={PRICING_FAQ} />
      </section>
    </>
  );
  return embedded ? <div className="pub embedded">{body}</div> : <PublicLayout page="pricing">{body}</PublicLayout>;
}

const VALUES = [
  { title: "Practical, not theoretical", body: "Every page answers what to do next on a real project: who does it, which document it goes in and what good looks like." },
  { title: "Faithful to the standard", body: "Content follows ISO 19650 and the UK National Annex, written in plain language with references to the clauses it explains. It never replaces the official text." },
  { title: "Bilingual from the start", body: "English and Arabic side by side, with consistent ISO terminology, for teams working across the Gulf and beyond." },
  { title: "AI with guard rails", body: "AI drafts and checks, people decide. Tools cite their sources, flag what needs confirming and follow ISO/IEC 42001 principles." },
];

export function About({ embedded = false }: { embedded?: boolean }) {
  const { site } = useSite();
  const start = useStart();
  const body = (
    <>
      <section className={"pub-section" + (embedded ? " embedded" : "")}>
        <p className="pub-eyebrow">{t("ABOUT")}</p>
        <h1>{t("About the portal")}</h1>
        <p className="pub-lead">{t("We built this portal because ISO 19650 is easy to agree with and hard to put into practice. Teams need to understand the standard, produce the right documents and run their projects to it, usually all at once.")}</p>
        <p>{t("The portal brings those three jobs together: learning hubs that explain each part of the standard, templates and guides for every document, and project tools for the common data environment, delivery planning and model checking. AI tools help with the slow parts, such as drafting an EIR, answering it with a BEP or sorting a clash report.")}</p>
        <p>{t("It is made by the FirstOption team, engineers and BIM specialists who also build the FirstOption MCP Hub, which connects AI assistants to Revit, AutoCAD, Civil 3D, Plant 3D and Navisworks.")}</p>
      </section>
      <section className="pub-section alt">
        <h2>{t("What we believe")}</h2>
        <div className="pub-grid four">
          {VALUES.map((v) => <article key={v.title} className="pub-card flat"><h3>{t(v.title)}</h3><p>{t(v.body)}</p></article>)}
        </div>
      </section>
      <section className="pub-section">
        <h2>{t("What the portal covers")}</h2>
        <ul className="pub-cover">
          <li>{t("ISO 19650-1 to -6: concepts, delivery phase, operational phase, information exchange, security and health and safety")}</li>
          <li>{t("ISO/IEC 42001: AI management systems, with Annex A controls")}</li>
          <li>{t("openBIM: IFC 4.3, IDS, BCF and COBie")}</li>
          <li>{t("UK National Annex status and revision codes, and Gulf BIM mandates")}</li>
        </ul>
      </section>
      <section className="pub-band">
        <h2>{t("Talk to us")}</h2>
        {site.contactEmail
          ? <a className="btn primary lg" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
          : <a className="btn primary lg" href={start.href}>{t(start.account)}</a>}
      </section>
    </>
  );
  return embedded ? <div className="pub embedded">{body}</div> : <PublicLayout page="about">{body}</PublicLayout>;
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="pub-faq">
      {items.map((f) => <details key={f.q}><summary>{t(f.q)}</summary><p>{t(f.a)}</p></details>)}
    </div>
  );
}
