# 09 — The Agent Operating System

## Components

The **orchestrator** (the Editor-in-Chief agent) plans and routes all content work through a fixed pipeline. **Agents** each have a skill profile in `platform/agents/` defining purpose, inputs, outputs, expertise, quality criteria, permissions and handoffs. The **shared artifact store** holds lessons, the concept graph, the analogy bank, glossaries, audience profiles, the design system and the constitution; agents collaborate by working on these artifacts, not by free-form messaging. The **permission system** enforces each profile's permissions at the tool level. The **event log** records every action, input, output, reasoning summary and cost, append-only. The **Creator Console** gives the creator visibility and control over all of it (see `docs/10`).

## The content pipeline

| Stage | Agents | Output |
|---|---|---|
| 1. Plan | Curriculum Architect | Objectives, concepts, prerequisites, audiences, placement in the graph |
| 2. Draft | Zero-Assumption Instructional Designer | Complete sequence following the lesson grammar, with detours |
| 3. Enrich | Analogy Specialist, Interaction Designer, Media Designer, Learning Experience Designer, Voice Editor | Analogies, component choices and configuration, media plans, experience design, final English text |
| 4. Localise | Localisation Specialist | Hindi and regional drafts, glossary updates |
| 5. Review (in parallel) | Novice Learner panel, Accuracy Reviewer, Child Safety & Ethics Reviewer, Accessibility Reviewer, Assessment Designer | Flags only; reviewers never edit |
| 6. Revise | The makers responsible for each flag | Resolved draft; unresolved conflicts go to the orchestrator |
| 7. Validate | Validation service | Pass, or return to stage 6 |
| 8. Teacher guide | Educator Enablement | Timing, prompts, misconceptions, classroom tips |
| 9. Creator preview | The creator | Approval, change requests, or rejection |
| 10. Human language review | Native-speaker reviewers | Approval per locale |
| 11. Publish | The creator | Live within seconds; previous version kept |

After publication, the Analytics agent, Feedback Triage and Freshness Auditor feed issues back to the orchestrator, which opens revision work.

## Conflict resolution

Conflicts are settled by the constitution's priority order: safety, accuracy, clarity, experience, aesthetics. The orchestrator resolves what the order settles; anything else goes to the creator's decision queue with both positions stated.

## Full roster

**Content studio:** Editor-in-Chief (orchestrator), Curriculum Architect, Zero-Assumption Instructional Designer, Subject Matter Expert (one per domain), Analogy & Metaphor Specialist, Learning Experience Designer, Interaction Designer, Visual & Media Designer, Voice Editor, Localisation Specialist.

**Review panel (critique only):** Novice Learners (several profiles), Accuracy Reviewer, Child Safety & Ethics Reviewer, Accessibility Reviewer, Assessment Designer.

**Platform team (Claude Code subagents):** Technical Architect, Interaction Engineer, Design System Engineer, CMS & MCP Engineer, QA Engineer, Security & Privacy Engineer, plus the Learning Experience Reviewer.

**Operations:** Learning Analytics & Research, Feedback Triage, Freshness Auditor, Educator Enablement.

## v1 starting set (ten agents)

The full roster is the mature state. v1 starts with ten, merging roles, and splits them as workload shows where one carries too much. Profiles for these are in `platform/agents/`:

| v1 agent | Covers |
|---|---|
| Editor-in-Chief | Orchestration |
| Curriculum & Instructional Designer | Curriculum Architect + Zero-Assumption Instructional Designer |
| Learning Experience & Interaction Designer | Learning Experience Designer + Interaction Designer + Voice Editor |
| Analogy & Metaphor Specialist | As named |
| Localisation Specialist | As named |
| Educator Enablement | Teacher guides and classroom materials |
| Novice Learner Panel | Four simulated learners: a class 8 English-medium student, a class 10 Hindi-medium student, a class 9 regional-language student, and a class 12 student who is confident but has gaps |
| Accuracy & Safety Reviewer | Accuracy Reviewer + Child Safety & Ethics Reviewer + Accessibility content checks |
| Technical Architect | Claude Code subagent |
| Engineer | Claude Code subagents (interaction, design system, CMS & MCP, QA, security) invoked as needed |

## Model tiers

Configured in `platform/config/models.json`. Design and instructional decisions use the most capable tier; drafting, enrichment and review use the balanced tier; routine checks and classification use the fast tier. Model versions are pinned. Upgrades happen only after the benchmark suite passes.

## Rubrics and enforcement

Every agent is bound by a rubric in `platform/rubrics/<agent>.json`, written from the constitution and the specs, with references in `platform/references/`. The runner (`packages/agents`) assembles each agent's system prompt from the constitution, its profile, its rubric and its references, in a fixed order so it can be cached.

- **Reviewers** (Accuracy & Safety Reviewer, Novice Learner Panel) must run and report every check in their rubric. Every flag needs a location, a quote, a reason and a fix, and its severity must follow the check. Their output contract is derived from the rubric, so they cannot skip a check or invent a category.
- **Makers** (Curriculum & Instructional Designer, Learning Experience Designer, Analogy Specialist, Localisation Specialist, Educator Enablement) are scored on criteria with anchored levels 0–4. Their artifacts must match the rubric's schema and pass automatic checks before anyone judges them: lesson grammar order, terms defined before use, objectives covered by checks, placeholders and numbers kept in translation, a guide that fits a page and a period.
- **The Editor-in-Chief** is scored on whether it applies the priority order and escalates exactly what must go to the creator.

Output that breaks the rubric is rejected. The agent is told exactly what broke and redoes it once. Output that still fails is blocked from the pipeline. An independent judge (a different model call, never the maker) scores the criteria that cannot be counted, and a maker passes only at the rubric's pass bar.

## Benchmarks and drift control

Each agent has a benchmark in `benchmarks/<agent>/`:
- reviewers: a lesson with planted defects (recall, blocking recall) and a clean lesson (false alarms); flags that match no planted defect are judged by a person (`adjudication.json`);
- makers: fixed tasks, with every recorded artifact checked automatically and scored by the judge;
- the Editor-in-Chief: conflict cases with known correct decisions.

The judge is calibrated too. Defects are planted in each recorded artifact, one per targeted criterion, and the judge must score each targeted criterion 2 or below. A judge that cannot see planted defects cannot be trusted to score real ones.

Recorded runs live in `runs/`, and CI (`pnpm test`) fails if any recorded run no longer satisfies its rubric or falls below its pass bar. The benchmarks are re-run whenever a prompt, profile, rubric, the constitution or a model version changes, and the change is blocked if quality drops. Results will be shown in the Creator Console. The rubrics and references are drafted by the build team and need calibration by human experts (see `benchmarks/README.md`).

## Cost control

Per-lesson cost is recorded in the event log. Repeated context (constitution, schema, profiles) is cached. A monthly budget is set by the creator; the orchestrator pauses non-urgent work and alerts the creator when 80% is reached.
