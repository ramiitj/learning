/**
 * Learning moments the engine can report (docs/12: learning gains,
 * misconceptions, completion, drop-off, detour, depth, glossary and hint
 * use). They carry no identifier and no time: the app decides whether to
 * count them, and only ever as anonymous daily totals (docs/11).
 */
export type LessonEvent =
  | { type: "start"; returning: boolean }
  | { type: "act"; blockId: string; component: string }
  | { type: "answer"; blockId: string; component: string; choice: string; correct?: boolean }
  | { type: "post-check"; itemId: string; correct: boolean; firstTry: boolean }
  | { type: "pre-check"; itemId: string; correct: boolean }
  | { type: "depth"; depth: string }
  | { type: "expand"; blockId: string }
  | { type: "detour"; detourId: string }
  | { type: "glossary"; termId?: string };

export type OnLessonEvent = (e: LessonEvent) => void;
