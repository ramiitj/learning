# 04 — Content Model

The authoritative schema is `schemas/lesson.schema.json`. This document explains it.

## Hierarchy and graph

Content is organised as **subject → course → module → lesson → block**, and also as a **concept graph**. Each lesson declares the concepts it teaches, its learning objectives, its prerequisites (concepts), the audiences it serves, and its curriculum tags. Concepts link across subjects: "feedback loop" is taught in AI, ecology and economics lessons, and the graph lets learners and agents see those connections.

A **concept** has an identifier, a plain-language definition per locale, prerequisite concepts, related concepts, analogies from the bank, and the lessons and detours that teach it.

## Issues

Lessons are published in **issues**: themed releases with a cover story, a set of lessons, and an editorial note. Issues give the magazine its rhythm.

## Lessons

A lesson document contains metadata (id, version, title, subtitle, subject, concepts, objectives, prerequisites, audiences, curriculum tags, estimated minutes, status), a `stages` array matching the lesson grammar, a pre-check and post-check, a teacher guide reference, and locale content.

Each stage contains **blocks**. A block has a `type` (a registered component), a `componentVersion`, a `config` validated against that component's contract, optional `depth` (core, deeper, deepest) for the depth dial, optional `classroom` overrides, and localisable strings referenced by key.

## Localisation

All learner-facing text lives in a `strings` object keyed by locale (`en`, `hi`, and the `REGIONAL` code), and blocks reference strings by key. A lesson cannot be published in a locale until every key used by its blocks has a reviewed string in that locale. Terms link to the per-locale glossary.

## Analogy blocks

An analogy block references an entry in the analogy bank or defines one inline. Fields: `concept`, `source` (the everyday situation), `mappings` (pairs of source element and concept element), `breakPoint` (where the comparison stops working), optional `fading` (a sequence of representations from the source situation to the formal one), `audienceVariants`, and `localeVariants` for examples and illustrations. The interface can highlight corresponding elements as the learner moves between the analogy and the formal diagram.

## Detours

A detour is a short prerequisite lesson attached to a concept. Any block can offer detours; the engine saves the learner's place and returns them to it.

## Audience profiles

Defined in `platform/config/audiences.json`. Each profile sets reading level, sentence length, pacing, tone, visual theme, gamification level, default depth, analogy variant preference and which pedagogy checks apply. Lessons declare the audiences they serve; the validator checks content against each.

## Pedagogy checks (validation)

| Check | Rule |
|---|---|
| Act density | No more than two consecutive blocks without a decide, predict, build, explore or explain act |
| Grammar | Every lesson has hook, predict, manipulate, explain, break-it and transfer-and-reflect stages |
| Undefined terms | Every technical term is defined at or before first use, or is a declared prerequisite, and is in the glossary |
| Banned phrases | "obviously", "simply", "clearly", "just", "it's easy to see", and equivalents in each locale |
| Analogy completeness | Every analogy has mappings and a break point; hard concepts have at least two analogies |
| Anthropomorphism (AI subject only) | Human-mind verbs applied to AI systems are flagged unless inside a break-point discussion |
| Reading level | Core text within the audience profile's reading level and sentence-length limits |
| First-use interaction help | Each component type shows its how-to hint the first time it appears in a lesson |
| Media rules | Every media block has captions and transcripts in all published locales; no autoplay |
| Locale completeness | All strings present and reviewed for every locale being published |
| Checks present | Pre-check and post-check exist and map to the stated objectives |
| Ending | The final stage produces something the learner keeps or a clear reflection |

## Versioning

Every save creates a version. Published lessons point to a specific version; rollback repoints to an earlier one. Lessons record component versions and schema version for forward compatibility.
