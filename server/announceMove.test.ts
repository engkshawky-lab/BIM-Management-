import { describe, expect, it } from "vitest";



describe("move announcement", async () => {

  process.argv = [process.argv[0]!, "vitest", "--public-url", "https://iso.example.com"];
  const { message } = await import("../scripts/announce-move");
  it("points at the new address and keeps the password message", () => {
    const m = message("Sara", "pro", new Date(Date.UTC(2030, 0, 31)));
    expect(m.action.url).toBe("https://iso.example.com/#/login");
    expect(m.lines.join(" ")).toContain("same email address and password");
    expect(m.lines.join(" ")).toContain("Professional plan has come over with you and runs until 31 January 2030");
  });
  it("tells people whose plan ended, and says nothing about plans for Free", () => {
    expect(message("A", "expert", new Date(Date.UTC(2020, 0, 1))).lines.join(" ")).toContain("Expert plan ended on 1 January 2020");
    expect(message("A", "free", null).lines.join(" ")).not.toMatch(/plan/i);
  });
});
