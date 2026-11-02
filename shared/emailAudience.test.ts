import { describe, expect, it } from "vitest";
import { DEFAULT_FILTER, describeFilter, matchesAudience, type Person } from "./emailAudience";

const NOW = Date.parse("2026-11-02T12:00:00Z");
const day = (n: number) => new Date(NOW + n * 864e5).toISOString();
const person = (p: Partial<Person> = {}): Person => ({
  id: "1", name: "Sara Ali", email: "sara@acme.com", organization: "Acme", jobTitle: "BIM Manager", bimRole: null, role: "user", status: "active",
  plan: "free", renewsAt: null, source: "", verified: true, locale: "en", emailPref: "instant", createdAt: day(-100), lastLoginAt: day(-2),
  projects: 1, aiRequests: 0, lessons: 3, ...p,
});
const m = (p: Partial<Person>, f = {}) => matchesAudience(person(p), f, NOW);

describe("email audience filter", () => {
  it("defaults to active accounts with email on, without test addresses", () => {
    expect(matchesAudience(person(), DEFAULT_FILTER, NOW)).toBe(true);
    expect(matchesAudience(person({ status: "pending" }), DEFAULT_FILTER, NOW)).toBe(false);
    expect(matchesAudience(person({ emailPref: "off" }), DEFAULT_FILTER, NOW)).toBe(false);
    expect(matchesAudience(person({ email: "x@deleted.invalid" }), DEFAULT_FILTER, NOW)).toBe(false);
    expect(matchesAudience(person({ email: "a@b.example" }), { excludeTest: false }, NOW)).toBe(true);
  });
  it("matches every search word across name, email, organisation and job title", () => {
    expect(m({}, { q: "sara acme" })).toBe(true);
    expect(m({}, { q: "manager" })).toBe(true);
    expect(m({}, { q: "sara omar" })).toBe(false);
  });
  it("filters plans by end date", () => {
    expect(m({ plan: "pro", renewsAt: day(10) }, { planEndsWithinDays: 30 })).toBe(true);
    expect(m({ plan: "pro", renewsAt: day(40) }, { planEndsWithinDays: 30 })).toBe(false);
    expect(m({ plan: "pro", renewsAt: day(-1) }, { planEndsWithinDays: 30 })).toBe(false);
    expect(m({ plan: "pro", renewsAt: day(-1) }, { planState: "expired" })).toBe(true);
    expect(m({ plan: "pro", renewsAt: null }, { planState: "no-end" })).toBe(true);
    expect(m({ plan: "free" }, { planState: "no-end" })).toBe(false);
    expect(m({ plan: "expert" }, { plans: ["pro", "expert"] })).toBe(true);
  });
  it("filters by sign-in, joining date, activity and organisation", () => {
    expect(m({ lastLoginAt: null }, { lastLogin: "never" })).toBe(true);
    expect(m({ lastLoginAt: day(-60) }, { lastLogin: "not-within", lastLoginDays: 30 })).toBe(true);
    expect(m({ lastLoginAt: day(-5) }, { lastLogin: "within", lastLoginDays: 7 })).toBe(true);
    expect(m({ createdAt: "2026-10-31T23:59:00Z" }, { joinedFrom: "2026-10-01", joinedTo: "2026-10-31" })).toBe(true);
    expect(m({ createdAt: "2026-11-01T00:00:00Z" }, { joinedTo: "2026-10-31" })).toBe(false);
    expect(m({ projects: 0 }, { projects: "some" })).toBe(false);
    expect(m({ aiRequests: 4 }, { ai: "used" })).toBe(true);
    expect(m({ lessons: 0 }, { learning: "started" })).toBe(false);
    expect(m({}, { organizations: ["ACME"] })).toBe(true);
    expect(m({ verified: false }, { verified: "yes" })).toBe(false);
    expect(m({ locale: "ar" }, { locales: ["ar"] })).toBe(true);
  });
  it("describes the active conditions", () => {
    expect(describeFilter({ ...DEFAULT_FILTER, plans: ["pro"], lastLogin: "not-within", lastLoginDays: 60 }))
      .toEqual(["Status: active", "Plan: Professional", "Email setting: instant, digest", "Not signed in for 60 days", "Test and deleted addresses left out"]);
  });
});
