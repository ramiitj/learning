#!/usr/bin/env bash
# Logical backup of the production database: pg_dump (custom format) encrypted with age.
#
#   BACKUP_DATABASE_URL=postgres://... BACKUP_AGE_RECIPIENT=age1... scripts/ops/backup.sh [output-dir]
#
# Writes <output-dir>/lm-YYYYMMDDTHHMMSSZ.dump.age and prints its path. The
# plaintext dump never touches disk: it is piped straight into age. Set
# BACKUP_ALLOW_UNENCRYPTED=1 only for a throwaway local database.
set -euo pipefail

: "${BACKUP_DATABASE_URL:?set BACKUP_DATABASE_URL}"
out_dir="${1:-.}"
mkdir -p "$out_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ -n "${BACKUP_AGE_RECIPIENT:-}" ]]; then
  file="$out_dir/lm-$stamp.dump.age"
  pg_dump --format=custom --no-owner --no-privileges --dbname="$BACKUP_DATABASE_URL" | age --recipient "$BACKUP_AGE_RECIPIENT" --output "$file"
elif [[ "${BACKUP_ALLOW_UNENCRYPTED:-}" == "1" ]]; then
  file="$out_dir/lm-$stamp.dump"
  pg_dump --format=custom --no-owner --no-privileges --dbname="$BACKUP_DATABASE_URL" --file="$file"
else
  echo "Refusing to write an unencrypted backup: set BACKUP_AGE_RECIPIENT (an age public key)." >&2
  exit 2
fi

# An empty or truncated file must fail loudly, not look like a backup.
[[ -s "$file" ]] || { echo "Backup file is empty: $file" >&2; exit 1; }
echo "$file"
