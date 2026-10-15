#!/usr/bin/env bash
# Restore a backup made by backup.sh into a scratch database, then check it.
#
#   AGE_IDENTITY_FILE=key.txt scripts/ops/restore.sh lm-2026....dump.age postgres://user:pass@host/scratch_db
#
# Never point this at production: it refuses the URL in BACKUP_DATABASE_URL and
# any database that already has tables (unless RESTORE_INTO_NONEMPTY=1).
# Needs pg_restore, psql and (for .age files) age.
set -euo pipefail

backup="${1:?usage: restore.sh <backup file> <target database url>}"
target="${2:?usage: restore.sh <backup file> <target database url>}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -n "${BACKUP_DATABASE_URL:-}" && "$target" == "$BACKUP_DATABASE_URL" ]]; then
  echo "Refusing to restore over the database the backup came from." >&2
  exit 2
fi
tables="$(psql "$target" -Atc "select count(*) from information_schema.tables where table_schema = 'public'")"
if [[ "$tables" != "0" && "${RESTORE_INTO_NONEMPTY:-}" != "1" ]]; then
  echo "Target database already has $tables tables. Use an empty scratch database." >&2
  exit 2
fi

if [[ "$backup" == *.age ]]; then
  : "${AGE_IDENTITY_FILE:?set AGE_IDENTITY_FILE to the private key file}"
  age --decrypt --identity "$AGE_IDENTITY_FILE" "$backup" | pg_restore --no-owner --no-privileges --exit-on-error --dbname="$target"
else
  pg_restore --no-owner --no-privileges --exit-on-error --dbname="$target" "$backup"
fi

psql "$target" --set ON_ERROR_STOP=1 --quiet --file="$here/sanity.sql"
echo "Restore OK: $backup"
