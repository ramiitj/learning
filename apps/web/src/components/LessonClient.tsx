"use client";
import { useCallback } from "react";
import { BlockPreview, LessonView, Registry, type Detour, type Glossary, type LessonDoc, type LessonEvent, type Mode } from "@lm/engine";
import { primitives } from "@lm/primitives";
import { aiSimulations } from "@lm/sim-ai";
import { useAnonymousAnalytics } from "./analytics";
import { useLtiXapi } from "./ltiXapi";

const registry = new Registry([...primitives, ...aiSimulations]);

export function LessonClient({ analytics, ...props }: { lesson: LessonDoc; locale: string; mode: Mode; glossary: Glossary; detours: Record<string, Detour>; analytics?: boolean; preChecks?: boolean }) {
  const count = useAnonymousAnalytics({ lessonId: props.lesson.id, locale: props.locale, mode: props.mode, enabled: !!analytics });
  // Only for lessons launched from a school LMS with xAPI switched on (off by default; docs/proposals/lti-xapi.md).
  const xapi = useLtiXapi({ lessonId: props.lesson.id, locale: props.locale, mode: props.mode });
  const onEvent = useCallback(
    (e: LessonEvent) => {
      count(e);
      xapi(e);
    },
    [count, xapi],
  );
  return <LessonView {...props} registry={registry} onEvent={onEvent} />;
}

export function PreviewClient(props: { lesson: LessonDoc; blockId: string; locale: string; mode: Mode; glossary: Glossary; detours: Record<string, Detour> }) {
  return <BlockPreview {...props} registry={registry} />;
}
