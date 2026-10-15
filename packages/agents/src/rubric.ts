import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Repository root (packages/agents/src → ../../..). */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export interface ReviewerCheck {
  id: string;
  name: string;
  description: string;
  defaultSeverity: "blocking" | "advisory";
  advisoryWhen?: string;
  examples?: string[];
}

export interface Criterion {
  id: string;
  name: string;
  weight: number;
  blocking: boolean;
  description: string;
  /** Anchored descriptors for scores 0-4. */
  levels: Record<"0" | "1" | "2" | "3" | "4", string>;
}

interface RubricBase {
  agent: string;
  version: string;
  role: string;
  references: string[];
  method: string[];
}

/** Reviewers critique: they must run every check and report flags in a fixed shape. */
export interface ReviewerRubric extends RubricBase {
  kind: "reviewer";
  checks: ReviewerCheck[];
  flagCategories: string[];
  reportQuality: { id: string; rule: string }[];
  /** Simulated people the reviewer plays (the novice panel). Each must report. */
  personas?: { id: string; name: string; locale: string; profile: string }[];
  passBar: { blockingRecall: number; overallRecall: number; precision: number; maxCleanBlockingFlags: number };
}

/** Makers produce artifacts; a separate judge scores the artifact against anchored criteria. */
export interface MakerRubric extends RubricBase {
  kind: "maker";
  criteria: Criterion[];
  /** JSON Schema for the maker's artifact. */
  artifactSchema: object;
  passBar: { meanScore: number; minBlockingCriterion: number };
}

export type Rubric = ReviewerRubric | MakerRubric;

export interface AgentKit {
  id: string;
  profile: string;
  rubric: Rubric;
  references: { id: string; text: string }[];
  constitution: string;
  tier: string;
  model: string;
}

const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");

function referencePath(id: string): string {
  for (const ext of [".md", ".json"]) {
    const p = `platform/references/${id}${ext}`;
    if (existsSync(path.join(ROOT, p))) return p;
  }
  throw new Error(`reference "${id}" not found in platform/references`);
}

/** Model tier per agent, from the profile's "Model tier." line and platform/config/models.json. */
function modelFor(profile: string): { tier: string; model: string } {
  const tiers = JSON.parse(read("platform/config/models.json")).tiers as Record<string, { model: string }>;
  const m = /\*\*Model tier\.\*\*\s*([A-Za-z -]+?)[.(]/.exec(profile);
  const label = (m?.[1] ?? "balanced").trim().toLowerCase();
  const tier = label.startsWith("most") ? "most-capable" : label.startsWith("fast") ? "fast" : "balanced";
  return { tier, model: tiers[tier]!.model };
}

export function loadAgent(id: string): AgentKit {
  const profile = read(`platform/agents/${id}.md`);
  const rubric = JSON.parse(read(`platform/rubrics/${id}.json`)) as Rubric;
  if (rubric.agent !== id) throw new Error(`rubric ${id}.json names agent "${rubric.agent}"`);
  const references = rubric.references.map((r) => ({ id: r, text: read(referencePath(r)) }));
  return { id, profile, rubric, references, constitution: read("platform/constitution.md"), ...modelFor(profile) };
}
