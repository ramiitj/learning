"use client";
import { createContext, useContext, useSyncExternalStore } from "react";
import type { LessonStore, LessonState } from "./store";
import { initialLessonState } from "./store";
import type { Registry } from "./registry";
import type { Detour, GlossaryEntry, LessonT, Mode, UiT } from "./types";

export interface EngineValue {
  locale: string;
  mode: Mode;
  registry: Registry;
  store: LessonStore;
  t: LessonT;
  ui: UiT;
  glossary: Record<string, GlossaryEntry>;
  detours: Record<string, Detour>;
  openGlossary: (termId?: string) => void;
  openDetour: (detourId: string) => void;
  announce: (message: string) => void;
}

export const EngineContext = createContext<EngineValue | null>(null);

export function useEngine(): EngineValue {
  const v = useContext(EngineContext);
  if (!v) throw new Error("useEngine must be used inside a lesson");
  return v;
}

const serverSnapshot = initialLessonState();

/** Subscribe to lesson state. During hydration the untouched state is used so server and client HTML agree. */
export function useLessonState(store: LessonStore): LessonState {
  return useSyncExternalStore(store.subscribe, store.getState, () => serverSnapshot);
}

/** Subscribe to one slice of lesson state; the component re-renders only when that slice changes. */
export function useStoreSelector<T>(store: LessonStore, selector: (s: LessonState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()), () => selector(serverSnapshot));
}

/** Reactive read of any block's state, for components that build on earlier blocks. */
export function useBlockState<T = unknown>(blockId: string): T | undefined {
  const { store } = useEngine();
  return useStoreSelector(store, (s) => s.blocks[blockId] as T | undefined);
}
