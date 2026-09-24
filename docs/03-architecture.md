# 03 — Architecture

## Overview

The platform has four layers. The **learner experience** is the web app where lessons are explored in personal or classroom mode. The **lesson engine** renders lessons from JSON using registered components. The **content platform** is the CMS, media pipeline, validation service and MCP connector. The **agent operating system** is the orchestrator, agents, shared artifact store, permission system, event log and Creator Console.

## Recommended stack (to be confirmed in Phase 0)

The `technical-architect` subagent confirms or revises these defaults, with trade-offs, before any application code is written.

| Concern | Default | Reason |
|---|---|---|
| Language | TypeScript (strict) | One language across front end, CMS, MCP server and agents |
| Web framework | Next.js (App Router) | Server rendering for speed on slow networks, static export of lessons for offline packs |
| CMS | Payload CMS on PostgreSQL | TypeScript-native, runs inside Next.js, code-defined schema, drafts and versions built in |
| Database | PostgreSQL in an Indian region | Data residency; relational model suits the concept graph and versions |
| Real-time classroom sessions | WebSockets via a managed real-time service | Class-code joining and live voting |
| Internationalisation | ICU message format with a Next.js i18n library | Plurals and gender handled correctly across languages |
| Offline | Progressive web app with a service worker; downloadable lesson packs | Low connectivity in many schools |
| Animation | SVG, plus Lottie or Rive for complex animation | Lightweight, scalable, translatable text |
| Video | Adaptive streaming (HLS) through a managed video service | Multiple resolutions, low-bandwidth fallback |
| Agents | Anthropic Claude API via the official TypeScript SDK | Model tiers configured in `platform/config/models.json` |
| MCP server | Official TypeScript MCP SDK, OAuth-protected | Conversational authoring from claude.ai and Claude Code |
| Analytics | Self-hosted, privacy-first event collection plus xAPI statements | No third-party trackers on children's content |
| Testing | Unit, component, end-to-end, automated accessibility | Required for every component |

## Lesson engine

The engine loads a lesson document, resolves its component references through the **plugin registry**, and renders the blocks in order with shared lesson state, so something the learner creates in block 2 (their typed sentences, their sorted examples) can flow into block 9. It supports reset and undo everywhere, the depth dial, detours with return-to-place, the glossary, locale switching mid-lesson without losing progress, and personal or classroom mode.

The plugin registry maps each component type and version to its implementation and its content contract (the JSON Schema for its configuration). Lessons record the component version they were written for; components keep backward-compatible renderers or a migration for old versions, so published lessons never break.

Components are grouped as universal primitives, domain simulations and media blocks (see `docs/05`).

## Classroom mode

The teacher starts a session and receives a short class code. Students may join from phones without accounts to vote on predictions and contribute to group activities; where students have no devices, the teacher enters show-of-hands counts. The teacher controls pacing from the projected screen or a phone acting as a remote. Projection layouts use large type, high contrast and controls usable from across a room. No personal information ever appears on the shared screen. Session data is aggregated and discarded after the session unless the teacher's school has opted into anonymous analytics.

## Content platform

The CMS holds lessons, the concept graph, the analogy bank, glossaries, audience profiles, media assets and teacher guides. Every document has draft and published states, full version history and one-click rollback. Publishing triggers cache revalidation so the live site updates within seconds.

The **validation service** runs on every save: structural validation against the schema and each component's contract; the pedagogy checks (see `docs/04`); accessibility checks on content; locale completeness; and the experience review. Results are returned to whoever saved, including agents through the MCP connector.

The **media pipeline** handles upload, transcoding to multiple resolutions, caption generation and editing per locale, thumbnails, CDN storage, and provenance and licence records for every asset.

## MCP connector

An OAuth-protected MCP server exposes authoring tools so the creator can author through conversation with Claude in claude.ai or Claude Code.

| Tool | Purpose |
|---|---|
| `list_lessons`, `get_lesson` | Browse and read content |
| `get_schema`, `list_components` | Read the lesson schema and component contracts |
| `search_concepts`, `get_analogies`, `get_glossary` | Use the concept graph, analogy bank and glossary |
| `create_draft`, `update_block`, `insert_block`, `remove_block` | Author drafts |
| `validate_lesson` | Run the full validation service |
| `run_pipeline` | Hand a draft to the agent pipeline (see `docs/09`) |
| `get_preview_link` | Return a preview URL for personal and classroom modes in any locale |
| `request_publish` | Place the draft in the decision queue for the creator's approval |

There is deliberately no tool that publishes directly. Publishing happens in the Creator Console or through an explicit confirmation step that requires the creator's authenticated approval.

## Agent operating system

Described fully in `docs/09`. In summary: an orchestrator routes work through a fixed pipeline; agents act on shared artifacts through permissioned tools; every action goes to an append-only event log; the Creator Console provides full visibility and control.

## Interoperability and distribution

LTI 1.3 so lessons can be launched from school learning management systems; xAPI statements for learning activity; alignment with DIKSHA explored in a later phase. Downloadable lesson packs run from a single laptop or a local server for schools without reliable internet.

## Reliability and ownership

Automated daily backups with a tested restore procedure; full export of all content, configuration, agent profiles and the constitution in open formats (JSON and Markdown); infrastructure defined as code; error monitoring with alerts to the creator.
