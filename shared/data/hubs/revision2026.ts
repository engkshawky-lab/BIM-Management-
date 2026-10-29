import type { Hub } from "./types";

// The 2026 revision of ISO 19650 Parts 1–3. Drafts only: the 2018/2020 editions stay in force until
// the new editions are published. Facts checked October 2026 against the ISO project pages
// (ISO/DIS 19650-1 and -2), nima's consultation notices and practitioner summaries. Renamed terms are
// what the consultation drafts were reported to propose and may change before publication, so the
// page labels each item as confirmed or reported.

export const revision2026Hub: Hub = {
  id: "revision-2026",
  tone: "red",
  eyebrow: "ISO 19650 · 2026 REVISION (DRAFT)",
  title: "ISO 19650 — the 2026 revision",
  intro:
    "Parts 1, 2 and 3 of ISO 19650 are being revised. The drafts move from a delivery-phase standard to one whole-life information management process, with Part 3 becoming implementation guidance and simpler terms throughout. This hub explains where the revision stands, what is confirmed and what is only proposed, how each part is affected and what to do now. The 2018 and 2020 editions remain the standards to work to.",
  sections: [
    {
      id: "main",
      label: "2026 revision",
      tabs: [
        // ------------------------------------------------------------------ Status
        {
          id: "status",
          label: "Where it stands",
          blocks: [
            {
              kind: "callout",
              title: "Work to the current editions",
              body: "ISO 19650-1:2018, ISO 19650-2:2018 and ISO 19650-3:2020 remain in force. The 2026 documents are consultation drafts: do not rename documents, change appointments or rewrite templates to match them until the new editions are published.",
              tone: "warn",
            },
            {
              kind: "stats",
              title: "Key dates",
              stats: [
                { value: "10 Mar 2026", label: "DIS ballot opened for ISO/DIS 19650-1 and -2", source: "ISO project pages" },
                { value: "3 May 2026", label: "UK public comments closed for Parts 1 and 2", source: "nima / BSI" },
                { value: "3 Jun 2026", label: "DIS ballot closed (12 weeks)", source: "ISO project pages" },
                { value: "6 Jul 2026", label: "UK comments closed for the Part 3 draft", source: "nima / BSI" },
              ],
            },
            {
              kind: "text",
              title: "What happened after the ballot",
              body: [
                "After the ballot, ISO listed both drafts at stage 40.93, 'Full report circulated: decision for new DIS ballot', dated August 2026. In plain terms, the comments were significant enough that a second draft (DIS) will be circulated before the text can move to the final draft (FDIS) stage.",
                "Practitioner sources expected publication in late 2026 or 2027. With a second DIS ballot, publication in 2027 or later is the realistic expectation. Check the ISO project pages for the current stage before planning any change.",
              ],
            },
            {
              kind: "table",
              title: "What the ISO stage codes mean",
              columns: ["Stage", "Name", "What it means for you"],
              rows: [
                ["40.20", "DIS ballot initiated", "The draft is out for voting and national comment"],
                ["40.60", "Close of voting", "Comments are collected and reviewed by the working group"],
                ["40.93", "Decision for new DIS ballot", "A revised draft will go out again; the text is still changing"],
                ["50.00", "FDIS registered", "The near-final text; only editorial changes expected"],
                ["60.60", "International Standard published", "The new edition can be adopted, usually with a transition period"],
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ Key changes
        {
          id: "changes",
          label: "Key changes",
          blocks: [
            {
              kind: "cards",
              title: "The big shifts",
              cards: [
                { title: "One whole-life process", body: "The separate delivery (Part 2) and operational (Part 3) processes are brought together in one information management process in Part 2, covering projects and asset operation alike.", tone: "red" },
                { title: "Part 3 becomes guidance", body: "Part 3 is re-scoped as guidance on implementing the unified process: project complexity, team structures, party perspectives, information production planning and CDE deployment.", tone: "purple" },
                { title: "'Using BIM' leaves the title", body: "The draft series title reads 'Information management', and Part 2 is titled 'Information management process' instead of 'Delivery phase of the assets'.", tone: "blue" },
                { title: "Projects as trigger events", body: "Projects are treated as events within an asset's life, with the asset information model as the lasting outcome.", tone: "teal" },
                { title: "Operations involved earlier", body: "Operational stakeholders and the appointing party take a more visible role from the start of a project, not only at handover.", tone: "green" },
                { title: "Simpler, translatable terms", body: "Terminology is simplified to be easier to explain and translate, with a mapping annex from the old terms to the new.", tone: "amber" },
              ],
            },
            {
              kind: "table",
              title: "Confirmed and reported changes",
              columns: ["Change", "Status", "Source"],
              rows: [
                ["Parts 1 and 2 revised; Part 3 revised alongside", "Confirmed", "ISO/DIS 19650-1 and -2 project pages; nima"],
                ["Part 2 retitled 'Information management process'", "Confirmed (draft title)", "ISO/DIS 19650-2 project page"],
                ["Delivery and operational processes unified in Part 2", "Widely reported", "Several practitioner summaries"],
                ["Part 3 re-scoped as implementation guidance", "Widely reported", "Several practitioner summaries"],
                ["Stronger alignment with ISO 7817-1 (LOIN) and ISO 29481-1 (IDM)", "Widely reported", "Several practitioner summaries"],
                ["Clause-mapping annex between first and second editions", "Reported", "Practitioner summary"],
                ["BEP renamed Information Production Plan (IPP)", "Reported proposal", "Two practitioner summaries"],
                ["EIR renamed; TIDP/MIDP replaced by one schedule", "Reported proposal", "One practitioner summary"],
                ["A single nine-step process", "Reported proposal", "One practitioner summary"],
              ],
            },
            {
              kind: "callout",
              title: "Why the labels matter",
              body: "The drafts themselves are behind national standards body logins, and a second DIS ballot means the text will change. Treat anything marked 'reported' as a direction of travel, not a fact you can quote in an appointment.",
              tone: "info",
            },
          ],
        },
        // ------------------------------------------------------------------ Terms
        {
          id: "terms",
          label: "Old and new terms",
          blocks: [
            {
              kind: "table",
              title: "Terms the drafts were reported to change",
              columns: ["2018 term", "Reported draft term", "Notes"],
              rows: [
                ["BIM execution plan (BEP)", "Information production plan (IPP)", "Reported by two sources; the most discussed change"],
                ["Exchange information requirements (EIR)", "Information production requirements (IPR)", "Reported by one source"],
                ["TIDP and MIDP", "Information production schedule (IPS)", "Reported by one source; one schedule instead of two levels"],
                ["Delivery team", "Information production team", "Reported by one source"],
                ["Information management using BIM", "Information management", "Confirmed in the draft series title"],
                ["Delivery phase of the assets (Part 2 title)", "Information management process", "Confirmed in the draft Part 2 title"],
                ["OIR, AIR, PIR", "Kept, framed as stakeholder perspectives", "Collated and filtered per project and appointment"],
              ],
            },
            {
              kind: "cards",
              title: "Reading the renames",
              cards: [
                { title: "Production, not just BIM", body: "The new names stress producing information, whatever the tool, which suits teams that do not author 3D models.", tone: "blue" },
                { title: "Same jobs, new labels", body: "The underlying tasks, such as planning who produces what and when, stay. Most organisations will remap templates rather than rebuild them.", tone: "green" },
                { title: "Expect a transition", body: "When the new editions arrive, appointments in progress will usually keep their original terms. New appointments will move over gradually.", tone: "amber" },
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ By part
        {
          id: "parts",
          label: "Part by part",
          blocks: [
            {
              kind: "table",
              title: "How each part is affected",
              columns: ["Part", "Current edition", "2026 revision", "Impact"],
              rows: [
                ["Part 1: Concepts and principles", "ISO 19650-1:2018", "Revised; delivery vs operational phase split removed; some annexes and figures move to Part 3", "High: new concepts and terms"],
                ["Part 2: Information management process", "ISO 19650-2:2018 (delivery phase)", "Revised and widened to the whole asset life", "High: the main process changes"],
                ["Part 3: Operational phase", "ISO 19650-3:2020", "Revised into implementation guidance for the unified process", "Medium: guidance rather than requirements"],
                ["Part 4: Information exchange", "ISO 19650-4:2022", "Not revised; read with the new Part 1", "Low"],
                ["Part 5: Security-minded approach", "ISO 19650-5:2020", "Not revised; read with the new Part 1", "Low"],
                ["Part 6: Health and safety information", "ISO 19650-6:2025", "New in 2025, replacing PAS 1192-6", "Already in force"],
              ],
            },
            {
              kind: "cards",
              title: "Related standards to know",
              cards: [
                { title: "ISO 19650-6:2025", body: "Health and safety information across the asset life, including a risk schema. It supersedes PAS 1192-6:2018 and also works for teams not using BIM.", tone: "red" },
                { title: "ISO 7817-1:2024", body: "Level of information need: concepts and principles. The revised ISO 19650 aligns its requirements with this standard.", tone: "purple" },
                { title: "ISO 29481-1", body: "Information delivery manual (IDM): how to describe processes and the information exchanged. Also referenced more strongly in the drafts.", tone: "teal" },
              ],
            },
          ],
        },
        // ------------------------------------------------------------------ What to do now
        {
          id: "actions",
          label: "What to do now",
          blocks: [
            {
              kind: "checklist",
              title: "Practical steps for 2026–2027",
              items: [
                "Keep appointments, BEPs, EIRs and delivery plans on the 2018/2020 editions and their terms",
                "Name the edition in every appointment and information standard, for example 'ISO 19650-2:2018'",
                "Track the ISO project pages for ISO/DIS 19650-1 and -2 and your national body for the second DIS",
                "Comment on the second draft through your national standards body, with alternative wording for anything you object to",
                "Build a terms map for your templates (BEP → IPP and so on) so you can switch quickly when the editions publish",
                "Start involving operations and facility management at project start, as the drafts expect",
                "Align level-of-information-need work with ISO 7817-1:2024 now; it does not depend on the revision",
                "Adopt ISO 19650-6:2025 for health and safety information where your appointments call for it",
                "Plan training on whole-life information management for project and asset teams",
                "Check with your certification body how existing ISO 19650 certificates will transition",
              ],
            },
            {
              kind: "callout",
              title: "This portal and the revision",
              body: "The portal's templates, generators and checks use the current 2018/2020 editions and their terms. When the new editions are published, the templates will be remapped and this hub updated with the final text.",
              tone: "ok",
            },
          ],
        },
        // ------------------------------------------------------------------ FAQ, quiz, sources
        {
          id: "faq",
          label: "FAQ & quiz",
          blocks: [
            {
              kind: "faq",
              title: "Frequently asked questions",
              items: [
                { q: "Is ISO 19650 2026 published?", a: "No. The revisions of Parts 1 and 2 reached the DIS ballot in 2026, and ISO then decided on a new DIS ballot. Part 3 followed a separate consultation. The current editions remain in force." },
                { q: "Should we rename our BEP to IPP now?", a: "No. The rename is a reported proposal in a draft that is still changing. Renaming early can confuse appointments that cite the 2018 edition." },
                { q: "Will our ISO 19650 certification become invalid?", a: "Practitioner sources expect certification schemes to be reviewed with transition periods rather than reset. Ask your certification body." },
                { q: "Does the revision affect Part 6?", a: "Part 6 was published in 2025 and is not part of this revision, but it will be read alongside the revised Part 1." },
                { q: "Where can I read the drafts?", a: "Through your national standards body's consultation platform, which usually needs a free registration, for example BSI in the UK." },
              ],
            },
            {
              kind: "quiz",
              title: "Check your understanding",
              questions: [
                { q: "Which editions should a new appointment in late 2026 cite?", options: ["The 2026 drafts", "ISO 19650-1 and -2:2018, and -3:2020", "Whichever the team prefers"], answer: 1, why: "The drafts are not published standards; the 2018 and 2020 editions remain in force." },
                { q: "What did the draft Part 2 title change to?", options: ["Delivery phase of the assets", "Information management process", "Asset information model"], answer: 1, why: "The draft retitles Part 2 'Information management process', reflecting the whole-life scope." },
                { q: "What is Part 3 expected to become?", options: ["Deleted", "Guidance on implementing the unified process", "A health and safety standard"], answer: 1, why: "The operational requirements move into the unified Part 2 process, and Part 3 is re-scoped as guidance." },
                { q: "What does ISO stage 40.93 mean?", options: ["Published", "A decision to run a new DIS ballot", "Withdrawn"], answer: 1, why: "40.93 means the comments led to a decision to circulate a new draft for another ballot." },
              ],
            },
          ],
        },
        {
          id: "sources",
          label: "Sources & AI",
          blocks: [
            {
              kind: "links",
              title: "Follow the revision",
              links: [
                { label: "ISO/DIS 19650-1", href: "https://www.iso.org/standard/89703.html", note: "ISO project page: current stage of the Part 1 revision", tone: "blue" },
                { label: "ISO/DIS 19650-2", href: "https://www.iso.org/standard/89704.html", note: "ISO project page: current stage of the Part 2 revision", tone: "purple" },
                { label: "nima: Parts 1 and 2 consultation", href: "https://wearenima.im/consultation-opens-on-proposed-changes-to-iso-19650-parts-1-and-2/", note: "UK consultation notice and how to comment", tone: "green" },
                { label: "nima: Part 3 consultation", href: "https://wearenima.im/consultation-on-revisions-to-iso-19650-part-3-opens/", note: "UK consultation notice for the Part 3 draft", tone: "teal" },
                { label: "ISO 19650-6:2025", href: "https://www.iso.org/standard/82705.html", note: "Health and safety information, published 2025", tone: "red" },
              ],
            },
            { kind: "widget", widget: "ask-ai", title: "Ask AI about the 2026 revision" },
            {
              kind: "callout",
              title: "Check before you rely on it",
              body: "This hub was checked in October 2026. The text of the drafts will change after the second DIS ballot; confirm the current stage and wording with ISO or your national standards body.",
              tone: "warn",
            },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "What are the main changes proposed in the ISO 19650 2026 revision?",
    "How should we prepare our templates for the renamed BEP and EIR?",
    "What does the merger of Parts 2 and 3 mean for asset owners?",
    "Which ISO 19650 edition should a new appointment cite today?",
  ],
};
