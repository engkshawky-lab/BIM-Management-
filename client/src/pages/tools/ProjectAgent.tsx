import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSession } from "../../App";
import { Markdown } from "../../components/Markdown";
import { t } from "../../i18n";
import { api } from "../../lib/api";
import { saveMarkdownDocx } from "../../lib/mdDocx";
import { briefingMarkdown, lastMonday, type ContainerFact, type ProjectFacts } from "../../../../shared/projectFacts";
import "./agent.css";

// Project Agent: a live operational dashboard (overdue, due this week, CDE status, changes, issues, milestones)
// computed without AI, a deterministic Word briefing, and a chat that answers only from the same facts with [F12] citations.

interface ProjectOpt { id: string; code: string; name: string }
interface Citation { id: string; label: string; link: string; text: string }
interface Turn { role: "user" | "assistant"; content: string; citations?: Citation[] }

const SUGGESTIONS = [
  "What is overdue this week?",
  "What changed since Monday?",
  "Which containers are at S3 waiting for review?",
  "Open clash issues by team?",
  "Who is late on their TIDP?",
  "Give me a briefing for tomorrow's coordination meeting.",
];

const href = (link: string) => `#${link}`;
const when = (iso: string) => (iso ? iso.slice(0, 16).replace("T", " ") : "");

function Panel({ title, count, link, children }: { title: string; count?: number; link?: string; children: ReactNode }) {
  return (
    <section className="agent-panel">
      <div className="agent-panel-head">
        <b>{title}</b>
        {count != null && <span className="badge">{count}</span>}
        {link && <a className="small agent-open" href={href(link)}>{t("Open")}</a>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) { return <div className="small muted">{text}</div>; }

function ContainerList({ items, late }: { items: ContainerFact[]; late?: boolean }) {
  return (
    <ul className="agent-list">
      {items.map((c) => (
        <li key={c.id}>
          <a href={href(c.link)} className="agent-mono">{c.container}</a>
          <span className="small">{c.title}</span>
          <span className="small muted">{c.team}{c.assignee ? ` · ${c.assignee}` : ""} · {t("due")} {c.dueDate}{c.suitability ? ` · ${c.state} ${c.suitability}` : ""}</span>
          <span className={"agent-tag" + (late ? " late" : "")}>{late ? `${c.daysLate} ${t("days late")}` : c.daysToDue === 0 ? t("today") : `${t("in")} ${c.daysToDue} ${t("days")}`}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ProjectAgent() {
  const { toast } = useSession();
  const [projects, setProjects] = useState<ProjectOpt[] | null>(null);
  const [pid, setPid] = useState("");
  const [since, setSince] = useState(() => lastMonday());
  const [facts, setFacts] = useState<ProjectFacts | null>(null);
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState<boolean | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ projects: ProjectOpt[] }>("/projects").then((r) => { setProjects(r.projects); if (r.projects[0]) setPid(r.projects[0].id); }).catch((e) => { toast((e as Error).message, "error"); setProjects([]); });
    api<{ enabled: boolean }>("/ai/status").then((r) => setAi(r.enabled)).catch(() => setAi(false));
  }, [toast]);

  useEffect(() => {
    if (!pid) return;
    let live = true;
    setLoading(true);
    api<ProjectFacts>(`/projects/${pid}/agent/facts${since ? `?since=${since}` : ""}`)
      .then((f) => { if (live) setFacts(f); })
      .catch((e) => { if (live) { setFacts(null); toast((e as Error).message, "error"); } })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [pid, since, toast]);

  useEffect(() => { setTurns([]); }, [pid]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [turns, busy]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy || !pid) return;
    const history = turns.slice(-10).map(({ role, content }) => ({ role, content }));
    const next: Turn[] = [...turns, { role: "user", content: question }];
    setTurns(next); setQ(""); setBusy(true);
    try {
      const r = await api<{ answer: string; truncated: boolean; citations: Citation[] }>(`/projects/${pid}/agent`, { body: { question, since: since || undefined, history } });
      setTurns([...next, { role: "assistant", content: r.answer + (r.truncated ? `\n\n*${t("(answer shortened)")}*` : ""), citations: r.citations }]);
    } catch (e) { toast((e as Error).message, "error"); setTurns(turns); setQ(question); } finally { setBusy(false); }
  };

  const download = async () => {
    if (!facts) return;
    try {
      await saveMarkdownDocx(briefingMarkdown(facts), `${facts.project.code}-coordination-briefing-${facts.today}`, {
        title: "Coordination briefing", project: `${facts.project.code} ${facts.project.name}`, stage: facts.project.stage, date: facts.today, status: "For information",
      });
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const f = facts;
  const P = f ? `/projects/${f.project.id}` : "";
  const kind = { "review-requested": t("Review requested"), "shared-for-review": t("Shared for review"), "model-review": t("Model QA (draft)") } as const;

  return (
    <div className="agent">
      <div className="hub-card">
        <div className="hub-title">Project agent</div>
        <p className="small muted" style={{ marginBlockStart: 0 }}>Live operational picture of a project — what is overdue, due, changed, waiting for review or open — straight from the platform records. Ask questions in plain language; answers cite the facts they use.</p>
        <div className="agent-controls">
          <label className="field"><span>Project</span>
            <select value={pid} onChange={(e) => setPid(e.target.value)} disabled={!projects?.length}>
              {!projects?.length && <option value="">{projects ? t("No projects") : t("Loading…")}</option>}
              {projects?.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Changes since</span><input type="date" value={since} onChange={(e) => setSince(e.target.value)} /></label>
          <div className="agent-controls-actions">
            <button className="ghost" onClick={() => setSince(lastMonday())}>Last Monday</button>
            <button className="primary" disabled={!f || loading} onClick={download}>Download briefing</button>
          </div>
        </div>
        {projects && !projects.length && <Empty text={t("You are not a member of any project yet.")} />}
        {f && <div className="tiny muted">{t("As of")} {f.today} · {t("this week")}: {f.today} → {f.weekEnd}{loading ? ` · ${t("Refreshing…")}` : ""}</div>}
      </div>

      {loading && !f && <div className="card muted">Reading the project records…</div>}

      {f && (
        <>
          <div className="agent-kpis">
            <a className="agent-kpi danger" href={href(`${P}/delivery/plan`)}><span className="stat">{f.totals.overdue}</span><span className="small">{t("Overdue containers")}</span></a>
            <a className="agent-kpi warn" href={href(`${P}/delivery/plan`)}><span className="stat">{f.totals.dueThisWeek}</span><span className="small">{t("Due this week")}</span></a>
            <a className="agent-kpi" href={href(`${P}/documents`)}><span className="stat">{f.totals.awaitingReview}</span><span className="small">{t("Awaiting review")}</span></a>
            <a className="agent-kpi" href={href(`${P}/coordination/issues`)}><span className="stat">{f.totals.openIssues}</span><span className="small">{t("Open issues")}</span></a>
            <a className="agent-kpi" href={href(`${P}/activity`)}><span className="stat">{f.totals.changes}</span><span className="small">{t("Changes since")} {f.since}</span></a>
            <a className="agent-kpi" href={href(`${P}/delivery/plan`)}><span className="stat">{f.totals.done}/{f.totals.containers}</span><span className="small">{t("Shared or published")}</span></a>
          </div>

          <div className="agent-grid">
            <Panel title={t("Overdue")} count={f.overdue.total} link={`${P}/delivery/plan`}>
              {f.overdue.total ? <ContainerList items={f.overdue.items} late /> : <Empty text={t("Nothing is overdue.")} />}
            </Panel>
            <Panel title={t("Due this week")} count={f.dueThisWeek.total} link={`${P}/delivery/plan`}>
              {f.dueThisWeek.total ? <ContainerList items={f.dueThisWeek.items} /> : <Empty text={t("Nothing falls due this week.")} />}
            </Panel>

            <Panel title={t("TIDP status by task team")} link={`${P}/delivery/plan`}>
              {f.teams.length ? (
                <div className="table-wrap"><table className="data">
                  <thead><tr><th>{t("Task team")}</th><th>{t("Containers")}</th><th>{t("Done")}</th><th>{t("Overdue")}</th><th>{t("This week")}</th><th>{t("Issues")}</th></tr></thead>
                  <tbody>{f.teams.map((x) => <tr key={x.teamId}><td><a href={href(x.link)}>{x.team}</a>{x.lead && <div className="tiny muted">{x.lead}</div>}</td><td>{x.total}</td><td>{x.done}</td><td className={x.overdue ? "agent-bad" : ""}>{x.overdue}</td><td>{x.dueThisWeek}</td><td>{x.openIssues}</td></tr>)}</tbody>
                </table></div>
              ) : <Empty text={t("No task teams yet.")} />}
            </Panel>
            <Panel title={t("By CDE state and suitability")} link={`${P}/documents`}>
              {f.byStatus.length ? (
                <div className="table-wrap"><table className="data">
                  <thead><tr><th>{t("Status")}</th><th>{t("Documents")}</th><th>{t("Files")}</th></tr></thead>
                  <tbody>{f.byStatus.map((x) => <tr key={x.code}><td><span className="agent-mono">{x.state} {x.suitability}</span></td><td>{x.documents}</td><td>{x.files}</td></tr>)}</tbody>
                </table></div>
              ) : <Empty text={t("No documents or files yet.")} />}
            </Panel>

            <Panel title={t("Awaiting review or approval")} count={f.awaitingReview.total}>
              {f.awaitingReview.total ? (
                <ul className="agent-list">{f.awaitingReview.items.map((x, i) => (
                  <li key={i}><a href={href(x.link)}>{x.title}</a><span className="small muted">{kind[x.kind]}{x.suitability ? ` · ${x.suitability}` : ""}{x.reviewer ? ` · ${x.reviewer}` : ""}</span><span className="agent-tag">{x.daysWaiting} {t("days")}</span></li>
                ))}</ul>
              ) : <Empty text={t("No items are waiting for review.")} />}
            </Panel>
            <Panel title={`${t("Changes since")} ${f.since}`} count={f.changes.total} link={`${P}/activity`}>
              {f.changes.total ? (
                <ul className="agent-list">{f.changes.items.map((x, i) => (
                  <li key={i}><a href={href(x.link)}>{x.title}</a><span className="small muted">{x.by} · {when(x.when)}</span><span className="small agent-mono">{x.from ? `${x.from} → ` : ""}{x.to}</span></li>
                ))}</ul>
              ) : <Empty text={t("No CDE changes in the period.")} />}
            </Panel>

            <Panel title={t("Open issues")} count={f.issues.total} link={`${P}/coordination/issues`}>
              {f.issuesByTeam.length > 0 && (
                <div className="table-wrap"><table className="data">
                  <thead><tr><th>{t("Task team")}</th><th>{t("Open")}</th><th>{t("Clash")}</th><th>{t("Critical")}</th><th>{t("High")}</th><th>{t("Overdue")}</th></tr></thead>
                  <tbody>{f.issuesByTeam.map((x) => <tr key={x.team}><td>{x.team}</td><td>{x.open}</td><td>{x.clash}</td><td>{x.critical}</td><td>{x.high}</td><td className={x.overdue ? "agent-bad" : ""}>{x.overdue}</td></tr>)}</tbody>
                </table></div>
              )}
              {f.issues.total ? (
                <ul className="agent-list">{f.issues.items.slice(0, 12).map((x) => (
                  <li key={x.id}><a href={href(x.link)}>#{x.number} {x.title}</a><span className="small muted">{x.type} · {x.priority} · {x.team}{x.assignee ? ` · ${x.assignee}` : ""} · {x.ageDays} {t("days old")}</span>{x.overdue && <span className="agent-tag late">{t("overdue")}</span>}</li>
                ))}</ul>
              ) : <Empty text={t("No open issues.")} />}
            </Panel>
            <Panel title={t("Next milestones")} link={`${P}/delivery/plan`}>
              {f.milestones.length ? (
                <ul className="agent-list">{f.milestones.map((m) => (
                  <li key={m.id}><a href={href(m.link)}>{m.name}</a><span className="small muted">{m.date} · {t("in")} {m.daysTo} {t("days")}</span><span className="small">{m.outstanding} / {m.containers} {t("containers outstanding")}</span></li>
                ))}</ul>
              ) : <Empty text={t("No future milestones are planned.")} />}
              {f.actions.total > 0 && (
                <>
                  <div className="agent-sub">{t("Open meeting actions")} <span className="badge">{f.actions.total}</span></div>
                  <ul className="agent-list">{f.actions.items.slice(0, 8).map((a, i) => (
                    <li key={i}><a href={href(a.link)}>{a.text}</a><span className="small muted">{a.owner}{a.due ? ` · ${a.due}` : ""} · {a.status}</span>{a.overdue && <span className="agent-tag late">{t("overdue")}</span>}</li>
                  ))}</ul>
                </>
              )}
              {f.inactiveMembers.total > 0 && (
                <>
                  <div className="agent-sub">{t("Members without recent activity")} <span className="badge">{f.inactiveMembers.total}</span></div>
                  <ul className="agent-list">{f.inactiveMembers.items.slice(0, 8).map((m, i) => (
                    <li key={i}><a href={href(m.link)}>{m.name}</a><span className="small muted">{m.role} · {t("last active")} {m.lastActive || t("never")}</span></li>
                  ))}</ul>
                </>
              )}
            </Panel>
          </div>

          <section className="agent-panel agent-chat">
            <div className="agent-panel-head"><b>Ask the agent</b>{turns.length > 0 && <button className="ghost small agent-open" onClick={() => setTurns([])}>New chat</button>}</div>
            {ai === false ? (
              <div className="small muted">AI is not switched on for this platform, so questions are disabled. The dashboard and the briefing above work without it; ask your administrator to add a Claude API key to the server.</div>
            ) : (
              <>
                <p className="small muted" style={{ marginBlock: 0 }}>Answers use only the facts above and cite them; if the data does not cover a question, the agent says so.</p>
                <div className="agent-log">
                  {!turns.length && <div className="chips">{SUGGESTIONS.map((s) => <button key={s} className="chip" disabled={busy || ai !== true} onClick={() => send(t(s))}>{t(s)}</button>)}</div>}
                  {turns.map((x, i) => (
                    <div key={i} className={"agent-bubble " + x.role}>
                      {x.role === "user" ? x.content : (
                        <Markdown text={x.content.replace(/\[F(\d+)\]/g, "[N$1]")} cite={(n) => {
                          const c = x.citations?.find((y) => y.id === `F${n}`);
                          return c ? <a className="cite" href={href(c.link)} title={c.text}>[F{n}]</a> : <span className="cite">[F{n}]</span>;
                        }} />
                      )}
                      {!!x.citations?.length && (
                        <div className="agent-cites tiny">{x.citations.map((c) => <div key={c.id}><b>[{c.id}]</b> <a href={href(c.link)} title={c.text}>{c.label}</a></div>)}</div>
                      )}
                    </div>
                  ))}
                  {busy && <div className="agent-bubble assistant muted">Checking the project facts…</div>}
                  <div ref={end} />
                </div>
                <form className="agent-ask" onSubmit={(e) => { e.preventDefault(); send(q); }}>
                  <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Ask about overdue items, changes, reviews, issues…")} maxLength={4000} disabled={ai !== true}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(q); } }} />
                  <button className="primary" disabled={busy || ai !== true || !q.trim() || !pid}>{busy ? t("Thinking…") : t("Ask")}</button>
                </form>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
