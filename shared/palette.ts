// User-chosen theme colour: from one colour, derive the accent tokens for the light and dark themes (adjusted until text
// on them and links on the page meet WCAG AA contrast), and optionally tint the page surfaces with the same hue.

export interface Appearance { color: string; tint: boolean }
export const DEFAULT_APPEARANCE: Appearance = { color: "#3e5f9d", tint: false };

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

/** CSS variables for the light and dark themes. */
export function paletteVars(a: Appearance): { light: Record<string, string>; dark: Record<string, string> } {
  const base = isHex(a.color) ? a.color.toLowerCase() : DEFAULT_APPEARANCE.color;
  const tint = (s: typeof LIGHT, w: number): Record<string, string> => a.tint ? {
    "--bg": mix(s.bg, base, w * 1.2), "--panel": mix(s.panel, base, w), "--surface": mix(s.surface, base, w * 0.6), "--surface-2": mix(s.surface2, base, w),
    "--surface-3": mix(s.surface3, base, w * 1.3), "--border": mix(s.border, base, w * 1.4), "--border-strong": mix(s.borderStrong, base, w * 1.4),
  } : {};
  const lightT = tint(LIGHT, 0.07), darkT = tint(DARK, 0.09);
  const lightSurfaces = [lightT["--surface"] ?? LIGHT.surface, lightT["--bg"] ?? LIGHT.bg];
  const darkSurfaces = [darkT["--surface"] ?? DARK.surface, darkT["--bg"] ?? DARK.bg];
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
  if (a.color.toLowerCase() === DEFAULT_APPEARANCE.color && !a.tint) return "";
  const v = paletteVars(a);
  const block = (sel: string, vars: Record<string, string>) => `${sel}{${Object.entries(vars).map(([k, x]) => `${k}:${x}`).join(";")}}`;
  return block(":root:root", v.light) + block(':root:root[data-theme="dark"]', v.dark);
}
