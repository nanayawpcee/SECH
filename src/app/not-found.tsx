import "@/styles/not-found.css";
import { Fragment } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Home, Stethoscope } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

const HELPFUL_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/news", label: "News" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

export default function NotFound() {
  return (
    <div className="nf">
      <div className="nf-inner">
        <div className="nf-art">
          <div className="nf-num" aria-hidden="true">404</div>
          <div className="nf-logo">
            <Image src="/images/logo.png" alt="St. Elizabeth Catholic Hospital logo" width={80} height={80} />
          </div>
        </div>

        <h1>Page Not Found</h1>
        <p className="nf-text">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>

        <div className="nf-actions">
          <Link href="/" className="btn-primary">
            <Home size={16} aria-hidden="true" />
            Return to Home
          </Link>
          <Link href="/services" className="btn-outline">
            <Stethoscope size={16} aria-hidden="true" />
            Our Services
          </Link>
        </div>

        <div className="nf-help">
          <p>Looking for something specific?</p>
          <nav className="nf-links" aria-label="Helpful links">
            {HELPFUL_LINKS.map((l, i) => (
              <Fragment key={l.href}>
                {i > 0 && <span className="nf-sep" aria-hidden="true">|</span>}
                <Link href={l.href}>{l.label}</Link>
              </Fragment>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
