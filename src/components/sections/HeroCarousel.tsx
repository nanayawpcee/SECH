"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { HERO_SLIDES } from "@/lib/data";
import { useAppointmentModal } from "@/components/ui/AppointmentModalProvider";

function usePattern(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  type: string,
  color: string,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth || 1100;
    canvas.height = canvas.offsetHeight || 560;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    if (type === "cross") {
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (type === "wave") {
      for (let y = 0; y < canvas.height + 30; y += 30) {
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 2) {
          const wy = y + Math.sin((x / 60) * Math.PI) * 12;
          x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
        }
        ctx.stroke();
      }
    } else {
      for (let x = 4; x < canvas.width; x += 28)
        for (let y = 4; y < canvas.height; y += 28) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
    }
  }, [type, color, canvasRef]);
}

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { openModal } = useAppointmentModal();
  const slide = HERO_SLIDES[current];

  usePattern(canvasRef, slide.pattern, slide.accent);

  const goTo = (idx: number) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 700);
  };

  useEffect(() => {
    const t = setInterval(() => goTo((current + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(t);
  }, [current, animating]);

  return (
    <section className="hero-section" style={{ background: slide.bg }} aria-label="Hero carousel">
      {/* Pattern canvas */}
      <canvas ref={canvasRef} className="hero-canvas" />

      {/* Decorative rings */}
      <div className="hero-ring large" style={{ borderColor: `${slide.accent}22` }} />
      <div className="hero-ring medium" style={{ borderColor: `${slide.accent}33` }} />
      <div className="hero-ring small" />

      {/* Content */}
      <div className="container hero-container">
        {/* Tag line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              width: 32,
              height: 2,
              background: slide.accent,
              transition: "background 0.7s",
            }}
          />
          <span
            style={{
              color: slide.accent,
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              fontFamily: "Georgia,serif",
              transition: "color 0.7s",
            }}
          >
            St. Elizabeth Catholic Hospital
          </span>
        </div>

        {/* Heading */}
        <h1 key={`h-${current}`} className="hero-heading">{slide.heading}</h1>

        {/* Sub */}
        <p key={`s-${current}`} className="hero-sub">{slide.sub}</p>

        {/* CTAs */}
        <div className="hero-ctas">
          {slide.cta === "Book Appointment" ? (
            <button onClick={() => openModal()} className="hero-cta" style={{ background: slide.accent }}>{slide.cta}</button>
          ) : (
            <Link href={slide.ctaHref} className="hero-cta" style={{ background: slide.accent }}>{slide.cta}</Link>
          )}
          <a
            href="tel:+233322298428"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "transparent",
              color: "#fff",
              border: "1.5px solid rgba(255,255,255,0.38)",
              borderRadius: 4,
              fontSize: "0.92rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)")
            }
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.38)")
            }
          >
            +233 322 298 428
          </a>
        </div>
      </div>

      {/* Slide dots */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 9,
          zIndex: 3,
        }}
      >
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Go to slide ${i + 1}`} className={`hero-dot ${i === current ? 'active' : ''}`} style={{ background: i === current ? slide.accent : 'rgba(255,255,255,0.32)' }} />
        ))}
      </div>

      {/* Scroll hint */}
      <div className="hero-scrollhint">
        <span>Scroll</span>
        <div />
      </div>
    </section>
  );
}
