"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { PostEditorForm } from "@/components/admin/PostEditorForm";
import { EmptyState, Skeleton } from "@/components/admin/ui";

/** Shared by the admin console and the staff area. */
export function EditPostRoute({ base }: { base: "/admin/posts" | "/staff/posts" }) {
  const params = useParams<{ id: string }>();
  const { posts, postsLoading } = useAdminData();
  const post = posts.find((p) => p.id === Number(params.id));

  // On a direct visit the post list is still loading — that is not "not found".
  if (!post && postsLoading) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <Skeleton h={48} w={320} r={10} />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16 }}>
          <Skeleton h={520} r={12} />
          <Skeleton h={320} r={12} />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <section className="po-card">
        <EmptyState
          icon={FileQuestion}
          title="Post not found"
          text="It may have been deleted, or the link is out of date."
          action={<Link href={base} className="po-btn"><ArrowLeft size={15} />Back to posts</Link>}
        />
      </section>
    );
  }

  // Keyed by id so moving between posts starts a fresh editor.
  return <PostEditorForm key={post.id} initialPost={post} base={base} />;
}
