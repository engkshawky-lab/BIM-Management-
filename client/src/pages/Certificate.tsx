import { useEffect, useState } from "react";
import { t } from "../i18n";
import { api } from "../lib/api";
import { useSession } from "../App";
import "./certificate.css";

// Learning-path certificates. /certificate/<code> is public: anyone given the link can check the certificate is
// genuine (it is read from the portal, not from the file), and the holder prints it or saves it as PDF.

export interface Cert { code: string; name: string; pathId: string; title: string; pct: number; issuer: string; signatoryName: string; signatoryTitle: string; issuedAt: string }
interface Loaded { certificate: Cert; signature: string; siteName: string; autodeskUrl: string }

export const certUrl = (code: string) => `${location.origin}/#/certificate/${code}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function CertificateSheet({ c, signature, siteName }: { c: Cert; signature: string; siteName: string }) {
  return (
    <div className="cert-sheet no-i18n" dir="ltr">
      <div className="cert-inner">
        <div className="cert-issuer">{c.issuer || siteName}</div>
        <div className="cert-kicker">Certificate of Achievement</div>
        <div className="cert-kicker-ar" dir="rtl">شهادة إتمام</div>
        <p className="cert-line">This certifies that</p>
        <div className="cert-name" dir="auto">{c.name}</div>
        <p className="cert-line">has successfully completed the learning path</p>
        <div className="cert-title">{c.title}</div>
        <p className="cert-line">and passed the final exam with a score of <b>{c.pct}%</b> (pass mark 75%)</p>
        <div className="cert-foot">
          <div className="cert-date"><b>{fmtDate(c.issuedAt)}</b><span>Date of issue</span></div>
          <div className="cert-sign">
            {signature ? <img src={signature} alt="Signature" /> : <div className="cert-sign-blank" />}
            <div className="cert-sign-line" />
            <b>{c.signatoryName || c.issuer || siteName}</b>
            {c.signatoryTitle && <span>{c.signatoryTitle}</span>}
          </div>
          <div className="cert-code"><b>{c.code}</b><span>Verify at {certUrl(c.code).replace(/^https?:\/\//, "")}</span></div>
        </div>
        <div className="cert-std">ISO 19650 information management · {siteName}</div>
      </div>
    </div>
  );
}

/** Where to earn an Autodesk certificate: only Autodesk (or an Autodesk Authorized Training Center) can issue one. */
export function AutodeskNext({ url }: { url: string }) {
  if (!url) return null;
  return (
    <div className="hub-card cert-autodesk">
      <b>{t("Next step: Autodesk certification")}</b>
      <p className="small">{t("Autodesk certificates are issued only by Autodesk or an Autodesk Authorized Training Center, through their own exams. Use the link to register; your portal certificate shows the ISO 19650 knowledge you have proved here.")}</p>
      <a className="btn small" href={url} target="_blank" rel="noreferrer">{t("Go to Autodesk certification")} ↗</a>
    </div>
  );
}

export default function CertificatePage({ code }: { code: string }) {
  const [data, setData] = useState<Loaded | null | undefined>(undefined);
  useEffect(() => { api<Loaded>(`/public/certificates/${encodeURIComponent(code)}`).then(setData).catch(() => setData(null)); }, [code]);
  if (data === undefined) return <div className="center muted">Loading…</div>;
  if (data === null) return <div className="cert-page"><div className="hub-card cm-error"><b>{t("Certificate not found")}</b><p>{t("No certificate has this code. Check the link, or ask the holder for the address shown on their certificate.")}</p></div></div>;
  return (
    <div className="cert-page">
      <div className="cert-bar no-print">
        <span className="cert-ok">✓ {t("Genuine certificate: these details come from the portal's register.")}</span>
        <span className="row" style={{ gap: 8 }}>
          <button className="primary" onClick={() => window.print()}>{t("Print / save as PDF")}</button>
          <button onClick={() => { void navigator.clipboard?.writeText(certUrl(data.certificate.code)); }}>{t("Copy verification link")}</button>
        </span>
      </div>
      <CertificateSheet c={data.certificate} signature={data.signature} siteName={data.siteName} />
      <div className="no-print" style={{ maxWidth: 900, margin: "16px auto" }}><AutodeskNext url={data.autodeskUrl} /></div>
    </div>
  );
}

/** Admin › Settings › Certificates: the signature image and the register of issued certificates. */
export function CertificateAdmin() {
  const { toast } = useSession();
  const [d, setD] = useState<{ certificates: Cert[]; signature: string } | null>(null);
  const load = () => api<{ certificates: Cert[]; signature: string }>("/admin/certificates").then(setD).catch((e) => toast((e as Error).message, "error"));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const upload = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 290_000) { toast(t("Use a signature image under 290 KB (a PNG with a transparent background works best)."), "error"); return; }
    const rd = new FileReader();
    rd.onload = async () => { try { await api("/admin/certificates/signature", { method: "PUT", body: { dataUrl: String(rd.result) } }); toast(t("Signature saved")); load(); } catch (e) { toast((e as Error).message, "error"); } };
    rd.readAsDataURL(f);
  };
  const clear = async () => { await api("/admin/certificates/signature", { method: "PUT", body: { dataUrl: "" } }); load(); };
  if (!d) return null;
  return (
    <div className="cert-admin">
      <h3>{t("Signature on certificates")}</h3>
      <div className="row" style={{ gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div className="cert-sig-preview">{d.signature ? <img src={d.signature} alt={t("Signature")} /> : <span className="small muted">{t("No signature uploaded")}</span>}</div>
        <label className="btn small">{t("Upload signature image")}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
        {d.signature && <button className="ghost small" onClick={clear}>{t("Remove")}</button>}
      </div>
      <p className="small muted">{t("Certificates show the signatory's name and title from the settings above, with this image. Already-issued certificates keep the name and title they were issued with.")}</p>
      <h3>{t("Issued certificates")} ({d.certificates.length})</h3>
      {d.certificates.length ? <div className="table-wrap" style={{ maxHeight: 320, overflow: "auto" }}><table className="data">
        <thead><tr><th>{t("Code")}</th><th>{t("Name")}</th><th>{t("Learning path")}</th><th>{t("Score")}</th><th>{t("Issued")}</th></tr></thead>
        <tbody>{d.certificates.map((c) => <tr key={c.code}><td className="mono small"><a href={`#/certificate/${c.code}`}>{c.code}</a></td><td className="small no-i18n">{c.name}</td><td className="small">{c.title}</td><td className="small">{c.pct}%</td><td className="small">{new Date(c.issuedAt).toLocaleDateString()}</td></tr>)}</tbody>
      </table></div> : <p className="small muted">{t("None yet.")}</p>}
    </div>
  );
}
