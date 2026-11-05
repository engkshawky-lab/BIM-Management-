import { paletteCss, type Appearance } from "../../../shared/palette";

// Applies the user's theme colour. The generated stylesheet is cached in this browser so public/theme.js can apply it
// before the page draws on the next visit (no flash of the default colours); the account keeps the choice itself.

const CSS_KEY = "bim:palette-css";
export function applyAppearance(a: Appearance | null | undefined) {
  const css = a ? paletteCss(a) : "";
  let el = document.getElementById("bim-palette") as HTMLStyleElement | null;
  if (!el && css) { el = document.createElement("style"); el.id = "bim-palette"; document.head.appendChild(el); }
  if (el) el.textContent = css;
  try { if (css) localStorage.setItem(CSS_KEY, css); else localStorage.removeItem(CSS_KEY); } catch { /* storage unavailable */ }
}
