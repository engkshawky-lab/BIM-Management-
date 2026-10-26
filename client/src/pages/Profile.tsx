import { t } from "../i18n";
import { useEffect, useState, type FormEvent } from "react";
import { initials, useSession } from "../App";
import { api, fmtDate, type Project, type User } from "../lib/api";

export default function ProfilePage() {
  const { user, setUser, toast } = useSession();
  const [f, setF] = useState({ name: user.name, organization: user.organization, jobTitle: user.jobTitle, phone: user.phone, bio: user.bio ?? "" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => { api<{ projects: Project[] }>("/projects").then((r) => setProjects(r.projects)); }, []);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try { const r = await api<{ user: User }>("/profile", { method: "PUT", body: f }); setUser(r.user); toast("Profile saved"); }
    catch (err) { toast((err as Error).message, "error"); }
  };
  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast("New passwords do not match", "error");
    try { await api("/profile/password", { method: "PUT", body: { current: pw.current, next: pw.next } }); setPw({ current: "", next: "", confirm: "" }); toast("Password changed"); }
    catch (err) { toast((err as Error).message, "error"); }
  };

  return (
    <>
      <div className="row" style={{ gap: 16, marginBottom: 16 }}>
        <span className="avatar lg">{initials(user.name)}</span>
        <div>
          <h1>{user.name}</h1>
          <div className="muted">{[user.jobTitle, user.organization].filter(Boolean).join(" · ") || "Add your job title and organization below"}</div>
          <div className="small muted">{user.email} · member since {fmtDate(user.createdAt)}{user.role === "admin" && " · platform admin"}</div>
        </div>
      </div>
      <div className="grid g2">
        <form className="card" onSubmit={save}>
          <h3 style={{ marginTop: 0 }}>Profile details</h3>
          <label>{t("Full name")}</label><input required minLength={2} value={f.name} onChange={set("name")} />
          <label>{t("Organization")}</label><input value={f.organization} onChange={set("organization")} />
          <label>{t("Job title")}</label><input value={f.jobTitle} onChange={set("jobTitle")} />
          <label>{t("Phone")}</label><input value={f.phone} onChange={set("phone")} />
          <label>{t("About / expertise")}</label><textarea value={f.bio} onChange={set("bio")} placeholder="e.g. ISO 19650 Practitioner, 10 years BIM coordination" />
          <button className="primary" style={{ marginTop: 12 }}>{t("Save profile")}</button>
        </form>
        <div className="grid" style={{ alignContent: "start" }}>
          <form className="card" onSubmit={changePw}>
            <h3 style={{ marginTop: 0 }}>{t("Change password")}</h3>
            <label>{t("Current password")}</label><input type="password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
            <label>{t("New password")}</label><input type="password" required minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
            <label>{t("Confirm new password")}</label><input type="password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
            <button style={{ marginTop: 12 }}>{t("Change password")}</button>
          </form>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>{t("Email & language")}</h3>
            <label>{t("Email notifications")}</label>
            <select value={user.emailPref ?? "instant"} onChange={async (e) => { const r = await api<{ user: User }>("/profile", { method: "PUT", body: { emailPref: e.target.value } }); setUser(r.user); toast("Email preference saved"); }}>
              <option value="instant">Instant — one email per notification</option><option value="digest">Daily digest</option><option value="off">Off (in-app only)</option>
            </select>
            <label>{t("Language")}</label>
            <select value={user.locale ?? "en"} onChange={async (e) => { const r = await api<{ user: User }>("/profile", { method: "PUT", body: { locale: e.target.value } }); setUser(r.user); }}>
              <option value="en">English</option><option value="ar">العربية (Arabic)</option>
            </select>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>{t("My projects")}</h3>
            {projects.length === 0 && <p className="muted">You are not in any project yet.</p>}
            {projects.map((p) => (
              <a key={p.id} href={`#/projects/${p.id}`} className="list-item"><span><b>{p.code}</b> {p.name}</span><span className="badge">{p.role}</span></a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
