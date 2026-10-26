import { useEffect, useMemo, useState } from "react";
import { DEFAULT_TAG_FORMAT, buildTag, validateTagAuto, type ClientStandardData, type TagFormat } from "../../../shared/standards";
import { api } from "../lib/api";
import { exportCsv } from "../lib/export";
import type { ProjectData } from "./Project";

/** Asset tag builder and bulk checker, using the project's client standard (or the generic format). */
export default function AssetTags({ data }: { data: ProjectData }) {
  const [std, setStd] = useState<{ name: string; data: ClientStandardData } | null | undefined>(undefined);
  const [values, setValues] = useState<Record<string, string>>({});
  const [bulk, setBulk] = useState("");
  useEffect(() => { api<{ standard: { name: string; data: ClientStandardData } | null }>(`/projects/${data.project.id}/standard`).then((r) => setStd(r.standard)); }, [data.project.id]);
  const fmt: TagFormat = std?.data.tag ?? DEFAULT_TAG_FORMAT;
  const tag = buildTag(fmt, values);
  const errors = Object.keys(values).length ? validateTagAuto(tag, fmt) : [];
  const eq = std?.data.classification.find((c) => c.equipmentCode === (values.equipment ?? "").toUpperCase());
  const checked = useMemo(() => bulk.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 5000).map((t) => ({ tag: t, errors: validateTagAuto(t, fmt) })), [bulk, fmt]);
  if (std === undefined) return <p className="muted">Loading…</p>;

  return (
    <>
      <p className="muted">{std ? <>Using the tag format of <b>{std.name}</b>.</> : <>No client standard on this project — using the generic location + equipment format. A manager can apply one in Project settings.</>}</p>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Build a tag</h3>
        {(["location", "equipment"] as const).map((g) => (
          <div key={g} style={{ marginBottom: 10 }}>
            <div className="panel-group-title" style={{ padding: "4px 0" }}>{g === "location" ? "Location tag" : "Equipment tag"}</div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {fmt.parts.filter((p) => p.group === g).map((p) => (
                <div key={p.id}>
                  <label>{p.label} <span className="tiny muted">({Array.isArray(p.length) ? p.length.join("–") : p.length})</span></label>
                  <input list={p.codes?.length ? `codes-${p.id}` : undefined} value={values[p.id] ?? ""} onChange={(e) => setValues({ ...values, [p.id]: e.target.value.toUpperCase() })} className="mono" />
                  {!!p.codes?.length && <datalist id={`codes-${p.id}`}>{p.codes.slice(0, 1500).map((c) => <option key={c} value={c}>{p.id === "equipment" ? std?.data.classification.find((x) => x.equipmentCode === c)?.equipment : p.id === "system" ? std?.data.classification.find((x) => x.systemCode === c)?.system : ""}</option>)}</datalist>}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="code">{tag}</div>
        {errors.length ? <ul className="error small">{errors.map((e) => <li key={e}>{e}</li>)}</ul> : Object.keys(values).length ? <p style={{ color: "var(--ok)" }}>✔ Valid tag</p> : null}
        {eq && <p className="small muted">{eq.equipment} · {eq.system}{eq.uniclassPr && ` · Uniclass ${eq.uniclassPr}`}{eq.ifcEntity && ` · ${eq.ifcEntity}`}</p>}
        <button onClick={() => navigator.clipboard?.writeText(tag).catch(() => undefined)}>Copy tag</button>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row spread"><h3 style={{ margin: 0 }}>Check a list of tags</h3>
          {checked.length > 0 && <button className="small" onClick={() => exportCsv(`${data.project.code}-tag-check`, ["Tag", "Result"], checked.map((c) => [c.tag, c.errors.join(" ") || "OK"]))}>⬇ CSV</button>}</div>
        <p className="small muted">Paste one tag per line (e.g. a column copied from the asset register or COBie TagNumber). Full tags and equipment-only tags are both accepted.</p>
        <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} style={{ minHeight: 120 }} className="mono" />
        {checked.length > 0 && <>
          <p className="small"><b>{checked.filter((c) => !c.errors.length).length}</b> valid · <b style={{ color: "var(--danger)" }}>{checked.filter((c) => c.errors.length).length}</b> invalid · {new Set(checked.map((c) => c.tag)).size < checked.length && <span className="error">duplicates found</span>}</p>
          <div className="table-wrap" style={{ maxHeight: 320, overflow: "auto" }}><table className="data"><tbody>
            {checked.filter((c) => c.errors.length).slice(0, 300).map((c, i) => <tr key={i}><td className="mono small">{c.tag}</td><td className="small error">{c.errors.join(" ")}</td></tr>)}
          </tbody></table></div>
        </>}
      </div>
    </>
  );
}
