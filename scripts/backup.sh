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

# Database: a consistent dump without locking tables (InnoDB)
docker compose exec -T db sh -c 'mariadb-dump --single-transaction --routines -uroot -p"$MARIADB_ROOT_PASSWORD" portal' \
  | gzip > "$DEST/db-$STAMP.sql.gz"

# Uploaded files: the app's /data volume
docker compose exec -T app tar -czf - -C /data . > "$DEST/files-$STAMP.tar.gz"

find "$DEST" -name 'db-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
find "$DEST" -name 'files-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Iseconds) backup ok: db-$STAMP.sql.gz files-$STAMP.tar.gz"

# Restore (test this on a spare server before you need it):
#   gunzip -c backups/db-<stamp>.sql.gz | docker compose exec -T db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" portal'
#   docker compose exec -T app tar -xzf - -C /data < backups/files-<stamp>.tar.gz
