import Anthropic from "@anthropic-ai/sdk";
import { enforceArtifact, enforceJudge, enforceReviewer, type Violation } from "./enforce";
import { judgeOutputSchema, reviewerOutputSchema } from "./contract";
import { judgePrompt, systemPrompt } from "./prompt";
import type { AgentKit, MakerRubric } from "./rubric";

export interface RunResult {
  output: unknown;
  violations: Violation[];
  attempts: number;
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number };
}

const MAX_ATTEMPTS = 2;

/**
 * Runs an agent on one input through the Messages API. The system prompt
 * (constitution, profile, rubric, references) is cached; the response is
 * constrained to the rubric's JSON schema; the rubric enforcer then checks
 * what a schema cannot (every check reported, severities, locations). On a
 * violation the agent is told exactly what broke the rubric and redoes it;
 * output that still violates the rubric is returned with its violations so
 * the pipeline can block it.
 */
export async function runReviewer(kit: AgentKit, input: unknown, client = new Anthropic()): Promise<RunResult> {
  if (kit.rubric.kind !== "reviewer") throw new Error(`${kit.id} is not a reviewer`);
  const rubric = kit.rubric;
  return runWithRubric(client, kit.model, systemPrompt(kit), reviewerOutputSchema(rubric) as unknown as Record<string, unknown>, input, (o) => enforceReviewer(o, rubric));
}

/** Runs a maker on a task: schema-constrained output, then the deterministic checks, with one redo on failure. */
export async function runMaker(kit: AgentKit, task: unknown, client = new Anthropic()): Promise<RunResult> {
  if (kit.rubric.kind !== "maker") throw new Error(`${kit.id} is not a maker`);
  const rubric = kit.rubric as MakerRubric;
  return runWithRubric(client, kit.model, systemPrompt(kit), rubric.artifactSchema as Record<string, unknown>, task, (o) => enforceArtifact(o, rubric, task));
}

export async function runJudge(kit: AgentKit, artifact: unknown, task: unknown, client = new Anthropic()): Promise<RunResult> {
  if (kit.rubric.kind !== "maker") throw new Error(`${kit.id} is not a maker`);
  const rubric = kit.rubric as MakerRubric;
  return runWithRubric(client, "claude-opus-5-5", judgePrompt(kit), judgeOutputSchema(rubric) as unknown as Record<string, unknown>, { task, artifact }, (o) => enforceJudge(o, rubric));
}

async function runWithRubric(client: Anthropic, model: string, system: string, schema: Record<string, unknown>, input: unknown, enforce: (o: unknown) => Violation[]): Promise<RunResult> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: JSON.stringify(input) }];
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  let output: unknown = null;
  let violations: Violation[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const stream = client.messages.stream({
      model,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: { type: "json_schema", schema } },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral", ttl: "1h" } }],
      messages,
    });
    const response = await stream.finalMessage();
    usage.input += response.usage.input_tokens;
    usage.output += response.usage.output_tokens;
    usage.cacheRead += response.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += response.usage.cache_creation_input_tokens ?? 0;
    if (response.stop_reason === "refusal") throw new Error(`agent refused: ${response.stop_details?.explanation ?? "no explanation"}`);
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    try {
      output = JSON.parse(text);
      violations = enforce(output);
    } catch {
      violations = [{ rule: "schema", detail: "response was not valid JSON" }];
    }
    if (violations.length === 0) return { output, violations, attempts: attempt, usage };
    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: `Your output broke the rubric and was rejected:\n${violations.map((x) => `- ${x.rule}: ${x.detail}`).join("\n")}\nRedo the work, following the rubric exactly, and return the complete JSON.`,
    });
  }
  return { output, violations, attempts: MAX_ATTEMPTS, usage };
}
