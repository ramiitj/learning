# Agent benchmarks

Measured evidence that each platform agent does its job to its rubric (`platform/rubrics/`). The method is in `docs/09` ("Rubrics and enforcement", "Benchmarks and drift control").

## Layout

| Path | What it holds |
|---|---|
| `<agent>/cases/`, `<agent>/expected/` | Reviewers: the clean and seeded lessons, and the planted problems a reviewer must find |
| `<agent>/tasks/` | Makers: the fixed tasks |
| `<agent>/runs/` | Recorded outputs and judge scores. CI checks every recorded run against its rubric and pass bar |
| `<agent>/calibration/` | A recorded artifact with defects planted, each aimed at one criterion, to check that the judge sees them |
| `<agent>/adjudication.json` | A person's verdict on reviewer flags that match no planted problem: genuine, noise or context |
| `<agent>/baseline/` | The same task run with the profile alone, without the rubric, for comparison |
| `<agent>/results/` | Scorecards written by the CLI |

Cases and tasks are frozen once agents have been measured on them. Fixing the live lesson does not change a benchmark. To change one, build a new version and re-run the agents.

## Commands

```
cd packages/agents
npx tsx src/cli.ts prompt <agent> [--judge] [--out file]          # the exact system prompt
npx tsx src/cli.ts check <agent> <case> <output.json> [--label]   # score a reviewer run
npx tsx src/cli.ts make-check <agent> <task>                      # check a maker run, its judge and the judge's calibration
npx tsx src/cli.ts bench <agent>                                  # run through the API (needs ANTHROPIC_API_KEY)
python3 scripts/agents/degrade.py <agent> <task>                  # plant defects for judge calibration
```

## Limits, and the human calibration plan

These numbers measure the agents against rubrics and benchmarks that the build team wrote. A model judges the makers, and the build team adjudicated the reviewers' extra flags. None of that is yet a substitute for human experts. Before the scores are relied on:

1. **Expert review of the rubrics and references.** For each agent's domain, two experienced practitioners review its rubric and references: a curriculum designer, a learning-experience designer, a Hindi teacher and a Telugu teacher, a child-safety specialist, and two classroom teachers. Draft items are marked as drafts. In particular, `india-fairness-checklist.md`, `ai-misconceptions.md`, the Hindi and Telugu banned phrases, and the register guidance in `terminology-policy.md`.
2. **Judge–human agreement.** For each maker, two experts score the same recorded artifacts with the same rubric, blind to the judge. The judge is trusted when it agrees with the experts within one point on at least 80% of criterion scores, and never passes an artifact both experts fail.
3. **Adjudication by the creator.** The creator confirms or overturns the build team's verdicts in each `adjudication.json`.
4. **Benchmark growth.** At least five tasks or cases per agent, across modules 1–6, before scores are used to block model or prompt changes. Today there is one or two per agent.
5. **Repeat runs.** A score from a single run is one sample. For gating, each benchmark runs three times and the lowest score counts.
