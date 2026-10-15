# Runbooks

Step-by-step procedures for running the platform. Each one says who does it, what needs the creator's approval, and where the configuration it relies on lives. When the configuration changes, update the runbook in the same commit.

| Runbook | Use it when |
|---|---|
| [deploy.md](deploy.md) | Setting up hosting for the first time, deploying, previews, scheduled jobs, rolling back, adding a domain, the pre-launch checklist |
| [backup-restore.md](backup-restore.md) | Setting up backups, the monthly restore test, restoring data, exporting everything |
| [incident-response.md](incident-response.md) | A problem is reported, an error alert arrives, or something is wrong in a lesson |
| [lesson-packs.md](lesson-packs.md) | Building, checking and running an offline lesson pack for a school without reliable internet |

Rules that apply to all of them: nothing is published, deployed to production, deleted, or changed in schema, permissions or learner-data handling without the creator's explicit approval (`CLAUDE.md`), and every creator and agent action is written to the event log.
