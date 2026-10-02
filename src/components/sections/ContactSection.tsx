"use client";

import { Mail, MapPin, Phone, Siren, type LucideIcon } from "lucide-react";
import { SITE, telHref } from "@/lib/data";
import { ContactForm } from "@/components/contact/ContactForm";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { Partners } from "./partnerslider";

type ContactLine = { text: string; href?: string };

const CONTACT_INFO: { icon: LucideIcon; label: string; lines: ContactLine[]; emergency?: boolean }[] = [
  {
    icon: Siren,
    label: "Emergency, 24/7",
    lines: SITE.emergencyPhones.map((n) => ({ text: n, href: telHref(n) })),
    emergency: true,
  },
  {
    icon: Phone,
    label: `Administration (${SITE.phoneHours})`,
    lines: [{ text: SITE.phone, href: telHref(SITE.phone) }],
  },
  { icon: Mail, label: "Email", lines: [{ text: SITE.email, href: `mailto:${SITE.email}` }] },
  {
    icon: MapPin,
    label: "Address",
    lines: [{ text: SITE.address, href: "https://www.google.com/maps/place/St.+Elizabeth+Catholic+Hospital/@6.9325332,-2.3606433,17z" }],
  },
];

// Partner and client lists live in partnerslider.tsx, which renders them.

export function ContactSection() {
  return (
    <section id="contact" className="contact-section">
      <div className="container">
        {/* 2-col grid */}
        <div className="contact-grid">
          {/* Left — contact info */}
          <AnimateIn direction="left">
            <span
              style={{
                color: "#e1c11e",
                fontSize: "0.8rem",
                fontWeight: 500,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                fontFamily: "Lora,serif",
                transition: "color 0.7s",
              }}
            >
              Reach Us
            </span>

            <h2 className="contact-h2">Get in Touch</h2>

            {CONTACT_INFO.map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", gap: 16, marginBottom: 22 }}
              >
                <span style={{ flexShrink: 0, marginTop: 2, color: item.emergency ? "#F08A8D" : "var(--accent)" }}>
                  <item.icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <div className="contact-info-label">{item.label}</div>
                  {item.lines.map((line) =>
                    line.href ? (
                      <a key={line.text} href={line.href} className="contact-link" style={{ display: "block" }}>
                        {line.text}
                      </a>
                    ) : (
                      <div key={line.text} className="contact-link">{line.text}</div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </AnimateIn>

          {/* Right — contact form */}
          <AnimateIn delay={160} direction="right">
            <div className="contact-form">
              <ContactForm theme="dark" compact />
            </div>
          </AnimateIn>
        </div>

        {/* NEW: Full Width Horizontal Infinite Logo Slider */}
        <Partners />
      </div>
    </section>
  );
}
