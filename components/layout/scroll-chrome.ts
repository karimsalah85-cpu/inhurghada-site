"use client";

import { useEffect, useState } from "react";

/**
 * True once the page has scrolled past `threshold` px. Used to swap the navbar
 * from an immersive translucent state (over the hero) to a solid, readable one.
 * rAF-throttled, passive listener, no layout reads beyond `scrollY`.
 */
export function useScrolledPast(threshold = 24) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setPast(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return past;
}

/**
 * True while the user is scrolling down through the body of the page — the cue to
 * slide a bottom bar out of the way and give content room. Any upward scroll,
 * the top `minScroll` px, and the last `revealNearBottom` px always reveal it.
 * Disabled entirely under prefers-reduced-motion.
 */
export function useHideOnScrollDown({ minScroll = 120, revealNearBottom = 140 } = {}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let lastY = window.scrollY;
    const read = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const doc = document.documentElement;
      const nearBottom = y + window.innerHeight >= doc.scrollHeight - revealNearBottom;
      if (y < minScroll || nearBottom) setHidden(false);
      else if (y > lastY + 6) setHidden(true);
      else if (y < lastY - 6) setHidden(false);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [minScroll, revealNearBottom]);

  return hidden;
}
