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
  createdAt: created(),
  lastLoginAt: datetime("last_login_at", { mode: "date" }),
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
  sectionId: varchar("section_id", { length: 60 }),
  userId: ref("user_id").notNull(),
  body: text("body").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: created(),
}, (t) => [index("comments_document").on(t.documentId), index("comments_file").on(t.fileId)]);

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
  createdAt: created(),
}, (t) => [index("notifications_user").on(t.userId)]);

export const workflowProgress = mysqlTable("workflow_progress", {
  projectId: ref("project_id").notNull(),
  workflowId: varchar("workflow_id", { length: 40 }).notNull(),
  data: json<unknown>("data").notNull(),
  updatedBy: ref("updated_by").notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
}, (t) => [primaryKey({ columns: [t.projectId, t.workflowId] })]);
