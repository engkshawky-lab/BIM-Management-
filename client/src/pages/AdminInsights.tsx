import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "../App";
import { t } from "../i18n";
import { api, fmtDate } from "../lib/api";
import { ACCOUNT_PAGES, SECTIONS, TEMPLATE_PAGES } from "../shell/nav";

// Admin reports and queues: statistics, AI usage, learning and leaderboard, subscriptions, sessions, accounts waiting
// for approval, enquiries (leads) and a check that opens every menu page.

const PLAN_NAMES: Record<string, string> = { free: "Free", starter: "Starter", pro: "Professional", expert: "Expert" };
const useLoad = <T,>(path: string) => {
  const { toast } = useSession();
  const [data, setData] = useState<T | null>(null);
  const load = useCallback(() => api<T>(path).then(setData).catch((e) => toast((e as Error).message, "error")), [path, toast]);
  useEffect(() => { load(); }, [load]);
  return [data, load] as const;
};
const Loading = () => <p className="muted">{t("Loading…")}</p>;

/** Small bar chart of weekly counts. */
function Weekly({ title, rows }: { title: string; rows: { week: string; n: number }[] }) {
  const top = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{t(title)} <span className="muted small">· {rows.reduce((a, r) => a + r.n, 0)} {t("in 12 weeks")}</span></h3>
      <div className="adm-weeks" role="img" aria-label={`${t(title)}: ${rows.map((r) => `${r.week} ${r.n}`).join(", ")}`}>
        {rows.map((r) => <div key={r.week} title={`${t("Week of")} ${r.week}: ${r.n}`}><span style={{ height: `${(r.n / top) * 100}%` }} /><b>{r.n || ""}</b></div>)}
      </div>
      <div className="row spread tiny muted"><span>{rows[0]?.week}</span><span>{rows.at(-1)?.week}</span></div>
    </div>
  );
}

interface Stats {
  totals: Record<string, number>; signups: { week: string; n: number }[]; projects: { week: string; n: number }[]; lessons: { week: string; n: number }[]; quizzes: { week: string; n: number }[];
  quizAverage: number | null; aiByMonth: { month: string; requests: number; users: number }[]; planMix: { plan: string; users: number }[];
}
export function Statistics() {
  const [s] = useLoad<Stats>("/admin/stats");
  if (!s) return <Loading />;
  const tiles: [string, string | number][] = [["Users", s.totals.users], ["Active today", s.totals.active1], ["Active (7 days)", s.totals.active7], ["Active (30 days)", s.totals.active30],
    ["Waiting for approval", s.totals.pending], ["Paid plans", s.totals.paid], ["Yearly plan revenue (USD)", s.totals.yearlyRevenue.toLocaleString()], ["Average quiz score", s.quizAverage === null ? "—" : `${s.quizAverage}%`]];
  const maxAi = Math.max(1, ...s.aiByMonth.map((m) => m.requests));
  const totalUsers = Math.max(1, s.planMix.reduce((a, p) => a + p.users, 0));
  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>{tiles.map(([l, v]) => <div key={l} className="card"><div className="stat">{v}</div><div className="small muted">{t(l)}</div></div>)}</div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        <Weekly title="New accounts per week" rows={s.signups} />
        <Weekly title="New projects per week" rows={s.projects} />
        <Weekly title="Lessons completed per week" rows={s.lessons} />
        <Weekly title="Quizzes taken per week" rows={s.quizzes} />
        <div className="card"><h3 style={{ marginTop: 0 }}>{t("AI growth: requests per month")}</h3>
          {s.aiByMonth.length === 0 ? <p className="muted small">{t("No AI use yet.")}</p> : s.aiByMonth.map((m) => (
            <div key={m.month} className="bar-row"><span className="small">{m.month} · {m.users} {t("users")}</span><span className="bar"><span style={{ width: `${(m.requests / maxAi) * 100}%` }} /></span><span className="small">{m.requests}</span></div>))}</div>
        <div className="card"><h3 style={{ marginTop: 0 }}>{t("Plans")}</h3>
          {s.planMix.map((p) => <div key={p.plan} className="bar-row"><span className="small">{t(PLAN_NAMES[p.plan] ?? p.plan)}</span><span className="bar"><span style={{ width: `${(p.users / totalUsers) * 100}%` }} /></span><span className="small">{p.users}</span></div>)}</div>
      </div>
    </div>
  );
}

interface AiUse { month: string; months: string[]; billing: boolean; monthlyLimit: number; perMinute: number; users: { userId: string; name: string | null; email: string | null; n: number; plan: string; limit: number | null }[] }
export function AiUsage() {
  const [month, setMonth] = useState("");
  const [d] = useLoad<AiUse>(`/admin/ai-usage${month ? `?month=${month}` : ""}`);
  if (!d) return <Loading />;
  const total = d.users.reduce((a, u) => a + u.n, 0);
  return (
    <>
      <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <label htmlFor="ai-month">{t("Month")}</label>
        <select id="ai-month" value={d.month} onChange={(e) => setMonth(e.target.value)}>{[...new Set([d.month, ...d.months])].map((m) => <option key={m}>{m}</option>)}</select>
        <span className="small muted">{total} {t("requests by")} {d.users.length} {t("users")} · {t("limit per minute")}: {d.perMinute || t("none")} · {d.billing ? t("monthly limits come from each plan") : `${t("monthly limit without plans")}: ${d.monthlyLimit || t("none")}`}</span>
        <a className="small" href="#/admin/settings">{t("Change AI settings")}</a>
      </div>
      {d.users.length === 0 ? <p className="muted">{t("No AI use in this month.")}</p> : (
        <div className="table-wrap"><table className="data">
          <thead><tr><th>{t("User")}</th><th>{t("Plan")}</th><th>{t("Requests")}</th><th>{t("Of plan limit")}</th></tr></thead>
          <tbody>{d.users.map((u) => {
            const limit = d.billing ? u.limit : d.monthlyLimit || null;
            const pct = limit ? Math.round((100 * u.n) / limit) : null;
            return <tr key={u.userId}><td>{u.name ?? t("Deleted user")}<div className="tiny muted">{u.email}</div></td><td>{t(PLAN_NAMES[u.plan] ?? u.plan)}</td><td>{u.n}</td>
              <td>{pct === null ? "—" : <span style={{ color: pct >= 100 ? "var(--danger)" : pct >= 80 ? "var(--warn)" : undefined }}>{pct}% {t("of")} {limit}</span>}</td></tr>;
          })}</tbody>
        </table></div>)}
    </>
  );
}

interface Learner { rank: number; userId: string; name?: string; email?: string; organization?: string; lessons: number; quizzes: number; average: number | null; best: number | null; points: number; last: string }
export function Learning({ board = false }: { board?: boolean }) {
  const [d] = useLoad<{ learners: Learner[]; courses: { courseId: string; completions: number }[] }>("/admin/learning");
  const [q, setQ] = useState("");
  if (!d) return <Loading />;
  const list = d.learners.filter((l) => !q || `${l.name} ${l.email} ${l.organization}`.toLowerCase().includes(q.toLowerCase()));
  if (board) return (
    <>
      <p className="small muted">{t("Points: 10 for each lesson completed, plus the best score in each quiz topic.")}</p>
      <ol className="adm-board">{d.learners.slice(0, 50).map((l) => (
        <li key={l.userId}><span className="adm-rank">{l.rank <= 3 ? ["🥇", "🥈", "🥉"][l.rank - 1] : l.rank}</span><span><b>{l.name ?? t("Deleted user")}</b><div className="tiny muted">{l.organization}</div></span><span className="small muted">{l.lessons} {t("lessons")} · {l.quizzes} {t("quizzes")}</span><b>{l.points}</b></li>))}</ol>
      {d.learners.length === 0 && <p className="muted">{t("No lessons or quizzes completed yet.")}</p>}
    </>
  );
  return (
    <>
      <input type="search" aria-label={t("Search learners…")} placeholder={t("Search learners…")} value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320, marginBottom: 10 }} />
      <div className="table-wrap"><table className="data">
        <thead><tr><th>{t("Learner")}</th><th>{t("Lessons completed")}</th><th>{t("Quizzes")}</th><th>{t("Average score")}</th><th>{t("Best score")}</th><th>{t("Points")}</th><th>{t("Last activity")}</th></tr></thead>
        <tbody>{list.map((l) => <tr key={l.userId}><td>{l.name ?? t("Deleted user")}<div className="tiny muted">{l.email}</div></td><td>{l.lessons}</td><td>{l.quizzes}</td><td>{l.average ?? "—"}{l.average !== null && "%"}</td><td>{l.best ?? "—"}{l.best !== null && "%"}</td><td>{l.points}</td><td className="small">{fmtDate(l.last)}</td></tr>)}</tbody>
      </table></div>
      {d.courses.length > 0 && <div className="card" style={{ marginTop: 12 }}><h3 style={{ marginTop: 0 }}>{t("Lesson completions by course")}</h3>
        {d.courses.sort((a, b) => b.completions - a.completions).map((c) => <div key={c.courseId} className="bar-row"><span className="small mono">{c.courseId}</span><span className="bar"><span style={{ width: `${(c.completions / Math.max(...d.courses.map((x) => x.completions))) * 100}%` }} /></span><span className="small">{c.completions}</span></div>)}</div>}
    </>
  );
}

interface Sub { userId: string; name: string | null; email: string | null; plan: string; status: string; source: string; renewsAt: string | null; updatedAt: string; online: boolean }
export function Subscriptions() {
  const [d] = useLoad<{ subscriptions: Sub[] }>("/admin/subscriptions");
  const [plan, setPlan] = useState("paid");
  if (!d) return <Loading />;
  const now = Date.now();
  const list = d.subscriptions.filter((s) => plan === "all" || (plan === "paid" ? s.plan !== "free" : s.plan === plan));
  const expiring = d.subscriptions.filter((s) => s.plan !== "free" && s.renewsAt && new Date(s.renewsAt).getTime() - now < 30 * 864e5 && new Date(s.renewsAt).getTime() > now).length;
  return (
    <>
      <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <label htmlFor="sub-plan">{t("Show")}</label>
        <select id="sub-plan" value={plan} onChange={(e) => setPlan(e.target.value)}><option value="paid">{t("Paid plans")}</option><option value="all">{t("All")}</option>{Object.entries(PLAN_NAMES).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}</select>
        <span className="small muted">{list.length} {t("shown")} · {expiring} {t("end within 30 days")}</span>
        <span className="small muted">{t("Change a user's plan in Users.")}</span>
      </div>
      <div className="table-wrap"><table className="data">
        <thead><tr><th>{t("User")}</th><th>{t("Plan")}</th><th>{t("Status")}</th><th>{t("Given by")}</th><th>{t("Ends or renews")}</th><th>{t("Updated")}</th></tr></thead>
        <tbody>{list.map((s) => <tr key={s.userId}><td>{s.name ?? t("Deleted user")}<div className="tiny muted">{s.email}</div></td><td>{t(PLAN_NAMES[s.plan] ?? s.plan)}</td><td>{t(s.status)}</td>
          <td className="small">{s.online ? t("Card payment") : s.source || "—"}</td><td className="small">{s.renewsAt ? fmtDate(s.renewsAt) : t("No end date")}</td><td className="small">{fmtDate(s.updatedAt)}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}

interface Sess { userId: string; name: string; email: string; n: number; latest: string; lastLoginAt: string | null }
export function Sessions() {
  const { toast, user } = useSession();
  const [d, load] = useLoad<{ sessions: Sess[]; expired: number }>("/admin/sessions");
  if (!d) return <Loading />;
  const post = async (path: string, done: string) => { try { await api(path, { body: {} }); toast(t(done)); load(); } catch (e) { toast((e as Error).message, "error"); } };
  return (
    <>
      <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <span className="small">{d.sessions.reduce((a, s) => a + s.n, 0)} {t("signed-in sessions for")} {d.sessions.length} {t("users")} · {d.expired} {t("expired sessions stored")}</span>
        {d.expired > 0 && <button type="button" className="small" onClick={() => post("/admin/sessions/cleanup", "Expired sessions removed")}>{t("Remove expired sessions")}</button>}
      </div>
      <p className="small muted">{t("Sessions last 14 days. Signing a user out everywhere ends all their sessions at once, for example after a lost laptop.")}</p>
      <div className="table-wrap"><table className="data">
        <thead><tr><th>{t("User")}</th><th>{t("Sessions")}</th><th>{t("Latest sign-in")}</th><th /></tr></thead>
        <tbody>{d.sessions.map((s) => <tr key={s.userId}><td>{s.name}<div className="tiny muted">{s.email}</div></td><td>{s.n}{s.n > 5 && <span className="tiny" style={{ color: "var(--warn)" }}> · {t("many devices")}</span>}</td><td className="small">{fmtDate(s.latest)}</td>
          <td>{s.userId !== user.id && <button type="button" className="small" onClick={() => post(`/admin/users/${s.userId}/signout`, "User signed out everywhere")}>{t("Sign out everywhere")}</button>}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}

interface Pend { id: string; name: string; email: string; organization: string; jobTitle: string; createdAt: string; emailVerifiedAt: string | null }
export function Pending() {
  const { toast } = useSession();
  const [d, load] = useLoad<{ users: Pend[] }>("/admin/pending");
  if (!d) return <Loading />;
  const act = async (path: string, method: string, done: string) => { try { await api(path, { method, body: {} }); toast(t(done)); load(); } catch (e) { toast((e as Error).message, "error"); } };
  return (
    <>
      <p className="small muted">{t("Accounts wait here when “Approve new accounts” is on in Settings. Approving sends the person an email; rejecting deletes the account.")} <a href="#/admin/settings">{t("Settings")}</a></p>
      {d.users.length === 0 ? <p className="muted">{t("No accounts waiting for approval.")}</p> : (
        <div className="table-wrap"><table className="data">
          <thead><tr><th>{t("Name")}</th><th>{t("Organisation")}</th><th>{t("Signed up")}</th><th>{t("Email")}</th><th /></tr></thead>
          <tbody>{d.users.map((u) => <tr key={u.id}><td>{u.name}<div className="tiny muted">{u.email}</div></td><td className="small">{u.organization}<div className="tiny muted">{u.jobTitle}</div></td><td className="small">{fmtDate(u.createdAt)}</td>
            <td className="small">{u.emailVerifiedAt ? <span style={{ color: "var(--ok)" }}>✓ {t("Confirmed")}</span> : t("Not confirmed")}</td>
            <td><div className="row" style={{ gap: 4 }}><button type="button" className="small primary" onClick={() => act(`/admin/users/${u.id}/approve`, "POST", "Account approved")}>{t("Approve")}</button>
              <button type="button" className="small danger" onClick={() => { if (confirm(t("Reject and delete this account?"))) act(`/admin/users/${u.id}`, "DELETE", "Account rejected"); }}>{t("Reject")}</button></div></td></tr>)}</tbody>
        </table></div>)}
    </>
  );
}

interface Lead { id: string; name: string; email: string; company: string; phone: string; interest: string; message: string; source: string; status: string; note: string; createdAt: string }
const LEAD_STATUS = ["New", "Contacted", "Qualified", "Won", "Lost"];
export function Leads() {
  const { toast } = useSession();
  const [d, load] = useLoad<{ leads: Lead[] }>("/admin/leads");
  const [status, setStatus] = useState("open");
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (!d) return <Loading />;
  const put = async (id: string, body: object) => { try { await api(`/admin/leads/${id}`, { method: "PUT", body }); load(); } catch (e) { toast((e as Error).message, "error"); } };
  const list = d.leads.filter((l) => status === "all" || (status === "open" ? !["Won", "Lost"].includes(l.status) : l.status === status));
  const csv = () => {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [["Date", "Name", "Email", "Company", "Phone", "Interest", "Status", "Message", "Note"], ...d.leads.map((l) => [l.createdAt.slice(0, 10), l.name, l.email, l.company, l.phone, l.interest, l.status, l.message, l.note])];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" })); a.download = "leads.csv"; a.click();
  };
  return (
    <>
      <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <label htmlFor="lead-status">{t("Show")}</label>
        <select id="lead-status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="open">{t("Open")}</option><option value="all">{t("All")}</option>{LEAD_STATUS.map((s) => <option key={s} value={s}>{t(s)}</option>)}</select>
        <span className="small muted">{list.length} {t("shown")} · {t("from the Talk to us form on the About page")}</span>
        <span className="pagebar-spacer" /><button type="button" className="small" onClick={csv} disabled={!d.leads.length}>{t("Download CSV")}</button>
      </div>
      {list.length === 0 ? <p className="muted">{t("No enquiries yet.")}</p> : list.map((l) => (
        <div key={l.id} className="card" style={{ marginBottom: 8 }}>
          <div className="row spread" style={{ flexWrap: "wrap", gap: 8 }}>
            <div><b>{l.name}</b> · <a href={`mailto:${l.email}`}>{l.email}</a>{l.company && <> · {l.company}</>}{l.phone && <> · {l.phone}</>}<div className="tiny muted">{fmtDate(l.createdAt)}{l.interest && <> · {t("interested in")} {l.interest}</>}{l.source && <> · {l.source}</>}</div></div>
            <div className="row" style={{ gap: 6 }}>
              <select aria-label={t("Status")} value={l.status} onChange={(e) => put(l.id, { status: e.target.value })}>{LEAD_STATUS.map((s) => <option key={s} value={s}>{t(s)}</option>)}</select>
              <button type="button" className="small danger" onClick={async () => { if (confirm(t("Delete this enquiry?"))) { await api(`/admin/leads/${l.id}`, { method: "DELETE" }); load(); } }}>{t("Delete")}</button>
            </div>
          </div>
          {l.message && <p style={{ whiteSpace: "pre-wrap" }}>{l.message}</p>}
          <div className="row" style={{ gap: 6 }}>
            <input aria-label={t("Internal note")} placeholder={t("Internal note…")} value={notes[l.id] ?? l.note} onChange={(e) => setNotes({ ...notes, [l.id]: e.target.value })} />
            {(notes[l.id] ?? l.note) !== l.note && <button type="button" className="small" onClick={() => put(l.id, { note: notes[l.id] })}>{t("Save note")}</button>}
          </div>
        </div>))}
    </>
  );
}

/** Opens every menu page in a hidden frame and reports pages that crash or show "Page not found". */
export function PageCheck() {
  const pages = [...SECTIONS.flatMap((s) => s.items), ...TEMPLATE_PAGES, ...ACCOUNT_PAGES].filter((i) => i.scope === "global" && !i.path.includes(":"));
  const [results, setResults] = useState<Record<string, "ok" | "error" | "notfound" | "running">>({});
  const [running, setRunning] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const run = async () => {
    setRunning(true); setResults({});
    for (const p of pages) {
      setResults((r) => ({ ...r, [p.key]: "running" }));
      const result = await new Promise<"ok" | "error" | "notfound">((resolve) => {
        const f = frame.current!; let tries = 0;
        f.src = `/?check=${Date.now()}#${p.path}`;
        const look = () => {
          const doc = f.contentDocument;
          const screen = doc?.querySelector(".error-screen h1")?.textContent ?? "";
          const loaded = doc?.querySelector("main, .main, .page-head, h1") && !doc.querySelector(".center.muted");
          if (screen) return resolve(/not found/i.test(screen) ? "notfound" : "error");
          if (loaded && tries > 3) return resolve("ok");
          if (++tries > 40) return resolve("error");
          setTimeout(look, 250);
        };
        f.onload = () => setTimeout(look, 300);
      });
      setResults((r) => ({ ...r, [p.key]: result }));
    }
    setRunning(false);
  };
  const done = Object.values(results).filter((v) => v !== "running");
  const bad = pages.filter((p) => results[p.key] === "error" || results[p.key] === "notfound");
  return (
    <>
      <p className="small muted">{t("Opens every page in the menu, one after another, and lists any that crash or show “Page not found”. It takes a minute or two; page crashes are also sent as error alerts.")}</p>
      <div className="row" style={{ gap: 10, marginBottom: 10 }}>
        <button type="button" className="primary" disabled={running} onClick={run}>{t(running ? "Checking…" : "Check all pages")}</button>
        {done.length > 0 && <span className="small">{done.length}/{pages.length} {t("checked")} · {bad.length ? <span style={{ color: "var(--danger)" }}>{bad.length} {t("with problems")}</span> : <span style={{ color: "var(--ok)" }}>✓ {t("no problems")}</span>}</span>}
      </div>
      <iframe ref={frame} title={t("Page check")} className="adm-check-frame" aria-hidden="true" tabIndex={-1} />
      <div className="adm-pages">{pages.map((p) => {
        const r = results[p.key];
        return <a key={p.key} href={`#${p.path}`} className="small" style={{ color: r === "error" || r === "notfound" ? "var(--danger)" : undefined }}>
          {r === "ok" ? "✓" : r === "running" ? "…" : r === "notfound" ? "✗ 404" : r === "error" ? "✗" : "·"} {t(p.label)}</a>;
      })}</div>
    </>
  );
}
