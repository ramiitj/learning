# Runbook: deploying the platform

Who: the creator, or someone working with the creator present. Time: about two hours for the first deploy, then minutes for each later one.

Nothing in this runbook may be applied to production without the creator's explicit approval (CLAUDE.md). Steps that need that approval are marked **[creator approves]**.

Sources this runbook follows: `infra/terraform/*.tf`, `apps/web/vercel.json`, `apps/web/package.json`, `apps/web/.env.example`, `.github/workflows/*.yml`. If any of them changes, update this file in the same commit.

## 0. What gets deployed

| Piece | Where | Defined in |
|---|---|---|
| Web app, Creator Console (`/console`), API, MCP connector (`/api/mcp`) | Vercel, functions in `bom1` (Mumbai) | `infra/terraform/main.tf` (`vercel_project.web`), `apps/web/vercel.json` |
| PostgreSQL 17 with 7 days of point-in-time restore | Neon, `aws-ap-south-1` (Mumbai); branches `production` and `preview` | `infra/terraform/main.tf` (`neon_project.main`, `neon_branch.preview`) |
| Scheduled jobs | Vercel Cron | `apps/web/vercel.json` (`crons`) |
| CI, backups, restore test, agent benchmarks, lesson packs | GitHub Actions | `.github/workflows/` |

## 1. Prerequisites

### Accounts

1. **GitHub**: the repository (`var.github_repo`, default `ramiitj/learning`). The creator's account should own it, with two-factor authentication on.
2. **Vercel**: a team or personal account connected to that GitHub repository (Vercel's GitHub app installed for the repository). See the plan note in section 6.
3. **Neon**: an account. The project is created by Terraform.
4. **Anthropic** (optional, only for the agent pipeline): a Claude API key.
5. **Somewhere private to keep Terraform state** (section 2). State contains database passwords and secrets.

### Tools on the creator's computer

Node.js 22, pnpm 10 (`corepack enable`), Terraform 1.10 or newer (needed for S3 state locking, see section 2; the code itself needs 1.6 or newer), and `git`. For backups also `age` (see `docs/runbooks/backup-restore.md`).

### Secrets and settings

Values marked *generated* are created by Terraform; you do not choose them.

**Vercel project environment variables** (set by Terraform unless noted):

| Name | Environments | What it is for | Source |
|---|---|---|---|
| `DATABASE_URI` | production | Connection string for the Neon `production` branch | generated (`neon_project.main.connection_uri`) |
| `DATABASE_URI` | preview | Connection string for the shared Neon `preview` branch: the fallback for any pull request whose own branch does not exist yet | generated (`local.preview_database_url`) |
| `DATABASE_URI` | preview, one per git branch | Connection string for that pull request's Neon branch `pr-<number>` | set and deleted by `.github/workflows/preview-db.yml` (section 5) |
| `PAYLOAD_SECRET` | production, preview | Signs CMS tokens, creator sessions, preview links | generated (48 characters) |
| `APP_ORIGIN` | production | The public origin, e.g. `https://learn.example.in`. Passkeys, preview links, LTI and the MCP connector are bound to it. Previews do not need it: they use `https://$VERCEL_BRANCH_URL`. In production without it, passkey sign-in and the MCP connector refuse to work (503) instead of guessing (`apps/web/src/auth/origin.ts`) | you set `app_origin` |
| `CRON_SECRET` | production, preview | Vercel Cron sends it as `Authorization: Bearer ...` to `/api/cron/purge` and `/api/pipeline/tick`; without it both refuse | generated (40 characters) |
| `CREATOR_SETUP_TOKEN` | production | One-time token to create the creator account and first passkey. Once a creator exists the app refuses it for good (logged `auth.setup-refused`); remove it anyway with `creator_setup_enabled = false` (section 4) | generated while `creator_setup_enabled` is `true` |
| `ANTHROPIC_API_KEY` | production | The agent pipeline. Leave empty to run without agents (`/api/pipeline/tick` then answers 503 "pipeline is off") | you set `anthropic_api_key` (optional) |
| `ALERT_WEBHOOK_URL` | production | Optional. Receives a short text with no learner data when a new error appears or errors spike | you set `alert_webhook_url` (optional, sensitive) |
| `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_BRANCH_URL` | all | Tell the app it is on a preview and its address | set by Vercel (`automatically_expose_system_environment_variables = true` in Terraform) |
| `VERCEL_GIT_COMMIT_SHA` | all | Recorded as the release on each error | set by Vercel automatically |

Other optional features being added in Phase 6 (LTI, xAPI) have their own variables, off by default; check `apps/web/.env.example` before deploying and do not turn them on without the creator's decision.

**Terraform inputs** (`infra/terraform/variables.tf`), passed with `-var` or a `terraform.tfvars` file that is never committed (`*.tfvars` holding secrets must stay out of git):

| Variable | Required | Meaning |
|---|---|---|
| `app_origin` | yes | Public origin, e.g. `https://learn.example.in` |
| `github_repo` | no (default `ramiitj/learning`) | Repository Vercel deploys from |
| `vercel_team` | no | Vercel team slug or id |
| `anthropic_api_key` | no (sensitive) | Claude API key |
| `alert_webhook_url` | no (sensitive) | https webhook for error alerts; empty for none |
| `creator_setup_enabled` | no (default `true`) | Creates `CREATOR_SETUP_TOKEN`. Set to `false` after the creator's passkey exists |

**Provider credentials** (shell environment while running Terraform, never stored in files): `VERCEL_API_TOKEN` (Vercel account settings, Tokens) and `NEON_API_KEY` (Neon account settings, API keys).

**GitHub repository secrets** (Settings, Secrets and variables, Actions):

| Secret | Used by | What it is for |
|---|---|---|
| `BACKUP_DATABASE_URL` | `backup.yml` | Read-only connection string to the production database (a read-only Neon role is best) |
| `BACKUP_AGE_RECIPIENT` | `backup.yml` | age **public** key that encrypts backups |
| `BACKUP_AGE_IDENTITY` | `restore-test.yml` | age **private** key, only if the creator chooses unattended monthly restore tests (trade-off in `docs/runbooks/backup-restore.md`) |
| `ALERT_WEBHOOK_URL` | `backup.yml`, `restore-test.yml` | Optional: told when a backup or restore test fails |
| `ANTHROPIC_API_KEY` | `agent-benchmarks.yml` | Optional: live agent benchmarks; without it they are skipped with a warning |

| `NEON_API_KEY` | `preview-db.yml` | Creates and deletes the `pr-<number>` Neon branches. A project-scoped key is enough |
| `NEON_PROJECT_ID` | `preview-db.yml` | `terraform output neon_project_id` |
| `VERCEL_TOKEN` | `preview-db.yml` | Sets and deletes the per-branch preview `DATABASE_URI`. Scope it to the one team or project |
| `VERCEL_PROJECT_ID` | `preview-db.yml` | `terraform output vercel_project_id` |

Repository *variable* (not secret) `VERCEL_TEAM_ID` if the Vercel project belongs to a team. Without the four `preview-db.yml` secrets that workflow skips itself with a notice and previews share the `preview` branch.

`ci.yml` and `lesson-pack.yml` need no secrets.

## 2. Terraform state backend **[creator decides once]**

`infra/terraform/main.tf` has `# backend "s3" {}` commented out: the backend must be chosen before the first `apply`, because state holds the database password and every generated secret.

| Option | Cost | Risk | Reversibility | Notes |
|---|---|---|---|---|
| **A. S3 bucket in `ap-south-1` (Mumbai)**, versioning on, encryption on, public access blocked, `use_lockfile = true` | A few rupees a month; needs an AWS account | Low; secrets stay in India; versioning recovers a bad apply | `terraform init -migrate-state` moves it later | Recommended. Needs Terraform 1.10+ for lockfile locking |
| B. HCP Terraform (free tier) | Free; another account | Low; state stored outside India (secrets only, no learner data) | `-migrate-state` | Least setup; runs can be remote |
| C. Local state on the creator's computer, backed up encrypted | Free | Losing the file means re-importing every resource; no locking | Easy to move to A or B later | Acceptable only while one person ever applies |

For option A, replace the comment with:

```hcl
backend "s3" {
  bucket       = "<your-bucket>"
  key          = "learning-magazine/terraform.tfstate"
  region       = "ap-south-1"
  encrypt      = true
  use_lockfile = true
}
```

and change `required_version` to `">= 1.10"`. That edit is an infrastructure change: record the choice in `docs/DECISIONS.md`.

## 3. Plan and apply **[creator approves the apply]**

```bash
cd infra/terraform
export VERCEL_API_TOKEN=...   NEON_API_KEY=...
terraform init
terraform plan -var 'app_origin=https://learn.example.in' -out tfplan
```

Read the plan with the creator. Expect: one Neon project (`aws-ap-south-1`, PostgreSQL 17, 7-day history), one `preview` branch and endpoint, one Vercel project (root `apps/web`, region `bom1`), and the environment variables in section 1. Stop if anything shows a region other than Mumbai.

```bash
terraform apply tfplan
terraform output database_region            # must print aws-ap-south-1
```

For alerts, pass `-var 'alert_webhook_url=https://...'` (or put it in the uncommitted `terraform.tfvars`).

## 4. First deploy, migrations and the creator account

### Deploy

The Vercel project deploys from GitHub: every push to `main` is a production deployment, every pull request a preview. To start the first one, push to `main` or press Redeploy in Vercel.

Migrations run **inside every build**: the build command (both `apps/web/vercel.json` `buildCommand` and Terraform's `build_command`) is

```
pnpm --filter @lm/web cms:migrate && pnpm --filter @lm/web build
```

`cms:migrate` is `payload migrate`, which applies `apps/web/src/cms/migrations/*` to the database in `DATABASE_URI`. If a migration fails, the build fails and the previous deployment stays live. Production never uses schema auto-push (`push` is off when `NODE_ENV=production`, `apps/web/src/cms/payload.config.ts`).

Check after the build:

1. Vercel build log shows the migrations applied and `next build` finishing.
2. `https://<origin>/en` loads (it shows the cover; with no published lessons it is nearly empty).
3. Vercel, Settings, Functions: region `bom1`.

### Create the creator account and register a passkey

1. Read the token: `terraform output -raw creator_setup_token`.
2. On the creator's own device open `https://<origin>/console`, choose **First time? Set up the creator account**, enter your name and the token, and follow the browser's passkey prompt (Touch ID, Windows Hello, a phone or a security key). Only one creator can be created this way; the token does nothing once a creator exists.
3. Add a second passkey straight away: console, **Your passkeys** (`/console/passkeys`), "Confirm with passkey" at the top right, then **Add another passkey**. Keep one that syncs (iCloud Keychain, Google Password Manager) and a hardware security key, so losing one device does not lock you out. The page lists each passkey's name, when it was added and last used, and lets you rename or remove one (removing needs a fresh confirmation; the last one cannot be removed).
4. **Remove the setup token** **[creator approves]**: `terraform apply -var 'creator_setup_enabled=false' ...` deletes the token and the Vercel variable; redeploy. The app already refuses the token once a creator exists (each try is logged `auth.setup-refused`), so this is defence in depth.
5. In the console, open the event log and check for `auth.creator-created`, `auth.passkey-added` and `auth.signed-in`.

### Import content as drafts

The repository's content is imported into the CMS **as drafts** by default:

```bash
cd apps/web
DATABASE_URI='<production connection string from the Neon console>' PAYLOAD_SECRET='<the same value as in Vercel>' NODE_ENV=production pnpm cms:import
```

Sensitive Vercel variables cannot be read back, so take the connection string from the Neon console and `PAYLOAD_SECRET` from Terraform state (`terraform state show random_password.payload_secret`). Run this from the creator's computer, not CI. It is idempotent and every write is in the event log. It also registers the agents from `platform/agents` and their agent users.

Do **not** use `PUBLISH=1` or `--publish` against production: that publishes everything, and publishing is always the creator's act in the console, lesson by lesson, after preview.

## 5. Preview deployments

- Every pull request gets a Vercel preview deployment, and (once its secrets are set) `.github/workflows/preview-db.yml` gives it its own Neon branch `pr-<number>`, copied from production when the pull request opens: the workflow runs the migrations on it and sets a preview `DATABASE_URI` for that git branch in Vercel. Closing the pull request deletes both. **Untested until the Neon and Vercel credentials exist**: try it on a throwaway pull request first and watch the workflow log.
- The very first preview build of a new pull request can start before the workflow has set the variable; that build uses the shared `preview` branch. Push again or press Redeploy once the workflow is green.
- A `pr-<number>` branch is a copy of production: it holds what production holds (no learner personal data in v1, but classroom sessions and anonymous totals), stays in `aws-ap-south-1`, and is deleted when the pull request closes.
- Previews work out their own address from `VERCEL_BRANCH_URL` (stable per git branch). Passkeys are bound to that host, so signing in on a preview needs a passkey registered on that preview, and the preview database's creator. Most preview checks need no sign-in (lessons, preview links).
- Draft lessons are viewed through signed preview links (valid 72 hours, one lesson each). They come from the agent pipeline's creator-preview step, the decision queue in the console, or the MCP tool `get_preview_link`. A preview link only opens the lesson it was made for.
- Vercel Cron does not call preview deployments, so the purge and pipeline jobs run only in production.

## 6. Scheduled jobs

Configured in `apps/web/vercel.json` (`crons`), run by Vercel Cron in production only. Vercel sends `CRON_SECRET` automatically; without it the routes answer 403.

| Path | Schedule (UTC) | What it does |
|---|---|---|
| `/api/cron/purge` | `30 21 * * *` (03:00 IST) | Deletes classroom sessions older than 30 days (`docs/03`), logs `retention.classroom-purge` |
| `/api/pipeline/tick` | `* * * * *` (every minute) | Advances the oldest active agent pipeline run by one step; idle with 503 if `ANTHROPIC_API_KEY` is not set |

GitHub Actions schedules: `backup.yml` daily at 21:00 UTC (02:30 IST), `restore-test.yml` at 22:00 UTC on the 1st of each month.

Plan note: Vercel's Hobby plan limits cron jobs (at the time of writing, to once a day) and is for non-commercial use, so the every-minute pipeline tick and a school pilot need a paid plan. Check Vercel's current limits before choosing the plan **[creator decides]**.

## 7. Rollback

**Application** (minutes): Vercel, Deployments, pick the last good production deployment, **Instant Rollback** (or Promote to Production). This changes the code only, not the database.

**Database** (Neon point-in-time restore, last 7 days):

1. If the bad deployment ran a migration, rolling the code back is not enough: the old code may not match the new schema.
2. In the Neon console, restore the `production` branch to a time just before the bad deploy (Neon creates a backup branch of the current state first, so nothing is lost), or create a branch at that time and point `DATABASE_URI` to it.
3. Roll back the app to the matching deployment.
4. Everything written after the restore point (lesson edits, events, classroom sessions) is no longer in the live database; it is still in the backup branch. Tell the creator what was lost.

Both steps are **[creator approves]**. For older points in time use the daily encrypted backups (`docs/runbooks/backup-restore.md`). Record every rollback as an incident (`docs/runbooks/incident-response.md`).

## 8. Custom domain and HTTPS

1. Vercel, Project, Settings, Domains: add the domain (e.g. `learn.example.in`). Vercel shows the DNS records (an `A` record for an apex domain, a `CNAME` for a subdomain). Add them at the domain registrar.
2. Vercel issues and renews the HTTPS certificate itself once DNS resolves.
3. Set `app_origin` to `https://learn.example.in` and `terraform apply` **[creator approves]**, then redeploy.
4. **Choose the final domain before creating the creator's passkey.** Passkeys are bound to the hostname in `APP_ORIGIN`; changing the domain later means registering passkeys again and re-approving MCP connectors. The setup token cannot be reused for that (it is closed for good once a creator exists), so a domain change needs the account recovery procedure, which does not exist yet (Gaps, 13).

## 9. Pre-launch checklist

Each item needs evidence (a link, a screenshot, a CI run) before the creator approves launch.

- [ ] CI green on `main`: lint, typecheck, unit and accessibility tests, content validation, end-to-end with axe (WCAG 2.2 AA), offline, slow 3G, live class (`ci.yml`).
- [ ] Manual WCAG 2.2 AA checks on every lesson to be published: keyboard only, a screen reader (TalkBack on Android, NVDA or VoiceOver), 200% zoom and text spacing, projection in classroom mode.
- [ ] A real low-end Android phone on a slow connection opens each lesson and works offline after first load.
- [ ] Hindi and Telugu: a native-speaker review for every published lesson, with `localeStatus` set to `reviewed` by the reviewer. Until then pages show the draft-translation notice.
- [ ] Every lesson to be published passed the pipeline's reviews and has a teacher guide and parent page.
- [ ] Budget set in the console (Oversight, Budget: monthly limit and alert level), and the matching spending limits set in the Anthropic, Vercel and Neon dashboards.
- [ ] `ANTHROPIC_API_KEY` set if agents are to run, with a spend limit on the Anthropic side.
- [ ] Backups: `BACKUP_DATABASE_URL` and `BACKUP_AGE_RECIPIENT` set, the Backup workflow run once by hand and its artifact present, the private key stored offline, a restore test passed.
- [ ] `ALERT_WEBHOOK_URL` set in Vercel and GitHub, and tested (it should receive a message).
- [ ] `creator_setup_enabled = false` applied (no `CREATOR_SETUP_TOKEN` in Vercel); **Your passkeys** lists at least two passkeys (one synced, one hardware key).
- [ ] Custom domain on HTTPS, `APP_ORIGIN` matches it.
- [ ] Consent and ethics approval for the pilot in place (`docs/11`, `docs/14` Phase 6).
- [ ] `terraform output database_region` is `aws-ap-south-1`; Vercel functions are in `bom1`.

## 10. Never without the creator's approval

- `terraform apply` or `terraform destroy`, or any change to the Vercel or Neon projects, regions, plans or environment variables.
- Deploying to production (merging to `main` deploys) or promoting, rolling back or deleting a deployment.
- Publishing, unpublishing or deleting any lesson; running `cms:import` with `PUBLISH=1`.
- Running migrations by hand against production, restoring the database, or resetting a Neon branch.
- Creating, rotating or deleting secrets (`PAYLOAD_SECRET` rotation signs everyone out and invalidates preview links), or adding users or MCP connectors.
- Turning on anything that changes data handling (LTI, xAPI, analytics changes, new data collection).
- Distributing an offline lesson pack to schools.
- Changing the domain.

## Gaps for a real deploy

Missing or inconsistent things found in the repository, listed rather than worked around. Closed ones are kept, struck through, with where they were closed.

1. **No Terraform state backend** is configured (section 2): a decision for the creator.
2. ~~`APP_ORIGIN` is not set for preview deployments.~~ **Closed 2026-10-15.** One helper (`apps/web/src/auth/origin.ts`) decides the origin for passkeys (and the WebAuthn rpID), OAuth and MCP metadata, LTI, preview and invitation links: `APP_ORIGIN`, else `https://$VERCEL_BRANCH_URL` on a preview, else localhost in development only. Production without `APP_ORIGIN` refuses passkey ceremonies with a 503 explaining what to set. Tests: `apps/web/src/auth/origin.test.ts`, `passkey-api.test.ts`.
3. ~~`ALERT_WEBHOOK_URL` is not managed by Terraform.~~ **Closed:** optional sensitive variable `alert_webhook_url`. The GitHub secret of the same name (backup workflows) is still set by hand.
4. ~~One shared Neon `preview` branch for all pull requests.~~ **Closed in code, untested:** `.github/workflows/preview-db.yml` (section 5). It has not run against real Neon and Vercel accounts; it uses only documented endpoints (Neon API v2 branches and connection_uri; Vercel v10/v9 project env). `actionlint` 1.7.7 passes; shell scripts were not run through shellcheck.
5. ~~`CREATOR_SETUP_TOKEN` is recreated by every apply.~~ **Closed:** `creator_setup_enabled` (default `true`); set it to `false` after setup. Independently the app refuses the token for good once a creator exists or `auth.creator-created` is in the event log.
6. **No read-only database role in Terraform, by design.** The `kislerdm/neon` provider (0.18) can create roles but not grant privileges, and Neon makes every API-created role a member of `neon_superuser`. Make the role once with SQL: `docs/runbooks/backup-restore.md`, "A read-only role for backups".
7. **No spend limits as code**: Vercel, Neon and Anthropic limits are set by hand in each dashboard.
8. **Vercel plan**: the every-minute cron needs a paid plan (section 6).
9. **Migrations for Phase 6 collections** are being generated at the end of the phase. Before the first deploy, check that `apps/web/src/cms/migrations/` covers every collection in `payload.config.ts` (`payload migrate:status` against a scratch database). This now includes the new `users.passkeys` fields `addedAt` and `lastUsedAt`.
10. **No staging environment** separate from previews; the first deploy of each migration to a database holding real data happens in production.
11. ~~Lesson packs are built from the repository only.~~ **Closed:** `pnpm pack:lessons --from-cms` builds from what is published in the CMS (`docs/runbooks/lesson-packs.md`). The default is still the repository.
12. ~~No console button to add a second passkey.~~ **Closed:** console, **Your passkeys** (section 4). The console's import map must be regenerated (`payload generate:importmap`) for the new view to load.
13. **No account recovery path.** With the setup token closed for good, a creator who loses every passkey cannot get back in without database access. A recovery procedure is proposed in `docs/DECISIONS.md` (2026-10-15, deploy gaps) and awaits the creator. Until then keep at least two passkeys.
