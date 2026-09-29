"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FilePen,
  FilePlus2,
  Globe,
  Hourglass,
  Lock,
  AlertTriangle,
  Megaphone,
  Pin,
  Newspaper,
  PenLine,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminData } from "@/context/AdminDataContext";
import { can } from "@/lib/permissions";
import { Card, Chip, CountUp, EmptyState, PageHeader, Reveal, Skeleton, StatusBadge } from "@/components/admin/ui";
import { formatDay, greeting, todayKey } from "@/lib/admin-dates";

export default function StaffHome() {
  const { admin } = useAuth();
  const { posts: allPosts, postsLoading, notices, noticesLoading, noticesNeedPlugin, markNoticeRead } = useAdminData();
  // Own posts only, even for an admin browsing the staff area.
  const posts = admin?.id ? allPosts.filter((p) => p.authorId === admin.id) : allPosts;
  const canWrite = can(admin?.perms, "posts.write");
  const canPublish = can(admin?.perms, "posts.publish");
  const firstName = (admin?.name ?? "").split(" ")[0] || "there";

  const drafts = posts.filter((p) => p.status === "draft");
  const review = posts.filter((p) => p.status === "pending");
  const live = posts.filter((p) => p.status === "published");
  const unreadNotices = notices.filter((n) => !n.isRead);
  const urgent = unreadNotices.filter((n) => n.priority === "urgent");
  // Unread first, then pinned — the board's own order otherwise.
  const latestNotices = [...notices]
    .sort((a, b) => Number(a.isRead) - Number(b.isRead))
    .slice(0, 3);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {formatDay(todayKey(), { weekday: "long", day: "numeric", month: "long" })}
            <Chip tone="brand">{admin?.role ?? "Staff"}</Chip>
          </span>
        }
        actions={canWrite ? (
          <Link href="/staff/posts/new" className="ad-btn ad-btn--primary"><FilePlus2 size={16} />Write a post</Link>
        ) : undefined}
      />

      {/* Urgent notices nobody should miss. */}
      {urgent.map((n) => (
        <div key={n.databaseId} className="ad-alert ad-tone-danger" role="alert" style={{ marginBottom: 12, alignItems: "center" }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}><strong>Urgent:</strong> {n.title}</span>
          <Link href="/staff/notices" className="ad-btn ad-btn--sm">Read</Link>
          <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost" onClick={() => markNoticeRead(n.databaseId)}>Dismiss</button>
        </div>
      ))}

      {!noticesNeedPlugin && (
        <Reveal delay={0}>
          <Card
            title="Notice board"
            icon={Megaphone}
            subtitle={noticesLoading ? "Loading…" : unreadNotices.length ? `${unreadNotices.length} new for you` : "You’re up to date"}
            action={<Link href="/staff/notices" className="ad-card-link">All notices <ArrowRight size={14} /></Link>}
            bodyClassName=""
            style={{ marginBottom: 16 }}
          >
            {noticesLoading ? (
              <div style={{ padding: "0 18px 18px", display: "grid", gap: 10 }}>{[0, 1].map((i) => <Skeleton key={i} h={44} r={10} />)}</div>
            ) : latestNotices.length === 0 ? (
              <div className="ad-hint" style={{ padding: "0 18px 18px" }}>No notices have been posted yet.</div>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: "0 10px 10px" }}>
                {latestNotices.map((n) => (
                  <li key={n.databaseId}>
                    <Link href="/staff/notices" className="sf-row-item">
                      <span className={`ad-kpi-icon ad-tone-${n.priority === "urgent" ? "danger" : n.priority === "important" ? "gold" : "brand"}`} style={{ width: 36, height: 36 }}>
                        {n.pinned ? <Pin size={15} /> : <Megaphone size={15} />}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="ad-cell-main ad-clamp-1" style={{ display: "block" }}>{n.title}</span>
                        <span className="ad-cell-sub ad-clamp-1" style={{ display: "block" }}>{n.body || n.authorName}</span>
                      </span>
                      {!n.isRead && <span className="ad-badge ad-tone-brand" style={{ textTransform: "none" }}>New</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>
      )}

      {!canWrite ? (
        <Card>
          <EmptyState
            icon={Lock}
            title="Your account can’t write posts yet"
            text="You’re signed in to the staff area. If you’d like to contribute news or articles to the hospital website, ask an administrator to give your account writing access."
          />
        </Card>
      ) : (
        <>
          <div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", marginBottom: 16 }}>
            {([
              { label: "Drafts", n: drafts.length, icon: FilePen, tone: "muted", href: "/staff/posts?status=draft", note: "Only you can see these" },
              { label: canPublish ? "Pending" : "Waiting for review", n: review.length, icon: Hourglass, tone: "warn", href: "/staff/posts?status=pending", note: canPublish ? "Submitted posts" : "With an administrator" },
              { label: "Published", n: live.length, icon: Globe, tone: "success", href: "/staff/posts?status=published", note: "Live on the website" },
            ] as const).map((t, i) => {
              const Icon = t.icon;
              return (
                <Reveal key={t.label} delay={i * 0.05}>
                  <Link href={t.href} className={`ad-card ad-card--hover ad-kpi ad-tone-${t.tone}`}>
                    <div className="ad-kpi-top">
                      <span className="ad-kpi-label">{t.label}</span>
                      <span className="ad-kpi-icon"><Icon size={17} /></span>
                    </div>
                    <div className="ad-kpi-value">{postsLoading ? <Skeleton w={50} h={30} /> : <CountUp value={t.n} />}</div>
                    <div className="ad-kpi-foot"><span className="ad-kpi-note">{t.note}</span></div>
                  </Link>
                </Reveal>
              );
            })}
          </div>

          <div className="ad-grid sf-row">
            <Reveal delay={0.15}>
              <Card
                title="Your recent posts"
                icon={Newspaper}
                action={<Link href="/staff/posts" className="ad-card-link">All my posts <ArrowRight size={14} /></Link>}
                bodyClassName=""
              >
                {postsLoading ? (
                  <div style={{ padding: "0 18px 18px", display: "grid", gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={44} r={10} />)}</div>
                ) : posts.length === 0 ? (
                  <EmptyState
                    icon={PenLine}
                    title="Nothing written yet"
                    text="Share news from your department, a health tip for patients, or an upcoming event."
                    action={<Link href="/staff/posts/new" className="ad-btn ad-btn--primary"><FilePlus2 size={15} />Write your first post</Link>}
                  />
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: "0 10px 10px" }}>
                    {posts.slice(0, 6).map((p) => {
                      const editable = canPublish || p.status !== "published";
                      const row = (
                        <>
                          <span className={`ad-kpi-icon ad-tone-${p.status === "published" ? "success" : p.status === "pending" ? "warn" : "muted"}`} style={{ width: 36, height: 36 }}>
                            {p.status === "published" ? <Globe size={16} /> : p.status === "pending" ? <Hourglass size={16} /> : <FilePen size={16} />}
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="ad-cell-main ad-clamp-1" style={{ display: "block" }}>{p.title}</span>
                            <span className="ad-cell-sub" style={{ display: "block", textTransform: "capitalize" }}>{p.type} · {p.date || "Undated"}</span>
                          </span>
                          <StatusBadge status={p.status} label={p.status === "pending" ? "In review" : undefined} />
                        </>
                      );
                      return (
                        <li key={p.id}>
                          {editable ? (
                            <Link href={`/staff/posts/${p.id}/edit`} className="sf-row-item">{row}</Link>
                          ) : p.slug ? (
                            <a href={`/news/${p.slug}`} target="_blank" rel="noopener noreferrer" className="sf-row-item">{row}</a>
                          ) : (
                            <div className="sf-row-item">{row}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </Reveal>

            <Reveal delay={0.2}>
              <Card title="How publishing works" style={{ height: "100%" }}>
                <ol className="sf-steps">
                  <li>
                    <span className="sf-step-icon ad-tone-brand"><PenLine size={16} /></span>
                    <span><strong>Write</strong><small>Draft your post. Save as often as you like — drafts are private.</small></span>
                  </li>
                  {canPublish ? (
                    <li>
                      <span className="sf-step-icon ad-tone-success"><Globe size={16} /></span>
                      <span><strong>Publish</strong><small>Your account can publish your own posts straight to the website.</small></span>
                    </li>
                  ) : (
                    <>
                      <li>
                        <span className="sf-step-icon ad-tone-warn"><Send size={16} /></span>
                        <span><strong>Submit for review</strong><small>When it’s ready, submit it. You can still make changes while it waits.</small></span>
                      </li>
                      <li>
                        <span className="sf-step-icon ad-tone-success"><CheckCircle2 size={16} /></span>
                        <span><strong>An administrator publishes</strong><small>They check it, add a picture if needed, and put it live on the website.</small></span>
                      </li>
                    </>
                  )}
                </ol>
              </Card>
            </Reveal>
          </div>
        </>
      )}

      <style>{`
        .sf-row { grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr); }
        @media (max-width: 1000px) { .sf-row { grid-template-columns: minmax(0, 1fr); } }
        .sf-row-item { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 10px; text-decoration: none; color: inherit; transition: background .15s; }
        a.sf-row-item:hover { background: var(--ad-surface-2); }
        .sf-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; counter-reset: s; }
        .sf-steps li { display: flex; gap: 12px; align-items: flex-start; }
        .sf-step-icon { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0; background: var(--tone-soft); color: var(--tone); }
        .sf-steps strong { display: block; font-size: 13.5px; color: var(--ad-text); }
        .sf-steps small { display: block; font-size: 12.5px; color: var(--ad-text-3); line-height: 1.5; margin-top: 2px; }
      `}</style>
    </>
  );
}
