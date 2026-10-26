import { StdBadge } from "../components/common";
import { references19650 } from "../../../shared/data/iso19650";
import { references42001 } from "../../../shared/data/iso42001";
import type { Reference, StandardId } from "../../../shared/data/types";

function List({ refs, std }: { refs: Reference[]; std: StandardId }) {
  return (
    <div className="card table-wrap">
      <div style={{ marginBottom: 8 }}><StdBadge std={std} /></div>
      <table className="data">
        <thead><tr><th>Reference</th><th>Publisher</th><th>Notes</th></tr></thead>
        <tbody>{refs.map((r) => (
          <tr key={r.title}><td>{r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.title} ↗</a> : <b>{r.title}</b>}</td><td className="small">{r.publisher}</td><td className="small muted">{r.note}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export default function References() {
  return (
    <>
      <h1>References</h1>
      <p className="muted">Standards and guidance referenced across the portal. Standards must be purchased from ISO or your national standards body; links point to freely available resources only.</p>
      <h2>ISO 19650 and related BIM standards</h2>
      <List refs={references19650} std="iso19650" />
      <h2>ISO/IEC 42001 and related AI standards</h2>
      <List refs={references42001} std="iso42001" />
    </>
  );
}
