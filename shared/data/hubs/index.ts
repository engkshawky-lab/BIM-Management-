import { appointmentHub } from "./appointment";
import { cobieHub } from "./cobie";
import { dimensionsHub } from "./dimensions";
import { documentsRolesHub } from "./documentsRoles";
import { implementationHub } from "./implementation";
import { infrastructureHub } from "./infrastructure";
import { loinHub } from "./loin";
import { mcpHub } from "./mcp";
import { revitHub } from "./revit";
import { scanToBimHub } from "./scanToBim";
import type { Hub } from "./types";

export const hubs: Hub[] = [
  appointmentHub, documentsRolesHub, loinHub, cobieHub, infrastructureHub,
  { ...scanToBimHub, tone: scanToBimHub.tone ?? "red" },
  { ...dimensionsHub, tone: dimensionsHub.tone ?? "green" },
  revitHub, mcpHub,
  { ...implementationHub, tone: implementationHub.tone ?? "purple" },
];
export const hubById = (id: string) => hubs.find((h) => h.id === id);

/** Plain-text digest of a hub for grounding the AI tutor (widgets and quizzes left out). */
export function hubDigest(hub: Hub, limit = 60_000) {
  const out: string[] = [];
  for (const s of hub.sections) for (const t of s.tabs) {
    out.push(`## ${s.label} — ${t.label}`);
    for (const b of t.blocks) {
      if (b.kind === "text") out.push(`${b.title}: ${b.body.join(" ")}`);
      else if (b.kind === "list" || b.kind === "checklist") out.push(`${b.title}: ${b.items.join("; ")}`);
      else if (b.kind === "cards") out.push(`${b.title}: ${b.cards.map((c) => `${c.title} — ${c.body}`).join("; ")}`);
      else if (b.kind === "steps") out.push(`${b.title}: ${b.steps.map((c) => `${c.title} — ${c.body}`).join("; ")}`);
      else if (b.kind === "table") out.push(`${b.title}: ${b.columns.join(" | ")}\n${b.rows.map((r) => r.join(" | ")).join("\n")}`);
      else if (b.kind === "callout") out.push(`${b.title}: ${b.body}`);
      else if (b.kind === "faq") out.push(`${b.title}: ${b.items.map((x) => `Q ${x.q} A ${x.a}`).join(" ")}`);
      else if (b.kind === "stats") out.push(`${b.title}: ${b.stats.map((x) => `${x.value} ${x.label}`).join("; ")}`);
      else if (b.kind === "rolematrix") out.push(`${b.title}: ${b.docs.map((d) => `${d.name} (${b.parties.find((p) => p.id === d.party)?.label}, ${b.stages.find((s) => s.id === d.stage)?.label}, ${d.clause}): ${d.purpose}`).join("\n")}`);
      else if (b.kind === "graphic") out.push(`${b.title}: ${b.caption ?? ""}`);
      else if (b.kind === "process") out.push(`${b.title}: ${b.steps.map((s) => `${s.title} (${s.clause}, ${b.lanes.find((l) => l.id === s.lane)?.label}): ${s.activities.join("; ")} → ${s.outputs.join("; ")}`).join("\n")}`);
    }
  }
  return out.join("\n").slice(0, limit);
}
