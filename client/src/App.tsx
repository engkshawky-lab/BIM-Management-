import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type Notification, type User } from "./lib/api";
import Home from "./pages/Home";
import Library from "./pages/Library";
import Login from "./pages/Login";
import NamingTool from "./pages/NamingTool";
import ProfilePage from "./pages/Profile";
import ProjectPage from "./pages/Project";
import NewProject from "./pages/NewProject";
import References from "./pages/References";
import Templates from "./pages/Templates";

interface Session { user: User; setUser: (u: User | null) => void; toast: (msg: string, kind?: "ok" | "error") => void }
const Ctx = createContext<Session>(null!);
export const useSession = () => useContext(Ctx);

export const navigate = (path: string) => { window.location.hash = path; };

function useRoute() {
  const get = () => window.location.hash.replace(/^#/, "") || "/";
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => { setRoute(get()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

const NAV: { group: string; items: [string, string][] }[] = [
  { group: "Workspace", items: [["/", "My projects"], ["/projects/new", "New project"], ["/profile", "My profile"]] },
  { group: "ISO 19650 — BIM", items: [["/library/iso19650", "Knowledge library"], ["/templates/iso19650", "Templates"], ["/naming", "Naming & status codes"]] },
  { group: "ISO/IEC 42001 — AI", items: [["/library/iso42001", "Knowledge library"], ["/templates/iso42001", "Templates"]] },
  { group: "Resources", items: [["/references", "References"]] },
];

function Bell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const load = useCallback(() => api<{ notifications: Notification[] }>("/notifications").then((r) => setItems(r.notifications)).catch(() => undefined), []);
  useEffect(() => { load(); const t = setInterval(load, 20_000); return () => clearInterval(t); }, [load]);
  const unread = items.filter((n) => !n.read).length;
  return (
    <div style={{ position: "relative" }}>
      <button className="ghost" onClick={() => setOpen(!open)} aria-label="Notifications">🔔{unread > 0 && <span className="dot">{unread}</span>}</button>
      {open && (
        <div className="popover">
          <div className="row spread"><b>Notifications</b>{unread > 0 && <button className="ghost small" onClick={() => api("/notifications/read", { body: {} }).then(load)}>Mark all read</button>}</div>
          {items.length === 0 && <p className="muted small">Nothing yet.</p>}
          {items.map((n) => (
            <a key={n.id} href={"#" + n.link} className={"notif" + (n.read ? "" : " unread")}
              onClick={() => { setOpen(false); if (!n.read) api("/notifications/read", { body: { ids: [n.id] } }).then(load); }}>
              <div>{n.message}</div><div className="small muted">{new Date(n.createdAt).toLocaleString()}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [menu, setMenu] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const toast = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  useEffect(() => { api<{ user: User | null }>("/auth/me").then((r) => setUser(r.user)).catch(() => setUser(null)); }, []);

  if (user === undefined) return <div className="center muted">Loading…</div>;
  if (!user) return <Login onSignedIn={setUser} />;

  const parts = route.split("/").filter(Boolean);
  let view;
  if (parts[0] === "projects" && parts[1] === "new") view = <NewProject />;
  else if (parts[0] === "projects" && parts[1]) view = <ProjectPage projectId={parts[1]} tab={parts[2] ?? "overview"} sub={parts[3]} />;
  else if (parts[0] === "library") view = <Library std={parts[1] === "iso42001" ? "iso42001" : "iso19650"} />;
  else if (parts[0] === "templates") view = <Templates std={parts[1] === "iso42001" ? "iso42001" : parts[1] === "iso19650" ? "iso19650" : undefined} />;
  else if (parts[0] === "naming") view = <NamingTool />;
  else if (parts[0] === "references") view = <References />;
  else if (parts[0] === "profile") view = <ProfilePage />;
  else view = <Home />;

  const signOut = async () => { await api("/auth/logout", { body: {} }); setUser(null); navigate("/"); };

  return (
    <Ctx.Provider value={{ user, setUser, toast }}>
      <div className="layout">
        <aside className={"sidebar no-print" + (menu ? " open" : "")} onClick={() => setMenu(false)}>
          <div className="brand">ISO Information Portal<span>ISO 19650 · ISO/IEC 42001</span></div>
          <nav className="nav">
            {NAV.map((g) => (
              <div key={g.group}>
                <div className="nav-group">{g.group}</div>
                {g.items.map(([href, label]) => <a key={href} href={"#" + href} className={route === href ? "active" : ""}>{label}</a>)}
              </div>
            ))}
          </nav>
        </aside>
        <div className="content">
          <header className="topbar no-print">
            <button className="menu-btn" onClick={() => setMenu(true)}>☰</button>
            <span style={{ flex: 1 }} />
            <Bell />
            <a href="#/profile" className="user-chip"><span className="avatar">{initials(user.name)}</span><span className="hide-sm">{user.name}</span></a>
            <button className="ghost small" onClick={signOut}>Sign out</button>
          </header>
          <main className="main">{view}</main>
        </div>
      </div>
      <div className="toasts">{toasts.map((t) => <div key={t.id} className={"toast " + t.kind}>{t.msg}</div>)}</div>
    </Ctx.Provider>
  );
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
