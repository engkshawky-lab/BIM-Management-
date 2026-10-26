import { describe, expect, it } from "vitest";
import { pickSources, type Source } from "./retrieval";

const s = (title: string, text: string): Source => ({ kind: "x", title, link: "", text });
describe("pickSources", () => {
  const all = [s("Project", "summary"), s("Issue 1", "ceiling void clash with ductwork"), s("Risk", "late survey"), s("Meeting", "ductwork routing agreed")];
  it("always keeps the project summary first and ranks matches", () => {
    const r = pickSources(all, "ductwork clash");
    expect(r[0].title).toBe("Project");
    expect(r[1].title).toBe("Issue 1");
    expect(r.map((x) => x.title)).not.toContain("Risk");
  });
  it("respects the character budget", () => {
    const big = [s("Project", "p"), s("A", "ductwork ".repeat(100)), s("B", "ductwork ".repeat(100))];
    expect(pickSources(big, "ductwork", 1000).length).toBe(2);
  });
});
