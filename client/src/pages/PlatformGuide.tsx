import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import { t } from "../i18n";
import { useSession } from "../App";
import { api, type Project } from "../lib/api";
import { Icon } from "../shell/icons";
import { PROJECT_PAGES, SECTIONS, groupsOf, hrefFor, pageByKey, type NavItem } from "../shell/nav";
import { LEARNING_PATHS } from "../../../shared/data/learningPaths";
import { FAQ, FIRST_DAY, FIRST_WEEK, FLOWS, ROLE_ROUTES, SECTION_GUIDE, type GuideLink } from "../../../shared/data/platformGuide";
import { TONES } from "./HubPage";
import "./platformGuide.css";

// Platform guide: what every sidebar section is for, where to start, and how the pieces connect.
// /guide/:tab — start · sections · first-day · first-week · flows · roles · faq

const TABS = [
  { id: "start", label: "Start here" },
  { id: "sections", label: "Every section" },
  { id: "first-day", label: "First day" },
  { id: "first-week", label: "First week" },
  { id: "flows", label: "How it fits together" },
  { id: "roles", label: "By role" },
  { id: "faq", label: "FAQ" },
] as const;

const DAY_KEY = "bim:guide:firstday";
const loadTicks = (): string[] => { try { const v = localStorage.getItem(DAY_KEY); const a = v ? JSON.parse(v) : []; return Array.isArray(a) ? a : []; } catch { return []; } };
const saveTicks = (v: string[]) => { try { localStorage.setItem(DAY_KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } };

/** The project open last (as the sidebar remembers it), so project pages link straight into it. */
function useProjectId(): string | undefined {
  const { user } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => { api<{ projects: Project[] }>("/projects").then((r) => setProjects(r.projects)).catch(() => undefined); }, []);
  const stored = (() => { try { const v = localStorage.getItem(`bim:project:${user.id}`); return v ? (JSON.parse(v) as string) : null; } catch { return null; } })();
  return (projects.find((p) => p.id === stored) ?? projects[0])?.id;
}

const SIDEBAR = [
  { id: SECTIONS[0].id, items: SECTIONS[0].items },
  { id: "projects", items: PROJECT_PAGES },
  ...SECTIONS.slice(1).map((s) => ({ id: s.id, items: s.items })),
];

function PageLink({ link, projectId, className = "btn" }: { link: GuideLink; projectId?: string; className?: string }) {
  const item = pageByKey(link.pageKey);
  if (!item) return null;
  const href = link.href ?? hrefFor(item, projectId);
  return <a className={className} href={"#" + href}>{t(link.label ?? item.label)} →</a>;
}

// ---------------------------------------------------------------- start here

const PARTS = [
  { n: 1, title: "Account menu", text: "Your profile, plan, Set my role, light or dark theme and sign out. Hide the sidebar with the panel button or Ctrl+\\." },
  { n: 2, title: "Search and Ask AI", text: "Search filters the menu as you type. Ask AI searches the ISO knowledge base. Inbox holds review requests and mentions." },
  { n: 3, title: "Favourites", text: "Pages you pinned with Add to favourites, and the tools added when you set your role." },
  { n: 4, title: "View by role", text: "Filter the menu to one role's tools. Choose All to see every page again." },
  { n: 5, title: "Sections", text: "Seven sections, one open at a time. Numbered steps inside a section are in the order work is done." },
  { n: 6, title: "Help & support", text: "Ask a question or report a problem and read the replies." },
];

function StartHere() {
  return (
    <>
      <div className="hub-card">
        <div className="hub-title">{t("What this platform is")}</div>
        <ul className="pg-lines">
          <li>{t("One place to run ISO 19650 information management: requirements, plans, the CDE, models, issues and handover.")}</li>
          <li>{t("Tools and guides work on their own; a project stores your team's shared records on the server.")}</li>
          <li>{t("You enter project data once and every document, plan and check reuses it.")}</li>
          <li>{t("Learning content explains every part of the standard, so you can look up anything you meet in a tool.")}</li>
        </ul>
      </div>
      <div className="hub-card">
        <div className="hub-title">{t("The sidebar, explained")}</div>
        <div className="pg-sb-wrap">
          <div className="pg-sb" aria-hidden="true">
            <div className="pg-sb-part"><span className="pg-num">1</span><span className="pg-sb-user"><Icon name="building" size={13} /> BIM Management</span></div>
            <div className="pg-sb-part"><span className="pg-num">2</span><span className="pg-sb-search"><Icon name="search" size={12} /> {t("Search sections…")}</span><span className="pg-sb-row"><span className="pg-sb-mini">{t("Ask AI")}</span><span className="pg-sb-mini">{t("Inbox")}</span></span></div>
            <div className="pg-sb-part"><span className="pg-num">3</span><span className="pg-sb-sec"><Icon name="star" size={12} /> {t("Favourites")}</span></div>
            <div className="pg-sb-part"><span className="pg-num">4</span><span className="pg-sb-label">{t("View by role")}</span><span className="pg-sb-row"><span className="pg-sb-chip on">{t("All")}</span><span className="pg-sb-chip">{t("Modeller")}</span><span className="pg-sb-chip">{t("Coordinator")}</span></span></div>
            <div className="pg-sb-part"><span className="pg-num">5</span>
              {SECTION_GUIDE.map((s) => <span key={s.id} className="pg-sb-sec">{t(s.title)}<Icon name="chevron" size={11} /></span>)}
            </div>
            <div className="pg-sb-part"><span className="pg-num">6</span><span className="pg-sb-mini">{t("Help & support")}</span></div>
          </div>
          <ol className="pg-legend">
            {PARTS.map((p) => <li key={p.n}><span className="pg-num">{p.n}</span><span><b>{t(p.title)}</b><small>{t(p.text)}</small></span></li>)}
          </ol>
        </div>
        <p className="small muted">{t("At the top of every page: breadcrumbs show where you are, and Add to favourites pins the page. Press Ctrl+K anywhere to jump to any page, template or project.")}</p>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <a className="btn primary" href="#/guide/first-day">{t("Start your first day")} →</a>
        <a className="btn" href="#/guide/sections">{t("See every section")} →</a>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- every section

function EverySection({ projectId }: { projectId?: string }) {
  return (
    <div className="pg-sections">
      {SECTION_GUIDE.map((s, n) => {
        const items = SIDEBAR.find((x) => x.id === s.id)?.items ?? [];
        const start = pageByKey(s.startWith);
        return (
          <section key={s.id} className="hub-card" id={`sec-${s.id}`}>
            <div className="row spread"><h2 className="pg-sec-title"><span className="pg-num">{n + 1}</span>{t(s.title)}</h2><span className="badge">{items.length} {t("pages")}</span></div>
            <p>{t(s.purpose)}</p>
            <div className="grid g2">
              <div className="hub-tile"><b>{t("When to use it")}</b><div className="small">{t(s.whenToUse)}</div></div>
              <div className="hub-tile"><b>{t("Why this order")}</b><div className="small">{t(s.order)}</div></div>
            </div>
            {start && <p className="small">{t("Start with")}: <a href={"#" + hrefFor(start, projectId)}>{t(start.label)} →</a>{start.scope === "project" && !projectId && <span className="muted"> ({t("create a project first")})</span>}</p>}
            {groupsOf(items).map((g, k) => (
              <div key={g} className="pg-group">
                <div className="pg-group-head"><b>{String(k + 1).padStart(2, "0")}. {t(g)}</b><small>{t(s.groups[g] ?? "")}</small></div>
                <ul className="pg-pages">
                  {items.filter((i: NavItem) => i.group === g).map((i) => (
                    <li key={i.key}><a href={"#" + hrefFor(i, projectId)}>{t(i.label)}</a>{i.hint && <small>{t(i.hint)}</small>}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- first day

function FirstDay({ projectId }: { projectId?: string }) {
  const [ticks, setTicks] = useState<string[]>(loadTicks);
  const toggle = (id: string) => setTicks((cur) => { const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]; saveTicks(next); return next; });
  const done = FIRST_DAY.filter((s) => ticks.includes(s.id)).length;
  const pct = Math.round((done / FIRST_DAY.length) * 100);
  return (
    <>
      <div className="hub-card">
        <div className="row spread"><b>{t("Your first day")}</b><span className="chip">{done}/{FIRST_DAY.length} {t("done")}</span></div>
        <span className="bar pg-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${pct}%` }} /></span>
        <p className="small muted">{t("Do the steps in order: each one only uses what the steps before it set up. Your ticks are saved in this browser.")}</p>
      </div>
      <ol className="pg-checklist">
        {FIRST_DAY.map((s, n) => {
          const on = ticks.includes(s.id);
          const item = pageByKey(s.pageKey);
          return (
            <li key={s.id} className={"hub-card pg-check" + (on ? " done" : "")}>
              <label className="pg-tick"><input type="checkbox" checked={on} onChange={() => toggle(s.id)} aria-label={t(s.title)} /><span className="pg-num">{on ? "✓" : n + 1}</span></label>
              <div className="pg-check-body">
                <b>{t(s.title)}</b>
                <div className="small">{t(s.why)}</div>
                <div className="small muted"><b>{t("Done when")}:</b> {t(s.doneWhen)}</div>
              </div>
              {item && <a className="btn small" href={"#" + (s.href ?? hrefFor(item, projectId))}>{t("Open")} →</a>}
            </li>
          );
        })}
      </ol>
      {done === FIRST_DAY.length && <div className="hub-tile">{t("Day one is done. Continue with the first week.")} <a href="#/guide/first-week">{t("First week")} →</a></div>}
    </>
  );
}

// ---------------------------------------------------------------- first week

function FirstWeek({ projectId }: { projectId?: string }) {
  return (
    <div className="grid g2">
      {FIRST_WEEK.map((d) => (
        <div key={d.day} className="hub-card">
          <div className="hub-title">{t("Day")} {d.day} · {t(d.title)}</div>
          <p className="small">{t(d.focus)}</p>
          <div className="row" style={{ gap: 8 }}>{d.links.map((l) => <PageLink key={l.pageKey + (l.href ?? "")} link={l} projectId={projectId} />)}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- how it fits together

function Flows({ projectId }: { projectId?: string }) {
  return (
    <>
      <p className="small muted">{t("Information entered in one place flows into the next. Follow each chain from left to right; every chip opens the page.")}</p>
      {FLOWS.map((f) => (
        <div key={f.id} className="hub-card">
          <div className="hub-title">{t(f.title)}</div>
          <p className="small">{t(f.summary)}</p>
          <div className="pg-flow">
            {f.nodes.map((nd, k) => {
              const item = pageByKey(nd.pageKey);
              if (!item) return null;
              return (
                <Fragment key={nd.pageKey + k}>
                  {k > 0 && <span className="pg-arrow" aria-hidden="true">→</span>}
                  <a className="pg-node" href={"#" + (nd.href ?? hrefFor(item, projectId))}><b>{t(item.label)}</b><small>{t(nd.note)}</small></a>
                </Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------- by role

function ByRole({ projectId }: { projectId?: string }) {
  return (
    <>
      <p className="small muted">{t("Each role has a learning path (an ordered route through the platform) and a role profile (duties at every stage). Set my role in the account menu adds your role's tools to Favourites.")}</p>
      <div className="grid g2">
        {ROLE_ROUTES.map((r) => {
          const path = LEARNING_PATHS.find((p) => p.id === r.pathId);
          return (
            <div key={r.id} className="hub-card">
              <div className="hub-title">{t(r.title)}</div>
              <p className="small">{t(r.summary)}</p>
              {path && <p className="small muted">{t(path.title)} · {path.steps.length} {t("steps")} · {path.weeks} {t("weeks")}</p>}
              <div className="row" style={{ gap: 8 }}>
                <a className="btn primary" href={`#/learning-paths/${r.pathId}`}>{t("Learning path")} →</a>
                {r.roleProfile && <a className="btn" href={`#/workflow/roles/${r.roleProfile}`}>{t("Role profile")} →</a>}
              </div>
              <div className="small muted pg-first">{t("Use first")}:</div>
              <div className="row" style={{ gap: 6 }}>{r.firstPages.map((k) => <PageLink key={k} link={{ pageKey: k }} projectId={projectId} className="pg-chiplink" />)}</div>
            </div>
          );
        })}
      </div>
      <a className="small" href="#/workflow/roles">{t("Every role profile")} →</a>
    </>
  );
}

// ---------------------------------------------------------------- FAQ

function Faq({ projectId }: { projectId?: string }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return FAQ.filter((f) => !term || [f.q, f.a, t(f.q), t(f.a)].join(" ").toLowerCase().includes(term));
  }, [q]);
  return (
    <>
      <input placeholder={t("Search questions…")} value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 420 }} />
      <div className="pg-faq">
        {list.map((f) => (
          <details key={f.q} className="hub-card" open={!!q.trim()}>
            <summary><b>{t(f.q)}</b></summary>
            <p className="small">{t(f.a)}</p>
            {!!f.links?.length && <div className="row" style={{ gap: 8 }}>{f.links.map((l) => <PageLink key={l.pageKey + (l.href ?? "")} link={l} projectId={projectId} />)}</div>}
          </details>
        ))}
        {!list.length && <p className="small muted">{t("No question matches. Try another word, or ask in Help & support.")}</p>}
      </div>
    </>
  );
}

export default function PlatformGuide({ tab }: { tab?: string }) {
  const cur = TABS.find((x) => x.id === tab) ?? TABS[0];
  const projectId = useProjectId();
  return (
    <div className="hub pg" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero">
        <div className="eyebrow">{t("PLATFORM GUIDE")}</div>
        <h1>{t("Platform guide — start here")}</h1>
        <p>{t("What every section is for, the order to use things in, where to begin on day one and how the pieces connect.")}</p>
        <div className="facts"><span>{SECTION_GUIDE.length} {t("sections")}</span><span>{FIRST_DAY.length} {t("first-day steps")}</span><span>{FLOWS.length} {t("flows")}</span><span>{FAQ.length} {t("questions")}</span></div>
      </div>
      <nav className="tabs" aria-label={t("Guide sections")}>
        {TABS.map((x) => <a key={x.id} className={"tab" + (cur.id === x.id ? " on" : "")} href={`#/guide/${x.id}`}>{t(x.label)}</a>)}
      </nav>
      {cur.id === "start" && <StartHere />}
      {cur.id === "sections" && <EverySection projectId={projectId} />}
      {cur.id === "first-day" && <FirstDay projectId={projectId} />}
      {cur.id === "first-week" && <FirstWeek projectId={projectId} />}
      {cur.id === "flows" && <Flows projectId={projectId} />}
      {cur.id === "roles" && <ByRole projectId={projectId} />}
      {cur.id === "faq" && <Faq projectId={projectId} />}
    </div>
  );
}
