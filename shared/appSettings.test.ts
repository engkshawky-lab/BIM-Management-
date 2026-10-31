import { describe, expect, it } from "vitest";
import { SETTINGS, baseSettings, cleanSettings, publicSettings } from "./appSettings";

describe("portal settings", () => {
  it("uses the defaults, and environment values where set", () => {
    const base = baseSettings({ BILLING: "on", AI_PER_MINUTE: "5", CLAUDE_MODEL: "claude-sonnet-5-5", SCHEDULER: "off" });
    expect(base.billing).toBe(true);
    expect(base.aiPerMinute).toBe(5);
    expect(base.claudeModel).toBe("claude-sonnet-5-5");
    expect(base.scheduler).toBe(false);
    expect(baseSettings({}).allowSignups).toBe(true);
  });
  it("keeps only valid values from the admin form", () => {
    const out = cleanSettings({
      billing: "yes", aiPerMinute: 5000, digestHourUtc: -3, defaultLocale: "fr", contactEmail: "not-an-email",
      publicUrl: "javascript:alert(1)", announcementLink: "javascript:x", claudeModel: "claude-sonnet-5-5", siteName: "  My portal  ", unknown: 1,
    });
    expect(out).toEqual({ aiPerMinute: 1000, digestHourUtc: 0, claudeModel: "claude-sonnet-5-5", siteName: "My portal" });
  });
  it("sends only public settings to browsers", () => {
    const pub = publicSettings(baseSettings({}));
    expect(pub).toHaveProperty("siteName");
    expect(pub).toHaveProperty("announcementText");
    for (const k of ["publicUrl", "claudeModel", "aiPerMinute", "maxUploadMb", "logRequests"]) expect(pub).not.toHaveProperty(k);
  });
  it("gives every select a default that is one of its options", () => {
    for (const s of SETTINGS.filter((x) => x.type === "select")) expect(s.options!.map((o) => o.value)).toContain(s.default);
  });
});
