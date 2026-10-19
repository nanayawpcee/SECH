"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, Pause, Play } from "lucide-react";
import type { ArticlePhoto } from "@/lib/news";

/**
 * Most of a photo that may be trimmed to fill the frame (0.2 = 20%). Enough
 * for ordinary 4:3 camera photos in the 16:10 frame (about 17%); squares,
 * portraits and posters still show whole.
 */
const FIT_TRIM = 0.2;

/** How long each photo shows before the slider moves on by itself. */
const AUTOPLAY_MS = 5000;

function fillsFrame(p: ArticlePhoto, frameRatio: number) {
  const ratio = p.width / Math.max(1, p.height);
  return 1 - Math.min(ratio / frameRatio, frameRatio / ratio) <= FIT_TRIM;
}

/**
 * Photo slider for an article with several photos. Swipe on touch screens,
 * arrows or the keyboard elsewhere, thumbnails underneath. Every photo is
 * shown whole (posters and portrait shots included) over a soft blurred fill
 * of itself, never cropped.
 *
 * It loops round in one direction: after the last photo, "next" slides the
 * first one in from the right (and "previous" on the first slides the last in
 * from the left), rather than rewinding back through every photo. A copy of
 * the last photo sits before the first and a copy of the first after the
 * last; landing on a copy jumps, invisibly, to the real photo.
 *
 * A photo close to the frame's shape fills it edge to edge, like a
 * single-photo post; only those that would lose more than FIT_TRIM to
 * cropping (portraits, posters, squares in a wide frame) are shown whole.
 *
 * It moves on by itself every AUTOPLAY_MS, and holds still while someone is
 * looking closely: the pointer is over it, it has keyboard focus, it's off
 * screen or the tab is hidden. Any manual move restarts the wait. A pause
 * button stops it for good (WCAG 2.2.2), and it doesn't autoplay at all for
 * people who ask their device for reduced motion.
 */
export function ArticleGallery({ photos, title }: { photos: ArticlePhoto[]; title: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // The frame's width / height: 16:10 on wide screens, 4:3 on phones (news.css).
  const [frameRatio, setFrameRatio] = useState(1.6);
  const sectionRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const count = photos.length;
  const loop = count > 1;
  // Track positions: 0 = copy of the last, 1..count = the photos, count + 1 = copy of the first.
  const slides = loop ? [photos[count - 1], ...photos, photos[0]] : photos;
  const offset = loop ? 1 : 0;

  const width = () => Math.max(1, trackRef.current?.clientWidth ?? 1);
  const position = () => Math.round((trackRef.current?.scrollLeft ?? 0) / width());
  const jumpTo = (pos: number) => { if (trackRef.current) trackRef.current.scrollLeft = pos * width(); };

  /** From a copy, hop to the real photo it shows. Instant, so nothing visibly moves. */
  const settle = useCallback(() => {
    if (!loop) return;
    const pos = position();
    if (pos === 0) jumpTo(count);
    else if (pos === count + 1) jumpTo(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop, count]);

  // Start on the first real photo, before the browser paints.
  useLayoutEffect(() => { jumpTo(offset); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [offset]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let frame = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setIndex(((position() - offset) % count + count) % count));
      // Settle once scrolling stops ("scrollend" isn't in every browser yet).
      clearTimeout(idle);
      idle = setTimeout(settle, 140);
    };
    // Keep showing the same photo when the slider changes width.
    const ro = new ResizeObserver(() => {
      jumpTo(position());
      if (el.clientHeight) setFrameRatio(el.clientWidth / el.clientHeight);
    });
    el.addEventListener("scroll", onScroll, { passive: true });
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(idle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, offset, settle]);

  // No autoplay for people who ask their device for reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  // Hold still while the slider is off screen or the tab is in the background.
  useEffect(() => {
    const el = sectionRef.current;
    const io = el ? new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.35 }) : null;
    if (el && io) io.observe(el);
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => { io?.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const running = loop && playing && !hovered && !focused && onScreen && pageVisible;

  // Counts up each time the slider (re)starts running, so the wait and the
  // progress bar both start afresh.
  const [runId, setRunId] = useState(0);
  useEffect(() => { if (running) setRunId((n) => n + 1); }, [running]);

  // Each new photo, or a fresh start, waits the full time again.
  const stepRef = useRef<(dir: 1 | -1) => void>(() => {});
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => stepRef.current(1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [running, index, runId]);

  // Keep the active thumbnail in view, scrolling only the strip sideways
  // (scrollIntoView could also scroll the page).
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - strip.offsetLeft;
    if (left < strip.scrollLeft || left + thumb.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: left - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: "smooth" });
    }
  }, [index]);

  const smoothTo = (pos: number) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    trackRef.current?.scrollTo({ left: pos * width(), behavior: reduce ? "auto" : "smooth" });
  };

  /** One photo forward or back, always in that direction, looping round. */
  const step = (dir: 1 | -1) => {
    if (!loop) return;
    let pos = position();
    // Clicked again while still on a copy: hop to the real photo first.
    if (pos <= 0) { jumpTo(count); pos = count; }
    if (pos >= count + 1) { jumpTo(1); pos = 1; }
    smoothTo(pos + dir);
  };

  stepRef.current = step;

  /** Straight to photo i (thumbnails). */
  const goTo = (i: number) => smoothTo(i + offset);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  };

  return (
    <section
      ref={sectionRef}
      className="nw-gal"
      aria-roledescription="carousel"
      aria-label={`Photos: ${title}`}
      // Keyboard focus only: a mouse click leaves focus on the clicked arrow,
      // which mustn't stop the slideshow until the reader clicks elsewhere.
      onFocus={(e) => setFocused((e.target as HTMLElement).matches(":focus-visible"))}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}
    >
      <div className="nw-gal-stage" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div className="nw-gal-track" ref={trackRef} tabIndex={0} onKeyDown={onKeyDown} aria-label="Photos, use the arrow keys to move">
          {slides.map((p, k) => {
            const copy = loop && (k === 0 || k === count + 1);
            const i = ((k - offset) % count + count) % count;
            return (
              <figure
                key={copy ? `copy-${k}` : p.src}
                className="nw-gal-slide"
                data-fill={fillsFrame(p, frameRatio) || undefined}
                aria-hidden={copy || undefined}
                aria-roledescription={copy ? undefined : "slide"}
                aria-label={copy ? undefined : `${i + 1} of ${count}`}
              >
                <Image src={p.src} alt="" aria-hidden="true" fill sizes="(max-width: 1180px) 100vw, 1100px" className="nw-gal-fill" />
                <Image
                  src={p.src}
                  alt={copy ? "" : p.alt}
                  fill
                  sizes="(max-width: 1180px) 100vw, 1100px"
                  className="nw-gal-img"
                  priority={!copy && i === 0}
                />
                {p.caption && <figcaption className="nw-gal-caption">{p.caption}</figcaption>}
              </figure>
            );
          })}
        </div>

        <button type="button" className="nw-gal-arrow" data-side="prev" onClick={() => step(-1)} aria-label="Previous photo">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button type="button" className="nw-gal-arrow" data-side="next" onClick={() => step(1)} aria-label="Next photo">
          <ChevronRight size={22} aria-hidden="true" />
        </button>
        <div className="nw-gal-top">
          {loop && (
            <button
              type="button"
              className="nw-gal-play"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause the slideshow" : "Play the slideshow"}
              aria-pressed={!playing}
            >
              {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            </button>
          )}
          {/* Announced only when someone moves the slider, not on every autoplay step. */}
          <span className="nw-gal-count" aria-live={running ? "off" : "polite"}>
            <Images size={14} aria-hidden="true" />{index + 1} / {count}
          </span>
        </div>
        {loop && (
          <span
            key={`${index}-${runId}`}
            className="nw-gal-progress"
            data-running={running || undefined}
            style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="nw-gal-thumbs" ref={thumbsRef} role="group" aria-label="Choose a photo">
        {photos.map((p, i) => (
          <button
            key={p.src}
            type="button"
            className="nw-gal-thumb"
            aria-current={i === index ? "true" : undefined}
            aria-label={`Show photo ${i + 1} of ${count}`}
            onClick={() => goTo(i)}
          >
            <Image src={p.src} alt="" fill sizes="112px" />
          </button>
        ))}
      </div>
    </section>
  );
}
