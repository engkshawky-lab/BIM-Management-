// Pure helpers for the CDE / model-platform connectors: Autodesk Platform Services (ACC / BIM 360 Docs) and Speckle.
// No network calls here: URL builders, request bodies, response normalisers and model-data statistics, so they can be unit tested.
//
// APS references (checked October 2026):
//  - OAuth v2 endpoints from https://developer.api.autodesk.com/.well-known/openid-configuration
//    (authorize /authentication/v2/authorize, token /authentication/v2/token, userinfo https://api.userprofile.autodesk.com/userinfo)
//  - Token request shape: https://aps.autodesk.com/blog/migration-guide-oauth2-v1-v2 (Basic client auth, form body)
//  - Data Management API: https://github.com/autodesk-platform-services/aps-sdk-openapi/blob/main/datamanagement/datamanagement.yaml
// Speckle references:
//  - GraphQL schema of https://app.speckle.systems/graphql (introspected): activeUser.projects, Project.models, Model.versions
//  - REST objects: https://docs.speckle.systems/api-reference/objects/download-an-object-and-all-its-children
//    (Accept: text/plain gives one "id<TAB>json" line per object); bundle-only versions are not served there.

// ======================================================================= APS

export const APS_HOST = "https://developer.api.autodesk.com";
export const APS_AUTHORIZE_URL = `${APS_HOST}/authentication/v2/authorize`;
export const APS_TOKEN_URL = `${APS_HOST}/authentication/v2/token`;
export const APS_USERINFO_URL = "https://api.userprofile.autodesk.com/userinfo";
/** data:read for hubs, projects, folders and items; user-profile:read for the signed-in user's name. */
export const APS_SCOPES = ["data:read", "user-profile:read"];
/** Page size for Data Management lists (documented max is 200). */
export const APS_PAGE_LIMIT = 200;

export function apsAuthorizeUrl(o: { clientId: string; redirectUri: string; state: string; scopes?: string[] }): string {
  const q = new URLSearchParams({ response_type: "code", client_id: o.clientId, redirect_uri: o.redirectUri, scope: (o.scopes ?? APS_SCOPES).join(" "), state: o.state });
  return `${APS_AUTHORIZE_URL}?${q.toString()}`;
}

/** "Basic base64(client_id:client_secret)" as required by the v2 token endpoint. */
export function apsBasicAuth(clientId: string, clientSecret: string): string {
  const raw = `${clientId}:${clientSecret}`;
  const b64 = typeof Buffer !== "undefined" ? Buffer.from(raw, "utf8").toString("base64") : btoa(raw);
  return `Basic ${b64}`;
}

export type ApsGrant = { grant: "authorization_code"; code: string; redirectUri: string } | { grant: "refresh_token"; refreshToken: string; scopes?: string[] };

/** application/x-www-form-urlencoded body for the token endpoint. */
export function apsTokenBody(g: ApsGrant): string {
  const q = g.grant === "authorization_code"
    ? new URLSearchParams({ grant_type: "authorization_code", code: g.code, redirect_uri: g.redirectUri })
    : new URLSearchParams({ grant_type: "refresh_token", refresh_token: g.refreshToken, scope: (g.scopes ?? APS_SCOPES).join(" ") });
  return q.toString();
}

export interface ApsTokens { accessToken: string; refreshToken: string; expiresAt: number }

/** Normalise a token response; expiresAt is a ms timestamp with a 60 s safety margin. */
export function parseApsToken(json: unknown, now = Date.now()): ApsTokens | null {
  const o = obj(json);
  const accessToken = str(o.access_token);
  if (!accessToken) return null;
  const expiresIn = Number(o.expires_in) || 3600;
  return { accessToken, refreshToken: str(o.refresh_token), expiresAt: now + Math.max(0, expiresIn - 60) * 1000 };
}

const enc = encodeURIComponent;
const page = (n?: number, limit = APS_PAGE_LIMIT) => `page%5Bnumber%5D=${Math.max(0, n ?? 0)}&page%5Blimit%5D=${limit}`;

export const apsHubsUrl = () => `${APS_HOST}/project/v1/hubs`;
export const apsProjectsUrl = (hubId: string, pageNumber = 0) => `${APS_HOST}/project/v1/hubs/${enc(hubId)}/projects?${page(pageNumber)}`;
export const apsTopFoldersUrl = (hubId: string, projectId: string) => `${APS_HOST}/project/v1/hubs/${enc(hubId)}/projects/${enc(projectId)}/topFolders`;
export const apsFolderContentsUrl = (projectId: string, folderId: string, pageNumber = 0, limit = APS_PAGE_LIMIT) =>
  `${APS_HOST}/data/v1/projects/${enc(projectId)}/folders/${enc(folderId)}/contents?${page(pageNumber, limit)}`;

/** links.next.href of a paginated JSON:API response, accepted only when it points back at the APS host. */
export function apsNextHref(json: unknown): string | undefined {
  const href = str(obj(obj(obj(json).links).next).href);
  return href && isApsUrl(href) ? href : undefined;
}
export function isApsUrl(href: string): boolean {
  try { const u = new URL(href); return u.protocol === "https:" && u.host === new URL(APS_HOST).host; } catch { return false; }
}

export type ApsHubKind = "ACC / BIM 360" | "Fusion Team" | "Personal" | "Other";
export interface ApsHub { id: string; name: string; kind: ApsHubKind; region: string }
export interface ApsProject { id: string; name: string; kind: string }
export interface ApsFolder { id: string; name: string; modified: string; modifiedBy: string; objectCount: number | null }
export interface ApsFile { id: string; name: string; version: number | null; modified: string; modifiedBy: string; size: number | null; fileType: string; versionId: string }
export interface ApsContents { folders: ApsFolder[]; files: ApsFile[] }

const extType = (a: Record<string, unknown>) => str(obj(a.extension).type);

export function hubKind(type: string): ApsHubKind {
  if (/bim360|autodesk\.acc/i.test(type)) return "ACC / BIM 360";
  if (/a360:PersonalHub/i.test(type)) return "Personal";
  if (/core:Hub/i.test(type)) return "Fusion Team";
  return "Other";
}

export function normalizeHubs(json: unknown): ApsHub[] {
  return arr(obj(json).data).map(obj).filter((d) => str(d.id)).map((d) => {
    const a = obj(d.attributes);
    return { id: str(d.id), name: str(a.name) || str(d.id), kind: hubKind(extType(a)), region: str(a.region) };
  }).sort((x, y) => x.name.localeCompare(y.name));
}

export function normalizeProjects(json: unknown): ApsProject[] {
  return arr(obj(json).data).map(obj).filter((d) => str(d.id)).map((d) => {
    const a = obj(d.attributes);
    const t = extType(a);
    return { id: str(d.id), name: str(a.name) || str(d.id), kind: /bim360|acc/i.test(t) ? "ACC / BIM 360" : t.replace(/^projects:autodesk\./, "") };
  });
}

function toFolder(d: Record<string, unknown>): ApsFolder {
  const a = obj(d.attributes);
  const n = Number(a.objectCount);
  return { id: str(d.id), name: str(a.displayName) || str(a.name) || str(d.id), modified: str(a.lastModifiedTime), modifiedBy: str(a.lastModifiedUserName), objectCount: Number.isFinite(n) && a.objectCount !== undefined ? n : null };
}

/** Top folders: hidden system folders are dropped. */
export function normalizeTopFolders(json: unknown): ApsFolder[] {
  return arr(obj(json).data).map(obj).filter((d) => d.type === "folders" && !obj(d.attributes).hidden).map(toFolder);
}

/**
 * Folder contents: sub-folders plus items joined to their tip version (from `included`).
 * For BIM 360 / ACC the file name is the version's attributes.name (item displayName is reserved there).
 */
export function normalizeFolderContents(json: unknown): ApsContents {
  const o = obj(json);
  const versions = new Map(arr(o.included).map(obj).filter((v) => v.type === "versions").map((v) => [str(v.id), v] as const));
  const folders: ApsFolder[] = [];
  const files: ApsFile[] = [];
  for (const d of arr(o.data).map(obj)) {
    const a = obj(d.attributes);
    if (a.hidden === true) continue;
    if (d.type === "folders") { folders.push(toFolder(d)); continue; }
    if (d.type !== "items") continue;
    const tipId = str(obj(obj(obj(d.relationships).tip).data).id);
    const v = obj(versions.get(tipId));
    const va = obj(v.attributes);
    const vn = Number(va.versionNumber);
    const size = Number(va.storageSize);
    files.push({
      id: str(d.id), versionId: tipId,
      name: str(va.name) || str(a.displayName) || str(va.displayName) || str(d.id),
      version: Number.isFinite(vn) && va.versionNumber !== undefined ? vn : null,
      modified: str(va.lastModifiedTime) || str(a.lastModifiedTime),
      modifiedBy: str(va.lastModifiedUserName) || str(a.lastModifiedUserName),
      size: Number.isFinite(size) && va.storageSize !== undefined ? size : null,
      fileType: str(va.fileType) || (/\.([a-z0-9]+)$/i.exec(str(va.name) || str(a.displayName))?.[1] ?? "").toLowerCase(),
    });
  }
  folders.sort((x, y) => x.name.localeCompare(y.name));
  files.sort((x, y) => x.name.localeCompare(y.name));
  return { folders, files };
}

/** Merge pages of folder contents. */
export const mergeContents = (pages: ApsContents[]): ApsContents => ({
  folders: pages.flatMap((p) => p.folders).sort((x, y) => x.name.localeCompare(y.name)),
  files: pages.flatMap((p) => p.files).sort((x, y) => x.name.localeCompare(y.name)),
});

export interface ApsUser { name: string; email: string }
export function normalizeApsUser(json: unknown): ApsUser {
  const o = obj(json);
  const name = str(o.name) || [str(o.given_name), str(o.family_name)].filter(Boolean).join(" ") || str(o.preferred_username);
  return { name, email: str(o.email) };
}

// ======================================================================= Speckle

export const SPECKLE_DEFAULT_SERVER = "https://app.speckle.systems";
export const SPECKLE_MAX_OBJECTS = 2000;

/** Origin of a Speckle server URL; https only (http allowed for localhost self-hosted servers). Returns "" when invalid. */
export function normalizeSpeckleServer(input: string): string {
  const raw = (input || "").trim() || SPECKLE_DEFAULT_SERVER;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (u.protocol !== "https:" && !(local && u.protocol === "http:")) return "";
    if (u.username || u.password) return "";
    return u.origin;
  } catch { return ""; }
}

export const speckleGraphqlUrl = (server: string) => `${server}/graphql`;
export const speckleObjectsUrl = (server: string, projectId: string, objectId: string) => `${server}/objects/${enc(projectId)}/${enc(objectId)}`;
export const speckleTokenSettingsUrl = (server: string) => `${server}/settings/user/developer-settings`;
export const speckleVersionUrl = (server: string, projectId: string, modelId: string, versionId: string) => `${server}/projects/${enc(projectId)}/models/${enc(modelId)}@${enc(versionId)}`;

export const SPECKLE_USER_QUERY = `query ActiveUser { activeUser { id name email } }`;
export const SPECKLE_PROJECTS_QUERY = `query Projects($limit: Int, $cursor: String) {
  activeUser { id projects(limit: $limit, cursor: $cursor) { totalCount cursor items { id name updatedAt } } }
}`;
export const SPECKLE_MODELS_QUERY = `query Models($projectId: String!, $limit: Int, $cursor: String) {
  project(id: $projectId) { id models(limit: $limit, cursor: $cursor) { totalCount cursor items { id name displayName updatedAt } } }
}`;
export const SPECKLE_VERSIONS_QUERY = `query Versions($projectId: String!, $modelId: String!, $limit: Int, $cursor: String) {
  project(id: $projectId) { id model(id: $modelId) { id name versions(limit: $limit, cursor: $cursor) {
    totalCount cursor items { id message sourceApplication createdAt referencedObject totalChildrenCount authorUser { name } }
  } } }
}`;
/** Queries the proxy will relay: read-only, no mutations or subscriptions. */
export const isReadOnlyGraphql = (q: string) => typeof q === "string" && q.length < 4000 && /^\s*(query\b|\{)/.test(q) && !/\b(mutation|subscription)\b/i.test(q);

export interface SpeckleUser { id: string; name: string; email: string }
export interface SpeckleProject { id: string; name: string; updatedAt: string }
export interface SpeckleModel { id: string; name: string; updatedAt: string }
export interface SpeckleVersion { id: string; message: string; sourceApplication: string; createdAt: string; referencedObject: string; author: string; totalChildrenCount: number | null; bundle: boolean }
export interface Page<T> { items: T[]; cursor: string | null; totalCount: number }

/** GraphQL errors as one message (the first few), or "" when none. */
export function graphqlError(json: unknown): string {
  const errs = arr(obj(json).errors).map((e) => str(obj(e).message)).filter(Boolean);
  return errs.slice(0, 3).join(" ");
}
const coll = <T>(c: unknown, map: (x: Record<string, unknown>) => T): Page<T> => {
  const o = obj(c);
  return { items: arr(o.items).map(obj).map(map), cursor: str(o.cursor) || null, totalCount: Number(o.totalCount) || 0 };
};

export function normalizeSpeckleUser(json: unknown): SpeckleUser | null {
  const u = obj(obj(obj(json).data).activeUser);
  return str(u.id) ? { id: str(u.id), name: str(u.name), email: str(u.email) } : null;
}
export const normalizeSpeckleProjects = (json: unknown): Page<SpeckleProject> =>
  coll(obj(obj(obj(json).data).activeUser).projects, (p) => ({ id: str(p.id), name: str(p.name) || str(p.id), updatedAt: str(p.updatedAt) }));
export const normalizeSpeckleModels = (json: unknown): Page<SpeckleModel> =>
  coll(obj(obj(obj(json).data).project).models, (m) => ({ id: str(m.id), name: str(m.name) || str(m.displayName) || str(m.id), updatedAt: str(m.updatedAt) }));
export const normalizeSpeckleVersions = (json: unknown): Page<SpeckleVersion> =>
  coll(obj(obj(obj(obj(json).data).project).model).versions, (v) => {
    const ref = str(v.referencedObject);
    const n = Number(v.totalChildrenCount);
    return { id: str(v.id), message: str(v.message), sourceApplication: str(v.sourceApplication), createdAt: str(v.createdAt), referencedObject: ref,
      author: str(obj(v.authorUser).name), totalChildrenCount: v.totalChildrenCount == null || !Number.isFinite(n) ? null : n, bundle: isBundleRef(ref) };
  });

/** Bundle-only versions (Speckle 2026.9+) reference `bundle.<projectId>.<modelId>.<versionId>` instead of an object id. */
export const isBundleRef = (ref: string) => /^bundle\./.test(ref || "");

export type SpeckleObject = Record<string, unknown> & { id?: string; speckle_type?: string };

/** Parse the text/plain objects stream ("id<TAB>json" per line), up to `limit` objects. Invalid lines are skipped. */
export function parseObjectLines(text: string, limit = SPECKLE_MAX_OBJECTS): { objects: SpeckleObject[]; truncated: boolean } {
  const objects: SpeckleObject[] = [];
  let truncated = false;
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    if (objects.length >= limit) { truncated = true; break; }
    const tab = line.indexOf("\t");
    try { const o = JSON.parse(tab >= 0 ? line.slice(tab + 1) : line); if (o && typeof o === "object" && !Array.isArray(o)) objects.push(o as SpeckleObject); } catch { /* partial or bad line */ }
  }
  return { objects, truncated };
}

/** Speckle infrastructure objects that are not model elements. */
const NON_ELEMENT = /(DataChunk|RenderMaterial|ObjectReference|Proxy|ColorProxy|[.:]Collection$)/i;
export const isElement = (o: SpeckleObject) => !NON_ELEMENT.test(str(o.speckle_type));

/** Last segment of a speckle_type ("Objects.BuiltElements.Wall:Objects.BuiltElements.Revit.RevitWall" -> "RevitWall"). */
export const shortType = (t: string) => (t || "").split(":").pop()!.split(".").pop() || "(none)";
export function categoryOf(o: SpeckleObject): string {
  const p = obj(o.properties);
  return str(o.category) || str(p.category) || str(p.Category) || str(obj(p["Revit Parameters"]).Category) || "";
}

export interface CountRow { key: string; count: number }
export function countBy(objects: SpeckleObject[], key: (o: SpeckleObject) => string): CountRow[] {
  const m = new Map<string, number>();
  for (const o of objects) { const k = key(o) || "(none)"; m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

const SKIP_KEYS = new Set(["id", "speckle_type", "totalChildrenCount", "__closure", "applicationId", "displayValue", "elements", "@elements", "units"]);
const MAX_DEPTH = 3;

/** Property paths seen on the objects (dot separated, up to 3 levels, scalars only), most frequent first. */
export function propertyKeys(objects: SpeckleObject[], max = 300): string[] {
  const m = new Map<string, number>();
  const walk = (o: Record<string, unknown>, prefix: string, depth: number) => {
    for (const [k, v] of Object.entries(o)) {
      if (SKIP_KEYS.has(k) || k.startsWith("__")) continue;
      const path = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) { if (depth < MAX_DEPTH && !("referencedId" in v)) walk(v as Record<string, unknown>, path, depth + 1); }
      else if (!Array.isArray(v)) m.set(path, (m.get(path) ?? 0) + 1);
    }
  };
  for (const o of objects) walk(o, "", 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([k]) => k);
}

/** Value at a dot path. */
export function getPath(o: unknown, path: string): unknown {
  let cur: unknown = o;
  for (const part of path.split(".")) { if (!cur || typeof cur !== "object") return undefined; cur = (cur as Record<string, unknown>)[part]; }
  return cur;
}
const hasValue = (v: unknown) => v !== undefined && v !== null && !(typeof v === "string" && !v.trim());

export interface Completeness { property: string; total: number; filled: number; percent: number; byType: { key: string; total: number; filled: number; percent: number }[] }

/** Share of objects with a non-empty value at `path`, overall and per short speckle_type. */
export function completeness(objects: SpeckleObject[], path: string): Completeness {
  const by = new Map<string, { total: number; filled: number }>();
  let filled = 0;
  for (const o of objects) {
    const k = shortType(str(o.speckle_type));
    const b = by.get(k) ?? { total: 0, filled: 0 };
    b.total++;
    if (hasValue(getPath(o, path))) { b.filled++; filled++; }
    by.set(k, b);
  }
  const pct = (f: number, t: number) => (t ? Math.round((f / t) * 1000) / 10 : 0);
  return {
    property: path, total: objects.length, filled, percent: pct(filled, objects.length),
    byType: [...by].map(([key, b]) => ({ key, ...b, percent: pct(b.filled, b.total) })).sort((a, b) => b.total - a.total || a.key.localeCompare(b.key)),
  };
}

// ======================================================================= small utils

function obj(v: unknown): Record<string, unknown> { return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}; }
function arr(v: unknown): unknown[] { return Array.isArray(v) ? v : []; }
function str(v: unknown): string { return typeof v === "string" ? v : typeof v === "number" ? String(v) : ""; }
