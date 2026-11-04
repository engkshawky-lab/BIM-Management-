import { createContext, useCallback, useContext, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { canOpenKey, cheapestForKey, type AccessMap, type TabAccessMap } from "../../../shared/access";
import { DEFAULT_PLANS, mergePlans, priceText, type Plan, type PlanId } from "../../../shared/plans";
import { t } from "../i18n";
import { api } from "./api";
import { locate } from "../shell/nav";
import "./access.css";

// The signed-in user's plan and the page and tab access maps, for page locks, tab locks and lock marks in the
// sidebar. Nothing is locked while billing is off, for administrators, or before the maps have loaded — except in
// "preview as plan", where an administrator sees the portal as a subscriber on that plan would (Admin › Plans & access).
interface AccessState { billing: boolean; plan: PlanId; admin: boolean; access: AccessMap; tabAccess: TabAccessMap }
/** An administrator's preview: the plan to look through, and optionally unsaved (draft) access maps. */
export interface AccessPreview { plan: PlanId; access?: AccessMap; tabAccess?: TabAccessMap; draft?: boolean }
interface AccessApi {
  state: AccessState | null;
  /** Is this page or tab ("page/tab/…") closed to the user? */
  locked: (key: string | undefined) => boolean;
  /** The cheapest plan that opens a page or tab. */
  need: (key: string) => PlanId | null;
  refresh: () => void;
  preview: AccessPreview | null;
  setPreview: (p: AccessPreview | null) => void;
}

const Ctx = createContext<AccessApi>({ state: null, locked: () => false, need: () => null, refresh: () => undefined, preview: null, setPreview: () => undefined });
export const useAccess = () => useContext(Ctx);
/** Fired after the user's plan changes (code redeemed, payment, admin edit), so locks update at once. */
export const PLAN_CHANGED = "bim:plan-changed";
const PREVIEW_KEY = "bim:access-preview";

const readPreview = (): AccessPreview | null => { try { return JSON.parse(sessionStorage.getItem(PREVIEW_KEY) ?? "null"); } catch { return null; } };

export function AccessProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [state, setState] = useState<AccessState | null>(null);
  const [preview, setPreviewState] = useState<AccessPreview | null>(readPreview);
  const refresh = useCallback(() => { api<AccessState>("/access").then((s) => setState({ ...s, tabAccess: s.tabAccess ?? {} })).catch(() => setState(null)); }, []);
  useEffect(() => { refresh(); }, [userId, refresh]);
  useEffect(() => { window.addEventListener(PLAN_CHANGED, refresh); return () => window.removeEventListener(PLAN_CHANGED, refresh); }, [refresh]);
  const setPreview = useCallback((p: AccessPreview | null) => {
    if (p) sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(p)); else sessionStorage.removeItem(PREVIEW_KEY);
    setPreviewState(p);
  }, []);
  // only administrators can preview; anyone else who has a stale preview in the tab drops it
  const pv = state?.admin ? preview : null;
  const maps = (): [AccessMap | undefined, TabAccessMap | undefined] => [pv?.access ?? state?.access, pv?.tabAccess ?? state?.tabAccess];
  const locked = useCallback((key: string | undefined) => {
    if (!key || !state) return false;
    const [access, tabs] = [pv?.access ?? state.access, pv?.tabAccess ?? state.tabAccess];
    if (pv) return !canOpenKey(key, pv.plan, access, tabs);
    return state.billing && !state.admin && !canOpenKey(key, state.plan, access, tabs);
  }, [state, pv]);
  const need = useCallback((key: string) => { const [a, tb] = maps(); return cheapestForKey(key, a, tb); }, [state, pv]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Ctx.Provider value={{ state, locked, need, refresh, preview: pv, setPreview }}>
    {children}
    {pv && <PreviewBar preview={pv} onExit={() => setPreview(null)} />}
  </Ctx.Provider>;
}

// Plans (names, colours, prices) as the administrator set them, fetched once per page load.
let plansCache: Promise<Plan[]> | null = null;
export function usePlans(): Plan[] {
  const [plans, setPlans] = useState<Plan[]>(mergePlans(null));
  useEffect(() => {
    plansCache ??= api<{ plans: Plan[] }>("/public/plans").then((r) => r.plans).catch(() => { plansCache = null; return DEFAULT_PLANS; });
    let live = true;
    plansCache.then((p) => { if (live) setPlans(p); });
    return () => { live = false; };
  }, []);
  return plans;
}
/** Let the Admin page refresh the cached plans after editing them. */
export const forgetPlans = () => { plansCache = null; };

function PreviewBar({ preview, onExit }: { preview: AccessPreview; onExit: () => void }) {
  const plans = usePlans();
  const plan = plans.find((p) => p.id === preview.plan);
  return (
    <div className="access-preview-bar" role="status" style={{ "--plan": plan?.color } as CSSProperties}>
      <LockIcon />
      <span><b>{t("Previewing as")} {t(plan?.name ?? preview.plan)}</b> · {preview.draft ? t("unsaved access changes") : t("saved access")}</span>
      <a className="btn small" href="#/admin/plans">{t("Back to access")}</a>
      <button type="button" className="small" onClick={onExit}>{t("Exit preview")}</button>
    </div>
  );
}

export const LockIcon = ({ size = 14 }: { size?: number }) => (
  <svg className="lock-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
  </svg>
);

/** A small lock after a tab's label when the tab is closed to the user, in the colour of the plan that opens it. */
export function TabLock({ k }: { k: string }) {
  const { locked, need } = useAccess();
  const plans = usePlans();
  if (!locked(k)) return null;
  const plan = plans.find((p) => p.id === need(k));
  return <span className="tab-lock" style={{ "--plan": plan?.color ?? "var(--muted)" } as CSSProperties}
    title={plan ? `${t("Part of")} ${t(plan.name)}` : t("Not included in your plan")}><LockIcon size={12} /></span>;
}

/** A lock on a tab that is a sidebar page of its own (AI studio, BIM tools, workflow…), found by the tab's route. */
export const PageLock = ({ route }: { route: string }) => { const key = locate(route).item?.key; return key ? <TabLock k={key} /> : null; };

/** Shown inside a tab the user's plan doesn't open; the page around it stays open. */
export function LockedTab({ k, label, back }: { k: string; label: string; back?: { href?: string; onClick?: () => void; label: string } }) {
  const { need, state, preview } = useAccess();
  const plans = usePlans();
  const plan = plans.find((p) => p.id === need(k));
  const current = plans.find((p) => p.id === (preview?.plan ?? state?.plan));
  return (
    <section className="locked-tab" style={{ "--plan": plan?.color ?? "var(--muted)" } as CSSProperties} aria-label={t(label)}>
      <div className="locked-tab-disc" aria-hidden="true"><LockIcon size={24} /></div>
      <div>
        <span className="badge locked-tab-badge">{plan ? `${t(plan.name)} ${t("plan")}` : t("Not available")}</span>
        <h2>{plan ? <>{t("This tab is part of")} {t(plan.name)}</> : t("This tab is not included in any plan")}</h2>
        <p>{plan
          ? <>{t("Upgrade to open")} <b>{t(label)}</b>. {t("The rest of this page stays open, and the tabs included in your plan work as usual.")}</>
          : t("Your administrator has closed this tab. The rest of this page stays open.")}</p>
        {current && <p className="small muted">{t("Your plan:")} {t(current.name)}{plan ? <> · {t(plan.name)}: {t(priceText(plan))}</> : null}</p>}
        <div className="row">
          {plan && <a className="btn primary" href="#/billing">{t("Upgrade your plan")}</a>}
          <a className="btn" href="#/pricing">{t("Compare plans")}</a>
          {back && (back.href ? <a className="btn ghost" href={back.href}>{t(back.label)}</a> : <button type="button" className="ghost" onClick={back.onClick}>{t(back.label)}</button>)}
        </div>
      </div>
    </section>
  );
}

/** Shown in place of a page the user's plan doesn't open. */
export function LockedPage({ sectionKey, label }: { sectionKey: string; label: string }) {
  const { state, need, preview } = useAccess();
  const plans = usePlans();
  const want = plans.find((p) => p.id === need(sectionKey));
  const current = plans.find((p) => p.id === (preview?.plan ?? state?.plan));
  return (
    <div className="card locked-page">
      <span className="locked-icon" aria-hidden="true">🔒</span>
      <h1>{t(label)}</h1>
      <p>{want ? <>{t("This section is included in the")} <b style={{ color: want.color }}>{t(want.name)}</b> {t("plan and above.")}</> : t("This section is not included in your plan.")}</p>
      {current && <p className="small muted">{t("Your plan:")} {t(current.name)}</p>}
      {want && <p className="small muted">{t(want.name)}: {t(priceText(want))}</p>}
      <div className="row">
        <a className="btn primary" href="#/billing">{t("Upgrade your plan")}</a>
        <a className="btn" href="#/pricing">{t("Compare plans")}</a>
      </div>
    </div>
  );
}
