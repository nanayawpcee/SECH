"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { HERO_SLIDES, SITE, telHref } from "@/lib/data";
import type { NewsItem } from "@/lib/news";
import { useAppointmentModal } from "@/components/ui/AppointmentModalProvider";
import { PatternField } from "@/components/ui/PatternField";
import { Siren } from "lucide-react";

type Slide = (typeof HERO_SLIDES)[number] & { kicker?: string; image?: NewsItem["image"] };

export function HeroCarousel({ story }: { story?: NewsItem | null }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const { openModal } = useAppointmentModal();
  // the story chosen to lead the News page goes first
  const slides: Slide[] = useMemo(
    () => story
      ? [{
          heading: story.title,
          sub: story.excerpt,
          cta: "Read the story",
          ctaHref: `/news/${story.slug}`,
          bg: "#063328",
          accent: "#E8B84B",
          pattern: "dots",
          kicker: `Featured ${story.category === "Events" ? "event" : "story"}`,
          image: story.image,
        }, ...HERO_SLIDES]
      : HERO_SLIDES,
    [story],
  );
  const slide = slides[current];
  const isStory = !!slide.kicker;

  const goTo = (idx: number) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 700);
  };

  useEffect(() => {
    const t = setInterval(() => goTo((current + 1) % slides.length), 8000);
    return () => clearInterval(t);
  }, [current, animating]);

  return (
    <section
      className="hero-section"
      style={{ background: slide.bg }}
      aria-label="Hero carousel"
    >
      <PatternField
        pattern={slide.pattern}
        motion="ambient"
        color={slide.accent}
        opacity={0.22}
      />

      <div
        className="hero-ring large"
        style={{ borderColor: `${slide.accent}22` }}
      />
      <div
        className="hero-ring medium"
        style={{ borderColor: `${slide.accent}33` }}
      />
      <div className="hero-ring small" />

      <div className={`container hero-container${isStory ? " hero-container--story" : ""}`}>
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
            {slide.kicker ?? "St. Elizabeth Catholic Hospital"}
          </span>
          

        </div>

        {/* a story title isn't the page's main heading, so it gets an h2 */}
        {isStory ? (
          <>
            <h1 className="sr-only">St. Elizabeth Catholic Hospital, Hwidiem</h1>
            <h2 key={`h-${current}`} className="hero-heading hero-heading--story">{slide.heading}</h2>
          </>
        ) : (
          <h1 key={`h-${current}`} className="hero-heading">{slide.heading}</h1>
        )}

        <p key={`s-${current}`} className={`hero-sub${isStory ? " hero-sub--story" : ""}`}>
          {slide.sub}
        </p>

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
            href={telHref(SITE.emergencyPhones[0])}
            className="hero-emergency"
            aria-label={`Emergency line, 24 hours: ${SITE.emergencyPhones[0]}`}
          >
            <Siren size={17} aria-hidden="true" />
            Emergency {SITE.emergencyPhones[0]}
          </a>
        </div>
        {isStory && slide.image && (
          <Link key={`img-${current}`} href={slide.ctaHref} className="hero-story-photo" tabIndex={-1} aria-hidden="true">
            <Image src={slide.image.src} alt="" fill sizes="(max-width: 1100px) 40vw, 440px" style={{ objectFit: "contain" }} priority />
          </Link>
        )}
      </div>

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
        {slides.map((_, i) => (
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

      <div className="hero-scrollhint">
        <span>Scroll</span>
        <div />
      </div>
    </section>
  );
}
