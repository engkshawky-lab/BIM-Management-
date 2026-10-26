import { useState } from "react";
import { StateTag } from "../components/common";
import { cdeStates, glossary19650, parts19650, process19650, suitabilityCodes } from "../../../shared/data/iso19650";
import { aiInBimUseCases, annexA42001, clauses42001, glossary42001 } from "../../../shared/data/iso42001";
import type { Clause, GlossaryTerm, StandardId } from "../../../shared/data/types";

const match = (q: string, ...s: (string | undefined)[]) => !q || s.some((x) => x?.toLowerCase().includes(q.toLowerCase()));

function ClauseTree({ clauses, q }: { clauses: Clause[]; q: string }) {
  return (
    <>
      {clauses.map((c) => {
        const kids = (c.children ?? []).filter((k) => match(q, k.id, k.title, k.summary));
        if (q && !kids.length && !match(q, c.title, c.summary)) return null;
        return (
          <details key={c.id} className="clause" open={!!q}>
            <summary>{c.id} — {c.title}</summary>
            <div>
              <p className="muted">{c.summary}</p>
              {(q ? kids : c.children ?? []).map((k) => (
                <div key={k.id} className="sub">
                  <b>{k.id}</b> {k.title}
                  <div className="small muted">{k.summary}</div>
                  {k.outputs && <div className="small">Outputs: {k.outputs.map((o) => <span key={o} className="badge" style={{ marginRight: 4 }}>{o}</span>)}</div>}
                </div>
              ))}
            </div>
          </details>
        );
      })}
    </>
  );
}

function Glossary({ terms, q }: { terms: GlossaryTerm[]; q: string }) {
  return (
    <div className="card table-wrap">
      <table className="data">
        <thead><tr><th style={{ width: "30%" }}>Term</th><th>Definition</th></tr></thead>
        <tbody>
          {terms.filter((t) => match(q, t.term, t.abbr, t.definition)).map((t) => (
            <tr key={t.term}><td><b>{t.abbr ?? ""}</b> {t.abbr && "—"} {t.term}</td><td>{t.definition}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Library({ std }: { std: StandardId }) {
  const tabs = std === "iso19650"
    ? ["Parts of the series", "Delivery process (19650-2)", "CDE & status codes", "Glossary"]
    : ["Clauses 4–10", "Annex A controls", "AI in BIM", "Glossary"];
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");
  const t = Math.min(tab, tabs.length - 1);

  return (
    <>
      <h2 style={{ marginTop: 4 }}>{std === "iso19650" ? "ISO 19650 knowledge library" : "ISO/IEC 42001 knowledge library"}</h2>
      <p className="muted">
        {std === "iso19650"
          ? "Information management using building information modelling across the asset life cycle."
          : "Requirements for establishing, implementing, maintaining and improving an AI management system (AIMS)."}
        {" "}Summaries are paraphrased for guidance; always refer to the licensed standard.
      </p>
      <div className="seg sub-nav no-print">{tabs.map((x, i) => <button key={x} className={i === t ? "on" : ""} onClick={() => setTab(i)}>{x}</button>)}</div>
      <input placeholder="Search this section…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12, maxWidth: 420 }} />

      {std === "iso19650" && t === 0 && (
        <div className="grid g2">
          {parts19650.filter((p) => match(q, p.title, p.scope, ...p.keyTopics)).map((p) => (
            <div key={p.id} className="card">
              <div className="row spread"><b>{p.title}</b><span className="badge">{p.year}</span></div>
              <p className="muted">{p.scope}</p>
              <div className="row">{p.keyTopics.map((k) => <span key={k} className="badge">{k}</span>)}</div>
            </div>
          ))}
        </div>
      )}
      {std === "iso19650" && t === 1 && <ClauseTree clauses={process19650} q={q} />}
      {std === "iso19650" && t === 2 && (
        <>
          <div className="grid g4">
            {cdeStates.map((s) => <div key={s.id} className="card"><StateTag state={s.id} /><h3>{s.title}</h3><p className="small muted">{s.desc}</p></div>)}
          </div>
          <h2>Suitability codes (UK National Annex)</h2>
          <div className="card table-wrap">
            <table className="data"><thead><tr><th>Code</th><th>CDE state</th><th>Description</th></tr></thead>
              <tbody>{suitabilityCodes.filter((c) => match(q, c.code, c.desc)).map((c) => <tr key={c.code}><td><b>{c.code}</b></td><td><StateTag state={c.state} /></td><td>{c.desc}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="small muted">Check: approve for sharing (5.6.4) → authorize (5.7.2) → accept (5.7.4). See <a href="#/knowledge/iso19650/naming">naming & status tool</a>.</p>
        </>
      )}
      {std === "iso19650" && t === 3 && <Glossary terms={glossary19650} q={q} />}

      {std === "iso42001" && t === 0 && <ClauseTree clauses={clauses42001} q={q} />}
      {std === "iso42001" && t === 1 && (
        <>
          <p className="muted small">38 controls across 9 objectives. Determine applicability in the <a href="#/knowledge/iso42001/templates">Statement of Applicability template</a>.</p>
          {annexA42001.map((g) => {
            const cs = g.controls.filter((c) => match(q, c.id, c.title, c.objective, g.title));
            if (!cs.length) return null;
            return (
              <details key={g.id} className="clause" open={!!q}>
                <summary>{g.id} — {g.title} <span className="badge">{g.controls.length}</span></summary>
                <div>{cs.map((c) => <div key={c.id} className="sub"><b>{c.id}</b> {c.title}<div className="small muted">{c.objective}</div></div>)}</div>
              </details>
            );
          })}
        </>
      )}
      {std === "iso42001" && t === 2 && (
        <>
          <p className="muted">Where AI is used in BIM workflows, both management systems apply: ISO 19650 governs the information, ISO/IEC 42001 governs the AI that produces or processes it.</p>
          <div className="card table-wrap">
            <table className="data"><thead><tr><th>AI use case in BIM</th><th>Indicative risk</th><th>Control approach</th></tr></thead>
              <tbody>{aiInBimUseCases.filter((u) => match(q, u.title, u.note)).map((u) => <tr key={u.title}><td>{u.title}</td><td><span className="badge">{u.risk}</span></td><td>{u.note}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
      {std === "iso42001" && t === 3 && <Glossary terms={glossary42001} q={q} />}
    </>
  );
}
