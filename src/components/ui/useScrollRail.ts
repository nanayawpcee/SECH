"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Prev/next arrows for a horizontally scrolling row of cards. The arrows only
 * show when the CSS turns the grid into a swipeable row; these track whether
 * there is anything further to scroll to in each direction.
 *
 * @param cellSelector one card in the row, used to step by a card's width
 * @param gap         the gap between cards, in px
 */
export function useScrollRail<T extends HTMLElement = HTMLDivElement>(cellSelector: string, gap = 20) {
  const railRef = useRef<T>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const el = railRef.current;
      const card = el?.querySelector<HTMLElement>(cellSelector);
      if (!el || !card) return;
      el.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: "smooth" });
    },
    [cellSelector, gap],
  );

  return { railRef, canPrev, canNext, step };
}
