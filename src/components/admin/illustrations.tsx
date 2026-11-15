// Spot illustrations for the portal's empty, locked, error and success screens.
// Drawn inline with the portal's colour tokens, so they follow light and dark
// mode and stay sharp at any size. Mostly greys, with green and gold as accents.
// Decorative only: the text next to them carries the meaning.

export type IllustrationName = "ledger" | "calendar" | "notices" | "team" | "documents" | "locked" | "offline" | "done";

export const ILLUSTRATIONS: { name: IllustrationName; label: string }[] = [
  { name: "ledger", label: "Receipts and ledgers" },
  { name: "calendar", label: "Bookings and dates" },
  { name: "notices", label: "Notice board" },
  { name: "team", label: "People and teams" },
  { name: "documents", label: "Posts and documents" },
  { name: "locked", label: "No access" },
  { name: "offline", label: "Couldn’t connect" },
  { name: "done", label: "All done" },
];

// stroke widths and the shared backdrop
const S = 2;
const backdrop = (
  <>
    <ellipse cx="80" cy="62" rx="66" ry="50" fill="var(--il-bg)" />
    <ellipse cx="80" cy="104" rx="44" ry="5" fill="var(--il-mute)" />
  </>
);

const ART: Record<IllustrationName, React.ReactNode> = {
  ledger: (
    <>
      {backdrop}
      {/* receipt with a torn edge */}
      <path d="M54 18h48a4 4 0 0 1 4 4v70l-7-5-7 5-7-5-7 5-7-5-7 5-7-5-7 5V22a4 4 0 0 1 4-4z"
        fill="var(--il-paper)" stroke="var(--il-line)" strokeWidth={S} strokeLinejoin="round" />
      <rect x="61" y="29" width="26" height="5" rx="2.5" fill="var(--il-brand)" />
      <rect x="61" y="42" width="34" height="4" rx="2" fill="var(--il-mute)" />
      <rect x="61" y="51" width="28" height="4" rx="2" fill="var(--il-mute)" />
      <rect x="61" y="60" width="34" height="4" rx="2" fill="var(--il-mute)" />
      <rect x="61" y="71" width="38" height="8" rx="4" fill="var(--il-brand-soft)" />
      {/* coins */}
      <g stroke="var(--il-gold-ink)" strokeWidth={S}>
        <path d="M110 86v-6h24v6c0 2.2-5.4 4-12 4s-12-1.8-12-4z" fill="var(--il-gold-soft)" />
        <ellipse cx="122" cy="80" rx="12" ry="4" fill="var(--il-gold)" />
        <path d="M112 74v-6h24v6c0 2.2-5.4 4-12 4s-12-1.8-12-4z" fill="var(--il-gold-soft)" />
        <ellipse cx="124" cy="68" rx="12" ry="4" fill="var(--il-gold)" />
      </g>
    </>
  ),

  calendar: (
    <>
      {backdrop}
      <rect x="38" y="24" width="84" height="70" rx="9" fill="var(--il-paper)" stroke="var(--il-line)" strokeWidth={S} />
      <path d="M47 25h66a8 8 0 0 1 8 8v9H39v-9a8 8 0 0 1 8-8z" fill="var(--il-brand-soft)" />
      <rect x="56" y="16" width="5" height="15" rx="2.5" fill="var(--il-detail)" />
      <rect x="99" y="16" width="5" height="15" rx="2.5" fill="var(--il-detail)" />
      {[54, 70, 86, 102].flatMap((x) =>
        [54, 67, 80].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" fill="var(--il-mute)" />),
      )}
      <circle cx="86" cy="67" r="8" fill="var(--il-gold)" />
      <path d="M82.5 67l2.5 2.5 4.5-5" fill="none" stroke="var(--il-paper)" strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  notices: (
    <>
      {backdrop}
      <rect x="32" y="22" width="96" height="66" rx="7" fill="var(--il-gold-soft)" stroke="var(--il-gold-ink)" strokeWidth={S} />
      <g transform="rotate(-5 59 54)">
        <rect x="44" y="33" width="31" height="38" rx="3" fill="var(--il-paper)" stroke="var(--il-line)" strokeWidth={S} />
        <rect x="50" y="44" width="19" height="3.5" rx="1.75" fill="var(--il-brand)" />
        <rect x="50" y="52" width="16" height="3" rx="1.5" fill="var(--il-mute)" />
        <rect x="50" y="59" width="19" height="3" rx="1.5" fill="var(--il-mute)" />
        <circle cx="59.5" cy="35" r="3.5" fill="var(--il-brand)" />
      </g>
      <g transform="rotate(4 101 54)">
        <rect x="85" y="37" width="32" height="30" rx="3" fill="var(--il-paper)" stroke="var(--il-line)" strokeWidth={S} />
        <rect x="91" y="47" width="20" height="3" rx="1.5" fill="var(--il-mute)" />
        <rect x="91" y="54" width="14" height="3" rx="1.5" fill="var(--il-mute)" />
        <circle cx="101" cy="39" r="3.5" fill="var(--il-gold-ink)" />
      </g>
    </>
  ),

  team: (
    <>
      {backdrop}
      {[[54, 52], [106, 52]].map(([x, y]) => (
        <g key={x}>
          <path d={`M${x - 17} ${y + 40}a17 15 0 0 1 34 0z`} fill="var(--il-mute)" stroke="var(--il-line)" strokeWidth={S} />
          <circle cx={x} cy={y + 8} r="9" fill="var(--il-paper)" stroke="var(--il-line)" strokeWidth={S} />
        </g>
      ))}
      <path d="M59 96a21 19 0 0 1 42 0z" fill="var(--il-brand-soft)" stroke="var(--il-brand)" strokeWidth={S} />
      <circle cx="80" cy="54" r="12" fill="var(--il-paper)" stroke="var(--il-brand)" strokeWidth={S} />
      <circle cx="96" cy="78" r="6" fill="var(--il-gold)" stroke="var(--il-paper)" strokeWidth={S} />
    </>
  ),

  documents: (
    <>
      {backdrop}
      <rect x="48" y="24" width="52" height="66" rx="5" fill="var(--il-mute)" stroke="var(--il-line)" strokeWidth={S} transform="rotate(-7 74 57)" />
      <rect x="58" y="22" width="54" height="68" rx="5" fill="var(--il-paper)" stroke="var(--il-line)" strokeWidth={S} />
      <rect x="66" y="32" width="30" height="5" rx="2.5" fill="var(--il-brand)" />
      <rect x="66" y="44" width="38" height="3.5" rx="1.75" fill="var(--il-mute)" />
      <rect x="66" y="52" width="32" height="3.5" rx="1.75" fill="var(--il-mute)" />
      <rect x="66" y="60" width="38" height="3.5" rx="1.75" fill="var(--il-mute)" />
      <rect x="66" y="68" width="24" height="3.5" rx="1.75" fill="var(--il-mute)" />
      {/* pen */}
      <g transform="rotate(32 120 66)">
        <rect x="115" y="36" width="10" height="44" rx="3" fill="var(--il-gold)" stroke="var(--il-gold-ink)" strokeWidth={S} />
        <path d="M115 80h10l-5 10z" fill="var(--il-paper)" stroke="var(--il-gold-ink)" strokeWidth={S} strokeLinejoin="round" />
      </g>
    </>
  ),

  locked: (
    <>
      {backdrop}
      <path d="M41 32h22l7 8h50a5 5 0 0 1 5 5v43a5 5 0 0 1-5 5H41a5 5 0 0 1-5-5V37a5 5 0 0 1 5-5z"
        fill="var(--il-mute)" stroke="var(--il-line)" strokeWidth={S} strokeLinejoin="round" />
      <rect x="36" y="48" width="89" height="45" rx="5" fill="var(--il-paper)" stroke="var(--il-line)" strokeWidth={S} />
      <path d="M71 66v-6a9 9 0 0 1 18 0v6" fill="none" stroke="var(--il-brand)" strokeWidth="4" strokeLinecap="round" />
      <rect x="65" y="64" width="30" height="23" rx="5" fill="var(--il-brand)" />
      <circle cx="80" cy="73" r="3.2" fill="var(--il-paper)" />
      <rect x="78.9" y="74" width="2.2" height="6" rx="1.1" fill="var(--il-paper)" />
    </>
  ),

  offline: (
    <>
      {backdrop}
      {/* cloud */}
      <path d="M56 76a15 15 0 0 1-1-29.9 22 22 0 0 1 41.5-9.6 16 16 0 0 1 17.5 15.5 12 12 0 0 1-1 24z"
        fill="var(--il-paper)" stroke="var(--il-line)" strokeWidth={S} strokeLinejoin="round" />
      <path d="M70 58h22M74 65h14" stroke="var(--il-mute)" strokeWidth="4" strokeLinecap="round" />
      {/* unplugged cable */}
      <path d="M36 98c10 0 12-8 22-8h8" fill="none" stroke="var(--il-detail)" strokeWidth="3" strokeLinecap="round" />
      <rect x="64" y="84" width="12" height="12" rx="3" fill="var(--il-brand)" />
      <rect x="75" y="86.5" width="5" height="2.5" rx="1" fill="var(--il-brand)" />
      <rect x="75" y="91" width="5" height="2.5" rx="1" fill="var(--il-brand)" />
      <rect x="92" y="84" width="12" height="12" rx="3" fill="var(--il-detail)" />
      <path d="M104 90h6c10 0 12 8 22 8" fill="none" stroke="var(--il-detail)" strokeWidth="3" strokeLinecap="round" />
      {/* spark */}
      <g stroke="var(--il-gold-ink)" strokeWidth={S} strokeLinecap="round">
        <path d="M86 82v-5" />
        <path d="M81 83l-3-3" />
        <path d="M91 83l3-3" />
      </g>
    </>
  ),

  done: (
    <>
      {backdrop}
      <path d="M46 26h40a4 4 0 0 1 4 4v58l-6-4-6 4-6-4-6 4-6-4-6 4-6-4-6 4V30a4 4 0 0 1 4-4z"
        fill="var(--il-paper)" stroke="var(--il-line)" strokeWidth={S} strokeLinejoin="round" transform="rotate(-6 66 57)" />
      <rect x="52" y="38" width="22" height="4" rx="2" fill="var(--il-mute)" transform="rotate(-6 66 57)" />
      <rect x="52" y="48" width="28" height="4" rx="2" fill="var(--il-mute)" transform="rotate(-6 66 57)" />
      <circle cx="98" cy="62" r="23" fill="var(--il-brand)" />
      <path d="M87.5 62l7.5 7.5 13.5-15" fill="none" stroke="var(--il-paper)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="126" cy="34" r="3.5" fill="var(--il-gold)" />
      <circle cx="122" cy="88" r="2.5" fill="var(--il-gold-ink)" />
      <rect x="114" y="22" width="6" height="6" rx="1.5" fill="var(--il-gold)" transform="rotate(20 117 25)" />
      <rect x="128" y="64" width="5" height="5" rx="1.2" fill="var(--il-brand-soft)" stroke="var(--il-brand)" strokeWidth="1.2" />
    </>
  ),
};

export function Illustration({ name, size = 140, className = "" }: { name: IllustrationName; size?: number; className?: string }) {
  return (
    <svg className={`po-illo ${className}`} viewBox="0 0 160 120" width={size} height={(size * 120) / 160}
      aria-hidden="true" focusable="false">
      {ART[name]}
    </svg>
  );
}
