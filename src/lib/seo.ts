import { SITE } from "@/lib/data";

/** Absolute URL on the canonical host, for structured data and the sitemap. */
export function absoluteUrl(path = "/") {
  return new URL(path, SITE.url).toString();
}

/** "050 870 5607" -> "+233508705607", the international form search engines expect. */
function intlPhone(number: string) {
  return `+233${number.replace(/\D/g, "").replace(/^0/, "")}`;
}

/** Fallback share image (1200 × 630), cut from the aerial photo of the campus. */
export const DEFAULT_SHARE_IMAGE = {
  url: "/images/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "Aerial view of St. Elizabeth Catholic Hospital, Hwidiem",
};

const ALL_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WEEKDAYS = ALL_WEEK.slice(0, 5);

/**
 * The hospital as a schema.org Hospital, so Google can show its address,
 * map pin, 24-hour opening and phone numbers in search and Maps.
 * Keep in step with SITE: never list the office line as the main number,
 * it is only answered on weekdays.
 */
export function hospitalJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Hospital",
    "@id": absoluteUrl("/#hospital"),
    name: SITE.name,
    alternateName: SITE.shortName,
    slogan: SITE.tagline,
    description:
      "A Catholic mission hospital in Hwidiem, Ahafo Region, Ghana, providing 24-hour emergency care, in-patient and out-patient services, maternity, diagnostics and specialist clinics. A member of the Christian Health Association of Ghana (CHAG).",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/logo.png"),
    image: absoluteUrl(DEFAULT_SHARE_IMAGE.url),
    telephone: intlPhone(SITE.emergencyPhones[0]),
    email: SITE.email,
    foundingDate: "1956",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Off the Kumasi–Goaso highway",
      addressLocality: "Hwidiem",
      addressRegion: "Ahafo Region",
      addressCountry: "GH",
    },
    geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    hasMap: SITE.mapsUrl,
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ALL_WEEK, opens: "00:00", closes: "23:59" },
    ],
    contactPoint: [
      ...SITE.emergencyPhones.map((n) => ({
        "@type": "ContactPoint",
        contactType: "emergency",
        telephone: intlPhone(n),
        areaServed: "GH",
        hoursAvailable: { "@type": "OpeningHoursSpecification", dayOfWeek: ALL_WEEK, opens: "00:00", closes: "23:59" },
      })),
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        name: "Administration office",
        telephone: intlPhone(SITE.phone),
        email: SITE.email,
        areaServed: "GH",
        hoursAvailable: { "@type": "OpeningHoursSpecification", dayOfWeek: WEEKDAYS, opens: "08:00", closes: "17:00" },
      },
    ],
    medicalSpecialty: [
      "Emergency",
      "PrimaryCare",
      "Surgical",
      "Obstetric",
      "Gynecologic",
      "Midwifery",
      "Pediatric",
      "Dentistry",
      "Optometric",
      "Otolaryngologic",
      "Psychiatric",
      "LaboratoryScience",
      "Radiography",
      "PharmacySpecialty",
      "DietNutrition",
    ],
    isAcceptingNewPatients: true,
    memberOf: { "@type": "Organization", name: "Christian Health Association of Ghana (CHAG)" },
  };
}

/** Lets search engines show "Home > Services > Dental" style trails. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absoluteUrl(t.path),
    })),
  };
}
