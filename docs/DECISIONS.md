# Decisions

Every decision that changes the specification is recorded here with its date and reason. Newest first. Decisions marked **creator** were made by the creator; **engineering** decisions are within the build team's remit and can be reversed by the creator at any time.

---

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
