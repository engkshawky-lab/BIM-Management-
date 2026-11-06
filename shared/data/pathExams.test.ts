import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./learn";
import { LEARNING_PATHS, pathById } from "./learningPaths";
import { PASS_MARK, PATH_EXAMS, certificateCode, drawQuestions, examSize, gradeExam } from "./pathExams";
import { autoPlacements, placementsOf, suggestPlacements, COMPANY_VIDEO_TOPICS } from "../companyVideos";

describe("learning-path final exams", () => {
  it("every path has an exam with enough questions on each topic", () => {
    for (const p of LEARNING_PATHS) expect(PATH_EXAMS.some((e) => e.pathId === p.id), p.id).toBe(true);
    for (const e of PATH_EXAMS) for (const [topic, n] of Object.entries(e.topics)) expect(QUESTIONS.filter((q) => q.topic === topic).length, `${e.pathId} ${topic}`).toBeGreaterThanOrEqual(n!);
  });
  it("draws the set number per topic with no repeats", () => {
    for (const e of PATH_EXAMS) { const ids = drawQuestions(e); expect(ids).toHaveLength(examSize(e)); expect(new Set(ids).size).toBe(ids.length); }
  });
  it("grades only the issued questions, counts blanks as wrong and passes at 75%", () => {
    const ids = drawQuestions(PATH_EXAMS[0]!);
    const right = Object.fromEntries(ids.map((id) => [id, QUESTIONS.find((q) => q.id === id)!.answer]));
    expect(gradeExam(ids, right)).toMatchObject({ pct: 100, passed: true });
    const need = Math.ceil((ids.length * PASS_MARK) / 100);
    const some = Object.fromEntries(ids.slice(0, need).map((id) => [id, right[id]!]));
    expect(gradeExam(ids, some).passed).toBe(true);
    const fewer = Object.fromEntries(ids.slice(0, need - 1).map((id) => [id, right[id]!]));
    expect(gradeExam(ids, { ...fewer, "not-issued": 0 }).passed).toBe(false);
    expect(gradeExam(ids, {}).review.every((r) => r.given === -1 && !r.ok)).toBe(true);
  });
  it("makes readable certificate codes", () => {
    expect(certificateCode()).toMatch(/^BIM-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });
});

describe("our videos in the learning paths", () => {
  const valid = (ps: { pathId: string; step: string }[]) => ps.every((p) => pathById(p.pathId)?.steps.some((s) => s.title === p.step));
  it("places a video automatically from its topic, at most two steps per path, until an administrator places it", () => {
    for (const t of COMPANY_VIDEO_TOPICS) {
      const a = autoPlacements(t);
      expect(valid(a), t).toBe(true);
      for (const p of LEARNING_PATHS) expect(a.filter((x) => x.pathId === p.id).length).toBeLessThanOrEqual(2);
    }
    expect(autoPlacements("Handover & COBie").some((p) => p.step === "Plan the handover")).toBe(true);
    expect(placementsOf({ topic: "Handover & COBie", placements: [{ pathId: "modeller", step: "" }] })).toEqual([{ pathId: "modeller", step: "" }]);
    expect(valid(suggestPlacements("Coordination & clash", "Clash detection in Navisworks"))).toBe(true);
  });
});
