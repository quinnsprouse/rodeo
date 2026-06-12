// oxlint-disable-next-line no-restricted-imports
import { useEffect } from "react";

/**
 * One-time setup on mount with explicit cleanup.
 * Use this instead of raw useEffect for external system sync.
 *
 * @see docs/agents/REACT_PATTERNS.md — Rule: no direct useEffect
 */
export function useMountEffect(effect: () => void | (() => void)) {
  // oxlint-disable-next-line react-hooks-js/exhaustive-deps -- this hook intentionally runs once.
  useEffect(effect, []);
}
