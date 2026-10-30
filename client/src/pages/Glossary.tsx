import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { GLOSSARY, GLOSSARY_CATEGORIES, entryLetter, findEntry, searchGlossary, type GlossaryCategory, type GlossaryEntry } from "../../../shared/data/glossary";
import { TONES } from "./HubPage";
import "./glossary.css";

// Bilingual glossary & acronym decoder. /glossary and /glossary/:query
// Entry content carries its own Arabic and is marked .no-i18n so the DOM translation layer leaves the
// English side alone; interface labels are plain English text nodes that the Arabic layer translates.

const ACRONYMS = GLOSSARY.filter((e) => e.abbr).length;

const setHash = (q: string) => {
  const next = q.trim() ? `#/glossary/${encodeURIComponent(q.trim())}` : "#/glossary";
  if (location.hash !== next) history.replaceState(null, "", next);
};

const decode = (q?: string) => { try { return q ? decodeURIComponent(q) : ""; } catch { return q ?? ""; } };

const copyText = (e: GlossaryEntry) =>
  [`${e.abbr ? e.abbr + " — " : ""}${e.term}`, `${e.arAbbr ? e.arAbbr + " — " : ""}${e.ar}`, e.definition, e.definitionAr, e.source ? `(${e.source})` : ""].filter(Boolean).join("\n");

function EntryCard({ e, onRelated }: { e: GlossaryEntry; onRelated: (r: string) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(copyText(e)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  };
  return (
    <article className="hub-card gl-card">
      <div className="gl-head">
        {e.abbr && <span className="gl-abbr no-i18n">{e.abbr}</span>}
        <div className="gl-names">
          <h3 className="gl-term no-i18n" lang="en" dir="ltr">{e.term}</h3>
          <div className="gl-term-ar" lang="ar" dir="rtl">{e.arAbbr ? `${e.ar} (${e.arAbbr})` : e.ar}</div>
        </div>
        <button className="small ghost gl-copy" onClick={copy} title="Copy">{copied ? "Copied" : "Copy"}</button>
      </div>
      <div className="gl-defs">
        <p className="gl-def no-i18n" lang="en" dir="ltr">{e.definition}</p>
        <p className="gl-def" lang="ar" dir="rtl">{e.definitionAr}</p>
      </div>
      <div className="gl-foot">
        {e.related && e.related.length > 0 && <>
          <span className="small muted">Related</span>
          <span className="row no-i18n" style={{ gap: 4 }}>
            {e.related.map((r) => <button key={r} className="chip" onClick={() => onRelated(r)} title={findEntry(r)?.term}>{r}</button>)}
          </span>
        </>}
        <span className="gl-meta small muted">
          <span className="badge">{e.category}</span>
          {e.source && <span className="no-i18n">{e.source}</span>}
        </span>
      </div>
    </article>
  );
}

export default function Glossary({ q }: { q?: string }) {
  const [query, setQuery] = useState(() => decode(q));
  const [letter, setLetter] = useState<string | null>(null);
  const [category, setCategory] = useState<GlossaryCategory | null>(null);
  const [acronymsOnly, setAcronymsOnly] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // follow the route when the address changes from outside (deep link, back button)
  useEffect(() => { setQuery(decode(q)); }, [q]);
  useEffect(() => { setHash(query); }, [query]);

  const searched = useMemo(() => searchGlossary(query), [query]);
  const base = useMemo(() => (acronymsOnly ? searched.filter((e) => e.abbr) : searched), [searched, acronymsOnly]);
  // each filter's counts reflect every other active filter
  const forLetters = useMemo(() => (category ? base.filter((e) => e.category === category) : base), [base, category]);
  const forCats = useMemo(() => (letter ? base.filter((e) => entryLetter(e) === letter) : base), [base, letter]);
  const results = useMemo(() => forLetters.filter((e) => !letter || entryLetter(e) === letter), [forLetters, letter]);
  const letterCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of forLetters) m.set(entryLetter(e), (m.get(entryLetter(e)) ?? 0) + 1);
    return m;
  }, [forLetters]);
  // without a search the list reads alphabetically; with one, by relevance
  const shown = useMemo(() => (query.trim() ? results : [...results].sort((a, b) => (a.abbr ?? a.term).localeCompare(b.abbr ?? b.term, "en", { sensitivity: "base" }))), [results, query]);

  const filtered = !!(query.trim() || letter || category || acronymsOnly);
  const clear = () => { setQuery(""); setLetter(null); setCategory(null); setAcronymsOnly(false); };
  const goRelated = (r: string) => {
    setQuery(r); setLetter(null); setCategory(null); setAcronymsOnly(false);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="hub" style={{ "--hub": TONES.teal } as CSSProperties} ref={top}>
      <div className="hub-hero">
        <div className="eyebrow">ISO 19650 · BIM · <span lang="ar" dir="rtl">عربي / English</span></div>
        <h1>Glossary & acronym decoder</h1>
        <p>Every term and acronym a BIM manager meets, in plain English and Arabic side by side. Search in either language, filter by letter or topic, and copy an entry into your own documents.</p>
        <div className="facts">
          <span>{GLOSSARY.length} terms</span>
          <span>{ACRONYMS} acronyms</span>
          <span>{GLOSSARY_CATEGORIES.length} categories</span>
          <span lang="ar" dir="rtl">مصطلحات ثنائية اللغة</span>
        </div>
      </div>

      <div className="gl-search">
        <input type="search" value={query} onChange={(ev) => { setQuery(ev.target.value); setLetter(null); }}
          placeholder="Search in English or Arabic, e.g. MIDP, trigger event, حاوية المعلومات…" aria-label="Search the glossary" autoFocus />
        {filtered && <button onClick={clear}>Clear filters</button>}
      </div>

      <nav className="gl-letters" aria-label="Browse by letter">
        <button className={letter === null ? "on" : ""} onClick={() => setLetter(null)}>All</button>
        {["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((l) => {
          const n = letterCounts.get(l) ?? 0;
          return <button key={l} className={"no-i18n" + (letter === l ? " on" : "")} disabled={!n} title={`${n}`} onClick={() => setLetter(letter === l ? null : l)}>{l}</button>;
        })}
      </nav>

      <div className="gl-cats" role="group" aria-label="Filter by category">
        <button className={"chip" + (category === null ? " on" : "")} onClick={() => setCategory(null)}><span>All categories</span><span className="gl-n">{forCats.length}</span></button>
        {GLOSSARY_CATEGORIES.map((c) => {
          const n = forCats.filter((e) => e.category === c).length;
          return <button key={c} className={"chip" + (category === c ? " on" : "")} disabled={!n && category !== c} onClick={() => setCategory(category === c ? null : c)}><span>{c}</span><span className="gl-n">{n}</span></button>;
        })}
      </div>

      <div className="gl-tools">
        <label className="small"><input type="checkbox" checked={acronymsOnly} onChange={(ev) => setAcronymsOnly(ev.target.checked)} /><span>Acronyms only</span></label>
        <span className="small muted">
          <span>Showing</span> <b>{shown.length}</b> <span>of</span> <b>{GLOSSARY.length}</b> <span>entries</span>
        </span>
      </div>

      {shown.length > 0 ? (
        <div className="gl-results">{shown.map((e) => <EntryCard key={e.term} e={e} onRelated={goRelated} />)}</div>
      ) : (
        <div className="hub-card gl-empty">
          <b>No entries match.</b>
          <p className="small muted">Try a shorter word, the other language, or clear the filters.</p>
          <button onClick={clear}>Clear filters</button>
        </div>
      )}

      <p className="tiny muted">Definitions are paraphrased for learning, not quoted from the standards. Check the published standard and your appointment documents for the exact wording.</p>
    </div>
  );
}
