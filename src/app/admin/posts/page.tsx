"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminData } from "@/context/AdminDataContext";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

const TABS = [
  { key: "all", label: "All Posts" },
  { key: "news", label: "News" },
  { key: "blog", label: "Blog" },
  { key: "draft", label: "Drafts" },
];

export default function PostsPage() {
  const { posts, postsLoading, postsError, refreshPosts, togglePostStatus, deletePost } =
    useAdminData();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = posts.filter((p) => {
    const matchTab = tab === "all" ? true : tab === "draft" ? p.status === "draft" : p.type === tab;
    return matchTab && p.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      {/* Topbar */}
      <div
        style={{
          background: "#fff",
          borderBottom: "0.5px solid #e5e7eb",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>News &amp; Blogs</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 9, fontSize: 14, color: "#bbb", pointerEvents: "none" }}>
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts…"
              style={{
                paddingLeft: 28,
                paddingRight: 10,
                paddingTop: 6,
                paddingBottom: 6,
                fontSize: 13,
                border: "0.5px solid #d1d5db",
                borderRadius: 6,
                background: "#fff",
                color: "#111",
                width: 200,
              }}
            />
          </div>
          <Link
            href="/admin/posts/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              background: "#0A4F3C",
              color: "#fff",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            + New Post
          </Link>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: "0.5px solid #e5e7eb" }}>
            {TABS.map((t) => {
              const count =
                t.key === "all"
                  ? posts.length
                  : t.key === "draft"
                    ? posts.filter((p) => p.status === "draft").length
                    : posts.filter((p) => p.type === t.key).length;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "10px 16px",
                    fontSize: 13,
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    color: tab === t.key ? "#0A4F3C" : "#888",
                    borderBottom: `2px solid ${tab === t.key ? "#0A4F3C" : "transparent"}`,
                    fontWeight: tab === t.key ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {t.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #e5e7eb" }}>
                {["Title", "Type", "Author", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#888", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {postsLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#bbb", fontSize: 13 }}>
                    Loading posts from WordPress…
                  </td>
                </tr>
              ) : postsError ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 32, fontSize: 13 }}>
                    <div style={{ color: "#DC2626", marginBottom: 10 }}>{postsError}</div>
                    <button
                      onClick={() => refreshPosts()}
                      style={{
                        padding: "6px 14px",
                        border: "0.5px solid #d1d5db",
                        borderRadius: 6,
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#555",
                      }}
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#bbb", fontSize: 13 }}>
                    No posts found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", maxWidth: 220 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          color: "#111",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#bbb",
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.excerpt}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 500,
                          background: p.type === "blog" ? "#EDE8F5" : p.type === "event" ? "#FEF3C7" : "#EFF6FF",
                          color: p.type === "blog" ? "#5C3D99" : p.type === "event" ? "#d97706" : "#1565C0",
                        }}
                      >
                        {p.type}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#555" }}>{p.author}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{p.date}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 500,
                          background: p.status === "published" ? "#DCFCE7" : "#F3F4F6",
                          color: p.status === "published" ? "#16a34a" : "#666",
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Link
                          href={`/admin/posts/${p.id}/edit`}
                          style={{
                            padding: "4px 8px",
                            border: "0.5px solid #d1d5db",
                            borderRadius: 5,
                            fontSize: 12,
                            color: "#555",
                            textDecoration: "none",
                          }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => togglePostStatus(p.id)}
                          style={{
                            padding: "4px 8px",
                            border: "0.5px solid #d1d5db",
                            borderRadius: 5,
                            fontSize: 12,
                            color: "#555",
                            background: "none",
                            cursor: "pointer",
                          }}
                        >
                          {p.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => deletePost(p.id)}
                          style={{
                            padding: "4px 8px",
                            border: "0.5px solid #FCA5A5",
                            borderRadius: 5,
                            fontSize: 12,
                            color: "#DC2626",
                            background: "none",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
