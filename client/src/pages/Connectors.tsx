import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { t } from "../i18n";
import { api } from "../lib/api";
import { exportCsv } from "../lib/export";
import { getProjectData } from "../lib/projectStore";
import { checkNames, formatMsg, type NameCheck } from "../../../shared/namingCheck";
import {
  categoryOf, completeness, countBy, graphqlError, isElement, normalizeSpeckleModels, normalizeSpeckleProjects, normalizeSpeckleServer, normalizeSpeckleUser,
  normalizeSpeckleVersions, parseObjectLines, propertyKeys, shortType, SPECKLE_DEFAULT_SERVER, SPECKLE_MAX_OBJECTS, SPECKLE_MODELS_QUERY, SPECKLE_PROJECTS_QUERY,
  SPECKLE_USER_QUERY, SPECKLE_VERSIONS_QUERY, speckleObjectsUrl, speckleTokenSettingsUrl, speckleVersionUrl,
  type ApsFile, type ApsFolder, type ApsHub, type ApsProject, type SpeckleModel, type SpeckleObject, type SpeckleProject, type SpeckleUser, type SpeckleVersion,
} from "../../../shared/connectors";
import { TONES } from "./hubTheme";
import "./connectors.css";

// CDE / model-platform connectors: browse ACC / BIM 360 Docs through Autodesk Platform Services (server-side OAuth),
// and read Speckle projects, models and versions with a personal access token kept in this browser tab only.
// Route: #/connectors/<acc|speckle>. No AI is used on this page.

/** t() with {placeholders}. */
const tf = (s: string, v: Record<string, string | number>) => t(s).replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
const fmtWhen = (s: string) => { if (!s) return ""; const d = new Date(s); return Number.isNaN(d.getTime()) ? s : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); };
const fmtBytes = (n: number | null) => (n == null ? "" : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));
const ssGet = (k: string) => { try { return sessionStorage.getItem(k) ?? ""; } catch { return ""; } };
const ssSet = (k: string, v: string) => { try { if (v) sessionStorage.setItem(k, v); else sessionStorage.removeItem(k); } catch { /* storage unavailable */ } };

const TABS = [
  { id: "acc", label: "Autodesk Construction Cloud", eyebrow: "ACC · BIM 360 Docs · APS", title: "Browse ACC and BIM 360 Docs", hint: "Sign in with Autodesk, browse hubs, projects and folders, then check file names against your naming rules, export the list or start a transmittal." },
  { id: "speckle", label: "Speckle", eyebrow: "Speckle · open-source model data", title: "Check Speckle model data", hint: "Read projects, models and versions from a Speckle server, count objects by type and category, and measure how complete a property is." },
] as const;

export default function Connectors({ tab }: { tab?: string }) {
  const cur = TABS.find((x) => x.id === tab) ?? TABS[0];
  return (
    <div className="hub connectors" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">{t(cur.eyebrow)}</div><h1>{t(cur.title)}</h1><p>{t(cur.hint)}</p></div>
      <nav className="tabs" aria-label={t("Connectors")}>
        {TABS.map((x) => <a key={x.id} className={"tab" + (x.id === cur.id ? " on" : "")} href={`#/connectors/${x.id}`}>{t(x.label)}</a>)}
      </nav>
      <div key={cur.id}>{cur.id === "acc" ? <AccTab /> : <SpeckleTab />}</div>
    </div>
  );
}

// ======================================================================= ACC / BIM 360 (APS)

interface ApsStatus { configured: boolean; connected: boolean; user?: { name: string; email: string }; callbackUrl?: string }

function AccTab() {
  const [status, setStatus] = useState<ApsStatus | null>(null);
  const [err, setErr] = useState("");
  const notice = useMemo(() => /[?&]aps=(\w+)/.exec(location.hash)?.[1] ?? "", []);
  const load = useCallback(() => { api<ApsStatus>("/aps/status").then(setStatus).catch((e) => setErr(errText(e))); }, []);
  useEffect(load, [load]);
  const disconnect = async () => { try { await api("/aps/logout", { method: "POST", body: {} }); } catch { /* already gone */ } load(); };

  if (err) return <div className="card cx-error">{err}</div>;
  if (!status) return <div className="card muted">{t("Loading…")}</div>;
  return (
    <div className="cx-stack">
      {notice === "connected" && status.connected && <div className="cx-banner ok">{t("Connected to Autodesk.")}</div>}
      {notice === "failed" && <div className="cx-banner err">{t("Autodesk sign-in did not complete. Try again, and check the callback URL and the ACC custom integration.")}</div>}
      {!status.configured ? <ApsSetup /> : !status.connected ? (
        <div className="card cx-stack">
          <b>{t("Connect to Autodesk")}</b>
          <p className="muted small">{t("You will sign in on Autodesk's own page and approve read-only access to your data (data:read). This platform never sees your Autodesk password.")}</p>
          <div><a className="btn cx-btn" href="/api/aps/login">{t("Connect with Autodesk")}</a></div>
        </div>
      ) : (
        <>
          <div className="card row spread">
            <span>{t("Connected as")} <b>{status.user?.name || status.user?.email || t("Autodesk user")}</b>{status.user?.email && status.user?.name ? <span className="muted small"> · {status.user.email}</span> : null}</span>
            <button className="ghost small" onClick={disconnect}>{t("Disconnect")}</button>
          </div>
          <ApsBrowser onExpired={load} />
        </>
      )}
      <PrivacyNote items={[
        t("Sign-in uses Autodesk's 3-legged OAuth. The access token is held in this platform's server memory for your account only, is never sent to your browser, and is cleared when you disconnect or the server restarts."),
        t("Only folder and file metadata (names, version numbers, dates, sizes) is read, with read-only permission. Files are not downloaded or changed."),
        t("Name checks, CSV export and transmittal lists are produced in your browser. AI is not used here."),
      ]} />
    </div>
  );
}

function ApsSetup() {
  const steps: [string, ReactNode?][] = [
    ["Create an app in the APS developer portal (aps.autodesk.com → Applications) of type Traditional Web App, with the Data Management API enabled.", <a href="https://aps.autodesk.com/myapps" target="_blank" rel="noreferrer">aps.autodesk.com/myapps</a>],
    ["Add this callback URL to the app (it must match exactly):", <code className="cx-code">{location.origin}/api/aps/callback</code>],
    ["Set three variables in the platform's .env file (BIM-Management-\\.env):", <pre className="cx-code">{`APS_CLIENT_ID=<your app's Client ID>\nAPS_CLIENT_SECRET=<your app's Client Secret>\nAPS_CALLBACK_URL=${location.origin}/api/aps/callback`}</pre>],
    ["Restart the platform server so it reads the new variables."],
    ["In ACC, an account administrator opens Account Admin → Custom Integrations, adds a custom integration and enters the app's Client ID (BIM 360: Account Admin → Settings → Custom Integrations).", <span className="row"><a href="https://acc.autodesk.com/" target="_blank" rel="noreferrer">acc.autodesk.com</a><a href="https://aps.autodesk.com/en/docs/bim360/v1/tutorials/getting-started/manage-access-to-docs" target="_blank" rel="noreferrer">{t("APS guide: manage access to Docs")}</a></span>],
    ["Come back to this page and choose Connect with Autodesk."],
  ];
  return (
    <div className="card cx-stack">
      <div><b>{t("Set up the ACC connection")}</b><p className="muted small">{t("APS is not configured on this server yet. An administrator needs to do this once.")}</p></div>
      <ol className="cx-steps">{steps.map(([s, extra], i) => <li key={i}><span>{t(s)}</span>{extra && <div className="cx-step-extra">{extra}</div>}</li>)}</ol>
      <p className="small muted">{t("Reference:")} <a href="https://aps.autodesk.com/en/docs/oauth/v2/tutorials/get-3-legged-token" target="_blank" rel="noreferrer">{t("APS: get a 3-legged token")}</a></p>
    </div>
  );
}

type Crumb = { kind: "hubs" } | { kind: "hub"; hub: ApsHub } | { kind: "project"; hub: ApsHub; project: ApsProject } | { kind: "folder"; hub: ApsHub; project: ApsProject; folder: ApsFolder };

function ApsBrowser({ onExpired }: { onExpired: () => void }) {
  const [path, setPath] = useState<Crumb[]>([{ kind: "hubs" }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [hubs, setHubs] = useState<ApsHub[]>([]);
  const [projects, setProjects] = useState<ApsProject[]>([]);
  const [folders, setFolders] = useState<ApsFolder[]>([]);
  const [files, setFiles] = useState<ApsFile[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [filter, setFilter] = useState("");
  const [checks, setChecks] = useState<Map<string, NameCheck> | null>(null);
  const here = path[path.length - 1];

  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true); setErr(""); setChecks(null);
    try { await fn(); } catch (e) { const status = (e as { status?: number }).status; setErr(errText(e)); if (status === 401) onExpired(); } finally { setBusy(false); }
  }, [onExpired]);

  useEffect(() => {
    setFolders([]); setFiles([]); setTruncated(false); setFilter("");
    if (here.kind === "hubs") run(async () => setHubs((await api<{ hubs: ApsHub[] }>("/aps/hubs")).hubs));
    else if (here.kind === "hub") run(async () => setProjects((await api<{ projects: ApsProject[] }>(`/aps/hubs/${encodeURIComponent(here.hub.id)}/projects`)).projects));
    else if (here.kind === "project") run(async () => setFolders((await api<{ folders: ApsFolder[] }>(`/aps/projects/${encodeURIComponent(here.project.id)}/topFolders?hubId=${encodeURIComponent(here.hub.id)}`)).folders));
    else run(async () => {
      const r = await api<{ folders: ApsFolder[]; files: ApsFile[]; truncated: boolean }>(`/aps/projects/${encodeURIComponent(here.project.id)}/folders/${encodeURIComponent(here.folder.id)}/contents`);
      setFolders(r.folders); setFiles(r.files); setTruncated(r.truncated);
    });
  }, [here, run]);

  const go = (c: Crumb) => setPath((p) => [...p, c]);
  const crumbLabel = (c: Crumb) => (c.kind === "hubs" ? t("Hubs") : c.kind === "hub" ? c.hub.name : c.kind === "project" ? c.project.name : c.folder.name);
  const shown = files.filter((f) => !filter.trim() || f.name.toLowerCase().includes(filter.trim().toLowerCase()));
  const where = path.slice(1).map(crumbLabel).join(" / ");

  const checkVisible = () => {
    const p = getProjectData();
    const rep = checkNames(shown.map((f) => f.name), { separator: p.separator || "-", projectCode: p.code.trim() || undefined });
    setChecks(new Map(rep.results.map((r) => [shown[r.line - 1]?.id ?? "", r])));
  };
  const exportList = () => exportCsv(`acc-files-${new Date().toISOString().slice(0, 10)}`, ["Location", "Name", "Version", "Last modified", "Modified by", "Size (bytes)", "Naming check", "Problems", "Suggested name"],
    shown.map((f) => { const c = checks?.get(f.id); return [where, f.name, f.version == null ? "" : String(f.version), f.modified, f.modifiedBy, f.size == null ? "" : String(f.size),
      c ? (c.errors.length ? "Error" : c.warnings.length ? "Warning" : "OK") : "", c ? [...c.errors, ...c.warnings].map((m) => formatMsg(m)).join(" | ") : "", c?.suggestion ?? ""]; }));
  const transmittal = () => { ssSet("bim:transmittal:names", JSON.stringify(shown.map((f) => f.name))); window.location.hash = "#/bim-tools/comms"; };
  const counts = checks ? [...checks.values()].reduce((a, r) => (r.errors.length ? { ...a, e: a.e + 1 } : r.warnings.length ? { ...a, w: a.w + 1 } : { ...a, ok: a.ok + 1 }), { ok: 0, w: 0, e: 0 }) : null;

  return (
    <div className="card cx-stack">
      <nav className="cx-crumbs" aria-label={t("Location")}>
        {path.map((c, i) => <span key={i}>{i > 0 && <span className="cx-sep" aria-hidden>›</span>}
          {i < path.length - 1 ? <button className="linklike cx-crumb" onClick={() => setPath(path.slice(0, i + 1))}>{crumbLabel(c)}</button> : <b>{crumbLabel(c)}</b>}</span>)}
        {busy && <span className="muted small">{t("Loading…")}</span>}
      </nav>
      {err && <div className="cx-error">{err}</div>}

      {here.kind === "hubs" && !busy && (hubs.length ? (
        <ul className="cx-list">{hubs.map((h) => <li key={h.id}><button className="cx-item" onClick={() => go({ kind: "hub", hub: h })}><b>{h.name}</b><span className="badge">{t(h.kind)}</span>{h.region && <span className="muted small">{h.region}</span>}</button></li>)}</ul>
      ) : !err && <p className="muted small">{t("No hubs found. Check that the APS app has been added as a custom integration in your ACC or BIM 360 account.")}</p>)}

      {here.kind === "hub" && !busy && (projects.length ? (
        <ul className="cx-list">{projects.map((p) => <li key={p.id}><button className="cx-item" onClick={() => go({ kind: "project", hub: here.hub, project: p })}><b>{p.name}</b>{p.kind && <span className="badge">{p.kind}</span>}</button></li>)}</ul>
      ) : !err && <p className="muted small">{t("No projects in this hub that you can access.")}</p>)}

      {(here.kind === "project" || here.kind === "folder") && !busy && <>
        {folders.length > 0 && <ul className="cx-list">{folders.map((f) => <li key={f.id}><button className="cx-item" onClick={() => go({ kind: "folder", hub: here.hub, project: here.project, folder: f })}>
          <span className="cx-folder" aria-hidden>▸</span><b>{f.name}</b>{f.objectCount != null && <span className="muted small">{tf("{n} items", { n: f.objectCount })}</span>}{f.modified && <span className="muted small">{fmtWhen(f.modified)}</span>}</button></li>)}</ul>}
        {here.kind === "folder" && (files.length ? <>
          <div className="row spread">
            <input className="cx-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("Filter files by name")} aria-label={t("Filter files by name")} />
            <span className="row">
              <button onClick={checkVisible}>{t("Check names")}</button>
              <button onClick={exportList}>{t("Export list")}</button>
              <button onClick={transmittal}>{t("Create transmittal")}</button>
            </span>
          </div>
          {counts && <div className="row small"><span className="cx-pill ok">{tf("{n} OK", { n: counts.ok })}</span><span className="cx-pill warn">{tf("{n} with warnings", { n: counts.w })}</span><span className="cx-pill err">{tf("{n} with errors", { n: counts.e })}</span>
            <span className="muted">{tf("Checked against project code “{code}” and separator “{sep}” from Project data.", { code: getProjectData().code || t("(not set)"), sep: getProjectData().separator || "-" })}</span></div>}
          {truncated && <p className="small muted">{t("This folder is very large; only the first 5,000 entries are shown.")}</p>}
          <div className="cx-table-wrap">
            <table className="data">
              <thead><tr><th>{t("Name")}</th><th>{t("Version")}</th><th>{t("Last modified")}</th><th>{t("Size")}</th>{checks && <th>{t("Naming check")}</th>}</tr></thead>
              <tbody>{shown.map((f) => { const c = checks?.get(f.id); return (
                <tr key={f.id}>
                  <td className="cx-name">{f.name}</td><td>{f.version == null ? "" : `V${f.version}`}</td>
                  <td>{fmtWhen(f.modified)}{f.modifiedBy && <div className="muted small">{f.modifiedBy}</div>}</td><td>{fmtBytes(f.size)}</td>
                  {checks && <td>{c && <NameResult c={c} />}</td>}
                </tr>); })}</tbody>
            </table>
          </div>
          <p className="small muted">{tf("{n} of {total} files shown.", { n: shown.length, total: files.length })}</p>
        </> : !folders.length && !err && <p className="muted small">{t("This folder is empty.")}</p>)}
        {here.kind === "project" && !folders.length && !err && <p className="muted small">{t("No folders you can access in this project.")}</p>}
      </>}
    </div>
  );
}

function NameResult({ c }: { c: NameCheck }) {
  if (!c.errors.length && !c.warnings.length) return <span className="cx-ok">{t("OK")}</span>;
  return (
    <div>
      <ul className="cx-issues">{c.errors.map((m, i) => <li key={"e" + i} className="err">{formatMsg(m, t)}</li>)}{c.warnings.map((m, i) => <li key={"w" + i} className="warn">{formatMsg(m, t)}</li>)}</ul>
      {c.suggestion && <div className="small">{t("Suggested:")} <code className="cx-name">{c.suggestion}</code></div>}
    </div>
  );
}

// ======================================================================= Speckle

const SS_SERVER = "bim:speckle:server", SS_TOKEN = "bim:speckle:token";

class SpeckleError extends Error {}

function SpeckleTab() {
  const [server, setServer] = useState(() => ssGet(SS_SERVER) || SPECKLE_DEFAULT_SERVER);
  const [token, setToken] = useState(() => ssGet(SS_TOKEN));
  const [user, setUser] = useState<SpeckleUser | null>(null);
  const [relayed, setRelayed] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const origin = normalizeSpeckleServer(server);

  const [projects, setProjects] = useState<SpeckleProject[]>([]);
  const [projCursor, setProjCursor] = useState<string | null>(null);
  const [projTotal, setProjTotal] = useState(0);
  const [project, setProject] = useState<SpeckleProject | null>(null);
  const [models, setModels] = useState<SpeckleModel[]>([]);
  const [model, setModel] = useState<SpeckleModel | null>(null);
  const [versions, setVersions] = useState<SpeckleVersion[]>([]);
  const [version, setVersion] = useState<SpeckleVersion | null>(null);
  const [objects, setObjects] = useState<SpeckleObject[] | null>(null);
  const [objTruncated, setObjTruncated] = useState(false);
  const [limit, setLimit] = useState(SPECKLE_MAX_OBJECTS);

  /** GraphQL straight from the browser; relayed through this platform's server only if the browser call is blocked (CORS). */
  const gql = useCallback(async (query: string, variables: Record<string, unknown> = {}) => {
    const body = JSON.stringify({ query, variables });
    let json: unknown;
    try {
      const res = await fetch(`${origin}/graphql`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.trim()}` }, body });
      json = await res.json().catch(() => ({}));
      if (!res.ok && !graphqlError(json)) throw new SpeckleError(tf("Speckle returned {n}.", { n: res.status }));
    } catch (e) {
      if (!(e instanceof TypeError)) throw e;
      setRelayed(true);
      json = await api("/speckle/query", { body: { server: origin, token: token.trim(), query, variables } });
    }
    const ge = graphqlError(json);
    if (ge) throw new SpeckleError(ge);
    return json;
  }, [origin, token]);

  const run = async (label: string, fn: () => Promise<void>) => { setBusy(label); setErr(""); try { await fn(); } catch (e) { setErr(errText(e)); } finally { setBusy(""); } };

  const connect = () => run(t("Connecting…"), async () => {
    if (!origin) throw new SpeckleError(t("Enter a valid https server address."));
    if (!token.trim()) throw new SpeckleError(t("Enter a personal access token."));
    const u = normalizeSpeckleUser(await gql(SPECKLE_USER_QUERY));
    if (!u) throw new SpeckleError(t("The token was not accepted by this server."));
    ssSet(SS_SERVER, origin); ssSet(SS_TOKEN, token.trim());
    setUser(u); setProject(null); setModel(null); setVersion(null); setObjects(null);
    const p = normalizeSpeckleProjects(await gql(SPECKLE_PROJECTS_QUERY, { limit: 50 }));
    setProjects(p.items); setProjCursor(p.cursor); setProjTotal(p.totalCount);
  });
  const moreProjects = () => run(t("Loading…"), async () => {
    const p = normalizeSpeckleProjects(await gql(SPECKLE_PROJECTS_QUERY, { limit: 50, cursor: projCursor }));
    setProjects((x) => [...x, ...p.items]); setProjCursor(p.items.length ? p.cursor : null);
  });
  const forget = () => { ssSet(SS_TOKEN, ""); setToken(""); setUser(null); setProjects([]); setProject(null); setModel(null); setVersion(null); setObjects(null); setRelayed(false); };

  const openProject = (p: SpeckleProject) => run(t("Loading…"), async () => {
    setProject(p); setModel(null); setVersion(null); setObjects(null); setVersions([]);
    setModels(normalizeSpeckleModels(await gql(SPECKLE_MODELS_QUERY, { projectId: p.id, limit: 100 })).items);
  });
  const openModel = (m: SpeckleModel) => run(t("Loading…"), async () => {
    setModel(m); setVersion(null); setObjects(null);
    setVersions(normalizeSpeckleVersions(await gql(SPECKLE_VERSIONS_QUERY, { projectId: project!.id, modelId: m.id, limit: 25 })).items);
  });

  const loadObjects = (v: SpeckleVersion) => run(t("Loading objects…"), async () => {
    setVersion(v); setObjects(null); setObjTruncated(false);
    if (v.bundle || !v.referencedObject) return;
    let parsed: { objects: SpeckleObject[]; truncated: boolean };
    try {
      const res = await fetch(speckleObjectsUrl(origin, project!.id, v.referencedObject), { headers: { Accept: "text/plain", Authorization: `Bearer ${token.trim()}` } });
      if (!res.ok || !res.body) {
        const b = await res.json().catch(() => ({})) as { error?: { message?: string; code?: string } };
        if (b.error?.code === "BUNDLE_REFERENCE_NOT_FOUND") { setVersion({ ...v, bundle: true }); return; }
        throw new SpeckleError(b.error?.message || tf("Speckle returned {n}.", { n: res.status }));
      }
      const reader = res.body.getReader(), dec = new TextDecoder();
      let text = "", lines = 0;
      while (lines <= limit) { const { done, value } = await reader.read(); if (done) break; const s = dec.decode(value, { stream: true }); text += s; lines += s.split("\n").length - 1; }
      reader.cancel().catch(() => undefined);
      parsed = parseObjectLines(text, limit);
    } catch (e) {
      if (!(e instanceof TypeError)) throw e;
      setRelayed(true);
      parsed = await api<{ objects: SpeckleObject[]; truncated: boolean }>("/speckle/objects", { body: { server: origin, token: token.trim(), projectId: project!.id, objectId: v.referencedObject, limit } });
    }
    setObjects(parsed.objects); setObjTruncated(parsed.truncated);
  });

  return (
    <div className="cx-stack">
      <div className="card cx-stack">
        <div className="grid g3">
          <label className="cx-field"><span>{t("Speckle server")}</span><input value={server} onChange={(e) => setServer(e.target.value)} placeholder={SPECKLE_DEFAULT_SERVER} dir="ltr" /></label>
          <label className="cx-field"><span>{t("Personal access token")}</span><input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder={t("Paste a read-only personal access token")} dir="ltr" /></label>
          <div className="cx-field"><span>&nbsp;</span><span className="row">
            <button onClick={connect} disabled={!!busy}>{user ? t("Reconnect") : t("Connect")}</button>
            {(user || token) && <button className="ghost" onClick={forget}>{t("Forget token")}</button>}
          </span></div>
        </div>
        <p className="small muted">{t("Create a token in Speckle under Settings → Developer → Access tokens with read scopes only: user.profile.read, project.core.read and project.version.read (older servers: profile:read and streams:read).")} {origin && <a href={speckleTokenSettingsUrl(origin)} target="_blank" rel="noreferrer">{t("Open token settings")}</a>}</p>
        {user && <div className="small">{t("Connected as")} <b>{user.name || user.email}</b> <span className="muted">· {origin}</span></div>}
        {busy && <div className="muted small">{busy}</div>}
        {err && <div className="cx-error">{err}</div>}
      </div>

      {user && (
        <div className="cx-cols">
          <div className="card cx-stack">
            <b>{tf("Projects ({n})", { n: projTotal || projects.length })}</b>
            <ul className="cx-list compact">{projects.map((p) => <li key={p.id}><button className={"cx-item" + (project?.id === p.id ? " on" : "")} onClick={() => openProject(p)}><b>{p.name}</b><span className="muted small">{fmtWhen(p.updatedAt)}</span></button></li>)}</ul>
            {projCursor && projects.length < projTotal && <button className="ghost small" onClick={moreProjects}>{t("Load more")}</button>}
            {!projects.length && <p className="muted small">{t("No projects found for this account.")}</p>}
          </div>
          <div className="card cx-stack">
            <b>{t("Models")}</b>
            {!project ? <p className="muted small">{t("Choose a project.")}</p> : models.length ? (
              <ul className="cx-list compact">{models.map((m) => <li key={m.id}><button className={"cx-item" + (model?.id === m.id ? " on" : "")} onClick={() => openModel(m)}><b>{m.name}</b><span className="muted small">{fmtWhen(m.updatedAt)}</span></button></li>)}</ul>
            ) : <p className="muted small">{t("This project has no models.")}</p>}
          </div>
          <div className="card cx-stack">
            <b>{t("Versions")}</b>
            {!model ? <p className="muted small">{t("Choose a model.")}</p> : versions.length ? (
              <ul className="cx-list compact">{versions.map((v) => <li key={v.id}><button className={"cx-item" + (version?.id === v.id ? " on" : "")} onClick={() => loadObjects(v)}>
                <b>{v.message || t("(no message)")}</b><span className="muted small">{[fmtWhen(v.createdAt), v.sourceApplication, v.author].filter(Boolean).join(" · ")}</span></button></li>)}</ul>
            ) : <p className="muted small">{t("This model has no versions.")}</p>}
            <label className="cx-field small"><span>{t("Maximum objects to load")}</span>
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>{[500, 1000, 2000, 5000].map((n) => <option key={n} value={n}>{n.toLocaleString()}</option>)}</select></label>
          </div>
        </div>
      )}

      {version && project && model && (version.bundle ? (
        <div className="card cx-stack">
          <b>{t("This version uses Speckle's newer bundle storage")}</b>
          <p className="small muted">{t("Versions published with recent Speckle connectors are stored as bundles, which the object download used here cannot read. Open the version in Speckle to review it, or publish in compatibility mode to analyse it here.")}</p>
          <div><a href={speckleVersionUrl(origin, project.id, model.id, version.id)} target="_blank" rel="noreferrer">{t("Open in Speckle")}</a></div>
        </div>
      ) : objects && <SpeckleStats objects={objects} truncated={objTruncated} limit={limit} name={`${project.name}-${model.name}`} />)}

      <PrivacyNote items={[
        relayed ? t("Your Speckle server blocked direct browser requests, so requests were relayed through this platform's server. The token is passed through for each request only; it is never stored or logged on the server.")
          : t("Requests go directly from your browser to the Speckle server you entered. The token does not pass through this platform's server unless that server blocks browser requests, in which case it is relayed without being stored or logged."),
        t("The token is kept only in this browser tab's session storage and is removed when you close the tab or choose Forget token."),
        t("Object counts, completeness and CSV export are calculated in your browser. AI is not used here."),
      ]} />
    </div>
  );
}

function SpeckleStats({ objects, truncated, limit, name }: { objects: SpeckleObject[]; truncated: boolean; limit: number; name: string }) {
  const els = useMemo(() => objects.filter(isElement), [objects]);
  const byType = useMemo(() => countBy(els, (o) => shortType(String(o.speckle_type ?? ""))), [els]);
  const byCat = useMemo(() => countBy(els, categoryOf), [els]);
  const keys = useMemo(() => propertyKeys(els), [els]);
  const [prop, setProp] = useState("");
  const comp = useMemo(() => (prop.trim() ? completeness(els, prop.trim()) : null), [els, prop]);
  const slug = name.replace(/[^\w.-]+/g, "_").slice(0, 60);

  const csv = () => {
    const rows: string[][] = [
      ...byType.map((r) => ["speckle_type", r.key, String(r.count), "", ""]),
      ...byCat.map((r) => ["category", r.key, String(r.count), "", ""]),
      ...(comp ? comp.byType.map((r) => [`completeness: ${comp.property}`, r.key, String(r.total), String(r.filled), `${r.percent}%`]) : []),
    ];
    exportCsv(`speckle-${slug}`, ["Group", "Key", "Objects", "With value", "Percent"], rows);
  };

  return (
    <div className="card cx-stack">
      <div className="row spread">
        <b>{tf("{n} elements read ({all} objects including geometry chunks and materials)", { n: els.length, all: objects.length })}</b>
        <button onClick={csv}>{t("Export CSV")}</button>
      </div>
      {truncated && <p className="small muted">{tf("Stopped at {n} objects; counts cover only the objects read.", { n: limit.toLocaleString() })}</p>}
      <div className="grid g2">
        <CountTable title={t("By speckle_type")} rows={byType} />
        <CountTable title={t("By category")} rows={byCat} />
      </div>
      <div className="cx-stack">
        <b>{t("Parameter completeness")}</b>
        <label className="cx-field"><span>{t("Property (dot path, e.g. properties.Parameters.Fire Rating)")}</span>
          <input list="cx-props" value={prop} onChange={(e) => setProp(e.target.value)} placeholder={t("Choose or type a property name")} dir="ltr" />
          <datalist id="cx-props">{keys.map((k) => <option key={k} value={k} />)}</datalist></label>
        {comp && <>
          <div className="cx-meter" role="img" aria-label={tf("{p}% of elements have a value", { p: comp.percent })}><span style={{ inlineSize: `${comp.percent}%` }} /></div>
          <div className="small">{tf("{filled} of {total} elements ({p}%) have a value for “{prop}”.", { filled: comp.filled, total: comp.total, p: comp.percent, prop: comp.property })}</div>
          <div className="cx-table-wrap"><table className="data">
            <thead><tr><th>{t("Type")}</th><th>{t("Elements")}</th><th>{t("With value")}</th><th>%</th></tr></thead>
            <tbody>{comp.byType.slice(0, 50).map((r) => <tr key={r.key}><td>{r.key}</td><td>{r.total}</td><td>{r.filled}</td><td>{r.percent}%</td></tr>)}</tbody>
          </table></div>
        </>}
      </div>
    </div>
  );
}

function CountTable({ title, rows }: { title: string; rows: { key: string; count: number }[] }) {
  return (
    <div className="cx-table-wrap">
      <table className="data">
        <thead><tr><th>{title}</th><th>{t("Objects")}</th></tr></thead>
        <tbody>{rows.slice(0, 40).map((r) => <tr key={r.key}><td>{r.key === "(none)" ? t("(none)") : r.key}</td><td>{r.count}</td></tr>)}</tbody>
      </table>
      {rows.length > 40 && <p className="small muted">{tf("Showing 40 of {n}. Export CSV for all.", { n: rows.length })}</p>}
    </div>
  );
}

function PrivacyNote({ items }: { items: string[] }) {
  return (
    <div className="card cx-privacy">
      <b>{t("Privacy: what is sent where")}</b>
      <ul>{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  );
}
