import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICES } from "@/lib/data";
import { PageHero } from "@/components/ui/PageHero";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { BookButton } from "@/components/ui/BookButton";
import { HoverLink } from "@/components/ui/HoverLink";
import { Check } from "lucide-react";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const svc = SERVICES.find((s) => s.slug === params.slug);
  if (!svc) return { title: "Service Not Found" };
  return { title: svc.title, description: svc.shortDesc };
}

export default function ServiceDetailPage({ params }: Props) {
  const svc = SERVICES.find((s) => s.slug === params.slug);
  if (!svc) notFound();

  const others = SERVICES.filter((s) => s.slug !== svc.slug).slice(0, 4);

  return (
    <>
      <PageHero
        tag="Our Services"
        title={svc.title}
        subtitle={svc.shortDesc}
        backgroundImage={svc.image}
      />

      <section style={{ padding: "5rem 2rem", background: "#fff" }}>
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Main Content */}
          <AnimateIn>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 40,
                fontWeight: 700,
                marginBottom: "1.25rem",
                fontFamily: "var(--font-serif)",
              }}
            >
              <img
                src={svc.icon}
                alt={`${svc.title} icon`}
                style={{ width: "40px", height: "auto" }}
              />
              {svc.title}
            </div>

            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--text-dark)",
                margin: "0 0 1.25rem",
              }}
            >
              About This Service
            </h2>
            <p
              style={{
                color: "var(--text-light)",
                lineHeight: 1.82,
                fontSize: "1rem",
                marginBottom: "2.5rem",
              }}
            >
              {svc.fullDesc}
            </p>

            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                margin: "0 0 1rem",
              }}
            >
              What We Offer
            </h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 2.5rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.65rem",
              }}
            >
              {svc.features.map((feat) => (
                <li
                  key={feat}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--light-green)",
                      border: "1.5px solid var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                  </div>
                  <span
                    style={{
                      fontSize: "0.88rem",
                      color: "var(--text-mid)",
                      fontWeight: 500,
                    }}
                  >
                    {feat}
                  </span>
                </li>
              ))}
            </ul>
            <BookButton dept={svc.title} />
          </AnimateIn>

          {/* Sidebar - Controlled by CSS responsive visibility */}
          <aside
            className="desktop-only-sidebar"
            style={{ position: "sticky", top: 90 }}
          >
            <AnimateIn delay={150} direction="right">
              <div
                style={{
                  background: "var(--primary)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h3
                  style={{
                    color: "#fff",
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    margin: "0 0 10px",
                  }}
                >
                  Ready to Book?
                </h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.84rem",
                    lineHeight: 1.65,
                    margin: "0 0 1.25rem",
                  }}
                >
                  Schedule a consultation for {svc.title}. Our team will confirm
                  your slot within 24 hours.
                </p>
                <BookButton
                  dept={svc.title}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    background: "var(--accent)",
                    color: "var(--text-dark)",
                  }}
                />
              </div>

              <div
                style={{
                  background: "var(--off-white)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.5rem",
                  border: "1.5px solid #E2EBE7",
                }}
              >
                <div
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--primary-light)",
                    marginBottom: 12,
                  }}
                >
                  Opening Hours
                </div>
                {[
                  ["Out-Patient (OPD)", "Mon–Fri  7:30 AM – 5 PM"],
                  ["Emergency", "24 Hours, 7 Days"],
                  ["Lab / Pharmacy", "Mon–Sat  7 AM – 6 PM"],
                ].map(([dept, hrs]) => (
                  <div
                    key={dept}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #E2EBE7",
                      fontSize: "0.83rem",
                    }}
                  >
                    <span style={{ color: "var(--text-mid)", fontWeight: 600 }}>
                      {dept}
                    </span>
                    <span style={{ color: "var(--text-light)" }}>{hrs}</span>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </aside>
        </div>
      </section>

      {/* Other services */}
      <section
        style={{ padding: "4rem 2rem 5rem", background: "var(--off-white)" }}
      >
        <div className="container">
          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.3rem",
              fontWeight: 800,
              color: "var(--text-dark)",
              marginBottom: "1.75rem",
            }}
          >
            Other Services
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: "1rem",
            }}
          >
            {others.map((s) => (
              <HoverLink
                key={s.slug}
                href={`/services/${s.slug}`}
                baseStyle={{ borderColor: "#E2EBE7", boxShadow: "none" }}
                hoverStyle={{
                  borderColor: "var(--primary)",
                  boxShadow: "var(--shadow-card)",
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "1rem 1.25rem",
                  background: "#fff",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px solid #E2EBE7",
                  transition: "all 0.2s",
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    display: "flex",
                    alignItems: "center",
                    width: 40,
                  }}
                >
                  <img
                    src={s.icon}
                    alt={`${s.title} icon`}
                    style={{ width: "100%", height: "auto" }}
                  />
                </span>
                <span
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "var(--text-dark)",
                  }}
                >
                  {s.title}
                </span>
              </HoverLink>
            ))}
          </div>
        </div>
      </section>

      <EmergencyBanner />
    </>
  );
}
