"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PHOTOS } from "@/lib/data";

function drawPattern(canvas: HTMLCanvasElement, type: string, color: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = canvas.offsetWidth || 900;
  canvas.height = canvas.offsetHeight || 460;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.2;

  if (type === "cross") {
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  } else if (type === "wave") {
    for (let y = 0; y < canvas.height + 40; y += 36) {
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 2) {
        const wy = y + Math.sin((x / 70) * Math.PI) * 14;
        x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
  } else {
    for (let x = 6; x < canvas.width; x += 32)
      for (let y = 6; y < canvas.height; y += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
  }
}

function Slide({
  photo,
  active,
  direction,
}: {
  photo: (typeof PHOTOS)[0];
  active: boolean;
  direction: "left" | "right";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawPattern(canvasRef.current, photo.pattern, photo.accent);
    }
  }, [photo]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: photo.color,
        display: "flex",
        alignItems: "stretch",
        opacity: active ? 1 : 0,
        transform: active
          ? "translateX(0)"
          : direction === "right"
            ? "translateX(60px)"
            : "translateX(-60px)",
        transition: "opacity 0.55s ease, transform 0.55s ease",
        pointerEvents: active ? "auto" : "none",
      }}
    >
      {/* BACKGROUND IMAGE CONTAINER */}
      <div
        className="carousel-image-side"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "65%",
          backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.3)), url(${photo.image})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          clipPath: "polygon(0 0, 100% 0, 77% 100%, 0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "3rem 0 3rem 4rem",
          zIndex: 1,
        }}
      >
        {/* Desktop floating center icon */}
        <div
          className="carousel-icon-badge"
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(8px)",
            border: `2px solid ${photo.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 76,
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            animation: active ? "pulse-icon 3s ease-in-out infinite" : "none",
          }}
        >
          {/* Slides carry either an SVG path or an emoji, so the badge renders
              whichever it was given rather than printing a path as text. */}
          {photo.icon.startsWith("/") ? (
            <img
              src={photo.icon}
              alt=""
              aria-hidden="true"
              width={100}
              height={100}
              style={{ width: 100, height: 100, objectFit: "contain" }}
            />
          ) : (
            photo.icon
          )}
        </div>

        {/* Small floating desktop hospital token */}
        <div
          className="carousel-floating-badge"
          style={{
            position: "absolute",
            bottom: "3.5rem",
            left: "4rem",
            background: photo.accent,
            borderRadius: 6,
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: photo.color,
            }}
          />
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              color: photo.color,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            SECH
          </span>
        </div>
      </div>

      {/* TEXT LAYER */}
      <div
        className="carousel-text-side"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "50%",
          clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)",
          background: photo.color,
          display: "flex",
          alignItems: "center",
          paddingLeft: "15%",
          paddingRight: "4rem",
          zIndex: 2,
        }}
      >
        <canvas
          ref={canvasRef}
          className="carousel-canvas"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.08,
            pointerEvents: "none",
          }}
        />

        <div
          className="carousel-decor"
          style={{
            position: "absolute",
            right: -100,
            top: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: `1px solid ${photo.accent}12`,
            pointerEvents: "none",
          }}
        />
        <div
          className="carousel-decor"
          style={{
            position: "absolute",
            right: 20,
            top: 20,
            width: 260,
            height: 260,
            borderRadius: "50%",
            border: `1px solid ${photo.accent}20`,
            pointerEvents: "none",
          }}
        />

        {/* Text layout inner box */}
        <div style={{ position: "relative", zIndex: 3, width: "100%" }}>
          <div
            className="carousel-subheading"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                color: photo.accent,
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              St. Elizabeth Catholic Hospital
            </span>
          </div>
          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.3rem, 2.5vw, 1.9rem)",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.2,
              margin: "0 0 12px",
              animation: active ? "slideUp 0.5s ease 0.1s both" : "none",
            }}
          >
            {photo.label}
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.95rem",
              lineHeight: 1.5,
              maxWidth: 360,
              margin: 0,
              animation: active ? "slideUp 0.5s ease 0.2s both" : "none",
            }}
          >
            {photo.caption}
          </p>

          <div
            className="carousel-pills"
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginTop: 20,
              animation: active ? "slideUp 0.5s ease 0.3s both" : "none",
            }}
          >
            {["24 / 7 Available", "Qualified Staff"].map((pill) => (
              <span
                key={pill}
                style={{
                  padding: "4px 10px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 20,
                  fontSize: "0.68rem",
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 600,
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhotoCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 5000;

  const goTo = useCallback(
    (idx: number, dir?: "left" | "right") => {
      setDirection(dir ?? (idx > current ? "right" : "left"));
      setCurrent(idx);
      setProgress(0);
    },
    [current],
  );

  const prev = () =>
    goTo((current - 1 + PHOTOS.length) % PHOTOS.length, "left");
  const next = useCallback(
    () => goTo((current + 1) % PHOTOS.length, "right"),
    [current, goTo],
  );

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => next(), DURATION);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, next]);

  useEffect(() => {
    if (paused) return;
    setProgress(0);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / DURATION) * 100, 100));
    }, 30);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [current, paused]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current]);

  const photo = PHOTOS[current];

  return (
    <section
      style={{ padding: "0 0 0", background: "#F7F9F7" }}
      aria-label="Hospital photo gallery"
    >
      <div style={{ padding: "4rem 2rem 0" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase" as const,
                    color: "var(--primary-light)",
                  }}
                >
                  Our Facilities
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.4rem,3vw,2rem)",
                  fontWeight: 800,
                  color: "var(--text-dark)",
                  margin: 0,
                }}
              >
                A Closer Look at SECH
              </h2>
            </div>
            <p
              style={{
                color: "var(--text-light)",
                fontSize: "0.88rem",
                maxWidth: 380,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              World-class facilities and caring professionals — everything you
              need under one roof.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{ padding: "1.5rem 2rem 4rem" }}
        className="carousel-main-container"
      >
        <div className="container">
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
              height: 420,
              boxShadow: "0 24px 64px rgba(10,79,60,0.2)",
              cursor: "default",
            }}
            className="carousel-viewport"
          >
            {PHOTOS.map((p, i) => (
              <Slide
                key={p.id}
                photo={p}
                active={i === current}
                direction={direction}
              />
            ))}

            <button
              onClick={prev}
              aria-label="Previous slide"
              className="carousel-nav-arrow"
              style={{
                position: "absolute",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: 20,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
                backdropFilter: "blur(6px)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
              }
            >
              ‹
            </button>

            <button
              onClick={next}
              aria-label="Next slide"
              className="carousel-nav-arrow"
              style={{
                position: "absolute",
                right: 20,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: 20,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
                backdropFilter: "blur(6px)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
              }
            >
              ›
            </button>

            <div
              className="carousel-controls-bar"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
                padding: "3rem 1.5rem 1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                className="carousel-dots-wrapper"
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                {PHOTOS.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}: ${p.label}`}
                    style={{
                      width: i === current ? 28 : 8,
                      height: 8,
                      borderRadius: 4,
                      background:
                        i === current ? photo.accent : "rgba(255,255,255,0.35)",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.35s ease",
                    }}
                  />
                ))}
              </div>

              <div
                className="carousel-counter"
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ color: "#fff", fontSize: "1rem" }}>
                  {String(current + 1).padStart(2, "0")}
                </span>
                <span style={{ opacity: 0.5 }}>/</span>
                <span>{String(PHOTOS.length).padStart(2, "0")}</span>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                zIndex: 10,
                background: "rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${paused ? progress : progress}%`,
                  background: photo.accent,
                  transition: paused ? "none" : "width 0.03s linear",
                }}
              />
            </div>

            {paused && (
              <div
                className="carousel-pause-indicator"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 72,
                  zIndex: 10,
                  padding: "4px 10px",
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: 20,
                  fontSize: "0.64rem",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  backdropFilter: "blur(4px)",
                }}
              >
                ⏸ PAUSED
              </div>
            )}
          </div>

          <div
            className="carousel-thumbnail-strip"
            style={{
              display: "flex",
              gap: 10,
              marginTop: 12,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {PHOTOS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => goTo(i)}
                style={{
                  flex: "0 0 auto",
                  width: 110,
                  height: 62,
                  borderRadius: 6,
                  background: p.color,
                  border:
                    i === current
                      ? `2px solid ${p.accent}`
                      : "2px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.25s",
                  opacity: i === current ? 1 : 0.55,
                  transform: i === current ? "scale(1.04)" : "scale(1)",
                  overflow: "hidden",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (i !== current) e.currentTarget.style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  if (i !== current) e.currentTarget.style.opacity = "0.55";
                }}
                aria-label={`Jump to ${p.label}`}
              >
                <img
                  src={p.image}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.45,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "5px 5px",
                    background: "rgba(0,0,0,0.7)",
                    fontSize: "0.58rem",
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textAlign: "center",
                    lineHeight: 1.2,
                    zIndex: 2,
                  }}
                >
                  {p.label.split(" ").slice(0, 2).join(" ")}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
