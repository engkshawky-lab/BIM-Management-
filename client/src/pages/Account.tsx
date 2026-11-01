import { useEffect, useState } from "react";
import { t } from "../i18n";
import { api, type User } from "../lib/api";
import { useDialog } from "../components/Dialog";
import { LegalFooter } from "./Legal";

// Account self-service: confirming the email address after sign-up, downloading one's data and deleting the account.

/** Shown instead of the portal until a new account confirms its email address. */
export function VerifyEmail({ user, onSignOut, onVerified }: { user: User; onSignOut: () => void; onVerified: () => void }) {
  const [msg, setMsg] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  // re-check when the user comes back to this tab after opening the link elsewhere
  useEffect(() => { const on = () => { if (!document.hidden) onVerified(); }; document.addEventListener("visibilitychange", on); return () => document.removeEventListener("visibilitychange", on); }, [onVerified]);
  const resend = async () => {
    setBusy(true); setError(""); setMsg("");
    try { const r = await api<{ message: string }>("/auth/verify/resend", { body: {} }); setMsg(r.message); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="auth-wrap">
      <div className="card auth">
        <h1>{t("Confirm your email address")}</h1>
        <p>{t("We've sent a confirmation link to")} <b>{user.email}</b>. {t("Open it to start using your account. The link expires in 48 hours.")}</p>
        <p className="small muted">{t("No email? Check your spam folder, or send a new link.")}</p>
        {msg && <p className="small" style={{ color: "var(--ok)" }}>{msg}</p>}
        {error && <p className="error">{error}</p>}
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <button type="button" className="primary" disabled={busy} onClick={resend}>{t(busy ? "Please wait…" : "Send a new link")}</button>
          <button type="button" onClick={onVerified}>{t("I've confirmed it")}</button>
          <button type="button" className="linklike" onClick={onSignOut}>{t("Sign out")}</button>
        </div>
      </div>
      <LegalFooter />
    </div>
  );
}

/** Opened from the link in the email (#/verify/<token>). */
export function VerifyLink({ token, onDone }: { token: string; onDone: () => void }) {
  const [state, setState] = useState<"busy" | "ok" | string>("busy");
  useEffect(() => { api("/auth/verify", { body: { token } }).then(() => setState("ok")).catch((e) => setState((e as Error).message)); }, [token]);
  return (
    <div className="auth-wrap">
      <div className="card auth" role="status">
        <h1>{t(state === "ok" ? "Email confirmed" : state === "busy" ? "Confirming…" : "Link not valid")}</h1>
        {state === "ok" && <p>{t("Thank you. Your account is ready to use.")}</p>}
        {state !== "ok" && state !== "busy" && <p className="error">{state}</p>}
        {state !== "busy" && <button type="button" className="primary" onClick={onDone}>{t("Continue to the portal")}</button>}
      </div>
    </div>
  );
}

interface Preview { deleted: string[]; handedOver: string[]; paidPlan: boolean }

/** Profile card: download my data, delete my account. */
export function MyData({ user, onDeleted, toast }: { user: User; onDeleted: () => void; toast: (m: string, k?: "ok" | "error") => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{t("Your data")}</h3>
      <p className="small muted">{t("Download a copy of everything the portal holds about you: your profile, plan, project memberships, notifications, messages and the items you created.")}</p>
      <a className="btn" href="/api/profile/export" download>{t("Download my data")}</a>
      <hr />
      <p className="small muted">{t("Deleting your account erases your personal details and signs you out everywhere. It can't be undone.")}</p>
      <button type="button" className="danger" onClick={() => setOpen(true)}>{t("Delete my account…")}</button>
      {open && <DeleteDialog onClose={() => setOpen(false)} onDeleted={onDeleted} toast={toast} />}
    </div>
  );
}

function DeleteDialog({ onClose, onDeleted, toast }: { onClose: () => void; onDeleted: () => void; toast: (m: string, k?: "ok" | "error") => void }) {
  const dlg = useDialog(onClose);
  const [p, setP] = useState<Preview | null>(null);
  const [pw, setPw] = useState(""); const [confirm, setConfirm] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { api<Preview>("/profile/delete-preview").then(setP).catch((e) => setError((e as Error).message)); }, []);
  const go = async () => {
    setBusy(true); setError("");
    try { await api("/profile", { method: "DELETE", body: { password: pw, confirm } }); toast(t("Your account has been deleted.")); onDeleted(); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  };
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" ref={dlg} role="dialog" aria-modal="true" aria-labelledby="del-title">
        <h2 id="del-title" style={{ marginTop: 0 }}>{t("Delete your account")}</h2>
        <ul className="small">
          <li>{t("Your name, email, profile, talent profile, notifications, messages to support and learning progress are erased.")}</li>
          <li>{t("Work you shared in projects (comments, issues, documents, files) stays with the project team and shows as “Deleted user”.")}</li>
          {p && p.deleted.length > 0 && <li><b>{t("These projects have no other members and will be deleted:")}</b> {p.deleted.join(", ")}</li>}
          {p && p.handedOver.length > 0 && <li><b>{t("You own these shared projects; ownership passes to another member (a manager first):")}</b> {p.handedOver.join(", ")}</li>}
          {p?.paidPlan && <li><b>{t("Your paid plan ends now and online payments stop. Unused time is not refunded automatically.")}</b></li>}
        </ul>
        <label htmlFor="del-pw">{t("Your password")}</label>
        <input id="del-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} data-autofocus />
        <label htmlFor="del-confirm">{t("Type DELETE to confirm")}</label>
        <input id="del-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        {error && <p className="error">{error}</p>}
        <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose}>{t("Cancel")}</button>
          <button type="button" className="danger" disabled={busy || !pw || confirm !== "DELETE"} onClick={go}>{t(busy ? "Please wait…" : "Delete my account")}</button>
        </div>
      </div>
    </div>
  );
}
