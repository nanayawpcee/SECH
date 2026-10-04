import "@/styles/services.css";
import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, DoorOpen, MessageCircle, Phone, ShieldCheck, Siren } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { ServicesExplorer, type Category, type ServiceTile } from "@/components/services/ServicesExplorer";
import { DEPARTMENT_GRID_DATA, SERVICES, SITE, telHref } from "@/lib/data";

export const metadata: Metadata = {
  alternates: { canonical: "/services" },
  title: "Our Services",
  description:
    "Explore the full range of medical and health services offered at St. Elizabeth Catholic Hospital, from in-patient care to specialist clinics.",
};

/** Some services have no photo yet; show a branded panel instead of a broken image. */
function publicFileExists(src: string | undefined) {
  if (!src) return false;
  if (/^https?:\/\//.test(src)) return true;
  try {
    return fs.existsSync(path.join(process.cwd(), "public", src));
  } catch {
    return false;
  }
}

export default function ServicesPage() {
  const categories: Category[] = DEPARTMENT_GRID_DATA.map((d) => ({
    key: d.key,
    title: d.title,
    subtitle: d.subtitle,
    featured: d.featured,
    featuredLabel: "featuredLabel" in d ? d.featuredLabel : undefined,
    icon: d.icon,
    iconTone: d.iconTone,
    headerBg: d.headerStyle.background,
    dotColor: d.dotColor,
    items: d.services.map((s) => ({ name: s.name, slug: "slug" in s ? s.slug : undefined })),
  }));

  // Which department each service page belongs to, from the category lists.
  const categoryOf = new Map<string, string>();
  for (const c of categories) for (const i of c.items) if (i.slug && !categoryOf.has(i.slug)) categoryOf.set(i.slug, c.key);

  const tiles: ServiceTile[] = SERVICES.map((s) => ({
    slug: s.slug,
    title: s.title,
    shortDesc: s.shortDesc,
    image: publicFileExists(s.image) ? s.image : null,
    icon: publicFileExists(s.icon) ? s.icon : null,
    category: categoryOf.get(s.slug) ?? "general",
  }));

  // Office line for questions (weekday hours); the 24-hour line for emergencies.
  const phone = SITE.phone;
  const tel = telHref(phone);
  const emergencyPhone = SITE.emergencyPhones[0];

  return (
    <>
      <PageHero
        tag="What We Offer"
        title="Our Medical Services"
        subtitle="Care across medicine, surgery, diagnostics and specialist clinics, available to every patient, every day."
        dotGrid
      />

      <div className="sv-page">
        <div className="sv-container">
          <ServicesExplorer categories={categories} tiles={tiles} />

          <section className="sv-section" aria-labelledby="sv-access-title">
            <div className="sv-head">
              <span className="sv-eyebrow">Getting care</span>
              <h2 id="sv-access-title">Three ways to see us</h2>
            </div>
            <div className="sv-access">
              <div className="sv-step">
                <span className="sv-step-icon"><DoorOpen size={22} aria-hidden="true" /></span>
                <h3>Walk in</h3>
                <p>Come to the Out-Patient Department. You’ll be registered and seen in order of need.</p>
                <Link href="/services/outpatient" className="sv-step-link">About out-patient care</Link>
              </div>
              <div className="sv-step">
                <span className="sv-step-icon"><CalendarCheck size={22} aria-hidden="true" /></span>
                <h3>Book ahead</h3>
                <p>Request an appointment online and we’ll call you to confirm a time.</p>
                <Link href="/appointment" className="sv-step-link">Book an appointment</Link>
              </div>
              <div className="sv-step" data-tone="emergency">
                <span className="sv-step-icon"><Siren size={22} aria-hidden="true" /></span>
                <h3>Emergency</h3>
                <p>Our Emergency Unit is open 24 hours a day. Come straight in, or call ahead.</p>
                <a href={telHref(emergencyPhone)} className="sv-step-link">Call {emergencyPhone}</a>
              </div>
            </div>
            <p className="sv-nhis">
              <ShieldCheck size={18} aria-hidden="true" />
              We accept the National Health Insurance Scheme (NHIS) and most major insurers. Bring your card when you visit.
            </p>
          </section>

          <section className="sv-help" aria-labelledby="sv-help-title">
            <div>
              <h2 id="sv-help-title">Not sure which service you need?</h2>
              <p>Tell us what’s wrong and we’ll point you to the right department. The office is open {SITE.phoneHours}.</p>
            </div>
            <div className="sv-help-actions">
              <a href={tel} className="sv-btn sv-btn--light" title={`Administration office, ${SITE.phoneHours}`}>
                <Phone size={16} aria-hidden="true" />Call {phone}
              </a>
              <Link href="/contact" className="sv-btn sv-btn--gold"><MessageCircle size={16} aria-hidden="true" />Send us a message</Link>
            </div>
          </section>
        </div>
      </div>

      <EmergencyBanner />
    </>
  );
}
