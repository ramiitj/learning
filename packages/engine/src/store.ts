import type { Depth } from "@lm/schema";
import type { SetStateOptions } from "./types";

/**
 * Shared lesson state. Everything the learner does lives here, keyed by block
 * id, so a block can read what the learner made in an earlier block. State is
 * kept on the device only (docs/11: no personal data leaves the device in v1).
 */
export interface LessonState {
  blocks: Record<string, unknown>;
  depth: Depth;
  /** Blocks the learner chose to open below the current depth. */
  expanded: string[];
  /** Component types whose how-to hint has been dismissed. */
  seenHowTo: string[];
  visits: number;
  /** The last block the learner touched: where to return after a locale switch or a new visit. */
  lastBlock?: string;
}

interface HistoryEntry {
  blockId: string;
  prev: unknown;
  at: number;
}

const COALESCE_MS = 1000;
const HISTORY_LIMIT = 200;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function safeStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    const probe = "__lm_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export const initialLessonState = (depth: Depth = "core"): LessonState => ({
  blocks: {},
  depth,
  expanded: [],
  seenHowTo: [],
  visits: 0,
});

export class LessonStore {
  private state: LessonState;
  private history: HistoryEntry[] = [];
  private listeners = new Set<() => void>();
  private readonly storage: StorageLike | null;

  constructor(
    readonly storageKey: string,
    opts: { storage?: StorageLike | null; defaultDepth?: Depth } = {},
  ) {
    this.storage = opts.storage === undefined ? safeStorage() : opts.storage;
    this.state = initialLessonState(opts.defaultDepth);
    const saved = this.read();
    if (saved) this.state = { ...this.state, ...saved };
  }

  /** Called once per page view. Separate from the constructor so SSR and hydration agree. */
  recordVisit(): void {
    this.state = { ...this.state, visits: this.state.visits + 1 };
    this.persist();
    this.emit();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getState = () => this.state;

  getBlock<T = unknown>(blockId: string): T | undefined {
    return this.state.blocks[blockId] as T | undefined;
  }

  setBlock<T>(blockId: string, next: T | ((prev: T | undefined) => T), opts: SetStateOptions = {}): void {
    const prev = this.state.blocks[blockId] as T | undefined;
    const value = typeof next === "function" ? (next as (p: T | undefined) => T)(prev) : next;
    if (Object.is(value, prev)) return;
    const now = Date.now();
    const last = this.history[this.history.length - 1];
    const merge = opts.coalesce && last && last.blockId === blockId && now - last.at < COALESCE_MS;
    if (merge) last.at = now;
    else {
      this.history.push({ blockId, prev, at: now });
      if (this.history.length > HISTORY_LIMIT) this.history.shift();
    }
    this.state = { ...this.state, blocks: { ...this.state.blocks, [blockId]: value }, lastBlock: blockId };
    this.commit();
  }

  canUndo = () => this.history.length > 0;

  /** Undo the learner's most recent change, wherever it was. Returns the block that changed. */
  undo(): string | undefined {
    const entry = this.history.pop();
    if (!entry) return undefined;
    const blocks = { ...this.state.blocks };
    if (entry.prev === undefined) delete blocks[entry.blockId];
    else blocks[entry.blockId] = entry.prev;
    this.state = { ...this.state, blocks, lastBlock: entry.blockId };
    this.commit();
    return entry.blockId;
  }

  /** Reset one block to its untouched state. Undoable. */
  resetBlock(blockId: string): void {
    if (!(blockId in this.state.blocks)) return;
    this.history.push({ blockId, prev: this.state.blocks[blockId], at: Date.now() });
    const blocks = { ...this.state.blocks };
    delete blocks[blockId];
    this.state = { ...this.state, blocks, lastBlock: blockId };
    this.commit();
  }

  /** Start the whole lesson again. Settings (depth, dismissed hints) are kept. */
  resetAll(): void {
    this.history = [];
    this.state = { ...this.state, blocks: {}, expanded: [], lastBlock: undefined };
    this.commit();
  }

  setDepth(depth: Depth): void {
    this.state = { ...this.state, depth };
    this.commit();
  }

  expand(blockId: string): void {
    if (this.state.expanded.includes(blockId)) return;
    this.state = { ...this.state, expanded: [...this.state.expanded, blockId] };
    this.commit();
  }

  markHowToSeen(type: string): void {
    if (this.state.seenHowTo.includes(type)) return;
    this.state = { ...this.state, seenHowTo: [...this.state.seenHowTo, type] };
    this.commit();
  }

  touch(blockId: string): void {
    if (this.state.lastBlock === blockId) return;
    this.state = { ...this.state, lastBlock: blockId };
    this.persist();
  }

  private commit() {
    this.persist();
    this.emit();
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }

  private read(): Partial<LessonState> | null {
    try {
      const raw = this.storage?.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as Partial<LessonState>) : null;
    } catch {
      return null;
    }
  }

  private persist() {
    try {
      this.storage?.setItem(this.storageKey, JSON.stringify(this.state));
    } catch {
      // Storage full or blocked: the lesson still works, it just won't remember.
    }
  }
}
