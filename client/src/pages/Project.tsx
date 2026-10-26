import { useCallback, useEffect, useState } from "react";
import { initials, navigate, useSession } from "../App";
import { StdBadge } from "../components/common";
import { api, canManage, fmtDate, type ActivityRow, type Invitation, type Member, type Project } from "../lib/api";
import DocumentEditor from "./DocumentEditor";
import Delivery from "./Delivery";
import Documents from "./Documents";
import Files from "./Files";
import { ProjectForm } from "./NewProject";
import ProjectWorkflow from "./ProjectWorkflow";
import Quality from "./Quality";
import Validation from "./Validation";
import Coordination from "./Coordination";

export interface ProjectData { project: Project; members: Member[]; invitations: Invitation[]; role: Project["role"] }

const TABS: [string, string][] = [["overview", "Overview"], ["documents", "Documents"], ["files", "Files (CDE)"], ["delivery", "Delivery plan"], ["validation", "Validation"], ["coordination", "Coordination"], ["quality", "Quality"], ["workflow", "Workflow"], ["team", "Team"], ["activity", "Activity"], ["settings", "Settings"]];

export default function ProjectPage({ projectId, tab, sub }: { projectId: string; tab: string; sub?: string }) {
  const [data, setData] = useState<ProjectData | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => api<ProjectData>(`/projects/${projectId}`).then(setData).catch((e) => setError(e.message)), [projectId]);
  // Refetch on navigation inside the project so team changes made elsewhere show up.
  useEffect(() => { reload(); }, [reload, tab, sub]);

  if (error) return <div className="card">{error} <a href="#/">Back to projects</a></div>;
  if (!data) return <p className="muted">Loading…</p>;
  const { project } = data;

  if (tab === "documents" && sub) return <DocumentEditor data={data} docId={sub} />;

  return (
    <>
      <div className="row spread">
        <div>
          <div className="row"><span className="badge">{project.code}</span>{project.standards.map((s) => <StdBadge key={s} std={s} />)}<span className="small muted">your role: {data.role}</span></div>
          <h1>{project.name}</h1>
          <p className="muted">{[project.appointingParty, project.location, project.stage].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <div className="tabs">{TABS.filter(([k]) => k !== "settings" || canManage(data.role)).map(([k, label]) => (
        <button key={k} className={tab === k ? "on" : ""} onClick={() => navigate(`/projects/${projectId}/${k}`)}>{label}</button>
      ))}</div>
      {tab === "overview" && <Overview data={data} />}
      {tab === "documents" && <Documents data={data} />}
      {tab === "files" && <Files data={data} />}
      {tab === "delivery" && <Delivery data={data} sub={sub} />}
      {tab === "validation" && <Validation data={data} sub={sub} />}
      {tab === "coordination" && <Coordination data={data} sub={sub} />}
      {tab === "quality" && <Quality data={data} />}
      {tab === "workflow" && <ProjectWorkflow data={data} />}
      {tab === "team" && <Team data={data} reload={reload} />}
      {tab === "activity" && <Activity projectId={projectId} />}
      {tab === "settings" && <Settings data={data} reload={reload} />}
    </>
  );
}

function Overview({ data }: { data: ProjectData }) {
  const { project, members } = data;
  return (
    <div className="grid g2">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>About</h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{project.description || <span className="muted">No description.</span>}</p>
        <table className="data"><tbody>
          <tr><th>Code</th><td>{project.code}</td></tr>
          <tr><th>Appointing party</th><td>{project.appointingParty || "—"}</td></tr>
          <tr><th>Location</th><td>{project.location || "—"}</td></tr>
          <tr><th>Stage</th><td>{project.stage || "—"}</td></tr>
          <tr><th>Created</th><td>{fmtDate(project.createdAt)}</td></tr>
        </tbody></table>
        <div className="row" style={{ marginTop: 12 }}>
          <a className="btn primary" href={`#/projects/${project.id}/documents`}>📄 Documents</a>
          <a className="btn" href={`#/projects/${project.id}/files`}>📁 Files</a>
          <a className="btn" href={`#/projects/${project.id}/delivery`}>📅 Delivery plan</a>
          <a className="btn" href={`#/projects/${project.id}/quality`}>✅ Quality</a>
          <a className="btn" href={`#/projects/${project.id}/workflow`}>🔀 Workflow</a>
        </div>
      </div>
      <div className="grid" style={{ alignContent: "start" }}>
        <div className="card">
          <div className="row spread"><h3 style={{ margin: 0 }}>Team ({members.length})</h3><a href={`#/projects/${project.id}/team`} className="small">Manage</a></div>
          {members.map((m) => <div key={m.userId} className="list-item"><span className="row"><span className="avatar">{initials(m.name)}</span>{m.name}<span className="small muted">{m.jobTitle}</span></span><span className="badge">{m.role}</span></div>)}
        </div>
        <div className="card"><h3 style={{ marginTop: 0 }}>Recent activity</h3><Activity projectId={project.id} limit={6} /></div>
      </div>
    </div>
  );
}

function Team({ data, reload }: { data: ProjectData; reload: () => void }) {
  const { toast, user } = useSession();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const pid = data.project.id;
  const manage = canManage(data.role);
  const act = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast(ok); reload(); } catch (e) { toast((e as Error).message, "error"); } };

  return (
    <>
      {manage && (
        <form className="card row" style={{ marginBottom: 12 }} onSubmit={(e) => { e.preventDefault(); act(async () => { const r = await api<{ invited?: boolean }>(`/projects/${pid}/members`, { body: { email, role } }); setEmail(""); if (r.invited) toast(`${email} has no account yet — they'll join automatically when they register with this email.`); }, "Team updated"); }}>
          <b>Add member</b>
          <input type="email" required placeholder="colleague@company.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ maxWidth: 280 }} />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "auto" }}><option value="viewer">Viewer — read & comment</option><option value="editor">Editor — create & edit</option><option value="manager">Manager — approve, publish, manage team</option></select>
          <button className="primary">Add</button>
        </form>
      )}
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Member</th><th>Organization</th><th>Role</th><th>Joined</th><th /></tr></thead>
          <tbody>
            {data.members.map((m) => (
              <tr key={m.userId}>
                <td><div className="row"><span className="avatar">{initials(m.name)}</span><div>{m.name}{m.userId === user.id && " (you)"}<div className="small muted">{m.email}</div></div></div></td>
                <td className="small">{m.organization}<div className="muted">{m.jobTitle}</div></td>
                <td>{manage && m.role !== "owner" ? (
                  <select value={m.role} style={{ width: "auto" }} onChange={(e) => act(() => api(`/projects/${pid}/members/${m.userId}`, { method: "PUT", body: { role: e.target.value } }), "Role updated")}>
                    <option>viewer</option><option>editor</option><option>manager</option>
                  </select>) : <span className="badge">{m.role}</span>}</td>
                <td className="small muted">{fmtDate(m.joinedAt)}</td>
                <td>{m.role !== "owner" && (manage || m.userId === user.id) && (
                  <button className="ghost danger" onClick={() => confirm(m.userId === user.id ? "Leave this project?" : `Remove ${m.name}?`) &&
                    act(() => api(`/projects/${pid}/members/${m.userId}`, { method: "DELETE" }).then(() => m.userId === user.id && navigate("/")), "Member removed")}>
                    {m.userId === user.id ? "Leave" : "Remove"}</button>)}</td>
              </tr>
            ))}
            {data.invitations.map((i) => (
              <tr key={i.id} className="muted">
                <td>{i.email}<div className="small">invited — waiting for registration</div></td><td /><td><span className="badge">{i.role}</span></td><td className="small">{fmtDate(i.createdAt)}</td>
                <td>{manage && <button className="ghost danger" onClick={() => act(() => api(`/projects/${pid}/invitations/${i.id}`, { method: "DELETE" }), "Invitation cancelled")}>Cancel</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>Viewers can read and comment. Editors create and edit documents and files and request reviews. Managers approve for sharing, authorize and publish, approve workflow gates and manage the team.</p>
    </>
  );
}

export function Activity({ projectId, limit }: { projectId: string; limit?: number }) {
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  useEffect(() => { api<{ activity: ActivityRow[] }>(`/projects/${projectId}/activity`).then((r) => setRows(r.activity)); }, [projectId]);
  if (!rows) return <p className="muted">Loading…</p>;
  const list = limit ? rows.slice(0, limit) : rows;
  if (!list.length) return <p className="muted">No activity yet.</p>;
  return (
    <div className={limit ? "" : "card"}>
      {list.map((a) => (
        <div key={a.id} className="list-item">
          <span><b>{a.userName}</b> {a.link ? <a href={"#" + a.link}>{a.summary}</a> : a.summary}</span>
          <span className="small muted nowrap">{fmtDate(a.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

function Settings({ data, reload }: { data: ProjectData; reload: () => void }) {
  const { toast } = useSession();
  return (
    <>
      <ProjectForm initial={data.project} submitLabel="Save changes" onSubmit={async (p) => {
        try { await api(`/projects/${data.project.id}`, { method: "PUT", body: p }); toast("Project updated"); reload(); }
        catch (e) { toast((e as Error).message, "error"); }
      }} />
      {data.role === "owner" && (
        <div className="card" style={{ marginTop: 12, borderColor: "var(--danger)" }}>
          <h3 style={{ marginTop: 0 }}>Delete project</h3>
          <p className="muted">Permanently deletes all documents, files, comments and history in this project.</p>
          <button className="danger" onClick={async () => {
            if (prompt(`Type the project code ${data.project.code} to confirm deletion`) !== data.project.code) return;
            await api(`/projects/${data.project.id}`, { method: "DELETE" }); toast("Project deleted"); navigate("/");
          }}>Delete project</button>
        </div>
      )}
    </>
  );
}
