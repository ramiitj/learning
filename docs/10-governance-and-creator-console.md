# 10 — Governance and the Creator Console

## The creator role

The creator holds final authority over the platform: its functioning, design, content, agents, data policies and every element within it. The role sits above every agent and every other future human role.

## Governance through documents

The creator governs primarily by writing the rules the system follows: the constitution, agent skill profiles, audience profiles, the design system, the analogy bank rules and the autonomy settings. All are versioned documents editable in the console. Changing them changes the behaviour of the whole system. Agents may propose changes; only the creator adopts them.

## Console modules

| Module | What the creator can do |
|---|---|
| Command channel | Instruct the Editor-in-Chief or any individual agent in conversation |
| Pipeline | See every lesson in progress, its stage, the agent working on it, cost so far |
| Decision queue | Approve publishes, settle conflicts, approve new components, agents, permissions and amendments, see dissent before overriding |
| Agent registry | Read and edit profiles and permissions, switch agents on or off, add agents, see each agent's benchmark scores and costs |
| Constitution | Edit, version and review the history of the constitution |
| Content | Every lesson, issue, concept, analogy and glossary entry, with versions, diffs and one-click rollback |
| Translation review | Assign and track native-speaker reviews per locale |
| Media | Assets, provenance, licences, review status |
| Platform | Component registry, design system, audience profiles, feature flags, deployments (production deploys require approval) |
| Analytics | Learning gains, misconceptions, completion, drop-off points, detour usage, per lesson and locale |
| Feedback | Triaged reports from learners and teachers |
| Audit log | Every agent and human action: what, when, why, what changed |
| Budget | Spend by agent, lesson and service; monthly limit |
| Access | Creator security settings; delegate management (later) |

## Autonomy settings

Each action type has a setting the creator controls in `platform/config/autonomy.json`.

| Setting | Meaning |
|---|---|
| Always ask | Nothing happens without explicit approval |
| Act and notify | The agent proceeds; the action appears in a daily digest and can be reversed |
| Autonomous | Routine, logged, not surfaced unless it fails |

v1 defaults: **always ask** for publishing, unpublishing, deleting, production deploys, schema changes, new components, new agents, permission changes, constitution amendments, anything touching learner data, and any spend beyond the monthly budget. **Act and notify** for draft revisions, analogy bank and glossary additions, and fixes to validation flags. **Autonomous** for validation runs, simulated reviews, test runs, benchmarks and analytics reports.

## Informed override

The creator can override any agent, including reviewers. Before the override takes effect the console shows the dissenting agent's reasoning; the creator records a short reason; the override is logged. Where an override would breach a legal obligation (for example, children's data protection), the console states this clearly before confirmation.

## Security of the creator account

Passkey or hardware-key authentication; separate creator and learner-view accounts; short admin sessions with re-authentication for high-impact actions; a documented and tested account recovery procedure; all creator actions in the audit log.

## Delegation (later)

The creator can grant a trusted delegate a limited, explicitly defined set of powers (for example, approving translation reviews or rolling back a lesson), revocable at any time. Delegates can never amend the constitution, change permissions or change data handling.
