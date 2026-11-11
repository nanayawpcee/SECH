import { NextResponse } from "next/server";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { POST_FIELDS, mapWpPost, SET_FEATURED_IMAGE, allowedStatus, toWpStatus, type WpPostNode } from "@/lib/wp-posts";
import { requirePerm, type Viewer } from "@/lib/access";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const GET_POST = `
  query AdminPost($id: ID!) {
    post(id: $id, idType: DATABASE_ID) { ${POST_FIELDS} }
  }
`;

async function ownershipGate(viewer: Viewer, id: string): Promise<NextResponse | null> {
  if (viewer.perms.includes("posts.editOthers")) return null;
  const data = await wpGraphQL<{ post: WpPostNode | null }>(GET_POST, { id }, { authenticated: true });
  if (!data.post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (data.post.author?.node?.databaseId !== viewer.id) {
    return NextResponse.json({ error: "You can only change your own posts." }, { status: 403 });
  }
  if (data.post.status === "publish" && !viewer.perms.includes("posts.publish")) {
    return NextResponse.json({ error: "This post is live. Ask an administrator to change it." }, { status: 403 });
  }
  return null;
}

export async function GET(_request: Request, { params }: Params) {
  const gate = await requirePerm("posts.write");
  if (gate instanceof NextResponse) return gate;
  try {
    const data = await wpGraphQL<{ post: WpPostNode | null }>(
      GET_POST,
      { id: params.id },
      { authenticated: true },
    );
    if (!data.post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json({ post: mapWpPost(data.post) });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

// categories only go in when a type is given: append:false with no name wipes them
function updatePostMutation(withCategory: boolean) {
  return `
  mutation UpdateExistingPost(
    $id: ID!
    $title: String
    $content: String
    $excerpt: String
    $status: PostStatusEnum
    ${withCategory ? "$categoryName: String" : ""}
    $commentStatus: String
  ) {
    updatePost(
      input: {
        id: $id
        title: $title
        content: $content
        excerpt: $excerpt
        status: $status
        ${withCategory ? "categories: { append: false, nodes: [{ name: $categoryName }] }" : ""}
        commentStatus: $commentStatus
      }
    ) {
      post { ${POST_FIELDS} }
    }
  }
`;
}

export async function PATCH(request: Request, { params }: Params) {
  const gate = await requirePerm("posts.write");
  if (gate instanceof NextResponse) return gate;
  try {
    const denied = await ownershipGate(gate, params.id);
    if (denied) return denied;
    const patch = await request.json();

    if (patch.title !== undefined && !String(patch.title).trim()) {
      return NextResponse.json({ error: "A title is required." }, { status: 400 });
    }

    const withCategory = typeof patch.type === "string" && patch.type.trim() !== "";
    const touchesPost = ["title", "body", "content", "excerpt", "status", "type", "commentsOpen"].some(
      (key) => patch[key] !== undefined,
    );

    // a change that is only the featured image skips updatePost altogether
    let updated: WpPostNode | null = null;
    if (touchesPost) {
      // WPGraphQL's updatePost saves a post sent without a status as a DRAFT,
      // which silently unpublished a live story once. So an edit that doesn't
      // mention status sends the post's current status back unchanged.
      let status: string | undefined;
      if (patch.status !== undefined) {
        status = toWpStatus(allowedStatus(patch.status, gate.perms.includes("posts.publish")));
      } else {
        const current = await wpGraphQL<{ post: WpPostNode | null }>(GET_POST, { id: params.id }, { authenticated: true });
        if (!current.post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
        status = current.post.status ? String(current.post.status).toUpperCase() : undefined;
      }

      const data = await wpGraphQL<{ updatePost: { post: WpPostNode } }>(
        updatePostMutation(withCategory),
        {
          id: params.id,
          title: patch.title !== undefined ? String(patch.title).trim() : undefined,
          content: patch.body ?? patch.content,
          excerpt: patch.excerpt,
          status,
          ...(withCategory ? { categoryName: patch.type } : {}),
          commentStatus:
            patch.commentsOpen === undefined
              ? undefined
              : patch.commentsOpen
                ? "open"
                : "closed",
        },
        { authenticated: true },
      );
      updated = data.updatePost.post;
    }

    if (patch.featuredImageId !== undefined) {
      await wpGraphQL(
        SET_FEATURED_IMAGE,
        {
          postId: Number(params.id),
          mediaId: patch.featuredImageId === null ? null : Number(patch.featuredImageId),
        },
        { authenticated: true },
      );
      const fresh = await wpGraphQL<{ post: WpPostNode | null }>(
        GET_POST,
        { id: params.id },
        { authenticated: true },
      );
      if (fresh.post) return NextResponse.json({ post: mapWpPost(fresh.post) });
    }

    if (!updated) {
      const current = await wpGraphQL<{ post: WpPostNode | null }>(GET_POST, { id: params.id }, { authenticated: true });
      if (!current.post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
      updated = current.post;
    }
    return NextResponse.json({ post: mapWpPost(updated) });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const DELETE_POST = `
  mutation DeleteExistingPost($id: ID!) {
    deletePost(input: { id: $id, forceDelete: false }) {
      deletedId
    }
  }
`;

export async function DELETE(_request: Request, { params }: Params) {
  const gate = await requirePerm("posts.write");
  if (gate instanceof NextResponse) return gate;
  try {
    const denied = await ownershipGate(gate, params.id);
    if (denied) return denied;
    await wpGraphQL<{ deletePost: { deletedId: string } }>(
      DELETE_POST,
      { id: params.id },
      { authenticated: true },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
