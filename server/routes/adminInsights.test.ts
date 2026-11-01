import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ db: {}, schema: {}, newId: () => "" }));
const { learningRows, weekly } = await import("./adminInsights");

describe("admin reports", () => {
  it("counts per week, oldest first, ignoring older dates", () => {
    const now = Date.UTC(2026, 10, 4); // a Wednesday
    const rows = weekly([new Date(Date.UTC(2026, 10, 2)), new Date(Date.UTC(2026, 10, 3)), new Date(Date.UTC(2026, 9, 27)), new Date(Date.UTC(2025, 0, 1)), null], 3, now);
    expect(rows.map((r) => r.week)).toEqual(["2026-10-19", "2026-10-26", "2026-11-02"]);
    expect(rows.map((r) => r.n)).toEqual([0, 1, 2]);
  });
  it("ranks learners by lessons and their best score per quiz topic", () => {
    const at = new Date();
    const rows = learningRows(
      [{ userId: "a", at }, { userId: "a", at }, { userId: "b", at }],
      [{ userId: "b", topic: "cde", score: 8, total: 10, at }, { userId: "b", topic: "cde", score: 9, total: 10, at }, { userId: "b", topic: "loin", score: 5, total: 10, at }],
    );
    expect(rows.map((r) => [r.userId, r.points])).toEqual([["b", 24], ["a", 20]]);
    expect(rows[0]).toMatchObject({ quizzes: 3, best: 90, average: 73 });
  });
});
