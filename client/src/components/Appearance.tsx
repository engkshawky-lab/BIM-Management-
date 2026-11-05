import { useState } from "react";
import { useSession } from "../App";
import { t } from "../i18n";
import { api } from "../lib/api";
import { applyAppearance } from "../lib/appearance";
import { DEFAULT_APPEARANCE, PRESETS, isHex, type Appearance } from "../../../shared/palette";
import { useDialog } from "./Dialog";

// Theme colour picker: presets or any colour, optional tinted background. Changes preview live; Save stores the choice
// on the account so it follows the user to other devices; Cancel restores what was there.

export function AppearanceDialog({ onClose }: { onClose: () => void }) {
  const { user, setUser, toast } = useSession();
  const saved: Appearance = user.appearance ?? DEFAULT_APPEARANCE;
  const [a, setA] = useState<Appearance>(saved);
  const [busy, setBusy] = useState(false);
  const preview = (next: Appearance) => { setA(next); applyAppearance(next); };
  const cancel = () => { applyAppearance(user.appearance ?? null); onClose(); };
  const dlg = useDialog(cancel);
  const save = async (value: Appearance | null) => {
    setBusy(true);
    try {
      const r = await api<{ user: typeof user }>("/profile", { method: "PUT", body: { appearance: value } });
      setUser(r.user); applyAppearance(value); toast(t("Theme colour saved")); onClose();
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  return (
    <div className="modal-bg" onClick={cancel}>
      <div className="modal" ref={dlg} role="dialog" aria-modal="true" aria-labelledby="appearance-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="appearance-title" style={{ marginTop: 0 }}>{t("Theme colour")}</h2>
        <p className="small muted">{t("Choose the colour used for buttons, links, highlights and the active menu item. It is adjusted automatically so text stays readable in light and dark mode.")}</p>
        <div className="swatches" role="radiogroup" aria-label={t("Theme colour")}>
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
            <input type="color" value={isHex(a.color) ? a.color : DEFAULT_APPEARANCE.color} onChange={(e) => preview({ ...a, color: e.target.value })} style={{ width: 48, height: 32, padding: 2 }} />
          </label>
          <code className="small no-i18n">{a.color}</code>
        </div>
        <label className="row small" style={{ gap: 8, marginTop: 12 }}>
          <input type="checkbox" style={{ width: "auto" }} checked={a.tint} onChange={(e) => preview({ ...a, tint: e.target.checked })} />
          {t("Tint the page background with this colour")}
        </label>
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
