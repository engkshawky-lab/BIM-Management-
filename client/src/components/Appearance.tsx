import { useState } from "react";
import { useSession } from "../App";
import { t } from "../i18n";
import { api } from "../lib/api";
import { applyAppearance } from "../lib/appearance";
import { DEFAULT_APPEARANCE, PAGE_PRESETS, PRESETS, isHex, type Appearance } from "../../../shared/palette";
import { useDialog } from "./Dialog";

// Theme colour picker: presets or any colour, optional tinted background. Changes preview live; Save stores the choice
// on the account so it follows the user to other devices; Cancel restores what was there.

const BANNER_PRESETS = [...PRESETS, { id: "lilac", label: "Lilac", color: "#c3b5f2" }, { id: "mint", label: "Mint", color: "#bfe3cf" }, { id: "sky", label: "Sky", color: "#bcd9f2" },
  { id: "sand", label: "Sand", color: "#e8d9b5" }, { id: "navy", label: "Navy", color: "#1f2f55" }, { id: "charcoal", label: "Charcoal", color: "#2b2f36" }];

export function AppearanceDialog({ onClose, page }: { onClose: () => void; page?: { key: string; label: string } }) {
  const { user, setUser, toast } = useSession();
  const saved: Appearance = user.appearance ?? DEFAULT_APPEARANCE;
  const [a, setA] = useState<Appearance>(saved);
  const [busy, setBusy] = useState(false);
  // header banner: every page, or only the page the dialog was opened from
  const [scope, setScope] = useState<"all" | "page">(() => (page && saved.banners?.[page.key] ? "page" : "all"));
  const bannerNow = scope === "page" && page ? a.banners?.[page.key] ?? null : a.banner ?? null;
  const setBanner = (c: string | null) => {
    if (scope === "page" && page) { const b = { ...(a.banners ?? {}) }; if (c) b[page.key] = c; else delete b[page.key]; preview({ ...a, banners: b }); }
    else preview({ ...a, banner: c });
  };
  const overridden = Object.keys(a.banners ?? {});
  const preview = (next: Appearance) => { setA(next); applyAppearance(next); };
  const cancel = () => { applyAppearance(user.appearance ?? null); onClose(); };
  const dlg = useDialog(cancel);
  const save = async (value: Appearance | null) => {
    setBusy(true);
    try {
      const r = await api<{ user: typeof user }>("/profile", { method: "PUT", body: { appearance: value } });
      setUser(r.user); applyAppearance(value); toast(t("Colours saved")); onClose();
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  return (
    <div className="modal-bg" onClick={cancel}>
      <div className="modal" ref={dlg} role="dialog" aria-modal="true" aria-labelledby="appearance-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="appearance-title" style={{ marginTop: 0 }}>{t("Page & theme colours")}</h2>
        <p className="small muted">{t("Your choice is saved to your account and follows you to other devices. Colours are adjusted automatically so text stays readable in light and dark mode.")}</p>

        <section className="appearance-section">
          <h3>{t("Page colour")}</h3>
          <p className="small muted">{t("The background of every page, panel and card.")}</p>
          <div className="swatches" role="radiogroup" aria-label={t("Page colour")}>
            <button role="radio" aria-checked={!a.page} className={"swatch page-swatch page-default" + (!a.page ? " on" : "")} title={t("Default")} onClick={() => preview({ ...a, page: null })}>
              <span className="sr-only">{t("Default")}</span>{!a.page && "✓"}</button>
            {PAGE_PRESETS.map((p) => { const on = (a.page ?? "").toLowerCase() === p.color; return (
              <button key={p.id} role="radio" aria-checked={on} className={"swatch page-swatch" + (on ? " on" : "")} style={{ background: p.color }} title={t(p.label)} onClick={() => preview({ ...a, page: p.color, tint: false })}>
                <span className="sr-only">{t(p.label)}</span>{on && "✓"}</button>); })}
          </div>
          <div className="row" style={{ gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <label className="row small" style={{ gap: 8, margin: 0 }}>{t("Custom page colour")}
              <input type="color" aria-label={t("Custom page colour")} value={a.page && isHex(a.page) ? a.page : "#ffffff"} onChange={(e) => preview({ ...a, page: e.target.value, tint: false })} style={{ width: 48, height: 32, padding: 2 }} />
            </label>
            {a.page && <code className="small no-i18n">{a.page}</code>}
          </div>
        </section>

        <section className="appearance-section">
          <h3>{t("Header banner colour")}</h3>
          <p className="small muted">{t("The coloured band at the top of a page with its title. Text on it turns white or dark automatically.")}</p>
          <div className="seg" role="group" aria-label={t("Apply to")} style={{ marginBottom: 8 }}>
            <button type="button" className={scope === "all" ? "on" : ""} onClick={() => setScope("all")}>{t("All pages")}</button>
            <button type="button" className={scope === "page" ? "on" : ""} disabled={!page} onClick={() => setScope("page")} title={page ? undefined : t("Open the colours from a page to colour that page only")}>{t("This page only")}{page && <>: <span className="no-i18n">{t(page.label)}</span></>}</button>
          </div>
          <div className="swatches banner-swatches" role="radiogroup" aria-label={t("Header banner colour")}>
            <button role="radio" aria-checked={!bannerNow} className={"swatch page-swatch banner-default" + (!bannerNow ? " on" : "")} title={scope === "page" ? t("Same as all pages") : t("Each page's own colour")} onClick={() => setBanner(null)}>
              <span className="sr-only">{t("Default")}</span>{!bannerNow && "✓"}</button>
            {BANNER_PRESETS.map((p) => { const on = (bannerNow ?? "").toLowerCase() === p.color; return (
              <button key={p.id} role="radio" aria-checked={on} className={"swatch page-swatch" + (on ? " on" : "")} style={{ background: p.color }} title={t(p.label)} onClick={() => setBanner(p.color)}>
                <span className="sr-only">{t(p.label)}</span>{on && "✓"}</button>); })}
          </div>
          <div className="row" style={{ gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <label className="row small" style={{ gap: 8, margin: 0 }}>{t("Custom banner colour")}
              <input type="color" aria-label={t("Custom banner colour")} value={bannerNow && isHex(bannerNow) ? bannerNow : "#3e5f9d"} onChange={(e) => setBanner(e.target.value)} style={{ width: 48, height: 32, padding: 2 }} />
            </label>
            {bannerNow && <code className="small no-i18n">{bannerNow}</code>}
          </div>
          {overridden.length > 0 && <p className="small muted" style={{ marginTop: 8 }}>{t("Pages with their own banner colour")}: {overridden.length}{" "}
            <button type="button" className="ghost small" onClick={() => preview({ ...a, banners: {} })}>{t("Clear page colours")}</button></p>}
        </section>

        <section className="appearance-section">
        <h3>{t("Accent colour")}</h3>
        <p className="small muted">{t("Choose the colour used for buttons, links, highlights and the active menu item. It is adjusted automatically so text stays readable in light and dark mode.")}</p>
        <div className="swatches accent-swatches" role="radiogroup" aria-label={t("Accent colour")}>
          {PRESETS.map((p) => {
            const on = a.color.toLowerCase() === p.color;
            return (
              <button key={p.id} role="radio" aria-checked={on} className={"swatch" + (on ? " on" : "")} style={{ background: p.color }} title={t(p.label)} onClick={() => preview({ ...a, color: p.color })}>
                <span className="sr-only">{t(p.label)}</span>{on && "✓"}
              </button>
            );
          })}
        </div>
        <div className="row" style={{ gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <label className="row small" style={{ gap: 8, margin: 0 }}>{t("Custom colour")}
            <input type="color" aria-label={t("Custom colour")} value={isHex(a.color) ? a.color : DEFAULT_APPEARANCE.color} onChange={(e) => preview({ ...a, color: e.target.value })} style={{ width: 48, height: 32, padding: 2 }} />
          </label>
          <code className="small no-i18n">{a.color}</code>
        </div>
        {!a.page && <label className="row small" style={{ gap: 8, marginTop: 12 }}>
          <input type="checkbox" style={{ width: "auto" }} checked={a.tint} onChange={(e) => preview({ ...a, tint: e.target.checked })} />
          {t("Tint the page background with this colour")}
        </label>}
        </section>
        <div className="card appearance-preview" style={{ marginTop: 12 }}>
          <div className="small muted">{t("Preview")}</div>
          <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <button className="primary" type="button">{t("Primary button")}</button><button type="button">{t("Button")}</button>
            <a href="#/guide" onClick={(e) => e.preventDefault()}>{t("A link")}</a><span className="badge">{t("Badge")}</span>
          </div>
        </div>
        <div className="row spread" style={{ marginTop: 14 }}>
          <button className="ghost" disabled={busy} onClick={() => { preview(DEFAULT_APPEARANCE); void save(null); }}>{t("Reset to default")}</button>
          <div className="row"><button onClick={cancel}>{t("Cancel")}</button><button className="primary" disabled={busy} onClick={() => save(a)}>{t("Save")}</button></div>
        </div>
      </div>
    </div>
  );
}
