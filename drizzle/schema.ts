import { boolean, customType, mediumtext, datetime, index, int, mysqlTable, primaryKey, text, uniqueIndex, varchar, bigint } from "drizzle-orm/mysql-core";

// MariaDB stores JSON as LONGTEXT and returns it as a string; MySQL returns parsed objects. Accept both.
const json = <T>(name: string) => customType<{ data: T; driverData: string }>({
  dataType: () => "json",
  toDriver: (v) => JSON.stringify(v),
  fromDriver: (v) => (typeof v === "string" ? JSON.parse(v) : v) as T,
})(name);

const id = () => varchar("id", { length: 36 }).primaryKey();
const ref = (name: string) => varchar(name, { length: 36 });
const created = () => datetime("created_at", { mode: "date" }).notNull();

export const users = mysqlTable("users", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  organization: varchar("organization", { length: 160 }).notNull().default(""),
  jobTitle: varchar("job_title", { length: 120 }).notNull().default(""),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  bio: text("bio"),
  role: varchar("role", { length: 16 }).notNull().default("user"),
  bimRole: varchar("bim_role", { length: 32 }),
  favourites: json<string[] | null>("favourites"),
  /** chosen theme colour (shared/palette.ts); null = the default palette */
  appearance: json<{ color: string; tint: boolean; page?: string | null; banner?: string | null; banners?: Record<string, string> } | null>("appearance"),
  createdAt: created(),
  lastLoginAt: datetime("last_login_at", { mode: "date" }),
  disabled: int("disabled").notNull().default(0),
  /** instant | digest | off */
  emailPref: varchar("email_pref", { length: 10 }).notNull().default("instant"),
  locale: varchar("locale", { length: 5 }).notNull().default("en"),
  /** set when the user opens the link in the sign-up email; accounts made before verification existed count as verified */
  emailVerifiedAt: datetime("email_verified_at", { mode: "date" }),
}, (t) => [uniqueIndex("users_email").on(t.email)]);

export const sessions = mysqlTable("sessions", {
  id: id(),
  userId: ref("user_id").notNull(),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  createdAt: created(),
}, (t) => [index("sessions_user").on(t.userId)]);

export const projects = mysqlTable("projects", {
  id: id(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  description: text("description"),
  appointingParty: varchar("appointing_party", { length: 200 }).notNull().default(""),
  location: varchar("location", { length: 200 }).notNull().default(""),
  standards: json<string[]>("standards").notNull(),
  stage: varchar("stage", { length: 60 }).notNull().default(""),
  standardId: ref("standard_id"),
  standardStage: varchar("standard_stage", { length: 80 }).notNull().default(""),
  /** selected information uses (shared/data/infoUses.ts) */
  infoUses: json<{ code: string; priority: string; taskTeams: string[]; notes: string }[]>("info_uses"),
  ownerId: ref("owner_id").notNull(),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
});

export const projectMembers = mysqlTable("project_members", {
  projectId: ref("project_id").notNull(),
  userId: ref("user_id").notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  joinedAt: datetime("joined_at", { mode: "date" }).notNull(),
}, (t) => [primaryKey({ columns: [t.projectId, t.userId] }), index("members_user").on(t.userId)]);

export const invitations = mysqlTable("invitations", {
  id: id(),
  projectId: ref("project_id").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  invitedBy: ref("invited_by").notNull(),
  createdAt: created(),
  acceptedAt: datetime("accepted_at", { mode: "date" }),
}, (t) => [index("invitations_email").on(t.email)]);

export const folders = mysqlTable("folders", {
  id: id(),
  projectId: ref("project_id").notNull(),
  parentId: ref("parent_id"),
  name: varchar("name", { length: 160 }).notNull(),
  cdeState: varchar("cde_state", { length: 16 }),
  createdBy: ref("created_by").notNull(),
  createdAt: created(),
}, (t) => [index("folders_project").on(t.projectId)]);

export const files = mysqlTable("files", {
  id: id(),
  projectId: ref("project_id").notNull(),
  folderId: ref("folder_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  containerName: varchar("container_name", { length: 120 }).notNull().default(""),
  state: varchar("state", { length: 16 }).notNull().default("WIP"),
  suitability: varchar("suitability", { length: 8 }).notNull().default("S0"),
  revision: varchar("revision", { length: 12 }).notNull().default("P01.01"),
  currentVersion: int("current_version").notNull().default(1),
  documentId: ref("document_id"),
  uploadedBy: ref("uploaded_by").notNull(),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [index("files_project").on(t.projectId), index("files_folder").on(t.folderId)]);

export const fileVersions = mysqlTable("file_versions", {
  id: id(),
  fileId: ref("file_id").notNull(),
  version: int("version").notNull(),
  storageKey: varchar("storage_key", { length: 255 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  mimeType: varchar("mime_type", { length: 160 }).notNull(),
  note: varchar("note", { length: 500 }).notNull().default(""),
  uploadedBy: ref("uploaded_by").notNull(),
  createdAt: created(),
}, (t) => [index("versions_file").on(t.fileId)]);

export const documents = mysqlTable("documents", {
  id: id(),
  projectId: ref("project_id").notNull(),
  templateId: varchar("template_id", { length: 40 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  containerName: varchar("container_name", { length: 120 }).notNull().default(""),
  revision: varchar("revision", { length: 12 }).notNull(),
  state: varchar("state", { length: 16 }).notNull(),
  suitability: varchar("suitability", { length: 8 }).notNull(),
  authorId: ref("author_id").notNull(),
  values: json<Record<string, unknown>>("values").notNull(),
  reviewerId: ref("reviewer_id"),
  reviewStatus: varchar("review_status", { length: 16 }).notNull().default("none"),
  lockedBy: ref("locked_by"),
  lockedAt: datetime("locked_at", { mode: "date" }),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [index("documents_project").on(t.projectId)]);

export const documentRevisions = mysqlTable("document_revisions", {
  id: id(),
  documentId: ref("document_id").notNull(),
  revision: varchar("revision", { length: 12 }).notNull(),
  state: varchar("state", { length: 16 }).notNull(),
  suitability: varchar("suitability", { length: 8 }).notNull(),
  note: varchar("note", { length: 500 }).notNull(),
  values: json<Record<string, unknown>>("values").notNull(),
  authorId: ref("author_id").notNull(),
  createdAt: created(),
}, (t) => [index("revisions_document").on(t.documentId)]);

export const comments = mysqlTable("comments", {
  id: id(),
  projectId: ref("project_id").notNull(),
  documentId: ref("document_id"),
  fileId: ref("file_id"),
  issueId: ref("issue_id"),
  sectionId: varchar("section_id", { length: 60 }),
  userId: ref("user_id").notNull(),
  body: text("body").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: created(),
}, (t) => [index("comments_document").on(t.documentId), index("comments_file").on(t.fileId), index("comments_issue").on(t.issueId)]);

export const activity = mysqlTable("activity", {
  id: id(),
  projectId: ref("project_id").notNull(),
  userId: ref("user_id").notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  link: varchar("link", { length: 200 }).notNull().default(""),
  createdAt: created(),
}, (t) => [index("activity_project").on(t.projectId)]);

export const notifications = mysqlTable("notifications", {
  id: id(),
  userId: ref("user_id").notNull(),
  projectId: ref("project_id"),
  message: varchar("message", { length: 500 }).notNull(),
  link: varchar("link", { length: 200 }).notNull().default(""),
  read: boolean("read").notNull().default(false),
  emailed: boolean("emailed").notNull().default(false),
  createdAt: created(),
}, (t) => [index("notifications_user").on(t.userId)]);

export const workflowProgress = mysqlTable("workflow_progress", {
  projectId: ref("project_id").notNull(),
  workflowId: varchar("workflow_id", { length: 40 }).notNull(),
  data: json<unknown>("data").notNull(),
  updatedBy: ref("updated_by").notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [primaryKey({ columns: [t.projectId, t.workflowId] })]);

// ---------- Phase 2: delivery planning ----------

export const taskTeams = mysqlTable("task_teams", {
  id: id(),
  projectId: ref("project_id").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  organization: varchar("organization", { length: 160 }).notNull().default(""),
  originatorCode: varchar("originator_code", { length: 6 }).notNull().default(""),
  roleCode: varchar("role_code", { length: 2 }).notNull().default(""),
  leadUserId: ref("lead_user_id"),
  createdAt: created(),
}, (t) => [index("task_teams_project").on(t.projectId)]);

export const milestones = mysqlTable("milestones", {
  id: id(),
  projectId: ref("project_id").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  description: varchar("description", { length: 500 }).notNull().default(""),
  createdAt: created(),
}, (t) => [index("milestones_project").on(t.projectId)]);

export const deliverables = mysqlTable("deliverables", {
  id: id(),
  projectId: ref("project_id").notNull(),
  taskTeamId: ref("task_team_id").notNull(),
  containerName: varchar("container_name", { length: 120 }).notNull().default(""),
  title: varchar("title", { length: 255 }).notNull(),
  typeCode: varchar("type_code", { length: 2 }).notNull().default(""),
  loin: varchar("loin", { length: 40 }).notNull().default(""),
  milestoneId: ref("milestone_id"),
  startDate: varchar("start_date", { length: 10 }).notNull().default(""),
  dueDate: varchar("due_date", { length: 10 }).notNull().default(""),
  status: varchar("status", { length: 16 }).notNull().default("planned"),
  dependsOn: json<string[]>("depends_on").notNull(),
  assigneeId: ref("assignee_id"),
  fileId: ref("file_id"),
  documentId: ref("document_id"),
  notes: varchar("notes", { length: 1000 }).notNull().default(""),
  formats: json<string[]>("formats"),
  classification: varchar("classification", { length: 80 }).notNull().default(""),
  actualDate: varchar("actual_date", { length: 10 }).notNull().default(""),
  /** MIDP/TIDP template columns: longer description, native authoring format, source model for extracted
   *  deliverables (drawings, schedules) and a cost code (e.g. NRM1). formats holds the exchange formats. */
  description: varchar("description", { length: 1000 }).notNull().default(""),
  nativeFormat: varchar("native_format", { length: 20 }).notNull().default(""),
  modelRef: varchar("model_ref", { length: 120 }).notNull().default(""),
  costCode: varchar("cost_code", { length: 40 }).notNull().default(""),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [index("deliverables_project").on(t.projectId)]);

export const responsibilityRows = mysqlTable("responsibility_rows", {
  id: id(),
  projectId: ref("project_id").notNull(),
  item: varchar("item", { length: 255 }).notNull(),
  stage: varchar("stage", { length: 120 }).notNull().default(""),
  loin: varchar("loin", { length: 40 }).notNull().default(""),
  // task team id -> "R" | "A" | "C" | "I" | combinations like "R/A"
  cells: json<Record<string, string>>("cells").notNull(),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: created(),
}, (t) => [index("resp_project").on(t.projectId)]);

export const loinRows = mysqlTable("loin_rows", {
  id: id(),
  projectId: ref("project_id").notNull(),
  ref: varchar("ref", { length: 40 }).notNull(),
  element: varchar("element", { length: 160 }).notNull(),
  ifcClass: varchar("ifc_class", { length: 80 }).notNull().default(""),
  milestoneId: ref("milestone_id"),
  purpose: varchar("purpose", { length: 255 }).notNull().default(""),
  geometry: varchar("geometry", { length: 1000 }).notNull().default(""),
  alphanumeric: varchar("alphanumeric", { length: 1000 }).notNull().default(""),
  documentation: varchar("documentation", { length: 1000 }).notNull().default(""),
  createdAt: created(),
}, (t) => [index("loin_project").on(t.projectId)]);

// ---------- Phase 3: validation & coordination ----------

export const validationRuns = mysqlTable("validation_runs", {
  id: id(),
  projectId: ref("project_id").notNull(),
  fileId: ref("file_id").notNull(),
  fileVersion: int("file_version").notNull(),
  kind: varchar("kind", { length: 16 }).notNull(),
  status: varchar("status", { length: 16 }).notNull(),
  score: int("score").notNull().default(0),
  errors: int("errors").notNull().default(0),
  warnings: int("warnings").notNull().default(0),
  summary: varchar("summary", { length: 500 }).notNull().default(""),
  report: json<unknown>("report").notNull(),
  createdBy: ref("created_by").notNull(),
  createdAt: created(),
}, (t) => [index("validation_project").on(t.projectId), index("validation_file").on(t.fileId)]);

export const issues = mysqlTable("issues", {
  id: id(),
  projectId: ref("project_id").notNull(),
  number: int("number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 24 }).notNull().default("Issue"),
  status: varchar("status", { length: 16 }).notNull().default("Open"),
  priority: varchar("priority", { length: 16 }).notNull().default("Normal"),
  assigneeId: ref("assignee_id"),
  taskTeamId: ref("task_team_id"),
  dueDate: varchar("due_date", { length: 10 }).notNull().default(""),
  fileId: ref("file_id"),
  documentId: ref("document_id"),
  deliverableId: ref("deliverable_id"),
  validationRunId: ref("validation_run_id"),
  elementGuids: json<string[]>("element_guids").notNull(),
  labels: json<string[]>("labels").notNull(),
  bcfGuid: varchar("bcf_guid", { length: 36 }).notNull(),
  createdBy: ref("created_by").notNull(),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  closedAt: datetime("closed_at", { mode: "date" }),
}, (t) => [index("issues_project").on(t.projectId)]);

export const clashTests = mysqlTable("clash_tests", {
  id: id(),
  projectId: ref("project_id").notNull(),
  teamA: ref("team_a").notNull(),
  teamB: ref("team_b").notNull(),
  kind: varchar("kind", { length: 16 }).notNull().default("hard"),
  toleranceMm: int("tolerance_mm").notNull().default(0),
  priority: varchar("priority", { length: 16 }).notNull().default("Normal"),
  frequency: varchar("frequency", { length: 24 }).notNull().default("Weekly"),
  notes: varchar("notes", { length: 500 }).notNull().default(""),
  code: varchar("code", { length: 20 }).notNull().default(""),
  setsA: json<string[]>("sets_a"),
  setsB: json<string[]>("sets_b"),
}, (t) => [index("clash_project").on(t.projectId)]);

export const risks = mysqlTable("risks", {
  id: id(),
  projectId: ref("project_id").notNull(),
  number: int("number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 40 }).notNull().default("Information delivery"),
  cause: varchar("cause", { length: 1000 }).notNull().default(""),
  likelihood: int("likelihood").notNull().default(3),
  impact: int("impact").notNull().default(3),
  mitigation: varchar("mitigation", { length: 1000 }).notNull().default(""),
  ownerId: ref("owner_id"),
  status: varchar("status", { length: 16 }).notNull().default("Open"),
  residualLikelihood: int("residual_likelihood"),
  residualImpact: int("residual_impact"),
  reviewDate: varchar("review_date", { length: 10 }).notNull().default(""),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [index("risks_project").on(t.projectId)]);

export const handoverItems = mysqlTable("handover_items", {
  id: id(),
  projectId: ref("project_id").notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  clause: varchar("clause", { length: 40 }).notNull().default(""),
  status: varchar("status", { length: 16 }).notNull().default("Not started"),
  ownerId: ref("owner_id"),
  fileId: ref("file_id"),
  notes: varchar("notes", { length: 1000 }).notNull().default(""),
  sortOrder: int("sort_order").notNull().default(0),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [index("handover_project").on(t.projectId)]);

// ---------- Client information standards ----------

export const clientStandards = mysqlTable("client_standards", {
  id: id(),
  ownerId: ref("owner_id").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  client: varchar("client", { length: 160 }).notNull().default(""),
  data: json<unknown>("data").notNull(),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [index("standards_owner").on(t.ownerId)]);

export const modelReviews = mysqlTable("model_reviews", {
  id: id(),
  projectId: ref("project_id").notNull(),
  number: int("number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  discipline: varchar("discipline", { length: 40 }).notNull(),
  taskTeamId: ref("task_team_id"),
  fileId: ref("file_id"),
  milestone: varchar("milestone", { length: 120 }).notNull().default(""),
  reviewerId: ref("reviewer_id").notNull(),
  results: json<Record<string, { grade: string; comment: string }>>("results").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("Draft"),
  score: int("score").notNull().default(0),
  grade: varchar("grade", { length: 2 }).notNull().default("—"),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [index("model_reviews_project").on(t.projectId)]);

export const mrmRows = mysqlTable("mrm_rows", {
  id: id(),
  projectId: ref("project_id").notNull(),
  discipline: varchar("discipline", { length: 40 }).notNull(),
  system: varchar("system", { length: 80 }).notNull().default(""),
  element: varchar("element", { length: 160 }).notNull(),
  // milestone id -> { teamId, lod }
  cells: json<Record<string, { teamId: string; lod: string }>>("cells").notNull(),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: created(),
}, (t) => [index("mrm_project").on(t.projectId)]);

export const meetings = mysqlTable("meetings", {
  id: id(),
  projectId: ref("project_id").notNull(),
  number: int("number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 40 }).notNull(),
  date: varchar("date", { length: 16 }).notNull().default(""),
  location: varchar("location", { length: 160 }).notNull().default(""),
  attendees: json<string[]>("attendees").notNull(),
  // { item, presenter, minutes }
  agenda: json<{ item: string; presenter: string; minutes: string }[]>("agenda").notNull(),
  // { text, ownerId, due, status }
  actions: json<{ id: string; text: string; ownerId: string; due: string; status: string }[]>("actions").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("Planned"),
  createdBy: ref("created_by").notNull(),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [index("meetings_project").on(t.projectId)]);

/** Requirements traceability: EIR/AIR requirement -> BEP response -> MIDP containers -> delivery. */
export const requirements = mysqlTable("requirements", {
  id: id(),
  projectId: ref("project_id").notNull(),
  ref: varchar("ref", { length: 40 }).notNull(),
  text: varchar("text", { length: 2000 }).notNull(),
  source: varchar("source", { length: 160 }).notNull().default(""),
  category: varchar("category", { length: 60 }).notNull().default(""),
  response: varchar("response", { length: 2000 }).notNull().default(""),
  deliverableIds: json<string[]>("deliverable_ids").notNull(),
  createdAt: created(),
}, (t) => [index("requirements_project").on(t.projectId)]);

export const quizAttempts = mysqlTable("quiz_attempts", {
  id: id(),
  userId: ref("user_id").notNull(),
  mode: varchar("mode", { length: 16 }).notNull(),
  topic: varchar("topic", { length: 60 }).notNull().default(""),
  score: int("score").notNull(),
  total: int("total").notNull(),
  // per-topic correct/total for the skill profile
  byTopic: json<Record<string, [number, number]>>("by_topic").notNull(),
  seconds: int("seconds").notNull().default(0),
  createdAt: created(),
}, (t) => [index("quiz_user").on(t.userId)]);

export const passwordResets = mysqlTable("password_resets", {
  id: id(),
  userId: ref("user_id").notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  usedAt: datetime("used_at", { mode: "date" }),
  createdAt: created(),
}, (t) => [uniqueIndex("password_resets_token").on(t.tokenHash)]);

/** Enquiries sent from the public "Talk to us" form (Admin › Leads). */
export const leads = mysqlTable("leads", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 160 }).notNull().default(""),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  interest: varchar("interest", { length: 40 }).notNull().default(""),
  message: varchar("message", { length: 4000 }).notNull().default(""),
  source: varchar("source", { length: 120 }).notNull().default(""),
  status: varchar("status", { length: 16 }).notNull().default("New"),
  note: varchar("note", { length: 2000 }).notNull().default(""),
  createdAt: created(),
}, (t) => [index("leads_created").on(t.createdAt)]);

export const emailVerifications = mysqlTable("email_verifications", {
  id: id(),
  userId: ref("user_id").notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  usedAt: datetime("used_at", { mode: "date" }),
  createdAt: created(),
}, (t) => [uniqueIndex("email_verifications_token").on(t.tokenHash), index("email_verifications_user").on(t.userId)]);

export const feedback = mysqlTable("feedback", {
  id: id(),
  userId: ref("user_id").notNull(),
  kind: varchar("kind", { length: 16 }).notNull(),
  message: varchar("message", { length: 4000 }).notNull(),
  page: varchar("page", { length: 255 }).notNull().default(""),
  status: varchar("status", { length: 16 }).notNull().default("New"),
  screenshot: mediumtext("screenshot"),
  reply: varchar("reply", { length: 4000 }).notNull().default(""),
  repliedAt: datetime("replied_at", { mode: "date" }),
  createdAt: created(),
});

/** Platform-wide settings (e.g. organisation branding), one JSON value per key. */
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: json<Record<string, unknown>>("value").notNull(),
});

/** Daily snapshot of a project's health, for trends over time. */
export const qualitySnapshots = mysqlTable("quality_snapshots", {
  id: id(),
  projectId: ref("project_id").notNull(),
  day: varchar("day", { length: 10 }).notNull(),
  qualityScore: int("quality_score").notNull(),
  errors: int("errors").notNull(),
  warnings: int("warnings").notNull(),
  progress: int("progress").notNull(),
  overdue: int("overdue").notNull(),
  openIssues: int("open_issues").notNull(),
  modelQuality: int("model_quality"),
}, (t) => [uniqueIndex("snap_project_day").on(t.projectId, t.day)]);

/** Project automations ("agents") that run on a schedule, with run history. */
export const agents = mysqlTable("agents", {
  id: id(),
  projectId: ref("project_id").notNull(),
  kind: varchar("kind", { length: 30 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  frequency: varchar("frequency", { length: 10 }).notNull().default("weekly"),
  lastRunAt: datetime("last_run_at", { mode: "date" }),
  createdBy: ref("created_by").notNull(),
  createdAt: created(),
}, (t) => [index("agents_project").on(t.projectId)]);

export const agentRuns = mysqlTable("agent_runs", {
  id: id(),
  agentId: ref("agent_id").notNull(),
  projectId: ref("project_id").notNull(),
  startedAt: datetime("started_at", { mode: "date" }).notNull(),
  status: varchar("status", { length: 10 }).notNull(),
  summary: text("summary"),
  trigger: varchar("trigger", { length: 10 }).notNull().default("schedule"),
}, (t) => [index("agent_runs_agent").on(t.agentId)]);

/** AI research notebook: a set of sources (pasted text, project documents, project PDF files) and saved notes. */
export const notebooks = mysqlTable("notebooks", {
  id: id(),
  projectId: ref("project_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  // { id, kind: "text" | "document" | "file", name, text?, refId? }
  sources: json<{ id: string; kind: string; name: string; text?: string; refId?: string }[]>("sources").notNull(),
  notes: json<{ id: string; question: string; answer: string; at: string }[]>("notes").notNull(),
  createdBy: ref("created_by").notNull(),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [index("notebooks_project").on(t.projectId)]);

export const lessonProgress = mysqlTable("lesson_progress", {
  userId: ref("user_id").notNull(),
  courseId: varchar("course_id", { length: 40 }).notNull(),
  lessonId: varchar("lesson_id", { length: 40 }).notNull(),
  completedAt: datetime("completed_at", { mode: "date" }).notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.courseId, t.lessonId] })]);

/** 4D plan: programme activities linked to model elements (storey × IFC class) of one IFC file. */
export const fourdPlans = mysqlTable("fourd_plans", {
  projectId: varchar("project_id", { length: 36 }).primaryKey(),
  fileId: ref("file_id"),
  fileName: varchar("file_name", { length: 255 }).notNull().default(""),
  fileVersion: int("file_version").notNull().default(0),
  grid: json<{ storeys: string[]; classes: string[]; counts: Record<string, number> }>("grid"),
  activities: json<{ id: string; code: string; name: string; start: string; finish: string; actualStart: string; actualFinish: string; storeys: string[]; classes: string[] }[]>("activities").notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
});

/** Opt-in professional profile for the talent pool; nothing is visible unless `visible` is set. */
export const talentProfiles = mysqlTable("talent_profiles", {
  userId: varchar("user_id", { length: 36 }).primaryKey(),
  visible: boolean("visible").notNull().default(false),
  showResults: boolean("show_results").notNull().default(false),
  headline: varchar("headline", { length: 160 }).notNull().default(""),
  skills: json<string[]>("skills").notNull(),
  certifications: json<string[]>("certifications").notNull(),
  years: int("years").notNull().default(0),
  location: varchar("location", { length: 120 }).notNull().default(""),
  availability: varchar("availability", { length: 20 }).notNull().default("Not looking"),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
});

export const talentViews = mysqlTable("talent_views", {
  id: id(),
  recruiterId: ref("recruiter_id").notNull(),
  userId: ref("user_id").notNull(),
  createdAt: created(),
}, (t) => [index("talent_views_user").on(t.userId)]);

/** Saved estimates (BIM fee, embodied carbon) attached to a project. */
export const estimates = mysqlTable("estimates", {
  id: id(),
  projectId: ref("project_id").notNull(),
  kind: varchar("kind", { length: 10 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  input: json<Record<string, unknown>>("input").notNull(),
  summary: varchar("summary", { length: 300 }).notNull().default(""),
  createdBy: ref("created_by").notNull(),
  createdAt: created(),
}, (t) => [index("estimates_project").on(t.projectId)]);

export const subscriptions = mysqlTable("subscriptions", {
  userId: varchar("user_id", { length: 36 }).primaryKey(),
  plan: varchar("plan", { length: 16 }).notNull().default("free"),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  renewsAt: datetime("renews_at", { mode: "date" }),
  source: varchar("source", { length: 60 }).notNull().default(""),
  stripeCustomerId: varchar("stripe_customer_id", { length: 64 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 64 }),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
});

export const promoCodes = mysqlTable("promo_codes", {
  code: varchar("code", { length: 40 }).primaryKey(),
  plan: varchar("plan", { length: 16 }).notNull(),
  months: int("months").notNull(),
  maxUses: int("max_uses").notNull().default(1),
  uses: int("uses").notNull().default(0),
  expiresAt: datetime("expires_at", { mode: "date" }),
  createdAt: created(),
});

export const aiUsage = mysqlTable("ai_usage", {
  userId: varchar("user_id", { length: 36 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  count: int("count").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.month] })]);

// ---------- health & safety information (ISO 19650-6) ----------
export const hsItems = mysqlTable("hs_items", {
  id: id(),
  projectId: ref("project_id").notNull(),
  number: int("number").notNull(),
  hazard: varchar("hazard", { length: 255 }).notNull(),
  location: varchar("location", { length: 160 }).notNull().default(""),
  phase: varchar("phase", { length: 24 }).notNull().default("Construction"),
  description: varchar("description", { length: 1000 }).notNull().default(""),
  controls: varchar("controls", { length: 1000 }).notNull().default(""),
  residual: varchar("residual", { length: 8 }).notNull().default("Medium"),
  audience: varchar("audience", { length: 160 }).notNull().default(""),
  fileId: ref("file_id"),
  ownerId: ref("owner_id"),
  status: varchar("status", { length: 16 }).notNull().default("Open"),
  createdAt: created(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [index("hs_project").on(t.projectId)]);

/** Organization "house" templates: a saved document's content reused as the start of new documents. */
export const houseTemplates = mysqlTable("house_templates", {
  id: id(),
  organization: varchar("organization", { length: 160 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  templateId: varchar("template_id", { length: 40 }).notNull(),
  values: json<Record<string, unknown>>("values").notNull(),
  createdBy: ref("created_by").notNull(),
  createdAt: created(),
}, (t) => [index("house_templates_org").on(t.organization)]);

/** Courses a project manager assigns to team members. */
export const courseAssignments = mysqlTable("course_assignments", {
  id: id(),
  projectId: ref("project_id").notNull(),
  courseId: varchar("course_id", { length: 40 }).notNull(),
  userId: ref("user_id").notNull(),
  dueDate: varchar("due_date", { length: 10 }).notNull().default(""),
  assignedBy: ref("assigned_by").notNull(),
  createdAt: created(),
}, (t) => [index("course_assignments_project").on(t.projectId), uniqueIndex("course_assignments_unique").on(t.projectId, t.courseId, t.userId)]);

/** Per-user progress through the organization ISO 19650 implementation guide. */
export const adoptionProgress = mysqlTable("adoption_progress", {
  userId: varchar("user_id", { length: 36 }).primaryKey(),
  data: json<Record<string, { status: string; owner: string; due: string; note: string }>>("data").notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
});

/** Curated downloads library maintained by administrators. */
export const resources = mysqlTable("resources", {
  id: id(),
  title: varchar("title", { length: 200 }).notNull(),
  description: varchar("description", { length: 2000 }).notNull().default(""),
  category: varchar("category", { length: 40 }).notNull(),
  part: varchar("part", { length: 16 }).notNull().default(""),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  storageKey: varchar("storage_key", { length: 255 }).notNull(),
  downloads: int("downloads").notNull().default(0),
  uploadedBy: ref("uploaded_by").notNull(),
  createdAt: created(),
}, (t) => [index("resources_category").on(t.category)]);

// The organisation's own training videos: an uploaded file streamed from storage, or a YouTube / Vimeo link.
export const companyVideos = mysqlTable("company_videos", {
  id: id(),
  title: varchar("title", { length: 200 }).notNull(),
  description: varchar("description", { length: 2000 }).notNull().default(""),
  topic: varchar("topic", { length: 60 }).notNull(),
  lang: varchar("lang", { length: 8 }).notNull().default("en"),
  source: varchar("source", { length: 8 }).notNull(), // "file" | "youtube" | "vimeo"
  url: varchar("url", { length: 500 }).notNull().default(""),
  fileName: varchar("file_name", { length: 255 }).notNull().default(""),
  mimeType: varchar("mime_type", { length: 120 }).notNull().default(""),
  size: bigint("size", { mode: "number" }).notNull().default(0),
  storageKey: varchar("storage_key", { length: 255 }).notNull().default(""),
  views: int("views").notNull().default(0),
  /** where the video appears in the learning paths: a path, optionally one of its steps (empty = the path's overview) */
  placements: json<{ pathId: string; step: string }[]>("placements"),
  uploadedBy: ref("uploaded_by").notNull(),
  createdAt: created(),
}, (t) => [index("company_videos_topic").on(t.topic)]);

/** A learning-path final exam: the questions are drawn and kept on the server, so the score can be trusted. */
export const pathExams = mysqlTable("path_exams", {
  id: id(),
  userId: ref("user_id").notNull(),
  pathId: varchar("path_id", { length: 40 }).notNull(),
  questionIds: json<string[]>("question_ids").notNull(),
  startedAt: datetime("started_at", { mode: "date" }).notNull(),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  submittedAt: datetime("submitted_at", { mode: "date" }),
  score: int("score").notNull().default(0),
  total: int("total").notNull().default(0),
  pct: int("pct").notNull().default(0),
  passed: boolean("passed").notNull().default(false),
}, (t) => [index("path_exams_user").on(t.userId, t.pathId)]);

/** Certificate issued for passing a learning-path exam; anyone can verify it by its code. */
export const certificates = mysqlTable("certificates", {
  id: id(),
  code: varchar("code", { length: 20 }).notNull(),
  userId: ref("user_id").notNull(),
  examId: ref("exam_id").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  pathId: varchar("path_id", { length: 40 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  pct: int("pct").notNull(),
  issuer: varchar("issuer", { length: 160 }).notNull(),
  signatoryName: varchar("signatory_name", { length: 160 }).notNull().default(""),
  signatoryTitle: varchar("signatory_title", { length: 160 }).notNull().default(""),
  issuedAt: datetime("issued_at", { mode: "date" }).notNull(),
}, (t) => [uniqueIndex("certificates_code").on(t.code), index("certificates_user").on(t.userId)]);

/** One row per completed Claude API response, including pause-turn continuations. Independent of quotas. */
export const aiTokenUsage = mysqlTable("ai_token_usage", {
  id: id(), userId: ref("user_id"), feature: varchar("feature", { length: 255 }).notNull(),
  model: varchar("model", { length: 120 }).notNull(),
  inputTokens: bigint("input_tokens", { mode: "number", unsigned: true }).notNull(),
  outputTokens: bigint("output_tokens", { mode: "number", unsigned: true }).notNull(),
  cacheCreationInputTokens: bigint("cache_creation_input_tokens", { mode: "number", unsigned: true }).notNull(),
  cacheReadInputTokens: bigint("cache_read_input_tokens", { mode: "number", unsigned: true }).notNull(),
  serverToolUse: json<Record<string, number>>("server_tool_use").notNull(),
  rawUsage: json<Record<string, unknown>>("raw_usage").notNull(), createdAt: created(),
}, (t) => [index("ai_token_usage_time").on(t.createdAt), index("ai_token_usage_user_time").on(t.userId, t.createdAt)]);

/** An email an administrator sent to a group of users (Admin › Email users). Sent in the background, one by one. */
export const emailCampaigns = mysqlTable("email_campaigns", {
  id: id(), subject: varchar("subject", { length: 255 }).notNull(),
  blocks: json<Record<string, unknown>>("blocks").notNull(),
  filter: json<Record<string, unknown> | null>("filter"),
  /** sending | paused | done | cancelled */
  status: varchar("status", { length: 16 }).notNull(),
  total: int("total").notNull(), delayMs: int("delay_ms").notNull(),
  createdBy: ref("created_by").notNull(), createdAt: created(),
  finishedAt: datetime("finished_at", { mode: "date" }),
}, (t) => [index("email_campaigns_time").on(t.createdAt)]);

export const emailCampaignRecipients = mysqlTable("email_campaign_recipients", {
  campaignId: ref("campaign_id").notNull(), userId: ref("user_id").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  /** pending | sent | failed | skipped */
  status: varchar("status", { length: 10 }).notNull().default("pending"),
  error: varchar("error", { length: 255 }).notNull().default(""),
  sentAt: datetime("sent_at", { mode: "date" }),
}, (t) => [primaryKey({ columns: [t.campaignId, t.userId] }), index("email_campaign_recipients_status").on(t.campaignId, t.status)]);
