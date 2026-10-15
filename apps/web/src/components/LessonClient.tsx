"use client";
import { BlockPreview, LessonView, Registry, type Detour, type Glossary, type LessonDoc, type Mode } from "@lm/engine";
import { primitives } from "@lm/primitives";
import { aiSimulations } from "@lm/sim-ai";
import { useAnonymousAnalytics } from "./analytics";

const registry = new Registry([...primitives, ...aiSimulations]);

export function LessonClient({ analytics, ...props }: { lesson: LessonDoc; locale: string; mode: Mode; glossary: Glossary; detours: Record<string, Detour>; analytics?: boolean }) {
  const onEvent = useAnonymousAnalytics({ lessonId: props.lesson.id, locale: props.locale, mode: props.mode, enabled: !!analytics });
  return <LessonView {...props} registry={registry} onEvent={onEvent} />;
}

export function PreviewClient(props: { lesson: LessonDoc; blockId: string; locale: string; mode: Mode; glossary: Glossary; detours: Record<string, Detour> }) {
  return <BlockPreview {...props} registry={registry} />;
}
