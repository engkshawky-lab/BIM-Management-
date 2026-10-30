import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getLocale, t } from "../i18n";
import { VIDEOS, VIDEO_LEVELS, VIDEO_TOPICS, type Video } from "../../../shared/data/videos";
import { TONES } from "./HubPage";
import "./videos.css";

// Video library: curated free, public YouTube videos on ISO 19650 and BIM information management. /videos and /videos/:topic

const WATCHED_KEY = "bim:videos:watched";
const loadWatched = (): string[] => {
  try { const v = localStorage.getItem(WATCHED_KEY); const a = v ? JSON.parse(v) : []; return Array.isArray(a) ? a.filter((x) => typeof x === "string") : []; } catch { return []; }
};
const saveWatched = (ids: string[]) => { try { localStorage.setItem(WATCHED_KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ } };

const isArabicUi = () => {
  if (getLocale() === "ar") return true;
  if (typeof document === "undefined") return false;
  const el = document.documentElement;
  return el.lang.toLowerCase().startsWith("ar") || el.dir === "rtl";
};

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const embedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;

type Lang = "all" | "en" | "ar";

export default function Videos({ topic }: { topic?: string }) {
  const initialTopic = VIDEO_TOPICS.find((x) => x === topic || slug(x) === topic) ?? "";
  const [active, setActive] = useState<string>(initialTopic);
  const [level, setLevel] = useState<string>("");
  const [lang, setLang] = useState<Lang>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Video | null>(null);
  const [watched, setWatched] = useState<string[]>(loadWatched);
  const arUi = isArabicUi();
  const [arSummary, setArSummary] = useState(arUi);

  useEffect(() => { setActive(initialTopic); }, [initialTopic]);
  useEffect(() => { setArSummary(arUi); }, [arUi]);

  const toggleWatched = (id: string) => {
    const next = watched.includes(id) ? watched.filter((x) => x !== id) : [...watched, id];
    setWatched(next); saveWatched(next);
  };

  // filters other than topic, so the topic chips can show how many match
  const base = useMemo(() => {
    const s = q.trim().toLowerCase();
    return VIDEOS.filter((v) => (!level || v.level === level) && (lang === "all" || v.lang === lang)
      && (!s || [v.title, v.channel, v.summary, v.summaryAr, v.topic, t(v.topic)].join(" ").toLowerCase().includes(s)));
  }, [q, level, lang]);
  const list = active ? base.filter((v) => v.topic === active) : base;
  const countIn = (tp: string) => base.filter((v) => v.topic === tp).length;
  const watchedCount = VIDEOS.filter((v) => watched.includes(v.id)).length;
  const arCount = VIDEOS.filter((v) => v.lang === "ar").length;

  return (
    <div className="hub" style={{ "--hub": TONES.red } as CSSProperties}>
      <div className="hub-hero">
        <div className="eyebrow">ISO 19650 · {t("VIDEO LIBRARY")}</div>
        <h1>{t("Learn ISO 19650 and BIM by watching")}</h1>
        <p>{t("Free, public videos picked for BIM managers, coordinators and modellers: from the basics of ISO 19650 to information requirements, CDEs, coordination, openBIM, handover and AI.")}</p>
        <div className="facts">
          <span>{VIDEOS.length} {t("videos")}</span>
          <span>{VIDEO_TOPICS.length} {t("topics")}</span>
          <span>{arCount} {t("in Arabic")}</span>
          <span>{watchedCount} / {VIDEOS.length} {t("watched")}</span>
        </div>
      </div>

      <div className="vid-filters">
        <input type="search" placeholder={t("Search videos…")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("Search videos…")} />
        <div className="seg" role="group" aria-label={t("Level")}>
          <button type="button" className={level === "" ? "on" : ""} onClick={() => setLevel("")}>{t("All levels")}</button>
          {VIDEO_LEVELS.map((l) => <button type="button" key={l} className={level === l ? "on" : ""} onClick={() => setLevel(l)}>{t(l)}</button>)}
        </div>
        <div className="seg" role="group" aria-label={t("Language")}>
          {([["all", "All languages"], ["en", "English"], ["ar", "Arabic"]] as [Lang, string][]).map(([k, label]) =>
            <button type="button" key={k} className={lang === k ? "on" : ""} onClick={() => setLang(k)}>{t(label)}</button>)}
        </div>
        <label className="vid-toggle">
          <input type="checkbox" checked={arSummary} onChange={(e) => setArSummary(e.target.checked)} />
          {t("Show summaries in Arabic")}
        </label>
      </div>

      <div className="vid-chips" role="group" aria-label={t("Topics")}>
        <button type="button" className={"chip" + (active === "" ? " on" : "")} onClick={() => setActive("")}>{t("All topics")} <b>{base.length}</b></button>
        {VIDEO_TOPICS.map((tp) => (
          <button type="button" key={tp} className={"chip" + (active === tp ? " on" : "")} onClick={() => setActive(active === tp ? "" : tp)}>
            {t(tp)} <b>{countIn(tp)}</b>
          </button>))}
      </div>

      <div className="vid-grid">
        {list.map((v) => {
          const seen = watched.includes(v.id);
          return (
            <article key={v.id} className={"vid-card" + (seen ? " seen" : "")}>
              <button type="button" className="vid-open" onClick={() => setOpen(v)} aria-label={`${t("Play")}: ${v.title}`}>
                <span className="vid-thumb">
                  <img src={thumb(v.id)} alt="" loading="lazy" width={480} height={360} />
                  <span className="vid-play" aria-hidden="true">▶</span>
                  {seen && <span className="vid-seen-badge">✓ {t("Watched")}</span>}
                </span>
                <span className="vid-body">
                  <b className="vid-title" dir="auto">{v.title}</b>
                  <small className="vid-channel" dir="auto">{v.channel}</small>
                  <span className="vid-meta">
                    <span className={"badge vid-level " + v.level.toLowerCase()}>{t(v.level)}</span>
                    <span className="badge">{t(v.topic)}</span>
                    {v.lang === "ar" && <span className="badge">{t("Arabic")}</span>}
                  </span>
                  {arSummary
                    ? <span className="vid-summary" lang="ar" dir="rtl">{v.summaryAr}</span>
                    : <span className="vid-summary" lang="en" dir="ltr">{v.summary}</span>}
                </span>
              </button>
              <div className="vid-actions">
                <button type="button" className={"small" + (seen ? " vid-on" : "")} aria-pressed={seen} onClick={() => toggleWatched(v.id)}>
                  {seen ? "✓ " + t("Watched") : t("Mark as watched")}
                </button>
              </div>
            </article>);
        })}
      </div>
      {!list.length && <p className="muted">{t("No videos match these filters.")}</p>}

      <p className="small muted vid-note">{t("Videos are hosted by their owners on YouTube; the platform only links to them.")}</p>

      {open && <Player v={open} arSummary={arSummary} seen={watched.includes(open.id)} onToggle={() => toggleWatched(open.id)} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Player({ v, arSummary, seen, onToggle, onClose }: { v: Video; arSummary: boolean; seen: boolean; onToggle: () => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal wide vid-modal" role="dialog" aria-modal="true" aria-label={v.title} onClick={(e) => e.stopPropagation()}>
        <div className="vid-modal-head">
          <div><b dir="auto">{v.title}</b><small className="muted" dir="auto">{v.channel}</small></div>
          <button type="button" className="small" onClick={onClose} aria-label={t("Close")}>✕</button>
        </div>
        <div className="vid-frame">
          <iframe src={embedUrl(v.id)} title={v.title} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        </div>
        {arSummary
          ? <p className="vid-summary" lang="ar" dir="rtl">{v.summaryAr}</p>
          : <p className="vid-summary" lang="en" dir="ltr">{v.summary}</p>}
        <div className="row vid-modal-actions">
          <button type="button" className={seen ? "vid-on" : ""} aria-pressed={seen} onClick={onToggle}>{seen ? "✓ " + t("Watched") : t("Mark as watched")}</button>
          <a className="btn" href={watchUrl(v.id)} target="_blank" rel="noopener noreferrer">{t("Watch on YouTube")} ↗</a>
        </div>
        <p className="small muted">{t("Videos are hosted by their owners on YouTube; the platform only links to them.")}</p>
      </div>
    </div>
  );
}

function slug(s: string) { return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
