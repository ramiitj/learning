/**
 * Types for lesson documents. They mirror `schemas/lesson.schema.json`, which
 * stays the single authority; `validate.ts` checks documents against it.
 */

export const SCHEMA_VERSION = "1.0";

export type StageName = "hook" | "predict" | "manipulate" | "explain" | "break-it" | "transfer-reflect";
export const STAGE_ORDER: readonly StageName[] = ["hook", "predict", "manipulate", "explain", "break-it", "transfer-reflect"];

export type Depth = "core" | "deeper" | "deepest";
export const DEPTHS: readonly Depth[] = ["core", "deeper", "deepest"];

export type LessonStatus = "draft" | "in-review" | "awaiting-creator" | "published" | "archived";
export type LocaleReview = "missing" | "draft" | "reviewed";

/** A block's config is opaque here; each component's contract validates it. */
export type BlockConfig = Record<string, unknown>;

export interface Block<C extends BlockConfig = BlockConfig> {
  id: string;
  type: string;
  componentVersion: string;
  config: C;
  depth?: Depth;
  classroom?: Record<string, unknown>;
  detours?: string[];
  glossaryTerms?: string[];
}

export interface Stage {
  stage: StageName;
  blocks: Block[];
}

export interface CheckItem {
  id: string;
  objective: string;
  promptKey: string;
  options: string[];
  answer: string;
  feedbackKey?: string;
}

export interface LessonMeta {
  titleKey: string;
  subtitleKey?: string;
  subject: string;
  course?: string;
  module?: string;
  issue?: string;
  concepts: string[];
  objectives: { id: string; textKey: string }[];
  prerequisites: string[];
  audiences: string[];
  curriculumTags?: string[];
  estimatedMinutes: number;
  teacherGuide?: string;
  parentPage?: string;
  provenance?: string;
}

/** Locale code -> (string key -> ICU message). */
export type Strings = Record<string, Record<string, string>>;

export interface Lesson {
  id: string;
  schemaVersion: string;
  version: number;
  status: LessonStatus;
  meta: LessonMeta;
  stages: Stage[];
  checks: { pre: CheckItem[]; post: CheckItem[] };
  strings: Strings;
  localeStatus: Record<string, LocaleReview>;
}

/**
 * The pure (React-free) half of a component plugin: what the validator and the
 * CMS need to know. The rendering half lives with the component.
 */
export interface ComponentContract {
  type: string;
  /** Versions this component can render. Lessons pin one of these. */
  versions: readonly string[];
  /** JSON Schema for `block.config`. */
  configSchema: object;
  /** Lesson string keys the config refers to, so locale completeness can be checked. */
  stringKeys: (config: BlockConfig) => string[];
  /** Other block ids the config refers to (shared lesson state). */
  blockRefs?: (config: BlockConfig) => string[];
  /** The learner act this component asks for (constitution, Article 4). */
  act: "decide" | "predict" | "build" | "explore" | "explain" | "connective";
}

/** Iterate every block in lesson order. */
export function* allBlocks(lesson: Pick<Lesson, "stages">): Generator<{ stage: StageName; block: Block; index: number }> {
  let index = 0;
  for (const s of lesson.stages) for (const block of s.blocks) yield { stage: s.stage, block, index: index++ };
}
