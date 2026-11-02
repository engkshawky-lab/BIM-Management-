import { describe, expect, test } from "vitest";
import { base, body, json, request, unknownEmail } from "./http";
import { adminReads, families } from "./routes";

describe("A: anonymous deployment checks", () => {
  test("health confirms the database answers", async () => {
    expect(await body(await request("/api/health"))).toEqual({ ok: true });
  });

  test("SPA index and every referenced script/stylesheet load with cache headers", async () => {
    const response = await request("/");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/text\/html/);
    expect(response.headers.get("cache-control")).toMatch(/no-cache/);
    const html = await response.text();
    expect(html).toMatch(/<div id="root"/);
    const assets = [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["'][^>]*>/g)].map((m) => m[1]);
    expect(assets.length).toBeGreaterThan(0);
    for (const asset of new Set(assets)) {
      expect(new URL(asset, base).origin).toBe(base);
      const res = await request(asset);
      expect(res.status, asset).toBe(200);
      expect(res.headers.get("content-type"), asset).toMatch(asset.includes(".css") ? /text\/css/ : /(?:application|text)\/javascript/);
      if (new URL(asset, base).pathname.startsWith("/assets/")) {
        expect(res.headers.get("cache-control"), asset).toMatch(/immutable/);
        expect(res.headers.get("cache-control"), asset).toMatch(/max-age=31536000/);
      } else {
        // Unhashed public scripts (theme.js) change between releases and cache for one hour.
        expect(res.headers.get("cache-control"), asset).toMatch(/max-age=3600(?:,|$)/);
        expect(res.headers.get("cache-control"), asset).not.toMatch(/immutable/);
      }
      expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(0);
    }
  });

  test.each([
    ["/", /ISO 19650.*BIM teams/], ["/pricing", /Plans and pricing/], ["/about", /About/],
    ["/legal/privacy", /Privacy/], ["/legal/terms", /Terms/],
    ["/legal/cookies", /Cookie/], ["/legal/notices", /Legal/],
    ["/login", /Sign in/], ["/signup", /Create an account/],
  ])("public page %s has page-specific metadata", async (path, title) => {
    const res = await request(path);
    // Pricing is explicitly optional in public settings.
    if (path === "/pricing" && res.status === 302) {
      const site = await body(await request("/api/public/site"));
      expect(site.settings.showPricing).toBe(false);
      expect(res.headers.get("location")).toBe("/");
      return;
    }
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const html = await res.text();
    expect(html.match(/<title>([^<]+)<\/title>/)?.[1]).toMatch(title);
    expect(html).toMatch(/<meta name="description" content="[^"]{20,}"/);
    expect(html).toMatch(/<meta property="og:title" content="[^"]+"/);
    expect(html).toMatch(/<meta property="og:description" content="[^"]+"/);
    if (path === "/login" || path === "/signup") expect(html).toContain('name="robots" content="noindex"');
    else expect(html).toContain(`rel="canonical" href="${base}${path}"`);
  });

  test("robots and sitemap advertise this deployment", async () => {
    const robots = await request("/robots.txt");
    expect(robots.status).toBe(200);
    expect(robots.headers.get("content-type")).toMatch(/text\/plain/);
    expect(await robots.text()).toContain(`Sitemap: ${base}/sitemap.xml`);
    const sitemap = await request("/sitemap.xml");
    expect(sitemap.status).toBe(200);
    expect(sitemap.headers.get("content-type")).toMatch(/(?:application|text)\/xml/);
    const xml = await sitemap.text();
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const path of ["/", "/about", "/legal/privacy", "/legal/terms", "/legal/cookies", "/legal/notices"]) expect(locations).toContain(base + path);
    for (const location of locations) expect(new URL(location).origin).toBe(base);
  });

  test.each(["/", "/api/health"])("security headers on %s", async (path) => {
    const res = await request(path);
    expect(res.headers.get("content-security-policy")).toMatch(/default-src/);
    expect(res.headers.get("x-frame-options")).toMatch(/^(DENY|SAMEORIGIN)$/i);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toMatch(/^(no-referrer|same-origin|strict-origin(?:-when-cross-origin)?)$/);
    expect(res.headers.get("permissions-policy")).toBeTruthy();
    if (base.startsWith("https:")) expect(res.headers.get("strict-transport-security")).toMatch(/max-age=[1-9]\d+/);
  });

  // Anonymous callers hit the /api sign-in gate first (401), so unknown routes are not revealed; signed-in
  // callers get the 404 handler. Either way the answer must be JSON, never the SPA's HTML.
  test("unknown API is a JSON error (401 anonymous / 404 signed in), never SPA HTML", async () => {
    const res = await request("/api/zz-smoke-nonexistent");
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect(await res.json()).toHaveProperty("error");
    expect([401, 404]).toContain(res.status);
  });

  test.each(families)("protected router $name: $method $path", async ({ method, path }) => {
    expect(await body(await request(path, method === "GET" ? {} : json(method, {})), 401)).toHaveProperty("error");
  });
  test("account profile export requires a session", async () => {
    expect(await body(await request("/api/profile/export"), 401)).toHaveProperty("error");
  });
  test.each(adminReads)("admin read $path is inaccessible", async ({ path }) => {
    const res = await request(path);
    // Account's admin/errors is mounted before the global session guard and returns 403.
    expect([401, 403]).toContain(res.status);
    expect(await body(res, res.status)).toHaveProperty("error");
  });

  test("wrong credentials return an error without issuing a cookie", async () => {
    const res = await request("/api/auth/login", json("POST", { email: unknownEmail, password: "Wrong-Smoke-Password" }));
    expect(res.headers.getSetCookie()).toEqual([]);
    expect(await body(res, 401)).toEqual({ error: "Incorrect email or password." });
  });
  test.skip("pending approval login requires a provisioned pending account/password; never create one");

  test.each([
    { email: "invalid-email", password: "invalid" },
    { email: unknownEmail, password: "short" },
  ])("registration rejects invalid input before insertion %#", async (input) => {
    // Both payloads always have a short password. auth.ts parses before any DB write/email.
    const res = await request("/api/auth/register", json("POST", { name: "ZZ Smoke", ...input }));
    expect(res.headers.getSetCookie()).toEqual([]);
    const result = await body(res, 400);
    expect(result.error).toMatch(/password/);
    if (input.email === "invalid-email") expect(result.error).toMatch(/email/);
  });

  test("unknown email reset uses the generic known-account answer", async () => {
    // auth.ts calls sendMail only for an existing enabled user. A UUID at example.com is never registered here.
    // Compare to the two source-defined responses; never request a real user's reset.
    const result = await body(await request("/api/auth/forgot", json("POST", { email: unknownEmail })));
    expect(result.ok).toBe(true);
    expect([
      "If an account exists for that email, we've sent a reset link.",
      "If an account exists for that email, your administrator can send you the reset link.",
    ]).toContain(result.message);
    expect(result).not.toHaveProperty("link");
  });

  test("wrong-type upload is rejected before upload middleware without authentication", async () => {
    // No large payload on a shared deployment: the auth guard precedes multer.
    const form = new FormData();
    form.set("file", new Blob(["ZZ-SMOKE"], { type: "application/x-msdownload" }), "ZZ-SMOKE.exe");
    expect(await body(await request("/api/projects/zz-smoke-nonexistent/files", { method: "POST", body: form }), 401)).toHaveProperty("error");
  });
});
