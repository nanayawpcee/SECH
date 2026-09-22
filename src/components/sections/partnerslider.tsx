"use client";

import Image from "next/image";

interface Partner {
  name: string;
  /** Omit and the chip shows a monogram — no request is made for a file that
   *  doesn't exist. */
  logo?: string;
  /** The artwork already spells the company name, so the chip shows the logo
   *  alone rather than printing the name twice. */
  wordmark?: boolean;
}

const ACCREDITATIONS: Partner[] = [
  { name: "Ministry of Health", logo: "/partnerlogos/moh.png" },
  { name: "CHAG", logo: "/partnerlogos/chag.png" },
  { name: "Ghana Health Service", logo: "/partnerlogos/ghs.png" },
  { name: "NHIS", logo: "/partnerlogos/nhis-wordmark.png", wordmark: true },
  { name: "Catholic Health Service Trust", logo: "/partnerlogos/chst.png" },
];

const CORPORATE_CLIENTS: Partner[] = [
  { name: "Newmont", logo: "/partnerlogos/newmont.png" },
  { name: "Orica", logo: "/partnerlogos/orica.png", wordmark: true },
  { name: "GTS Drilling", logo: "/partnerlogos/gts.png", wordmark: true },
  { name: "Toyota Ghana", logo: "/partnerlogos/toyota.png" },
  { name: "Geodrill", logo: "/partnerlogos/geodrill.png", wordmark: true },
  // The supplied SOS file is white artwork on transparency — invisible on a
  // white chip — so it's re-inked in brand green; the original is untouched.
  {
    name: "International SOS",
    logo: "/partnerlogos/sos-dark.png",
    wordmark: true,
  },
  { name: "Pelvin Company", logo: "/partnerlogos/PC.png" },
  { name: "AUMS", logo: "/partnerlogos/aums.png", wordmark: true },
  { name: "Liebherr", logo: "/partnerlogos/liebherr.svg", wordmark: true },
  { name: "Mantrac", logo: "/partnerlogos/mantrac.svg", wordmark: true },
  { name: "Kal Tire", logo: "/partnerlogos/kal-tire.png", wordmark: true },
  {
    name: "MediSite Services Ghana",
    logo: "/partnerlogos/msg.png",
    wordmark: true,
  },
];

const PARTNERS_AND_DONORS: Partner[] = [
  {
    name: "NEDCo / VRA",
    logo: "/partnerlogos/nedco-wordmark.png",
    wordmark: true,
  },
  {
    name: "Nationwide Medical Insurance",
    logo: "/partnerlogos/nwi-wordmark.png",
    wordmark: true,
  },
  {
    name: "Cornelia Connelly of the Holy Child Jesus",
    logo: "/partnerlogos/cornelia.jpg",
  },
  { name: "Church of Pentecost", logo: "/partnerlogos/cop.png" },
];

/** Marquee pace, in seconds per chip. Rows scale their duration by item count
 *  so every row moves at the same readable speed regardless of length. */
const SECONDS_PER_CHIP = 4;

/** Box width for wordmark logos, px. Wide enough for the longest mark to be
 *  legible at chip height without dominating the row. */
const WORDMARK_WIDTH = 96;

// ---------------------------------------------------------------------------

/** Short all-caps names are acronyms (GTS, AUMS) and read better whole than
 *  truncated to two letters. */
function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    const w = words[0];
    return w.length <= 4 && w === w.toUpperCase()
      ? w
      : w.slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// ---------------------------------------------------------------------------
// LogoChip
// ---------------------------------------------------------------------------

/** One treatment for every monogram — brand green with gold initials — so the
 *  badges read as a set instead of a scatter of unrelated colours. */
function Monogram({ name, size }: { name: string; size: number }) {
  const text = getInitials(name);
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: "var(--primary-dark)",
        border: "1px solid rgba(232, 184, 75, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Four-letter acronyms need a touch less size to sit inside the badge.
        fontSize: text.length > 2 ? "0.52rem" : "0.64rem",
        fontWeight: 800,
        color: "var(--accent)",
        letterSpacing: text.length > 2 ? "0.02em" : "0.05em",
        flexShrink: 0,
      }}
    >
      {text}
    </div>
  );
}

function LogoChip({
  name,
  logo,
  wordmark,
  variant,
}: Partner & { variant: "accreditation" | "corporate" }) {
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
        background: "#fff",
        // Border and transition are in the stylesheet so :hover can change
        // them; an inline border would override the hover rule.
        borderRadius: 8,
        whiteSpace: "nowrap",
        cursor: "default",
        flexShrink: 0,
      }}
    >
      {!logo ? (
        <Monogram name={name} size={size} />
      ) : (
        // Wordmarks get a wide box to be read in; symbols and crests stay
        // square. The box is fixed, not "auto": the three marquee copies must
        // be identical widths for the loop to be seamless, and an auto-width
        // image is sized differently before and after it loads. Both go
        // through next/image — sources run to 200KB+ but render at ~32px.
        <Image
          src={`/images${logo}`}
          alt={name}
          width={wordmark ? WORDMARK_WIDTH : size}
          height={size}
          style={{
            height: size,
            width: wordmark ? WORDMARK_WIDTH : size,
            objectFit: "contain",
            flexShrink: 0,
          }}
        />
      )}

      {/* The name is dropped when the artwork already carries it. */}
      {!wordmark && (
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
      )}
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
}: {
  items: Partner[];
  variant: "accreditation" | "corporate";
  direction: "left" | "right";
}) {
  const duration = items.length * SECONDS_PER_CHIP;
  // The animation itself lives in CSS and only the duration is passed in as a
  // custom property. Setting the `animation` shorthand inline would out-rank
  // the stylesheet's pause-on-hover rule, since inline styles beat class rules.
  const trackStyle = {
    "--marquee-duration": `${duration}s`,
  } as React.CSSProperties;

  // Three identical groups, each padded by exactly one gap, so that a third of
  // the track is *exactly* one repeat. Tripling the chips in a single flex
  // row left the loop a third of a gap short, and it visibly jumped every
  // cycle.
  const group = (key: string) => (
    <div key={key} className="marquee-set" aria-hidden={key !== "a"}>
      {items.map((p) => (
        <LogoChip key={`${key}-${p.name}`} {...p} variant={variant} />
      ))}
    </div>
  );

  return (
    <div className="marquee">
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
        className={`marquee-track marquee-track--${direction}`}
        style={trackStyle}
      >
        {group("a")}
        {group("b")}
        {group("c")}
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
          style={{
            width: 24,
            height: 1,
            background: "var(--accent)",
            opacity: 0.6,
          }}
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
          style={{
            width: 24,
            height: 1,
            background: "var(--accent)",
            opacity: 0.6,
          }}
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
      <RowLabel>Accreditations</RowLabel>
      <SliderRow
        items={ACCREDITATIONS}
        variant="accreditation"
        direction="left"
      />

      <div style={{ marginTop: "0.5rem" }}>
        <RowLabel>Corporate Clients</RowLabel>
      </div>
      <SliderRow
        items={CORPORATE_CLIENTS}
        variant="corporate"
        direction="right"
      />

      <div style={{ marginTop: "0.5rem" }}>
        <RowLabel>Partners &amp; Donors</RowLabel>
      </div>
      <SliderRow
        items={PARTNERS_AND_DONORS}
        variant="corporate"
        direction="left"
      />
    </div>
  );
}
