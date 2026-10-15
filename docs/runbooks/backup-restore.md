# Runbook: backup, restore and export

Who: the creator (or whoever they delegate). Time: about 15 minutes for a restore test.

## What exists

| Layer | What | How long |
|---|---|---|
| Neon point-in-time restore | Any moment in the last 7 days | 7 days (`infra/terraform/main.tf`) |
| Daily logical backup | `pg_dump --format=custom`, encrypted with age, GitHub artifact `lm-backup` | 35 days, 02:30 IST (`.github/workflows/backup.yml`) |
| Monthly restore test | Restores the latest backup into a scratch Postgres and checks it | 1st of the month (`.github/workflows/restore-test.yml`) |
| Full export | Zip of all content, config and docs in JSON and Markdown | On demand, console > Export everything |

## One-time setup (repository secrets)

1. `age-keygen -o lm-backup-key.txt`. The line `Public key: age1...` is the **recipient**. Keep the file offline (password manager and a printed copy); without it backups cannot be read.
2. Add secrets in GitHub: `BACKUP_DATABASE_URL` (the read-only role below), `BACKUP_AGE_RECIPIENT` (the public key), optionally `ALERT_WEBHOOK_URL`.
3. For the unattended monthly test also add `BACKUP_AGE_IDENTITY` (the whole key file). Skipping it means running the test by hand (below) and the workflow will fail as a reminder.
4. Run the **Backup** workflow once from the Actions tab (Run workflow) and confirm an artifact appears.

To keep backups in your own storage instead of GitHub, replace the upload step in `backup.yml` with an upload to your bucket or drive. The file is already encrypted, so any destination is safe. Keep the 35-day window or longer.

## A read-only role for backups

Terraform cannot make this role: the `kislerdm/neon` provider has no grants, and every role created through the Neon API (or console) is a member of `neon_superuser`, which can write and drop everything. Make it once with SQL **[creator approves]**:

1. Generate a password: `openssl rand -base64 30` (Neon needs at least 60 bits of entropy for roles made with SQL).
2. Neon console, SQL Editor, branch `production`, database `magazine`, connected as the owner role `magazine`. Run, with your password:

```sql
CREATE ROLE backup_reader WITH LOGIN PASSWORD '<generated password>';
GRANT CONNECT ON DATABASE magazine TO backup_reader;
GRANT USAGE ON SCHEMA public TO backup_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_reader;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO backup_reader;
-- Tables added by later migrations (created by the role "magazine") become readable too.
ALTER DEFAULT PRIVILEGES FOR ROLE magazine IN SCHEMA public GRANT SELECT ON TABLES TO backup_reader;
ALTER DEFAULT PRIVILEGES FOR ROLE magazine IN SCHEMA public GRANT SELECT ON SEQUENCES TO backup_reader;
-- Belt and braces: every session starts read-only.
ALTER ROLE backup_reader SET default_transaction_read_only = on;
```

3. `BACKUP_DATABASE_URL` is then `postgresql://backup_reader:<password>@<production endpoint host>/magazine?sslmode=require` (the host is in the Neon console, Connection details, `production`).
4. Check: run the Backup workflow once, and in the SQL Editor connected as `backup_reader` confirm `INSERT INTO events (action) VALUES ('x')` fails.

Tested on PostgreSQL 16 locally (2026-10-15): `scripts/ops/backup.sh` produced a full dump as this role, and INSERT, DELETE and CREATE TABLE were refused. Not yet tried on Neon. If migrations ever add a schema other than `public`, repeat the grants for it. Do not create this role through Terraform's `neon_role` or the Neon console's Roles page: both make it a superuser member.

## Restore test by hand (monthly, or after any change to backups)

```bash
# 1. Download the newest artifact (or from the Actions page) and note its file name.
gh run download <run-id> --name lm-backup --dir backup
# 2. Make an empty scratch database (never production).
createdb lm_restore_test
# 3. Restore and check.
AGE_IDENTITY_FILE=lm-backup-key.txt scripts/ops/restore.sh backup/lm-<stamp>.dump.age postgres://localhost/lm_restore_test
```

`restore.sh` decrypts, runs `pg_restore`, then `scripts/ops/sanity.sql`, which fails unless lessons and events exist, migrations are recorded and the events append-only trigger is present. Success ends with `Restore OK`. Any error is a failed test: fix the backup before relying on it, and tell the creator.

## Real recovery

1. Decide the cause. A bad deploy or bad content: use Unpublish or roll back the lesson version in the console first (no restore needed).
2. Data lost within 7 days: use Neon's restore to a new branch at a time just before the problem, check it, then point `DATABASE_URI` at the branch (or promote it). Creator approval is needed before production changes.
3. Older, or Neon unavailable: create a new Neon project, run `scripts/ops/restore.sh` into it, set `DATABASE_URI` in Vercel, redeploy. Then run the console and check Overview and the event log.
4. Record what happened in the console (Incidents) and in `docs/DECISIONS.md` if the procedure changed.

## Export

Console > Export everything, after "Confirm with passkey". The zip's `manifest.json` lists each file with a sha256 (`sha256sum -c` style checks work after unzipping). Passkeys, connector grants and live classroom data are never included.
