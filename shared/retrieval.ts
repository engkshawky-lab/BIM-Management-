// Lightweight retrieval for the project assistant: idf-weighted term overlap.
export interface Source { kind: string; title: string; link: string; text: string }

// Arabic: drop diacritics and tatweel, unify alef/yaa/taa-marbuta forms, and strip the common prefixes
// (al-, wa-al-, bi-al-, li-al-, fa-al-, wa-) so "المخاطر" and "مخاطر" match.
const normalizeAr = (w: string) => w
  .replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
  .replace(/^(?:وال|بال|لل|فال|كال|ال|و)(?=.{3,})/, "");

// A few Arabic words for project records, mapped to the English words the stored records use, so an Arabic
// question still finds English documents, issues and meetings.
const AR_TO_EN: Record<string, string[]> = {
  "مخاطر": ["risk", "risks"], "خطر": ["risk"], "تعارض": ["clash", "clashes"], "تعارضات": ["clash", "clashes"],
  "مشكله": ["issue", "issues"], "مشكلات": ["issue", "issues"], "مشاكل": ["issue", "issues"], "اجتماع": ["meeting", "minutes"],
  "اجتماعات": ["meeting", "meetings", "minutes"], "محضر": ["minutes"], "نموذج": ["model"], "نماذج": ["model", "models"],
  "وثيقه": ["document"], "وثائق": ["document", "documents"], "مستند": ["document"], "ملف": ["file"], "ملفات": ["file", "files"],
  "مخطط": ["drawing", "plan"], "لوحه": ["sheet", "drawing"], "تسليم": ["delivery", "deliverable"], "موعد": ["due", "deadline"],
  "مراجعه": ["review", "revision"], "متطلبات": ["requirements"], "فريق": ["team"], "مهمه": ["task"], "معلومات": ["information"],
  "جوده": ["quality"], "تسميه": ["naming"], "حاويه": ["container"], "اعتماد": ["approval", "accepted"], "مرحله": ["stage", "milestone"],
};

const words = (s: string) => {
  const out: string[] = [];
  for (const m of s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    if (/[؀-ۿ]/.test(m)) {
      const w = normalizeAr(m);
      if (w.length >= 3) out.push(w, ...(AR_TO_EN[w] ?? []));
    } else if (m.length >= 3) out.push(m);
  }
  return out;
};

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
