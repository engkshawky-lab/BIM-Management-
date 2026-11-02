// The look every portal email shares: FirstOption's approved dark email design (the same one the FirstOption MCP Hub
// uses, rnd-firstoption/firstoption-mcp-hub docs/email-mockups and server/src/emails/layout.js). A message gives blocks
// (badge, heading, intro, paragraphs, steps, detail rows, notice, button); this turns them into email-client-safe HTML
// (tables, inline styles, bgcolor for Outlook and Gmail) and a plain-text copy, in English (left to right) or Arabic
// (right to left). Every value that comes from data is escaped here, once.
import { LOGO_PNG_BASE64 } from "./emailLogo";

export const LOGO_CID = "logo@firstoption-es.com";
export const logoAttachment = () => ({ filename: "firstoption-logo.png", content: Buffer.from(LOGO_PNG_BASE64, "base64"), cid: LOGO_CID });

export const WEBSITE = "https://firstoption-es.com";
export const LINKEDIN = "https://www.linkedin.com/company/firstoption-es";
export const supportEmail = () => process.env.SUPPORT_EMAIL?.trim() || process.env.SMTP_USER?.trim() || "support@firstoption-es.com";

const C = { page: "#0a0e16", card: "#0f131c", panel: "#1c2028", border: "#3e4850", text: "#dfe2ee", muted: "#bec8d2", faint: "#9ca5ae", link: "#89ceff", gold: "#e0af36" };
/** Badge and notice colours: background tint and text/edge colour. */
export const TONES = {
  gold: ["#292417", "#e0af36"], info: ["#152534", "#89ceff"], danger: ["#35191e", "#ffb4ab"], success: ["#162c24", "#9ad9b1"],
} as const;
export type Tone = keyof typeof TONES;
export type Lang = "en" | "ar";

const FONTS: Record<Lang, string> = { en: "Segoe UI, Roboto, Helvetica, Arial, sans-serif", ar: "Tahoma, Segoe UI, Arial, sans-serif" };
const FOOTER: Record<Lang, { help: string; website: string; portal: string; fallback: string; reason: string }> = {
  en: { help: "Need help?", website: "Website", portal: "Portal", fallback: "If the button doesn’t work, use this link:", reason: "You receive this because you have an account on the BIM Management portal." },
  ar: { help: "للمساعدة:", website: "الموقع الإلكتروني", portal: "المنصة", fallback: "إذا لم يعمل الزر، استخدم الرابط التالي:", reason: "وصلك هذا البريد لأن لديك حسابًا على منصة BIM Management." },
};
export const PRODUCT_LABEL = "BIM MANAGEMENT · ISO 19650";

export const esc = (v: unknown) => String(v ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const shown = (url: string) => (url.startsWith("mailto:") ? url.slice(7) : url);

/** A paragraph, optionally in the other writing direction (e.g. an Arabic paragraph in an English email). */
export type Paragraph = string | { text: string; dir: "rtl" | "ltr" };
export interface EmailBlocks {
  lang?: Lang;
  subject: string;
  /** the hidden line mail apps show next to the subject */
  preheader?: string;
  badge?: { text: string; tone: Tone };
  heading: string;
  intro: string;
  paragraphs?: Paragraph[];
  steps?: string[];
  rows?: Array<[string, string | null | undefined]>;
  notice?: { text: string; tone: Tone; dir?: "rtl" | "ltr" };
  button?: { label: string; url: string };
  secondary?: { label: string; url: string };
  /** why the person gets this email (footer) */
  reason?: string;
  /** the portal's public address, for the footer link */
  portalUrl?: string;
  /** the logo's src: the inline attachment by default */
  logoSrc?: string;
}

export function renderLayout(m: EmailBlocks) {
  const lang: Lang = m.lang === "ar" ? "ar" : "en";
  const dir = lang === "ar" ? "rtl" : "ltr";
  const start = lang === "ar" ? "right" : "left";
  const font = FONTS[lang];
  const f = FOOTER[lang];
  const logoSrc = m.logoSrc ?? `cid:${LOGO_CID}`;
  const portalUrl = m.portalUrl || WEBSITE;
  const support = supportEmail();
  const [badgeBg, badgeFg] = TONES[m.badge?.tone ?? "gold"] ?? TONES.gold;

  const rows = (m.rows ?? []).filter((r): r is [string, string] => r[1] !== undefined && r[1] !== null && r[1] !== "");
  const table = rows.length ? `
<tr><td class="content-pad" style="padding:24px 36px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.panel}" dir="${dir}" style="width:100%;background-color:${C.panel};border:1px solid ${C.border};border-radius:7px;border-spacing:0;table-layout:fixed;">
${rows.map(([label, value], i) => {
    const edge = i ? `border-top:1px solid ${C.border};` : "";
    return `<tr><td width="42%" valign="top" style="padding:13px 16px;${edge}font-size:13px;line-height:21px;color:${C.muted};text-align:${start};">${esc(label)}</td>`
      + `<td valign="top" style="padding:13px 16px;${edge}font-size:14px;line-height:21px;font-weight:600;color:${C.text};text-align:${start};overflow-wrap:anywhere;">${esc(value)}</td></tr>`;
  }).join("\n")}
</table>
</td></tr>` : "";

  const paras = (m.paragraphs ?? []).filter(Boolean);
  const paragraphs = paras.map((p) => {
    if (typeof p === "string") return `\n<p style="margin:14px 0 0;font-size:15px;line-height:26px;color:${C.muted};">${esc(p)}</p>`;
    const align = p.dir === "rtl" ? "right" : "left";
    const pf = p.dir === "rtl" ? FONTS.ar : FONTS.en;
    return `\n<p dir="${p.dir}" lang="${p.dir === "rtl" ? "ar" : "en"}" style="margin:14px 0 0;font-family:${pf};font-size:15px;line-height:27px;color:${C.muted};text-align:${align};">${esc(p.text)}</p>`;
  }).join("");

  const list = (m.steps ?? []).filter(Boolean);
  const steps = list.length ? `
<tr><td class="content-pad" style="padding:22px 36px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" dir="${dir}" style="width:100%;border-collapse:collapse;">
${list.map((step, i) => `<tr><td width="34" valign="top" style="padding:0 0 12px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" bgcolor="${TONES.gold[0]}" style="background-color:${TONES.gold[0]};border-collapse:separate;border-radius:13px;"><tr><td width="26" height="26" align="center" style="width:26px;height:26px;color:${C.gold};font-size:13px;font-weight:700;line-height:26px;text-align:center;">${i + 1}</td></tr></table></td>`
    + `<td valign="top" style="padding:3px 0 12px;font-size:14px;line-height:21px;color:${C.text};text-align:${start};overflow-wrap:anywhere;">${esc(step)}</td></tr>`).join("\n")}
</table>
</td></tr>` : "";

  let notice = "";
  if (m.notice?.text) {
    const [bg, fg] = TONES[m.notice.tone] ?? TONES.gold;
    const ndir = m.notice.dir ?? dir;
    const nstart = ndir === "rtl" ? "right" : "left";
    const nfont = ndir === "rtl" ? FONTS.ar : font;
    notice = `
<tr><td class="content-pad" style="padding:20px 36px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${bg}" dir="${ndir}" style="width:100%;background-color:${bg};border-collapse:collapse;border-${nstart}:3px solid ${fg};"><tr><td align="${nstart}" style="padding:13px 15px;color:${fg};font-family:${nfont};font-size:13px;line-height:23px;text-align:${nstart};">${esc(m.notice.text)}</td></tr></table>
</td></tr>`;
  }

  let action = "";
  if (m.button?.url) {
    const url = esc(m.button.url);
    const label = esc(m.button.label);
    action = `
<!--[if mso]><v:roundrect href="${url}" style="height:50px;v-text-anchor:middle;width:260px;" arcsize="10%" strokecolor="${C.gold}" fillcolor="${C.gold}"><w:anchorlock/><center dir="${dir}" style="color:${C.page};font-family:${font};font-size:15px;font-weight:bold;">${label}</center></v:roundrect><![endif]-->
<!--[if !mso]><!-->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;"><tr><td align="center" bgcolor="${C.gold}" style="padding:0;background-color:${C.gold};border:1px solid ${C.gold};border-radius:5px;mso-padding-alt:15px 24px;"><a href="${url}" style="display:inline-block;padding:15px 24px;font-family:${font};font-size:15px;line-height:20px;font-weight:700;text-align:center;color:${C.page};text-decoration:none;border-radius:5px;">${label}</a></td></tr></table>
<!--<![endif]-->
<p style="margin:17px 0 5px;color:${C.faint};font-size:11px;line-height:19px;">${esc(f.fallback)}</p>
<p dir="ltr" style="margin:0;font-size:11px;line-height:19px;text-align:${start};word-break:break-all;overflow-wrap:anywhere;"><a href="${url}" style="color:${C.link};text-decoration:underline;">${esc(shown(m.button.url))}</a></p>`;
  }
  if (m.secondary?.url) {
    action += `
<p style="margin:19px 0 0;font-size:13px;line-height:22px;"><a href="${esc(m.secondary.url)}" style="color:${C.link};text-decoration:underline;">${esc(m.secondary.label)}</a></p>`;
  }

  const sep = `<span style="color:${C.border};"> &nbsp; / &nbsp; </span>`;
  const year = new Date().getUTCFullYear();
  const reason = m.reason ?? f.reason;
  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
<title>${esc(m.subject)}</title>
<style>
@media (prefers-color-scheme: dark) { body, .page { background-color:${C.page} !important; color:${C.text} !important; } }
@media only screen and (max-width:620px) { .outer-pad { padding:16px 10px !important; } .content-pad { padding-left:22px !important; padding-right:22px !important; } .email-heading { font-size:26px !important; line-height:35px !important; } .footer-pad { padding-left:18px !important; padding-right:18px !important; } }
</style>
</head>
<body bgcolor="${C.page}" dir="${dir}" style="margin:0;padding:0;width:100%;background-color:${C.page};color:${C.text};font-family:${font};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;color:${C.page};max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(m.preheader ?? m.intro)}${"&#847; &zwnj; &nbsp;".repeat(12)}</div>
<table role="presentation" class="page" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.page}" dir="${dir}" style="width:100%;background-color:${C.page};border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr><td class="outer-pad" align="center" style="padding:32px 16px;">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr><td bgcolor="${C.card}" style="background-color:${C.card};border:1px solid ${C.border};border-top:3px solid ${C.gold};border-radius:12px;overflow:hidden;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.card}" dir="${dir}" style="width:100%;background-color:${C.card};border-collapse:collapse;font-family:${font};">
<tr><td class="content-pad" align="${start}" style="padding:30px 36px 25px;text-align:${start};border-bottom:1px solid ${C.border};">
<a href="${WEBSITE}" style="text-decoration:none;"><img src="${esc(logoSrc)}" width="180" alt="First Option" style="display:block;width:180px;max-width:100%;height:auto;border:0;"></a>
<p dir="ltr" style="margin:17px 0 0;font-size:11px;line-height:18px;letter-spacing:1.5px;color:${C.muted};text-align:${start};">${PRODUCT_LABEL}</p>
</td></tr>
<tr><td class="content-pad" align="${start}" style="padding:28px 36px 0;text-align:${start};">
${m.badge?.text ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" bgcolor="${badgeBg}" style="background-color:${badgeBg};border-collapse:separate;border-radius:4px;"><tr><td style="padding:6px 10px;color:${badgeFg};font-size:12px;font-weight:600;line-height:18px;">${esc(m.badge.text)}</td></tr></table>` : ""}
<h1 class="email-heading" style="margin:18px 0 12px;font-size:30px;line-height:39px;letter-spacing:${lang === "ar" ? "0" : "-0.6px"};font-weight:700;color:${C.text};">${esc(m.heading)}</h1>
<p style="margin:0;font-size:15px;line-height:26px;color:${C.muted};">${esc(m.intro)}</p>${paragraphs}
</td></tr>${steps}${table}${notice}
<tr><td class="content-pad" align="${start}" style="padding:26px 36px 32px;text-align:${start};">${action}
</td></tr>
</table>
</td></tr>
<tr><td class="footer-pad" align="${start}" style="padding:24px 30px 4px;text-align:${start};font-family:${font};">
<p style="margin:0 0 13px;font-size:12px;line-height:21px;color:${C.muted};">${esc(f.help)} <a href="mailto:${esc(support)}" dir="ltr" style="display:inline-block;color:${C.link};text-decoration:underline;">${esc(support)}</a></p>
<p style="margin:0 0 13px;font-size:12px;line-height:24px;color:${C.faint};"><a href="${WEBSITE}" style="color:${C.muted};text-decoration:underline;">${esc(f.website)}</a>${sep}<a href="${esc(portalUrl)}" style="color:${C.muted};text-decoration:underline;">${esc(f.portal)}</a>${sep}<a href="${LINKEDIN}" style="color:${C.muted};text-decoration:underline;">LinkedIn</a></p>
<p style="margin:0 0 12px;font-size:11px;line-height:20px;color:${C.faint};">${esc(reason)}</p>
<p dir="ltr" style="margin:0;font-size:11px;line-height:20px;text-align:${start};color:${C.faint};">© ${year} First Option Engineering Services.</p>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;

  const text = [
    m.heading, "", m.intro, "",
    ...paras.flatMap((p) => [typeof p === "string" ? p : p.text, ""]),
    ...list.map((step, i) => `${i + 1}. ${step}`), list.length ? "" : null,
    ...rows.map(([l, v]) => `${l}: ${v}`), rows.length ? "" : null,
    m.notice?.text ? `${m.notice.text}\n` : null,
    m.button?.url ? `${m.button.label}: ${shown(m.button.url)}` : null,
    m.secondary?.url ? `${m.secondary.label}: ${shown(m.secondary.url)}` : null,
    "", "--", `${f.help} ${support}`, reason, `© ${year} First Option Engineering Services.`,
  ].filter((l) => l !== null).join("\n");

  return { html, text };
}
