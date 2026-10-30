// Transmittal builder: turns a pasted list of information container names into transmittal rows (naming check,
// status, revision and purpose of issue), suggests the transmittal number and writes the transmittal sheet as
// Markdown. Pure functions, used in the browser; nothing is sent to a server.

import { checkNames, formatMsg, splitName, type Msg } from "./namingCheck";

export interface TransmittalRow {
  line: number;
  /** The container (file) name as pasted. */
  name: string;
  title?: string;
  /** Status (suitability) code, e.g. S2, A1, CR; "" when none was given. */
  status: string;
  revision: string;
  purpose: string;
  /** True when the name passes the naming check and has a status and revision. */
  valid: boolean;
  /** Errors in English (for export). */
  issues: string[];
  /** The same errors as message templates, so the interface can translate them. */
  issueMsgs: Msg[];
  /** Advisory naming warnings (do not make the row invalid). */
  warnings: string[];
  warningMsgs: Msg[];
}

export interface TransmittalHeader {
  project: string;
  from: string;
  to: string;
  date: string;
  number: string;
  reason: string;
  notes?: string;
}

const STATUS = /^(S[0-7]|A[1-9]\d?|B[1-9]\d?|CR|D[1-4])$/i;
const REVISION = /^[PC]\d{2}(\.\d{1,2})?$/i;

/**
 * Purpose of issue for a status (suitability) code. Wording follows suitabilityCodes in shared/data/iso19650.ts:
 * S1 coordination, S2 information, S3 review and comment, S4 stage approval, S6/S7 PIM/AIM authorisation,
 * A authorised and accepted (construction), B partially accepted with comments, CR as-constructed record.
 */
export function purposeOfIssue(code: string): string {
  const c = code.trim().toUpperCase();
  if (!c) return "";
  if (c === "S0") return "Work in progress: not for issue";
  if (c === "S1") return "For coordination";
  if (c === "S2") return "For information";
  if (c === "S3") return "For review and comment";
  if (c === "S4") return "For review and authorisation (stage approval)";
  if (c === "S5") return "Withdrawn code: confirm the purpose";
  if (c === "S6") return "For PIM authorisation";
  if (c === "S7") return "For AIM authorisation";
  if (/^A\d+$/.test(c)) return `For construction: authorised and accepted (stage ${c.slice(1)})`;
  if (/^B\d+$/.test(c)) return `For construction: partially authorised and accepted, with comments (stage ${c.slice(1)})`;
  if (c === "CR") return "As-constructed record";
  if (c === "D1") return "For costing";
  if (c === "D2") return "For tender";
  if (c === "D3") return "For contractor design";
  if (c === "D4") return "For manufacture / procurement";
  return "";
}

/** Split one pasted line into name, status, revision and title (tab or comma cells, or whitespace-separated tokens). */
export function parseLine(line: string): { name: string; status: string; revision: string; title: string } {
  const raw = line.trim();
  const cells = raw.includes("\t") ? raw.split("\t") : raw.includes(",") ? raw.split(",") : raw.split(/\s+/);
  const [first, ...rest] = cells.map((c) => c.trim());
  let status = "", revision = "";
  const title: string[] = [];
  for (const c of rest) {
    if (!c) continue;
    if (!status && STATUS.test(c)) status = c.toUpperCase();
    else if (!revision && REVISION.test(c)) revision = c.toUpperCase();
    else title.push(c);
  }
  return { name: first ?? "", status, revision, title: title.join(raw.includes("\t") || raw.includes(",") ? ", " : " ") };
}

export interface TransmittalOptions { separator?: string; projectCode?: string }

/** Parse a pasted list (one container per line) into transmittal rows, checking each name with the naming checker. */
export function parseTransmittalList(text: string, opts: TransmittalOptions = {}): TransmittalRow[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim()).filter(Boolean);
  const parsed = lines.map(parseLine).filter((p) => p.name);
  const code = opts.projectCode?.trim().toUpperCase();
  const report = checkNames(parsed.map((p) => p.name), { separator: opts.separator || "-", projectCode: code && /^[A-Z0-9]{2,6}$/.test(code) ? code : undefined });
  return parsed.map((p, i) => {
    const check = report.results[i];
    const status = p.status || check?.suitability?.toUpperCase() || "";
    const revision = p.revision || check?.revision?.toUpperCase() || "";
    const issueMsgs: Msg[] = [...(check?.errors ?? [])];
    if (!status) issueMsgs.push({ t: "No status (suitability) code: add one, e.g. S2." });
    else if (status === "S0") issueMsgs.push({ t: "S0 is work in progress and is not issued on a transmittal." });
    if (!revision) issueMsgs.push({ t: "No revision: add one, e.g. P01." });
    if (check?.suggestion) issueMsgs.push({ t: "Suggested name: {name}", v: { name: check.suggestion } });
    if (status && revision && /^[AB]\d+$|^CR$/.test(status) && revision.startsWith("P"))
      issueMsgs.push({ t: "Status {status} (published) normally takes a contractual revision (C01…), not {revision}.", v: { status, revision } });
    if (status && revision && /^S[1-7]$/.test(status) && revision.startsWith("C"))
      issueMsgs.push({ t: "Status {status} (shared) normally takes a preliminary revision (P01…), not {revision}.", v: { status, revision } });
    const warningMsgs = check?.warnings ?? [];
    const purpose = purposeOfIssue(status);
    return {
      line: i + 1, name: p.name, title: p.title || undefined, status, revision, purpose,
      valid: issueMsgs.length === 0 && !!purpose,
      issues: issueMsgs.map((m) => formatMsg(m)), issueMsgs,
      warnings: warningMsgs.map((m) => formatMsg(m)), warningMsgs,
    };
  });
}

/** Transmittal number like PRJ01-TRN-0007. */
export function transmittalNumber(project: string, seq: number): string {
  const p = project.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "") || "PRJ";
  return `${p}-TRN-${String(Math.max(1, Math.floor(seq) || 1)).padStart(4, "0")}`;
}

/** The next number after those already used for this project. */
export function nextTransmittalNumber(project: string, used: string[] = []): string {
  const prefix = transmittalNumber(project, 1).replace(/\d+$/, "");
  const max = used.filter((u) => u.toUpperCase().startsWith(prefix)).map((u) => Number(u.slice(prefix.length)) || 0).reduce((a, b) => Math.max(a, b), 0);
  return transmittalNumber(project, max + 1);
}

const cell = (s: string | undefined) => (s ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>") || "—";

/** The transmittal sheet as Markdown: header block, schedule of containers and acknowledgement block. */
export function transmittalMarkdown(h: TransmittalHeader, rows: TransmittalRow[]): string {
  const out: string[] = [];
  out.push(`# Transmittal ${h.number}`, "");
  out.push("| Field | Detail |", "| --- | --- |");
  out.push(`| Project | ${cell(h.project)} |`, `| From | ${cell(h.from)} |`, `| To | ${cell(h.to)} |`, `| Date | ${cell(h.date)} |`,
    `| Transmittal no. | ${cell(h.number)} |`, `| Reason for issue | ${cell(h.reason)} |`, `| Number of containers | ${rows.length} |`, "");
  out.push("## Information containers", "");
  out.push("| # | Container name | Title | Status | Revision | Purpose of issue |", "| --- | --- | --- | --- | --- | --- |");
  rows.forEach((r, i) => out.push(`| ${i + 1} | ${cell(r.name)} | ${cell(r.title)} | ${cell(r.status)} | ${cell(r.revision)} | ${cell(r.purpose)} |`));
  out.push("");
  const bad = rows.filter((r) => !r.valid);
  if (bad.length) {
    out.push("## Naming and status exceptions", "");
    for (const r of bad) out.push(`- **${r.name}**: ${r.issues.join("; ")}`);
    out.push("");
  }
  if (h.notes?.trim()) out.push("## Notes", "", h.notes.trim(), "");
  out.push("## Acknowledgement of receipt", "",
    "Please confirm receipt of the information containers listed above and that they can be opened and read. The status code of each container states what it may be used for (ISO 19650-2, 5.6 and 5.7); information may not be relied on beyond that purpose.", "",
    "| Received by | Organisation | Signature | Date |", "| --- | --- | --- | --- |", "| | | | |", "");
  return out.join("\n");
}

/** CSV rows (header first) for the container schedule. */
export function transmittalCsvRows(rows: TransmittalRow[]): { header: string[]; rows: string[][] } {
  return {
    header: ["#", "Container name", "Extension", "Title", "Status", "Revision", "Purpose of issue", "Valid", "Issues"],
    rows: rows.map((r, i) => [String(i + 1), r.name, splitName(r.name).ext, r.title ?? "", r.status, r.revision, r.purpose, r.valid ? "Yes" : "No", [...r.issues, ...r.warnings].join("; ")]),
  };
}
