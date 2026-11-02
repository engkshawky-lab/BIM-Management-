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

const IMAGE_CID = "banner@firstoption-es.com";
const DATA_IMAGE = /^data:(image\/(?:png|jpeg|gif));base64,([A-Za-z0-9+/=]+)$/;

/** Send one email in the FirstOption design (server/emailLayout.ts) and say what happened. Never throws. A banner
 *  given as a data: URL goes as an inline attachment, since Gmail and Outlook don't show data: images. */
export async function deliverEmail(to: string, blocks: EmailBlocks): Promise<{ ok: boolean; error?: string }> {
  const t = get();
  const data = blocks.image?.src ? DATA_IMAGE.exec(blocks.image.src) : null;
  const shown = data ? { ...blocks, image: { ...blocks.image!, src: `cid:${IMAGE_CID}` } } : blocks;
  const { html, text } = renderLayout({ portalUrl: publicUrl() || undefined, ...shown });
  if (!t) { console.log(`[mail disabled] to ${to}: ${blocks.subject}`); return { ok: false, error: "Email is not configured (SMTP_HOST)." }; }
  const attachments = [logoAttachment(), ...(data ? [{ filename: `banner.${data[1] === "image/jpeg" ? "jpg" : data[1].slice(6)}`, content: Buffer.from(data[2], "base64"), contentType: data[1], cid: IMAGE_CID }] : [])];
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER || "portal@localhost", to, subject: blocks.subject, text, html, attachments });
    return { ok: true };
  } catch (e) { const error = (e as Error).message; console.error("[mail] send failed:", error); return { ok: false, error }; }
}

/** Send one email in the FirstOption design. Never throws: email is best effort. */
export async function sendEmail(to: string, blocks: EmailBlocks) {
  return (await deliverEmail(to, blocks)).ok;
}

/** A plain message: the first line is the intro, the rest are paragraphs, with an optional button. `extra` adds a
 *  badge, detail rows, a notice and so on (see EmailBlocks). */
export async function sendMail(to: string, subject: string, lines: string[], action?: { label: string; url: string }, extra: Partial<EmailBlocks> = {}) {
  const [intro = "", ...rest] = lines;
  return sendEmail(to, { subject, heading: subject, intro, paragraphs: rest, button: action, ...extra });
}
