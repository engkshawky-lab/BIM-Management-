import { useEffect, useState } from "react";
import { useSession } from "../App";
import { api, fmtDate } from "../lib/api";

interface Profile { visible: boolean; showResults: boolean; headline: string; skills: string[]; certifications: string[]; years: number; location: string; availability: string }
interface Results { exam: number | null; topics: Record<string, number> }
interface Candidate extends Profile { userId: string; name: string; organization: string; jobTitle: string; results: Results | null; email?: string; bio?: string }
const AVAIL = ["Not looking", "Open to offers", "Available now"];
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function MyTalentProfile() {
  const { toast } = useSession();
  const [p, setP] = useState<Profile | null>(null);
  const [views, setViews] = useState<{ at: string; name: string; org: string }[]>([]);
  useEffect(() => { api<{ profile: Profile | null; views: typeof views }>("/talent/me").then((r) => { setP(r.profile ?? { visible: false, showResults: false, headline: "", skills: [], certifications: [], years: 0, location: "", availability: "Not looking" }); setViews(r.views); }); }, []);
  if (!p) return <p className="muted">Loading…</p>;
  return (
    <>
      <div className="page-head"><h1>My talent profile</h1><p className="muted">Optional. Only recruiters approved by your administrator can search profiles, only when you switch visibility on, and you are notified every time someone opens yours.</p></div>
      <div className="grid g2">
        <div className="card">
          <label className="check"><input type="checkbox" checked={p.visible} onChange={(e) => setP({ ...p, visible: e.target.checked })} /> <b>List my profile in the talent pool</b></label>
          <label className="check"><input type="checkbox" checked={p.showResults} onChange={(e) => setP({ ...p, showResults: e.target.checked })} /> Show my best Learn results (mock exam and topic scores)</label>
          <label>Headline</label><input value={p.headline} onChange={(e) => setP({ ...p, headline: e.target.value })} placeholder="e.g. ISO 19650 Information Manager — infrastructure" />
          <label>Skills (comma separated)</label><input defaultValue={p.skills.join(", ")} onBlur={(e) => setP({ ...p, skills: list(e.target.value) })} placeholder="Revit, Navisworks, COBie, CDE administration" />
          <label>Certifications (comma separated)</label><input defaultValue={p.certifications.join(", ")} onBlur={(e) => setP({ ...p, certifications: list(e.target.value) })} placeholder="BRE ISO 19650 Practitioner, Autodesk Certified Professional" />
          <div className="grid g3"><div><label>Years of experience</label><input type="number" min={0} max={60} value={p.years} onChange={(e) => setP({ ...p, years: +e.target.value })} /></div>
            <div><label>Location</label><input value={p.location} onChange={(e) => setP({ ...p, location: e.target.value })} /></div>
            <div><label>Availability</label><select value={p.availability} onChange={(e) => setP({ ...p, availability: e.target.value })}>{AVAIL.map((a) => <option key={a}>{a}</option>)}</select></div></div>
          <p className="tiny muted">Your email is only shown to recruiters when you are open to offers or available.</p>
          <div className="row"><button className="primary" onClick={async () => { try { await api("/talent/me", { method: "PUT", body: p }); toast("Talent profile saved"); } catch (e) { toast((e as Error).message, "error"); } }}>Save</button>
            <button className="ghost danger" onClick={async () => { await api("/talent/me", { method: "DELETE" }); toast("Talent profile deleted"); setP({ ...p, visible: false, skills: [], certifications: [], headline: "" }); }}>Delete profile</button></div>
        </div>
        <div className="card"><h3 style={{ marginTop: 0 }}>Who viewed my profile</h3>{views.length ? views.map((v, i) => <div key={i} className="small">{fmtDate(v.at)} — {v.name}{v.org && `, ${v.org}`}</div>) : <p className="small muted">No views yet.</p>}</div>
      </div>
    </>
  );
}

export function TalentSearch() {
  const { user, toast } = useSession();
  const [q, setQ] = useState(""); const [avail, setAvail] = useState("");
  const [rows, setRows] = useState<Candidate[] | null>(null);
  const [open, setOpen] = useState<Candidate | null>(null);
  useEffect(() => { if (!["recruiter", "admin"].includes(user.role)) return; const t = setTimeout(() => api<{ candidates: Candidate[] }>(`/talent/search?q=${encodeURIComponent(q)}&availability=${encodeURIComponent(avail)}`).then((r) => setRows(r.candidates)).catch((e) => toast(e.message, "error")), 250); return () => clearTimeout(t); }, [q, avail, user.role, toast]);
  if (!["recruiter", "admin"].includes(user.role)) return <div className="card muted">Talent search is available to recruiters. Ask an administrator to give your account the Recruiter role. You can still <a href="#/talent/me">create your own talent profile</a>.</div>;
  return (
    <>
      <div className="page-head"><h1>Talent pool</h1><p className="muted">Professionals who chose to be listed. Opening a profile notifies the person.</p></div>
      <div className="row" style={{ marginBottom: 10 }}><input placeholder="Search skills, certifications, location…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 360 }} />
        <select value={avail} onChange={(e) => setAvail(e.target.value)} style={{ width: "auto" }}><option value="">Any availability</option>{AVAIL.map((a) => <option key={a}>{a}</option>)}</select></div>
      {open && <div className="card" style={{ marginBottom: 12 }}>
        <div className="row spread"><h2 style={{ margin: 0 }}>{open.name}</h2><button className="ghost small" onClick={() => setOpen(null)}>Close</button></div>
        <p>{open.headline}</p><p className="small muted">{open.jobTitle}{open.organization && ` · ${open.organization}`} · {open.years} years · {open.location} · {open.availability}</p>
        {open.bio && <p className="small">{open.bio}</p>}
        {open.email ? <p>Contact: <a href={`mailto:${open.email}`}>{open.email}</a></p> : <p className="small muted">Not currently looking — contact details hidden.</p>}
        {open.results && <div>{open.results.exam !== null && <p className="small">Best mock exam: <b>{open.results.exam}%</b></p>}{Object.entries(open.results.topics).map(([t, v]) => <div key={t} className="bar-row"><span className="small">{t}</span><span className="bar"><span style={{ width: `${v}%` }} /></span><b className="small">{v}%</b></div>)}</div>}
      </div>}
      {rows === null ? <p className="muted">Loading…</p> : <div className="grid g3">{rows.map((c) => (
        <button key={c.userId} className="card stat-card" style={{ textAlign: "left" }} onClick={async () => { const r = await api<{ candidate: Candidate }>(`/talent/${c.userId}`); setOpen(r.candidate); }}>
          <b>{c.name}</b><div className="small">{c.headline}</div><div className="tiny muted">{c.years} yrs · {c.location} · {c.availability}</div>
          <div className="chips" style={{ marginTop: 6 }}>{c.skills.slice(0, 6).map((s) => <span key={s} className="chip">{s}</span>)}</div>
          {c.results?.exam != null && <div className="tiny" style={{ marginTop: 4 }}>Mock exam best: {c.results.exam}%</div>}
        </button>
      ))}{!rows.length && <p className="muted">No matching profiles.</p>}</div>}
    </>
  );
}
