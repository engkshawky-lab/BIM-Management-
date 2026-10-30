import { randomBytes } from "crypto";
import { lookup } from "dns/promises";
import { isIP } from "net";
import { Router, type Request, type Response } from "express";
import {
  APS_TOKEN_URL, APS_USERINFO_URL, apsAuthorizeUrl, apsBasicAuth, apsFolderContentsUrl, apsHubsUrl, apsNextHref, apsProjectsUrl, apsTokenBody, apsTopFoldersUrl,
  isReadOnlyGraphql, mergeContents, normalizeApsUser, normalizeFolderContents, normalizeHubs, normalizeProjects, normalizeSpeckleServer, normalizeTopFolders,
  parseApsToken, parseObjectLines, speckleGraphqlUrl, speckleObjectsUrl, SPECKLE_MAX_OBJECTS, type ApsContents, type ApsTokens, type ApsUser,
} from "../../shared/connectors";
import { h } from "./auth";

// CDE / model-platform connectors.
// APS (ACC / BIM 360 Docs): server-side 3-legged OAuth; tokens stay in this process's memory keyed by user id and never reach the browser.
// Speckle: the browser calls Speckle directly; these relay routes exist only for servers that block browser (CORS) requests.
// Tokens are never logged or stored here.

const r = Router();

// ---------------------------------------------------------------- APS

interface ApsSession extends ApsTokens { user?: ApsUser }
const apsSessions = new Map<string, ApsSession>();
const apsStates = new Map<string, { userId: string; expires: number }>();
const MAX_PAGES = 25;

const apsConfig = () => {
  const clientId = process.env.APS_CLIENT_ID?.trim(), clientSecret = process.env.APS_CLIENT_SECRET?.trim(), callback = process.env.APS_CALLBACK_URL?.trim();
  return clientId && clientSecret && callback ? { clientId, clientSecret, callback } : null;
};
const uid = (req: Request) => req.user!.id;
const NOT_CONFIGURED = { error: "APS is not configured on the server" };

class ApsError extends Error { constructor(message: string, public status: number) { super(message); } }

async function tokenRequest(body: string): Promise<ApsTokens> {
  const cfg = apsConfig()!;
  const res = await fetch(APS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", Authorization: apsBasicAuth(cfg.clientId, cfg.clientSecret) },
    body, signal: AbortSignal.timeout(20_000),
  });
  const json = await res.json().catch(() => ({}));
  const tok = res.ok ? parseApsToken(json) : null;
  if (!tok) throw new ApsError(`Autodesk sign-in failed (${res.status}).`, res.status === 400 || res.status === 401 ? 401 : 502);
  return tok;
}

async function refresh(userId: string, s: ApsSession): Promise<ApsSession> {
  if (!s.refreshToken) { apsSessions.delete(userId); throw new ApsError("Your Autodesk session has expired. Connect again.", 401); }
  try {
    const t = await tokenRequest(apsTokenBody({ grant: "refresh_token", refreshToken: s.refreshToken }));
    const next = { ...s, ...t, refreshToken: t.refreshToken || s.refreshToken };
    apsSessions.set(userId, next);
    return next;
  } catch (e) {
    apsSessions.delete(userId);
    throw e instanceof ApsError && e.status === 401 ? new ApsError("Your Autodesk session has expired. Connect again.", 401) : e;
  }
}

/** GET an APS URL with the user's token; refreshes once on expiry or a 401. */
async function apsGet(userId: string, url: string): Promise<unknown> {
  let s = apsSessions.get(userId);
  if (!s) throw new ApsError("Not connected to Autodesk.", 401);
  if (Date.now() >= s.expiresAt) s = await refresh(userId, s);
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${s.accessToken}`, Accept: "application/vnd.api+json, application/json" }, signal: AbortSignal.timeout(30_000) });
    if (res.status === 401 && attempt === 0) { s = await refresh(userId, s); continue; }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = (json as { errors?: { detail?: string; title?: string }[] }).errors?.[0];
      const msg = detail?.detail || detail?.title || `Autodesk request failed (${res.status}).`;
      throw new ApsError(res.status === 403 ? `${msg} Check that the APS app is added as a custom integration in the ACC account and that you have access.` : msg, res.status === 404 || res.status === 403 ? res.status : 502);
    }
    return json;
  }
  throw new ApsError("Autodesk request failed.", 502);
}

/** Follow links.next across pages (APS host only). */
async function apsGetAll(userId: string, first: string): Promise<unknown[]> {
  const pages: unknown[] = [];
  let url: string | undefined = first;
  for (let i = 0; url && i < MAX_PAGES; i++) { const json = await apsGet(userId, url); pages.push(json); url = apsNextHref(json); }
  return pages;
}

const apsRoute = (fn: (req: Request, res: Response) => Promise<unknown>) => h(async (req, res) => {
  if (!apsConfig()) return res.status(400).json(NOT_CONFIGURED);
  try { await fn(req, res); } catch (e) {
    if (e instanceof ApsError) return res.status(e.status).json({ error: e.message });
    console.error("APS connector error:", (e as Error).message);
    res.status(502).json({ error: "Could not reach Autodesk Platform Services." });
  }
});

r.get("/aps/status", (req, res) => {
  const s = apsSessions.get(uid(req));
  res.json({ configured: !!apsConfig(), connected: !!s, user: s?.user, callbackUrl: apsConfig()?.callback });
});

r.get("/aps/login", (req, res) => {
  const cfg = apsConfig();
  if (!cfg) return res.status(400).json(NOT_CONFIGURED);
  const now = Date.now();
  for (const [k, v] of apsStates) if (v.expires < now) apsStates.delete(k);
  const state = randomBytes(24).toString("base64url");
  apsStates.set(state, { userId: uid(req), expires: now + 10 * 60_000 });
  res.redirect(apsAuthorizeUrl({ clientId: cfg.clientId, redirectUri: cfg.callback, state }));
});

r.get("/aps/callback", h(async (req, res) => {
  const back = (q = "") => res.redirect(`/#/connectors/acc${q}`);
  if (!apsConfig()) return back("?aps=notconfigured");
  const state = String(req.query.state ?? ""), code = String(req.query.code ?? "");
  const st = apsStates.get(state);
  apsStates.delete(state);
  if (req.query.error || !code || !st || st.userId !== uid(req) || st.expires < Date.now()) return back("?aps=failed");
  try {
    const tok = await tokenRequest(apsTokenBody({ grant: "authorization_code", code, redirectUri: apsConfig()!.callback }));
    const session: ApsSession = { ...tok };
    try {
      const u = await fetch(APS_USERINFO_URL, { headers: { Authorization: `Bearer ${tok.accessToken}` }, signal: AbortSignal.timeout(15_000) });
      if (u.ok) session.user = normalizeApsUser(await u.json());
    } catch { /* name is optional */ }
    apsSessions.set(uid(req), session);
    back("?aps=connected");
  } catch { back("?aps=failed"); }
}));

r.post("/aps/logout", (req, res) => { apsSessions.delete(uid(req)); res.json({ ok: true }); });

r.get("/aps/hubs", apsRoute(async (req, res) => {
  const pages = await apsGetAll(uid(req), apsHubsUrl());
  res.json({ hubs: pages.flatMap(normalizeHubs) });
}));

r.get("/aps/hubs/:hubId/projects", apsRoute(async (req, res) => {
  const pages = await apsGetAll(uid(req), apsProjectsUrl(req.params.hubId));
  res.json({ projects: pages.flatMap(normalizeProjects).sort((a, b) => a.name.localeCompare(b.name)) });
}));

r.get("/aps/projects/:projectId/topFolders", apsRoute(async (req, res) => {
  const hubId = String(req.query.hubId ?? "");
  if (!hubId) return res.status(400).json({ error: "hubId is required." });
  const json = await apsGet(uid(req), apsTopFoldersUrl(hubId, req.params.projectId));
  res.json({ folders: normalizeTopFolders(json) });
}));

r.get("/aps/projects/:projectId/folders/:folderId/contents", apsRoute(async (req, res) => {
  const pages = await apsGetAll(uid(req), apsFolderContentsUrl(req.params.projectId, req.params.folderId));
  const merged: ApsContents = mergeContents(pages.map(normalizeFolderContents));
  res.json({ ...merged, truncated: pages.length >= MAX_PAGES && !!apsNextHref(pages[pages.length - 1]) });
}));

// ---------------------------------------------------------------- Speckle relay (fallback only)

const PRIVATE = [/^10\./, /^127\./, /^169\.254\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^::1$/, /^f[cd]/i, /^fe80/i, /^::ffff:(10|127|192\.168|169\.254)\./i];

/** The relay only talks to public https Speckle servers (no localhost or private networks from the server side). */
async function speckleServer(input: unknown): Promise<string | null> {
  const origin = normalizeSpeckleServer(String(input ?? ""));
  if (!origin || !origin.startsWith("https://")) return null;
  const host = new URL(origin).hostname;
  try {
    const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    if (!addrs.length || addrs.some((a) => PRIVATE.some((re) => re.test(a.address)))) return null;
  } catch { return null; }
  return origin;
}
const tokenOf = (v: unknown) => { const s = String(v ?? "").trim(); return s && s.length < 400 && /^[\w.\-~+/=]+$/.test(s) ? s : ""; };

r.post("/speckle/query", h(async (req, res) => {
  const server = await speckleServer(req.body?.server);
  const token = tokenOf(req.body?.token);
  const query = String(req.body?.query ?? "");
  const variables = req.body?.variables && typeof req.body.variables === "object" ? req.body.variables : {};
  if (!server) return res.status(400).json({ error: "Enter a public https Speckle server address." });
  if (!token) return res.status(400).json({ error: "Enter a Speckle personal access token." });
  if (!isReadOnlyGraphql(query)) return res.status(400).json({ error: "Only read-only queries are relayed." });
  try {
    const up = await fetch(speckleGraphqlUrl(server), {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(30_000),
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables }),
    });
    const json = await up.json().catch(() => ({}));
    res.status(up.ok ? 200 : up.status === 401 || up.status === 403 ? up.status : 502).json(json);
  } catch { res.status(502).json({ error: "Could not reach the Speckle server." }); }
}));

r.post("/speckle/objects", h(async (req, res) => {
  const server = await speckleServer(req.body?.server);
  const token = tokenOf(req.body?.token);
  const projectId = String(req.body?.projectId ?? ""), objectId = String(req.body?.objectId ?? "");
  const limit = Math.min(SPECKLE_MAX_OBJECTS * 5, Math.max(1, Number(req.body?.limit) || SPECKLE_MAX_OBJECTS));
  if (!server || !token || !/^[\w-]{1,80}$/.test(projectId) || !/^[\w.-]{1,200}$/.test(objectId)) return res.status(400).json({ error: "Server, token, project and object are required." });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  try {
    const up = await fetch(speckleObjectsUrl(server, projectId, objectId), { headers: { Accept: "text/plain", Authorization: `Bearer ${token}` }, redirect: "error", signal: ctrl.signal });
    if (!up.ok || !up.body) {
      const body = await up.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
      return res.status(up.status === 404 ? 404 : up.status === 401 || up.status === 403 ? up.status : 502).json({ error: body.error?.message || `Speckle returned ${up.status}.`, code: body.error?.code });
    }
    // Read only as many lines as needed, then stop the download.
    const reader = up.body.getReader();
    const dec = new TextDecoder();
    let text = "", lines = 0;
    while (lines <= limit) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = dec.decode(value, { stream: true });
      text += chunk;
      lines += chunk.split("\n").length - 1;
      if (text.length > 80 * 1024 * 1024) break;
    }
    reader.cancel().catch(() => undefined);
    res.json(parseObjectLines(text, limit));
  } catch { res.status(502).json({ error: "Could not read objects from the Speckle server." }); }
  finally { clearTimeout(timer); }
}));

export default r;
