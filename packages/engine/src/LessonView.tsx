"use client";
import { Component, memo, useCallback, useEffect, useId, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { DEPTHS, type Block, type Depth, type Lesson } from "@lm/schema";
import { EngineContext, useEngine, useLessonState, useStoreSelector, type EngineValue } from "./context";
import { createLessonT, createUiT, FALLBACK_LOCALE } from "./i18n";
import { engineMessages } from "./messages";
import type { Registry } from "./registry";
import { LessonStore } from "./store";
import type { Detour, Glossary, GlossaryEntry, Mode, SetStateOptions, UiT } from "./types";
import { Button, Dialog } from "./ui";

export type LessonDoc = Pick<Lesson, "id" | "version" | "meta" | "stages" | "strings" | "localeStatus">;

export interface LessonViewProps {
  lesson: LessonDoc;
  locale: string;
  mode?: Mode;
  registry: Registry;
  glossary?: Glossary;
  detours?: Record<string, Detour>;
  /** Overrides where progress is kept; defaults to the lesson id and version. */
  storageKey?: string;
}

const depthRank = (d: Depth | undefined) => DEPTHS.indexOf(d ?? "core");
const recorded = new Set<string>();

function useScope(opts: { blocks: readonly Block[]; locale: string; mode: Mode; registry: Registry; strings: LessonDoc["strings"]; storageKey: string; glossary: Record<string, GlossaryEntry>; detours: Record<string, Detour>; openGlossary: (id?: string) => void; openDetour: (id: string) => void; announce: (m: string) => void; defaultDepth?: Depth }): EngineValue {
  const { blocks, locale, mode, registry, strings, storageKey, glossary, detours, openGlossary, openDetour, announce, defaultDepth } = opts;
  const [store] = useState(() => new LessonStore(storageKey, { defaultDepth }));
  const t = useMemo(() => createLessonT(locale, strings, (id, children, key) => <GlossaryTerm key={key} termId={id}>{children}</GlossaryTerm>), [locale, strings]);
  const ui = useMemo(() => createUiT(locale, [engineMessages]), [locale]);
  return useMemo(() => ({ blocks, locale, mode, registry, store, t, ui, glossary, detours, openGlossary, openDetour, announce }), [blocks, locale, mode, registry, store, t, ui, glossary, detours, openGlossary, openDetour, announce]);
}

/** Renders a whole lesson: header, controls, the six stages and their blocks, glossary and detours. */
export function LessonView({ lesson, locale, mode = "personal", registry, glossary = {}, detours = {}, storageKey }: LessonViewProps) {
  const key = storageKey ?? `lm:lesson:${lesson.id}:v${lesson.version}`;
  const [glossaryOpen, setGlossaryOpen] = useState<{ focus?: string } | null>(null);
  const [detourId, setDetourId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const localGlossary = useMemo(() => ({ ...(glossary[FALLBACK_LOCALE] ?? {}), ...(glossary[locale] ?? {}) }), [glossary, locale]);
  const openGlossary = useCallback((focus?: string) => setGlossaryOpen({ focus }), []);
  const announce = useCallback((m: string) => {
    setAnnouncement("");
    requestAnimationFrame(() => setAnnouncement(m));
  }, []);
  const blocks = useMemo(() => lesson.stages.flatMap((s) => s.blocks), [lesson]);
  const scope = useScope({ blocks, locale, mode, registry, strings: lesson.strings, storageKey: key, glossary: localGlossary, detours, openGlossary, openDetour: setDetourId, announce });
  const { store, t, ui } = scope;
  const state = useLessonState(store);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (!recorded.has(key)) {
      recorded.add(key);
      store.recordVisit();
    }
    if (typeof location !== "undefined" && location.hash === "#resume") {
      const last = store.getState().lastBlock;
      const el = last ? document.getElementById(`block-${last}`) : null;
      el?.scrollIntoView({ block: "start" });
      el?.focus({ preventScroll: true });
    }
  }, [key, store]);

  const termsInLesson = useMemo(() => {
    const ids = new Set<string>();
    for (const s of lesson.stages) for (const b of s.blocks) b.glossaryTerms?.forEach((g) => ids.add(g));
    for (const table of [lesson.strings[locale] ?? {}, lesson.strings[FALLBACK_LOCALE] ?? {}]) {
      for (const msg of Object.values(table)) for (const m of msg.matchAll(/<term-([a-z0-9-]+)>/g)) ids.add(m[1]!);
    }
    return [...ids].filter((id) => id in localGlossary);
  }, [lesson, locale, localGlossary]);

  const firstOfType = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of lesson.stages) for (const b of s.blocks) if (!seen.has(b.type)) seen.set(b.type, b.id);
    return new Set(seen.values());
  }, [lesson]);

  const titleId = useId();
  const draftLocale = locale !== FALLBACK_LOCALE && lesson.localeStatus[locale] !== "reviewed";

  return (
    <EngineContext.Provider value={scope}>
      <article className="lm-lesson" lang={locale} data-mode={mode} aria-labelledby={titleId} data-hydrated={hydrated || undefined}>
        <header className="lm-lesson__header">
          {lesson.meta.subtitleKey ? <p className="lm-eyebrow">{ui("lesson.minutes", { n: lesson.meta.estimatedMinutes })}</p> : null}
          <h1 id={titleId} className="lm-lesson__title">{t.rich(lesson.meta.titleKey)}</h1>
          {lesson.meta.subtitleKey ? <p className="lm-lesson__subtitle">{t.rich(lesson.meta.subtitleKey)}</p> : null}
          {draftLocale ? <p className="lm-notice" role="note">{ui("draft.translation")}</p> : null}
        </header>

        <Toolbar depth={state.depth} hasGlossary={termsInLesson.length > 0} />

        {state.visits > 1 ? <RecallWarmup lesson={lesson} /> : null}

        {lesson.stages.map((stage, si) => (
          <section key={`${stage.stage}-${si}`} className="lm-stage" data-stage={stage.stage} aria-labelledby={`${titleId}-s${si}`}>
            <h2 id={`${titleId}-s${si}`} className="lm-stage__eyebrow">{ui(`stage.${stage.stage}`)}</h2>
            {stage.blocks.map((block) =>
              depthRank(block.depth) <= depthRank(state.depth) || state.expanded.includes(block.id) ? (
                <BlockFrame key={block.id} block={block} firstUse={firstOfType.has(block.id)} />
              ) : (
                <DeeperTeaser key={block.id} blockId={block.id} />
              ),
            )}
          </section>
        ))}
      </article>

      <GlossaryDialog open={glossaryOpen !== null} focus={glossaryOpen?.focus} termIds={termsInLesson} onClose={() => setGlossaryOpen(null)} />
      <DetourDialog detourId={detourId} parentKey={key} onClose={() => setDetourId(null)} />
      <div className="lm-sr-only" aria-live="polite" role="status">{announcement}</div>
    </EngineContext.Provider>
  );
}

function Toolbar({ depth, hasGlossary }: { depth: Depth; hasGlossary: boolean }) {
  const { store, ui, announce, openGlossary } = useEngine();
  const [confirm, setConfirm] = useState(false);
  const confirmId = useId();
  const depthName = useId();
  const onUndo = () => {
    const blockId = store.undo();
    announce(ui(blockId ? "undo.done" : "undo.none"));
    if (blockId) document.getElementById(`block-${blockId}`)?.scrollIntoView({ block: "nearest" });
  };
  return (
    <div className="lm-toolbar" role="toolbar" aria-label={ui("lesson.controls")}>
      <fieldset className="lm-depth">
        <legend>{ui("depth.label")}</legend>
        <div className="lm-depth__options">
          {DEPTHS.map((d) => (
            <label key={d} className="lm-pill" data-selected={depth === d || undefined}>
              <input type="radio" name={depthName} value={d} checked={depth === d} onChange={() => store.setDepth(d)} />
              <span>{ui(`depth.${d}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="lm-toolbar__actions">
        {hasGlossary ? <Button variant="quiet" onClick={() => openGlossary()}>{ui("glossary.open")}</Button> : null}
        <Button variant="quiet" onClick={onUndo}>{ui("undo")}</Button>
        <Button variant="quiet" onClick={() => setConfirm(true)}>{ui("resetAll")}</Button>
      </div>
      <Dialog open={confirm} onClose={() => setConfirm(false)} labelledBy={confirmId} className="lm-dialog--small">
        <p id={confirmId}>{ui("resetAll.confirm")}</p>
        <div className="lm-row">
          <Button variant="primary" onClick={() => { store.resetAll(); setConfirm(false); }}>{ui("resetAll.yes")}</Button>
          <Button onClick={() => setConfirm(false)}>{ui("resetAll.no")}</Button>
        </div>
      </Dialog>
    </div>
  );
}

function DeeperTeaser({ blockId }: { blockId: string }) {
  const { store, ui } = useEngine();
  return (
    <div className="lm-deeper">
      <span>{ui("deeper.teaser")}</span>
      <Button variant="quiet" onClick={() => store.expand(blockId)}>{ui("deeper.open")}</Button>
    </div>
  );
}

class BlockErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Lesson block failed to render", error, info.componentStack);
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Wraps one block: first-use help, the component itself, words, detours and reset. */
export const BlockFrame = memo(function BlockFrame({ block, firstUse }: { block: Block; firstUse: boolean }) {
  const engine = useEngine();
  const { registry, store, locale, mode, t, ui } = engine;
  const blockState = useStoreSelector(store, (s) => s.blocks[block.id]);
  const howToSeen = useStoreSelector(store, (s) => s.seenHowTo.includes(block.type));
  const plugin = registry.get(block.type, block.componentVersion);
  const componentUi = useMemo(() => createUiT(locale, [registry.messages, engineMessages], block.type), [locale, registry, block.type]);
  const setState = useCallback((next: unknown, opts?: SetStateOptions) => store.setBlock(block.id, next, opts), [store, block.id]);
  const readBlock = useCallback(<T,>(id: string) => store.getBlock<T>(id), [store]);
  const config = useMemo(() => ({ ...block.config, ...(mode === "classroom" ? (block.classroom ?? {}) : {}) }), [block, mode]);

  const missing = <p className="lm-notice" role="note">{ui("missing.component")}</p>;
  if (!plugin) {
    return (
      <div className="lm-block" id={`block-${block.id}`} data-type={block.type} tabIndex={-1}>
        {missing}
      </div>
    );
  }
  const Render = mode === "classroom" ? plugin.classroom : plugin.personal;
  const showHowTo = firstUse && !howToSeen && componentUi("howto") !== "howto";

  return (
    <div className="lm-block" id={`block-${block.id}`} data-type={block.type} tabIndex={-1} onFocusCapture={() => store.touch(block.id)}>
      {showHowTo ? (
        <aside className="lm-howto" aria-label={ui("howto.title")}>
          <p>{componentUi("howto")}</p>
          <Button variant="quiet" onClick={() => store.markHowToSeen(block.type)}>{ui("howto.dismiss")}</Button>
        </aside>
      ) : null}
      <BlockErrorBoundary fallback={missing}>
        <Render block={block} config={config} mode={mode} state={blockState} setState={setState} readBlock={readBlock} t={t} ui={componentUi} locale={locale} />
      </BlockErrorBoundary>
      <BlockFooter block={block} canReset={blockState !== undefined} />
    </div>
  );
});

function BlockFooter({ block, canReset }: { block: Block; canReset: boolean }) {
  const { glossary, detours, store, locale, ui, openDetour } = useEngine();
  const terms = (block.glossaryTerms ?? []).filter((g) => g in glossary);
  const offered = (block.detours ?? []).filter((d) => d in detours);
  if (!terms.length && !offered.length && !canReset) return null;
  return (
    <div className="lm-block__footer">
      {terms.length ? (
        <div className="lm-words">
          <span className="lm-words__label">{ui("glossary.here")}</span>
          {terms.map((id) => (
            <GlossaryTerm key={id} termId={id} chip>{glossary[id]!.term}</GlossaryTerm>
          ))}
        </div>
      ) : null}
      {offered.map((d) => (
        <Button key={d} variant="quiet" className="lm-detour-offer" onClick={() => openDetour(d)}>
          {ui("detour.offer", { title: detourTitle(detours[d]!, locale) })}
        </Button>
      ))}
      {canReset ? (
        <Button variant="quiet" className="lm-reset" onClick={() => store.resetBlock(block.id)}>{ui("reset")}</Button>
      ) : null}
    </div>
  );
}

/** A detour's title lives in the detour's own strings, not the lesson's. */
function detourTitle(d: Detour, locale: string): string {
  return createLessonT(locale, d.strings, (_id, children) => children).text(d.titleKey);
}

/** A glossary term: tap to see its definition in place, without leaving the sentence. */
export function GlossaryTerm({ termId, children, chip = false }: { termId: string; children: ReactNode; chip?: boolean }) {
  const { glossary, ui } = useEngine();
  const [open, setOpen] = useState(false);
  const defId = useId();
  const entry = glossary[termId];
  if (!entry) return <>{children}</>;
  return (
    <span className="lm-term-wrap">
      <button type="button" className={chip ? "lm-term lm-term--chip" : "lm-term"} aria-expanded={open} aria-controls={defId} onClick={() => setOpen(!open)}>
        {children}
      </button>
      <span id={defId} className="lm-term__def" hidden={!open} role="note" aria-label={ui("glossary.definitionOf", { term: entry.term })}>
        {entry.definition}
      </span>
    </span>
  );
}

function GlossaryDialog({ open, focus, termIds, onClose }: { open: boolean; focus?: string; termIds: string[]; onClose: () => void }) {
  const { glossary, ui } = useEngine();
  const titleId = useId();
  const listRef = useRef<HTMLDListElement>(null);
  useEffect(() => {
    if (open && focus) listRef.current?.querySelector<HTMLElement>(`[data-term="${focus}"]`)?.scrollIntoView({ block: "center" });
  }, [open, focus]);
  const sorted = [...termIds].sort((a, b) => glossary[a]!.term.localeCompare(glossary[b]!.term));
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId}>
      <div className="lm-dialog__head">
        <h2 id={titleId}>{ui("glossary.title")}</h2>
        <Button variant="quiet" onClick={onClose}>{ui("glossary.close")}</Button>
      </div>
      {sorted.length ? (
        <dl ref={listRef} className="lm-glossary">
          {sorted.map((id) => (
            <div key={id} data-term={id} data-focus={focus === id || undefined}>
              <dt>{glossary[id]!.term}</dt>
              <dd>{glossary[id]!.definition}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>{ui("glossary.empty")}</p>
      )}
    </Dialog>
  );
}

/** A detour runs as a small lesson inside a dialog; closing it returns to the exact spot. */
function DetourDialog({ detourId, parentKey, onClose }: { detourId: string | null; parentKey: string; onClose: () => void }) {
  const parent = useEngine();
  const titleId = useId();
  const detour = detourId ? parent.detours[detourId] : undefined;
  return (
    <Dialog open={!!detour} onClose={onClose} labelledBy={titleId} className="lm-dialog--detour">
      {detour ? <DetourBody key={detour.id} detour={detour} parentKey={parentKey} titleId={titleId} onClose={onClose} /> : null}
    </Dialog>
  );
}

function DetourBody({ detour, parentKey, titleId, onClose }: { detour: Detour; parentKey: string; titleId: string; onClose: () => void }) {
  const parent = useEngine();
  const scope = useScope({ ...parent, blocks: detour.blocks, strings: detour.strings, storageKey: `${parentKey}:detour:${detour.id}` });
  return (
    <EngineContext.Provider value={scope}>
      <div className="lm-dialog__head">
        <div>
          <p className="lm-eyebrow">{scope.ui("detour.label")}</p>
          <h2 id={titleId}>{scope.t.rich(detour.titleKey)}</h2>
        </div>
      </div>
      <div lang={parent.locale}>
        {detour.blocks.map((b, i) => (
          <BlockFrame key={b.id} block={b} firstUse={i === 0} />
        ))}
      </div>
      <Button variant="primary" onClick={onClose}>{scope.ui("detour.back")}</Button>
    </EngineContext.Provider>
  );
}

/** For returning learners: a light look back at something they made, before carrying on. */
function RecallWarmup({ lesson }: { lesson: LessonDoc }) {
  const { registry, store, locale, t } = useEngine();
  const state = useLessonState(store);
  const [dismissed, setDismissed] = useState(false);
  const ui = useMemo(() => createUiT(locale, [engineMessages]), [locale]);
  const titleId = useId();
  const blockStates = state.blocks;
  const recall = useMemo(() => {
    for (const s of lesson.stages)
      for (const b of s.blocks) {
        const p = registry.get(b.type, b.componentVersion);
        const summary = p?.summarize?.(blockStates[b.id], b.config, t, createUiT(locale, [registry.messages, engineMessages], b.type) as UiT);
        if (summary) return { blockId: b.id, summary };
      }
    return null;
  }, [lesson, registry, blockStates, t, locale]);
  if (!recall || dismissed) return null;
  const jump = () => {
    const el = document.getElementById(`block-${recall.blockId}`);
    el?.scrollIntoView({ block: "start" });
    el?.focus({ preventScroll: true });
    setDismissed(true);
  };
  return (
    <section className="lm-recall" aria-labelledby={titleId}>
      <h2 id={titleId}>{ui("recall.title")}</h2>
      <p>{ui("recall.body")}</p>
      <blockquote>{recall.summary}</blockquote>
      <p>{ui("recall.question")}</p>
      <div className="lm-row">
        <Button variant="primary" onClick={() => setDismissed(true)}>{ui("recall.keep")}</Button>
        <Button onClick={jump}>{ui("recall.jump")}</Button>
      </div>
    </section>
  );
}

/**
 * One block on its own, in a chosen mode, with its own saved state. Used by
 * the component preview page so personal and classroom variants can be
 * reviewed side by side in every locale.
 */
export function BlockPreview({ lesson, blockId, locale, mode, registry, glossary = {}, detours = {} }: Omit<LessonViewProps, "storageKey" | "mode"> & { blockId: string; mode: Mode }) {
  const block = useMemo(() => lesson.stages.flatMap((s) => s.blocks).find((b) => b.id === blockId), [lesson, blockId]);
  const blocks = useMemo(() => (block ? [block] : []), [block]);
  const localGlossary = useMemo(() => ({ ...(glossary[FALLBACK_LOCALE] ?? {}), ...(glossary[locale] ?? {}) }), [glossary, locale]);
  const noop = useCallback(() => {}, []);
  const scope = useScope({ blocks, locale, mode, registry, strings: lesson.strings, storageKey: `lm:preview:${lesson.id}:${blockId}:${mode}`, glossary: localGlossary, detours, openGlossary: noop, openDetour: noop, announce: noop });
  if (!block) return null;
  return (
    <EngineContext.Provider value={scope}>
      <div className="lm-preview" data-mode={mode} lang={locale}>
        <BlockFrame block={block} firstUse />
      </div>
    </EngineContext.Provider>
  );
}
