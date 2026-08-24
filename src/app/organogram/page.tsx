import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { OrgChart } from "@/components/ui/OrgChart";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { ORG_CHART, countNodes, findPostHolder } from "@/lib/org-chart";

export const metadata: Metadata = {
  title: "Organogram",
  description:
    "The organisational structure of St. Elizabeth Catholic Hospital — Goaso Diocesan Health Service.",
};

/** Leadership tier, in the order it appears on the diocesan chart. */
const LEADERSHIP = [
  {
    label: "Bishop of Goaso Diocese",
    desc: "Supreme spiritual and administrative authority over all diocesan health institutions.",
  },
  {
    label: "Diocesan Health Service Board",
    desc: "Governance board setting policy and strategic direction for diocesan health services.",
  },
  {
    label: "Director of Health Service",
    desc: "Directs the diocesan health service and oversees all member institutions.",
  },
  {
    label: "Hospital Manager",
    roleKey: "Hospital Manager",
    desc: "Heads the hospital day to day, with the four departmental leads reporting in.",
  },
  {
    label: "Medical Director",
    roleKey: "AG. Medical Director",
    desc: "Leads clinical services, specialist care, diagnostics and public health programmes.",
  },
  {
    label: "Administrator",
    desc: "Runs HR, finance, estates, logistics, ICT, procurement and quality assurance.",
  },
  {
    label: "Nurse Manager",
    roleKey: "Nurse Manager",
    desc: "Oversees nurse specialists, nurses, midwives and ward assistants.",
  },
  {
    label: "Chaplain",
    roleKey: "Chaplain",
    desc: "Provides counselling and pastoral care to patients, staff and families.",
  },
  {
    label: "Internal Auditor",
    desc: "Reports independently of hospital management, directly to the Director of Health Service.",
  },
];

export default function OrganogramPage() {
  return (
    <>
      <PageHero
        tag="Our Structure"
        title="Organisational Chart"
        subtitle={`The governance and operational structure of St. Elizabeth Catholic Hospital under the Goaso Diocesan Health Service — ${countNodes(
          ORG_CHART,
        )} posts across six reporting lines.`}
      />

      {/* Intro strip */}
      <section style={{ background: "#fff", padding: "4rem 2rem 0" }}>
        <div className="container">
          <AnimateIn>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
                marginBottom: "3rem",
              }}
            >
              {LEADERSHIP.map((item) => {
                const holder = findPostHolder(item.roleKey);
                return (
                  <div
                    key={item.label}
                    style={{
                      background: "var(--off-white)",
                      border: "1.5px solid #E2EBE7",
                      borderRadius: 8,
                      padding: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--text-dark)",
                        fontSize: "0.88rem",
                        marginBottom: holder ? 2 : 5,
                        fontFamily: "var(--font-serif)",
                      }}
                    >
                      {item.label}
                    </div>
                    {holder && (
                      <div
                        style={{
                          color: "var(--primary-light)",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          marginBottom: 5,
                        }}
                      >
                        {holder.name}
                      </div>
                    )}
                    <div
                      style={{
                        color: "var(--text-light)",
                        fontSize: "0.8rem",
                        lineHeight: 1.65,
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Org chart */}
      <section className="organogram-section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: "100%" }}>
          <AnimateIn>
            <div className="organogram-shell">
              <OrgChart />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Download note */}
      <section
        style={{ background: "var(--light-green)", padding: "3rem 2rem" }}
      >
        <div className="container">
          <AnimateIn>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1.5rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color: "var(--text-dark)",
                    margin: "0 0 6px",
                  }}
                >
                  Goaso Diocesan Health Service
                </h3>
                <p
                  style={{
                    color: "var(--text-light)",
                    fontSize: "0.88rem",
                    lineHeight: 1.65,
                    margin: 0,
                    maxWidth: 540,
                  }}
                >
                  St. Elizabeth Catholic Hospital operates under the governance
                  of the Goaso Diocesan Health Service Board, in alignment with
                  the Catholic Diocese of Goaso and the Christian Health
                  Association of Ghana (CHAG).
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {["CHAG Member", "GHS Accredited", "MOH Approved"].map((b) => (
                  <span
                    key={b}
                    style={{
                      padding: "7px 16px",
                      background: "#fff",
                      border: "1.5px solid #B6D9C8",
                      borderRadius: 4,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      <EmergencyBanner />
    </>
  );
}
