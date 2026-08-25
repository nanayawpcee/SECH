"use client";

import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/data";

/** Rendered height of the accreditation crests, in px. */
const LOGO_HEIGHT = 30;

/**
 * Accrediting bodies, shown as their real crests rather than initials.
 * `width` is each file's own aspect ratio resolved at LOGO_HEIGHT, so the
 * marks keep their proportions instead of being squared off.
 */
const ACCREDITATIONS = [
  {
    short: "CHAG",
    name: "Christian Health Association of Ghana",
    logo: "/images/partnerlogos/chag.png",
    width: 25, // 460 × 543
  },
  {
    short: "GHS",
    name: "Ghana Health Service",
    logo: "/images/partnerlogos/ghs.png",
    width: 23, // 278 × 360
  },
  {
    short: "MOH",
    name: "Ministry of Health, Ghana",
    logo: "/images/partnerlogos/moh.png",
    width: 30, // 300 × 300
  },
];

const FOOTER_LINKS = {
  Services: [
    { label: "In-Patient Care", href: "/services/inpatient" },
    { label: "Laboratory", href: "/services/laboratory" },
    { label: "Eye Center", href: "/services/eye-center" },
    { label: "Dental Services", href: "/services/dental" },
    { label: "Pharmacy", href: "/services/pharmacy" },
  ],
  Hospital: [
    { label: "About Us", href: "/about" },
    { label: "Our Team", href: "/about#team" },
    { label: "News", href: "/news" },
    { label: "Contact", href: "/contact" },
    { label: "Appointment", href: "/appointment" },
    { label: "Organogram", href: "/organogram" },
  ],
};

export function Footer() {
  return (
    <footer
      style={{
        background: "#040F0C",
        padding: "3.5rem 0 1.75rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="container">
        {/* FIX: grid columns handled via className + globals.css — avoids hydration mismatch */}
        <div className="footer-grid" style={{ marginBottom: "2.5rem" }}>
          <div>
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <Image
                src="/images/logo.png"
                alt="St. Elizabeth Catholic Hospital Logo"
                width={36}
                height={36}
                style={{ width: 36, height: 36, flexShrink: 0 }}
              />

              <div>
                <div
                  style={{
                    color: "#fff",
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    fontFamily: "var(--font-serif)",
                    lineHeight: 1.1,
                  }}
                >
                  ST. ELIZABETH
                </div>
                <div
                  style={{
                    color: "#E8B84B",
                    fontSize: "0.6rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                  }}
                >
                  Catholic Hospital
                </div>
              </div>
            </Link>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.83rem",
                lineHeight: 1.75,
                maxWidth: 270,
                marginBottom: "1.25rem",
              }}
            >
              Providing quality, compassionate Catholic healthcare to the
              communities of Ghana's Ahafo Region since the 1970s.
            </p>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {ACCREDITATIONS.map((body) => (
                <span
                  key={body.short}
                  title={body.name}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "7px 11px",
                    // The crests are full-colour marks drawn for light stock,
                    // so they sit on a light plate rather than the near-black
                    // footer — matching how the partner strip presents them.
                    background: "rgba(255,255,255,0.94)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    borderRadius: 4,
                  }}
                >
                  <Image
                    src={body.logo}
                    alt={body.name}
                    width={body.width}
                    height={LOGO_HEIGHT}
                    style={{
                      height: LOGO_HEIGHT,
                      width: "auto",
                      objectFit: "contain",
                    }}
                  />
                </span>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <div
                style={{
                  color: "#E8B84B",
                  fontSize: "0.67rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                  marginBottom: 14,
                }}
              >
                {title}
              </div>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.84rem",
                    marginBottom: 9,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: "1.5rem",
            paddingBottom: "1rem",
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: "📞", val: SITE.phone, href: `tel:${SITE.phone}` },
            { icon: "✉️", val: SITE.email, href: `mailto:${SITE.email}` },
            { icon: "📍", val: "Hwidiem, Ahafo Region, Ghana", href: "#" },
          ].map((item) => (
            <a
              key={item.val}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "rgba(255,255,255,0.35)",
                fontSize: "0.78rem",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.7)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.35)")
              }
            >
              <span>{item.icon}</span> {item.val}
            </a>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap" as const,
            gap: 8,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.74rem" }}>
            © {new Date().getFullYear()} St. Elizabeth Catholic Hospital, Ghana.
            All rights reserved.
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.74rem" }}>
            A CHAG Member Institution
          </span>
        </div>
      </div>
    </footer>
  );
}
