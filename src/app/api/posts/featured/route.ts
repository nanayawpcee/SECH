import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";

export const dynamic = "force-dynamic";

const isOldPlugin = (e: unknown) => e instanceof WpGraphQLError && /featuredPostId|setFeaturedPost/.test(e.message);

export async function GET() {
  const gate = await requirePerm("posts.write");
  if (gate instanceof NextResponse) return gate;
  try {
    const data = await wpGraphQL<{ featuredPostId: number | null }>(`query { featuredPostId }`, {}, { authenticated: true });
    return NextResponse.json({ featuredPostId: data.featuredPostId ?? null });
  } catch (error) {
    if (isOldPlugin(error)) return NextResponse.json({ featuredPostId: null, needsPlugin: true });
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

// { postId } to feature a story, { postId: null } to go back to the newest
export async function PUT(request: Request) {
  const gate = await requirePerm("posts.editOthers");
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  const postId = Number(body?.postId) > 0 ? Number(body.postId) : 0;
  try {
    const data = await wpGraphQL<{ setFeaturedPost: { featuredPostId: number | null } }>(
      `mutation SetFeatured($postId: Int) { setFeaturedPost(input: { postId: $postId }) { featuredPostId } }`,
      { postId },
      { authenticated: true },
    );
    revalidatePath("/news");
    return NextResponse.json({ featuredPostId: data.setFeaturedPost.featuredPostId ?? null });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}
