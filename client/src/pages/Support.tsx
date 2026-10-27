import { useCallback, useEffect, useState } from "react";
import { useSession } from "../App";
import { api, fmtDate } from "../lib/api";

// Help & support: send an idea, problem or question (optionally with a screenshot) and see the replies.

export interface Ticket { id: string; kind: string; message: string; page: string; status: string; reply: string; repliedAt: string | null; createdAt: string; hasScreenshot: boolean }

/** Read an image file and shrink it so large screenshots stay well under the upload limit. */
export async function imageToDataUrl(file: Blob, max = 1600): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error("Not an image.")); i.src = url; });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

export function SupportForm({ route, onSent }: { route: string; onSent?: () => void }) {
  const { toast } = useSession();
  const [kind, setKind] = useState("Question"); const [msg, setMsg] = useState(""); const [shot, setShot] = useState(""); const [sent, setSent] = useState(false);
  const attach = async (f?: Blob | null) => { if (!f) return; try { setShot(await imageToDataUrl(f)); } catch (e) { toast((e as Error).message, "error"); } };
  if (sent) return <p className="small" style={{ color: "var(--ok)" }}>Thanks — your message was sent. Replies appear under <a href="#/support">Help & support</a>. <button className="linklike" onClick={() => { setSent(false); setMsg(""); setShot(""); }}>Send more</button></p>;
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      try { await api("/feedback", { body: { kind, message: msg, page: route, ...(shot ? { screenshot: shot } : {}) } }); setSent(true); onSent?.(); }
      catch (err) { toast((err as Error).message, "error"); }
    }} onPaste={(e) => { const f = [...e.clipboardData.files].find((x) => x.type.startsWith("image/")); if (f) { e.preventDefault(); attach(f); } }}>
      <div className="seg" style={{ marginBottom: 6 }}>{["Question", "Problem", "Idea"].map((k) => <button type="button" key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{k}</button>)}</div>
      <textarea required minLength={5} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="What do you need help with, what went wrong, or what would make the portal better?" style={{ minHeight: 70 }} />
      <div className="row" style={{ marginTop: 6, flexWrap: "wrap" }}>
        <label className="small linklike" style={{ margin: 0, cursor: "pointer" }}>📎 {shot ? "Replace screenshot" : "Attach screenshot"}<input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => attach(e.target.files?.[0])} /></label>
        {shot && <><img src={shot} alt="Screenshot to send" style={{ height: 40, borderRadius: 4, border: "1px solid var(--border)" }} /><button type="button" className="ghost small" onClick={() => setShot("")}>Remove</button></>}
        <span className="tiny muted">or paste an image</span>
      </div>
      <button className="small primary" style={{ marginTop: 6 }}>Send</button>
    </form>
  );
}

export default function Support() {
  const [rows, setRows] = useState<Ticket[] | null>(null);
  const [view, setView] = useState<string | null>(null);
  const load = useCallback(() => api<{ feedback: Ticket[] }>("/feedback/mine").then((r) => setRows(r.feedback)), []);
  useEffect(() => { load(); }, [load]);
  return (
    <>
      <div className="page-head"><h1>Help & support</h1><p className="muted">Ask a question, report a problem or suggest an idea. Attach a screenshot if it helps. Administrators reply here and you get a notification.</p></div>
      <div className="grid g2">
        <div className="card"><b>New request</b><div style={{ marginTop: 8 }}><SupportForm route="/support" onSent={load} /></div></div>
        <div className="card"><b>Before you ask</b><ul className="small">
          <li><a href="#/learn">Learn</a> — courses and practice questions</li>
          <li><a href="#/learn/guides">Best-practice guides</a></li>
          <li><a href="#/wizard">Setup wizard</a> — which documents to start with</li>
          <li><a href="#/knowledge/iso19650/library/3">Glossary & acronyms</a></li>
        </ul></div>
      </div>
      <h2 className="section-title">My requests</h2>
      {!rows ? <p className="muted">Loading…</p> : !rows.length ? <div className="card muted">No requests yet.</div> : (
        <div className="card table-wrap"><table className="data"><tbody>{rows.map((t) => (
          <tr key={t.id}>
            <td className="small nowrap muted">{fmtDate(t.createdAt)}</td>
            <td><span className="chip">{t.kind}</span></td>
            <td>{t.message}
              {t.hasScreenshot && <div><button className="linklike small" onClick={() => setView(view === t.id ? null : t.id)}>🖼 {view === t.id ? "Hide" : "Show"} screenshot</button>{view === t.id && <img src={`/api/feedback/${t.id}/screenshot`} alt="Attached screenshot" style={{ display: "block", maxWidth: "100%", marginTop: 6, borderRadius: 6 }} />}</div>}
              {t.reply && <div className="guidance" style={{ marginTop: 6 }}><b>Reply</b>{t.repliedAt && <span className="tiny muted"> · {fmtDate(t.repliedAt)}</span>}<div className="small" style={{ whiteSpace: "pre-wrap" }}>{t.reply}</div></div>}
            </td>
            <td className="small nowrap">{t.status}</td>
          </tr>
        ))}</tbody></table></div>
      )}
    </>
  );
}
