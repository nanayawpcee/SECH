"use client";

import { useState } from "react";
import Link from "next/link";
import { SERVICES } from "@/lib/data";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { useAppointmentModal } from "@/components/ui/AppointmentModalProvider";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  preview?: boolean;
}

export function ServicesGrid({ preview = false }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { openModal } = useAppointmentModal();
  const isMobile = useIsMobile();

  const displayed = preview ? SERVICES.slice(0, 4) : SERVICES;

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
                From emergency medicine to specialized clinics — SECH delivers
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

        {/* Grid - FIXED FOR MOBILE */}
        <div
          className="services-grid"
          style={{
            gridTemplateColumns: isMobile
              ? "repeat(auto-fit, minmax(280px, 1fr))"
              : "repeat(auto-fit, minmax(260px, 1fr))",
            gap: isMobile ? "1rem" : "1.25rem",
          }}
        >
          {displayed.map((svc, i) => (
            <AnimateIn key={svc.slug} delay={i * 55}>
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
