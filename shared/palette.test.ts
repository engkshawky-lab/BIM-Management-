import { describe, expect, it } from "vitest";
import { PRESETS, contrast, paletteCss, paletteVars } from "./palette";

describe("theme colour", () => {
  it("keeps text readable for every preset and for extreme custom colours, in light and dark", () => {
    for (const color of [...PRESETS.map((p) => p.color), "#ffff00", "#00ff00", "#000000", "#ffffff", "#7fffd4"]) for (const tint of [false, true]) {
      const v = paletteVars({ color, tint });
      for (const [vars, surfaces] of [[v.light, [v.light["--surface"] ?? "#f1f5f6", v.light["--bg"] ?? "#dfe7e8"]], [v.dark, [v.dark["--surface"] ?? "#1e2d39", v.dark["--bg"] ?? "#111e28"]]] as const) {
        expect(contrast(vars["--accent"], vars["--on-accent"]), `${color} on-accent`).toBeGreaterThanOrEqual(4.5);
        for (const s of surfaces) expect(contrast(vars["--accent"], s), `${color} link on ${s}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it("tints the surfaces only when asked, and the default needs no override", () => {
    expect(paletteVars({ color: "#b33a3a", tint: false }).light["--bg"]).toBeUndefined();
    expect(paletteVars({ color: "#b33a3a", tint: true }).light["--bg"]).toMatch(/^#[0-9a-f]{6}$/);
    expect(paletteCss({ color: "#3e5f9d", tint: false })).toBe("");
    expect(paletteCss({ color: "#b33a3a", tint: false })).toMatch(/^:root:root\{--accent:#[0-9a-f]{6};.*:root:root\[data-theme="dark"\]\{/);
  });
  it("falls back to the default colour for invalid input", () => {
    expect(paletteVars({ color: "red", tint: false }).light["--accent"]).toBe(paletteVars({ color: "#3e5f9d", tint: false }).light["--accent"]);
  });
});

describe("page colour", () => {
  const text = { light: ["#21313d", "#4d6070", "#46596a"], dark: ["#eff5f8", "#9fb2c0", "#b7c7d3"] };
  it("keeps every kind of text readable on every surface, for presets and extreme colours, in light and dark", async () => {
    const { PAGE_PRESETS } = await import("./palette");
    for (const page of [...PAGE_PRESETS.map((p) => p.color), "#000000", "#ff0000", "#1a3a8a", "#ffff00", "#ffffff"]) for (const color of ["#3e5f9d", "#ffff00", "#000000"]) {
      const v = paletteVars({ color, tint: false, page });
      for (const mode of ["light", "dark"] as const) for (const k of ["--bg", "--surface", "--surface-2", "--surface-3", "--panel"]) {
        for (const t of text[mode]) expect(contrast(t, v[mode][k]!), `${mode} ${page} ${k} text ${t}`).toBeGreaterThanOrEqual(4.5);
        if (k !== "--surface-2" && k !== "--panel") expect(contrast(v[mode]["--accent"]!, v[mode][k]!), `${mode} ${page} accent on ${k}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it("replaces the tint, and is part of the stylesheet even with the default accent", () => {
    expect(paletteVars({ color: "#3e5f9d", tint: true, page: "#e2f1e8" }).light["--bg"]).toMatch(/^#/);
    expect(paletteCss({ color: "#3e5f9d", tint: false, page: "#e2f1e8" })).toContain("--bg:");
    expect(paletteCss({ color: "#3e5f9d", tint: false, page: null })).toBe("");
  });
});

describe("header banner colour", () => {
  it("colours every banner, or one page's, with readable text", async () => {
    const { bannerCss, bannerText, bannerColours } = await import("./palette");
    expect(bannerText("#1f2f55")).toBe("#ffffff");
    expect(bannerText("#c3b5f2")).toBe("#16212b");
    for (const c of ["#ffff00", "#c3b5f2", "#1f2f55", "#7f7f7f", "#ff0000", "#3e5f9d"]) { const b = bannerColours(c); expect(contrast(b.text, b.bg), c).toBeGreaterThanOrEqual(4.5); }
    const all = bannerCss({ color: "#3e5f9d", tint: false, banner: "#1f2f55" });
    expect(all).toContain(":root:root .hub-hero{background:#1f2f55;color:#ffffff}");
    const one = bannerCss({ color: "#3e5f9d", tint: false, banners: { "s.hub.implementation": "#c3b5f2", 'bad"]{x}': "#000000" } });
    expect(one).toContain(':root:root[data-page="s.hub.implementation"] .hub-hero{background:#c3b5f2;color:#16212b}');
    expect(one).not.toContain("bad");
    expect(paletteCss({ color: "#3e5f9d", tint: false, banner: "#1f2f55" })).toBe(all);
  });
});
