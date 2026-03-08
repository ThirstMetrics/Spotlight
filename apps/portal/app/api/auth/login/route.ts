import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { compareSync } from "bcryptjs";
import { prisma } from "@spotlight/db";

interface PortalLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    distributorId?: string;
    supplierId?: string;
  };
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret)
    throw new Error("JWT_SECRET environment variable is not configured");
  return new TextEncoder().encode(secret);
}

const ALLOWED_ROLES = ["DISTRIBUTOR", "SUPPLIER"];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Look up user with their role assignments
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase().trim() },
      include: {
        userRoles: {
          include: { role: true },
          take: 1,
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    if (user.passwordHash) {
      const valid = compareSync(body.password, user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }
    }

    const assignment = user.userRoles[0];
    const roleName = assignment?.role?.name ?? "ADMIN";

    // Portal is only for distributors and suppliers
    if (!ALLOWED_ROLES.includes(roleName)) {
      return NextResponse.json(
        {
          success: false,
          error: "Portal access is for distributors and suppliers only",
        },
        { status: 403 }
      );
    }

    // Gather scope from all role assignments
    const allAssignments = await prisma.userRoleAssignment.findMany({
      where: { userId: user.id },
      select: {
        distributorId: true,
        supplierId: true,
      },
    });

    const distributorId = allAssignments.find(
      (a) => a.distributorId
    )?.distributorId;
    const supplierId = allAssignments.find((a) => a.supplierId)?.supplierId;

    // Sign JWT
    const secret = getJwtSecret();
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: roleName,
      distributorId,
      supplierId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // Record last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: PortalLoginResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleName,
        distributorId: distributorId ?? undefined,
        supplierId: supplierId ?? undefined,
      },
    };

    const response = NextResponse.json(
      { success: true, data: payload },
      { status: 200 }
    );

    // Also set cookie for SSR routes if needed
    response.cookies.set("spotlight_portal_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("Portal login error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
