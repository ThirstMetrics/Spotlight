import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hashSync } from "bcryptjs";
import { prisma } from "@spotlight/db";
import type { ApiResponse } from "@spotlight/shared";

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user) {
      // Generate a temporary password
      const tempPassword = randomUUID().slice(0, 12);
      const passwordHash = hashSync(tempPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // In production, this would send an email with the temp password
      console.log(
        `[Password Reset] Temporary password for ${user.email}: ${tempPassword}`
      );
    }

    // Always return generic success to avoid revealing whether email exists
    return NextResponse.json(
      {
        success: true,
        data: {
          message:
            "If an account exists with that email, you will receive reset instructions shortly.",
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Password reset error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
