"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shown over the sign-in page after the portal signs someone out for being away.
 * The session has already ended, so nothing private is on it: the hospital,
 * the time and a short note. Any key, click or tap peels it away from the
 * bottom-right corner like a sheet of paper, revealing the sign-in form.
 */

const PEEL_MS = 1150;
type Pt = [number, number];

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const poly = (pts: Pt[]) => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(", ")})`;

/**
 * The fold is the line x/W + y/H = t, moving from the bottom-right corner (t = 2)
 * to past the top-left (t = 0). Returns what is still on the screen, and the
 * flap: the peeled part mirrored across the fold, showing the back of the paper.
 */
function peelShapes(W: number, H: number, t: number) {
  const nx = 1 / W, ny = 1 / H, nn = nx * nx + ny * ny;
  const mirror = ([x, y]: Pt): Pt => {
    const d = (x * nx + y * ny - t) / nn;
    return [x - 2 * d * nx, y - 2 * d * ny];
  };
  let sheet: Pt[];
  let gone: Pt[];
  if (t >= 1) {
    const a: Pt = [W, H * (t - 1)];
    const b: Pt = [W * (t - 1), H];
    sheet = [[0, 0], [W, 0], a, b, [0, H]];
    gone = [a, [W, H], b];
  } else {
    const a: Pt = [W * Math.max(t, 0), 0];
    const b: Pt = [0, H * Math.max(t, 0)];
    sheet = [[0, 0], a, b];
    gone = [a, [W, 0], [W, H], [0, H], b];
  }
  const flap = gone.map(mirror);
  // the shading on the back runs across the fold
  const angle = (Math.atan2(ny, nx) * 180) / Math.PI + 90;
  return { sheet: poly(sheet), flap: poly(flap), angle };
}

export function IdleScreen({ onDone }: { onDone: () => void }) {
  const [now, setNow] = useState(() => new Date());
  const [peeling, setPeeling] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const peel = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setPeeling(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sheet = sheetRef.current;
    const flap = flapRef.current;
    if (reduce || !sheet || !flap) {
      // a plain fade for people who prefer less motion
      if (sheet) sheet.style.opacity = "0";
      window.setTimeout(onDone, 260);
      return;
    }
    const W = window.innerWidth, H = window.innerHeight;
    const begin = performance.now();
    const frame = (time: number) => {
      const p = Math.min(1, (time - begin) / PEEL_MS);
      const t = 2 - 2.04 * easeInOut(p);
      const s = peelShapes(W, H, t);
      sheet.style.clipPath = s.sheet;
      flap.style.clipPath = s.flap;
      flap.style.background = `linear-gradient(${s.angle}deg, #f3e6cc 0%, #fffaf0 38%, #e6d3ad 100%)`;
      flap.style.opacity = "1";
      if (p < 1) requestAnimationFrame(frame);
      else onDone();
    };
    requestAnimationFrame(frame);
  }, [onDone]);

  useEffect(() => {
    const go = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.metaKey || e.ctrlKey) && e.key.length > 1) return;
      peel();
    };
    window.addEventListener("keydown", go);
    window.addEventListener("pointerdown", go);
    return () => {
      window.removeEventListener("keydown", go);
      window.removeEventListener("pointerdown", go);
    };
  }, [peel]);

  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="idl-root" role="dialog" aria-modal="true" aria-label="Signed out">
      <div className="idl-sheet" ref={sheetRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="idl-art" src="/images/portal-idle.jpg" alt="" />
        <div className="idl-shade" />

        <div className="idl-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" />
          <span><strong>St. Elizabeth Catholic Hospital</strong><small>Staff portal</small></span>
        </div>

        <div className="idl-clock">
          <div className="idl-time">{time}</div>
          <div className="idl-date">{date}</div>
          <div className="idl-note">
            <strong>You’ve been signed out</strong>
            <span>The portal signs you out after 5 minutes away, to keep patient and staff records private.</span>
          </div>
        </div>

        <button type="button" className="idl-cta" onClick={peel} autoFocus disabled={peeling}>
          Press any key or tap anywhere to sign in
        </button>
      </div>
      <div className="idl-flap" ref={flapRef} aria-hidden="true" />

      <style>{IDLE_CSS}</style>
    </div>
  );
}

const IDLE_CSS = `
.idl-root { position: fixed; inset: 0; z-index: 200; pointer-events: auto; }
.idl-sheet { position: absolute; inset: 0; overflow: hidden; background: #f6e7cf; transition: opacity .25s ease;
  filter: drop-shadow(0 0 28px rgba(40, 24, 8, 0.35)); will-change: clip-path; }
.idl-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 68% 62%; }
.idl-shade { position: absolute; inset: 0;
  background: linear-gradient(115deg, rgba(14, 33, 44, 0.62) 0%, rgba(14, 33, 44, 0.28) 38%, rgba(14, 33, 44, 0) 62%); }
.idl-brand { position: absolute; top: clamp(20px, 4vh, 40px); left: clamp(20px, 4vw, 56px); display: flex; gap: 12px; align-items: center; color: #fff; }
.idl-brand img { width: 46px; height: 46px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(255,255,255,.25); }
.idl-brand strong { display: block; font-size: 15px; letter-spacing: .01em; }
.idl-brand small { display: block; font-size: 12px; opacity: .78; }
.idl-clock { position: absolute; left: clamp(20px, 4vw, 56px); top: 50%; transform: translateY(-58%); color: #fff; max-width: min(520px, 88vw); }
.idl-time { font-family: var(--font-lora), Georgia, serif; font-size: clamp(64px, 11vw, 132px); line-height: 1; font-weight: 600;
  letter-spacing: -0.02em; text-shadow: 0 6px 30px rgba(10, 25, 35, .35); }
.idl-date { margin-top: 8px; font-size: clamp(16px, 2vw, 21px); opacity: .92; }
.idl-note { margin-top: 26px; display: grid; gap: 4px; padding: 14px 18px; border-radius: 16px;
  background: rgba(255, 255, 255, .14); border: 1px solid rgba(255, 255, 255, .28);
  backdrop-filter: blur(10px) saturate(1.2); -webkit-backdrop-filter: blur(10px) saturate(1.2); }
.idl-note strong { font-size: 15px; }
.idl-note span { font-size: 13.5px; line-height: 1.5; opacity: .92; }
.idl-cta { position: absolute; left: 50%; bottom: clamp(24px, 6vh, 56px); transform: translateX(-50%);
  border: 1px solid rgba(255,255,255,.55); background: rgba(14, 33, 44, .38); color: #fff; font: inherit; font-size: 14px; font-weight: 600;
  padding: 12px 22px; border-radius: 999px; cursor: pointer; white-space: nowrap;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); animation: idl-pulse 2.4s ease-in-out infinite; }
.idl-cta:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
@keyframes idl-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,.35); } 50% { box-shadow: 0 0 0 10px rgba(255,255,255,0); } }
.idl-flap { position: absolute; inset: 0; opacity: 0; pointer-events: none; will-change: clip-path;
  filter: drop-shadow(-10px -8px 18px rgba(40, 24, 8, .35)); }
@media (max-width: 560px) {
  .idl-cta { white-space: normal; text-align: center; width: calc(100% - 40px); }
  .idl-clock { top: 46%; }
}
@media (prefers-reduced-motion: reduce) { .idl-cta { animation: none; } }
`;
