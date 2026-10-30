import ClientStandards from "./pages/ClientStandards";
import { setLocale, type Locale } from "./i18n";
import { applyDomLocale } from "./i18nDom";
import Learn from "./pages/Learn";
import Admin from "./pages/Admin";
import Billing from "./pages/Billing";
import { MyTalentProfile, TalentSearch } from "./pages/Talent";
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
import { AdoptionGuide, GuidesPage } from "./pages/LearnGuides";
import SetupWizard from "./pages/SetupWizard";
import Support from "./pages/Support";
import AiTools from "./pages/AiTools";
import PartsHub from "./pages/PartsHub";
import { DownloadsLibrary, NewsFeed, SampleDocuments } from "./pages/Resources";
import HubPage, { HubsIndex } from "./pages/HubPage";
import ModelTools from "./pages/ModelTools";
import ProjectDataPage from "./pages/ProjectData";
import NamingCheck from "./pages/NamingCheck";
import Workflow from "./pages/Workflow";
import DocGuides from "./pages/DocGuides";
import { hubById, hubs } from "../../shared/data/hubs";

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

  // Arabic page content: start/stop the translation layer when the language changes
  const loc = ((user?.locale ?? (() => { try { return localStorage.getItem("bim:locale"); } catch { return null; } })()) === "ar" ? "ar" : "en");
  const [, setI18nReady] = useState(0);
  // re-render once the dictionary has loaded so directly translated content (lessons) updates too
  useEffect(() => { if (user !== undefined) applyDomLocale(loc).then(() => setI18nReady((n) => n + 1)); }, [loc, user === undefined]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api<{ user: User | null }>("/auth/me").then((r) => setUser(r.user)).catch(() => setUser(null)); }, []);

  // interface language: the account setting, or the choice made on the sign-in page
  const stored = (() => { try { return localStorage.getItem("bim:locale"); } catch { return null; } })();
  const locale = ((user?.locale ?? stored) === "ar" ? "ar" : "en") as Locale;
  setLocale(locale);
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
  else if (parts[0] === "billing") view = <Billing key={parts[1] ?? ""} paid={parts[1] === "paid"} />;
  else if (parts[0] === "talent") view = parts[1] === "me" ? <MyTalentProfile /> : <TalentSearch />;
  else if (parts[0] === "admin") view = <Admin tab={parts[1]} />;
  else if (parts[0] === "learn" && parts[1] === "guides") view = <GuidesPage key={parts[2] ?? ""} id={parts[2]} />;
  else if (parts[0] === "learn" && parts[1] === "adoption") view = <AdoptionGuide />;
  else if (parts[0] === "learn") view = <Learn />;
  else if (parts[0] === "wizard") view = <SetupWizard />;
  else if (parts[0] === "support") view = <Support />;
  else if (parts[0] === "my-day") view = <MyDay />;
  else if (parts[0] === "portfolio") view = <Portfolio />;
  else if (parts[0] === "tools" && parts[1] === "naming-check") view = <NamingCheck />;
  else if (parts[0] === "tools") view = <Tools tool={parts[1]} />;
  else if (parts[0] === "ai-tools") view = <AiTools tool={parts[1]} arg={parts[2]} arg2={parts[3]} />;
  else if (parts[0] === "hubs" && hubById(parts[1] ?? "")) view = <HubPage hub={hubById(parts[1])!} sectionId={parts[2]} tabId={parts[3]} />;
  else if (parts[0] === "hubs") view = <HubsIndex hubs={hubs} focus={parts[1] === "theme" ? parts[2] : undefined} />;
  else if (parts[0] === "doc-guides") view = <DocGuides key={parts[1] ?? ""} id={parts[1]} />;
  else if (parts[0] === "workflow") view = <Workflow key={parts[1] ?? ""} tab={parts[1]} arg={parts[2]} />;
  else if (parts[0] === "project-data") view = <ProjectDataPage />;
  else if (parts[0] === "model-tools") view = <ModelTools tool={parts[1]} />;
  else if (parts[0] === "downloads") view = <DownloadsLibrary />;
  else if (parts[0] === "news") view = <NewsFeed />;
  else if (parts[0] === "samples") view = <SampleDocuments />;
  else if (parts[0] === "parts") view = <PartsHub key={parts[1] ?? ""} partId={parts[1]} tab={parts[2]} />;
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
