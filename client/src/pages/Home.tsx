import { useEffect, useState } from "react";
import { useSession } from "../App";
import { StdBadge } from "../components/common";
import { api, type Notification, type Project } from "../lib/api";

export default function Home() {
  const { user } = useSession();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [notes, setNotes] = useState<Notification[]>([]);
  useEffect(() => {
    api<{ projects: Project[] }>("/projects").then((r) => setProjects(r.projects));
    api<{ notifications: Notification[] }>("/notifications").then((r) => setNotes(r.notifications.filter((n) => !n.read).slice(0, 6)));
  }, []);

  return (
    <>
      <div className="row spread">
        <div><h1>Welcome, {user.name.split(" ")[0]}</h1><p className="muted">Your projects, documents and tasks across ISO 19650 and ISO/IEC 42001.</p></div>
        <a className="btn primary" href="#/projects/new">+ New project</a>
      </div>

      {notes.length > 0 && (
        <div className="card" style={{ margin: "12px 0" }}>
          <b>Needs your attention</b>
          {notes.map((n) => <a key={n.id} href={"#" + n.link} className="list-item"><span>{n.message}</span><span className="small muted">{new Date(n.createdAt).toLocaleDateString()}</span></a>)}
        </div>
      )}

      <h2>My projects</h2>
      {projects === null ? <p className="muted">Loading…</p> : projects.length === 0 ? (
        <div className="card empty">
          <h3>Create your first project</h3>
          <p className="muted">A project holds your CDE folders and files, controlled documents, delivery workflow and team.</p>
          <a className="btn primary" href="#/projects/new">+ New project</a>
        </div>
      ) : (
        <div className="grid g3">
          {projects.map((p) => (
            <a key={p.id} href={`#/projects/${p.id}`} className="card project-card">
              <div className="row spread"><span className="badge">{p.code}</span><span className="small muted">{p.role}</span></div>
              <h3>{p.name}</h3>
              <p className="small muted">{p.appointingParty || "—"}{p.stage && ` · ${p.stage}`}</p>
              <div className="row">{p.standards.map((s) => <StdBadge key={s} std={s} />)}</div>
              <div className="row small muted" style={{ marginTop: 8 }}>📄 {p.documents} documents · 📁 {p.files} files · 👥 {p.members} members</div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
