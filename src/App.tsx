import { createContext, useContext, useEffect, useState } from "react";
import { usePersistent, type PortalDocument, type WorkflowProgress } from "./lib/store";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Workflows from "./pages/Workflows";
import Templates from "./pages/Templates";
import Builder from "./pages/Builder";
import Register from "./pages/Register";
import NamingTool from "./pages/NamingTool";
import References from "./pages/References";

interface PortalState {
  docs: PortalDocument[];
  setDocs: (fn: (d: PortalDocument[]) => PortalDocument[]) => void;
  progress: Record<string, WorkflowProgress>;
  setProgress: (fn: (p: Record<string, WorkflowProgress>) => Record<string, WorkflowProgress>) => void;
  user: string;
  setUser: (u: string) => void;
}

const Ctx = createContext<PortalState>(null!);
export const usePortal = () => useContext(Ctx);

export const navigate = (path: string) => (window.location.hash = path);

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
  { group: "Overview", items: [["/", "Dashboard"]] },
  { group: "ISO 19650 — BIM", items: [["/library/iso19650", "Knowledge library"], ["/workflow/iso19650", "Delivery workflow"], ["/templates/iso19650", "Templates"], ["/naming", "Naming & status codes"]] },
  { group: "ISO/IEC 42001 — AI", items: [["/library/iso42001", "Knowledge library"], ["/workflow/iso42001", "AIMS workflow"], ["/templates/iso42001", "Templates"]] },
  { group: "Documents", items: [["/register", "Document register (CDE)"], ["/references", "References"]] },
];

export default function App() {
  const route = useRoute();
  const [docs, setDocs] = usePersistent<PortalDocument[]>("docs", []);
  const [progress, setProgress] = usePersistent<Record<string, WorkflowProgress>>("progress", {});
  const [user, setUser] = usePersistent<string>("user", "");
  const [menu, setMenu] = useState(false);

  const [, page, arg] = route.split("/");
  let view;
  switch (page) {
    case "library": view = <Library std={arg === "iso42001" ? "iso42001" : "iso19650"} />; break;
    case "workflow": view = <Workflows std={arg === "iso42001" ? "iso42001" : "iso19650"} />; break;
    case "templates": view = <Templates std={arg as never} />; break;
    case "builder": view = <Builder docId={arg} />; break;
    case "register": view = <Register />; break;
    case "naming": view = <NamingTool />; break;
    case "references": view = <References />; break;
    default: view = <Dashboard />;
  }

  return (
    <Ctx.Provider value={{ docs, setDocs, progress, setProgress, user, setUser }}>
      <div className="layout">
        <aside className={"sidebar no-print" + (menu ? " open" : "")} onClick={() => setMenu(false)}>
          <div className="brand">ISO Information Portal<span>ISO 19650 · ISO/IEC 42001</span></div>
          <nav className="nav">
            {NAV.map((g) => (
              <div key={g.group}>
                <div className="nav-group">{g.group}</div>
                {g.items.map(([href, label]) => (
                  <a key={href} href={"#" + href} className={route === href ? "active" : ""}>{label}</a>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <main className="main">
          <button className="menu-btn no-print" onClick={() => setMenu(true)}>☰ Menu</button>
          {view}
        </main>
      </div>
    </Ctx.Provider>
  );
}
