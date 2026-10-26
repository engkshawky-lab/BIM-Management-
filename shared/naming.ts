// ISO 19650-2 UK National Annex container name field structure.
export const NAMING_FIELDS = [
  { id: "project", label: "Project", hint: "2–6 chars", rule: /^[A-Z0-9]{2,6}$/ },
  { id: "originator", label: "Originator", hint: "3–6 chars", rule: /^[A-Z0-9]{3,6}$/ },
  { id: "volume", label: "Volume / System", hint: "1–2 chars", rule: /^[A-Z0-9]{1,2}$/ },
  { id: "level", label: "Level / Location", hint: "2 chars", rule: /^[A-Z0-9]{2}$/ },
  { id: "type", label: "Type", hint: "2 chars", rule: /^[A-Z0-9]{2}$/ },
  { id: "role", label: "Role", hint: "1–2 chars", rule: /^[A-Z]{1,2}$/ },
  { id: "number", label: "Number", hint: "4–6 digits", rule: /^\d{4,6}$/ },
] as const;

/** Returns a list of problems; empty means the name conforms. */
export function validateContainerName(name: string, projectCode?: string): string[] {
  const parts = name.trim().toUpperCase().split("-");
  if (parts.length !== NAMING_FIELDS.length) return [`Expected ${NAMING_FIELDS.length} fields separated by "-", found ${parts.length}.`];
  const errors = NAMING_FIELDS.flatMap((f, i) => (f.rule.test(parts[i]) ? [] : [`${f.label} "${parts[i]}" is invalid (${f.hint}).`]));
  if (projectCode && parts[0] !== projectCode.toUpperCase()) errors.push(`Project field "${parts[0]}" does not match project code ${projectCode}.`);
  return errors;
}

export function containerName(p: { project: string; originator: string; volume?: string; level?: string; type: string; role: string; number: number | string }) {
  const num = typeof p.number === "number" ? String(p.number).padStart(4, "0") : p.number;
  return [p.project, p.originator, p.volume || "ZZ", p.level || "ZZ", p.type, p.role, num].map((x) => String(x).toUpperCase()).join("-");
}
