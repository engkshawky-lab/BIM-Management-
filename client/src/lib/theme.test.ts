import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const bootstrap = readFileSync("client/public/theme.js", "utf8");
function browser(saved: string | null, dark: boolean, blocked = false) {
  const root = { dataset: { theme: "" } };
  const listeners: Record<string, (event?: { key: string | null }) => void> = {};
  const system = { matches: dark, addEventListener: (_: string, fn: () => void) => { listeners.system = fn; } };
  runInNewContext(bootstrap, {
    document: { documentElement: root }, Event: class {},
    localStorage: { getItem: () => { if (blocked) throw new Error("blocked"); return saved; } },
    window: { matchMedia: () => system, dispatchEvent: () => {}, addEventListener: (name: string, fn: () => void) => { listeners[name] = fn; } },
  });
  return { root, system, listeners, save: (value: string | null) => { saved = value; } };
}

describe("theme bootstrap", () => {
  it("defaults to the OS and follows changes until a choice is saved", () => {
    const b = browser(null, true);
    expect(b.root.dataset.theme).toBe("dark");
    b.system.matches = false; b.listeners.system();
    expect(b.root.dataset.theme).toBe("light");
    b.save('"dark"'); b.listeners.system();
    expect(b.root.dataset.theme).toBe("dark");
  });
  it.each(['"light"', "light"])("restores a light preference %s before rendering", (saved) => {
    expect(browser(saved, true).root.dataset.theme).toBe("light");
  });
  it("ignores invalid preferences and supports unavailable storage", () => {
    expect(browser("invalid", false).root.dataset.theme).toBe("light");
    expect(browser(null, true, true).root.dataset.theme).toBe("dark");
  });
  it("syncs another tab and returns to OS when the preference is cleared", () => {
    const b = browser('"dark"', false);
    b.save('"light"'); b.listeners.storage({ key: "bim:theme" });
    expect(b.root.dataset.theme).toBe("light");
    b.save(null); b.system.matches = true; b.listeners.storage({ key: null });
    expect(b.root.dataset.theme).toBe("dark");
  });
});

// Check actual CSS tokens, including the darkest/lightest content surface.
const css = readFileSync("client/src/styles.css", "utf8");
function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)!.map((c) => parseInt(c, 16) / 255)
    .map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
describe("theme contrast", () => {
  for (const [name, selector] of [["light", ":root {"], ["dark", ':root[data-theme="dark"] {']]) {
    const block = css.slice(css.indexOf(selector)).split("}")[0];
    const tokens = Object.fromEntries([...block.matchAll(/--([\w-]+): (#[a-f\d]{6});/gi)].map((m) => [m[1], m[2]]));
    it(`${name} body and muted text meet AA on all content surfaces`, () => {
      for (const fg of ["text", "muted", "text-secondary", "accent", "ok", "warn", "danger", "info", "purple", "teal", "orange"]) {
        for (const bg of ["bg", "panel", "surface", "surface-2", "surface-3"]) {
          expect(contrast(tokens[fg], tokens[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
    it(`${name} solid accent and status labels meet AA`, () => {
      for (const bg of ["accent", "ok", "warn", "danger"]) {
        expect(contrast(tokens[`on-${bg}`], tokens[bg]), bg).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
