"use client";

const ACCREDITATIONS = [
  { name: "Ministry of Health",            logo: "/partnerlogos/moh.png" },
  { name: "CHAG",                           logo: "/partnerlogos/chag.png" },
  { name: "Ghana Health Service",           logo: "/partnerlogos/ghs.png" },
  { name: "NHIS",                           logo: "/partnerlogos/nhis.png" },
  { name: "Catholic Health Service Trust",  logo: "/partnerlogos/chst.png" },
];

const CORPORATE_PARTNERS = [
  { name: "Newmont",                                   logo: "/partnerlogos/newmont.png" },
  { name: "Nationwide Insurance",                      logo: "/partnerlogos/nwi.jpg" },
  { name: "NEDCO/VRA",                                 logo: "/partnerlogos/nedco.jpg" },
  { name: "Cornelia Connelly of the Holy Child Jesus", logo: "/partnerlogos/cornelia.jpg" },
  { name: "Church of Pentecost",                       logo: "/partnerlogos/cop.png" },
];

// ---------------------------------------------------------------------------
// Helpers (monogram fallback — used when logo image is missing)
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const CHIP_ACCENTS = [
  "#c9a84c", "#4c9ac9", "#84c94c",
  "#c94c84", "#4cc9a8", "#c97a4c", "#a84cc9",
];
function chipColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CHIP_ACCENTS[h % CHIP_ACCENTS.length];
}

// ---------------------------------------------------------------------------
// LogoChip
// ---------------------------------------------------------------------------

function LogoChip({
  name,
  logo,
  variant,
}: {
  name: string;
  logo: string;
  variant: "accreditation" | "corporate";
}) {
  const color = chipColor(name);
  const isAccred = variant === "accreditation";
  const size = isAccred ? 30 : 32;

  return (
    <div
      className="logo-chip"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: isAccred ? "10px 20px" : "10px 22px",
        background: "rgb(255, 255, 255)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        whiteSpace: "nowrap",
        cursor: "default",
        transition: "background 0.2s, border-color 0.2s, transform 0.2s",
        flexShrink: 0,
      }}
    >
      {/* Logo image — falls back to monogram if src fails */}
      <img
        src={`/images/${logo}`}
        alt={name}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          flexShrink: 0,
          opacity: 0.85,
        }}
        onError={(e) => {
          // Swap the broken image for an inline monogram badge
          const img = e.currentTarget;
          const parent = img.parentElement;
          if (!parent) return;
          img.style.display = "none";
          const badge = document.createElement("div");
          badge.textContent = getInitials(name);
          Object.assign(badge.style, {
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "6px",
            background: `${color}22`,
            border: `1.5px solid ${color}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isAccred ? "0.62rem" : "0.65rem",
            fontWeight: "800",
            color: color,
            letterSpacing: "0.04em",
            flexShrink: "0",
          });
          parent.insertBefore(badge, img);
        }}
      />

      {/* Partner name */}
      <span
        style={{
          fontSize: isAccred ? "0.78rem" : "0.8rem",
          fontWeight: 600,
          color: "rgba(0,0,0,0.75)",
          letterSpacing: "0.01em",
        }}
      >
        {name}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable slider row
// ---------------------------------------------------------------------------

function SliderRow({
  items,
  variant,
  direction,
  duration,
}: {
  items: typeof ACCREDITATIONS;
  variant: "accreditation" | "corporate";
  direction: "left" | "right";
  duration: number;
}) {
  const animation =
    direction === "left"
      ? `scrollLeft ${duration}s linear infinite`
      : `scrollRight ${duration}s linear infinite`;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Side fade masks */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background:
            "linear-gradient(to right, var(--primary-dark) 0%, transparent 12%, transparent 88%, var(--primary-dark) 100%)",
        }}
      />
      <div
        style={{
          display: "flex",
          gap: "1rem",
          width: "max-content",
          animation,
        }}
      >
        {/* Triple the items so the loop is seamless at any viewport width */}
        {[...items, ...items, ...items].map((p, i) => (
          <LogoChip key={i} name={p.name} logo={p.logo} variant={variant} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row label
// ---------------------------------------------------------------------------

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{ width: 24, height: 1, background: "var(--accent)", opacity: 0.6 }}
        />
        <span
          style={{
            fontSize: "0.65rem",
            color: "rgba(255,255,255,0.35)",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          {children}
        </span>
        <div
          style={{ width: 24, height: 1, background: "var(--accent)", opacity: 0.6 }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Partners — exported component called from ContactSection
// ---------------------------------------------------------------------------

export function Partners() {
  return (
    <div
      style={{
        marginTop: "5rem",
        paddingTop: "2.5rem",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Keyframes */}

      <RowLabel>Accreditations</RowLabel>
      <SliderRow
        items={ACCREDITATIONS}
        variant="accreditation"
        direction="left"
        duration={28}
      />

      <div style={{ marginTop: "0.5rem" }}>
        <RowLabel>Corporate Partners</RowLabel>
      </div>
      <SliderRow
        items={CORPORATE_PARTNERS}
        variant="corporate"
        direction="right"
        duration={38}
      />
    </div>
  );
}