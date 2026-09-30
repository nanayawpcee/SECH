import { Siren } from "lucide-react";
import { SITE } from "@/lib/data";

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
              Our emergency team is always ready. Don't wait ・ call us
              immediately.
            </div>
          </div>
        </div>

        <a href={`tel:${SITE.phone}`} className="emergency-cta">
          {SITE.phone}
        </a>
      </div>
    </div>
  );
}
