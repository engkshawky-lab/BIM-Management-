import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { canOpen, cheapestFor, type AccessMap } from "../../../shared/access";
import { mergePlans, priceText, type Plan, type PlanId } from "../../../shared/plans";
import { t } from "../i18n";
import { api } from "./api";

// The signed-in user's plan and the section access map, for page locks and lock marks in the sidebar.
// Nothing is locked while billing is off, for administrators, or before the map has loaded.
interface AccessState { billing: boolean; plan: PlanId; admin: boolean; access: AccessMap }
interface AccessApi { state: AccessState | null; locked: (key: string | undefined) => boolean; refresh: () => void }

const Ctx = createContext<AccessApi>({ state: null, locked: () => false, refresh: () => undefined });
export const useAccess = () => useContext(Ctx);
/** Fired after the user's plan changes (code redeemed, payment, admin edit), so locks update at once. */
export const PLAN_CHANGED = "bim:plan-changed";

export function AccessProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [state, setState] = useState<AccessState | null>(null);
  const refresh = useCallback(() => { api<AccessState>("/access").then(setState).catch(() => setState(null)); }, []);
  useEffect(() => { refresh(); }, [userId, refresh]);
  useEffect(() => { window.addEventListener(PLAN_CHANGED, refresh); return () => window.removeEventListener(PLAN_CHANGED, refresh); }, [refresh]);
  const locked = useCallback((key: string | undefined) => !!key && !!state && state.billing && !state.admin && !canOpen(key, state.plan, state.access), [state]);
  return <Ctx.Provider value={{ state, locked, refresh }}>{children}</Ctx.Provider>;
}

/** Shown in place of a page the user's plan doesn't open. */
export function LockedPage({ sectionKey, label }: { sectionKey: string; label: string }) {
  const { state } = useAccess();
  const [plans, setPlans] = useState<Plan[]>(mergePlans(null));
  useEffect(() => { api<{ plans: Plan[] }>("/public/plans").then((r) => setPlans(r.plans)).catch(() => undefined); }, []);
  const need = plans.find((p) => p.id === cheapestFor(sectionKey, state?.access));
  const current = plans.find((p) => p.id === state?.plan);
  return (
    <div className="card locked-page">
      <span className="locked-icon" aria-hidden="true">🔒</span>
      <h1>{t(label)}</h1>
      <p>{need ? <>{t("This section is included in the")} <b style={{ color: need.color }}>{t(need.name)}</b> {t("plan and above.")}</> : t("This section is not included in your plan.")}</p>
      {current && <p className="small muted">{t("Your plan:")} {t(current.name)}</p>}
      {need && <p className="small muted">{t(need.name)}: {t(priceText(need))}</p>}
      <div className="row">
        <a className="btn primary" href="#/billing">{t("Upgrade your plan")}</a>
        <a className="btn" href="#/pricing">{t("Compare plans")}</a>
      </div>
    </div>
  );
}
