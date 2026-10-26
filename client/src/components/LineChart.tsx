import { useState } from "react";

/** Single-series line chart (small multiple): 2px line, recessive grid, crosshair tooltip on hover. */
export function LineChart({ title, points, unit = "", max, height = 140 }: { title: string; points: { x: string; y: number | null }[]; unit?: string; max?: number; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320, H = height, L = 34, R = 8, T = 10, B = 22;
  const vals = points.map((p) => p.y).filter((v): v is number => v !== null);
  const top = max ?? Math.max(1, ...vals) * 1.1;
  const x = (i: number) => L + (points.length <= 1 ? (W - L - R) / 2 : (i / (points.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / top) * (H - T - B);
  const path = points.map((p, i) => (p.y === null ? "" : `${i && points[i - 1]?.y !== null ? "L" : "M"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`)).join("");
  const last = [...points].reverse().find((p) => p.y !== null);
  const ticks = [0, top / 2, top].map((v) => Math.round(v));
  const h = hover !== null ? points[hover] : null;
  return (
    <div className="card chart-card">
      <div className="row spread"><b className="small">{title}</b>{last && <span className="stat" style={{ fontSize: 18 }}>{last.y}{unit}</span>}</div>
      {points.length === 0 ? <p className="small muted">No data yet.</p> : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${title}: latest ${last?.y ?? "—"}${unit}`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; const i = Math.round(((px - L) / (W - L - R)) * (points.length - 1)); setHover(Math.max(0, Math.min(points.length - 1, i))); }}>
          {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} /><text x={L - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">{t}</text></g>)}
          <text x={L} y={H - 6} fontSize="9" fill="var(--muted)">{points[0].x}</text>
          {points.length > 1 && <text x={W - R} y={H - 6} fontSize="9" fill="var(--muted)" textAnchor="end">{points[points.length - 1].x}</text>}
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.length === 1 && points[0].y !== null && <circle cx={x(0)} cy={y(points[0].y)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />}
          {h && h.y !== null && <>
            <line x1={x(hover!)} x2={x(hover!)} y1={T} y2={H - B} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover!)} cy={y(h.y)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
          </>}
        </svg>
      )}
      <div className="tiny muted" style={{ minHeight: 16 }}>{h ? <>{h.x}: <b style={{ color: "var(--text)" }}>{h.y ?? "—"}{unit}</b></> : " "}</div>
    </div>
  );
}
