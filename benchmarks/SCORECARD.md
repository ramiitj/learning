# Agent scorecard — 2026-10-15

Every agent now works to a rubric in `platform/rubrics/`. Output that breaks its rubric is rejected and redone. Each result below comes from a recorded run in `benchmarks/<agent>/runs/`, and CI fails if a recorded run falls below its pass bar. Read "Limits" before relying on any number.

## Reviewers: did they find planted problems, and were their other flags real?

| Agent | Planted problems found | Precision* | Clean lesson | Rubric followed |
|---|---|---|---|---|
| Accuracy & Safety Reviewer | 24 / 24 (blocking 23 / 23) | 100% | 6 flags: 5 real, 1 needing context | Yes |
| Novice Learner Panel (4 simulated learners) | 11 / 11 (blocking 9 / 9) | 100% | 17 flags: 15 real, 1 context, 1 noise (94%) | Yes |

\*Flags on planted problems, plus flags a person judged to be real problems in the lesson, as a share of all flags.

**Without the rubric** (Accuracy & Safety Reviewer, profile only): it also found 24 / 24, but its report skipped the required structure in 13 places, so the pipeline would have rejected it. The base model is already strong at spotting problems. The rubric adds complete coverage of every check, calibrated severity, and reports a maker can act on and an auditor can verify.

**What the reviewers found in the real lesson:** genuine problems, now fixed in `content/` except one advisory point left for your decision: the step-ordering task is too easy for older learners. The fixed problems include:
- a threshold sentence that contradicted the "10 or more" rule;
- "millions" translated as lakhs;
- terms used before they were explained;
- sums with the working hidden;
- an instruction that pointed at points no longer on screen;
- a cricket bat shown on a football message.

## Makers: automatic checks, then an independent judge

| Agent | Task | Automatic checks | Judge (mean of 4; blocking ≥ 3) | Judge sees planted defects |
|---|---|---|---|---|
| Curriculum & Instructional Designer | Module 2, "Data decides" | 7 / 7 pass | **3.0**: passes, at the bar | 3 / 3 |
| Learning Experience Designer | Experience for that sequence | 7 / 7 pass | **3.63** | 3 / 3 |
| Analogy Specialist | "Weight" | 5 / 5 pass | **3.38** | 3 / 3 |
| Localisation Specialist | 18 strings → hi, te | 7 / 7 pass | **3.2** | 3 / 3 |
| Educator Enablement | Teacher guide | 1st attempt **rejected** (961 words); 2nd passes | **3.25** | 3 / 3 |
| Editor-in-Chief | 10 conflicts with known answers | 3 / 3 pass | 1st attempt **3.25, failed** (one decision mislabelled); after revision **4.0**, 10 / 10 correct, 5 / 5 escalations | 3 / 3 |

**Judge calibration:** for every maker, defects were planted in its own artifact, one per targeted criterion. The judge scored all 18 targeted criteria 2 or below, and no untargeted criterion moved by more than one point.

**Enforcement at work:**
- The educator guide was rejected for length and fixed on the redo.
- The Editor-in-Chief's mislabelled decision was caught twice, independently: by exact-answer scoring and by the judge. It was fixed in one revision.

**Without the rubric** (Editor-in-Chief, profile only): it made the same correct calls, but on the new-component case (c5) it decided for itself instead of escalating, so it escalated 4 of the 5 that must reach you. Its translations (Localisation, profile only) passed the automatic checks too.

## Where the agents are weakest (the judge's own notes)

- **Curriculum designer** (3.0 on every criterion, so it only just passes):
  - names "test set" before the learner has experienced it;
  - does not show the working for 86 ÷ 90 ≈ 0.955;
  - one post-check repeats the lesson's own context instead of a new one;
  - one step carries two new ideas.
- **Experience designer:**
  - some results are visible before the learner predicts;
  - a few wrong answers have no specific reply;
  - the classroom route is tight for 40 minutes.
- **Localisation:** naturalness and register are only "good". A native-speaker review is still required before any Hindi or Telugu is published.

## Limits

- **Small samples.** Each figure is from one or two tasks and one run. For gating, `benchmarks/README.md` asks for at least five tasks per agent and three runs, with the lowest score counting.
- **Who wrote the yardsticks.** The build team wrote the rubrics, references and planted problems and adjudicated the extra flags, and a model judges the makers. The human calibration plan in `benchmarks/README.md` (expert review, judge–expert agreement, your adjudication) is what turns these into trusted numbers.
- **Models used.** Runs used Claude models through Claude Code subagents, because this environment has no API key. Reviewers and three makers ran on the balanced tier; the curriculum designer, experience designer, Editor-in-Chief and every judge ran on the most capable tier. With a key, `npx tsx src/cli.ts bench <agent>` runs the same prompts through the API runner, which enforces the rubric automatically.
