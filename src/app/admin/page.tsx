"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Check,
  ClipboardList,
  Clock,
  FilePen,
  FileClock,
  FilePlus2,
  Hourglass,
  Inbox,
  MessageSquare,
  Newspaper,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import {
  Avatar,
  Card,
  CountUp,
  EmptyState,
  PageHeader,
  Reveal,
  Segmented,
  Skeleton,
  StatusBadge,
  Trend,
} from "@/components/admin/ui";
import { AreaChart, Donut, Sparkline } from "@/components/admin/charts";
import {
  addDays,
  daysBetween,
  diffDays,
  formatDay,
  greeting,
  keyOfTimestamp,
  relativeDay,
  todayKey,
} from "@/lib/admin-dates";

type Range = "7" | "30" | "90";

const RANGE_LABEL: Record<Range, string> = { "7": "last 7 days", "30": "last 30 days", "90": "last 90 days" };

/** HR officers manage staff records only; the dashboard has nothing for them. */
export default function DashboardPage() {
  const { admin } = useAuth();
  const router = useRouter();
  const perms = admin?.perms ?? [];
  const staffOnly =
    can(perms, "staff.manage") &&
    !(["bookings", "comments", "posts.write", "settings"] as const).some((p) => can(perms, p));
  useEffect(() => {
    if (staffOnly) router.replace("/admin/employees");
  }, [staffOnly, router]);
  return staffOnly ? null : <Dashboard />;
}

function Dashboard() {
  const { admin } = useAuth();
  const {
    posts,
    bookings,
    bookingsLoading,
    postsLoading,
    pendingComments,
    confirmBooking,
  } = useAdminData();
  const [range, setRange] = useState<Range>("30");
  const [confirming, setConfirming] = useState<number | null>(null);

  const today = todayKey();
  const days = Number(range);

  const stats = useMemo(() => {
    const start = addDays(today, -(days - 1));
    const prevStart = addDays(start, -days);
    const prevEnd = addDays(start, -1);
    const inRange = (k: string, a: string, b: string) => k >= a && k <= b;

    const received = bookings.filter((b) => inRange(keyOfTimestamp(b.createdAtISO), start, today));
    const receivedPrev = bookings.filter((b) => inRange(keyOfTimestamp(b.createdAtISO), prevStart, prevEnd));
    const live = bookings.filter((b) => b.status !== "cancelled");

    const todayAppts = live.filter((b) => b.preferredDateISO === today);
    const weekEnd = addDays(today, 6);
    const next7 = live
      .filter((b) => inRange(b.preferredDateISO, today, weekEnd))
      .sort((a, b) => (a.preferredDateISO + a.time).localeCompare(b.preferredDateISO + b.time));

    const pending = bookings.filter((b) => b.status === "pending");
    const oldestPending = pending
      .map((b) => keyOfTimestamp(b.createdAtISO))
      .filter(Boolean)
      .sort()[0];

    // Daily series for the chart and sparkline.
    const keys = daysBetween(start, today);
    const receivedByDay = keys.map((k) => bookings.filter((b) => keyOfTimestamp(b.createdAtISO) === k).length);
    const scheduledByDay = keys.map((k) => live.filter((b) => b.preferredDateISO === k).length);

    // Status split for bookings received in the range.
    const statusSplit = {
      pending: received.filter((b) => b.status === "pending").length,
      confirmed: received.filter((b) => b.status === "confirmed").length,
      cancelled: received.filter((b) => b.status === "cancelled").length,
    };

    // Which departments patients are asking for.
    const deptCounts = new Map<string, number>();
    for (const b of received) {
      const d = b.dept || "Unspecified";
      deptCounts.set(d, (deptCounts.get(d) ?? 0) + 1);
    }
    const depts = Array.from(deptCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const published = posts.filter((p) => p.status === "published").length;
    const drafts = posts.filter((p) => p.status === "draft").length;

    return {
      keys, received, receivedPrev, todayAppts, next7, pending, oldestPending,
      receivedByDay, scheduledByDay, statusSplit, depts, published, drafts,
    };
  }, [bookings, posts, today, days]);

  const firstName = (admin?.name ?? "").split(" ")[0] || "there";
  // A content manager sees the content side only; patient bookings are for
  // administrators. The server enforces the same split.
  const canBookings = can(admin?.perms, "bookings");
  const canPublish = can(admin?.perms, "posts.publish");
  const canComments = can(admin?.perms, "comments");
  const awaitingReview = posts.filter((p) => p.status === "pending").length;
  const loading = bookingsLoading || postsLoading;

  const summary = (() => {
    const parts: string[] = [];
    if (canBookings && stats.pending.length) parts.push(`${stats.pending.length} booking${stats.pending.length === 1 ? "" : "s"} to confirm`);
    if (canPublish && awaitingReview) parts.push(`${awaitingReview} staff post${awaitingReview === 1 ? "" : "s"} to review`);
    if (canComments && pendingComments) parts.push(`${pendingComments} comment${pendingComments === 1 ? "" : "s"} to review`);
    if (!parts.length) return "Everything is up to date.";
    return `You have ${parts.join(" and ")}.`;
  })();

  const onConfirm = async (id: number) => {
    setConfirming(id);
    await confirmBooking(id);
    setConfirming(null);
  };

  const chartLabels = stats.keys.map((k) => formatDay(k));
  const maxDept = Math.max(1, ...stats.depts.map((d) => d[1]));

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle={
          <>
            {formatDay(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            <span style={{ margin: "0 8px", opacity: 0.4 }}>|</span>
            {loading ? "Loading today’s figures…" : summary}
          </>
        }
        actions={canBookings && (
          <Segmented<Range>
            id="dash-range"
            ariaLabel="Time range"
            value={range}
            onChange={setRange}
            options={[
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
            ]}
          />
        )}
      />

      {/* ── KPIs ─────────────────────────────────────────────────────── */}
      <div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", marginBottom: 16 }}>
        {canBookings && (<>
        <Reveal delay={0}>
          <Kpi
            href="/admin/calendar"
            tone="brand"
            icon={CalendarCheck2}
            label="Appointments today"
            value={stats.todayAppts.length}
            loading={loading}
            foot={<span className="ad-kpi-note">{stats.next7.length} in the next 7 days</span>}
          />
        </Reveal>
        <Reveal delay={0.05}>
          <Kpi
            href="/admin/bookings?status=pending"
            tone="warn"
            icon={Hourglass}
            label="Awaiting confirmation"
            value={stats.pending.length}
            loading={loading}
            foot={
              <span className="ad-kpi-note">
                {stats.oldestPending
                  ? `Oldest waiting ${Math.max(0, diffDays(stats.oldestPending, today))} day${diffDays(stats.oldestPending, today) === 1 ? "" : "s"}`
                  : "Nothing waiting"}
              </span>
            }
          />
        </Reveal>
        <Reveal delay={0.1}>
          <Kpi
            href="/admin/bookings"
            tone="info"
            icon={Inbox}
            label={`Requests, ${RANGE_LABEL[range]}`}
            value={stats.received.length}
            loading={loading}
            foot={
              <>
                <Trend current={stats.received.length} previous={stats.receivedPrev.length} suffix="vs prior" />
                <Sparkline values={stats.receivedByDay} color="var(--ad-info)" width={84} height={26} />
              </>
            }
          />
        </Reveal>
        </>)}
        {canPublish && (
          <Reveal delay={0.12}>
            <Kpi
              href="/admin/posts?status=pending"
              tone="gold"
              icon={FileClock}
              label="Staff posts to review"
              value={awaitingReview}
              loading={postsLoading}
              foot={<span className="ad-kpi-note">{awaitingReview ? "Submitted by staff writers" : "Nothing waiting"}</span>}
            />
          </Reveal>
        )}
        <Reveal delay={0.15}>
          <Kpi
            href="/admin/posts"
            tone="violet"
            icon={Newspaper}
            label="Published posts"
            value={stats.published}
            loading={loading}
            foot={
              <span className="ad-kpi-note">
                {stats.drafts} draft{stats.drafts === 1 ? "" : "s"} · {pendingComments} comment{pendingComments === 1 ? "" : "s"} to review
              </span>
            }
          />
        </Reveal>
      </div>

      {canBookings && (<>
      {/* ── Trend + status ───────────────────────────────────────────── */}
      <div className="ad-grid ad-dash-row">
        <Reveal delay={0.2}>
          <Card
            title="Booking activity"
            icon={TrendingUp}
            subtitle={`Requests received and appointments scheduled, ${RANGE_LABEL[range]}`}
            action={
              <div className="ad-legend">
                <span><span className="ad-legend-dot" style={{ background: "var(--ad-c1)" }} />Received</span>
                <span><span className="ad-legend-dot" style={{ background: "var(--ad-c2)" }} />Scheduled</span>
              </div>
            }
          >
            {loading ? (
              <Skeleton h={240} r={10} />
            ) : (
              <AreaChart
                labels={chartLabels}
                series={[
                  { name: "Received", color: "var(--ad-c1)", values: stats.receivedByDay },
                  { name: "Scheduled", color: "var(--ad-c2)", values: stats.scheduledByDay },
                ]}
                formatTip={(i) => formatDay(stats.keys[i], { weekday: "long", day: "numeric", month: "long" })}
              />
            )}
          </Card>
        </Reveal>

        <Reveal delay={0.25}>
          <Card title="Request status" icon={ClipboardList} subtitle={`Of requests received, ${RANGE_LABEL[range]}`} style={{ height: "100%" }}>
            {loading ? (
              <Skeleton h={200} r={10} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, paddingTop: 6 }}>
                <Donut
                  centerLabel="requests"
                  slices={[
                    { label: "Confirmed", value: stats.statusSplit.confirmed, color: "var(--ad-success)" },
                    { label: "Pending", value: stats.statusSplit.pending, color: "var(--ad-c2)" },
                    { label: "Cancelled", value: stats.statusSplit.cancelled, color: "var(--ad-c4)" },
                  ]}
                />
                <div style={{ width: "100%", display: "grid", gap: 8 }}>
                  {([
                    ["Confirmed", stats.statusSplit.confirmed, "var(--ad-success)", "confirmed"],
                    ["Pending", stats.statusSplit.pending, "var(--ad-c2)", "pending"],
                    ["Cancelled", stats.statusSplit.cancelled, "var(--ad-c4)", "cancelled"],
                  ] as const).map(([label, n, color, status]) => (
                    <Link
                      key={label}
                      href={`/admin/bookings?status=${status}`}
                      className="ad-menu-item"
                      style={{ padding: "7px 8px" }}
                    >
                      <span className="ad-legend-dot" style={{ background: color, margin: 0 }} />
                      <span style={{ flex: 1 }}>{label}</span>
                      <strong style={{ color: "var(--ad-text)" }}>{n}</strong>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Reveal>
      </div>

      {/* ── Upcoming + departments ───────────────────────────────────── */}
      <div className="ad-grid ad-dash-row" style={{ marginTop: 16 }}>
        <Reveal delay={0.3}>
          <Card
            title="Upcoming appointments"
            icon={CalendarDays}
            subtitle="Next 7 days, excluding cancellations"
            action={<Link href="/admin/calendar" className="ad-card-link">Calendar <ArrowRight size={14} /></Link>}
            bodyClassName=""
          >
            {loading ? (
              <div style={{ padding: "0 18px 18px", display: "grid", gap: 12 }}>
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} h={44} r={10} />)}
              </div>
            ) : stats.next7.length === 0 ? (
              <EmptyState icon={CalendarDays} title="A clear week" text="No appointments are scheduled for the next 7 days." />
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: "0 10px 10px" }}>
                {stats.next7.slice(0, 7).map((b) => (
                  <li key={b.databaseId} className="ad-upcoming">
                    <div className="ad-upcoming-date">
                      <span>{formatDay(b.preferredDateISO, { weekday: "short" })}</span>
                      <strong>{formatDay(b.preferredDateISO, { day: "numeric" })}</strong>
                    </div>
                    <Avatar name={b.name} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ad-cell-main" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                      <div className="ad-cell-sub" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Stethoscope size={12} />{b.dept || "No department"}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={12} />{relativeDay(b.preferredDateISO)}{b.time ? `, ${b.time}` : ""}</span>
                      </div>
                    </div>
                    {b.status === "pending" ? (
                      <button
                        type="button"
                        className="ad-btn ad-btn--sm ad-btn--success-soft"
                        onClick={() => onConfirm(b.databaseId)}
                        disabled={confirming === b.databaseId}
                      >
                        <Check size={14} strokeWidth={2.6} />
                        {confirming === b.databaseId ? "Confirming…" : "Confirm"}
                      </button>
                    ) : (
                      <StatusBadge status={b.status} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>

        <Reveal delay={0.35}>
          <Card title="Department demand" icon={Stethoscope} subtitle={`Requests by department, ${RANGE_LABEL[range]}`} style={{ height: "100%" }}>
            {loading ? (
              <div style={{ display: "grid", gap: 14 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={26} />)}</div>
            ) : stats.depts.length === 0 ? (
              <EmptyState icon={Stethoscope} title="No requests yet" text="Department demand appears once bookings arrive in this period." />
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {stats.depts.map(([dept, n], i) => (
                  <div key={dept}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "var(--ad-text-2)", fontWeight: 600 }}>{dept}</span>
                      <span style={{ color: "var(--ad-text)", fontWeight: 700 }}>{n}</span>
                    </div>
                    <div className="ad-meter">
                      <span style={{ width: `${(n / maxDept) * 100}%`, ["--tone" as string]: `var(--ad-c${(i % 6) + 1})`, animationDelay: `${i * 0.06}s` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Reveal>
      </div>

      </>)}

      {/* ── Content + shortcuts ──────────────────────────────────────── */}
      <div className="ad-grid ad-dash-row" style={{ marginTop: canBookings ? 16 : 0 }}>
        <Reveal delay={0.4}>
          <Card
            title="Latest posts"
            icon={Newspaper}
            action={<Link href="/admin/posts" className="ad-card-link">All posts <ArrowRight size={14} /></Link>}
            bodyClassName=""
          >
            {loading ? (
              <div style={{ padding: "0 18px 18px", display: "grid", gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={40} r={10} />)}</div>
            ) : posts.length === 0 ? (
              <EmptyState icon={Newspaper} title="No posts yet" action={<Link href="/admin/posts/new" className="ad-btn ad-btn--primary"><FilePlus2 size={15} />Write the first one</Link>} />
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: "0 10px 10px" }}>
                {posts.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/posts/${p.id}/edit`} className="ad-upcoming" style={{ textDecoration: "none" }}>
                      <span className={`ad-kpi-icon ad-tone-${p.status === "published" ? "brand" : "muted"}`} style={{ width: 36, height: 36 }}>
                        {p.status === "published" ? <Newspaper size={16} /> : <FilePen size={16} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ad-cell-main" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                        <div className="ad-cell-sub" style={{ textTransform: "capitalize" }}>{p.type} · {p.date || "Undated"}</div>
                      </div>
                      <StatusBadge status={p.status} label={p.status === "pending" ? "In review" : undefined} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>

        <Reveal delay={0.45}>
          <Card title="Quick actions" style={{ height: "100%" }}>
            <div style={{ display: "grid", gap: 10 }}>
              <QuickAction href="/admin/posts/new" icon={FilePlus2} tone="brand" title="Write a post" text="News, blog, event or announcement" />
              {canPublish && (
                <QuickAction href="/admin/posts?status=pending" icon={FileClock} tone="gold" title="Review staff posts" text={awaitingReview ? `${awaitingReview} waiting to be published` : "Nothing submitted"} />
              )}
              {canComments && (
                <QuickAction href="/admin/comments" icon={MessageSquare} tone="info" title="Moderate comments" text={pendingComments ? `${pendingComments} waiting for review` : "Queue is clear"} />
              )}
              {canBookings && (
                <QuickAction href="/admin/bookings?status=pending" icon={ClipboardList} tone="warn" title="Confirm bookings" text={stats.pending.length ? `${stats.pending.length} awaiting confirmation` : "Nothing pending"} />
              )}
            </div>
          </Card>
        </Reveal>
      </div>

      <style>{`
        .ad-dash-row { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
        @media (max-width: 1100px) { .ad-dash-row { grid-template-columns: minmax(0, 1fr); } }
        .ad-upcoming {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 8px; border-radius: 10px;
          transition: background .15s;
        }
        .ad-upcoming:hover { background: var(--ad-surface-2); }
        .ad-upcoming-date {
          width: 44px; flex-shrink: 0; text-align: center;
          border-radius: 10px; padding: 5px 0;
          background: var(--ad-surface-3);
          line-height: 1.1;
        }
        .ad-upcoming-date span { display: block; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--ad-text-3); }
        .ad-upcoming-date strong { display: block; font-size: 17px; color: var(--ad-text); }
        .ad-quick {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; border-radius: 12px;
          border: 1px solid var(--ad-border);
          text-decoration: none; color: inherit;
          transition: border-color .15s, background .15s, transform .15s;
        }
        .ad-quick:hover { border-color: var(--ad-border-strong); background: var(--ad-surface-2); transform: translateX(2px); }
        .ad-quick:hover .ad-quick-arrow { transform: translateX(3px); color: var(--ad-brand-ink); }
        .ad-quick-arrow { margin-left: auto; color: var(--ad-text-3); transition: transform .15s, color .15s; }
      `}</style>
    </>
  );
}

function Kpi({
  href, tone, icon: Icon, label, value, foot, loading,
}: {
  href: string;
  tone: string;
  icon: typeof Inbox;
  label: string;
  value: number;
  foot: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Link href={href} className={`ad-card ad-card--hover ad-kpi ad-tone-${tone}`}>
      <div className="ad-kpi-top">
        <span className="ad-kpi-label">{label}</span>
        <span className="ad-kpi-icon"><Icon size={17} /></span>
      </div>
      <div className="ad-kpi-value">{loading ? <Skeleton w={60} h={30} /> : <CountUp value={value} />}</div>
      <div className="ad-kpi-foot">{loading ? <Skeleton w="70%" h={12} /> : foot}</div>
    </Link>
  );
}

function QuickAction({ href, icon: Icon, tone, title, text }: {
  href: string; icon: typeof Inbox; tone: string; title: string; text: string;
}) {
  return (
    <Link href={href} className="ad-quick">
      <span className={`ad-kpi-icon ad-tone-${tone}`}><Icon size={17} /></span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 700, fontSize: 13.5, color: "var(--ad-text)" }}>{title}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--ad-text-3)" }}>{text}</span>
      </span>
      <ArrowRight size={16} className="ad-quick-arrow" />
    </Link>
  );
}
