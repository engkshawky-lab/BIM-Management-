import { LEGAL_DOCS, TRADEMARK_NOTICE } from "../../../shared/data/legal";
import "./legal.css";

// /legal/<privacy|terms|cookies|notices>. Public: reachable from the sign-in page without an account.
export default function Legal({ id, standalone }: { id?: string; standalone?: boolean }) {
  const doc = LEGAL_DOCS.find((d) => d.id === id) ?? LEGAL_DOCS[0]!;
  return (
    <div className={"legal" + (standalone ? " legal-standalone" : "")}>
      {standalone && <p className="small"><a href="#/">← Back to the portal</a></p>}
      <nav className="tabs legal-tabs" aria-label="Legal documents">
        {LEGAL_DOCS.map((d) => <a key={d.id} className={d.id === doc.id ? "on" : ""} href={`#/legal/${d.id}`}>{d.title}</a>)}
      </nav>
      <article className="card legal-doc">
        <h1>{doc.title}</h1>
        <p className="muted">{doc.summary}</p>
        {doc.sections.map((s, i) => (
          <section key={s.heading} className={i === 0 ? "legal-draft" : undefined}>
            <h2>{s.heading}</h2>
            {s.paragraphs.map((p) => <p key={p}>{p}</p>)}
            {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
          </section>
        ))}
      </article>
      <p className="small muted legal-tm">{TRADEMARK_NOTICE}</p>
    </div>
  );
}

/** Footer links to the legal pages and the trademark line; used on the sign-in page and the support page. */
export function LegalFooter() {
  return (
    <footer className="legal-footer small muted">
      <nav>{LEGAL_DOCS.map((d) => <a key={d.id} href={`#/legal/${d.id}`}>{d.title}</a>)}</nav>
      <p>{TRADEMARK_NOTICE}</p>
    </footer>
  );
}
