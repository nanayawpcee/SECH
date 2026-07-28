"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAdminData } from "@/context/AdminDataContext";
import { PostEditorForm } from "@/components/admin/PostEditorForm";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const { posts } = useAdminData();
  const post = posts.find((p) => p.id === Number(params.id));

  if (!post) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#93A29B", marginBottom: 12 }}>Post not found.</div>
        <Link href="/admin/posts" style={{ fontSize: 13, color: "#0A4F3C", fontWeight: 600 }}>
          ← Back to posts
        </Link>
      </div>
    );
  }

  return <PostEditorForm initialPost={post} />;
}
