import { boolean, customType, datetime, index, int, mysqlTable, primaryKey, text, uniqueIndex, varchar, bigint } from "drizzle-orm/mysql-core";

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
  createdAt: created(),
  lastLoginAt: datetime("last_login_at", { mode: "date" }),
  disabled: int("disabled").notNull().default(0),
  /** instant | digest | off */
  emailPref: varchar("email_pref", { length: 10 }).notNull().default("instant"),
  locale: varchar("locale", { length: 5 }).notNull().default("en"),
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

export const feedback = mysqlTable("feedback", {
  id: id(),
  userId: ref("user_id").notNull(),
  kind: varchar("kind", { length: 16 }).notNull(),
  message: varchar("message", { length: 4000 }).notNull(),
  page: varchar("page", { length: 255 }).notNull().default(""),
  status: varchar("status", { length: 16 }).notNull().default("New"),
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
