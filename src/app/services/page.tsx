import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { AnimateIn } from "@/components/ui/AnimateIn";
import Link from "next/link";
// Import both datasets so we can map strings to slugs
import { DEPARTMENT_GRID_DATA, SERVICES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Explore the full range of medical and health services offered at St. Elizabeth Catholic Hospital — from in-patient care to specialist clinics.",
};

// ─── Card component ─────────────ß──────────────────────────────────────────────
function DepartmentCard({
  dept,
}: {
  dept: (typeof DEPARTMENT_GRID_DATA)[number];
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        border: dept.featured ? "2px solid #E8B84B" : "1.5px solid #E2EBE7",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: dept.featured
          ? "0 8px 32px rgba(232,184,75,0.12)"
          : "0 2px 12px rgba(6,51,40,0.06)",
        position: "relative",
      }}
    >
      {/* Featured ribbon */}
      {dept.featured && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "#E8B84B",
            color: "#063328",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "4px 12px",
            borderRadius: "999px",
            zIndex: 2,
          }}
        >
          {"featuredLabel" in dept ? dept.featuredLabel : "Featured"}
        </div>
      )}

      {/* Card header */}
      <div style={{ ...dept.headerStyle, padding: "1.5rem 1.5rem 1.25rem" }}>
        {/* Icon.
            The department marks are full-colour illustrations with baked-in
            fills, so they sit on a light plate rather than the dark header —
            dark-toned artwork has nothing to read against on deep green.
            (dept.iconColor no longer tints these; it only applied to the old
            currentColor line icons.) */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            background: "rgba(244,247,245,0.94)",
            border: "1px solid rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <img
            src={dept.icon}
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            style={{
              width: 28,
              height: 28,
              objectFit: "contain",
              // Stopgap for the two light-toned marks — remove per department
              // once its artwork is dark enough to stand on the plate unaided.
              filter:
                dept.iconTone === "light"
                  ? "brightness(0.6) saturate(1.15)"
                  : undefined,
            }}
          />
        </div>

        {/* Badge */}
        <span
          style={{
            ...dept.badgeStyle,
            display: "inline-block",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "4px 12px",
            borderRadius: "999px",
            marginBottom: "0.75rem",
          }}
        >
          {dept.badge}
        </span>

        {/* Title & subtitle */}
        <p
          style={{
            color: "#fff",
            fontFamily: "var(--font-serif)",
            fontSize: "1.3rem",
            fontWeight: 700,
            margin: "0 0 4px",
            lineHeight: 1.3,
          }}
        >
          {dept.title}
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "0.82rem",
            margin: 0,
          }}
        >
          {dept.subtitle}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "#E2EBE7" }} />

      {/* Services list */}
      <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--primary-light, #0A4F3C)",
            marginBottom: "0.85rem",
            opacity: 0.6,
          }}
        >
          Includes
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {dept.services.map((svcName) => {
            // Find if this service name exists in our detailed SERVICES array
            const matchedService = SERVICES.find(
              (s) =>
                s.title.toLowerCase() === svcName.toLowerCase() ||
                (svcName.includes("Haematology") && s.slug === "laboratory") ||
                (svcName.includes("X-Ray") && s.slug === "imaging") ||
                (svcName.includes("Eye") && s.slug === "eye-center") ||
                (svcName.includes("Maxillofacial") && s.slug === "dental") ||
                (svcName.includes("ANC") && s.slug === "antenatal") ||
                (svcName.includes("Psychiatry") && s.slug === "psychiatry") ||
                (svcName.includes("Ear") && s.slug === "ENT") ||
                (svcName.includes("ECG") && s.slug === "ecg") ||
                (svcName.includes("Dietherapy") && s.slug === "nutrition"),
            );

            // Inner content layout to keep UI consistent
            const linkContent = (
              <>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: dept.dotColor,
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.86rem",
                    lineHeight: 1.5,
                    fontWeight: 500,
                    textDecoration: matchedService ? "underline" : "none",
                    textDecorationColor: "rgba(0,0,0,0.15)",
                  }}
                >
                  {svcName} {matchedService && "→"}
                </span>
              </>
            );

            return (
              <li
                key={svcName}
                style={{
                  borderBottom: "1px solid #F0F5F3",
                  transition: "background 0.2s",
                }}
              >
                {matchedService ? (
                  <Link
                    href={`/services/${matchedService.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "7px 0",
                      color: "var(--text-mid, #4A5D57)",
                      textDecoration: "none",
                    }}
                    className="service-item-hover"
                  >
                    {linkContent}
                  </Link>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "7px 0",
                      color: "var(--text-light, #8A9D97)", // Slightly muted if no detail page exists yet
                    }}
                  >
                    {linkContent}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* CTA footer */}
      <div style={{ padding: "1rem 1.5rem 1.5rem" }}>
        <Link
          href="/appointment"
          style={{
            display: "block",
            textAlign: "center",
            padding: "0.7rem 1rem",
            borderRadius: "8px",
            background: dept.featured ? "#E8B84B" : "transparent",
            border: dept.featured ? "none" : "1.5px solid #E2EBE7",
            color: dept.featured ? "#063328" : "var(--primary, #0A4F3C)",
            fontSize: "0.84rem",
            fontWeight: 700,
            textDecoration: "none",
            transition: "all 0.2s",
            letterSpacing: "0.02em",
          }}
        >
          Book a Consultation →
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function ServicesPage() {
  return (
    <>
      <PageHero
        tag="What We Offer"
        title="Our Medical Services"
        subtitle="World-class healthcare across medicine, surgery, diagnostics, and specialist clinics — available to every patient, every day."
        dotGrid
      />

      <section
        style={{
          padding: "5rem 1.5rem 6rem",
          background: "var(--off-white, #F7FAF8)",
        }}
      >
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Section intro */}
          <AnimateIn>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(10,79,60,0.08)",
                  color: "#0A4F3C",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "5px 14px",
                  borderRadius: "999px",
                  marginBottom: "1rem",
                }}
              >
                Four Departments
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                  fontWeight: 800,
                  color: "var(--text-dark, #0D1F1A)",
                  margin: "0 0 0.75rem",
                  lineHeight: 1.2,
                }}
              >
                Comprehensive Care, Organised for You
              </h2>
              <p
                style={{
                  color: "var(--text-light, #6B8077)",
                  fontSize: "1rem",
                  maxWidth: 540,
                  margin: "0 auto",
                  lineHeight: 1.7,
                }}
              >
                Every service at St. Elizabeth Catholic Hospital falls within
                one of four core departments, each staffed by dedicated
                specialists.
              </p>
            </div>
          </AnimateIn>

          {/* Department cards grid */}
          <AnimateIn delay={100}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1.25rem",
                alignItems: "start",
              }}
            >
              {DEPARTMENT_GRID_DATA.map((dept) => (
                <DepartmentCard key={dept.key} dept={dept} />
              ))}
            </div>
          </AnimateIn>

          {/* Bottom note */}
          <AnimateIn delay={200}>
            <p
              style={{
                textAlign: "center",
                marginTop: "2.5rem",
                fontSize: "0.84rem",
                color: "var(--text-light, #6B8077)",
              }}
            >
              Need guidance on which department is right for you?{" "}
              <Link
                href="/contact"
                style={{
                  color: "var(--primary, #0A4F3C)",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Contact our team
              </Link>
              .
            </p>
          </AnimateIn>
        </div>
      </section>

      <EmergencyBanner />
    </>
  );
}
