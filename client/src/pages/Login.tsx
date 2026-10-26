import { useState, type FormEvent } from "react";
import { api, type User } from "../lib/api";

export default function Login({ onSignedIn }: { onSignedIn: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", email: "", password: "", organization: "", jobTitle: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const body = mode === "login" ? { email: f.email, password: f.password } : f;
      const r = await api<{ user: User }>(`/auth/${mode}`, { body });
      onSignedIn(r.user);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <h1>ISO Information Portal</h1>
        <p className="muted">ISO 19650 information management · ISO/IEC 42001 AI management</p>
        <div className="tabs">
          <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>Sign in</button>
          <button type="button" className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>Create account</button>
        </div>
        {mode === "register" && <>
          <label>Full name</label><input required value={f.name} onChange={set("name")} autoComplete="name" />
          <label>Organization</label><input value={f.organization} onChange={set("organization")} />
          <label>Job title</label><input value={f.jobTitle} onChange={set("jobTitle")} placeholder="e.g. Information Manager" />
        </>}
        <label>Email</label><input required type="email" value={f.email} onChange={set("email")} autoComplete="email" />
        <label>Password</label><input required type="password" minLength={mode === "register" ? 8 : undefined} value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        {mode === "register" && <p className="small muted">At least 8 characters. If someone invited you to a project, use the same email and you'll join it automatically.</p>}
        {error && <p className="error">{error}</p>}
        <button className="primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
    </div>
  );
}
