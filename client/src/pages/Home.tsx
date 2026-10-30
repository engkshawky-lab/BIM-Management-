import { useEffect, useState, type CSSProperties } from "react";
import { hubs } from "../../../shared/data/hubs";
import { lastVisited, visitedTabs } from "../lib/progress";
import { navigate, useSession } from "../App";
import { StdBadge } from "../components/common";
import { api, type Notification, type Project } from "../lib/api";
import { Icon, type IconName } from "../shell/icons";
import { RolePicker, useRecent } from "../shell/Shell";
import { roleById } from "../shell/roles";
import { activePlan } from "../lib/planStore";
import { dueBucket } from "../../../shared/planRows";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

function Quick({ icon, label, href }: { icon: IconName; label: string; href: string }) {
  return <a className="quick" href={"#" + href}><Icon name={icon} size={15} /><span>{label}</span></a>;
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid g3">
      {projects.map((p) => (
        <a key={p.id} href={`#/projects/${p.id}/overview`} className="card project-card">
          <div className="row spread"><span className="badge">{p.code}</span><span className="small muted">{p.role}</span></div>
          <h3>{p.name}</h3>
          <p className="small muted">{p.appointingParty || "—"}{p.stage && ` · ${p.stage}`}</p>
          <div className="row">{p.standards.map((s) => <StdBadge key={s} std={s} />)}</div>
          <div className="row small muted" style={{ marginTop: 8 }}>{p.documents} documents · {p.files} files · {p.members} members</div>
        </a>
      ))}
    </div>
  );
}

/** Today at a glance: containers due from the saved delivery plan and items assigned in projects. */
function TodayCard() {
  const [assigned, setAssigned] = useState<{ total: number; overdue: number } | null>(null);
  useEffect(() => { api<{ items: { overdue: boolean }[] }>("/me/inbox").then((r) => setAssigned({ total: r.items.length, overdue: r.items.filter((i) => i.overdue).length })).catch(() => setAssigned({ total: 0, overdue: 0 })); }, []);
  const plan = activePlan();
  const day = new Date().toISOString().slice(0, 10);
  const buckets = plan ? plan.rows.map((r) => dueBucket(r, day)) : [];
  const overdue = buckets.filter((b) => b === "overdue").length + (assigned?.overdue ?? 0);
  const week = buckets.filter((b) => b === "week").length;
  return (
    <section className="card">
      <div className="row spread"><h2>Today</h2><a href="#/my-day" className="small">Open My Day →</a></div>
      <div className="today-stats">
        <a href="#/my-day" className="hub-stat" style={{ "--c": overdue ? "var(--danger)" : "var(--muted)", color: "inherit" } as CSSProperties}><div className="v">{overdue}</div><div className="small">overdue</div></a>
        <a href="#/my-day" className="hub-stat" style={{ "--c": "var(--muted)", color: "inherit" } as CSSProperties}><div className="v">{week}</div><div className="small">due this week</div></a>
        <a href="#/my-day" className="hub-stat" style={{ "--c": "var(--muted)", color: "inherit" } as CSSProperties}><div className="v">{assigned?.total ?? "…"}</div><div className="small">assigned to you</div></a>
      </div>
      {!plan && <div className="small muted" style={{ marginTop: 10 }}>Save a TIDP or MIDP in the <a href="#/ai-tools/plans">plan generator</a> to see what is due each day.</div>}
    </section>
  );
}

/** Learning shortcuts with the viewer's progress through the parts hub and topic hubs. */
function KeepLearning() {
  const last = lastVisited();
  const partsSeen = visitedTabs("parts").size;
  const hubsStarted = hubs.filter((h) => visitedTabs(h.id).size > 0).length;
  const rows: { icon: IconName; title: string; meta: string; href: string }[] = [
    { icon: "book", title: "ISO 19650 Parts 1–6", meta: partsSeen ? `${partsSeen} of 6 parts opened` : "Start with Part 1", href: "/parts" },
    { icon: "grid", title: "Topic hubs", meta: hubsStarted ? `${hubsStarted} of ${hubs.length} hubs started` : `${hubs.length} hubs to explore`, href: "/hubs" },
    { icon: "sparkles", title: "Quizzes, mock exam, scenarios", meta: "Practise and track your skills", href: "/learn" },
    { icon: "file", title: "Sample documents", meta: "EIR, AIR, OIR, BEP and more", href: "/samples" },
  ];
  return (
    <section className="card">
      <div className="row spread"><h2>Keep learning</h2>{last && <a href={"#" + last.path} className="small">Resume: {last.label} →</a>}</div>
      <div className="list-grid">{rows.map((r) => (
        <a key={r.title} href={"#" + r.href} className="recent-item"><Icon name={r.icon} size={15} /><span>{r.title}</span><small>{r.meta}</small></a>
      ))}</div>
    </section>
  );
}

export default function Home({ projectsOnly }: { projectsOnly?: boolean }) {
  const { user } = useSession();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [notes, setNotes] = useState<Notification[]>([]);
  const [hasEir, setHasEir] = useState(false);
  const [picker, setPicker] = useState(false);
  const recent = useRecent(user.id);
  useEffect(() => {
    api<{ projects: Project[] }>("/projects").then(async (r) => {
      setProjects(r.projects);
      const first = r.projects[0];
      if (first) api<{ documents: { templateId: string }[] }>(`/projects/${first.id}/documents`).then((d) => setHasEir(d.documents.some((x) => x.templateId === "eir"))).catch(() => undefined);
    });
    api<{ notifications: Notification[] }>("/notifications").then((r) => setNotes(r.notifications.filter((n) => !n.read).slice(0, 5)));
  }, []);

  if (projectsOnly) return (
    <>
      <div className="page-head row spread"><h1>Projects</h1><a className="btn primary" href="#/projects/new"><Icon name="plus" size={16} /> New project</a></div>
      {projects === null ? <p className="muted">Loading…</p> : projects.length ? <ProjectGrid projects={projects} /> : <div className="card empty"><h3>No projects yet</h3><a className="btn primary" href="#/projects/new">Create your first project</a></div>}
    </>
  );

  const first = projects?.[0];
  const steps = [
    { done: !!user.bimRole, title: "Set your role", text: user.bimRole ? `${roleById(user.bimRole)?.title}` : "Pins the tools your role uses most", go: () => setPicker(true) },
    { done: !!first, title: "Create a project", text: first ? `${first.code} — ${first.name}` : "Holds your CDE, plan and team", go: () => navigate(first ? `/projects/${first.id}/overview` : "/projects/new") },
    { done: hasEir, title: "Draft your first EIR", text: "Guided, section by section", go: () => navigate("/knowledge/iso19650/templates/eir") },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="home">
      <header className="home-head">
        <span className="muted small">{today}</span>
        <h1>{greeting()}, {user.name.split(" ")[0]}</h1>
      </header>

      <nav className="quick-row" aria-label="Quick actions">
        <Quick icon="plus" label="New project" href="/projects/new" />
        <Quick icon="tag" label="Check file names" href="/tools/naming-check" />
        <Quick icon="check" label="Check a Revit model" href="/model-tools/revit" />
        <Quick icon="calendar" label="Delivery plan" href="/ai-tools/plans" />
        <Quick icon="sparkles" label="Draft a document" href="/ai-tools/generate" />
        <Quick icon="file" label="Review a document" href="/ai-tools/review" />
      </nav>

      {doneCount < 3 && (
        <section className="card setup-card">
          <div className="row spread"><h2>Get started</h2><span className="chip">{doneCount}/3 done</span></div>
          <div className="setup-steps">{steps.map((s, i) => (
            <button key={s.title} className={"step" + (s.done ? " done" : "")} onClick={s.go}>
              <span className="step-num">{s.done ? "✓" : i + 1}</span>
              <span><b>{s.title}</b><span>{s.text}</span></span>
            </button>
          ))}</div>
        </section>
      )}

      <div className="home-grid">
        <div className="home-col">
          <TodayCard />
          <section className="card">
            <h2>Continue where you left off</h2>
            {recent.length ? <div className="recent-list">{recent.slice(0, 6).map((r) => (
              <a key={r.path} href={"#" + r.path} className="recent-item"><Icon name="clock" size={15} /><span>{r.label}</span><small>{new Date(r.ts).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</small></a>
            ))}</div> : <div className="dashed">Pages you open appear here so you can return in one click.</div>}
          </section>
        </div>
        <div className="home-col">
          <section className="card">
            <div className="row spread"><h2>Needs your attention</h2>{notes.length > 0 && <span className="chip">{notes.length}</span>}</div>
            {notes.length ? notes.map((n) => <a key={n.id} href={"#" + n.link} className="recent-item"><Icon name="bell" size={15} /><span>{n.message}</span></a>)
              : <div className="dashed">You're all caught up. Review requests, assigned issues and mentions appear here.</div>}
          </section>
          <section className="card">
            <div className="row spread"><h2>Projects</h2><a href="#/projects" className="small">View all →</a></div>
            {projects === null ? <p className="muted">Loading…</p> : projects.length ? projects.slice(0, 4).map((p) => (
              <a key={p.id} href={`#/projects/${p.id}/overview`} className="mini-project">
                <span className="badge">{p.code}</span><span className="mini-name">{p.name}</span>
                <span className="mini-stats"><span><b>{p.documents}</b> docs</span><span><b>{p.files}</b> files</span><span><b>{p.members}</b> people</span></span>
              </a>
            )) : <div className="dashed">No projects yet. <a href="#/projects/new">Create one</a>.</div>}
          </section>
        </div>
      </div>

      <KeepLearning />
      {picker && <RolePicker onClose={() => setPicker(false)} />}
    </div>
  );
}
