# CLAUDE.md — Interactive Learning Magazine

## What this is

An interactive learning platform designed as a magazine people explore out of curiosity, not a course they must complete. Learners decide, predict, build and explore on every screen. It launches with **AI for Kids** (Indian classes 8–12, roughly ages 13–17) and is architected from day one to expand to every subject and every age.

The creator (Dr. Venkat Ganuthula) is the sole author in v1 and has final authority over every aspect of the platform. Nothing is published, deployed to production, deleted, or changed in schema, permissions or learner-data handling without the creator's explicit approval.

## Read before any work

Read `docs/02-platform-constitution.md` before designing anything, and the relevant spec file before touching an area. The constitution's priority order settles every conflict: **safety, then accuracy, then clarity, then experience, then aesthetics.**

## Non-negotiable architecture rules

Content is data; interactions are components. Lessons are JSON documents validated against `schemas/lesson.schema.json`. No lesson may contain executable code. New interaction types are built as versioned components registered in the plugin registry, never embedded in content.

The core engine is subject-agnostic. Anything specific to AI, or to any other subject, lives in plugins and configuration.

Every component has a personal-mode and a classroom-mode variant.

Every user-facing string is localisable from the first commit. No hard-coded text in components. Layouts must tolerate text expansion and Indic scripts.

Every agent action and every creator action is written to the append-only event log.

Children's personal data is not collected in v1. Learners use the platform anonymously or through teacher-issued class codes.

Performance budget: a lesson must be usable on a low-end Android phone on a slow 3G connection, and must work offline once loaded.

Accessibility target: WCAG 2.2 AA, verified by automated tests plus manual checks.

## Working conventions

Use TypeScript throughout, strict mode. Write tests alongside code; every component ships with unit tests, an accessibility test, and a story or preview page showing personal and classroom variants in all three locales. Keep commits small and describe the why. Update the relevant spec file when a decision changes it, and note the change in `docs/DECISIONS.md` (create it in Phase 0) with date and reason.

Propose before building anything that changes the architecture, the schema, the constitution, permissions, or data handling. Present options with trade-offs and wait for the creator's decision.

## Subagents for building

Use the subagents in `.claude/agents/` for their areas: `technical-architect` for architecture and stack decisions, `interaction-engineer` for components and simulations, `design-system-engineer` for tokens, themes and visual language, `cms-mcp-engineer` for the content model, CMS, media pipeline and MCP server, `qa-engineer` for tests, accessibility and device checks, `security-privacy-engineer` for accounts, auth, consent and data protection, and `learning-experience-reviewer` to review any learner-facing UI against the experience standards before it is shown to the creator.

## Current phase

See `docs/14-build-plan.md`. Do not start a phase until the previous one's acceptance criteria have been demonstrated to the creator.
