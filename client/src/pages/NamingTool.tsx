import { useState } from "react";
import { StdBadge } from "../components/common";
import { namingFields, roleCodes, suitabilityCodes, typeCodes } from "../../../shared/data/iso19650";

const RULES: Record<string, RegExp> = {
  project: /^[A-Z0-9]{2,6}$/, originator: /^[A-Z0-9]{3,6}$/, volume: /^[A-Z0-9]{1,2}$/, level: /^[A-Z0-9]{2}$/,
  type: /^[A-Z0-9]{2}$/, role: /^[A-Z]{1,2}$/, number: /^\d{4,6}$/,
};

export default function NamingTool() {
  const [v, setV] = useState<Record<string, string>>(Object.fromEntries(namingFields.map((f) => [f.id, f.example])));
  const [check, setCheck] = useState("");
  const name = namingFields.map((f) => v[f.id]).join("-");
  const errors = namingFields.filter((f) => !RULES[f.id].test(v[f.id] ?? ""));

  const parts = check.trim().toUpperCase().split("-");
  const checkResult = check.trim()
    ? parts.length !== namingFields.length
      ? [`Expected ${namingFields.length} fields separated by "-", found ${parts.length}.`]
      : namingFields.flatMap((f, i) => (RULES[f.id].test(parts[i]) ? [] : [`${f.label} "${parts[i]}" is invalid (${f.hint}).`]))
    : null;

  return (
    <>
      <StdBadge std="iso19650" />
      <h1>Naming convention & status codes</h1>
      <p className="muted">Build and validate information container names using the BS EN ISO 19650-2 UK National Annex field structure. Adjust rules to your project information standard.</p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Generator</h3>
        <div className="grid g4">
          {namingFields.map((f) => (
            <div key={f.id}>
              <label>{f.label} <span className="muted small">({f.hint})</span></label>
              {f.id === "type" || f.id === "role" ? (
                <select value={v[f.id]} onChange={(e) => setV({ ...v, [f.id]: e.target.value })}>
                  {(f.id === "type" ? typeCodes : roleCodes).map((c) => { const code = c.split(" – ")[0]; return <option key={code} value={code}>{c}</option>; })}
                </select>
              ) : (
                <input value={v[f.id]} onChange={(e) => setV({ ...v, [f.id]: e.target.value.toUpperCase() })} style={{ borderColor: RULES[f.id].test(v[f.id]) ? undefined : "var(--danger)" }} />
              )}
            </div>
          ))}
        </div>
        <label>Result</label>
        <div className="row"><div className="code" style={{ flex: 1 }}>{name}</div><button onClick={() => navigator.clipboard?.writeText(name)}>Copy</button></div>
        {errors.length > 0 && <p style={{ color: "var(--danger)" }}>Invalid fields: {errors.map((e) => e.label).join(", ")}</p>}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Validator</h3>
        <input placeholder="Paste a container name, e.g. PRJ01-ABC-ZZ-01-DR-A-0001" value={check} onChange={(e) => setCheck(e.target.value)} />
        {checkResult && (checkResult.length === 0
          ? <p style={{ color: "var(--ok)" }}>✔ Name conforms to the field structure.</p>
          : <ul style={{ color: "var(--danger)" }}>{checkResult.map((r) => <li key={r}>{r}</li>)}</ul>)}
      </div>

      <h2>Status (suitability) codes</h2>
      <div className="card table-wrap">
        <table className="data"><thead><tr><th>Code</th><th>CDE state</th><th>Description</th></tr></thead>
          <tbody>{suitabilityCodes.map((c) => <tr key={c.code}><td><b>{c.code}</b></td><td>{c.state}</td><td>{c.desc}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
