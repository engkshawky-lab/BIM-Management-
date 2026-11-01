// Sends page crashes to the server, which lists them for administrators and sends error alerts.
// The same message is sent once per page load; failed page downloads after a release are not errors worth reporting.
const seen = new Set<string>();
const STALE = /dynamically imported module|Loading chunk|Importing a module script failed|ResizeObserver loop/i;

export function reportError(err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
  if (!e.message || STALE.test(e.message) || seen.has(e.message) || seen.size > 20) return;
  seen.add(e.message);
  const where = window.location.pathname + window.location.hash.replace(/[0-9a-f]{64}/g, "…");
  fetch("/api/client-error", {
    method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", keepalive: true,
    body: JSON.stringify({ message: e.message.slice(0, 1000), where: where.slice(0, 300), stack: (e.stack ?? "").slice(0, 4000) }),
  }).catch(() => undefined);
}

export function watchErrors() {
  window.addEventListener("error", (ev) => reportError(ev.error ?? ev.message));
  window.addEventListener("unhandledrejection", (ev) => reportError(ev.reason));
}
