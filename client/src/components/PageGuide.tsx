import { useEffect, useState } from "react";
import { getLocale, t } from "../i18n";
import type { GuideText } from "../../../shared/data/pageGuides";
import { Icon } from "../shell/icons";

// "How to use this page": what the page is for, steps, outputs and mandatory inputs, from shared/data/pageGuides.
// The guide text loads on first open so it stays out of the first download.

let cache: typeof import("../../../shared/data/pageGuides") | null = null;
const load = async () => (cache ??= await import("../../../shared/data/pageGuides"));

export function PageGuideButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button className={"fav-btn" + (open ? " on" : "")} aria-expanded={open} aria-controls="page-guide" onClick={onToggle} title={t("How to use this page")}>
      <Icon name="help" size={14} />{t("Guide")}
    </button>
  );
}

export function PageGuidePanel({ pageKey, onClose }: { pageKey: string; onClose: () => void }) {
  const [g, setG] = useState<GuideText | null | undefined>(undefined);
  useEffect(() => { let live = true; load().then((m) => live && setG(m.guideFor(pageKey, getLocale() === "ar" ? "ar" : "en") ?? null)); return () => { live = false; }; }, [pageKey]);
  if (g === undefined) return <div id="page-guide" className="page-guide no-print"><p className="small muted">{t("Loading…")}</p></div>;
  if (g === null) return null;
  return (
    <section id="page-guide" className="page-guide no-print no-i18n" aria-label={t("How to use this page")}>
      <div className="row spread"><b>{t("How to use this page")}</b><button className="ghost small" onClick={onClose}>{t("Close")}</button></div>
      <p className="small">{g.what}</p>
      <div className="page-guide-grid">
        <div><h4>{t("How to use it")}</h4><ol className="small">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
        <div>
          <h4>{t("Mandatory inputs")}</h4>
          {g.required.length ? <ul className="small">{g.required.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="small muted">{t("Nothing is required: this page is for reading or exploring.")}</p>}
          <h4>{t("What you get")}</h4>
          {g.outputs.length ? <ul className="small">{g.outputs.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="small muted">{t("Nothing is saved or produced on this page.")}</p>}
          {!!g.tips?.length && <><h4>{t("Tips")}</h4><ul className="small">{g.tips.map((s) => <li key={s}>{s}</li>)}</ul></>}
        </div>
      </div>
    </section>
  );
}
