import type { ComponentType, ReactNode } from "react";
import type { Block, BlockConfig, ComponentContract, Lesson } from "@lm/schema";

export type Mode = "personal" | "classroom";

/** Translator for lesson content strings (the lesson's `strings` table). */
export interface LessonT {
  /** Plain text, for attributes and aria labels. */
  text: (key: string, values?: Record<string, string | number>) => string;
  /** Rich text: glossary terms (`<term-id>word</term-id>`), `<b>` and `<em>`. */
  rich: (key: string, values?: Record<string, string | number>) => ReactNode;
  has: (key: string) => boolean;
}

/** Translator for interface strings shipped with the engine and each component. */
export type UiT = (key: string, values?: Record<string, string | number>) => string;

export interface SetStateOptions {
  /** Merge with the previous undo step when the same block changes again quickly (sliders, typing). */
  coalesce?: boolean;
}

export interface BlockProps<C extends BlockConfig = BlockConfig, S = unknown> {
  block: Block<C>;
  config: C;
  mode: Mode;
  /** This block's saved state, or undefined before the learner has acted. */
  state: S | undefined;
  setState: (next: S | ((prev: S | undefined) => S), opts?: SetStateOptions) => void;
  /** Read another block's state (shared lesson state, e.g. data typed earlier). */
  readBlock: <T = unknown>(blockId: string) => T | undefined;
  t: LessonT;
  /** Interface strings; keys are looked up in this component's namespace, then in the engine's. */
  ui: UiT;
  locale: string;
}

/** A plugin is the contract plus renderers for both modes plus its interface strings. */
export interface ComponentPlugin<C extends BlockConfig = BlockConfig, S = unknown> extends ComponentContract {
  personal: ComponentType<BlockProps<C, S>>;
  classroom: ComponentType<BlockProps<C, S>>;
  /** Interface strings per locale, namespaced under the component type. Must include every launch locale. */
  messages: Record<string, Record<string, string>>;
  /**
   * One line describing what the learner made in this block, for takeaways
   * and the recall warm-up. Returns null when nothing has been made yet.
   */
  summarize?: (state: S | undefined, config: C, t: LessonT, ui: UiT) => string | null;
}

// Plugins are heterogeneous; the registry stores them with erased generics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPlugin = ComponentPlugin<any, any>;

export interface GlossaryEntry {
  term: string;
  definition: string;
}
/** Locale -> term id -> entry. */
export type Glossary = Record<string, Record<string, GlossaryEntry>>;

/** A detour: a short prerequisite side path, rendered with the same engine. */
export interface Detour {
  id: string;
  titleKey: string;
  blocks: Block[];
  strings: Lesson["strings"];
}
