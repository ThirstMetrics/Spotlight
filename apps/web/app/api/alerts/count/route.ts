import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUnreadAlertCount } from "@/lib/queries/alerts";

/**
 * GET /api/alerts/count
 * Returns the unread alert count for the header badge.
 */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const count = await getUnreadAlertCount();
  return NextResponse.json({ success: true, data: { count } });
}
