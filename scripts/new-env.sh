#!/bin/sh
# Create .env for a new server install with fresh random secrets.
#   ./scripts/new-env.sh https://bim.example.com
# Refuses to overwrite an existing .env. Fill in the keys afterwards (Claude, SMTP, Stripe, Autodesk).
set -eu
URL="${1:?Usage: ./scripts/new-env.sh https://your-domain}"
case "$URL" in https://*) ;; *) echo "Use the https:// address the portal will be served on." >&2; exit 1 ;; esac
[ -e .env ] && { echo ".env already exists; not overwriting it." >&2; exit 1; }
rand() { openssl rand -base64 48 | tr -d '/+=\n' | cut -c1-"$1"; }
SECRET="$(rand 48)"; DBP="$(rand 32)"; ROOTP="$(rand 32)"
sed -e "s|^SESSION_SECRET=.*|SESSION_SECRET=$SECRET|" \
    -e "s|^PUBLIC_URL=.*|PUBLIC_URL=$URL|" \
    -e "s|^COOKIE_SECURE=.*|COOKIE_SECURE=true|" \
    -e "s|^AI_MONTHLY_LIMIT=.*|AI_MONTHLY_LIMIT=300|" \
    .env.example > .env
printf '\n# Database passwords used by docker-compose.yml (generated)\nDB_PASSWORD=%s\nDB_ROOT_PASSWORD=%s\n' "$DBP" "$ROOTP" >> .env
chmod 600 .env
echo "Wrote .env for $URL with new SESSION_SECRET, DB_PASSWORD and DB_ROOT_PASSWORD (AI_MONTHLY_LIMIT=300 per user; change as needed)."
echo "Next: add CLAUDE_API_KEY, SMTP_*, STRIPE_* and APS_* as needed, then: docker compose up -d"
