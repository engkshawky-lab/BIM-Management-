# Feature migration matrix — `iso19650_platform_deploy` → `BIM-Management-`

Every feature from the old platform is kept, but reviewed and rebuilt for real project use. Old tools that were stand-alone pages become parts of the project workspace, reading and writing real project data instead of throw-away forms.

## Navigation: hubs, not tabs

The old platform exposed ~100 separate pages, many doing the same job (e.g. MIDP generator, TIDP generator, planner and MPDT generator; CDE guide, CDE simulator and CDE game; chat, expert chat, project consultant and project advisor). The new portal groups everything into **6 project hubs** and **1 knowledge hub**:

| Hub | Contains |
|---|---|
| Overview | Summary · Activity |
| Information (CDE) | Documents · Files |
| Delivery | MIDP/TIDP · Teams & milestones · Responsibility · LOIN · Process gates · Risks · Handover |
| Model & coordination | Validation · Issues (BCF) · Clash matrix |
| Quality | One report for documents, plan, document set (single place for all findings) |
| Team & settings | Team · Project settings |
| Knowledge hub (global) | ISO 19650 / ISO/IEC 42001 → Library · Templates · Naming & codes · References |

**No-duplication rules**
- Each feature has exactly one home; other places link to it instead of repeating it (e.g. the planner shows a one-line plan-check summary and links to Quality for the full list).
- Data is entered once. Documents that summarise structured data (MIDP, TIDP, responsibility matrix, risk register) are **generated** from it; the server refuses hand-made copies of these templates.
- New legacy features are added to an existing hub before a new hub is considered.

Legend — **Status**: ✅ done · 🔜 next phase · ⏳ later phase. **Phase** refers to the roadmap at the bottom.

## 1. Project information management (ISO 19650)

| Old module(s) | New home | What changes | Status |
|---|---|---|---|
| `multi-project`, `my-day`, `dashboard` | Home + project workspace | Real projects with members/roles; *My Day* becomes a personal task inbox (reviews, assigned containers, mentions, overdue) — phase 5 | ✅ |
| `docs`, `sample-docs`, `downloads`, `eir`, `air-gen`, `bep`, `bim-scope-gen`, `mpdt-gen` | Templates + Document builder | 30 structured templates incl. *BIM scope of services* and *MPDT*, collaborative editing, revisions, Word export; sample docs become "Example" pre-filled variants | ✅ |
| `midp-gen`, `tidp-gen`, `planner` | Delivery plan → planner | Real MIDP/TIDP data with Gantt, dependencies, import, document generation | ✅ |
| `raci` | Delivery plan → responsibility matrix | Per-task-team RACI with accountability checks | ✅ |
| `lod` | Delivery plan → LOIN matrix | LOIN per element/milestone (ISO 7817-1); LOD/LOI explainer moves to Learn | ✅ |
| `cde-guide`, `cde-simulator`, `cde-game` | Files (CDE) + Learn | Real CDE with states, suitability, versions. Simulator/game become an interactive lesson in Learn | ✅ |
| `suitability`, `flow-builder` (naming) | Naming & status tool | Generator, validator, used by planner and quality checks | ✅ |
| `process`, `process-map`, `workflow-diagram`, `timeline` | Delivery hub → Process gates | Stage-gated workflows per project; add a visual process map view | ✅ |
| `quality-hub`, `health`, `audit`, `project-readiness`, `progress` | Quality hub | One automated quality report; add trend over time and audit evidence pack export | ✅ |
| `risk` | Delivery hub → Risks | Information-delivery risk register as structured data (likelihood × impact heat-map, owners, actions) instead of a template only | ✅ |
| `version` | Document → Compare revisions | Field-by-field diff between any two revisions (replaces BEP version compare) | ✅ |
| `change-impact` | Delivery plan → Change impact | Select a container/milestone change → see dependent containers, milestones and documents affected | ✅ |
| `traceability` | Requirements traceability | EIR requirement → BEP response → MIDP container → delivered file, with coverage gaps | ✅ |
| `tracker` (PIM→AIM), `handover-guide`, `aim-guide` | Delivery hub → Handover | Handover checklist driven by AIR, COBie validation, O&M file completeness, AIM transfer record | ✅ |
| `part5-sec`, `part3`, `cases-ext` (Part 6) | Security & H&S tools | ISO 19650-5 sensitivity assessment & security triage as a guided form; Part 6 H&S information register | ✅ |
| `clause`, `parts`, `all-parts`, `glossary` | Knowledge library | Done; add cross-links from every tool to the clause it implements | ✅ |
| `updates`, `news-feed` | Knowledge → Standards updates | Curated list of standard editions/amendments with dates | ✅ |
| `regional`, `multilang` | Settings → Region & language | National annex choice (UK NA naming) + Arabic/English UI | ✅ |
| `contract-scan` | AI → Appointment document review | Upload appointment/contract → AI checks for information protocol, IP, liability clauses with citations | ✅ |

## 2. Validation and model data

| Old module(s) | New home | What changes | Status |
|---|---|---|---|
| `ifc` (IFC Analyser), `ids-validator`, `qaqc` | Validation hub | IFC uploaded to the CDE is analysed automatically: element counts by class, property completeness against the project LOIN, IDS check, naming. Results attach to the file and block "Shared" when failing | ✅ |
| `cobie`, `cobie-article`, `dispute-guide` | Validation hub → COBie | Upload COBie xlsx → sheet/field/reference validation, report, issues | ✅ |
| `clash-matrix`, `ai-clash-advisor`, `clash-rfi` | Coordination → Clash matrix | Discipline-pair clash test matrix with tolerances; clash report import grouped into issues | ✅ |
| `issue-centre`, `bcf-learning` | Coordination → Issues (BCF) | Project issue tracker (BCF-style topics: type, priority, status, assignee, due, linked file/container, comments); BCF zip import/export | ✅ |
| `4d-bim`, `6d-carbon`, `scan-to-bim`, `dt-readiness`, `forma-monitor`, `infrastructure`, `facade` | Specialist tools | 4D: link planner to model elements; 6D: embodied-carbon estimator per element; scan-to-BIM & digital-twin readiness as assessments; infrastructure/facade as template packs | ✅ |
| `revit-bp`, `pool-bp` | Learn → Best-practice guides | Kept as guides; link from relevant templates | ✅ |
| `bim-fee` | Tools → BIM fee estimator | Fee estimator using project size/stages/services; save estimate to project | ✅ |
| `export` | Every list has CSV/Word export | Done per tool | ✅ |

## 3. AI

| Old module(s) | New home | What changes | Status |
|---|---|---|---|
| `chat`, `expert-chat`, `project-consultant`, `project-advisor` | AI assistant (per project) | One assistant that answers using the project's documents, plan, files and quality findings, with citations | ✅ |
| `agent-room`, `mcp-ai` | AI agents | Scheduled agents (e.g. weekly quality review, overdue chaser) with run history | ✅ |
| `notebook-lab` | AI → Research notebook | Upload sources → summarise/compare; save notes to project | ✅ |
| AI drafting (document generators) | Document builder | Done: per-section draft with review-before-apply | ✅ |
| `decision-tree`, `need-concierge`, concierge requests | AI → Guided wizard + Help desk | Wizard asks about the project and recommends templates/workflow; concierge becomes a support request queue for admins | ✅ |

## 4. ISO/IEC 42001

| Old module(s) | New home | What changes | Status |
|---|---|---|---|
| (new) | Library, workflow, 12 templates, SoA, quality rules | Done | ✅ |
| (new) | AI system register + risk/impact registers as data | Inventory, risk and impact assessments as structured registers feeding the SoA and audit pack | ✅ |

## 5. Learning and careers

| Old module(s) | New home | What changes | Status |
|---|---|---|---|
| `quiz`, `mockexam`, `exam-hub`, `bsi-exam`, `rics-exam`, `article-exams`, `diagnostic`, `skillgap`, `bim-maturity` | Learn → Assessments | Question bank by topic, timed mock exams, results history, skill-gap profile from results, organisation maturity assessment | ✅ |
| `videos`, `animations`, `orgtraining`, `expert-module`, `adaptive`, `applied` | Learn → Courses | Courses made of lessons (video, text, quiz), progress tracking, team training assignments | ✅ |
| `scenarios`, `scenarios-ext`, `cases-hub`, `simulator`, `games` | Learn → Scenarios | Interactive case scenarios with decisions and feedback | ✅ |
| `interview` | Learn → Interview coach | AI mock interview with feedback | ✅ |
| `cv-pool`, recruiter role, recruiter audit | Talent pool | Engineer profiles (skills, certifications, exam results), recruiter search with consent controls | ✅ |
| `bim-impl` | Learn → Implementation guide | Step-by-step ISO 19650 adoption plan for an organisation, tracked as tasks | ✅ |

## 6. Platform

| Old module(s) | New home | What changes | Status |
|---|---|---|---|
| `profile`, auth, password reset | Accounts + profile | Done; add password reset by email | ✅ |
| Admin dashboard, impersonation, permissions audit | Admin console | Users, organisations, usage, audit log; impersonation only with audit trail | ✅ (impersonation deliberately not built — admins issue reset links instead; changes to users and reset links are logged) |
| Promo pages, promo codes, subscriptions, renew | Plans & billing | Public landing page, plans, promo codes, subscription status | ✅ |
| `feedback`, `support` | Help → Feedback & support | In-app feedback with screenshots; support tickets | ✅ |
| Organisation BEP templates, branding presets | Organisation settings | Org template library, logo/colours on Word exports | ✅ |
| Notifications, email sharing of reports | Notifications | In-app done; email delivery and digest | ✅ |
| Cost plan saves | Tools → Cost plans | Linked to BIM fee estimator | ✅ |

## Added after the roadmap

- **Setup wizard** — six questions recommend the documents, standards and tools; creates a project (or adds to one) with the documents ready.
- **Process map** on Process gates — stage strip with gate state and activity progress.
- **Audit evidence pack** — one zip from the Quality hub: every document in Word, quality findings, all registers, stage gates and the activity log, indexed by ISO clause.
- **Health & safety information register** (ISO 19650-6) with lifecycle phase, residual risk, audience and linked CDE file.
- **House templates** — save any document as an organization template and start new documents from it (project facts are never copied).
- **Team training** — managers assign courses with due dates; completion comes from lesson progress.
- **Implementation guide** — 18-step organization adoption plan tracked per user; **best-practice guides** linked to templates.
- **Infrastructure and façade** information requirement templates.
- **Help & support** — requests with screenshots, admin replies and notifications.

## Roadmap

1. ✅ Core platform — accounts, projects, team, CDE, documents, collaboration, workflows.
2. ✅ Delivery — MIDP/TIDP, RACI, LOIN, quality report.
3. ✅ **Validation & coordination** — IFC analyser + LOIN/IDS checks, COBie checker, issues (BCF), clash matrix, risk register, revision compare, change impact, handover module, new templates (BIM scope, MPDT).
3b. ✅ **Client standards & delivery+** — client standards import, COBie v2, asset tags, information uses, MRM, QA/QC reviews, clash search sets, meetings & progress report, full BEP/CCA/handover/spec templates, MIDP Excel.
4. ✅ **AI & requirements** — project AI assistant with citations, requirements traceability (with AI extraction), appointment review, ISO 19650-5 security triage. Scheduled automations, research notebook and AI clash triage ✅ (later batch).
5. ✅ **Dashboards & tools** — My Day, portfolio dashboard, BIM fee estimator, embodied carbon, maturity / digital-twin / scan-to-BIM assessments. Quality trends, 4D planning and saved estimates ✅ (later batch).
6. ✅ **Learn** — question bank, practice, timed mock exam, skill profile, scenarios. Courses with videos, interview coach and standards updates ✅ (later batch).
7. ✅ **Admin** — admin console, users/roles/disable, reset links + forgot password, feedback, branding. Email (SMTP), talent pool, plans & billing and Arabic UI ✅ (later batch). Card payments (Stripe) and Arabic page content and exports ✅.
