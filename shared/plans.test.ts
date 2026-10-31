import { describe, expect, it } from "vitest";
import { PLANS, PLAN_COMPARISON, UNLIMITED, limitText, priceText } from "./plans";

describe("plans", () => {
  it("shows Free, a formatted price, or Contact us", () => {
    expect(priceText(PLANS[0]!)).toBe("Free");
    expect(priceText({ ...PLANS[1]!, price: { ...PLANS[1]!.price, amount: 49 } })).toBe("$49 / month");
    expect(priceText({ ...PLANS[1]!, price: { ...PLANS[1]!.price, amount: null } })).toBe("Contact us");
  });
  it("writes unlimited limits as Unlimited", () => {
    expect(limitText(UNLIMITED)).toBe("Unlimited");
    expect(limitText(1000)).toBe("1,000");
  });
  it("has one comparison cell per plan, and the capacity rows match the plan limits", () => {
    for (const g of PLAN_COMPARISON) for (const r of g.rows) expect(r.cells).toHaveLength(PLANS.length);
    const projects = PLAN_COMPARISON[0]!.rows.find((r) => r.label === "Projects you own")!;
    expect(projects.cells).toEqual(PLANS.map((p) => limitText(p.projects)));
  });
});
