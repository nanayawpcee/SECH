"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HERO_SLIDES } from "@/lib/data";
import { useAppointmentModal } from "@/components/ui/AppointmentModalProvider";
import { PatternField } from "@/components/ui/PatternField";

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const { openModal } = useAppointmentModal();
  const slide = HERO_SLIDES[current];

  const goTo = (idx: number) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 700);
  };

  useEffect(() => {
    const t = setInterval(() => goTo((current + 1) % HERO_SLIDES.length), 8000);
    return () => clearInterval(t);
  }, [current, animating]);

  return (
    <section
      className="hero-section"
      style={{ background: slide.bg }}
      aria-label="Hero carousel"
    >
      {/* Each slide keeps its own design — cross, wave, dots — now driven by
          the pointer instead of being painted once and left static. */}
      <PatternField
        pattern={slide.pattern}
        motion="ambient"
        color={slide.accent}
        opacity={0.22}
      />

      {/* Decorative rings */}
      <div
        className="hero-ring large"
        style={{ borderColor: `${slide.accent}22` }}
      />
      <div
        className="hero-ring medium"
        style={{ borderColor: `${slide.accent}33` }}
      />
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
          <span
            style={{
              color: slide.accent,
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              fontFamily: "Lora,serif",
              transition: "color 0.7s",
            }}
          >
            St. Elizabeth Catholic Hospital
          </span>
          

        </div>

        {/* Heading */}
        <h1 key={`h-${current}`} className="hero-heading">
          {slide.heading}
        </h1>

        {/* Sub */}
        <p key={`s-${current}`} className="hero-sub">
          {slide.sub}
        </p>

        {/* CTAs */}
        <div className="hero-ctas">
          {slide.cta === "Book Appointment" ? (
            <button
              onClick={() => openModal()}
              className="hero-cta"
              style={{ background: slide.accent }}
            >
              {slide.cta}
            </button>
          ) : (
            <Link
              href={slide.ctaHref}
              className="hero-cta"
              style={{ background: slide.accent }}
            >
              {slide.cta}
            </Link>
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
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`hero-dot ${i === current ? "active" : ""}`}
            style={{
              background:
                i === current ? slide.accent : "rgba(255,255,255,0.32)",
            }}
          />
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
