import type { Metadata } from "next";
import { BadgeCheck, Clock, ShieldCheck, Stethoscope } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { AppointmentPageForm } from "@/components/ui/AppointmentPageForm";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { SITE, DEPARTMENTS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Request a consultation or specialist appointment at St. Elizabeth Catholic Hospital online. Fast, easy, and confirmed within 24 hours.",
};

const WHYS = [
  {
    icon: Clock,
    title: "Fast Confirmation",
    desc: "We call you within 24 hours to confirm your slot.",
  },
  {
    icon: Stethoscope,
    title: "All Specialties",
    desc: "General medicine, surgery, eye care, dental, psychiatry, and more.",
  },
  {
    icon: ShieldCheck,
    title: "Your Privacy",
    desc: "Your personal health information is kept strictly confidential.",
  },
  {
    icon: BadgeCheck,
    title: "NHIS Accepted",
    desc: "We accept the National Health Insurance Scheme and most major insurers.",
  },
];

export default function AppointmentPage() {
  return (
    <>
      <PageHero
        tag="Book Online"
        title="Request an Appointment"
        subtitle="Fill in the form below and our team will confirm your slot within 24 hours. Walk-ins are also welcome."
      />

      <section style={{ padding: "5rem 2rem", background: "#fff" }}>
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: "4.5rem",
            alignItems: "start",
          }}
        >
          {/* Form */}
          <AnimateIn>
            <AppointmentPageForm />
          </AnimateIn>

          {/* Info sidebar */}
          <AnimateIn delay={150} direction="right">
            <div style={{ position: "sticky", top: 90 }}>
              {/* Why book */}
              <div style={{ marginBottom: "1.75rem" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "var(--text-dark)",
                    margin: "0 0 1.1rem",
                  }}
                >
                  Why Book at SECH?
                </h3>
                {WHYS.map((w) => (
                  <div
                    key={w.title}
                    style={{ display: "flex", gap: 14, marginBottom: 16 }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        background: "var(--light-green)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      <w.icon size={19} color="var(--primary)" aria-hidden="true" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--text-dark)",
                          fontSize: "0.9rem",
                          marginBottom: 2,
                        }}
                      >
                        {w.title}
                      </div>
                      <div
                        style={{
                          color: "var(--text-light)",
                          fontSize: "0.82rem",
                          lineHeight: 1.55,
                        }}
                      >
                        {w.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Call CTA */}
              <div
                style={{
                  background: "var(--primary)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    color: "var(--accent)",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Prefer to call?
                </div>
                <div
                  style={{
                    color: "#fff",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    fontFamily: "var(--font-serif)",
                    marginBottom: 4,
                  }}
                >
                  {SITE.phone}
                </div>
                <div
                  style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}
                >
                  Available 24 / 7 for emergencies
                </div>
              </div>

              {/* Departments list */}
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
                  Available Departments
                </div>
                {DEPARTMENTS.map((d) => (
                  <div
                    key={d}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 0",
                      borderBottom: "1px solid #E2EBE7",
                      fontSize: "0.83rem",
                      color: "var(--text-mid)",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        flexShrink: 0,
                      }}
                    />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      <EmergencyBanner />
    </>
  );
}
