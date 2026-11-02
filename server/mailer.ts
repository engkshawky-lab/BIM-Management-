import nodemailer, { type Transporter } from "nodemailer";
import { setting } from "./appSettings";
import { logoAttachment, renderLayout, type EmailBlocks } from "./emailLayout";

// Optional SMTP delivery. Without SMTP_HOST, mail is logged instead of sent so nothing breaks.
let transport: Transporter | null | undefined;
const get = () => {
  if (transport !== undefined) return transport;
  const host = process.env.SMTP_HOST?.trim();
  transport = host ? nodemailer.createTransport({
    host, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
  }) : null;
  return transport;
};

export const mailEnabled = () => !!process.env.SMTP_HOST?.trim();
export const publicUrl = (fallback = "") => (setting<string>("publicUrl").replace(/\/$/, "") || fallback);

/** Send one email in the FirstOption design (server/emailLayout.ts). Never throws: email is best effort. */
export async function sendEmail(to: string, blocks: EmailBlocks) {
  const t = get();
  const { html, text } = renderLayout({ portalUrl: publicUrl() || undefined, ...blocks });
  if (!t) { console.log(`[mail disabled] to ${to}: ${blocks.subject}`); return false; }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER || "portal@localhost", to, subject: blocks.subject, text, html, attachments: [logoAttachment()] });
    return true;
  } catch (e) { console.error("[mail] send failed:", (e as Error).message); return false; }
}

/** A plain message: the first line is the intro, the rest are paragraphs, with an optional button. `extra` adds a
 *  badge, detail rows, a notice and so on (see EmailBlocks). */
export async function sendMail(to: string, subject: string, lines: string[], action?: { label: string; url: string }, extra: Partial<EmailBlocks> = {}) {
  const [intro = "", ...rest] = lines;
  return sendEmail(to, { subject, heading: subject, intro, paragraphs: rest, button: action, ...extra });
}
