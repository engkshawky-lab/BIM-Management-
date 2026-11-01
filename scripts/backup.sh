#!/bin/sh
# Back up the portal database and uploaded files from the Docker Compose install.
# Run from the folder with docker-compose.yml, e.g. nightly from cron:
#   0 2 * * *  cd /opt/portal && ./scripts/backup.sh >> backups/backup.log 2>&1
# Keeps the last KEEP_DAYS days (default 14) in ./backups. Copy that folder off the server as well.
set -eu

KEEP_DAYS="${KEEP_DAYS:-14}"
DEST="${BACKUP_DIR:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"

fail() { rm -f "$DEST/.db-$STAMP.tmp" "$DEST/.files-$STAMP.tmp"; echo "$(date -Iseconds) BACKUP FAILED: $1" >&2; exit 1; }

# Database: a consistent dump without locking tables (InnoDB). pipefail inside the container so a failed dump is
# not hidden by gzip; the dump must end with mariadb-dump's completion marker.
docker compose exec -T db bash -c 'set -o pipefail; mariadb-dump --single-transaction --routines -uroot -p"$MARIADB_ROOT_PASSWORD" portal | gzip' \
  > "$DEST/.db-$STAMP.tmp" || fail "database dump (is the db service running?)"
gunzip -c "$DEST/.db-$STAMP.tmp" | tail -n 1 | grep -q "Dump completed" || fail "database dump is incomplete"

# Uploaded files: the app's /data volume
docker compose exec -T app tar -czf - -C /data . > "$DEST/.files-$STAMP.tmp" || fail "file archive (is the app service running?)"
tar -tzf "$DEST/.files-$STAMP.tmp" > /dev/null || fail "file archive is damaged"

mv "$DEST/.db-$STAMP.tmp" "$DEST/db-$STAMP.sql.gz"
mv "$DEST/.files-$STAMP.tmp" "$DEST/files-$STAMP.tar.gz"

find "$DEST" -name 'db-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
find "$DEST" -name 'files-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Iseconds) backup ok: db-$STAMP.sql.gz files-$STAMP.tar.gz"

# Restore (test this on a spare server before you need it):
#   ./scripts/restore.sh backups/db-<stamp>.sql.gz backups/files-<stamp>.tar.gz
