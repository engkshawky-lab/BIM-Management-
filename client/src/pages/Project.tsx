import { useCallback, useEffect, useState } from "react";
import { initials, navigate, useSession } from "../App";
import { StdBadge } from "../components/common";
import { api, canManage, fmtDate, type ActivityRow, type Invitation, type Member, type Project } from "../lib/api";
import DocumentEditor from "./DocumentEditor";
import Delivery from "./Delivery";
import Documents from "./Documents";
import Files from "./Files";
import { ProjectForm } from "./NewProject";
import { PROJECT_PAGES } from "../shell/nav";
import ProjectWorkflow from "./ProjectWorkflow";
import Quality from "./Quality";
import Validation from "./Validation";
import Coordination from "./Coordination";
import AssetTags from "./AssetTags";
import ModelReviews from "./ModelReviews";
import Meetings from "./Meetings";
import Traceability from "./Traceability";
import { ContractReview, ProjectAssistant } from "./Assistant";

export interface ProjectData { project: Project; members: Member[]; invitations: Invitation[]; role: Project["role"] }

const DEFAULT_SUB: Record<string, string> = { delivery: "plan", coordination: "issues" };
const pathOf = (tab: string, sub?: string) => (DEFAULT_SUB[tab] ? `${tab}/${sub && !/^[0-9a-f-]{36}$/.test(sub) ? sub : DEFAULT_SUB[tab]}` : tab);

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
  // Navigation between hubs lives in the side panel; the page shows where you are.
  const page = PROJECT_PAGES.find((x) => x.path === pathOf(tab, sub));

  return (
    <>
      <div className="page-head">
        <div className="crumbs"><a href={`#/projects/${projectId}/overview`}>{project.code} · {project.name}</a>{page && <><span>›</span><span>{page.group}</span><span>›</span><b>{page.label}</b></>}</div>
        <h1>{page?.label === "Summary" ? project.name : page?.label ?? project.name}</h1>
        <div className="row">{project.standards.map((s) => <StdBadge key={s} std={s} />)}<span className="small muted">{[project.appointingParty, project.stage].filter(Boolean).join(" · ")}{project.appointingParty || project.stage ? " · " : ""}your role: {data.role}</span></div>
      </div>
      {tab === "overview" && <Overview data={data} />}
      {tab === "documents" && <Documents data={data} />}
      {tab === "files" && <Files data={data} />}
      {tab === "delivery" && <Delivery data={data} sub={sub} />}
      {tab === "validation" && <Validation data={data} sub={sub} />}
      {tab === "coordination" && <Coordination data={data} sub={sub} />}
      {tab === "tags" && <AssetTags data={data} />}
      {tab === "assistant" && <ProjectAssistant data={data} />}
      {tab === "contract" && <ContractReview data={data} />}
      {tab === "traceability" && <Traceability data={data} />}
      {tab === "meetings" && <Meetings data={data} sub={sub} />}
      {tab === "reviews" && <ModelReviews data={data} sub={sub} />}
      {tab === "quality" && <Quality data={data} />}
      {tab === "workflow" && <ProjectWorkflow data={data} />}
      {tab === "team" && <Team data={data} reload={reload} />}
      {tab === "activity" && <Activity projectId={projectId} />}
      {tab === "settings" && !canManage(data.role) && <div className="card muted">Only project managers can change settings.</div>}
      {tab === "settings" && canManage(data.role) && <Settings data={data} reload={reload} />}
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
          <a className="btn" href={`#/projects/${project.id}/delivery/plan`}>📅 Delivery</a>
          <a className="btn" href={`#/projects/${project.id}/validation`}>🔍 Model & coordination</a>
          <a className="btn" href={`#/projects/${project.id}/quality`}>✅ Quality</a>
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
      <StandardPicker data={data} reload={reload} />
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

function StandardPicker({ data, reload }: { data: ProjectData; reload: () => void }) {
  const { toast } = useSession();
  const [list, setList] = useState<{ id: string; name: string; stages: string[] }[]>([]);
  const [sel, setSel] = useState({ standardId: data.project.standardId ?? "", stage: data.project.standardStage ?? "" });
  useEffect(() => { api<{ standards: { id: string; name: string; stages: string[] }[] }>("/standards").then((r) => setList(r.standards)); }, []);
  const stages = list.find((x) => x.id === sel.standardId)?.stages ?? [];
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3 style={{ marginTop: 0 }}>Client standard</h3>
      <p className="small muted">COBie checks and asset tags follow this client's imported requirements at the chosen stage. Manage standards under <a href="#/standards">Resources › Client standards</a>.</p>
      <div className="row">
        <select value={sel.standardId} onChange={(e) => setSel({ standardId: e.target.value, stage: "" })} style={{ maxWidth: 320 }}>
          <option value="">None (generic checks)</option>{list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        {stages.length > 0 && <select value={sel.stage} onChange={(e) => setSel({ ...sel, stage: e.target.value })} style={{ maxWidth: 240 }}>
          <option value="">Latest stage</option>{stages.map((s) => <option key={s}>{s}</option>)}</select>}
        <button className="primary" onClick={async () => {
          try { await api(`/projects/${data.project.id}/standard`, { method: "PUT", body: { standardId: sel.standardId || null, stage: sel.stage } }); toast("Client standard saved"); reload(); }
          catch (e) { toast((e as Error).message, "error"); }
        }}>Apply</button>
      </div>
    </div>
  );
}
