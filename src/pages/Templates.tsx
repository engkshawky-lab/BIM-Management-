import { useState } from "react";
import { navigate, usePortal } from "../App";
import { StdBadge } from "../components/common";
import { templates } from "../data/templates";
import type { DocTemplate, StandardId } from "../data/types";
import { newDocument } from "../lib/store";

export default function Templates({ std }: { std?: StandardId }) {
  const { setDocs, user, docs } = usePortal();
  const [q, setQ] = useState("");
  const list = templates.filter((t) => (!std || t.standard === std) && (!q || (t.title + t.code + t.purpose + t.category).toLowerCase().includes(q.toLowerCase())));
  const categories = [...new Set(list.map((t) => t.category))];

  const create = (t: DocTemplate) => {
    const d = newDocument(t, user);
    setDocs((all) => [d, ...all]);
    navigate("/builder/" + d.id);
  };

  return (
    <>
      {std && <StdBadge std={std} />}
      <h1>Template library</h1>
      <p className="muted">Structured templates with guidance, pre-filled examples and clause references. Create a controlled document, fill it in, then export to Word or Markdown.</p>
      <input placeholder="Search templates…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 420, margin: "8px 0 4px" }} />
      {categories.map((c) => (
        <div key={c}>
          <h2>{c}</h2>
          <div className="grid g3">
            {list.filter((t) => t.category === c).map((t) => {
              const count = docs.filter((d) => d.templateId === t.id).length;
              return (
                <div key={t.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                  <div className="row spread"><span className="badge">{t.code}</span><StdBadge std={t.standard} /></div>
                  <h3>{t.title}</h3>
                  <p className="small muted" style={{ flex: 1 }}>{t.purpose}</p>
                  <div className="small muted">{t.clauseRefs.join(" · ")} · {t.sections.length} sections</div>
                  <div className="row" style={{ marginTop: 10 }}>
                    <button className="primary" onClick={() => create(t)}>+ New document</button>
                    {count > 0 && <a className="small" href="#/register">{count} existing</a>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
