"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminData } from "@/context/AdminDataContext";
import type { Post } from "@/app/admin/data";
import posthog from "posthog-js";

const POST_TYPES: Post["type"][] = ["news", "blog", "event", "announcement"];

const slugify = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

interface PostEditorFormProps {
  /** null creates a new post; a Post edits an existing one. Both write to
   *  WordPress. The featured image is attached via the portal plugin's
   *  setPostFeaturedImage, since WPGraphQL's post inputs don't expose it. */
  initialPost: Post | null;
}

export function PostEditorForm({ initialPost }: PostEditorFormProps) {
  const router = useRouter();
  const { refreshPosts, updatePost, addToast, setEditorDirty, requestLeave } = useAdminData();
  const isEdit = !!initialPost;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [body, setBody] = useState(initialPost?.body ?? "");
  const [type, setType] = useState<Post["type"]>(initialPost?.type ?? "news");
  const [status, setStatus] = useState<Post["status"]>(initialPost?.status ?? "draft");
  const [author, setAuthor] = useState(initialPost?.author ?? "Admin User");

  const [featuredImageId, setImgId] = useState<number | null>(
    (initialPost as any)?.featuredImageId ?? null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    (initialPost as any)?.featuredImageUrl ?? null,
  );
  const [uploadingImage, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Reset the shared unsaved-changes guard whenever an editor mounts or
  // unmounts, so a stale flag can never leak into an unrelated page.
  useEffect(() => {
    setEditorDirty(false);
    return () => setEditorDirty(false);
  }, [setEditorDirty]);

  const markDirty = () => {
    if (!dirty) {
      setDirty(true);
      setEditorDirty(true);
    }
  };

  const triggerFileSelector = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    markDirty();
    addToast("Uploading image to media library...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/media", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed uploading file to WordPress");
      setImgId(result.id);
      if (posthog.__loaded) posthog.capture("media_uploaded");
      addToast("Image successfully uploaded to WordPress!");
    } catch (err: any) {
      addToast(`Upload Error: ${err.message || "Could not save media file"}`, "danger");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const goToList = () => router.push("/admin/posts");

  const cancel = () => {
    if (requestLeave("/admin/posts")) goToList();
  };

  const saveEdit = async (nextStatus: Post["status"]) => {
    if (!initialPost) return;
    setSaving(true);
    try {
      await updatePost(initialPost.id, {
        title: title.trim(),
        excerpt: excerpt.trim(),
        body: body.trim(),
        type,
        status: nextStatus,
        // null clears the thumbnail; undefined would leave it untouched.
        featuredImageId: featuredImageId ?? null,
      } as any);
      setEditorDirty(false);
      if (posthog.__loaded) {
        posthog.capture("post_saved", { content_type: type, status: nextStatus, operation: "updated" });
      }
      addToast(nextStatus === "published" ? "Post published" : "Saved as draft");
      goToList();
    } catch {
      // updatePost already reported the failure; stay on the form so the
      // author's work isn't lost.
    } finally {
      setSaving(false);
    }
  };

  const saveNew = async (publish: boolean) => {
    const targetStatus: Post["status"] = publish ? "published" : status;
    setSaving(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: body.trim(),
          status: targetStatus,
          type,
          featuredImageId,
        }),
      });

      const result = await response.json();
      setSaving(false);

      if (!response.ok) {
        addToast(result.error || "Could not save the post.", "danger");
        return;
      }

      setEditorDirty(false);
      if (posthog.__loaded) {
        posthog.capture("post_saved", { content_type: type, status: targetStatus, operation: "created" });
      }
      addToast(targetStatus === "published" ? "Post published" : "Saved as draft");
      // Re-read from WordPress so the list shows what was actually stored,
      // rather than a locally-guessed copy.
      await refreshPosts();
      goToList();
    } catch {
      setSaving(false);
      addToast("A network issue occurred running the GraphQL operation.", "danger");
    }
  };

  const save = (publish: boolean) => {
    if (!title.trim()) {
      addToast("Please enter a title", "warn");
      return;
    }
    if (isEdit) saveEdit(publish ? "published" : status);
    else saveNew(publish);
  };

  return (
    <>
      <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: "none" }}
        />

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
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>
              {isEdit ? "Edit Post" : "New Post"}
            </div>
            {dirty && (
              <span style={{ fontSize: 11.5, color: "#d97706", fontWeight: 600 }}>
                ● Unsaved changes
              </span>
            )}
          </div>
          {title && (
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>/{slugify(title)}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={cancel}
            style={{
              padding: "7px 14px",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              background: "none",
              color: "#93A29B",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving || uploadingImage}
            style={{
              padding: "7px 14px",
              border: "0.5px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              background: "#fff",
              color: "#555",
              cursor: "pointer",
              opacity: uploadingImage ? 0.5 : 1,
            }}
          >
            Save draft
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving || uploadingImage}
            style={{
              padding: "7px 14px",
              background: "#0A4F3C",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity: uploadingImage ? 0.5 : 1,
            }}
          >
            {saving ? "Processing…" : isEdit ? "Publish" : "Publish to WP →"}
          </button>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16 }}>
          {/* Main editor area */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markDirty();
                }}
                placeholder="Post title…"
                style={{
                  width: "100%",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#111",
                  border: "none",
                  borderBottom: "1.5px solid #e5e7eb",
                  padding: "8px 0",
                  background: "transparent",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <input
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  markDirty();
                }}
                placeholder="Short excerpt or summary shown on listing page…"
                style={{
                  width: "100%",
                  fontSize: 13,
                  color: "#555",
                  border: "0.5px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "8px 10px",
                  background: "#fff",
                  outline: "none",
                }}
              />
            </div>

            {/* Rich Editor Toolbar Mock */}
            <div
              style={{
                display: "flex",
                gap: 2,
                padding: "6px 8px",
                border: "0.5px solid #e5e7eb",
                borderBottom: "none",
                borderRadius: "6px 6px 0 0",
                background: "#F9FAFB",
                flexWrap: "wrap",
              }}
            >
              {["B", "I", "U", "H", "•", "1.", "Link", "Img"].map((icon) => (
                <button
                  key={icon}
                  type="button"
                  style={{
                    padding: "4px 8px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                    fontSize: 12,
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {icon}
                </button>
              ))}
            </div>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                markDirty();
              }}
              placeholder="Write your post content here…"
              style={{
                width: "100%",
                minHeight: 320,
                fontSize: 14,
                color: "#333",
                border: "0.5px solid #e5e7eb",
                borderRadius: "0 0 6px 6px",
                padding: "12px",
                background: "#fff",
                resize: "vertical",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.7,
                outline: "none",
              }}
            />
          </div>

          {/* Configuration Sidebar */}
          <div>
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e5e7eb",
                borderRadius: 10,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#aaa",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                }}
              >
                Post settings
              </div>
              <Field label="Type">
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as Post["type"]);
                    markDirty();
                  }}
                  style={selStyle}
                >
                  {POST_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as Post["status"]);
                    markDirty();
                  }}
                  style={selStyle}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>
              <Field label="Author">
                <input
                  value={author}
                  onChange={(e) => {
                    setAuthor(e.target.value);
                    markDirty();
                  }}
                  style={inputStyle}
                />
              </Field>
              {!isEdit && (
                <Field label="Publish date">
                  <input
                    type="date"
                    style={inputStyle}
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </Field>
              )}
            </div>

            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e5e7eb",
                borderRadius: 10,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#aaa",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                }}
              >
                SEO &amp; Slug
              </div>
              <Field label="URL slug">
                <input
                  value={slugify(title)}
                  readOnly
                  style={{ ...inputStyle, background: "#F9FAFB", color: "#888" }}
                  placeholder="auto-generated"
                />
              </Field>
            </div>

            {(
              <div
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#aaa",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 12,
                  }}
                >
                  Featured image
                </div>
                <div
                  onClick={triggerFileSelector}
                  style={{
                    border: previewUrl ? "1.5px solid #0A4F3C" : "1px dashed #d1d5db",
                    borderRadius: 6,
                    padding: previewUrl ? "8px" : "24px 12px",
                    textAlign: "center",
                    cursor: "pointer",
                    color: previewUrl ? "#0A4F3C" : "#bbb",
                    fontSize: 13,
                    background: previewUrl ? "#E8F5F0" : "transparent",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {previewUrl ? (
                    <div style={{ position: "relative", width: "100%", height: 130 }}>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }}
                      />
                      {uploadingImage && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(255,255,255,0.75)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          UPLOADING...
                        </div>
                      )}
                    </div>
                  ) : (
                    <>{uploadingImage ? "Processing File..." : "Click to select image"}</>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 12, color: "#888", fontWeight: 500, display: "block", marginBottom: 3 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 13,
  border: "0.5px solid #e5e7eb",
  borderRadius: 5,
  padding: "6px 8px",
  background: "#fff",
  color: "#111",
  outline: "none",
  fontFamily: "var(--font-sans)",
};
const selStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
