import { NextResponse } from "next/server";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const SET_STATUS = `
  mutation SetBookingStatus($databaseId: Int!, $status: String!) {
    updateBookingStatus(input: { databaseId: $databaseId, status: $status }) {
      databaseId
      bookingStatus
    }
  }
`;

const ALLOWED = ["pending", "confirmed", "cancelled"];

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { status } = await request.json();

    if (!ALLOWED.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${ALLOWED.join(", ")}.` },
        { status: 400 },
      );
    }

    const databaseId = Number(params.id);
    if (!Number.isInteger(databaseId) || databaseId <= 0) {
      return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
    }

    const data = await wpGraphQL<{
      updateBookingStatus: { databaseId: number; bookingStatus: string };
    }>(SET_STATUS, { databaseId, status }, { authenticated: true });

    return NextResponse.json({
      databaseId: data.updateBookingStatus.databaseId,
      status: data.updateBookingStatus.bookingStatus,
    });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
