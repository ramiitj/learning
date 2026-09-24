# 05 — Interaction Components

## Principle

Every component makes the learner decide, predict, build, explore or explain, and responds visibly within about a second. Every component supports reset and undo, keyboard and screen-reader use, all three locales, and both personal and classroom modes. Every component teaches itself the first time it appears.

## Universal primitives (v1)

| Component | Learner action | Purpose | Classroom variant |
|---|---|---|---|
| `reveal` | Uncover the next idea | Connective pacing between acts | Teacher reveals |
| `predict` | Commit to a guess (choice, number or position), optionally with a confidence rating | Surface misconceptions; make the reveal matter; teach calibration | Class vote with live distribution |
| `knob` | Change one or more parameters with sliders or toggles and watch an output change | Build a cause-and-effect model; always paired with a goal or challenge | Teacher moves the knob; class predicts first |
| `sort` | Drag items into groups | Be the classifier before the machine is | Class votes item by item |
| `assemble` | Stack or connect blocks into a structure | Understand structure and order | Teacher assembles from class suggestions |
| `your-data` | Type, draw or label their own input | Ownership; the model reflects their input; handles empty or silly input gracefully | Class contributes items through the session |
| `by-hand-then-automate` | Perform one step manually, then run it many times automatically | Demystify what the machine does | Teacher steps; class checks |
| `break-it` | Try to make the system fail or behave unfairly | Limits, bias, failure modes | Class suggests attempts |
| `compare` | Run two versions side by side | Isolate one variable | Shared screen split |
| `explain-back` | Pick the best explanation, or write their own comparison and its break point | Consolidation and transfer | Pair discussion prompt |
| `analogy` | Explore an interactive analogy that fades into the formal representation | Make abstract concepts graspable | Teacher-led |
| `check` | Short, friendly understanding check with hints ladder and detour offer | Confirm the ground is solid | Class vote |
| `takeaway` | Download or keep what they made (model, card, summary) | Closure and a reason to finish | Class result card |

## Supporting elements

`glossary-term` (tap to see a definition), `detour` (prerequisite side path with return), `depth-dial` (reveal deeper layers), `hint-ladder` (nudge to worked example), `recall-warmup` (a playful retrieval task for returning learners).

## Domain simulations

Domain simulations are plugins with the same contract as primitives: a registered type, a version, a JSON Schema for configuration, personal and classroom variants, tests, and localisable strings. v1 needs:

| Simulation | Used in |
|---|---|
| `train-classifier` (learns from the learner's sorted examples) | Module 1, Module 2 |
| `pixel-grid` (draw and see the numbers) | Module 3 |
| `next-word-model` (trains in the browser on the learner's own sentences) | Module 4 |
| `layer-builder` (assemble layers, change width, see underfitting and overfitting) | Module 5 |
| `dilemma-vote` (scenario, vote, reveal how ethical frameworks decide) | Module 6 |
| `hillside` (walk downhill in fog; fades into a loss curve) | Modules 4 and 5 |

All model training runs in the browser. Nothing a learner types is sent to a server.

## Media blocks

`video`, `audio`, `animation` and `image` blocks; see `docs/08`.

## Adding a component

A new component is proposed by the Interaction Designer agent or the creator, specified (purpose, learner action, contract, both variants, accessibility approach), approved by the creator, built by the `interaction-engineer` subagent, reviewed by `learning-experience-reviewer` and `qa-engineer`, and registered. Only then can lessons use it.
