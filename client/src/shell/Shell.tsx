import { t } from "../i18n";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { initials, navigate, useSession } from "../App";
import { glossary19650, process19650 } from "../../../shared/data/iso19650";
import { clauses42001, glossary42001 } from "../../../shared/data/iso42001";
import { api, canManage, type Notification, type Project } from "../lib/api";
import { Icon } from "./icons";
import { ALL_PAGES, PROJECT_PAGES, RAIL, RESOURCE_PAGES, STANDARD_PAGES, TEMPLATE_PAGES, hrefFor, labelForRoute, pageByKey, sectionFor, type NavItem } from "./nav";
import { BIM_ROLES, roleById } from "./roles";
import { SupportForm } from "../pages/Support";

// ---------------------------------------------------------------- per-user local conveniences

const store = {
  get<T>(key: string, fallback: T): T { try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } },
  set(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

export interface RecentEntry { path: string; label: string; ts: number }
const recentKey = (uid: string) => `bim:recent:${uid}`;
export function recordRecent(uid: string, path: string, label: string) {
  // one entry per page: the same label reached through different ids (e.g. two issues) is kept once
  const list = store.get<RecentEntry[]>(recentKey(uid), []).filter((r) => r.path !== path && r.label !== label);
  store.set(recentKey(uid), [{ path, label, ts: Date.now() }, ...list].slice(0, 10));
  window.dispatchEvent(new Event("bim:recent"));
}
export function useRecent(uid: string) {
  const [list, setList] = useState<RecentEntry[]>(() => store.get(recentKey(uid), []));
  useEffect(() => { const on = () => setList(store.get(recentKey(uid), [])); window.addEventListener("bim:recent", on); return () => window.removeEventListener("bim:recent", on); }, [uid]);
  return list;
}

/** Project currently open, or the last one used, so project pages in the panel and favourites resolve. */
export function useCurrentProject(route: string, projects: Project[], uid: string) {
  const inRoute = /^\/projects\/([0-9a-f-]{36})/.exec(route)?.[1];
  useEffect(() => { if (inRoute) store.set(`bim:project:${uid}`, inRoute); }, [inRoute, uid]);
  const id = inRoute ?? store.get<string | null>(`bim:project:${uid}`, null);
  return projects.find((p) => p.id === id) ?? projects[0];
}

// ---------------------------------------------------------------- panel

function PanelLink({ item, projectId, active, fav }: { item: NavItem; projectId?: string; active: boolean; fav?: boolean }) {
  return (
    <a className={"panel-link" + (active ? " on" : "")} href={"#" + hrefFor(item, projectId)} title={item.hint && t(item.hint)}>
      <Icon name={item.icon} size={16} /><span>{t(item.label)}</span>{fav && <Icon name="star" size={12} className="fav-mark" />}
    </a>
  );
}

function Groups({ items, route, projectId, favs, empty }: { items: NavItem[]; route: string; projectId?: string; favs: Set<string>; empty: string }) {
  const groups = [...new Set(items.map((i) => i.group))];
  if (!items.length) return <p className="panel-empty">{empty}</p>;
  return <>{groups.map((gname) => (
    <div key={gname} className="panel-group">
      <div className="panel-group-title">{t(gname)}</div>
      {items.filter((i) => i.group === gname).map((i) => {
        const href = hrefFor(i, projectId);
        return <PanelLink key={i.key} item={i} projectId={projectId} fav={favs.has(i.key)} active={route === href || (i.scope === "project" && route.startsWith(href + "/"))} />;
      })}
    </div>
  ))}</>;
}

function Panel({ section, route, projects, project, onRole, onClose }: { section: string; route: string; projects: Project[]; project?: Project; onRole: () => void; onClose: () => void }) {
  const { user } = useSession();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState<string>(() => store.get(`bim:focus:${user.id}`, "all"));
  useEffect(() => store.set(`bim:focus:${user.id}`, focus), [focus, user.id]);
  const favs = new Set(user.favourites ?? []);
  const recent = useRecent(user.id);
  const role = roleById(focus);
  const filter = (items: NavItem[]) => items.filter((i) => (!q || (i.label + " " + i.group + " " + (i.hint ?? "") + " " + t(i.label) + " " + t(i.group)).toLowerCase().includes(q.toLowerCase())) && (!role || role.tools.includes(i.key)));
  const sec = RAIL.find((s) => s.id === section);
  const title = section === "help" ? "Help" : sec?.title ?? "";

  let body: ReactNode;
  if (section === "home") {
    const favItems = (user.favourites ?? []).map(pageByKey).filter((x): x is NavItem => !!x);
    body = <>
      <a className={"panel-link" + (route === "/" ? " on" : "")} href="#/"><Icon name="grid" size={16} /><span>{t("Dashboard")}</span></a>
      <div className="panel-group"><div className="panel-group-title">{t("Favourites")}</div>
        {favItems.length ? filter(favItems).map((i) => <PanelLink key={i.key} item={i} projectId={project?.id} active={route === hrefFor(i, project?.id)} />)
          : <p className="panel-empty">Use the ☆ Favourite button at the top of any page to pin it here.</p>}</div>
      <div className="panel-group"><div className="panel-group-title">{t("Recently visited")}</div>
        {recent.length ? recent.slice(0, 6).map((r) => <a key={r.path} className="panel-link" href={"#" + r.path}><Icon name="clock" size={16} /><span>{r.label}</span></a>)
          : <p className="panel-empty">Pages you open appear here.</p>}</div>
      <button className="panel-cta" onClick={onRole}><Icon name="target" size={16} />{user.bimRole ? `Role: ${roleById(user.bimRole)?.title} — change` : "Set my role & suggested favourites"}</button>
    </>;
  } else if (section === "standards") body = <Groups items={filter(STANDARD_PAGES)} route={route} favs={favs} empty="No pages match." />;
  else if (section === "documents") body = <Groups items={filter(TEMPLATE_PAGES)} route={route} favs={favs} empty="No templates match." />;
  else if (section === "resources") body = <Groups items={filter(RESOURCE_PAGES)} route={route} favs={favs} empty="No pages match." />;
  else if (section === "projects") {
    body = <>
      <div className="panel-project">
        <select aria-label="Project" value={project?.id ?? ""} onChange={(e) => e.target.value === "__new" ? navigate("/projects/new") : navigate(`/projects/${e.target.value}/overview`)}>
          {!projects.length && <option value="">No projects yet</option>}
          {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          <option value="__new">+ New project…</option>
        </select>
      </div>
      {project ? <Groups items={filter(PROJECT_PAGES.filter((i) => i.key !== "p.settings" || canManage(project.role)))} route={route} projectId={project.id} favs={favs} empty="Nothing for this filter." />
        : <a className="panel-cta" href="#/projects/new"><Icon name="plus" size={16} />Create your first project</a>}
    </>;
  } else {
    body = <div className="help-body">
      <p><b>Search anything</b> — press <kbd>Ctrl</kbd> <kbd>K</kbd> (<kbd>⌘</kbd> <kbd>K</kbd> on Mac) to jump to any page, template or project.</p>
      <p><b>Favourites</b> — pin pages with ☆ Favourite; set your BIM role to get a starter list.</p>
      <p><b>Projects</b> are organised in hubs: Overview, Information (CDE), Delivery, Model & coordination, Quality & team.</p>
      <p><b>Roles</b> — viewers read and comment, editors create and edit, managers approve, publish and manage the team.</p>
      <p><b>Data entered once</b> — MIDP, TIDP, responsibility matrix and risk register documents are generated from their data.</p>
      <p style={{ marginBottom: 4 }}><b>Feedback & support</b> <a className="small" href="#/support">My requests</a></p>
      <SupportForm route={route} />
    </div>;
  }

  return (
    <aside className="panel no-print" aria-label={title}>
      <div className="panel-head"><h2>{t(title)}</h2><button className="icon-btn panel-close" onClick={onClose} aria-label="Close panel"><Icon name="close" size={16} /></button></div>
      {section !== "help" && <>
        <label className="search-box"><Icon name="search" size={15} /><input placeholder={t("Filter pages")} value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <div className="focus-row"><span>{t("Focus")}</span>
          <select value={focus} onChange={(e) => setFocus(e.target.value)} aria-label="Focus by role">
            <option value="all">{t("All roles")}</option>{BIM_ROLES.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select></div>
      </>}
      <div className="panel-body">{body}</div>
    </aside>
  );
}

// ---------------------------------------------------------------- command palette

function CommandPalette({ projects, project, onClose }: { projects: Project[]; project?: Project; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const results = useMemo(() => {
    const items: { label: string; sub: string; href: string; icon: NavItem["icon"] }[] = [
      ...projects.map((p) => ({ label: `${p.code} — ${p.name}`, sub: "Project", href: `/projects/${p.id}/overview`, icon: "folder" as const })),
      ...ALL_PAGES.filter((x) => x.scope === "global" || project).map((x) => ({ label: x.label, sub: x.scope === "project" ? `${project!.code} · ${x.group}` : x.group, href: hrefFor(x, project?.id), icon: x.icon })),
    ];
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((x) => terms.every((t) => (x.label + " " + x.sub).toLowerCase().includes(t))).slice(0, 12);
  }, [q, projects, project]);
  const go = (href: string) => { onClose(); navigate(href); };
  return (
    <div className="modal-bg palette-bg" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
        <label className="palette-input"><Icon name="search" size={18} /><input ref={input} value={q} placeholder="Search sections, tools, templates, projects…" onChange={(e) => { setQ(e.target.value); setI(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setI((n) => Math.min(n + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setI((n) => Math.max(n - 1, 0)); }
            if (e.key === "Enter" && results[i]) go(results[i].href);
            if (e.key === "Escape") onClose();
          }} /><kbd>Esc</kbd></label>
        <div className="palette-list">
          {results.map((r, n) => (
            <button key={r.href + r.label} className={"palette-item" + (n === i ? " on" : "")} onMouseEnter={() => setI(n)} onClick={() => go(r.href)}>
              <Icon name={r.icon} size={16} /><span>{r.label}</span><small>{r.sub}</small>
            </button>
          ))}
          {!results.length && <p className="panel-empty">Nothing matches "{q}".</p>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Ask AI

function AskAi({ onClose, route }: { onClose: () => void; route: string }) {
  const projectId = /^\/projects\/([0-9a-f-]{36})/.exec(route)?.[1];
  const [q, setQ] = useState("");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  // Quick answers from the knowledge base; project questions go to the project assistant.
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const out: { title: string; text: string; href: string }[] = [];
    for (const c of process19650) for (const k of c.children ?? []) if ((k.id + k.title + k.summary).toLowerCase().includes(t)) out.push({ title: `ISO 19650-2 ${k.id} ${k.title}`, text: k.summary, href: "/knowledge/iso19650/library/1" });
    for (const c of clauses42001) for (const k of c.children ?? []) if ((k.id + k.title + k.summary).toLowerCase().includes(t)) out.push({ title: `ISO/IEC 42001 ${k.id} ${k.title}`, text: k.summary, href: "/knowledge/iso42001/library/0" });
    for (const g of [...glossary19650, ...glossary42001]) if ((g.term + (g.abbr ?? "") + g.definition).toLowerCase().includes(t)) out.push({ title: g.abbr ? `${g.abbr} — ${g.term}` : g.term, text: g.definition, href: glossary19650.includes(g) ? "/knowledge/iso19650/library/3" : "/knowledge/iso42001/library/3" });
    for (const x of TEMPLATE_PAGES) if ((x.label + (x.hint ?? "")).toLowerCase().includes(t)) out.push({ title: x.label, text: x.hint ?? "", href: x.path });
    return out.slice(0, 12);
  }, [q]);
  return (
    <div className="drawer-bg" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} aria-label="Ask AI">
        <div className="panel-head"><h2><Icon name="sparkles" size={18} /> Ask</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button></div>
        <label className="search-box"><Icon name="search" size={15} /><input autoFocus placeholder="e.g. TIDP, acceptance criteria, impact assessment" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        {projectId && enabled && <a className="btn primary" href={`#/projects/${projectId}/assistant`} onClick={onClose} style={{ margin: "4px 0 8px", display: "inline-block" }}>✨ Ask the project assistant about this project →</a>}
        <p className="tiny muted">{enabled ? "Results below come from the built-in ISO knowledge base. Open a project to ask the AI assistant questions answered from its records." : "Results come from the built-in ISO knowledge base. The AI project assistant needs CLAUDE_API_KEY on the server."}</p>
        <div className="drawer-results">
          {hits.map((h) => <a key={h.title + h.href} className="answer" href={"#" + h.href} onClick={onClose}><b>{h.title}</b><span>{h.text}</span></a>)}
          {q.trim().length >= 2 && !hits.length && <p className="panel-empty">No match in the knowledge base. Try another term.</p>}
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------- role picker

export function RolePicker({ onClose }: { onClose: () => void }) {
  const { user, setUser, toast } = useSession();
  const [pick, setPick] = useState<string | null>(user.bimRole);
  const apply = async () => {
    const role = roleById(pick);
    if (!role) return;
    const favourites = [...new Set([...(user.favourites ?? []), ...role.tools])];
    try { const r = await api<{ user: typeof user }>("/profile", { method: "PUT", body: { bimRole: role.id, favourites } }); setUser(r.user); toast(`Favourites built for ${role.title}`); onClose(); }
    catch (e) { toast((e as Error).message, "error"); }
  };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="role-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="role-title">
        <div className="role-icon"><Icon name="target" size={26} /></div>
        <h2 id="role-title">What is your BIM role?</h2>
        <p className="muted">Select your job description to get a personalised Favourites list with the most relevant tools for your role.</p>
        <div className="role-grid" role="radiogroup">
          {BIM_ROLES.map((r) => (
            <button key={r.id} role="radio" aria-checked={pick === r.id} className={"role-card" + (pick === r.id ? " on" : "")} onClick={() => setPick(r.id)}>
              <span className="role-radio" />
              <span className="role-card-icon"><Icon name={r.icon} size={20} /></span>
              <b>{r.title}</b>
              <span className="role-desc">{r.description}</span>
              <span className="chip">{r.tools.length} tools</span>
            </button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
          <button className="primary" disabled={!pick} onClick={apply}><Icon name="sparkles" size={16} /> Apply & build my favourites</button>
          <button onClick={onClose}>Skip for now</button>
        </div>
        <p className="tiny muted" style={{ textAlign: "center" }}>You can change this any time from Home, using "Set my role".</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- shell

function Bell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const load = useCallback(() => api<{ notifications: Notification[] }>("/notifications").then((r) => setItems(r.notifications)).catch(() => undefined), []);
  useEffect(() => { load(); const t = setInterval(load, 20_000); return () => clearInterval(t); }, [load]);
  const unread = items.filter((n) => !n.read).length;
  return (
    <div style={{ position: "relative" }}>
      <button className="icon-btn" onClick={() => setOpen(!open)} aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}><Icon name="bell" />{unread > 0 && <span className="dot">{unread}</span>}</button>
      {open && (
        <div className="popover">
          <div className="row spread"><b>Notifications</b>{unread > 0 && <button className="ghost small" onClick={() => api("/notifications/read", { body: {} }).then(load)}>Mark all read</button>}</div>
          {items.length === 0 && <p className="muted small">Nothing yet.</p>}
          {items.map((n) => (
            <a key={n.id} href={"#" + n.link} className={"notif" + (n.read ? "" : " unread")} onClick={() => { setOpen(false); if (!n.read) api("/notifications/read", { body: { ids: [n.id] } }).then(load); }}>
              <div>{n.message}</div><div className="small muted">{new Date(n.createdAt).toLocaleString()}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({ onRole, theme, setTheme }: { onRole: () => void; theme: string; setTheme: (t: string) => void }) {
  const { user, setUser } = useSession();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button className="avatar-btn" onClick={() => setOpen(!open)} aria-label="Account menu"><span className="avatar">{initials(user.name)}</span><Icon name="chevron" size={14} /></button>
      {open && <div className="popover menu" onClick={() => setOpen(false)}>
        <div className="menu-head"><b>{user.name}</b><span className="tiny muted">{user.email}</span>{user.bimRole && <span className="chip">{roleById(user.bimRole)?.title}</span>}</div>
        <a href="#/profile"><Icon name="user" size={16} />{t("My profile")}</a>
        <a href="#/my-day"><Icon name="calendar" size={16} />{t("My Day")}</a>
        <a href="#/billing"><Icon name="table" size={16} />{t("Plan & billing")}</a>
        {user.role === "admin" && <a href="#/admin"><Icon name="settings" size={16} />{t("Admin console")}</a>}
        <button onClick={onRole}><Icon name="target" size={16} />{t("Set my role")}</button>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><Icon name={theme === "dark" ? "sun" : "moon"} size={16} />{t(theme === "dark" ? "Light theme" : "Dark theme")}</button>
        <button onClick={async () => { await api("/auth/logout", { body: {} }); setUser(null); navigate("/"); }}><Icon name="logout" size={16} />{t("Sign out")}</button>
      </div>}
    </div>
  );
}

function FavouriteToggle({ item }: { item: NavItem }) {
  const { user, setUser, toast } = useSession();
  const on = (user.favourites ?? []).includes(item.key);
  return (
    <button className={"fav-btn" + (on ? " on" : "")} aria-pressed={on} onClick={async () => {
      const favourites = on ? (user.favourites ?? []).filter((k) => k !== item.key) : [...(user.favourites ?? []), item.key];
      try { const r = await api<{ user: typeof user }>("/profile", { method: "PUT", body: { favourites } }); setUser(r.user); toast(on ? "Removed from Favourites" : "Added to Favourites"); }
      catch (e) { toast((e as Error).message, "error"); }
    }}><Icon name="star" size={15} />{t("Favourite")}</button>
  );
}

export default function Shell({ route, children }: { route: string; children: ReactNode }) {
  const { user } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [section, setSection] = useState(() => sectionFor(route));
  const [panelOpen, setPanelOpen] = useState(() => store.get(`bim:panel:${user.id}`, true));
  const [palette, setPalette] = useState(false);
  const [ask, setAsk] = useState(false);
  const [rolePicker, setRolePicker] = useState(() => !user.bimRole && !store.get(`bim:role-skipped:${user.id}`, false));
  const [theme, setThemeState] = useState(() => store.get("bim:theme", "dark"));
  const setTheme = (t: string) => { setThemeState(t); store.set("bim:theme", t); };
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => store.set(`bim:panel:${user.id}`, panelOpen), [panelOpen, user.id]);

  const loadProjects = useCallback(() => api<{ projects: Project[] }>("/projects").then((r) => setProjects(r.projects)).catch(() => undefined), []);
  useEffect(() => { loadProjects(); }, [loadProjects, route.split("/")[2]]);
  const project = useCurrentProject(route, projects, user.id);

  // Follow navigation: open the matching panel section and record the visit.
  useEffect(() => {
    setSection(sectionFor(route));
    const label = labelForRoute(route);
    if (label) {
      const proj = /^\/projects\/([^/]+)/.exec(route)?.[1];
      const p = projects.find((x) => x.id === proj);
      recordRecent(user.id, route, p ? `${label} · ${p.code}` : label);
    }
  }, [route, user.id, projects]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(true); } };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const pageItem = useMemo(() => {
    const proj = /^\/projects\/[^/]+\/(.+)$/.exec(route)?.[1];
    if (proj) return PROJECT_PAGES.find((x) => proj === x.path || (proj.startsWith(x.path + "/") && !/^documents\//.test(proj)));
    return ALL_PAGES.find((x) => x.scope === "global" && route === x.path);
  }, [route]);

  const openSection = (id: string) => { if (id === section && panelOpen) setPanelOpen(false); else { setSection(id); setPanelOpen(true); } };
  const badge = project?.standards?.length === 2 ? "ISO 19650 · 42001" : project?.standards?.[0] === "iso42001" ? "ISO/IEC 42001" : "ISO 19650";

  return (
    <div className={"shell" + (panelOpen ? "" : " panel-hidden")}>
      <header className="appbar no-print">
        <a className="brand-mark" href="#/"><span className="brand-logo"><Icon name="building" size={18} /></span><b>BIM Management</b></a>
        <span className="std-badge">{badge}</span>
        {user.organization && <span className="org-chip" title="Your organization">{user.organization}</span>}
        <button className="global-search" onClick={() => setPalette(true)}><Icon name="search" size={16} /><span>{t("Search sections, tools, topics…")}</span><kbd>Ctrl K</kbd></button>
        <span className="appbar-spacer" />
        <button className="ask-btn" onClick={() => setAsk(true)}><Icon name="sparkles" size={16} /><span>{t("Ask AI")}</span></button>
        <Bell />
        <UserMenu onRole={() => setRolePicker(true)} theme={theme} setTheme={setTheme} />
      </header>
      <nav className="rail no-print" aria-label="Sections">
        {RAIL.map((s) => (
          <button key={s.id} className={"rail-btn" + (section === s.id && panelOpen ? " on" : section === s.id ? " cur" : "")} onClick={() => openSection(s.id)}>
            <span className="rail-icon"><Icon name={s.icon} size={18} /></span>{t(s.label)}
          </button>
        ))}
        <span className="rail-spacer" />
        <button className={"rail-btn" + (section === "help" && panelOpen ? " on" : "")} onClick={() => openSection("help")}><span className="rail-icon"><Icon name="help" size={18} /></span>{t("Help")}</button>
        <button className="rail-btn" onClick={() => setPanelOpen(!panelOpen)}><span className="rail-icon"><Icon name="panel" size={18} /></span>{t(panelOpen ? "Hide" : "Show")}</button>
      </nav>
      {panelOpen && <Panel section={section} route={route} projects={projects} project={project} onRole={() => setRolePicker(true)} onClose={() => setPanelOpen(false)} />}
      <main className="stage">
        {pageItem && <div className="page-tools no-print"><FavouriteToggle item={pageItem} /></div>}
        {children}
      </main>
      {palette && <CommandPalette projects={projects} project={project} onClose={() => setPalette(false)} />}
      {ask && <AskAi route={route} onClose={() => setAsk(false)} />}
      {rolePicker && <RolePicker onClose={() => { setRolePicker(false); store.set(`bim:role-skipped:${user.id}`, true); }} />}
    </div>
  );
}
