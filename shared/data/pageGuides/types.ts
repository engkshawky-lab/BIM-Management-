// Per-page guide shown in the "How to use this page" panel and on the Platform guide: one entry per sidebar page
// (client/src/shell/nav.ts page key). English and Arabic side by side; pageGuides.test.ts checks every page has one.

export interface GuideText {
  /** What the page is for, 1–3 sentences. */
  what: string;
  /** How to use it: ordered steps, each one short imperative sentence naming the real buttons and fields. */
  steps: string[];
  /** What the page produces: files, records, documents, scores, notifications. Empty for pure reading pages. */
  outputs: string[];
  /** Mandatory inputs: fields or files without which the page cannot produce its output, with the rule in brackets
   *  where there is one, e.g. "Project code (2–6 letters or digits)". Empty when nothing is required. */
  required: string[];
  /** Optional practical tips or gotchas. */
  tips?: string[];
}

export interface PageGuide extends GuideText {
  /** Page key from nav.ts, e.g. "p.plan". */
  key: string;
  /** Arabic version of the same text: same number of steps, outputs, required and tips, in the same order. */
  ar: GuideText;
}
