// User-chosen theme colour: from one colour, derive the accent tokens for the light and dark themes (adjusted until text
// on them and links on the page meet WCAG AA contrast), and optionally tint the page surfaces with the same hue.

export interface Appearance {
  /** accent: buttons, links, highlights */
  color: string;
  /** tint the default surfaces with the accent */
  tint: boolean;
  /** page background colour; replaces the tint when set */
  page?: string | null;
  /** colour of every page's header banner (null = each page keeps its own colour) */
  banner?: string | null;
  /** header banner colour for individual pages, keyed by page key; wins over `banner` */
  banners?: Record<string, string>;
}
export const DEFAULT_APPEARANCE: Appearance = { color: "#3e5f9d", tint: false, page: null };

/** Page background presets (light mode values; dark mode uses a deep shade of the same hue). */
export const PAGE_PRESETS: { id: string; label: string; color: string }[] = [
  { id: "white", label: "White", color: "#ffffff" },
  { id: "paper", label: "Warm paper", color: "#f6f1e7" },
  { id: "sand", label: "Sand", color: "#ece3d2" },
  { id: "mint", label: "Mint", color: "#e2f1e8" },
  { id: "sky", label: "Sky", color: "#e1edf8" },
  { id: "lavender", label: "Lavender", color: "#ebe7f6" },
  { id: "blush", label: "Blush", color: "#f6e5ea" },
  { id: "slate", label: "Cool grey", color: "#e2e7ec" },
  { id: "sage", label: "Sage", color: "#dfe8dc" },
  { id: "peach", label: "Peach", color: "#fbe8da" },
];

export const PRESETS: { id: string; label: string; color: string }[] = [
  { id: "blue", label: "Blue", color: "#3e5f9d" },
  { id: "teal", label: "Teal", color: "#0c7a70" },
  { id: "green", label: "Green", color: "#2e7d4f" },
  { id: "indigo", label: "Indigo", color: "#4f46b8" },
  { id: "purple", label: "Purple", color: "#7b3fb0" },
  { id: "rose", label: "Rose", color: "#b23a62" },
  { id: "red", label: "Red", color: "#b33a3a" },
  { id: "orange", label: "Orange", color: "#b4561a" },
  { id: "gold", label: "Gold", color: "#8a6a12" },
  { id: "slate", label: "Slate", color: "#4a5a6a" },
];

type RGB = [number, number, number];
export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);
const toRgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const toHex = (c: RGB) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
/** a mixed with b: weight 0 = a, 1 = b */
export const mix = (a: string, b: string, w: number) => { const x = toRgb(a), y = toRgb(b); return toHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * w) as RGB); };
const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminance = (hex: string) => { const [r, g, b] = toRgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/** Move `color` toward `toward` until it reaches `ratio` against every background (or as close as possible). */
function reach(color: string, toward: string, backgrounds: string[], ratio: number) {
  for (let w = 0; w <= 1.0001; w += 0.02) {
    const c = mix(color, toward, w);
    if (backgrounds.every((bg) => contrast(c, bg) >= ratio)) return c;
  }
  return toward;
}

// the default palettes' surfaces (client/src/styles.css)
const LIGHT = { bg: "#dfe7e8", panel: "#e8eff0", surface: "#f1f5f6", surface2: "#e5ecec", surface3: "#d9e2e3", border: "#c9d5d8", borderStrong: "#aebdc1" };
const DARK = { bg: "#111e28", panel: "#142430", surface: "#1e2d39", surface2: "#253644", surface3: "#2c3f4e", border: "#2c3e4c", borderStrong: "#415667" };

const rgba = (hex: string, a: number) => `rgba(${toRgb(hex).join(",")},${a})`;

// body and secondary text of the default themes; page colours are adjusted until these stay readable
const LIGHT_TEXT = ["#21313d", "#4d6070", "#46596a"], DARK_TEXT = ["#eff5f8", "#9fb2c0", "#b7c7d3"];

function hsl(hex: string): [number, number, number] {
  const [r, g, b] = toRgb(hex).map((v) => v / 255) as RGB;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, sat, l];
}
function fromHsl(h: number, s: number, l: number): string {
  if (!s) return toHex([l * 255, l * 255, l * 255]);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t: number) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return toHex([f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]);
}

/** Surfaces built from a chosen page colour, lightened (light mode) or deepened (dark mode) until text stays readable. */
function pageSurfaces(page: string): { light: Record<string, string>; dark: Record<string, string> } {
  // light: the darkest surface (surface-3) must keep secondary text at 4.5:1 or more
  let bg = page;
  for (let w = 0; w <= 1.0001; w += 0.02) { bg = mix(page, "#ffffff", w); if (LIGHT_TEXT.every((t) => contrast(t, mix(bg, "#000000", 0.05)) >= 4.5)) break; }
  const light = {
    "--bg": bg, "--panel": mix(bg, "#ffffff", 0.3), "--surface": mix(bg, "#ffffff", 0.62), "--surface-2": mix(bg, "#ffffff", 0.15),
    "--surface-3": mix(bg, "#000000", 0.05), "--border": mix(bg, "#000000", 0.13), "--border-strong": mix(bg, "#000000", 0.25),
    "--hero-a": mix(bg, "#ffffff", 0.15), "--hero-b": bg,
  };
  // dark: the page colour's hue at a deep lightness, so light text stays readable (4.5:1 on every surface)
  const [h, sat] = hsl(page);
  let d = DARK.bg;
  for (const l of [0.13, 0.11, 0.09, 0.07]) { d = fromHsl(h, Math.min(sat, 0.4), l); if (DARK_TEXT.every((t) => contrast(t, mix(d, "#ffffff", 0.14)) >= 4.5)) break; }
  const dark = {
    "--bg": d, "--panel": mix(d, "#ffffff", 0.03), "--surface": mix(d, "#ffffff", 0.07), "--surface-2": mix(d, "#ffffff", 0.1),
    "--surface-3": mix(d, "#ffffff", 0.14), "--border": mix(d, "#ffffff", 0.14), "--border-strong": mix(d, "#ffffff", 0.26),
    "--hero-a": mix(d, "#ffffff", 0.1), "--hero-b": d,
  };
  return { light, dark };
}

/** CSS variables for the light and dark themes. */
export function paletteVars(a: Appearance): { light: Record<string, string>; dark: Record<string, string> } {
  const base = isHex(a.color) ? a.color.toLowerCase() : DEFAULT_APPEARANCE.color;
  const tint = (s: typeof LIGHT, w: number): Record<string, string> => a.tint ? {
    "--bg": mix(s.bg, base, w * 1.2), "--panel": mix(s.panel, base, w), "--surface": mix(s.surface, base, w * 0.6), "--surface-2": mix(s.surface2, base, w),
    "--surface-3": mix(s.surface3, base, w * 1.3), "--border": mix(s.border, base, w * 1.4), "--border-strong": mix(s.borderStrong, base, w * 1.4),
  } : {};
  const ps = a.page && isHex(a.page) ? pageSurfaces(a.page.toLowerCase()) : null;
  const lightT = ps?.light ?? tint(LIGHT, 0.07), darkT = ps?.dark ?? tint(DARK, 0.09);
  const lightSurfaces = [lightT["--surface"] ?? LIGHT.surface, lightT["--bg"] ?? LIGHT.bg, ...(lightT["--surface-3"] ? [lightT["--surface-3"]] : [])];
  const darkSurfaces = [darkT["--surface"] ?? DARK.surface, darkT["--bg"] ?? DARK.bg, ...(darkT["--surface-3"] ? [darkT["--surface-3"]] : [])];
  // light: links/accent readable on the surfaces and white text readable on the accent
  const accent = reach(base, "#000000", [...lightSurfaces, "#ffffff"], 4.5);
  const dAccent = reach(base, "#ffffff", darkSurfaces, 4.5);
  const dOn = contrast(dAccent, "#0d1520") >= 4.5 ? mix(DARK.bg, base, 0.15) : "#ffffff";
  return {
    light: { ...lightT, "--accent": accent, "--accent-strong": mix(accent, "#000000", 0.2), "--on-accent": "#ffffff", "--focus": rgba(accent, 0.22), "--hero-line": accent },
    dark: { ...darkT, "--accent": dAccent, "--accent-strong": mix(dAccent, "#ffffff", 0.3), "--on-accent": contrast(dAccent, dOn) >= 4.5 ? dOn : "#0d1520", "--focus": rgba(dAccent, 0.32), "--hero-line": dAccent },
  };
}

/** A stylesheet overriding the theme tokens; doubled :root beats the base palette regardless of load order. */
export function paletteCss(a: Appearance): string {
  const custom = a.color.toLowerCase() !== DEFAULT_APPEARANCE.color || a.tint || !!(a.page && isHex(a.page));
  const banners = bannerCss(a);
  if (!custom) return banners;
  const v = paletteVars(a);
  const block = (sel: string, vars: Record<string, string>) => `${sel}{${Object.entries(vars).map(([k, x]) => `${k}:${x}`).join(";")}}`;
  return block(":root:root", v.light) + block(':root:root[data-theme="dark"]', v.dark) + banners;
}

const DARK_INK = "#16212b";
/** Text colour for a banner: whichever of white and near-black reads better on it. */
export const bannerText = (c: string) => (contrast("#ffffff", c) >= contrast(DARK_INK, c) ? "#ffffff" : DARK_INK);
/** The banner colour actually used: mid tones are nudged lighter or darker until the text reads at 4.5:1. */
export function bannerColours(c: string): { bg: string; text: string } {
  const text = bannerText(c);
  const bg = reach(c, text === "#ffffff" ? "#000000" : "#ffffff", [text], 4.5);
  return { bg, text };
}
const PAGE_KEY = /^[\w.\-/:]{1,80}$/;

/** Header banner rules: one colour for every page, and per-page overrides (selected by html[data-page]). */
export function bannerCss(a: Appearance): string {
  // the page's own colour (--hub: titles, tabs, table headers) follows the banner, adjusted to read on the surfaces
  const rule = (scope: string, dark: string, chosen: string) => {
    const { bg: c, text: t } = bannerColours(chosen), soft = t === "#ffffff" ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.08)", line = t === "#ffffff" ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.18)";
    const hubLight = reach(chosen, "#000000", [LIGHT.surface, LIGHT.bg], 4.5), hubDark = reach(chosen, "#ffffff", [DARK.surface, DARK.bg], 4.5);
    return `${scope} .hub{--hub:${hubLight} !important}${dark} .hub{--hub:${hubDark} !important}` +
      `${scope} .hub-hero{background:${c};color:${t}}${scope} .hub-hero h1,${scope} .hub-hero .eyebrow,${scope} .hub-hero p{color:${t}}` +
      `${scope} .hub-hero .facts span{background:${soft};border-color:${line};color:${t}}` +
      `${scope} :is(.page-head,.home-head){background:linear-gradient(100deg,${c},${mix(c, t === "#ffffff" ? "#000000" : "#ffffff", 0.12)});color:${t}}` +
      `${scope} :is(.page-head,.home-head) :is(h1,h2,p,span,small,.muted,.eyebrow,.crumbs,.crumbs a,.crumbs b){color:${t}}`;
  };
  let css = a.banner && isHex(a.banner) ? rule(":root:root", ':root:root[data-theme="dark"]', a.banner.toLowerCase()) : "";
  for (const [k, c] of Object.entries(a.banners ?? {})) if (PAGE_KEY.test(k) && isHex(c)) css += rule(`:root:root[data-page="${k}"]`, `:root:root[data-theme="dark"][data-page="${k}"]`, c.toLowerCase());
  return css;
}
