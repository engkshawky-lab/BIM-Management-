import type { Hub } from "./types";

// The evolution of BIM information management standards, from BS 1192:2007 to the 2026 ISO 19650 drafts.
// Only dates we are confident of are given as years; anything less certain is marked "around" or left out.
// The 2026 revision facts match revision2026.ts (DIS ballot March–June 2026, decision for a new DIS in August 2026).

export const timelineHub: Hub = {
  id: "timeline",
  tone: "blue",
  eyebrow: "HISTORY · BIM STANDARDS",
  title: "BIM standards timeline",
  intro:
    "ISO 19650 did not appear from nowhere. It grew out of British Standards and PAS documents written for the UK BIM programme, then became an international series. This hub traces that path, from BS 1192:2007 to the 2026 revision drafts, alongside the openBIM standards (IFC, BCF, IDS) and selected national adoptions. Use it to understand old documents you still meet on projects and to see which standard replaced which.",
  sections: [
    // ======================================================================== OVERVIEW
    {
      id: "overview",
      label: "The big picture",
      tabs: [
        {
          id: "timeline",
          label: "Timeline",
          blocks: [
            {
              kind: "callout",
              title: "How to read this timeline",
              body: "Years are the publication year of the edition named. Where we are not certain of a year, it is marked 'around'. Always check the publisher's page before citing a date in an appointment or a tender response.",
              tone: "info",
            },
            {
              kind: "table",
              title: "Timeline",
              columns: ["Year", "Standard", "What it introduced", "Status today"],
              rows: [
                ["2007", "BS 1192:2007", "Collaborative production of construction information: the common data environment (CDE), status codes and a file naming convention", "Withdrawn; replaced by ISO 19650-1 and -2 with the UK National Annex"],
                ["Around 2008", "Bew–Richards BIM maturity diagram", "Levels 0 to 3 of BIM maturity, later used by UK government policy", "Historical; the UK BIM Framework no longer uses 'Level 2'"],
                ["2011", "UK Government Construction Strategy", "Set the target of collaborative 3D BIM on centrally procured projects by 2016", "Historical policy"],
                ["2013", "PAS 1192-2:2013", "The delivery-phase process: EIR, BIM execution plan, MIDP and TIDP, the master information delivery plan", "Withdrawn; replaced by ISO 19650-2"],
                ["2013", "IFC4 (ISO 16739:2013)", "A major update to the open data schema for building models", "Superseded by later ISO 16739-1 editions"],
                ["2014", "PAS 1192-3:2014", "Information management in the operational phase: OIR, AIR and the asset information model", "Withdrawn; replaced by ISO 19650-3"],
                ["2014", "BS 1192-4:2014", "A UK code of practice for COBie: delivering facility information to the client", "Still referenced in the UK; check BSI for its current status"],
                ["2015", "PAS 1192-5:2015", "A security-minded approach to BIM, digital built environments and smart asset management", "Withdrawn; replaced by ISO 19650-5"],
                ["2016", "UK BIM mandate", "BIM Level 2 required on centrally procured central government projects from April 2016", "Now expressed through the UK BIM Framework"],
                ["2018", "PAS 1192-6:2018", "Sharing structured health and safety information using BIM", "Replaced by ISO 19650-6:2025"],
                ["2018", "ISO 16739-1:2018 (IFC4 ADD2 TC1)", "IFC4 with its second addendum and technical corrigendum, published as Part 1 of ISO 16739", "Superseded by ISO 16739-1:2024"],
                ["2018", "ISO 19650-1 and ISO 19650-2", "International concepts and the delivery-phase process, based on BS 1192 and PAS 1192-2", "In force; under revision (2026 drafts)"],
                ["Around 2019", "BS EN ISO 19650-1 and -2 with UK National Annex", "UK adoption; the National Annex keeps the UK naming convention and status codes", "In force in the UK"],
                ["2019", "UK BIM Framework", "Replaced 'BIM Level 2' branding with guidance on implementing ISO 19650 in the UK", "Current; guidance updated over time"],
                ["2020", "ISO 19650-3:2020", "The operational phase of assets, based on PAS 1192-3", "In force; under revision (2026 drafts)"],
                ["2020", "ISO 19650-5:2020", "A security-minded approach to information management, based on PAS 1192-5", "In force"],
                ["2020", "EN 17412-1:2020", "European standard for level of information need (LOIN)", "Replaced by ISO 7817-1:2024"],
                ["2022", "ISO 19650-4:2022", "Information exchange: the criteria for reviewing and accepting information containers", "In force"],
                ["2024", "ISO 7817-1:2024", "Level of information need: concepts and principles, at international level", "In force"],
                ["2024", "ISO 16739-1:2024 (IFC4.3)", "IFC extended to infrastructure: roads, railways, bridges, ports and waterways", "In force; the current IFC edition"],
                ["2024", "buildingSMART IDS 1.0", "Information Delivery Specification: machine-readable information requirements that software can check", "Current buildingSMART standard"],
                ["2025", "ISO 19650-6:2025", "Health and safety information across the asset life, based on PAS 1192-6", "In force"],
                ["2026", "ISO/DIS 19650-1 and -2 (drafts)", "Proposed whole-life information management process; Part 3 to become guidance", "Drafts only; a new DIS ballot was decided in August 2026"],
              ],
            },
            {
              kind: "stats",
              title: "In numbers",
              stats: [
                { value: "6", label: "Published parts of ISO 19650 by 2025", source: "ISO" },
                { value: "11 years", label: "From BS 1192:2007 to ISO 19650-1 and -2 (2018)", source: "BSI / ISO" },
                { value: "5", label: "PAS 1192 and BS 1192 documents absorbed into ISO 19650", source: "This hub" },
                { value: "2024", label: "Year IFC4.3 became an ISO standard", source: "ISO 16739-1:2024" },
              ],
            },
          ],
        },
        {
          id: "replaced",
          label: "What replaced what",
          blocks: [
            {
              kind: "table",
              title: "From British Standards to ISO 19650",
              columns: ["Older document", "Replaced by", "What carried over", "What changed"],
              rows: [
                ["BS 1192:2007 (+A2:2016)", "ISO 19650-1 and -2, with the UK National Annex", "CDE states, container-based working, naming fields and status codes", "Naming and status codes moved into the UK National Annex; the core is international"],
                ["PAS 1192-2:2013", "ISO 19650-2:2018", "EIR, BEP, MIDP, TIDP, responsibility matrix", "Neutral international terms: appointing party, lead appointed party, appointed party"],
                ["PAS 1192-3:2014", "ISO 19650-3:2020", "OIR, AIR, AIM and trigger events", "Aligned with the ISO 19650-1 concepts and the delivery-phase process"],
                ["PAS 1192-5:2015", "ISO 19650-5:2020", "Security triage, security strategy and management plan", "Wider than BIM; written as an international requirement"],
                ["PAS 1192-6:2018", "ISO 19650-6:2025", "Structured sharing of health and safety risk information", "Covers the whole asset life and works with or without BIM"],
                ["EN 17412-1:2020", "ISO 7817-1:2024", "Level of information need: purpose, geometry, alphanumeric data, documentation", "Now an ISO standard used worldwide"],
                ["BS 1192-4:2014", "No direct ISO replacement", "COBie as a UK delivery format", "Still used by some UK clients; often replaced by IFC plus IDS checks elsewhere"],
              ],
            },
            {
              kind: "table",
              title: "Terms that changed between PAS 1192 and ISO 19650",
              columns: ["PAS 1192 term", "ISO 19650 term"],
              rows: [
                ["Employer", "Appointing party"],
                ["Employer's information requirements (EIR)", "Exchange information requirements (EIR)"],
                ["Supplier / tier 1 supplier", "Lead appointed party"],
                ["Task team", "Appointed party (within a task team)"],
                ["Level of definition (LOD/LOI)", "Level of information need"],
                ["BIM Level 2", "Information management according to ISO 19650"],
              ],
            },
            {
              kind: "callout",
              title: "Old documents on live projects",
              body: "You will still meet PAS 1192-2 terms in older appointments and frameworks. A contract that cites a withdrawn standard is still binding as written, so read it on its own terms and map it to ISO 19650 rather than silently swapping documents.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ======================================================================== ERAS
    {
      id: "eras",
      label: "Eras",
      tabs: [
        {
          id: "british",
          label: "British foundations",
          blocks: [
            {
              kind: "steps",
              title: "2007–2018: the British Standards era",
              steps: [
                { title: "BS 1192:2007", body: "Set out how teams produce and share construction information. It introduced the CDE with work in progress, shared, published and archive areas, plus a naming convention." },
                { title: "Government Construction Strategy (2011)", body: "The UK government set a target for collaborative 3D BIM on its projects by 2016. This drove the PAS 1192 series." },
                { title: "PAS 1192-2:2013", body: "Described the capital delivery process: the employer's information requirements, the BIM execution plan and the delivery plans." },
                { title: "PAS 1192-3 and BS 1192-4 (2014)", body: "Extended the approach to operating assets and set COBie as the UK format for handing over facility data." },
                { title: "PAS 1192-5:2015", body: "Added a security-minded approach for sensitive assets and information." },
                { title: "The 2016 mandate", body: "From April 2016, BIM Level 2 was required on centrally procured central government projects." },
                { title: "PAS 1192-6:2018", body: "Covered structured health and safety information, the last document in the PAS series." },
              ],
            },
            {
              kind: "cards",
              title: "Ideas from this era that are still with us",
              cards: [
                { title: "The CDE", body: "The four-state CDE from BS 1192 is the basis of the ISO 19650 CDE workflow.", tone: "blue" },
                { title: "Information requirements", body: "The chain of OIR, AIR, PIR and EIR started in the PAS documents.", tone: "green" },
                { title: "Delivery plans", body: "The MIDP and TIDP came from PAS 1192-2 and remain in ISO 19650-2.", tone: "amber" },
                { title: "Naming fields", body: "The project, originator, volume, level, type, role and number fields live on in the UK National Annex.", tone: "purple" },
              ],
            },
          ],
        },
        {
          id: "iso",
          label: "The ISO era",
          blocks: [
            {
              kind: "steps",
              title: "2018–2025: the international series",
              steps: [
                { title: "ISO 19650-1 and -2 (2018)", body: "Concepts and the delivery-phase process became international. CEN adopted them as EN ISO 19650, so European national bodies published their own versions." },
                { title: "UK National Annex", body: "The UK published BS EN ISO 19650 with a National Annex covering naming, status codes and other UK practice." },
                { title: "UK BIM Framework (2019)", body: "Brought the UK guidance together and dropped 'BIM Level 2' in favour of ISO 19650 language." },
                { title: "ISO 19650-3 and -5 (2020)", body: "The operational phase and the security-minded approach joined the series." },
                { title: "ISO 19650-4 (2022)", body: "Set out the review and acceptance of information containers at each exchange." },
                { title: "ISO 7817-1 (2024)", body: "Gave level of information need an international standard, replacing EN 17412-1." },
                { title: "ISO 19650-6 (2025)", body: "Completed the PAS transition with health and safety information." },
              ],
            },
            {
              kind: "table",
              title: "The ISO 19650 series today",
              columns: ["Part", "Title in short", "Edition"],
              rows: [
                ["Part 1", "Concepts and principles", "2018"],
                ["Part 2", "Delivery phase of the assets", "2018"],
                ["Part 3", "Operational phase of the assets", "2020"],
                ["Part 4", "Information exchange", "2022"],
                ["Part 5", "Security-minded approach to information management", "2020"],
                ["Part 6", "Health and safety information", "2025"],
              ],
            },
          ],
        },
        {
          id: "revision",
          label: "The 2026 revision",
          blocks: [
            {
              kind: "steps",
              title: "2026 onwards: towards one whole-life process",
              steps: [
                { title: "DIS ballot (March–June 2026)", body: "Drafts of the revised Parts 1 and 2 went out for ballot and national comment." },
                { title: "Part 3 consultation", body: "A draft of Part 3, re-scoped as implementation guidance, had its own UK consultation that closed in July 2026." },
                { title: "Decision for a new DIS (August 2026)", body: "ISO recorded a decision to circulate a second draft, so the text is still changing." },
                { title: "Publication", body: "Realistically 2027 or later. Until then the 2018 and 2020 editions remain the standards to work to." },
              ],
            },
            {
              kind: "callout",
              title: "Reported, not final",
              body: "Proposed renames such as 'information production plan' for the BEP are reported from the drafts and may change. See the 2026 revision hub for what is confirmed and what is only reported.",
              tone: "warn",
            },
          ],
        },
      ],
    },
    // ======================================================================== OPENBIM
    {
      id: "openbim",
      label: "openBIM standards",
      tabs: [
        {
          id: "ifc",
          label: "IFC",
          blocks: [
            {
              kind: "table",
              title: "IFC versions",
              columns: ["Version", "Formal publication", "Main scope", "Use today"],
              rows: [
                ["IFC2x3", "buildingSMART release (around 2006)", "Buildings; the long-standing exchange version", "Still common in coordination workflows and older client requirements"],
                ["IFC4", "ISO 16739:2013", "Richer geometry, properties and quantities for buildings", "Replaced by later editions"],
                ["IFC4 ADD2 TC1", "ISO 16739-1:2018", "IFC4 with corrections and an addendum", "Widely supported; many requirements name it"],
                ["IFC4.3", "ISO 16739-1:2024", "Adds infrastructure: alignment, roads, rail, bridges, ports and waterways", "The current edition; software support is growing"],
              ],
            },
            {
              kind: "text",
              title: "Why the IFC version matters",
              body: [
                "IFC is the open schema used to exchange models between tools. ISO 19650 does not require IFC, but many exchange information requirements do.",
                "Always state the IFC version and the model view or export settings in the EIR and BEP. A model exported in IFC2x3 cannot carry the infrastructure entities of IFC4.3.",
              ],
            },
          ],
        },
        {
          id: "bcf-ids",
          label: "BCF, IDS and COBie",
          blocks: [
            {
              kind: "table",
              title: "Supporting openBIM standards",
              columns: ["Standard", "Timing", "What it does", "Status today"],
              rows: [
                ["BCF 1.0", "Around 2010", "BIM Collaboration Format: an open file format for issues and comments linked to model views", "Superseded"],
                ["BCF 2.0 and 2.1", "Mid to late 2010s", "Improved file format and a web API for exchanging issues between tools", "BCF 2.1 still widely supported"],
                ["BCF 3.0", "Around 2021", "Updated file format and API", "Current; support varies by tool"],
                ["IDS 1.0", "2024", "Information Delivery Specification: requirements in a machine-readable XML file that checking tools can run against IFC", "Current buildingSMART standard"],
                ["COBie", "Developed in the US around 2007", "A spreadsheet structure for handover data on spaces, systems and components", "Used in the UK through BS 1192-4 and in US federal projects"],
              ],
            },
            {
              kind: "cards",
              title: "How they fit with ISO 19650",
              cards: [
                { title: "IFC carries the model", body: "The open format for geometry and properties in information containers.", tone: "blue" },
                { title: "BCF carries the issues", body: "Review comments and clash issues, linked to the model location.", tone: "amber" },
                { title: "IDS carries the requirements", body: "Turns part of the EIR into rules that software can check before acceptance under ISO 19650-4.", tone: "green" },
                { title: "COBie carries handover data", body: "A simple tabular deliverable for facility management systems.", tone: "teal" },
              ],
            },
          ],
        },
        {
          id: "uk",
          label: "UK BIM Framework and GSL",
          blocks: [
            {
              kind: "text",
              title: "UK BIM Framework",
              body: [
                "Launched in 2019, the UK BIM Framework gathers the UK's ISO 19650 guidance in one place. It replaced the 'BIM Level 2' branding and explains how to apply the standards, including the UK National Annex.",
                "Its guidance documents are updated over time, so cite the version you used.",
              ],
            },
            {
              kind: "text",
              title: "Government Soft Landings (GSL)",
              body: [
                "GSL is the UK government's approach to involving operators and end users throughout a project so the building works as intended after handover. It grew from the earlier Soft Landings framework and was introduced for government projects around 2013.",
                "GSL fits naturally with the operational phase of ISO 19650-3 and with the 2026 drafts, which bring operations into projects from the start.",
              ],
            },
          ],
        },
      ],
    },
    // ======================================================================== NATIONAL
    {
      id: "national",
      label: "National adoption",
      tabs: [
        {
          id: "adoptions",
          label: "Selected adoptions",
          blocks: [
            {
              kind: "table",
              title: "How ISO 19650 reached different countries",
              columns: ["Country or region", "How it was adopted", "Notes"],
              rows: [
                ["European CEN members", "EN ISO 19650, published by each national body", "For example DIN EN ISO 19650 in Germany and BS EN ISO 19650 in the UK"],
                ["United Kingdom", "BS EN ISO 19650 with a UK National Annex", "Supported by the UK BIM Framework"],
                ["Germany", "DIN EN ISO 19650", "Used alongside German federal BIM guidance"],
                ["Dubai (UAE)", "Dubai Municipality BIM circulars", "Mandated BIM for larger and specified building types from around 2013, with later circulars widening the scope"],
                ["Saudi Arabia", "Government-led national BIM initiatives", "Frameworks and guides aligned with ISO 19650, mainly from the early 2020s; check the issuing entity for current requirements"],
                ["Other countries", "National adoption or direct use of ISO 19650", "Many clients cite ISO 19650 directly in tenders without a national version"],
              ],
            },
            {
              kind: "callout",
              title: "Check the local requirement",
              body: "National mandates change often and are issued by different bodies. Before a bid, confirm which edition, annex and local guidance the client or authority requires.",
              tone: "info",
            },
          ],
        },
        {
          id: "middle-east",
          label: "Middle East focus",
          blocks: [
            {
              kind: "cards",
              title: "What practitioners in the region meet",
              cards: [
                { title: "Authority submissions", body: "Municipal BIM requirements often focus on submissions for permits, with their own model and drawing rules.", tone: "amber" },
                { title: "Giga-project requirements", body: "Large developers issue their own information standards, usually based on ISO 19650 terms and processes.", tone: "purple" },
                { title: "Mixed legacy terms", body: "Older employer requirements may still use PAS 1192 language such as 'employer' and 'LOD'.", tone: "blue" },
                { title: "Bilingual delivery", body: "Information standards may need Arabic and English naming and documentation.", tone: "teal" },
              ],
            },
            {
              kind: "checklist",
              title: "Before you start a regional project",
              items: [
                "Identify the authority or client documents that set BIM requirements",
                "Confirm which ISO 19650 parts and editions are cited",
                "Check whether a UK National Annex style naming convention is expected or a local one",
                "Check the required IFC version and any submission portal rules",
                "Map any PAS 1192 terms in the contract to ISO 19650 terms",
              ],
            },
          ],
        },
      ],
    },
    // ======================================================================== FAQ / QUIZ
    {
      id: "learn",
      label: "FAQ, quiz & links",
      tabs: [
        {
          id: "faq",
          label: "FAQ",
          blocks: [
            {
              kind: "faq",
              title: "Frequently asked questions",
              items: [
                { q: "Is PAS 1192-2 still valid?", a: "It has been withdrawn and replaced by ISO 19650-2. An existing contract that cites it still applies as written." },
                { q: "Is BS 1192 still used?", a: "BS 1192 has been withdrawn. Its naming convention and status codes continue in the UK National Annex to BS EN ISO 19650-2." },
                { q: "What replaced PAS 1192-5?", a: "ISO 19650-5:2020, the security-minded approach to information management." },
                { q: "What replaced PAS 1192-6?", a: "ISO 19650-6:2025, which covers health and safety information across the asset life." },
                { q: "Is 'BIM Level 2' still a thing?", a: "The term is historical. In the UK it was replaced by information management according to ISO 19650, as explained by the UK BIM Framework." },
                { q: "Which IFC version should I ask for?", a: "Ask for the version your tools and checking process support. IFC4 ADD2 TC1 is widely supported for buildings, and IFC4.3 is needed for infrastructure entities." },
                { q: "Does ISO 19650 require IFC or COBie?", a: "No. ISO 19650 sets the process. The formats come from the information requirements of each appointment." },
                { q: "What is the difference between EN 17412-1 and ISO 7817-1?", a: "EN 17412-1 was the European LOIN standard. ISO 7817-1:2024 took it to international level and replaced it." },
                { q: "When will the revised ISO 19650 be published?", a: "Not before 2027 is the realistic view, because a second DIS ballot was decided in August 2026." },
                { q: "Why do national versions exist?", a: "CEN adopted ISO 19650 as a European standard, so each member body published it, sometimes with a national annex for local practice." },
              ],
            },
          ],
        },
        {
          id: "quiz",
          label: "Quiz",
          blocks: [
            {
              kind: "quiz",
              title: "Check your understanding",
              questions: [
                { q: "Which document introduced the four-state CDE?", options: ["PAS 1192-3", "BS 1192:2007", "ISO 19650-4"], answer: 1, why: "BS 1192:2007 introduced the CDE with work in progress, shared, published and archive areas." },
                { q: "Which ISO 19650 part replaced PAS 1192-3?", options: ["Part 2", "Part 3", "Part 5"], answer: 1, why: "ISO 19650-3:2020 covers the operational phase, which PAS 1192-3 addressed before." },
                { q: "Which standard published IFC4.3?", options: ["ISO 16739-1:2024", "ISO 16739:2013", "ISO 7817-1:2024"], answer: 0, why: "IFC4.3 was published as ISO 16739-1:2024 and adds infrastructure." },
                { q: "What does IDS 1.0 provide?", options: ["Issue tracking between tools", "Machine-readable information requirements", "A file naming convention"], answer: 1, why: "IDS lets software check models against requirements; BCF handles issues." },
                { q: "Where does the UK naming convention live today?", options: ["In PAS 1192-2", "In the UK National Annex to BS EN ISO 19650-2", "In IFC4.3"], answer: 1, why: "The naming fields from BS 1192 moved into the UK National Annex." },
                { q: "Which part was published in 2025?", options: ["ISO 19650-4", "ISO 19650-5", "ISO 19650-6"], answer: 2, why: "ISO 19650-6:2025 replaced PAS 1192-6:2018." },
              ],
            },
          ],
        },
        {
          id: "links",
          label: "Links & AI",
          blocks: [
            {
              kind: "links",
              title: "Official sources",
              links: [
                { label: "ISO 19650-1:2018", href: "https://www.iso.org/standard/68078.html", note: "ISO page for concepts and principles", tone: "blue" },
                { label: "ISO 19650-6:2025", href: "https://www.iso.org/standard/82705.html", note: "ISO page for health and safety information", tone: "red" },
                { label: "UK BIM Framework", href: "https://www.ukbimframework.org/", note: "UK guidance on implementing ISO 19650", tone: "green" },
                { label: "buildingSMART International", href: "https://www.buildingsmart.org/", note: "IFC, BCF and IDS standards", tone: "purple" },
              ],
            },
            { kind: "widget", widget: "ask-ai", title: "Ask AI about the history of BIM standards" },
          ],
        },
      ],
    },
  ],
  aiPrompts: [
    "Which ISO 19650 part replaced each PAS 1192 document?",
    "How do I map PAS 1192-2 terms in an old contract to ISO 19650?",
    "Which IFC version should our EIR require for a rail project?",
    "What changed when BS 1192 moved into the UK National Annex?",
  ],
};
