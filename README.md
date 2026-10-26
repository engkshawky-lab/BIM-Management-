# ISO Information Management Portal

Collaborative platform for **ISO 19650** (BIM information management) and **ISO/IEC 42001** (AI management systems): projects, CDE file management, controlled document creation, review/approval workflows and a knowledge library.

Stack (same as `iso19650_platform_deploy`): React + Vite client, Express server, Drizzle ORM on MySQL/MariaDB, bcrypt + signed-cookie sessions, multer uploads, `docx` export, Claude for AI drafting.

## What's in phase 1

| Area | Features |
|---|---|
| Accounts | Register / sign in / sign out, profile page (name, organization, job title, phone, bio), change password. First account becomes platform admin. |
| Projects | Create projects (code, appointing party, stage, standards in scope). Overview, settings, delete. |
| Team | Add members by email with roles (viewer / editor / manager / owner). People without an account get an invitation and join automatically when they register. |
| Files (CDE) | Default folders WIP / Shared / Published / Archived / Client information / Reference, sub-folders, drag-and-drop upload of any file type, versioning (upload new version, download any version), CDE state + suitability + revision per file, move, comments, preview for PDF/images. |
| Documents | 28 templates (16 ISO 19650, 12 ISO/IEC 42001). Project details pre-filled. Section editor with progress, autosave, Excel paste into tables, live preview. AI drafting per section (review before apply). |
| Collaboration | Edit lock with live read-only view for others, section comments with @mentions, review requests, reviewer approve / request changes, notifications bell, project activity feed. |
| Document control | WIP → Shared → Published → Archived with suitability codes, automatic revisions (P01.01 → P01 → C01), full revision history with snapshots and restore. Role rules: reviewers/managers share, managers publish/archive. |
| Export | Word (cover page, document control, approval table, contents, headers/footers with page numbers), Markdown, Print/PDF, and **Save to project files** (versioned in the CDE). |
| Workflows | ISO 19650-2 delivery workflow and ISO/IEC 42001 implementation workflow per project, activity status, stage gates approved by managers, linked documents per activity. |
| Delivery plan *(phase 2)* | Task teams (originator/role codes, lead) and information delivery milestones. MIDP/TIDP planner: containers with auto-numbered names, LOIN, milestone, dates, dependencies, responsible person, status; table and Gantt views; Excel/CSV import and CSV export; one-click generation of MIDP / TIDP documents. Responsibility (RACI) matrix per task team with accountability checks and DRM document generation. LOIN matrix per element and milestone (ISO 7817-1). |
| Quality *(phase 2)* | Automated checks: required document set per standard, completeness and placeholders per document, template rules (EIR milestones & acceptance criteria, BEP named roles, SoA justifications, AI risk treatment…), container naming, plan dates vs milestones, dependency order and cycles, duplicates, overdue items. Scores, drill-down and CSV export. |
| Validation *(phase 3)* | IFC models (IFC2x3/4/4x3) and COBie workbooks are validated automatically on every upload with a built-in TypeScript STEP reader (no Python needed): header, spatial structure, names, property sets (instance + type), classification, georeferencing, units, GUID uniqueness, COBie attributes, plus requirements from the project LOIN matrix and buildingSMART IDS files. COBie: sheets, columns, mandatory fields, cross-references, uniqueness. Failing versions cannot be shared (manager override is logged). |
| Coordination *(phase 3)* | Issue tracker (BCF-style types, status, priority, assignee, due, task team, model element GUIDs, discussion), BCF 2.1 import/export, issues raised from validation errors, clash test matrix per task-team pair, clash report import (Navisworks/Solibri/Revizto CSV) grouped by grid location, risk register with heat map and residual scores, handover checklist (PIM → AIM) with evidence files. |
| Planning extras *(phase 3)* | Change-impact simulation through dependencies with milestone breach detection and one-click re-planning; field-by-field revision compare in documents; new BIM scope of services and MPDT templates (30 templates). |
| Client standards | Import a client's EIR appendix workbooks (COBie schema & picklists, stage matrix, classification dictionary, asset tag codification) — only the extracted rules are stored. Apply per project and stage: COBie validation checks stage-required fields, picklists, references, lengths and tags. Asset tag builder and bulk checker. |
| Delivery+ | Information uses (32) with schedule document; model responsibility matrix (team + LOD per element and milestone); requirements traceability (paste or AI-extract, link to MIDP, coverage); ISO 19650-2 activity starter for RACI; MIDP formats, classification, actual dates and variance, Excel export. |
| Quality & meetings | Model QA/QC reviews graded A–D per discipline (weighted, critical cap, issues for C/D); clash tests with codes and search sets; BIM meetings with standard agendas, minutes, carried-forward actions; generated minutes and BIM progress report. |
| AI (Claude) | Section drafting in documents; project assistant answering from project records with cited sources; requirement extraction; appointment/contract review against 12 ISO 19650 obligations. Set `CLAUDE_API_KEY`. |
| My work & tools | My Day inbox across projects; portfolio dashboard; BIM fee estimator; embodied-carbon estimator; maturity, digital-twin and scan-to-BIM readiness assessments. |
| Learn | 40-question bank in 7 topics, practice with feedback, timed mock exam, results history, skill profile, decision scenarios. |
| Admin | Admin console (usage, users, enable/disable, roles, password reset links, platform activity log, feedback queue), organisation branding on Word exports, "forgot password" flow, in-app feedback. |
| Templates | 35+ templates incl. full BEP pre/post, capability assessment, handover strategy, BIM specification, security triage (19650-5), information uses schedule, MRM, minutes, progress report. |
| Automation & email | Optional SMTP email (instant or daily digest per user), emailed reset links; background scheduler with daily health snapshots, quality trend charts, and project automations (overdue chaser, quality review, risk review) with run history. |
| AI+ | AI clash triage (reviewer accepts suggestions), research notebook over pasted text, project documents and PDFs with citations, AI interview coach. |
| 4D | Link programme activities to model elements by storey and IFC class; planned vs actual by date with timeline slider; unlinked and overlapping elements flagged. |
| Careers & billing | Opt-in talent profiles with consent and view notifications, recruiter role; plans with project/member/storage/AI limits (BILLING=on), promo codes, admin plan assignment; saved fee and carbon estimates. |
| Languages | English and Arabic (right-to-left) for navigation, menus, sign-in and profile. |
| Knowledge | ISO 19650 parts, 19650-2 process 5.1–5.8, CDE states and status codes, ISO/IEC 42001 clauses 4–10 and all 38 Annex A controls, glossaries, naming tool, references. |

## Run locally

```bash
cp .env.example .env          # set DATABASE_URL and SESSION_SECRET (32+ chars)
npm install
npm run dev                   # client http://localhost:5173, API :3001 (migrations run on start)
```

Production: `npm run build && npm start` — the server serves the built client and the API on `PORT`.
Uploaded files are stored in `UPLOAD_DIR` (default `./storage`) — mount persistent storage there.
Set `CLAUDE_API_KEY` to enable AI drafting.

Tests: `npm test` (unit). Type check: `npm run check`.

## Phases

Every feature of `iso19650_platform_deploy` is reviewed and rebuilt — see [docs/FEATURE_MIGRATION.md](docs/FEATURE_MIGRATION.md) for the full module-by-module matrix.

1. ✅ **Core platform** — accounts, projects, team, CDE files, document builder, review/approval, workflows.
2. ✅ **Delivery tools** — MIDP/TIDP planner with Gantt, responsibility matrix, LOIN matrix, quality checker. *(Still to port: BEP version comparison, information exchange ledger.)*
3. ✅ **Validation & coordination** — IFC/LOIN/IDS validation, COBie, issues + BCF, clash matrix, risk register, handover, change impact, revision compare.
4. **AI assistants** — project consultant chat over project documents, document Q&A, requirement traceability (atomic requirements graph), AI policy/risk copilots for 42001.
5. **Learning** — courses, quizzes, mock exams, videos, case studies, glossary games.
6. **Admin & organisation** — platform admin dashboard, organisation BEP templates, branding presets, email notifications, SSO.

> Standard summaries are paraphrased guidance and do not reproduce standard text. Always verify against the licensed editions.
