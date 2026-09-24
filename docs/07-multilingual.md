# 07 — Multilingual Design

## Launch locales

English (`en`), Hindi (`hi`), and one regional language (`REGIONAL`, to be chosen). Configured in `platform/config/locales.json`. The architecture supports any number of locales; adding one is configuration plus content.

## Translation workflow

The Localisation agent drafts every non-English string from the English source, working from the concept, not word for word, and using the per-locale glossary. Every Hindi and regional-language string is then reviewed by a fluent native speaker, ideally a school teacher, before that locale can be published. Reviewers work in the Creator Console's translation review view, which shows each string in context on a live preview. Reviewer approval is recorded per string.

## Terminology policy

Decided term by term in a shared glossary per locale. Default: technical terms students are likely to meet in the world (token, model, embedding, dataset) stay in English, written in the target script where natural, with a plain-language explanation in the target language. Formal coined equivalents are used only where they are genuinely in use in schools.

## Bilingual learning

Learners can switch locale at any point without losing their place. An optional bilingual mode shows key terms in two languages side by side. In classroom mode the teacher sets the projected language; students' phones can use their own.

## Technical requirements

Fonts with full script coverage; layouts that tolerate text expansion of 40% or more; no text baked into images or video (all text in SVG and animations is a separate localisable layer); correct plural and number handling through ICU messages; locale-appropriate number formatting; narration and captions per locale for media.

## Analogies and examples

The analogy's structure is universal; examples, names and illustrations have locale variants where a local example teaches better. The Analogy Specialist maintains these.

## Simulated learners

The Novice Learner panel includes a student learning in Hindi and one learning in the regional language.
