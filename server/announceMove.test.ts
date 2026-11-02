import { describe, expect, it } from "vitest";
import { renderLayout } from "./emailLayout";

describe("move announcement", async () => {
  process.argv = [process.argv[0]!, "vitest", "--public-url", "https://iso.example.com"];
  const { message } = await import("../scripts/announce-move");
  it("points at the new address and says the password is unchanged", () => {
    const m = message("Sara", "sara@x.com", "pro", new Date(Date.UTC(2030, 0, 31)));
    expect(m.button?.url).toBe("https://iso.example.com/#/login");
    expect(m.paragraphs?.join(" ")).toContain("same email address and password");
    expect(m.rows).toContainEqual(["Your plan", "Professional"]);
    expect(m.rows).toContainEqual(["Valid until", "31 January 2030"]);
  });
  it("tells people whose plan ended, and shows no plan rows for Free", () => {
    expect(message("A", "a@x.com", "expert", new Date(Date.UTC(2020, 0, 1))).notice?.text).toContain("Expert plan ended on 1 January 2020");
    const free = message("A", "a@x.com", "free", null);
    expect(free.rows?.filter(([, v]) => v)).toHaveLength(2);
  });
  it("renders in the FirstOption layout with escaped data and an RTL Arabic notice", () => {
    const { html, text } = renderLayout(message("<b>Eve</b>", "e@x.com", "starter", new Date(Date.UTC(2031, 5, 1))));
    expect(html).toContain("cid:logo@firstoption-es.com");
    expect(html).toContain("&lt;b&gt;Eve&lt;/b&gt;");
    expect(html).not.toContain("<b>Eve</b>");
    expect(html).toContain('dir="rtl"');
    expect(text).toContain("Open the new portal: https://iso.example.com/#/login");
  });
});
