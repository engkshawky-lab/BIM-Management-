import JSZip from "jszip";
import { saveAs } from "file-saver";
import { workflow19650 } from "../../../shared/data/iso19650";
import { workflow42001 } from "../../../shared/data/iso42001";
import { templateById } from "../../../shared/data/templates";
import type { FieldValue } from "../../../shared/documents";
import type { Finding } from "../../../shared/delivery";
import { api, type DocRow, type Member, type Project } from "./api";
import { buildDocx, csvText, fileBase, type ExportDoc } from "./export";

// Audit evidence pack: one zip with every controlled document (Word), the quality report and the
// project registers, indexed against the ISO clauses an auditor will ask about.

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));

export async function buildAuditPack(project: Project, members: Member[], onProgress?: (msg: string) => void) {
  const pid = project.id;
  const name = (id: unknown) => members.find((m) => m.userId === id)?.name ?? "";
  const zip = new JSZip();
  const contents: [string, string, string][] = []; // path, description, clause
  const add = (path: string, data: string | Blob, description: string, clause: string) => { zip.file(path, data); contents.push([path, description, clause]); };

  onProgress?.("Quality report…");
  const q = await api<{ score: number; counts: Record<string, number>; set: Finding[]; plan: { score: number; findings: Finding[] }; documents: { title: string; score: number; findings: Finding[] }[] }>(`/projects/${pid}/quality`);
  const findings = [...q.set.map((f) => ["Project", f] as const), ...q.plan.findings.map((f) => ["Delivery plan", f] as const), ...q.documents.flatMap((d) => d.findings.map((f) => [d.title, f] as const))];
  add("02-quality/quality-findings.csv", csvText(["Source", "Severity", "Area", "Reference", "Finding", "Clause"], findings.map(([src, f]) => [src, f.severity, f.area, f.ref ?? "", f.message, f.clause ?? ""])), `Quality findings (overall score ${Math.round(q.score)}, ${q.counts.error} errors, ${q.counts.warning} warnings)`, "19650-2 5.6.3 / 42001 9.1");
  add("02-quality/document-scores.csv", csvText(["Document", "Score", "Errors", "Warnings"], q.documents.map((d) => [d.title, String(d.score), String(d.findings.filter((f) => f.severity === "error").length), String(d.findings.filter((f) => f.severity === "warning").length)])), "Quality score per document", "19650-2 5.6.3");

  onProgress?.("Documents…");
  const docs = (await api<{ documents: DocRow[] }>(`/projects/${pid}/documents`)).documents;
  const register: string[][] = [];
  for (const [i, d] of docs.entries()) {
    const t = templateById(d.templateId); if (!t) continue;
    onProgress?.(`Documents ${i + 1}/${docs.length}…`);
    const r = await api<{ document: { values: Record<string, FieldValue>; containerName: string; revision: string; state: string; suitability: string; title: string }; revisions: { revision: string; state: string; suitability: string; note: string; createdAt: string; authorName: string | null }[]; authorName: string | null; reviewerName: string | null }>(`/projects/${pid}/documents/${d.id}`);
    const doc: ExportDoc = { title: r.document.title, containerName: r.document.containerName, revision: r.document.revision, state: r.document.state, suitability: r.document.suitability, authorName: r.authorName ?? "", reviewerName: r.reviewerName, values: r.document.values,
      history: r.revisions.map((x) => ({ revision: x.revision, date: x.createdAt.slice(0, 10), author: x.authorName ?? "", status: `${x.state}/${x.suitability}`, note: x.note })) };
    zip.file(`01-documents/${fileBase(doc, t)}.docx`, await buildDocx(doc, t, project));
    register.push([doc.containerName, t.code, doc.title, doc.revision, doc.state, doc.suitability, doc.authorName, s(r.reviewerName), String(r.revisions.length)]);
  }
  add("01-documents/document-register.csv", csvText(["Container", "Type", "Title", "Revision", "State", "Suitability", "Author", "Reviewer", "Revisions"], register), `Register of ${register.length} controlled documents (each exported to Word in this folder)`, "19650-2 5.6 / 42001 7.5");

  onProgress?.("Registers…");
  const [risks, hs, handover, issues, training, activity] = await Promise.all([
    api<{ risks: Row[] }>(`/projects/${pid}/risks`), api<{ items: Row[] }>(`/projects/${pid}/hs`), api<{ items: Row[] }>(`/projects/${pid}/handover`),
    api<{ issues: Row[] }>(`/projects/${pid}/issues`), api<{ assignments: Row[] }>(`/projects/${pid}/training`), api<{ activity: Row[] }>(`/projects/${pid}/activity`),
  ]);
  add("03-registers/risk-register.csv", csvText(["Ref", "Risk", "Category", "Likelihood", "Impact", "Score", "Mitigation", "Owner", "Status", "Review date"],
    risks.risks.map((r) => [`R${s(r.number).padStart(2, "0")}`, s(r.title), s(r.category), s(r.likelihood), s(r.impact), String(Number(r.likelihood) * Number(r.impact)), s(r.mitigation), name(r.ownerId), s(r.status), s(r.reviewDate)])), "Information delivery risk register", "19650-2 5.3.6");
  add("03-registers/hs-information.csv", csvText(["Ref", "Hazard", "Location", "Phase", "Controls", "Residual", "Shared with", "Owner", "Status"],
    hs.items.map((r) => [`HS${s(r.number).padStart(2, "0")}`, s(r.hazard), s(r.location), s(r.phase), s(r.controls), s(r.residual), s(r.audience), name(r.ownerId), s(r.status)])), "Health & safety information register", "19650-6");
  add("03-registers/handover-checklist.csv", csvText(["Category", "Item", "Clause", "Status", "Owner", "Evidence linked", "Notes"],
    handover.items.map((r) => [s(r.category), s(r.title), s(r.clause), s(r.status), name(r.ownerId), r.fileId ? "Yes" : "No", s(r.notes)])), "Handover (PIM → AIM) checklist", "19650-2 5.7–5.8");
  add("03-registers/issues.csv", csvText(["Number", "Title", "Type", "Status", "Priority", "Assignee", "Due", "Closed"],
    issues.issues.map((r) => [s(r.number), s(r.title), s(r.type), s(r.status), s(r.priority), s(r.assigneeName), s(r.dueDate), s(r.closedAt).slice(0, 10)])), "Coordination issues (BCF)", "19650-2 5.6.2");
  add("03-registers/training.csv", csvText(["Member", "Course", "Due", "Progress"],
    training.assignments.map((r) => [s(r.userName), s(r.courseId), s(r.dueDate), `${Math.round(Number(r.progress) * 100)}%`])), "Team training and completion", "19650-2 5.5.2 / 42001 7.2");
  add("03-registers/team.csv", csvText(["Name", "Email", "Project role"], members.map((m) => [m.name, m.email, m.role])), "Project team and access roles", "19650-2 5.1.2 / 5.4.1");

  const gates: string[][] = [];
  for (const wf of [workflow19650, workflow42001].filter((w) => project.standards.includes(w.standard))) {
    const p = (await api<{ data: { activities: Record<string, string>; gates: Record<string, { approved: boolean; by: string; date: string; note: string }> } }>(`/projects/${pid}/workflow/${wf.id}`)).data;
    for (const st of wf.stages) {
      const g = p.gates?.[st.id];
      gates.push([wf.title, st.title, `${st.activities.filter((a) => p.activities?.[a.id] === "done").length}/${st.activities.length}`, g?.approved ? "Approved" : "Open", g?.by ?? "", g?.date ?? "", g?.note ?? ""]);
    }
  }
  add("04-process/stage-gates.csv", csvText(["Workflow", "Stage", "Activities done", "Gate", "Approved by", "Date", "Note"], gates), "Process stage gates and approvals", "19650-2 5.1–5.8 / 42001 8");
  add("04-process/activity-log.csv", csvText(["Date", "User", "Action", "Summary"], activity.activity.map((a) => [s(a.createdAt).slice(0, 16).replace("T", " "), s(a.userName), s(a.action), s(a.summary)])), "Recent project activity (audit trail)", "42001 7.5.3");

  const generated = new Date().toISOString().slice(0, 16).replace("T", " ");
  zip.file("00-index.csv", csvText(["File", "Contents", "Clause"], contents));
  zip.file("00-README.txt", [`Audit evidence pack — ${project.code} ${project.name}`, `Generated ${generated} UTC`, "",
    `Quality score: ${Math.round(q.score)} (${q.counts.error} errors, ${q.counts.warning} warnings)`, `Documents: ${register.length}`, "",
    "Contents:", ...contents.map(([p, d, c]) => `  ${p}\n      ${d} [${c}]`)].join("\n"));
  onProgress?.("Compressing…");
  saveAs(await zip.generateAsync({ type: "blob", compression: "DEFLATE" }), `${project.code}-audit-evidence-pack.zip`);
}
