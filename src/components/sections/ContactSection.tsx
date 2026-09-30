"use client";

import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { SITE } from "@/lib/data";
import { ContactForm } from "@/components/contact/ContactForm";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { Partners } from "./partnerslider";

const CONTACT_INFO: { icon: LucideIcon; label: string; value: string; href?: string }[] = [
  {
    icon: MapPin,
    label: "Address",
    value: SITE.address,
    href: "https://www.google.com/maps/place/St.+Elizabeth+Catholic+Hospital/@6.9325332,-2.3606433,17z",
  },
  { icon: Phone, label: "Phone", value: SITE.phone.trim(), href: `tel:${SITE.phone.replace(/\s+/g, "")}` },
  {
    icon: Mail,
    label: "Email",
    value: SITE.email,
    href: `mailto:${SITE.email}`,
  },
  { icon: Clock, label: "Hours", value: SITE.hours, href: undefined },
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
                <span style={{ flexShrink: 0, marginTop: 2, color: "var(--accent)" }}>
                  <item.icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <div className="contact-info-label">{item.label}</div>
                  {item.href ? (
                    <a href={item.href} className="contact-link">
                      {item.value}
                    </a>
                  ) : (
                    <div className="contact-link">{item.value}</div>
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
