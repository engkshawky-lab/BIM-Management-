# Deployed portal smoke tests

Requires Node 22 and `npm ci`. Uses plain fetch with an explicit session cookie, no browser or local database imports. The normal `npm test` script and its include patterns are unchanged; live tests run only with `test:live`.

PowerShell, against a locally built production server (`npm run build`, then configure the database/environment and `npm start`):

```powershell
npm run test:live # defaults to http://localhost:3001
```

Against Railway:

```powershell
$env:BASE_URL = 'https://portal-production-cc7a.up.railway.app'
npm run test:live
```

`BASE_URL` must identify the deployment origin (no path prefix). SEO canonical URLs, robots and sitemap must advertise that origin; an alternate hostname needs matching server public URL settings. Pricing may redirect home only when public settings disable it. Hash routes are client-side; this HTTP suite verifies their SPA shell and server public-page metadata, not JavaScript rendering or browser interaction.

## Tiers and safety

- **A (always):** DB-backed health; SPA shell and referenced JS/CSS status, MIME and immutable cache; home, pricing, about, login, signup and four legal pages with metadata; robots/sitemap base URL; security headers including HTTPS HSTS; JSON API 404; one representative endpoint from every router behind the session mount, account export and all discoverable admin GETs; invalid login/no cookie; invalid signup validation; generic unknown-email reset; unauthenticated wrong-type upload. Route probes are derived from `server/index.ts` and router source without executing server code. Requests are sequential with 150 ms pauses, timeouts and no retries.
- **B:** set `TEST_EMAIL` and `TEST_PASSWORD` through your shell/secret manager. Use a dedicated, already-approved, verified test user with project/storage/document permissions and available quota. Tests sign in, read identity/profile, projects and plan; create one `ZZ-SMOKE-<timestamp>-<suffix>` project, folder, tiny text upload and BEP document; download and compare bytes. `afterAll` deletes the file (including its blob), document, folder and project, verifies removal, logs out and checks the old cookie gets 401 from projects and null from auth/me. No existing projects are edited. Login updates last-login/session records; normal server logs/usage may remain.
- **C:** set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for an existing administrator. Reads user list/project counts, overview totals, pending queue and settings, then logs out. Never modifies users/settings. Response bodies and cookies are not printed by helpers.
- **D:** additionally set `RUN_AI=1` with B credentials. Exactly one project-assistant HTTP request with a tiny prompt, no retries. This spends AI quota/money and may leave normal usage accounting; the project is cleaned with B. It does not guarantee one underlying provider attempt (server controls that).

Missing credential pairs skip B/C cleanly; D also requires explicit opt-in. Pending-approval login is explicitly skipped because no pending account/password is provisioned. Never create accounts to enable a tier.

A sends a handful of intentionally rejected POSTs. Both registration payloads have passwords shorter than eight characters; `auth.ts` validates before DB insertion, invitations or email. The reset test uses a random UUID address at `example.com`, compares the generic response to the source's known-account response strings, and never requests a real user's reset. Source only sends reset mail for an existing enabled account. No real known-email comparison is attempted. The upload is tiny: the session guard must reject it before multer; no oversize traffic is sent.

Cleanup attempts continue after individual failures and fail loudly with the smoke project identifier. Do not interrupt a credentialed run: `afterAll` cannot guarantee cleanup after process termination, network loss, or a server that commits a write but drops the response before returning its ID. Investigate any teardown failure immediately; no broad prefix-based deletion of existing projects is performed. Project deletion alone leaves file blobs, so file deletion is explicitly attempted first.

Verify changes with `npm run check`, `npm test`, and `npx tsc --project tests/live/tsconfig.json --noEmit` (the app tsconfig deliberately excludes this isolated suite). Keep credentials out of tracked files and logs. To force A only, unset all four credential variables and `RUN_AI`, or run `npm run test:live -- tests/live/anonymous.test.ts`.
