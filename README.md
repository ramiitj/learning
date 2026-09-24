# Interactive Learning Magazine — Build Specification Pack

This pack contains everything Claude Code needs to build the platform: the vision and scope, the platform constitution every agent follows, the architecture, the content model and JSON schema, the interaction component catalogue, the experience and design standards, the multilingual approach, the agent operating system, governance for the creator, privacy and safety, operations, the AI for Kids v1 curriculum, and a phased build plan.

## Running the platform

Requires Node 22 and pnpm 10.

```bash
pnpm install
pnpm dev                 # http://localhost:3000 → /en, /hi, /te
pnpm test                # unit, component and accessibility tests (Vitest + axe)
pnpm lint && pnpm typecheck
pnpm validate:content    # every lesson and detour against the schema and component contracts
pnpm build && pnpm test:e2e   # Playwright: locales and fonts, WCAG 2.2 AA, offline, emulated low-end Android on slow 3G
```

Useful pages: the cover (`/en`), the Phase 1 test lesson (`/en/lessons/every-primitive`) and its classroom mode (`/en/lessons/every-primitive/classroom`), and the component preview (`/en/preview`), which shows every component in personal and classroom mode. Swap `en` for `hi` or `te` to see the other locales.

Test lesson content is generated from `scripts/content/*.py` (strings for all three locales live in one file so they stay aligned): `python3 scripts/content/build_every_primitive.py`. After editing `packages/tokens/src/index.ts`, regenerate the CSS with `pnpm --filter @lm/tokens build`.

Decisions and their reasons are in `docs/DECISIONS.md`.

## How the specification pack was meant to be used

Copy the whole folder into the root of a new, empty repository. Open Claude Code in that repository and start with:

> Read CLAUDE.md and every file in /docs, then carry out Phase 0 of docs/14-build-plan.md. Propose the technical stack and wait for my approval before writing application code.

Work through the phases in order. Each phase in the build plan ends with acceptance criteria; ask Claude Code to demonstrate each one before moving on.

## What is where

| Path | Contents |
|---|---|
| `CLAUDE.md` | Standing instructions Claude Code loads in every session |
| `docs/01` to `docs/14` | The full specification, one topic per file |
| `schemas/lesson.schema.json` | The lesson content schema the engine, CMS, MCP server and validator all share |
| `examples/` | A complete exemplar lesson in the schema |
| `platform/constitution.md` | The platform constitution (a copy the running agents load; the creator edits it) |
| `platform/agents/` | Skill profiles for the content and review agents that run inside the platform |
| `platform/config/` | Audience profiles, locales, autonomy settings, model tiers |
| `.claude/agents/` | Claude Code subagents for building the platform |
| `.claude/skills/lesson-authoring/` | The authoring skill; also upload it to claude.ai for conversational authoring |

## Launch languages

English (`en`), Hindi (`hi`) and Telugu (`te`), configured in `platform/config/locales.json`. Telugu was chosen as the third language on 2026-09-24 (see `docs/DECISIONS.md`); nothing else in the architecture depends on which language it is.
