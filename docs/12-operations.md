# 12 — Operations

## Editorial rhythm

The platform publishes in themed **issues**. The home screen is the current issue's cover. An editorial calendar in the console plans issues ahead; a sustainable pace for a sole author in v1 is one module every one to two weeks. Learners return because there is something new and interesting, not because of reminders.

## Measuring learning

Each module has a short pre-check and post-check mapped to its objectives. The Learning Analytics agent reports learning gains, misconceptions (which predictions are most often wrong, and whether they are corrected by the end), completion, drop-off points, detour and depth-dial usage, and hint usage, per lesson and per locale. Time on screen is reported as context, never as a goal.

## Continuous improvement

The Analytics agent proposes revisions; the Feedback Triage agent routes learner and teacher reports into content errors, bugs and suggestions; the Freshness Auditor reviews AI lessons each quarter and flags outdated content. All three feed the orchestrator's revision queue. Experiments that compare versions of a lesson are allowed only for design choices that pose no risk to learners, and are approved by the creator.

## Teachers

Every module has a teacher guide: objectives, timing for a 40-minute period, how to run classroom mode, discussion prompts, common misconceptions and how to respond, and a no-device alternative. A short orientation lesson teaches teachers to use classroom mode.

## Parents

A simple parent page for each module explains what their child explored and suggests a conversation or activity at home. It requires no data about the child.

## Sharing

In v1, learners can share what they built only within their classroom session. Nothing is public.

## Distribution

Pilot schools first. Lessons are tagged to curriculum objectives so teachers can place them in their plans. LTI and xAPI support follows in Phase 5; DIKSHA alignment is explored after. Offline lesson packs are available for schools with poor connectivity: a zip of published lessons that runs on one computer with Node.js and serves the school network (`pnpm pack:lessons`, `docs/runbooks/lesson-packs.md`). Giving a pack to a school is a publication and needs the creator's approval.

Deploying, rolling back and the pre-launch checklist are in `docs/runbooks/deploy.md`.

## Brand and identity

The platform needs a name and visual identity that work across ages, languages and scripts. If a mascot is used, it belongs to the school audience theme, not the platform brand, so adult audiences are not put off later.

## Budget

The creator sets a monthly budget covering agent API usage, hosting, real-time services, video and storage. The console shows spend against it by category.

## Backups and export

Daily automated backups, monthly restore test, full export available from the console at any time.

Neon keeps 7 days of point-in-time restore. On top of that, a GitHub Actions workflow takes an encrypted `pg_dump` every day at 02:30 IST (kept 35 days) and a monthly workflow restores the latest one into a scratch database and checks it. "Export everything" (console, `/api/export`) gives the creator every collection, the globals, `platform/`, `docs/` and `schemas/` as JSON and Markdown with a checksum manifest, without credentials. Steps: `docs/runbooks/backup-restore.md`.

## Error monitoring

Errors are recorded in our own database, grouped by fingerprint, with no third-party tracker on children's content. A new fingerprint, or 20 of the same in 10 minutes, opens an "incident" decision for the creator and pings the optional `ALERT_WEBHOOK_URL`. Recent errors are on the console Overview. Steps: `docs/runbooks/incident-response.md`.
