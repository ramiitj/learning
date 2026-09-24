# 01 — Vision and Scope

## Vision

A learning platform where anyone, of any age and any background, can start and finish understanding a hard idea, because they build it, test it and break it themselves rather than reading about it. The format is an interactive magazine: issues released around themes, explored in any order, remembered for their visual storytelling and for the moment an idea clicked.

The platform is subject-agnostic and audience-aware. The same concept can be experienced by a 10-year-old, a class 12 student, a university student or a retired professional, at different depths, in their own language, with analogies that work anywhere in the world.

## Why it is different

Most learning platforms are organised for completion and built around content delivery: slides, videos, quizzes. This one is organised for understanding and built around consequential interaction. The learner's choices change what happens on screen, and explanation follows experience rather than preceding it.

## Audiences

v1 serves learners in Indian classes 8–12, in two settings given equal weight: students on their own devices, and teacher-led classrooms using a projected screen. Later phases add younger children, university students, working professionals and older adults, across all subjects.

## Decisions already made

| Decision | Choice |
|---|---|
| Primary setting for v1 | Personal devices and classroom projection, equally |
| Authoring in v1 | Creator only |
| Launch languages | English, Hindi, and one regional language (to be chosen; configured as `REGIONAL`) |
| Learner accounts in v1 | None for children; anonymous use or teacher class codes |
| Live AI inside lessons in v1 | None; AI powers authoring only |
| Curriculum alignment | Standalone content, with every lesson tagged to CBSE/NCERT and state-board objectives where they exist |
| Hosting | Indian region, for data residency |
| Accessibility | WCAG 2.2 AA |
| Interoperability | LTI and xAPI support planned; DIKSHA alignment explored |

## Decisions deferred

Business model, certificates for adult learners, expansion order across subjects and ages, content licence (open versus proprietary), legal entity, and whether to bring in human collaborators to maintain the platform. Each is recorded in `docs/DECISIONS.md` when made.

## v1 scope

Six AI for Kids modules (see `docs/13`); the lesson engine with the core component set in personal and classroom modes; three locales; the CMS with drafts, preview, versions and rollback; the MCP connector for conversational authoring from Claude; the validation service; the ten-agent starting set; the Creator Console; offline support; and privacy-safe analytics.

Out of v1 scope: adult audiences, other subjects, learner accounts, public sharing, live AI tutors, certificates, payments.

## What success looks like

Learning, not attention. For v1: measurable gains between each module's pre-check and post-check; misconceptions surfaced and resolved; a high proportion of learners who start a module finish it; teachers in pilot schools choosing to run a second module after the first; and the creator able to take a new lesson from conversation to published in under a day of their own time.
