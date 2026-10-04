import "@/styles/contact.css";
import "@/styles/faq.css";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  FileText,
  HelpCircle,
  IdCard,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Siren,
  ExternalLink,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { FaqList } from "@/components/faq/FaqList";
import { FEATURED_FAQS } from "@/lib/faq";
import { SITE, telHref } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with St. Elizabeth Catholic Hospital, Hwidiem. Call us 24/7, send a message, or get directions to the hospital.",
  alternates: { canonical: "/contact" },
};

// The hospital's pin on Google Maps.
const LAT_LNG = `${SITE.geo.lat},${SITE.geo.lng}`;
const MAPS_PLACE = SITE.mapsUrl;
const MAPS_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${LAT_LNG}`;

export default function ContactPage() {
  // The office line closes at 5pm and at weekends; emergencies use the 24-hour lines.
  const officePhone = SITE.phone;
  const officeTel = telHref(officePhone);

  return (
    <>
      <PageHero
        tag="Get in Touch"
        title="Contact St. Elizabeth Catholic Hospital"
        subtitle="We're here for you. Call us any time, send a message, or visit us in Hwidiem, off the Kumasi–Goaso highway."
        dotGrid
      />

      <section className="ct-page">
        <div className="ct-container">
          {/* The four ways people most often need to reach us. */}
          <div className="ct-quick">
            <div className="ct-card" data-tone="emergency">
              <span className="ct-card-icon"><Siren size={22} aria-hidden="true" /></span>
              <span className="ct-card-label">Emergency, 24/7</span>
              <span className="ct-card-lines">
                {SITE.emergencyPhones.map((n) => (
                  <a key={n} href={telHref(n)} className="ct-card-value ct-card-call" aria-label={`Call the emergency line ${n}`}>
                    <Phone size={16} aria-hidden="true" />{n}
                  </a>
                ))}
              </span>
              <span className="ct-card-note">Answered day and night, every day. Or come straight to our Emergency Unit.</span>
            </div>
            <a href={`mailto:${SITE.email}`} className="ct-card">
              <span className="ct-card-icon"><Mail size={22} aria-hidden="true" /></span>
              <span className="ct-card-label">Email</span>
              <span className="ct-card-value">{SITE.email}</span>
              <span className="ct-card-note">For general enquiries, records requests and partnerships.</span>
              <span className="ct-card-cta">Write to us <ArrowRight size={15} aria-hidden="true" /></span>
            </a>
            <a href={MAPS_DIRECTIONS} target="_blank" rel="noopener noreferrer" className="ct-card">
              <span className="ct-card-icon"><MapPin size={22} aria-hidden="true" /></span>
              <span className="ct-card-label">Visit</span>
              <span className="ct-card-value">Hwidiem</span>
              <span className="ct-card-note">Asutifi South District, Ahafo Region.</span>
              <span className="ct-card-cta">Get directions <ArrowRight size={15} aria-hidden="true" /></span>
            </a>
            <Link href="/appointment" className="ct-card" data-tone="gold">
              <span className="ct-card-icon"><CalendarCheck size={22} aria-hidden="true" /></span>
              <span className="ct-card-label">Appointments</span>
              <span className="ct-card-value">Book online</span>
              <span className="ct-card-note">Request a slot and we’ll call you to confirm.</span>
              <span className="ct-card-cta">Book a visit <ArrowRight size={15} aria-hidden="true" /></span>
            </Link>
          </div>

          <div className="ct-main">
            <div className="ct-panel">
              <ContactForm theme="light" />
            </div>

            <div className="ct-side">
              <div>
                <div className="ct-map" role="img" aria-label="Illustration of the hospital's location in Hwidiem">
                  <div className="ct-pin">
                    <span className="ct-pin-head"><MapPin size={22} aria-hidden="true" /></span>
                    <span className="ct-pin-pulse" aria-hidden="true" />
                    <span className="ct-pin-label">St. Elizabeth Catholic Hospital</span>
                  </div>
                  <span className="ct-road">Kumasi–Goaso highway</span>
                </div>
                <div className="ct-visit">
                  <h2>Find us</h2>
                  <address className="ct-address">
                    {SITE.name}<br />
                    Hwidiem, off the Kumasi–Goaso highway<br />
                    Asutifi South District, Ahafo Region, Ghana
                  </address>
                  <div className="ct-actions">
                    <a href={MAPS_DIRECTIONS} target="_blank" rel="noopener noreferrer" className="ct-btn">
                      <Navigation size={16} aria-hidden="true" />Get directions
                    </a>
                    <a href={MAPS_PLACE} target="_blank" rel="noopener noreferrer" className="ct-btn ct-btn--ghost">
                      <ExternalLink size={16} aria-hidden="true" />Open in Google Maps
                    </a>
                  </div>
                  <ul className="ct-hours" aria-label="Opening hours">
                    <li><span>Emergency Unit</span><strong>24 hours, every day</strong></li>
                    <li><span>Hospital</span><strong>{SITE.hours}</strong></li>
                    <li>
                      <span>Administration office</span>
                      <strong>{SITE.phoneHours}<br /><a href={officeTel}>{officePhone}</a></strong>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="ct-panel ct-bring">
                <h2>Coming to the hospital?</h2>
                <ul>
                  <li><CreditCard size={18} aria-hidden="true" />Your NHIS card or other insurance details</li>
                  <li><IdCard size={18} aria-hidden="true" />A valid ID</li>
                  <li><FileText size={18} aria-hidden="true" />Previous medical records, test results or referral letters</li>
                  <li><Pill size={18} aria-hidden="true" />Any medicines you are currently taking</li>
                </ul>
                <a href={officeTel} className="ct-btn ct-btn--ghost" style={{ justifySelf: "start" }}>
                  <Phone size={16} aria-hidden="true" />Questions? Call the office, {officePhone}
                </a>
                <p className="ct-office-hours">
                  The office is open {SITE.phoneHours}, closed on public holidays.
                </p>
              </div>
            </div>
          </div>

          <section className="fq-teaser" aria-labelledby="ct-faq-title">
            <div>
              <span className="fq-teaser-eyebrow">Before you write</span>
              <h2 id="ct-faq-title">Common questions</h2>
              <p>Your answer may already be here. For everything else, send us a message above.</p>
              <Link href="/faq" className="fq-btn fq-btn--ghost">
                <HelpCircle size={16} aria-hidden="true" />See all questions
              </Link>
            </div>
            <FaqList items={FEATURED_FAQS} />
          </section>
        </div>
      </section>

      <EmergencyBanner />
    </>
  );
}
