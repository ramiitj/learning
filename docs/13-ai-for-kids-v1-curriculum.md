# 13 — AI for Kids: v1 Curriculum

Audience: Indian classes 8–12 (profile `school-13-17` in `platform/config/audiences.json`). Each module is one to two 40-minute classroom periods or about 30–45 minutes self-paced, works in both modes and all three locales, and begins from zero assumptions.

## Module 1 — How do machines learn?

Hook: two photos, a machine labels them confidently, one label is ridiculous. How did it decide? Signature interaction: the learner sorts about 20 examples into two groups, then watches `train-classifier` learn from their sorting and label new examples. Break it: sort a few examples inconsistently and see the machine become confused. Core analogy: a small child learning what "dog" means from seeing many dogs, with no rulebook. Second analogy: learning a new friend's handwriting. Break point: children need a few examples; machines need thousands. Prerequisite detours: what "a pattern" means; what "a rule" is.

## Module 2 — Data decides

Hook: a machine that is very accurate, except for some people. Signature interaction: train on a skewed dataset, test on a balanced one, and discover the unfairness; then fix the data. Core analogy: a cook who has only learned one family's recipes. Second: judging all weather from one rainy week. Break point: the machine has no way of noticing its own gap. Reflection: who should be responsible when data is unfair? Detours: what "a sample" is; what a percentage means.

## Module 3 — Pictures are numbers

Hook: what does a computer actually receive when it "sees" a photo? Signature interaction: draw a digit on `pixel-grid` and see every square become a number; blur it, shift it, and watch the numbers change. Core analogy: a mosaic of numbered tiles. Second: paint-by-numbers. Break point: the machine never sees the picture, only numbers. Detours: what a grid and coordinates are.

## Module 4 — Predicting the next word

Hook: can a computer finish your sentence? Signature interaction: type your own sentences; cut them into tokens; build a vocabulary; `by-hand-then-automate` one prediction; then train `next-word-model` in the browser and generate text. Core analogies: finishing a friend's sentence; the suggestion strip on a phone keyboard; tokens as puzzle pieces. Break points: no intention behind the choice, only likelihood; pieces are often not whole words. Includes a first encounter with `hillside` to show how training reduces error. Detours: probability as "how often something happens"; counting and fractions. Adapted from the creator's university-level *Build a Language Model* walkthrough.

## Module 5 — Inside a neural network

Hook: the same network is brilliant at one task and useless at a similar one. Why? Signature interaction: `layer-builder`, assembling layers and changing their width to see underfitting and overfitting; `hillside` fades into a loss curve. Core analogies: sieves of different sizes; detectives in a relay (edges, then shapes, then faces); overfitting as memorising last year's exam paper. Break points: real layers do not have neat human-readable jobs; some memorising is useful. Detours: what "weights" are, via how much you trust each friend's advice.

## Module 6 — AI and us

Hook: an AI system made a decision about a person. Was it fair? Signature interaction: `dilemma-vote`, where the learner or class votes on scenarios, then sees how different ethical frameworks would decide and why. Includes hallucination (a student bluffing confidently in an oral exam, with the break point that the model does not know it is bluffing) and anthropomorphism (why "the AI thinks" can mislead). Takeaway: a personal card of the learner's own principles for using AI. Draws on the creator's ethics frameworks decks.

## Concept graph for v1

pattern → example → learning from examples → dataset → bias → number representation → pixel → token → vocabulary → probability → prediction → error → training → weight → layer → overfitting → generalisation → fairness → responsibility.
