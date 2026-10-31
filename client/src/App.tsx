import { setLocale, type Locale } from "./i18n";
import { applyDomLocale } from "./i18nDom";
import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useState } from "react";
import { api, type User } from "./lib/api";
import Shell from "./shell/Shell";
const Home = lazy(() => import("./pages/Home"));
import Login, { ResetPassword } from "./pages/Login";

// Pages load on first visit, so the first download holds only the shell, sign-in and home page.
const ClientStandards = lazy(() => import("./pages/ClientStandards"));
const Learn = lazy(() => import("./pages/Learn"));
const Admin = lazy(() => import("./pages/Admin"));
const Billing = lazy(() => import("./pages/Billing"));
const MyTalentProfile = lazy(() => import("./pages/Talent").then((m) => ({ default: m.MyTalentProfile })));
const TalentSearch = lazy(() => import("./pages/Talent").then((m) => ({ default: m.TalentSearch })));
const MyDay = lazy(() => import("./pages/Dashboards").then((m) => ({ default: m.MyDay })));
const Portfolio = lazy(() => import("./pages/Dashboards").then((m) => ({ default: m.Portfolio })));
const Tools = lazy(() => import("./pages/Dashboards").then((m) => ({ default: m.Tools })));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const ProjectPage = lazy(() => import("./pages/Project"));
const NewProject = lazy(() => import("./pages/NewProject"));
const AdoptionGuide = lazy(() => import("./pages/LearnGuides").then((m) => ({ default: m.AdoptionGuide })));
const GuidesPage = lazy(() => import("./pages/LearnGuides").then((m) => ({ default: m.GuidesPage })));
const SetupWizard = lazy(() => import("./pages/SetupWizard"));
const Support = lazy(() => import("./pages/Support"));
const AiTools = lazy(() => import("./pages/AiTools"));
const PartsHub = lazy(() => import("./pages/PartsHub"));
const DownloadsLibrary = lazy(() => import("./pages/Resources").then((m) => ({ default: m.DownloadsLibrary })));
const NewsFeed = lazy(() => import("./pages/Resources").then((m) => ({ default: m.NewsFeed })));
const SampleDocuments = lazy(() => import("./pages/Resources").then((m) => ({ default: m.SampleDocuments })));
const ModelTools = lazy(() => import("./pages/ModelTools"));
const ProjectDataPage = lazy(() => import("./pages/ProjectData"));
const NamingCheck = lazy(() => import("./pages/NamingCheck"));
const Workflow = lazy(() => import("./pages/Workflow"));
const DocGuides = lazy(() => import("./pages/DocGuides"));
const BimTools = lazy(() => import("./pages/BimTools"));
const AiStudio = lazy(() => import("./pages/AiStudio"));
const PlatformGuide = lazy(() => import("./pages/PlatformGuide"));
const Connectors = lazy(() => import("./pages/Connectors"));
const Glossary = lazy(() => import("./pages/Glossary"));
const Videos = lazy(() => import("./pages/Videos"));
const LearningPaths = lazy(() => import("./pages/LearningPaths"));
const HubRoute = lazy(() => import("./pages/HubRoute"));
const Legal = lazy(() => import("./pages/Legal"));

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
  // legal pages are public, so they can be read before signing up
  const legal = /^\/legal(?:\/([a-z]+))?$/.exec(route);
  if (!user && legal) return <Suspense fallback={<div className="center muted">Loading…</div>}><Legal standalone id={legal[1]} /></Suspense>;
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
  else if (parts[0] === "hubs") view = <HubRoute id={parts[1]} sectionId={parts[2]} tabId={parts[3]} />;
  else if (parts[0] === "glossary") view = <Glossary q={parts[1] ? decodeURIComponent(parts[1]) : undefined} />;
  else if (parts[0] === "learning-paths") view = <LearningPaths key={parts[1] ?? ""} id={parts[1]} />;
  else if (parts[0] === "videos") view = <Videos topic={parts[1]} />;
  else if (parts[0] === "connectors") view = <Connectors tab={parts[1]} />;
  else if (parts[0] === "guide") view = <PlatformGuide tab={parts[1]} />;
  else if (parts[0] === "ai-studio") view = <AiStudio tool={parts[1]} />;
  else if (parts[0] === "bim-tools") view = <BimTools tool={parts[1]} />;
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
  else if (parts[0] === "legal") view = <Legal id={parts[1]} />;
  else view = <Home />;

  return (
    <Ctx.Provider value={{ user, setUser, toast }}>
      <Shell route={route}><Suspense fallback={<div className="center muted">Loading…</div>}>{view}</Suspense></Shell>
      <div className="toasts">{toasts.map((t) => <div key={t.id} className={"toast " + t.kind}>{t.msg}</div>)}</div>
    </Ctx.Provider>
  );
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
