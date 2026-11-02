# Manus user import

Run from the repository root with Node and installed dependencies. No migrations are added or run. Do not put the source workbook in this repository. Output files contain personal data (invitation files also contain bearer tokens); all must be directly under the ignored `.local/manus-import/` folder. Files are created exclusively and never overwritten. Restrict Windows ACLs on that directory; POSIX creation modes are 0700/0600.

```sh
# No connection of any kind; validation and count summary only:
npx tsx scripts/import-manus-users.ts /outside/repo/export.xlsx --offline

# Owner: configure DATABASE_URL, DATABASE_SSL and optional DATABASE_CA_CERT in the process environment.
# This does not load .env files. Default mode reads users but writes no database rows.
npx tsx scripts/import-manus-users.ts /outside/repo/export.xlsx --report .local/manus-import/review.csv

# Owner: transactional import after reviewing the dry run:
npx tsx scripts/import-manus-users.ts /outside/repo/export.xlsx --apply --report .local/manus-import/import.csv

# Separate, opt-in step AFTER import. Does not import any users or send email:
npx tsx scripts/import-manus-users.ts /outside/repo/export.xlsx --apply --invite-links .local/manus-import/invites.csv --public-url https://portal.example

# Optional small batch (same flags work independently):
npx tsx scripts/import-manus-users.ts /outside/repo/export.xlsx --apply --invite-links .local/manus-import/test-invite.csv --public-url https://portal.example --only person@example.com --limit 1
```

No `--update` or `--send-invites` mode is provided: existing accounts are always preserved, and there is no email sending code. Unknown options fail. Console output contains counts and rejected row numbers/reasons only. Existing email matches are listed in the explicitly requested private CSV. Without DATABASE_URL use `--offline`; existing-email counts cannot be established offline.

## Field mapping

| Manus field | Portal destination / behavior |
| --- | --- |
| Email | `users.email`, trimmed and lowercased; normalized matching against existing portal emails |
| Full Name | `users.name` |
| Organisation | `users.organization` |
| Job Title | `users.jobTitle` |
| Mobile | `users.phone`, removes Excel's leading apostrophe |
| Role | `users.role`; admin stays admin; unsupported roles rejected |
| Account Status | approved → `disabled=0`; pending → `disabled=2` (Admin Pending queue) |
| Registered At (UTC) | `users.createdAt` and `emailVerifiedAt` |
| Last Login At (UTC) | `users.lastLoginAt`, nullable |
| Subscription Type | `subscriptions.plan`: starter → starter, professional → pro, expert → expert; blank admin → free |
| Subscription Expiry Date | `subscriptions.renewsAt`, nullable; expired dates automatically fall back to free through `currentPlan()` |
| User ID | Private CSV source identifier alongside generated portal UUID; not assumed to be a UUID (admin IDs are not UUIDs) |
| Country, Purpose, Level, Region | Private CSV; no appropriate user metadata field exists |
| Payment Confirmed, Method, Date | Private CSV; no billing charge or payment confirmation is manufactured |
| Applied Promo Code, Promo Expiry Date | Private CSV; no redeemable promo is created, and usage is not incremented |
| Original Price, Final Price | Private CSV; currency deliberately not inferred |
| Campaign Source, Medium, Name, Content | Private CSV |
| Expiry Status (calculated) | Ignored entirely, including formula results |
| Password (absent) | Independent cryptographically random secret hashed using bcrypt cost 12; secret discarded |
| Subscription fields absent from export | `status=active`, `source=manus-import`, `updatedAt=import time`, Stripe identifiers null |
| Locale (absent) | en |

The CSV preserves every imported source column, including fields mapped to the database, with UTC ISO dates. Spreadsheet formula protection adds an apostrophe to potentially executable CSV cell values. It is an archival mapping, not an automatic database restore format. No leads or public profile bios are created solely to hold private migration data.

## Safety and repeatability

Header validation uses row 4; dates support Excel's 1900 system serials and native Date values. Other date strings, error/formula cells in imported fields, unsupported statuses/plans/roles, invalid emails, and oversized values are rejected without truncation. All rejected rows are counted; any rejection blocks `--apply`. Duplicate normalized workbook emails are rejected; ambiguous normalized database emails fail the operation. A concurrent conflicting insert fails the transaction through the existing email uniqueness constraint.

All user/subscription inserts occur in one transaction. Repeated imports skip existing emails entirely, preserving passwords, sessions, profile edits, approvals and subscriptions. Each import writes an archival CSV before attempting the transaction, with `planned-insert` or `existing-skipped` results and allocated IDs. **A CSV is not proof of commit**: require the final `committed:true` console result. A failed or interrupted transaction may leave a planned report; inspect database state and rerun with a fresh output filename. If a commit acknowledgment is lost, rerunning safely discovers committed emails.

Invitation mode writes reset rows in a separate transaction using the same shared token builder as the application, the `/auth/reset` SHA-256 mechanism, and 14-day expiry. It locks each user row; only imported users with `disabled=0` qualify. Pending users need approval first. Existing unused, unexpired reset rows are skipped, so repeated invitation runs do not invalidate or duplicate usable links. Keep the original invitation CSV: token plaintext cannot be recovered from the database. Used/expired links can be reissued by explicit rerun. A rolled-back/failed invitation commit may leave a CSV of invalid links: distribute only after the successful count result, and use a fresh filename on retries. `--limit` bounds selected candidates, including ones subsequently skipped.

## Owner decisions before execution

- Confirm that exported addresses were verified in Manus. This portal treats a non-null `emailVerifiedAt` as verified; setting it to registration time bypasses email verification as requested, without claiming the actual Manus verification timestamp is known.
- Review missing subscription expiries: **36 records have no expiry, including 11 approved accounts**. Null means no expiry in this portal. The export Summary explicitly warns that blank expiries need review. The importer preserves them without inventing an end date.
- Payment confirmation is archival only. The saved plan remains active irrespective of Payment Confirmed; pending users remain blocked by approval. Confirm those entitlements, the retained admin roles, and blank admin plans (admins bypass section billing checks).
- Choose and verify the HTTPS portal origin before creating links. There is no outgoing mail feature; if distributing links later, explain that the platform moved and a new password must be set, with a 14-day expiry.
- Use a database backup and a local/staging rehearsal before the owner applies to production. Docker was unavailable in the implementation environment, so database transaction behavior has not been integration-tested here.

## Validation

Real supplied workbook offline dry run: **187 valid, 0 rejected**; roles: **185 user, 2 admin**; status: **162 approved, 25 pending**; mapped plans: **135 expert, 39 pro, 11 starter, 2 free** (blank admin plans). Existing database matches were **not checked**: no database connection was made. The Summary and Data Dictionary were reviewed. Table definitions are ignored on load to work around ExcelJS's handling of absolute table relationship targets; source cell values and date styles remain loaded.

Synthetic workbook tests cover serialized XLSX parsing, mapping, UTC dates, approval state, roles/plans, duplicate emails, rejected cells/headers, CSV escaping, and reset token compatibility. Run `npm run check`, `npx tsc -p scripts/tsconfig.json`, and `npm test`.

Implementation verification: both TypeScript checks passed; `npm test` passed **58 files / 576 tests**, including **11 importer tests**. Docker was not installed, so no local database integration test was possible. No remote database was contacted and no email was sent.
