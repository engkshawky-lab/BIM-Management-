// Lightweight retrieval for the project assistant: idf-weighted term overlap.
export interface Source { kind: string; title: string; link: string; text: string }

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];

/** Rank sources by term overlap with the question (idf-weighted); always keep the project summary. */
export function pickSources(sources: Source[], question: string, budget = 60_000): Source[] {
  const qs = [...new Set(words(question))];
  const df = new Map<string, number>();
  const toks = sources.map((s) => { const set = new Set(words(s.title + " " + s.text)); set.forEach((w) => df.set(w, (df.get(w) ?? 0) + 1)); return set; });
  const scored = sources.map((s, i) => ({ s, score: qs.reduce((acc, w) => acc + (toks[i].has(w) ? Math.log(1 + sources.length / (df.get(w) ?? 1)) : 0), 0) }));
  const [first, ...rest] = scored;
  const picked: Source[] = [first.s]; let used = first.s.text.length;
  for (const x of rest.filter((x) => x.score > 0).sort((a, b) => b.score - a.score)) {
    if (used + x.s.text.length > budget) continue;
    picked.push(x.s); used += x.s.text.length;
  }
  return picked;
}
