# Runbook: offline lesson packs

For schools without reliable internet (`docs/03`, `docs/12`): a zip that runs the lessons from one computer, and lets other devices on the school network join. No internet, database or account is needed, and the pack collects nothing.

Handing a pack to a school is a publication: **only the creator decides it**.

## Build

```bash
pnpm pack:lessons                              # published lessons only
pnpm pack:lessons --include every-primitive    # test pack: adds named lessons whatever their status
DATABASE_URI='<read-only connection string>' pnpm pack:lessons --from-cms   # what is published in the CMS
```

`--from-cms` reads, in one READ ONLY transaction, the published lessons, detours, glossary and teacher guides from the database in `DATABASE_URI` (use the read-only backup role, `docs/runbooks/backup-restore.md`). It mirrors what the live site shows: lessons and teacher guides only from the CMS, a detour missing from the CMS taken from the repository, the CMS glossary when it has entries. Lessons from the CMS are marked `published` in the pack whatever their JSON `status` says, and `manifest.json` records `"source": "cms"`. Ids from the database that are not plain lowercase ids stop the build. `--include` cannot be combined with it. The database connection is used only to read content; the build itself and the pack never see `DATABASE_URI`.

Output: `dist/lesson-pack-<date>.zip` and `dist/lesson-pack-<date>.zip.sha256`. A pack with any unpublished lesson is named `...-test.zip` and its README says "TEST PACK, do not give to schools". With no published lessons and no `--include`, the build stops with a message.

Other options: `--out <dir>`, `--work <dir>` (where the build copy goes, default a temporary folder), `--keep-work`, `--reuse-work` (rebuild from the copy already in `--work`).

In GitHub: Actions, **Lesson pack**, Run workflow (also runs on each published release). The zip is a workflow artifact kept 30 days; the workflow never attaches it to a release.

## How it is built (`scripts/ops/build-pack.ts`)

1. Lessons are chosen from `content/lessons/*.json` by their `status` field (`published`), plus `--include`; with `--from-cms`, from what is published in the CMS, staged over a copy of `content/`.
2. The repository's tracked and untracked, not-ignored files are copied to a work folder. The build never touches `apps/web/.next` (so it can run beside `pnpm dev`) and never copies `.env` files.
3. In the copy, `content/lessons` and `content/teacher-guides` are cut down to the chosen lessons, and the routes that need a database or the creator are removed: `/console`, `/api/*`, `/oauth/*`, `/.well-known/*` are plain 404s in a pack.
4. `pnpm install` with a flat (`hoisted`) `node_modules`, so the pack holds real files and unzips on Windows; then `next build` with `LM_PACK=1` (`output: "standalone"`, only for this build) and no `DATABASE_URI`.
5. The standalone server, `.next/static`, `public`, `content`, `launch.cjs`, `start.sh`, `start.cmd`, `README.txt` (English with short Hindi and Telugu notes) and `manifest.json` (lesson ids, versions, locales, locale review status, and the SHA-256 of every file) are zipped.

## Run (what the README tells schools)

Install Node.js 22 LTS once, unzip, then `start.cmd` (Windows) or `./start.sh` (macOS, Linux). The server listens on port 8080 on every network interface and prints the addresses to open, e.g. `http://192.168.1.20:8080/`. `PORT=9000` changes the port; `LM_PACK_HOST=127.0.0.1` keeps it to the one computer. The launcher removes `DATABASE_URI` from its environment, so a pack never connects to a database even on a computer that has one.

What works: cover, every lesson in personal and classroom mode in en, hi and te, teacher guides, parent pages, component preview. Classroom votes use show of hands (no class codes or phone voting). Analytics, problem reports, the console and the MCP connector are not in a pack.

## Check a pack before giving it out

1. `sha256sum -c lesson-pack-<date>.zip.sha256`
2. Unzip into an empty folder, start it, open `/en`, a lesson, its `/classroom` page in each locale, and `/teach` and `/parents`.
3. From a phone on the same network, open the printed address.
4. Read `manifest.json`: every lesson is `published`, the versions are the ones the creator approved, and Hindi and Telugu say `reviewed` where the school will use them.

## Limits

- Student devices only work while the pack computer is running. The service worker that makes the online site work offline needs HTTPS (or `localhost`), which a school network address is not.
- Built and tested on Linux. The pack holds no symlinks, and the parts a pack uses are plain JavaScript, but it has not yet been tried on Windows or macOS.
- About 30 MB zipped, mostly the Next.js server and libraries that are traced but not used offline (Payload, the Postgres driver). Trimming them is possible later with `outputFileTracingExcludes` in pack mode.
- By default the lesson set comes from the repository's `content/` folder; use `--from-cms` once lessons are published in the CMS. A published CMS lesson that no longer passes the current validator stops the build (the pages are prerendered and validated): seen on 2026-10-15 with the CI database, whose published m4 and m5 predate the current schema. Re-publish such lessons before packing.
- The GitHub workflow builds from the repository only; it has no database secret.
