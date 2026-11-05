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
