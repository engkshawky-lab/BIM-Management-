import { useMemo, useState } from "react";
import { t } from "../i18n";
import type { DeepDive, DeepSection } from "../../../shared/data/deepDives/types";
import { saveMarkdownDocx } from "../lib/mdDocx";

// Deep dive for a key document (EIR, BEP, AIR): a complete worked example, variants,
// case studies, a clause library and an assessment rubric. Shown inside its document guide.

const TABS = [
  { id: "example", label: "Full worked example" },
  { id: "cases", label: "Case studies" },
  { id: "variants", label: "Other project types" },
  { id: "clauses", label: "Clause library" },
  { id: "rubric", label: "Assessment rubric" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const mdTable = (tb: NonNullable<DeepSection["table"]>) =>
  [`| ${tb.columns.join(" | ")} |`, `| ${tb.columns.map(() => "---").join(" | ")} |`, ...tb.rows.map((r) => `| ${r.map((c) => c.replace(/\|/g, "/")).join(" | ")} |`)].join("\n");

/** The worked example as Markdown, for the Word download. */
export function deepDiveMarkdown(d: DeepDive, name: string) {
  const p = d.project;
  return [`## ${name} — ${p.name}`, "",
    `**Project:** ${p.name} (${p.code}) · **Client:** ${p.client} · **Type:** ${p.type} · **Location:** ${p.location} · **Value:** ${p.value} · **Stages:** ${p.stages}`, "",
    `_Worked example on a fictional project, for learning. Adapt every requirement to your own appointment._`, "",
    ...d.example.flatMap((s, i) => [`## ${i + 1}. ${s.title}`, "", ...s.paragraphs.flatMap((x) => [x, ""]), ...(s.table ? [mdTable(s.table), ""] : [])]),
  ].join("\n");
}

function Table({ tb }: { tb: NonNullable<DeepSection["table"]> }) {
  return <div className="table-wrap"><table className="data hub-table"><thead><tr>{tb.columns.map((c) => <th key={c}>{t(c)}</th>)}</tr></thead>
    <tbody>{tb.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{t(c)}</td>)}</tr>)}</tbody></table></div>;
}

export default function DeepDiveView({ d, name }: { d: DeepDive; name: string }) {
  const [tab, setTab] = useState<Tab>("example");
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState("");
  const [score, setScore] = useState<Record<number, number>>({});
  const topics = useMemo(() => [...new Set(d.clauses.map((c) => c.topic))], [d]);
  const copy = (key: string, text: string) => { navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 1500); }).catch(() => undefined); };
  const total = d.rubric.reduce((a, r, i) => a + r.weight * ((score[i] ?? 0) / 4), 0);
  const p = d.project;

  return (
    <div className="hub-card dd" id="dg-deep">
      <div className="hub-title">{t("Deep dive")} · {d.code}</div>
      <div className="dd-project">
        <div><b>{t(p.name)}</b> <span className="badge">{p.code}</span><div className="small muted">{t(p.type)} · {t(p.client)} · {t(p.location)} · {t(p.value)} · {t(p.stages)}</div></div>
        <button className="btn primary" onClick={() => saveMarkdownDocx(deepDiveMarkdown(d, name), `${p.code}-${d.code}-worked-example`)}>{t("Download the filled example (Word)")}</button>
      </div>
      <p className="small" style={{ margin: "4px 0 10px" }}>{t(p.summary)}</p>
      <nav className="tabs" aria-label={t("Deep dive")}>
        {TABS.map((x) => <button key={x.id} className={"linklike dd-tab" + (tab === x.id ? " on" : "")} onClick={() => setTab(x.id)}>{t(x.label)}</button>)}
      </nav>

      {tab === "example" && <div className="dd-doc">
        <div className="small muted">{t("A complete example on a fictional project. The note under each heading explains why it is written that way.")}</div>
        {d.example.map((s, i) => (
          <details key={i} className="clause" open={i === 0}>
            <summary><b>{i + 1}. {t(s.title)}</b></summary>
            <div className="dd-note">💡 {t(s.note)}</div>
            {s.paragraphs.map((x, k) => <p key={k}>{t(x)}</p>)}
            {s.table && <Table tb={s.table} />}
          </details>))}
      </div>}

      {tab === "cases" && <div className="grid g2" style={{ alignItems: "start" }}>
        {d.caseStudies.map((c, i) => (
          <div key={i} className={"hub-tile dd-case" + (c.good ? " good" : " bad")}>
            <div className="row spread"><b>{t(c.title)}</b><span className="badge">{t(c.good ? "What went well" : "What went wrong")}</span></div>
            <div className="small muted">{t(c.sector)}</div>
            <p className="small">{t(c.situation)}</p>
            <ol className="wf-ul">{c.whatHappened.map((x, k) => <li key={k}>{t(x)}</li>)}</ol>
            <div className="small" style={{ marginTop: 6 }}><b>{t("Outcome")}:</b> {t(c.outcome)}</div>
            <div className="wf-sub" style={{ marginTop: 8 }}>{t("Lessons")}</div>
            <ul className="wf-ul">{c.lessons.map((x, k) => <li key={k}>{t(x)}</li>)}</ul>
          </div>))}
      </div>}

      {tab === "variants" && <div className="grid g2" style={{ alignItems: "start" }}>
        {d.variants.map((v, i) => (
          <div key={i} className="hub-tile">
            <b>{t(v.title)}</b><div className="small muted">{t(v.projectType)}</div>
            <ul className="wf-ul" style={{ margin: "6px 0" }}>{v.differences.map((x, k) => <li key={k}>{t(x)}</li>)}</ul>
            <div className="dg-example">{t(v.sample)}</div>
          </div>))}
      </div>}

      {tab === "clauses" && <>
        <input placeholder={t("Search clauses…")} value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 380, marginBottom: 8 }} />
        {topics.map((tp) => { const list = d.clauses.filter((c) => c.topic === tp && (!q || (c.label + " " + c.text + " " + t(c.label) + " " + t(c.text)).toLowerCase().includes(q.toLowerCase()))); return list.length ? (
          <div key={tp} style={{ marginBottom: 10 }}>
            <div className="wf-sub">{t(tp)}</div>
            {list.map((c, i) => { const key = tp + i; return (
              <div key={key} className="dd-clause">
                <div className="row spread"><b className="small">{t(c.label)}</b><button className="small" onClick={() => copy(key, c.text)}>{copied === key ? t("Copied") : t("Copy")}</button></div>
                <div className="small">{t(c.text)}</div>
              </div>); })}
          </div>) : null; })}
      </>}

      {tab === "rubric" && <>
        <div className="small muted" style={{ marginBottom: 8 }}>{t("Score a document against each criterion (0 = poor, 4 = excellent). Weights add up to 100.")}</div>
        <div className="table-wrap"><table className="data hub-table">
          <thead><tr><th>{t("Criterion")}</th><th>{t("Weight")}</th><th>{t("Excellent")}</th><th>{t("Poor")}</th><th>{t("Your score")}</th></tr></thead>
          <tbody>{d.rubric.map((r, i) => <tr key={i}><td><b>{t(r.criterion)}</b></td><td>{r.weight}</td><td className="small">{t(r.excellent)}</td><td className="small">{t(r.poor)}</td>
            <td><select value={score[i] ?? 0} onChange={(e) => setScore({ ...score, [i]: Number(e.target.value) })} style={{ width: 70 }}>{[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</select></td></tr>)}</tbody>
        </table></div>
        <div className="hub-tile" style={{ marginTop: 8 }}><b>{t("Weighted score")}: {Math.round(total)} / 100</b></div>
      </>}
    </div>
  );
}
