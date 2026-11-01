import { describe, expect, it } from "vitest";
import { preflight, sessionSecretProblem } from "./preflight";

const strong = "q8Vw2LzR0pXn7Kc4Ty1Hb6Jm3Fs9Gd5Ue";
const prod = { NODE_ENV: "production", SESSION_SECRET: strong, DATABASE_URL: "mysql://portal:Xk29vLq0aPz@db:3306/portal", PUBLIC_URL: "https://bim.example.org", COOKIE_SECURE: "true" };

describe("preflight", () => {
  it("rejects missing, short, example and predictable session secrets", () => {
    expect(sessionSecretProblem(undefined)).toMatch(/32 characters/);
    expect(sessionSecretProblem("change-me-to-a-long-random-string-of-at-least-32-chars")).toMatch(/example value/);
    expect(sessionSecretProblem("a".repeat(40))).toMatch(/predictable/);
    expect(sessionSecretProblem(strong)).toBeNull();
  });
  it("stops a production install that uses the example secret", () => {
    expect(preflight({ ...prod, SESSION_SECRET: "change-me-to-a-long-random-string-of-at-least-32-chars" }).errors).toHaveLength(1);
  });
  it("is quiet for a well-configured production install", () => {
    expect(preflight(prod)).toEqual({ errors: [], warnings: [] });
  });
  it("warns about launch settings that are still open", () => {
    const w = preflight({ NODE_ENV: "production", SESSION_SECRET: strong, DATABASE_URL: "mysql://portal:portal-change-me@db:3306/portal", PUBLIC_URL: "http://x", CLAUDE_API_KEY: "k", STRIPE_SECRET_KEY: "sk_test_1" }).warnings.join("\n");
    for (const m of [/database password/, /https:\/\//, /COOKIE_SECURE/, /monthly cap/, /STRIPE_WEBHOOK_SECRET/, /test mode/]) expect(w).toMatch(m);
  });
  it("only checks the secret outside production", () => {
    expect(preflight({ SESSION_SECRET: strong })).toEqual({ errors: [], warnings: [] });
  });
});
