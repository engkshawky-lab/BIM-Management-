import { expect } from "vitest";

export const base = new URL(process.env.BASE_URL || "http://localhost:3001").origin;
export const unknownEmail = `zz-smoke-unknown-${crypto.randomUUID()}@example.com`;
export const userEnabled = !!(process.env.TEST_EMAIL && process.env.TEST_PASSWORD);
export const adminEnabled = !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
export const aiEnabled = process.env.RUN_AI === "1" && userEnabled;

// Serial files/tests plus a delay keep the suite well below the sign-in/reset limits.
export async function request(path: string, init: RequestInit = {}, cookie = "") {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const headers = new Headers(init.headers);
  if (cookie) headers.set("Cookie", cookie);
  return fetch(new URL(path, base), { ...init, headers, redirect: "manual", signal: AbortSignal.timeout(25_000) });
}

export function json(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export async function body(response: Response, status = 200) {
  // Never print response bodies: admin/profile data and session tokens are private.
  expect(response.status, `HTTP ${response.status} for ${new URL(response.url).pathname}`).toBe(status);
  expect(response.headers.get("content-type")).toMatch(/application\/json/);
  return response.json();
}

export class Session {
  cookie = "";
  async login(email: string, password: string) {
    const response = await request("/api/auth/login", json("POST", { email, password }));
    // Capture before assertions so afterAll can revoke even a malformed successful login.
    const header = response.headers.getSetCookie().find((s) => s.startsWith("portal_session=")) || "";
    this.cookie = header.split(";")[0];
    await body(response);
    expect(!!this.cookie, "login must set a session cookie").toBe(true);
    expect(/;\s*HttpOnly/i.test(header)).toBe(true);
    expect(/;\s*SameSite=Lax/i.test(header)).toBe(true);
    if (base.startsWith("https:")) expect(/;\s*Secure/i.test(header)).toBe(true);
  }
  request(path: string, init?: RequestInit) { return request(path, init, this.cookie); }
  async logout() {
    if (!this.cookie) return;
    await body(await this.request("/api/auth/logout", { method: "POST" }));
    this.cookie = "";
  }
}
