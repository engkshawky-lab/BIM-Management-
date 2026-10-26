import { useEffect, useState } from "react";
import { useSession } from "../App";
import type { Plan } from "../../../shared/plans";
import { api, fmtDate } from "../lib/api";

interface B { enabled: boolean; plan: Plan & { status: string; renewsAt: string | null; source: string }; usage: { projects: number; storageBytes: number; aiThisMonth: number }; plans: Plan[] }
const gb = (b: number) => (b / 1024 ** 3).toFixed(b < 1024 ** 3 ? 2 : 1);
const unlimited = (n: number) => n >= 100000;

function Meter({ label, used, max, unit = "" }: { label: string; used: number; max: number; unit?: string }) {
  const pct = unlimited(max) ? 0 : Math.min(100, (used / max) * 100);
  return <div className="bar-row"><span className="small">{label}</span><span className="bar"><span style={{ width: `${pct}%`, background: pct >= 90 ? "var(--danger)" : undefined }} /></span><b className="small nowrap">{used}{unit} / {unlimited(max) ? "∞" : `${max}${unit}`}</b></div>;
}

export default function Billing() {
  const { toast } = useSession();
  const [b, setB] = useState<B | null>(null);
  const [code, setCode] = useState("");
  const load = () => api<B>("/billing").then(setB);
  useEffect(() => { load(); }, []);
  if (!b) return <p className="muted">Loading…</p>;
  return (
    <>
      <div className="page-head"><h1>Plan & billing</h1>{!b.enabled && <p className="muted">Plan limits are switched off on this installation — everything is available without limits. Usage is still shown for information.</p>}</div>
      <div className="grid g2">
        <div className="card">
          <div className="row spread"><h3 style={{ margin: 0 }}>{b.plan.name} plan</h3><span className="chip">{b.plan.status}</span></div>
          <p className="small muted">{b.plan.renewsAt ? `Valid until ${fmtDate(b.plan.renewsAt)}` : b.plan.id === "free" ? "No end date" : "No end date"}{b.plan.source && ` · ${b.plan.source}`}</p>
          <Meter label="Projects you own" used={b.usage.projects} max={b.plan.projects} />
          <Meter label="Storage (GB)" used={+gb(b.usage.storageBytes)} max={b.plan.storageGb} />
          <Meter label="AI requests this month" used={b.usage.aiThisMonth} max={b.plan.aiPerMonth} />
          <p className="tiny muted">Team members per project: up to {unlimited(b.plan.members) ? "unlimited" : b.plan.members}.</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Redeem a code</h3>
          <form className="row" onSubmit={async (e) => { e.preventDefault(); try { await api("/billing/redeem", { body: { code } }); toast("Code redeemed — plan updated"); setCode(""); load(); } catch (err) { toast((err as Error).message, "error"); } }}>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. BIM-1A2B3C4D" style={{ maxWidth: 240 }} className="mono" /><button className="primary" disabled={code.length < 3}>Redeem</button></form>
          <p className="small muted">To upgrade, contact your portal administrator — they can assign a plan or issue a code.</p>
        </div>
      </div>
      <div className="grid g3" style={{ marginTop: 14 }}>{b.plans.map((p) => (
        <div key={p.id} className="card" style={p.id === b.plan.id ? { borderColor: "var(--accent)" } : undefined}>
          <div className="row spread"><h3 style={{ margin: 0 }}>{p.name}</h3>{p.id === b.plan.id && <span className="chip on">Current</span>}</div>
          <p className="small muted">{p.price}</p>
          <ul className="small">{p.features.map((f) => <li key={f}>{f}</li>)}
            <li>{unlimited(p.projects) ? "Unlimited" : p.projects} projects · {unlimited(p.members) ? "unlimited" : p.members} members each</li><li>{p.storageGb} GB storage · {unlimited(p.aiPerMonth) ? "unlimited" : p.aiPerMonth} AI requests / month</li></ul>
        </div>
      ))}</div>
    </>
  );
}

interface Code { code: string; plan: string; months: number; maxUses: number; uses: number; expiresAt: string | null }
export function PromoCodes() {
  const { toast } = useSession();
  const [rows, setRows] = useState<Code[] | null>(null);
  const [f, setF] = useState({ code: "", plan: "pro", months: 12, maxUses: 1, expiresAt: "" });
  const load = () => api<{ codes: Code[] }>("/admin/promo-codes").then((r) => setRows(r.codes));
  useEffect(() => { load(); }, []);
  return (
    <>
      <form className="card row" style={{ marginBottom: 12 }} onSubmit={async (e) => { e.preventDefault(); try { const r = await api<{ code: string }>("/admin/promo-codes", { body: { ...f, code: f.code || undefined } }); toast(`Code ${r.code} created`); load(); } catch (err) { toast((err as Error).message, "error"); } }}>
        <b>New code</b>
        <input className="mono" placeholder="Code (blank = random)" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} style={{ maxWidth: 200 }} />
        <select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })} style={{ width: "auto" }}><option value="pro">Professional</option><option value="enterprise">Enterprise</option></select>
        <label className="check">Months <input type="number" min={1} max={36} value={f.months} onChange={(e) => setF({ ...f, months: +e.target.value })} style={{ width: 70 }} /></label>
        <label className="check">Uses <input type="number" min={1} value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: +e.target.value })} style={{ width: 80 }} /></label>
        <label className="check">Expires <input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} style={{ width: "auto" }} /></label>
        <button className="primary">Create</button>
      </form>
      {rows && <div className="card"><table className="data"><thead><tr><th>Code</th><th>Plan</th><th>Months</th><th>Used</th><th>Expires</th><th /></tr></thead><tbody>
        {rows.map((c) => <tr key={c.code}><td className="mono">{c.code}</td><td>{c.plan}</td><td>{c.months}</td><td>{c.uses}/{c.maxUses}</td><td className="small">{c.expiresAt ? fmtDate(c.expiresAt) : "—"}</td><td><button className="ghost tiny danger" onClick={async () => { await api(`/admin/promo-codes/${c.code}`, { method: "DELETE" }); load(); }}>✕</button></td></tr>)}
        {!rows.length && <tr><td colSpan={6} className="muted">No codes yet.</td></tr>}
      </tbody></table></div>}
    </>
  );
}
