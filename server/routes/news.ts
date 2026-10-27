import { Router } from "express";
import fs from "fs";
import path from "path";
import { AiError, apiKey, ask, parseJson } from "../claude";
import { UPLOAD_DIR } from "../storage";
import { h } from "./auth";

// BIM & ISO 19650 news: Claude searches the web and summarises recent stories; results are cached on disk
// so every user reads the same feed. Refreshes on demand (at most hourly) or on a schedule with NEWS_REFRESH=hourly.

export const NEWS_TOPICS = ["ISO 19650", "Standards", "BIM", "Digital twin", "Software", "Policy"] as const;
interface NewsItem { title: string; summary: string; source: string; url: string; date: string; topic: string; relevance: "High" | "Medium" | "Low"; parts: string[] }
interface NewsCache { updatedAt: string; items: NewsItem[] }

const CACHE = path.join(UPLOAD_DIR, "news-cache.json");
const MIN_AGE_MS = 60 * 60_000;
let running: Promise<NewsCache> | null = null;

const read = (): NewsCache | null => { try { return JSON.parse(fs.readFileSync(CACHE, "utf8")) as NewsCache; } catch { return null; } };
const age = (c: NewsCache | null) => (c ? Date.now() - new Date(c.updatedAt).getTime() : Infinity);
const safeUrl = (u: unknown) => { try { const x = new URL(String(u)); return x.protocol === "https:" || x.protocol === "http:" ? x.toString() : ""; } catch { return ""; } };

async function fetchNews(): Promise<NewsCache> {
  const system = `You are a research assistant for ISO 19650 information management practitioners.
Use web search to find 10–15 genuinely recent news items (last 60 days where possible) on BIM, ISO 19650 and related standards (ISO 7817, IFC/buildingSMART, COBie, digital twins), government BIM policy, and major BIM software updates.
Prefer primary sources (ISO, BSI, CEN, buildingSMART International, UK BIM Framework, national governments, RIBA, RICS, vendor release notes) over aggregators. Never invent a story, date or URL: every item must come from a page you found.
Respond with one JSON object only, no Markdown fences:
{"items": [{"title": string, "summary": "3–5 sentence neutral summary in your own words", "source": "publisher name", "url": "https://…", "date": "YYYY-MM-DD or empty if unknown",
"topic": ${NEWS_TOPICS.map((t) => `"${t}"`).join(" | ")}, "relevance": "High" | "Medium" | "Low", "parts": ["19650-1".."19650-6" affected, may be empty]}]}`;
  const { text } = await ask({
    system, messages: [{ role: "user", content: `Today is ${new Date().toISOString().slice(0, 10)}. Compile the news feed.` }],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }], maxTokens: 12000,
  });
  const out = parseJson<{ items?: Record<string, unknown>[] }>(text);
  const items: NewsItem[] = (out.items ?? []).map((x) => ({
    title: String(x.title ?? "").slice(0, 300), summary: String(x.summary ?? "").slice(0, 2000), source: String(x.source ?? "").slice(0, 120), url: safeUrl(x.url),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(x.date)) ? String(x.date) : "",
    topic: (NEWS_TOPICS as readonly string[]).includes(String(x.topic)) ? String(x.topic) : "BIM",
    relevance: (["High", "Medium", "Low"].includes(String(x.relevance)) ? x.relevance : "Medium") as NewsItem["relevance"],
    parts: Array.isArray(x.parts) ? x.parts.map(String).filter((p) => /^19650-[1-6]$/.test(p)) : [],
  })).filter((x) => x.title && x.url).sort((a, b) => b.date.localeCompare(a.date));
  const cache = { updatedAt: new Date().toISOString(), items };
  await fs.promises.writeFile(CACHE, JSON.stringify(cache));
  return cache;
}

/** Refresh once at a time; callers share the running request. */
export function refreshNews() {
  running ??= fetchNews().finally(() => { running = null; });
  return running;
}

/** Hourly background refresh, only when explicitly enabled (each refresh is a paid web-search request). */
export function startNewsSchedule() {
  if (process.env.NEWS_REFRESH !== "hourly" || !apiKey()) return;
  const run = () => { if (age(read()) >= MIN_AGE_MS) refreshNews().catch((e) => console.error("[news]", e)); };
  setTimeout(run, 60_000);
  setInterval(run, 15 * 60_000);
}

const r = Router();

r.get("/news", (_req, res) => {
  const c = read();
  res.json({ updatedAt: c?.updatedAt ?? null, items: c?.items ?? [], topics: NEWS_TOPICS, refreshing: !!running, scheduled: process.env.NEWS_REFRESH === "hourly" });
});

r.post("/news/refresh", h(async (_req, res) => {
  const c = read();
  if (age(c) < MIN_AGE_MS) return res.json({ updatedAt: c!.updatedAt, items: c!.items, cached: true });
  const fresh = await refreshNews().catch((e) => { throw e instanceof SyntaxError ? new AiError("The AI response could not be read. Try again.", 502) : e; });
  res.json({ updatedAt: fresh.updatedAt, items: fresh.items, cached: false });
}));

export default r;
