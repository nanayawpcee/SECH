"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppointmentModal } from "@/components/ui/AppointmentModalProvider";
import { SITE } from "@/lib/data";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { openModal } = useAppointmentModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          background: scrolled || !isHome ? "rgba(6,51,40,0.97)" : "#063328",
          backdropFilter: scrolled ? "blur(8px)" : "none",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          transition: "all 0.35s ease",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 68,
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            {/* The logo file is already a circle on a transparent field, so it
                needs no wrapper to clip or back it. */}
            <Image
              src="/images/logo.png"
              alt="St. Elizabeth Catholic Hospital Logo"
              width={65}
              height={65}
              priority
              style={{ width: 65, height: 65, flexShrink: 0 }}
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
                Catholic Hospital · Ghana
              </div>
            </div>
          </Link>
          {/* Desktop nav */}
          <div
            className="hide-mobile"
            style={{ display: "flex", alignItems: "center", gap: 28 }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color:
                    pathname === link.href
                      ? "#E8B84B"
                      : "rgba(255,255,255,0.72)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  transition: "color 0.2s",
                  borderBottom:
                    pathname === link.href
                      ? "2px solid #E8B84B"
                      : "2px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => openModal()}
              style={{
                padding: "9px 22px",
                background: "#E8B84B",
                color: "#0D1F1A",
                border: "none",
                borderRadius: 4,
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#F5D080")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#E8B84B")
              }
            >
              Book Appointment
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 24,
              cursor: "pointer",
              padding: 4,
            }}
            className="show-mobile" /* Let classes handle display none/block */
            aria-label="Toggle menu"
          >
            {mobileOpen ? "×" : "☰"}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            style={{
              background: "#063328",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              padding: "1rem 2rem 1.5rem",
            }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "block",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                openModal();
                setMobileOpen(false);
              }}
              className="btn-accent"
              style={{
                marginTop: "1rem",
                width: "100%",
                justifyContent: "center",
              }}
            >
              Book Appointment
            </button>
          </div>
        )}
      </nav>

    </>
  );
}
