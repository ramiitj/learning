# Platform agent skill profiles

These are the content and review agents that run inside the platform's agent operating system (see `docs/09`). The orchestrator loads the constitution, then the relevant profile, before each agent acts. Only the creator can edit these files. Every profile uses the same structure: purpose, inputs, outputs, expertise, how it works, quality criteria, permissions, handoffs, model tier.

Build-time agents for Claude Code are separate, in `.claude/agents/`.
