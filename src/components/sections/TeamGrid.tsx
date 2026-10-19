"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Mail, Phone } from "lucide-react";
import { SITE, TEAM, telHref } from "@/lib/data";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { LinkedInIcon } from "@/components/ui/LinkedInIcon";
import { useScrollRail } from "@/components/ui/useScrollRail";

/**
 * Cards per row on wide screens: 4, or 3 when that gives even rows (6 people
 * as 3 + 3 rather than 4 + 2).
 */
const TEAM_COLUMNS = TEAM.length % 4 === 0 ? 4 : TEAM.length % 3 === 0 ? 3 : 4;

/** Members without their own contact details reach the hospital's lines. */
const HOSPITAL_EMAIL = SITE.email;
const HOSPITAL_TEL = telHref(SITE.phone); // office line, weekdays

/**
 * "Meet the Team". Laid out like the homepage services cards: every card is
 * the same fixed size at every screen width, 4 in a row on wide screens, a
 * swipeable row with arrows on tablets, stacked on small phones
 * (see .team-custom-grid in globals.css).
 */
export function TeamGrid() {
  const { railRef, canPrev, canNext, step } = useScrollRail(".team-cell");

  return (
    <section id="team" className="team-section">
      <div className="team-container">
        <AnimateIn>
          <div className="section-tag">
            <span>Our People</span>
          </div>
          <h2 className="section-heading">Meet the Team</h2>
        </AnimateIn>

        <div className="team-rail-nav">
          <button type="button" className="services-rail-btn" onClick={() => step(-1)} disabled={!canPrev}
            aria-label="Previous team members" aria-controls="team-rail">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button type="button" className="services-rail-btn" onClick={() => step(1)} disabled={!canNext}
            aria-label="More team members" aria-controls="team-rail">
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        <div
          className="team-custom-grid"
          id="team-rail"
          ref={railRef}
          role="region"
          aria-label="Hospital leadership"
          tabIndex={0}
          style={{ "--team-cols": TEAM_COLUMNS } as React.CSSProperties}
        >
          {TEAM.map((member, index) => (
            <AnimateIn key={member.id || index} delay={index * 50} className="team-cell">
              <article className="team-card">
                <div className="team-photo">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 375px) 100vw, 300px"
                    />
                  ) : (
                    // No photo yet: a monogram, never a stock image of someone else.
                    <div className="team-monogram" aria-hidden="true">
                      <span>{member.initials}</span>
                    </div>
                  )}
                  {member.dept && <span className="team-dept">{member.dept}</span>}
                </div>

                <div className="team-body">
                  <h3 className="team-member-name">{member.name}</h3>
                  <p className="team-member-role">{member.role}</p>

                  {/* Members without their own details reach the hospital's
                      lines; the tooltip says so rather than implying a direct line. */}
                  <div className="team-actions">
                    <a
                      href={`mailto:${member.email ?? HOSPITAL_EMAIL}`}
                      className="team-action"
                      aria-label={member.email ? `Email ${member.name}` : `Email the hospital about ${member.name}`}
                      title={member.email ?? `Hospital email, ${HOSPITAL_EMAIL}`}
                    >
                      <Mail size={16} aria-hidden="true" />
                      Email
                    </a>
                    <a
                      href={member.phone ? `tel:${member.phone.replace(/\s+/g, "")}` : HOSPITAL_TEL}
                      className="team-action"
                      aria-label={member.phone ? `Call ${member.name}` : "Call the administration office"}
                      title={member.phone ?? `Administration office, ${SITE.phone} (${SITE.phoneHours})`}
                    >
                      <Phone size={16} aria-hidden="true" />
                      Call
                    </a>
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        className="team-action team-action--icon"
                        aria-label={`${member.name} on LinkedIn`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkedInIcon size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
