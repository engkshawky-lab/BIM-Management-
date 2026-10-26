import { useState, type FormEvent } from "react";
import { api, type User } from "../lib/api";
import { getLocale, setLocale, t } from "../i18n";
import { applyDomLocale } from "../i18nDom";

/** Language toggle before sign-in (remembered in this browser). */
function LangSwitch({ onChange }: { onChange: () => void }) {
  const set = (l: "en" | "ar") => { try { localStorage.setItem("bim:locale", l); } catch { /* storage unavailable */ } setLocale(l); applyDomLocale(l); onChange(); };
  return <div className="seg"><button type="button" className={getLocale() === "en" ? "on" : ""} onClick={() => set("en")}>EN</button><button type="button" className={getLocale() === "ar" ? "on" : ""} onClick={() => set("ar")}>عربي</button></div>;
}

/** Set a new password from a one-time reset link (#/reset/<token>). */
export function ResetPassword({ token }: { token: string }) {
  const [pw, setPw] = useState(""); const [done, setDone] = useState(false); const [error, setError] = useState("");
  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={async (e) => { e.preventDefault(); setError(""); try { await api("/auth/reset", { body: { token, password: pw } }); setDone(true); } catch (err) { setError((err as Error).message); } }}>
        <h1>Set a new password</h1>
        {done ? <><p>Your password has been changed. Sign in with the new password.</p><a className="btn primary" href="#/">Sign in</a></> : <>
          <label>New password</label><input required type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          {error && <p className="error">{error}</p>}
          <button className="primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>Change password</button></>}
      </form>
    </div>
  );
}

export default function Login({ onSignedIn }: { onSignedIn: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [, setLang] = useState(0);
  const [sent, setSent] = useState("");
  const [f, setF] = useState({ name: "", email: "", password: "", organization: "", jobTitle: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if (mode === "forgot") { const r = await api<{ message: string }>("/auth/forgot", { body: { email: f.email } }); setSent(r.message); return; }
      const body = mode === "login" ? { email: f.email, password: f.password } : { ...f, locale: getLocale() };
      const r = await api<{ user: User }>(`/auth/${mode}`, { body });
      onSignedIn(r.user);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <div className="row spread"><h1 style={{ margin: 0 }}>ISO Information Portal</h1><LangSwitch onChange={() => setLang((n) => n + 1)} /></div>
        <p className="muted">{t("ISO 19650 information management · ISO/IEC 42001 AI management")}</p>
        <div className="tabs">
          <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>{t("Sign in")}</button>
          <button type="button" className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>{t("Create account")}</button>
        </div>
        {mode === "register" && <>
          <label>{t("Full name")}</label><input required value={f.name} onChange={set("name")} autoComplete="name" />
          <label>{t("Organization")}</label><input value={f.organization} onChange={set("organization")} />
          <label>{t("Job title")}</label><input value={f.jobTitle} onChange={set("jobTitle")} placeholder="e.g. Information Manager" />
        </>}
        <label>{t("Email")}</label><input required type="email" value={f.email} onChange={set("email")} autoComplete="email" />
        {mode !== "forgot" && <label>{t("Password")}</label>}{mode !== "forgot" && <input required type="password" minLength={mode === "register" ? 8 : undefined} value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} />}
        {mode === "login" && <button type="button" className="linklike small" style={{ marginTop: 6 }} onClick={() => { setMode("forgot"); setError(""); setSent(""); }}>{t("Forgot password?")}</button>}
        {mode === "forgot" && <p className="small muted">Enter your account email. A one-time reset link (valid 1 hour) is issued to your portal administrator, who can also send it from the admin console.</p>}
        {sent && <p className="small" style={{ color: "var(--ok)" }}>{sent}</p>}
        {mode === "register" && <p className="small muted">At least 8 characters. If someone invited you to a project, use the same email and you'll join it automatically.</p>}
        {error && <p className="error">{error}</p>}
        <button className="primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={busy}>{t(busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "forgot" ? "Request reset link" : "Create account")}</button>
        {mode === "forgot" && <button type="button" className="linklike small" style={{ marginTop: 8 }} onClick={() => setMode("login")}>{t("← Back to sign in")}</button>}
      </form>
    </div>
  );
}
