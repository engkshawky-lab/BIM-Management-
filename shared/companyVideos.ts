// The organisation's own videos (/videos/ours): shared rules for the upload form and the server.

import { LEARNING_PATHS } from "./data/learningPaths";

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
  /** learning paths (and optionally steps) the video appears in; empty step = the path's overview */
  placements: VideoPlacement[];
}
export interface VideoPlacement { pathId: string; step: string }

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

// Words that tie a video topic to learning-path steps (matched in the step title and explanation).
const TOPIC_WORDS: Record<string, RegExp> = {
  "Onboarding": /plain terms|glossary|role profile|\bconcepts\b/i,
  "ISO 19650 basics": /plain terms|19650 concepts|glossary|clauses and checklist/i,
  "Information requirements": /\b(eir|oir|air)\b|information requirements|level of information need|information uses/i,
  "CDE & workflows": /\bcde\b|container name|status codes|documents move/i,
  "Modelling standards": /revit|level of information need|responsibility matrix/i,
  "Coordination & clash": /clash|coordinat|\bbcf\b|federat/i,
  "QA/QC": /\bqa\b|quality|check your|check a batch|against requirements|against the eir/i,
  "Handover & COBie": /cobie|handover|asset information/i,
  "Software how-to": /revit|\bbcf\b|\bifc\b/i,
  "AI tools": /\bai\b|42001|assistant|agent/i,
};

/** Learning-path steps that match a video's topic, plus words from its title and description. */
export function suggestPlacements(topic: string, text = ""): VideoPlacement[] {
  const words = text.toLowerCase().match(/[a-z0-9]{4,}/g)?.filter((w) => !["video", "with", "from", "this", "that", "your", "what", "part", "overview"].includes(w)) ?? [];
  const re = TOPIC_WORDS[topic];
  const out: VideoPlacement[] = [];
  for (const p of LEARNING_PATHS) for (const s of p.steps) {
    const hay = `${s.title} ${s.why}`.toLowerCase();
    if ((re && re.test(hay)) || words.some((w) => hay.includes(w))) out.push({ pathId: p.id, step: s.title });
  }
  return out;
}

/** Where a video shows when an administrator has not placed it: the steps its topic matches, at most two per path. */
export function autoPlacements(topic: string): VideoPlacement[] {
  const re = TOPIC_WORDS[topic];
  if (!re) return [];
  return LEARNING_PATHS.flatMap((p) => p.steps.filter((s) => re.test(`${s.title} ${s.why}`)).slice(0, 2).map((s) => ({ pathId: p.id, step: s.title })));
}
/** The placements in effect: the administrator's choice, or the automatic ones. */
export const placementsOf = (v: Pick<CompanyVideo, "placements" | "topic">) => (v.placements?.length ? v.placements : autoPlacements(v.topic));
