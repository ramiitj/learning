"use client";
import { Component, memo, useCallback, type CSSProperties, useEffect, useId, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { DEPTHS, type Block, type CheckItem, type Depth, type Lesson } from "@lm/schema";
import { EngineContext, useEngine, useLessonState, useStoreSelector, type EngineValue } from "./context";
import { BlockIdContext } from "./live";
import type { OnLessonEvent } from "./analytics";
import { createLessonT, createUiT, FALLBACK_LOCALE } from "./i18n";
import { engineMessages } from "./messages";
import type { Registry } from "./registry";
import { LessonStore } from "./store";
import type { Detour, Glossary, GlossaryEntry, Mode, SetStateOptions, UiT } from "./types";
import { Button, ChoiceGroup, Dialog, Icon, useFocusAfter } from "./ui";

export type LessonDoc = Pick<Lesson, "id" | "version" | "meta" | "stages" | "strings" | "localeStatus"> & Partial<Pick<Lesson, "checks">>;

export interface LessonViewProps {
  lesson: LessonDoc;
  locale: string;
  mode?: Mode;
  registry: Registry;
  glossary?: Glossary;
  detours?: Record<string, Detour>;
  /** Overrides where progress is kept; defaults to the lesson id and version. */
  storageKey?: string;
  /** Learning moments for anonymous analytics; the engine sends nothing anywhere itself. */
  onEvent?: OnLessonEvent;
  /** Show the short "Before you start" card with the lesson's pre-checks (personal mode only). Off unless the app turns it on. */
  preChecks?: boolean;
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
export function LessonView({ lesson, locale, mode = "personal", registry, glossary = {}, detours = {}, storageKey, onEvent, preChecks = false }: LessonViewProps) {
  const key = storageKey ?? `lm:lesson:${lesson.id}:v${lesson.version}`;
  const [glossaryOpen, setGlossaryOpen] = useState<{ focus?: string } | null>(null);
  const [detourId, setDetourId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const localGlossary = useMemo(() => ({ ...(glossary[FALLBACK_LOCALE] ?? {}), ...(glossary[locale] ?? {}) }), [glossary, locale]);
  const emit = useRef(onEvent);
  useEffect(() => {
    emit.current = onEvent;
  }, [onEvent]);
  const openGlossary = useCallback((focus?: string) => {
    setGlossaryOpen({ focus });
    emit.current?.({ type: "glossary", termId: focus });
  }, []);
  const openDetour = useCallback((id: string | null) => {
    setDetourId(id);
    if (id) emit.current?.({ type: "detour", detourId: id });
  }, []);
  const announce = useCallback((m: string) => {
    setAnnouncement("");
    requestAnimationFrame(() => setAnnouncement(m));
  }, []);
  const blocks = useMemo(() => lesson.stages.flatMap((s) => s.blocks), [lesson]);
  const scope = useScope({ blocks, locale, mode, registry, strings: lesson.strings, storageKey: key, glossary: localGlossary, detours, openGlossary, openDetour, announce });
  const { store, t, ui } = scope;
  const state = useLessonState(store);
  const [hydrated, setHydrated] = useState(false);
  useLearningMoments(store, blocks, registry, lesson.checks?.post ?? [], emit);

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

  // Classroom: a presenter's clicker sends Page Down / Page Up (or arrow keys). Move exactly one
  // step (a chapter slide or a block) so the projected screen never lands half-way through one.
  useEffect(() => {
    if (mode !== "classroom") return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.altKey || e.ctrlKey || e.metaKey || document.querySelector("dialog[open]")) return;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const forward = e.key === "PageDown" || e.key === "ArrowRight" || (e.key === " " && !target?.closest("button, a, label"));
      const back = e.key === "PageUp" || e.key === "ArrowLeft";
      if (!forward && !back) return;
      // A chapter banner and the block right after it share one screen, so they are one step.
      const steps = [...document.querySelectorAll<HTMLElement>(".lm-lesson .lm-chapter, .lm-lesson .lm-block")].filter(
        (el) => !(el.classList.contains("lm-block") && el.previousElementSibling?.classList.contains("lm-chapter")),
      );
      const tops = steps.map((el) => el.getBoundingClientRect().top);
      const next = forward ? steps[tops.findIndex((t) => t > 8)] : steps[tops.map((t) => t < -8).lastIndexOf(true)];
      if (!next) return;
      e.preventDefault();
      next.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode]);

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
  // The post-checks come before a final "transfer and reflect" chapter, so the lesson ends on what
  // the learner made (their card and their own explanation), not on questions.
  const hasEnding = (lesson.checks?.post?.length ?? 0) > 0;
  const lastIsReflect = lesson.stages[lesson.stages.length - 1]?.stage === "transfer-reflect";
  const endingAt = hasEnding ? (lastIsReflect ? lesson.stages.length - 1 : lesson.stages.length) : -1;
  const chapters = useMemo(() => {
    const list: Chapter[] = lesson.stages.map((st, i) => ({ id: `${titleId}-c${i}`, stage: st.stage as string, n: 0, index: i }));
    if (endingAt >= 0) list.splice(endingAt, 0, { id: `${titleId}-end`, stage: "ending", n: 0, index: -1 });
    return list.map((c, i) => ({ ...c, n: i + 1 }));
  }, [lesson, titleId, endingAt]);
  const [current, setCurrent] = useState(0);
  const [headingOnScreen, setHeadingOnScreen] = useState(true);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      let idx = 0;
      chapters.forEach((c, i) => {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      });
      setCurrent(idx);
      const h = document.getElementById(`${chapters[idx]?.id}-h`)?.getBoundingClientRect();
      setHeadingOnScreen(!!h && h.top > 56 && h.top < window.innerHeight);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [chapters]);
  const draftLocale = locale !== FALLBACK_LOCALE && lesson.localeStatus[locale] !== "reviewed";

  return (
    <EngineContext.Provider value={scope}>
      <article className="lm-lesson" lang={locale} data-mode={mode} aria-labelledby={titleId} data-hydrated={hydrated || undefined}>
        <header className="lm-lesson__header">
          <p className="lm-eyebrow">{ui("lesson.minutes", { n: lesson.meta.estimatedMinutes })}</p>
          <h1 id={titleId} className="lm-lesson__title">{t.rich(lesson.meta.titleKey)}</h1>
          {lesson.meta.subtitleKey ? <p className="lm-lesson__subtitle">{t.rich(lesson.meta.subtitleKey)}</p> : null}
          {draftLocale ? <p className="lm-notice" role="note">{ui("draft.translation")}</p> : null}
        </header>

        <Toolbar depth={state.depth} hasGlossary={termsInLesson.length > 0} chapters={chapters} current={current} showChapter={!headingOnScreen} />

        {preChecks && mode === "personal" && (lesson.checks?.pre?.length ?? 0) > 0 ? <PreChecks checks={lesson.checks!.pre} emit={emit} /> : null}

        {state.visits > 1 ? <RecallWarmup lesson={lesson} /> : null}

        {chapters.map((c) =>
          c.stage === "ending" ? (
            <Ending key={c.id} checks={lesson.checks?.post ?? []} chapterId={c.id} n={c.n} />
          ) : (
            <section key={c.id} id={c.id} className="lm-stage" data-stage={c.stage} style={stageVars(c.stage)} aria-labelledby={`${c.id}-h`}>
              <ChapterHeader id={`${c.id}-h`} n={c.n} title={ui(`stage.${c.stage}`)} />
              {lesson.stages[c.index]!.blocks.map((block) =>
                depthRank(block.depth) <= depthRank(state.depth) || state.expanded.includes(block.id) ? (
                  <BlockFrame key={block.id} block={block} firstUse={firstOfType.has(block.id)} />
                ) : (
                  <DeeperTeaser key={block.id} blockId={block.id} />
                ),
              )}
            </section>
          ),
        )}
        {hasEnding ? (
          <p className="lm-ending__done">
            <Icon name="check" />
            {ui("ending.done")}
          </p>
        ) : null}
      </article>

      <GlossaryDialog open={glossaryOpen !== null} focus={glossaryOpen?.focus} termIds={termsInLesson} onClose={() => setGlossaryOpen(null)} />
      <DetourDialog detourId={detourId} parentKey={key} onClose={() => setDetourId(null)} />
      <div className="lm-sr-only" aria-live="polite" role="status">{announcement}</div>
    </EngineContext.Provider>
  );
}

/** Chapter colour variables for a stage (the ending uses the accent colour). */
function stageVars(stage: string): CSSProperties {
  return (stage === "ending"
    ? { "--stage": "var(--color-accent)", "--stage-soft": "var(--color-accent-soft)" }
    : { "--stage": `var(--stage-${stage})`, "--stage-soft": `var(--stage-${stage}-soft)` }) as CSSProperties;
}

interface Chapter {
  id: string;
  stage: string;
  n: number;
  /** Index into lesson.stages, or -1 for the ending. */
  index: number;
}

function ChapterHeader({ id, n, title }: { id: string; n: number; title: string }) {
  const { ui } = useEngine();
  return (
    <header className="lm-chapter">
      <span className="lm-chapter__num" aria-hidden="true">{n}</span>
      <div>
        <p className="lm-chapter__part">{ui("chapter.part", { n })}</p>
        <h2 id={id} className="lm-chapter__title" tabIndex={-1}>{title}</h2>
      </div>
    </header>
  );
}

/**
 * One slim sticky row: which chapter you are in (tap to jump to another),
 * undo, words and lesson tools. A thin segmented rail under it shows the
 * chapters, so learners never lose their place in a long story. The rail marks
 * where you are, not how much is "done": it is navigation, not a progress bar.
 */
function Toolbar({ depth, hasGlossary, chapters, current, showChapter }: { depth: Depth; hasGlossary: boolean; chapters: Chapter[]; current: number; showChapter: boolean }) {
  const { store, ui, announce, openGlossary } = useEngine();
  const [confirm, setConfirm] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const confirmId = useId();
  const depthName = useId();
  const panelId = useId();
  const chaptersId = useId();
  const helpId = useId();
  const here = chapters[current] ?? chapters[0];
  const chapterName = (c: Chapter) => (c.stage === "ending" ? ui("ending.title") : ui(`stage.${c.stage}`));
  const onUndo = () => {
    const blockId = store.undo();
    announce(ui(blockId ? "undo.done" : "undo.none"));
    if (blockId) document.getElementById(`block-${blockId}`)?.scrollIntoView({ block: "nearest" });
  };
  const jump = (c: Chapter) => {
    setChaptersOpen(false);
    const h = document.getElementById(`${c.id}-h`);
    document.getElementById(c.id)?.scrollIntoView({ block: "start" });
    h?.focus({ preventScroll: true });
  };
  return (
    <div className="lm-toolbar" role="group" aria-label={ui("lesson.controls")}>
      <div className="lm-toolbar__row">
        {here ? (
          <button type="button" className="lm-chapter-btn" data-quiet={!showChapter && !chaptersOpen ? "" : undefined} style={stageVars(here.stage)} aria-expanded={chaptersOpen} aria-controls={chaptersId} onClick={() => { setChaptersOpen(!chaptersOpen); setToolsOpen(false); }}>
            <span className="lm-chapter-btn__num" aria-hidden="true">{here.n}</span>
            <span className="lm-chapter-btn__name">
              <span className="lm-sr-only">{ui("chapter.current")} </span>
              {chapterName(here)}
            </span>
            <Icon name="chevron" size={16} />
          </button>
        ) : null}
        <span className="lm-toolbar__spacer" />
        <button type="button" className="lm-tool" onClick={onUndo}>
          <Icon name="undo" />
          <span className="lm-tool__label">{ui("undo")}</span>
        </button>
        {hasGlossary ? (
          <button type="button" className="lm-tool" onClick={() => openGlossary()}>
            <Icon name="book" />
            <span className="lm-tool__label">{ui("glossary.open")}</span>
          </button>
        ) : null}
        <button type="button" className="lm-tool" aria-expanded={toolsOpen} aria-controls={panelId} onClick={() => { setToolsOpen(!toolsOpen); setChaptersOpen(false); }}>
          <Icon name="sliders" />
          <span className="lm-tool__label">{ui("tools.open")}</span>
        </button>
      </div>
      <ol className="lm-rail" aria-hidden="true">
        {chapters.map((c, i) => (
          <li key={c.id} style={stageVars(c.stage)} data-here={i === current || undefined} data-past={i < current || undefined} />
        ))}
      </ol>
      <nav id={chaptersId} className="lm-toolbar__panel lm-chapters" hidden={!chaptersOpen} aria-label={ui("chapter.jump")}>
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id} style={stageVars(c.stage)}>
              <button type="button" onClick={() => jump(c)} aria-current={i === current ? "step" : undefined}>
                <span className="lm-chapter-btn__num" aria-hidden="true">{c.n}</span>
                {chapterName(c)}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div id={panelId} className="lm-toolbar__panel" hidden={!toolsOpen}>
        <fieldset className="lm-depth" aria-describedby={helpId}>
          <legend>{ui("depth.label")}</legend>
          <p id={helpId} className="lm-depth__help">{ui("depth.help")}</p>
          <div className="lm-depth__options">
            {DEPTHS.map((d) => (
              <label key={d} className="lm-pill" data-selected={depth === d || undefined}>
                <input type="radio" name={depthName} value={d} checked={depth === d} onChange={() => store.setDepth(d)} />
                <span>{ui(`depth.${d}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Button variant="quiet" onClick={() => setConfirm(true)}>
          <Icon name="reset" />
          {ui("resetAll")}
        </Button>
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
      <Icon name="spark" />
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

/**
 * Watches lesson state for learning moments: a block first acted on, a first
 * committed answer, a post-check, a depth change. Each is reported once per
 * page, without identifiers.
 */
function useLearningMoments(store: LessonStore, blocks: readonly Block[], registry: Registry, post: CheckItem[], emit: { current: OnLessonEvent | undefined }) {
  useEffect(() => {
    let prev = store.getState();
    const seen = new Set<string>();
    const once = (k: string) => (seen.has(k) ? false : (seen.add(k), true));
    emit.current?.({ type: "start", returning: prev.visits > 1 });
    const unsubscribe = store.subscribe(() => {
      const next = store.getState();
      const send = emit.current;
      if (send) {
        for (const b of blocks) {
          const s = next.blocks[b.id];
          if (s === undefined || s === prev.blocks[b.id]) continue;
          if (once(`act:${b.id}`)) send({ type: "act", blockId: b.id, component: b.type });
          const plugin = registry.get(b.type, b.componentVersion);
          const out = plugin?.outcome?.(s, b.config as never);
          if (out && once(`answer:${b.id}`)) send({ type: "answer", blockId: b.id, component: b.type, ...out });
        }
        for (const item of post) {
          const s = next.blocks[`__post:${item.id}`] as { checked?: string } | undefined;
          const was = prev.blocks[`__post:${item.id}`] as { checked?: string } | undefined;
          if (s?.checked !== undefined && s.checked !== was?.checked) send({ type: "post-check", itemId: item.id, correct: s.checked === item.answer, firstTry: once(`post:${item.id}`) });
        }
        if (next.depth !== prev.depth) send({ type: "depth", depth: next.depth });
        for (const id of next.expanded) if (!prev.expanded.includes(id)) send({ type: "expand", blockId: id });
      }
      prev = next;
    });
    return () => {
      unsubscribe();
    };
  }, [store, blocks, registry, post, emit]);
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
  const showHowTo = firstUse && !howToSeen && componentUi("howto") !== "howto" && (plugin.howToApplies?.(config) ?? true);

  const isAct = plugin.act !== "connective";
  return (
    <div className={isAct ? "lm-block lm-act" : "lm-block"} id={`block-${block.id}`} data-type={block.type} data-act={plugin.act} data-block-id={block.id} tabIndex={-1} onFocusCapture={() => store.touch(block.id)}>
      {isAct ? (
        <p className="lm-act__label">
          <span className="lm-act__dot" aria-hidden="true" />
          {ui(`act.${plugin.act}`)}
        </p>
      ) : null}
      {showHowTo ? (
        <aside className="lm-howto" aria-label={ui("howto.title")}>
          <Icon name="bulb" />
          <p>{componentUi("howto")}</p>
          <button type="button" className="lm-howto__dismiss" onClick={() => store.markHowToSeen(block.type)}>{ui("howto.dismiss")}</button>
        </aside>
      ) : null}
      <BlockErrorBoundary fallback={missing}>
        <BlockIdContext.Provider value={block.id}>
          <Render block={block} config={config} mode={mode} state={blockState} setState={setState} readBlock={readBlock} t={t} ui={componentUi} locale={locale} />
        </BlockIdContext.Provider>
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
          <Icon name="signpost" />
          {ui("detour.offer", { title: detourTitle(detours[d]!, locale) })}
        </Button>
      ))}
      {canReset ? (
        <Button variant="quiet" className="lm-reset" onClick={() => store.resetBlock(block.id)}>
          <Icon name="reset" size={18} />
          {ui("reset")}
        </Button>
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

/**
 * For returning learners: a light retrieval task. The learner is asked to
 * remember first; what they made is shown only when they ask for it.
 */
function RecallWarmup({ lesson }: { lesson: LessonDoc }) {
  const { registry, store, locale, t } = useEngine();
  const state = useLessonState(store);
  const [dismissed, setDismissed] = useState(false);
  const [shown, setShown] = useState(false);
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
  const focus = useFocusAfter<HTMLQuoteElement>(shown);
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
      <p>{ui("recall.question")}</p>
      {shown ? (
        <>
          <blockquote ref={focus.ref} tabIndex={-1}>{recall.summary}</blockquote>
          <div className="lm-row">
            <Button variant="primary" onClick={() => setDismissed(true)}>{ui("recall.keep")}</Button>
            <Button onClick={jump}>{ui("recall.jump")}</Button>
          </div>
        </>
      ) : (
        <div className="lm-row">
          <Button variant="primary" onClick={() => { focus.arm(); setShown(true); }}>{ui("recall.show")}</Button>
          <Button variant="quiet" onClick={() => setDismissed(true)}>{ui("recall.skip")}</Button>
        </div>
      )}
    </section>
  );
}

/**
 * The designed ending: the lesson's post-checks, framed as a chance to see how
 * far the learner has come, never as a test. Answers stay on the device.
 */
function Ending({ checks, chapterId, n }: { checks: CheckItem[]; chapterId: string; n: number }) {
  const { ui } = useEngine();
  if (!checks.length) return null;
  return (
    <section id={chapterId} className="lm-stage lm-ending" style={stageVars("ending")} aria-labelledby={`${chapterId}-h`}>
      <ChapterHeader id={`${chapterId}-h`} n={n} title={ui("ending.title")} />
      <p className="lm-lead">{ui("ending.intro", { n: checks.length })}</p>
      {checks.map((c) => (
        <PostCheck key={c.id} item={c} />
      ))}
    </section>
  );
}

interface PreCheckState {
  done?: boolean;
}

/**
 * "Before you start": the pre-checks as a first guess. No right or wrong
 * feedback and no score; skippable with one tap. Only the anonymous
 * right/wrong tally leaves the page, and only if the app counts it.
 */
function PreChecks({ checks, emit }: { checks: CheckItem[]; emit: { current: OnLessonEvent | undefined } }) {
  const { store, t, ui } = useEngine();
  const state = useStoreSelector(store, (s) => s.blocks["__pre"] as PreCheckState | undefined);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const titleId = useId();
  if (state?.done) return null;
  const finish = (send: boolean) => {
    if (send) for (const c of checks) if (choices[c.id] !== undefined) emit.current?.({ type: "pre-check", itemId: c.id, correct: choices[c.id] === c.answer });
    store.setBlock<PreCheckState>("__pre", { done: true });
  };
  return (
    <section className="lm-stage lm-precheck" aria-labelledby={titleId}>
      <h2 id={titleId} className="lm-chapter__title">{ui("precheck.title")}</h2>
      <p className="lm-lead">{ui("precheck.intro")}</p>
      {checks.map((c) => (
        <div key={c.id} className="lm-block lm-precheck__item">
          <ChoiceGroup legend={t.rich(c.promptKey)} choices={c.options.map((o) => ({ id: o, label: t.rich(o) }))} value={choices[c.id]} onChange={(choice) => setChoices((p) => ({ ...p, [c.id]: choice }))} />
        </div>
      ))}
      <p>
        <Button variant="primary" disabled={Object.keys(choices).length === 0} onClick={() => finish(true)}>{ui("precheck.go")}</Button>{" "}
        <Button variant="quiet" onClick={() => finish(false)}>{ui("precheck.skip")}</Button>
      </p>
    </section>
  );
}

interface PostCheckState {
  choice?: string;
  checked?: string;
}

function PostCheck({ item }: { item: CheckItem }) {
  const { store, t, ui } = useEngine();
  const key = `__post:${item.id}`;
  const state = useStoreSelector(store, (s) => s.blocks[key] as PostCheckState | undefined) ?? {};
  const focus = useFocusAfter<HTMLDivElement>(state.checked);
  const landed = state.checked !== undefined && state.checked === item.answer;
  return (
    <div className="lm-block lm-act lm-postcheck">
      <p className="lm-act__label">
        <span className="lm-act__dot" aria-hidden="true" />
        {ui("act.decide")}
      </p>
      <ChoiceGroup
        legend={t.rich(item.promptKey)}
        choices={item.options.map((o) => ({ id: o, label: t.rich(o), tone: state.checked === o ? (landed ? "insight" : "warm") : undefined }))}
        value={state.choice}
        locked={landed}
        onChange={(choice) => store.setBlock<PostCheckState>(key, { ...state, choice })}
      />
      {!landed ? (
        <Button variant="primary" disabled={!state.choice || state.choice === state.checked} onClick={() => { focus.arm(); store.setBlock<PostCheckState>(key, { ...state, checked: state.choice }); }}>
          {ui("ending.check")}
        </Button>
      ) : null}
      {state.checked !== undefined ? (
        <div ref={focus.ref} tabIndex={-1} className={landed ? "lm-insight" : "lm-notice"}>
          <p>{ui(landed ? "ending.landed" : "ending.again")}</p>
          {landed && item.feedbackKey ? <p>{t.rich(item.feedbackKey)}</p> : null}
        </div>
      ) : null}
    </div>
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
