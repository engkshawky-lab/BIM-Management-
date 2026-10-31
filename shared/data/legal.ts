// Draft legal pages (privacy, terms, cookies, notices). Bracketed items are for the business owner to fill in.
// DRAFT: have a qualified lawyer review every document before it is published.
export interface LegalSection { heading: string; paragraphs: string[]; bullets?: string[] }
export interface LegalDoc { id: "privacy" | "terms" | "cookies" | "notices"; title: string; summary: string; sections: LegalSection[] }

const DRAFT_NOTE = "This is a draft. It must be reviewed by a qualified lawyer before it is published. Bracketed items must be completed by [Company legal name].";

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: "privacy",
    title: "Privacy Policy",
    summary: "How we collect, use, share and protect personal data when you use the portal.",
    sections: [
      {
        heading: "Draft notice",
        paragraphs: [DRAFT_NOTE, "Effective date: [Effective date]."],
      },
      {
        heading: "Who we are",
        paragraphs: [
          "The portal is operated by [Company legal name], registered at [Registered address] in [Country/jurisdiction]. We are the controller of the personal data described in this policy.",
          "When a customer organisation uploads project content, that organisation decides what is shared. For that content we act on its instructions, as a processor, under our agreement with it.",
          "You can contact us about privacy at [Contact email].",
        ],
      },
      {
        heading: "Data we collect",
        paragraphs: ["We collect only what we need to run the portal. This includes:"],
        bullets: [
          "Account data: your name, email address, password (stored only as a bcrypt hash), language, and role.",
          "Profile and talent data that you choose to enter, such as skills, experience and qualifications.",
          "Project content: files you upload, registers, issues, plans, comments and other workspace records.",
          "AI requests: the prompts you write and the document or file text you select for an AI feature.",
          "Billing data: your plan, subscription status and Stripe customer reference. We never receive your card details.",
          "Connector data: details needed to link Autodesk Platform Services or Speckle, only if you connect them.",
          "Technical data: server logs such as IP address, time and request path, used for security and fault finding.",
        ],
      },
      {
        heading: "How we use data and our lawful bases",
        paragraphs: ["We use personal data for the purposes below. Each purpose relies on a lawful basis under data protection law."],
        bullets: [
          "To create and run your account and provide the service you signed up for (contract).",
          "To store and share project content with the members of each project (contract).",
          "To run AI features when you ask for them (contract).",
          "To take payments and manage subscriptions (contract and legal obligation).",
          "To send service emails, notifications, digests and password resets (contract and legitimate interests).",
          "To keep the portal secure, prevent misuse and fix faults (legitimate interests).",
          "To meet tax, accounting and other legal duties (legal obligation).",
        ],
      },
      {
        heading: "Who can see your data",
        paragraphs: [
          "Members of a project can see that project's content. Project owners and administrators control who is a member.",
          "Our staff access personal data only when needed to support you, keep the service secure or meet a legal duty.",
          "We do not sell personal data. We do not use advertising or analytics trackers.",
        ],
      },
      {
        heading: "Sub-processors",
        paragraphs: ["We use the following service providers. Each receives only the data it needs for its task."],
        bullets: [
          "Hosting provider [Hosting provider and location]: all account data, project content and uploaded files.",
          "Anthropic (Claude API): the prompt and the selected document or file text when you run an AI feature, and search queries for the news feed.",
          "Email provider [SMTP provider name]: your name, email address and the content of service emails.",
          "Stripe: your email address, plan and payment details that you enter on Stripe Checkout.",
          "Autodesk Platform Services: sign-in and project requests, only if you connect your Autodesk account.",
          "Speckle: your access token and project requests, only if you connect Speckle.",
          "YouTube and Vimeo: your IP address and browser data when you play an embedded video.",
          "Google Fonts: your IP address and browser data when the page loads its fonts.",
        ],
      },
      {
        heading: "AI features",
        paragraphs: [
          "When you run an AI feature, your prompt and the text of the selected document or file are sent to Anthropic's Claude API using our account.",
          "Do not upload or select content that you are not allowed to share with a sub-processor. If in doubt, ask the owner of the information first.",
          "The news feed uses Claude's web search to find public articles. It does not send your project content.",
        ],
      },
      {
        heading: "International transfers",
        paragraphs: [
          "Some providers, such as Anthropic, Stripe, Autodesk and Google, may process data outside [Country/jurisdiction].",
          "Where this happens we rely on adequacy decisions or standard contractual clauses, or other safeguards the law allows. You can ask us for a copy at [Contact email].",
        ],
      },
      {
        heading: "How long we keep data",
        paragraphs: [
          "We keep account data while your account is open and for [Data retention period] after it is closed.",
          "Project content is kept while the project exists. Deleted content may remain in backups for up to [Backup retention period].",
          "Billing records are kept for as long as tax and accounting law requires.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: ["Depending on where you live, you may have the right to:"],
        bullets: [
          "Access the personal data we hold about you.",
          "Correct data that is wrong or incomplete.",
          "Ask us to delete your data.",
          "Restrict or object to some uses of your data.",
          "Receive your data in a portable format.",
          "Withdraw consent where we rely on it.",
          "Complain to a data protection authority, such as [Supervisory authority].",
        ],
      },
      {
        heading: "Exercising your rights",
        paragraphs: [
          "Email [Contact email] to make a request. We may need to confirm your identity first. We aim to reply within one month.",
          "If your request concerns project content owned by a customer organisation, we may pass it to that organisation.",
        ],
      },
      {
        heading: "Security",
        paragraphs: [
          "We protect data with measures such as encrypted connections, hashed passwords, httpOnly session cookies and access controls by project.",
          "No system is completely secure. Please use a strong, unique password and tell us at once at [Contact email] if you suspect misuse.",
        ],
      },
      {
        heading: "Children",
        paragraphs: ["The portal is a professional service. It is not intended for anyone under [Minimum age], and we do not knowingly collect their data."],
      },
      {
        heading: "Changes to this policy",
        paragraphs: ["We may update this policy. We will post the new version here and change the effective date. For significant changes we will also tell you by email or in the portal."],
      },
      {
        heading: "Contact",
        paragraphs: ["[Company legal name], [Registered address]. Email: [Contact email]."],
      },
    ],
  },
  {
    id: "terms",
    title: "Terms of Service",
    summary: "The rules for using the portal, your subscription, and what each party is responsible for.",
    sections: [
      {
        heading: "Draft notice",
        paragraphs: [DRAFT_NOTE, "Effective date: [Effective date]."],
      },
      {
        heading: "About these terms",
        paragraphs: [
          "These terms form an agreement between you and [Company legal name] of [Registered address]. They apply when you use the portal.",
          "If you use the portal for an organisation, you accept these terms for that organisation and confirm you are authorised to do so.",
        ],
      },
      {
        heading: "Accounts",
        paragraphs: [
          "You must give accurate details and keep them up to date. Keep your password secret. You are responsible for activity on your account.",
          "Tell us at once at [Contact email] if you believe your account has been used without permission.",
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: ["You must not:"],
        bullets: [
          "Break any law or the rights of others.",
          "Upload content you have no right to share, including confidential information you are not allowed to disclose.",
          "Upload malware or try to disrupt, probe or overload the service.",
          "Access accounts, projects or data that you are not entitled to see.",
          "Copy, resell or reverse engineer the portal, except where the law allows it.",
          "Use the portal or its AI features to create unlawful, harmful or misleading material.",
        ],
      },
      {
        heading: "Your content",
        paragraphs: [
          "You or your organisation keep ownership of the content you upload or create. We claim no ownership of it.",
          "You give us a licence to host, copy, process and display your content only as needed to run the service for you. This includes sending it to sub-processors such as Anthropic when you use AI features.",
          "You are responsible for your content and for having the rights and permissions to upload it.",
        ],
      },
      {
        heading: "AI output",
        paragraphs: [
          "AI features use Anthropic's Claude models. Their output can be wrong, incomplete or out of date.",
          "AI output is not professional, engineering, legal or compliance advice. A competent person must review it before it is relied on or used on a project.",
          "You are responsible for how you use AI output.",
        ],
      },
      {
        heading: "Subscriptions and payments",
        paragraphs: [
          "Paid plans are billed in advance through Stripe Checkout. Prices, taxes and billing periods are shown before you pay.",
          "Subscriptions renew automatically until cancelled. You can cancel at any time through the Stripe customer portal linked from the billing page.",
          "Cancellation takes effect at the end of the current billing period. Fees already paid are not refunded unless the law requires it or we agree otherwise.",
          "We may change prices with at least [Notice period] notice. The change applies from your next renewal.",
        ],
      },
      {
        heading: "Our intellectual property",
        paragraphs: [
          "The portal, its software, design, guidance, templates and generators belong to [Company legal name] or its licensors.",
          "While your subscription is active you may use them for your own internal business and project work. You may adapt templates for your projects but must not resell or republish them as your own product.",
        ],
      },
      {
        heading: "ISO content and standards",
        paragraphs: [
          "Guidance on ISO 19650 and related standards is our own paraphrased explanation. It does not reproduce the text of any standard.",
          "It does not replace the standards. To rely on a standard you must buy it from ISO, BSI or your national standards body.",
          "Using the portal does not by itself make you compliant with, or certified to, any standard.",
        ],
      },
      {
        heading: "Third-party services",
        paragraphs: [
          "Some features rely on third parties, such as Stripe, Anthropic, Autodesk Platform Services, Speckle, YouTube and Vimeo. Their own terms and privacy policies apply.",
          "Connectors are optional. We are not responsible for third-party services or for changes they make that affect the portal.",
        ],
      },
      {
        heading: "Availability and support",
        paragraphs: [
          "We aim to keep the portal available but do not promise it will be uninterrupted or error free. We may carry out maintenance, sometimes without notice.",
          "Support is available by email at [Contact email] during [Support hours].",
          "Keep your own copies of important project information.",
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "Nothing in these terms limits liability that cannot be limited by law, such as for death or personal injury caused by negligence, or for fraud.",
          "We are not liable for indirect or consequential loss, or for loss of profit, revenue, data or goodwill.",
          "Our total liability in any 12-month period is limited to [Liability cap].",
        ],
      },
      {
        heading: "Termination",
        paragraphs: [
          "You can close your account at any time. We may suspend or close an account that breaks these terms or puts the service or other users at risk.",
          "After closure you can ask for an export of your content within [Data retention period]. After that we may delete it.",
        ],
      },
      {
        heading: "Governing law",
        paragraphs: ["These terms are governed by the laws of [Country/jurisdiction]. The courts of [Country/jurisdiction] have jurisdiction over any dispute, unless the law where you live says otherwise."],
      },
      {
        heading: "Changes to these terms",
        paragraphs: ["We may update these terms. We will give at least [Notice period] notice of significant changes. If you keep using the portal after a change takes effect, the new terms apply."],
      },
      {
        heading: "Contact",
        paragraphs: ["[Company legal name], [Registered address]. Email: [Contact email]."],
      },
    ],
  },
  {
    id: "cookies",
    title: "Cookie and Storage Notice",
    summary: "The cookie and browser storage the portal uses, and the third-party content it loads.",
    sections: [
      {
        heading: "Draft notice",
        paragraphs: [DRAFT_NOTE, "Effective date: [Effective date]."],
      },
      {
        heading: "Our approach",
        paragraphs: [
          "We use only what the portal needs to work. We do not use analytics, advertising or tracking cookies.",
          "Strictly necessary cookies and storage do not need your consent, so we do not show a consent banner.",
        ],
      },
      {
        heading: "Session cookie",
        paragraphs: [
          "When you sign in we set one cookie, named portal_session. It keeps you signed in for up to 14 days or until you sign out.",
          "It is httpOnly, so page scripts cannot read it, and SameSite=Lax, which helps protect against cross-site requests.",
        ],
      },
      {
        heading: "Browser storage",
        paragraphs: [
          "The portal saves some items in your browser's local storage and session storage. They stay on your device and are not sent to us unless you save or submit them.",
        ],
        bullets: [
          "Preferences such as language, theme and role.",
          "Favourites, watched videos and learning progress.",
          "Plan generator data and the last selected plan type.",
          "Drafts and recent results from document tools and generators.",
          "Short-lived working data for the current tab, held in session storage.",
        ],
      },
      {
        heading: "Clearing storage",
        paragraphs: ["You can clear cookies and site data in your browser settings at any time. If you do, you will be signed out and saved preferences and drafts will be lost."],
      },
      {
        heading: "Embedded videos",
        paragraphs: [
          "Some pages show videos from YouTube and Vimeo. We use YouTube's privacy-enhanced mode (youtube-nocookie.com).",
          "When you play a video, the provider receives your IP address and browser data and may set its own cookies or storage. Their privacy policies apply.",
        ],
      },
      {
        heading: "Fonts",
        paragraphs: ["The portal loads fonts from Google Fonts. Google receives your IP address and browser data when the fonts load. It does not set cookies for this."],
      },
      {
        heading: "Optional connectors",
        paragraphs: ["If you connect Autodesk Platform Services, you sign in on Autodesk's own pages, and Autodesk's cookie policy applies there. Speckle tokens are sent with your request and are not stored in your browser."],
      },
      {
        heading: "Changes and contact",
        paragraphs: ["We will update this notice if the portal starts using new cookies or storage. Questions: [Contact email]."],
      },
    ],
  },
  {
    id: "notices",
    title: "Legal Notices",
    summary: "Trademarks, our relationship with third parties, the ISO standards notice and open-source licences.",
    sections: [
      {
        heading: "Draft notice",
        paragraphs: [DRAFT_NOTE, "Effective date: [Effective date]."],
      },
      {
        heading: "Operator",
        paragraphs: ["This portal is operated by [Company legal name], [Registered address], [Country/jurisdiction]. Company number: [Company registration number]. Contact: [Contact email]."],
      },
      {
        heading: "Trademarks",
        paragraphs: [
          "ISO is a trademark of the International Organization for Standardization. Autodesk, Revit, AutoCAD, Civil 3D, Navisworks, Plant 3D and Autodesk Construction Cloud (ACC) are trademarks of Autodesk, Inc.",
          "Speckle is a trademark of its owner. Claude is a trademark of Anthropic. ChatGPT and Codex are trademarks of OpenAI. Other names may be trademarks of their owners.",
          "We use these names only to describe compatibility and subject matter.",
        ],
      },
      {
        heading: "No affiliation",
        paragraphs: [
          "Unless stated otherwise, the portal is not affiliated with, sponsored by or endorsed by ISO, BSI, Autodesk, Speckle, Anthropic, OpenAI or any other trademark owner.",
          "FirstOption is a related product. Its own terms apply to its use.",
        ],
      },
      {
        heading: "ISO standards notice",
        paragraphs: [
          "Content about ISO 19650, ISO/IEC 42001 and other standards is paraphrased guidance written by us. It does not reproduce the text of the standards.",
          "Standards are copyright works of ISO and national standards bodies. Buy official copies from ISO, BSI or your national standards body before relying on them.",
          "Clause references are given for orientation only. Always check the current edition of the standard.",
        ],
      },
      {
        heading: "Open-source software",
        paragraphs: [
          "The portal is built with open-source software, including React, Express and MySQL client libraries. Each component is used under its own licence, such as MIT, Apache 2.0 or BSD.",
          "A list of components and their licences is available on request at [Contact email].",
        ],
      },
    ],
  },
];

export const TRADEMARK_NOTICE = "ISO, Autodesk, Revit, AutoCAD, Civil 3D, Navisworks, Plant 3D, ACC, Speckle, Claude, ChatGPT, Codex and other names are trademarks of their respective owners. This portal is not affiliated with or endorsed by them unless stated.";
