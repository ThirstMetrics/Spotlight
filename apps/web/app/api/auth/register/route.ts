import { NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { prisma } from "@spotlight/db";
import type { ApiResponse } from "@spotlight/shared";

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate password length
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = hashSync(password, 12);

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message:
            "Registration successful. An admin will assign your role. You can now sign in.",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
