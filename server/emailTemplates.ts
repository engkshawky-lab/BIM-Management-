// The mockups an administrator starts an email from (Admin › Email users), all in FirstOption's approved layout
// (server/emailLayout.ts), and the {{placeholders}} filled in for each recipient. Text in [square brackets] is for
// the administrator to replace before sending; the page warns while any is left.
import type { EmailBlocks } from "./emailLayout";
import { PLAN_NAMES, type PlanId } from "../shared/emailAudience";

export interface EmailTemplate { id: string; name: string; description: string; blocks: EmailBlocks }

export const PLACEHOLDERS = [
  ["{{firstName}}", "First name"], ["{{name}}", "Full name"], ["{{email}}", "Email address"], ["{{organization}}", "Organisation"],
  ["{{plan}}", "Plan name"], ["{{planEnds}}", "Plan end date (empty on Free or no end date)"], ["{{portalUrl}}", "The portal's address"],
] as const;

const REASON = "You receive this because you have an account on the BIM Management portal. To stop these emails, set Email to Off in your profile.";
const REASON_AR = "وصلك هذا البريد لأن لديك حسابًا على منصة BIM Management. لإيقاف هذه الرسائل، اختر إيقاف البريد من ملفك الشخصي.";

export const TEMPLATES: EmailTemplate[] = [
  { id: "announcement", name: "Announcement", description: "General news for everyone, with one button.", blocks: {
    subject: "[What's new] on the BIM Management portal", preheader: "A short update from the FirstOption team.",
    badge: { text: "News", tone: "gold" }, heading: "[Headline of the announcement]",
    intro: "Hello {{firstName}}, we have news to share about the BIM Management portal.",
    paragraphs: ["[Explain what changed and why it matters to the reader, in two or three sentences.]"],
    button: { label: "Open the portal", url: "{{portalUrl}}/#/login" }, reason: REASON } },
  { id: "feature", name: "New feature", description: "Introduce a tool or page, with steps to try it.", blocks: {
    subject: "New on the portal: [feature name]", preheader: "Try it in three steps.",
    badge: { text: "New feature", tone: "info" }, heading: "Meet [feature name]",
    intro: "Hello {{firstName}}, [feature name] is now live on the portal.",
    paragraphs: ["[One sentence on what it does and who it helps.]"],
    steps: ["Sign in to the portal.", "Open [where to find it].", "[What to do first.]"],
    button: { label: "Try it now", url: "{{portalUrl}}/#/login" }, reason: REASON } },
  { id: "offer", name: "Plan offer", description: "A promo code or discount, with the offer details.", blocks: {
    subject: "An offer for you: [discount] on Professional", preheader: "Use the code before it ends.",
    badge: { text: "Special offer", tone: "gold" }, heading: "[Discount] on your next plan",
    intro: "Hello {{firstName}}, for a limited time you can upgrade for less.",
    rows: [["Promo code", "[CODE]"], ["Discount", "[e.g. 30% off the first year]"], ["Valid until", "[date]"], ["Your current plan", "{{plan}}"]],
    notice: { text: "Enter the code on the Plan & billing page when you choose a plan.", tone: "info" },
    button: { label: "See the plans", url: "{{portalUrl}}/#/billing" }, reason: REASON } },
  { id: "renewal", name: "Renewal reminder", description: "For people whose plan ends soon (use the “plan ends within” filter).", blocks: {
    subject: "Your {{plan}} plan ends on {{planEnds}}", preheader: "Renew to keep your tools and projects.",
    badge: { text: "Renewal reminder", tone: "danger" }, heading: "Your plan ends soon",
    intro: "Hello {{firstName}}, your {{plan}} plan on the BIM Management portal is coming to an end.",
    rows: [["Plan", "{{plan}}"], ["Ends on", "{{planEnds}}"], ["Account", "{{email}}"]],
    paragraphs: ["Renew before it ends to keep using the paid tools without a break. Your projects and documents stay where they are either way."],
    button: { label: "Renew my plan", url: "{{portalUrl}}/#/billing" }, secondary: { label: "Questions? Contact support", url: "{{portalUrl}}/#/support" }, reason: REASON } },
  { id: "maintenance", name: "Maintenance notice", description: "Planned downtime, with date, time and duration.", blocks: {
    subject: "Planned maintenance on [date]", preheader: "The portal will be unavailable for a short time.",
    badge: { text: "Maintenance", tone: "danger" }, heading: "Planned maintenance",
    intro: "Hello {{firstName}}, we are improving the portal and it will be unavailable for a short time.",
    rows: [["Date", "[date]"], ["Time", "[from – to, time zone]"], ["Expected duration", "[e.g. 30 minutes]"]],
    notice: { text: "Save your work before the start time. Nothing you have saved will be lost.", tone: "gold" }, reason: REASON } },
  { id: "event", name: "Event or webinar", description: "An invitation with date, place and a sign-up button.", blocks: {
    subject: "You're invited: [event name]", preheader: "[Date] · [online or place]",
    badge: { text: "Invitation", tone: "info" }, heading: "[Event name]",
    intro: "Hello {{firstName}}, join us for [one line on the topic].",
    rows: [["Date", "[date]"], ["Time", "[time, time zone]"], ["Where", "[online link or place]"], ["Speaker", "[name]"]],
    paragraphs: ["[What attendees will learn, in one or two sentences.]"],
    button: { label: "Reserve my place", url: "[registration link]" }, reason: REASON } },
  { id: "learning", name: "Learning nudge", description: "Encourage lessons, quizzes and learning paths.", blocks: {
    subject: "Keep going with your ISO 19650 learning", preheader: "Your next lesson takes a few minutes.",
    badge: { text: "Learning", tone: "success" }, heading: "Your next step in ISO 19650",
    intro: "Hello {{firstName}}, a few minutes a week is enough to master ISO 19650 information management.",
    steps: ["Open Learn on the portal.", "Pick up the next lesson in your learning path.", "Check yourself with the short quiz at the end."],
    button: { label: "Continue learning", url: "{{portalUrl}}/#/learn" }, reason: REASON } },
  { id: "comeback", name: "We miss you", description: "For people who haven't signed in for a while.", blocks: {
    subject: "{{firstName}}, here's what you missed", preheader: "New tools and guides since your last visit.",
    badge: { text: "What's new", tone: "gold" }, heading: "It's been a while",
    intro: "Hello {{firstName}}, a lot has been added to the portal since your last visit.",
    steps: ["[New tool or page]", "[New guide or course]", "[Improvement]"],
    paragraphs: ["Sign in with your usual email and password. Forgotten it? Choose “Forgot password” on the sign-in page."],
    button: { label: "Sign in", url: "{{portalUrl}}/#/login" }, reason: REASON } },
  { id: "moved", name: "Platform moved", description: "The new-address notice (same email and password).", blocks: {
    subject: "The ISO 19650 platform has moved to a new home", preheader: "Same email, same password: sign in at the new address.",
    badge: { text: "Platform moved", tone: "gold" }, heading: "Your platform has a new home",
    intro: "Dear {{name}}, the BIM Management and ISO 19650 learning platform has moved to a new, faster portal. Your account came with it.",
    paragraphs: ["Sign in with the same email address and password you used before. Nothing needs to be set up again."],
    rows: [["New address", "{{portalUrl}}"], ["Your email", "{{email}}"], ["Your plan", "{{plan}}"], ["Valid until", "{{planEnds}}"]],
    steps: ["Open the new address.", "Sign in with your usual email and password.", "Forgotten it? Choose “Forgot password” on the sign-in page and we’ll email you a link."],
    notice: { tone: "info", dir: "rtl", text: "انتقلت منصة BIM Management و ISO 19650 إلى عنوان جديد. سجّل الدخول بنفس البريد الإلكتروني وكلمة المرور، ويمكنك اختيار العربية من قائمة اللغة داخل المنصة." },
    button: { label: "Open the new portal", url: "{{portalUrl}}/#/login" }, reason: REASON } },
  { id: "arabic", name: "إعلان (Arabic)", description: "An announcement in Arabic, right to left.", blocks: {
    lang: "ar", subject: "[عنوان الإعلان] على منصة BIM Management", preheader: "تحديث قصير من فريق FirstOption.",
    badge: { text: "أخبار", tone: "gold" }, heading: "[عنوان الإعلان]",
    intro: "مرحبًا {{firstName}}، لدينا أخبار نود مشاركتها معك حول منصة BIM Management.",
    paragraphs: ["[اشرح ما الذي تغيّر ولماذا يهم القارئ في جملتين أو ثلاث.]"],
    button: { label: "افتح المنصة", url: "{{portalUrl}}/#/login" }, reason: REASON_AR } },
  { id: "plain", name: "Plain message", description: "Just a heading and text, like a personal note.", blocks: {
    subject: "[Subject]", heading: "[Heading]", intro: "Hello {{firstName}},",
    paragraphs: ["[Your message.]", "Best regards, the FirstOption team"], reason: REASON } },
];

export interface RecipientVars { name: string; email: string; organization: string; plan: string; renewsAt: Date | string | null; portalUrl: string }

const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function placeholderValues(v: RecipientVars): Record<string, string> {
  const ends = v.renewsAt ? new Date(v.renewsAt) : null;
  const paid = v.plan !== "free";
  return {
    name: v.name, firstName: v.name.trim().split(/\s+/)[0] || v.name, email: v.email, organization: v.organization,
    plan: PLAN_NAMES[v.plan as PlanId] ?? v.plan, planEnds: paid && ends && !Number.isNaN(ends.getTime()) ? day(ends) : "",
    portalUrl: v.portalUrl.replace(/\/$/, ""),
  };
}

/** Fill {{placeholders}} in every text of the email. Unknown names are left as they are; the banner image is untouched. */
export function personalize(blocks: EmailBlocks, values: Record<string, string>): EmailBlocks {
  const fill = (s: string) => s.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => (k in values ? values[k] : m));
  const walk = (v: unknown, key = ""): unknown => {
    if (typeof v === "string") return key === "src" || key === "logoSrc" ? v : fill(v);
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    return v;
  };
  return walk(blocks) as EmailBlocks;
}

/** Things to fix before sending: [square bracket] notes left from a mockup, and unknown {{placeholders}}. */
export function draftProblems(blocks: EmailBlocks): string[] {
  const { image: _i, ...rest } = blocks;
  const all = JSON.stringify(rest);
  const out: string[] = [];
  const brackets = [...new Set(all.match(/\[[^\]"]{2,80}\]/g) ?? [])];
  if (brackets.length) out.push(`Replace the notes in square brackets: ${brackets.slice(0, 5).join(" ")}${brackets.length > 5 ? " …" : ""}`);
  const known = new Set(PLACEHOLDERS.map(([p]) => p.slice(2, -2)));
  const unknown = [...new Set([...all.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).filter((k) => !known.has(k)))];
  if (unknown.length) out.push(`Unknown placeholders: ${unknown.map((k) => `{{${k}}}`).join(", ")}`);
  return out;
}
