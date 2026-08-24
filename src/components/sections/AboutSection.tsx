import Link from "next/link";
import { AnimateIn } from "@/components/ui/AnimateIn";

export function AboutSection() {
  return (
    <section id="about" style={{ padding: "6rem 0", background: "#fff" }}>
      <div className="container">
        <div className="about-grid">
          <AnimateIn direction="left">
            <div
              style={{
                position: "relative",
                paddingBottom: 30,
                paddingRight: 30,
              }}
            >
              <div
                style={{
                  background: "var(--primary)",
                  borderRadius: "var(--radius-lg)",
                  padding: "3rem 2.5rem",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 18 }}>
                  <img
                    src="/icons/faith.png"
                    alt="Heart Icon"
                    style={{ width: "18%", height: "auto" }}
                  />
                </div>
                <h3
                  style={{
                    fontSize: "1.45rem",
                    fontWeight: 800,
                    fontFamily: "var(--font-serif)",
                    margin: "0 0 12px",
                    color: "#fff",
                  }}
                >
                  Founded in Faith
                </h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.78)",
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  St. Elizabeth Catholic Hospital has been a beacon of healing
                  in Ghana's Ahafo Region (previously Brong-Ahafo Region) for
                  over five decades, guided by Catholic values of human dignity
                  and compassion.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {[
                    ["1970s", "Founded"],
                    ["Dr. J. A. Vervoorn", "First Physician"],
                  ].map(([val, lbl]) => (
                    <div key={lbl}>
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 900,
                          color: "var(--accent)",
                          fontFamily: "var(--font-serif)",
                        }}
                      >
                        {val}
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "rgba(255,255,255,0.55)",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          marginTop: 3,
                        }}
                      >
                        {lbl}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="about-chag-badge"
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  scale: 0.9,
                  transform: "translate(25%, 20%)",
                  background: "var(--accent)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.25rem 1.5rem",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
                  minWidth: 150,
                }}
              >
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 900,
                    color: "var(--primary-dark)",
                    fontFamily: "var(--font-serif)",
                    lineHeight: 1,
                  }}
                >
                  CHAG
                </div>
                <div
                  style={{
                    fontSize: "0.64rem",
                    color: "#2D5047",
                    fontWeight: 700,
                    marginTop: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Member Institution
                </div>
              </div>
              <svg
                style={{
                  position: "absolute",
                  top: -20,
                  left: -20,
                  opacity: 0.12,
                }}
                width="88"
                height="88"
              >
                {[0, 1, 2, 3].flatMap((row) =>
                  [0, 1, 2, 3].map((col) => (
                    <circle
                      key={`${row}-${col}`}
                      cx={col * 22 + 4}
                      cy={row * 22 + 4}
                      r="3"
                      fill="var(--primary)"
                    />
                  )),
                )}
              </svg>
            </div>
          </AnimateIn>

          <AnimateIn delay={140} direction="right">
            <div className="section-tag">
              <span>Our Story</span>
            </div>
            <h2 className="section-heading" style={{ marginBottom: "1.25rem" }}>
              World-Class Facilities,
              <br />
              Rooted in Compassion
            </h2>
            <p
              style={{
                color: "var(--text-light)",
                lineHeight: 1.8,
                marginBottom: "1.1rem",
              }}
            >
              Located in Hwidiem, St. Elizabeth Catholic Hospital serves as a
              regional centre of excellence for the Asutifi South District and
              surrounding communities — offering a wide range of clinical
              services under one roof, 24 hours a day.
            </p>
            <p
              style={{
                color: "var(--text-light)",
                lineHeight: 1.8,
                marginBottom: "2rem",
              }}
            >
              Our multidisciplinary team of physicians, nurses, and allied
              health professionals bring skill, empathy, and faith to every
              patient encounter — from routine outpatient visits to complex
              surgical procedures.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/about" className="btn-primary">
                Our History
              </Link>
              <Link href="/about#team" className="btn-outline">
                Meet the Team
              </Link>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
