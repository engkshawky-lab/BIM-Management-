// The organisation's own videos (/videos/ours): shared rules for the upload form and the server.

export const VIDEO_FILE_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"] as const;
export const VIDEO_FILE_ACCEPT = ".mp4,.m4v,.webm,.ogv,.mov,video/mp4,video/webm,video/ogg,video/quicktime";
export const VIDEO_LANGS = ["en", "ar"] as const;
export const COMPANY_VIDEO_TOPICS = [
  "Onboarding", "ISO 19650 basics", "Information requirements", "CDE & workflows", "Modelling standards",
  "Coordination & clash", "QA/QC", "Handover & COBie", "Software how-to", "AI tools", "Project lessons", "General",
] as const;

export type VideoSource = "file" | "youtube" | "vimeo";
export interface CompanyVideo {
  id: string; title: string; description: string; topic: string; lang: string; source: VideoSource;
  url: string; fileName: string; mimeType: string; size: number; views: number; uploadedByName: string; createdAt: string;
}

/** A YouTube or Vimeo link → its video id, or null for anything else. */
export function parseVideoLink(raw: string): { source: "youtube" | "vimeo"; id: string } | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.replace(/^(www\.|m\.)/, "");
  const yt = /^[\w-]{11}$/;
  if (host === "youtu.be") { const id = u.pathname.slice(1).split("/")[0] ?? ""; return yt.test(id) ? { source: "youtube", id } : null; }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v && yt.test(v)) return { source: "youtube", id: v };
    const m = /^\/(?:embed|shorts|live)\/([\w-]{11})/.exec(u.pathname);
    return m ? { source: "youtube", id: m[1]! } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = /\/(?:video\/)?(\d{6,12})(?:\/|$)/.exec(u.pathname);
    return m ? { source: "vimeo", id: m[1]! } : null;
  }
  return null;
}

export const embedFor = (source: "youtube" | "vimeo", id: string) =>
  source === "youtube" ? `https://www.youtube-nocookie.com/embed/${id}` : `https://player.vimeo.com/video/${id}`;
