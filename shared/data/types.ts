export type StandardId = "iso19650" | "iso42001";

export interface Clause {
  id: string;
  title: string;
  summary: string;
  outputs?: string[];
  children?: Clause[];
}

export interface Part {
  id: string;
  title: string;
  year: string;
  scope: string;
  keyTopics: string[];
}

export interface WorkflowActivity {
  id: string;
  title: string;
  owner: string;
  outputs: string[];
  templateIds?: string[];
}

export interface WorkflowStage {
  id: string;
  title: string;
  description: string;
  gate: string;
  activities: WorkflowActivity[];
}

export interface Workflow {
  id: string;
  standard: StandardId;
  title: string;
  description: string;
  stages: WorkflowStage[];
}

export interface GlossaryTerm {
  term: string;
  abbr?: string;
  definition: string;
}

export interface Reference {
  title: string;
  publisher: string;
  note: string;
  url?: string;
}

export type FieldType = "text" | "textarea" | "date" | "select" | "table";

export interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  hint?: string;
  options?: string[];
  columns?: string[];
  defaultRows?: string[][];
  defaultValue?: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  guidance: string;
  fields: TemplateField[];
}

export interface DocTemplate {
  id: string;
  standard: StandardId;
  code: string;
  title: string;
  purpose: string;
  clauseRefs: string[];
  category: string;
  sections: TemplateSection[];
}
