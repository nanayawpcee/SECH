import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ContactSection } from "@/components/sections/ContactSection";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { AnimateIn } from "@/components/ui/AnimateIn";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with St. Elizabeth Catholic Hospital. Find our address, phone number, email, and opening hours.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        tag="Get in Touch"
        title="Contact St. Elizabeth Catholic Hospital"
        subtitle="We're here for you — reach out by phone, email, or visit us in Hwidiem, off Kumasi-Goaso Highway."
        dotGrid
      />

      {/* Map embed placeholder */}
      <div style={{ background: "var(--light-green)", padding: "3rem 2rem" }}>
        <div className="container">
          <AnimateIn>
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1.5px solid #C8DCCE",
                height: 320,
                background: "var(--primary-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {/* Stylised map placeholder */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "radial-gradient(circle at 50% 50%, rgba(26,122,94,0.15) 0%, transparent 70%)",
                }}
              />
              <div style={{ textAlign: "center", position: "relative" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
                <div
                  style={{
                    color: "#fff",
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                  }}
                >
                  Hwidiem
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.85rem",
                    marginTop: 4,
                  }}
                >
                  Asutufi South District, Ahafo Region, Ghana
                </div>
                <a
                  href="https://www.google.com/maps/place/St.+Elizabeth+Catholic+Hospital/@6.9325332,-2.3606433,17z/data=!4m6!3m5!1s0xfdb2e3e952a5dcd:0xaaa7c226d485c7f7!8m2!3d6.9325279!4d-2.3580684!16s%2Fg%2F11cktmsnnr?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 16,
                    padding: "9px 20px",
                    background: "var(--accent)",
                    color: "var(--text-dark)",
                    borderRadius: 4,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                  }}
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>

      <ContactSection />
      <EmergencyBanner />
    </>
  );
}
