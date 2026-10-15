# Terminology and register policy for Hindi and Telugu

Source: `docs/07-multilingual.md`. Register guidance below is the build team's working draft and must be confirmed by native-speaker reviewers.

## Terms

Decided term by term in the per-locale glossary. Default: technical terms students are likely to meet in the world (filter, program, score, model, dataset, token) stay in English, **written in the target script** where natural (फ़िल्टर, ఫిల్టర్), with a plain-language explanation in the target language. Formal coined equivalents are used only where genuinely used in schools. When the glossary gives a rendering, use it everywhere. A new term choice is a proposal for the creator, marked as such.

## Format

- ICU placeholders such as `{threshold}` and `{output}` stay exactly as written. Plural messages keep their argument name and the `one`/`other` branches; translate only the words inside each branch, and make each branch grammatical.
- `<term-x>…</term-x>` tags stay, with the target-language word inside.
- Numbers stay as numerals and keep their values. Indian number formatting (lakh, crore) must keep the same quantity: "millions" is not "lakhs".

## Register

- Write as a warm native-speaking teacher talks to a class 8–10 student: everyday spoken words, short sentences, active voice.
- Hindi: use आप for the learner; prefer common words over Sanskritised ones (मदद, not सहायता, where natural); avoid long passive chains (…किया जा चुका है).
- Telugu: use మీరు for the learner; prefer spoken forms over bookish passives (…చేయబడ్డాయి).
- No idioms that do not travel. Never condescending.

## Honesty

Mark confidence per string. Anything less than high gets a specific note for the native-speaker reviewer. Only a human reviewer marks a locale as reviewed.
