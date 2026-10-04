import Link from "next/link";
import { AlertTriangle, ArrowRight, Lock, Megaphone, Pin } from "lucide-react";
import { NOTICE_CATEGORIES, type NoticeHeadline } from "@/lib/wp-notices";
import { ShareButton } from "./ShareButton";

const PRIORITY_TONE = { normal: "brand", important: "gold", urgent: "danger" } as const;

/** Sign-in link that brings the person straight back to this notice. */
export function readHref(id: number) {
  return `/admin/login?next=${encodeURIComponent(`/staff/notices?open=${id}`)}`;
}

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Accra" });
}

/**
 * The public face of the staff notice board: headlines only. The message,
 * author, department and links are never sent to this page — only to a
 * signed-in staff member. Notices a manager marked staff-only appear as a
 * locked placeholder with no title at all.
 */
export function PublicHeadlines({ headlines, focusId }: { headlines: NoticeHeadline[] | null; focusId?: number }) {
  const focus = focusId ? headlines?.find((h) => h.databaseId === focusId) : undefined;
  const rest = (headlines ?? []).filter((h) => h.databaseId !== focus?.databaseId);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Accra" });

  return (
    <div className="pn-wrap">
      <header className="pn-head">
        <div className="pn-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" />
          <div>
            <strong>St. Elizabeth Catholic Hospital</strong>
            <span>Staff notice board</span>
          </div>
        </div>
        <p className="pn-date">{today}</p>
      </header>

      <main className="pn-main">
        {headlines === null ? (
          <div className="pn-empty"><Megaphone size={26} /><strong>The notice board is unavailable right now.</strong><span>Please try again shortly.</span></div>
        ) : focusId && !focus ? (
          <div className="pn-empty"><Megaphone size={26} /><strong>That notice has ended or been removed.</strong><span>Here’s what’s on the board now.</span></div>
        ) : null}

        {focus && (
          <section className="pn-focus">
            <span className="pn-shared">Shared with you</span>
            <Headline h={focus} large />
          </section>
        )}

        {headlines && headlines.length === 0 && (
          <div className="pn-empty"><Megaphone size={26} /><strong>No notices at the moment.</strong><span>Check back later.</span></div>
        )}

        {rest.length > 0 && (
          <section>
            {focus && <h2 className="pn-h2">Also on the board</h2>}
            <ul className="pn-list">
              {rest.map((h) => <li key={h.databaseId}><Headline h={h} /></li>)}
            </ul>
          </section>
        )}

        <div className="pn-signin">
          <Lock size={18} />
          <div>
            <strong>Full notices are for hospital staff.</strong>
            <span>Sign in with your staff account to read the details.</span>
          </div>
          <Link href={focus ? readHref(focus.databaseId) : "/admin/login?next=%2Fstaff%2Fnotices"} className="po-btn po-btn--primary">Sign in<ArrowRight size={16} /></Link>
        </div>

        <div className="pn-foot">
          <ShareButton focusTitle={focus?.title ?? null} />
        </div>
      </main>
    </div>
  );
}

function Headline({ h, large }: { h: NoticeHeadline; large?: boolean }) {
  const tone = PRIORITY_TONE[h.priority] ?? "brand";
  const cat = NOTICE_CATEGORIES.find((c) => c.value === h.category)?.label ?? "General";
  return (
    <Link href={readHref(h.databaseId)} className={`pn-card po-tone-${tone}`} data-large={!!large} data-priority={h.priority}>
      <div className="pn-tags">
        {h.pinned && <span className="pn-pin"><Pin size={12} />Pinned</span>}
        <span className="po-badge po-badge--plain po-tone-muted" style={{ textTransform: "none" }}>{cat}</span>
        {h.priority !== "normal" && (
          <span className={`po-badge po-tone-${tone}`} style={{ textTransform: "none" }}>
            {h.priority === "urgent" && <AlertTriangle size={12} />}{h.priority === "urgent" ? "Urgent" : "Important"}
          </span>
        )}
        <span className="pn-when">{when(h.createdAt)}</span>
      </div>
      <div className="pn-title">
        {h.title ?? <span className="pn-private"><Lock size={15} />Staff-only notice</span>}
      </div>
      <span className="pn-read"><Lock size={13} />Sign in to read</span>
    </Link>
  );
}
