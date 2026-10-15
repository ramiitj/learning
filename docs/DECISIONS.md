# Decisions

Every decision that changes the specification is recorded here with its date and reason. Newest first. Decisions marked **creator** were made by the creator; **engineering** decisions are within the build team's remit and can be reversed by the creator at any time.

---

## 2026-10-15 — LTI 1.3 launch and xAPI statements: built off by default, awaiting the creator

**Engineering** (docs/03 "Interoperability and distribution", docs/11; reversible by the creator). LTI 1.3 launch and xAPI statements to a school's LRS were built behind `LTI_ENABLED=1` and `XAPI_ENABLED=1`, both unset everywhere, because they change how data can leave the platform (always-ask: `learner-data-change`). Launches read only the issuer, audience, nonce, version, message type, deployment, roles and the `lesson`/`mode`/`locale` custom parameters; identity claims are dropped unread and the event log records only the platform and lesson. xAPI statements use an anonymous actor (site origin plus a random per-tab-session UUID) and go only to the launching school's LRS. LMS registrations (`lti-platforms`) are creator-only and need a fresh passkey confirmation. Nothing is enabled until the creator decides, after legal review of the DPDP Act 2023 implications: see `docs/proposals/lti-xapi.md` for the data flows, the options and the open decisions.

## 2026-10-15 — Offline lesson packs and the deployment runbook

**Engineering** (docs/03 "Interoperability and distribution", docs/12 "Distribution"; reversible by the creator). Lesson packs are already in the approved architecture; this records how they are built. Nothing here collects or moves learner data.
1. **A pack is the Next.js standalone server, not a static export.** `pnpm pack:lessons` (`scripts/ops/build-pack.ts`) builds with `output: "standalone"` only when `LM_PACK=1`; normal and Vercel builds are unchanged. *Alternatives:* a static export (smallest, opens from any web server, but teacher guides and parent pages are dynamic routes and the app uses a proxy, so it would need page changes across the app; and it still needs a server for other devices to join); a Docker image (one command, but schools rarely have Docker and it is heavy on low-end laptops). The standalone server needs only Node.js 22 and serves the same pages as the site.
2. **Files-only mode.** The pack build and its launcher remove `DATABASE_URI`, so lessons come from `content/`, classroom votes use show of hands and analytics are off. The console, `/api/*`, `/oauth/*` and `/.well-known/*` are removed from the pack build, so they are plain 404s: no route can try to reach a database on a school computer, and the pack has no sign-in surface.
3. **Built in a copy of the repository.** Tracked and untracked, not-ignored files are copied to a work folder, so the build never collides with a running dev server's `.next` and never includes `.env` files. *Alternative:* a separate `distDir` in place; rejected because pruning lessons and routes would then have to happen in the working tree.
4. **Only published lessons by default**, read from each lesson's JSON `status`. `--include` adds others for testing and marks the pack `-test` with a warning in its README. The manifest lists lesson ids, versions, locales, locale review status, the git commit and a SHA-256 for every file.
5. **Flat `node_modules` in the pack** (`node-linker=hoisted` in the build copy only), so the zip contains no symlinks and can unpack on Windows.
6. **Listens on every network interface (port 8080)** so other devices on the school network can join; `LM_PACK_HOST=127.0.0.1` limits it to one computer.
7. **The GitHub workflow uploads packs as artifacts only.** Giving a pack to a school is a publication and stays the creator's act.
8. **Deployment runbook** (`docs/runbooks/deploy.md`) written from the Terraform, Vercel and workflow files, with the gaps found listed rather than worked around.

**Awaiting the creator's decision:**
- *Terraform state backend* (runbook section 2). Options: an S3 bucket in `ap-south-1` (recommended: secrets stay in India, versioned, small cost, needs an AWS account), HCP Terraform (free, least setup, state outside India), or local state (free, no locking, risk of loss).
- *Vercel plan:* the every-minute pipeline cron and a school pilot need a paid plan.
- *Whether and when packs go to pilot schools*, and whether packs should later be built from the CMS rather than the repository.
- *The Hindi and Telugu notes in the pack README* are drafts awaiting native-speaker review.

---

## 2026-10-15 — Reliability and ownership: export, backups, error monitoring, incident reports

**Engineering** (docs/03 "Reliability and ownership", docs/11 incident response; reversible by the creator):
1. **Export everything** is a console view (`/console/export`) and `GET /api/export`, creator-only and within five minutes of a passkey confirmation. It streams a zip: every collection as JSON (drafts and published, plus all lesson versions), globals (with constitution and autonomy history), `platform/`, `docs/` and `schemas/`, and a `manifest.json` with counts and a sha256 per file. Left out on purpose: passkeys and other sign-in material, connector grants, classroom sessions and votes (ephemeral learner activity), and media binaries (metadata is included). Analytics are daily totals already. `export.created` goes to the event log.
2. **A 90-line zip writer instead of a library.** The route holds all of the creator's data, so it carries no extra dependency; `node:zlib` supplies deflate. Archives needing zip64 are refused rather than corrupted.
3. **Backups.** Daily encrypted `pg_dump` (age) as a GitHub Actions artifact, 35 days; monthly automated restore test. *Trade-off for the creator:* the restore test needs the age private key as a repository secret (`BACKUP_AGE_IDENTITY`), so anyone with admin on the repository could decrypt backups. The alternative is to keep the key offline and run `scripts/ops/restore.sh` by hand each month; delete the secret and the workflow will then fail loudly, which is the intended reminder. Neon's 7-day point-in-time restore remains the first line of defence.
4. **Self-hosted error monitoring.** `instrumentation.ts` (server) and `instrumentation-client.ts` (browser, at most five reports per page load) post scrubbed text (no emails, numbers or query strings) to our own `errors` collection. A new fingerprint or 20 in 10 minutes opens a Decision of a new kind, `incident`, and pings the optional `ALERT_WEBHOOK_URL`. The new Decisions option and the `errors` and `incidents` collections need a migration.
5. **Incident reporting.** "Report a problem" at the end of every lesson (personal and classroom) posts to `/api/report`, which limits by an in-memory salted hash of the address (5 per hour) and creates a `feedback` document. The `incidents` collection is creator-only; a serious incident with no "schools informed at" date after 48 hours shows a warning above the list. One-click unpublish is Payload's built-in Unpublish on the lesson, verified by a test (it is logged as `lessons.unpublish` and learners stop seeing the lesson at once).
6. **Hindi and Telugu strings for the report form (namespace `report`) are best-effort drafts and need native-speaker review.**

---

## 2026-10-15 — Phases 4–5: orchestrator, console modules, simulations, analytics, modules

**Engineering** (within the approved Phases 2–6 build; reversible by the creator):
1. **The pipeline runs as a step machine (`packages/orchestrator`).**
   - Stages follow `docs/09`: plan → draft → analogies → compose → localise → review → revise → localise the changed strings only → re-review → resolve → teacher guide → creator preview.
   - A cron tick advances one step per run, and each step is one agent call under that agent's own CMS permissions.
   - A run pauses when the budget reaches its alert level, when an agent it needs is switched off, or when a flag survives revision. An urgent run continues past the alert level, but never past the limit.
   - It never publishes. It ends with one publish decision for the creator.
2. **One component catalogue (`packages/catalogue`) feeds the validator, the CMS, the MCP server and the web app**, so there is no second list of components to drift.
3. **The six AI simulations are plugins in `packages/sim-ai`**: train-classifier, pixel-grid, next-word-model, layer-builder, dilemma-vote and hillside.
   - Each has a contract (config schema, string keys, live vote shape) and personal and classroom variants.
   - A learning-experience review found 8 blocking issues, all of which were fixed. The review report is kept with the session notes.
4. **Analytics are anonymous daily totals.**
   - Rows are keyed by day, lesson, locale, mode, metric and key, with no identifiers or timestamps.
   - The browser sends nothing when Do Not Track or Global Privacy Control is on.
   - The console hides counts under 5.
   - Learning gain needs the pre-check display decision (deferred item 2 from 2026-09-24).
5. **Teacher guides and parent pages are public pages per lesson** (`/lessons/<id>/teach`, `/lessons/<id>/parents`). They show English with a notice until a guide is translated. The parent page collects nothing.
6. **The six modules (`docs/13`) were drafted through the pipeline roles** by the build team's agents.
   - They are drafts: Hindi and Telugu need native-speaker review, and the creator publishes.
   - `examples/m1-how-do-machines-learn.json` now matches the current train-classifier shape.

*For the creator's decision:*
- **Pre-checks:** whether learners see them, which is needed to measure learning gain.
- **Agent profiles:** adding a "Rubric:" line to each profile in `platform/agents/`.
- **`platform/config/permissions.json`:** approval of the agent permissions.
- **Hillside in classroom mode:** live votes currently accumulate across steps. Per-step votes need a per-item vote concept in the live classroom.

## 2026-10-15 — Phases 2–6: live classroom, CMS, connector, creator sign-in

**Creator**, asked to "build a full-fledged full-stack application":
- **Live classroom sync:** Postgres in Mumbai with Server-Sent Events and a polling fallback. No third-party real-time service, so data stays in India. This replaces the "managed WebSocket service" in `docs/03`.
- **Classroom data:** kept for 30 days, then deleted. It holds no personal information: no names, accounts or device identifiers, only a hash of a random per-session token.
- **Creator sign-in:** passkeys only (WebAuthn). No passwords exist. The first passkey needs a one-time setup token from the server. Publishing and other always-ask decisions need a passkey confirmation from the last five minutes.

**Engineering:**
1. **The Creator Console is Payload's admin, at `/console`.**
   - Payload provides content, version history, diffs and rollback.
   - The console's other modules are collections or custom views: decision queue, pipeline, audit log, budget, agents, access.
2. **Agents act as users with role "agent".** The CMS access rules enforce `platform/config/permissions.json` (transcribed from each profile's "May" and "May not") at the tool level. For example, the Localisation Specialist can change only Hindi and Telugu strings. *For the creator's approval:* permission changes are always-ask.
3. **The event log is append-only in the database itself.** A trigger refuses UPDATE and DELETE.
4. **Publishing has one path.** The creator approves, with a fresh passkey, either in the console or through a publish decision; the lesson must pass validation. The MCP connector has no publish tool.
5. **Preview links are signed, expire after 72 hours, and open one lesson's drafts only.**
6. **The learner site reads published content from the CMS when a database is configured**, and from `/content` otherwise (CI, offline packs). Lesson pages render on first visit and stay cached until the next publish.

## 2026-10-15 — Agents bound by rubrics, and measured

**Engineering, at the creator's request** that every agent work to clear rubrics, as a team of experienced domain experts would, starting with the most important.

- **Rubrics.** Every platform agent has a rubric in `platform/rubrics/`, with references in `platform/references/`. The runner (`packages/agents`) builds each agent's prompt from the constitution, its profile and its rubric, and rejects output that breaks the rubric. The agent is told what broke and redoes it once; output that still fails is blocked.
  - Reviewers must report every check, with located and quoted flags, a fix for each, and calibrated severity.
  - Makers must pass automatic checks, then an independent judge scores them on anchored 0–4 criteria.
  - The Editor-in-Chief is scored against cases with known answers.
- **Benchmarks.** Measured runs are recorded in `benchmarks/`, and CI fails if a recorded run falls below its pass bar. The judge is calibrated by planting defects it must detect. Results are in `benchmarks/SCORECARD.md`.
- **Build subagents.** Each subagent in `.claude/agents/` now ends its report with a "done means" checklist, every item backed by evidence.
- **The test lesson.** The real problems the reviewers found are fixed in `content/`. Benchmark cases stay frozen, so recorded runs remain comparable.
- **Not changed.** The profiles in `platform/agents/` are the creator's files and are not edited. Proposed for the creator: add a line to each profile pointing to its rubric.
- **Limits.** The build team wrote the rubrics, references and benchmarks, and a model judges the makers. Expert review and judge–expert agreement are required before the scores gate model or prompt changes (`benchmarks/README.md`).

## 2026-10-15 — Learner-experience redesign

**Engineering (design), at the creator's request** to design the platform "as an expert UI/UX designer with 20 years in ed-tech, keeping learner experience and reach in mind". The `learning-experience-reviewer` reviewed it twice, and its findings were applied.

- **Chapters.** Each stage of the lesson grammar opens as a numbered chapter. Its colour is chosen to stay clear of the three colours that already carry meaning: indigo for actions, teal for "that's it" and amber for "have another look". All pairs are contrast-tested in light, dark and projection modes.
- **Chapter rail, not a progress bar.** The sticky toolbar names the current chapter and opens a jump list. The segmented rail marks only "you are here": past chapters are never filled in and there is no percentage (Article 14).
- **Act cards.** Every block where the learner acts is framed and labelled with the act ("Make a guess", "Try it", "Decide"…), while connective text stays unframed. First-use hints are one line, about ten words.
- **The ending.** Post-checks are presented as "Try it on something new" and placed before a final transfer-and-reflect chapter, so the lesson ends on what the learner made (their own explanation and their card), not on questions (Article 5).
- **Reach.**
  - The header carries one language menu.
  - The cover's call to action is inside the first 360×640 screen in all three languages.
  - The knob pins a live score on phones, so the result is visible while sliding.
  - The toolbar has no backdrop blur (costly on low-end GPUs).
  - Nothing new was added to download: no fonts, images or dependencies.
- **Classroom.** Each chapter title is a banner sharing the screen with its first block. A presenter's clicker (Page Down/Up, arrow keys) moves exactly one block.
- **Cover.** The issue is labelled by its theme ("How machines learn"), not "for Kids" (Article 8). The illustration has no words in it and uses a bin, not a cross, for junk. The component preview link is removed from the learner-facing cover (the page stays available to the creator at `/preview`).

## 2026-09-24 — Phase 1 experience review: acted on, and deferred

**Engineering.** The `learning-experience-reviewer` reviewed the Phase 1 UI and the test lesson before this demonstration.

**Acted on:**
- The lesson now ends with its post-checks, framed as "see how far you've come".
- The recall warm-up asks the learner to remember before it shows anything.
- On phones the hook appears on the first screen, with the toolbar folded into one row plus a Lesson tools panel.
- Break-it asks for a prediction before each result.
- Sort places a picked item without scrolling.
- Analogies state their break point once every pair has been explored.
- Takeaway lines carry labels.
- Knob can turn its output into a decision at a threshold.
- Projected text is 28px or larger everywhere, with a test.
- The wording no longer invents claims about what "many people" guess.
- In the test lesson, every number follows from its own rules and symbols are explained. Culture-specific examples (Nani, ₹, cricket) now appear only in the Hindi and Telugu variants (Article 7).

**Deferred, for the creator's decision:**
1. **Running the learner's own messages through the filter** (`your-data`), and applying break-it attempts to the live filter. Both need logic that counts clues in junk messages, which is subject-specific. By the architecture rules that belongs in a domain simulation plugin (Phase 5, alongside `train-classifier`), not in the subject-agnostic primitives. For now the test lesson asks learners to score their messages by hand.
2. **Pre-checks are not shown yet.** Pre- and post-checks feed the learning-gain measure in Phase 5. Showing a pre-check before the hook would also break "open with a question". Post-checks are shown now as the ending.
3. **The deepest-layer explanation of the threshold trade-off** would work better as an interactive slider than as text. Doing that needs either a threshold-sweep model for `knob` or a domain simulation.
4. **Deeper-layer teasers use one generic line.** A per-block teaser question would need a new optional field on blocks, which is a schema change the creator must approve.
5. **Testing on a real low-end Android phone** is still needed. CI checks performance on an emulated Moto G4 with a CPU slowed 4x and slow 3G. The current result is content in about 0.7 s, usable in about 11 s, and 200 KB of JavaScript.

## 2026-09-24 — Phase 1 engineering decisions

**Engineering.** Recorded for the creator's review at the Phase 1 acceptance demonstration.

1. **Lessons are read from `/content` at build time until Phase 3.** The CMS arrives in Phase 3. Until then, lessons, detours and the glossary are JSON files in the repository. The web app reads them through one module (`apps/web/src/lib/content.ts`), which the CMS will replace without any change to pages.
2. **The build refuses to render an invalid lesson.** Every lesson is validated against `schemas/lesson.schema.json` and each component's contract when it is built, and again in CI (`pnpm validate:content`). The pedagogy checks from `docs/04` belong to the Phase 3 validation service.
3. **Component plugins have two halves.** Each has a React-free *contract* (type, versions, config JSON Schema, string keys, block references, learner act), used by the validator and later by the CMS and MCP server. The *plugin* adds personal and classroom renderers and its own interface strings in every locale. A lesson pins `componentVersion`, and a plugin lists every version it can still render.
4. **Models in `knob` and `compare` are declarative.** Lessons may not contain code, so a lesson picks a reviewed model type (`linear` or `threshold`) and supplies numbers. New model types are added in code, with tests.
5. **Classroom mode has its own static route** (`/{locale}/lessons/{id}/classroom`) rather than a query parameter. Both modes are fully static and cacheable offline. Classroom variants that need votes use a show-of-hands tally, which is also the no-device path; Phase 2 live voting feeds the same tally.
6. **Progress is stored only on the device** (`localStorage`), keyed by lesson id and version. Nothing a learner does is sent to a server (`docs/11`).
7. **Offline support uses a hand-written service worker** (`apps/web/public/sw.js`) rather than a PWA plugin, because Next.js 16 builds with Turbopack and the common plugins require webpack. Pages are network-first with a cache fallback, and build assets are cache-first. Downloadable lesson packs are deferred to the phase that needs them.
8. **Fonts are self-hosted Noto** (Sans, Sans Devanagari, Sans Telugu) through `next/font`, so learners' devices make no requests to Google. Only the Latin face is preloaded, and Indic faces load when a page uses them. Indic scripts get taller line-height and no letter-spacing or uppercase transforms.
9. **The brand name is a working title.** "Learning Magazine" (Hindi and Telugu equivalents) stands in until the creator chooses a name and identity (`docs/12`).
10. **Hindi and Telugu strings are drafts.** They were written by the build team, not by native speakers. Every page in these locales shows a notice saying so until a lesson's `localeStatus` for that locale is `reviewed`, which only a human reviewer sets.
11. **Payload CMS is not installed yet.** It is approved as part of the stack but is not needed until Phase 3, and installing it now would add weight to every build.

## 2026-09-24 — Hosting: Vercel with Postgres in Mumbai

**Creator.** The web app is hosted on Vercel, with serverless functions pinned to `bom1` (Mumbai). PostgreSQL is on Neon in `aws-ap-south-1` (Mumbai), with a separate Neon branch for preview deployments. Infrastructure is defined in `infra/terraform` and is not applied until the creator approves.

*Trade-off accepted:* this is the fastest route to shipping. Vercel's global CDN edge and its request logs may process requests outside India. That is acceptable in v1 because learners' personal data is not collected (`docs/11`). Anything that does store data, such as anonymous analytics or classroom sessions, must store it in the Mumbai database. The decision should be revisited before any feature collects personal data.

*Alternatives considered:* AWS `ap-south-1` (full residency and control, more setup) and GCP `asia-south1`.

## 2026-09-24 — Stack confirmed

**Creator.** The default stack in `docs/03` is approved: TypeScript (strict), Next.js App Router (16.x), Payload CMS 3 on PostgreSQL (from Phase 3), next-intl with ICU messages, a PWA with a service worker, Vitest, Testing Library and axe for unit, component and accessibility tests, and Playwright with axe for end-to-end tests. The repository is a pnpm monorepo:

| Path | Contents |
|---|---|
| `apps/web` | Next.js app: cover, lessons (personal and classroom), component preview |
| `packages/tokens` | Design tokens (TypeScript source, generated CSS, contrast tests) |
| `packages/schema` | Lesson types and the structural validator |
| `packages/engine` | Subject-agnostic lesson engine: registry, shared state, undo and reset, glossary, detours, depth dial, recall warm-up |
| `packages/primitives` | The 13 universal primitives from `docs/05` |
| `content/` | Lessons, detours and glossary (until the CMS) |
| `infra/terraform` | Vercel project and Neon database |

TypeScript is pinned to 5.9 rather than 7.x, because the tooling (typescript-eslint and the Next.js type plugin) does not yet support the 7.x compiler.

## 2026-09-24 — Third launch language: Telugu

**Creator.** Telugu (`te`, Telugu script, Noto Sans Telugu) is the third launch language. The `REGIONAL` placeholder was replaced in `platform/config/locales.json`, `docs/01`, `docs/04`, `docs/07`, the README and the m1 exemplar.
