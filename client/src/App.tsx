import ClientStandards from "./pages/ClientStandards";
import Learn from "./pages/Learn";
import Admin from "./pages/Admin";
import { MyDay, Portfolio, Tools } from "./pages/Dashboards";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type User } from "./lib/api";
import Shell from "./shell/Shell";
import Home from "./pages/Home";
import Knowledge from "./pages/Knowledge";
import Login, { ResetPassword } from "./pages/Login";
import ProfilePage from "./pages/Profile";
import ProjectPage from "./pages/Project";
import NewProject from "./pages/NewProject";

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

export default function App() {
  const route = useRoute();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const toast = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  useEffect(() => { api<{ user: User | null }>("/auth/me").then((r) => setUser(r.user)).catch(() => setUser(null)); }, []);

  if (user === undefined) return <div className="center muted">Loading…</div>;
  const reset = /^\/reset\/([0-9a-f]{64})$/.exec(route)?.[1];
  if (reset) return <ResetPassword token={reset} />;
  if (!user) return <Login onSignedIn={setUser} />;

  const parts = route.split("/").filter(Boolean);
  let view;
  if (parts[0] === "projects" && parts[1] === "new") view = <NewProject />;
  else if (parts[0] === "projects" && parts[1]) view = <ProjectPage projectId={parts[1]} tab={parts[2] ?? "overview"} sub={parts[3]} />;
  else if (parts[0] === "projects") view = <Home projectsOnly />;
  else if (parts[0] === "knowledge") view = <Knowledge std={parts[1] === "iso42001" ? "iso42001" : "iso19650"} section={parts[2]} arg={parts[3]} />;
  // legacy links into the separate knowledge pages
  else if (["library", "templates"].includes(parts[0])) view = <Knowledge std={parts[1] === "iso42001" ? "iso42001" : "iso19650"} section={parts[0]} />;
  else if (["naming", "references"].includes(parts[0])) view = <Knowledge std="iso19650" section={parts[0]} />;
  else if (parts[0] === "admin") view = <Admin tab={parts[1]} />;
  else if (parts[0] === "learn") view = <Learn />;
  else if (parts[0] === "my-day") view = <MyDay />;
  else if (parts[0] === "portfolio") view = <Portfolio />;
  else if (parts[0] === "tools") view = <Tools tool={parts[1]} />;
  else if (parts[0] === "standards") view = <ClientStandards id={parts[1]} />;
  else if (parts[0] === "profile") view = <ProfilePage />;
  else view = <Home />;

  return (
    <Ctx.Provider value={{ user, setUser, toast }}>
      <Shell route={route}>{view}</Shell>
      <div className="toasts">{toasts.map((t) => <div key={t.id} className={"toast " + t.kind}>{t.msg}</div>)}</div>
    </Ctx.Provider>
  );
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
