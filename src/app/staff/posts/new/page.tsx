"use client";

import { PostEditorForm } from "@/components/admin/PostEditorForm";

export default function StaffNewPostPage() {
  return <PostEditorForm initialPost={null} base="/staff/posts" />;
}
