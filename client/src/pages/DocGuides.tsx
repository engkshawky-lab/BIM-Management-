import { useState, type CSSProperties, type ReactNode } from "react";
import { t } from "../i18n";
import { DOC_GUIDES, guideByCode, guideById } from "../../../shared/data/docGuides";
import type { DocGuide } from "../../../shared/data/docGuides/types";
import { WF_STAGES } from "../../../shared/data/workflow/stages";
import { ROLE_TITLES, type StageId } from "../../../shared/data/workflow/types";
import { generateHref } from "./AiTools";
import { TONES } from "./HubPage";

// Document guides: what each ISO 19650 document is, who writes and approves it, what goes in each
// section, how to create it and how to check it. /doc-guides and /doc-guides/:templateId

const PHASES: { id: string; title: string; hint: string; stages: StageId[] }[] = [
  { id: "requirements", title: "Requirements & standards", hint: "Set by the client before tender", stages: ["need", "tender"] },
  { id: "appointment", title: "Tender & appointment", hint: "How the delivery team responds and commits", stages: ["response", "appointment"] },
  { id: "delivery", title: "Delivery", hint: "Planning, producing and checking information", stages: ["mobilisation", "design", "construction", "delivery"] },
  { id: "closeout", title: "Handover & close-out", hint: "Transferring information and learning", stages: ["handover", "operation"] },
];
const phaseOf = (g: DocGuide) => PHASES.find((p) => p.stages.includes(g.stages[0]))?.id ?? "delivery";
const stageTitle = (id: StageId) => WF_STAGES.find((s) => s.id === id)?.title ?? id;
const load = <T,>(key: string, fallback: T): T => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } };
const store = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } };

const Box = ({ title, id, children }: { title: string; id?: string; children: ReactNode }) => <div className="hub-card" id={id}><div className="hub-title">{t(title)}</div>{children}</div>;

function DocChip({ code }: { code: string }) {
  const g = guideByCode(code);
  return g ? <a className="dg-chip" href={`#/doc-guides/${g.id}`} title={t(g.name)}>{code}</a> : <span className="dg-chip plain">{code}</span>;
}

// ---------------------------------------------------------------- index

function Index() {
  const [q, setQ] = useState("");
  const match = (g: DocGuide) => !q || [g.code, g.name, g.oneLiner, t(g.name), t(g.oneLiner)].join(" ").toLowerCase().includes(q.toLowerCase());
  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">ISO 19650 · {t("DOCUMENT GUIDES")}</div><h1>{t("Every document, explained")}</h1>
        <p>{t("What each document is, who writes and approves it, what goes in each section, how to create it step by step, and what to check before you issue it.")}</p>
        <div className="facts"><span>{DOC_GUIDES.length} {t("documents")}</span><span>{DOC_GUIDES.reduce((a, g) => a + g.sections.length, 0)} {t("sections explained")}</span><span>{DOC_GUIDES.reduce((a, g) => a + g.checklist.length, 0)} {t("quality checks")}</span></div>
      </div>
      <input placeholder={t("Search documents…")} value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 420 }} />
      <div className="dg-phases">
        {PHASES.map((p, n) => { const list = DOC_GUIDES.filter((g) => phaseOf(g) === p.id && match(g)); return (
          <section key={p.id} className="dg-phase">
            <div className="dg-phase-head"><span className="wf-step-n">{n + 1}</span><span><b>{t(p.title)}</b><small>{t(p.hint)}</small></span></div>
            {list.map((g) => (
              <a key={g.id} className="dg-card" href={`#/doc-guides/${g.id}`}>
                <span className="dg-code">{g.code}</span>
                <span className="dg-card-text"><b>{t(g.name)}</b><small>{t(g.oneLiner)}</small>
                  <small className="dg-who">{t(ROLE_TITLES[g.writer])} → {t(ROLE_TITLES[g.approver])}</small></span>
              </a>))}
            {!list.length && <p className="small muted">{t("No document matches.")}</p>}
          </section>); })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- one guide

function Guide({ g }: { g: DocGuide }) {
  const key = `bim:doc-check:${g.id}`;
  const [done, setDone] = useState<number[]>(() => load(key, []));
  const toggle = (i: number) => { const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i]; setDone(next); store(key, next); };
  const i = DOC_GUIDES.indexOf(g);
  const prev = DOC_GUIDES[i - 1], next = DOC_GUIDES[i + 1];
  const toc = [["dg-what", "What and why"], ["dg-who", "Who and when"], ["dg-chain", "Document chain"], ["dg-sections", "Section by section"], ["dg-how", "How to create it"], ["dg-check", "Quality checklist"], ["dg-mistakes", "Common mistakes"]];
  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero">
        <div className="row" style={{ flexWrap: "nowrap", gap: 18, alignItems: "center", position: "relative", zIndex: 1 }}>
          <div className="dg-hero-code">{g.code}</div>
          <div><div className="eyebrow">{t(g.iso)}</div><h1>{t(g.name)}</h1><p>{t(g.oneLiner)}</p></div>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 12, position: "relative", zIndex: 1 }}>
          <a className="btn" href={`#/knowledge/iso19650/templates/${g.id}`}>{t("Open the template")} →</a>
          <a className="btn" href={generateHref(g.name)}>{t("Draft it with AI")} →</a>
          {g.tools.map((x) => <a key={x.path} className="btn" href={"#" + x.path}>{t(x.label)} →</a>)}
        </div>
      </div>
      <nav className="dg-toc" aria-label={t("On this page")}>
        <a href="#/doc-guides">← {t("All documents")}</a>
        {toc.map(([id, label]) => <button key={id} className="linklike" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}>{t(label)}</button>)}
      </nav>

      <div className="grid g2" id="dg-what">
        <div className="hub-tile"><b>{t("What it is")}</b><div style={{ marginTop: 4 }}>{t(g.what)}</div></div>
        <div className="hub-tile" style={{ "--c": "var(--warn)" } as CSSProperties}><b>{t("Why it matters")}</b><div style={{ marginTop: 4 }}>{t(g.why)}</div></div>
      </div>

      <Box title="Who and when" id="dg-who">
        <div className="dg-who-grid">
          <div><div className="wf-sub">{t("Written by")}</div><a className="dg-role" href={`#/workflow/roles/${g.writer}`}>{t(ROLE_TITLES[g.writer])}</a></div>
          <div><div className="wf-sub">{t("Approved by")}</div><a className="dg-role" href={`#/workflow/roles/${g.approver}`}>{t(ROLE_TITLES[g.approver])}</a></div>
          <div><div className="wf-sub">{t("Contributors")}</div><div className="row" style={{ gap: 6 }}>{g.contributors.map((r) => <a key={r} className="dg-role" href={`#/workflow/roles/${r}`}>{t(ROLE_TITLES[r])}</a>)}</div></div>
          <div><div className="wf-sub">{t("Stages")}</div><div className="row" style={{ gap: 6 }}>{g.stages.map((s) => <a key={s} className="dg-role" href={`#/workflow/project/${s}`}>{t(stageTitle(s))}</a>)}</div></div>
        </div>
      </Box>

      <Box title="Document chain" id="dg-chain">
        <div className="dg-chain">
          <div className="dg-chain-col"><div className="wf-sub">{t("Draws on")}</div><div className="row" style={{ gap: 6 }}>{g.inputs.length ? g.inputs.map((c) => <DocChip key={c} code={c} />) : <span className="small muted">—</span>}</div></div>
          <span className="dg-arrow">→</span>
          <div className="dg-chain-col dg-this"><span className="dg-code">{g.code}</span><b>{t(g.name)}</b></div>
          <span className="dg-arrow">→</span>
          <div className="dg-chain-col"><div className="wf-sub">{t("Feeds")}</div><div className="row" style={{ gap: 6 }}>{g.feeds.length ? g.feeds.map((c) => <DocChip key={c} code={c} />) : <span className="small muted">—</span>}</div></div>
        </div>
      </Box>

      <Box title="What to write, section by section" id="dg-sections">
        {g.sections.map((s, n) => (
          <details key={n} className="clause" open={n === 0}>
            <summary><span className="badge" style={{ marginInlineEnd: 8 }}>{n + 1}</span><b>{t(s.title)}</b></summary>
            <p style={{ margin: "6px 0" }}>{t(s.whatToWrite)}</p>
            <div className="dg-example"><span className="wf-sub">{t("Example")}</span><div>{t(s.example)}</div></div>
          </details>))}
      </Box>

      <div className="grid g2" style={{ alignItems: "start" }}>
        <Box title="How to create it" id="dg-how">
          <ol className="wf-list">{g.howTo.map((h, n) => <li key={n}>{t(h.step)}{h.tip && <div className="small muted" style={{ marginTop: 2 }}>💡 {t(h.tip)}</div>}</li>)}</ol>
        </Box>
        <Box title={`${t("Quality checklist")} · ${done.length}/${g.checklist.length}`} id="dg-check">
          <div className="progress" style={{ marginBottom: 8 }}><div style={{ width: `${Math.round((done.length / Math.max(1, g.checklist.length)) * 100)}%`, background: "var(--ok)" }} /></div>
          {g.checklist.map((x, n) => <label key={n} className={"hub-check small" + (done.includes(n) ? " done" : "")}><input type="checkbox" checked={done.includes(n)} onChange={() => toggle(n)} style={{ marginTop: 2 }} /><span>{t(x)}</span></label>)}
          <div className="tiny muted">{t("Ticks are saved in this browser.")}</div>
        </Box>
      </div>

      <Box title="Common mistakes" id="dg-mistakes">
        <div className="table-wrap"><table className="data hub-table"><thead><tr><th style={{ width: "45%" }}>✗ {t("Mistake")}</th><th>✓ {t("Fix")}</th></tr></thead>
          <tbody>{g.mistakes.map((m, n) => <tr key={n}><td style={{ color: "var(--danger)" }}>{t(m.mistake)}</td><td>{t(m.fix)}</td></tr>)}</tbody></table></div>
      </Box>

      <div className="row spread">
        {prev ? <a className="btn" href={`#/doc-guides/${prev.id}`}>← {prev.code} · {t(prev.name)}</a> : <span />}
        {next && <a className="btn primary" href={`#/doc-guides/${next.id}`}>{next.code} · {t(next.name)} →</a>}
      </div>
      <p className="tiny muted">{t("Paraphrased guidance, not the standard's text. Adapt it to your appointment and project information standard.")}</p>
    </div>
  );
}

export default function DocGuides({ id }: { id?: string }) {
  const g = id ? guideById(id) : undefined;
  return g ? <Guide key={g.id} g={g} /> : <Index />;
}
