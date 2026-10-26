# ISO Information Management Portal

Knowledge, workflows, templates and controlled document creation for:

- **ISO 19650** — information management using BIM (Parts 1–6)
- **ISO/IEC 42001** — AI management system (AIMS)

## Modules

| Module | What it does |
|---|---|
| Knowledge library | ISO 19650 parts, the 19650-2 delivery process (5.1–5.8), CDE states and suitability codes, glossary. ISO/IEC 42001 clauses 4–10, all 38 Annex A controls, AI-in-BIM use cases, glossary. Searchable. |
| Workflows | Stage-gated ISO 19650-2 delivery workflow (8 stages) and ISO/IEC 42001 implementation workflow (6 stages). Track activity status, approve gates (name/date/note), open the linked template from each activity. |
| Templates | 28 structured templates (16 × ISO 19650, 12 × ISO/IEC 42001) with guidance, example rows and clause references — EIR, OIR, AIR, BEP pre/post, MIDP, TIDP, responsibility matrix, information standard, CDE procedure, information protocol, QA checklist, AI policy, AI risk assessment, AISIA, Statement of Applicability (all 38 controls), internal audit, management review, CAPA… |
| Document builder | Section-by-section editor with live preview, CDE workflow (WIP → Shared → Published → Archived) with suitability codes, automatic revisions (P01.01 → P01 → C01) and revision history. Export to Word (.docx), Markdown or Print/PDF. |
| Document register | All documents with state, suitability and revision; filter and CSV export. |
| Naming tool | Generator and validator for container names (UK NA field structure). |
| References | Related standards and free guidance sources. |

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

The build is a static site (deploy `dist/` to any static host). Data is currently stored in the browser (localStorage) — a server/database with users and roles is the next phase.

> Standard summaries are paraphrased guidance and do not reproduce standard text. Always verify against the licensed editions.
