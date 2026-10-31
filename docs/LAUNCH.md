# Launch checklist

What must be true before the portal is sold to customers. Items marked **(done)** are handled in the code; the
rest need the owner's accounts, keys or decisions.

## 1. Legal

- [ ] Fill every bracketed placeholder in `shared/data/legal.ts`: company legal name, registered address and
      number, jurisdiction, contact email, effective date, data and backup retention periods, hosting provider
      and location, SMTP provider, supervisory authority, minimum age, notice period, support hours, liability cap.
- [ ] Have a qualified lawyer review the Privacy Policy, Terms of Service, Cookie and Storage Notice and Legal
      Notices. Then delete the "Draft notice" section at the top of each document.
- [ ] Update the Arabic in `client/src/locales/ar.json` for any text the lawyer changes.
- [ ] Sign a data processing agreement with Anthropic (Claude API) and check Stripe's and your SMTP provider's.
- **(done)** Public pages at `/#/legal/privacy`, `/terms`, `/cookies`, `/notices`, linked from the sign-in page,
  the sign-up form and the sidebar; trademark and non-affiliation notice on the sign-in page and every legal page.

## 2. Server and security

- [ ] Serve only over HTTPS behind a proxy that sets `X-Forwarded-Proto`, and set `COOKIE_SECURE=true`.
- [ ] Set a fresh `SESSION_SECRET` (32+ random characters) and strong `DB_PASSWORD` / `DB_ROOT_PASSWORD`.
- [ ] Set `PUBLIC_URL` to the public address (used in email links).
- **(done)** Security headers on every response: Content-Security-Policy, X-Frame-Options, nosniff,
  Referrer-Policy, Permissions-Policy, and HSTS over HTTPS (`server/security.ts`).
- **(done)** Dependencies updated: no high-severity advisories. 7 moderate advisories remain inside `exceljs`
  (minimatch in its zip helper); they need attacker-controlled glob patterns, which the portal never passes.
  Recheck with `npm audit --omit=dev` before each release.

## 3. AI budget

- [ ] Choose either `BILLING=on` (plan quotas) or, without billing, `AI_MONTHLY_LIMIT` (requests per user per month).
- [ ] Set a monthly spend limit on the Anthropic console as a final safety net.
- **(done)** Per-user burst limit `AI_PER_MINUTE` (default 20) on every AI endpoint, including the project agent.

## 4. Payments (Stripe)

- [ ] Create the Pro and Enterprise recurring prices; set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`,
      `STRIPE_PRICE_ENTERPRISE`.
- [ ] Add the webhook `https://<domain>/api/stripe/webhook` for `checkout.session.completed`,
      `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`; set `STRIPE_WEBHOOK_SECRET`.
- [ ] Run a full test-mode purchase, renewal, cancellation and failed payment, then switch to live keys.

## 5. Email

- [ ] Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Without them, password
      reset links only show in the admin console.
- [ ] Add SPF, DKIM and DMARC records for the sending domain, then test sign-up, reset and the daily digest.

## 6. Connectors and AI tools

- [ ] Autodesk ACC: create an APS app, set `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, `APS_CALLBACK_URL`
      (`https://<domain>/api/aps/callback`) and test with a real hub.
- [ ] Run the project agent on a real project with members, files and a plan.
- [ ] Test Clash triage with an English Navisworks HTML report and the programme importer with a CSV export;
      both parsers are covered by tests but have not seen a real file of those kinds.

## 7. Operations

- [ ] Schedule `scripts/backup.sh` nightly (database and uploaded files), copy the backups off the server, and
      test a restore on a spare machine.
- [ ] Point an uptime monitor at `https://<domain>/api/health`.
- [ ] Collect the app's logs (`docker compose logs app`) somewhere searchable and alert on `500` errors.
- **(done)** Code-split client: the first download is about 340 KB (was 3.5 MB); pages and the Arabic dictionary
  load on demand.
