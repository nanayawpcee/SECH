"use client";

import { useEffect, useRef } from "react";

export type FieldPattern = "dots" | "cross" | "wave";

/** "pointer" reacts to the cursor; "ambient" plays on its own and ignores it. */
export type FieldMotion = "pointer" | "ambient";

interface Props {
  /**  Unknown values fall back to dots. when there is no hero section to draw */
  pattern?: string;
  motion?: FieldMotion;
  color?: string;
  opacity?: number;

  spacing?: number;
  dotRadius?: number;

  influenceRadius?: number;

  maxOffset?: number;
}
const WAVE_STEP = 8;
const WAVE_AMPLITUDE = 12;

const WAVE_DIVISOR = 60;
const WAVE_SPEED = 0.8;
const WAVE_ROW_PHASE = 0.5;
const RAIN_SPEED = 15;
const CROSS_DRIFT = 14;

const DEFAULT_SPACING: Record<FieldPattern, number> = {
  dots: 28,
  cross: 100,
  wave: 30,
};

function normalise(pattern?: string): FieldPattern {
  return pattern === "cross" || pattern === "wave" ? pattern : "dots";
}


function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export function PatternField({
  pattern,
  motion = "pointer",
  color = "#ffffff",
  opacity = 0.18,
  spacing,
  dotRadius = 2,
  influenceRadius = 140,
  maxOffset = 10,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const kind = normalise(pattern);
    const ambient = motion === "ambient";
    const pitch = spacing ?? DEFAULT_SPACING[kind];
    const EASE = 0.12;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;


    const ink = getComputedStyle(canvas).color;

    interface Point {
      ox: number;
      oy: number;
      x: number;
      y: number;
    }


    let rows: Point[][] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let t0 = 0;
    let clock = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999, active: false };

   
    const pad = ambient && kind === "cross" ? 1 : 0;

    function build() {
      rows = [];
      if (kind === "wave") {
        const cols = Math.ceil(width / WAVE_STEP) + 1;
        for (let r = 0; r * pitch < height + pitch; r++) {
          const row: Point[] = [];
          for (let c = 0; c < cols; c++) {
            const x = c * WAVE_STEP;
            const y =
              r * pitch +
              Math.sin((x / WAVE_DIVISOR) * Math.PI) * WAVE_AMPLITUDE;
            row.push({ ox: x, oy: y, x, y });
          }
          rows.push(row);
        }
        return;
      }
      const cols = Math.ceil(width / pitch) + 1 + pad * 2;
      const rowCount = Math.ceil(height / pitch) + 1 + pad * 2;
      for (let r = 0; r < rowCount; r++) {
        const row: Point[] = [];
        for (let c = 0; c < cols; c++) {
          const x = (c - pad) * pitch;
          const y = (r - pad) * pitch;
          row.push({ ox: x, oy: y, x, y });
        }
        rows.push(row);
      }
    }

    function stroke(points: Point[]) {
      if (!ctx || points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    function prime() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = ink;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
    }

    function paint() {
      if (!ctx) return;
      prime();

      if (kind === "dots") {
        for (const row of rows) {
          for (const p of row) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        return;
      }


      for (const row of rows) stroke(row);
      if (kind === "cross" && rows.length) {
        for (let c = 0; c < rows[0].length; c++) {
          stroke(rows.map((row) => row[c]));
        }
      }
    }


    function paintAmbient(t: number) {
      if (!ctx) return;
      prime();

      if (kind === "wave") {
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          ctx.beginPath();
          for (let i = 0; i < row.length; i++) {
            const x = row[i].ox;
            const y =
              r * pitch +
              Math.sin(
                (x / WAVE_DIVISOR) * Math.PI -
                  t * WAVE_SPEED +
                  r * WAVE_ROW_PHASE,
              ) *
                WAVE_AMPLITUDE;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        return;
      }

      if (kind === "cross") {
        {/* Endless grid drift: the mesh slides diagonally by less than one celll 
          so the wrap is seamless and the grid reads  as infinite.
          */}
        const off = (t * CROSS_DRIFT) % pitch;
        ctx.save();
        ctx.translate(off, off);
        for (const row of rows) stroke(row);
        if (rows.length) {
          for (let c = 0; c < rows[0].length; c++) {
            stroke(rows.map((row) => row[c]));
          }
        }
        ctx.restore();
        return;
      }

      {/*
        Rain: columns fall at their own pace and size, which reads as depth.
        Travel spans one pitch past both eddges so dots enter and leavee out of 
        sight instead of popping in at the boundary;
        
        */}
      const span = height + pitch * 2;
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          const p = rows[r][c];
          const h = hash(c);
          const speed = RAIN_SPEED * (0.55 + h * 0.9);
          const radius = dotRadius * (0.7 + hash(c + 97) * 0.6);
          const y = ((p.oy + pitch + t * speed) % span) - pitch;
          ctx.beginPath();
          ctx.arc(p.ox, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function render(t: number) {
      if (ambient) paintAmbient(t);
      else paint();
    }

    function tickAmbient(now: number) {
      if (!t0) t0 = now - clock * 1000;
      clock = (now - t0) / 1000;
      paintAmbient(clock);
      frame = requestAnimationFrame(tickAmbient);
    }

    function tick() {
      let moving = false;
      for (const row of rows) {
        for (const p of row) {
          let targetX = p.ox;
          let targetY = p.oy;
          if (pointer.active) {
            const dx = p.ox - pointer.x;
            const dy = p.oy - pointer.y;
            const dist = Math.hypot(dx, dy);
            if (dist < influenceRadius) {
              const strength = (1 - dist / influenceRadius) * maxOffset;
              const angle = Math.atan2(dy, dx);
              targetX = p.ox + Math.cos(angle) * strength;
              targetY = p.oy + Math.sin(angle) * strength;
            }
          }
          p.x += (targetX - p.x) * EASE;
          p.y += (targetY - p.y) * EASE;
          if (
            Math.abs(targetX - p.x) > 0.05 ||
            Math.abs(targetY - p.y) > 0.05
          ) {
            moving = true;
          }
        }
      }

      if (pointer.active || moving) {
        paint();
        frame = requestAnimationFrame(tick);
        return;
      }

      for (const row of rows) {
        for (const p of row) {
          p.x = p.ox;
          p.y = p.oy;
        }
      }
      paint();
      frame = 0;
    }

    function start() {
      if (frame || reduced || !visible) return;
      frame = requestAnimationFrame(ambient ? tickAmbient : tick);
    }

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      t0 = 0; // resume from where the clock left off rather than jumping
    }

    function resize() {
      if (!canvas || !host || !ctx) return;
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      render(clock);
      start();
    }

    function onPointerMove(e: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
      start();
    }

    function onPointerLeave() {
      pointer.active = false;
      start();
    }


    const observer = new ResizeObserver(resize);
    observer.observe(host);

   
    const seen = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    seen.observe(host);

    if (!reduced && !ambient) {
      host.addEventListener("pointermove", onPointerMove);
      host.addEventListener("pointerleave", onPointerLeave);
    }

    resize();

    return () => {
      observer.disconnect();
      seen.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [
    pattern,
    motion,
    color,
    spacing,
    dotRadius,
    influenceRadius,
    maxOffset,
  ]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        color,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
