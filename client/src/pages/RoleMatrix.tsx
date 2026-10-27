import { useState, type CSSProperties } from "react";
import type { HubBlock, RoleDoc } from "../../../shared/data/hubs/types";
import { templates } from "../../../shared/data/templates";
import { TONES } from "./hubTheme";

// Stage × party grid of document cards. Filters narrow it to one party or stage; clicking a card shows its detail.

type Matrix = Extract<HubBlock, { kind: "rolematrix" }>;
const cv = (c: string) => ({ "--c": c }) as CSSProperties;

export function RoleMatrix({ b }: { b: Matrix }) {
  const [party, setParty] = useState("");
  const [stage, setStage] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<RoleDoc | null>(null);
  const color = (p: string) => TONES[b.parties.find((x) => x.id === p)?.tone ?? "blue"];
  const term = q.trim().toLowerCase();
  const show = (d: RoleDoc) => (!party || d.party === party) && (!stage || d.stage === stage) && (!term || `${d.name} ${d.summary} ${d.purpose}`.toLowerCase().includes(term));
  const parties = b.parties.filter((p) => !party || p.id === party);
  const stages = b.stages.filter((s) => !stage || s.id === stage);
  const count = b.docs.filter(show).length;
  const tpl = sel?.template ? templates.find((t) => t.code === sel.template) : undefined;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="row">
        <div className="proc-lanes" style={{ margin: 0 }}>
          <button className={!party ? "on" : ""} style={cv("var(--hub)")} onClick={() => setParty("")}>All parties</button>
          {b.parties.map((p) => <button key={p.id} className={party === p.id ? "on" : ""} style={cv(TONES[p.tone])} onClick={() => setParty(party === p.id ? "" : p.id)}>{p.label}</button>)}
        </div>
      </div>
      <div className="row">
        <span className="small muted">Stage:</span>
        <button className={"chip" + (!stage ? " on" : "")} onClick={() => setStage("")}>All stages</button>
        {b.stages.map((s) => <button key={s.id} className={"chip" + (stage === s.id ? " on" : "")} onClick={() => setStage(stage === s.id ? "" : s.id)}>{s.clause.replace(/^ISO 19650-2 /, "")} {s.label}</button>)}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a document…" style={{ width: 200, marginInlineStart: "auto" }} />
      </div>
      <div className="small muted">{count} documents · click any document for its purpose and required content</div>
      <div className="table-wrap">
        <table className="data hub-table" style={{ minWidth: 640 }}>
          <thead><tr><th style={{ width: 150 }}>ISO 19650-2 stage</th>{parties.map((p) => <th key={p.id} style={{ color: TONES[p.tone], borderBottom: `3px solid ${TONES[p.tone]}` }}>{p.label}</th>)}</tr></thead>
          <tbody>{stages.map((s) => (
            <tr key={s.id}>
              <td style={{ verticalAlign: "top" }}><div className="small" style={{ color: "var(--hub)", fontWeight: 700 }}>{s.clause.replace(/^ISO 19650-2 /, "Cl. ")}</div><b>{s.label}</b></td>
              {parties.map((p) => { const docs = b.docs.filter((d) => d.stage === s.id && d.party === p.id && show(d)); return (
                <td key={p.id} style={{ verticalAlign: "top" }}>
                  {docs.length ? <div style={{ display: "grid", gap: 6 }}>{docs.map((d) => (
                    <button key={d.name} onClick={() => setSel(sel === d ? null : d)} className="proc-step" style={{ ...cv(color(p.id)), flex: "none", width: "100%", ...(sel === d ? {} : {}) }}>
                      <b style={{ fontSize: 12.5 }}>{d.name}</b><small>{d.summary}</small>
                    </button>))}</div> : <span className="small muted">—</span>}
                </td>); })}
            </tr>))}</tbody>
        </table>
      </div>
      {sel && <div className="proc-detail" style={cv(color(sel.party))}>
        <div className="row spread"><div><h3>{sel.name}</h3><div className="small muted">{b.parties.find((p) => p.id === sel.party)?.label} · {b.stages.find((s) => s.id === sel.stage)?.label} · {sel.clause}</div></div>
          <div className="row">{tpl && <a href={`#/knowledge/${tpl.standard}/templates/${tpl.id}`}><button className="primary">Open the {tpl.code} template</button></a>}<button className="ghost" onClick={() => setSel(null)}>Close</button></div></div>
        <p>{sel.purpose}</p>
        <div className="hub-title" style={cv(color(sel.party))}>What it must contain</div>
        <ul style={{ margin: 0 }}>{sel.keyContent.map((k, i) => <li key={i} style={{ marginBottom: 3 }}>{k}</li>)}</ul>
      </div>}
    </div>
  );
}
