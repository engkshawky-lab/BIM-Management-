import { setLocale, type Locale } from "./i18n";
import { applyDomLocale } from "./i18nDom";
import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, SESSION_EXPIRED, type User } from "./lib/api";
import ErrorBoundary, { NotFound } from "./components/ErrorBoundary";
import { AccessProvider, LockedPage, useAccess } from "./lib/access";
import { Maintenance, useSite } from "./lib/site";
import { locate } from "./shell/nav";
import { pageMeta } from "../../shared/pageMeta";
import Shell from "./shell/Shell";
const Home = lazy(() => import("./pages/Home"));
import Login, { ResetPassword } from "./pages/Login";
import { VerifyEmail, VerifyLink } from "./pages/Account";

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
const OurVideos = lazy(() => import("./pages/OurVideos"));
const LearningPaths = lazy(() => import("./pages/LearningPaths"));
const CertificatePage = lazy(() => import("./pages/Certificate"));
const HubRoute = lazy(() => import("./pages/HubRoute"));
const Legal = lazy(() => import("./pages/Legal"));
const Landing = lazy(() => import("./pages/public/Public").then((m) => ({ default: m.Landing })));
const Pricing = lazy(() => import("./pages/public/Public").then((m) => ({ default: m.Pricing })));
const About = lazy(() => import("./pages/public/Public").then((m) => ({ default: m.About })));

interface Session { user: User; setUser: (u: User | null) => void; toast: (msg: string, kind?: "ok" | "error") => void }
const Ctx = createContext<Session>(null!);
export const useSession = () => useContext(Ctx);

// The app uses #/ addresses. Public pages (home, pricing, about, legal, sign-in) also have real addresses such as
// /pricing, which the server sends with the page's own title and description for search engines and link previews.
export const navigate = (path: string) => {
  if (window.location.pathname === "/") { window.location.hash = path; return; }
  history.pushState(null, "", "/#" + path);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
};
const PUBLIC_PATH = /^\/(pricing|about|login|signup|legal(\/[a-z]+)?)?$/;

function useRoute() {
  // an in-page anchor such as #contact is not a route
  const get = () => (/^#\//.test(window.location.hash) ? window.location.hash.slice(1) : PUBLIC_PATH.test(window.location.pathname) ? window.location.pathname : "/");
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => { setRoute(get()); window.scrollTo(0, 0); };
    // links to real addresses (/pricing) and, away from the root, to #/ addresses are handled here without a reload
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a"); const href = a?.getAttribute("href");
      if (!a || !href || a.target || a.hasAttribute("download")) return;
      if (PUBLIC_PATH.test(href)) { e.preventDefault(); history.pushState(null, "", href); on(); }
      else if (href.startsWith("#/") && window.location.pathname !== "/") { e.preventDefault(); navigate(href.slice(1)); }
    };
    window.addEventListener("hashchange", on);
    window.addEventListener("popstate", on);
    document.addEventListener("click", click);
    return () => { window.removeEventListener("hashchange", on); window.removeEventListener("popstate", on); document.removeEventListener("click", click); };
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

  const { site } = useSite();
  // browser tab title: the public page's own title for visitors, else the portal name
  useEffect(() => { document.title = (!user && pageMeta(route, site.siteName)?.title) || site.siteName; }, [route, user, site.siteName]);
  // Arabic page content: start/stop the translation layer when the language changes (the portal default applies
  // until the user or visitor picks a language)
  const loc = ((user?.locale ?? (() => { try { return localStorage.getItem("bim:locale"); } catch { return null; } })() ?? site.defaultLocale) === "ar" ? "ar" : "en");
  const [, setI18nReady] = useState(0);
  // re-render once the dictionary has loaded so directly translated content (lessons) updates too
  useEffect(() => { if (user !== undefined) applyDomLocale(loc).then(() => setI18nReady((n) => n + 1)); }, [loc, user === undefined]); // eslint-disable-line react-hooks/exhaustive-deps
  // who is signed in; while the server is starting (no answer or 5xx) retry a few times rather than show the visitor pages
  useEffect(() => {
    let tries = 0; let stop = false;
    const load = () => api<{ user: User | null }>("/auth/me").then((r) => !stop && setUser(r.user)).catch((e) => {
      if (stop) return;
      const status = (e as { status?: number }).status ?? 0;
      if ((status === 0 || status >= 500) && ++tries < 5) setTimeout(load, 1500); else setUser(null);
    });
    load();
    return () => { stop = true; };
  }, []);
  // session expired or revoked (api() saw a 401): show sign-in; successful sign-in always opens the home page
  useEffect(() => {
    const expired = () => { setUser((u) => (u ? null : u)); toast("Your session has ended. Sign in again to continue.", "error"); };
    window.addEventListener(SESSION_EXPIRED, expired);
    return () => window.removeEventListener(SESSION_EXPIRED, expired);
  }, [toast]);

  // interface language: the account setting, or the choice made on the sign-in page
  const stored = (() => { try { return localStorage.getItem("bim:locale"); } catch { return null; } })();
  const locale = ((user?.locale ?? stored ?? site.defaultLocale) === "ar" ? "ar" : "en") as Locale;
  setLocale(locale);
  if (user === undefined) return <div className="center muted">Loading…</div>;
  // certificates can be checked by anyone with the link, signed in or not
  const certCode = /^\/certificate\/([A-Za-z0-9-]{6,20})$/.exec(route)?.[1];
  if (certCode) return <Suspense fallback={<div className="center muted">Loading…</div>}><CertificatePage code={certCode} /></Suspense>;
  const reset = /^\/reset\/([0-9a-f]{64})$/.exec(route)?.[1];
  if (reset) return <ResetPassword token={reset} />;
  const reload = () => api<{ user: User | null }>("/auth/me").then((r) => setUser(r.user)).catch(() => undefined);
  const verify = /^\/verify\/([0-9a-f]{64})$/.exec(route)?.[1];
  if (verify) return <VerifyLink token={verify} onDone={() => { navigate("/"); reload(); }} />;
  // legal pages are public, so they can be read before signing up
  const legal = /^\/legal(?:\/([a-z]+))?$/.exec(route);
  if (!user && legal) return <Suspense fallback={<div className="center muted">Loading…</div>}><Legal standalone id={legal[1]} /></Suspense>;
  // public site for visitors: home, pricing and about; sign-in at /login and /signup. Any other address shows
  // sign-in. Always return to the home page afterward, including when the original link was admin-only.
  if (!user) {
    const pub = route === "/" ? <Landing /> : route === "/pricing" ? <Pricing /> : route === "/about" ? <About /> : null;
    if (pub) return <Suspense fallback={<div className="center muted">Loading…</div>}>{pub}</Suspense>;
    return <Login key={route} initialMode={route === "/signup" ? "register" : "login"} onSignedIn={(u) => {
      history.replaceState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
      setUser(u);
    }} />;
  }

  // new accounts confirm their email address first (when email is set up and the setting is on)
  if (user.mustVerify) return <VerifyEmail user={user} onVerified={reload} onSignOut={() => { api("/auth/logout", { method: "POST" }).finally(() => setUser(null)); }} />;
  // maintenance mode: only administrators carry on
  if (site.maintenanceMode && user.role !== "admin") return <Maintenance onSignOut={() => { api("/auth/logout", { method: "POST" }).finally(() => setUser(null)); }} />;

  const parts = route.split("/").filter(Boolean);
  let view;
  if (["login", "signup"].includes(parts[0] ?? "")) view = <Home />;
  else if (parts[0] === "pricing") view = <Pricing embedded />;
  else if (parts[0] === "about") view = <About embedded />;
  else if (parts[0] === "projects" && parts[1] === "new") view = <NewProject />;
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
  else if (parts[0] === "videos" && parts[1] === "ours") view = <OurVideos />;
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
  else if (!parts.length) view = <Home />;
  else view = <NotFound />;

  return (
    <Ctx.Provider value={{ user, setUser, toast }}>
      <AccessProvider userId={user.id}>
        <Shell route={route}><ErrorBoundary route={route}><Suspense fallback={<div className="center muted">Loading…</div>}><Gate route={route}>{view}</Gate></Suspense></ErrorBoundary></Shell>
      </AccessProvider>
      <div className="toasts" role="status" aria-live="polite">{toasts.map((t) => <div key={t.id} className={"toast " + t.kind}>{t.msg}</div>)}</div>
    </Ctx.Provider>
  );
}

/** Pages the user's plan doesn't open show the upgrade screen instead (only with billing on). */
function Gate({ route, children }: { route: string; children: ReactNode }) {
  const { locked } = useAccess();
  const { hiddenPages } = useSite();
  const { user } = useSession();
  const item = locate(route).item;
  // pages an administrator removed from the menu are closed to everyone else
  if (item && hiddenPages.includes(item.key) && user.role !== "admin") return <NotFound />;
  return item && locked(item.key) ? <LockedPage sectionKey={item.key} label={item.label} /> : <>{children}</>;
}

export const initials =(name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
