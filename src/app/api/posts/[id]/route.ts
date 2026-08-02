import { NextResponse } from "next/server";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { POST_FIELDS, mapWpPost, SET_FEATURED_IMAGE, type WpPostNode } from "@/lib/wp-posts";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const GET_POST = `
  query AdminPost($id: ID!) {
    post(id: $id, idType: DATABASE_ID) { ${POST_FIELDS} }
  }
`;

export async function GET(_request: Request, { params }: Params) {
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
  ) {
    updatePost(
      input: {
        id: $id
        title: $title
        content: $content
        excerpt: $excerpt
        status: $status
        categories: { append: false, nodes: [{ name: $categoryName }] }
      }
    ) {
      post { ${POST_FIELDS} }
    }
  }
`;

/** Partial update — only the fields present in the body are sent on. */
export async function PATCH(request: Request, { params }: Params) {
  try {
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
            : patch.status === "published"
              ? "PUBLISH"
              : patch.status === "scheduled"
                ? "FUTURE"
                : "DRAFT",
        categoryName: patch.type,
      },
      { authenticated: true },
    );

    // undefined = leave alone; null = clear; number = set.
    if (patch.featuredImageId !== undefined) {
      await wpGraphQL(
        SET_FEATURED_IMAGE,
        {
          postId: Number(params.id),
          mediaId: patch.featuredImageId === null ? null : Number(patch.featuredImageId),
        },
        { authenticated: true },
      );
      // Re-read so the response carries the new image rather than the stale one.
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

/** Moves the post to the WordPress trash rather than destroying it. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
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
