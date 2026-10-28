import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { GraphicId } from "../../../shared/data/hubs/types";

// Built-in explanatory illustrations for the hubs. Drawn as SVG with theme colours so they read in
// light and dark mode; labels are plain text nodes, so the Arabic layer translates them too.

const C = { blue: "#3b82f6", green: "#16a34a", amber: "#d97706", purple: "#9333ea", red: "#dc2626", teal: "#0d9488" };
const ink = "var(--text)", muted = "var(--muted)", card = "var(--surface-2)";

/**
 * Shrinks any label that is wider than its box (or, outside a box, than the frame) so nothing runs
 * into its neighbours. Runs again whenever the text changes, e.g. when the Arabic layer swaps it.
 */
function fitLabels(svg: SVGSVGElement) {
  const frame = svg.getBoundingClientRect();
  if (!frame.width) return;
  const scale = frame.width / svg.viewBox.baseVal.width;
  const rects = [...svg.querySelectorAll("rect")].map((r) => r.getBoundingClientRect()).filter((r) => r.width > 20 && r.height > 14);
  for (const t of svg.querySelectorAll("text")) {
    const base = Number(t.dataset.fs ?? (t.dataset.fs = String(parseFloat(t.getAttribute("font-size") ?? "12"))));
    t.style.fontSize = base + "px"; t.removeAttribute("textLength"); t.removeAttribute("lengthAdjust");
    const r = t.getBoundingClientRect();
    if (!r.width) continue;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const host = rects.filter((b) => cx > b.left && cx < b.right && cy > b.top && cy < b.bottom).sort((a, b) => a.width * a.height - b.width * b.height)[0];
    const anchor = t.getAttribute("text-anchor") ?? "start";
    const room = host ? host.width - 12 * scale
      : anchor === "middle" ? 2 * Math.min(cx - frame.left, frame.right - cx) - 12 * scale
      : frame.right - r.left - 8 * scale;
    if (r.width <= room) continue;
    const f = Math.max(0.7, room / r.width);
    t.style.fontSize = base * f + "px";
    if (t.getBoundingClientRect().width > room) { t.setAttribute("textLength", String(room / scale)); t.setAttribute("lengthAdjust", "spacingAndGlyphs"); }
  }
}

function Frame({ w, h, children, label }: { w: number; h: number; children: ReactNode; label: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    let raf = 0;
    const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => fitLabels(svg)); };
    run();
    const mo = new MutationObserver(run);
    mo.observe(svg, { characterData: true, childList: true, subtree: true });
    const ro = new ResizeObserver(run);
    ro.observe(svg);
    return () => { cancelAnimationFrame(raf); mo.disconnect(); ro.disconnect(); };
  }, []);
  // Always laid out left to right: labels are positioned by coordinates, and an RTL page would flip their anchors
  return (
    <div className="table-wrap" style={{ borderRadius: 12, background: "var(--surface)", padding: 8 }}>
      <svg ref={ref} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} direction="ltr" style={{ width: "100%", minWidth: Math.min(w, 640), height: "auto", display: "block", direction: "ltr" }} fontFamily="inherit">{children}</svg>
    </div>
  );
}
const Box = ({ x, y, w, h, c, title, sub, filled }: { x: number; y: number; w: number; h: number; c: string; title: string; sub?: string; filled?: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={10} fill={filled ? c : card} stroke={c} strokeWidth={1.5} />
    <text x={x + w / 2} y={y + (sub ? h / 2 - 4 : h / 2 + 5)} textAnchor="middle" fontSize={13} fontWeight={700} fill={filled ? "#fff" : ink}>{title}</text>
    {sub && <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize={11} fill={filled ? "#fff" : muted}>{sub}</text>}
  </g>
);
const Arrow = ({ x1, y1, x2, y2, c = muted }: { x1: number; y1: number; x2: number; y2: number; c?: string }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), s = 7;
  return <g stroke={c} fill={c} strokeWidth={1.5}><line x1={x1} y1={y1} x2={x2 - Math.cos(a) * 3} y2={y2 - Math.sin(a) * 3} />
    <polygon points={`${x2},${y2} ${x2 - s * Math.cos(a - 0.45)},${y2 - s * Math.sin(a - 0.45)} ${x2 - s * Math.cos(a + 0.45)},${y2 - s * Math.sin(a + 0.45)}`} stroke="none" /></g>;
};

/** The same element (a door in a wall) drawn at increasing development. */
function LodProgression() {
  const steps = [
    { lod: "LOD 100", c: C.blue, t: "Concept", s: "Massing / symbol" },
    { lod: "LOD 200", c: C.green, t: "Approximate", s: "Generic size & location" },
    { lod: "LOD 300", c: C.purple, t: "Precise", s: "Specified size, shape, location" },
    { lod: "LOD 350", c: C.amber, t: "Coordinated", s: "Interfaces & connections" },
    { lod: "LOD 400", c: C.red, t: "Fabrication", s: "Detail for manufacture" },
  ];
  return (
    <Frame w={900} h={250} label="LOD progression">
      {steps.map((s, i) => {
        const x = 20 + i * 176, cx = x + 78;
        return (
          <g key={s.lod}>
            <rect x={x} y={10} width={156} height={230} rx={12} fill={card} stroke={s.c} strokeWidth={1.5} />
            <text x={cx} y={34} textAnchor="middle" fontSize={14} fontWeight={800} fill={s.c}>{s.lod}</text>
            <g transform={`translate(${x + 28}, 50)`}>
              {i === 0 && <rect x={10} y={10} width={80} height={110} fill={s.c} opacity={0.25} stroke={s.c} strokeDasharray="5 4" />}
              {i === 1 && <><rect x={0} y={0} width={100} height={130} fill="none" stroke={muted} /><rect x={25} y={30} width={50} height={100} fill={s.c} opacity={0.35} /></>}
              {i >= 2 && <><rect x={0} y={0} width={100} height={130} fill={card} stroke={ink} strokeWidth={1.2} />
                <rect x={22} y={22} width={56} height={108} fill="none" stroke={ink} strokeWidth={1.2} />
                <rect x={27} y={27} width={46} height={103} fill={s.c} opacity={0.3} />
                <circle cx={66} cy={80} r={3} fill={ink} /></>}
              {i >= 3 && <><line x1={22} y1={22} x2={0} y2={22} stroke={C.amber} strokeWidth={3} /><line x1={78} y1={22} x2={100} y2={22} stroke={C.amber} strokeWidth={3} />
                <text x={50} y={16} textAnchor="middle" fontSize={9} fill={C.amber}>frame fixings</text></>}
              {i >= 4 && <><line x1={27} y1={60} x2={73} y2={60} stroke={ink} strokeDasharray="2 2" /><line x1={27} y1={100} x2={73} y2={100} stroke={ink} strokeDasharray="2 2" />
                <rect x={70} y={74} width={6} height={14} fill={ink} /><text x={50} y={146} textAnchor="middle" fontSize={9} fill={muted}>hinges · seals · ironmongery</text></>}
            </g>
            <text x={cx} y={214} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink}>{s.t}</text>
            <text x={cx} y={230} textAnchor="middle" fontSize={10} fill={muted}>{s.s}</text>
          </g>
        );
      })}
    </Frame>
  );
}

/** ISO 7817-1 style: prerequisites set the need; the need is expressed as three kinds of information. */
function LoinFramework() {
  const pre = [["Purpose", "Why is it needed?", C.blue], ["Milestone", "When is it needed?", C.teal], ["Actor", "Who needs and who provides?", C.amber], ["Object", "Which element / system?", C.purple]] as const;
  return (
    <Frame w={900} h={300} label="Level of information need framework">
      <text x={20} y={26} fontSize={12} fontWeight={700} fill={muted}>1. PREREQUISITES</text>
      {pre.map(([t, s, c], i) => <Box key={t} x={20 + i * 220} y={36} w={200} h={58} c={c} title={t} sub={s} />)}
      <Arrow x1={450} y1={98} x2={450} y2={128} />
      <Box x={280} y={128} w={340} h={44} c={C.green} title="Level of information need" sub="for this purpose, milestone, actor and object" filled />
      <Arrow x1={380} y1={172} x2={170} y2={204} /><Arrow x1={450} y1={172} x2={450} y2={204} /><Arrow x1={520} y1={172} x2={730} y2={204} />
      <text x={20} y={198} fontSize={12} fontWeight={700} fill={muted}>2. INFORMATION</text>
      <Box x={40} y={206} w={260} h={80} c={C.blue} title="Geometrical" sub="detail · dimensionality · location · appearance · parametric" />
      <Box x={320} y={206} w={260} h={80} c={C.purple} title="Alphanumerical" sub="identification · information content" />
      <Box x={600} y={206} w={260} h={80} c={C.amber} title="Documentation" sub="certificates · manuals · test reports" />
    </Frame>
  );
}

/** A worked example: a fire door's need at three milestones. */
function LoinExample() {
  const cols = [
    { m: "Concept design", c: C.blue, g: "Symbol / opening only", a: "Fire rating required (e.g. 30 min)", d: "—" },
    { m: "Technical design", c: C.purple, g: "Specified size and swing, LOD 300", a: "FD30S, leaf size, ironmongery set, acoustic rating", d: "Door schedule, fire strategy reference" },
    { m: "Handover", c: C.green, g: "As-installed position", a: "Manufacturer, model, serial, install date, warranty", d: "Fire certificate, O&M manual, inspection regime" },
  ];
  return (
    <Frame w={900} h={290} label="LOIN example for a fire door">
      <text x={20} y={26} fontSize={13} fontWeight={700} fill={ink}>Object: fire door D-03-014 · Actor: architect → contractor → facility manager</text>
      {cols.map((k, i) => {
        const x = 20 + i * 293;
        return (
          <g key={k.m}>
            <rect x={x} y={40} width={277} height={240} rx={12} fill={card} stroke={k.c} strokeWidth={1.5} />
            <rect x={x} y={40} width={277} height={34} rx={12} fill={k.c} />
            <text x={x + 138} y={62} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff">{k.m}</text>
            {[["Geometry", k.g, C.blue], ["Alphanumeric", k.a, C.purple], ["Documentation", k.d, C.amber]].map(([h, v, c], j) => (
              <g key={h}>
                <text x={x + 14} y={98 + j * 62} fontSize={11} fontWeight={700} fill={c}>{h}</text>
                <foreignObject x={x + 14} y={104 + j * 62} width={250} height={48}><div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.35 }}>{v}</div></foreignObject>
              </g>
            ))}
          </g>
        );
      })}
    </Frame>
  );
}

function LodVsLoi() {
  return (
    <Frame w={900} h={230} label="LOD, LOI and LOIN compared">
      <Box x={20} y={20} w={270} h={90} c={C.amber} title="LOD — level of development" sub="mainly geometry, how reliable it is" />
      <Box x={315} y={20} w={270} h={90} c={C.green} title="LOI — level of information" sub="non-graphical data (UK legacy)" />
      <Box x={610} y={20} w={270} h={90} c={C.purple} title="LOIN — level of information need" sub="ISO 7817-1 · purpose-driven, per milestone" filled />
      <Arrow x1={290} y1={65} x2={312} y2={65} /><Arrow x1={585} y1={65} x2={607} y2={65} />
      <text x={450} y={150} textAnchor="middle" fontSize={13} fill={ink}>LOIN does not use fixed numbered levels: it states exactly what geometry, data and documents</text>
      <text x={450} y={170} textAnchor="middle" fontSize={13} fill={ink}>each actor needs, for each purpose, at each milestone — "only what is needed, no more".</text>
      <text x={450} y={205} textAnchor="middle" fontSize={11} fill={muted}>LOD and LOI labels can still be used inside a LOIN specification as shorthand, if the EIR defines them.</text>
    </Frame>
  );
}

function CobieHierarchy() {
  return (
    <Frame w={900} h={330} label="COBie sheet relationships">
      <Box x={370} y={14} w={160} h={44} c={C.blue} title="Facility" filled />
      <Box x={120} y={96} w={150} h={44} c={C.teal} title="Floor" />
      <Box x={120} y={176} w={150} h={44} c={C.teal} title="Space" />
      <Box x={120} y={256} w={150} h={44} c={C.teal} title="Zone" sub="groups spaces" />
      <Box x={620} y={96} w={150} h={44} c={C.purple} title="Type" sub="product spec" />
      <Box x={620} y={176} w={150} h={44} c={C.purple} title="Component" sub="installed item" />
      <Box x={620} y={256} w={150} h={44} c={C.purple} title="System" sub="groups components" />
      <Box x={360} y={96} w={180} h={44} c={C.amber} title="Spare · Resource · Job" sub="operations" />
      <Arrow x1={410} y1={58} x2={230} y2={94} /><Arrow x1={490} y1={58} x2={670} y2={94} />
      <Arrow x1={195} y1={140} x2={195} y2={174} /><Arrow x1={195} y1={220} x2={195} y2={254} />
      <Arrow x1={695} y1={140} x2={695} y2={174} /><Arrow x1={695} y1={220} x2={695} y2={254} />
      <Arrow x1={618} y1={198} x2={274} y2={198} c={C.red} />
      <text x={446} y={190} textAnchor="middle" fontSize={11} fill={C.red}>Component.Space → Space.Name</text>
      <Arrow x1={618} y1={118} x2={544} y2={118} c={C.amber} />
      <text x={450} y={322} textAnchor="middle" fontSize={11} fill={muted}>Contact, Document, Attribute, Coordinate and Issue rows attach to any of these.</text>
    </Frame>
  );
}

function CdeStates() {
  const s = [["Work in progress", C.amber], ["Shared", C.blue], ["Published", C.green], ["Archived", C.purple]] as const;
  const t = ["check · review · approve", "review · authorise", "superseded / closed"];
  return (
    <Frame w={900} h={160} label="CDE states">
      {s.map(([n, c], i) => <Box key={n} x={20 + i * 225} y={30} w={180} h={60} c={c} title={n} filled />)}
      {t.map((x, i) => <g key={x}><Arrow x1={200 + i * 225} y1={60} x2={244 + i * 225} y2={60} /><text x={222 + i * 225} y={115} textAnchor="middle" fontSize={11} fill={muted}>{x}</text></g>)}
    </Frame>
  );
}

function InfraBreakdown() {
  const secs = [["Section A", "Ch 0+000 – 2+500", C.blue], ["Section B", "Ch 2+500 – 5+200", C.green], ["Section C", "Ch 5+200 – 8+000", C.purple]] as const;
  const disc = [["Alignment & earthworks", C.amber], ["Drainage", C.teal], ["Structures", C.red], ["Utilities", C.blue]] as const;
  return (
    <Frame w={900} h={270} label="Breaking down a linear asset">
      <path d="M20 70 C 220 20, 420 120, 620 60 S 860 40, 880 70" fill="none" stroke={muted} strokeWidth={10} strokeLinecap="round" opacity={0.35} />
      <path d="M20 70 C 220 20, 420 120, 620 60 S 860 40, 880 70" fill="none" stroke={ink} strokeWidth={1.5} strokeDasharray="8 6" />
      {[20, 300, 590, 880].map((x, i) => <g key={x}><line x1={x} y1={40} x2={x} y2={100} stroke={ink} /><text x={x} y={118} textAnchor="middle" fontSize={11} fill={muted}>{["0+000", "2+500", "5+200", "8+000"][i]}</text></g>)}
      {secs.map(([n, ch, c], i) => <Box key={n} x={30 + i * 290} y={134} w={270} h={48} c={c} title={n} sub={ch} />)}
      {disc.map(([d, c], i) => <g key={d}><rect x={30 + i * 218} y={200} width={200} height={30} rx={8} fill="none" stroke={c} strokeWidth={1.5} /><text x={130 + i * 218} y={220} textAnchor="middle" fontSize={12} fill={ink}>{d}</text></g>)}
      <text x={450} y={258} textAnchor="middle" fontSize={11} fill={muted}>Containers are split by section (chainage) × discipline, so each one can be authored, checked and handed over on its own.</text>
    </Frame>
  );
}

function McpArchitecture() {
  return (
    <Frame w={900} h={250} label="MCP architecture">
      <Box x={20} y={90} w={190} h={70} c={C.purple} title="AI app (MCP client)" sub="Claude Desktop · Claude Code" filled />
      {[["Revit / APS server", "model data, parameters", C.blue], ["IFC / files server", "IFC, COBie, folders", C.green], ["CDE / project server", "documents, MIDP, issues", C.amber]].map(([t, s, c], i) => (
        <g key={t}><Box x={360} y={20 + i * 78} w={220} h={60} c={c} title={t} sub={s} /><Arrow x1={212} y1={125} x2={358} y2={50 + i * 78} c={c} /></g>
      ))}
      {[["Revit model", C.blue], ["Model files", C.green], ["CDE / database", C.amber]].map(([t, c], i) => (
        <g key={t}><Box x={700} y={28 + i * 78} w={180} h={44} c={c} title={t} /><Arrow x1={582} y1={50 + i * 78} x2={698} y2={50 + i * 78} c={c} /></g>
      ))}
      <text x={285} y={240} textAnchor="middle" fontSize={11} fill={muted}>The client asks; each server exposes tools and data it is allowed to share.</text>
      <text x={640} y={240} textAnchor="middle" fontSize={11} fill={muted}>Servers run locally (stdio) or remotely (HTTP).</text>
    </Frame>
  );
}

/** How an Autodesk MCP connector runs: Claude on the PC, the add-in inside the app, the hub syncing the command library. */
function AutodeskMcpFlow() {
  return (
    <Frame w={920} h={300} label="Autodesk MCP flow">
      <Box x={20} y={40} w={170} h={64} c={C.purple} title="You" sub="prompt in plain language" />
      <Box x={20} y={150} w={170} h={70} c={C.purple} title="Claude Code / Codex" sub="AI agent on your PC" filled />
      <Arrow x1={105} y1={106} x2={105} y2={148} c={C.purple} />
      <Box x={260} y={150} w={180} h={70} c={C.blue} title="MCP connector" sub="one per application" />
      <Arrow x1={192} y1={185} x2={258} y2={185} c={C.blue} />
      <Box x={510} y={150} w={190} h={70} c={C.teal} title="Add-in in the app" sub="pyRevit Routes · .NET API" />
      <Arrow x1={442} y1={185} x2={508} y2={185} c={C.teal} />
      {[["Revit", 20], ["AutoCAD · Civil 3D", 78], ["Plant 3D · Navisworks", 136]].map(([t, y]) => (
        <g key={t as string}><Box x={760} y={(y as number) + 92} w={150} h={44} c={C.green} title={t as string} /><Arrow x1={702} y1={185} x2={758} y2={(y as number) + 114} c={C.green} /></g>
      ))}
      <Box x={260} y={30} w={440} h={70} c={C.amber} title="FirstOption MCP Hub (cloud)" sub="command library · skill tree · reviewed releases · audit log" />
      <Arrow x1={350} y1={148} x2={350} y2={102} c={C.amber} /><Arrow x1={605} y1={102} x2={605} y2={148} c={C.amber} />
      <text x={480} y={128} textAnchor="middle" fontSize={11} fill={muted}>Sync: commands and skills only</text>
      <text x={460} y={256} textAnchor="middle" fontSize={11} fill={muted}>Code runs inside the app as one undo step, with a dry run first. The model stays on the PC;</text>
      <text x={460} y={274} textAnchor="middle" fontSize={11} fill={muted}>the hub never receives model content or prompts.</text>
    </Frame>
  );
}

const GRAPHICS: Record<GraphicId, () => ReactNode> = {
  "lod-progression": LodProgression, "loin-framework": LoinFramework, "loin-example": LoinExample, "lod-vs-loi": LodVsLoi,
  "cobie-hierarchy": CobieHierarchy, "cde-states": CdeStates, "infra-breakdown": InfraBreakdown, "mcp-architecture": McpArchitecture,
  "autodesk-mcp-flow": AutodeskMcpFlow,
};

export function HubGraphic({ id }: { id: GraphicId }) {
  const G = GRAPHICS[id];
  return G ? <G /> : null;
}
