import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/ui/PageHero";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { SITE, TEAM } from "@/lib/data";
import { StatsBar } from "@/components/sections/StatsBar";
import { LinkedInIcon } from "@/components/ui/LinkedInIcon";
import { Mail, Phone } from "lucide-react";

/** Members without their own contact details reach the hospital's lines. */
const HOSPITAL_EMAIL = SITE.email;
const HOSPITAL_TEL = `tel:${SITE.phone.replace(/\s+/g, "")}`;

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about the history, mission, and team behind St. Elizabeth Catholic Hospital in Hwidiem, Ahafo Region, Ghana.",
};

const MILESTONES = [
  {
    year: "EARLY 1955",
    title: "Humble Beginnings",
    desc: "The hospital’s origins trace back to early 1955, when a temporary camp was established on the current hospital grounds. This shelter initially served as an isolation facility to care for local victims of a smallpox outbreak.",
    image: "/images/milestone/gen_photo.jpg",
  },
  {
    year: "LATE 1955",
    title: "A Community Challenge",
    desc: "Later that year, local Mass Education Officer Mr. Dwamena suggested transforming the site into a permanent clinic. The Chief and Elders petitioned the Catholic Bishop of Kumasi, Rt. Rev. Van de Bronk. The Bishop issued a challenge: the hospital and its resident doctor would go to whichever community—Hwidiem or Agroyesum—could first provide decent accommodation for the physician. Under the leadership of Nana Akwasi Nyantakyi, the Hwidiem community rallied together, donating cocoa and maize to fund and secure the site and housing.",
    image: "/images/milestone/gen_photo.jpg",
  },
  {
    year: "1956",
    title: "The First Doctor & Official Opening",
    desc: "On November 28, 1955, Dr. J. A. Vervoorn, a young Dutch physician, arrived in Hwidiem. The smallpox shed was quickly converted into a dispensary, and construction began on a four-room block (the site of the current female ward). The clinic was officially opened on December 3, 1956, and began expanding under the management of dedicated Dutch medical organizations (Memisa).",
    image: "/images/milestone/gen_photo.jpg",
  },
  {
    year: "1970s-1980s",
    title: "Diocesan Shift & OLA Leadership",
    desc: "As the Catholic Church structure evolved, ownership of the hospital was transferred to the newly erected Sunyani Diocese in 1973. Seeking to strengthen the hospital's administration, the late Most Rev. James Kwadwo Owusu invited the Missionary Sisters of Our Lady of Apostles (OLA) to manage the facility. The OLA Sisters officially took over administration on January 28, 1984, marking a new era of structured growth.",
    image:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
  },
  {
    year: "2000s",
    title: "Modern Era & Looking Ahead",
    desc: "Through the decades, the hospital has transformed from a single-room dispensary into a robust medical institution. This growth has been sustained by the dedication of its staff, the Government of Ghana, local benefactors, and international partner agencies. Today, the hospital remains committed to continuous growth and serving the community with faith and excellence.",
    image: "/images/milestone/2000s.jpg",
  },
  {
    year: "2025",
    title: "Accredited, Growing, Trusted",
    desc: "The hospital sustained its SafeCare Level 4 accreditation, opened new specialty services including a wellness clinic and cervical screening centre, and established a research unit to anchor evidence-based practice. Outpatient attendance reached a record 99,274 — nearly a fifth higher than the year before — cared for by a team of 441 staff, and the hospital remains the only referral hospital for the Asutifi South District.",
    image: "/images/milestone/digital.jpg",
  },
];

const VALUES = [
  {
    icon: "./icons/faith.png",
    title: "Faith",
    desc: "Rooted in Catholic values, we honour the dignity and sanctity of every human life.",
  },
  {
    icon: "./icons/compassion.png",
    title: "Compassion",
    desc: "We treat every patient with empathy, kindness, and genuine care — regardless of background.",
  },
  {
    icon: "./icons/excellence.png",
    title: "Excellence",
    desc: "We hold ourselves to the highest clinical and ethical standards in all we do.",
  },
  {
    icon: "./icons/community.png",
    title: "Community",
    desc: "We are deeply committed to the health and wellbeing of the communities we serve.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        tag="Who We Are"
        title="About St. Elizabeth Catholic Hospital"
        subtitle="Serving Ghana's Ahafo Region with faith, compassion, and clinical excellence since 1956."
        dotGrid
      />

      {/* Mission & Vision Section */}
      <section className="about-mission-section">
        <div className="container">
          <div className="about-mission-grid">
            <AnimateIn direction="left">
              <div className="section-tag">
                <span>Our Purpose</span>
              </div>
              <h2
                className="section-heading"
                style={{ marginBottom: "1.25rem" }}
              >
                Mission &amp; Vision
              </h2>

              <div className="mission-box">
                <div className="label">Mission</div>
                <p>
                  To provide high quality healthcare in the most effective,
                  efficient and innovative manner, specific to the needs of
                  the communities we serve and at all times acknowledging the
                  dignity of the patient.
                </p>
              </div>

              <div className="vision-box">
                <div className="label">Vision</div>
                <p>
                  A health service that is best in meeting patient needs and
                  expectations.
                </p>
              </div>
            </AnimateIn>

            <AnimateIn delay={140} direction="right">
              <h3 className="core-values-heading">Our Core Values</h3>
              <div className="about-values-grid">
                {VALUES.map((v) => (
                  <div key={v.title} className="value-card">
                    <div className="icon">
                      <img src={v.icon} alt={v.title} />
                    </div>
                    <div className="title">{v.title}</div>
                    <div className="desc">{v.desc}</div>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsBar />

      {/* Timeline Section */}
      <section className="timeline-section">
        <div className="container">
          <AnimateIn>
            <div className="section-tag" style={{ justifyContent: "center" }}>
              <span>Our Journey</span>
            </div>
            <h2
              className="section-heading"
              style={{ marginBottom: "5rem", textAlign: "center" }}
            >
              A History of Healing
            </h2>
          </AnimateIn>

          <div className="timeline-container">
            <div className="timeline-spine" />

            {MILESTONES.map((m, i) => {
              const isEven = i % 2 === 0;
              return (
                <AnimateIn
                  key={m.year || i}
                  delay={i * 100}
                  direction={isEven ? "left" : "right"}
                >
                  <div className="timeline-row">
                    {isEven ? (
                      <div className="timeline-content-left">
                        <div className="timeline-year">{m.year}</div>
                        <h3 className="timeline-title">{m.title}</h3>
                        <p className="timeline-desc">{m.desc}</p>
                        <div className="timeline-image-wrapper">
                          <Image
                            src={m.image}
                            alt={m.title}
                            fill
                            style={{ objectFit: "fill" }}
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="timeline-node-container">
                      <div className="timeline-node" />
                    </div>

                    {!isEven ? (
                      <div className="timeline-content-right">
                        <div className="timeline-year">{m.year}</div>
                        <h3 className="timeline-title">{m.title}</h3>
                        <p className="timeline-desc">{m.desc}</p>
                        <div className="timeline-image-wrapper">
                          <Image
                            src={m.image}
                            alt={m.title}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Team Grid */}
      <section id="team" className="team-section">
        <div className="container">
          <AnimateIn>
            <div className="section-tag">
              <span>Our People</span>
            </div>
            <h2 className="section-heading">Meet the Team</h2>
          </AnimateIn>

          <div className="team-custom-grid">
            {TEAM.map((member, index) => (
              <AnimateIn key={member.id || index} delay={index * 50}>
                <div className="team-card-wrapper">
                  <div className="team-card-display">
                    <Image
                      src={member.image || "/placeholder-avatar.jpg"}
                      alt={member.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />

                    <div className="team-card-overlay">
                      <div className="team-social-row">
                        {member.linkedin && (
                          <a
                            href={member.linkedin}
                            className="team-social-icon"
                            aria-label={`${member.name} on LinkedIn`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkedInIcon size={20} />
                          </a>
                        )}
                        <a
                          href={`mailto:${member.email ?? HOSPITAL_EMAIL}`}
                          className="team-social-icon"
                          aria-label={`Email ${member.name}`}
                        >
                          <Mail size={20} strokeWidth={2} />
                        </a>
                        <a
                          href={member.phone ? `tel:${member.phone.replace(/\s+/g, "")}` : HOSPITAL_TEL}
                          className="team-social-icon"
                          aria-label={`Call ${member.name}`}
                        >
                          <Phone size={20} strokeWidth={2} />
                        </a>
                      </div>
                      <span className="team-follow-text">Get in touch</span>
                    </div>
                  </div>

                  <div className="team-meta-info">
                    <h4 className="team-member-name">{member.name}</h4>
                    <p className="team-member-role">{member.role}</p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <EmergencyBanner />
    </>
  );
}
