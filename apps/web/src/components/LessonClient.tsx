"use client";
import { BlockPreview, LessonView, Registry, type Detour, type Glossary, type LessonDoc, type Mode } from "@lm/engine";
import { primitives } from "@lm/primitives";

const registry = new Registry(primitives);

export function LessonClient(props: { lesson: LessonDoc; locale: string; mode: Mode; glossary: Glossary; detours: Record<string, Detour> }) {
  return <LessonView {...props} registry={registry} />;
}

export function PreviewClient(props: { lesson: LessonDoc; blockId: string; locale: string; mode: Mode; glossary: Glossary; detours: Record<string, Detour> }) {
  return <BlockPreview {...props} registry={registry} />;
}
