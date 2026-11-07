import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useDialog } from "../components/Dialog";
import { getLocale, t } from "../i18n";
import { VIDEO_LEVELS, VIDEO_TOPICS } from "../../../shared/data/videos";
import { embedFor, type CompanyVideo } from "../../../shared/companyVideos";
import { libraryVideos, type LibraryVideo } from "../../../shared/libraryVideos";
import { api } from "../lib/api";
import { useSession } from "../App";
import { TONES } from "./HubPage";
import { VideoForm, VideoTabs } from "./OurVideos";
import "./videos.css";

// Free public videos: curated catalog plus saved YouTube / Vimeo links, including former Our videos links.

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
const watchUrl = (v: LibraryVideo) => v.source === "youtube" ? `https://www.youtube.com/watch?v=${v.videoId}` : `https://vimeo.com/${v.videoId}`;

type Lang = "all" | "en" | "ar";

export default function Videos({ topic }: { topic?: string }) {
  const { user, toast } = useSession();
  const admin = user.role === "admin";
  const [saved, setSaved] = useState<CompanyVideo[]>([]);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CompanyVideo | null>(null);
  const videos = useMemo(() => libraryVideos(saved), [saved]);
  const topics = useMemo(() => [...new Set<string>([...VIDEO_TOPICS, ...videos.map((v) => v.topic)])], [videos]);
  const initialTopic = topics.find((x) => x === topic || slug(x) === topic) ?? "";
  const [active, setActive] = useState<string>(initialTopic);
  const [level, setLevel] = useState<string>("");
  const [lang, setLang] = useState<Lang>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<LibraryVideo | null>(null);
  const [watched, setWatched] = useState<string[]>(loadWatched);
  const arUi = isArabicUi();
  const [arSummary, setArSummary] = useState(arUi);

  const load = () => api<{ videos: CompanyVideo[] }>("/video-library").then((r) => { setSaved(r.videos); setLoadError(""); }).catch((e: Error) => setLoadError(e.message));
  useEffect(() => { load(); }, []);
  const remove = async (v: CompanyVideo) => {
    if (!confirm(`${t("Delete this video?")}\n${v.title}`)) return;
    try { await api(`/video-library/${v.id}`, { method: "DELETE" }); toast(t("Video deleted")); load(); }
    catch (e) { toast((e as Error).message, "error"); }
  };
  const play = (v: LibraryVideo) => {
    setOpen(v);
    if (v.record) api(`/video-library/${v.record.id}/view`, { method: "POST" }).catch((e: Error) => console.error("Could not count video view", e));
  };

  useEffect(() => { setActive(initialTopic); }, [initialTopic]);
  useEffect(() => { setArSummary(arUi); }, [arUi]);

  const toggleWatched = (id: string) => {
    const next = watched.includes(id) ? watched.filter((x) => x !== id) : [...watched, id];
    setWatched(next); saveWatched(next);
  };

  // filters other than topic, so the topic chips can show how many match
  const base = useMemo(() => {
    const s = q.trim().toLowerCase();
    return videos.filter((v) => (!level || v.level === level) && (lang === "all" || v.lang === lang)
      && (!s || [v.title, v.channel, v.summary, v.summaryAr, v.topic, t(v.topic)].join(" ").toLowerCase().includes(s)));
  }, [videos, q, level, lang]);
  const list = active ? base.filter((v) => v.topic === active) : base;
  const countIn = (tp: string) => base.filter((v) => v.topic === tp).length;
  const watchedCount = videos.filter((v) => watched.includes(v.id)).length;
  const arCount = videos.filter((v) => v.lang === "ar").length;

  return (
    <div className="hub" style={{ "--hub": TONES.red } as CSSProperties}>
      <VideoTabs on="library" />
      <div className="hub-hero">
        <div className="eyebrow">ISO 19650 · {t("VIDEO LIBRARY")}</div>
        <h1>{t("Learn ISO 19650 and BIM by watching")}</h1>
        <p>{t("Free, public videos picked for BIM managers, coordinators and modellers: from the basics of ISO 19650 to information requirements, CDEs, coordination, openBIM, handover and AI.")}</p>
        <div className="facts">
          <span>{videos.length} {t("videos")}</span>
          <span>{topics.length} {t("topics")}</span>
          <span>{arCount} {t("in Arabic")}</span>
          <span>{watchedCount} / {videos.length} {t("watched")}</span>
        </div>
      </div>

      {admin && (adding || editing
        ? <VideoForm key={editing?.id ?? "new"} video={editing} collection="video-library" onDone={(changed) => { setAdding(false); setEditing(null); if (changed) load(); }} />
        : <div className="row"><button type="button" className="primary" onClick={() => setAdding(true)}>+ {t("Add a video")}</button></div>)}
      {loadError && <p role="alert">{loadError} <button type="button" className="small" onClick={load}>{t("Retry")}</button></p>}

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
        {topics.map((tp) => (
          <button type="button" key={tp} className={"chip" + (active === tp ? " on" : "")} onClick={() => setActive(active === tp ? "" : tp)}>
            {t(tp)} <b>{countIn(tp)}</b>
          </button>))}
      </div>

      <div className="vid-grid">
        {list.map((v) => {
          const seen = watched.includes(v.id);
          return (
            <article key={v.id} className={"vid-card" + (seen ? " seen" : "")}>
              <button type="button" className="vid-open" onClick={() => play(v)} aria-label={`${t("Play")}: ${v.title}`}>
                <span className="vid-thumb">
                  {v.source === "youtube" ? <img src={thumb(v.videoId)} alt="" loading="lazy" width={480} height={360} /> : <span className="vid-thumb-label">Vimeo</span>}
                  <span className="vid-play" aria-hidden="true">▶</span>
                  {seen && <span className="vid-seen-badge">✓ {t("Watched")}</span>}
                </span>
                <span className="vid-body">
                  <b className="vid-title" dir="auto">{v.title}</b>
                  <small className="vid-channel" dir="auto">{v.channel}</small>
                  <span className="vid-meta">
                    {v.level && <span className={"badge vid-level " + v.level.toLowerCase()}>{t(v.level)}</span>}
                    <span className="badge">{t(v.topic)}</span>
                    {v.lang === "ar" && <span className="badge">{t("Arabic")}</span>}
                  </span>
                  {arSummary && v.summaryAr
                    ? <span className="vid-summary" lang="ar" dir="rtl">{v.summaryAr}</span>
                    : <span className="vid-summary" lang={v.lang} dir="auto">{v.summary}</span>}
                </span>
              </button>
              <div className="vid-actions">
                <button type="button" className={"small" + (seen ? " vid-on" : "")} aria-pressed={seen} onClick={() => toggleWatched(v.id)}>
                  {seen ? "✓ " + t("Watched") : t("Mark as watched")}
                </button>
                {admin && v.record && <>
                  <button type="button" className="small" onClick={() => { setAdding(false); setEditing(v.record!); window.scrollTo(0, 0); }}>{t("Edit")}</button>
                  <button type="button" className="small danger" onClick={() => remove(v.record!)}>{t("Delete")}</button>
                </>}
              </div>
            </article>);
        })}
      </div>
      {!list.length && <p className="muted">{t("No videos match these filters.")}</p>}

      <p className="small muted vid-note">{t("Videos are hosted by their owners on YouTube or Vimeo; the platform only links to them.")}</p>

      {open && <Player v={open} arSummary={arSummary} seen={watched.includes(open.id)} onToggle={() => toggleWatched(open.id)} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Player({ v, arSummary, seen, onToggle, onClose }: { v: LibraryVideo; arSummary: boolean; seen: boolean; onToggle: () => void; onClose: () => void }) {
  const dlg = useDialog(onClose);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal wide vid-modal" ref={dlg} role="dialog" aria-modal="true" aria-label={v.title} onClick={(e) => e.stopPropagation()}>
        <div className="vid-modal-head">
          <div><b dir="auto">{v.title}</b><small className="muted" dir="auto">{v.channel}</small></div>
          <button type="button" className="small" onClick={onClose} aria-label={t("Close")}>✕</button>
        </div>
        <div className="vid-frame">
          <iframe src={embedFor(v.source, v.videoId)} title={v.title} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        </div>
        {arSummary && v.summaryAr
          ? <p className="vid-summary" lang="ar" dir="rtl">{v.summaryAr}</p>
          : <p className="vid-summary" lang={v.lang} dir="auto">{v.summary}</p>}
        <div className="row vid-modal-actions">
          <button type="button" className={seen ? "vid-on" : ""} aria-pressed={seen} onClick={onToggle}>{seen ? "✓ " + t("Watched") : t("Mark as watched")}</button>
          <a className="btn" href={watchUrl(v)} target="_blank" rel="noopener noreferrer">{t(v.source === "youtube" ? "Watch on YouTube" : "Watch on Vimeo")} ↗</a>
        </div>
        <p className="small muted">{t("Videos are hosted by their owners on YouTube or Vimeo; the platform only links to them.")}</p>
      </div>
    </div>
  );
}

function slug(s: string) { return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
