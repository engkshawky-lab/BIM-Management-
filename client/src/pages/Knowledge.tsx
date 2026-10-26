import { navigate } from "../App";
import type { StandardId } from "../../../shared/data/types";
import Library from "./Library";
import NamingTool from "./NamingTool";
import References from "./References";
import Templates from "./Templates";

const SECTIONS: { key: string; label: string; only?: StandardId }[] = [
  { key: "library", label: "Library" }, { key: "templates", label: "Templates" },
  { key: "naming", label: "Naming & status codes", only: "iso19650" }, { key: "references", label: "References" },
];

/** One hub for all reference content: pick the standard, then the section. */
export default function Knowledge({ std, section, arg }: { std: StandardId; section?: string; arg?: string }) {
  const sections = SECTIONS.filter((s) => !s.only || s.only === std);
  const cur = sections.some((s) => s.key === section) ? section! : "library";
  return (
    <>
      <div className="row spread" style={{ marginBottom: 6 }}>
        <h1 style={{ margin: 0 }}>Knowledge hub</h1>
        <div className="seg">
          {(["iso19650", "iso42001"] as const).map((s) => <button key={s} className={std === s ? "on" : ""} onClick={() => navigate(`/knowledge/${s}/${SECTIONS.find((x) => x.key === cur && (!x.only || x.only === s)) ? cur : "library"}`)}>{s === "iso19650" ? "ISO 19650 — BIM" : "ISO/IEC 42001 — AI"}</button>)}
        </div>
      </div>
      <div className="tabs">{sections.map((s) => <button key={s.key} className={cur === s.key ? "on" : ""} onClick={() => navigate(`/knowledge/${std}/${s.key}`)}>{s.label}</button>)}</div>
      {cur === "library" && <Library key={std + arg} std={std} initialTab={Number(arg) || 0} />}
      {cur === "templates" && <Templates std={std} focusId={arg} />}
      {cur === "naming" && <NamingTool />}
      {cur === "references" && <References std={std} />}
    </>
  );
}
