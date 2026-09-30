import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import {
  CLEAR_CURRENT_NEWSLETTER,
  NEWSLETTER_ADMIN_QUERY,
  SET_CURRENT_NEWSLETTER,
  isMissingIssuePlugin,
  type NewsletterIssue,
  type NewsletterPdf,
} from "@/lib/wp-newsletter";

export const dynamic = "force-dynamic";

/** The current downloadable issue plus the PDFs it could be switched to. Administrators only. */
export async function GET() {
  const gate = await requirePerm("newsletter");
  if (gate instanceof NextResponse) return gate;
  try {
    const data = await wpGraphQL<{ currentNewsletter: NewsletterIssue | null; newsletterPdfs: NewsletterPdf[] | null }>(
      NEWSLETTER_ADMIN_QUERY,
      {},
      { authenticated: true },
    );
    return NextResponse.json({ current: data.currentNewsletter, pdfs: data.newsletterPdfs ?? [] });
  } catch (error) {
    if (error instanceof WpGraphQLError && isMissingIssuePlugin(error.message)) {
      return NextResponse.json({ current: null, pdfs: [], needsPlugin: true });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/** Make a PDF from the Media Library the current issue. */
export async function PUT(request: Request) {
  const gate = await requirePerm("newsletter");
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => ({}));
  const attachmentId = Number(body.attachmentId);
  const title = String(body.title ?? "").trim().slice(0, 120);
  const issue = String(body.issue ?? "").trim().slice(0, 80);
  if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
    return NextResponse.json({ error: "Choose or upload a PDF first." }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: "Give the newsletter a title." }, { status: 400 });
  try {
    const data = await wpGraphQL<{ setCurrentNewsletter: { newsletter: NewsletterIssue } }>(
      SET_CURRENT_NEWSLETTER,
      { attachmentId, title, issue: issue || null },
      { authenticated: true },
    );
    // The download link lives in the footer on every public page.
    revalidatePath("/", "layout");
    return NextResponse.json({ current: data.setCurrentNewsletter.newsletter });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}

/** Stop offering a download (the PDF itself stays in the Media Library). */
export async function DELETE() {
  const gate = await requirePerm("newsletter");
  if (gate instanceof NextResponse) return gate;
  try {
    await wpGraphQL(CLEAR_CURRENT_NEWSLETTER, {}, { authenticated: true });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
