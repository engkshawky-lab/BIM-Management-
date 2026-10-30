import { t } from "../i18n";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { initials, navigate, useSession } from "../App";
import { glossary19650, process19650 } from "../../../shared/data/iso19650";
import { clauses42001, glossary42001 } from "../../../shared/data/iso42001";
import { api, canManage, type Notification, type Project } from "../lib/api";
import { Icon } from "./icons";
import { ALL_PAGES, PROJECT_PAGES, SECTIONS, TEMPLATE_PAGES, groupsOf, hrefFor, labelForRoute, locate, pageByKey, type NavItem } from "./nav";
import { BIM_ROLES, roleById } from "./roles";

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

/** Project currently open, or the last one used, so project pages in the sidebar and favourites resolve. */
export function useCurrentProject(route: string, projects: Project[], uid: string) {
  const inRoute = /^\/projects\/([0-9a-f-]{36})/.exec(route)?.[1];
  useEffect(() => { if (inRoute) store.set(`bim:project:${uid}`, inRoute); }, [inRoute, uid]);
  const id = inRoute ?? store.get<string | null>(`bim:project:${uid}`, null);
  return projects.find((p) => p.id === id) ?? projects[0];
}

// ---------------------------------------------------------------- sidebar

function NavItemLink({ item, projectId, route, fav }: { item: NavItem; projectId?: string; route: string; fav?: boolean }) {
  const href = hrefFor(item, projectId);
  // only the closest menu page lights up (/hubs/loin is the LOIN hub, not "All topic hubs")
  const on = locate(route).item?.key === item.key && (item.scope === "global" || route.startsWith(href));
  return (
    <a className={"sb-item" + (on ? " on" : "")} href={"#" + href} aria-current={on ? "page" : undefined}>
      <Icon name={item.icon} size={16} />
      <span className="sb-item-text"><b>{t(item.label)}</b>{item.hint && <small>{t(item.hint)}</small>}</span>
      {fav && <Icon name="star" size={11} className="fav-mark" />}
    </a>
  );
}

/** Pages under step headings: "01 · Create" in workflow sections, plain headings elsewhere. */
function Steps({ items, numbered, route, projectId, favs }: { items: NavItem[]; numbered?: boolean; route: string; projectId?: string; favs: Set<string> }) {
  const groups = groupsOf(items);
  return <>{groups.map((gname, n) => (
    <div key={gname} className="sb-step">
      {(groups.length > 1 || numbered) && <div className="sb-step-title">{numbered && <span>{String(n + 1).padStart(2, "0")}.</span>}{t(gname)}</div>}
      {items.filter((i) => i.group === gname).map((i) => <NavItemLink key={i.key} item={i} projectId={projectId} route={route} fav={favs.has(i.key)} />)}
    </div>
  ))}</>;
}

function SectionHead({ icon, label, count, open, onClick }: { icon: NavItem["icon"]; label: string; count: number; open: boolean; onClick: () => void }) {
  return (
    <button className={"sb-sec" + (open ? " open" : "")} aria-expanded={open} onClick={onClick}>
      <span className="sb-sec-icon"><Icon name={icon} size={16} /></span><b>{t(label)}</b><span className="sb-badge">{count}</span><Icon name="chevron" size={14} className={"sb-chev" + (open ? "" : " closed")} />
    </button>
  );
}

function Inbox() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const load = useCallback(() => api<{ notifications: Notification[] }>("/notifications").then((r) => setItems(r.notifications)).catch(() => undefined), []);
  useEffect(() => { load(); const t = setInterval(load, 20_000); return () => clearInterval(t); }, [load]);
  const unread = items.filter((n) => !n.read).length;
  return (
    <div className="sb-anchor">
      <button className="sb-mini" onClick={() => setOpen(!open)} aria-label={`Inbox${unread ? ` (${unread} unread)` : ""}`}><Icon name="bell" size={14} />{t("Inbox")}{unread > 0 && <span className="sb-count">{unread}</span>}</button>
      {open && (
        <div className="popover sb-pop">
          <div className="row spread"><b>{t("Inbox")}</b>{unread > 0 && <button className="ghost small" onClick={() => api("/notifications/read", { body: {} }).then(load)}>Mark all read</button>}</div>
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

function UserMenu({ onRole, theme, setTheme, onHide }: { onRole: () => void; theme: string; setTheme: (t: string) => void; onHide: () => void }) {
  const { user, setUser } = useSession();
  const [open, setOpen] = useState(false);
  return (
    <div className="sb-anchor sb-user-row">
      <button className="sb-user" onClick={() => setOpen(!open)} aria-label="Account menu">
        <span className="brand-logo"><Icon name="building" size={15} /></span>
        <span className="sb-user-text"><b>BIM Management</b><small>{user.organization || user.name}</small></span>
        <Icon name="chevron" size={12} />
      </button>
      <button className="icon-btn sb-hide" onClick={onHide} aria-label={t("Hide sidebar")} title={t("Hide sidebar")}><Icon name="panel" size={16} /></button>
      {open && <div className="popover menu sb-pop" onClick={() => setOpen(false)}>
        <div className="menu-head"><span className="row" style={{ gap: 8 }}><span className="avatar">{initials(user.name)}</span><b>{user.name}</b></span><span className="tiny muted">{user.email}</span>{user.bimRole && <span className="chip">{roleById(user.bimRole)?.title}</span>}</div>
        <a href="#/profile"><Icon name="user" size={16} />{t("My profile")}</a>
        <a href="#/billing"><Icon name="table" size={16} />{t("Plan & billing")}</a>
        {user.role === "admin" && <a href="#/admin"><Icon name="settings" size={16} />{t("Admin console")}</a>}
        <button onClick={onRole}><Icon name="target" size={16} />{t("Set my role")}</button>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><Icon name={theme === "dark" ? "sun" : "moon"} size={16} />{t(theme === "dark" ? "Light theme" : "Dark theme")}</button>
        <button onClick={async () => { await api("/auth/logout", { body: {} }); setUser(null); navigate("/"); }}><Icon name="logout" size={16} />{t("Sign out")}</button>
      </div>}
    </div>
  );
}

function Sidebar({ route, projects, project, onAsk, onRole, onHide, theme, setTheme }: {
  route: string; projects: Project[]; project?: Project; onAsk: () => void; onRole: () => void; onHide: () => void; theme: string; setTheme: (t: string) => void;
}) {
  const { user } = useSession();
  const favs = new Set(user.favourites ?? []);
  const where = locate(route);
  // One section open at a time; navigating opens the section of the new page.
  const [open, setOpen] = useState(where.section);
  useEffect(() => setOpen(where.section), [where.section]);
  const [q, setQ] = useState("");
  const [roleId, setRoleId] = useState<string>(() => store.get(`bim:focus:${user.id}`, "all"));
  useEffect(() => store.set(`bim:focus:${user.id}`, roleId), [roleId, user.id]);
  const [favOpen, setFavOpen] = useState<boolean>(() => store.get(`bim:favopen:${user.id}`, true));
  useEffect(() => store.set(`bim:favopen:${user.id}`, favOpen), [favOpen, user.id]);
  useEffect(() => {
    const t = setTimeout(() => document.querySelector(".sb-scroll .sb-item.on")?.scrollIntoView({ block: "nearest" }), 0);
    return () => clearTimeout(t);
  }, [route, open]);

  const role = roleById(roleId);
  const term = q.trim().toLowerCase();
  const found = (i: NavItem) => !term || [i.label, i.group, i.hint ?? "", t(i.label), t(i.group)].join(" ").toLowerCase().includes(term);
  const match = (i: NavItem) => found(i) && (!role || role.tools.includes(i.key));
  const filtering = !!term || !!role;

  const favItems = (user.favourites ?? []).map(pageByKey).filter((x): x is NavItem => !!x);
  const projectItems = project ? PROJECT_PAGES.filter((i) => (i.key !== "p.settings" || canManage(project.role)) && match(i)) : [];
  const toggle = (id: string) => setOpen((o) => (o === id ? "" : id));

  const section = (id: string, icon: NavItem["icon"], label: string, count: number, body: ReactNode) => {
    if (filtering && !count) return null;
    const isOpen = !!term || open === id;
    return <div key={id} className="sb-secwrap"><SectionHead icon={icon} label={label} count={count} open={isOpen} onClick={() => toggle(id)} />{isOpen && <div className="sb-sec-body">{body}</div>}</div>;
  };

  return (
    <aside className="sidebar no-print" aria-label="Main menu">
      <UserMenu onRole={onRole} theme={theme} setTheme={setTheme} onHide={onHide} />
      <div className="sb-top">
        <label className="sb-search"><Icon name="search" size={15} /><input placeholder={t("Search sections…")} value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button className="icon-btn" onClick={() => setQ("")} aria-label={t("Clear")}><Icon name="close" size={13} /></button>}</label>
        <div className="sb-quick">
          <button className="sb-mini" onClick={onAsk}><Icon name="sparkles" size={14} />{t("Ask AI")}</button>
          <Inbox />
        </div>
      </div>
      <nav className="sb-scroll">
        <div className="sb-secwrap">
          <button className={"sb-sec sb-fav" + (favOpen ? " open" : "")} aria-expanded={favOpen} onClick={() => setFavOpen(!favOpen)}>
            <span className="sb-sec-icon"><Icon name="star" size={16} /></span><b>{t("Favourites")}</b><span className="sb-badge">{favItems.length}</span><Icon name="chevron" size={14} className={"sb-chev" + (favOpen ? "" : " closed")} />
          </button>
          {favOpen && <div className="sb-sec-body">
            {favItems.filter(found).map((i) => <NavItemLink key={i.key} item={i} projectId={project?.id} route={route} />)}
            {!favItems.length && <p className="sb-empty">{t("Pin any page with ☆ at the top of the page to keep it here.")}</p>}
          </div>}
        </div>

        <div className="sb-roles">
          <div className="sb-label">{t("View by role")}</div>
          <div className="sb-chips">
            <button className={"sb-chip" + (!role ? " on" : "")} onClick={() => setRoleId("all")}>{t("All")}</button>
            {BIM_ROLES.map((r) => <button key={r.id} className={"sb-chip" + (roleId === r.id ? " on" : "")} title={r.title} onClick={() => setRoleId(roleId === r.id ? "all" : r.id)}>{t(r.short)}</button>)}
          </div>
          <button className="sb-role-cta" onClick={onRole}><Icon name="target" size={15} />{user.bimRole ? `${t("My role")}: ${roleById(user.bimRole)?.title}` : t("Set my role & auto-favourites")}</button>
        </div>

        {SECTIONS.flatMap((s) => {
          const items = s.id === "home" ? s.items.filter(found) : s.items.filter(match);
          const out = [section(s.id, s.icon, s.label, items.length, <Steps items={items} numbered={s.numbered} route={route} projectId={project?.id} favs={favs} />)];
          if (s.id === "home") out.push(section("projects", "folder", "Projects", project ? projectItems.length : projects.length, <>
            <div className="sb-project">
              <select aria-label="Project" value={project?.id ?? ""} onChange={(e) => e.target.value === "__new" ? navigate("/projects/new") : navigate(`/projects/${e.target.value}/overview`)}>
                {!projects.length && <option value="">{t("No projects yet")}</option>}
                {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                <option value="__new">{t("+ New project…")}</option>
              </select>
            </div>
            {project ? <Steps items={projectItems} numbered route={route} projectId={project.id} favs={favs} />
              : <a className="sb-item" href="#/projects/new"><Icon name="plus" size={16} /><span className="sb-item-text"><b>{t("Create your first project")}</b><small>{t("Holds your CDE, plan and team")}</small></span></a>}
          </>));
          return out;
        })}
        {filtering && <p className="sb-empty">{role && !term ? t("Showing the pages for this role. Choose All to see everything.") : ""}</p>}
      </nav>
      <div className="sb-foot">
        <a className={"sb-mini" + (route.startsWith("/support") ? " on" : "")} href="#/support"><Icon name="help" size={14} />{t("Help & support")}</a>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------- page bar (breadcrumbs + favourite)

function Crumbs({ route, projects }: { route: string; projects: Project[] }) {
  const where = locate(route);
  const parts: { label: string; href?: string }[] = [];
  if (where.section === "projects") {
    parts.push({ label: t("Projects"), href: "/projects" });
    const id = /^\/projects\/([0-9a-f-]{36})/.exec(route)?.[1];
    const p = projects.find((x) => x.id === id);
    if (p) parts.push({ label: p.code, href: `/projects/${p.id}/overview` });
    if (where.group) parts.push({ label: t(where.group) });
    if (where.item && p) parts.push({ label: t(where.item.label), href: hrefFor(where.item, p.id) });
  } else if (route === "/") parts.push({ label: t("Home") });
  else {
    parts.push({ label: t(where.sectionLabel), href: where.section === "home" ? "/" : undefined });
    if (where.group && where.group !== where.sectionLabel && where.group !== "Account") parts.push({ label: t(where.group) });
    if (where.item) parts.push({ label: t(where.item.label), href: where.item.path });
  }
  return (
    <nav className="pagebar-crumbs" aria-label="Breadcrumb">
      {parts.map((c, i) => <span key={i} className="crumb">{i > 0 && <span className="crumb-sep">/</span>}{c.href && (i < parts.length - 1 || route !== c.href) ? <a href={"#" + c.href}>{c.label}</a> : <span>{c.label}</span>}</span>)}
    </nav>
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
    }}><Icon name="star" size={14} />{t(on ? "Favourite" : "Add to favourites")}</button>
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
      ...ALL_PAGES.map((x) => ({ label: x.label, sub: x.scope === "project" ? (project ? `${project.code} · ${x.group}` : `${x.group} · open a project first`) : x.group, href: hrefFor(x, project?.id), icon: x.icon })),
    ];
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((x) => terms.every((t) => (x.label + " " + x.sub).toLowerCase().includes(t))).slice(0, 12);
  }, [q, projects, project]);
  const go = (href: string) => { onClose(); navigate(href); };
  return (
    <div className="modal-bg palette-bg" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
        <label className="palette-input"><Icon name="search" size={18} /><input ref={input} value={q} placeholder="Search pages, tools, templates, projects…" onChange={(e) => { setQ(e.target.value); setI(0); }}
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
          {!results.length && <p className="sb-empty">Nothing matches "{q}".</p>}
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
        {projectId && enabled && <a className="btn primary" href={`#/projects/${projectId}/assistant`} onClick={onClose} style={{ margin: "4px 16px 8px", display: "inline-block" }}>✨ Ask the project assistant about this project →</a>}
        <p className="tiny muted">{enabled ? "Results below come from the built-in ISO knowledge base. Open a project to ask the AI assistant questions answered from its records." : "Results come from the built-in ISO knowledge base. The AI project assistant needs CLAUDE_API_KEY on the server."}</p>
        <div className="drawer-results">
          {hits.map((h) => <a key={h.title + h.href} className="answer" href={"#" + h.href} onClick={onClose}><b>{h.title}</b><span>{h.text}</span></a>)}
          {q.trim().length >= 2 && !hits.length && <p className="sb-empty">No match in the knowledge base. Try another term.</p>}
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
        <p className="tiny muted" style={{ textAlign: "center" }}>You can change this any time from the account menu, using "Set my role".</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- shell

const narrow = () => window.matchMedia("(max-width: 900px)").matches;

export default function Shell({ route, children }: { route: string; children: ReactNode }) {
  const { user } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sidebar, setSidebar] = useState(() => store.get(`bim:sidebar:${user.id}`, true));
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [ask, setAsk] = useState(false);
  const [rolePicker, setRolePicker] = useState(false);
  const [theme, setThemeState] = useState(() => store.get("bim:theme", "dark"));
  const setTheme = (t: string) => { setThemeState(t); store.set("bim:theme", t); };
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => store.set(`bim:sidebar:${user.id}`, sidebar), [sidebar, user.id]);

  const loadProjects = useCallback(() => api<{ projects: Project[] }>("/projects").then((r) => setProjects(r.projects)).catch(() => undefined), []);
  useEffect(() => { loadProjects(); }, [loadProjects, route.split("/")[2]]);
  const project = useCurrentProject(route, projects, user.id);

  // Follow navigation: close the phone drawer, scroll to the top and record the visit.
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    setDrawer(false);
    main.current?.scrollTo({ top: 0 });
    const label = labelForRoute(route);
    if (label) {
      const proj = /^\/projects\/([^/]+)/.exec(route)?.[1];
      const p = projects.find((x) => x.id === proj);
      recordRecent(user.id, route, p ? `${label} · ${p.code}` : label);
    }
  }, [route, user.id, projects]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") { e.preventDefault(); if (narrow()) setDrawer((d) => !d); else setSidebar((s: boolean) => !s); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const pageItem = useMemo(() => {
    const proj = /^\/projects\/[^/]+\/(.+)$/.exec(route)?.[1];
    if (proj) return PROJECT_PAGES.find((x) => proj === x.path || (proj.startsWith(x.path + "/") && !/^documents\//.test(proj)));
    return ALL_PAGES.find((x) => x.scope === "global" && route === x.path) ?? locate(route).item;
  }, [route]);

  const showMenu = () => (narrow() ? setDrawer(true) : setSidebar(true));

  return (
    <div className={"shell" + (sidebar ? "" : " sb-hidden") + (drawer ? " sb-drawer" : "")}>
      <Sidebar route={route} projects={projects} project={project} theme={theme} setTheme={setTheme}
        onAsk={() => setAsk(true)} onRole={() => setRolePicker(true)} onHide={() => (narrow() ? setDrawer(false) : setSidebar(false))} />
      {drawer && <div className="sb-backdrop" onClick={() => setDrawer(false)} />}
      <main className="main" ref={main}>
        <div className="pagebar no-print">
          <button className="icon-btn sb-show" onClick={showMenu} aria-label={t("Show sidebar")} title={t("Show sidebar")}><Icon name="panel" size={16} /></button>
          <Crumbs route={route} projects={projects} />
          <span className="pagebar-spacer" />
          {pageItem && <FavouriteToggle item={pageItem} />}
        </div>
        <div className="page">{children}</div>
      </main>
      {palette && <CommandPalette projects={projects} project={project} onClose={() => setPalette(false)} />}
      {ask && <AskAi route={route} onClose={() => setAsk(false)} />}
      {rolePicker && <RolePicker onClose={() => { setRolePicker(false); store.set(`bim:role-skipped:${user.id}`, true); }} />}
    </div>
  );
}
