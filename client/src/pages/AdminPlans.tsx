import { useEffect, useState, type CSSProperties } from "react";
import { useSession } from "../App";
import { t } from "../i18n";
import { api } from "../lib/api";
import { PLAN_CHANGED, forgetPlans } from "../lib/access";
import type { AccessMap, TabAccessMap } from "../../../shared/access";
import AdminAccess from "./AdminAccess";
import { PLAN_IDS, UNLIMITED, type Plan, type PlanId, type PlanOverride } from "../../../shared/plans";
import "./adminPlans.css";

// Admin › Plans & access: edit each plan's name, price, billing period, features and limits, and tick which
// plans open each section, page and tab of the portal (AdminAccess). Changes apply to everyone once saved (with BILLING=on).

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "QAR", "KWD", "BHD", "OMR", "EGP"];
type Draft = Record<PlanId, { name: string; tagline: string; amount: string; currency: string; period: "month" | "year"; note: string; features: string; projects: number; members: number; storageGb: number; aiPerMonth: number }>;

const toDraft = (plans: Plan[]): Draft => Object.fromEntries(plans.map((p) => [p.id, {
  name: p.name, tagline: p.tagline, amount: p.price.amount === null ? "" : String(p.price.amount), currency: p.price.currency, period: p.price.period, note: p.price.note,
  features: p.features.join("\n"), projects: p.projects, members: p.members, storageGb: p.storageGb, aiPerMonth: p.aiPerMonth,
}])) as Draft;

const fromDraft = (d: Draft): Record<PlanId, PlanOverride> => Object.fromEntries(PLAN_IDS.map((id) => {
  const x = d[id];
  return [id, {
    name: x.name.trim(), tagline: x.tagline.trim(), features: x.features.split("\n").map((s) => s.trim()).filter(Boolean),
    price: { amount: x.amount.trim() === "" ? null : Number(x.amount), currency: x.currency, period: x.period, note: x.note.trim() },
    projects: x.projects, members: x.members, storageGb: x.storageGb, aiPerMonth: x.aiPerMonth,
  }];
})) as Record<PlanId, PlanOverride>;

export default function AdminPlans() {
  const { toast } = useSession();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState<{ access: AccessMap; tabAccess: TabAccessMap } | null>(null);
  const [billing, setBilling] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ plans: Plan[]; access: AccessMap; tabAccess?: TabAccessMap; billing: boolean }>("/admin/plans").then((r) => {
      setPlans(r.plans); setDraft(toDraft(r.plans)); setSaved({ access: r.access, tabAccess: r.tabAccess ?? {} }); setBilling(r.billing);
    }).catch((e) => toast((e as Error).message, "error"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!plans || !draft || !saved) return <p className="muted">{t("Loading…")}</p>;
  const setP = (id: PlanId, k: keyof Draft[PlanId], v: string | number) => setDraft({ ...draft, [id]: { ...draft[id], [k]: v } });

  const savePlans = async () => {
    const body = fromDraft(draft);
    if (PLAN_IDS.some((id) => !body[id].name)) return toast(t("Every plan needs a name."), "error");
    setBusy(true);
    try { const r = await api<{ plans: Plan[] }>("/admin/plans", { method: "PUT", body }); setPlans(r.plans); setDraft(toDraft(r.plans)); toast(t("Plans saved")); forgetPlans(); window.dispatchEvent(new Event(PLAN_CHANGED)); }
    catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const color = (id: PlanId) => plans.find((p) => p.id === id)?.color ?? "var(--accent)";

  return (
    <div className="adm-plans">
      {!billing && <p className="banner info">{t("Plan limits and section access are switched off on this installation (BILLING is not on). You can still prepare them here; they apply once billing is switched on.")}</p>}

      <h2>{t("Subscription plans: fees and details")}</h2>
      <p className="small muted">{t("Edit the price, name, currency, billing period, features and limits of each plan. Changes apply everywhere, including the public pricing page, after you save. Leave the price empty to show \"Contact us\".")}</p>
      <div className="adm-plan-grid">
        {PLAN_IDS.map((id) => {
          const d = draft[id]; const pre = `plan-${id}-`;
          return (
            <section key={id} className="card adm-plan" style={{ "--plan": color(id) } as CSSProperties}>
              <div className="row"><input aria-label={t("Plan name")} className="adm-plan-name" value={d.name} onChange={(e) => setP(id, "name", e.target.value)} /><span className="adm-swatch" aria-hidden="true" /></div>
              <div className="adm-two">
                <div><label htmlFor={pre + "price"}>{t("Price")}</label><input id={pre + "price"} type="number" min={0} step="0.01" value={d.amount} disabled={id === "free"} onChange={(e) => setP(id, "amount", e.target.value)} /></div>
                <div><label htmlFor={pre + "cur"}>{t("Currency")}</label><select id={pre + "cur"} value={d.currency} onChange={(e) => setP(id, "currency", e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="adm-two">
                <div><label htmlFor={pre + "period"}>{t("Billing period")}</label><select id={pre + "period"} value={d.period} onChange={(e) => setP(id, "period", e.target.value)}><option value="year">{t("year")}</option><option value="month">{t("month")}</option></select></div>
                <div><label htmlFor={pre + "note"}>{t("Price note")}</label><input id={pre + "note"} value={d.note} onChange={(e) => setP(id, "note", e.target.value)} placeholder={t("Billed yearly")} /></div>
              </div>
              <label htmlFor={pre + "tag"}>{t("Short description")}</label><input id={pre + "tag"} value={d.tagline} onChange={(e) => setP(id, "tagline", e.target.value)} />
              <label htmlFor={pre + "feat"}>{t("Features (one per line)")}</label><textarea id={pre + "feat"} rows={6} value={d.features} onChange={(e) => setP(id, "features", e.target.value)} />
              <details className="adm-limits"><summary>{t("Limits")}</summary>
                <div className="adm-two">
                  {(["projects", "members", "storageGb", "aiPerMonth"] as const).map((k) => (
                    <div key={k}><label htmlFor={pre + k}>{t({ projects: "Projects", members: "Members per project", storageGb: "Storage (GB)", aiPerMonth: "AI requests / month" }[k])}</label>
                      <input id={pre + k} type="number" min={0} max={UNLIMITED} value={d[k]} onChange={(e) => setP(id, k, Math.max(0, Math.min(UNLIMITED, Math.round(+e.target.value || 0))))} /></div>))}
                </div>
                <p className="tiny muted">{t("100000 means unlimited.")}</p>
              </details>
            </section>);
        })}
      </div>
      <div className="row"><button type="button" className="primary" disabled={busy} onClick={savePlans}>{t("Save plans")}</button><button type="button" disabled={busy} onClick={() => setDraft(toDraft(plans))}>{t("Discard changes")}</button></div>

      <h2>{t("Subscription permission control")}</h2>
      <p className="small muted">{t("Tick the plans that can open each section, page and tab. Users on other plans see a lock and an upgrade prompt, and the paid AI tools refuse their requests. Administrators can always open everything.")}</p>
      <AdminAccess plans={plans} access={saved.access} tabAccess={saved.tabAccess} onSaved={(access, tabAccess) => setSaved({ access, tabAccess })} />
    </div>
  );
}
