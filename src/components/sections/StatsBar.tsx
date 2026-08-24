"use client";

import { useRef, useEffect, useState } from "react";
import { STATS } from "@/lib/data";
import { useIsMobile } from "@/hooks/use-mobile";

function useCountUp(target: string, active: boolean) {
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    if (!active) return;
    const suffix = target.replace(/[0-9]/g, "");
    const num = parseInt(target.replace(/\D/g, ""), 10);
    const duration = 1400;
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * num) + suffix);
      if (progress < 1) requestAnimationFrame(ts => step(ts, startTime));
    };
    requestAnimationFrame(ts => step(ts, ts));
  }, [active, target]);
  return display;
}

function StatItem({
  value,
  label,
  delay,
  isMobile,
}: {
  value: string;
  label: string;
  delay: number;
  isMobile: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const display = useCountUp(value, active);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setActive(true); },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        textAlign: "center",
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        minWidth: 0, // allow shrinking inside grid
      }}
    >
      <div
        style={{
          fontSize: isMobile ? "clamp(1.2rem, 5.5vw, 1.7rem)" : "clamp(2rem, 4vw, 3rem)",
          fontWeight: 900,
          color: "#063328",
          fontFamily: "var(--font-serif)",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {display}
      </div>
      <div
        style={{
          fontSize: isMobile ? "clamp(0.48rem, 1.8vw, 0.6rem)" : "0.72rem",
          color: "#2D5047",
          fontWeight: 700,
          letterSpacing: isMobile ? "0.04em" : "0.14em",
          textTransform: "uppercase",
          marginTop: isMobile ? 4 : 7,
          lineHeight: 1.25,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function StatsBar() {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        background: "#E8B84B",
        padding: isMobile ? "1.25rem 0.75rem" : "2.75rem 2rem",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: isMobile ? "0.25rem" : "1rem",
          alignItems: "center",
        }}
      >
        {STATS.map((s, i) => (
          <StatItem
            key={s.label}
            value={s.value}
            label={s.label}
            delay={i * 90}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
}
