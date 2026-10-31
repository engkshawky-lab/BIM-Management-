import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { baseSettings, type SettingsMap } from "../../../shared/appSettings";
import { t } from "../i18n";

// Public portal settings (Admin › Settings): name, contact, announcement, maintenance, sign-ups, hidden menu pages.
// Loaded once at start and again after an administrator saves; defaults are used until the server answers.
export interface Site {
  siteName: string; siteShort: string; maker: string; contactEmail: string; defaultLocale: "en" | "ar";
  allowSignups: boolean; maintenanceMode: boolean; maintenanceMessage: string;
  announcementOn: boolean; announcementText: string; announcementLevel: "info" | "success" | "warning"; announcementLink: string;
  billing: boolean; showPricing: boolean; aiEnabled: boolean;
}
interface SiteApi { site: Site; hiddenPages: string[]; refresh: () => void }

const defaults = baseSettings({}) as unknown as Site;
const Ctx = createContext<SiteApi>({ site: defaults, hiddenPages: [], refresh: () => undefined });
export const useSite = () => useContext(Ctx);
/** Fired after Admin › Settings is saved. */
export const SITE_CHANGED = "bim:site-changed";

export function SiteProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ site: Site; hiddenPages: string[] }>({ site: defaults, hiddenPages: [] });
  const refresh = useCallback(() => {
    fetch("/api/public/site", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null))
      .then((j: { settings: SettingsMap; hiddenPages: string[] } | null) => { if (j) setState({ site: { ...defaults, ...(j.settings as unknown as Site) }, hiddenPages: j.hiddenPages ?? [] }); })
      .catch(() => undefined);
  }, []);
  useEffect(() => { refresh(); window.addEventListener(SITE_CHANGED, refresh); return () => window.removeEventListener(SITE_CHANGED, refresh); }, [refresh]);
  useEffect(() => { document.title = state.site.siteName; }, [state.site.siteName]);
  return <Ctx.Provider value={{ ...state, refresh }}>{children}</Ctx.Provider>;
}

/** The administrator's announcement, at the top of every page while it is switched on. */
export function Announcement() {
  const { site } = useSite();
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem("bim:announce:hidden") === site.announcementText; } catch { return false; } });
  if (!site.announcementOn || !site.announcementText.trim() || hidden) return null;
  const hide = () => { setHidden(true); try { sessionStorage.setItem("bim:announce:hidden", site.announcementText); } catch { /* storage unavailable */ } };
  const external = /^https?:\/\//.test(site.announcementLink);
  return (
    <div className={"announce " + site.announcementLevel} role="status">
      <span>{t(site.announcementText)}</span>
      {site.announcementLink && <a href={site.announcementLink} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{t("Learn more")} →</a>}
      <button type="button" className="announce-close" aria-label={t("Hide announcement")} onClick={hide}>✕</button>
    </div>
  );
}

/** What non-administrators see while maintenance mode is on. */
export function Maintenance({ onSignOut }: { onSignOut?: () => void }) {
  const { site } = useSite();
  return (
    <div className="center maintenance">
      <div className="card">
        <span aria-hidden="true" style={{ fontSize: 34 }}>🛠️</span>
        <h1>{t("We'll be back soon")}</h1>
        <p>{t(site.maintenanceMessage)}</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button type="button" onClick={() => window.location.reload()}>{t("Try again")}</button>
          {onSignOut && <button type="button" onClick={onSignOut}>{t("Sign out")}</button>}
        </div>
      </div>
    </div>
  );
}
