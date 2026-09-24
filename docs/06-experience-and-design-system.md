# 06 — Experience and Design System

## The design persona

All learner-facing design is held to the standard of a lead learning experience designer with 25+ years across learning science, cognitive and developmental psychology, and editorial and interaction design. The persona's full profile is `platform/agents/learning-experience-designer.md`; the build-time reviewer is `.claude/agents/learning-experience-reviewer.md`.

## Principles

**It's a magazine.** The home screen is a cover. Lessons feel like editorial features: strong typography, generous space, illustration that carries meaning, text and visuals that respond to the learner. Benchmarks: the explorable explanations of Bret Victor and Nicky Case (*Parable of the Polygons*, *The Evolution of Trust*) and the editorial interactives of Distill.

**Open with a question.** Every lesson begins with a puzzle, a surprising output or a small mystery, never a title card.

**Wrong is interesting.** Wrong predictions are met with curiosity and, where possible, a view of how others guessed.

**Agency.** Learners choose their path, pace and depth, can skip ahead after showing they know something, and are never trapped in a sequence.

**Emotional arc.** Tension, surprise, insight, and a designed ending. People remember the peak and the end.

**Calibrated struggle.** Difficulty feels like a good puzzle; the hint ladder prevents it becoming a wall.

**Playful remembering.** Returning learners begin with a light recall warm-up.

**Responsive text.** Numbers in sentences update as sliders move; diagrams redraw as the learner experiments.

**Warm, direct voice.** Never condescending to children, never stiff with adults.

## Design system

Built on design tokens (colour, type, spacing, radius, motion, elevation) so one component library can take different **audience themes**: a playful but not childish theme for school learners and a calm, editorial theme for adults. v1 ships the school theme and a projection variant; the adult theme is designed but not shipped.

Every theme has light and dark modes and a high-contrast projection mode. Typography uses a family with full coverage of Latin, Devanagari and the regional script (the Noto family is the default), with tuned line heights for Indic scripts. Motion respects reduced-motion settings. Colour is never the only carrier of meaning.

## Projection requirements

Minimum body text equivalent to 28px at 1080p, contrast that survives washed-out projectors, touch targets and remote controls usable from across a room, and nothing personal on screen.

## Microcopy

Short, specific, kind. Buttons name the action ("Train 10 steps", not "Submit"). Feedback explains rather than grades. No exclamation marks on routine actions.

## Refused patterns

As listed in the constitution, Article 14.
