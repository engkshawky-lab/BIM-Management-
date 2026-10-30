import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSession } from "../../App";
import { t } from "../../i18n";
import { api } from "../../lib/api";
import { exportCsv } from "../../lib/export";
import { saveMarkdownDocx } from "../../lib/mdDocx";
import { formatMsg } from "../../../../shared/namingCheck";
import { nextTransmittalNumber, parseTransmittalList, transmittalCsvRows, transmittalMarkdown, type TransmittalRow } from "../../../../shared/transmittal";
import "./comms.css";

// Transmittals & correspondence: (a) a transmittal builder that checks container names and suggests the purpose
// of issue from each status code (no AI needed), and (b) an AI writer for RFIs, rejections, non-conformance
// notices, reminders, transmittal cover notes and general letters.

const USED_KEY = "comms.transmittals.used";
const readUsed = (): string[] => { try { return JSON.parse(localStorage.getItem(USED_KEY) || "[]") as string[]; } catch { return []; } };
const markUsed = (n: string) => { try { const u = readUsed(); if (!u.includes(n)) localStorage.setItem(USED_KEY, JSON.stringify([...u, n].slice(-500))); } catch { /* storage unavailable */ } };

const KINDS = [
  { id: "rfi", label: "RFI" },
  { id: "rejection", label: "Model or document rejection" },
  { id: "nonconformance", label: "Non-conformance notice" },
  { id: "reminder", label: "Overdue information reminder" },
  { id: "transmittal-cover", label: "Transmittal cover note" },
  { id: "general", label: "General" },
] as const;
type Kind = (typeof KINDS)[number]["id"];

const HINTS: Record<Kind, string> = {
  rfi: "What do you need to know, why, what it affects and by when?",
  rejection: "Which container(s) and revision, which acceptance criteria failed (naming, metadata, LOIN, standards, coordination) and what must be resubmitted?",
  nonconformance: "Which requirement (EIR, BEP, information standard) was not met, what was found and what corrective action is needed?",
  reminder: "Which information is overdue, the planned date in the TIDP/MIDP and the impact of the delay.",
  "transmittal-cover": "What is being issued, why, and any limitations on its use.",
  general: "Describe what the letter or email needs to say.",
};

function useAiEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  return enabled;
}

const SAMPLE = "PRJ01-ABC-ZZ-00-DR-A-0001.pdf\tS3\tP02\tGround floor plan\nPRJ01-ABC-ZZ-01-DR-A-0002-S3-P02.pdf\nPRJ01-ABC-ZZ-ZZ-M3-A-0001.ifc, S1, P05, Architectural model";

const rowRef = (r: TransmittalRow) => [r.name, r.status, r.revision, r.purpose].filter(Boolean).join(" · ");

export default function Correspondence() {
  const { toast, user } = useSession();
  const ai = useAiEnabled();
  const today = new Date().toISOString().slice(0, 10);

  // ---------------------------------------------------------------- transmittal builder
  const [h, setH] = useState({ project: "", from: user.organization || "", to: "", date: today, reason: "", notes: "" });
  const [number, setNumber] = useState("");
  const [names, setNames] = useState("");
  const [used, setUsed] = useState<string[]>(readUsed);
  const suggested = nextTransmittalNumber(h.project, used);
  const trn = number.trim() || suggested;
  const rows = useMemo(() => parseTransmittalList(names, { projectCode: h.project }), [names, h.project]);
  const invalid = rows.filter((r) => !r.valid).length;
  const header = { ...h, number: trn };
  const md = () => transmittalMarkdown(header, rows);
  const base = trn.replace(/[^\w.-]+/g, "_");
  const record = () => { markUsed(trn); setUsed(readUsed()); };

  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast(t("Copied to the clipboard.")); } catch { toast(t("Could not copy. Select the text and copy it manually."), "error"); }
  };
  const transmittalText = () => [
    `Transmittal ${trn}`, `Project: ${h.project}`, `From: ${h.from}`, `To: ${h.to}`, `Date: ${h.date}`, `Reason for issue: ${h.reason}`, "",
    ...rows.map((r, i) => `${i + 1}. ${r.name}${r.title ? ` — ${r.title}` : ""}  ${r.status} ${r.revision}  ${r.purpose}`),
  ].join("\n");

  // ---------------------------------------------------------------- AI correspondence writer
  const [kind, setKind] = useState<Kind>("rfi");
  const [w, setW] = useState({ to: "", from: user.name || "", project: "", context: "" });
  const [useRows, setUseRows] = useState(false);
  const [busy, setBusy] = useState(false);
  const [letter, setLetter] = useState<{ subject: string; body: string; isoRefs: string[] } | null>(null);

  const draft = async () => {
    if (w.context.trim().length < 10) return toast(t("Describe the situation first."), "error");
    setBusy(true);
    try {
      const refs = useRows && rows.length ? [`Transmittal ${trn}`, ...rows.map(rowRef)] : undefined;
      const r = await api<{ subject: string; body: string; isoRefs: string[]; truncated?: boolean }>("/ai/tools/correspondence", {
        body: { kind, context: w.context.slice(0, 20_000), to: w.to || undefined, from: w.from || undefined, project: w.project || undefined, refs },
      });
      setLetter({ subject: r.subject, body: r.body, isoRefs: r.isoRefs ?? [] });
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const letterMd = () => letter ? [`**${letter.subject}**`, "", [w.project && `Project: ${w.project}`, w.to && `To: ${w.to}`, w.from && `From: ${w.from}`, `Date: ${today}`].filter(Boolean).join("<br>"), "", letter.body].join("\n") : "";
  const letterName = () => (letter?.subject || "Letter").replace(/[^\w.-]+/g, "_").slice(0, 80);

  const fillFromTransmittal = () => {
    setW({ ...w, to: w.to || h.to, project: w.project || h.project });
    setUseRows(true);
    if (kind !== "transmittal-cover" && kind !== "rejection") setKind("transmittal-cover");
  };

  return (
    <div className="comms">
      {/* (a) Transmittal builder */}
      <div className="hub-card">
        <div className="hub-title">Transmittal builder</div>
        <p className="small muted" style={{ marginBlockStart: 0 }}>Paste container names, one per line. Add the status and revision as columns (tab or comma) or as the last fields of the name. Each name is checked against ISO 19650 naming and the purpose of issue is taken from its status code.</p>
        <div className="grid g3" style={{ marginBlockEnd: 10 }}>
          <label className="field"><span>Project code</span><input value={h.project} onChange={(e) => setH({ ...h, project: e.target.value })} placeholder={t("e.g. PRJ01")} /></label>
          <label className="field"><span>From</span><input value={h.from} onChange={(e) => setH({ ...h, from: e.target.value })} placeholder={t("Issuing organisation")} /></label>
          <label className="field"><span>To</span><input value={h.to} onChange={(e) => setH({ ...h, to: e.target.value })} placeholder={t("Receiving organisation")} /></label>
          <label className="field"><span>Date</span><input type="date" value={h.date} onChange={(e) => setH({ ...h, date: e.target.value })} /></label>
          <label className="field"><span>Transmittal no.</span><input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={suggested} /></label>
          <label className="field"><span>Reason for issue</span><input value={h.reason} onChange={(e) => setH({ ...h, reason: e.target.value })} placeholder={t("e.g. Stage 3 design review")} /></label>
        </div>
        <label className="field"><span>Container names</span>
          <textarea className="comms-notes" style={{ minBlockSize: 160 }} value={names} onChange={(e) => setNames(e.target.value)} placeholder={SAMPLE} /></label>
        <label className="field" style={{ marginBlockStart: 10 }}><span>Notes (optional)</span>
          <textarea value={h.notes} onChange={(e) => setH({ ...h, notes: e.target.value })} style={{ minBlockSize: 50 }} /></label>
        <div className="row" style={{ marginBlockStart: 8 }}>
          <button className="small ghost" onClick={() => setNames(SAMPLE)}>Try an example</button>
          {rows.length > 0 && <span className="small muted">{rows.length} containers</span>}
          {rows.length > 0 && (invalid ? <span className="badge" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>{invalid} with problems</span> : <span className="badge" style={{ color: "var(--ok)", borderColor: "var(--ok)" }}>All names pass</span>)}
        </div>
      </div>

      {rows.length > 0 && <div className="hub-card">
        <div className="row spread">
          <div className="hub-title" style={{ marginBlockEnd: 0 }}>Schedule of containers</div>
          <div className="actions-bar">
            {/* the Word export uses the first top-level heading as a title it skips, so demote it to keep it visible */}
            <button className="small" onClick={() => { saveMarkdownDocx(md().replace(/^# /, "## "), base); record(); }}>Download Word</button>
            <button className="small" onClick={() => { const c = transmittalCsvRows(rows); exportCsv(base, c.header, c.rows); record(); }}>Download CSV</button>
            <button className="small ghost" onClick={() => copyText(transmittalText())}>Copy</button>
          </div>
        </div>
        {invalid > 0 && <div className="note" style={{ marginBlockStart: 8 }}>Containers with problems are listed as exceptions on the transmittal. Correct the names, status codes or revisions before issue where you can.</div>}
        <div className="table-wrap" style={{ marginBlockStart: 10 }}><table className="data">
          <thead><tr><th>#</th><th>Container name</th><th>Title</th><th>Status</th><th>Revision</th><th>Purpose of issue</th><th>Check</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>
            <td>{i + 1}</td>
            <td className="mono-name">{r.name}</td>
            <td>{r.title ?? ""}</td>
            <td><span className="chip">{r.status || "—"}</span></td>
            <td><span className="chip">{r.revision || "—"}</span></td>
            <td className="small">{r.purpose ? t(r.purpose) : "—"}</td>
            <td>{r.valid && !r.warnings.length ? <span className="ok-text">OK</span> : <ul className="issue-list">
              {r.issueMsgs.map((m, j) => <li key={"e" + j} className="err">{formatMsg(m, t)}</li>)}
              {r.warningMsgs.map((m, j) => <li key={"w" + j} className="warn">{formatMsg(m, t)}</li>)}
            </ul>}</td>
          </tr>)}</tbody>
        </table></div>
      </div>}

      {/* (b) AI correspondence writer */}
      <div className="hub-card" style={{ "--c": "#0e7490" } as CSSProperties}>
        <div className="hub-title">AI correspondence writer</div>
        <p className="small muted" style={{ marginBlockStart: 0 }}>Draft an RFI, a rejection, a non-conformance notice, a reminder or a transmittal cover note. Facts that are not in your context are left as [TBC].</p>
        {ai === false && <div className="hub-tile" style={{ display: "grid", gap: 6, marginBlockEnd: 10 }}>
          <b>AI isn't switched on yet</b>
          <div className="small">Once it is, you can draft project correspondence here. The transmittal builder above works without it.</div>
          <div className="small">{user.role === "admin" ? "Add a Claude API key to the server's .env file (CLAUDE_API_KEY), restart the server and reload this page." : "Ask your platform administrator to add a Claude API key to the server."}</div>
        </div>}
        <div className="row" style={{ marginBlockEnd: 10 }}>
          {KINDS.map((k) => <button key={k.id} className={"chip" + (kind === k.id ? " on" : "")} onClick={() => setKind(k.id)}>{t(k.label)}</button>)}
        </div>
        <div className="grid g3" style={{ marginBlockEnd: 10 }}>
          <label className="field"><span>To</span><input value={w.to} onChange={(e) => setW({ ...w, to: e.target.value })} /></label>
          <label className="field"><span>From</span><input value={w.from} onChange={(e) => setW({ ...w, from: e.target.value })} /></label>
          <label className="field"><span>Project</span><input value={w.project} onChange={(e) => setW({ ...w, project: e.target.value })} /></label>
        </div>
        <label className="field"><span>Context</span>
          <textarea value={w.context} onChange={(e) => setW({ ...w, context: e.target.value })} maxLength={20_000} style={{ minBlockSize: 140 }} placeholder={t(HINTS[kind])} /></label>
        <div className="row spread" style={{ marginBlockStart: 10 }}>
          <div className="row">
            <label className="row small" style={{ gap: 6 }}>
              <input type="checkbox" style={{ inlineSize: "auto" }} checked={useRows} disabled={!rows.length} onChange={(e) => setUseRows(e.target.checked)} />
              <span>Include the transmittal containers as context</span>
            </label>
            {rows.length > 0 && <button className="small ghost" onClick={fillFromTransmittal}>Use transmittal details</button>}
          </div>
          <button className="primary" disabled={busy || ai !== true || w.context.trim().length < 10} onClick={draft}>{busy ? t("Drafting…") : t("Draft the letter")}</button>
        </div>
      </div>

      {busy && <div className="card muted">Drafting the correspondence…</div>}

      {letter && !busy && <div className="hub-card" style={{ "--c": "#0e7490" } as CSSProperties}>
        <div className="row spread">
          <div className="hub-title" style={{ marginBlockEnd: 0 }}>Draft</div>
          <div className="actions-bar">
            <button className="small" onClick={() => saveMarkdownDocx(letterMd(), letterName())}>Download Word</button>
            <button className="small ghost" onClick={() => copyText(`${letter.subject}\n\n${letter.body}`)}>Copy</button>
          </div>
        </div>
        <div className="note" style={{ marginBlockStart: 8 }}>AI-drafted text: check the facts, references and dates and fill in every [TBC] before you send it.</div>
        <label className="field" style={{ marginBlockStart: 10 }}><span>Subject</span><input value={letter.subject} onChange={(e) => setLetter({ ...letter, subject: e.target.value })} /></label>
        <label className="field" style={{ marginBlockStart: 10 }}><span>Body (Markdown)</span>
          <textarea className="comms-body" value={letter.body} onChange={(e) => setLetter({ ...letter, body: e.target.value })} /></label>
        {letter.isoRefs.length > 0 && <div className="row" style={{ marginBlockStart: 8 }}>
          <span className="small muted">ISO 19650 references:</span>
          {letter.isoRefs.map((x) => <span key={x} className="chip">{x}</span>)}
        </div>}
      </div>}
    </div>
  );
}
