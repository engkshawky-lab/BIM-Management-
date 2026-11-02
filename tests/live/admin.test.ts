import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { adminEnabled, body, Session } from "./http";

describe.skipIf(!adminEnabled)("C: admin reads only", () => {
  const session = new Session();
  beforeAll(async () => { await session.login(process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!); });
  afterAll(async () => { await session.logout(); });
  test("users and counts load", async () => {
    const result = await body(await session.request("/api/admin/users"));
    expect(Array.isArray(result.users)).toBe(true);
    expect(result.users.length).toBeGreaterThan(0);
    for (const user of result.users) expect(typeof user.projects).toBe("number");
    const counts = await body(await session.request("/api/admin/overview"));
    for (const key of ["users", "projects", "documents", "files"]) expect(typeof counts[key]).toBe("number");
  });
  test("pending queue loads", async () => {
    expect(Array.isArray((await body(await session.request("/api/admin/pending"))).users)).toBe(true);
  });
  test("settings load without modification", async () => {
    const result = await body(await session.request("/api/admin/settings"));
    expect(result.settings).toBeTypeOf("object");
    expect(Array.isArray(result.integrations)).toBe(true);
  });
});
