import "@/styles/doctors.css";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, MessageCircle, Phone, Stethoscope } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicDoctors } from "@/lib/doctors-data";
import { doctorName } from "@/lib/doctors";
import { absoluteUrl } from "@/lib/seo";
import { SITE, telHref } from "@/lib/data";

export const metadata: Metadata = {
  title: "Our Doctors & Specialists",
  description:
    "Meet the doctors and specialists at St. Elizabeth Catholic Hospital, Hwidiem: their specialties, clinic days and the services they run.",
  alternates: { canonical: "/doctors" },
};

// Refreshed every 5 minutes, and straight away when a profile is saved in the portal.
export const revalidate = 300;

export default async function DoctorsPage() {
  const doctors = await getPublicDoctors();

  // Each published profile as a schema.org Physician working at the hospital.
  const ld = doctors.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: doctors.map((d, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Physician",
            name: doctorName(d),
            url: absoluteUrl(`/doctors#doctor-${d.databaseId}`),
            ...(d.specialty ? { description: d.specialty } : {}),
            ...(d.photoUrl ? { image: d.photoUrl } : {}),
            worksFor: { "@id": absoluteUrl("/#hospital") },
          },
        })),
      }
    : null;

  return (
    <>
      {ld && <JsonLd data={ld} />}
      <PageHero
        tag="Our People"
        title="Our Doctors & Specialists"
        subtitle="The clinicians behind our services, and the days their clinics run."
        dotGrid
      />

      <section className="dc-page">
        <div className="dc-container">
          {doctors.length === 0 ? (
            <div className="dc-empty">
              <span className="dc-empty-icon"><Stethoscope size={26} aria-hidden="true" /></span>
              <h2>Profiles are on their way</h2>
              <p>
                We’re putting together profiles of our doctors and specialists. In the meantime, you can browse our
                services or book an appointment, and we’ll match you with the right clinician.
              </p>
              <div className="dc-actions">
                <Link href="/services" className="dc-btn dc-btn--ghost"><Stethoscope size={16} aria-hidden="true" />Browse services</Link>
                <Link href="/appointment" className="dc-btn"><CalendarCheck size={16} aria-hidden="true" />Book an appointment</Link>
              </div>
            </div>
          ) : (
            <>
              <p className="dc-intro">
                Select a service on any profile to see what it offers. Clinic days can change, so please call the
                office or book ahead to confirm before you travel.
              </p>
              <div className="dc-grid">
                {doctors.map((d) => <DoctorCard key={d.databaseId} doctor={d} />)}
              </div>
            </>
          )}

          <div className="dc-cta">
            <div>
              <h2>Need to see a specialist?</h2>
              <p>Book online and we’ll call to confirm, or call the office, open {SITE.phoneHours}.</p>
            </div>
            <div className="dc-actions" style={{ marginTop: 0 }}>
              <Link href="/appointment" className="dc-btn"><CalendarCheck size={16} aria-hidden="true" />Book an appointment</Link>
              <a href={telHref(SITE.phone)} className="dc-btn dc-btn--ghost"><Phone size={16} aria-hidden="true" />{SITE.phone}</a>
              <Link href="/contact" className="dc-btn dc-btn--ghost"><MessageCircle size={16} aria-hidden="true" />Ask a question</Link>
            </div>
          </div>
        </div>
      </section>

      <EmergencyBanner />
    </>
  );
}
