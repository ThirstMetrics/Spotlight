import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import type { ApiResponse } from "@spotlight/shared";

export async function GET(request: Request): Promise<NextResponse<ApiResponse<{ user: ReturnType<typeof Object> }>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: { user } });
}
