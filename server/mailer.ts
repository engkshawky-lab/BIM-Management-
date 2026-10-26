import nodemailer from "nodemailer";

// Optional SMTP delivery. Without SMTP_HOST, mail is logged instead of sent so nothing breaks.
let transport: nodemailer.Transporter | null | undefined;
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
export const publicUrl = (fallback = "") => (process.env.PUBLIC_URL?.replace(/\/$/, "") || fallback);

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Send a plain message with an optional call-to-action link. Never throws: email is best effort. */
export async function sendMail(to: string, subject: string, lines: string[], action?: { label: string; url: string }) {
  const t = get();
  const text = [...lines, ...(action ? ["", `${action.label}: ${action.url}`] : [])].join("\n");
  if (!t) { console.log(`[mail disabled] to ${to}: ${subject}`); return false; }
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#1e293b">${lines.map((l) => `<p>${esc(l)}</p>`).join("")}${action ? `<p><a href="${esc(action.url)}" style="background:#4f46e5;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none">${esc(action.label)}</a></p>` : ""}<p style="color:#94a3b8;font-size:12px">BIM Management portal · change email settings in your profile</p></div>`;
  try { await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER || "portal@localhost", to, subject, text, html }); return true; }
  catch (e) { console.error("[mail] send failed:", (e as Error).message); return false; }
}
