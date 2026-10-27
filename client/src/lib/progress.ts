// Learning progress for the hubs and parts pages: explored topics, checklist ticks, quiz best scores.
// Kept in this browser only (a per-viewer convenience); every read survives blocked storage.

const KEY = "bim:learn";
interface Store {
  visited: Record<string, string[]>;            // hub/part id -> explored tab keys
  checks: Record<string, number[]>;             // checklist key -> ticked item indexes
  quiz: Record<string, { best: number; of: number }>;
  last?: { path: string; label: string; ts: number };
}

const read = (): Store => {
  try { const s = JSON.parse(localStorage.getItem(KEY) ?? "{}"); return { visited: s.visited ?? {}, checks: s.checks ?? {}, quiz: s.quiz ?? {}, last: s.last }; }
  catch { return { visited: {}, checks: {}, quiz: {} }; }
};
const write = (s: Store) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } };

export function markVisited(scope: string, tab: string, path: string, label: string) {
  const s = read();
  const list = s.visited[scope] ?? [];
  if (!list.includes(tab)) s.visited[scope] = [...list, tab];
  s.last = { path, label, ts: Date.now() };
  write(s);
}
export const visitedTabs = (scope: string) => new Set(read().visited[scope] ?? []);
export const lastVisited = () => read().last;

export const getChecks = (key: string) => read().checks[key] ?? [];
export function setChecks(key: string, ticks: number[]) { const s = read(); s.checks[key] = ticks; write(s); }

export const quizBest = (key: string) => read().quiz[key];
export function recordQuiz(key: string, score: number, of: number) {
  const s = read();
  if (!s.quiz[key] || score > s.quiz[key].best) { s.quiz[key] = { best: score, of }; write(s); }
}
/** Best scores for every quiz whose key starts with a prefix (e.g. one hub). */
export const quizzesFor = (prefix: string) => Object.entries(read().quiz).filter(([k]) => k.startsWith(prefix)).map(([, v]) => v);
