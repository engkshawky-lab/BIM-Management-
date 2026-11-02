# Live smoke verification — 2026-11-02

Target: https://portal-production-cc7a.up.railway.app

Final command: `npm run test:live -- --reporter=dot`, with BASE_URL set to the target, all credential variables unset and RUN_AI=0. Runtime available in this worktree: Node v24.15.0; the suite uses Node 22-compatible fetch APIs, but was not executed under Node 22 here.

Final tier A result: **76 passed, 1 failed, 1 skipped** (78 cases, approximately 31 seconds). B/C/D: six cases skipped because credentials/AI opt-in were not supplied. Total runner result: 76 passed, 1 failed, 7 skipped; exit code 1 is intentional until the deployment's 404 contract is fixed.

## Cases

- DB-backed `/api/health`; SPA shell, script/stylesheets, MIME and appropriate caching.
- Nine public pages (home, pricing, about, login, signup, privacy, terms, cookies, notices): titles, descriptions, Open Graph, canonical URLs or noindex. Robots/sitemap URLs match BASE_URL.
- CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy and HTTPS HSTS on HTML and API responses.
- Unknown API JSON 404 contract; session protection for 39 router mounts derived from index.ts; account export; 17 admin read routes.
- Wrong login/no cookie; pending-account login explicitly skipped; two always-invalid registration payloads; generic unknown-email reset; unauthenticated tiny wrong-type upload.
- Credential-gated B: identity/profile, project list, plan, project/folder/upload/download/document lifecycle, cleanup and logout invalidation.
- Credential-gated C: users/counts, pending queue, settings; no admin writes.
- Explicitly opted-in D: one tiny assistant request on the temporary project, no retries.

## Findings

1. **Confirmed contract defect, test retained:** `GET /api/zz-smoke-nonexistent` returns JSON **401**, expected JSON **404**. It does not return the SPA. `server/index.ts` mounts the global requireUser middleware before the fallback 404, explaining this behavior. Observed consistently across all three runs. No application code changed to hide/fix this finding.
2. **Observed transient availability failure:** the second run received HTTP **502** after about 15 seconds from anonymous `POST /api/ai/tools/compliance-matrix`. The first and final runs returned the correct 401. No automatic retries or relaxed assertions were added. Cause cannot be determined from HTTP evidence alone; this is not evidence of anonymous AI access.
3. **Corrected test assumption:** `/theme.js` is unhashed and uses `public, max-age=3600`; immutable year-long caching applies to `/assets/` bundles. The corrected asset test passes.
4. **Source-only cleanup risk:** project deletion intentionally leaves stored blobs for offline cleanup. B explicitly deletes uploaded files before deleting the project, recovers file IDs inside its isolated project after response loss, and reports teardown failures loudly. B has not been exercised against live because no credentials were supplied.

No accounts were created, no real user's reset requested, no admin settings/users changed and no paid AI request made. A issued only anonymous reads and the deliberately rejected/unknown-email requests described in README. Temporary lifecycle resources were not created because B was skipped.

## Repository checks

- `npm run check`: passed.
- `npm test`: **59 files, 585 tests passed**; live tests were not collected, and the existing npm test script/config were unchanged.
- `npx tsc --project tests/live/tsconfig.json --noEmit`: passed, including the final teardown safeguards.
- `git diff --check`: passed.

Dependencies were initially absent; `npm ci --no-audit --no-fund` installed the existing lockfile without tracked dependency changes before successful verification.
