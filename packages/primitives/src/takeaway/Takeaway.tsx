"use client";
import { useMemo, type ReactNode } from "react";
import type { Block } from "@lm/schema";
import { Button, createUiT, engineMessages, useBlockState, useEngine, useLessonBlocks, type BlockProps, type LessonT, type UiT } from "@lm/engine";
import type { TakeawayConfig } from "./contract";

export interface TakeawayState {
  kept?: boolean;
}

type Props = BlockProps<TakeawayConfig & Record<string, unknown>, TakeawayState>;

/**
 * Resolve an include to a block id: an exact id match first, then the block
 * whose id is the longest prefix of the include followed by "-" (so
 * "b4-model-summary" resolves to block "b4").
 */
export function resolveInclude(include: string, blocks: readonly Block[]): Block | undefined {
  const exact = blocks.find((b) => b.id === include);
  if (exact) return exact;
  const withPrefix = blocks
    .filter((b) => include.startsWith(`${b.id}-`))
    .sort((a, b) => b.id.length - a.id.length);
  return withPrefix[0];
}

export function Takeaway({ config, mode, state, setState, readBlock, t, ui, locale }: Props) {
  const blocks = useLessonBlocks();
  const { registry } = useEngine();
  const kept = !!state?.kept;

  const resolved = useMemo(() => config.includes.map((include) => ({ include, block: resolveInclude(include, blocks) })), [config.includes, blocks]);

  const download = () => {
    const lines: string[] = [];
    if (config.titleKey) lines.push(t.text(config.titleKey));
    lines.push(t.text(config.cardKey));
    for (const [i, { block }] of resolved.entries()) {
      const label = config.labelKeys?.[i] ? `${t.text(config.labelKeys[i]!)}: ` : "";
      if (!block) {
        lines.push(label + ui("notMadeYet"));
        continue;
      }
      const plugin = registry.get(block.type, block.componentVersion);
      const componentUi = createUiT(locale, [registry.messages, engineMessages], block.type);
      const value = readBlock(block.id);
      const summary = plugin?.summarize?.(value, block.config, t, componentUi) ?? null;
      lines.push(label + (summary ?? ui("notMadeYet")));
    }
    downloadCard(lines);
  };

  return (
    <div className="lm-takeaway">
      <div className="lm-card lm-takeaway__card">
        {mode === "classroom" ? <p className="lm-eyebrow">{ui("classTitle")}</p> : null}
        {config.titleKey ? <h3 className="lm-takeaway__title">{t.rich(config.titleKey)}</h3> : null}
        <p>{t.rich(config.cardKey)}</p>
        <ul className="lm-takeaway__list">
          {resolved.map(({ include, block }, i) => (
            <IncludeLine key={include} blockId={block?.id} label={config.labelKeys?.[i] ? t.rich(config.labelKeys[i]!) : null} t={t} ui={ui} />
          ))}
        </ul>
      </div>
      <div className="lm-row">
        <Button variant="primary" onClick={download}>{ui("download")}</Button>
        <Button variant={kept ? "quiet" : "secondary"} disabled={kept} onClick={() => setState({ kept: true })}>
          {ui(kept ? "kept" : "keep")}
        </Button>
      </div>
      {mode === "classroom" ? <p className="lm-notice" role="note">{ui("showOnScreen")}</p> : null}
    </div>
  );
}

/** One line of the card: the summary of what the learner made in an included block, reactively. */
function IncludeLine({ blockId, label, t, ui }: { blockId: string | undefined; label: ReactNode; t: LessonT; ui: UiT }) {
  const { registry, locale } = useEngine();
  const blocks = useLessonBlocks();
  const state = useBlockState(blockId ?? "");
  const block = blockId ? blocks.find((b) => b.id === blockId) : undefined;
  const head = label ? <strong className="lm-takeaway__label">{label}</strong> : null;
  if (!block) return <li>{head}{ui("notMadeYet")}</li>;
  const plugin = registry.get(block.type, block.componentVersion);
  const componentUi = createUiT(locale, [registry.messages, engineMessages], block.type);
  const summary = plugin?.summarize?.(state, block.config, t, componentUi) ?? null;
  return (
    <li data-made={summary ? "" : undefined}>
      {head}
      {summary ?? <span className="lm-muted">{ui("notMadeYet")}</span>}
    </li>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** A data URL needs no object-URL support, so this works even where that API is missing. */
function downloadAsText(lines: string[]) {
  const url = `data:text/plain;charset=utf-8,${encodeURIComponent(lines.join("\n"))}`;
  triggerDownload(url, "lesson-card.txt");
}

/** Renders the card to a canvas and downloads it as a PNG; falls back to a text file when canvas is unavailable. */
export function downloadCard(lines: string[]) {
  if (typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext?.("2d");
  if (!ctx) {
    downloadAsText(lines);
    return;
  }
  const width = 800;
  const padding = 40;
  const fontSize = 28;
  const fontFamily = typeof window !== "undefined" ? getComputedStyle(document.body).fontFamily || "sans-serif" : "sans-serif";
  ctx.font = `${fontSize}px ${fontFamily}`;
  const maxTextWidth = width - padding * 2;
  const wrapped = lines.flatMap((line) => wrapText(ctx, line, maxTextWidth));
  const lineHeight = Math.round(fontSize * 1.4);
  const height = padding * 2 + wrapped.length * lineHeight;
  canvas.width = width;
  canvas.height = height;
  // Setting canvas.width/height resets context state, so font must be reapplied.
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000000";
  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  const x = rtl ? width - padding : padding;
  wrapped.forEach((line, i) => ctx.fillText(line, x, padding + (i + 1) * lineHeight - fontSize * 0.3));
  if (typeof canvas.toBlob !== "function") {
    downloadAsText(lines);
    return;
  }
  canvas.toBlob((blob) => {
    if (!blob) {
      downloadAsText(lines);
      return;
    }
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "lesson-card.png");
    URL.revokeObjectURL(url);
  });
}
