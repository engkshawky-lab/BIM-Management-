import { useCallback, useEffect, useState } from "react";
import { useSession } from "../App";
import { api, fmtDate } from "../lib/api";
import { PromoCodes } from "./Billing";

interface UserRow { id: string; name: string; email: string; organization: string; role: string; disabled: boolean; projects: number; createdAt: string; lastLoginAt: string | null; plan: string; renewsAt: string | null }
interface Fb { id: string; kind: string; message: string; page: string; status: string; name: string; email: string; createdAt: string; reply: string; repliedAt: string | null; hasScreenshot: boolean }
interface Act { id: string; project: string; user: string; summary: string; link: string; createdAt: string }
interface Branding { orgName: string; color: string; logo: string; footer: string }
const TABS = [["overview", "Overview"], ["users", "Users"], ["codes", "Plans & codes"], ["activity", "Activity log"], ["feedback", "Feedback"], ["branding", "Branding"]] as const;

function Overview() {
  const { toast } = useSession();
  const [o, setO] = useState<Record<string, number> | null>(null);
  const [mail, setMail] = useState<{ enabled: boolean; host: string; from: string } | null>(null);
  useEffect(() => { api<Record<string, number>>("/admin/overview").then(setO); api<typeof mail>("/admin/mail").then(setMail); }, []);
  if (!o) return <p className="muted">Loading…</p>;
  const mailCard = mail && <div className="card" style={{ marginTop: 12 }}><h3 style={{ marginTop: 0 }}>Email delivery</h3>
    {mail.enabled ? <p className="small">SMTP <b>{mail.host}</b>, sender <b>{mail.from}</b>. <button className="small" onClick={async () => { try { await api("/admin/mail/test", { body: {} }); toast("Test email sent to you"); } catch (e) { toast((e as Error).message, "error"); } }}>Send test email</button></p>
      : <p className="small muted">Not configured — notifications stay in-app and reset links are shown here instead of emailed. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM in the server <code>.env</code> and restart.</p>}</div>;
  const tiles: [string, string][] = [["users", "Users"], ["activeUsers", "Active (7 days)"], ["projects", "Projects"], ["documents", "Documents"], ["files", "Files"], ["issues", "Issues"], ["newFeedback", "New feedback"]];
  return <><div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>{tiles.map(([k, l]) => <div key={k} className="card"><div className="stat">{o[k]}</div><div className="small muted">{l}</div></div>)}</div>{mailCard}</>;
}

function Users() {
  const { toast, user } = useSession();
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [q, setQ] = useState("");
  const [link, setLink] = useState<{ email: string; link: string } | null>(null);
  const load = useCallback(() => api<{ users: UserRow[] }>("/admin/users").then((r) => setRows(r.users)), []);
  useEffect(() => { load(); }, [load]);
  if (!rows) return <p className="muted">Loading…</p>;
  const upd = async (id: string, body: object) => { try { await api(`/admin/users/${id}`, { method: "PUT", body }); load(); } catch (e) { toast((e as Error).message, "error"); } };
  const list = rows.filter((u) => !q || `${u.name} ${u.email} ${u.organization}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <input placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320, marginBottom: 10 }} />
      {link && <div className="banner info">One-time reset link for <b>{link.email}</b> (valid 60 minutes) — send it to them securely: <code style={{ wordBreak: "break-all" }}>{link.link}</code> <button className="small" onClick={() => navigator.clipboard?.writeText(link.link)}>Copy</button></div>}
      <div className="table-wrap"><table className="data">
        <thead><tr><th>Name</th><th>Email</th><th>Organisation</th><th>Projects</th><th>Joined</th><th>Last sign-in</th><th>Role</th><th>Plan</th><th>Status</th><th /></tr></thead>
        <tbody>{list.map((u) => (
          <tr key={u.id} style={u.disabled ? { opacity: 0.6 } : undefined}>
            <td>{u.name}</td><td className="small">{u.email}</td><td className="small">{u.organization}</td><td>{u.projects}</td>
            <td className="small">{fmtDate(u.createdAt)}</td><td className="small">{u.lastLoginAt ? fmtDate(u.lastLoginAt) : "—"}</td>
            <td><select value={u.role} disabled={u.id === user.id} onChange={(e) => upd(u.id, { role: e.target.value })}><option value="user">User</option><option value="recruiter">Recruiter</option><option value="admin">Admin</option></select></td>
            <td><select value={u.plan} onChange={async (e) => { const plan = e.target.value; const m = plan === "free" ? null : prompt("For how many months? (leave empty for no end date)", "12"); if (m === null && plan !== "free") return; try { await api(`/admin/users/${u.id}/plan`, { method: "PUT", body: { plan, months: m ? Number(m) : null } }); load(); } catch (err) { toast((err as Error).message, "error"); } }}>
              <option value="free">Free</option><option value="pro">Professional</option><option value="enterprise">Enterprise</option></select>{u.renewsAt && <div className="tiny muted">until {fmtDate(u.renewsAt)}</div>}</td>
            <td>{u.id !== user.id && <button className="small" onClick={() => upd(u.id, { disabled: !u.disabled })}>{u.disabled ? "Enable" : "Disable"}</button>}</td>
            <td><button className="small" onClick={async () => { const r = await api<{ link: string }>(`/admin/users/${u.id}/reset-link`, { body: {} }); setLink({ email: u.email, link: r.link }); }}>Reset link</button></td>
          </tr>
        ))}</tbody>
      </table></div>
    </>
  );
}

function Activity() {
  const [rows, setRows] = useState<Act[] | null>(null);
  useEffect(() => { api<{ activity: Act[] }>("/admin/activity").then((r) => setRows(r.activity)); }, []);
  if (!rows) return <p className="muted">Loading…</p>;
  return <div className="card"><table className="data"><tbody>{rows.map((a) => <tr key={a.id}><td className="small nowrap muted">{fmtDate(a.createdAt)}</td><td className="small mono">{a.project}</td><td className="small">{a.user}</td><td>{a.link ? <a href={`#${a.link}`}>{a.summary}</a> : a.summary}</td></tr>)}</tbody></table></div>;
}

function Feedback() {
  const { toast } = useSession();
  const [rows, setRows] = useState<Fb[] | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const load = useCallback(() => api<{ feedback: Fb[] }>("/admin/feedback").then((r) => setRows(r.feedback)), []);
  useEffect(() => { load(); }, [load]);
  const put = async (id: string, body: Partial<Fb>) => { try { await api(`/admin/feedback/${id}`, { method: "PUT", body }); load(); } catch (e) { toast((e as Error).message, "error"); } };
  if (!rows) return <p className="muted">Loading…</p>;
  return <div className="card">{rows.length ? <table className="data"><tbody>{rows.map((f) => (
    <tr key={f.id}><td className="small nowrap muted">{fmtDate(f.createdAt)}</td><td><span className="chip">{f.kind}</span></td>
      <td>{f.message}<div className="tiny muted">{f.name} · {f.email}{f.page && ` · ${f.page}`}</div>
        {f.hasScreenshot && <div><button className="linklike small" onClick={() => setShot(shot === f.id ? null : f.id)}>🖼 {shot === f.id ? "Hide" : "Show"} screenshot</button>{shot === f.id && <img src={`/api/feedback/${f.id}/screenshot`} alt="Attached screenshot" style={{ display: "block", maxWidth: "100%", marginTop: 6, borderRadius: 6 }} />}</div>}
        {f.reply && <div className="guidance small" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}><b>Reply:</b> {f.reply}</div>}
        <div className="row" style={{ marginTop: 6 }}>
          <input placeholder={f.reply ? "Send another reply…" : "Reply to the user…"} value={draft[f.id] ?? ""} onChange={(e) => setDraft({ ...draft, [f.id]: e.target.value })} />
          <button className="small" disabled={!(draft[f.id] ?? "").trim()} onClick={async () => { await put(f.id, { reply: draft[f.id].trim(), ...(f.status === "New" ? { status: "In progress" } : {}) }); setDraft({ ...draft, [f.id]: "" }); }}>Reply</button>
        </div>
      </td>
      <td><select value={f.status} onChange={(e) => put(f.id, { status: e.target.value })}>{["New", "In progress", "Done", "Won't fix"].map((s) => <option key={s}>{s}</option>)}</select></td></tr>
  ))}</tbody></table> : <p className="muted">No feedback yet.</p>}</div>;
}

function BrandingTab() {
  const { toast } = useSession();
  const [b, setB] = useState<Branding | null>(null);
  useEffect(() => { api<{ branding: Branding }>("/settings/branding").then((r) => setB(r.branding)); }, []);
  if (!b) return <p className="muted">Loading…</p>;
  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <p className="muted small">Shown on the cover and headers of Word exports.</p>
      <label>Organisation name</label><input value={b.orgName} onChange={(e) => setB({ ...b, orgName: e.target.value })} />
      <label>Brand colour</label><input type="color" value={b.color.startsWith("#") ? b.color : `#${b.color}`} onChange={(e) => setB({ ...b, color: e.target.value })} style={{ width: 80, height: 36 }} />
      <label>Logo (PNG or JPEG, up to 200 KB)</label>
      <div className="row">{b.logo && <img src={b.logo} alt="Logo" style={{ maxHeight: 48 }} />}<input type="file" accept="image/png,image/jpeg" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 200_000) return toast("Logo must be under 200 KB", "error"); const rd = new FileReader(); rd.onload = () => setB({ ...b, logo: String(rd.result) }); rd.readAsDataURL(f); }} />{b.logo && <button className="ghost small" onClick={() => setB({ ...b, logo: "" })}>Remove</button>}</div>
      <label>Footer text</label><input value={b.footer} onChange={(e) => setB({ ...b, footer: e.target.value })} placeholder="e.g. Confidential — prepared for the appointing party" />
      <button className="primary" style={{ marginTop: 12 }} onClick={async () => { try { await api("/settings/branding", { method: "PUT", body: b }); toast("Branding saved"); } catch (e) { toast((e as Error).message, "error"); } }}>Save branding</button>
    </div>
  );
}

export default function Admin({ tab }: { tab?: string }) {
  const { user } = useSession();
  if (user.role !== "admin") return <div className="card muted">Administrators only.</div>;
  const cur = TABS.some(([k]) => k === tab) ? tab! : "overview";
  return (
    <>
      <div className="page-head"><h1>Admin console</h1></div>
      <div className="tabs">{TABS.map(([k, l]) => <a key={k} className={"tab" + (cur === k ? " on" : "")} href={`#/admin/${k}`}>{l}</a>)}</div>
      {cur === "overview" ? <Overview /> : cur === "users" ? <Users /> : cur === "codes" ? <PromoCodes /> : cur === "activity" ? <Activity /> : cur === "feedback" ? <Feedback /> : <BrandingTab />}
    </>
  );
}
