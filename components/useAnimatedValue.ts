"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animate a display value toward `target` over `ms` using the shared cubic
 * ease-out (1 - (1-t)³), rendering intermediate values so the number counts
 * rather than jumps.
 *
 * Guards, per README "Interactions":
 *   * prefers-reduced-motion → snap straight to the final value.
 *   * tab hidden / frame loop suspended → settle immediately, never leave a
 *     stale partial number on screen.
 */
export function useAnimatedValue(target: number, ms: number, initial?: number): number {
  const [display, setDisplay] = useState(initial ?? target);
  const displayRef = useRef(initial ?? target);

  useEffect(() => {
    const to = target;
    const set = (v: number) => {
      displayRef.current = v;
      setDisplay(v);
    };

    const from = displayRef.current;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce || (typeof document !== "undefined" && document.hidden) || from === to) {
      set(to);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      set(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else set(to);
    };
    raf = requestAnimationFrame(tick);

    // Settle if the frame loop is suspended (matches the prototype's guard).
    const guard = window.setTimeout(() => set(to), ms + 250);
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        set(to);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(guard);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ms]);

  return display;
}
