// Practice material for each ISO 19650 part: real-project examples, questions and answers, and a short quiz.
// Paraphrased guidance, not the standard's text.

export interface PracticeExample {
  title: string;
  /** Who is involved and what is happening on the project. */
  situation: string;
  /** What the team does, in order, following the part. */
  steps: string[];
  /** What the team ends up with: documents, decisions, records. */
  result: string;
  /** Who leads it, e.g. "Lead appointed party (information manager)". */
  lead: string;
  /** Platform page that helps, as a hash path, e.g. "/ai-tools/plans". */
  tool?: { label: string; path: string };
}

export interface PracticeFaq { q: string; a: string }

/** [question, options, index of the correct option, explanation] */
export type PracticeQuiz = [string, string[], number, string];

export interface PartPractice {
  part: 1 | 2 | 3 | 4 | 5 | 6;
  examples: PracticeExample[];
  faq: PracticeFaq[];
  quiz: PracticeQuiz[];
}
