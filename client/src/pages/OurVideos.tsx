import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSession } from "../App";
import { t } from "../i18n";
import { api } from "../lib/api";
import { COMPANY_VIDEO_TOPICS, VIDEO_FILE_ACCEPT, embedFor, type CompanyVideo } from "../../../shared/companyVideos";
import { TONES } from "./HubPage";
import "./videos.css";

// Our videos (/videos/ours): the organisation's own training videos. Administrators upload a file or add a
// YouTube / Vimeo link; everyone signed in can watch. Files stream from /api/company-videos/:id/file.

const fileUrl = (v: CompanyVideo) => `/api/company-videos/${v.id}/file`;
const mb = (n: number) => (n >= 1024 ** 3 ? (n / 1024 ** 3).toFixed(1) + " GB" : Math.max(1, Math.round(n / 1024 ** 2)) + " MB");
const blank = { title: "", description: "", topic: "Onboarding", lang: "en" };

export function VideoTabs({ on }: { on: "library" | "ours" }) {
  return (
    <nav className="vid-tabs" aria-label={t("Videos")}>
      <a className={on === "library" ? "on" : ""} href="#/videos">{t("Video library")}</a>
      <a className={on === "ours" ? "on" : ""} href="#/videos/ours">{t("Our videos")}</a>
    </nav>
  );
}

export default function OurVideos() {
  const { user, toast } = useSession();
  const admin = user.role === "admin";
  const [videos, setVideos] = useState<CompanyVideo[] | null>(null);
  const [topic, setTopic] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<CompanyVideo | null>(null);
  const [editing, setEditing] = useState<CompanyVideo | null>(null);
  const [adding, setAdding] = useState(false);

  const load = () => api<{ videos: CompanyVideo[] }>("/company-videos").then((r) => setVideos(r.videos)).catch((e) => { toast((e as Error).message, "error"); setVideos([]); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const base = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (videos ?? []).filter((v) => !s || [v.title, v.description, v.topic, t(v.topic)].join(" ").toLowerCase().includes(s));
  }, [videos, q]);
  const list = topic ? base.filter((v) => v.topic === topic) : base;
  const used = COMPANY_VIDEO_TOPICS.filter((tp) => base.some((v) => v.topic === tp));

  const remove = async (v: CompanyVideo) => {
    if (!confirm(`${t("Delete this video?")}\n${v.title}`)) return;
    try { await api(`/company-videos/${v.id}`, { method: "DELETE" }); toast(t("Video deleted")); load(); } catch (e) { toast((e as Error).message, "error"); }
  };
  const play = (v: CompanyVideo) => { setOpen(v); api(`/company-videos/${v.id}/view`, { method: "POST" }).catch(() => {}); };

  return (
    <div className="hub" style={{ "--hub": TONES.red } as CSSProperties}>
      <VideoTabs on="ours" />
      <div className="hub-hero">
        <div className="eyebrow">{t("OUR VIDEOS")}</div>
        <h1>{t("Our training videos")}</h1>
        <p>{t("Videos recorded by our own team: onboarding, project standards, software how-tos and lessons learned. Administrators can upload a video file or add a YouTube or Vimeo link.")}</p>
        <div className="facts">
          <span>{videos?.length ?? 0} {t("videos")}</span>
          <span>{used.length} {t("topics")}</span>
        </div>
      </div>

      {admin && (adding || editing
        ? <VideoForm key={editing?.id ?? "new"} video={editing} onDone={(saved) => { setAdding(false); setEditing(null); if (saved) load(); }} />
        : <div className="row"><button type="button" className="primary" onClick={() => setAdding(true)}>+ {t("Add a video")}</button></div>)}

      <div className="vid-filters">
        <input type="search" placeholder={t("Search videos…")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("Search videos…")} />
      </div>
      {used.length > 1 && (
        <div className="vid-chips" role="group" aria-label={t("Topics")}>
          <button type="button" className={"chip" + (topic === "" ? " on" : "")} onClick={() => setTopic("")}>{t("All topics")} <b>{base.length}</b></button>
          {used.map((tp) => (
            <button type="button" key={tp} className={"chip" + (topic === tp ? " on" : "")} onClick={() => setTopic(topic === tp ? "" : tp)}>
              {t(tp)} <b>{base.filter((v) => v.topic === tp).length}</b>
            </button>))}
        </div>)}

      {videos === null ? <p className="muted">{t("Loading…")}</p> : (
        <div className="vid-grid">
          {list.map((v) => (
            <article key={v.id} className="vid-card">
              <button type="button" className="vid-open" onClick={() => play(v)} aria-label={`${t("Play")}: ${v.title}`}>
                <span className="vid-thumb">
                  {v.source === "youtube" ? <img src={`https://i.ytimg.com/vi/${v.url}/hqdefault.jpg`} alt="" loading="lazy" width={480} height={360} />
                    : v.source === "file" ? <video src={fileUrl(v) + "#t=1"} preload="metadata" muted playsInline tabIndex={-1} />
                      : <span className="vid-thumb-label">Vimeo</span>}
                  <span className="vid-play" aria-hidden="true">▶</span>
                </span>
                <span className="vid-body">
                  <b className="vid-title" dir="auto">{v.title}</b>
                  <small className="vid-channel">{v.uploadedByName} · {new Date(v.createdAt).toLocaleDateString()}{v.source === "file" ? ` · ${mb(v.size)}` : ""}</small>
                  <span className="vid-meta">
                    <span className="badge">{t(v.topic)}</span>
                    {v.lang === "ar" && <span className="badge">{t("Arabic")}</span>}
                    <span className="badge">{v.views} {t("views")}</span>
                  </span>
                  {v.description && <span className="vid-summary" dir="auto">{v.description}</span>}
                </span>
              </button>
              {admin && (
                <div className="vid-actions">
                  <button type="button" className="small" onClick={() => { setAdding(false); setEditing(v); window.scrollTo(0, 0); }}>{t("Edit")}</button>
                  <button type="button" className="small danger" onClick={() => remove(v)}>{t("Delete")}</button>
                </div>)}
            </article>))}
        </div>)}
      {videos && !videos.length && <p className="muted">{admin ? t("No videos yet. Add your first one above.") : t("No videos yet. Your administrator can add them.")}</p>}
      {videos && videos.length > 0 && !list.length && <p className="muted">{t("No videos match these filters.")}</p>}

      {open && <OurPlayer v={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function VideoForm({ video, onDone }: { video: CompanyVideo | null; onDone: (saved: boolean) => void }) {
  const { toast } = useSession();
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [f, setF] = useState(video ? { title: video.title, description: video.description, topic: video.topic, lang: video.lang } : blank);
  const [progress, setProgress] = useState<number | null>(null);
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    if (video) {
      try { await api(`/company-videos/${video.id}`, { method: "PUT", body: f }); toast(t("Video updated")); onDone(true); } catch (e) { toast((e as Error).message, "error"); }
      return;
    }
    const form = new FormData();
    const title = f.title.trim() || (file ? file.name.replace(/\.[^.]+$/, "") : "");
    Object.entries({ ...f, title }).forEach(([k, v]) => form.set(k, v));
    if (mode === "file" && file) form.set("file", file); else form.set("link", link);
    // XMLHttpRequest rather than fetch, for upload progress on large files
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/company-videos");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) { toast(t("Video added")); onDone(true); return; }
      let msg = t("Upload failed.");
      try { msg = JSON.parse(xhr.responseText).error ?? msg; } catch { if (xhr.status === 413) msg = t("The file is larger than the server allows."); }
      toast(msg, "error");
    };
    xhr.onerror = () => { setProgress(null); toast(t("Upload failed. Check your connection and try again."), "error"); };
    xhr.send(form);
  };
  const ready = video ? f.title.trim().length >= 2 : mode === "file" ? !!file : !!link.trim();

  return (
    <div className="card vid-form">
      <h3>{video ? t("Edit video") : t("Add a video")}</h3>
      {!video && (
        <div className="seg" role="group" aria-label={t("Source")}>
          <button type="button" className={mode === "file" ? "on" : ""} onClick={() => setMode("file")}>{t("Upload a file")}</button>
          <button type="button" className={mode === "link" ? "on" : ""} onClick={() => setMode("link")}>{t("YouTube or Vimeo link")}</button>
        </div>)}
      {!video && mode === "file" && <><label>{t("Video file")}</label><input type="file" accept={VIDEO_FILE_ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></>}
      {!video && mode === "link" && <><label>{t("Link")}</label><input type="url" placeholder="https://www.youtube.com/watch?v=…" value={link} onChange={(e) => setLink(e.target.value)} /></>}
      <label>{t("Title")}</label><input value={f.title} onChange={set("title")} maxLength={200} placeholder={mode === "file" && file ? file.name.replace(/\.[^.]+$/, "") : ""} />
      <label>{t("Description")}</label><textarea rows={3} value={f.description} onChange={set("description")} maxLength={2000} />
      <div className="row wrap">
        <div><label>{t("Topic")}</label><select value={f.topic} onChange={set("topic")}>{COMPANY_VIDEO_TOPICS.map((tp) => <option key={tp} value={tp}>{t(tp)}</option>)}</select></div>
        <div><label>{t("Language")}</label><select value={f.lang} onChange={set("lang")}><option value="en">{t("English")}</option><option value="ar">{t("Arabic")}</option></select></div>
      </div>
      {progress !== null && <div className="vid-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: progress + "%" }} />{progress}%</div>}
      <div className="row">
        <button type="button" className="primary" disabled={!ready || progress !== null} onClick={save}>{progress !== null ? t("Uploading…") : video ? t("Save") : t("Add video")}</button>
        <button type="button" disabled={progress !== null} onClick={() => onDone(false)}>{t("Cancel")}</button>
      </div>
      {!video && <p className="small muted">{t("Only upload videos you have the right to share. MP4 (H.264) plays in every browser.")}</p>}
    </div>
  );
}

function OurPlayer({ v, onClose }: { v: CompanyVideo; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal wide vid-modal" role="dialog" aria-modal="true" aria-label={v.title} onClick={(e) => e.stopPropagation()}>
        <div className="vid-modal-head">
          <div><b dir="auto">{v.title}</b><small className="muted">{t(v.topic)}</small></div>
          <button type="button" className="small" onClick={onClose} aria-label={t("Close")}>✕</button>
        </div>
        <div className="vid-frame">
          {v.source === "file"
            ? <video src={fileUrl(v)} controls autoPlay playsInline />
            : <iframe src={embedFor(v.source, v.url)} title={v.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
        </div>
        {v.description && <p className="vid-summary" dir="auto">{v.description}</p>}
      </div>
    </div>
  );
}
