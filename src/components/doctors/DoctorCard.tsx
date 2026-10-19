import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { SERVICES } from "@/lib/data";
import { doctorName, formatDays, type Doctor } from "@/lib/doctors";

const SERVICE_TITLE = new Map<string, string>(SERVICES.map((s) => [s.slug, s.title]));

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/**
 * One public profile. Each linked service is a link to that service's page.
 * On a service page, pass `currentService` so the card doesn't link back to
 * the page it's on, and links to the full profile instead.
 */
export function DoctorCard({ doctor, currentService }: { doctor: Doctor; currentService?: string }) {
  const name = doctorName(doctor);
  const days = formatDays(doctor.clinicDays);
  const services = doctor.services.filter((s) => s !== currentService && SERVICE_TITLE.has(s));

  return (
    <article className="dc-card" id={currentService ? undefined : `doctor-${doctor.databaseId}`}>
      <div className="dc-photo">
        {doctor.photoUrl ? (
          <Image
            src={doctor.photoUrl}
            alt={name}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 375px) 100vw, 280px"
          />
        ) : (
          // No photo yet: initials, never a stock image of someone else.
          <div className="dc-monogram" aria-hidden="true"><span>{initials(doctor.name)}</span></div>
        )}
      </div>

      <div className="dc-body">
        <h3 className="dc-name">{name}</h3>
        {doctor.specialty && <p className="dc-specialty">{doctor.specialty}</p>}

        {days && (
          <p className="dc-clinic">
            <CalendarDays size={15} aria-hidden="true" />
            <span><strong>Clinic</strong> {days}{doctor.clinicHours ? `, ${doctor.clinicHours}` : ""}</span>
          </p>
        )}

        {doctor.bio && <p className="dc-bio">{doctor.bio}</p>}

        {(services.length > 0 || currentService) && (
          <div className="dc-links">
            {services.map((slug) => (
              <Link key={slug} href={`/services/${slug}`} className="dc-service">
                {SERVICE_TITLE.get(slug)}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ))}
            {currentService && (
              <Link href={`/doctors#doctor-${doctor.databaseId}`} className="dc-service dc-service--ghost">
                Full profile
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
