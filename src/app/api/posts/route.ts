import { NextResponse } from "next/server";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { POST_FIELDS, mapWpPost, SET_FEATURED_IMAGE, type WpPostNode } from "@/lib/wp-posts";

export const dynamic = "force-dynamic";

// `stati` must be spelled out. With no status (or `status: null`) WPGraphQL
// falls back to published posts only, so drafts — including everything saved
// from the editor as a draft — silently never reached the admin table. WordPress
// still drops any status the signed-in user is not allowed to read.
const LIST_POSTS = `
  query AdminPosts($first: Int!) {
    posts(
      first: $first
      where: {
        stati: [PUBLISH, DRAFT, FUTURE, PENDING, PRIVATE]
        orderby: { field: DATE, order: DESC }
      }
    ) {
      nodes { ${POST_FIELDS} }
    }
  }
`;

/** List posts for the admin table. Includes drafts, so it needs the JWT. */
export async function GET() {
  try {
    const data = await wpGraphQL<{ posts: { nodes: WpPostNode[] } }>(
      LIST_POSTS,
      { first: 100 },
      { authenticated: true },
    );
    return NextResponse.json({ posts: (data.posts?.nodes ?? []).map(mapWpPost) });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const CREATE_POST = `
  mutation CreateNewPost(
    $title: String!
    $content: String
    $excerpt: String
    $status: PostStatusEnum!
    $categoryName: String!
    $commentStatus: String
  ) {
    createPost(
      input: {
        title: $title
        content: $content
        excerpt: $excerpt
        status: $status
        categories: { nodes: [{ name: $categoryName }] }
        commentStatus: $commentStatus
      }
    ) {
      post { databaseId slug status }
    }
  }
`;

export async function POST(request: Request) {
  try {
    const { title, content, excerpt, status, type, featuredImageId, commentsOpen } =
      await request.json();

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "A title is required." }, { status: 400 });
    }

    const data = await wpGraphQL<{
      createPost: { post: { databaseId: number; slug: string; status: string } };
    }>(
      CREATE_POST,
      {
        title: String(title).trim(),
        content: content ?? "",
        excerpt: excerpt ?? "",
        status: status === "published" ? "PUBLISH" : "DRAFT",
        categoryName: type || "news",
        // Default to open when the caller says nothing, matching WordPress.
        commentStatus: commentsOpen === false ? "closed" : "open",
      },
      { authenticated: true },
    );

    const created = data.createPost.post;

    // WPGraphQL's CreatePostInput has no featuredImageId on this site, so the
    // thumbnail is attached in a second call via the portal plugin.
    if (featuredImageId) {
      try {
        await wpGraphQL(
          SET_FEATURED_IMAGE,
          { postId: created.databaseId, mediaId: Number(featuredImageId) },
          { authenticated: true },
        );
      } catch (imageError) {
        // The post itself saved — report the partial success rather than
        // failing the whole operation and stranding the author's work.
        return NextResponse.json({
          success: true,
          post: created,
          warning:
            "The post was saved, but its featured image could not be attached.",
        });
      }
    }

    return NextResponse.json({ success: true, post: created });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
