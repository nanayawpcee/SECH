import { Phone, Siren } from "lucide-react";
import { SITE, telHref } from "@/lib/data";

export function EmergencyBanner() {
  return (
    <div
      style={{
        background: "var(--red)",
        padding: "2.5rem 2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="texture" />

      <div className="container emergency-row">
        <div className="emergency-left">
          {/* Pulsing dot */}
          <div className="emergency-dot">
            <div className="emergency-dot-pulse" aria-hidden />
            <div className="emergency-dot-core">
              <Siren size={22} strokeWidth={2.2} color="var(--red)" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="emergency-title">24 / 7 Emergency Services</div>
            <div className="emergency-sub">
              Our emergency team is always ready, day and night. Don’t wait:
              call us now.
            </div>
          </div>
        </div>

        {/* The 24-hour emergency lines, never the office line, which closes
            at 5pm and on weekends. */}
        <div className="emergency-ctas">
          {SITE.emergencyPhones.map((n) => (
            <a key={n} href={telHref(n)} className="emergency-cta" aria-label={`Call the emergency line ${n}`}>
              <Phone size={17} strokeWidth={2.4} aria-hidden="true" />
              {n}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
