"use client";
import { createContext, useContext, useEffect } from "react";
import type { Counts } from "./ui/Tally";

/**
 * Live classroom voting (docs/03, Phase 2). The engine knows nothing about
 * transport: the app supplies a LiveVotes value when a teacher runs a live
 * session, and the show-of-hands tally adds phone votes to the hands counted
 * in the room. Without a session, nothing changes.
 */
export interface LiveVotes {
  /** A session is running and phones can vote. */
  connected: boolean;
  /** Phone votes for a block (and, for item-by-item votes, one item). */
  counts: (blockId: string, itemId?: string) => Counts;
  /** A component tells the session which item phones should vote on now. */
  setItem: (blockId: string, itemId: string | null) => void;
}

export const LiveVotesContext = createContext<LiveVotes | null>(null);
export const BlockIdContext = createContext<string | null>(null);

/** Phone votes for the enclosing block, or null when no live session is running. */
export function useLiveCounts(itemId?: string): Counts | null {
  const live = useContext(LiveVotesContext);
  const blockId = useContext(BlockIdContext);
  if (!live?.connected || !blockId) return null;
  return live.counts(blockId, itemId);
}

/** For item-by-item votes (sort): tell phones which item is on the shared screen. */
export function useLiveItem(itemId: string | null | undefined) {
  const live = useContext(LiveVotesContext);
  const blockId = useContext(BlockIdContext);
  useEffect(() => {
    if (live?.connected && blockId) live.setItem(blockId, itemId ?? null);
  }, [live, blockId, itemId]);
}

/** Hands counted in the room plus phone votes. */
export function addCounts(a: Counts, b: Counts | null): Counts {
  if (!b) return a;
  const out: Counts = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v;
  return out;
}
