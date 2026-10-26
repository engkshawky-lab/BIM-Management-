import type { CdeState, FieldValue } from "../../../shared/documents";

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; form?: FormData; keepalive?: boolean } = {}): Promise<T> {
  const res = await fetch("/api" + path, {
    method: opts.method ?? (opts.body || opts.form ? "POST" : "GET"),
    credentials: "same-origin",
    keepalive: opts.keepalive,
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.form ?? (opts.body ? JSON.stringify(opts.body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

export interface User {
  id: string; email: string; name: string; organization: string; jobTitle: string; phone: string; bio: string | null;
  role: string; bimRole: string | null; favourites: string[] | null; emailPref?: string; locale?: string; createdAt: string; lastLoginAt: string | null;
}

export type ProjectRole = "viewer" | "editor" | "manager" | "owner";

export interface Project {
  id: string; name: string; code: string; description: string | null; appointingParty: string; location: string;
  standards: ("iso19650" | "iso42001")[]; stage: string; standardId: string | null; standardStage: string; ownerId: string; createdAt: string; updatedAt: string;
  role?: ProjectRole; documents?: number; files?: number; members?: number;
}

export interface Member { userId: string; name: string; email: string; organization: string; jobTitle: string; role: ProjectRole; joinedAt: string }
export interface Invitation { id: string; email: string; role: string; createdAt: string }

export interface Folder { id: string; projectId: string; parentId: string | null; name: string; cdeState: CdeState | null }
export interface FileRow {
  id: string; folderId: string; name: string; containerName: string; state: CdeState; suitability: string; revision: string;
  currentVersion: number; documentId: string | null; uploadedByName: string; updatedAt: string;
}
export interface FileVersion { id: string; version: number; size: number; mimeType: string; note: string; uploadedByName: string; createdAt: string }

export interface DocRow {
  id: string; projectId: string; templateId: string; title: string; containerName: string; revision: string; state: CdeState;
  suitability: string; authorId: string; authorName?: string; reviewerId: string | null; reviewStatus: "none" | "requested" | "approved" | "changes";
  values: Record<string, FieldValue>; updatedAt: string; createdAt: string;
}
export interface RevisionRow { id: string; revision: string; state: CdeState; suitability: string; note: string; createdAt: string; authorName: string | null }

export interface CommentRow { id: string; userId: string; userName: string; body: string; sectionId: string | null; resolved: boolean; createdAt: string }
export interface ActivityRow { id: string; userName: string; action: string; summary: string; link: string; createdAt: string }
export interface Notification { id: string; message: string; link: string; read: boolean; createdAt: string; projectId: string | null }

export const canEdit = (r?: ProjectRole) => r === "editor" || r === "manager" || r === "owner";
export const canManage = (r?: ProjectRole) => r === "manager" || r === "owner";

export const fmtDate = (s: string) => new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
export const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);
