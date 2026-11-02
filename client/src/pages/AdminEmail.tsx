import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "../App";
import { api, fmtDate } from "../lib/api";
import { DEFAULT_FILTER, describeFilter, PLAN_NAMES, type AudienceFilter, type Person } from "../../../shared/emailAudience";
import { t } from "../i18n";
import "./adminEmail.css";

// Admin › Email users: 1 pick people (filters), 2 pick a mockup and edit it with a live preview, 3 test and send.
// An assistant (Claude) on the side can set the filter, write the email and adjust the mockup; for pictures it
// gives a prompt to paste into ChatGPT, and the picture comes back through "Banner image".

type Tone = "gold" | "info" | "danger" | "success";
interface Blocks {
  lang?: "en" | "ar"; subject: string; preheader?: string; badge?: { text: string; tone: Tone }; heading: string; intro: string;
  paragraphs?: string[]; steps?: string[]; rows?: [string, string][]; notice?: { text: string; tone: Tone; dir?: "rtl" | "ltr" };
  button?: { label: string; url: string }; secondary?: { label: string; url: string }; image?: { src: string; alt?: string; url?: string }; reason?: string;
}
interface Template { id: string; name: string; description: string; blocks: Blocks; html: string }
interface Facet { value: string; n: number }
interface Facets { total: number; roles: Facet[]; sources: Facet[]; locales: Facet[]; organizations: Facet[]; bimRoles: Facet[] }
interface Campaign { id: string; subject: string; state: string; total: number; sent: number; failed: number; skipped: number; pending: number; delayMs: number; filter: string[]; createdAt: string; finishedAt: string | null; by: string | null }
interface Msg { role: "user" | "assistant"; content: string; notes?: string[]; imagePrompt?: string }

// ---------- the editor works on plain text fields; blocks are built from them ----------
interface Form {
  lang: "en" | "ar"; subject: string; preheader: string; badgeText: string; badgeTone: Tone; heading: string; intro: string;
  paragraphs: string; steps: string; rows: string; noticeText: string; noticeTone: Tone; noticeDir: "" | "rtl" | "ltr";
  buttonLabel: string; buttonUrl: string; secondaryLabel: string; secondaryUrl: string; imageSrc: string; imageAlt: string; imageUrl: string; reason: string;
}
const fromBlocks = (b: Blocks): Form => ({
  lang: b.lang ?? "en", subject: b.subject ?? "", preheader: b.preheader ?? "", badgeText: b.badge?.text ?? "", badgeTone: b.badge?.tone ?? "gold",
  heading: b.heading ?? "", intro: b.intro ?? "", paragraphs: (b.paragraphs ?? []).join("\n\n"), steps: (b.steps ?? []).join("\n"),
  rows: (b.rows ?? []).map(([l, v]) => `${l} | ${v}`).join("\n"), noticeText: b.notice?.text ?? "", noticeTone: b.notice?.tone ?? "info", noticeDir: b.notice?.dir ?? "",
  buttonLabel: b.button?.label ?? "", buttonUrl: b.button?.url ?? "", secondaryLabel: b.secondary?.label ?? "", secondaryUrl: b.secondary?.url ?? "",
  imageSrc: b.image?.src ?? "", imageAlt: b.image?.alt ?? "", imageUrl: b.image?.url ?? "", reason: b.reason ?? "",
});
const toBlocks = (f: Form): Blocks => {
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  return {
    lang: f.lang, subject: f.subject, heading: f.heading, intro: f.intro,
    ...(f.preheader.trim() ? { preheader: f.preheader } : {}),
    ...(f.badgeText.trim() ? { badge: { text: f.badgeText, tone: f.badgeTone } } : {}),
    paragraphs: f.paragraphs.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    steps: lines(f.steps),
    rows: lines(f.rows).map((l) => { const i = l.indexOf("|"); return (i < 0 ? [l, ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]) as [string, string]; }),
    ...(f.noticeText.trim() ? { notice: { text: f.noticeText, tone: f.noticeTone, ...(f.noticeDir ? { dir: f.noticeDir } : {}) } } : {}),
    ...(f.buttonLabel.trim() || f.buttonUrl.trim() ? { button: { label: f.buttonLabel, url: f.buttonUrl } } : {}),
    ...(f.secondaryLabel.trim() || f.secondaryUrl.trim() ? { secondary: { label: f.secondaryLabel, url: f.secondaryUrl } } : {}),
    ...(f.imageSrc ? { image: { src: f.imageSrc, alt: f.imageAlt, ...(f.imageUrl.trim() ? { url: f.imageUrl } : {}) } } : {}),
    ...(f.reason.trim() ? { reason: f.reason } : {}),
  };
};

/** Shrink a picture to an email-friendly banner: at most 1200 px wide, JPEG (GIFs are kept so they still move). */
async function bannerFromFile(file: File): Promise<string> {
  const read = () => new Promise<string>((ok, fail) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = fail; r.readAsDataURL(file); });
  if (file.type === "image/gif") { if (file.size > 1_500_000) throw new Error("GIF banners must be under 1.5 MB."); return read(); }
  const bmp = await createImageBitmap(file);
  const w = Math.min(1200, bmp.width), hgt = Math.round(bmp.height * (w / bmp.width));
  const c = document.createElement("canvas"); c.width = w; c.height = hgt;
  const g = c.getContext("2d")!; g.fillStyle = "#0a0e16"; g.fillRect(0, 0, w, hgt); g.drawImage(bmp, 0, 0, w, hgt);
  return c.toDataURL("image/jpeg", 0.85);
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return v;
}

// ---------- filters ----------
function Chips({ label, options, value, onChange }: { label: string; options: [string, string][]; value?: string[]; onChange: (v: string[]) => void }) {
  const on = new Set(value ?? []);
  if (!options.length) return null;
  return <div className="ae-field"><span className="ae-label">{t(label)}</span><div className="ae-chips">
    {options.map(([v, l]) => <button key={v} type="button" aria-pressed={on.has(v)} className={"ae-chip" + (on.has(v) ? " on" : "")}
      onClick={() => { const n = new Set(on); if (n.has(v)) n.delete(v); else n.add(v); onChange([...n]); }}>{l}</button>)}
  </div></div>;
}
function Pick<T extends string>({ label, value, options, onChange }: { label: string; value: T | undefined; options: [T, string][]; onChange: (v: T) => void }) {
  return <label className="ae-field"><span className="ae-label">{t(label)}</span><select value={value ?? options[0][0]} onChange={(e) => onChange(e.target.value as T)}>{options.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select></label>;
}

function Filters({ filter, set, facets }: { filter: AudienceFilter; set: (f: AudienceFilter) => void; facets: Facets | null }) {
  const [more, setMore] = useState(false);
  const [org, setOrg] = useState("");
  const up = (p: Partial<AudienceFilter>) => set({ ...filter, ...p });
  const fac = (f?: Facet[], names: Record<string, string> = {}) => (f ?? []).map((x) => [x.value, `${names[x.value] ?? (x.value || "—")} (${x.n})`] as [string, string]);
  const num = (s: string) => (s.trim() === "" ? null : Math.max(0, Math.round(Number(s)) || 0));
  return (
    <div className="ae-filters">
      <div className="ae-row">
        <label className="ae-field ae-grow"><span className="ae-label">{t("Search")}</span><input value={filter.q ?? ""} onChange={(e) => up({ q: e.target.value })} placeholder={t("Name, email, organisation or job title")} /></label>
        <Chips label="Account" options={[["active", "Active"], ["pending", "Waiting for approval"], ["disabled", "Disabled"]]} value={filter.statuses} onChange={(v) => up({ statuses: v as AudienceFilter["statuses"] })} />
      </div>
      <div className="ae-row">
        <Chips label="Plan" options={Object.entries(PLAN_NAMES)} value={filter.plans} onChange={(v) => up({ plans: v as AudienceFilter["plans"] })} />
        <Pick label="Plan state" value={filter.planState} onChange={(v) => up({ planState: v })} options={[["any", "Any"], ["current", "Current"], ["expired", "Ended"], ["no-end", "Paid, no end date"]]} />
        <label className="ae-field"><span className="ae-label">{t("Plan ends within (days)")}</span><input type="number" min={0} className="ae-num" value={filter.planEndsWithinDays ?? ""} onChange={(e) => up({ planEndsWithinDays: num(e.target.value) })} placeholder="—" /></label>
      </div>
      <div className="ae-row">
        <Pick label="Last sign-in" value={filter.lastLogin} onChange={(v) => up({ lastLogin: v })} options={[["any", "Any time"], ["within", "Within the last…"], ["not-within", "Not in the last…"], ["never", "Never signed in"]]} />
        {(filter.lastLogin === "within" || filter.lastLogin === "not-within") && <label className="ae-field"><span className="ae-label">{t("Days")}</span><input type="number" min={1} className="ae-num" value={filter.lastLoginDays ?? 30} onChange={(e) => up({ lastLoginDays: num(e.target.value) || 1 })} /></label>}
        <Chips label="Email setting" options={[["instant", "Instant"], ["digest", "Daily digest"], ["off", "Off"]]} value={filter.emailPrefs} onChange={(v) => up({ emailPrefs: v })} />
        <Chips label="Language" options={fac(facets?.locales, { en: "English", ar: "العربية" })} value={filter.locales} onChange={(v) => up({ locales: v })} />
      </div>
      <button type="button" className="linklike small" onClick={() => setMore(!more)} aria-expanded={more}>{more ? "▾" : "▸"} {t("More filters")}</button>
      {more && <>
        <div className="ae-row">
          <Chips label="Role" options={[["user", "User"], ["recruiter", "Recruiter"], ["admin", "Admin"]]} value={filter.roles} onChange={(v) => up({ roles: v })} />
          <Chips label="Plan came from" options={fac(facets?.sources, { "": "Portal (default)", stripe: "Online payment", "old-platform": "Old platform", "manus-import": "Manus import" })} value={filter.sources} onChange={(v) => up({ sources: v })} />
          <Pick label="Email confirmed" value={filter.verified} onChange={(v) => up({ verified: v })} options={[["any", "Any"], ["yes", "Confirmed"], ["no", "Not confirmed"]]} />
        </div>
        <div className="ae-row">
          <label className="ae-field"><span className="ae-label">{t("Joined from")}</span><input type="date" value={filter.joinedFrom ?? ""} onChange={(e) => up({ joinedFrom: e.target.value || undefined })} /></label>
          <label className="ae-field"><span className="ae-label">{t("Joined to")}</span><input type="date" value={filter.joinedTo ?? ""} onChange={(e) => up({ joinedTo: e.target.value || undefined })} /></label>
          <Pick label="Projects" value={filter.projects} onChange={(v) => up({ projects: v })} options={[["any", "Any"], ["some", "In at least one project"], ["none", "No projects"]]} />
          <Pick label="AI tools" value={filter.ai} onChange={(v) => up({ ai: v })} options={[["any", "Any"], ["used", "Has used AI"], ["never", "Never used AI"]]} />
          <Pick label="Learning" value={filter.learning} onChange={(v) => up({ learning: v })} options={[["any", "Any"], ["started", "Completed lessons"], ["none", "No lessons yet"]]} />
        </div>
        <div className="ae-row">
          <div className="ae-field ae-grow"><span className="ae-label">{t("Organisation")}</span>
            <div className="ae-chips">{(filter.organizations ?? []).map((o) => <button key={o} type="button" className="ae-chip on" onClick={() => up({ organizations: filter.organizations!.filter((x) => x !== o) })}>{o} ✕</button>)}
              <input list="ae-orgs" value={org} placeholder={t("Add an organisation…")} onChange={(e) => setOrg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && org.trim()) { e.preventDefault(); up({ organizations: [...new Set([...(filter.organizations ?? []), org.trim()])] }); setOrg(""); } }}
                onBlur={() => { if (org.trim()) { up({ organizations: [...new Set([...(filter.organizations ?? []), org.trim()])] }); setOrg(""); } }} style={{ maxWidth: 260 }} />
              <datalist id="ae-orgs">{facets?.organizations.map((o) => <option key={o.value} value={o.value}>{o.n}</option>)}</datalist></div></div>
          <Chips label="BIM role" options={fac(facets?.bimRoles)} value={filter.bimRoles} onChange={(v) => up({ bimRoles: v })} />
        </div>
        <label className="row small"><input type="checkbox" checked={filter.excludeTest !== false} onChange={(e) => up({ excludeTest: e.target.checked })} style={{ width: "auto" }} /> {t("Leave out test and deleted addresses")}</label>
      </>}
      <div className="row" style={{ marginTop: 8 }}><button type="button" className="small ghost" onClick={() => set(DEFAULT_FILTER)}>{t("Reset filters")}</button></div>
    </div>
  );
}

function People({ people, excluded, setExcluded }: { people: Person[]; excluded: Set<string>; setExcluded: (s: Set<string>) => void }) {
  const [shown, setShown] = useState(50);
  const picked = people.length - people.filter((p) => excluded.has(p.id)).length;
  const toggle = (id: string) => { const n = new Set(excluded); if (n.has(id)) n.delete(id); else n.add(id); setExcluded(n); };
  return <>
    <div className="row small" style={{ margin: "8px 0" }}><b>{picked}</b> {t("of")} {people.length} {t("picked")}
      <button type="button" className="small" onClick={() => setExcluded(new Set())}>{t("Pick all")}</button>
      <button type="button" className="small" onClick={() => setExcluded(new Set(people.map((p) => p.id)))}>{t("Pick none")}</button></div>
    {people.length > 0 && <div className="table-wrap ae-people"><table className="data">
      <thead><tr><th /><th>{t("Name")}</th><th>{t("Email")}</th><th>{t("Organisation")}</th><th>{t("Plan")}</th><th>{t("Last sign-in")}</th><th>{t("Status")}</th></tr></thead>
      <tbody>{people.slice(0, shown).map((p) => <tr key={p.id} style={excluded.has(p.id) ? { opacity: 0.5 } : undefined}>
        <td><input type="checkbox" aria-label={`Pick ${p.name}`} checked={!excluded.has(p.id)} onChange={() => toggle(p.id)} style={{ width: "auto" }} /></td>
        <td>{p.name}</td><td className="small">{p.email}</td><td className="small">{p.organization}</td>
        <td className="small">{PLAN_NAMES[p.plan]}{p.renewsAt && <div className="tiny muted">{t("until")} {new Date(p.renewsAt).toLocaleDateString()}</div>}</td>
        <td className="small">{p.lastLoginAt ? new Date(p.lastLoginAt).toLocaleDateString() : "—"}</td>
        <td className="small">{p.status}{!p.verified && <div className="tiny muted">{t("email not confirmed")}</div>}</td></tr>)}</tbody>
    </table></div>}
    {people.length > shown && <button type="button" className="small" onClick={() => setShown(shown + 200)}>{t("Show more")} ({people.length - shown})</button>}
  </>;
}

// ---------- editor ----------
const TONES: [Tone, string][] = [["gold", "Gold"], ["info", "Blue"], ["success", "Green"], ["danger", "Red"]];

function Editor({ form, set, placeholders }: { form: Form; set: (f: Form) => void; placeholders: [string, string][] }) {
  const { toast } = useSession();
  const up = (p: Partial<Form>) => set({ ...form, ...p });
  const F = ({ k, label, area, rows, hint }: { k: keyof Form; label: string; area?: boolean; rows?: number; hint?: string }) => <label className="ae-field ae-grow">
    <span className="ae-label">{t(label)}{hint && <span className="tiny muted"> · {t(hint)}</span>}</span>
    {area ? <textarea rows={rows ?? 3} value={form[k] as string} onChange={(e) => up({ [k]: e.target.value })} dir="auto" />
      : <input value={form[k] as string} onChange={(e) => up({ [k]: e.target.value })} dir="auto" />}
  </label>;
  const ToneSel = ({ k }: { k: "badgeTone" | "noticeTone" }) => <label className="ae-field"><span className="ae-label">{t("Colour")}</span><select value={form[k]} onChange={(e) => up({ [k]: e.target.value as Tone })}>{TONES.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select></label>;
  return (
    <div className="ae-editor">
      <div className="ae-row">{F({ k: "subject", label: "Subject" })}<label className="ae-field"><span className="ae-label">{t("Language")}</span><select value={form.lang} onChange={(e) => up({ lang: e.target.value as Form["lang"] })}><option value="en">English</option><option value="ar">العربية (RTL)</option></select></label></div>
      {F({ k: "preheader", label: "Preview line", hint: "shown after the subject in the inbox" })}
      <div className="ae-row">{F({ k: "badgeText", label: "Badge" })}{ToneSel({ k: "badgeTone" })}</div>
      {F({ k: "heading", label: "Heading" })}
      {F({ k: "intro", label: "Opening line", area: true, rows: 2 })}
      {F({ k: "paragraphs", label: "Paragraphs", area: true, rows: 4, hint: "leave a blank line between paragraphs" })}
      {F({ k: "steps", label: "Numbered steps", area: true, rows: 3, hint: "one per line" })}
      {F({ k: "rows", label: "Details table", area: true, rows: 3, hint: "one per line: Label | Value" })}
      <div className="ae-row">{F({ k: "noticeText", label: "Notice box", area: true, rows: 2 })}<div>{ToneSel({ k: "noticeTone" })}
        <label className="ae-field"><span className="ae-label">{t("Direction")}</span><select value={form.noticeDir} onChange={(e) => up({ noticeDir: e.target.value as Form["noticeDir"] })}><option value="">{t("Same as email")}</option><option value="ltr">LTR</option><option value="rtl">RTL (Arabic)</option></select></label></div></div>
      <div className="ae-row">{F({ k: "buttonLabel", label: "Button text" })}{F({ k: "buttonUrl", label: "Button link" })}</div>
      <div className="ae-row">{F({ k: "secondaryLabel", label: "Second link text" })}{F({ k: "secondaryUrl", label: "Second link" })}</div>
      <div className="ae-field"><span className="ae-label">{t("Banner image")}<span className="tiny muted"> · {t("shown under the logo; 1200 × 600 px works best")}</span></span>
        <div className="row">
          {form.imageSrc && <img src={form.imageSrc} alt="" className="ae-thumb" />}
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" style={{ maxWidth: 260 }} onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
            try { up({ imageSrc: await bannerFromFile(f) }); } catch (err) { toast((err as Error).message || "Couldn't read that picture.", "error"); }
          }} />
          {form.imageSrc && <button type="button" className="small ghost" onClick={() => up({ imageSrc: "", imageAlt: "", imageUrl: "" })}>{t("Remove")}</button>}
        </div>
        {form.imageSrc && <div className="ae-row">{F({ k: "imageAlt", label: "Picture description (alt text)" })}{F({ k: "imageUrl", label: "Picture link (optional)" })}</div>}
      </div>
      {F({ k: "reason", label: "Footer: why they get this", area: true, rows: 2 })}
      <div className="small muted">{t("Placeholders, filled in for each person (click to copy)")}: {placeholders.map(([p, l]) => <button key={p} type="button" className="ae-chip" title={t(l)} onClick={() => { navigator.clipboard?.writeText(p); toast(`${p} copied`); }}>{p}</button>)}</div>
    </div>
  );
}

// ---------- assistant ----------
const SUGGESTIONS = [
  "Find Professional and Expert users whose plan ends in the next 30 days",
  "Find people who haven't signed in for 60 days",
  "Write a short renewal reminder for them",
  "Make the email shorter and friendlier",
  "Add a banner picture about our new ISO 19650 course",
  "Translate this email into Arabic",
];

function Assistant({ form, filter, apply }: { form: Form; filter: AudienceFilter; apply: (r: { filter?: AudienceFilter; draft?: Blocks }) => void }) {
  const { toast } = useSession();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [msgs, busy]);
  const send = async (text: string) => {
    const content = text.trim(); if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const r = await api<{ reply: string; filter?: AudienceFilter; audience?: { count: number; sample: string[] }; draft?: Blocks; imagePrompt?: string; notes: string[] }>("/admin/email/assistant",
        { body: { messages: next.map((m) => ({ role: m.role, content: m.content })), draft: toBlocks(form), filter } });
      const notes = [...(r.notes ?? [])];
      if (r.filter) notes.unshift(`✓ ${t("Filter applied")}: ${r.audience?.count ?? 0} ${t("people")}${r.audience?.sample.length ? ` (${r.audience.sample.join(", ")}${(r.audience.count ?? 0) > r.audience.sample.length ? "…" : ""})` : ""}`);
      if (r.draft) notes.unshift(`✓ ${t("Email updated in the editor")}`);
      apply({ filter: r.filter, draft: r.draft });
      setMsgs([...next, { role: "assistant", content: r.reply || "Done.", notes, imagePrompt: r.imagePrompt }]);
    } catch (e) {
      toast((e as Error).message, "error");
      setMsgs([...next, { role: "assistant", content: `⚠ ${(e as Error).message}` }]);
    } finally { setBusy(false); }
  };
  return (
    <aside className="card ae-assistant" aria-label={t("Email assistant")}>
      <div className="row" style={{ justifyContent: "space-between" }}><h3 style={{ margin: 0 }}>✦ {t("Email assistant")}</h3>
        {msgs.length > 0 && <button type="button" className="small ghost" onClick={() => setMsgs([])}>{t("Clear")}</button>}</div>
      <p className="tiny muted" style={{ margin: "4px 0 8px" }}>{t("Finds people, writes the email and adjusts the mockup. For pictures it gives you a prompt for ChatGPT.")}</p>
      <div className="ae-chat" aria-live="polite">
        {!msgs.length && <div className="ae-suggest">{SUGGESTIONS.map((s) => <button key={s} type="button" className="ae-chip" onClick={() => send(s)}>{t(s)}</button>)}</div>}
        {msgs.map((m, i) => <div key={i} className={"ae-msg " + m.role}>
          <div dir="auto" style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          {m.notes?.map((n) => <div key={n} className="tiny ae-note">{n}</div>)}
          {m.imagePrompt && <div className="ae-prompt">
            <div className="tiny"><b>{t("Picture prompt for ChatGPT")}</b> — {t("paste it into ChatGPT, download the picture, then upload it with “Banner image”.")}</div>
            <pre dir="auto">{m.imagePrompt}</pre>
            <div className="row"><button type="button" className="small primary" onClick={() => { navigator.clipboard?.writeText(m.imagePrompt!); toast(t("Prompt copied")); }}>{t("Copy prompt")}</button>
              <a className="btn small" href="https://chatgpt.com/" target="_blank" rel="noreferrer noopener" onClick={() => navigator.clipboard?.writeText(m.imagePrompt!)}>{t("Copy and open ChatGPT")} ↗</a></div>
          </div>}
        </div>)}
        {busy && <div className="ae-msg assistant muted">{t("Thinking…")}</div>}
        <div ref={end} />
      </div>
      <form className="ae-ask" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <textarea rows={2} dir="auto" value={input} placeholder={t("e.g. Find Arabic-speaking users and write them an invitation to our webinar on 20 November")} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
        <button className="primary" disabled={busy || !input.trim()}>{t("Send")}</button>
      </form>
    </aside>
  );
}

// ---------- history ----------
function History({ list, reload, reuse }: { list: Campaign[]; reload: () => void; reuse: (b: Blocks) => void }) {
  const { toast } = useSession();
  const [open, setOpen] = useState<{ id: string; problems: { email: string; status: string; error: string }[] } | null>(null);
  const act = async (id: string, a: string) => { try { await api(`/admin/email/campaigns/${id}/${a}`, { body: {} }); reload(); } catch (e) { toast((e as Error).message, "error"); } };
  const STATE: Record<string, string> = { sending: "Sending…", paused: "Paused", interrupted: "Stopped (server restarted)", done: "Finished", cancelled: "Cancelled" };
  if (!list.length) return <p className="muted small">{t("Nothing sent from this page yet.")}</p>;
  return <div className="table-wrap"><table className="data">
    <thead><tr><th>{t("Sent")}</th><th>{t("Subject")}</th><th>{t("Progress")}</th><th>{t("State")}</th><th /></tr></thead>
    <tbody>{list.map((c) => {
      const done = c.sent + c.failed + c.skipped;
      return <tr key={c.id}>
        <td className="small nowrap">{fmtDate(c.createdAt)}<div className="tiny muted">{c.by}</div></td>
        <td>{c.subject}{c.filter.length > 0 && <div className="tiny muted">{c.filter.join(" · ")}</div>}
          {open?.id === c.id && <div className="tiny" style={{ marginTop: 6 }}>{open.problems.length ? open.problems.map((p) => <div key={p.email}>{p.email} — {p.status}{p.error && `: ${p.error}`}</div>) : t("No failed or skipped addresses.")}</div>}</td>
        <td className="small nowrap"><progress max={c.total} value={done} style={{ width: 100 }} /> {done}/{c.total}
          <div className="tiny muted">{c.sent} {t("sent")}{c.failed ? ` · ${c.failed} ${t("failed")}` : ""}{c.skipped ? ` · ${c.skipped} ${t("skipped")}` : ""}{c.pending && c.state === "sending" ? ` · ~${Math.ceil(c.pending * c.delayMs / 60000)} min ${t("left")}` : ""}</div></td>
        <td className="small">{t(STATE[c.state] ?? c.state)}</td>
        <td><div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
          {c.state === "sending" && <button type="button" className="small" onClick={() => act(c.id, "pause")}>{t("Pause")}</button>}
          {(c.state === "paused" || c.state === "interrupted") && <button type="button" className="small primary" onClick={() => act(c.id, "resume")}>{t("Resume")}</button>}
          {["sending", "paused", "interrupted"].includes(c.state) && <button type="button" className="small danger" onClick={() => { if (confirm(t("Cancel this email? People not reached yet won't get it."))) act(c.id, "cancel"); }}>{t("Cancel")}</button>}
          {c.failed > 0 && c.state !== "sending" && <button type="button" className="small" onClick={() => act(c.id, "retry")}>{t("Retry failed")}</button>}
          {(c.failed > 0 || c.skipped > 0) && <button type="button" className="small ghost" onClick={async () => { if (open?.id === c.id) return setOpen(null); const r = await api<{ problems: { email: string; status: string; error: string }[] }>(`/admin/email/campaigns/${c.id}`); setOpen({ id: c.id, problems: r.problems }); }}>{t("Details")}</button>}
          <button type="button" className="small ghost" title={t("Open this email in the editor")} onClick={async () => { const r = await api<{ blocks: Blocks }>(`/admin/email/campaigns/${c.id}`); reuse(r.blocks); }}>{t("Reuse")}</button>
        </div></td>
      </tr>;
    })}</tbody>
  </table></div>;
}

// ---------- page ----------
export default function AdminEmail() {
  const { toast } = useSession();
  const [facets, setFacets] = useState<Facets | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [placeholders, setPlaceholders] = useState<[string, string][]>([]);
  const [mail, setMail] = useState(true);
  const [filter, setFilter] = useState<AudienceFilter>(DEFAULT_FILTER);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState("announcement");
  const [form, setForm] = useState<Form | null>(null);
  const [undo, setUndo] = useState<{ form: Form | null; filter: AudienceFilter } | null>(null);
  const [preview, setPreview] = useState<{ html: string; to: string; problems: string[]; error?: string } | null>(null);
  const [previewUser, setPreviewUser] = useState("");
  const [delay, setDelay] = useState(3);
  const [sending, setSending] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    api<Facets>("/admin/email/facets").then(setFacets).catch((e) => toast(e.message, "error"));
    api<{ templates: Template[]; placeholders: [string, string][]; mail: boolean }>("/admin/email/templates").then((r) => {
      setTemplates(r.templates); setPlaceholders(r.placeholders); setMail(r.mail);
      setForm((f) => f ?? fromBlocks(r.templates[0].blocks)); setTemplateId(r.templates[0].id);
    }).catch((e) => toast(e.message, "error"));
  }, [toast]);

  // people matching the filter
  const qFilter = useDebounced(filter, 350);
  useEffect(() => {
    let live = true;
    api<{ people: Person[] }>("/admin/email/audience", { body: { filter: qFilter } }).then((r) => { if (live) setPeople(r.people); }).catch((e) => toast(e.message, "error"));
    return () => { live = false; };
  }, [qFilter, toast]);
  const picked = useMemo(() => (people ?? []).filter((p) => !excluded.has(p.id)), [people, excluded]);

  // live preview
  const blocks = useMemo(() => (form ? toBlocks(form) : null), [form]);
  const qBlocks = useDebounced(blocks, 450);
  useEffect(() => {
    if (!qBlocks) return;
    let live = true;
    api<{ html: string; to: string; problems: string[] }>("/admin/email/preview", { body: { blocks: qBlocks, userId: previewUser || undefined } })
      .then((r) => { if (live) setPreview(r); })
      .catch((e) => { if (live) setPreview((p) => ({ html: p?.html ?? "", to: p?.to ?? "", problems: [], error: (e as Error).message })); });
    return () => { live = false; };
  }, [qBlocks, previewUser]);

  const loadCampaigns = useCallback(() => api<{ campaigns: Campaign[] }>("/admin/email/campaigns").then((r) => setCampaigns(r.campaigns)).catch(() => undefined), []);
  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);
  const anySending = campaigns.some((c) => c.state === "sending");
  useEffect(() => { if (!anySending) return; const id = setInterval(loadCampaigns, 4000); return () => clearInterval(id); }, [anySending, loadCampaigns]);

  const chooseTemplate = (tp: Template) => {
    if (form && templateId !== tp.id && JSON.stringify(toBlocks(form)) !== JSON.stringify(toBlocks(fromBlocks(templates.find((x) => x.id === templateId)?.blocks ?? tp.blocks)))
      && !confirm(t("Replace your current email with this mockup?"))) return;
    setUndo({ form, filter }); setTemplateId(tp.id); setForm(fromBlocks(tp.blocks));
  };
  const applyAssistant = (r: { filter?: AudienceFilter; draft?: Blocks }) => {
    if (!r.filter && !r.draft) return;
    setUndo({ form, filter });
    if (r.filter) { setFilter(r.filter); setExcluded(new Set()); }
    if (r.draft) setForm(fromBlocks(r.draft));
  };

  const testSend = async () => {
    if (!blocks) return;
    try { const r = await api<{ to: string }>("/admin/email/test", { body: { blocks } }); toast(`${t("Test email sent to")} ${r.to}`); } catch (e) { toast((e as Error).message, "error"); }
  };
  const sendAll = async () => {
    if (!blocks || !picked.length) return;
    const mins = Math.ceil((picked.length * delay) / 60);
    if (!confirm(`${t("Send")} “${blocks.subject}” ${t("to")} ${picked.length} ${t("people")}?\n\n${describeFilter(filter).join("\n")}\n\n${t("One email every")} ${delay} s — ${t("about")} ${mins} min. ${t("You can pause or cancel it below.")}`)) return;
    setSending(true);
    try {
      const r = await api<{ total: number }>("/admin/email/campaigns", { body: { blocks, userIds: picked.map((p) => p.id), filter, delayMs: Math.round(delay * 1000) } });
      toast(`${t("Sending started")}: ${r.total} ${t("people")}`); loadCampaigns();
    } catch (e) { toast((e as Error).message, "error"); } finally { setSending(false); }
  };

  if (!form) return <p className="muted">Loading…</p>;
  const blocking = preview?.problems.length || preview?.error;
  return (
    <div className="ae-page">
      {!mail && <div className="banner">{t("Email isn't configured on the server (SMTP_HOST), so nothing can be sent yet. You can still prepare and preview emails.")}</div>}
      <div className="ae-layout">
        <div className="ae-main">
          <section className="card">
            <h3 className="ae-h"><span className="ae-step">1</span>{t("Who gets it")}</h3>
            <Filters filter={filter} set={(f) => { setFilter(f); setExcluded(new Set()); }} facets={facets} />
            {people ? <People people={people} excluded={excluded} setExcluded={setExcluded} /> : <p className="muted small">Loading…</p>}
          </section>

          <section className="card">
            <h3 className="ae-h"><span className="ae-step">2</span>{t("The email")}
              {undo && <button type="button" className="small ghost" style={{ marginInlineStart: "auto" }} onClick={() => { if (undo.form) setForm(undo.form); setFilter(undo.filter); setUndo(null); }}>↶ {t("Undo last change")}</button>}</h3>
            <div className="ae-gallery" role="list">{templates.map((tp) => <button key={tp.id} type="button" role="listitem" className={"ae-tpl" + (templateId === tp.id ? " on" : "")} onClick={() => chooseTemplate(tp)} title={tp.description}>
              <div className="ae-tpl-frame"><iframe title={tp.name} srcDoc={tp.html.replace("</head>", "<style>html{zoom:.25;overflow:hidden}</style></head>")} sandbox="allow-same-origin" tabIndex={-1} aria-hidden="true" /></div>
              <b>{tp.name}</b><span className="tiny muted">{tp.description}</span>
            </button>)}</div>
            <div className="ae-compose">
              <Editor form={form} set={setForm} placeholders={placeholders} />
              <div className="ae-preview">
                <div className="row small" style={{ justifyContent: "space-between" }}>
                  <span><b>{t("Preview")}</b>{preview?.to && <span className="muted"> · {t("as")} {preview.to}</span>}</span>
                  <select aria-label={t("Preview as")} value={previewUser} onChange={(e) => setPreviewUser(e.target.value)} style={{ maxWidth: 220 }}>
                    <option value="">{t("Sample (you, Professional plan)")}</option>
                    {picked.slice(0, 100).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {preview?.error && <div className="banner" style={{ color: "var(--danger)" }}>{preview.error}</div>}
                {preview?.problems.map((p) => <div key={p} className="banner">⚠ {p}</div>)}
                <div className="ae-subject small"><span className="muted">{t("Subject")}:</span> {blocks?.subject}</div>
                <iframe className="ae-frame" title={t("Email preview")} srcDoc={(preview?.html ?? "").replace("<head>", '<head><base target="_blank">')} sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" />
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="ae-h"><span className="ae-step">3</span>{t("Send")}</h3>
            <div className="row">
              <button type="button" onClick={testSend} disabled={!mail}>{t("Send a test to me")}</button>
              <label className="row small">{t("Pause between emails")} <input type="number" min={0.5} max={60} step={0.5} value={delay} onChange={(e) => setDelay(Math.min(60, Math.max(0.5, Number(e.target.value) || 3)))} className="ae-num" /> s</label>
              <button type="button" className="primary" disabled={!mail || sending || !picked.length || !!blocking || anySending} onClick={sendAll}>
                {sending ? t("Starting…") : `${t("Send to")} ${picked.length} ${t("people")}`}</button>
            </div>
            <p className="tiny muted">{blocking ? t("Fix the warnings above the preview to send.") : anySending ? t("Another email is being sent; wait for it or pause it.") : t("Emails go out one by one in the background, so you can leave this page. A pause of 3 seconds stays well inside mailbox sending limits.")}</p>
            <h4 style={{ marginBottom: 6 }}>{t("Sent from this page")}</h4>
            <History list={campaigns} reload={loadCampaigns} reuse={(b) => { setUndo({ form, filter }); setForm(fromBlocks(b)); toast(t("Loaded into the editor")); }} />
          </section>
        </div>
        <Assistant form={form} filter={filter} apply={applyAssistant} />
      </div>
    </div>
  );
}
