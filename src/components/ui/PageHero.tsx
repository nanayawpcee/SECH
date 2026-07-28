import Image from "next/image";
import { AnimateIn } from "@/components/ui/AnimateIn";

interface Props {
  tag?: string;
  title: string;
  subtitle?: string;
  accent?: string;
  backgroundImage?: string;     // ← New prop
  overlayOpacity?: number;      // Optional: control darkness (0.4 - 0.8 recommended)
}

export function PageHero({
  tag,
  title,
  subtitle,
  accent = "var(--accent)",
  backgroundImage,
  overlayOpacity = 0.65,
}: Props) {
  return (
    <div
      className="page-hero"
      style={{
        position: "relative",
        minHeight: "40vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Rendered via next/image rather than a CSS background so the hero —
          the largest asset on these pages — gets responsive AVIF/WebP sizing.
          Decorative: the heading carries the meaning, so alt is empty. */}
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center", zIndex: 0 }}
        />
      )}

      {/* Dark overlay */}
      {backgroundImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "black",
            opacity: overlayOpacity,
            zIndex: 0,
          }}
        />
      )}

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <AnimateIn>
          {tag && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 2, background: accent }} />
              <span
                style={{
                  color: accent,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                {tag}
              </span>
            </div>
          )}

          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2rem, 5vw, 3.4rem)",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.05,
              margin: 0,
              maxWidth: 720,
            }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "1.05rem",
                lineHeight: 1.65,
                maxWidth: 560,
                marginTop: 18,
                marginBottom: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </AnimateIn>
      </div>
    </div>
  );
}