"use client";
import { useCallback, useEffect, useRef } from "react";

/**
 * Move focus to newly revealed content, but only after the learner asked for
 * it (never on load, a re-render or an undo), so keyboard and screen-reader
 * users land on what appeared.
 */
export function useFocusAfter<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);
  const armed = useRef(false);
  useEffect(() => {
    if (armed.current) {
      armed.current = false;
      ref.current?.focus();
    }
  }, [dep]);
  const arm = useCallback(() => {
    armed.current = true;
  }, []);
  return { ref, arm };
}
