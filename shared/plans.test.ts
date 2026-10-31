import { describe, expect, it } from "vitest";
import { canOpen, cheapestFor, cleanAccess, defaultPlansFor, sectionForApi } from "./access";
import { DEFAULT_PLANS, UNLIMITED, capacityRows, limitText, mergePlans, normalizePlanId, priceText } from "./plans";

describe("plans", () => {
  it("has Free, Starter, Professional and Expert at the agreed yearly prices", () => {
    expect(DEFAULT_PLANS.map((p) => [p.name, priceText(p)])).toEqual([["Free", "Free"], ["Starter", "$75 / year"], ["Professional", "$150 / year"], ["Expert", "$250 / year"]]);
  });
  it("shows Contact us when a price is not set", () => {
    expect(priceText({ ...DEFAULT_PLANS[1]!, price: { ...DEFAULT_PLANS[1]!.price, amount: null } })).toBe("Contact us");
  });
  it("maps the old Enterprise plan to Expert and unknown ids to Free", () => {
    expect(normalizePlanId("enterprise")).toBe("expert");
    expect(normalizePlanId("gold")).toBe("free");
  });
  it("merges an administrator's edits over the defaults", () => {
    const p = mergePlans({ starter: { price: { amount: 90 }, features: ["One"] } });
    expect(p[1]!.price).toMatchObject({ amount: 90, currency: "USD", period: "year" });
    expect(p[1]!.features).toEqual(["One"]);
    expect(p[2]!.price.amount).toBe(150);
  });
  it("writes unlimited limits as Unlimited and builds one capacity cell per plan", () => {
    expect(limitText(UNLIMITED)).toBe("Unlimited");
    for (const r of capacityRows(DEFAULT_PLANS)) expect(r.cells).toHaveLength(4);
  });
});

describe("section access", () => {
  it("opens the basics on Free and the advanced tools only on Expert", () => {
    expect(defaultPlansFor("s.19650.process")).toEqual(["free", "starter", "pro", "expert"]);
    expect(defaultPlansFor("s.learn")).toEqual(["starter", "pro", "expert"]);
    expect(defaultPlansFor("x.bepwriter")).toEqual(["pro", "expert"]);
    expect(defaultPlansFor("t.eir")).toEqual(["pro", "expert"]);
    expect(defaultPlansFor("c.acc")).toEqual(["expert"]);
    expect(defaultPlansFor("p.files")).toContain("free");
  });
  it("uses the administrator's ticks when saved, and names the cheapest plan to upgrade to", () => {
    const access = { "x.bepwriter": ["starter", "expert"] as never };
    expect(canOpen("x.bepwriter", "starter", access)).toBe(true);
    expect(canOpen("x.bepwriter", "pro", access)).toBe(false);
    expect(cheapestFor("x.audit")).toBe("expert");
  });
  it("drops unknown plan ids and bad keys from a saved map", () => {
    expect(cleanAccess({ "x.audit": ["pro", "gold"], "bad key!": ["pro"] })).toEqual({ "x.audit": ["pro"] });
  });
  it("finds the section behind paid API calls", () => {
    expect(sectionForApi("/ai/tools/eir-writer")).toBe("x.eirwriter");
    expect(sectionForApi("/projects/abc/agent")).toBe("x.agent");
    expect(sectionForApi("/projects/abc/files")).toBeNull();
  });
});
