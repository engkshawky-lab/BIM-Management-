#!/bin/sh
# Restore a backup made by scripts/backup.sh into the Docker Compose install. Test it on a spare server first.
#   ./scripts/restore.sh backups/db-20261101-020000.sql.gz backups/files-20261101-020000.tar.gz
# Replaces the current database and uploaded files. Asks for confirmation unless FORCE=1.
set -eu
DB="${1:?Usage: ./scripts/restore.sh <db-*.sql.gz> <files-*.tar.gz>}"; FILES="${2:?Usage: ./scripts/restore.sh <db-*.sql.gz> <files-*.tar.gz>}"
[ -f "$DB" ] && [ -f "$FILES" ] || { echo "Backup file not found." >&2; exit 1; }
gunzip -t "$DB" && tar -tzf "$FILES" > /dev/null || { echo "Backup file is damaged." >&2; exit 1; }
if [ "${FORCE:-0}" != 1 ]; then
  printf 'This replaces the current database and uploaded files with %s and %s. Type RESTORE to continue: ' "$DB" "$FILES"
  read -r answer; [ "$answer" = RESTORE ] || { echo "Cancelled."; exit 1; }
fi
docker compose stop app
docker compose exec -T db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS portal; CREATE DATABASE portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON portal.* TO \"portal\"@\"%\";"'
gunzip -c "$DB" | docker compose exec -T db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" portal'
docker compose run --rm --no-deps -T --entrypoint sh app -c 'find /data -mindepth 1 -delete && tar -xzf - -C /data' < "$FILES"
docker compose start app
echo "$(date -Iseconds) restore ok from $DB and $FILES — check https://<domain>/api/health and sign in."
