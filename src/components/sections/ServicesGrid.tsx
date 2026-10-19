"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SERVICES } from "@/lib/data";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { useScrollRail } from "@/components/ui/useScrollRail";
import { useAppointmentModal } from "@/components/ui/AppointmentModalProvider";

interface Props {
  preview?: boolean;
}

export function ServicesGrid({ preview = false }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { openModal } = useAppointmentModal();

  const displayed = preview ? SERVICES.slice(0, 4) : SERVICES;

  // On tablets the cards become a swipeable row (see .services-grid in
  // globals.css), with arrows.
  const { railRef, canPrev, canNext, step } = useScrollRail(".service-cell");

  return (
    <section id="services" className="services-section">
      <div className="services-container">
        {/* Header */}
        <AnimateIn>
          <div className="services-header">
            <div className="services-intro">
              <div className="section-tag">
                <span>What We Offer</span>
              </div>
              <h2 className="section-heading">
                Comprehensive Medical Services
              </h2>
              <p>
                From emergency medicine to specialized clinics. We provide
                expert care under one roof, every day of the year.
              </p>
            </div>
            {preview && (
              <Link
                href="/services"
                style={{
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  letterSpacing: "0.06em",
                  flexShrink: 0,
                }}
              >
                View All Services →
              </Link>
            )}
          </div>
        </AnimateIn>

        <div className="services-rail-nav">
          <button type="button" className="services-rail-btn" onClick={() => step(-1)} disabled={!canPrev}
            aria-label="Previous services" aria-controls="services-rail">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button type="button" className="services-rail-btn" onClick={() => step(1)} disabled={!canNext}
            aria-label="More services" aria-controls="services-rail">
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Every card is the same fixed size at every screen width: 4 in a
            row on wide screens, a swipeable row on tablets, one per row on
            phones. */}
        <div className="services-grid" id="services-rail" ref={railRef} role="region" aria-label="Our services" tabIndex={0}>
          {displayed.map((svc, i) => (
            <AnimateIn key={svc.slug} delay={i * 55} className="service-cell">
              <div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => e.stopPropagation()}
                className={`service-card ${hovered === i ? "is-hovered" : ""}`}
              >
                <div className="service-media">
                  <img src={svc.icon} alt={svc.title} />
                </div>

                <h3>{svc.title}</h3>

                <p>{svc.shortDesc}</p>

                <div className="service-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal?.(svc.title);
                    }}
                    className="btn book"
                  >
                    BOOK NOW
                  </button>
                  <Link
                    href={`/services/${svc.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn book alt"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
