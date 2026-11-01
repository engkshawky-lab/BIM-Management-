import { useState, type FormEvent } from "react";
import { t } from "../../i18n";
import { api } from "../../lib/api";

// "Talk to us" form on the public pages. Enquiries go to Admin › Leads and, when set, to the contact email.
export function ContactForm({ source, email }: { source: string; email?: string }) {
  const [f, setF] = useState({ name: "", email: "", company: "", phone: "", interest: "", message: "", website: "" });
  const [state, setState] = useState<"" | "busy" | "sent">(""); const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const send = async (e: FormEvent) => {
    e.preventDefault(); setState("busy"); setError("");
    try { await api("/public/contact", { body: { ...f, source } }); setState("sent"); } catch (err) { setError((err as Error).message); setState(""); }
  };
  if (state === "sent") return <p className="pub-contact-done" role="status">{t("Thank you. We'll reply by email within two working days.")}</p>;
  return (
    <form className="pub-contact" onSubmit={send}>
      <div><label htmlFor="c-name">{t("Name")}</label><input id="c-name" required minLength={2} value={f.name} onChange={set("name")} autoComplete="name" /></div>
      <div><label htmlFor="c-email">{t("Work email")}</label><input id="c-email" type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></div>
      <div><label htmlFor="c-company">{t("Company")}</label><input id="c-company" value={f.company} onChange={set("company")} autoComplete="organization" /></div>
      <div><label htmlFor="c-phone">{t("Phone (optional)")}</label><input id="c-phone" value={f.phone} onChange={set("phone")} autoComplete="tel" /></div>
      <div className="wide"><label htmlFor="c-interest">{t("I'm interested in")}</label>
        <select id="c-interest" value={f.interest} onChange={set("interest")}>
          <option value="">{t("Choose…")}</option><option value="demo">{t("A demo")}</option><option value="starter">Starter</option><option value="pro">Professional</option>
          <option value="expert">Expert</option><option value="team">{t("A plan for my whole team")}</option><option value="other">{t("Something else")}</option>
        </select></div>
      <div className="wide"><label htmlFor="c-message">{t("Message")}</label><textarea id="c-message" rows={4} maxLength={4000} value={f.message} onChange={set("message")} /></div>
      {/* left empty by people; bots fill it in */}
      <input className="pub-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")} name="website" />
      {error && <p className="error wide">{error}</p>}
      <div className="wide row"><button className="primary" disabled={state === "busy"}>{t(state === "busy" ? "Please wait…" : "Send message")}</button>
        {email && <span className="small muted">{t("or email")} <a href={`mailto:${email}`}>{email}</a></span>}</div>
    </form>
  );
}
