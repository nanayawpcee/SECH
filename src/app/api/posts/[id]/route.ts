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

const UPDATE_POST = `
  mutation UpdateExistingPost(
    $id: ID!
    $title: String
    $content: String
    $excerpt: String
    $status: PostStatusEnum
    $categoryName: String
    $commentStatus: String
  ) {
    updatePost(
      input: {
        id: $id
        title: $title
        content: $content
        excerpt: $excerpt
        status: $status
        categories: { append: false, nodes: [{ name: $categoryName }] }
        commentStatus: $commentStatus
      }
    ) {
      post { ${POST_FIELDS} }
    }
  }
`;

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

    const data = await wpGraphQL<{ updatePost: { post: WpPostNode } }>(
      UPDATE_POST,
      {
        id: params.id,
        title: patch.title !== undefined ? String(patch.title).trim() : undefined,
        content: patch.body ?? patch.content,
        excerpt: patch.excerpt,
        status:
          patch.status === undefined
            ? undefined
            : toWpStatus(allowedStatus(patch.status, gate.perms.includes("posts.publish"))),
        categoryName: patch.type,
        commentStatus:
          patch.commentsOpen === undefined
            ? undefined
            : patch.commentsOpen
              ? "open"
              : "closed",
      },
      { authenticated: true },
    );

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

    return NextResponse.json({ post: mapWpPost(data.updatePost.post) });
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
