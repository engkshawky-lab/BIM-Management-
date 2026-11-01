import { beforeEach, describe, expect, it, vi } from "vitest";

const settings: Record<string, unknown> = { errorAlerts: true, alertWebhook: "https://hooks.test/x", alertEmail: "", siteName: "Portal" };
vi.mock("./appSettings", () => ({ setting: (k: string) => settings[k] }));
vi.mock("./mailer", () => ({ mailEnabled: () => false, publicUrl: () => "", sendMail: vi.fn() }));
const { _resetAlerts, recentErrors, reportError } = await import("./alerts");

describe("error alerts", () => {
  const fetchMock = vi.fn(async () => new Response("ok"));
  beforeEach(() => { _resetAlerts(); fetchMock.mockClear(); vi.stubGlobal("fetch", fetchMock); settings.errorAlerts = true; });

  it("keeps a list of recent errors and counts repeats", () => {
    reportError("server", new Error("boom"), "GET /api/x", "abc", 1000);
    reportError("server", new Error("boom"), "GET /api/x", "def", 2000);
    reportError("page", new Error("crash"), "/#/projects", undefined, 3000);
    const list = recentErrors();
    expect(list).toHaveLength(2);
    expect(list[0].message).toBe("crash");
    expect(list[1]).toMatchObject({ count: 2, requestId: "def" });
  });
  it("sends each kind of error at most once an hour", () => {
    reportError("server", new Error("boom"), "a", undefined, 0);
    reportError("server", new Error("boom"), "a", undefined, 60_000);
    reportError("server", new Error("other"), "a", undefined, 60_000);
    reportError("server", new Error("boom"), "a", undefined, 3_700_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body).text).toContain("Error: boom");
  });
  it("sends nothing when alerts are off", () => {
    settings.errorAlerts = false;
    reportError("server", new Error("boom"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(recentErrors()).toHaveLength(1);
  });
});
