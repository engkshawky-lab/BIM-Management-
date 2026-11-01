import { Component, type ReactNode } from "react";
import "./errorScreen.css";
import { reportError } from "../lib/reportError";

// Catches render errors and failed page downloads (for example after a new release replaced the files),
// so the user sees a way out instead of a blank screen. Resets when the route changes.
export default class ErrorBoundary extends Component<{ route: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error(error); reportError(error); }
  componentDidUpdate(prev: { route: string }) { if (prev.route !== this.props.route && this.state.error) this.setState({ error: null }); }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const stale = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(error.message);
    return (
      <div className="card error-screen" role="alert">
        <h1>{stale ? "A new version is available" : "Something went wrong on this page"}</h1>
        <p className="muted">{stale ? "The portal was updated while this page was open. Reload to get the latest version." : "Reload the page to try again. If it keeps happening, tell your administrator what you were doing."}</p>
        <div className="row">
          <button type="button" className="primary" onClick={() => window.location.reload()}>Reload</button>
          <a className="btn" href="#/">Go to the home page</a>
        </div>
      </div>
    );
  }
}

export function NotFound() {
  return (
    <div className="card error-screen">
      <h1>Page not found</h1>
      <p className="muted">This address doesn't match a page in the portal. It may have moved, or the link may be incomplete.</p>
      <div className="row">
        <a className="btn primary" href="#/">Go to the home page</a>
        <a className="btn" href="#/guide">Open the platform guide</a>
      </div>
    </div>
  );
}
