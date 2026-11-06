// Final exam for each learning path: drawn from the question bank on the topics the path covers. Passing it
// (PASS_MARK or more) issues a certificate signed by the portal's signatory. Questions and answers stay on the server.

import { QUESTIONS, type TOPICS } from "./learn";

type Topic = (typeof TOPICS)[number];

export const PASS_MARK = 75;
/** Attempts allowed per path in any 24 hours. */
export const ATTEMPTS_PER_DAY = 3;

export interface PathExam {
  pathId: string;
  /** topics and how many questions to draw from each */
  topics: Partial<Record<Topic, number>>;
  minutes: number;
}

export const PATH_EXAMS: PathExam[] = [
  { pathId: "modeller", minutes: 30, topics: { "Concepts & terms": 7, "CDE, naming & status": 8, "Plans & responsibilities": 5, "Delivery process": 5 } },
  { pathId: "coordinator", minutes: 40, topics: { "Concepts & terms": 5, "Delivery process": 8, "CDE, naming & status": 7, "Plans & responsibilities": 6, "Asset information & handover": 4 } },
  { pathId: "bim-manager", minutes: 50, topics: { "Concepts & terms": 5, "Delivery process": 9, "CDE, naming & status": 6, "Plans & responsibilities": 6, "Asset information & handover": 5, "Security (19650-5)": 5, "Health & safety (19650-6)": 4 } },
  { pathId: "client", minutes: 40, topics: { "Concepts & terms": 6, "Delivery process": 8, "Plans & responsibilities": 5, "Asset information & handover": 6, "Security (19650-5)": 5 } },
  { pathId: "ai-governance", minutes: 35, topics: { "AI management (42001)": 15, "Security (19650-5)": 6, "Concepts & terms": 4 } },
];

export const examFor = (pathId: string) => PATH_EXAMS.find((e) => e.pathId === pathId);
export const examSize = (e: PathExam) => Object.values(e.topics).reduce((a, n) => a + (n ?? 0), 0);

/** Draw the questions for one attempt: the set number per topic, at random, in random order. */
export function drawQuestions(e: PathExam, rand: () => number = Math.random): string[] {
  const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; } return b; };
  const ids = Object.entries(e.topics).flatMap(([topic, n]) => shuffle(QUESTIONS.filter((q) => q.topic === topic)).slice(0, n ?? 0).map((q) => q.id));
  return shuffle(ids);
}

/** Score a submission: only questions issued in this attempt count; unanswered questions count as wrong. */
export function gradeExam(questionIds: string[], answers: Record<string, number>) {
  const byTopic: Record<string, [number, number]> = {};
  let score = 0;
  const review = questionIds.map((id) => {
    const q = QUESTIONS.find((x) => x.id === id)!;
    const given = answers[id];
    const ok = given === q.answer;
    const t = (byTopic[q.topic] ??= [0, 0]); t[1]++; if (ok) { t[0]++; score++; }
    return { id, topic: q.topic, q: q.q, options: q.options, answer: q.answer, given: typeof given === "number" ? given : -1, ok, why: q.why };
  });
  const total = questionIds.length;
  const pct = total ? Math.round((score / total) * 100) : 0;
  return { score, total, pct, passed: pct >= PASS_MARK, byTopic, review };
}

/** A short, readable verification code, e.g. "BIM-7K2Q-9XMD" (no 0/O, 1/I). */
export function certificateCode(rand: () => number = Math.random) {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => A[Math.floor(rand() * A.length)]).join("");
  return `BIM-${part()}-${part()}`;
}
