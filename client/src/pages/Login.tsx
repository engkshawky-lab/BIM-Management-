import { ThemeToggle } from "../components/ThemeToggle";
import { useState, type FormEvent } from "react";
import { api, type User } from "../lib/api";
import { getLocale, setLocale, t } from "../i18n";
import { applyDomLocale } from "../i18nDom";
import { LegalFooter } from "./Legal";
import { Announcement, useSite } from "../lib/site";

/** Language toggle before sign-in (remembered in this browser). */
export function LangSwitch({ onChange }: { onChange: () => void }) {
  const set = (l: "en" | "ar") => { try { localStorage.setItem("bim:locale", l); } catch { /* storage unavailable */ } setLocale(l); applyDomLocale(l); onChange(); };
  return <div className="seg"><button type="button" className={getLocale() === "en" ? "on" : ""} onClick={() => set("en")}>EN</button><button type="button" className={getLocale() === "ar" ? "on" : ""} onClick={() => set("ar")}>عربي</button></div>;
}

/** Set a new password from a one-time reset link (#/reset/<token>). */
export function ResetPassword({ token }: { token: string }) {
  const [pw, setPw] = useState(""); const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (pw !== confirm) { setError(t("New passwords do not match")); return; }
    setBusy(true);
    try { await api("/auth/reset", { body: { token, password: pw } }); setPw(""); setConfirm(""); setDone(true); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <h1>{t("Set a new password")}</h1>
        {done ? <><p>{t("Your password has been changed. Sign in with the new password.")}</p><a className="btn primary" href="#/login">{t("Sign in")}</a></> : <>
          <label htmlFor="login-new-password">{t("New password")}</label><PasswordInput id="login-new-password" minLength={8} value={pw} onChange={setPw} autoComplete="new-password" disabled={busy} />
          <label htmlFor="login-confirm-new-password">{t("Confirm new password")}</label><PasswordInput id="login-confirm-new-password" minLength={8} value={confirm} onChange={setConfirm} autoComplete="new-password" describedBy={error ? "reset-password-error" : undefined} disabled={busy} />
          {error && <p id="reset-password-error" className="error" role="alert">{error}</p>}
          <button className="primary" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>{t(busy ? "Please wait…" : "Change password")}</button></>}
      </form>
    </div>
  );
}

/** Password field with a Show / Hide button: on phones a mistyped password is the usual reason sign-in fails. */
function PasswordInput({ id, value, onChange, autoComplete, minLength, disabled, describedBy }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; minLength?: number; disabled?: boolean; describedBy?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-field">
      <input id={id} required type={show ? "text" : "password"} minLength={minLength} maxLength={200} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete}
        autoCapitalize="none" autoCorrect="off" spellCheck={false} disabled={disabled} aria-describedby={describedBy} />
      <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-pressed={show} aria-controls={id}>{show ? t("Hide") : t("Show")}</button>
    </div>
  );
}

export default function Login({ onSignedIn, initialMode = "login" }: { onSignedIn: (u: User) => void; initialMode?: "login" | "register" }) {
  const { site } = useSite();
  const [mode, setModeRaw] = useState<"login" | "register" | "forgot">(initialMode === "register" && !site.allowSignups ? "login" : initialMode);
  const [failed, setFailed] = useState(0);
  const [, setLang] = useState(0);
  const [sent, setSent] = useState("");
  const [f, setF] = useState({ name: "", email: "", password: "", organization: "", jobTitle: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // switching between sign in, create account and reset starts with no old messages on screen
  const setMode = (m: typeof mode) => { setModeRaw(m); setError(""); setSent(""); };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setSent(""); setBusy(true);
    try {
      if (mode === "forgot") { const r = await api<{ message: string }>("/auth/forgot", { body: { email: f.email } }); setSent(r.message); return; }
      const body = mode === "login" ? { email: f.email.trim(), password: f.password } : { ...f, email: f.email.trim(), locale: getLocale() };
      const r = await api<{ user?: User; pending?: boolean; message?: string }>(`/auth/${mode}`, { body });
      if (r.pending) { setModeRaw("login"); setSent(r.message ?? ""); return; }
      onSignedIn(r.user!);
    } catch (err) { setError((err as Error).message); if (mode === "login") setFailed((n) => n + 1); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <Announcement />
      {site.maintenanceMode && <p className="banner info">{t("The portal is under maintenance. Only administrators can sign in for now.")}</p>}
      <a className="small auth-back" href="#/">{t("← Back to the home page")}</a>
      <form className="card auth" onSubmit={submit}>
        <div className="row spread"><h1 style={{ margin: 0 }}>{site.siteName}</h1><ThemeToggle /><LangSwitch onChange={() => setLang((n) => n + 1)} /></div>
        <p className="muted">{t("ISO 19650 information management · ISO/IEC 42001 AI management")}</p>
        <div className="tabs">
          <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>{t("Sign in")}</button>
          {site.allowSignups && <button type="button" className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>{t("Create account")}</button>}
        </div>
        {mode === "register" && <>
          <label htmlFor="login-full-name">{t("Full name")}</label><input id="login-full-name" required value={f.name} onChange={set("name")} autoComplete="name" />
          <label htmlFor="login-organization">{t("Organization")}</label><input id="login-organization" value={f.organization} onChange={set("organization")} />
          <label htmlFor="login-job-title">{t("Job title")}</label><input id="login-job-title" value={f.jobTitle} onChange={set("jobTitle")} placeholder="e.g. Information Manager" />
        </>}
        {!site.allowSignups && mode === "login" && <p className="small muted">{t("New sign-ups are closed. If you were invited to a project, sign in with the invited email or ask the project manager.")}</p>}
        <label htmlFor="login-email">{t("Email")}</label><input id="login-email" required type="email" value={f.email} onChange={set("email")} autoComplete="email" />
        {mode !== "forgot" && <label htmlFor="login-password">{t("Password")}</label>}{mode !== "forgot" && <PasswordInput id="login-password" minLength={mode === "register" ? 8 : undefined} value={f.password} onChange={(v) => setF({ ...f, password: v })} autoComplete={mode === "login" ? "current-password" : "new-password"} />}
        {mode === "login" && <button type="button" className="linklike small" style={{ marginTop: 6 }} onClick={() => setMode("forgot")}>{t("Forgot password?")}</button>}
        {mode === "forgot" && <p className="small muted">{t("Enter the email you signed up with. We'll send a one-time link to choose a new password (valid 1 hour). If it doesn't arrive within a few minutes, check your spam folder or ask your portal administrator for a reset link.")}</p>}
        {sent && <p className="small" style={{ color: "var(--ok)" }}>{sent}</p>}
        {mode === "register" && <p className="small muted">At least 8 characters. If someone invited you to a project, use the same email and you'll join it automatically.</p>}
        {mode === "register" && <p className="small muted">By creating an account you agree to the <a href="#/legal/terms">Terms of Service</a> and the <a href="#/legal/privacy">Privacy Policy</a>.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {error && mode === "login" && failed > 0 && <div className="auth-help small">
          <p style={{ margin: "0 0 6px" }}>{t("Check that this is the email you signed up with, and tap Show to check the password. Passwords are case-sensitive.")}</p>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="small" onClick={() => setMode("forgot")}>{t("Reset my password")}</button>
            {site.allowSignups && <button type="button" className="small ghost" onClick={() => setMode("register")}>{t("I don't have an account")}</button>}
          </div>
        </div>}
        <button className="primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={busy}>{t(busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "forgot" ? "Request reset link" : "Create account")}</button>
        {mode === "forgot" && <button type="button" className="linklike small" style={{ marginTop: 8 }} onClick={() => setMode("login")}>{t("← Back to sign in")}</button>}
      </form>
      <LegalFooter />
    </div>
  );
}
