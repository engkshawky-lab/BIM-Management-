import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSession } from "../App";
import { api, fmtDate, fmtSize } from "../lib/api";
import { buildDocx, type ExportDoc } from "../lib/export";
import { templateById } from "../../../shared/data/templates";
import type { DocTemplate } from "../../../shared/data/types";
import type { FieldValue } from "../../../shared/documents";
import { generateHref } from "./AiTools";
import { useDocData } from "../components/DocDataPanel";
import { saveAs } from "file-saver";
import { tr } from "../i18nDom";

// Resources: curated downloads library, AI-compiled BIM news, and sample ISO 19650 documents.

const Head = ({ eyebrow, title, intro, color }: { eyebrow: string; title: string; intro: string; color: string }) => (
  <div className="hub-hero" style={{ "--hub": color, marginBottom: 14 } as CSSProperties}><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{intro}</p></div>
);

// ---------------------------------------------------------------- Downloads library

interface Resource { id: string; title: string; description: string; category: string; part: string; fileName: string; mimeType: string; size: number; downloads: number; createdAt: string; previewable: boolean }
const PARTS = ["", "19650-1", "19650-2", "19650-3", "19650-4", "19650-5", "19650-6"];
const ext = (n: string) => (/\.([a-z0-9]+)$/i.exec(n)?.[1] ?? "file").toUpperCase();
const extColor = (e: string) => (e === "PDF" ? "#dc2626" : /DOCX?/.test(e) ? "#2563eb" : /XLSX?|CSV/.test(e) ? "#16a34a" : /PPTX?/.test(e) ? "#ea580c" : /DWG|IFC|RVT/.test(e) ? "#7c3aed" : "#64748b");

export function DownloadsLibrary() {
  const { user, toast } = useSession();
  const admin = user.role === "admin";
  const [rows, setRows] = useState<Resource[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [sort, setSort] = useState<"new" | "popular" | "name">("new");
  const [form, setForm] = useState({ title: "", description: "", category: "General", part: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Resource | null>(null);
  const load = () => api<{ resources: Resource[]; categories: string[] }>("/library").then((r) => { setRows(r.resources); setCats(r.categories); }).catch((e) => toast(e.message, "error"));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => rows
    .filter((r) => (!cat || r.category === cat) && (!q || `${r.title} ${r.description} ${r.fileName} ${r.category}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => sort === "popular" ? b.downloads - a.downloads : sort === "name" ? a.title.localeCompare(b.title) : b.createdAt.localeCompare(a.createdAt)), [rows, q, cat, sort]);

  const add = async () => {
    if (!file) return toast("Choose a file.", "error");
    setBusy(true);
    try {
      const f = new FormData(); f.set("file", file); Object.entries({ ...form, title: form.title || file.name.replace(/\.[^.]+$/, "") }).forEach(([k, v]) => f.set(k, v));
      await api("/library", { form: f }); setFile(null); setForm({ title: "", description: "", category: form.category, part: "" }); toast("Added to the library."); load();
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const remove = async (r: Resource) => {
    try { await api(`/library/${r.id}`, { method: "DELETE" }); toast("Removed."); load(); } catch (e) { toast((e as Error).message, "error"); }
  };

  return (
    <>
      <Head color="#0d9488" eyebrow="ISO 19650 · RESOURCES" title="Downloads" intro="Curated templates, checklists, guides and worked examples maintained by the platform administrators. Word, Excel, PDF, DWG, IFC and other files are supported." />
      {admin && <div className="card" style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <b>Add a resource</b>
        <div className="grid g4">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (defaults to file name)" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={form.part} onChange={(e) => setForm({ ...form, part: e.target.value })}>{PARTS.map((p) => <option key={p} value={p}>{p ? `ISO ${p}` : tr("Any part")}</option>)}</select>
        </div>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
        <div className="row"><button className="primary" disabled={busy || !file} onClick={add}>{busy ? "Uploading…" : "Add to library"}</button><span className="small muted">Only upload material you have the right to share.</span></div>
      </div>}
      <div className="row" style={{ marginBottom: 12 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources…" style={{ flex: 1, minWidth: 200 }} />
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} style={{ width: "auto" }}><option value="new">{tr("Newest first")}</option><option value="popular">{tr("Most downloaded")}</option><option value="name">A–Z</option></select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: "auto" }}><option value="">{tr("All categories")}</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      {!shown.length ? <div className="card muted">{rows.length ? "No resources match." : admin ? "The library is empty. Add the first resource above." : "The library is empty. Administrators add resources here."}</div>
        : <div className="grid g4">{shown.map((r) => { const e = ext(r.fileName); return (
          <div key={r.id} className="card" style={{ display: "grid", gap: 6, alignContent: "start" }}>
            <div className="row" style={{ flexWrap: "nowrap", alignItems: "start" }}>
              <span style={{ background: extColor(e), color: "#fff", borderRadius: 6, padding: "4px 6px", fontSize: 11, fontWeight: 700, minWidth: 40, textAlign: "center" }}>{e}</span>
              <div><b>{r.title}</b><div className="small muted">{r.category}{r.part && ` · ISO ${r.part}`} · {fmtSize(r.size)}</div></div>
            </div>
            {r.description && <div className="small">{r.description}</div>}
            <div className="row spread" style={{ marginTop: "auto" }}>
              <span className="small muted">{r.downloads} download{r.downloads === 1 ? "" : "s"}</span>
              <div className="row">
                {r.previewable && <button className="small" onClick={() => setPreview(r)}>Preview</button>}
                <a href={`/api/library/${r.id}/file`} onClick={() => setTimeout(load, 1500)}><button className="primary small">Download</button></a>
                {admin && <button className="ghost small danger" onClick={() => remove(r)}>Delete</button>}
              </div>
            </div>
          </div>); })}</div>}
      {preview && <div className="modal-backdrop" onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
        <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: "min(1000px, 100%)", height: "min(85vh, 900px)", display: "grid", gridTemplateRows: "auto 1fr", gap: 8 }}>
          <div className="row spread"><b>{preview.title}</b><button className="ghost" onClick={() => setPreview(null)}>Close</button></div>
          {preview.mimeType.startsWith("image/") ? <img src={`/api/library/${preview.id}/file?inline=1`} alt={preview.title} style={{ maxHeight: "100%", objectFit: "contain", margin: "auto" }} />
            : <iframe title={preview.title} src={`/api/library/${preview.id}/file?inline=1`} style={{ width: "100%", height: "100%", border: 0, borderRadius: 8, background: "#fff" }} />}
        </div>
      </div>}
    </>
  );
}

// ---------------------------------------------------------------- BIM news

interface NewsItem { title: string; summary: string; source: string; url: string; date: string; topic: string; relevance: string; parts: string[] }

export function NewsFeed() {
  const { toast } = useSession();
  const [data, setData] = useState<{ updatedAt: string | null; items: NewsItem[]; topics: string[]; scheduled: boolean } | null>(null);
  const [topic, setTopic] = useState(""); const [rel, setRel] = useState("");
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<boolean | null>(null);
  useEffect(() => {
    api<typeof data>("/news").then(setData).catch((e) => toast(e.message, "error"));
    api<{ enabled: boolean }>("/ai/status").then((r) => setAi(r.enabled)).catch(() => setAi(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const stale = !data?.updatedAt || Date.now() - new Date(data.updatedAt).getTime() > 60 * 60_000;
  const refresh = async () => {
    setBusy(true);
    try { const r = await api<{ updatedAt: string; items: NewsItem[] }>("/news/refresh", { method: "POST" }); setData((d) => ({ ...d!, ...r })); }
    catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const items = (data?.items ?? []).filter((n) => (!topic || n.topic === topic) && (!rel || n.relevance === rel));
  const relColor = (r: string) => (r === "High" ? "var(--ok)" : r === "Medium" ? "var(--warn)" : "var(--muted)");
  return (
    <>
      <Head color="#dc2626" eyebrow="LIVE INTELLIGENCE" title="BIM & ISO 19650 news" intro="Recent developments in BIM, ISO 19650 and information management, found by AI web search across standards bodies, governments, buildingSMART, professional institutions and software vendors. Each story is summarised with a relevance rating and the parts of ISO 19650 it affects. Always read the original source." />
      <div className="row spread" style={{ marginBottom: 12 }}>
        <div className="row">
          <button className={"chip" + (!topic ? " on" : "")} onClick={() => setTopic("")}>All</button>
          {data?.topics.map((t) => <button key={t} className={"chip" + (topic === t ? " on" : "")} onClick={() => setTopic(t)}>{t}</button>)}
          <select value={rel} onChange={(e) => setRel(e.target.value)} style={{ width: "auto" }}><option value="">{tr("Any relevance")}</option><option value="High">{tr("High")}</option><option value="Medium">{tr("Medium")}</option><option value="Low">{tr("Low")}</option></select>
        </div>
        <div className="row small muted">
          {data?.updatedAt && <span>Updated {fmtDate(data.updatedAt)}{data.scheduled ? " · refreshes hourly" : ""}</span>}
          {ai && <button className="primary" disabled={busy || !stale} title={stale ? "" : "The feed refreshes at most once an hour"} onClick={refresh}>{busy ? "Searching the web…" : "Search news now"}</button>}
        </div>
      </div>
      {busy && <div className="card muted" style={{ marginBottom: 12 }}>Searching standards bodies, institutions and vendor sites… this takes a minute or two.</div>}
      {!data ? <div className="muted">Loading…</div>
        : !data.items.length ? <div className="card muted" style={{ textAlign: "center", padding: 32 }}>No news yet. {ai ? "Click “Search news now” to compile the first feed." : "Set CLAUDE_API_KEY on the server to enable the AI news feed."}</div>
          : <div className="grid g2">{items.map((n, i) => (
            <div key={i} className="card" style={{ display: "grid", gap: 6, alignContent: "start" }}>
              <div className="row spread small"><span className="muted">{n.source}{n.date && ` · ${n.date}`}</span><span className="badge" style={{ color: relColor(n.relevance), borderColor: relColor(n.relevance), background: "transparent" }}>{n.relevance} relevance</span></div>
              <b>{n.title}</b>
              <div className="small">{n.summary}</div>
              <div className="row small"><span className="badge">{n.topic}</span>{n.parts.map((p) => <a key={p} className="badge" href={`#/parts/${p}`}>ISO {p}</a>)}
                <a href={n.url} target="_blank" rel="noopener noreferrer nofollow" style={{ marginInlineStart: "auto" }}>Read source ↗</a></div>
            </div>))}</div>}
    </>
  );
}

// ---------------------------------------------------------------- Sample documents

const SAMPLES: { id: string; color: string; scope: string }[] = [
  { id: "eir", color: "#3b82f6", scope: "ISO 19650-2 · issued with the invitation to tender" },
  { id: "air", color: "#22c55e", scope: "ISO 19650-3 · asset information for operations" },
  { id: "oir", color: "#a855f7", scope: "ISO 19650-1 · organisational strategy" },
  { id: "bep-pre", color: "#ef4444", scope: "ISO 19650-2 · tender response to the EIR" },
  { id: "bep-post", color: "#38bdf8", scope: "ISO 19650-2 · confirmed after appointment" },
  { id: "info-standard", color: "#14b8a6", scope: "ISO 19650-2 5.1.4 · naming, formats, classification, LOIN" },
  { id: "info-protocol", color: "#eab308", scope: "ISO 19650-2 5.1.8 · contractual obligations and licences" },
  { id: "security-triage", color: "#64748b", scope: "ISO 19650-5 · sensitivity assessment and security plan" },
];

/** A structured sample: every field shows its guidance as a placeholder; tables keep their starter rows. */
function sampleDoc(t: DocTemplate): ExportDoc {
  const values: Record<string, FieldValue> = {};
  for (const s of t.sections) for (const f of s.fields) {
    values[f.id] = f.type === "table" ? (f.defaultRows?.length ? f.defaultRows : [f.columns!.map((c) => `[${c}]`)])
      : f.defaultValue ?? (f.type === "select" ? `[${f.options?.join(" / ")}]` : `[${f.hint ?? f.label}]`);
  }
  return { title: t.title, containerName: `PRJ-XXX-XX-XX-${t.code}-0001`, revision: "P01", state: "WIP", suitability: "S0", authorName: "[Author]", values, history: [] };
}

export function SampleDocuments() {
  const { toast } = useSession();
  const [open, setOpen] = useState<string | null>(null);
  const doc = useDocData();
  // samples are blank structures; when the document data is complete it fills their cover and document control
  const download = async (t: DocTemplate) => {
    const d = doc.d, filled = doc.ready;
    const sample = filled ? { ...sampleDoc(t), containerName: d.reference, revision: d.version, authorName: d.preparedBy } : sampleDoc(t);
    try { saveAs(await buildDocx(sample, t, { name: filled ? d.projectName : "[Project name]", code: d.projectCode || "PRJ", appointingParty: d.appointingParty || "[Appointing party]", location: "[Location]" }), `${filled ? (d.projectCode || "PRJ") + "_" : "Sample_"}${t.code}.docx`); }
    catch (e) { toast((e as Error).message, "error"); }
  };
  return (
    <>
      <Head color="#3b82f6" eyebrow="ISO 19650 · TEMPLATES" title="Sample documents" intro="Ready-to-use ISO 19650 document structures with the correct sections, clause references and guidance notes. Download a structured Word sample, preview the sections, start a controlled project document from the template, or let AI draft a filled sample for a project you describe." />
      <div className="grid g2">
        {SAMPLES.map(({ id, color, scope }) => { const t = templateById(id); if (!t) return null; const fields = t.sections.reduce((a, s) => a + s.fields.length, 0); return (
          <div key={id} className="card" style={{ borderTop: `3px solid ${color}`, display: "grid", gap: 8, alignContent: "start" }}>
            <div><b>{t.title} ({t.code})</b><div className="small muted">{scope}</div></div>
            <div className="small">{t.purpose}</div>
            <div className="row small muted"><span>{t.sections.length} sections · {fields} fields</span>{t.clauseRefs.slice(0, 4).map((c) => <span key={c} className="badge">{c}</span>)}</div>
            <div className="row">
              <button className="primary" onClick={() => download(t)}>Download Word</button>
              <button onClick={() => setOpen(open === id ? null : id)}>{open === id ? "Hide preview" : "Preview"}</button>
              <a href={`#/knowledge/${t.standard}/templates/${t.id}`}><button>Use in a project</button></a>
              <a href={generateHref(`${t.title} — filled sample for a fictional project`)}><button className="ghost">AI-filled sample</button></a>
            </div>
            {open === id && <ol className="small" style={{ margin: 0 }}>{t.sections.map((s) => <li key={s.id} style={{ marginBottom: 4 }}><b>{s.title}</b><div className="muted">{s.guidance}</div></li>)}</ol>}
          </div>); })}
        <div className="card" style={{ borderTop: "3px solid #eab308", display: "grid", gap: 8, alignContent: "start" }}>
          <div><b>Project Information Requirements (PIR)</b><div className="small muted">ISO 19650-2 5.1.2 · information needed for the project's key decisions</div></div>
          <div className="small">There is no fixed PIR template in the portal yet. Use the AI generator to draft one from your project's purpose, key decision points and stakeholders.</div>
          <div className="row"><a href={generateHref("Project Information Requirements (PIR)")}><button className="primary">Draft PIR with AI</button></a></div>
        </div>
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>Samples are structures with guidance, not approved documents. Edit the highlighted placeholders with project-specific information and take them through your review and approval process.</p>
    </>
  );
}
