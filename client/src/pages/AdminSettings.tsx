import { useEffect, useMemo, useState } from "react";
import { useSession } from "../App";
import { t } from "../i18n";
import { api } from "../lib/api";
import { SITE_CHANGED } from "../lib/site";
import { PLAN_CHANGED } from "../lib/access";
import { ACCOUNT_PAGES, PROJECT_PAGES, SECTIONS, TEMPLATE_PAGES } from "../shell/nav";
import { SETTINGS, SETTING_GROUPS, type SettingDef, type SettingValue, type SettingsMap } from "../../../shared/appSettings";
import "./adminPlans.css";

// Admin › Settings: every portal setting that can change while the portal runs, grouped as in shared/appSettings.ts,
// the pages shown in the menu, and the status of what lives in the server environment (keys and passwords).

interface Integration { name: string; ok: boolean; env: string; note: string }
interface Resp { settings: SettingsMap; saved: SettingsMap; defaults: SettingsMap; hiddenPages: string[]; integrations: Integration[] }

const LINKS: [string, string, string][] = [
  ["#/admin/plans", "Plans & access", "Prices, features, limits and which plan opens each section"],
  ["#/admin/codes", "Promo codes", "Codes that give a plan for a number of months"],
  ["#/admin/branding", "Branding", "Organisation name, colour, logo and footer on Word exports"],
  ["#/admin/users", "Users", "Roles, plans, password resets and disabled accounts"],
  ["#/videos/ours", "Our videos", "Upload and manage the organisation's own videos"],
  ["#/downloads", "Downloads library", "Files every user can download"],
  ["#/admin/feedback", "Feedback", "Questions and problems sent from Help & support"],
];

export default function AdminSettings() {
  const { toast } = useSession();
  const [data, setData] = useState<Resp | null>(null);
  const [form, setForm] = useState<SettingsMap>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  const load = () => api<Resp>("/admin/settings").then((r) => { setData(r); setForm(r.settings); setHidden(r.hiddenPages); }).catch((e) => toast((e as Error).message, "error"));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pageGroups = useMemo(() => [
    ...SECTIONS.map((s) => ({ title: s.label, items: s.items })),
    { title: "Projects", items: PROJECT_PAGES },
    { title: "Document templates", items: TEMPLATE_PAGES },
    { title: "Account", items: ACCOUNT_PAGES },
  ].map((g) => ({ ...g, items: g.items.filter((i) => !q.trim() || (i.label + " " + g.title).toLowerCase().includes(q.trim().toLowerCase())) })).filter((g) => g.items.length), [q]);

  if (!data) return <p className="muted">{t("Loading…")}</p>;
  const changed = SETTINGS.filter((s) => form[s.key] !== data.settings[s.key]).map((s) => s.key);
  const hiddenChanged = JSON.stringify([...hidden].sort()) !== JSON.stringify([...data.hiddenPages].sort());

  const save = async (extra: Record<string, SettingValue | null> = {}) => {
    setBusy(true);
    try {
      const settings: Record<string, SettingValue | null> = { ...Object.fromEntries(changed.map((k) => [k, form[k]!])), ...extra };
      const r = await api<Resp>("/admin/settings", { method: "PUT", body: { settings, hiddenPages: hidden } });
      setData({ ...data, ...r }); setForm(r.settings); setHidden(r.hiddenPages);
      toast(t("Settings saved"));
      window.dispatchEvent(new Event(SITE_CHANGED)); window.dispatchEvent(new Event(PLAN_CHANGED));
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const source = (s: SettingDef) => (s.key in data.saved ? "saved" : data.defaults[s.key] !== s.default ? "environment" : "default");

  return (
    <div className="adm-plans adm-settings">
      <div className="row adm-access-bar adm-save-bar">
        <b>{t("Portal settings")}</b>
        <span className="pagebar-spacer" />
        {(changed.length > 0 || hiddenChanged) && <span className="small" style={{ color: "var(--warn)" }}>{t("Unsaved changes")} ({changed.length + (hiddenChanged ? 1 : 0)})</span>}
        <button type="button" disabled={busy || (!changed.length && !hiddenChanged)} onClick={() => { setForm(data.settings); setHidden(data.hiddenPages); }}>{t("Discard changes")}</button>
        <button type="button" className="primary" disabled={busy || (!changed.length && !hiddenChanged)} onClick={() => save()}>{t("Save settings")}</button>
      </div>

      {SETTING_GROUPS.map((g) => (
        <section key={g} className="card adm-set-group">
          <h2>{t(g)}</h2>
          {SETTINGS.filter((s) => s.group === g).map((s) => <Field key={s.key} s={s} value={form[s.key]!} src={source(s)} onChange={(v) => setForm({ ...form, [s.key]: v })} onReset={() => save({ [s.key]: null })} />)}
        </section>))}

      <section className="card adm-set-group">
        <h2>{t("Menu: pages shown to users")}</h2>
        <p className="small muted">{t("Untick a page to remove it from the menu and close it to everyone except administrators. To limit a page to certain plans instead, use Plans & access.")}</p>
        <input type="search" aria-label={t("Search pages…")} placeholder={t("Search pages…")} value={q} onChange={(e) => setQ(e.target.value)} />
        {pageGroups.map((g) => (
          <details key={g.title} className="adm-group" open={!!q.trim()}>
            <summary>{t(g.title)} <span className="muted small">({g.items.filter((i) => !hidden.includes(i.key)).length}/{g.items.length})</span></summary>
            <div className="adm-pages">
              {g.items.map((i) => (
                <label key={i.key} className="check"><input type="checkbox" checked={!hidden.includes(i.key)} onChange={(e) => setHidden(e.target.checked ? hidden.filter((k) => k !== i.key) : [...hidden, i.key])} />{t(i.label)}</label>))}
            </div>
          </details>))}
      </section>

      <section className="card adm-set-group">
        <h2>{t("Server environment")}</h2>
        <p className="small muted">{t("Keys and passwords stay in the server's environment file and are never shown here. Change them on the server and restart the portal.")}</p>
        <table className="data"><tbody>
          {data.integrations.map((i) => (
            <tr key={i.name}><td>{i.ok ? <span style={{ color: "var(--ok)" }}>✓ {t("Set")}</span> : <span className="muted">— {t("Not set")}</span>}</td><td><b>{t(i.name)}</b><div className="tiny muted">{t(i.note)}</div></td><td className="mono tiny">{i.env}</td></tr>))}
        </tbody></table>
      </section>

      <section className="card adm-set-group">
        <h2>{t("Other admin areas")}</h2>
        <div className="adm-links">{LINKS.map(([href, label, hint]) => <a key={href} className="adm-link" href={href}><b>{t(label)}</b><span className="small muted">{t(hint)}</span></a>)}</div>
      </section>
    </div>
  );
}

function Field({ s, value, src, onChange, onReset }: { s: SettingDef; value: SettingValue; src: string; onChange: (v: SettingValue) => void; onReset: () => void }) {
  const id = `set-${s.key}`;
  const badge = src === "saved" ? <button type="button" className="linklike tiny" onClick={onReset} title={t("Back to the default")}>{t("reset to default")}</button>
    : src === "environment" ? <span className="tiny muted">{t("from the server environment")}</span> : null;
  if (s.type === "bool") return (
    <div className="adm-field">
      <label className="adm-switch" htmlFor={id}><input id={id} type="checkbox" role="switch" checked={!!value} onChange={(e) => onChange(e.target.checked)} /><b>{t(s.label)}</b></label>
      <p className="tiny muted">{t(s.help)} {badge}</p>
    </div>);
  return (
    <div className="adm-field">
      <label htmlFor={id}><b>{t(s.label)}</b></label>
      {s.type === "select" ? <select id={id} value={String(value)} onChange={(e) => onChange(e.target.value)}>{s.options!.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}</select>
        : s.type === "textarea" ? <textarea id={id} rows={3} value={String(value)} onChange={(e) => onChange(e.target.value)} />
          : <input id={id} type={s.type === "number" ? "number" : s.type === "email" ? "email" : s.type === "url" ? "url" : "text"} min={s.min} max={s.max} value={String(value)}
            onChange={(e) => onChange(s.type === "number" ? Number(e.target.value) : e.target.value)} />}
      <p className="tiny muted">{t(s.help)} {badge}</p>
    </div>);
}
