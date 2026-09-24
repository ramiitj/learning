# 14 — Build Plan

Each phase ends with acceptance criteria demonstrated to the creator. Do not begin a phase until the previous one is accepted.

## Phase 0 — Foundations

The Technical Architect confirms or revises the stack in `docs/03` with trade-offs, sets up the repository, CI, environments (local, preview, production in an Indian region), `docs/DECISIONS.md`, and infrastructure as code.

Acceptance: stack approved by the creator; a deployed "hello" page in all three locales with Indic fonts rendering correctly; CI running lint, type checks, tests and accessibility tests.

## Phase 1 — Lesson engine and core components

Engine with plugin registry, shared lesson state, reset and undo, glossary, detours, depth dial, locale switching; the design system and school theme with projection variant; the universal primitives in `docs/05`; offline support.

Acceptance: a hand-written test lesson using every primitive runs in personal mode in all three locales, on a low-end Android device on throttled 3G, offline after first load, and passes WCAG 2.2 AA checks.

## Phase 2 — Classroom mode

Session creation, class codes, phone joining without accounts, live voting, teacher remote, show-of-hands entry, projection layouts.

Acceptance: a simulated class of 40 devices completes the test lesson with live votes; the no-device path works; nothing personal appears on the shared screen.

## Phase 3 — CMS, validation and MCP connector

Content model and schema in the CMS; drafts, versions, rollback, preview links; validation service with all checks in `docs/04`; media pipeline; the MCP server with the tools in `docs/03`; the authoring skill.

Acceptance: from a conversation in claude.ai, the creator creates a draft lesson, receives validation results, opens a preview, requests changes, and approves publishing; the live site updates within seconds; rollback works.

## Phase 4 — Agent operating system and Creator Console

Orchestrator, the ten v1 agents, permissioned tools, event log, benchmark suite, cost tracking, and the Creator Console modules in `docs/10`, with autonomy settings and informed override.

Acceptance: a lesson request runs through the full pipeline to the creator's preview; reviewers' flags are resolved or escalated; a conflict reaches the decision queue with both positions; an override shows dissent first and is logged; benchmarks run on a profile change.

## Phase 5 — AI for Kids content and simulations

The domain simulations in `docs/05`; the six modules in `docs/13` produced through the pipeline; native-speaker review for Hindi and the regional language; teacher guides and parent pages; pre- and post-checks; analytics.

Acceptance: all six modules published in three locales, reviewed by native speakers, with teacher guides.

## Phase 6 — Pilot

Pilot in a small number of schools, with consent and ethics approval in place; usability sessions with learners; analytics review; incident process live; LTI and xAPI support.

Acceptance: pilot report with learning gains, misconceptions, usability findings and a prioritised revision list approved by the creator.

## After v1

Adult audience theme and profiles; new subjects through domain plugins; the full agent roster as workload requires; accounts with consent flows; certificates; DIKSHA alignment; delegation.
