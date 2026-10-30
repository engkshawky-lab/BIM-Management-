import { useEffect, useState, type ChangeEvent, type CSSProperties } from "react";
import { useSession } from "../../App";
import { t } from "../../i18n";
import { api } from "../../lib/api";
import { exportCsv } from "../../lib/export";
import { saveMarkdownDocx } from "../../lib/mdDocx";
import "./comms.css";

// AI meeting minutes: rough notes or a Teams/Zoom transcript in, formal structured minutes out (attendees,
// agenda with decisions, actions, risks). Everything is editable before export; the AI output must be checked.

interface Attendee { name: string; org: string; role: string }
interface AgendaItem { item: string; discussion: string; decisions: string[] }
interface Action { ref: string; action: string; owner: string; due: string; status: string }
interface Risk { risk: string; owner: string }
interface Minutes {
  title: string; date: string; attendees: Attendee[]; apologies: string[]; agenda: AgendaItem[]; decisions: string[];
  actions: Action[]; risks: Risk[]; nextMeeting: string; truncated?: boolean;
}

const STATUSES = ["Open", "In progress", "Closed", "On hold"];

function useAiEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => { api<{ enabled: boolean }>("/ai/status").then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);
  return enabled;
}

function AiOffNotice({ what }: { what: string }) {
  const { user } = useSession();
  return (
    <div className="hub-tile" style={{ "--c": "#7c3aed", display: "grid", gap: 8 } as CSSProperties}>
      <b>AI isn't switched on yet</b>
      <div className="small">{what}</div>
      {user.role === "admin"
        ? <div className="small">Add a Claude API key to the server's .env file (CLAUDE_API_KEY), restart the server and reload this page.</div>
        : <div className="small">Ask your platform administrator to add a Claude API key to the server.</div>}
    </div>
  );
}

/** Text of a WebVTT transcript: drops the header, cue numbers and timings; "<v Name>…" becomes "Name: …". */
function vttToText(vtt: string): string {
  const out: string[] = [];
  let last = "";
  for (const raw of vtt.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line || /^WEBVTT/.test(line) || /^NOTE\b/.test(line) || /-->/.test(line) || /^\d+$/.test(line) || /^[0-9a-f-]{8,}(\/\d+-\d+)?$/i.test(line)) continue;
    const text = line.replace(/<v\s+([^>]+)>/g, "$1: ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text && text !== last) out.push(text);
    last = text;
  }
  return out.join("\n");
}

async function readNotesFile(file: File): Promise<string> {
  if (/\.docx$/i.test(file.name)) {
    const JSZip = (await import("jszip")).default;
    const xml = await (await JSZip.loadAsync(await file.arrayBuffer())).file("word/document.xml")?.async("string");
    if (!xml) return "";
    return xml.replace(/<\/w:p>/g, "\n").replace(/<\/w:tc>/g, " | ").replace(/<w:tab\/>/g, "\t").replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, "\n\n").trim();
  }
  const text = await file.text();
  return /\.vtt$/i.test(file.name) || /^WEBVTT/.test(text) ? vttToText(text) : text;
}

const cellMd = (s: string) => (s || "—").replace(/\|/g, "\\|").replace(/\n/g, "<br>");

function minutesMarkdown(m: Minutes, meta: { project: string; chair: string }) {
  const L: string[] = [`## ${m.title || "Meeting minutes"}`, "", "| Field | Detail |", "| --- | --- |",
    `| Project | ${cellMd(meta.project)} |`, `| Date | ${cellMd(m.date)} |`, `| Chair | ${cellMd(meta.chair)} |`, ""];
  L.push("## Attendees", "", "| Name | Organisation | Role |", "| --- | --- | --- |", ...m.attendees.map((a) => `| ${cellMd(a.name)} | ${cellMd(a.org)} | ${cellMd(a.role)} |`), "");
  if (m.apologies.length) L.push("## Apologies", "", ...m.apologies.map((a) => `- ${a}`), "");
  L.push("## Minutes", "");
  m.agenda.forEach((a, i) => {
    L.push(`### ${i + 1}. ${a.item}`, "", a.discussion, "");
    if (a.decisions.length) L.push(...a.decisions.map((d) => `- **Decision:** ${d}`), "");
  });
  if (m.decisions.length) L.push("## Decisions", "", ...m.decisions.map((d, i) => `${i + 1}. ${d}`), "");
  L.push("## Actions", "", "| Ref | Action | Owner | Due | Status |", "| --- | --- | --- | --- | --- |",
    ...m.actions.map((a) => `| ${cellMd(a.ref)} | ${cellMd(a.action)} | ${cellMd(a.owner)} | ${cellMd(a.due)} | ${cellMd(a.status)} |`), "");
  if (m.risks.length) L.push("## Risks raised", "", "| Risk | Owner |", "| --- | --- |", ...m.risks.map((r) => `| ${cellMd(r.risk)} | ${cellMd(r.owner)} |`), "");
  L.push("## Next meeting", "", m.nextMeeting || "TBC", "", "_Minutes drafted with AI assistance from meeting notes. Checked by: [Name]. Any corrections to be notified before the next meeting._");
  return L.join("\n");
}

function minutesText(m: Minutes, meta: { project: string; chair: string }) {
  const L: string[] = [m.title, [meta.project, m.date, meta.chair && `Chair: ${meta.chair}`].filter(Boolean).join(" · "), ""];
  L.push("ATTENDEES", ...m.attendees.map((a) => `- ${[a.name, a.org, a.role].filter(Boolean).join(", ")}`), "");
  if (m.apologies.length) L.push("APOLOGIES", ...m.apologies.map((a) => `- ${a}`), "");
  L.push("MINUTES");
  m.agenda.forEach((a, i) => { L.push(`${i + 1}. ${a.item}`, a.discussion, ...a.decisions.map((d) => `   Decision: ${d}`), ""); });
  if (m.decisions.length) L.push("DECISIONS", ...m.decisions.map((d, i) => `${i + 1}. ${d}`), "");
  L.push("ACTIONS", ...m.actions.map((a) => `${a.ref}  ${a.action}  (Owner: ${a.owner}; Due: ${a.due}; ${a.status})`), "");
  if (m.risks.length) L.push("RISKS", ...m.risks.map((r) => `- ${r.risk} (Owner: ${r.owner})`), "");
  L.push(`NEXT MEETING: ${m.nextMeeting || "TBC"}`);
  return L.join("\n");
}

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export default function MeetingMinutes() {
  const { toast } = useSession();
  const ai = useAiEnabled();
  const [f, setF] = useState({ title: "", date: new Date().toISOString().slice(0, 10), project: "", chair: "", attendees: "" });
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [m, setM] = useState<Minutes | null>(null);
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const meta = { project: f.project, chair: f.chair };
  const upd = (patch: Partial<Minutes>) => setM((x) => (x ? { ...x, ...patch } : x));

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try {
      const text = await readNotesFile(file);
      if (!text.trim()) return toast(t("Could not read any text from that file."), "error");
      setNotes(text.slice(0, 120_000));
      toast(t("File loaded. Check the text, then write the minutes."));
    } catch { toast(t("Could not read that file. Use .txt, .vtt or .docx."), "error"); }
  };

  const write = async () => {
    if (notes.trim().length < 20) return toast(t("Paste the notes or transcript first."), "error");
    setBusy(true);
    try {
      const meeting = Object.fromEntries(Object.entries(f).filter(([, v]) => v.trim()));
      const r = await api<Minutes>("/ai/tools/minutes", { body: { notes: notes.slice(0, 120_000), meeting } });
      setM(r);
      if (r.truncated) toast(t("The notes were long and the minutes may be incomplete. Check the end of the result."), "error");
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };

  const fileBase = () => `${(f.project || "Minutes").replace(/[^\w.-]+/g, "_")}_${(m?.date || f.date || "").replace(/[^\w-]+/g, "")}_minutes`;
  const copy = async () => {
    if (!m) return;
    try { await navigator.clipboard.writeText(minutesText(m, meta)); toast(t("Copied to the clipboard.")); } catch { toast(t("Could not copy. Select the text and copy it manually."), "error"); }
  };

  return (
    <div className="comms">
      <div className="hub-card">
        <div className="hub-title">AI meeting minutes</div>
        <p className="small muted" style={{ marginBlockStart: 0 }}>Paste rough notes or a Teams / Zoom transcript and get formal minutes with decisions, actions and risks. Names and dates that are not in the notes are left as TBC.</p>
        {ai === false && <AiOffNotice what="Once it is, you can turn meeting notes and transcripts into formal minutes. You can still type the meeting details and notes here." />}
        <div className="grid g3" style={{ marginBlockEnd: 10 }}>
          <label className="field"><span>Meeting title</span><input value={f.title} onChange={set("title")} placeholder={t("e.g. BIM coordination meeting 07")} /></label>
          <label className="field"><span>Date</span><input type="date" value={f.date} onChange={set("date")} /></label>
          <label className="field"><span>Project</span><input value={f.project} onChange={set("project")} placeholder={t("Project name or code")} /></label>
          <label className="field"><span>Chair</span><input value={f.chair} onChange={set("chair")} /></label>
        </div>
        <label className="field" style={{ marginBlockEnd: 10 }}><span>Attendees (one per line: name, organisation, role)</span>
          <textarea value={f.attendees} onChange={set("attendees")} style={{ minBlockSize: 70 }} placeholder={t("Jane Smith, ABC Architects, Information manager")} /></label>
        <label className="field"><span>Notes or transcript</span>
          <textarea className="comms-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={120_000} placeholder={t("Paste rough notes or a meeting transcript here…")} /></label>
        <div className="row spread" style={{ marginBlockStart: 10 }}>
          <div className="row">
            <label className="btn ghost small drop">Load .txt, .vtt or .docx<input type="file" accept=".txt,.vtt,.docx,text/plain,text/vtt" onChange={onFile} /></label>
            <span className="small muted">{notes.length.toLocaleString()} / 120,000</span>
          </div>
          <button className="primary" disabled={busy || ai !== true || notes.trim().length < 20} onClick={write}>{busy ? t("Writing the minutes…") : t("Write the minutes")}</button>
        </div>
      </div>

      {busy && <div className="card muted">Reading the notes and writing formal minutes. This can take up to a minute for a long transcript.</div>}

      {m && !busy && <>
        <div className="note">AI-drafted minutes: check every name, date, decision and action against the meeting before you issue them.</div>
        <div className="hub-card">
          <div className="row spread">
            <div className="hub-title" style={{ marginBlockEnd: 0 }}>Minutes</div>
            <div className="actions-bar">
              <button className="small" onClick={() => saveMarkdownDocx(minutesMarkdown(m, meta), fileBase())}>Download Word</button>
              <button className="small" onClick={() => exportCsv(fileBase() + "_actions", ["Ref", "Action", "Owner", "Due", "Status"], m.actions.map((a) => [a.ref, a.action, a.owner, a.due, a.status]))}>Actions CSV</button>
              <button className="small ghost" onClick={copy}>Copy as text</button>
            </div>
          </div>
          <div className="grid g2" style={{ marginBlockStart: 10 }}>
            <label className="field"><span>Title</span><input value={m.title} onChange={(e) => upd({ title: e.target.value })} /></label>
            <label className="field"><span>Date</span><input value={m.date} onChange={(e) => upd({ date: e.target.value })} /></label>
          </div>
        </div>

        <div className="hub-card">
          <div className="row spread"><div className="hub-title" style={{ marginBlockEnd: 0 }}>Attendees</div>
            <button className="small ghost" onClick={() => upd({ attendees: [...m.attendees, { name: "", org: "", role: "" }] })}>Add attendee</button></div>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Name</th><th>Organisation</th><th>Role</th><th /></tr></thead>
            <tbody>{m.attendees.map((a, i) => <tr key={i}>
              {(["name", "org", "role"] as const).map((k) => <td key={k}><input value={a[k]} onChange={(e) => upd({ attendees: m.attendees.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) })} /></td>)}
              <td><button className="small ghost" title={t("Remove")} onClick={() => upd({ attendees: m.attendees.filter((_, j) => j !== i) })}>×</button></td>
            </tr>)}</tbody>
          </table></div>
          <label className="field" style={{ marginBlockStart: 10 }}><span>Apologies (one per line)</span>
            <textarea value={m.apologies.join("\n")} onChange={(e) => upd({ apologies: lines(e.target.value) })} style={{ minBlockSize: 50 }} /></label>
        </div>

        <div className="hub-card">
          <div className="hub-title">Agenda and minutes</div>
          <div className="grid">{m.agenda.map((a, i) => <div key={i} className="agenda-item">
            <div className="row" style={{ flexWrap: "nowrap" }}><b>{i + 1}.</b>
              <input value={a.item} onChange={(e) => upd({ agenda: m.agenda.map((x, j) => (j === i ? { ...x, item: e.target.value } : x)) })} /></div>
            <textarea value={a.discussion} onChange={(e) => upd({ agenda: m.agenda.map((x, j) => (j === i ? { ...x, discussion: e.target.value } : x)) })} />
            <label className="field"><span>Decisions under this item (one per line)</span>
              <textarea value={a.decisions.join("\n")} style={{ minBlockSize: 44 }} onChange={(e) => upd({ agenda: m.agenda.map((x, j) => (j === i ? { ...x, decisions: lines(e.target.value) } : x)) })} /></label>
          </div>)}</div>
          {!m.agenda.length && <div className="dashed">No agenda items were found in the notes.</div>}
        </div>

        <div className="hub-card">
          <div className="hub-title">Decisions</div>
          <textarea value={m.decisions.join("\n")} onChange={(e) => upd({ decisions: lines(e.target.value) })} placeholder={t("One decision per line")} />
        </div>

        <div className="hub-card">
          <div className="row spread"><div className="hub-title" style={{ marginBlockEnd: 0 }}>Actions</div>
            <button className="small ghost" onClick={() => upd({ actions: [...m.actions, { ref: `A${String(m.actions.length + 1).padStart(2, "0")}`, action: "", owner: "TBC", due: "TBC", status: "Open" }] })}>Add action</button></div>
          <div className="table-wrap"><table className="data">
            <thead><tr><th style={{ inlineSize: 60 }}>Ref</th><th>Action</th><th style={{ inlineSize: 150 }}>Owner</th><th style={{ inlineSize: 120 }}>Due</th><th style={{ inlineSize: 120 }}>Status</th><th /></tr></thead>
            <tbody>{m.actions.map((a, i) => {
              const ch = (k: keyof Action) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => upd({ actions: m.actions.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) });
              return <tr key={i}>
                <td><input value={a.ref} onChange={ch("ref")} /></td>
                <td><textarea value={a.action} onChange={ch("action")} /></td>
                <td><input value={a.owner} onChange={ch("owner")} /></td>
                <td><input value={a.due} onChange={ch("due")} /></td>
                <td><select value={a.status} onChange={ch("status")}>{STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></td>
                <td><button className="small ghost" title={t("Remove")} onClick={() => upd({ actions: m.actions.filter((_, j) => j !== i) })}>×</button></td>
              </tr>;
            })}</tbody>
          </table></div>
          {!m.actions.length && <div className="dashed" style={{ marginBlockStart: 8 }}>No actions were found in the notes.</div>}
        </div>

        <div className="hub-card">
          <div className="row spread"><div className="hub-title" style={{ marginBlockEnd: 0 }}>Risks raised</div>
            <button className="small ghost" onClick={() => upd({ risks: [...m.risks, { risk: "", owner: "TBC" }] })}>Add risk</button></div>
          {m.risks.length ? <div className="table-wrap"><table className="data">
            <thead><tr><th>Risk</th><th style={{ inlineSize: 180 }}>Owner</th><th /></tr></thead>
            <tbody>{m.risks.map((r, i) => <tr key={i}>
              <td><textarea value={r.risk} onChange={(e) => upd({ risks: m.risks.map((x, j) => (j === i ? { ...x, risk: e.target.value } : x)) })} /></td>
              <td><input value={r.owner} onChange={(e) => upd({ risks: m.risks.map((x, j) => (j === i ? { ...x, owner: e.target.value } : x)) })} /></td>
              <td><button className="small ghost" title={t("Remove")} onClick={() => upd({ risks: m.risks.filter((_, j) => j !== i) })}>×</button></td>
            </tr>)}</tbody>
          </table></div> : <div className="dashed">No risks were raised in the notes.</div>}
        </div>

        <div className="hub-card">
          <div className="hub-title">Next meeting</div>
          <input value={m.nextMeeting} onChange={(e) => upd({ nextMeeting: e.target.value })} />
        </div>
      </>}
    </div>
  );
}
