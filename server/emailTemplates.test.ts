import { describe, expect, it } from "vitest";
import { renderLayout } from "./emailLayout";
import { draftProblems, personalize, placeholderValues, TEMPLATES } from "./emailTemplates";

const vars = placeholderValues({ name: "Sara Ali", email: "sara@acme.com", organization: "Acme", plan: "pro", renewsAt: new Date(Date.UTC(2027, 0, 31)), portalUrl: "https://iso.example.com/" });

describe("admin email mockups", () => {
  it("fills placeholders everywhere except the banner picture", () => {
    const m = personalize({ subject: "Hi {{firstName}}", heading: "{{plan}} until {{planEnds}}", intro: "{{ email }} {{unknown}}", rows: [["Org", "{{organization}}"]], button: { label: "Go", url: "{{portalUrl}}/#/billing" }, image: { src: "data:image/png;base64,{{name}}" } }, vars);
    expect(m.subject).toBe("Hi Sara");
    expect(m.heading).toBe("Professional until 31 January 2027");
    expect(m.intro).toBe("sara@acme.com {{unknown}}");
    expect(m.rows).toEqual([["Org", "Acme"]]);
    expect(m.button?.url).toBe("https://iso.example.com/#/billing");
    expect(m.image?.src).toBe("data:image/png;base64,{{name}}");
  });
  it("leaves the plan end empty on Free so its detail row disappears", () => {
    expect(placeholderValues({ name: "A", email: "a@x.com", organization: "", plan: "free", renewsAt: null, portalUrl: "https://x" }).planEnds).toBe("");
  });
  it("flags notes left in square brackets and unknown placeholders", () => {
    const offer = TEMPLATES.find((t) => t.id === "offer")!;
    expect(draftProblems(offer.blocks)[0]).toContain("[CODE]");
    expect(draftProblems({ subject: "s", heading: "h", intro: "{{nope}}" })).toEqual(["Unknown placeholders: {{nope}}"]);
    expect(draftProblems(TEMPLATES.find((t) => t.id === "renewal")!.blocks)).toEqual([]);
  });
  it("every mockup renders, and the Arabic one right to left", () => {
    for (const t of TEMPLATES) expect(renderLayout(personalize(t.blocks, vars)).html).toContain("<h1");
    expect(renderLayout(TEMPLATES.find((t) => t.id === "arabic")!.blocks).html).toContain('<html lang="ar" dir="rtl"');
  });
  it("renders a banner under the logo, escaped", () => {
    const { html } = renderLayout({ subject: "s", heading: "h", intro: "i", image: { src: "https://cdn.example.com/a.png", alt: 'A "big" day', url: "https://x.com" } });
    expect(html).toContain('<a href="https://x.com" style="text-decoration:none;"><img src="https://cdn.example.com/a.png" width="598" alt="A &quot;big&quot; day"');
    expect(html.indexOf("a.png")).toBeLessThan(html.indexOf("<h1"));
  });
});
