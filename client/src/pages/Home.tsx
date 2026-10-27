import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { hubs } from "../../../shared/data/hubs";
import { lastVisited, visitedTabs } from "../lib/progress";
import { navigate, useSession } from "../App";
import { StdBadge } from "../components/common";
import { api, type Notification, type Project } from "../lib/api";
import { Icon, type IconName } from "../shell/icons";
import { RolePicker, useRecent } from "../shell/Shell";
import { roleById } from "../shell/roles";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

/** Line-drawn building model for the header: a federated frame, slabs and a façade grid. */
function HeroModel() {
  const floors = [0, 1, 2, 3, 4];
  return (
    <svg className="hero-model" viewBox="0 0 520 220" aria-hidden="true">
      <defs>
        <linearGradient id="hm-fade" gradientUnits="userSpaceOnUse" x1="110" y1="0" x2="520" y2="0"><stop offset="0" stopColor="var(--hero-line)" stopOpacity="0" /><stop offset=".35" stopColor="var(--hero-line)" stopOpacity=".9" /><stop offset="1" stopColor="var(--hero-line)" stopOpacity=".6" /></linearGradient>
      </defs>
      <g stroke="url(#hm-fade)" fill="none" strokeWidth="1">
        {floors.map((f) => <path key={f} d={`M150 ${170 - f * 28} L330 ${190 - f * 28} L470 ${150 - f * 28} L290 ${130 - f * 28} Z`} />)}
        {[150, 210, 270, 330].map((x, i) => <line key={"c" + x} x1={x} y1={170 + i * 6.7} x2={x} y2={58 + i * 6.7} />)}
        {[330, 377, 423, 470].map((x, i) => <line key={"d" + x} x1={x} y1={190 - i * 13.3} x2={x} y2={78 - i * 13.3} />)}
        {Array.from({ length: 9 }, (_, i) => <line key={"m" + i} x1={330 + i * 15.5} y1={190 - i * 4.4} x2={330 + i * 15.5} y2={78 - i * 4.4} strokeOpacity=".35" />)}
        <path d="M110 200 L520 200" strokeOpacity=".4" />
      </g>
      <g fill="var(--hero-accent)">
        <circle cx="330" cy="78" r="3" /><circle cx="470" cy="38" r="3" /><circle cx="290" cy="18" r="2.5" /><circle cx="150" cy="58" r="2.5" />
      </g>
      <g stroke="var(--hero-accent)" strokeWidth="1.2" fill="none" strokeDasharray="3 4" opacity=".8"><path d="M330 78 L470 38 L290 18 L150 58 Z" /></g>
    </svg>
  );
}

function StartCard({ icon, title, text, meta, onClick }: { icon: IconName; title: string; text: string; meta: string; onClick: () => void }) {
  return (
    <button className="start-card" onClick={onClick}>
      <span className="start-head"><span className="tile-icon"><Icon name={icon} size={18} /></span><b>{title}</b></span>
      <span className="start-text">{text}</span>
      <span className="start-meta">{meta}</span>
    </button>
  );
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

/** Learning shortcuts with the viewer's progress through the parts hub and topic hubs. */
function KeepLearning() {
  const last = lastVisited();
  const partsSeen = visitedTabs("parts").size;
  const hubsStarted = hubs.filter((h) => visitedTabs(h.id).size > 0).length;
  const tiles: { c: string; title: string; text: string; meta: ReactNode; href: string }[] = [
    { c: "#16a34a", title: "ISO 19650 Parts 1–6", text: "Beginner to expert, clause deep dives, checklists and an AI tutor.", meta: partsSeen ? <>{partsSeen} of 6 parts opened</> : "Start with Part 1", href: "/parts" },
    { c: "#3b82f6", title: "Topic hubs", text: "Appointment process, LOIN, COBie, infrastructure, Revit, scan to BIM and more.", meta: hubsStarted ? <>{hubsStarted} of {hubs.length} hubs started</> : <>{hubs.length} hubs to explore</>, href: "/hubs" },
    { c: "#9333ea", title: "AI tools", text: "Review an EIR or BEP, draft documents, build a risk register or clash matrix.", meta: "Review-first, you stay in control", href: "/ai-tools/review" },
    { c: "#d97706", title: "Samples & downloads", text: "Structured Word samples for EIR, AIR, OIR, BEP and more, plus curated files.", meta: "Ready to use", href: "/samples" },
  ];
  return (
    <>
      <h2 className="section-title">Keep learning</h2>
      {last && <a href={"#" + last.path} className="hub-tile row spread" style={{ "--c": "#16a34a", color: "inherit", marginBottom: 12 } as CSSProperties}>
        <span><span className="small muted">Pick up your learning</span><span style={{ display: "block" }}><b>{last.label}</b></span></span><span className="btn primary">Resume →</span></a>}
      <div className="grid g4">{tiles.map((t) => (
        <a key={t.title} href={"#" + t.href} className="hub-card" style={{ "--c": t.c, color: "inherit", display: "grid", gap: 6, alignContent: "start" } as CSSProperties}>
          <b style={{ color: t.c, fontSize: 15 }}>{t.title}</b><span className="small">{t.text}</span><span className="small muted">{t.meta} →</span>
        </a>))}</div>
    </>
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
    { done: !!user.bimRole, title: "Set your role", text: user.bimRole ? `${roleById(user.bimRole)?.title} — your tools are pinned to Favourites.` : "We pin the tools your role uses most to Favourites.", go: () => setPicker(true) },
    { done: !!first, title: "Create your first project", text: first ? `${first.code} — ${first.name} is ready with CDE folders.` : "Projects hold your CDE, documents, delivery plan and team.", go: () => navigate(first ? `/projects/${first.id}/overview` : "/projects/new") },
    { done: hasEir, title: "Draft your first EIR", text: "A guided working draft, section by section, with project details filled in.", go: () => navigate("/knowledge/iso19650/templates/eir") },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>{greeting()}, {user.name.split(" ")[0]}.</h1>
          <p>Pick up where you left off, or start a document, a model check or a review. Everything for applying ISO 19650 and ISO/IEC 42001 on your projects.</p>
        </div>
        <HeroModel />
      </section>

      <div className="home-grid">
        <div className="home-col">
          <section className="card">
            <h2>Continue where you left off</h2>
            {recent.length ? <div className="recent-list">{recent.slice(0, 5).map((r) => (
              <a key={r.path} href={"#" + r.path} className="recent-item"><Icon name="clock" size={15} /><span>{r.label}</span><small>{new Date(r.ts).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</small></a>
            ))}</div> : <div className="dashed">Pages you open appear here so you can return in one click. Try a guided start below.</div>}
          </section>
          <section className="card">
            <div className="row spread"><h2>Get started in three steps</h2><span className="chip">{doneCount}/3 done</span></div>
            <div className="steps">{steps.map((s, i) => (
              <button key={s.title} className={"step" + (s.done ? " done" : "")} onClick={s.go}>
                <span className="step-num">{s.done ? "✓" : i + 1}</span>
                <span><b>{s.title}</b><span>{s.text}</span></span>
              </button>
            ))}</div>
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

      <h2 className="section-title">Start something</h2>
      <div className="start-grid">
        <StartCard icon="shield" title="Review a document" text="Quality hub checks every EIR, BEP and MIDP with clause-referenced findings." meta="Quality hub · Most used" onClick={() => navigate(first ? `/projects/${first.id}/quality` : "/projects/new")} />
        <StartCard icon="file" title="Draft an EIR" text="Build a controlled working draft, section by section, with AI help." meta="Template · AI drafting" onClick={() => navigate("/knowledge/iso19650/templates/eir")} />
        <StartCard icon="check" title="Check a model" text="Upload an IFC or COBie file and see LOIN, IDS and data checks in seconds." meta="Model validation" onClick={() => navigate(first ? `/projects/${first.id}/validation` : "/projects/new")} />
        <StartCard icon="layers" title="Learn the CDE workflow" text="The four CDE states and the status codes that move information between them." meta="ISO 19650 library" onClick={() => navigate("/knowledge/iso19650/library/2")} />
      </div>
      <KeepLearning />
      {picker && <RolePicker onClose={() => setPicker(false)} />}
    </div>
  );
}
