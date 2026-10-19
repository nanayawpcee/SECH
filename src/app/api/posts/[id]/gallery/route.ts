import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import { GALLERY_MAX, POST_GALLERY_QUERY, SET_POST_GALLERY } from "@/lib/wp-posts";

export const dynamic = "force-dynamic";

type Photo = { databaseId: number; sourceUrl: string | null };

function idFrom(params: { id: string }) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** WordPress hasn't got plugin 1.9.0 yet. */
function missingPlugin(error: unknown) {
  return error instanceof WpGraphQLError && /galleryImages|setPostGallery/.test(error.message)
    && /Cannot query field|Unknown|not exist/i.test(error.message);
}

/** The post's gallery, for the editor. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requirePerm("posts.write");
  if (gate instanceof NextResponse) return gate;
  const id = idFrom(params);
  if (!id) return NextResponse.json({ error: "No such post." }, { status: 400 });
  try {
    const data = await wpGraphQL<{ post: { galleryImages: Photo[] | null } | null }>(
      POST_GALLERY_QUERY,
      { id: String(id) },
      { authenticated: true },
    );
    return NextResponse.json({ images: data.post?.galleryImages ?? [] });
  } catch (error) {
    if (missingPlugin(error)) return NextResponse.json({ images: [], needsPlugin: true });
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/** Replace the gallery with these media ids, in order. WordPress checks the author may edit this post. */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const gate = await requirePerm("posts.write");
  if (gate instanceof NextResponse) return gate;
  const id = idFrom(params);
  const body = await request.json().catch(() => null);
  const ids: unknown = body?.mediaIds;
  if (!id || !Array.isArray(ids) || !ids.every((m) => Number.isInteger(m) && m > 0)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (ids.length > GALLERY_MAX) {
    return NextResponse.json({ error: `A gallery can hold up to ${GALLERY_MAX} photos.` }, { status: 400 });
  }
  try {
    const data = await wpGraphQL<{ setPostGallery: { images: Photo[] | null } }>(
      SET_POST_GALLERY,
      { postId: id, mediaIds: ids },
      { authenticated: true },
    );
    revalidatePath("/news/[slug]", "page");
    return NextResponse.json({ images: data.setPostGallery.images ?? [] });
  } catch (error) {
    if (missingPlugin(error)) {
      return NextResponse.json({ error: "WordPress needs the SECH Portal plugin version 1.9.0 to save photo galleries." }, { status: 409 });
    }
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}
