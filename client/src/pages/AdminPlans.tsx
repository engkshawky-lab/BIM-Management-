import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSession } from "../App";
import { t } from "../i18n";
import { api } from "../lib/api";
import { PLAN_CHANGED } from "../lib/access";
import { PROJECT_PAGES, SECTIONS, TEMPLATE_PAGES, type NavItem } from "../shell/nav";
import { defaultPlansFor, plansFor, type AccessMap } from "../../../shared/access";
import { PLAN_IDS, UNLIMITED, type Plan, type PlanId, type PlanOverride } from "../../../shared/plans";
import "./adminPlans.css";

// Admin › Plans & access: edit each plan's name, price, billing period, features and limits, and tick which
// plans open each section of the portal. Changes apply to everyone once saved (with BILLING=on).

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
  const [access, setAccess] = useState<AccessMap>({});
  const [saved, setSaved] = useState<AccessMap>({});
  const [billing, setBilling] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ plans: Plan[]; access: AccessMap; billing: boolean }>("/admin/plans").then((r) => {
      setPlans(r.plans); setDraft(toDraft(r.plans)); setAccess(r.access); setSaved(r.access); setBilling(r.billing);
    }).catch((e) => toast((e as Error).message, "error"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => [
    { title: "Projects", items: PROJECT_PAGES },
    ...SECTIONS.map((s) => ({ title: s.label, items: s.items })),
    { title: "Document templates", items: TEMPLATE_PAGES },
  ].map((g) => ({ ...g, items: g.items.filter((i) => !q.trim() || (i.label + " " + (i.hint ?? "") + " " + g.title).toLowerCase().includes(q.trim().toLowerCase())) }))
    .filter((g) => g.items.length), [q]);

  if (!plans || !draft) return <p className="muted">{t("Loading…")}</p>;
  const setP = (id: PlanId, k: keyof Draft[PlanId], v: string | number) => setDraft({ ...draft, [id]: { ...draft[id], [k]: v } });
  const dirtyAccess = JSON.stringify(access) !== JSON.stringify(saved);

  const savePlans = async () => {
    const body = fromDraft(draft);
    if (PLAN_IDS.some((id) => !body[id].name)) return toast(t("Every plan needs a name."), "error");
    setBusy(true);
    try { const r = await api<{ plans: Plan[] }>("/admin/plans", { method: "PUT", body }); setPlans(r.plans); setDraft(toDraft(r.plans)); toast(t("Plans saved")); window.dispatchEvent(new Event(PLAN_CHANGED)); }
    catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const saveAccess = async () => {
    setBusy(true);
    try { const r = await api<{ access: AccessMap }>("/admin/access", { method: "PUT", body: { access } }); setAccess(r.access); setSaved(r.access); toast(t("Section access saved")); window.dispatchEvent(new Event(PLAN_CHANGED)); }
    catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const toggle = (item: NavItem, id: PlanId) => {
    const cur = plansFor(item.key, access);
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : PLAN_IDS.filter((x) => x === id || cur.includes(x));
    setAccess({ ...access, [item.key]: next });
  };
  const resetRow = (item: NavItem) => { const { [item.key]: _, ...rest } = access; setAccess(rest); };
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
      <p className="small muted">{t("Tick the plans that can open each section. Users on other plans see a lock and an upgrade prompt, and the paid AI tools refuse their requests. Administrators can always open everything.")}</p>
      <div className="adm-legend">{plans.map((p) => <span key={p.id}><i style={{ background: p.color }} />{t(p.name)}</span>)}</div>
      <div className="row adm-access-bar">
        <input type="search" aria-label={t("Search sections…")} placeholder={t("Search sections…")} value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="primary" disabled={busy || !dirtyAccess} onClick={saveAccess}>{t("Save access")}</button>
        <button type="button" disabled={busy || !Object.keys(access).length} onClick={() => { if (confirm(t("Reset every section to the default plans?"))) setAccess({}); }}>{t("Reset all to defaults")}</button>
        {dirtyAccess && <span className="small" style={{ color: "var(--warn)" }}>{t("Unsaved changes")}</span>}
      </div>
      {groups.map((g) => (
        <details key={g.title} className="adm-group" open={!!q.trim() || g.title === "Projects"}>
          <summary>{t(g.title)} <span className="muted small">({g.items.length})</span></summary>
          <div className="adm-rows">
            {g.items.map((item) => {
              const on = plansFor(item.key, access); const custom = item.key in access;
              const none = on.length === 0;
              return (
                <div key={item.key} className={"adm-row" + (none ? " none" : "")} style={{ "--edge": color(on[0] ?? "expert") } as CSSProperties}>
                  <span className="adm-row-name"><span aria-hidden="true">🔒</span> {t(item.label)}{custom && <button type="button" className="linklike tiny" onClick={() => resetRow(item)} title={t("Back to the default")}>{t("default")}</button>}</span>
                  <span className="adm-ticks" role="group" aria-label={t(item.label)}>
                    {PLAN_IDS.map((id) => (
                      <label key={id} className={"adm-tick" + (on.includes(id) ? " on" : "")} style={{ "--plan": color(id) } as CSSProperties}>
                        <input type="checkbox" checked={on.includes(id)} onChange={() => toggle(item, id)} />{t(plans.find((p) => p.id === id)!.name)}
                      </label>))}
                  </span>
                  {none && <span className="tiny" style={{ color: "var(--danger)" }}>{t("No plan opens this section: only administrators can.")}</span>}
                  {!custom && JSON.stringify(on) !== JSON.stringify(defaultPlansFor(item.key)) && <span className="tiny muted">{t("default")}</span>}
                </div>);
            })}
          </div>
        </details>))}
    </div>
  );
}
